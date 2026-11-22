/**
 * Draws .docs/diagrams/epics-stories-dependencies.svg — every epic and story in
 * .docs/planning-artifacts/epics.md, laid out as a dependency graph.
 *
 *   node .docs/diagrams/epics-stories-dependencies.gen.mjs \
 *        .docs/diagrams/epics-stories-dependencies.svg
 *
 * The graph data below (NODES, EDGES) is transcribed from epics.md: the story
 * headings, their **Prerequisites:** lines and their **Requirements:** lines.
 * epics.md governs — when a story, a prerequisite or a tier changes there,
 * change it here and regenerate. Nothing checks that automatically.
 *
 * Layout: one lane per epic, one column per dependency depth (the earliest wave
 * a story can be built in), so every edge points right. Vertical runs use the
 * column gaps and horizontal buses the lane gutters, so no edge is hidden behind
 * a box. The sanity checks at the bottom fail loudly on a backwards edge, an
 * overlapping box or an unrouted rail.
 */
import { writeFileSync } from "node:fs";

/* ------------------------------------------------------------------ data */

const EPICS = [
  { n: 1, tier: 1, color: "#1d4ed8", title: "Capture and keep a task",
    reqs: "FR-1 – FR-5, FR-23", prereq: "no prerequisites", rows: 3 },
  { n: 2, tier: 1, color: "#0e7490", title: "Structure proposed, never imposed",
    reqs: "FR-6 – FR-8, FR-10", prereq: "after Epic 1", rows: 3 },
  { n: 3, tier: 1, color: "#15803d", title: "Views you never built",
    reqs: "FR-12 – FR-14, FR-16", prereq: "after Epic 1", rows: 3 },
  { n: 4, tier: 1, color: "#a16207", title: "Prove the engine",
    reqs: "FR-15, FR-19, FR-20", prereq: "after Epics 2 and 3", rows: 3 },
  { n: 5, tier: 1, color: "#b45309", title: "The grader's clean clone",
    reqs: "NFR-7, NFR-9, SM-2", prereq: "after Epic 4", rows: 1 },
  { n: 6, tier: 2, color: "#6d28d9", title: "Bring your own key",
    reqs: "FR-9, FR-11, FR-17, FR-18", prereq: "after Epic 2", rows: 1 },
  { n: 7, tier: 2, color: "#be185d", title: "Show where the model wins",
    reqs: "FR-21", prereq: "after Epics 4 and 6", rows: 1 },
  { n: 8, tier: 3, color: "#57616f", title: "Refinements that may be cut",
    reqs: "FR-22, FR-16, FR-3", prereq: "after Epics 2 and 3", rows: 2 },
];

// id, epic, column (= earliest build wave), row inside the lane, label lines, requirement tag
const NODES = [
  ["1.1", 1, 0, 1, ["Clean clone runs,", "first-run surface"], "NFR-4 · SM-2"],
  ["1.8", 1, 1, 0, ["Install it, open it", "offline"], "NFR-3"],
  ["1.2", 1, 1, 1, ["Create a Task from", "one sentence"], "FR-1 · NFR-1"],
  ["1.3", 1, 2, 0, ["The due date the", "date word named"], "FR-23"],
  ["1.4", 1, 2, 1, ["Read the list,", "open a Task"], "FR-2"],
  ["1.6", 1, 2, 2, ["Complete and", "un-complete"], "FR-5"],
  ["1.7", 1, 3, 0, ["Delete a Task"], "FR-4"],
  ["1.5", 1, 3, 1, ["Edit any field", "of a Task"], "FR-3"],

  ["2.1", 2, 3, 1, ["Rule Engine proposes", "tags, priority, summary"], "FR-6 · FR-7"],
  ["2.2", 2, 4, 0, ["Capture never waits", "for the proposal"], "FR-8 · SM-4"],
  ["2.3", 2, 4, 1, ["Punch, edit or strike", "one control"], "FR-10"],
  ["2.6", 2, 4, 2, ["Settings tells the", "truth with no key"], "FR-11"],
  ["2.4", 2, 5, 0, ["Undo the punch", "I just made"], "FR-10"],
  ["2.5", 2, 6, 1, ["Punch all and", "Strike all"], "FR-10"],

  ["3.1", 3, 3, 1, ["Today shows the three", "derived lists"], "FR-12 · FR-13"],
  ["3.2", 3, 4, 0, ["A list per Tag, and", "every list in one place"], "FR-14"],
  ["3.4", 3, 4, 1, ["Completed work lands", "in Archive"], "FR-16"],
  ["3.3", 3, 4, 2, ["The legend publishes", "every mark"], "UX-DR13"],

  ["4.1", 4, 4, 1, ["The Fixture is", "committed"], "FR-19"],
  ["4.2", 4, 5, 0, ["One command reports", "engine accuracy"], "FR-20 · SM-1"],
  ["4.3", 4, 5, 2, ["Smart List placement", "is asserted"], "FR-15"],
  ["4.4", 4, 6, 1, ["CI fails below the", "committed floor"], "SM-1 · SM-C2"],

  ["5.1", 5, 6, 0, ["README: fresh clone", "to a running app"], "NFR-7 · SM-2"],
  ["5.2", 5, 7, 0, ["README explains the", "AI decision"], "NFR-9"],
  ["5.3", 5, 8, 0, ["README carries the", "architecture section"], "NFR-9"],
  ["5.4", 5, 9, 0, ["SM-2 verified on a", "clean machine"], "SM-2"],

  ["6.1", 6, 5, 0, ["Save and clear my", "own API Key"], "FR-17"],
  ["6.2", 6, 6, 0, ["Turn on Cloud", "Suggestions"], "FR-18"],
  ["6.3", 6, 7, 0, ["Model Engine proposes,", "the chip says so"], "FR-9"],
  ["6.4", 6, 8, 0, ["Every failure silent,", "Rule Engine serves"], "FR-9 · NFR-2"],
  ["6.5", 6, 9, 0, ["Settings explains a", "persistent failure"], "FR-11"],
  ["6.6", 6, 10, 0, ["Mocked tests cover", "every fallback"], "NFR-8"],

  ["7.1", 7, 8, 0, ["The harness measures", "the Model Engine"], "FR-21"],
  ["7.2", 7, 9, 0, ["The comparison is", "committed"], "SM-3"],
  ["7.3", 7, 10, 0, ["README: measured", "results, screenshot"], "NFR-9"],

  ["8.3", 8, 4, 0, ["Group Tasks under", "a Project"], "FR-3"],
  ["8.1", 8, 5, 0, ["Ask for a fresh", "proposal"], "FR-22"],
  ["8.2", 8, 5, 1, ["Choose how long", "completed Tasks stay"], "FR-16"],
].map(([id, e, c, r, lines, req]) => ({ id, e, c, r, lines, req }));

// every prerequisite edge in epics.md: from -> to  (to cannot start before from)
const EDGES = [
  ["1.1", "1.2"], ["1.1", "1.8"],
  ["1.2", "1.3"], ["1.2", "1.4"], ["1.2", "1.6"],
  ["1.4", "1.5"], ["1.4", "1.7"],

  ["1.2", "2.1"], ["1.3", "2.1"],
  ["2.1", "2.2"], ["2.1", "2.3"], ["2.1", "2.6"],
  ["2.3", "2.4"], ["2.3", "2.5"], ["2.4", "2.5"],

  ["1.4", "3.1"], ["1.6", "3.1"],
  ["3.1", "3.2"], ["3.1", "3.3"], ["3.1", "3.4"], ["1.6", "3.4"],

  ["2.1", "4.1"], ["3.1", "4.1"],
  ["4.1", "4.2"], ["2.1", "4.2"],
  ["4.1", "4.3"], ["3.1", "4.3"],
  ["4.1", "4.4"], ["4.2", "4.4"],

  ["4.2", "5.1"], ["5.1", "5.2"], ["5.2", "5.3"], ["5.1", "5.4"], ["5.3", "5.4"],

  ["2.6", "6.1"], ["6.1", "6.2"], ["6.2", "6.3"], ["6.3", "6.4"],
  ["6.4", "6.5"], ["6.4", "6.6"], ["6.5", "6.6"],

  ["4.1", "7.1"], ["4.2", "7.1"], ["6.3", "7.1"],
  ["4.1", "7.2"], ["7.1", "7.2"],
  ["5.2", "7.3"], ["7.2", "7.3"],

  ["2.1", "8.1"], ["2.3", "8.1"],
  ["3.4", "8.2"], ["2.6", "8.2"],
  ["1.5", "8.3"],
].map(([f, t]) => ({ f, t }));

/* -------------------------------------------------------------- geometry */

const COLS = 11;
const BOX_W = 128, COL_GAP = 32, PITCH_X = BOX_W + COL_GAP;
const BOX_H = 64, ROW_GAP = 20, PITCH_Y = BOX_H + ROW_GAP;
const GUTTER = 34;
const LEFT = 222;                 // x of column 0
const TOP = 196;                  // y of lane 0
const PAD_R = 26;

const colX = (c) => LEFT + c * PITCH_X;
const laneTop = [];
{
  let y = TOP;
  for (const e of EPICS) { laneTop.push(y); y += e.rows * PITCH_Y - ROW_GAP + GUTTER; }
}
const laneH = (i) => EPICS[i].rows * PITCH_Y - ROW_GAP;
const LANES_BOTTOM = laneTop[7] + laneH(7);

const W = colX(COLS - 1) + BOX_W + PAD_R;
const H = LANES_BOTTOM + 150;

const byId = new Map(NODES.map((n) => [n.id, n]));
for (const n of NODES) {
  n.x = colX(n.c);
  n.y = laneTop[n.e - 1] + n.r * PITCH_Y;
  n.cx = n.x + BOX_W / 2;
  n.cy = n.y + BOX_H / 2;
  n.color = EPICS[n.e - 1].color;
}
const occupied = new Set(NODES.map((n) => `${n.e}:${n.c}:${n.r}`));

/* ------------------------------------------------- classify + route edges */

// gutter index g = the band immediately above lane g (0-based lane index)
const gutterBand = (g) => [laneTop[g] - GUTTER, laneTop[g]];
const RAIL_GUTTER_OVERRIDE = { "5.1>5.4": 5, "6.4>6.6": 5 };

for (const ed of EDGES) {
  const a = byId.get(ed.f), b = byId.get(ed.t);
  ed.a = a; ed.b = b;
  ed.sameLane = a.e === b.e;
  ed.dc = b.c - a.c;
  ed.color = a.color;

  const key = `${ed.f}>${ed.t}`;
  if (ed.sameLane && ed.dc === 1) { ed.kind = "curve"; continue; }
  if (ed.sameLane && a.r === b.r) {
    let clear = true;
    for (let c = a.c + 1; c < b.c; c++) if (occupied.has(`${a.e}:${c}:${a.r}`)) clear = false;
    if (clear) { ed.kind = "straight"; continue; }
  }
  if (key in RAIL_GUTTER_OVERRIDE) { ed.kind = "rail"; ed.gutter = RAIL_GUTTER_OVERRIDE[key]; continue; }
  if (ed.dc === 1) { ed.kind = "rail"; ed.gutter = null; continue; }   // one hop: drop in the gap
  ed.kind = "rail"; ed.gutter = b.e - 1;                               // bus in the gutter above the target lane
}

// allocate vertical slots inside column gaps
const gapNeeds = new Map();           // gap index -> list of {ed, which}
const needGap = (gi, ed, which) => {
  if (!gapNeeds.has(gi)) gapNeeds.set(gi, []);
  gapNeeds.get(gi).push({ ed, which });
};
for (const ed of EDGES) {
  if (ed.kind !== "rail") continue;
  if (ed.gutter === null) { needGap(ed.a.c, ed, "single"); }
  else { needGap(ed.a.c, ed, "down"); needGap(ed.b.c - 1, ed, "up"); }
}
for (const [gi, list] of gapNeeds) {
  const span = COL_GAP - 10;
  list.sort((p, q) => (p.ed.a.cy - q.ed.a.cy) || (p.ed.b.cy - q.ed.b.cy));
  list.forEach((p, k) => {
    const x = colX(gi) + BOX_W + 5 + (list.length === 1 ? span / 2 : (k * span) / (list.length - 1));
    if (p.which === "single") p.ed.gapX = x;
    else if (p.which === "down") p.ed.downX = x;
    else p.ed.upX = x;
  });
}

// allocate horizontal bus lines inside epic gutters
const busNeeds = new Map();
for (const ed of EDGES) if (ed.kind === "rail" && ed.gutter !== null) {
  if (!busNeeds.has(ed.gutter)) busNeeds.set(ed.gutter, []);
  busNeeds.get(ed.gutter).push(ed);
}
for (const [g, list] of busNeeds) {
  const [top] = gutterBand(g);
  const span = GUTTER - 14;
  list.sort((p, q) => p.a.cy - q.a.cy);
  list.forEach((ed, k) => {
    ed.busY = top + 7 + (list.length === 1 ? span / 2 : (k * span) / (list.length - 1));
  });
}

// spread arrow tails and heads along the box edges
const outs = new Map(), ins = new Map();
for (const ed of EDGES) {
  if (!outs.has(ed.f)) outs.set(ed.f, []);
  if (!ins.has(ed.t)) ins.set(ed.t, []);
  outs.get(ed.f).push(ed); ins.get(ed.t).push(ed);
}
const anchorY = (cy, i, n, max) => {
  if (n === 1) return cy;
  const step = Math.min(max, (BOX_H - 14) / (n - 1));
  return cy + (i - (n - 1) / 2) * step;
};
for (const [id, list] of outs) {
  const n = byId.get(id);
  list.sort((p, q) => (p.b.cy - q.b.cy) || (p.b.cx - q.b.cx));
  list.forEach((ed, i) => { ed.y0 = anchorY(n.cy, i, list.length, 8); ed.x0 = n.x + BOX_W; });
}
for (const [id, list] of ins) {
  const n = byId.get(id);
  list.sort((p, q) => (p.a.cy - q.a.cy) || (p.a.cx - q.a.cx));
  list.forEach((ed, i) => { ed.y1 = anchorY(n.cy, i, list.length, 11); ed.x1 = n.x; });
}

/* ---------------------------------------------------------------- drawing */

const f1 = (v) => Math.round(v * 10) / 10;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function roundedPath(pts, r = 6) {
  const p = [];
  p.push(`M ${f1(pts[0][0])} ${f1(pts[0][1])}`);
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1];
    const d1 = Math.hypot(cx - px, cy - py), d2 = Math.hypot(nx - cx, ny - cy);
    const rr = Math.max(0, Math.min(r, d1 / 2, d2 / 2));
    const a = [cx - ((cx - px) / (d1 || 1)) * rr, cy - ((cy - py) / (d1 || 1)) * rr];
    const b = [cx + ((nx - cx) / (d2 || 1)) * rr, cy + ((ny - cy) / (d2 || 1)) * rr];
    p.push(`L ${f1(a[0])} ${f1(a[1])}`);
    if (rr > 0.5) p.push(`Q ${f1(cx)} ${f1(cy)} ${f1(b[0])} ${f1(b[1])}`);
  }
  const last = pts[pts.length - 1];
  p.push(`L ${f1(last[0])} ${f1(last[1])}`);
  return p.join(" ");
}

function edgePath(ed) {
  const { x0, y0, x1, y1 } = ed;
  if (ed.kind === "straight") return `M ${f1(x0)} ${f1(y0)} L ${f1(x1)} ${f1(y1)}`;
  if (ed.kind === "curve") {
    const dx = Math.max(22, (x1 - x0) * 0.55);
    return `M ${f1(x0)} ${f1(y0)} C ${f1(x0 + dx)} ${f1(y0)}, ${f1(x1 - dx)} ${f1(y1)}, ${f1(x1)} ${f1(y1)}`;
  }
  if (ed.gutter === null) return roundedPath([[x0, y0], [ed.gapX, y0], [ed.gapX, y1], [x1, y1]]);
  return roundedPath([[x0, y0], [ed.downX, y0], [ed.downX, ed.busY], [ed.upX, ed.busY], [ed.upX, y1], [x1, y1]]);
}

const out = [];
const put = (s) => out.push(s);

const TIERS = [
  { t: 1, from: 0, to: 4, label: "Tier 1 — the viable deliverable", fill: "#eef4fb", stroke: "#c7d8ec" },
  { t: 2, from: 5, to: 6, label: "Tier 2 — Model Engine uplift", fill: "#f4f0fc", stroke: "#dbd0f2" },
  { t: 3, from: 7, to: 7, label: "Tier 3 — cut first", fill: "#f4f4f5", stroke: "#dcdce0" },
];

const DESC =
  "A layered dependency graph of the To-Do-List build. Eight horizontal lanes are the eight epics, " +
  "grouped into three tiers: Tier 1 is Epics 1 to 5, Tier 2 is Epics 6 and 7, Tier 3 is Epic 8. " +
  "Thirty-eight story boxes sit in eleven columns; a column is the earliest wave in which a story can be " +
  "built, so stories in the same column have no dependency on each other. Fifty-three arrows are " +
  "prerequisites pointing from the story that must ship first to the story that waits for it. Curved arrows " +
  "stay inside one epic; straight coloured rails cross between epics and are coloured by the epic they leave. " +
  "Epic 1 starts alone in column 0 with Story 1.1, the clean clone and first-run surface. Epic 2 starts at " +
  "column 3 with Story 2.1, the Rule Engine. Epic 3 starts at column 3 with Story 3.1, the derived lists. " +
  "Story 4.1, the committed Fixture, is the FR-19 gate: Stories 4.2, 4.3, 4.4, 7.1 and 7.2 all depend on it. " +
  "Epic 5 runs from column 6 to column 9 and ends the Tier 1 deliverable. Epic 6 runs from column 5 to " +
  "column 10 and depends only on Story 2.6. Epic 7 runs from column 8 to column 10 and needs both the " +
  "harness and the Model Engine adapter. Epic 8, the three cuttable refinements, depends on Epics 2 and 3 " +
  "and nothing depends on it.";

put(`<?xml version="1.0" encoding="UTF-8"?>`);
put(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(DESC)}" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">`);
put(`<title>To-Do-List: 8 epics, 38 stories and the order they must be built in</title>`);
put(`<desc>${esc(DESC)}</desc>`);

// markers, one per epic colour
put(`<defs>`);
for (const e of EPICS) {
  put(`<marker id="ah${e.n}" viewBox="0 0 10 10" refX="9.2" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="${e.color}"/></marker>`);
}
put(`<marker id="ahk" viewBox="0 0 10 10" refX="9.2" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#3f4652"/></marker>`);
put(`</defs>`);

put(`<rect width="${W}" height="${H}" fill="#fcfcfb"/>`);

/* header */
put(`<text x="26" y="44" font-size="25" font-weight="700" fill="#111827">To-Do-List — 8 epics, 38 stories, and the order they must be built in</text>`);
put(`<text x="26" y="70" font-size="13" fill="#374151">Every arrow is a prerequisite: the story an arrow points to cannot start until the story it leaves has shipped. Lanes are epics, read top to bottom; the build runs left to right.</text>`);
put(`<text x="26" y="90" font-size="13" fill="#374151">A column is the earliest wave a story can be built in — two stories in the same column have no dependency between them, so either order works. Generated from <tspan font-family="Consolas, Menlo, monospace" font-size="12">.docs/planning-artifacts/epics.md</tspan>.</text>`);
put(`<text x="26" y="110" font-size="13" fill="#374151">Cutting is deleting whole epics from the bottom, never stories from the middle (PRD section 6.3 cut order, AD-10): drop Epic 8, then Epic 7, then Epic 6, and every remaining arrow still has its source.</text>`);

/* legend */
let lx = 26, ly = 134;
const legend = [
  ["curve", "prerequisite inside the same epic"],
  ["rail", "prerequisite across epics, coloured by the epic it leaves"],
  ["gate", "Story 4.1 is the FR-19 gate: 4.2, 4.3, 4.4, 7.1 and 7.2 all wait for it"],
  ["box", "story box: id, what it delivers, and its lead requirement"],
];
for (const [kind, text] of legend) {
  if (kind === "curve") {
    put(`<path d="M ${lx} ${ly + 8} C ${lx + 14} ${ly + 8}, ${lx + 16} ${ly}, ${lx + 30} ${ly}" fill="none" stroke="#3f4652" stroke-width="1.8" marker-end="url(#ahk)"/>`);
  } else if (kind === "rail") {
    put(`<path d="${roundedPath([[lx, ly + 8], [lx + 12, ly + 8], [lx + 12, ly], [lx + 30, ly]])}" fill="none" stroke="#0e7490" stroke-width="1.5" marker-end="url(#ah2)"/>`);
  } else if (kind === "gate") {
    put(`<rect x="${lx}" y="${ly - 7}" width="30" height="16" rx="3" fill="#fffbeb" stroke="#a16207" stroke-width="1.8"/>`);
    put(`<text x="${lx + 15}" y="${ly + 4}" font-size="9" font-weight="700" fill="#a16207" text-anchor="middle">4.1</text>`);
  } else {
    put(`<rect x="${lx}" y="${ly - 7}" width="30" height="16" rx="3" fill="#ffffff" stroke="#cbd2da"/>`);
  }
  put(`<text x="${lx + 38}" y="${ly + 4}" font-size="11.5" fill="#374151">${esc(text)}</text>`);
  lx += 38 + text.length * 6.1 + 30;
  if (kind === "rail") { }
}

/* tier bands */
for (const t of TIERS) {
  const y0 = laneTop[t.from] - 16, y1 = laneTop[t.to] + laneH(t.to) + 12;
  put(`<rect x="12" y="${f1(y0)}" width="${W - 24}" height="${f1(y1 - y0)}" rx="10" fill="${t.fill}" stroke="${t.stroke}" stroke-width="1"/>`);
  const mid = (y0 + y1) / 2;
  put(`<text x="26" y="${f1(mid)}" font-size="11.5" font-weight="700" fill="#64748b" text-anchor="middle" transform="rotate(-90 26 ${f1(mid)})">${esc(t.label)}</text>`);
}

/* column bands + wave headers */
for (let c = 0; c < COLS; c++) {
  const x = colX(c);
  if (c % 2 === 0) put(`<rect x="${x - 8}" y="${laneTop[0] - 14}" width="${BOX_W + 16}" height="${f1(LANES_BOTTOM + 10 - laneTop[0] + 14)}" rx="6" fill="#000000" opacity="0.022"/>`);
  put(`<text x="${x + BOX_W / 2}" y="${TOP - 26}" font-size="11" font-weight="700" fill="#6b7280" text-anchor="middle">WAVE ${c}</text>`);
}
put(`<text x="${LEFT - 14}" y="${TOP - 26}" font-size="10.5" fill="#9aa3ae" text-anchor="end">earliest build wave →</text>`);

/* edges first, so opaque boxes sit on top */
for (const ed of EDGES) {
  const dash = ed.sameLane ? "" : "";
  put(`<path d="${edgePath(ed)}" fill="none" stroke="${ed.color}" stroke-width="${ed.sameLane ? 1.8 : 1.5}" stroke-opacity="${ed.sameLane ? 0.85 : 0.95}" stroke-linecap="round" marker-end="url(#ah${ed.a.e})"${dash}/>`);
}

/* epic labels */
EPICS.forEach((e, i) => {
  const top = laneTop[i], h = laneH(i);
  const stories = NODES.filter((n) => n.e === e.n).length;
  const lines = [
    { t: `Epic ${e.n}`, size: 13.5, weight: 700, fill: e.color },
    { t: e.title, size: 10.5, weight: 600, fill: "#1f2937", wrap: true },
    { t: e.reqs, size: 9.5, weight: 400, fill: "#6b7280" },
    { t: `${stories} stories · ${e.prereq}`, size: 9.5, weight: 400, fill: "#6b7280" },
  ];
  const wrapped = [];
  for (const l of lines) {
    if (!l.wrap || l.t.length <= 31) { wrapped.push(l); continue; }
    const words = l.t.split(" "); let cur = "";
    const parts = [];
    for (const w of words) {
      if ((cur + " " + w).trim().length > 31) { parts.push(cur.trim()); cur = w; } else cur += " " + w;
    }
    parts.push(cur.trim());
    for (const p of parts) wrapped.push({ ...l, t: p });
  }
  const lh = 15, blockH = wrapped.length * lh;
  let y = top + h / 2 - blockH / 2 + 11;
  put(`<rect x="38" y="${f1(top)}" width="3.5" height="${f1(h)}" rx="1.75" fill="${e.color}"/>`);
  for (const l of wrapped) {
    put(`<text x="50" y="${f1(y)}" font-size="${l.size}" font-weight="${l.weight}" fill="${l.fill}">${esc(l.t)}</text>`);
    y += lh;
  }
});

/* story boxes */
for (const n of NODES) {
  const gate = n.id === "4.1";
  put(`<g>`);
  put(`<rect x="${n.x}" y="${n.y}" width="${BOX_W}" height="${BOX_H}" rx="5" fill="#ffffff" stroke="${gate ? n.color : "#cbd2da"}" stroke-width="${gate ? 2.2 : 1}"/>`);
  put(`<rect x="${n.x}" y="${n.y}" width="4" height="${BOX_H}" rx="2" fill="${n.color}"/>`);
  if (gate) put(`<rect x="${n.x + 4}" y="${n.y + 1}" width="${BOX_W - 5}" height="${BOX_H - 2}" rx="4" fill="#fffbeb" opacity="0.85"/>`);
  put(`<text x="${n.x + 11}" y="${n.y + 15}" font-size="10.5" font-weight="700" fill="${n.color}">Story ${n.id}</text>`);
  put(`<text x="${n.x + BOX_W - 8}" y="${n.y + 15}" font-size="8.5" fill="#8b949e" text-anchor="end">${esc(n.req)}</text>`);
  n.lines.forEach((t, i) => {
    put(`<text x="${n.x + 11}" y="${n.y + 31 + i * 12}" font-size="9.5" fill="#1f2937">${esc(t)}</text>`);
  });
  {
    const pre = EDGES.filter((e) => e.t === n.id).map((e) => e.f);
    const txt = pre.length ? "after " + pre.join(" · ") : "starts the build";
    put(`<text x="${n.x + 11}" y="${n.y + BOX_H - 9}" font-size="8.5" fill="${pre.length ? "#7a8390" : n.color}" font-style="${pre.length ? "normal" : "italic"}">${esc(txt)}</text>`);
  }
  put(`</g>`);
}

/* footer */
const fy = LANES_BOTTOM + 58;
put(`<text x="26" y="${f1(fy)}" font-size="11.5" fill="#4b5563">53 prerequisite edges, all pointing forwards: no story in this figure depends on a story to its right, inside its epic or outside it. Story titles are shortened to fit — <tspan font-family="Consolas, Menlo, monospace" font-size="11">epics.md</tspan> carries the full title, the acceptance criteria and the spine row for each one.</text>`);
put(`<text x="26" y="${f1(fy + 20)}" font-size="11.5" fill="#4b5563">Waves are a dependency fact, not a schedule: one builder works one story at a time, and <tspan font-family="Consolas, Menlo, monospace" font-size="11">bmad-sprint-planning</tspan> flattens this graph into the single ordered queue in <tspan font-family="Consolas, Menlo, monospace" font-size="11">sprint-status.md</tspan>.</text>`);
put(`<text x="26" y="${f1(fy + 40)}" font-size="10.5" fill="#9aa3ae">Illustrative figure for IBE160 · To-Do-List · drawn 2026-11-22 from the approved epic breakdown. Where this figure and epics.md disagree, epics.md governs.</text>`);

put(`</svg>`);

writeFileSync(process.argv[2], out.join("\n") + "\n", "utf8");
console.log(`wrote ${process.argv[2]}  ${W}x${H}  nodes=${NODES.length} edges=${EDGES.length}`);

/* sanity checks */
const problems = [];
for (const n of NODES) {
  for (const m of NODES) {
    if (n === m) continue;
    if (n.x === m.x && Math.abs(n.y - m.y) < BOX_H) problems.push(`overlap ${n.id} / ${m.id}`);
  }
}
for (const ed of EDGES) if (ed.b.c <= ed.a.c) problems.push(`not forward: ${ed.f} -> ${ed.t}`);
for (const ed of EDGES) if (ed.kind === "rail" && ed.gutter !== null && ed.busY === undefined) problems.push(`no busY ${ed.f}->${ed.t}`);
console.log(problems.length ? "PROBLEMS:\n" + [...new Set(problems)].join("\n") : "checks: ok");
