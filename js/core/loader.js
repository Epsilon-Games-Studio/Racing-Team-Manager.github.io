// Loader: downloads the circuit image as early as possible (with real byte progress when the browser lets us read the stream),
// then waits for the sprites the game registers (LOADER.track), the ground analysis of the map (LOADER.whenMap) and the fonts.
(function () {
  "use strict";
  var el = function (id) { return document.getElementById(id); };
  var root = el("loader");
  var VISIBLE = false;                              // the loading screen is kept but no longer shown: the game opens on its title screen
  if (!VISIBLE) { root.style.display = "none"; root.setAttribute("aria-busy", "false"); }
  var MAP_SRC = ["assets/img/circuito.png"];                 // the circuit image exactly as supplied: lossless PNG, 2752×1536 = one image pixel per map pixel
  var BPS = 1.4e6;                                   // assumed bytes/s, only for the estimate of files that can't be streamed
  var ITEMS = {}, ORDER = [];
  function item(key, label, w, est) { var it = { key: key, label: label, w: w, f: 0, done: false, started: false, t0: 0, est: est || (w / BPS + 0.4) }; ITEMS[key] = it; ORDER.push(it); return it; }
  item("map", "Descargando el circuito", 8127662);
  item("game", "Cargando el juego", 260e3, 1.4);
  item("cars", "Cargando los monoplazas", 889e3);
  item("aero", "Cargando los planos técnicos", 135e3);
  item("sc", "Cargando el Safety Car", 125e3);
  item("ground", "Analizando la superficie de la pista", 160e3, 0.6);
  item("fonts", "Preparando el paddock", 40e3, 0.8);
  function start(key) { var it = ITEMS[key]; if (it && !it.started) { it.started = true; it.t0 = performance.now(); } }
  function finish(key) { var it = ITEMS[key]; if (!it || it.done) return; start(key); it.done = true; it.f = 1; }
  start("map"); start("game"); start("fonts");

  // ---- the circuit image ----
  var map = new Image(), mapOK = false, mapCbs = [], noGround = false, gameReady = false;
  map.decoding = "async";
  function mapLoaded() {
    var go = function () { if (mapOK) return; mapOK = true; finish("map"); runGround(); };
    if (map.decode) map.decode().then(go, go); else go();
  }
  function useSrc(i) {
    map.onload = mapLoaded;
    map.onerror = function () { if (i + 1 < MAP_SRC.length) useSrc(i + 1); else fail("No se ha podido cargar el circuito.", "Reintentar", function () { location.reload(); }); };
    map.src = MAP_SRC[i];
  }
  function stream() {
    var it = ITEMS.map;
    if (!window.fetch || !window.ReadableStream || !window.URL || !URL.createObjectURL) return useSrc(0);
    fetch(MAP_SRC[0]).then(function (r) {
      if (!r.ok || !r.body || !r.body.getReader) throw new Error("no stream");
      var total = +r.headers.get("content-length") || it.w, type = r.headers.get("content-type") || "image/jpeg";
      it.total = total; it.got = 0; it.streamed = true;
      var rd = r.body.getReader(), chunks = [];
      function pump() {
        return rd.read().then(function (res) {
          if (res.done) return;
          chunks.push(res.value); it.got += res.value.length; it.f = Math.min(0.97, it.got / total);
          return pump();
        });
      }
      return pump().then(function () {
        var url = URL.createObjectURL(new Blob(chunks, { type: type }));
        map.onload = mapLoaded;
        map.onerror = function () { URL.revokeObjectURL(url); it.streamed = false; useSrc(0); };   // blob: refused -> plain file (now cached)
        map.src = url;
      });
    }).catch(function () { it.streamed = false; useSrc(0); });
  }
  stream();

  // ---- the ground analysis the game runs on the map pixels (heavy: done here, with its own label) ----
  var grounding = false;
  function runGround() {
    if (!mapOK || grounding || ITEMS.ground.done) return;
    if (!mapCbs.length) { if (noGround) finish("ground"); return; }
    grounding = true; start("ground");
    requestAnimationFrame(function () { requestAnimationFrame(function () {      // let the label paint first
      mapCbs.splice(0).forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
      finish("ground");
    }); });
  }

  // ---- fonts ----
  var fontsDone = function () { finish("fonts"); };
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fontsDone, fontsDone); setTimeout(fontsDone, 4000); } else fontsDone();

  window.LOADER = {
    map: map,
    track: function (key, img) {
      var it = ITEMS[key]; if (!it || it.img) return; it.img = img; start(key);
      var fin = function () { finish(key); };
      if (img.complete) fin();
      else { img.addEventListener("load", fin); img.addEventListener("error", fin); }
    },
    whenMap: function (fn) { mapCbs.push(fn); runGround(); },
    ready: function () {                                // the game script has run: anything it never asked for is not coming
      gameReady = true; finish("game");
      ORDER.forEach(function (it) { if (!it.started && it.key !== "ground") finish(it.key); });
      if (!mapCbs.length && !grounding) { noGround = true; runGround(); }
    }
  };

  window.LOADER.progress = function () {             // 0..1 over everything the game needs (the circuit image weighs the most)
    var sw = 0, sf = 0, now = performance.now();
    ORDER.forEach(function (it) { var f = it.f; if (!it.done && it.started && !(it.key === "map" && it.streamed)) f = Math.max(f, 0.9 * (1 - Math.exp(-(now - it.t0) / 1000 / it.est))); sw += it.w; sf += it.w * (it.done ? 1 : f); });
    return Math.min(0.99, sf / sw);
  };
  window.LOADER.done = function () { return ORDER.every(function (it) { return it.done; }); };

  // ---- display ----
  var trace = el("ldTrace"), dot = el("ldDot"), fill = el("ldFill"), pcEl = el("ldPc"), stEl = el("ldSt"), bar = el("ldBar");
  var LEN = 0; try { LEN = trace.getTotalLength(); trace.style.strokeDasharray = LEN + " " + LEN; trace.style.strokeDashoffset = LEN; trace.style.opacity = 1; } catch (e) { }
  var shown = 0, lastPc = -1, lastSt = "", prev = performance.now(), t0 = prev, lastKey = "", lastMove = prev, closing = false, failed = false, slowShown = false, raf = 0;
  var mb = function (b) { return (b / 1e6).toFixed(1).replace(".", ","); };
  function status() {
    for (var i = 0; i < ORDER.length; i++) {
      var it = ORDER[i]; if (it.done || !it.started) continue;
      if (it.key === "map" && it.streamed && it.total) return it.label + " · <b>" + mb(it.got) + " / " + mb(it.total) + " MB</b>";
      return it.label + "…";
    }
    return "¡Listo!";
  }
  function tick(now) {
    raf = 0; if (closing) return;
    var dt = Math.min(0.1, (now - prev) / 1000); prev = now;
    var sw = 0, sf = 0, all = true;
    ORDER.forEach(function (it) {
      if (!it.done) { all = false; if (it.started && !(it.key === "map" && it.streamed)) it.f = Math.max(it.f, 0.9 * (1 - Math.exp(-(now - it.t0) / 1000 / it.est))); }
      sw += it.w; sf += it.w * it.f;
    });
    var target = all ? 1 : Math.min(0.99, sf / sw);
    shown = Math.max(shown, shown + (target - shown) * Math.min(1, dt * (all ? 14 : 5)));
    if (all && shown > 0.995) shown = 1;
    var pc = Math.floor(shown * 100);
    if (pc !== lastPc) { lastPc = pc; pcEl.firstChild.nodeValue = pc; bar.setAttribute("aria-valuenow", pc); }
    fill.style.transform = "scaleX(" + shown.toFixed(4) + ")";
    if (LEN) { trace.style.strokeDashoffset = (LEN * (1 - shown)).toFixed(1); var p = trace.getPointAtLength(LEN * shown); dot.setAttribute("cx", p.x.toFixed(1)); dot.setAttribute("cy", p.y.toFixed(1)); }
    if (!failed) { var s = status(); if (s !== lastSt) { lastSt = s; stEl.innerHTML = s; } }
    var key = ORDER.filter(function (it) { return it.done; }).length + ":" + (ITEMS.map.got || 0); if (key !== lastKey) { lastKey = key; lastMove = now; }
    if (!failed && !slowShown && !all && gameReady && now - lastMove > (ITEMS.map.streamed || ITEMS.map.done ? 15000 : 45000)) { slowShown = true; fail("Está tardando más de lo normal.", "Continuar", close, true); }
    if (shown >= 1) { setTimeout(close, 200); return; }
    raf = requestAnimationFrame(tick);
  }
  function fail(msg, btn, fn, soft) {
    if (!VISIBLE) { console.warn(msg); return; }
    if (!soft) { failed = true; stEl.textContent = msg; }
    el("ldMsg").textContent = soft ? msg : ""; el("ldBtn").textContent = btn; el("ldBtn").onclick = fn; el("ldAct").hidden = false;
  }
  function close() {
    if (closing) return; closing = true; if (raf) cancelAnimationFrame(raf); clearInterval(tipT);
    root.setAttribute("aria-busy", "false"); root.classList.add("done");
    setTimeout(function () { if (root.parentNode) root.parentNode.removeChild(root); }, 700);
  }
  if (VISIBLE) raf = requestAnimationFrame(tick);

  // ---- tips ----
  var TIPS = [
    "En seco hay que usar al menos dos compuestos distintos durante la carrera.",
    "Con el Safety Car en pista, parar en boxes cuesta mucho menos tiempo.",
    "Abre el muro de boxes (PW) para ver tiempos, neumáticos y meteorología en directo.",
    "Toca la placa de un piloto para ver sus neumáticos y llamarlo a boxes.",
    "Usa el modo «Recarga» del ERS para tener batería cuando toque atacar."
  ], tip = el("ldTip"), ti = Math.floor(Math.random() * TIPS.length);
  tip.textContent = TIPS[ti];
  var tipT = VISIBLE && setInterval(function () {
    tip.classList.add("out");
    setTimeout(function () { ti = (ti + 1) % TIPS.length; tip.textContent = TIPS[ti]; tip.classList.remove("out"); }, 350);
  }, 4500);
})();
