// questions.js: 24 SAT-style question types, generators, and Reading & Writing items.
// Math questions are generated fresh each time. Reading & Writing items are hand-written:
// add more to RW below to reduce repeats.

const TYPES = [
  // Reading & Writing (12)
  { id: "words",       name: "Words in Context",       sec: "rw" },
  { id: "central",     name: "Central Ideas",          sec: "rw" },
  { id: "inference",   name: "Inference",              sec: "rw" },
  { id: "evidence",    name: "Text Evidence",          sec: "rw" },
  { id: "transitions", name: "Transitions",            sec: "rw" },
  { id: "sva",         name: "Subject-Verb Agreement", sec: "rw" },
  { id: "pronouns",    name: "Pronouns",               sec: "rw" },
  { id: "tense",       name: "Verb Tense",             sec: "rw" },
  { id: "punct",       name: "Punctuation",            sec: "rw" },
  { id: "modifiers",   name: "Modifiers",              sec: "rw" },
  { id: "concision",   name: "Concision",              sec: "rw" },
  { id: "purpose",     name: "Rhetorical Purpose",     sec: "rw" },
  // Math (12)
  { id: "linear",    name: "Linear Equations",     sec: "math" },
  { id: "systems",   name: "Systems of Equations", sec: "math" },
  { id: "slope",     name: "Slope",                sec: "math" },
  { id: "percent",   name: "Percents",             sec: "math" },
  { id: "ratio",     name: "Ratios & Rates",       sec: "math" },
  { id: "exponents", name: "Exponents",            sec: "math" },
  { id: "expand",    name: "Expanding Binomials",  sec: "math" },
  { id: "ineq",      name: "Inequalities",         sec: "math" },
  { id: "mean",      name: "Mean & Missing Data",  sec: "math" },
  { id: "prob",      name: "Probability",          sec: "math" },
  { id: "area",      name: "Area & Perimeter",     sec: "math" },
  { id: "speed",     name: "Distance & Time",      sec: "math" },
];

// ---------- Reading & Writing items (a = correct answer, w = wrong answers) ----------
const RW = [
  { type: "words", q: "The senator's remarks were \"candid,\" leaving little room for doubt about where she stands.",
    a: "honest and direct", w: ["secretive", "rehearsed", "vague"],
    explain: "Candid means open and honest, which fits 'leaving little room for doubt.'" },
  { type: "words", q: "After weeks of drought, the usually \"arid\" field was now soggy after a heavy rain.",
    a: "dry", w: ["flooded", "fertile", "muddy"],
    explain: "The contrast with 'soggy' shows that arid means dry." },

  { type: "central", q: "Researchers tracked bees for a year and found that pollinator numbers fell most sharply where pesticide use was heaviest. Which choice best states the central idea?",
    a: "Pesticide use is linked to declines in local pollinator populations.",
    w: ["Bees are the most important pollinators on Earth.", "Researchers disagree about how to count bees.", "Rainfall has little effect on bee populations."],
    explain: "The whole passage builds toward the link between pesticides and falling pollinator numbers." },
  { type: "central", q: "A town library added extended weekend hours. Visits rose 30%, and more residents signed up for programs. The passage mainly argues that:",
    a: "extending hours helped the library attract more residents.",
    w: ["the library needs a larger budget.", "weekend visits are less popular than weekday visits.", "residents prefer digital services to programs."],
    explain: "The evidence (more visits, more sign-ups) supports the idea that longer hours helped." },

  { type: "inference", q: "After the storm, the town's power stayed out for nine days, and residents lined up at the school's one generator. This suggests that:",
    a: "the community relied heavily on limited shared resources.",
    w: ["the storm caused little damage.", "the school had no power at all.", "residents were unwilling to help one another."],
    explain: "Lining up at one generator for days points to reliance on scarce shared resources." },
  { type: "inference", q: "Mara checked her phone every few minutes and kept glancing at the door. It is most reasonable to infer that Mara is:",
    a: "waiting anxiously for someone.",
    w: ["bored with the film.", "asleep and dreaming.", "planning to leave the country."],
    explain: "Repeated checking and glancing at the door suggest anticipation." },

  { type: "evidence", q: "A student claims the museum drew record crowds last year. Which finding best supports this claim?",
    a: "Attendance reached 2 million, the highest in its history.",
    w: ["The museum opened a new gift shop.", "The café serves a wide variety of teas.", "The building was repainted blue."],
    explain: "Only the attendance record directly shows crowds." },
  { type: "evidence", q: "A researcher argues that sleep improves memory. Which evidence most directly supports this argument?",
    a: "Participants who slept after studying recalled 25% more words the next day.",
    w: ["Participants enjoyed the study session.", "The study took place in a quiet room.", "Participants were paid for their time."],
    explain: "A memory measurement tied to sleep directly tests the claim." },

  { type: "transitions", q: "The trail was steep and rocky. ___, the view from the summit made every step worthwhile.",
    a: "However,", w: ["For example,", "Similarly,", "Therefore,"],
    explain: "The hard climb is contrasted with the rewarding view, so 'However' fits." },
  { type: "transitions", q: "The city invested in protected bike lanes. ___, bike commuting rose by nearly half within two years.",
    a: "As a result,", w: ["In contrast,", "Meanwhile,", "Nevertheless,"],
    explain: "The rise in biking is a consequence of the investment." },

  { type: "sva", q: "The collection of rare coins ___ worth more than the house it was kept in.",
    a: "is", w: ["are", "were", "be"],
    explain: "The subject is 'collection' (singular), so the verb is 'is.'" },
  { type: "sva", q: "Each of the proposals ___ been reviewed by the committee.",
    a: "has", w: ["have", "are", "were"],
    explain: "'Each' is singular, so it takes 'has.'" },

  { type: "pronouns", q: "The committee submitted ___ final report on Monday.",
    a: "its", w: ["their", "it's", "they're"],
    explain: "'Committee' is a singular noun here, so the possessive is 'its.'" },
  { type: "pronouns", q: "Dana and I finished ___ project early.",
    a: "our", w: ["my", "me", "we"],
    explain: "The project belongs to two people, so the possessive is 'our.'" },

  { type: "tense", q: "By the time the rain stopped, the crew ___ the roof for six hours.",
    a: "had been repairing", w: ["repairs", "will repair", "has repaired"],
    explain: "A past action that continued up to another past point uses the past perfect continuous." },
  { type: "tense", q: "Last summer, Ana ___ to Japan, where she learned to make sushi.",
    a: "traveled", w: ["travels", "has traveled", "will travel"],
    explain: "'Last summer' signals a completed past action, so use the simple past." },

  { type: "punct", q: "Which choice uses punctuation correctly?",
    a: "The recipe calls for three ingredients: flour, sugar, and eggs.",
    w: ["The recipe calls for three ingredients flour, sugar, and eggs.", "The recipe calls for three ingredients; flour, sugar, and eggs.", "The recipe calls for: three ingredients flour sugar and eggs."],
    explain: "A colon introduces a list after a complete clause, and the list uses commas." },
  { type: "punct", q: "Which choice correctly punctuates: \"My brother who lives in Denver is a nurse.\"",
    a: "My brother, who lives in Denver, is a nurse.",
    w: ["My brother who lives in Denver, is a nurse.", "My brother, who lives in Denver is a nurse.", "My brother who lives in Denver is, a nurse."],
    explain: "A non-essential clause needs a comma before and after it." },

  { type: "modifiers", q: "Which revision fixes the misplaced modifier in: \"Walking home, the streetlights came on.\"",
    a: "As I walked home, the streetlights came on.",
    w: ["Walking home, the streetlights came on quickly.", "The streetlights came on, walking home.", "Walking home, streetlights came on."],
    explain: "The modifier 'walking home' must describe the person, so name the person as the subject." },
  { type: "modifiers", q: "Which revision fixes the dangling modifier in: \"After finishing the report, the coffee went cold.\"",
    a: "After I finished the report, I noticed the coffee had gone cold.",
    w: ["After finishing the report, the coffee went cold.", "The coffee went cold after finishing the report.", "After finishing the report, coffee went cold."],
    explain: "'After finishing the report' must modify a person, so add the person as the subject." },

  { type: "concision", q: "Which choice is the most concise? \"In the event that it rains, the game will be postponed.\"",
    a: "If it rains, the game will be postponed.",
    w: ["If it should happen to rain, the game will be postponed.", "In the event of rain, the game is going to be postponed.", "In the event that it rains, the game will be postponed."],
    explain: "'If' says the same thing in fewer words." },
  { type: "concision", q: "Which choice is the most concise? \"The results were of a surprising nature and were quite unexpected.\"",
    a: "The results were surprising.",
    w: ["The results were of a surprising nature.", "The results were quite unexpected and surprising.", "The results were, in a sense, surprising and unexpected."],
    explain: "The short version keeps the meaning without the repeated ideas." },

  { type: "purpose", q: "A writer describing a bakery says: \"The smell of cinnamon drifted through the doorway.\" The sentence mainly serves to:",
    a: "create a vivid sensory image of the bakery.",
    w: ["state the bakery's opening hours.", "argue that bakeries are better than cafés.", "explain how cinnamon is grown."],
    explain: "The sentence appeals to smell to make the scene concrete." },
  { type: "purpose", q: "A biologist writes: \"Though the reef looks healthy, its colors are fading.\" The opening clause mainly serves to:",
    a: "introduce a contrast that sets up the main concern.",
    w: ["confirm that the reef is healthy.", "list the reef's most common species.", "apologize for an earlier mistake."],
    explain: "'Though' sets up a contrast with the concern that follows." },
];

// ---------- helpers ----------
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = rnd(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (n, d) => { const g = gcd(n, d) || 1; return `${n / g}/${d / g}`; };
const sgn = n => (n < 0 ? `- ${-n}` : `+ ${n}`);

// Builds 4 unique choices. Returns {choices, answer index}.
function mc(correct, wrongs) {
  const set = [String(correct)];
  for (const w of wrongs) if (set.length < 4 && !set.includes(String(w))) set.push(String(w));
  for (let k = 1; set.length < 4 && k < 30 && !isNaN(Number(correct)); k++) {
    const c = String(Number(correct) + (k + 1) * (k % 2 ? 1 : -1));
    if (!set.includes(c)) set.push(c);
  }
  while (set.length < 4) set.push("—" + set.length);
  const choices = shuffle(set);
  return { choices, answer: choices.indexOf(String(correct)) };
}
const mk = (type, q, r, explain) => ({ type, q, choices: r.choices, answer: r.answer, explain });

// ---------- math generators (d = difficulty 1..5) ----------
const GEN = {
  linear(d) {
    const x = rnd(-4 - d, 8 + 2 * d), a = pick([2, 3, 4, 5, 6, 7, 8, 9]), b = rnd(-10 * d, 10 * d) || 3, c = a * x + b;
    return mk("linear", `Solve for x: ${a}x ${sgn(b)} = ${c}`, mc(x, [x + 1, x - 1, -x, x + a]),
      `Move the constant to the right: ${a}x = ${c - b}. Divide by ${a}: x = ${x}.`);
  },
  systems(d) {
    const x = rnd(-3 - d, 5 + 2 * d), y = rnd(-3 - d, 5 + 2 * d), S = x + y, D = x - y;
    return mk("systems", `x + y = ${S}\nx - y = ${D}\nWhat is the value of x?`, mc(x, [y, S, D, x + 1]),
      `Add the equations: 2x = ${S + D}, so x = ${x}.`);
  },
  slope() {
    const m = pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]), x1 = rnd(-5, 5), x2 = x1 + pick([1, 2, 3, 4]), b = rnd(-8, 8);
    const y1 = m * x1 + b, y2 = m * x2 + b;
    return mk("slope", `What is the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2})?`, mc(m, [-m, m + 1, m - 1, b]),
      `Slope = (y2 - y1) / (x2 - x1) = (${y2 - y1}) / (${x2 - x1}) = ${m}.`);
  },
  percent() {
    const P = 20 * rnd(2, 20), dsc = 5 * rnd(1, 8), price = (P * (100 - dsc)) / 100;
    return mk("percent", `A jacket costs $${P}. It is on sale for ${dsc}% off. What is the sale price?`,
      mc(`$${price}`, [`$${P - dsc}`, `$${price + dsc}`, `$${(P * dsc) / 100}`]),
      `${dsc}% of $${P} is $${(P * dsc) / 100}, so the sale price is $${P} - $${(P * dsc) / 100} = $${price}.`);
  },
  ratio() {
    const a = rnd(2, 7); let b = rnd(2, 7); while (b === a) b = rnd(2, 7);
    const k = rnd(2, 9), total = (a + b) * k;
    return mk("ratio", `The ratio of red to blue marbles is ${a}:${b}. There are ${total} marbles in all. How many are red?`,
      mc(a * k, [b * k, total, a + b, (a + 1) * k]),
      `The parts add to ${a + b}, so each part is ${total} / ${a + b} = ${k}. Red = ${a} x ${k} = ${a * k}.`);
  },
  exponents() {
    const a = rnd(1, 6), b = rnd(1, 6), v = 2 ** (a + b);
    return mk("exponents", `What is the value of 2^${a} x 2^${b}?`, mc(v, [v * 2, v / 2, 2 ** Math.abs(a - b), v + a]),
      `Same base, so add exponents: 2^${a} x 2^${b} = 2^${a + b} = ${v}.`);
  },
  expand(d) {
    const p = rnd(-3 - d, 3 + d) || 2, q = rnd(-3 - d, 3 + d) || -2;
    return mk("expand", `Expand (x ${sgn(p)})(x ${sgn(q)}). What is the coefficient of x?`, mc(p + q, [p * q, p - q, -(p + q), q]),
      `The x-term comes from ${p} + ${q} = ${p + q}, so the coefficient is ${p + q}.`);
  },
  ineq(d) {
    const a = rnd(2, 5 + d), b = rnd(-10 * d, 10 * d), c = rnd(-15 * d, 15 * d), t = (c - b) / a, ans = Math.floor(t) + 1;
    return mk("ineq", `What is the smallest integer x that satisfies ${a}x ${sgn(b)} > ${c}?`, mc(ans, [ans - 1, ans + 1, Math.ceil(t), ans + 2]),
      `Subtract ${b}: ${a}x > ${c - b}. Divide by ${a}: x > ${t.toFixed(2)}. The smallest integer above that is ${ans}.`);
  },
  mean(d) {
    const M = rnd(62 + d, 80 + d), v = [rnd(55, 75), rnd(55, 75), rnd(55, 75), rnd(55, 75)];
    const sum = v.reduce((a, b) => a + b, 0), fifth = 5 * M - sum;
    return mk("mean", `Five numbers have a mean of ${M}. Four of them are ${v.join(", ")}. What is the fifth number?`,
      mc(fifth, [M, fifth + 5, fifth - 5, 4 * M - fifth]),
      `The five numbers sum to 5 x ${M} = ${5 * M}. Subtract the known four (${sum}) to get ${fifth}.`);
  },
  prob() {
    const r = rnd(2, 9), g = rnd(2, 9), n = r + g;
    return mk("prob", `A bag has ${r} red and ${g} green marbles. One is picked at random. What is the probability it is red?`,
      mc(frac(r, n), [frac(g, n), frac(r, g), frac(r - 1, n - 1), frac(r, n + r)]),
      `Favorable / total = ${r}/${n}, which simplifies to ${frac(r, n)}.`);
  },
  area(d) {
    const L = rnd(3, 12 + d), W = rnd(2, 10 + d), P = 2 * (L + W);
    return mk("area", `A rectangle has a perimeter of ${P} units and a length of ${L} units. What is its area?`,
      mc(L * W, [L + W, P, L * W + L, L * L]),
      `Width = ${P} / 2 - ${L} = ${W}. Area = ${L} x ${W} = ${L * W} square units.`);
  },
  speed() {
    const s = pick([8, 12, 16, 20, 24, 28, 32, 36, 40]), m = pick([15, 30, 45, 60, 75, 90]), D = (s * m) / 60;
    return mk("speed", `A cyclist rides ${D} miles at a steady ${s} mph. How many minutes does the ride take?`,
      mc(m, [m + 15, m - 15, 60, D]),
      `Time = ${D} / ${s} = ${m / 60} hours. Multiply by 60 to get ${m} minutes.`);
  },
};

// Returns one question object: {type, q, choices, answer, explain}
function makeQuestion(typeId, d = 1) {
  const t = TYPES.find(x => x.id === typeId);
  if (t.sec === "rw") {
    const it = pick(RW.filter(x => x.type === typeId));
    const r = mc(it.a, it.w);
    return { type: typeId, q: it.q, choices: r.choices, answer: r.answer, explain: it.explain };
  }
  return GEN[typeId](d);
}
