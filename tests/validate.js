// tests/validate.js: stress-tests the question engine outside the browser.
// Run: node tests/validate.js [rounds]
// Loads questions.js, rw-bank.js and math-gen.js into one context, then:
//  - generates `rounds` questions for every math subtype at every supported difficulty and
//    checks each one with validateQuestion(); reports rejection rates and any generator that
//    cannot produce a valid question;
//  - validates every Reading and Writing bank item;
//  - checks the taxonomy, answer-position balance and duplicate items.
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = { console, Math, Date, JSON, String, Number, Set, Object, Array };
vm.createContext(ctx);
for (const f of ["questions.js", "rw-bank.js", "math-gen.js"]) {
  if (fs.existsSync(path.join(root, f))) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
}
const rounds = +process.argv[2] || 300;
const r = vm.runInContext(`(() => {
  const out = { math: [], rw: [], fail: [], letters: [0,0,0,0], samples: {} };
  for (const [sub, g] of Object.entries(MATH_GEN)) {
    for (const d of g.diffs) {
      let ok = 0, nul = 0, bad = 0, reasons = {};
      for (let i = 0; i < ${rounds}; i++) {
        let spec; try { spec = g.gen(d); } catch (e) { bad++; reasons["THROW " + e.message] = (reasons["THROW " + e.message]||0)+1; continue; }
        if (!spec) { nul++; continue; }
        spec.skill = g.skill; spec.sub = sub; spec.diff = d;
        const q = buildQuestion(spec);
        const p = validateQuestion(q);
        if (p.length) { bad++; p.forEach(x => reasons[x] = (reasons[x]||0)+1); if (!out.samples[sub+d]) out.samples[sub+d] = {q, p}; }
        else { ok++; out.letters[q.answer]++; }
      }
      out.math.push({ sub, d, ok, nul, bad, reasons });
    }
  }
  const ids = new Set(), stems = new Set();
  for (const it of RW_BANK.concat(LEGACY_RW)) {
    const q = buildQuestion(it); const p = validateQuestion(q);
    if (ids.has(it.id)) p.push("duplicate id"); ids.add(it.id);
    const key = (it.passage||"") + it.stem; if (stems.has(key) && !it.stem.startsWith("Which choice completes")) p.push("duplicate passage+stem");
    stems.add(key);
    if (p.length) out.fail.push({ id: it.id, p });
    out.rw.push({ id: it.id, skill: it.skill, sub: it.sub, diff: it.diff, legacy: !!it.legacy });
  }
  // taxonomy coverage
  out.coverage = SKILLS.map(s => ({ skill: s.id, dom: s.dom, subs: s.subs.map(x => x[0]).map(sub => ({ sub,
      math: MATH_GEN[sub] ? MATH_GEN[sub].diffs : [],
      rw: [...new Set(RW_BANK.filter(i => i.skill === s.id && i.sub === sub).map(i => i.diff))] })) }));
  // end-to-end: makeQuestion for every skill and difficulty
  out.e2e = [];
  for (const s of SKILLS) for (const d of DIFFS) {
    const q = makeQuestion({ skill: s.id, diff: d });
    out.e2e.push({ skill: s.id, d, got: q ? q.diff : null });
  }
  out.QA = QA;
  return JSON.stringify(out);
})()`, ctx);
const o = JSON.parse(r);
let total = 0, totalBad = 0, dead = [];
console.log("MATH GENERATORS (" + rounds + " attempts each)");
for (const m of o.math) {
  total += m.ok + m.bad; totalBad += m.bad;
  const rate = m.ok / rounds;
  if (m.ok === 0) dead.push(m.sub + "/" + m.d);
  const flag = m.bad ? "  <-- " + JSON.stringify(m.reasons) : "";
  if (m.bad || rate < 0.5) console.log(`  ${m.sub.padEnd(18)} ${m.d.padEnd(7)} valid ${m.ok}  regen ${m.nul}  rejected ${m.bad}${flag}`);
}
console.log(`  ${o.math.length} subtype/difficulty pairs; ${total} built; ${totalBad} rejected by validator (${(100 * totalBad / Math.max(total, 1)).toFixed(2)}%)`);
console.log("  correct-answer position A/B/C/D:", o.letters.join(" / "));
if (dead.length) console.log("  DEAD GENERATORS:", dead.join(", "));
for (const [k, v] of Object.entries(o.samples).slice(0, 6)) console.log("  SAMPLE REJECT", k, v.p, "\n   ", v.q.stem.slice(0, 160), "\n   ", v.q.choices, v.q.okFlags);
console.log("\nREADING AND WRITING BANK: " + o.rw.filter(x => !x.legacy).length + " new items, " + o.rw.filter(x => x.legacy).length + " legacy items");
console.log("  by difficulty:", ["easy", "medium", "hard"].map(d => d + " " + o.rw.filter(x => !x.legacy && x.diff === d).length).join(", "));
if (o.fail.length) { console.log("  FAILURES:"); o.fail.forEach(f => console.log("   ", f.id, f.p)); } else console.log("  all items pass validation");
console.log("\nCOVERAGE (subtypes with no content):");
const missing = [];
for (const s of o.coverage) for (const x of s.subs) if (!x.math.length && !x.rw.length) missing.push(s.skill + "/" + x.sub);
console.log("  " + (missing.length ? missing.join(", ") : "none"));
const e2eMiss = o.e2e.filter(x => !x.got);
console.log("\nEND-TO-END makeQuestion: " + (o.e2e.length - e2eMiss.length) + "/" + o.e2e.length + " skill x difficulty requests returned a question");
const offDiff = o.e2e.filter(x => x.got && x.got !== x.d).map(x => x.skill + ":" + x.d + "->" + x.got);
if (offDiff.length) console.log("  served nearest difficulty instead:", offDiff.join(", "));
process.exitCode = (dead.length || o.fail.length || e2eMiss.length) ? 1 : 0;
