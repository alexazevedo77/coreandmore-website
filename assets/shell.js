/* Site shell: header search, cart and wishlist drawers, mobile navigation bar, scroll reveal. */
(function () {
  "use strict";

  /* pages opened from the menu always start at the top (no restored or anchor offset) */
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) { /* ignore */ }
  function toTop() {
    var h = window.location.hash;
    if (h && h !== "#lms" && h !== "#fittest") return; // in-page anchors such as #cm-form-check keep their target
    var html = document.documentElement, prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev;
  }
  toTop();
  document.addEventListener("DOMContentLoaded", toTop);
  window.addEventListener("load", function () { toTop(); requestAnimationFrame(toTop); setTimeout(toTop, 80); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) toTop(); });
  var PRODUCTS = window.CM_PRODUCTS || [];
  var PAGES = [
    { name: "Classes", url: "classes.html", keys: "classes timetable schedule boxing kickboxing fitness pilates mat reformer zone" },
    { name: "Studio", url: "studio.html", keys: "studio coaches coach method team about room" },
    { name: "Join", url: "join.html", keys: "join membership price prices pricing plan plans first session contact basic premium weights day pass private" },
    { name: "Shop", url: "shop.html", keys: "shop products gear apparel store buy" }
  ];
  var overlay = document.querySelector("[data-overlay]");
  var lastFocus = null;
  var openPanel = null;

  /* ---------- wishlist store (this browser only) ---------- */
  var KEY = "cm-wishlist";
  function readList() {
    try { var v = JSON.parse(window.localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; }
    catch (e) { return memoryList.slice(); }
  }
  var memoryList = [];
  function writeList(list) {
    memoryList = list.slice();
    try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable: keep in memory */ }
  }
  var Wishlist = {
    has: function (id) { return readList().indexOf(id) !== -1; },
    toggle: function (id) {
      var list = readList(), i = list.indexOf(id);
      if (i === -1) list.push(id); else list.splice(i, 1);
      writeList(list); render(); return i === -1;
    },
    list: readList
  };
  window.CMWishlist = Wishlist;

  function byId(id) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i]; return null; }
  function money(n) { return Number(n).toFixed(3) + " OMR"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function render() {
    var list = readList().filter(byId);
    Array.prototype.forEach.call(document.querySelectorAll("[data-wishlist-count]"), function (n) {
      n.textContent = String(list.length); n.classList.toggle("is-empty", list.length === 0);
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-wishlist-count-label]"), function (n) { n.textContent = "(" + list.length + ")"; });
    var box = document.querySelector("[data-wishlist-list]");
    if (box) {
      box.classList.toggle("cm-drawer__empty", list.length === 0);
      box.innerHTML = list.length === 0
        ? '<p class="cm-drawer__empty-title">Your wishlist is empty.</p><p>Tap the heart on any product to save it here.</p><a class="cm-button cm-button--black" href="shop.html">Continue Shopping</a>'
        : list.map(function (id) {
            var p = byId(id);
            return '<div class="cm-line"><a class="cm-line__img" href="' + esc(p.url) + '" target="_blank" rel="noopener"><img src="' + esc(p.img) + '" alt=""></a>' +
              '<div class="cm-line__info"><a class="cm-line__name" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.name) + '</a>' +
              '<span class="cm-product__price">' + money(p.price) + '</span>' +
              '<a class="cm-text-link" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.buy) + ' ↗</a></div>' +
              '<button class="cm-icon-btn cm-line__remove cm-has-tip" type="button" data-wishlist-remove="' + esc(id) + '" aria-label="Remove ' + esc(p.name) + ' from wishlist">' +
              '<svg width="11" height="11" viewBox="0 0 13 13" aria-hidden="true"><path fill="currentColor" d="M.28 1.57A.92.92 0 0 1 1.59.26L6.5 5.18 11.41.26a.92.92 0 1 1 1.31 1.31L7.8 6.49l4.92 4.92a.92.92 0 1 1-1.31 1.31L6.5 7.8l-4.91 4.92a.92.92 0 1 1-1.31-1.31L5.2 6.49Z"/></svg>' +
              '<span class="cm-tip cm-tip--left" role="tooltip">Remove</span></button></div>';
          }).join("");
    }
    document.dispatchEvent(new CustomEvent("cm:wishlist"));
  }
  document.addEventListener("click", function (e) {
    var rm = e.target.closest("[data-wishlist-remove]");
    if (rm) { Wishlist.toggle(rm.getAttribute("data-wishlist-remove")); }
  });

  /* ---------- panels: drawers, search, modals share one overlay ---------- */
  function focusables(el) {
    return Array.prototype.filter.call(el.querySelectorAll('a[href],button:not([disabled]),input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])'),
      function (n) { return n.offsetParent !== null || n === document.activeElement; });
  }
  function open(panel, focusEl) {
    if (openPanel && openPanel !== panel) close(true);
    lastFocus = lastFocus || document.activeElement;
    panel.hidden = false;
    overlay.hidden = false;
    document.documentElement.classList.add("cm-locked");
    requestAnimationFrame(function () { panel.classList.add("is-open"); overlay.classList.add("is-open"); });
    openPanel = panel;
    Array.prototype.forEach.call(document.querySelectorAll('[aria-controls="' + panel.id + '"]'), function (b) { b.setAttribute("aria-expanded", "true"); });
    var f = focusEl || focusables(panel)[0];
    if (f) setTimeout(function () { f.focus(); }, 30);
  }
  function close(keepFocus) {
    var panel = openPanel;
    if (!panel) return;
    panel.classList.remove("is-open"); overlay.classList.remove("is-open");
    Array.prototype.forEach.call(document.querySelectorAll('[aria-controls="' + panel.id + '"]'), function (b) { b.setAttribute("aria-expanded", "false"); });
    openPanel = null;
    setTimeout(function () { if (!panel.classList.contains("is-open")) panel.hidden = true; if (!openPanel) overlay.hidden = true; }, 260);
    document.documentElement.classList.remove("cm-locked");
    if (!keepFocus && lastFocus && lastFocus.focus) {
      if (lastFocus.hasAttribute("data-search-inline")) lastFocus.setAttribute("data-skip-open", "");
      lastFocus.focus();
    }
    lastFocus = null;
  }
  window.CMPanels = { open: open, close: close };
  overlay.addEventListener("click", function () { close(); });
  document.addEventListener("keydown", function (e) {
    if (!openPanel) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "Tab") {
      var f = focusables(openPanel); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-drawer-open]");
    if (o) { e.preventDefault(); var d = document.getElementById(o.getAttribute("data-drawer-open")); if (d) open(d); return; }
    if (e.target.closest("[data-drawer-close],[data-modal-close],[data-search-close]")) close();
  });

  /* ---------- search popup with live results ---------- */
  var search = document.getElementById("cm-search");
  var input = search && search.querySelector("[data-search-input]");
  var results = search && search.querySelector("[data-search-results]");
  var trending = search && search.querySelector("[data-search-trending]");
  function runSearch() {
    var q = input.value.trim().toLowerCase();
    trending.hidden = q.length > 0;
    if (!q) { results.innerHTML = ""; return; }
    var words = q.split(/\s+/);
    var prods = PRODUCTS.filter(function (p) {
      var hay = (p.name + " " + (p.keywords || "") + " " + p.colours.map(function (c) { return c.name; }).join(" ")).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) !== -1; });
    });
    var pages = PAGES.filter(function (p) {
      var hay = (p.name + " " + p.keys).toLowerCase();
      return words.some(function (w) { return w.length > 1 && hay.indexOf(w) !== -1; });
    });
    if (!prods.length && !pages.length) {
      results.innerHTML = '<p class="cm-search__none">No results for “' + esc(input.value.trim()) + '”.</p>';
      return;
    }
    var html = "";
    if (prods.length) {
      html += '<h3 class="cm-search__title">Products</h3><div class="cm-search__products">' + prods.map(function (p) {
        return '<a class="cm-search__product" href="' + esc(p.url) + '" target="_blank" rel="noopener"><img src="' + esc(p.img) + '" alt="">' +
          '<span class="cm-search__pname">' + esc(p.name) + '</span><span class="cm-product__price">' + money(p.price) + '</span></a>';
      }).join("") + '</div><a class="cm-text-link cm-search__all" href="shop.html?q=' + encodeURIComponent(input.value.trim()) + '">View all results</a>';
    }
    if (pages.length) {
      html += '<h3 class="cm-search__title">Pages</h3><div class="cm-search__pages">' + pages.map(function (p) {
        return '<a class="cm-search__page" href="' + p.url + '">' + p.name + ' <span aria-hidden="true">→</span></a>';
      }).join("") + "</div>";
    }
    results.innerHTML = html;
  }
  if (search) {
    input.addEventListener("input", runSearch);
    Array.prototype.forEach.call(search.querySelectorAll("[data-search-term]"), function (b) {
      b.addEventListener("click", function () { input.value = b.getAttribute("data-search-term"); runSearch(); input.focus(); });
    });
    search.querySelector("[data-search-form]").addEventListener("submit", function (e) {
      if (!input.value.trim()) { e.preventDefault(); input.focus(); }
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-search-open]"), function (el) {
      var go = function (e) {
        if (el.hasAttribute("data-skip-open")) { el.removeAttribute("data-skip-open"); return; }
        if (e && e.type !== "focus") e.preventDefault();
        if (el.hasAttribute("data-search-inline") && el.value) { input.value = el.value; el.value = ""; runSearch(); }
        open(search, input);
      };
      if (el.tagName === "INPUT") { el.addEventListener("focus", go); el.addEventListener("input", go); }
      else el.addEventListener("click", go);
    });
  }

  /* ---------- scroll reveal ---------- */
  var reveal = Array.prototype.slice.call(document.querySelectorAll(".cm-reveal"));
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reveal.length && "IntersectionObserver" in window && !reduce) {
    document.documentElement.classList.add("cm-motion");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, order = Number(el.getAttribute("data-reveal-order") || 0);
        el.style.transitionDelay = Math.min(order, 6) * 70 + "ms";
        el.classList.add("is-in"); io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -5% 0px", threshold: 0.05 });
    reveal.forEach(function (el, i) { if (!el.hasAttribute("data-reveal-order")) el.setAttribute("data-reveal-order", el.classList.contains("cm-product") ? String(i % 4) : "0"); io.observe(el); });
    setTimeout(function () { reveal.forEach(function (el) { el.classList.add("is-in"); }); }, 4000); // never leave content hidden
  }

  /* ---------- back to top ---------- */
  var up = document.querySelector("[data-to-top]");
  if (up) {
    up.hidden = false;
    var showUp = function () { up.classList.toggle("is-shown", window.scrollY > Math.min(600, window.innerHeight * 0.8)); };
    window.addEventListener("scroll", showUp, { passive: true });
    showUp();
    up.addEventListener("click", function () {
      var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
      var logo = document.querySelector(".cm-header__logo");
      if (logo) logo.focus({ preventScroll: true });
    });
  }

  render();
})();
