// ---------- the team's media value: what the interviews build up (or spend) ----------
const MEDIA = (() => { try { return JSON.parse(localStorage.getItem("rtm.media") || "{}"); } catch (e) { return {}; } })();
const mediaBase = t => Math.round(36 + teamInfo(t).perf * 9);              // the big names start higher
const mediaOf = t => Math.round(MEDIA[t] ?? mediaBase(t));
function mediaAdd(t, d) {
  MEDIA[t] = Math.max(0, Math.min(100, mediaOf(t) + d));
  try { localStorage.setItem("rtm.media", JSON.stringify(MEDIA)); } catch (e) { }
}
const mediaTier = v => v >= 85 ? L("Estrella mediática", "Media darling") : v >= 70 ? L("Muy alto", "Very high") : v >= 55 ? L("Alto", "High") : v >= 40 ? L("Medio", "Average") : v >= 25 ? L("Bajo", "Low") : L("Muy bajo", "Very low");
function hqMediaCard(t) {
  const v = mediaOf(t), last = MEDIA["~" + t];
  return `<div class="hq-media"><div class="hd"><span>${L("Valor mediático", "Media value")}</span>${last ? `<em class="${last > 0 ? "up" : "dn"}">${last > 0 ? "▲ +" : "▼ "}${last} ${L("última entrevista", "last interview")}</em>` : ""}</div>
    <div class="row"><b>${v}<small>/100</small></b><span class="tier">${mediaTier(v)}</span></div>
    <div class="bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}" aria-label="${L("Valor mediático", "Media value")}">${Array.from({ length: 20 }, (_, k) => `<i class="${k < Math.round(v / 5) ? "on" : ""}"></i>`).join("")}</div></div>`;
}
// ---------- interviews: the press conference when the Grand Prix starts, then the pit lane before and after the race ----------
const IV = { el: null, on: false, kind: null, qs: [], i: 0, res: [], m0: 0, done: null, ctx: null, who: [], others: null, ans: null };
const ivName = n => n ? n.charAt(0) + n.slice(1).toLowerCase() : "";
function ivCtx(kind) {
  const t = DRIVERS[0].team, T = TEAMS[t], mine = DRIVERS.filter(d => !d.ai);
  const order = [...TEAM_ORDER].sort((a, b) => TEAMS[b].skill - TEAMS[a].skill), k = order.indexOf(t);
  const rival = order[k > 0 ? k - 1 : 1];
  const c = { team: T.full, rival: TEAMS[rival].full, gp: GP_INFO.title, pu: T.pu, d1: ivName(mine[0].name), d2: ivName(mine[1].name), perf: teamInfo(t).perf, k1: mine[0].code, k2: mine[1].code };
  if (kind === "grid" && cars.length) {
    const g = [cars[0], cars[1]].sort((a, b) => a.slot - b.slot);
    c.g = g[0].slot + 1; c.d1 = ivName(g[0].name); c.d2 = ivName(g[1].name); c.k1 = g[0].code; c.k2 = g[1].code;
    c.front = c.g <= 2; c.backq = c.g > 10; c.wet = WXC && (WXC.s >= 2 || (WXC.s >= 1 && Math.random() < .6));
  }
  if (kind === "post" && cars.length) {
    const R = resultsData(), me = R.filter(r => !r.c.ai).sort((a, b) => (a.pos || 99) - (b.pos || 99));
    const [a, b] = me; c.d1 = ivName(a.c.name); c.d2 = ivName(b.c.name); c.k1 = a.c.code; c.k2 = b.c.code;
    c.p = a.pos || 0; c.pts = me.reduce((s, r) => s + r.pts, 0);
    c.win = c.p === 1; c.podium = c.p >= 1 && c.p <= 3; c.points = c.p >= 1 && c.p <= 10; c.nopts = !c.points;
    const out = me.filter(r => r.g === 2); c.dnf = out.length; c.dnf2 = out.length === 2; c.out = out[0] ? ivName(out[0].c.name) : c.d2;
    c.both = me.every(r => r.pos && r.pos <= 10); c.close = !!(a.pos && b.pos && Math.abs(a.pos - b.pos) <= 2);
    c.gain = (a.gain || 0) >= 4; c.lost = a.gain != null && a.gain <= -3; c.d2bad = !b.pos || b.pos > 10;
    c.fl = !!(FL && me.some(r => r.c.code === FL.code));
  }
  return c;
}
const ivFill = (s, c) => s.replace(/\{(\w+)\}/g, (_, k) => c[k] != null ? c[k] : "");
function ivPick(kind, c) {
  let seen; try { seen = JSON.parse(localStorage.getItem("rtm.ivseen") || "[]"); } catch (e) { seen = []; }
  const pool = IV_Q.filter(q => q.at === kind && (!q.w || c[q.w]));
  const out = [], pri = pool.filter(q => q.pri).sort((a, b) => b.pri - a.pri);
  if (pri.length) out.push(pri[0]);                                  // after the race: the result comes first
  const rest = pool.filter(q => !q.pri && !out.includes(q));
  while (out.length < 3 && rest.length) {
    const w = rest.map(q => (q.w ? 3 : 1) * (seen.includes(q.id) ? .15 : 1)), sum = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum, j = 0; while (r > w[j]) r -= w[j++];
    out.push(rest.splice(j, 1)[0]);
  }
  seen = [...out.map(q => q.id), ...seen.filter(id => !out.some(q => q.id === id))].slice(0, 36);
  try { localStorage.setItem("rtm.ivseen", JSON.stringify(seen)); } catch (e) { }
  return out;
}
// ---- the pictures: a pixel-art set behind (low resolution, scaled up), the Team Principal in front, then props in front of him
// ---- the pictures: the user's sets (the reporter is part of them), the Team Principal standing where the microphone points.
// Positions in the picture (0..1): head centre x, head top y, head height (top to chin) as a share of the picture's height.
const IV_SET = { press: { src: "assets/press/studio.jpg", tp: [.775, .145, .235], fx: .54 }, grid: { src: "assets/press/pit.jpg", tp: [.77, .1, .2], fx: .55 } };
IV_SET.post = IV_SET.grid;
function ivEl() {
  if (IV.el) return IV.el;
  const el = document.createElement("div"); el.id = "iv"; el.hidden = true; el.dataset.nt = "1"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
  el.innerHTML = `<div class="iv-cam"><canvas class="iv-bg"></canvas></div><div class="iv-top"></div><section class="iv-pan" aria-live="polite"></section>`;
  document.body.append(el); IV.el = el;
  el.addEventListener("click", ivClick);
  addEventListener("resize", () => { if (IV.on) ivScene(); });
  return el;
}
function ivBox() {                                                      // the part of the screen the picture fills
  const W = IV.el.clientWidth, H = IV.el.clientHeight, side = W / H >= 1.05;
  return side ? { W, H, side, w: W, h: H } : { W, H, side, w: W, h: Math.round(Math.min(W / 1.45, H * .42)) };
}
function ivScene() {
  const el = IV.el; if (!el) return;
  const S = IV_SET[IV.kind], im = IMGC[S.src], B = ivBox(), dpr = Math.min(2, devicePixelRatio || 1), cv = el.querySelector(".iv-bg");
  el.style.setProperty("--ivh", B.side ? "100%" : B.h + "px");
  cv.width = Math.round(B.W * dpr); cv.height = Math.round(B.H * dpr);
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = "#07090c"; g.fillRect(0, 0, B.W, B.H);
  if (!im || !im.naturalWidth) return;
  const iw = im.naturalWidth, ih = im.naturalHeight, k = Math.max(B.w / iw, B.h / ih);
  const ox = Math.min(0, Math.max(B.w - iw * k, B.w / 2 - S.fx * iw * k)), oy = 0;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(im, ox, oy, iw * k, ih * k);
  const f = tpCompose(TP, DRIVERS[0].team); if (!f) return;
  const [hx, hy, hh] = S.tp, Z = f.Z || 1, s = hh * ih * k / (f.hh || 92);   // the head is 92 figure px from top to chin (hers: f.hh)
  const fx = f.hx / Z, fy = f.hy / Z, cx = ox + hx * iw * k, top = oy + hy * ih * k;
  g.save(); g.beginPath(); g.rect(0, 0, B.w, B.h); g.clip();
  g.filter = "drop-shadow(0 0 1px rgba(0,0,0,.45))"; g.imageSmoothingEnabled = false;
  g.drawImage(f, cx - (fx + 32) * s, top - fy * s, f.width / Z * s, f.height / Z * s);
  g.restore();
}
// ---- the flow
function ivOpen(kind, done) {
  const el = ivEl(), t = DRIVERS[0].team;
  IV.kind = kind; IV.done = done; IV.ctx = ivCtx(kind); IV.qs = ivPick(kind, IV.ctx); IV.i = 0; IV.res = []; IV.m0 = mediaOf(t); IV.ans = null;
  IV.who = [IV_REPORTER, IV_REPORTER, IV_REPORTER];
  const figs = [tpFigKey(TP, t)], imgs = imgsReady([IV_SET[kind].src]);
  figs.forEach(fk => tpLoad(fk)); tpHeadLoad();
  gate(() => imgs() === true && figs.every(fk => TPF[fk]?.ready) && TPH.ready ? true : .6, () => {
    IV.on = true; el.hidden = false; el.dataset.k = kind; el.classList.remove("in"); void el.offsetWidth; el.classList.add("in");
    ivTop(); ivPanel(); ivScene();
  }, L("Preparando la entrevista", "Setting up the interview"));
}
function ivTop() {
  const k = IV.kind, title = k === "press" ? L("Entrevista · previa del GP", "Interview · GP preview") : k === "grid" ? L("Entrevista · antes de la carrera", "Interview · before the race") : L("Entrevista · después de la carrera", "Interview · after the race");
  const sub = k === "press" ? L(`Plató de televisión · Gran Premio de ${GP_INFO.title}`, `TV studio · ${GP_INFO.title} Grand Prix`) : L(`Pit lane · ${GP_INFO.title}`, `Pit lane · ${GP_INFO.title}`);
  IV.el.querySelector(".iv-top").innerHTML = `<span class="iv-live"><i></i>${L("En directo", "Live")}</span><div><b>${title}</b><span>${sub}</span></div>`;
}
function ivPanel() {
  const p = IV.el.querySelector(".iv-pan"), t = DRIVERS[0].team, n = IV.qs.length, m = mediaOf(t);
  const head = `<div class="iv-ph"><div class="dots">${IV.qs.map((_, j) => `<i class="${j < IV.i ? "done" : j === IV.i ? "on" : ""}"></i>`).join("")}</div>
    <span>${IV.i < n ? L(`Pregunta ${IV.i + 1} de ${n}`, `Question ${IV.i + 1} of ${n}`) : L("Final", "Wrap-up")}</span><span class="iv-mv" title="${L("Valor mediático", "Media value")}">${L("Valor mediático", "Media value")} <b>${m}</b></span></div>`;
  if (IV.i >= n) {                                                      // the summary
    const d = m - IV.m0;
    p.innerHTML = head + `<div class="iv-body iv-sum"><span class="k">${L("Fin de la entrevista", "End of the interview")}</span>
      <div class="big"><b>${IV.m0}</b><i>→</i><b>${m}</b><em class="${d > 0 ? "up" : d < 0 ? "dn" : ""}">${d > 0 ? "+" : ""}${d}</em></div>
      <p>${d > 3 ? L("La prensa se queda con tus titulares. El valor mediático del equipo sube.", "The press love your headlines. The team's media value goes up.") : d >= 0 ? L("Una entrevista correcta. El equipo mantiene su imagen.", "A solid interview. The team keeps its image.") : L("Tus respuestas no han gustado. El valor mediático del equipo baja.", "Your answers didn't go down well. The team's media value drops.")}</p>
      <ul>${IV.res.map(r => `<li><span class="tone t-${r.tone}">${L(...IV_TONE[r.tone])}</span><span class="q">${r.q}</span><b class="${r.m > 0 ? "up" : r.m < 0 ? "dn" : ""}">${r.m > 0 ? "+" : ""}${r.m}</b></li>`).join("")}</ul></div>
      <div class="iv-f"><button class="iv-go" data-ivgo="end">${L("Continuar", "Continue")} ▶</button></div>`;
    setTimeout(() => p.querySelector(".iv-go")?.focus({ preventScroll: true }), 50); return;
  }
  const q = IV.qs[IV.i], c = IV.ctx, who = IV.who[IV.i] || IV_REPORTER, lang = OPT.lang === "en" ? 1 : 0;
  if (!IV.order || IV.order.q !== q.id) IV.order = { q: q.id, a: [0, 1, 2, 3].sort(() => Math.random() - .5) };
  const qt = ivFill(q.q[lang], c), ini = who[0].split(" ").map(x => x[0]).join("");
  const ans = IV.order.a.map((j, n2) => { const a = q.a[j], txt = ivFill(a[2 + lang], c), chosen = IV.ans === j;
    return `<button class="iv-a${chosen ? " on" : ""}" data-iva="${j}"${IV.ans != null ? " disabled" : ""}><span class="n">${n2 + 1}</span><span class="tone t-${a[0]}">${L(...IV_TONE[a[0]])}</span><span class="tx">${esc(txt)}</span>${chosen ? `<b class="dl ${a[1] > 0 ? "up" : a[1] < 0 ? "dn" : ""}">${a[1] > 0 ? "+" : ""}${a[1]}</b>` : ""}</button>`; }).join("");
  p.innerHTML = head + `<div class="iv-body"><div class="iv-who"><i>${ini}</i><div><b>${who[0]}</b><span>${who[1]}</span></div>${IV.ans == null ? `<button class="iv-skip" data-ivgo="skip">${L("No contestar", "No comment")} <small>−2</small></button>` : ""}</div>
    <p class="iv-q">«${esc(qt)}»</p><div class="iv-as" role="group" aria-label="${L("Respuestas", "Answers")}">${ans}</div></div>
    ${IV.ans != null ? `<div class="iv-f"><button class="iv-go" data-ivgo="next">${IV.i + 1 < n ? L("Siguiente pregunta", "Next question") : L("Terminar", "Finish")} ▶</button></div>` : ""}`;
  if (IV.ans != null) setTimeout(() => p.querySelector(".iv-go")?.focus({ preventScroll: true }), 50);
}
function ivAnswer(j) {
  if (IV.ans != null || IV.i >= IV.qs.length) return;
  const q = IV.qs[IV.i], t = DRIVERS[0].team, a = j < 0 ? ["e", -2] : q.a[j];
  mediaAdd(t, a[1]); IV.ans = j < 0 ? -1 : j;
  if (j >= 0 && isSeason()) sIvEffect(q.id, a[0], IV.ctx);
  IV.res.push({ tone: a[0], m: a[1], q: esc(ivFill(q.q[OPT.lang === "en" ? 1 : 0], IV.ctx)) });
  if (j < 0) { ivNext(); return; }
  ivPanel();
}
function ivNext() { IV.i++; IV.ans = null; ivPanel(); }
function ivClose() {
  const t = DRIVERS[0].team, d = mediaOf(t) - IV.m0; MEDIA["~" + t] = d; try { localStorage.setItem("rtm.media", JSON.stringify(MEDIA)); } catch (e) { }
  IV.on = false; IV.el.classList.add("out");
  setTimeout(() => { IV.el.hidden = true; IV.el.classList.remove("out"); const f = IV.done; IV.done = null; f && f(); }, 420);
}
function ivClick(e) {
  const a = e.target.closest("[data-iva]"); if (a && !a.disabled) { ivAnswer(+a.dataset.iva); return; }
  const g = e.target.closest("[data-ivgo]"); if (!g) return;
  if (g.dataset.ivgo === "next") ivNext(); else if (g.dataset.ivgo === "skip") ivAnswer(-1); else if (g.dataset.ivgo === "end") ivClose();
}
addEventListener("keydown", e => {                                     // 1-4 answer, Enter goes on; the game's keys stay out of it
  if (!IV.on) return; e.stopPropagation();
  if (/^[1-4]$/.test(e.key) && IV.ans == null && IV.i < IV.qs.length) { e.preventDefault(); ivAnswer(IV.order.a[+e.key - 1]); }
  else if (e.key === "Enter" && !(document.activeElement && document.activeElement.closest && document.activeElement.closest("#iv button"))) { const b = IV.el.querySelector(".iv-go"); if (b) { e.preventDefault(); b.click(); } }
}, true);
