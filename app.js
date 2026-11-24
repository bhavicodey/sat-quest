// app.js: SAT Quest main app (screens, levels, practice lab, analytics, Google sign-in)
// Question content and validation live in questions.js, rw-bank.js and math-gen.js.

// >>> Paste your Google OAuth Web Client ID here. Leave as-is to use guest mode only.
const GOOGLE_CLIENT_ID = "54844873818-fk2mm0gqvatc25pcaf18qf3lb8j1ddt6.apps.googleusercontent.com";

const TOTAL_LEVELS = 100;
const POINTS_PER_LEVEL = 12;   // 400 -> 1600 is 1200 points spread over 100 levels
const PASS_ACCURACY = 0.6;
// Each 10-level unit focuses on official domains (null = all domains).
const UNITS = [
  { name: "Orientation",                  domains: null },
  { name: "Information and Ideas",        domains: ["ii"] },
  { name: "Standard English Conventions", domains: ["sec"] },
  { name: "Algebra",                      domains: ["alg"] },
  { name: "Advanced Math",                domains: ["adv"] },
  { name: "Problem-Solving and Data",     domains: ["psda"] },
  { name: "Geometry and Trigonometry",    domains: ["geo"] },
  { name: "Craft, Structure, Expression", domains: ["cs", "eoi"] },
  { name: "Advanced Math II",             domains: ["adv", "alg"] },
  { name: "Final Assessment",             domains: null },
];

const $ = s => document.querySelector(s);
const app = $("#app");
const modal = $("#modal");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- storage (wrapped: localStorage can throw in private windows) ----------
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} },
  del(key) { try { localStorage.removeItem(key); } catch (e) {} }
};

let session = store.get("satquest:session", null);  // {name, sub, picture}
let profile = null;                                  // see loadProfile()
let S = null;                                        // active session (level or practice)
let timerId = null;

const profileKey = () => "satquest:profile:" + (session ? session.sub : "guest");
function loadProfile() {
  profile = store.get(profileKey(), null);
  if (!profile) return;
  // Additive migration: older profiles keep every existing field (including the original
  // per-type stats in profile.stats); new tracking fields are added alongside.
  profile.sk = profile.sk || {};       // per official skill {c, t, s(seconds)}
  profile.sb = profile.sb || {};       // per subtype
  profile.df = profile.df || {};       // per difficulty
  profile.recent = profile.recent || [];
  profile.sessions = profile.sessions || [];
}
function saveProfile() { store.set(profileKey(), profile); }

// ---------- small UI helpers ----------
const BRAND = `<div class="brand"><span class="mark" aria-hidden="true"></span><span class="kry">KRYLLION</span><span class="sep">/</span><span class="sq">SAT QUEST</span></div>`;
function openModal(html) { modal.innerHTML = `<div class="card">${html}</div>`; modal.classList.remove("hidden"); }
function closeModal() { modal.classList.add("hidden"); modal.innerHTML = ""; }
modal.onclick = e => { if (e.target === modal) closeModal(); };
const pct = (c, t) => (t ? Math.round((c / t) * 100) : 0);
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, "0")}`;
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }

// ---------- auth ----------
// Decodes the Google ID token on the client for display only. A real backend must verify it.
function decodeJwt(token) {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
function handleGoogle(resp) {
  const p = decodeJwt(resp.credential);
  signIn({ name: p.given_name || p.name || "Player", sub: p.sub, picture: p.picture || "" });
}
function initGoogle() {
  const el = $("#gbtn");
  const configured = GOOGLE_CLIENT_ID.indexOf("PASTE_") !== 0;
  if (!el || !configured || !(window.google && google.accounts)) return;
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogle });
  google.accounts.id.renderButton(el, { theme: "filled_black", size: "large", shape: "pill", text: "continue_with", width: 260 });
}
window.initGoogle = initGoogle;

function signIn(user) {
  session = user;
  store.set("satquest:session", session);
  loadProfile();
  if (profile) renderMap(); else renderOnboarding();
}
function signOut() {
  stopTimer();
  store.del("satquest:session");
  session = null; profile = null;
  renderAuth();
}

// ---------- screens ----------
function renderAuth() {
  app.innerHTML = `
  <div class="screen">
    <div class="hero" style="margin-top:56px">
      ${BRAND}
      <h1 class="title">SAT Quest</h1>
      <p class="muted lead">Digital SAT preparation built on the College Board's official domains and skills. Every question is checked before you see it.</p>
    </div>
    <div class="card enter" style="--d:.2s;margin-top:28px;display:grid;gap:14px;justify-items:center">
      <div id="gbtn"></div>
      <button class="btn alt" id="guest">Continue as guest</button>
      <p class="muted small" style="text-align:center;margin:0">Guest progress stays on this device.</p>
    </div>
    <div class="spec enter" style="--d:.3s">
      <div><b>${SKILLS.length}</b><span>official skills</span></div>
      <div><b>${SKILLS.reduce((n, s) => n + s.subs.length, 0)}</b><span>question types</span></div>
      <div><b>3</b><span>difficulty levels</span></div>
    </div>
  </div>`;
  $("#guest").onclick = () => signIn({ name: "Guest", sub: "guest", picture: "" });
  initGoogle();
}

function renderOnboarding() {
  app.innerHTML = `
  <div class="screen">
    <div class="hero enter" style="margin-top:28px">
      ${BRAND}
      <h2 class="h2">Welcome, ${esc(session.name)}. Set your goal.</h2>
    </div>
    <div class="card enter" style="--d:.15s;margin-top:18px">
      <div class="label">Current score</div>
      <div class="big" id="startVal"></div>
      <input type="range" id="start" min="400" max="1600" step="10" value="1000">
      <div class="label" style="margin-top:20px">Target score</div>
      <div class="big" id="targetVal"></div>
      <input type="range" id="target" min="400" max="1600" step="10" value="1400">
      <p class="muted" id="plan" style="text-align:center;margin:6px 0 0"></p>
    </div>
    <button class="btn enter" style="--d:.3s;margin-top:18px" id="go">Begin</button>
  </div>`;

  const s = $("#start"), t = $("#target"), go = $("#go");
  const refresh = () => {
    const start = +s.value, target = +t.value, ok = target > start;
    $("#startVal").textContent = start;
    $("#targetVal").textContent = target;
    const levels = Math.ceil((target - start) / POINTS_PER_LEVEL);
    $("#plan").textContent = ok
      ? `About ${levels} levels to go. One level a day gets you there in about ${levels} days.`
      : "Your target needs to be higher than your current score.";
    go.disabled = !ok;
  };
  s.oninput = refresh; t.oninput = refresh; refresh();
  go.onclick = () => {
    profile = { start: +s.value, target: +t.value, done: {}, stats: {}, xp: 0, streak: 0, lastDay: null };
    saveProfile(); loadProfile();
    renderMap();
  };
}

const levelsDone = () => Object.keys(profile.done).length;
const projected = () => Math.min(profile.target, profile.start + POINTS_PER_LEVEL * levelsDone());
function levelState(n) {
  if (profile.done[n]) return "done";
  if (n === 1 || profile.done[n - 1]) return "open";
  return "locked";
}
function nextLevel() {
  for (let n = 1; n <= TOTAL_LEVELS; n++) if (!profile.done[n]) return n;
  return TOTAL_LEVELS;
}

// Progress ring: circumference of r=48
const RING_C = 2 * Math.PI * 48;
function ringHTML(p, label) {
  const off = RING_C * (1 - Math.min(p, 100) / 100);
  return `<div class="ring">
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle class="track" cx="55" cy="55" r="48" fill="none" stroke-width="6"/>
      <circle class="orbit" cx="55" cy="55" r="40" fill="none" stroke-width="1"/>
      <circle class="val" cx="55" cy="55" r="48" fill="none" stroke-width="6"
        stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}" data-to="${off}"/>
    </svg>
    <div class="num">${label}</div>
  </div>`;
}

function topbar() {
  return `<div class="topbar">
    ${BRAND}
    <div class="tb-right">
      <span class="pill" title="Day streak">Streak ${profile.streak}</span>
      <span class="pill" title="Experience points">${profile.xp} XP</span>
      <button class="pill" id="outBtn">Sign out</button>
    </div>
  </div>`;
}

function renderMap() {
  stopTimer();
  const done = levelsDone();
  const next = nextLevel();
  let path = "";
  for (let n = 1; n <= TOTAL_LEVELS; n++) {
    if ((n - 1) % 10 === 0) {
      const u = (n - 1) / 10;
      path += `<div class="unit"><span>Unit ${String(u + 1).padStart(2, "0")}</span>${UNITS[u].name}</div>`;
    }
    const st = levelState(n), boss = n % 10 === 0, stars = profile.done[n] || 0;
    const x = Math.round(Math.sin(n * 0.8) * 70);
    const label = st === "locked" ? "" : (boss ? "◆" : n);
    const delay = Math.min((n - 1) % 10, 9) * 0.04;
    const you = n === next ? `<span class="you">NEXT</span>` : "";
    path += `<button class="node ${st}${boss ? " boss" : ""}" data-n="${n}" aria-label="Level ${n}${boss ? " (unit assessment)" : ""}${st === "locked" ? ", locked" : ""}" style="transform:translateX(${x}px);--d:${delay}s" ${st === "locked" ? "disabled" : ""}>${you}${label}${stars ? `<span class="stars">${"★".repeat(stars)}</span>` : ""}</button>`;
  }

  app.innerHTML = `
  <div class="screen">
    ${topbar()}
    <div class="card enter" style="margin-top:16px;display:flex;gap:16px;align-items:center">
      ${ringHTML(done, `${done}%`)}
      <div style="flex:1;min-width:0">
        <div class="label">Goal</div>
        <div class="goal">${profile.start} → ${profile.target}</div>
        <div class="muted small" style="margin-top:6px">${done}/${TOTAL_LEVELS} levels · Progress estimate <b class="hl">${projected()}</b></div>
        <div class="muted tiny" style="margin-top:4px">The progress estimate tracks completed levels. It is not an official or predicted College Board score.</div>
      </div>
    </div>
    <div class="actions enter" style="--d:.1s">
      <button class="btn" id="contBtn">Continue · Level ${next}</button>
      <div class="row2">
        <button class="btn ghost" id="labBtn">Practice lab</button>
        <button class="btn ghost" id="skillsBtn">Analytics</button>
      </div>
    </div>
    <div class="path">${path}</div>
  </div>`;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const c = app.querySelector(".ring .val");
    if (c) c.style.strokeDashoffset = c.dataset.to;
  }));
  app.querySelectorAll(".node").forEach(b => b.onclick = () => startLevel(+b.dataset.n));
  $("#contBtn").onclick = () => startLevel(next);
  $("#labBtn").onclick = renderLab;
  $("#skillsBtn").onclick = renderAnalytics;
  $("#outBtn").onclick = signOut;
}

// ---------- analytics ----------
function bar(c, t, i) {
  const p = pct(c, t);
  return `<div class="bar" role="img" aria-label="${t ? p + "% correct" : "no data"}"><i style="width:${p}%;transition-delay:${i * 0.02}s"></i></div>`;
}
function renderAnalytics() {
  stopTimer();
  const secBlocks = Object.entries(SECTIONS).map(([sec, secName]) => {
    const doms = DOMAINS.filter(d => d.sec === sec).map(d => {
      const skills = SKILLS.filter(s => s.dom === d.id);
      const agg = skills.reduce((a, s) => { const v = profile.sk[s.id] || {}; a.c += v.c || 0; a.t += v.t || 0; return a; }, { c: 0, t: 0 });
      const rows = skills.map((s, i) => {
        const v = profile.sk[s.id] || { c: 0, t: 0 };
        return `<div class="skill"><span>${esc(s.name)}</span><span class="mono">${v.t ? pct(v.c, v.t) + "% · " + v.t : "—"}</span></div>${bar(v.c, v.t, i)}`;
      }).join("");
      return `<details class="dom"><summary><span>${esc(d.name)}</span><span class="mono">${agg.t ? pct(agg.c, agg.t) + "% · " + agg.t + " answered" : "no data yet"}</span></summary>${rows}</details>`;
    }).join("");
    return `<div class="label" style="margin-top:18px">${secName}</div>${doms}`;
  }).join("");
  const diffRows = DIFFS.map((d, i) => { const v = profile.df[d] || { c: 0, t: 0 };
    return `<div class="skill"><span>${DIFF_NAME[d]}</span><span class="mono">${v.t ? pct(v.c, v.t) + "% · " + v.t : "—"}</span></div>${bar(v.c, v.t, i)}`; }).join("");
  const weak = weakestSkills(3);
  app.innerHTML = `
  <div class="screen">
    ${topbar()}
    <div class="card enter" style="margin-top:16px">
      <div class="label">Analytics</div>
      <h2 class="h2" style="margin:4px 0 6px">Accuracy by official domain and skill</h2>
      <p class="muted small" style="margin:0">Percent correct and number of questions answered. Tap a domain to see its skills.</p>
      ${secBlocks}
      <div class="label" style="margin-top:18px">By difficulty</div>
      ${diffRows}
      <div class="label" style="margin-top:18px">Focus areas</div>
      <p class="small" style="margin:6px 0 0">${weak.length ? weak.map(s => esc(s.name) + ` (${pct(profile.sk[s.id].c, profile.sk[s.id].t)}%)`).join("; ") : "Answer at least 3 questions in a skill to see focus areas."}</p>
    </div>
    <div class="actions"><button class="btn ghost" id="back">Back to map</button></div>
  </div>`;
  $("#back").onclick = renderMap;
  $("#outBtn").onclick = signOut;
  requestAnimationFrame(() => app.querySelectorAll(".bar>i").forEach(i => { const w = i.style.width; i.style.width = "0"; requestAnimationFrame(() => (i.style.width = w)); }));
}
// Skills with at least 3 answers, lowest accuracy first.
function weakestSkills(n) {
  return SKILLS.filter(s => (profile.sk[s.id] || {}).t >= 3)
    .sort((a, b) => profile.sk[a.id].c / profile.sk[a.id].t - profile.sk[b.id].c / profile.sk[b.id].t)
    .slice(0, n);
}

// ---------- practice lab ----------
function renderLab() {
  stopTimer();
  const last = store.get("satquest:lab", { sec: "", domain: "", skill: "", sub: "", diff: "adaptive", count: 10, timed: false });
  const opt = (v, label, sel) => `<option value="${esc(v)}"${sel === v ? " selected" : ""}>${esc(label)}</option>`;
  app.innerHTML = `
  <div class="screen">
    ${topbar()}
    <div class="card enter" style="margin-top:16px">
      <div class="label">Practice lab</div>
      <h2 class="h2" style="margin:4px 0 14px">Build a practice set</h2>
      <div class="presets">
        <button class="chipbtn" data-preset="mixed">Mixed review</button>
        <button class="chipbtn" data-preset="weak">Target weak skills</button>
        <button class="chipbtn" data-preset="module-rw">Timed R&amp;W set</button>
        <button class="chipbtn" data-preset="module-math">Timed Math set</button>
      </div>
      <div class="form">
        <label>Section<select id="fSec">${opt("", "All sections", last.sec)}${Object.entries(SECTIONS).map(([k, v]) => opt(k, v, last.sec)).join("")}</select></label>
        <label>Domain<select id="fDom"></select></label>
        <label>Skill<select id="fSkill"></select></label>
        <label>Question type<select id="fSub"></select></label>
        <label>Difficulty<select id="fDiff">${opt("adaptive", "Adaptive (adjusts to you)", last.diff)}${opt("mixed", "Mixed", last.diff)}${DIFFS.map(d => opt(d, DIFF_NAME[d], last.diff)).join("")}</select></label>
        <label>Questions<select id="fCount">${[5, 10, 15, 20, 27].map(n => opt(String(n), String(n), String(last.count))).join("")}</select></label>
        <label class="check"><input type="checkbox" id="fTimed"${last.timed ? " checked" : ""}> Timed at Digital SAT pace (about 71 s per Reading and Writing question, 95 s per Math question)</label>
      </div>
      <p class="muted small" id="avail" style="margin:12px 0 0"></p>
    </div>
    <div class="actions">
      <button class="btn" id="startLab">Start practice</button>
      <button class="btn ghost" id="back">Back to map</button>
    </div>
  </div>`;
  const fSec = $("#fSec"), fDom = $("#fDom"), fSkill = $("#fSkill"), fSub = $("#fSub");
  const fill = () => {
    const sec = fSec.value;
    const doms = DOMAINS.filter(d => !sec || d.sec === sec);
    if (!doms.some(d => d.id === fDom.value)) fDom.value = "";
    const dv = fDom.value || last.domain;
    fDom.innerHTML = opt("", "All domains", dv) + doms.map(d => opt(d.id, d.name, dv)).join("");
    const skills = SKILLS.filter(s => doms.some(d => d.id === s.dom) && (!fDom.value || s.dom === fDom.value));
    const sv = skills.some(s => s.id === (fSkill.value || last.skill)) ? (fSkill.value || last.skill) : "";
    fSkill.innerHTML = opt("", "All skills", sv) + skills.map(s => opt(s.id, s.name, sv)).join("");
    const sk = skillById(fSkill.value);
    const bv = sk && sk.subs.some(x => x[0] === (fSub.value || last.sub)) ? (fSub.value || last.sub) : "";
    fSub.innerHTML = opt("", sk ? "All question types" : "Choose a skill first", bv) + (sk ? sk.subs.map(x => opt(x[0], x[1], bv)).join("") : "");
    fSub.disabled = !sk;
    const f = labFilter();
    const srcs = sourcesFor(f);
    const nMath = srcs.filter(s => s.kind === "math").length, nRw = srcs.filter(s => s.kind === "rw").length;
    const rwItems = RW_BANK.concat(LEGACY_RW).filter(it => matchesFilter(it.skill, it.sub, f)).length;
    $("#avail").textContent = srcs.length
      ? `${nMath ? nMath + " math question type" + (nMath === 1 ? "" : "s") + " (new questions every time)" : ""}${nMath && nRw ? " and " : ""}${nRw ? rwItems + " Reading and Writing item" + (rwItems === 1 ? "" : "s") : ""} match these settings.`
      : "Nothing matches these settings.";
    $("#startLab").disabled = !srcs.length;
  };
  const labFilter = () => {
    const f = {};
    if (fSec.value) f.sec = fSec.value;
    if (fDom.value) f.domain = fDom.value;
    if (fSkill.value) f.skill = fSkill.value;
    if (fSub.value && !fSub.disabled) f.sub = fSub.value;
    return f;
  };
  fSec.onchange = () => { fDom.value = ""; fSkill.value = ""; fill(); };
  fDom.onchange = () => { fSkill.value = ""; fill(); };
  fSkill.onchange = () => { fSub.value = ""; fill(); };
  fSub.onchange = fill;
  fill();
  const go = (filter, diff, count, timed, label) => {
    store.set("satquest:lab", { sec: fSec.value, domain: fDom.value, skill: fSkill.value, sub: fSub.value, diff: $("#fDiff").value, count: +$("#fCount").value, timed: $("#fTimed").checked });
    startPractice({ filter, diff, count, timed, label });
  };
  $("#startLab").onclick = () => {
    const f = labFilter();
    const name = f.sub ? subtypeName(f.skill, f.sub) : f.skill ? skillById(f.skill).name : f.domain ? domainById(f.domain).name : f.sec ? SECTIONS[f.sec] : "Mixed practice";
    go(f, $("#fDiff").value, +$("#fCount").value, $("#fTimed").checked, name);
  };
  app.querySelectorAll("[data-preset]").forEach(b => b.onclick = () => {
    const p = b.dataset.preset;
    if (p === "mixed") return go({}, "mixed", 10, false, "Mixed review");
    if (p === "module-rw") return go({ sec: "rw" }, "adaptive", 27, true, "Timed Reading and Writing set");
    if (p === "module-math") return go({ sec: "math" }, "adaptive", 22, true, "Timed Math set");
    const weak = weakestSkills(3);
    if (!weak.length) {
      openModal(`<h3 style="margin-top:0">Not enough data yet</h3><p class="muted">Weak-skill practice uses your accuracy on each skill. Answer at least 3 questions in a few skills (for example, a Mixed review set), then try again.</p><button class="btn ghost" id="closeM">OK</button>`);
      $("#closeM").onclick = closeModal; return;
    }
    go({ skills: weak.map(s => s.id) }, "adaptive", 10, false, "Weak skills: " + weak.map(s => s.name).join(", "));
  });
  $("#back").onclick = renderMap;
  $("#outBtn").onclick = signOut;
}

// ---------- sessions (levels and practice share one engine) ----------
const recentSet = () => new Set(profile.recent);
function nextFromFilter(filter, diff) {
  if (filter.skills) {   // weak-skill practice: rotate through the chosen skills
    const sk = filter.skills[S ? S.qs.length % filter.skills.length : 0];
    return makeQuestion({ skill: sk, diff }, recentSet());
  }
  return makeQuestion({ ...filter, diff }, recentSet());
}
function levelDiff(n, j, boss) {
  const p = (n - 1) / 99, r = Math.random();
  const hard = boss ? 0.25 + 0.5 * p : 0.05 + 0.45 * p, easy = Math.max(0, 0.6 - 0.6 * p - (boss ? 0.2 : 0));
  return r < hard ? "hard" : r < hard + easy ? "easy" : "medium";
}
function startLevel(n) {
  const boss = n % 10 === 0, base = boss ? 10 : 8;
  const unit = UNITS[Math.floor((n - 1) / 10)];
  S = { mode: "level", n, boss, base, qs: [], log: [], i: 0, hearts: 3, correct: 0, attempts: 0, sel: null, answered: false, xpGain: 0 };
  for (let j = 0; j < base; j++) {
    // Most questions come from the unit's domains; two per level are mixed review.
    const f = unit.domains && j < base - 2 ? { domains: unit.domains } : {};
    const q = makeQuestion({ ...f, diff: levelDiff(n, j, boss) }, new Set([...profile.recent, ...S.qs.map(x => x.id)]));
    if (q) S.qs.push(q);
  }
  S.base = S.qs.length;
  renderQuestion();
}
function startPractice({ filter, diff, count, timed, label }) {
  S = { mode: "practice", filter, diff, count, timed, label, qs: [], log: [], i: 0, correct: 0, attempts: 0, sel: null, answered: false, xpGain: 0,
        adapt: { level: 1, streak: 0 }, started: Date.now() };
  const first = nextFromFilter(filter, currentDiff());
  if (!first) { openModal(`<p>No questions match those settings.</p><button class="btn ghost" id="closeM">OK</button>`); $("#closeM").onclick = closeModal; return; }
  S.qs.push(first);
  if (timed) {
    S.limit = 0; S.deadline = null;   // set after we know the section mix; estimate now
    const perQ = filter.sec === "math" ? 95 : filter.sec === "rw" ? 71 : 83;
    S.limit = perQ * count; S.deadline = Date.now() + S.limit * 1000;
  }
  renderQuestion();
}
function currentDiff() {
  if (!S || S.diff === "mixed") return pick(DIFFS);
  if (S.diff === "adaptive") return DIFFS[S.adapt.level];
  return S.diff;
}

// ---------- stimulus rendering ----------
function stimulusHTML(st) {
  if (!st) return "";
  if (st.kind === "table") {
    return `<figure class="stim">${st.title ? `<figcaption>${esc(st.title)}</figcaption>` : ""}<div class="tablewrap"><table>
      <thead><tr>${st.head.map(h => `<th>${fmt(h)}</th>`).join("")}</tr></thead>
      <tbody>${st.rows.map(r => `<tr>${r.map((c, i) => i === 0 ? `<th scope="row">${fmt(c)}</th>` : `<td>${fmt(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></figure>`;
  }
  if (st.kind === "scatter") {
    const W = 320, H = 220, P = 34;
    const xs = st.points.map(p => p[0]), ys = st.points.map(p => p[1]);
    const x0 = 0, x1 = Math.ceil(Math.max(...xs) + 1);
    const yLo = Math.min(...ys, st.line ? st.line[1] : Infinity), yHi = Math.max(...ys);
    const y0 = Math.max(0, Math.floor((yLo - 5) / 10) * 10), y1 = Math.ceil((yHi + 5) / 10) * 10;
    const sx = x => P + (x - x0) / (x1 - x0) * (W - P - 10), sy = y => H - P + 6 - (y - y0) / (y1 - y0) * (H - P - 4);
    let grid = "";
    for (let x = x0; x <= x1; x++) grid += `<line x1="${sx(x)}" y1="${sy(y0)}" x2="${sx(x)}" y2="${sy(y1)}" class="g"/>` + (x % 2 === 0 ? `<text x="${sx(x)}" y="${sy(y0) + 14}" class="t" text-anchor="middle">${x}</text>` : "");
    const ystep = (y1 - y0) / 5;
    for (let k = 0; k <= 5; k++) { const y = y0 + k * ystep; grid += `<line x1="${sx(x0)}" y1="${sy(y)}" x2="${sx(x1)}" y2="${sy(y)}" class="g"/><text x="${sx(x0) - 6}" y="${sy(y) + 4}" class="t" text-anchor="end">${Math.round(y)}</text>`; }
    const line = st.line ? `<line x1="${sx(x0)}" y1="${sy(st.line[0] * x0 + st.line[1])}" x2="${sx(x1)}" y2="${sy(st.line[0] * x1 + st.line[1])}" class="fit"/>` : "";
    const dots = st.points.map(([x, y]) => `<circle cx="${sx(x)}" cy="${sy(y)}" r="${st.highlight && st.highlight[0] === x && st.highlight[1] === y ? 5.5 : 3.8}" class="${st.highlight && st.highlight[0] === x && st.highlight[1] === y ? "dot hi" : "dot"}"/>`).join("");
    return `<figure class="stim"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Scatterplot of ${st.points.length} points with a line of best fit">
      <defs><clipPath id="plot"><rect x="${sx(x0)}" y="${sy(y1)}" width="${sx(x1) - sx(x0)}" height="${sy(y0) - sy(y1)}"/></clipPath></defs>
      ${grid}<g clip-path="url(#plot)">${line}</g>${dots}
      <text x="${(W + P) / 2}" y="${H - 2}" class="t" text-anchor="middle">${esc(st.xlabel)}</text>
      <text x="10" y="${H / 2}" class="t" text-anchor="middle" transform="rotate(-90 10 ${H / 2})">${esc(st.ylabel)}</text></svg></figure>`;
  }
  return "";
}

// ---------- question screen ----------
function heartsHTML() {
  let h = "";
  for (let k = 0; k < 3; k++) h += `<span class="${k < S.hearts ? "heart" : "heart lost"}">◆</span>`;
  return h;
}
function progressPct() {
  return S.mode === "level" ? Math.min(100, Math.round((S.i / S.base) * 100)) : Math.round((S.i / S.count) * 100);
}
function renderQuestion() {
  const q = S.qs[S.i];
  const sk = skillById(q.skill), dom = domainById(q.domain);
  const num = S.i + 1, total = S.mode === "level" ? Math.max(S.base, S.qs.length) : S.count;
  app.innerHTML = `
  <div class="screen">
    <div class="qtop">
      <button class="pill" id="quit" aria-label="Leave">✕</button>
      <div class="bar progress-wrap"><i style="width:${progressPct()}%"></i></div>
      ${S.mode === "level" ? `<div class="pill hearts" aria-label="${S.hearts} lives left">${heartsHTML()}</div>` : S.timed ? `<div class="pill mono" id="timer">--:--</div>` : `<div class="pill mono">${num}/${total}</div>`}
    </div>
    <div class="card qcard">
      <div class="qmeta">
        <span class="chip">${esc(SECTIONS[q.sec])}</span>
        <span class="chip ghost">${esc(dom.name)}</span>
        <span class="chip ghost">${esc(sk.name)}</span>
        <span class="chip d-${q.diff}">${DIFF_NAME[q.diff]}</span>
      </div>
      <div class="qnum mono">Question ${num}${S.mode === "level" ? "" : " of " + total} · ${esc(subtypeName(q.skill, q.sub))}</div>
      ${q.passage ? `<div class="passage">${fmt(q.passage).replace(/\n/g, "<br>")}</div>` : ""}
      ${stimulusHTML(q.stimulus)}
      <p class="qtext">${fmt(q.stem).replace(/\n/g, "<br>")}</p>
      <div id="choices" role="radiogroup">${q.choices.map((c, k) => `<button class="choice" role="radio" aria-checked="false" data-k="${k}" style="--d:${0.05 + k * 0.04}s"><span class="letter">${"ABCD"[k]}</span><span class="ctext">${fmt(c)}</span></button>`).join("")}</div>
      <div id="fb"></div>
    </div>
    <div class="actions"><button class="btn" id="action" disabled>Check</button></div>
    <div class="foot mono">KRYLLION · verified question</div>
  </div>`;
  S.shownAt = Date.now();
  app.querySelectorAll(".choice").forEach(b => b.onclick = () => {
    if (S.answered) return;
    S.sel = +b.dataset.k;
    app.querySelectorAll(".choice").forEach(x => { x.classList.toggle("sel", x === b); x.setAttribute("aria-checked", x === b); });
    $("#action").disabled = false;
  });
  $("#action").onclick = () => (S.answered ? nextQuestion() : check());
  $("#quit").onclick = () => {
    if (S.mode === "practice" && S.attempts) { if (confirm("End this practice set now? Your answers so far are saved.")) finishPractice(); return; }
    if (confirm("Leave this level? Progress on it is lost.")) renderMap();
  };
  if (S.mode === "practice" && S.timed) {
    stopTimer();
    const tick = () => {
      const left = (S.deadline - Date.now()) / 1000;
      const el = $("#timer"); if (el) { el.textContent = fmtTime(left); el.classList.toggle("warn", left < 60); }
      if (left <= 0) { stopTimer(); finishPractice(true); }
    };
    tick(); timerId = setInterval(tick, 500);
  }
}

function explanationHTML(q, sel) {
  const ok = sel === q.answer;
  const rows = q.choices.map((c, k) => `<li class="${k === q.answer ? "is-right" : k === sel ? "is-picked" : ""}"><span class="letter">${"ABCD"[k]}</span><div><div class="ctext">${fmt(c)}</div><div class="why">${fmt(q.why[k] || (k === q.answer ? "" : "Not supported by the question."))}</div></div></li>`).join("");
  return `<div class="feedback ${ok ? "ok" : "bad"}">
    <div class="verdict">${ok ? "Correct." : `Not quite. The answer is ${"ABCD"[q.answer]}.`}</div>
    ${q.concept ? `<div class="exrow"><span class="label">Concept</span><div>${fmt(q.concept)}</div></div>` : ""}
    ${q.steps.length ? `<div class="exrow"><span class="label">Solution</span><ol class="steps">${q.steps.map(s => `<li>${fmt(s)}</li>`).join("")}</ol></div>` : ""}
    <div class="exrow"><span class="label">Every choice</span><ul class="whylist">${rows}</ul></div>
    ${q.strategy ? `<div class="exrow"><span class="label">${q.sec === "math" ? "Shortcut" : "Strategy"}</span><div>${fmt(q.strategy)}</div></div>` : ""}
    ${q.misconception ? `<div class="exrow"><span class="label">Common trap</span><div>${fmt(q.misconception)}</div></div>` : ""}
  </div>`;
}

function record(q, ok, secs) {
  const add = (obj, key) => { const v = obj[key] || (obj[key] = { c: 0, t: 0, s: 0 }); v.t++; if (ok) v.c++; v.s = (v.s || 0) + secs; };
  add(profile.sk, q.skill); add(profile.sb, q.sub); add(profile.df, q.diff);
  if (q.source !== "generated") { profile.recent.push(q.id); if (profile.recent.length > 60) profile.recent.splice(0, profile.recent.length - 60); }
}

function check() {
  if (S.sel === null) return;
  stopTimer();
  const q = S.qs[S.i];
  const ok = S.sel === q.answer;
  const secs = Math.round((Date.now() - S.shownAt) / 1000);
  S.answered = true;
  S.attempts++;
  record(q, ok, secs);
  S.log.push({ q, sel: S.sel, ok, secs });
  if (ok) { S.correct++; S.xpGain += 10; }
  if (S.mode === "level" && !ok) {
    S.hearts = Math.max(0, S.hearts - 1);
    if (!q.retry) S.qs.push({ ...q, retry: true });   // missed questions come back once
    const h = app.querySelector(".hearts"); if (h) h.innerHTML = heartsHTML();
  }
  if (S.mode === "practice" && S.diff === "adaptive") {
    // Two in a row correct: step up. A miss: step down.
    if (ok) { S.adapt.streak++; if (S.adapt.streak >= 2 && S.adapt.level < 2) { S.adapt.level++; S.adapt.streak = 0; } }
    else { S.adapt.streak = 0; if (S.adapt.level > 0) S.adapt.level--; }
  }
  saveProfile();
  app.querySelectorAll(".choice").forEach((b, k) => {
    b.disabled = true;
    if (k === q.answer) b.classList.add("right");
    else if (k === S.sel) b.classList.add("wrong");
  });
  $("#fb").innerHTML = explanationHTML(q, S.sel);
  const action = $("#action");
  const last = S.mode === "level" ? (S.hearts <= 0 || S.i + 1 >= S.qs.length) : S.i + 1 >= S.count;
  action.textContent = last ? "See results" : "Continue";
  action.disabled = false;
  action.className = ok ? "btn" : "btn alt";
  if (S.mode === "practice" && S.timed && S.deadline - Date.now() > 0) {
    // keep the clock running while the student reads the explanation
    const tick = () => { const left = (S.deadline - Date.now()) / 1000; const el = $("#timer"); if (el) el.textContent = fmtTime(left); if (left <= 0) { stopTimer(); finishPractice(true); } };
    timerId = setInterval(tick, 500);
  }
  $("#fb").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function nextQuestion() {
  S.answered = false; S.sel = null;
  if (S.mode === "level") {
    if (S.hearts <= 0) return finishLevel();
    S.i++;
    if (S.i >= S.qs.length) return finishLevel();
  } else {
    S.i++;
    if (S.i >= S.count) return finishPractice();
    if (!S.qs[S.i]) {
      const q = nextFromFilter(S.filter, currentDiff());
      if (!q) return finishPractice();
      S.qs.push(q);
    }
  }
  const card = app.querySelector(".qcard");
  if (card) card.classList.add("leave");
  setTimeout(() => { renderQuestion(); window.scrollTo(0, 0); }, 200);
}

function updateStreak() {
  const today = new Date().toDateString();
  if (profile.lastDay === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  profile.streak = profile.lastDay === yesterday ? profile.streak + 1 : 1;
  profile.lastDay = today;
}

function finishLevel() {
  stopTimer();
  const acc = S.attempts ? S.correct / S.attempts : 0;
  const outOfHearts = S.hearts <= 0;
  const passed = !outOfHearts && acc >= PASS_ACCURACY;
  const stars = acc >= 0.9 ? 3 : acc >= 0.75 ? 2 : 1;
  const gain = S.xpGain + (passed ? 25 + (S.boss ? 50 : 0) : 0);
  if (passed) profile.done[S.n] = Math.max(profile.done[S.n] || 0, stars);
  profile.xp += gain;
  updateStreak();
  saveProfile();
  renderResult({ passed, outOfHearts, stars, acc, gain });
}
function finishPractice(timeUp) {
  stopTimer();
  const acc = S.attempts ? S.correct / S.attempts : 0;
  profile.xp += S.xpGain;
  profile.sessions.push({ at: Date.now(), label: S.label, n: S.attempts, c: S.correct });
  if (profile.sessions.length > 50) profile.sessions.shift();
  if (S.attempts) updateStreak();
  saveProfile();
  renderResult({ passed: null, acc, gain: S.xpGain, timeUp });
}

function breakdownHTML() {
  const by = {};
  S.log.forEach(e => { const k = e.q.skill; (by[k] = by[k] || { c: 0, t: 0 }); by[k].t++; if (e.ok) by[k].c++; });
  return Object.entries(by).map(([k, v], i) => `<div class="skill"><span>${esc(skillById(k).name)}</span><span class="mono">${v.c}/${v.t}</span></div>${bar(v.c, v.t, i)}`).join("");
}
function reviewHTML() {
  return S.log.map((e, i) => `<details class="rev ${e.ok ? "ok" : "bad"}"><summary><span class="mono">${String(i + 1).padStart(2, "0")}</span><span>${esc(skillById(e.q.skill).name)} · ${DIFF_NAME[e.q.diff]}</span><span class="mono">${e.ok ? "✓" : "✗"} ${e.secs}s</span></summary>
    ${e.q.passage ? `<div class="passage">${fmt(e.q.passage).replace(/\n/g, "<br>")}</div>` : ""}${stimulusHTML(e.q.stimulus)}
    <p class="qtext">${fmt(e.q.stem).replace(/\n/g, "<br>")}</p>${explanationHTML(e.q, e.sel)}</details>`).join("");
}

function renderResult(r) {
  const practice = S.mode === "practice";
  const title = practice ? (r.timeUp ? "Time is up" : "Set complete")
    : r.passed ? (S.boss ? "Unit assessment passed" : "Level complete") : (r.outOfHearts ? "Out of lives" : "Not yet");
  const sub = practice ? esc(S.label)
    : r.passed ? "" : r.outOfHearts ? "Lives refill when you try again." : `You need ${Math.round(PASS_ACCURACY * 100)}% accuracy to unlock the next level.`;
  const starRow = !practice && r.passed ? `<div class="stars-big">${[0, 1, 2].map(k => `<span class="${k < r.stars ? "" : "off"}" style="--d:${0.2 + k * 0.15}s">★</span>`).join("")}</div>` : "";
  const totalSecs = S.log.reduce((a, e) => a + e.secs, 0);
  app.innerHTML = `
  <div class="screen">
    <div class="hero" style="margin-top:24px">
      ${BRAND}
      <h2 class="title sm enter">${title}</h2>
      ${starRow}
      ${sub ? `<p class="muted enter" style="--d:.1s">${sub}</p>` : ""}
    </div>
    <div class="card enter" style="--d:.2s;margin-top:20px">
      <div class="row-stat"><span>Accuracy</span><span class="mono">${Math.round(r.acc * 100)}%</span></div>
      <div class="row-stat"><span>Correct</span><span class="mono">${S.correct} of ${S.attempts}</span></div>
      <div class="row-stat"><span>Average time</span><span class="mono">${S.attempts ? Math.round(totalSecs / S.attempts) : 0}s per question</span></div>
      <div class="row-stat"><span>XP earned</span><span class="mono hl">+${r.gain}</span></div>
      <div class="row-stat"><span>Streak</span><span class="mono">${profile.streak} day${profile.streak === 1 ? "" : "s"}</span></div>
    </div>
    ${S.log.length ? `<div class="card enter" style="--d:.3s;margin-top:14px"><div class="label">By skill</div>${breakdownHTML()}</div>
    <div class="card enter" style="--d:.35s;margin-top:14px"><div class="label">Review every question</div>${reviewHTML()}</div>` : ""}
    <div class="actions enter" style="--d:.4s">
      ${!practice && r.passed && S.n < TOTAL_LEVELS ? `<button class="btn" id="nxt">Next level →</button>` : ""}
      ${!practice && !r.passed ? `<button class="btn" id="retry">Try again</button>` : ""}
      ${practice ? `<button class="btn" id="again">New set, same settings</button>` : ""}
      <button class="btn ghost" id="map">Back to map</button>
    </div>
  </div>`;
  window.scrollTo(0, 0);
  $("#map").onclick = () => renderMap();
  const nx = $("#nxt"); if (nx) nx.onclick = () => startLevel(S.n + 1);
  const rt = $("#retry"); if (rt) rt.onclick = () => startLevel(S.n);
  const ag = $("#again"); if (ag) { const p = { filter: S.filter, diff: S.diff, count: S.count, timed: S.timed, label: S.label }; ag.onclick = () => startPractice(p); }
}

// ---------- boot ----------
function boot() {
  if (!session) return renderAuth();
  loadProfile();
  if (!profile) return renderOnboarding();
  renderMap();
}
boot();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
