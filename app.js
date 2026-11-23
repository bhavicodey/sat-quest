// app.js: SAT Quest main app (screens, lessons, progress, Google sign-in)

// >>> Paste your Google OAuth Web Client ID here. Leave as-is to use guest mode only.
const GOOGLE_CLIENT_ID = "54844873818-fk2mm0gqvatc25pcaf18qf3lb8j1ddt6.apps.googleusercontent.com";

const TOTAL_LEVELS = 100;
const POINTS_PER_LEVEL = 12;   // 400 -> 1600 is 1200 points spread over 100 levels
const PASS_ACCURACY = 0.6;
const UNITS = ["Warm-Up", "Word Power", "Grammar Gym", "Number Sense", "Equation Lab",
               "Data Detectives", "Geometry Garden", "Rhetoric Rock", "Advanced Algebra", "Final Boss Zone"];
const FOX = "🦊";

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
let profile = null;                                  // {start, target, done, stats, xp, streak, lastDay}
let L = null;                                        // active lesson state

const profileKey = () => "satquest:profile:" + (session ? session.sub : "guest");
function loadProfile() { profile = store.get(profileKey(), null); }
function saveProfile() { store.set(profileKey(), profile); }

// ---------- small UI helpers ----------
function openModal(html) { modal.innerHTML = `<div class="card">${html}</div>`; modal.classList.remove("hidden"); }
function closeModal() { modal.classList.add("hidden"); modal.innerHTML = ""; }
modal.onclick = e => { if (e.target === modal) closeModal(); };

function floatXP(text) {
  const el = document.createElement("div");
  el.className = "xp-pop";
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}
function bump(sel) {
  const el = $(sel);
  if (!el) return;
  el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
}
function confetti() {
  const box = document.createElement("div");
  box.className = "confetti";
  const cols = ["#ff4fd8", "#33e1ff", "#b6ff4a", "#ffd23f", "#8b5cf6", "#ff5d6c"];
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("span");
    s.style.left = Math.random() * 100 + "%";
    s.style.background = cols[i % cols.length];
    s.style.animationDuration = (1.8 + Math.random() * 1.8) + "s";
    s.style.animationDelay = Math.random() * 0.6 + "s";
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4500);
}

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
  store.del("satquest:session");
  session = null; profile = null;
  renderAuth();
}

// ---------- screens ----------
function renderAuth() {
  app.innerHTML = `
  <div class="screen">
    <div class="hero" style="margin-top:44px">
      <div class="fox wave">${FOX}</div>
      <div class="garland"></div>
      <div class="title">🎄 SAT Quest 🎄</div>
      <p class="muted enter" style="--d:.2s;font-size:16px">24 question types. 100 levels.<br>Deck the halls with a higher score. ❄️</p>
    </div>
    <div class="card enter" style="--d:.35s;margin-top:28px;display:grid;gap:14px;justify-items:center">
      <div id="gbtn"></div>
      <button class="btn alt" id="guest">Play as guest ⚡</button>
      <p class="muted small" style="text-align:center;margin:0">Guest progress stays on this device.</p>
    </div>
  </div>`;
  $("#guest").onclick = () => signIn({ name: "Guest", sub: "guest", picture: "" });
  initGoogle();
}

function renderOnboarding() {
  app.innerHTML = `
  <div class="screen">
    <div class="hero enter" style="margin-top:20px">
      <div class="fox">${FOX}</div>
      <h2 style="margin:8px 0 0;font-size:28px">Hey ${esc(session.name)}! Set your goal</h2>
    </div>
    <div class="card enter" style="--d:.15s;margin-top:18px">
      <div class="label">Where are you right now?</div>
      <div class="big" id="startVal"></div>
      <input type="range" id="start" min="400" max="1600" step="10" value="1000">
      <div class="label" style="margin-top:20px">What's your target?</div>
      <div class="big" id="targetVal"></div>
      <input type="range" id="target" min="400" max="1600" step="10" value="1400">
      <p class="muted" id="plan" style="text-align:center;margin:6px 0 0"></p>
    </div>
    <button class="btn enter" style="--d:.3s;margin-top:18px" id="go">Start my quest 🚀</button>
  </div>`;

  const s = $("#start"), t = $("#target"), go = $("#go");
  const refresh = () => {
    const start = +s.value, target = +t.value, ok = target > start;
    $("#startVal").textContent = start;
    $("#targetVal").textContent = target;
    const levels = Math.ceil((target - start) / POINTS_PER_LEVEL);
    $("#plan").textContent = ok
      ? `About ${levels} levels to go. One level a day gets you there in about ${levels} days.`
      : "Your target needs to be higher than where you are now.";
    go.disabled = !ok;
  };
  s.oninput = refresh; t.oninput = refresh; refresh();
  go.onclick = () => {
    profile = { start: +s.value, target: +t.value, done: {}, stats: {}, xp: 0, streak: 0, lastDay: null };
    saveProfile();
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
function ringHTML(pct, label) {
  const off = RING_C * (1 - Math.min(pct, 100) / 100);
  return `<div class="ring">
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle class="track" cx="55" cy="55" r="48" fill="none" stroke-width="10"/>
      <circle class="val" cx="55" cy="55" r="48" fill="none" stroke-width="10"
        stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}" data-to="${off}"/>
    </svg>
    <div class="num">${label}</div>
  </div>`;
}

function renderMap() {
  const done = levelsDone();
  const next = nextLevel();
  let path = "";
  for (let n = 1; n <= TOTAL_LEVELS; n++) {
    if ((n - 1) % 10 === 0) {
      const u = (n - 1) / 10;
      path += `<div class="unit">Unit ${u + 1} · ${UNITS[u]}</div>`;
    }
    const st = levelState(n), boss = n % 10 === 0, stars = profile.done[n] || 0;
    const x = Math.round(Math.sin(n * 0.8) * 70);
    const label = st === "locked" ? "🔒" : (boss ? "👑" : n);
    const delay = Math.min((n - 1) % 10, 9) * 0.05;
    const you = n === next ? `<span class="you">YOU</span>` : "";
    path += `<button class="node ${st}${boss ? " boss" : ""}" data-n="${n}" style="transform:translateX(${x}px);--d:${delay}s" ${st === "locked" ? "disabled" : ""}>${you}${label}${stars ? `<span class="stars">${"★".repeat(stars)}</span>` : ""}</button>`;
  }

  app.innerHTML = `
  <div class="screen">
    <div class="topbar" style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap">
      <div class="pill" id="streakPill">🔥 ${profile.streak}</div>
      <div class="pill" id="xpPill">⚡ ${profile.xp} XP</div>
      <button class="pill" id="skillsBtn">📊 Skills</button>
      <button class="pill" id="outBtn">Sign out</button>
    </div>
    <div class="card enter" style="margin-top:16px;display:flex;gap:16px;align-items:center">
      ${ringHTML(done, `${done}%`)}
      <div style="flex:1;min-width:0">
        <div class="label">Goal</div>
        <div style="font-size:24px;font-weight:1000">${profile.start} → ${profile.target}</div>
        <div class="muted small" style="margin-top:6px">${done}/${TOTAL_LEVELS} levels · Projected <b style="color:var(--lime)">${projected()}</b></div>
        <div class="muted small" style="margin-top:4px;opacity:.7">Projection is a motivational estimate, not a real prediction.</div>
      </div>
    </div>
    <div class="path">${path}</div>
  </div>`;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const c = app.querySelector(".ring .val");
    if (c) c.style.strokeDashoffset = c.dataset.to;
  }));
  app.querySelectorAll(".node").forEach(b => b.onclick = () => startLesson(+b.dataset.n));
  $("#skillsBtn").onclick = showSkills;
  $("#outBtn").onclick = signOut;
  const el = document.querySelector(`[data-n="${next}"]`);
  if (el) setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 400);
}

function showSkills() {
  const rows = TYPES.map((t, i) => {
    const s = profile.stats[t.id] || { c: 0, t: 0 };
    const pct = s.t ? Math.round((s.c / s.t) * 100) : 0;
    return `<div class="skill"><span>${t.name}</span><span class="muted small">${s.t ? pct + "%" : "not yet"}</span></div>
            <div class="bar"><i style="width:${pct}%;transition-delay:${i * 0.02}s"></i></div>`;
  }).join("");
  openModal(`<h3 style="margin-top:0;font-size:24px">Skill mastery</h3>
    <p class="muted small">Your accuracy on each SAT question type.</p>${rows}
    <button class="btn ghost" id="closeM" style="margin-top:20px">Close</button>`);
  $("#closeM").onclick = closeModal;
}

// ---------- lessons ----------
function startLesson(n) {
  const boss = n % 10 === 0;
  const base = boss ? 10 : 8;
  const d = Math.ceil(n / 20);                 // difficulty 1..5 across the 100 levels
  const qs = [];
  for (let j = 0; j < base; j++) qs.push(makeQuestion(TYPES[(n * 8 + j) % TYPES.length].id, d));
  L = { n, boss, qs, base, i: 0, hearts: 3, correct: 0, attempts: 0, sel: null, answered: false, xpGain: 0 };
  renderQuestion(true);
}

function heartsHTML(animateLast) {
  let h = "";
  for (let k = 0; k < 3; k++) {
    const alive = k < L.hearts;
    const cls = alive ? "heart" + (animateLast && k === L.hearts - 1 ? " new" : "") : "heart lost";
    h += `<span class="${cls}">♥</span>`;
  }
  return h;
}

function renderQuestion(first) {
  const q = L.qs[L.i];
  const type = TYPES.find(t => t.id === q.type);
  const pct = Math.min(100, Math.round((L.i / L.base) * 100));
  app.innerHTML = `
  <div class="screen">
    <div class="topbar" style="display:flex;align-items:center">
      <button class="pill" id="quit">✕</button>
      <div class="bar progress-wrap"><i style="width:${pct}%"></i></div>
      <div class="pill hearts" id="hearts">${heartsHTML(false)}</div>
    </div>
    <div class="card qcard ${first ? "" : "qcard"}" style="margin-top:16px">
      <span class="chip">${type.sec === "math" ? "🧮" : "📖"} ${type.name}</span>
      <p class="qtext">${esc(q.q)}</p>
      <div id="choices">${q.choices.map((c, k) => `<button class="choice" data-k="${k}" style="--d:${0.08 + k * 0.06}s">${esc(c)}</button>`).join("")}</div>
      <div id="fb"></div>
    </div>
    <div style="margin-top:16px"><button class="btn" id="action" disabled>Check</button></div>
  </div>`;

  app.querySelectorAll(".choice").forEach(b => b.onclick = () => {
    if (L.answered) return;
    L.sel = +b.dataset.k;
    app.querySelectorAll(".choice").forEach(x => x.classList.toggle("sel", x === b));
    $("#action").disabled = false;
  });
  $("#action").onclick = () => (L.answered ? nextQuestion() : check());
  $("#quit").onclick = () => { if (confirm("Leave this lesson? Progress on it is lost.")) renderMap(); };
}

function check() {
  if (L.sel === null) return;
  const q = L.qs[L.i];
  const ok = L.sel === q.answer;
  L.answered = true;
  L.attempts++;

  const s = profile.stats[q.type] || (profile.stats[q.type] = { c: 0, t: 0 });
  s.t++; if (ok) s.c++;

  if (ok) {
    L.correct++;
    L.xpGain += 10;
    floatXP("+10 XP");
  } else {
    L.hearts = Math.max(0, L.hearts - 1);
    if (!q.retry) L.qs.push({ ...q, retry: true }); // missed questions come back once
    $("#hearts").innerHTML = heartsHTML(false);
  }

  app.querySelectorAll(".choice").forEach((b, k) => {
    b.disabled = true;
    if (k === q.answer) b.classList.add("right");
    else if (k === L.sel) b.classList.add("wrong");
  });
  $("#fb").innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}">${ok ? "🎉 Nailed it! " : "Not quite. "}${esc(q.explain)}</div>`;
  const action = $("#action");
  action.textContent = L.hearts <= 0 ? "See results" : "Continue";
  action.disabled = false;
  action.className = ok ? "btn" : "btn alt";
}

function nextQuestion() {
  L.answered = false; L.sel = null;
  if (L.hearts <= 0) return finishLesson();
  L.i++;
  if (L.i >= L.qs.length) return finishLesson();
  const card = app.querySelector(".qcard");
  if (card) card.classList.add("leave");
  setTimeout(() => renderQuestion(false), 240);
}

function updateStreak() {
  const today = new Date().toDateString();
  if (profile.lastDay === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  profile.streak = profile.lastDay === yesterday ? profile.streak + 1 : 1;
  profile.lastDay = today;
}

function finishLesson() {
  const acc = L.attempts ? L.correct / L.attempts : 0;
  const outOfHearts = L.hearts <= 0;
  const passed = !outOfHearts && acc >= PASS_ACCURACY;
  const stars = acc >= 0.9 ? 3 : acc >= 0.75 ? 2 : 1;
  const gain = L.xpGain + (passed ? 25 + (L.boss ? 50 : 0) : 0);

  if (passed) profile.done[L.n] = Math.max(profile.done[L.n] || 0, stars);
  profile.xp += gain;
  updateStreak();
  saveProfile();
  renderResult({ passed, outOfHearts, stars, acc, gain, n: L.n });
}

function renderResult(r) {
  const title = r.passed ? (L.boss ? "Boss defeated!" : "Level complete!")
                         : (r.outOfHearts ? "Out of hearts" : "So close!");
  const sub = r.outOfHearts ? "Hearts refill when you try again."
                            : `You need ${Math.round(PASS_ACCURACY * 100)}% accuracy to unlock the next level.`;
  const starRow = [0, 1, 2].map(k =>
    `<span class="${k < r.stars ? "" : "off"}" style="--d:${0.3 + k * 0.2}s">★</span>`).join("");
  app.innerHTML = `
  <div class="screen">
    <div class="hero" style="margin-top:24px">
      <div class="fox pop" style="font-size:96px">${r.passed ? "🎉" : "🫠"}</div>
      <div class="title enter" style="--d:.15s;font-size:38px">${title}</div>
      ${r.passed
        ? `<div class="stars-big">${starRow}</div>`
        : `<p class="muted enter" style="--d:.2s">${sub}</p>`}
    </div>
    <div class="card enter" style="--d:.45s;margin-top:20px">
      <div class="row-stat"><span>Accuracy</span><span>${Math.round(r.acc * 100)}%</span></div>
      <div class="row-stat"><span>Correct</span><span>${L.correct} of ${L.attempts}</span></div>
      <div class="row-stat"><span>XP earned</span><span style="color:var(--gold)">+${r.gain}</span></div>
      <div class="row-stat"><span>Streak</span><span>🔥 ${profile.streak} day${profile.streak === 1 ? "" : "s"}</span></div>
    </div>
    <div class="enter" style="--d:.6s;margin-top:20px;display:grid;gap:12px">
      ${r.passed && r.n < TOTAL_LEVELS ? `<button class="btn" id="nxt">Next level →</button>` : ""}
      ${r.passed ? "" : `<button class="btn" id="retry">Try again</button>`}
      <button class="btn ghost" id="map">Back to map</button>
    </div>
  </div>`;

  if (r.passed) confetti();
  $("#map").onclick = () => renderMap();
  const nx = $("#nxt"); if (nx) nx.onclick = () => startLesson(r.n + 1);
  const rt = $("#retry"); if (rt) rt.onclick = () => startLesson(r.n);
}

// ---------- festive snowfall ----------
function snowfall() {
  const box = document.getElementById("snow");
  if (!box) return;
  const flakes = ["❄", "❅", "❆", "•"];
  for (let i = 0; i < 45; i++) {
    const f = document.createElement("span");
    f.className = "flake";
    f.textContent = pick(flakes);
    f.style.left = Math.random() * 100 + "%";
    f.style.fontSize = (8 + Math.random() * 14) + "px";
    f.style.opacity = (0.4 + Math.random() * 0.5).toFixed(2);
    f.style.animationDuration = (9 + Math.random() * 14) + "s";
    f.style.animationDelay = (-Math.random() * 20) + "s";
    box.appendChild(f);
  }
}
// ---------- boot ----------
snowfall();
function boot() {
  if (!session) return renderAuth();
  loadProfile();
  if (!profile) return renderOnboarding();
  renderMap();
}
boot();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
