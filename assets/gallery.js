/* Studio "Inside the gym" slideshow: autoplay, arrows, dots, swipe, keyboard; pauses on hover, focus and hidden tab. */
(function () {
  "use strict";
  var root = document.querySelector("[data-gallery]");
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll(".cm-gallery__slide"));
  var dots = Array.prototype.slice.call(root.querySelectorAll("[data-gallery-dot]"));
  var count = root.querySelector("[data-gallery-count]");
  var interval = Number(root.getAttribute("data-interval")) || 5000;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var index = 0, timer = null, hover = false, focus = false;
  root.style.setProperty("--gallery-interval", interval + "ms");
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function running() { return !still && !hover && !focus && !document.hidden; }
  function schedule() {
    clearTimeout(timer);
    root.classList.remove("is-timing"); void root.offsetWidth;
    if (running()) { root.classList.add("is-timing"); timer = setTimeout(function () { show(index + 1); }, interval); }
  }
  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) {
      var on = k === index;
      s.classList.toggle("is-active", on);
      if (on) s.removeAttribute("aria-hidden"); else s.setAttribute("aria-hidden", "true");
    });
    dots.forEach(function (d, k) { d.classList.toggle("is-active", k === index); d.setAttribute("aria-current", String(k === index)); });
    if (count) count.textContent = pad(index + 1) + " / " + pad(slides.length);
    schedule();
  }
  root.querySelector("[data-gallery-prev]").addEventListener("click", function () { show(index - 1); });
  root.querySelector("[data-gallery-next]").addEventListener("click", function () { show(index + 1); });
  dots.forEach(function (d) { d.addEventListener("click", function () { show(Number(d.getAttribute("data-gallery-dot"))); }); });
  root.addEventListener("mouseenter", function () { hover = true; schedule(); });
  root.addEventListener("mouseleave", function () { hover = false; schedule(); });
  root.addEventListener("focusin", function (e) { if (e.target.matches(":focus-visible")) { focus = true; schedule(); } });
  root.addEventListener("focusout", function (e) { if (!root.contains(e.relatedTarget)) { focus = false; schedule(); } });
  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
  });
  document.addEventListener("visibilitychange", schedule);
  var x0 = null, y0 = null;
  root.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  root.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    x0 = y0 = null;
  }, { passive: true });
  show(0);
})();
