// =====================================================================================================
// ---------- front end: title screen ("press any button"), main menu, options, team selection ----------
// =====================================================================================================
const L = (es, en) => OPT.lang === "en" ? en : es;
const FLAG = {
  ES: '<rect width="30" height="20" fill="#c60b1e"/><rect y="5" width="30" height="10" fill="#ffc400"/>',
  FR: '<rect width="10" height="20" fill="#0055a4"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ef4135"/>',
  IT: '<rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce2b37"/>',
  DE: '<rect width="30" height="7" fill="#000"/><rect y="6.6" width="30" height="7" fill="#dd0000"/><rect y="13.3" width="30" height="6.7" fill="#ffce00"/>',
  NL: '<rect width="30" height="7" fill="#ae1c28"/><rect y="6.6" width="30" height="7" fill="#fff"/><rect y="13.3" width="30" height="6.7" fill="#21468b"/>',
  MC: '<rect width="30" height="10" fill="#ce1126"/><rect y="10" width="30" height="10" fill="#fff"/>',
  JP: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>',
  FI: '<rect width="30" height="20" fill="#fff"/><rect x="8" width="5" height="20" fill="#003580"/><rect y="7.5" width="30" height="5" fill="#003580"/>',
  AR: '<rect width="30" height="20" fill="#74acdf"/><rect y="6.6" width="30" height="6.8" fill="#fff"/><circle cx="15" cy="10" r="2.2" fill="#f6b40e"/>',
  BR: '<rect width="30" height="20" fill="#009c3b"/><path d="M15 2.5 27 10 15 17.5 3 10z" fill="#ffdf00"/><circle cx="15" cy="10" r="4.2" fill="#002776"/>',
  MX: '<rect width="10" height="20" fill="#006847"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce1126"/><circle cx="15" cy="10" r="2" fill="#8b5a2b"/>',
  TH: '<rect width="30" height="20" fill="#a51931"/><rect y="3.3" width="30" height="13.4" fill="#f4f5f8"/><rect y="6.7" width="30" height="6.6" fill="#2d2a4a"/>',
  GB: '<rect width="30" height="20" fill="#012169"/><path d="M0 0 30 20M30 0 0 20" stroke="#fff" stroke-width="4"/><path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="3.4"/>',
  AU: '<rect width="30" height="20" fill="#012169"/><g transform="scale(.5)"><path d="M0 0 30 20M30 0 0 20" stroke="#fff" stroke-width="4"/><path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="3.4"/></g><g fill="#fff"><circle cx="7.5" cy="15.5" r="1.8"/><circle cx="23" cy="4" r="1"/><circle cx="26" cy="9" r="1"/><circle cx="20.5" cy="10" r="1"/><circle cx="23" cy="16" r="1.1"/></g>',
  NZ: '<rect width="30" height="20" fill="#012169"/><g transform="scale(.5)"><path d="M0 0 30 20M30 0 0 20" stroke="#fff" stroke-width="4"/><path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="3.4"/></g><g fill="#c8102e" stroke="#fff" stroke-width=".5"><circle cx="23" cy="4" r="1.1"/><circle cx="26.5" cy="9" r="1.1"/><circle cx="20" cy="9.5" r="1"/><circle cx="23" cy="16" r="1.2"/></g>',
  CA: '<rect width="30" height="20" fill="#fff"/><rect width="7.5" height="20" fill="#d52b1e"/><rect x="22.5" width="7.5" height="20" fill="#d52b1e"/><path d="M15 4.2l1 2 1.6-.6-.6 3.4 1.9-1.9.5 1.1 1.9-.4-.7 2.1.9.5-3.3 2.6.4 1.2-3.1-.4.1 3.2h-1.2l.1-3.2-3.1.4.4-1.2-3.3-2.6.9-.5-.7-2.1 1.9.4.5-1.1 1.9 1.9-.6-3.4 1.6.6z" fill="#d52b1e"/>',
  DK: '<rect width="30" height="20" fill="#c8102e"/><rect x="9" width="3.5" height="20" fill="#fff"/><rect y="8.25" width="30" height="3.5" fill="#fff"/>',
  CN: '<rect width="30" height="20" fill="#de2910"/><path d="M5.5 2.6l1 3h3.1l-2.5 1.8 1 3-2.6-1.9-2.5 1.9 1-3-2.6-1.8h3.2z" fill="#ffde00"/>',
  CH: '<rect width="30" height="20" fill="#d52b1e"/><rect x="13" y="4" width="4" height="12" fill="#fff"/><rect x="9" y="8" width="12" height="4" fill="#fff"/>',
  PT: '<rect width="30" height="20" fill="#da291c"/><rect width="12" height="20" fill="#046a38"/><circle cx="12" cy="10" r="3.8" fill="#ffe900"/><circle cx="12" cy="10" r="2.4" fill="#da291c"/><rect x="10.9" y="8.6" width="2.2" height="2.8" rx=".5" fill="#fff"/>',
  AT: '<rect width="30" height="20" fill="#c8102e"/><rect y="6.67" width="30" height="6.66" fill="#fff"/>',
  BE: '<rect width="10" height="20" fill="#1a1a1a"/><rect x="10" width="10" height="20" fill="#fdda24"/><rect x="20" width="10" height="20" fill="#ef3340"/>',
  SE: '<rect width="30" height="20" fill="#006aa7"/><rect x="9" width="3.6" height="20" fill="#fecc00"/><rect y="8.2" width="30" height="3.6" fill="#fecc00"/>',
  NO: '<rect width="30" height="20" fill="#ba0c2f"/><rect x="8" width="6" height="20" fill="#fff"/><rect y="7" width="30" height="6" fill="#fff"/><rect x="9.5" width="3" height="20" fill="#00205b"/><rect y="8.5" width="30" height="3" fill="#00205b"/>',
  PL: '<rect width="30" height="20" fill="#dc143c"/><rect width="30" height="10" fill="#fff"/>',
  IE: '<rect width="10" height="20" fill="#169b62"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ff883e"/>',
  AE: '<rect width="30" height="20" fill="#fff"/><rect width="30" height="6.7" fill="#00732f"/><rect y="13.3" width="30" height="6.7" fill="#000"/><rect width="8" height="20" fill="#ff0000"/>',
  US: '<rect width="30" height="20" fill="#fff"/><path d="M0 1.5h30M0 4.6h30M0 7.7h30M0 10.8h30M0 13.9h30M0 17h30" stroke="#b22234" stroke-width="1.55"/><rect width="12" height="10.8" fill="#3c3b6e"/>'
};
const flagSvg = cc => `<span class="flg" aria-hidden="true"><svg viewBox="0 0 30 20" preserveAspectRatio="none">${FLAG[cc] || '<rect width="30" height="20" fill="#556"/>'}</svg></span>`;
const COUNTRY = { AE: ["Emiratos Árabes Unidos", "United Arab Emirates"], ES: ["España", "Spain"], FR: ["Francia", "France"], IT: ["Italia", "Italy"], DE: ["Alemania", "Germany"], NL: ["Países Bajos", "Netherlands"], MC: ["Mónaco", "Monaco"],
  JP: ["Japón", "Japan"], FI: ["Finlandia", "Finland"], AR: ["Argentina", "Argentina"], BR: ["Brasil", "Brazil"], MX: ["México", "Mexico"], TH: ["Tailandia", "Thailand"],
  GB: ["Reino Unido", "United Kingdom"], AU: ["Australia", "Australia"], NZ: ["Nueva Zelanda", "New Zealand"],
  CA: ["Canadá", "Canada"], DK: ["Dinamarca", "Denmark"], CN: ["China", "China"], US: ["Estados Unidos", "United States"], CH: ["Suiza", "Switzerland"],
  PT: ["Portugal", "Portugal"], AT: ["Austria", "Austria"], BE: ["Bélgica", "Belgium"], SE: ["Suecia", "Sweden"], NO: ["Noruega", "Norway"], PL: ["Polonia", "Poland"], IE: ["Irlanda", "Ireland"] };
const carCss = (cell, w) => { const h = w * CELL_H / CELL_W; return `background-image:url(assets/img/cars.png);background-size:${5 * w}px ${5 * h}px;background-position:${-(cell % 5) * w}px ${-Math.floor(cell / 5) * h}px`; };
const TEAM_ORDER = Object.keys(TEAMS);
function teamInfo(t) {
  const ds = DRIVERS.filter(d => d.team === t).sort((a, b) => (a.o ?? DRIVERS.indexOf(a)) - (b.o ?? DRIVERS.indexOf(b)));
  const rank = [...TEAM_ORDER].sort((a, b) => TEAMS[b].skill - TEAMS[a].skill).indexOf(t);
  const sk = TEAMS[t].skill, perf = Math.max(1, Math.min(5, Math.round(1 + 4 * (sk + 0.0118) / 0.0118)));
  const goal = rank < 2 ? L("Ganar el Gran Premio", "Win the Grand Prix") : rank < 4 ? L("Luchar por el podio", "Fight for the podium") : rank < 7 ? L("Sumar puntos", "Score points")
    : rank < 9 ? L("Llegar a Q2 y puntuar", "Reach Q2 and score") : L("Batir a tus rivales directos", "Beat your direct rivals");
  return { ds, perf, diff: 6 - perf, goal, cell: ds[0].cell };
}
const FRONT = { v: null, team: null, lock: 0 };
function showFront(v) {
  const el = $("front"); el.hidden = false; if (v !== "hq") hqStop(); if (v !== "intro") introStop(); FRONT.v = v; el.dataset.v = v; FRONT.lock = performance.now() + 380;
  renderFront();
}
function hideFront() { hqStop(); introStop(); $("front").hidden = true; FRONT.v = null; }
function setLang(l) { if (OPT.lang === l) return; OPT.lang = l; saveOpt(); if (window.I18N) I18N.apply(); renderFront(); }
const langPick = () => `<div class="lang"><span>${L("Idioma", "Language")}</span><div class="sg2" role="group" aria-label="${L("Idioma", "Language")}">
  <button data-lang="es" aria-pressed="${OPT.lang === "es"}">${flagSvg("ES")}Español</button><button data-lang="en" aria-pressed="${OPT.lang === "en"}">${flagSvg("GB")}English</button></div></div>`;
const backBtn = to => `<button class="bk" data-to="${to}" aria-label="${L("Volver", "Back")}">◀</button>`;
function renderFront() {
  const v = FRONT.v; if (!v) return;
  if (v === "title") {
    $("fxTitle").innerHTML = `<div class="ft-photo"></div><div class="ft-shade"></div><div class="fx-dots"></div>
      <div class="ft-top"><span>${L("Gran Premio", "Grand Prix")} · ${GP_INFO.title}</span><span>${L("Ronda", "Round")} ${GP_INFO.round}</span></div>
      <div class="ft-brand">
        <h1 class="ft-logo"><img class="pgmt" src="assets/img/rtm_title.png" alt="Racing Team Manager"></h1>
        <span class="ft-sub">You don't drive. You decide.</span></div>
      <div class="ft-press">${matchMedia("(hover:none)").matches ? L("Toca para continuar", "Tap to continue") : L("Pulsa cualquier botón", "Press any button")}</div>
      <div class="ft-note">${L("Juego no oficial hecho por fans · sin afiliación con la Formula 1 ni con los equipos", "Unofficial fan-made game · not affiliated with Formula 1 or the teams")}</div>
      <div class="ft-foot"><span>v${APP_VERSION}</span><span>${OPT.lang === "en" ? "EN" : "ES"}</span></div>`;
  } else if (v === "main") {
    const gear = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>';
    $("fxMain").innerHTML = `<div class="fx-bg"></div><div class="fx-dots"></div>
      <div class="fx-h"><div class="tt"><span><img class="pgm" src="assets/img/rtm_line.png" alt="Racing Team Manager"></span><b>${L("Menú principal", "Main menu")}</b></div><div class="rt">${GP_INFO.title}<b>${L("Modo Team Principal", "Team Principal mode")}</b></div></div>
      <div class="fm-body${readSave() ? " has-save" : ""}">${fmContinue()}
        <button class="fm-t fm-gp" data-new="gp"><span class="im"><canvas id="fmGpCv"></canvas></span>
          <span class="k">Team Principal</span><b>${L("Gran Premio", "Grand Prix")}</b>
          <span class="meta"><span>${GP_INFO.title}</span><span>${L("Ronda", "Round")} ${GP_INFO.round}</span><span>${GP_INFO.days[0][1]}–${GP_INFO.days[2][1]} ${OPT.lang === "en" ? "JUN" : GP_INFO.month} ${GP_INFO.year}</span></span>
          <p>${L("Elige escudería y dirige un fin de semana completo: libres, clasificación y carrera.", "Pick a team and run a full race weekend: practice, qualifying and the race.")}</p>
          <span class="go">${L("Jugar", "Play")} ▶</span></button>
        <button class="fm-t fm-ss on" data-new="season"><span class="im"></span><span class="new">${L("Nuevo", "New")}</span>
          <span class="k">Team Principal</span><b>${L("Temporada", "Season")}</b>
          <p>${L("Junta directiva, diseño del coche, desarrollo de piezas, fichajes y 8 Grandes Premios (de prueba, en Barcelona).", "Board, car design, parts development, signings and 8 Grands Prix (a test calendar, all in Barcelona).")}</p></button>
        <button class="fm-t fm-op" data-go="opt"><span class="im"></span>${gear}<span class="k">${L("Ajustes", "Settings")}</span><b>${L("Opciones", "Options")}</b>
          <p>${L("Idioma, radio del equipo, repeticiones y gráficos.", "Language, team radio, replays and graphics.")}</p></button>
      </div>
      <div class="fm-f"><span class="hint">${L("↑ ↓ ← → para moverte · Enter para elegir", "↑ ↓ ← → to move · Enter to select")}</span>${langPick()}</div>`;
    requestAnimationFrame(drawMenuCircuit);
    setTimeout(() => $("fxMain").querySelector(".fm-cont, .fm-gp")?.focus({ preventScroll: true }), 60);
  } else if (v === "opt") {
    const row = (k, title, desc, opts) => `<div class="fo-r"><b>${title}</b><p>${desc}</p><div class="sg2" role="group" aria-label="${title}">${opts.map(([val, lab]) => `<button data-opt="${k}" data-val="${val}" aria-pressed="${String(OPT[k]) === String(val)}">${lab}</button>`).join("")}</div></div>`;
    $("fxOpt").innerHTML = `<div class="fx-bg"></div>
      <div class="fx-h">${backBtn("main")}<div class="tt"><span><img class="pgm" src="assets/img/rtm_line.png" alt="Racing Team Manager"></span><b>${L("Opciones", "Options")}</b></div></div>
      <div class="fo-body"><div class="fo-list">
        ${row("lang", L("Idioma", "Language"), L("Textos del juego, radio y gráficos.", "Game text, team radio and charts."), [["es", flagSvg("ES") + "Español"], ["en", flagSvg("GB") + "English"]])}
        ${row("radio", L("Radio del equipo", "Team radio"), L("Mensajes del ingeniero, del jefe de equipo y del piloto.", "Messages from the engineer, the team principal and the driver."), [["all", L("Completa", "Full")], ["imp", L("Solo importante", "Key only")], ["off", L("Apagada", "Off")]])}
        ${row("replays", L("Repeticiones", "Replays"), L("Repetición automática de trompos, toques y accidentes.", "Automatic replay of spins, contacts and crashes."), [["true", L("Sí", "On")], ["false", L("No", "Off")]])}
        ${row("fans", L("Público en las gradas", "Grandstand crowd"), L("Desactívalo si el móvil va justo.", "Turn it off if your phone struggles."), [["true", L("Sí", "On")], ["false", L("No", "Off")]])}
        ${row("quality", L("Calidad gráfica", "Graphics quality"), L("Ahorro: menos resolución, más batería.", "Saver: lower resolution, longer battery."), [["hi", L("Alta", "High")], ["lo", L("Ahorro", "Saver")]])}
      </div></div>`;
  } else if (v === "team") {
    if (!FRONT.team) FRONT.team = DRIVERS[0].team;
    const card = (t, n) => { const I = teamInfo(t), T = TEAMS[t];
      return `<button class="tcd" data-team="${t}" aria-pressed="${t === FRONT.team}" style="--tc:${T.col};--i:${n}">
        <span class="ps">${I.ds.map(d => `<span class="pt" style="${portraitCss(d.code, 62)}"></span>`).join("")}</span>
        <span class="hd"><b class="${T.full.length > 13 ? "lg" : ""}">${T.full}</b><em>${L("Motor", "Power unit")} ${T.pu}</em><span class="st" title="${L("Rendimiento", "Performance")}">${[1, 2, 3, 4, 5].map(n => `<i class="${n <= I.perf ? "on" : ""}"></i>`).join("")}</span></span>
        <span class="dn">${I.ds.map(d => `<span><i>${d.num}</i>${flagSvg(NAT[d.code])}${FIRST[d.code] ? FIRST[d.code][0] + ". " : ""}${d.name}</span>`).join("")}</span>
        <span class="car" style="${carCss(I.cell, 176)}"></span>
        ${teamLogoSel(t)}<span class="chk">✓</span></button>`; };
    $("fxTeam").innerHTML = `<div class="fx-bg"></div>
      <div class="fx-h">${backBtn("main")}<div class="tt"><span>Team Principal · ${GAME.mode === "season" ? L("Temporada", "Season") : L("Gran Premio", "Grand Prix")}</span><b>${L("Elige tu escudería", "Choose your team")}</b></div>
        <div class="rt">${GP_INFO.title}<b>${L("Ronda", "Round")} ${GP_INFO.round}</b></div></div>
      <div class="fs-body"><div class="fs-grid">${TEAM_ORDER.map(card).join("")}</div><aside class="fs-det" id="fsDet"></aside></div>
      <div class="fs-bar" id="fsBar"></div>`;
    teamDetail(); revealCards(); fitTeamCards();
  } else if (v === "hq") renderHQ();
  else if (v === "intro") renderIntro();
  else if (v === "tp") renderTP();
  if (v === "team") gate(imgsReady(["assets/img/drivers.jpg", "assets/img/cars.png", ...TEAM_ORDER.map(t => `assets/logos/tlogo_${t}.png`)]), () => { });
}
function teamDetail() {
  const t = FRONT.team, T = TEAMS[t], I = teamInfo(t);
  const bar = (lab, n, txt, r = 0) => `<div style="--r:${r}"><span>${lab}</span><span class="bar">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= n ? "on" : ""}" style="--k:${k}"></i>`).join("")}</span><b>${txt}</b></div>`;
  const det = $("fsDet"), fx = $("fxTeam");
  if (fx) fx.style.setProperty("--sel", T.col);
  if (det) det.innerHTML = `<div class="dt-h" style="--tc:${T.col}">${teamLogoSel(t, "dlg")}<span>${L("Escudería", "Team")}</span><b>${T.full}</b><em>${L("Motor", "Power unit")} ${T.pu}</em></div>
    <div class="dt-car" style="--tc:${T.col}"><b class="sl"></b><i style="${carCss(I.cell, 330)}"></i></div>
    <div class="dt-dr" style="--tc:${T.col}">${I.ds.map((d, j) => `<div class="dt-d" style="--j:${j}"><span class="pt" style="${portraitCss(d.code, 182)}"></span><i class="no">${d.num}</i>
      <span class="nm"><span>${flagSvg(NAT[d.code])}${FIRST[d.code] || ""}</span><b>${d.name}</b><span>${(COUNTRY[NAT[d.code]] || ["", ""])[OPT.lang === "en" ? 1 : 0]}</span></span></div>`).join("")}</div>
    <div class="dt-k" style="--tc:${T.col}">${bar(L("Rendimiento", "Performance"), I.perf, ["", L("Bajo", "Low"), L("Modesto", "Modest"), L("Medio", "Midfield"), L("Alto", "Strong"), L("Puntero", "Front-runner")][I.perf])}
      ${bar(L("Dificultad", "Difficulty"), I.diff, ["", L("Fácil", "Easy"), L("Asequible", "Fair"), L("Media", "Medium"), L("Difícil", "Hard"), L("Muy difícil", "Very hard")][I.diff], 1)}
      <div><span>${L("Objetivo", "Target")}</span><span></span><b>${I.goal}</b></div></div>
    <div class="dt-gar"><canvas id="dtGar"></canvas><span>${L("Tu garaje", "Your garage")}</span></div>
    <button class="dt-go" data-start="1">${L("Comenzar con", "Start with")} ${T.name} ▶</button>`;
  requestAnimationFrame(() => drawTeamGarage(t));
  const b = $("fsBar");
  if (b) { b.style.setProperty("--tc", T.col); b.innerHTML = `<i class="sw">${teamLogoSel(t, "")}</i><div class="tx"><b>${T.full}</b><span>${L("Objetivo", "Target")}: ${I.goal}</span></div><button class="go" data-start="1">${L("Comenzar", "Start")} ▶</button>`; }
}
function drawTeamGarage(t) {                                // the team's garage, walls in its colours, its two cars on their marks
  const cv = $("dtGar"); if (!cv) return; const base = garBase(t); if (!base) { setTimeout(() => FRONT.team === t && drawTeamGarage(t), 300); return; }
  const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (r.width < 20) return;
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const g = cv.getContext("2d"); g.setTransform(cv.width / GARV.W, 0, 0, cv.height / GARV.H, 0, 0); g.imageSmoothingQuality = "high"; g.drawImage(base, 0, 0);
  const L2 = GARV.LEN, W2 = L2 * CELL_H / CELL_W;
  teamInfo(t).ds.forEach((dd, j) => { const k = DRIVERS.indexOf(dd), spr = carSprites[k]; if (!spr) return; const [bx, by] = GARV.bays[j];
    const sh = carShadows[k]; if (sh) { g.save(); g.translate(bx + 7, by + 11); g.rotate(Math.PI / 2); g.globalAlpha = .4; g.drawImage(sh.cv, -L2 * sh.sx / 2, -W2 * sh.sy / 2, L2 * sh.sx, W2 * sh.sy); g.restore(); }
    g.save(); g.translate(bx, by); g.rotate(Math.PI / 2); g.drawImage(spr, -L2 / 2, -W2 / 2, L2, W2); g.restore(); });
}
function drawMenuCircuit() {
  const cv = $("fmGpCv"); if (!cv || !mapImg.complete || !mapImg.naturalWidth) return;
  const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (r.width < 20) return;
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const g = cv.getContext("2d"), cx = 1720, cy = 880, ar = r.width / r.height; let w = 1300, h = w / ar; if (h > 1100) { h = 1100; w = h * ar; }
  const sx = mapImg.naturalWidth / MAP_W, sy = mapImg.naturalHeight / MAP_H, x0 = Math.max(0, Math.min(MAP_W - w, cx - w / 2)), y0 = Math.max(0, Math.min(MAP_H - h, cy - h / 2));
  g.drawImage(mapImg, x0 * sx, y0 * sy, w * sx, h * sy, 0, 0, cv.width, cv.height);
  const k = cv.width / w; g.lineCap = g.lineJoin = "round"; g.strokeStyle = "rgba(225,6,0,.85)"; g.lineWidth = 3 * d; g.shadowColor = "rgba(225,6,0,.8)"; g.shadowBlur = 10 * d; g.beginPath();
  for (let i = 0; i <= N; i += 2) { const x = (RL.x[i % N] - x0) * k, y = (RL.y[i % N] - y0) * k; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
}
function frontKey(e) {
  const tg = e.target;
  if (FRONT.v && tg && tg.closest && tg.closest("#front") && /^(INPUT|SELECT|TEXTAREA)$/.test(tg.tagName)) {   // typing a name: the game's keys stay out of it
    e.stopPropagation();
    if (e.type === "keydown" && e.key === "Escape") tg.blur();
    if (e.type === "keydown" && e.key === "Enter" && tg.tagName === "INPUT") { e.preventDefault(); if (tg.id === "tpFirst") $("tpLast")?.focus(); else if (tg.id === "tpLast") tpConfirm(); }
    return;
  }
  if (tg && tg.closest && tg.closest(".dsl-t, #desTime") && /^Arrow/.test(e.key)) return;   // the design desk and the 4 weeks take the arrows themselves
  const smd = document.getElementById("smod"); if (smd && !smd.hidden) { if (e.type === "keydown" && e.key === "Escape") { e.preventDefault(); sModalClose(); if (isSeason()) sRefresh(); } return; }
  if (!FRONT.v || performance.now() < FRONT.lock) return;
  if (FRONT.v === "title") { e.preventDefault(); showFront("main"); return; }
  if (e.type !== "keydown") return;
  if (FRONT.v === "intro") { e.stopPropagation(); if (/^(Escape|Enter| |ArrowRight|ArrowLeft)$/.test(e.key)) { e.preventDefault(); if (e.key === "Escape") introEnd(); else introShow(Math.max(0, INTRO.i + (e.key === "ArrowLeft" ? -1 : 1))); } return; }
  if (FRONT.v === "tp") { if (e.key === "Escape") { e.preventDefault(); showFront(TPUI.back); } else e.stopPropagation(); return; }
  if (e.key === "Escape" || e.key === "Backspace") { if (FRONT.v === "opt" || FRONT.v === "team") { e.preventDefault(); showFront("main"); } else if (FRONT.v === "hq") { e.preventDefault(); if (HQS.sec && HQS.sec !== "home") hqOpen(isSeason() ? "home" : HQ_SEC[HQS.sec].p || "home"); else { saveGame(); showFront(isSeason() ? "main" : "team"); } } return; }
  if (FRONT.v === "hq") { hqKey(e); return; }
  const list = FRONT.v === "main" ? [...document.querySelectorAll(".fm-t:not([aria-disabled])")] : FRONT.v === "team" ? [...document.querySelectorAll(".tcd")] : null;
  if (!list || !/^Arrow/.test(e.key)) return;
  e.preventDefault();
  let i = list.indexOf(document.activeElement); if (i < 0) i = 0; else i = (i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + list.length) % list.length;
  list[i].focus({ preventScroll: true }); list[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
  if (FRONT.v === "team") selectTeam(list[i]);
}
addEventListener("keydown", frontKey, true);
$("front").addEventListener("pointerdown", e => { if (FRONT.v === "title") frontKey(e); });
$("front").addEventListener("click", e => {
  if (performance.now() < FRONT.lock) { e.preventDefault(); return; }
  const lg = e.target.closest("[data-lang]"); if (lg) { setLang(lg.dataset.lang); return; }
  if (tpClick(e)) return;
  const nw = e.target.closest("[data-new]"); if (nw) { fmNew(nw.dataset.new); return; }
  if (e.target.closest("[data-cont]")) { fmContinueGo(); return; }
  if (isSeason() && e.target.closest("[data-sa],[data-tab],[data-go2],[data-sx]")) { sClick(e); return; }
  const op = e.target.closest("[data-opt]");
  if (op) { const k = op.dataset.opt, v = op.dataset.val, val = v === "true" ? true : v === "false" ? false : v;
    if (k === "lang") { setLang(val); return; } OPT[k] = val; saveOpt(); if (k === "quality") resize(); renderFront(); return; }
  const to = e.target.closest("[data-to]"); if (to) { if (FRONT.v === "hq") saveGame(); showFront(to.dataset.to); return; }
  const go = e.target.closest("[data-go]"); if (go) { showFront(go.dataset.go); return; }
  if (e.target.closest("[data-hqgo]")) { hqGo(); return; }
  const hs = e.target.closest("[data-hqs]"); if (hs) { hqShow(+hs.dataset.hqs); return; }
  const hc = e.target.closest("[data-hqsec]"); if (hc) { hqOpen(hc.dataset.hqsec); return; }
  const tc = e.target.closest(".tcd");
  if (tc) { if (FRONT.team === tc.dataset.team && !matchMedia("(min-width:1100px)").matches) { startTeam(); return; }
    selectTeam(tc); return; }
  if (e.target.closest("[data-start]")) startTeam();
});
$("front").addEventListener("input", e => { if (isSeason() && FRONT.v === "hq") sInput(e); else tpInput(e); });
$("front").addEventListener("change", e => { if (isSeason() && FRONT.v === "hq") sInput(e); else tpInput(e); });
$("front").addEventListener("keydown", e => { if (FRONT.v === "team" && e.key === "Enter" && document.activeElement?.classList.contains("tcd")) { e.preventDefault(); startTeam(); } });
function selectTeam(tc) {                                     // a card picked: it bounces, the panel and the background change colour
  const same = FRONT.team === tc.dataset.team;
  FRONT.team = tc.dataset.team; document.querySelectorAll(".tcd").forEach(b => b.setAttribute("aria-pressed", b === tc));
  if (tc.animate && !matchMedia("(prefers-reduced-motion:reduce)").matches) tc.animate([{ transform: "scale(1)" }, { transform: "scale(1.03)" }, { transform: "scale(1)" }], { duration: 340, easing: "cubic-bezier(.3,1.4,.5,1)" });
  if (!same) teamDetail();
}
function fitTeamCards() {                                     // the name and engine shrink if they would run into the logo beside them
  document.querySelectorAll(".fs-grid .tcd").forEach(c => {
    const lg = c.querySelector(".tlg"); if (!lg) return;
    if (!lg.complete || !lg.naturalWidth) { lg.addEventListener("load", () => fitTeamCards(), { once: true }); return; }
    const r = lg.getBoundingClientRect(), ar = lg.naturalWidth / lg.naturalHeight, dh = Math.min(r.height, r.width / ar), x0 = r.right - dh * ar, y1 = r.top + dh;
    c.querySelectorAll(".hd b, .hd em").forEach(el => {
      el.style.fontSize = ""; el.style.letterSpacing = "";
      const rg = document.createRange(); rg.selectNodeContents(el);
      let fs = parseFloat(getComputedStyle(el).fontSize), t = rg.getBoundingClientRect();
      if (t.top > y1) return;
      while (t.right > x0 - 8 && fs > 10) { fs -= 0.5; el.style.fontSize = fs + "px"; el.style.letterSpacing = ".01em"; t = rg.getBoundingClientRect(); }
    });
  });
}
addEventListener("resize", () => { if (FRONT.v === "team") fitTeamCards(); });
function revealCards() {                                      // cards come in as they scroll into view, one after another
  const cs = [...document.querySelectorAll(".fs-grid .tcd")];
  if (!("IntersectionObserver" in window)) { cs.forEach(c => c.classList.add("in")); return; }
  let n = 0, last = 0;
  const io = new IntersectionObserver(es => {
    const now = performance.now(); if (now - last > 160) n = 0; last = now;
    es.forEach(e => { if (!e.isIntersecting) return; e.target.style.setProperty("--d", `${Math.min(n++, 8) * 60}ms`); e.target.classList.add("in"); io.unobserve(e.target); });
  }, { threshold: 0.08 });
  cs.forEach(c => io.observe(c));
}
// ---------- the team's HQ: its departments on the left, the screen of the one chosen on the right ----------
const HQ_INFO = {   // city, country, facility; air / ent: pictures supplied (the reception is the same building for everyone)
  mcl: ["Woking", "GB", "McLaron Technology Centre", 1, 1], mer: ["Brackley", "GB", "", 1, 1], rbr: ["Milton Keynes", "GB", "Red Ball Technology Campus", 1, 1],
  fer: ["Maranello", "IT", "Gestione Sportiva", 1, 1], wil: ["Grove", "GB", "", 1, 1], rcb: ["Milton Keynes", "GB", "Red Ball Technology Campus", 1, 1], amr: ["Silverstone", "GB", "Aston Technology Campus", 1, 1],
  haa: ["Kannapolis", "US", "", 1, 1], aud: ["Hinwil", "CH", "", 1, 1], alp: ["Enstone", "GB", "", 1, 1], cad: ["Fishers", "US", "", 1, 0]
};
const HQ_SITE = { rcb: "rbr" };   // VISE PR shares the Red Ball campus: same aerial view and entrance
const hqSite = t => HQ_SITE[t] || t;
// how each picture moves: [zoom, pan x 0..1, pan y 0..1] at the start and at the end
const HQ_MOVE = { air: [[1.05, 0, 0.6], [1.17, 1, 0.42]], ent: [[1.18, 1, 0.45], [1.04, 0.1, 0.55]], hall: [[1.03, 0.2, 0.45], [1.2, 0.6, 0.62]], gar: [[1.03, 0.15, 0.5], [1.14, 0.85, 0.5]] };
const HQS = { i: -1, k: 0, timer: 0, dur: 8200, slides: [], t: null, sec: "home", stage: null, pref: 0 };
// the departments (screens only for now: what each one will hold comes later)
const HQ_ICON = {
  home: '<path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  board: '<rect x="3" y="10" width="18" height="4.5" rx="1"/><path d="M6.5 14.5V20M17.5 14.5V20"/><circle cx="8" cy="5.8" r="2"/><circle cx="16" cy="5.8" r="2"/>',
  dev: '<path d="M9 3h6M10 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.2V3"/><path d="M7.2 15h9.6"/>',
  rnd: '<path d="M3 8h10.5a2.8 2.8 0 1 0-2.8-2.8"/><path d="M3 12h15.5a2.8 2.8 0 1 1-2.8 2.8"/><path d="M3 16h6.5"/>',
  prod: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  sim: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20.5h8M12 16v4.5"/><path d="M7 12.5c2.2-4 7.8-4 10 0"/>',
  squad: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20.5c0-3.4 2.7-6.1 6-6.1s6 2.7 6 6.1"/><circle cx="17.2" cy="9" r="2.5"/><path d="M15.8 14.3a5 5 0 0 1 5.2 5"/>',
  active: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.6 16.5c.8-1.8 2-2.6 3.4-2.6s2.6.8 3.4 2.6M14.5 10h3.8M14.5 13.2h3.8"/>',
  market: '<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',
  mkt: '<path d="M3 10v4l3 .6V9.4z"/><path d="M6 9.4 17.5 4v16L6 14.6"/><path d="M8.2 15.2 9.8 20.5h2.4l-1.1-4.8"/><path d="M20.5 9.5v5"/>',
  fin: '<path d="M4 20.5V11M9.5 20.5V5M15 20.5v-7.5M20.5 20.5V8.5M2.5 20.5h20"/>',
  ops: '<path d="M4 14v-1.8a8 8 0 0 1 16 0V14"/><rect x="3" y="14" width="4" height="6" rx="1.2"/><rect x="17" y="14" width="4" height="6" rx="1.2"/><path d="M19 20a4 4 0 0 1-4 2h-2.2"/>',
  train: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.8 1.9M10 2.5h4M12 2.5v3.5M18.5 6.5l1.5-1.5"/>',
  tdrv: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  trophy: '<path d="M7 3.5h10V9a5 5 0 0 1-10 0z"/><path d="M7 5.5H4.5a2.6 2.6 0 0 0 2.8 4.3M17 5.5h2.5a2.6 2.6 0 0 1-2.8 4.3"/><path d="M12 14v3M9 17h6v3.5H9z"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2"/>',
  stand: '<path d="M4 20.5v-6h5v6M9.5 20.5V10h5v10.5M15 20.5v-8h5v8M2.5 20.5h19"/><path d="M12 3.2l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/>',
  pit: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5V9M12 15v5.5M3.5 12H9M15 12h5.5"/>'
};
const hqIc = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${HQ_ICON[k] || ""}</svg>`;
const HQ_SEC = {
  board: { ic: "board", t: ["Junta directiva", "Board of directors"], x: "goal",
    d: ["Reuniones con la junta, objetivos de la temporada y valoración de tu gestión.", "Board meetings, season targets and the rating of your management."], s: ["Objetivos y confianza", "Targets and confidence"] },
  dev: { ic: "dev", t: ["Desarrollo", "Development"], sub: ["rnd", "prod", "dsim"],
    d: ["Diseño, fabricación y validación de las piezas del monoplaza.", "Design, manufacture and validation of the car's parts."], s: ["Piezas del monoplaza", "Car parts"] },
  rnd: { p: "dev", ic: "rnd", t: ["I+D+i", "R&D"], d: ["Túnel de viento, CFD y diseño de nuevas piezas.", "Wind tunnel, CFD and the design of new parts."], s: ["Túnel de viento y diseño", "Wind tunnel and design"] },
  prod: { p: "dev", ic: "prod", t: ["Producción", "Production"], d: ["Fabricación de piezas, inventario y costes de producción.", "Part manufacturing, inventory and production costs."], s: ["Fabricación de piezas", "Part manufacturing"] },
  dsim: { p: "dev", ic: "sim", t: ["Simulador", "Simulator"], d: ["Validación de las piezas nuevas en el túnel de viento antes de llevarlas a pista.", "Validating new parts in the wind tunnel before they go on track."], s: ["Validación de piezas", "Part validation"] },
  squad: { ic: "squad", t: ["Plantilla", "Squad"], sub: ["active", "market"],
    d: ["Pilotos en activo, contratos y mercado de fichajes.", "Active drivers, contracts and the transfer market."], s: ["Pilotos y contratos", "Drivers and contracts"] },
  active: { p: "squad", ic: "active", t: ["Activos", "Active drivers"], x: "drivers", d: ["Tus pilotos, sus contratos y su rendimiento.", "Your drivers, their contracts and their performance."], s: ["Tus pilotos", "Your drivers"] },
  market: { p: "squad", ic: "market", t: ["Fichajes", "Transfers"], d: ["Mercado de pilotos: agentes libres y negociaciones.", "The driver market: free agents and negotiations."], s: ["Mercado de pilotos", "Driver market"] },
  mkt: { ic: "mkt", t: ["Marketing y eventos", "Marketing & events"], d: ["Patrocinadores, eventos con aficionados y acciones de imagen.", "Sponsors, fan events and brand activities."], s: ["Patrocinios y eventos", "Sponsors and events"] },
  fin: { ic: "fin", t: ["Finanzas", "Finance"], d: ["Presupuesto, límite de gasto, ingresos de patrocinio y premios.", "Budget, cost cap, sponsorship income and prize money."], s: ["Presupuesto", "Budget"] },
  ops: { ic: "ops", t: ["Operaciones y preparación de monoplazas", "Operations & car preparation"], n: ["Operaciones y preparación", "Operations & preparation"],
    d: ["Sala de operaciones, logística y montaje de los coches para cada Gran Premio.", "Operations room, logistics and building the cars up for every Grand Prix."], s: ["Logística y montaje", "Logistics and build"] },
  train: { ic: "train", t: ["Entrenamiento", "Training"], sub: ["tdrv", "tsim", "pit"],
    d: ["Preparación de los pilotos y del equipo de cara a cada Gran Premio.", "Getting the drivers and the crew ready for every Grand Prix."], s: ["Pilotos y equipo", "Drivers and crew"] },
  tdrv: { p: "train", ic: "tdrv", t: ["Pilotos", "Drivers"], d: ["Preparación física y mental de los pilotos en el gimnasio del equipo.", "The drivers' physical and mental preparation in the team gym."], s: ["Gimnasio", "Gym"] },
  tsim: { p: "train", ic: "sim", t: ["Simulador", "Simulator"], d: ["Sesiones en el simulador de 180° para preparar el próximo circuito.", "Sessions in the 180° simulator to get ready for the next circuit."], s: ["Simulador 180°", "180° simulator"] },
  trophy: { ic: "trophy", t: ["Sala de trofeos", "Trophy room"], d: ["Los títulos, las victorias y los monoplazas históricos del equipo.", "The team's titles, wins and historic cars."], s: ["Historia del equipo", "Team history"] },
  cal: { ic: "cal", t: ["Calendario", "Calendar"], d: ["Las 8 rondas, el test y las reuniones de la junta.", "The 8 rounds, the test and the board meetings."], s: ["Temporada 2026", "2026 season"] },
  stand: { ic: "stand", t: ["Clasificación", "Standings"], d: ["Mundial de pilotos y de constructores.", "Drivers' and constructors' championships."], s: ["Pilotos y constructores", "Drivers and constructors"] },
  pit: { p: "train", ic: "pit", t: ["Mecánicos · pit stop", "Pit stop crew"], d: ["Preparación física de los mecánicos y práctica de paradas para rebajar el tiempo en boxes.", "Crew fitness and pit stop practice to bring the stationary time down."], s: ["Gimnasio y paradas", "Gym and stops"] }
};
const HQ_NAV = ["board", "dev", "squad", "mkt", "fin", "ops", "train", "trophy"];
const HQ_NAV_S = ["cal", "stand", "board", "dev", "squad", "ops", "fin", "mkt", "train", "trophy"];   // the season adds its calendar and standings
const hqT = k => k === "home" ? L("Sede", "HQ") : L(...HQ_SEC[k].t);
function hqSlides(t) {
  const [, , , air, ent] = HQ_INFO[t] || [], s = [];
  if (air) s.push({ k: "air", src: `assets/hq/${hqSite(t)}_air.jpg`, lab: L("Vista aérea", "Aerial view") });
  if (ent) s.push({ k: "ent", src: `assets/hq/${hqSite(t)}_ent.jpg`, lab: L("Entrada principal", "Main entrance") });
  s.push({ k: "hall", src: `assets/hq/hall_${t}.jpg`, lab: L("Recepción", "Reception") });
  if (s.length < 3) s.push({ k: "gar", cv: () => hqGarage(t), lab: L("Garaje del equipo", "Team garage") });
  return s;
}
function hqSecSlides(sec, t) {                                 // the pictures of each screen and how they move
  if (sec === "home") return hqSlides(t);
  const ent = (HQ_INFO[t] || [])[4], I = (src, m, lab) => ({ src, m, lab });
  const P = {
    tunnel: () => I("assets/hq/int_tunnel.jpg", [[1.05, 0.15, 0.45], [1.2, 0.4, 0.5]], L("Túnel de viento", "Wind tunnel")),
    design: () => I("assets/hq/int_design.jpg", [[1.04, 0, 0.5], [1.18, 0.85, 0.55]], L("Oficina de diseño", "Design office")),
    build: () => I("assets/hq/int_factory.jpg", [[1.04, 0.5, 0], [1.22, 0.35, 0.8]], L("Preparación de monoplazas", "Car preparation")),
    cnc: () => I("assets/hq/int_cnc.jpg", [[1.04, 0.1, 0.5], [1.2, 0.7, 0.55]], L("Mecanizado CNC", "CNC machining")),
    press: () => I("assets/hq/int_press.jpg", [[1.05, 0.95, 0.4], [1.22, 0.62, 0.5]], L("Sala de prensa", "Press room")),
    finance: () => I("assets/hq/int_finance.jpg", [[1.04, 0, 0.5], [1.18, 0.85, 0.55]], L("Oficina de finanzas", "Finance office")),
    cafe: () => I(`assets/hq/cafe_${t}.jpg`, [[1.04, 0, 0.5], [1.2, 0.6, 0.62]], L("Cafetería del equipo", "Team cafeteria")),
    cafe2: () => I(`assets/hq/cafe_${t}.jpg`, [[1.16, 0.5, 0.75], [1.3, 0.25, 0.8]], L("Cafetería del equipo", "Team cafeteria")),
    gym: () => I("assets/hq/int_gym.jpg", [[1.04, 0.5, 0.15], [1.2, 0.5, 0.75]], L("Gimnasio", "Gym")),
    gym2: () => I("assets/hq/int_gym.jpg", [[1.15, 0.85, 0.7], [1.28, 0.35, 0.85]], L("Gimnasio", "Gym")),
    simr: () => I("assets/hq/int_sim.jpg", [[1.04, 0.1, 0.45], [1.22, 0.45, 0.5]], L("Simulador 180°", "180° simulator")),
    trophy: () => I(`assets/hq/trophy_${t}.jpg`, [[1.06, 0, 0.62], [1.22, 0.8, 0.45]], L("Sala de trofeos", "Trophy room")),
    parts: () => I("assets/hq/int_factory.jpg", [[1.35, 0.95, 0.95], [1.2, 0.55, 0.85]], L("Fabricación de piezas", "Parts manufacturing")),
    ops: () => I("assets/hq/int_ops.jpg", [[1.04, 0.15, 0.5], [1.22, 0.85, 0.35]], L("Sala de operaciones", "Operations room")),
    board: () => I("assets/hq/int_board.jpg", [[1.04, 0.15, 0.6], [1.18, 0.4, 0.75]], L("Sala de juntas", "Boardroom")),
    money: () => I("assets/hq/int_board.jpg", [[1.55, 1, 0.2], [1.8, 1, 0.12]], L("Informe financiero", "Financial report")),
    grid: () => I("assets/img/grid.jpg", [[1.04, 0, 0.3], [1.14, 1, 0.35]], L("Pilotos de la parrilla", "The drivers")),
    mosaic: () => I("assets/img/drivers.jpg", [[1.05, 0, 0], [1.18, 1, 1]], L("Mercado de pilotos", "Driver market")),
    desk: () => I(`assets/hq/hall_${t}.jpg`, [[1.35, 0.12, 0.5], [1.5, 0.22, 0.58]], L("Recepción", "Reception")),
    car: () => I(`assets/hq/hall_${t}.jpg`, [[1.12, 0.55, 0.6], [1.28, 0.78, 0.72]], L("El monoplaza", "The car")),
    entr: () => ent ? I(`assets/hq/${hqSite(t)}_ent.jpg`, HQ_MOVE.ent, L("Entrada principal", "Main entrance")) : null,
    sim: () => ({ k: "sim", cv: () => hqSimCanvas(t), m: [[1.1, 0.15, 0.4], [1.35, 0.8, 0.6]], lab: L("Simulador · próximo circuito", "Simulator · next circuit") }),
    garage: () => ({ k: "gar", cv: () => hqGarage(t), lab: L("Garaje del equipo", "Team garage") })
  };
  const list = { board: ["board"], dev: ["design", "cnc", "tunnel"], rnd: ["design", "tunnel"], prod: ["cnc"], dsim: ["tunnel"], squad: ["cafe"],
    active: ["cafe2"], market: ["mosaic", "grid"], mkt: ["press"], fin: ["finance"], ops: ["build", "ops"], train: ["gym", "simr"],
    tdrv: ["gym"], tsim: ["simr"], pit: ["gym2"], trophy: ["trophy"], cal: ["ops"], stand: ["trophy"] }[sec] || [];
  return list.map(k => P[k]()).filter(Boolean);
}
function hqGarage(t) {                                         // the team garage with its two cars
  const base = garBase(t); if (!base) return null;
  const cv = mkCanvas(GARV.W, GARV.H), g = cv.getContext("2d"); g.drawImage(base, 0, 0);
  const L2 = GARV.LEN, W2 = L2 * CELL_H / CELL_W;
  teamInfo(t).ds.forEach((dd, j) => { const k = DRIVERS.indexOf(dd), spr = carSprites[k]; if (!spr) return; const [bx, by] = GARV.bays[j];
    const sh = carShadows[k]; if (sh) { g.save(); g.translate(bx + 7, by + 11); g.rotate(Math.PI / 2); g.globalAlpha = .4; g.drawImage(sh.cv, -L2 * sh.sx / 2, -W2 * sh.sy / 2, L2 * sh.sx, W2 * sh.sy); g.restore(); }
    g.save(); g.translate(bx, by); g.rotate(Math.PI / 2); g.drawImage(spr, -L2 / 2, -W2 / 2, L2, W2); g.restore(); });
  return cv;
}
function hqSimCanvas(t) {                                      // the simulator: the next circuit, its racing line in the team colour
  const W = 1600, H = Math.round(W * MAP_H / MAP_W), cv = mkCanvas(W, H), g = cv.getContext("2d");
  const draw = () => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.shadowBlur = 0; g.fillStyle = "#0b0f14"; g.fillRect(0, 0, W, H);
    if (mapImg.complete && mapImg.naturalWidth) g.drawImage(mapImg, 0, 0, W, H);
    g.fillStyle = "rgba(6,10,18,.38)"; g.fillRect(0, 0, W, H);
    const k = W / MAP_W; g.lineCap = g.lineJoin = "round"; g.strokeStyle = TEAMS[t].col; g.lineWidth = 5; g.shadowColor = TEAMS[t].col; g.shadowBlur = 16; g.beginPath();
    for (let i = 0; i <= N; i += 2) { const x = RL.x[i % N] * k, y = RL.y[i % N] * k; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.closePath(); g.stroke();
  };
  draw(); if (!(mapImg.complete && mapImg.naturalWidth)) mapImg.addEventListener("load", draw, { once: true });
  return cv;
}
function hqNavHtml() {
  const btn = (k, sub, hasSub) => { const S = k === "home" ? null : HQ_SEC[k], lb = k === "home" ? L("Vista general", "Overview") : L(...(S.n || S.t));
    return `<button class="hq-n${sub ? " sub" : ""}" data-hqsec="${k}"${hasSub ? ' aria-expanded="false"' : ""}><span class="ic">${hqIc(k === "home" ? "home" : S.ic)}</span><span class="lb">${lb}</span>${hasSub ? '<i class="cv" aria-hidden="true"></i>' : ""}</button>`; };
  return btn("home") + (isSeason() ? HQ_NAV_S : HQ_NAV).map(k => { const S = HQ_SEC[k]; if (!S.sub) return btn(k);
    return `<div class="hq-g" data-g="${k}">${btn(k, false, true)}<div class="hq-sub"><div inert>${S.sub.map(s => btn(s, true)).join("")}</div></div></div>`; }).join("");
}
function hqNavSync() {
  const sec = HQS.sec || "home", S = HQ_SEC[sec], grp = !S ? null : S.p || (S.sub ? sec : null);
  document.querySelectorAll("#fxHq .hq-n").forEach(b => { if (b.dataset.hqsec === sec) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  document.querySelectorAll("#fxHq .hq-g").forEach(g => { const on = g.dataset.g === grp; g.classList.toggle("open", on); g.querySelector(".hq-n").setAttribute("aria-expanded", on);
    const inner = g.querySelector(".hq-sub>div"); if (on) inner.removeAttribute("inert"); else inner.setAttribute("inert", ""); });
}
function hqOverlay(sec, t) {
  const T = TEAMS[t], I = teamInfo(t);
  if (sec === "home") {
    const [city, cc, fac] = HQ_INFO[t] || ["", "GB", ""], ctry = (COUNTRY[cc] || ["", ""])[OPT.lang === "en" ? 1 : 0];
    return `<div class="hq-cap"><span class="k">${L("Sede central", "Headquarters")}</span><b>${city}</b><em>${flagSvg(cc)}${fac ? fac + " · " : ""}${ctry}</em></div>`;
  }
  const S = HQ_SEC[sec];
  let x = "";
  if (S.x === "goal") x = `<div class="hq-x"><span>${L("Objetivo de la junta", "Board target")}</span><b>${I.goal}</b></div>`;
  if (S.x === "drivers") x = `<div class="hq-xd">${I.ds.map(d => `<div class="d"><span class="pt" style="${faceCss(d.code, 58, 58, 1.55)}"></span><span class="tx"><span>${flagSvg(NAT[d.code])}${FIRST[d.code] || ""}</span><b>${d.name}</b></span><i>${d.num}</i></div>`).join("")}</div>`;
  return `<nav class="hq-crumb" aria-label="${L("Ruta", "Breadcrumb")}"><button data-hqsec="home">${L("Sede", "HQ")}</button>${S.p ? `<i>›</i><button data-hqsec="${S.p}">${hqT(S.p)}</button>` : ""}<i>›</i><b>${hqT(sec)}</b></nav>
    <div class="hq-scap"><span class="ic">${hqIc(S.ic)}</span><b>${hqT(sec)}</b><p>${L(...S.d)}</p>${x}<span class="soon"><i></i>${L("Próximamente", "Coming soon")}</span></div>
    ${S.sub ? `<div class="hq-tiles">${S.sub.map((k, j) => `<button class="hq-tile" data-hqsec="${k}" style="--j:${j}"><span class="ic">${hqIc(HQ_SEC[k].ic)}</span><span class="tx"><b>${hqT(k)}</b><span>${L(...HQ_SEC[k].s)}</span></span><i aria-hidden="true">▶</i></button>`).join("")}</div>` : ""}`;
}
function renderHQ() {
  if (isSeason()) { renderSeasonHQ(); return; }
  const t = FRONT.team || DRIVERS[0].team, T = TEAMS[t];
  if (HQS.t !== t) HQS.pref = 0; HQS.t = t; if (!(HQS.sec === "home" || HQ_SEC[HQS.sec])) HQS.sec = "home"; HQS.stage = null; HQS.i = -1;
  const trk = document.getElementById("ldTrace")?.getAttribute("d");
  const d0 = GP_INFO.days[0][1], d1 = GP_INFO.days[2][1];
  const ssn = isSeason();
  $("fxHq").innerHTML = `<div class="hq${ssn ? " season" : ""}" style="--tc:${T.col}">
    <div class="hq-top">${backBtn(ssn ? "main" : "team")}<div class="tt"><span>Team Principal · ${ssn ? L("Temporada", "Season") : L("Gran Premio", "Grand Prix")}</span><b>${L("Sede del equipo", "Team HQ")}</b></div></div>
    ${ssn ? '<div class="hq-main" id="hqMain">' : ""}<div class="hq-show" id="hqShow"><div class="hq-stripe"></div></div>${ssn ? '<div class="hq-page" id="hqPage" hidden></div></div>' : ""}
    <aside class="hq-side">
      <div class="hq-id">${teamLogo(t, "hlg")}<div class="nm"><b>${T.full}</b><em>${L("Motor", "Power unit")} ${T.pu}</em></div></div>
      ${hqTpCard(t)}
      ${IV_ON ? hqMediaCard(t) : ""}
      ${ssn ? sSideCard() : `<div class="hq-menu">
        <button class="hq-it" data-hqgo="1">
          <span class="ic">${trk ? `<svg viewBox="263 393 2215 721" aria-hidden="true"><path d="${trk}"/></svg>` : ""}</span>
          <span class="tx"><span class="nx">${L("Siguiente ronda", "Next round")} · R${GP_INFO.round}</span><b>${L("Preparación GP", "GP preparation")}</b>
            <span class="gp">${flagSvg("ES")}${OPT.lang === "en" ? GP_INFO.title + " GP" : "GP de " + GP_INFO.title}</span>
            <span class="dt">${L("España", "Spain")} · ${d0}–${d1} ${GP_INFO.month}</span></span>
          <span class="ar" aria-hidden="true">▶</span>
        </button>
      </div>`}
      <nav class="hq-nav" aria-label="${L("Departamentos", "Departments")}"><span class="hq-k">${L("Departamentos", "Departments")}</span>${hqNavHtml()}</nav>
    </aside>
  </div>`;
  hqNavSync(); tpPortrait($("hqTpCv"), TP, t);
  if (IV_ON && !IV.pre) { IV.pre = 1; imgsReady([IV_SET.press.src, IV_SET.grid.src]); }   // the interview sets, ready in advance
  requestAnimationFrame(() => hqStage(HQS.sec));
  if (ssn) sPageShow(HQS.sec || "home");
}
function hqStage(sec) {                                        // build a screen over the previous one and crossfade
  const show = $("hqShow"); if (!show || FRONT.v !== "hq") return;
  const t = HQS.t, slides = hqSecSlides(sec, t);
  const st = document.createElement("div"); st.className = "hq-stage" + (sec === "home" ? "" : " sec"); st.dataset.sec = sec;
  st.innerHTML = slides.map(sl => `<div class="hq-s">${sl.src ? `<img class="hq-im" src="${sl.src}" alt="${sl.lab}" draggable="false" decoding="async">` : ""}</div>`).join("")
    + `<div class="hq-shade"></div>`
    + (slides.length > 1 ? `<div class="hq-bars">${slides.map((sl, i) => `<button class="hq-bar" data-hqs="${i}" aria-label="${sl.lab}"><i><u></u></i><span>${String(i + 1).padStart(2, "0")} · ${sl.lab}</span></button>`).join("")}</div>` : "")
    + hqOverlay(sec, t) + `<div class="hq-lab"></div>`;
  const els = [...st.querySelectorAll(".hq-s")];
  slides.forEach((sl, i) => { if (sl.cv) { const cv = sl.cv(); if (cv) { cv.classList.add("hq-im"); els[i].append(cv); sl.ar = cv.width / cv.height; } } });
  const old = [...show.querySelectorAll(".hq-stage")];
  show.insertBefore(st, show.querySelector(".hq-stripe"));
  clearTimeout(HQS.timer); HQS.stage = st; HQS.slides = slides; HQS.i = -1; HQS.k = 0;
  requestAnimationFrame(() => { st.classList.add("in"); hqShow(0); });
  old.forEach(o => { o.classList.remove("in"); o.classList.add("out"); setTimeout(() => { o.querySelectorAll(".hq-im").forEach(m => m.getAnimations().forEach(a => a.cancel())); o.remove(); }, 800); });
  if (!HQS.pref) {                                             // the other screens' pictures come in quietly meanwhile
    HQS.pref = 1;
    const t = HQS.t;
    setTimeout(() => imgsReady(["assets/hq/int_board.jpg", "assets/hq/int_design.jpg", "assets/hq/int_cnc.jpg", "assets/hq/int_tunnel.jpg", `assets/hq/cafe_${t}.jpg`, "assets/hq/int_press.jpg", "assets/hq/int_finance.jpg",
      "assets/hq/int_factory.jpg", "assets/hq/int_ops.jpg", "assets/hq/int_gym.jpg", "assets/hq/int_sim.jpg", `assets/hq/trophy_${t}.jpg`, "assets/img/drivers.jpg"]), 1500);
  }
}
function hqOpen(sec) {
  if (isSeason() && SX_FIRST[sec]) sec = SX_FIRST[sec];
  if (!(sec === "home" || HQ_SEC[sec])) return;
  const same = sec === HQS.sec && HQS.stage && HQS.stage.isConnected;
  HQS.sec = sec; hqNavSync();
  if (isSeason()) { if (!same || SP.sec !== sec) sPageShow(sec); }
  if (same) return;
  const slides = hqSecSlides(sec, HQS.t), imgs = imgsReady(slides.filter(s => s.src).map(s => s.src)), needMap = slides.some(s => s.k === "sim");
  gate(() => { const r = imgs(), mapOk = !needMap || (mapImg.complete && mapImg.naturalWidth);
      return r === true && mapOk ? true : r === true ? (window.LOADER?.progress ? LOADER.progress() : 0.5) : r; },
    () => { if (FRONT.v === "hq" && HQS.sec === sec) hqStage(sec); }, L("Cargando", "Loading"));
}
function hqStop() { clearTimeout(HQS.timer); HQS.timer = 0; document.querySelectorAll(".hq-im").forEach(m => m.getAnimations().forEach(a => a.cancel())); }
function hqMove(el, sl, rev, dur, ease) {                                 // zoom and pan across the whole picture, never showing its edges
  const m = el.querySelector(".hq-im"); if (!m) return;
  const W = el.clientWidth, H = el.clientHeight; if (W < 10 || H < 10) return;
  const A = sl.ar || (m.naturalWidth ? m.naturalWidth / m.naturalHeight : 1.79);
  let wc, hc; if (W / H < A) { hc = H; wc = H * A; } else { wc = W; hc = W / A; }
  m.style.width = wc + "px"; m.style.height = hc + "px";
  let P = sl.m || HQ_MOVE[sl.k] || HQ_MOVE.air; if (rev) P = [P[1], P[0]];
  const still = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const kf = (still ? [P[0], P[0]] : P).map(([z, px, py]) => ({ transform: `translate3d(${(-px * (wc * z - W)).toFixed(1)}px,${(-py * (hc * z - H)).toFixed(1)}px,0) scale(${z})` }));
  m.getAnimations().forEach(a => a.cancel());
  m.animate(kf, { duration: dur || HQS.dur + 1800, easing: ease || "cubic-bezier(.42,0,.58,1)", fill: "forwards" });
}
function hqShow(i) {
  const st = HQS.stage; if (!st || !st.isConnected) return;
  const els = [...st.querySelectorAll(".hq-s")], n = els.length; if (!n) return;
  i = ((i % n) + n) % n;
  HQS.k = n === 1 && HQS.i === i ? HQS.k + 1 : 0; HQS.i = i;  // a single picture goes back and forth
  const sl = HQS.slides[i], im = els[i].querySelector("img");
  if (im && !(im.complete && im.naturalWidth) && !sl.wait) { sl.wait = 1; im.addEventListener("load", () => { if (HQS.stage === st && HQS.i === i) hqMove(els[i], sl); }, { once: true }); }
  hqMove(els[i], sl, HQS.k % 2 === 1);
  els.forEach((e, j) => e.classList.toggle("on", j === i));
  st.querySelectorAll(".hq-bar").forEach((b, j) => {
    b.classList.toggle("on", j === i); b.classList.toggle("done", j < i);
    const f = b.querySelector("u"); f.getAnimations().forEach(a => a.cancel());
    if (j === i) f.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: HQS.dur, easing: "linear", fill: "forwards" });
  });
  const lab = st.querySelector(".hq-lab"); if (lab && HQS.k === 0) { lab.textContent = sl.lab; lab.classList.remove("in"); void lab.offsetWidth; lab.classList.add("in"); }
  clearTimeout(HQS.timer); HQS.timer = setTimeout(() => { if (FRONT.v === "hq" && HQS.stage === st) hqShow(i + 1); }, HQS.dur);
}
function hqGo() {
  if (FRONT.leaving) return;
  if (isSeason() && !S._go) { sMain(); return; }
  const go = () => gate(gpReady, () => { FRONT.leaving = false; $("front").classList.remove("leave"); hideFront(); ivStartGP(); }, L("Preparando el Gran Premio", "Preparing the Grand Prix"));
  FRONT.leaving = true;
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) { go(); return; }
  $("front").classList.add("leave"); setTimeout(go, 380);
}
function hqKey(e) {                                            // keys on the HQ screen
  const ae = document.activeElement, onBtn = ae && ae.tagName === "BUTTON" && ae.closest && ae.closest("#fxHq");
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    const list = [...document.querySelectorAll("#fxHq .hq-it, #fxHq .hq-n, #fxHq .sx-n")].filter(b => !b.closest("[inert]"));
    let i = list.indexOf(ae); i = i < 0 ? 0 : (i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length;
    e.preventDefault(); list[i].focus(); return;
  }
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); hqShow(HQS.i + (e.key === "ArrowRight" ? 1 : -1)); return; }
  if ((e.key === "Enter" || e.key === " ") && !onBtn && !isSeason()) { e.preventDefault(); hqGo(); }
}
addEventListener("resize", () => { if (FRONT.v === "hq" && HQS.stage && HQS.i >= 0) { const el = HQS.stage.querySelectorAll(".hq-s")[HQS.i]; if (el) hqMove(el, HQS.slides[HQS.i]); } });
// ---------- generic loading screen: an invented circuit being lapped; shown only when the next screen isn't ready yet ----------
const GTRACK = "M180 390 C252 390 470 390 560 390 C650 390 677 393 720 388 C763 383 793 376 820 362 C847 348 866 324 880 302 C894 280 902 254 902 232 C902 210 894 187 882 172 C870 157 852 146 832 142 C812 138 785 142 764 150 C743 158 726 183 704 192 C682 201 657 209 634 204 C611 199 587 182 566 164 C545 146 529 113 506 96 C483 79 467 70 426 64 C385 58 304 61 262 62 C220 63 197 64 172 72 C147 80 124 96 112 112 C100 128 96 154 102 170 C108 186 127 202 150 210 C173 218 215 213 240 220 C265 227 290 238 298 252 C306 266 301 290 290 302 C279 314 254 317 232 322 C210 327 180 326 160 332 C140 338 117 349 112 358 C107 367 117 383 128 388 C139 393 108 390 180 390Z";
const GL_TIPS = [["En seco hay que usar al menos dos compuestos distintos durante la carrera.", "In the dry you must use at least two different compounds during the race."],
  ["Con el Safety Car en pista, parar en boxes cuesta mucho menos tiempo.", "With the Safety Car out, a pit stop costs far less time."],
  ["Abre el muro de boxes (PW) para ver tiempos, neumáticos y meteorología en directo.", "Open the pit wall (PW) for live timing, tyres and weather."],
  ["Toca la placa de un piloto para ver sus neumáticos y llamarlo a boxes.", "Tap a driver's plate to see his tyres and call him in."],
  ["Usa el modo «Recarga» del ERS para tener batería cuando toque atacar.", "Use the ERS 'Recharge' mode to have battery when it's time to attack."],
  ["Las sensaciones del piloto te dicen hacia dónde mover el reglaje.", "The driver's feedback tells you which way to move the set-up."]];
const GLOAD = { el: null, job: 0, on: false, shown: 0, real: null, t0: 0, prev: 0, raf: 0, LEN: 0, finish: null, tipT: 0, ti: 0 };
const IMGC = {};
function gloadEl() {
  if (GLOAD.el) return GLOAD.el;
  const el = document.createElement("div"); el.id = "gload"; el.hidden = true; el.setAttribute("aria-busy", "true"); el.dataset.nt = "1";
  const chk = [0, 1, 2, 3].map(i => `<rect x="${176 + (i % 2) * 5}" y="${378 + i * 6}" width="5" height="6" fill="#f4f5f2"/><rect x="${181 - (i % 2) * 5}" y="${378 + i * 6}" width="5" height="6" fill="#0d1014"/>`).join("");
  el.innerHTML = `<div class="ld-h"><span class="ld-logo"><img class="pgm" src="assets/img/rtm_line.png" alt="Racing Team Manager"></span></div>
    <div class="ld-b"><svg class="ld-map gl-map" viewBox="70 40 860 378" aria-hidden="true"><path class="ld-run" d="${GTRACK}"/><path class="ld-base" d="${GTRACK}"/><path class="ld-trace" d="${GTRACK}" style="opacity:0"/><g>${chk}</g><circle class="ld-dot" cx="180" cy="390" r="8"/></svg>
      <div class="ld-p"><div class="ld-row"><span class="ld-st" role="status"></span><span class="ld-pc">0<small>%</small></span></div><div class="ld-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></div></div></div>
    <div class="ld-f"><span class="ld-tk"></span><span class="ld-tip"></span></div>`;
  document.body.append(el); GLOAD.el = el;
  const tr = el.querySelector(".ld-trace"); try { GLOAD.LEN = tr.getTotalLength(); tr.style.strokeDasharray = GLOAD.LEN + " " + GLOAD.LEN; tr.style.strokeDashoffset = GLOAD.LEN; tr.style.opacity = 1; } catch (e) { }
  return el;
}
function gloadShow(label) {
  const el = gloadEl();
  el.querySelector(".ld-st").textContent = label || L("Cargando…", "Loading…");
  el.querySelector(".ld-tk").textContent = L("Consejo", "Tip");
  const tip = el.querySelector(".ld-tip"), setTip = () => { tip.textContent = GL_TIPS[GLOAD.ti % GL_TIPS.length][OPT.lang === "en" ? 1 : 0]; };
  GLOAD.ti = Math.floor(Math.random() * GL_TIPS.length); setTip(); clearInterval(GLOAD.tipT);
  GLOAD.tipT = setInterval(() => { tip.classList.add("out"); setTimeout(() => { GLOAD.ti++; setTip(); tip.classList.remove("out"); }, 350); }, 4500);
  GLOAD.shown = 0; GLOAD.real = null; GLOAD.finish = null; GLOAD.t0 = GLOAD.prev = performance.now(); GLOAD.on = true;
  el.hidden = false; el.classList.remove("done", "in"); void el.offsetWidth; el.classList.add("in");
  cancelAnimationFrame(GLOAD.raf); GLOAD.raf = requestAnimationFrame(gloadTick);
}
function gloadTick(now) {
  GLOAD.raf = 0; if (!GLOAD.on) return;
  const el = GLOAD.el, dt = Math.min(0.1, (now - GLOAD.prev) / 1000); GLOAD.prev = now;
  const creep = 0.9 * (1 - Math.exp(-(now - GLOAD.t0) / 2600));
  const tgt = GLOAD.finish ? 1 : Math.min(0.97, GLOAD.real == null ? creep : Math.max(GLOAD.real, creep * 0.35));
  GLOAD.shown = Math.max(GLOAD.shown, GLOAD.shown + (tgt - GLOAD.shown) * Math.min(1, dt * (GLOAD.finish ? 10 : 4)));
  if (GLOAD.finish && GLOAD.shown > 0.995) GLOAD.shown = 1;
  const p = GLOAD.shown, pc = Math.floor(p * 100);
  el.querySelector(".ld-pc").firstChild.nodeValue = pc; el.querySelector(".ld-bar").setAttribute("aria-valuenow", pc);
  el.querySelector(".ld-bar i").style.transform = `scaleX(${p.toFixed(4)})`;
  if (GLOAD.LEN) {
    const tr = el.querySelector(".ld-trace"), dot = el.querySelector(".ld-dot"), pt = tr.getPointAtLength(GLOAD.LEN * p);
    tr.style.strokeDashoffset = (GLOAD.LEN * (1 - p)).toFixed(1); dot.setAttribute("cx", pt.x.toFixed(1)); dot.setAttribute("cy", pt.y.toFixed(1));
  }
  if (GLOAD.finish && p >= 1) { const f = GLOAD.finish; GLOAD.finish = null; setTimeout(() => { gloadHide(); f(); }, 120); return; }
  GLOAD.raf = requestAnimationFrame(gloadTick);
}
function gloadHide() {
  GLOAD.on = false; clearInterval(GLOAD.tipT); cancelAnimationFrame(GLOAD.raf); GLOAD.raf = 0;
  const el = GLOAD.el; if (!el || el.hidden) return;
  el.classList.add("done"); setTimeout(() => { if (!GLOAD.on) el.hidden = true; }, 420);
}
// run go() once check() says everything is there; the loading screen only appears if that takes more than an instant.
// check() returns true when ready, or a number 0..1 (progress) / anything else while waiting.
function gate(check, go, label) {
  const job = ++GLOAD.job, t0 = performance.now();
  if (check() === true) { if (GLOAD.on) gloadHide(); go(); return; }
  let shown = false;
  const poll = () => {
    if (job !== GLOAD.job) return;
    const r = check(), now = performance.now();
    if (r === true || now - t0 > 30000) {
      if (shown && GLOAD.on) { GLOAD.finish = go; if (!GLOAD.raf) GLOAD.raf = requestAnimationFrame(gloadTick); } else go();
      return;
    }
    if (!shown && now - t0 > 150) { shown = true; gloadShow(label); }
    GLOAD.real = typeof r === "number" ? r : null;
    setTimeout(poll, 50);
  };
  setTimeout(poll, 30);
}
function imgsReady(srcs) {                                    // true once every picture is in (or failed), else the fraction loaded
  const ims = srcs.map(s => IMGC[s] || (IMGC[s] = Object.assign(new Image(), { decoding: "async", src: s })));
  return () => { const n = ims.filter(im => im.complete).length; return n === ims.length ? true : n / ims.length; };
}
const gpReady = () => (mapImg.complete && mapImg.naturalWidth && (!window.LOADER?.done || LOADER.done())) ? true : (window.LOADER?.progress ? LOADER.progress() : null);
function openHQ(before) {                                     // the team's HQ, once its pictures are in
  const t = DRIVERS[0].team, imgs = imgsReady(hqSlides(t).filter(s => s.src).map(s => s.src));
  gate(() => { const r = imgs(); return r === true && GARV.img.complete ? true : r === true ? 0.95 : r; },
    () => { before?.(); FRONT.team = t; HQS.sec = "home"; showFront("hq"); saveGame();
      if (isSeason() && !S.steps.board) setTimeout(() => { if (FRONT.v === "hq" && !S.steps.board) sBoardOpen(); }, 1100); }, L("Cargando la sede", "Loading the HQ"));
}
