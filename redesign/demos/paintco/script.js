/* ==========================================================================
   Paintco Paarl
   Vanilla JS. No dependencies. Everything degrades to a working page if this
   file fails to load: content is visible, links work, the form posts natively.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------------
     Year
     ---------------------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------------------
     Header state on scroll (sentinel, no scroll listener)
     ---------------------------------------------------------------------- */
  var header = document.getElementById('site-header');
  if (header && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    /* 56px tall: the header flips once the visitor has genuinely scrolled,
       not on the first pixel of movement. */
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:56px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ----------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      navToggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      nav.classList.toggle('is-open', !open);
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
        nav.classList.remove('is-open');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        navToggle.focus();
      }
    });
  }

  /* ----------------------------------------------------------------------
     Hero deck: try a colour on the wall
     Feedback motion. The wall is the product, so picking a colour has to
     change the actual surface, not a small preview tile.
     ---------------------------------------------------------------------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var cbName = document.getElementById('cb-name');
  var cbMeta = document.getElementById('cb-meta');
  var cbCard = document.getElementById('cb-card');
  var colourField = document.getElementById('q-colour');

  /* Once the visitor types their own colour, stop overwriting it */
  if (colourField) {
    colourField.addEventListener('input', function () { colourField.dataset.touched = '1'; });
  }

  function paintWall(chip) {
    /* One control. It sets the band, the sample card, the hero wall behind the
       photograph, and the colour that rides along to the quote request. */
    root.style.setProperty('--wall', chip.dataset.wall);
    root.style.setProperty('--cb-on', chip.dataset.bandOn);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', chip.dataset.wall);

    if (cbName) cbName.textContent = chip.dataset.name;
    if (cbMeta) cbMeta.textContent = 'Exterior · ' + chip.dataset.wall.toUpperCase();
    if (cbCard) cbCard.textContent = chip.dataset.name;

    /* The colour they were playing with rides along to the quote request */
    if (colourField && !colourField.dataset.touched) {
      colourField.value = chip.dataset.name + ' (' + chip.dataset.wall + ')';
    }

    chips.forEach(function (c) {
      var on = c === chip;
      c.setAttribute('aria-checked', String(on));
      c.tabIndex = on ? 0 : -1;
    });
  }

  chips.forEach(function (chip, i) {
    chip.addEventListener('click', function () { paintWall(chip); });
    chip.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = chips[(i + 1) % chips.length];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = chips[(i - 1 + chips.length) % chips.length];
      if (e.key === 'Home') next = chips[0];
      if (e.key === 'End') next = chips[chips.length - 1];
      if (!next) return;
      e.preventDefault();
      paintWall(next);
      next.focus();
    });
  });

  /* ----------------------------------------------------------------------
     Work rail: scroll by one card, progress bar tracks position
     ---------------------------------------------------------------------- */
  var rail = document.getElementById('rail');
  var railPrev = document.getElementById('rail-prev');
  var railNext = document.getElementById('rail-next');
  var railBar = document.getElementById('rail-bar');

  if (rail && railPrev && railNext && railBar) {
    var step = function () {
      var shot = rail.querySelector('.shot');
      return shot ? shot.getBoundingClientRect().width + 16 : 320;
    };

    var syncRail = function () {
      var max = rail.scrollWidth - rail.clientWidth;
      var ratio = max > 0 ? rail.scrollLeft / max : 0;
      var visible = max > 0 ? rail.clientWidth / rail.scrollWidth : 1;

      var trackW = railBar.parentNode.clientWidth;
      var barW = Math.max(48, visible * trackW);
      railBar.style.width = barW + 'px';
      railBar.style.transform = 'translateX(' + (ratio * (trackW - barW)) + 'px)';

      railPrev.disabled = rail.scrollLeft <= 2;
      railNext.disabled = rail.scrollLeft >= max - 2;
    };

    railPrev.addEventListener('click', function () {
      rail.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    railNext.addEventListener('click', function () {
      rail.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    rail.addEventListener('scroll', syncRail, { passive: true });
    window.addEventListener('resize', syncRail);
    syncRail();
  }

  /* ----------------------------------------------------------------------
     Only one panel of the services list open at a time
     ---------------------------------------------------------------------- */
  var panels = Array.prototype.slice.call(document.querySelectorAll('.row'));
  panels.forEach(function (panel) {
    panel.addEventListener('toggle', function () {
      if (!panel.open) return;
      panels.forEach(function (other) { if (other !== panel) other.open = false; });
    });
  });

  /* ----------------------------------------------------------------------
     Scroll reveal, with a guard so content is never left invisible
     ---------------------------------------------------------------------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  function showAll() {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.05 });

    reveals.forEach(function (el, i) {
      el.style.setProperty('--reveal-delay', (i % 6) * 50 + 'ms');
      io.observe(el);
    });

    /* Fallback sweep: anything already on screen after a beat gets shown */
    window.setTimeout(function () {
      reveals.forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) el.classList.add('is-visible');
      });
    }, 1200);
  }

  /* ----------------------------------------------------------------------
     Quote form
     ---------------------------------------------------------------------- */
  var form = document.getElementById('quote-form');
  if (!form) return;

  var status = document.getElementById('form-status');
  var submit = document.getElementById('q-submit');

  function setStatus(message, ok) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-ok', ok === true);
    status.classList.toggle('is-bad', ok === false);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = form.querySelector('#q-name');
    var phone = form.querySelector('#q-phone');
    var missing = null;

    [name, phone].forEach(function (input) {
      var empty = !input.value.trim();
      input.closest('.field').classList.toggle('is-error', empty);
      if (empty && !missing) missing = input;
    });

    if (missing) {
      setStatus('Add your name and a phone number so we can come back to you.', false);
      missing.focus();
      return;
    }

    submit.disabled = true;
    var label = submit.textContent;
    submit.textContent = 'Sending';
    setStatus('', null);

    var payload = {
      name: name.value.trim(),
      phone: phone.value.trim(),
      suburb: form.querySelector('#q-suburb').value.trim(),
      service: form.querySelector('#q-service').value,
      colour: form.querySelector('#q-colour').value.trim(),
      message: form.querySelector('#q-message').value.trim(),
      company: form.querySelector('#q-company').value.trim()
    };

    fetch('/api/send-mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json().catch(function () { return {}; }); })
      .then(function (data) {
        if (data && data.success) {
          form.reset();
          setStatus('Thanks. Your request is in, we will call you back on the number you gave.', true);
        } else {
          setStatus((data && data.message) || 'That did not send. Please phone 073 517 1727 instead.', false);
        }
      })
      .catch(function () {
        setStatus('That did not send. Please phone 073 517 1727 instead.', false);
      })
      .then(function () {
        submit.disabled = false;
        submit.textContent = label;
      });
  });
})();
