// math-gen.js: Math question generators for SAT Quest.
// Each generator builds a fresh question at the requested difficulty. Correctness is checked
// independently: every choice is run through a test (usually by substituting it back into the
// original problem), and the validator rejects any question where the test does not pass for
// exactly one choice. Distractors model specific, common mistakes, and each one says which.

const EPS = 1e-9;
const eq = (a, b) => Math.abs(a - b) < EPS;

// Numeric choices: correct value, [[value, why], ...], test(value) -> true only for a right answer.
function numChoices(correct, correctWhy, wrongs, test, show = niceNum) {
  return [[correct, correctWhy], ...wrongs].map(([v, why]) => ({ t: show(v), ok: !!test(v), why }));
}
// Fraction-valued choices: values are [num, den] pairs.
function fracChoices(correct, correctWhy, wrongs, test) {
  return [[correct, correctWhy], ...wrongs].map(([v, why]) => ({ t: fr(v[0], v[1]), ok: !!test(v[0] / v[1]), why }));
}
const reg = (sub, skill, diffs, gen) => { MATH_GEN[sub] = { skill, diffs, gen }; };
const evalPoly = (c, x) => c.reduce((acc, k) => acc * x + k, 0);
function polyMul(a, b) { const r = Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; }
const samePoly = (a, b) => a.length === b.length && a.every((x, i) => eq(x, b[i]));

// ======================= ALGEBRA =======================

reg("lin1-solve", "lin1", ["easy", "medium"], d => {
  const a = pick([2, 3, 4, 5, 6, 7, 8, 9]), x = d === "easy" ? nz(-6, 12) : nz(-15, 15);
  const b = nz(-20, 20), c = a * x + b;
  const test = v => eq(a * v + b, c);
  if (d === "easy") {
    return {
      stem: `${lin(a, b)} = ${N(c)}\n\nWhat value of x is the solution to the given equation?`,
      choices: numChoices(x, `Substituting gives ${N(a)}(${N(x)}) ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${N(c)}, which is true.`, [
        [(c + b) / a, `This comes from ${b < 0 ? "subtracting" : "adding"} ${Math.abs(b)} on the wrong side: moving a constant across the equal sign reverses its sign.`],
        [c - b, `This is ${N(a)}x, not x: the last step, dividing both sides by ${a}, was skipped.`],
        [-x, "This has the wrong sign, a common slip when the constant is moved."],
      ], test, v => (Number.isInteger(v) ? N(v) : fr(c + b, a))),
      concept: "Solve a linear equation by undoing operations in reverse order.",
      misconception: "Sign errors when moving a constant; forgetting to divide by the coefficient.",
      steps: [`${b < 0 ? "Add" : "Subtract"} ${Math.abs(b)} ${b < 0 ? "to" : "from"} both sides: ${N(a)}x = ${N(c - b)}.`, `Divide both sides by ${a}: x = ${N(x)}.`],
      strategy: "Check by substituting your answer into the original equation.",
    };
  }
  // medium: fractional coefficient, (p/q)x + b = c with integer solution
  const q = pick([2, 3, 4, 5]), p = pick([1, 2, 3].filter(k => gcd(k, q) === 1 && k !== q)), xx = q * nz(-6, 6), bb = nz(-12, 12), cc = (p * xx) / q + bb;
  const t2 = v => eq((p * v) / q + bb, cc);
  return {
    stem: `\\frac{${p === 1 ? "" : p}x}{${q}} ${bb < 0 ? MINUS : "+"} ${Math.abs(bb)} = ${N(cc)}\n\nWhat is the solution to the given equation?`,
    choices: numChoices(xx, `x = ${N(xx)} makes the left side ${N(cc)}.`, [
      [(cc - bb) * p / q, `This multiplies by ${p}/${q} instead of by its reciprocal, ${q}/${p}.`],
      [cc - bb, `This stops after removing the constant; it is the value of ${p === 1 ? "x" : p + "x"}/${q}, not x.`],
      [(cc + bb) * q / p, "This moves the constant with the wrong sign before clearing the fraction."],
    ], t2, v => (Number.isInteger(v) ? N(v) : String(fr(Math.round(v * 6 * q), 6 * q)))),
    concept: "Solve a linear equation with a fractional coefficient.",
    misconception: "Multiplying by the coefficient instead of its reciprocal; sign errors.",
    steps: [`${bb < 0 ? "Add" : "Subtract"} ${Math.abs(bb)}: ${p === 1 ? "x" : p + "x"}/${q} = ${N(cc - bb)}.`, `Multiply both sides by ${q}${p === 1 ? "" : ` and divide by ${p}`}: x = ${N(xx)}.`],
    strategy: "Clear fractions early by multiplying every term by the denominator.",
  };
});

reg("lin1-distribute", "lin1", ["medium"], () => {
  let a, b, p, q, x;
  do { a = rnd(2, 7); b = rnd(1, 9); p = nz(-6, 6); x = nz(-9, 9); } while (a === b);
  q = a * (x + p) - b * x;
  const test = v => eq(a * (v + p), b * v + q);
  const show = v => (Number.isInteger(v) ? N(v) : fr(Math.round(v * 1000 * (a - b)), 1000 * (a - b)));
  return {
    stem: `${a}(x ${p < 0 ? MINUS : "+"} ${Math.abs(p)}) = ${lin(b, q)}\n\nWhat is the solution to the given equation?`,
    choices: numChoices(x, `Both sides equal ${N(b * x + q)} when x = ${N(x)}.`, [
      [(q - p) / (a - b), `This multiplies only the x by ${a}; the ${N(p)} inside the parentheses must be multiplied by ${a} too.`],
      [(q - a * p) / (a + b), `This adds ${b}x to the left side instead of subtracting it.`],
      [-x, "This has the wrong sign; check the last division step."],
    ], test, v => {
      if (Number.isInteger(v)) return N(v);
      for (let d = 2; d <= 60; d++) if (Number.isInteger(Math.round(v * d)) && eq(v * d, Math.round(v * d))) return fr(Math.round(v * d), d);
      return v.toFixed(2);
    }),
    concept: "Distribute, collect variable terms on one side, then solve.",
    misconception: "Distributing to only the first term; moving a variable term with the wrong sign.",
    steps: [`Distribute: ${lin(a, a * p)} = ${lin(b, q)}.`, `Subtract ${b}x from both sides: ${lin(a - b, a * p)} = ${N(q)}.`, `Isolate x: ${a - b === 1 ? "" : N(a - b)}x = ${N(q - a * p)}, so x = ${N(x)}.`],
    strategy: "Distribute to every term inside the parentheses before moving anything.",
  };
});

reg("lin1-solutions", "lin1", ["hard"], () => {
  let m, p, q;
  do { m = nz(-6, 6); p = nz(-5, 5); q = nz(-20, 20); } while (m * p === q || Math.abs(m) === 1);
  const test = v => eq(v, m) && m * p !== q;   // no solution: equal slopes, different constants
  return {
    stem: `${m}(x ${p < 0 ? MINUS : "+"} ${Math.abs(p)}) = kx ${q < 0 ? MINUS : "+"} ${Math.abs(q)}\n\nIn the given equation, k is a constant. The equation has no solution. What is the value of k?`,
    choices: numChoices(m, `With k = ${N(m)}, both sides have x-coefficient ${N(m)} but constants ${N(m * p)} and ${N(q)}, so no x works.`, [
      [-m, "Opposite coefficients give exactly one solution, not none."],
      [m * p, `${N(m * p)} is the constant on the left after distributing; matching constants is not what makes a solution impossible.`],
      [q, `${N(q)} is the constant term on the right, not an x-coefficient.`],
    ], test),
    concept: "A linear equation has no solution when the x-terms match and the constants do not.",
    misconception: "Confusing coefficients with constants; thinking opposite slopes give no solution.",
    steps: [`Distribute the left side: ${lin(m, m * p)}.`, `For no solution, the x-coefficients must be equal: k = ${N(m)}.`, `The constants ${N(m * p)} and ${N(q)} differ, so the equation ${lin(m, m * p)} = ${lin(m, q)} is never true.`],
    strategy: "Same coefficient and same constant: infinitely many solutions. Same coefficient, different constant: no solution. Different coefficients: exactly one.",
    time: 110,
  };
});

reg("linfun-eval", "linfun", ["easy"], () => {
  const a = nz(-7, 9), b = nz(-15, 15), k = nz(-6, 8), y = a * k + b;
  return {
    stem: `f(x) = ${lin(a, b)}\n\nFor the function f defined above, what is the value of f(${N(k)})?`,
    choices: numChoices(y, `Replace x with ${N(k)}: ${N(a)}(${N(k)}) ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${N(y)}.`, [
      [a * k - b, `This ${b < 0 ? "adds" : "subtracts"} ${Math.abs(b)} instead of ${b < 0 ? "subtracting" : "adding"} it.`],
      [a + k + b, `This adds ${N(a)} and ${N(k)} instead of multiplying them.`],
      [a * (k + b), `This adds ${N(b)} before multiplying; multiplication comes first.`],
    ], v => eq(v, a * k + b)),
    concept: "Evaluate a function by substituting the input for x.",
    misconception: "Order-of-operations and sign errors during substitution.",
    steps: [`f(${N(k)}) = ${N(a)}(${N(k)}) ${b < 0 ? MINUS : "+"} ${Math.abs(b)}`, `= ${N(a * k)} ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${N(y)}.`],
    strategy: "Put the input in parentheses when you substitute, especially when it is negative.",
  };
});

// Each context gives the model text, and the correct and incorrect readings of the slope (m) and the intercept (b).
const LINFUN_CONTEXTS = [
  { model: (m, b) => `A plumber charges a fixed fee for each visit plus an hourly rate. The total charge C, in dollars, for a visit lasting h hours is given by C = ${m}h + ${b}.`,
    v: "h", show: m => m,
    slope: m => [`The plumber charges $${m} for each hour of work.`, `The plumber charges a fixed fee of $${m} for each visit.`, `A visit lasting 1 hour costs a total of $${m}.`, `A typical visit lasts ${m} hours.`],
    icpt: b => [`The plumber charges a fixed fee of $${b} for each visit.`, `The plumber charges $${b} for each hour of work.`, `The plumber earns $${b} per day.`, `A visit lasting ${b} hours costs nothing extra.`] },
  { model: (m, b) => `A water tank is being drained at a constant rate. The volume V, in gallons, remaining in the tank t minutes after draining begins is given by V = ${b} \u2212 ${m}t.`,
    v: "t", show: m => m,
    slope: m => [`The volume of water in the tank decreases by ${m} gallons each minute.`, `The tank held ${m} gallons when draining began.`, `The tank will be empty after ${m} minutes.`, `The volume of water in the tank increases by ${m} gallons each minute.`],
    icpt: b => [`The tank held ${b} gallons when draining began.`, `The volume of water in the tank decreases by ${b} gallons each minute.`, `The tank will be empty after ${b} minutes.`, `The tank can hold at most ${b} gallons more than it held at the start.`] },
  { model: (m, b) => `A biologist models the height H, in centimeters, of a plant d days after it was first measured as H = ${(m / 10).toFixed(1)}d + ${b}.`,
    v: "d", show: m => (m / 10).toFixed(1),
    slope: m => { const s = (m / 10).toFixed(1); return [`The plant's height increases by about ${s} centimeters each day.`, `The plant was ${s} centimeters tall when it was first measured.`, `The plant will stop growing after ${s} days.`, `The plant's height is multiplied by ${s} each day.`]; },
    icpt: b => [`The plant was ${b} centimeters tall when it was first measured.`, `The plant's height increases by about ${b} centimeters each day.`, `The plant will stop growing after ${b} days.`, `The plant will be ${b} centimeters tall after 1 day.`] },
];
reg("linfun-interpret", "linfun", ["medium"], () => {
  const c = pick(LINFUN_CONTEXTS), m = c === LINFUN_CONTEXTS[2] ? rnd(3, 18) : rnd(8, 95), b = rnd(10, c === LINFUN_CONTEXTS[1] ? 900 : 120) + (c === LINFUN_CONTEXTS[1] ? 300 : 0);
  if (String(c.show(m)) === String(b)) return null;
  const askSlope = Math.random() < 0.6;
  const target = askSlope ? c.show(m) : b;
  const t = askSlope ? c.slope(m) : c.icpt(b);
  const whys = askSlope
    ? [`${target} is the coefficient of ${c.v}, so it is the rate of change: the amount added or removed for each 1-unit increase in ${c.v}.`,
       "This describes the starting value, which is the constant term, not the coefficient of the variable.",
       "This ignores the constant term; the rate alone does not give this total or this time.",
       "This misreads the direction or the type of change: the model is linear and its sign shows the direction."]
    : [`${target} is the value of the expression when ${c.v} = 0, which is the starting amount.`,
       `${target} is not multiplied by ${c.v}, so it is not a rate of change.`,
       "Nothing in the model describes this quantity.",
       "This is not what the constant term represents; the constant is the value when the variable is 0."];
  return {
    stem: `${c.model(m, b)}\n\nWhat is the best interpretation of ${target} in this context?`,
    choices: t.map((s, i) => ({ t: s, ok: i === 0, why: whys[i] })),
    concept: "In a linear model y = mx + b, m is the rate of change and b is the starting value.",
    misconception: "Swapping the meanings of slope and intercept.",
    steps: [`Identify the coefficient of ${c.v} (the rate) and the constant term (the value when ${c.v} = 0).`, `${target} is the ${askSlope ? "coefficient, so it is the rate per unit" : "constant term, so it is the starting value"}.`],
    strategy: "Ask: is this number multiplied by the variable? If yes, it is a rate per unit; if not, it is the starting value.",
  };
});

reg("linfun-table", "linfun", ["medium"], () => {
  let m, b, x0;
  do { m = nz(-5, 6); b = nz(-10, 10); x0 = rnd(1, 3); } while (m === b || m === -b || b === m * x0 + b);
  const xs = [x0, x0 + 1, x0 + 2, x0 + 3], ys = xs.map(x => m * x + b);
  const opts = [[m, b, true, `Check two rows: f(${xs[0]}) = ${N(ys[0])} and f(${xs[1]}) = ${N(ys[1])}. Every row fits.`],
                [m, ys[0], false, `${N(ys[0])} is the output when x = ${xs[0]}, not when x = 0, so it is not the y-intercept.`],
                [-m, b + 2 * m * x0, false, "The outputs change by " + N(m) + " each time x increases by 1, so the slope is " + N(m) + ", not " + N(-m) + "."],
                [b, m, false, "This swaps the slope and the y-intercept."]];
  return {
    stem: "For the linear function f, the table shows several values of x and their corresponding values of f(x). Which equation defines f?",
    stimulus: { kind: "table", head: ["x", "f(x)"], rows: xs.map((x, i) => [String(x), N(ys[i])]) },
    choices: opts.map(([s, k, , why]) => ({ t: `f(x) = ${lin(s, k)}`, ok: xs.every((x, i) => eq(s * x + k, ys[i])), why })),
    concept: "Find slope from equal steps in a table, then solve for the intercept.",
    misconception: "Using the first table value as the y-intercept when the table does not start at x = 0.",
    steps: [`Slope: each time x increases by 1, f(x) changes by ${N(m)}.`, `Intercept: ${N(ys[0])} = ${N(m)}(${xs[0]}) + b, so b = ${N(b)}.`, `f(x) = ${lin(m, b)}.`],
    strategy: "Test your equation on two different rows of the table.",
  };
});

reg("linfun-points", "linfun", ["hard"], () => {
  let m, b, p, q, r;
  do { m = nz(-6, 6); b = nz(-12, 12); p = rnd(-4, 4); q = p + rnd(2, 5); r = q + rnd(2, 6); } while (p === 0);
  const P = m * p + b, Q = m * q + b, R = m * r + b;
  return {
    stem: `For the linear function f, f(${N(p)}) = ${N(P)} and f(${N(q)}) = ${N(Q)}. What is the value of f(${N(r)})?`,
    choices: numChoices(R, `Slope = (${N(Q)} ${MINUS} ${P < 0 ? "(" + N(P) + ")" : P}) / (${N(q)} ${MINUS} ${p < 0 ? "(" + N(p) + ")" : p}) = ${N(m)}; f(${N(r)}) = ${N(Q)} + ${N(m)}(${r - q}) = ${N(R)}.`, [
      [m * r, `${N(m * r)} is the slope times ${N(r)}; it leaves out the y-intercept, ${N(b)}.`],
      [Q + (r - q) / m, "This uses the reciprocal of the slope (change in x over change in y)."],
      [Q + (Q - P), `This adds the change from f(${N(p)}) to f(${N(q)}) once more, but the step from ${N(q)} to ${N(r)} is a different size.`],
    ], v => eq(v, R), v => (Number.isInteger(v) ? N(v) : fr(Math.round(v * Math.abs(m)), Math.abs(m)))),
    concept: "Two values of a linear function determine its slope and every other value.",
    misconception: "Forgetting the intercept; inverting the slope; assuming equal steps.",
    steps: [`Slope m = (${N(Q)} ${MINUS} ${P < 0 ? "(" + N(P) + ")" : P}) / (${N(q)} ${MINUS} ${p < 0 ? "(" + N(p) + ")" : p}) = ${N(m)}.`, `From x = ${N(q)} to x = ${N(r)} is ${r - q} units, so f changes by ${N(m)} × ${r - q} = ${N(m * (r - q))}.`, `f(${N(r)}) = ${N(Q)} + ${N(m * (r - q))} = ${N(R)}.`],
    strategy: "You do not need the full equation: slope times the horizontal distance gives the change.",
    time: 110,
  };
});

reg("lin2-slope", "lin2", ["easy"], () => {
  let x1, x2, y1, y2;
  do { x1 = rnd(-6, 6); x2 = rnd(-6, 6); y1 = rnd(-9, 9); y2 = rnd(-9, 9); } while (x1 === x2 || y1 === y2 || Math.abs(y2 - y1) === Math.abs(x2 - x1));
  const s = [y2 - y1, x2 - x1];
  return {
    stem: `In the xy-plane, a line passes through the points (${N(x1)}, ${N(y1)}) and (${N(x2)}, ${N(y2)}). What is the slope of the line?`,
    choices: fracChoices(s, `Slope = change in y / change in x = (${N(y2)} ${MINUS} ${y1 < 0 ? "(" + N(y1) + ")" : y1}) / (${N(x2)} ${MINUS} ${x1 < 0 ? "(" + N(x1) + ")" : x1}) = ${fr(...s)}.`, [
      [[x2 - x1, y2 - y1], "This is change in x over change in y, the reciprocal of the slope."],
      [[-(y2 - y1), x2 - x1], "This mixes the order of subtraction: the y-values and x-values must be subtracted in the same order."],
      [[y2 + y1 || 1, x2 + x1 || 1], "Slope uses differences, not sums, of the coordinates."],
    ], v => eq(v, s[0] / s[1])),
    concept: "Slope is the change in y divided by the change in x.",
    misconception: "Inverting the ratio; subtracting in inconsistent orders.",
    steps: [`Change in y: ${N(y2)} ${MINUS} ${y1 < 0 ? "(" + N(y1) + ")" : y1} = ${N(y2 - y1)}.`, `Change in x: ${N(x2)} ${MINUS} ${x1 < 0 ? "(" + N(x1) + ")" : x1} = ${N(x2 - x1)}.`, `Slope = ${N(y2 - y1)}/${N(x2 - x1)} = ${fr(...s)}.`],
    strategy: "Rise over run: y on top. Subtract in the same order for both coordinates.",
  };
});

reg("lin2-standard", "lin2", ["medium"], () => {
  let a, b, c;
  do { a = nz(-9, 9); b = nz(-9, 9); c = nz(-30, 30); } while (Math.abs(a) === Math.abs(b) || c % b === 0 && c / b === -a / b);
  const sl = [-a, b];
  return {
    stem: `${lin(a, 0)} ${b < 0 ? MINUS : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}y = ${N(c)}\n\nWhat is the slope of the graph of the given equation in the xy-plane?`,
    choices: fracChoices(sl, `Solving for y gives y = (${fr(-a, b)})x + ${fr(c, b)}, so the slope is ${fr(-a, b)}.`, [
      [[a, b], "This forgets that moving the x-term to the other side changes its sign."],
      [[-b, a], "This divides the y-coefficient by the x-coefficient; the slope is −(x-coefficient)/(y-coefficient)."],
      [[c, b], "This is the y-intercept, not the slope."],
    ], v => eq(v, -a / b)),
    concept: "For Ax + By = C, the slope is −A/B.",
    misconception: "Sign errors when solving for y; confusing slope with the y-intercept.",
    steps: [`Subtract ${lin(a, 0)} from both sides: ${Math.abs(b) === 1 ? (b < 0 ? MINUS : "") : N(b)}y = ${lin(-a, c)}.`, `Divide by ${N(b)}: y = (${fr(-a, b)})x + ${fr(c, b)}.`, `The slope is ${fr(-a, b)}.`],
    strategy: "Shortcut: slope = −A/B for any line written as Ax + By = C.",
  };
});

reg("lin2-perp", "lin2", ["hard"], () => {
  let a, b, p, q;
  do { a = nz(-6, 6); b = nz(-6, 6); p = nz(-6, 6); q = nz(-9, 9); } while (Math.abs(a) === Math.abs(b));
  const mPerp = b / a;                     // slope of l is -a/b, perpendicular slope is b/a
  const yint = q - mPerp * p;
  const d = Math.abs(a) * Math.abs(b);
  const toFr = v => fr(Math.round(v * d), d);
  return {
    stem: `In the xy-plane, line ℓ has equation ${lin(a, 0)} ${b < 0 ? MINUS : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}y = 7. Line m is perpendicular to line ℓ and passes through the point (${N(p)}, ${N(q)}). What is the y-coordinate of the y-intercept of line m?`,
    choices: [[yint, `Line ℓ has slope ${fr(-a, b)}, so line m has slope ${fr(b, a)}. Then b = ${N(q)} ${MINUS} (${fr(b, a)})(${N(p)}) = ${toFr(yint)}.`],
              [q + (a / b) * p, "This uses the slope of line ℓ itself; parallel lines share a slope, perpendicular lines do not."],
              [q + mPerp * p, "This adds the slope times x instead of subtracting it when solving for the intercept."],
              [q - (a / b) * p, "This takes the negative of line ℓ's slope but not the reciprocal; a perpendicular slope needs both."]]
      .map(([v, why]) => ({ t: toFr(v), ok: eq(v, q - (b / a) * p) && eq((b / a) * (-a / b), -1), why })),
    concept: "Perpendicular lines have slopes that are negative reciprocals.",
    misconception: "Using the parallel slope; taking only the reciprocal or only the negative.",
    steps: [`Slope of ℓ: ${fr(-a, b)}.`, `Slope of m: negative reciprocal, ${fr(b, a)}.`, `Use y = mx + b with (${N(p)}, ${N(q)}): ${N(q)} = (${fr(b, a)})(${N(p)}) + b, so b = ${toFr(yint)}.`],
    strategy: "Perpendicular: flip the fraction and change the sign. Check that the two slopes multiply to −1.",
    time: 120,
  };
});

reg("sys-solve", "sys", ["easy", "medium"], d => {
  if (d === "easy") {
    let x, y; do { x = nz(-9, 12); y = nz(-9, 12); } while (x === y || x === -y);
    const S = x + y, D = x - y;
    return {
      stem: `x + y = ${N(S)}\nx ${MINUS} y = ${N(D)}\n\nThe solution to the given system of equations is (x, y). What is the value of x?`,
      choices: numChoices(x, `Adding the equations eliminates y: 2x = ${N(S + D)}, so x = ${N(x)}.`, [
        [y, `${N(y)} is the value of y, not x.`],
        [S + D, `${N(S + D)} is 2x; it still needs to be divided by 2.`],
        [S - D, `Subtracting the equations eliminates x and gives 2y = ${N(S - D)}, not x.`],
      ], v => eq(v + y, S) && eq(v - y, D)),
      concept: "Eliminate a variable by adding equations.",
      misconception: "Stopping at 2x; solving for the wrong variable.",
      steps: [`Add the equations: (x + y) + (x ${MINUS} y) = ${N(S)} + ${D < 0 ? "(" + N(D) + ")" : D}, so 2x = ${N(S + D)}.`, `x = ${N(x)}.`],
      strategy: "Check which variable the question asks for before answering.",
    };
  }
  let a, b, c, e, x, y;
  do { a = rnd(2, 5); b = nz(-5, 5); c = rnd(1, 4); e = nz(-5, 5); x = nz(-6, 6); y = nz(-6, 6); } while (a * e - b * c === 0 || x === y);
  const r1 = a * x + b * y, r2 = c * x + e * y;
  return {
    stem: `${lin(a, 0)} ${b < 0 ? MINUS : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}y = ${N(r1)}\n${lin(c, 0)} ${e < 0 ? MINUS : "+"} ${Math.abs(e) === 1 ? "" : Math.abs(e)}y = ${N(r2)}\n\nIf (x, y) is the solution to the given system, what is the value of x + y?`,
    choices: numChoices(x + y, `The solution is x = ${N(x)}, y = ${N(y)}, so x + y = ${N(x + y)}.`, [
      [x, `${N(x)} is x alone; the question asks for x + y.`],
      [x - y, `${N(x - y)} is x ${MINUS} y, not x + y.`],
      [y, `${N(y)} is y alone.`],
    ], v => eq(v, x + y) && eq(a * x + b * y, r1) && eq(c * x + e * y, r2)),
    concept: "Solve a 2-by-2 system by elimination or substitution.",
    misconception: "Answering with one variable when the question asks for a combination.",
    steps: [`Multiply to match a coefficient, then subtract to eliminate one variable.`, `This gives x = ${N(x)} and y = ${N(y)}.`, `Check: ${N(a)}(${N(x)}) + ${N(b)}(${N(y)}) = ${N(r1)} and ${N(c)}(${N(x)}) + ${N(e)}(${N(y)}) = ${N(r2)}.`, `x + y = ${N(x + y)}.`],
    strategy: "Reread the last line of the question: SAT systems often ask for a combination like x + y.",
  };
});

reg("sys-context", "sys", ["medium"], () => {
  const A = pick([12, 14, 15, 16, 18, 20]), S = pick([6, 7, 8, 9, 10]), ad = rnd(40, 160), st = rnd(40, 200);
  if (ad === st) return null;
  const n = ad + st, T = A * ad + S * st;
  return {
    stem: `A theater sold ${n} tickets for one performance. Adult tickets cost $${A} each and student tickets cost $${S} each. The theater collected $${T.toLocaleString("en-US")} from ticket sales. How many student tickets were sold?`,
    choices: numChoices(st, `Let a + s = ${n} and ${A}a + ${S}s = ${T}. Substituting a = ${n} ${MINUS} s gives s = ${st}; check: ${A}(${ad}) + ${S}(${st}) = ${T}.`, [
      [ad, `${ad} is the number of adult tickets.`],
      [Math.round(n / 2), "This assumes the tickets were split evenly; the revenue shows they were not."],
      [Math.round(T / (A + S)), "Dividing total revenue by the sum of the prices does not count either type of ticket."],
    ], v => Number.isInteger(v) && eq(A * (n - v) + S * v, T)),
    concept: "Model a situation with two linear equations: one for count, one for value.",
    misconception: "Solving for the other variable; averaging instead of solving.",
    steps: [`a + s = ${n}; ${A}a + ${S}s = ${T}.`, `Substitute a = ${n} ${MINUS} s: ${A}(${n} ${MINUS} s) + ${S}s = ${T}.`, `${A * n} ${MINUS} ${A - S}s = ${T}, so s = ${st}.`],
    strategy: "Name your variables in words (a = adult tickets) so you answer for the right one.",
  };
});

reg("sys-param", "sys", ["hard"], () => {
  const a = pick([2, 3, 4, 5]), b = nz(-6, 6), c1 = nz(-12, 12), m = pick([2, 3, -2, 3]);
  let c2; do { c2 = nz(-30, 30); } while (c2 === m * c1);
  const k = m * b;
  if (k === b || k === -k) return null;
  return {
    stem: `${lin(a, 0)} ${b < 0 ? MINUS : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}y = ${N(c1)}\n${lin(m * a, 0)} + ky = ${N(c2)}\n\nIn the given system of equations, k is a constant. If the system has no solution, what is the value of k?`,
    choices: numChoices(k, `The second x-coefficient is ${N(m)} times the first, so the lines are parallel when k = ${N(m)}(${N(b)}) = ${N(k)}; since ${N(c2)} ≠ ${N(m * c1)}, they never meet.`, [
      [b, `This matches the y-coefficients without scaling; the x-coefficients differ by a factor of ${N(m)}.`],
      [-k, "This makes the slopes opposite, so the lines cross; the system has one solution."],
      [m * a, "This copies the x-coefficient; the y-coefficient must be scaled by the same factor instead."],
    ], v => eq(v, m * b) && !eq(c2, m * c1)),
    concept: "A linear system has no solution when the lines are parallel and distinct.",
    misconception: "Matching coefficients without the common scale factor.",
    steps: [`No solution means the equations have proportional x- and y-coefficients but not proportional constants.`, `x-coefficients: ${N(m * a)} = ${N(m)} × ${N(a)}. So k must equal ${N(m)} × ${N(b)} = ${N(k)}.`, `Constants: ${N(m)} × ${N(c1)} = ${N(m * c1)} ≠ ${N(c2)}, so the lines are distinct.`],
    strategy: "Find the scale factor from the coefficients you know, then apply it to the unknown one.",
    time: 110,
  };
});

reg("ineq-solve", "ineq", ["easy", "medium"], d => {
  const a = d === "easy" ? rnd(2, 6) : -rnd(2, 6), b = nz(-12, 12), bound = nz(-6, 8), c = a * bound + b;
  const holds = v => (a * v + b > c);                 // the inequality
  const sol = a > 0 ? bound + rnd(1, 3) : bound - rnd(1, 3);
  const wrongs = a > 0 ? [bound, bound - 1, bound - rnd(2, 4)] : [bound, bound + 1, bound + rnd(2, 4)];
  return {
    stem: `${lin(a, b)} > ${N(c)}\n\nWhich of the following values of x satisfies the given inequality?`,
    choices: numChoices(sol, `Substituting: ${N(a)}(${N(sol)}) ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${N(a * sol + b)}, which is greater than ${N(c)}.`, wrongs.map((w, i) => [w,
      i === 0 ? `x = ${N(bound)} makes the two sides equal, and the inequality is strict (>), so it is not a solution.` :
      (a < 0 ? `This would work only if the sign were not reversed after dividing by ${N(a)}. ` : "") + `Check: ${N(a)}(${N(w)}) ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${N(a * w + b)}, which is not greater than ${N(c)}.`]), holds),
    concept: a < 0 ? "Dividing an inequality by a negative number reverses its direction." : "Solve a linear inequality like an equation, then check the direction.",
    misconception: a < 0 ? "Forgetting to flip the inequality sign when dividing by a negative." : "Including the boundary value in a strict inequality.",
    steps: [`${b < 0 ? "Add" : "Subtract"} ${Math.abs(b)}: ${N(a)}x > ${N(c - b)}.`, `Divide by ${N(a)}${a < 0 ? " and reverse the sign" : ""}: x ${a < 0 ? "<" : ">"} ${N(bound)}.`, `Only ${N(sol)} is ${a < 0 ? "less" : "greater"} than ${N(bound)}.`],
    strategy: "Plugging each choice into the original inequality is a fast, reliable check.",
  };
});

reg("ineq-context", "ineq", ["medium"], () => {
  const W = pick([1500, 1800, 2000, 2200, 2500]), dw = rnd(150, 260), w = pick([35, 40, 45, 48, 55, 60]);
  const max = Math.floor((W - dw) / w);
  if ((W - dw) % w === 0) return null;
  return {
    stem: `An elevator can safely carry at most ${W.toLocaleString("en-US")} pounds. An operator who weighs ${dw} pounds is loading boxes that each weigh ${w} pounds. What is the maximum number of boxes the operator can load into the elevator while riding in it?`,
    choices: numChoices(max, `${dw} + ${w}b ≤ ${W} gives b ≤ ${((W - dw) / w).toFixed(2)}, and b must be a whole number, so b = ${max}.`, [
      [max + 1, `This rounds ${((W - dw) / w).toFixed(2)} up; ${max + 1} boxes would put the total at ${dw + (max + 1) * w} pounds, over the limit.`],
      [Math.floor(W / w), "This ignores the operator's weight."],
      [Math.floor((W + dw) / w), "This adds the operator's weight to the limit instead of subtracting it."],
    ], v => Number.isInteger(v) && dw + v * w <= W && dw + (v + 1) * w > W),
    concept: "Write and solve an inequality, then interpret the result in context.",
    misconception: "Rounding up when a maximum is required; leaving out a fixed quantity.",
    steps: [`${dw} + ${w}b ≤ ${W}.`, `${w}b ≤ ${W - dw}, so b ≤ ${((W - dw) / w).toFixed(2)}.`, `The greatest whole number of boxes is ${max}.`],
    strategy: "For a maximum, round down; for a minimum, round up. Then check your answer in the original condition.",
  };
});

reg("ineq-system", "ineq", ["hard"], () => {
  const m1 = nz(-3, 3), b1 = nz(-5, 5), m2 = nz(-3, 3), b2 = rnd(4, 12);
  if (m1 === m2) return null;
  const ok1 = (x, y) => y > m1 * x + b1, ok2 = (x, y) => y < m2 * x + b2;
  const pts = []; for (let x = -6; x <= 6; x++) for (let y = -14; y <= 20; y++) pts.push([x, y]);
  const both = pts.filter(([x, y]) => ok1(x, y) && ok2(x, y));
  const only1 = pts.filter(([x, y]) => ok1(x, y) && !ok2(x, y) && y !== m2 * x + b2);
  const only2 = pts.filter(([x, y]) => !ok1(x, y) && ok2(x, y) && y !== m1 * x + b1);
  const onEdge = pts.filter(([x, y]) => y === m1 * x + b1 && ok2(x, y));
  if (!both.length || !only1.length || !only2.length || !onEdge.length) return null;
  const P = ([x, y]) => `(${N(x)}, ${N(y)})`;
  return {
    stem: `y > ${lin(m1, b1)}\ny < ${lin(m2, b2)}\n\nWhich point (x, y) is a solution to the given system of inequalities in the xy-plane?`,
    choices: [[pick(both), "It satisfies both inequalities."],
              [pick(only1), "It satisfies the first inequality but not the second; a solution must satisfy both."],
              [pick(only2), "It satisfies the second inequality but not the first."],
              [pick(onEdge), "It lies on the boundary line of the first inequality; the inequality is strict (>), so boundary points are not included."]]
      .map(([pt, why]) => ({ t: P(pt), ok: ok1(...pt) && ok2(...pt), why })),
    concept: "A solution to a system of inequalities must satisfy every inequality.",
    misconception: "Checking only one inequality; including points on a strict (dashed) boundary.",
    steps: ["Substitute each point into both inequalities.", "Keep only the point that makes both statements true."],
    strategy: "Test each point in both inequalities; one failure rules it out.",
    time: 110,
  };
});

// ======================= ADVANCED MATH =======================

reg("equiv-expand", "equiv", ["easy", "medium"], d => {
  const a = d === "easy" ? 1 : rnd(2, 4), p = nz(-7, 7), q = nz(-7, 7);
  if (a * q + p === 0) return null;
  const right = polyMul([a, p], [1, q]);           // (ax + p)(x + q)
  const opts = [[right, `FOIL: ${a === 1 ? "x" : a + "x"} · x + ${a === 1 ? "x" : a + "x"} · ${N(q)} + ${N(p)} · x + ${N(p)} · ${N(q)}.`],
                [[a, 0, p * q], "This multiplies first terms and last terms only, dropping the middle (x) term."],
                [[a, p + q, p * q], a === 1 ? "This is correct only if the coefficient on x were 1 in both factors." : `This adds ${N(p)} and ${N(q)} for the middle term, ignoring the coefficient ${a}.`],
                [[a, a * q + p, -p * q], "The constant term has the wrong sign: " + N(p) + " × " + N(q) + " = " + N(p * q) + "."]];
  if (a === 1) opts[2] = [[1, p + q, -(p * q)], "The middle term is right, but the constant has the wrong sign."], opts[3] = [[1, p * q, p + q], "This swaps the middle coefficient and the constant."];
  return {
    stem: `Which expression is equivalent to (${lin(a, p)})(${lin(1, q)})?`,
    choices: opts.map(([c, why]) => ({ t: poly(c), ok: samePoly(c, right), why })),
    concept: "Multiply binomials by distributing every term of one factor to every term of the other.",
    misconception: "Dropping the middle term; sign errors in the constant.",
    steps: [`(${lin(a, p)})(${lin(1, q)}) = ${a === 1 ? "" : a}x² + ${N(a * q)}x + ${N(p)}x + ${N(p * q)}`, `= ${poly(right)}.`],
    strategy: "Check by substituting x = 1 into both the original and your answer.",
  };
});

reg("equiv-factor", "equiv", ["medium"], () => {
  const a = rnd(2, 6), b = rnd(1, 9);
  if (gcd(a, b) !== 1) return null;
  const target = [a * a, 0, -b * b];
  const F = (p, q) => `(${lin(p[0], p[1])})(${lin(q[0], q[1])})`;
  const opts = [[[a, -b], [a, b], "This is a difference of squares: (ax)² − b² = (ax − b)(ax + b)."],
                [[a, -b], [a, -b], "(ax − b)² has a middle term of −2abx, which the original expression does not have."],
                [[a * a, -b], [1, b], "This product has a middle term, so it cannot equal an expression with no x-term."],
                [[a, -b * b], [a, 1], "This treats b² like b; it does not expand back to the original."]];
  return {
    stem: `Which expression is equivalent to ${poly(target)}?`,
    choices: opts.map(([p, q, why]) => ({ t: F(p, q), ok: samePoly(polyMul(p, q), target), why })),
    concept: "Difference of squares: A² − B² = (A − B)(A + B).",
    misconception: "Writing (A − B)² instead of (A − B)(A + B).",
    steps: [`${a * a}x² = (${a}x)² and ${b * b} = ${b}².`, `So ${poly(target)} = (${a}x ${MINUS} ${b})(${a}x + ${b}).`],
    strategy: "Expand your answer quickly to confirm it matches; a difference of squares has no middle term.",
  };
});

reg("equiv-exponent", "equiv", ["medium", "hard"], d => {
  if (d === "medium") {
    const a = rnd(2, 6), b = rnd(2, 6), c = rnd(2, 4);
    const right = (a + b) * c;
    const ex = [[right, `Add exponents when multiplying (${a} + ${b} = ${a + b}), then multiply by the outer power: ${a + b} × ${c} = ${right}.`],
                [a + b + c, "This adds the outer exponent instead of multiplying by it."],
                [a * b * c, "This multiplies the inner exponents; exponents add when like bases are multiplied."],
                [a * b + c, "This multiplies the inner exponents and adds the outer one, mixing both rules."]];
    return {
      stem: `Which expression is equivalent to (x^{${a}} · x^{${b}})^{${c}}?`,
      choices: ex.map(([e, why]) => ({ t: `x^{${e}}`, ok: e === right, why })),
      concept: "Product rule: x^a · x^b = x^(a+b). Power rule: (x^a)^c = x^(ac).",
      misconception: "Mixing up when to add and when to multiply exponents.",
      steps: [`x^{${a}} · x^{${b}} = x^{${a + b}}.`, `(x^{${a + b}})^{${c}} = x^{${right}}.`],
      strategy: "Check with x = 2 on a calculator if you are unsure.",
    };
  }
  const m = pick([1, 3, 5, 7]), k = rnd(1, 4);
  const right = [m + 2 * k, 2];                        // sqrt(x^m) * x^k = x^(m/2 + k)
  const ex = [[right, `√(x^{${m}}) = x^{${m}/2}, and x^{${m}/2} · x^{${k}} = x^{${m}/2 + ${k}} = x^{${fr(...right)}}.`],
              [[m * k, 2], "This multiplies the exponents; when like bases are multiplied, exponents are added."],
              [[m + k, 2], "This puts both exponents under the square root; only x^" + m + " is inside the radical."],
              [[2 * m + k, 1], "A square root halves the exponent; it does not double it."]];
  return {
    stem: `Which expression is equivalent to sqrt(x^{${m}}) · x^{${k}}, where x > 0?`,
    choices: ex.map(([e, why]) => ({ t: `x^{${fr(...e)}}`, ok: eq(e[0] / e[1], m / 2 + k), why })),
    concept: "A root is a fractional exponent: √(x^m) = x^(m/2).",
    misconception: "Doubling instead of halving; applying the root to the whole product.",
    steps: [`Rewrite the root: √(x^{${m}}) = x^{${m}/2}.`, `Add exponents: ${m}/2 + ${k} = ${fr(...right)}.`],
    strategy: "Turn every radical into a fractional exponent first, then use the exponent rules.",
    time: 100,
  };
});

reg("equiv-rational", "equiv", ["hard"], () => {
  let a, b; do { a = nz(-6, 6); b = nz(-6, 6); } while (a === b);
  const xs = [7.3, -2.9, 11.1];
  const truth = x => 1 / (x + a) + 1 / (x + b);
  const den = `(${lin(1, a)})(${lin(1, b)})`;
  const opts = [[`\\frac{${lin(2, a + b)}}{${den}}`, x => (2 * x + a + b) / ((x + a) * (x + b)), "Use the common denominator (x + a)(x + b): the numerators become (x + b) + (x + a)."],
                [`\\frac{2}{${lin(2, a + b)}}`, x => 2 / (2 * x + a + b), "This adds the denominators; fractions are added over a common denominator, not by adding denominators."],
                [`\\frac{2}{${den}}`, x => 2 / ((x + a) * (x + b)), "This uses the common denominator but adds only the 1s in the numerators, not the x-terms that come from rewriting each fraction."],
                [`\\frac{${lin(1, a + b)}}{${den}}`, x => (x + a + b) / ((x + a) * (x + b)), "This drops one of the x-terms when combining the numerators."]];
  return {
    stem: `Which expression is equivalent to \\frac{1}{${lin(1, a)}} + \\frac{1}{${lin(1, b)}}, for x > ${Math.max(-a, -b)}?`,
    choices: opts.map(([t, f, why]) => ({ t, ok: xs.every(x => eq(f(x), truth(x))), why })),
    concept: "Add rational expressions by rewriting them over a common denominator.",
    misconception: "Adding denominators; forgetting to multiply numerators when rewriting.",
    steps: [`Common denominator: ${den}.`, `\\frac{1}{${lin(1, a)}} = \\frac{${lin(1, b)}}{${den}} and \\frac{1}{${lin(1, b)}} = \\frac{${lin(1, a)}}{${den}}.`, `Add the numerators: ${lin(2, a + b)}.`],
    strategy: "Pick a test value like x = 1 (if allowed) and compare the original with each choice.",
    time: 120,
  };
});

reg("quad-solve", "nleq", ["easy", "medium"], d => {
  let r1, r2; do { r1 = nz(-9, 9); r2 = nz(-9, 9); } while (r1 === r2 || r1 + r2 === 0 || r1 === -r2 || r1 * r2 === r1 + r2);
  const b = -(r1 + r2), c = r1 * r2;
  if (d === "easy") {
    const big = Math.max(r1, r2), small = Math.min(r1, r2);
    return {
      stem: `(x ${r1 < 0 ? "+" : MINUS} ${Math.abs(r1)})(x ${r2 < 0 ? "+" : MINUS} ${Math.abs(r2)}) = 0\n\nWhat is the greater of the two solutions to the given equation?`,
      choices: numChoices(big, `Set each factor to 0: x = ${N(r1)} or x = ${N(r2)}. The greater is ${N(big)}.`, [
        [-small, `This flips the sign of the solution from the factor with ${small < 0 ? "+" : MINUS} ${Math.abs(small)}; setting that factor to 0 gives x = ${N(small)}.`],
        [small, `${N(small)} is a solution, but it is the lesser one.`],
        [-big, `This flips the sign: x ${big < 0 ? "+" : MINUS} ${Math.abs(big)} = 0 gives x = ${N(big)}.`],
      ], v => eq(v, big) && eq((v - r1) * (v - r2), 0)),
      concept: "Zero product property: if AB = 0, then A = 0 or B = 0.",
      misconception: "Reading the solution off the factor with the wrong sign.",
      steps: [`x ${r1 < 0 ? "+" : MINUS} ${Math.abs(r1)} = 0 gives x = ${N(r1)}.`, `x ${r2 < 0 ? "+" : MINUS} ${Math.abs(r2)} = 0 gives x = ${N(r2)}.`],
      strategy: "The solution is the number that makes the factor zero, so its sign is opposite to the one shown in the factor.",
    };
  }
  return {
    stem: `${poly([1, b, c])} = 0\n\nWhat is the sum of the solutions to the given equation?`,
    choices: numChoices(r1 + r2, `The equation factors as (x ${r1 < 0 ? "+" : MINUS} ${Math.abs(r1)})(x ${r2 < 0 ? "+" : MINUS} ${Math.abs(r2)}) = 0, so the solutions are ${N(r1)} and ${N(r2)}; their sum is ${N(r1 + r2)}.`, [
      [b, `${N(b)} is the coefficient of x; the sum of the solutions is its opposite, ${N(-b)}.`],
      [c, `${N(c)} is the product of the solutions, not the sum.`],
      [Math.max(r1, r2), `${N(Math.max(r1, r2))} is only one of the solutions.`],
    ], v => eq(v, r1 + r2) && eq(evalPoly([1, b, c], r1), 0) && eq(evalPoly([1, b, c], r2), 0)),
    concept: "For x² + bx + c = 0, the solutions sum to −b and multiply to c.",
    misconception: "Using b instead of −b; confusing the sum with the product.",
    steps: [`Find two numbers that multiply to ${N(c)} and add to ${N(b)}: ${N(-r1)} and ${N(-r2)}.`, `Solutions: x = ${N(r1)} and x = ${N(r2)}.`, `Sum: ${N(r1 + r2)}.`],
    strategy: "Shortcut: for x² + bx + c = 0, the sum of the solutions is −b. No factoring needed.",
  };
});

reg("quad-discriminant", "nleq", ["hard"], () => {
  const m = rnd(2, 9), c = m * m, k = 2 * m;
  return {
    stem: `x² + kx + ${c} = 0\n\nIn the given equation, k is a positive constant. The equation has exactly one real solution. What is the value of k?`,
    choices: numChoices(k, `Exactly one real solution means the discriminant is 0: k² ${MINUS} 4(${c}) = 0, so k² = ${4 * c} and k = ${k}.`, [
      [m, `${m} is √${c}. The condition is k² = 4 · ${c}, so k = 2 · ${m}.`],
      [4 * c, `${4 * c} is k², not k.`],
      [c, `${c} is the constant term; it would make the discriminant ${c * c - 4 * c}, which is positive, giving two solutions.`],
    ], v => v > 0 && eq(v * v - 4 * c, 0)),
    concept: "The discriminant b² − 4ac determines the number of real solutions.",
    misconception: "Forgetting the factor of 4; stopping at k².",
    steps: [`Discriminant: k² ${MINUS} 4(1)(${c}) = k² ${MINUS} ${4 * c}.`, `One solution: k² ${MINUS} ${4 * c} = 0, so k = ${k} (k is positive).`, `Check: x² + ${k}x + ${c} = (x + ${m})².`],
    strategy: "Exactly one solution means the quadratic is a perfect square.",
    time: 100,
  };
});

reg("radical-eq", "nleq", ["medium"], () => {
  let s, b, a, r;
  for (let tries = 0; tries < 50; tries++) {
    b = rnd(1, 6); s = b + rnd(2, 6); const t = s - b; a = t * t - s; r = 2 * b + 1 - s;
    if (r !== s && r + a >= 0 && r - b < 0 && a !== 0) break; else r = null;
  }
  if (r === null) return null;
  const works = v => v - b >= 0 && eq(Math.sqrt(v + a), v - b);
  return {
    stem: `sqrt(x ${a < 0 ? MINUS : "+"} ${Math.abs(a)}) = x ${MINUS} ${b}\n\nWhat are all the solutions to the given equation?`,
    choices: [[`${N(s)} only`, `Squaring gives ${poly([1, -(2 * b + 1), b * b - a])} = 0, so x = ${N(s)} or x = ${N(r)}. Only ${N(s)} checks: √${s + a} = ${s - b}.`, [s]],
              [`${N(r)} only`, `x = ${N(r)} is extraneous: the right side is ${N(r - b)}, but a square root cannot be negative.`, [r]],
              [`${N(r)} and ${N(s)}`, `Both come from the squared equation, but x = ${N(r)} fails the original equation.`, [r, s]],
              ["There are no solutions.", `x = ${N(s)} works in the original equation.`, []]]
      .map(([t, why, set]) => ({ t, why, ok: set.length === 1 && works(set[0]) && !works(r) && set[0] === s })),
    concept: "Squaring both sides can introduce extraneous solutions, so every candidate must be checked.",
    misconception: "Keeping both solutions of the squared equation without checking.",
    steps: [`Square both sides: x ${a < 0 ? MINUS : "+"} ${Math.abs(a)} = x² ${MINUS} ${2 * b}x + ${b * b}.`, `Rearrange: ${poly([1, -(2 * b + 1), b * b - a])} = 0, so x = ${N(s)} or x = ${N(r)}.`, `Check: at x = ${N(r)}, the right side is ${N(r - b)} < 0, which a square root can never equal. Only x = ${N(s)} works.`],
    strategy: "After squaring, always substitute each answer back into the original equation.",
  };
});

reg("rational-eq", "nleq", ["medium"], () => {
  const c = pick([2, 3, 4, 5, 6]), b = nz(-8, 8), x = nz(-9, 12);
  if (x + b === 0) return null;
  const a = c * (x + b);
  return {
    stem: `\\frac{${a}}{${lin(1, b)}} = ${c}\n\nWhat is the solution to the given equation?`,
    choices: numChoices(x, `Multiply both sides by (${lin(1, b)}): ${a} = ${c}(${lin(1, b)}), so ${lin(1, b)} = ${a / c} and x = ${N(x)}.`, [
      [a * c - b, `This multiplies ${a} by ${c} instead of dividing.`],
      [a / c + b, `This ${b < 0 ? "subtracts" : "adds"} ${Math.abs(b)} instead of ${b < 0 ? "adding" : "subtracting"} it.`],
      [a / c, `${a / c} is the value of ${lin(1, b)}, not x.`],
    ], v => !eq(v + b, 0) && eq(a / (v + b), c)),
    concept: "Clear the denominator by multiplying both sides, then solve.",
    misconception: "Multiplying when you should divide; stopping one step early.",
    steps: [`${a} = ${c}(${lin(1, b)}).`, `${lin(1, b)} = ${a / c}.`, `x = ${N(x)}.`],
    strategy: "Check that your answer does not make the denominator zero.",
  };
});

reg("nl-system", "nleq", ["hard"], () => {
  let r1, r2; do { r1 = rnd(1, 7); r2 = -rnd(1, 7); } while (r1 === -r2);
  const p = nz(-6, 6), m = r1 + r2, c = p - r1 * r2;       // x² + p = mx + c  ->  x² - mx + (p - c) = 0
  if (m === 0) return null;
  const yAt = x => x * x + p;
  return {
    stem: `y = x² ${p < 0 ? MINUS : "+"} ${Math.abs(p)}\ny = ${lin(m, c)}\n\nThe graphs of the given equations intersect at two points. What is the x-coordinate of the intersection point with a positive x-coordinate?`,
    choices: numChoices(r1, `Set the expressions equal: ${poly([1, -m, p - c])} = 0, which factors as (x ${MINUS} ${r1})(x + ${-r2}) = 0. The positive solution is ${r1}.`, [
      [r2, `${N(r2)} is the other intersection's x-coordinate, which is negative.`],
      [m, `${N(m)} is the slope of the line (and the sum of the two x-coordinates), not an x-coordinate.`],
      [yAt(r1), `${N(yAt(r1))} is the y-coordinate of the intersection point.`],
    ], v => v > 0 && eq(v * v + p, m * v + c)),
    concept: "Solve a linear-quadratic system by substitution, then factor.",
    misconception: "Answering with the y-coordinate; choosing the wrong root.",
    steps: [`x² ${p < 0 ? MINUS : "+"} ${Math.abs(p)} = ${lin(m, c)}.`, `${poly([1, -m, p - c])} = 0.`, `(x ${MINUS} ${r1})(x + ${-r2}) = 0, so x = ${r1} or x = ${N(r2)}.`],
    strategy: "When two expressions both equal y, set them equal to each other.",
    time: 120,
  };
});

reg("fn-notation", "nlfun", ["easy", "medium"], d => {
  if (d === "easy") {
    const a = nz(-4, 5), c = nz(-12, 12), k = nz(-5, 5), y = a * k * k + c;
    return {
      stem: `f(x) = ${poly([a, 0, c])}\n\nFor the given function f, what is the value of f(${N(k)})?`,
      choices: numChoices(y, `f(${N(k)}) = ${N(a)}(${N(k)})² ${c < 0 ? MINUS : "+"} ${Math.abs(c)} = ${N(a)}(${k * k}) ${c < 0 ? MINUS : "+"} ${Math.abs(c)} = ${N(y)}.`, [
        [a * a * k * k + c, `This squares the coefficient too, computing (${N(a)} · ${k < 0 ? "(" + N(k) + ")" : k})²; only x is squared.`],
        [a * 2 * k + c, `This multiplies by 2 instead of squaring.`],
        [-(a * k * k) + c, `This treats (${N(k)})² as negative; squaring a negative number gives a positive result.`],
      ], v => eq(v, a * k * k + c)),
      concept: "Evaluate a function by substitution, following the order of operations.",
      misconception: "Squaring the coefficient; sign errors when squaring negatives.",
      steps: [`Square first: (${N(k)})² = ${k * k}.`, `Multiply by ${N(a)}: ${N(a * k * k)}.`, `${c < 0 ? "Subtract" : "Add"} ${Math.abs(c)}: ${N(y)}.`],
      strategy: "Wrap negative inputs in parentheses before squaring.",
    };
  }
  const p = nz(-5, 5), b = nz(-6, 6), k = nz(-4, 4);
  const f = x => x * x + p, g = x => 2 * x + b;
  if (f(g(k)) === g(f(k))) return null;
  return {
    stem: `f(x) = x² ${p < 0 ? MINUS : "+"} ${Math.abs(p)}\ng(x) = ${lin(2, b)}\n\nWhat is the value of f(g(${N(k)}))?`,
    choices: numChoices(f(g(k)), `Work from the inside out: g(${N(k)}) = ${N(g(k))}, then f(${N(g(k))}) = ${N(f(g(k)))}.`, [
      [g(f(k)), `${N(g(f(k)))} is g(f(${N(k)})); the inner function must be applied first.`],
      [f(k) * g(k), `${N(f(k) * g(k))} is f(${N(k)}) · g(${N(k)}), a product, not a composition.`],
      [f(k) + g(k), `${N(f(k) + g(k))} is f(${N(k)}) + g(${N(k)}).`],
    ], v => eq(v, f(g(k)))),
    concept: "Composition f(g(x)): apply g first, then apply f to the result.",
    misconception: "Applying the functions in the wrong order; multiplying instead of composing.",
    steps: [`g(${N(k)}) = 2(${N(k)}) ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${N(g(k))}.`, `f(${N(g(k))}) = (${N(g(k))})² ${p < 0 ? MINUS : "+"} ${Math.abs(p)} = ${N(f(g(k)))}.`],
    strategy: "Start with the innermost parentheses and work outward.",
  };
});

reg("exp-model", "nlfun", ["medium"], () => {
  const grow = Math.random() < 0.5;
  const r = grow ? pick([3, 4, 5, 6, 8, 12, 15]) : pick([5, 8, 10, 12, 15, 20, 25]);
  const base = grow ? 1 + r / 100 : 1 - r / 100, V0 = pick([800, 1200, 1500, 2000, 2500, 5000]);
  const ctx = grow ? ["The value V, in dollars, of an investment t years after it was made", "the value of the investment"]
                   : ["The number of milligrams M of a medication remaining in a patient's bloodstream t hours after a dose", "the amount of medication remaining"];
  const sym = grow ? "V" : "M";
  const right = `${ctx[1][0].toUpperCase() + ctx[1].slice(1)} ${grow ? "increases" : "decreases"} by ${r}% each ${grow ? "year" : "hour"}.`;
  return {
    stem: `${ctx[0]} is modeled by ${sym} = ${V0.toLocaleString("en-US")}(${base.toFixed(2)})^{t}. Which statement best describes how ${ctx[1]} changes over time?`,
    choices: [
      { t: right, ok: true, why: `Each ${grow ? "year" : "hour"}, the amount is multiplied by ${base.toFixed(2)}, which is ${grow ? "100% + " + r + "%" : "100% − " + r + "%"} of the previous amount.` },
      { t: `${ctx[1][0].toUpperCase() + ctx[1].slice(1)} ${grow ? "increases" : "decreases"} by ${Math.round(base * 100)}% each ${grow ? "year" : "hour"}.`, ok: false, why: `${base.toFixed(2)} is the growth factor; the percent change is ${r}%, the difference between ${base.toFixed(2)} and 1.` },
      { t: `${ctx[1][0].toUpperCase() + ctx[1].slice(1)} ${grow ? "increases" : "decreases"} by ${(V0 * r / 100).toLocaleString("en-US")} ${grow ? "dollars each year" : "milligrams each hour"}.`, ok: false, why: "That would be a linear model. Here the change is a percent of the current amount, so it is not a constant amount." },
      { t: `${ctx[1][0].toUpperCase() + ctx[1].slice(1)} ${grow ? "decreases" : "increases"} by ${r}% each ${grow ? "year" : "hour"}.`, ok: false, why: `A base ${grow ? "greater" : "less"} than 1 means the quantity ${grow ? "grows" : "shrinks"}.` },
    ],
    concept: "In y = a(1 ± r)^t, the base is the growth or decay factor and r is the percent change per period.",
    misconception: "Reading the factor as the percent; treating exponential change as linear.",
    steps: [`The base is ${base.toFixed(2)}, which is ${grow ? "1 + " : "1 − "}${(r / 100).toFixed(2)}.`, `So each period the amount is multiplied by ${base.toFixed(2)}: a ${r}% ${grow ? "increase" : "decrease"}.`],
    strategy: "Base above 1: growth by (base − 1). Base below 1: decay by (1 − base).",
  };
});

reg("exp-build", "nlfun", ["hard"], () => {
  const N0 = pick([200, 300, 500, 800, 1200]), T = pick([2, 3, 4, 5, 6]), F = pick([2, 3]);
  const word = F === 2 ? "doubles" : "triples";
  const truth = t => N0 * Math.pow(F, t / T);
  const opts = [[`P(t) = ${N0}(${F})^{t/${T}}`, t => N0 * Math.pow(F, t / T), `At t = ${T}, the exponent is 1, so the population has been multiplied by ${F} once. This matches "${word} every ${T} hours."`],
                [`P(t) = ${N0}(${F})^{${T}t}`, t => N0 * Math.pow(F, T * t), `This multiplies by ${F} ${T} times every hour, far faster than the described growth.`],
                [`P(t) = ${N0}(${T})^{t/${F}}`, t => N0 * Math.pow(T, t / F), `This swaps the growth factor (${F}) and the time period (${T} hours).`],
                [`P(t) = ${N0} + ${F}^{t/${T}}`, t => N0 + Math.pow(F, t / T), "Exponential growth multiplies the initial amount; it does not add to it."]];
  return {
    stem: `A colony of bacteria has an initial population of ${N0}. The population ${word} every ${T} hours. Which function P gives the population t hours after the initial measurement?`,
    choices: opts.map(([t, f, why]) => ({ t, ok: [0, T, 2 * T, 1.5].every(x => eq(f(x), truth(x))), why })),
    concept: "Growth by a factor F every T units of time is modeled by a · F^(t/T).",
    misconception: "Putting the period in the wrong place in the exponent.",
    steps: [`Start at ${N0}.`, `Every ${T} hours, multiply by ${F}: after t hours there have been t/${T} periods.`, `P(t) = ${N0}(${F})^{t/${T}}.`],
    strategy: `Test t = ${T}: the correct model must give ${F} × ${N0} = ${F * N0}.`,
    time: 100,
  };
});

reg("vertex", "nlfun", ["hard"], () => {
  const h = nz(-6, 6), k = nz(-15, 15);
  const b = -2 * h, c = h * h + k;
  return {
    stem: `f(x) = ${poly([1, b, c])}\n\nWhat is the minimum value of the function f?`,
    choices: numChoices(k, `Complete the square: f(x) = (x ${h < 0 ? "+" : MINUS} ${Math.abs(h)})² ${k < 0 ? MINUS : "+"} ${Math.abs(k)}. The squared term is at least 0, so the minimum value is ${N(k)}.`, [
      [h, `${N(h)} is the x-value where the minimum occurs, not the minimum value.`],
      [c, `${N(c)} is f(0), the y-intercept.`],
      [-k, "This has the wrong sign; the constant after completing the square is the minimum value itself."],
    ], v => eq(v, c - (b * b) / 4)),
    concept: "Vertex form f(x) = (x − h)² + k shows the minimum value k at x = h.",
    misconception: "Giving the x-coordinate of the vertex; confusing the y-intercept with the minimum.",
    steps: [`The vertex is at x = −b/2 = ${N(h)}.`, `f(${N(h)}) = (${N(h)})² ${b < 0 ? MINUS : "+"} ${Math.abs(b)}(${N(h)}) ${c < 0 ? MINUS : "+"} ${Math.abs(c)} = ${N(k)}.`],
    strategy: "Value means the output (y). Location means the input (x). Read the question carefully.",
    time: 100,
  };
});

reg("transform", "nlfun", ["medium"], () => {
  const u = nz(-5, 5), v = nz(-6, 6), p = nz(-4, 4), q = nz(-5, 5);
  if (p === q || p === -q) return null;
  const P = (x, y) => `(${N(x)}, ${N(y)})`;
  const isOnG = (x, y) => x - p === u && y - q === v;     // g(x) = f(x - p) + q and f(u) = v
  const pts = [[u + p, v + q, `g(${N(u + p)}) = f(${N(u + p)} ${MINUS} ${p < 0 ? "(" + N(p) + ")" : p}) ${q < 0 ? MINUS : "+"} ${Math.abs(q)} = f(${N(u)}) ${q < 0 ? MINUS : "+"} ${Math.abs(q)} = ${N(v + q)}.`],
               [u - p, v + q, `f(x ${p < 0 ? "+" : MINUS} ${Math.abs(p)}) shifts the graph ${p > 0 ? "right" : "left"}, not ${p > 0 ? "left" : "right"}.`],
               [u + p, v - q, `Adding ${N(q)} outside the function moves the graph ${q > 0 ? "up" : "down"}, not ${q > 0 ? "down" : "up"}.`],
               [u + q, v + p, "This swaps the horizontal and vertical shifts."]];
  return {
    stem: `The graph of y = f(x) passes through the point ${P(u, v)}. The function g is defined by g(x) = f(x ${p < 0 ? "+" : MINUS} ${Math.abs(p)}) ${q < 0 ? MINUS : "+"} ${Math.abs(q)}. Which point must lie on the graph of y = g(x)?`,
    choices: pts.map(([x, y, why]) => ({ t: P(x, y), ok: isOnG(x, y), why })),
    concept: "f(x − p) shifts a graph p units right; adding q shifts it q units up.",
    misconception: "Shifting horizontally in the wrong direction; swapping shifts.",
    steps: [`Inside the parentheses, x ${p < 0 ? "+" : MINUS} ${Math.abs(p)} means a horizontal shift of ${Math.abs(p)} ${p > 0 ? "right" : "left"}.`, `Outside, ${q < 0 ? MINUS : "+"} ${Math.abs(q)} means a vertical shift of ${Math.abs(q)} ${q > 0 ? "up" : "down"}.`, `${P(u, v)} moves to ${P(u + p, v + q)}.`],
    strategy: "Horizontal shifts work opposite to the sign inside the parentheses; vertical shifts match the sign outside.",
  };
});

reg("poly-zeros", "nlfun", ["medium"], () => {
  let a, b, c; do { a = nz(-6, 6); b = nz(-6, 6); c = pick([1, 3, 5, 7]) * pick([-1, 1]); } while (new Set([a, -b, c / 2]).size < 3 || Math.abs(a) === Math.abs(b));
  const pz = x => (x - a) * (x + b) * (2 * x - c);
  const cands = [a, -b, c / 2];
  const correct = pick(cands);
  const wrongPool = [[-a, `x = ${N(-a)} makes x ${a < 0 ? "+" : MINUS} ${Math.abs(a)} nonzero; the zero from that factor is x = ${N(a)}.`],
                     [b, `The factor x ${b < 0 ? MINUS : "+"} ${Math.abs(b)} is zero at x = ${N(-b)}, not ${N(b)}.`],
                     [c, `Setting 2x ${c < 0 ? "+" : MINUS} ${Math.abs(c)} = 0 gives x = ${fr(c, 2)}; ${N(c)} forgets to divide by 2.`],
                     [-c / 2, `This has the wrong sign; 2x ${c < 0 ? "+" : MINUS} ${Math.abs(c)} = 0 gives x = ${fr(c, 2)}.`]]
    .filter(([v]) => !eq(pz(v), 0));
  if (wrongPool.length < 3) return null;
  const show = v => (Number.isInteger(v) ? N(v) : fr(Math.round(v * 2), 2));
  return {
    stem: `p(x) = (x ${a < 0 ? "+" : MINUS} ${Math.abs(a)})(x ${b < 0 ? MINUS : "+"} ${Math.abs(b)})(2x ${c < 0 ? "+" : MINUS} ${Math.abs(c)})\n\nWhich of the following is an x-intercept of the graph of y = p(x) in the xy-plane?`,
    choices: [[correct, `p(${show(correct)}) = 0 because one of the factors is zero there.`], ...shuffle(wrongPool).slice(0, 3)]
      .map(([v, why]) => ({ t: `(${show(v)}, 0)`, ok: eq(pz(v), 0), why })),
    concept: "Each factor of a polynomial gives an x-intercept where that factor equals 0.",
    misconception: "Sign errors reading zeros from factors; forgetting the leading coefficient in a factor like 2x − c.",
    steps: [`Set each factor equal to 0: x = ${N(a)}, x = ${N(-b)}, x = ${fr(c, 2)}.`, `Only (${show(correct)}, 0) appears among the choices.`],
    strategy: "Plug the x-value into the factored form: if any factor is 0, the point is an intercept.",
  };
});

// ======================= PROBLEM-SOLVING AND DATA ANALYSIS =======================

reg("ratio-parts", "ratio", ["easy"], () => {
  const a = rnd(2, 7); let b; do { b = rnd(2, 9); } while (b === a || gcd(a, b) !== 1);
  const k = rnd(3, 15), total = (a + b) * k;
  return {
    stem: `In a school orchestra, the ratio of string players to wind players is ${a} to ${b}. There are ${total} string and wind players in all. How many string players are in the orchestra?`,
    choices: numChoices(a * k, `${a} + ${b} = ${a + b} parts, so each part is ${total} ÷ ${a + b} = ${k}. String players: ${a} × ${k} = ${a * k}.`, [
      [b * k, `${b * k} is the number of wind players.`],
      [Math.round(total * a / b), `This treats ${a}:${b} as part-to-total in the wrong way, multiplying the total by ${a}/${b}.`],
      [total - a * b, "This subtracts the product of the ratio terms, which has no meaning here."],
    ], v => eq(v, a * k) && eq(v / (total - v), a / b)),
    concept: "A ratio a:b splits a total into a + b equal parts.",
    misconception: "Using the ratio as part-to-part when part-to-whole is needed.",
    steps: [`Total parts: ${a + b}.`, `One part: ${total} ÷ ${a + b} = ${k}.`, `String players: ${a} × ${k} = ${a * k}.`],
    strategy: "Check: your two groups should add to the total and match the ratio.",
  };
});

reg("unit-convert", "ratio", ["medium"], () => {
  const s = 18 * rnd(2, 8);
  const ms = s * 5 / 18;
  return {
    stem: `A train travels at a constant speed of ${s} kilometers per hour. What is the train's speed in meters per second? (1 kilometer = 1,000 meters)`,
    choices: numChoices(ms, `${s} km/h × 1,000 m/km ÷ 3,600 s/h = ${ms} m/s.`, [
      [s * 1000 / 60, "This divides by 60 (minutes per hour) instead of 3,600 (seconds per hour), giving meters per minute."],
      [s * 3.6, "This multiplies by 3.6; converting km/h to m/s requires dividing by 3.6."],
      [s / 60, "This converts hours to minutes but never converts kilometers to meters."],
    ], v => eq(v * 3600 / 1000, s), v => (Number.isInteger(v) ? v.toLocaleString("en-US") : v.toFixed(1))),
    concept: "Convert units by multiplying by conversion factors so unwanted units cancel.",
    misconception: "Using minutes instead of seconds; multiplying when dividing is needed.",
    steps: [`${s} km/h × (1,000 m / 1 km) = ${(s * 1000).toLocaleString("en-US")} m/h.`, `${(s * 1000).toLocaleString("en-US")} m/h ÷ 3,600 s/h = ${ms} m/s.`],
    strategy: "Write every conversion as a fraction and cancel units. A speed in m/s is always smaller than the same speed in km/h.",
  };
});

reg("proportion", "ratio", ["easy", "medium"], d => {
  const cm = d === "easy" ? 1 : rnd(2, 5), km = rnd(3, 25) * (d === "easy" ? 1 : 2), dist = cm * rnd(2, 9) + (d === "easy" ? 0 : cm / 2 * (Math.random() < 0.5 ? 1 : 0));
  const ans = dist * km / cm;
  if (!Number.isInteger(ans * 2)) return null;
  return {
    stem: `On a map, ${cm} centimeter${cm === 1 ? "" : "s"} represent${cm === 1 ? "s" : ""} ${km} kilometers. Two towns are ${dist} centimeters apart on the map. What is the actual distance, in kilometers, between the two towns?`,
    choices: numChoices(ans, `Set up ${cm}/${km} = ${dist}/d, so d = ${dist} × ${km} ÷ ${cm} = ${ans}.`, [
      [dist * km, cm === 1 ? `${dist * km + km} adds an extra unit.` : `This forgets that ${cm} centimeters, not 1, correspond to ${km} km.`],
      [dist * cm / km, "This inverts the scale, dividing by the kilometers instead of multiplying."],
      [dist + km, "Scales multiply; they do not add."],
    ].map(([v, w], i) => (i === 0 && cm === 1 ? [dist * km + km, w] : [v, w])), v => eq(v / dist, km / cm), v => (Number.isInteger(v) ? String(v) : v.toFixed(1))),
    concept: "Set up a proportion with matching units in matching positions.",
    misconception: "Inverting the scale factor; adding instead of multiplying.",
    steps: [`Scale: ${km} km per ${cm} cm = ${km / cm} km per cm.`, `${dist} cm × ${km / cm} km/cm = ${ans} km.`],
    strategy: "Find the value of one unit first, then multiply.",
  };
});

reg("work-rate", "ratio", ["hard"], () => {
  const pairs = [[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [6, 3], [5, 20], [9, 18], [8, 24]];
  const [a, b] = pick(pairs), t = a * b / (a + b);
  return {
    stem: `Working alone, pump A can fill a tank in ${a} hours, and pump B can fill the same tank in ${b} hours. If both pumps work together at these rates, how many hours will it take to fill the tank?`,
    choices: numChoices(t, `Combined rate: 1/${a} + 1/${b} = ${fr(a + b, a * b)} tank per hour, so time = ${fr(a * b, a + b)} hours.`, [
      [(a + b) / 2, "This averages the two times; working together must be faster than either pump alone."],
      [a + b, "Adding the times describes the pumps working one after another, not together."],
      [Math.abs(a - b), "Subtracting the times has no meaning for combined work."],
    ], v => eq(v * (1 / a + 1 / b), 1)),
    concept: "Combined work: add rates (jobs per hour), not times.",
    misconception: "Averaging or adding the times.",
    steps: [`Pump A: 1/${a} tank per hour. Pump B: 1/${b} tank per hour.`, `Together: ${fr(a + b, a * b)} tank per hour.`, `Time = 1 ÷ ${fr(a + b, a * b)} = ${fr(a * b, a + b)} hours.`],
    strategy: "Sanity check: working together, the time must be less than the faster pump's time alone.",
    time: 110,
  };
});

reg("pct-change", "pct", ["easy"], () => {
  const P = 20 * rnd(2, 20), dsc = 5 * rnd(1, 8), price = (P * (100 - dsc)) / 100;
  return {
    stem: `A jacket originally costs ${money(P)}. It is on sale for ${dsc}% off the original price. What is the sale price of the jacket?`,
    choices: numChoices(price, `${dsc}% of ${money(P)} is ${money(P * dsc / 100)}, so the sale price is ${money(P)} ${MINUS} ${money(P * dsc / 100)} = ${money(price)}.`, [
      [P - dsc, `This subtracts ${dsc} dollars, not ${dsc} percent.`],
      [P * dsc / 100, `${money(P * dsc / 100)} is the discount, not the sale price.`],
      [P * (100 + dsc) / 100, `This adds ${dsc}% instead of subtracting it.`],
    ], v => eq(v, P * (1 - dsc / 100)), money),
    concept: "A p% decrease leaves (100 − p)% of the original amount.",
    misconception: "Subtracting the percent as if it were dollars; reporting the discount.",
    steps: [`Sale price = ${money(P)} × ${(1 - dsc / 100).toFixed(2)} = ${money(price)}.`],
    strategy: "Multiply once by (1 − rate) instead of finding the discount and subtracting.",
  };
});

reg("pct-successive", "pct", ["medium"], () => {
  const V = 100 * rnd(2, 12), p = 5 * rnd(2, 8), q = 5 * rnd(2, 8);
  const right = V * (1 + p / 100) * (1 - q / 100);
  if (!Number.isInteger(right * 100)) return null;
  return {
    stem: `The price of a bicycle was ${money(V)}. The price was increased by ${p}%, and then the new price was decreased by ${q}%. What was the final price of the bicycle?`,
    choices: numChoices(right, `${money(V)} × ${(1 + p / 100).toFixed(2)} = ${money(V * (1 + p / 100))}; then × ${(1 - q / 100).toFixed(2)} = ${money(right)}.`, [
      [V * (1 + (p - q) / 100), `This combines the changes into one change of ${p - q}%. The ${q}% decrease applies to the new, ${p > 0 ? "higher" : "lower"} price, not the original.`],
      [V * (1 + p / 100) - q, `This subtracts ${q} dollars instead of ${q}%.`],
      [V * (1 + p / 100) * (q / 100), `This finds ${q}% of the increased price, which is the size of the decrease, not the final price.`],
    ], v => eq(v, V * (1 + p / 100) * (1 - q / 100)), money),
    concept: "Successive percent changes multiply; they do not add.",
    misconception: "Adding or subtracting percents that apply to different base amounts.",
    steps: [`After the increase: ${money(V)} × ${(1 + p / 100).toFixed(2)} = ${money(V * (1 + p / 100))}.`, `After the decrease: ${money(V * (1 + p / 100))} × ${(1 - q / 100).toFixed(2)} = ${money(right)}.`],
    strategy: "Turn each percent change into a multiplier and multiply them all.",
  };
});

reg("pct-reverse", "pct", ["hard"], () => {
  const P = 20 * rnd(3, 30), r = pick([10, 15, 20, 25, 30, 35, 40]), X = P * (1 - r / 100);
  return {
    stem: `After a ${r}% discount, the price of a tablet is ${money(X)}. What was the price of the tablet before the discount?`,
    choices: numChoices(P, `The sale price is ${100 - r}% of the original: ${(1 - r / 100).toFixed(2)}P = ${money(X)}, so P = ${money(X)} ÷ ${(1 - r / 100).toFixed(2)} = ${money(P)}.`, [
      [Math.round(X * (1 + r / 100) * 100) / 100, `This increases the sale price by ${r}%, but the discount was ${r}% of the original, larger price.`],
      [X + r, `This adds ${r} dollars, not percent.`],
      [Math.round(X / (1 + r / 100) * 100) / 100, `This divides by ${(1 + r / 100).toFixed(2)}, which would undo an increase, not a discount.`],
    ], v => eq(v * (1 - r / 100), X), money),
    concept: "To undo a percent change, divide by the multiplier.",
    misconception: "Adding the same percent back to the new amount.",
    steps: [`Sale price = original × ${(1 - r / 100).toFixed(2)}.`, `Original = ${money(X)} ÷ ${(1 - r / 100).toFixed(2)} = ${money(P)}.`],
    strategy: `Check: ${r}% off ${money(P)} should give ${money(X)}.`,
    time: 100,
  };
});

reg("pct-of-pct", "pct", ["hard"], () => {
  const a = pick([120, 125, 150, 160, 175, 200, 250]), b = pick([20, 30, 40, 60, 80]);
  const right = a * b / 100;
  return {
    stem: `The value of x is ${a}% of the value of y, and the value of y is ${b}% of the value of z. The value of x is what percent of the value of z?`,
    choices: numChoices(right, `x = ${(a / 100).toFixed(2)}y and y = ${(b / 100).toFixed(2)}z, so x = ${(a / 100).toFixed(2)} × ${(b / 100).toFixed(2)}z = ${(right / 100).toFixed(2)}z, which is ${right}% of z.`, [
      [a + b, "Percents of different bases cannot be added; they multiply."],
      [a - b, "Subtracting percents does not chain the relationships."],
      [Math.round(a / b * 100), `This divides ${a} by ${b}; the relationships chain by multiplication.`],
    ], v => eq(v / 100, (a / 100) * (b / 100)), v => v + "%"),
    concept: "Chain percent relationships by multiplying their decimal forms.",
    misconception: "Adding percents that refer to different wholes.",
    steps: [`x = ${(a / 100).toFixed(2)}y.`, `y = ${(b / 100).toFixed(2)}z.`, `x = ${(right / 100).toFixed(2)}z, or ${right}% of z.`],
    strategy: "Pick z = 100 and compute y, then x. The number you get is the percent.",
    time: 100,
  };
});

reg("mean-missing", "one", ["easy"], () => {
  const M = rnd(65, 85), v = [rnd(55, 95), rnd(55, 95), rnd(55, 95), rnd(55, 95)];
  const sum = v.reduce((a, b) => a + b, 0), fifth = 5 * M - sum;
  if (fifth < 40 || fifth > 100) return null;
  return {
    stem: `A student's mean score on five quizzes is ${M}. The student's scores on four of the quizzes are ${v.join(", ")}. What is the student's score on the fifth quiz?`,
    choices: numChoices(fifth, `The five scores sum to 5 × ${M} = ${5 * M}. Subtract the four known scores (${sum}) to get ${fifth}.`, [
      [M, `${M} is the mean; the fifth score must make the total equal 5 × ${M}.`],
      [Math.round(sum / 4), `${Math.round(sum / 4)} is the mean of the four known scores.`],
      [2 * M - sum / 4, `This treats the four known scores as one score of ${sum / 4} and balances it against the mean. The five scores' total, not one average, must equal 5 × ${M}.`],
    ], x => eq((sum + x) / 5, M), x => (Number.isInteger(x) ? String(x) : String(x))),
    concept: "Mean × number of values = sum of the values.",
    misconception: "Using the mean itself as the missing value; using the wrong count.",
    steps: [`Total needed: 5 × ${M} = ${5 * M}.`, `Known total: ${v.join(" + ")} = ${sum}.`, `Fifth score: ${5 * M} ${MINUS} ${sum} = ${fifth}.`],
    strategy: "Work with sums, not averages.",
  };
});

reg("median-freq", "one", ["medium"], () => {
  const vals = [0, 1, 2, 3, 4, 5], counts = vals.map(() => rnd(1, 8));
  const data = []; vals.forEach((v, i) => { for (let j = 0; j < counts[i]; j++) data.push(v); });
  const n = data.length;
  const med = n % 2 ? data[(n - 1) / 2] : (data[n / 2 - 1] + data[n / 2]) / 2;
  const mean = Math.round(data.reduce((a, b) => a + b, 0) / n * 100) / 100;
  const mode = vals[counts.indexOf(Math.max(...counts))];
  if (counts.filter(c => c === Math.max(...counts)).length > 1) return null;
  const show = v => (Number.isInteger(v) ? String(v) : String(v));
  return {
    stem: `The table shows the number of books read last month by each student in a class. What is the median number of books read?`,
    stimulus: { kind: "table", head: ["Books read", "Number of students"], rows: vals.map((v, i) => [String(v), String(counts[i])]) },
    choices: numChoices(med, `There are ${n} students. In order, the median is ${n % 2 ? "the " + ((n + 1) / 2) + "th value" : "the average of the " + (n / 2) + "th and " + (n / 2 + 1) + "th values"}, which is ${show(med)}.`, [
      [2.5, "2.5 is the median of the six table values 0 to 5, ignoring how many students read each number."],
      [mode, `${mode} is the mode: the most common number of books, read by ${Math.max(...counts)} students.`],
      [mean, `${show(mean)} is the mean number of books, not the median.`],
    ].filter(([v]) => !eq(v, med)).slice(0, 3).concat([[med + 1.5, "This miscounts the position of the middle value."]]).slice(0, 3), v => eq(v, med), show),
    concept: "The median is the middle value when every data value is listed in order, counting repeats.",
    misconception: "Taking the median of the category labels; confusing median with mode or mean.",
    steps: [`Total students: ${counts.join(" + ")} = ${n}.`, `The middle position is ${n % 2 ? (n + 1) / 2 : (n / 2) + " and " + (n / 2 + 1)}.`, `Count through the table to that position: median = ${show(med)}.`],
    strategy: "Use a running total of the frequencies to find which row contains the middle position.",
  };
});

reg("outlier", "one", ["hard"], () => {
  const base = []; for (let i = 0; i < 7; i++) base.push(rnd(10, 30));
  base.sort((a, b) => a - b);
  const maxV = base[6], w = maxV + rnd(25, 60);
  const after = base.slice(0, 6).concat([w]);
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length, med = a => a.slice().sort((x, y) => x - y)[3];
  const dMean = mean(after) - mean(base), dMed = med(after) - med(base);
  if (base[5] === base[6]) return null;
  const label = (mm, md) => `The mean ${mm}, and the median ${md}.`;
  const truthFor = (meanUp, medUp) => (meanUp ? dMean > 0 : eq(dMean, 0)) && (medUp ? dMed > 0 : eq(dMed, 0));
  return {
    stem: `A data set consists of these seven values: ${base.join(", ")}. The value ${maxV} is replaced with ${w}. Which statement describes how the mean and the median of the data set change?`,
    choices: [[true, false, `Raising the largest value increases the sum (so the mean increases) but does not change which value is in the middle (so the median stays ${med(base)}).`],
              [true, true, `The median depends only on the middle (4th) value, ${med(base)}, which does not change.`],
              [false, true, "The sum increases, so the mean must increase; the median does not move."],
              [false, false, "The mean is affected by every value, including the largest one."]]
      .map(([a, b, why]) => ({ t: label(a ? "increases" : "stays the same", b ? "increases" : "stays the same"), ok: truthFor(a, b), why })),
    concept: "The mean is sensitive to extreme values; the median is resistant to them.",
    misconception: "Assuming the median moves whenever the mean does.",
    steps: [`Original median (4th of 7 values in order): ${med(base)}. New median: ${med(after)}.`, `Original mean: ${mean(base).toFixed(2)}. New mean: ${mean(after).toFixed(2)}.`],
    strategy: "Changing the largest or smallest value changes the mean but rarely the median.",
    time: 90,
  };
});

reg("spread", "one", ["medium"], () => {
  const c = rnd(20, 40);
  const tight = [c - 2, c - 1, c - 1, c, c, c + 1, c + 1, c + 2];
  const wide = [c - 9, c - 7, c - 4, c, c, c + 4, c + 7, c + 9];
  const sd = a => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
  const swap = Math.random() < 0.5;
  const A = swap ? wide : tight, B = swap ? tight : wide;
  const big = sd(A) > sd(B) ? "A" : "B";
  return {
    stem: `Data set A: ${A.join(", ")}\nData set B: ${B.join(", ")}\n\nBoth data sets have a mean of ${c}. Which statement about the standard deviations of the two data sets is true?`,
    choices: [["The standard deviation of data set A is greater.", "A"], ["The standard deviation of data set B is greater.", "B"],
              ["The standard deviations are equal, because the means are equal.", "="], ["The standard deviations cannot be compared without more information.", "?"]]
      .map(([t, k]) => ({ t, ok: k === big, why: k === big ? `Data set ${big}'s values are spread much farther from ${c}, so its standard deviation is greater.`
        : k === "=" ? "Equal means say nothing about spread." : k === "?" ? "The full lists are given, so the spreads can be compared directly." : `Data set ${k}'s values cluster close to the mean, so its standard deviation is smaller.` })),
    concept: "Standard deviation measures how far values typically are from the mean.",
    misconception: "Thinking equal means imply equal spread.",
    steps: [`Data set ${big} has values as far as ${big === "A" ? Math.max(...A) - c : Math.max(...B) - c} from the mean; the other set's values are within 2.`, `So data set ${big} has the greater standard deviation.`],
    strategy: "You rarely need to compute standard deviation on the SAT; compare how spread out the values are.",
  };
});

reg("fit-predict", "two", ["medium"], () => {
  const m = pick([1.5, 2, 2.5, 3, 4]), b = rnd(5, 30), xs = [];
  for (let x = 1; x <= 10; x++) xs.push(x);
  const pts = xs.map(x => [x, Math.round((m * x + b + (Math.random() - 0.5) * 6) * 10) / 10]);
  const k = rnd(12, 18), y = m * k + b;
  return {
    stem: `The scatterplot shows the relationship between x and y for 10 data points, and the line of best fit is shown. An equation of the line of best fit is y = ${m}x + ${b}. Based on the line of best fit, what is the predicted value of y when x = ${k}?`,
    stimulus: { kind: "scatter", points: pts, line: [m, b], xlabel: "x", ylabel: "y" },
    choices: numChoices(y, `Substitute x = ${k}: y = ${m}(${k}) + ${b} = ${y}.`, [
      [m * k, `${m * k} leaves out the y-intercept, ${b}.`],
      [m + k + b, `This adds ${m} and ${k} instead of multiplying them.`],
      [Math.round((k - b) / m * 10) / 10, `This solves for x as if ${k} were the y-value.`],
    ], v => eq(v, m * k + b)),
    concept: "A line of best fit predicts y by substituting a value of x.",
    misconception: "Leaving out the intercept; substituting into the wrong variable.",
    steps: [`y = ${m}(${k}) + ${b} = ${m * k} + ${b} = ${y}.`],
    strategy: "Predictions come from the line, not from individual data points.",
  };
});

const FIT_CONTEXTS = [
  ["the number of hours a student studied, h", "the student's test score, s", "s", "h", "points", "hour", "studied"],
  ["the outdoor temperature, t, in degrees Fahrenheit", "the number of cold drinks sold at a stand, d", "d", "t", "drinks", "degree", "temperature increases"],
  ["the age of a used car, a, in years", "the car's price, p, in thousands of dollars", "p", "a", "thousand dollars", "year", "older"],
];
reg("fit-interpret", "two", ["medium"], () => {
  const c = pick(FIT_CONTEXTS), neg = c[2] === "p";
  const m = neg ? -(rnd(8, 25) / 10) : rnd(15, 60) / 10, b = neg ? rnd(22, 40) : rnd(20, 70);
  const ms = Math.abs(m).toFixed(1);
  return {
    stem: `A scatterplot relates ${c[0]}, and ${c[1]}. The line of best fit has equation ${c[2]} = ${m < 0 ? MINUS : ""}${ms}${c[3]} + ${b}. What is the best interpretation of ${ms} in this context?`,
    choices: [
      { t: `For each additional ${c[5]}, the predicted value of ${c[2]} ${neg ? "decreases" : "increases"} by ${ms} ${c[4]}.`, ok: true, why: `${ms} is the slope of the line of best fit: the predicted change in ${c[2]} per 1-unit increase in ${c[3]}.` },
      { t: `The predicted value of ${c[2]} when ${c[3]} = 0 is ${ms} ${c[4]}.`, ok: false, why: `The value when ${c[3]} = 0 is the y-intercept, ${b}.` },
      { t: `For each additional ${c[5]}, the actual value of ${c[2]} for every data point ${neg ? "decreases" : "increases"} by exactly ${ms} ${c[4]}.`, ok: false, why: "A line of best fit describes a trend and gives predictions; it does not say that every data point changes by exactly that amount." },
      { t: `For each additional ${c[4].replace(/s$/, "")} of ${c[2]}, ${c[3]} ${neg ? "decreases" : "increases"} by ${ms}.`, ok: false, why: "This reverses the roles of the variables; the slope gives the change in the output per unit of the input." },
    ],
    concept: "The slope of a line of best fit is the predicted change in y for each 1-unit increase in x.",
    misconception: "Treating a trend as an exact rule for every data point; reversing the variables.",
    steps: [`In ${c[2]} = m${c[3]} + b, m = ${m < 0 ? MINUS : ""}${ms} is the slope.`, `Slope = predicted change in ${c[2]} per 1 ${c[5]} change in ${c[3]}.`],
    strategy: "Look for the words \"predicted\" or \"estimated\": a model gives predictions, not guarantees.",
  };
});

reg("residual", "two", ["hard"], () => {
  const m = pick([2, 3, 4]), b = rnd(5, 20), xs = [1, 2, 3, 4, 5, 6, 7, 8];
  const pts = xs.map(x => [x, m * x + b + nz(-5, 5)]);
  const [px, py] = pick(pts), pred = m * px + b, res = py - pred;
  if (res === 0) return null;
  return {
    stem: `The scatterplot shows 8 data points and the line of best fit y = ${m}x + ${b}. One of the data points is (${px}, ${py}). What is the residual for this data point? (Residual = actual value − predicted value)`,
    stimulus: { kind: "scatter", points: pts, line: [m, b], xlabel: "x", ylabel: "y", highlight: [px, py] },
    choices: numChoices(res, `Predicted: ${m}(${px}) + ${b} = ${pred}. Residual: ${py} ${MINUS} ${pred} = ${N(res)}.`, [
      [-res, "This subtracts in the wrong order: predicted minus actual."],
      [pred, `${pred} is the predicted value, not the residual.`],
      [py - m * px, `This forgets the intercept when computing the predicted value.`],
    ], v => eq(v, py - (m * px + b))),
    concept: "A residual is the actual value minus the value predicted by the model.",
    misconception: "Reversing the subtraction; confusing the prediction with the residual.",
    steps: [`Predicted y at x = ${px}: ${pred}.`, `Residual = ${py} ${MINUS} ${pred} = ${N(res)}. ${res > 0 ? "The point lies above the line." : "The point lies below the line."}`],
    strategy: "Positive residual: the point is above the line. Negative: below.",
    time: 100,
  };
});

reg("prob-simple", "prob", ["easy"], () => {
  const r = rnd(2, 12), g = rnd(2, 12), y = rnd(2, 12), n = r + g + y;
  return {
    stem: `A bag contains ${r} red, ${g} green, and ${y} yellow marbles. One marble is chosen at random. What is the probability that the marble is green?`,
    choices: fracChoices([g, n], `Favorable outcomes ÷ total outcomes = ${g}/${n}${gcd(g, n) > 1 ? " = " + fr(g, n) : ""}.`, [
      [[g, r + y], `This divides by the non-green marbles only; probability uses the total, ${n}.`],
      [[r + y, n], `${fr(r + y, n)} is the probability that the marble is not green.`],
      [[1, 3], "There are three colors, but they are not equally likely, so 1/3 is not the probability."],
      [[r, n], `${fr(r, n)} is the probability that the marble is red.`],
      [[y, n], `${fr(y, n)} is the probability that the marble is yellow.`],
    ].filter(([v]) => !eq(v[0] / v[1], g / n)).filter((x, i, arr) => arr.findIndex(z => eq(z[0][0] / z[0][1], x[0][0] / x[0][1])) === i).slice(0, 3), v => eq(v, g / n)),
    concept: "Probability = favorable outcomes ÷ total outcomes.",
    misconception: "Using the wrong total; assuming categories are equally likely.",
    steps: [`Total marbles: ${r} + ${g} + ${y} = ${n}.`, `P(green) = ${g}/${n}${gcd(g, n) > 1 ? " = " + fr(g, n) : ""}.`],
    strategy: "Always find the total first.",
  };
});

reg("prob-conditional", "prob", ["medium", "hard"], d => {
  const rowsN = ["Juniors", "Seniors"], colsN = ["Robotics club", "Debate club", "No club"];
  const T = [[rnd(8, 30), rnd(8, 30), rnd(20, 60)], [rnd(8, 30), rnd(8, 30), rnd(20, 60)]];
  const rowT = T.map(r => r.reduce((a, b) => a + b, 0)), colT = [0, 1, 2].map(j => T[0][j] + T[1][j]), G = rowT[0] + rowT[1];
  const i = rnd(0, 1), j = rnd(0, 1);
  const given = d === "medium" ? "row" : "col";
  const cell = T[i][j];
  const right = given === "row" ? [cell, rowT[i]] : [cell, colT[j]];
  const wrongs = given === "row"
    ? [[[cell, colT[j]], `This divides by everyone in the ${colsN[j].toLowerCase()} (${colT[j]}); the condition is that the student is a ${rowsN[i].toLowerCase().slice(0, -1)}.`],
       [[cell, G], `This divides by all ${G} students, which gives the probability of being both a ${rowsN[i].toLowerCase().slice(0, -1)} and in the club.`],
       [[rowT[i], G], `This is the probability that a randomly chosen student is a ${rowsN[i].toLowerCase().slice(0, -1)}.`]]
    : [[[cell, rowT[i]], `This divides by all ${rowsN[i].toLowerCase()} (${rowT[i]}); the condition is that the student is in the ${colsN[j].toLowerCase()}.`],
       [[cell, G], `This divides by all ${G} students instead of only those in the ${colsN[j].toLowerCase()}.`],
       [[colT[j] - cell, colT[j]], `This is the probability that a student in the ${colsN[j].toLowerCase()} is ${i === 0 ? "a senior" : "a junior"}.`],
       [[colT[j], G], `This is the probability that a randomly chosen student is in the ${colsN[j].toLowerCase()}.`]];
  const q = given === "row"
    ? `A ${rowsN[i].toLowerCase().slice(0, -1)} is selected at random. What is the probability that this student is in the ${colsN[j].toLowerCase()}?`
    : `A student in the ${colsN[j].toLowerCase()} is selected at random. What is the probability that this student is a ${rowsN[i].toLowerCase().slice(0, -1)}?`;
  return {
    stem: `The table summarizes club membership for the juniors and seniors at a school. Each student is in at most one of these clubs. ${q}`,
    stimulus: { kind: "table", head: ["", ...colsN, "Total"], rows: [...T.map((r, k) => [rowsN[k], ...r.map(String), String(rowT[k])]), ["Total", ...colT.map(String), String(G)]] },
    choices: fracChoices(right, `Restrict to the ${given === "row" ? rowsN[i].toLowerCase() : colsN[j].toLowerCase() + " members"} (${right[1]} students); ${cell} of them ${given === "row" ? "are in the " + colsN[j].toLowerCase() : "are " + rowsN[i].toLowerCase()}. Probability = ${cell}/${right[1]}.`,
      wrongs.filter(([v]) => !eq(v[0] / v[1], right[0] / right[1])).filter((x, i, arr) => arr.findIndex(z => eq(z[0][0] / z[0][1], x[0][0] / x[0][1])) === i).slice(0, 3), v => eq(v, right[0] / right[1])),
    concept: "Conditional probability: restrict to the group named in the condition, then find the fraction.",
    misconception: "Dividing by the grand total or by the wrong group's total.",
    steps: [`The condition ("${given === "row" ? "a " + rowsN[i].toLowerCase().slice(0, -1) : "in the " + colsN[j].toLowerCase()}") limits us to ${right[1]} students.`, `Of these, ${cell} meet the other requirement.`, `P = ${cell}/${right[1]}${gcd(cell, right[1]) > 1 ? " = " + fr(cell, right[1]) : ""}.`],
    strategy: "The group after \"given\" or \"is selected from\" is your denominator.",
  };
});

reg("sample-estimate", "infer-stat", ["easy", "medium"], d => {
  const n = pick([50, 80, 100, 120, 150, 200]), Ntot = n * pick([20, 25, 40, 50, 60]), k = rnd(Math.round(n * 0.15), Math.round(n * 0.6));
  const est = Ntot * k / n;
  return {
    stem: `A town has ${Ntot.toLocaleString("en-US")} households. A researcher surveyed a random sample of ${n} households and found that ${k} of them own a dog. Based on the survey, which is the best estimate of the number of households in the town that own a dog?`,
    choices: numChoices(est, `${k} of ${n} is ${(k / n * 100).toFixed(1)}% of the sample. Applying that rate to ${Ntot.toLocaleString("en-US")} households gives ${est.toLocaleString("en-US")}.`, [
      [k, `${k} is the count in the sample, not in the whole town.`],
      [Ntot - est, `${(Ntot - est).toLocaleString("en-US")} is the estimate of households without a dog.`],
      [Math.round(Ntot * n / k), "This inverts the sample proportion."],
    ], v => eq(v / Ntot, k / n), v => v.toLocaleString("en-US")),
    concept: "A random sample's proportion estimates the population proportion.",
    misconception: "Reporting the sample count; inverting the proportion.",
    steps: [`Sample proportion: ${k}/${n}.`, `Estimate: ${k}/${n} × ${Ntot.toLocaleString("en-US")} = ${est.toLocaleString("en-US")}.`],
    strategy: "Ask: does this estimate make sense compared with the total?",
  };
});

reg("margin", "infer-stat", ["medium", "hard"], d => {
  const pops = [["registered voters in a certain city", "support a proposed park"], ["students at a large university", "use the campus library at least once a week"], ["adults in a certain county", "commute by public transit"]];
  const [pop, act] = pick(pops), p = rnd(30, 70), moe = pick([2, 3, 4, 5]);
  if (d === "medium") return {
    stem: `A survey of a random sample of ${pop} found that ${p}% ${act}. The margin of error for the estimate is ${moe} percentage points. Which conclusion is most appropriate?`,
    choices: [
      { t: `It is plausible that between ${p - moe}% and ${p + moe}% of all ${pop} ${act}.`, ok: true, why: `The estimate plus or minus the margin of error gives a range of plausible values for the population: ${p} ± ${moe}.` },
      { t: `Exactly ${p}% of all ${pop} ${act}.`, ok: false, why: "A sample estimate is not exact; that is why there is a margin of error." },
      { t: `Between ${p - moe}% and ${p + moe}% of the people in the sample ${act}.`, ok: false, why: `The sample percentage is known exactly: ${p}%. The interval describes the population.` },
      { t: `It is plausible that between ${p}% and ${p + moe}% of all ${pop} ${act}.`, ok: false, why: "The margin of error applies in both directions, not only above the estimate." },
    ],
    concept: "A margin of error gives a range of plausible values for a population parameter.",
    misconception: "Treating the estimate as exact; applying the interval to the sample.",
    steps: [`Plausible range: ${p}% ${MINUS} ${moe}% to ${p}% + ${moe}%, which is ${p - moe}% to ${p + moe}%.`, "The range describes the whole population, not the sample."],
    strategy: "Margin of error = estimate ± a range, and the range is about the population.",
  };
  return {
    stem: `Two independent surveys estimated the percentage of ${pop} who ${act}. Survey 1 used a random sample of 400 people; survey 2 used a random sample of 1,600 people from the same population. Both surveys used the same method. Which statement is most likely true?`,
    choices: [
      { t: "Survey 2's estimate has a smaller margin of error than survey 1's.", ok: true, why: "With the same method, a larger random sample produces less sampling variability, so a smaller margin of error." },
      { t: "Survey 2's estimate has a larger margin of error than survey 1's.", ok: false, why: "More data reduces sampling variability; it does not increase it." },
      { t: "Both estimates have the same margin of error, because they describe the same population.", ok: false, why: "Margin of error depends on the sample size, not only on the population." },
      { t: "Survey 2's estimate must be exactly equal to the true population percentage.", ok: false, why: "No sample, however large, guarantees an exact estimate." },
    ],
    concept: "Larger random samples give smaller margins of error.",
    misconception: "Believing sample size has no effect on precision, or that a large sample is exact.",
    steps: ["Margin of error shrinks as sample size grows (all else equal).", "Survey 2's sample is four times larger, so its margin of error is smaller (about half as large)."],
    strategy: "Bigger random sample → more precise estimate → smaller margin of error.",
  };
});

reg("study-design", "claims", ["medium", "hard"], d => {
  // medium: both or neither design feature; hard: exactly one of them (the subtler cases)
  const combos = d === "hard" ? [[false, true], [true, false]] : [[true, true], [false, false]];
  const [sampled, assigned] = pick(combos);
  const sampleTxt = sampled ? "selected 300 adults at random from a large city" : "recruited 300 adult volunteers in a large city through an online advertisement";
  const designTxt = assigned ? "randomly assigned half of them to take a daily vitamin D supplement and half to take a placebo" : "asked each one whether they already took a daily vitamin D supplement";
  const S = [
    [true, true, "Taking a daily vitamin D supplement causes fewer colds among adults in the city."],
    [false, true, "Taking a daily vitamin D supplement causes fewer colds among people like those in the study, but the result may not apply to all adults in the city."],
    [true, false, "Adults in the city who take a daily vitamin D supplement tend to have fewer colds, but the study does not show that the supplement causes this."],
    [false, false, "Among the people in the study, those who took a daily vitamin D supplement tended to have fewer colds, but no cause-and-effect conclusion is possible."],
  ];
  const why = (s, a) => {
    if (s === sampled && a === assigned) return `The study ${sampled ? "used" : "did not use"} random sampling and ${assigned ? "used" : "did not use"} random assignment, and this conclusion claims exactly what those features allow.`;
    const parts = [];
    if (a && !assigned) parts.push("it claims cause and effect, but the participants chose their own treatment (no random assignment)");
    if (!a && assigned) parts.push("it is too cautious about cause: random assignment does support a causal conclusion");
    if (s && !sampled) parts.push("it extends the result to all adults in the city, but volunteers are not a random sample");
    if (!s && sampled) parts.push("it limits the result to the participants, but random sampling allows generalizing to the city");
    return "Not supported: " + parts.join("; ") + ".";
  };
  return {
    stem: `A researcher ${sampleTxt} and ${designTxt}. After six months, the group taking the supplement had reported significantly fewer colds. Which conclusion is best supported by the study's design?`,
    choices: S.map(([s, a, t]) => ({ t, ok: s === sampled && a === assigned, why: why(s, a) })),
    concept: "Random assignment supports cause and effect; random sampling supports generalizing to the population.",
    misconception: "Drawing causal conclusions without random assignment; generalizing from volunteers.",
    steps: [`Random sampling? ${sampled ? "Yes" : "No"}: ${sampled ? "results can extend to the city's adults" : "results apply only to people like the participants"}.`, `Random assignment? ${assigned ? "Yes" : "No"}: ${assigned ? "a causal conclusion is supported" : "only an association can be concluded"}.`],
    strategy: "Ask two separate questions: how were people chosen (sampling)? How were treatments given (assignment)?",
    time: 100,
  };
});

// ======================= GEOMETRY AND TRIGONOMETRY =======================

reg("volume-prism", "area", ["easy"], () => {
  const l = rnd(2, 12), w = rnd(2, 10), h = rnd(2, 9);
  if (l === w || w === h) return null;
  return {
    stem: `A rectangular box has a length of ${l} inches, a width of ${w} inches, and a height of ${h} inches. What is the volume, in cubic inches, of the box?`,
    choices: numChoices(l * w * h, `Volume = length × width × height = ${l} × ${w} × ${h} = ${l * w * h}.`, [
      [2 * (l * w + l * h + w * h), `${2 * (l * w + l * h + w * h)} is the surface area, measured in square inches.`],
      [l * w, `${l * w} is the area of the base only.`],
      [l + w + h, "Volume multiplies the dimensions; it does not add them."],
    ], v => eq(v / (l * w), h)),
    concept: "The volume of a rectangular prism is length × width × height.",
    misconception: "Confusing volume with surface area or base area.",
    steps: [`${l} × ${w} = ${l * w}.`, `${l * w} × ${h} = ${l * w * h} cubic inches.`],
    strategy: "Volume is in cubic units: three lengths multiplied together.",
  };
});

reg("volume-cylinder", "area", ["medium"], () => {
  const r = rnd(2, 9), h = rnd(3, 15), d = 2 * r;
  const V = r * r * h;
  return {
    stem: `A cylinder has a diameter of ${d} centimeters and a height of ${h} centimeters. What is the volume, in cubic centimeters, of the cylinder?`,
    choices: numChoices(V, `The radius is half the diameter, ${r}. V = πr²h = π(${r})²(${h}) = ${V}π.`, [
      [d * d * h, `This uses the diameter, ${d}, as the radius.`],
      [2 * r * h, `${2 * r * h}π is the lateral surface area (2πrh), not the volume.`],
      [Math.round(V / 3) === V / 3 ? V / 3 : r * h * 2 + 1, Math.round(V / 3) === V / 3 ? "This uses the formula for a cone, (1/3)πr²h." : "This leaves out squaring the radius."],
    ], v => eq(v * Math.PI, Math.PI * r * r * h), v => v + "π"),
    concept: "Cylinder volume: V = πr²h, where r is the radius.",
    misconception: "Using the diameter as the radius; using a surface area formula.",
    steps: [`r = ${d} ÷ 2 = ${r}.`, `V = π × ${r * r} × ${h} = ${V}π.`],
    strategy: "Underline whether you are given the radius or the diameter. The SAT reference sheet lists V = πr²h.",
  };
});

reg("scale-factor", "area", ["hard"], () => {
  const a = rnd(2, 5); let b; do { b = rnd(2, 7); } while (b === a || gcd(a, b) !== 1);
  return {
    stem: `Two cubes have edge lengths in the ratio ${a} to ${b}. What is the ratio of the volume of the smaller cube to the volume of the larger cube?`.replace("smaller", a < b ? "smaller" : "larger").replace("the larger cube?", a < b ? "the larger cube?" : "the smaller cube?"),
    choices: [[[a ** 3, b ** 3], `Volume scales with the cube of the length ratio: ${a}³ : ${b}³ = ${a ** 3} : ${b ** 3}.`],
              [[a * a, b * b], `${a * a} : ${b * b} is the ratio of the surface areas (lengths squared), not the volumes.`],
              [[a, b], "Volume does not scale by the same ratio as length."],
              [[3 * a, 3 * b], `${3 * a} : ${3 * b} is the same ratio as ${a} : ${b}; multiplying by 3 is not cubing.`]]
      .map(([[p, q], why]) => ({ t: `${p} to ${q}`, ok: eq(p / q, (a / b) ** 3), why })),
    concept: "If lengths scale by k, areas scale by k² and volumes by k³.",
    misconception: "Scaling volume by k or k² instead of k³.",
    steps: [`Length ratio: ${a} : ${b}.`, `Volume ratio: ${a}³ : ${b}³ = ${a ** 3} : ${b ** 3}.`],
    strategy: "Length → k, area → k², volume → k³.",
    time: 90,
  };
});

reg("triangle-angles", "lat", ["easy"], () => {
  const a = rnd(25, 80), b = rnd(25, 80), c = 180 - a - b;
  if (c < 15 || a === b || c === a || c === b) return null;
  return {
    stem: `In triangle ABC, the measure of angle A is ${a}° and the measure of angle B is ${b}°. What is the measure, in degrees, of angle C?`,
    choices: numChoices(c, `The angles of a triangle sum to 180°: 180 ${MINUS} ${a} ${MINUS} ${b} = ${c}.`, [
      [a + b, `${a + b}° is the sum of angles A and B; that is the exterior angle at C, not angle C.`],
      [360 - a - b, "This uses 360°, the angle sum of a quadrilateral."],
      [90 - (a > b ? b : a) > 0 && 90 - (a > b ? b : a) !== c ? 90 - (a > b ? b : a) : c + 10, "This assumes the triangle has a right angle, which the problem does not say."],
    ], v => eq(v + a + b, 180)),
    concept: "The interior angles of a triangle sum to 180°.",
    misconception: "Using 360°; giving the exterior angle.",
    steps: [`${a} + ${b} = ${a + b}.`, `180 ${MINUS} ${a + b} = ${c}.`],
    strategy: "Triangle: 180°. Quadrilateral: 360°. Straight line: 180°.",
  };
});

reg("parallel-lines", "lat", ["medium"], () => {
  const equalPair = Math.random() < 0.5;
  let a, b, p, q, x;
  for (let t = 0; t < 60; t++) {
    a = rnd(2, 6); b = rnd(2, 8); x = rnd(10, 30); p = rnd(-20, 30);
    if (equalPair) { if (a === b) continue; q = a * x + p - b * x; }
    else q = 180 - a * x - p - b * x;
    const ang1 = a * x + p, ang2 = b * x + q;
    if (ang1 > 10 && ang1 < 170 && ang2 > 10 && ang2 < 170 && (equalPair ? true : ang1 !== 90)) break; else x = null;
  }
  if (x === null) return null;
  const rel = equalPair ? "alternate interior angles" : "same-side interior angles";
  const sol = v => (equalPair ? eq(a * v + p, b * v + q) : eq(a * v + p + b * v + q, 180));
  const wrongX = equalPair ? (180 - p - q) / (a + b) : (q - p) / (a - b || 1);
  const show = v => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  return {
    stem: `Lines j and k are parallel and are cut by a transversal. Two of the angles formed are ${rel}, with measures (${lin(a, p)})° and (${lin(b, q)})°. What is the value of x?`,
    choices: numChoices(x, equalPair ? `Alternate interior angles are congruent: ${lin(a, p)} = ${lin(b, q)}, so x = ${x}.` : `Same-side interior angles are supplementary: (${lin(a, p)}) + (${lin(b, q)}) = 180, so x = ${x}.`, [
      [wrongX, equalPair ? "This treats the angles as supplementary; alternate interior angles are equal." : "This sets the angles equal; same-side interior angles add to 180°."],
      [a * x + p, `${a * x + p} is the measure of the first angle, not x.`],
      [equalPair ? 180 - (a * x + p) : b * x + q, equalPair ? "This is the supplement of the angle, not x." : `${b * x + q} is the measure of the second angle, not x.`],
    ], sol, show),
    concept: "Parallel lines: alternate interior angles are congruent; same-side interior angles are supplementary.",
    misconception: "Mixing up which angle pairs are equal and which are supplementary.",
    steps: [equalPair ? `${lin(a, p)} = ${lin(b, q)}` : `${lin(a, p)} + ${lin(b, q)} = 180`, equalPair ? `${a - b}x = ${q - p}, so x = ${x}.` : `${a + b}x + ${p + q} = 180, so x = ${x}.`],
    strategy: "\"Z\" shape: equal angles. \"C\" (or \"U\") shape: angles add to 180°.",
  };
});

reg("similar", "lat", ["medium", "hard"], d => {
  const k = d === "medium" ? rnd(2, 4) : pick([1.5, 2.5, 3.5]);
  const AB = rnd(3, 10) * 2, BC = rnd(3, 10) * 2, DE = AB * k, EF = BC * k;
  if (AB === BC) return null;
  const show = v => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  return {
    stem: `Triangle ABC is similar to triangle DEF, where A corresponds to D, B corresponds to E, and C corresponds to F. If AB = ${AB}, BC = ${BC}, and DE = ${show(DE)}, what is the length of EF?`,
    choices: numChoices(EF, `Scale factor: DE/AB = ${show(DE)}/${AB} = ${k}. EF = ${k} × BC = ${show(EF)}.`, [
      [BC + (DE - AB), `This adds the difference ${show(DE - AB)} instead of multiplying by the scale factor; similar triangles are related by multiplication.`],
      [BC / k, "This applies the scale factor in the wrong direction (dividing instead of multiplying)."],
      [AB * BC / DE * k * k === EF ? EF + 2 : DE * BC / (AB * k), "This sets up the proportion with sides that do not correspond."],
    ], v => eq(v / BC, DE / AB), show),
    concept: "Corresponding sides of similar triangles are proportional.",
    misconception: "Adding a constant difference instead of using a ratio; inverting the scale factor.",
    steps: [`Scale factor from ABC to DEF: ${show(DE)} ÷ ${AB} = ${k}.`, `EF corresponds to BC: EF = ${BC} × ${k} = ${show(EF)}.`],
    strategy: "Match corresponding vertices by the order of the letters in the similarity statement.",
  };
});

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
reg("pythag", "right", ["easy", "medium"], d => {
  const [a, b, c] = pick(TRIPLES), k = d === "easy" ? 1 : rnd(2, 4);
  const A = a * k, B = b * k, C = c * k;
  const findHyp = d === "easy" || Math.random() < 0.5;
  if (findHyp) return {
    stem: `A right triangle has legs of length ${A} and ${B}. What is the length of the hypotenuse?`,
    choices: numChoices(C, `c² = ${A}² + ${B}² = ${A * A} + ${B * B} = ${C * C}, so c = ${C}.`, [
      [A + B, "The hypotenuse is not the sum of the legs; that would violate the triangle inequality."],
      [A * A + B * B, `${A * A + B * B} is c²; take the square root.`],
      [Math.round(Math.sqrt(Math.abs(B * B - A * A)) * 100) / 100 === Math.round(Math.sqrt(Math.abs(B * B - A * A))) ? Math.round(Math.sqrt(Math.abs(B * B - A * A))) : C + k, "This subtracts the squares; for the hypotenuse, add them."],
    ], v => eq(v * v, A * A + B * B)),
    concept: "Pythagorean theorem: a² + b² = c², where c is the hypotenuse.",
    misconception: "Forgetting the square root; adding the legs directly.",
    steps: [`${A}² + ${B}² = ${A * A + B * B}.`, `√${A * A + B * B} = ${C}.`],
    strategy: "Memorize common triples: 3-4-5, 5-12-13, 8-15-17, 7-24-25, and their multiples.",
  };
  return {
    stem: `A right triangle has a hypotenuse of length ${C} and one leg of length ${A}. What is the length of the other leg?`,
    choices: numChoices(B, `b² = ${C}² ${MINUS} ${A}² = ${C * C} ${MINUS} ${A * A} = ${B * B}, so b = ${B}.`, [
      [C - A, "Lengths do not subtract directly; subtract the squares, then take the square root."],
      [Math.round(Math.sqrt(C * C + A * A) * 100) / 100, "This adds the squares; when finding a leg, subtract the leg's square from the hypotenuse's."],
      [B * B, `${B * B} is b²; take the square root.`],
    ], v => eq(v * v + A * A, C * C), v => (Number.isInteger(v) ? String(v) : v.toFixed(2))),
    concept: "To find a leg: b² = c² − a².",
    misconception: "Adding squares when one side is the hypotenuse.",
    steps: [`${C}² ${MINUS} ${A}² = ${B * B}.`, `√${B * B} = ${B}.`],
    strategy: "Identify the hypotenuse first: it is opposite the right angle and is always the longest side.",
  };
});

reg("trig-ratio", "right", ["medium"], () => {
  const [a, b, c] = pick(TRIPLES), k = rnd(1, 3), opp = a * k, adj = b * k, hyp = c * k;
  const fn = pick(["sin", "cos", "tan"]);
  const val = { sin: [opp, hyp], cos: [adj, hyp], tan: [opp, adj] }[fn];
  const names = { sin: "opposite/hypotenuse", cos: "adjacent/hypotenuse", tan: "opposite/adjacent" };
  const others = { sin: [[[adj, hyp], "cos A"], [[opp, adj], "tan A"], [[hyp, opp], "the reciprocal of sin A"]],
                   cos: [[[opp, hyp], "sin A"], [[opp, adj], "tan A"], [[hyp, adj], "the reciprocal of cos A"]],
                   tan: [[[adj, opp], "the reciprocal of tan A"], [[opp, hyp], "sin A"], [[adj, hyp], "cos A"]] }[fn];
  return {
    stem: `In right triangle ABC, angle C is the right angle. The length of side BC is ${opp}, the length of side AC is ${adj}, and the length of side AB is ${hyp}. What is the value of ${fn} A?`,
    choices: fracChoices(val, `${fn} A = ${names[fn]} = ${val[0]}/${val[1]}${gcd(...val) > 1 ? " = " + fr(...val) : ""}.`, others.map(([v, nm]) => [v, `${fr(...v)} is ${nm}.`]), v => eq(v, val[0] / val[1])),
    concept: "SOH-CAH-TOA: sine = opposite/hypotenuse, cosine = adjacent/hypotenuse, tangent = opposite/adjacent.",
    misconception: "Mixing up opposite and adjacent sides; using a reciprocal.",
    steps: [`Relative to angle A: opposite side BC = ${opp}, adjacent side AC = ${adj}, hypotenuse AB = ${hyp}.`, `${fn} A = ${names[fn]} = ${fr(...val)}.`],
    strategy: "Label the sides from the angle you are working with before writing any ratio.",
  };
});

reg("cofunction", "right", ["hard"], () => {
  const [a, b, c] = pick(TRIPLES);
  const v = [a, c];
  return {
    stem: `In right triangle ABC, angle C is the right angle and sin A = ${a}/${c}. What is the value of cos B?`,
    choices: fracChoices(v, `Angles A and B are complementary, and the side opposite A is the side adjacent to B. So cos B = sin A = ${a}/${c}.`, [
      [[b, c], `${b}/${c} is cos A (and sin B), not cos B.`],
      [[c, a], `${c}/${a} is the reciprocal of sin A.`],
      [[a, b], `${a}/${b} is tan A.`],
    ], x => eq(x, a / c)),
    concept: "For complementary angles, sin A = cos(90° − A). In a right triangle, the two acute angles are complementary.",
    misconception: "Computing cos A instead of cos B; using a reciprocal.",
    steps: [`A + B = 90°.`, `sin A = cos(90° ${MINUS} A) = cos B.`, `cos B = ${a}/${c}.`],
    strategy: "Sketch the triangle: the side opposite A is the side adjacent to B.",
    time: 90,
  };
});

reg("circle-basic", "circle", ["easy"], () => {
  const r = rnd(2, 12), C = 2 * r;
  return {
    stem: `The circumference of a circle is ${C}π centimeters. What is the area, in square centimeters, of the circle?`,
    choices: numChoices(r * r, `C = 2πr, so r = ${C}π ÷ 2π = ${r}. Area = πr² = ${r * r}π.`, [
      [C * C, `This uses ${C} as the radius; ${C} is the diameter.`],
      [C, `${C}π is the circumference, not the area.`],
      [2 * r * r, "This doubles πr²; the area formula has no factor of 2."],
    ], v => eq(v, r * r), v => v + "π"),
    concept: "Circumference 2πr and area πr² are both determined by the radius.",
    misconception: "Using the diameter as the radius.",
    steps: [`2πr = ${C}π, so r = ${r}.`, `A = π(${r})² = ${r * r}π.`],
    strategy: "Always find the radius first.",
  };
});

reg("arc-sector", "circle", ["medium"], () => {
  const r = pick([3, 4, 6, 8, 9, 10, 12, 15, 18]), ang = pick([30, 40, 45, 60, 72, 90, 120, 135, 150]);
  const arcK = 2 * r * ang / 360, secK = r * r * ang / 360;
  if (!Number.isInteger(arcK * 2) || !Number.isInteger(secK * 2)) return null;
  const askArc = Math.random() < 0.5;
  const show = v => (Number.isInteger(v) ? v : v.toFixed(1)) + "π";
  const right = askArc ? arcK : secK;
  return {
    stem: `A circle has a radius of ${r} units. A central angle of ${ang}° intercepts an arc of the circle. What is the ${askArc ? "length of the arc" : "area of the sector formed by the central angle"}?`,
    choices: numChoices(right, `The angle is ${ang}/360 = ${fr(ang, 360)} of the full circle. ${askArc ? `Arc length = ${fr(ang, 360)} × 2π(${r}) = ${show(arcK)}.` : `Sector area = ${fr(ang, 360)} × π(${r})² = ${show(secK)}.`}`, [
      [askArc ? secK : arcK, askArc ? "This is the sector area; arc length uses circumference (2πr), not area (πr²)." : "This is the arc length; sector area uses πr², not 2πr."],
      [askArc ? 2 * r : r * r, `This is the ${askArc ? "full circumference" : "full area"}, not the fraction cut off by a ${ang}° angle.`],
      [askArc ? r * ang / 360 : 2 * r * r * ang / 360, askArc ? "This leaves out the factor of 2 in the circumference." : "This doubles the sector area."],
    ].filter(([v]) => !eq(v, right)), v => eq(v, right), show),
    concept: "An arc or sector is the fraction (angle/360°) of the full circumference or area.",
    misconception: "Mixing up arc length and sector area.",
    steps: [`Fraction of circle: ${ang}/360 = ${fr(ang, 360)}.`, askArc ? `Circumference: 2π(${r}) = ${2 * r}π. Arc: ${fr(ang, 360)} × ${2 * r}π = ${show(arcK)}.` : `Area: π(${r})² = ${r * r}π. Sector: ${fr(ang, 360)} × ${r * r}π = ${show(secK)}.`],
    strategy: "Arc length is part of a perimeter (length); sector area is part of an area.",
  };
});

reg("circle-eq", "circle", ["hard"], () => {
  const h = nz(-7, 7), k = nz(-7, 7), r = rnd(2, 8);
  if (Math.abs(h) === Math.abs(k)) return null;
  const D = -2 * h, E = -2 * k, F = h * h + k * k - r * r;
  const term = (c, v) => (c < 0 ? ` ${MINUS} ${-c === 1 ? "" : -c}${v}` : ` + ${c === 1 ? "" : c}${v}`);
  const eqn = `x² + y²${term(D, "x")}${term(E, "y")}${F < 0 ? ` ${MINUS} ${-F}` : F > 0 ? ` + ${F}` : ""} = 0`;
  const P = (x, y) => `(${N(x)}, ${N(y)})`;
  const opts = [[h, k, r, `Completing the square gives (x ${h < 0 ? "+" : MINUS} ${Math.abs(h)})² + (y ${k < 0 ? "+" : MINUS} ${Math.abs(k)})² = ${r * r}, so the center is ${P(h, k)} and the radius is √${r * r} = ${r}.`],
                [-h, -k, r, "The signs of the center are reversed: (x − h)² has center coordinate +h."],
                [h, k, r * r, `${r * r} is r², not r.`],
                [-h, -k, r * r, "Both the center's signs and the radius are wrong."]];
  return {
    stem: `${eqn}\n\nThe graph of the given equation in the xy-plane is a circle. What are the center and the radius of the circle?`,
    choices: opts.map(([x, y, rr, why]) => ({ t: `Center ${P(x, y)}, radius ${rr}`, ok: x === -D / 2 && y === -E / 2 && eq(rr * rr, (D / 2) ** 2 + (E / 2) ** 2 - F), why })),
    concept: "Complete the square to rewrite a circle's equation as (x − h)² + (y − k)² = r².",
    misconception: "Reversing the center's signs; reporting r² as the radius.",
    steps: [`Group: (x²${term(D, "x")}) + (y²${term(E, "y")}) = ${N(-F)}.`, `Complete the squares: add ${h * h} and ${k * k} to both sides.`, `(x ${h < 0 ? "+" : MINUS} ${Math.abs(h)})² + (y ${k < 0 ? "+" : MINUS} ${Math.abs(k)})² = ${r * r}.`, `Center ${P(h, k)}, radius ${r}.`],
    strategy: "Shortcut: the center is (−D/2, −E/2) for x² + y² + Dx + Ey + F = 0.",
    time: 120,
  };
});
