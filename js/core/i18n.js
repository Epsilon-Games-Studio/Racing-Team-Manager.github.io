// ---------- language: Spanish (source) / English (translated on the fly: page text, tooltips and canvas labels) ----------
(function () {
  "use strict";
  var DICT = window.RTM_DICT || {}, WORDS = window.RTM_WORDS || {};
  var stored = "es"; try { stored = (JSON.parse(localStorage.getItem("f1tm.opt") || "{}").lang) || "es"; } catch (e) { }
  var lang = function () { return (typeof OPT !== "undefined" && OPT.lang) || stored; };
  var cache = new Map(), NAMES = null, NAMES_N = -1;
  function names() {                                                // proper names stay as they are
    var list = ["Circuit de Barcelona-Catalunya", "Barcelona-Catalunya", "Barcelona", "Catalunya", "Montmeló", "Safety Car", "Pit wall", "Pit lane"];
    try {
      DRIVERS.forEach(function (d) { list.push(d.code, d.name); });
      Object.keys(FIRST).forEach(function (k) { list.push(k, FIRST[k]); });
      Object.keys(TEAMS).forEach(function (k) { list.push(TEAMS[k].name); if (TEAMS[k].full) list.push(TEAMS[k].full); });
      FREE_AGENTS.forEach(function (d) { list.push(d.code, d.name); });
    } catch (e) { }
    if (list.length === NAMES_N) return NAMES;
    NAMES_N = list.length;
    list = list.filter(function (x, i) { return x && list.indexOf(x) === i; }).sort(function (a, b) { return b.length - a.length; });
    var esc = list.map(function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    NAMES = new RegExp("(\\{[a-z]\\})|(?<![A-Za-zÁÉÍÓÚáéíóúÑñÜü])(" + esc.join("|") + ")(?![A-Za-zÁÉÍÓÚáéíóúÑñÜü])|([+−\\-]?\\d+(?:[.,:]\\d+)*)", "g");
    cache.clear();
    return NAMES;
  }
  var LET = /[A-Za-zÁÉÍÓÚáéíóúÑñ]/;
  function norm(s) {                                                // numbers, names and radio placeholders become {}
    var vals = [], rx = names(); rx.lastIndex = 0;
    var key = s.replace(rx, function (m) { vals.push(m); return "{}"; });
    return { key: key.toLowerCase(), vals: vals };
  }
  function fill(v, vals) {
    var i = 0;
    return v.replace(/\{(\d*)\}/g, function (m, n) { var x = n === "" ? vals[i++] : vals[+n]; return x == null ? "" : x; });
  }
  function caseLike(src, out) {
    var letters = src.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ]/g, "");
    if (letters.length > 1 && letters === letters.toUpperCase() && /[A-Za-z]/.test(out)) return out.toUpperCase();
    if (letters.length === 1) return out;                            // single-letter abbreviations (20v → 20L)
    var f = src.match(/[A-Za-zÁÉÍÓÚáéíóúÑñ¿¡]/);
    if (f && f[0] === f[0].toLowerCase() && f[0] !== "¿" && f[0] !== "¡") { var g = out.match(/[A-Za-z]/); if (g && !/^[A-Z]{2}/.test(out.slice(out.indexOf(g[0])))) return out.replace(g[0], g[0].toLowerCase()); }
    return out;
  }
  function look(part) {                                             // a whole phrase, with its numbers and names
    var n = norm(part), v = DICT[n.key];
    if (v == null) { var st = n.key.replace(/^[^\p{L}{¡¿]+|[^\p{L}}.!?%)]+$/gu, ""); if (st !== n.key) v = DICT[st]; if (v != null) { var pre = part.match(/^[^\p{L}\d{¡¿]*/u)[0], post = part.match(/[^\p{L}\d}.!?%)]*$/u)[0]; return pre + caseLike(part, fill(v, n.vals)) + post; } }
    return v == null ? null : caseLike(part, fill(v, n.vals));
  }
  function words(part) {                                            // fallback: phrase by phrase, word by word
    var toks = part.split(/([A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)/), out = [], i = 0;
    while (i < toks.length) {
      var done = false;
      if (i % 2 === 1) {
        for (var n = 4; n >= 1 && !done; n--) {                     // up to 4 words joined by single spaces
          var j = i, seg = toks[i], ok = true;
          for (var m = 1; m < n; m++) { if (toks[j + 1] !== " " || j + 2 >= toks.length) { ok = false; break; } seg += " " + toks[j + 2]; j += 2; }
          if (!ok) continue;
          var low = seg.toLowerCase(), t = DICT[low] != null && DICT[low].indexOf("{") < 0 ? DICT[low] : WORDS[low];
          if (t != null) { out.push(caseLike(seg, t)); i = j + 1; done = true; }
        }
      }
      if (!done) { out.push(toks[i]); i++; }
    }
    return out.join("");
  }
  function t(s) {
    if (s == null) return s;
    s = String(s);
    if (lang() !== "en" || !LET.test(s)) return s;
    var c = cache.get(s); if (c != null) return c;
    var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim(), r = look(core);
    if (r == null) {
      r = core.split(/(\s+·\s+|\s+—\s+|\n)/).map(function (p, i) { if (i % 2 || !LET.test(p)) return p; var x = look(p.trim()); return x != null ? p.replace(p.trim(), x) : words(p); }).join("");
    }
    r = lead + r.replace(/(\d),(\d)/g, "$1.$2") + trail;
    if (cache.size > 6000) cache.clear();
    cache.set(s, r); return r;
  }
  // ---- the page
  var ORIG = new WeakMap(), OUT = new WeakMap(), AORIG = new WeakMap();
  var skip = function (el) { return !el || el.closest && el.closest("[data-nt],script,style,textarea,.fx"); };
  function node(n) {
    if (n.nodeType !== 3) return;
    var p = n.parentElement; if (!p || skip(p)) return;
    var cur = n.nodeValue;
    if (OUT.get(n) !== cur) ORIG.set(n, cur);                     // the game wrote new text
    var src = ORIG.get(n); if (src == null) return;
    var want = lang() === "en" ? t(src) : src;
    if (want !== cur) { OUT.set(n, want); n.nodeValue = want; } else OUT.set(n, cur);
  }
  function attr(el, a) {
    if (skip(el)) return;
    var o = AORIG.get(el) || {}, cur = el.getAttribute(a); if (cur == null) return;
    if (o["_" + a] !== cur) o[a] = cur;
    var want = lang() === "en" ? t(o[a]) : o[a];
    o["_" + a] = want; AORIG.set(el, o);
    if (want !== cur) el.setAttribute(a, want);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { node(root); return; }
    if (root.nodeType !== 1 || skip(root)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) node(n);
    if (root.hasAttribute && (root.hasAttribute("title") || root.hasAttribute("aria-label"))) { attr(root, "title"); attr(root, "aria-label"); }
    root.querySelectorAll && root.querySelectorAll("[title],[aria-label]").forEach(function (e) { attr(e, "title"); attr(e, "aria-label"); });
  }
  var obs = new MutationObserver(function (recs) {
    if (lang() !== "en" && !obs.dirty) return;
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i];
      if (r.type === "characterData") node(r.target);
      else if (r.type === "attributes") attr(r.target, r.attributeName);
      else for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]);
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["title", "aria-label"] });
  function apply() { obs.dirty = lang() !== "en"; walk(document.body); obs.dirty = false; document.documentElement.lang = lang(); }
  // ---- canvas labels
  var C = CanvasRenderingContext2D.prototype;
  ["fillText", "strokeText", "measureText"].forEach(function (k) {
    var f = C[k]; C[k] = function (s) { if (typeof s === "string" && lang() === "en") arguments[0] = t(s); return f.apply(this, arguments); };
  });
  window.I18N = { t: t, apply: apply, lang: lang };
  document.documentElement.lang = lang();
  if (document.readyState !== "loading") apply(); else document.addEventListener("DOMContentLoaded", apply);
})();

