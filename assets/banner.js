/* Homepage slideshow banner: responsive SVG artwork, autoplay, arrows, dots, pause/play, swipe, keyboard.
   Pauses on keyboard focus and hidden tab; no autoplay with reduced motion. */
(function () {
  "use strict";
  var root = document.querySelector("[data-banner]");
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-banner-slide]"));
  var dots = Array.prototype.slice.call(root.querySelectorAll("[data-banner-dot]"));
  var track = root.querySelector("[data-banner-track]");
  var toggle = root.querySelector("[data-banner-toggle]");
  var interval = Number(root.getAttribute("data-interval")) || 6000;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var index = 0, timer = null, playing = !reduce, hovering = false, focused = false;

  /* ---------- artwork: load the SVG that fits the screen, then set up its animation ---------- */
  var arts = Array.prototype.slice.call(root.querySelectorAll("[data-banner-art]"));
  var cache = {};
  function variant() { return window.innerWidth < 650 ? "mobile" : window.innerWidth < 1100 ? "tablet" : "desktop"; }
  function fetchSvg(url) {
    if (!cache[url]) cache[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error(url); return r.text(); });
    return cache[url];
  }
  function prepare(svg) {
    var vb = svg.viewBox.baseVal, units = [];
    function full(b) { return b.width >= vb.width * 0.9 && b.height >= vb.height * 0.9; }
    function walk(node) {
      Array.prototype.forEach.call(node.children, function (el) {
        var tag = el.tagName.toLowerCase();
        if (tag === "defs" || tag === "mask" || tag === "clippath") return;
        if (el.classList.contains("cm-bn-photo")) { el.classList.add("cm-bn-zoom"); el.setAttribute("data-layer", "bg"); return; }
        if (el.classList.contains("cm-bn-deco")) { el.classList.add("cm-bn-fade"); el.setAttribute("data-layer", "bg"); return; }
        var box; try { box = el.getBBox(); } catch (e) { return; }
        if (tag === "g" && (el.hasAttribute("mask") || full(box))) { walk(el); return; }
        if (full(box)) { el.setAttribute("data-layer", "bg"); return; } // full-frame tints stay put
        el.setAttribute("data-layer", "fg");
        units.push({ el: el, top: box.y, bottom: box.y + box.height });
      });
    }
    walk(svg);
    units.sort(function (a, b) { return a.top - b.top; });
    var rows = [];
    units.forEach(function (u) {
      var mid = (u.top + u.bottom) / 2, row = rows[rows.length - 1];
      if (row && mid >= row.top - 4 && mid <= row.bottom + 4) { row.items.push(u); row.bottom = Math.max(row.bottom, u.bottom); }
      else rows.push({ top: u.top, bottom: u.bottom, items: [u] });
    });
    rows.forEach(function (row, r) {
      row.items.forEach(function (u) {
        u.el.classList.add("cm-bn-in");
        u.el.style.setProperty("--d", (0.25 + Math.min(r, 8) * 0.09).toFixed(2) + "s");
      });
    });
  }
  /* the photo, tints and decoration become a separate layer that covers the whole banner
     (slice), while the text, logos and button keep their proportions (meet) in the middle */
  function split(svg) {
    var bg = svg.cloneNode(true);
    bg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    bg.setAttribute("aria-hidden", "true");
    bg.classList.add("cm-bn-svg--bg");
    svg.classList.add("cm-bn-svg--fg");
    Array.prototype.forEach.call(bg.querySelectorAll('[data-layer="fg"]'), function (el) { el.parentNode.removeChild(el); });
    Array.prototype.forEach.call(svg.querySelectorAll('[data-layer="bg"]'), function (el) { el.setAttribute("visibility", "hidden"); });
    svg.parentNode.insertBefore(bg, svg);
  }

  function load() {
    var v = variant();
    arts.forEach(function (art) {
      if (art.getAttribute("data-loaded") === v) return;
      var url = art.getAttribute("data-" + v);
      fetchSvg(url).then(function (text) {
        if (variant() !== v) return;
        art.classList.remove("is-ready");
        art.innerHTML = text;
        art.setAttribute("data-loaded", v);
        var svg = art.querySelector("svg");
        if (svg) { prepare(svg); split(svg); }
        syncFocus();
        // let the browser paint the hidden state first, so the entrance animation plays
        Array.prototype.forEach.call(art.querySelectorAll(".cm-bn-in,.cm-bn-zoom,.cm-bn-fade"), function (el) { void getComputedStyle(el).opacity; void getComputedStyle(el).transform; });
        void art.getBoundingClientRect();
        setTimeout(function () { art.classList.add("is-ready"); }, 60);
      }).catch(function () { /* keep the slide background if a file fails */ });
    });
  }
  var resizeTimer = null;
  window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(load, 150); });

  function syncFocus() {
    slides.forEach(function (s, k) {
      Array.prototype.forEach.call(s.querySelectorAll("a,button"), function (el) {
        if (k === index) el.removeAttribute("tabindex"); else el.setAttribute("tabindex", "-1");
      });
    });
  }

  function show(i, fromUser) {
    index = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) {
      var on = k === index;
      s.classList.toggle("is-active", on);
      if (on) s.removeAttribute("aria-hidden"); else s.setAttribute("aria-hidden", "true");
    });
    syncFocus();
    dots.forEach(function (d, k) {
      d.classList.toggle("is-active", k === index);
      d.setAttribute("aria-current", String(k === index));
    });
    restartProgress();
    if (fromUser) schedule();
  }
  function restartProgress() {
    root.classList.remove("is-timing");
    void root.offsetWidth; // restart the dot progress animation
    if (running()) root.classList.add("is-timing");
  }
  function running() { return playing && !hovering && !focused && !document.hidden; }
  function schedule() {
    window.clearTimeout(timer);
    root.classList.toggle("is-paused", !running());
    if (running()) {
      root.classList.add("is-timing");
      timer = window.setTimeout(function () { show(index + 1); schedule(); }, interval);
    } else {
      root.classList.remove("is-timing");
    }
  }
  function setPlaying(p) {
    playing = p;
    root.classList.toggle("is-stopped", !p);
    if (toggle) toggle.setAttribute("aria-label", p ? "Pause slideshow" : "Play slideshow");
    track.setAttribute("aria-live", p ? "off" : "polite");
    restartProgress();
    schedule();
  }

  root.querySelector("[data-banner-prev]").addEventListener("click", function () { show(index - 1, true); });
  root.querySelector("[data-banner-next]").addEventListener("click", function () { show(index + 1, true); });
  dots.forEach(function (d) { d.addEventListener("click", function () { show(Number(d.getAttribute("data-banner-dot")), true); }); });
  if (toggle) toggle.addEventListener("click", function () { setPlaying(!playing); });

  // hovering does not pause: the slides and the dash timers keep running
  root.addEventListener("focusin", function (e) { if (e.target.matches(":focus-visible")) { focused = true; schedule(); } });
  root.addEventListener("focusout", function (e) { if (!root.contains(e.relatedTarget)) { focused = false; restartProgress(); schedule(); } });
  document.addEventListener("visibilitychange", function () { restartProgress(); schedule(); });
  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1, true); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1, true); }
  });

  // swipe
  var x0 = null, y0 = null;
  track.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  track.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1), true);
    x0 = y0 = null;
  }, { passive: true });

  /* header loses its bottom line while it sits directly on the banner */
  var header = document.querySelector(".cm-header");
  function edge() {
    if (!header) return;
    var over = root.getBoundingClientRect().bottom > header.getBoundingClientRect().bottom + 1;
    header.classList.toggle("is-over-banner", over);
  }
  window.addEventListener("scroll", edge, { passive: true });
  window.addEventListener("resize", edge);
  edge();

  /* menu links (index.html#lms, #fittest) open their slide */
  function fromHash(scroll) {
    var id = (window.location.hash || "").slice(1);
    for (var k = 0; k < slides.length; k++) {
      if (slides[k].id && slides[k].id === id) {
        show(k, true);
        if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
  }
  window.addEventListener("hashchange", function () { fromHash(true); });

  load();
  setPlaying(playing);
  fromHash(false);
})();
