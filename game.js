// game.js: the Kryllion game layer for SAT Quest.
// Loads after the question engine and before app.js. Holds the game rules (XP, mastery, ranks,
// missions, anomalies, achievements) as pure functions over profile.game, so the rules can be
// tested without a browser. app.js renders the screens.
//
// LORE: no Kryllion story existed in the codebase, so this is an original starting point.
// All story text lives in KRY_LORE and the SECTOR names below; edit them freely.

const KRY_LORE = {
  title: "The Kryllion Network",
  intro: "Kryllion is a relay network of eight sectors that once carried knowledge across the system. It has gone dark. Every correct answer sends signal back through a relay. Restore the sectors, repair the anomalies your mistakes leave behind, and rise through the ranks.",
  coreName: "Kryllion Core",
};

// One sector per official SAT domain; one relay per official skill.
const SECTORS = {
  ii:   { name: "Archive of Ideas",    code: "II", hint: "Information and Ideas" },
  cs:   { name: "Structure Spire",     code: "CS", hint: "Craft and Structure" },
  eoi:  { name: "Expression Array",    code: "EI", hint: "Expression of Ideas" },
  sec:  { name: "Conventions Grid",    code: "SC", hint: "Standard English Conventions" },
  alg:  { name: "Algebra Belt",        code: "AL", hint: "Algebra" },
  adv:  { name: "Nonlinear Expanse",   code: "AM", hint: "Advanced Math" },
  psda: { name: "Data Nebula",         code: "PD", hint: "Problem-Solving and Data Analysis" },
  geo:  { name: "Geometry Station",    code: "GT", hint: "Geometry and Trigonometry" },
};

const RANKS = [
  [0, "Cadet"], [300, "Signal Runner"], [900, "Navigator"], [2000, "Pathfinder"],
  [4000, "Relay Engineer"], [7000, "Commander"], [11000, "Vanguard"], [16000, "Kryllion Architect"],
];
const TIERS = ["Offline", "Calibrating", "Stable", "Charged", "Mastered"];
const DIFF_XP = { easy: 10, medium: 15, hard: 25 };
const DIFF_W = { easy: 0.6, medium: 1, hard: 1.4 };

const MISSIONS = {
  patrol: { name: "Patrol",          diff: "adaptive", count: 6, pass: 0.6, xp: 40,  desc: "Mixed questions across this sector. Difficulty adapts to you." },
  scan:   { name: "Deep Scan",       diff: "medium",   count: 8, pass: 0.7, xp: 80,  desc: "Medium questions. Unlocks when any relay here is Stable.", req: "Stabilize one relay in this sector" },
  rift:   { name: "Rift Run",        diff: "hard",     count: 8, pass: 0.6, xp: 160, desc: "Hard questions only. Unlocks when half the relays here are Charged.", req: "Charge half the relays in this sector" },
  trial:  { name: "Mastery Trial",   diff: "hard",     count: 5, pass: 0.8, xp: 120, desc: "Five hard questions on one skill. Pass 4 of 5 to master the relay.", req: "Charge this relay first" },
  daily:  { name: "Daily Operation", diff: "adaptive", count: 6, pass: 0.5, xp: 60,  desc: "Six questions aimed at your weakest relays. Full reward once per day." },
  repair: { name: "Repair Run",      diff: "adaptive", count: 5, pass: 0,   xp: 0,   desc: "New questions on the skills behind your anomalies. Each correct answer repairs one." },
};

const ACHIEVEMENTS = [
  ["first-signal", "First Signal",      "Answer your first question correctly.", 20],
  ["first-mission","Mission Log",       "Complete any mission.", 30],
  ["flawless",     "Flawless Run",      "Finish a mission of 5+ questions with every answer correct.", 60],
  ["hard-10",      "Rift Walker",       "Answer 10 hard questions correctly.", 80],
  ["repair-5",     "Field Engineer",    "Repair 5 anomalies.", 60],
  ["repair-25",    "Chief Engineer",    "Repair 25 anomalies.", 150],
  ["both",         "Dual Systems",      "Complete missions in both Reading and Writing and Math sectors.", 50],
  ["charged",      "Charged Relay",     "Bring any relay to Charged.", 60],
  ["comeback",     "Recovery",          "Raise a relay from Calibrating to Charged.", 100],
  ["trial",        "Master of One",     "Pass a Mastery Trial.", 120],
  ["sector-50",    "Sector Restored",   "Restore any sector to 50%.", 100],
  ["streak-3",     "Three-Day Orbit",   "Keep a 3-day streak.", 40],
  ["streak-7",     "Full Rotation",     "Keep a 7-day streak.", 120],
  ["daily-5",      "Operations Lead",   "Complete 5 Daily Operations.", 80],
  ["campaign-10",  "Campaign Veteran",  "Finish level 10 of the campaign.", 60],
];

// ---------- state ----------
function gameState(profile) {
  const g = profile.game || (profile.game = {});
  g.hist = g.hist || {};          // skill -> last 20 [diffCode, ok]
  g.anomalies = g.anomalies || []; // [{id, skill, sub, qid, at}]
  g.repaired = g.repaired || 0;
  g.hardCorrect = g.hardCorrect || 0;
  g.correct = g.correct || 0;
  g.missions = g.missions || {};   // missionKey -> {runs, best}
  g.trials = g.trials || {};       // skill -> true when passed
  g.ach = g.ach || {};             // id -> timestamp
  g.daily = g.daily || { last: null, count: 0 };
  g.sectorsPlayed = g.sectorsPlayed || {};
  g.wasCalibrating = g.wasCalibrating || {};
  g.rewarded = g.rewarded || [];   // recent question run keys that already paid XP
  g.nextAnomalyId = g.nextAnomalyId || 1;
  return g;
}

// ---------- mastery ----------
function skillMastery(profile, skillId) {
  const g = gameState(profile), h = g.hist[skillId] || [];
  if (!h.length) return { score: 0, n: 0, tier: 0 };
  let num = 0, den = 0;
  h.forEach(([d, ok]) => { const w = DIFF_W[DIFFS[d]]; den += w; if (ok) num += w; });
  const coverage = Math.min(1, h.length / 8);
  const score = Math.round((num / den) * 100 * coverage);
  let tier = score < 40 ? 1 : score < 70 ? 2 : 3;
  if (g.trials[skillId] && score >= 70) tier = 4;
  return { score, n: h.length, tier };
}
function sectorStatus(profile, domId) {
  const skills = SKILLS.filter(s => s.dom === domId);
  const ms = skills.map(s => ({ skill: s, ...skillMastery(profile, s.id) }));
  const pct = Math.round(ms.reduce((a, m) => a + (m.tier === 4 ? 100 : m.score), 0) / ms.length);
  return { skills: ms, pct, stable: ms.filter(m => m.tier >= 2).length, charged: ms.filter(m => m.tier >= 3).length, total: ms.length };
}
function coreStatus(profile) {
  const s = DOMAINS.map(d => sectorStatus(profile, d.id).pct);
  return Math.round(s.reduce((a, b) => a + b, 0) / s.length);
}
function rankFor(xp) {
  let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
  const next = RANKS[i + 1];
  return { index: i, name: RANKS[i][1], floor: RANKS[i][0], next: next ? next[0] : null, nextName: next ? next[1] : null,
           progress: next ? (xp - RANKS[i][0]) / (next[0] - RANKS[i][0]) : 1 };
}

// ---------- mission availability ----------
function missionUnlocked(profile, type, domId, skillId) {
  if (type === "patrol" || type === "daily" || type === "repair") return true;
  if (type === "trial") return skillMastery(profile, skillId).tier >= 3;
  const st = sectorStatus(profile, domId);
  if (type === "scan") return st.stable >= 1;
  if (type === "rift") return st.charged >= Math.ceil(st.total / 2);
  return false;
}
const missionKey = (type, domId, skillId) => [type, domId || "", skillId || ""].join(":");
const today = () => new Date().toDateString();

// ---------- answering ----------
// Called once per answered question. Returns {xp, events:[{kind, text}]}.
// runKey makes XP payable only once per question per run, so re-submitting cannot farm XP.
function gameOnAnswer(profile, q, ok, ctx = {}) {
  const g = gameState(profile), events = [];
  const before = skillMastery(profile, q.skill);
  const runKey = (ctx.runId || "") + "|" + q.id + "|" + (ctx.index ?? "");
  const already = g.rewarded.includes(runKey);
  const h = g.hist[q.skill] || (g.hist[q.skill] = []);
  h.push([DIFFS.indexOf(q.diff), ok ? 1 : 0]); if (h.length > 20) h.shift();
  let xp = 0;
  if (ok && !already && !q.retry) {
    xp = DIFF_XP[q.diff];
    // Mastered relays pay less for easy questions, so the best rewards come from stretching.
    if (before.tier >= 3 && q.diff === "easy") xp = Math.round(xp / 2);
    g.correct++; if (q.diff === "hard") g.hardCorrect++;
  }
  if (!already) { g.rewarded.push(runKey); if (g.rewarded.length > 400) g.rewarded.splice(0, g.rewarded.length - 400); }

  if (ok) {
    // A correct answer on a NEW question of an anomaly's question type repairs it.
    const idx = g.anomalies.findIndex(a => a.sub === q.sub && a.qid !== q.id);
    if (idx >= 0 && !q.retry) {
      g.anomalies.splice(idx, 1); g.repaired++; xp += 10;
      events.push({ kind: "repair", text: `Anomaly repaired: ${subtypeName(q.skill, q.sub)}` });
    } else events.push({ kind: "signal", text: `Signal restored to ${skillById(q.skill).name}` });
  } else if (!q.retry) {
    if (!g.anomalies.some(a => a.qid === q.id)) {
      g.anomalies.push({ id: g.nextAnomalyId++, skill: q.skill, sub: q.sub, qid: q.id, at: Date.now() });
      if (g.anomalies.length > 40) g.anomalies.shift();
    }
    events.push({ kind: "anomaly", text: `Anomaly logged: ${subtypeName(q.skill, q.sub)}. Repair it in the Repair Bay.` });
  }
  const after = skillMastery(profile, q.skill);
  if (before.tier === 1 && before.n >= 8) g.wasCalibrating[q.skill] = true;   // a real low score, not just too little data
  if (after.tier > before.tier && after.tier >= 2) {
    xp += 15 * after.tier;
    events.push({ kind: "tier", text: `${skillById(q.skill).name} relay is now ${TIERS[after.tier]}` });
  }
  const unlocked = checkAchievements(profile);
  unlocked.forEach(a => { xp += a[3]; events.push({ kind: "ach", text: `Achievement: ${a[1]}` }); });
  return { xp, events };
}

// Mission end. Returns {xp, passed, events}. Completion reward is paid once per run.
function gameOnMissionEnd(profile, m, stats) {
  const g = gameState(profile), def = MISSIONS[m.type], events = [];
  if (m.paid) return { xp: 0, passed: m.passed, events };
  m.paid = true;
  const acc = stats.attempts ? stats.correct / stats.attempts : 0;
  const finished = stats.attempts >= Math.min(def.count, 1);
  const passed = finished && acc >= def.pass && stats.attempts >= Math.ceil(def.count * 0.8);
  m.passed = passed;
  let xp = 0;
  const key = missionKey(m.type, m.dom, m.skill);
  const rec = g.missions[key] || (g.missions[key] = { runs: 0, best: 0 });
  rec.runs++; rec.best = Math.max(rec.best, Math.round(acc * 100));
  if (passed) {
    xp = Math.round(def.xp * (0.5 + acc / 2));                         // accuracy-scaled reward
    if (m.type === "daily") {
      if (g.daily.last === today()) { xp = Math.round(xp / 4); events.push({ kind: "info", text: "Daily Operation already completed today: reduced reward." }); }
      else { g.daily.last = today(); g.daily.count++; }
    }
    if (m.type === "trial" && m.skill) { g.trials[m.skill] = true; events.push({ kind: "tier", text: `${skillById(m.skill).name} relay MASTERED` }); }
    if (m.dom) g.sectorsPlayed[domainById(m.dom).sec] = true;
    else if (m.secs) m.secs.forEach(s => (g.sectorsPlayed[s] = true));
    events.unshift({ kind: "mission", text: `${def.name} complete` });
  } else if (m.type !== "repair") events.unshift({ kind: "info", text: `${def.name} not passed (needs ${Math.round(def.pass * 100)}%). Your anomalies are waiting in the Repair Bay.` });
  else events.unshift({ kind: "mission", text: "Repair run complete" });
  g.missionsDone = (g.missionsDone || 0) + (passed || m.type === "repair" ? 1 : 0);
  checkAchievements(profile).forEach(a => { xp += a[3]; events.push({ kind: "ach", text: `Achievement: ${a[1]}` }); });
  if (passed && stats.attempts >= 5 && stats.correct === stats.attempts) {
    // flawless is checked here because it depends on this run
    if (!g.ach["flawless"]) { g.ach["flawless"] = Date.now(); const a = ACHIEVEMENTS.find(x => x[0] === "flawless"); xp += a[3]; events.push({ kind: "ach", text: "Achievement: " + a[1] }); }
  }
  return { xp, passed, events };
}

function checkAchievements(profile) {
  const g = gameState(profile), got = [];
  const test = {
    "first-signal": () => g.correct >= 1,
    "first-mission": () => (g.missionsDone || 0) >= 1,
    "hard-10": () => g.hardCorrect >= 10,
    "repair-5": () => g.repaired >= 5,
    "repair-25": () => g.repaired >= 25,
    "both": () => g.sectorsPlayed.rw && g.sectorsPlayed.math,
    "charged": () => SKILLS.some(s => skillMastery(profile, s.id).tier >= 3),
    "comeback": () => SKILLS.some(s => g.wasCalibrating[s.id] && skillMastery(profile, s.id).tier >= 3),
    "trial": () => Object.keys(g.trials).length >= 1,
    "sector-50": () => DOMAINS.some(d => sectorStatus(profile, d.id).pct >= 50),
    "streak-3": () => (profile.streak || 0) >= 3,
    "streak-7": () => (profile.streak || 0) >= 7,
    "daily-5": () => g.daily.count >= 5,
    "campaign-10": () => !!(profile.done && profile.done[10]),
  };
  for (const a of ACHIEVEMENTS) if (!g.ach[a[0]] && test[a[0]] && test[a[0]]()) { g.ach[a[0]] = Date.now(); got.push(a); }
  return got;
}

// Weakest relays for the Daily Operation: low score first, untried skills last.
function weakRelays(profile, n) {
  return SKILLS.map(s => ({ s, m: skillMastery(profile, s.id) }))
    .sort((a, b) => (a.m.n ? a.m.score : 101) - (b.m.n ? b.m.score : 101))
    .slice(0, n).map(x => x.s.id);
}
