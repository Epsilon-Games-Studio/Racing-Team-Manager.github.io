// ---------- the Team Principal: the player's own character (saved, used later in interviews and press conferences) ----------
// Each outfit is a pixel-art figure (assets/tp/<fig>.png) with a label map (assets/tp/<fig>_l.png: R = 1 skin, 2 trousers, 3 recolourable top; G = shading × 100).
// The face is drawn on top on a grid of 4 px art pixels, anchored at the head's top-left corner (hx, hy).
const TP_FIG = {gen1: [271, 806, 97, 7], gen2: [256, 804, 92, 6], gen4: [265, 804, 96, 6], gen5: [287, 805, 108, 7], mcl3: [263, 800, 96, 4], mcl4: [260, 800, 94, 4], mcl5: [281, 800, 105, 4], fer3: [264, 800, 96, 4], fer4: [260, 800, 93, 4], fer5: [281, 800, 106, 4], alp3: [263, 800, 96, 4], alp4: [259, 800, 93, 4], alp5: [282, 800, 106, 4], rbr3: [263, 800, 96, 4], rbr4: [260, 800, 94, 4], rbr5: [281, 800, 105, 4],
  mer3: [263, 800, 96, 4], mer4: [260, 800, 94, 4], mer5: [281, 800, 106, 4], wil3: [263, 800, 95, 4], wil4: [261, 800, 93, 4], wil5: [281, 800, 105, 4], aud3: [263, 800, 96, 4], aud4: [261, 800, 94, 4], aud5: [282, 800, 106, 4],
  haa3: [263, 800, 96, 4], haa4: [261, 800, 94, 4], haa5: [281, 800, 105, 4], rcb3: [263, 800, 96, 5], rcb4: [260, 800, 94, 4], rcb5: [282, 800, 106, 4]};
const TP_KIT = { mcl: 1, fer: 1, alp: 1, rbr: 1, mer: 1, wil: 1, aud: 1, haa: 1, rcb: 1 };   // teams whose kit is drawn so far
const TP_TOPS = [
  { k: "blazer", fig: "gen1", n: ["Chaqueta", "Blazer"], cols: [["#1e2a44", "Azul marino", "Navy"], ["#17181c", "Negro", "Black"], ["#3a3d44", "Antracita", "Charcoal"], ["#6b6f76", "Gris", "Grey"],
    ["#4a3a2c", "Marrón", "Brown"], ["#2f4536", "Verde", "Green"], ["#5a2330", "Granate", "Burgundy"]] },
  { k: "shirt", fig: "gen2", n: ["Camisa", "Shirt"], cols: [["#f4f5f7", "Blanca", "White"], ["#bcd4ee", "Celeste", "Light blue"], ["#efcbd1", "Rosa palo", "Pale pink"], ["#c9ccd1", "Gris perla", "Pearl grey"],
    ["#24324f", "Azul marino", "Navy"], ["#1a1b1f", "Negra", "Black"], ["team", "Color del equipo", "Team colour"]] },
  { k: "coat", fig: "gen5", n: ["Abrigo", "Coat"], cols: [["#1f2b46", "Azul marino", "Navy"], ["#17181c", "Negro", "Black"], ["#3b3e45", "Antracita", "Charcoal"], ["#4d5236", "Verde oliva", "Olive"],
    ["#a07e55", "Camel", "Camel"], ["#5b2430", "Granate", "Burgundy"]] },
  { k: "polo", fig: "gen4", n: ["Polo", "Polo"], cols: [["#17181c", "Negro", "Black"], ["#1f2b46", "Azul marino", "Navy"], ["#f2f3f5", "Blanco", "White"], ["#7d8188", "Gris", "Grey"],
    ["#2f4a3a", "Verde", "Green"], ["team", "Color del equipo", "Team colour"]] },
  { k: "tshirt", kit: 3, n: ["Camisa del equipo", "Team shirt"] },
  { k: "tpolo", kit: 4, n: ["Polo del equipo", "Team polo"] },
  { k: "tjacket", kit: 5, n: ["Chaqueta del equipo", "Team jacket"] }
];
const TP_PANTS = [["#c6ae88", "Beige", "Beige"], ["#a39684", "Piedra", "Stone"], ["#7c7f84", "Gris", "Grey"], ["#3a3c42", "Antracita", "Charcoal"], ["#17181b", "Negro", "Black"],
  ["#1e2840", "Azul marino", "Navy"], ["#5a4231", "Marrón", "Brown"], ["#555a3c", "Verde oliva", "Olive"]];
const TP_SKIN = ["#f6d6bf", "#eebf9b", "#dca57d", "#c68b61", "#a66d46", "#7e4f31", "#5a3722"];
const TP_HAIRC = [["#1d1a19", "Negro", "Black"], ["#3a281e", "Castaño oscuro", "Dark brown"], ["#5e3f2b", "Castaño", "Brown"], ["#8a6340", "Castaño claro", "Light brown"],
  ["#c9a15b", "Rubio", "Blond"], ["#e4d4a6", "Rubio platino", "Platinum"], ["#a34f28", "Pelirrojo", "Ginger"], ["#8c8c8c", "Canoso", "Grey"], ["#dcdcd8", "Blanco", "White"]];
const TP_EYEC = [["#4b2f1c", "Marrones", "Brown"], ["#6e5226", "Avellana", "Hazel"], ["#3f6a39", "Verdes", "Green"], ["#3b6fa8", "Azules", "Blue"], ["#6c7a86", "Grises", "Grey"], ["#3a8d8f", "Verdes azulados", "Blue-green"]];
const TP_OPT = {                                               // hair, beards and glasses: the user's models (assets/tp/hair_*, beard_*, glasses_*)
  hair: [["bald", "Sin pelo", "Bald"], ["buzz", "Rapado", "Buzz cut"], ["classic", "Clásico", "Classic"], ["messy", "Despeinado", "Messy"], ["spiky", "De punta", "Spiky"],
    ["wavy", "Media melena", "Shoulder length"], ["curly", "Rizado", "Curly"], ["receding", "Entradas", "Receding"], ["sides", "Calvo con laterales", "Bald on top"],
    ["rim", "Calvo con canas", "Bald, grey sides"], ["quiff", "Tupé corto", "Short quiff"], ["long", "Larga lisa", "Long straight"], ["bob", "Media melena con flequillo", "Bob with fringe"], ["bun", "Moño", "Bun"]],
  face: [["m", "Masculinos", "Masculine"], ["f", "Femeninos", "Feminine"]],
  beard: [["none", "Afeitado", "Clean shaven"], ["stubble", "Barba de 3 días", "Stubble"], ["moustache", "Bigote", "Moustache"], ["goatee", "Perilla", "Goatee"],
    ["short", "Barba corta", "Short beard"], ["full", "Barba poblada", "Full beard"]],
  glasses: [["none", "Sin gafas", "None"], ["glasses", "Gafas de ver", "Glasses"], ["sun", "Gafas de sol", "Sunglasses"]]
};
const TP_NAT = ["ES", "GB", "IT", "DE", "FR", "NL", "BE", "AT", "CH", "PT", "IE", "MC", "FI", "SE", "DK", "NO", "PL", "US", "CA", "MX", "BR", "AR", "AU", "NZ", "JP", "CN", "TH"];
const TP_DEF = { first: "", last: "", nat: "ES", age: 45, skin: 1, hair: "classic", hairCol: 1, beard: "none", eyeCol: 0, glasses: "none", top: "blazer", topCol: 0, pants: 0, face: "m", x: [],
  fh: 3, fhc: -1, fo: 0, ftc: 0, fpa: 0 };                       // feminine: head and hairstyle (the user's), hair colour (-1 her own), outfit, its colour, trousers
const TP_X = ["old", "ears", "lean", "smile"];                 // extra layers for likenesses: wrinkles, big ears, a lean face, a smile
let TP = (() => { let o; try { o = Object.assign({}, TP_DEF, JSON.parse(localStorage.getItem("rtm.tp") || "{}")); } catch (e) { o = Object.assign({}, TP_DEF); }
  for (const k of ["hair", "beard", "glasses", "face"]) if (!TP_OPT[k].some(v => v[0] === o[k])) o[k] = TP_DEF[k];   // saved with older options
  if (!(o.fh >= 0 && o.fh < 14)) o.fh = TP_DEF.fh; if (!(o.fo >= 0 && o.fo < 5)) o.fo = 0;
  delete o.eyes; return o; })();
const tpSave = () => { try { localStorage.setItem("rtm.tp", JSON.stringify(TP)); } catch (e) { } };
window.TEAM_PRINCIPAL = () => Object.assign({}, TP);          // for interviews and press conferences to come
// ---- figures
const TPF = {};
function tpTop(st = TP, t = DRIVERS[0].team) {
  let T = TP_TOPS.find(o => o.k === st.top) || TP_TOPS[0];
  if (T.kit && !TP_KIT[t]) T = TP_TOPS[0];
  return T;
}
const tpFigKey = (st = TP, t = DRIVERS[0].team) => { if (st.face === "f") return "fem" + Math.max(0, Math.min(4, st.fo | 0)); const T = tpTop(st, t); return T.kit ? `${t}${T.kit}` : T.fig; };
function tpLoad(fk, cb) {                                   // the figure and its label map, read into pixel arrays once
  const F = TPF[fk] || (TPF[fk] = { cbs: [], n: 0 });
  if (F.ready) { cb && cb(); return F; }
  if (cb) F.cbs.push(cb);
  if (/^fem\d$/.test(fk)) { if (!F.img) { F.img = 1; femLoad(() => { F.ready = true; F.bot = TP_FIG[fk][4]; F.cbs.splice(0).forEach(f => f()); }); } return F; }   // women: one shared set of sheets
  if (F.img) return F;
  const done = () => { if (++F.n < 2) return;
    const [w, h] = TP_FIG[fk], c = mkCanvas(w, h), g = c.getContext("2d", { willReadFrequently: true });
    try {
      g.drawImage(F.img, 0, 0, w, h); F.px = g.getImageData(0, 0, w, h).data;
      g.clearRect(0, 0, w, h); g.drawImage(F.lab, 0, 0, w, h); F.lb = g.getImageData(0, 0, w, h).data;
      for (let y = h - 1; y > h / 2 && !F.bot; y--) { let n = 0; for (let x = 0; x < w; x++) if (F.px[(y * w + x) * 4 + 3] > 128) n++; if (n > 2) F.bot = y + 1; }   // the soles
    } catch (e) { F.px = null; }
    F.ready = true; F.cbs.splice(0).forEach(f => f()); };
  F.img = new Image(); F.lab = new Image();
  [F.img, F.lab].forEach(im => { im.onload = done; im.onerror = done; });
  F.img.src = `assets/tp/${fk}.png`; F.lab.src = `assets/tp/${fk}_l.png`;
  return F;
}
// ---- colour helpers
function tpHsv(r, g, b) { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [((h / 6) % 1 + 1) % 1, mx ? d / mx : 0, mx]; }
function tpRgb(h, s, v) { const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][((i % 6) + 6) % 6]; }
const tpMix = (a, b, k) => { const A = hex2rgb(a), B = hex2rgb(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join(""); };
const tpShade = (a, k) => tpMix(a, k < 1 ? "#000000" : "#ffffff", k < 1 ? 1 - k : k - 1);
const TPLUT = {};
function tpLut(hex, skin) {                                    // shading byte → colour, keeping the folds and the light of the original
  const key = hex + (skin ? "s" : "c"); if (TPLUT[key]) return TPLUT[key];
  const [h, s, v] = tpHsv(...hex2rgb(hex).map(x => x / 255)), lut = new Uint8ClampedArray(768);
  for (let i = 0; i < 256; i++) {
    const k = i / 100; let nh = h, ns = s, nv;
    if (skin) { nv = v * Math.pow(k, .85); const d = Math.max(0, 1 - k); nh = h - d * .025; ns = Math.min(1, s * (1 + d * .35)); if (k > 1.04) ns *= Math.max(.45, 1 - (k - 1.04) * 2.2); }
    else { nv = Math.max(v, .09) * Math.pow(k, .95); const hi = Math.min(1, Math.max(0, (k - 1.12) / .7)); ns = s * (1 - .55 * hi); if (nv > 1) { ns *= Math.max(0, 1 - (nv - 1) * 2); nv = 1; } }
    const [R, G, B] = tpRgb(((nh % 1) + 1) % 1, Math.min(1, Math.max(0, ns)), Math.min(1, Math.max(0, nv)));
    lut[i * 3] = R * 255; lut[i * 3 + 1] = G * 255; lut[i * 3 + 2] = B * 255;
  }
  return (TPLUT[key] = lut);
}
function tpTopCol(st, t) { const T = tpTop(st, t); if (T.kit) return null; const c = (T.cols[Math.min(st.topCol, T.cols.length - 1)] || T.cols[0])[0]; return c === "team" ? TEAMS[t].col : c; }
// ---- the head: the user's bald model as the base face (assets/tp/head_base.png, labels: 1 skin, 4 iris, 5 brows; G = shading × 100),
// with the chosen hair, beard and glasses on top (R = coverage, G = shading, recoloured with the hair colour). All share a 420×470 frame:
// head top y 75, chin y 432, centre x 204. On the figure it replaces the blank head (grid anchored at hx, hy; 23 rows of 4 px, chin at row 22).
const TP_HR = [[5, 10], [3, 12], [2, 13], [1, 14], [1, 14], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [-1, 15], [-1, 16], [-1, 16], [-1, 16], [-1, 16], [0, 15], [1, 14], [1, 14], [1, 14], [2, 13], [2, 13], [2, 13], [2, 13]];
const TPH = { W: 420, H: 470, top: 75, chin: 432, cx: 204, lay: {}, n: 0, cbs: [], ready: false, cache: new Map() };
function tpHeadLoad(cb) {
  if (TPH.ready) { cb && cb(); return; }
  if (cb) TPH.cbs.push(cb);
  if (TPH.img) return;
  const names = ["head_base", "head_base_l", "head_base_f", "head_base_f_l", ...TP_OPT.hair.slice(1).map(o => "hair_" + o[0]), ...TP_OPT.beard.slice(1).map(o => "beard_" + o[0]), ...TP_X.flatMap(x => ["x_" + x, "x_" + x + "_l"]), ...TP_OPT.glasses.slice(1).map(o => "glasses_" + o[0])];
  TPH.img = {};
  const done = () => { if (++TPH.n < names.length) return;
    const c = mkCanvas(TPH.W, TPH.H), g = c.getContext("2d", { willReadFrequently: true }), read = im => { g.clearRect(0, 0, TPH.W, TPH.H); g.drawImage(im, 0, 0); return g.getImageData(0, 0, TPH.W, TPH.H).data; };
    try { names.forEach(n => { if (!n.startsWith("glasses_")) TPH.lay[n] = read(TPH.img[n]); }); } catch (e) { }
    TPH.ready = true; TPH.cbs.splice(0).forEach(f => f()); };
  names.forEach(n => { const im = new Image(); im.onload = im.onerror = done; im.src = `assets/tp/${n}.png`; TPH.img[n] = im; });
}
function tpHead(st = TP) {                                     // the head alone at full size: for the figure, the thumbnails and the press room
  if (!TPH.ready || !TPH.lay.head_base) return null;
  const key = [st.skin, st.hairCol, st.eyeCol, st.hair, st.beard, st.glasses, st.face || "m", (st.x || []).join("+")].join("|");
  if (TPH.cache.has(key)) return TPH.cache.get(key);
  const W = TPH.W, H = TPH.H, cv = mkCanvas(W, H), g = cv.getContext("2d"), id = g.createImageData(W, H), d = id.data;
  const fem = st.face === "f" && TPH.lay.head_base_f, hc = (TP_HAIRC[st.hairCol] || TP_HAIRC[1])[0];
  let B = fem ? TPH.lay.head_base_f : TPH.lay.head_base, Lb = fem ? TPH.lay.head_base_f_l : TPH.lay.head_base_l;
  const xs = (st.x || []).filter(n => TPH.lay["x_" + n] && TPH.lay["x_" + n + "_l"]);
  if (xs.length) { B = B.slice(); Lb = Lb.slice();                // extra layers: their pixels (and labels) replace the base; label 9 rubs a pixel out
    for (const n of xs) { const X = TPH.lay["x_" + n], XL = TPH.lay["x_" + n + "_l"];
      for (let i = 0; i < X.length; i += 4) { if (!X[i + 3]) continue; if (XL[i] === 9) { B[i + 3] = 0; Lb[i] = 0; continue; } B[i] = X[i]; B[i + 1] = X[i + 1]; B[i + 2] = X[i + 2]; B[i + 3] = 255; Lb[i] = XL[i]; Lb[i + 1] = XL[i + 1]; } } }
  const LS = tpLut(TP_SKIN[st.skin] || TP_SKIN[1], 1), LH = tpLut(hc, 0), LE = tpLut((TP_EYEC[st.eyeCol] || TP_EYEC[0])[0], 0), LP = tpLut(tpMix(TP_SKIN[st.skin] || TP_SKIN[1], "#b4475a", .5), 1);
  for (let i = 0; i < d.length; i += 4) {
    const l = Lb[i], s = Lb[i + 1] * 3, U = l === 1 ? LS : l === 5 ? LH : l === 4 ? LE : l === 6 ? LP : null;
    if (U) { d[i] = U[s]; d[i + 1] = U[s + 1]; d[i + 2] = U[s + 2]; } else { d[i] = B[i]; d[i + 1] = B[i + 1]; d[i + 2] = B[i + 2]; }
    d[i + 3] = B[i + 3];
  }
  for (const n of [st.hair !== "bald" && "hair_" + st.hair, st.beard !== "none" && "beard_" + st.beard]) {
    const Y = n && TPH.lay[n]; if (!Y) continue;
    for (let i = 0; i < d.length; i += 4) {
      const c = Y[i]; if (!c) continue;
      const a = c / 255, s = Y[i + 1] * 3;
      d[i] += (LH[s] - d[i]) * a; d[i + 1] += (LH[s + 1] - d[i + 1]) * a; d[i + 2] += (LH[s + 2] - d[i + 2]) * a; d[i + 3] = Math.max(d[i + 3], c);
    }
  }
  g.putImageData(id, 0, 0);
  if (st.glasses !== "none") { const im = TPH.img["glasses_" + st.glasses]; if (im && im.naturalWidth) g.drawImage(im, 0, 0); }
  TPH.cache.set(key, cv); if (TPH.cache.size > 40) TPH.cache.delete(TPH.cache.keys().next().value);
  return cv;
}
const TPB = new Map();
function tpBase(st, t) {                                       // the figure recoloured: skin, trousers and top (kept for the next few calls)
  const fk = tpFigKey(st, t), F = TPF[fk]; if (!F || !F.ready || !F.px) return null;
  const tc = tpTopCol(st, t), key = [fk, st.skin, st.pants, tc].join("|");
  if (TPB.has(key)) return TPB.get(key);
  const [w, h] = TP_FIG[fk], cv = mkCanvas(w, h), g = cv.getContext("2d");
  const id = g.createImageData(w, h), d = id.data, src = F.px, lb = F.lb;
  const L1 = tpLut(TP_SKIN[st.skin] || TP_SKIN[1], 1), L2 = tpLut((TP_PANTS[st.pants] || TP_PANTS[0])[0], 0), L3 = tc ? tpLut(tc, 0) : null;
  for (let i = 0; i < src.length; i += 4) {
    const l = lb[i], s = Math.min(255, lb[i + 1]) * 3, U = l === 1 ? L1 : l === 2 ? L2 : l === 3 ? L3 : null;
    if (U) { d[i] = U[s]; d[i + 1] = U[s + 1]; d[i + 2] = U[s + 2]; } else { d[i] = src[i]; d[i + 1] = src[i + 1]; d[i + 2] = src[i + 2]; }
    d[i + 3] = src[i + 3];
  }
  g.putImageData(id, 0, 0);
  TPB.set(key, cv); if (TPB.size > 10) TPB.delete(TPB.keys().next().value);
  return cv;
}
const TP_Z = 2;                                                // the figure is drawn at twice its pixel size so the new head keeps its detail
function tpCompose(st = TP, t = DRIVERS[0].team) {             // the full figure with the chosen colours and head
  if (st.face === "f") return femCompose(st, t);
  const b = tpBase(st, t), head = tpHead(st); if (!b || !head) return null;
  const Z = TP_Z, [w, h, hx, hy] = TP_FIG[tpFigKey(st, t)], cv = mkCanvas(w * Z, h * Z), g = cv.getContext("2d");
  g.imageSmoothingEnabled = false; g.drawImage(b, 0, 0, w * Z, h * Z);
  TP_HR.forEach(([a, c], y) => { const m = y < 19 ? 1 : 0; g.clearRect((hx + (a - m) * 4) * Z, (hy + y * 4) * Z, (c - a + 1 + 2 * m) * 4 * Z, 4 * Z); });   // the blank head out
  const k = 92 / (TPH.chin - TPH.top) * Z;                     // head top to chin = the 23 rows of the old head
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(head, (hx + 32) * Z - TPH.cx * k, hy * Z - TPH.top * k, TPH.W * k, TPH.H * k);
  cv.hx = hx * Z; cv.hy = hy * Z; cv.Z = Z; return cv;
}
// ---- women: the user's 5 outfits and 14 heads (plus Paola's own). One neck only, the outfit's: the heads come without neck,
// shoulders or t-shirt, the outfits without the mannequin's head, and the jaw of the head sits where the mannequin's chin was.
//   assets/tp/femb.webp + femb_l.webp: the outfits at the size they were drawn (labels R: 1 skin, 2 trousers, 3 top; G: shading × 100)
//   assets/tp/femh.webp + femh_l.webp: the heads at twice figure size (labels R: 5 hair; G: shading × 100), anchored at the jaw (ax, ay)
const FEM_B = { sf: .65, cw: 438, ch: 1365, c: [[0, 219, 283, 121, 1355], [438, 219, 283, 121, 1355], [876, 219, 283, 121, 1355], [1314, 219, 283, 121, 1355], [1752, 219, 284, 121, 1359]] };   // cell x, neck centre x, neck top y, skull top, soles
const FEM_H = { cw: 243, ch: 404, ax: 121, ay: 280, cols: 8, n: 15,
  skin: ["#dd8b65", "#f6af8c", "#f7b08c", "#f7ae89", "#ab6549", "#f6af8a", "#c57957", "#f5a985", "#f8ac88", "#f7ab87", "#f7ab87", "#a16045", "#f5a985", "#f4a884", "#f7ae89"],
  nat: [-1, 1, 0, 1, 0, 4, 0, 7, 6, 0, 1, 0, 3, 0, 1] };        // her own hair colour (index in TP_HAIRC; -1: no hair to colour)
const FEM_PAOLA = 14;
const FEM_FACES = [["Rapada", "Shaved"], ["Pixie", "Pixie cut"], ["Bob con flequillo", "Bob with fringe"], ["Larga ondulada", "Long waves"], ["Afro", "Afro"],
  ["Corto ladeado", "Side-swept short"], ["Trenzas largas", "Long braids"], ["Corto hacia atrás", "Swept back"], ["Media melena ondulada", "Wavy shoulder length"],
  ["Moño", "Bun"], ["Flequillo y gafas", "Fringe and glasses"], ["Trenzas pegadas", "Cornrows"], ["Media melena y gafas de sol", "Bob and sunglasses"], ["Corto y gafas de sol", "Short and sunglasses"]];
const FEM_OUTS = [
  { k: "blazer", n: ["Americana", "Blazer"], cols: TP_TOPS[0].cols, pants: 0 }, { k: "shirt", n: ["Camisa", "Shirt"], cols: TP_TOPS[1].cols, pants: 0 },
  { k: "pass", n: ["Camisa y acreditación", "Shirt and pass"], cols: TP_TOPS[1].cols, pants: 4 }, { k: "polo", n: ["Polo", "Polo"], cols: TP_TOPS[3].cols, pants: 4 },
  { k: "coat", n: ["Abrigo", "Coat"], cols: TP_TOPS[2].cols, pants: 0 }];
FEM_B.c.forEach(([, nx, ny, sk, so], j) => { TP_FIG["fem" + j] = [FEM_B.cw * FEM_B.sf, FEM_B.ch * FEM_B.sf, nx * FEM_B.sf - 32, sk * FEM_B.sf, so * FEM_B.sf]; });
const FEMX = { n: 0, ready: false, cbs: [], cache: new Map() };
function femLoad(cb) {
  if (FEMX.ready) { cb && cb(); return; }
  if (cb) FEMX.cbs.push(cb);
  if (FEMX.img) return;
  const names = ["femb", "femb_l", "femh", "femh_l"]; FEMX.img = {};
  const done = () => { if (++FEMX.n < names.length) return;
    const read = im => { const c = mkCanvas(im.naturalWidth, im.naturalHeight), g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height); };
    try { FEMX.b = read(FEMX.img.femb); FEMX.bl = read(FEMX.img.femb_l).data; FEMX.h = read(FEMX.img.femh); FEMX.hl = read(FEMX.img.femh_l).data; } catch (e) { FEMX.b = null; }
    FEMX.ready = true; FEMX.cbs.splice(0).forEach(f => f()); };
  names.forEach(n => { const im = new Image(); im.onload = im.onerror = done; im.src = `assets/tp/${n}.webp`; FEMX.img[n] = im; });
}
function femKeep(key, cv) { FEMX.cache.set(key, cv); if (FEMX.cache.size > 14) FEMX.cache.delete(FEMX.cache.keys().next().value); return cv; }
function femRecolour(src, lab, W, x0, y0, w, h, luts) {         // a cell of a sheet, its labelled parts recoloured (keeping the shading)
  const cv = mkCanvas(w, h), g = cv.getContext("2d"), id = g.createImageData(w, h), d = id.data, s = src.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((y0 + y) * W + x0 + x) * 4, o = (y * w + x) * 4, U = luts[lab[i]];
    if (U) { const k = Math.min(255, lab[i + 1]) * 3; d[o] = U[k]; d[o + 1] = U[k + 1]; d[o + 2] = U[k + 2]; } else { d[o] = s[i]; d[o + 1] = s[i + 1]; d[o + 2] = s[i + 2]; }
    d[o + 3] = s[i + 3];
  }
  g.putImageData(id, 0, 0); return cv;
}
function femBody(j, skin, top, pants) {
  const key = ["b", j, skin, top, pants].join("|"); if (FEMX.cache.has(key)) return FEMX.cache.get(key);
  return femKeep(key, femRecolour(FEMX.b, FEMX.bl, FEMX.b.width, FEM_B.c[j][0], 0, FEM_B.cw, FEM_B.ch, { 1: tpLut(skin, 1), 2: tpLut(pants, 0), 3: tpLut(top, 0) }));
}
function femHead(i, hc) {                                         // hc: the hair colour, or null for her own
  const key = ["h", i, hc || ""].join("|"); if (FEMX.cache.has(key)) return FEMX.cache.get(key);
  return femKeep(key, femRecolour(FEMX.h, FEMX.hl, FEMX.h.width, (i % FEM_H.cols) * FEM_H.cw, Math.floor(i / FEM_H.cols) * FEM_H.ch, FEM_H.cw, FEM_H.ch, hc ? { 5: tpLut(hc, 0) } : {}));
}
const femHairHex = (st, i) => st.fhc >= 0 && FEM_H.nat[i] >= 0 && st.fhc !== FEM_H.nat[i] ? (TP_HAIRC[st.fhc] || TP_HAIRC[1])[0] : null;
function femCompose(st = TP, t = DRIVERS[0].team) {              // her full figure, like tpCompose's (same Z, hx, hy)
  if (!FEMX.ready || !FEMX.b) return null;
  const j = clampN(st.fo | 0, 0, 4), i = clampN(st.fh | 0, 0, FEM_H.n - 1), O = FEM_OUTS[j], Z = TP_Z, BS = FEM_B.sf * Z;
  const tc = (O.cols[Math.min(st.ftc | 0, O.cols.length - 1)] || O.cols[0])[0], top = tc === "team" ? TEAMS[t || DRIVERS[0].team].col : tc;
  const pants = (TP_PANTS[st.fpa ?? O.pants] || TP_PANTS[O.pants])[0];
  const b = femBody(j, FEM_H.skin[i], top, pants), h = femHead(i, femHairHex(st, i)), [, nx, ny, sk] = FEM_B.c[j];
  const cv = mkCanvas(Math.round(FEM_B.cw * BS), Math.round(FEM_B.ch * BS)), g = cv.getContext("2d");
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(b, 0, 0, cv.width, cv.height);
  g.drawImage(h, Math.round(nx * BS - FEM_H.ax), Math.round((ny - 1) * BS - FEM_H.ay));
  cv.hx = (nx * FEM_B.sf - 32) * Z; cv.hy = sk * FEM_B.sf * Z; cv.Z = Z; cv.hh = (ny - 1 - sk) * FEM_B.sf; return cv;   // hh: head top to chin (his: 92)
}
function tpPortrait(cv, st = TP, t = DRIVERS[0].team, done) {  // head and shoulders, for cards (and the press room to come)
  tpLoad(tpFigKey(st, t), () => tpHeadLoad(() => {
    const f = tpCompose(st, t); if (!f || !cv) return;
    const g = cv.getContext("2d"), s = Math.min(cv.width / 120, cv.height / 132), Z = f.Z, q = (f.hh || 92) / 92;
    g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    g.drawImage(f, f.hx + (32 - 60 * q) * Z, f.hy - 18 * q * Z, 120 * q * Z, 132 * q * Z, (cv.width - 120 * s) / 2, 0, 120 * s, 132 * s);
    done && done();
  }));
}
const tpName = (st = TP) => `${st.first || ""} ${(st.last || "").toUpperCase()}`.trim();
const TP_FIRST = ["Carlos", "Marco", "James", "Luca", "Thomas", "Andrea", "Laura", "Sofía", "Pablo", "Daniel", "Elena", "Martin", "Jonathan", "Hugo", "Clara"];
const TP_LAST = ["Navarro", "Bianchi", "Walker", "Müller", "Laurent", "Visser", "Silva", "Novak", "Holm", "Moreno", "Fischer", "Russo", "Bennett", "Duarte"];
function tpRandom() {
  const r = a => a[Math.floor(Math.random() * a.length)], ri = n => Math.floor(Math.random() * n);
  Object.assign(TP, { skin: ri(TP_SKIN.length), hair: r(TP_OPT.hair)[0], hairCol: ri(TP_HAIRC.length), beard: Math.random() < .35 ? "none" : r(TP_OPT.beard)[0], eyeCol: ri(TP_EYEC.length),
    glasses: Math.random() < .65 ? "none" : r(TP_OPT.glasses.slice(1))[0], pants: ri(TP_PANTS.length) });
  const T = r(TP_TOPS.filter(o => !o.kit || TP_KIT[DRIVERS[0].team])); TP.top = T.k; TP.topCol = T.cols ? ri(T.cols.length) : 0;
  TP.fh = ri(FEM_FACES.length); TP.fhc = Math.random() < .5 ? -1 : ri(TP_HAIRC.length); TP.fo = ri(FEM_OUTS.length); TP.ftc = ri(FEM_OUTS[TP.fo].cols.length); TP.fpa = ri(TP_PANTS.length);
  if (!TP.first) TP.first = r(TP_FIRST); if (!TP.last) TP.last = r(TP_LAST);
}
// ---- the HQ presentation: its three pictures full screen, one after another, then the Team Principal's office
const INTRO = { i: -1, timer: 0, dur: 2000, fade: 800, slides: [], leaving: false };
function openIntro(before) {
  const t = DRIVERS[0].team, slides = hqSlides(t), imgs = imgsReady(slides.filter(s => s.src).map(s => s.src).concat(["assets/tp/office.jpg"]));
  tpLoad(tpFigKey(TP, t)); tpHeadLoad();
  gate(() => { const r = imgs(); return r === true && GARV.img.complete ? true : r === true ? .95 : r; },
    () => { before?.(); FRONT.team = t; showFront("intro"); }, L("Cargando la sede", "Loading the HQ"));
}
function renderIntro() {
  const t = FRONT.team || DRIVERS[0].team, T = TEAMS[t], [city, cc, fac] = HQ_INFO[t] || ["", "GB", ""];
  const ctry = (COUNTRY[cc] || ["", ""])[OPT.lang === "en" ? 1 : 0], slides = hqSlides(t);
  INTRO.slides = slides; INTRO.i = -1; INTRO.leaving = false;
  $("fxIntro").innerHTML = `<div class="ti" style="--tc:${T.col}">
    ${slides.map(sl => `<div class="hq-s">${sl.src ? `<img class="hq-im" src="${sl.src}" alt="${sl.lab}" draggable="false">` : ""}</div>`).join("")}
    <div class="ti-shade"></div>
    <div class="hq-bars ti-bars">${slides.map((sl, i) => `<span class="hq-bar"><i><u></u></i><span>${String(i + 1).padStart(2, "0")} · ${sl.lab}</span></span>`).join("")}</div>
    <div class="ti-top">${teamLogo(t, "ti-lg")}<div><span>${L("Bienvenido a", "Welcome to")}</span><b>${T.full}</b></div></div>
    <div class="ti-cap"><span class="k">${L("Sede central", "Headquarters")}</span><b>${city}</b><em>${flagSvg(cc)}${fac ? fac + " · " : ""}${ctry}</em></div>
    <div class="hq-lab ti-lab"></div>
    <button class="ti-skip" data-tiskip="1">${L("Saltar", "Skip")} ▶</button>
  </div>`;
  const els = [...$("fxIntro").querySelectorAll(".hq-s")];
  slides.forEach((sl, i) => { if (sl.cv) { const cv = sl.cv(); if (cv) { cv.classList.add("hq-im"); els[i].append(cv); sl.ar = cv.width / cv.height; } } });
  requestAnimationFrame(() => introShow(0));
}
function introShow(i) {
  const root = $("fxIntro"); if (!root || FRONT.v !== "intro") return;
  const els = [...root.querySelectorAll(".hq-s")]; if (i >= els.length) { introEnd(); return; }
  INTRO.i = i; const sl = INTRO.slides[i];
  const P = sl.m || HQ_MOVE[sl.k] || HQ_MOVE.air, a = P[0], b = P[1];   // just filling the screen (zoom 1 = no edges), drifting a little
  hqMove(els[i], Object.assign({}, sl, { m: [[1, a[1], a[2]], [1.012, a[1] + (b[1] - a[1]) * .07, a[2] + (b[2] - a[2]) * .07]] }), false, INTRO.dur + INTRO.fade + 400, "linear");
  els.forEach((e, j) => e.classList.toggle("on", j === i));
  const lab = root.querySelector(".ti-lab"); if (lab) { lab.textContent = sl.lab; lab.classList.remove("in"); void lab.offsetWidth; lab.classList.add("in"); }
  root.querySelectorAll(".hq-bar").forEach((b, j) => { b.classList.toggle("on", j === i); b.classList.toggle("done", j < i);
    const f = b.querySelector("u"); f.getAnimations().forEach(a => a.cancel());
    if (j === i) f.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: INTRO.dur, easing: "linear", fill: "forwards" }); });
  clearTimeout(INTRO.timer); INTRO.timer = setTimeout(() => introShow(i + 1), INTRO.dur);
}
function introStop() { clearTimeout(INTRO.timer); INTRO.timer = 0; document.querySelectorAll("#fxIntro .hq-im").forEach(m => m.getAnimations().forEach(a => a.cancel())); }
function introEnd() {
  if (INTRO.leaving || FRONT.v !== "intro") return; INTRO.leaving = true; introStop();
  const t = DRIVERS[0].team, go = () => { $("front").classList.remove("leave"); showFront("tp"); };
  const ready = () => { const F = TPF[tpFigKey(TP, t)]; return F && F.ready && TPH.ready ? true : .9; };
  $("front").classList.add("leave");
  setTimeout(() => gate(ready, go, L("Preparando tu oficina", "Preparing your office")), 380);
}
// ---- the office: create the Team Principal
const TPUI = { tab: "id", back: "team" };
function renderTP() {
  const t = FRONT.team || DRIVERS[0].team, T = TEAMS[t];
  $("fxTp").innerHTML = `<div class="tp" style="--tc:${T.col}">
    <div class="tp-bg" id="tpBg"><div class="tp-world"><img class="tp-office" src="assets/tp/office.jpg" alt="" draggable="false"><i class="tp-shade"></i>
      <div class="tp-fig" id="tpFig"><i class="tp-sh"></i><canvas id="tpCv"></canvas></div></div>
      <div class="tp-plate" id="tpPlate"><span class="k">Team Principal · ${T.full}</span><b id="tpNm"></b><em id="tpMeta"></em></div></div>
    <aside class="tp-pan">
      <div class="tp-h">${backBtn(TPUI.back)}<div class="tt"><span>${L("Oficina del Team Principal", "Team Principal's office")}</span><b>${L("Crea tu personaje", "Create your character")}</b></div>${teamLogo(t, "tp-lg")}</div>
      <div class="tp-tabs" role="tablist">${[["id", L("Identidad", "Identity")], ["look", L("Aspecto", "Look")], ["wear", L("Vestuario", "Outfit")]].map(([k, n]) => `<button role="tab" data-tptab="${k}" aria-selected="${TPUI.tab === k}">${n}</button>`).join("")}</div>
      <div class="tp-body" id="tpBody"></div>
      <div class="tp-f"><button class="tp-rnd" data-tprnd="1">⟳ ${L("Aleatorio", "Random")}</button><button class="tp-go" id="tpGo" data-tpgo="1">${L("Confirmar", "Confirm")} ▶</button></div>
    </aside></div>`;
  tpBody(); tpRefresh();
  if (window.ResizeObserver) { TPUI.ro?.disconnect(); TPUI.ro = new ResizeObserver(() => tpLayout()); TPUI.ro.observe($("fxTp").querySelector(".tp")); }
  requestAnimationFrame(tpLayout);
}
// where the Team Principal stands in the office picture (1920×1072): head-centre x, floor y under the shoes, and his height,
// in proportion with the desk beside him. The camera (crop and zoom of the picture) adapts to the screen; he never moves in the room.
const TP_SPOT = { x: 982, y: 1034, h: 580, W: 1920, H: 1072 };
function tpLayout() {
  const root = document.querySelector("#fxTp .tp"), bg = $("tpBg"), cv = $("tpCv"), fig = $("tpFig"); if (!root || !bg || !cv || FRONT.v !== "tp") return;
  const img = bg.querySelector(".tp-office"), pan = root.querySelector(".tp-pan").getBoundingClientRect(), B = bg.getBoundingClientRect(); if (B.width < 20 || B.height < 20) return;
  const side = pan.right < B.right - 120 && pan.bottom > B.top + B.height * .6;             // the panel sits at the left, over the picture
  const vx0 = side ? Math.max(0, pan.right - B.left) : 0, vw = B.width - vx0, vh = side ? B.height : Math.min(B.height, pan.top - B.top);
  const S = TP_SPOT, cover = Math.max(B.width / S.W, B.height / S.H);
  const s = Math.min(cover * 2.2, Math.max(cover, (side ? .62 : .8) * vh / S.h));
  const iw = S.W * s, ih = S.H * s;
  const ox = Math.max(0, Math.min(iw - B.width, S.x * s - (vx0 + vw * (side ? .42 : .36))));
  const oy = Math.max(0, Math.min(ih - B.height, S.y * s - vh * (side ? .95 : .94)));
  img.style.width = iw + "px"; img.style.height = ih + "px"; img.style.transform = `translate(${-ox}px,${-oy}px)`;
  root.style.setProperty("--pw", side ? Math.round(vx0 / B.width * 100) + "%" : "0%");
  const fk = cv.dataset.fk; if (!fk) return;
  const F = TPF[fk], [fw, fh, hx, hy] = TP_FIG[fk], bot = F?.bot || fh - 8, k = S.h * s / (bot - hy);
  const fx = S.x * s - ox - (hx + 32) * k, fy = S.y * s - oy - bot * k;
  Object.assign(fig.style, { left: fx + "px", top: fy + "px", width: fw * k + "px", height: fh * k + "px" });
  const pl = $("tpPlate"); if (!pl) return;                     // the name plate beside him
  const right = fx + fw * k + 18, room = B.width - 14 - right, leftRoom = fx - 18 - (vx0 + 14);
  pl.style.maxWidth = ""; const pw = Math.min(300, pl.offsetWidth || 260);
  let px, mw;
  if (room >= Math.min(pw, 150)) { px = right; mw = room; } else if (leftRoom >= 150) { mw = Math.min(300, leftRoom); px = fx - 18 - Math.min(pw, mw); } else { px = right; mw = Math.max(120, room); }
  pl.style.maxWidth = Math.min(300, mw) + "px"; pl.style.left = px + "px";
  pl.style.top = Math.max(10, Math.min(vh - pl.offsetHeight - 10, fy + (bot - hy) * k * .3)) + "px"; pl.style.visibility = "visible";
}
addEventListener("resize", () => { if (FRONT.v === "tp") tpLayout(); });
function tpBody() {
  const t = FRONT.team || DRIVERS[0].team, b = $("tpBody"); if (!b) return;
  const sw = (key, list, cur, label = c => "") => `<div class="tp-sw" role="radiogroup">${list.map((c, i) => { const col = Array.isArray(c) ? c[0] : c, nm = Array.isArray(c) ? L(c[1], c[2]) : label(col, i);
    return `<button role="radio" aria-checked="${i === cur}" data-tpset="${key}" data-v="${i}" title="${nm}" aria-label="${nm}" style="--c:${col === "team" ? TEAMS[t].col : col}">${col === "team" ? "<i>★</i>" : ""}</button>`; }).join("")}</div>`;
  const ch = (key, list, cur, thumbs) => `<div class="tp-ch${thumbs ? " th" : ""}">${list.map(([v, es, en]) => `<button data-tpset="${key}" data-v="${v}" aria-pressed="${cur === v}">${thumbs ? `<canvas data-th="${key}:${v}" width="120" height="120"></canvas>` : ""}<span>${L(es, en)}</span></button>`).join("")}</div>`;
  const row = (n, html) => `<div class="tp-r"><span class="tp-l">${n}</span>${html}</div>`;
  if (TPUI.tab === "id") {
    const nat = [...TP_NAT].sort((a, b) => (COUNTRY[a] || [a, a])[OPT.lang === "en" ? 1 : 0].localeCompare((COUNTRY[b] || [b, b])[OPT.lang === "en" ? 1 : 0], OPT.lang)).map(c => `<option value="${c}"${c === TP.nat ? " selected" : ""}>${(COUNTRY[c] || [c, c])[OPT.lang === "en" ? 1 : 0]}</option>`).join("");
    b.innerHTML = row(L("Nombre", "First name"), `<input class="tp-in" id="tpFirst" maxlength="18" autocomplete="off" placeholder="${L("Nombre", "First name")}" value="${esc(TP.first)}">`)
      + row(L("Apellidos", "Surname"), `<input class="tp-in" id="tpLast" maxlength="24" autocomplete="off" placeholder="${L("Apellidos", "Surname")}" value="${esc(TP.last)}">`)
      + row(L("Nacionalidad", "Nationality"), `<div class="tp-nat"><span id="tpFlag">${flagSvg(TP.nat)}</span><select class="tp-in" id="tpNat">${nat}</select></div>`)
      + row(L("Edad", "Age"), `<div class="tp-age"><button data-tpage="-1" aria-label="${L("Menos", "Less")}">−</button><b id="tpAge">${TP.age}</b><button data-tpage="1" aria-label="${L("Más", "More")}">+</button><span>${L("años", "years")}</span></div>`)
      + (IV_ON ? `<p class="tp-note">${L("Tu Team Principal aparecerá en las entrevistas y ruedas de prensa después de cada Gran Premio.", "Your Team Principal will appear in interviews and press conferences after every Grand Prix.")}</p>` : "");
  } else if (TPUI.tab === "look" && TP.face === "f") {             // feminine: the user's heads and hairstyles, and the hair colour
    const i = TP.fh | 0, nat = FEM_H.nat[i], natc = nat >= 0 ? TP_HAIRC[nat][0] : "#8a8f98";
    const faces = FEM_FACES.map(([es, en], k) => `<button data-tpset="fh" data-v="${k}" aria-pressed="${i === k}"><canvas data-th="fh:${k}" width="120" height="120"></canvas><span>${L(es, en)}</span></button>`).join("");
    const hc = nat < 0 ? `<p class="tp-note">${L("Este peinado no tiene pelo que teñir.", "This style has no hair to colour.")}</p>`
      : `<div class="tp-sw" role="radiogroup"><button role="radio" aria-checked="${TP.fhc < 0 || TP.fhc === nat}" data-tpset="fhc" data-v="-1" title="${L("Su color natural", "Natural colour")}" aria-label="${L("Su color natural", "Natural colour")}" style="--c:${natc}"><i>N</i></button>`
        + TP_HAIRC.map(([c, es, en], k) => k === nat ? "" : `<button role="radio" aria-checked="${TP.fhc === k}" data-tpset="fhc" data-v="${k}" title="${L(es, en)}" aria-label="${L(es, en)}" style="--c:${c}"></button>`).join("") + `</div>`;
    b.innerHTML = row(L("Rasgos", "Features"), ch("face", TP_OPT.face, "f", 1))
      + row(L("Cara y peinado", "Face and hairstyle"), `<div class="tp-ch th">${faces}</div>`)
      + row(L("Color de pelo", "Hair colour"), hc);
  } else if (TPUI.tab === "look") {
    b.innerHTML = row(L("Rasgos", "Features"), ch("face", TP_OPT.face, TP.face || "m", 1))
      + row(L("Piel", "Skin"), sw("skin", TP_SKIN, TP.skin, (c, i) => `${L("Tono", "Tone")} ${i + 1}`))
      + row(L("Peinado", "Hair"), ch("hair", TP_OPT.hair, TP.hair, 1))
      + row(L("Color de pelo", "Hair colour"), sw("hairCol", TP_HAIRC, TP.hairCol))
      + row(L("Vello facial", "Facial hair"), ch("beard", TP_OPT.beard, TP.beard, 1))
      + row(L("Color de ojos", "Eye colour"), sw("eyeCol", TP_EYEC, TP.eyeCol))
      + row(L("Gafas", "Glasses"), ch("glasses", TP_OPT.glasses, TP.glasses, 1));
  } else if (TP.face === "f") {                                     // feminine: the user's five outfits
    const j = TP.fo | 0, O = FEM_OUTS[j];
    b.innerHTML = row(L("Conjunto", "Outfit"), `<div class="tp-ch tops">${FEM_OUTS.map((o, k) => `<button data-tpset="fo" data-v="${k}" aria-pressed="${j === k}"><span>${L(...o.n)}</span></button>`).join("")}</div>`)
      + row(L(O.k === "blazer" ? "Color de la americana" : O.k === "coat" ? "Color del abrigo" : O.k === "polo" ? "Color del polo" : "Color de la camisa",
        O.k === "blazer" ? "Blazer colour" : O.k === "coat" ? "Coat colour" : O.k === "polo" ? "Polo colour" : "Shirt colour"), sw("ftc", O.cols, Math.min(TP.ftc | 0, O.cols.length - 1)))
      + row(L("Pantalón", "Trousers"), sw("fpa", TP_PANTS, TP.fpa ?? O.pants));
  } else {
    const T = tpTop(TP, t), kit = !!TP_KIT[t];
    const tops = TP_TOPS.map(o => { const dis = o.kit && !kit; return `<button data-tpset="top" data-v="${o.k}" aria-pressed="${T.k === o.k}"${dis ? " disabled" : ""}><span>${L(...o.n)}</span>${dis ? `<em>${L("Próximamente", "Coming soon")}</em>` : ""}</button>`; }).join("");
    b.innerHTML = row(L("Parte de arriba", "Top"), `<div class="tp-ch tops">${tops}</div>`)
      + (T.cols ? row(L("Color", "Colour"), sw("topCol", T.cols, Math.min(TP.topCol, T.cols.length - 1)))
        : row(L("Color", "Colour"), `<p class="tp-note">${L("Equipación oficial de", "Official kit of")} ${TEAMS[t].full}.</p>`))
      + row(L("Pantalón", "Trousers"), sw("pants", TP_PANTS, TP.pants));
  }
  tpThumbs();
}
function tpThumbs() {                                        // little heads showing each hairstyle, beard and glasses
  const t = FRONT.team || DRIVERS[0].team, fk = tpFigKey(TP, t);
  const femTh = cv => { const [k, v] = cv.dataset.th.split(":"); return k === "fh" || (k === "face" && v === "f"); };
  femLoad(() => {                                              // her faces: head-and-hair crops in the chosen hair colour
    if (!FEMX.b) return;
    document.querySelectorAll("#tpBody canvas[data-th]").forEach(cv => { if (!femTh(cv)) return;
      const [k, v] = cv.dataset.th.split(":"), i = k === "fh" ? +v : TP.fh | 0, h = femHead(i, femHairHex(TP, i)), g = cv.getContext("2d");
      g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingQuality = "high"; g.drawImage(h, 16, 52, 210, 210, 0, 0, cv.width, cv.height); });
  });
  tpHeadLoad(() => {
    document.querySelectorAll("#tpBody canvas[data-th]").forEach(cv => {
      if (femTh(cv)) return;
      const [k, v] = cv.dataset.th.split(":"), st = Object.assign({}, TP, { [k]: v }), h = tpHead(st); if (!h) return;
      const g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingQuality = "high";
      const [x, y, w] = k === "beard" ? [66, 196, 276] : k === "glasses" ? [56, 120, 296] : [24, 6, 360];   // the part of the head that changes
      g.drawImage(h, x, y, w, w, 0, 0, cv.width, cv.height);
    });
  });
}
function tpRefresh() {
  const t = FRONT.team || DRIVERS[0].team, cv = $("tpCv"); if (!cv) return;
  const nm = $("tpNm"), meta = $("tpMeta");
  if (nm) { const before = nm.textContent; nm.textContent = tpName() || L("Tu nombre", "Your name"); if (nm.textContent !== before && cv.dataset.fk) requestAnimationFrame(tpLayout); }
  if (meta) meta.innerHTML = `${flagSvg(TP.nat)}${(COUNTRY[TP.nat] || ["", ""])[OPT.lang === "en" ? 1 : 0]} · ${TP.age} ${L("años", "years")}`;
  const go = $("tpGo"); if (go) go.disabled = !(TP.first.trim() && TP.last.trim());
  tpLoad(tpFigKey(TP, t), () => tpHeadLoad(() => {
    const f = tpCompose(TP, t); if (!f || FRONT.v !== "tp") return;
    if (cv.width !== f.width || cv.height !== f.height) { cv.width = f.width; cv.height = f.height; }
    const g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(f, 0, 0);
    const fk = tpFigKey(TP, t); if (cv.dataset.fk !== fk) { cv.dataset.fk = fk; tpLayout(); }
  }));
}
function tpSet(k, v) {
  const prevTop = TP.top, prevFo = TP.fo, prevFh = TP.fh;
  if (k === "top") { const o = TP_TOPS.find(x => x.k === v); if (!o) return; if (TP.top !== v) TP.topCol = 0; TP.top = v; }
  else if (k === "fo") { const j = +v; if (!FEM_OUTS[j]) return; if ((TP.fo | 0) !== j) { TP.ftc = 0; TP.fpa = FEM_OUTS[j].pants; } TP.fo = j; }
  else if (k === "fh") { TP.fh = +v; if (TP.fhc === FEM_H.nat[TP.fh]) TP.fhc = -1; }
  else if (["skin", "hairCol", "eyeCol", "topCol", "pants", "fhc", "ftc", "fpa"].includes(k)) TP[k] = +v;
  else TP[k] = v;
  tpSave();
  const rebuild = k === "face" || (k === "top" && TP.top !== prevTop) || (k === "fo" && TP.fo !== prevFo) || (k === "fh" && TP.fh !== prevFh);
  if (rebuild) {
    const keep = document.activeElement?.dataset?.tpset === k ? `[data-tpset="${k}"][data-v="${v}"]` : null;
    tpBody();
    if (keep) document.querySelector(keep)?.focus({ preventScroll: true });
  } else {
    document.querySelectorAll(`#tpBody [data-tpset="${k}"]`).forEach(b => {
      const attr = b.getAttribute("role") === "radio" ? "aria-checked" : "aria-pressed";
      b.setAttribute(attr, String(b.dataset.v === String(TP[k])));
    });
  }
  const needThumbs = !rebuild && ["skin", "hairCol", "glasses", "fhc"].includes(k);
  TPUI.needThumbs = TPUI.needThumbs || needThumbs;
  cancelAnimationFrame(TPUI.raf);
  TPUI.raf = requestAnimationFrame(() => {
    tpRefresh();
    if (TPUI.needThumbs) { TPUI.needThumbs = false; tpThumbs(); }
  });
}
function tpConfirm() {
  if (!(TP.first.trim() && TP.last.trim())) { const i = $("tpFirst") || null; if (!i) { TPUI.tab = "id"; renderTP(); } (TP.first.trim() ? $("tpLast") : $("tpFirst"))?.focus(); return; }
  TP.first = TP.first.trim(); TP.last = TP.last.trim(); tpSave();
  if (FRONT.leaving) return; FRONT.leaving = true;
  GAME.on = true; if (GAME.mode === "season" && !S) { sNew(DRIVERS[0].team); sApply(); }
  $("front").classList.add("leave");
  setTimeout(() => openHQ(() => { FRONT.leaving = false; $("front").classList.remove("leave"); }), 380);
}
function tpClick(e) {
  const tab = e.target.closest("[data-tptab]"); if (tab) { TPUI.tab = tab.dataset.tptab; document.querySelectorAll("[data-tptab]").forEach(b => b.setAttribute("aria-selected", b === tab)); tpBody(); return true; }
  const s = e.target.closest("[data-tpset]"); if (s) { if (!s.disabled) tpSet(s.dataset.tpset, s.dataset.v); return true; }
  const a = e.target.closest("[data-tpage]"); if (a) { TP.age = Math.max(25, Math.min(80, TP.age + +a.dataset.tpage)); tpSave(); $("tpAge").textContent = TP.age; tpRefresh(); return true; }
  if (e.target.closest("[data-tprnd]")) { tpRandom(); tpSave(); tpBody(); tpRefresh(); return true; }
  if (e.target.closest("[data-tpgo]")) { tpConfirm(); return true; }
  if (e.target.closest("[data-tiskip]")) { introEnd(); return true; }
  if (e.target.closest("[data-tpedit]")) { TPUI.back = "hq"; TPUI.tab = "id"; showFront("tp"); return true; }
  if (FRONT.v === "intro" && e.target.closest(".ti")) { introShow(INTRO.i + 1); return true; }
  return false;
}
function tpInput(e) {
  const id = e.target.id;
  if (id === "tpFirst") TP.first = e.target.value; else if (id === "tpLast") TP.last = e.target.value;
  else if (id === "tpNat") { TP.nat = e.target.value; const f = $("tpFlag"); if (f) f.innerHTML = flagSvg(TP.nat); }
  else return;
  tpSave(); tpRefresh();
}
function hqTpCard(t) {                                          // the HQ sidebar: who runs the team
  return `<div class="hq-tp"><canvas id="hqTpCv" width="120" height="132" aria-hidden="true"></canvas>
    <div class="tx"><span>Team Principal</span><b>${esc(tpName() || "—")}</b><em>${flagSvg(TP.nat)}${(COUNTRY[TP.nat] || ["", ""])[OPT.lang === "en" ? 1 : 0]} · ${TP.age} ${L("años", "years")}</em></div>
    <button class="ed" data-tpedit="1">${L("Editar", "Edit")}</button></div>`;
}
