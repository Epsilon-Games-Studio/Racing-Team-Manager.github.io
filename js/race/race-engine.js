const APP_VERSION = "1.0.7";
var IV_ON = true;                                            // interviews: at the start of the GP, before and after the race
var WK = null, SES = null, FL = null, S = null, GAME = { mode: "gp" };
const OPT = Object.assign({ lang: "es", radio: "all", replays: true, fans: true, quality: "hi" }, (() => { try { return JSON.parse(localStorage.getItem("f1tm.opt") || "{}"); } catch (e) { return {}; } })());
function saveOpt() { try { localStorage.setItem("f1tm.opt", JSON.stringify(OPT)); } catch (e) { } }
const MAP_W = 2752, MAP_H = 1536, M_PER_PX = RL.mPerPx;
const CELL_W = 330, CELL_H = 128;            // one car per cell of assets/img/cars.png (nose to the right)
const CAR_LEN_M = 7.92, CAR_W_M = CAR_LEN_M * CELL_H / CELL_W;   // 10 % smaller than before: fewer contacts
const G = 9.81;
const $ = id => document.getElementById(id);

// ---------- race line pre-processing ----------
const N = RL.x.length;
const cum = new Float64Array(N + 1);
for (let i = 0; i < N; i++) { const j = (i + 1) % N; cum[i + 1] = cum[i] + Math.hypot(RL.x[j] - RL.x[i], RL.y[j] - RL.y[i]) * M_PER_PX; }
const LAP_M = cum[N];
const VMAX = Math.max(...RL.v);
const accel = new Float64Array(N), straight = new Float64Array(N), fuelW = new Float64Array(N), tyreW = new Float64Array(N), LATG = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const j = (i + 1) % N, ds = cum[i + 1] - cum[i];
  accel[i] = (RL.v[j] * RL.v[j] - RL.v[i] * RL.v[i]) / (2 * ds);
  straight[i] = Math.min(1, Math.max(0, (RL.v[i] * 3.6 - 150) / 150));
}
for (let i = 0; i < N; i++) {
  const a = (i - 3 + N) % N, c = (i + 3) % N;
  const ax = RL.x[a], ay = RL.y[a], bx = RL.x[i], by = RL.y[i], cx = RL.x[c], cy = RL.y[c];
  const ab = Math.hypot(bx - ax, by - ay), bc = Math.hypot(cx - bx, cy - by), ca = Math.hypot(ax - cx, ay - cy);
  const cr = Math.abs((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));
  const kappa = 2 * cr / (ab * bc * ca + 1e-9) / M_PER_PX;
  const lat = RL.v[i] * RL.v[i] * kappa / G, ds = cum[i + 1] - cum[i]; LATG[i] = Math.min(5.5, lat);
  const throttle = accel[i] > 0.3 || RL.v[i] > VMAX * 0.97 ? 1 : (accel[i] < -1 ? 0.05 : 0.4);
  fuelW[i] = throttle * ds;
  tyreW[i] = (Math.pow(lat, 1.4) + (accel[i] < -1 ? -accel[i] / G * 0.8 : 0) + 0.15) * ds;
}
{ let sf = 0, st = 0; for (let i = 0; i < N; i++) { sf += fuelW[i]; st += tyreW[i]; }
  for (let i = 0; i < N; i++) { const ds = cum[i + 1] - cum[i]; fuelW[i] /= sf * ds; tyreW[i] /= st * ds; } }
const CORNER_S = [];
for (let i = 0; i < N; i++) {
  const v = RL.v[i]; if (v * 3.6 > 260) continue;
  let isMin = true;
  for (let k = -25; k <= 25 && isMin; k++) if (k && RL.v[(i + k + N) % N] < v) isMin = false;
  if (isMin && (!CORNER_S.length || cum[i] - CORNER_S[CORNER_S.length - 1] > 60)) CORNER_S.push(cum[i]);
}
function sectorName(s, x, y) {
  for (let k = 0; k < CORNER_S.length; k++) {
    let d = s - CORNER_S[k]; d = ((d + LAP_M / 2) % LAP_M + LAP_M) % LAP_M - LAP_M / 2;
    if (d > -140 && d < 70) return "Curva " + (k + 1);
  }
  return (y > 1030 && x > 650 && x < 2330) ? "Recta Principal" : "Recta";
}
const wrap = s => ((s % LAP_M) + LAP_M) % LAP_M;
function idxAt(s) { s = wrap(s); let lo = 0, hi = N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; } return lo; }
function sample(s) {
  s = wrap(s);
  const i = idxAt(s), j = (i + 1) % N, t = (s - cum[i]) / (cum[i + 1] - cum[i]);
  const a = (i - 1 + N) % N, b = (j + 1) % N, t2 = t * t, t3 = t2 * t;
  const cr = A => 0.5 * (2 * A[i] + (A[j] - A[a]) * t + (2 * A[a] - 5 * A[i] + 4 * A[j] - A[b]) * t2 + (3 * A[i] - A[a] - 3 * A[j] + A[b]) * t3);
  return { i, x: cr(RL.x), y: cr(RL.y), v: RL.v[i] + (RL.v[j] - RL.v[i]) * t, a: accel[i] };
}
function heading(s) { const a = sample(s - 4), b = sample(s + 4); return Math.atan2(b.y - a.y, b.x - a.x); }

// ---------- strategy model ----------
const FUEL_BASE = 1.66, FUEL_MAX = 130, BATT_MAX = 4.0, PIT_STOP = 2.4;            // stationary time for the tyre change (s)
const PACE = { soft: { k: -0.008, tyre: 0.7, fuel: 0.97 }, bal: { k: 0, tyre: 1.0, fuel: 1.0 }, agg: { k: 0.008, tyre: 1.5, fuel: 1.04 } };
const MIX = { lean: { k: -0.006, fuel: 0.92 }, std: { k: 0, fuel: 1.0 }, rich: { k: 0.005, fuel: 1.08 } };
const ERS = { charge: { dep: 0, harv: 1.0, lift: 40, sig: "−−" }, neutral: { dep: 40, harv: 0.9, lift: 0, sig: "+" },
              defend: { dep: 55, harv: 0.9, lift: 0, sig: "+" }, attack: { dep: 85, harv: 0.85, lift: 0, sig: "++" },
              overtake: { dep: 120, harv: 0.8, lift: 0, sig: "+++" } };
const COMP = { S: { grip: 0.010, wear: 0.034, name: "Blando", col: "#ff2a3c" }, M: { grip: 0, wear: 0.022, name: "Medio", col: "#ffd21f" },
               H: { grip: -0.008, wear: 0.015, name: "Duro", col: "#f4f5f2" },
               I: { grip: 0, wear: 0.026, name: "Intermedio", col: "#3fc94f" }, W: { grip: 0, wear: 0.020, name: "Lluvia", col: "#2f86ff" } };
// compound tyre icon (original design): black tyre with the compound colour band, grey rim and spokes, compound letter on the hub
function tyreSVG(k) {
  const col = COMP[k].col;
  let tread = "", spokes = "";
  for (let i = 0; i < 36; i++) { const a = i * Math.PI / 18, c = Math.cos(a), s = Math.sin(a); tread += `M${(50 + c * 44.5).toFixed(2)} ${(50 + s * 44.5).toFixed(2)}L${(50 + c * 48.5).toFixed(2)} ${(50 + s * 48.5).toFixed(2)}`; }
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + 0.31, c = Math.cos(a), s = Math.sin(a); spokes += `M${(50 + c * 8).toFixed(2)} ${(50 + s * 8).toFixed(2)}L${(50 + c * 28).toFixed(2)} ${(50 + s * 28).toFixed(2)}`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="49.5" fill="#08090b"/>`
    + `<path d="${tread}" stroke="#25292f" stroke-width="2.6"/>`
    + `<circle cx="50" cy="50" r="37" fill="none" stroke="${col}" stroke-width="10"/>`
    + `<circle cx="50" cy="50" r="31" fill="#3b434d"/><circle cx="50" cy="50" r="30" fill="none" stroke="#5f6a77" stroke-width="2"/>`
    + `<path d="${spokes}" stroke="#2c333b" stroke-width="4" stroke-linecap="round"/>`
    + `<text x="50" y="52" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="44" fill="#ffffff" stroke="#0b0d10" stroke-width="3.2" paint-order="stroke" text-anchor="middle" dominant-baseline="central">${k}</text></svg>`;
}
const TYRE_URL = {}, TYRE_IMG = {};
["S", "M", "H", "I", "W"].forEach(k => { TYRE_URL[k] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(tyreSVG(k)); const im = new Image(); im.src = TYRE_URL[k]; TYRE_IMG[k] = im; });
const tyreImg = (k, cls) => `<img class="tyi${cls ? " " + cls : ""}" src="${TYRE_URL[k]}" alt="${COMP[k].name}" draggable="false">`;
function drawTyre(g, k, x, y, size) { const im = TYRE_IMG[k]; if (im && im.complete && im.naturalWidth) g.drawImage(im, x - size / 2, y - size / 2, size, size); else { g.beginPath(); g.arc(x, y, size / 2, 0, Math.PI * 2); g.fillStyle = COMP[k].col; g.fill(); } }
const TYRE_BIAS = [1.15, 1.0, 0.95, 0.9];
// aerodynamic parts: id, name, point on the nose-up sprite (px), corner speed lost when the part is destroyed
// [id, name, u, v (0-1 across / along the nose-up technical drawing assets/img/aero_car.png), corner speed lost when destroyed]
const AERO = [["FWL", "Alerón del. izq.", 0.13, 0.075, 0.010], ["FWR", "Alerón del. der.", 0.87, 0.075, 0.010],
  ["BGL", "Deflector izq.", 0.10, 0.37, 0.002], ["BGR", "Deflector der.", 0.90, 0.37, 0.002],
  ["SPL", "Pontón izq.", 0.23, 0.55, 0.002], ["SPR", "Pontón der.", 0.77, 0.55, 0.002],
  ["FLL", "Fondo izq.", 0.22, 0.70, 0.005], ["FLR", "Fondo der.", 0.78, 0.70, 0.005],
  ["DIF", "Difusor", 0.50, 0.835, 0.006], ["RW", "Alerón trasero", 0.50, 0.93, 0.008]];
const AERO_MAX = AERO.reduce((a, p) => a + p[4], 0);
// starting grid: the slots painted on the map. Each painted bar is the front edge of a slot; the car sits just behind it.
const GRID_SLOTS = GRID_POS.length;
function gridSlot(k) {
  const [front, lat] = GRID_POS[Math.min(k, GRID_POS.length - 1)];
  return { s: front - CAR_LEN_M / 2 - 0.35, lat };
}
// teams: board colour, pace (speed factor offset) and garage (index along the pit lane)
const TEAMS = {
  mcl: { name: "McLaron", col: "#ff8000", skill: 0, box: 0 },        mer: { name: "AMB Petranas", col: "#27f4d2", skill: -0.0008, box: 1 },
  rbr: { name: "Red Ball", col: "#3671c6", skill: -0.0016, box: 2 },  fer: { name: "Farrari", col: "#e8002d", skill: -0.0024, box: 3 },
  wil: { name: "Wiliams", col: "#64c4ff", skill: -0.0064, box: 4 },  rcb: { name: "VISE PR", col: "#6692ff", skill: -0.008, box: 5 },
  amr: { name: "Aston", col: "#229971", skill: -0.0048, box: 6 }, haa: { name: "Haos", col: "#b6babd", skill: -0.0088, box: 7 },
  aud: { name: "Revoult", col: "#d42a1e", skill: -0.0096, box: 8 },      alp: { name: "Alipne", col: "#ff87bc", skill: -0.0104, box: 9 },
  cad: { name: "Cadilac", col: "#d6c38e", skill: -0.0118, box: 10 }
};
Object.entries({ mcl: ["McLaron", "Merzedes"], mer: ["AMB Petranas", "Merzedes"], rbr: ["Red Ball Racing", "Red Ball Forde"], fer: ["Farrari", "Farrari"], wil: ["Wiliams", "Merzedes"],
  rcb: ["VISE PR", "Red Ball Forde"], amr: ["Aston GP Team", "Hondo"], haa: ["Haos GP Team", "Farrari"], aud: ["Revoult GP Team", "Audy"], alp: ["Alipne", "Merzedes"], cad: ["Cadilac", "Farrari"] })
  .forEach(([t, [full, pu]]) => { TEAMS[t].full = full; TEAMS[t].pu = pu; });
// team logos (logo_<team>.png): white marks, except the ones that only read in colour
const LOGO = {}, LOGO_COLOR = { rbr: 1, fer: 1, haa: 1 };
Object.keys(TEAMS).forEach(t => { const im = new Image(); im.onload = () => { if (typeof GARV !== "undefined") { delete GARV.base[t]; drawGarage(true); } }; im.src = `assets/logos/logo_${t}.png`; LOGO[t] = im; });
const teamLogoSel = (t, cls = "tlg") => TEAMS[t] ? `<img class="${cls}" src="assets/logos/tlogo_${t}.png" alt="${TEAMS[t].name}" draggable="false">` : "";   // team selection screen
const teamLogo = (t, cls = "tlg") => TEAMS[t] ? `<img class="${cls}" src="assets/logos/logo_${t}.png" alt="${TEAMS[t].name}" draggable="false">` : "";
const NAT = { GAS: "FR", COL: "AR", ALO: "ES", TSU: "JP", HUL: "DE", BOR: "BR", PER: "MX", BOT: "FI", LEC: "MC", HAM: "GB", OCO: "FR", BEA: "GB", NOR: "GB", PIA: "AU",
  RUS: "GB", ANT: "IT", LAW: "NZ", LIN: "GB", VER: "NL", HAD: "FR", SAI: "ES", ALB: "TH", STR: "CA", MAG: "DK", WEH: "DE", ZHO: "CN", KVY: "RU", GIO: "IT" };
const PORTRAIT = ["GAS", "COL", "ALO", "STR", "HUL", "BOR", "PER", "BOT", "LEC", "HAM", "OCO", "BEA", "NOR", "PIA", "RUS", "ANT", "LAW", "LIN", "VER", "HAD", "SAI", "ALB",
  "TSU", "MAG", "WEH", "ZHO", "KVY", "GIO"];
const FREE_AGENTS = [["TSU", "TSUNODA", 22], ["MAG", "MAGNUSSEN", 20], ["WEH", "WEHRLEIN", 94], ["ZHO", "ZHOU", 24], ["KVY", "KVYAT", 26], ["GIO", "GIOVINAZZI", 99]]
  .map(([code, name, num]) => ({ code, name, num }));          // not on the 2026 grid: for the driver market to come
// portraits in assets/img/drivers.jpg (pixel art): 7 × 4 cells of 152 × 192, the face centred at (76, 70)
const PCELL = { w: 152, h: 192, cols: 7, rows: 4, fx: 76, fy: 70 }, PFACE = {};
// the whole cell, for a box w px wide
function portraitCss(code, w) { const u = typeof ptUrl === "function" ? ptUrl(code) : ""; if (u) return `background-image:url(${u});background-size:${w}px ${(w * PCELL.h / PCELL.w).toFixed(1)}px;background-position:0 0`;
  const i = PORTRAIT.indexOf(code); if (i < 0) return "";
  const h = w * PCELL.h / PCELL.w; return `background-image:url(assets/img/drivers.jpg);background-size:${PCELL.cols * w}px ${PCELL.rows * h}px;background-position:${-(i % PCELL.cols) * w}px ${-Math.floor(i / PCELL.cols) * h}px`; }
// a head shot centred on the face, for a box w × h px (zoom: cell width / box width)
function faceCss(code, w, h, zoom = 1.7) { const u = typeof ptUrl === "function" ? ptUrl(code) : "";
  if (u) { const s = w * zoom / PCELL.w, [fx, fy] = PFACE[code] || [PCELL.fx, PCELL.fy]; return `background-image:url(${u});background-size:${(PCELL.w * s).toFixed(1)}px ${(PCELL.h * s).toFixed(1)}px;background-position:${(w / 2 - fx * s).toFixed(1)}px ${(h / 2 - fy * s).toFixed(1)}px`; }
  const i = PORTRAIT.indexOf(code); if (i < 0) return "";
  const s = w * zoom / PCELL.w, [fx, fy] = PFACE[code] || [PCELL.fx, PCELL.fy], x = (i % PCELL.cols) * PCELL.w + fx, y = Math.floor(i / PCELL.cols) * PCELL.h + fy;
  return `background-image:url(assets/img/drivers.jpg);background-size:${(PCELL.cols * PCELL.w * s).toFixed(1)}px ${(PCELL.rows * PCELL.h * s).toFixed(1)}px;background-position:${(w / 2 - x * s).toFixed(1)}px ${(h / 2 - y * s).toFixed(1)}px`; }
// the two player cars first (idx 0 and 1, the driver panels); cell = sprite in assets/img/cars.png
const DRIVERS = [
  ["ALO", "ALONZO", 14, "amr", 3, 0], ["STR", "STROL", 18, "amr", 10, -0.0015],
  ["NOR", "NORRISS", 1, "mcl", 1, 0], ["PIA", "PIASTRY", 81, "mcl", 2, -0.0004],
  ["VER", "VERSTAPEN", 3, "rbr", 0, 0.0008], ["HAD", "HADJER", 6, "rbr", 7, -0.0014],
  ["RUS", "RUSSEL", 63, "mer", 15, 0], ["ANT", "ANTONNELLI", 12, "mer", 18, -0.0008],
  ["LEC", "LECLAIR", 16, "fer", 9, 0], ["HAM", "HAMILTEN", 44, "fer", 17, -0.0004],
  ["ALB", "ALBONN", 23, "wil", 4, 0], ["SAI", "SAINS", 55, "wil", 12, 0],
  ["LAW", "LAUSON", 30, "rcb", 6, 0], ["LIN", "LINDBLADT", 41, "rcb", 11, -0.0008],
  ["OCO", "OKON", 31, "haa", 5, 0], ["BEA", "BEARMANN", 87, "haa", 16, 0],
  ["GAS", "GASLI", 10, "alp", 8, 0], ["COL", "KOLAPINTO", 43, "alp", 14, -0.0006],
  ["HUL", "HULKENBURG", 27, "aud", 13, 0], ["BOR", "BORTOLETTO", 5, "aud", 19, -0.0002],
  ["PER", "PERES", 11, "cad", 20, 0], ["BOT", "BOTAS", 77, "cad", 21, -0.0004]
].map(([code, name, num, team, cell, ds], k) => ({ code, name, num, team, cell: k, col: TEAMS[team].col, box: TEAMS[team].box, skill: TEAMS[team].skill + ds, ai: k > 1, slot: k }));
function setGrid() {                            // qualifying: pace plus a little luck
  if (WK && WK.grid) { DRIVERS.forEach((d, k) => d.slot = WK.grid[k]); return; }
  DRIVERS.map((d, k) => ({ k, q: d.skill + (Math.random() - 0.5) * 0.004 })).sort((a, b) => b.q - a.q).forEach((o, p) => DRIVERS[o.k].slot = p);
}
const START = { state: "grid", t: 0, lit: 0, outAt: 0, hideAt: 0 };
let YELLOW_UNTIL = -1;                          // sim time until which a yellow flag is shown after a contact
function resetStart() {
  START.state = "grid"; START.t = 0; START.lit = 0; START.outAt = 6 + 0.2 + Math.random() * 2.8; START.hideAt = 0;
  const L = document.getElementById("lights"); if (L) { L.hidden = false; L.classList.remove("out"); L.querySelectorAll(".lc").forEach(c => c.classList.remove("on")); }
}
// official procedure: the five red lights come on one by one at 1 s intervals, then all go out after a random 0.2-3 s hold
function stepStart(dt) {
  if (START.state === "done" || START.state === "menu") return;
  START.t += dt;
  const L = $("lights");
  if (START.state === "grid" || START.state === "lights") {
    const lit = Math.max(0, Math.min(5, Math.floor(START.t - 1)));
    if (lit > 0) START.state = "lights";
    if (lit !== START.lit) { START.lit = lit; L.querySelectorAll(".lc").forEach((c, k) => c.classList.toggle("on", k < lit)); }
    if (START.t >= START.outAt) {
      START.state = "go"; L.querySelectorAll(".lc").forEach(c => c.classList.remove("on"));
      cars.forEach(c => { c.launchAt = simClock + 0.17 + Math.random() * 0.16; c.vL = 0; });   // reaction times
      START.hideAt = START.t + 1.2;
    }
  } else if (START.state === "go" && START.t >= START.hideAt) {
    L.classList.add("out"); START.state = "done"; setTimeout(() => { if (START.state === "done") L.hidden = true; }, 600);
  }
}
const racing = () => START.state === "go" || START.state === "done";

let simClock = 0, recAcc = 0, replay = null, pendingReplay = null;   // replay state
const REC = [];
const PARTS = [], MARKS = [], RMARKS = [];   // MARKS: ruts in the gravel (kept all race), RMARKS: rubber from lock-ups          // particle events (dust, smoke, sparks, debris) stamped with sim time
let PIT_READY = false;
let RACE_LAPS = 66, cars = [];
function newCar(d, idx) {
  const fuel = Math.min(FUEL_MAX, RACE_LAPS * FUEL_BASE * 0.965 + 0.5);
  const g = gridSlot(d.slot);
  return { idx, ...d, s: wrap(g.s), started: false, lap: 0, lapT: 0, total: 0, last: null, best: null, launchAt: Infinity, vL: 0, kick: 0, wobT: 9, wobA: 0,
           fuel, batt: BATT_MAX, battLapStart: BATT_MAX, battLastLap: null,
           comp: "M", nextComp: "M", wear: [0, 0, 0, 0], tyreLaps: 0, pace: "bal", mix: "std", ers: "neutral",
           pitReq: false, pit: null, vNow: 0, stops: 0, hist: [], laps: [], stints: [{ c: "M", a: 0 }], pitLog: [], trS: [], trLast: null, vTop: 0, puKm: 0, gbKm: 0, shifts: 0, done: false, dnf: false, deploy: 0, harvest: 0, k: 1, lat: g.lat, head: heading(wrap(g.s)), launch: { d: 0, steer: 0 } };
}
function hash01(a) { const h = Math.sin(a * 91.345) * 47453.5453; return h - Math.floor(h); }
function newRace() { SBEST = [null, null, null]; FIN_N = 0; FIN_T = -1; FL = null; setGrid(); cars = DRIVERS.map(newCar);
  cars.forEach(c => { if (!c.ai) return; const r = Math.random(); c.comp = c.nextComp = r < 0.22 ? "S" : r < 0.34 ? "H" : "M"; c.aiPitAt = 0.62 + Math.random() * 0.14; c.aiMandLap = Math.round(RACE_LAPS * (0.4 + Math.random() * 0.3)); });
  cars.forEach(c => { c.stints = [{ c: c.comp, a: 0 }]; c.puKm = 900 + hash01(c.idx * 7.3 + 1) * 2400; c.gbKm = 600 + hash01(c.idx * 3.1 + 5) * 2600; initTelemetry(c); });
  WXH = []; WX_SEED = Math.random() * 1000; resetStart(); YELLOW_UNTIL = -1; PARTS.length = 0; MARKS.length = 0; RMARKS.length = 0; cars.forEach(c => c.wPrev = null); if (typeof initSC === "function" && PIT_READY) initSC(); REC.length = 0; pendingReplay = null; if (replay) endReplay();
  if (typeof WX_READY !== "undefined" && WX_READY) wxReset(); if (typeof resetCrews === "function") resetCrews(); if (typeof fxReset === "function") fxReset();
  cars.forEach(c => { c.xk = typeof xkOf === "function" ? xkOf(c) : 0; }); }
newRace();
var FIN_N = 0, FIN_T = -1;                                  // cars that have taken the chequered flag
const progress = c => c.fin ? c.finLaps * LAP_M + 1 - c.finPos * 1e-3 : (c.lap - 1) * LAP_M + c.s;

function wearLoss(w) { return w < 0.6 ? w * 0.015 : 0.009 + (w - 0.6) * 0.08; }
function speedFactor(c, i) {
  const ws = straight[i], wc = 1 - ws, avgW = (c.wear[0] + c.wear[1] + c.wear[2] + c.wear[3]) / 4;
  return 1 + c.skill + PACE[c.pace].k + MIX[c.mix].k * ws + (c.deploy / 120) * 0.03 * ws - c.fuel * 0.000375
           + (COMP[c.comp].grip - wearLoss(avgW)) * (0.4 + 0.6 * wc) - (c.aeroLoss || 0) * (0.25 + 0.75 * wc) - wetLoss(c.comp, c.wl || 0) * (0.55 + 0.45 * wc) + (c.xk || 0);
}
// heading follows the direction the car is really travelling (race line, line changes, pit entry, box, pit exit,
// contacts), filtered so the nose turns smoothly; during a spin or a crash the incident model sets it
function stepHead(c, h) {
  if (c.gar) { c.prevP = null; return; }                            // in and around the garage the path sets the heading
  const p = carPos(c), q = c.prevP; c.prevP = { x: p.x, y: p.y };
  if (c.dnf && c.inc) return;
  const turn = (tgt, k) => Math.atan2(Math.sin(tgt - c.head), Math.cos(tgt - c.head)) * Math.min(1, k);
  if (c.inc) { c.head += turn(heading(c.s) + c.inc.slip + c.inc.yaw, h * 25); return; }
  if (!q) return;
  const dx = p.x - q.x, dy = p.y - q.y;
  if (dx * dx + dy * dy < 1e-8) return;                              // standing still: keep the heading
  const d = turn(Math.atan2(dy, dx), h * (6 + 14 * Math.min(1, (c.vNow || 0) / 25))), mx = 3.2 * h;   // max 3.2 rad/s of yaw
  c.head += Math.max(-mx, Math.min(mx, d));
}
function prevAcc(c, i) { return accel[(i - 1 + N) % N]; }
function stepCar(c, h) {
  if (c.done) {
    if (c.dnf && !c.gone) {                         // marshals clear a stranded car: always before the safety car goes in
      if (c.dnfT == null) c.dnfT = simClock;
      if (simClock - c.dnfT > (scActive() ? 26 : 14) || SC.state === "in" || (SC.state === "track" && SC.lapsLeft <= 1)) c.gone = true;
    }
    return;
  }
  if (c.gar) { stepGar(c, h); return; }
  if (c.failAt && !c.pit && c.lap >= c.failAt) { c.failAt = 0; c.dnf = true; c.done = true; c.vNow = 0; c.dnfWhy = "Avería mecánica"; toast(`${c.code} · ${L("Abandono: avería mecánica", "Retired: mechanical failure")}`, true); checkEnd(); return; }
  if (c.pit) { stepPit(c, h); lapCheck(c); return; }
  if (!racing() || simClock < c.launchAt) { c.vNow = 0; c.deploy = c.harvest = 0; return; }   // on the grid
  const p = sample(c.s), i = p.i;
  c.wl = carWet(c);
  const k = c.fuel > 0 ? speedFactor(c, i) * incidentSpeed(c) : 0;
  if (c.inc) c.inc.lost = (c.inc.lost || 0) + h * (1 - incidentSpeed(c));
  let vCar = p.v * k;
  if (SES) vCar *= sesMul(c);
  if (scActive()) vCar = scCap(c, vCar);           // safety car: delta speed, then queue behind it
  if (c.vL < 200) {                                 // standing start: traction-limited launch
    c.vL += Math.min(11, 13.5 * (1 - (c.vL / 96) ** 2)) * h;
    if (c.vL >= vCar && c.vL > 40) c.vL = 999; else vCar = Math.min(vCar, c.vL);
    if (c.vL < 9) dustAt(c, 1, null, 14, h, "asphalt", W_REAR);           // brief wheelspin off the line
  }
  { const v0 = vCar; vCar = followCap(c, vCar); if (SES && c.lt === "push" && vCar < v0 * 0.995) c.lapTraffic = (c.lapTraffic || 0) + h * (1 - vCar / v0); }
  let ds = vCar * h;
  { const cap = capAdvance(c, frameOf(c), ds); if (cap < ds) { ds = cap; vCar = ds / h; } }   // car or safety car ahead in this line
  const e = ERS[c.ers], throttle = accel[i] > 0.3 || RL.v[i] > VMAX * 0.97, braking = accel[i] < -1;
  c.deploy = throttle && straight[i] > 0.15 && e.dep > 0 && c.batt > 0 ? e.dep : 0;
  c.harvest = braking ? 120 * e.harv : (!throttle && e.lift ? e.lift : 0);
  c.batt = Math.max(0, Math.min(BATT_MAX, c.batt + (c.harvest - c.deploy) * h / 1000));
  c.fuel = Math.max(0, c.fuel - FUEL_BASE * fuelW[i] * ds * MIX[c.mix].fuel * PACE[c.pace].fuel * (scActive() ? 0.6 : 1) * (1 - 0.15 * c.wl));
  const tw = COMP[c.comp].wear * tyreW[i] * ds * PACE[c.pace].tyre * (1 + c.fuel / FUEL_MAX * 0.15) * (scActive() ? 0.35 : 1) * wetWear(c.comp, c.wl);
  for (let t = 0; t < 4; t++) c.wear[t] = Math.min(1, c.wear[t] + tw * TYRE_BIAS[t]);
  { // puncture risk: from 85 % wear, rolled at every new 1 %; 85 % -> 1/16 ... 100 % -> certain
    const wp = Math.floor(Math.max(...c.wear) * 100);
    if (!c.punct && wp >= 85 && wp > (c.punctChk || 84)) { c.punctChk = wp; if (Math.random() < (wp - 84) / 16) puncture(c); }
  }
  const prevS = c.s;
  c.k = k; c.vNow = vCar; c.s += ds; c.lapT += h; c.total += h; c.tyreDist = (c.tyreDist || 0) + ds; c.puKm += ds / 1000; c.gbKm += ds / 1000;
  if (c.started) { c.trS[Math.min(TR_N - 1, (c.s / TR_STEP) | 0)] = Math.round(vCar * 36) / 10; if (vCar > c.vTop) c.vTop = vCar; if (scActive()) c.lapSC = true; }
  if (c.pitReq && c.started && !c.inc && prevS < PIT_ENTRY_S && c.s >= PIT_ENTRY_S) {   // take the pit entry
    c.pit = { d: Math.max(0, wrap(c.s - PIT_ENTRY_S)), served: false, stopT: 0, lat0: c.lat, head0: c.head, toGar: !!SES }; c.pitReq = false; ui[c.idx]?.syncPit();
  }
  { const m = Math.floor((progress(c) + 100) / 10); if (m >= 0 && c.hist[m] == null) c.hist[m] = +c.total.toFixed(3); }   // time at each 10 m of race distance
  const latPrev = c.lat;
  if (c.inc) { stepIncident(c, ds, h); clampLat(c, latPrev); if (c.done) return; }
  else {
    if (c.launch) {
      // race start: straight ahead out of the grid box, then a gradual move across towards the racing line
      const Lh = c.launch; Lh.d += ds;
      let dl = 0;
      if (Lh.d > START_STRAIGHT) {
        const maxSlope = Math.min(0.06, (Lh.d - START_STRAIGHT) / 2500);      // at most ~3.4° of steering, eased in
        dl = Math.max(-ds * maxSlope, Math.min(ds * maxSlope, latTarget(c) - c.lat));
        c.lat += dl;
        if (Math.abs(latTarget(c) - c.lat) < 0.15 && Lh.d > START_STRAIGHT + 40) { c.launch = null; c.kick = 0; }
      }
      if (c.launch) Lh.steer = ds > 1e-4 ? Math.atan2(dl, ds) : 0;
    } else { c.lat += (latTarget(c) + c.kick - c.lat) * Math.min(1, h * 2.5); c.kick *= Math.exp(-h * 1.4); }
    clampLat(c, latPrev);
    c.wobT += h;
    const e = limAt(i, Math.sign(c.lat) || 1);
    if (Math.abs(c.lat) > e.edge + 0.5 && surfaceAt(carPos(c)).type === "gravel") dustAt(c, 1, null, 10, h, "gravel", W_ALL);   // dirt thrown up in the gravel
    // occasional lock-up into a heavy braking zone: a puff off one front tyre
    if (accel[i] < -25 && !c.lock && prevAcc(c, i) >= -25) {
      const pr = (c.pace === "agg" ? 0.16 : c.pace === "soft" ? 0.03 : 0.07) * (1 + Math.max(...c.wear));
      if (Math.random() < pr) c.lock = { t: 0.2 + Math.random() * 0.35, w: [Math.random() < 0.5 ? 0 : 1] };
    }
    if (c.lock) { dustAt(c, 1, null, 60, h, "asphalt", c.lock.w); c.lock.t -= h; if (c.lock.t <= 0) c.lock = null; }
    // now and then the floor touches the asphalt at top speed: a short spray of sparks
    if (!c.spark && straight[i] > 0.5 && vCar > 64 && Math.random() < 0.09 * h) c.spark = { t: 0.2 + Math.random() * 0.45 };
    if (c.spark) { floorSparks(c, h); c.spark.t -= h; if (c.spark.t <= 0) c.spark = null; }
    rollIncident(c);
  }
  c.traceAcc = (c.traceAcc || 0) + ds;
  if (c.traceAcc > 4) {            // x, y, braking intensity 0..1
    c.traceAcc = 0; const q = carPos(c), br = accel[i] < -1 ? Math.min(1, -accel[i] / (G * 3.5)) : 0;
    (c.trace || (c.trace = [])).push(+q.x.toFixed(1), +q.y.toFixed(1), +br.toFixed(2));
  }
  if (c.fuel <= 0 && !c.dnf) { c.dnf = true; c.done = true; checkEnd(); }
  stepTelemetry(c, h, i);
  lapCheck(c);
}
// sectors: S1 / S2 / S3 by distance from the line; purple = best of all, green = personal best, yellow = slower
var SECT_M = [LAP_M * 0.345, LAP_M * 0.70], SBEST = [null, null, null];
function secDone(c, k) {
  const t0 = c.secT0; c.secT0 = c.lapT;
  if (t0 == null) return;                       // partial sector (e.g. after reload): no time
  const t = c.lapT - t0, pb = c.secPB || (c.secPB = [null, null, null]);
  const st = SBEST[k] == null || t <= SBEST[k] ? "ob" : pb[k] == null || t <= pb[k] ? "pb" : "sl";
  SBEST[k] = SBEST[k] == null ? t : Math.min(SBEST[k], t); pb[k] = pb[k] == null ? t : Math.min(pb[k], t);
  (c.secs || (c.secs = [null, null, null]))[k] = { t, st };
}
function secCheck(c) {
  if (!c.started || c.done) return;
  const k = c.s < SECT_M[0] ? 0 : c.s < SECT_M[1] ? 1 : 2;
  if (c.secK == null) { c.secK = k; c.secT0 = null; c.secs = c.secs || [null, null, null]; return; }
  if (k > c.secK) { for (let j = c.secK; j < k; j++) secDone(c, j); c.secK = k; }
}
function lapCheck(c) {
  if (SES) return sesLapCheck(c);
  secCheck(c);
  if (c.s >= LAP_M) {
    c.s -= LAP_M;
    if (!c.started) { c.started = true; c.lap = 1; c.lapT = 0; c.secK = 0; c.secT0 = 0; c.secs = [null, null, null]; return; }
    if (c.secK != null) secDone(c, 2);
    c.prevSecs = c.secs; c.secs = [null, null, null]; c.secK = 0;
    c.last = c.lapT; c.best = c.best == null ? c.lapT : Math.min(c.best, c.lapT);
    if (!FL || c.lapT < FL.t) FL = { t: c.lapT, code: c.code, lap: c.lap };
    c.laps.push([+c.lapT.toFixed(3), (c.lapPit ? 1 : 0) | (c.lapSC ? 2 : 0)]); c.lapPit = false; c.lapSC = scActive();
    c.trLast = c.trS; c.trS = [];
    c.battLastLap = c.batt - c.battLapStart; c.battLapStart = c.batt;
    c.lapT = 0; c.secT0 = 0; c.lap++; c.tyreLaps++;
    if (!c.ai && c.plan) planLap(c);
    if (!c.ai && !ruleOK(c) && !c.pitReq && !c.pit && RACE_LAPS - c.lap + 1 <= 5 && c.lap <= RACE_LAPS) toast(`${c.code} · Obligatorio montar otro compuesto antes del final`, true);
    c.lastTrace3 = c.trace; c.trace = [];
    c.nextC = null;
    if (c.lap > RACE_LAPS || FIN_N > 0) { c.fin = true; c.finLaps = c.lap - 1; c.finPos = ++FIN_N; c.lap = Math.min(c.lap, RACE_LAPS); c.done = true; c.pit = null; c.s = 0.01; if (!c.ai) radioEvent(c, "raceEnd", { p: c.finPos }); checkEnd(); }
    else if (!c.ai && c.lap === 2) { const pos = raceOrder().indexOf(c) + 1, gain = c.slot + 1 - pos; const L = [["eng", gain > 0 ? `P${pos} tras la primera vuelta. ¡${gain} ${gain === 1 ? "posición ganada" : "posiciones ganadas"}!` : gain < 0 ? `P${pos} tras la primera vuelta. Mantén la calma, es larga.` : `P${pos} tras la primera vuelta. Buena salida, sin riesgos.`]]; if (gain > 0 && Math.random() < 0.5) L.push(["drv", "¡Vamos!"]); rSay(c.idx, L, 2, "l1" + c.idx); }
  }
}


// ---------- pit lane ----------
function pitStopTime(c) {                     // stationary time: usually 2-4 s, sometimes slow, rarely a disaster
  if (c && !c.ai && isSeason()) return sCrewStop(c);             // the season: your crew's speed, fatigue and morale
  const r = Math.random();
  if (r < 0.82) return 2.0 + 2.0 * Math.pow(Math.random(), 1.8);
  if (r < 0.96) return 4.0 + 1.5 * Math.random();
  return 5.5 + 2.5 * Math.random();
}
const PN = PIT.x.length, V_PIT = 80 / 3.6;
const PIT_ENTRY_S = wrap(PIT.ts[0]);
function pitPoint(d) {                       // Catmull-Rom through the pit-lane samples, with its tangent
  const f = Math.max(0, Math.min(PN - 1.001, d / PIT.step)), i = Math.floor(f), t = f - i;
  const a = Math.max(0, i - 1), j = i + 1, b = Math.min(PN - 1, i + 2), t2 = t * t, t3 = t2 * t;
  const cr = A => 0.5 * (2 * A[i] + (A[j] - A[a]) * t + (2 * A[a] - 5 * A[i] + 4 * A[j] - A[b]) * t2 + (3 * A[i] - A[a] - 3 * A[j] + A[b]) * t3);
  const dr = A => 0.5 * ((A[j] - A[a]) + 2 * (2 * A[a] - 5 * A[i] + 4 * A[j] - A[b]) * t + 3 * (3 * A[i] - A[a] - 3 * A[j] + A[b]) * t2);
  return { x: cr(PIT.x), y: cr(PIT.y), i, h: Math.atan2(dr(PIT.y), dr(PIT.x)) };
}
// distance along the race line beside a point of the pit lane (continuous, so nothing jumps at the entry)
const pitTrackS = d => { const f = Math.max(0, Math.min(PN - 1.001, d / PIT.step)), i = Math.floor(f), t = f - i; return wrap(PIT.ts[i] + (PIT.ts[i + 1] - PIT.ts[i]) * t); };
function pitPos(c) {
  const P = c.pit, q = pitPoint(P.d), box = PIT.boxes[c.box];
  let x = q.x, y = q.y;
  const dd = P.d - box.d, w = Math.max(0, Math.min(1, dd < 0 ? (26 + dd) / 21 : (24 - dd) / 19)); const ws = w * w * w * (w * (w * 6 - 15) + 10);   // swing into the box from 26 m out, straight for the last 5 m (the crew stands there); out the same way
  const bq = pitPoint(box.d); x += (box.x - bq.x) * ws; y += (box.y - bq.y) * ws;   // sideways only, stops dead centre in its box
  if (P.d < 60) {                                                   // blend off the racing line at the entry
    const r = racePos(c, P.lat0 * (1 - P.d / 60)), b = P.d / 60, bs = b * b * b * (b * (b * 6 - 15) + 10);
    x = r.x + (x - r.x) * bs; y = r.y + (y - r.y) * bs;
  }
  return { ...sample(c.s), x, y };
}
function stepPit(c, h) {
  const P = c.pit, box = PIT.boxes[c.box].d;
  c.deploy = 0; c.harvest = 0; c.lapT += h; c.total += h; c.lapPit = true;
  stepTelemetry(c, h, idxAt(c.s));
  if (P.stopT > 0) {
    P.stopT -= h; P.stopEl = Math.min(P.stopDur, (P.stopEl || 0) + h); c.vNow = 0;
    if (P.stopT <= 0) {
      if (P.wing) { c.aero.FWL = c.aero.FWR = 1; aeroCalc(c); if (!c.ai) setTimeout(() => toast(`${c.code} · Alerón delantero nuevo`, "good"), 3600); }
      if (c.plan) { const ps = c.plan.stints[c.stops + 1]; if (!ps || ps.comp !== c.nextComp) { c.plan = null; if (!c.ai) setTimeout(() => toast(`${c.code} · Estrategia manual`, false), 1800); } }
      P.stopT = 0; P.served = true; c.pitLog.push({ lap: Math.max(1, c.lap), d: P.stopDur, from: c.comp, to: c.nextComp }); c.stints.push({ c: c.nextComp, a: Math.max(0, c.lap - 1 + c.s / LAP_M) }); newTyres(c, c.nextComp); c.comp = c.nextComp; c.wear = [0, 0, 0, 0]; c.tyreLaps = 0; c.tyreDist = 0; c.stops++; c.punct = false; c.punctChk = 84; if (c.plan) planStint(c);
      c.lastStop = P.stopDur; ui[c.idx]?.syncPit();
      if (!c.ai) { toast(`${c.code} · Parada ${P.stopDur.toFixed(2)} s`, P.stopDur > 4 ? true : P.stopDur < 2.5 ? "good" : false); radioEvent(c, "stop", { s: P.stopDur.toFixed(1).replace(".", ",") + " s", bad: P.stopDur > 4 }); }
    }
    return;
  }
  if (P.served && !P.released) {                                   // safe release: wait for anything coming down the lane
    const me = frameOf(c);
    const busy = cars.some(o => o !== c && o.pit && !(o.pit.stopT > 0) && o.vNow > 1 && (g => g > -45 && g < 8)(sgap(frameOf(o).s - me.s)))
      || ((SC.state === "out" || SC.state === "in") && (g => g > -45 && g < 8)(sgap(frameOf(SC).s - me.s)));
    if (busy) { c.vNow = 0; return; }
    P.released = true;
  }
  let v = sample(pitTrackS(P.d)).v;
  if (P.d < PIT.limStart) v = Math.min(v, Math.sqrt(V_PIT * V_PIT + 2 * 18 * (PIT.limStart - P.d)));   // brake for the limiter
  else if (P.d <= PIT.limEnd) v = Math.min(v, V_PIT);                                                    // 80 km/h zone
  else v = Math.min(v, Math.sqrt(V_PIT * V_PIT + 2 * 11 * (P.d - PIT.limEnd)));                         // free to accelerate out
  if (!P.served) {
    v = Math.min(v, Math.sqrt(2 * 8 * Math.max(0, box - P.d)) + 0.4);
    // double stack: the team-mate is still in the box, wait in the lane just short of it
    if (cars.some(o => o !== c && o.team === c.team && ((o.pit && !o.pit.released && o.pit.d > P.d && o.pit.d > box - 20) || (o.gar && o.gar.ph !== "park")))) v = Math.min(v, Math.sqrt(2 * 8 * Math.max(0, box - 16 - P.d)));   // the car ahead in the lane goes first
  }
  else if (P.d < box + 40) v = Math.min(v, Math.sqrt(2 * 6 * Math.max(0, P.d - box)) + 1.5);
  let ds = capAdvance(c, frameOf(c), v * h); v = Math.min(v, ds / h);
  if (!P.served && P.toGar && P.d + ds >= box) { P.d = box; garArrive(c); return; }   // session: back into the garage
  if (!P.served && P.d + ds >= box) {
    ds = Math.max(0, box - P.d); P.stopT = P.stopDur = pitStopTime(c); P.stopEl = 0;
    if (c.aero && (c.aero.FWL < 1 || c.aero.FWR < 1)) { const r = 4 + Math.random() * 2.5; P.stopT += r; P.stopDur += r; P.wing = true; }   // new front wing
  }
  P.d += ds; c.vNow = v;
  c.fuel = Math.max(0, c.fuel - FUEL_BASE * 0.25 * ds / LAP_M);
  const ns = pitTrackS(P.d); let dsT = ns - wrap(c.s); if (dsT < -LAP_M / 2) dsT += LAP_M; if (dsT > LAP_M / 2) dsT -= LAP_M;
  c.s += Math.max(0, dsT);
  if (P.d >= PIT.len - 0.01) {                                      // rejoin the track
    const end = pitPoint(PIT.len), r = sample(c.s), hd = heading(c.s);
    c.lat = ((end.x - r.x) * -Math.sin(hd) + (end.y - r.y) * Math.cos(hd)) * M_PER_PX;
    c.pit = null;
  }
}


// ---------- safety car ----------
const SC_LEN_M = 8.56, SC_AR = 0.481, SC_LIGHTS = [[-0.2, -0.171], [-0.2, 0.176]];   // drawn at the same exaggerated scale as the F1 cars
const SC_GAP = 30;                                // metres each car keeps to the car in front in the queue
const SC = { state: "parked", d: 0, s: 0, lapsLeft: 0, lights: false, head: 0, vNow: 0, redeploy: false };
let SC_PARK_D = 0, SC_PARK_OFF = { x: 0, y: 0 };
function initSC() {
  SC_PARK_D = 352;                               // the open apron just after the pit entry, before the first garage
  const q = pitPoint(SC_PARK_D), b = PIT.boxes[0], dx = b.x - PIT.x[0], l = 1;
  // park beside the fast lane, on the garage side
  const nx = -Math.sin(q.h), ny = Math.cos(q.h), side = ((PIT.boxes[0].x - pitPoint(PIT.boxes[0].d).x) * nx + (PIT.boxes[0].y - pitPoint(PIT.boxes[0].d).y) * ny) > 0 ? 1 : -1;
  SC_PARK_OFF = { x: nx * side * 22, y: ny * side * 22 };   // ~14 m off the fast lane
  SC.state = "parked"; SC.d = SC_PARK_D; SC.lights = false; SC.head = q.h; SC.redeploy = false; SC.prevP = null;
}
const scActive = () => SC.lights && (SC.state === "out" || SC.state === "track");
function deploySC(why) {
  if (SES) { sesRed(why || "accidente en pista"); return; }
  if (cars.every(c => c.done)) return;
  if (SC.state === "parked") {
    SC.state = "out"; SC.lights = true; SC.n = (SC.n || 0) + 1; SC.lapsLeft = 2 + Math.floor(Math.random() * 2);   // 2-3 laps, never announced
    cars.forEach(c => c.scQueued = false);
  } else if (SC.state === "in") SC.redeploy = true;
}
function scPos() {
  if (SC.state === "parked") { const q = pitPoint(SC.d); return { x: q.x + SC_PARK_OFF.x, y: q.y + SC_PARK_OFF.y, h: q.h }; }
  if (SC.state === "out" || SC.state === "in") {
    const q = pitPoint(SC.d);
    let w = 0;                                    // pull out of / back into the parking spot
    if (SC.state === "out") w = Math.max(0, 1 - (SC.d - SC_PARK_D) / 45); else w = Math.max(0, 1 - (SC_PARK_D - SC.d) / 45);
    w = w * w * (3 - 2 * w);
    return { x: q.x + SC_PARK_OFF.x * w, y: q.y + SC_PARK_OFF.y * w, h: q.h };
  }
  const p = sample(SC.s); return { x: p.x, y: p.y, h: heading(SC.s) };
}
function stepSC(h) {
  if (SC.state === "parked") return;
  if (SC.state === "out") {
    // wait at the end of the pit lane and come out just ahead of the race leader
    const exitS = pitTrackS(PIT.len), hold = PIT.len - 35;
    const racing = cars.filter(c => !c.done && !c.pit);
    const lead = racing.sort((a, b) => progress(b) - progress(a))[0];
    const ready = !lead || wrap(exitS - lead.s) < 260 || wrap(exitS - lead.s) > LAP_M - 40;
    let v = SC.d < PIT.limEnd ? V_PIT : Math.min(55, Math.sqrt(V_PIT * V_PIT + 2 * 9 * (SC.d - PIT.limEnd)));
    if (!ready && SC.d >= hold - 0.5) v = 0; else if (!ready) v = Math.min(v, Math.sqrt(2 * 6 * Math.max(0, hold - SC.d)) + 0.3);
    v = Math.min(v, capAdvance(SC, frameOf(SC), v * h) / h);
    SC.d += v * h; SC.vNow = v;
    if (SC.d >= PIT.len) { SC.state = "track"; SC.s = pitTrackS(PIT.len); }
  } else if (SC.state === "track") {
    const p = sample(SC.s); let v = Math.min(p.v * 0.62, 52);    // ~185 km/h max, much slower through the corners
    v = Math.min(v, capAdvance(SC, frameOf(SC), v * h) / h);
    const prev = SC.s; SC.s += v * h; SC.vNow = v;
    if (SC.s >= LAP_M) { SC.s -= LAP_M; SC.lapsLeft--; }
    if (SC.lapsLeft <= 0 && prev < PIT_ENTRY_S && SC.s >= PIT_ENTRY_S) {   // lights off, back to the pits: green flag
      SC.lights = false; SC.state = "in"; SC.d = 0; cars.forEach(c => c.scQueued = false);
    }
  } else if (SC.state === "in") {
    let v = sample(pitTrackS(SC.d)).v * 0.62;
    if (SC.d < PIT.limStart) v = Math.min(v, Math.sqrt(V_PIT * V_PIT + 2 * 14 * (PIT.limStart - SC.d))); else v = Math.min(v, V_PIT);
    v = Math.min(v, Math.sqrt(2 * 6 * Math.max(0, SC_PARK_D - SC.d)) + 0.5);
    v = Math.min(v, capAdvance(SC, frameOf(SC), v * h) / h);
    SC.d = Math.min(SC_PARK_D, SC.d + v * h); SC.vNow = v;
    if (SC.d >= SC_PARK_D - 0.05) { SC.state = "parked"; SC.d = SC_PARK_D; if (SC.redeploy) { SC.redeploy = false; deploySC(); } }
  }
  const sp = scPos(), q = SC.prevP; SC.prevP = { x: sp.x, y: sp.y };
  if (q && (sp.x - q.x) ** 2 + (sp.y - q.y) ** 2 > 1e-8) { const tgt = Math.atan2(sp.y - q.y, sp.x - q.x); SC.head += Math.atan2(Math.sin(tgt - SC.head), Math.cos(tgt - SC.head)) * Math.min(1, h * 20); }
}
// ---------- keeping cars apart: no two cars (nor a car and the safety car) ever overlap ----------
const CAR_GAP_M = 1.0, CAR_SIDE_M = 0.4;                    // minimum nose-to-tail gap and side-to-side gap (m)
const sgap = d => ((d + LAP_M / 2) % LAP_M + LAP_M) % LAP_M - LAP_M / 2;   // signed shortest distance along the lap
// footprint along / across the track of a car turned by th against the track direction
function foot(s, lat, head, L, W) {
  const th = head - heading(s), c = Math.abs(Math.cos(th)), n = Math.abs(Math.sin(th));
  return { s, lat, hl: L / 2 * c + W / 2 * n, hw: W / 2 * c + L / 2 * n };
}
function pitFrame(d, p, head, L, W) {        // a point of the pit lane in race-line terms (distance along, lateral offset)
  const s0 = pitTrackS(d), r = sample(s0), hd = heading(s0), dx = p.x - r.x, dy = p.y - r.y;
  return foot(wrap(s0 + (dx * Math.cos(hd) + dy * Math.sin(hd)) * M_PER_PX), (dx * -Math.sin(hd) + dy * Math.cos(hd)) * M_PER_PX, head, L, W);
}
function frameOf(o) {
  if (o === SC) {
    const W = SC_LEN_M * SC_AR;
    return SC.state === "track" ? foot(SC.s, 0, SC.head, SC_LEN_M, W) : pitFrame(SC.d, scPos(), SC.head, SC_LEN_M, W);
  }
  if (o.gar) return pitFrame(PIT.boxes[o.box].d, garPose(o), o.head, CAR_LEN_M, CAR_W_M);
  if (o.pit) return pitFrame(o.pit.d, pitPos(o), dispHead(o), CAR_LEN_M, CAR_W_M);
  return foot(o.s, o.lat, dispHead(o), CAR_LEN_M, CAR_W_M);
}
// distance along the lap between two objects, measured at their own lateral offsets (shorter on the inside of a bend)
function gapAt(me, f) {
  const g = sgap(f.s - me.s), m = me.s + g / 2, a = heading(m - 3), b = heading(m + 3);
  const k = Math.atan2(Math.sin(b - a), Math.cos(b - a)) / 6;
  return g * Math.max(0.5, 1 - k * (me.lat + f.lat) / 2);
}
const scTrackS = () => SC.state === "track" ? SC.s : pitTrackS(SC.d);
function others(self) {
  const out = [], ss = self === SC ? scTrackS() : self.s, near = s => Math.abs(sgap(s - ss)) < 60;
  for (const o of cars) if (o !== self && !o.gone && !(o.done && !o.dnf) && !(self === SC && o.dnf) && near(o.s)) out.push(frameOf(o));   // finished cars leave the track; the safety car is never held up by a stranded car
  if (self !== SC && near(scTrackS())) out.push(frameOf(SC));
  return out;
}
// how far an object may move forward this step without touching anything ahead of it in its line
function capAdvance(self, me, ds) {
  for (const f of others(self)) {
    const g = gapAt(me, f); if (g <= 0) continue;
    if (Math.abs(f.lat - me.lat) >= me.hw + f.hw + CAR_SIDE_M) continue;
    ds = Math.min(ds, Math.max(0, g - me.hl - f.hl - CAR_GAP_M));
  }
  return ds;
}
// traffic: close up to the car ahead in the same line and match its speed, instead of braking to a standstill at the last moment
function followCap(c, v) {
  for (const o of cars) {
    if (o === c || o.pit || o.gar || (o.done && !o.dnf)) continue;
    const g = sgap(o.s - c.s); if (g <= 0 || g > 30) continue;
    if (Math.abs(o.lat - c.lat) >= CAR_W_M + CAR_SIDE_M) continue;
    v = Math.min(v, Math.max(0, (o.vNow || 0) + (g - CAR_LEN_M - CAR_GAP_M - 1.5) * 3));
  }
  return v;
}
// a car alongside another one cannot move sideways into it
function clampLat(c, prevLat) {
  const me = frameOf(c);
  for (const f of others(c)) {
    if (Math.abs(gapAt(me, f)) >= me.hl + f.hl + CAR_GAP_M) continue;
    const sep = me.hw + f.hw + CAR_SIDE_M;
    if (Math.abs(c.lat - f.lat) < sep) { const side = Math.sign(prevLat - f.lat) || (c.idx ? 1 : -1), [lo, hi] = latLimits(c); c.lat = Math.max(lo - 1, Math.min(hi + 1, f.lat + side * sep)); }
  }
}
// speed a car may run at while the safety car is out
function scCap(c, vNat) {
  const delta = vNat * 0.72;                       // "delta" time: much slower than racing pace
  if (SC.state !== "track") return delta;
  let gap = Infinity, vLead = SC.vNow;
  const fwd = s => wrap(s - c.s);
  const dSC = fwd(SC.s); if (dSC < LAP_M - 5) { gap = dSC; vLead = SC.vNow; }
  cars.forEach(o => { if (o === c || o.done || o.pit || o.inc) return; const d = fwd(o.s); if (d > 1 && d < gap) { gap = d; vLead = o.vNow; } });
  if (gap > 150) { c.scQueued = false; return Math.max(delta, Math.min(vNat, SC.vNow * 1.4)); }   // still catching the train
  c.scQueued = gap < 90;
  const v = vLead + (gap - SC_GAP) * 0.6;
  return Math.max(0, Math.min(vNat, v));
}
function drawSC(pose, lightsOn) {
  if (!scImg.complete || !scImg.naturalWidth) return;
  const L = SC_LEN_M / M_PER_PX, W = L * SC_AR;
  ctx.save(); ctx.translate(pose.x, pose.y); ctx.rotate(pose.h);
  ctx.restore(); drawShadow(scShadow, pose.x, pose.y, pose.h, L, W, 0.5); ctx.save(); ctx.translate(pose.x, pose.y); ctx.rotate(pose.h);
  ctx.globalAlpha = 1; ctx.drawImage(scImg, -L / 2, -W / 2, L, W);
  if (lightsOn) {
    const t = performance.now() / 1000, on = Math.floor(t * 6) % 2;
    SC_LIGHTS.forEach(([lx, ly], k) => {
      const x = lx * L, y = ly * W, lit = (k + on) % 2 === 0;
      const g = ctx.createRadialGradient(x, y, 0, x, y, W * 0.7);
      g.addColorStop(0, lit ? "rgba(255,190,40,0.95)" : "rgba(255,150,0,0.25)"); g.addColorStop(1, "rgba(255,150,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, W * 0.7, 0, Math.PI * 2); ctx.fill();
    });
  }
  ctx.restore();
}

PIT_READY = true; initSC();

// ---------- particles (time-stamped, so replays show them too) ----------
let groundData = null;
function groundCol(p) {
  if (!groundData) return "#cdb68a";
  const x = Math.max(0, Math.min(MAP_W - 1, Math.round(p.x))), y = Math.max(0, Math.min(MAP_H - 1, Math.round(p.y))), o = (y * MAP_W + x) * 4, d = groundData;
  return `rgb(${Math.min(255, d[o] * 0.75 + 70)},${Math.min(255, d[o + 1] * 0.75 + 62)},${Math.min(255, d[o + 2] * 0.75 + 50)})`;
}
// ground under a point: "gravel" (the brown/sand traps), "grass", "asphalt" (track, teal run-off, everything else)
function surfaceAt(p) {
  if (!groundData) return { type: "asphalt", r: 90, g: 92, b: 96 };
  const x = Math.max(0, Math.min(MAP_W - 1, Math.round(p.x))), y = Math.max(0, Math.min(MAP_H - 1, Math.round(p.y))), o = (y * MAP_W + x) * 4, d = groundData;
  const r = d[o], g = d[o + 1], b = d[o + 2], l = (r + g + b) / 3;
  let type = "asphalt";
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if ((r > b + 30 && g > b + 15 && r >= g - 6 && l > 105) || (l > 100 && l < 175 && r >= b + 3 && mx - mn < 34 && g <= r + 4)) type = "gravel";   // sand, or the warm grey gravel of this map
  else if (g > b + 12 && g >= r - 4 && l < 120) type = "grass";
  return { type, r, g, b };
}
function addPart(x, y, vx, vy, life, col, size, drag, grow, kind, extra) {
  PARTS.push(Object.assign({ t0: simClock, x, y, vx, vy, life, col, size, drag, grow, kind: kind || (grow ? "puff" : "bit"), rot: Math.random() * 6.283, v: (Math.random() * 4) | 0 }, extra));
  if (PARTS.length > 3000) PARTS.splice(0, PARTS.length - 3000);
}
// smoke / dust by surface: tyre smoke on asphalt rises, billows and lingers; gravel throws a thick low brown cloud that
// settles quickly; grass only a little greenish-brown haze
const SMOKE_RATE = 0.4;              // overall amount of smoke/dust emitted
const SMOKE = {
  asphalt: { col: [226, 228, 231], life: [1.0, 0.8], size: 0.9, grow: 2.4, rise: 1.8, op: 0.55, drag: 1.6 },
  gravel:  { col: null,            life: [1.0, 0.7], size: 1.1, grow: 2.6, rise: 0.6, op: 0.7, drag: 2.8 },
  grass:   { col: null,            life: [0.6, 0.4], size: 0.8, grow: 1.6, rise: 0.3, op: 0.35, drag: 3.2 }
};
function smokeCol(kind, s) {
  if (kind === "asphalt") return SMOKE.asphalt.col;
  if (kind === "gravel") return [Math.min(255, s.r * 0.8 + 52), Math.min(255, s.g * 0.8 + 44), Math.min(255, s.b * 0.8 + 34)];
  return [Math.min(255, s.r * 0.6 + 70), Math.min(255, s.g * 0.6 + 66), Math.min(255, s.b * 0.6 + 40)];
}
// smoke/dust comes only from the tyres: wheels = indices into WHEELS (0,1 front, 2,3 rear)
const W_REAR = [2, 3], W_FRONT = [0, 1], W_ALL = [0, 1, 2, 3];
function dustAt(c, amount, col, rate, h, forceKind, wheels) {
  c.dustAcc = (c.dustAcc || 0) + rate * amount * h * SMOKE_RATE;
  if (c.dustAcc < 1) return;
  const q = carPos(c), hd = dispHead(c), L = CAR_LEN_M / M_PER_PX, W = CAR_W_M / M_PER_PX, ch = Math.cos(hd), sh = Math.sin(hd), v = (c.vNow || 0) / M_PER_PX;
  const set = wheels || W_REAR;
  while (c.dustAcc >= 1) {
    c.dustAcc -= 1;
    const [a, b] = WHEELS[set[(Math.random() * set.length) | 0]];
    const x = q.x + ch * a * L - sh * b * W, y = q.y + sh * a * L + ch * b * W;
    const s = surfaceAt({ x, y }), kind = forceKind || s.type, S = SMOKE[kind];
    const ang = Math.random() * 6.283, sp = (0.5 + Math.random() * 1.5) / M_PER_PX;
    addPart(x, y, ch * v * 0.25 + Math.cos(ang) * sp, sh * v * 0.25 + Math.sin(ang) * sp,
      S.life[0] + Math.random() * S.life[1], smokeCol(kind, s), (S.size * (0.6 + Math.random() * 0.5)) / M_PER_PX, S.drag, (S.grow * (0.7 + Math.random() * 0.6)) / M_PER_PX,
      "puff", { rise: S.rise / M_PER_PX, op: S.op });
  }
}
const SPARK_COLS = ["#fffbe6", "#fff1a8", "#ffd34d", "#ffb02e", "#ff8a1f"];
// titanium skid-block sparks from under the floor: a short spray of single-pixel sparks trailing behind the car
function floorSparks(c, h) {
  const n = c.sparkAcc = (c.sparkAcc || 0) + 320 * h; if (n < 1) return;
  const q = carPos(c), hd = dispHead(c), L = CAR_LEN_M / M_PER_PX, W = CAR_W_M / M_PER_PX, ch = Math.cos(hd), sh = Math.sin(hd), v = (c.vNow || 0) / M_PER_PX;
  for (; c.sparkAcc >= 1; c.sparkAcc--) {
    const a = -0.3 - Math.random() * 0.12, b = (Math.random() - 0.5) * 0.35, x = q.x + ch * a * L - sh * b * W, y = q.y + sh * a * L + ch * b * W;
    const f = 0.3 + Math.random() * 0.45, lat = (Math.random() - 0.5) * 11 / M_PER_PX;
    addPart(x, y, ch * v * f - sh * lat, sh * v * f + ch * lat, 0.12 + Math.random() * 0.3, SPARK_COLS[(Math.random() * SPARK_COLS.length) | 0], 0, 4, 0, "spark");
  }
}
function sparks(p, n) {
  for (let k = 0; k < n; k++) {
    const a = Math.random() * Math.PI * 2, sp = (12 + Math.random() * 30) / M_PER_PX;
    addPart(p.x, p.y, Math.cos(a) * sp, Math.sin(a) * sp, 0.2 + Math.random() * 0.4, SPARK_COLS[(Math.random() * SPARK_COLS.length) | 0], 0, 3.5, 0, "spark");
  }
}
// livery colours of each car, read from its sprite (the most common saturated colours)
const LIVERY = DRIVERS.map(() => null);
function liveryOf(idx) {
  if (LIVERY[idx]) return LIVERY[idx];
  const spr = carSprites[idx]; if (!spr) return ["#555"];
  try {
    const w = spr.naturalWidth || spr.width, hh = spr.naturalHeight || spr.height, cv2 = document.createElement("canvas"); cv2.width = w; cv2.height = hh;
    const g = cv2.getContext("2d"); g.drawImage(spr, 0, 0); const d = g.getImageData(0, 0, w, hh).data, cnt = {};
    for (let o = 0; o < d.length; o += 16) {
      if (d[o + 3] < 200) continue;
      const r = d[o], gg = d[o + 1], b = d[o + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      if (mx - mn < 50 || mx < 70) continue;                                      // skip tyres, carbon and greys
      const key = (r >> 5) + "," + (gg >> 5) + "," + (b >> 5); (cnt[key] = cnt[key] || { n: 0, r: 0, g: 0, b: 0 }); const e = cnt[key]; e.n++; e.r += r; e.g += gg; e.b += b;
    }
    const top = Object.values(cnt).sort((a, b) => b.n - a.n).slice(0, 4).map(e => `rgb(${(e.r / e.n) | 0},${(e.g / e.n) | 0},${(e.b / e.n) | 0})`);
    return (LIVERY[idx] = top.length ? top : ["#555"]);
  } catch (e) { return ["#555"]; }
}
// carbon/bodywork debris: single pixels, 50% black, 30% dark grey, 20% the livery of the car(s) involved
function debris(p, n, v, who) {
  const liv = (who && who.length ? who : [0, 1]).flatMap(liveryOf);
  for (let k = 0; k < n; k++) {
    const a = Math.random() * Math.PI * 2, sp = (3 + Math.random() * (6 + (v || 0) * 0.15)) / M_PER_PX, r = Math.random();
    const col = r < 0.5 ? (Math.random() < 0.5 ? "#000000" : "#0b0c0e") : r < 0.8 ? (Math.random() < 0.5 ? "#2b2e33" : "#3a3e44") : liv[(Math.random() * liv.length) | 0];
    addPart(p.x, p.y, Math.cos(a) * sp, Math.sin(a) * sp, 9999, col, 0.5, 2.6, 0, "pixel");
  }
}
function burst(p, v, who) {
  sparks(p, 60); debris(p, 90, v, who);
  for (let k = 0; k < 8; k++) { const a = Math.random() * Math.PI * 2, sp = (2 + Math.random() * 5) / M_PER_PX, s = surfaceAt(p);
    addPart(p.x, p.y, Math.cos(a) * sp, Math.sin(a) * sp, 2 + Math.random() * 1.6, smokeCol(s.type === "gravel" ? "gravel" : "asphalt", s), (0.9 + Math.random() * 0.6) / M_PER_PX, 1.8, 2.2 / M_PER_PX, "puff", { rise: 1.4 / M_PER_PX, op: 0.7 }); }
}

// volumetric smoke puffs: pre-rendered lit spheres of billowy noise (sun from the top-left, as the car shadows),
// tinted per colour, plus a soft ground shadow that drifts away as the puff rises
const PUFF_RES = 48, PUFF_VAR = 4, puffBase = [], puffCache = new Map();
(function makePuffBases() {
  // soft metaball field (several overlapping blobs + fine noise), lit from its own gradient
  for (let v = 0; v < PUFF_VAR; v++) {
    let seed = 99 + v * 7919; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const blobs = [[0, 0, 0.42, 1]];
    for (let k = 0; k < 9; k++) { const a = rnd() * 6.283, d = 0.12 + rnd() * 0.36; blobs.push([Math.cos(a) * d, Math.sin(a) * d, 0.16 + rnd() * 0.2, 0.55 + rnd() * 0.5]); }
    const N2 = PUFF_RES, F = new Float32Array(N2 * N2), nz = new Float32Array(N2 * N2);
    for (let o = 0; o < nz.length; o++) nz[o] = rnd();
    for (let y = 0; y < N2; y++) for (let x = 0; x < N2; x++) {
      const px = (x + 0.5) / N2 * 2 - 1, py = (y + 0.5) / N2 * 2 - 1; let f = 0;
      for (const [cx, cy, r, w] of blobs) { const dx = (px - cx) / r, dy = (py - cy) / r; f += w * Math.exp(-(dx * dx + dy * dy) * 1.1); }
      const edge = Math.max(0, 1 - Math.hypot(px, py)); f *= Math.min(1, edge * 3);       // never touches the sprite border
      F[y * N2 + x] = f;
    }
    const dens = new Float32Array(N2 * N2), shade = new Float32Array(N2 * N2), Lx = -0.55, Ly = -0.6, Lz = 0.58, at = (x, y) => F[Math.max(0, Math.min(N2 - 1, y)) * N2 + Math.max(0, Math.min(N2 - 1, x))];
    for (let y = 0; y < N2; y++) for (let x = 0; x < N2; x++) {
      const o = y * N2 + x, f = F[o];
      const gx = (at(x + 1, y) - at(x - 1, y)) * 3.2, gy = (at(x, y + 1) - at(x, y - 1)) * 3.2, len = Math.hypot(gx, gy, 1);
      const lit = Math.max(0, (-gx * Lx - gy * Ly + Lz) / len);                          // surface normal = (-grad, 1)
      const t = Math.max(0, Math.min(1, (f - 0.12) / 0.75)), sm = t * t * (3 - 2 * t);
      dens[o] = sm * (0.86 + 0.14 * nz[o]);
      shade[o] = (0.7 + 0.38 * lit) * (0.93 + 0.07 * nz[o]) * (0.82 + 0.18 * Math.min(1, f));   // thicker = a touch brighter core
    }
    puffBase.push({ dens, shade });
  }
})();
function puffSprite(col, v) {
  const key = col.join(",") + "|" + v;
  let s = puffCache.get(key); if (s) return s;
  const N2 = PUFF_RES, c2 = document.createElement("canvas"); c2.width = c2.height = N2;
  const g = c2.getContext("2d"), img = g.createImageData(N2, N2), d = img.data, B = puffBase[v];
  for (let o = 0; o < N2 * N2; o++) {
    const sh = B.shade[o]; d[o * 4] = Math.min(255, col[0] * sh); d[o * 4 + 1] = Math.min(255, col[1] * sh); d[o * 4 + 2] = Math.min(255, col[2] * sh); d[o * 4 + 3] = B.dens[o] * 255;
  }
  g.putImageData(img, 0, 0);
  s = c2; if (puffCache.size > 400) puffCache.clear(); puffCache.set(key, s); return s;
}
const puffShadow = (() => {
  const N2 = 32, c2 = document.createElement("canvas"); c2.width = c2.height = N2; const g = c2.getContext("2d");
  const gr = g.createRadialGradient(N2 / 2, N2 / 2, 0, N2 / 2, N2 / 2, N2 / 2); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, N2, N2); return c2;
})();
const quant = c => c.map(x => Math.round(x / 12) * 12);
function drawParts(T) {
  if (PARTS.length > 1200 && !replay) { let w = 0; for (const P of PARTS) if (P.life > 100 || T - P.t0 <= 25) PARTS[w++] = P; PARTS.length = w; }
  const puffs = [], px1 = 1 / cam.zoom;          // one CSS pixel in map units
  for (const P of PARTS) {
    const age = T - P.t0; if (age < 0 || age > P.life) continue;
    const f = (1 - Math.exp(-P.drag * age)) / P.drag, x = P.x + P.vx * f, y = P.y + P.vy * f, u = age / P.life;
    if (P.kind === "pixel") {                      // debris stays on the track as single (screen) pixels
      ctx.globalAlpha = 1; ctx.fillStyle = P.col; ctx.fillRect(x, y, px1, px1); continue;
    }
    if (P.kind === "spark") {                    // a hot streak along its flight, brighter where it glows
      const e = Math.exp(-P.drag * age), vx = P.vx * e, vy = P.vy * e, k = 0.022;
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = u < 0.55 ? 1 : (1 - u) / 0.45; ctx.strokeStyle = P.col; ctx.lineWidth = Math.max(px1 * 1.1, 0.22);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - vx * k, y - vy * k); ctx.stroke(); ctx.globalCompositeOperation = "source-over"; continue; }
    if (P.kind === "puff") { puffs.push([P, x, y, age, u]); continue; }
    const r = P.size + P.grow * age;
    ctx.globalAlpha = 1 - u; ctx.fillStyle = P.col; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // shadows first (on the ground), then the puffs themselves
  for (const [P, x, y, age, u] of puffs) {
    const r = P.size + P.grow * Math.sqrt(age) * 1.2, hgt = (P.rise || 0) * age, a = (P.op || 0.5) * Math.min(1, age * 8) * Math.pow(1 - u, 1.4);
    ctx.globalAlpha = a * 0.13 * SUNK; ctx.drawImage(puffShadow, x + hgt * 0.55 - r * 1.1, y + hgt * 0.85 - r * 1.1, r * 2.2, r * 2.2);
  }
  for (const [P, x, y, age, u] of puffs) {
    const r = P.size + P.grow * Math.sqrt(age) * 1.2, a = (P.op || 0.5) * Math.min(1, age * 8) * Math.pow(1 - u, 1.4);
    const col = Array.isArray(P.col) ? quant(P.col) : [200, 200, 200];
    ctx.save(); ctx.translate(x, y); ctx.rotate(P.rot); ctx.globalAlpha = a;
    ctx.drawImage(puffSprite(col, P.v), -r, -r, r * 2, r * 2); ctx.restore();
  }
  ctx.globalAlpha = 1;
}
// ---------- tyre marks in the gravel (time-stamped like the particles, so replays show them building up) ----------
const WHEELS = [[0.36, 0.40], [0.36, -0.40], [-0.36, 0.40], [-0.36, -0.40]];   // (along, across) as fractions of car length / width
function tyreMarks(c) {
  if (c.pit || c.gar || (c.dnf && !c.inc)) { c.wPrev = null; return; }
  const q = carPos(c), hd = dispHead(c), L = CAR_LEN_M / M_PER_PX, W = CAR_W_M / M_PER_PX, ch = Math.cos(hd), sh = Math.sin(hd);
  const pts = WHEELS.map(([a, b]) => ({ x: q.x + ch * a * L - sh * b * W, y: q.y + sh * a * L + ch * b * W }));
  if (c.wPrev) pts.forEach((p, k) => {
    const o = c.wPrev[k]; if (!o) return;
    const d = Math.hypot(p.x - o.x, p.y - o.y); if (d < 0.8) { pts[k] = o; return; }
    if (d < 12) { const s = surfaceAt(p);
      if (s.type === "gravel" && surfaceAt(o).type === "gravel")          // ruts dug in the gravel
        MARKS.push({ t0: simClock, x1: o.x, y1: o.y, x2: p.x, y2: p.y, col: "rgb(92,80,68)", w: 1.7 });                    // grey-brown ruts
      else if (c.lock && c.lock.w.includes(k) && s.type !== "grass")    // black rubber streak from a locked tyre
        RMARKS.push({ t0: simClock, x1: o.x, y1: o.y, x2: p.x, y2: p.y, col: `rgba(18,18,20,${(0.07 + 0.06 * Math.min(1, c.lock.t / 0.25)).toFixed(2)})`, w: 0.8 }); }
  });
  c.wPrev = pts;
  if (MARKS.length > 12000) MARKS.splice(0, MARKS.length - 12000);
  if (RMARKS.length > 3000) RMARKS.splice(0, RMARKS.length - 3000);
}
function drawMarks(T) {
  drawMarkList(RMARKS, T); drawMarkList(MARKS, T);
}
function drawMarkList(MARKS, T) {
  if (!MARKS.length) return;
  ctx.lineCap = "square"; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.85;
  let cur = null; ctx.beginPath();
  for (const m of MARKS) {
    if (m.t0 > T) break;
    const key = m.col + (m.w || 1.1);
    if (key !== cur) { if (cur) ctx.stroke(); ctx.beginPath(); cur = key; ctx.strokeStyle = m.col; ctx.lineWidth = m.w || 1.1; }
    ctx.moveTo(m.x1, m.y1); ctx.lineTo(m.x2, m.y2);
  }
  if (cur) ctx.stroke();
  ctx.globalAlpha = 1;
}
const dispHead = c => c.head + (c.wobA ? c.wobA * Math.sin(c.wobT * 9) * Math.exp(-c.wobT * 2.2) : 0);

// soft drop shadows: silhouette rendered small and scaled up (cheap blur that works in every browser)
function makeShadow(img) {
  const w = img.naturalWidth || img.width, hgt = img.naturalHeight || img.height, sm = document.createElement("canvas");
  sm.width = Math.max(8, Math.round(w / 9)); sm.height = Math.max(4, Math.round(hgt / 9));
  const g = sm.getContext("2d"); g.drawImage(img, 0, 0, sm.width, sm.height);
  g.globalCompositeOperation = "source-in"; g.fillStyle = "#000"; g.fillRect(0, 0, sm.width, sm.height);
  const pad = 0.18, big = document.createElement("canvas"); big.width = Math.round(w / 3 * (1 + pad * 2)); big.height = Math.round(hgt / 3 * (1 + pad * 2 * w / hgt * 0.5));
  const b = big.getContext("2d"); b.imageSmoothingEnabled = true; b.imageSmoothingQuality = "high";
  const ox = big.width * pad / (1 + pad * 2), oy = (big.height - hgt / 3) / 2;
  b.drawImage(sm, ox, oy, big.width - ox * 2, hgt / 3);
  return { cv: big, sx: big.width / (big.width - ox * 2), sy: big.height / (hgt / 3) };
}
const SUN = { x: 0.9, y: 1.4 };              // shadow offset in metres (sun from the top-left of the map)
function drawShadow(sh, x, y, head, L, W, alpha) {
  if (!sh) return;
  ctx.save(); ctx.translate(x + SUN.x / M_PER_PX, y + SUN.y / M_PER_PX); ctx.rotate(head);
  ctx.globalAlpha = alpha * SUNK; ctx.drawImage(sh.cv, -L * sh.sx / 2, -W * sh.sy / 2, L * sh.sx, W * sh.sy);
  ctx.restore(); ctx.globalAlpha = 1;
}

// ---------- flag light panels around the circuit ----------
// green flashing = racing, yellow flashing = incident on track, steady yellow = safety car, steady red = red flag
let RED_FLAG = false;                           // no red-flag procedure yet: set to true to show red on every panel
function flagState() {
  if (RED_FLAG) return "red";
  if (scActive()) return "sc";
  if (cars.some(c => c.inc && !c.done) || simClock < YELLOW_UNTIL) return "yellow";
  return "green";
}
const FLAG_COL = { green: [57, 255, 106], yellow: [255, 210, 31], sc: [255, 210, 31], red: [255, 42, 60] };
function drawMarshal() {
  const st = flagState(), col = FLAG_COL[st], t = performance.now() / 1000;
  const on = st === "sc" || st === "red" ? true : Math.floor(t * 2.6) % 2 === 0;
  const S = Math.max(2.5, 3.5 / cam.zoom), h = S / 2, core = S * 0.62;
  for (const [x, y] of MARSHAL) {
    ctx.globalAlpha = 1; ctx.fillStyle = "#15181c"; ctx.fillRect(x - h, y - h, S, S);
    ctx.fillStyle = "#3a3f46"; ctx.fillRect(x - h, y - h, S, S * 0.14);
    if (on) {
      const r = S * 2.2, g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.55)`); g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
    } else ctx.fillStyle = `rgb(${col[0] * 0.22 | 0},${col[1] * 0.22 | 0},${col[2] * 0.22 | 0})`;
    ctx.fillRect(x - core / 2, y - core / 2, core, core);
  }
  ctx.globalAlpha = 1;
}

// ---------- incidents: off-tracks, spins, crashes, contact ----------
// chance per lap (spread evenly over the corners, rolled with the pace in use at each corner)
const INCIDENT = { agg: { off: 0.15, spin: 0.03, wall: 0.01 }, bal: { off: 0.03, spin: 0.004, wall: 0.001 }, soft: { off: 0.01, spin: 0.001, wall: 0.0003 } };
const turnOut = new Float32Array(N);          // +1 / -1: which side of the race line is the outside of the bend
for (let i = 0; i < N; i++) {
  const a = (i - 6 + N) % N, b = (i + 6) % N, a2 = (a + 1) % N, b2 = (b + 1) % N;
  const t1x = RL.x[a2] - RL.x[a], t1y = RL.y[a2] - RL.y[a], t2x = RL.x[b2] - RL.x[b], t2y = RL.y[b2] - RL.y[b];
  turnOut[i] = (t1x * t2y - t1y * t2x) > 0 ? -1 : 1;
}
function limAt(i, side) {                       // metres from the race line to the track edge / wall on that side
  const e = (side > 0 ? LIM.eP[i] : LIM.eM[i]) * M_PER_PX, w = side > 0 ? LIM.wP[i] : LIM.wM[i];
  return { edge: e, wall: w < 0 ? null : w * M_PER_PX };
}
function toast(text, bad) {
  const t = $("toast"); t.textContent = text; t.className = "toast" + (bad === "good" ? " good" : bad ? " bad" : ""); t.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3500);
}
function rollIncident(c) {
  if (c.pit || c.gar || !c.started || scActive() || (SES && !timed(c))) return;
  if (c.nextC == null) c.nextC = CORNER_S.findIndex(cs => cs - 40 > c.s);
  if (c.nextC < 0) { if (c.s < 50) c.nextC = 0; return; }
  const trig = CORNER_S[c.nextC] - 40;
  if (c.s < trig || c.s > trig + 80) return;
  c.nextC = (c.nextC + 1) % CORNER_S.length;
  if (c.nextC === 0) c.nextC = -1;              // wait for the next lap
  const wr = wetRisk(c), P = INCIDENT[c.pace], nC = CORNER_S.length, f = (c.ai ? 0.3 : 1) * wr * (SES ? 0.3 : 1), fo = (c.ai ? 0.8 : 1.3) * wr * (SES ? 0.5 : 1);   // run-offs are common, big mistakes rare
  const per = (q, ff = f) => 1 - Math.pow(1 - q * ff, 1 / nC);
  const r = Math.random();
  let type = null;
  if (r < per(P.wall)) type = "wall"; else if (r < per(P.wall) + per(P.spin)) type = "spin"; else if (r < per(P.wall) + per(P.spin) + per(P.off, fo)) type = "off";
  if (!type) return;
  const i = idxAt(c.s), side = turnOut[(i + 8) % N], L = limAt(i, side);
  if (type === "wall" && !L.wall) type = "spin";            // no wall on the outside here: ends in the gravel
  startIncident(c, type);
}
function startIncident(c, type, why) {
  const i = idxAt(c.s), side = turnOut[(i + 8) % N];
  if (type === "off" && Math.random() < 0.25) aeroHit(c, ["FLL", "FLR", "DIF", "FWL", "FWR"], 0.2 + Math.random() * 0.35);
  if (type === "spin" && Math.random() < 0.5) aeroHit(c, ["DIF", "RW", "FLL", "FLR"], 0.3 + Math.random() * 0.4);
  c.launch = null;
  if (SES && timed(c) && type !== "off" || SES && type === "off" && !c.lapInv) { c.lapInv = true; }
  c.inc = { type, d: 0, side, lat0: c.lat, head0: c.head, t0: c.total, slip: 0, yaw: 0, prevLat: c.lat };
  const label = why || { off: "Salida de pista", spin: "¡Trompo!", wall: "¡Accidente contra el muro!" }[type];
  if (c.ai && type === "off" && !why) return;     // a rival running wide: not worth a message
  if (!c.ai && (type === "spin" || type === "wall")) radioEvent(c, type);
  toast(`${c.code} · ${label}`, type !== "off");
  if (OPT.replays && !replay && !pendingReplay && !(SES && SES.spd >= 2)) pendingReplay = { idx: c.idx, label: `${c.code} · ${label}`, tInc: simClock, until: simClock + (type === "off" ? 5 : 4) };
}
function puncture(c) {
  c.punctW = (Math.random() * 4) | 0; c.punct = true; c.pitReq = true; if (c.ai) c.nextComp = aiComp(c, Math.max(0, RACE_LAPS - (c.lap - 1) - c.s / LAP_M)); ui[c.idx]?.syncPit();
  toast(`${c.code} · ¡Pinchazo! Entra a boxes`, true); radioEvent(c, "punct");
}
function incidentSpeed(c) {
  let m = (c.slow ? c.slow.k : 1) * (c.punct ? 0.6 : 1);
  const I = c.inc; if (!I) return m;
  if (I.type === "off") return m * (1 - 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, I.d / 150)), 0.7));
  if (I.type === "spin") return Math.max(0.06, 1 - I.d / 50);
  if (I.type === "wall") return I.impact != null ? 0 : Math.max(0.5, 1 - I.d / 140);
  return m;
}
const ease = x => x * x * (3 - 2 * x), easeOut = (x, p = 2) => 1 - Math.pow(1 - x, p);
function stepIncident(c, ds, h) {
  const I = c.inc; I.d += ds;
  const i = idxAt(c.s), L = limAt(i, I.side), pos = carPos(c);
  const runoff = L.wall ? Math.max(L.edge + 2, L.wall - 4.5) : L.edge + 14;   // how far into the run-off a car can go
  const offTrack = Math.abs(c.lat) > L.edge;
  if (I.type === "off") {
    const D = 170, x = Math.min(1, I.d / D), bell = Math.pow(Math.sin(Math.PI * x), 1.15);
    const peak = I.side * Math.min(runoff, L.edge + 6.5);
    c.lat = I.lat0 * (1 - ease(x)) + peak * bell;
    I.yaw = I.side * 0.32 * Math.sin(Math.PI * 2 * x) * (1 - x);            // catches the slide, then straightens
    if (offTrack && surfaceAt(pos).type === "gravel") dustAt(c, 1, null, 40, h, "gravel", W_ALL);
    if (I.d >= D) { if (!c.ai) toast(`${c.code} vuelve a pista · −${Math.max(0.3, I.lost || 0).toFixed(1)} s`, false); c.inc = null; c.kick = 0; return; }
  } else if (I.type === "spin") {
    const D = 58, x = Math.min(1, I.d / D);
    c.lat = I.lat0 + (I.side * Math.min(runoff, L.edge + 8) - I.lat0) * easeOut(x, 2.2);
    I.yaw = I.side * 2.25 * Math.PI * easeOut(x, 2.6);                       // rotation slows down as it scrubs speed
    dustAt(c, 1, null, offTrack ? 50 : 30, h, null, W_ALL);
    if (I.d >= D - 0.5) { c.dnf = true; c.done = true; c.vNow = 0; c.dnfWhy = "Trompo, atascado en la grava"; toast(`${c.code} · Abandono: atascado en la grava`, true); deploySC(); checkEnd(); return; }
  } else if (I.type === "wall") {
    if (I.impact == null) {
      const D = 75, x = Math.min(1, I.d / D);
      c.lat = I.lat0 + (I.side * (L.wall - 1.3) - I.lat0) * Math.pow(x, 1.7);
      I.yaw = I.side * 0.55 * Math.pow(x, 1.4);
      if (offTrack && surfaceAt(pos).type === "gravel") dustAt(c, 1, null, 40, h, "gravel", W_ALL);
      if (x >= 1) { I.impact = 0; I.vImp = c.vNow; I.latImp = c.lat; I.yawImp = I.yaw; burst(pos, c.vNow, [c.idx]); }
    } else {
      I.impact += h; const y = Math.min(1, I.impact / 1.1);
      c.lat = I.latImp - I.side * 2.6 * easeOut(y, 2.5);                     // bounces off the barrier
      I.yaw = I.yawImp + I.side * 1.1 * easeOut(y, 2.2);
      c.s += I.vImp * 0.22 * (1 - y) * h * 2; c.vNow = I.vImp * 0.22 * (1 - y);
      if (y < 0.3) dustAt(c, 1, null, 20, h, "asphalt", W_ALL);
      if (y >= 1) { c.dnf = true; c.done = true; c.vNow = 0; c.dnfWhy = "Accidente contra el muro"; I.crashed = true; toast(`${c.code} · Abandono: accidente`, true); deploySC(); checkEnd(); return; }
    }
  }
  // body slip angle follows the lateral motion
  if (ds > 0.02) { const tgt = Math.atan2(c.lat - I.prevLat, ds); I.slip += (tgt - I.slip) * Math.min(1, h * 10); }
  I.prevLat = c.lat;
}
// contact between the two cars when they fight side by side through a corner
let contactCD = 0;
function checkContact(h) {
  contactCD = Math.max(0, contactCD - h);
  cars.forEach(c => { if (c.slow) { c.slow.d -= h; if (c.slow.d <= 0) c.slow = null; } });
  if (contactCD > 0 || scActive()) return;
  const act = cars.filter(c => c.started && !c.done && !c.inc && !c.pit && !c.gar);
  for (let x = 0; x < act.length; x++) for (let y = x + 1; y < act.length; y++) {
  const a = act[x], b = act[y];
  const gap = Math.abs(sgap(b.s - a.s));
  if (gap > 12) continue;
  if (straight[idxAt(a.s)] > 0.5) continue;
  if (gap > CAR_LEN_M * 0.8 || Math.abs(a.lat - b.lat) > CAR_W_M + 1.0) continue;    // only wheel to wheel
  const rate = 0.05 * (1 + (a.pace === "agg" ? 1.5 : 0) + (b.pace === "agg" ? 1.5 : 0)) * (a.pace === "soft" && b.pace === "soft" ? 0.4 : 1) * (a.ai && b.ai ? 0.4 : 1) * 0.5;
  if (Math.random() < rate * h * (SES ? 0.2 : 1)) {
    contactCD = 20;
    a.slow = { k: 0.8, d: 1.2 + Math.random() * 1.2 }; b.slow = { k: 0.84, d: 1.0 + Math.random() };
    const sa = a.lat < b.lat ? -1 : 1;              // push them apart smoothly, with a twitch of the steering
    a.kick = sa * 1.5; b.kick = -sa * 1.5; a.wobT = 0; b.wobT = 0; a.wobA = 0.09 * sa; b.wobA = -0.09 * sa;
    const pa = carPos(a), pb = carPos(b), mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }; a.lastHit = b.lastHit = null;
    sparks(mid, 26); debris(mid, 46, Math.max(a.vNow, b.vNow), [a.idx, b.idx]);                 // small carbon pieces on the track
    { // where they touched decides what breaks (lateral + is right of travel)
      const along = sgap(b.s - a.s), Lp = ["FWL", "BGL", "SPL", "FLL"], Rp = ["FWR", "BGR", "SPR", "FLR"];
      if (Math.abs(along) < CAR_LEN_M * 0.45) {           // side by side
        const aLeft = a.lat < b.lat;
        if (Math.random() < 0.6) aeroHit(a, aLeft ? Rp : Lp, 0.3 + Math.random() * 0.45);
        if (Math.random() < 0.6) aeroHit(b, aLeft ? Lp : Rp, 0.3 + Math.random() * 0.45);
      } else {                                             // nose into the gearbox
        const back = along > 0 ? a : b, front = back === a ? b : a, backLeft = back.lat < front.lat;
        if (Math.random() < 0.75) aeroHit(back, [backLeft ? "FWR" : "FWL"], 0.4 + Math.random() * 0.5);
        if (Math.random() < 0.35) aeroHit(front, ["DIF", "RW", backLeft ? "FLL" : "FLR"], 0.3 + Math.random() * 0.4);
      }
    }
    [a, b].forEach(x => { if (!x.ai) radioEvent(x, "contact", { o: (x === a ? b : a).name, p: x.lastHit }); });
    const yellow = Math.random() < 0.7; if (yellow) YELLOW_UNTIL = simClock + 6 + Math.random() * 5;
    if (Math.random() < 0.35) {                      // the touch sends one of them off the track
      const v = Math.random() < 0.5 ? a : b;
      startIncident(v, "off", `Contacto con ${(v === a ? b : a).code} y salida de pista`);
    } else toast(`Contacto ${a.code} – ${b.code}` + (yellow ? " · Bandera amarilla" : ""), true);
    return;
  }
  }
}
function drawLimits() {
  const side = (arr, sgn, col, w, wallMode) => {
    ctx.strokeStyle = col; ctx.lineWidth = w / cam.zoom; ctx.beginPath(); let pen = false;
    for (let k = 0; k <= N; k++) {
      const i = k % N, o = arr[i];
      if (o < 0) { pen = false; continue; }
      const j = (i + 1) % N, tx = RL.x[j] - RL.x[(i - 1 + N) % N], ty = RL.y[j] - RL.y[(i - 1 + N) % N], l = Math.hypot(tx, ty);
      const x = RL.x[i] + sgn * (-ty / l) * o, y = RL.y[i] + sgn * (tx / l) * o;
      if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
    }
    ctx.stroke();
  };
  ctx.globalAlpha = 0.95;
  side(LIM.eP, 1, "#ffffff", 2, false); side(LIM.eM, -1, "#ffffff", 2, false);
  side(LIM.wP, 1, "#ff2a3c", 3, true); side(LIM.wM, -1, "#ff2a3c", 3, true);
  // pit lane: light red = entry/exit, dark red = 80 km/h limit, yellow = garages
  ctx.lineWidth = 3 / cam.zoom;
  [[0, PIT.limStart, "#ff4d5a"], [PIT.limStart, PIT.limEnd, "#8e0f1d"], [PIT.limEnd, PIT.len, "#ff4d5a"]].forEach(([a, b, col]) => {
    ctx.strokeStyle = col; ctx.beginPath();
    for (let d = a; d <= b; d += 3) { const q = pitPoint(d); if (d === a) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); }
    ctx.stroke();
  });
  PIT.boxes.forEach((b, k) => { const t = DRIVERS.find(d => d.box === k); ctx.fillStyle = t ? t.col : "#ffd21f"; ctx.fillRect(b.x - 3, b.y - 3, 6, 6); });
  ctx.globalAlpha = 1;
}

// lateral position (m, + = left of travel): small lap-to-lap line variation, plus side-by-side room when the cars are close
const WANDER = { soft: 0.4, bal: 0.6, agg: 0.9 };
const START_STRAIGHT = 90;          // metres every car runs dead straight after the lights go out
function latLimits(c) {                      // where the car's centre may go: inside the white lines, using the kerbs
  const i = idxAt(c.s), hw = CAR_W_M / 2 + 0.15;
  return [-(LIM.eM[i] * M_PER_PX - hw), LIM.eP[i] * M_PER_PX - hw];
}
function latTarget(c) {
  const [lo, hi] = latLimits(c), cl = x => Math.max(lo, Math.min(hi, x));
  if (scActive() && c.scQueued) return cl(2.0 * Math.sin(simClock * 2.6 + c.idx * 1.9));   // weaving to warm the tyres
  if (SES && !timed(c)) {                                   // a slow lap: move right over for any car on a timed lap behind
    for (const o of cars) {
      if (o === c || o.gar || o.pit || o.done || !timed(o)) continue;
      const g = sgap(o.s - c.s); if (g > -2 || g < -120) continue;
      c.yieldT = 1.2; return cl((c.lat >= o.lat ? 1 : -1) * 12);
    }
  }
  const ph = (c.lap * 1.7 + c.idx * 2.3), u = c.s / LAP_M * Math.PI * 2;
  let t = cl(WANDER[c.pace] * (0.6 * Math.sin(u * 7 + ph) + 0.4 * Math.sin(u * 3 + ph * 1.9)));
  const yellow = flagState() === "yellow";
  for (const o of cars) {
    if (o === c || o.pit || o.gar || o.gone || (o.done && !o.dnf)) continue;
    const g = sgap(o.s - c.s), gap = Math.abs(g);
    if (gap >= 34) continue;
    const still = o.done || o.vNow < 2;                       // a stopped car has to be driven around
    if (still && (g < -2 || Math.abs(o.lat) > limAt(idxAt(o.s), Math.sign(o.lat) || 1).edge + 0.8)) continue;   // behind us, or off the track: not in the way
    const w = gap < 14 ? 1 : (34 - gap) / 20;
    let want;
    if (yellow && !still) { if (g <= 0) continue; want = o.lat; }      // yellow flag: no overtaking, stay in line
    else {
      let side = Math.sign(c.lat - o.lat) || (c.idx < o.idx ? -1 : 1);   // keep the side it is already on
      if (still) side = hi - o.lat >= o.lat - lo ? 1 : -1;               // a stopped car: pass on the side with more room
      want = cl(o.lat + side * (CAR_W_M + CAR_SIDE_M + 0.7));
    }
    t = t * (1 - w) + want * w;
  }
  return t;
}
function checkEnd() {
  if (SES) return;
  if (!cars.every(c => c.done)) return;
  finishRace();
}

// ---------- weather (slow drift, the same for everybody) ----------
// ---------- WEATHER: states, the race timeline, the water on the track ----------
const WX_STATES = [
  { id: "sun", name: "Soleado", R: 0, cloud: 10, col: "#ffd21f" },
  { id: "cloud", name: "Nublado", R: 0, cloud: 86, col: "#a7b1be" },
  { id: "light", name: "Lluvia ligera", R: 0.35, cloud: 95, col: "#5cb4ff" },
  { id: "heavy", name: "Lluvia intensa", R: 1, cloud: 100, col: "#2f6bff" }];
const WX_EVO = ["Estable", "Cambiante", "Muy cambiante"];
const WX_NEXT = [[0, 0.82, 0.18, 0], [0.32, 0, 0.5, 0.18], [0.18, 0.45, 0, 0.37], [0, 0.2, 0.8, 0]];   // chance of each next state
const WX_RAMP = 110;                                   // s of race time for a change to build up or die away
var WXSET = WXSET || { start: 0, evo: 1, seed: (Math.random() * 1e9) | 0 };   // menu choice: starting sky, evolution, forecast seed
var WXPLAN = WXPLAN || [{ t: 0, s: 0 }];                // [{t (s of race time), s (state)}]
var WATER = WATER || { W: 0, dl: 0 };                   // water film on the track (0-1) and how much of it the racing line has cleared (0-1)
var FC = FC || null;                                   // forecast per lap: water on the racing line, rain, sky
var WX_T0 = WX_T0 || 0, SUNK = 1;
const LAP_T0 = (() => { let t = 0; for (let i = 0; i < N; i++) t += (cum[i + 1] - cum[i]) / RL.v[i]; return t; })();
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function wxPlan(set, laps) {
  const r = rng(set.seed), T = laps * LAP_T0 * 1.12 + 600, plan = [{ t: 0, s: set.start }];
  if (set.evo === 0) return plan;
  const [f0, f1, d0, d1] = set.evo === 1 ? [0.2, 0.48, 420, 1100] : [0.1, 0.28, 220, 620];
  let t = Math.min(Math.max(set.evo === 1 ? 260 : 170, T * (f0 + r() * (f1 - f0))), T * 0.6), s = set.start;
  while (t < T) {
    const p = WX_NEXT[s]; let x = r(), n = 0; while (n < 3 && x > p[n]) { x -= p[n]; n++; }
    if (n === s) n = (s + 1) % 4;
    plan.push({ t, s: n }); s = n; t += d0 + r() * (d1 - d0);
  }
  return plan;
}
function wxAt(t, plan = WXPLAN) {                       // rain intensity (0-1+), cloud cover and sky at a race time
  let k = 0; while (k + 1 < plan.length && plan[k + 1].t <= t) k++;
  const cur = WX_STATES[plan[k].s], prev = k ? WX_STATES[plan[k - 1].s] : cur;
  const u = k ? Math.min(1, (t - plan[k].t) / WX_RAMP) : 1, e = u * u * (3 - 2 * u);
  let R = prev.R + (cur.R - prev.R) * e;
  if (R > 0) R *= 0.86 + 0.14 * Math.sin(t * 0.031 + WXSET.seed % 97) + 0.08 * Math.sin(t * 0.17 + 1.3);   // showers come and go
  return { R: Math.max(0, Math.min(1.15, R)), cloud: prev.cloud + (cur.cloud - prev.cloud) * Math.min(1, e * 1.6), s: e > 0.5 ? plan[k].s : prev === cur ? plan[k].s : plan[k - 1].s };
}
var WX_SEED = WX_SEED || Math.random() * 1000;
var WXH = WXH || [];                              // track temperature history (one sample every 20 s of race time)
function weather(t) {
  const rt = t - WX_T0, u = t / 60 + WX_SEED, n = (a, b) => Math.sin(u * a + b + WX_SEED), A = wxAt(rt);
  const cloud = Math.max(0, Math.min(100, A.cloud + 4 * n(0.13, 2)));
  const air = 24.2 + 1.4 * n(0.012, 3) + 0.4 * n(0.09, 4) - cloud * 0.03 - A.R * 2.5;
  const track = air + 4 + 15 * (1 - cloud / 100) - 9 * WATER.W + 0.6 * n(0.05, 5);
  const wind = Math.max(0.4, 3.1 + 1.2 * n(0.07, 6) + A.R * 2.2 + 0.9 * Math.sin(t * 0.21) * Math.sin(t * 0.047));
  const dir = (205 + 25 * n(0.02, 7) + 360) % 360;
  let maxR = 0; for (let d = 0; d <= 1800; d += 60) maxR = Math.max(maxR, wxAt(rt + d).R);   // chance of rain in the next 30 min
  return { cloud, air, track, wind, dir, R: A.R, s: A.s, hum: Math.min(99, 44 + 8 * n(0.017, 8) + cloud * 0.12 + A.R * 30), press: 1013.6 + 1.2 * n(0.008, 9) - cloud * 0.05,
           rain: A.R > 0.05 ? 100 : Math.round(Math.min(95, 4 + maxR * 160)), sky: WX_STATES[A.s].name };
}
let WXC = weather(0);
// water: rain fills the film, sun / wind / warm asphalt dry it; the cars clear a dry line, rain washes it away again
function stepWater(h) {
  const R = WXC.R, sun = 1 - WXC.cloud / 100, warm = Math.max(0, WXC.track - 12) / 25;
  const dry = (0.0018 + 0.004 * sun + 0.0008 * WXC.wind + 0.0016 * warm) * Math.max(0, 1 - R * 2.4);
  WATER.W = Math.max(0, Math.min(1, WATER.W + (R * (1 - WATER.W) / 70 - WATER.W * dry) * h));
  let traffic = 0; for (const c of cars) if (c.started && !c.done && !c.pit && !c.gar) traffic++;
  traffic /= cars.length;
  WATER.dl = Math.max(0, Math.min(1, WATER.dl + ((WATER.W > 0.015 ? traffic * 0.012 : 0.03) * (1 - WATER.dl) - Math.min(1, R) * 0.02 * WATER.dl) * h));
}
const lineWet = () => WATER.W * (1 - WATER.dl);                // water left on the racing line
function carWet(c) {                                         // water under a car: off the line it is wetter
  if (WATER.W < 0.003) return 0;
  const on = c.pit ? 0.75 : Math.max(0, 1 - Math.abs(c.lat || 0) / 3.4);
  return WATER.W * (1 - WATER.dl * on);
}
function wxForecast(laps, W0, plan = WXPLAN, dl0 = 0) {      // the same water model, lap by lap, for the strategists
  const out = { wl: [0], R: [0], s: [plan[0].s] };
  let W = W0, dl = dl0, t = 0;
  for (let l = 1; l <= laps; l++) {
    let el = 0, aw = 0, ar = 0, n = 0; const cnt = [0, 0, 0, 0];
    while (el < LAP_T0 * 1.05 * (1 + 0.12 * W * (1 - dl))) {
      const A = wxAt(t, plan), R = A.R, sun = 1 - A.cloud / 100, warm = Math.max(0, 16 + 15 * sun - 9 * W - 12) / 25;
      const dry = (0.0018 + 0.004 * sun + 0.0008 * (3.1 + 2.2 * R) + 0.0016 * warm) * Math.max(0, 1 - R * 2.4);
      W = Math.max(0, Math.min(1, W + (R * (1 - W) / 70 - W * dry) * 2));
      dl = Math.max(0, Math.min(1, dl + ((W > 0.015 ? 0.012 : 0.03) * (1 - dl) - Math.min(1, R) * 0.02 * dl) * 2));
      aw += W * (1 - dl); ar += R; n++; cnt[A.s]++; el += 2; t += 2;
    }
    out.wl.push(aw / n); out.R.push(ar / n); out.s.push(cnt.indexOf(Math.max(...cnt)));
  }
  return out;
}
// tyres in the wet: slicks lose grip fast, intermediates suit a damp / wet track, full wets standing water
const tyreClass = k => k === "I" || k === "W" ? k : "D";
const idealClass = w => w < 0.13 ? "D" : w < 0.55 ? "I" : "W";
const WET_LOSS = { D: w => 0.36 * Math.pow(w, 1.4),
  I: w => w < 0.45 ? 0.040 * (1 - w / 0.45) ** 2 : 0.25 * (w - 0.45) ** 1.5,
  W: w => w < 0.85 ? 0.075 * (1 - w / 0.85) ** 2 : 0.05 * (w - 0.85) };
const wetLoss = (comp, w) => 0.16 * w + WET_LOSS[tyreClass(comp)](w);          // fraction of speed lost
const wetWear = (comp, w) => comp === "I" ? 1 + 4 * Math.max(0, 0.3 - w) : comp === "W" ? 1 + 6 * Math.max(0, 0.5 - w) : 1 - 0.5 * w;   // rain tyres overheat on a drying track
const wetRisk = c => { const w = c.wl || 0, k = tyreClass(c.comp); return k === "D" ? 1 + 16 * Math.max(0, w - 0.1) : k === "I" ? 1 + 0.8 * w + 6 * Math.max(0, w - 0.6) : 1 + 0.9 * w; };
function wxReset() {
  WX_T0 = simClock; WXPLAN = wxPlan(WXSET, RACE_LAPS);
  const s0 = WX_STATES[WXSET.start]; WATER.W = s0.R >= 1 ? 0.95 : s0.R > 0 ? 0.7 : 0; WATER.dl = s0.R > 0 ? 0.25 : 0;
  FC = wxForecast(RACE_LAPS, WATER.W, WXPLAN, WATER.dl); WXC = weather(simClock);
  WX_NOTE.s = WXC.s; WX_NOTE.cls = idealClass(lineWet()); WX_NOTE.t = 0; WX_NOTE.sc = false;
  SPRAY.length = 0; if (WET.ready) wetClear();
  cars.forEach(c => {                                  // the rivals start on the right tyres for the conditions
    c.wxDelay = 3 + Math.random() * 24; c.wxBias = (Math.random() - 0.5) * 0.06; c.wl = carWet(c);
    if (c.ai && idealClass(FC.wl[1]) !== "D") { c.comp = c.nextComp = idealClass(FC.wl[1]); c.stints = [{ c: c.comp, a: 0 }]; newTyres(c, c.comp); }
  });
}
// weather messages, and a safety car when the rain is too heavy
var WX_NOTE = WX_NOTE || { s: 0, cls: "D", t: 0, sc: false, heavyT: -1 };
function wxNotes() {
  if (!racing()) return;
  if (WXC.s !== WX_NOTE.s) {
    const up = WXC.s > WX_NOTE.s, m = ["Sale el sol", "Cielo cubierto", up ? "Empieza a llover" : "La lluvia afloja", "Lluvia intensa"][WXC.s];
    toast("METEO · " + m, WXC.s >= 2 && up); WX_NOTE.s = WXC.s;
  }
  const cls = idealClass(lineWet());
  if (cls !== WX_NOTE.cls) { WX_NOTE.t += 0.016; if (WX_NOTE.t > 2.5) { WX_NOTE.cls = cls; WX_NOTE.t = 0;
    toast(cls === "D" ? "Línea seca · neumáticos de seco" : cls === "I" ? "Pista mojada · intermedios" : "Agua en pista · neumáticos de lluvia", false); } }
  else WX_NOTE.t = 0;
  if (WXC.R > 0.95 && lineWet() > 0.62) { if (WX_NOTE.heavyT < 0) WX_NOTE.heavyT = simClock; } else WX_NOTE.heavyT = -1;
  if (WX_NOTE.heavyT >= 0 && simClock - WX_NOTE.heavyT > 60 && !WX_NOTE.sc && SC.state === "parked") { WX_NOTE.sc = true; deploySC(); setTimeout(() => toast("Safety car · lluvia intensa", true), 50); }
  if (WXC.R < 0.5) WX_NOTE.sc = false;
}
// ---------- wet track: the water film, the dry line the tyres clear, puddles ----------
const WET = { ready: false, S: 0.5, mask: null, tex: null, pud: null, dry: null, comp: null, segs: [], t: 0, W: -1, dirty: true, fade: 0 };
function mkCanvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
const BLOB = (() => { const c = mkCanvas(64, 64), g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; })();
function tintBlob(r, g, b) { const c = mkCanvas(64, 64), x = c.getContext("2d"); x.drawImage(BLOB, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(0, 0, 64, 64); return c; }
function trackPoint(i, off) { const j = (i + 1) % N, a = (i - 1 + N) % N, tx = RL.x[j] - RL.x[a], ty = RL.y[j] - RL.y[a], l = Math.hypot(tx, ty); return [RL.x[i] + (-ty / l) * off, RL.y[i] + (tx / l) * off, Math.atan2(ty, tx)]; }
function wetInit() {
  const S = WET.S, w = Math.round(MAP_W * S), h = Math.round(MAP_H * S);
  ["mask", "tex", "pud", "dry", "comp"].forEach(k => WET[k] = mkCanvas(w, h));
  const m = WET.mask.getContext("2d"); m.scale(S, S); m.fillStyle = "#fff";
  m.beginPath();                                       // the tarmac between the white lines (kerbs included), and the pit lane
  for (let i = 0; i < N; i++) { const [x, y] = trackPoint(i, LIM.eP[i] + 1.6); i ? m.lineTo(x, y) : m.moveTo(x, y); } m.closePath();
  for (let i = N - 1; i >= 0; i--) { const [x, y] = trackPoint(i, -(LIM.eM[i] + 1.6)); i === N - 1 ? m.moveTo(x, y) : m.lineTo(x, y); } m.closePath();
  m.fill("evenodd");
  m.strokeStyle = "#fff"; m.lineWidth = 11; m.lineCap = m.lineJoin = "round"; m.beginPath();
  for (let d = 0; d <= PIT.len; d += 3) { const q = pitPoint(d); d ? m.lineTo(q.x, q.y) : m.moveTo(q.x, q.y); } m.stroke();
  // wet tarmac: darker, with a soft sky sheen streaked along the direction of travel
  const t = WET.tex.getContext("2d"); t.fillStyle = "rgba(8,14,24,0.66)"; t.fillRect(0, 0, w, h);
  const sheen = tintBlob(176, 200, 228), dark = tintBlob(6, 12, 22), rim = tintBlob(214, 228, 244);
  t.save(); t.scale(S, S);
  for (let k = 0; k < 3600; k++) {
    const i = (Math.random() * N) | 0, off = (Math.random() * 2 - 1) * (Math.random() < 0.5 ? LIM.eP[i] : LIM.eM[i]), [x, y, hd] = trackPoint(i, off), L = 6 + Math.random() * 26, Wd = 2 + Math.random() * 4.5;
    t.save(); t.translate(x, y); t.rotate(hd); t.globalAlpha = 0.08 + Math.random() * 0.2; t.drawImage(sheen, -L / 2, -Wd / 2, L, Wd); t.restore();
  }
  t.restore(); t.globalCompositeOperation = "destination-in"; t.drawImage(WET.mask, 0, 0); t.globalCompositeOperation = "source-over";
  // standing water: puddles collect near the edges of the track
  const p = WET.pud.getContext("2d"); p.save(); p.scale(S, S);
  for (let k = 0; k < 170; k++) {
    const i = (Math.random() * N) | 0, side = Math.random() < 0.5 ? 1 : -1, e = side > 0 ? LIM.eP[i] : LIM.eM[i];
    const off = side * (Math.random() < 0.7 ? e - Math.random() * 4 : Math.random() * e), [x, y, hd] = trackPoint(i, off), L = 8 + Math.random() * 30, Wd = 3 + Math.random() * 7;
    const pr = hd + (Math.random() - 0.5) * 0.4; (WET.puds || (WET.puds = [])).push([x, y, pr, L, Wd]);
    p.save(); p.translate(x, y); p.rotate(pr);
    p.globalAlpha = 0.55; p.drawImage(dark, -L / 2, -Wd / 2, L, Wd);
    p.globalAlpha = 0.35; p.drawImage(rim, -L * 0.42, -Wd * 0.62, L * 0.7, Wd * 0.45);
    p.restore();
  }
  p.restore(); p.globalCompositeOperation = "destination-in"; p.drawImage(WET.mask, 0, 0); p.globalCompositeOperation = "source-over";
  WET.ready = true; WET.dirty = true;
}
function wetClear() { if (!WET.ready) return; WET.dry.getContext("2d").clearRect(0, 0, WET.dry.width, WET.dry.height); WET.segs.length = 0; WET.dirty = true; }
function dryLineStep(c) {                             // rear-wheel tracks: where the tyres push the water away
  const p = c.prevP;
  if (!WET.ready || WATER.W < 0.015 || c.done || c.gar || !p || (!c.started && !c.pit)) { c.dlp = null; return; }
  const hd = c.head, L = CAR_LEN_M / M_PER_PX, W = CAR_W_M / M_PER_PX, ch = Math.cos(hd), sh = Math.sin(hd);
  const x1 = p.x - ch * 0.36 * L - sh * 0.4 * W, y1 = p.y - sh * 0.36 * L + ch * 0.4 * W, x2 = p.x - ch * 0.36 * L + sh * 0.4 * W, y2 = p.y - sh * 0.36 * L - ch * 0.4 * W;
  if (!c.dlp) { c.dlp = [x1, y1, x2, y2]; return; }
  const d = Math.hypot(x1 - c.dlp[0], y1 - c.dlp[1]); if (d < 3) return;
  if (d < 40) WET.segs.push(c.dlp[0], c.dlp[1], x1, y1, c.dlp[2], c.dlp[3], x2, y2);
  c.dlp = [x1, y1, x2, y2];
}
function wetUpdate(simDt) {
  if (!WET.ready) { if (WATER.W < 0.004) return; wetInit(); }
  const d = WET.dry.getContext("2d"), w = WET.dry.width, h = WET.dry.height;
  if (WET.segs.length) {
    d.save(); d.scale(WET.S, WET.S); d.strokeStyle = "rgba(0,0,0,0.2)"; d.lineWidth = 1.5; d.lineCap = "round"; d.beginPath();   // where the tyres run: the footprint of the dry line
    const s = WET.segs; for (let k = 0; k < s.length; k += 4) { d.moveTo(s[k], s[k + 1]); d.lineTo(s[k + 2], s[k + 3]); }
    d.stroke(); d.restore(); s.length = 0; WET.dirty = true;
  }
  WET.fade += 0.004 * simDt;                                // old footprints (one-off excursions) slowly fade (applied in steps: 8-bit alpha)
  if (WET.fade > 0.06) { d.globalCompositeOperation = "destination-out"; d.fillStyle = `rgba(0,0,0,${(1 - Math.exp(-WET.fade)).toFixed(3)})`; d.fillRect(0, 0, w, h); d.globalCompositeOperation = "source-over"; WET.fade = 0; WET.dirty = true; }
  if (WATER.W < 0.004 && WET.W > 0) wetClear();
  const now = performance.now();
  if ((WET.dirty || Math.abs(WATER.W - WET.W) > 0.004 || Math.abs(WATER.dl - (WET.dl || 0)) > 0.01) && now - WET.t > 180) {
    WET.t = now; WET.dirty = false; WET.W = WATER.W; WET.dl = WATER.dl;
    const c2 = WET.comp.getContext("2d"); c2.globalCompositeOperation = "source-over"; c2.clearRect(0, 0, w, h);
    if (WATER.W > 0.004) {
      c2.globalAlpha = Math.min(1, WATER.W * 1.08); c2.drawImage(WET.tex, 0, 0);
      if (WATER.W > 0.5) { c2.globalAlpha = Math.min(1, (WATER.W - 0.5) / 0.4); c2.drawImage(WET.pud, 0, 0); }
      c2.globalAlpha = Math.min(1, WATER.dl * 1.35); c2.globalCompositeOperation = "destination-out"; c2.drawImage(WET.dry, 0, 0); c2.globalCompositeOperation = "source-over"; c2.globalAlpha = 1;   // the line is as dry as the model says
    }
  }
}
// ---------- spray behind the cars, rain lights ----------
const SPRAY = [], SPRAY_COL = [216, 224, 234];
var VIEWB = { x0: 0, x1: 0, y0: 0, y1: 0 };
function sprayStep(c, h) {
  const wl = c.wl || 0, v0 = c.vNow || 0, p = c.prevP;
  if (wl < 0.06 || v0 < 12 || !p || CAR_LEN_M / M_PER_PX * cam.zoom < 16 || p.x < VIEWB.x0 || p.x > VIEWB.x1 || p.y < VIEWB.y0 || p.y > VIEWB.y1) return;
  c.sprayAcc = (c.sprayAcc || 0) + h * 24 * Math.pow(wl, 1.2) * Math.pow(v0 / 70, 1.6);
  if (c.sprayAcc < 1) return;
  const hd = c.head, L = CAR_LEN_M / M_PER_PX, W = CAR_W_M / M_PER_PX, ch = Math.cos(hd), sh = Math.sin(hd), v = v0 / M_PER_PX;
  while (c.sprayAcc >= 1) {
    c.sprayAcc -= 1;
    const b = (Math.random() - 0.5) * 0.95, a = -0.5 - Math.random() * 0.08, x = p.x + ch * a * L - sh * b * W, y = p.y + sh * a * L + ch * b * W;
    const sp = (0.4 + Math.random() * 1.6) / M_PER_PX, an = Math.random() * 6.283;
    SPRAY.push({ t0: simClock, x, y, vx: ch * v * 0.42 + Math.cos(an) * sp, vy: sh * v * 0.42 + Math.sin(an) * sp, life: 0.45 + Math.random() * 0.6,
      size: (0.8 + Math.random() * 0.5) / M_PER_PX, grow: (3.4 + Math.random() * 2.2) / M_PER_PX, op: 0.12 + 0.3 * Math.min(1, wl * 1.3), v: (Math.random() * 4) | 0 });
  }
  if (SPRAY.length > 1400) SPRAY.splice(0, SPRAY.length - 1400);
}
function drawSpray(T) {
  if (!SPRAY.length) return;
  if (!replay) { let k = 0; for (const P of SPRAY) if (T - P.t0 <= P.life) SPRAY[k++] = P; SPRAY.length = k; }
  const spr = puffSprite(quant(SPRAY_COL), 0);
  for (const P of SPRAY) {
    const age = T - P.t0; if (age < 0 || age > P.life) continue;
    const f = (1 - Math.exp(-2.2 * age)) / 2.2, x = P.x + P.vx * f, y = P.y + P.vy * f, u = age / P.life;
    const r = P.size + P.grow * Math.sqrt(age), a = P.op * Math.min(1, age * 14) * Math.pow(1 - u, 1.3);
    ctx.globalAlpha = a; ctx.drawImage(P.v ? puffSprite(quant(SPRAY_COL), P.v) : spr, x - r, y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
}
const RAINLIGHT = (() => { const c = mkCanvas(32, 32), g = c.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,90,90,1)"); gr.addColorStop(0.22, "rgba(255,30,45,.9)"); gr.addColorStop(1, "rgba(255,0,20,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return c; })();
function weatherShade() {                             // overcast / rain: the whole picture gets darker and colder
  const R = Math.min(1, WXC.R), d = Math.min(0.36, 0.08 * WXC.cloud / 100 + 0.2 * R + 0.06 * WATER.W);
  if (d < 0.01) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 1;
  ctx.fillStyle = `rgb(${Math.round(255 * (1 - d))},${Math.round(255 * (1 - d * 0.9))},${Math.round(255 * (1 - d * 0.68))})`;
  ctx.fillRect(0, 0, cv.width, cv.height); ctx.restore();
}
// ---------- falling rain and splashes (anchored to the circuit) ----------
// Every drop and splash lives in map coordinates: it falls on a fixed spot of the track, so when the camera follows a car
// the rain slides past like the asphalt does. The camera looks straight down, so a drop falls away from us: high up it sits
// a little further from the picture centre (perspective) and slides towards its landing spot, drawn as a thin streak.
const RAINFX = { drops: [], spl: [], acc: 0, wx: 0, wy: 0 };
function mapToScreen(x, y) {
  const dx = x - cam.x, dy = y - cam.y, c = Math.cos(cam.rot), s = Math.sin(cam.rot);
  return [VW / 2 + (dx * c + dy * s) * cam.zoom, VH / 2 + (-dx * s + dy * c) * cam.zoom];
}
function spawnDrop(d, any) {                           // landing point on the circuit, somewhere in (or just around) the view
  const p = screenToMap(-40 + Math.random() * (VW + 80), -40 + Math.random() * (VH + 80)), life = 0.2 + Math.random() * 0.28;
  d.x = p.x; d.y = p.y; d.life = life; d.t = any ? Math.random() * life : 0; d.z = Math.random(); return d;
}
function rainFxStep(dt) {
  const R = Math.min(1.2, WXC.R), D = RAINFX.drops;
  const want = R < 0.02 ? 0 : Math.min(7000, Math.round((0.25 + R) * VW * VH / 95));
  const wa = WXC.dir * Math.PI / 180 + Math.PI, wind = (1.2 + 0.6 * WXC.wind) / M_PER_PX;     // wind drift in map px/s
  RAINFX.wx = Math.cos(wa) * wind; RAINFX.wy = Math.sin(wa) * wind;
  while (D.length < want) D.push(spawnDrop({}, true));
  if (D.length > want) D.length = want;
  const m = 80;
  for (const d of D) {
    d.t += dt;
    if (d.t > d.life) {                               // landed: leave a splash on that exact spot of the track
      spawnDrop(d, false); continue;
    }
    const [sx, sy] = mapToScreen(d.x, d.y);
    if (sx < -m || sx > VW + m || sy < -m || sy > VH + m) spawnDrop(d, true);   // camera moved on: rain falls on the new stretch
  }
  RAINFX.acc = 0; if (0) RAINFX.acc += R * VW * VH / 420 * dt;                // extra splashes from drops too small to see
  while (RAINFX.acc >= 1) { RAINFX.acc -= 1; const p = screenToMap(Math.random() * VW, Math.random() * VH); RAINFX.spl.push({ x: p.x, y: p.y, t: 0, life: 0.22 + Math.random() * 0.18, r: 0.6 + Math.random() * 0.7, a: Math.random() * 6.283 }); }
  const S = RAINFX.spl; let k = 0; for (const s of S) { s.t += dt; if (s.t < s.life) S[k++] = s; } S.length = k;
  if (S.length > 2600) S.splice(0, S.length - 2600);
}
function drawRainFx() {
  const R = Math.min(1.2, WXC.R), D = RAINFX.drops, S = RAINFX.spl;
  if (!D.length && !S.length) return;
  ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalAlpha = 1;
  if (R > 0.2) { ctx.fillStyle = `rgba(180,193,210,${(0.15 * Math.min(1, (R - 0.2) / 0.8)).toFixed(3)})`; ctx.fillRect(0, 0, VW, VH); }   // curtain of water
  const zs = Math.max(0.7, Math.min(1.6, Math.sqrt(cam.zoom)));
  // no splash rings on the ground: the drops just reach the track
  const cx = VW / 2, cy = VH / 2, md = Math.hypot(cx, cy);
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot), wsx = (RAINFX.wx * c + RAINFX.wy * s) * cam.zoom, wsy = (-RAINFX.wx * s + RAINFX.wy * c) * cam.zoom;
  const lenK = 1 + 0.7 * Math.min(1, R);
  ctx.lineCap = "round";
  for (const [lo, hi, a, lw] of [[0, 0.4, 0.3, 0.6], [0.4, 0.78, 0.44, 0.8], [0.78, 1.01, 0.6, 1.05]]) {
    ctx.beginPath();
    for (const d of D) {
      if (d.z < lo || d.z >= hi) continue;
      const [gx, gy] = mapToScreen(d.x, d.y), h = 1 - d.t / d.life;          // h: height left above the ground (1 = top)
      const ox = gx - cx, oy = gy - cy, dist = Math.hypot(ox, oy) || 1;
      const par = (0.05 + 0.13 * d.z) * h;                                    // higher drops sit further out from the centre
      const hx = gx + ox * par - wsx * 0.25 * h, hy = gy + oy * par - wsy * 0.25 * h;
      const len = (2 + 6.5 * d.z) * (0.4 + 0.9 * dist / md) * lenK;           // streak, longer towards the edges
      ctx.moveTo(hx, hy); ctx.lineTo(hx - ox / dist * len + wsx * 0.012, hy - oy / dist * len + wsy * 0.012);
    }
    ctx.strokeStyle = `rgba(224,235,250,${a})`; ctx.lineWidth = lw; ctx.stroke();
  }
  ctx.restore();
}
// weather icons (SVG) for the menus, the pit wall and the race board
function wxIcon(s, sz = 16) {
  const sun = '<circle cx="8" cy="8" r="3.3" fill="#ffd21f"/><g stroke="#ffd21f" stroke-width="1.4" stroke-linecap="round"><path d="M8 1.2v1.8M8 13v1.8M1.2 8h1.8M13 8h1.8M3.2 3.2l1.3 1.3M11.5 11.5l1.3 1.3M3.2 12.8l1.3-1.3M11.5 4.5l1.3-1.3"/></g>';
  const cloud = (y, col) => `<path d="M4.3 ${y + 6.6}h7.8a2.8 2.8 0 0 0 .2-5.6 3.8 3.8 0 0 0-7.2-.6A3.1 3.1 0 0 0 4.3 ${y + 6.6}z" fill="${col}"/>`;
  const drops = (xs, col) => `<g stroke="${col}" stroke-width="1.4" stroke-linecap="round">${xs.map(x => `<path d="M${x} 11.4l-0.9 2.8"/>`).join("")}</g>`;
  const body = s === 0 ? sun : s === 1 ? `<g opacity=".9"><circle cx="11" cy="5" r="2.4" fill="#ffd21f"/></g>${cloud(3.2, "#d3dae3")}` : s === 2 ? cloud(1.6, "#c4ccd6") + drops([5.6, 8.6, 11.6], "#5cb4ff") : cloud(1.4, "#8e98a3") + drops([4.6, 7.1, 9.6, 12.1], "#2f8cff");
  return `<svg viewBox="0 0 16 16" width="${sz}" height="${sz}" aria-hidden="true">${body}</svg>`;
}
const WXICON_IMG = WX_STATES.map((_, k) => { const im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(wxIcon(k, 32).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')); return im; });
var WX_READY = true; wxReset();
// ---------- car telemetry: tyre surface (inner / middle / outer) and carcass temperatures, pressures, brakes, power unit, gearbox ----------
const TR_STEP = 10, TR_N = Math.ceil(LAP_M / TR_STEP);            // speed trace: one sample every 10 m
const TWIN = { S: [88, 108], M: [94, 114], H: [100, 122], I: [55, 85], W: [45, 78] };         // tyre working window (°C) per compound
const PSET = [25.0, 25.0, 23.0, 23.0];                               // hot pressure (psi) at a 100 °C carcass
const WHEEL_NAME = ["DEL. IZQ.", "DEL. DER.", "TRAS. IZQ.", "TRAS. DER."], WHEEL_CODE = ["FL", "FR", "RL", "RR"];
function aeroInit(c) { c.aero = {}; AERO.forEach(p => c.aero[p[0]] = 1); c.aeroLoss = 0; }
function aeroCalc(c) { c.aeroLoss = AERO.reduce((a, p) => a + (1 - c.aero[p[0]]) * p[4], 0); }
function aeroHit(c, parts, sev) {
  if (!c.aero) aeroInit(c);
  const id = parts[(Math.random() * parts.length) | 0], part = AERO.find(p => p[0] === id);
  c.aero[id] = Math.max(0.1, c.aero[id] - sev); aeroCalc(c);
  c.lastHit = part[1].toLowerCase(); if (!c.ai) toast(`${c.code} · Daño: ${part[1].toLowerCase()}`, true);
}
// tyre rule: at least two different dry compounds must be used during the race
const compsUsed = c => new Set(c.stints.map(x => x.c));
const ruleOK = c => { const u = compsUsed(c); return u.has("I") || u.has("W") || u.size >= 2; };   // rain tyres lift the rule
function pickComp(c, rem, rate, cur, needNew) {     // the softest tyre that lasts to the flag; a new compound if the rule still needs one
  const cap = x => 0.72 / (rate * COMP[x].wear / COMP[cur].wear);
  let order = rem <= cap("S") * 0.95 ? ["S", "M", "H"] : rem <= cap("M") ? ["M", "H", "S"] : ["H", "M", "S"];
  if (needNew) { const used = compsUsed(c), o2 = order.filter(x => !used.has(x)); if (o2.length) order = o2; }
  return order[0];
}
function newTyres(c, comp) {                                         // fresh set out of the blankets
  c.tt = [0, 1, 2, 3].map(() => [72, 72, 72]); c.tc = [74, 74, 74, 74];
}
function initTelemetry(c) {
  newTyres(c, c.comp); c.bt = [190, 190, 160, 160]; aeroInit(c);
  c.wT = 82; c.oT = 96; c.gT = 84; c.gear = 0; c.shifts = 0;
}
function stepTelemetry(c, h, i) {
  if (!c.tt) initTelemetry(c);
  if (!c.aero) aeroInit(c);
  const W = WXC, v = c.done ? 0 : c.vNow || 0, moving = v > 1;
  const onTrack = !c.pit && !c.gar && !c.done && racing() && simClock >= c.launchAt;
  const vr = Math.min(1.3, v / Math.max(8, RL.v[i]));
  const g = onTrack ? LATG[i] * vr * vr : 0, out = turnOut[(i + 3) % N];   // lateral + is right of travel: -1 = the left side is the outside
  const brk = onTrack && accel[i] < -1 ? Math.min(1, -accel[i] / 40) : 0;
  const thr = onTrack && (accel[i] > 0.3 || RL.v[i] > VMAX * 0.97) ? 1 : onTrack ? 0.35 : 0;
  const wearAvg = (c.wear[0] + c.wear[1] + c.wear[2] + c.wear[3]) / 4;
  const comp = c.comp === "S" ? 5 : c.comp === "H" ? -5 : 0, pace = c.pace === "agg" ? 4 : c.pace === "soft" ? -4 : 0, cool = (c.wl || 0) * (tyreClass(c.comp) === "D" ? 34 : 20);
  const ks = Math.min(1, h / (moving ? 1.6 : 9)), kc = Math.min(1, h / 26);
  for (let w = 0; w < 4; w++) {
    const left = w % 2 === 0, front = w < 2, loaded = (left ? -1 : 1) * out > 0;
    const ld = loaded ? 1 + 0.55 * g : Math.max(0, 1 - 0.55 * g);
    const base = moving ? W.track + 16 + v * 0.42 + 4.5 * g * (ld - 0.6) + (front ? 20 * brk + 3.5 * g : 7 * thr * (1 - Math.min(1, g / 4))) + comp + pace + 10 * c.wear[w] - cool
                        : (c.pit ? W.track + 22 : 72);
    const cg = Math.min(1, g / 2), T = c.tt[w];
    const tgt = [base + 6 * (1 - cg) - 2, base + 2, base - 4 + (loaded ? 9 * cg : -2 * cg)];   // inner, middle, outer
    for (let z = 0; z < 3; z++) T[z] += (tgt[z] - T[z]) * ks;
    c.tc[w] += ((T[0] + T[1] + T[2]) / 3 - 5 - c.tc[w]) * kc;
    // brakes: heat from the energy dumped under braking, cooled by the airflow
    const heat = brk > 0 ? -accel[i] * v * (front ? 0.205 : 0.12) : 0;
    c.bt[w] += (heat - (c.bt[w] - W.air) * (0.011 + v * 0.0011)) * h;
    if (c.lock && front && c.lock.w.includes(w)) c.bt[w] += 120 * h;
  }
  const ahead = onTrack ? cars.some(o => o !== c && !o.pit && !o.done && (g2 => g2 > 0 && g2 < 30)(sgap(o.s - c.s))) : false;   // dirty air
  const mix = c.mix === "rich" ? 6 : c.mix === "lean" ? -5 : 0;
  const wTgt = onTrack ? 89 + 11 * thr + mix + (ahead ? 7 : 0) - v * 0.05 + (W.air - 24) * 0.4 : moving ? 96 : 92;
  c.wT += (wTgt - c.wT) * Math.min(1, h / 16);
  c.oT += (c.wT + 15 + 6 * thr - c.oT) * Math.min(1, h / 22);
  c.gT += ((onTrack ? 90 + 10 * thr + 2 * g : 86) - c.gT) * Math.min(1, h / 30);
  const gear = gearFor(v * 3.6);
  if (gear !== c.gear) { c.gHold = (c.gHold || 0) + h; if (c.gHold > 0.15) { if (typeof gear === "number" && typeof c.gear === "number") c.shifts++; c.gear = gear; c.gHold = 0; } } else c.gHold = 0;
}
function tyrePress(c, w) { return c.punct && c.punctW === w ? 4.5 : PSET[w] * (c.tc[w] + 273) / 373; }
const GEAR_BANDS = { 2: [0, 95], 3: [95, 135], 4: [135, 170], 5: [170, 205], 6: [205, 240], 7: [240, 280], 8: [280, 360] };   // km/h range of each gear (as gearFor)
function rpmOf(c) {
  const kmh = (c.vNow || 0) * 3.6; if (c.done || kmh < 1) return c.done ? 0 : 4200;
  const g = gearFor(kmh), [a, b] = GEAR_BANDS[g];
  return Math.round(Math.min(11900, (g === 2 ? 6000 : 9800) + (kmh - a) / (b - a) * (g === 2 ? 5800 : 2100)));
}
function icePower(c) {
  if (c.done || c.pit || !racing()) return c.pit ? 40 : 0;
  const i = idxAt(c.s), thr = accel[i] > 0.3 || RL.v[i] > VMAX * 0.97;
  return Math.round((thr ? 400 : accel[i] < -1 ? 0 : 140) * (c.mix === "rich" ? 1.04 : c.mix === "lean" ? 0.94 : 1));
}
// gap in seconds from c to another car, at the point of the race c has reached (from the 10 m time log)
function gapTo(c, ref) {
  const dp = progress(ref) - progress(c);
  if (dp >= LAP_M) return { lap: Math.floor(dp / LAP_M) };
  const m = Math.floor((progress(c) + 100) / 10), t = ref.hist[m];
  return { s: t == null ? null : Math.max(0, c.total - t) };
}
// stints done, the one in progress and the stops still to come (forecast from the real wear rate)
function strategyOf(c) {
  const done = c.fin ? c.finLaps : Math.max(0, c.lap - 1 + c.s / LAP_M);
  const st = c.stints.map((x, k) => ({ comp: x.c, a: x.a, b: k < c.stints.length - 1 ? c.stints[k + 1].a : done, cur: k === c.stints.length - 1 }));
  const worst = Math.max(...c.wear), laps = Math.max(0.5, (c.tyreDist || 0) / LAP_M);
  const rate = laps >= 1.5 && worst > 0.03 ? worst / laps : COMP[c.comp].wear * 1.4;
  const pitAt = c.ai ? (c.aiPitAt || 0.7) : 0.75, pred = [];
  if (!c.done && !c.ai && c.plan) {
    c.plan.stints.slice(c.stops + 1).forEach((st, j) => { const lap = c.plan.stints[c.stops + j].to; if (lap > done - 0.5) pred.push({ lap, comp: st.comp }); });
    if (!pred.length && !ruleOK(c)) pred.push({ lap: Math.min(RACE_LAPS - 1, done + 1), comp: pickComp(c, RACE_LAPS - done, rate, c.comp, true), forced: true });
  } else if (!c.done) {
    let at = c.pitReq ? Math.ceil(done + 0.02) : done + Math.max(0, (pitAt - worst) / rate), cur = c.comp, r = rate;
    for (let k = 0; k < 3 && at < RACE_LAPS - 1.5; k++) {
      const rem = RACE_LAPS - at;
      const next = k === 0 && c.pitReq ? c.nextComp : pickComp(c, rem, r, cur, k === 0 && !ruleOK(c));
      pred.push({ lap: at, comp: next });
      r = r * COMP[next].wear / COMP[cur].wear; cur = next; at += pitAt / r;
    }
    if (!pred.length && !ruleOK(c)) {                // the tyres would last, but the rule forces a stop
      const at2 = Math.min(RACE_LAPS - 1, Math.max(done + 0.5, c.ai ? (c.aiMandLap || RACE_LAPS * 0.6) : RACE_LAPS * 0.6));
      pred.push({ lap: at2, comp: pickComp(c, RACE_LAPS - at2, rate, c.comp, true), forced: true });
    }
  }
  return { st, pred, rate, done };
}

// ---------- rivals: fuel, ERS and pit-stop decisions ----------
// the tyre class a rival wants: the water on the line now and the forecast for the next laps, with some hysteresis
function aiWant(c) {
  const have = tyreClass(c.comp), now = lineWet();
  let fut = now;
  if (FC) { const l = Math.max(1, Math.min(RACE_LAPS, c.lap)); let sum = 0, n = 0; for (let k = l; k <= Math.min(RACE_LAPS, l + 2); k++) { sum += FC.wl[k]; n++; } if (n) fut = sum / n; }
  const w = Math.max(0, 0.45 * now + 0.55 * fut + (c.wxBias || 0));
  if (have === "D") return w > 0.17 ? (w > 0.62 ? "W" : "I") : "D";
  if (have === "I") return w < 0.1 ? "D" : w > 0.64 ? "W" : "I";
  return w < 0.08 ? "D" : w < 0.46 ? "I" : "W";
}
function aiComp(c, rem) {                       // the softest tyre that lasts to the flag, else the hardest
  const wantC = aiWant(c); if (wantC !== "D") return wantC;
  const worst = Math.max(...c.wear), laps = Math.max(0.5, (c.tyreDist || 0) / LAP_M);
  const rate = laps >= 2 && worst > 0.05 ? worst / laps : COMP[c.comp].wear * 1.5;       // wear per lap on the current set
  return pickComp(c, rem, rate, c.comp, !ruleOK(c));
}
function aiThink(c, h) {
  if (SES || c.done || !c.started || c.pit || c.inc) return;
  c.aiT = (c.aiT || 0) - h; if (c.aiT > 0) return;
  c.aiT = 0.4 + Math.random() * 0.3;
  const rem = Math.max(0, RACE_LAPS - (c.lap - 1) - c.s / LAP_M), per = FUEL_BASE * PACE[c.pace].fuel;
  c.mix = c.fuel / per < rem ? "lean" : c.fuel / (per * MIX.rich.fuel) > rem + 1.2 ? "rich" : "std";
  let ahead = Infinity, behind = Infinity;
  for (const o of cars) { if (o === c || o.done || o.pit) continue; const g = sgap(o.s - c.s); if (g > 0) ahead = Math.min(ahead, g); else behind = Math.min(behind, -g); }
  const b = c.batt / BATT_MAX;
  c.ers = b < 0.12 ? "charge" : ahead < 30 && b > 0.3 ? "attack" : behind < 25 && b > 0.25 ? "defend" : "neutral";
  if (c.pitReq) return;
  { // weather: tyres for the water on the racing line (each team reacts a little differently)
    const want = aiWant(c), have = tyreClass(c.comp);
    if (want !== have && rem > 1.5) {
      c.wxMis = (c.wxMis || 0) + 0.55;
      if (c.wxMis > (c.wxDelay || 10)) { c.nextComp = want === "D" ? pickComp(c, rem, COMP.M.wear * 1.4, "M", !ruleOK(c)) : want; c.pitReq = true; c.wxMis = 0; return; }
    } else c.wxMis = 0;
  }
  if (cars.some(o => o !== c && o.team === c.team && (o.pitReq || (o.pit && !o.pit.released)))) return;   // no double stack by choice
  // the tyre rule: one stop on another compound is compulsory
  if (!ruleOK(c) && rem > 0.6 && (lapsRun(c) >= (c.aiMandLap || RACE_LAPS * 0.6) || rem < 4)) { c.nextComp = aiComp(c, rem); c.pitReq = true; return; }
  if (rem < 2.5) return;
  if (c.aero && (c.aero.FWL < 0.6 || c.aero.FWR < 0.6) && rem > 4) { c.nextComp = aiComp(c, rem); c.pitReq = true; return; }   // broken front wing
  const worst = Math.max(...c.wear);
  let scStop = false;                           // safety car: decide once per deployment whether to take the cheap stop
  if (scActive() && c.scN !== SC.n) { c.scN = SC.n; scStop = rem > 6 && Math.random() < Math.max(0, Math.min(0.9, (worst - 0.25) * 2.5)); }
  if (worst >= c.aiPitAt || scStop) {
    c.nextComp = aiComp(c, rem); c.pitReq = true; c.aiPitAt = 0.6 + Math.random() * 0.16;
  }
}

