// ---------- driver panels ----------
const CHEV = { agg: [3, "#ff2a3c"], bal: [2, "#ffa21f"], soft: [1, "#22d38a"] };
function lapsToGo(c) {                                          // laps the fuel on board still has to cover
  if (!SES) return Math.max(0, RACE_LAPS - (c.lap - 1) - c.s / LAP_M);
  if (c.gar || !c.lt) return 0;
  const R = c.run, rest = 1 - Math.max(0, Math.min(1, c.s / LAP_M));
  return c.lt === "in" || !R ? rest : rest + R.left * (R.cool ? 2 : 1) + 1;     // this lap, the timed (and cool-down) laps left, the in-lap
}
const runFuel = prog => { const P = PROGS[prog]; return Math.min(FUEL_MAX, (2 + P.n + (P.cool ? P.n - 1 : 0)) * FUEL_BASE * 1.12 + 1.3); };
const ui = [0, 1].map(k => {
  const root = $("drv" + k);
  root.appendChild($("drvTpl").content.cloneNode(true));
  const q = sel => root.querySelector(sel), qa = sel => root.querySelectorAll(sel);
  qa("[data-tyre]").forEach(im => im.src = TYRE_URL[im.dataset.tyre]);
  const car = () => cars[k];
  qa(".pace button").forEach(b => {
    const [n, col] = CHEV[b.dataset.v]; let g = ""; const w = 7, tot = n * w + (n - 1) * 1.5, x0 = (26 - tot) / 2;
    for (let j = 0; j < n; j++) { const x = x0 + j * (w + 1.5); g += `<path d="M${x} 1 H${x + 3.5} L${x + w} 5.5 L${x + 3.5} 10 H${x} L${x + 3.5} 5.5 Z" fill="${col}"/>`; }
    b.querySelector("svg").innerHTML = g;
    b.onclick = () => { const ch = car().pace !== b.dataset.v; car().pace = b.dataset.v; ov("pace", b.dataset.v); sync(); if (ch) radioDecide(k, "pace", b.dataset.v); };
  });
  const ov = (f, v) => { const c = car(); if (SES && c) (c.ov || (c.ov = {}))[f] = v; };   // in a session: the call holds for the rest of the run
  const modes = q(".modes"), batt = q(".batt");
  batt.onclick = () => { const open = modes.hidden; closeAll(); modes.hidden = !open; batt.setAttribute("aria-expanded", open); };
  qa(".modes button").forEach(b => b.onclick = () => { const ch = car().ers !== b.dataset.v; car().ers = b.dataset.v; ov("ers", b.dataset.v); modes.hidden = true; batt.setAttribute("aria-expanded", false); sync(); if (ch) radioDecide(k, "ers", b.dataset.v); });
  const plate = q(".plate"), strip = q(".strip");
  const photo = q(".photo");
  function rename() { q(".n").textContent = DRIVERS[k].num; q(".c").style.background = DRIVERS[k].col; q(".nm").textContent = DRIVERS[k].name;
    const css = faceCss(DRIVERS[k].code, photo.offsetWidth || 34, photo.offsetHeight || 35); photo.style.cssText = css; photo.classList.toggle("pf", !!css); }
  photo.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="; rename();
  strip.onclick = () => { open(!plate.classList.contains("open")); focus = k; setFollow(true); };
  function open(on) { plate.classList.toggle("open", on); strip.setAttribute("aria-expanded", on); }
  qa("[data-mix]").forEach(b => b.onclick = () => { const ch = car().mix !== b.dataset.mix; car().mix = b.dataset.mix; ov("mix", b.dataset.mix); sync(); if (ch) radioDecide(k, "mix", b.dataset.mix); });
  const box = q(".box"), cmpRow = q(".cmpRow");
  box.onclick = () => {
    const c = car(); if (c.done) return;
    if (SES) { callIn(k); syncPit(); return; }                 // practice / qualifying: back to the garage at the end of the lap
    if (c.pitReq) { c.pitReq = false; syncPit(); radioDecide(k, "box", false); return; } cmpRow.hidden = !cmpRow.hidden;
  };
  qa(".cmpRow button").forEach(b => b.onclick = () => { const c = car(), was = c.pitReq; c.nextComp = b.dataset.c; c.pitReq = true; cmpRow.hidden = true; syncPit(); if (!was) radioDecide(k, "box", true); });
  function syncPit() { const c = car(); box.classList.toggle("armed", c.pitReq); box.textContent = c.pitReq ? (SES ? "BOX ✓" : `BOX ${c.nextComp}`) : "BOX"; }
  function sync() {
    const c = car();
    qa(".pace button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === c.pace));
    qa(".modes button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === c.ers));
    qa("[data-mix]").forEach(b => b.setAttribute("aria-pressed", b.dataset.mix === c.mix));
    q(".em").textContent = ERS[c.ers].sig; q(".em").style.color = c.ers === "charge" ? "var(--green)" : "var(--blue)";
    syncPit();
  }
  const el = { fill: q(".fill"), pc: q(".pc"), fd: q(".fd"), fb: q(".fb"), tl: q(".tl"), tb: q(".tb"), cmpb: q(".cmpb"), cl: q(".cl"), ps: q(".ps") };
  function update() {
    const c = car(), bf = c.batt / BATT_MAX;
    el.fill.style.width = `calc(${(bf * 100).toFixed(1)}% - 4px)`;
    el.pc.textContent = Math.round(bf * 100);
    batt.classList.toggle("charging", c.harvest > 0 && c.deploy === 0);
    const W = SES && WK ? WK.car[k] : null, parked = !!(W && c.gar && c.gar.ph === "park");
    if (parked) {                                               // in the garage: the fuel and the tyre set of the next run
      const prog = SES.def.kind === "q" && !PROGS[W.plan.prog].q ? "q1" : W.plan.prog, si = W.plan.set >= 0 ? W.plan.set : autoSet(W, prog), set = si >= 0 ? W.sets[si] : null, f = runFuel(prog);
      el.fd.textContent = f.toFixed(1).replace(".", ",") + " kg"; el.fd.className = "mono fd";
      el.fb.style.width = (f / FUEL_MAX * 100) + "%"; el.fb.style.background = "var(--blue)";
      const sc = set ? set.c : c.comp, sw = set ? Math.max(...set.w) : 0;
      el.tl.textContent = Math.round((1 - sw) * 100) + "%"; el.tb.style.width = ((1 - sw) * 100) + "%"; el.tb.style.background = "var(--white)";
      if (el.cmpb.dataset.c !== sc) { el.cmpb.src = TYRE_URL[sc]; el.cmpb.dataset.c = sc; } el.cl.textContent = sc + "·" + (set ? set.l : 0) + "v"; el.cl.style.color = "";
    } else {
      const rem = lapsToGo(c);
      const per = FUEL_BASE * MIX[c.mix].fuel * PACE[c.pace].fuel, dl = c.done ? 0 : c.fuel / per - rem, ok = dl >= 0;
      el.fd.textContent = (ok ? "+" : "−") + Math.abs(dl).toFixed(1) + " v"; el.fd.className = "mono fd " + (ok ? "pos" : "neg");
      el.fb.style.width = (c.fuel / FUEL_MAX * 100) + "%"; el.fb.style.background = ok ? "var(--green)" : "var(--red)";
      const worst = Math.max(...c.wear), life = 1 - worst;
      el.tl.textContent = Math.round(life * 100) + "%";
      el.tb.style.width = (life * 100) + "%"; el.tb.style.background = worst < 0.6 ? "var(--white)" : worst < 0.75 ? "var(--amber)" : "var(--red)";
      if (el.cmpb.dataset.c !== c.comp) { el.cmpb.src = TYRE_URL[c.comp]; el.cmpb.dataset.c = c.comp; } el.cl.textContent = c.punct ? "PINCHAZO" : c.comp + "·" + c.tyreLaps + "v"; el.cl.style.color = c.punct ? "var(--red)" : "";
    }
    if (SES) {
      const pos = c.elim ? c.elimPos : sesOrder().filter(x => !x.elim).indexOf(c) + 1;
      el.ps.textContent = c.elim ? "ELIM" : c.out || c.dnf ? "OUT" : c.sbest != null ? "P" + pos : "—";
    } else {
      if (sesMode) leaveSes();
      const pos = [...cars].sort((a, b) => progress(b) - progress(a)).indexOf(c) + 1;
      el.ps.textContent = c.dnf ? "DNF" : c.pit ? "PIT" : c.inc ? "!" : "P" + pos;
    }
  }
  // ---- practice and qualifying: a status line, and in the garage the set-up, the tyres and the run, and the button to go out
  const sx = { st: q(".sesst"), tx: q(".sesst .tx"), bt: q(".sesst .sbt"), gar: q(".garctl"), ctl: q(".ctl"), gset: q(".gset"), gprog: q(".gprog"), gsetup: q(".gsetup"), ggo: q(".ggo"), pace: q(".pace"), batt: q(".battwrap") };
  let sesMode = false, wasParked = null, garKey = "", stKey = "", callKey = "";
  sx.gset.onclick = () => { if (SES) cardClick(k, "set", sx.gset); };
  sx.gprog.onclick = () => { if (SES) cardClick(k, "prog", sx.gprog); };
  sx.gsetup.onclick = () => { if (WK) openSetup(k); };
  sx.ggo.onclick = () => { if (SES) { sendOut(k); garKey = ""; ses(); } };
  function leaveSes() { sesMode = false; wasParked = null; sx.st.hidden = true; sx.gar.hidden = true; sx.ctl.hidden = false; sx.pace.hidden = sx.batt.hidden = false; }
  function ses() {
    const c = car(), W = WK && WK.car[k]; if (!SES || !c || !W) return;
    if (!sesMode) { sesMode = true; cmpRow.hidden = true; sx.st.hidden = false; garKey = stKey = callKey = ""; }
    const parked = !!(c.gar && c.gar.ph === "park"), back = !!c.gar || !!(c.pit && c.toGar);
    if (parked && wasParked === false) open(true);              // back in the garage: the panel opens on the set-up options
    else if (!parked && wasParked) open(false);                 // out of the garage: the compact race panel again
    wasParked = parked;
    const still = !!(c.gar && c.gar.ph !== "exit");             // engine off in the garage: no pace or ERS to choose
    if (sx.pace.hidden !== still) { sx.pace.hidden = still; sx.batt.hidden = still; if (still) closeAll(); }
    const [st, cls] = carStatus(c), sk = cls + "|" + st;
    if (sk !== stKey) { stKey = sk; sx.st.className = "sesst " + cls; sx.tx.textContent = st; }
    const bt = c.sbest != null ? fmt(c.sbest) : ""; if (sx.bt.textContent !== bt) sx.bt.textContent = bt;
    sx.ctl.hidden = back; sx.gar.hidden = !back;
    if (back) {
      const prog = SES.def.kind === "q" && !PROGS[W.plan.prog].q ? "q1" : W.plan.prog, si = W.plan.set >= 0 ? W.plan.set : autoSet(W, prog), set = si >= 0 ? W.sets[si] : null;
      const pend = W.pend.some((v, j) => Math.abs(v - W.p[j]) > 1e-4), can = parked && !c.elim && !c.out && !SES.over && !SES.flag;
      const gk = [si, W.plan.set, prog, pend, can, !!c.goReq, set ? set.l : -1].join("|");
      if (gk !== garKey) {
        garKey = gk;
        sx.gset.innerHTML = set ? `${tyreImg(set.c, "sm")}<span>${set.l ? set.l + "v" : "N"}</span>` : "—";
        sx.gset.title = set ? `${COMP[set.c].name} · ${set.l ? set.l + " vueltas" : "nuevo"}${W.plan.set < 0 ? " · elige el ingeniero" : ""}` : "";
        sx.gprog.textContent = PROGS[prog].short;
        sx.gset.disabled = sx.gprog.disabled = !can;
        sx.gsetup.innerHTML = "⚙ Reglajes" + (pend ? '<i class="pd" title="Cambios sin aplicar"></i>' : "");
        sx.ggo.disabled = !can; sx.ggo.classList.toggle("armed", !!c.goReq); sx.ggo.textContent = c.goReq ? "Cancelar" : "Salir ▶";
      }
    }
    const ck = c.pace + c.mix + c.ers + c.pitReq; if (ck !== callKey) { callKey = ck; sync(); }
  }
  return { sync, syncPit, update, ses, open, rename, closeModes: () => { modes.hidden = true; batt.setAttribute("aria-expanded", false); cmpRow.hidden = true; } };
});
function closeAll() { ui.forEach(u => u.closeModes()); }

// ---------- race board ----------
const BOARD_FIELDS = [["gap", "Intervalo"], ["stops", "Paradas"], ["tyre", "Neumático"], ["wear", "Desgaste"]];
let boardField = 0;
function gapToLeader(c, lead) {
  const dp = progress(lead) - progress(c);
  if (dp >= LAP_M) return "+" + Math.floor(dp / LAP_M) + " V";
  const m = Math.floor((progress(c) + 100) / 10), t = lead.hist[m];
  return t == null ? "—" : "+" + Math.max(0, c.total - t).toFixed(3);
}
function updateBoard() {
  { const key = WXC.s + "|" + Math.round(WATER.W * 10); const el = $("wxi"); if (el.dataset.k !== key) { el.dataset.k = key; el.innerHTML = wxIcon(WXC.s, 14); el.title = `${WXC.sky} · agua en pista ${Math.round(WATER.W * 100)} %`; } }
  if (SES) { sesBoard(); return; }
  $("bLap").previousSibling.textContent = "VUELTA ";
  $("bSC").disabled = SC.state !== "parked" || cars.every(c => c.done);
  const fs = flagState(); $("ses").textContent = fs === "sc" ? "SAFETY CAR" : fs === "yellow" ? "AMARILLA" : fs === "red" ? "BANDERA ROJA" : "RACE";
  $("ses").parentElement.classList.toggle("sc", fs === "sc" || fs === "yellow"); $("ses").parentElement.classList.toggle("red", fs === "red");
  $("bLap").textContent = `${Math.min(RACE_LAPS, Math.max(1, ...cars.map(c => c.lap)))}/${RACE_LAPS}`;
  const order = [...cars].sort((a, b) => (a.dnf - b.dnf) || (progress(b) - progress(a)));
  const f = BOARD_FIELDS[boardField][0];
  const key = order.map(c => c.idx).join(",") + "|" + focus;
  const rowsEl = $("rows");
  if (rowsEl.dataset.key !== key) {
    rowsEl.dataset.key = key;
    requestAnimationFrame(fitBoard);
    rowsEl.innerHTML = order.map((c, k) => `<button class="brow2${c.idx === focus ? " me" : ""}" data-i="${c.idx}"><span class="p">${k + 1}</span><span class="t" style="background:${c.col}"></span><span class="c">${c.code}</span><span class="d"></span></button>`).join("");
  }
  order.forEach((c, k) => {
    let d;
    if (c.dnf) d = "DNF";
    else if (c.pit) d = '<span class="pit">PIT</span>';
    else if (f === "gap") d = k === 0 ? "Líder" : gapToLeader(c, order[0]);
    else if (f === "stops") d = c.stops + (c.lastStop ? ` · ${c.lastStop.toFixed(1)}s` : "");
    else if (f === "tyre") d = `<img src="${TYRE_URL[c.comp]}" alt="">${c.tyreLaps}v`;
    else d = Math.round(Math.max(...c.wear) * 100) + "%";
    const cell = rowsEl.children[k].querySelector(".d"), html = String(d);
    if (cell.innerHTML !== html) cell.innerHTML = html;
  });
}
// the board ends just above Alonso's panel: it shrinks while the driver panel slides up and grows back when it closes
function fitBoard() {
  const anc = SES && !$("sd0").hidden ? $("sd0") : $("drv0"), r = $("rows"), lim = anc.getBoundingClientRect().top - 8, top = r.getBoundingClientRect().top;
  const rowH = (r.firstElementChild && r.firstElementChild.offsetHeight) || 20;
  r.style.maxHeight = Math.max(2, Math.floor((lim - top) / rowH)) * rowH + "px";        // whole rows only
  if (SES || !$("drv0").querySelector(".plate").classList.contains("open")) { r.scrollTop = 0; return; }   // panel closed: leader on top
  const me = r.querySelector(".me"); if (me) { const a = me.offsetTop, b = a + me.offsetHeight; if (a < r.scrollTop) r.scrollTop = a; else if (b > r.scrollTop + r.clientHeight) r.scrollTop = b - r.clientHeight; }
}
if (window.ResizeObserver) new ResizeObserver(fitBoard).observe($("drv0"));
addEventListener("resize", fitBoard);
$("rows").onclick = e => { const b = e.target.closest("[data-i]"); if (!b) return; focus = +b.dataset.i; setFollow(true); updateBoard(); };
$("selPrev").onclick = () => { boardField = (boardField + BOARD_FIELDS.length - 1) % BOARD_FIELDS.length; $("selName").textContent = BOARD_FIELDS[boardField][1]; updateBoard(); };
$("selNext").onclick = () => { boardField = (boardField + 1) % BOARD_FIELDS.length; $("selName").textContent = BOARD_FIELDS[boardField][1]; updateBoard(); };

// ---------- top HUD (followed car) ----------
let hudTick = 0;
function updateHud(p) {
  const c = cars[focus];
  const kmh = c.done ? 0 : c.vNow * 3.6;
  $("kmh").textContent = Math.round(kmh);
  $("gear").textContent = gearFor(kmh);
  $("cur").textContent = SES && (c.gar || !c.lt) ? fmt(null) : fmt(c.lapT);
  const fl = $("ersflag");
  fl.textContent = c.deploy > 0 ? `ERS ▲ ${c.deploy} kW` : c.harvest > 0 ? `Carga ▼ ${Math.round(c.harvest)} kW` : "";
  fl.style.color = c.deploy > 0 ? "var(--blue)" : "var(--green)";
  const pf = $("pitflag"), pc = cars.find(x => !x.ai && (x.pit || x.pitReq));
  if (pc) { pf.hidden = false; pf.textContent = pc.pit ? (pc.pit.stopT > 0 ? `${pc.code} parada · ${(pc.pit.stopEl || 0).toFixed(1)} s` : `${pc.code} pit lane · ${Math.round(pc.vNow * 3.6)} km/h`) : `${pc.code} box esta vuelta · ${pc.nextComp}`; }
  else pf.hidden = true;
  if ((hudTick++ & 3) !== 0) return;
  $("fcol").style.background = c.col;
  $("lap").textContent = SES ? (c.gar ? (c.gar.ph === "park" ? "GARAJE" : "BOXES") : c.pit ? "PIT LANE" : ({ out: "SALIDA", push: "RÁPIDA", run: "TANDA", cool: "ENFRÍA", in: "ENTRADA" }[c.lt] || "")) : `V ${Math.max(1, c.lap)}/${RACE_LAPS}`;
  $("last").textContent = fmt(SES ? c.slast : c.last);
  $("best").textContent = fmt(SES ? c.sbest : c.best);
  [...$("secs").children].forEach((el, k) => {
    const cur = c.secs && c.secs[k], v = cur || (c.prevSecs && c.prevSecs[k]);
    el.className = (v ? v.st + (cur ? "" : " old") : "") + (c.started && !c.done && c.secK === k ? " on" : "");
    el.title = v ? `S${k + 1} · ${v.t.toFixed(3)} s` : "";
  });
  $("sector").textContent = c.gar ? "Garaje" : c.pit ? (c.pit.stopT > 0 ? "Parada" : c.pit.d > PIT.limStart && c.pit.d < PIT.limEnd ? "Pit lane · 80" : "Pit lane") : sectorName(c.s, p.x, p.y);
  ui.forEach(u => u.update());
  updateBoard();
  if (SES) sesHud();
}

// ---------- messages / new race ----------
const LAP_OPTS = [10, 20, 33, 66];
function showMsg(t, p, withNew) {
  $("msgT").textContent = t; $("msgP").textContent = p;
  const row = $("msgRow"); row.innerHTML = "";
  if (withNew) { const a = document.createElement("button"); a.textContent = "Nueva carrera"; a.onclick = showChooser; row.append(a); }
  const b = document.createElement("button"); b.textContent = "Cerrar"; b.onclick = () => $("msg").hidden = true; row.append(b);
  $("msg").hidden = false;
}
function showChooser() { showCircuitMenu(); }
// ---------- the team you run: its two cars become cars 0 and 1 (the driver panels, the garage, the set-up) ----------
function setPlayerTeam(team) {
  DRIVERS.forEach((d, k) => { if (d.o == null) d.o = k; });
  if (DRIVERS[0].team !== team) {
    const ord = [...DRIVERS].sort((a, b) => ((b.team === team) - (a.team === team)) || a.o - b.o);
    DRIVERS.splice(0, DRIVERS.length, ...ord);
  }
  DRIVERS.forEach((d, k) => { d.ai = k > 1; d.slot = k; });
  LIVERY.fill(null); REFL.fill(null); for (const k in GREY) delete GREY[k];
  if (carSheet.complete && carSheet.naturalWidth) carSheet.onload();
  if (typeof GARV !== "undefined") { GARV.fx = []; }
  if (typeof PERF !== "undefined") PERF.key = "";
  if (SES) sesClose();
  WK = null; PLANS[0] = PLANS[1] = RECS[0] = RECS[1] = null; focus = 0; PW.car = 0;
  cars = DRIVERS.map(newCar);
  ui.forEach(u => u.rename());
  mnTeamChip();
}
function mnTeamChip() { const e = $("mnTeam"), t = DRIVERS[0].team; if (!e) return; e.style.setProperty("--tc", TEAMS[t].col); e.innerHTML = `${teamLogo(t, "")}<b>${TEAMS[t].full}</b>`; }
function showChooserOld() {
  $("msgT").textContent = "Nueva carrera"; $("msgP").textContent = "Elige el número de vueltas";
  const row = $("msgRow"); row.innerHTML = "";
  LAP_OPTS.forEach(n => { const b = document.createElement("button"); b.textContent = n + " v"; if (n === RACE_LAPS) b.style.borderColor = "var(--accent)"; b.onclick = () => { RACE_LAPS = n; newRace(); $("msg").hidden = true; ui.forEach(u => u.sync()); }; row.append(b); });
  const x = document.createElement("button"); x.textContent = "✕"; x.setAttribute("aria-label", "Cancelar"); x.onclick = () => $("msg").hidden = true; row.append(x);
  $("msg").hidden = false;
}
$("bRestart").onclick = () => { if (SES) sesClose(); WK = null; menuShow(null); showFront("main"); };
ui.forEach(u => u.sync());

// ---------- camera ----------
function setFollow(on) { follow = on; $("bFollow").setAttribute("aria-pressed", on); }
function zoomAt(f, sx, sy) {
  if (PITCAM.z0 != null) { PITCAM.z0 = null; PITCAM.user = true; }
  const before = screenToMap(sx, sy); cam.zoom = clampZoom(cam.zoom * f); const after = screenToMap(sx, sy);
  if (!follow) { cam.x += before.x - after.x; cam.y += before.y - after.y; }
}
$("bFollow").onclick = () => { if (follow) focus = focus === 0 ? 1 : 0; setFollow(true); };
$("bRot").onclick = () => { autoRot = !autoRot; $("bRot").setAttribute("aria-pressed", autoRot); if (autoRot) setFollow(true); };
$("bZoomIn").onclick = () => zoomAt(1.4, VW / 2, VH / 2);
$("bZoomOut").onclick = () => zoomAt(1 / 1.4, VW / 2, VH / 2);
$("bAll").onclick = () => { setFollow(false); autoRot = false; $("bRot").setAttribute("aria-pressed", false); cam.x = MAP_W / 2; cam.y = MAP_H / 2; cam.rot = 0; cam.zoom = 0; clampCam(); };
$("bLine").onclick = () => { showLines = !showLines; $("bLine").setAttribute("aria-pressed", showLines); };
$("bLimits").onclick = () => { showLimits = !showLimits; $("bLimits").setAttribute("aria-pressed", showLimits); };
$("bSC").onclick = () => { if (SC.state === "parked" && !cars.every(c => c.done)) deploySC(); };
function togglePause() { paused = !paused; $("bPause").textContent = paused ? "▶" : "❚❚"; $("bPause").setAttribute("aria-label", paused ? "Reanudar" : "Pausa"); pwCtlSync(); }
$("bPause").onclick = togglePause;
$("bSpeed").onclick = () => {
  if (!SES) { setSpeed((speedIdx + 1) % SPEEDS.length); return; }
  SES.spd = (SES.spd + 1) % SES_SPD.length; if (paused) togglePause(); sesHud(); pwCtlSync();     // the session has its own speeds
};
$("bSes").onclick = () => {
  if (!SES) return;
  const b = $("bSes");
  if (SES.over) { showSesResults(SES.id); return; }
  return;
  if (!b.classList.contains("armed")) {                         // two taps: it ends the session
    b.classList.add("armed"); toast("Pulsa ⏭ otra vez para simular el resto de la sesión", false);
    clearTimeout(b.h); b.h = setTimeout(() => b.classList.remove("armed"), 3000); return;
  }
  b.classList.remove("armed"); simRest();
};

const pointers = new Map();
cv.addEventListener("wheel", e => { e.preventDefault(); if (e.shiftKey) { cam.rot += e.deltaY * 0.003; return; } zoomAt(Math.exp(-e.deltaY * 0.0015), e.offsetX, e.offsetY); }, { passive: false });
cv.addEventListener("contextmenu", e => e.preventDefault());
cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY }); cv.classList.add("drag"); closeAll(); });
cv.addEventListener("pointermove", e => {
  if (!pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId), cur = { x: e.offsetX, y: e.offsetY };
  if (pointers.size === 1) {
    const dx = cur.x - prev.x, dy = cur.y - prev.y;
    if (e.shiftKey || e.buttons === 2) cam.rot += dx * 0.006;
    else {
      if (follow && Math.hypot(dx, dy) > 2) setFollow(false);
      if (!follow) { const c = Math.cos(cam.rot), s = Math.sin(cam.rot); cam.x -= (dx * c - dy * s) / cam.zoom; cam.y -= (dx * s + dy * c) / cam.zoom; }
    }
  } else if (pointers.size === 2) {
    const ids = [...pointers.keys()], other = pointers.get(ids[0] === e.pointerId ? ids[1] : ids[0]);
    const d0 = Math.hypot(prev.x - other.x, prev.y - other.y), d1 = Math.hypot(cur.x - other.x, cur.y - other.y);
    const a0 = Math.atan2(prev.y - other.y, prev.x - other.x), a1 = Math.atan2(cur.y - other.y, cur.x - other.x);
    if (d0 > 0) zoomAt(d1 / d0, (cur.x + other.x) / 2, (cur.y + other.y) / 2);
    if (!autoRot) cam.rot -= Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0));
  }
  pointers.set(e.pointerId, cur);
});
const endP = e => { pointers.delete(e.pointerId); if (!pointers.size) cv.classList.remove("drag"); };
cv.addEventListener("pointerup", endP); cv.addEventListener("pointercancel", endP);
addEventListener("keydown", e => {
  if (e.key === "q" || e.key === "Q") cam.rot -= 0.1;
  else if (e.key === "e" || e.key === "E") cam.rot += 0.1;
  else if (e.key === "+" || e.key === "=") zoomAt(1.25, VW / 2, VH / 2);
  else if (e.key === "-") zoomAt(0.8, VW / 2, VH / 2);
  else if (e.key === " ") { e.preventDefault(); togglePause(); }
  else if (e.key === "Escape" && PW.fs) mapFs(false);
});

// ---------- PIT WALL: full-screen engineer screens (RACE / CAR) ----------
const PW = { open: false, tab: "race", car: 0, tTxt: 0, tCar: 0, tStr: 0, carDrawn: -1, mapKey: "", track: null, pit: null };
const TEL_BIN = (() => { const a = new Int8Array(TR_N); for (let b = 0; b < TR_N; b++) { const i = idxAt(b * TR_STEP); a[b] = accel[i] < -1 ? -1 : (accel[i] > 0.3 || RL.v[i] > VMAX * 0.97) ? 1 : 0; } return a; })();
const MAPN = (() => {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, ar = 0;
  for (let i = 0; i < N; i++) { const x = RL.x[i], y = RL.y[i], j = (i + 1) % N; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); ar += x * RL.y[j] - RL.x[j] * y; }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; let rad = 0;
  for (let i = 0; i < N; i++) rad = Math.max(rad, Math.hypot(RL.x[i] - cx, RL.y[i] - cy));
  return { cx, cy, rad, dir: ar > 0 ? 1 : -1, a0: Math.atan2(RL.y[0] - cy, RL.x[0] - cx) };
})();
const C_BLUE = [47, 107, 255], C_CYAN = [47, 200, 255], C_GREEN = [34, 211, 138], C_YEL = [255, 210, 31], C_RED = [255, 42, 60];
function ramp(stops, t) {
  if (t <= stops[0][0]) return `rgb(${stops[0][1]})`;
  for (let k = 1; k < stops.length; k++) if (t <= stops[k][0]) {
    const [a, ca] = stops[k - 1], [b, cb] = stops[k], u = (t - a) / (b - a);
    return `rgb(${ca.map((v, j) => Math.round(v + (cb[j] - v) * u))})`;
  }
  return `rgb(${stops[stops.length - 1][1]})`;
}
const tyreCol = (c, t) => { const [lo, hi] = TWIN[c.comp]; return ramp([[lo - 30, C_BLUE], [lo - 8, C_CYAN], [(lo + hi) / 2, C_GREEN], [hi + 6, C_YEL], [hi + 22, C_RED]], t); };
const brakeCol = t => ramp([[150, C_BLUE], [330, C_CYAN], [560, C_GREEN], [880, C_YEL], [1080, C_RED]], t);
const textOn = hex => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? "#0d1014" : "#ffffff"; };
const COMPASS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
const raceOrder = () => SES ? sesOrder() : [...cars].sort((a, b) => (a.dnf - b.dnf) || (progress(b) - progress(a)));
const lapsRun = c => c.fin ? c.finLaps : Math.max(0, c.lap - 1 + c.s / LAP_M);
const MONO = '"IBM Plex Mono",ui-monospace,Menlo,monospace', DISP = '"Saira Semi Condensed","Arial Narrow",sans-serif';
var FL = null;                                    // fastest lap of the race
function cvFit(cv) {
  const r = cv.parentElement.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(10, Math.floor(r.width)), h = Math.max(10, Math.floor(r.height));
  if (cv.width !== w * d || cv.height !== h * d) { cv.width = w * d; cv.height = h * d; cv.style.width = w + "px"; cv.style.height = h + "px"; }
  const g = cv.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
  return { g, w, h };
}
function pwOpen(on) {
  PW.open = on; $("pw").hidden = !on; $("bPW").setAttribute("aria-pressed", on);
  if (!on && PW.fs) { PW.fs = false; PW.fsAuto = false; PW.fsPrev = null; $("pw").classList.remove("fsmap"); }
  pwCtlSync();
  if (on) { closeAll(); document.querySelector('.pwtabs [data-tab="race"]').textContent = SES ? "SESIÓN" : "RACE"; PW.car = cars[focus] && !cars[focus].ai ? focus : PW.car && !cars[PW.car].ai ? PW.car : 0; pwBuildSel(); pwFrame(0, true); }
}
function pwTab(t) {
  PW.tab = t;
  document.querySelectorAll(".pwtabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  $("pwRace").hidden = t !== "race"; $("pwCar").hidden = t !== "car";
  pwFrame(0, true);
}
function pwPick(k) { focus = k; setFollow(true); if (!cars[k].ai) PW.car = k; pwBuildSel(); pwFrame(0, true); }
$("bPW").onclick = () => pwOpen(!PW.open);
$("pwClose").onclick = () => pwOpen(false);
// ---- time bar: play / pause and the race speed, the same controls as the race screen
const PW_ICON = {
  pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3.2" height="11" rx="1" fill="currentColor"/><rect x="9.3" y="2.5" width="3.2" height="11" rx="1" fill="currentColor"/></svg>',
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.6v10.8a.6.6 0 0 0 .9.5l8.4-5.4a.6.6 0 0 0 0-1L5.4 2.1a.6.6 0 0 0-.9.5z" fill="currentColor"/></svg>',
  fs: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/></svg>',
  unfs: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 2.5V6H2.5M13.5 6H10V2.5M10 13.5V10h3.5M2.5 10H6v3.5"/></svg>'
};
function pwCtlSync() {
  const pl = $("pwPlay"); if (!pl) return;
  pl.innerHTML = paused ? PW_ICON.play : PW_ICON.pause; pl.classList.toggle("paused", paused); pl.setAttribute("aria-label", paused ? "Reanudar" : "Pausa");
  const spd = SES ? SES_SPD : SPEEDS, cur = SES ? SES.spd : speedIdx;       // a session has its own speeds
  document.querySelectorAll("#pwSpd button").forEach(b => { const t = "×" + spd[+b.dataset.k]; if (b.textContent !== t) b.textContent = t; b.setAttribute("aria-pressed", +b.dataset.k === cur); b.title = !SES && b.dataset.k === "3" ? "×12 · mapa a pantalla completa" : ""; });
  const fs = $("pwFs"); fs.innerHTML = PW.fs ? PW_ICON.unfs : PW_ICON.fs; fs.setAttribute("aria-pressed", !!PW.fs);
  fs.setAttribute("aria-label", PW.fs ? "Salir de pantalla completa" : "Mapa a pantalla completa"); fs.title = fs.getAttribute("aria-label");
}
function pwClock() {
  const o = raceOrder(), lead = o[0], lap = Math.min(RACE_LAPS, Math.max(1, ...cars.map(c => c.lap)));
  const html = SES ? `<span><i>${SES.def.name} · quedan </i><b><u>${SES.def.id} </u>${SES.over ? "FIN" : SES.flag ? "🏁" : fmtMS(SES.def.dur - SES.t)}</b></span><span><i>${paused ? "En pausa · " : ""}en pista </i><b><u>Pista </u>${cars.filter(c => !c.gar && !c.done && !c.elim).length}</b></span>` : `<span><i>Vuelta </i><b><u>V </u>${lap}/${RACE_LAPS}</b></span><span><i>${paused ? "En pausa" : "Tiempo"} </i><b>${fmtH(lead ? lead.total : 0)}</b></span>`;
  const el = $("pwClock"); if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
}
// the fastest speed is followed on the big map: it fills the screen, and goes back to where you were when you slow down
function setSpeed(k) {
  const top = SPEEDS.length - 1, prev = speedIdx;
  speedIdx = k; $("bSpeed").textContent = "×" + SPEEDS[k];
  if (k === top && prev !== top) mapFs(true, true);
  else if (prev === top && k !== top && PW.fs && PW.fsAuto) mapFs(false);
  pwCtlSync();
}
function mapFs(on, auto) {
  if (on) {
    if (!PW.fs) PW.fsPrev = { open: PW.open, tab: PW.tab };
    if (!PW.open) pwOpen(true);
    if (PW.tab !== "race") pwTab("race");
    PW.fs = true; PW.fsAuto = !!auto;
  } else {
    const p = PW.fsPrev, back = PW.fsAuto && p; PW.fs = false; PW.fsAuto = false; PW.fsPrev = null;
    if (back) { if (p.tab !== "race") pwTab(p.tab); if (!p.open) pwOpen(false); }
  }
  $("pw").classList.toggle("fsmap", PW.fs); PW.mapKey = ""; pwCtlSync();
  if (PW.open) pwFrame(0, true);
}
$("pwPlay").onclick = togglePause;
$("pwSpd").onclick = e => { const b = e.target.closest("[data-k]"); if (!b) return; if (SES) { SES.spd = +b.dataset.k; if (paused) togglePause(); sesHud(); pwCtlSync(); } else setSpeed(+b.dataset.k); };
$("pwFs").onclick = () => mapFs(!PW.fs, false);
pwCtlSync();
document.querySelectorAll(".pwtabs button").forEach(b => b.onclick = () => pwTab(b.dataset.tab));
$("pwTb").onclick = e => { const r = e.target.closest("[data-i]"); if (r) pwPick(+r.dataset.i); };
$("pwSel").onclick = e => { const b = e.target.closest("[data-i]"); if (b) pwPick(+b.dataset.i); };
addEventListener("keydown", e => {
  if (e.key === "Escape" && PW.open) pwOpen(false);
  else if ((e.key === "p" || e.key === "P") && !e.metaKey && !e.ctrlKey) pwOpen(!PW.open);
});
function pwBuildSel() {
  $("pwStrLg").innerHTML = ["S", "M", "H", "I", "W"].map(k => `<img src="${TYRE_URL[k]}" alt="" style="width:12px;height:12px;vertical-align:-2px;margin:0 3px 0 8px">${COMP[k].name}`).join("") + " · tenue = previsto";
  $("pwSel").innerHTML = DRIVERS.map((d, k) => d.ai ? "" : `<button data-i="${k}" aria-pressed="${k === PW.car}"><i style="background:${d.col}"></i>${d.num} ${d.name}</button>`).join("");
}
function pwFrame(dt, force) {
  if (!PW.open) return;
  const now = performance.now();
  if (force || now - PW.tTxt > 250) { PW.tTxt = now; pwHeader(); pwClock(); }
  if (PW.tab === "race") {
    pwMap();
    if (force || now - PW.tRace > 250 || !PW.tRace) { PW.tRace = now; if (SES) pwTrack(); pwWeather(); pwForecast(); pwTiming(); pwLapChart(); }
  } else {
    if (force || now - PW.tCar > 120) { PW.tCar = now; pwCarData(); pwTelemetry(); }
    if (!SES && (force || now - PW.tStr > 500)) { PW.tStr = now; pwStrategy(); }
  }
}
function pwHeader() {
  if (SES) {
    const fs = SES.red ? "red" : SES.flag ? "chk" : flagState() === "yellow" ? "yellow" : "";
    $("pwSub").innerHTML = `<span class="pwcirc">Montmeló · </span>${SES.def.long} · ${SES.over ? "final" : fmtMS(SES.def.dur - SES.t)}<span class="flg ${fs}">${{ red: "Roja", chk: "Cuadros", yellow: "Amarilla", "": "Verde" }[fs]}</span>`;
    return;
  }
  const o = raceOrder(), lead = o[0], fs = flagState();
  const lap = Math.min(RACE_LAPS, Math.max(1, ...cars.map(c => c.lap)));
  const fl = { green: "Verde", yellow: "Amarilla", sc: "Safety car", red: "Roja" }[fs] || "Verde";
  $("pwSub").innerHTML = `<span class="pwcirc">Montmeló · </span>V ${lap}/${RACE_LAPS} · ${fmtH(lead ? lead.total : 0)}<span class="flg ${fs}">${fl}</span>`;
}
// ---- RACE: weather
function pwWeather() {
  const W = WXC, laps = Math.max(0, ...cars.map(c => c.lap - 1)), grip = SES ? gripPct() : Math.min(100, 94.5 + laps * 0.11);
  let spark = "";
  if (WXH.length > 1) {
    const v = WXH.map(e => e[1]), lo = Math.min(...v) - 0.3, hi = Math.max(...v) + 0.3;
    spark = `<svg class="spk" viewBox="0 0 60 12" preserveAspectRatio="none"><polyline points="${v.map((x, k) => (k / (v.length - 1) * 60).toFixed(1) + "," + (11 - (x - lo) / (hi - lo) * 10).toFixed(1)).join(" ")}"/></svg>`;
  }
  const icon = wxIcon(W.s, 15);
  const arrow = `<svg class="ar" viewBox="0 0 12 12" aria-hidden="true" style="transform:rotate(${(W.dir + 180) % 360}deg)"><path d="M6 1l3.4 8.6L6 7.6 2.6 9.6z" fill="#2f9bff"/></svg>`;
  const cards = [
    ["Cielo", `${icon}${["Soleado", "Nublado", "Lluvia lig.", "Lluvia int."][W.s]}`, `${Math.round(W.cloud)} % nubes`, true],
    ["Aire", `${W.air.toFixed(1)}<small>°C</small>`, "a la sombra"],
    ["Pista", `${W.track.toFixed(1)}<small>°C</small>`, spark || "tendencia"],
    ["Humedad", `${Math.round(W.hum)}<small>%</small>`, "relativa"],
    ["Viento", `${W.wind.toFixed(1)}<small>m/s</small>`, `${arrow}${COMPASS[Math.round(W.dir / 45) % 8]} · ${Math.round(W.dir)}°`],
    ["Lluvia", `${(W.R * 15).toFixed(1)}<small>mm/h</small>`, `${W.rain} % · 30 min`],
    ["Agua en pista", WATER.W < 0.01 ? "Seca" : `${Math.round(WATER.W * 100)}<small>%</small>`, WATER.W < 0.01 ? "—" : `línea seca ${Math.round(WATER.dl * 100)} %`, WATER.W < 0.01],
    ["Agarre", `${(grip * (1 - 0.38 * lineWet())).toFixed(1)}<small>%</small>`, lineWet() > 0.13 ? (idealClass(lineWet()) === "I" ? "para intermedios" : "para neum. de lluvia") : "goma en pista"]
  ];
  $("pwWx").innerHTML = cards.map(([k, v, s, tx, cl]) => `<div class="wc${cl ? " " + cl : ""}"><span class="k">${k}</span><b${tx ? ' class="tx"' : ""}>${v}</b><span class="s">${s}</span></div>`).join("");
}
// ---- RACE: forecast for the next 30 minutes. The same water model as the lap-by-lap forecast of the strategists,
// run on from the water lying on the track right now, with the cars still racing clearing the dry line.
const PWFC = { t: -1e9, d: null, STEP: 30, N: 60 };              // one column every 30 s
function pwFcData() {
  const rt = simClock - WX_T0;
  if (PWFC.d && Math.abs(rt - PWFC.t) < 2) return PWFC.d;
  let traffic = 0; for (const c of cars) if (c.started && !c.done && !c.pit) traffic++;
  traffic = racing() && cars.length ? traffic / cars.length : 1;
  const out = { R: [], wl: [], s: [], wl0: lineWet(), s0: wxAt(rt).s };
  let W = WATER.W, dl = WATER.dl, t = rt;
  for (let k = 0; k < PWFC.N; k++) {
    let ar = 0, aw = 0, n = 0; const cnt = [0, 0, 0, 0];
    for (let e = 0; e < PWFC.STEP; e += 2) {
      const A = wxAt(t), R = A.R, sun = 1 - A.cloud / 100, warm = Math.max(0, 16 + 15 * sun - 9 * W - 12) / 25;
      const dry = (0.0018 + 0.004 * sun + 0.0008 * (3.1 + 2.2 * R) + 0.0016 * warm) * Math.max(0, 1 - R * 2.4);
      W = Math.max(0, Math.min(1, W + (R * (1 - W) / 70 - W * dry) * 2));
      dl = Math.max(0, Math.min(1, dl + ((W > 0.015 ? traffic * 0.012 : 0.03) * (1 - dl) - Math.min(1, R) * 0.02 * dl) * 2));
      ar += R; aw += W * (1 - dl); n++; cnt[A.s]++; t += 2;
    }
    out.R.push(ar / n); out.wl.push(aw / n); out.s.push(cnt.indexOf(Math.max(...cnt)));
  }
  PWFC.t = rt; PWFC.d = out; return out;
}
function pwForecast() {
  const cv = $("pwFc"); if (!cv || !cv.parentElement.offsetWidth) return;
  const fc = pwFcData(), { g, w, h } = cvFit(cv); if (w < 100) return;
  const n = PWFC.N, Lp = 44, Rp = 12, T = 26, B = 18, X = k => Lp + (w - Lp - Rp) * k / n, Y = v => T + (h - T - B) * (1 - Math.min(1, v));
  // sky strip, with an icon where the sky changes
  for (let k = 0; k < n; k++) { g.fillStyle = WX_STATES[fc.s[k]].col; g.globalAlpha = 0.9; g.fillRect(X(k), 4, X(k + 1) - X(k) + 0.5, 4); }
  g.globalAlpha = 1;
  let lastX = -99;
  for (let k = 0; k < n; k++) if (k === 0 || fc.s[k] !== fc.s[k - 1]) { const x = Math.max(X(k), lastX + 18); if (x > w - Rp - 12) break; const im = WXICON_IMG[fc.s[k]]; if (im.complete) g.drawImage(im, x, 10, 13, 13); lastX = x; }
  // every 5 minutes a faint guide
  g.fillStyle = "rgba(255,255,255,.05)"; for (let k = 10; k < n; k += 10) g.fillRect(Math.round(X(k)), T, 1, h - T - B);
  // what the water on the racing line calls for
  g.font = `800 7.5px ${DISP}`; g.textBaseline = "middle"; g.textAlign = "right";
  [[0, "SECO", "#a7b1be"], [0.13, "INTER", "#3fc94f"], [0.55, "LLUVIA", "#2f86ff"], [1, "", ""]].forEach(([v, t, col]) => {
    g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(Lp, Y(v), w - Lp - Rp, 1); if (t) { g.fillStyle = col; g.fillText(t, Lp - 5, Y(v) + (v === 0.13 ? -4 : v === 0 ? 3 : 0)); } });
  // rain (bars) and water left on the racing line (line)
  for (let k = 0; k < n; k++) {
    const r = Math.min(1, fc.R[k]); if (r < 0.02) continue;
    const gr = g.createLinearGradient(0, Y(r), 0, Y(0)); gr.addColorStop(0, "rgba(92,180,255,.75)"); gr.addColorStop(1, "rgba(47,107,255,.12)");
    g.fillStyle = gr; g.fillRect(X(k) + 0.5, Y(r), Math.max(1, X(k + 1) - X(k) - 1), Y(0) - Y(r));
  }
  g.beginPath(); g.moveTo(X(0), Y(fc.wl0)); for (let k = 0; k < n; k++) g.lineTo(X(k + 0.5), Y(fc.wl[k])); g.lineTo(X(n), Y(fc.wl[n - 1]));
  g.strokeStyle = "#eef1f5"; g.lineWidth = 2; g.lineJoin = "round"; g.stroke();
  g.fillStyle = "#eef1f5"; g.beginPath(); g.arc(X(0), Y(fc.wl0), 2.6, 0, Math.PI * 2); g.fill();     // now
  // minutes from now
  g.font = `600 8.5px ${MONO}`; g.fillStyle = "#a7b1be"; g.textBaseline = "middle";
  for (let m = 0; m <= 30; m += 5) { g.textAlign = m === 0 ? "left" : m === 30 ? "right" : "center"; g.fillText(m === 0 ? "AHORA" : "+" + m, X(m * 2), h - 8); }
  // legend
  g.textAlign = "left"; g.font = `800 7.5px ${DISP}`; g.fillStyle = "#5cb4ff"; g.fillRect(Lp + 6, T + 5, 6, 6); g.fillStyle = "#cfd6df"; g.fillText("LLUVIA", Lp + 15, T + 8.5);
  g.fillStyle = "#eef1f5"; g.fillRect(Lp + 56, T + 7.5, 10, 2); g.fillStyle = "#cfd6df"; g.fillText("AGUA EN LA TRAZADA", Lp + 70, T + 8.5);
  // header: how many laps that is, and what the track will call for at the end of it
  const lead = raceOrder()[0], lt = (lead && lead.last) || LAP_T0 * (1 + 0.12 * lineWet()), laps = Math.max(1, Math.round(1800 / lt));
  const cls = idealClass(fc.wl[n - 1]), need = cls === "D" ? "seco" : cls === "I" ? "intermedios" : "lluvia";
  const info = `≈ ${laps} vueltas` + (w > 560 ? ` · en 30 min: ${need}` : "");   // the phone header has room for the laps only
  if ($("pwFcInfo").textContent !== info) $("pwFcInfo").textContent = info;
}
// ---- RACE: timing table (in practice / qualifying: best laps, gaps to the best, laps run and where each car is)
const PW_HEAD = { r: null, s: '<tr><th class="dv">Piloto</th><th>Mejor</th><th>Gap</th><th>Última</th><th>S1</th><th>S2</th><th>S3</th><th>Neum.</th><th>Vueltas</th><th>Estado</th></tr>' };
function pwTiming() {
  const th = $("pwTb").previousElementSibling, m = SES ? "s" : "r";
  if (!PW_HEAD.r) PW_HEAD.r = th.innerHTML;
  if (th.dataset.m !== m) { th.dataset.m = m; th.innerHTML = PW_HEAD[m]; $("pwTimT").textContent = SES ? "Cronometraje · " + SES.def.name : "Cronometraje · carrera"; }
  if (SES) { pwTimingSes(); return; }
  const o = raceOrder(), lead = o[0];
  let fast = Infinity; cars.forEach(c => { if (c.best != null) fast = Math.min(fast, c.best); });
  const gapTxt = g => g.lap ? `+${g.lap} V` : g.s == null ? "—" : "+" + g.s.toFixed(3);
  const sec = (c, k) => { const v = (c.secs && c.secs[k]) || (c.prevSecs && c.prevSecs[k]); return v ? `<td class="${v.st}">${v.t.toFixed(3)}</td>` : '<td class="mu">—</td>'; };
  $("pwTb").innerHTML = o.map((c, k) => {
    const status = c.dnf ? '<span class="tg out">DNF</span>' : c.pit ? '<span class="tg">PIT</span>' : c.fin ? '<span class="tg out">FIN</span>' : null;
    const int = status || (k === 0 ? '<span class="mu">Líder</span>' : gapTxt(gapTo(c, o[k - 1])));
    const gap = k === 0 ? '<span class="mu">—</span>' : gapTxt(gapTo(c, lead));
    const lastC = c.last == null ? "mu" : c.last === fast ? "ob" : c.last === c.best ? "pb" : "";
    return `<tr data-i="${c.idx}" class="${c.idx === focus ? "me" : ""}${c.ai ? "" : " pl"}"><td class="dv"><em>${k + 1}</em><i style="background:${c.col}"></i><u>${c.num}</u><b>${c.code}</b></td>`
      + `<td>${int}</td><td>${gap}</td><td class="${lastC}">${fmt(c.last)}</td><td class="${c.best != null && c.best === fast ? "ob" : c.best == null ? "mu" : ""}">${fmt(c.best)}</td>`
      + sec(c, 0) + sec(c, 1) + sec(c, 2)
      + `<td><img class="tyc" src="${TYRE_URL[c.comp]}" alt="${COMP[c.comp].name}">${c.tyreLaps} v</td><td>${c.stops}</td><td>${c.vTop ? Math.round(c.vTop * 3.6) : "—"}</td></tr>`;
  }).join("");
  $("pwTimInfo").textContent = FL ? `V. rápida ${FL.code} ${fmt(FL.t)} · V${FL.lap}` : "Sin vueltas completas";
}
function pwTimingSes() {
  const o = sesOrder(), lead = o.find(c => !c.elim && c.sbest != null), fast = SES.fl ? SES.fl.t : null, cut = SES.def.cut;
  const sec = (c, k) => { const v = (c.secs && c.secs[k]) || (c.prevSecs && c.prevSecs[k]); return v ? `<td class="${v.st}">${v.t.toFixed(3)}</td>` : '<td class="mu">—</td>'; };
  let n = 0;
  $("pwTb").innerHTML = o.map(c => {
    const pos = c.elim ? c.elimPos : ++n, ko = cut && !c.elim && pos > cut;
    const best = c.sbest == null ? '<td class="mu">—</td>' : `<td class="${c.sbest === fast ? "ob" : ""}">${fmt(c.sbest)}</td>`;
    const gap = c.sbest == null || !lead || c === lead || c.elim ? '<td class="mu">—</td>' : `<td>+${(c.sbest - lead.sbest).toFixed(3)}</td>`;
    const last = c.slast == null ? '<td class="mu">—</td>' : `<td class="${c.slastInv ? "mu" : c.slast === fast ? "ob" : c.slast === c.sbest ? "pb" : ""}">${fmt(c.slast)}${c.slastInv ? " ✕" : ""}</td>`;
    const where = c.elim ? '<span class="tg out">ELIM</span>' : c.out || c.dnf ? '<span class="tg out">OUT</span>' : c.gar ? (c.gar.ph === "park" ? '<span class="tg out">GARAJE</span>' : '<span class="tg">PIT</span>')
      : c.pit ? '<span class="tg">PIT</span>' : `<span class="${c.lt === "push" ? "ob" : c.lt === "run" ? "pb" : "mu"}">${{ out: "Salida", push: "Rápida", run: "Tanda", cool: "Enfría", in: "Entrada" }[c.lt] || "Pista"}</span>`;
    return `<tr data-i="${c.idx}" class="${c.idx === focus ? "me" : ""}${c.ai ? "" : " pl"}"><td class="dv"><em${ko ? ' style="color:var(--red)"' : ""}>${pos}</em><i style="background:${c.col}"></i><u>${c.num}</u><b>${c.code}</b></td>`
      + best + gap + last + sec(c, 0) + sec(c, 1) + sec(c, 2)
      + `<td><img class="tyc" src="${TYRE_URL[c.comp]}" alt="${COMP[c.comp].name}">${c.tyreLaps} v</td><td>${c.sLaps || 0}</td><td>${where}</td></tr>`;
  }).join("");
  $("pwTimInfo").textContent = SES.fl ? `Mejor ${cars[SES.fl.idx].code} ${fmt(SES.fl.t)}` : "Sin tiempos todavía";
}
// ---- SESSION: the state of the track, and when it will be quiet enough to go out
function pwTrack() {
  const tr = sesTraffic(), [lv, col] = SAT_LV(tr.now), wl = lineWet(), grip = gripPct() * (1 - 0.38 * wl), cls = idealClass(wl);
  const fs = SES.red ? "red" : SES.flag ? "chk" : flagState() === "yellow" ? "yellow" : "green";
  const flag = { red: ["Roja", "var(--red)", SES.red ? SES.red.why : ""], chk: ["Cuadros", "#eef1f5", "sesión terminada"], yellow: ["Amarilla", "var(--accent)", "precaución en pista"], green: ["Verde", "var(--green)", "pista abierta"] }[fs];
  const act = cars.filter(c => !c.elim && !c.out && !c.dnf).length;
  let best = 0, bv = tr.bins[0] + (tr.bins[1] || 0);
  for (let k = 1; k < Math.min(tr.bins.length - 1, 30); k++) { const v = tr.bins[k] + tr.bins[k + 1]; if (v < bv - 1) { bv = v; best = k; } }
  const n1 = v => v.toFixed(1).replace(".", ",");
  const cards = [
    ["Bandera", `<span style="color:${flag[1]}">${flag[0]}</span>`, flag[2], true],
    ["En pista", `${tr.now}<small>/ ${act}</small>`, `<span style="color:${col}">Tráfico ${lv.toLowerCase()}</span>`],
    ["Agarre", `${n1(grip)}<small>%</small>`, wl > 0.13 ? "pista mojada" : "sube con la goma"],
    ["Goma", `${WK.evoLaps}<small>v</small>`, "vueltas del fin de semana"],
    ["Asfalto", `${n1(WXC.track)}<small>°C</small>`, `aire ${n1(WXC.air)} °C`],
    ["Trazada", wl < 0.01 ? "Seca" : `${Math.round(wl * 100)}<small>% agua</small>`, cls === "D" ? "neumático de seco" : cls === "I" ? "para intermedios" : "para lluvia", wl < 0.01],
    ["Límites", `${SES.tlN || 0}`, "vueltas anuladas"],
    ["Para salir", best ? `+${best}<small>min</small>` : "Ahora", best ? `menos tráfico (${tr.bins[best]})` : "buen momento"]
  ];
  $("pwTrkC").innerHTML = cards.map(([k, v, s2, tx]) => `<div class="wc"><span class="k">${k}</span><b${tx ? ' class="tx"' : ""}>${v}</b><span class="s">${s2}</span></div>`).join("");
  const info = `${SES.def.name} · ${SES.over ? "final" : "quedan " + fmtMS(SES.def.dur - SES.t)}`;
  if ($("pwTrkInfo").textContent !== info) $("pwTrkInfo").textContent = info;
  // cars on track, minute by minute until the flag (planned runs included)
  const cv = $("pwSat"); if (!cv.parentElement.offsetWidth) return;
  const { g, w, h } = cvFit(cv), n = tr.bins.length, L = 26, R = 8, T = 6, B = 16, top = Math.max(12, ...tr.bins);
  const X = k => L + (w - L - R) * k / Math.max(n, 12), Y = v => T + (h - T - B) * (1 - v / top);
  g.font = `600 8.5px ${MONO}`; g.textBaseline = "middle"; g.textAlign = "right";
  [0, 4, 8, 12, 16, 20].filter(v => v <= top).forEach(v => { g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(L, Math.round(Y(v)), w - L - R, 1); g.fillStyle = "#a7b1be"; g.fillText(v, L - 5, Y(v)); });
  tr.bins.forEach((v, k) => { const y = Y(v); g.fillStyle = SAT_LV(v)[1]; g.globalAlpha = k ? 0.8 : 1; g.fillRect(X(k) + 0.5, y, Math.max(1, X(k + 1) - X(k) - 1.5), Y(0) - y); });
  g.globalAlpha = 1;
  if (best) { g.strokeStyle = "#eef1f5"; g.setLineDash([3, 3]); g.lineWidth = 1; g.strokeRect(X(best) + 0.5, T, X(best + 2) - X(best) - 1, h - T - B); g.setLineDash([]); }
  g.textAlign = "center"; g.fillStyle = "#a7b1be";
  for (let m = 0; m < n; m += 5) g.fillText(m ? "+" + m : "AHORA", Math.min(w - R - 14, Math.max(L + 14, X(m) + (X(1) - X(0)) / 2)), h - 7);
}
// ---- RACE: circuit map, cars on the track and on a ring by real distance
function pwMap() {
  const { g, w, h } = cvFit($("pwMap")); if (w < 80 || h < 80) return;
  const rd = Math.max(6, Math.min(PW.fs ? 12 : 9, Math.min(w, h) / 40)), cx = w / 2, cy = h / 2;
  const rr = rd * 0.9, st = 2 * rr + 1.5, R = Math.min(w, h) / 2 - 2 * st - 4, rIn = R - st - 8, sc = (rIn - rd) / MAPN.rad;
  const P = (x, y) => [cx + (x - MAPN.cx) * sc, cy + (y - MAPN.cy) * sc];
  const key = w + "x" + h;
  if (PW.mapKey !== key) {
    PW.mapKey = key; PW.track = new Path2D(); PW.pit = new Path2D();
    for (let i = 0; i <= N; i++) { const [x, y] = P(RL.x[i % N], RL.y[i % N]); i ? PW.track.lineTo(x, y) : PW.track.moveTo(x, y); }
    for (let d = 0; d <= PIT.len; d += 6) { const q = pitPoint(d), [x, y] = P(q.x, q.y); d ? PW.pit.lineTo(x, y) : PW.pit.moveTo(x, y); }
  }
  const ang = s => MAPN.a0 + MAPN.dir * (wrap(s) / LAP_M) * Math.PI * 2;
  // ring with distance ticks, sector marks and the start / finish
  g.strokeStyle = "#2a3038"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  g.font = `600 8px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle";
  for (let m = 0; m < LAP_M; m += 250) {
    const a = ang(m), km = m % 1000 === 0, l = km ? 7 : 3;
    g.strokeStyle = km ? "#8e98a3" : "#3a424c"; g.beginPath(); g.moveTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l)); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke();
    if (km && m > 0) { g.fillStyle = "#8e98a3"; g.fillText(m / 1000 + " km", cx + Math.cos(a) * (R - 15), cy + Math.sin(a) * (R - 15)); }
  }
  [[0, "S1", "#f4f5f2"], [SECT_M[0], "S2", "#8e98a3"], [SECT_M[1], "S3", "#8e98a3"]].forEach(([m, t, col], k) => {
    const a = ang(m); g.strokeStyle = k ? "#5b6470" : "#f4f5f2"; g.lineWidth = k ? 1.5 : 2.5;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * (R - 10), cy + Math.sin(a) * (R - 10)); g.lineTo(cx + Math.cos(a) * (R + 4), cy + Math.sin(a) * (R + 4)); g.stroke();
    g.fillStyle = col; g.font = `800 8.5px ${DISP}`; g.fillText(t, cx + Math.cos(a + MAPN.dir * 0.09) * (R - 9), cy + Math.sin(a + MAPN.dir * 0.09) * (R - 9));
  });
  g.lineWidth = 1;
  // track: tarmac band, centre line, pit lane, start line and sector marks
  g.lineJoin = "round"; g.lineCap = "round";
  g.strokeStyle = "#2c333c"; g.lineWidth = 7; g.stroke(PW.track);
  g.strokeStyle = "#8e98a3"; g.lineWidth = 1.2; g.stroke(PW.track);
  g.setLineDash([2, 3]); g.strokeStyle = "#5b6470"; g.lineWidth = 1; g.stroke(PW.pit); g.setLineDash([]);
  [0, SECT_M[0], SECT_M[1]].forEach((m, k) => {
    const p = sample(m), hd = heading(m), [x, y] = P(p.x, p.y), nx = -Math.sin(hd) * 6, ny = Math.cos(hd) * 6;
    g.strokeStyle = k ? "#5b6470" : "#f4f5f2"; g.lineWidth = k ? 1.5 : 2.5; g.beginPath(); g.moveTo(x - nx, y - ny); g.lineTo(x + nx, y + ny); g.stroke();
  });
  // dots
  const dot = (x, y, c, r) => {
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = c.dnf ? "#3a424c" : c.col; g.fill();
    if (c.idx === focus) { g.lineWidth = 2; g.strokeStyle = "#ffd21f"; g.beginPath(); g.arc(x, y, r + 2.2, 0, Math.PI * 2); g.stroke(); }
    else if (!c.ai) { g.lineWidth = 1.4; g.strokeStyle = "#f4f5f2"; g.stroke(); }
    g.fillStyle = c.dnf ? "#8e98a3" : textOn(c.col); g.font = `700 ${r > 7 ? Math.max(8.5, Math.min(11.5, r * 0.95)).toFixed(1) : 7.5}px ${MONO}`; g.fillText(c.num, x, y + 0.5);
  };
  const live = cars.filter(c => !c.fin && !c.gone && !(SES && (c.elim || (c.gar && c.gar.ph === "park"))));
  // ring: placed by distance round the lap, stacked outwards / inwards where they bunch up
  const placed = [];
  [...live].sort((a, b) => ang(a.s) - ang(b.s)).forEach(c => {          // a free slot on the ring, one row out or in if it is taken
    const a = ang(c.s); let best = 0, bestD = -1;
    for (const L of [0, 1, -1, 2]) {
      const r = R + L * st; let dmin = Infinity;
      for (const p of placed) if (p.l === L) dmin = Math.min(dmin, Math.abs(Math.atan2(Math.sin(p.a - a), Math.cos(p.a - a))) * r);
      if (dmin >= st) { best = L; bestD = Infinity; break; }
      if (dmin > bestD) { bestD = dmin; best = L; }
    }
    placed.push({ a, l: best, c });
  });
  if (SC.state === "track" || SC.state === "out") {
    const a = ang(SC.state === "track" ? SC.s : pitTrackS(SC.d)), x = cx + Math.cos(a) * (R - st), y = cy + Math.sin(a) * (R - st);
    g.fillStyle = "#ffd21f"; g.fillRect(x - rd, y - rd * 0.7, rd * 2, rd * 1.4); g.fillStyle = "#14110a"; g.font = `800 7.5px ${DISP}`; g.fillText("SC", x, y + 0.5);
    const p = scPos(), [tx, ty] = P(p.x, p.y); g.fillStyle = "#ffd21f"; g.fillRect(tx - 5, ty - 3.5, 10, 7); g.fillStyle = "#14110a"; g.font = `800 6px ${DISP}`; g.fillText("SC", tx, ty + 0.5);
  }
  placed.sort((p, q) => (p.c.idx === focus) - (q.c.idx === focus)).forEach(p => { const r = R + p.l * st; dot(cx + Math.cos(p.a) * r, cy + Math.sin(p.a) * r, p.c, rr); });
  // on the track map
  [...live].sort((a, b) => (a.idx === focus) - (b.idx === focus)).forEach(c => { const q = carPos(c), [x, y] = P(q.x, q.y); dot(x, y, c, rd * 0.8); });
  // gaps to the cars just ahead / behind the selected one, in metres and seconds
  const me = cars[focus];
  if (me && !me.done) {
    let ah = null, bh = null;
    for (const o of live) { if (o === me || o.done) continue; const d = sgap(o.s - me.s); if (d > 0 && (!ah || d < ah.d)) ah = { o, d }; if (d < 0 && (!bh || -d < bh.d)) bh = { o, d: -d }; }
    const t = x => (x.d / Math.max(20, me.vNow || 40)).toFixed(2);
    $("pwMapInfo").textContent = `${me.code}` + (ah ? ` · ▲ ${ah.o.code} ${Math.round(ah.d)} m ${t(ah)} s` : "") + (bh ? ` · ▼ ${bh.o.code} ${Math.round(bh.d)} m ${t(bh)} s` : "");
  } else $("pwMapInfo").textContent = "";
}
// ---- RACE: lap-time chart (wide screens)
function pwLapChart() {
  const pan = $("pwLaps").closest(".pn"); if (getComputedStyle(pan).display === "none") return;
  const { g, w, h } = cvFit($("pwLaps"));
  const o = raceOrder(), lead = o[0], hi = [];
  [cars[focus], cars[0], cars[1], lead].forEach(c => { if (c && !hi.includes(c)) hi.push(c); });
  const maxL = Math.max(2, ...cars.map(c => c.laps.length));
  const clean = []; cars.forEach(c => c.laps.forEach(([t, f]) => { if (!f) clean.push(t); }));
  $("pwLapLg").innerHTML = hi.map(c => `<i style="background:${c === lead && c.idx !== focus ? "#f4f5f2" : c.col}"></i>${c.code}${c === lead ? " (líder)" : ""}`).join("");
  const L = 46, Rr = 10, T = 10, B = 22, x = n => L + (w - L - Rr) * (n - 1) / Math.max(1, maxL - 1);
  if (!clean.length) { g.fillStyle = "#8e98a3"; g.font = `700 11px ${DISP}`; g.textAlign = "center"; g.fillText("Se mostrará al completar la primera vuelta", w / 2, h / 2); return; }
  const lo = Math.floor(Math.min(...clean) - 0.3), top = lo + Math.max(3, Math.min(7, Math.max(...hi.flatMap(c => c.laps.filter(e => !e[1]).map(e => e[0]))) - lo + 0.6));
  const y = t => T + (h - T - B) * (Math.min(top, t) - lo) / (top - lo);
  g.font = `600 9px ${MONO}`; g.textAlign = "right"; g.textBaseline = "middle";
  for (let s = Math.ceil(lo); s <= top; s += 1) { g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(L, y(s), w - L - Rr, 1); g.fillStyle = "#8e98a3"; g.fillText(fmt(s).slice(0, -2), L - 5, y(s)); }
  g.textAlign = "center"; const st = maxL > 40 ? 10 : maxL > 15 ? 5 : 1;
  for (let n = 1; n <= maxL; n++) if (n === 1 || n % st === 0) { g.fillStyle = "#8e98a3"; g.fillText(n, x(n), h - 9); g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(x(n), T, 1, h - T - B); }
  const line = (c, col, lw, alpha, dash) => {
    g.globalAlpha = alpha; g.strokeStyle = col; g.lineWidth = lw; g.setLineDash(dash || []); g.beginPath(); let pen = false;
    c.laps.forEach(([t, f], k) => { if (f) { pen = false; return; } const X = x(k + 1), Y = y(t); pen ? g.lineTo(X, Y) : g.moveTo(X, Y); pen = true; });
    g.stroke(); g.globalAlpha = 1; g.setLineDash([]);
  };
  const colOf = c => c === lead && c.idx !== focus ? "#f4f5f2" : c.col, dashOf = c => c.idx !== focus && c !== lead && hi.some(o => o !== c && o.team === c.team && o.idx === focus) ? [5, 3] : null;
  cars.forEach(c => { if (!hi.includes(c)) line(c, "#8e98a3", 1, 0.18); });
  hi.slice().reverse().forEach(c => line(c, colOf(c), c.idx === focus ? 2.2 : 1.5, 1, dashOf(c)));
  // pit and safety-car laps of the selected car
  const me = cars[focus];
  me.laps.forEach(([t, f], k) => { if (!f) return; g.fillStyle = f & 1 ? "#ff2a3c" : "#ffd21f"; g.fillRect(x(k + 1) - 2, h - B - 4, 4, 4); });
}
// ---- CAR: tyres, brakes, power unit, telemetry, strategy
const GREY = {};
function greySprite(k) {                          // the car in plain grey, nose up, for the damage diagram
  if (GREY[k] || !carSprites[k]) return GREY[k] || null;
  const cv = document.createElement("canvas"); cv.width = CELL_H; cv.height = CELL_W; const g = cv.getContext("2d");
  g.translate(CELL_H / 2, CELL_W / 2); g.rotate(-Math.PI / 2); g.drawImage(carSprites[k], -CELL_W / 2, -CELL_H / 2); g.setTransform(1, 0, 0, 1, 0, 0);
  try {
    const d = g.getImageData(0, 0, cv.width, cv.height), a = d.data;
    for (let o = 0; o < a.length; o += 4) { const l = 0.3 * a[o] + 0.59 * a[o + 1] + 0.11 * a[o + 2], v = Math.round(38 + l * 0.6); a[o] = v; a[o + 1] = v + 2; a[o + 2] = v + 5; }
    g.putImageData(d, 0, 0);
  } catch (e) {}
  return (GREY[k] = cv);
}
const AERO_IMG = new Image(); AERO_IMG.src = "assets/img/aero_car.png"; window.LOADER?.track("aero", AERO_IMG);      // technical drawing for the damage diagram
function pwCarAero(c) {
  const cv = $("pwCarCv"), g = cv.getContext("2d"), t = performance.now() / 1000, W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H); if (AERO_IMG.complete && AERO_IMG.naturalWidth) g.drawImage(AERO_IMG, 0, 0, W, H);
  if (!c.aero) aeroInit(c);
  const r = W * 0.052, rg = r * 2.4;
  AERO.forEach(([id, , u, v]) => {
    const x = u * W, y = v * H, ok = c.aero[id] >= 0.99, col = ok ? "34,211,138" : "255,42,60", pulse = ok ? 1 : 0.65 + 0.35 * Math.sin(t * 6);
    const gr = g.createRadialGradient(x, y, 0, x, y, rg); gr.addColorStop(0, `rgba(${col},${0.6 * pulse})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rg, 0, Math.PI * 2); g.fill();
    g.fillStyle = `rgb(${col})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.lineWidth = r * 0.38; g.strokeStyle = "#07090c"; g.stroke();
  });
  const down = Math.max(0, 1 - c.aeroLoss / AERO_MAX) * 100, bad = AERO.filter(p => c.aero[p[0]] < 0.99);
  $("pwAero").innerHTML = `<div class="aeroh"><span>Carga aerodinámica</span><b style="color:${bad.length ? "var(--red)" : "var(--green)"}">${down.toFixed(1)} %</b>${c.aeroLoss > 0 ? `<em>−${(c.aeroLoss * 0.8 * 78).toFixed(2)} s/v</em>` : ""}</div>`
    + `<div class="aerol">${AERO.map(([id, nm]) => `<span class="${c.aero[id] >= 0.99 ? "ok" : "ko"}"><i></i>${nm}${c.aero[id] < 0.99 ? ` · ${Math.round(c.aero[id] * 100)} %` : ""}</span>`).join("")}</div>`;
}
function pwCarData() {
  const c = cars[PW.car]; if (!c || !c.tt) return;
  const pos = raceOrder().indexOf(c) + 1;
  $("pwCarHd").innerHTML = `${c.num} ${c.name} · ${c.dnf ? "DNF" : "P" + pos} · <img src="${TYRE_URL[c.comp]}" alt="${COMP[c.comp].name}" style="width:14px;height:14px;vertical-align:-3px"> ${c.tyreLaps} v`;
  pwCarAero(c);
  const [lo, hi] = TWIN[c.comp];
  document.querySelectorAll(".tyd .ty").forEach(el => {
    const w = +el.dataset.w, left = w % 2 === 0, T = c.tt[w];
    const zones = (left ? [2, 1, 0] : [0, 1, 2]).map(z => `<div style="background:${tyreCol(c, T[z])}"><b>${Math.round(T[z])}</b><u>${["INT", "MED", "EXT"][z]}</u></div>`).join("");
    const p = tyrePress(c, w), wear = c.wear[w], life = 1 - wear;
    el.innerHTML = `<div class="tyh"><b>${WHEEL_CODE[w]}</b><span>${WHEEL_NAME[w]}</span></div><div class="tyb">${zones}</div>`
      + `<div class="tyk"><span>Carcasa</span><b style="color:${tyreCol(c, c.tc[w])}">${Math.round(c.tc[w])} °C</b></div>`
      + `<div class="tyk"><span>Presión</span><b${c.punct && c.punctW === w ? ' style="color:var(--red)"' : ""}>${p.toFixed(1)} psi</b></div>`
      + `<div class="tyk"><span>Desgaste</span><b>${Math.round(wear * 100)} %</b></div><div class="wbar"><i style="width:${(life * 100).toFixed(0)}%;background:${wear < 0.6 ? "var(--white)" : wear < 0.75 ? "var(--amber)" : "var(--red)"}"></i></div>`
      + `<div class="brk"><span class="disc" style="background:${brakeCol(c.bt[w])};color:${brakeCol(c.bt[w])}"></span>FRENO<b>${Math.round(c.bt[w])} °C</b></div>`;
  });
  // power unit
  const rpm = rpmOf(c), kmh = c.done ? 0 : Math.round((c.vNow || 0) * 3.6), ice = icePower(c), mgu = c.deploy > 0 ? c.deploy : -Math.round(c.harvest);
  const rem = lapsToGo(c), per = FUEL_BASE * MIX[c.mix].fuel * PACE[c.pace].fuel, dl = c.done || (SES && c.gar) ? 0 : c.fuel / per - rem;
  const meter = (k, val, txt, min, max, col, mark) => `<div class="mt"><span>${k}</span><div class="mb"><i style="width:${Math.max(0, Math.min(100, (val - min) / (max - min) * 100)).toFixed(1)}%;background:${col}"></i>${mark != null ? `<s style="left:${((mark - min) / (max - min) * 100).toFixed(1)}%"></s>` : ""}</div><b>${txt}</b></div>`;
  const tcol = (t, ok, warn) => t < ok ? "var(--blue)" : t < warn ? "var(--green)" : t < warn + 8 ? "var(--amber)" : "var(--red)";
  const bip = mgu >= 0
    ? `<div class="mt"><span>MGU-K</span><div class="mb"><s style="left:50%"></s><i style="left:50%;width:${(mgu / 120 * 50).toFixed(1)}%;background:var(--blue)"></i></div><b>+${mgu} kW</b></div>`
    : `<div class="mt"><span>MGU-K</span><div class="mb"><s style="left:50%"></s><i style="left:${(50 + mgu / 120 * 50).toFixed(1)}%;width:${(-mgu / 120 * 50).toFixed(1)}%;background:var(--green)"></i></div><b>${mgu} kW</b></div>`;
  $("pwPuHd").textContent = `${c.mix.toUpperCase()} · ERS ${ERS[c.ers].sig}`;
  $("pwPu").innerHTML = `<div class="putop"><svg class="rpm" viewBox="0 0 120 92" aria-label="Revoluciones">
      <path class="bg" d="M21.03 77.5 A45 45 0 1 1 98.97 77.5" pathLength="100"/><path class="rl" d="M21.03 77.5 A45 45 0 1 1 98.97 77.5" pathLength="100" stroke-dasharray="0 88 12"/>
      <path class="fg" d="M21.03 77.5 A45 45 0 1 1 98.97 77.5" pathLength="100" stroke-dasharray="${(rpm / 12500 * 100).toFixed(1)} 100" style="stroke:${rpm > 11000 ? "var(--red)" : "var(--blue)"}"/>
      <text x="60" y="58" font-size="17">${rpm.toLocaleString("es-ES")}</text><text class="u" x="60" y="71">RPM × 1</text><text class="u" x="22" y="90">0</text><text class="u" x="98" y="90">12.5K</text></svg>
    <div class="pubig"><div class="gear">${c.done ? "–" : gearFor(kmh)}</div><div class="v">${kmh}<small>KM/H</small></div><div class="v">${ice}<small>KW ICE</small></div>
      <div class="chips"><span>Cambios<b>${c.shifts}</b></span><span>Mezcla<b>${c.mix.toUpperCase()}</b></span><span>ERS<b>${{ charge: "Recarga", neutral: "Neutra", defend: "Defensa", attack: "Ataque", overtake: "Adelant." }[c.ers]}</b></span></div></div></div>
    <div class="meters">${meter("ICE", ice, ice + " kW", 0, 450, "var(--blue)")}${bip}
      ${meter("Batería", c.batt / BATT_MAX * 100, Math.round(c.batt / BATT_MAX * 100) + " %", 0, 100, c.batt / BATT_MAX < 0.15 ? "var(--red)" : "var(--blue)")}
      ${meter("Combust.", c.fuel, c.fuel.toFixed(1) + " kg", 0, FUEL_MAX, dl >= 0 ? "var(--green)" : "var(--red)")}
      ${meter("Δ gas", Math.max(-3, Math.min(3, dl)) + 3, (dl >= 0 ? "+" : "−") + Math.abs(dl).toFixed(1) + " v", 0, 6, dl >= 0 ? "var(--green)" : "var(--red)", 3)}
      ${meter("Agua", c.wT, c.wT.toFixed(0) + " °C", 60, 130, tcol(c.wT, 80, 110), 115)}
      ${meter("Aceite", c.oT, c.oT.toFixed(0) + " °C", 70, 150, tcol(c.oT, 95, 128), 135)}
      ${meter("Caja", c.gT, c.gT.toFixed(0) + " °C", 60, 140, tcol(c.gT, 75, 112), 120)}
      ${meter("Vida ICE", c.puKm / 5200 * 100, Math.round(c.puKm).toLocaleString("es-ES") + " km", 0, 100, c.puKm > 4300 ? "var(--amber)" : "#8e98a3", 4300 / 5200 * 100)}
      ${meter("Vida caja", c.gbKm / 6000 * 100, Math.round(c.gbKm).toLocaleString("es-ES") + " km", 0, 100, c.gbKm > 5000 ? "var(--amber)" : "#8e98a3", 5000 / 6000 * 100)}</div>`;
}
function pwTelemetry() {
  const c = cars[PW.car]; if (!c) return;
  const { g, w, h } = cvFit($("pwTel"));
  const L = 34, Rr = 8, T = 16, sh = h - T - 50, X = d => L + (w - L - Rr) * d / LAP_M, Y = v => T + sh * (1 - Math.min(360, v) / 360);
  const vLast = c.trLast ? Math.max(0, ...c.trLast.filter(v => v != null)) : 0;
  $("pwTelLg").innerHTML = `<i style="background:${c.col}"></i>V${Math.max(1, c.lap)}<i style="background:#f4f5f2;opacity:.5"></i>V${Math.max(0, c.lap - 1)}${vLast ? " · " + Math.round(vLast) : ""} · máx ${Math.round(c.vTop * 3.6)} km/h`;
  g.font = `600 9px ${MONO}`; g.textBaseline = "middle";
  for (const v of [0, 100, 200, 300]) { g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(L, Y(v), w - L - Rr, 1); g.fillStyle = "#8e98a3"; g.textAlign = "right"; g.fillText(v, L - 5, Y(v)); }
  g.save(); g.translate(9, T + sh / 2); g.rotate(-Math.PI / 2); g.textAlign = "center"; g.font = `800 8px ${DISP}`; g.fillText("KM/H", 0, 0); g.restore();
  // sectors and corner numbers
  [[0, "S1"], [SECT_M[0], "S2"], [SECT_M[1], "S3"]].forEach(([m, t]) => { g.fillStyle = "rgba(255,255,255,.14)"; g.fillRect(X(m), T - 6, 1, sh + 6); g.fillStyle = "#cfd5db"; g.textAlign = "left"; g.font = `800 9px ${DISP}`; g.fillText(t, X(m) + 4, T - 6); });
  g.font = `600 7.5px ${MONO}`; g.textAlign = "center"; g.fillStyle = "#5b6470";
  CORNER_S.forEach((m, k) => g.fillText(k + 1, X(m), T + sh - 6));
  const trace = (arr, col, lw) => {
    if (!arr) return; g.beginPath(); let pen = false;
    for (let b = 0; b < TR_N; b++) { const v = arr[b]; if (v == null) { pen = false; continue; } const x = X(b * TR_STEP), y = Y(v); pen ? g.lineTo(x, y) : g.moveTo(x, y); pen = true; }
    g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = "round"; g.stroke();
  };
  trace(c.trLast, "rgba(244,245,242,.42)", 1.1); trace(c.trS, c.col, 1.8);
  if (!c.done && c.started) { const x = X(c.s); g.fillStyle = "#ffd21f"; g.fillRect(x - 0.5, T - 2, 1, sh + 2); g.beginPath(); g.arc(x, Y((c.vNow || 0) * 3.6), 3, 0, Math.PI * 2); g.fill(); }
  // throttle / brake strip along the lap
  const ys = T + sh + 10;
  g.font = `800 8px ${DISP}`; g.textAlign = "right"; g.fillStyle = "#8e98a3"; g.fillText("ACEL.", L - 5, ys + 3.5); g.fillText("FRENO", L - 5, ys + 15.5);
  const bw = (w - L - Rr) / TR_N + 0.6;
  for (let b = 0; b < TR_N; b++) {
    const x = X(b * TR_STEP), v = TEL_BIN[b];
    g.fillStyle = v === 1 ? "#22d38a" : v === 0 ? "rgba(34,211,138,.28)" : "rgba(34,211,138,.05)"; g.fillRect(x, ys, bw, 7);
    if (v === -1) { g.fillStyle = "#ff2a3c"; g.fillRect(x, ys + 12, bw, 7); }
  }
  g.fillStyle = "#8e98a3"; g.font = `600 8.5px ${MONO}`; g.textAlign = "center";
  for (let km = 0; km * 1000 < LAP_M; km++) g.fillText(km + " km", X(km * 1000) + (km ? 0 : 10), h - 6);
}
function pwStrategy() {
  const o = raceOrder(), n = o.length, rowH = 20, top = 22, wide = $("pwStr").parentElement.clientWidth > 620;
  $("pwStr").parentElement.style.height = (top + n * rowH + 8) + "px";
  const { g, w, h } = cvFit($("pwStr"));
  const L = 86, Rw = wide ? 168 : 92, x0 = L, x1 = w - Rw - 8, X = lap => x0 + (x1 - x0) * Math.max(0, Math.min(1, lap / RACE_LAPS));
  g.textBaseline = "middle"; g.font = `600 9px ${MONO}`;
  const stepL = RACE_LAPS <= 12 ? 2 : RACE_LAPS <= 25 ? 5 : 10;
  for (let k = 0; k <= RACE_LAPS; k += stepL) { const x = X(k); g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(x, top - 4, 1, n * rowH + 4); g.fillStyle = "#8e98a3"; g.textAlign = "center"; g.fillText(k, x, 10); }
  g.textAlign = "left"; g.font = `800 8.5px ${DISP}`; g.fillText("VUELTA", 4, 10);
  g.textAlign = "right"; g.fillText(wide ? "DESGASTE · PRÓXIMA PARADA" : "DESG. · PRÓX.", w - 4, 10);
  const lead = o[0], now = lead ? lapsRun(lead) : 0;
  const bar = (a, b, y, col, alpha) => { const xa = X(a), xb = X(b); if (xb - xa < 0.5) return; g.globalAlpha = alpha; g.fillStyle = col; g.beginPath(); g.roundRect ? g.roundRect(xa, y - 4, xb - xa, 8, 2) : g.rect(xa, y - 4, xb - xa, 8); g.fill(); g.globalAlpha = 1; };
  o.forEach((c, k) => {
    const y = top + k * rowH, yc = y + rowH / 2, S = strategyOf(c);
    if (c.idx === PW.car) { g.fillStyle = "rgba(244,245,242,.08)"; g.fillRect(0, y, w, rowH); }
    g.fillStyle = "rgba(42,48,56,.5)"; g.fillRect(0, y + rowH - 1, w, 1);
    g.font = `600 10px ${MONO}`; g.textAlign = "right"; g.fillStyle = "#8e98a3"; g.fillText(k + 1, 16, yc);
    g.fillStyle = c.col; g.fillRect(21, y + 5, 3, rowH - 10);
    g.textAlign = "left"; g.font = `800 11px ${DISP}`; g.fillStyle = c.ai ? "#f1f2ee" : "#ffd21f"; g.fillText(c.code, 29, yc + 0.5);
    [...compsUsed(c)].forEach((x, j) => drawTyre(g, x, 63 + j * 10, yc, 10));
    if (!ruleOK(c) && !c.dnf) { g.fillStyle = "#ff2a3c"; g.font = `800 10px ${DISP}`; g.fillText("!", 59 + compsUsed(c).size * 10, yc + 0.5); }
    S.st.forEach(st => bar(st.a, st.b, yc, COMP[st.comp].col, 0.95));
    S.st.slice(1).forEach((st, j) => {                // stops already made
      const x = X(st.a); g.fillStyle = "#f4f5f2"; g.beginPath(); g.moveTo(x - 3, y + 1.5); g.lineTo(x + 3, y + 1.5); g.lineTo(x, y + 5.5); g.fill();
      if (wide && c.pitLog[j]) { g.font = `600 7.5px ${MONO}`; g.textAlign = "left"; g.fillStyle = "#cfd5db"; g.fillText(c.pitLog[j].d.toFixed(1), x + 4, y + 4); }
    });
    if (c.dnf) { const x = X(S.done); g.strokeStyle = "#ff2a3c"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - 3, yc - 3); g.lineTo(x + 3, yc + 3); g.moveTo(x + 3, yc - 3); g.lineTo(x - 3, yc + 3); g.stroke(); }
    else if (!c.done) {
      let from = S.done, comp = c.comp;
      S.pred.forEach(p => {
        bar(from, p.lap, yc, COMP[comp].col, 0.3);
        const xa = X(p.lap - 1.5), xb = X(p.lap + 1.5); g.setLineDash([2, 2]); g.strokeStyle = "rgba(244,245,242,.75)"; g.lineWidth = 1; g.strokeRect(xa, yc - 6.5, Math.max(3, xb - xa), 13); g.setLineDash([]);
        from = p.lap; comp = p.comp;
      });
      bar(from, RACE_LAPS, yc, COMP[comp].col, 0.3);
    }
    // right column: worst tyre wear and the next stop
    const worst = Math.max(...c.wear), xr = w - Rw;
    g.fillStyle = "#2a313a"; g.fillRect(xr, yc - 2, wide ? 52 : 26, 4);
    g.fillStyle = worst < 0.6 ? "#f4f5f2" : worst < 0.75 ? "#ffa21f" : "#ff2a3c"; g.fillRect(xr, yc - 2, (wide ? 52 : 26) * Math.min(1, worst), 4);
    g.font = `600 9.5px ${MONO}`; g.textAlign = "left"; g.fillStyle = "#cfd5db"; g.fillText(Math.round(worst * 100) + "%", xr + (wide ? 56 : 29), yc);
    const p = S.pred[0];
    if (!c.done) {
      const txt = c.pitReq ? "BOX" : p ? (wide ? `V${Math.max(1, Math.round(p.lap - 1.5))}–${Math.round(p.lap + 1.5)}` : `V${Math.round(p.lap)}`) : "—";
      const xt = xr + (wide ? 94 : 56); g.textAlign = "left"; g.fillStyle = c.pitReq ? "#ff2a3c" : "#f1f2ee"; g.fillText(txt, xt - (wide ? 0 : 0), yc);
      if (p) drawTyre(g, p.comp, wide ? w - 10 : w - 8, yc, 13);
    }
  });
  const xn = X(now); g.fillStyle = "#ffd21f"; g.fillRect(xn - 0.5, top - 4, 1.5, n * rowH + 4);
}

// ---------- circuit data (official figures) and race-line landmarks ----------
const CIRCUIT = { name: "Circuit de Barcelona-Catalunya", city: "Montmeló", country: "España", lengthKm: 4.657, laps: 66, firstGP: 1991,
  record: { t: "1:15.743", who: "Oscar Piastry", year: 2025 }, distKm: 307.236, corners: 14,
  traits: [["Carga aerodinámica", "Alta", 8], ["Degradación neum.", "Alta", 8], ["Exigencia frenos", "Media", 5], ["Adelantamiento", "Difícil", 3]] };
const TURNS = [711, 787, 1020, 1593, 1973, 2210, 2386, 2483, 2734, 3335, 3430, 3606, 3898, 4190];   // race-line distance of turns 1-14 (m)
const SPEED_TRAP = (() => { let b = 0, bv = 0; for (let i = 0; i < N; i++) if (cum[i] > 150 && cum[i] < 700 && RL.v[i] > bv) { bv = RL.v[i]; b = cum[i]; } return b; })();
const SEC_COL = ["#e10600", "#2f9bff", "#ffd21f"];
const secOf = s => s < SECT_M[0] ? 0 : s < SECT_M[1] ? 1 : 2;
// ---------- strategy model for the planner: lap time, wear and fuel per lap, pit-lane loss ----------
const STRAT = (() => {
  let t = 0, ws = 0;
  for (let i = 0; i < N; i++) { const dt = (cum[i + 1] - cum[i]) / RL.v[i]; t += dt; ws += straight[i] * dt; }
  let tp = 0, tt = 0;                              // pit lane against the same stretch of track
  for (let d = 0; d < PIT.len; d += 1.5) {
    let v = sample(pitTrackS(d)).v;
    if (d < PIT.limStart) v = Math.min(v, Math.sqrt(V_PIT * V_PIT + 2 * 18 * (PIT.limStart - d))); else if (d <= PIT.limEnd) v = Math.min(v, V_PIT); else v = Math.min(v, Math.sqrt(V_PIT * V_PIT + 2 * 11 * (d - PIT.limEnd)));
    tp += 1.5 / Math.max(5, v);
  }
  const s0 = pitTrackS(0), len = wrap(pitTrackS(PIT.len) - s0);
  for (let d = 0; d < len; d += 1.5) tt += 1.5 / sample(s0 + d).v;
  let full = 0, heavy = 0, inBrake = false, gmax = 0;
  for (let i = 0; i < N; i++) {
    const dt = (cum[i + 1] - cum[i]) / RL.v[i];
    if (accel[i] > 0.3 || RL.v[i] > VMAX * 0.97) full += dt;
    if (accel[i] < -25 && !inBrake) { heavy++; inBrake = true; } else if (accel[i] > -5) inBrake = false;
    gmax = Math.max(gmax, LATG[i]);
  }
  return { T: t, WS: ws / t, PIT_LOSS: tp - tt + 2.7 + 1.2, full: full / t, heavy, gmax, START: 3.0 };
})();
function lapPred(skill, comp, worst, fuel, pace, mix, wl = 0) {
  const ws = STRAT.WS, wc = 1 - ws, avgW = worst / TYRE_BIAS[0];
  const k = 1 + skill + PACE[pace].k + MIX[mix].k * ws - fuel * 0.000375 + (COMP[comp].grip - wearLoss(avgW)) * (0.4 + 0.6 * wc) - wetLoss(comp, wl) * (0.55 + 0.45 * wc);
  return STRAT.T / k;
}
const wearLap = (comp, pace, fuel, wl = 0) => COMP[comp].wear * PACE[pace].tyre * (1 + Math.max(0, fuel) / FUEL_MAX * 0.15) * TYRE_BIAS[0] * wetWear(comp, wl);
const fuelLap = (pace, mix) => FUEL_BASE * MIX[mix].fuel * PACE[pace].fuel;
function simPlan(skill, plan) {
  const out = [], maxW = []; let fuel = plan.fuel, total = 0, dry = 0;
  plan.stints.forEach((st, j) => {
    const a = j ? plan.stints[j - 1].to : 0; let wear = 0;
    for (let l = a + 1; l <= st.to; l++) {
      const wl = FC && FC.wl[l] || 0, per = fuelLap(st.pace, st.mix) * (1 - 0.15 * wl), dw = wearLap(st.comp, st.pace, fuel, wl);
      let lt = lapPred(skill, st.comp, wear + dw / 2, Math.max(0, fuel - per / 2), st.pace, st.mix, wl) + (l === 1 ? STRAT.START : 0);
      const pit = l === st.to && j < plan.stints.length - 1;
      wear += dw; fuel -= per; if (fuel < 0 && !dry) dry = l;
      out.push({ l, lt, pit, wear, fuel, comp: st.comp, mix: st.mix, pace: st.pace, j });
      total += lt + (pit ? STRAT.PIT_LOSS : 0);
    }
    maxW.push(wear);
  });
  const used = new Set(plan.stints.map(x => x.comp));
  return { laps: out, total, fuelEnd: fuel, maxW, dry, rule: used.has("I") || used.has("W") || used.size >= 2 };
}
// best strategy (pace balanced, STD mix): every pit-lap combination for 1-3 stops, tyres never past 80 % wear, two compounds
function recommendWx(skill) {                 // the forecast decides: rain tyres for the wet laps, the best slicks for the dry ones
  const L = RACE_LAPS, runs = [];
  for (let l = 1; l <= L; l++) { const k = idealClass(FC.wl[l]); if (runs.length && runs[runs.length - 1].k === k) runs[runs.length - 1].b = l; else runs.push({ k, a: l, b: l }); }
  for (let again = true; again;) {
    again = false;
    for (let j = 0; j < runs.length && runs.length > 1; j++) if (runs[j].b - runs[j].a < 2) { const t = j ? runs[j - 1] : runs[j + 1]; t.a = Math.min(t.a, runs[j].a); t.b = Math.max(t.b, runs[j].b); runs.splice(j, 1); again = true; break; }
    for (let j = 1; j < runs.length; j++) if (runs[j].k === runs[j - 1].k) { runs[j - 1].b = runs[j].b; runs.splice(j, 1); j--; again = true; }
  }
  const life = x => 0.75 / wearLap(x, "bal", 60), stints = [];
  runs.forEach(r => {
    const n = r.b - r.a + 1;
    if (r.k !== "D") { stints.push({ comp: r.k, to: r.b }); return; }
    const parts = n <= life("H") ? 1 : Math.ceil(n / life("M")), m = n / parts, comp = m <= life("S") * 0.95 ? "S" : m <= life("M") ? "M" : "H";
    for (let q = 1; q <= parts; q++) stints.push({ comp, to: r.a - 1 + Math.round(m * q) });
  });
  let fuel = 0.25 * fuelLap("bal", "std"); for (let l = 1; l <= L; l++) fuel += fuelLap("bal", "std") * (1 - 0.15 * FC.wl[l]);
  return { fuel: Math.min(FUEL_MAX, Math.round(fuel * 2) / 2), stints: stints.map(st => ({ comp: st.comp, to: st.to, pace: "bal", mix: "std" })) };
}
function recommend(skill, stopsWanted) {
  if (!stopsWanted && FC && FC.wl.slice(1, RACE_LAPS + 1).some(w => w > 0.13)) return recommendWx(skill);
  const L = RACE_LAPS, per = fuelLap("bal", "std"), fuel0 = Math.min(FUEL_MAX, Math.round((L + 0.25) * per * 2) / 2), CS = ["S", "M", "H"], MAXW = 0.75, MIN = Math.max(3, Math.round(L * 0.12));
  const D = L + 1, TT = new Float64Array(3 * D * D), WW = new Float64Array(3 * D * D);
  for (let ci = 0; ci < 3; ci++) for (let a = 0; a < L; a++) {
    let t = 0, wear = 0, fuel = fuel0 - a * per;
    for (let b = a + 1; b <= L; b++) {
      const dw = wearLap(CS[ci], "bal", fuel); t += lapPred(skill, CS[ci], wear + dw / 2, Math.max(0, fuel - per / 2), "bal", "std"); wear += dw; fuel -= per;
      TT[(ci * D + a) * D + b] = t; WW[(ci * D + a) * D + b] = wear;
    }
  }
  let best = null;
  const laps = [], comps = [];
  function rec(j, a, used, cost, n) {
    if (j === n) {
      for (let ci = 0; ci < 3; ci++) {
        const id = (ci * D + a) * D + L; if (WW[id] > MAXW) continue;
        const u = used | (1 << ci); if (u === 1 || u === 2 || u === 4) continue;
        const tot = cost + TT[id];
        if (!best || tot < best.t) best = { t: tot, laps: laps.slice(), comps: comps.concat(CS[ci]) };
      }
      return;
    }
    for (let b = a + MIN; b <= L - MIN * (n - j); b++) for (let ci = 0; ci < 3; ci++) {
      const id = (ci * D + a) * D + b; if (WW[id] > MAXW) continue;
      const c2 = cost + TT[id] + STRAT.PIT_LOSS; if (best && c2 > best.t) continue;
      laps.push(b); comps.push(CS[ci]); rec(j + 1, b, used | (1 << ci), c2, n); laps.pop(); comps.pop();
    }
  }
  (stopsWanted ? [stopsWanted] : [1, 2, 3]).forEach(n => { if (L >= MIN * (n + 1)) rec(0, 0, 0, 0, n); });
  if (!best) { const h = Math.max(1, Math.round(L / 2)); best = { laps: [h], comps: ["M", "S"] }; }
  return { fuel: fuel0, stints: best.comps.map((c, j) => ({ comp: c, to: j < best.laps.length ? best.laps[j] : L, pace: "bal", mix: "std" })) };
}
// ---------- the plan during the race: box calls on the planned laps, pace and mix per stint ----------
function planLap(c) {
  const P = c.plan; if (!P || c.done || c.pit || c.pitReq) return;
  const st = P.stints[c.stops], nx = P.stints[c.stops + 1];
  if (st && nx && c.lap === st.to && c.planArmed !== c.stops) {
    if (tyreClass(nx.comp) === "D" && lineWet() > 0.13) { if (c.planWarn !== c.stops) { c.planWarn = c.stops; toast(`${c.code} · Plan en pausa: pista mojada`, false); } return; }
    c.planArmed = c.stops; c.pitReq = true; c.nextComp = nx.comp; ui[c.idx]?.syncPit();
    toast(`${c.code} · Box esta vuelta (plan) · ${COMP[nx.comp].name}`, false);
  }
}
function planStint(c) { const st = c.plan && c.plan.stints[c.stops]; if (st) { c.pace = st.pace; c.mix = st.mix; ui[c.idx]?.sync(); } }

// ---------- MENUS ----------
const MENU = { step: null, car: 0, laps: RACE_LAPS, sel: [0, 0], drag: null };
var PLANS = [null, null], RECS = [null, null];
const SPEC_PARTS = [["Chasis", "CH", "aero"], ["Alerón delantero", "FW", "aero"], ["Alerón trasero", "RW", "aero"], ["Fondo plano", "FL", "aero"], ["Pontones", "SP", "aero"], ["Suspensión", "SU", "aero"],
  ["Motor (ICE)", "ICE", "pu"], ["Turbo (TC)", "TC", "pu"], ["MGU-K", "MGU", "pu"], ["Batería (ES)", "ES", "pu"], ["Electrónica (CE)", "CE", "pu"], ["Caja de cambios", "GB", "gb"]];
function menuShow(step) {
  MENU.step = step; $("menu").hidden = !step; if (!step) return;
  $("menu").classList.toggle("wk", step === "weekend");
  if (PW.open) pwOpen(false);
  $("msg").hidden = true; START.state = "menu"; $("lights").hidden = true; $("setup").hidden = true; $("pop").hidden = true;
  const ORD = ["circuit", "weekend", "prep", "race"], si = ORD.indexOf(step);
  document.querySelectorAll(".steps li").forEach(li => { const j = ORD.indexOf(li.dataset.s); li.className = j === si ? "on" : j < si ? "done" : ""; });
  $("mnCircuit").hidden = step !== "circuit"; $("mnPrep").hidden = step !== "prep"; $("mnWeekend").hidden = step !== "weekend";
  $("mnBack").hidden = false; $("mnBack").innerHTML = step === "prep" ? "◀<span class=\"lg\"> Fin de semana</span>" : step === "circuit" ? "◀<span class=\"lg\"> Escudería</span>" : "◀<span class=\"lg\"> Sede</span>";
  $("mnSim").hidden = $("mnSimAll").hidden = step !== "weekend";
  $("mnGo").textContent = step === "circuit" ? "Continuar ▶" : "Iniciar carrera ▶";
  $("mnSub").textContent = step === "circuit" ? "Selección de circuito" : step === "weekend" ? `Gran Premio de Barcelona-Catalunya · Ronda 01 · ${RACE_LAPS} vueltas` : `Estrategia · Barcelona-Catalunya · ${RACE_LAPS} vueltas`;
  if (step === "circuit") renderCircuit(); else if (step === "weekend") renderWeekend(); else renderPrepAll();
}
function showCircuitMenu() {                                  // the circuit list is no longer a step: the team's HQ leads to the GP
  if (SES) sesClose(); MENU.laps = RACE_LAPS; openHQ(() => menuShow(null));
}
function goGP() {                                             // HQ ▶ Preparación GP: straight to the Grand Prix presentation
  if (SES) sesClose(); RACE_LAPS = MENU.laps || RACE_LAPS;
  if (!WK) newWk();
  menuShow("weekend");
}
$("mnGo").onclick = () => {
  if (MENU.step === "circuit") {
    RACE_LAPS = MENU.laps;
    if (!WK || !WK.i) WK = newWeekend();
    menuShow("weekend");
  } else if (MENU.step === "weekend") {
    if (WK.i < SES_IDS.length) playSession(SES_IDS[WK.i]); else goPrep();
  } else if (MENU.step === "prep") {                          // the pit lane interview, then the race
    if (IV_ON && WK && !WK.ivG) { WK.ivG = 1; ivOpen("grid", startPlannedRace); } else startPlannedRace();
  }
};
function newWk() { WK = newWeekend(); if (isSeason()) sWkAdjust(); return WK; }
function ivStartGP() {                                        // the Grand Prix starts with the press conference
  if (SES) sesClose(); if (!WK) newWk();
  if (IV_ON && !WK.ivP) { WK.ivP = 1; ivOpen("press", goGP); } else goGP();
}
function ivPost(next) {                                       // the pit lane interview after the race
  cars.ivR = true; $("res").hidden = true; ivOpen("post", next);
}
$("mnBack").onclick = () => {
  if (MENU.step === "circuit") { FRONT.team = DRIVERS[0].team; showFront("team"); return; }
  if (MENU.step === "prep" && WK) { menuShow("weekend"); return; }
  showCircuitMenu();                                          // the GP presentation goes back to the HQ
};
function startPlannedRace() {
  [0, 1].forEach(k => {
    const c = cars[k], P = PLANS[k];
    c.plan = JSON.parse(JSON.stringify(P)); c.planArmed = -1;
    c.fuel = P.fuel; c.comp = c.nextComp = P.stints[0].comp; c.stints = [{ c: c.comp, a: 0 }];
    c.pace = P.stints[0].pace; c.mix = P.stints[0].mix; newTyres(c, c.comp);
  });
  ui.forEach(u => u.sync());
  RDO.q = []; RDO.cur = null; RDO.next = null; RDO.last = -1e9; RDO.amb = 0; RDO.out = {}; RDO.gap = []; RDO.beh = {}; RDO.cd = {};
  if (isSeason()) cars.forEach((c, k) => { c.failAt = sFailLap(k, c.team); });   // a breakdown waiting to happen, or not
  menuShow(null); resetStart(); WX_T0 = simClock;
}
addEventListener("resize", () => { if (MENU.step === "circuit") { drawCircuitMap(); drawProfile(); drawWxForecast(); } else if (MENU.step === "prep") [0, 1].forEach(drawPrepCharts); });

// ---- circuit screen
function renderCircuit() {
  const km = (MENU.laps === CIRCUIT.laps ? CIRCUIT.distKm : MENU.laps * CIRCUIT.lengthKm).toFixed(3).replace(".", ",");
  $("mnFacts").innerHTML = [
    ["Longitud del circuito", `4,657<small>km</small>`, "Por vuelta", false],
    ["Número de vueltas", `${CIRCUIT.laps}`, "Distancia de GP", false],
    ["Primer Gran Premio", `${CIRCUIT.firstGP}`, "Montmeló, España", false],
    ["Distancia de carrera", `307,236<small>km</small>`, "66 vueltas", false],
    ["Récord de vuelta en carrera", `${CIRCUIT.record.t}`, `${CIRCUIT.record.who} (${CIRCUIT.record.year})`, true]
  ].map(([k, v, s, w]) => `<div class="fact${w ? " wide" : ""}"><span class="k">${k}</span><b>${v}</b><span class="s">${s}</span></div>`).join("");
  $("mnTraits").innerHTML = CIRCUIT.traits.map(([k, v, n]) => `<div class="trait"><span>${k}</span><div class="bar">${Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div><b>${v}</b></div>`).join("");
  const ref = lapPred(DRIVERS[2].skill, "M", 0.1, 50, "bal", "std");
  $("mnTech").innerHTML = [["Velocidad punta", Math.round(VMAX * 3.6) + " km/h"], ["A fondo", Math.round(STRAT.full * 100) + " %"], ["Frenadas fuertes", STRAT.heavy],
]
    .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("");
  $("mnProfInfo").textContent = "Velocidad por sector";
  $("mnDist").innerHTML = LAP_OPTS.map(n => `<button data-n="${n}" aria-pressed="${n === MENU.laps}"><b>${n}</b><span>${n === 66 ? "100 %" : Math.round(n / 66 * 100) + " %"} · ${(n === CIRCUIT.laps ? CIRCUIT.distKm : n * CIRCUIT.lengthKm).toFixed(1).replace(".", ",")} km</span></button>`).join("");
  $("mnDistInfo").textContent = `${MENU.laps} v · ${km} km`;
  const W = weather(simClock);
  renderWxMenu();
  if (0) $("mnWx").innerHTML = [["Cielo", W.sky, true], ["Aire", W.air.toFixed(1) + " °C"], ["Pista", W.track.toFixed(1) + " °C"], ["Lluvia", W.rain + " %"]].map(([k, v, tx]) => `<div><span>${k}</span><b${tx ? ' class="tx"' : ""}>${v}</b></div>`).join("");
  $("mnInfo").innerHTML = `Barcelona-Catalunya · <b>${MENU.laps}</b> vueltas · <b>${km}</b> km · <b>${WX_STATES[WXSET.start].name}</b>`;
  requestAnimationFrame(() => { drawCircuitMap(); drawProfile(); });
}
function renderWxMenu() {
  const plan = wxPlan(WXSET, MENU.laps), s0 = WX_STATES[WXSET.start], W0 = s0.R >= 1 ? 0.95 : s0.R > 0 ? 0.7 : 0, fc = wxForecast(MENU.laps, W0, plan, W0 > 0 ? 0.25 : 0);
  MENU.fc = fc;
  $("mnWxSt").innerHTML = WX_STATES.map((st, k) => `<button data-wx="${k}" aria-pressed="${k === WXSET.start}">${wxIcon(k, 24)}<span>${st.name}</span></button>`).join("");
  $("mnWxEv").innerHTML = WX_EVO.map((n, k) => `<button data-ev="${k}" aria-pressed="${k === WXSET.evo}">${n}</button>`).join("");
  const wetLaps = fc.wl.slice(1).filter(w => w > 0.13).length, maxR = Math.max(...fc.R), A = wxAt(0, plan);
  $("mnWxInfo").textContent = wetLaps ? `${wetLaps} de ${MENU.laps} vueltas en mojado` : "Carrera en seco";
  const air = 24.2 - A.cloud * 0.03 - A.R * 2.5, track = air + 4 + 15 * (1 - A.cloud / 100) - 9 * W0;
  $("mnWx").innerHTML = [["Inicio", s0.name, true], ["Aire", air.toFixed(1) + " °C"], ["Pista", track.toFixed(1) + " °C"], ["Lluvia", (maxR > 0.05 ? Math.round(Math.min(97, 45 + 52 * Math.min(1, maxR))) : 4) + " %"]]
    .map(([k, v, tx]) => `<div><span>${k}</span><b${tx ? ' class="tx"' : ""}>${v}</b></div>`).join("");
  requestAnimationFrame(drawWxForecast);
}
function drawWxForecast() {
  const cv = $("mnWxFc"), fc = MENU.fc; if (!cv || !fc) return;
  const { g, w, h } = cvFit(cv); if (w < 100) return;
  const L = MENU.laps, Lp = 44, Rp = 10, T = 24, B = 20, X = l => Lp + (w - Lp - Rp) * l / L, Y = v => T + (h - T - B) * (1 - Math.min(1, v));
  // sky strip with an icon where it changes
  for (let l = 1; l <= L; l++) { g.fillStyle = WX_STATES[fc.s[l]].col; g.globalAlpha = 0.9; g.fillRect(X(l - 1), 4, X(l) - X(l - 1) + 0.5, 4); }
  g.globalAlpha = 1;
  let lastX = -99; for (let l = 1; l <= L; l++) if (l === 1 || fc.s[l] !== fc.s[l - 1]) { const x = Math.max(X(l - 1), lastX + 18); const im = WXICON_IMG[fc.s[l]]; if (im.complete) g.drawImage(im, x, 9, 13, 13); lastX = x; }
  // thresholds for the tyres
  g.font = `800 7.5px ${DISP}`; g.textBaseline = "middle"; g.textAlign = "right";
  [[0, "SECO", "#a7b1be"], [0.13, "INTER", "#3fc94f"], [0.55, "LLUVIA", "#2f86ff"], [1, "", ""]].forEach(([v, t, col]) => {
    g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(Lp, Y(v), w - Lp - Rp, 1); if (t) { g.fillStyle = col; g.fillText(t, Lp - 5, Y(v) + (v === 0.13 ? -4 : v === 0 ? 3 : 0)); } });
  // rain intensity per lap (bars) and water left on the racing line (line)
  for (let l = 1; l <= L; l++) { const r = Math.min(1, fc.R[l]); if (r < 0.02) continue; const gr = g.createLinearGradient(0, Y(r), 0, Y(0)); gr.addColorStop(0, "rgba(92,180,255,.75)"); gr.addColorStop(1, "rgba(47,107,255,.12)"); g.fillStyle = gr; g.fillRect(X(l - 1) + 0.5, Y(r), Math.max(1, X(l) - X(l - 1) - 1), Y(0) - Y(r)); }
  g.beginPath(); for (let l = 1; l <= L; l++) { const x = X(l - 0.5), y = Y(fc.wl[l]); l === 1 ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.strokeStyle = "#eef1f5"; g.lineWidth = 2; g.lineJoin = "round"; g.stroke();
  g.fillStyle = "#a7b1be"; g.font = `600 8.5px ${MONO}`; g.textAlign = "center"; const stp = L > 40 ? 10 : L > 15 ? 5 : 2;
  for (let l = 0; l <= L; l += stp) g.fillText(l, X(l), h - 8);
  g.textAlign = "left"; g.font = `800 7.5px ${DISP}`; g.fillStyle = "#5cb4ff"; g.fillRect(Lp + 6, T + 5, 6, 6); g.fillStyle = "#cfd6df"; g.fillText("LLUVIA", Lp + 15, T + 8.5);
  g.fillStyle = "#eef1f5"; g.fillRect(Lp + 56, T + 7.5, 10, 2); g.fillStyle = "#cfd6df"; g.fillText("AGUA EN LA TRAZADA", Lp + 70, T + 8.5);
}
$("mnWxSt").onclick = e => { const b = e.target.closest("[data-wx]"); if (!b) return; WXSET.start = +b.dataset.wx; renderWxMenu(); };
$("mnWxEv").onclick = e => { const b = e.target.closest("[data-ev]"); if (!b) return; WXSET.evo = +b.dataset.ev; renderWxMenu(); };
$("mnWxRe").onclick = () => { WXSET.seed = (Math.random() * 1e9) | 0; renderWxMenu(); };
$("mnDist").onclick = e => { const b = e.target.closest("[data-n]"); if (!b) return; MENU.laps = +b.dataset.n; renderCircuit(); };
function trackFit(w, h, pad) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < N; i++) { x0 = Math.min(x0, RL.x[i]); x1 = Math.max(x1, RL.x[i]); y0 = Math.min(y0, RL.y[i]); y1 = Math.max(y1, RL.y[i]); }
  const sc = Math.min((w - 2 * pad) / (x1 - x0), (h - 2 * pad) / (y1 - y0)), ox = (w - (x1 - x0) * sc) / 2, oy = (h - (y1 - y0) * sc) / 2;
  return (x, y) => [ox + (x - x0) * sc, oy + (y - y0) * sc];
}
function drawCircuitMap() {
  const { g, w, h } = cvFit($("mnMap")); if (w < 100) return;
  const P = trackFit(w, h, Math.max(26, w * 0.05)), pt = s => { const p = sample(s); return P(p.x, p.y); };
  const [mx, my] = P(MAPN.cx, MAPN.cy);
  const outN = s => { const [x, y] = pt(s), hd = heading(s); let nx = -Math.sin(hd), ny = Math.cos(hd); if (nx * (x - mx) + ny * (y - my) < 0) { nx = -nx; ny = -ny; } return [nx, ny]; };
  g.lineJoin = g.lineCap = "round";
  // faint grid
  g.strokeStyle = "rgba(255,255,255,.035)"; g.lineWidth = 1;
  for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke(); }
  for (let y = 0; y < h; y += 24) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); }
  const path = (a, b) => { g.beginPath(); for (let s = a; s <= b; s += 6) { const [x, y] = pt(Math.min(s, b)); s === a ? g.moveTo(x, y) : g.lineTo(x, y); } };
  // pit lane
  g.setLineDash([3, 3]); g.strokeStyle = "#5b6470"; g.lineWidth = 1.5; g.beginPath();
  for (let d = 0; d <= PIT.len; d += 6) { const q = pitPoint(d), [x, y] = P(q.x, q.y); d ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
  // tarmac band, then the three sectors
  g.strokeStyle = "#1b2027"; g.lineWidth = 11; path(0, LAP_M); g.stroke();
  [[0, SECT_M[0]], [SECT_M[0], SECT_M[1]], [SECT_M[1], LAP_M]].forEach(([a, b], k) => { g.strokeStyle = SEC_COL[k]; g.lineWidth = 4; path(a, b); g.stroke(); });
  // sector labels
  g.font = `800 ${w < 420 ? 8.5 : 10}px ${DISP}`; g.textAlign = "center"; g.textBaseline = "middle";
  [[SECT_M[0] * 0.07, 0, "SECTOR 1"], [(SECT_M[0] + SECT_M[1]) * 0.47, 1, "SECTOR 2"], [SECT_M[1] + (LAP_M - SECT_M[1]) * 0.35, 2, "SECTOR 3"]].forEach(([s, k, t]) => {
    const [x, y] = pt(s), hd = heading(s), [nx, ny] = outN(s), dd = k === 1 ? -15 : 15;
    g.save(); g.translate(x + nx * dd, y + ny * dd); let a = hd; if (Math.cos(a) < 0) a += Math.PI; g.rotate(a);
    g.fillStyle = SEC_COL[k]; g.fillText(t, 0, 0); g.restore();
  });
  // start / finish line (chequered) and direction
  { const [x, y] = pt(0), hd = heading(0); g.save(); g.translate(x, y); g.rotate(hd);
    for (let i = -2; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? "#0d1014" : "#f4f5f2"; g.fillRect(j * 3 - 3, i * 3, 3, 3); }
    g.restore();
    const [ax, ay] = pt(-90); g.save(); g.translate(ax, ay); g.rotate(hd); g.fillStyle = "#cfd5db";
    for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(6 + k * 7, -4); g.lineTo(10 + k * 7, 0); g.lineTo(6 + k * 7, 4); g.lineTo(8 + k * 7, 0); g.closePath(); g.fill(); }
    g.restore(); }
  // speed trap
  { const [x, y] = pt(SPEED_TRAP), [nx, ny] = outN(SPEED_TRAP);
    g.strokeStyle = "#e040fb"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - nx * 6, y - ny * 6); g.lineTo(x + nx * 16, y + ny * 16); g.stroke();
    g.fillStyle = "#e040fb"; const tw = 62, th = 15, lx = x + nx * 16 - tw / 2, ly = y + ny * 16 + (ny > 0 ? 2 : -th - 2);
    g.fillRect(lx, ly, tw, th); g.fillStyle = "#14001a"; g.font = `800 8.5px ${DISP}`; g.fillText("SPEED TRAP", lx + tw / 2, ly + th / 2 + 0.5); }
  // turn numbers, on the outside of each bend
  const r = w < 420 ? 8 : 10;
  TURNS.forEach((s, k) => {
    const [x, y] = pt(s), hd = heading(s), side = turnOut[idxAt(s)] || 1, d = r + 9, nx = -Math.sin(hd) * side * d, ny = Math.cos(hd) * side * d;
    g.strokeStyle = "rgba(244,245,242,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x + nx * 0.45, y + ny * 0.45); g.lineTo(x + nx * 0.78, y + ny * 0.78); g.stroke();
    g.beginPath(); g.arc(x + nx, y + ny, r, 0, Math.PI * 2); g.fillStyle = "#0d1014"; g.fill(); g.lineWidth = 1.4; g.strokeStyle = "#f4f5f2"; g.stroke();
    g.fillStyle = "#f4f5f2"; g.font = `700 ${r > 8 ? 9 : 8}px ${MONO}`; g.fillText(String(k + 1).padStart(2, "0"), x + nx, y + ny + 0.5);
  });
}
function drawProfile() {
  const { g, w, h } = cvFit($("mnProf")); if (w < 100) return;
  const L = 34, Rr = 8, T = 14, B = 20, X = s => L + (w - L - Rr) * s / LAP_M, Y = v => T + (h - T - B) * (1 - v / 360);
  g.font = `600 9px ${MONO}`; g.textBaseline = "middle"; g.textAlign = "right";
  for (const v of [0, 100, 200, 300]) { g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(L, Y(v), w - L - Rr, 1); g.fillStyle = "#8e98a3"; g.fillText(v, L - 5, Y(v)); }
  for (let k = 0; k < 3; k++) {
    const a = k ? SECT_M[k - 1] : 0, b = k < 2 ? SECT_M[k] : LAP_M;
    g.beginPath(); g.moveTo(X(a), Y(0));
    for (let s = a; s <= b; s += 8) g.lineTo(X(s), Y(sample(s).v * 3.6));
    g.lineTo(X(b), Y(0)); g.closePath();
    const gr = g.createLinearGradient(0, T, 0, h - B); gr.addColorStop(0, SEC_COL[k] + "55"); gr.addColorStop(1, SEC_COL[k] + "05"); g.fillStyle = gr; g.fill();
    g.beginPath(); for (let s = a; s <= b; s += 8) { const x = X(s), y = Y(sample(s).v * 3.6); s === a ? g.moveTo(x, y) : g.lineTo(x, y); } g.strokeStyle = SEC_COL[k]; g.lineWidth = 1.6; g.stroke();
  }
  g.textAlign = "center"; g.font = `700 8px ${MONO}`;
  TURNS.forEach((s, k) => { const v = sample(s).v * 3.6; g.fillStyle = "#f4f5f2"; g.fillText(k + 1, X(s), Y(v) + 9); });
  const ts = sample(SPEED_TRAP).v * 3.6; g.fillStyle = "#e040fb"; g.fillRect(X(SPEED_TRAP) - 0.5, T - 4, 1.5, h - T - B + 4);
  g.font = `800 8px ${DISP}`; g.fillText("SPEED TRAP " + Math.round(ts), X(SPEED_TRAP), T - 7);
  g.fillStyle = "#8e98a3"; g.font = `600 8.5px ${MONO}`;
  for (let km = 0; km * 1000 < LAP_M; km++) g.fillText(km + " km", X(km * 1000) + (km ? 0 : 12), h - 7);
}

// ---- preparation screen
function renderPrepAll() {
  $("mnTabs").innerHTML = [0, 1].map(k => `<button data-k="${k}" aria-pressed="${k === MENU.car}"><i style="background:${cars[k].col}"></i>Coche ${k + 1} · ${cars[k].name}</button>`).join("");
  document.querySelectorAll(".pcol").forEach(el => el.classList.toggle("off", +el.dataset.k !== MENU.car));
  [0, 1].forEach(renderPrep);
  updateMenuInfo();
}
$("mnTabs").onclick = e => { const b = e.target.closest("[data-k]"); if (!b) return; MENU.car = +b.dataset.k; renderPrepAll(); };
function updateMenuInfo() {
  $("mnInfo").innerHTML = [0, 1].map(k => `${cars[k].code} <b>P${cars[k].slot + 1}</b>`).join(" · ") + ` · <b>${RACE_LAPS}</b> v`;
}
const PACE_NAME = { soft: "Suave", bal: "Equilibrado", agg: "Agresivo" }, MIX_TXT = { lean: "LOW", std: "STD", rich: "HIGH" };
const MIX_COL = { lean: "#22d38a", std: "#a7b1be", rich: "#ff6a3d" };
const chevSVG = v => { const [n, col] = CHEV[v]; let s = ""; const w = 7, tot = n * w + (n - 1) * 1.5, x0 = (26 - tot) / 2; for (let j = 0; j < n; j++) { const x = x0 + j * (w + 1.5); s += `<path d="M${x} 1 H${x + 3.5} L${x + w} 5.5 L${x + 3.5} 10 H${x} L${x + 3.5} 5.5 Z" fill="${col}"/>`; } return `<svg viewBox="0 0 26 11" aria-hidden="true">${s}</svg>`; };
const samePlan = (a, b) => a.stints.length === b.stints.length && a.stints.every((s, j) => s.comp === b.stints[j].comp && s.to === b.stints[j].to && s.pace === b.stints[j].pace && s.mix === b.stints[j].mix);
const fmtS = t => (t >= 0 ? "+" : "−") + Math.abs(t).toFixed(1).replace(".", ",") + " s";
function renderPrep(k) {
  const el = document.querySelector(`.pcol[data-k="${k}"]`), c = cars[k], P = PLANS[k], S = simPlan(c.skill, P), R = simPlan(c.skill, RECS[k]);
  const L = RACE_LAPS, per = fuelLap("bal", "std"), team = TEAMS[c.team], dt = S.total - R.total, nStops = P.stints.length - 1;
  // one status line: the most important problem, or the all-clear
  let status = ["ok", "✓", "Estrategia válida: dos compuestos y combustible hasta la meta."];
  const hiW = S.maxW.map((w, j) => [w, j]).filter(([w]) => w > 0.755);
  if (hiW.length) status = ["warn", "⚠", `Stint ${hiW.map(([, j]) => j + 1).join(" y ")}: el neumático acaba por debajo del 25 % de vida.`];
  if (S.maxW.some(w => w > 0.85)) status = ["bad", "⚠", "Neumático por encima del 85 % de desgaste: riesgo de pinchazo."];
  if (FC) {                                          // tyres that do not suit the forecast
    const mis = S.laps.find(x => { const w = FC.wl[x.l] || 0, k = tyreClass(x.comp); return k === "D" ? w > 0.2 : k === "I" ? w < 0.05 || w > 0.7 : w < 0.3; });
    if (mis) status = ["bad", "⚠", tyreClass(mis.comp) === "D" ? `V${mis.l}: slicks con la pista mojada. Pon intermedios o lluvia.` : (FC.wl[mis.l] || 0) > 0.6 ? `V${mis.l}: demasiada agua para intermedios. Pon neumáticos de lluvia.` : `V${mis.l}: neumáticos de lluvia en pista seca: se recalientan.`];
  }
  if (S.dry) status = ["bad", "⚠", `Te quedas sin gasolina en la vuelta ${S.dry}. Sube la carga o usa LOW.`];
  if (!S.rule) status = ["bad", "⚠", "Falta un segundo compuesto: sin él, descalificación."];
  const sel = Math.max(0, Math.min(MENU.sel[k] || 0, P.stints.length - 1)); MENU.sel[k] = sel;
  const sst = P.stints[sel], sa = sel ? P.stints[sel - 1].to : 0, slast = sel === P.stints.length - 1;
  const btns = (act, opts, cur, lab, title) => opts.map(o => `<button data-act="${act}" data-j="${sel}" data-v="${o}" aria-pressed="${o === cur}" title="${title(o)}" aria-label="${title(o)}">${lab(o)}</button>`).join("");
  const sw = S.maxW[sel], swc = sw > 0.85 ? "var(--red)" : sw > 0.755 ? "var(--amber)" : "var(--green)", nLaps = sst.to - sa;
  const seg = (act, opts, cur, lab, title, cls) => `<div class="sg ${cls || ""}" role="group">${opts.map(o => `<button data-act="${act}" data-j="${sel}" data-v="${o}" aria-pressed="${o === cur}" title="${title(o)}" aria-label="${title(o)}">${lab(o)}</button>`).join("")}</div>`;
  const editor = `<div class="sted2" style="--cc:${COMP[sst.comp].col}">`
    + `<div class="s2h"><span class="s2n">STINT <b>${sel + 1}</b></span><span class="s2r">V${sa + 1}<i>→</i>V${sst.to}</span><span class="s2l">${nLaps} v</span>`
    + `<span class="s2w"><s><i style="width:${Math.min(100, sw * 100).toFixed(0)}%;background:${swc}"></i></s><b style="color:${swc}">${Math.round(sw * 100)}%</b></span></div>`
    + `<div class="s2g">`
    + `<span class="s2k">TYRE</span>${seg("cmp", ["S", "M", "H", "I", "W"], sst.comp, o => tyreImg(o), o => COMP[o].name, "sg-ty")}`
    + `<span class="s2k">PACE</span>${seg("pace", ["soft", "bal", "agg"], sst.pace, chevSVG, o => PACE_NAME[o], "sg-pc")}`
    + `<span class="s2k">MIX</span>${seg("mix", ["lean", "std", "rich"], sst.mix, o => MIX_TXT[o], o => "Mezcla " + MIX_TXT[o], "sg-mx")}`
    + `<span class="s2k">${slast ? "END" : "BOX"}</span>`
    + (slast ? `<div class="s2box fin"><b>META V${L}</b></div>`
             : `<div class="s2box"><button data-act="dec" data-j="${sel}" aria-label="Parar una vuelta antes">−</button><b>V${sst.to}</b><button data-act="inc" data-j="${sel}" aria-label="Parar una vuelta después">+</button></div>`)
    + `</div></div>`;
  const table = `<table class="stt"><thead><tr><th>Stint</th><th>Neum.</th><th>Vueltas</th><th>Ritmo</th><th>Mezcla</th><th>Media</th><th>Desg.</th></tr></thead><tbody>`
    + P.stints.map((st, j) => {
      const a = j ? P.stints[j - 1].to : 0, ls = S.laps.filter(x => x.j === j && x.l > 1), avg = ls.length ? ls.reduce((t, x) => t + x.lt, 0) / ls.length : 0, wear = S.maxW[j];
      return `<tr data-sel="${j}" class="${j === sel ? "on" : ""}"><td>${j + 1}</td><td>${tyreImg(st.comp, "sm")}${st.comp}</td><td>${a + 1}–${st.to}<em>${st.to - a}v</em></td><td>${chevSVG(st.pace)}</td>`
        + `<td style="color:${MIX_COL[st.mix]}">${MIX_TXT[st.mix]}</td><td>${fmt(avg)}</td><td style="color:${wear > 0.85 ? "var(--red)" : wear > 0.755 ? "var(--amber)" : "var(--green)"}">${Math.round(wear * 100)}%</td></tr>`;
    }).join("") + `</tbody></table>`;
  const hs = x => hash01(c.idx * 13.7 + x * 3.3);
  const parts = SPEC_PARTS.map(([nm, id, grp], j) => {
    const cond = grp === "pu" ? Math.max(55, 100 - c.puKm / 5200 * 38 - hs(j) * 4) : grp === "gb" ? Math.max(55, 100 - c.gbKm / 6000 * 35 - hs(j) * 3) : 86 + hs(j) * 14;
    const spec = grp === "aero" ? `Spec ${1 + Math.floor(hs(j + 20) * 3.2)}` : grp === "pu" ? `${1 + Math.floor(hs(j + 30) * 3)}/${id === "ICE" || id === "TC" ? 4 : 3}` : `${Math.round(c.gbKm).toLocaleString("es-ES")} km`;
    const col = cond > 85 ? "var(--green)" : cond > 70 ? "var(--amber)" : "var(--red)";
    return `<tr><td class="n">${nm}</td><td class="sp">${spec}</td><td><span class="cb"><s><i style="width:${cond.toFixed(0)}%;background:${col}"></i></s>${cond.toFixed(0)} %</span></td><td class="lk">BLOQ.</td></tr>`;
  }).join("");
  const setup = (WK ? SETUP_P.map((P, j) => [P.name, pVal(j, WK.car[k].p[j]), P.a, P.b, P.u, P.d]) : [["Alerón delantero", 24 + hs(40) * 14, 18, 40, "°", 1], ["Alerón trasero", 8 + hs(41) * 8, 4, 18, "°", 1], ["Altura delantera", 28 + hs(42) * 6, 24, 40, " mm", 0], ["Altura trasera", 70 + hs(43) * 10, 60, 90, " mm", 0],
    ["Rigidez susp. del.", 4 + hs(44) * 5, 1, 11, "", 0], ["Diferencial", 50 + hs(45) * 12, 40, 70, " %", 0], ["Reparto frenada", 55 + hs(46) * 4, 50, 62, " %", 1]])
    .map(([k2, v, a, b, u, d]) => `<div class="su"><span>${k2}</span><div class="tk"><i style="left:${((v - a) / (b - a) * 100).toFixed(1)}%"></i></div><b>${v.toFixed(d)}${u}</b></div>`).join("");
  const confV = WK ? confOf(k) : 96, confT = confV >= 88 ? "EXCELENTE" : confV >= 75 ? "ALTA" : confV >= 62 ? "MEDIA" : "BAJA";
  el.innerHTML = `<section class="pn"><div class="pdh"><span class="num" style="border-color:${c.col};color:${c.col};background:${c.col}1f">${c.num}</span><div class="who"><b>${c.name}</b><span>${team.name} · Coche ${k + 1}</span></div><div class="gp"><span>Salida</span><b>P${c.slot + 1}</b></div></div>
      <div class="conf2"><div class="ch"><span class="lab">Confianza del piloto</span><b>${confT}</b><em>${confV}<small>/100</small></em></div>
        <div class="cbar"><div class="fill" style="width:${confV}%;background-size:${(10000 / confV).toFixed(1)}% 100%"></div><i class="mk" style="left:${confV}%"></i></div>
        <div class="cscale"><span>Baja</span><span>Media</span><span>Alta</span><span>Excelente</span></div></div></section>
    <section class="pn"><h3><span>Estrategia de neumáticos</span><span>${nStops} ${nStops === 1 ? "parada" : "paradas"} · ${P.stints.map(x => x.comp).join("–")}</span></h3>
      <div class="shead"><div class="seq">${P.stints.map(st => tyreImg(st.comp)).join("<i>›</i>")}</div>
        <div class="presets"><button class="rec" data-act="rec" aria-pressed="${samePlan(P, RECS[k])}">★ Recomendada</button><button data-act="st1">1P</button><button data-act="st2">2P</button><button data-act="st3">3P</button></div></div>
      <div class="cvw ch1"><canvas class="cvTyre" aria-label="Estrategia: toca un stint para editarlo y arrastra los rombos para mover las paradas"></canvas></div>
      ${editor}
      <div class="kpis k4"><div class="kpi"><span>Tiempo estimado</span><b>${fmtH(S.total)}</b></div><div class="kpi"><span>Δ recomendada</span><b style="color:${dt <= 0.05 ? "var(--green)" : "var(--amber)"}">${Math.abs(dt) < 0.05 ? "= 0,0 s" : fmtS(dt)}</b></div>
        <div class="kpi"><span>Vuelta media</span><b>${fmt(S.total / L)}</b></div><div class="kpi"><span>En boxes</span><b>${(nStops * STRAT.PIT_LOSS).toFixed(1).replace(".", ",")} s</b></div></div>
      <div class="status ${status[0]}"><span>${status[1]}</span><span>${status[2]}</span></div>
      ${table}
      <div class="padd"><button data-act="add"${P.stints.length >= 4 ? " disabled" : ""}>+ Añadir parada</button><button data-act="del"${P.stints.length <= 1 ? " disabled" : ""}>− Quitar parada</button></div></section>
    <section class="pn"><h3><span>Combustible</span><span>${per.toFixed(2).replace(".", ",")} kg por vuelta a STD</span></h3>
      <div class="fuelc"><div class="fh"><div><span class="k">Carga inicial</span><b>${P.fuel.toFixed(1).replace(".", ",")} kg</b></div><span class="eq">≈ ${(P.fuel / per).toFixed(1).replace(".", ",")} vueltas a STD</span><button data-act="fmin">Ajustar a la meta</button></div>
        <input class="rg" type="range" data-act="fuel" min="20" max="${FUEL_MAX}" step="0.5" value="${P.fuel}" aria-label="Carga de combustible"></div>
      <div class="cvw ch2"><canvas class="cvFuel" aria-label="Combustible: arrastra el punto para la carga inicial y toca un stint para cambiar su mezcla"></canvas></div>
      <div class="kpis"><div class="kpi"><span>Sobrante en meta</span><b style="color:${S.fuelEnd >= 0 ? "var(--green)" : "var(--red)"}">${S.fuelEnd >= 0 ? "+" : "−"}${Math.abs(S.fuelEnd).toFixed(1).replace(".", ",")} kg</b></div><div class="kpi"><span>Peso en la salida</span><b>+${(P.fuel * 0.000375 * STRAT.T).toFixed(1).replace(".", ",")} s/v</b></div></div></section>
    <section class="pn"><h3><span>Car spec · piezas</span><span>Parc fermé</span></h3>
      <div class="pfm"><span class="lk"><svg width="10" height="11" viewBox="0 0 10 11" aria-hidden="true"><rect x="1" y="5" width="8" height="6" rx="1" fill="currentColor"/><path d="M3 5V3.3a2 2 0 0 1 4 0V5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>Parc fermé</span>Piezas y reglaje bloqueados desde la clasificación</div>
      <div class="specg"><div class="cvw radar"><canvas class="cvRadar"></canvas></div><div class="setup">${setup}</div></div>
      <table class="parts"><thead><tr><th>Pieza</th><th>Spec / uso</th><th>Estado</th><th></th></tr></thead><tbody>${parts}</tbody></table></section>`;
  requestAnimationFrame(() => drawPrepCharts(k));
  bindStrategyChart(k); bindFuelChart(k);
}
const CH = { grid: "rgba(255,255,255,.07)", axis: "#a7b1be", ink: "#eef1f5" };
function pill(g, x, y, text, bg, fg, align) {   // small rounded label
  g.font = `800 9px ${DISP}`; const w = g.measureText(text).width + 12, h = 16;
  let lx = align === "right" ? x - w : align === "left" ? x : x - w / 2; lx = Math.max(2, Math.min(g.canvas.clientWidth - w - 2, lx));
  g.fillStyle = bg; g.beginPath(); g.roundRect ? g.roundRect(lx, y - h / 2, w, h, 8) : g.rect(lx, y - h / 2, w, h); g.fill();
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, lx + w / 2, y + 0.5);
}
// the strategy chart: tyre life of every stint, race pace, the stint timeline with draggable box laps
function drawTyreChart(k) {
  const el = document.querySelector(`.pcol[data-k="${k}"]`), cv = el && el.querySelector(".cvTyre"); if (!cv) return;
  const c = cars[k], P = PLANS[k], S = simPlan(c.skill, P), L = RACE_LAPS, sel = MENU.sel[k] || 0, drag = MENU.drag && MENU.drag.k === k ? MENU.drag.j : -1;
  const { g, w, h } = cvFit(cv); if (w < 100) return;
  const Lp = 38, Rp = 44, T = 24, PB = h - 70, TB0 = h - 54, TB1 = h - 30, X = l => Lp + (w - Lp - Rp) * l / L, Y = life => T + (PB - T) * (1 - life);
  cv._geo = { Lp, Rp, w, L, TB0, TB1 };
  const st0 = j => j ? P.stints[j - 1].to : 0;
  if (FC && FC.wl.length > L) {                     // forecast: water on the racing line (blue) and the sky lap by lap
    for (let l = 1; l <= L; l++) { const wl = FC.wl[l]; if (wl > 0.04) { g.fillStyle = `rgba(60,140,255,${(0.05 + 0.24 * Math.min(1, wl / 0.7)).toFixed(3)})`; g.fillRect(X(l - 1), T - 6, X(l) - X(l - 1) + 0.5, PB - T + 6); } }
    if (FC.s.some((x, l) => l && l <= L && x >= 1)) for (let l = 1; l <= L; l++) { g.fillStyle = WX_STATES[FC.s[l]].col; g.fillRect(X(l - 1), 1, X(l) - X(l - 1) + 0.5, 3); }
  }
  // selected stint
  g.fillStyle = "rgba(238,241,245,.055)"; g.fillRect(X(st0(sel)), T - 6, X(P.stints[sel].to) - X(st0(sel)), TB1 - T + 6);
  // zones and grid
  g.fillStyle = "rgba(255,42,60,.10)"; g.fillRect(Lp, Y(0.15), w - Lp - Rp, Y(0) - Y(0.15));
  g.font = `600 9px ${MONO}`; g.textBaseline = "middle";
  for (const v of [0, 0.25, 0.5, 0.75, 1]) { g.fillStyle = v === 0.5 || v === 1 || v === 0 ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.04)"; g.fillRect(Lp, Y(v), w - Lp - Rp, 1); g.textAlign = "right"; g.fillStyle = CH.axis; g.fillText(Math.round(v * 100) + "%", Lp - 6, Y(v)); }
  for (let l = 0; l <= L; l += (L > 40 ? 5 : L > 15 ? 5 : 1)) { g.fillStyle = l % 10 === 0 ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.022)"; g.fillRect(X(l), T, 1, PB - T); }
  g.setLineDash([5, 4]); g.strokeStyle = "rgba(255,170,50,.8)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(Lp, Y(0.25)); g.lineTo(w - Rp, Y(0.25)); g.stroke(); g.setLineDash([]);
  g.textAlign = "left"; g.font = `800 8px ${DISP}`; g.fillStyle = "rgba(255,190,90,.95)"; g.fillText("LÍMITE 25 %", Lp + 6, Y(0.25) + 9);
  g.fillStyle = "rgba(255,120,130,.85)"; g.fillText("PINCHAZO", Lp + 6, Y(0.06));
  // tyre life per stint
  P.stints.forEach((st, j) => {
    const a = st0(j), pts = [[X(a), Y(1)]].concat(S.laps.filter(x => x.j === j).map(x => [X(x.l), Y(Math.max(0, 1 - x.wear))])), col = COMP[st.comp].col;
    g.beginPath(); g.moveTo(pts[0][0], Y(0)); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(pts[pts.length - 1][0], Y(0)); g.closePath();
    const gr = g.createLinearGradient(0, T, 0, Y(0)); gr.addColorStop(0, col + (j === sel ? "66" : "40")); gr.addColorStop(1, col + "06"); g.fillStyle = gr; g.fill();
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = col; g.lineWidth = j === sel ? 3 : 2.2; g.lineJoin = "round"; g.stroke();
    const [ex, ey] = pts[pts.length - 1]; g.beginPath(); g.arc(ex, ey, 3.5, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.lineWidth = 2; g.strokeStyle = "#1f2832"; g.stroke();
    pill(g, ex - 4, Math.min(PB - 8, ey + 13), Math.round((1 - S.maxW[j]) * 100) + "%", "rgba(10,13,17,.88)", CH.ink, "right");
  });
  // race pace (secondary axis): lap time from lap 2, faster = higher
  const lt = S.laps.filter(x => x.l > 1), lo = Math.min(...lt.map(x => x.lt)), hi = Math.max(...lt.map(x => x.lt)), span = Math.max(0.6, hi - lo);
  const Yt = t => T + 4 + (PB - T - 8) * (t - lo) / span;
  g.beginPath(); lt.forEach((x, i) => { const px = X(x.l - 0.5), py = Yt(x.lt); i && !S.laps[x.l - 2].pit ? g.lineTo(px, py) : g.moveTo(px, py); });
  g.strokeStyle = "rgba(200,214,230,.75)"; g.lineWidth = 1.2; g.setLineDash([2, 2]); g.stroke(); g.setLineDash([]);
  g.textAlign = "left"; g.font = `600 8.5px ${MONO}`; g.fillStyle = "#c8d6e6";
  g.fillText(fmt(lo).slice(0, -2), w - Rp + 5, Yt(lo)); g.fillText(fmt(hi).slice(0, -2), w - Rp + 5, Yt(hi));
  g.font = `800 7.5px ${DISP}`; g.fillStyle = CH.axis; g.fillText("RITMO", w - Rp + 5, T - 8);
  // box laps through the chart
  P.stints.forEach((st, j) => { if (j === P.stints.length - 1) return; const x = X(st.to);
    g.fillStyle = j === drag ? "#ffd21f" : "rgba(238,241,245,.45)"; g.fillRect(x - 0.5, T - 4, 1.5, TB1 - T + 4);
    pill(g, x, T - 13, "BOX V" + st.to, j === drag ? "#ffd21f" : CH.ink, "#0d1014"); });
  // stint timeline with tyre icons and draggable handles
  P.stints.forEach((st, j) => {
    const x0 = X(st0(j)) + 1, x1 = X(st.to) - 1, col = COMP[st.comp].col;
    g.fillStyle = col; g.globalAlpha = j === sel ? 1 : 0.78; g.beginPath(); g.roundRect ? g.roundRect(x0, TB0, x1 - x0, TB1 - TB0, 5) : g.rect(x0, TB0, x1 - x0, TB1 - TB0); g.fill(); g.globalAlpha = 1;
    if (j === sel) { g.lineWidth = 2; g.strokeStyle = "#eef1f5"; g.stroke(); }
    drawTyre(g, st.comp, x0 + 12, (TB0 + TB1) / 2, 20);
    if (x1 - x0 > 74) { g.font = `800 9px ${DISP}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillStyle = st.comp === "S" ? "#fff" : "#0d1014"; g.fillText(`V${st0(j) + 1}–${st.to} · ${st.to - st0(j)}v`, x0 + 26, (TB0 + TB1) / 2 + 0.5); }
  });
  P.stints.forEach((st, j) => { if (j === P.stints.length - 1) return; const x = X(st.to), y = (TB0 + TB1) / 2, r = j === drag ? 9 : 7;
    g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fillStyle = j === drag ? "#ffd21f" : "#eef1f5"; g.fill(); g.lineWidth = 2; g.strokeStyle = "#0d1014"; g.stroke(); });
  g.fillStyle = CH.axis; g.font = `600 8.5px ${MONO}`; g.textAlign = "center"; g.textBaseline = "middle";
  for (let l = 0; l <= L; l += (L > 40 ? 10 : L > 15 ? 5 : 2)) g.fillText(l, X(l), h - 12);
  g.textAlign = "right"; g.font = `800 8px ${DISP}`; g.fillText("VUELTA", w - 4, h - 12);
}
function bindFuelChart(k) {
  const el = document.querySelector(`.pcol[data-k="${k}"]`), cv = el && el.querySelector(".cvFuel"); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const fuelAt = y => { const G = cv._geo; return Math.max(20, Math.min(FUEL_MAX, Math.round((1 - (y - G.T) / (G.h - G.T - G.B)) * G.top * 2) / 2)); };
  cv.addEventListener("pointerdown", e => {
    const G = cv._geo; if (!G) return; const [x, y] = pos(e), X = l => G.Lp + (G.w - G.Lp - G.Rp) * l / G.L;
    const yS = G.T + (G.h - G.T - G.B) * (1 - PLANS[k].fuel / G.top);
    if (Math.hypot(x - X(0), y - yS) < 26 || x < X(0) + 18) {          // grab the start load
      MENU.drag = { k, fuel: true }; cv.setPointerCapture(e.pointerId); e.preventDefault(); PLANS[k].fuel = fuelAt(y); drawPrepCharts(k); return;
    }
    const l = Math.round((x - G.Lp) / (G.w - G.Lp - G.Rp) * G.L), P = PLANS[k];
    let j = P.stints.findIndex(st => l <= st.to); if (j < 0) j = P.stints.length - 1;
    const order = ["lean", "std", "rich"]; P.stints[j].mix = order[(order.indexOf(P.stints[j].mix) + 1) % 3]; MENU.sel[k] = j;
    renderPrep(k); updateMenuInfo();
  });
  cv.addEventListener("pointermove", e => { const D = MENU.drag; if (!D || D.k !== k || !D.fuel) return; const f = fuelAt(pos(e)[1]); if (f !== PLANS[k].fuel) { PLANS[k].fuel = f; drawPrepCharts(k); } });
  const end = () => { const D = MENU.drag; if (!D || D.k !== k || !D.fuel) return; MENU.drag = null; renderPrep(k); updateMenuInfo(); };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
}
function bindStrategyChart(k) {
  const el = document.querySelector(`.pcol[data-k="${k}"]`), cv = el && el.querySelector(".cvTyre"); if (!cv) return;
  const lapAt = x => { const G = cv._geo; return G ? Math.round((x - G.Lp) / (G.w - G.Lp - G.Rp) * G.L) : 0; };
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener("pointerdown", e => {
    const G = cv._geo, P = PLANS[k]; if (!G) return;
    const [x] = pos(e), X = l => G.Lp + (G.w - G.Lp - G.Rp) * l / G.L;
    let best = -1, bd = 16;
    P.stints.forEach((st, j) => { if (j < P.stints.length - 1) { const d = Math.abs(X(st.to) - x); if (d < bd) { bd = d; best = j; } } });
    if (best >= 0) { MENU.drag = { k, j: best, moved: false }; MENU.sel[k] = best; cv.setPointerCapture(e.pointerId); e.preventDefault(); drawTyreChart(k); return; }
    const l = lapAt(x); let j = P.stints.findIndex(st => l <= st.to); if (j < 0) j = P.stints.length - 1;
    if (j !== MENU.sel[k]) { MENU.sel[k] = j; renderPrep(k); }
  });
  cv.addEventListener("pointermove", e => {
    const D = MENU.drag; if (!D || D.k !== k) return;
    const P = PLANS[k], a = D.j ? P.stints[D.j - 1].to : 0, b = P.stints[D.j + 1].to, l = Math.max(a + 1, Math.min(b - 1, lapAt(pos(e)[0])));
    if (l !== P.stints[D.j].to) { P.stints[D.j].to = l; D.moved = true; drawTyreChart(k); }
  });
  const end = () => { const D = MENU.drag; if (!D || D.k !== k) return; MENU.drag = null; renderPrep(k); updateMenuInfo(); };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
}
function drawPrepCharts(k) {
  const el = document.querySelector(`.pcol[data-k="${k}"]`); if (!el || getComputedStyle(el).display === "none") return;
  const c = cars[k], P = PLANS[k], S = simPlan(c.skill, P), L = RACE_LAPS, stp = L > 40 ? 10 : L > 15 ? 5 : 2;
  drawTyreChart(k);
  // ---- fuel: what is in the tank lap by lap, the mix of each stint behind it, and what is left at the flag
  { const cv = el.querySelector(".cvFuel"); if (!cv) return; const { g, w, h } = cvFit(cv);
    const top = FUEL_MAX, Lp = 40, Rp = 14, T = 26, B = 22, X = l => Lp + (w - Lp - Rp) * l / L, Y = f => T + (h - T - B) * (1 - Math.max(0, f) / top);
    // stint bands tinted by mix
    P.stints.forEach((st, j) => {
      const a = j ? P.stints[j - 1].to : 0, x0 = X(a), x1 = X(st.to);
      g.fillStyle = st.mix === "lean" ? "rgba(34,211,138,.10)" : st.mix === "rich" ? "rgba(255,106,61,.12)" : "rgba(255,255,255,.035)"; g.fillRect(x0, T - 6, x1 - x0, Y(0) - T + 6);
      if (j) { g.fillStyle = "rgba(238,241,245,.25)"; g.fillRect(x0, T - 6, 1, Y(0) - T + 6); }
      if (x1 - x0 > 34) { g.font = `800 8.5px ${DISP}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillStyle = MIX_COL[st.mix]; g.fillText(MIX_TXT[st.mix], x0 + 6, T + 4); }
    });
    g.font = `600 9px ${MONO}`; g.textBaseline = "middle"; g.textAlign = "right";
    for (let f = 0; f <= top; f += top > 60 ? 40 : 20) { g.fillStyle = CH.grid; g.fillRect(Lp, Y(f), w - Lp - Rp, 1); g.fillStyle = CH.axis; g.fillText(f + " kg", Lp - 6, Y(f)); }
    // the tank
    const pts = [[X(0), Y(P.fuel)]].concat(S.laps.map(x => [X(x.l), Y(x.fuel)]));
    g.beginPath(); g.moveTo(pts[0][0], Y(0)); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(pts[pts.length - 1][0], Y(0)); g.closePath();
    const gr = g.createLinearGradient(0, T, 0, Y(0)); gr.addColorStop(0, "rgba(77,170,255,.45)"); gr.addColorStop(1, "rgba(77,170,255,.04)"); g.fillStyle = gr; g.fill();
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = "#5cb4ff"; g.lineWidth = 2.6; g.lineJoin = "round"; g.stroke();
    // empty-tank line, start load and the result at the flag
    g.setLineDash([5, 4]); g.strokeStyle = "rgba(255,90,100,.8)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(Lp, Y(0)); g.lineTo(w - Rp, Y(0)); g.stroke(); g.setLineDash([]);
    cv._geo = { Lp, Rp, T, B, w, h, top, L };
    const dragF = MENU.drag && MENU.drag.k === k && MENU.drag.fuel;
    g.beginPath(); g.arc(X(0), Y(P.fuel), dragF ? 9 : 7, 0, Math.PI * 2); g.fillStyle = dragF ? "#ffd21f" : "#eef1f5"; g.fill(); g.lineWidth = 2.5; g.strokeStyle = "#0d1014"; g.stroke();
    g.fillStyle = "#0d1014"; g.fillRect(X(0) - 3, Y(P.fuel) - 0.75, 6, 1.5); g.fillRect(X(0) - 0.75, Y(P.fuel) - 3, 1.5, 6);
    pill(g, X(0) + 12, Y(P.fuel) - (Y(P.fuel) < T + 14 ? -12 : 12), P.fuel.toFixed(1).replace(".", ",") + " kg", dragF ? "#ffd21f" : "rgba(10,13,17,.85)", dragF ? "#0d1014" : CH.ink, "left");
    g.textAlign = "right"; g.textBaseline = "middle"; g.font = `700 8.5px ${DISP}`; g.fillStyle = "#7f8b99"; g.fillText("ARRASTRA ● · TOCA UN STINT PARA LA MEZCLA", w - Rp, T - 14);
    if (S.dry) {
      const x = X(S.dry); g.beginPath(); g.arc(x, Y(0), 5, 0, Math.PI * 2); g.fillStyle = "#ff2a3c"; g.fill();
      pill(g, x, Y(0) - 14, "SIN GASOLINA · V" + S.dry, "#ff2a3c", "#fff", "right");
    } else {
      const x = X(L), y = Y(S.fuelEnd); g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fillStyle = "#22d38a"; g.fill(); g.lineWidth = 2; g.strokeStyle = "#1f2832"; g.stroke();
      pill(g, x - 8, y - 14, "META +" + S.fuelEnd.toFixed(1).replace(".", ",") + " kg", "#22d38a", "#05140d", "right");
    }
    g.fillStyle = CH.axis; g.font = `600 8.5px ${MONO}`; g.textAlign = "center";
    for (let l = 0; l <= L; l += stp) g.fillText(l, X(l), h - 8);
  }
  // ---- performance radar (team pace with a small per-car variation)
  { const cv = el.querySelector(".cvRadar"); if (!cv) return; const { g, w, h } = cvFit(cv);
    const base = 72 + (c.skill + 0.0104) / 0.0104 * 22, hs = x => hash01(c.idx * 5.1 + x * 7.7);
    const ax = [["Carga aero", base + hs(1) * 6], ["Velocidad punta", base + hs(2) * 6 - 2], ["Potencia", base + hs(3) * 5], ["Tracción", base + hs(4) * 6 - 1], ["Neumáticos", base + hs(5) * 7 - 3], ["Fiabilidad", 80 + hs(6) * 15]];
    const cx = w / 2, cy = h / 2 + 3, R = Math.min(w * 0.36, h / 2 - 34), n = ax.length, A = i => -Math.PI / 2 + i * Math.PI * 2 / n;
    for (let r = 0.25; r <= 1.001; r += 0.25) { g.beginPath(); for (let i = 0; i <= n; i++) { const a = A(i % n); i ? g.lineTo(cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r) : g.moveTo(cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r); } g.strokeStyle = r === 1 ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.07)"; g.lineWidth = 1; g.stroke(); }
    const v = i => Math.max(0, Math.min(100, ax[i][1])) / 100;
    g.beginPath(); for (let i = 0; i <= n; i++) { const a = A(i % n), r = R * v(i % n); i ? g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    g.fillStyle = c.col + "4d"; g.fill(); g.strokeStyle = c.col; g.lineWidth = 2.2; g.stroke();
    g.textAlign = "center"; g.textBaseline = "middle";
    ax.forEach(([t, val], i) => { const a = A(i), x = cx + Math.cos(a) * (R + 22), y = cy + Math.sin(a) * (R + 16);
      g.font = `800 8.5px ${DISP}`; g.fillStyle = CH.axis; g.fillText(t.toUpperCase(), x, y - 6); g.font = `600 11px ${MONO}`; g.fillStyle = CH.ink; g.fillText(Math.round(val), x, y + 7);
      const r = R * v(i); g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 0, Math.PI * 2); g.fillStyle = c.col; g.fill(); });
  }
}
// editing the plan
function prepEdit(k, act, j, v) {
  const P = PLANS[k], L = RACE_LAPS, c = cars[k];
  if (act === "rec") PLANS[k] = JSON.parse(JSON.stringify(RECS[k]));
  else if (act === "st1" || act === "st2" || act === "st3") { const p = recommend(c.skill, +act[2]); p.fuel = P.fuel; PLANS[k] = p; MENU.sel[k] = 0; }
  else if (act === "cmp") P.stints[j].comp = v;
  else if (act === "pace") P.stints[j].pace = v;
  else if (act === "mix") P.stints[j].mix = v;
  else if (act === "to" || act === "dec" || act === "inc") {
    const a = j ? P.stints[j - 1].to : 0, b = P.stints[j + 1].to, nv = act === "to" ? +v : P.stints[j].to + (act === "inc" ? 1 : -1);
    P.stints[j].to = Math.max(a + 1, Math.min(b - 1, nv));
  } else if (act === "add" && P.stints.length < 4) {   // split the longest stint
    let jj = 0, best = -1; P.stints.forEach((st, i) => { const len = st.to - (i ? P.stints[i - 1].to : 0); if (len > best) { best = len; jj = i; } });
    if (best >= 2) { const a = jj ? P.stints[jj - 1].to : 0, mid = Math.round(a + best / 2), st = P.stints[jj]; P.stints.splice(jj, 0, { comp: st.comp === "H" ? "M" : "H", to: mid, pace: st.pace, mix: st.mix }); }
  } else if (act === "del" && P.stints.length > 1) { const last = P.stints.pop(); P.stints[P.stints.length - 1].to = L; }
  else if (act === "fuel") P.fuel = Math.max(20, Math.min(FUEL_MAX, +v));
  else if (act === "fmin") { const S = simPlan(c.skill, P); P.fuel = Math.min(FUEL_MAX, Math.ceil((P.fuel - S.fuelEnd + 0.25 * fuelLap("bal", "std")) * 2) / 2); }
  renderPrep(k); updateMenuInfo();
}
document.querySelectorAll(".pcol").forEach(el => {
  const k = +el.dataset.k;
  el.addEventListener("click", e => { const tr = e.target.closest("tr[data-sel]"); if (tr) { MENU.sel[k] = +tr.dataset.sel; renderPrep(k); return; } const b = e.target.closest("button[data-act]"); if (!b || b.disabled) return; prepEdit(k, b.dataset.act, +b.dataset.j, b.dataset.v); });
  el.addEventListener("change", e => { const r = e.target.closest("input[data-act]"); if (r) prepEdit(k, r.dataset.act, +r.dataset.j, r.value); });
  el.addEventListener("input", e => {             // live value while dragging, full redraw on release
    const r = e.target.closest("input[data-act]"); if (!r) return;
    if (r.dataset.act === "fuel") { const b = el.querySelector(".fh b"); if (b) b.textContent = (+r.value).toFixed(1).replace(".", ",") + " kg"; }
    else { const s = r.parentElement.querySelector(".bx"); if (s) s.textContent = "BOX V" + r.value; }
  });
});

