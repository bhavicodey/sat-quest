// questions.js: SAT Quest question engine.
// Loads first. Defines the official Digital SAT taxonomy, shared helpers, the question
// builder, the automated validator, and makeQuestion(). Content lives in two other files:
//   rw-bank.js   hand-written Reading and Writing items (plus the original legacy items below)
//   math-gen.js  Math generators: a fresh question every time, computationally checked
// Every question shown to a student passes validateQuestion() first; failures are rejected
// and regenerated.

// ---------- official taxonomy: section > domain > skill > subtype ----------
const SECTIONS = { rw: "Reading and Writing", math: "Math" };

const DOMAINS = [
  { id: "ii",   sec: "rw",   name: "Information and Ideas" },
  { id: "cs",   sec: "rw",   name: "Craft and Structure" },
  { id: "eoi",  sec: "rw",   name: "Expression of Ideas" },
  { id: "sec",  sec: "rw",   name: "Standard English Conventions" },
  { id: "alg",  sec: "math", name: "Algebra" },
  { id: "adv",  sec: "math", name: "Advanced Math" },
  { id: "psda", sec: "math", name: "Problem-Solving and Data Analysis" },
  { id: "geo",  sec: "math", name: "Geometry and Trigonometry" },
];

// Skill names follow the College Board's published skill list. Subtypes are SAT Quest's
// own finer-grained tags; they are not official College Board categories.
const SKILLS = [
  // Reading and Writing
  { id: "central", dom: "ii", name: "Central Ideas and Details", subs: [
    ["main-idea", "Main idea"], ["detail", "Supporting detail"], ["literary-summary", "Literary summary"]] },
  { id: "coe-text", dom: "ii", name: "Command of Evidence: Textual", subs: [
    ["support-claim", "Finding that supports a claim"], ["weaken-claim", "Finding that weakens a claim"], ["quotation", "Quotation that illustrates a claim"]] },
  { id: "coe-quant", dom: "ii", name: "Command of Evidence: Quantitative", subs: [
    ["table-claim", "Table data that supports a claim"], ["table-compare", "Comparing groups in a table"]] },
  { id: "infer", dom: "ii", name: "Inferences", subs: [["logical-completion", "Logical completion"]] },
  { id: "wic", dom: "cs", name: "Words in Context", subs: [
    ["precise-word", "Most logical and precise word"], ["word-meaning", "Meaning of a word as used"]] },
  { id: "tsp", dom: "cs", name: "Text Structure and Purpose", subs: [
    ["main-purpose", "Main purpose"], ["sentence-function", "Function of a sentence"], ["overall-structure", "Overall structure"]] },
  { id: "ctc", dom: "cs", name: "Cross-Text Connections", subs: [["response", "How one author would respond to another"]] },
  { id: "synth", dom: "eoi", name: "Rhetorical Synthesis", subs: [["notes-goal", "Using notes to meet a goal"]] },
  { id: "trans", dom: "eoi", name: "Transitions", subs: [
    ["contrast", "Contrast"], ["cause-effect", "Cause and effect"], ["sequence", "Sequence"], ["emphasis", "Emphasis and elaboration"]] },
  { id: "bound", dom: "sec", name: "Boundaries", subs: [
    ["comma-splice", "Comma splices"], ["run-on", "Run-on sentences"],
    ["semicolon", "Semicolon usage"], ["colon", "Colon usage"],
    ["coord-conj", "Coordinating conjunctions"], ["subordination", "Subordination"], ["supplement", "Supplements and appositives"]] },
  { id: "fss", dom: "sec", name: "Form, Structure, and Sense", subs: [
    ["sva", "Subject-verb agreement"], ["tense", "Verb tense and form"], ["pronoun-agree", "Pronoun agreement"],
    ["pronoun-case", "Pronoun case"], ["modifier", "Modifier placement"], ["parallel", "Parallel structure"],
    ["comparison", "Logical comparisons"], ["possessive", "Possessives"], ["plural", "Plurals"], ["determiner", "Determiners"]] },
  // Math
  { id: "lin1", dom: "alg", name: "Linear equations in one variable", subs: [
    ["lin1-solve", "Solving linear equations"], ["lin1-distribute", "Variables on both sides"], ["lin1-solutions", "Number of solutions"]] },
  { id: "linfun", dom: "alg", name: "Linear functions", subs: [
    ["linfun-eval", "Evaluating a linear function"], ["linfun-interpret", "Interpreting slope and intercept"],
    ["linfun-table", "Function from a table"], ["linfun-points", "Function from two values"]] },
  { id: "lin2", dom: "alg", name: "Linear equations in two variables", subs: [
    ["lin2-slope", "Slope from two points"], ["lin2-standard", "Slope from standard form"], ["lin2-perp", "Parallel and perpendicular lines"]] },
  { id: "sys", dom: "alg", name: "Systems of two linear equations in two variables", subs: [
    ["sys-solve", "Solving by elimination"], ["sys-context", "Systems in context"], ["sys-param", "Number of solutions (parameter)"]] },
  { id: "ineq", dom: "alg", name: "Linear inequalities in one or two variables", subs: [
    ["ineq-solve", "Solving linear inequalities"], ["ineq-context", "Inequalities in context"], ["ineq-system", "Systems of inequalities"]] },
  { id: "equiv", dom: "adv", name: "Equivalent expressions", subs: [
    ["equiv-expand", "Expanding products"], ["equiv-factor", "Factoring"], ["equiv-exponent", "Exponent and radical rules"], ["equiv-rational", "Rational expressions"]] },
  { id: "nleq", dom: "adv", name: "Nonlinear equations in one variable and systems of equations in two variables", subs: [
    ["quad-solve", "Quadratic equations"], ["quad-discriminant", "Discriminant and number of solutions"],
    ["radical-eq", "Radical equations"], ["rational-eq", "Rational equations"], ["nl-system", "Linear-quadratic systems"]] },
  { id: "nlfun", dom: "adv", name: "Nonlinear functions", subs: [
    ["fn-notation", "Function notation and composition"], ["exp-model", "Exponential models"], ["exp-build", "Building exponential functions"],
    ["vertex", "Quadratic vertex and extrema"], ["transform", "Function transformations"], ["poly-zeros", "Polynomial zeros"]] },
  { id: "ratio", dom: "psda", name: "Ratios, rates, proportional relationships, and units", subs: [
    ["ratio-parts", "Ratios and part-to-whole"], ["unit-convert", "Unit conversion"], ["proportion", "Proportions and scale"], ["work-rate", "Combined rates"]] },
  { id: "pct", dom: "psda", name: "Percentages", subs: [
    ["pct-change", "Percent increase and decrease"], ["pct-successive", "Successive percent changes"], ["pct-reverse", "Finding the original amount"], ["pct-of-pct", "Percent of a percent"]] },
  { id: "one", dom: "psda", name: "One-variable data: distributions and measures of center and spread", subs: [
    ["mean-missing", "Mean and missing values"], ["median-freq", "Median from a frequency table"], ["outlier", "Effect of changing data on mean and median"], ["spread", "Comparing standard deviation"]] },
  { id: "two", dom: "psda", name: "Two-variable data: models and scatterplots", subs: [
    ["fit-predict", "Predicting with a line of best fit"], ["fit-interpret", "Interpreting a line of best fit"], ["residual", "Residuals"]] },
  { id: "prob", dom: "psda", name: "Probability and conditional probability", subs: [
    ["prob-simple", "Simple probability"], ["prob-conditional", "Conditional probability from a two-way table"]] },
  { id: "infer-stat", dom: "psda", name: "Inference from sample statistics and margin of error", subs: [
    ["sample-estimate", "Estimating from a random sample"], ["margin", "Interpreting margin of error"]] },
  { id: "claims", dom: "psda", name: "Evaluating statistical claims: observational studies and experiments", subs: [
    ["study-design", "Random sampling and random assignment"]] },
  { id: "area", dom: "geo", name: "Area and volume", subs: [
    ["volume-prism", "Rectangular prisms"], ["volume-cylinder", "Cylinders"], ["scale-factor", "Scaling area and volume"]] },
  { id: "lat", dom: "geo", name: "Lines, angles, and triangles", subs: [
    ["triangle-angles", "Triangle angle sum"], ["parallel-lines", "Parallel lines and transversals"], ["similar", "Similar triangles"]] },
  { id: "right", dom: "geo", name: "Right triangles and trigonometry", subs: [
    ["pythag", "Pythagorean theorem"], ["trig-ratio", "Sine, cosine, and tangent"], ["cofunction", "Complementary angle relationships"]] },
  { id: "circle", dom: "geo", name: "Circles", subs: [
    ["circle-basic", "Circumference and area"], ["arc-sector", "Arc length and sector area"], ["circle-eq", "Equations of circles"]] },
];

const DIFFS = ["easy", "medium", "hard"];
const DIFF_NAME = { easy: "Easy", medium: "Medium", hard: "Hard" };

const skillById = id => SKILLS.find(s => s.id === id);
const domainById = id => DOMAINS.find(d => d.id === id);
const sectionOfSkill = id => domainById(skillById(id).dom).sec;
function subtypeName(skillId, subId) {
  const s = skillById(skillId); const f = s && s.subs.find(x => x[0] === subId);
  return f ? f[1] : subId;
}

// ---------- helpers ----------
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const nz = (a, b) => { let v; do v = rnd(a, b); while (v === 0); return v; };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = rnd(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const MINUS = "−";
const N = v => (v < 0 ? MINUS + (-v) : String(v));                  // number with a true minus sign
function fr(n, d = 1) {                                               // reduced fraction as text
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1; n /= g; d /= g;
  return d === 1 ? N(n) : (n < 0 ? MINUS : "") + Math.abs(n) + "/" + d;
}
// "3x − 5", "−x + 2", "x"
function lin(a, b, v = "x") {
  let s = a === 0 ? "" : a === 1 ? v : a === -1 ? MINUS + v : N(a) + v;
  if (b) s = s ? s + (b < 0 ? ` ${MINUS} ${-b}` : ` + ${b}`) : N(b);
  return s || "0";
}
// polynomial from coefficients, highest power first: [1, -5, 6] -> "x² − 5x + 6"
function poly(coefs, v = "x") {
  const deg = coefs.length - 1; let s = "";
  coefs.forEach((c, i) => {
    const p = deg - i; if (!c) return;
    const abs = Math.abs(c);
    const body = p === 0 ? String(abs) : (abs === 1 ? "" : abs) + v + (p === 1 ? "" : p === 2 ? "²" : p === 3 ? "³" : "^{" + p + "}");
    s += s ? (c < 0 ? ` ${MINUS} ` : " + ") + body : (c < 0 ? MINUS : "") + body;
  });
  return s || "0";
}
// Readable number: integer, simple fraction, or a short decimal.
function niceNum(v) {
  if (Number.isInteger(v)) return N(v);
  for (let d = 2; d <= 12; d++) if (Math.abs(v * d - Math.round(v * d)) < 1e-9) return fr(Math.round(v * d), d);
  const s = (Math.round(v * 100) / 100).toString();
  return s.replace(/^-/, MINUS);
}
// Tidies generated explanation text: "+ −3" -> "− 3", "· −4" -> "· (−4)".
const tidy = s => String(s).replace(/\+ \u2212/g, "\u2212 ").replace(/· \u2212(\d+)/g, "· (\u2212$1)").replace(/\u2212 \u2212/g, "+ ");
const money = v => "$" + (Number.isInteger(v) ? v.toLocaleString("en-US") : v.toFixed(2));

// Numeric value of a choice for equivalence checks, or null for non-numeric text.
function numVal(s) {
  const t = String(s).replace(/−/g, "-").replace(/[$,%\s]/g, "");
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  const f = t.match(/^(-?\d+)\/(\d+)$/); if (f) return Number(f[1]) / Number(f[2]);
  const p = t.match(/^(-?\d*(?:\.\d+)?)π$/); if (p) return (p[1] === "" ? 1 : p[1] === "-" ? -1 : Number(p[1])) * Math.PI;
  return null;
}
const choiceKey = s => { const v = numVal(s); return v === null ? String(s).trim().toLowerCase().replace(/\s+/g, " ") : "#" + v.toFixed(9); };

// ---------- the question builder ----------
// spec: {skill, sub, diff, stem, passage?, stimulus?, choices:[{t, ok, why}], concept, misconception,
//        steps?:[], strategy?, time?, source?}
// Choices carry their own ok flag, computed independently by the generator (math) or set by the
// author (Reading and Writing). The builder shuffles them and records the correct index.
function buildQuestion(spec) {
  const ch = shuffle(spec.choices.map(c => ({ t: String(c.t), ok: !!c.ok, why: c.why || "" })));
  const sk = skillById(spec.skill);
  const dom = sk ? sk.dom : null;
  const q = {
    id: spec.id || (spec.sub + "-" + hashStr(spec.stem + "|" + (spec.passage || "") + "|" + spec.choices.map(c => c.t).sort().join("|"))),
    sec: dom ? domainById(dom).sec : null, domain: dom, skill: spec.skill, sub: spec.sub, diff: spec.diff,
    passage: spec.passage || "", stimulus: spec.stimulus || null, stem: spec.stem,
    choices: ch.map(c => c.t), why: ch.map(c => tidy(c.why)), okFlags: ch.map(c => c.ok),
    answer: ch.findIndex(c => c.ok),
    concept: spec.concept || "", misconception: spec.misconception || "",
    steps: (spec.steps || []).map(tidy), strategy: spec.strategy || "",
    time: spec.time || (dom && domainById(dom).sec === "math" ? 95 : 71),
    legacy: !!spec.legacy, source: spec.source || (dom && domainById(dom).sec === "math" ? "generated" : "bank"),
  };
  return q;
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

// ---------- automated validation ----------
// Returns a list of problems; an empty list means the question may be shown.
function validateQuestion(q, recentIds) {
  const e = [];
  const sk = skillById(q.skill);
  if (!sk) e.push("unknown skill " + q.skill);
  else {
    if (q.domain !== sk.dom) e.push("skill is not in the stated domain");
    if (!sk.subs.some(s => s[0] === q.sub)) e.push("subtype " + q.sub + " is not part of skill " + q.skill);
  }
  if (!DIFFS.includes(q.diff)) e.push("bad difficulty " + q.diff);
  if (!q.stem || !String(q.stem).trim()) e.push("empty question text");
  if (!Array.isArray(q.choices) || q.choices.length !== 4) e.push("needs exactly four choices");
  else {
    const keys = q.choices.map(choiceKey);
    if (new Set(keys).size !== 4) e.push("two choices are identical or equivalent");
    if (q.choices.some(c => !String(c).trim())) e.push("empty choice");
    const nOk = q.okFlags.filter(Boolean).length;
    if (nOk !== 1) e.push(`expected one correct choice, found ${nOk}`);
    if (q.answer < 0 || q.answer > 3 || !q.okFlags[q.answer]) e.push("answer key does not match the correct choice");
    if (!q.legacy && q.why.some(w => !String(w).trim())) e.push("every choice needs an explanation");
  }
  const text = [q.stem, q.passage, ...(q.choices || []), ...(q.why || []), ...(q.steps || [])].join(" ");
  if (/\bNaN\b|undefined|Infinity|\[object/.test(text)) e.push("broken text (NaN/undefined)");
  if ((q.choices || []).some(c => /\d\.\d{3,}/.test(c))) e.push("unrounded decimal in a choice");
  if (/(^|[^\d])-?0\/|\/0(?!\d)/.test((q.choices || []).join(" "))) e.push("zero denominator or zero fraction in a choice");
  if (!q.legacy && !q.concept) e.push("missing tested concept");
  if (recentIds && recentIds.has(q.id)) e.push("duplicate of a recent question");
  return e;
}

// ---------- registries filled by rw-bank.js and math-gen.js ----------
const RW_BANK = [];   // item specs
const MATH_GEN = {};  // subtype -> {skill, diffs:[...], gen(diff) -> spec}
const QA = { generated: 0, rejected: 0, reasons: {} };   // live validation counters

// ---------- legacy items from the original SAT Quest (kept, mapped to official skills) ----------
// These are short, foundational items. They are tagged easy and only appear in easy practice.
const LEGACY_RW = [
  ["wic", "word-meaning", "The senator's remarks were \"candid,\" leaving little room for doubt about where she stands. As used here, \"candid\" most nearly means:", "honest and direct", ["secretive", "rehearsed", "vague"], "Candid means open and honest, which fits 'leaving little room for doubt.'"],
  ["wic", "word-meaning", "After weeks of drought, the usually \"arid\" field was now soggy after a heavy rain. As used here, \"arid\" most nearly means:", "dry", ["flooded", "fertile", "muddy"], "The contrast with 'soggy' shows that arid means dry."],
  ["central", "main-idea", "Researchers tracked bees for a year and found that pollinator numbers fell most sharply where pesticide use was heaviest. Which choice best states the central idea?", "Pesticide use is linked to declines in local pollinator populations.", ["Bees are the most important pollinators on Earth.", "Researchers disagree about how to count bees.", "Rainfall has little effect on bee populations."], "The whole passage builds toward the link between pesticides and falling pollinator numbers."],
  ["central", "main-idea", "A town library added extended weekend hours. Visits rose 30%, and more residents signed up for programs. The passage mainly argues that:", "extending hours helped the library attract more residents.", ["the library needs a larger budget.", "weekend visits are less popular than weekday visits.", "residents prefer digital services to programs."], "The evidence (more visits, more sign-ups) supports the idea that longer hours helped."],
  ["infer", "logical-completion", "After the storm, the town's power stayed out for nine days, and residents lined up at the school's one generator. This suggests that:", "the community relied heavily on limited shared resources.", ["the storm caused little damage.", "the school had no power at all.", "residents were unwilling to help one another."], "Lining up at one generator for days points to reliance on scarce shared resources."],
  ["infer", "logical-completion", "Mara checked her phone every few minutes and kept glancing at the door. It is most reasonable to infer that Mara is:", "waiting anxiously for someone.", ["bored with the film.", "asleep and dreaming.", "planning to leave the country."], "Repeated checking and glancing at the door suggest anticipation."],
  ["coe-text", "support-claim", "A student claims the museum drew record crowds last year. Which finding best supports this claim?", "Attendance reached 2 million, the highest in its history.", ["The museum opened a new gift shop.", "The café serves a wide variety of teas.", "The building was repainted blue."], "Only the attendance record directly shows crowds."],
  ["coe-text", "support-claim", "A researcher argues that sleep improves memory. Which evidence most directly supports this argument?", "Participants who slept after studying recalled 25% more words the next day.", ["Participants enjoyed the study session.", "The study took place in a quiet room.", "Participants were paid for their time."], "A memory measurement tied to sleep directly tests the claim."],
  ["trans", "contrast", "The trail was steep and rocky. ___, the view from the summit made every step worthwhile.", "However,", ["For example,", "Similarly,", "Therefore,"], "The hard climb is contrasted with the rewarding view, so 'However' fits."],
  ["trans", "cause-effect", "The city invested in protected bike lanes. ___, bike commuting rose by nearly half within two years.", "As a result,", ["In contrast,", "Meanwhile,", "Nevertheless,"], "The rise in biking is a consequence of the investment."],
  ["fss", "sva", "The collection of rare coins ___ worth more than the house it was kept in.", "is", ["are", "were", "be"], "The subject is 'collection' (singular), so the verb is 'is.'"],
  ["fss", "sva", "Each of the proposals ___ been reviewed by the committee.", "has", ["have", "are", "were"], "'Each' is singular, so it takes 'has.'"],
  ["fss", "pronoun-agree", "The committee submitted ___ final report on Monday.", "its", ["their", "it's", "they're"], "'Committee' is a singular noun here, so the possessive is 'its.'"],
  ["fss", "pronoun-agree", "Dana and I finished ___ project early.", "our", ["my", "me", "we"], "The project belongs to two people, so the possessive is 'our.'"],
  ["fss", "tense", "By the time the rain stopped, the crew ___ the roof for six hours.", "had been repairing", ["repairs", "will repair", "has repaired"], "A past action that continued up to another past point uses the past perfect continuous."],
  ["fss", "tense", "Last summer, Ana ___ to Japan, where she learned to make sushi.", "traveled", ["travels", "has traveled", "will travel"], "'Last summer' signals a completed past action, so use the simple past."],
  ["bound", "colon", "Which choice uses punctuation correctly?", "The recipe calls for three ingredients: flour, sugar, and eggs.", ["The recipe calls for three ingredients flour, sugar, and eggs.", "The recipe calls for three ingredients; flour, sugar, and eggs.", "The recipe calls for: three ingredients flour sugar and eggs."], "A colon introduces a list after a complete clause, and the list uses commas."],
  ["bound", "supplement", "Which choice correctly punctuates: \"My brother who lives in Denver is a nurse.\" (The speaker has one brother.)", "My brother, who lives in Denver, is a nurse.", ["My brother who lives in Denver, is a nurse.", "My brother, who lives in Denver is a nurse.", "My brother who lives in Denver is, a nurse."], "A non-essential clause needs a comma before and after it."],
  ["fss", "modifier", "Which revision fixes the misplaced modifier in: \"Walking home, the streetlights came on.\"", "As I walked home, the streetlights came on.", ["Walking home, the streetlights came on quickly.", "The streetlights came on, walking home.", "Walking home, streetlights came on."], "The modifier 'walking home' must describe the person, so name the person as the subject."],
  ["fss", "modifier", "Which revision fixes the dangling modifier in: \"After finishing the report, the coffee went cold.\"", "After I finished the report, I noticed the coffee had gone cold.", ["After finishing the report, the coffee went cold.", "The coffee went cold after finishing the report.", "After finishing the report, coffee went cold."], "'After finishing the report' must modify a person, so add the person as the subject."],
  ["synth", "notes-goal", "Which choice is the most concise? \"In the event that it rains, the game will be postponed.\"", "If it rains, the game will be postponed.", ["If it should happen to rain, the game will be postponed.", "In the event of rain, the game is going to be postponed.", "In the event that it rains, the game will be postponed."], "'If' says the same thing in fewer words."],
  ["synth", "notes-goal", "Which choice is the most concise? \"The results were of a surprising nature and were quite unexpected.\"", "The results were surprising.", ["The results were of a surprising nature.", "The results were quite unexpected and surprising.", "The results were, in a sense, surprising and unexpected."], "The short version keeps the meaning without the repeated ideas."],
  ["tsp", "sentence-function", "A writer describing a bakery says: \"The smell of cinnamon drifted through the doorway.\" The sentence mainly serves to:", "create a vivid sensory image of the bakery.", ["state the bakery's opening hours.", "argue that bakeries are better than cafés.", "explain how cinnamon is grown."], "The sentence appeals to smell to make the scene concrete."],
  ["tsp", "sentence-function", "A biologist writes: \"Though the reef looks healthy, its colors are fading.\" The opening clause mainly serves to:", "introduce a contrast that sets up the main concern.", ["confirm that the reef is healthy.", "list the reef's most common species.", "apologize for an earlier mistake."], "'Though' sets up a contrast with the concern that follows."],
].map(([skill, sub, stem, a, w, explain], i) => ({
  id: "legacy-" + (i + 1), legacy: true, skill, sub, diff: "easy", stem,
  choices: [{ t: a, ok: true, why: explain }, ...w.map(t => ({ t, ok: false, why: "" }))],
  concept: subtypeName(skill, sub), strategy: "", source: "legacy",
}));

// ---------- selecting and generating ----------
// filter: {sec?, domain?, skill?, sub?, diff?, includeLegacy?}
function matchesFilter(skillId, sub, f) {
  const sk = skillById(skillId); if (!sk) return false;
  if (f.skill && f.skill !== skillId) return false;
  if (f.sub && f.sub !== sub) return false;
  if (f.domain && f.domain !== sk.dom) return false;
  if (f.sec && f.sec !== domainById(sk.dom).sec) return false;
  if (f.domains && !f.domains.includes(sk.dom)) return false;
  return true;
}
function nearestDiff(available, want) {
  if (available.includes(want)) return want;
  const order = { easy: 0, medium: 1, hard: 2 };
  return available.slice().sort((a, b) => Math.abs(order[a] - order[want]) - Math.abs(order[b] - order[want]))[0];
}

// What can be practiced for a filter: [{kind:"math"|"rw", skill, sub, diffs}]
function sourcesFor(f) {
  const out = [];
  for (const [sub, g] of Object.entries(MATH_GEN))
    if (matchesFilter(g.skill, sub, f)) out.push({ kind: "math", skill: g.skill, sub, diffs: g.diffs });
  const rwKeys = {};
  const pool = f.includeLegacy === false ? RW_BANK : RW_BANK.concat(LEGACY_RW);
  for (const it of pool) {
    if (!matchesFilter(it.skill, it.sub, f)) continue;
    const k = it.skill + "/" + it.sub;
    (rwKeys[k] = rwKeys[k] || { kind: "rw", skill: it.skill, sub: it.sub, diffs: [] });
    if (!rwKeys[k].diffs.includes(it.diff)) rwKeys[k].diffs.push(it.diff);
  }
  return out.concat(Object.values(rwKeys));
}

// Returns one validated question, or null if nothing matches the filter.
// recent: Set of recently shown ids (avoids repeats where the pool allows it).
function makeQuestion(f = {}, recent = new Set()) {
  let srcs = sourcesFor(f);
  if (f.diff) {
    let exact = srcs.filter(s => s.diffs.includes(f.diff));
    if (!exact.length) { const nd = nearestDiff([...new Set(srcs.flatMap(s => s.diffs))], f.diff); exact = srcs.filter(s => s.diffs.includes(nd)); }
    srcs = exact;
  }
  if (!srcs.length) return null;
  // Balance Reading and Writing against Math when both are allowed.
  const kinds = [...new Set(srcs.map(s => s.kind))];
  const kind = pick(kinds);
  const bySkill = {};
  srcs.filter(s => s.kind === kind).forEach(s => (bySkill[s.skill] = bySkill[s.skill] || []).push(s));
  for (let attempt = 0; attempt < 40; attempt++) {
    const src = pick(pick(Object.values(bySkill)));      // pick a skill evenly, then a subtype
    const diff = f.diff ? nearestDiff(src.diffs, f.diff) : pick(src.diffs);
    let q;
    if (src.kind === "math") {
      let spec;
      try { spec = MATH_GEN[src.sub].gen(diff); } catch (err) { spec = null; }
      if (!spec) { QA.rejected++; QA.reasons["generator error"] = (QA.reasons["generator error"] || 0) + 1; continue; }
      spec.skill = MATH_GEN[src.sub].skill; spec.sub = src.sub; spec.diff = diff;
      q = buildQuestion(spec);
    } else {
      const pool = RW_BANK.concat(f.includeLegacy === false ? [] : LEGACY_RW)
        .filter(it => it.skill === src.skill && it.sub === src.sub && it.diff === diff);
      const fresh = pool.filter(it => !recent.has(it.id));
      const it = pick(fresh.length ? fresh : pool);
      if (!it) continue;
      q = buildQuestion(it);
    }
    QA.generated++;
    const problems = validateQuestion(q, src.kind === "math" ? recent : null);
    if (problems.length) {
      QA.rejected++;
      problems.forEach(p => (QA.reasons[p] = (QA.reasons[p] || 0) + 1));
      continue;
    }
    return q;
  }
  return null;
}

// Light formatting for math notation. Input is plain text; output is safe HTML.
//   x^2 / x^{n+1} -> superscript, \frac{a}{b} -> stacked fraction, sqrt(...) -> radical,
//   [u]...[/u] -> underline (used to mark a sentence in a passage), *x* -> italic
function fmt(s) {
  let h = String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  h = h.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
  h = h.replace(/sqrt\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, '<span class="rad">√<span>$1</span></span>');
  h = h.replace(/\^\{([^{}]*)\}/g, "<sup>$1</sup>").replace(/\^(−?[\w.]+)/g, "<sup>$1</sup>");
  h = h.replace(/\[u\]([\s\S]*?)\[\/u\]/g, "<u>$1</u>");
  return h;
}
