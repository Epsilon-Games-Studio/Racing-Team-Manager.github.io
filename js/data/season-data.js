// =====================================================================================================
// ---------- SEASON MODE: data (people, car model, parts, calendar) ----------
// =====================================================================================================
// car characteristics, 0..100; the lap-time weights are those of Barcelona (the only circuit for now)
const ST = ["top", "hs", "ms", "ls", "brk", "trc", "cool", "tyr", "dirty", "rel"];
const ST_N = { top: ["Velocidad punta", "Top speed"], hs: ["Curva rápida", "High-speed corners"], ms: ["Curva media", "Medium-speed corners"], ls: ["Curva lenta", "Low-speed corners"],
  brk: ["Frenada", "Braking"], trc: ["Tracción", "Traction"], cool: ["Refrigeración", "Cooling"], tyr: ["Cuidado neumáticos", "Tyre care"], dirty: ["Aire sucio", "Dirty air"], rel: ["Fiabilidad", "Reliability"] };
const ST_S = { top: ["Punta", "Top"], hs: ["Rápida", "Fast"], ms: ["Media", "Medium"], ls: ["Lenta", "Slow"], brk: ["Frenada", "Brake"], trc: ["Tracción", "Traction"], cool: ["Refrig.", "Cooling"], tyr: ["Neumát.", "Tyres"], dirty: ["Aire sucio", "Dirty air"], rel: ["Fiabil.", "Reliab."] };
const TRACK_W = { top: .17, hs: .22, ms: .17, ls: .13, brk: .08, trc: .11, tyr: .07, dirty: .05 };       // Barcelona: long straight, fast T3/T9, slow final sector
const PERF_K = 0.03, PERF_C = 0.0165;                                                    // lap-time sensitivity of the car rating
const LAP_REF = 78;                                                                      // s, for "tenths per lap"
// the 2026 cars as the teams start them: level and character (+ power unit)
const S_LV = { mcl: 84, mer: 83, fer: 82, rbr: 81, amr: 79, wil: 76, rcb: 74, haa: 73, aud: 72, alp: 71, cad: 67 };
const S_PROF = { mcl: { hs: 3, ms: 2, tyr: 2, top: -2 }, mer: { top: 3, hs: 1, ls: -2 }, fer: { top: 2, trc: 2, tyr: -2 }, rbr: { top: 3, hs: 2, ls: -2, ms: -1 },
  amr: { hs: 2, ms: 2, top: -2, cool: -2 }, wil: { top: 4, ls: -3, ms: -2 }, rcb: { ms: 2, ls: 1 }, haa: { tyr: -3, brk: 2 }, aud: { cool: 2, top: -1 }, alp: { ls: 2, trc: 1 }, cad: { rel: -3, ms: -1 } };
const PU_POW = { "Merzedes": 88, "Farrari": 86, "Red Ball Forde": 84, "Hondo": 84, "Audy": 80 };
// development parts: what each one improves
const CPARTS = {
  fw: { n: ["Alerón delantero", "Front wing"], aero: 1, st: { hs: .35, ms: .35, dirty: .2, tyr: .1 }, cost: 1.2, unit: .18, days: 24, mfg: 3, wear: 14, stock: 4 },
  rw: { n: ["Alerón trasero", "Rear wing"], aero: 1, st: { top: .45, hs: .35, trc: .2 }, cost: 1.1, unit: .16, days: 22, mfg: 3, wear: 10, stock: 3 },
  fl: { n: ["Fondo plano", "Floor"], aero: 1, st: { hs: .4, ms: .3, ls: .1, dirty: .2 }, cost: 2.2, unit: .35, days: 32, mfg: 5, wear: 9, stock: 3 },
  sp: { n: ["Pontones", "Sidepods"], aero: 1, st: { cool: .45, top: .3, hs: .25 }, cost: 1.4, unit: .22, days: 28, mfg: 4, wear: 6, stock: 3 },
  ch: { n: ["Chasis", "Chassis"], aero: 0, st: { ls: .35, ms: .25, tyr: .2, rel: .2 }, cost: 3.0, unit: .9, days: 42, mfg: 8, wear: 3, stock: 2 },
  su: { n: ["Suspensión", "Suspension"], aero: 0, st: { ls: .4, trc: .3, tyr: .3 }, cost: 1.0, unit: .2, days: 21, mfg: 3, wear: 8, stock: 3 },
  br: { n: ["Frenos", "Brakes"], aero: 0, st: { brk: .6, cool: .2, ls: .2 }, cost: .7, unit: .12, days: 16, mfg: 2, wear: 18, stock: 4 },
  gb: { n: ["Caja de cambios", "Gearbox"], aero: 0, st: { trc: .5, rel: .35, top: .15 }, cost: 1.3, unit: .3, days: 30, mfg: 5, wear: 16, stock: 3 }
};
const PART_K = Object.keys(CPARTS);
const AMB = [{ n: ["Evolución", "Evolution"], g: 3, c: 1, d: 1, u: .25, h: 6, t: 3, mu: 1 }, { n: ["Paquete", "Package"], g: 6, c: 1.9, d: 1.35, u: .35, h: 10, t: 5, mu: 1.2 },
  { n: ["Concepto nuevo", "New concept"], g: 10, c: 3, d: 1.8, u: .5, h: 14, t: 7, mu: 1.4 }];
// power unit elements per car for the 8-race season (beyond the limit: grid penalty)
const PU_EL = { ice: [["Motor (ICE)", "Engine (ICE)"], 3, 26], tc: [["Turbo (TC)", "Turbo (TC)"], 3, 24], mgk: [["MGU-K", "MGU-K"], 3, 22], es: [["Batería (ES)", "Battery (ES)"], 2, 18], ce: [["Electrónica (CE)", "Control el. (CE)"], 2, 16] };
// the calendar: day 0 = Monday 5 January 2026. GP day = Friday of the weekend
const S_DAY0 = Date.UTC(2026, 0, 5);
const S_CAL = [
  { id: "test", type: "test", day: 28 },
  { id: "r1", type: "gp", round: 1, day: 53 }, { id: "r2", type: "gp", round: 2, day: 67 }, { id: "b1", type: "board", q: 1, day: 70 },
  { id: "r3", type: "gp", round: 3, day: 88 }, { id: "r4", type: "gp", round: 4, day: 102 }, { id: "b2", type: "board", q: 2, day: 105 },
  { id: "r5", type: "gp", round: 5, day: 144 }, { id: "r6", type: "gp", round: 6, day: 158 }, { id: "b3", type: "board", q: 3, day: 161 },
  { id: "r7", type: "gp", round: 7, day: 179 }, { id: "r8", type: "gp", round: 8, day: 193 }, { id: "b4", type: "board", q: 4, day: 196 }
];
// the 8 rounds of the test season and what each circuit asks of the car (1 = little, 5 = a lot).
// For now every round is raced on the Circuit de Barcelona-Catalunya; the requirements are there to plan the development.
const REQ_K = ["ls", "ms", "hs", "top", "brk", "trc", "cool", "tyr"];
const REQ_N = { ls: ["Curvas lentas", "Slow corners"], ms: ["Curvas medias", "Medium corners"], hs: ["Curvas rápidas", "Fast corners"], top: ["Velocidad punta", "Top speed"],
  brk: ["Frenada", "Braking"], trc: ["Tracción", "Traction"], cool: ["Refrigeración", "Cooling"], tyr: ["Desgaste de neumáticos", "Tyre wear"] };
const REQ_S = { ls: ["Lentas", "Slow"], ms: ["Medias", "Medium"], hs: ["Rápidas", "Fast"], top: ["Punta", "Top"], brk: ["Frenada", "Brake"], trc: ["Tracción", "Traction"], cool: ["Refrig.", "Cooling"], tyr: ["Neumát.", "Tyres"] };
const DF_N = [null, ["Carga baja", "Low downforce"], ["Carga media", "Medium downforce"], ["Carga media-alta", "Medium-high downforce"], ["Carga alta", "High downforce"], ["Carga máxima", "Maximum downforce"]];
const CIRCUITS = {
  aus: { code: "AUS", cc: "AU", gp: ["GP de Australia", "Australian GP"], name: "Albert Park", city: "Melbourne", km: 5.278, laps: 58, turns: 14, df: 3,
    req: { ls: 3, ms: 3, hs: 3, top: 3, brk: 3, trc: 3, cool: 2, tyr: 2 }, note: ["Semiurbano y rápido; asfalto que mejora durante el fin de semana.", "Fast semi-street track; the grip builds over the weekend."] },
  esp: { code: "ESP", cc: "ES", gp: ["GP de España", "Spanish GP"], name: "Barcelona-Catalunya", city: "Montmeló", km: 4.657, laps: 66, turns: 14, df: 4,
    req: { ls: 3, ms: 4, hs: 5, top: 3, brk: 2, trc: 3, cool: 3, tyr: 5 }, note: ["El banco de pruebas de todos: curvas rápidas largas y mucho castigo al neumático delantero izquierdo.", "Everyone's benchmark: long fast corners and a hard life for the front-left tyre."] },
  mon: { code: "MON", cc: "MC", gp: ["GP de Mónaco", "Monaco GP"], name: "Circuit de Monaco", city: "Montecarlo", km: 3.337, laps: 78, turns: 19, df: 5,
    req: { ls: 5, ms: 2, hs: 1, top: 1, brk: 4, trc: 5, cool: 3, tyr: 1 }, note: ["Calles estrechas: todo es tracción, giro en lento y carga máxima.", "Narrow streets: traction, slow-speed turn-in and maximum downforce."] },
  gbr: { code: "GBR", cc: "GB", gp: ["GP de Gran Bretaña", "British GP"], name: "Silverstone", city: "Silverstone", km: 5.891, laps: 52, turns: 18, df: 3,
    req: { ls: 1, ms: 3, hs: 5, top: 4, brk: 2, trc: 2, cool: 2, tyr: 5 }, note: ["Maggots, Becketts y Copse: el templo de la curva rápida.", "Maggots, Becketts and Copse: the temple of the fast corner."] },
  bel: { code: "BEL", cc: "BE", gp: ["GP de Bélgica", "Belgian GP"], name: "Spa-Francorchamps", city: "Stavelot", km: 7.004, laps: 44, turns: 19, df: 2,
    req: { ls: 2, ms: 3, hs: 5, top: 5, brk: 3, trc: 3, cool: 2, tyr: 3 }, note: ["Rectas larguísimas y Eau Rouge: poca resistencia sin perder apoyo en lo rápido.", "Very long straights and Eau Rouge: low drag without losing grip in the fast stuff."] },
  ita: { code: "ITA", cc: "IT", gp: ["GP de Italia", "Italian GP"], name: "Monza", city: "Monza", km: 5.793, laps: 53, turns: 11, df: 1,
    req: { ls: 2, ms: 2, hs: 3, top: 5, brk: 5, trc: 4, cool: 3, tyr: 2 }, note: ["El templo de la velocidad: alerones mínimos y frenadas fortísimas en las chicanes.", "The temple of speed: skinny wings and huge braking into the chicanes."] },
  usa: { code: "USA", cc: "US", gp: ["GP de Estados Unidos", "United States GP"], name: "Circuit of the Americas", city: "Austin", km: 5.513, laps: 56, turns: 20, df: 4,
    req: { ls: 4, ms: 4, hs: 4, top: 3, brk: 3, trc: 4, cool: 4, tyr: 4 }, note: ["Un poco de todo: eses rápidas, horquillas lentas, baches y calor.", "A bit of everything: fast esses, slow hairpins, bumps and heat."] },
  adh: { code: "ADH", cc: "AE", gp: ["GP de Abu Dabi", "Abu Dhabi GP"], name: "Yas Marina", city: "Abu Dabi", km: 5.281, laps: 58, turns: 16, df: 3,
    req: { ls: 4, ms: 3, hs: 2, top: 4, brk: 4, trc: 4, cool: 4, tyr: 2 }, note: ["Última ronda: tracción en las curvas lentas del final y calor en la refrigeración.", "The finale: traction out of the slow final corners and heat for the cooling."] }
};
const S_ROUNDS = ["aus", "esp", "mon", "gbr", "bel", "ita", "usa", "adh"];
const S_HOST = "Circuit de Barcelona-Catalunya";
const circOf = ev => ev && ev.type === "gp" ? CIRCUITS[S_ROUNDS[ev.round - 1]] : null;
const circKey = ev => ev && ev.type === "gp" ? S_ROUNDS[ev.round - 1] : null;
const S_WINDOWS = [[0, 52], [105, 143]];                 // driver and staff market: pre-season and the break after round 4
const S_CAP = 140;                                        // M$, cost cap prorated to this 8-race test season
const PPR = [0, 33, 28, 23, 18, 12, 8, 5, 3.5, 2.5, 1.5, .8];   // points per race (both cars) a team in each championship position scores
// people ---------------------------------------------------------------------------------------------
// drivers: [code, first, age, pace, race, ovt, def, tyr, wet, fb, exp, salary M$/year, contract end, series]
const S_DRV = [
  ["ALO", "Fernando", 44, 87, 92, 88, 92, 90, 92, 93, 99, 20, 2026], ["STR", "Lance", 27, 76, 78, 75, 77, 78, 80, 74, 80, 12, 2026],
  ["NOR", "Lando", 26, 92, 89, 88, 85, 88, 88, 85, 82, 35, 2027], ["PIA", "Oscar", 25, 91, 90, 87, 86, 90, 84, 84, 76, 30, 2028],
  ["VER", "Max", 28, 96, 96, 95, 93, 92, 97, 92, 90, 55, 2028], ["HAD", "Isack", 21, 84, 80, 82, 79, 80, 78, 78, 62, 3, 2027],
  ["RUS", "George", 28, 91, 88, 85, 86, 87, 88, 88, 82, 30, 2026], ["ANT", "Kimi", 19, 86, 82, 84, 78, 79, 80, 74, 58, 4, 2026],
  ["LEC", "Charles", 28, 93, 88, 86, 85, 84, 86, 85, 84, 34, 2029], ["HAM", "Lewis", 41, 89, 91, 90, 89, 93, 95, 90, 99, 55, 2026],
  ["ALB", "Alex", 30, 85, 86, 82, 86, 86, 83, 85, 82, 12, 2027], ["SAI", "Carlos", 31, 87, 89, 84, 87, 89, 85, 90, 86, 15, 2027],
  ["LAW", "Liam", 24, 80, 79, 82, 80, 76, 79, 74, 64, 2, 2026], ["LIN", "Arvid", 18, 79, 74, 78, 74, 73, 75, 70, 50, 1, 2027],
  ["OCO", "Esteban", 29, 82, 83, 79, 85, 82, 84, 80, 82, 9, 2026], ["BEA", "Oliver", 20, 83, 81, 83, 79, 80, 79, 76, 62, 3, 2027],
  ["GAS", "Pierre", 30, 85, 84, 83, 83, 83, 85, 84, 82, 12, 2028], ["COL", "Franco", 22, 79, 77, 80, 76, 75, 76, 72, 60, 2, 2026],
  ["HUL", "Nico", 38, 82, 84, 79, 86, 83, 82, 86, 92, 9, 2027], ["BOR", "Gabriel", 21, 79, 79, 78, 77, 79, 78, 76, 58, 2, 2027],
  ["PER", "Sergio", 36, 85, 88, 87, 88, 91, 82, 86, 95, 10, 2027], ["BOT", "Valteri", 36, 84, 85, 80, 84, 85, 83, 88, 95, 8, 2027],
  // free agents and reserves (no portrait of their own: generated face)
  ["TSU", "Yuki", 25, 83, 80, 82, 78, 78, 80, 76, 74, 6, 0, "Reserva"], ["MAG", "Kevin", 33, 79, 80, 80, 85, 78, 79, 80, 88, 4, 0, "Libre"],
  ["WEH", "Pascal", 32, 81, 82, 80, 80, 83, 80, 82, 78, 3, 0, "Fórmula E"], ["ZHO", "Guanyu", 26, 78, 79, 76, 77, 82, 77, 79, 72, 3, 0, "Reserva"],
  ["KVY", "Daniil", 32, 78, 79, 78, 77, 77, 80, 78, 80, 2, 0, "Libre"], ["GIO", "Antonio", 32, 77, 78, 76, 77, 79, 77, 78, 74, 2, 0, "Fórmula E"],
  // juniors (invented): [code, first, age, ..., series, surname, nat, potential]
  ["MOR", "Lucas", 20, 80, 77, 79, 75, 76, 77, 74, 52, .6, 0, "F2", "MOREAU", "FR", 90], ["AND", "Kai", 21, 79, 78, 77, 77, 79, 75, 76, 55, .5, 0, "F2", "ANDERSEN", "DK", 86],
  ["CST", "Rafael", 19, 79, 75, 80, 74, 74, 76, 72, 48, .5, 0, "F2", "COSTA", "BR", 89], ["VLK", "Tomasz", 22, 78, 78, 76, 78, 80, 74, 77, 57, .5, 0, "F2", "WOLSKI", "PL", 84],
  ["RUZ", "Mateo", 18, 77, 72, 76, 71, 72, 73, 70, 40, .3, 0, "F3", "RUIZ", "ES", 92], ["FIS", "Leon", 17, 75, 70, 75, 70, 71, 72, 68, 36, .2, 0, "F3", "FISCHER", "DE", 91],
  ["LND", "Hugo", 18, 75, 72, 73, 72, 74, 76, 70, 41, .2, 0, "F3", "LINDQVIST", "SE", 88], ["HRT", "Oliver", 29, 80, 82, 79, 80, 82, 81, 80, 76, 2, 0, "Fórmula E", "HART", "GB", 82],
  ["BRA", "Nico", 27, 79, 80, 78, 79, 80, 79, 79, 70, 1.5, 0, "Fórmula E", "BRANDT", "DE", 83], ["SAT", "Ren", 24, 79, 78, 77, 78, 80, 82, 77, 64, 1, 0, "Super Fórmula", "SATO", "JP", 85],
  ["RED", "Colton", 25, 78, 80, 81, 78, 77, 76, 76, 66, 1.5, 0, "IndyCar", "REED", "US", 84], ["VNR", "Thijs", 23, 80, 78, 79, 77, 78, 77, 79, 60, 1, 0, "Reserva", "VAN RIJN", "NL", 86],
  ["CHD", "Jamie", 28, 78, 79, 77, 78, 79, 80, 80, 72, 1, 0, "IndyCar", "CHADWIK", "GB", 80], ["GRZ", "Marta", 26, 77, 76, 77, 75, 77, 75, 74, 62, .4, 0, "F1 Academy", "GARZÍA", "ES", 82],
  ["PUL", "Abbi", 22, 78, 76, 78, 75, 76, 76, 74, 58, .4, 0, "F1 Academy", "PULIN", "GB", 86], ["PIN", "Doriane", 22, 77, 76, 76, 76, 77, 74, 75, 56, .4, 0, "F1 Academy", "PINN", "FR", 85]
];
const S_SURN = { TSU: "TSUNODA", MAG: "MAGNUSSEN", WEH: "WEHRLEIN", ZHO: "ZHOU", KVY: "KVYAT", GIO: "GIOVINAZZI" };
const S_NUM = { TSU: 22, MAG: 20, WEH: 94, ZHO: 24, KVY: 26, GIO: 99, MOR: 7, AND: 8, CST: 9, VLK: 15, RUZ: 17, FIS: 19, LND: 21, HRT: 25, BRA: 28, SAT: 29, RED: 32, VNR: 34, CHD: 55, GRZ: 18, PUL: 62, PIN: 64 };
// looks for the generated faces: [skin, hair, hairCol, beard, glasses]
const S_LOOK = { TSU: [1, "messy", 0, "none", "none"], MAG: [0, "buzz", 4, "stubble", "none"], WEH: [1, "classic", 2, "none", "none"], ZHO: [1, "classic", 0, "none", "none"],
  KVY: [1, "classic", 2, "stubble", "none"], GIO: [2, "curly", 0, "short", "none"], MOR: [1, "messy", 2, "none", "none"], AND: [0, "classic", 4, "none", "none"],
  CST: [3, "curly", 0, "none", "none"], VLK: [0, "buzz", 3, "stubble", "none"], RUZ: [2, "spiky", 1, "none", "none"], FIS: [0, "classic", 5, "none", "none"],
  LND: [0, "messy", 4, "none", "none"], HRT: [1, "classic", 3, "short", "none"], BRA: [1, "buzz", 2, "short", "none"], SAT: [1, "spiky", 0, "none", "none"],
  RED: [1, "classic", 6, "stubble", "none"], VNR: [0, "wavy", 3, "none", "none"],
  CHD: [0, "bun", 3, "none", "none", { f: 1, e: 3 }], GRZ: [1, "long", 0, "none", "none", { f: 1 }], PUL: [0, "long", 4, "none", "none", { f: 1, e: 2 }], PIN: [0, "bun", 0, "none", "none", { f: 1 }] };
// staff: [id, role, name, nat, age, a1, a2, a3, a4, a5, salary, contract, team, look [skin,hair,hairCol,beard,glasses]]
// td: diseño, aerodinámica, innovación, gestión, liderazgo · aero: aerodinámica, correlación, innovación · eng: reglaje, estrategia, comunicación
const S_STAFF = [
  ["tdmcl", "td", "Rob Marshal", "GB", 60, 88, 86, 82, 85, 84, 6, 2027, "mcl", [0, "receding", 7, "short", "glasses"]],
  ["tdmer", "td", "James Alison", "GB", 58, 90, 87, 85, 88, 88, 7, 2027, "mer", [0, "receding", 7, "none", "none"]],
  ["tdrbr", "td", "Pierre Wachet", "FR", 51, 89, 85, 84, 84, 82, 6, 2027, "rbr", [1, "buzz", 1, "short", "glasses"]],
  ["tdfer", "td", "Loïc Serrat", "FR", 52, 86, 84, 83, 82, 80, 5, 2027, "fer", [1, "receding", 1, "stubble", "none"]],
  ["tdamr", "td", "Adrian Nuwey", "GB", 67, 97, 98, 97, 78, 86, 18, 2028, "amr", [1, "rim", 8, "none", "none", { e: 3, x: ["old", "ears", "lean"] }]],
  ["tdwil", "td", "Pat Fri", "GB", 62, 85, 82, 80, 86, 85, 4, 2027, "wil", [0, "bald", 7, "none", "glasses"]],
  ["tdrcb", "td", "Tim Gos", "GB", 62, 82, 80, 78, 81, 79, 3, 2026, "rcb", [0, "classic", 7, "none", "glasses"]],
  ["tdhaa", "td", "Andrea De Sorzi", "IT", 50, 78, 77, 76, 79, 78, 2.5, 2026, "haa", [1, "classic", 0, "short", "none"]],
  ["tdaud", "td", "James Kee", "GB", 54, 83, 81, 82, 78, 77, 4, 2027, "aud", [0, "classic", 7, "stubble", "none"]],
  ["tdalp", "td", "Marc Delorme", "FR", 49, 79, 78, 77, 80, 78, 2.5, 2026, "alp", [1, "messy", 2, "stubble", "none"]],
  ["tdcad", "td", "Nick Chesterr", "GB", 56, 80, 78, 77, 81, 80, 3, 2027, "cad", [0, "buzz", 2, "none", "none"]],
  ["tdfa1", "td", "Ross Braun", "GB", 71, 92, 85, 90, 97, 96, 9, 0, null, [0, "sides", 8, "none", "glasses", { x: ["old"] }]],
  ["tdfa2", "td", "Elena Varga", "AT", 46, 84, 86, 88, 80, 82, 3.5, 0, null, [0, "bun", 3, "none", "glasses", { f: 1 }]],
  ["tdfa3", "td", "Marco Bellini", "IT", 55, 81, 80, 79, 84, 81, 2.5, 0, null, [1, "classic", 7, "short", "none"]],
  ["tdfa4", "td", "Kenji Morita", "JP", 49, 80, 82, 81, 79, 78, 2.5, 0, null, [1, "classic", 0, "none", "glasses"]],
  ["tdfa5", "td", "Simon Kearney", "IE", 44, 78, 80, 83, 76, 77, 2, 0, null, [0, "messy", 6, "stubble", "none"]],
  ["aemcl", "aero", "Peter Prodromo", "GB", 60, 90, 86, 84, 0, 0, 2.5, 2027, "mcl", [0, "bald", 7, "none", "glasses"]],
  ["aemer", "aero", "Jarrod Murfy", "GB", 47, 86, 84, 82, 0, 0, 2, 2027, "mer", [0, "classic", 2, "none", "none"]],
  ["aerbr", "aero", "Enrico Baldo", "IT", 52, 87, 85, 81, 0, 0, 2, 2027, "rbr", [1, "buzz", 7, "stubble", "none"]],
  ["aefer", "aero", "Diego Tondi", "IT", 50, 85, 82, 80, 0, 0, 1.8, 2026, "fer", [1, "classic", 0, "short", "none"]],
  ["aeamr", "aero", "Eric Blandin", "FR", 54, 86, 87, 83, 0, 0, 2, 2027, "amr", [0, "buzz", 7, "none", "glasses"]],
  ["aewil", "aero", "Ben Watts", "GB", 41, 81, 80, 82, 0, 0, 1.2, 2026, "wil", [0, "messy", 3, "stubble", "none"]],
  ["aercb", "aero", "Guido Pezzi", "IT", 45, 79, 81, 77, 0, 0, 1, 2026, "rcb", [1, "classic", 1, "none", "none"]],
  ["aehaa", "aero", "Ayumi Ono", "JP", 39, 78, 79, 80, 0, 0, .9, 2026, "haa", [1, "bob", 0, "none", "glasses", { f: 1 }]],
  ["aeaud", "aero", "Lars Becker", "DE", 48, 80, 82, 78, 0, 0, 1.2, 2027, "aud", [0, "buzz", 4, "none", "none"]],
  ["aealp", "aero", "Julien Roux", "FR", 43, 78, 77, 79, 0, 0, .9, 2026, "alp", [0, "classic", 2, "short", "none"]],
  ["aecad", "aero", "Ryan Cole", "US", 46, 77, 78, 76, 0, 0, 1, 2027, "cad", [0, "classic", 3, "stubble", "none"]],
  ["aefa1", "aero", "Sofia Lindgren", "SE", 38, 84, 83, 86, 0, 0, 1.5, 0, null, [0, "long", 4, "none", "none", { f: 1, e: 3 }]],
  ["aefa2", "aero", "Paolo Ricci", "IT", 57, 83, 85, 78, 0, 0, 1.4, 0, null, [1, "bald", 7, "short", "glasses"]],
  ["aefa3", "aero", "Tom Hadley", "GB", 35, 79, 78, 84, 0, 0, .8, 0, null, [0, "spiky", 2, "none", "none"]],
  ["enrbr", "eng", "Gianpiero Lambiaze", "IT", 45, 90, 86, 88, 0, 0, 1.2, 2028, "rbr", [2, "buzz", 0, "short", "none"]],
  ["enmer", "eng", "Pete Bonington", "GB", 46, 88, 85, 90, 0, 0, 1.1, 2027, "mer", [0, "quiff", 1, "stubble", "glasses", { x: ["smile"] }]],
  ["enfer", "eng", "Riccardo Adamo", "IT", 50, 84, 80, 82, 0, 0, .9, 2026, "fer", [1, "receding", 7, "stubble", "glasses"]],
  ["enrbr2", "eng", "Hannah Schmits", "GB", 36, 86, 96, 88, 0, 0, 1.3, 2028, "rbr", [0, "long", 3, "none", "none", { f: 1, e: 3 }]],
  ["enhaa", "eng", "Laura Müler", "DE", 34, 84, 82, 87, 0, 0, .6, 2027, "haa", [0, "bun", 2, "none", "none", { f: 1 }]],
  ["enfa5", "eng", "Ruth Buscome", "GB", 39, 81, 93, 88, 0, 0, .7, 0, null, [0, "long", 4, "none", "none", { f: 1, e: 3 }]],
  ["enfa1", "eng", "Hannah Price", "GB", 34, 82, 84, 86, 0, 0, .5, 0, null, [0, "long", 6, "none", "none", { f: 1, e: 2 }]],
  ["enfa2", "eng", "Jonas Weber", "DE", 39, 85, 79, 80, 0, 0, .6, 0, null, [0, "buzz", 4, "stubble", "glasses"]],
  ["enfa3", "eng", "Álvaro Medina", "ES", 37, 81, 85, 83, 0, 0, .5, 0, null, [2, "classic", 0, "short", "none"]],
  ["enfa4", "eng", "Chloé Martin", "FR", 31, 79, 82, 85, 0, 0, .4, 0, null, [0, "bob", 1, "none", "glasses", { f: 1 }]],
  // sporting directors: pit stops, race operations, the people in the garage
  ["sdmcl", "sd", "Andrea Stela", "IT", 54, 88, 92, 91, 0, 0, 3, 2028, "mcl", [1, "bald", 0, "stubble", "glasses"]],
  ["sdmer", "sd", "Ron Medows", "GB", 60, 86, 88, 84, 0, 0, 1.5, 2027, "mer", [0, "sides", 7, "none", "none"]],
  ["sdrbr", "sd", "Gary Holt", "GB", 52, 88, 85, 82, 0, 0, 1.4, 2027, "rbr", [0, "buzz", 2, "stubble", "none"]],
  ["sdfer", "sd", "Diego Ioverni", "IT", 50, 85, 86, 84, 0, 0, 1.3, 2027, "fer", [1, "classic", 0, "short", "none"]],
  ["sdamr", "sd", "Andy Stevenon", "GB", 60, 84, 84, 82, 0, 0, 1.1, 2026, "amr", [0, "receding", 7, "none", "glasses"]],
  ["sdwil", "sd", "Sven Smits", "BE", 55, 83, 85, 83, 0, 0, 1, 2027, "wil", [0, "buzz", 4, "none", "none"]],
  ["sdrcb", "sd", "Alan Permain", "GB", 59, 82, 86, 80, 0, 0, 1, 2026, "rcb", [0, "sides", 7, "stubble", "none"]],
  ["sdhaa", "sd", "Mark Lowe", "GB", 47, 80, 80, 81, 0, 0, .8, 2026, "haa", [0, "classic", 3, "none", "none"]],
  ["sdaud", "sd", "Jonathan Wheatly", "GB", 58, 92, 87, 86, 0, 0, 1.6, 2028, "aud", [0, "sides", 7, "stubble", "none"]],
  ["sdalp", "sd", "Davide Brivo", "IT", 61, 80, 84, 88, 0, 0, 1.1, 2026, "alp", [1, "receding", 1, "none", "none"]],
  ["sdcad", "sd", "Ken Harper", "US", 50, 78, 80, 80, 0, 0, .8, 2027, "cad", [0, "buzz", 3, "short", "none"]],
  ["sdfa1", "sd", "Chris Hornner", "GB", 52, 90, 91, 92, 0, 0, 9, 0, null, [0, "classic", 2, "none", "none"]],
  ["sdfa3", "sd", "Monisha Kaltenbor", "AT", 55, 84, 88, 91, 0, 0, 1.4, 0, null, [2, "bob", 0, "none", "none", { f: 1 }]],
  ["sdfa2", "sd", "Marta Ruiz", "ES", 41, 83, 82, 86, 0, 0, .9, 0, null, [1, "long", 0, "none", "none", { f: 1 }]]
];
const S_ROLE = { td: ["Director técnico", "Technical director"], aero: ["Jefe de aerodinámica", "Head of aerodynamics"], eng: ["Ingeniero de carrera", "Race engineer"], driver: ["Piloto", "Driver"], crew: ["Jefe de mecánicos", "Chief mechanic"], sd: ["Director deportivo", "Sporting director"] };
const S_ATTR = { td: [["des", "Diseño", "Design"], ["aer", "Aerodinámica", "Aerodynamics"], ["inn", "Innovación", "Innovation"], ["mgt", "Gestión de proyectos", "Project management"], ["lead", "Liderazgo", "Leadership"]],
  aero: [["aer", "Aerodinámica", "Aerodynamics"], ["cor", "Correlación túnel", "Tunnel correlation"], ["inn", "Innovación", "Innovation"]],
  eng: [["set", "Reglaje", "Set-up"], ["str", "Estrategia", "Strategy"], ["com", "Comunicación", "Communication"]],
  driver: [["pace", "Ritmo", "Pace"], ["race", "Carrera", "Racecraft"], ["ovt", "Adelantamiento", "Overtaking"], ["def", "Defensa", "Defending"], ["tyr", "Neumáticos", "Tyre management"],
    ["wet", "Lluvia", "Wet"], ["fb", "Feedback técnico", "Technical feedback"], ["exp", "Experiencia", "Experience"]],
  crew: [["spd", "Velocidad", "Speed"], ["cons", "Consistencia", "Consistency"], ["fit", "Forma física", "Fitness"]],
  sd: [["pit", "Paradas en boxes", "Pit stops"], ["ops", "Operaciones de carrera", "Race operations"], ["lead", "Gestión del equipo", "Team management"]] };
// chief mechanic and pit crew per team: [name, nat, speed, consistency, fitness]
const S_CREW = { mcl: ["Jonathan Hale", "GB", 90, 88, 84], mer: ["Matt Deen", "GB", 84, 86, 83], rbr: ["Lee Stevens", "GB", 92, 85, 85], fer: ["Davide Iorio", "IT", 89, 82, 84],
  amr: ["Andy Steward", "GB", 82, 83, 80], wil: ["Rob Carter", "GB", 85, 82, 81], rcb: ["Marco Ferri", "IT", 83, 80, 80], haa: ["Kazuo Mori", "JP", 80, 81, 79],
  aud: ["Jan Krüger", "DE", 79, 80, 80], alp: ["Thierry Morel", "FR", 81, 79, 78], cad: ["Mike Lewis", "US", 77, 78, 80] };

