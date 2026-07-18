/* ============================================================
   Navigator Vietnam — shared interactions
============================================================ */
(function () {
  'use strict';

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  const menu = document.getElementById('mobileMenu');
  const toggle = document.querySelector('.nav-toggle');
  const closeBtn = document.querySelector('.mobile-menu-close');
  const focusablesIn = (el) => [...el.querySelectorAll('a[href], button:not([disabled])')].filter((n) => n.offsetParent !== null);
  const openMenu = () => {
    menu.classList.add('open');
    toggle && toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    const first = focusablesIn(menu)[0];
    if (first) first.focus();
  };
  const closeMenu = () => {
    const wasOpen = menu.classList.contains('open');
    menu.classList.remove('open');
    toggle && toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    // Return focus to the trigger so keyboard users aren't dropped at the top.
    if (wasOpen && toggle) toggle.focus();
  };
  if (menu && toggle) {
    toggle.addEventListener('click', openMenu);
    closeBtn && closeBtn.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeMenu(); return; }
      // Trap Tab within the open menu.
      if (e.key === 'Tab' && menu.classList.contains('open')) {
        const items = focusablesIn(menu);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Scroll reveal (IO + resilient fallback) ---------- */
  const revealEls = [...document.querySelectorAll('.reveal, .reveal-stagger')];
  const show = (el) => el.classList.add('in');
  const revealInView = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    revealEls.forEach((el) => {
      if (el.classList.contains('in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) show(el);
    });
  };
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { show(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
    // Fallback: if IO callbacks never fire (some embedded renderers), reveal on scroll/load
    let ticking = false;
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(() => { revealInView(); ticking = false; }); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', revealInView);
    window.addEventListener('load', revealInView);
    // Safety sweep: never leave in-view content stuck hidden
    setTimeout(revealInView, 1200);
  } else {
    revealEls.forEach(show);
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const runCount = (el) => {
      const target = parseFloat(el.dataset.count);
      if (prefersReduced) { el.textContent = target; return; }
      const dur = 1600;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const co = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { runCount(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- Carousels (arrow-scrolled sliders) ---------- */
  document.querySelectorAll('[data-carousel]').forEach((wrap) => {
    const track = wrap.querySelector('.feature-track, .region-track, .testi-track');
    const prev = wrap.querySelector('[data-dir="-1"]');
    const next = wrap.querySelector('[data-dir="1"]');
    if (!track || !prev || !next) return;
    const step = () => {
      const card = track.firstElementChild;
      const gap = parseInt(getComputedStyle(track).columnGap, 10) || 20;
      return card ? card.getBoundingClientRect().width + gap : 320;
    };
    // Recomputed directly after every programmatic scroll — some browsers/embedded
    // renderers don't reliably fire a 'scroll' event for snap-corrected positions,
    // so we never rely on that event alone to unlock the buttons.
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    };
    const scrollByAmount = (delta) => {
      const target = Math.max(0, Math.min(track.scrollLeft + delta, track.scrollWidth - track.clientWidth));
      track.scrollLeft = target;
      update();
      setTimeout(update, 60);
    };
    prev.addEventListener('click', () => scrollByAmount(-step()));
    next.addEventListener('click', () => scrollByAmount(step()));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Looping contained strip (feature cards) ---------- */
  document.querySelectorAll('[data-loop-strip]').forEach((wrap) => {
    const track = wrap.querySelector('.feature-track');
    const prevBtn = wrap.querySelector('[data-dir="-1"]');
    const nextBtn = wrap.querySelector('[data-dir="1"]');
    if (!track || !prevBtn || !nextBtn) return;

    const originals = [...track.children];
    const count = originals.length;
    if (count < 2) return;

    // Three sets of cards so either direction always has identical content to
    // wrap onto; clones are hidden from the a11y tree.
    const cloneSet = () => originals.map((el) => {
      const clone = el.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      return clone;
    });
    cloneSet().forEach((c) => track.appendChild(c));
    cloneSet().reverse().forEach((c) => track.insertBefore(c, track.firstChild));

    const first = () => track.children[count];
    const setWidth = () => track.children[count * 2].offsetLeft - first().offsetLeft;
    const step = () => track.children[1].offsetLeft - track.children[0].offsetLeft;
    const rest = () => first().offsetLeft - (parseFloat(getComputedStyle(track).paddingLeft) || 0);

    const jump = (delta) => {
      const snap = track.style.scrollSnapType;
      track.style.scrollSnapType = 'none';
      track.scrollLeft += delta;
      void track.offsetWidth;
      track.style.scrollSnapType = snap;
    };
    const normalize = () => {
      const w = setWidth();
      if (w <= 0) return;
      const r = rest();
      if (track.scrollLeft < r) jump(w);
      else if (track.scrollLeft >= r + w) jump(-w);
    };
    const go = (dir) => track.scrollBy({ left: dir * step(), behavior: 'smooth' });

    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));
    let idle;
    track.addEventListener('scroll', () => {
      clearTimeout(idle);
      idle = setTimeout(normalize, 140);
    }, { passive: true });

    const settle = () => jump(rest() - track.scrollLeft);
    settle();
    requestAnimationFrame(settle);
    window.addEventListener('load', settle);
    window.addEventListener('resize', () => { normalize(); });
  });

  /* ---------- Looping full-bleed carousel (destinations) ---------- */
  document.querySelectorAll('[data-loop-carousel]').forEach((wrap) => {
    const viewport = wrap.querySelector('.region-viewport');
    const track = wrap.querySelector('.region-track');
    const prevBtn = wrap.querySelector('.region-arrow.prev');
    const nextBtn = wrap.querySelector('.region-arrow.next');
    if (!viewport || !track || !prevBtn || !nextBtn) return;

    const originals = [...track.children];
    const count = originals.length;
    if (!count) return;

    // Three sets (clones, originals, clones). The leading clones give the track
    // something to bleed off the left edge at rest, and either direction has a
    // full set of identical content to wrap onto.
    const cloneSet = () => originals.map((el) => {
      const clone = el.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      return clone;
    });
    cloneSet().forEach((c) => track.appendChild(c));
    cloneSet().reverse().forEach((c) => track.insertBefore(c, track.firstChild));

    const first = () => track.children[count]; // first real card, after the leading clones
    const setWidth = () => track.children[count * 2].offsetLeft - first().offsetLeft;
    const step = () => track.children[1].offsetLeft - track.children[0].offsetLeft;

    // Rest on a snap point one set in, so the first real card lands on the gutter
    // with the previous card bleeding off the left edge. The track's own padding
    // is the gutter, so the peek is symmetric with the right edge by construction —
    // only scrollLeft 0 showed a dead gutter, and the leading clones remove that.
    const rest = () => first().offsetLeft - (parseFloat(getComputedStyle(track).paddingLeft) || 0);

    // Snap fights programmatic scrollLeft writes, so silence it for the jump.
    const jump = (delta) => {
      const snap = track.style.scrollSnapType;
      track.style.scrollSnapType = 'none';
      track.scrollLeft += delta;
      void track.offsetWidth;
      track.style.scrollSnapType = snap;
    };

    // Keep the position inside one set-width window anchored at rest.
    const normalize = () => {
      const w = setWidth();
      if (w <= 0) return;
      const r = rest();
      if (track.scrollLeft < r) jump(w);
      else if (track.scrollLeft >= r + w) jump(-w);
    };

    const go = (dir) => track.scrollBy({ left: dir * step(), behavior: 'smooth' });

    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));

    let idle;
    track.addEventListener('scroll', () => {
      clearTimeout(idle);
      idle = setTimeout(normalize, 140);
    }, { passive: true });

    // Centre the arrows on the image rather than the whole card.
    const measure = () => {
      const media = track.querySelector('.region-slide-media');
      if (media) viewport.style.setProperty('--media-h', media.getBoundingClientRect().height + 'px');
    };
    const settle = () => { measure(); jump(rest() - track.scrollLeft); };
    settle();
    requestAnimationFrame(settle);
    window.addEventListener('load', settle);
    window.addEventListener('resize', () => { measure(); normalize(); });
  });

  /* ---------- Prefill contact destination from hero form (?destination=) or tour link (?tour=) ---------- */
  const TOUR_NAMES = {
    'northern-highlights': "Vietnam's Northern Highlights",
    'highlights-hidden-gems': "Vietnam's Highlights & Hidden Gems",
    'vietnam-cambodia': 'Vietnam & Cambodia',
    'peaks-passes-caves': 'Vietnam: Peaks, Passes & Caves',
    'north-to-south': 'Vietnam: North to South',
    'create-your-own': 'Vietnam, Your Way'
  };
  const searchParams = new URLSearchParams(location.search);
  const destParam = searchParams.get('destination');
  const tourParam = searchParams.get('tour');
  const destInput = document.getElementById('destination');
  if (destInput) {
    if (destParam) destInput.value = destParam;
    else if (tourParam) destInput.value = TOUR_NAMES[tourParam] || tourParam;
  }

  /* ---------- Contact form ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    const submitBtn = document.getElementById('submitBtn');
    const submitLabel = document.getElementById('submitLabel');
    const statusEl = document.getElementById('formStatus');

    const fields = {
      name: { el: document.getElementById('name'), errEl: document.getElementById('name-error'), validate: (v) => (v.trim().length > 1 ? '' : 'Please enter your name.') },
      email: { el: document.getElementById('email'), errEl: document.getElementById('email-error'), validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address.') },
      message: { el: document.getElementById('message'), errEl: document.getElementById('message-error'), validate: (v) => (v.trim().length > 5 ? '' : 'Please tell us a bit more.') },
    };

    const validateField = (key) => {
      const f = fields[key];
      const err = f.validate(f.el.value);
      f.errEl.textContent = err;
      f.el.setAttribute('aria-invalid', err ? 'true' : 'false');
      return !err;
    };

    Object.keys(fields).forEach((key) => fields[key].el.addEventListener('blur', () => validateField(key)));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      statusEl.textContent = '';
      statusEl.className = 'form-status';

      const results = Object.keys(fields).map(validateField);
      if (results.includes(false)) {
        const firstKey = Object.keys(fields).find((key, i) => !results[i]);
        if (firstKey) fields[firstKey].el.focus();
        return;
      }

      const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      const payload = {
        name: fields.name.el.value.trim(),
        email: fields.email.el.value.trim(),
        phone: val('phone'),
        destination: val('destination'),
        dates: val('dates'),
        travellers: val('travellers'),
        message: fields.message.el.value.trim(),
        company: val('company'), // honeypot: real users leave this empty
      };

      submitBtn.disabled = true;
      submitLabel.textContent = 'Sending…';

      try {
        const res = await fetch('/api/send-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success !== false) {
          const successEl = document.getElementById('formSuccess');
          if (successEl) {
            form.hidden = true;
            successEl.hidden = false;
            requestAnimationFrame(() => successEl.classList.add('is-shown'));
            const heading = document.getElementById('formSuccessHeading');
            if (heading) heading.focus();
            successEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          } else {
            statusEl.textContent = "Thanks! We've received your message and will be in touch within 24 hours.";
            statusEl.className = 'form-status success';
          }
          form.reset();
        } else {
          throw new Error(data.message || 'Something went wrong.');
        }
      } catch (err) {
        statusEl.textContent = 'Something went wrong sending your message. Please email us directly at info@navigator-vietnam.com.';
        statusEl.className = 'form-status error';
      } finally {
        submitBtn.disabled = false;
        submitLabel.textContent = 'Submit';
      }
    });

    const sendAnother = document.getElementById('sendAnother');
    const successEl = document.getElementById('formSuccess');
    if (sendAnother && successEl) {
      sendAnother.addEventListener('click', () => {
        successEl.classList.remove('is-shown');
        successEl.hidden = true;
        form.hidden = false;
        statusEl.textContent = '';
        statusEl.className = 'form-status';
        const firstInput = document.getElementById('name');
        if (firstInput) firstInput.focus();
        form.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }
  }
})();
