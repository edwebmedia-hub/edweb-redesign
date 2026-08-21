/* ==========================================================================
   IRONSTONE CONSTRUCTION, behaviour
   Every enhancement here is optional. Without JS the page is fully readable:
   .rise elements stay visible, the drawer is never needed (nav duplicates in
   the footer), and all counters/statements already carry their final text.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------- reveal */
  /* Anything already on screen, or just below it, is shown straight away. Only
     content genuinely further down waits for the observer. Landing on a page
     and seeing empty sections is far worse than missing an animation, and it
     is exactly what happens if everything starts hidden and waits on a
     callback. */
  (function reveal() {
    var items = document.querySelectorAll(".rise");
    if (!items.length) return;

    function show(el) { el.classList.add("seen"); }
    function showAll() { items.forEach(show); }

    if (reduced || !("IntersectionObserver" in window)) { showAll(); return; }

    /* If this document cannot scroll, nothing can ever scroll into view and a
       reveal-on-scroll would leave the page permanently blank below the fold.
       That is the case inside an embed sized to its own content. Show
       everything and skip the effect. */
    if (document.documentElement.scrollHeight <= window.innerHeight + 80) {
      showAll();
      return;
    }

    // Measured twice: once now, once on the next frame. Straight after a body
    // swap the first measurement can run before layout settles and report
    // everything as far below the fold, which is what left whole sections
    // blank until the backstop fired.
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
          // Stagger siblings so groups cascade instead of popping together.
          var siblings = Array.prototype.slice.call(entry.target.parentNode.children);
          var i = siblings.indexOf(entry.target);
          entry.target.style.setProperty("--d", Math.min(i, 6) * 70 + "ms");
          show(entry.target);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });

      waiting.forEach(function (el) { io.observe(el); });
    } catch (err) { showAll(); return; }

    // Backstop, short enough that a stall is never visible as a blank section.
    window.setTimeout(showAll, 1200);
  })();

  /* ------------------------------------------------------------- masthead */
  (function masthead() {
    var bar = document.getElementById("masthead");
    if (!bar) return;
    var ticking = false;
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

    // Keep tab focus inside the drawer while it is open.
    panel.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var focusable = panel.querySelectorAll("a, button");
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // A resize into desktop layout leaves a hidden drawer holding the scroll lock.
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900 && !panel.hidden) setOpen(false);
    });
  })();

  /* ------------------------------------------------------------- magnetic */
  /* Buttons drift a few pixels toward the pointer, then spring back. Pointer
     devices only, and never under reduced motion. */
  (function magnetic() {
    if (!finePointer || reduced) return;
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var strength = 0.28;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * strength;
        var y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  })();

  /* ----------------------------------------------------------------- tilt */
  /* Project cards lean toward the pointer. Capped at 4deg so it reads as
     material weight rather than a gimmick. */
  (function tilt() {
    if (!finePointer || reduced) return;
    document.querySelectorAll(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          "perspective(1000px) rotateY(" + (px * 4).toFixed(2) + "deg) rotateX(" +
          (-py * 4).toFixed(2) + "deg) translateZ(6px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  })();

  /* ------------------------------------------------------------ statement */
  /* Words brighten one after another as the band crosses the viewport. */
  (function statement() {
    var words = document.querySelectorAll(".statement-lines .w");
    if (!words.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      words.forEach(function (w) { w.classList.add("on"); });
      return;
    }
    try {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          words.forEach(function (w, i) {
            window.setTimeout(function () { w.classList.add("on"); }, i * 110);
          });
          obs.disconnect();
        });
      }, { threshold: 0.55 });
      io.observe(words[0].closest(".statement-lines"));
    } catch (err) {
      words.forEach(function (w) { w.classList.add("on"); });
    }
    window.setTimeout(function () {
      words.forEach(function (w) { w.classList.add("on"); });
    }, 6000);
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
        el.textContent = Math.round(target * eased) + suffix;
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

  /* ----------------------------------------------------------------- rail */
  (function rail() {
    var track = document.getElementById("rail");
    var bar = document.getElementById("rail-bar");
    if (!track) return;

    function step() {
      var card = track.querySelector(".work");
      if (!card) return track.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(track).columnGap || "16") || 16;
      return card.getBoundingClientRect().width + gap;
    }

    document.querySelectorAll("[data-rail]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = btn.getAttribute("data-rail") === "next" ? 1 : -1;
        track.scrollBy({ left: dir * step(), behavior: reduced ? "auto" : "smooth" });
      });
    });

    if (!bar) return;
    var ticking = false;
    function progress() {
      var max = track.scrollWidth - track.clientWidth;
      var visible = track.clientWidth / track.scrollWidth;
      var travelled = max > 0 ? track.scrollLeft / max : 0;
      bar.style.width = (visible * 100).toFixed(2) + "%";
      bar.style.transform = "translateX(" + (travelled * (100 / visible - 100)).toFixed(2) + "%)";
      ticking = false;
    }
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(progress);
    }, { passive: true });
    window.addEventListener("resize", progress);
    progress();
  })();

  /* ---------------------------------------------------------------- steps */
  /* Each stage lifts to full contrast as it passes the middle of the screen,
     so the column reads as one continuous pass. Without JS, or with reduced
     motion, every stage simply sits at full contrast. */
  (function steps() {
    var list = document.querySelectorAll(".step");
    if (!list.length) return;

    function showAll() { list.forEach(function (s) { s.classList.add("in"); }); }
    if (reduced || !("IntersectionObserver" in window)) { showAll(); return; }
    if (document.documentElement.scrollHeight <= window.innerHeight + 80) { showAll(); return; }

    // Same rule as the reveal above, measured again on the next frame so a
    // body swap cannot leave a stage sitting blank.
    var nearFold = window.innerHeight * 1.35;
    function sweepNearFold() {
      list.forEach(function (s) {
        if (s.getBoundingClientRect().top < nearFold) s.classList.add("in");
      });
    }
    sweepNearFold();
    window.requestAnimationFrame(sweepNearFold);

    try {
      // Entrance: lift each stage in once, staggered, then stop watching it.
      var enter = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var i = Array.prototype.indexOf.call(list, entry.target);
          entry.target.style.setProperty("--d", Math.min(i, 4) * 90 + "ms");
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });

      // Accent: whichever stage is crossing the middle of the screen. Only
      // the number and the top rule change, so copy stays fully readable
      // whether or not this ever fires.
      var focusBand = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("active", entry.isIntersecting);
        });
      }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

      list.forEach(function (s) { enter.observe(s); focusBand.observe(s); });
    } catch (err) { showAll(); return; }

    // Safety sweep: nothing may sit invisible if the observer never fired.
    window.setTimeout(showAll, 1200);
  })();

  /* --------------------------------------------------------------- voices */
  /* One review at a time: fade out, swap the text, fade back in. Auto-advances
     but stops the moment the visitor interacts or hovers, and pauses when the
     tab is hidden. */
  (function voices() {
    var box = document.getElementById("voicebox");
    var slide = document.getElementById("voice-slide");
    var dots = document.getElementById("voice-dots");
    var data = document.getElementById("voice-data");
    if (!box || !slide || !dots || !data) return;

    var items;
    try { items = JSON.parse(data.textContent); } catch (err) { return; }
    if (!Array.isArray(items) || items.length < 2) return;

    var quoteEl = slide.querySelector(".voice-quote");
    var nameEl = slide.querySelector(".voice-name");
    var jobEl = slide.querySelector(".voice-job");
    var index = 0;
    var timer = null;
    var swapping = false;

    // Screen readers should hear the new quote, not every intermediate state.
    slide.setAttribute("aria-live", "polite");
    slide.setAttribute("aria-atomic", "true");

    items.forEach(function (item, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Review " + (i + 1) + " of " + items.length);
      dot.setAttribute("aria-selected", String(i === 0));
      dot.addEventListener("click", function () { stop(); go(i); });
      dots.appendChild(dot);
    });

    function paint() {
      quoteEl.textContent = items[index].quote;
      nameEl.textContent = items[index].name;
      jobEl.textContent = items[index].job;
      Array.prototype.forEach.call(dots.children, function (d, i) {
        d.setAttribute("aria-selected", String(i === index));
      });
    }

    function go(next) {
      if (swapping || next === index) return;
      swapping = true;
      index = (next + items.length) % items.length;

      if (reduced) { paint(); swapping = false; return; }

      slide.classList.add("swapping");
      window.setTimeout(function () {
        paint();
        slide.classList.remove("swapping");
        swapping = false;
      }, 260);
    }

    document.getElementById("voice-prev").addEventListener("click", function () { stop(); go(index - 1); });
    document.getElementById("voice-next").addEventListener("click", function () { stop(); go(index + 1); });

    function start() {
      if (reduced || timer) return;
      timer = window.setInterval(function () { go(index + 1); }, 7000);
    }
    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    box.addEventListener("pointerenter", stop);
    box.addEventListener("focusin", stop);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
    });

    // Only run the carousel while it is actually on screen.
    if ("IntersectionObserver" in window) {
      try {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
        }, { threshold: 0.35 }).observe(box);
      } catch (err) { start(); }
    } else { start(); }
  })();

  /* ----------------------------------------------------------------- form */
  /* Demo behaviour: validates, honours the honeypot, and confirms. On a live
     build the marked line below posts to the site's own /api/send-mail
     endpoint instead of resolving locally. Without JS the form still submits
     normally, so the markup never depends on this running. */
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
        say("Thank you. We will be in touch within one business day.");
        return;
      }

      var missing = [];
      ["name", "phone", "email", "message"].forEach(function (n) {
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
          submit.textContent = "Send request";
          if (data && data.success) {
            form.reset();
            say(data.message || "Thank you. Your request is in and we will come back to you within one business day.");
          } else {
            say((data && data.message) || "Sorry, that did not go through. Please phone the number at the top of the page.");
          }
        })
        .catch(function () {
          submit.disabled = false;
          submit.textContent = "Send request";
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
