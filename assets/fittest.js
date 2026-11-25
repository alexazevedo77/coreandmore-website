/* Muscat Fittest page: hero entrance, countdown, step tabs, workout explorer with RX/Scaled loads, light parallax. */
(function () {
  "use strict";
  var root = document.querySelector("[data-ft]");
  if (!root) return;
  var doc = document.documentElement;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* hero entrance: eyebrow, logo, tagline and buttons arrive one after another */
  if (!still) {
    doc.classList.add("ft-anim");
    void root.offsetWidth;
    var on = function () { requestAnimationFrame(function () { doc.classList.add("ft-on"); }); };
    var logo = new Image();
    logo.onload = logo.onerror = function () { setTimeout(on, 60); };
    logo.src = "assets/fittest/logo-muscat.webp";
    setTimeout(on, 1800); // never leave the hero hidden
  }

  /* countdown to 18 December (Muscat time), ticking every second */
  var cd = root.querySelector("[data-ft-countdown]");
  if (cd) {
    var target = new Date(cd.getAttribute("data-date")).getTime();
    var units = {};
    ["d", "h", "m", "s"].forEach(function (k) { units[k] = cd.querySelector('[data-ft-unit="' + k + '"]'); });
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var rolling = !still;
    var parts = function (left) { return { d: Math.floor(left / 86400), h: Math.floor(left % 86400 / 3600), m: Math.floor(left % 3600 / 60), s: left % 60 }; };
    var tickCd = function () {
      var left = Math.max(0, Math.floor((target - Date.now()) / 1000));
      if (rolling) return left;
      var v = parts(left);
      Object.keys(v).forEach(function (k) {
        var t = pad(v[k]);
        if (units[k].textContent !== t) {
          units[k].textContent = t;
          if (!still) { units[k].classList.remove("is-tick"); void units[k].offsetWidth; units[k].classList.add("is-tick"); }
        }
      });
      return left;
    };
    if (tickCd() > 0) {
      cd.hidden = false;
      var cdTimer = setInterval(function () { if (tickCd() <= 0) { clearInterval(cdTimer); cd.hidden = true; } }, 1000);
      if (rolling) {
        // on load the numbers run up from zero as the countdown slides in
        setTimeout(function () {
          var t0 = null;
          (function step(t) {
            if (t0 === null) t0 = t;
            var k = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 4);
            var v = parts(Math.max(0, Math.floor((target - Date.now()) / 1000)));
            Object.keys(v).forEach(function (key) { units[key].textContent = pad(Math.round(v[key] * e)); });
            if (k < 1) requestAnimationFrame(step); else { rolling = false; tickCd(); }
          })(performance.now());
        }, 1900);
      }
    }
  }

  function swap(el) {
    if (still || !el) return;
    el.classList.remove("is-swapping"); void el.offsetWidth; el.classList.add("is-swapping");
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function arrowKeys(tabs, pick) {
    tabs.forEach(function (t, i) {
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (i + d + tabs.length) % tabs.length;
        tabs[n].focus(); pick(n);
      });
    });
  }

  /* how it works: step tabs */
  var phases = window.FT_PHASES || [];
  var phaseTabs = Array.prototype.slice.call(root.querySelectorAll("[data-ft-phase]"));
  var panel = root.querySelector("[data-ft-phase-panel]");
  function pickPhase(i) {
    var p = phases[i]; if (!p || !panel) return;
    phaseTabs.forEach(function (t, k) {
      var a = k === i;
      t.classList.toggle("is-active", a); t.setAttribute("aria-selected", String(a)); t.tabIndex = a ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", "ft-phase-" + i);
    var rail = root.querySelector("[data-ft-phases]"); if (rail) rail.style.setProperty("--step", i);
    panel.querySelector("[data-ft-phase-num]").textContent = "Step " + p.num;
    panel.querySelector("[data-ft-phase-title]").textContent = p.title;
    panel.querySelector("[data-ft-phase-text]").textContent = p.text;
    panel.querySelector("[data-ft-phase-list]").innerHTML = p.list.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    swap(panel);
  }
  phaseTabs.forEach(function (t, i) { t.addEventListener("click", function () { pickPhase(i); }); });
  arrowKeys(phaseTabs, pickPhase);

  /* the tests: workout tabs and RX / Scaled loads */
  var wods = window.FT_WODS || [];
  var wodTabs = Array.prototype.slice.call(root.querySelectorAll("[data-ft-wod]"));
  var stdBtns = Array.prototype.slice.call(root.querySelectorAll("[data-ft-std]"));
  var wodPanel = root.querySelector("[data-ft-wod-panel]");
  var moves = root.querySelector("[data-ft-wod-moves]");
  var cur = 0, std = "rx";
  function renderMoves() {
    var list = wods[cur][std];
    moves.innerHTML = list.map(function (m, k) {
      return '<li><span class="ft-move__n">' + (k < 9 ? "0" : "") + (k + 1) + '</span><span class="ft-move__name">' + esc(m[0]) +
        '</span><span class="ft-move__reps">' + esc(m[1]) + "</span></li>";
    }).join("");
  }
  function pickWod(i) {
    var w = wods[i]; if (!w || !wodPanel) return;
    cur = i;
    wodTabs.forEach(function (t, k) {
      var a = k === i;
      t.classList.toggle("is-active", a); t.setAttribute("aria-selected", String(a)); t.tabIndex = a ? 0 : -1;
    });
    wodPanel.querySelector("[data-ft-wod-format]").textContent = w.format;
    wodPanel.querySelector("[data-ft-wod-name]").textContent = w.name;
    wodPanel.querySelector("[data-ft-wod-standards]").textContent = w.standards;
    wodPanel.querySelector("[data-ft-wod-scoring]").textContent = w.scoring;
    wodPanel.querySelector("[data-ft-wod-stimulus]").textContent = w.stimulus;
    renderMoves();
    swap(wodPanel);
  }
  wodTabs.forEach(function (t, i) { t.addEventListener("click", function () { pickWod(i); }); });
  arrowKeys(wodTabs, pickWod);
  stdBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      std = b.getAttribute("data-ft-std");
      stdBtns.forEach(function (o) { var a = o === b; o.classList.toggle("is-active", a); o.setAttribute("aria-pressed", String(a)); });
      var tg = root.querySelector("[data-ft-toggle]"); if (tg) tg.style.setProperty("--pos", std === "rx" ? 0 : 1);
      if (moves) { renderMoves(); swap(moves); }
    });
  });

  function swipe(el, get, pick, count) {
    if (!el) return;
    var x0 = null, y0 = 0;
    el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
      pick(Math.max(0, Math.min(count - 1, get() + (dx < 0 ? 1 : -1))));
    });
  }
  var curPhase = function () { for (var i = 0; i < phaseTabs.length; i++) if (phaseTabs[i].classList.contains("is-active")) return i; return 0; };
  swipe(panel, curPhase, pickPhase, phaseTabs.length);
  swipe(wodPanel, function () { return cur; }, pickWod, wodTabs.length);

  /* photo strip opens from the bottom when it scrolls into view */
  var shots = Array.prototype.slice.call(root.querySelectorAll("[data-ft-shot]"));
  var wipes = shots.concat(Array.prototype.slice.call(root.querySelectorAll("[data-ft-wipe]")));
  function revealCheck() {
    var vh = window.innerHeight;
    wipes = wipes.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.88 && r.bottom > 0) { el.classList.add("is-in"); return false; }
      return true;
    });
  }
  setTimeout(function () { wipes.forEach(function (el) { el.classList.add("is-in"); }); wipes = []; }, 9000);

  /* photo strip scroll bar (tablet and phone): shows position, drag or tap it to move */
  var strip = root.querySelector("[data-ft-strip]"), bar = root.querySelector("[data-ft-strip-bar]"), thumb = root.querySelector("[data-ft-strip-thumb]");
  if (strip && bar && thumb) {
    var syncBar = function () {
      var max = strip.scrollWidth - strip.clientWidth, bw = bar.clientWidth;
      if (max <= 0 || !bw) return;
      var tw = Math.max(36, bw * strip.clientWidth / strip.scrollWidth);
      bar.style.setProperty("--tw", tw + "px");
      bar.style.setProperty("--tx", ((bw - tw) * strip.scrollLeft / max).toFixed(1) + "px");
    };
    var fromPointer = function (e) {
      var r = bar.getBoundingClientRect(), tw = parseFloat(bar.style.getPropertyValue("--tw")) || 0;
      var k = Math.min(1, Math.max(0, (e.clientX - r.left - tw / 2) / (r.width - tw)));
      strip.scrollLeft = k * (strip.scrollWidth - strip.clientWidth);
    };
    strip.addEventListener("scroll", syncBar, { passive: true });
    window.addEventListener("resize", syncBar);
    bar.addEventListener("pointerdown", function (e) {
      bar.setPointerCapture(e.pointerId); bar.classList.add("is-dragging");
      strip.style.scrollSnapType = "none"; strip.style.scrollBehavior = "auto"; fromPointer(e);
    });
    bar.addEventListener("pointermove", function (e) { if (bar.classList.contains("is-dragging")) fromPointer(e); });
    var endDrag = function () {
      if (!bar.classList.contains("is-dragging")) return;
      bar.classList.remove("is-dragging"); strip.style.scrollSnapType = ""; strip.style.scrollBehavior = "";
    };
    bar.addEventListener("pointerup", endDrag); bar.addEventListener("pointercancel", endDrag);
    syncBar(); setTimeout(syncBar, 600);
  }

  if (still) { shots.forEach(function (el) { el.classList.add("is-in"); }); return; }

  /* background wordmarks drift slower than the page */
  var ghosts = Array.prototype.slice.call(root.querySelectorAll(".ft-cta__ghost"));
  var queued = false;
  var depth = Array.prototype.slice.call(root.querySelectorAll("[data-ft-depth]"));
  var heroInner = root.querySelector(".ft-hero__inner");
  function drift() {
    queued = false;
    var vh = window.innerHeight;
    revealCheck();
    depth.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.setProperty("--dy", (p * Number(el.getAttribute("data-ft-depth"))).toFixed(1) + "px");
    });
    if (heroInner) {
      var hr = heroInner.parentNode.getBoundingClientRect(), k = Math.min(1, Math.max(0, -hr.top / hr.height));
      heroInner.style.setProperty("--out-o", (1 - k * 0.9).toFixed(3));
      heroInner.style.setProperty("--out-y", (k * -40).toFixed(1) + "px");
    }
    ghosts.forEach(function (g) {
      var r = g.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      g.style.setProperty("--ghost-y", ((r.top + r.height / 2 - vh / 2) * -0.15).toFixed(1) + "px");
    });
  }
  window.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(drift); } }, { passive: true });
  window.addEventListener("resize", drift);
  drift();

  if (!fine) return;

  /* a soft light follows the pointer across the panels */
  Array.prototype.forEach.call(root.querySelectorAll(".ft-panel, .ft-wod, .ft-wod-tab"), function (el) {
    el.classList.add("ft-spot");
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* Register buttons lean toward the pointer */
  Array.prototype.forEach.call(root.querySelectorAll(".ft-magnet"), function (btn) {
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      btn.classList.add("is-pulled");
      btn.style.setProperty("--bx", ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px");
      btn.style.setProperty("--by", ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px");
    });
    btn.addEventListener("pointerleave", function () {
      btn.classList.remove("is-pulled");
      btn.style.setProperty("--bx", "0px"); btn.style.setProperty("--by", "0px");
    });
  });
})();
