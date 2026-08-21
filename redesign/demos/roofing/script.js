/* ==========================================================================
   Ridgeworks Roofing: site behaviour
   Every feature is guarded so one missing element can never kill the rest.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mark JS as available. Reveal styles only apply under .js, so content is
     never invisible when JS fails or is blocked. */
  root.classList.add("js");

  function on(el, ev, fn, opts) {
    if (el) el.addEventListener(ev, fn, opts);
  }

  function each(list, fn) {
    Array.prototype.forEach.call(list || [], fn);
  }

  function clamp(n, lo, hi) {
    return n < lo ? lo : n > hi ? hi : n;
  }

  /* ---------------------------------------------------------------- header */
  (function header() {
    var head = document.getElementById("site-header");
    if (!head || head.classList.contains("masthead--solid")) return;

    var tick = false;
    function update() {
      head.classList.toggle("is-scrolled", window.scrollY > 24);
      tick = false;
    }
    on(window, "scroll", function () {
      if (!tick) {
        tick = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  })();

  /* ------------------------------------------------------------------- nav */
  (function nav() {
    var toggle = document.getElementById("nav-toggle");
    var menu = document.getElementById("nav");
    if (!toggle || !menu) return;

    var icon = toggle.querySelector(".ico");

    function setOpen(open) {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (icon) icon.textContent = open ? "close" : "menu";
    }

    on(toggle, "click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });

    each(menu.querySelectorAll("a"), function (a) {
      on(a, "click", function () { setOpen(false); });
    });

    on(document, "keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    on(window, "resize", function () {
      if (window.innerWidth >= 1040) setOpen(false);
    });
  })();

  /* ---------------------------------------------------------------- reveal */
  (function reveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    function showAll() {
      each(items, function (el) { el.classList.add("is-visible"); });
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    each(items, function (el) { io.observe(el); });

    /* Safety sweep: if the observer never fires (bfcache, odd viewport,
       zero-height parent), nothing is left invisible. */
    window.setTimeout(function () {
      each(items, function (el) {
        if (!el.classList.contains("is-visible")) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight * 1.4) el.classList.add("is-visible");
        }
      });
    }, 2200);

    on(window, "pageshow", function (e) { if (e.persisted) showAll(); });
  })();

  /* --------------------------------------------------- hero parallax drift */
  (function parallax() {
    var media = document.getElementById("hero-media");
    if (!media || reduceMotion) return;
    var img = media.querySelector("img");
    if (!img) return;

    var tick = false;
    function update() {
      var y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        img.style.transform = "translate3d(0," + (y * 0.14).toFixed(1) + "px,0) scale(1.06)";
      }
      tick = false;
    }
    img.style.transform = "scale(1.06)";
    on(window, "scroll", function () {
      if (!tick) {
        tick = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
  })();

  /* ------------------------------------------- service rows -> photo stage */
  (function serviceStage() {
    var list = document.querySelector("[data-svc-list]");
    var stage = document.querySelector("[data-svc-stage]");
    if (!list || !stage) return;

    var cap = stage.querySelector("[data-svc-cap]");
    var rows = list.querySelectorAll(".svc__row");

    function show(key, caption) {
      each(stage.querySelectorAll("[data-svc-img]"), function (img) {
        var on = img.getAttribute("data-svc-img") === key;
        /* Only the first stage photo ships with a src. The rest carry
           data-src and load the first time they are actually asked for, so
           the page does not download nine photographs nobody looked at. */
        if (on && !img.getAttribute("src") && img.getAttribute("data-src")) {
          img.setAttribute("src", img.getAttribute("data-src"));
          img.removeAttribute("data-src");
        }
        img.classList.toggle("is-active", on);
      });
      if (cap && caption) cap.textContent = caption;
    }

    each(rows, function (row) {
      function activate() {
        show(row.getAttribute("data-svc"), row.getAttribute("data-cap"));
      }
      on(row, "mouseenter", activate);
      on(row, "focus", activate);
    });
  })();

  /* ------------------------------------------------ before / after compare */
  (function beforeAfter() {
    var frame = document.getElementById("ba-frame");
    if (!frame) return;

    var before = document.getElementById("ba-before");
    var after = document.getElementById("ba-after");
    var caption = document.getElementById("ba-caption");
    var pager = document.querySelectorAll("[data-ba]");
    if (!before || !after) return;

    var JOBS = [
      {
        before: "assets/ba-1-before.jpg",
        after: "assets/ba-1-after.jpg",
        beforeAlt: "Aged residential roofs under a grey sky, tiles darkened and weathered",
        afterAlt: "Clean red roof tiles in sharp condition against a clear blue sky",
        caption: "Weathered concrete tile. Cleaned, re-bedded where it had slipped, then sealed and coated."
      },
      {
        before: "assets/ba-2-before.jpg",
        after: "assets/ba-2-after.jpg",
        beforeAlt: "A rooftop soaked through in heavy rain, water standing on the covering",
        afterAlt: "A sound brown tiled roof, dry and evenly laid",
        caption: "Water finding its way in. Valley relined, ridging re-pointed and the covering made watertight."
      }
    ];

    var manual = false;

    /* Where supported, the pinned wipe is a CSS scroll-driven animation on a
       view() timeline. That runs on the compositor, so it stays exact at any
       scroll speed and cannot be throttled the way a scroll listener can.
       JS only takes over once the visitor drags. */
    var cssDriven = window.CSS &&
      CSS.supports("animation-timeline: view()") &&
      document.querySelector(".ba-scroll__inner");

    function setWipe(pct) {
      pct = clamp(pct, 2, 98);
      frame.style.setProperty("--wipe", pct + "%");
      frame.setAttribute("aria-valuenow", Math.round(pct));
      frame.setAttribute("aria-valuetext", Math.round(pct) + " percent after");
    }

    /* Hand the divider from CSS to this script, permanently. */
    function takeOver() {
      if (manual) return;
      manual = true;
      if (cssDriven) {
        /* Freeze at whatever the animation was showing, so the first drag
           does not jump. */
        var shown = getComputedStyle(frame).getPropertyValue("--wipe");
        frame.classList.add("is-manual");
        if (shown) frame.style.setProperty("--wipe", shown.trim());
      }
    }

    setWipe(92);

    function pointerWipe(e) {
      var rect = frame.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      setWipe((x / rect.width) * 100);
    }

    function startDrag(e) {
      takeOver();
      pointerWipe(e);
      function move(ev) { pointerWipe(ev); }
      function end() {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", end);
        document.removeEventListener("touchmove", move);
        document.removeEventListener("touchend", end);
      }
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", end);
      document.addEventListener("touchmove", move, { passive: true });
      document.addEventListener("touchend", end);
    }

    on(frame, "mousedown", function (e) { e.preventDefault(); startDrag(e); });
    on(frame, "touchstart", startDrag, { passive: true });

    on(frame, "keydown", function (e) {
      var now = parseFloat(frame.getAttribute("aria-valuenow")) || 50;
      if (e.key === "ArrowLeft") { takeOver(); setWipe(now - 5); e.preventDefault(); }
      if (e.key === "ArrowRight") { takeOver(); setWipe(now + 5); e.preventDefault(); }
      if (e.key === "Home") { takeOver(); setWipe(2); e.preventDefault(); }
      if (e.key === "End") { takeOver(); setWipe(98); e.preventDefault(); }
    });

    /* The signature move.

       Pinned: the CSS sticks the stage to the top of the window inside a
       wrapper one viewport taller than itself. That extra viewport of scroll
       is spent driving the divider from before to after instead of moving the
       page, then the pin releases and the page carries on. Progress is read
       straight off the wrapper's position, so it stays exact at any scroll
       speed and survives a resize.

       Unpinned (narrow screens): the divider follows the block as it crosses
       the viewport, which needs no pin and cannot trap a phone's scroll.

       Either way, one drag or arrow key hands control to the visitor for good. */
    var pinInner = document.querySelector(".ba-scroll__inner");
    var canPin = window.matchMedia("(min-width: 1000px)");

    function scrub() {
      if (manual) return;

      if (pinInner && canPin.matches) {
        var r = pinInner.getBoundingClientRect();
        var travel = r.height - window.innerHeight;
        if (travel <= 0) return;
        setWipe(92 - clamp(-r.top / travel, 0, 1) * 84);
        return;
      }

      var rect = frame.getBoundingClientRect();
      var vh = window.innerHeight;
      if (rect.bottom < 0 || rect.top > vh) return;
      setWipe(88 - clamp((vh - rect.top) / (vh + rect.height), 0, 1) * 74);
    }

    /* Deliberately not rAF-throttled. This handler does one rect read and one
       custom-property write, which is cheap, and rAF is not guaranteed to run
       in a tab the browser has parked, which would leave the divider frozen. */
    function requestScrub() { scrub(); }

    /* The JS scrub runs alongside the CSS one and uses the identical curve.
       A running CSS animation outranks inline styles, so where the scroll
       timeline is live it wins and this costs nothing; where it is not (older
       Chrome, a browser without scroll-driven animation, a tab the compositor
       has parked) this drives the divider instead. Belt and braces on the one
       piece of motion the page is built around. */
    if (!reduceMotion) {
      on(window, "scroll", requestScrub, { passive: true });
      on(window, "resize", requestScrub);
      scrub();
    }

    each(pager, function (btn) {
      on(btn, "click", function () {
        var job = JOBS[parseInt(btn.getAttribute("data-ba"), 10)];
        if (!job) return;
        each(pager, function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        before.src = job.before;
        before.alt = job.beforeAlt;
        after.src = job.after;
        after.alt = job.afterAlt;
        if (caption) caption.textContent = job.caption;
        /* Hand the divider back to scroll and recompute for where we already
           are, so switching jobs mid-pin does not jump to a flat 50%. */
        manual = false;
        if (cssDriven) {
          frame.classList.remove("is-manual");
          frame.style.removeProperty("--wipe");
        } else if (reduceMotion) {
          setWipe(50);
        } else {
          scrub();
        }
      });
    });
  })();

  /* -------------------------------------------------------------- work rail */
  (function workRail() {
    var rail = document.getElementById("work-rail");
    if (!rail) return;

    var prev = document.querySelector(".rail-prev");
    var next = document.querySelector(".rail-next");
    if (!prev || !next) return;

    function step() {
      var card = rail.querySelector(".work");
      return card ? card.getBoundingClientRect().width + 16 : rail.clientWidth * 0.8;
    }

    function sync() {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 8;
    }

    on(prev, "click", function () { rail.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" }); });
    on(next, "click", function () { rail.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" }); });
    on(rail, "scroll", sync, { passive: true });
    on(window, "resize", sync);
    sync();
  })();

  /* ------------------------------------------------------------------ tabs */
  (function tabs() {
    var group = document.querySelector("[data-tabs]");
    if (!group) return;

    var buttons = group.querySelectorAll("[data-tab]");
    if (!buttons.length) return;

    function select(key, focus) {
      each(buttons, function (b) {
        var on_ = b.getAttribute("data-tab") === key;
        b.setAttribute("aria-selected", String(on_));
        b.tabIndex = on_ ? 0 : -1;
        if (on_ && focus) b.focus();
      });
      each(document.querySelectorAll("[data-panel]"), function (p) {
        p.hidden = p.getAttribute("data-panel") !== key;
      });
    }

    each(buttons, function (b, i) {
      on(b, "click", function () {
        select(b.getAttribute("data-tab"), false);
        if (history.replaceState) history.replaceState(null, "", "#" + b.getAttribute("data-tab"));
      });
      on(b, "keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var n = (i + dir + buttons.length) % buttons.length;
        select(buttons[n].getAttribute("data-tab"), true);
      });
    });

    var hash = window.location.hash.replace("#", "");
    var initial = hash && group.querySelector('[data-tab="' + hash + '"]')
      ? hash
      : buttons[0].getAttribute("data-tab");
    select(initial, false);

    /* Footer and cross-page links point at #anchor: open the right panel. */
    on(window, "hashchange", function () {
      var h = window.location.hash.replace("#", "");
      if (h && group.querySelector('[data-tab="' + h + '"]')) select(h, true);
    });
  })();

  /* ------------------------------------------------------------------ form */
  each(document.querySelectorAll("form[id$='-form']"), function (form) {
    var status = form.querySelector(".form-status") ||
                 document.getElementById(form.id.replace("-form", "-status")) ||
                 document.getElementById("form-status");
    var button = form.querySelector("button[type=submit]");

    function say(msg, ok) {
      if (!status) return;
      status.textContent = msg;
      status.className = "form-status is-shown " + (ok ? "is-ok" : "is-bad");
    }

    on(form, "submit", function (e) {
      e.preventDefault();

      var data = new FormData(form);

      /* Honeypot: a real visitor never fills a field they cannot see. */
      if ((data.get("company") || "").toString().trim() !== "") {
        say("Thanks, we have your message.", true);
        form.reset();
        return;
      }

      var required = form.querySelectorAll("[required]");
      var missing = null;
      each(required, function (field) {
        if (!missing && !field.value.trim()) missing = field;
      });
      if (missing) {
        say("Please fill in your " + (missing.previousElementSibling ? missing.previousElementSibling.textContent.toLowerCase() : "details") + ".", false);
        missing.focus();
        return;
      }

      var email = form.querySelector("input[type=email]");
      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value)) {
        say("That email address does not look right.", false);
        email.focus();
        return;
      }

      var original = button ? button.innerHTML : "";
      if (button) {
        button.disabled = true;
        button.innerHTML = "Sending…";
      }
      say("Sending your request…", true);

      var payload = {};
      data.forEach(function (v, k) { payload[k] = v; });
      payload.page = window.location.pathname;

      fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (res) {
          if (res && (res.ok || res.sent)) {
            say("Thank you. We have your request and will be in touch during office hours.", true);
            form.reset();
          } else {
            throw new Error("send failed");
          }
        })
        .catch(function () {
          say("That did not send. Please phone the office on 021 555 0173 or email office@ridgeworksroofing.co.za.", false);
        })
        .finally(function () {
          if (button) {
            button.disabled = false;
            button.innerHTML = original;
          }
        });
    });
  });

  /* ------------------------------------------------------------------ year */
  (function year() {
    each(document.querySelectorAll("#year"), function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  })();
})();
