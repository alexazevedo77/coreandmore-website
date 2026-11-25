/* Site-wide interactive effects for the Home, Classes, Studio and Join pages:
   staggered scroll reveals, image wipes, parallax, count-up numbers, scroll progress and header state.
   Runs before shell.js, which reveals everything marked .cm-reveal. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var site = document.querySelector(".cm-site:not(.lms):not(.ft):not(.cm-shop)");

  /* ---------- scroll progress + header state (every page) ---------- */
  var header = document.querySelector(".cm-header");
  var bar = document.createElement("span");
  bar.className = "cm-progress";
  bar.setAttribute("aria-hidden", "true");
  if (header) header.appendChild(bar);
  var queued = false;
  function onScroll() {
    queued = false;
    var max = doc.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ")";
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    parallax();
    wipeCheck();
  }
  function wipeCheck() {
    if (!pendingWipes || !pendingWipes.length) return;
    var vh = window.innerHeight;
    pendingWipes = pendingWipes.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) { el.classList.add("is-in"); return false; }
      return true;
    });
  }
  window.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);

  /* ---------- parallax on the big photos ---------- */
  var drift = still ? [] : Array.prototype.slice.call(document.querySelectorAll(
    ".cm-home-hero__visual img, .cm-image-band img, .cm-classes-image img, .cm-join-image img"));
  drift.forEach(function (img) { img.classList.add("cm-drift"); });
  function parallax() {
    var vh = window.innerHeight;
    drift.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1 around the centre of the screen
      img.style.setProperty("--drift", (p * -28).toFixed(1) + "px");
    });
  }

  if (!site) { onScroll(); return; }

  /* ---------- staggered reveals ---------- */
  var groups = [
    ".cm-home-hero__content > *", ".cm-home-hero__visual",
    ".cm-metric", ".cm-image-band", ".cm-section-heading-row", ".cm-principle", ".cm-start__content > *", ".cm-step",
    ".cm-class-teaser", ".cm-breath__content > *",
    ".cm-filter-bar", ".cm-classes-image", ".cm-class-card", ".cm-classes-cta__content > *",
    ".cm-purpose__statement", ".cm-purpose__copy", ".cm-studio-stat", ".cm-gallery", ".cm-coach", ".cm-coaching__content > *", ".cm-cue",
    ".cm-pricing__group", ".cm-form-check__intro", ".cm-form", ".cm-faq__item", ".cm-join-image", ".cm-join-band > *"
  ];
  var wipes = ".cm-home-hero__visual, .cm-image-band, .cm-classes-image, .cm-join-image";
  var pendingWipes = [];
  if (!still) {
    groups.forEach(function (sel) {
      Array.prototype.forEach.call(site.querySelectorAll(sel), function (el) {
        if (el.classList.contains("cm-reveal") || el.classList.contains("cm-wipe") || el.closest(".cm-banner")) return;
        var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(sel); });
        var order = Math.min(sibs.indexOf(el), 5);
        // photos are clipped while hidden, so they are watched by position here rather than by shell.js
        if (el.matches(wipes)) { el.classList.add("cm-wipe"); el.style.transitionDelay = order * 90 + "ms"; pendingWipes.push(el); return; }
        el.classList.add("cm-reveal");
        el.setAttribute("data-reveal-order", String(order));
      });
    });
    // the entrance delay is only for the entrance; hover effects respond straight away afterwards
    site.addEventListener("transitionend", function (e) {
      var el = e.target;
      if (el.classList && el.classList.contains("cm-reveal") && el.classList.contains("is-in")) el.style.transitionDelay = "";
    });
  }

  /* ---------- numbers count up when they appear ---------- */
  var nums = Array.prototype.slice.call(site.querySelectorAll(".cm-metric__value, .cm-studio-stat__value"));
  function countUp(el) {
    var final = el.getAttribute("data-final") || el.textContent;
    el.setAttribute("data-final", final);
    var parts = final.match(/\d+/g);
    if (!parts) return;
    var t0 = null, dur = 1100;
    (function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = final.replace(/\d+/g, function (d) {
        var v = String(Math.round(Number(d) * e));
        while (v.length < d.length) v = "0" + v;
        return v;
      });
      if (k < 1) requestAnimationFrame(step); else el.textContent = final;
    })(performance.now());
  }
  if (!still && "IntersectionObserver" in window && nums.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        setTimeout(function () { countUp(en.target); }, 250);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
    nums.forEach(function (n) {
      var card = n.closest(".cm-metric, .cm-studio-stat");
      if (card) card.addEventListener("mouseenter", function () { if (!n.hasAttribute("data-busy")) { n.setAttribute("data-busy", ""); countUp(n); setTimeout(function () { n.removeAttribute("data-busy"); }, 1200); } });
    });
  }

  setTimeout(function () { (pendingWipes || []).forEach(function (el) { el.classList.add("is-in"); }); pendingWipes = []; }, 6000);
  requestAnimationFrame(onScroll);
})();
