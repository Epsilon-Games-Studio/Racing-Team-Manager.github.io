// =====================================================================================================
// ---------- SEASON MODE: state, car model, time, development, board, market, autosave ----------
// =====================================================================================================
var GAME = { mode: "gp" };
var S = null;                                                   // the season (null in a single Grand Prix)
const DRIVERS0 = DRIVERS.map(d => ({ code: d.code, name: d.name, num: d.num, team: d.team, cell: d.cell, col: d.col, box: d.box, skill: d.skill }));
const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.732;
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const isSeason = () => GAME.mode === "season" && !!S;
const money = v => `${(Math.round(v * 10) / 10).toLocaleString(OPT.lang === "en" ? "en-GB" : "es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M$`;
const MON = [["ENE", "JAN"], ["FEB", "FEB"], ["MAR", "MAR"], ["ABR", "APR"], ["MAY", "MAY"], ["JUN", "JUN"], ["JUL", "JUL"], ["AGO", "AUG"], ["SEP", "SEP"], ["OCT", "OCT"], ["NOV", "NOV"], ["DIC", "DEC"]];
const DOW = [["LUN", "MON"], ["MAR", "TUE"], ["MIÉ", "WED"], ["JUE", "THU"], ["VIE", "FRI"], ["SÁB", "SAT"], ["DOM", "SUN"]];
const sDateObj = d => new Date(S_DAY0 + d * 864e5);
function sDate(d, long) { const t = sDateObj(d), l = OPT.lang === "en" ? 1 : 0; return `${long ? DOW[(d % 7 + 7) % 7][l] + " " : ""}${t.getUTCDate()} ${MON[t.getUTCMonth()][l]}`; }
const sWeekN = d => Math.floor(d / 7) + 1;
// ---------- people ----------
const sLook = lk => { if (!lk) return null; const o = lk[5] || {}; return { skin: lk[0], hair: lk[1], hairCol: lk[2], beard: lk[3], glasses: lk[4], eyeCol: o.e || 0, face: o.f ? "f" : "m", x: o.x || [] }; };
const sFem = p => !!(p && p.look && p.look.face === "f");
const sRole = (p, kind) => { const k = kind || p.kind; if (sFem(p)) return L(...({ td: ["Directora técnica", "Technical director"], aero: ["Jefa de aerodinámica", "Head of aerodynamics"], eng: ["Ingeniera de carrera", "Race engineer"], sd: ["Directora deportiva", "Sporting director"] }[k] || S_ROLE[k])); return L(...S_ROLE[k]); };
function sPeopleInit() {
  const P = {};
  S_DRV.forEach(r => {
    const [code, first, age, pace, race, ovt, def, tyr, wet, fb, exp, sal, end, series, surname, nat, pot] = r;
    const d0 = DRIVERS0.find(d => d.code === code);
    const lk = S_LOOK[code];
    P[code] = { id: code, kind: "driver", first, last: surname || S_SURN[code] || (d0 ? d0.name : code), nat: nat || NAT[code] || "GB", age, a: { pace, race, ovt, def, tyr, wet, fb, exp },
      sal, end: end || 0, series: series || "F1", pot: pot || Math.max(pace, Math.round(pace + Math.max(0, 27 - age) * .6)), mot: 70, team: d0 ? d0.team : null, num: d0 ? d0.num : (S_NUM[code] || 50),
      look: sLook(lk), sprite: PORTRAIT.indexOf(code) >= 0 && PORTRAIT.indexOf(code) < 22, hist: [] };
    if (!NAT[code]) NAT[code] = P[code].nat; if (!FIRST[code]) FIRST[code] = first;
  });
  S_STAFF.forEach(r => {
    const [id, kind, name, nat, age, a1, a2, a3, a4, a5, sal, end, team, lk] = r, keys = S_ATTR[kind].map(x => x[0]), a = {};
    [a1, a2, a3, a4, a5].forEach((v, i) => { if (keys[i]) a[keys[i]] = v; });
    const sp = name.split(" ");
    P[id] = { id, kind, first: sp[0], last: sp.slice(1).join(" "), nat, age, a, sal, end, team, mot: 70, look: sLook(lk), hist: [] };
  });
  // race engineers for every team (two each), invented
  const EN = [["Tom", "Harris", "GB"], ["Laura", "Bianchi", "IT", 1], ["Will", "Joseph", "GB"], ["Mark", "Temple", "GB"], ["Andrea", "Conti", "IT"], ["James", "Urwin", "GB"], ["Xavi", "Marcos", "ES"],
    ["Gaëtan", "Jego", "FR"], ["Bradley", "Joyce", "GB"], ["Stefan", "Wolf", "DE"], ["Pierre", "Hamelin", "FR"], ["Alex", "Novak", "PL"], ["Dan", "Carter", "US"], ["Ruth", "Evans", "GB", 1],
    ["Mattia", "Spini", "IT"], ["Jörg", "Zander", "DE"], ["Akira", "Sato", "JP"], ["Nina", "Holm", "DK", 1], ["Luis", "Pardo", "ES"], ["Owen", "Blake", "AU"]];
  let ei = 0; const rr = rng(4242);
  TEAM_ORDER.forEach(t => {
    const have = Object.values(P).filter(p => p.kind === "eng" && p.team === t).length;
    for (let j = have; j < 2; j++) {
      const [f, l, nat, fem] = EN[ei++ % EN.length], id = "en" + t + j, lvl = S_LV[t] - 2, rp = a => a[Math.floor(rr() * a.length)];
      P[id] = { id, kind: "eng", first: f, last: l, nat, age: 30 + Math.floor(rr() * 20), a: { set: Math.round(lvl + rr() * 8 - 3), str: Math.round(lvl + rr() * 8 - 3), com: Math.round(lvl + rr() * 8 - 3) },
        sal: r1(.4 + (lvl - 65) * .03), end: 2026 + Math.floor(rr() * 2), team: t, mot: 70,
        look: fem ? { skin: Math.floor(rr() * 4), hair: rp(["long", "bob", "bun"]), hairCol: Math.floor(rr() * 7), beard: "none", glasses: rr() < .3 ? "glasses" : "none", eyeCol: Math.floor(rr() * 4), face: "f", x: [] }
          : { skin: Math.floor(rr() * 4), hair: rp(["classic", "buzz", "messy", "bald", "wavy", "receding", "quiff"]), hairCol: Math.floor(rr() * 8), beard: rp(["none", "stubble", "short", "none"]), glasses: rr() < .3 ? "glasses" : "none", eyeCol: Math.floor(rr() * 4), face: "m", x: [] }, hist: [] };
    }
  });
  // a free agent on the market: the best engineer in the paddock
  P.engpdf = { id: "engpdf", kind: "eng", first: "Paola", last: "Diazzi Fernandi", nat: "IT", age: 25, a: { set: 95, str: 94, com: 93 }, sal: 1.4, end: 0, team: null, mot: 80,
    look: { skin: 1, hair: "long", hairCol: 2, beard: "none", glasses: "none", eyeCol: 5, face: "f", x: [], fh: 14 }, hist: [] };
  return P;
}
const sOvr = p => {
  if (!p) return 0;
  if (p.kind === "driver") { const a = p.a; return Math.round(.3 * a.pace + .15 * a.race + .1 * a.ovt + .1 * a.def + .12 * a.tyr + .08 * a.wet + .08 * a.fb + .07 * a.exp); }
  const v = Object.values(p.a); return Math.round(v.reduce((x, y) => x + y, 0) / v.length);
};
const sName = p => p ? `${p.first} ${p.last}` : "—";
const sPerson = id => S && S.people[id];
const sTeamStaff = (t, kind) => Object.values(S.people).filter(p => p.kind === kind && p.team === t);
const sTD = t => sTeamStaff(t, "td")[0], sAero = t => sTeamStaff(t, "aero")[0];
const sEngs = t => sTeamStaff(t, "eng").slice(0, 2);
const sSD = t => sTeamStaff(t, "sd")[0];
function sPeopleMigrate() {                                     // a save from before new staff or new looks: bring it up to date
  if (!S) return; const fresh = sPeopleInit();
  Object.values(fresh).forEach(p => { const o = S.people[p.id];
    if (!o) { if (p.team && p.kind !== "driver" && sTeamStaff(p.team, p.kind).length) p.team = null; S.people[p.id] = p; }
    else if (p.look) o.look = p.look; });
}
const sMyDrv = () => [DRIVERS[0].code, DRIVERS[1].code].map(c => S.people[c]);
// ---------- the car ----------
function sTeamStats(t) {                                        // a team's 2026 car before any development
  const st = {}, lv = S_LV[t], pr = S_PROF[t] || {}, pw = PU_POW[TEAMS[t].pu] || 84, r = rng(t.charCodeAt(0) * 97 + t.charCodeAt(2));
  ST.forEach(s => { st[s] = lv + (pr[s] || 0) + (r() - .5) * 3; });
  st.top += (pw - 85) * .6; st.trc += (pw - 85) * .3; st.rel += (pw - 85) * .4;
  ST.forEach(s => st[s] = r1(clampN(st[s], 30, 99)));
  return st;
}
const carPerf = st => Object.entries(TRACK_W).reduce((a, [s, w]) => a + w * (st[s] - 60) / 40, 0);
const carSkill = st => PERF_K * carPerf(st) - PERF_C;
const carRating = st => Math.round(Object.entries(TRACK_W).reduce((a, [s, w]) => a + w * st[s], 0));
const condF = c => c >= 50 ? 1 : Math.max(.35, c / 50);
function sCarStats(k, known) {                                  // the player's car k (0, 1): design + fitted parts
  const C = S.car, base = known ? (C.revealed ? C.act : C.pred) : C.act; if (!base) return sTeamStats(S.team);
  const st = { ...base };
  PART_K.forEach(p => {
    const u = S.units.find(x => x.id === S.fit[k][p]), P = CPARTS[p];
    if (!u) { ST.forEach(s => { if (P.st[s]) st[s] -= 14 * P.st[s] / .35; }); return; }
    const sp = S.specs[p][u.n - 1], g = known ? (sp.known ? sp.gain : sp.est) : sp.gain, f = condF(u.cond);
    ST.forEach(s => { st[s] += (g[s] || 0) * f; if (u.cond < 50 && P.st[s]) st[s] -= (50 - u.cond) / 50 * 4 * P.st[s] / .35; });
  });
  ST.forEach(s => st[s] = r1(clampN(st[s], 20, 110)));
  return st;
}
const sTeamCar = t => t === S.team ? sCarStats(0) : S.teams[t].st;
function drvSkill(p) { if (!p) return 0; const a = p.a; return (a.pace - 85) * .00016 + (a.race - 85) * .00005 + ((p.mot ?? 70) - 65) * .00002; }
function sApply() {                                             // the cars and drivers as the race engine sees them
  if (!S) return;
  DRIVERS.forEach((d, k) => {
    const st = d.team === S.team ? sCarStats(k < 2 ? k : 0) : S.teams[d.team].st;
    d.skill = carSkill(st) + drvSkill(S.people[d.code]);
  });
  TEAM_ORDER.forEach(t => { const ds = DRIVERS.filter(d => d.team === t); TEAMS[t].skill = ds.reduce((a, d) => a + d.skill, 0) / Math.max(1, ds.length); });
  if (cars && cars.length) cars.forEach((c, k) => { if (DRIVERS[k]) c.skill = DRIVERS[k].skill; });
}
// ---------- the season ----------
function sNew(team) {
  S = { v: 1, team, day: 0, cal: S_CAL.map(e => ({ ...e, done: false })), steps: { board: false, design: false, squad: false },
    cash: 0, cap: 0, ledger: [], cashH: [], people: null, crew: {}, teams: {}, car: { design: null, act: null, pred: null, sig: 6, revealed: false },
    specs: {}, units: [], uid: 1, fit: [{}, {}], proj: [], pu: null, stand: { d: {}, t: {}, rounds: [] }, news: [], atr: { q: 1, hours: 0, used: 0 },
    mediaH: [], board: null, train: { sim: false }, tests: [], upgRaced: [], hist: [], seed: Math.floor(Math.random() * 1e9) };
  S.people = sPeopleInit();
  const rs = Object.values(S.people).filter(p => p.kind === "driver" && !p.team && p.series === "Reserva").sort((a, b) => sOvr(b) - sOvr(a))[0];   // the team's reserve driver
  if (rs) { S.rsv = rs.id; rs.team = team; } else S.rsv = null;
  TEAM_ORDER.forEach(t => { S.teams[t] = { st: sTeamStats(t), dev: [] }; const c = S_CREW[t]; S.crew[t] = { chief: c[0], nat: c[1], spd: c[2], cons: c[3], fit: c[4], mot: 70, fat: 15 }; });
  // board expectations: the teams ranked by what they bring into 2026
  const order = [...TEAM_ORDER].sort((a, b) => carRating(S.teams[b].st) + sOvr(sTD(b)) * .3 - (carRating(S.teams[a].st) + sOvr(sTD(a)) * .3));
  const exp = order.indexOf(team) + 1, B = 150 + (11 - exp) * 8;
  TEAM_ORDER.forEach(t => { if (MEDIA[t] == null) MEDIA[t] = mediaBase(t); });   // the media value no longer follows the car: it moves with what happens
  S.board = { conf: 60, exp, target: exp, B, amb: 0, met: [], hist: [], q: 1, obj: null, asked: false, order };
  S.board.obj = sObjectives(1, 0);
  S.atr.hours = sAtrHours();
  sNews(L("Bienvenido al equipo. La junta directiva te espera para fijar el presupuesto y los objetivos.", "Welcome to the team. The board is waiting to set the budget and the targets."), "board");
  sNews(L("Nuevo reglamento 2026: todos los equipos empiezan un coche desde cero. Diseña el tuyo antes del test de Barcelona.", "New 2026 rules: every team starts a car from scratch. Design yours before the Barcelona test."), "dev");
  sMediaLog();
  return S;
}
function sNews(txt, k = "info") { S.news.unshift({ d: S.day, txt, k }); if (S.news.length > 60) S.news.length = 60; }
function sSpend(amt, cat, txt, cap = true) {                    // money out (negative amt = income)
  S.cash = r2(S.cash - amt); if (cap && amt > 0) S.cap = r2(S.cap + amt);
  const last = S.ledger[S.ledger.length - 1];
  if (last && last.d === S.day && last.cat === cat && last.txt === txt) last.a = r2(last.a + amt); else S.ledger.push({ d: S.day, cat, a: r2(amt), txt });
  if (S.ledger.length > 600) S.ledger.splice(0, S.ledger.length - 600);
}
const CAT = { drv: ["Salarios de pilotos", "Driver salaries"], staff: ["Personal y fábrica", "Staff and factory"], dev: ["Desarrollo", "Development"], mfg: ["Fabricación", "Manufacturing"],
  ops: ["Operaciones de carrera", "Race operations"], tun: ["Túnel de viento", "Wind tunnel"], des: ["Diseño del coche", "Car design"], spo: ["Patrocinio", "Sponsorship"],
  brd: ["Junta directiva", "Board"], mkt: ["Fichajes", "Signings"], trn: ["Entrenamiento", "Training"] };
function sAtrHours() {                                          // aerodynamic testing restriction: fewer hours for the teams at the front
  const pos = sConsPos(S.team) || S.board.exp, k = .7 + (pos - 1) * .045;
  return Math.round(36 * k);
}
function sConsPos(t) { const o = sConsOrder(); return o.indexOf(t) + 1; }
function sConsOrder() { return [...TEAM_ORDER].sort((a, b) => (S.stand.t[b] || 0) - (S.stand.t[a] || 0) || S_LV[b] - S_LV[a]); }
function sDrvOrder() { return Object.keys(S.stand.d).sort((a, b) => S.stand.d[b] - S.stand.d[a]); }
function sMediaLog() { S.mediaH.push([S.day, mediaOf(S.team)]); }
// ---------- board objectives ----------
const BEST = [0, 1, 2, 3, 4, 6, 7, 9, 10, 11, 12, 14];
function sObjectives(q, amb) {
  const E = clampN(S.board.target, 1, 11), pts = Math.max(1, Math.round(PPR[E] * 2 * (1 + amb * .8))), best = Math.max(1, BEST[E] - (amb >= .15 ? 1 : 0));
  const third = q === 1 ? { k: "media", t: mediaOf(S.team) + 3 } : q === 2 ? { k: "upg", t: 2 + (amb >= .15 ? 1 : 0) } : q === 3 ? { k: "cap", t: 100 } : { k: "fin", t: 3 };
  return { q, items: [{ k: "pts", t: pts }, { k: "best", t: best }, third], season: S.board.target };
}
const OBJ_N = { pts: ["Puntos en el trimestre", "Points this quarter"], best: ["Mejor resultado en carrera", "Best race finish"], media: ["Valor mediático", "Media value"],
  upg: ["Mejoras llevadas a pista", "Upgrades raced"], cap: ["Gasto dentro del ritmo del límite", "Spending within the cap pace"], fin: ["Coches que terminan (de 4)", "Car finishes (of 4)"] };
function sObjValue(o) {                                         // where an objective stands now
  const q = S.board.obj.q, rs = S.stand.rounds.filter(r => Math.ceil(r.r / 2) === q), mine = rs.flatMap(r => r.res.filter(x => x[1] === S.team));
  if (o.k === "pts") return mine.reduce((a, x) => a + x[3], 0);
  if (o.k === "best") { const ps = mine.filter(x => x[2]).map(x => x[2]); return ps.length ? Math.min(...ps) : null; }
  if (o.k === "media") return mediaOf(S.team);
  if (o.k === "upg") return S.upgRaced.filter(u => Math.ceil(u.r / 2) === q).length;
  if (o.k === "cap") { const el = Math.max(1, S.day), pace = S.cap / el * 196; return Math.round(pace / S_CAP * 100); }
  if (o.k === "fin") return mine.filter(x => x[2]).length;
  return 0;
}
function sObjScore(o) {
  const v = sObjValue(o); if (v == null) return 0;
  const lower = o.k === "best" || o.k === "cap";
  if (lower) return v <= o.t ? 1 : clampN(o.t / v, 0, .9);
  return v >= o.t ? 1 : clampN(v / Math.max(1, o.t), 0, .9);
}
// ---------- time ----------
const sPending = () => S.cal.find(e => !e.done);
function sCanAdvance() {
  if (!S.steps.board) return L("Primero, la reunión con la junta directiva", "First, the board meeting");
  if (!S.steps.design) return L("Aprueba el diseño del coche en Desarrollo › I+D+i", "Approve the car design in Development › R&D");
  return null;
}
function sAdvance(oneWeek) {                                    // day by day until the next event or something worth stopping for
  const ev = sPending(); if (!ev || S.day >= ev.day) return "event";
  const stopAt = oneWeek ? Math.min(ev.day, S.day + 7) : ev.day;
  let stop = false;
  while (S.day < stopAt && !stop && !S.fired) { S.day++; stop = sDay(); }
  sApply(); saveGame();
  return S.day >= ev.day ? "event" : stop ? "stop" : "ok";
}
function sDay() {                                               // one day: projects, factory, tunnel; on Mondays the week's money and morale
  let stop = false;
  for (const P of [...S.proj]) {
    if (P.kind === "mfg") {
      if (S.proj.filter(x => x.kind === "mfg").indexOf(P) >= 2) continue;   // two production lines
      if (P.go == null) P.go = S.day - 1;                       // the day the line really started on it
      P.prog = (P.prog || 0) + 1;
      while (P.prog >= P.per && P.done < P.qty) { P.prog -= P.per; P.done++; sUnitAdd(P.p, P.n); }
      if (P.done >= P.qty) { S.proj.splice(S.proj.indexOf(P), 1); sHist({ k: "mfg", p: P.p, n: P.n, qty: P.qty, a: P.go ?? P.start ?? S.day - P.qty * P.per, b: S.day }); sNews(L(`Fábrica: ${P.qty} × ${L(...CPARTS[P.p].n)} Spec ${P.n} listos. Móntalos en Operaciones.`, `Factory: ${P.qty} × ${L(...CPARTS[P.p].n)} Spec ${P.n} ready. Fit them in Operations.`), "mfg"); stop = true; }
      continue;
    }
    if (S.day < P.end) continue;
    S.proj.splice(S.proj.indexOf(P), 1); stop = true;
    sHist({ k: P.kind, p: P.p || null, n: P.n || null, a: P.start, b: S.day, amb: P.amb });
    if (P.kind === "design") sDesignDone();
    else if (P.kind === "dev") sDevDone(P);
    else if (P.kind === "test") sTestDone(P);
  }
  if (S.day % 7 === 0) sWeek();
  return stop;
}
function sHist(h) { (S.hist = S.hist || []).push(h); if (S.hist.length > 300) S.hist.splice(0, S.hist.length - 300); }
function sWeek() {
  const t = S.team, drv = sMyDrv().reduce((a, p) => a + (p ? p.sal : 0), 0) + (S.people[S.rsv]?.sal || 0);
  const staffBase = 1.0 + (S_LV[t] - 67) * .03, keyStaff = [sAero(t), sSD(t), ...sEngs(t)].reduce((a, p) => a + (p ? p.sal : 0), 0), td = sTD(t);
  sSpend(r2(drv / 52), "drv", L("Salarios de pilotos", "Driver salaries"), false);
  sSpend(r2((td ? td.sal : 0) / 52), "staff", L("Director técnico", "Technical director"), false);
  sSpend(r2(staffBase + keyStaff / 52), "staff", L("Nóminas de fábrica y personal", "Factory and staff payroll"));
  sSpend(-r2(.3 + mediaOf(t) / 100 * 1.0), "spo", L("Patrocinadores", "Sponsors"), false);
  S.cashH.push([S.day, S.cash]);
  sConfWeek();
  // morale: drifts back towards normal; the crew recovers
  const cr = S.crew[t], sd = sSD(t); cr.fat = Math.max(0, cr.fat - 4 - ((sd ? sd.a.lead : 78) - 78) * .1); cr.mot += ((sd ? 66 + (sd.a.lead - 78) * .3 : 70) - cr.mot) * .08;
  Object.values(S.people).forEach(p => { if (p.team === t) p.mot = r1(p.mot + (70 - p.mot) * .05); });
  if (S.day >= 28) sAiDev();
}
function sAiDev() {                                             // the rivals bring their own upgrades
  TEAM_ORDER.forEach(t => {
    if (t === S.team) return;
    const td = sTD(t), lvl = td ? (sOvr(td) - 80) : 0, g = Math.max(.6, (2.2 + lvl * .12 + (S_LV[t] - 75) * .05) * (.6 + Math.random() * .8));
    const p = pick(PART_K), T = S.teams[t];
    ST.forEach(s => { if (CPARTS[p].st[s]) T.st[s] = r1(T.st[s] + g * CPARTS[p].st[s]); });
    T.dev.push([S.day, p, r1(g)]);
    if (g > 3.2 && Math.random() < .5) sNews(L(`${TEAMS[t].full} estrena ${L(...CPARTS[p].n).toLowerCase()} nuevo.`, `${TEAMS[t].full} bring a new ${L(...CPARTS[p].n).toLowerCase()}.`), "rival");
  });
}
// ---------- car design (pre-season) ----------
const DES_AX = ["top", "hs", "ms", "ls", "mech", "cool", "tyr"];
const DES_N = { top: ["Velocidad en recta", "Straight-line speed"], hs: ["Curvas rápidas", "Fast corners"], ms: ["Curvas medias", "Medium corners"], ls: ["Curvas lentas", "Slow corners"],
  mech: ["Frenada y tracción", "Braking and traction"], cool: ["Refrigeración", "Cooling"], tyr: ["Gestión de neumáticos", "Tyre management"] };
const DES_DAYS = 28;
function sDesignLevel(D) {
  const t = S.team, td = sTD(t), ae = sAero(t);
  return S_LV[t] + ((td ? td.a.des : 80) - 85) * .15 + ((ae ? ae.a.aer : 80) - 80) * .06 + (D.inv - 12) * .4;
}
function sDesignTarget(D) {                                     // what the concept asks for
  const sum = Math.max(DES_PTS, DES_AX.reduce((a, k) => a + D.pr[k], 0)), dv = {}; DES_AX.forEach(k => dv[k] = D.pr[k] / sum * 7 - 1);   // free points are wasted
  const L0 = sDesignLevel(D), pw = PU_POW[TEAMS[S.team].pu] || 84, st = {};
  st.top = L0 + 6 * dv.top - 2.4 * dv.hs - 1.8 * dv.ms - 1.5 * dv.cool + (pw - 85) * .6;
  st.hs = L0 + 6 * dv.hs - 2.6 * dv.top - .8 * dv.ls;
  st.ms = L0 + 6 * dv.ms - 1.6 * dv.top;
  st.ls = L0 + 6 * dv.ls - 1.0 * dv.hs;
  st.brk = L0 + 4.5 * dv.mech + 1.5 * dv.ls;
  st.trc = L0 + 4.5 * dv.mech - .8 * dv.top + (pw - 85) * .3;
  st.cool = L0 + 6 * dv.cool - 1.2 * dv.top;
  st.tyr = L0 + 6 * dv.tyr - 1.0 * dv.ls;
  st.dirty = L0 + 2.5 * dv.hs + 2.5 * dv.ms - dv.top;
  st.rel = L0 + 3 * dv.cool + (D.dd - 14) * .3 + (pw - 85) * .4;
  ST.forEach(s => st[s] = r1(clampN(st[s], 30, 99)));
  return st;
}
const sDesSig = D => ({ d: r1(6.5 * Math.sqrt(10 / D.dd)), t: r1(7 * Math.sqrt(7 / (DES_DAYS - D.dd)) * (1.3 - ((sAero(S.team)?.a.cor) || 80) / 150)) });
function sDesignStart(D) {
  const tg = sDesignTarget(D), sg = sDesSig(D), act = {}, pred = {}, lvn = gauss() * 1.2;
  ST.forEach(s => { act[s] = r1(clampN(tg[s] + lvn + gauss() * sg.d, 30, 99)); pred[s] = r1(clampN(act[s] + gauss() * sg.t, 30, 99)); });
  S.car.design = { ...D, tg, sig: sg, start: S.day };
  S.car.act = act; S.car.predHidden = pred; S.car.pred = null; S.car.sig = sg.t;
  const units = PART_K.reduce((a, p) => a + CPARTS[p].stock * CPARTS[p].unit, 0);
  sSpend(D.inv, "des", L("Diseño del monoplaza 2026", "2026 car design"));
  sSpend(r2(units), "mfg", L("Primeras unidades (Spec 1)", "First units (Spec 1)"));
  S.proj.push({ kind: "design", start: S.day, end: S.day + DES_DAYS, dd: D.dd });
  S.steps.design = true;
  sNews(L(`Diseño aprobado: ${D.dd} días de diseño y fabricación, ${DES_DAYS - D.dd} de túnel de viento. Test en Barcelona el ${sDate(28)}.`, `Design approved: ${D.dd} days of design and build, ${DES_DAYS - D.dd} in the wind tunnel. Barcelona test on ${sDate(28)}.`), "dev");
}
function sDesignDone() {
  S.car.pred = S.car.predHidden;
  PART_K.forEach(p => { S.specs[p] = [{ n: 1, st: "track", E: 0, gain: {}, est: {}, sig: 0, tested: true, known: true, focus: null, amb: 0 }]; });
  PART_K.forEach(p => { for (let i = 0; i < CPARTS[p].stock; i++) sUnitAdd(p, 1, true); });
  [0, 1].forEach(k => PART_K.forEach(p => { const u = S.units.filter(x => x.p === p)[k]; if (u) { S.fit[k][p] = u.id; u.car = k; } }));
  S.pu = { used: [{}, {}], cond: [{}, {}], pen: [0, 0] };
  [0, 1].forEach(k => Object.keys(PU_EL).forEach(e => { S.pu.used[k][e] = 1; S.pu.cond[k][e] = 100; }));
  S.pop = { k: "design" };
  sNews(L("El coche 2026 está construido. El túnel de viento ha dado su predicción: compruébala en el test.", "The 2026 car is built. The wind tunnel has given its prediction: check it at the test."), "dev");
}
function sUnitAdd(p, n, quiet) { S.units.push({ id: S.uid++, p, n, cond: 100, car: null }); }
// ---------- development of parts ----------
const sSlots = () => (sOvr(sTD(S.team)) >= 90 ? 4 : 3);
function sDevPlan(p, amb, focus, urg) {                         // what a project would cost and bring
  const t = S.team, td = sTD(t) || { a: { des: 80, inn: 80, mgt: 80 } }, ae = sAero(t) || { a: { aer: 80 } }, P = CPARTS[p], A = AMB[amb];
  const E = r1(A.g * (1 + (td.a.des - 80) / 100) * (P.aero ? 1 + (ae.a.aer - 80) / 150 : 1));
  const u = r2(A.u * (1.15 - td.a.inn / 200));
  const days = Math.max(5, Math.round(P.days * A.d * (1.25 - td.a.mgt / 200) * (urg ? .75 : 1)));
  const cost = r2(P.cost * A.c * (urg ? 1.4 : 1));
  const w = { ...P.st }; if (focus && w[focus]) w[focus] *= 1.8; const sw = Object.values(w).reduce((a, b) => a + b, 0);
  const dist = {}; Object.keys(w).forEach(s => dist[s] = w[s] / sw);
  const est = {}; Object.keys(dist).forEach(s => est[s] = r2(E * dist[s]));
  return { p, amb, focus, urg, E, u, days, cost, dist, est };
}
const sGainSec = g => { const st0 = {}; ST.forEach(s => st0[s] = 70); const st1 = { ...st0 }; Object.keys(g).forEach(s => st1[s] += g[s]); return r2((carSkill(st1) - carSkill(st0)) * LAP_REF); };
function sDevStart(pl) {
  const n = S.specs[pl.p].length + 1 + S.proj.filter(x => x.kind === "dev" && x.p === pl.p).length;
  const m = 1 + gauss() * pl.u, gain = {}; Object.keys(pl.dist).forEach(s => gain[s] = r2(pl.E * m * pl.dist[s]));
  sSpend(pl.cost, "dev", `${L(...CPARTS[pl.p].n)} Spec ${n}`);
  S.proj.push({ kind: "dev", p: pl.p, n, amb: pl.amb, focus: pl.focus, urg: pl.urg, E: pl.E, u: pl.u, est: pl.est, gain, start: S.day, end: S.day + pl.days, cost: pl.cost });
  sNews(L(`I+D: empieza el diseño de ${L(...CPARTS[pl.p].n).toLowerCase()} Spec ${n} (${pl.days} días).`, `R&D: design of ${L(...CPARTS[pl.p].n).toLowerCase()} Spec ${n} starts (${pl.days} days).`), "dev");
  saveGame();
}
function sDevDone(P) {
  const sp = { n: P.n, st: "ready", E: P.E, gain: P.gain, est: { ...P.est }, sig: r2(P.E * P.u * .8), tested: false, known: false, focus: P.focus, amb: P.amb, made: 0 };
  const arr = S.specs[P.p]; arr[P.n - 1] = sp;
  for (let i = 0; i < arr.length; i++) if (!arr[i]) arr[i] = { n: i + 1, st: "design", E: 0, gain: {}, est: {}, sig: 0 };
  sNews(L(`I+D: ${L(...CPARTS[P.p].n)} Spec ${P.n} diseñado. Pruébalo en el túnel o mándalo a fabricar.`, `R&D: ${L(...CPARTS[P.p].n)} Spec ${P.n} designed. Test it in the tunnel or send it to the factory.`), "dev");
}
function sTestPlan(p, n) { const sp = S.specs[p][n - 1], A = AMB[sp.amb || 0], P = CPARTS[p]; return { hours: P.aero ? A.h : 0, days: A.t, cost: P.aero ? r2(.06 * A.h) : .15 }; }
function sTestStartPart(p, n) {
  const pl = sTestPlan(p, n); if (pl.hours > S.atr.hours - S.atr.used) return false;
  S.atr.used += pl.hours; sSpend(pl.cost, "tun", `${L(...CPARTS[p].n)} Spec ${n}`);
  S.proj.push({ kind: "test", p, n, start: S.day, end: S.day + pl.days, hours: pl.hours });
  S.specs[p][n - 1].st = "testing"; saveGame(); return true;
}
function sTestDone(P) {
  const sp = S.specs[P.p][P.n - 1], ae = sAero(S.team), cor = ae ? ae.a.cor : 80;
  sp.tested = true; sp.st = "ready"; S.pop = { k: "part", p: P.p, n: P.n }; sp.sig = r2(sp.E * AMB[sp.amb || 0].u * .15 * (1.25 - cor / 200));
  const est = {}; Object.keys(sp.gain).forEach(s => est[s] = r2(sp.gain[s] + gauss() * sp.sig * .5)); sp.est = est;
  const sec = -sGainSec(sp.est);
  sNews(L(`${CPARTS[P.p].aero ? "Túnel de viento" : "Banco de pruebas"}: ${L(...CPARTS[P.p].n)} Spec ${P.n} confirma ${sec <= 0 ? "una ganancia de " + Math.abs(sec).toFixed(2) + " s por vuelta" : "una pérdida de " + sec.toFixed(2) + " s por vuelta"}.`,
    `${CPARTS[P.p].aero ? "Wind tunnel" : "Test rig"}: ${L(...CPARTS[P.p].n)} Spec ${P.n} shows ${sec <= 0 ? "a gain of " + Math.abs(sec).toFixed(2) + " s a lap" : "a loss of " + sec.toFixed(2) + " s a lap"}.`), "dev");
}
function sMfgStart(p, n, qty) {
  const sp = S.specs[p][n - 1], A = AMB[sp.amb || 0], P = CPARTS[p], cost = r2(P.unit * A.mu * qty);
  sSpend(cost, "mfg", `${L(...P.n)} Spec ${n} × ${qty}`);
  S.proj.push({ kind: "mfg", p, n, qty, done: 0, per: P.mfg, prog: 0, cost, start: S.day });
  sp.made = (sp.made || 0) + qty; saveGame();
}
// ---------- the car on track: fitting, wear, reliability ----------
function sFitAuto() {                                           // every slot filled with the best usable unit
  [0, 1].forEach(k => PART_K.forEach(p => {
    let u = S.units.find(x => x.id === S.fit[k][p]);
    if (u && u.cond > 35) return;                                // a worn part is swapped for a fresh one of the same spec or better
    const free = S.units.filter(x => x.p === p && x.car == null && x.cond > 0 && (!u || (x.n >= u.n && x.cond > u.cond + 20))).sort((a, b) => b.n - a.n || b.cond - a.cond);
    if (free[0]) { if (u) u.car = null; free[0].car = k; S.fit[k][p] = free[0].id; }
    else delete S.fit[k][p];
  }));
}
function sFit(k, p, id) {
  const u = S.units.find(x => x.id === id); if (!u || u.car === (1 - k)) return;
  const old = S.units.find(x => x.id === S.fit[k][p]); if (old) old.car = null;
  u.car = k; S.fit[k][p] = id; sApply(); saveGame();
}
function sFailLap(k, team) {                                    // reliability: maybe a breakdown, on a random lap
  const st = team === S.team ? sCarStats(k) : S.teams[team].st;
  let p = .004 + Math.max(0, 80 - st.rel) * .0015 + Math.max(0, 75 - st.cool) * .0006;
  if (team === S.team && S.pu) { Object.keys(PU_EL).forEach(e => { const c = S.pu.cond[k][e]; if (c < 25) p += (25 - c) * .003; }); PART_K.forEach(pp => { const u = S.units.find(x => x.id === S.fit[k][pp]); if (u && u.cond < 20) p += .02; }); }
  return Math.random() < p ? 3 + Math.floor(Math.random() * Math.max(4, RACE_LAPS - 6)) : 0;
}
function sWear(crashed) {                                       // a race weekend on the parts and the power units
  [0, 1].forEach(k => {
    PART_K.forEach(p => { const u = S.units.find(x => x.id === S.fit[k][p]); if (!u) return; u.cond = Math.max(0, Math.round(u.cond - CPARTS[p].wear * (.8 + Math.random() * .4))); });
    if (crashed[k]) {
      const fw = S.units.find(x => x.id === S.fit[k].fw); if (fw) fw.cond = 0;
      const fl = S.units.find(x => x.id === S.fit[k].fl); if (fl) fl.cond = Math.max(0, fl.cond - 30);
      const su = S.units.find(x => x.id === S.fit[k].su); if (su) su.cond = Math.max(0, su.cond - 35);
      sNews(L(`Daños en el coche de ${S.people[DRIVERS[k].code].last}: alerón delantero destruido.`, `Damage on ${S.people[DRIVERS[k].code].last}'s car: front wing destroyed.`), "warn");
    }
    if (S.pu) Object.keys(PU_EL).forEach(e => { S.pu.cond[k][e] = Math.max(0, Math.round(S.pu.cond[k][e] - PU_EL[e][2] * (.85 + Math.random() * .3))); });
  });
  const dead = S.units.filter(u => u.cond <= 0);
  dead.forEach(u => { [0, 1].forEach(k => { if (S.fit[k][u.p] === u.id) delete S.fit[k][u.p]; }); });
  S.units = S.units.filter(u => u.cond > 0);
  sFitAuto();
}
function sPuNew(k, e) {                                         // a new power-unit element: beyond the allocation, a grid penalty
  S.pu.used[k][e]++; S.pu.cond[k][e] = 100;
  if (S.pu.used[k][e] > PU_EL[e][1]) { S.pu.pen[k] += S.pu.used[k][e] === PU_EL[e][1] + 1 ? 10 : 5; sNews(L(`Penalización: ${S.people[DRIVERS[k].code].last} saldrá ${S.pu.pen[k]} puestos más atrás.`, `Penalty: ${S.people[DRIVERS[k].code].last} drops ${S.pu.pen[k]} places on the grid.`), "warn"); }
  sSpend(.4, "mfg", L(...PU_EL[e][0])); saveGame();
}
// ---------- the market ----------
const sMarketOpen = () => S_WINDOWS.some(([a, b]) => S.day >= a && S.day <= b);
function sDemand(p) {                                           // what they would ask the player's team for
  const base = p.kind === "driver" ? Math.max(.5, p.sal * 1.05 + Math.max(0, sOvr(p) - 84) * 1.2) : Math.max(.3, p.sal * 1.1);
  return r1(base);
}
function sBuyout(p) { if (!p.team || p.team === S.team) return 0; const yrs = Math.max(1, (p.end || 2026) - 2025); return r1(p.sal * yrs * (p.kind === "driver" ? .8 : 1.2) + (p.kind === "td" ? 4 : 0)); }
function sTeamRank(t) { const o = [...TEAM_ORDER].sort((a, b) => carRating(sTeamCar(b)) - carRating(sTeamCar(a))); return o.indexOf(t) + 1; }
function sAccept(p, sal, yrs, role) {                           // chance they say yes
  const dem = sDemand(p), my = sTeamRank(S.team), th = p.team ? sTeamRank(p.team) : 12;
  let x = .45 + (sal / dem - 1) * 1.6 + (th - my) * .045 + (mediaOf(S.team) - 60) * .004 + (p.team ? 0 : .18);
  if (p.kind === "driver" && role === "res" && sOvr(p) > 80) x -= .35;
  if (p.kind === "driver" && p.age > 32 && yrs >= 3) x -= .1;
  if (p.kind !== "driver" && yrs >= 3) x += .05;
  return clampN(x, .02, .97);
}
function sSign(p, sal, yrs, role) {                             // role: 0 / 1 = race seat, "res" = reserve, or the staff role
  const buy = sBuyout(p), from = p.team, out = [];
  if (buy) sSpend(buy, "mkt", L(`Cláusula de ${sName(p)}`, `${sName(p)} release fee`), false);
  p.sal = sal; p.end = 2025 + yrs; p.mot = Math.min(95, (p.mot || 70) + 12);
  if (p.kind === "driver") {
    if (role === "res") { const old = S.people[S.rsv]; if (old) { old.team = null; old.series = "Libre"; out.push(old); } S.rsv = p.id; if (from) sSeatRefill(from, p.id); p.team = S.team; p.series = "Reserva"; }
    else {
      const k = +role, old = S.people[DRIVERS[k].code];
      if (from) { const kk = DRIVERS.findIndex(d => d.code === p.id); if (kk >= 0) sSeat(kk, null); }
      if (S.rsv === p.id) S.rsv = null;
      sSeat(k, p.id);
      if (old) { if (!S.rsv) { S.rsv = old.id; old.series = "Reserva"; old.team = S.team; } else { old.team = null; old.series = "Libre"; sSpend(r1(old.sal * .3), "mkt", L(`Finiquito de ${sName(old)}`, `${sName(old)} severance`), false); } }
      if (from) sSeatRefill(from);
    }
  } else {
    const cur = p.kind === "eng" ? sEngs(S.team)[+role || 0] : sTeamStaff(S.team, p.kind)[0];
    if (cur) { cur.team = null; out.push(cur); }
    p.team = S.team;
    if (from) { const rep = Object.values(S.people).filter(x => x.kind === p.kind && !x.team && x !== cur).sort((a, b) => sOvr(b) - sOvr(a))[0] || cur; if (rep) rep.team = from; }
  }
  sNews(L(`Fichaje: ${sName(p)} se une al equipo como ${role === "res" ? "piloto reserva" : sRole(p).toLowerCase()}.`, `Signing: ${sName(p)} joins the team as ${role === "res" ? "reserve driver" : L(...S_ROLE[p.kind]).toLowerCase()}.`), "mkt");
  sRosterChanged(); saveGame();
}
function sSeat(k, code) {                                       // a race seat changes hands (the car stays)
  const d = DRIVERS[k]; if (!code) return;
  const p = S.people[code]; d.code = code; d.name = p.last.toUpperCase(); d.num = p.num; p.team = d.team; p.series = "F1";
  if (!NAT[code]) NAT[code] = p.nat; if (!FIRST[code]) FIRST[code] = p.first;
}
function sSeatRefill(t, except) {                               // a team that lost a driver takes the best one available
  const seats = DRIVERS.map((d, k) => ({ d, k })).filter(x => x.d.team === t);
  seats.forEach(({ d, k }) => {
    const p = S.people[d.code];
    if (p && p.team === t) return;
    const c = Object.values(S.people).filter(x => x.kind === "driver" && !x.team && x.id !== except && !DRIVERS.some(dd => dd.code === x.id)).sort((a, b) => sOvr(b) - sOvr(a))[0];
    if (c) { sSeat(k, c.id); sNews(L(`${TEAMS[t].full} ficha a ${sName(c)}.`, `${TEAMS[t].full} sign ${sName(c)}.`), "rival"); }
  });
}
function sRosterChanged() {                                     // the race engine and the portraits follow the new line-up
  LIVERY.fill(null); REFL.fill(null); for (const k in GREY) delete GREY[k];
  if (typeof GARV !== "undefined") GARV.fx = [];
  cars = DRIVERS.map(newCar); ui.forEach(u => u.rename());
  sApply(); ptRefresh();
}
// ---------- motivation ----------
function sMot(code, dv) { const p = S.people[code]; if (p) p.mot = r1(clampN((p.mot ?? 70) + dv, 5, 99)); }
const IV_FX = {                                                 // what the drivers, engineers and crew read in the interviews
  p03: { d: { k2: -6 }, s: { k1: 2, k2: 3 }, m: { k2: 1 } }, p04: { d: { k2: -7 }, s: { k2: 4 }, m: { k2: 1 } }, p13: { d: { eng: -3 }, s: { eng: 2 } },
  p22: { d: { k2: -6 }, s: { k2: 3 }, m: { k2: 1 } }, p07: { s: { crew: 2, eng: 2 } }, g07: { d: { k1: -2, k2: -2 }, s: { k1: 2, k2: 2 } },
  g10: { d: { k2: -5 }, s: { k2: 4 }, m: { k2: 2 } }, g12: { d: { crew: 4 }, s: { crew: 3 }, m: { crew: 1 } }, g14: { d: { k1: -2, k2: -2 }, s: { k1: 3, k2: 3 } },
  r01: { s: { k1: 3, crew: 3 }, m: { crew: 3, eng: 2 } }, r03: { d: { k1: -2, k2: -2 } }, r05: { d: { eng: -4, crew: -3 }, s: { k1: 2 } }, r06: { d: { eng: -3, crew: -3 }, s: { crew: 1 } },
  r08: { s: { eng: -3 }, d: { eng: 2 } }, r09: { d: { k1: -3, k2: -3 }, m: { k1: 1, k2: 1 }, s: { k1: 2, k2: 2 } }, r10: { d: { crew: -5 }, s: { crew: 5 }, m: { crew: 2 } },
  r11: { d: { k1: 4 }, s: { k1: 3 } }, r12: { d: { k1: -5, k2: -5 }, s: { crew: 1 } }, r14: { d: { k2: -6 }, s: { k2: 4 }, m: { k2: 2 } }, r18: { d: { k1: -4 }, s: { k1: 2 } }, r20: { s: { crew: 2 } }
};
function sIvEffect(qid, tone, ctx) {
  if (!S) return; const fx = (IV_FX[qid] || {})[tone]; if (!fx) return;
  const map = { k1: ctx.k1, k2: ctx.k2 };
  Object.entries(fx).forEach(([who, dv]) => {
    if (who === "crew") { const c = S.crew[S.team]; c.mot = r1(clampN(c.mot + dv, 5, 99)); }
    else if (who === "eng") sEngs(S.team).forEach(p => sMot(p.id, dv));
    else if (map[who]) sMot(map[who], dv);
  });
}
// ---------- pit crew ----------
function sCrewStop(c) {                                         // the player's crew: speed, consistency, fatigue and morale shape the stop
  const cr = S.crew[S.team], sd = sSD(S.team), q = (cr.spd - 80) * .012 + (cr.mot - 70) * .004 - cr.fat * .006 + ((sd ? sd.a.pit : 78) - 80) * .006, bad = .18 * (1 + (80 - cr.cons) / 40 + cr.fat / 120 - (cr.mot - 70) / 120);
  const r = Math.random();
  if (r < 1 - clampN(bad, .05, .4)) return Math.max(1.85, 2.0 + 1.9 * Math.pow(Math.random(), 1.8) - q);
  if (r < .97) return 4.0 + 1.5 * Math.random();
  return 5.5 + 2.5 * Math.random();
}
// ---------- the Grand Prix and the test in the season ----------
const GP0 = { round: GP_INFO.round, month: GP_INFO.month, days: GP_INFO.days.map(d => d.slice()) };
function sGpInfo(ev) {                                          // the dates of this round on the GP screens
  if (!ev) { Object.assign(GP_INFO, { round: GP0.round, month: GP0.month, days: GP0.days.map(d => d.slice()) }); return; }
  GP_INFO.round = ev.type === "gp" ? String(ev.round).padStart(2, "0") : "T";
  const fri = sDateObj(ev.day);
  GP_INFO.days = [0, 1, 2].map(i => { const d = new Date(fri.getTime() + i * 864e5); return [DOW[(ev.day + i) % 7][0], d.getUTCDate(), MON[d.getUTCMonth()][0]]; }); GP_INFO.month = GP_INFO.days[2][2];
}
function sGpPrep(ev) {                                          // the weekend about to start (one already under way carries on)
  sGpInfo(ev); sFitAuto(); sApply();
  if (S.gp === ev.id && WK && !WK.test) return;
  WK = null; S.gp = ev.id;
}
function sRaceDone() {                                          // the chequered flag: points, wear, morale, money
  const ev = S.cal.find(e => e.id === S.gp); if (!ev || ev.done) return;
  const R = resultsData(), res = R.map(r => [r.c.code, r.c.team, r.pos || 0, r.pts, r.c.slot + 1, r.g ? 1 : 0, r.c.dnfWhy || ""]);
  res.forEach(([code, t, pos, pts]) => { S.stand.d[code] = (S.stand.d[code] || 0) + pts; S.stand.t[t] = (S.stand.t[t] || 0) + pts; });
  TEAM_ORDER.forEach(t => { S.stand.t[t] = S.stand.t[t] || 0; });
  S.stand.rounds.push({ r: ev.round, res, d: S.day, fit: [0, 1].map(k => Object.fromEntries(PART_K.map(p => { const u = S.units.find(x => x.id === S.fit[k][p]); return [p, u ? u.n : 1]; }))) });
  ev.done = true; ev.res = { win: res.find(x => x[2] === 1)?.[0], mine: res.filter(x => x[1] === S.team).map(x => [x[0], x[2]]) };
  const crashed = [0, 1].map(k => { const c = cars[k]; return !!(c && (c.dnfWhy && /accidente|muro|grava/i.test(c.dnfWhy) || (c.aero && (c.aero.FWL < 1 || c.aero.FWR < 1)))); });
  sWear(crashed);
  [0, 1].forEach(k => PART_K.forEach(p => {                    // what ran on the car is now known for sure
    const u = S.units.find(x => x.id === S.fit[k][p]); if (!u) return; const sp = S.specs[p][u.n - 1];
    if (sp && !sp.known && u.n > 1) { sp.known = true; sp.st = "track"; sp.est = { ...sp.gain }; if (!S.upgRaced.some(x => x.p === p && x.n === u.n)) S.upgRaced.push({ p, n: u.n, r: ev.round }); }
  }));
  // morale after the result
  const mine = res.filter(x => x[1] === S.team), exp = S.board.target;
  sConfRace(mine);
  mine.forEach(([code, , pos]) => { const want = Math.max(1, exp * 2 - 1); sMot(code, pos ? clampN((want - pos) * 1.2, -8, 8) : -6); });
  if (mine.length === 2 && mine[0][2] && mine[1][2]) { const [a, b] = mine; sMot(a[0], a[2] < b[2] ? 2 : -2); sMot(b[0], b[2] < a[2] ? 2 : -2); }
  const cr = S.crew[S.team]; cr.fat = Math.min(100, cr.fat + 14);
  while (S.day < ev.day + 2) { S.day++; sDay(); }               // the weekend's days go by: Sunday night
  sSpend(2.4, "ops", L(`Gran Premio · ronda ${ev.round}`, `Grand Prix · round ${ev.round}`));
  S.pu && (S.pu.pen = [0, 0]);
  sMediaLog();
  const w = res.find(x => x[2] === 1);
  sNews(L(`Ronda ${ev.round}: gana ${w ? sName(S.people[w[0]]) : "—"}. Tus pilotos: ${mine.map(m => `${S.people[m[0]].last} ${m[2] ? "P" + m[2] : "abandono"}`).join(" · ")}.`,
    `Round ${ev.round}: ${w ? sName(S.people[w[0]]) : "—"} wins. Your drivers: ${mine.map(m => `${S.people[m[0]].last} ${m[2] ? "P" + m[2] : "DNF"}`).join(" · ")}.`), "race");
  S.atr.hours = Math.max(S.atr.used, sAtrHours() + (S.atr.q - 1) * 0);
  sApply(); saveGame(true);
}
function sTestStart() {                                         // the pre-season test: one hour on track, everybody
  sFitAuto(); sApply();
  sGpInfo(S.cal.find(e => e.id === "test")); WK = newWeekend(); WK.test = 1; WK.wx.TEST = { ...WK.wx.FP1 };
}
function sTestEnd() {                                           // what the test told us
  const ev = S.cal.find(e => e.id === "test"); if (!ev || ev.done) return;
  const rows = (WK && WK.res && WK.res.TEST) || [];
  S.tests = rows.map(r => [DRIVERS[r.idx].code, DRIVERS[r.idx].team, r.t, r.laps]);
  S.car.revealed = true; ev.done = true; S.pop = { k: "reveal" };
  sNews(L("Test de Barcelona: los datos de pista sustituyen a la predicción del túnel. Revisa el coche en I+D+i.", "Barcelona test: track data replace the tunnel prediction. Check the car in R&D."), "dev");
  WK = null; sApply(); saveGame();
}
// ---------- the board ----------
function sBoardAsk(pct) {                                       // ask for more money (pct > 0) or for softer targets (pct < 0)
  const B = S.board; if (B.asked) return null; B.asked = true;
  if (pct < 0) { B.B = Math.round(B.B * (1 + pct)); B.target = Math.min(11, B.target + 1); B.amb = -.15; B.obj = sObjectives(B.q, B.amb); sConf(-3); return true; }
  const p = clampN(.85 - pct * 2.6 + (B.conf - 60) / 200 + (mediaOf(S.team) - 60) / 300, .05, .95), ok = Math.random() < p;
  if (ok) { B.B = Math.round(B.B * (1 + pct)); B.target = Math.max(1, B.target - (pct >= .2 ? 2 : pct >= .1 ? 1 : 0)); B.amb = pct; B.obj = sObjectives(B.q, B.amb); }
  else sConf(-6);
  return ok;
}
const B_FIRE = 12, B_WARN = 30;
function sConf(dv, why) {                                       // the board's confidence moves with everything that happens; too low and you are sacked
  const B = S.board; if (!B || S.fired || !S.steps.board) return;
  const was = B.conf; B.conf = r1(clampN(B.conf + dv, 0, 100));
  (B.log = B.log || [[0, 60]]); const last = B.log[B.log.length - 1]; if (last && last[0] === S.day) last[1] = B.conf; else B.log.push([S.day, B.conf]);
  if (B.log.length > 400) B.log.splice(1, B.log.length - 400);
  if (why && Math.abs(dv) >= 2) sNews(L(`Junta: ${why} (${dv > 0 ? "+" : ""}${Math.round(dv)} de confianza).`, `Board: ${why} (${dv > 0 ? "+" : ""}${Math.round(dv)} confidence).`), "board");
  if (was > B_WARN && B.conf <= B_WARN) sNews(L("La junta pierde la paciencia. Si la confianza sigue cayendo, te despedirán.", "The board is losing patience. If confidence keeps falling, you will be sacked."), "board");
  if (B.conf <= B_FIRE) { S.fired = true; S.over = true; S.pop = { k: "fired" }; sNews(L("La junta te ha despedido.", "The board has sacked you."), "board"); }
}
function sConfWeek() {                                          // every Monday: money, spending pace and the team's image
  const B = S.board; if (!B || !S.steps.board || S.fired) return;
  let d = 0; const why = [];
  if (S.cash < 0) { const k = Math.min(3, .6 + -S.cash / 60); d -= k; why.push(L("números rojos", "in the red")); }
  const el = Math.max(14, S.day), pace = S.cap / el * 196 / S_CAP; if (pace > 1.05) { d -= Math.min(2, (pace - 1) * 6); why.push(L("gasto por encima del límite", "spending over the cap pace")); }
  d += (mediaOf(S.team) - 62) / 40;
  d += (55 - B.conf) * .02;                                       // a quiet week drifts back towards neutral
  sConf(clampN(d, -4, 2.5), d <= -2 ? why.join(L(" y ", " and ")) : null);
}
function sConfRace(mine) {                                       // after a race: the points against what the board expects
  const B = S.board, exp = PPR[clampN(B.target, 1, 11)] || 1, pts = mine.reduce((a, x) => a + x[3], 0), best = Math.min(...mine.map(x => x[2] || 99));
  let d = clampN((pts - exp) / Math.max(4, exp) * 7, -9, 8) + (best === 1 ? 3 : best <= 3 ? 1.5 : 0) - mine.filter(x => !x[2]).length * 1.5;
  sConf(d, d >= 0 ? L(`buen resultado (${pts} pts, se esperaban ${Math.round(exp)})`, `a good result (${pts} pts, ${Math.round(exp)} expected)`) : L(`resultado flojo (${pts} pts, se esperaban ${Math.round(exp)})`, `a poor result (${pts} pts, ${Math.round(exp)} expected)`));
}
function sFiredShow() {
  const B = S.board, T = TEAMS[S.team], log = B.log || [];
  sModal(`<div class="sm-h"><span>${L("Junta directiva", "Board of directors")} · ${sDate(S.day, true)}</span><b>${L("Estás despedido", "You are sacked")}</b></div>
    <p class="sm-p">${L(`La confianza de la junta de ${T.full} ha caído a ${Math.round(B.conf)}. Han decidido prescindir de ti como Team Principal con efecto inmediato.`, `The ${T.full} board's confidence has fallen to ${Math.round(B.conf)}. They have dismissed you as Team Principal with immediate effect.`)}</p>
    ${log.length > 1 ? card(L("Confianza de la junta", "Board confidence"), svgLine({ w: 720, h: 200, x: log.map(l => sDate(l[0])), series: [{ n: L("Confianza", "Confidence"), c: "#ef6b5b", w: 3, area: 1, v: log.map(l => l[1]) }], min: 0, max: 100, band: [{ v: B_FIRE, c: "#ef6b5b", n: L("despido", "sacking") }, { v: B_WARN, c: "#f2c94c", n: L("aviso", "warning") }] })) : ""}
    <div class="sm-g3">${kpi(L("Constructores", "Constructors'"), S.stand.rounds.length ? "P" + sConsPos(S.team) : "—", L(`objetivo P${B.target}`, `target P${B.target}`), "ko")}${kpi(L("Puntos", "Points"), S.stand.t[S.team] || 0)}${kpi(L("Caja", "Cash"), money(S.cash), "", S.cash < 0 ? "ko" : "")}</div>
    <div class="sm-f"><button class="sp-btn gh" data-sa="mclose">${L("Ver la sede por última vez", "One last look at the HQ")}</button><button class="sp-btn" data-sa="tomenu">${L("Menú principal", "Main menu")} ▶</button></div>`, true);
}
const sAskChance = pct => clampN(.85 - pct * 2.6 + (S.board.conf - 60) / 200 + (mediaOf(S.team) - 60) / 300, .05, .95);
function sBoardInitDone() {                                     // the opening meeting closes: first payment
  const B = S.board; S.steps.board = true;
  sSpend(-r1(B.B * .4), "brd", L("Junta: primera aportación", "Board: first payment"), false);
  S.cashH.push([S.day, S.cash]); B.asked = false; saveGame();
}
function sBoardReview() {                                       // a quarterly meeting: the verdict on the objectives
  const B = S.board, items = B.obj.items.map(o => ({ ...o, v: sObjValue(o), s: sObjScore(o) }));
  const score = items.reduce((a, o) => a + o.s, 0) / items.length, dConf = Math.round((score - .65) * 35);
  const pay = B.q < 4 ? r1(B.B * .2 * (.8 + .4 * score) + (mediaOf(S.team) - 50) * .05) : 0;
  return { q: B.q, items, score, dConf, pay, pos: sConsPos(S.team) };
}
function sBoardClose(rv) {
  const B = S.board; sConf(rv.dConf);
  B.hist.push({ q: rv.q, score: r2(rv.score), conf: B.conf, pay: rv.pay, items: rv.items.map(o => ({ k: o.k, t: o.t, v: o.v, s: r2(o.s) })) });
  if (rv.pay) sSpend(-rv.pay, "brd", L(`Junta: aportación del trimestre ${rv.q + 1}`, `Board: quarter ${rv.q + 1} payment`), false);
  S.cal.find(e => e.type === "board" && e.q === rv.q).done = true;
  if (B.q < 4) { B.q++; B.asked = false; B.amb = 0; B.obj = sObjectives(B.q, 0); S.atr.q = B.q; S.atr.used = 0; S.atr.hours = sAtrHours(); }
  else S.over = true;
  S.cashH.push([S.day, S.cash]); saveGame();
}
// ---------- autosave ----------
const SAVE_KEY = "rtm.save";
function saveGame(noWk) {                                       // after every session, race and season step
  try {
    if (!GAME.mode || !GAME.on) return;
    const d = { v: 2, mode: GAME.mode, t: Date.now(), team: DRIVERS[0].team, tp: TP, media: MEDIA, wk: !noWk && WK && !WK.test ? WK : null,
      season: S, drivers: DRIVERS.map(d => ({ code: d.code, name: d.name, num: d.num, team: d.team, cell: d.cell, col: d.col, box: d.box, o: d.o })) };
    localStorage.setItem(SAVE_KEY, JSON.stringify(d));
  } catch (e) { }
}
function readSave() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); return d && d.v === 2 ? d : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
function resetRoster() {                                        // back to the real 2026 grid
  DRIVERS.splice(0, DRIVERS.length, ...DRIVERS0.map(d => ({ ...d, ai: true, slot: 0 })));
  DRIVERS.forEach((d, k) => { d.o = k; });
  TEAM_ORDER.forEach(t => { TEAMS[t].skill = TEAMS0[t]; });
  PT.url = {};
}
const TEAMS0 = Object.fromEntries(Object.entries(TEAMS).map(([t, T]) => [t, T.skill]));
function loadGame() {
  const d = readSave(); if (!d) return false;
  GAME.mode = d.mode; S = d.season || null;
  if (S) { sPeopleMigrate(); S.hist = S.hist || []; }
  if (S) Object.values(S.people).forEach(p => { if (p.kind === "driver") { if (!NAT[p.id]) NAT[p.id] = p.nat; if (!FIRST[p.id]) FIRST[p.id] = p.first; } });
  DRIVERS.splice(0, DRIVERS.length, ...d.drivers.map(x => ({ ...x, skill: 0, ai: true, slot: 0 })));
  DRIVERS.forEach(x => { if (x.o == null) x.o = DRIVERS0.findIndex(y => y.cell === x.cell); });
  if (d.media) Object.assign(MEDIA, d.media);
  if (d.tp) Object.assign(TP, d.tp);
  setPlayerTeam(d.team);
  if (S) { sApply(); ptRefresh(); } else DRIVERS.forEach(x => { const o = DRIVERS0.find(y => y.code === x.code); if (o) x.skill = o.skill; });
  WK = d.wk || null; GAME.on = true;
  if (S) { const ev = S.gp && S.cal.find(e => e.id === S.gp && !e.done); sGpInfo(ev || null); if (!ev) S.gp = null; } else sGpInfo(null);
  FRONT.team = d.team;
  return true;
}

