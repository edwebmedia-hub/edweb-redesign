/* ==========================================================================
   WATERLINE PLUMBING - behaviour
   Every enhancement is optional. Without JS the page stays fully readable:
   .rise elements remain visible, counters keep their final text, the pipe
   shows its water line, and the form still submits natively.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------- reveal */
  /* Anything on screen, or just below it, shows straight away. Only content
     genuinely further down waits for the observer, and a backstop sweep means
     nothing can ever sit invisible. */
  (function reveal() {
    var items = document.querySelectorAll(".rise");
    if (!items.length) return;

    function show(el) { el.classList.add("seen"); }
    function showAll() { items.forEach(show); }

    if (reduced || !("IntersectionObserver" in window)) { showAll(); return; }

    if (document.documentElement.scrollHeight <= window.innerHeight + 80) {
      showAll();
      return;
    }

    // Measured twice: once now, once next frame, so a late layout settle
    // cannot report everything as below the fold.
    var nearFold = window.innerHeight * 1.35;
    var waiting = [];
    function sweepNearFold() {
      waiting = waiting.filter(function (el) {
        if (el.getBoundingClientRect().top >= nearFold) return true;
        show(el);
        return false;
      });
    }

    items.forEach(function (el) { waiting.push(el); });
    sweepNearFold();
    window.requestAnimationFrame(sweepNearFold);
    if (!waiting.length) return;

    try {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var siblings = Array.prototype.slice.call(entry.target.parentNode.children);
          var i = siblings.indexOf(entry.target);
          entry.target.style.setProperty("--d", Math.min(i, 6) * 70 + "ms");
          show(entry.target);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });

      waiting.forEach(function (el) { io.observe(el); });
    } catch (err) { showAll(); return; }

    window.setTimeout(showAll, 1200);
  })();

  /* ------------------------------------------------------------- masthead */
  (function masthead() {
    var bar = document.getElementById("masthead");
    if (!bar) return;
    var ticking = false;

    // Publish the bar's real height so anything sticky parks exactly beneath
    // it. Guessing this in CSS left a sliver of the page showing between the
    // two, which is the gap Edgar spotted on 2026-08-11.
    function measure() {
      document.documentElement.style.setProperty("--mast-h", bar.offsetHeight + "px");
    }
    measure();
    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    function update() {
      bar.classList.toggle("stuck", window.scrollY > 40);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  })();

  /* --------------------------------------------------------------- drawer */
  (function drawer() {
    var btn = document.getElementById("burger");
    var panel = document.getElementById("drawer");
    if (!btn || !panel) return;

    function setOpen(open) {
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      panel.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        var first = panel.querySelector("a");
        if (first) first.focus();
      }
    }

    btn.addEventListener("click", function () {
      setOpen(btn.getAttribute("aria-expanded") !== "true");
    });

    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || panel.hidden) return;
      setOpen(false);
      btn.focus();
    });

    panel.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var focusable = panel.querySelectorAll("a, button");
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 920 && !panel.hidden) setOpen(false);
    });
  })();

  /* ----------------------------------------------------------- svc tabs */
  /* Services page: six long panels, one shown at a time. The markup ships as
     plain buttons and plain sections; the tab semantics are added here, so a
     no-JS visitor keeps all six panels stacked and never meets a tablist with
     nothing driving it. Deep links from the footer (services.html#geysers)
     still work: the matching tab opens on load and on hashchange. */
  (function svcTabs() {
    var bar = document.getElementById("svctabs-bar");
    if (!bar) return;
    var tabs = Array.prototype.slice.call(bar.querySelectorAll(".svctab"));
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-panel]"));
    if (!tabs.length || !panels.length) return;

    function panelFor(slug) {
      for (var i = 0; i < panels.length; i++) {
        if (panels[i].getAttribute("data-panel") === slug) return panels[i];
      }
      return null;
    }

    bar.setAttribute("role", "tablist");
    tabs.forEach(function (tab) {
      var slug = tab.getAttribute("data-tab");
      var panel = panelFor(slug);
      if (!panel) return;
      tab.id = "tab-" + slug;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panel.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.setAttribute("tabindex", "0");
    });

    function select(slug, opts) {
      opts = opts || {};
      var target = panelFor(slug);
      if (!target) return false;

      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-tab") === slug;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
      });

      panels.forEach(function (panel) {
        var on = panel === target;
        panel.classList.toggle("is-active", on);
        panel.classList.remove("is-entering");
      });

      if (opts.animate && !reduced) {
        // Restart the entrance animation on every switch.
        void target.offsetWidth;
        target.classList.add("is-entering");
      }

      // Anything inside a panel that has never been on screen still carries
      // .rise, and the observer will not have fired for it. Show it now so a
      // freshly opened tab is never blank.
      target.querySelectorAll(".rise").forEach(function (el) { el.classList.add("seen"); });

      var active = bar.querySelector(".svctab.is-active");
      if (active) {
        // On a phone the strip scrolls sideways, so keep the chosen chip in it.
        if (active.scrollIntoView) {
          active.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
        if (opts.focusTab) active.focus();
      }
      if (opts.scroll) {
        // The strip is sticky, so its client rect lies about where it belongs
        // in the document once it has stuck. Walk the offset chain instead.
        var strip = bar.closest(".svctabs") || bar;
        var top = 0;
        for (var node = strip; node; node = node.offsetParent) top += node.offsetTop;
        top -= 120;
        // Landing on services.html#geysers jumps straight there; switching by
        // hash while already on the page glides.
        var behavior = (opts.smooth && !reduced) ? "smooth" : "auto";
        window.scrollTo({ top: Math.max(top, 0), behavior: behavior });
      }
      return true;
    }

    bar.addEventListener("click", function (e) {
      var tab = e.target.closest(".svctab");
      if (!tab) return;
      var slug = tab.getAttribute("data-tab");
      if (select(slug, { animate: true })) {
        // replaceState, not a hash assignment: the deep link stays shareable
        // without the browser jumping the page to the panel.
        try { history.replaceState(null, "", "#" + slug); } catch (err) { /* file:// */ }
      }
    });

    bar.addEventListener("keydown", function (e) {
      var keys = { ArrowRight: 1, ArrowLeft: -1, Home: "first", End: "last" };
      if (!(e.key in keys)) return;
      var current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      e.preventDefault();
      var next;
      if (keys[e.key] === "first") next = 0;
      else if (keys[e.key] === "last") next = tabs.length - 1;
      else next = (current + keys[e.key] + tabs.length) % tabs.length;
      select(tabs[next].getAttribute("data-tab"), { animate: true, focusTab: true });
    });

    function fromHash(smooth) {
      var slug = (window.location.hash || "").replace("#", "");
      if (!slug) return;
      select(slug, { animate: true, scroll: true, smooth: smooth });
    }

    fromHash(false);
    // Scroll restoration can fire after us on a hash load, so claim the
    // position once more on the next frame.
    if (window.location.hash) window.requestAnimationFrame(function () { fromHash(false); });
    window.addEventListener("hashchange", function () { fromHash(true); });

    // Establish roving tabindex and aria-selected for the panel already open.
    var opening = bar.querySelector(".svctab.is-active") || tabs[0];
    if (!window.location.hash) select(opening.getAttribute("data-tab"), {});
  })();

  /* ------------------------------------------------------------- counters */
  (function counters() {
    var figures = document.querySelectorAll(".figures dt[data-count]");
    if (!figures.length || reduced || !("IntersectionObserver" in window)) return;

    function run(el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var final = el.textContent;
      if (isNaN(target)) return;
      var started = null;
      var duration = 1500;

      function frame(ts) {
        if (started === null) started = ts;
        var p = Math.min((ts - started) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var n = Math.round(target * eased);
        // Space as thousands separator, SA style.
        el.textContent = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + suffix;
        if (p < 1) window.requestAnimationFrame(frame);
        else el.textContent = final;
      }
      window.requestAnimationFrame(frame);
    }

    try {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.7 });
      figures.forEach(function (el) { io.observe(el); });
    } catch (err) { /* markup already holds the final values */ }
  })();

  /* ----------------------------------------------------------------- flow */
  /* The water line draws through the pipe once the section is on screen.
     CSS handles the drawing; this only adds the .seen trigger. */
  (function flow() {
    var section = document.getElementById("flow");
    if (!section) return;

    function on() { section.classList.add("seen"); }
    if (reduced || !("IntersectionObserver" in window)) { on(); return; }

    try {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          on();
          obs.disconnect();
        });
      }, { threshold: 0.35 });
      io.observe(section);
    } catch (err) { on(); return; }

    window.setTimeout(on, 4000);
  })();

  /* ------------------------------------------------------------ pipe fill */
  /* Phone layout: the four stages sit on a vertical pipe instead of the
     horizontal diagram. Water runs down it as each stage is reached, so the
     process reads as one continuous run rather than four separate blocks.
     The fill element is created here, never in the markup: without JS there
     is nothing to fill and CSS leaves every joint sitting open. */
  (function pipeFill() {
    var steps = Array.prototype.slice.call(
      document.querySelectorAll(".flow-rail .flow-step")
    );
    if (!steps.length) return;

    steps.forEach(function (step) {
      var fill = document.createElement("span");
      fill.className = "pipe-fill";
      fill.setAttribute("aria-hidden", "true");
      step.insertBefore(fill, step.firstChild);
    });

    function wetAll() { steps.forEach(function (s) { s.classList.add("wet"); }); }
    if (reduced || !("IntersectionObserver" in window)) { wetAll(); return; }

    try {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          // Only fills forward. Scrolling back up leaves the pipe wet, which
          // is how a pipe behaves and avoids a flicker on every small scroll.
          if (entry.isIntersecting) entry.target.classList.add("wet");
        });
      }, { rootMargin: "0px 0px -35% 0px", threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
    } catch (err) { wetAll(); return; }

    // Nothing may sit permanently dry if the observer never fires.
    window.setTimeout(wetAll, 6000);
  })();

  /* ------------------------------------------------------------- magnetic */
  (function magnetic() {
    if (!finePointer || reduced) return;
    document.querySelectorAll(".pill").forEach(function (el) {
      var strength = 0.22;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * strength;
        var y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
      });
      el.addEventListener("pointerleave", function () {
        el.style.translate = "";
      });
    });
  })();

  /* ----------------------------------------------------------------- form */
  /* Demo behaviour: validates, honours the honeypot, and confirms. On a live
     build the marked line below posts to the site's own /api/send-mail
     endpoint instead of resolving locally. */
  (function quoteForm() {
    var form = document.getElementById("quote-form");
    if (!form) return;
    var status = document.getElementById("form-status");
    var submit = form.querySelector('button[type="submit"]');

    function say(msg) {
      if (!status) return;
      status.textContent = msg;
      status.hidden = false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: a filled hidden field means a bot. Look successful, do nothing.
      if (form.elements.company && form.elements.company.value) {
        say("Thank you. A plumber will phone you back within one working hour.");
        return;
      }

      var missing = [];
      ["name", "phone", "message"].forEach(function (n) {
        var field = form.elements[n];
        if (field && !field.value.trim()) missing.push(field);
      });

      var email = form.elements.email;
      if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        missing.push(email);
      }

      if (missing.length) {
        missing[0].focus();
        say("Please check the highlighted fields and try again.");
        return;
      }

      submit.disabled = true;
      submit.textContent = "Sending...";

      // Real endpoint since 2026-08-18 (audit item 4): demo leads land in
      // Edgar's inbox instead of a fake success into nothing.
      var payload = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name) payload[el.name] = el.value;
      });
      fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (data) {
          submit.disabled = false;
          submit.textContent = "Send the request";
          if (data && data.success) {
            form.reset();
            say(data.message || "Thank you. A plumber will phone you back within one working hour, 07:00 to 17:00 weekdays.");
          } else {
            say((data && data.message) || "Sorry, that did not go through. Please phone the number at the top of the page.");
          }
        })
        .catch(function () {
          submit.disabled = false;
          submit.textContent = "Send the request";
          say("Sorry, that did not go through. Please phone the number at the top of the page.");
        });
    });
  })();

  /* ----------------------------------------------------------------- year */
  (function year() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  })();

})();
