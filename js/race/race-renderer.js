// ---------- images ----------
const mapImg = window.LOADER ? LOADER.map : Object.assign(new Image(), { src: "assets/img/circuito.png" });   // circuit image (preloaded by the loading screen)
const carSheet = new Image(); carSheet.src = "assets/img/cars.png"; window.LOADER?.track("cars", carSheet);
const scImg = new Image(); scImg.src = "assets/img/sc.png"; window.LOADER?.track("sc", scImg);
const carSprites = DRIVERS.map(() => null), carShadows = DRIVERS.map(() => null);
let scShadow = null;
scImg.onload = () => { scShadow = makeShadow(scImg); };
function readGround() {          // the colour of the ground under every map pixel (gravel / grass / asphalt)
  try { const c = document.createElement("canvas"); c.width = MAP_W; c.height = MAP_H; const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(mapImg, 0, 0, MAP_W, MAP_H); groundData = g.getImageData(0, 0, MAP_W, MAP_H).data; } catch (e) { groundData = null; }
}
if (window.LOADER) LOADER.whenMap(readGround); else if (mapImg.complete && mapImg.naturalWidth) readGround(); else mapImg.addEventListener("load", readGround);
carSheet.onload = () => {
  DRIVERS.forEach((d, k) => {
    const c = document.createElement("canvas"); c.width = CELL_W; c.height = CELL_H;
    c.getContext("2d").drawImage(carSheet, (d.cell % 5) * CELL_W, Math.floor(d.cell / 5) * CELL_H, CELL_W, CELL_H, 0, 0, CELL_W, CELL_H);
    carSprites[k] = c; carShadows[k] = makeShadow(c); splitWheels(k);
  });
};

// ---------- view ----------
const cv = $("view"), ctx = cv.getContext("2d");
let DPR = 1, VW = 0, VH = 0;
function resize() { DPR = Math.min(window.devicePixelRatio || 1, OPT.quality === "lo" ? 1 : 2); VW = cv.clientWidth; VH = cv.clientHeight; cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR); }
addEventListener("resize", resize); resize();
const cam = { x: RL.x[0], y: RL.y[0], zoom: 1.5, rot: 0 };
let follow = true, autoRot = false, focus = 0, showLines = true, showLimits = false;
const MAX_ZOOM = 1.7;            // closest normal view: kept low so the circuit image is not blown up too much
function halfExt(z) { const c = Math.abs(Math.cos(cam.rot)), s = Math.abs(Math.sin(cam.rot)); return [(VW / 2 * c + VH / 2 * s) / z, (VW / 2 * s + VH / 2 * c) / z]; }
function minZoom() { const [a, b] = halfExt(1); return Math.max(a / (MAP_W / 2), b / (MAP_H / 2)); }
const clampZoom = z => Math.max(minZoom(), Math.min(Math.max(MAX_ZOOM, minZoom(), PITCAM.z0 != null || PITCAM.k > 0.02 ? PIT_ZOOM : 0), z));
function clampCam() {            // never show anything outside the image
  cam.zoom = clampZoom(cam.zoom);
  const [hx, hy] = halfExt(cam.zoom);
  cam.x = Math.max(hx, Math.min(MAP_W - hx, cam.x)); cam.y = Math.max(hy, Math.min(MAP_H - hy, cam.y));
}
function screenToMap(sx, sy) {
  const dx = (sx - VW / 2) / cam.zoom, dy = (sy - VH / 2) / cam.zoom, c = Math.cos(cam.rot), s = Math.sin(cam.rot);
  return { x: cam.x + dx * c - dy * s, y: cam.y + dx * s + dy * c };
}

// ---------- loop ----------
// sim time runs at 2x wall time on "×1" so the cars look as fast as they feel on TV; lap times stay real
const TIME_BASE = 2;
const SPEEDS = [1, 2, 8, 12];
let speedIdx = 0, paused = false, prevT = performance.now();
const fmt = t => { if (t == null) return "–:––.–––"; const m = Math.floor(t / 60); return `${m}:${(t - m * 60).toFixed(3).padStart(6, "0")}`; };
const fmtH = t => { const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = (t % 60).toFixed(1); return `${h}:${String(m).padStart(2, "0")}:${s.padStart(4, "0")}`; };
const gearFor = kmh => kmh < 1 ? "N" : kmh < 95 ? 2 : kmh < 135 ? 3 : kmh < 170 ? 4 : kmh < 205 ? 5 : kmh < 240 ? 6 : kmh < 280 ? 7 : 8;

function carPos(c) {
  if (c.gar) return garPose(c);
  if (c.pit) return pitPos(c);
  return racePos(c);
}
function racePos(c, lat = c.lat) {         // lateral offset is measured square to the track, not to the car's nose
  const p = sample(c.s), off = lat / M_PER_PX, head = heading(c.s);
  return { ...p, x: p.x - Math.sin(head) * off, y: p.y + Math.cos(head) * off };
}
function frame(now) {
  try { tick(now); } catch (e) { console.error(e); }   // a bad frame must never stop the game loop
  requestAnimationFrame(frame);
}
function tick(now) {
  const dt = Math.min(0.1, (now - prevT) / 1000); prevT = now;
  if (!paused && !replay) stepStart(dt);
  WXC = weather(simClock); SUNK = 1 - 0.8 * WXC.cloud / 100;
  { const [hx, hy] = halfExt(cam.zoom); VIEWB = { x0: cam.x - hx - 60, x1: cam.x + hx + 60, y0: cam.y - hy - 60, y1: cam.y + hy + 60 }; }
  rainFxStep(paused ? 0 : (replay ? dt * 0.45 : dt));
  ambStep(paused || MENU.step ? 0 : dt);                // people and traffic around the circuit live in real time
  try { radioStep(); } catch (e) { console.error(e); }
  if (replay) { playReplay(dt); if (PW.open) pwFrame(dt); return; }
  if (!WXH.length || simClock - WXH[WXH.length - 1][0] >= 20) { WXH.push([simClock, WXC.track]); if (WXH.length > 240) WXH.shift(); }
  let simDt = 0;
  if (!paused && !MENU.step) {
    const mult = SES ? SES_SPD[SES.spd] : SPEEDS[speedIdx], hs = SES ? (mult >= 16 ? 1 / 30 : mult >= 4 ? 1 / 60 : 1 / 120) : (speedIdx >= 2 ? 1 / 60 : 1 / 120), tb = performance.now();
    let rem = dt * mult * TIME_BASE * (1 - 0.5 * PITCAM.k);   // the followed car's pit stop is shown in real time
    while (rem > 1e-9) {
      if (SES && mult >= 16 && performance.now() - tb > 20) break;   // as fast as the device allows
      const h = Math.min(rem, hs); if (SES) sesStep(h); stepSC(h); stepWater(h); cars.forEach(c => { if (c.ai) aiThink(c, h); stepCar(c, h); stepHead(c, h); stepBody(c, h); tyreMarks(c); dryLineStep(c); rubberStep(c); coolStep(c, h); if (!c.done) sprayStep(c, h); }); checkContact(h); rem -= h; simDt += h;
      simClock += h; recAcc += h; if (recAcc >= 1 / 60) { recAcc = 0; record(); }
      if (pendingReplay && simClock >= pendingReplay.until) { startReplay(); break; }
    }
  }
  wetUpdate(simDt); wxNotes(); crewStep(simDt); cloudStep(simDt);
  marshalStep(dt); heliStep(dt, paused || MENU.step ? 0 : simDt); celebStep(dt);
  if (FIN_N > 0) {                                   // safety net: once the winner is home, nobody may hold up the end of the race
    if (FIN_T < 0) FIN_T = simClock;
    if (simClock - FIN_T > LAP_T0 * 2.2 && cars.some(c => !c.done)) { cars.forEach(c => { if (!c.done) { c.fin = true; c.finLaps = Math.max(0, c.lap - 1); c.finPos = ++FIN_N; c.done = true; c.pit = null; } }); checkEnd(); }
  }
  const fc = cars[focus], fp = carPos(fc);
  if (follow) {
    const k = Math.min(1, dt * 8);
    cam.x += (fp.x - cam.x) * k; cam.y += (fp.y - cam.y) * k;
    if (autoRot) { const t = fc.head + Math.PI / 2; cam.rot += Math.atan2(Math.sin(t - cam.rot), Math.cos(t - cam.rot)) * Math.min(1, dt * 4); }
  }
  pitCamStep(dt);
  finCamStep(dt);
  clampCam();
  if (!MENU.step && !FRONT.v && (!PW.open || (PW.bg = (PW.bg || 0) + 1) % 3 === 0)) draw();
  if (MENU.step === "weekend") gpBgFrame(dt);
  updateHud(fp);
  if (PW.open) pwFrame(dt);
}
// ---------- replays ----------
function record() {
  const sp = scPos();
  REC.push({ t: simClock, sc: [sp.x, sp.y, SC.head, SC.lights ? 1 : 0], c: cars.map(c => { const p = carPos(c); return [p.x, p.y, dispHead(c), c.inc && c.inc.crashed ? 1 : 0, c.gone ? 1 : 0]; }) });
  while (REC.length && simClock - REC[0].t > 16) REC.shift();
}
function startReplay() {
  const P = pendingReplay; pendingReplay = null;
  const frames = REC.filter(f => f.t >= P.tInc - 3);
  if (frames.length < 10) return;
  replay = { frames, k: 0, t: frames[0].t, end: frames[frames.length - 1].t, idx: P.idx, cam0: { zoom: cam.zoom, rot: cam.rot } };
  $("repTxt").textContent = P.label; $("replay").hidden = false; $("repFrame").hidden = false; $("toast").hidden = true;
  const f0 = frames[0].c[P.idx]; cam.x = f0[0]; cam.y = f0[1]; cam.zoom = MAX_ZOOM;
}
function endReplay() {
  if (!replay) return;
  cam.zoom = replay.cam0.zoom; replay = null; prevT = performance.now();
  $("replay").hidden = true; $("repFrame").hidden = true;
}
$("repSkip").onclick = endReplay;
function replayPose(k) {                       // interpolated pose of car k at replay.t
  const F = replay.frames; while (replay.k < F.length - 2 && F[replay.k + 1].t <= replay.t) replay.k++;
  // Catmull-Rom through four recorded frames: smooth position and rotation, no kinks between samples
  const i1 = replay.k, i0 = Math.max(0, i1 - 1), i2 = Math.min(F.length - 1, i1 + 1), i3 = Math.min(F.length - 1, i1 + 2);
  const a = F[i1], b = F[i2], u = b.t > a.t ? Math.min(1, Math.max(0, (replay.t - a.t) / (b.t - a.t))) : 0;
  const P0 = F[i0].c[k], P1 = a.c[k], P2 = b.c[k], P3 = F[i3].c[k];
  const unwrap = (ref, x) => ref + Math.atan2(Math.sin(x - ref), Math.cos(x - ref));
  const h1 = P1[2], h0 = unwrap(h1, P0[2]), h2 = unwrap(h1, P2[2]), h3 = unwrap(h2, P3[2]);
  const cr = (p0, p1, p2, p3) => { const u2 = u * u, u3 = u2 * u; return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3); };
  return { x: cr(P0[0], P1[0], P2[0], P3[0]), y: cr(P0[1], P1[1], P2[1], P3[1]), h: cr(h0, h1, h2, h3), crashed: P2[3], gone: P1[4] };
}
function playReplay(dt) {
  replay.t += dt * 0.45;                        // slow motion
  if (replay.t >= replay.end) { endReplay(); return; }
  const poses = cars.map((c, k) => replayPose(k)), me = poses[replay.idx];
  const k = Math.min(1, dt * 6); cam.x += (me.x - cam.x) * k; cam.y += (me.y - cam.y) * k;
  clampCam();
  draw(poses);
}

// ---------- grandstand crowd ----------
// Every seat of every grandstand is taken. The seats run along the rows of each stand (lines parallel to its
// track-facing edge), so every fan looks at the track. A fan has a skin tone, hair or a cap, shirt and trousers, a
// temperament and sometimes a flag. The seated crowd is baked once into small tiles (4 px per map px); the fans who
// cheer, jump up in a Mexican wave, turn to follow the cars or wave a flag are drawn live on top of them.
const FAN_W = 1.08, FAN_PITCH = 1.3;                         // seat width and row pitch (map px): same exaggerated scale as the cars
const FAN_SKIN = ["#f4d6c1", "#e9bf9f", "#d9a67f", "#c28b5f", "#a06c44", "#7c5032", "#573720"];
const FAN_SKIN_W = [13, 20, 22, 17, 12, 9, 7];
const FAN_HAIR = ["#15100c", "#2b1c12", "#46301f", "#6b4a2c", "#a8854f", "#d8be86", "#8d8d8d", "#7d3518"];
const FAN_HAIR_W = [24, 30, 17, 9, 8, 4, 6, 2];
// shirts: lots of Alonso green and Sainz blue at home, the big teams, Spain red and yellow, everyday colours
const FAN_SHIRT = ["#0d7a63", "#005a4a", "#cedc00", "#e1061c", "#ff8000", "#1b2a5c", "#14161a", "#f1f2ee", "#9ba1a8",
  "#27d3be", "#1957c4", "#68c3ff", "#ffc400", "#c8102e", "#ff87bc", "#47552d", "#7a1d2b", "#2d4a8f", "#ff6b2e", "#8e44ad"];
const FAN_SHIRT_W = [14, 6, 2, 13, 9, 7, 9, 11, 5, 2, 5, 3, 5, 6, 2, 2, 3, 4, 2, 1];
const FAN_LEGS = ["#2f3e5c", "#1a1c20", "#857559", "#4a4f57", "#d9d3c4", ""];     // "" = shorts: bare skin
const FAN_LEGS_W = [36, 24, 13, 10, 5, 12];
const FAN_CAPS = [0, 1, 3, 4, 5, 6, 7, 10, 12, 13];          // cap colours (indexes into FAN_SHIRT): team caps mostly
// flags: d = stripes horizontal ("h") or vertical ("v"), listed from the pole / from the top
const FAN_FLAGS = [
  { d: "h", c: ["#c60b1e", "#ffc400", "#ffc400", "#c60b1e"], w: 38 },        // Spain
  { d: "h", c: ["#0a3d91", "#0a3d91", "#ffcf00", "#0a3d91", "#0a3d91"], w: 7 },  // blue and yellow (Asturias, for Fernando)
  { d: "h", c: ["#c8102e", "#ffffff", "#1f46a0"], w: 9 },                    // Netherlands
  { d: "h", c: ["#012169", "#ffffff", "#c8102e", "#ffffff", "#012169"], w: 7 }, // Britain (simplified)
  { d: "v", c: ["#009246", "#ffffff", "#ce2b37"], w: 6 },                    // Italy
  { d: "v", c: ["#0055a4", "#ffffff", "#ef4135"], w: 4 },                    // France
  { d: "h", c: ["#75aadb", "#ffffff", "#75aadb"], w: 4 },                    // Argentina
  { d: "h", c: ["#000000", "#dd0000", "#ffce00"], w: 3 },                    // Germany
  { d: "h", c: ["#0d7a63", "#0d7a63", "#cedc00"], w: 8 },                    // Aston Martin green
  { d: "h", c: ["#e1061c", "#e1061c", "#ffd200"], w: 7 },                    // Farrari red
  { d: "h", c: ["#ff8000", "#ff8000", "#111111"], w: 5 },                    // McLaren papaya
  { d: "h", c: ["#1b2a5c", "#e1061c", "#ffc400"], w: 3 }                     // Red Bull
];
const fanPick = (wts, r) => { let s = 0; for (const w of wts) s += w; r *= s; for (let k = 0; k < wts.length; k++) { r -= wts[k]; if (r < 0) return k; } return wts.length - 1; };
const fanRnd = (i, salt) => { const h = Math.sin(i * 12.9898 + salt * 78.233 + 0.5) * 43758.5453; return h - Math.floor(h); };
const FANS = (() => {
  const X = [], Y = [], FX = [], FY = [], U = [], K = [];
  const lapAt = (x, y) => { let b = Infinity, bi = 0; for (let i = 0; i < N; i += 2) { const d = (RL.x[i] - x) ** 2 + (RL.y[i] - y) ** 2; if (d < b) { b = d; bi = i; } } return cum[bi]; };
  for (const [, k, f, raw] of STAND_ROWS) {
    const p = [raw[0], raw[1]];
    for (let i = 2; i + 1 < raw.length; i += 2) if (Math.hypot(raw[i] - p[p.length - 2], raw[i + 1] - p[p.length - 1]) > 1e-3) p.push(raw[i], raw[i + 1]);
    if (p.length < 4) continue;
    const seg = []; let L = 0;
    for (let i = 0; i + 3 < p.length; i += 2) { const l = Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]); seg.push(l); L += l; }
    if (L < 0.7) continue;
    const n = Math.max(1, Math.round(L / FAN_W)), sp = L / n;
    const u0 = lapAt(p[0], p[1]); let u1 = lapAt(p[p.length - 2], p[p.length - 1]);
    if (u1 - u0 > LAP_M / 2) u1 -= LAP_M; else if (u0 - u1 > LAP_M / 2) u1 += LAP_M;
    let si = 0, acc = 0;
    for (let j = 0; j < n; j++) {
      const d = (j + 0.5) * sp;
      while (si < seg.length - 1 && acc + seg[si] < d) { acc += seg[si]; si++; }
      const l = seg[si], t = Math.min(1, Math.max(0, (d - acc) / l)), i = si * 2;
      const tx = (p[i + 2] - p[i]) / l, ty = (p[i + 3] - p[i + 1]) / l;
      X.push(p[i] + (p[i + 2] - p[i]) * t); Y.push(p[i + 1] + (p[i + 3] - p[i + 1]) * t);
      FX.push(-ty * f); FY.push(tx * f); U.push(u0 + (u1 - u0) * d / L); K.push(k);
    }
  }
  const n = X.length, F = {
    n, x: Float32Array.from(X), y: Float32Array.from(Y), fx: Float32Array.from(FX), fy: Float32Array.from(FY), u: Float32Array.from(U), row: Uint8Array.from(K),
    skin: new Uint8Array(n), hair: new Uint8Array(n), cap: new Int8Array(n), shirt: new Uint8Array(n), legs: new Uint8Array(n),
    flag: new Int8Array(n), temper: new Float32Array(n), phase: new Float32Array(n)
  };
  for (let i = 0; i < n; i++) {
    F.skin[i] = fanPick(FAN_SKIN_W, fanRnd(i, 1)); F.hair[i] = fanPick(FAN_HAIR_W, fanRnd(i, 2));
    F.cap[i] = fanRnd(i, 3) < 0.27 ? FAN_CAPS[Math.floor(fanRnd(i, 4) * FAN_CAPS.length)] : -1;
    F.shirt[i] = fanPick(FAN_SHIRT_W, fanRnd(i, 5)); F.legs[i] = fanPick(FAN_LEGS_W, fanRnd(i, 6));
    F.flag[i] = fanRnd(i, 7) < 0.022 ? fanPick(FAN_FLAGS.map(f => f.w), fanRnd(i, 8)) : -1;
    F.temper[i] = 0.3 + 0.7 * fanRnd(i, 9); F.phase[i] = fanRnd(i, 10);
  }
  // tiles: each fan is listed in the tile of its centre (live layer) and baked into every tile it overlaps
  const T = 48, tiles = new Map();
  const tile = (tx, ty) => { const key = tx * 4096 + ty; let t = tiles.get(key); if (!t) { t = { x0: tx * T, y0: ty * T, own: [], bake: [], cv: null }; tiles.set(key, t); } return t; };
  for (let i = 0; i < n; i++) {
    const x = F.x[i], y = F.y[i];
    tile(Math.floor(x / T), Math.floor(y / T)).own.push(i);
    const ax = Math.floor((x - 1.4) / T), bx = Math.floor((x + 1.4) / T), ay = Math.floor((y - 1.4) / T), by = Math.floor((y + 1.4) / T);
    for (let tx = ax; tx <= bx; tx++) for (let ty = ay; ty <= by; ty++) tile(tx, ty).bake.push(i);
  }
  tiles.forEach(t => { t.bake.sort((a, b) => F.row[b] - F.row[a]); t.own = Uint32Array.from(t.own); });   // back rows first
  F.T = T; F.tiles = [...tiles.values()];
  return F;
})();
const FAN_BAKE = 4;                                          // bake resolution: 4 px per map px
function fanShade(hex, k) {                                  // k > 0 lighter, k < 0 darker
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
// one Path2D per layer and colour (indexes into the palettes): a whole tile, or the whole live layer, is filled with a
// few dozen fill() calls
const FAN_LAYERS = [["seat", 1, 0.62], ["sh", 1, 0.3], ["legs", FAN_LEGS.length + FAN_SKIN.length, 1], ["hand", FAN_SKIN.length, 1], ["shirt", FAN_SHIRT.length, 1],
  ["hl", 1, 0.16], ["arm", FAN_SHIRT.length, 1], ["skin", FAN_SKIN.length, 1], ["hair", FAN_HAIR.length, 1], ["cap", FAN_SHIRT.length, 1],
  ["hand2", FAN_SKIN.length, 1], ["flag", 0, 1], ["pole", 1, 1]];
function fanPaths() {
  const P = { flag: new Map() };
  for (const [k, n] of FAN_LAYERS) if (k !== "flag") P[k] = new Array(n).fill(null);
  P.at = (k, i) => { const a = P[k]; return a[i] || (a[i] = new Path2D()); };
  P.fl = col => { let q = P.flag.get(col); if (!q) { q = new Path2D(); P.flag.set(col, q); } return q; };
  return P;
}
const FAN_LAYER_COL = { seat: ["#1f2227"], sh: ["#000"], legs: FAN_LEGS.slice(0, -1).concat([""], FAN_SKIN), hand: FAN_SKIN, shirt: FAN_SHIRT, hl: ["#fff"],
  arm: FAN_SHIRT, skin: FAN_SKIN, hair: FAN_HAIR, cap: FAN_SHIRT, hand2: FAN_SKIN, pole: ["#2a2a2a"] };
function fanFill(g, P) {
  for (const [k, , al] of FAN_LAYERS) {
    g.globalAlpha = al;
    if (k === "flag") { P.flag.forEach((q, col) => { g.fillStyle = col; g.fill(q); }); continue; }
    const arr = P[k], cols = FAN_LAYER_COL[k];
    for (let j = 0; j < arr.length; j++) if (arr[j]) { g.fillStyle = cols[j]; g.fill(arr[j]); }
  }
  g.globalAlpha = 1;
}
// Path2D sub-shapes as plain polygons. Each starts with moveTo; none calls closePath() or ellipse(): with thousands of
// sub-shapes in one path those two get slower with every shape already in it (fill() closes the shapes anyway)
const ELL_C = [], ELL_S = [];
for (let k = 0; k < 10; k++) { ELL_C.push(Math.cos(k * Math.PI / 5)); ELL_S.push(Math.sin(k * Math.PI / 5)); }
const ell = (p, x, y, a, b, rot) => {
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let k = 0; k < 10; k++) { const u = ELL_C[k] * a, v = ELL_S[k] * b, px = x + u * c - v * s, py = y + u * s + v * c; k ? p.lineTo(px, py) : p.moveTo(px, py); }
};
const quad = (p, cx, cy, ax, ay, bx, by) => { p.moveTo(cx - ax - bx, cy - ay - by); p.lineTo(cx + ax - bx, cy + ay - by); p.lineTo(cx + ax + bx, cy + ay + by); p.lineTo(cx - ax + bx, cy - ay + by); };
// one fan, seen from above. (x, y) seat, (fx, fy) the way he looks, s = scale (standing fans look a touch bigger),
// arms = 0 resting on the knees .. 1 fully raised, pump = arm swing, look = head direction (radians), sit = draw the legs
function fanFigure(P, i, x, y, fx, fy, s, arms, pump, look, sit, jump) {
  const rx = -fy, ry = fx, sk = FANS.skin[i], sht = FANS.shirt[i], ra = Math.atan2(ry, rx);
  if (sit || jump > 0.05) { const sh = 0.24 + 0.22 * jump; ell(P.at("sh", 0), x + sh, y + sh * 1.3, 0.56 * s, 0.4 * s, ra); }
  if (sit) {
    quad(P.at("seat", 0), x + fx * 0.2, y + fy * 0.2, rx * (FAN_W / 2 + 0.04), ry * (FAN_W / 2 + 0.04), fx * (FAN_PITCH / 2 + 0.04), fy * (FAN_PITCH / 2 + 0.04));
    const lg = FANS.legs[i], li = FAN_LEGS[lg] ? lg : FAN_LEGS.length + sk;     // shorts: bare legs in his own skin tone
    quad(P.at("legs", li), x + fx * 0.52, y + fy * 0.52, rx * 0.31, ry * 0.31, fx * 0.23, fy * 0.23);
  }
  const cx = x - fx * 0.05, cy = y - fy * 0.05;
  if (arms > 0.05) {                                          // arms up: sleeves out to the hands, hands above the head line
    const a = arms, sp = 0.5 + 0.12 * pump, fw = 0.22 + 0.24 * a + 0.1 * pump, ap = P.at("arm", sht), hp = P.at("hand2", sk);
    for (let sd = -1; sd <= 1; sd += 2) {
      const sx = cx + rx * 0.36 * sd * s, sy = cy + ry * 0.36 * sd * s;
      const hx = cx + (rx * sp * sd + fx * fw) * s, hy = cy + (ry * sp * sd + fy * fw) * s;
      const ax = (hx - sx) / 2, ay = (hy - sy) / 2, ln = Math.hypot(ax, ay) || 1;
      quad(ap, sx + ax, sy + ay, ax, ay, -ay / ln * 0.1 * s, ax / ln * 0.1 * s);
      hp.moveTo(hx + 0.12 * s, hy); hp.arc(hx, hy, 0.12 * s, 0, Math.PI * 2);
    }
  } else if (sit) {                                           // hands on the knees
    const hp = P.at("hand", sk);
    for (let sd = -1; sd <= 1; sd += 2) { const hx = x + rx * 0.25 * sd + fx * 0.58, hy = y + ry * 0.25 * sd + fy * 0.58; hp.moveTo(hx + 0.1, hy); hp.arc(hx, hy, 0.1, 0, Math.PI * 2); }
  }
  ell(P.at("shirt", sht), cx, cy, 0.52 * s, 0.34 * s, ra);
  if (sit) ell(P.at("hl", 0), cx - 0.1 * s, cy - 0.11 * s, 0.28 * s, 0.13 * s, ra);
  const hx = x + fx * 0.07, hy = y + fy * 0.07, hr = 0.26 * s, kp = P.at("skin", sk);
  kp.moveTo(hx + hr, hy); kp.arc(hx, hy, hr, 0, Math.PI * 2);
  const lx = Math.cos(look), ly = Math.sin(look), c = FANS.cap[i];
  if (c >= 0) {                                               // cap: crown plus the peak towards where he looks
    const p = P.at("cap", c);
    p.moveTo(hx - lx * 0.04 + hr * 1.04, hy - ly * 0.04); p.arc(hx - lx * 0.04, hy - ly * 0.04, hr * 1.04, 0, Math.PI * 2);
    ell(p, hx + lx * hr * 0.95, hy + ly * hr * 0.95, hr * 0.62, hr * 0.38, look + Math.PI / 2);
  } else {                                                    // hair over the back two thirds of the head, face to the front
    const p = P.at("hair", FANS.hair[i]);
    p.moveTo(hx - lx * 0.06, hy - ly * 0.06); p.arc(hx - lx * 0.06, hy - ly * 0.06, hr * 1.02, look + 1.25, look - 1.25 + Math.PI * 2);
  }
}
const F_SKIN = i => FANS.skin[i];
function bakeFanTile(t) {
  const S = FAN_BAKE, cv = document.createElement("canvas"); cv.width = cv.height = FANS.T * S;
  const g = cv.getContext("2d"); g.setTransform(S, 0, 0, S, -t.x0 * S, -t.y0 * S);
  const P = fanPaths();
  for (const i of t.bake) { const fx = FANS.fx[i], fy = FANS.fy[i]; fanFigure(P, i, FANS.x[i], FANS.y[i], fx, fy, 1, 0, 0, Math.atan2(fy, fx), true, 0); }
  fanFill(g, P); t.cv = cv;
}
const FAN_HERO = { 0: 1.45, 11: 1.3 };                       // the home crowd goes wild for Alonso and Sainz
function fanFlag(P, i, x, y, fx, fy, t, energy) {          // a flag held up on a short pole and waved
  const F = FAN_FLAGS[FANS.flag[i]], ph = FANS.phase[i] * 6.283;
  const swing = Math.sin(t * (2.2 + 3.5 * energy) + ph) * (0.55 + 0.5 * energy);
  const wind = 0.7 + Math.sin(t * 0.13 + ph) * 0.25;           // a light breeze from the left of the map
  const base = Math.atan2(fy, fx) + Math.PI / 2 + swing * 0.9 + wind * 0.4;
  const dx = Math.cos(base), dy = Math.sin(base), nx = -dy, ny = dx;
  const px = x + fx * 0.15, py = y + fy * 0.15, Lf = 1.75, Hf = 1.1, rip = 0.14 + 0.1 * energy;
  const pt = (u, v) => { const w = Math.sin(u * 5 - t * 9 - ph) * rip * u; return [px + dx * Lf * u + nx * (Hf * (v - 0.5) + w), py + dy * Lf * u + ny * (Hf * (v - 0.5) + w)]; };
  const n = F.c.length, U = [0, 0.34, 0.67, 1];
  for (let b = 0; b < n; b++) {
    const p = P.fl(F.c[b]);
    if (F.d === "h") {                                           // bands along the cloth
      const v0 = b / n, v1 = (b + 1) / n, a = U.map(u => pt(u, v0)), c = U.map(u => pt(u, v1)).reverse();
      p.moveTo(a[0][0], a[0][1]); for (const q of [...a.slice(1), ...c]) p.lineTo(q[0], q[1]);
    } else {                                                     // bands across the cloth
      const u0 = b / n, u1 = (b + 1) / n, q = [pt(u0, 0), pt(u1, 0), pt(u1, 1), pt(u0, 1)];
      p.moveTo(q[0][0], q[0][1]); for (let k = 1; k < 4; k++) p.lineTo(q[k][0], q[k][1]);
    }
  }
  const pole = P.at("pole", 0); pole.moveTo(px + 0.09, py); pole.arc(px, py, 0.09, 0, Math.PI * 2);
}
let FAN_LIVE_N = 0; const FAN_LIVE_MAX = 1000, FAN_LIVE = { P: null, t: 0, z: 0, x0: 0, x1: 0, y0: 0, y1: 0 };
const fanHash = (i, step) => { let h = Math.imul(i ^ Math.imul(step, 0x9E3779B1), 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
FANS.tiles.forEach(t => {                                    // lap-distance span of each tile, for the Mexican waves
  let lo = Infinity, hi = -Infinity; for (const i of t.own) { lo = Math.min(lo, FANS.u[i]); hi = Math.max(hi, FANS.u[i]); }
  t.um = (lo + hi) / 2; t.ur = (hi - lo) / 2 + 12;
});
function drawFans() {
  if (!OPT.fans) return;
  const T = FANS.T, ppm = cam.zoom * DPR;                       // device px per map px
  let baked = 0;
  ctx.imageSmoothingQuality = ppm > 2.5 ? "low" : "medium";     // the tiles are baked near screen resolution: cheap filtering is enough
  for (const t of FANS.tiles) {
    if (t.x0 > VIEWB.x1 || t.x0 + T < VIEWB.x0 || t.y0 > VIEWB.y1 || t.y0 + T < VIEWB.y0) continue;
    if (!t.cv) { if (baked > 1) continue; bakeFanTile(t); baked++; }
    const sv = CELEB && CELEB.on && t.st ? t.st[(CELEB.v + (t.k || 0)) & 1] : null;
    ctx.drawImage(sv || t.cv, t.x0, t.y0, T, T);
  }
  ctx.imageSmoothingQuality = "high";
  if (ppm < 1.2) return;
  // the live layer is rebuilt ~25 times a second (paths are in map coordinates, so the camera can move in between)
  const now = performance.now(), [hx, hy] = halfExt(cam.zoom), vx0 = cam.x - hx - 3, vx1 = cam.x + hx + 3, vy0 = cam.y - hy - 3, vy1 = cam.y + hy + 3;
  const L = FAN_LIVE;
  if (L.P && now - L.t < 40 && Math.abs(L.z - cam.zoom) < 0.02 && vx0 >= L.x0 && vx1 <= L.x1 && vy0 >= L.y0 && vy1 <= L.y1) { fanFill(ctx, L.P); return; }
  L.t = now; L.z = cam.zoom; L.x0 = vx0 - 25; L.x1 = vx1 + 25; L.y0 = vy0 - 25; L.y1 = vy1 + 25;
  const live = ppm >= 1.5, t = now / 1000;
  const cp = cars.filter(c => !c.gone && !(c.fin && c.done)).map(c => { const p = carPos(c); return [p.x, p.y, FAN_HERO[c.idx] || 1]; });
  const waves = [0, 1, 2, 3].map(k => (t * 15 + k * LAP_M / 4) % LAP_M);   // Mexican waves running round the stands in race direction
  const P = fanPaths(), R = 175, nc = []; FAN_LIVE_N = 0; L.P = P;
  for (const tl of FANS.tiles) {
    if (tl.x0 > L.x1 || tl.x0 + T < L.x0 || tl.y0 > L.y1 || tl.y0 + T < L.y0) continue;
    nc.length = 0;                                              // only the cars close to this tile, and only the waves passing it
    for (const c of cp) if (c[0] > tl.x0 - R && c[0] < tl.x0 + T + R && c[1] > tl.y0 - R && c[1] < tl.y0 + T + R) nc.push(c);
    const wl = waves.filter(w => Math.abs(sgap(tl.um - w)) < tl.ur);
    for (const i of tl.own) {
      const fl = FANS.flag[i] >= 0;
      if (!live && !fl) continue;
      if (CELEB && CELEB.on && !fl) continue;                      // the baked standing frames carry the crowd
      const x = FANS.x[i], y = FANS.y[i], tp = FANS.temper[i];
      if (x < L.x0 || x > L.x1 || y < L.y0 || y > L.y1) continue;
      let near = 0, ncx = 0, ncy = 0;
      for (let k = 0; k < nc.length; k++) {
        const c = nc[k], dx = c[0] - x, dy = c[1] - y; if (dx > R || dx < -R || dy > R || dy < -R) continue;
        const v = Math.min(1, (1 - Math.sqrt(dx * dx + dy * dy) / R) * c[2]);
        if (v > near) { near = v; ncx = dx; ncy = dy; }
      }
      const fx = FANS.fx[i], fy = FANS.fy[i];
      if (!live) { fanFlag(P, i, x, y, fx, fy, t, near); continue; }
      let wv = 0; for (let k = 0; k < wl.length; k++) { const d = sgap(FANS.u[i] - wl[k]); if (d * d < 150) wv = Math.max(wv, Math.exp(-d * d / 24)); }
      const step = Math.floor(t * (1.1 + 1.6 * tp) + FANS.phase[i] * 9);
      const act = 0.045 * tp + 0.9 * near * near * tp, cheer = fanHash(i, step) < act;
      const up = Math.max(wv > 0.22 ? wv : 0, cheer ? 0.75 + 0.25 * fanHash(i, step + 3) : 0);
      const stand = Math.max(wv > 0.3 ? wv : 0, cheer && near > 0.45 && fanHash(i, step + 7) < 0.55 ? 1 : 0);
      const turn = near > 0.12 && (cheer || fanHash(i, step + 5) < near * 0.35);
      if (!(up > 0.05 || stand > 0 || turn || fl)) continue;     // the baked seated fan is good enough
      if (++FAN_LIVE_N > FAN_LIVE_MAX && !fl) continue;            // keep the frame cheap in a packed view
      const face = Math.atan2(fy, fx);
      let look = face;
      if (turn) { const d = Math.atan2(ncy, ncx) - face, dd = Math.atan2(Math.sin(d), Math.cos(d)); look = face + Math.max(-1.3, Math.min(1.3, dd)) * Math.min(1, near * 2.2); }
      const pump = Math.sin(t * (7 + 5 * tp) + FANS.phase[i] * 6.28);
      const jump = stand ? Math.max(0, Math.sin(t * 6.5 + FANS.phase[i] * 6.28)) * 0.6 * near + 0.4 * stand : 0;
      fanFigure(P, i, x, y, fx, fy, 1 + 0.07 * stand + 0.04 * jump, fl ? Math.max(up, 0.55) : up, pump * (up > 0 ? 1 : 0), look, false, jump);
      if (fl) fanFlag(P, i, x, y, fx, fy, t, near);
    }
  }
  fanFill(ctx, P);
}
// bake the remaining grandstand tiles quietly in the background, a couple at a time
(function bakeIdle() {
  const t = FANS.tiles.find(t => !t.cv); if (!t) return;
  bakeFanTile(t);
  if (window.requestIdleCallback) requestIdleCallback(bakeIdle, { timeout: 400 }); else setTimeout(bakeIdle, 50);
})();

// ---------- pit crews ----------
// Every team has its crew in its garage. As soon as a car of the team is called in (BOX), 19 mechanics run out of the
// garage to their stations around the yellow box: per wheel a gunman, a wheel-off and a wheel-on man, the front and
// rear jacks, two stabilisers, two front-wing men and the chief with the lollipop. The stop itself is scripted on the
// stationary time of the simulation (P.stopEl / P.stopDur): a slow stop shows one wheel giving trouble, a new nose
// keeps the wing men busy. When the car has gone they walk back into the garage with the old tyres.
const CREW_COL = {                                            // overalls, accent, helmet: the colours of the car
  mcl: ["#ff8000", "#16181b", "#ff8000"], mer: ["#c3c8ce", "#00a19c", "#17191c"], rbr: ["#1b2a5c", "#e1061c", "#1b2a5c"],
  fer: ["#e1061c", "#ffd200", "#e1061c"], wil: ["#13398a", "#64c4ff", "#0d2a66"], rcb: ["#eceff4", "#1e41c8", "#1e41c8"],
  amr: ["#0d6e58", "#cedc00", "#0d6e58"], haa: ["#e9ebee", "#e10600", "#1a1c1f"], aud: ["#24262a", "#d42a1e", "#16171a"],
  alp: ["#1257d6", "#ff87bc", "#1257d6"], cad: ["#141518", "#d6b25e", "#141518"]
};
const PG = (() => {
  const L = CAR_LEN_M / M_PER_PX, W = CAR_W_M / M_PER_PX;
  // tyre centre (u, v) and size (length, width) on a assets/img/cars.png cell: front-top, front-bottom, rear-top, rear-bottom
  const T = [[248, 16, 44, 26], [248, 111, 44, 26], [47.5, 17, 47, 28], [47.5, 110, 47, 28]];
  return { L, W, L2: L / 2, W2: W / 2, FRONT: 9.8,        // FRONT: the garage front, measured from the centre of the box
    wheels: T.map(([u, v, l, w]) => ({ lx: (u / CELL_W - 0.5) * L, ly: (v / CELL_H - 0.5) * W, len: l / CELL_W * L, wid: w / CELL_H * W })),
    rect: [[225, 2, 46, 27], [225, 98, 46, 27], [23, 2, 49, 29], [23, 96, 49, 29]] };   // where the wheels sit on the cell (px): every car is aligned on them
})();
// sprite surgery: each car without its wheels (hubs showing) plus the four wheels as separate pieces
const carBase = DRIVERS.map(() => null), carWheel = DRIVERS.map(() => null);
function splitWheels(k) {
  const src = carSprites[k]; let d;
  try { d = src.getContext("2d").getImageData(0, 0, CELL_W, CELL_H); } catch (e) { return; }
  const bd = new ImageData(new Uint8ClampedArray(d.data), CELL_W, CELL_H);
  carWheel[k] = PG.rect.map(([x0, y0, w, h]) => {
    const wd = new ImageData(w, h), rr = Math.min(w, h) * 0.22;      // the tyre is a rounded rectangle (rubber + its black outline)
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const px = x + 0.5, py = y + 0.5, dx = Math.max(x0 + rr - px, 0, px - (x0 + w - rr)), dy = Math.max(y0 + rr - py, 0, py - (y0 + h - rr));
      if (dx * dx + dy * dy > rr * rr) continue;
      const o = (y * CELL_W + x) * 4;
      if (d.data[o + 3] < 8) continue;
      const q = ((y - y0) * w + x - x0) * 4; wd.data.set(d.data.subarray(o, o + 4), q); bd.data[o + 3] = 0;
    }
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").putImageData(wd, 0, 0);
    return { cv, x0, y0, w, h };
  });
  const base = document.createElement("canvas"); base.width = CELL_W; base.height = CELL_H;
  const g = base.getContext("2d"); g.putImageData(bd, 0, 0);
  PG.rect.forEach(([x0, y0, w, h], i) => {                         // upright, brake drum and wheel nut on the inner side, where the suspension ends
    const cx = x0 + w / 2, cy = i % 2 ? y0 + 8 : y0 + h - 8;
    g.fillStyle = "#1c1f24"; g.fillRect(cx - 8, cy - 5, 16, 10);
    g.fillStyle = "#59626d"; g.fillRect(cx - 5, cy - 3, 10, 6);
    g.fillStyle = "#c9a227"; g.fillRect(cx - 2, cy - 2, 4, 4);
  });
  carBase[k] = base;
}
const pEase = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const pPh = (u, a, b) => pEase((u - a) / (b - a));
const pLerp = (a, b, t) => a + (b - a) * t;
const pLerpA = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
function crewFrame(cr) {                                     // the box frame: X along the car (nose ahead), Y towards the garage
  if (cr.F) return cr.F;
  const b = PIT.boxes[cr.box], q = pitPoint(b.d), c = Math.cos(q.h), s = Math.sin(q.h);
  const g = ((b.x - q.x) * -s + (b.y - q.y) * c) > 0 ? 1 : -1;
  return (cr.F = { x: b.x, y: b.y, c, s, g, d: b.d });
}
const bw = (F, X, Y) => [F.x + F.c * X - F.s * F.g * Y, F.y + F.s * X + F.c * F.g * Y];
const bwa = (F, a) => Math.atan2(F.s * Math.cos(a) + F.c * F.g * Math.sin(a), F.c * Math.cos(a) - F.s * F.g * Math.sin(a));
const mbf = (F, x, y) => { const dx = x - F.x, dy = y - F.y; return [dx * F.c + dy * F.s, F.g * (-dx * F.s + dy * F.c)]; };
function crewLayout(cr) {
  const F = crewFrame(cr), L2 = PG.L2, ms = [];
  PG.wheels.forEach((w, i) => {
    const X = w.lx, Yw = F.g * w.ly, sg = Math.sign(Yw), ex = X > 0 ? -1 : 1, hub = Math.abs(Yw) + w.wid / 2;
    const base = { w: i, sg, ex, hub, X, Yw };
    ms.push({ ...base, role: "gun", wait: [X, sg * (hub + 1.45), Math.atan2(-sg, 0)], pose: "kneel" });
    ms.push({ ...base, role: "off", wait: [X + ex * 1.5, sg * (hub + 1.05), Math.atan2(-sg * 1.05, -ex * 1.5)], pose: "crouch" });
    ms.push({ ...base, role: "on", wait: [X - ex * 1.55, sg * (hub + 1.1), Math.atan2(-sg * 1.1, ex * 1.55)], pose: "stand" });
  });
  ms.push({ role: "fjack", wait: [L2 + 2.6, 0, Math.PI], pose: "stand" });
  ms.push({ role: "rjack", wait: [-L2 - 0.6, 3.95, Math.PI - 0.05], pose: "stand" });
  for (const sg of [1, -1]) ms.push({ role: "stab", sg, wait: [0.4, sg * 3.75, Math.atan2(-sg, 0)], pose: "crouch" });
  for (const sg of [1, -1]) ms.push({ role: "wing", sg, wait: [L2 + 0.1, sg * 3.95, Math.atan2(-sg, -0.25)], pose: "stand" });
  ms.push({ role: "chief", wait: [L2 + 4.4, 3.1, Math.atan2(-3.1, -4.4)], pose: "stand" });
  ms.forEach((m, k) => Object.assign(m, {
    x: Math.max(-9, Math.min(9, m.wait[0])), y: PG.FRONT + 1.6, a: -Math.PI / 2, vx: 0, vy: 0, speed: 0, ph: k * 0.9, inside: true,
    hasNew: m.role === "on", hasOld: false, delay: fanRnd(k + cr.box * 31, 2.2) * 0.55, pace: 0.92 + fanRnd(k + cr.box * 7, 3.3) * 0.16,
    dx: 0, dy: 0, hands: null, carry: null, jack: null, lolly: null, buzz: 0, cur: m.pose
  }));
  return ms;
}
var CREWS = null, CREW_BY_TEAM = {};
function resetCrews() {
  if (!CREWS) return;
  CREWS.forEach(cr => { cr.mech = crewLayout(cr); cr.mode = "home"; cr.t = 9; cr.car = null; cr.sch = null; cr.carState = null; });
}
CREWS = Object.keys(TEAMS).map(team => ({ team, box: TEAMS[team].box, col: CREW_COL[team] || [TEAMS[team].col, "#111", TEAMS[team].col], F: null }));
CREWS.forEach(cr => { CREW_BY_TEAM[cr.team] = cr; }); resetCrews();
function startStop(cr, c) {
  const P = c.pit, D = P.stopDur, k = Math.max(0.95, Math.min(1.3, D / 2.05)), E = Math.max(0, D - 1.78 * k);
  const prob = Math.floor(fanRnd(c.idx * 17 + c.stops * 3 + Math.floor(simClock), 4.4) * 4);
  const te = [0, 1, 2, 3].map(i => 1.24 * k + (!P.wing && i === prob ? E : 0));
  cr.car = c; cr.oldComp = c.comp; cr.newComp = c.nextComp;
  cr.sch = { k, D, E, prob, wing: !!P.wing, te, all: P.wing ? 1.24 * k + E : Math.max(...te) };
  cr.mech.forEach(m => { if (m.role === "on") m.hasNew = true; if (m.role === "off") m.hasOld = false; });
}
// where each mechanic is during the stop, u seconds after the car came to rest
function workPose(cr, m, u, out) {
  const S = cr.sch, T = x => x * S.k, L2 = PG.L2, [wx, wy, wa] = m.wait;
  out.hands = null; out.carry = null; out.jack = null; out.lolly = null; out.buzz = 0; out.pose = m.pose;
  if (m.role === "gun") {
    const i = m.w, a1 = pPh(u, 0, T(0.14)), lean = pPh(u, T(0.42), T(0.52)) * (1 - pPh(u, T(0.92), T(1.02))), back = pPh(u, S.te[i], S.te[i] + T(0.16));
    out.x = m.X; out.y = pLerp(pLerp(wy, m.sg * (m.hub + 0.88), a1) + m.sg * 0.34 * lean, wy, back); out.a = wa;
    if (a1 > 0.6 && back < 0.4 && lean < 0.5) out.hands = [m.X, m.sg * (m.hub + 0.22)];
    if ((u > T(0.16) && u < T(0.4)) || (u > T(1.02) && u < S.te[i])) out.buzz = i === S.prob && u > T(1.3) ? 0.09 : 0.035;
  } else if (m.role === "off") {
    const g1 = pPh(u, T(0.2), T(0.4)), r = pPh(u, T(0.4), T(0.76)), gx = m.X + m.ex * 1.05, gy = m.sg * (m.hub + 0.62);
    const bx = m.X + m.ex * 1.75, by = m.sg * (m.hub + 1.45), ba = Math.atan2(m.Yw - by, m.X - bx);
    out.x = pLerp(pLerp(wx, gx, g1), bx, r); out.y = pLerp(pLerp(wy, gy, g1), by, r);
    out.a = pLerpA(pLerpA(wa, Math.atan2(m.Yw - gy, m.X - gx), g1), ba, r);
    if (r > 0.02) {
      const p1x = m.X, p1y = m.Yw + m.sg * 0.85, p2x = bx + Math.cos(ba) * 0.8, p2y = by + Math.sin(ba) * 0.8;
      const s = r < 0.45 ? r / 0.45 : (r - 0.45) / 0.55;
      const cx = r < 0.45 ? pLerp(m.X, p1x, s) : pLerp(p1x, p2x, s), cy = r < 0.45 ? pLerp(m.Yw, p1y, s) : pLerp(p1y, p2y, s);
      out.carry = { x: cx, y: cy, a: pLerpA(0, ba + Math.PI / 2, pPh(r, 0.35, 1)), old: true }; out.hands = [cx, cy];
    } else if (g1 > 0.6) out.hands = [m.X + m.ex * 0.45, m.Yw + m.sg * 0.3];
  } else if (m.role === "on") {
    const g1 = pPh(u, T(0.56), T(0.68)), f = pPh(u, T(0.66), T(1.0)), back = pPh(u, T(1.04), T(1.22));
    const gx = m.X - m.ex * 0.95, gy = m.sg * (m.hub + 0.55);
    out.x = pLerp(pLerp(wx, gx, g1), wx, back); out.y = pLerp(pLerp(wy, gy, g1), wy, back);
    const fa = Math.atan2(m.Yw - out.y, m.X - out.x); out.a = pLerpA(wa, fa, Math.max(g1, f) * (1 - back));
    if (f < 1) {
      const h0x = out.x + Math.cos(out.a) * 0.75, h0y = out.y + Math.sin(out.a) * 0.75, q1y = m.Yw + m.sg * 0.85;
      const s = f < 0.55 ? f / 0.55 : (f - 0.55) / 0.45;
      const cx = f < 0.55 ? pLerp(h0x, m.X, s) : m.X, cy = f < 0.55 ? pLerp(h0y, q1y, s) : pLerp(q1y, m.Yw, s);
      out.carry = { x: cx, y: cy, a: pLerpA(out.a + Math.PI / 2, 0, pPh(f, 0, 0.6)), old: false }; out.hands = [cx, cy];
    }
  } else if (m.role === "fjack") {
    const lift = pPh(u, T(0.05), T(0.2)), drop = pPh(u, S.all + T(0.03), S.all + T(0.15));
    const slide = pPh(u, S.all + T(0.1), S.all + T(0.22)), swing = pPh(u, S.all + T(0.2), S.all + T(0.42));
    const x1 = pLerp(wx, L2 + 2.95, lift * (1 - slide)), x2 = pLerp(x1, L2 + 3.55, slide);
    out.x = pLerp(x2, L2 + 3.2, swing); out.y = pLerp(0, 4.6, swing); out.a = pLerpA(Math.PI, Math.PI + 0.55, swing);
    const fx = out.x + Math.cos(out.a) * 2.6, fy = out.y + Math.sin(out.a) * 2.6;
    out.jack = [pLerp(L2 - 0.15, fx, slide), pLerp(0, fy, slide)];
  } else if (m.role === "rjack") {
    const inn = pPh(u, 0, T(0.24)), lift = pPh(u, T(0.22), T(0.36)), drop = pPh(u, S.all + T(0.02), S.all + T(0.14));
    out.x = pLerp(wx, -L2 - 2.55, inn) - 0.3 * lift * (1 - drop); out.y = pLerp(wy, 0, inn); out.a = pLerpA(wa, 0, inn);
    out.jack = [out.x + Math.cos(out.a) * 2.75, out.y + Math.sin(out.a) * 2.75];
  } else if (m.role === "stab") {
    const on = pPh(u, 0, T(0.12)) * (1 - pPh(u, S.all + T(0.04), S.all + T(0.2)));
    out.x = 0.4; out.y = pLerp(wy, m.sg * 3.05, on); out.a = wa; if (on > 0.5) out.hands = [0.4, m.sg * 2.3];
  } else if (m.role === "wing") {
    const on = pPh(u, T(0.04), T(0.2)) * (1 - pPh(u, S.all - T(0.04), S.all + T(0.12)));
    out.x = pLerp(wx, L2 - 0.75, on); out.y = pLerp(wy, m.sg * 3.1, on); out.a = pLerpA(wa, Math.atan2(-m.sg, 0), on);
    out.pose = on > 0.5 ? "kneel" : "stand";
    if (on > 0.5) { const j = S.wing ? Math.sin(u * 19 + m.sg) * 0.25 : 0; out.hands = [L2 - 0.65 + j, m.sg * 2.25]; }
  } else if (m.role === "chief") {
    const go = pPh(u, S.all + T(0.28), S.all + T(0.4));
    out.x = wx; out.y = wy; out.a = wa; out.lolly = [pLerp(L2 + 3.1, L2 + 4.0, go), pLerp(1.55, 4.25, go), go > 0.05];
  }
  return out;
}
// the poses held around a car that is coming in (ready) and just after it has gone (after)
function restPose(cr, m, out) {
  const [wx, wy, wa] = m.wait;
  out.x = wx; out.y = wy; out.a = wa; out.pose = m.pose; out.hands = null; out.carry = null; out.jack = null; out.lolly = null; out.buzz = 0;
  if (cr.mode === "after") {
    if (m.role === "fjack") { out.x = PG.L2 + 3.2; out.y = 4.6; out.a = Math.PI + 0.55; }
    if (m.role === "rjack") { out.x = -PG.L2 - 2.55; out.y = 0; out.a = 0; }
    if (m.role === "off" && m.hasOld) { out.x = m.X + m.ex * 1.75; out.y = m.sg * (m.hub + 1.45); out.a = Math.atan2(m.Yw - out.y, m.X - out.x); }
    if (m.role === "chief") out.lolly = [PG.L2 + 4.0, 4.25, true];
  }
  return out;
}
const POSE = {};
function crewStep(dt) {
  if (!CREWS || SES) return;
  for (const cr of CREWS) {
    const F = crewFrame(cr);
    let work = null, leave = null, pend = null;
    for (const c of cars) {
      if (c.team !== cr.team) continue;
      const P = c.pit;
      if (P) { if (P.stopT > 0 || (P.served && !P.released)) work = c; else if (P.served) { if (P.d < F.d + 34) leave = c; } else pend = c; }
      else if (c.pitReq && !c.done) pend = pend || c;
    }
    if (work) { if (cr.mode !== "work" || cr.car !== work) startStop(cr, work); cr.mode = "work"; }
    else if (cr.mode === "work") { cr.mode = "after"; cr.t = 0; }
    else if (cr.mode === "after") { if (cr.t > 0.8 && !leave) { cr.mode = pend ? "ready" : "home"; cr.t = 0; } }
    else { const md = pend ? "ready" : "home"; if (md !== cr.mode) { cr.mode = md; cr.t = 0; } }
    cr.t += dt;
    if (pend && cr.mode !== "work") cr.newComp = pend.nextComp;
    if (cr.mode === "home" && cr.mech.every(m => m.inside)) { cr.carState = null; continue; }
    const P = cr.mode === "work" ? cr.car.pit : null, u = P ? P.stopEl || 0 : 0;
    // what the car looks like: wheels on or off, front and rear lifted
    if (P) {
      const S = cr.sch, T = x => x * S.k;
      cr.carState = {
        on: [0, 1, 2, 3].map(i => u < T(0.4) + T(0.36) * 0.03 || u >= T(1.0)),
        lf: pPh(u, T(0.05), T(0.2)) * (1 - pPh(u, S.all + T(0.03), S.all + T(0.15))),
        lr: pPh(u, T(0.22), T(0.36)) * (1 - pPh(u, S.all + T(0.02), S.all + T(0.14)))
      };
    } else cr.carState = null;
    const nsub = Math.max(1, Math.ceil(dt / (1 / 30))), h = dt / nsub;
    for (const m of cr.mech) {
      if (P) {                                                     // scripted stop: follow the pose closely
        const o = workPose(cr, m, u, POSE), k = 1 - Math.exp(-dt * 32);
        const nx = pLerp(m.x, o.x, k), ny = pLerp(m.y, o.y, k); m.speed = Math.hypot(nx - m.x, ny - m.y) / Math.max(dt, 1e-4);
        m.ph += Math.hypot(nx - m.x, ny - m.y) * 3.3; m.x = nx; m.y = ny; m.a = pLerpA(m.a, o.a, k); m.inside = false;
        m.cur = o.pose; m.hands = o.hands; m.carry = o.carry; m.jack = o.jack; m.lolly = o.lolly; m.buzz = o.buzz;
        if (m.role === "off" && o.carry) m.hasOld = true;
        if (m.role === "on" && u >= cr.sch.k * 1.0) m.hasNew = false;
        continue;
      }
      // walking / running between the garage and the stations
      const doorX = Math.max(-9.5, Math.min(9.5, m.wait[0])), doorY = PG.FRONT + 1.6;
      let tx, ty, ta, toDoor = false;
      if (cr.mode === "home" || (m.role === "on" && !m.hasNew) || (m.role === "off" && m.hasOld && cr.mode !== "after")) { tx = doorX; ty = doorY; ta = Math.PI / 2; toDoor = true; }
      else { const o = restPose(cr, m, POSE); tx = o.x; ty = o.y; ta = o.a; }
      if (m.inside) {
        if (toDoor) { m.speed = 0; continue; }
        if (cr.t < m.delay) continue;
        m.inside = false; m.x = doorX; m.y = doorY; m.a = -Math.PI / 2; m.vx = 0; m.vy = -2;
      }
      for (let s = 0; s < nsub; s++) {
        const dx = tx - m.x, dy = ty - m.y, dist = Math.hypot(dx, dy);
        const vmax = (cr.mode === "home" ? 4.4 : 6.6) * m.pace, want = Math.min(vmax, dist * 5.5);
        const dvx = dist > 1e-3 ? dx / dist * want : 0, dvy = dist > 1e-3 ? dy / dist * want : 0, kk = Math.min(1, h * 9);
        m.vx += (dvx - m.vx) * kk; m.vy += (dvy - m.vy) * kk;
        m.x += m.vx * h; m.y += m.vy * h;
        const sp = Math.hypot(m.vx, m.vy); m.speed = sp; m.ph += sp * h * 3.3;
        const fa = sp > 0.9 ? Math.atan2(m.vy, m.vx) : ta; m.a = pLerpA(m.a, fa, Math.min(1, h * (sp > 0.9 ? 12 : 8)));
      }
      m.cur = m.speed > 0.9 ? "walk" : m.pose;
      if (toDoor && Math.hypot(tx - m.x, ty - m.y) < 0.25) {        // through the garage door
        if (m.role === "off") m.hasOld = false;
        if (m.role === "on") m.hasNew = true;
        if (cr.mode === "home") m.inside = true;
      }
      // what they carry while walking
      const ca = m.a, fx = Math.cos(ca), fy = Math.sin(ca);
      m.hands = null; m.lolly = null; m.buzz = 0; m.carry = null; m.jack = null;
      if ((m.role === "on" && m.hasNew) || (m.role === "off" && m.hasOld)) { m.carry = { x: m.x + fx * 0.75, y: m.y + fy * 0.75, a: ca + Math.PI / 2, old: m.role === "off" }; m.hands = [m.carry.x, m.carry.y]; }
      if (m.role === "fjack") m.jack = [m.x + fx * (cr.mode === "after" ? 2.6 : 2.75), m.y + fy * (cr.mode === "after" ? 2.6 : 2.75)];
      if (m.role === "rjack") m.jack = [m.x + fx * 2.75, m.y + fy * 2.75];
      if (m.role === "chief") { const o = restPose(cr, m, POSE); m.lolly = o.lolly || [m.x + fx * 1.4 + fy * 0.4, m.y + fy * 1.4 - fx * 0.4, false]; if (m.speed > 0.9) m.lolly = [m.x + fx * 0.6, m.y + fy * 0.6, cr.mode === "home"]; }
    }
    // step out of the path of any car moving in the lane (a neighbour swinging in or out, our own car arriving)
    for (const m of cr.mech) {
      if (m.inside) { m.dx = m.dy = 0; continue; }
      let px = 0, py = 0;
      const [mx, my] = bw(F, m.x, m.y);
      for (const c of cars) {
        if (!c.pit || (c.vNow || 0) < 0.3) continue;
        const p = pitPos(c); if (Math.abs(p.x - mx) > 24 || Math.abs(p.y - my) > 24) continue;
        const hd = dispHead(c), vx = Math.cos(hd), vy = Math.sin(hd), nx = -vy, ny = vx, ox = mx - p.x, oy = my - p.y;   // the nose follows the path
        const along = ox * vx + oy * vy, side = ox * nx + oy * ny, reach = PG.L2 + 0.6 + Math.min(5, (c.vNow / M_PER_PX) * 0.3);
        const band = PG.W2 + 0.6;
        if (along > reach || along < -PG.L2 - 0.6 || Math.abs(side) > band) continue;
        const sgn = side >= 0 ? 1 : -1, need = Math.min(3, band - Math.abs(side));
        const [bx, by] = mbf(F, mx + nx * sgn * need, my + ny * sgn * need);
        if (Math.hypot(bx - m.x, by - m.y) > Math.hypot(px, py)) { px = bx - m.x; py = by - m.y; }
      }
      const kd = 1 - Math.exp(-dt * 14); m.dx += (px - m.dx) * kd; m.dy += (py - m.dy) * kd;
    }
  }
}
function crewCar(c) {
  const cr = CREW_BY_TEAM[c.team];
  return cr && cr.mode === "work" && cr.car === c && cr.carState && carBase[c.idx] ? cr.carState : null;
}
function drawPitCar(c, p, head, L, Wd, st) {
  const k = c.idx, sc = 1 + 0.028 * Math.max(st.lf, st.lr);
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(head); ctx.scale(sc, sc);
  ctx.drawImage(carBase[k], -L / 2, -Wd / 2, L, Wd);
  carWheel[k].forEach((w, i) => { if (st.on[i]) ctx.drawImage(w.cv, (w.x0 / CELL_W - 0.5) * L, (w.y0 / CELL_H - 0.5) * Wd, w.w / CELL_W * L, w.h / CELL_H * Wd); });
  ctx.restore();
}
const crewShade = (hex, k) => fanShade(hex, k);
function drawCrewTyre(cr, F, t, wi) {                          // a wheel in a mechanic's hands, compound stripe on the sidewall
  const [x, y] = bw(F, t.x, t.y), a = bwa(F, t.a), w = PG.wheels[wi], car = cr.car || cars.find(c => c.team === cr.team);
  const pc = car && carWheel[car.idx] && carWheel[car.idx][wi];
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  if (pc) ctx.drawImage(pc.cv, -pc.w / CELL_W * PG.L / 2, -pc.h / CELL_H * PG.W / 2, pc.w / CELL_W * PG.L, pc.h / CELL_H * PG.W);
  else { ctx.fillStyle = "#08090b"; ctx.fillRect(-w.len / 2, -w.wid / 2, w.len, w.wid); }
  const comp = t.old ? cr.oldComp : cr.newComp;
  if (comp && COMP[comp]) {
    ctx.strokeStyle = COMP[comp].col; ctx.globalAlpha = t.old ? 0.55 : 0.95; ctx.lineWidth = 0.11;
    ctx.beginPath(); ctx.moveTo(-w.len * 0.36, -w.wid * 0.36); ctx.lineTo(w.len * 0.36, -w.wid * 0.36); ctx.moveTo(-w.len * 0.36, w.wid * 0.36); ctx.lineTo(w.len * 0.36, w.wid * 0.36); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
function drawCrews(layer) {                                     // 0: shadows and jacks (under the car), 1: mechanics, 2: overhead hoses, lollipop
  if (!CREWS) return;
  for (const cr of CREWS) {
    if (cr.mech.every(m => m.inside)) continue;
    const F = crewFrame(cr);
    if (F.x + 30 < VIEWB.x0 || F.x - 30 > VIEWB.x1 || F.y + 30 < VIEWB.y0 || F.y - 30 > VIEWB.y1) continue;
    ctx.save();
    ctx.beginPath();                                            // the garage roof hides whoever is inside
    [[-16, -16], [16, -16], [16, PG.FRONT], [-16, PG.FRONT]].forEach(([X, Y], k) => { const [x, y] = bw(F, X, Y); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath(); ctx.clip();
    const [suit, acc, helm] = cr.col, dark = crewShade(suit, -0.38);
    for (const m of cr.mech) {
      if (m.inside) continue;
      const bx = m.x + m.dx, by = m.y + m.dy, [x, y] = bw(F, bx, by), a = bwa(F, m.a), fx = Math.cos(a), fy = Math.sin(a), rx = -fy, ry = fx;
      const jit = m.buzz ? (Math.random() - 0.5) * m.buzz : 0;
      if (layer === 0) {
        ctx.globalAlpha = 0.34 * SUNK; ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.ellipse(x + 0.26, y + 0.4, 0.64, 0.46, a + Math.PI / 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        if (m.jack) {                                           // lever from the hands to the lifting pad under the nose / gearbox
          const [jx, jy] = bw(F, m.jack[0] + m.dx, m.jack[1] + m.dy), hx = x + fx * 0.45, hy = y + fy * 0.45, ja = Math.atan2(jy - hy, jx - hx);
          ctx.strokeStyle = "#202327"; ctx.lineWidth = 0.22; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(jx, jy); ctx.stroke();
          ctx.strokeStyle = acc; ctx.lineWidth = 0.26; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(ja) * 0.35, hy + Math.sin(ja) * 0.35); ctx.stroke();
          ctx.save(); ctx.translate(jx, jy); ctx.rotate(ja);
          ctx.fillStyle = "#15171a"; ctx.fillRect(-0.2, -0.85, 0.42, 1.7);
          ctx.fillStyle = "#3b4048"; ctx.fillRect(-0.12, -0.75, 0.26, 1.5);
          ctx.fillStyle = "#0b0c0e"; ctx.fillRect(-0.55, -0.62, 0.3, 0.22); ctx.fillRect(-0.55, 0.4, 0.3, 0.22);
          ctx.restore();
        }
        continue;
      }
      if (layer === 2) {
        if (m.role === "gun" && m.gx != null) {                 // air line up to the overhead gantry
          const [ax, ay] = bw(F, m.X, 6.4), mx2 = (m.gx + ax) / 2 + rx * 0.4, my2 = (m.gy + ay) / 2 + ry * 0.4;
          ctx.strokeStyle = "#0a0b0d"; ctx.globalAlpha = 0.9; ctx.lineWidth = 0.13; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(m.gx, m.gy); ctx.quadraticCurveTo(mx2, my2, ax, ay); ctx.stroke(); ctx.globalAlpha = 1;
        }
        if (m.lolly) {
          const [lx, ly] = bw(F, m.lolly[0] + m.dx, m.lolly[1] + m.dy);
          ctx.strokeStyle = "#d9dde2"; ctx.lineWidth = 0.09; ctx.beginPath(); ctx.moveTo(x + fx * 0.35, y + fy * 0.35); ctx.lineTo(lx, ly); ctx.stroke();
          ctx.fillStyle = m.lolly[2] ? "#22d38a" : "#e10600"; ctx.beginPath(); ctx.arc(lx, ly, 0.5, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#f4f5f2"; ctx.lineWidth = 0.09; ctx.stroke();
        }
        continue;
      }
      // legs: running stride, a knee down at the wheel, or crouched
      const walk = Math.min(1, m.speed / 2.4), sw = Math.sin(m.ph) * 0.36 * walk;
      const leg = (cx, cy, l, w) => { ctx.beginPath(); ctx.ellipse(cx, cy, l / 2, w / 2, a, 0, Math.PI * 2); ctx.fill(); };
      ctx.fillStyle = dark;
      if (m.cur === "kneel") { leg(x + fx * 0.42 + rx * 0.2, y + fy * 0.42 + ry * 0.2, 0.52, 0.24); leg(x - fx * 0.38 - rx * 0.17, y - fy * 0.38 - ry * 0.17, 0.48, 0.22); }
      else if (m.cur === "crouch") { leg(x + fx * 0.34 + rx * 0.22, y + fy * 0.34 + ry * 0.22, 0.44, 0.23); leg(x + fx * 0.34 - rx * 0.22, y + fy * 0.34 - ry * 0.22, 0.44, 0.23); }
      else { leg(x + fx * sw + rx * 0.18, y + fy * sw + ry * 0.18, 0.4, 0.22); leg(x - fx * sw - rx * 0.18, y - fy * sw - ry * 0.18, 0.4, 0.22); }
      if (m.carry) drawCrewTyre(cr, F, { ...m.carry, x: m.carry.x + m.dx, y: m.carry.y + m.dy }, m.w);
      // body
      ctx.fillStyle = suit; ctx.beginPath(); ctx.ellipse(x, y, 0.5, 0.31, a + Math.PI / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = acc;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + rx * 0.36 * sd - fx * 0.02, y + ry * 0.36 * sd - fy * 0.02, 0.15, 0.13, a, 0, Math.PI * 2); ctx.fill(); }
      // arms and gloves
      let hands;
      if (m.hands) { const [hx, hy] = bw(F, m.hands[0] + m.dx + jit, m.hands[1] + m.dy + jit); hands = [[hx + rx * 0.17, hy + ry * 0.17], [hx - rx * 0.17, hy - ry * 0.17]]; }
      else { const s2 = sw * 0.7; hands = [[x + fx * (0.34 - s2) + rx * 0.4, y + fy * (0.34 - s2) + ry * 0.4], [x + fx * (0.34 + s2) - rx * 0.4, y + fy * (0.34 + s2) - ry * 0.4]]; }
      ctx.strokeStyle = suit; ctx.lineWidth = 0.21; ctx.lineCap = "round"; ctx.beginPath();
      hands.forEach(([hx, hy], k) => {
        const sd = k ? -1 : 1, sx = x + rx * 0.37 * sd, sy = y + ry * 0.37 * sd;
        let dx = hx - sx, dy = hy - sy; const l = Math.hypot(dx, dy); if (l > 1.1) { dx *= 1.1 / l; dy *= 1.1 / l; }
        ctx.moveTo(sx, sy); ctx.lineTo(sx + dx, sy + dy); hands[k] = [sx + dx, sy + dy];
      });
      ctx.stroke();
      ctx.fillStyle = "#0b0c0e"; for (const [hx, hy] of hands) { ctx.beginPath(); ctx.arc(hx, hy, 0.11, 0, Math.PI * 2); ctx.fill(); }
      m.gx = null;
      if (m.role === "gun") {                                   // the wheel gun, held in both hands
        const gx = (hands[0][0] + hands[1][0]) / 2, gy = (hands[0][1] + hands[1][1]) / 2;
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(a); ctx.fillStyle = "#2c3036"; ctx.fillRect(-0.18, -0.13, 0.5, 0.26); ctx.fillStyle = acc; ctx.fillRect(0.22, -0.09, 0.14, 0.18); ctx.restore();
        m.gx = gx - fx * 0.15; m.gy = gy - fy * 0.15;
      }
      // helmet with visor and a glint of sun
      const hx = x + fx * 0.05, hy = y + fy * 0.05;
      ctx.fillStyle = helm; ctx.beginPath(); ctx.arc(hx, hy, 0.29, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#0c0e10"; ctx.lineWidth = 0.12; ctx.beginPath(); ctx.arc(hx, hy, 0.21, a - 0.95, a + 0.95); ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(hx - 0.1, hy - 0.11, 0.07, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}
// pit camera: at ×1 the stop of the followed car is shown in real time (the race clock normally runs at ×2 on screen)
// and the camera closes in on the box, then goes back to where it was
const PIT_ZOOM = 2.2;
const PITCAM = { k: 0, z0: null, user: false };
function pitCamWant() {
  if (SES || !follow || speedIdx !== 0 || replay || MENU.step || paused) return false;   // practice / qualifying: the camera keeps its zoom
  const c = cars[focus], P = c && c.pit;
  if (!P) return false;
  const bd = PIT.boxes[c.box].d;
  if (P.stopT > 0 || (P.served && !P.released)) return true;
  return !P.served ? P.d > bd - 70 : P.d < bd + 30;
}
function pitCamStep(dt) {
  const want = pitCamWant();
  PITCAM.k += ((want ? 1 : 0) - PITCAM.k) * Math.min(1, dt * 2.4);
  if (!want && PITCAM.k < 0.02) { if (PITCAM.z0 != null) { cam.zoom = PITCAM.z0; PITCAM.z0 = null; } PITCAM.k = 0; PITCAM.user = false; return; }
  if (want && PITCAM.z0 == null && !PITCAM.user) PITCAM.z0 = cam.zoom;
  if (PITCAM.z0 != null) { const tgt = Math.max(PITCAM.z0, PIT_ZOOM), e = pEase(PITCAM.k); cam.zoom = PITCAM.z0 + (tgt - PITCAM.z0) * e; }
}

// ---------- light and shade: one sun for everything (top-left, shadows fall to the bottom-right like the cars') ----------
// shadows.png: what the stands, the trees, the pit building and its wall, the race control tower, the footbridges and the
// paddock buildings cast on the ground, worked out from their height. It fades as the clouds cover the sun.
const SHADE_IMG = new Image();   // not loaded: the circuit image already has its own shadows and is shown with its own colours
// only the cells of a layer that hold something are drawn: most of the map has no shadow, and no rubber
const CELL = 96;
function drawCells(src, cells, S, x0, y0, x1, y1) {
  for (const k of cells) {
    const cx = (k % 64) * CELL, cy = Math.floor(k / 64) * CELL;
    if (cx > x1 || cx + CELL < x0 || cy > y1 || cy + CELL < y0) continue;
    const w = Math.min(CELL, MAP_W - cx), h = Math.min(CELL, MAP_H - cy);
    ctx.drawImage(src, cx * S, cy * S, w * S, h * S, cx, cy, w, h);
  }
}
SHADE_IMG.addEventListener("load", () => {
  try {
    const c = mkCanvas(MAP_W, MAP_H), g = c.getContext("2d"); g.drawImage(SHADE_IMG, 0, 0); const d = g.getImageData(0, 0, MAP_W, MAP_H).data, cells = [];
    for (let cy = 0; cy < MAP_H; cy += CELL) for (let cx = 0; cx < MAP_W; cx += CELL) {
      let any = false;
      for (let y = cy; y < Math.min(MAP_H, cy + CELL) && !any; y += 2) for (let x = cx; x < Math.min(MAP_W, cx + CELL); x += 2) if (d[(y * MAP_W + x) * 4 + 3] > 6) { any = true; break; }
      if (any) cells.push(Math.floor(cy / CELL) * 64 + cx / CELL);
    }
    SHADE_IMG.cells = cells;
  } catch (e) { SHADE_IMG.cells = null; }
});
function drawStaticShade(x0, y0, x1, y1) {
  if (!SHADE_IMG.complete || !SHADE_IMG.naturalWidth || x1 <= x0 || y1 <= y0) return;
  ctx.globalAlpha = Math.max(0, SUNK * 1.05 - 0.05);
  if (SHADE_IMG.cells) drawCells(SHADE_IMG, SHADE_IMG.cells, 1, x0, y0, x1, y1);
  else ctx.drawImage(SHADE_IMG, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  ctx.globalAlpha = 1;
}
// cloud shadows sliding over the circuit with the wind (sun and clouds: neither clear sky nor fully overcast)
const CLOUDS = (() => {
  const n = 128, f = new Float32Array(n * n), r = rng(7);
  const oct = [[8, 1], [16, 0.5], [32, 0.25], [64, 0.12]];
  for (const [g, w] of oct) {                         // tileable value noise, smoothly interpolated
    const v = new Float32Array(g * g); for (let k = 0; k < v.length; k++) v[k] = r();
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const fx = x / n * g, fy = y / n * g, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), V = (a, b) => v[((b % g) * g) + (a % g)];
      const a = V(x0, y0) + (V(x0 + 1, y0) - V(x0, y0)) * sx, b = V(x0, y0 + 1) + (V(x0 + 1, y0 + 1) - V(x0, y0 + 1)) * sx;
      f[y * n + x] += (a + (b - a) * sy) * w;
    }
  }
  let lo = Infinity, hi = -Infinity; for (const x of f) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
  const sorted = Float32Array.from(f).sort();
  for (let k = 0; k < f.length; k++) f[k] = (f[k] - lo) / (hi - lo);
  return { n, f, q: p => (sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] - lo) / (hi - lo), cache: new Map(), ox: 0, oy: 0 };
})();
function cloudPattern(cover) {
  const key = Math.round(cover * 20); let p = CLOUDS.cache.get(key); if (p) return p;
  const n = CLOUDS.n, c = mkCanvas(n, n), g = c.getContext("2d"), img = g.createImageData(n, n), th = CLOUDS.q(1 - key / 20);
  for (let k = 0; k < n * n; k++) { const u = (CLOUDS.f[k] - th) / 0.09, a = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u); img.data[k * 4 + 3] = a * 255; img.data[k * 4] = 6; img.data[k * 4 + 1] = 10; img.data[k * 4 + 2] = 22; }
  g.putImageData(img, 0, 0); p = ctx.createPattern(c, "repeat"); CLOUDS.cache.set(key, p); return p;
}
function cloudStep(simDt) {                            // the clouds drift with the wind, at race speed
  const wa = WXC.dir * Math.PI / 180 + Math.PI, v = (5 + 1.6 * WXC.wind) / M_PER_PX;
  CLOUDS.ox += Math.cos(wa) * v * simDt; CLOUDS.oy += Math.sin(wa) * v * simDt;
}
function drawCloudShadows() {
  const cl = WXC.cloud, sun = 1 - Math.min(1, Math.max(0, (cl - 78) / 16));          // no sun, no shadows
  const cover = Math.min(0.85, Math.max(0, (cl - 12) / 85));
  if (cover < 0.04 || sun < 0.03 || !window.DOMMatrix) return;
  const p = cloudPattern(cover), sc = 14;              // one texel = 14 map px: clouds ~ a few hundred metres across
  p.setTransform(new DOMMatrix().translate(CLOUDS.ox % (CLOUDS.n * sc), CLOUDS.oy % (CLOUDS.n * sc)).scale(sc));
  ctx.globalAlpha = 0.3 * sun; ctx.fillStyle = p;
  ctx.fillRect(VIEWB.x0, VIEWB.y0, VIEWB.x1 - VIEWB.x0, VIEWB.y1 - VIEWB.y0); ctx.globalAlpha = 1;
}
// ---------- the cars: body roll and pitch, wake on the straights, floor sparks ----------
function stepBody(c, h) {                              // smoothed longitudinal and lateral g, for the body movement
  if (h <= 0) return;
  const v = c.vNow || 0, dv = (v - (c.bV == null ? v : c.bV)) / h; c.bV = v;
  const yaw = c.bH == null ? 0 : Math.atan2(Math.sin(c.head - c.bH), Math.cos(c.head - c.bH)) / h; c.bH = c.head;
  const k = Math.min(1, h * 7), lon = Math.max(-1, Math.min(1, dv / (G * 4.5))), lat = Math.max(-1, Math.min(1, v * yaw / (G * 4.5)));
  c.bLong = (c.bLong || 0) + (lon - (c.bLong || 0)) * k; c.bLat = (c.bLat || 0) + (lat - (c.bLat || 0)) * k;
}
// body offset over its wheels/shadow (map px, car frame): nose dives under braking, the body rolls to the outside of a turn
const bodyShift = c => [-(c.bLong || 0) * 0.42, -(c.bLat || 0) * 0.5, (c.bLat || 0) * 0.035];
function drawWakes(vis) {                              // air streaming off the rear wing tips at speed, on a dry track
  const dryK = 1 - Math.min(1, WATER.W * 3);
  if (dryK <= 0.02) return;
  const L = CAR_LEN_M / M_PER_PX, Wd = CAR_W_M / M_PER_PX;
  ctx.lineCap = "round";
  for (const { c, p, head } of vis) {
    const v = c.vNow || 0; if (v < 58 || c.pit || c.inc) continue;
    const k = Math.min(1, (v - 58) / 26) * dryK, len = L * (0.7 + 1.1 * k), ch = Math.cos(head), sh = Math.sin(head);
    for (const b of [-0.43, 0, 0.43]) {
      const x0 = p.x - ch * L * 0.5 - sh * b * Wd, y0 = p.y - sh * L * 0.5 + ch * b * Wd, x1 = x0 - ch * len * (b ? 1 : 0.65), y1 = y0 - sh * len * (b ? 1 : 0.65);
      const gr = ctx.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, `rgba(235,242,250,${((b ? 0.34 : 0.16) * k).toFixed(3)})`); gr.addColorStop(1, "rgba(235,242,250,0)");
      ctx.strokeStyle = gr; ctx.lineWidth = b ? 0.32 : 0.9; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
  }
}
const SPARK_GLOW = (() => { const c = mkCanvas(32, 32), g = c.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,226,140,1)"); gr.addColorStop(0.3, "rgba(255,150,40,.55)"); gr.addColorStop(1, "rgba(255,90,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return c; })();
function drawSparkGlow(vis) {                          // the floor scraping the asphalt lights up the ground under the car
  ctx.globalCompositeOperation = "lighter";
  const L = CAR_LEN_M / M_PER_PX;
  for (const { c, p, head } of vis) {
    if (!c.spark) continue;
    const fl = 0.55 + 0.45 * Math.random(), x = p.x - Math.cos(head) * L * 0.36, y = p.y - Math.sin(head) * L * 0.36, r = L * 0.42 * fl;
    ctx.globalAlpha = 0.55 * fl; ctx.drawImage(SPARK_GLOW, x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
}
// ---------- rubber laid on the racing line during the race, and marbles off it ----------
var RUB = { S: 0.5, cv: null, g: null, marb: null, nm: 0, shown: 0, q: [], tf: 0 };
function rubberReset() {
  if (!RUB.cv) {
    RUB.cv = mkCanvas(Math.round(MAP_W * RUB.S), Math.round(MAP_H * RUB.S)); RUB.g = RUB.cv.getContext("2d");
    const set = new Set();                              // the cells the racing surface runs through (rubber lands only there)
    for (let i = 0; i < N; i++) for (const off of [-24, 0, 24]) { const [x, y] = trackPoint(i, off); if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) set.add(Math.floor(y / CELL) * 64 + Math.floor(x / CELL)); }
    RUB.cells = [...set];
  }
  const g = RUB.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, RUB.cv.width, RUB.cv.height); g.setTransform(RUB.S, 0, 0, RUB.S, 0, 0);
  // what practice and qualifying left: a faint grey line, darker where the cars brake
  const r = rng(11), Wd = CAR_W_M / M_PER_PX;
  for (let pass = 0; pass < 26; pass++) {
    const jit = (r() - 0.5) * 1.6;
    for (const b of [-0.4, 0.4]) {
      g.beginPath();
      for (let i = 0; i <= N; i += 2) { const k = i % N, [x, y] = trackPoint(k, b * Wd + jit + Math.sin(k * 0.05 + pass) * 0.6); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.strokeStyle = "rgba(22,22,24,0.022)"; g.lineWidth = 1.5; g.stroke();
    }
  }
  for (let i = 0; i < N; i++) if (accel[i] < -12) {                // braking zones: more rubber
    const a = Math.min(1, -accel[i] / 40);
    for (const b of [-0.4, 0.4]) { const [x, y] = trackPoint(i, b * Wd); g.fillStyle = `rgba(18,18,20,${(0.05 * a).toFixed(3)})`; g.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); }
  }
  // marbles: bits of rubber thrown off the tyres, swept off the line to the outside of the corners
  if (!RUB.marb) {
    const m = [], rr = rng(23); let tries = 0;
    while (m.length < 5200 * 3 && tries++ < 60000) {
      const i = (rr() * N) | 0; if (LATG[i] < 1.6 || rr() > (LATG[i] - 1.4) / 3.2) continue;
      const j = (i + 6 + ((rr() * 34) | 0)) % N, side = rr() < 0.85 ? turnOut[i] : -turnOut[i], e = (side > 0 ? LIM.eP[j] : LIM.eM[j]) * M_PER_PX;
      if (e < 3.4) continue;
      const cl = 2 + ((rr() * 6) | 0), off = 2.5 + Math.pow(rr(), 0.55) * (e - 2.9), th = rr();     // a little cluster, unveiled as the race goes on
      for (let k = 0; k < cl; k++) { const [x, y] = trackPoint(j, side * (off + (rr() - 0.5) * 0.9) / M_PER_PX); m.push(x + (rr() - 0.5) * 2.2, y + (rr() - 0.5) * 2.2, Math.min(1, th + rr() * 0.04)); }
    }
    const idx = [...Array(m.length / 3).keys()].sort((a, b) => m[a * 3 + 2] - m[b * 3 + 2]);
    RUB.marb = new Float32Array(m.length); idx.forEach((o, k) => { RUB.marb[k * 3] = m[o * 3]; RUB.marb[k * 3 + 1] = m[o * 3 + 1]; RUB.marb[k * 3 + 2] = m[o * 3 + 2]; });
    RUB.nm = idx.length;
  }
  RUB.shown = 0; RUB.q.length = 0;
}
function rubberStep(c) {                               // every few metres, a touch of rubber under the rear wheels
  if (!RUB.cv || c.pit || c.gar || c.done || !c.started || c.inc) { c.rubP = null; return; }
  const q = carPos(c); if (c.rubP && (q.x - c.rubP.x) ** 2 + (q.y - c.rubP.y) ** 2 < 9) return;
  c.rubP = { x: q.x, y: q.y };
  const i = idxAt(c.s), br = accel[i] < -8 ? Math.min(1, -accel[i] / 35) : 0, corner = Math.min(1, LATG[i] / 4);
  if (Math.random() > 0.16 + 0.5 * br + 0.2 * corner) return;
  const hd = dispHead(c), L = CAR_LEN_M / M_PER_PX, Wd = CAR_W_M / M_PER_PX, ch = Math.cos(hd), sh = Math.sin(hd);
  for (const b of [-0.4, 0.4]) RUB.q.push(q.x - ch * 0.36 * L - sh * b * Wd, q.y - sh * 0.36 * L + ch * b * Wd, br > 0.3 ? 1 : 0);
}
function rubberFlush() {                               // the rubber canvas is touched only every couple of seconds (cheap to draw)
  const q = RUB.q, g = RUB.g; RUB.tf = performance.now(); if (!q.length) return;
  for (const hard of [0, 1]) {
    g.fillStyle = hard ? "rgba(16,16,18,0.042)" : "rgba(16,16,18,0.02)"; g.beginPath();
    for (let k = 0; k < q.length; k += 3) if (q[k + 2] === hard) g.rect(q[k] - 1, q[k + 1] - 1, 2, 2);
    g.fill();
  }
  q.length = 0;
}
function drawRubber(x0, y0, x1, y1) {
  if (!RUB.cv || x1 <= x0 || y1 <= y0) return;
  if (performance.now() - RUB.tf > 2500 || RUB.q.length > 6000) rubberFlush();
  const S = RUB.S, a = Math.floor(x0 * S), b = Math.floor(y0 * S), c2 = Math.ceil(x1 * S), d2 = Math.ceil(y1 * S);
  ctx.imageSmoothingQuality = "low"; ctx.globalAlpha = 0.78; drawCells(RUB.cv, RUB.cells, S, x0, y0, x1, y1); ctx.globalAlpha = 1; ctx.imageSmoothingQuality = "high";   // never quite black; low-quality filtering: no mipmaps rebuilt every frame
}
function drawMarbles() {
  if (!RUB.marb) return;
  let run = 0; for (const c of cars) run += Math.max(0, lapsRun(c));
  const frac = Math.min(1, run / (cars.length * Math.max(1, RACE_LAPS))), want = Math.floor(RUB.nm * Math.min(1, 0.06 + frac * 1.05));
  const M = RUB.marb, x0 = VIEWB.x0, x1 = VIEWB.x1, y0 = VIEWB.y0, y1 = VIEWB.y1, s = 0.55;
  ctx.fillStyle = "#17171a"; ctx.globalAlpha = 0.85; ctx.beginPath();
  for (let k = 0; k < want; k++) { const x = M[k * 3], y = M[k * 3 + 1]; if (x < x0 || x > x1 || y < y0 || y > y1) continue; ctx.rect(x, y, s, s); }
  ctx.fill(); ctx.globalAlpha = 1;
}

// ---------- marshals waving real flags at every post ----------
// yellow before an incident (double yellow for a crash), green where the danger has gone, blue for a car about to be
// lapped, yellow with the SC board under the safety car, red for a red flag; at the line, the chequered flag
const POSTS = AMB_DATA.posts.map(([x, y], k) => {            // the marshals' posts of the plan, each facing its stretch of track
  let bi = 0, bd = Infinity; for (let i = 0; i < N; i++) { const d = (RL.x[i] - x) ** 2 + (RL.y[i] - y) ** 2; if (d < bd) { bd = d; bi = i; } }
  const dx = x - RL.x[bi], dy = y - RL.y[bi], l = Math.hypot(dx, dy) || 1;
  return { k, x, y, nx: dx / l, ny: dy / l, s: cum[bi], st: "none", green: 0, ph: k * 1.7, turn: 0 };
});
const FINISH = (() => {                                 // chequered-flag marshal on the pit wall, level with the line
  const p = sample(0), hd = heading(0), nx = -Math.sin(hd), ny = Math.cos(hd);
  const side = ((PIT.boxes[0].x - p.x) * nx + (PIT.boxes[0].y - p.y) * ny) > 0 ? 1 : -1;
  const off = (side > 0 ? LIM.eP[0] : LIM.eM[0]) + 3.2;
  return { x: p.x + nx * side * off, y: p.y + ny * side * off, nx: -nx * side, ny: -ny * side, on: false };
})();
function marshalStep(dt) {
  const red = typeof RED_FLAG !== "undefined" && RED_FLAG, sc = scActive();
  const live = cars.filter(c => !c.done && c.started);
  for (const P of POSTS) {
    let st = "none";
    if (red) st = "red";
    else {
      for (const c of cars) if (c.inc && !c.fin) { const d = sgap(c.s - P.s); if (d > -30 && d < 420) { st = c.inc.crashed ? "yy" : "y"; if (st === "yy") break; } }
      if (st === "none" && sc) st = "sc";
      if (st === "none") {                                // blue: a car near the post with the leader of a lap ahead right behind it
        for (const c of live) { const d = sgap(c.s - P.s); if (d < -40 || d > 120) continue;
          if (live.some(o => o !== c && o.lap > c.lap && (g => g > 0 && g < 70)(sgap(c.s - o.s)))) { st = "blue"; break; } }
      }
    }
    if ((P.st === "y" || P.st === "yy" || P.st === "sc") && st !== P.st && (st === "none" || st === "blue")) P.green = 5;
    if (P.green > 0) { P.green -= dt; if (st === "none") st = "green"; }
    P.st = st;
  }
  const cp = cars.filter(c => !c.gone && !c.done && (c.started || c.pit) && !c.gar).map(c => carPos(c));
  for (const P of POSTS) {                              // turn to watch the nearest car going past
    const face = Math.atan2(-P.ny, -P.nx); let want = 0, bd = 150 * 150;
    for (const p of cp) { const dx = p.x - P.x, dy = p.y - P.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; let a = Math.atan2(dy, dx) - face; a = Math.atan2(Math.sin(a), Math.cos(a)); want = Math.max(-1.1, Math.min(1.1, a)); } }
    P.turn += (want - P.turn) * Math.min(1, dt * 3);
  }
  FINISH.on = FIN_N > 0 || (cars.some(c => !c.done) && raceOrder()[0] && raceOrder()[0].lap >= RACE_LAPS && raceOrder()[0].s > LAP_M - 500);
}
const FLAGS = { y: ["#ffd21f"], yy: ["#ffd21f"], sc: ["#ffd21f"], green: ["#1fbf4a"], blue: ["#1f6fff"], red: ["#e8102a"] };
function drawFlagCloth(x, y, ang, t, ph, cols, chk, size) {        // a flag on a short pole, swung and rippling
  const Lf = 2.3 * size, Hf = 1.6 * size, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const pt = (u, v) => { const w = Math.sin(u * 4.4 - t * 10 - ph) * 0.22 * size * u; return [x + dx * Lf * u + nx * (Hf * (v - 0.5) + w), y + dy * Lf * u + ny * (Hf * (v - 0.5) + w)]; };
  const U = [0, 0.25, 0.5, 0.75, 1];
  const quadF = (u0, u1, v0, v1, col) => { const q = [pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1)]; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (let k = 1; k < 4; k++) ctx.lineTo(q[k][0], q[k][1]); ctx.fill(); };
  if (chk) { for (let a = 0; a < 6; a++) for (let b = 0; b < 4; b++) quadF(a / 6, (a + 1) / 6, b / 4, (b + 1) / 4, (a + b) % 2 ? "#111214" : "#f4f5f2"); }
  else { for (let a = 0; a < 4; a++) quadF(U[a], U[a + 1], 0, 1, cols[0]); }
  ctx.strokeStyle = "#2a2a2a"; ctx.lineWidth = 0.14; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(...pt(0, 1.05)); ctx.stroke();
}
function drawMarshalFig(x, y, face, t, st, ph, chk) {             // orange overalls, cap, arms up holding the flag
  ctx.save(); ctx.translate(x, y); ctx.scale(MARSHAL_K, MARSHAL_K); ctx.translate(-x, -y);   // drawn at the cars' exaggerated scale
  drawMarshalBody(x, y, face, t, st, ph, chk); ctx.restore();
}
const MARSHAL_K = 1.9;
function drawMarshalBody(x, y, face, t, st, ph, chk) {
  const fx = Math.cos(face), fy = Math.sin(face), rx = -fy, ry = fx;
  ctx.globalAlpha = 0.32 * SUNK; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(x + 0.3, y + 0.45, 0.62, 0.45, face + Math.PI / 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = "#ff7a1a"; ctx.beginPath(); ctx.ellipse(x, y, 0.52, 0.32, face + Math.PI / 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.fillRect(x - rx * 0.5 - 0.06, y - ry * 0.5 - 0.06, 0.12, 0.12);
  ctx.fillStyle = "#f2c9a0"; ctx.beginPath(); ctx.arc(x + fx * 0.05, y + fy * 0.05, 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ff8c2e"; ctx.beginPath(); ctx.arc(x - fx * 0.04, y - fy * 0.04, 0.24, face + 1.2, face - 1.2 + Math.PI * 2); ctx.fill();
  if (st === "none") {                                  // flag furled, resting on the shoulder
    ctx.strokeStyle = "#3a3a3a"; ctx.lineWidth = 0.14; ctx.beginPath(); ctx.moveTo(x + rx * 0.3, y + ry * 0.3); ctx.lineTo(x + rx * 0.5 - fx * 1.3, y + ry * 0.5 - fy * 1.3); ctx.stroke();
    return;
  }
  const wave = st === "y" || st === "yy" || st === "blue" || st === "green" || chk ? Math.sin(t * (st === "yy" || chk ? 9 : 6.5) + ph) : 0.15;
  const ang = face + Math.PI * 0.5 + wave * 0.9;
  const hx = x + fx * 0.35, hy = y + fy * 0.35;
  ctx.strokeStyle = "#ff7a1a"; ctx.lineWidth = 0.2; ctx.beginPath(); ctx.moveTo(x + rx * 0.3, y + ry * 0.3); ctx.lineTo(hx, hy); ctx.moveTo(x - rx * 0.3, y - ry * 0.3); ctx.lineTo(hx, hy); ctx.stroke();
  drawFlagCloth(hx, hy, ang, t, ph, FLAGS[st] || FLAGS.y, chk, chk ? 1.25 : 1);
  if (st === "yy") drawFlagCloth(hx - fx * 0.2, hy - fy * 0.2, face - Math.PI * 0.5 - wave * 0.9, t, ph + 2, FLAGS.y, false, 1);
}
function drawMarshals() {
  const t = performance.now() / 1000;
  for (const P of POSTS) {
    if (P.x < VIEWB.x0 || P.x > VIEWB.x1 || P.y < VIEWB.y0 || P.y > VIEWB.y1) continue;
    const face = Math.atan2(-P.ny, -P.nx) + (P.st === "none" ? P.turn : P.turn * 0.35);
    drawMarshalFig(P.x, P.y, face, t, P.st, P.ph, false);
    if (P.st === "sc") {                                 // a second marshal with the SC board
      const bx = P.x - P.ny * 3.6, by = P.y + P.nx * 3.6;
      drawMarshalFig(bx, by, face, t, "none", P.ph, false);
      ctx.save(); ctx.translate(bx - P.nx * 1.7, by - P.ny * 1.7); ctx.rotate(-cam.rot); ctx.scale(MARSHAL_K, MARSHAL_K);   // the board faces the camera
      ctx.fillStyle = "#f4f5f2"; ctx.fillRect(-1.1, -0.75, 2.2, 1.5); ctx.strokeStyle = "#111"; ctx.lineWidth = 0.12; ctx.strokeRect(-1.1, -0.75, 2.2, 1.5);
      ctx.fillStyle = "#111"; ctx.font = `800 1.05px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("SC", 0, 0.05); ctx.restore();
    }
  }
  if (FINISH.on && FINISH.x > VIEWB.x0 && FINISH.x < VIEWB.x1 && FINISH.y > VIEWB.y0 && FINISH.y < VIEWB.y1) {
    const face = Math.atan2(FINISH.ny, FINISH.nx);
    ctx.fillStyle = "#2b3038"; ctx.fillRect(FINISH.x - 2.4, FINISH.y - 2.4, 4.8, 4.8);         // the little podium over the wall
    ctx.fillStyle = "#3d444e"; ctx.fillRect(FINISH.x - 2.4, FINISH.y - 2.4, 4.8, 0.7);
    drawMarshalFig(FINISH.x, FINISH.y, face, t, FIN_N > 0 ? "y" : "none", 0, FIN_N > 0);
  }
}
// ---------- TV camera cranes at the corners, following the cars ----------
const CRANES = (() => {
  const out = [], picks = [0, 3, 6, 9, 12].filter(k => k < CORNER_S.length);
  for (const k of picks) {
    const i = idxAt(CORNER_S[k]), side = turnOut[i], e = side > 0 ? LIM.eP[i] : LIM.eM[i];
    for (let extra = 16; extra < 44; extra += 3) {
      const [x, y] = trackPoint(i, side * (e + extra));
      let ok = true; for (let j = 0; j < N; j += 3) { const d = (RL.x[j] - x) ** 2 + (RL.y[j] - y) ** 2; if (d < 26 * 26) { ok = false; break; } }
      if (ok) { out.push({ x, y, a: Math.atan2(RL.y[i] - y, RL.x[i] - x), len: 21, base: Math.atan2(RL.y[i] - y, RL.x[i] - x) }); break; }
    }
  }
  return out;
})();
function craneStep(dt) {
  for (const C of CRANES) {
    let best = null, bd = 110 * 110;
    for (const c of cars) { if (c.done || c.gone) continue; const p = carPos(c), d = (p.x - C.x) ** 2 + (p.y - C.y) ** 2; if (d < bd) { bd = d; best = p; } }
    const tgt = best ? Math.atan2(best.y - C.y, best.x - C.x) : C.base + Math.sin(performance.now() / 4000 + C.x) * 0.5;
    const da = Math.atan2(Math.sin(tgt - C.a), Math.cos(tgt - C.a)); C.a += Math.max(-1.6 * dt, Math.min(1.6 * dt, da * Math.min(1, dt * 3)));
  }
}
function drawCranes() {
  for (const C of CRANES) {
    if (C.x + 30 < VIEWB.x0 || C.x - 30 > VIEWB.x1 || C.y + 30 < VIEWB.y0 || C.y - 30 > VIEWB.y1) continue;
    const ca = Math.cos(C.a), sa = Math.sin(C.a), hx = C.x + ca * C.len, hy = C.y + sa * C.len, bx = C.x - ca * C.len * 0.32, by = C.y - sa * C.len * 0.32;
    ctx.globalAlpha = 0.35 * SUNK; ctx.strokeStyle = "#000"; ctx.lineWidth = 1.1; ctx.lineCap = "round";     // arm ~6 m up
    ctx.beginPath(); ctx.moveTo(bx + 4.5, by + 7); ctx.lineTo(hx + 4.5, hy + 7); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = "#30353d"; ctx.fillRect(C.x - 2.4, C.y - 2.4, 4.8, 4.8);                    // base
    ctx.fillStyle = "#4a515b"; ctx.fillRect(C.x - 2.4, C.y - 2.4, 4.8, 0.8);
    ctx.strokeStyle = "#5b636e"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = "#8e98a3"; ctx.lineWidth = 0.18; ctx.beginPath(); ctx.moveTo(bx - sa * 0.15, by + ca * 0.15); ctx.lineTo(hx - sa * 0.15, hy + ca * 0.15); ctx.stroke();
    ctx.save(); ctx.translate(bx, by); ctx.rotate(C.a); ctx.scale(1.6, 1.6); ctx.fillStyle = "#ffd21f"; ctx.fillRect(-1, -0.9, 1.6, 1.8); ctx.fillStyle = "#14110a";
    for (let k = 0; k < 3; k++) ctx.fillRect(-1 + k * 0.6, -0.9, 0.25, 1.8); ctx.restore();                       // counterweight
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(C.a); ctx.scale(1.7, 1.7); ctx.fillStyle = "#0e1013"; ctx.fillRect(-0.6, -0.55, 1.6, 1.1);   // camera head
    ctx.fillStyle = "#6fb6ff"; ctx.fillRect(0.9, -0.2, 0.25, 0.4); ctx.fillStyle = "#e10600"; ctx.fillRect(-0.45, -0.4, 0.22, 0.22); ctx.restore();
  }
}
// ---------- the garages during the sessions: closed under the pit-building roof ----------
// The garages are inside the building and cannot be seen. Sending a car out, one mechanic walks out to the red line in
// front of the box, looks up the pit lane and, when it is clear, waves the car out of the garage. Coming back, the car
// stops on its yellow box; five mechanics come out, take the nose, the sidepods and the gearbox and push it back in.
const PIT_ROOF = { x0: 1443, x1: 1917, y0: 989, y1: 1024.5 };     // the pit building (map px): everything under it is hidden
const GC_DOOR = PG.FRONT + 1.6;                                   // just inside the garage door (box frame, under the roof)
const GC_RED = -4.1;                                              // the release man's spot: his toes on the red line
// push crew stations around the car: [along the car, across (+ = garage side), facing relative to the nose]
const GC_K = 1.7;                                                 // drawn a touch larger than life, like the marshals, to be seen
const GC_PUSH = [[PG.L2 + 0.95, 1.45, Math.PI], [PG.L2 + 0.95, -1.45, Math.PI], [0.04 * PG.L, PG.W2 + 1.2, -Math.PI / 2], [0.04 * PG.L, -PG.W2 - 1.2, Math.PI / 2], [-PG.L2 - 1.3, 0, 0]];
var GC = null;
const carPt = (p, a, b) => [p.x + Math.cos(p.h) * a - Math.sin(p.h) * b, p.y + Math.sin(p.h) * a + Math.cos(p.h) * b];
function gcMan(k, salt) { return { st: "in", x: 0, y: 0, a: 0, ph: k * 1.3, speed: 0, t: 0, wp: [], car: null, pace: 0.9 + fanRnd(k * 13 + salt, 6.1) * 0.2, dodge: 0, sx: 0 }; }
function gcReset() {
  GC = {};
  Object.keys(TEAMS).forEach((team, j) => { GC[team] = { F: crewFrame(CREW_BY_TEAM[team]), rel: gcMan(0, j * 7), push: [1, 2, 3, 4, 5].map(k => gcMan(k, j * 7)) }; });
}
function gcWalk(m, t, h, vmax) {                                    // a few steps towards t; true once there
  const dx = t[0] - m.x, dy = t[1] - m.y, d = Math.hypot(dx, dy);
  if (d < 0.1) { m.speed = 0; return true; }
  const v = Math.min(vmax * m.pace, 0.5 + d * 5), s = Math.min(d, v * h);
  m.x += dx / d * s; m.y += dy / d * s; m.speed = v; m.ph += s * 3.3;
  m.a = pLerpA(m.a, Math.atan2(dy, dx), Math.min(1, h * 10));
  return false;
}
const relOf = c => GC && GC[c.team] && GC[c.team].rel;
function relReady(c) {                                              // the release man has waved the car out
  const R = relOf(c);
  return !R || (R.car === c && R.st === "go" && R.t > 0.35);
}
function gcPushReady(c) { const g = GC && GC[c.team]; return !g || g.push.every(m => m.car === c && m.st === "ready"); }
function gcStep(h) {
  if (!GC) gcReset();
  for (const team in GC) {
    const g = GC[team], F = g.F, mine = cars.filter(c => c.team === team);
    // ---- the release man ----
    const R = g.rel;
    if (R.st === "in") {
      const c = mine.find(c => c.gar && c.gar.ph === "park" && c.goReq && !(c.work > 0));
      if (c) { R.sx = garSlot(c).X; [R.x, R.y] = bw(F, R.sx, GC_DOOR); R.a = bwa(F, -Math.PI / 2); R.car = c; R.st = "out"; R.t = 0; R.done = 0; }
    } else {
      const c = R.car, parked = c && c.gar && c.gar.ph === "park" && c.goReq;
      R.t += h;
      if (R.st === "out") {
        if (gcWalk(R, bw(F, R.sx - 7.5, GC_RED), h, 4.0)) { R.st = "look"; R.t = 0; }
        if (!parked) R.st = "home";
      } else if (R.st === "look") {
        R.a = pLerpA(R.a, bwa(F, Math.PI), Math.min(1, h * 6)); R.speed = 0;
        if (!parked) R.st = "home";
        else if (R.t > 0.7 && (c.goT || 0) > 2.0 && canLeave(c)) { R.st = "go"; R.t = 0; }
      } else if (R.st === "go") {
        R.a = pLerpA(R.a, bwa(F, Math.PI * 0.62), Math.min(1, h * 6)); R.speed = 0;
        if (c.gar && c.gar.ph === "park") { if (!c.goReq) R.st = "home"; else if (!canLeave(c)) { R.st = "look"; R.t = 0.5; } }
        else if (!c.gar || c.gar.ph !== "exit" || c.gar.u > c.gar.path.len * 0.8) { R.done += h; if (R.done > 0.7) R.st = "home"; }
      } else if (R.st === "home") {
        const nx = mine.find(o => o !== c && o.gar && o.gar.ph === "park" && o.goReq && !(o.work > 0));
        if (nx) { R.car = nx; R.sx = garSlot(nx).X; R.st = "out"; R.t = 0; R.done = 0; }   // the team-mate is next: straight back to the line
        else if (gcWalk(R, bw(F, R.sx, GC_DOOR), h, 3.0)) { R.st = "in"; R.car = null; }
      }
      // step back from the fast lane if a car comes past close
      let want = 0;
      for (const o of cars) {                                     // in the lane, or a neighbour driving out of its garage
        if (!(o.pit || (o.gar && o.gar.ph === "exit")) || (o.vNow || 0) < 0.3) continue;
        const p = carPos(o); if (Math.abs(p.x - R.x) > 20 || Math.abs(p.y - R.y) > 20) continue;
        const hd = dispHead(o), vx = Math.cos(hd), vy = Math.sin(hd), ox = R.x - p.x, oy = R.y - p.y, along = ox * vx + oy * vy, side = -ox * vy + oy * vx;
        if (along > -PG.L2 - 1 && along < PG.L2 + 4 && Math.abs(side) < PG.W2 + 1.7) want = Math.max(want, PG.W2 + 1.7 - Math.abs(side));
      }
      R.dodge += (Math.min(2.4, want) - R.dodge) * Math.min(1, h * 10);
    }
    // ---- the push crew ----
    const cs = mine.find(c => c.gar && (c.gar.ph === "stop" || c.gar.ph === "back"));
    g.push.forEach((m, k) => {
      if (!cs) { m.st = "in"; m.car = null; return; }             // the car is home: they are inside with it
      const G = cs.gar, pose = { x: G.x, y: G.y, h: cs.head }, S = GC_PUSH[k];
      const [tx, ty] = carPt(pose, S[0], S[1]), ta = pose.h + S[2];
      if (m.car !== cs) {                                           // the car has just stopped on its box: out of the door
        m.car = cs; m.st = "out"; m.t = -0.12 * k - fanRnd(k + cs.idx * 5, 4.2) * 0.3;
        const sx = garSlot(cs).X + (k - 2) * 1.15; [m.x, m.y] = bw(F, sx, GC_DOOR); m.a = bwa(F, -Math.PI / 2);
        const [da] = mbf(F, ...carPt(pose, 0, 0)), end = sx > da ? 1 : -1;   // round the end of the car nearest the door
        const near = (a, b) => carPt(pose, a, b), A = PG.L2 + 1.7, B = PG.W2 + 1.2;
        m.wp = k === 0 || k === 1 ? [near(A, B)] : k === 3 ? [near(end * A, B), near(end * A, -B)] : k === 4 ? [near(-A, B)] : [];
        if (G.ph === "back") { m.st = "ready"; m.wp = []; }
      }
      if (m.st === "out") {
        m.t += h; if (m.t < 0) return;
        if (gcWalk(m, m.wp.length ? m.wp[0] : [tx, ty], h, 4.5)) { if (m.wp.length) m.wp.shift(); else m.st = "ready"; }
        return;
      }
      if (G.ph === "back") {                                        // hands on the car, walking it back into the garage
        const d = Math.hypot(tx - m.x, ty - m.y); m.speed = d / Math.max(h, 1e-4); m.ph += d * 3.3;
        m.x = tx; m.y = ty; m.a = ta; m.st = "ready"; return;
      }
      m.x = tx; m.y = ty; m.speed = 0; m.a = pLerpA(m.a, ta, Math.min(1, h * 8));
    });
  }
}
// a mechanic in team kit, seen from above. o: { speed, ph, arm: world angle of an outstretched right arm, push: hands
// forward on the car, look: where the head turns }
function drawCrewman(x, y, a, col, o) {
  ctx.save(); ctx.translate(x, y); ctx.scale(GC_K, GC_K); ctx.translate(-x, -y);
  drawCrewBody(x, y, a, col, o); ctx.restore();
}
function drawCrewBody(x, y, a, col, o) {
  const [suit, acc, cap] = col, fx = Math.cos(a), fy = Math.sin(a), rx = -fy, ry = fx;
  const walk = Math.min(1, (o.speed || 0) / 2.2), sw = Math.sin(o.ph || 0) * 0.34 * walk;
  ctx.globalAlpha = 0.32 * SUNK; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(x + 0.26, y + 0.4, 0.62, 0.45, a + Math.PI / 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = fanShade(suit, -0.4);
  for (const s of [1, -1]) { ctx.beginPath(); ctx.ellipse(x + fx * sw * s + rx * 0.18 * s, y + fy * sw * s + ry * 0.18 * s, 0.21, 0.12, a, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = suit; ctx.beginPath(); ctx.ellipse(x, y, 0.5, 0.31, a + Math.PI / 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = acc; for (const s of [1, -1]) { ctx.beginPath(); ctx.ellipse(x + rx * 0.36 * s - fx * 0.02, y + ry * 0.36 * s - fy * 0.02, 0.15, 0.13, a, 0, Math.PI * 2); ctx.fill(); }
  const hands = [], as = o.arm != null && Math.cos(o.arm) * rx + Math.sin(o.arm) * ry < 0 ? -1 : 1;   // the arm on the side it points to
  for (const s of [1, -1]) {
    const sx = x + rx * 0.37 * s, sy = y + ry * 0.37 * s;
    if (s === as && o.arm != null) hands.push([sx, sy, sx + Math.cos(o.arm) * 0.98, sy + Math.sin(o.arm) * 0.98]);
    else if (o.push) hands.push([sx, sy, x + fx * 0.66 + rx * 0.24 * s, y + fy * 0.66 + ry * 0.24 * s]);
    else { const s2 = sw * 0.7 * s; hands.push([sx, sy, x + fx * (0.3 - s2) + rx * 0.42 * s, y + fy * (0.3 - s2) + ry * 0.42 * s]); }
  }
  ctx.strokeStyle = suit; ctx.lineWidth = 0.21; ctx.lineCap = "round"; ctx.beginPath();
  for (const [sx, sy, hx, hy] of hands) { ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); }
  ctx.stroke();
  ctx.fillStyle = "#0b0c0e"; for (const [, , hx, hy] of hands) { ctx.beginPath(); ctx.arc(hx, hy, 0.12, 0, Math.PI * 2); ctx.fill(); }
  const la = o.look != null ? o.look : a, lx = Math.cos(la), ly = Math.sin(la), hx = x + fx * 0.05, hy = y + fy * 0.05;
  ctx.fillStyle = "#c99d7c"; ctx.beginPath(); ctx.arc(hx, hy, 0.24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = cap; ctx.beginPath(); ctx.arc(hx - lx * 0.03, hy - ly * 0.03, 0.235, la + 0.95, la - 0.95 + Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx + lx * 0.22, hy + ly * 0.22, 0.15, 0.09, la + Math.PI / 2, 0, Math.PI * 2); ctx.fill();   // the peak
  ctx.fillStyle = "#121417"; for (const s of [1, -1]) { ctx.beginPath(); ctx.arc(hx - ly * 0.24 * s, hy + lx * 0.24 * s, 0.085, 0, Math.PI * 2); ctx.fill(); }   // headset
}
function drawGarages(layer) {
  if (!SES || !GC || layer !== 1) return;
  for (const team in GC) {
    const g = GC[team], F = g.F;
    if (F.x + 40 < VIEWB.x0 || F.x - 40 > VIEWB.x1 || F.y + 40 < VIEWB.y0 || F.y - 40 > VIEWB.y1) continue;
    const col = CREW_COL[team] || [TEAMS[team].col, "#111", TEAMS[team].col];
    for (const m of g.push) if (m.st !== "in" && m.t >= 0) drawCrewman(m.x, m.y, m.a, col, { speed: m.speed, ph: m.ph, push: m.st === "ready" && m.car && m.car.gar && m.car.gar.ph === "back" });
    const R = g.rel;
    if (R.st === "in") continue;
    const t = R.t, [ux, uy] = bw(F, 0, 1), [ox, oy] = bw(F, 0, 0), x = R.x + (ux - ox) * R.dodge, y = R.y + (uy - oy) * R.dodge;
    let arm = null, look = null;
    if (R.st === "look") { arm = bwa(F, Math.PI / 2 + 0.15); look = bwa(F, Math.PI + 0.35 * Math.sin(t * 1.7)); }   // palm up to the car, eyes up the lane
    if (R.st === "go") { arm = bwa(F, Math.PI / 2 - 0.25 - 1.15 * (0.5 + 0.5 * Math.sin(t * 9))); look = bwa(F, t < 0.5 ? Math.PI : Math.PI / 2); }   // waving it out
    drawCrewman(x, y, R.a, col, { speed: R.speed, ph: R.ph, arm, look });
  }
}
function drawPitRoof() {                                            // the roof over the garages, drawn again over what went inside
  const P = PIT_ROOF;
  if (P.x1 < VIEWB.x0 || P.x0 > VIEWB.x1 || P.y1 < VIEWB.y0 || P.y0 > VIEWB.y1 || !mapImg.complete || !mapImg.naturalWidth) return;
  const x0 = Math.floor(P.x0) - 3, y0 = Math.floor(P.y0) - 3, x1 = Math.ceil(P.x1) + 3, y1 = Math.ceil(P.y1) + 3;
  const sx = mapImg.naturalWidth / MAP_W, sy = mapImg.naturalHeight / MAP_H;
  ctx.save(); ctx.beginPath(); ctx.rect(P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0); ctx.clip();
  ctx.imageSmoothingEnabled = cam.zoom <= 2.21;
  ctx.drawImage(mapImg, x0 * sx, y0 * sy, (x1 - x0) * sx, (y1 - y0) * sy, x0, y0, x1 - x0, y1 - y0);
  ctx.imageSmoothingEnabled = true;
  drawStaticShade(x0, y0, x1, y1);
  ctx.restore();
}

// ---------- life around the circuit: people walking, everyday traffic on the roads outside ----------
// People: the walkable area is the user's plan (AMB_DATA.walk, a 2-px grid). Everyone wanders along it at his own
// pace, keeps to the middle of the paths, turns back at the ends, stops now and then to chat or look at the track, and
// puts up an umbrella when it rains. Cars: a random route over the road graph (AMB_DATA.roads), driving on the right,
// slowing for bends and for the car in front, hidden where a road passes under a bridge.
const WALK = (() => {
  const W = MAP_W >> 1, H = MAP_H >> 1, G = new Uint8Array(W * H), cells = [];
  for (const r of AMB_DATA.walk) { const y = r[0]; for (let k = 1; k < r.length; k += 2) for (let x = r[k]; x < r[k] + r[k + 1]; x++) { G[y * W + x] = 1; cells.push(y * W + x); } }
  // distance to the edge of the walkable area (chamfer 2-3, in half cells): people keep to the middle of the paths
  const D = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) D[i] = G[i] ? 250 : 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (!D[i]) continue;
    D[i] = Math.min(D[i], D[i - 1] + 2, D[i - W] + 2, D[i - W - 1] + 3, D[i - W + 1] + 3);
  }
  for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) {
    const i = y * W + x; if (!D[i]) continue;
    D[i] = Math.min(D[i], D[i + 1] + 2, D[i + W] + 2, D[i + W + 1] + 3, D[i + W - 1] + 3);
  }
  const n = Math.round(cells.length * 4 / 42);
  const P = { n, W, H, D, x: new Float32Array(n), y: new Float32Array(n), a: new Float32Array(n), ta: new Float32Array(n), v: new Float32Array(n),
    sp: new Float32Array(n), t: new Float32Array(n), st: new Float32Array(n), ph: new Float32Array(n), look: new Float32Array(n), stand: new Uint8Array(n),
    skin: new Uint8Array(n), hair: new Uint8Array(n), cap: new Int8Array(n), shirt: new Uint8Array(n), legs: new Uint8Array(n), bag: new Int8Array(n), umb: new Int8Array(n), s: new Float32Array(n) };
  for (let i = 0; i < n; i++) {
    const r = k => fanRnd(i + 7919, k + 40), c = cells[Math.floor(r(1) * cells.length) % cells.length];
    P.x[i] = (c % W) * 2 + 0.4 + r(2) * 1.2; P.y[i] = Math.floor(c / W) * 2 + 0.4 + r(3) * 1.2;
    P.a[i] = P.ta[i] = r(4) * Math.PI * 2; P.sp[i] = 1.5 + r(5) * 1.1; P.v[i] = P.sp[i]; P.t[i] = r(6) * 8; P.ph[i] = r(7) * 6.28; P.st[i] = r(8);
    P.skin[i] = fanPick(FAN_SKIN_W, r(9)); P.hair[i] = fanPick(FAN_HAIR_W, r(10)); P.cap[i] = r(11) < 0.3 ? FAN_CAPS[Math.floor(r(12) * FAN_CAPS.length)] : -1;
    P.shirt[i] = fanPick(FAN_SHIRT_W, r(13)); P.legs[i] = fanPick(FAN_LEGS_W, r(14)); P.bag[i] = r(15) < 0.22 ? Math.floor(r(16) * 4) : -1;
    P.umb[i] = r(17) < 0.55 ? Math.floor(r(18) * 8) : -1; P.s[i] = (0.94 + r(19) * 0.14) * 1.35;                     // the cars' exaggerated scale
    if (r(20) < 0.22) { P.stand[i] = 1; P.t[i] = 2 + r(21) * 9; P.look[i] = P.a[i]; }
  }
  return P;
})();
const walkD = (x, y) => { const cx = x >> 1, cy = y >> 1; return cx < 0 || cy < 0 || cx >= WALK.W || cy >= WALK.H ? 0 : WALK.D[cy * WALK.W + cx]; };
const STEER_A = [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1, 1.6, -1.6, 2.2, -2.2, Math.PI];
function walkSteer(i, wander) {
  const P = WALK, x = P.x[i], y = P.y[i], a0 = P.a[i] + wander; let best = P.a[i] + Math.PI, bs = -1e9;
  for (const da of STEER_A) {
    const a = a0 + da, c = Math.cos(a), s = Math.sin(a), d = walkD(x + c * 3.4, y + s * 3.4);
    if (!d || !walkD(x + c * 1.6, y + s * 1.6)) continue;
    const sc = Math.min(d, 7) * 0.5 - Math.abs(da) * 0.85 + fanRnd(i, P.ph[i] * 7 + da) * 0.4;
    if (sc > bs) { bs = sc; best = a; }
  }
  P.ta[i] = best;
}
// a coarse grid of who is where, to keep people from walking through each other
const WALK_GS = 4, WALK_GW = Math.ceil(MAP_W / WALK_GS), WALK_HEAD = new Int32Array(WALK_GW * Math.ceil(MAP_H / WALK_GS)), WALK_NEXT = new Int32Array(WALK.n);
let walkFrame = 0;
function walkStep(dt) {
  if (dt <= 0) return;
  const P = WALK, n = P.n, near = (x, y) => x > VIEWB.x0 - 40 && x < VIEWB.x1 + 40 && y > VIEWB.y0 - 40 && y < VIEWB.y1 + 40;
  walkFrame++;
  WALK_HEAD.fill(-1);
  for (let i = 0; i < n; i++) { const g = Math.floor(P.y[i] / WALK_GS) * WALK_GW + Math.floor(P.x[i] / WALK_GS); WALK_NEXT[i] = WALK_HEAD[g]; WALK_HEAD[g] = i; }
  const rain = WXC.R > 0.08;
  for (let i = 0; i < n; i++) {
    const vis = near(P.x[i], P.y[i]);
    if (!vis && (i + walkFrame) % 4) continue;                       // far from the camera: a quarter of the updates
    const h = vis ? dt : dt * 4;
    P.t[i] -= h;
    if (P.stand[i]) {                                                // stopped: chatting, waiting, watching the cars
      if (P.t[i] <= 0) { P.stand[i] = 0; P.t[i] = 4 + fanRnd(i, P.ph[i]) * 10; walkSteer(i, 0); }
      else if (fanRnd(i, Math.floor(P.t[i] * 0.7)) < 0.02 * h * 60) P.look[i] = P.a[i] + (fanRnd(i, P.t[i]) - 0.5) * 2.4;
      continue;
    }
    if (P.t[i] <= 0) {                                               // now and then: stop for a bit, or wander off another way
      const r = fanRnd(i, P.ph[i] * 3.1);
      if (r < (rain ? 0.12 : 0.3)) { P.stand[i] = 1; P.t[i] = 1.5 + fanRnd(i, P.ph[i] * 5) * 6; P.look[i] = P.a[i]; continue; }
      P.t[i] = 3 + fanRnd(i, P.ph[i] * 9) * 9; walkSteer(i, (r - 0.5) * 1.6);
    }
    P.st[i] -= h; if (P.st[i] <= 0) { P.st[i] = 0.25 + fanRnd(i, P.t[i]) * 0.2; walkSteer(i, 0); }
    // the person in front: slow down and edge to the right
    let v = P.sp[i] * (rain ? 1.18 : 1), side = 0;
    const x = P.x[i], y = P.y[i], gx = Math.floor(x / WALK_GS), gy = Math.floor(y / WALK_GS), ca = Math.cos(P.a[i]), sa = Math.sin(P.a[i]);
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      for (let j = WALK_HEAD[(gy + oy) * WALK_GW + gx + ox] ?? -1; j >= 0; j = WALK_NEXT[j]) {
        if (j === i) continue;
        const dx = P.x[j] - x, dy = P.y[j] - y, al = dx * ca + dy * sa, lt = -dx * sa + dy * ca;
        if (al > 0 && al < 2.8 && Math.abs(lt) < 1.4) { v = Math.min(v, Math.max(0.15, (al - 1.2) * 1.6)); side += lt >= 0 ? -0.5 : 0.5; }
      }
    }
    let da = P.ta[i] + side * 0.3 - P.a[i]; da = Math.atan2(Math.sin(da), Math.cos(da));
    P.a[i] += Math.max(-2.8 * h, Math.min(2.8 * h, da));
    P.v[i] += (v - P.v[i]) * Math.min(1, h * 4);
    const nx = x + Math.cos(P.a[i]) * P.v[i] * h, ny = y + Math.sin(P.a[i]) * P.v[i] * h;
    if (walkD(nx, ny)) { P.x[i] = nx; P.y[i] = ny; P.ph[i] += P.v[i] * h * 3.1; }
    else { walkSteer(i, 0); P.a[i] = P.ta[i]; }
  }
}
const WALK_BAG = ["#1c1f24", "#3d4652", "#6b4a2c", "#0d7a63"];
const WALK_UMB = ["#1b1d22", "#0d4f8b", "#c8102e", "#2e7d32", "#f2c200", "#5c2d91", "#e65100", "#e6e6e6"];
const WALK_LAYERS = [["sh", ["#000"]], ["legs", FAN_LEGS.slice(0, -1).concat([""], FAN_SKIN)], ["bag", WALK_BAG], ["arm", FAN_SHIRT], ["hand", FAN_SKIN],
  ["shirt", FAN_SHIRT], ["skin", FAN_SKIN], ["hair", FAN_HAIR], ["cap", FAN_SHIRT], ["umb", WALK_UMB], ["rib", ["#000"]], ["dot", FAN_SHIRT]];
const WALK_LIVE = { t: 0, z: 0, x0: 0, x1: 0, y0: 0, y1: 0, P: null };
function drawWalkers() {
  const ppm = cam.zoom * DPR; if (ppm < 0.5) return;
  const now = performance.now(), [hx, hy] = halfExt(cam.zoom), L = WALK_LIVE;
  const vx0 = cam.x - hx - 3, vx1 = cam.x + hx + 3, vy0 = cam.y - hy - 3, vy1 = cam.y + hy + 3;
  if (!(L.P && now - L.t < 33 && Math.abs(L.z - cam.zoom) < 0.02 && vx0 >= L.x0 && vx1 <= L.x1 && vy0 >= L.y0 && vy1 <= L.y1)) {
    L.t = now; L.z = cam.zoom; L.x0 = vx0 - 12; L.x1 = vx1 + 12; L.y0 = vy0 - 12; L.y1 = vy1 + 12;
    const P = {}; WALK_LAYERS.forEach(([k, cols]) => { P[k] = new Array(cols.length).fill(null); }); L.P = P;
    const at = (k, j) => P[k][j] || (P[k][j] = new Path2D());
    const W = WALK, rain = WXC.R > 0.08, dots = ppm < 1.6, sun = 0.3 * SUNK;
    let drawn = 0;
    for (let i = 0; i < W.n; i++) {
      const x = W.x[i], y = W.y[i];
      if (x < L.x0 || x > L.x1 || y < L.y0 || y > L.y1) continue;
      if (++drawn > 1400) break;
      if (dots) { at("dot", W.shirt[i]).rect(x - 0.6, y - 0.6, 1.2, 1.2); continue; }
      const s = W.s[i], a = W.a[i], fx = Math.cos(a), fy = Math.sin(a), rx = -fy, ry = fx, ra = a + Math.PI / 2;
      const walk = W.stand[i] ? 0 : Math.min(1, W.v[i] / 1.2), sw = Math.sin(W.ph[i]) * 0.3 * walk * s, sk = W.skin[i], sh = W.shirt[i];
      ell(at("sh", 0), x + 0.24, y + 0.32, 0.55 * s, 0.4 * s, ra);
      const lg = W.legs[i], li = FAN_LEGS[lg] ? lg : FAN_LEGS.length + sk;
      for (const d of [1, -1]) ell(at("legs", li), x + fx * sw * d + rx * 0.16 * s * d, y + fy * sw * d + ry * 0.16 * s * d, 0.2 * s, 0.11 * s, a);
      if (W.bag[i] >= 0) quad(at("bag", W.bag[i]), x - fx * 0.32 * s, y - fy * 0.32 * s, rx * 0.27 * s, ry * 0.27 * s, fx * 0.14 * s, fy * 0.14 * s);
      const ap = at("arm", sh), hp = at("hand", sk);
      for (const d of [1, -1]) {                                     // arms swing against the legs
        const sx = x + rx * 0.35 * s * d, sy = y + ry * 0.35 * s * d, hx2 = sx + fx * (-sw * d * 0.9) + rx * 0.07 * d, hy2 = sy + fy * (-sw * d * 0.9) + ry * 0.07 * d;
        const mx = (sx + hx2) / 2, my = (sy + hy2) / 2, ax = (hx2 - sx) / 2 + fx * 0.06, ay = (hy2 - sy) / 2 + fy * 0.06;
        quad(ap, mx, my, ax, ay, rx * 0.09 * s, ry * 0.09 * s); hp.moveTo(hx2 + 0.09 * s, hy2); hp.arc(hx2, hy2, 0.09 * s, 0, Math.PI * 2);
      }
      ell(at("shirt", sh), x, y, 0.48 * s, 0.31 * s, ra);
      const look = W.stand[i] ? W.look[i] : a, lx = Math.cos(look), ly = Math.sin(look), hr = 0.24 * s, kx = x + fx * 0.04, ky = y + fy * 0.04;
      const kp = at("skin", sk); kp.moveTo(kx + hr, ky); kp.arc(kx, ky, hr, 0, Math.PI * 2);
      if (W.cap[i] >= 0) { const p = at("cap", W.cap[i]); p.moveTo(kx + hr * 1.04, ky); p.arc(kx, ky, hr * 1.04, 0, Math.PI * 2); ell(p, kx + lx * hr * 0.95, ky + ly * hr * 0.95, hr * 0.6, hr * 0.36, look + Math.PI / 2); }
      else { const p = at("hair", W.hair[i]); p.moveTo(kx - lx * 0.05, ky - ly * 0.05); p.arc(kx - lx * 0.05, ky - ly * 0.05, hr * 1.02, look + 1.25, look - 1.25 + Math.PI * 2); }
      if (rain && W.umb[i] >= 0) {                                   // an umbrella over the head, its ribs and the tip
        const ux = x + fx * 0.15, uy = y + fy * 0.15, R = 1.05 * s, up = at("umb", W.umb[i]), rb = at("rib", 0);
        ell(up, ux, uy, R, R, a + i);
        for (let k = 0; k < 4; k++) { const q = a + i + k * Math.PI / 4; rb.moveTo(ux + Math.cos(q) * R, uy + Math.sin(q) * R); rb.lineTo(ux + Math.cos(q) * R * 0.94 + Math.sin(q) * 0.03, uy + Math.sin(q) * R * 0.94); rb.lineTo(ux - Math.cos(q) * R, uy - Math.sin(q) * R); }
        rb.moveTo(ux + 0.1, uy); rb.arc(ux, uy, 0.1, 0, Math.PI * 2);
      }
    }
    L.sun = sun;
  }
  for (const [k, cols] of WALK_LAYERS) {
    const arr = L.P[k];
    ctx.globalAlpha = k === "sh" ? L.sun : k === "rib" ? 0.22 : 1;
    if (k === "rib") { ctx.strokeStyle = "#000"; ctx.lineWidth = 0.05; }
    for (let j = 0; j < arr.length; j++) if (arr[j]) { ctx.fillStyle = cols[j]; ctx.fill(arr[j]); if (k === "rib") ctx.stroke(arr[j]); }
  }
  ctx.globalAlpha = 1;
}

// ---------- traffic on the roads outside the circuit ----------
const ROADS = (() => {
  const N = AMB_DATA.roads.n, adj = N.map(() => []);
  const E = AMB_DATA.roads.e.map(([a, b, f, tun], k) => { adj[a].push(k); if (b !== a) adj[b].push(k); else adj[a].push(k); return { a, b, p: f, tun: !!tun }; });
  const deg = adj.map(l => l.length), term = [], edge = [];
  N.forEach(([x, y], k) => { if (deg[k] !== 1) return; term.push(k); edge.push(x < 6 || y < 6 || x > MAP_W - 6 || y > MAP_H - 6); });
  E.forEach(e => {                                                   // roads that leave the map run on a little beyond its edge
    for (const [nd, first] of [[e.a, true], [e.b, false]]) {
      const ti = term.indexOf(nd); if (ti < 0 || !edge[ti]) continue;
      const p = e.p, i = first ? 0 : p.length - 2, j = first ? 2 : p.length - 4, dx = p[i] - p[j], dy = p[i + 1] - p[j + 1], l = Math.hypot(dx, dy) || 1;
      const ext = [p[i] + dx / l * 30, p[i + 1] + dy / l * 30];
      if (first) e.p = ext.concat(p); else e.p = p.concat(ext);
    }
  });
  return { N, E, adj, deg, term, edge };
})();
const VEH_COLS = ["#f2f2f0", "#f2f2f0", "#e8e8e6", "#c9ccd1", "#c9ccd1", "#9aa0a6", "#5d636b", "#3b3f45", "#16181b", "#16181b", "#1f3d73", "#2c5aa0", "#7a1f24", "#b0322b", "#2f5d3a", "#8a6d3b", "#d9cfc0", "#f0c419"];
const VEH_TYPES = [{ L: 8.2, W: 3.7, ws: 0.3, rw: 0.78, w: 3 }, { L: 9.3, W: 3.9, ws: 0.32, rw: 0.8, w: 5 }, { L: 9.9, W: 4.2, ws: 0.3, rw: 0.84, w: 3 }, { L: 11.2, W: 4.3, ws: 0.16, rw: 0.97, w: 1, van: true }];
const VEH_SPR = new Map();
function vehSprite(t, col) {                                         // a car seen from above, baked once per type and colour
  const key = t + col; let c = VEH_SPR.get(key); if (c) return c;
  const T = VEH_TYPES[t], S = 10, w = Math.ceil(T.L * S), h = Math.ceil(T.W * S); c = mkCanvas(w, h); const g = c.getContext("2d");
  const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
  rr(0.5, 0.5, w - 1, h - 1, h * 0.3); g.fillStyle = col; g.fill(); g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 1; g.stroke();
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(0,0,0,.18)"); gr.addColorStop(0.5, "rgba(255,255,255,.16)"); gr.addColorStop(1, "rgba(0,0,0,.22)");
  g.fillStyle = gr; rr(0.5, 0.5, w - 1, h - 1, h * 0.3); g.fill();
  const glass = "#1c2531", fx0 = w * (1 - T.ws), wsw = w * 0.13;     // nose to the right: windscreen, roof, rear window
  g.fillStyle = glass; g.beginPath(); g.moveTo(fx0 + wsw, h * 0.14); g.lineTo(fx0 + wsw * 0.25, h * 0.2); g.lineTo(fx0 + wsw * 0.25, h * 0.8); g.lineTo(fx0 + wsw, h * 0.86); g.closePath(); g.fill();
  const rx0 = T.van ? w * 0.04 : w * (1 - T.rw), rx1 = fx0 + wsw * 0.25 - w * 0.02;
  g.fillStyle = fanShade(col, col === "#16181b" ? 0.08 : -0.06); g.fillRect(rx0 + w * 0.06, h * 0.2, rx1 - rx0 - w * 0.06, h * 0.6);
  if (!T.van) { g.fillStyle = glass; g.beginPath(); g.moveTo(rx0, h * 0.2); g.lineTo(rx0 + w * 0.07, h * 0.24); g.lineTo(rx0 + w * 0.07, h * 0.76); g.lineTo(rx0, h * 0.8); g.closePath(); g.fill(); }
  g.fillStyle = glass; g.globalAlpha = 0.75; g.fillRect(rx0 + w * 0.1, h * 0.07, rx1 - rx0 - w * 0.12, h * 0.07); g.fillRect(rx0 + w * 0.1, h * 0.86, rx1 - rx0 - w * 0.12, h * 0.07); g.globalAlpha = 1;   // side windows
  g.fillStyle = "#fff6d0"; g.fillRect(w - 4, h * 0.12, 3, h * 0.18); g.fillRect(w - 4, h * 0.7, 3, h * 0.18);                     // headlights
  g.fillStyle = "#b3141e"; g.fillRect(1, h * 0.1, 3, h * 0.2); g.fillRect(1, h * 0.7, 3, h * 0.2);                               // tail lights
  g.fillStyle = col; g.fillRect(fx0 + wsw * 0.3, -0.5, 3, 4); g.fillRect(fx0 + wsw * 0.3, h - 3.5, 3, 4);                       // mirrors
  VEH_SPR.set(key, c); return c;
}
const TRAF = { list: [], t: 0, max: 38 };
function trafRoute(start) {                                          // a random drive over the road graph, from one end to another
  const R = ROADS, pts = [], tun = [];
  let node = start, from = -1;
  for (let steps = 0; steps < 40; steps++) {
    let opts = R.adj[node].filter(k => k !== from);
    if (!opts.length) break;
    const k = opts[Math.floor(Math.random() * opts.length)], e = R.E[k], fwd = e.a === node && !(e.a === e.b && Math.random() < 0.5);
    const p = e.p, m = p.length / 2;
    for (let j = 0; j < m; j++) { const q = fwd ? j : m - 1 - j; if (pts.length && j === 0) continue; pts.push(p[q * 2], p[q * 2 + 1]); tun.push(e.tun ? 1 : 0); }
    from = k; node = fwd ? e.b : e.a;
    if (R.deg[node] === 1) break;
  }
  // round off the corners (Chaikin), then resample every 1.5 px with the heading
  let P = pts, U = tun;
  for (let it = 0; it < 2; it++) {
    const Q = [P[0], P[1]], V = [U[0]];
    for (let j = 0; j + 3 < P.length; j += 2) {
      Q.push(P[j] * 0.75 + P[j + 2] * 0.25, P[j + 1] * 0.75 + P[j + 3] * 0.25, P[j] * 0.25 + P[j + 2] * 0.75, P[j + 1] * 0.25 + P[j + 3] * 0.75);
      V.push(U[j / 2] && U[j / 2 + 1], U[j / 2] && U[j / 2 + 1]);
    }
    Q.push(P[P.length - 2], P[P.length - 1]); V.push(U[U.length - 1]); P = Q; U = V;
  }
  const xs = [], ys = [], hs = [], ts = [];
  let acc = 0;
  for (let j = 0; j + 3 < P.length; j += 2) {
    const dx = P[j + 2] - P[j], dy = P[j + 3] - P[j + 1], l = Math.hypot(dx, dy); if (l < 1e-6) continue;
    const hd = Math.atan2(dy, dx);
    while (acc <= l) { xs.push(P[j] + dx * acc / l); ys.push(P[j + 1] + dy * acc / l); hs.push(hd); ts.push(U[j / 2] && U[j / 2 + 1] ? 1 : 0); acc += 1.5; }
    acc -= l;
  }
  return { x: Float32Array.from(xs), y: Float32Array.from(ys), h: Float32Array.from(hs), tun: Uint8Array.from(ts), n: xs.length, endOpen: R.deg[node] === 1 && R.edge[R.term.indexOf(node)] };
}
function trafSpawn(anywhere) {
  const R = ROADS, ti = Math.floor(Math.random() * R.term.length), rt = trafRoute(R.term[ti]);
  if (rt.n < 40) return;
  const s = anywhere ? Math.random() * rt.n * 0.85 : 0, ix = Math.floor(s);
  for (const o of TRAF.list) if (Math.hypot(o.x - rt.x[ix], o.y - rt.y[ix]) < 14) return;   // no room there yet
  const type = fanPick(VEH_TYPES.map(t => t.w), Math.random()), T = VEH_TYPES[type];
  const v = { rt, s, v: 0, vmax: 15 + Math.random() * 9, type, col: VEH_COLS[Math.floor(Math.random() * VEH_COLS.length)], L: T.L, W: T.W, x: 0, y: 0, h: 0, al: 0,
    startOpen: R.edge[ti], br: 0 };
  v.v = v.vmax * 0.7; TRAF.list.push(v); trafPose(v);
}
function trafPose(v) {
  const rt = v.rt, f = Math.min(rt.n - 1.001, v.s), i = Math.floor(f), t = f - i, j = Math.min(rt.n - 1, i + 1);
  let dh = rt.h[j] - rt.h[i]; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
  const hd = rt.h[i] + dh * t, x = rt.x[i] + (rt.x[j] - rt.x[i]) * t, y = rt.y[i] + (rt.y[j] - rt.y[i]) * t, off = 2.15;   // keep right
  v.x = x - Math.sin(hd) * off; v.y = y + Math.cos(hd) * off; v.h = hd;
  const ds = v.s * 1.5, de = (rt.n - 1 - v.s) * 1.5, tun = rt.tun[i] || rt.tun[j];
  v.al = Math.min(1, v.startOpen ? 1 : ds / 8, rt.endOpen ? 1 : de / 8) * (tun ? 0 : 1);
  v.tun = tun;
}
function trafStep(dt) {
  if (dt <= 0) return;
  const L = TRAF.list;
  if (!TRAF.init) { TRAF.init = true; for (let k = 0; k < TRAF.max * 2 && L.length < TRAF.max * 0.8; k++) trafSpawn(true); }
  TRAF.t -= dt; if (TRAF.t <= 0 && L.length < TRAF.max) { TRAF.t = 0.8 + Math.random() * 1.6; trafSpawn(false); }
  for (const v of L) {
    const rt = v.rt, i = Math.min(rt.n - 1, Math.floor(v.s)), j = Math.min(rt.n - 1, i + 8);
    let dh = Math.abs(rt.h[j] - rt.h[i]); dh = Math.min(dh, Math.PI * 2 - dh);
    let want = Math.min(v.vmax, 5 + v.vmax / (1 + dh * 3.2));           // slow for the bends
    const ch = Math.cos(v.h), sh = Math.sin(v.h);
    for (const o of L) {                                             // the car in front, in the same lane
      if (o === v || o.tun !== v.tun) continue;
      const dx = o.x - v.x, dy = o.y - v.y; if (dx > 26 || dx < -26 || dy > 26 || dy < -26) continue;
      const al = dx * ch + dy * sh, lt = -dx * sh + dy * ch;
      if (al > 0 && al < 24 && Math.abs(lt) < 2.4 && Math.cos(o.h - v.h) > 0.3) want = Math.min(want, Math.max(0, (al - (v.L + o.L) / 2 - 2.2) * 1.4));
    }
    const prev = v.v; v.v += Math.max(-26 * dt, Math.min(7 * dt, want - v.v)); v.br = v.v < prev - 0.05 ? 1 : Math.max(0, v.br - dt * 3);
    v.s += v.v * dt / 1.5; trafPose(v);
  }
  TRAF.list = L.filter(v => v.s < v.rt.n - 1.01);
}
function drawTraffic() {
  const ppm = cam.zoom * DPR; if (ppm < 0.35) return;
  const vis = TRAF.list.filter(v => v.al > 0.01 && v.x > VIEWB.x0 && v.x < VIEWB.x1 && v.y > VIEWB.y0 && v.y < VIEWB.y1);
  for (const v of vis) {                                             // shadows first, then the bodies
    ctx.save(); ctx.translate(v.x + 0.55, v.y + 0.8); ctx.rotate(v.h); ctx.globalAlpha = 0.34 * SUNK * v.al; ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-v.L / 2, -v.W / 2, v.L, v.W, v.W * 0.3) : ctx.rect(-v.L / 2, -v.W / 2, v.L, v.W); ctx.fill(); ctx.restore();
  }
  for (const v of vis) {
    ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.h); ctx.globalAlpha = v.al;
    ctx.drawImage(vehSprite(v.type, v.col), -v.L / 2, -v.W / 2, v.L, v.W);
    if (v.br > 0.05 || WXC.cloud > 85) {                              // brake lights (and lights on under a dark sky)
      ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,40,40,${0.55 * Math.max(v.br, 0.4)})`;
      ctx.fillRect(-v.L / 2 - 0.2, -v.W * 0.42, 0.6, v.W * 0.24); ctx.fillRect(-v.L / 2 - 0.2, v.W * 0.18, 0.6, v.W * 0.24); ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function ambStep(dt) { }   // no people walking around the circuit and no road traffic: only the crowd in the grandstands

// ---------- the TV helicopter: a low-poly 3D model (an AS350-type camera ship) flown with inertia ----------
// The mesh is lit by the same sun as everything else and drawn in orthographic top view with its real attitude:
// it rolls into the turns, dips its nose to accelerate and flares to slow down; its shadow is the same mesh
// projected onto the ground along the sun.
const HELI_MESH = (() => {
  const V = [], Fc = [];
  const vtx = (x, y, z) => (V.push([x, y, z]), V.length - 1);
  const face = (ids, col, glass) => Fc.push({ v: ids, col, glass: !!glass });
  // fuselage: low-poly rings (x forward, y right, z up), eight sides each
  const RINGS = [[6.4, 0.25, 0.35, 1.45], [5.6, 1.45, 1.25, 1.6], [3.7, 2.35, 1.95, 1.95], [1.2, 2.55, 2.2, 2.05], [-1.4, 2.35, 2.1, 2.15], [-3.2, 1.55, 1.55, 2.35], [-4.4, 0.85, 0.85, 2.55]];
  const NS = 8, ring = RINGS.map(([x, w, hz, zc]) => { const ids = []; for (let k = 0; k < NS; k++) { const a = k / NS * Math.PI * 2; ids.push(vtx(x, Math.sin(a) * w, zc + Math.cos(a) * hz)); } return ids; });
  const BODY = "#2f6bff", TOP = "#eef1f5", BELLY = "#18233a", GLASS = "#1d3a52", RED = "#e10600";
  for (let r = 0; r < ring.length - 1; r++) for (let k = 0; k < NS; k++) {
    const k2 = (k + 1) % NS, a = ring[r][k], b = ring[r][k2], c = ring[r + 1][k2], d = ring[r + 1][k];
    const up = k === 0 || k === NS - 1, low = k === 3 || k === 4;
    const glass = r <= 1 && !low;
    const col = glass ? GLASS : r === 3 && !low && !up ? RED : up ? TOP : low ? BELLY : BODY;
    face([a, b, c, d], col, glass);
  }
  face(ring[0].slice().reverse(), GLASS, true);
  face(ring[ring.length - 1].slice(), BODY);
  // tail boom: tapered, six sides
  const boom = [[-4.4, 0.62, 2.6], [-13.4, 0.32, 2.85]].map(([x, w, zc]) => { const ids = []; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; ids.push(vtx(x, Math.sin(a) * w, zc + Math.cos(a) * w)); } return ids; });
  for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; face([boom[0][k], boom[0][k2], boom[1][k2], boom[1][k]], k === 0 || k === 5 ? TOP : BODY); }
  face(boom[1].slice(), BODY);
  const box = (x0, x1, y0, y1, z0, z1, col, colTop) => {
    const p = [vtx(x0, y0, z0), vtx(x1, y0, z0), vtx(x1, y1, z0), vtx(x0, y1, z0), vtx(x0, y0, z1), vtx(x1, y0, z1), vtx(x1, y1, z1), vtx(x0, y1, z1)];
    face([p[4], p[5], p[6], p[7]], colTop || col); face([p[0], p[3], p[2], p[1]], col);
    face([p[0], p[1], p[5], p[4]], col); face([p[2], p[3], p[7], p[6]], col); face([p[1], p[2], p[6], p[5]], col); face([p[3], p[0], p[4], p[7]], col);
  };
  box(-2.6, 1.4, -1.15, 1.15, 3.9, 4.75, "#d9dde3", TOP);              // engine cowling
  box(-0.35, 0.35, -0.35, 0.35, 4.75, 5.4, "#2a2f36");                  // rotor mast
  box(-13.9, -12.5, -0.13, 0.13, 2.7, 5.6, TOP, RED);                    // vertical fin
  box(-11.6, -10.5, -2.7, 2.7, 2.62, 2.8, TOP);                          // horizontal stabiliser
  box(-11.4, -10.6, -2.85, -2.6, 2.4, 3.3, BODY); box(-11.4, -10.6, 2.6, 2.85, 2.4, 3.3, BODY);
  for (const s of [-1, 1]) {                                             // skids and their cross tubes
    box(-3.4, 3.9, s * 2.2 - 0.14, s * 2.2 + 0.14, -0.35, -0.12, "#2b3036");
    box(2.0, 2.3, Math.min(s * 2.2, s * 1.2), Math.max(s * 2.2, s * 1.2), -0.2, 0.55, "#2b3036");
    box(-2.0, -1.7, Math.min(s * 2.2, s * 1.2), Math.max(s * 2.2, s * 1.2), -0.2, 0.55, "#2b3036");
  }
  box(4.6, 5.4, 1.0, 1.7, 0.2, 0.9, "#111418");                          // the gyro-stabilised camera ball
  // face normals (outward) from the vertex order
  Fc.forEach(f => {
    const [a, b, c] = f.v.map(i => V[i]), ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; f.n = [nx / l, ny / l, nz / l];
  });
  return { V, F: Fc, hub: [0, 0, 5.45], tail: [-13.2, 0.5, 4.1], R: 8.6 };
})();
const HELI_SUN = (() => { const l = Math.hypot(-0.45, -0.6, 0.66); return [-0.45 / l, -0.6 / l, 0.66 / l]; })();
const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
var HELI = { on: false, next: 25, x: 0, y: 0, vx: 0, vy: 0, h: 0, yr: 0, bank: 0, pitch: 0, alt: 40, rot: 0, t: 0, dur: 0, mode: "in", sh: 0, side: 1, ax: 0, ay: 0 };
function heliTarget() {
  if (SES) {
    const ok = c => c && !c.gar && !c.pit && !c.done && carSprites[c.idx];
    if (ok(cars[focus])) return cars[focus];
    return cars.filter(c => ok(c) && timed(c)).sort((a, b) => (a.sbest || 999) - (b.sbest || 999))[0] || cars.find(ok) || null;
  }
  return raceOrder().find(c => !c.done && !c.pit) || null;
}
function heliStep(dt, simDt) {
  const H = HELI; H.rot += dt * 2 * Math.PI * 6.2;
  const mult = SES ? SES_SPD[SES.spd] : SPEEDS[speedIdx];
  if (mult > 8 || MENU.step) { if (H.on && mult > 8) H.on = false; return; }   // too fast to fly along
  const h = Math.min(0.1, simDt); if (h <= 0) return;
  const MPX = 1 / M_PER_PX, VMAX = 95 * MPX, AMAX = 20 * MPX;          // a camera ship flown hard: ~2 g in the turns
  const tgt = heliTarget();
  if (!H.on) {
    H.next -= h; if (H.next > 0 || !racing() || !tgt) return;
    const p = carPos(tgt), a = Math.random() * Math.PI * 2, d = 760;
    Object.assign(H, { on: true, t: 0, dur: 20 + Math.random() * 14, mode: "in", x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, alt: 70, yr: 0, bank: 0, pitch: 0, side: Math.random() < 0.5 ? 1 : -1 });
    H.h = a + Math.PI; H.vx = Math.cos(H.h) * 55 * MPX; H.vy = Math.sin(H.h) * 55 * MPX; H.sh = dispHead(tgt);
    return;
  }
  H.t += h;
  let vdx, vdy, altT;
  if (H.mode !== "out" && tgt && H.t < H.dur) {
    // where the car will be: along its racing line a few seconds ahead (an intercept course, not a tail chase)
    const p = carPos(tgt), hd = dispHead(tgt), vm = tgt.vNow || 0, v = vm * MPX;
    const d0 = Math.hypot(p.x - H.x, p.y - H.y), tau = Math.max(3.2, Math.min(9, d0 * M_PER_PX / 75));
    const onLine = !tgt.pit && !tgt.gar, fs = onLine ? sample(tgt.s + vm * tau) : null, fh = onLine ? heading(tgt.s + vm * tau) : hd;
    H.sh += Math.atan2(Math.sin(fh - H.sh), Math.cos(fh - H.sh)) * Math.min(1, h * 0.8);  // a slow idea of where the car is going
    const ch = Math.cos(H.sh), sh = Math.sin(H.sh), ox = -ch * 26 - sh * H.side * 20, oy = -sh * 26 + ch * H.side * 20;
    const fx = (fs ? fs.x : p.x + Math.cos(hd) * v * tau) + ox, fy = (fs ? fs.y : p.y + Math.sin(hd) * v * tau) + oy;
    const tv = Math.max(1.7, tau * 0.75);                                                      // fly to where the car is going to be
    vdx = (fx - H.x) / tv; vdy = (fy - H.y) / tv;
    const near = d0 < 160 ? 0 : 1;
    if (near < 0.5) H.mode = "track";
    altT = 38 + 6 * Math.sin(H.t * 0.21);
  } else {
    if (H.mode !== "out") { H.mode = "out"; H.exitA = H.h + H.side * 0.9; H.tOut = H.t; }
    vdx = Math.cos(H.exitA) * 70 * MPX; vdy = Math.sin(H.exitA) * 70 * MPX; altT = 85;
    if (H.t - H.tOut > 16) { H.on = false; H.next = 55 + Math.random() * 70; return; }
  }
  const vm = Math.hypot(vdx, vdy); if (vm > VMAX) { vdx *= VMAX / vm; vdy *= VMAX / vm; }
  let ax = (vdx - H.vx) * 1.6, ay = (vdy - H.vy) * 1.6; const am = Math.hypot(ax, ay); if (am > AMAX) { ax *= AMAX / am; ay *= AMAX / am; }
  H.ax += (ax - H.ax) * Math.min(1, h * 3); H.ay += (ay - H.ay) * Math.min(1, h * 3);   // jerk-limited: no sudden changes of thrust
  H.vx += H.ax * h; H.vy += H.ay * h; H.x += H.vx * h; H.y += H.vy * h;
  const sp = Math.hypot(H.vx, H.vy) * M_PER_PX;
  if (sp > 7) {                                                     // the nose turns into the flight path, yaw rate limited
    const want = Math.atan2(H.vy, H.vx), d = Math.atan2(Math.sin(want - H.h), Math.cos(want - H.h));
    const yrT = Math.max(-0.75, Math.min(0.75, d * 1.4)); H.yr += (yrT - H.yr) * Math.min(1, h * 2.2);
  } else H.yr *= Math.exp(-h * 2);
  H.h += H.yr * h;
  const ca = Math.cos(H.h), sa = Math.sin(H.h), aLong = (H.ax * ca + H.ay * sa) * M_PER_PX, aLat = (-H.ax * sa + H.ay * ca) * M_PER_PX;
  const bankT = Math.max(-0.4, Math.min(0.4, Math.atan2(aLat, G) * 0.9 + H.yr * 0.12));
  const pitchT = Math.max(-0.3, Math.min(0.2, -Math.atan2(aLong, G) * 0.9 - sp * 0.0026));
  H.bank += (bankT - H.bank) * Math.min(1, h * 2.4); H.pitch += (pitchT - H.pitch) * Math.min(1, h * 2);
  H.alt += (altT - H.alt) * Math.min(1, h * 0.35);
}
// model to map: pitch about y, roll about x, yaw on the ground plane
function heliXf(p) {
  const H = HELI, cp = Math.cos(H.pitch), sp = Math.sin(H.pitch), cb = Math.cos(H.bank), sb = Math.sin(H.bank), ch = Math.cos(H.h), sh = Math.sin(H.h);
  let x = p[0], y = p[1], z = p[2] - 2.4;
  const x1 = x * cp - z * sp, z1 = x * sp + z * cp;                   // nose down for pitch < 0
  const y1 = y * cb + z1 * sb, z2 = -y * sb + z1 * cb;                // right side down for bank > 0
  return [x1 * ch - y1 * sh, x1 * sh + y1 * ch, z2];
}
function drawHeli(shadowOnly) {
  const H = HELI; if (!H.on) return;
  const M = HELI_MESH, S = 1.05 + H.alt / 260, altPx = H.alt / M_PER_PX * 0.55;   // closer to the camera: a little bigger
  const P = M.V.map(v => { const q = heliXf(v); return [q[0] * S, q[1] * S, q[2] * S]; });
  const sunX = SUN.x / 1.0, sunY = SUN.y / 1.0, k = 0.62;                         // shadow offset per map px of height
  const near = (x, y, m) => x > VIEWB.x0 - m && x < VIEWB.x1 + m && y > VIEWB.y0 - m && y < VIEWB.y1 + m;
  const rotP = heliXf(M.hub), R = M.R * S;
  const ch = Math.cos(H.h), sh = Math.sin(H.h), cp = Math.cos(H.pitch), sp = Math.sin(H.pitch), cb = Math.cos(H.bank), sb = Math.sin(H.bank);
  const rotN = n => { let x = n[0], y = n[1], z = n[2]; const x1 = x * cp - z * sp, z1 = x * sp + z * cp, y1 = y * cb + z1 * sb, z2 = -y * sb + z1 * cb; return [x1 * ch - y1 * sh, x1 * sh + y1 * ch, z2]; };
  if (shadowOnly) {
    const ox = H.x + altPx * sunX * k, oy = H.y + altPx * sunY * k; if (!near(ox, oy, 60)) return;
    ctx.save(); ctx.globalAlpha = 0.3 * SUNK; ctx.fillStyle = "#000"; ctx.beginPath();
    for (const f of M.F) { if (rotN(f.n)[2] <= 0) continue; f.v.forEach((i, j) => { const q = P[i], x = ox + q[0] + q[2] * sunX * k * 0.12, y = oy + q[1] + q[2] * sunY * k * 0.12; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); }
    ctx.fill("nonzero");
    ctx.globalAlpha = 0.09 * SUNK; ctx.beginPath(); ctx.ellipse(ox + rotP[0] * S, oy + rotP[1] * S, R * Math.max(0.5, Math.cos(H.pitch)), R * Math.max(0.5, Math.cos(H.bank)), H.h, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); return;
  }
  if (!near(H.x, H.y, 40)) return;
  const L = HELI_SUN, vis = [];
  for (const f of M.F) {
    const n = rotN(f.n); if (n[2] <= 0.02) continue;                  // seen from above only
    const z = f.v.reduce((s, i) => s + P[i][2], 0) / f.v.length;
    const lam = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]), rgb = hexRGB(f.col);
    let b = 0.42 + 0.7 * lam; let spec = f.glass ? Math.pow(lam, 12) * 0.9 : Math.pow(lam, 30) * 0.25;
    vis.push({ f, z, fill: `rgb(${rgb.map(c => Math.min(255, Math.round(c * b + 255 * spec))).join(",")})` });
  }
  vis.sort((a, b) => a.z - b.z);
  ctx.save(); ctx.translate(H.x, H.y); ctx.lineJoin = "round";
  for (const { f, fill } of vis) {
    ctx.beginPath(); f.v.forEach((i, j) => { const q = P[i]; j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = fill; ctx.lineWidth = 0.08; ctx.stroke();   // hairline seals the seams between facets
  }
  // main rotor: a faint disc tilted with the attitude, three blades with a motion trail
  const hx = rotP[0] * S, hy = rotP[1] * S, rx = R * Math.max(0.55, Math.cos(H.pitch)), ry = R * Math.max(0.55, Math.cos(H.bank));
  ctx.globalAlpha = 0.13; ctx.fillStyle = "#cfd6df"; ctx.beginPath(); ctx.ellipse(hx, hy, rx, ry, H.h, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.22; ctx.strokeStyle = "#e9edf2"; ctx.lineWidth = 0.25; ctx.beginPath(); ctx.ellipse(hx, hy, rx * 0.985, ry * 0.985, H.h, 0, Math.PI * 2); ctx.stroke();
  for (let tr = 3; tr >= 0; tr--) {
    ctx.globalAlpha = tr ? 0.1 + 0.05 * (3 - tr) : 0.85; ctx.strokeStyle = tr ? "#aeb6c0" : "#20252b"; ctx.lineWidth = tr ? 0.7 : 0.55; ctx.lineCap = "round";
    for (let k2 = 0; k2 < 3; k2++) {
      const a = H.rot - tr * 0.16 + k2 * Math.PI * 2 / 3, ca = Math.cos(a), sa = Math.sin(a);
      const bx = ca * rx, by = sa * ry, x = bx * ch - by * sh, y = bx * sh + by * ch;
      ctx.beginPath(); ctx.moveTo(hx + x * 0.08, hy + y * 0.08); ctx.lineTo(hx + x, hy + y); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1; ctx.fillStyle = "#1b1f25"; ctx.beginPath(); ctx.arc(hx, hy, 0.55, 0, Math.PI * 2); ctx.fill();
  // tail rotor, seen edge-on: a short blurred bar beside the fin
  const tp = heliXf(M.tail), tx = tp[0] * S, ty = tp[1] * S;
  ctx.globalAlpha = 0.45; ctx.strokeStyle = "#c8d0da"; ctx.lineWidth = 0.55; ctx.beginPath(); ctx.moveTo(tx - ch * 1.3, ty - sh * 1.3); ctx.lineTo(tx + ch * 1.3, ty + sh * 1.3); ctx.stroke();
  // anti-collision beacon
  if (Math.floor(performance.now() / 450) % 3 === 0) { const bp = heliXf([-6, 0, 3.4]); ctx.globalAlpha = 0.9; ctx.fillStyle = "#ff3b3b"; ctx.beginPath(); ctx.arc(bp[0] * S, bp[1] * S, 0.45, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore(); ctx.globalAlpha = 1;
}

// ---------- rain: the cars and their rain lights reflected in the wet tarmac, puddles that shine ----------
const REFL = DRIVERS.map(() => null);
function reflSprite(k) {                               // the car as a soft, blurred patch of its own colours
  if (REFL[k] || !carSprites[k]) return REFL[k];
  const sm = mkCanvas(Math.round(CELL_W / 7), Math.round(CELL_H / 7)), g = sm.getContext("2d"); g.drawImage(carSprites[k], 0, 0, sm.width, sm.height);
  const big = mkCanvas(CELL_W / 2, CELL_H / 2), b = big.getContext("2d"); b.imageSmoothingEnabled = true; b.imageSmoothingQuality = "high"; b.drawImage(sm, 0, 0, big.width, big.height);
  return (REFL[k] = big);
}
function drawReflections(vis) {
  if (WATER.W < 0.08) return;
  const L = CAR_LEN_M / M_PER_PX, Wd = CAR_W_M / M_PER_PX, dnx = -Math.sin(cam.rot), dny = Math.cos(cam.rot), tw = performance.now() / 1000;
  for (const { c, p, head } of vis) {                  // mirrored body, pushed "down" the screen like a reflection seen from above
    const w = Math.min(1, (c.wl != null ? c.wl : carWet(c)) * 1.3); if (w < 0.08) continue;
    const spr = reflSprite(c.idx); if (!spr) continue;
    ctx.save(); ctx.translate(p.x + dnx * 1.5, p.y + dny * 1.5); ctx.rotate(head); ctx.scale(1, -1);
    ctx.globalAlpha = 0.26 * w; ctx.drawImage(spr, -L * 0.55, -Wd * 0.6, L * 1.1, Wd * 1.2); ctx.restore();
  }
  ctx.globalCompositeOperation = "lighter";
  for (const { c, p, head } of vis) {                  // the blinking rain light, smeared in the water
    const w = Math.min(1, (c.wl != null ? c.wl : carWet(c)) * 1.3); if (w < 0.08 || !(WXC.R > 0.06 || tyreClass(c.comp) !== "D")) continue;
    if (Math.floor(tw * 7 + c.idx * 0.37) % 2) continue;
    const rx = p.x - Math.cos(head) * L * 0.49, ry = p.y - Math.sin(head) * L * 0.49, len = 7 + 4 * w;
    const gr = ctx.createLinearGradient(rx, ry, rx + dnx * len, ry + dny * len); gr.addColorStop(0, `rgba(255,50,60,${(0.55 * w).toFixed(2)})`); gr.addColorStop(1, "rgba(255,30,40,0)");
    ctx.strokeStyle = gr; ctx.lineWidth = 1.1; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + dnx * len, ry + dny * len); ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
}
function drawPuddles() {
  const P = WET.puds; if (!WET.ready || !P) return;
  const k = Math.min(1, Math.max(0, (WATER.W - 0.5) / 0.4)); if (k < 0.04) return;
  const t = performance.now() / 1000, R = Math.min(1, WXC.R), rings = [[], [], []];
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < P.length; i++) {
    const [x, y, a, L, Wd] = P[i]; if (x + L < VIEWB.x0 || x - L > VIEWB.x1 || y + L < VIEWB.y0 || y - L > VIEWB.y1) continue;
    const ca = Math.cos(a), sa = Math.sin(a), u = Math.sin(t * 0.7 + i * 1.7) * 0.25;
    ctx.save(); ctx.translate(x + ca * L * u, y + sa * L * u); ctx.rotate(a);                  // the sky sliding over the water
    ctx.globalAlpha = k * (0.16 + 0.08 * Math.sin(t * 1.3 + i)); ctx.drawImage(PUD_SHEEN, -L * 0.32, -Wd * 0.3, L * 0.64, Wd * 0.45); ctx.restore();
    for (let g = 0; g < 2; g++) {                       // glints that come and go
      const ph = t * 0.8 + i * 3.1 + g * 1.9, cyc = Math.floor(ph), f = ph - cyc, hh = hash01(i * 13 + g * 7 + cyc);
      const gx = x + ca * (hh - 0.5) * L * 0.6 - sa * (hash01(cyc + i) - 0.5) * Wd * 0.5, gy = y + sa * (hh - 0.5) * L * 0.6 + ca * (hash01(cyc + i) - 0.5) * Wd * 0.5;
      ctx.globalAlpha = k * Math.sin(f * Math.PI) * 0.9; ctx.fillStyle = "#ffffff"; ctx.fillRect(gx - 0.25, gy - 0.25, 0.5, 0.5);
    }
    if (R > 0.05) {                                     // raindrops hitting the puddle
      const n = 2 + Math.round(R * 5);
      for (let j = 0; j < n; j++) {
        const per = 0.75 + hash01(i * 3 + j) * 0.5, ph = t / per + hash01(i + j * 11), cyc = Math.floor(ph), f = ph - cyc;
        const hu = hash01(i * 31 + j * 5 + cyc * 0.37) - 0.5, hv = hash01(i * 17 + j * 3 + cyc * 0.71) - 0.5;
        const rx = x + ca * hu * L * 0.7 - sa * hv * Wd * 0.6, ry = y + sa * hu * L * 0.7 + ca * hv * Wd * 0.6;
        rings[Math.min(2, Math.floor(f * 3))].push(rx, ry, 0.15 + f * 1.5);
      }
    }
  }
  ctx.globalCompositeOperation = "source-over";
  rings.forEach((arr, b) => {
    if (!arr.length) return;
    ctx.beginPath(); for (let j = 0; j < arr.length; j += 3) { ctx.moveTo(arr[j] + arr[j + 2], arr[j + 1]); ctx.arc(arr[j], arr[j + 1], arr[j + 2], 0, Math.PI * 2); }
    ctx.globalAlpha = k * [0.55, 0.32, 0.14][b]; ctx.strokeStyle = "#dfe9f6"; ctx.lineWidth = 0.14; ctx.stroke();
  });
  ctx.globalAlpha = 1;
}
const PUD_SHEEN = tintBlob(150, 180, 220);
// ---------- the chequered flag: the camera on the line, the crowd on its feet, fireworks, the cool-down lap ----------
var CELEB = { on: false, t0: 0, v: 0, baking: false, fw: [], nextFw: 0, results: 0 };
var FINCAM = { on: false, user: false, done: false, cx: 0, cy: 0, z: 0 };
function coolStep(c, h) {                              // after the flag: slow down, move off the line, a lap of honour
  if (!c.fin || c.dnf) return;
  if (!c.cool) c.cool = { s: c.s, v: Math.max(30, c.vNow || 60), t: 0, lat: c.lat || 0 };
  const C = c.cool; if (C.t > 30) return;
  C.v += (36 - C.v) * Math.min(1, h * 0.6); C.s = wrap(C.s + C.v * h); C.t += h;
  const i = idxAt(C.s), side = 1, e = (side > 0 ? LIM.eP[i] : LIM.eM[i]) * M_PER_PX;
  C.lat += (side * Math.max(0, e - 1.9) - C.lat) * Math.min(1, h * 0.5);
}
function coolPose(c) {
  const C = c.cool; if (!C) return null;
  const p = sample(C.s), hd = heading(C.s), off = C.lat / M_PER_PX;
  return { ...p, x: p.x - Math.sin(hd) * off, y: p.y + Math.cos(hd) * off, h: hd };
}
const coolAlpha = c => c.cool ? Math.max(0, Math.min(1, (30 - c.cool.t) / 2)) : 0;
function celebStep(dt) {
  const o = raceOrder(), lead = o.find(c => !c.done);
  // the leader on the last few hundred metres of the race: the TV cuts to the line
  if (!FINCAM.on && !FINCAM.done && FIN_N === 0 && lead && lead.lap >= RACE_LAPS && lead.s > LAP_M - 420 && racing() && !replay) {
    FINCAM.on = true; FINCAM.user = false; FINCAM.cx = cam.x; FINCAM.cy = cam.y; FINCAM.z = cam.zoom;
    if (PW.open) pwOpen(false);
    if (speedIdx !== 0) setSpeed(0);
  }
  if (FIN_N > 0 && !CELEB.on && !CELEB.results) {
    CELEB.on = true; CELEB.t0 = performance.now(); CELEB.nextFw = 0;
    if (!FINCAM.on && !FINCAM.done) { FINCAM.on = true; FINCAM.user = false; FINCAM.cx = cam.x; FINCAM.cy = cam.y; FINCAM.z = cam.zoom; }
    bakeStandingCrowd();
  }
  if (CELEB.on) {                                       // fireworks over the main straight
    const age = (performance.now() - CELEB.t0) / 1000;
    CELEB.nextFw -= dt;
    if (CELEB.nextFw <= 0) { launchFirework(); CELEB.nextFw = age < 14 ? 0.25 + Math.random() * 0.35 : 0.9 + Math.random() * 0.9; }
    CELEB.v = Math.floor(performance.now() / 170);
  }
  const now = performance.now() / 1000;
  CELEB.fw = CELEB.fw.filter(f => now - f.t0 < f.life + 0.8);
}
function finCamStep(dt) {                              // the camera holds the finish line until the classification is out
  if (!FINCAM.on || FINCAM.user) return;
  const p = sample(0), hd = heading(0), tx = p.x + Math.cos(hd) * 14 - Math.sin(hd) * 5, ty = p.y + Math.sin(hd) * 14 + Math.cos(hd) * 5;
  const k = Math.min(1, dt * 1.8);
  FINCAM.cx += (tx - FINCAM.cx) * k; FINCAM.cy += (ty - FINCAM.cy) * k; FINCAM.z += (Math.max(MAX_ZOOM * 0.95, Math.min(MAX_ZOOM, FINCAM.z)) - FINCAM.z) * k;
  cam.x = FINCAM.cx; cam.y = FINCAM.cy; cam.zoom = Math.max(cam.zoom, Math.min(FINCAM.z, MAX_ZOOM));
}
cv.addEventListener("pointerdown", () => { if (FINCAM.on) FINCAM.user = true; });
const FW_COLS = [["#ff3b3b", "#ffd0d0"], ["#ffd21f", "#fff4c2"], ["#2f9bff", "#d6ecff"], ["#22d38a", "#d2ffe9"], ["#ffffff", "#ffffff"], ["#b268ff", "#f0e2ff"], ["#ff8a1f", "#ffe1c4"], ["#c60b1e", "#ffc400"]];
function launchFirework() {                            // shot from behind the grandstand, bursting above it
  const x = 1560 + Math.random() * 400, y = 1150 + Math.random() * 30, bx = x + (Math.random() - 0.5) * 60, by = 1070 + Math.random() * 80;
  const n = 34 + ((Math.random() * 26) | 0), cols = FW_COLS[(Math.random() * FW_COLS.length) | 0], dirs = [];
  for (let k = 0; k < n; k++) { const a = k / n * 6.283 + Math.random() * 0.2, s = 0.75 + Math.random() * 0.35; dirs.push(Math.cos(a) * s, Math.sin(a) * s); }
  CELEB.fw.push({ x, y, bx, by, t0: performance.now() / 1000, rise: 0.55 + Math.random() * 0.3, life: 1.7 + Math.random() * 0.7, R: 34 + Math.random() * 28, cols, dirs, ring: Math.random() < 0.3 });
}
function drawFireworks() {
  if (!CELEB.fw.length) return;
  const now = performance.now() / 1000;
  ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  for (const f of CELEB.fw) {
    const a = now - f.t0;
    if (a < f.rise) {                                   // the rocket climbing towards the camera: a bright point with a trail
      const u = a / f.rise, e = 1 - (1 - u) * (1 - u), x = f.x + (f.bx - f.x) * e, y = f.y + (f.by - f.y) * e;
      ctx.globalAlpha = 0.9; ctx.strokeStyle = "#ffe9b0"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (f.x - f.bx) * 0.12, y + (f.y - f.by) * 0.12); ctx.stroke();
      continue;
    }
    const b = a - f.rise; if (b > f.life) continue;
    const u = b / f.life, r = f.R * (1 - Math.exp(-3.4 * b)), droop = b * b * 6;          // the burst grows and sags as it falls
    if (b < 0.18) { ctx.globalAlpha = (0.18 - b) / 0.18 * 0.55; ctx.drawImage(FW_FLASH, f.bx - f.R, f.by - f.R, f.R * 2, f.R * 2); }
    ctx.globalAlpha = Math.pow(1 - u, 1.3); ctx.fillStyle = f.cols[0]; ctx.strokeStyle = f.cols[0]; ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let k = 0; k < f.dirs.length; k += 2) {
      const dx = f.dirs[k] * (f.ring ? 1 : 0.6 + 0.4 * ((k * 7919) % 10) / 10), dy = f.dirs[k + 1] * (f.ring ? 1 : 0.6 + 0.4 * ((k * 7919) % 10) / 10);
      const x = f.bx + dx * r, y = f.by + dy * r + droop, tl = Math.min(r, 6) * (1 - u);
      ctx.moveTo(x, y); ctx.lineTo(x - dx * tl, y - dy * tl);
    }
    ctx.stroke();
    if (u > 0.45) {                                     // crackle at the end, in the second colour
      ctx.fillStyle = f.cols[1]; ctx.globalAlpha = (1 - u) * 1.6 * (Math.random() < 0.5 ? 1 : 0.3);
      for (let k = 0; k < f.dirs.length; k += 4) ctx.fillRect(f.bx + f.dirs[k] * r * 1.05 - 0.6, f.by + f.dirs[k + 1] * r * 1.05 + droop - 0.6, 1.2, 1.2);
    }
  }
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
}
const FW_FLASH = (() => { const c = mkCanvas(64, 64), g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,250,235,1)"); gr.addColorStop(0.35, "rgba(255,220,160,.35)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; })();
// the whole grandstand on its feet: two baked frames of every tile (arms up / arms pumping), swapped a few times a second
function bakeStandTile(t, v) {
  const S = FAN_BAKE, c = mkCanvas(FANS.T * S, FANS.T * S), g = c.getContext("2d"); g.setTransform(S, 0, 0, S, -t.x0 * S, -t.y0 * S);
  const P = fanPaths();
  for (const i of t.bake) {
    const x = FANS.x[i], y = FANS.y[i], fx = FANS.fx[i], fy = FANS.fy[i], ph = (FANS.phase[i] + v * 0.5) % 1;
    quad(P.at("seat", 0), x + fx * 0.2, y + fy * 0.2, -fy * (FAN_W / 2 + 0.04), fx * (FAN_W / 2 + 0.04), fx * (FAN_PITCH / 2 + 0.04), fy * (FAN_PITCH / 2 + 0.04));
    const look = Math.atan2(fy, fx) + (FANS.temper[i] - 0.65) * 0.8;
    fanFigure(P, i, x, y, fx, fy, 1.06 + 0.05 * ph, 0.55 + 0.45 * ph, Math.sin(ph * 6.283), look, false, 0.25 + 0.35 * ph);
  }
  fanFill(g, P); return c;
}
function bakeStandingCrowd() {
  if (CELEB.baking) return; CELEB.baking = true;
  const todo = []; FANS.tiles.forEach((t, k) => { t.k = k; if (!t.st) t.st = [null, null]; todo.push([t, 0], [t, 1]); });
  const vis = t => !(t.x0 > VIEWB.x1 || t.x0 + FANS.T < VIEWB.x0 || t.y0 > VIEWB.y1 || t.y0 + FANS.T < VIEWB.y0);
  todo.sort((a, b) => vis(b[0]) - vis(a[0]));            // the stands in view first
  (function step() {
    const t0 = performance.now();
    while (todo.length && performance.now() - t0 < 10) { const [t, v] = todo.shift(); if (!t.st[v]) t.st[v] = bakeStandTile(t, v); }
    if (todo.length) setTimeout(step, 16);
  })();
}

// ---------- final classification, broadcast style ----------
const FIRST = { ALO: "Fernando", TSU: "Yuki", STR: "Lance", MAG: "Kevin", WEH: "Pascal", ZHO: "Guanyu", KVY: "Daniil", GIO: "Antonio", NOR: "Lando", PIA: "Oscar", VER: "Max", HAD: "Isack", RUS: "George", ANT: "Kimi", LEC: "Charles", HAM: "Lewis",
  ALB: "Alex", SAI: "Carlos", LAW: "Liam", LIN: "Arvid", OCO: "Esteban", BEA: "Oliver", GAS: "Pierre", COL: "Franco", HUL: "Nico", BOR: "Gabriel", PER: "Sergio", BOT: "Valteri" };
const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const fmtRace = t => { const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t - Math.floor(t / 60) * 60; return (h ? `${h}:${String(m).padStart(2, "0")}` : `${m}`) + `:${s.toFixed(3).padStart(6, "0")}`; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function resultsData() {
  const grp = c => c.dnf ? 2 : ruleOK(c) ? 0 : 1;
  const order = [...cars].sort((a, b) => (grp(a) - grp(b)) || (progress(b) - progress(a)));
  const win = order.find(c => grp(c) === 0) || order[0];
  let cls = 0;
  return order.map(c => {
    const g = grp(c), pos = g === 0 ? ++cls : null, laps = c.fin ? c.finLaps : Math.max(0, c.lap - 1);
    let time, tag = "";
    if (g === 2) { time = "Abandono"; tag = c.dnfWhy || "sin gasolina"; }
    else if (g === 1) { time = "Descalificado"; tag = "un solo compuesto"; }
    else if (c === win) time = fmtRace(c.total);
    else if (laps < win.finLaps) { const d = win.finLaps - laps; time = `+${d} ${d > 1 ? "vueltas" : "vuelta"}`; }
    else time = "+" + (c.total - win.total).toFixed(3) + "s";
    return { c, g, pos, laps, time, tag, gain: pos ? (c.slot + 1) - pos : null, pts: pos && pos <= 10 ? POINTS[pos - 1] : 0,
      stopBest: c.pitLog && c.pitLog.length ? Math.min(...c.pitLog.map(p => p.d)) : null };
  });
}
function showResults() {
  if (isSeason()) sRaceDone(); else saveGame(true);
  const R = resultsData(), fl = FL, fcar = fl && cars.find(x => x.code === fl.code);
  const W = WXC, km = (RACE_LAPS === CIRCUIT.laps ? CIRCUIT.distKm : RACE_LAPS * CIRCUIT.lengthKm).toFixed(3).replace(".", ",");
  const tyres = c => (c.stints || []).map(s => `<img src="${TYRE_URL[s.c]}" alt="${COMP[s.c].name}">`).join("");
  const name = c => `<span class="rsn"><i style="background:${c.col};color:${textOn(c.col)}">${c.num}</i><span><em>${esc(FIRST[c.code] || "")}</em> <b>${esc(c.name)}</b></span></span>`;
  const gainCell = r => r.gain == null ? `<td class="gn"></td>` : `<td class="gn ${r.gain > 0 ? "up" : r.gain < 0 ? "dn" : ""}">${r.gain > 0 ? "▲" + r.gain : r.gain < 0 ? "▼" + (-r.gain) : "–"}</td>`;
  const rows = R.map((r, k) => {
    const c = r.c, isFl = fl && fl.code === c.code;
    return `<tr class="${k === 0 && r.pos === 1 ? "p1" : ""}${!c.ai ? " me" : ""}${r.g ? " out" : ""}">
      <td class="ps">${r.pos || (r.g === 1 ? "DSQ" : "DNF")}</td>${gainCell(r)}
      <td class="dv">${name(c)}</td>
      <td class="tm"><i style="background:${c.col}"></i>${teamLogo(c.team)}${esc(TEAMS[c.team].name)}</td>
      <td class="nm">${r.laps}</td>
      <td class="tt">${r.time}${r.tag ? `<small>${esc(r.tag)}</small>` : ""}</td>
      <td class="st"><span class="tys">${tyres(c)}</span></td>
      <td class="nm">${c.stops}</td>
      <td class="bl${isFl ? " fl" : ""}">${c.best != null ? fmt(c.best) : "—"}${isFl ? '<span class="flb" title="Vuelta rápida">VR</span>' : ""}</td>
      <td class="pt">${r.pts || ""}</td></tr>`;
  }).join("");
  const podium = R.filter(r => r.pos && r.pos <= 3).map(r => `<div class="pod p${r.pos}" style="--tc:${r.c.col}">${teamLogo(r.c.team, "plg")}<span class="pn">${r.pos}</span><div><em>${esc(FIRST[r.c.code] || "")}</em><b>${esc(r.c.name)}</b><span>${esc(TEAMS[r.c.team].name)} · ${r.time}</span></div></div>`).join("");
  const stop = R.filter(r => r.stopBest != null).sort((a, b) => a.stopBest - b.stopBest)[0];
  const gain = R.filter(r => r.gain != null).sort((a, b) => b.gain - a.gain)[0];
  const mine = R.filter(r => !r.c.ai);
  const card = (k, v, s, cls) => `<div class="rsc${cls ? " " + cls : ""}"><span class="k">${k}</span><b>${v}</b><span class="s">${s}</span></div>`;
  $("resBody").innerHTML = `
    <header class="rsh">
      <div class="rsbrand"><span><img class="pgm" src="assets/img/rtm_line.png" alt="Racing Team Manager"></span><span>Ronda ${GP_INFO.round} · Barcelona-Catalunya</span></div>
      <h2>Gran Premio de Barcelona-Catalunya</h2>
      <div class="rssub">Carrera · Clasificación final</div>
      ${IV_ON && !cars.ivR ? `<button class="rs-iv" id="resIv">🎤 ${L("Entrevista post-carrera", "Post-race interview")} ▶</button>` : ""}
      <div class="rsmeta"><span>Circuit de Barcelona-Catalunya</span><span>${RACE_LAPS} vueltas · ${km} km</span><span class="wx">${wxIcon(W.s, 14)} ${["Soleado", "Nublado", "Lluvia ligera", "Lluvia intensa"][W.s]} · ${W.air.toFixed(0)} °C</span></div>
    </header>
    <div class="rspod">${podium}</div>
    <div class="rscards">
      ${fl ? card("Vuelta rápida", fmt(fl.t), `${esc(fcar ? (FIRST[fcar.code] || "") + " " + fcar.name : fl.code)} · vuelta ${fl.lap}`, "fl") : ""}
      ${stop ? card("Parada más rápida", stop.stopBest.toFixed(2) + " s", `${esc(stop.c.name)} · ${esc(TEAMS[stop.c.team].name)}`) : ""}
      ${gain && gain.gain > 0 ? card("Más posiciones ganadas", "+" + gain.gain, `${esc(gain.c.name)} · de P${gain.c.slot + 1} a P${gain.pos}`) : ""}
      ${mine.map(r => card(`Tu piloto · ${esc(r.c.code)}`, r.pos ? "P" + r.pos : r.g === 1 ? "DSQ" : "DNF", `${r.pts} ${r.pts === 1 ? "punto" : "puntos"} · salió P${r.c.slot + 1}`, "me")).join("")}
    </div>
    <div class="rstw"><table class="rst">
      <thead><tr><th class="ps">Pos</th><th class="gn" title="Posiciones respecto a la salida">±</th><th class="dv">Piloto</th><th class="tm">Equipo</th><th class="nm">Vueltas</th><th>Tiempo / dif.</th><th class="st">Neumáticos</th><th class="nm">Paradas</th><th>Mejor vuelta</th><th class="pt">Pts</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  $("res").hidden = false; $("resBody").scrollTop = 0; $("msg").hidden = true;
  $("resNew").textContent = isSeason() ? L("Continuar la temporada ▶", "Continue the season ▶") : L("Nueva carrera ▶", "New race ▶");
}
$("resNew").onclick = () => { const go = () => { $("res").hidden = true; WK = null; if (isSeason()) { S.gp = null; saveGame(true); openHQ(); } else { saveGame(true); showChooser(); } }; if (IV_ON && !cars.ivR) ivPost(go); else go(); };
$("resClose").onclick = () => { if (IV_ON && !cars.ivR) ivPost(() => { }); else $("res").hidden = true; };
$("resBody").addEventListener("click", e => { if (e.target.closest("#resIv")) ivPost(showResults); });
function fxReset() {                                   // a new race: clean track, crowd seated, no helicopter, no results
  if (!RUB) return;
  rubberReset();
  CELEB.on = false; CELEB.results = 0; CELEB.fw.length = 0;
  FINCAM.on = false; FINCAM.user = false; FINCAM.done = false;
  HELI.on = false; HELI.next = 25;
  const r = document.getElementById("res"); if (r) r.hidden = true;
}
// all cars home: a few seconds more of celebration, then the classification
function finishRace() {
  if (CELEB.results) return;
  CELEB.results = setTimeout(() => {
    CELEB.on = false; FINCAM.on = false; FINCAM.done = true; showResults();
  }, CELEB.on ? 4500 : 600);
}
fxReset();

// ---------- giant screens facing the grandstands: the TV feed ----------
// Mostly live pictures: a chase camera wide enough to see several cars, the tarmac, the kerbs and the gravel, cutting
// between the battles on track every few seconds, with the running order ticking along the bottom. In between, the
// classification of the whole field.
const SCR_W = 256, SCR_H = 128, TV_SPAN = 190;          // TV_SPAN: map px across the picture (~120 m: a few cars in shot)
const SCREENS = [{ x: 1060, y: 1010, w: 44, h: 22 }, { x: 2228, y: 640, w: 40, h: 20 }, { x: 2030, y: 992, w: 36, h: 18 }]
  .map((s, k) => ({ ...s, k, cv: mkCanvas(SCR_W, SCR_H), t: 0, shot: null, shotT: 0, cam: { x: 0, y: 0, a: 0, cut: true }, last: [] }));
function tvShots() {                                    // what the director can cut to, best first
  const o = raceOrder().filter(c => !c.done && !c.gone && !c.dnf && !(SES && (c.gar || c.pit))), out = [];
  if (SES) { o.forEach(c => out.push({ c, ahead: null, pos: sesOrder().indexOf(c) + 1, score: (timed(c) ? 60 : 20) + (!c.ai ? 30 : 0) + Math.random() * 10 })); return out.sort((a, b) => b.score - a.score); }
  for (let k = 1; k < o.length; k++) {
    const gap = progress(o[k - 1]) - progress(o[k]);
    if (gap > 0 && gap < 70) out.push({ c: o[k], ahead: o[k - 1], pos: k + 1, score: 90 - gap + (k < 6 ? 25 : 0) + (!o[k].ai || !o[k - 1].ai ? 30 : 0) });
  }
  if (o[0]) out.push({ c: o[0], ahead: null, pos: 1, score: 40 });
  o.forEach((c, k) => { if (!c.ai) out.push({ c, ahead: k ? o[k - 1] : null, pos: k + 1, score: 35 }); });
  if (o.length) { const k = (Math.floor(performance.now() / 9000) * 7) % o.length; out.push({ c: o[k], ahead: k ? o[k - 1] : null, pos: k + 1, score: 20 }); }
  return out.sort((a, b) => b.score - a.score);
}
function tvPick(S) {                                    // a different shot from the other screens and from the last ones here
  const busy = SCREENS.filter(o => o !== S && o.shot).map(o => o.shot.c);
  const list = tvShots().filter(s => !busy.includes(s.c));
  const fresh = list.filter(s => !S.last.includes(s.c.idx));
  const pick = (fresh.length ? fresh : list)[Math.min((fresh.length ? fresh : list).length - 1, S.k % 2)] || null;
  if (pick) { S.last.push(pick.c.idx); if (S.last.length > 4) S.last.shift(); }
  S.shot = pick; S.shotT = performance.now(); S.cam.cut = true;
}
function tvPose(c) { const cl = c.fin && c.cool ? coolPose(c) : null; return cl ? { x: cl.x, y: cl.y, h: cl.h } : (() => { const p = carPos(c); return { x: p.x, y: p.y, h: dispHead(c) }; })(); }
function tvLive(S, g, dt) {
  const now = performance.now();
  if (!S.shot || now - S.shotT > 7000 || S.shot.c.done && !S.shot.c.cool || S.shot.c.gone) tvPick(S);
  if (!S.shot) return false;
  const c = S.shot.c, p = tvPose(c), ahead = 30, tx = p.x + Math.cos(p.h) * ahead, ty = p.y + Math.sin(p.h) * ahead, C = S.cam;
  if (C.cut) { C.x = tx; C.y = ty; C.a = p.h; C.cut = false; }
  const k = Math.min(1, dt * 3.2); C.x += (tx - C.x) * k; C.y += (ty - C.y) * k; C.a += Math.atan2(Math.sin(p.h - C.a), Math.cos(p.h - C.a)) * Math.min(1, dt * 2.2);
  const sc = SCR_W / TV_SPAN, R = Math.hypot(SCR_W, SCR_H) / 2 / sc + 4;
  const x0 = Math.max(0, Math.floor(C.x - R)), y0 = Math.max(0, Math.floor(C.y - R)), x1 = Math.min(MAP_W, Math.ceil(C.x + R)), y1 = Math.min(MAP_H, Math.ceil(C.y + R));
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#3a5c2c"; g.fillRect(0, 0, SCR_W, SCR_H);
  g.translate(SCR_W / 2, SCR_H / 2); g.rotate(-C.a); g.scale(sc, sc); g.translate(-C.x, -C.y);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "medium";
  if (mapImg.complete && mapImg.naturalWidth && x1 > x0 && y1 > y0) {
    const fx = mapImg.naturalWidth / MAP_W, fy = mapImg.naturalHeight / MAP_H;
    g.drawImage(mapImg, x0 * fx, y0 * fy, (x1 - x0) * fx, (y1 - y0) * fy, x0, y0, x1 - x0, y1 - y0);
    if (RUB.cv) { const s = RUB.S; g.globalAlpha = 0.78; g.drawImage(RUB.cv, x0 * s, y0 * s, (x1 - x0) * s, (y1 - y0) * s, x0, y0, x1 - x0, y1 - y0); g.globalAlpha = 1; }
    if (WET.ready && WET.W > 0.004) { const s = WET.S; g.drawImage(WET.comp, x0 * s, y0 * s, (x1 - x0) * s, (y1 - y0) * s, x0, y0, x1 - x0, y1 - y0); }
    if (SHADE_IMG.complete && SHADE_IMG.naturalWidth) { g.globalAlpha = Math.max(0, SUNK * 1.05 - 0.05); g.drawImage(SHADE_IMG, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); g.globalAlpha = 1; }
  }
  for (const t of FANS.tiles) {                         // the crowd in the grandstands behind the action
    if (t.x0 > x1 || t.x0 + FANS.T < x0 || t.y0 > y1 || t.y0 + FANS.T < y0) continue;
    const sv = CELEB && CELEB.on && t.st ? t.st[(CELEB.v + (t.k || 0)) & 1] : null, im = sv || t.cv;
    if (im) g.drawImage(im, t.x0, t.y0, FANS.T, FANS.T);
  }
  const L = CAR_LEN_M / M_PER_PX, Wd = CAR_W_M / M_PER_PX, shown = [];
  for (const o of cars) {
    if (!carSprites[o.idx] || o.gone || (o.fin && !(o.cool && coolAlpha(o) > 0))) continue;
    const q = tvPose(o); if (q.x < x0 - 10 || q.x > x1 + 10 || q.y < y0 - 10 || q.y > y1 + 10) continue;
    shown.push([o, q]);
  }
  for (const [o, q] of shown) {                          // shadows, then the cars
    const sh = carShadows[o.idx]; if (!sh) continue;
    g.save(); g.translate(q.x + SUN.x / M_PER_PX, q.y + SUN.y / M_PER_PX); g.rotate(q.h); g.globalAlpha = 0.5 * SUNK;
    g.drawImage(sh.cv, -L * sh.sx / 2, -Wd * sh.sy / 2, L * sh.sx, Wd * sh.sy); g.restore();
  }
  for (const [o, q] of shown) {
    g.save(); g.translate(q.x, q.y); g.rotate(q.h); g.globalAlpha = o.fin ? coolAlpha(o) : 1;
    const [bx, by, br] = bodyShift(o); g.translate(bx, by); g.rotate(br);
    g.drawImage(carSprites[o.idx], -L / 2, -Wd / 2, L, Wd); g.restore();
  }
  if (SC.state !== "parked" && scImg.complete) {        // the safety car, when it is out
    const sp = scPos(); if (sp.x > x0 && sp.x < x1 && sp.y > y0 && sp.y < y1) {
      const Ls = SC_LEN_M / M_PER_PX; g.save(); g.translate(sp.x, sp.y); g.rotate(SC.head); g.drawImage(scImg, -Ls / 2, -Ls * SC_AR / 2, Ls, Ls * SC_AR); g.restore(); }
  }
  g.restore();
  // overcast / rain: the picture gets darker like the circuit itself
  const R2 = Math.min(1, WXC.R), dk = Math.min(0.36, 0.08 * WXC.cloud / 100 + 0.2 * R2 + 0.06 * WATER.W);
  if (dk > 0.01) { g.globalCompositeOperation = "multiply"; g.fillStyle = `rgb(${Math.round(255 * (1 - dk))},${Math.round(255 * (1 - dk * 0.9))},${Math.round(255 * (1 - dk * 0.68))})`; g.fillRect(0, 0, SCR_W, SCR_H); g.globalCompositeOperation = "source-over"; }
  // TV graphics: who we are watching, the gap to the car ahead, the running order along the bottom
  const o = raceOrder(), pos = o.indexOf(c) + 1, lead = o[0];
  g.fillStyle = "rgba(8,10,14,.86)"; g.fillRect(6, 6, 104, S.shot.ahead ? 30 : 18);
  g.fillStyle = "#f4f5f2"; g.fillRect(6, 6, 18, 18); g.fillStyle = "#0d1014"; g.font = `800 11px ${DISP}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(pos, 15, 15.5);
  g.fillStyle = c.col; g.fillRect(27, 9, 3, 12);
  g.fillStyle = "#fff"; g.textAlign = "left"; g.font = `800 11px ${DISP}`; g.fillText(c.name, 34, 15.5);
  if (S.shot.ahead) {
    const a = S.shot.ahead, gap = Math.max(0, progress(a) - progress(c)) / Math.max(25, c.vNow || 40);
    g.fillStyle = "#cfd5db"; g.font = `700 8.5px ${DISP}`; g.fillText("A " + a.code, 10, 30); g.fillStyle = gap < 1 ? "#22d38a" : "#ffd21f"; g.font = `600 9px ${MONO}`; g.textAlign = "right"; g.fillText("+" + gap.toFixed(1) + "s", 106, 30);
  }
  g.textAlign = "right"; g.fillStyle = "rgba(8,10,14,.86)"; g.fillRect(SCR_W - 70, 6, 64, 18);
  g.fillStyle = Math.floor(now / 600) % 2 ? "#ff3b3b" : "#8a1f24"; g.beginPath(); g.arc(SCR_W - 62, 15, 3, 0, Math.PI * 2); g.fill();
  const lap = Math.min(RACE_LAPS, Math.max(1, ...cars.map(x => x.lap)));
  g.fillStyle = "#fff"; g.font = `700 9px ${MONO}`; g.fillText(SES ? `${SES.def.id} ${fmtMS(SES.def.dur - SES.t)}` : `V ${lap}/${RACE_LAPS}`, SCR_W - 10, 15.5);
  g.fillStyle = "rgba(8,10,14,.9)"; g.fillRect(0, SCR_H - 15, SCR_W, 15); g.fillStyle = "#e10600"; g.fillRect(0, SCR_H - 15, 4, 15);
  g.save(); g.beginPath(); g.rect(6, SCR_H - 15, SCR_W - 6, 15); g.clip();
  let txt = ""; if (SES) o.forEach((x, k) => { txt += `${k + 1} ${x.code} ${x.sbest == null ? "—" : k && lead.sbest != null ? "+" + (x.sbest - lead.sbest).toFixed(3) : fmt(x.sbest)}     `; }); else o.forEach((x, k) => { txt += `${k + 1} ${x.code}${k ? (x.pit ? " PIT" : " +" + Math.max(0, (progress(lead) - progress(x)) / Math.max(30, x.vNow || 50)).toFixed(1)) : ""}     `; });
  g.font = `700 9px ${MONO}`; g.textAlign = "left"; const tw = g.measureText(txt).width, off = (now / 1000 * 34) % tw;
  g.fillStyle = "#eef1f5"; g.fillText(txt, 8 - off, SCR_H - 7); g.fillText(txt, 8 - off + tw, SCR_H - 7);
  g.restore();
  return true;
}
function tvTable(S, g) {                                // the classification of the whole field, in two columns
  const W = SCR_W, H = SCR_H, o = raceOrder(), lead = o[0], lap = Math.min(RACE_LAPS, Math.max(1, ...cars.map(c => c.lap)));
  g.fillStyle = "#06080b"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#e10600"; g.fillRect(0, 0, W, 14);
  g.fillStyle = "#fff"; g.font = `800 9.5px ${DISP}`; g.textBaseline = "middle"; g.textAlign = "left"; g.fillText(SES ? `${SES.def.long.toUpperCase()} · TIEMPOS` : "CLASIFICACIÓN · GP DE BARCELONA", 6, 7.5);
  g.textAlign = "right"; g.font = `700 9px ${MONO}`; g.fillText(SES ? `${SES.def.id} ${fmtMS(SES.def.dur - SES.t)}` : `V ${lap}/${RACE_LAPS}`, W - 6, 7.5);
  const rows = Math.ceil(cars.length / 2), rh = (H - 18) / rows;
  o.forEach((c, k) => {
    const col = Math.floor(k / rows), r = k % rows, x = 4 + col * (W / 2), y = 16 + r * rh + rh / 2, w = W / 2 - 8;
    if (r % 2) { g.fillStyle = "#0e131a"; g.fillRect(x, y - rh / 2, w, rh); }
    if (!c.ai) { g.fillStyle = "rgba(255,210,31,.16)"; g.fillRect(x, y - rh / 2, w, rh); }
    g.fillStyle = "#8e98a3"; g.font = `700 8px ${MONO}`; g.textAlign = "right"; g.fillText(k + 1, x + 13, y + 0.5);
    g.fillStyle = c.col; g.fillRect(x + 17, y - 3.5, 2.5, 7);
    g.fillStyle = "#fff"; g.font = `800 9px ${DISP}`; g.textAlign = "left"; g.fillText(c.code, x + 23, y + 0.5);
    const gap = SES ? (c.sbest == null ? "—" : k === 0 || lead.sbest == null ? fmt(c.sbest) : "+" + (c.sbest - lead.sbest).toFixed(3)) : k === 0 ? "LÍDER" : c.dnf ? "OUT" : c.pit ? "PIT" : (() => { const d = progress(lead) - progress(c); return d > LAP_M ? `+${Math.floor(d / LAP_M)} V` : "+" + (d / Math.max(30, c.vNow || 50)).toFixed(1); })();
    g.textAlign = "right"; g.font = `600 8px ${MONO}`; g.fillStyle = c.pit ? "#ff5a68" : "#cfd5db"; g.fillText(gap, x + w - 3, y + 0.5);
  });
}
function screenContent(S, dt) {
  const g = S.cv.getContext("2d"), cyc = (performance.now() / 1000 + S.k * 9) % 30;
  g.textBaseline = "middle";
  if (cyc >= 22 || !racing() || !tvLive(S, g, dt)) tvTable(S, g);   // ~3/4 of the time live pictures
  g.fillStyle = "rgba(0,0,0,.16)"; for (let y = 0; y < SCR_H; y += 2) g.fillRect(0, y, SCR_W, 1);   // LED rows
}
function drawScreens() {
  const vis = SCREENS.filter(s => s.x + s.w > VIEWB.x0 && s.x - s.w < VIEWB.x1 && s.y + s.h * 2 > VIEWB.y0 && s.y - s.h < VIEWB.y1);
  if (!vis.length) return;
  const now = performance.now();
  for (const s of vis) {
    const every = s.w * cam.zoom * DPR < 60 ? 400 : 55;          // ~18 pictures a second; seldom when the screen is tiny on ours
    if (now - s.t > every) { const dt = Math.min(0.5, (now - (s.t || now)) / 1000); s.t = now; screenContent(s, dt); }
    const x0 = s.x - s.w / 2, y0 = s.y - s.h / 2;
    ctx.globalAlpha = 0.4 * SUNK; ctx.fillStyle = "#000";            // the screen stands ~8 m up: a long shadow
    ctx.beginPath(); ctx.moveTo(x0 + 2, y0 + s.h); ctx.lineTo(x0 + s.w + 2, y0 + s.h); ctx.lineTo(x0 + s.w + 9, y0 + s.h + 11); ctx.lineTo(x0 + 9, y0 + s.h + 11); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = "#1c2026"; ctx.fillRect(x0 + s.w * 0.22, y0 + s.h - 0.5, 1.2, 4); ctx.fillRect(x0 + s.w * 0.78 - 1.2, y0 + s.h - 0.5, 1.2, 4);   // legs
    ctx.fillStyle = "#0b0d10"; ctx.fillRect(x0 - 0.9, y0 - 0.9, s.w + 1.8, s.h + 1.8);
    ctx.fillStyle = "#2d333c"; ctx.fillRect(x0 - 0.9, y0 - 0.9, s.w + 1.8, 0.6);
    ctx.imageSmoothingQuality = "medium"; ctx.drawImage(s.cv, x0, y0, s.w, s.h); ctx.imageSmoothingQuality = "high";
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.06; ctx.drawImage(s.cv, x0 - 2, y0 - 1.5, s.w + 4, s.h + 3); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  }
}

function drawLines() {
  // ideal line, coloured by speed (green fast -> red slow)
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.lineWidth = 2.2 / cam.zoom; ctx.globalAlpha = 0.85;
  for (let i = 0; i < N; i += 2) {
    const j = (i + 2) % N, v = RL.v[i] * 3.6;
    ctx.strokeStyle = `hsl(${Math.max(0, Math.min(120, (v - 80) / 250 * 120))},90%,52%)`;
    ctx.beginPath(); ctx.moveTo(RL.x[i], RL.y[i]); ctx.lineTo(RL.x[j], RL.y[j]); ctx.stroke();
  }
  // last lap of the followed car
  // last lap of the followed car: solid white, same weight as the ideal line
  const t = cars[focus].lastTrace3;
  if (t && t.length > 6) {
    ctx.globalAlpha = 0.95; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.2 / cam.zoom;
    ctx.beginPath(); ctx.moveTo(t[0], t[1]); for (let k = 3; k < t.length; k += 3) ctx.lineTo(t[k], t[k + 1]); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function draw(poses) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#3a5c2c"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.translate(VW / 2, VH / 2); ctx.rotate(-cam.rot); ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  { // only the part of the map in view (much cheaper when zoomed in)
    const [hx, hy] = halfExt(cam.zoom), x0 = Math.max(0, Math.floor(cam.x - hx - 4)), y0 = Math.max(0, Math.floor(cam.y - hy - 4)), x1 = Math.min(MAP_W, Math.ceil(cam.x + hx + 4)), y1 = Math.min(MAP_H, Math.ceil(cam.y + hy + 4));
    if (mapImg.complete && mapImg.naturalWidth && x1 > x0 && y1 > y0) { const sx = mapImg.naturalWidth / MAP_W, sy = mapImg.naturalHeight / MAP_H; ctx.imageSmoothingEnabled = cam.zoom <= 2.21; ctx.drawImage(mapImg, x0 * sx, y0 * sy, (x1 - x0) * sx, (y1 - y0) * sy, x0, y0, x1 - x0, y1 - y0); ctx.imageSmoothingEnabled = true; }
    drawRubber(x0, y0, x1, y1);   // past the normal zoom cap (pit camera) the map stays crisp pixels
    if (WET.ready && WET.W > 0.004 && x1 > x0 && y1 > y0) {
      const S = WET.S, a = Math.floor(x0 * S), b = Math.floor(y0 * S), c2 = Math.ceil(x1 * S), d2 = Math.ceil(y1 * S);
      ctx.imageSmoothingQuality = "low"; ctx.drawImage(WET.comp, a, b, c2 - a, d2 - b, a / S, b / S, (c2 - a) / S, (d2 - b) / S); ctx.imageSmoothingQuality = "high";
    }
    drawPuddles();
    drawStaticShade(x0, y0, x1, y1);
  }
  drawMarbles();
  drawFans();
  drawMarshal();
  drawMarshals();
  drawScreens();
  drawGarages(0);
  if (showLimits) drawLimits();
  if (showLines) drawLines();
  const L = CAR_LEN_M / M_PER_PX, Wd = CAR_W_M / M_PER_PX;
  const top = poses ? replay.idx : focus;
  drawMarks(poses ? replay.t : simClock);
  drawParts(poses ? replay.t : simClock);
  const vis = [...cars].sort((a, b) => (a.idx === top) - (b.idx === top)).map(c => {
    const rp = poses && poses[c.idx];
    const cool = !rp && c.fin && c.cool && coolAlpha(c) > 0 ? coolPose(c) : null;     // after the flag: the lap of honour
    if (!carSprites[c.idx] || (c.fin && !rp && !cool) || (rp ? rp.gone : c.gone)) return null;   // finished or cleared away
    return { c, p: rp ? rp : cool || carPos(c), head: rp ? rp.h : cool ? cool.h : dispHead(c), crashed: rp ? rp.crashed : c.inc && c.inc.crashed };
  }).filter(Boolean);
  vis.forEach(({ c, p, crashed }) => {                // carbon and bodywork left around a crashed car (under every car)
    if (crashed) for (let k = 0; k < 18; k++) { const a = k * 2.39 + c.idx, r = (2.5 + (k * 7) % 9) / M_PER_PX * 0.6; ctx.fillStyle = k % 3 ? "#1d2126" : "#d7dce2"; ctx.fillRect(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 0.9, 0.6); }
  });
  drawReflections(vis);
  vis.forEach(({ c, p, head }) => { const st = !poses && crewCar(c), lf = st ? Math.max(st.lf, st.lr) : 0; drawShadow(carShadows[c.idx], p.x + lf * 0.45, p.y + lf * 0.65, head, L * (1 + 0.03 * lf), Wd * (1 + 0.03 * lf), 0.5); });
  if (poses) { const f = replay.frames[replay.k].sc; if (f) drawSC({ x: f[0], y: f[1], h: f[2] }, f[3]); }
  else { const sp = scPos(); drawSC({ x: sp.x, y: sp.y, h: SC.head }, SC.lights); }
  if (!poses) drawCrews(0);
  if (!poses) { drawWakes(vis); drawSparkGlow(vis); }
  vis.forEach(({ c, p, head }) => {
    const st = !poses && crewCar(c);
    if (st) { ctx.globalAlpha = 1; drawPitCar(c, p, head, L, Wd, st); }
    else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(head); if (!poses) { const [bx, by, br] = bodyShift(c); ctx.translate(bx, by); ctx.rotate(br); }   // body roll and pitch over the shadow
      ctx.globalAlpha = !poses && c.fin ? coolAlpha(c) : 1; ctx.drawImage(carSprites[c.idx], -L / 2, -Wd / 2, L, Wd); ctx.restore(); ctx.globalAlpha = 1; }
    if (L * cam.zoom < 11 && !(c.gar && c.gar.ph === "park")) { ctx.beginPath(); ctx.arc(p.x, p.y, 9 / cam.zoom, 0, Math.PI * 2); ctx.lineWidth = 2.5 / cam.zoom; ctx.strokeStyle = c.col; ctx.stroke(); }
  });
  if (!poses) { drawGarages(1); drawCrews(1); drawCrews(2); }
  drawPitRoof();
  drawSpray(poses ? replay.t : simClock);
  drawCloudShadows();
  drawHeli(true); drawHeli(false);
  weatherShade();
  { // rain lights: blinking red at the back of every car in the wet
    const tw = performance.now() / 1000, s = Math.max(2.6, 8 / cam.zoom);
    ctx.globalCompositeOperation = "lighter";
    vis.forEach(({ c, p, head }) => {
      if (!(WXC.R > 0.06 || tyreClass(c.comp) !== "D")) return;
      if (Math.floor(tw * 7 + c.idx * 0.37) % 2) return;
      const rx = p.x - Math.cos(head) * L * 0.49, ry = p.y - Math.sin(head) * L * 0.49;
      if (c.gar && rx > PIT_ROOF.x0 && rx < PIT_ROOF.x1 && ry > PIT_ROOF.y0 && ry < PIT_ROOF.y1) return;   // inside the garage
      ctx.globalAlpha = 0.95; ctx.drawImage(RAINLIGHT, rx - s / 2, ry - s / 2, s, s);
      ctx.fillStyle = "#ffe0e0"; ctx.fillRect(rx - 0.4, ry - 0.4, 0.8, 0.8);
    });
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  }
  drawFireworks();
  drawRainFx();
}

