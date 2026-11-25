/* Mobile menu and booking form. */
(function () {
  "use strict";

  var toggle = document.querySelector(".cm-menu-toggle");
  var menu = document.getElementById("cm-mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  var form = document.querySelector("[data-cm-form]");
  if (form) {
    var status = form.querySelector("[data-cm-form-status]");
    var submit = form.querySelector("[data-cm-form-submit]");
    var plan = form.querySelector("[data-cm-plan-input]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var missing = [];
      Array.prototype.slice.call(form.querySelectorAll("[required]")).forEach(function (input) {
        var name = input.type === "tel" ? "a WhatsApp number" : input.type === "email" ? "your email" : "your name";
        var bad = !input.value.trim() || (input.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value.trim()));
        input.setAttribute("aria-invalid", String(bad));
        if (bad) missing.push(input.type === "email" && input.value.trim() ? "a valid email" : name);
      });
      status.dataset.cmFormFeedback = "true";
      if (missing.length) {
        status.classList.add("cm-form__status--error");
        status.textContent = "Please add " + missing.join(", ").replace(/, ([^,]*)$/, " and $1") + ".";
        submit.textContent = "Send request";
        return;
      }
      status.classList.remove("cm-form__status--error");
      status.textContent = "Thanks. We\u2019ll message you on WhatsApp within one working day about the " +
        (plan ? plan.value : "") + " plan.";
      submit.textContent = "Request sent";
    });
    form.addEventListener("click", function (e) {
      if (e.target.closest("[data-cm-plan-chip]")) status.classList.remove("cm-form__status--error");
    });
  }
})();
