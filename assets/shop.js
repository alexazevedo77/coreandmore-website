/* Shop: filters, sorting, layout views, colour swatches, wishlist, compare and quick view. */
(function () {
  "use strict";
  var root = document.querySelector("[data-cm-shop]");
  if (!root) return;

  var grid = root.querySelector("[data-shop-grid]");
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".cm-product"));
  var count = root.querySelector("[data-shop-count]");
  var empty = root.querySelector("[data-shop-empty]");
  var sort = root.querySelector("[data-shop-sort]");
  var minIn = root.querySelector("[data-shop-min]");
  var maxIn = root.querySelector("[data-shop-max]");
  var range = root.querySelector("[data-shop-range]");
  var priceLabel = root.querySelector("[data-shop-price-label]");
  var stock = Array.prototype.slice.call(root.querySelectorAll("[data-shop-stock]"));
  var views = Array.prototype.slice.call(root.querySelectorAll("[data-view]")).filter(function (b) { return b.tagName === "BUTTON"; });
  var filterToggle = root.querySelector("[data-shop-filter-toggle]");
  var filters = root.querySelector("#cm-shop-filters");
  var PMAX = Number(maxIn.max);
  var queryBox = root.querySelector("[data-shop-query]");
  var queryLabel = root.querySelector("[data-shop-query-label]");
  var query = "";
  try { query = (new URLSearchParams(window.location.search).get("q") || "").trim(); } catch (e) { query = ""; }

  function num(input, fallback) {
    var v = parseFloat(input.value);
    return isNaN(v) ? fallback : Math.min(PMAX, Math.max(0, v));
  }

  function apply() {
    var lo = num(minIn, 0), hi = num(maxIn, PMAX);
    if (lo > hi) { var t = lo; lo = hi; hi = t; }
    var wanted = stock.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
    var shown = 0;
    cards.forEach(function (card) {
      var p = Number(card.dataset.price);
      var ok = p >= lo && p <= hi && (wanted.length === 0 || wanted.indexOf(card.dataset.stock) !== -1) &&
        (!query || query.toLowerCase().split(/\s+/).every(function (w) { return card.dataset.name.toLowerCase().indexOf(w) !== -1; }));
      card.hidden = !ok;
      if (ok) shown += 1;
    });
    priceLabel.textContent = "Price: " + lo.toFixed(3) + " OMR - " + hi.toFixed(3) + " OMR";
    count.textContent = shown === cards.length ? cards.length + " products" : shown + " of " + cards.length + " products";
    empty.hidden = shown !== 0;
    if (queryBox) {
      queryBox.hidden = !query;
      queryLabel.textContent = query ? "Results for \u201C" + query + "\u201D" : "";
    }

    var mode = sort.value;
    var sorted = cards.slice().sort(function (a, b) {
      if (mode === "featured") return a.dataset.index - b.dataset.index;
      if (mode === "price-asc") return a.dataset.price - b.dataset.price || a.dataset.name.localeCompare(b.dataset.name);
      if (mode === "price-desc") return b.dataset.price - a.dataset.price || a.dataset.name.localeCompare(b.dataset.name);
      var c = a.dataset.name.localeCompare(b.dataset.name, "en", { sensitivity: "base" });
      return mode === "za" ? -c : c;
    });
    sorted.forEach(function (card) { grid.appendChild(card); });
  }

  minIn.addEventListener("input", apply);
  maxIn.addEventListener("input", function () { range.value = num(maxIn, PMAX); apply(); });
  range.addEventListener("input", function () { maxIn.value = range.value; apply(); });
  stock.forEach(function (c) { c.addEventListener("change", apply); });
  sort.addEventListener("change", apply);

  Array.prototype.slice.call(root.querySelectorAll("[data-shop-clear]")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      minIn.value = 0; maxIn.value = PMAX; range.value = PMAX;
      stock.forEach(function (c) { c.checked = false; });
      apply();
    });
  });

  views.forEach(function (btn) {
    btn.addEventListener("click", function () {
      grid.dataset.view = btn.dataset.view;
      views.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
    });
  });

  if (filterToggle && filters) {
    filterToggle.addEventListener("click", function () {
      var open = filterToggle.getAttribute("aria-expanded") !== "true";
      filterToggle.setAttribute("aria-expanded", String(open));
      filterToggle.classList.toggle("is-active", open);
      filters.classList.toggle("is-open", open);
    });
  }

  cards.forEach(function (card) {
    var main = card.querySelector("[data-main]");
    var label = card.querySelector("[data-swatch-label]");
    var dots = Array.prototype.slice.call(card.querySelectorAll("[data-swatch]"));
    var original = main.getAttribute("src");
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        dots.forEach(function (d) {
          var on = d === dot;
          d.classList.toggle("is-active", on);
          d.setAttribute("aria-pressed", String(on));
        });
        if (label) label.textContent = "Colour: " + dot.dataset.swatch;
        main.setAttribute("src", dot.dataset.image || original);
        card.classList.toggle("has-swatch-image", !!dot.dataset.image);
      });
    });
  });

  var qClear = root.querySelector("[data-shop-query-clear]");
  if (qClear) qClear.addEventListener("click", function () {
    query = "";
    try { window.history.replaceState(null, "", window.location.pathname); } catch (e) { /* ignore */ }
    apply();
  });

  /* collapsible filter groups */
  Array.prototype.slice.call(root.querySelectorAll("[data-collapse]")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      btn.parentNode.classList.toggle("is-open", open);
      document.getElementById(btn.getAttribute("aria-controls")).hidden = !open;
    });
  });

  /* wishlist hearts */
  var W = window.CMWishlist;
  function syncHearts() {
    cards.forEach(function (card) {
      var b = card.querySelector("[data-wishlist-toggle]"); if (!b || !W) return;
      var on = W.has(card.dataset.id);
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", on ? "Remove from wishlist" : "Add to wishlist");
      b.querySelector(".cm-tip").textContent = on ? "Remove from wishlist" : "Add to wishlist";
    });
  }
  document.addEventListener("cm:wishlist", syncHearts);

  /* compare */
  var compare = [];
  var bar = root.querySelector("[data-compare-bar]");
  var barCount = root.querySelector("[data-compare-count]");
  function syncCompare() {
    cards.forEach(function (card) {
      var b = card.querySelector("[data-compare-toggle]"); if (!b) return;
      var on = compare.indexOf(card.dataset.id) !== -1;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", on ? "Remove from compare" : "Compare");
      b.querySelector(".cm-tip").textContent = on ? "Remove from compare" : "Compare";
    });
    bar.hidden = compare.length === 0;
    barCount.textContent = compare.length + (compare.length === 1 ? " product" : " products") + " to compare";
  }
  function product(id) { return (window.CM_PRODUCTS || []).filter(function (p) { return p.id === id; })[0]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function renderCompare() {
    var items = compare.map(product).filter(Boolean);
    var row = function (label, fn) { return "<tr><th scope=\"row\">" + label + "</th>" + items.map(function (p) { return "<td>" + fn(p) + "</td>"; }).join("") + "</tr>"; };
    root.querySelector("[data-compare-table]").innerHTML =
      '<table class="cm-pricing__table cm-compare__table"><thead><tr><th scope="col">Product</th>' +
      items.map(function (p) { return '<th scope="col"><img src="' + esc(p.img) + '" alt=""><span>' + esc(p.name) + "</span></th>"; }).join("") + "</tr></thead><tbody>" +
      row("Price", function (p) { return Number(p.price).toFixed(3) + " OMR"; }) +
      row("Colours", function (p) { return p.colours.length ? p.colours.map(function (c) { return esc(c.name); }).join(", ") : "—"; }) +
      row("Availability", function () { return "In stock"; }) +
      row("", function (p) { return '<a class="cm-text-link" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.buy) + " ↗</a>"; }) +
      "</tbody></table>";
  }
  root.querySelector("[data-compare-open]").addEventListener("click", function (e) {
    renderCompare(); window.CMPanels.open(document.getElementById("cm-compare"));
  });
  root.querySelector("[data-compare-clear]").addEventListener("click", function () { compare = []; syncCompare(); });

  /* quick view */
  var qv = document.getElementById("cm-quickview");
  function openQuickView(card) {
    var p = product(card.dataset.id); if (!p) return;
    var img = qv.querySelector("[data-qv-img]");
    img.src = card.querySelector("[data-main]").getAttribute("src"); img.alt = p.name;
    qv.querySelector("[data-qv-name]").textContent = p.name;
    qv.querySelector("[data-qv-price]").textContent = Number(p.price).toFixed(3) + " OMR";
    var buy = qv.querySelector("[data-qv-buy]"); buy.href = p.url; buy.textContent = p.buy + " ↗";
    qv.querySelector("[data-qv-details]").href = p.url;
    var sw = qv.querySelector("[data-qv-swatches]");
    if (p.colours.length) {
      var current = (card.querySelector("[data-swatch].is-active") || {}).getAttribute ? card.querySelector("[data-swatch].is-active").getAttribute("data-swatch") : p.colours[0].name;
      sw.innerHTML = '<span class="cm-field__label">Colour: <strong data-qv-colour>' + esc(current) + '</strong></span><div class="cm-product__swatches">' +
        p.colours.map(function (c) {
          var on = c.name === current;
          return '<button class="cm-swatch cm-has-tip' + (on ? " is-active" : "") + '" type="button" style="--sw:' + c.hex + '" data-qv-swatch="' + esc(c.name) + '"' +
            (c.img ? ' data-image="' + esc(c.img) + '"' : "") + ' aria-pressed="' + on + '" aria-label="' + esc(c.name) + '"><span class="cm-tip" role="tooltip">' + esc(c.name) + "</span></button>";
        }).join("") + "</div>";
    } else sw.innerHTML = "";
    window.CMPanels.open(qv);
  }
  qv.addEventListener("click", function (e) {
    var b = e.target.closest("[data-qv-swatch]"); if (!b) return;
    Array.prototype.forEach.call(qv.querySelectorAll("[data-qv-swatch]"), function (d) {
      var on = d === b; d.classList.toggle("is-active", on); d.setAttribute("aria-pressed", String(on));
    });
    qv.querySelector("[data-qv-colour]").textContent = b.getAttribute("data-qv-swatch");
    if (b.dataset.image) qv.querySelector("[data-qv-img]").src = b.dataset.image;
  });

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".cm-product"); if (!card) return;
    if (e.target.closest("[data-wishlist-toggle]")) { if (W) W.toggle(card.dataset.id); return; }
    if (e.target.closest("[data-compare-toggle]")) {
      var i = compare.indexOf(card.dataset.id);
      if (i === -1) compare.push(card.dataset.id); else compare.splice(i, 1);
      syncCompare(); return;
    }
    if (e.target.closest("[data-quickview]")) openQuickView(card);
  });

  syncHearts();
  syncCompare();
  apply();
})();
