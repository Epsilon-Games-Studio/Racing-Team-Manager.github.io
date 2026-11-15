// =====================================================================================================
// ---------- SEASON MODE: the car seen from the side, the wind tunnel, the car design ----------
// =====================================================================================================
// where each part sits on assets/parts/side.webp (% of the picture); the airflow picture holds the same car a little smaller
const SIDE_AR = 1100 / 242, FLOW_AR = 1300 / 278, FLOW_BOX = [4.34, 92.3, 9.43, 100];
const PART_AT = { fw: [8, 78], ch: [38, 44], su: [31, 57], br: [23, 72], sp: [47, 52], fl: [56, 88], pu: [63, 30], gb: [82, 55], rw: [93, 22] };
const flowAt = ([x, y]) => [FLOW_BOX[0] + x / 100 * (FLOW_BOX[1] - FLOW_BOX[0]), FLOW_BOX[2] + y / 100 * (FLOW_BOX[3] - FLOW_BOX[2])];
// ---- the wind tunnel, alive: the car, the streamlines flowing past it, the forces and the figures of the session
const AERO_P = ["fw", "fl", "sp", "rw"];
function carAero(st) {                                            // the whole car's aerodynamic figures, from its characteristics
  const g = k => st[k] ?? 75, load = g("hs") * .42 + g("ms") * .33 + g("ls") * .15 + g("dirty") * .10;
  const cl = 4 + (load - 75) * .035, cd = 1.08 - (g("top") - 75) * .006 + (g("cool") - 75) * .0015, bal = 45 + (g("ms") - g("hs")) * .08 + (g("ls") - 75) * .03;
  return { cl, cd, eff: cl / cd, bal, vmax: 318 + (g("top") - 75) * 1.1, fr: cl * bal / 100, rr: cl * (1 - bal / 100) };
}
function aeroParts() {                                            // where each aero part stands: spec on the car, in the tunnel, on the drawing board
  return AERO_P.map(p => {
    const u = S.units.find(x => x.id === S.fit[0][p]), on = u ? u.n : 1, tun = S.proj.find(x => x.kind === "test" && x.p === p), dev = S.proj.find(x => x.kind === "dev" && x.p === p);
    const ready = (S.specs[p] || []).filter(x => x && x.n > on && x.st !== "design" && x.st !== "testing").map(x => x.n);
    return { p, on, tun, dev, ready: ready.length ? Math.max(...ready) : 0 };
  });
}
function flowHero(o = {}) {
  const at = o.part ? flowAt(PART_AT[o.part] || [50, 50]) : null, D = o.delta || null;
  let A = o.st ? carAero(o.st) : null;
  if (A && D && D.cl) A = { ...A, cl: D.cl, cd: D.cd, eff: D.cl / D.cd, bal: D.bal, fr: D.cl * D.bal / 100, rr: D.cl * (1 - D.bal / 100) };   // the car as it would be with the part
  const hot = D ? (D.df >= 0 ? " up" : " dn") : "";
  const spd = A ? (1.25 - (A.vmax - 300) / 200).toFixed(2) : "1.1";
  // the forces on the car: downforce over each axle, drag behind it
  const fa = flowAt([23, 56]), ra = flowAt([86, 56]), da = flowAt([64, 1]);
  const forces = A && !o.small ? `<span class="af-f" style="left:${fa[0]}%;top:${fa[1]}%;--h:${(A.fr * 13).toFixed(1)}"><i></i><b data-jit="${A.fr.toFixed(3)}" data-dp="2">${A.fr.toFixed(2)}</b><em>${L("Carga del.", "Front load")}</em></span>
      <span class="af-f" style="left:${ra[0]}%;top:${ra[1]}%;--h:${(A.rr * 13).toFixed(1)}"><i></i><b data-jit="${A.rr.toFixed(3)}" data-dp="2">${A.rr.toFixed(2)}</b><em>${L("Carga tras.", "Rear load")}</em></span>
      <span class="af-d" style="left:${da[0]}%;top:${da[1]}%;--w:${(A.cd * 4.2).toFixed(1)}"><i></i><b data-jit="${A.cd.toFixed(3)}" data-dp="3">${A.cd.toFixed(3)}</b><em>${L("Resistencia", "Drag")}</em></span>` : "";
  // the aero parts: the spec on the car, and what is being designed or tested
  const marks = o.chips && S && S.units && S.units.length ? aeroParts().map(x => { const [mx, my] = flowAt(PART_AT[x.p]), st = x.tun ? "tun" : x.dev ? "dev" : x.ready ? "rdy" : "";
      return `<span class="af-m ${st}${my < 45 ? " bl" : ""}" style="left:${mx}%;top:${my}%"><i>S${x.on}</i>${x.tun ? `<u>S${x.tun.n} · ${L("túnel", "tunnel")}</u>` : x.dev ? `<u>S${x.dev.n} · CFD</u>` : x.ready ? `<u>S${x.ready} ${L("lista", "ready")}</u>` : ""}</span>`; }).join("") : "";
  const stage = `<div class="aflo-ar">
      <div class="aflo-car" style="left:${FLOW_BOX[0]}%;top:${FLOW_BOX[2]}%;width:${FLOW_BOX[1] - FLOW_BOX[0]}%;height:${FLOW_BOX[3] - FLOW_BOX[2]}%"><img src="assets/parts/side.webp" alt="" draggable="false"></div>
      <canvas class="aflo-cv" aria-hidden="true" data-spd="${A ? (1 + (A.vmax - 320) / 120).toFixed(2) : "1"}" data-tw='${JSON.stringify({ q: o.st ? Object.fromEntries(Object.entries(twScores(o.st, o.part, D ? D.df * .08 : 0)).map(([k, v]) => [k, +v.toFixed(3)])) : null, hot: o.part || null })}'></canvas>
      ${forces}${marks}
      ${at ? `<span class="aflo-pt${hot}${at[0] < 24 ? " al" : at[0] > 76 ? " ar" : ""}" style="left:${at[0]}%;top:${at[1]}%"><i></i>${o.lab || D ? `<b>${o.lab || ""}${D ? ` <em class="${D.df >= 0 ? "gd" : "bd"}">${D.df >= 0 ? "+" : ""}${D.df.toFixed(1)} % ${L("carga", "load")}</em>` : ""}</b>` : ""}</span>` : ""}</div>`;
  const hud = A && o.hud ? `<div class="aflo-hud">
      ${[[L("Carga · CL·A", "Downforce · CL·A"), A.cl, 3, D ? D.df : null, "%"], [L("Resistencia · CD·A", "Drag · CD·A"), A.cd, 3, D ? D.dr : null, "%", 1], [L("Eficiencia · L/D", "Efficiency · L/D"), A.eff, 2], [L("Balance delantero", "Front balance"), A.bal, 1, null, "", 0, " %"], [L("Velocidad punta", "Top speed"), A.vmax, 0, null, "", 0, " km/h"]]
        .map(([k, v, dp, dl, u, inv, sfx]) => `<div class="ah"><span>${k}</span><b><i data-jit="${v.toFixed(4)}" data-dp="${dp}">${v.toFixed(dp)}</i>${sfx || ""}</b>${dl != null ? `<em class="${(inv ? -dl : dl) >= 0 ? "gd" : "bd"}">${dl >= 0 ? "+" : ""}${dl.toFixed(1)} ${u}</em>` : ""}</div>`).join("")}</div>` : "";
  return `<div class="aflo dyn${o.scan ? " scan" : ""}${o.small ? " sm" : ""}${o.tag || o.big ? " hd" : ""}" style="--ar:${FLOW_AR};--spd:${spd}s"><div class="aflo-st">${stage}</div>
    ${o.tag ? `<span class="aflo-tag"><i class="rec"></i>${o.tag}</span>` : ""}${o.big ? `<span class="aflo-big">${o.big}</span>` : ""}
    ${o.st ? `<span class="aflo-lg"><i></i><em>${L("Peor que los rivales", "Worse than rivals")}</em><em>${L("mejor", "better")}</em></span>` : ""}</div>${hud}`;
}
// ---- the wind tunnel's air, generated: streamlines traced round the car's own silhouette (assets/parts/side.webp),
// ---- coloured by how each zone of the car performs against the rivals (green good, yellow, orange, red bad) and always moving
const TW = { prof: null, loading: false, raf: 0, N: 240 };
function twProfile() {                                            // the car's top and bottom edge, column by column, in the tunnel's coordinates
  if (TW.prof || TW.loading) return TW.prof; TW.loading = true;
  const im = new Image(); im.onload = () => {
    const W = 440, H = Math.round(W / SIDE_AR), c = mkCanvas(W, H), g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(im, 0, 0, W, H);
    const d = g.getImageData(0, 0, W, H).data, N = TW.N, top = new Float32Array(N).fill(2), bot = new Float32Array(N).fill(-1);
    const [x0, x1, y0, y1] = FLOW_BOX.map(v => v / 100);
    for (let x = 0; x < W; x++) { let t = -1, b = -1; for (let y = 0; y < H; y++) if (d[(y * W + x) * 4 + 3] > 60) { if (t < 0) t = y; b = y; }
      if (t < 0) continue; const u = x0 + (x + .5) / W * (x1 - x0), i = Math.round(u * (N - 1)); if (i < 0 || i >= N) continue;
      top[i] = Math.min(top[i], y0 + t / H * (y1 - y0)); bot[i] = Math.max(bot[i], y0 + b / H * (y1 - y0)); }
    TW.prof = { top, bot }; TW.loading = false; TW.gen = (TW.gen || 0) + 1;
  };
  im.src = "assets/parts/side.webp"; return null;
}
function twSmooth(a, look, rad, fill) {                           // the air feels an obstacle before it reaches it, and flows round it smoothly
  const N = a.length, m = new Float32Array(N), o = new Float32Array(N);
  for (let i = 0; i < N; i++) { let v = fill; for (let j = Math.max(0, i - 3); j <= Math.min(N - 1, i + look); j++) v = fill > 1 ? Math.min(v, a[j]) : Math.max(v, a[j]); m[i] = v; }
  for (let i = 0; i < N; i++) { let s = 0, w = 0; for (let j = -rad; j <= rad; j++) { const k = clampN(i + j, 0, N - 1), q = Math.exp(-(j * j) / (rad * rad / 2)); s += m[k] * q; w += q; } o[i] = s / w; }
  return o;
}
// streamlines drawn along this car's own contours (coordinates in % of assets/parts/side.webp), as smooth splines
const TW_TOP = [[-12, 52], [0, 55], [7, 53], [13, 45], [19, 31], [24, 29], [29, 32], [35, 36], [40, 25], [46, 15], [52, 9], [56, -1], [61, -1], [66, 7], [73, 9], [79, 24], [84, 22], [89, 12], [96, 6], [104, 9], [114, 11]];
const TW_PATHS = [
  // over the front wing, then into the front tyre (the air carries on along the side)
  { k: "wing", fo: .22, p: [[-12, 61], [0, 61], [6, 57], [12, 52], [17, 50], [20, 53]] },
  { k: "wing", fo: .22, p: [[-12, 69], [1, 69], [7, 66], [12, 62], [17, 61], [20, 64]] },
  // along the sidepods and the floor edge, rising into the rear (coke bottle, beam wing, diffuser)
  { k: "side", fi: .14, p: [[31, 43], [40, 43], [52, 40], [64, 41], [75, 45], [83, 43], [91, 38], [102, 37], [114, 38]] },
  { k: "side", fi: .14, p: [[33, 50], [44, 50], [56, 47], [68, 49], [78, 53], [86, 50], [95, 46], [114, 46]] },
  { k: "side", fi: .14, p: [[35, 58], [48, 62], [60, 64], [72, 63], [80, 58], [88, 53], [100, 51], [114, 51]] },
  { k: "side", fi: .16, p: [[37, 73], [50, 77], [62, 79], [72, 77], [80, 70], [87, 62], [97, 58], [114, 57]] },
  { k: "side", fi: .16, p: [[39, 80], [54, 84], [66, 85], [76, 82], [84, 75], [91, 68], [102, 65], [114, 64]] },
  // under the front wing and the floor, out of the back of the diffuser
  { k: "low", p: [[-12, 80], [0, 82], [7, 90], [15, 94], [30, 95], [55, 96], [76, 95], [85, 90], [93, 82], [103, 78], [114, 77]] },
  { k: "low", p: [[-12, 87], [3, 89], [10, 95], [22, 97.5], [55, 98.5], [80, 97.5], [88, 93], [96, 87], [114, 84]] },
  { k: "low", p: [[-12, 94], [5, 96], [20, 99], [60, 99.5], [84, 99], [92, 96], [114, 92]] }
];
function twSpline(cp, n) {                                        // Catmull-Rom through the control points, about n samples
  const out = [], P = [cp[0], ...cp, cp[cp.length - 1]], m = Math.max(2, Math.round(n / (cp.length - 1)));
  for (let s = 1; s < P.length - 2; s++) { const p0 = P[s - 1], p1 = P[s], p2 = P[s + 1], p3 = P[s + 2];
    for (let t = 0; t < m; t++) { const u = t / m, u2 = u * u, u3 = u2 * u; out.push([0, 1].map(d => .5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3))); } }
  out.push(cp[cp.length - 1]); return out;
}
function twLines() {
  const toAr = ([x, y]) => flowAt([x, y]).map(v => v / 100), lines = [];
  for (let k = 0; k < 9; k++) {                                   // over the top: the lowest line hugs the bodywork, each one above follows it a little less
    const w = 1 - k * .115, cp = TW_TOP.map(([x, y]) => [x, (52 - k * 7.5) + (y - 52) * w - (k ? 2.5 : 0)]);
    lines.push({ pts: twSpline(cp, 170).map(toAr), k: "up", sp: 1.05 + k * .04, ar: 1 });
  }
  TW_PATHS.forEach(L => lines.push({ pts: twSpline(L.p, L.p.length * 12).map(toAr), k: L.k, sp: L.k === "low" ? 1.55 : L.k === "side" ? 1 : .95, fi: L.fi || 0, fo: L.fo || 0, ar: L.k !== "wing" }));
  return lines;
}
// how each zone of the car performs against the field, 0 (worst) to 1 (best)
const TW_ZONE = { fw: [.075, .42, .085, .32], su: [.27, .33, .07, .3], ch: [.36, .14, .1, .3], sp: [.46, .2, .11, .28], fl: [.52, .3, .16, .16], gb: [.78, .3, .07, .3], rw: [.91, .32, .07, .35], br: [.21, .3, .05, .2] };
function twScores(st, hot, hotDelta) {
  const q = {}, rv = S && S.teams ? TEAM_ORDER.filter(t => t !== S.team).map(t => S.teams[t].st) : [];
  Object.keys(TW_ZONE).forEach(p => { const w = CPARTS[p] ? CPARTS[p].st : { top: 1 }; let a = 0, b = 0, t = 0;
    Object.keys(w).forEach(s => { a += w[s] * (st[s] ?? 75); b += w[s] * (rv.length ? rv.reduce((x, r) => x + (r[s] ?? 75), 0) / rv.length : 75); t += w[s]; });
    q[p] = clampN(.5 + (a - b) / t / 7, 0, 1); });
  if (hot && q[hot] != null && hotDelta) q[hot] = clampN(q[hot] + hotDelta, 0, 1);
  return q;
}
const twCol = q => { if (q < 0) return "hsl(200 70% 62%)"; const h = clampN(q, 0, 1) * 125; return `hsl(${h.toFixed(0)} ${(82 - Math.abs(q - .5) * 10).toFixed(0)}% ${(52 + (q > .6 ? -4 : 2)).toFixed(0)}%)`; };
function twField(q, hot) {                                        // the colour the air takes at a point: the zones nearby, blended
  const Z = Object.entries(TW_ZONE).map(([p, [x, y, rx, ry]]) => { const [fx, fy] = flowAt(PART_AT[p] || [x * 100, y * 100]); return { p, x: fx / 100, y: fy / 100, rx: rx * (p === hot ? 1.5 : 1), ry: ry * (p === hot ? 1.4 : 1), q: q[p] ?? .5 }; });
  const all = Z.reduce((a, z) => a + z.q, 0) / Z.length;
  return (u, v) => { let s = 0, w = 0; Z.forEach(z => { const d = ((u - z.x) / z.rx) ** 2 + ((v - z.y) / z.ry) ** 2, k = Math.exp(-d); s += k * z.q; w += k; });
    const near = Math.min(1, w * 1.4), qq = w > 1e-4 ? s / w : all; return { q: qq * near + all * (1 - near), a: .35 + near * .65 }; };
}
function twBuild(cv) {                                            // everything that does not move, drawn once per size and per car
  const dpr = Math.min(2, devicePixelRatio || 1), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr); if (!W || !H) return false;
  const cfg = JSON.parse(cv.dataset.tw || "{}"), key = [W, H, cv.dataset.tw, TW.gen].join("|"); if (cv._tw && cv._tw.key === key) return true;
  cv.width = W; cv.height = H;
  const F = cfg.q ? twField(cfg.q, cfg.hot) : () => ({ q: -1, a: .8 }), lines = twLines().map(l => ({ ...l, c: l.pts.map(([u, v], i, a) => { const c = F(u, v), f = i / (a.length - 1), ramp = Math.min(l.fi ? clampN(f / l.fi, 0, 1) : 1, l.fo ? clampN((1 - f) / l.fo, 0, 1) : 1); return { q: c.q, a: c.a * ramp * (l.k === "side" ? .8 : 1) }; }) }));
  const base = mkCanvas(W, H), g = base.getContext("2d"), lw = Math.max(1.4, W / 430);
  g.lineCap = "round"; g.lineJoin = "round";
  lines.forEach(l => { for (let i = 1; i < l.pts.length; i++) { const [u0, v0] = l.pts[i - 1], [u1, v1] = l.pts[i], c = l.c[i];
      g.strokeStyle = twCol(c.q); g.globalAlpha = c.a * .78; g.lineWidth = lw; g.beginPath(); g.moveTo(u0 * W, v0 * H); g.lineTo(u1 * W, v1 * H); g.stroke(); }
    if (!l.ar) return;
    const n = l.pts.length, [ua, va] = l.pts[n - 1], [ub, vb] = l.pts[n - 6] || l.pts[0], an = Math.atan2((va - vb) * H, (ua - ub) * W), x = Math.min(ua, 1.005) * W - 2, y = va * H, s = lw * 3.2;
    g.globalAlpha = .9; g.fillStyle = twCol(l.c[n - 1].q); g.beginPath(); g.moveTo(x, y); g.lineTo(x - s * Math.cos(an - .5), y - s * Math.sin(an - .5)); g.lineTo(x - s * Math.cos(an + .5), y - s * Math.sin(an + .5)); g.fill(); });
  g.globalAlpha = 1;
  const hz = cfg.hot && PART_AT[cfg.hot] ? flowAt(PART_AT[cfg.hot]).map(v => v / 100) : null;
  cv._tw = { key, base, lines, W, H, lw, hz, ph: lines.map((_, i) => (i * .618) % 1) };
  return true;
}
function twFrame(t) {
  TW.raf = 0; const cvs = document.querySelectorAll("canvas.aflo-cv"); if (!cvs.length) return;
  const still = matchMedia("(prefers-reduced-motion:reduce)").matches;
  cvs.forEach(cv => {
    if (!cv.isConnected || !twBuild(cv)) return; const T = cv._tw, g = cv.getContext("2d"), { W, H, lw } = T;
    g.clearRect(0, 0, W, H); g.drawImage(T.base, 0, 0);
    g.lineCap = "round";
    const sec = t / 1000, spd = +(cv.dataset.spd || 1);
    T.lines.forEach((l, i) => {                                   // the air itself: short bright streaks running down every line
      const n = l.pts.length, step = still ? 0 : sec * .16 * l.sp * spd;
      for (let m = 0; m < 3; m++) {
        const head = ((T.ph[i] + m / 3 + step) % 1) * (n + 24) - 12, len = 11;
        for (let j = Math.max(1, Math.floor(head - len)); j <= Math.min(n - 1, Math.floor(head)); j++) {
          const f = 1 - (head - j) / len, [u0, v0] = l.pts[j - 1], [u1, v1] = l.pts[j], c = l.c[j];
          g.strokeStyle = twCol(c.q); g.globalAlpha = clampN(f, 0, 1) * c.a; g.lineWidth = lw * (1.2 + f * .9);
          g.beginPath(); g.moveTo(u0 * W, v0 * H); g.lineTo(u1 * W, v1 * H); g.stroke();
        }
      }
    });
    if (T.hz) {                                                   // the part under test: a pulsing ring where it changes the flow
      const p = .5 + .5 * Math.sin(sec * 3.2), [x, y] = T.hz;
      g.globalAlpha = .25 + p * .35; g.strokeStyle = "#ffffff"; g.lineWidth = lw * 1.4; g.beginPath(); g.ellipse(x * W, y * H, W * (.05 + p * .015), H * (.22 + p * .06), 0, 0, Math.PI * 2); g.stroke();
    }
    g.globalAlpha = 1;
  });
  if (!document.hidden) TW.raf = requestAnimationFrame(twFrame); else setTimeout(() => { if (!TW.raf) TW.raf = requestAnimationFrame(twFrame); }, 600);
}
function twKick() { if (!TW.raf) TW.raf = requestAnimationFrame(twFrame); }
new MutationObserver(() => { if (document.querySelector("canvas.aflo-cv")) twKick(); }).observe(document.documentElement, { childList: true, subtree: true });
// the figures of a running tunnel never sit still: they wobble a little around their value
function aeroJit() {
  const els = document.querySelectorAll("[data-jit]"); if (!els.length || document.hidden) return;
  els.forEach(el => { const v = +el.dataset.jit, dp = el.dataset.dp != null ? +el.dataset.dp : 2; el.textContent = (v * (1 + (Math.random() - .5) * .006)).toFixed(dp); });
}
setInterval(aeroJit, 420);
// the plain car (design, operations, the rig): optional glowing zones and hotspots
function sideCar(o = {}) {
  return `<div class="sc${o.cls ? " " + o.cls : ""}" style="--ar:${SIDE_AR}${o.prog != null ? `;--pg:${(o.prog * 100).toFixed(1)}%` : ""}">
    ${o.zones || ""}<img class="sc-im" src="assets/parts/side.webp" alt="" draggable="false">${o.prog != null ? `<img class="sc-built" src="assets/parts/side.webp" alt="" draggable="false" aria-hidden="true"><i class="sc-line"></i>` : ""}${o.over || ""}</div>`;
}
// ---- aerodynamic figures of a part, from the characteristics it improves
function aeroFig(p, g, base) {
  const df = ((g.hs || 0) + (g.ms || 0) * .8 + (g.ls || 0) * .4 + (g.dirty || 0) * .5) * .55, dr = (-(g.top || 0) * .6 + (g.cool || 0) * .25 + ((g.hs || 0) + (g.ms || 0)) * .12) * .5;
  const CL = base ? base.cl : 4.3, CD = base ? base.cd : 1.1, cl = CL * (1 + df / 100), cd = CD * (1 + dr / 100), bal0 = base ? base.bal : 45.5, bal = bal0 + ({ fw: .35, rw: -.3, fl: -.08 }[p] || 0) * df;
  return { df, dr, CL, CD, cl, cd, eff0: CL / CD, eff: cl / cd, bal0, bal };
}
// ---- the result of a part in the tunnel (or on the rig), as big as it is
function tunnelResult(p, s, big) {
  const T = TEAMS[S.team], g = s.known ? s.gain : s.est, sec = -sGainSec(g), aero = CPARTS[p].aero, st = S.car.act ? sCarStats(0, true) : null, F = aeroFig(p, g, st ? carAero(st) : null);
  const prev = S.specs[p][s.n - 2] || S.specs[p][0], pg = prev && prev.n > 1 ? (prev.known ? prev.gain : prev.est) : {};
  const before = st ? { ...st } : null, after = st ? { ...st } : null; if (st) Object.entries(g).forEach(([k, v]) => { after[k] = st[k] + v - (pg[k] || 0); });
  const ax = ST.filter(k => k !== "rel"), mn = st ? Math.max(40, Math.floor(Math.min(...ax.map(k => Math.min(before[k], after[k]))) / 5) * 5 - 5) : 40;
  const sd = Math.abs(sGainSec(Object.fromEntries(Object.keys(g).map(k => [k, (s.sig || 0) / Math.max(1, Object.keys(g).length)])))), lab = `${L(...CPARTS[p].n)} · S${s.n}`;
  const hero = aero ? flowHero({ part: p, lab, st: before || null, delta: F, hud: 0, tag: L("Túnel de viento · modelo al 60 % · 50 m/s", "Wind tunnel · 60% model · 50 m/s"), big: `${sec <= 0 ? "" : "+"}${sec.toFixed(3)} s` })
    : sideCar({ cls: "rig", zones: `<span class="sc-pt" style="left:${PART_AT[p][0]}%;top:${PART_AT[p][1]}%"><i></i><b>${lab}</b></span>`, over: `<svg class="sc-osc" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">${[[30, 1, "#c58cff"], [42, 1.7, "#5fb7ff"]].map(([y0, f, c]) => `<path style="stroke:${c}" d="M0 ${y0} ${Array.from({ length: 101 }, (_, i) => `L${i * 4} ${(y0 - Math.sin(i * .2 * f) * 9 - Math.sin(i * .5 * f) * 3).toFixed(1)}`).join(" ")}"/>`).join("")}</svg><span class="aflo-tag">${L("Banco de pruebas · ciclo de carrera", "Test rig · race cycle")}</span>` });
  const num = (k, v, sub, cls = "") => `<div class="tm ${cls}"><span>${k}</span>${v}<em>${sub}</em></div>`;
  const nums = `<div class="tms">${num(L("Por vuelta", "Per lap"), cntTag(sec, "s3", "", sec <= 0 ? "gd" : "bd"), s.known ? L("medido", "measured") : "± " + sd.toFixed(3) + " s")}
      ${num(L("Por carrera", "Per race"), `<b class="${sec <= 0 ? "gd" : "bd"}">${(sec * RACE_LAPS).toFixed(1)} s</b>`, RACE_LAPS + " " + L("vueltas", "laps"))}
      ${aero ? num(L("Carga aerodinámica", "Downforce"), `<b class="${F.df >= 0 ? "gd" : "bd"}">${F.df >= 0 ? "+" : ""}${F.df.toFixed(1)} %</b>`, `CL·A ${F.CL.toFixed(2)} → ${F.cl.toFixed(2)}`)
        + num(L("Resistencia", "Drag"), `<b class="${F.dr <= 0 ? "gd" : "bd"}">${F.dr >= 0 ? "+" : ""}${F.dr.toFixed(1)} %</b>`, `CD·A ${F.CD.toFixed(3)} → ${F.cd.toFixed(3)}`)
        + num(L("Eficiencia", "Efficiency"), `<b>${F.eff.toFixed(2)}</b>`, `L/D · ${L("antes", "before")} ${F.eff0.toFixed(2)}`)
        + num(L("Balance delantero", "Front balance"), `<b>${F.bal.toFixed(1)} %</b>`, `${L("antes", "before")} ${F.bal0.toFixed(1)} %`) : ""}</div>`;
  if (!big) return `<div class="tnres">${hero}${nums}</div>`;
  const secOf = (k, v) => { const a = {}; ST.forEach(x => a[x] = 70); const b = { ...a }; b[k] += v; return (carSkill(b) - carSkill(a)) * LAP_REF; };   // seconds a lap from one characteristic
  const gains = card(L("Ganancia por característica", "Gain by characteristic"), divBars(Object.entries(g).map(([k, v]) => ({ lab: L(...ST_N[k]), v: r1(v) })))
      + `<div class="sp-sep">${L("Dónde se gana el tiempo", "Where the time is won")}</div>` + divBars(Object.entries(g).map(([k, v]) => ({ lab: L(...ST_N[k]), v: secOf(k, v) })).sort((a, b) => b.v - a.v), { fmt: v => (v >= 0 ? "−" : "+") + Math.abs(v).toFixed(3) + " s" }));
  const rh = [-2, -1, 0, 1, 2, 3, 4], curve = (d, k) => rh.map(h => r2(F.CL * (1 + d / 100) * (1 - Math.pow((h - .4 - k) / 6.5, 2) * .5)));
  return `<div class="tnres big">${hero}${nums}
    <div class="sp-g c2">${st ? card(L("El coche con esta pieza", "The car with this part"), svgRadar({ axes: ax, size: 260, min: mn, max: Math.min(110, Math.max(...ax.map(k => after[k])) + 3), sets: [{ n: L("Sin ella", "Without it"), c: "#7d8792", v: before, dash: "4 3" }, { n: "Spec " + s.n, c: T.col, v: after, fill: 1 }] })
        + `<div class="lgd"><i class="dsh" style="background:#7d8792"></i>${L("Sin ella", "Without it")}<i style="background:${T.col}"></i>Spec ${s.n}</div>`) : ""}
      ${aero ? card(L("Carga según la altura del coche", "Downforce against ride height"), svgLine({ w: 460, h: 200, x: rh.map(h => (h > 0 ? "+" : "") + h + " mm"), series: [{ n: "Spec " + (prev ? prev.n : 1), c: "#7d8792", dash: "4 4", v: curve(0, 0) }, { n: "Spec " + s.n, c: T.col, w: 3, area: 1, v: curve(F.df, F.df > 0 ? .3 : 0) }], fmt: v => v.toFixed(2) })
          + `<div class="lgd"><i class="dsh" style="background:#7d8792"></i>Spec ${prev ? prev.n : 1}<i style="background:${T.col}"></i>Spec ${s.n} · CL·A</div>`)
        : gains}</div>
    ${aero ? `<div class="sp-g c2">${card(L("Mapa aerodinámico", "Aero map"), aeroMap(g, pg, s.n * 31 + p.charCodeAt(0)))}${gains}</div>` : ""}</div>`;
}
// ---- the car card in R&D: building, in the tunnel, predicted, then measured on track
function sCarCard() {
  const C = S.car, T = TEAMS[S.team], st0 = sCarStats(0, true), done = !!C.pred;
  if (!done) {
    const P = S.proj.find(p => p.kind === "design"), d = P ? S.day - P.start : 0, dd = C.design.dd, inTun = d >= dd;
    return card(L("El coche 2026", "The 2026 car"), `<div class="bphase"><span class="${inTun ? "fin" : "on"}">1 · ${L("Diseño y fabricación", "Design and build")} <b>${Math.min(d, dd)}/${dd} d</b></span><span class="${inTun ? "on" : ""}">2 · ${L("Túnel de viento", "Wind tunnel")} <b>${Math.max(0, d - dd)}/${DES_DAYS - dd} d</b></span></div>
      ${inTun ? flowHero({ scan: 1, tag: L("Simulando en el túnel de viento…", "Running in the wind tunnel…") }) : sideCar({ prog: d / dd, cls: "build" })}
      <p class="sp-s">${inTun ? L("El modelo está en el túnel: la predicción llega cuando acaben las 4 semanas.", "The model is in the tunnel: the prediction arrives when the 4 weeks are up.") : L("La fábrica va dando forma al coche que pediste.", "The factory is shaping the car you asked for.")}</p>`);
  }
  const sets = [{ n: L("Objetivo", "Target"), c: "#6b7682", v: C.design.tg, dash: "4 4" }];
  if (!C.revealed) sets.push({ n: L("Predicción del túnel", "Tunnel prediction"), c: T.col, v: C.pred, fill: 1, band: C.sig });
  else { sets.push({ n: L("Predicción del túnel", "Tunnel prediction"), c: "#5fb7ff", v: C.pred, dash: "2 3" }); sets.push({ n: L("Coche actual (pista)", "Current car (track)"), c: T.col, v: st0, fill: 1 }); }
  return card(L("El coche", "The car"), flowHero({ st: st0, hud: 1, chips: 1, tag: C.revealed ? L("Túnel · coche con datos de pista", "Tunnel · car on track data") : L("Túnel · predicción", "Tunnel · prediction"), big: `${carRating(st0)}<small>${L("valoración", "rating")}</small>` })
    + `<div class="carw">${svgRadar({ axes: ST, size: 290, min: 50, sets })}<div class="carl">${ST.map((s, i) => `<div style="--i:${i}"><span>${L(...ST_N[s])}</span><b style="color:${statCol(st0[s])}">${Math.round(st0[s])}</b>${C.revealed ? `<em class="${st0[s] - C.pred[s] >= 0 ? "up" : "dn"}">${st0[s] - C.pred[s] >= 0 ? "+" : ""}${Math.round(st0[s] - C.pred[s])}</em>` : `<em>±${Math.round(C.sig)}</em>`}</div>`).join("")}</div></div>
    <div class="lgd">${sets.map(s => `<i style="background:${s.c}" class="${s.dash ? "dsh" : ""}"></i>${s.n}`).join("")}</div>`);
}
// =====================================================================================================
// ---- the car design: 35 design points as tokens on a mixing desk; raising one takes from the pool, then from what clashes ----
// =====================================================================================================
const DES_PTS = 35, DES_MIN = 1, DES_MAX = 10;
const DES_CONF = { top: { hs: 2.4, ms: 2, cool: 1.8 }, hs: { top: 2.4, ls: 1.4 }, ms: { top: 2, tyr: 1.2 }, ls: { hs: 1.4, top: 1.2 }, mech: { tyr: 1.4, cool: 1.1 }, cool: { top: 1.8, hs: 1.2 }, tyr: { mech: 1.4, ls: 1.2 } };
const DES_PRE = { bal: { top: 5, hs: 5, ms: 5, ls: 5, mech: 5, cool: 5, tyr: 5 }, drag: { top: 9, hs: 4, ms: 4, ls: 4, mech: 5, cool: 4, tyr: 5 }, load: { top: 3, hs: 8, ms: 8, ls: 5, mech: 4, cool: 3, tyr: 4 },
  mech: { top: 4, hs: 4, ms: 5, ls: 7, mech: 8, cool: 3, tyr: 4 }, cool: { top: 4, hs: 5, ms: 5, ls: 4, mech: 4, cool: 8, tyr: 5 } };
const DES_PRE_N = { bal: ["Equilibrado", "Balanced"], drag: ["Baja resistencia", "Low drag"], load: ["Alta carga", "High downforce"], mech: ["Agarre mecánico", "Mechanical grip"], cool: ["Fiabilidad y frío", "Cool and reliable"] };
const DES_COL = { top: "#ff5a4f", hs: "#ff9f2e", ms: "#f2d64b", ls: "#7ed36a", mech: "#2fd0c4", cool: "#4f9dff", tyr: "#b98cff" };
const DES_S = { top: ["Punta", "Top"], hs: ["Rápidas", "Fast"], ms: ["Medias", "Medium"], ls: ["Lentas", "Slow"], mech: ["Agarre", "Grip"], cool: ["Refrig.", "Cooling"], tyr: ["Neumát.", "Tyres"] };
// where each idea shows on the car, and how it shows
const DES_ZONE = { top: [[93, 24], [64, 30]], hs: [[56, 84], [8, 76]], ms: [[10, 82], [47, 64]], ls: [[28, 60], [23, 70]], mech: [[82, 56], [86, 70]], cool: [[47, 52], [66, 44]], tyr: [[86, 72], [23, 74]] };
const DES_LAB = { cool: [40, -1], mech: [66, -1], top: [89, -1], ms: [9, 1], ls: [30, 1], hs: [54, 1], tyr: [86, 1] };   // x %, lane above (-1) or below (1) the car
const DES_DO = { top: ["alerón trasero pequeño, carrocería estrecha", "small rear wing, slim bodywork"], hs: ["fondo plano y efecto suelo", "floor and ground effect"], ms: ["alerón delantero con más carga", "front wing with more load"],
  ls: ["suspensión delantera y giro", "front suspension and turn-in"], mech: ["tracción, caja y frenos", "traction, gearbox and brakes"], cool: ["entradas de los pontones y rejillas", "sidepod inlets and louvres"], tyr: ["suspensión trasera suave con las gomas", "rear suspension kind to the tyres"] };
const desSum = D => DES_AX.reduce((a, k) => a + D.pr[k], 0);
const desFree = D => DES_PTS - desSum(D);
function desNorm(D) {                                             // whole points, every axis between 1 and 10, never more than 35 in all
  DES_AX.forEach(k => D.pr[k] = clampN(Math.round(D.pr[k] || DES_MIN), DES_MIN, DES_MAX));
  while (desSum(D) > DES_PTS) { const k = [...DES_AX].sort((a, b) => D.pr[b] - D.pr[a])[0]; D.pr[k]--; }
  return D;
}
function desStep(D, a, dir) {                                     // one point: up takes from the free pool first, then from the idea that clashes most
  if (dir > 0) {
    if (D.pr[a] >= DES_MAX) return null;
    if (desFree(D) > 0) { D.pr[a]++; return { from: "pool", to: a }; }
    const w = k => ((DES_CONF[a] || {})[k] || (DES_CONF[k] || {})[a] || 1) * (D.pr[k] - DES_MIN + .5);
    const os = DES_AX.filter(k => k !== a && D.pr[k] > DES_MIN).sort((x, y) => w(y) - w(x));
    if (!os.length) return null;
    D.pr[os[0]]--; D.pr[a]++; return { from: os[0], to: a };
  }
  if (D.pr[a] <= DES_MIN) return null;
  D.pr[a]--; return { from: a, to: "pool" };
}
// ---- the design sheet: one engineering slider per idea, the 35 points as a graduated rule above them
const DES_CODE = { top: "AE-01", hs: "AE-02", ms: "AE-03", ls: "VD-04", mech: "MC-05", cool: "TH-06", tyr: "VD-07" };
function desRule(D) {                                             // the 35 points, grouped by idea; free points stay hollow
  const free = desFree(D);
  return DES_AX.map((k, g) => `<span class="dsr-g${SP.desAx === k ? " on" : ""}${g % 2 ? " alt" : ""}" style="flex-grow:${D.pr[k]}">${"<i></i>".repeat(D.pr[k])}<em>${L(...DES_S[k])}</em></span>`).join("")
    + (free ? `<span class="dsr-g free" style="flex-grow:${free}">${"<i></i>".repeat(free)}<em>${L("libre", "free")}</em></span>` : "");
}
function desBoard(D) {
  const free = desFree(D), base = SP.desBase || D.pr;
  const rows = DES_AX.map(k => { const v = D.pr[k], dl = v - (base[k] ?? v);
    return `<div class="dsl${SP.desAx === k ? " on" : ""}" data-ax="${k}">
      <span class="dsl-n"><em>${DES_CODE[k]}</em><b>${L(...DES_N[k])}</b><small>${L(...DES_DO[k])}</small></span>
      <div class="dsl-t" data-axt="${k}" role="slider" tabindex="0" aria-label="${L(...DES_N[k])}" aria-valuemin="${DES_MIN}" aria-valuemax="${DES_MAX}" aria-valuenow="${v}">
        <span class="dsl-g">${Array.from({ length: DES_MAX + 1 }, (_, i) => `<i style="left:${i * 10}%"${i % 5 ? "" : ' class="mj"'}></i>`).join("")}</span>
        <i class="dsl-f" style="width:${v * 10}%"></i><i class="dsl-b" style="left:${(base[k] ?? v) * 10}%"></i><i class="dsl-k" style="left:${v * 10}%"></i></div>
      <b class="dsl-v" data-pv="${k}">${String(v).padStart(2, "0")}</b><em class="dsl-d ${dl > 0 ? "up" : dl < 0 ? "dn" : ""}" data-pd="${k}">${dl ? (dl > 0 ? "+" : "−") + Math.abs(dl) : "·"}</em>
      <span class="dsl-x"><button data-sa="desstep" data-ax="${k}" data-v="-1" aria-label="− ${L(...DES_N[k])}">−</button><button data-sa="desstep" data-ax="${k}" data-v="1" aria-label="+ ${L(...DES_N[k])}">+</button></span></div>`; }).join("");
  return `<div class="dpb" id="desBoard">
    <div class="dsl-h"><span>${L("Presupuesto de diseño", "Design budget")}</span><b><em data-pfree>${DES_PTS - free}</em> / ${DES_PTS} pts</b></div>
    <div class="dsl-rule" data-prule>${desRule(D)}</div>
    <p class="dpp-m${free ? " warn" : ""}" data-pmsg>${desMsg(D)}</p>
    <div class="dsls">${rows}</div>
    <p class="dpb-k" data-pkey>${desKeyMsg()}</p></div>`;
}
function desMsg(D) {
  const f = desFree(D);
  return f > 0 ? L(`Te quedan ${f} ${f === 1 ? "punto libre" : "puntos libres"}: ${f === 1 ? "súbelo" : "súbelos"} en algún parámetro para aprobar el diseño.`, `${f} free ${f === 1 ? "point" : "points"} left: put ${f === 1 ? "it" : "them"} into a parameter to approve the design.`)
    : L("Los 35 puntos están repartidos. Si subes un parámetro, el punto sale del que más choca con él (la marca fina es el valor del concepto de partida).", "All 35 points are placed. Raise a parameter and the point comes out of the one that clashes with it most (the thin mark is the starting concept's value).");
}
function desKeyMsg() {
  const a = SP.desAx; if (!a) return L("Arrastra el mando de cada parámetro, toca la escala o usa − y +. Baja uno para liberar puntos.", "Drag each parameter's handle, tap the scale or use − and +. Lower one to free points.");
  const cl = Object.entries(DES_CONF[a] || {}).sort((x, y) => y[1] - x[1]).map(([k, w]) => `<span>${L(...DES_S[k])} <u>×${w}</u></span>`).join("");
  return `<b>${DES_CODE[a]} · ${L(...DES_N[a])}</b> ${cl ? `<span class="cpl">${L("acoplado con", "coupled to")} ${cl}</span>` : ""}`;
}
function desBoardUpd(D, mv) {                                     // the sheet changes in place, so the handles slide
  const bd = $("desBoard"); if (!bd) return;
  const free = desFree(D), base = SP.desBase || D.pr;
  DES_AX.forEach(k => {
    const r = bd.querySelector(`.dsl[data-ax="${k}"]`); if (!r) return; const v = D.pr[k], dl = v - (base[k] ?? v);
    r.querySelector(".dsl-f").style.width = v * 10 + "%"; r.querySelector(".dsl-k").style.left = v * 10 + "%"; r.querySelector(".dsl-b").style.left = (base[k] ?? v) * 10 + "%";
    r.querySelector(".dsl-t").setAttribute("aria-valuenow", v); r.querySelector("[data-pv]").textContent = String(v).padStart(2, "0");
    const d = r.querySelector("[data-pd]"); d.textContent = dl ? (dl > 0 ? "+" : "−") + Math.abs(dl) : "·"; d.className = "dsl-d " + (dl > 0 ? "up" : dl < 0 ? "dn" : "");
    r.classList.toggle("on", SP.desAx === k);
  });
  bd.querySelector("[data-prule]").innerHTML = desRule(D);
  bd.querySelector("[data-pfree]").textContent = DES_PTS - free;
  const m = bd.querySelector("[data-pmsg]"); m.innerHTML = desMsg(D); m.classList.toggle("warn", free > 0);
  bd.querySelector("[data-pkey]").innerHTML = desKeyMsg();
  const ok = document.querySelector("[data-sa=desok]"); if (ok) { ok.disabled = free > 0; ok.innerHTML = free > 0 ? L(`Faltan ${free} puntos por repartir`, `${free} points still to place`) : L("Aprobar el diseño y empezar", "Approve the design and start") + " ▶"; }
  if (mv && mv.from !== "pool") { const r = bd.querySelector(`.dsl[data-ax="${mv.from}"]`); if (r && mv.to !== "pool") { r.classList.remove("hit"); void r.offsetWidth; r.classList.add("hit"); } }
}
function desSetTo(D, a, v) {                                      // drag a column to a level, one token at a time
  v = clampN(v, DES_MIN, DES_MAX); let n = 0;
  while (D.pr[a] !== v && n++ < 12) { const mv = desStep(D, a, v > D.pr[a] ? 1 : -1); if (!mv) break; desBoardUpd(D, n <= 3 ? mv : null); }
  SP.desPre = null; document.querySelectorAll("[data-sa=despre]").forEach(b => b.setAttribute("aria-pressed", "false"));
  desLive();
}
function desZones(D) {                                            // the car lights up where the design puts its effort, with a label for each idea
  const T = TEAMS[S.team], lv = k => D.pr[k] >= 7 ? " hi" : D.pr[k] <= 3 ? " lo" : "";
  const glow = DES_AX.flatMap(k => DES_ZONE[k].map(([x, y], j) => { const v = D.pr[k] / DES_MAX, r = 4 + v * v * 14 - j * 2; return `<span class="zg" style="left:${x}%;top:${y}%;--r:${r.toFixed(1)}%;opacity:${(.08 + v * v * .92).toFixed(2)}"></span>`; })).join("");
  const lines = DES_AX.map(k => { const [x, s] = DES_LAB[k], [zx, zy] = DES_ZONE[k][0]; return `<line class="${lv(k).trim()}${SP.desAx === k ? " on" : ""}" x1="${x}" y1="${s < 0 ? -14 : 114}" x2="${zx}" y2="${zy}"/>`; }).join("");
  const dots = DES_AX.map(k => { const [zx, zy] = DES_ZONE[k][0]; return `<span class="zd${lv(k)}${SP.desAx === k ? " on" : ""}" style="left:${zx}%;top:${zy}%"></span>`; }).join("");
  const labs = DES_AX.map(k => { const [x, s] = DES_LAB[k], v = D.pr[k]; return `<span class="zl ${s < 0 ? "up" : "dn"}${SP.desAx === k ? " on" : ""}${lv(k)}" data-zl="${k}" style="left:${x}%"><b>${v}</b><em>${L(...DES_N[k])}</em></span>`; }).join("");
  return `<div class="zw zb" style="--zc:${T.col}">${glow}</div><div class="zw zt" style="--zc:${T.col}">${glow}</div><svg class="zln" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${dots}${labs}`;
}
// ---- the dispersion: how far the real car can land from the design, and how far the tunnel can be wrong about it
const DSP_K = ["top", "hs", "ms", "ls", "brk", "trc", "cool", "tyr"], DSP_MIN = 40, DSP_SPAN = 60;
const dspPos = v => clampN((v - DSP_MIN) / DSP_SPAN * 100, 0, 100);
function desDisp(D) {
  const sg = sDesSig(D), tg = sDesignTarget(D), rr = rng(11), dots = Array.from({ length: 22 }, (_, i) => [gaussR(rr), gaussR(rr), (i * .37) % 3.6]);
  const one = (key, sig, col, lab, sub) => `<div class="dsp-t" data-dsk="${key}" style="--c:${col};--k:${(sig * 4.6).toFixed(2)}">
      <div class="dsp-b">${[2, 4, 6, 8, 10].map(v => `<i class="rg" style="--r:${v * 4.6}"><em>${v}</em></i>`).join("")}<i class="s2"></i><i class="s1"></i><i class="cx"></i><i class="cy"></i>
        ${dots.map(([x, y, d]) => `<s style="--x:${x.toFixed(2)};--y:${y.toFixed(2)};animation-delay:${d.toFixed(2)}s"></s>`).join("")}<i class="bull"></i></div>
      <div class="dsp-i"><b>± <span data-dsv>${sig.toFixed(1)}</span></b><span>${lab}</span><em>${sub}</em></div></div>`;
  const rows = DSP_K.map(s => `<div class="dsr" data-dsr="${s}" style="--t:${dspPos(tg[s]).toFixed(1)};--d:${(sg.d / DSP_SPAN * 100).toFixed(2)};--u:${(sg.t / DSP_SPAN * 100).toFixed(2)}">
      <span class="dsr-n">${L(...ST_N[s])}</span><div class="dsr-b"><i class="d2"></i><i class="d1"></i><i class="u1"></i><i class="tk"></i></div><b data-dst>${Math.round(tg[s])}</b></div>`).join("");
  return `<div class="dsp">
    <div class="dsp-ts">${one("d", sg.d, "#9bd35a", L("Fidelidad al diseño", "Faithful to the design"), L("Cuántos puntos puede desviarse el coche real de lo que pides. Más días de diseño → más cerca.", "How many points the real car can stray from what you ask for. More design days → closer."))}
      ${one("t", sg.t, "#5fb7ff", L("Precisión del túnel", "Tunnel accuracy"), L("Cuánto puede equivocarse la predicción antes del test. Más días de túnel → acierta más.", "How wrong the prediction can be before the test. More tunnel days → more accurate."))}</div>
    <div class="dsp-rs"><div class="dsp-sc"><span></span><div>${[40, 50, 60, 70, 80, 90, 100].map(v => `<em style="left:${dspPos(v)}%">${v}</em>`).join("")}</div><span></span></div>${rows}
      <div class="lgd"><i style="background:#fff;width:3px;height:12px"></i>${L("Lo que pides", "What you ask for")}<i style="background:#9bd35a"></i>${L("Dónde caerá el coche real (2 de cada 3 veces en la zona fuerte)", "Where the real car will land (2 times in 3 in the solid zone)")}<i style="background:#5fb7ff"></i>${L("Margen de la predicción del túnel", "Tunnel prediction margin")}</div></div></div>`;
}
function desDispUpd(D) {
  const el = document.querySelector(".dsp"); if (!el) return;
  const sg = sDesSig(D), tg = sDesignTarget(D);
  [["d", sg.d], ["t", sg.t]].forEach(([k, v]) => { const t = el.querySelector(`[data-dsk="${k}"]`); if (!t) return; t.style.setProperty("--k", (v * 4.6).toFixed(2)); t.querySelector("[data-dsv]").textContent = v.toFixed(1); });
  DSP_K.forEach(s => { const r = el.querySelector(`[data-dsr="${s}"]`); if (!r) return; r.style.setProperty("--t", dspPos(tg[s]).toFixed(1)); r.style.setProperty("--d", (sg.d / DSP_SPAN * 100).toFixed(2)); r.style.setProperty("--u", (sg.t / DSP_SPAN * 100).toFixed(2)); r.querySelector("[data-dst]").textContent = Math.round(tg[s]); });
}
function gaussR(r) { return (r() + r() + r() + r() - 2) * 1.2; }
function desTime(D) {                                             // the 4 weeks: drag the line between design and tunnel
  const f = D.dd / DES_DAYS * 100;
  return `<div class="dtime" id="desTime" role="slider" tabindex="0" aria-label="${L("Días de diseño", "Design days")}" aria-valuemin="7" aria-valuemax="21" aria-valuenow="${D.dd}">
    <div class="dt-a" style="width:${f}%"><b>${D.dd} ${L("días", "days")}</b><span>${L("Diseño y fabricación", "Design and build")}</span></div>
    <div class="dt-b" style="width:${100 - f}%"><b>${DES_DAYS - D.dd} ${L("días", "days")}</b><span>${L("Túnel de viento", "Wind tunnel")}</span></div>
    <i class="dtdiv" style="left:${f}%"></i>${[7, 14, 21].map(d => `<s style="left:${d / DES_DAYS * 100}%"></s>`).join("")}</div>
    <div class="dt-w">${[1, 2, 3, 4].map(w => `<span>${L("Semana", "Week")} ${w}</span>`).join("")}</div>`;
}
// what the whole calendar asks of a car (the mean of the 8 circuits), and how a car fits each circuit
function calDemand() { const d = {}; ST.forEach(s => { const v = S_ROUNDS.map(c => CIRCUITS[c].req[s]).filter(x => x != null); d[s] = v.length ? 50 + v.reduce((a, b) => a + b, 0) / v.length * 9 : s === "rel" ? 80 : 70; }); return d; }
function circFit(st, c) { const R = CIRCUITS[c].req; let a = 0, w = 0; REQ_K.forEach(s => { a += R[s] * R[s] * st[s]; w += R[s] * R[s]; }); return a / w; }
function circFitBars(st, cmp) {                                    // one bar per round: how well the car suits that circuit
  const v = S_ROUNDS.map(c => circFit(st, c)), lo = Math.min(...v) - 4, hi = Math.max(...v) + 2, best = Math.max(...v), worst = Math.min(...v);
  return `<div class="cfit">${S_ROUNDS.map((c, i) => { const C = CIRCUITS[c], x = v[i]; return `<div class="cfr${x === best ? " hi" : x === worst ? " lo" : ""}" style="--i:${i}">${flagSvg(C.cc)}<span>${C.code}</span><i><u style="width:${((x - lo) / (hi - lo) * 100).toFixed(1)}%"></u></i><b>${x.toFixed(1)}</b></div>`; }).join("")}</div>`;
}
function sDesParts(D) {
  const tg = sDesignTarget(D), T = TEAMS[S.team], demand = calDemand();
  const rivals = TEAM_ORDER.filter(t => t !== S.team).map(t => ({ t, v: carSkill(S.teams[t].st) })), mine = carSkill(tg), best = Math.max(mine, ...rivals.map(r => r.v));
  const cost = D.inv + PART_K.reduce((a, p) => a + CPARTS[p].stock * CPARTS[p].unit, 0);
  return {
    zones: desZones(D),
    res: svgRadar({ axes: ST, size: 280, min: 50, max: 100, aria: L("El coche resultante frente a lo que pide el calendario", "The resulting car against what the calendar asks"),
      sets: [{ n: L("Exigencia media del calendario", "Calendar average demand"), c: "#6b7682", v: demand, dash: "4 4" }, { n: L("Tu coche", "Your car"), c: T.col, v: tg, fill: 1 }] })
      + `<div class="lgd"><i style="background:${T.col}"></i>${L("Tu coche", "Your car")}<i class="dsh" style="background:#6b7682"></i>${L("Lo que piden de media los 8 circuitos", "What the 8 circuits ask on average")}</div>`,
    pace: lolli([{ t: S.team, v: mine }, ...rivals].sort((a, b) => b.v - a.v).map(e => ({ lab: TEAMS[e.t].name, v: r2((best - e.v) * LAP_REF), c: e.t === S.team ? T.col : "#5b6572", me: e.t === S.team })), { fmt: v => v ? "+" + v.toFixed(2) + " s" : L("ref.", "ref.") }),
    fit: circFitBars(tg),
    time: desTime(D),
    sum: `<span>${L("Coste", "Cost")} <b>${money(cost)}</b></span><span>${L("Límite de gasto", "Cost cap")} <b>${Math.round((S.cap + cost) / S_CAP * 100)} %</b></span><span>${L("Valoración", "Rating")} <b>${carRating(tg)}</b></span><span>${L("Puesto estimado", "Estimated place")} <b>P${[{ t: S.team, v: mine }, ...rivals].sort((a, b) => b.v - a.v).findIndex(e => e.t === S.team) + 1}</b></span>`
  };
}
function sDesignPage() {
  const D = SP.des || (SP.des = { pr: { ...DES_PRE.bal }, dd: 16, inv: 12 }); desNorm(D);
  if (SP.desPre === undefined) SP.desPre = "bal";
  if (!SP.desBase) SP.desBase = { ...D.pr };
  const P = sDesParts(D), free = desFree(D);
  return sKick(L("Desarrollo · I+D+i", "Development · R&D"), L("Diseño del monoplaza 2026", "2026 car design"))
    + card(L("El concepto del coche", "The car's concept"), `<div class="dpre">${Object.keys(DES_PRE).map(k => `<button data-sa="despre" data-v="${k}" aria-pressed="${SP.desPre === k}">${L(...DES_PRE_N[k])}</button>`).join("")}</div>
      <div class="dcar">${sideCar({ cls: "des", zones: `<div data-dp="zones">${P.zones}</div>` })}</div>`, "dhero")
    + `<div class="sp-g c2">${card(L(`Reparte ${DES_PTS} puntos de diseño`, `Share out ${DES_PTS} design points`), desBoard(D))}
      ${card(L("El coche que sale frente a lo que pide el calendario", "The car you get against what the calendar asks"), `<div data-dp="res">${P.res}</div><div class="sp-sep">${L("Encaje en cada circuito del calendario", "Fit for each circuit on the calendar")}</div><div data-dp="fit">${P.fit}</div><div class="sp-sep">${L("Ritmo estimado por vuelta", "Estimated pace per lap")}</div><div data-dp="pace">${P.pace}</div>`)}</div>
    ${card(L("Las 4 semanas hasta el test y la dispersión", "The 4 weeks to the test, and the spread"), `<div data-dp="time">${P.time}</div>${desDisp(D)}`)}
    ${card(L("Inversión en el diseño", "Investment in the design"), `<div class="dinv">${[8, 12, 16, 20].map(v => `<button data-sa="desinv" data-v="${v}" aria-pressed="${D.inv === v}"><b>${v} M$</b><em>${v <= 8 ? L("justo", "tight") : v <= 12 ? L("normal", "standard") : v <= 16 ? L("ambicioso", "ambitious") : L("todo dentro", "all in")}</em></button>`).join("")}</div>
        <p class="sp-s">${L("Cada millón por encima de 12 sube un poco el nivel de todo el coche; cuenta para el límite de gasto.", "Every million above 12 lifts the whole car a little; it counts towards the cost cap.")}</p>
        <div class="sum" data-dp="sum">${P.sum}</div><button class="sp-btn wide" data-sa="desok" ${free > 0 ? "disabled" : ""}>${free > 0 ? L(`Faltan ${free} puntos por repartir`, `${free} points still to place`) : L("Aprobar el diseño y empezar", "Approve the design and start") + " ▶"}</button>`)}`;
}
function desLive() {                                              // only the parts that change; the desk and the spread move in place
  const D = SP.des; if (!D) return; const P = sDesParts(D);
  document.querySelectorAll("[data-dp]").forEach(el => { if (P[el.dataset.dp] != null) { el.classList.add("lv"); el.innerHTML = P[el.dataset.dp]; } });
  desDispUpd(D);
}
// dragging a column of the desk, and the line of the 4 weeks
function desPointer(e) {
  const col = e.target.closest && e.target.closest(".dsl-t"), tim = e.target.closest && e.target.closest("#desTime");
  if (!col && !tim) return; const D = SP.des; if (!D) return;
  e.preventDefault();
  if (col) {
    const a = col.dataset.axt; SP.desAx = a;
    try { col.setPointerCapture(e.pointerId); } catch (x) { }
    const lvl = ev => { const r = col.getBoundingClientRect(); return Math.round((ev.clientX - r.left) / r.width * DES_MAX); };
    const move = ev => { const v = clampN(lvl(ev), DES_MIN, DES_MAX); if (v !== D.pr[a]) desSetTo(D, a, v); };
    move(e); desBoardUpd(D);
    const up = () => { col.removeEventListener("pointermove", move); col.removeEventListener("pointerup", up); col.removeEventListener("pointercancel", up); };
    col.addEventListener("pointermove", move); col.addEventListener("pointerup", up); col.addEventListener("pointercancel", up);
  } else {
    const box = tim.getBoundingClientRect(), host = tim.closest("[data-dp]") || tim;   // the bar is redrawn while dragging: listen on what stays
    try { host.setPointerCapture(e.pointerId); } catch (x) { }
    const move = ev => { const dd = clampN(Math.round((ev.clientX - box.left) / box.width * DES_DAYS), 7, 21); if (dd !== D.dd) { D.dd = dd; desLive(); } };
    move(e);
    const up = () => { host.removeEventListener("pointermove", move); host.removeEventListener("pointerup", up); host.removeEventListener("pointercancel", up); };
    host.addEventListener("pointermove", move); host.addEventListener("pointerup", up); host.addEventListener("pointercancel", up);
  }
}
document.addEventListener("pointerdown", desPointer);
document.addEventListener("keydown", e => {                     // the 4 weeks and the desk's columns with the arrow keys
  if (!e.target.closest || !SP.des) return;
  const col = e.target.closest(".dsl-t");
  if (col && /^Arrow(Up|Down|Left|Right)$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); const a = col.dataset.axt; SP.desAx = a; desSetTo(SP.des, a, SP.des.pr[a] + (e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : -1)); return; }
  if (!e.target.closest("#desTime")) return;
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); SP.des.dd = clampN(SP.des.dd + (e.key === "ArrowRight" ? 1 : -1), 7, 21); desLive(); $("desTime")?.focus(); }
}, true);
function desPreset(k) {                                           // a ready-made concept: the tokens travel to their new columns
  const D = SP.des, to = desNorm({ pr: { ...DES_PRE[k] } }).pr; SP.desPre = k; SP.desAx = null; SP.desBase = { ...to };
  document.querySelectorAll("[data-sa=despre]").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === k));
  let n = 0;
  const tick = () => {                                            // move one token per frame from a column over its target to one under it
    const over = DES_AX.filter(a => D.pr[a] > to[a]), under = DES_AX.filter(a => D.pr[a] < to[a]);
    if (!over.length && !under.length) { desBoardUpd(D); desLive(); return; }
    let mv;
    if (over.length && under.length) { const a = over[0], b = under[0]; D.pr[a]--; D.pr[b]++; mv = { from: a, to: b }; }
    else if (over.length) { D.pr[over[0]]--; mv = { from: over[0], to: "pool" }; }
    else { D.pr[under[0]]++; mv = { from: "pool", to: under[0] }; }
    desBoardUpd(D, mv); if (++n % 3 === 0) desLive();
    setTimeout(tick, 55);
  };
  tick();
}
// =====================================================================================================
// ---- results that pop up: the car's first prediction, a part out of the tunnel, the truth at the test ----
// =====================================================================================================
function sPopShow() {
  const pp = S && S.pop; if (!pp) return; S.pop = null; saveGame();
  const T = TEAMS[S.team];
  if (pp.k === "fired") { sFiredShow(); return; }
  if (pp.k === "design") {
    const C = S.car, st = C.pred, rivals = TEAM_ORDER.filter(t => t !== S.team).map(t => ({ t, v: carSkill(S.teams[t].st) })), mine = carSkill(st), best = Math.max(mine, ...rivals.map(r => r.v));
    const order = ST.filter(k => TRACK_W[k]).sort((a, b) => st[b] - st[a]), pos = [{ t: S.team, v: mine }, ...rivals].sort((a, b) => b.v - a.v).findIndex(e => e.t === S.team) + 1;
    sModal(`<div class="sm-h"><span>${L("Túnel de viento · predicción", "Wind tunnel · prediction")}</span><b>${L("Así será el coche 2026", "This is the 2026 car")}</b></div>
      ${flowHero({ st, hud: 1, tag: L("Modelo al 60 % · 50 m/s", "60% model · 50 m/s"), big: `P${pos}<small>${L("ritmo estimado", "estimated pace")}</small>` })}
      <div class="tms">${[[L("Valoración", "Rating"), cntTag(carRating(st)), L("objetivo", "target") + " " + carRating(C.design.tg)], [L("Al más rápido", "To the fastest"), `<b>${best - mine > 0 ? "+" + ((best - mine) * LAP_REF).toFixed(2) + " s" : L("el más rápido", "the fastest")}</b>`, L("por vuelta", "per lap")],
        [L("Punto fuerte", "Strength"), `<b class="gd">${L(...ST_N[order[0]])}</b>`, Math.round(st[order[0]]) + ""], [L("Punto débil", "Weakness"), `<b class="bd">${L(...ST_N[order[order.length - 1]])}</b>`, Math.round(st[order[order.length - 1]]) + ""], [L("Incertidumbre", "Uncertainty"), `<b>± ${Math.round(C.sig)}</b>`, L("hasta el test", "until the test")]]
        .map(([k, v, s2]) => `<div class="tm"><span>${k}</span>${v}<em>${s2}</em></div>`).join("")}</div>
      <div class="sm-g2">${card(L("Predicción frente a lo que pediste", "Prediction against what you asked for"), svgRadar({ axes: ST, size: 270, min: 50, sets: [{ n: L("Objetivo", "Target"), c: "#6b7682", v: C.design.tg, dash: "4 4" }, { n: L("Predicción", "Prediction"), c: T.col, v: st, fill: 1, band: C.sig }] })
          + `<div class="lgd"><i class="dsh" style="background:#6b7682"></i>${L("Lo que pediste", "What you asked for")}<i style="background:${T.col}"></i>${L("Predicción del túnel (con su margen)", "Tunnel prediction (with its margin)")}</div>`)}
        ${card(L("Diferencia con lo pedido", "Difference from what you asked"), divBars(ST.map(k => ({ lab: L(...ST_N[k]), v: r1(st[k] - C.design.tg[k]) })), { max: 12 }))}</div>
      <div class="sm-f"><button class="sp-btn" data-sa="mclose">${L("Seguir", "Continue")} ▶</button></div>`, true);
  } else if (pp.k === "part") {
    const s = S.specs[pp.p] && S.specs[pp.p][pp.n - 1]; if (!s) return;
    sModal(`<div class="sm-h"><span>${CPARTS[pp.p].aero ? L("Túnel de viento · resultado", "Wind tunnel · result") : L("Banco de pruebas · resultado", "Test rig · result")}</span><b>${L(...CPARTS[pp.p].n)} · Spec ${pp.n}</b></div>${tunnelResult(pp.p, s, true)}
      <div class="sm-f"><button class="sp-btn gh" data-sa="mclose">${L("Cerrar", "Close")}</button><button class="sp-btn" data-go2="prod">${L("Mandar a fabricar", "Send to the factory")} ▶</button></div>`, true);
  } else if (pp.k === "reveal") {
    const C = S.car, act = sCarStats(0, true), dl = ST.map(k => ({ lab: L(...ST_N[k]), v: r1(act[k] - C.pred[k]) })), hit = dl.filter(d => Math.abs(d.v) <= 3).length;
    sModal(`<div class="sm-h"><span>${L("Test de Barcelona · la verdad", "Barcelona test · the truth")}</span><b>${L("El coche real frente a la predicción", "The real car against the prediction")}</b></div>
      ${flowHero({ st: act, hud: 1, tag: L("Datos de pista frente al túnel", "Track data against the tunnel"), big: `${hit}/${ST.length}<small>${L("aciertos del túnel", "tunnel hits")}</small>` })}
      <div class="sm-g2">${card(L("Predicción y realidad", "Prediction and reality"), svgRadar({ axes: ST, size: 270, min: 50, sets: [{ n: L("Predicción", "Prediction"), c: "#5fb7ff", v: C.pred, dash: "3 3" }, { n: L("Real", "Real"), c: T.col, v: act, fill: 1 }] })
          + `<div class="lgd"><i class="dsh" style="background:#5fb7ff"></i>${L("Predicción del túnel", "Tunnel prediction")}<i style="background:${T.col}"></i>${L("Coche real", "Real car")}</div>`)}
        ${card(L("Lo que el túnel no vio", "What the tunnel missed"), divBars(dl, { max: 12 }))}</div>
      <div class="sm-f"><button class="sp-btn" data-sa="mclose">${L("Seguir", "Continue")} ▶</button></div>`, true);
  }
}

function startTeam() {                                        // team chosen: its HQ presented, then the Team Principal's office, then the HQ
  if (FRONT.leaving) return;
  const go = () => { setPlayerTeam(FRONT.team); TPUI.back = "team"; TPUI.tab = "id"; openIntro(() => { FRONT.leaving = false; $("front").classList.remove("leave"); }); };
  if (FRONT.v !== "team" || matchMedia("(prefers-reduced-motion:reduce)").matches) { go(); return; }
  FRONT.leaving = true; $("front").classList.add("leave"); setTimeout(go, 380);
}
addEventListener("resize", () => { if (FRONT.v === "main") drawMenuCircuit(); });
window.claude?.hot?.snapshot?.(() => SES || WK ? {} : ({ track: TRACK_ID, team: DRIVERS[0].team, cars, speedIdx, RACE_LAPS, focus, START: { ...START } }));
function start(data) {
  if (data && data.track === TRACK_ID && Array.isArray(data.cars) && data.cars.length === DRIVERS.length) {
    if (data.team && TEAMS[data.team]) setPlayerTeam(data.team);
    if (data.START) Object.assign(START, data.START); else { START.state = "done"; }
    if (START.state === "done") $("lights").hidden = true;
    cars = data.cars.map((c, k) => Object.assign(newCar(DRIVERS[k], k), c, data.START ? {} : { launchAt: 0, vL: 999, launch: null }, { code: DRIVERS[k].code, hist: Array.isArray(c.hist) ? c.hist : [], stops: c.stops || 0 }));
    speedIdx = data.speedIdx || 0; RACE_LAPS = data.RACE_LAPS || 66; focus = data.focus || 0;
    speedIdx = Math.min(speedIdx, SPEEDS.length - 1); $("bSpeed").textContent = "×" + SPEEDS[speedIdx]; pwCtlSync(); ui.forEach(u => u.sync());
  }
  else { showFront("title"); gate(imgsReady(["assets/img/grid.jpg", "assets/img/rtm_title.png"]), () => { }); }
  if (START.state === "menu" && !MENU.step && !FRONT.v) showCircuitMenu();   // saved while the menus were open
  prevT = performance.now(); requestAnimationFrame(frame);
  window.LOADER?.ready();
}
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
