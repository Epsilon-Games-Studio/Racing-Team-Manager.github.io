// =====================================================================================================
// ---------- GRAND PRIX WEEKEND: free practice 1-3 and qualifying Q1-Q3 (2026 sporting regulations) ----------
// Every car starts each session in its garage. On the order to go out it rolls out of the garage into the pit lane,
// does an out-lap, its programme (timed laps, cool-down laps, a long run) and an in-lap, and is pushed back into the
// garage by its crew. During free practice the set-up can be changed (F1 Manager style: five settings, five areas
// of driver feedback, the window of what the driver likes narrows the more laps he does). Parc fermé from Q1.
// =====================================================================================================
const SES_DEF = {
  FP1: { id: "FP1", name: "Libres 1", long: "Entrenamientos libres 1", day: "Viernes", hour: "13:30", dur: 3600, kind: "fp" },
  FP2: { id: "FP2", name: "Libres 2", long: "Entrenamientos libres 2", day: "Viernes", hour: "17:00", dur: 3600, kind: "fp" },
  FP3: { id: "FP3", name: "Libres 3", long: "Entrenamientos libres 3", day: "Sábado", hour: "12:30", dur: 3600, kind: "fp" },
  Q1: { id: "Q1", name: "Q1", long: "Clasificación · Q1", day: "Sábado", hour: "16:00", dur: 1080, kind: "q", cut: 16 },
  Q2: { id: "Q2", name: "Q2", long: "Clasificación · Q2", day: "Sábado", hour: "16:25", dur: 900, kind: "q", cut: 10 },
  Q3: { id: "Q3", name: "Q3", long: "Clasificación · Q3", day: "Sábado", hour: "16:47", dur: 720, kind: "q", cut: 0 }
};
const SES_IDS = Object.keys(SES_DEF);
SES_DEF.TEST = { id: "TEST", name: "Test", long: "Test de pretemporada", day: "Lunes", hour: "09:00", dur: 3600, kind: "fp" };   // not part of a weekend
const TYRE_ALLOC = { S: 8, M: 3, H: 2, I: 4, W: 3 };            // sets per car for the weekend
// run programmes: n timed laps (push = qualifying lap, run = race-pace lap), cool = a cool-down lap between pushes
const PROGS = {
  inst: { name: "Vuelta de instalación", short: "Instalación", n: 0, mode: "run", fp: true },
  q1: { name: "Una vuelta rápida", short: "Rápida ×1", n: 1, mode: "q", fp: true, q: true },
  q2: { name: "Dos vueltas rápidas (enfriando entre medias)", short: "Rápida ×2", n: 2, mode: "q", cool: true, fp: true, q: true },
  r3: { name: "Tanda corta · 3 vueltas", short: "Tanda 3 v", n: 3, mode: "run", fp: true },
  r6: { name: "Tanda media · 6 vueltas", short: "Tanda 6 v", n: 6, mode: "run", fp: true },
  r10: { name: "Tanda larga · 10 vueltas", short: "Tanda 10 v", n: 10, mode: "run", fp: true },
  r15: { name: "Simulación de carrera · 15 vueltas", short: "Tanda 15 v", n: 15, mode: "run", fp: true }
};
// ---------- set-up: five settings (0-1 inside their legal range) and five areas the driver feels ----------
const SETUP_P = [
  { id: "fw", name: "Alerón delantero", a: 4, b: 11, u: "°", d: 2, steps: 28, work: 25 },
  { id: "rw", name: "Alerón trasero", a: 7, b: 16, u: "°", d: 2, steps: 36, work: 45 },
  { id: "ard", name: "Reparto barras estabilizadoras", a: 40, b: 60, u: " % del.", d: 1, steps: 40, work: 90 },
  { id: "cam", name: "Caída (camber)", a: -3.5, b: -1.8, u: "°", d: 2, steps: 34, work: 120 },
  { id: "toe", name: "Convergencia (toe-out)", a: 0.05, b: 0.5, u: "°", d: 2, steps: 45, work: 120 }
];
const SETUP_F = [
  { id: "bal", name: "Equilibrio", lo: "Subviraje", hi: "Sobreviraje" },
  { id: "brk", name: "Estabilidad en frenada", lo: "Nerviosa", hi: "Rígida" },
  { id: "cor", name: "Paso por curva", lo: "Poca carga", hi: "Pesado" },
  { id: "trc", name: "Tracción", lo: "Patina", hi: "Perezoso" },
  { id: "str", name: "Velocidad en recta", lo: "Lento", hi: "Sin carga" }
];
// how each setting moves each area (rows: areas, columns: settings)
const SETUP_M = [[0.55, -0.45, -0.30, 0.10, 0.15], [-0.20, 0.35, 0.35, -0.20, 0.35], [0.35, 0.30, 0.10, 0.45, -0.15], [-0.10, 0.40, -0.40, -0.25, 0.25], [-0.30, -0.55, 0.05, -0.25, -0.30]];
const fbOf = p => SETUP_M.map(r => 0.5 + r.reduce((a, m, i) => a + m * (p[i] - 0.5), 0));
const pVal = (j, p) => SETUP_P[j].a + (SETUP_P[j].b - SETUP_P[j].a) * p;
const pTxt = (j, p) => { const v = pVal(j, p), s = SETUP_P[j]; return (s.id === "ard" ? `${v.toFixed(1)}:${(100 - v).toFixed(1)}` : v.toFixed(s.d)).replace(/\./g, ",") + (s.id === "ard" ? "" : s.u); };
function setupSat(p, opt) { const f = fbOf(p), o = fbOf(opt); let s = 0; for (let j = 0; j < 5; j++) s += (f[j] - o[j]) ** 2; return Math.max(0, Math.min(1, 1 - Math.sqrt(s / 5) / 0.2)); }
var WK = null, SES = null;                                    // the weekend, the live session
const clamp01 = x => Math.max(0, Math.min(1, x));
function satOf(idx) { const W = WK && WK.car[idx]; if (!W) return 0.6; return DRIVERS[idx].ai ? (W.aiS != null ? W.aiS : W.aiQ) : setupSat(W.p, W.opt); }
const trackEvo = () => -0.0075 * Math.exp(-(WK ? WK.evoLaps : 1e5) / 320);     // the track rubbers in through the weekend
function xkOf(c) { return WK ? 0.009 * (satOf(c.idx) - 0.6) + (SES ? trackEvo() : 0) : 0; }
const gripPct = () => 100 + trackEvo() / 0.0075 * 6;
const confOf = idx => Math.round(52 + 46 * satOf(idx));
// what the driver says the window of each area is (it narrows with the laps he does)
function fbWin(W, j) { const o = fbOf(W.opt)[j], K = W.K[j]; return { c: o + W.err[j] * (1 - K), hw: 0.03 + 0.2 * (1 - K) }; }
function estSat(W, p) {                                       // the satisfaction the team can estimate from the feedback
  const f = fbOf(p); let s = 0;
  for (let j = 0; j < 5; j++) { const w = fbWin(W, j), d = Math.abs(f[j] - w.c); s += d <= w.hw ? 1 - 0.25 * d / w.hw : Math.max(0, 0.75 - (d - w.hw) * 4); }
  const K = W.K.reduce((a, b) => a + b, 0) / 5;
  return 0.5 + (s / 5 - 0.5) * (0.3 + 0.7 * K);                 // with little data the engineers cannot be sure either way
}
function newWeekend() {
  const r = rng((Math.random() * 1e9) | 0);
  const base = [0, 0, 0, 0, 0].map(() => 0.32 + r() * 0.36);                    // what this circuit asks for
  const teamOff = {}; Object.keys(TEAMS).forEach(t => teamOff[t] = base.map(() => (r() - 0.5) * 0.28));
  const car = DRIVERS.map((d, k) => {
    const opt = base.map((b, i) => Math.max(0.12, Math.min(0.88, b + teamOff[d.team][i] + (r() - 0.5) * 0.12)));
    const o = { opt, p: [0.5, 0.5, 0.5, 0.5, 0.5], err: SETUP_F.map(() => (r() - 0.5) * 0.26), K: SETUP_F.map(() => 0.1), laps: 0, runs: 0, said: "" };
    if (d.ai) o.aiQ = 0.5 + r() * 0.12 + (TEAMS[d.team].skill > -0.005 ? 0.05 : 0);
    else {
      o.sets = []; Object.entries(TYRE_ALLOC).forEach(([cmp, n]) => { for (let j = 0; j < n; j++) o.sets.push({ c: cmp, w: [0, 0, 0, 0], l: 0 }); });
      o.plan = { prog: "inst", set: -1 }; o.pend = o.p.slice();
    }
    return o;
  });
  const pickWx = () => { if (r() < 0.62) return WXSET.start; const p = WX_NEXT[WXSET.start]; let x = r(), n = 0; while (n < 3 && x > p[n]) { x -= p[n]; n++; } return n; };
  const fri = pickWx(), sat = pickWx(), wx = {};
  SES_IDS.forEach(id => { wx[id] = { start: SES_DEF[id].day === "Viernes" ? fri : sat, evo: 1, seed: (r() * 1e9) | 0 }; });
  return { i: 0, car, wx, res: {}, evoLaps: 0, out: {}, grid: null, best: {} };
}
// ---------- the garages: an open garage per team, the two cars side by side, noses to the pit lane ----------
const GAR_Y = PG.FRONT + 8.6;
function garSlot(c) {
  const mate = DRIVERS.findIndex((d, k) => d.team === c.team && k !== c.idx), first = mate < 0 || c.idx < mate;
  const F = crewFrame(CREW_BY_TEAM[c.team]), X = first ? 5.7 : -5.7, [x, y] = bw(F, X, GAR_Y);
  return { x, y, h: bwa(F, -Math.PI / 2), X, F };
}
function bezMake(a, b, c, d) {                                // cubic Bézier with an arc-length table
  const P = { a, b, c, d, tab: [0] }; let px = a[0], py = a[1], L = 0;
  for (let k = 1; k <= 40; k++) { const q = bezPt(P, k / 40); L += Math.hypot(q[0] - px, q[1] - py); P.tab.push(L); px = q[0]; py = q[1]; }
  P.len = L; return P;
}
function bezPt(P, t) { const u = 1 - t, A = u * u * u, B = 3 * u * u * t, C = 3 * u * t * t, D = t * t * t; return [A * P.a[0] + B * P.b[0] + C * P.c[0] + D * P.d[0], A * P.a[1] + B * P.b[1] + C * P.c[1] + D * P.d[1]]; }
function bezAt(P, s) {                                        // point and tangent at arc length s
  s = Math.max(0, Math.min(P.len, s)); let k = 1; while (k < 40 && P.tab[k] < s) k++;
  const t = (k - 1 + (s - P.tab[k - 1]) / Math.max(1e-6, P.tab[k] - P.tab[k - 1])) / 40, q = bezPt(P, t), q2 = bezPt(P, Math.min(1, t + 0.01)), q1 = bezPt(P, Math.max(0, t - 0.01));
  return { x: q[0], y: q[1], h: Math.atan2(q2[1] - q1[1], q2[0] - q1[0]) };
}
function garPark(c) {
  const g = garSlot(c);
  c.gar = { ph: "park", x: g.x, y: g.y, h: g.h }; c.pit = null; c.pitReq = false; c.toGar = false; c.head = g.h; c.vNow = 0;
  c.s = pitTrackS(PIT.boxes[c.box].d); c.lat = 0; c.lt = null; c.started = false; c.prevP = null; c.inc = null; c.launch = null;
  c.deploy = c.harvest = 0; c.lapT = 0; c.secs = [null, null, null]; c.secK = null; c.lock = null; c.spark = null; c.yieldT = 0; c.wPrev = null; c.dlp = null; c.rubP = null;
}
function garPose(c) { const G = c.gar; return { x: G.x, y: G.y, i: 0, v: 0, a: 0 }; }
function canLeave(c) {
  if (!SES || SES.flag || SES.red || SES.over || c.elim || c.out || c.done || c.work > 0) return false;
  const bd = PIT.boxes[c.box].d;
  for (const o of cars) {
    if (o === c) continue;
    if (o.pit && (o.vNow || 0) > 0.5 && o.pit.d > bd - 80 && o.pit.d < bd + 16) return false;      // a car coming down the lane
    if (o.team === c.team && o.gar && o.gar.ph !== "park") return false;                          // the team-mate is using the box
    if (o.team === c.team && o.pit && !o.pit.served && o.pit.d > bd - 140) return false;
  }
  return true;
}
function mkRun(c, prog, comp, si) {
  const P = PROGS[prog], laps = 2 + P.n + (P.cool ? P.n - 1 : 0);
  let w0 = [0, 0, 0, 0], l0 = 0;
  if (si != null && si >= 0 && WK.car[c.idx].sets) { const s = WK.car[c.idx].sets[si]; w0 = s.w.slice(); l0 = s.l; comp = s.c; }
  return { prog, mode: P.mode, n: P.n, left: P.n, cool: !!P.cool, comp, fuel: Math.min(FUEL_MAX, laps * FUEL_BASE * 1.12 + 1.3), w0, l0, set: si, t0: SES.t };
}
function setLT(c, lt) {
  c.lt = lt;
  if (lt === "push") { c.pace = "agg"; c.mix = "rich"; c.ers = "overtake"; }
  else if (lt === "run") { c.pace = "bal"; c.mix = "std"; c.ers = "neutral"; }
  else { c.pace = "soft"; c.mix = lt === "out" ? "std" : "lean"; c.ers = "charge"; }
  if (!c.ai && c.ov) Object.assign(c, c.ov);                  // what the player asked for on the driver panel holds until the garage
}
const LT_MUL = { out: 0.8, push: 1, run: 1, cool: 0.74, in: 0.78 };
function sesMul(c) { let m = LT_MUL[c.lt] || 0.8; if (SES.red) m = Math.min(m, 0.55); if (c.yieldT > 0) m *= 0.94; return m; }
const timed = c => c.lt === "push" || c.lt === "run";
function garLeave(c) {
  const run = c.goReq; c.goReq = null;
  const g = c.gar, bd = PIT.boxes[c.box].d, d0 = bd + 12;
  const end = pitPos({ pit: { d: d0, lat0: 0 }, box: c.box, s: 0, lat: 0 }), eh = pitPoint(d0).h, f0x = Math.cos(g.h), f0y = Math.sin(g.h);
  const path = bezMake([g.x, g.y], [g.x + f0x * 9, g.y + f0y * 9], [end.x - Math.cos(eh) * 11, end.y - Math.sin(eh) * 11], [end.x, end.y]);
  c.gar = { ph: "exit", path, u: 0, v: 0, x: g.x, y: g.y, h: g.h, d0 };
  c.run = run; c.comp = c.nextComp = run.comp; c.wear = run.w0.slice(); newTyres(c, c.comp); c.tyreLaps = run.l0; c.tyreDist = run.l0 * LAP_M;
  c.fuel = run.fuel; c.stints = [{ c: c.comp, a: 0 }]; c.punct = false; c.punctChk = 84; c.batt = BATT_MAX;
  c.ov = null; c.started = true; setLT(c, "out"); c.lapT = 0; c.lapInv = false; c.lapTraffic = 0; c.tlAt = null; c.runs++;
  WK.car[c.idx].runs++;
  for (let k = 0; k < 6; k++) dustAt(c, 1, null, 400, 1 / 60, "asphalt", W_REAR);               // a chirp of wheelspin out of the garage
  if (!c.ai) { toast(`${c.code} sale a pista · ${COMP[c.comp].name.toLowerCase()} ${run.l0 ? "usados" : "nuevos"} · ${PROGS[run.prog].short}`, "good"); focus = c.idx; setFollow(true); }
}
function garArrive(c) {                                       // stopped in front of the garage: the crew pushes it back in
  const p = pitPos(c); c.pit = null; c.pitReq = false; c.toGar = false; c.gar = { ph: "stop", t: 0, x: p.x, y: p.y, h: c.head }; c.vNow = 0; c.lt = null;
}
function stepGar(c, h) {
  const G = c.gar; c.deploy = c.harvest = 0;
  if (G.ph === "park") {
    c.vNow = 0;
    if (c.work > 0) { c.work = Math.max(0, c.work - h); if (c.work === 0) workDone(c); }
    if (c.goReq) { c.goT = (c.goT || 0) + h; if (c.goT > 2.2 && canLeave(c) && relReady(c)) garLeave(c); } else c.goT = 0;   // blankets off, engine fired up; out on the release man's signal
    return;
  }
  if (G.ph === "exit") {                                    // out of the garage on the throttle: a quick burst, then the pit lane
    G.v = Math.min(12, G.v + 8.5 * h); G.u += G.v * h / M_PER_PX; c.vNow = G.v;
    if (G.u >= G.path.len) {
      c.gar = null; c.pit = { d: G.d0, served: true, released: true, stopT: 0, lat0: 0, head0: c.head, toGar: true }; c.prevP = null;
      if (c.run && c.run.n === 0) { c.pitReq = true; c.toGar = true; }                             // installation lap: straight back in
      return;
    }
    const q = bezAt(G.path, G.u); G.x = q.x; G.y = q.y; c.head = q.h; return;
  }
  if (G.ph === "stop") {
    c.vNow = 0; G.t += h;
    if (G.t > 1.1 && (gcPushReady(c) || G.t > 12)) {          // the mechanics have their hands on it
      const F = crewFrame(CREW_BY_TEAM[c.team]), [X0, Y0] = mbf(F, G.x, G.y), fx = Math.cos(G.h), fy = Math.sin(G.h);
      const th0 = Math.atan2(F.g * (-fx * F.s + fy * F.c), fx * F.c + fy * F.s);
      G.ph = "back"; G.u = 0; G.F = F; G.X0 = X0; G.Y0 = Y0; G.th0 = th0; G.sx = garSlot(c).X;
    }
    return;
  }
  if (G.ph === "back") {                                    // swung round on the box, then pushed backwards into the garage
    const T1 = 3.6, T2 = 5.2, F = G.F, sx = G.sx, EY = 6.0; G.u += h; c.vNow = 0;
    let X, Y, th;
    if (G.u < T1) {
      const p = pPh(G.u, 0, T1), q = 1 - p, cx = G.X0 + (sx - G.X0) * 0.2, cy = G.Y0 + 4.5;
      X = q * q * G.X0 + 2 * q * p * cx + p * p * sx; Y = q * q * G.Y0 + 2 * q * p * cy + p * p * EY;
      th = G.th0 + (-Math.PI / 2 - G.th0) * pPh(G.u, T1 * 0.1, T1);
    } else {
      const p = pPh(G.u, T1 + 0.25, T1 + 0.25 + T2); X = sx; Y = EY + (GAR_Y - EY) * p; th = -Math.PI / 2;
      if (G.u >= T1 + 0.25 + T2) { garPark(c); runEnd(c); return; }
    }
    [G.x, G.y] = bw(F, X, Y); c.head = bwa(F, th);
  }
}
function workDone(c) {
  const W = WK.car[c.idx];
  if (c.workSet) { W.p = c.workSet.slice(); c.workSet = null; c.xk = xkOf(c); if (!c.ai) toast(`${c.code} · Cambios de reglaje terminados`, "good"); }
}
function startWork(c, set) {                                   // the mechanics change the car: it costs session time
  const W = WK.car[c.idx]; let t = 0;
  set.forEach((v, j) => { if (Math.abs(v - W.p[j]) > 1e-4) t += SETUP_P[j].work; });
  if (!t) { c.workSet = null; c.work = 0; return 0; }
  c.workSet = set.slice(); c.work = t + 30; c.workTot = c.work; return c.work;
}
function runEnd(c) {
  const W = WK.car[c.idx];
  if (!c.ai && focus === c.idx) { const o = cars.find(x => !x.ai && x !== c && !x.done && !x.elim && (!x.gar || x.gar.ph === "exit")); if (o) { focus = o.idx; setFollow(true); } }
  if (c.run && W.sets && c.run.set != null && c.run.set >= 0) { const s = W.sets[c.run.set]; s.w = c.wear.slice(); s.l = c.tyreLaps; }
  if (!c.ai) {
    const line = feedbackLine(c); W.said = line; radio(c, line);
    if (W.pend && W.pend.some((v, j) => Math.abs(v - W.p[j]) > 1e-4) && SES.def.kind === "fp") startWork(c, W.pend);
  } else if (SES.plan[c.idx] && SES.plan[c.idx][0]) {
    const nx = SES.plan[c.idx][0]; nx.t = Math.max(nx.t, SES.t + (SES.def.kind === "q" ? 45 : 110 + Math.random() * 200));
  }
  c.run = null; c.lt = null;
}
// ---------- what the driver says after a run ----------
const FB_LINES = {
  bal: ["El morro no quiere girar, mucho subviraje en las lentas.", "La trasera se me va a la entrada, demasiado sobreviraje."],
  brk: ["En las frenadas fuertes la trasera está muy nerviosa.", "En frenada el coche va demasiado clavado, no rota."],
  cor: ["Nos falta carga en las curvas rápidas, sobre todo en el sector 3.", "Demasiada carga, el coche está pesado en curva."],
  trc: ["Patino mucho a la salida de las curvas lentas.", "Mucha tracción, pero el coche sale perezoso de las curvas."],
  str: ["En la recta nos pasan todos, nos falta punta.", "Vamos muy rápidos en recta pero no hay carga para las curvas."]
};
function feedbackLine(c) {
  const W = WK.car[c.idx], f = fbOf(W.p); let worst = -1, wd = 0;
  for (let j = 0; j < 5; j++) { const w = fbWin(W, j), d = (f[j] - w.c) / w.hw; if (Math.abs(d) > 1 && Math.abs(d) > Math.abs(wd)) { wd = d; worst = j; } }
  if (worst < 0) return satOf(c.idx) > 0.82 ? "El coche va de maravilla, yo no tocaría nada." : "No está mal. Buscaría alguna décima más en el equilibrio.";
  return FB_LINES[SETUP_F[worst].id][wd > 0 ? 1 : 0];
}
function learn(c, lt) {
  if (c.ai) return;
  const W = WK.car[c.idx], r = lt === "push" ? 0.07 : lt === "run" ? 0.06 : 0.03;
  const fo = lt === "push" ? [0.8, 0.8, 1.2, 0.8, 1.25] : lt === "run" ? [1, 1.1, 0.9, 1.25, 0.8] : [1, 1, 1, 1, 1];
  W.K = W.K.map((k, j) => Math.min(0.97, k + (1 - k) * r * fo[j] * (0.75 + Math.random() * 0.5))); W.laps++;
}
// ---------- the session clock, laps, flags ----------
function sesLapCheck(c) {
  if (timed(c) && !c.pit) {
    secCheck(c);
    if (c.tlAt != null && c.s >= c.tlAt && c.s < c.tlAt + 80) {           // track limits: the lap time is deleted
      const tn = TURNS.indexOf(c.tlAt) + 1; c.tlAt = null;
      if (!c.lapInv) { c.lapInv = true; SES.tlN = (SES.tlN || 0) + 1; if (!c.ai) toast(`${c.code} · Límites de pista en la curva ${tn} · vuelta anulada`, true); }
    }
  }
  if (c.s < LAP_M) return;
  c.s -= LAP_M;
  if (c.pit || !c.lt) return;                                          // the line crossed in the pit lane does not count
  const lt = c.lt, t = c.lapT;
  WK.evoLaps++; c.tyreLaps++; learn(c, lt); c.xk = xkOf(c);
  if (timed(c)) {
    if (c.secK != null) secDone(c, 2);
    c.prevSecs = c.secs; c.sLaps++;
    const valid = !c.lapInv, prevBest = c.sbest, order0 = sesOrder().filter(x => !x.elim);
    c.slast = t; c.slastInv = !valid; c.laps.push([+t.toFixed(3), valid ? 0 : 4]);
    if (valid && (c.sbest == null || t < c.sbest)) {
      c.sbest = t; c.sbestAt = SES.t; c.sbestComp = c.comp;
      const fast = !SES.fl || t < SES.fl.t; if (fast) SES.fl = { t, idx: c.idx };
      const order = sesOrder().filter(x => !x.elim), pos = order.indexOf(c) + 1, lead = order[0];
      if (!c.ai) {
        toast(`${c.code} · ${fmt(t)} · P${pos}${pos > 1 && lead.sbest != null ? ` (+${(t - lead.sbest).toFixed(3)})` : ""}${fast ? " · ¡el más rápido!" : ""}`, "good");
        if (c.lapTraffic > 0.12) radioEvent(c, "traffic"); else radioEvent(c, "pb", { t: fmt(t), p: pos, fast });
      } else if (fast) toast(`${c.code} marca el mejor tiempo · ${fmt(t)}`, false);
      if (SES.def.cut) {                                               // qualifying: who drops into the elimination zone
        order0.forEach((o, k) => { if (o.ai || o === c) return; const nk = order.indexOf(o); if (k < SES.def.cut && nk >= SES.def.cut) toast(`${o.code} cae a P${nk + 1} · zona de eliminación`, true); });
      }
    } else if (!c.ai && valid && c.lt === "push") toast(`${c.code} · ${fmt(t)} · +${(t - c.sbest).toFixed(3)} sobre su mejor`, false);
    else if (!c.ai && valid) { /* race-pace lap: quiet */ }
  }
  c.secs = [null, null, null]; c.lapT = 0; c.lapInv = false; c.lapTraffic = 0; c.tlAt = null;
  const R = c.run || { left: 0 };
  let nx;
  if (c.pitReq || SES.flag || SES.red || c.fuel < FUEL_BASE * 1.25) nx = "in";
  else if (lt === "push" && R.cool && R.left > 0) nx = "cool";
  else if (R.left > 0) nx = R.mode === "q" ? "push" : "run";
  else nx = "in";
  if (nx === "in") { c.pitReq = true; c.toGar = true; c.secK = null; }
  else if (nx === "cool") c.secK = null;
  else {
    R.left--; c.secK = 0; c.secT0 = 0; c.secs = [null, null, null];
    const pTL = nx === "push" ? (c.ai ? 0.03 : 0.045) : 0.012;
    c.tlAt = Math.random() < pTL ? TURNS[(Math.random() * TURNS.length) | 0] : null;
  }
  setLT(c, nx);
}
function sesOrder() {
  return [...cars].sort((a, b) => (!!a.elim - !!b.elim) || (a.elim && b.elim ? a.elimPos - b.elimPos : 0)
    || ((a.sbest == null ? 1e9 : a.sbest) - (b.sbest == null ? 1e9 : b.sbest)) || ((a.sbestAt || 0) - (b.sbestAt || 0)) || a.idx - b.idx);
}
function sesRed(why) {
  if (!SES || SES.red || SES.over) return;
  SES.red = { t: 0, why }; RED_FLAG = true;
  cars.forEach(c => { if (!c.gar && !c.done) { c.pitReq = true; c.toGar = true; c.lapInv = true; if (c.lt !== "in") { if (c.run) c.run.left = 0; setLT(c, "in"); } } });
  toast(`BANDERA ROJA · ${why}`, true);
}
function sesStep(h) {
  if (!SES || SES.over) return;
  if (!SES.red || SES.def.kind === "fp") SES.t = Math.min(SES.def.dur, SES.t + h);   // qualifying stops the clock under red
  if (!SES.flag && SES.t >= SES.def.dur) {
    SES.flag = true; cars.forEach(c => { c.goReq = null; });
    toast("BANDERA A CUADROS · fin de la sesión", false);
  }
  if (SES.red) {
    SES.red.t += h;
    if (SES.red.t > 25 && cars.every(c => c.done || (c.gar && c.gar.ph === "park"))) {
      RED_FLAG = false; SES.red = null; cars.forEach(c => { if (c.dnf) c.out = true; });
      if (!SES.flag) toast("BANDERA VERDE · se reanuda la sesión", "good");
    }
  }
  gcStep(h);
  cars.forEach(c => { if (c.yieldT > 0) c.yieldT -= h; });
  SES.aiT = (SES.aiT || 0) - h;
  if (SES.aiT <= 0) { SES.aiT = 0.5; cars.forEach(c => { if (c.ai) sesAI(c); }); }
  if (SES.flag && cars.every(c => c.done || c.elim || (c.gar && c.gar.ph === "park"))) sesFinish();
}
// ---------- the rivals' session plans ----------
const isWet = () => lineWet() > 0.13;
function aiRunComp(c, prog) {
  const w = lineWet(); if (w > 0.13) return idealClass(w);
  return PROGS[prog].mode === "q" ? "S" : (hash01(c.idx * 3.7 + SES.t * 0.001 + (c.runs || 0)) < 0.6 ? "M" : "H");
}
function aiPlan(c, def) {
  const r = Math.random, P = [], D = def.dur;
  if (def.kind === "fp") {
    if (r() < 0.85) P.push({ t: 40 + r() * 330, prog: "inst" });
    const seq = def.id === "FP1" ? ["r3", "r6", "q1", "r6", "r3", "r10", "r3"] : def.id === "FP2" ? ["r3", "q2", "r3", "r15", "r6", "r3"] : ["r3", "q2", "r3", "q2", "r6", "r3"];
    let t = 420 + r() * 520;
    for (const prog of seq) { if (t > D - 260) break; P.push({ t, prog }); t += (2 + PROGS[prog].n + (PROGS[prog].cool ? 1 : 0)) * 80 + 150 + r() * 260; }
  } else {
    const k = D / 1080;
    P.push({ t: (40 + r() * 260) * k, prog: r() < 0.3 ? "q2" : "q1" });
    P.push({ t: D - 450 + r() * 140, prog: "q1", late: true });
  }
  return P;
}
function sesAI(c) {
  if (c.done || c.elim || c.out || !SES.plan) return;
  const P = SES.plan[c.idx]; if (!P || !P.length || c.goReq || !c.gar || c.gar.ph !== "park" || SES.t < P[0].t) return;
  const run = P[0];
  if (SES.def.kind === "q" && SES.t > SES.def.dur - 128) { P.length = 0; return; }   // too late to start a timed lap
  if (run.late && SES.def.cut && c.sbest != null) {                                   // safe enough: no second run
    const pos = sesOrder().filter(x => !x.elim).indexOf(c);
    if (pos < SES.def.cut - 6 && Math.random() < 0.45) { P.shift(); return; }
  }
  P.shift(); c.goReq = mkRun(c, run.prog, aiRunComp(c, run.prog), -1);
}
// ---------- the player's runs ----------
function autoSet(W, prog) {                                    // the set the engineers would fit for this run
  const w = lineWet(), want = w > 0.13 ? idealClass(w) : PROGS[prog].mode === "q" ? "S" : "M";
  const avg = s => (s.w[0] + s.w[1] + s.w[2] + s.w[3]) / 4;
  let best = -1, bs = 1e9;
  W.sets.forEach((s, k) => { if (s.c !== want) return; const sc = PROGS[prog].mode === "q" ? avg(s) * 10 + s.l : (s.l === 0 ? 2 : 0) + avg(s) * 6; if (sc < bs) { bs = sc; best = k; } });
  if (best < 0) W.sets.forEach((s, k) => { if (best < 0 && (s.c === "M" || s.c === "H" || s.c === "S")) best = k; });
  return best;
}
function sendOut(k) {
  const c = cars[k], W = WK.car[k];
  if (!c || !c.gar || c.gar.ph !== "park" || c.elim || c.out || c.done) return;
  if (c.goReq) { c.goReq = null; return; }
  if (SES.flag || SES.over) { toast("La sesión ha terminado", true); return; }
  const prog = SES.def.kind === "q" && !PROGS[W.plan.prog].q ? "q1" : W.plan.prog;
  const si = W.plan.set >= 0 ? W.plan.set : autoSet(W, prog);
  c.goReq = mkRun(c, prog, si >= 0 ? W.sets[si].c : "M", si);
}
function callIn(k) { const c = cars[k]; if (!c || c.gar || c.done) return; if (!c.ai && !c.pitReq) radioDecide(k, "box", true); c.pitReq = true; c.toGar = true; if (c.run) c.run.left = 0; if (!c.pit && c.lt !== "in" && !timed(c)) setLT(c, "in"); toast(`${c.code} · entra a boxes esta vuelta`, false); }
// ---------- starting, finishing and simulating a session ----------
function sesWaterPlan(plan, dur, W0, dl0) {                    // water on the racing line, minute by minute
  const out = []; let W = W0, dl = dl0;
  for (let t = 0; t <= dur + 120; t += 2) {
    const A = wxAt(t, plan), R = A.R, sun = 1 - A.cloud / 100, warm = Math.max(0, 16 + 15 * sun - 9 * W - 12) / 25;
    const dry = (0.0018 + 0.004 * sun + 0.0008 * (3.1 + 2.2 * R) + 0.0016 * warm) * Math.max(0, 1 - R * 2.4);
    W = clamp01(W + (R * (1 - W) / 70 - W * dry) * 2);
    dl = clamp01(dl + ((W > 0.015 ? 0.005 : 0.03) * (1 - dl) - Math.min(1, R) * 0.02 * dl) * 2);
    if (t % 60 === 0) out.push({ wl: W * (1 - dl), R, s: A.s, cloud: A.cloud });
  }
  return out;
}
function startSession(id, sim) {
  const def = SES_DEF[id], ix = SES_IDS.indexOf(id);
  RDO.out = {}; RDO.q = []; RDO.gap = []; RDO.amb = 0;
  SES = { id, def, t: 0, flag: false, red: null, over: false, sim: !!sim, spd: 0, fl: null, plan: {}, wxs: WK.wx[id] };
  if (replay) endReplay();
  WXPLAN = wxPlan(SES.wxs, Math.ceil(def.dur / LAP_T0) + 3); WX_T0 = simClock;
  const s0 = WX_STATES[SES.wxs.start]; WATER.W = s0.R >= 1 ? 0.95 : s0.R > 0 ? 0.6 : 0; WATER.dl = s0.R > 0 ? 0.1 : 0;
  SES.wfc = sesWaterPlan(WXPLAN, def.dur, WATER.W, WATER.dl); FC = null;
  WXC = weather(simClock); WX_NOTE.s = WXC.s; WX_NOTE.cls = idealClass(lineWet()); WX_NOTE.t = 0; WX_NOTE.sc = false; WX_NOTE.heavyT = -1;
  SPRAY.length = 0; if (WET.ready) wetClear();
  SBEST = [null, null, null]; FIN_N = 0; FIN_T = -1; FL = null; YELLOW_UNTIL = -1; RED_FLAG = false;
  PARTS.length = 0; MARKS.length = 0; RMARKS.length = 0; REC.length = 0; pendingReplay = null;
  if (id === "FP1" && RUB) rubberReset();
  CELEB.on = false; CELEB.results = 0; CELEB.fw.length = 0; FINCAM.on = false; FINCAM.user = false; FINCAM.done = false; HELI.on = false; HELI.next = 20;
  initSC(); START.state = "done"; $("lights").hidden = true; $("res").hidden = true;
  // the rivals improve their set-ups session by session
  WK.car.forEach((W, k) => { if (DRIVERS[k].ai) W.aiS = Math.min(0.94, W.aiQ + [0, 0.1, 0.16, 0.2, 0.2, 0.2][Math.max(0, ix)] + (Math.random() - 0.5) * 0.04); });
  cars = DRIVERS.map(newCar);
  cars.forEach(c => {
    initTelemetry(c); c.launchAt = 0; c.vL = 999; c.launch = null; c.stints = [{ c: c.comp, a: 0 }];
    garPark(c); c.sbest = null; c.slast = null; c.sLaps = 0; c.runs = 0; c.work = 0; c.goReq = null; c.run = null; c.laps = [];
    const o = WK.out[c.idx]; if (def.kind === "q" && o) { c.elim = true; c.elimPos = o.pos; }
    c.xk = xkOf(c);
    if (c.ai && !c.elim) SES.plan[c.idx] = aiPlan(c, def);
  });
  if (resetCrews) resetCrews();
  gcReset();
  WXC = weather(simClock);
}
function sesFinish() {
  if (!SES || SES.over) return;
  SES.over = true; RED_FLAG = false; SES.red = null;
  const id = SES.id, def = SES.def, order = sesOrder(), act = order.filter(c => !c.elim), lead = act.find(c => c.sbest != null);
  const rows = order.map((c, k) => ({ idx: c.idx, pos: c.elim ? c.elimPos : k + 1, t: c.sbest, laps: c.sLaps, comp: c.sbestComp, elim: !!c.elim,
    gap: c.sbest != null && lead && !c.elim ? c.sbest - lead.sbest : null, ko: !c.elim && def.cut && act.indexOf(c) >= def.cut }));
  WK.res[id] = rows;
  rows.forEach(r => { if (r.t != null && !r.elim) WK.best[r.idx] = Math.min(WK.best[r.idx] || 1e9, r.t); });
  if (def.kind === "q") {
    rows.forEach(r => { if (r.ko) WK.out[r.idx] = { pos: r.pos, id }; });
    if (!def.cut) { WK.grid = DRIVERS.map((d, k) => { const o = WK.out[k]; return (o ? o.pos : rows.find(r => r.idx === k).pos) - 1; }); }
  }
  WK.i = Math.max(WK.i, SES_IDS.indexOf(id) + 1);
  cars.forEach(c => { c.goReq = null; });
  { const mine = rows.filter(r => !DRIVERS[r.idx].ai && !r.elim); (def.kind === "q" ? mine : mine.slice(0, 1)).forEach(r => radioEvent(cars[r.idx], "sesEnd", { p: r.pos, ko: r.ko })); }
  saveGame();                                                  // autosave after every session
  if (SES.sim) return;
  setTimeout(() => { if (SES && SES.over && SES.id === id) showSesResults(id); }, 1400);
}
// the rest of the session without watching it: every run, lap by lap, from the same lap-time model
function estK(c, comp, fuel, wearAvg, mode, wl) {
  const ws = STRAT.WS, wc = 1 - ws, pace = mode === "q" ? "agg" : "bal", mix = mode === "q" ? "rich" : "std", dep = mode === "q" ? 0.62 : 0.3;
  return 1 + c.skill + PACE[pace].k + MIX[mix].k * ws + dep * 0.03 * ws - fuel * 0.000375 + (COMP[comp].grip - wearLoss(wearAvg)) * (0.4 + 0.6 * wc)
    - wetLoss(comp, wl) * (0.55 + 0.45 * wc) + 0.009 * (satOf(c.idx) - 0.6);
}
const SIM_CAL = 1.0;
function sesWlAt(t) { const F = SES.wfc; return F ? F[Math.max(0, Math.min(F.length - 1, Math.round(t / 60)))].wl : 0; }
function playerAutoPlan(c, t0) {
  const def = SES.def, D = def.dur, P = [];
  if (def.kind === "q") { if (t0 < D * 0.45) P.push({ t: Math.max(t0, 60), prog: "q1" }); P.push({ t: Math.max(t0, D - 420), prog: "q1" }); }
  else { const seq = ["r3", "q2", "r6", "r10", "r3", "q1"]; let t = Math.max(t0, 120); for (const prog of seq) { if (t > D - 260) break; P.push({ t, prog }); t += (2 + PROGS[prog].n) * 82 + 360; } }
  return P;
}
function engineerSetup(W) {                                    // a session not watched: the engineers set the car up from the driver's feedback
  let p = W.p.slice(); const tg = SETUP_F.map((F, j) => fbWin(W, j).c);
  for (let it = 0; it < 220; it++) {
    const f = fbOf(p), g = [0, 0, 0, 0, 0];
    for (let j = 0; j < 5; j++) { const e = f[j] - tg[j]; for (let i = 0; i < 5; i++) g[i] += 2 * e * SETUP_M[j][i]; }
    p = p.map((v, i) => clamp01(v - 0.22 * g[i]));
  }
  W.p = p.map((v, i) => Math.round((W.p[i] + (v - W.p[i]) * 0.75) * SETUP_P[i].steps) / SETUP_P[i].steps); W.pend = W.p.slice(); W.eng = true;
}
function simRest() {
  if (!SES || SES.over) return;
  const def = SES.def, D = def.dur, T0 = STRAT.T, ev = [];
  cars.forEach(c => { if (!c.done && !(c.gar && c.gar.ph === "park")) garPark(c); c.goReq = null; if (c.work > 0) { c.work = 0; workDone(c); } });
  RED_FLAG = false; SES.red = null;
  for (const c of cars) {
    if (c.done || c.elim || c.out) continue;
    const W = WK.car[c.idx], runs = c.ai ? (SES.plan[c.idx] || []) : playerAutoPlan(c, SES.t);
    let t = SES.t;
    for (const r of runs) {
      t = Math.max(t, r.t);
      const P = PROGS[r.prog], outEnd = t + 55 + T0 * 1.24;
      if (outEnd > D - 1) break;
      let comp, w = 0, si = -1;
      if (c.ai) comp = (() => { const wl = sesWlAt(t); return wl > 0.13 ? idealClass(wl) : P.mode === "q" ? "S" : (Math.random() < 0.6 ? "M" : "H"); })();
      else { si = autoSet(W, r.prog); comp = si >= 0 ? W.sets[si].c : "M"; if (si >= 0) w = W.sets[si].w.reduce((a, b) => a + b, 0) / 4; }
      let fuel = (2 + P.n + (P.cool ? P.n - 1 : 0)) * FUEL_BASE * 1.12, tt = outEnd, laps = 1;
      ev.push({ c, t: t + 60, lt: "out" });
      for (let j = 0; j < P.n; j++) {
        if (tt > D) break;
        const wl = sesWlAt(tt), k0 = estK(c, comp, fuel, w, P.mode, wl);
        const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 0.0016, traffic = Math.random() < 0.12 ? 0.1 + Math.random() * 0.5 : 0;
        const valid = Math.random() > (P.mode === "q" ? (c.ai ? 0.03 : 0.045) : 0.012);
        ev.push({ c, t: tt, lt: P.mode === "q" ? "push" : "run", k0, noise, traffic, valid, comp });
        const lt = T0 / k0; tt += lt; laps++;
        w += wearLap(comp, P.mode === "q" ? "agg" : "bal", fuel, wl) / TYRE_BIAS[0]; fuel -= FUEL_BASE;
        if (P.cool && j < P.n - 1) { tt += T0 * 1.3; ev.push({ c, t: tt, lt: "cool" }); laps++; }
      }
      ev.push({ c, t: tt + 40, lt: "in" });
      if (si >= 0) { const s = W.sets[si]; s.w = [w * 1.15, w, w * 0.95, w * 0.9].map(x => Math.min(1, x)); s.l += laps; }
      W.runs++; c.runs++;
      t = tt + T0 * 1.25 + 40 + (def.kind === "q" ? 40 : 110 + Math.random() * 200);
    }
  }
  ev.sort((a, b) => a.t - b.t);
  for (const e of ev) {                                         // in time order, so the track evolution is fair to everybody
    const c = e.c; WK.evoLaps++; learn(c, e.lt);
    if (e.lt !== "push" && e.lt !== "run") continue;
    const lt = T0 / (e.k0 + trackEvo()) * (1 + e.noise) * SIM_CAL + e.traffic;
    c.sLaps++;
    if (e.valid && (c.sbest == null || lt < c.sbest)) { c.sbest = lt; c.sbestAt = e.t; c.sbestComp = e.comp; if (!SES.fl || lt < SES.fl.t) SES.fl = { t: lt, idx: c.idx }; }
  }
  if (SES.plan) Object.values(SES.plan).forEach(P => P.length = 0);
  SES.t = D; SES.flag = true;
  cars.forEach(c => { if (!c.ai && SES.sim && def.kind === "fp" && WK.car[c.idx].laps) engineerSetup(WK.car[c.idx]); });
  cars.forEach(c => { c.xk = xkOf(c); if (!c.ai && WK.car[c.idx].laps && SES.def.kind === "fp") WK.car[c.idx].said = feedbackLine(c); });
  sesFinish();
}
function sesClose() {
  SES = null; RED_FLAG = false; document.body.classList.remove("ses"); $("bSpeed").textContent = "×" + SPEEDS[speedIdx];
  ["sesbar", "sd0", "sd1", "radio", "pop"].forEach(k => { const e = $(k); if (e) e.hidden = true; });
  if ($("setup")) $("setup").hidden = true; $("sres").hidden = true;
}
// ---------- radio messages from the drivers ----------
function radio(c, text) { radioEvent(c, "feedback", { text }); }
// =====================================================================================================
// ---------- team radio: the team principal, the race engineer and the driver of each car ----------
// One small card at the top centre (name in the team colour, RADIO, the waveform, the quote). Messages follow what
// happens and what you decide; on their own they come about every 2-3 minutes of real time, never in a flood.
// =====================================================================================================
const RDO = { q: [], cur: null, end: 0, last: -1e9, amb: 0, cd: {}, el: null, rect: null, out: {}, beh: {}, wx: null, gap: [] };
const rnow = () => performance.now() / 1000;
const pick = a => a[(Math.random() * a.length) | 0];
const RLINES = {
  check: [["Radio check, {n}.", "Alto y claro."], ["{n}, radio check. ¿Me recibes?", "Te recibo perfectamente."], ["Comprobación de radio, {n}.", "Sí, te oigo bien. Todo OK."],
    ["Radio check, ¿cómo me oyes?", "Loud and clear."], ["{n}, ¿me oyes bien?", "Perfecto, todo bien por aquí."]],
  box: ["Box, box. Box, box.", "Box esta vuelta, box esta vuelta.", "{n}, box, box. Confirma.", "Box, box. Ponemos {c}.", "Entra esta vuelta. Box, box."],
  boxOk: ["Copy, entro.", "Entendido, box.", "Recibido.", "OK, box esta vuelta."],
  boxS: ["Box, box, {n}. Vuelve al garaje esta vuelta.", "Terminamos la tanda. Box esta vuelta.", "Box, box. Queremos tocar cosas en el coche.", "Suficiente, {n}. Box, box."],
  stay: ["Cancela, cancela. Quédate fuera.", "Stay out, stay out.", "Olvida el box, seguimos fuera."],
  agg: ["Push now, {n}. Push, push.", "Es el momento, empuja.", "Necesitamos ritmo. Máximo ataque.", "Todo lo que tengas, {n}. Push."],
  aggTP: ["{n}, aquí nos jugamos la carrera. Push.", "Ahora o nunca, {n}. A por ello.", "Tenemos que apretar ya. Push."],
  aggOk: ["Copy, voy a tope.", "Vale, empujo.", "Entendido, al límite.", "Copy."],
  soft: ["Gestiona los neumáticos. Lift and coast en la 1 y la 10.", "Baja el ritmo, cuida las gomas.", "Ritmo más suave, protege el tren trasero.", "Gestiona, {n}. No hace falta más."],
  bal: ["Ritmo normal, {n}. Mantén el delta.", "Vuelve a ritmo de carrera, sin riesgos.", "Ritmo objetivo, ni más ni menos."],
  ers: { overtake: ["Overtake disponible. Úsalo.", "Modo overtake, modo overtake. Ataca en la recta."], attack: ["Modo ataque. Tienes batería.", "Despliega más en las rectas, vamos a por él."],
    defend: ["Modo defensa. Protege la posición en la 1.", "Defiende, {n}. Batería para las salidas de curva."], charge: ["Recarga, recarga. Necesitamos batería.", "Cambia a recarga, vamos justos para la recta."],
    neutral: ["ERS en modo estándar.", "Vuelve al ERS normal, {n}."] },
  mix: { rich: ["Mezcla HIGH. Gástala bien.", "Motor a tope, mezcla HIGH."], lean: ["Mezcla LOW. Ahorra combustible, vamos justos.", "Ahorra gasolina, {n}. Mezcla LOW."], std: ["Mezcla estándar."] },
  contact: ["¡Me ha tocado {o}!", "Contacto con {o}. ¿Veis algo en el coche?", "¡{o} me ha dado! Creo que hay daños.", "Toque con {o}, el coche va raro."],
  contactR: ["Recibido, revisamos los datos.", "Lo vemos. Sigue, de momento todo bien.", "Copy. Te decimos algo en un momento."],
  damage: ["Tenemos daño en el {p}. Vigilamos.", "Vemos daño en el {p}, cuidado en las curvas rápidas."],
  stuck: ["No puedo acercarme, en la recta es muy rápido.", "Pierdo la carga en el aire sucio, no puedo seguirle.", "Me está costando mucho pasarle.", "Es imposible adelantar aquí, va muy rápido en recta."],
  stuckR: ["Entendido. Guarda batería para el final de la recta.", "Paciencia, sus neumáticos están peor.", "Copy. Prueba por fuera en la curva 1.", "Sigue presionando, cometerá un error."],
  behind: ["{o} a {g} detrás. Defiende la curva 1.", "{o} se acerca, {g}. Ojo en la recta.", "Tienes a {o} a {g}. Cuidado con su DRS."],
  stopGood: ["Buena parada, {s} segundos.", "Parada limpia, {s}. Vamos."],
  stopBad: ["Parada lenta, {s}. Lo siento, problema en una rueda.", "Hemos perdido tiempo en la parada, {s}. Lo siento."],
  spin: ["Lo siento, he perdido la trasera.", "¡Trompo! Sigo, sigo.", "Perdón, me he ido."],
  wall: ["¡Me he dado contra el muro!", "¡Accidente! Estoy bien, pero el coche no."],
  wallR: ["¿Estás bien, {n}?", "Recibido. Lo importante es que estás bien."],
  punct: ["¡Pinchazo! ¡Pinchazo!", "¡Tengo un pinchazo!"],
  punctR: ["Box, box. Tenemos los neumáticos listos.", "Entra con cuidado, box, box."],
  pb: ["Buena vuelta, {t}. P{p}.", "Vuelta mejorada. P{p}.", "Bien, {n}. {t}, P{p}."],
  fast: ["¡Eres el más rápido, {n}! P1.", "¡Morado! Lo más rápido de la sesión."],
  traffic: "Me han estorbado en la vuelta, se puede ir más rápido.",
  rain: ["Empieza a llover en la curva 10.", "Gotas en la visera. Está empezando a llover.", "Llueve en el sector 3."],
  rainR: ["Recibido, preparamos intermedios.", "Copy. Te decimos cuándo entrar."],
  dry: ["La pista se está secando, la línea está seca.", "Ya hay una línea seca."]
};
const fillT = (s, o) => s.replace(/\{(\w)\}/g, (m, k) => o[k] != null ? o[k] : m);
function rSay(k, lines, pri, key) {             // lines: [[who ("drv" | "eng" | "tp"), text], ...]
  if (!RDO.el || replay || (SES && SES.sim) || !cars[k] || cars[k].ai || OPT.radio === "off" || OPT.radio === "imp" && pri < 3) return;
  const t = rnow();
  if (key) { if (RDO.cd[key] && t - RDO.cd[key] < (pri >= 3 ? 14 : 70)) return; RDO.cd[key] = t; }
  const c = cars[k], o = { n: FIRST[c.code] || c.name, ...(lines.o || {}) };
  if (window.I18N) ["c", "p"].forEach(x => { if (o[x]) o[x] = I18N.t(o[x]); });
  const items = lines.map(([who, txt]) => ({ k, who, txt: fillT(window.I18N ? I18N.t(txt) : txt, o) })), at = t, over = /^end/.test(key || "");
  if (pri >= 3) { RDO.q = RDO.q.filter(m => m.pri >= 3).slice(-2); RDO.q.push({ items, pri, at, over }); return; }
  if (RDO.cur || RDO.q.length) return;                             // the radio is busy: an ordinary message is not worth waiting for
  if (PW.open || !$("setup").hidden || !$("sres").hidden || !$("res").hidden) return;
  if (pri === 2 && t - RDO.last < 55) return;
  RDO.q.push({ items, pri, at, over });
}
function hudBottom() {                                       // phones: messages go under the timing cards, whatever their height
  const h = document.querySelector(".hud"); if (!h) return;
  let b = 0; for (const e of h.children) b = Math.max(b, e.getBoundingClientRect().bottom);
  if (b > 0) document.documentElement.style.setProperty("--hudb", Math.round(b + 8) + "px");
}
addEventListener("resize", hudBottom);
function rShow(m) {
  hudBottom();
  const el = RDO.el, c = cars[m.k], who = m.who;
  const name = who === "drv" ? c.name : who === "eng" ? L("Ingeniero", "Engineer") : L("Jefe de equipo", "Team Principal"), fs = name.length > 11 ? 15 : name.length > 8 ? 18 : 21;
  el.style.setProperty("--tc", c.col);
  el.querySelector(".rdk").innerHTML = `<i>${c.num}</i>${c.code}`;
  const n = el.querySelector(".rdn"); n.textContent = name; n.style.setProperty("--fs", fs + "px");
  el.querySelector(".rdq").textContent = m.txt;
  el.hidden = false; el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
  RDO.rect = null; RDO.end = rnow() + Math.min(7.5, Math.max(3.6, 2.2 + m.txt.split(/\s+/).length * 0.36));
}
function radioStep() {
  const el = RDO.el; if (!el) return;
  const t = rnow(), blocked = replay || MENU.step || (SES && SES.sim) || START.state === "grid" || START.state === "lights" || START.state === "go";
  const cover = PW.open || !$("setup").hidden, res = !$("sres").hidden || !$("res").hidden;
  if (RDO.cur && t >= RDO.end) {                                       // this line is over: the next one of the exchange, or silence
    const nx = RDO.cur.items.shift();
    if (nx && !blocked && !cover && (!res || RDO.cur.over)) { RDO.gapT = t + 0.35; RDO.next = nx; } else RDO.cur = null;
    el.classList.remove("on"); RDO.end = Infinity;
    clearTimeout(RDO.hideT); RDO.hideT = setTimeout(() => { if (!el.classList.contains("on")) el.hidden = true; }, 320);
    document.documentElement.style.removeProperty("--tt");
  }
  if (RDO.next && t >= RDO.gapT) { const m = RDO.next; RDO.next = null; rShow(m); return; }
  RDO.q = RDO.q.filter(m => t - m.at < 25);                          // old news is not read out
  if (!RDO.cur && RDO.q.length && !blocked && !paused && !cover && (!res || RDO.q[0].over)) {
    RDO.cur = RDO.q.shift(); RDO.last = t; rShow(RDO.cur.items.shift()); return;
  }
  if (RDO.cur && el.classList.contains("on") && (cover || res && !RDO.cur.over)) { RDO.end = Math.min(RDO.end, t); }
  if (el.classList.contains("on")) {                                   // never over the car: fade away if a car of ours is under the card
    if (!RDO.rect) { RDO.rect = el.getBoundingClientRect(); document.documentElement.style.setProperty("--tt", Math.round(RDO.rect.bottom + 6) + "px"); }
    const r = RDO.rect; let under = false;
    if (!MENU.step) for (const k of [0, 1]) { const c = cars[k]; if (!c || c.done && !c.cool) continue; const p = carPos(c), [x, y] = mapToScreen(p.x, p.y);
      if (x > r.left - 28 && x < r.right + 28 && y > r.top - 28 && y < r.bottom + 28) under = true; }
    el.classList.toggle("ghost", under);
  }
  const rp = $("replay");                                              // the replay box: toasts go below it
  if (!rp.hidden) { document.documentElement.style.setProperty("--tt", Math.round(rp.getBoundingClientRect().bottom + 6) + "px"); RDO.rpt = 1; }
  else if (RDO.rpt) { RDO.rpt = 0; if (!el.classList.contains("on")) document.documentElement.style.removeProperty("--tt"); else RDO.rect = null; }
  if (!blocked && !paused && !RDO.cur && !RDO.q.length) radioWatch(t);
}
// what happens on track, looked at a few times a second
function radioWatch(t) {
  if (t - (RDO.wt || 0) < 0.5) return; RDO.wt = t;
  if (!RDO.amb) RDO.amb = t + 25 + Math.random() * 25;
  const live = k => { const c = cars[k]; return c && !c.ai && c.started !== false && !c.done && !c.gar && !c.pit && !c.inc; };
  // the first time a car is out on track: radio check
  if (SES) for (const k of [0, 1]) { const c = cars[k]; if (live(k) && !RDO.out[k + (SES ? SES.id : "R")]) { RDO.out[k + (SES ? SES.id : "R")] = 1; if (t - RDO.last > 20) { const L = pick(RLINES.check); rSay(k, [["eng", L[0]], ["drv", L[1]]], 2); return; } } }
  if (!SES && racing()) {                                              // race: stuck behind, under pressure
    const ord = raceOrder();
    for (const k of [0, 1]) {
      const c = cars[k]; if (!live(k)) continue; const i = ord.indexOf(c), a = ord[i - 1], b = ord[i + 1];
      if (a && !a.pit) { const g = gapTo(c, a).s; RDO.gap[k] = g != null && g < 0.9 ? (RDO.gap[k] || 0) + 0.5 : 0;
        if (RDO.gap[k] > 75) { RDO.gap[k] = 0; rSay(k, [["drv", pick(RLINES.stuck)], ["eng", pick(RLINES.stuckR)]], 2, "stuck" + k); return; } }
      if (b && !b.pit) { const g = gapTo(b, c).s; RDO.beh[k] = g != null && g < 0.8 ? (RDO.beh[k] || 0) + 0.5 : 0;
        if (RDO.beh[k] > 50) { RDO.beh[k] = 0; const L = [["eng", pick(RLINES.behind)]]; L.o = { o: b.name, g: g.toFixed(1).replace(".", ",") + " s" }; rSay(k, L, 2, "beh" + k); return; } }
    }
  }
  const wet = WXC.R > 0.05;                                            // the rain starts, or the line dries
  if (RDO.wx == null) RDO.wx = wet;
  if (wet !== RDO.wx) { RDO.wx = wet; const k = live(0) ? 0 : live(1) ? 1 : -1; if (k >= 0) { rSay(k, wet ? [["drv", pick(RLINES.rain)], ["eng", pick(RLINES.rainR)]] : [["drv", pick(RLINES.dry)]], 2); return; } }
  if (t < RDO.amb || t - RDO.last < 100) return;                       // otherwise: something every 2-3 minutes
  RDO.amb = t + 120 + Math.random() * 60;
  radioAmbient();
}
function radioAmbient() {
  const on = [0, 1].filter(k => cars[k] && !cars[k].done && !cars[k].gar && !cars[k].pit && cars[k].started !== false);
  if (SES) {
    if (!on.length) { if (SES.def.kind === "fp" && !SES.over) rSay(0, [["tp", pick(["Hay huecos en pista ahora, buen momento para salir.", "La pista está mejorando. Preparamos la siguiente salida.", "Tranquilos, seguimos con el programa."])]], 1); return; }
    const k = pick(on), c = cars[k], W = WK.car[k];
    const o = []; o.o = { g: Math.round(gripPct()) + " %", t: c.sbest ? fmt(c.sbest) : "" };
    const opts = [
      () => [["eng", "La pista mejora, el agarre está en {g}."]],
      () => [["eng", pick(["Viento de cara en la recta. Cuidado en la frenada de la 1.", "Viento de cola en la 10, frena un poco antes."])]],
      () => c.sbest ? [["eng", "Tu mejor vuelta es {t}. Hay más en el sector 3."]] : [["eng", "Primera vuelta lanzada a continuación. Neumáticos en temperatura."]],
      () => [["eng", "¿Cómo va el coche, {n}?"], ["drv", W.said || "Todavía aprendiendo, dame unas vueltas."]],
      () => [["tp", pick(["Buen trabajo hasta ahora. Seguimos el plan.", "Los datos son buenos, seguimos así."])]],
      () => [["eng", "Tráfico detrás. Deja pasar al coche rápido en la recta."], ["drv", "Copy."]]
    ];
    const L = pick(opts)(); L.o = o.o; rSay(k, L, 1);
    return;
  }
  if (!on.length || !racing()) return;
  const k = pick(on), c = cars[k], ord = raceOrder(), i = ord.indexOf(c), a = ord[i - 1], b = ord[i + 1], left = Math.max(0, RACE_LAPS - c.lap + 1);
  const wr = Math.max(...c.wear), ga = a ? gapTo(c, a).s : null, gb = b ? gapTo(b, c).s : null, f = x => x == null ? "—" : x.toFixed(1).replace(".", ",") + " s";
  const opts = [
    () => [["eng", `P${i + 1}. ${a ? `Delante ${a.name} a ${f(ga)}` : "Lideras la carrera"}${b ? `, detrás ${b.name} a ${f(gb)}` : ""}.`]],
    () => [["eng", "¿Cómo van los neumáticos, {n}?"], ["drv", wr > 0.6 ? "Se están acabando, la trasera sufre mucho." : wr > 0.35 ? "Bien, pero empiezan a caer." : "Bien, todavía tienen vida."]],
    () => [["eng", `Quedan ${left} vueltas. Sigue así.`]],
    () => [["tp", pick(["Buen trabajo, {n}. Seguimos el plan.", "Muy buen ritmo, {n}. Tranquilo.", "Todo el equipo está contigo, {n}."])]],
    () => [["eng", "Batería al " + Math.round(c.batt / BATT_MAX * 100) + " %. Úsala en la recta principal."]]
  ];
  rSay(k, pick(opts)(), 1);
}
// ---------- what you decide: the engineer and the boss answer ----------
function radioDecide(k, kind, v) {
  const c = cars[k]; if (!c) return;
  if (kind === "pace") {
    if (v === "agg") { const tp = Math.random() < 0.35, L = [[tp ? "tp" : "eng", pick(tp ? RLINES.aggTP : RLINES.agg)]]; if (Math.random() < 0.6) L.push(["drv", pick(RLINES.aggOk)]); rSay(k, L, 3, "pace" + k); }
    else if (v === "soft") rSay(k, Math.random() < 0.5 ? [["eng", pick(RLINES.soft)], ["drv", "Entendido."]] : [["eng", pick(RLINES.soft)]], 3, "pace" + k);
    else rSay(k, [["eng", pick(RLINES.bal)]], 3, "pace" + k);
  } else if (kind === "ers") rSay(k, [["eng", pick(RLINES.ers[v] || RLINES.ers.neutral)]], 3, "ers" + k);
  else if (kind === "mix") rSay(k, [["eng", pick(RLINES.mix[v] || RLINES.mix.std)]], 3, "mix" + k);
  else if (kind === "box") {
    if (!v) { rSay(k, [["eng", pick(RLINES.stay)]], 3, "box" + k + "n"); return; }
    const L = SES ? [["eng", pick(RLINES.boxS)]] : [["eng", pick(RLINES.box)]];
    if (Math.random() < 0.6) L.push(["drv", pick(RLINES.boxOk)]);
    L.o = { c: c.nextComp ? COMP[c.nextComp].name.toLowerCase() + "s" : "" }; rSay(k, L, 3, "box" + k + "y");
  }
}
// ---------- events ----------
function radioEvent(c, kind, o = {}) {
  if (!c || c.ai) return; const k = c.idx;
  const R = (lines, pri, key) => { lines.o = o; rSay(k, lines, pri, key); };
  if (kind === "contact") { const L = [["drv", pick(RLINES.contact)], ["eng", pick(RLINES.contactR)]]; if (o.p) L.push(["eng", pick(RLINES.damage)]); R(L, 3, "con" + k); }
  else if (kind === "spin") R([["drv", pick(RLINES.spin)]], 3, "inc" + k);
  else if (kind === "wall") R([["drv", pick(RLINES.wall)], ["eng", pick(RLINES.wallR)]], 3, "inc" + k);
  else if (kind === "punct") R([["drv", pick(RLINES.punct)], ["eng", pick(RLINES.punctR)]], 3, "pun" + k);
  else if (kind === "stop") R([["eng", pick(o.bad ? RLINES.stopBad : RLINES.stopGood)]], 2, "stop" + k);
  else if (kind === "pb") R([["eng", pick(o.fast ? RLINES.fast : RLINES.pb)]], 2, "pb" + k);
  else if (kind === "feedback") R([["drv", o.text]], 3, "fb" + k);
  else if (kind === "traffic") R([["drv", RLINES.traffic]], 2, "trf" + k);
  else if (kind === "sesEnd") {
    const p = o.p, q = SES && SES.def.kind === "q", id = SES ? SES.id : "";
    const txt = !q ? pick([`Bandera a cuadros. P${p}. Buen trabajo, {n}.`, `Fin de la sesión, P${p}. Seguimos trabajando en el coche.`, `Eso es todo. P${p}. Buenos datos, gracias.`])
      : o.ko ? pick([`Eliminados, P${p}. Lo siento, {n}.`, `No ha sido suficiente, P${p}. Lo siento.`])
      : id === "Q3" ? (p === 1 ? "¡POLE POSITION! ¡Increíble vuelta, {n}!" : `Saldremos P${p} mañana. Buen trabajo.`) : `Pasamos a ${id === "Q1" ? "Q2" : "Q3"}. P${p}, bien hecho.`;
    const L = [[q && p === 1 && id === "Q3" ? "tp" : "eng", txt]]; if (q && !o.ko && id === "Q3" && p <= 3) L.push(["drv", "¡Vamos! ¡Gracias, chicos!"]); R(L, 3, "end" + k);
  } else if (kind === "raceEnd") {
    const p = o.p, txt = p === 1 ? "¡GANAMOS! ¡Ganamos la carrera, {n}!" : p <= 3 ? `¡Podio! P${p}. Increíble trabajo, {n}.` : p <= 10 ? `Bandera a cuadros, P${p}. Puntos importantes.` : `Bandera a cuadros, P${p}. Mañana seguimos trabajando.`;
    R([["tp", txt], ["drv", p <= 3 ? "¡Vamos! ¡Gracias a todo el equipo!" : "Gracias, chicos. Hay que mejorar."]], 3, "end" + k);
  }
}
RDO.el = $("rdo");

// ---------- session UI: the strip at the top (clock, track saturation, forecast), the two car cards, the set-up screen ----------
const SES_SPD = [1, 4, 16, 40];
const fmtMS = t => { t = Math.max(0, Math.ceil(t)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const LT_NAME = { out: "Vuelta de salida", push: "Vuelta rápida", run: "Tanda", cool: "Enfriando", in: "Vuelta de entrada" };
function carStatus(c) {
  if (c.elim) return ["Eliminado", "out"];
  if (c.out || c.dnf) return ["Fuera · daños", "bad"];
  if (c.gar) {
    const G = c.gar;
    if (G.ph === "park") { if (c.work > 0) return [`Mecánicos · ${fmtMS(c.work)}`, "work"]; if (c.goReq) return [canLeave(c) ? "Saliendo" : SES && (SES.red || SES.flag) ? "Bandera: no sale" : "Esperando hueco", "wait"]; return ["En el garaje", "gar"]; }
    return [G.ph === "exit" ? "Sale del garaje" : "Al garaje", "pit"];
  }
  if (c.pit) return [c.pit.served ? "Pit lane · sale" : "Entrando a boxes", "pit"];
  return [LT_NAME[c.lt] || "En pista", c.lt || "run"];
}
// cars on track now, and what the plans say for every minute that is left
function sesTraffic() {
  const D = SES.def.dur, t0 = SES.t, nb = Math.max(1, Math.min(60, Math.ceil((D - t0) / 60) + 1)), bins = new Array(nb).fill(0), T0 = STRAT.T;
  let now = 0;
  const cover = (a, b) => { for (let k = 0; k < nb; k++) { const m0 = t0 + k * 60, m1 = m0 + 60; if (b > m0 && a < m1) bins[k]++; } };
  for (const c of cars) {
    if (c.done || c.elim) continue;
    const onTrack = !c.gar || c.gar.ph !== "park";
    if (onTrack) { now++; const R = c.run || { left: 0 }; cover(t0, t0 + (R.left * (R.cool ? 2.1 : 1) + 1.3) * T0 + 30); }
    else if (c.goReq) { const R = c.goReq; cover(t0 + 30, t0 + 60 + (2 + R.n + (R.cool ? R.n - 1 : 0)) * T0 * 1.08); }
    if (c.ai && SES.plan[c.idx]) for (const r of SES.plan[c.idx]) { const P = PROGS[r.prog], a = Math.max(r.t, t0) + 30; if (a > D) continue; cover(a, a + (2 + P.n + (P.cool ? P.n - 1 : 0)) * T0 * 1.08 + 30); }
  }
  return { now, bins };
}
const SAT_LV = n => n <= 3 ? ["Baja", "#22d38a"] : n <= 7 ? ["Media", "#ffd21f"] : n <= 11 ? ["Alta", "#ff8a1f"] : ["Muy alta", "#ff2a3c"];
function drawSatChart(tr) {
  const cv = $("sbSat"); if (!cv) return;
  const { g, w, h } = cvFit(cv), n = tr.bins.length, bw2 = w / Math.max(n, 12);
  g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(0, 0, w, h);
  tr.bins.forEach((v, k) => { const hh = Math.max(1.5, Math.min(1, v / 16) * (h - 3)); g.fillStyle = SAT_LV(v)[1]; g.globalAlpha = k ? 0.75 : 1; g.fillRect(k * bw2 + 0.5, h - hh, Math.max(1, bw2 - 1), hh); });
  g.globalAlpha = 1;
  // the quietest stretch of the next minutes: a good moment to go out
  if (n > 4) { let best = 1, bv = 1e9; for (let k = 1; k < Math.min(n - 2, 30); k++) { const v = tr.bins[k] + tr.bins[k + 1]; if (v < bv) { bv = v; best = k; } }
    g.strokeStyle = "#eef1f5"; g.lineWidth = 1; g.setLineDash([2, 2]); g.beginPath(); g.moveTo(best * bw2 + bw2, 0); g.lineTo(best * bw2 + bw2, h); g.stroke(); g.setLineDash([]); }
}
function sesWxIcons() {
  const D = SES.def.dur, step = SES.def.kind === "q" ? 240 : 600, out = [];
  for (let k = 0; k < 5; k++) {
    const t = SES.t + k * step; if (k && t > D + 1) break;
    const A = wxAt(t), R = A.R;
    out.push(`<span title="${WX_STATES[A.s].name}">${wxIcon(A.s, 15)}<i>${k ? "+" + Math.round(k * step / 60) + "'" : "Ahora"}</i></span>`);
  }
  return out.join("");
}
function sesHud() {
  if (!SES) return;
  const sp = "×" + SES_SPD[SES.spd]; if ($("bSpeed").textContent !== sp) $("bSpeed").textContent = sp;
  const b = $("bSes"), over = !!SES.over;
  if (b.classList.contains("over") !== over) {
    b.classList.toggle("over", over); b.classList.remove("armed"); b.textContent = over ? "🏁" : "⏭";
    b.title = over ? "Resultados de la sesión" : "Simular el resto de la sesión"; b.setAttribute("aria-label", b.title);
  }
  ui.forEach(u => u.ses());
  if (!$("setup").hidden) setupLive();
}
// ---------- the two car cards at the bottom ----------
function sesCard(k) { if (ui[k]) ui[k].ses(); }        // the driver panels of the race, with the garage controls
function cardClick(k, a, btn) {
  const c = cars[k], W = WK.car[k];
  if (a === "go") sendOut(k);
  else if (a === "box") callIn(k);
  else if (a === "setup") openSetup(k);
  else if (a === "prog") {
    const q = SES.def.kind === "q";
    openPop(btn, Object.entries(PROGS).filter(([id, P]) => q ? P.q : P.fp).map(([id, P]) => ({ v: id, on: W.plan.prog === id, html: `<b>${P.short}</b><span>${P.name}</span>` })), v => { W.plan.prog = v; });
  } else if (a === "set") {
    const avg = s => (s.w[0] + s.w[1] + s.w[2] + s.w[3]) / 4;
    const items = [{ v: -1, on: W.plan.set < 0, html: `<b>Automático</b><span>El ingeniero elige el juego</span>` }]
      .concat(W.sets.map((s, j) => ({ v: j, on: W.plan.set === j, html: `${tyreImg(s.c, "sm")}<b>${COMP[s.c].name}</b><span>${s.l ? `${s.l} v · ${Math.round(avg(s) * 100)} % desgaste` : "Nuevo"}</span>` })));
    openPop(btn, items, v => { W.plan.set = +v; });
  }
  sesCard(k);
}
[0, 1].forEach(k => { const el = $("sd" + k); el.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (!b || b.disabled) return; cardClick(k, b.dataset.a, b); }); });
// ---------- popover lists ----------
function openPop(anchor, items, cb) {
  const p = $("pop"); p.innerHTML = items.map((it, j) => `<button data-j="${j}" aria-pressed="${!!it.on}">${it.html}</button>`).join("");
  p.hidden = false; const r = anchor.getBoundingClientRect(), pw = Math.min(260, innerWidth - 16);
  p.style.width = pw + "px"; p.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.left + r.width / 2 - pw / 2)) + "px";
  p.style.bottom = (innerHeight - r.top + 6) + "px"; p.style.maxHeight = Math.max(120, r.top - 20) + "px";
  p.onclick = e => { const b = e.target.closest("[data-j]"); if (!b) return; cb(items[+b.dataset.j].v); p.hidden = true; if (SES) [0, 1].forEach(sesCard); if (!$("setup").hidden) renderSetup(); };
}
addEventListener("pointerdown", e => { const p = $("pop"); if (!p.hidden && !p.contains(e.target) && !e.target.closest(".sdr,.surun,.garctl")) p.hidden = true; }, true);
// ---------- the strip controls ----------
$("sbSpd").onclick = e => { const b = e.target.closest("[data-k]"); if (b && SES) { SES.spd = +b.dataset.k; if (paused) togglePause(); sesHud(); pwCtlSync(); } };
$("sbSim").onclick = () => {
  if (!SES || SES.over) return;
  if (!confirmSim()) return;
  simRest();
};
function confirmSim() {                                       // two taps: it ends the session
  const b = $("sbSim");
  if (b.dataset.arm) { delete b.dataset.arm; b.textContent = "Simular ⏭"; return true; }
  b.dataset.arm = 1; b.textContent = "¿Seguro? ⏭"; clearTimeout(confirmSim.h);
  confirmSim.h = setTimeout(() => { delete b.dataset.arm; b.textContent = "Simular ⏭"; }, 3000); return false;
}
$("sbRes").onclick = () => { if (SES && SES.over) showSesResults(SES.id); };
$("sbNext").onclick = () => { $("sres").hidden = true; sesClose(); if (WK && WK.test) { sTestEnd(); openHQ(); } else menuShow("weekend"); };
// ---------- the team garage ("box"): the two cars on their marks, the blue parts of the picture in the team's colours ----------
// assets/img/box_m.png maps the blue parts: R = 1 primary / 2 secondary, G = shading × 100, B = how blue the pixel is. Only those pixels change.
const GARV = { W: 1920, H: 1072, LEN: 455, bays: [[507, 686], [1448, 686]], rect: [[310, 431, 703, 940], [1236, 431, 1659, 940]], floor: 984,
  img: new Image(), mask: new Image(), m: null, base: {}, fx: [], last: 0 };
GARV.img.src = "assets/img/box.jpg"; GARV.mask.src = "assets/img/box_m.png";
[GARV.img, GARV.mask].forEach(im => im.addEventListener("load", () => { GARV.base = {}; drawGarage(true); }));
const BOX_COL = {                                             // primary (walls, back panels) and secondary (stripes, divider, tool chests)
  mcl: ["#ff8000", "#2b2d31"], mer: ["#00a19c", "#c8ced3"], rbr: ["#1e2a5e", "#e3192b"], fer: ["#d4001a", "#1d1d1f"], wil: ["#0c3596", "#00a0de"],
  rcb: ["#1e41ff", "#eef0f5"], amr: ["#0d5e4a", "#cedc00"], haa: ["#c9cdd1", "#d91a1a"], aud: ["#d42a1e", "#2a2c30"], alp: ["#1f5fd0", "#ff87bc"], cad: ["#2a2b2f", "#c4ad74"] };
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function garBase(team) {                                      // the garage in the team's colours, its logo on the floor (cached)
  if (GARV.base[team]) return GARV.base[team];
  if (!GARV.img.complete || !GARV.img.naturalWidth) return null;
  const W = GARV.W, H = GARV.H, c = mkCanvas(W, H), g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(GARV.img, 0, 0, W, H);
  if (!GARV.mask.complete) return c;                           // not cached yet: comes back when the map has loaded
  if (GARV.mask.naturalWidth) try {
    if (!GARV.m) { const m = mkCanvas(W, H).getContext("2d", { willReadFrequently: true }); m.drawImage(GARV.mask, 0, 0); GARV.m = m.getImageData(0, 0, W, H).data; }
    const im = g.getImageData(0, 0, W, H), D = im.data, M = GARV.m, [p, s2] = BOX_COL[team] || [TEAMS[team].col, "#202226"];
    const LP = tpLut(p, 0), LS = tpLut(s2, 0);
    for (let o = 0; o < D.length; o += 4) {
      const a = M[o + 2]; if (!a) continue;
      const U = M[o] === 2 ? LS : LP, k = M[o + 1] * 3, w = a / 255;
      D[o] += (U[k] - D[o]) * w; D[o + 1] += (U[k + 1] - D[o + 1]) * w; D[o + 2] += (U[k + 2] - D[o + 2]) * w;
    }
    g.putImageData(im, 0, 0);
  } catch (e) { }
  const lg = LOGO[team];                                       // the team logo painted on the floor of the aisle between the engineers' desks
  if (!lg || !lg.complete) return c;
  if (lg.naturalWidth) {
    const k = Math.min(168 / lg.naturalWidth, 150 / lg.naturalHeight), w = Math.round(lg.naturalWidth * k), h = Math.round(lg.naturalHeight * k);
    const d = mkCanvas(w, h), dg = d.getContext("2d"); dg.drawImage(lg, 0, 0, w, h);
    const [p1, p2] = BOX_COL[team] || [TEAMS[team].col, TEAMS[team].col], lum = h2 => { const [r, g2, b2] = hex2rgb(h2); return (.299 * r + .587 * g2 + .114 * b2) / 255; };
    if (!LOGO_COLOR[team]) { dg.globalCompositeOperation = "source-in"; dg.fillStyle = lum(p1) < .3 ? p2 : p1; dg.fillRect(0, 0, w, h); }   // dark primaries: the logo in the secondary colour
    g.save(); g.globalAlpha = .82; g.drawImage(d, 1068 - w / 2, 212 - h / 2); g.restore();
  }
  return (GARV.base[team] = c);
}
function garFx(k) {                                           // the car's colour bounce and its mirror image on the shiny floor
  if (GARV.fx[k]) return GARV.fx[k];
  const spr = carSprites[k]; if (!spr) return null;
  const sm = mkCanvas(Math.round(CELL_W / 9), Math.round(CELL_H / 9)); sm.getContext("2d").drawImage(spr, 0, 0, sm.width, sm.height);
  const glow = mkCanvas(CELL_W / 2, CELL_H / 2), gg = glow.getContext("2d"); gg.imageSmoothingQuality = "high"; gg.drawImage(sm, 0, 0, glow.width, glow.height);
  const R = mkCanvas(CELL_W, CELL_H), rg = R.getContext("2d");
  rg.translate(CELL_W, 0); rg.scale(-1, 1); rg.drawImage(spr, 0, 0); rg.setTransform(1, 0, 0, 1, 0, 0);   // mirrored about the nose
  rg.globalCompositeOperation = "destination-in";
  const gr = rg.createLinearGradient(0, 0, CELL_W * 0.6, 0); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  rg.fillStyle = gr; rg.fillRect(0, 0, CELL_W, CELL_H);
  const refl = mkCanvas(Math.round(CELL_W / 3), Math.round(CELL_H / 3)), r2 = refl.getContext("2d"); r2.imageSmoothingQuality = "high"; r2.drawImage(R, 0, 0, refl.width, refl.height);
  return (GARV.fx[k] = { glow, refl });
}
const garIn = c => !SES || !!(c.gar && c.gar.ph === "park");   // is the car sitting on its marks?
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function drawGarage(force) {
  const cv = $("suGar"); if (!cv || $("setup").hidden) return;
  const now = performance.now(); if (!force && now - GARV.last < 33) return; GARV.last = now;
  const r = cv.getBoundingClientRect(); if (r.width < 20) return;
  const d = Math.min(2, window.devicePixelRatio || 1), w = Math.round(r.width * d), h = Math.round(r.height * d);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const g = cv.getContext("2d"); g.setTransform(w / GARV.W, 0, 0, h / GARV.H, 0, 0);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  const base = garBase(cars[0].team);
  if (base) g.drawImage(base, 0, 0); else { g.fillStyle = "#1b232d"; g.fillRect(0, 0, GARV.W, GARV.H); }
  const t = now / 1000, L = GARV.LEN, Wd = L * CELL_H / CELL_W;
  [0, 1].forEach(j => {
    const c = cars[j], [bx, by] = GARV.bays[j], [x0, y0, x1, y1] = GARV.rect[j];
    if (j === SU.k) {                                          // the selected car's marks glow in the team colour
      g.save(); g.strokeStyle = c.col; g.globalAlpha = 0.6 + 0.25 * Math.sin(t * 2.4); g.lineWidth = 6; g.shadowColor = c.col; g.shadowBlur = 28;
      rrect(g, x0 - 9, y0 - 9, x1 - x0 + 18, y1 - y0 + 18, 10); g.stroke(); g.restore();
    }
    if (!garIn(c) || !carSprites[j]) return;
    const fx = garFx(j), work = c.work > 0, sh = carShadows[j];
    if (sh) { g.save(); g.translate(bx + 7, by + 11); g.rotate(Math.PI / 2); g.globalAlpha = 0.4; g.drawImage(sh.cv, -L * sh.sx / 2, -Wd * sh.sy / 2, L * sh.sx, Wd * sh.sy); g.restore(); }
    if (fx) {
      g.save(); g.translate(bx, by); g.rotate(Math.PI / 2); g.globalAlpha = 0.2; g.drawImage(fx.glow, -L * 0.6, -Wd * 0.7, L * 1.2, Wd * 1.4); g.restore();
      g.save(); g.beginPath(); g.rect(0, 0, GARV.W, GARV.floor); g.clip();
      g.translate(bx, by + L / 2 - 4); g.rotate(Math.PI / 2); g.globalAlpha = 0.3; g.drawImage(fx.refl, 0, -Wd / 2, L * 0.42, Wd); g.restore();
    }
    g.save(); g.translate(bx, by); g.rotate(Math.PI / 2);         // nose to the pit lane (wheels on, also while the mechanics work)
    g.drawImage(carSprites[j], -L / 2, -Wd / 2, L, Wd);
    g.restore();
    if (work) {
      g.save(); g.strokeStyle = "#ffa21f"; g.globalAlpha = 0.55 + 0.3 * Math.sin(t * 5); g.lineWidth = 4; g.setLineDash([16, 10]); g.lineDashOffset = -t * 40;
      rrect(g, bx - Wd / 2 - 26, by - L / 2 - 16, Wd + 52, L + 32, 18); g.stroke(); g.restore();
    }
  });
}
addEventListener("resize", () => { drawGarage(true); if (!$("setup").hidden) { PERF.key = ""; perfLive(SU.k); } });
// ---------- simulated performance of a set-up: the lap the engineers expect from it ----------
// The total comes from the same model the car runs on (the satisfaction the team can estimate); how that lap is made
// (more wing: quicker in the corners, slower on the straights; braking and traction where the driver complains) shapes it.
const PERF = { key: "", A: null, B: null };
function perfSim(k, p) {
  const c = cars[k], W = WK.car[k], R = SES ? runPlan(k) : null;
  const comp = R && R.set ? R.set.c : "S", fuel = R ? R.fuel : 12;
  const es = estSat(W, p), fb = fbOf(p), dev = j => { const w = fbWin(W, j); return Math.min(3, Math.abs(fb[j] - w.c) / Math.max(0.05, w.hw)); };
  const kk = STRAT.T / lapPred(c.skill, comp, 0, fuel, "bal", "std") + 0.009 * (es - 0.6) + trackEvo(), T = STRAT.T / kk;
  const D = 0.55 * p[0] + 0.45 * p[1], Dr = 0.3 * p[0] + 0.7 * p[1], dB = dev(1), dT = dev(3), d0 = dev(0);
  const g = new Float32Array(N); let tsh = 0;
  for (let i = 0; i < N; i++) {
    const v = RL.v[i], wc = clamp01((VMAX - v) / (VMAX * 0.55)), ws = straight[i];
    let f = 1 + 0.03 * (D - 0.5) * wc - 0.024 * (Dr - 0.5) * ws - 0.004 * d0 * wc;
    if (accel[i] < -4) f -= 0.006 * dB;
    if (accel[i] > 1.5 && v < 60) f -= 0.006 * dT;
    g[i] = f; tsh += (cum[i + 1] - cum[i]) / (v * f);
  }
  const sc = tsh / T, vk = new Float32Array(N), tc = new Float64Array(N + 1);
  for (let i = 0; i < N; i++) { vk[i] = RL.v[i] * g[i] * sc * 3.6; tc[i + 1] = tc[i] + (cum[i + 1] - cum[i]) / (RL.v[i] * g[i] * sc); }
  const at = s => tc[idxAt(s)], s1 = at(SECT_M[0]), s2 = at(SECT_M[1]);
  let top = 0; for (let i = 0; i < N; i++) top = Math.max(top, vk[i]);
  let cs = 0; TURNS.forEach(s => { let m = 1e9; for (let d = -60; d <= 60; d += 4) m = Math.min(m, vk[idxAt(s + d)]); cs += m; });
  const wear = COMP[comp].wear * 100 * (1 + 0.12 * d0 + 0.2 * (1 - p[3]) + 0.06 * (D - 0.5));
  return { v: vk, tc, T: tc[N], sec: [s1, s2 - s1, tc[N] - s2], top, corner: cs / TURNS.length, down: D * 100, wear, comp };
}
const lighten = (hex, a) => { const [r, g, b] = hex2rgb(hex); return `rgb(${Math.round(r + (255 - r) * a)},${Math.round(g + (255 - g) * a)},${Math.round(b + (255 - b) * a)})`; };
function perfLive(k) {
  const body = $("suBody"), cv = body.querySelector("#suPerf"); if (!cv) return;
  const W = WK.car[k], R = SES ? runPlan(k) : null, r = cv.parentElement.getBoundingClientRect();
  const key = [k, W.p.join(), W.pend.join(), W.K.join(), R && R.set ? R.set.c : "-", R ? R.laps : 0, Math.round(r.width), Math.round(r.height), WK.evoLaps >> 4].join("|");
  if (key === PERF.key) return; PERF.key = key;
  const A = perfSim(k, W.p), B = perfSim(k, W.pend), col = lighten(cars[k].col, 0.25);
  const dl = (b, a, d = 3, inv) => { const x = b - a; if (Math.abs(x) < Math.pow(10, -d) / 2) return `<em>=</em>`; const good = inv ? x > 0 : x < 0; return `<em class="${good ? "g" : "b"}">${x > 0 ? "+" : "−"}${Math.abs(x).toFixed(d).replace(".", ",")}</em>`; };
  const tiles = [["Vuelta", fmt(B.T), dl(B.T, A.T), "big"], ["S1", B.sec[0].toFixed(3).replace(".", ","), dl(B.sec[0], A.sec[0])], ["S2", B.sec[1].toFixed(3).replace(".", ","), dl(B.sec[1], A.sec[1])],
    ["S3", B.sec[2].toFixed(3).replace(".", ","), dl(B.sec[2], A.sec[2])], ["V. punta", Math.round(B.top) + "<small>km/h</small>", dl(B.top, A.top, 0, true)],
    ["Paso curva", Math.round(B.corner) + "<small>km/h</small>", dl(B.corner, A.corner, 0, true)], ["Carga aero", Math.round(B.down) + "<small>%</small>", dl(B.down, A.down, 0, true)],
    ["Desgaste", B.wear.toFixed(1).replace(".", ",") + "<small>%/v</small>", dl(B.wear, A.wear, 1)]];
  body.querySelector(".pfk").innerHTML = tiles.map(([kk, v, d, cl]) => `<div class="${cl || ""}"><span>${kk}</span><b>${v}</b>${d}</div>`).join("");
  body.querySelector(".pfi").textContent = `${COMP[B.comp].name} · ${R ? R.fuel.toFixed(1).replace(".", ",") + " kg" : "vuelta rápida"}`;
  // ---- the chart: speed along the lap, current against new, and the time won or lost
  const { g, w, h } = cvFit(cv); if (w < 60) return;
  const L = 30, Rr = 8, top = 16, dh = Math.max(38, h * 0.24), sh = h - top - dh - 22, X = s => L + s / LAP_M * (w - L - Rr), Y = v => top + sh - (v - 60) / (350 - 60) * sh;
  const sx = [0, SECT_M[0], SECT_M[1], LAP_M];
  for (let j = 0; j < 3; j++) { g.fillStyle = j % 2 ? "rgba(255,255,255,.025)" : "rgba(255,255,255,0)"; g.fillRect(X(sx[j]), top, X(sx[j + 1]) - X(sx[j]), sh + dh + 12);
    g.fillStyle = SEC_COL[j]; g.fillRect(X(sx[j]) + 1, 3, X(sx[j + 1]) - X(sx[j]) - 2, 3);
    g.font = `800 8.5px ${DISP}`; g.textAlign = "left"; g.fillStyle = "#a7b1be"; g.fillText("S" + (j + 1), X(sx[j]) + 4, 13); }
  g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1; g.font = `600 8.5px ${MONO}`; g.textAlign = "right"; g.fillStyle = "#7f8b99";
  [100, 200, 300].forEach(v => { g.beginPath(); g.moveTo(L, Y(v) + 0.5); g.lineTo(w - Rr, Y(v) + 0.5); g.stroke(); g.fillText(v, L - 4, Y(v) + 3); });
  const line = (S, st, lw, dash) => { g.beginPath(); for (let i = 0; i < N; i += 3) { const x = X(cum[i]), y = Y(S.v[i]); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokeStyle = st; g.lineWidth = lw; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]); };
  line(A, "rgba(238,241,245,.5)", 1.2, [3, 3]); line(B, col, 2);
  g.font = `700 8px ${MONO}`; g.textAlign = "center"; g.fillStyle = "#cfd5db";
  TURNS.forEach((s, k2) => { let m = 1e9; for (let d = -60; d <= 60; d += 4) m = Math.min(m, B.v[idxAt(s + d)]); if (w > 360 || k2 % 2 === 0) g.fillText(k2 + 1, X(s), Math.min(top + sh - 2, Y(m) + 11)); });
  // delta strip
  const y0 = top + sh + 12, mid = y0 + dh / 2; let mx = 0.02; for (let i = 0; i <= N; i += 3) mx = Math.max(mx, Math.abs(B.tc[Math.min(i, N)] - A.tc[Math.min(i, N)]));
  g.strokeStyle = "rgba(255,255,255,.14)"; g.beginPath(); g.moveTo(L, mid + 0.5); g.lineTo(w - Rr, mid + 0.5); g.stroke();
  g.font = `800 8px ${DISP}`; g.textAlign = "right"; g.fillStyle = "#7f8b99"; g.fillText("Δ", L - 4, mid + 3);
  const DY = d => mid - d / mx * (dh / 2 - 3);
  g.beginPath(); g.moveTo(X(0), mid); for (let i = 0; i <= N; i += 3) { const j = Math.min(i, N); g.lineTo(X(cum[j]), DY(B.tc[j] - A.tc[j])); } g.lineTo(X(LAP_M), mid); g.closePath();
  const fin = B.T - A.T; g.fillStyle = fin <= 0 ? "rgba(34,211,138,.22)" : "rgba(255,42,60,.22)"; g.fill();
  g.beginPath(); for (let i = 0; i <= N; i += 3) { const j = Math.min(i, N), x = X(cum[j]), y = DY(B.tc[j] - A.tc[j]); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.strokeStyle = fin <= 0 ? "#22d38a" : "#ff2a3c"; g.lineWidth = 1.6; g.stroke();
  g.font = `600 9px ${MONO}`; g.textAlign = "right"; g.fillStyle = Math.abs(fin) < 0.0005 ? "#a7b1be" : fin < 0 ? "#22d38a" : "#ff5a68";
  g.fillText(Math.abs(fin) < 0.0005 ? "= 0,000 s" : (fin > 0 ? "+" : "−") + Math.abs(fin).toFixed(3).replace(".", ",") + " s", w - Rr - 2, y0 + 9);
  g.textAlign = "left"; g.font = `800 8px ${DISP}`;
  g.fillStyle = "rgba(238,241,245,.6)"; g.fillText("— — ACTUAL", L + 2, h - 5); g.fillStyle = col; g.fillText("——  NUEVO REGLAJE", L + 64, h - 5);
}
// ---------- the set-up screen ----------
const SU = { k: 0 };
function openSetup(k) { SU.k = k; $("setup").hidden = false; renderSetup(); }
$("suClose").onclick = () => { $("setup").hidden = true; };
$("suTabs").onclick = e => { const b = e.target.closest("[data-k]"); if (b) { SU.k = +b.dataset.k; renderSetup(); } };
const fbX = f => clamp01((f + 0.15) / 1.3) * 100;
const parcNow = () => SES ? SES.def.kind === "q" : WK.i >= 3;
function specInfo(c) {                                        // the parts on the car: spec / use and condition (as in the race preparation)
  const hs = x => hash01(c.idx * 13.7 + x * 3.3), pk = c.puKm || 0, gk = c.gbKm || 0;
  return SPEC_PARTS.map(([nm, id, grp], j) => ({ nm, id, grp,
    cond: grp === "pu" ? Math.max(55, 100 - pk / 5200 * 38 - hs(j) * 4) : grp === "gb" ? Math.max(55, 100 - gk / 6000 * 35 - hs(j) * 3) : 86 + hs(j) * 14,
    spec: grp === "aero" ? `Spec ${1 + Math.floor(hs(j + 20) * 3.2)}` : grp === "pu" ? `${1 + Math.floor(hs(j + 30) * 3)}/${id === "ICE" || id === "TC" ? 4 : 3}` : `${Math.round(gk).toLocaleString("es-ES")} km` }));
}
function runPlan(k) {                                         // the programme, tyres, fuel and time of the next run
  const W = WK.car[k], prog = SES && SES.def.kind === "q" && !PROGS[W.plan.prog].q ? "q1" : W.plan.prog, P = PROGS[prog];
  const laps = 2 + P.n + (P.cool ? P.n - 1 : 0), si = W.plan.set >= 0 ? W.plan.set : autoSet(W, prog), set = si >= 0 ? W.sets[si] : null;
  return { prog, P, laps, set, auto: W.plan.set < 0, fuel: laps * FUEL_BASE * 1.12 + 1.3, time: laps * LAP_T0 * 1.08 };
}
function renderSetup() {
  const k = SU.k, c = cars[k], W = WK.car[k], parc = parcNow();
  $("suTabs").innerHTML = [0, 1].map(j => `<button data-k="${j}" aria-selected="${j === k}"><i style="background:${cars[j].col}"></i>${cars[j].num} ${cars[j].name}</button>`).join("");
  $("suSub").textContent = `${cars[k].name} · ${SES ? SES.def.long : WK.i < SES_IDS.length ? "Antes de " + SES_DEF[SES_IDS[WK.i]].long : "Carrera"}`;
  const SHP = ["Alerón del.", "Alerón tras.", "Barras estab.", "Caída", "Convergencia"], SHF = ["Equilibrio", "Frenada", "Paso por curva", "Tracción", "Recta"];
  const rowS = j => { const P = SETUP_P[j], st = Math.round(W.pend[j] * P.steps);
    return `<div class="sur" data-j="${j}"><div class="surh"><span><i class="lf">${P.name}</i><i class="ls">${SHP[j]}</i></span><em class="sud"></em><b class="suv mono"></b></div>
      <div class="surr"><button class="stp" data-d="-1" data-j="${j}" aria-label="Menos ${P.name}"${parc ? " disabled" : ""}>−</button>
      <div class="srng"><input type="range" min="0" max="${P.steps}" step="1" value="${st}" data-j="${j}"${parc ? " disabled" : ""} aria-label="${P.name}"><i class="ap" style="left:${(W.p[j] * 100).toFixed(1)}%"></i></div>
      <button class="stp" data-d="1" data-j="${j}" aria-label="Más ${P.name}"${parc ? " disabled" : ""}>+</button></div>
      <div class="sure"><span>${pTxt(j, 0)}</span><span>${pTxt(j, 1)}</span></div></div>`; };
  const rowF = j => { const F = SETUP_F[j]; return `<div class="fbr" data-j="${j}"><div class="fbh"><span><i class="lf">${F.name}</i><i class="ls">${SHF[j]}</i></span><b class="fbs"></b></div>
      <div class="fbb"><i class="win"></i><i class="ap"></i><i class="mk"></i></div><div class="fbe"><span>${F.lo}</span><span>${F.hi}</span></div></div>`; };
  const tune = `<div class="tch">Reglajes<em class="suh"></em></div><div class="tch">Sensaciones<em class="sukn"></em></div>` + SETUP_P.map((P, j) => rowS(j) + rowF(j)).join("");
  const avg = s => (s.w[0] + s.w[1] + s.w[2] + s.w[3]) / 4;
  const q = SES && SES.def.kind === "q", prog = q && !PROGS[W.plan.prog].q ? "q1" : W.plan.prog;
  const sets = `<button class="tsc" data-set="-1" aria-pressed="${W.plan.set < 0}"><b>AUTO</b><span>Ingeniero</span></button>` + W.sets.map((s, j) => `<button class="tsc" data-set="${j}" aria-pressed="${W.plan.set === j}" title="${COMP[s.c].name}">${tyreImg(s.c)}<span>${s.l ? s.l + " v" : "Nuevo"}</span><s><i style="width:${(100 - avg(s) * 100).toFixed(0)}%"></i></s></button>`).join("");
  const progs = Object.entries(PROGS).filter(([id, P]) => q ? P.q : P.fp).map(([id, P]) => `<button data-prog="${id}" aria-pressed="${prog === id}"><b>${P.short}</b><span>${P.name}</span></button>`).join("");
  const cnt = {}; W.sets.forEach(s => { const o = cnt[s.c] || (cnt[s.c] = { n: 0, u: 0 }); if (s.l) o.u++; else o.n++; });
  const alloc = ["S", "M", "H", "I", "W"].map(cm => `<span title="${COMP[cm].name}">${tyreImg(cm)}<b>${cnt[cm] ? cnt[cm].n : 0}</b><em>${cnt[cm] && cnt[cm].u ? "+" + cnt[cm].u + " usados" : "nuevos"}</em></span>`).join("");
  const sp = specInfo(c), spRow = p => { const col = p.cond > 85 ? "var(--green)" : p.cond > 70 ? "var(--amber)" : "var(--red)";
    return `<div class="spr"><span class="n">${p.nm}</span><span class="sp">${p.spec}</span><span class="cb"><s><i style="width:${p.cond.toFixed(0)}%;background:${col}"></i></s>${p.cond.toFixed(0)}%</span></div>`; };
  const aero = sp.filter(p => p.grp === "aero"), ice = sp.find(p => p.id === "ICE");
  const card = j => `<button class="gxc" data-car="${j}" aria-pressed="${j === k}" style="--tc:${cars[j].col}"><div class="gxch"><i>${cars[j].num}</i><b>${cars[j].name}</b></div>
      <div class="gxs"><i></i><span></span></div><div class="gxk"><div><span>Mejor vuelta</span><b class="gxbest fl"></b></div><div><span>Última</span><b class="gxlast"></b></div><div><span>Vueltas</span><b class="gxlaps"></b></div><div><span>Satisfacción</span><b class="gxsat"></b></div></div></button>`;
  const BAYS = [[16.67, 19.25], [64.91, 20.75]];
  $("suBody").innerHTML = `<div class="sux" style="--tc:${c.col}">
    <section class="pn su-sat" style="--tc:${c.col}"><div class="ring"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="17" class="bg"/><circle cx="21" cy="21" r="17" class="fg" pathLength="100"/></svg><b></b></div>
      <div class="sutx"><div class="who"><i>${c.num}</i>${c.name}<em>${teamLogo(c.team)}${TEAMS[c.team].name}</em></div><span>Satisfacción estimada</span><q></q></div>
      <div class="satk"><div><span>Confianza</span><b class="skc"></b></div><div><span>Datos</span><b class="skd"></b></div><div><span>Vueltas</span><b class="skl"></b></div><div><span>Agarre</span><b class="skg"></b></div></div></section>
    <section class="pn sutune"><h3><span>Reglajes · sensaciones del piloto</span><span>${parc ? "Parc fermé" : "Libres"}</span></h3>${parc ? `<div class="parc">🔒 Parc fermé · el reglaje queda fijado desde la clasificación</div>` : ""}<div class="tun">${tune}</div>
      <div class="suf"><span class="suw"></span><button id="suUndo"${parc ? " disabled" : ""}>Deshacer</button><button class="go" id="suApply"${parc ? " disabled" : ""}>Aplicar</button></div></section>
    <section class="pn superf"><h3><span>Rendimiento simulado</span><span class="pfi"></span></h3><div class="pfk"></div><div class="cvw pfc"><canvas id="suPerf" aria-label="Velocidad a lo largo de la vuelta con el reglaje actual y el nuevo, y la diferencia de tiempo"></canvas></div></section>
    <section class="pn suspec"><h3><span>Spec del coche</span><span>${parc ? "Parc fermé" : "Piezas montadas"}</span></h3>
      <div class="spl"><div class="sph"><span>Paquete aero<b>${aero[1].spec}</b></span><span>Motor<b>${ice.spec}</b></span><span>Km del fin de semana<b>${Math.round(W.laps * CIRCUIT.lengthKm)}</b></span></div>${sp.map(spRow).join("")}</div></section>
    <div class="gx">${card(0)}<div class="gxi"><canvas id="suGar" aria-label="El garaje del equipo con los dos coches"></canvas>
      ${[0, 1].map(j => `<div class="gxb" data-bay="${j}" style="left:${BAYS[j][0]}%;width:${BAYS[j][1]}%;top:40.24%;height:45.5%" hidden><b></b><span></span><em></em></div>`).join("")}
      ${[0, 1].map(j => `<div class="gxt${j === k ? " on" : ""}" data-tag="${j}" style="--tc:${cars[j].col};left:${[26.29, 75.28][j]}%;top:35.4%"><i>${cars[j].num}</i>${cars[j].code}<u></u></div>`).join("")}</div>${card(1)}</div>
    <section class="pn surun"><h3><span>Estrategia de la próxima salida</span><span class="sufu"></span></h3>
      ${SES ? `<div class="rsum"><div><span>Neumático</span><b class="rqT"></b></div><div><span>Programa</span><b class="rqL"></b></div><div><span>Gasolina</span><b class="rqF"></b></div><div><span>En pista</span><b class="rqD"></b></div></div>
      <div class="prg">${progs}</div><div class="suf"><span class="sust"></span><button class="go" id="suGo">Salir a pista ▶</button></div>`
        : `<div class="runoff">Las salidas a pista se preparan durante la sesión</div>`}</section>
    <section class="pn sutyr"><h3><span>Neumáticos</span><span>Asignación · ${Object.entries(TYRE_ALLOC).map(([kk, n]) => n + kk).join(" ")}</span></h3>
      <div class="tyal">${alloc}</div><div class="tsg">${sets}</div></section></div>`;
  setupLive();
  PERF.key = ""; requestAnimationFrame(() => { drawGarage(true); perfLive(k); });
}
function setupLive() {
  const k = SU.k, c = cars[k], W = WK.car[k], body = $("suBody"); if (!body.firstChild) return;
  const fP = fbOf(W.pend), fA = fbOf(W.p), parc = parcNow();
  SETUP_P.forEach((P, j) => {
    const r = body.querySelector(`.sur[data-j="${j}"]`), d = W.pend[j] - W.p[j];
    r.querySelector(".suv").textContent = pTxt(j, W.pend[j]);
    const dv = pVal(j, W.pend[j]) - pVal(j, W.p[j]); r.querySelector(".sud").textContent = Math.abs(d) > 1e-4 ? (dv > 0 ? "+" : "−") + Math.abs(dv).toFixed(P.d).replace(".", ",") : "";
    r.classList.toggle("chg", Math.abs(d) > 1e-4);
  });
  SETUP_F.forEach((F, j) => {
    const r = body.querySelector(`.fbr[data-j="${j}"]`), w = fbWin(W, j), inw = Math.abs(fP[j] - w.c) <= w.hw;
    const win = r.querySelector(".win"); win.style.left = fbX(w.c - w.hw) + "%"; win.style.width = (fbX(w.c + w.hw) - fbX(w.c - w.hw)) + "%";
    r.querySelector(".mk").style.left = fbX(fP[j]) + "%"; r.querySelector(".ap").style.left = fbX(fA[j]) + "%";
    const s = r.querySelector(".fbs"); s.textContent = inw ? "Óptimo" : fP[j] < w.c ? "↓ " + F.lo : "↑ " + F.hi; s.className = "fbs " + (inw ? "ok" : Math.abs(fP[j] - w.c) < w.hw * 1.8 ? "near" : "ko");
  });
  const es = estSat(W, W.pend), K = W.K.reduce((a, b) => a + b, 0) / 5;
  body.querySelector(".ring .fg").style.strokeDasharray = `${(es * 100).toFixed(1)} 100`;
  body.querySelector(".ring .fg").style.stroke = es > 0.8 ? "var(--green)" : es > 0.55 ? "var(--accent)" : "var(--red)";
  body.querySelector(".ring b").textContent = Math.round(es * 100) + "%";
  body.querySelector(".sutx q").textContent = W.said || "Todavía no he rodado con este coche. Necesito vueltas para daros información.";
  body.querySelector(".skc").textContent = confOf(k) + "/100";
  body.querySelector(".skd").textContent = Math.round(K * 100) + " %";
  body.querySelector(".skl").textContent = W.laps;
  body.querySelector(".skg").textContent = Math.round(gripPct()) + " %";
  body.querySelector(".sukn").textContent = `Datos ${Math.round(K * 100)} % · ${W.laps} v`;
  const chg = W.pend.some((v, j) => Math.abs(v - W.p[j]) > 1e-4), work = W.pend.reduce((t, v, j) => t + (Math.abs(v - W.p[j]) > 1e-4 ? SETUP_P[j].work : 0), 0);
  const inGar = c.gar && c.gar.ph === "park";
  body.querySelector(".suw").innerHTML = parc ? "Parc fermé" : !SES ? (chg ? "Los mecánicos lo tendrán listo para la sesión" : "Sin cambios") : c.work > 0 ? `Mecánicos trabajando · <b>${fmtMS(c.work)}</b>` : chg ? `Trabajo: <b>${fmtMS(work + 30)}</b>${inGar ? "" : " · al volver al garaje"}` : "Sin cambios";
  body.querySelector(".suh").textContent = c.work > 0 ? "Mecánicos trabajando" : chg ? "Cambios sin aplicar" : "Aplicado";
  // the two cars: cards beside the garage, plates and empty bays in it
  [0, 1].forEach(j => {
    const d = cars[j], Wj = WK.car[j], [st, cls] = carStatus(d), card = body.querySelector(`.gxc[data-car="${j}"]`); if (!card) return;
    const s = card.querySelector(".gxs"); s.className = "gxs " + cls; s.querySelector("span").textContent = st;
    card.querySelector(".gxbest").textContent = SES && d.sbest ? fmt(d.sbest) : "–";
    card.querySelector(".gxlast").textContent = SES && d.slast ? fmt(d.slast) : "–";
    card.querySelector(".gxlaps").textContent = SES ? (d.sLaps || 0) : Wj.laps;
    card.querySelector(".gxsat").textContent = Math.round(estSat(Wj, j === k ? Wj.pend : Wj.p) * 100) + " %";
    const tag = body.querySelector(`.gxt[data-tag="${j}"]`), u = d.work > 0 ? "MECÁNICOS " + fmtMS(d.work) : d.elim ? "ELIMINADO" : d.goReq && garIn(d) ? "SALE" : "";
    if (tag.querySelector("u").textContent !== u) tag.querySelector("u").textContent = u;
    const bay = body.querySelector(`.gxb[data-bay="${j}"]`), here = garIn(d); bay.hidden = here;
    if (!here) { bay.querySelector("b").textContent = d.gar ? (d.gar.ph === "exit" ? "SALIENDO" : "ENTRANDO") : d.pit ? "PIT LANE" : "EN PISTA"; bay.querySelector("span").textContent = st; bay.querySelector("em").textContent = d.slast ? "Última " + fmt(d.slast) : ""; }
  });
  drawGarage();
  perfLive(k);
  if (!SES) return;
  const go = $("suGo"), can = inGar && !c.elim && !c.out && SES && !SES.over && !SES.flag;
  go.disabled = !can; go.textContent = c.goReq ? "Cancelar salida" : "Salir a pista ▶";
  const [st] = carStatus(c); body.querySelector(".sust").textContent = st;
  const R = runPlan(k);
  body.querySelector(".sufu").textContent = `${R.P.short} · ${R.fuel.toFixed(1).replace(".", ",")} kg`;
  const tyreTx = R.set ? `${tyreImg(R.set.c, "sm")}${R.set.c}<small>${R.set.l ? R.set.l + " v" : "nuevo"}</small>` : "–";
  const rqT = body.querySelector(".rqT"); if (rqT.dataset.v !== tyreTx) { rqT.dataset.v = tyreTx; rqT.innerHTML = tyreTx; }
  body.querySelector(".rqL").textContent = `${R.laps} vueltas`;
  body.querySelector(".rqF").textContent = R.fuel.toFixed(1).replace(".", ",") + " kg";
  body.querySelector(".rqD").textContent = "≈ " + fmtMS(R.time);
}
$("suBody").addEventListener("input", e => {
  const r = e.target.closest("input[type=range]"); if (!r) return;
  const j = +r.dataset.j, W = WK.car[SU.k]; W.pend[j] = +r.value / SETUP_P[j].steps; setupLive();
});
$("suBody").addEventListener("click", e => {
  const gc = e.target.closest("#suGar"); if (gc) { const r = gc.getBoundingClientRect(), j = (e.clientX - r.left) / r.width < 0.5 ? 0 : 1; if (j !== SU.k) { SU.k = j; renderSetup(); } return; }
  const cb = e.target.closest("[data-car]"); if (cb) { if (+cb.dataset.car !== SU.k) { SU.k = +cb.dataset.car; renderSetup(); } return; }
  const k = SU.k, c = cars[k], W = WK.car[k];
  const stp = e.target.closest(".stp"); if (stp && !stp.disabled) { const j = +stp.dataset.j, P = SETUP_P[j]; W.pend[j] = clamp01((Math.round(W.pend[j] * P.steps) + +stp.dataset.d) / P.steps); $("suBody").querySelector(`input[data-j="${j}"]`).value = Math.round(W.pend[j] * P.steps); setupLive(); return; }
  if (e.target.closest("#suUndo")) { W.pend = W.p.slice(); if (c.work > 0) { c.work = 0; c.workSet = null; } renderSetup(); return; }
  if (e.target.closest("#suApply")) {
    if (!SES) { W.p = W.pend.slice(); toast(`${c.code} · Reglaje listo para la próxima sesión`, "good"); renderSetup(); return; }
    if (c.gar && c.gar.ph === "park") { const t = startWork(c, W.pend); if (t) toast(`${c.code} · Los mecánicos cambian el reglaje · ${fmtMS(t)}`, false); }
    else toast(`${c.code} · Cambios preparados: se harán al volver al garaje`, false);
    setupLive(); return;
  }
  const ts = e.target.closest("[data-set]"); if (ts) { W.plan.set = +ts.dataset.set; renderSetup(); return; }
  const pg = e.target.closest("[data-prog]"); if (pg) { W.plan.prog = pg.dataset.prog; renderSetup(); return; }
  if (e.target.closest("#suGo")) { sendOut(k); setupLive(); if (c.goReq) $("setup").hidden = true; }
});
// ---------- the session board (left) ----------
function sesBoard() {
  const order = sesOrder(), act = order.filter(c => !c.elim), lead = act.find(c => c.sbest != null), cut = SES.def.cut;
  $("ses").textContent = SES.red ? "BANDERA ROJA" : SES.def.name.toUpperCase();
  $("ses").parentElement.classList.toggle("red", !!SES.red); $("ses").parentElement.classList.remove("sc");
  $("bLap").textContent = SES.over ? "FINALIZADA" : SES.flag ? "🏁" : fmtMS(SES.def.dur - SES.t); $("bLap").previousSibling.textContent = SES.over ? "" : SES.flag ? "BANDERA " : "QUEDAN ";
  const key = "S" + order.map(c => c.idx).join(",") + "|" + focus, rowsEl = $("rows");
  if (rowsEl.dataset.key !== key) {
    rowsEl.dataset.key = key; requestAnimationFrame(fitBoard);
    rowsEl.innerHTML = order.map((c, k) => `<button class="brow2${c.idx === focus ? " me" : ""}${c.elim ? " el" : ""}${cut && !c.elim && k >= cut ? " ko" : ""}${cut && k === cut - 1 ? " cut" : ""}" data-i="${c.idx}"><span class="p">${c.elim ? c.elimPos : k + 1}</span><span class="t" style="background:${c.col}"></span><span class="c">${c.code}</span><span class="d"></span></button>`).join("");
  }
  order.forEach((c, k) => {
    let d;
    const tr = !c.gar && !c.done && !c.pit, pit = c.pit || (c.gar && c.gar.ph !== "park");
    if (c.elim) d = c.sbest != null ? fmt(WK.best[c.idx] || c.sbest) : "—";
    else if (c.dnf || c.out) d = "OUT";
    else if (c.sbest == null) d = pit ? '<span class="pit">PIT</span>' : tr ? `<i class="on ${c.lt}"></i>` : "—";
    else d = c === lead ? fmt(c.sbest) : "+" + (c.sbest - lead.sbest).toFixed(3);
    const row = rowsEl.children[k], cell = row.querySelector(".d"), html = String(d);
    if (cell.innerHTML !== html) cell.innerHTML = html;
    const pc = "p" + (tr ? " on " + (c.lt || "") : ""); if (row.firstElementChild.className !== pc) row.firstElementChild.className = pc;   // on track: the position lights up
  });
}
// ---------- results of a session ----------
function showSesResults(id) {
  const rows = WK.res[id], def = SES_DEF[id], lead = rows.find(r => r.t != null && !r.elim), W = WXC;
  const name = c => `<span class="rsn"><i style="background:${c.col};color:${textOn(c.col)}">${c.num}</i><span><em>${esc(FIRST[c.code] || "")}</em> <b>${esc(c.name)}</b></span></span>`;
  const me = rows.filter(r => !DRIVERS[r.idx].ai);
  const card = (k, v, s, cls) => `<div class="rsc${cls ? " " + cls : ""}"><span class="k">${k}</span><b>${v}</b><span class="s">${s}</span></div>`;
  const body = rows.map((r, k) => {
    const c = DRIVERS[r.idx], cutRow = def.cut && k === def.cut;
    return `${cutRow ? `<tr class="cutl"><td colspan="7">Eliminados en ${def.name} · no pasan a ${def.id === "Q1" ? "Q2" : "Q3"}</td></tr>` : ""}<tr class="${k === 0 ? "p1" : ""}${!c.ai ? " me" : ""}${r.elim || r.ko ? " out" : ""}">
      <td class="ps">${r.pos}</td><td class="dv">${name(c)}</td><td class="tm"><i style="background:${c.col}"></i>${teamLogo(c.team)}${esc(TEAMS[c.team].name)}</td>
      <td class="bl">${r.elim ? (r.t != null ? fmt(r.t) : "—") : r.t != null ? fmt(r.t) : "Sin tiempo"}</td><td>${r.elim ? (WK.out[r.idx] ? WK.out[r.idx].id : "") : r.gap == null ? "" : r.gap === 0 ? "" : "+" + r.gap.toFixed(3)}</td>
      <td>${r.laps || 0}</td><td class="st">${r.comp ? `<span class="tys"><img src="${TYRE_URL[r.comp]}" alt="${COMP[r.comp].name}"></span>` : ""}</td></tr>`;
  }).join("");
  const nextTxt = def.kind === "q" ? (def.cut ? `Pasan ${def.cut} a ${def.id === "Q1" ? "Q2" : "Q3"}` : "Parrilla de salida definida") : SES && SES.sim ? "Reglaje ajustado por los ingenieros" : "Datos de reglaje actualizados";
  $("sresBody").innerHTML = `<div class="rsh"><div class="rsbrand"><span><img class="pgm" src="assets/img/rtm_line.png" alt="Racing Team Manager"></span><span>${def.day} · ${def.hour} · ${WK.test ? L("Test de pretemporada", "Pre-season test") : "GP de Barcelona"}</span></div>
      <h2>${def.long}</h2><div class="rssub">Clasificación de la sesión</div>
      <div class="rsmeta"><span>Circuit de Barcelona-Catalunya</span><span>${Math.round(def.dur / 60)} min</span><span class="wx">${wxIcon(W.s, 14)} ${WX_STATES[W.s].name} · pista ${W.track.toFixed(0)} °C</span><span>Agarre ${gripPct().toFixed(1).replace(".", ",")} %</span></div></div>
    <div class="rscards">${lead ? card("Más rápido", fmt(lead.t), `${DRIVERS[lead.idx].name} · ${TEAMS[DRIVERS[lead.idx].team].name}`, "fl") : ""}
      ${me.map(r => card(DRIVERS[r.idx].name, r.t != null ? "P" + r.pos : "—", `${r.t != null ? fmt(r.t) + (r.gap ? " · +" + r.gap.toFixed(3) : "") : "sin tiempo"} · setup ${Math.round(satOf(r.idx) * 100)} %`, "me")).join("")}
      ${card("Sesión", nextTxt, `${rows.reduce((a, r) => a + (r.laps || 0), 0)} vueltas cronometradas`)}</div>
    <div class="rstw"><table class="rst sest"><thead><tr><th class="ps">Pos</th><th class="dv">Piloto</th><th class="tm">Equipo</th><th>Mejor vuelta</th><th>Dif.</th><th>Vueltas</th><th class="st">Neum.</th></tr></thead><tbody>${body}</tbody></table></div>`;
  $("sres").hidden = false;
  $("sresGo").textContent = WK.test ? L("Volver a la sede ▶", "Back to the HQ ▶") : WK.i >= SES_IDS.length ? "Estrategia de carrera ▶" : `Continuar · ${SES_DEF[SES_IDS[WK.i]].name} ▶`;
}
$("sresClose").onclick = () => { $("sres").hidden = true; if (!SES || SES.sim) { sesClose(); if (WK && WK.test) { sTestEnd(); openHQ(); } else menuShow("weekend"); } };
$("sresGo").onclick = () => { $("sres").hidden = true; sesClose(); if (WK && WK.test) { sTestEnd(); openHQ(); } else if (WK && WK.i >= SES_IDS.length) goPrep(); else menuShow("weekend"); };
// ---------- the weekend screen ----------
// =====================================================================================================
// ---------- the grand prix presentation: the weekend programme and its forecast, over a slow flight round the circuit ----------
// =====================================================================================================
const GP_INFO = {
  title: "Barcelona-Catalunya", round: "01", month: "JUN", year: 2026, days: [["VIE", 12], ["SÁB", 13], ["DOM", 14]],
  pole: { t: "1:11.546", who: "Oscar Piastry", year: 2025 },
  winners: [[2025, "Oscar Piastry", "McLaron", "#ff8000"], [2024, "Max Verstapen", "Red Ball Racing", "#3671c6"], [2023, "Max Verstapen", "Red Ball Racing", "#3671c6"],
    [2022, "Max Verstapen", "Red Ball Racing", "#3671c6"], [2021, "Lewis Hamilten", "AMB Petranas", "#27f4d2"]]
};
const addMin = (h, m) => { const [a, b] = h.split(":").map(Number), t = a * 60 + b + m; return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
function sesForecast(set, dur) {                     // the forecast before a session: read from the same weather plan the session will play
  const plan = wxPlan(set, Math.ceil(dur / LAP_T0) + 3), s0 = WX_STATES[set.start];
  let first = -1; for (const p of plan) { if (p.t > dur) break; if (WX_STATES[p.s].R > 0 && first < 0) first = p.t; }
  const rain = s0.R > 0 ? 90 + Math.round(s0.R * 8) : first >= 0 ? Math.round(35 + 45 * (1 - first / dur)) : s0.cloud > 50 ? 15 : 5;
  const air = 24.2 - s0.cloud * 0.03 - s0.R * 2.5, track = air + 4 + 15 * (1 - s0.cloud / 100) - (s0.R > 0 ? 9 * Math.min(1, s0.R + 0.4) : 0);
  return { s: set.start, rain: Math.min(99, rain), air: Math.round(air), track: Math.round(track) };
}
function renderWeekend() {
  const nx = SES_IDS[WK.i], all = WK.i >= SES_IDS.length;
  const wxCell = F => `<div class="wx">${wxIcon(F.s, 24)}<div><b>${F.air}°</b><span>Pista ${F.track}°</span><span class="r">Lluvia ${F.rain} %</span></div></div>`;
  const resOf = id => {
    const R = WK.res[id]; if (!R) return "";
    const me = R.filter(r => !DRIVERS[r.idx].ai), lead = R.find(r => r.t != null);
    return `<div class="rs">${lead ? `<span class="ld"><b>${DRIVERS[lead.idx].code}</b> ${fmt(lead.t)}</span>` : ""}${me.map(r => `<span class="mr" style="--tc:${DRIVERS[r.idx].col}"><b>${DRIVERS[r.idx].code}</b> ${r.t != null ? "P" + r.pos : "—"}${r.ko || r.elim ? " ✕" : ""}</span>`).join("")}</div>`;
  };
  const gridTx = () => WK.grid ? [0, 1].map(k => `<span class="mr" style="--tc:${DRIVERS[k].col}"><b>${DRIVERS[k].code}</b> sale P${WK.grid[k] + 1}</span>`).join("") : "";
  const row = (tag, name, time, F, st, extra) => `<div class="gps ${st}"><span class="tg">${tag}</span><div class="nm"><b>${name}${st === "next" ? "<em>Siguiente</em>" : st === "done" ? '<em class="ok">Finalizada</em>' : ""}</b><span>${time}</span></div>${wxCell(F)}${extra || ""}</div>`;
  const fp = id => { const D = SES_DEF[id]; return row(id, D.name, `${D.hour} – ${addMin(D.hour, D.dur / 60)}`, sesForecast(WK.wx[id], D.dur), WK.res[id] ? "done" : id === nx ? "next" : "", resOf(id)); };
  const qIds = ["Q1", "Q2", "Q3"], qDone = !!WK.res.Q3, qNext = qIds.includes(nx);
  const qF = sesForecast(WK.wx.Q1, SES_DEF.Q1.dur); qF.rain = Math.max(...qIds.map(id => sesForecast(WK.wx[id], SES_DEF[id].dur).rain));
  const pole = qDone && WK.res.Q3.find(r => r.t != null);
  const qExtra = `<div class="qs">${qIds.map(id => `<span class="${WK.res[id] ? "d" : id === nx ? "n" : ""}">${id} · ${SES_DEF[id].hour}</span>`).join("")}</div>`
    + (qDone ? `<div class="rs">${pole ? `<span class="ld">Pole <b>${DRIVERS[pole.idx].code}</b> ${fmt(pole.t)}</span>` : ""}${gridTx()}</div>` : (() => { const last = [...qIds].reverse().find(id => WK.res[id]); return last ? resOf(last) : ""; })());
  const qRow = row("Q", "Clasificación", `${SES_DEF.Q1.hour} – ${addMin(SES_DEF.Q1.hour, 60)}`, qF, qDone ? "done" : qNext ? "next" : "", qExtra);
  const raceRow = row("GP", "Carrera", `15:00 · ${RACE_LAPS} vueltas`, sesForecast(WXSET, RACE_LAPS * LAP_T0 * 1.1), all ? "next" : "", WK.grid ? `<div class="rs">${gridTx()}</div>` : "");
  const perDay = [[fp("FP1"), fp("FP2")], [fp("FP3"), qRow], [raceRow]], today = all ? 2 : SES_DEF[nx].day === "Viernes" ? 0 : 1;
  const cal = GP_INFO.days.map(([dn, dd], i) => `<div class="gpd${i === today ? " now" : ""}"><div class="gpdd"><span>${dn}</span><b>${dd}</b><em>${GP_INFO.days[i][2] || GP_INFO.month}</em></div><div class="gpsl">${perDay[i].join("")}</div></div>`).join("");
  const km = (RACE_LAPS === CIRCUIT.laps ? CIRCUIT.distKm : RACE_LAPS * CIRCUIT.lengthKm).toFixed(3).replace(".", ",");
  const facts = [["Longitud", "4,657<small>km</small>", "Por vuelta"], ["Vueltas", `${RACE_LAPS}`, `${km} km`], ["Curvas", `${CIRCUIT.corners}`, "Sentido horario"],
    ["Récord de vuelta", CIRCUIT.record.t, `${CIRCUIT.record.who} · ${CIRCUIT.record.year}`, "rec"], [`Pole ${GP_INFO.pole.year}`, GP_INFO.pole.t, GP_INFO.pole.who], ["Primer GP", `${CIRCUIT.firstGP}`, CIRCUIT.city]]
    .map(([k, v, s, cl]) => `<div class="gpf${cl ? " " + cl : ""}"><span>${k}</span><b>${v}</b><em>${s}</em></div>`).join("");
  const wins = GP_INFO.winners.map(([y, n, t, col]) => `<li><em>${y}</em><i style="background:${col}"></i>${n}<span>${t}</span></li>`).join("");
  $("mnWeekend").innerHTML = `<div class="gp">
    <div class="gpl"><div class="gpt"><div class="rd"><b>${GP_INFO.round === "T" ? "Test" : "Ronda " + GP_INFO.round}</b>${GP_INFO.days[0][1]}${GP_INFO.days[0][2] && GP_INFO.days[0][2] !== GP_INFO.days[2][2] ? " " + GP_INFO.days[0][2] : ""} – ${GP_INFO.days[2][1]} ${GP_INFO.days[2][2] || GP_INFO.month} ${GP_INFO.year}</div>
      <h1><small>Gran Premio de</small>${GP_INFO.title}</h1>
      <div class="ci"><span class="flag es"></span>${CIRCUIT.name} · ${CIRCUIT.city}</div></div>
      <div class="gplt" id="gpLt"></div></div>
    <div class="gpr">
      <section class="gpp"><div class="gph"><b>Programa del fin de semana</b><span>Hora local · CEST</span></div>${cal}</section>
      <section class="gpp"><div class="gph"><b>El circuito</b><span>Datos oficiales</span></div><div class="gpfx">${facts}</div></section>
      <section class="gpp"><div class="gph"><b>Últimos ganadores</b><span>${GP_INFO.title}</span></div><ol class="gpw">${wins}</ol></section>
    </div></div>`;
  GPBG.lt = -1;
  $("mnGo").innerHTML = all ? "Estrategia<span class=\"lg\"> de carrera</span> ▶" : `Jugar <span class="lg">${SES_DEF[nx].name}</span><span class="sh">${SES_DEF[nx].id}</span> ▶`;
  $("mnSim").hidden = all; $("mnSimAll").hidden = all;
  if (!all) $("mnSim").innerHTML = `Simular <span class="lg">${SES_DEF[nx].name}</span><span class="sh">${SES_DEF[nx].id}</span>`;
  $("mnInfo").innerHTML = all ? `Parrilla: ${[0, 1].map(k => `${DRIVERS[k].code} <b>P${WK.grid[k] + 1}</b>`).join(" · ")}` : `Siguiente: <b>${SES_DEF[nx].long}</b> · ${SES_DEF[nx].day} ${SES_DEF[nx].hour}`;
}
// ---------- the flight: from corner to corner along the racing line, no cars, a broadcast caption for each corner ----------
const GPBG = { i: -1, t: 0, s0: 0, camS: 0, lt: -1, box: null };
const GP_FLY = 2.6, GP_HOLD = 5.4;
function gpCam(s) { let x = 0, y = 0; for (let o = -120; o <= 120; o += 40) { const p = sample(s + o); x += p.x; y += p.y; } return [x / 7, y / 7]; }
function gpLower() {
  const el = $("gpLt"); GPBG.lt = GPBG.i; if (!el) return;
  const k = GPBG.i, s = TURNS[k], v = sample(s).v * 3.6; let vin = 0; for (let d = 60; d <= 480; d += 20) vin = Math.max(vin, sample(s - d).v * 3.6);
  const sec = s < SECT_M[0] ? 1 : s < SECT_M[1] ? 2 : 3, kind = vin - v > 120 ? "Frenada fuerte" : vin - v > 45 ? "Curva media" : "Curva rápida";
  el.innerHTML = `<div class="num"><small>CURVA</small>${String(k + 1).padStart(2, "0")}</div><div class="tx"><em>Sector ${sec} · ${Math.round(s).toLocaleString("es-ES")} m</em><b>${kind}</b><span>${Math.round(vin)} → ${Math.round(v)} km/h · ${gearFor(v)}ª marcha</span></div><canvas class="mm" aria-hidden="true"></canvas>`;
  el.classList.remove("in"); void el.offsetWidth; el.classList.add("in");
  const cv = el.querySelector(".mm"), r = cv.getBoundingClientRect(); if (r.width < 10) return;
  const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const g = cv.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
  if (!GPBG.box) { let a = 1e9, b = -1e9, c = 1e9, e = -1e9; for (let i = 0; i < N; i++) { a = Math.min(a, RL.x[i]); b = Math.max(b, RL.x[i]); c = Math.min(c, RL.y[i]); e = Math.max(e, RL.y[i]); } GPBG.box = [a, b, c, e]; }
  const [bx0, bx1, by0, by1] = GPBG.box, sc = Math.min((r.width - 8) / (bx1 - bx0), (r.height - 8) / (by1 - by0));
  const P = (x, y) => [r.width / 2 + (x - (bx0 + bx1) / 2) * sc, r.height / 2 + (y - (by0 + by1) / 2) * sc];
  g.lineJoin = g.lineCap = "round"; g.strokeStyle = "#5b6470"; g.lineWidth = 2.2; g.beginPath();
  for (let i = 0; i <= N; i += 6) { const [x, y] = P(RL.x[i % N], RL.y[i % N]); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke();
  g.strokeStyle = "#f4f5f2"; g.lineWidth = 2.6; g.beginPath(); for (let o = -160; o <= 160; o += 20) { const p = sample(s + o), [x, y] = P(p.x, p.y); o === -160 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  const p = sample(s), [x, y] = P(p.x, p.y); g.beginPath(); g.arc(x, y, 3.6, 0, Math.PI * 2); g.fillStyle = "#e10600"; g.fill(); g.lineWidth = 1.4; g.strokeStyle = "#fff"; g.stroke();
}
function gpBgFrame(dt) {
  const cv = $("gpBg"); if (!cv) return;
  const W = cv.clientWidth, H = cv.clientHeight; if (W < 10 || H < 10) return;
  const d = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
  if (GPBG.i < 0) { GPBG.i = 0; GPBG.t = GP_FLY; GPBG.s0 = GPBG.camS = TURNS[0] - 40; }
  GPBG.t += Math.min(0.1, dt);
  if (GPBG.t > GP_FLY + GP_HOLD) { GPBG.s0 = GPBG.camS; GPBG.i = (GPBG.i + 1) % TURNS.length; GPBG.t = 0; }
  if (GPBG.lt !== GPBG.i) gpLower();
  const tgt = TURNS[GPBG.i] - 40; let s;
  if (GPBG.t < GP_FLY) { const a = GPBG.s0; let b = tgt; while (b < a - 1) b += LAP_M; s = a + (b - a) * pEase(GPBG.t / GP_FLY); }
  else s = tgt + (GPBG.t - GP_FLY) * 12;
  GPBG.camS = wrap(s);
  const now = performance.now() / 1000, wide = W >= 980, vw = wide ? 1300 : W >= 600 ? 980 : 660, z = W / vw * (1 + 0.035 * Math.sin(now / 4));
  const ox = wide ? (W - 640) * 0.5 : W * 0.5, oy = wide ? H * 0.52 : Math.min(H * 0.3, 250);
  let [cx, cy] = gpCam(GPBG.camS);
  const Hv = wide ? H : Math.min(H, oy + 330);                // on a phone only the top of the screen shows the circuit
  cx = Math.max(ox / z, Math.min(MAP_W - (W - ox) / z, cx)); cy = Math.max(oy / z, Math.min(MAP_H - (Hv - oy) / z, cy));
  const g = cv.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#0b0f14"; g.fillRect(0, 0, cv.width, cv.height);
  g.setTransform(d * z, 0, 0, d * z, d * (ox - cx * z), d * (oy - cy * z)); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  const x0 = Math.max(0, Math.floor(cx - ox / z - 2)), y0 = Math.max(0, Math.floor(cy - oy / z - 2)), x1 = Math.min(MAP_W, Math.ceil(cx + (W - ox) / z + 2)), y1 = Math.min(MAP_H, Math.ceil(cy + (H - oy) / z + 2));
  if (mapImg.complete && mapImg.naturalWidth && x1 > x0 && y1 > y0) { const sx = mapImg.naturalWidth / MAP_W, sy = mapImg.naturalHeight / MAP_H; g.drawImage(mapImg, x0 * sx, y0 * sy, (x1 - x0) * sx, (y1 - y0) * sy, x0, y0, x1 - x0, y1 - y0); }
  if (y1 >= MAP_H) { const fg = g.createLinearGradient(0, MAP_H - 160, 0, MAP_H); fg.addColorStop(0, "rgba(11,15,20,0)"); fg.addColorStop(1, "rgba(11,15,20,1)"); g.fillStyle = fg; g.fillRect(x0, MAP_H - 160, x1 - x0, 161); }   // the picture fades out where it ends
  const sC = TURNS[GPBG.i], px = 1 / z, show = clamp01(GPBG.t / 0.8);
  g.lineCap = g.lineJoin = "round";
  for (let o = -300; o < 300; o += 12) {                       // the racing line through the corner
    const a = sample(sC + o), b = sample(sC + o + 12);
    g.strokeStyle = `rgba(244,245,242,${(0.5 * show * (1 - Math.abs(o + 6) / 300)).toFixed(3)})`; g.lineWidth = 3 * px; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
  }
  const head = -300 + 600 * ((now % 2.4) / 2.4);               // a light running along it
  for (let o = head - 96; o < head; o += 6) {
    const a = sample(sC + o), b = sample(sC + o + 6), k = (o - head + 96) / 96, al = 0.95 * k * show * Math.max(0, 1 - Math.abs(o) / 320);
    if (al < 0.01) continue; g.strokeStyle = `rgba(255,42,60,${al.toFixed(3)})`; g.lineWidth = (2 + 3 * k) * px; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
  }
  g.textAlign = "center"; g.textBaseline = "middle";
  TURNS.forEach((ts, k) => {                                    // every corner numbered, the one on screen in red
    const p = sample(ts), side = turnOut[idxAt(ts)] || 1, hd = heading(ts), dd = 30 * px, bx = p.x - Math.sin(hd) * side * dd, by = p.y + Math.cos(hd) * side * dd, cur = k === GPBG.i, r = (cur ? 14 : 10) * px;
    if (bx < x0 - 40 || bx > x1 + 40 || by < y0 - 40 || by > y1 + 40) return;
    if (cur) { const pr = (now * 0.8) % 1; g.beginPath(); g.arc(p.x, p.y, (10 + 30 * pr) * px, 0, Math.PI * 2); g.strokeStyle = `rgba(255,255,255,${(0.75 * (1 - pr) * show).toFixed(3)})`; g.lineWidth = 2 * px; g.stroke(); }
    g.beginPath(); g.arc(bx, by, r, 0, Math.PI * 2); g.fillStyle = cur ? "#e10600" : "rgba(13,16,20,.82)"; g.fill(); g.lineWidth = 1.6 * px; g.strokeStyle = "#f4f5f2"; g.stroke();
    g.fillStyle = "#f4f5f2"; g.font = `700 ${(cur ? 12.5 : 9.5) * px}px ${MONO}`; g.fillText(k + 1, bx, by + 0.6 * px);
  });
}
$("mnWeekend").addEventListener("click", e => { const b = e.target.closest("[data-su]"); if (!b) return; weekendSetup(+b.dataset.su); });
function weekendSetup(k) {                                      // the set-up screen from the weekend menu (before a session)
  if (!SES) { cars = DRIVERS.map(newCar); cars.forEach(c => { c.gar = { ph: "park" }; c.work = 0; }); }
  openSetup(k);
}
function playSession(id) {
  startSession(id, false); menuShow(null);
  document.body.classList.add("ses"); SES.spd = 0; if (paused) togglePause(); ui.forEach(u => { u.ses(); u.open(true); });
  focus = 0; setFollow(true); autoRot = false; $("bRot").setAttribute("aria-pressed", false); cam.rot = 0;
  const p = carPos(cars[0]); cam.x = p.x; cam.y = p.y; cam.zoom = MAX_ZOOM; clampCam();
  $("rows").dataset.key = ""; [0, 1].forEach(k => { $("sd" + k).dataset.key = ""; });
  $("sbCtl").dataset.over = ""; sesHud.t = 0; sesHud.tw = 0; sesHud();
  toast(`${SES_DEF[id].long} · ¡semáforo verde, pit lane abierto!`, "good");
}
function simSession(id) { startSession(id, true); simRest(); }
function goPrep() {
  RACE_LAPS = MENU.laps || RACE_LAPS; if (isSeason()) sApplyPen(); newRace(); START.state = "menu"; $("lights").hidden = true; ui.forEach(u => u.sync());
  [0, 1].forEach(k => { RECS[k] = recommend(cars[k].skill); });
  RECS[1].stints.forEach((st, j) => { if (j < RECS[1].stints.length - 1 && RECS[0].stints.some((o, i) => i < RECS[0].stints.length - 1 && o.to === st.to)) { const nx = RECS[1].stints[j + 1].to; if (st.to + 1 < nx) st.to++; } });
  [0, 1].forEach(k => { PLANS[k] = JSON.parse(JSON.stringify(RECS[k])); });
  menuShow("prep");
}
$("mnSim").onclick = () => { if (!WK || WK.i >= SES_IDS.length) return; const id = SES_IDS[WK.i]; simSession(id); showSesResults(id); };
$("mnSimAll").onclick = () => { if (!WK) return; let id = null; while (WK.i < SES_IDS.length) { id = SES_IDS[WK.i]; simSession(id); } if (id) showSesResults(id); };

