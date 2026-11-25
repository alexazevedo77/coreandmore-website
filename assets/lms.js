/* Last Man Standing page: episode switcher, click-to-load YouTube player, Season 2 list via WhatsApp. */
(function () {
  "use strict";
  var root = document.querySelector("[data-lms]");
  if (!root) return;
  var eps = window.LMS_EPISODES || [];
  var player = root.querySelector("[data-lms-player]");
  var pills = Array.prototype.slice.call(root.querySelectorAll(".lms-pill"));
  var meta = root.querySelector("[data-lms-meta]");
  var desc = root.querySelector("[data-lms-desc]");
  var direct = root.querySelector("[data-lms-direct]");
  var current = 0;

  function poster(i) {
    var ep = eps[i];
    player.innerHTML =
      '<button class="lms-player__poster" type="button" data-lms-play aria-label="Play ' + ep.title.replace(/"/g, "&quot;") + '">' +
      '<img src="https://i.ytimg.com/vi/' + ep.id + '/hqdefault.jpg" alt="" data-lms-thumb>' +
      '<span class="lms-player__btn" aria-hidden="true"><span class="lms-play-icon"></span></span></button>';
    guardThumb();
  }
  function guardThumb() {
    var img = player.querySelector("[data-lms-thumb]");
    if (!img) return;
    img.addEventListener("error", function () { img.classList.add("is-broken"); });
    if (img.complete && img.naturalWidth === 0) img.classList.add("is-broken");
  }
  function play(i) {
    var ep = eps[i];
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + ep.id + "?rel=0&autoplay=1";
    f.title = "Last Man Standing: " + ep.title;
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.allowFullscreen = true;
    f.referrerPolicy = "strict-origin-when-cross-origin";
    player.innerHTML = "";
    player.appendChild(f);
  }
  function select(i, autoplay) {
    current = i;
    var ep = eps[i];
    pills.forEach(function (p, k) {
      p.classList.toggle("is-active", k === i);
      p.setAttribute("aria-pressed", String(k === i));
    });
    meta.textContent = ep.meta;
    desc.textContent = ep.desc;
    direct.href = "https://www.youtube.com/watch?v=" + ep.id;
    if (autoplay) play(i); else poster(i);
  }

  player.addEventListener("click", function (e) { if (e.target.closest("[data-lms-play]")) play(current); });
  pills.forEach(function (p) {
    p.addEventListener("click", function () { select(Number(p.getAttribute("data-lms-episode")), false); });
  });
  Array.prototype.forEach.call(root.querySelectorAll(".lms-beat [data-lms-episode]"), function (b) {
    b.addEventListener("click", function () {
      select(Number(b.getAttribute("data-lms-episode")), true);
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      root.querySelector("#watch").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });
  guardThumb();

  /* hero artwork: letters row by row, then the photo, then the tag */
  var ali = root.querySelector("[data-lms-ali]");
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (ali && !calm) {
    var letters = Array.prototype.slice.call(ali.querySelectorAll(".lms-ali__l"));
    var rows = [];
    letters.forEach(function (el) {
      var b; try { b = el.getBBox(); } catch (e) { return; }
      var mid = b.y + b.height / 2, row = null;
      rows.forEach(function (r) { if (Math.abs(r.mid - mid) < 60) row = r; });
      if (!row) { row = { mid: mid, els: [] }; rows.push(row); }
      row.els.push({ el: el, x: b.x });
    });
    rows.sort(function (a, b) { return a.mid - b.mid; });
    rows.forEach(function (r, i) {
      r.els.sort(function (a, b) { return a.x - b.x; });
      r.els.forEach(function (o, k) { o.el.style.setProperty("--d", (i * 0.1 + k * 0.03).toFixed(2) + "s"); });
    });
    ali.classList.add("is-armed");
    void ali.getBoundingClientRect();
    var go = function () { requestAnimationFrame(function () { ali.classList.add("is-on"); }); };
    var img = new Image();
    img.onload = img.onerror = function () { setTimeout(go, 120); };
    img.src = "assets/lms-ali.webp";
    setTimeout(go, 2500); // never leave it hidden
  }

  /* numbers bar: its own entrance when it comes into view, separate from the hero */
  var band = root.querySelector("[data-lms-stats]");
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (band && !still) {
    band.classList.add("lms-anim");
    var counters = Array.prototype.slice.call(band.querySelectorAll("[data-lms-count]"));
    var count = window.__lmsCount = function (el, delay) {
      var final = el.getAttribute("data-lms-count");
      var m = final.match(/^([\d.]+)(.*)$/); if (!m) return;
      var target = parseFloat(m[1]), dec = (m[1].split(".")[1] || "").length, suffix = m[2];
      el.textContent = (0).toFixed(dec) + suffix;
      setTimeout(function () {
        var t0 = null, dur = 1100;
        (function step(t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
          el.textContent = (target * e).toFixed(dec) + suffix;
          if (k < 1) requestAnimationFrame(step); else el.textContent = final;
        })(performance.now());
      }, delay);
    };
    var start = function () {
      if (band.classList.contains("is-in")) return;
      band.classList.add("is-in");
      counters.forEach(function (el, i) { count(el, 450 + i * 110); });
    };
    // watch the bar's position (it is clipped while hidden, so an IntersectionObserver would not see it)
    var loadedAt = Date.now(), queued = false;
    var check = function () {
      queued = false;
      var r = band.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.85 && r.bottom > 0) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        // if the bar is already on screen at load, let the hero finish first
        setTimeout(start, Math.max(0, 700 - (Date.now() - loadedAt)));
      }
    };
    var onScroll = function () { if (!queued) { queued = true; requestAnimationFrame(check); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    check();
    setTimeout(start, 6000); // never leave the numbers hidden
  }

  /* brand background eases in, per section, when it comes into view */
  if (!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    Array.prototype.forEach.call(root.querySelectorAll(".lms-wall"), function (w) {
      w.classList.add("lms-wall--anim");
      var sec = w.parentNode;
      var check = function () {
        var r = sec.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.9 && r.bottom > 0) {
          window.removeEventListener("scroll", check);
          requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add("is-in"); }); });
        }
      };
      window.addEventListener("scroll", check, { passive: true });
      check();
      setTimeout(function () { w.classList.add("is-in"); }, 8000);
    });
  }

  /* ---------- interactive effects ---------- */
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var motionOk = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // reveal delays are only for the entrance; clear them so hover effects respond straight away
  Array.prototype.forEach.call(root.querySelectorAll(".cm-reveal"), function (el) {
    el.addEventListener("transitionend", function () { el.style.transitionDelay = ""; }, { once: true });
  });

  if (motionOk) {
    // background lettering drifts slower than the page
    var walls = Array.prototype.slice.call(root.querySelectorAll(".lms-wall"));
    var ticking = false;
    var drift = function () {
      ticking = false;
      walls.forEach(function (w) {
        var r = w.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        w.style.setProperty("--wall-y", (r.top * -0.12).toFixed(1) + "px");
      });
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }

  if (motionOk && fine) {
    // hero artwork: letters, photo and tag move at different depths with the pointer
    var hero = root.querySelector(".lms-hero");
    var layers = Array.prototype.slice.call(root.querySelectorAll(".lms-ali__depth"));
    if (hero && layers.length) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach(function (g) {
          var d = Number(g.getAttribute("data-depth"));
          g.style.setProperty("--px", (x * d).toFixed(1) + "px");
          g.style.setProperty("--py", (y * d).toFixed(1) + "px");
        });
      });
      hero.addEventListener("pointerleave", function () {
        layers.forEach(function (g) { g.style.setProperty("--px", "0px"); g.style.setProperty("--py", "0px"); });
      });
    }

    // Who will be? box tilts toward the pointer
    var tilt = root.querySelector("[data-lms-tilt]"), cta = root.querySelector(".lms-cta");
    if (tilt && cta) {
      cta.addEventListener("pointermove", function (e) {
        var r = tilt.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / r.width, y = (e.clientY - (r.top + r.height / 2)) / r.height;
        x = Math.max(-1, Math.min(1, x)); y = Math.max(-1, Math.min(1, y));
        tilt.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
        tilt.style.setProperty("--rx", (y * -8).toFixed(2) + "deg");
      });
      cta.addEventListener("pointerleave", function () { tilt.style.setProperty("--ry", "0deg"); tilt.style.setProperty("--rx", "0deg"); });
    }

    // numbers count up again when you point at them
    Array.prototype.forEach.call(root.querySelectorAll(".lms-stat"), function (st) {
      var v = st.querySelector("[data-lms-count]"), busy = false;
      st.addEventListener("mouseenter", function () {
        if (busy || !window.__lmsCount || !root.querySelector("[data-lms-stats].is-in")) return;
        busy = true; window.__lmsCount(v, 0); setTimeout(function () { busy = false; }, 1200);
      });
    });
  }

  /* Season 2 list: hand the details to WhatsApp, nothing is stored here */
  var form = root.querySelector("[data-lms-form]");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim();
    var div = form.elements.division.value;
    var msg = "Hi, I'm " + name + ". Put me on the Last Man Standing Season 2 list." + (div ? " Division: " + div + "." : "");
    window.open("https://wa.me/96892366393?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });
})();
