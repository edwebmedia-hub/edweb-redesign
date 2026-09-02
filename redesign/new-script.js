/* ==========================================================================
   Edweb Media: new home (Resonance-skeleton build)
   Standalone: this page does NOT load script.js, so none of its class hooks
   (.faq-item, .carousel-wrap, .review-card) apply here.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ------------------------------ Header state ---------------------------- */
  var header = $('#site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------ Mobile nav ------------------------------ */
  var nav = $('#nav');
  var toggle = $('#nav-toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('.nav-links a', nav).forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------- Reveal on scroll ----------------------------- */
  /* Guarded: if IO is missing or stalls, everything is shown, never hidden. */
  var reveals = $$('.reveal');
  var showAll = function () {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  };

  if (!('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    reveals.forEach(function (el) { io.observe(el); });

    /* Safety sweep: nothing stays invisible if the observer never fires. */
    window.setTimeout(function () {
      reveals.forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) el.classList.add('is-visible');
      });
    }, 1200);
    window.addEventListener('load', function () {
      window.setTimeout(showAll, 4000);
    });
  }

  /* -------------------------------- Tabs ---------------------------------- */
  /* .thumb is the gallery-strip variant of a tab on the work-page comps; it
     needs the same selection handling without inheriting the .tab styling. */
  var tabs = $$('.tab, .thumb').filter(function (t) {
    return t.getAttribute('aria-hidden') !== 'true';
  });
  var panels = $$('.tab-panel');

  var userPicked = false;
  var selectTab = function (tab) {
    var shown = null;
    tabs.forEach(function (t) {
      var active = t === tab;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
    });
    panels.forEach(function (p) {
      var active = p.id === tab.getAttribute('aria-controls');
      p.classList.toggle('is-active', active);
      p.hidden = !active;
      /* A reveal inside a hidden panel never intersects, so it would still be
         at opacity 0 the moment the panel is shown. Resolve them on reveal. */
      if (active) {
        $$('.reveal', p).forEach(function (el) { el.classList.add('is-visible'); });
        shown = p;
      }
    });

    /* On a phone the panel opens below the list, so a tap near the top of the
       list can change content the reader cannot see. Bring it into view, but
       only when the tap moved it off screen and only once the reader has
       actually chosen something. */
    /* The project strip scrolls by hand on a phone, so keyboard and deep-link
       selections have to bring their own thumbnail back into view. */
    var rail = tab.parentElement && tab.parentElement.parentElement;
    if (rail && rail.classList.contains('thumb-rail') && rail.scrollWidth > rail.clientWidth) {
      var t = tab.getBoundingClientRect();
      var r = rail.getBoundingClientRect();
      if (t.left < r.left || t.right > r.right) {
        rail.scrollTo({ left: rail.scrollLeft + (t.left - r.left) - 16, behavior: 'smooth' });
      }
    }

    if (shown && userPicked && window.matchMedia('(max-width: 860px)').matches) {
      var anchor = tab.closest('.tab-list') ? tab : shown;
      var head = document.getElementById('site-header');
      var offset = (head ? head.getBoundingClientRect().height : 0) + 12;
      var top = anchor.getBoundingClientRect().top;
      /* Already parked where it belongs, so leave it alone. */
      if (Math.abs(top - offset) > 8) {
        window.scrollTo({ top: window.scrollY + top - offset, behavior: 'smooth' });
      }
    }
  };

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { userPicked = true; selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        selectTab(next);
        next.focus();
      }
    });
  });

  /* ------------------ Arrows for the work slider --------------------------- */
  /* They click the neighbouring thumbnail rather than duplicating selectTab,
     so panel switching, focus order and the rail scroll stay in one place. */
  (function () {
    var rail = document.querySelector('.opt-c .thumb-track');
    var prev = document.querySelector('[data-work-prev]');
    var next = document.querySelector('[data-work-next]');
    var count = document.querySelector('.work-count');
    if (!rail || (!prev && !next)) return;
    /* The rail carries a duplicate set for the seamless loop; only the real
       ones are steppable. */
    var thumbs = $$('.thumb', rail).filter(function (t) {
      return t.getAttribute('aria-hidden') !== 'true';
    });
    if (thumbs.length < 2) return;

    var at = function () {
      var i = thumbs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
      return i < 0 ? 0 : i;
    };
    var say = function () {
      if (count) count.textContent = (at() + 1) + ' of ' + thumbs.length;
    };
    var step = function (by) {
      thumbs[(at() + by + thumbs.length) % thumbs.length].click();
      say();
    };
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    thumbs.forEach(function (t) { t.addEventListener('click', say); });
    /* The counter is a polite live region and it was only updated on click.
       Arrow keys call selectTab directly, so it kept announcing the position
       the user had already left, which is worse than announcing nothing. */
    rail.addEventListener('keyup', say);
    say();
  
}());

  /* -------------- Masthead index rows open the tab they name --------------- */
  /* The pricing masthead lists the three website types; clicking one has to
     select that tab as well as jump, or the visitor lands on the wrong panel. */
  $$('[data-open-tab]').forEach(function (link) {
    link.addEventListener('click', function () {
      var target = document.getElementById(link.getAttribute('data-open-tab'));
      if (target) selectTab(target);
    });
  });

  /* ------------------- Package buttons prefill the form ------------------- */
  $$('[data-package]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var field = $('#package');
      if (field) field.value = btn.getAttribute('data-package');
      var msg = $('#message');
      if (msg && !msg.value) {
        msg.value = 'I am interested in the ' + btn.getAttribute('data-package') + ' package.';
      }
    });
  });



  /* ------------------------- Multi-select picker -------------------------- */
  /* A button plus a panel of real checkboxes: tidier than seven wrapping chips,
     and because the inputs are genuine the form payload is untouched. */
  (function () {
    var wrap = $('#services-picker');
    if (!wrap) return;
    var btn = $('#services-btn');
    var panel = $('#services-panel');
    var value = $('#services-value');
    var boxes = $$('input[type="checkbox"]', panel);

    var label = function () {
      var on = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
      btn.classList.toggle('is-empty', on.length === 0);
      if (!on.length) { value.textContent = 'Choose what you need'; return; }
      if (on.length <= 2) { value.textContent = on.join(', '); return; }
      value.textContent = on.slice(0, 2).join(', ') + ' and ' + (on.length - 2) + ' more';
    };

    var open = function (state) {
      panel.hidden = !state;
      btn.setAttribute('aria-expanded', String(state));
    };

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      open(panel.hidden);
    });

    boxes.forEach(function (box) {
      box.addEventListener('change', label);
    });

    /* Clicking away or pressing Escape closes it, like any real dropdown. */
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !wrap.contains(e.target)) open(false);
    });
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); }
    });

    label();
  })();

  /* ------------------- Guided enquiry form (contact page) ------------------ */
  /* Carries over what made the live multi-step form easy without the wizard:
     follow-up questions appear only when they apply, the package list narrows
     to the type chosen, and a sent enquiry gets a real confirmation panel. */
  (function () {
    var form = $('#contact-form');
    var webOptions = $('#web-options');
    var packageSel = $('#package');
    /* Only the contact page has the guided controls. The home page has a
       contact form too, but its #package is a hidden input with no .options,
       which threw here before this guard. */
    if (!form || !webOptions || !packageSel || !packageSel.options) return;

    var wantWeb = $('#want-web');
    var packageNote = $('#package-note');
    var typeNote = $('#type-note');

    var RANGES = {
      business: 'Business websites run R3,499 to R5,999 once-off.',
      stores: 'Online stores run R5,499 to R8,999 once-off.',
      directory: 'Directory sites start at R8,499 once-off.'
    };

    /* Keep every option in the DOM and hide the ones that do not apply, so a
       selection made before narrowing is never silently thrown away. */
    var allOptions = Array.prototype.slice.call(packageSel.options);

    var narrowTo = function (group) {
      allOptions.forEach(function (opt) {
        var g = opt.getAttribute('data-group');
        opt.hidden = !!(group && g && g !== group);
      });
      if (group && packageSel.selectedOptions[0] && packageSel.selectedOptions[0].hidden) {
        packageSel.value = '';
      }
      packageNote.textContent = group ? RANGES[group] : '';
    };

    var syncWeb = function () {
      var on = wantWeb && wantWeb.checked;
      webOptions.hidden = !on;
      if (!on) {
        $$('input[name="website_type"]').forEach(function (r) { r.checked = false; });
        $$('input[name="addons"]').forEach(function (c) { c.checked = false; });
        narrowTo(null);
      }
    };

    if (wantWeb) wantWeb.addEventListener('change', syncWeb);

    $$('input[name="website_type"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        narrowTo(radio.getAttribute('data-group'));
        typeNote.textContent = RANGES[radio.getAttribute('data-group')] || '';
      });
    });

    /* Choosing a package the other way round ticks the matching type, so the
       two controls never disagree with each other. */
    packageSel.addEventListener('change', function () {
      var opt = packageSel.selectedOptions[0];
      var g = opt && opt.getAttribute('data-group');
      if (!g) return;
      if (wantWeb && !wantWeb.checked) {
        wantWeb.checked = true;
        /* Dispatch rather than call syncWeb directly: the picker button's
           summary label listens on the same event, and setting .checked in
           code fires nothing, so the button still read "Choose what you need"
           while the option underneath was ticked. */
        wantWeb.dispatchEvent(new Event('change', { bubbles: true }));
      }
      $$('input[name="website_type"]').forEach(function (r) {
        if (r.getAttribute('data-group') === g) r.checked = true;
      });
      narrowTo(g);
      typeNote.textContent = RANGES[g] || '';
    });

    syncWeb();
  })();

  /* --------------------------- Enquiry forms ------------------------------ */
  /* Both the hero quote card and the contact form post to the same endpoint. */
  $$('#quote-form, #contact-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var submit = form.querySelector('button[type="submit"]');
      var data = {};
      /* Repeated keys (the service checkboxes) must accumulate: a plain
         assignment here kept only the last one checked. */
      new FormData(form).forEach(function (value, key) {
        if (key in data && value !== '') data[key] = data[key] + ', ' + value;
        else data[key] = value;
      });

      var missing = null;
      if (!data.first_name) missing = form.querySelector('[name="first_name"]');
      else if (!data.email) missing = form.querySelector('[name="email"]');
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) missing = form.querySelector('[name="email"]');

      if (missing) {
        status.textContent = missing.name === 'first_name'
          ? 'Please add your name so we know who we are replying to.'
          : 'Please add an email address we can reply to.';
        status.setAttribute('data-state', 'error');
        missing.setAttribute('aria-invalid', 'true');
        missing.focus();
        return;
      }
      form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });

      submit.disabled = true;
      status.removeAttribute('data-state');
      status.textContent = 'Sending...';

      fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) { return res.json().catch(function () { return {}; }); })
        .then(function (out) {
          /* Google Ads conversion: fires ONLY on a real send (sent === true,
             which the API withholds from honeypot catches) and only when the
             gtag loader exists, so the draft without the loader stays inert. */
          if (out && out.sent === true && typeof gtag === 'function') {
            gtag('event', 'conversion', { send_to: 'AW-16948063813/tpRLCIWp79QcEMXcu5E_' });
          }
          if (out && out.success) {
            var panel = $('#sent-panel');
            if (panel) {
              var msg = $('#sent-msg');
              if (msg && data.first_name) {
                msg.textContent = 'Thanks ' + data.first_name + '. We reply to every enquiry, usually within one working day.';
              }
              form.hidden = true;
              panel.hidden = false;
              /* The submit button lived inside the form we just hid, so focus is
                 on <body> and nothing is announced. The panel carries
                 role="status" and now takes focus too. */
              if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
              panel.focus({ preventScroll: true });
              panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              status.textContent = 'Thank you. Your enquiry is in, we usually reply within one working day.';
              status.setAttribute('data-state', 'ok');
            }
            form.reset();
          } else {
            status.textContent = (out && out.message) || 'Something went wrong. Please email info@edwebmedia.com.';
            status.setAttribute('data-state', 'error');
          }
        })
        .catch(function () {
          status.textContent = 'Could not send right now. Please email info@edwebmedia.com.';
          status.setAttribute('data-state', 'error');
        })
        .then(function () { submit.disabled = false; });
    });
  });

  /* -------------------- Package carried in from the URL -------------------- */
  /* The pricing page links here as ?package=<label>. Select the matching option
     if there is one, otherwise add it so nothing is silently dropped. */
  (function () {
    var select = $('#package');
    if (!select || !select.options) return;
    var params = new URLSearchParams(window.location.search);

    /* "Book this design" on a work-page demo lands here. Tick website design,
       say which demo in the message, and let the rest of the form take over. */
    var demo = params.get('demo');
    if (demo) {
      var want = $('#want-web');
      if (want && !want.checked) {
        want.checked = true;
        want.dispatchEvent(new Event('change', { bubbles: true }));
      }
      var msg = $('#message');
      if (msg && !msg.value) {
        msg.value = 'I like the ' + demo + ' design on your work page. Can you build something like that for my business?';
      }
      var note = $('#package-note');
      if (note && !note.textContent) note.textContent = 'Starting from the ' + demo + ' design.';
    }

    var wanted = params.get('package');
    if (!wanted) return;

    var found = false;
    Array.prototype.forEach.call(select.options, function (opt) {
      if (opt.value === wanted) { select.value = wanted; found = true; }
    });
    if (!found) {
      var opt = document.createElement('option');
      opt.value = wanted;
      opt.textContent = wanted;
      select.appendChild(opt);
      select.value = wanted;
    }

    /* Fire change so the guided sync runs. Without it the package was set while
       the picker, the website type and the price note all stayed blank. */
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })();

  /* ---------------------------- Book a call ------------------------------- */
  /* Weekday slots only, never a past date, and the request posts to the same
     mail endpoint as the enquiry form with type "booking". */
  (function () {
    var grid = $('#cal-days');
    if (!grid) return;

    var monthLabel = $('#cal-month');
    var timesWrap = $('#cal-times');
    var summary = $('#cal-summary');
    var form = $('#booking-form');
    var done = $('#book-done');
    var status = $('#book-status');

    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'];
    var TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    var chosenDate = null;
    var chosenTime = null;

    var isPickable = function (d) {
      var day = d.getDay();
      return d >= today && day !== 0 && day !== 6;
    };

    var longDate = function (d) {
      return d.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    };

    var refreshSummary = function () {
      if (chosenDate && chosenTime) {
        summary.textContent = 'Requesting ' + longDate(chosenDate) + ' at ' + chosenTime + '.';
      } else if (chosenDate) {
        summary.textContent = longDate(chosenDate) + '. Now pick a time.';
      } else {
        summary.textContent = 'Choose a weekday, then a time.';
      }
    };

    /* Slots are always drawn, disabled until a date exists: an empty column
       beside the calendar reads as broken rather than as "pick a date first". */
    var drawTimes = function () {
      timesWrap.innerHTML = '';
      TIMES.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.textContent = t;
        /* On today, an hour that has already gone is not bookable. */
        var past = false;
        if (chosenDate && chosenDate.getTime() === today.getTime()) {
          var now = new Date();
          past = parseInt(t.slice(0, 2), 10) <= now.getHours();
        }
        b.disabled = !chosenDate || past;
        b.setAttribute('aria-pressed', String(chosenTime === t));
        if (chosenTime === t) b.classList.add('is-selected');
        b.addEventListener('click', function () {
          chosenTime = t;
          drawTimes();
          refreshSummary();
        });
        timesWrap.appendChild(b);
      });
    };

    var draw = function () {
      /* Rebuilding the grid removes the button the user is standing on, which
         ejects them to <body> on every date press. Remember which day held
         focus and hand it back once the cells exist again. */
      var refocus = document.activeElement &&
        document.activeElement.parentElement === grid ? document.activeElement.textContent.trim() : null;
      grid.innerHTML = '';
      monthLabel.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();

      /* Monday-first grid: getDay() is Sunday-first, so shift it. */
      var lead = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;
      var days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

      for (var i = 0; i < lead; i++) {
        var blank = document.createElement('span');
        blank.className = 'cal-day is-empty';
        grid.appendChild(blank);
      }

      for (var d = 1; d <= days; d++) {
        (function (dayNum) {
          var date = new Date(view.getFullYear(), view.getMonth(), dayNum);
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'cal-day';
          b.textContent = String(dayNum);
          b.disabled = !isPickable(date);
          if (!b.disabled) b.setAttribute('aria-label', longDate(date));
          if (chosenDate && date.getTime() === chosenDate.getTime()) {
            b.classList.add('is-selected');
            b.setAttribute('aria-pressed', 'true');
          }
          b.addEventListener('click', function () {
            chosenDate = date;
            chosenTime = null;
            draw();
            drawTimes();
            refreshSummary();
          });
          grid.appendChild(b);
        })(d);
      }
      if (refocus) {
        var back = Array.prototype.filter.call(grid.children, function (c) {
          return c.tagName === 'BUTTON' && c.textContent.trim() === refocus;
        })[0];
        if (back) back.focus({ preventScroll: true });
      }
    };

    var thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    var step = function (n) {
      var next = new Date(view.getFullYear(), view.getMonth() + n, 1);
      /* Never page into the past: there is nothing bookable back there and it
         showed a full grid of dead dates. */
      if (next < thisMonth) return;
      view = next;
      draw();
    };
    var prevBtn = $('#cal-prev');
    var syncPrev = function () {
      var atFloor = view.getFullYear() === thisMonth.getFullYear() && view.getMonth() === thisMonth.getMonth();
      prevBtn.disabled = atFloor;
    };
    prevBtn.addEventListener('click', function () { step(-1); syncPrev(); });
    $('#cal-next').addEventListener('click', function () { step(1); syncPrev(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#book-name').value.trim();
      var email = $('#book-email').value.trim();
      var phone = $('#book-phone').value.trim();
      var submit = $('#book-submit');

      if (!chosenDate || !chosenTime) {
        status.textContent = 'Pick a date and a time on the calendar first.';
        status.setAttribute('data-state', 'error');
        return;
      }

      if (!name || !email || !phone) {
        status.textContent = 'Name, email and phone are all needed to confirm a call.';
        status.setAttribute('data-state', 'error');
        return;
      }

      submit.disabled = true;
      status.removeAttribute('data-state');
      status.textContent = 'Sending...';

      fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking',
          first_name: name,
          name: name,
          email: email,
          phone: phone,
          company: $('#book-company').value,
          meeting_date: longDate(chosenDate) + ' at ' + chosenTime,
          /* Key MUST be "note": api/send-mail.js:61 renders `Note: ${note}` in the
             booking branch and never looks at "message". */
          note: $('#book-note').value.trim()
        })
      })
        .then(function (res) { return res.json().catch(function () { return {}; }); })
        .then(function (out) {
          if (out && out.sent === true && typeof gtag === 'function') {
            gtag('event', 'conversion', { send_to: 'AW-16948063813/tpRLCIWp79QcEMXcu5E_' });
          }
          if (out && out.success) {
            form.hidden = true;
            $('#book-pick').hidden = true;
            done.hidden = false;
            $('#book-done-msg').textContent =
              'Thanks ' + name + '. We have your request for ' + longDate(chosenDate) +
              ' at ' + chosenTime + '.';
          } else {
            status.textContent = (out && out.message) || 'Something went wrong. Please email info@edwebmedia.com.';
            status.setAttribute('data-state', 'error');
            submit.disabled = false;
          }
        })
        .catch(function () {
          status.textContent = 'Could not send right now. Please email info@edwebmedia.com.';
          status.setAttribute('data-state', 'error');
          submit.disabled = false;
        });
    });

    draw();
    drawTimes();
    refreshSummary();
    syncPrev();
  })();

  /* --------------------------------- Year --------------------------------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
  /* ---------------------- Pause control for the rails ---------------------- */
  /* Four rails move on their own. Hover was the only way to stop them, which no
     touch user has and no keyboard user can reach, and the .is-paused hook the
     stylesheet already defined was never set by anything. The button is built
     here rather than in the markup so a no-JS visitor never sees a control that
     cannot work. */
  (function () {
    var RAILS = [
      ['.logo-strip', 'client logos'],
      ['.reviews-rail', 'reviews'],
      ['.work-strip', 'recent builds'],
      ['.opt-c .thumb-rail', 'project thumbnails']
    ];
    RAILS.forEach(function (pair) {
      var rail = document.querySelector(pair[0]);
      if (!rail) return;
      var track = rail.firstElementChild;
      if (!track || getComputedStyle(track).animationName === 'none') return;
      rail.classList.add('rail-holder');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-pause';
      var paint = function () {
        var off = rail.classList.contains('is-paused');
        btn.textContent = off ? 'Play' : 'Pause';
        btn.setAttribute('aria-label', (off ? 'Resume the ' : 'Pause the ') + pair[1] + ' strip');
      };
      btn.addEventListener('click', function () {
        rail.classList.toggle('is-paused');
        paint();
      });
      paint();
      rail.appendChild(btn);
    });
  }());

  /* ------------------- Focus follows the step it opened -------------------- */
  /* Hiding the container that holds the button someone just pressed drops focus
     to <body>, so a keyboard or screen-reader user loses their place and hears
     nothing. Every swap below moves focus to the panel that replaced it. */
  var focusPanel = function (el) {
    if (!el) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    try { el.focus({ preventScroll: false }); } catch (e) { el.focus(); }
  };
  window.__edwebFocusPanel = focusPanel;


  /* Escape closes the mobile menu. It had no handler, so a keyboard user who
     opened it had no way out but to tab through every link. edweb menu escape */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var toggle = document.getElementById('nav-toggle');
    if (!toggle || toggle.getAttribute('aria-expanded') !== 'true') return;
    toggle.click();
    toggle.focus();
  });
})();
