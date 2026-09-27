(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var top = document.querySelector(".top");
  var bar = document.querySelector(".progress span");
  var hero = document.querySelector(".hero");
  var nameEl = document.querySelector(".name");
  var portraitImg = document.querySelector(".portrait-frame img");

  /* Size a headline so it spans the full width of its container. */
  function fitOne(el) {
    var max = parseFloat(el.getAttribute("data-fit-max")) || 400;
    var parent = el.parentElement;
    var style = window.getComputedStyle(parent);
    var room = parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    var stacked = window.getComputedStyle(el).whiteSpace !== "nowrap";
    el.style.fontSize = "100px";
    var widest = 0;
    if (stacked) {
      el.querySelectorAll(".word-in, .gold").forEach(function (w) {
        widest = Math.max(widest, w.getBoundingClientRect().width);
      });
    } else {
      var range = document.createRange();
      range.selectNodeContents(el);
      widest = range.getBoundingClientRect().width;
    }
    if (!widest) { el.style.fontSize = ""; return; }
    var size = Math.floor((100 * room) / widest * 0.995);
    el.style.fontSize = Math.min(size, max) + "px";
  }
  function fitAll() { document.querySelectorAll(".fit").forEach(fitOne); }
  fitAll();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fitAll); }
  window.addEventListener("load", fitAll);
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitAll, 80);
  });

  /* Scroll progress, header state, and a light parallax on the portrait. */
  var ticking = false;
  function onScroll() {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY || 0;
      var doc = document.documentElement;
      var total = doc.scrollHeight - window.innerHeight;
      if (bar) { bar.style.transform = "scaleX(" + (total > 0 ? Math.min(1, y / total) : 0) + ")"; }
      if (top) {
        top.classList.toggle("scrolled", y > 12);
        if (nameEl) {
          var past = nameEl.getBoundingClientRect().bottom < 70;
          top.classList.toggle("past-name", past);
        }
      }
      if (portraitImg && !reduce) {
        portraitImg.style.setProperty("--shift", Math.max(-18, Math.min(18, y * -0.035)) + "px");
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Reveal sections as they enter the viewport. */
  var targets = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(function (t) { t.classList.add("in"); });
  } else {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var siblings = Array.prototype.slice.call(entry.target.parentElement.children).filter(function (c) {
          return c.hasAttribute("data-reveal");
        });
        var index = Math.max(0, siblings.indexOf(entry.target));
        entry.target.style.setProperty("--d", Math.min(index, 5) * 80 + "ms");
        entry.target.classList.add("in");
        seen.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t) { seen.observe(t); });
  }

  /* A soft light that follows the pointer across the hero. */
  if (hero && finePointer && !reduce) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", e.clientX - r.left + "px");
      hero.style.setProperty("--my", e.clientY - r.top + "px");
      hero.classList.add("lit");
    });
    hero.addEventListener("pointerleave", function () { hero.classList.remove("lit"); });
  }

  /* Screenshots lean toward the pointer. */
  if (finePointer && !reduce) {
    document.querySelectorAll(".tilt").forEach(function (box) {
      box.addEventListener("pointermove", function (e) {
        var r = box.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        box.style.setProperty("--ry", (px * 5).toFixed(2) + "deg");
        box.style.setProperty("--rx", (py * -4).toFixed(2) + "deg");
      });
      box.addEventListener("pointerleave", function () {
        box.style.setProperty("--ry", "0deg");
        box.style.setProperty("--rx", "0deg");
      });
    });
  }
})();
