// =====================================================================================================
// ---------- SEASON MODE: portraits, charts and the HQ screens ----------
// =====================================================================================================
// ---- portraits: drivers in any team's race suit, generated faces, staff in team kit
const PT_META = {"GAS":{"skin":"#f9af81","top":15,"chin":92},"COL":{"skin":"#f9b08d","top":11,"chin":95},"ALO":{"skin":"#f7a773","top":10,"chin":95},"STR":{"skin":"#f9ab78","top":10,"chin":94},"HUL":{"skin":"#f7a370","top":8,"chin":94},"BOR":{"skin":"#ee9059","top":8,"chin":93},"PER":{"skin":"#f3a470","top":10,"chin":95},"BOT":{"skin":"#f09e70","top":15,"chin":95},"LEC":{"skin":"#f6a77d","top":9,"chin":95},"HAM":{"skin":"#af5e30","top":13,"chin":94},"OCO":{"skin":"#f0a471","top":14,"chin":96},"BEA":{"skin":"#f2a073","top":11,"chin":95},"NOR":{"skin":"#f39f74","top":13,"chin":93},"PIA":{"skin":"#f09f76","top":13,"chin":94},"RUS":{"skin":"#f59c67","top":10,"chin":95},"ANT":{"skin":"#f4a171","top":13,"chin":95},"LAW":{"skin":"#f19f79","top":14,"chin":93},"LIN":{"skin":"#e48b55","top":14,"chin":92},"VER":{"skin":"#e99573","top":12,"chin":91},"HAD":{"skin":"#df8654","top":18,"chin":92},"SAI":{"skin":"#ef9863","top":17,"chin":94},"ALB":{"skin":"#e08756","top":17,"chin":93}};
const PT_TEAMS = ["mcl", "mer", "rbr", "fer", "wil", "rcb", "amr", "haa", "aud", "alp", "cad", "neu"];
const PT_ORIG = Object.fromEntries(DRIVERS0.map(d => [d.code, d.team]));
var PT = { heads: new Image(), suits: new Image(), sheet: new Image(), url: {}, cache: {}, neck: {}, wait: [] };
[PT.heads, PT.suits, PT.sheet].forEach(im => im.addEventListener("load", () => { if (ptReady()) PT.wait.splice(0).forEach(f => f()); }));
let PT_SRC = 0;
function ptLoad() { if (PT_SRC) return; PT_SRC = 1; PT.heads.src = "assets/pt/heads.webp"; PT.suits.src = "assets/pt/suits.webp"; PT.sheet.src = "assets/img/drivers.jpg"; }
const ptReady = () => [PT.heads, PT.suits, PT.sheet].every(i => i.complete && i.naturalWidth);
function ptWhen(f) { ptLoad(); tpHeadLoad(); const ok = () => ptReady() && TPH.ready; if (ok()) f(); else { const go = () => ok() ? f() : setTimeout(go, 120); PT.wait.push(go); setTimeout(go, 200); } }
const ptLook = p => Object.assign({}, TP_DEF, p.look || {});
function ptNeck(team, skin) {                                    // the suit's neck opening in this driver's skin tone
  const key = team + skin; if (PT.neck[key]) return PT.neck[key];
  const j = Math.max(0, PT_TEAMS.indexOf(team)), c = mkCanvas(152, 192), g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(PT.suits, j * 152, 384, 152, 192, 0, 0, 152, 192);
  const id = g.getImageData(0, 0, 152, 192), d = id.data, [R, G, B] = hex2rgb(skin);
  for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const k = d[i] / 128; d[i] = Math.min(255, R * k); d[i + 1] = Math.min(255, G * k); d[i + 2] = Math.min(255, B * k); }
  g.putImageData(id, 0, 0); return (PT.neck[key] = c);
}
function ptDriver(code, team) {                                   // 152 × 192, like a cell of assets/img/drivers.jpg
  if (!ptReady()) return null;
  const p = S && S.people[code], i = PORTRAIT.indexOf(code), sprite = i >= 0 && i < 22, t = team || (p && p.team) || null;
  const c = mkCanvas(152, 192), g = c.getContext("2d");
  if (sprite && t === PT_ORIG[code]) { g.drawImage(PT.sheet, (i % 7) * 152, Math.floor(i / 7) * 192, 152, 192, 0, 0, 152, 192); return c; }
  const tt = t && PT_TEAMS.includes(t) ? t : "neu", j = PT_TEAMS.indexOf(tt);
  if (!sprite && p && sFem(p)) { if (!FEMX.ready) { femLoad(); return null; }   // women: their head (no neck of its own) on the suit's neck
    const st = ptFemSt(p), i2 = st.fh, h = femHead(i2, femHairHex(st, i2)), k = 86 / ((FEM_B.c[0][2] - 1 - FEM_B.c[0][3]) * FEM_B.sf * TP_Z);
    g.drawImage(PT.suits, j * 152, 0, 152, 192, 0, 0, 152, 192); g.drawImage(ptNeck(tt, FEM_H.skin[i2]), 0, 0); g.imageSmoothingQuality = "high";
    g.drawImage(h, 76 - FEM_H.ax * k, 94 - FEM_H.ay * k, FEM_H.cw * k, FEM_H.ch * k);
    g.drawImage(PT.suits, j * 152, 192, 152, 192, 0, 0, 152, 192); return c; }
  let skin = "#e9a27a", head = null;
  if (sprite) skin = PT_META[code].skin;
  else { if (!TPH.ready) return null; const lk = ptLook(p || { look: {} }); skin = TP_SKIN[lk.skin] || TP_SKIN[1]; head = tpHead(lk); }
  g.drawImage(PT.suits, j * 152, 0, 152, 192, 0, 0, 152, 192);
  g.drawImage(ptNeck(tt, skin), 0, 0);
  if (sprite) g.drawImage(PT.heads, (i % 7) * 152, Math.floor(i / 7) * 192, 152, 192, 0, 0, 152, 192);
  else if (head) { const k = 86 / (TPH.chin - TPH.top); g.imageSmoothingQuality = "high"; g.drawImage(head, 76 - TPH.cx * k, 8 - TPH.top * k, TPH.W * k, TPH.H * k); }
  g.drawImage(PT.suits, j * 152, 192, 152, 192, 0, 0, 152, 192);
  return c;
}
function ptStaffSt(p, t) { const st = ptLook(p); st.pants = 3; if (t && TP_KIT[t]) { st.top = "tpolo"; st.topCol = 0; } else if (t) { st.top = "shirt"; st.topCol = 6; } else { st.top = "blazer"; st.topCol = 0; } return st; }
// ---- women: the user's 14 heads (plus Paola's own) on the user's 5 outfits, the same full figure as the Team Principal's (femCompose)
// [skin tone 0 light … 6 dark, hair colour, style, glasses 0 none 1 glasses 2 sunglasses, older]
const FEM_META = [[3, 1, "short", 0], [1, 1, "short", 0], [0, 0, "bob", 0], [1, 2, "long", 0], [5, 0, "afro", 0], [0, 4, "short", 0], [4, 1, "long", 0], [1, 7, "short", 0, 1],
  [1, 6, "long", 0], [0, 0, "bun", 0], [1, 2, "long", 1], [5, 0, "long", 0], [2, 5, "bob", 2], [1, 0, "short", 2]];
const FEM_HC = [0, 1, 2, 2.6, 4, 4.6, 3.5, 6, 6.5];             // hair colours on one light-to-dark-ish line, to compare them
const FEM_OUT = { td: 0, aero: 1, eng: 2, sd: 4, driver: 3 };   // blazer, shirt, shirt with pass, polo, coat
const FEMHC = { key: "", map: {} };
function femHeadOf(p) {                                          // the head that best fits how the person is described, spreading the 14 around
  if (p.look && p.look.fh != null) return p.look.fh;
  const all = Object.values((S && S.people) || { [p.id]: p }).filter(x => sFem(x) && x.look.fh == null).sort((a, b) => a.id < b.id ? -1 : 1), key = all.map(x => x.id).join(",");
  const FEMH = FEMHC;
  if (FEMH.key !== key) { FEMH.key = key; FEMH.map = {}; const used = {};
    all.forEach(x => { const L = x.look, st = ["long", "bob", "bun"].includes(L.hair) ? L.hair : "short"; let best = 0, bs = 1e9;
      FEM_META.forEach((m, i) => { if (i === 3) return;            // head 3 is Paola's: nobody else gets it
        const sc = 2 * Math.abs((L.skin || 0) - m[0]) + 1.6 * Math.abs((FEM_HC[L.hairCol] ?? 1) - FEM_HC[m[1]]) + (st === m[2] ? 0 : 1.5)
          + ((L.glasses === "glasses") === (m[3] === 1) ? 0 : m[3] === 2 ? 1.2 : 2) + (m[4] ? (x.age > 52 ? -2 : 4) : 0) + (used[i] || 0) * 4;
        if (sc < bs) { bs = sc; best = i; } });
      used[best] = (used[best] || 0) + 1; FEMH.map[x.id] = best; }); }
  return FEMH.map[p.id] ?? 0;
}
function ptFemSt(p) {                                           // a woman of the staff as a figure: her head, her hair colour, her role's outfit
  const lk = p.look || {}, o = FEM_OUT[p.kind] ?? 3, team = p.team ? Math.max(0, FEM_OUTS[o].cols.findIndex(c => c[0] === "team")) : 0;   // in a team, shirts and polos in its colour
  return { face: "f", fh: femHeadOf(p), fo: o, ftc: team, fpa: FEM_OUTS[o].pants, fhc: lk.fh != null ? (lk.fhc ?? -1) : (lk.hairCol ?? -1) };
}
function ptStaff(p) {                                           // head and shoulders: men in the team's kit, women in their role's outfit
  const fem = sFem(p), t = p.team, st = fem ? ptFemSt(p) : ptStaffSt(p, t), tk = t || DRIVERS[0].team, fk = tpFigKey(st, tk);
  if (!TPF[fk] || !TPF[fk].ready || (!fem && !TPH.ready)) { tpLoad(fk); return null; }
  const f = tpCompose(st, tk); if (!f) return null;
  const c = mkCanvas(152, 192), g = c.getContext("2d"), Z = f.Z, col = t ? TEAMS[t].col : "#5a6472";
  const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, tpShade(col, .55)); gr.addColorStop(1, tpShade(col, .22)); g.fillStyle = gr; g.fillRect(0, 0, 152, 192);
  const q = fem ? (f.hh || 92) / 92 * 1.08 : 1;                  // her head is drawn a little bigger: the same framing, with room for buns and curls
  g.imageSmoothingQuality = "high"; g.drawImage(f, f.hx + (32 - 52 * q) * Z, f.hy - (fem ? 19 : 14) * q * Z, 104 * q * Z, 131 * q * Z, 0, 0, 152, 192);
  return c;
}
function ptCanvas(p) { return !p ? null : p.kind === "driver" ? ptDriver(p.id, p.team) : ptStaff(p); }
function ptKey(p) { return p.id + "|" + (p.team || "-"); }
function ptFill(root) {                                         // every <canvas data-pp> in root gets its portrait when the art is in
  const cvs = [...(root || document).querySelectorAll("canvas[data-pp]")]; if (!cvs.length) return;
  ptWhen(() => {
    const todo = cvs.filter(cv => !cv.dataset.done);
    const step = () => {
      let again = false;
      todo.forEach(cv => {
        if (cv.dataset.done) return; const p = S && S.people[cv.dataset.pp]; if (!p) return;
        let src = PT.cache[ptKey(p)]; if (!src) { src = ptCanvas(p); if (src) PT.cache[ptKey(p)] = src; }
        if (!src) { again = true; return; }
        const g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingQuality = "high"; g.drawImage(src, 0, 0, cv.width, cv.height); cv.dataset.done = 1;
      });
      if (again) setTimeout(step, 150);
    };
    step();
  });
}
const ppImg = (id, w = 76, cls = "") => `<canvas class="ppt ${cls}" data-pp="${id}" width="${w * 2}" height="${Math.round(w * 2 * 192 / 152)}" style="width:${w}px;height:${Math.round(w * 192 / 152)}px"></canvas>`;
function ptUrl(c) { return PT && PT.url[c] || ""; }
function ptRefresh() {                                          // the race portraits (CSS backgrounds) of every driver not in his own suit
  if (!S) { PT.url = {}; return; }
  ptWhen(() => {
    const u = {};
    DRIVERS.forEach(d => {
      const i = PORTRAIT.indexOf(d.code); if (i >= 0 && i < 22 && PT_ORIG[d.code] === d.team) return;
      const c = ptDriver(d.code, d.team); if (c) u[d.code] = c.toDataURL("image/webp", .9);
    });
    PT.url = u; ui.forEach(x => x.rename && x.rename());
    if (FRONT.v === "hq" && HQS.stage && S) sRefresh();
  });
}
// ---- charts (inline SVG): thin lines, the player's team in its colour, the rest recessive
const CH_INK = "#a7b1be", CH_GRID = "rgba(255,255,255,.08)";
const meter = (v, max = 100, col = "var(--tc)") => `<span class="sm-m"><i style="width:${clampN(v / max, 0, 1) * 100}%;background:${col}"></i></span>`;
const statCol = v => v >= 85 ? "#3ecf8e" : v >= 75 ? "#9bd35a" : v >= 65 ? "#f2c94c" : "#ef6b5b";
// ---- the screens of the HQ in a season
const SP = { sec: null, tab: {}, modal: null };
const sKick = (a, b) => `<div class="sp-h"><div><span class="k">${a}</span><b>${b}</b></div><div class="rt">${sDate(S.day, true)} · ${L("semana", "week")} ${sWeekN(S.day)}</div></div>`;
const card = (title, body, cls = "", extra = "") => `<section class="sp-c ${cls}">${title ? `<div class="sp-ct"><span>${title}</span>${extra}</div>` : ""}${body}</section>`;
const kpi = (k, v, sub = "", cls = "") => `<div class="sp-k ${cls}"><span>${k}</span><b>${v}</b>${sub ? `<em>${sub}</em>` : ""}</div>`;
function sPageShow(sec) {
  const el = $("hqPage"); if (!el || !S) return;
  if (SX_FIRST[sec]) sec = SX_FIRST[sec];
  SP.sec = sec; const f = SPAGE[sec] || SPAGE.home, changed = SP.last !== sec;
  el.hidden = false; el.innerHTML = `<div class="sp${changed ? " ani" : ""}">${f()}</div>`; SP.last = sec;
  const h = el.querySelector(".sp-h");
  if ($("sxT")) { $("sxK").textContent = h ? h.querySelector(".k").textContent : ""; $("sxT").textContent = h ? h.querySelector("b").textContent : ""; sxTabs(sec); sxNavSync(sec); if (changed) sxCaption(sec); }
  el.querySelectorAll(".sp-c, .tl, .pc, .pcard").forEach((c, i) => c.style.setProperty("--i", Math.min(i, 14)));
  ptFill(el); sxCountAll(changed, el);
  el.querySelectorAll(".spl-sc").forEach(sc => { const t = sc.querySelector(".spl-now"); if (t && sc.scrollWidth > sc.clientWidth + 4) sc.scrollLeft = Math.max(0, t.offsetLeft - sc.clientWidth * .35); });   // the plan opens on today
  if (changed) { el.scrollTop = 0; if (sxSheet() && SX.sheet === "min") sxSnap("mid"); }
}
function sRefresh() {                                           // after anything changes: the next event, the figures at the top, the open screen
  const c = $("hqSeason"); if (c) c.outerHTML = sSideCard();
  const k = $("sxKpis"); if (k) { k.innerHTML = sxKpis(); sxCountAll(false, k); }
  const d = $("sxDate"); if (d) d.textContent = sxDate();
  if (SP.sec != null && $("hqPage")) { const el = $("hqPage"), y = el.scrollTop; sPageShow(SP.sec); el.scrollTop = y; }
}
function sMainLabel() {
  if (S.fired) return [L("Despedido", "Sacked"), L("Ver la decisión", "See the decision")];
  if (S.over) return [L("Fin de la temporada", "End of season"), L("Ver el balance", "See the review")];
  if (!S.steps.board) return [L("Pretemporada", "Pre-season"), L("Reunión con la junta", "Meet the board")];
  if (!S.steps.design) return [L("Pretemporada", "Pre-season"), L("Diseñar el coche", "Design the car")];
  const ev = sPending(); if (!ev) return ["", ""];
  if (S.day >= ev.day) return [sEvName(ev), ev.type === "gp" ? L("Ir al Gran Premio", "Go to the Grand Prix") : ev.type === "test" ? L("Ir al test", "Go to the test") : L("Reunión de la junta", "Board meeting")];
  return [sEvName(ev), L("Avanzar", "Continue")];
}
const sEvName = ev => ev.type === "gp" ? `${L("Ronda", "Round")} ${ev.round} · ${L(...circOf(ev).gp)}` : ev.type === "test" ? L("Test de pretemporada", "Pre-season test") : L(`Junta directiva · ${ev.q < 4 ? "trimestre " + ev.q : "final"}`, `Board · ${ev.q < 4 ? "quarter " + ev.q : "final"}`);
function sMain() {
  if (S.fired) { sFiredShow(); return; }
  if (S.over) { sFinal(); return; }
  if (!S.steps.board) { sBoardOpen(); return; }
  if (!S.steps.design) { hqOpen("rnd"); return; }
  const ev = sPending(); if (!ev) return;
  if (S.day >= ev.day) { if (ev.type === "gp") sGpGo(ev); else if (ev.type === "test") sTestGo(); else sBoardOpen(); return; }
  sAdv(false);
}
function sAdv(week) {
  const n0 = S.news.length, top = S.news[0], r = sAdvance(week); sRefresh();
  if (S.pop) setTimeout(sPopShow, 450);
  const fresh = []; for (const n of S.news) { if (n === top) break; fresh.push(n); } if (fresh.length) sToast(fresh.slice(0, 4));
  const ev = sPending(); if (r === "event" && ev && ev.type === "board") setTimeout(sBoardOpen, 350);
}
function sGpGo(ev) { sGpPrep(ev); S._go = 1; hqGo(); S._go = 0; }
function sTestGo() {
  sModal(`<div class="sm-h"><span>${L("Pretemporada", "Pre-season")}</span><b>${L("Test de Barcelona", "Barcelona test")}</b></div>
    <p class="sm-p">${L("Una hora en pista con todos los equipos, como unos libres. Los tiempos y los datos del coche sustituirán a la predicción del túnel de viento.", "One hour on track with every team, like a practice session. The times and the car's data will replace the wind tunnel prediction.")}</p>
    <div class="sm-f"><button class="sp-btn gh" data-sa="testsim">${L("Simular el test", "Simulate the test")}</button><button class="sp-btn" data-sa="testplay">${L("Dirigir el test", "Run the test")} ▶</button></div>`);
}
function sTestRun(play) {
  sModalClose(); sTestStart();
  gate(gpReady, () => { hideFront(); if (play) playSession("TEST"); else { simSession("TEST"); showSesResults("TEST"); } }, L("Preparando el test", "Preparing the test"));
}
// ---- modal
function sModal(html, wide) {
  let m = $("smod"); if (!m) { m = document.createElement("div"); m.id = "smod"; m.dataset.nt = "1"; document.body.append(m); m.addEventListener("click", sClick); m.addEventListener("input", sInput); m.addEventListener("change", sInput); }
  m.className = wide ? "wide" : ""; m.hidden = false; m.style.setProperty("--tc", TEAMS[S ? S.team : DRIVERS[0].team].col); m.innerHTML = `<div class="sm-box" role="dialog" aria-modal="true"><button class="sm-x" data-sa="mclose" aria-label="${L("Cerrar", "Close")}">✕</button>${html}</div>`;
  ptFill(m); requestAnimationFrame(() => m.classList.add("in"));
}
function sModalClose() { const m = $("smod"); if (m) { m.hidden = true; m.classList.remove("in"); m.innerHTML = ""; } SP.modal = null; }
// ---- board meetings
function sBoardOpen() {
  const B = S.board, first = !S.steps.board, ev = sPending();
  if (!first && !(ev && ev.type === "board" && S.day >= ev.day)) { hqOpen("board"); return; }
  SP.modal = { k: "board", rv: first ? null : sBoardReview(), msg: null };
  if (SP.modal.rv) { sBoardClose(SP.modal.rv); sRefresh(); }
  sBoardRender();
}
function sObjRow(o, done) {
  const v = o.v !== undefined ? o.v : sObjValue(o), sc = o.s !== undefined ? o.s : sObjScore(o), lower = o.k === "best" || o.k === "cap";
  const vt = v == null ? "—" : o.k === "best" ? "P" + v : o.k === "cap" ? v + " %" : v, tt = o.k === "best" ? "P" + o.t : o.k === "cap" ? "≤ " + o.t + " %" : (lower ? "≤ " : "≥ ") + o.t;
  return `<div class="ob"><span class="on">${L(...OBJ_N[o.k])}</span><span class="ot">${L("Objetivo", "Target")} <b>${tt}</b></span>${done !== false ? `<span class="ov">${L("Ahora", "Now")} <b>${vt}</b></span>${meter(sc * 100, 100, sc >= 1 ? "#3ecf8e" : sc > .6 ? "#f2c94c" : "#ef6b5b")}` : ""}</div>`;
}
function sBoardRender() {
  const B = S.board, M = SP.modal, rv = M.rv, T = TEAMS[S.team], q = B.q;
  const offer = `<div class="sm-g2">
      ${card(L("Presupuesto de la temporada", "Season budget"), `<div class="big">${money(B.B)}</div><p class="sm-s">${L("40 % al empezar y el resto por trimestres, según los resultados.", "40% up front and the rest each quarter, depending on results.")}</p>
        ${hbars(TEAM_ORDER.map(t => { const e = (B.order || TEAM_ORDER).indexOf(t) + 1; return { lab: TEAMS[t].name, v: t === S.team ? B.B : 150 + (11 - e) * 8, c: t === S.team ? T.col : "#4a5360", me: t === S.team }; }).sort((a, b) => b.v - a.v), { fmt: v => Math.round(v) + " M$", min: 100 })}`)}
      ${card(L("Lo que espera la junta", "What the board expects"), `<div class="big">P${B.target} <small>${L("en constructores", "in the constructors'")}</small></div>
        <div class="obl">${B.obj.items.map(o => sObjRow(o, false)).join("")}</div>
        <p class="sm-s">${L(`Objetivos del trimestre ${q} (rondas ${q * 2 - 1} y ${q * 2}). La junta se reúne cada dos carreras.`, `Quarter ${q} targets (rounds ${q * 2 - 1} and ${q * 2}). The board meets every two races.`)}</p>`)}
    </div>`;
  const nego = B.asked ? `<p class="sm-msg ${M.msg ? (M.msg.ok ? "ok" : "ko") : ""}">${M.msg ? M.msg.t : ""}</p>` : `<div class="sm-ng">
      <span>${L("Negociar", "Negotiate")}</span>
      ${[.1, .2].map(p => `<button class="sp-btn gh" data-sa="ask" data-v="${p}">${L("Pedir", "Ask for")} +${p * 100} % <em>${Math.round(sAskChance(p) * 100)} % ${L("de que acepten", "chance")}</em></button>`).join("")}
      <button class="sp-btn gh" data-sa="ask" data-v="-0.1">${L("Rebajar objetivos", "Lower the targets")} <em>−10 % ${L("presupuesto", "budget")}</em></button></div>`;
  let review = "";
  if (rv) {
    const H = [...B.hist.map(h => h.conf)], rounds = S.stand.rounds;
    review = `<div class="sm-g2">
      ${card(L(`Balance del trimestre ${rv.q}`, `Quarter ${rv.q} review`), `<div class="obl">${rv.items.map(o => sObjRow(o)).join("")}</div>
        <div class="sm-sc"><span>${L("Nota de la junta", "Board rating")}</span><b>${Math.round(rv.score * 100)} / 100</b><em class="${rv.dConf >= 0 ? "up" : "dn"}">${rv.dConf >= 0 ? "+" : ""}${rv.dConf} ${L("confianza", "confidence")}</em></div>
        ${rv.pay ? `<p class="sm-s">${L("Aportación para el próximo trimestre", "Funding for next quarter")}: <b>${money(rv.pay)}</b></p>` : ""}`)}
      ${card(L("Puntos por carrera", "Points per race"), svgLine({ w: 460, h: 170, x: rounds.map(r => "R" + r.r), series: [{ n: T.name, c: T.col, w: 3, v: rounds.map(r => r.res.filter(x => x[1] === S.team).reduce((a, x) => a + x[3], 0)) }],
        band: [{ v: PPR[B.target], c: "#f2c94c", n: L("objetivo", "target") }], min: 0 }) + `<div class="lgd"><i style="background:${T.col}"></i>${T.name}<i class="dsh"></i>${L("Ritmo del objetivo", "Target pace")}</div>`)}
    </div>`;
  }
  const head = `<div class="sm-h"><span>${L("Junta directiva", "Board of directors")} · ${rv ? (rv.q < 4 ? L(`Reunión del trimestre ${rv.q}`, `Quarter ${rv.q} meeting`) : L("Reunión final", "Final meeting")) : L("Pretemporada 2026", "2026 pre-season")}</span>
    <b>${T.full}</b><div class="cf"><span>${L("Confianza", "Confidence")}</span>${svgGauge(B.conf, 100, B.conf >= 55 ? "#3ecf8e" : B.conf > 35 ? "#f2c94c" : "#ef6b5b", L("Confianza de la junta", "Board confidence"))}</div></div>`;
  const intro = !rv ? `<p class="sm-p">${L(`La junta te recibe en tu primer día. Espera que ${T.full} termine <b>P${B.exp}</b> en el campeonato de constructores y pone el dinero en función de eso y de lo que espera de ti. Puedes aceptar o negociar: más dinero significa objetivos más duros, y pueden decir que no.`,
    `The board welcomes you on your first day. It expects ${T.full} to finish <b>P${B.exp}</b> in the constructors' championship and funds the team on that basis and on what it expects from you. Accept or negotiate: more money means tougher targets, and they can say no.`)}</p>` : "";
  const nextObj = rv && rv.q < 4 ? `<div class="sm-sep">${L(`Objetivos para el trimestre ${q} (rondas ${q * 2 - 1} y ${q * 2})`, `Targets for quarter ${q} (rounds ${q * 2 - 1} and ${q * 2})`)}</div>` : "";
  sModal(head + intro + review + (rv && rv.q === 4 ? "" : (rv ? nextObj : "") + offer + nego) + `<div class="sm-f"><button class="sp-btn" data-sa="bclose">${rv && rv.q === 4 ? L("Ver el balance de la temporada", "See the season review") : L("Aceptar y cerrar la reunión", "Accept and close the meeting")} ▶</button></div>`, true);
}
function sFinal() {
  const pos = sConsPos(S.team), B = S.board, T = TEAMS[S.team], ok = pos <= B.target, D = sDrvOrder();
  const rounds = S.stand.rounds, cum = t => { let a = 0; return rounds.map(r => (a += r.res.filter(x => x[1] === t).reduce((s, x) => s + x[3], 0))); };
  sModal(`<div class="sm-h"><span>${L("Fin de la temporada de prueba", "End of the test season")}</span><b>${L("Balance de la temporada", "Season review")}</b></div>
    <div class="sm-g3">${kpi(L("Constructores", "Constructors'"), "P" + pos, L(`objetivo P${B.target}`, `target P${B.target}`), ok ? "ok" : "ko")}${kpi(L("Puntos", "Points"), S.stand.t[S.team] || 0)}${kpi(L("Confianza de la junta", "Board confidence"), B.conf + "/100")}</div>
    <p class="sm-p">${ok ? L("La junta está satisfecha: has cumplido el objetivo del campeonato.", "The board is happy: you met the championship target.") : B.conf < 25 ? L("La junta ha perdido la confianza en ti. En una temporada real, este sería tu último día.", "The board has lost confidence in you. In a real season, this would be your last day.") : L("No has llegado al objetivo, pero la junta mantiene su confianza.", "You missed the target, but the board keeps its confidence.")}</p>
    ${(() => { const ts = sConsOrder().slice(0, 6); if (!ts.includes(S.team)) ts.push(S.team);
      const ser = ts.map(t => ({ n: TEAMS[t].name, c: t === S.team ? TEAMS[t].col : "#5b6572", w: t === S.team ? 3 : 1.5, v: cum(t) }));
      return card(L("Puntos acumulados", "Points over the season"), svgLine({ w: 820, h: 220, x: rounds.map(r => "R" + r.r), series: ser, min: 0 })
        + `<div class="lgd"><i style="background:${T.col}"></i>${T.name}<i></i>${L("Resto del top 6 (pasa el ratón por un punto para ver el equipo)", "Rest of the top 6 (hover a point to see the team)")}</div>`); })()}
    ${B.hist.length ? card(L("Las reuniones de la junta", "The board meetings"), hbars(B.hist.map(h => ({ lab: L(`Trimestre ${h.q}`, `Quarter ${h.q}`), v: Math.round(h.score * 100), c: h.score >= .8 ? "#3ecf8e" : h.score >= .5 ? "#f2c94c" : "#ef6b5b" })), { fmt: v => v + " / 100", min: 0, max: 100 })) : ""}
    <div class="sm-f"><button class="sp-btn gh" data-sa="mclose">${L("Seguir en la sede", "Stay at the HQ")}</button><button class="sp-btn" data-sa="tomenu">${L("Menú principal", "Main menu")} ▶</button></div>`, true);
}
// ---- the screens
const SPAGE = {};
// ---- clicks and inputs on the screens and in the modal
function sClick(e) {
  const g2 = e.target.closest("[data-go2]"); if (g2) { sModalClose(); hqOpen(g2.dataset.go2); return; }
  const tb = e.target.closest("[data-tab]"); if (tb) { SP.tab[tb.dataset.tab] = tb.dataset.v; sRefresh(); return; }
  const sx = e.target.closest("[data-sx]"); if (sx) { sxAct(sx.dataset.sx); return; }
  const b = e.target.closest("[data-sa]"); if (!b || b.disabled || b.tagName === "SELECT" || b.tagName === "INPUT" && b.type === "range") return;
  const a = b.dataset.sa, v = b.dataset.v, M = SP.modal;
  if (a === "main") sMain(); else if (a === "week") sAdv(true);
  else if (a === "mclose") { sModalClose(); sRefresh(); }
  else if (a === "testplay" || a === "testsim") sTestRun(a === "testplay");
  else if (a === "ask") { const ok = sBoardAsk(+v); M.msg = { ok, t: +v < 0 ? L("La junta rebaja los objetivos y el presupuesto.", "The board lowers the targets and the budget.") : ok ? L("La junta acepta: más dinero, objetivos más exigentes.", "The board agrees: more money, tougher targets.") : L("La junta rechaza la petición. Su confianza baja un poco.", "The board turns the request down. Its confidence drops a little.") }; sBoardRender(); }
  else if (a === "bclose") { if (M && M.rv) { const q = M.rv.q; sModalClose(); saveGame(); if (q === 4) sFinal(); } else { sBoardInitDone(); sModalClose(); } sRefresh(); if (!M || !M.rv) hqOpen("active"); }
  else if (a === "desok") { sDesignStart(SP.des); sApply(); saveGame(); sRefresh(); }
  else if (a === "desstep") { const ax = b.dataset.ax; SP.desAx = ax; desSetTo(SP.des, ax, SP.des.pr[ax] + (+v)); }
  else if (a === "despre") desPreset(v);
  else if (a === "desinv") { SP.des.inv = +v; document.querySelectorAll("[data-sa=desinv]").forEach(x => x.setAttribute("aria-pressed", x.dataset.v === v)); desLive(); }
  else if (a === "newdev") sDevModal(b.dataset.p);
  else if (a === "circ") sCircModal(v);
  else if (a === "dvamb") { M.amb = +v; sDevModal(M.p); } else if (a === "dvfoc") { M.focus = v; sDevModal(M.p); }
  else if (a === "dvurg") { M.urg = b.checked; sDevModal(M.p); }
  else if (a === "dvgo") { sDevStart(sDevPlan(M.p, M.amb, M.focus, M.urg)); sModalClose(); sRefresh(); }
  else if (a === "mfg") { sMfgStart(b.dataset.p, +b.dataset.n, +b.dataset.q); sRefresh(); }
  else if (a === "tun") { if (!sTestStartPart(b.dataset.p, +b.dataset.n)) b.disabled = true; sRefresh(); }
  else if (a === "pu") { sPuNew(+b.dataset.k, b.dataset.e); sRefresh(); }
  else if (a === "tr") sTrain(v);
  else if (a === "opk") { SP.ops.k = +v; SP.ops.pick = null; sRefresh(); }
  else if (a === "opp") { SP.ops.p = v; SP.ops.pick = null; sRefresh(); }
  else if (a === "oppick") { SP.ops.pick = SP.ops.pick === +v ? null : +v; sRefresh(); }
  else if (a === "opfit") { sFit(SP.ops.k, SP.ops.p, +v); SP.ops.pick = null; sRefresh(); }
  else if (a === "person") sPersonModal(v);
  else if (a === "offer") { SP.modal = null; sOfferModal(v); }
  else if (a === "ofrole") { M.role = v; sOfferModal(M.id); } else if (a === "ofyrs") { M.yrs = +v; sOfferModal(M.id); }
  else if (a === "ofgo") { const p = S.people[M.id], ch = sAccept(p, M.sal, M.yrs, M.role), ok = Math.random() < ch;
    if (ok) { sSign(p, r1(M.sal), M.yrs, M.role); M.res = { ok, t: L(`${sName(p)} acepta. ${sFem(p) ? "Bienvenida" : "Bienvenido"} al equipo.`, `${sName(p)} accepts. Welcome to the team.`) }; }
    else { p.refused = S.day; M.res = { ok, t: L(`${sName(p)} rechaza la oferta.`, `${sName(p)} turns the offer down.`) }; }
    sOfferModal(M.id); sRefresh(); }
  else if (a === "tomenu") { sModalClose(); saveGame(); showFront("main"); }
  else if (a === "newok") { sModalClose(); startNew(SP.pend || "gp"); }
}
function sInput(e) {
  const t = e.target;
  if (t.dataset.des) {
    const D = SP.des, k = t.dataset.des; if (k.startsWith("pr.")) D.pr[k.slice(3)] = +t.value; else D[k] = +t.value;
    const b = t.parentElement.querySelector("b"); if (b) b.textContent = t.value + (t.dataset.sfx || "");
    const P = sDesParts(D); document.querySelectorAll("[data-dp]").forEach(el => { el.innerHTML = P[el.dataset.dp]; }); return;
  }
  if (t.dataset.sa === "ofsal" && SP.modal) {
    const M = SP.modal, p = S.people[M.id]; M.sal = +t.value; const b = t.parentElement.querySelector("b"); if (b) b.textContent = money(+t.value);
    const ch = sAccept(p, M.sal, M.yrs, M.role), v = $("ofCh"), m = $("ofChM"); if (v) v.textContent = Math.round(ch * 100) + " %"; if (m) m.outerHTML = `<span id="ofChM">${meter(ch * 100, 100, statCol(ch * 100))}</span>`; return;
  }
  if (t.dataset.sa === "fit") { if (t.value) sFit(+t.dataset.k, t.dataset.p, +t.value); sRefresh(); }
}
function sTrain(v) {
  const cr = S.crew[S.team];
  if (v === "sim") { S.train.sim = !S.train.sim; sRefresh(); saveGame(); return; }
  if (S.trainWk === sWeekN(S.day)) return; S.trainWk = sWeekN(S.day);
  const sdk = (sSD(S.team) ? sSD(S.team).a.lead : 78) / 85;
  if (v === "pit") { cr.spd = Math.min(97, r1(cr.spd + .6 * sdk)); cr.cons = Math.min(97, r1(cr.cons + .3 * sdk)); cr.fat = Math.min(100, cr.fat + 10); sSpend(.2, "trn", L("Práctica de paradas", "Pit stop practice")); }
  if (v === "rest") { cr.fat = Math.max(0, cr.fat - 15); cr.mot = Math.min(99, cr.mot + 3); }
  if (v === "fit") { sMyDrv().forEach(p => sMot(p.id, 3)); sSpend(.15, "trn", L("Preparación física", "Physical training")); }
  sApply(); saveGame(); sRefresh();
}
function sWkAdjust() {                                          // race engineers and the simulator: a better starting set-up
  if (!S || !WK) return;
  [0, 1].forEach(k => { const W = WK.car[k], e = sEngs(S.team)[k]; if (!W || !W.err) return; let f = 1.25 - ((e ? e.a.set : 78) + (e ? (e.mot - 70) * .2 : 0)) / 120; if (S.train.sim) f *= .75; W.err = W.err.map(x => x * clampN(f, .3, 1.2)); });
  if (S.train.sim) sSpend(.4, "trn", L("Simulador antes del GP", "Pre-GP simulator"));
}
function sApplyPen() {                                          // power-unit penalties move the car down the grid
  if (!S || !S.pu || !WK || !WK.grid || WK.pen) return; WK.pen = 1;
  [0, 1].forEach(k => { const pen = S.pu.pen[k]; if (!pen) return; const order = WK.grid.map((g, i) => ({ i, g })).sort((a, b) => a.g - b.g).map(x => x.i);
    const at = order.indexOf(k); order.splice(at, 1); order.splice(Math.min(order.length, at + pen), 0, k); order.forEach((i, p) => WK.grid[i] = p); });
}

function sToast(items) {                                        // what happened while the days went by
  let t = $("spToast"); if (!t) { t = document.createElement("div"); t.id = "spToast"; t.dataset.nt = "1"; t.setAttribute("role", "status"); document.body.append(t); t.addEventListener("click", () => t.classList.remove("in")); }
  t.innerHTML = items.map(n => `<div class="n-${n.k}"><span>${sDate(n.d)}</span>${n.txt}</div>`).join("");
  t.classList.remove("in"); void t.offsetWidth; t.classList.add("in"); clearTimeout(sToast.h); sToast.h = setTimeout(() => t.classList.remove("in"), 6500);
}
// ---- main menu: continue the saved game, or start a new one
function fmContinue() {
  const d = readSave(); if (!d || !TEAMS[d.team]) return "";
  const T = TEAMS[d.team], s = d.season, tp = d.tp ? `${d.tp.first || ""} ${(d.tp.last || "").toUpperCase()}`.trim() : "";
  const mins = Math.max(0, Math.round((Date.now() - d.t) / 6e4)), ago = mins < 1 ? L("ahora mismo", "just now") : mins < 60 ? L(`hace ${mins} min`, `${mins} min ago`) : mins < 1440 ? L(`hace ${Math.round(mins / 60)} h`, `${Math.round(mins / 60)} h ago`) : L(`hace ${Math.round(mins / 1440)} días`, `${Math.round(mins / 1440)} days ago`);
  let meta;
  if (s) {
    const ev = s.cal.find(e => !e.done), pos = [...TEAM_ORDER].sort((a, b) => (s.stand.t[b] || 0) - (s.stand.t[a] || 0) || S_LV[b] - S_LV[a]).indexOf(s.team) + 1, races = s.stand.rounds.length;
    meta = [sDate(s.day), ev ? sEvName(ev) : L("Temporada terminada", "Season over")]; if (races) meta.push(`P${pos} · ${s.stand.t[s.team] || 0} pts`);
  } else meta = [d.wk ? L("Fin de semana en curso", "Weekend in progress") : L("En la sede", "At the HQ"), GP_INFO.title];
  return `<button class="fm-t fm-cont" data-cont="1" style="--tc:${T.col}"><span class="im"></span>
    <span class="cl">${teamLogo(d.team, "clg")}</span>
    <span class="cx"><span class="k">${L("Continuar", "Continue")} · ${s ? L("Temporada", "Season") : L("Gran Premio", "Grand Prix")}</span><b>${T.full}</b>
      <span class="meta">${tp ? `<span>${tp}</span>` : ""}${meta.map(m => `<span>${m}</span>`).join("")}<span>${L("Guardado", "Saved")} ${ago}</span></span></span>
    <span class="go">${L("Continuar", "Continue")} ▶</span></button>`;
}
function fmNew(mode) {                                          // a new game: confirm first if it replaces the saved one
  const d = readSave();
  if (!d) { startNew(mode); return; }
  SP.pend = mode;
  sModal(`<div class="sm-h"><span>${mode === "season" ? L("Nueva temporada", "New season") : L("Nuevo Gran Premio", "New Grand Prix")}</span><b>${L("¿Empezar una partida nueva?", "Start a new game?")}</b></div>
    <p class="sm-p">${L(`Tienes una partida guardada con ${TEAMS[d.team] ? TEAMS[d.team].full : ""}${d.season ? " (temporada)" : ""}. Si empiezas una nueva, se sobrescribirá en cuanto llegues a la sede.`, `You have a saved game with ${TEAMS[d.team] ? TEAMS[d.team].full : ""}${d.season ? " (season)" : ""}. Starting a new one will overwrite it as soon as you reach the HQ.`)}</p>
    <div class="sm-f"><button class="sp-btn gh" data-sa="mclose">${L("Cancelar", "Cancel")}</button><button class="sp-btn" data-sa="newok">${L("Empezar de nuevo", "Start new")} ▶</button></div>`);
}
function startNew(mode) {
  GAME.mode = mode; GAME.on = true; S = null; WK = null; SP.des = null; SP.desBase = null; SP.desPre = undefined; SP.tab = {};
  resetRoster(); sGpInfo(null);
  for (const k in MEDIA) delete MEDIA[k]; try { localStorage.setItem("rtm.media", "{}"); } catch (e) { }
  FRONT.team = DRIVERS[0].team; showFront("team");
}
function fmContinueGo() {
  if (!loadGame()) { renderFront(); return; }
  sModalClose(); openHQ();
}

// =====================================================================================================
// ---------- SEASON MODE: charts (inline SVG / HTML), all animated when they appear ----------
// =====================================================================================================
let CH_UID = 0;
const CH_MUTED = "#5b6572";
const chNum = v => (Math.round(v * 10) / 10).toLocaleString(OPT.lang === "en" ? "en-GB" : "es-ES");
// lines (and areas): {w, h, x:[labels], series:[{n, c, v:[], w, dash, area, lab}], min, max, inv, ticks, fmt, band:[{v,c,n}], dots:"all"|"last"|"none", endLab}
function svgLine(o) {
  const w = o.w || 520, h = o.h || 180, L0 = o.l ?? 36, R0 = o.r ?? (o.endLab ? 74 : 12), T0 = 12, B0 = 22, uid = "g" + (++CH_UID);
  const all = o.series.flatMap(s => s.v.filter(v => v != null)); if (!all.length) all.push(0, 1);
  let mn = o.min ?? Math.min(...all, ...(o.band || []).map(b => b.v)), mx = o.max ?? Math.max(...all, ...(o.band || []).map(b => b.v)); if (mx - mn < 1e-6) { mx += 1; mn -= 1; }
  const len = Math.max(...o.series.map(s => s.v.length), (o.x || []).length, 1), n = Math.max(1, len - 1);
  const X = i => L0 + (len === 1 ? .5 : i / n) * (w - L0 - R0), Y = v => T0 + (o.inv ? (v - mn) / (mx - mn) : 1 - (v - mn) / (mx - mn)) * (h - T0 - B0), fmt = o.fmt || (v => chNum(v));
  let s = `<svg class="ch" viewBox="0 0 ${w} ${h}" role="img" aria-label="${o.aria || ""}"><defs>${o.series.map((se, k) => se.area ? `<linearGradient id="${uid}a${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${se.c}" stop-opacity=".38"/><stop offset="1" stop-color="${se.c}" stop-opacity="0"/></linearGradient>` : "").join("")}</defs>`;
  const ticks = o.ticks || (o.inv ? [mn, Math.round((mn + mx) / 2), mx] : [0, 1, 2, 3].map(k => mn + (mx - mn) * k / 3));
  ticks.forEach(v => { const y = Y(v); s += `<line x1="${L0}" x2="${w - R0}" y1="${y}" y2="${y}" stroke="${CH_GRID}"/><text x="${L0 - 6}" y="${y + 3}" text-anchor="end">${fmt(v)}</text>`; });
  const xl = o.x || []; xl.forEach((lb, i) => { if (xl.length > 12 && i % Math.ceil(xl.length / 10)) return; s += `<text x="${X(i)}" y="${h - 6}" text-anchor="middle">${lb}</text>`; });
  (o.band || []).forEach(b => { s += `<line x1="${L0}" x2="${w - R0}" y1="${Y(b.v)}" y2="${Y(b.v)}" stroke="${b.c}" stroke-dasharray="4 4" stroke-width="1.5"/><text x="${w - R0}" y="${Y(b.v) - 4}" text-anchor="end" fill="${b.c}">${b.n}</text>`; });
  const ends = [];
  o.series.forEach((se, k) => {
    const pts = se.v.map((v, i) => v == null ? null : [X(i), Y(v)]).filter(Boolean); if (!pts.length) return;
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
    if (se.area && pts.length > 1) s += `<path class="an-fade" d="${d}L${pts[pts.length - 1][0].toFixed(1)} ${h - B0}L${pts[0][0].toFixed(1)} ${h - B0}Z" fill="url(#${uid}a${k})" style="--d:${k * .1 + .3}s"/>`;
    s += `<path class="${se.dash ? "an-fade" : "an-ln"}" ${se.dash ? "" : 'pathLength="1"'} d="${d}" fill="none" stroke="${se.c}" stroke-width="${se.w || 2}" ${se.dash ? `stroke-dasharray="${se.dash}"` : ""} stroke-linejoin="round" stroke-linecap="round" style="--d:${k * .08}s"${se.op ? ` opacity="${se.op}"` : ""}/>`;
    const dots = o.dots || (len <= 12 ? "all" : "last");
    se.v.forEach((v, i) => { if (v == null || dots === "none" || (dots === "last" && i !== se.v.length - 1 && !(len === 1))) return;
      s += `<circle class="an-pop" cx="${X(i)}" cy="${Y(v)}" r="${(se.w || 2) > 2 ? 4.5 : 3}" fill="${se.c}" stroke="#0b0f14" stroke-width="1.5" style="--d:${.5 + i * .03}s;transform-origin:${X(i)}px ${Y(v)}px"><title>${se.n} · ${xl[i] ?? i + 1} · ${fmt(v)}</title></circle>`; });
    if (o.endLab) { const li = se.v.map((v, i) => v == null ? -1 : i).filter(i => i >= 0).pop(); if (li != null) ends.push({ y: Y(se.v[li]), x: X(li), n: se.lab || se.n, c: se.c, b: (se.w || 2) > 2 }); }
  });
  ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 11) ends[i].y = ends[i - 1].y + 11;
  ends.forEach(e => { s += `<text class="an-fade" x="${e.x + 8}" y="${e.y + 3}" style="--d:.7s" ${e.b ? 'font-weight="800" fill="#eef1f5"' : ""}>${e.n}</text>`; });
  return s + "</svg>";
}
// radar: {axes, labels:{k:[es,en]}, sets:[{n,c,v:{},fill,dash,band}], size, min, max}
function svgRadar(o) {
  const S0 = o.size || 260, c = S0 / 2, r = c - (o.pad ?? 36), mn = o.min ?? 40, mx = o.max ?? 100, n = o.axes.length;
  const P = (i, v) => { const a = -Math.PI / 2 + i / n * Math.PI * 2, k = clampN((v - mn) / (mx - mn), 0, 1.05) * r; return [c + Math.cos(a) * k, c + Math.sin(a) * k]; };
  const lab = a => L(...((o.labels && o.labels[a]) || ST_S[a] || DES_N[a] || [a, a]));
  let s = `<svg class="ch rdr" viewBox="0 0 ${S0} ${S0}" role="img" aria-label="${o.aria || ""}">`;
  [.25, .5, .75, 1].forEach(f => { s += `<polygon points="${o.axes.map((_, i) => P(i, mn + (mx - mn) * f).join(",")).join(" ")}" fill="${f === 1 ? "rgba(255,255,255,.02)" : "none"}" stroke="${CH_GRID}"/>`; });
  o.axes.forEach((a, i) => { const [x, y] = P(i, mx), [lx, ly] = P(i, mx + (mx - mn) * .22); s += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="${CH_GRID}"/><text x="${lx}" y="${ly + 3}" text-anchor="middle">${lab(a)}</text>`; });
  o.sets.forEach((se, k) => {
    const org = `transform-origin:${c}px ${c}px`;
    if (se.band) { const out = o.axes.map((a, i) => P(i, se.v[a] + se.band)), inn = o.axes.map((a, i) => P(i, se.v[a] - se.band)).reverse(); s += `<polygon class="an-pop" style="${org};--d:${k * .12}s" points="${[...out, ...inn].map(p => p.join(",")).join(" ")}" fill="${se.c}" opacity=".14" fill-rule="evenodd"/>`; }
    s += `<polygon class="an-pop" style="${org};--d:${k * .12}s" points="${o.axes.map((a, i) => P(i, se.v[a]).join(",")).join(" ")}" fill="${se.fill ? se.c : "none"}" fill-opacity=".18" stroke="${se.c}" stroke-width="2" stroke-linejoin="round" ${se.dash ? `stroke-dasharray="${se.dash}"` : ""}/>`;
    o.axes.forEach((a, i) => { const [x, y] = P(i, se.v[a]); s += `<circle class="an-pop" style="${org};--d:${k * .12 + .1}s" cx="${x}" cy="${y}" r="3" fill="${se.c}"><title>${se.n} · ${lab(a)} · ${Math.round(se.v[a])}</title></circle>`; });
  });
  return s + "</svg>";
}
// half-circle meter
function svgGauge(v, max, col, lab, sub) {
  const f = clampN(v / max, 0, 1);
  return `<svg class="ch gauge" viewBox="0 0 120 72" role="img" aria-label="${lab || ""}"><path d="M14 60A46 46 0 0 1 106 60" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="9" stroke-linecap="round"/>
    <path class="an-arc" pathLength="1" d="M14 60A46 46 0 0 1 106 60" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${f.toFixed(3)} 1"/>
    <text x="60" y="56" text-anchor="middle" class="gv">${Math.round(v)}</text>${sub ? `<text x="60" y="70" text-anchor="middle">${sub}</text>` : ""}</svg>`;
}
// a ring: progress, condition, share
function ring(v, max, col, size = 54, txt, sub) {
  const f = clampN(v / max, 0, 1), r = 42;
  return `<svg class="ch ring" viewBox="0 0 100 100" style="width:${size}px;height:${size}px" role="img" aria-label="${txt ?? Math.round(f * 100)}"><circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="9"/>
    <circle class="an-arc" pathLength="1" cx="50" cy="50" r="${r}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${f.toFixed(3)} 1" transform="rotate(-90 50 50)"/>
    <text x="50" y="${sub ? 52 : 58}" text-anchor="middle" class="rv">${txt ?? Math.round(f * 100)}</text>${sub ? `<text x="50" y="70" text-anchor="middle" class="rs">${sub}</text>` : ""}</svg>`;
}
// donut: [{lab, v, c}] + centre text; the legend is HTML
function svgDonut(items, o = {}) {
  const tot = items.reduce((a, i) => a + Math.max(0, i.v), 0) || 1, r = 40, gap = items.length > 1 ? .006 : 0;
  let acc = 0, s = `<svg class="ch donut" viewBox="0 0 100 100" role="img" aria-label="${o.aria || ""}"><circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="13"/>`;
  items.forEach((it, k) => { const f = Math.max(0, it.v) / tot; if (f <= 0) return;
    s += `<circle class="an-dn" pathLength="1" cx="50" cy="50" r="${r}" fill="none" stroke="${it.c}" stroke-width="13" stroke-dasharray="${Math.max(.001, f - gap).toFixed(4)} 1" stroke-dashoffset="${(-acc).toFixed(4)}" transform="rotate(-90 50 50)" style="--d:${k * .08}s"><title>${it.lab} · ${o.fmt ? o.fmt(it.v) : chNum(it.v)} · ${Math.round(f * 100)} %</title></circle>`; acc += f; });
  s += `<text x="50" y="${o.sub ? 50 : 55}" text-anchor="middle" class="dv">${o.center ?? ""}</text>${o.sub ? `<text x="50" y="63" text-anchor="middle" class="ds">${o.sub}</text>` : ""}</svg>`;
  const lg = `<div class="dlg">${items.map(it => `<div><i style="background:${it.c}"></i><span>${it.lab}</span><b>${o.fmt ? o.fmt(it.v) : chNum(it.v)}</b><em>${Math.round(Math.max(0, it.v) / tot * 100)} %</em></div>`).join("")}</div>`;
  return `<div class="dnw">${s}${lg}</div>`;
}
// sparkline
function spark(vals, col, w = 84, h = 26) {
  const v = vals.filter(x => x != null); if (v.length < 2) return `<svg class="spk" viewBox="0 0 ${w} ${h}"></svg>`;
  const mn = Math.min(...v), mx = Math.max(...v), d = mx - mn || 1, X = i => i / (v.length - 1) * (w - 4) + 2, Y = x => h - 3 - (x - mn) / d * (h - 6);
  const p = v.map((x, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(x).toFixed(1)}`).join(""), uid = "s" + (++CH_UID);
  return `<svg class="spk" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".35"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
    <path d="${p}L${X(v.length - 1)} ${h}L${X(0)} ${h}Z" fill="url(#${uid})"/><path class="an-ln" pathLength="1" d="${p}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="${X(v.length - 1)}" cy="${Y(v[v.length - 1])}" r="2.4" fill="${col}"/></svg>`;
}
// horizontal bars (values outside the bar)
function hbars(items, o = {}) {
  const mx = o.max ?? Math.max(...items.map(i => Math.abs(i.v)), 1), mn = o.min ?? 0;
  return `<div class="hb">${items.map((i, k) => `<div class="hbr${i.me ? " me" : ""}" title="${i.lab} · ${o.fmt ? o.fmt(i.v) : i.v}" style="--i:${k}"><span class="hl">${i.lab}</span><span class="ht"><i style="width:${clampN((i.v - mn) / (mx - mn), 0, 1) * 100}%;background:${i.c || "#7d8792"}"></i></span><b>${o.fmt ? o.fmt(i.v) : i.v}</b></div>`).join("")}</div>`;
}
// diverging bars around zero: [{lab, v, c?}]
function divBars(items, o = {}) {
  const mx = o.max ?? Math.max(...items.map(i => Math.abs(i.v)), .1);
  return `<div class="dvb">${items.map((i, k) => { const f = clampN(Math.abs(i.v) / mx, 0, 1) * 50, pos = i.v >= 0;
    return `<div class="dvr" style="--i:${k}" title="${i.lab} · ${o.fmt ? o.fmt(i.v) : i.v}"><span class="hl">${i.lab}</span><span class="dt"><u></u><i class="${pos ? "p" : "n"}" style="${pos ? "left:50%" : `left:${50 - f}%`};width:${f}%;${i.c ? `background:${i.c}` : ""}"></i></span><b class="${pos ? "p" : "n"}">${o.fmt ? o.fmt(i.v) : (i.v > 0 ? "+" : "") + chNum(i.v)}</b></div>`; }).join("")}</div>`;
}
// lollipop rows: gap to a reference
function lolli(items, o = {}) {
  const mx = o.max ?? Math.max(...items.map(i => i.v), .01);
  return `<div class="lol">${items.map((i, k) => `<div class="lor${i.me ? " me" : ""}" style="--i:${k}"><span class="hl">${i.lab}</span><span class="lt"><i style="width:${clampN(i.v / mx, 0, 1) * 100}%;--c:${i.c || "#7d8792"}"></i></span><b>${o.fmt ? o.fmt(i.v) : i.v}</b></div>`).join("")}</div>`;
}
// bullet: target vs now (lower = better for some)
function bullet(v, t, max, lower, col) {
  const f = x => clampN(x / max, 0, 1) * 100, good = lower ? v != null && v <= t : v != null && v >= t;
  return `<div class="bul${good ? " ok" : ""}"><span class="bz" style="width:${f(lower ? max : t)}%"></span><i style="width:${v == null ? 0 : f(v)}%;background:${good ? "#3ecf8e" : col}"></i><s style="left:${f(t)}%"></s></div>`;
}
// heat map (HTML): {cols:[labels], rows:[{lab, c, me, v:[...]}], color:(v)=>css, fmt}
function heat(o) {
  const nc = o.cols.length;
  return `<div class="hm" style="--nc:${nc}"><span></span>${o.cols.map(c => `<span class="hc">${c}</span>`).join("")}
    ${o.rows.map((r, k) => `<span class="hr${r.me ? " me" : ""}">${r.c ? `<i style="background:${r.c}"></i>` : ""}${r.lab}</span>${r.v.map((v, j) => `<span class="hv" style="background:${v == null ? "rgba(255,255,255,.03)" : o.color(v)};--i:${k * nc + j}" title="${r.lab} · ${o.cols[j]} · ${v == null ? "—" : (o.fmt ? o.fmt(v) : v)}">${v == null ? "" : (o.fmt ? o.fmt(v) : v)}</span>`).join("")}`).join("")}</div>`;
}
const heatPos = p => p == null ? "transparent" : p === 0 ? "#5a1416" : p === 1 ? "#b8860b" : p <= 3 ? "#7a6a2a" : p <= 10 ? `rgba(62,207,142,${.55 - p * .035})` : "rgba(255,255,255,.07)";
// scatter / bubbles: {w,h,points:[{x,y,r,c,lab,id,me}],xlab,ylab,xfmt,yfmt,xmin,xmax,ymin,ymax}
function svgScatter(o) {
  const w = o.w || 560, h = o.h || 300, L0 = 42, R0 = 14, T0 = 12, B0 = 34, ps = o.points;
  const xs = ps.map(p => p.x), ys = ps.map(p => p.y), x0 = o.xmin ?? Math.min(...xs) - 1, x1 = o.xmax ?? Math.max(...xs) + 1, y0 = o.ymin ?? Math.min(...ys) - 1, y1 = o.ymax ?? Math.max(...ys) + 1;
  const X = v => L0 + (v - x0) / (x1 - x0) * (w - L0 - R0), Y = v => h - B0 - (v - y0) / (y1 - y0) * (h - T0 - B0);
  let s = `<svg class="ch sct" viewBox="0 0 ${w} ${h}" role="img" aria-label="${o.aria || ""}">`;
  for (let k = 0; k <= 4; k++) { const vx = x0 + (x1 - x0) * k / 4, vy = y0 + (y1 - y0) * k / 4;
    s += `<line x1="${X(vx)}" x2="${X(vx)}" y1="${T0}" y2="${h - B0}" stroke="${CH_GRID}"/><text x="${X(vx)}" y="${h - B0 + 14}" text-anchor="middle">${o.xfmt ? o.xfmt(vx) : Math.round(vx)}</text>`;
    s += `<line x1="${L0}" x2="${w - R0}" y1="${Y(vy)}" y2="${Y(vy)}" stroke="${CH_GRID}"/><text x="${L0 - 6}" y="${Y(vy) + 3}" text-anchor="end">${o.yfmt ? o.yfmt(vy) : Math.round(vy)}</text>`; }
  s += `<text x="${(L0 + w - R0) / 2}" y="${h - 4}" text-anchor="middle" class="ax">${o.xlab || ""}</text><text x="10" y="${(T0 + h - B0) / 2}" text-anchor="middle" class="ax" transform="rotate(-90 10 ${(T0 + h - B0) / 2})">${o.ylab || ""}</text>`;
  [...ps].sort((a, b) => (b.r || 5) - (a.r || 5)).forEach((p, k) => { const cx = X(p.x), cy = Y(p.y);
    s += `<g class="sp-pt${p.me ? " me" : ""}" ${p.id ? `data-sa="person" data-v="${p.id}"` : ""}><circle class="an-pop" cx="${cx}" cy="${cy}" r="${p.r || 5}" fill="${p.c}" fill-opacity="${p.me ? .95 : .7}" stroke="#0b0f14" stroke-width="2" style="--d:${Math.min(k, 30) * .02}s;transform-origin:${cx}px ${cy}px"><title>${p.lab}</title></circle>${p.tag ? `<text x="${cx}" y="${cy - (p.r || 5) - 4}" text-anchor="middle" class="pl">${p.tag}</text>` : ""}</g>`; });
  return s + "</svg>";
}
// waterfall: start, steps [{lab, v}], end
function svgWaterfall(o) {
  const w = o.w || 560, h = o.h || 220, L0 = 40, R0 = 8, T0 = 10, B0 = 38, st = o.items, n = st.length + 2;
  let run = o.start, lo = Math.min(0, o.start), hi = Math.max(0, o.start); const bars = [{ lab: o.startLab, a: 0, b: o.start, k: "t" }];
  st.forEach(i => { bars.push({ lab: i.lab, a: run, b: run + i.v, k: i.v >= 0 ? "p" : "n", v: i.v }); run += i.v; lo = Math.min(lo, run); hi = Math.max(hi, run); });
  bars.push({ lab: o.endLab, a: 0, b: run, k: "t" }); lo = Math.min(lo, 0);
  const bw = (w - L0 - R0) / n, Y = v => T0 + (1 - (v - lo) / (hi - lo || 1)) * (h - T0 - B0);
  let s = `<svg class="ch wf" viewBox="0 0 ${w} ${h}" role="img" aria-label="${o.aria || ""}">`;
  [lo, (lo + hi) / 2, hi].forEach(v => { s += `<line x1="${L0}" x2="${w - R0}" y1="${Y(v)}" y2="${Y(v)}" stroke="${CH_GRID}"/><text x="${L0 - 5}" y="${Y(v) + 3}" text-anchor="end">${Math.round(v)}</text>`; });
  bars.forEach((b, i) => { const x = L0 + i * bw + 3, y = Y(Math.max(b.a, b.b)), hh = Math.max(1.5, Math.abs(Y(b.a) - Y(b.b))), col = b.k === "t" ? o.col : b.k === "p" ? "#3ecf8e" : "#ef6b5b";
    s += `<rect class="an-bar" x="${x}" y="${y}" width="${bw - 6}" height="${hh}" rx="3" fill="${col}" style="--d:${i * .06}s;transform-origin:${x}px ${Y(b.a)}px"><title>${b.lab} · ${b.v != null ? (b.v > 0 ? "+" : "") + chNum(b.v) : chNum(b.b)} M$</title></rect>`;
    if (i < bars.length - 1) s += `<line x1="${x + bw - 6}" x2="${x + bw}" y1="${Y(b.b)}" y2="${Y(b.b)}" stroke="rgba(255,255,255,.25)" stroke-dasharray="2 2"/>`;
    s += `<text x="${x + (bw - 6) / 2}" y="${h - B0 + 13}" text-anchor="middle" class="wl">${b.lab.length > 9 ? b.lab.slice(0, 8) + "…" : b.lab}</text><text x="${x + (bw - 6) / 2}" y="${y - 4}" text-anchor="middle" class="wv">${b.v != null ? (b.v > 0 ? "+" : "") + Math.round(b.v) : Math.round(b.b)}</text>`; });
  return s + "</svg>";
}
// histogram
function svgHist(vals, o = {}) {
  const w = o.w || 460, h = o.h || 170, L0 = 30, B0 = 22, T0 = 10, R0 = 8, a = o.min ?? Math.min(...vals), b = o.max ?? Math.max(...vals), nb = o.bins || 16, bw = (b - a) / nb;
  const cnt = Array(nb).fill(0); vals.forEach(v => { cnt[clampN(Math.floor((v - a) / bw), 0, nb - 1)]++; });
  const mx = Math.max(...cnt, 1), X = v => L0 + (v - a) / (b - a) * (w - L0 - R0), Y = c => h - B0 - c / mx * (h - T0 - B0), mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  let s = `<svg class="ch hist" viewBox="0 0 ${w} ${h}" role="img" aria-label="${o.aria || ""}">`;
  cnt.forEach((c, i) => { const x = X(a + i * bw) + 1, y = Y(c); s += `<rect class="an-bar" x="${x}" y="${y}" width="${Math.max(1, X(a + bw) - X(a) - 2)}" height="${h - B0 - y}" rx="2" fill="${o.col || "#5fb7ff"}" style="--d:${i * .025}s;transform-origin:${x}px ${h - B0}px"><title>${(a + i * bw).toFixed(1)}–${(a + (i + 1) * bw).toFixed(1)} s · ${Math.round(c / vals.length * 100)} %</title></rect>`; });
  for (let k = 0; k <= 4; k++) { const v = a + (b - a) * k / 4; s += `<text x="${X(v)}" y="${h - 6}" text-anchor="middle">${v.toFixed(1)}${o.unit || ""}</text>`; }
  s += `<line x1="${X(mean)}" x2="${X(mean)}" y1="${T0}" y2="${h - B0}" stroke="#eef1f5" stroke-dasharray="3 3"/><text x="${X(mean) + 4}" y="${T0 + 8}">${L("media", "mean")} ${mean.toFixed(2)}${o.unit || ""}</text>`;
  return s + "</svg>";
}
// timeline / Gantt: {d0, d1, rows:[{lab, a, b, c, p, k}], marks:[{d, lab, c}], today}
function svgGantt(o) {
  const w = o.w || 640, lw = 150, rh = 24, T0 = 22, rows = o.rows, h = T0 + Math.max(1, rows.length) * rh + 8, X = d => lw + (d - o.d0) / (o.d1 - o.d0) * (w - lw - 8);
  let s = `<svg class="ch gantt" viewBox="0 0 ${w} ${h}" role="img" aria-label="${o.aria || ""}">`;
  for (let d = Math.ceil(o.d0 / 7) * 7; d <= o.d1; d += 7) s += `<line x1="${X(d)}" x2="${X(d)}" y1="${T0 - 4}" y2="${h - 6}" stroke="${CH_GRID}"/>${(d / 7) % 2 ? "" : `<text x="${X(d) + 2}" y="12">${sDate(d)}</text>`}`;
  (o.marks || []).forEach(m => { s += `<line x1="${X(m.d)}" x2="${X(m.d)}" y1="${T0 - 6}" y2="${h - 6}" stroke="${m.c || "#e10600"}" stroke-width="1.5" opacity=".7"/><text x="${X(m.d)}" y="${h - 1}" text-anchor="middle" fill="${m.c || "#ff8a80"}" class="gm">${m.lab}</text>`; });
  rows.forEach((r, i) => { const y = T0 + i * rh, a = Math.max(o.d0, r.a), b = Math.max(a + .6, Math.min(o.d1, r.b));
    s += `<text x="0" y="${y + 15}" class="gl">${r.lab.length > 22 ? r.lab.slice(0, 21) + "…" : r.lab}</text><rect x="${X(a)}" y="${y + 5}" width="${X(b) - X(a)}" height="${rh - 10}" rx="4" fill="${r.c}" opacity=".28"/>
      <rect class="an-barx" x="${X(a)}" y="${y + 5}" width="${(X(b) - X(a)) * clampN(r.p ?? 0, 0, 1)}" height="${rh - 10}" rx="4" fill="${r.c}" style="--d:${i * .06}s;transform-origin:${X(a)}px 0"><title>${r.lab} · ${sDate(r.a)} → ${sDate(r.b)}</title></rect>`; });
  if (o.today != null) s += `<line x1="${X(o.today)}" x2="${X(o.today)}" y1="${T0 - 8}" y2="${h - 6}" stroke="#fff" stroke-width="2"/><text x="${X(o.today)}" y="${T0 - 10}" text-anchor="middle" class="gt">${L("HOY", "TODAY")}</text>`;
  return s + "</svg>";
}
// aerodynamic map: downforce over front / rear ride height (and the change against the previous spec)
function aeroMap(gain, prev, seed) {
  const nx = 12, ny = 8, r = rng(seed || 7), g = (gain.hs || 0) + (gain.ms || 0) + (gain.dirty || 0) * .6 + (gain.ls || 0) * .4, top = gain.top || 0;
  const base = (i, j, k) => { const fx = i / (nx - 1), ry = j / (ny - 1); return 2.4 + 2.2 * Math.exp(-((fx - .42 - k * .02) ** 2) / .09 - ((ry - .55) ** 2) / .16) + .6 * (1 - ry) - .3 * fx; };
  const cells = [], dl = []; let mn = 99, mx = -99, dmx = .01;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const b0 = base(i, j, 0), b1 = base(i, j, 1) * (1 + g * .012) - top * .004 + (r() - .5) * .05, d = b1 - b0; cells.push(b1); dl.push(d); mn = Math.min(mn, b1); mx = Math.max(mx, b1); dmx = Math.max(dmx, Math.abs(d)); }
  const seq = v => { const t = (v - mn) / (mx - mn || 1), st = [[13, 23, 38], [22, 74, 120], [40, 150, 170], [120, 200, 120], [242, 201, 76]], k = Math.min(3, Math.floor(t * 4)), f = t * 4 - k, A = st[k], B = st[k + 1]; return `rgb(${A.map((a, z) => Math.round(a + (B[z] - a) * f)).join(",")})`; };
  const dv = d => { const t = clampN(d / dmx, -1, 1); return t >= 0 ? `rgba(62,207,142,${.12 + t * .8})` : `rgba(239,107,91,${.12 - t * .8})`; };
  const grid = (vals, col, title) => `<div class="am"><span class="amt">${title}</span><div class="amg" style="--nx:${nx}">${vals.map((v, i) => `<i style="background:${col(v)};--i:${i}" title="${v.toFixed(2)}"></i>`).join("")}</div>
    <div class="amx"><span>${L("Altura delantera", "Front ride height")} →</span></div></div>`;
  return `<div class="amw">${grid(cells, seq, L("Mapa aerodinámico · carga (CL·A)", "Aero map · downforce (CL·A)"))}${grid(dl, dv, L("Cambio frente a la spec anterior", "Change against the previous spec"))}</div>`;
}
// the part in the wind tunnel: streamlines flowing around it
function flowViz(p, aero, sec) {
  const lines = Array.from({ length: 13 }, (_, k) => { const y0 = 18 + k * 13.5, amp = (k - 6) * (k < 6 ? -1 : 1) <= 0 ? 0 : 0, d = Math.abs(k - 6), push = (7 - d) * 3.2 * (k < 6 ? -1 : 1);
    let path = `M-10 ${y0}`; for (let x = 0; x <= 420; x += 20) { const bump = push * Math.exp(-((x - 210) ** 2) / 6000); path += ` L${x} ${(y0 + bump).toFixed(1)}`; }
    const hot = (7 - d) / 7, c = `hsl(${200 - hot * 170},85%,${55 + hot * 5}%)`; return `<path d="${path}" stroke="${c}" style="--d:${(k * .17) % 1.1}s;--s:${1.3 - hot * .5}s"/>`; }).join("");
  return `<div class="flow${aero ? "" : " rig"}"><svg class="flw" viewBox="0 0 420 200" preserveAspectRatio="none" aria-hidden="true">${aero ? lines : [[150, 1, "#c58cff"], [172, 1.7, "#5fb7ff"]].map(([y0, f, c]) => `<path class="osc" style="stroke:${c}" d="M0 ${y0} ${Array.from({ length: 106 }, (_, i) => `L${i * 4} ${(y0 - Math.sin(i * .18 * f) * 16 - Math.sin(i * .47 * f) * 5).toFixed(1)}`).join(" ")}"/>`).join("")}</svg>
    <img src="assets/parts/${p}.webp" alt="" draggable="false"><span class="ftag">${aero ? L("Túnel de viento · 60 % escala · 50 m/s", "Wind tunnel · 60% scale · 50 m/s") : L("Banco de pruebas · ciclo de carrera", "Test rig · race cycle")}</span>${sec ? `<span class="fsec">${sec}</span>` : ""}</div>`;
}
// counters: numbers that run up to their value
const CNT_F = { money: v => money(v), int: v => String(Math.round(v)), pct: v => Math.round(v) + " %", pos: v => v ? "P" + Math.round(v) : "—", s3: v => (v > 0 ? "+" : "") + v.toFixed(3) + " s", s1: v => v.toFixed(1) + " s" };
const cntTag = (v, f = "int", k = "", cls = "") => `<b data-cnt="${v ?? 0}" data-f="${f}"${k ? ` data-k="${k}"` : ""}${cls ? ` class="${cls}"` : ""}>${CNT_F[f](v ?? 0)}</b>`;
function sxCountAll(fromZero, root) {
  const els = [...(root || document).querySelectorAll("[data-cnt]")], still = matchMedia("(prefers-reduced-motion:reduce)").matches;
  els.forEach(el => {
    const to = +el.dataset.cnt, f = CNT_F[el.dataset.f] || CNT_F.int, k = el.dataset.k, from = fromZero ? (el.dataset.f === "pos" ? to : 0) : k && SX.kp[k] != null ? SX.kp[k] : to;
    if (k) SX.kp[k] = to;
    if (still || from === to || el.dataset.f === "pos") { el.textContent = f(to); if (k && !fromZero && from !== to) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); } return; }
    const t0 = performance.now(), dur = 900;
    const step = now => { const q = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - q, 3); el.textContent = f(from + (to - from) * e); if (q < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); if (k && !fromZero) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
  });
}

// =====================================================================================================
// ---------- SEASON MODE: the HQ itself. Each department is a place: its picture fills the screen, ----------
// ---------- the data floats over it (a panel on wide screens, a sheet you drag on phones) ----------
// =====================================================================================================
const SX = { sheet: "mid", fold: false, kp: {}, drag: null, vis: 0, max: 0, mid: 0, min: 64 };
const SX_NAV = [["home", "home", ["Panel", "Dashboard"]], ["cal", "cal", ["Calendario", "Calendar"]], ["stand", "stand", ["Clasificación", "Standings"]],
  ["board", "board", ["Junta", "Board"]], ["dev", "dev", ["Desarrollo", "Development"]], ["ops", "ops", ["Operaciones", "Operations"]],
  ["squad", "squad", ["Plantilla", "Squad"]], ["fin", "fin", ["Finanzas", "Finance"]], ["mkt", "mkt", ["Marketing", "Marketing"]],
  ["train", "train", ["Entreno", "Training"]], ["trophy", "trophy", ["Trofeos", "Trophies"]]];
const SX_GROUP = { rnd: "dev", prod: "dev", dsim: "dev", active: "squad", market: "squad", tdrv: "train", tsim: "train", pit: "train" };
const SX_SUBS = { dev: [["rnd", ["I+D+i", "R&D"]], ["prod", ["Producción", "Production"]], ["dsim", ["Túnel de viento", "Wind tunnel"]]], squad: [["active", ["Activos", "Assets"]], ["market", ["Fichajes", "Market"]]] };
const SX_FIRST = { dev: "rnd", squad: "active", tdrv: "train", tsim: "train", pit: "train" };
const sxSheet = () => matchMedia("(max-width:1000px)").matches;
function sxNavHtml() {
  return SX_NAV.map(([k, ic, lab]) => `<button class="sx-n" data-hqsec="${SX_FIRST[k] || k}" data-g="${k}"><span class="ic">${hqIc(ic)}</span><span class="lb">${L(...lab)}</span></button>`).join("");
}
function sxNavSync(sec) {
  const g = SX_GROUP[sec] || sec;
  document.querySelectorAll("#sxRail .sx-n").forEach(b => { if (b.dataset.g === g) { b.setAttribute("aria-current", "page"); if (sxSheet()) b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); } else b.removeAttribute("aria-current"); });
}
function sxTabs(sec) {
  const el = $("sxTabs"); if (!el) return; const g = SX_GROUP[sec] || sec, subs = SX_SUBS[g];
  el.innerHTML = subs ? subs.map(([k, lab]) => `<button data-hqsec="${k}" aria-pressed="${k === sec}">${L(...lab)}</button>`).join("") : "";
}
function sxCaption(sec) {
  const el = $("sxCap"); if (!el) return; const t = S.team, [city, cc, fac] = HQ_INFO[t] || ["", "GB", ""];
  const sl = sec === "home" ? null : (hqSecSlides(sec, t)[0] || null);
  const kick = sec === "home" ? `${flagSvg(cc)}${fac ? fac + " · " : ""}${(COUNTRY[cc] || ["", ""])[OPT.lang === "en" ? 1 : 0]}` : `${hqIc(HQ_SEC[SX_GROUP[sec] || sec]?.ic || "home")}${L(...(HQ_SEC[SX_GROUP[sec] || sec] || HQ_SEC[sec]).t)}`;
  const title = sec === "home" ? city : sl ? sl.lab : "", longest = Math.max(4, ...title.split(/\s+/).map(w => w.length));
  el.innerHTML = `<span class="ck">${kick}</span><b>${title}</b>`;
  const mw = parseFloat(getComputedStyle(el).maxWidth) || innerWidth * .4; el.style.setProperty("--cfs", Math.round(clampN(mw / (longest * .66), 22, 64)) + "px");
  el.classList.remove("in"); void el.offsetWidth; el.classList.add("in");
}
function sxDate() { return `${sDate(S.day, true)} · ${L("semana", "week")} ${sWeekN(S.day)}`; }
function sxKpis() {
  const t = S.team, T = TEAMS[t], rounds = S.stand.rounds.length, pos = rounds ? sConsPos(t) : 0, D = sDrvOrder();
  const dp = sMyDrv().map(p => p ? D.indexOf(p.id) + 1 : 0), cap = S.cap / S_CAP * 100, conf = S.board.conf, m = mediaOf(t);
  const ch = (k, lab, val, extra = "", cls = "") => `<div class="kp ${cls}"><span>${lab}</span><div class="kv">${val}${extra}</div></div>`;
  const posHist = sPosHist(t);
  return ch("cash", L("Caja", "Cash"), cntTag(S.cash, "money", "cash", S.cash < 0 ? "neg" : ""), spark(S.cashH.map(h => h[1]), S.cash < 0 ? "#ef6b5b" : "#3ecf8e"))
    + ch("cons", L("Constructores", "Constructors"), `<b class="pz">${pos ? "P" + pos : "—"}</b><em>${S.stand.t[t] || 0} pts</em>`, posHist.length > 1 ? spark(posHist.map(p => -p), T.col) : "")
    + ch("drv", L("Pilotos", "Drivers"), `<b class="pz">${dp.map(p => p ? "P" + p : "—").join(" · ")}</b>`, `<em>${sMyDrv().map(p => p ? p.last.slice(0, 3).toUpperCase() : "").join(" · ")}</em>`)
    + ch("media", L("Valor mediático", "Media value"), cntTag(m, "int", "media"), spark(S.mediaH.map(h => h[1]), T.col))
    + ch("conf", L("Junta", "Board"), cntTag(conf, "int", "conf"), `<i class="dot" style="background:${conf >= 55 ? "#3ecf8e" : conf > 35 ? "#f2c94c" : "#ef6b5b"}"></i>`)
    + ch("cap", L("Límite de gasto", "Cost cap"), cntTag(cap, "pct", "cap"), `<span class="kbar"><i style="width:${Math.min(100, cap)}%;background:${cap > 90 ? "#ef6b5b" : T.col}"></i></span>`);
}
function sPosHist(t) {                                          // constructors' position after every round
  let tot = {}; return S.stand.rounds.map(r => { r.res.forEach(x => { tot[x[1]] = (tot[x[1]] || 0) + x[3]; }); const o = [...TEAM_ORDER].sort((a, b) => (tot[b] || 0) - (tot[a] || 0) || S_LV[b] - S_LV[a]); return o.indexOf(t) + 1; });
}
function renderSeasonHQ() {
  const t = S.team, T = TEAMS[t];
  if (HQS.t !== t) HQS.pref = 0; HQS.t = t; if (SX_FIRST[HQS.sec]) HQS.sec = SX_FIRST[HQS.sec]; if (!(HQS.sec === "home" || HQ_SEC[HQS.sec])) HQS.sec = "home"; HQS.stage = null; HQS.i = -1;
  SP.last = null;
  $("fxHq").innerHTML = `<div class="sx" id="sx" style="--tc:${T.col}">
    <div class="sx-bg hq-show" id="hqShow"><div class="hq-stripe"></div></div><div class="sx-vig" aria-hidden="true"></div>
    <header class="sx-top">
      <button class="sx-back" data-to="main" aria-label="${L("Menú principal", "Main menu")}">◀</button>
      <div class="sx-id">${teamLogo(t, "sx-lg")}<div><b>${T.full}</b><span id="sxDate">${sxDate()}</span></div></div>
      <div class="sx-kpis" id="sxKpis">${sxKpis()}</div>
      <button class="sx-tp" data-tpedit="1" title="${L("Editar Team Principal", "Edit Team Principal")}"><canvas id="hqTpCv" width="120" height="132" aria-hidden="true"></canvas><span><em>Team Principal</em><b>${esc(tpName() || "—")}</b></span></button>
    </header>
    <nav class="sx-rail" id="sxRail" aria-label="${L("Departamentos", "Departments")}">${sxNavHtml()}</nav>
    <div class="sx-loc">${sSideCard()}</div>
    <div class="sx-cap" id="sxCap"></div>
    <section class="sx-panel" id="sxPanel">
      <div class="sx-ph" id="sxPh"><span class="sx-grab" aria-hidden="true"></span>
        <div class="sx-tt"><span id="sxK"></span><b id="sxT"></b></div>
        <div class="sx-tabs" id="sxTabs"></div>
        <button class="sx-fold" data-sx="fold" aria-label="${L("Ver la sala", "View the room")}" title="${L("Ver la sala", "View the room")}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div>
      <div class="sx-body hq-page" id="hqPage"></div>
    </section>
    <button class="sx-open" data-sx="open" aria-label="${L("Abrir el panel", "Open the panel")}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg><span>${L("Panel", "Panel")}</span></button>
  </div>`;
  tpPortrait($("hqTpCv"), TP, t);
  requestAnimationFrame(() => hqStage(HQS.sec));
  sPageShow(HQS.sec); sxCountAll(true, $("sxKpis"));
  if (S.pop) setTimeout(() => { if (FRONT.v === "hq") sPopShow(); }, 1300);
  requestAnimationFrame(sxSheetInit);
}
// ---- the panel: folded away on wide screens, a sheet with three heights on phones
function sxAct(a) {
  const sx = $("sx"); if (!sx) return;
  if (a === "fold") { if (sxSheet()) sxSnap(SX.sheet === "min" ? "mid" : "min"); else { SX.fold = !SX.fold; sx.dataset.fold = SX.fold ? 1 : 0; } }
  if (a === "open") { SX.fold = false; sx.dataset.fold = 0; if (sxSheet()) sxSnap("mid"); }
}
function sxSheetInit() {
  const P = $("sxPanel"), ph = $("sxPh"); if (!P || !ph) return;
  sxLayout();
  ph.addEventListener("pointerdown", e => { if (!sxSheet() || e.target.closest("button")) return; SX.drag = { y0: e.clientY, v0: SX.vis, t0: performance.now(), moved: false }; try { ph.setPointerCapture(e.pointerId); } catch (x) { } P.classList.add("drag"); });
  ph.addEventListener("pointermove", e => { const d = SX.drag; if (!d) return; const dy = e.clientY - d.y0; if (Math.abs(dy) > 4) d.moved = true; sxSetVis(clampN(d.v0 - dy, SX.min, SX.max), false); });
  const end = e => { const d = SX.drag; if (!d) return; SX.drag = null; P.classList.remove("drag");
    if (!d.moved) { sxSnap(SX.sheet === "max" ? "mid" : SX.sheet === "mid" ? "max" : "mid"); return; }
    const vel = (e.clientY - d.y0) / Math.max(1, performance.now() - d.t0), aim = SX.vis - vel * 160;
    const best = ["min", "mid", "max"].map(k => [k, Math.abs(SX[k] - aim)]).sort((a, b) => a[1] - b[1])[0][0]; sxSnap(best); };
  ph.addEventListener("pointerup", end); ph.addEventListener("pointercancel", end);
}
function sxLayout() {
  const sx = $("sx"), P = $("sxPanel"); if (!sx || !P) return;
  if (!sxSheet()) { P.style.height = ""; P.classList.remove("anim"); sx.style.removeProperty("--sv"); return; }
  const top = sx.querySelector(".sx-top").offsetHeight, loc = sx.querySelector(".sx-loc").offsetHeight, dock = $("sxRail").offsetHeight, H = sx.clientHeight;
  sx.style.setProperty("--toph", top + "px");
  SX.max = Math.max(260, H - top - dock - 6); SX.mid = Math.round(Math.min(SX.max, Math.max(240, H - top - dock - loc - 150))); SX.min = 62;
  sxSnap(SX.sheet || "mid", true);
}
function sxSnap(name, instant) { SX.sheet = name; sxSetVis(SX[name], !instant); }
function sxSetVis(v, anim) {
  SX.vis = v; const P = $("sxPanel"), sx = $("sx"); if (!P) return;
  P.classList.toggle("anim", !!anim); P.style.height = v + "px"; sx.style.setProperty("--sv", v + "px"); sx.dataset.sheet = SX.sheet;
}
addEventListener("resize", () => { if (FRONT.v === "hq" && $("sx")) sxLayout(); });

// =====================================================================================================
// ---------- SEASON MODE: the screens of every department ----------
// =====================================================================================================
const tile = (lab, val, sub = "", chart = "", cls = "") => `<div class="tl ${cls}"><span>${lab}</span>${val}${sub ? `<em>${sub}</em>` : ""}${chart ? `<div class="tc">${chart}</div>` : ""}</div>`;
const mini = (id, size = 28) => ppImg(id, size, "mini");
const ROLE_AX = { driver: S_ATTR.driver.map(a => a[0]), td: S_ATTR.td.map(a => a[0]), aero: S_ATTR.aero.map(a => a[0]), eng: S_ATTR.eng.map(a => a[0]), sd: S_ATTR.sd.map(a => a[0]) };
const roleLabels = kind => Object.fromEntries(S_ATTR[kind].map(([k, es, en]) => [k, [es.split(" ")[0], en.split(" ")[0]]]));
function personRadar(p, other, size = 240) {
  const ax = ROLE_AX[p.kind], sets = [{ n: sName(p), c: p.team ? TEAMS[p.team].col : "#c9ccd4", v: p.a, fill: 1 }];
  if (other) sets.unshift({ n: sName(other), c: "#7d8792", v: other.a, dash: "4 3" });
  const all = sets.flatMap(s => ax.map(k => s.v[k])), mn = Math.max(30, Math.floor((Math.min(...all) - 8) / 5) * 5);
  if (ax.length < 4) return hbars(ax.map(k => ({ lab: L(...roleLabels(p.kind)[k]), v: p.a[k], c: statCol(p.a[k]) })), { min: 40, max: 100 });
  return svgRadar({ axes: ax, labels: roleLabels(p.kind), sets, size, min: mn, max: 100, pad: 40, aria: sName(p) });
}
// ---- the next event, with how many days are left
function sSideCard() {
  const ev = sPending(), [nm, bt] = sMainLabel(), dd = ev ? Math.max(0, ev.day - S.day) : 0, prev = [...S.cal].reverse().find(e => e.done), span = ev ? Math.max(7, ev.day - (prev ? prev.day : 0)) : 1;
  const icon = !ev ? "trophy" : ev.type === "gp" ? "home" : ev.type === "test" ? "sim" : "board";
  return `<div class="hq-season" id="hqSeason">
    <div class="nx">${ev && S.steps.design ? ring(span - dd, span, dd === 0 ? "#e10600" : "var(--tc)", 58, dd === 0 ? "✓" : dd, dd === 0 ? L("hoy", "today") : L("días", "days")) : `<span class="nxi">${hqIc(icon)}</span>`}
      <div class="nt"><span>${sDate(S.day, true)}</span><b>${nm}</b>${ev ? `<em>${sDate(ev.type === "gp" ? ev.day + 2 : ev.day, true)}</em>` : ""}</div></div>
    <div class="bt"><button class="sp-btn" data-sa="main">${bt} ▶</button>${S.steps.design && ev && S.day < ev.day && !S.over ? `<button class="sp-btn gh" data-sa="week" title="${L("Avanzar una semana", "Advance one week")}">+7 ${L("días", "days")}</button>` : ""}</div>
    ${sCanAdvance() && S.steps.board ? `<p class="note">${sCanAdvance()}</p>` : ""}</div>`;
}
// ---- dashboard
SPAGE.home = () => {
  const t = S.team, T = TEAMS[t], B = S.board, rounds = S.stand.rounds, pos = rounds.length ? sConsPos(t) : 0, D = sDrvOrder(), me = sMyDrv(), ph = sPosHist(t);
  const st = S.car.act ? sCarStats(0, true) : null, cap = S.cap / S_CAP * 100, conf = B.conf;
  const est = TEAM_ORDER.map(x => ({ t: x, v: x === t ? (st ? carSkill(st) : carSkill(S.teams[x].st)) : carSkill(S.teams[x].st) })), best = Math.max(...est.map(e => e.v));
  const tiles = `<div class="tls">
    ${tile(L("Constructores", "Constructors'"), `<b class="pz">${pos ? "P" + pos : "—"}</b>`, `${S.stand.t[t] || 0} pts · ${L("objetivo", "target")} P${B.target}`, ph.length > 1 ? svgLine({ w: 220, h: 64, l: 4, r: 4, x: ph.map((_, i) => ""), series: [{ n: T.name, c: T.col, v: ph, area: 0 }], inv: 1, min: 1, max: 11, ticks: [], dots: "last" }) : "", "big")}
    ${tile(L("Pilotos", "Drivers"), `<div class="dps">${me.map(p => p ? `<div>${mini(p.id, 26)}<b>${D.indexOf(p.id) >= 0 ? "P" + (D.indexOf(p.id) + 1) : "—"}</b><em>${S.stand.d[p.id] || 0} pts</em></div>` : "").join("")}</div>`)}
    ${tile(L("Caja", "Cash"), cntTag(S.cash, "money", "", S.cash < 0 ? "neg" : ""), L("presupuesto", "budget") + " " + money(B.B), spark(S.cashH.map(h => h[1]), S.cash < 0 ? "#ef6b5b" : "#3ecf8e", 220, 40))}
    ${tile(L("Límite de gasto", "Cost cap"), `<div class="rw">${ring(cap, 100, cap > 90 ? "#ef6b5b" : T.col, 64, Math.round(cap) + "%")}<em>${money(S.cap)}<br>${L("de", "of")} ${S_CAP} M$</em></div>`)}
    ${tile(L("Valor mediático", "Media value"), cntTag(mediaOf(t), "int"), mediaTier(mediaOf(t)), spark(S.mediaH.map(h => h[1]), T.col, 220, 40))}
    ${tile(L("Confianza de la junta", "Board confidence"), svgGauge(conf, 100, conf >= 55 ? "#3ecf8e" : conf > 35 ? "#f2c94c" : "#ef6b5b", ""), conf >= 55 ? L("Confía en ti", "Trusts you") : conf > 35 ? L("Empieza a dudar", "Starting to doubt") : L("Tu puesto peligra", "Your job is at risk"), "", "gz")}
  </div>`;
  const steps = [[S.steps.board, L("Reunión con la junta: presupuesto y objetivos", "Board meeting: budget and targets"), "board"], [S.steps.squad, L("Revisa tus activos: pilotos, ingenieros y director técnico", "Review your assets: drivers, engineers and technical director"), "active"],
    [S.steps.design, L("Diseña el coche 2026 (4 semanas hasta el test)", "Design the 2026 car (4 weeks to the test)"), "rnd"], [S.cal[0].done, L("Test de pretemporada en Barcelona", "Pre-season test in Barcelona"), null]];
  const pre = !S.cal[0].done ? card(L("Pretemporada", "Pre-season"), `<ol class="chk">${steps.map(([ok, tx, go]) => `<li class="${ok ? "ok" : ""}">${go && !ok ? `<button data-go2="${go}">${tx} ▶</button>` : `<span>${tx}</span>`}</li>`).join("")}</ol>`) : "";
  const last = rounds.length ? rounds[rounds.length - 1] : null;
  const lastCard = last ? card(L(`Última carrera · ronda ${last.r}`, `Last race · round ${last.r}`), `<div class="lr">${last.res.slice(0, 3).map((x, i) => `<div class="pd p${i + 1}">${mini(x[0], 34)}<b>${i + 1}</b><span>${S.people[x[0]] ? S.people[x[0]].last : x[0]}</span><i style="background:${TEAMS[x[1]].col}"></i></div>`).join("")}</div>
      <div class="lrm">${last.res.filter(x => x[1] === t).map(x => `<span>${mini(x[0], 22)}${S.people[x[0]].last} <b>${x[2] ? "P" + x[2] : "DNF"}</b> ${x[3] ? `+${x[3]} pts` : ""}</span>`).join("")}</div>`) : "";
  const pace = card(L("Ritmo estimado de los coches", "Estimated car pace"), lolli(est.sort((a, b) => b.v - a.v).map(e => ({ lab: TEAMS[e.t].name, v: r2((best - e.v) * LAP_REF), c: e.t === t ? T.col : "#5b6572", me: e.t === t })), { fmt: v => v ? "+" + v.toFixed(2) + " s" : L("ref.", "ref.") })
    + `<p class="sp-s">${S.car.revealed ? L("Diferencia por vuelta con el más rápido: tu coche con datos de pista.", "Gap per lap to the fastest: your car from track data.") : L("Antes del test: tu coche según la predicción del túnel.", "Before the test: your car from the tunnel prediction.")}</p>`);
  const carR = st ? card(L("El coche", "The car"), svgRadar({ axes: ST, size: 250, min: 50, max: 100, sets: [{ n: T.name, c: T.col, v: st, fill: 1 }] }) + `<div class="sum"><span>${L("Valoración", "Rating")} <b>${carRating(st)}</b></span><span>${L("Fiabilidad", "Reliability")} <b>${Math.round(st.rel)}</b></span></div>`) : "";
  const gantt = S.proj.length ? card(L("Proyectos en marcha", "Projects under way"), sGanttCard()) : "";
  return sKick(L("Panel de temporada", "Season dashboard"), T.full) + tiles
    + `<div class="sp-g c2">${pre || lastCard || ""}${pace}</div>`
    + `<div class="sp-g c2">${carR}${gantt || card(L("Proyectos", "Projects"), `<p class="sp-s">${L("Ningún proyecto en marcha. Empieza uno en Desarrollo › I+D+i.", "No projects under way. Start one in Development › R&D.")}</p><button class="sp-btn gh" data-go2="rnd">${L("Ir a I+D+i", "Go to R&D")} ▶</button>`)}</div>`
    + card(L("Bandeja de entrada", "Inbox"), `<ul class="news">${S.news.slice(0, 10).map((n, i) => `<li class="n-${n.k}" style="--i:${i}"><span>${sDate(n.d)}</span>${n.txt}</li>`).join("")}</ul>`);
};
// =====================================================================================================
// ---------- SEASON MODE: the season plan. One timeline for the whole year: the 8 rounds and what each circuit asks,
// ---------- and over it every part being designed, tested, built and raced (real bars, and dashed ones for what is still to come)
// =====================================================================================================
const SPL_D0 = 0, SPL_D1 = 200;
const splX = d => ((clampN(d, SPL_D0, SPL_D1) - SPL_D0) / (SPL_D1 - SPL_D0) * 100).toFixed(3);
const PART_AB = { fw: ["AD", "FW"], rw: ["AT", "RW"], fl: ["FP", "FL"], sp: ["PO", "SP"], ch: ["CH", "CH"], su: ["SU", "SU"], br: ["FR", "BR"], gb: ["CC", "GB"] };
const partAb = p => L(...PART_AB[p]);
const reqCol = v => ["rgba(255,255,255,.04)", "#1f3a4f", "#22607a", "#2f8f8a", "#d49a2a", "#e0503f"][v] || "rgba(255,255,255,.04)";
function partRel(p, c) { const w = CPARTS[p].st, R = CIRCUITS[c].req; let a = 0, t = 0; Object.keys(w).forEach(s => { if (R[s] != null) { a += w[s] * R[s]; t += w[s]; } }); return t ? a / t : 0; }
function sGpFor(day) { return S.cal.find(e => e.type === "gp" && !e.done && e.day >= day) || null; }
// what is still coming for each part: the newest spec not yet on the cars, its stages and the first race it can make
function sPipes() {
  const out = [];
  PART_K.forEach(p => {
    const onCar = Math.max(...[0, 1].map(k => { const u = S.units.find(x => x.id === S.fit[k][p]); return u ? u.n : 1; })), P = CPARTS[p], mfgD = P.mfg * 2;
    const dev = S.proj.filter(x => x.kind === "dev" && x.p === p).sort((a, b) => b.n - a.n)[0];
    const specs = (S.specs[p] || []).filter(s => s && s.n > onCar && s.st !== "design");
    const g = [];                                                // the stages still to come (dashed)
    let n = 0, eta = null;
    if (dev) {
      n = dev.n; const t = AMB[dev.amb || 0].t;
      g.push({ k: "tun", a: dev.end, b: dev.end + t }); g.push({ k: "mfg", a: dev.end + t, b: dev.end + t + mfgD }); eta = dev.end + t + mfgD;
    } else if (specs.length) {
      const sp = specs.sort((a, b) => b.n - a.n)[0]; n = sp.n;
      const tp = S.proj.find(x => x.kind === "test" && x.p === p && x.n === sp.n), mp = S.proj.filter(x => x.kind === "mfg" && x.p === p && x.n === sp.n);
      const units = S.units.filter(u => u.p === p && u.n === sp.n).length;
      if (tp) { g.push({ k: "mfg", a: tp.end, b: tp.end + mfgD }); eta = tp.end + mfgD; }
      else if (mp.length) { const left = Math.max(...mp.map(m => (m.qty - m.done) * m.per - (m.prog || 0))); eta = units ? S.day : S.day + Math.max(0, left); }
      else if (units) eta = S.day;
      else { let d = S.day; if (!sp.tested) { const t = AMB[sp.amb || 0].t; g.push({ k: "tun", a: d, b: d + t }); d += t; } g.push({ k: "mfg", a: d, b: d + mfgD }); eta = d + mfgD; }
    }
    if (n) out.push({ p, n, g, eta, gp: eta != null ? sGpFor(eta) : null, est: (S.specs[p] && S.specs[p][n - 1]) || (dev ? { est: dev.est } : null) });
  });
  return out;
}
// lay bars on as few rows as possible
function splPack(items) {                                        // the label runs past a short bar, so it counts as part of it
  const ends = []; items.sort((a, b) => a.a - b.a).forEach(it => { let r = ends.findIndex(e => e < it.a - .5); if (r < 0) { r = ends.length; ends.push(0); } ends[r] = Math.max(it.a + 2, it.b, it.a + String(it.lab).length * 1.5 + (it.arr ? 9 : 0)); it.r = r; }); return Math.max(1, ends.length); }
const PNM = (p, n) => `${L(...CPARTS[p].n)} S${n}`;
function splBars(items, cls) {
  const n = splPack(items);
  return { n, html: items.map(it => `<span class="spl-b ${cls} ${it.cls || ""}" style="--a:${splX(it.a)};--b:${splX(Math.max(it.b, it.a + 1))};--r:${it.r}" title="${it.t || it.lab} · ${sDate(Math.max(0, Math.round(it.a)))} → ${sDate(Math.max(0, Math.round(it.b)))}">${it.p != null ? `<i style="width:${(clampN(it.p, 0, 1) * 100).toFixed(1)}%"></i>` : ""}<em>${it.lab}</em>${it.arr ? `<u>→ ${it.arr}</u>` : ""}</span>`).join("") };
}
function seasonPlan(o = {}) {
  const want = new Set(o.lanes || ["gp", "req", "board", "rnd", "tun", "mfg", "ops", "cash"]), gps = S.cal.filter(e => e.type === "gp"), nx = sPending(), H = S.hist || [], pipes = sPipes();
  const st0 = S.car.pred ? sCarStats(0, true) : S.car.design ? S.car.design.tg : null;
  const row = (lab, body, n = 1, cls = "", sub = "") => `<div class="spl-r ${cls}" style="--n:${n}"><span class="spl-l">${lab}${sub ? `<em>${sub}</em>` : ""}</span><div class="spl-t">${body}</div></div>`;
  const grp = (t, c) => `<div class="spl-g" style="--gc:${c}"><span>${t}</span></div>`;
  let h = "";
  // months and weeks across the top
  let top = ""; for (let m = 0; m < 8; m++) { const d = Math.round((Date.UTC(2026, m, 1) - S_DAY0) / 864e5); if (d >= SPL_D0 && d <= SPL_D1) top += `<span class="spl-mo" style="--x:${splX(d)}">${MON[m][OPT.lang === "en" ? 1 : 0]}</span>`; }
  for (let d = 0; d <= SPL_D1; d += 7) top += `<i class="spl-wk" style="--x:${splX(d)}"></i>`;
  h += row("", top, 1, "spl-hd");
  // the rounds
  if (want.has("gp")) {
    const test = S.cal.find(e => e.type === "test");
    const chips = gps.map(e => { const C = circOf(e), k = circKey(e), mine = e.res && e.res.mine ? e.res.mine.map(m => m[1] ? "P" + m[1] : "R").join("·") : "";
      return `<button class="spl-gp${e.done ? " fin" : ""}${e === nx ? " nx" : ""}" style="--x:${splX(e.day + 1)}" data-sa="circ" data-v="${k}" title="${L(...C.gp)} · ${sDate(e.day + 2)}">${flagSvg(C.cc)}<b>${C.code}</b><em>${sDate(e.day + 2)}</em>${mine ? `<u>${mine}</u>` : `<s>R${e.round}</s>`}</button>`; }).join("")
      + (test ? `<span class="spl-gp tst${test.done ? " fin" : ""}" style="--x:${splX(test.day)}" title="${L("Test de pretemporada", "Pre-season test")} · ${S_HOST}">${flagSvg("ES")}<b>ESP</b><em>${sDate(test.day)}</em><s>TEST</s></span>` : "");
    h += row(L("Grandes Premios", "Grands Prix"), chips, 1, "spl-gpr");
  }
  // what each circuit asks
  if (want.has("req")) {
    h += grp(L("Requisitos del circuito", "Circuit requirements"), "#d49a2a");
    REQ_K.forEach(s => { h += row(L(...REQ_N[s]), gps.map(e => { const C = circOf(e), v = C.req[s]; return `<span class="spl-c" data-sa="circ" data-v="${circKey(e)}" style="--x:${splX(e.day + 1)}" title="${L(...C.gp)} · ${L(...REQ_N[s])}: ${v}/5"><i style="opacity:${(.1 + (v - 1) / 4 * .9).toFixed(2)}"></i></span>`; }).join(""), 1, "spl-rq"); });
    if (st0) { const fit = gps.map(e => circFit(st0, circKey(e))), lo = Math.min(...fit), hi = Math.max(...fit);
      h += row(L("Encaje del coche", "Car fit"), gps.map((e, i) => { const q = hi - lo < .01 ? .5 : (fit[i] - lo) / (hi - lo); return `<span class="spl-c fit${q >= .999 ? " hi" : q <= .001 ? " lo" : ""}" data-sa="circ" data-v="${circKey(e)}" style="--x:${splX(e.day + 1)}" title="${L("Encaje", "Fit")} ${fit[i].toFixed(1)}">${fit[i].toFixed(0)}</span>`; }).join(""), 1, "spl-rq fit"); }
  }
  // the board and the market
  if (want.has("board")) {
    h += grp(L("Junta", "Board"), "#f2c94c");
    const win = S_WINDOWS.map(([a, b]) => `<span class="spl-b k-mkt" style="--a:${splX(a)};--b:${splX(b)};--r:1"><em>${L("Mercado de fichajes", "Transfer window")}</em></span>`).join("");
    const bm = S.cal.filter(e => e.type === "board").map(e => `<span class="spl-dm${e.done ? " fin" : ""}" style="--x:${splX(e.day)}" title="${sEvName(e)} · ${sDate(e.day)}"><i></i><em>J${e.q}</em></span>`).join("");
    h += row(L("Accionistas", "Shareholders"), win + bm, 2, "", L("y mercado", "and market"));
  }
  // development: design office, tunnel and rig, factory
  if (want.has("rnd") || want.has("tun") || want.has("mfg")) h += grp(L("Desarrollo", "Development"), "#5fb7ff");
  if (want.has("rnd")) {
    const it = H.filter(x => x.k === "dev" || x.k === "design").map(x => ({ a: x.a, b: x.b, lab: x.k === "design" ? L("Diseño 2026", "2026 design") : PNM(x.p, x.n), cls: "done" }))
      .concat(S.proj.filter(x => x.kind === "dev" || x.kind === "design").map(x => ({ a: x.start, b: x.end, p: clampN((S.day - x.start) / Math.max(1, x.end - x.start), 0, 1), lab: x.kind === "design" ? L("Diseño 2026", "2026 design") : PNM(x.p, x.n) })));
    const B = splBars(it, "k-rnd"); h += row("I+D+i", B.html, B.n, "", L("diseño", "design"));
  }
  if (want.has("tun")) {
    const it = H.filter(x => x.k === "test").map(x => ({ a: x.a, b: x.b, lab: PNM(x.p, x.n), cls: "done" }))
      .concat(S.proj.filter(x => x.kind === "test").map(x => ({ a: x.start, b: x.end, p: clampN((S.day - x.start) / Math.max(1, x.end - x.start), 0, 1), lab: PNM(x.p, x.n) })))
      .concat(pipes.flatMap(q => q.g.filter(g => g.k === "tun").map(g => ({ a: g.a, b: g.b, lab: PNM(q.p, q.n), cls: "gh", t: L("Previsto", "Planned") + " · " + PNM(q.p, q.n) }))));
    const B = splBars(it, "k-tun"); h += row(L("Túnel / banco", "Tunnel / rig"), B.html, B.n, "", L("ensayos", "tests"));
  }
  if (want.has("mfg")) {
    const lines = S.proj.filter(x => x.kind === "mfg");
    const it = H.filter(x => x.k === "mfg").map(x => ({ a: x.a, b: x.b, lab: `${PNM(x.p, x.n)} ×${x.qty}`, cls: "done" }))
      .concat(lines.map((x, i) => { const left = (x.qty - x.done) * x.per - (x.prog || 0); return { a: i < 2 ? (x.go ?? x.start ?? S.day) : S.day, b: S.day + Math.max(1, left), p: (x.done + (x.prog || 0) / x.per) / x.qty, lab: `${PNM(x.p, x.n)} ×${x.qty}`, cls: i < 2 ? "" : "q" }; }))
      .concat(pipes.flatMap(q => q.g.filter(g => g.k === "mfg").map(g => ({ a: g.a, b: g.b, lab: PNM(q.p, q.n), cls: "gh", arr: q.gp ? circOf(q.gp).code : L("fuera", "late"), t: L("Previsto", "Planned") + " · " + PNM(q.p, q.n) }))));
    const B = splBars(it, "k-mfg"); h += row(L("Producción", "Production"), B.html, B.n, "", L("fábrica", "factory"));
  }
  // operations: what each car runs at every round (done: what it raced; next ones: fitted now, plus what arrives in time)
  if (want.has("ops")) {
    h += grp(L("Operaciones", "Operations"), "#9bd35a");
    [0, 1].forEach(k => {
      const cur = Object.fromEntries(PART_K.map(p => { const u = S.units.find(x => x.id === S.fit[k][p]); return [p, u ? u.n : 1]; }));
      const cells = gps.map(e => {
        const r = S.stand.rounds.find(x => x.r === e.round); let fit = r && r.fit ? r.fit[k] : null, fut = false;
        if (!fit) { if (!S.car.pred) return ""; fit = { ...cur }; pipes.forEach(q => { if (q.eta != null && q.eta <= e.day && q.n > (fit[q.p] || 1)) { fit[q.p] = q.n; fit["_" + q.p] = 1; } }); fut = true; }
        const up = PART_K.filter(p => (fit[p] || 1) > 1);
        return `<span class="spl-o${e.done ? " fin" : ""}${fut && e !== nx ? " fut" : ""}${up.length ? "" : " one"}" style="--x:${splX(e.day + 1)}" title="#${DRIVERS[k].num} · ${L(...circOf(e).gp)}${up.length ? " · " + up.map(p => PNM(p, fit[p])).join(", ") : " · Spec 1"}">${up.length ? up.slice(0, up.length > 6 ? 5 : 6).map(p => `<i class="${fit["_" + p] ? "new" : ""}">${partAb(p)}${fit[p]}</i>`).join("") + (up.length > 6 ? `<i>+${up.length - 5}</i>` : "") : `<i class="s1">S1</i>`}</span>`;
      }).join("");
      h += row(`#${DRIVERS[k].num} ${DRIVERS[k].name.split(" ").pop()}`, cells, 1, "spl-op", L("piezas por GP", "parts per GP"));
    });
  }
  // the money that goes out every week
  if (want.has("cash")) {
    h += grp(L("Economía", "Economy"), "#ef6b5b");
    const wk = {}; (S.ledger || []).forEach(l => { if (l.a > 0) { const w = Math.floor(l.d / 7); (wk[w] = wk[w] || { dev: 0, mfg: 0, oth: 0 }); const c = l.cat === "dev" || l.cat === "des" || l.cat === "tun" ? "dev" : l.cat === "mfg" ? "mfg" : "oth"; wk[w][c] += l.a; } });
    const mx = Math.max(1, ...Object.values(wk).map(v => v.dev + v.mfg + v.oth));
    const bars = Object.entries(wk).map(([w, v]) => { const t = v.dev + v.mfg + v.oth; return `<span class="spl-k" style="--x:${splX(+w * 7 + 3.5)};--h:${(t / mx * 100).toFixed(1)}" title="${L("Semana", "Week")} ${+w + 1} · ${money(t)}"><i style="flex-grow:${v.oth.toFixed(2)}" class="o"></i><i style="flex-grow:${v.mfg.toFixed(2)}" class="m"></i><i style="flex-grow:${v.dev.toFixed(2)}" class="d"></i></span>`; }).join("");
    h += row(L("Gasto semanal", "Weekly spend"), bars, 1, "spl-cash", money(mx) + " máx.");
  }
  const cols = gps.map(e => `<i class="spl-col${e.done ? " fin" : ""}${e === nx ? " nx" : ""}" style="--x:${splX(e.day + 1)}"></i>`).join("");
  const now = `<i class="spl-now" style="--x:${splX(S.day)}"><b>${L("HOY", "TODAY")}</b></i>`;
  const lgd = `<div class="lgd spl-lg"><i class="k-rnd"></i>${L("Diseño", "Design")}<i class="k-tun"></i>${L("Túnel / banco", "Tunnel / rig")}<i class="k-mfg"></i>${L("Fábrica", "Factory")}<i class="gh"></i>${L("Previsto (→ GP al que llega)", "Planned (→ GP it reaches)")}<i class="q"></i>${L("En cola", "Queued")}<i class="done"></i>${L("Terminado", "Done")}<span class="rq">${[1, 3, 5].map(v => `<u style="opacity:${(.1 + (v - 1) / 4 * .9).toFixed(2)}"></u>`).join("")}</span>${L("Requisito: poco → mucho", "Requirement: low → high")}</div>`;
  return `<div class="splan${o.compact ? " cmp" : ""}"><div class="spl-sc"><div class="spl-in">${cols}${h}${now}</div></div>${o.legend === false ? "" : lgd}</div>`;
}
// ---- a circuit, opened from the plan: what it asks, how the car fits, which parts matter and whether they arrive in time
function sCircModal(k) {
  const C = CIRCUITS[k], ev = S.cal.find(e => e.type === "gp" && circKey(e) === k), T = TEAMS[S.team], st0 = S.car.pred ? sCarStats(0, true) : S.car.design ? S.car.design.tg : null;
  const dem = {}; REQ_K.forEach(s => dem[s] = 50 + C.req[s] * 9);
  const pipes = sPipes(), parts = PART_K.map(p => ({ p, v: partRel(p, k) })).sort((a, b) => b.v - a.v).slice(0, 4);
  const prow = ({ p, v }) => { const q = pipes.find(x => x.p === p), u = S.units.find(x => x.id === S.fit[0][p]), on = u ? u.n : 1;
    const ok = q && q.eta != null && ev && q.eta <= ev.day, late = q && ev && (q.eta == null || q.eta > ev.day);
    return `<div class="cpr"><img src="assets/parts/${p}.webp" alt=""><div><b>${L(...CPARTS[p].n)}</b><em>${L("Peso aquí", "Weight here")} ${v.toFixed(1)}/5 · ${L("en el coche", "on the car")} S${on}</em></div>
      ${q ? `<span class="${ok ? "ok" : "ko"}">S${q.n} ${ok ? L("llega a tiempo", "arrives in time") : L("no llega", "won't make it")}${q.eta != null ? ` · ${sDate(q.eta)}` : ""}</span>` : `<span class="nx">${S.car.pred ? `<button class="sp-btn gh xs" data-sa="newdev" data-p="${p}">${L("Diseñar", "Design")} ▶</button>` : "—"}</span>`}</div>`; };
  const res = ev && ev.res ? `<p class="sm-p">${L("Resultado", "Result")}: ${ev.res.mine.map(m => `<b>${S.people[m[0]].last} ${m[1] ? "P" + m[1] : "DNF"}</b>`).join(" · ")} · ${L("ganó", "won by")} ${sName(S.people[ev.res.win])}</p>` : "";
  sModal(`<div class="sm-h"><span>${ev ? `${L("Ronda", "Round")} ${ev.round} · ${sDate(ev.day + 2, true)}` : ""} · ${L(...DF_N[C.df])}</span><b class="cmh">${flagSvg(C.cc)} ${L(...C.gp)}</b></div>
    <p class="sm-p"><b>${C.name}</b> · ${C.city} · ${C.km.toFixed(3)} km · ${C.laps} ${L("vueltas", "laps")} · ${C.turns} ${L("curvas", "corners")}. ${L(...C.note)}</p>
    <p class="cm-host">${L(`De momento esta ronda se disputa en el ${S_HOST}; los requisitos sirven para planificar el desarrollo.`, `For now this round is raced at the ${S_HOST}; the requirements are there to plan the development.`)}</p>${res}
    <div class="sm-g2">${card(L("Lo que pide frente a tu coche", "What it asks against your car"), svgRadar({ axes: REQ_K, size: 270, min: 50, max: 100, labels: REQ_S, sets: [{ n: L("Exigencia", "Demand"), c: "#d49a2a", v: dem, dash: "4 4" }].concat(st0 ? [{ n: L("Tu coche", "Your car"), c: T.col, v: st0, fill: 1 }] : []) })
        + `<div class="lgd"><i class="dsh" style="background:#d49a2a"></i>${L("Exigencia del circuito", "Circuit demand")}${st0 ? `<i style="background:${T.col}"></i>${L("Tu coche", "Your car")} · ${L("encaje", "fit")} <b>${circFit(st0, k).toFixed(1)}</b>` : ""}</div>`)}
      ${card(L("Requisitos", "Requirements"), `<div class="creq">${REQ_K.map(s => `<div><span>${L(...REQ_N[s])}</span><i>${[1, 2, 3, 4, 5].map(v => `<u style="${v <= C.req[s] ? `background:var(--tc);opacity:${(.3 + v / 5 * .7).toFixed(2)}` : ""}"></u>`).join("")}</i><b>${C.req[s]}</b></div>`).join("")}</div>`)}</div>
    ${card(L("Las piezas que más pesan aquí", "The parts that matter most here"), `<div class="cprs">${parts.map(prow).join("")}</div>`)}
    <div class="sm-f"><button class="sp-btn" data-sa="mclose">${L("Cerrar", "Close")}</button></div>`, true);
}
function sGanttCard() { return seasonPlan({ lanes: ["gp", "rnd", "tun", "mfg"], compact: 1 }); }
function sRelHeat() {                                             // parts × circuits: how much each part's job matters there
  const v = PART_K.map(p => S_ROUNDS.map(c => partRel(p, c))), all = v.flat(), lo = Math.min(...all), hi = Math.max(...all);
  return heat({ cols: S_ROUNDS.map(c => CIRCUITS[c].code), rows: PART_K.map((p, i) => ({ lab: L(...CPARTS[p].n), v: v[i] })),
    color: x => `color-mix(in srgb,var(--tc) ${Math.round(8 + (x - lo) / (hi - lo) * 72)}%,transparent)`, fmt: x => x.toFixed(1) })
    + `<p class="sp-s">${L("Media de lo que pide cada circuito en las características que mejora la pieza (1 a 5). Cuanto más intenso el color, más rinde desarrollarla para esa ronda.", "The average of what each circuit asks in the characteristics the part improves (1 to 5). The stronger the colour, the more it pays to develop it for that round.")}</p>`;
}
// ---- calendar: the season plan, then the 8 circuits
SPAGE.cal = () => {
  const rounds = S.stand.rounds, me = sMyDrv(), gps = S.cal.filter(e => e.type === "gp"), nx = sPending();
  const hm = rounds.length ? card(L("Tus resultados", "Your results"), heat({ cols: gps.map(e => circOf(e).code),
    rows: me.filter(Boolean).map(p => ({ lab: p.last, c: TEAMS[S.team].col, v: gps.map(e => { const r = rounds.find(x => x.r === e.round); if (!r) return null; const x = r.res.find(y => y[0] === p.id); return x ? x[2] : null; }) })),
    color: heatPos, fmt: v => v ? "P" + v : "DNF" })) : "";
  const st0 = S.car.pred ? sCarStats(0, true) : S.car.design ? S.car.design.tg : null;
  const ccs = `<div class="ccs">${gps.map((e, i) => { const C = circOf(e), k = circKey(e), res = e.res;
    return `<button class="cc${e.done ? " fin" : ""}${e === nx ? " nx" : ""}" data-sa="circ" data-v="${k}" style="--i:${i}">
      <span class="cc-h">${flagSvg(C.cc)}<b>R${e.round} · ${C.code}</b><em>${sDate(e.day + 2, true)}</em></span>
      <span class="cc-n"><b>${L(...C.gp)}</b><em>${C.name} · ${C.km.toFixed(3)} km · ${C.laps} ${L("v.", "laps")}</em></span>
      <span class="cc-r">${REQ_K.map(s => `<i title="${L(...REQ_N[s])}: ${C.req[s]}/5"><u style="--v:${C.req[s]};opacity:${(.25 + (C.req[s] - 1) / 4 * .75).toFixed(2)}"></u><s>${L(...REQ_S[s]).slice(0, 3)}</s></i>`).join("")}</span>
      <span class="cc-f"><em class="df d${C.df}">${L(...DF_N[C.df])}</em>${st0 ? `<em>${L("Encaje", "Fit")} <b>${circFit(st0, k).toFixed(1)}</b></em>` : ""}${res ? `<em class="rs">${res.mine.map(m => `${S.people[m[0]].last.slice(0, 3).toUpperCase()} ${m[1] ? "P" + m[1] : "DNF"}`).join(" · ")}</em>` : e === nx ? `<em class="rs nx">${Math.max(0, e.day - S.day)} ${L("días", "days")}</em>` : ""}</span></button>`; }).join("")}</div>`;
  return sKick(L("Temporada 2026", "2026 season"), L("Calendario", "Calendar"))
    + `<p class="cal-host">${L(`De momento todas las rondas se disputan en el ${S_HOST}. Cada GP conserva sus requisitos para que planifiques qué piezas desarrollar y cuándo deben estar listas.`, `For now every round is raced at the ${S_HOST}. Each GP keeps its own requirements so you can plan which parts to develop and when they must be ready.`)}</p>`
    + card(L("Plan de la temporada", "Season plan"), seasonPlan(), "spl-card")
    + card(L("Los 8 circuitos", "The 8 circuits"), ccs) + hm;
};
// ---- standings
SPAGE.stand = () => {
  const tab = SP.tab.stand || "t", rounds = S.stand.rounds, t = S.team, xs = rounds.map(r => "R" + r.r);
  const cumT = {}, cumD = {}, posT = {}, posD = {};
  rounds.forEach((r, i) => { r.res.forEach(x => { cumT[x[1]] = (cumT[x[1]] || 0) + x[3]; cumD[x[0]] = (cumD[x[0]] || 0) + x[3]; });
    [...TEAM_ORDER].sort((a, b) => (cumT[b] || 0) - (cumT[a] || 0) || S_LV[b] - S_LV[a]).forEach((x, k) => { (posT[x] = posT[x] || [])[i] = k + 1; });
    Object.keys(cumD).sort((a, b) => cumD[b] - cumD[a]).forEach((c, k) => { (posD[c] = posD[c] || [])[i] = k + 1; }); });
  let body = "";
  if (tab === "t") {
    const C = sConsOrder(), lead = S.stand.t[C[0]] || 0;
    body = (rounds.length > 1 ? card(L("Posición tras cada ronda", "Position after each round"), svgLine({ w: 720, h: 260, x: xs, inv: 1, min: 1, max: 11, ticks: [1, 3, 5, 7, 9, 11], fmt: v => "P" + v, endLab: 1, dots: "last",
        series: C.map(x => ({ n: TEAMS[x].name, lab: TEAMS[x].name, c: TEAMS[x].col, w: x === t ? 3.5 : 1.6, op: x === t ? 1 : .55, v: posT[x] || [] })) })) : "")
      + `<div class="sp-g c2">${card(L("Puntos", "Points"), lolli(C.map(x => ({ lab: TEAMS[x].name, v: S.stand.t[x] || 0, c: TEAMS[x].col, me: x === t })), { fmt: v => v + " pts", max: Math.max(1, lead) }))}
        ${card(L("Distancia al líder", "Gap to the leader"), lolli(C.map(x => ({ lab: TEAMS[x].name, v: lead - (S.stand.t[x] || 0), c: x === t ? TEAMS[x].col : "#5b6572", me: x === t })), { fmt: v => v ? "−" + v : L("líder", "leader") }))}</div>`
      + (rounds.length ? card(L("Puntos por ronda", "Points by round"), heat({ cols: xs, rows: C.map(x => ({ lab: TEAMS[x].name, c: TEAMS[x].col, me: x === t, v: rounds.map(r => r.res.filter(y => y[1] === x).reduce((a, y) => a + y[3], 0)) })),
          color: v => v === 0 ? "rgba(255,255,255,.04)" : `rgba(62,207,142,${.15 + Math.min(1, v / 43) * .75})` })) : "");
  } else {
    const Dv = Object.keys(S.stand.d).length ? sDrvOrder() : DRIVERS.map(d => d.code), top = Dv.slice(0, 10), mine = sMyDrv().map(p => p && p.id).filter(Boolean), show = [...new Set([...top, ...mine])];
    const team = c => { const d = DRIVERS.find(x => x.code === c); return d ? d.team : S.people[c] && S.people[c].team; };
    body = (rounds.length > 1 ? card(L("Posición tras cada ronda", "Position after each round"), svgLine({ w: 720, h: 260, x: xs, inv: 1, min: 1, max: Math.min(22, Math.max(10, show.length)), ticks: [1, 5, 10, 15, 20].filter(v => v <= Math.max(10, show.length)), fmt: v => "P" + v, endLab: 1, dots: "last",
        series: show.map(c => ({ n: sName(S.people[c]), lab: S.people[c].last, c: team(c) ? TEAMS[team(c)].col : "#777", w: mine.includes(c) ? 3.5 : 1.5, op: mine.includes(c) ? 1 : .5, v: posD[c] || [] })) })) : "")
      + card(L("Clasificación de pilotos", "Drivers' standings"), `<div class="sp-tw"><table class="sp-t"><thead><tr><th>Pos</th><th></th><th>${L("Piloto", "Driver")}</th><th>${L("Equipo", "Team")}</th>${xs.map(x => `<th class="n">${x}</th>`).join("")}<th class="n">Pts</th></tr></thead><tbody>
        ${Dv.map((c, i) => { const p = S.people[c], tm = team(c); return `<tr class="${tm === t ? "me" : ""}"><td>${i + 1}</td><td>${mini(c, 22)}</td><td><b>${sName(p)}</b></td><td><i class="tdot" style="background:${tm ? TEAMS[tm].col : "#666"}"></i>${tm ? TEAMS[tm].name : "—"}</td>
          ${rounds.map(r => { const x = r.res.find(y => y[0] === c); return `<td class="n hcell" style="background:${x ? heatPos(x[2]) : "transparent"}">${x ? (x[2] ? x[2] : "R") : ""}</td>`; }).join("")}<td class="n"><b>${S.stand.d[c] || 0}</b></td></tr>`; }).join("")}</tbody></table></div>`);
  }
  return sKick(L("Campeonato", "Championship"), L("Clasificación", "Standings")) + `<div class="sp-tabs">${[["t", L("Constructores", "Constructors")], ["d", L("Pilotos", "Drivers")]].map(([k, n]) => `<button data-tab="stand" data-v="${k}" aria-pressed="${tab === k}">${n}</button>`).join("")}</div>`
    + (rounds.length ? "" : `<p class="sp-s">${L("La clasificación empieza a moverse tras la primera carrera.", "The standings start moving after the first race.")}</p>`) + body;
};
// ---- board
SPAGE.board = () => {
  const B = S.board, T = TEAMS[S.team], H = B.hist, next = S.cal.find(e => e.type === "board" && !e.done);
  const objs = B.obj.items.map(o => { const v = sObjValue(o), lower = o.k === "best" || o.k === "cap", max = o.k === "best" ? 22 : o.k === "cap" ? 140 : o.k === "media" ? 100 : Math.max(o.t * 1.5, (v || 0) * 1.1, 4);
    const vt = v == null ? "—" : o.k === "best" ? "P" + v : o.k === "cap" ? v + " %" : v, tt = o.k === "best" ? "P" + o.t : o.k === "cap" ? "≤ " + o.t + " %" : "≥ " + o.t;
    return `<div class="obj"><div class="oh"><b>${L(...OBJ_N[o.k])}</b><span>${L("Ahora", "Now")} <strong>${vt}</strong> · ${L("objetivo", "target")} ${tt}</span></div>${bullet(lower && o.k === "best" ? (v == null ? null : 23 - v) : v, lower && o.k === "best" ? 23 - o.t : o.t, max, lower && o.k !== "best", T.col)}</div>`; }).join("");
  return sKick(L("Junta directiva", "Board of directors"), L("Objetivos y confianza", "Targets and confidence")) + `<div class="tls t3">
      ${tile(L("Confianza", "Confidence"), svgGauge(B.conf, 100, B.conf >= 55 ? "#3ecf8e" : B.conf > 35 ? "#f2c94c" : "#ef6b5b", ""), B.conf >= 55 ? L("La junta confía en tu trabajo.", "The board trusts your work.") : B.conf > 35 ? L("La junta empieza a dudar.", "The board is starting to doubt.") : L("Tu puesto está en peligro.", "Your job is at risk."), "", "gz")}
      ${tile(L("Objetivo del campeonato", "Championship target"), `<b class="pz">P${B.target}</b>`, `${L("Ahora", "Now")}: ${S.stand.rounds.length ? "P" + sConsPos(S.team) : "—"} · ${money(B.B)}`)}
      ${tile(L("Próxima reunión", "Next meeting"), `<b class="pz sm">${next ? sDate(next.day) : "—"}</b>`, next ? `${Math.max(0, next.day - S.day)} ${L("días", "days")} · ${L("cada dos carreras", "every two races")}` : "")}</div>
    ${card(L(`Objetivos del trimestre ${B.q}`, `Quarter ${B.q} targets`), `<div class="objs">${objs}</div>`)}
    <div class="sp-g c2">${(() => { const lg = (B.log && B.log.length > 1 ? B.log : [[0, 60], [S.day, B.conf]]).slice(-60);
      return card(L("Confianza día a día", "Confidence day by day"), svgLine({ w: 460, h: 190, x: lg.map(l => sDate(l[0])), series: [{ n: L("Confianza", "Confidence"), c: B.conf > B_WARN ? T.col : "#ef6b5b", w: 3, area: 1, v: lg.map(l => l[1]) }], min: 0, max: 100, dots: "last",
        band: [{ v: B_WARN, c: "#f2c94c", n: L("aviso", "warning") }, { v: B_FIRE, c: "#ef6b5b", n: L("despido", "sacked") }] })
        + `<p class="sp-s">${L(`Se mueve cada semana con la caja, el ritmo de gasto y el valor mediático, y tras cada carrera con los puntos frente a lo que espera la junta. Por debajo de ${B_FIRE}, te despiden.`, `It moves every week with the cash, the spending pace and the media value, and after every race with the points against what the board expects. Below ${B_FIRE}, you are sacked.`)}</p>`); })()}
      ${card(L("Dinero de la junta", "Board money"), (() => { const paid = S.ledger.filter(l => l.cat === "brd").reduce((a, l) => a - l.a, 0); return svgDonut([{ lab: L("Recibido", "Received"), v: paid, c: T.col }, { lab: L("Por recibir (estimado)", "Still to come (estimate)"), v: Math.max(0, B.B - paid), c: "#3a414c" }], { center: Math.round(paid), sub: "M$", fmt: v => money(v) }); })())}</div>
    ${H.length ? card(L("Notas de cada trimestre", "Rating of each quarter"), hbars(H.map(h => ({ lab: L(`Trimestre ${h.q}`, `Quarter ${h.q}`), v: Math.round(h.score * 100), c: h.score >= .8 ? "#3ecf8e" : h.score >= .5 ? "#f2c94c" : "#ef6b5b" })), { min: 0, max: 100, fmt: v => v + "/100" })) : ""}`;
};
// ---- R&D
SPAGE.dev = () => SPAGE.rnd();
SPAGE.rnd = () => !S.steps.design ? sDesignPage() : sRndPage();
function sRndPage() {
  const slots = sSlots(), act = S.proj.filter(p => p.kind === "dev").length, built = !!S.car.pred, T = TEAMS[S.team];
  const parts = built ? PART_K.map((p, k) => {
    const sp = S.specs[p], onCar = [0, 1].map(j => { const u = S.units.find(x => x.id === S.fit[j][p]); return u ? u.n : 0; }), dev = S.proj.find(x => x.kind === "dev" && x.p === p);
    return `<div class="pc" style="--i:${k}"><div class="pci"><img src="assets/parts/${p}.webp" alt="" loading="lazy"></div><div class="pnm"><b>${L(...CPARTS[p].n)}</b><span>${L("En el coche", "On the car")}: S${onCar.join(" / S")}</span></div>
      <div class="spc">${sp.map(s => s ? `<span class="chip s-${s.st}${s.tested ? " tst" : ""}" title="${s.n > 1 ? (s.known ? L("Ganancia real", "Real gain") : L("Estimación", "Estimate")) + " " + (-sGainSec(s.known ? s.gain : s.est)).toFixed(3) + " s" : "Spec 1"}">S${s.n}${s.n > 1 && s.st !== "design" ? ` <small>${(-sGainSec(s.known ? s.gain : s.est)).toFixed(2)}</small>` : ""}</span>` : "").join("")}${dev ? `<span class="chip s-design">S${dev.n} · ${dev.end - S.day} d</span>` : ""}</div>
      <div class="ps">${Object.keys(CPARTS[p].st).map(s => `<em>${L(...ST_S[s])}</em>`).join("")}</div>
      <button class="sp-btn gh xs" data-sa="newdev" data-p="${p}" ${act >= slots ? "disabled" : ""}>+ ${L("Nuevo diseño", "New design")}</button></div>`; }).join("") : "";
  return sKick(L("Desarrollo · I+D+i", "Development · R&D"), built ? L("Proyectos de desarrollo", "Development projects") : L("Diseño del monoplaza 2026", "2026 car design"))
    + `<div class="tls t3">${tile(L("Proyectos", "Projects"), `<div class="rw">${ring(act, slots, T.col, 60, act + "/" + slots)}<em>${L("huecos de la oficina de diseño", "design office slots")}</em></div>`)}
      ${tile(L("Director técnico", "Technical director"), `<div class="rw">${mini(sTD(S.team)?.id, 40)}<div><b class="pz sm">${sOvr(sTD(S.team))}</b><em>${sName(sTD(S.team))}</em></div></div>`)}
      ${tile(L("Límite de gasto", "Cost cap"), `<div class="rw">${ring(S.cap / S_CAP * 100, 100, S.cap / S_CAP > .9 ? "#ef6b5b" : T.col, 60, Math.round(S.cap / S_CAP * 100) + "%")}<em>${money(S.cap)}</em></div>`)}</div>`
    + sCarCard() + (built ? card(L("Plan de desarrollo sobre el calendario", "Development plan over the calendar"), seasonPlan({ lanes: ["gp", "req", "rnd", "tun", "mfg"] }), "spl-card") + card(L("Qué pieza pesa en cada circuito", "Which part matters at each circuit"), sRelHeat()) : "")
    + (built ? card(L("Piezas: specs y nuevos diseños", "Parts: specs and new designs"), `<div class="pgrid">${parts}</div><p class="sp-s">${L("Verde: confirmada en pista. Azul: probada en túnel o banco. Gris: estimación. El número es la ganancia en segundos por vuelta (negativo = más rápido).", "Green: confirmed on track. Blue: tested in the tunnel or on the rig. Grey: estimate. The number is the gain in seconds per lap (negative = faster).")}</p>`) : "");
}
// a bell curve: where the real gain will probably land
function svgBell(mean, sd, o = {}) {
  const w = o.w || 360, h = o.h || 120, a = mean - 3.2 * sd, b = mean + 3.2 * sd, X = v => 10 + (v - a) / (b - a) * (w - 20), N = 60, pk = 1;
  const pts = Array.from({ length: N + 1 }, (_, i) => { const v = a + (b - a) * i / N, y = Math.exp(-((v - mean) ** 2) / (2 * sd * sd)); return [X(v), h - 22 - y * (h - 36)]; });
  const band = pts.filter((p, i) => { const v = a + (b - a) * i / N; return Math.abs(v - mean) <= sd; }), uid = "b" + (++CH_UID), col = o.col || "#5fb7ff";
  return `<svg class="ch bell" viewBox="0 0 ${w} ${h}" role="img" aria-label="${o.aria || ""}"><defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".5"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
    <path class="an-fade" d="M${band[0][0]} ${h - 22}${band.map(p => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("")}L${band[band.length - 1][0]} ${h - 22}Z" fill="url(#${uid})"/>
    <path class="an-ln" pathLength="1" d="${pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("")}" fill="none" stroke="${col}" stroke-width="2"/>
    <line x1="${X(mean)}" x2="${X(mean)}" y1="12" y2="${h - 22}" stroke="#eef1f5" stroke-dasharray="3 3"/>
    ${[a + .2 * sd, mean - sd, mean, mean + sd, b - .2 * sd].map(v => `<text x="${X(v)}" y="${h - 6}" text-anchor="middle">${o.fmt ? o.fmt(v) : v.toFixed(2)}</text>`).join("")}
    <text x="${X(mean) + 4}" y="20">${o.lab || ""}</text></svg>`;
}
function sDevModal(p) {
  const M = SP.modal = SP.modal && SP.modal.k === "dev" && SP.modal.p === p ? SP.modal : { k: "dev", p, amb: 1, focus: Object.keys(CPARTS[p].st)[0], urg: false };
  const pl = sDevPlan(p, M.amb, M.focus, M.urg), sec = -sGainSec(pl.est), sd = Math.abs(sec) * pl.u, n = S.specs[p].length + 1 + S.proj.filter(x => x.kind === "dev" && x.p === p).length, T = TEAMS[S.team];
  const st = sCarStats(0, true), after = { ...st }; Object.entries(pl.est).forEach(([s, v]) => after[s] = st[s] + v);
  const ax = ST, mn = Math.max(40, Math.floor(Math.min(...ax.map(s => st[s])) / 5) * 5 - 5);
  sModal(`<div class="sm-h"><span>${L("Nuevo diseño", "New design")} · Spec ${n}</span><b>${L(...CPARTS[p].n)}</b></div>
    <div class="sm-g2"><div><div class="dvh"><img class="pimg sm" src="assets/parts/${p}.webp" alt=""><div class="dvn">${cntTag(sec, "s3", "", "big")}<em>${L("por vuelta (estimado)", "per lap (estimate)")}</em><span>${(sec * RACE_LAPS).toFixed(1)} s ${L("por carrera", "per race")}</span></div></div>
      <div class="sm-sep">${L("Ambición del proyecto", "Project ambition")}</div><div class="sopt">${AMB.map((a, i) => `<button data-sa="dvamb" data-v="${i}" aria-pressed="${M.amb === i}"><b>${L(...a.n)}</b><em>×${a.c} ${L("coste", "cost")} · ×${a.d} ${L("tiempo", "time")} · ${L("riesgo", "risk")} ${Math.round(a.u * 100)} %</em></button>`).join("")}</div>
      <div class="sm-sep">${L("Enfoque", "Focus")}</div><div class="sopt row">${Object.keys(CPARTS[p].st).map(s => `<button data-sa="dvfoc" data-v="${s}" aria-pressed="${M.focus === s}">${L(...ST_N[s])}</button>`).join("")}</div>
      <label class="tg"><input type="checkbox" data-sa="dvurg" ${M.urg ? "checked" : ""}> ${L("Prioridad alta (−25 % de tiempo, +40 % de coste)", "High priority (−25% time, +40% cost)")}</label></div>
    <div>${card(L("Cómo cambia el coche", "How the car changes"), svgRadar({ axes: ax, size: 280, min: mn, max: Math.min(110, Math.max(...ax.map(s => after[s])) + 3), sets: [{ n: L("Ahora", "Now"), c: "#7d8792", v: st, dash: "4 3" }, { n: "Spec " + n, c: T.col, v: after, fill: 1 }] })
        + `<div class="lgd"><i class="dsh" style="background:#7d8792"></i>${L("Coche actual", "Current car")}<i style="background:${T.col}"></i>${L("Con la Spec", "With Spec")} ${n}</div>`)}
      ${card(L("Dónde puede acabar la ganancia", "Where the gain may end up"), svgBell(sec, Math.max(.003, sd), { col: T.col, fmt: v => v.toFixed(2), lab: L("segundos por vuelta", "seconds per lap") }) + `<p class="sp-s">${L("La zona sombreada es lo más probable. El túnel (o el banco) la estrecha antes de fabricar.", "The shaded zone is the most likely. The tunnel (or the rig) narrows it before you build.")}</p>`)}
      <div class="tls t2">${tile(L("Coste", "Cost"), `<b class="pz sm">${money(pl.cost)}</b>`, L("límite", "cap") + " " + Math.round((S.cap + pl.cost) / S_CAP * 100) + " %")}${tile(L("Plazo", "Lead time"), `<b class="pz sm">${pl.days} ${L("días", "days")}</b>`, L("listo el", "ready on") + " " + sDate(S.day + pl.days))}</div>
      ${(() => { const eta = S.day + pl.days + AMB[pl.amb].t + CPARTS[p].mfg * 2, g = sGpFor(eta), C = g ? circOf(g) : null, nxt = S.cal.filter(e => e.type === "gp" && !e.done && e.day >= eta).slice(0, 4);
        return card(L("Cuándo llega a pista", "When it reaches the track"), `<div class="dveta">${C ? `${flagSvg(C.cc)}<b>${L(...C.gp)}</b><em>R${g.round} · ${sDate(g.day + 2)} · ${L("diseño, túnel y 2 unidades", "design, tunnel and 2 units")}: ${sDate(eta)}</em>` : `<b>${L("No llega antes del final", "Not before the season ends")}</b>`}</div>`
          + (nxt.length ? `<div class="dvrel">${nxt.map(e => { const k = circKey(e), r = partRel(p, k); return `<span>${flagSvg(circOf(e).cc)}${circOf(e).code}<i><u style="width:${(r / 5 * 100).toFixed(0)}%"></u></i><b>${r.toFixed(1)}</b></span>`; }).join("")}</div><p class="sp-s">${L("Cuánto pesa esta pieza en las rondas que puede correr (1 a 5).", "How much this part matters in the rounds it can race (1 to 5).")}</p>` : ""), "dvc"); })()}</div></div>
    <div class="sm-f"><button class="sp-btn gh" data-sa="mclose">${L("Cancelar", "Cancel")}</button><button class="sp-btn" data-sa="dvgo">${L("Iniciar el diseño", "Start the design")} ▶</button></div>`, true);
}
// ---- production
SPAGE.prod = () => {
  const T = TEAMS[S.team], ready = PART_K.flatMap(p => (S.specs[p] || []).filter(s => s && s.st !== "design" && s.st !== "testing" && s.n > 0).map(s => ({ p, s })));
  const lines = S.proj.filter(x => x.kind === "mfg"), lane = i => { const P = lines[i];
    if (!P) return `<div class="lane idle"><span class="ln">${L("Línea", "Line")} ${i + 1}</span><b>${L("Libre", "Idle")}</b><em>${L("Encarga piezas abajo", "Order parts below")}</em></div>`;
    const left = (P.qty - P.done) * P.per - (P.prog || 0);
    return `<div class="lane"><span class="ln">${L("Línea", "Line")} ${i + 1}</span><img src="assets/parts/${P.p}.webp" alt=""><div><b>${L(...CPARTS[P.p].n)} · S${P.n}</b><em>${P.done}/${P.qty} ${L("unidades", "units")} · ${left} ${L("días", "days")}</em></div>${ring(P.done + (P.prog || 0) / P.per, P.qty, "#9bd35a", 52, Math.round((P.done + (P.prog || 0) / P.per) / P.qty * 100) + "%")}</div>`; };
  const queue = lines.slice(2);
  const stock = heat({ cols: [1, 2, 3, 4, 5].map(n => "S" + n), rows: PART_K.map(p => ({ lab: L(...CPARTS[p].n), v: [1, 2, 3, 4, 5].map(n => { const us = S.units.filter(u => u.p === p && u.n === n); return us.length ? us : null; }) })),
    color: us => { const c = us.reduce((a, u) => a + u.cond, 0) / us.length; return c >= 70 ? "rgba(62,207,142,.45)" : c >= 40 ? "rgba(242,201,76,.42)" : "rgba(239,107,91,.45)"; },
    fmt: us => `${us.length}×${us.filter(u => u.car != null).length ? "●" : ""}` });
  return sKick(L("Desarrollo · Producción", "Development · Production"), L("Fábrica", "Factory")) + (S.car.pred ? `<div class="lanes">${lane(0)}${lane(1)}</div>${queue.length ? `<p class="sp-s">${L("En cola", "Queued")}: ${queue.map(P => `${L(...CPARTS[P.p].n)} S${P.n} ×${P.qty}`).join(" · ")}</p>` : ""}
    ${card(L("Encargar piezas", "Order parts"), `<div class="ords">${ready.map(({ p, s }, k) => { const A = AMB[s.amb || 0]; return `<div class="ord" style="--i:${k}"><img src="assets/parts/${p}.webp" alt=""><div class="on"><b>${L(...CPARTS[p].n)}</b><span class="chip s-${s.st}${s.tested ? " tst" : ""}">S${s.n}</span></div>
      <span class="og">${s.n > 1 ? (-sGainSec(s.known ? s.gain : s.est)).toFixed(3) + " s" : "—"}</span><span class="oc">${money(CPARTS[p].unit * A.mu)} · ${CPARTS[p].mfg} d</span><div class="qt"><button data-sa="mfg" data-p="${p}" data-n="${s.n}" data-q="1">+1</button><button data-sa="mfg" data-p="${p}" data-n="${s.n}" data-q="2">+2</button></div></div>`; }).join("")}</div>`)}
    ${card(L("La fábrica sobre el calendario", "The factory over the calendar"), seasonPlan({ lanes: ["gp", "mfg", "ops"] }), "spl-card")}
    ${card(L("Almacén: unidades por spec", "Stock: units by spec"), stock + `<div class="lgd"><i style="background:rgba(62,207,142,.6)"></i>${L("buen estado", "good condition")}<i style="background:rgba(242,201,76,.6)"></i>${L("desgastadas", "worn")}<i style="background:rgba(239,107,91,.6)"></i>${L("al límite", "nearly done")} · ● ${L("montada en un coche", "fitted to a car")}</div>`)}`
    : card("", `<p class="sp-s">${L("La fábrica empezará cuando apruebes el diseño del coche.", "The factory starts once you approve the car design.")}</p>`));
};
// ---- the wind tunnel
SPAGE.dsim = () => {
  const left = S.atr.hours - S.atr.used, T = TEAMS[S.team], ae = sAero(S.team), cor = ae ? ae.a.cor : 80, now = S.proj.find(x => x.kind === "test");
  const cands = PART_K.flatMap(p => (S.specs[p] || []).filter(s => s && s.n > 1 && s.st === "ready" && !s.tested).map(s => ({ p, s })));
  const done = PART_K.flatMap(p => (S.specs[p] || []).filter(s => s && s.n > 1 && s.tested).map(s => ({ p, s })));
  return sKick(L("Desarrollo · Túnel de viento", "Development · Wind tunnel"), L("Túnel de viento y banco de pruebas", "Wind tunnel and test rig")) + `<div class="tls t3">
      ${tile(L("Horas de túnel (ATR)", "Tunnel hours (ATR)"), `<div class="rw">${ring(left, S.atr.hours, T.col, 64, left + "h")}<em>${L("de", "of")} ${S.atr.hours} h ${L("este trimestre", "this quarter")}</em></div>`, L("Cuanto mejor vas, menos horas te da el reglamento.", "The better you do, the fewer hours the rules allow."))}
      ${tile(L("Correlación túnel–pista", "Tunnel–track correlation"), svgGauge(cor, 100, cor >= 85 ? "#3ecf8e" : "#f2c94c", ""), ae ? sName(ae) : "", "", "gz")}
      ${tile(L("En el túnel ahora", "In the tunnel now"), now ? `<div class="rw">${ring(S.day - now.start, now.end - now.start, "#c58cff", 60, now.end - S.day + "d")}<em>${L(...CPARTS[now.p].n)} S${now.n}</em></div>` : `<b class="pz sm">${L("Libre", "Free")}</b>`)}</div>
    ${(() => { const st0 = S.car.pred ? sCarStats(0, true) : null, ta = now && CPARTS[now.p].aero, sp = now ? S.specs[now.p][now.n - 1] : null;
      const hero = flowHero({ st: st0, hud: !!st0, chips: 1, scan: !!now || !S.car.pred, part: ta ? now.p : null, lab: ta ? `${L(...CPARTS[now.p].n)} · S${now.n}` : null, delta: ta && sp && st0 ? aeroFig(now.p, sp.est || {}, carAero(st0)) : null,
        tag: ta ? L(`Ensayando · faltan ${now.end - S.day} días`, `Testing · ${now.end - S.day} days to go`) : st0 ? L("Túnel · el coche de hoy", "Tunnel · today's car") : L("Túnel · esperando el modelo", "Tunnel · waiting for the model"),
        big: ta ? `${now.end - S.day} d<small>${L("de ensayo", "of testing")}</small>` : st0 ? `${carRating(st0)}<small>${L("valoración", "rating")}</small>` : "" });
      return card(ta ? L("Ensayo en curso", "Test under way") : L("El coche en el túnel", "The car in the tunnel"), hero
        + `<div class="lgd afl"><i class="k1"></i>${L("Spec montada", "Spec fitted")}<i class="k2"></i>${L("En diseño (CFD)", "In design (CFD)")}<i class="k3"></i>${L("En el túnel", "In the tunnel")}<i class="k4"></i>${L("Lista para fabricar", "Ready to build")}</div>`
        + (ta && sp ? `<p class="sp-s">${L("La zona resaltada es donde la pieza nueva cambia el flujo. La cifra sobre ella es la estimación de diseño; el túnel la confirmará al acabar.", "The highlighted zone is where the new part changes the flow. The figure on it is the design estimate; the tunnel confirms it when it finishes.")}</p>` : "")); })()}
    ${now && !CPARTS[now.p].aero ? card(L("Ensayo en curso · banco de pruebas", "Test under way · test rig"), sideCar({ cls: "rig", zones: `<span class="sc-pt" style="left:${PART_AT[now.p][0]}%;top:${PART_AT[now.p][1]}%"><i></i><b>${L(...CPARTS[now.p].n)} · S${now.n}</b></span>` })) : ""}
    ${S.car.pred ? card(L("Ensayos sobre el calendario", "Tests over the calendar"), seasonPlan({ lanes: ["gp", "req", "rnd", "tun"] }), "spl-card") : ""}
    ${card(L("Piezas diseñadas sin probar", "Designed parts not yet tested"), cands.length ? `<div class="ords">${cands.map(({ p, s }, k) => { const pl = sTestPlan(p, s.n); return `<div class="ord" style="--i:${k}"><img src="assets/parts/${p}.webp" alt=""><div class="on"><b>${L(...CPARTS[p].n)}</b><span class="chip s-ready">S${s.n}</span></div>
      <span class="og">${(-sGainSec(s.est)).toFixed(3)} s</span><span class="oc">${CPARTS[p].aero ? pl.hours + " h · " : ""}${pl.days} d</span><button class="sp-btn gh xs" data-sa="tun" data-p="${p}" data-n="${s.n}" ${pl.hours > left ? "disabled" : ""}>${CPARTS[p].aero ? L("Al túnel", "To the tunnel") : L("Al banco", "To the rig")}</button></div>`; }).join("")}</div>` : `<p class="sp-s">${L("No hay piezas pendientes de probar. Diseña una en I+D+i.", "No parts waiting to be tested. Design one in R&D.")}</p>`)}
    ${done.length ? card(L("Último resultado", "Latest result"), tunnelResult(done[done.length - 1].p, done[done.length - 1].s, true)) + (done.length > 1 ? card(L("Resultados anteriores", "Earlier results"), `<div class="sp-g c2">${done.slice(-3, -1).reverse().map(d => `<div><div class="trh"><b>${L(...CPARTS[d.p].n)} · Spec ${d.s.n}</b></div>${tunnelResult(d.p, d.s, false)}</div>`).join("")}</div>`) : "") : ""}`;
};
// ---- operations: the car, part by part
const OPS_HOT_OLD = { fw: [14, 86], ch: [42, 46], su: [37, 80], br: [47, 88], sp: [58, 50], fl: [73, 60], pu: [67, 33], gb: [78, 30], rw: [87, 13] };
function sCarWith(k, p, id) { const o = S.fit[k][p]; S.fit[k][p] = id; const st = sCarStats(k, true); if (o == null) delete S.fit[k][p]; else S.fit[k][p] = o; return st; }
SPAGE.ops = () => {
  if (!S.car.pred) return sKick(L("Operaciones", "Operations"), L("Preparación de monoplazas", "Car preparation")) + card("", `<p class="sp-s">${L("Cuando el coche esté construido, aquí decidirás qué piezas lleva cada monoplaza.", "Once the car is built, this is where you decide which parts each car runs.")}</p>`);
  const O = SP.ops = SP.ops || { k: 0, p: "fw", pick: null }, T = TEAMS[S.team], k = O.k, d = DRIVERS[k], st = sCarStats(k, true);
  const cur = S.units.find(x => x.id === S.fit[k][O.p]), opts = S.units.filter(x => x.p === O.p && (x.car == null || x.car === k)).sort((a, b) => b.n - a.n || b.cond - a.cond);
  const pick = O.pick != null ? S.units.find(x => x.id === O.pick) : null, prev = pick && (!cur || pick.id !== cur.id) ? sCarWith(k, O.p, pick.id) : null;
  const hot = PART_K.map(p => { const u = S.units.find(x => x.id === S.fit[k][p]), [x, y] = PART_AT[p] || [50, 50], c = u ? statCol(u.cond) : "#ef6b5b";
    return `<button class="hs${p === O.p ? " on" : ""}${x < 20 ? " al" : x > 80 ? " ar" : ""}" data-sa="opp" data-v="${p}" style="left:${x}%;top:${y}%;--c:${c}" title="${L(...CPARTS[p].n)}"><i>${u ? "S" + u.n : "!"}</i><span>${L(...CPARTS[p].n)}${u ? ` · ${u.cond}%` : ""}</span></button>`; }).join("");
  const gainOf = u => { if (!u) return {}; const sp = S.specs[O.p][u.n - 1], g = sp ? (sp.known ? sp.gain : sp.est) : {}, f = condF(u.cond), o = {}; Object.keys(CPARTS[O.p].st).forEach(s => o[s] = (g[s] || 0) * f - (u.cond < 50 ? (50 - u.cond) / 50 * 4 * CPARTS[O.p].st[s] / .35 : 0)); return o; };
  const g0 = gainOf(cur), unit = u => { const g = gainOf(u), dl = Object.keys(CPARTS[O.p].st).map(s => ({ lab: L(...ST_S[s]), v: r1((g[s] || 0) - (g0[s] || 0)) })), fit = cur && cur.id === u.id, other = u.car != null && u.car !== k;
    return `<div class="unit${fit ? " fit" : ""}${pick && pick.id === u.id ? " pk" : ""}"><button class="ub" data-sa="oppick" data-v="${u.id}">${ring(u.cond, 100, statCol(u.cond), 46, u.cond + "%")}<div><b>Spec ${u.n}</b><em>${fit ? L("montada", "fitted") : other ? L("en el otro coche", "on the other car") : L("en el almacén", "in stock")}</em></div></button>
      ${fit ? "" : dl.every(x => Math.abs(x.v) < .05) ? `<p class="sp-s">${L("Rinde igual que la montada.", "Performs the same as the fitted one.")}</p>` : divBars(dl, { max: 6 })}${fit ? "" : `<button class="sp-btn xs" data-sa="opfit" data-v="${u.id}">${L("Montar en", "Fit to")} #${d.num}</button>`}</div>`; };
  const pu = Object.keys(PU_EL).map(e => { const used = S.pu.used[k][e], lim = PU_EL[e][1], c = S.pu.cond[k][e];
    return `<div class="pue">${ring(c, 100, statCol(c), 52, c + "%")}<b>${L(...PU_EL[e][0])}</b><span class="pips">${Array.from({ length: Math.max(lim, used) }, (_, i) => `<i class="${i < used ? (i >= lim ? "x" : "u") : ""}"></i>`).join("")}</span><button class="sp-btn gh xs" data-sa="pu" data-k="${k}" data-e="${e}">${L("Nueva", "New")}</button></div>`; }).join("");
  const sets = [{ n: L("Coche ahora", "Car now"), c: T.col, v: st, fill: 1 }]; if (prev) sets.push({ n: L("Con la pieza elegida", "With the chosen part"), c: "#f2c94c", v: prev, dash: "4 3" });
  const ax = ST, mn = Math.max(40, Math.floor(Math.min(...ax.map(s => Math.min(st[s], prev ? prev[s] : 99))) / 5) * 5 - 5);
  return sKick(L("Operaciones", "Operations"), L("Preparación de monoplazas", "Car preparation")) + `<div class="cars">${[0, 1].map(j => `<button data-sa="opk" data-v="${j}" aria-pressed="${j === k}">${mini(DRIVERS[j].code, 30)}<b>#${DRIVERS[j].num}</b><span>${DRIVERS[j].name}</span><em>${carRating(sCarStats(j, true))}</em></button>`).join("")}</div>
    <div class="opcar">${sideCar({ cls: "ops", over: hot })}<span class="oph">${L("Toca una pieza del coche", "Tap a part of the car")}</span></div>
    <div class="opw"><div class="opd">${card(`<img class="sepimg" src="assets/parts/${O.p}.webp" alt="">${L(...CPARTS[O.p].n)}`, `<div class="units">${opts.length ? opts.map(unit).join("") : `<p class="sp-s">${L("No quedan unidades: encarga más en Producción.", "No units left: order more in Production.")}</p>`}</div>`)}</div></div>
    ${card(L("Piezas en cada coche, GP a GP", "Parts on each car, GP by GP"), seasonPlan({ lanes: ["gp", "req", "mfg", "ops"] }), "spl-card")}
    <div class="sp-g c2">${card(L("El coche", "The car") + ` #${d.num}`, svgRadar({ axes: ax, size: 270, min: mn, max: 100, sets }) + `<div class="lgd">${sets.map(s => `<i style="background:${s.c}" class="${s.dash ? "dsh" : ""}"></i>${s.n}`).join("")}</div>`
        + `<div class="sum"><span>${L("Valoración", "Rating")} <b>${carRating(st)}</b></span>${prev ? `<span>${L("Con el cambio", "With the change")} <b>${carRating(prev)}</b> (${((carSkill(st) - carSkill(prev)) * LAP_REF).toFixed(3)} s/${L("vuelta", "lap")})</span>` : ""}<span>${L("Fiabilidad", "Reliability")} <b>${Math.round(st.rel)}</b></span>${S.pu.pen[k] ? `<span class="ko">${L("Penalización", "Penalty")} <b>+${S.pu.pen[k]}</b></span>` : ""}</div>`)}
      ${card(L("Unidad de potencia", "Power unit") + ` #${d.num}`, `<div class="pug">${pu}</div><p class="sp-s">${L("Cada elemento tiene un límite por temporada; montar uno más allá del límite se castiga en la parrilla.", "Each element has a season limit; going beyond it costs grid places.")}</p>`)}</div>`;
};
// ---- squad
function pcard(p, role) {
  if (!p) return `<div class="pcard empty"><b>${role}</b><span>${L("Vacante", "Vacant")}</span></div>`;
  return `<button class="pcard" data-sa="person" data-v="${p.id}">${ppImg(p.id, 58)}<div class="pi"><span>${role}</span><b>${sName(p)}</b><em>${flagSvg(p.nat)}${p.age} · ${money(p.sal)}/${L("año", "yr")}</em>
    <div class="pr"><b class="ov" style="color:${statCol(sOvr(p))}">${sOvr(p)}</b>${meter(p.mot, 100, statCol(p.mot))}</div></div></button>`;
}
function crewHist() { const v = []; for (let i = 0; i < 400; i++) v.push(Math.min(6, sCrewStop({}))); return svgHist(v, { min: 1.8, max: 6, bins: 21, unit: " s", col: "#5fb7ff", aria: L("Paradas", "Pit stops") }); }
SPAGE.squad = SPAGE.active = () => {
  S.steps.squad = true;
  const t = S.team, me = sMyDrv(), cr = S.crew[t], T = TEAMS[t];
  const dr = me.filter(Boolean), ax = ROLE_AX.driver;
  return sKick(L("Plantilla", "Squad"), L("Activos del equipo", "Team assets"))
    + `<div class="sp-g c2">${card(L("Pilotos", "Drivers"), `<div class="pgr">${pcard(me[0], L("Piloto 1", "Driver 1"))}${pcard(me[1], L("Piloto 2", "Driver 2"))}${pcard(S.people[S.rsv], L("Reserva", "Reserve"))}</div>`)}
      ${card(L("Los dos pilotos, cara a cara", "The two drivers, side by side"), dr.length === 2 ? svgRadar({ axes: ax, labels: roleLabels("driver"), size: 270, min: 60, max: 100, sets: [{ n: sName(dr[0]), c: T.col, v: dr[0].a, fill: 1 }, { n: sName(dr[1]), c: "#5fb7ff", v: dr[1].a, dash: "4 3" }] }) + `<div class="lgd"><i style="background:${T.col}"></i>${sName(dr[0])}<i class="dsh" style="background:#5fb7ff"></i>${sName(dr[1])}</div>` : "")}</div>`
    + card(L("Técnicos", "Technical staff"), `<div class="pgr">${pcard(sTD(t), sRole(sTD(t), "td"))}${pcard(sAero(t), sRole(sAero(t), "aero"))}${pcard(sSD(t), sRole(sSD(t), "sd"))}${sEngs(t).map((p, i) => pcard(p, `${sFem(p) ? L("Ingeniera", "Engineer") : L("Ingeniero", "Engineer")} #${DRIVERS[i].num}`)).join("")}</div>`)
    + `<div class="sp-g c2">${card(L("Mecánicos", "Pit crew") + " · " + cr.chief, svgRadar({ axes: ["spd", "cons", "fit", "mot", "rest"], labels: { spd: ["Velocidad", "Speed"], cons: ["Consistencia", "Consistency"], fit: ["Forma", "Fitness"], mot: ["Motivación", "Motivation"], rest: ["Descanso", "Rest"] }, size: 250, min: 40, max: 100,
        sets: [{ n: cr.chief, c: T.col, v: { spd: cr.spd, cons: cr.cons, fit: cr.fit, mot: cr.mot, rest: 100 - cr.fat }, fill: 1 }] }))}
      ${card(L("Cómo serían hoy sus paradas", "What their stops would look like today"), crewHist() + `<p class="sp-s">${L("400 paradas simuladas con su estado actual. Lo que dices en las entrevistas mueve su motivación.", "400 stops simulated with their current state. What you say in interviews moves their motivation.")}</p>`)}</div>
    <div class="sp-f"><button class="sp-btn" data-go2="market">${L("Ir al mercado de fichajes", "Go to the transfer market")} ▶</button></div>`;
};
function sPersonModal(id) {
  const p = S.people[id], T = p.team ? TEAMS[p.team] : null, mine = p.team === S.team;
  const rep = !mine ? (p.kind === "driver" ? sMyDrv().filter(Boolean).sort((a, b) => sOvr(a) - sOvr(b))[0] : p.kind === "eng" ? sEngs(S.team)[0] : sTeamStaff(S.team, p.kind)[0]) : null;
  const R = p.kind === "driver" ? S.stand.rounds.map(r => ({ r: r.r, x: r.res.find(x => x[0] === id) })).filter(o => o.x) : [];
  sModal(`<div class="sm-pp">${ppImg(id, 96, "big")}<div class="pi"><span>${sRole(p)}${p.series && p.kind === "driver" ? " · " + p.series : ""}</span><b>${sName(p)}</b>
      <em>${flagSvg(p.nat)}${(COUNTRY[p.nat] || ["", ""])[OPT.lang === "en" ? 1 : 0]} · ${p.age} ${L("años", "years")} · ${T ? `<i class="tdot" style="background:${T.col}"></i>${T.full}` : L("Sin equipo", "No team")}</em>
      <div class="sm-g3">${kpi(L("Media", "Overall"), sOvr(p))}${p.kind === "driver" ? kpi(L("Potencial", "Potential"), p.pot) : ""}${kpi(L("Salario", "Salary"), money(p.sal), L("al año", "a year"))}${kpi(L("Contrato", "Contract"), p.end || "—")}</div></div></div>
    <div class="sm-g2">${card(rep ? L(`Frente a ${sName(rep)}`, `Against ${sName(rep)}`) : L("Atributos", "Attributes"), personRadar(p, rep, 280) + (rep ? `<div class="lgd"><i style="background:${p.team ? TEAMS[p.team].col : "#c9ccd4"}"></i>${sName(p)}<i class="dsh" style="background:#7d8792"></i>${sName(rep)}</div>` : ""))}
      ${card(L("Estado", "Condition"), `<div class="rw">${svgGauge(p.mot, 100, statCol(p.mot), "", L("motivación", "motivation"))}<p class="sp-s">${p.mot >= 80 ? L(`Muy ${sFem(p) ? "motivada" : "motivado"}: rinde por encima de su nivel.`, `Highly motivated: performing above ${sFem(p) ? "her" : "his"} level.`) : p.mot >= 60 ? L("Motivación normal.", "Normal motivation.") : L(`${sFem(p) ? "Desmotivada" : "Desmotivado"}: pierde rendimiento y comete más errores.`, "Demotivated: losing performance and making more mistakes.")}</p></div>
        ${p.kind === "driver" ? `<p class="sp-s">${L("Efecto en el ritmo", "Effect on pace")}: <b>${(-drvSkill(p) * LAP_REF >= 0 ? "+" : "") + (-drvSkill(p) * LAP_REF).toFixed(2)} s/${L("vuelta", "lap")}</b> ${L("respecto a un piloto medio", "against an average driver")}</p>` : ""}
        ${R.length ? `<div class="sp-sep">${L("Resultados", "Results")}</div>` + heat({ cols: R.map(o => "R" + o.r), rows: [{ lab: p.last, v: R.map(o => o.x[2]) }], color: heatPos, fmt: v => v ? "P" + v : "DNF" }) : ""}
        ${S_ATTR[p.kind].map(([k, es, en]) => `<div class="att"><span>${L(es, en)}</span>${meter(p.a[k], 100, statCol(p.a[k]))}<b>${p.a[k]}</b></div>`).join("")}`)}</div>
    ${!mine ? `<div class="sm-f"><button class="sp-btn" data-sa="offer" data-v="${id}" ${sMarketOpen() ? "" : "disabled"}>${sMarketOpen() ? L("Hacer una oferta", "Make an offer") : L("Mercado cerrado", "Market closed")} ▶</button></div>` : ""}`, true);
}
SPAGE.market = () => {
  const tab = SP.tab.market || "driver", open = sMarketOpen();
  const list = Object.values(S.people).filter(p => p.kind === tab && p.team !== S.team && p.id !== S.rsv).sort((a, b) => sOvr(b) - sOvr(a));
  return sKick(L("Plantilla · Fichajes", "Squad · Signings"), L("Mercado", "Market")) + `<div class="sp-tabs">${[["driver", L("Pilotos", "Drivers")], ["td", L("Directores técnicos", "Technical directors")], ["aero", L("Aerodinámica", "Aero")], ["eng", L("Ingenieros", "Engineers")], ["sd", L("Directores deportivos", "Sporting directors")]].map(([k, n]) => `<button data-tab="market" data-v="${k}" aria-pressed="${tab === k}">${n}</button>`).join("")}
    <span class="win ${open ? "ok" : ""}">${open ? L("Mercado abierto", "Market open") : L("Mercado cerrado hasta el parón", "Market closed until the break")}</span></div>`
    + card("", `<div class="sp-tw"><table class="sp-t mk"><thead><tr><th></th><th>${L("Nombre", "Name")}</th><th>${L("Ahora", "Now")}</th><th class="n">${L("Edad", "Age")}</th><th class="n">${L("Media", "Ovr")}</th>${tab === "driver" ? `<th class="n">Pot.</th>` : ""}<th class="n">${L("Pide", "Asks")}</th><th class="n">${L("Cláusula", "Release")}</th><th class="n">${L("Interés", "Interest")}</th><th></th></tr></thead><tbody>
      ${list.map(p => { const ch = sAccept(p, sDemand(p), 2, 0); return `<tr><td>${mini(p.id, 26)}</td><td><button class="lnk" data-sa="person" data-v="${p.id}"><b>${sName(p)}</b></button><small>${flagSvg(p.nat)}</small></td>
        <td>${p.team ? `<i class="tdot" style="background:${TEAMS[p.team].col}"></i>${TEAMS[p.team].name}` : `<em class="ser">${p.series || L("Libre", "Free")}</em>`}</td><td class="n">${p.age}</td><td class="n"><b style="color:${statCol(sOvr(p))}">${sOvr(p)}</b></td>${tab === "driver" ? `<td class="n">${p.pot}</td>` : ""}
        <td class="n">${money(sDemand(p))}</td><td class="n">${sBuyout(p) ? money(sBuyout(p)) : "—"}</td><td class="n">${meter(ch * 100, 100, statCol(ch * 100))}</td><td><button class="sp-btn gh xs" data-sa="offer" data-v="${p.id}" ${open ? "" : "disabled"}>${L("Oferta", "Offer")}</button></td></tr>`; }).join("")}</tbody></table></div>`);
};
function sOfferModal(id) {
  const p = S.people[id], M = SP.modal = SP.modal && SP.modal.k === "offer" && SP.modal.id === id ? SP.modal : { k: "offer", id, sal: sDemand(p), yrs: 2, role: p.kind === "driver" ? (sOvr(p) >= 80 ? "1" : "res") : "0", res: null };
  const ch = sAccept(p, M.sal, M.yrs, M.role), buy = sBuyout(p), me = sMyDrv();
  const roles = p.kind === "driver" ? [["0", L(`Titular · sustituye a ${me[0].last}`, `Race seat · replaces ${me[0].last}`)], ["1", L(`Titular · sustituye a ${me[1].last}`, `Race seat · replaces ${me[1].last}`)], ["res", L("Piloto reserva", "Reserve driver")]]
    : p.kind === "eng" ? sEngs(S.team).map((e, i) => [String(i), L(`Sustituye a ${sName(e)}`, `Replaces ${sName(e)}`)]) : [["0", L(`Sustituye a ${sName(sTeamStaff(S.team, p.kind)[0])}`, `Replaces ${sName(sTeamStaff(S.team, p.kind)[0])}`)]];
  const rep = p.kind === "driver" ? (M.role === "res" ? S.people[S.rsv] : me[+M.role]) : p.kind === "eng" ? sEngs(S.team)[+M.role || 0] : sTeamStaff(S.team, p.kind)[0];
  sModal(`<div class="sm-pp">${ppImg(id, 80, "big")}<div class="pi"><span>${L("Negociación", "Negotiation")} · ${sRole(p)}</span><b>${sName(p)}</b><em>${p.team ? TEAMS[p.team].full : p.series || L("Sin equipo", "No team")} · ${L("media", "overall")} ${sOvr(p)}</em></div></div>
    ${M.res ? `<p class="sm-msg ${M.res.ok ? "ok" : "ko"}">${M.res.t}</p>` : `<div class="sm-g2"><div>
    <div class="sm-sep">${L("Puesto", "Role")}</div><div class="sopt">${roles.map(([v, n]) => `<button data-sa="ofrole" data-v="${v}" aria-pressed="${M.role === v}">${n}</button>`).join("")}</div>
    <div class="slr"><span>${L("Salario anual", "Annual salary")}</span><input type="range" min="${r1(sDemand(p) * .5)}" max="${r1(sDemand(p) * 1.6)}" step="0.1" value="${M.sal}" data-sa="ofsal" aria-label="${L("Salario", "Salary")}"><b>${money(M.sal)}</b></div>
    <div class="sopt row">${[1, 2, 3].map(y => `<button data-sa="ofyrs" data-v="${y}" aria-pressed="${M.yrs === y}">${y} ${y === 1 ? L("año", "year") : L("años", "years")}</button>`).join("")}</div>
    <div class="sm-g3">${kpi(L("Pide", "Asks for"), money(sDemand(p)))}${kpi(L("Cláusula", "Release fee"), buy ? money(buy) : "—")}</div>
    <div class="och">${svgGauge(ch * 100, 100, statCol(ch * 100), "", L("probabilidad", "chance")).replace('class="gv">', 'class="gv" id="ofCh">')}</div></div>
    <div>${rep ? card(L(`Frente a ${sName(rep)}`, `Against ${sName(rep)}`), personRadar(p, rep, 250) + `<div class="lgd"><i style="background:${p.team ? TEAMS[p.team].col : "#c9ccd4"}"></i>${p.last}<i class="dsh" style="background:#7d8792"></i>${rep.last}</div>`) : ""}</div></div>`}
    <div class="sm-f">${M.res ? `<button class="sp-btn" data-sa="mclose">${L("Cerrar", "Close")}</button>` : `<button class="sp-btn gh" data-sa="mclose">${L("Cancelar", "Cancel")}</button><button class="sp-btn" data-sa="ofgo">${L("Enviar la oferta", "Send the offer")} ▶</button>`}</div>`, true);
}
// ---- finance
SPAGE.fin = () => {
  const T = TEAMS[S.team], out = {}, inc = {}; S.ledger.forEach(l => { if (l.a > 0) out[l.cat] = (out[l.cat] || 0) + l.a; else inc[l.cat] = (inc[l.cat] || 0) - l.a; });
  const pace = S.day ? S.cap / Math.max(7, S.day) * 196 : 0, H = S.cashH, PAL = ["#5fb7ff", "#c58cff", "#f2c94c", "#ef8a5b", "#3ecf8e", "#e86fb0", "#9bd35a", "#8a95a3", "#4dd0c8", "#d7a26b", "#a0a8ff"];
  const outs = Object.entries(out).sort((a, b) => b[1] - a[1]), ins = Object.entries(inc).sort((a, b) => b[1] - a[1]);
  let capRun = 0; const capPts = []; S.ledger.forEach(l => { if (l.a > 0 && !["drv", "mkt"].includes(l.cat) && !(l.cat === "staff" && /técnico|technical/i.test(l.txt))) capRun += l.a; capPts.push([l.d, capRun]); });
  const byWeek = []; for (let w = 0; w <= sWeekN(S.day); w++) { const pts = capPts.filter(p => sWeekN(p[0]) - 1 <= w); byWeek.push(pts.length ? pts[pts.length - 1][1] : 0); }
  return sKick(L("Finanzas", "Finances"), L("Presupuesto y límite de gasto", "Budget and cost cap")) + `<div class="tls">
      ${tile(L("Caja", "Cash"), cntTag(S.cash, "money", "", S.cash < 0 ? "neg" : ""), "", spark(H.map(h => h[1]), S.cash < 0 ? "#ef6b5b" : "#3ecf8e", 220, 40))}
      ${tile(L("Gastado en el límite", "Spent under the cap"), `<div class="rw">${ring(S.cap, S_CAP, S.cap / S_CAP > .9 ? "#ef6b5b" : T.col, 64, Math.round(S.cap / S_CAP * 100) + "%")}<em>${money(S.cap)}<br>${L("de", "of")} ${S_CAP} M$</em></div>`)}
      ${tile(L("Proyección a final de año", "Year-end projection"), cntTag(pace, "money", "", pace > S_CAP ? "neg" : ""), Math.round(pace / S_CAP * 100) + " % " + L("del límite", "of the cap"))}</div>
    ${card(L("De dónde viene y adónde va el dinero", "Where the money comes from and goes"), svgWaterfall({ w: 720, h: 240, start: 0, startLab: L("Inicio", "Start"), endLab: L("Caja", "Cash"), col: T.col, items: [...ins.map(([k, v]) => ({ lab: L(...CAT[k]), v })), ...outs.map(([k, v]) => ({ lab: L(...CAT[k]), v: -v }))] }))}
    <div class="sp-g c2">${card(L("Gastos por partida", "Spending by item"), svgDonut(outs.map(([k, v], i) => ({ lab: L(...CAT[k]), v, c: PAL[i % PAL.length] })), { center: Math.round(outs.reduce((a, x) => a + x[1], 0)), sub: L("M$ gastados", "M$ spent"), fmt: v => money(v) }))}
      ${card(L("Ritmo de gasto frente al límite", "Spending pace against the cap"), svgLine({ w: 460, h: 200, x: byWeek.map((_, i) => "S" + (i + 1)), series: [{ n: L("Gasto acumulado", "Spending so far"), c: T.col, w: 3, area: 1, v: byWeek }, { n: L("Ritmo máximo", "Maximum pace"), c: "#ef6b5b", dash: "4 4", v: byWeek.map((_, i) => r1(S_CAP * (i * 7) / 196)) }], min: 0, dots: "last" })
        + `<div class="lgd"><i style="background:${T.col}"></i>${L("Gasto acumulado (límite)", "Spending so far (cap)")}<i class="dsh" style="background:#ef6b5b"></i>${L("Ritmo que agota el límite a final de año", "Pace that uses the whole cap by year end")}</div>`)}</div>
    ${card(L("Salarios anuales", "Annual salaries"), hbars([...sMyDrv(), S.people[S.rsv], sTD(S.team), sAero(S.team), sSD(S.team), ...sEngs(S.team)].filter(Boolean).map(p => ({ lab: `${sName(p)} · ${sRole(p)}`, v: p.sal, c: p.kind === "driver" ? T.col : "#5fb7ff" })), { fmt: v => money(v) }))}`;
};
// ---- marketing
SPAGE.mkt = () => {
  const T = TEAMS[S.team], H = S.mediaH, m = mediaOf(S.team), spon = [["Atlas Networks", 40, .35], ["Nordvolt Energy", 55, .5], ["Zenith Watches", 65, .65], ["Orbit Cloud", 75, .85], ["Aurum Bank", 85, 1.1]];
  const rank = [...TEAM_ORDER].sort((a, b) => mediaOf(b) - mediaOf(a));
  return sKick(L("Marketing y eventos", "Marketing and events"), L("Imagen del equipo", "Team image")) + `<div class="tls t3">${tile(L("Valor mediático", "Media value"), svgGauge(m, 100, T.col, "", mediaTier(m)), "", "", "gz")}${tile(L("Patrocinio semanal", "Weekly sponsorship"), cntTag(.3 + m / 100, "money"), L("más los patrocinadores que desbloqueas", "plus the sponsors you unlock"))}${tile(L("Puesto en imagen", "Image ranking"), `<b class="pz">P${rank.indexOf(S.team) + 1}</b>`, L("entre los 11 equipos", "among the 11 teams"))}</div>
    <div class="sp-g c2">${card(L("Valor mediático", "Media value"), svgLine({ w: 460, h: 190, x: H.map(h => sDate(h[0])), series: [{ n: L("Valor mediático", "Media value"), c: T.col, w: 3, area: 1, v: H.map(h => h[1]) }], min: 0, max: 100 }))}
      ${card(L("Escalera de patrocinadores", "Sponsor ladder"), `<div class="lad"><div class="ltr"><i style="width:${m}%"></i>${spon.map(([n, req]) => `<s style="left:${req}%" class="${m >= req ? "ok" : ""}"><em>${req}</em></s>`).join("")}</div>
        ${spon.map(([n, req, v]) => `<div class="lsp ${m >= req ? "ok" : ""}"><b>${n}</b><span>${L("exige", "needs")} ${req}</span><em>${m >= req ? "+" + money(v) + " / " + L("sem", "wk") : L("bloqueado", "locked")}</em></div>`).join("")}</div>`)}</div>
    ${card(L("Imagen de los equipos", "The teams' image"), lolli(rank.map(x => ({ lab: TEAMS[x].name, v: mediaOf(x), c: x === S.team ? T.col : "#5b6572", me: x === S.team })), { max: 100 }))}`;
};
// ---- training
SPAGE.train = SPAGE.tdrv = SPAGE.tsim = SPAGE.pit = () => {
  const cr = S.crew[S.team], T = TEAMS[S.team], wk = S.trainWk === sWeekN(S.day), sd = sSD(S.team);
  return sKick(L("Entrenamiento", "Training"), L("Pilotos y mecánicos", "Drivers and crew")) + `<div class="sp-g c2">
    ${card(L("Mecánicos · pit stop", "Pit crew"), `<div class="rw">${ring(cr.spd, 100, statCol(cr.spd), 64, Math.round(cr.spd), L("velocidad", "speed"))}${ring(cr.cons, 100, statCol(cr.cons), 64, Math.round(cr.cons), L("constancia", "consistency"))}${ring(cr.mot, 100, statCol(cr.mot), 64, Math.round(cr.mot), L("moral", "morale"))}${ring(100 - cr.fat, 100, cr.fat > 50 ? "#ef6b5b" : "#f2c94c", 64, Math.round(cr.fat), L("fatiga", "fatigue"))}</div>
      ${crewHist()}
      <div class="sp-g k2"><button class="sp-btn gh" data-sa="tr" data-v="pit" ${wk ? "disabled" : ""}>${L("Práctica de paradas", "Pit stop practice")}<em>+${L("velocidad", "speed")} · +${L("fatiga", "fatigue")} · 0,2 M$</em></button><button class="sp-btn gh" data-sa="tr" data-v="rest" ${wk ? "disabled" : ""}>${L("Descanso", "Rest")}<em>−${L("fatiga", "fatigue")} · +${L("motivación", "motivation")}</em></button></div>
      <p class="sp-s">${sd ? `${sName(sd)} (${L("director deportivo", "sporting director")}, ${L("paradas", "pit stops")} ${sd.a.pit}) ${L("dirige el garaje.", "runs the garage.")} ` : ""}${L("Una acción de entrenamiento por semana.", "One training action a week.")}</p>`)}
    ${card(L("Pilotos", "Drivers"), sMyDrv().filter(Boolean).map(p => `<div class="dr">${ppImg(p.id, 48)}<div><b>${sName(p)}</b>${svgGauge(p.mot, 100, statCol(p.mot), "", L("motivación", "motivation"))}</div></div>`).join("") +
      `<div class="sp-g k2"><button class="sp-btn gh" data-sa="tr" data-v="fit" ${wk ? "disabled" : ""}>${L("Preparación física", "Physical training")}<em>+${L("motivación", "motivation")} · 0,15 M$</em></button><button class="sp-btn gh" data-sa="tr" data-v="sim" aria-pressed="${S.train.sim}">${L("Simulador antes de cada GP", "Simulator before each GP")}<em>${S.train.sim ? L("activado", "on") : L("desactivado", "off")} · 0,4 M$ / GP</em></button></div>
      <p class="sp-s">${L("El simulador acerca el reglaje inicial al bueno antes de los libres.", "The simulator brings the starting set-up closer before practice.")}</p>`)}</div>`;
};
// ---- trophies
function svgStack(o) {
  const w = o.w || 560, h = o.h || 200, L0 = 30, B0 = 22, T0 = 10, R0 = 8, n = o.x.length || 1, tot = o.x.map((_, i) => o.series.reduce((a, s) => a + (s.v[i] || 0), 0)), mx = Math.max(1, ...tot), bw = (w - L0 - R0) / n;
  const Y = v => h - B0 - v / mx * (h - T0 - B0);
  let s = `<svg class="ch stk" viewBox="0 0 ${w} ${h}" role="img" aria-label="${o.aria || ""}">`;
  [0, mx / 2, mx].forEach(v => { s += `<line x1="${L0}" x2="${w - R0}" y1="${Y(v)}" y2="${Y(v)}" stroke="${CH_GRID}"/><text x="${L0 - 5}" y="${Y(v) + 3}" text-anchor="end">${Math.round(v)}</text>`; });
  o.x.forEach((lb, i) => { let acc = 0; const x = L0 + i * bw + bw * .2;
    o.series.forEach((se, k) => { const v = se.v[i] || 0; if (!v) return; const y = Y(acc + v), hh = Y(acc) - y - (acc ? 2 : 0); s += `<rect class="an-bar" x="${x}" y="${y}" width="${bw * .6}" height="${Math.max(1, hh)}" rx="3" fill="${se.c}" style="--d:${i * .06 + k * .04}s;transform-origin:${x}px ${h - B0}px"><title>${se.n} · ${lb} · ${v}</title></rect>`; acc += v; });
    s += `<text x="${x + bw * .3}" y="${h - 6}" text-anchor="middle">${lb}</text>`; });
  return s + "</svg>";
}
SPAGE.trophy = () => {
  const t = S.team, T = TEAMS[t], rounds = S.stand.rounds, mine = rounds.flatMap(r => r.res.filter(x => x[1] === t).map(x => ({ r: r.r, code: x[0], pos: x[2], pts: x[3] })));
  const wins = mine.filter(x => x.pos === 1).length, pods = mine.filter(x => x.pos && x.pos <= 3).length, best = mine.filter(x => x.pos).reduce((a, x) => Math.min(a, x.pos), 99), me = sMyDrv().filter(Boolean);
  return sKick(L("Sala de trofeos", "Trophy room"), L("Temporada 2026", "2026 season")) + `<div class="tls">${tile(L("Victorias", "Wins"), cntTag(wins), "🏆")}${tile(L("Podios", "Podiums"), cntTag(pods))}${tile(L("Mejor resultado", "Best result"), `<b class="pz">${best < 99 ? "P" + best : "—"}</b>`)}${tile(L("Puntos", "Points"), cntTag(S.stand.t[t] || 0))}</div>`
    + (rounds.length ? card(L("Puntos por carrera", "Points per race"), svgStack({ w: 720, h: 220, x: rounds.map(r => "R" + r.r), series: me.map((p, i) => ({ n: sName(p), c: i ? "#5fb7ff" : T.col, v: rounds.map(r => { const x = r.res.find(y => y[0] === p.id); return x ? x[3] : 0; }) })) })
        + `<div class="lgd">${me.map((p, i) => `<i style="background:${i ? "#5fb7ff" : T.col}"></i>${sName(p)}`).join("")}</div>`)
      + card(L("Resultados del equipo", "Team results"), heat({ cols: rounds.map(r => "R" + r.r), rows: me.map(p => ({ lab: p.last, c: T.col, v: rounds.map(r => { const x = r.res.find(y => y[0] === p.id); return x ? x[2] : null; }) })), color: heatPos, fmt: v => v ? "P" + v : "DNF" }))
      : card("", `<p class="sp-s">${L("Aún no se ha corrido ninguna carrera.", "No races run yet.")}</p>`));
};

