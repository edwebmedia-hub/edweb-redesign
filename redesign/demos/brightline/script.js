/* Brightline Electrical, shared site script.
   Every feature initialises inside its own try/catch, so one failure can
   never take the rest of the page down with it. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  /* Mobile navigation */
  try {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('nav-toggle');
    if (nav && toggle) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      nav.addEventListener('click', function (ev) {
        if (ev.target.closest('.nav-links a')) {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      });
    }
  } catch (e) { console.error('nav', e); }

  /* Hero slider: manual only, no autoplay. Chevrons and arrow keys move it. */
  try {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var prev = document.querySelector('.hero-prev');
    var next = document.querySelector('.hero-next');
    var bar = document.querySelector('.hero-progress span');
    if (slides.length > 1) {
      var index = 0;
      var show = function (i) {
        index = (i + slides.length) % slides.length;
        slides.forEach(function (s, n) {
          s.classList.toggle('is-active', n === index);
          s.setAttribute('aria-hidden', String(n !== index));
        });
        if (bar) {
          bar.style.width = (100 / slides.length) + '%';
          bar.style.transform = 'translateX(' + (index * 100) + '%)';
        }
      };
      show(0);
      if (prev) prev.addEventListener('click', function () { show(index - 1); });
      if (next) next.addEventListener('click', function () { show(index + 1); });
      var hero = document.querySelector('.hero');
      if (hero) {
        hero.addEventListener('keydown', function (ev) {
          if (ev.key === 'ArrowLeft') { show(index - 1); }
          if (ev.key === 'ArrowRight') { show(index + 1); }
        });
      }
    }
  } catch (e) { console.error('hero', e); }

  /* Scroll reveal, IntersectionObserver plus a safety sweep so content
     can never stay invisible if the observer never fires. */
  try {
    var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (revealEls.length) {
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(function (el) { io.observe(el); });
      } else {
        revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      }
      setTimeout(function () {
        revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      }, 2500);
    }
  } catch (e) { console.error('reveal', e); }

  /* Marquee: duplicate the track once so the loop has no gap */
  try {
    Array.prototype.slice.call(document.querySelectorAll('[data-marquee]')).forEach(function (track) {
      var items = Array.prototype.slice.call(track.children);
      items.forEach(function (item) {
        var clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    });
  } catch (e) { console.error('marquee', e); }

  /* Gallery filter (gallery page only) */
  try {
    var filterBar = document.getElementById('gallery-filter');
    var items = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
    if (filterBar && items.length) {
      filterBar.addEventListener('click', function (ev) {
        var btn = ev.target.closest('.filter-btn');
        if (!btn) return;
        var wanted = btn.getAttribute('data-filter');
        filterBar.querySelectorAll('.filter-btn').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        items.forEach(function (item) {
          item.hidden = !(wanted === 'all' || item.getAttribute('data-category') === wanted);
        });
      });
    }
  } catch (e) { console.error('gallery', e); }

  /* Enquiry form */
  try {
    var form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var btn = form.querySelector('button[type="submit"]');
        var status = document.getElementById('form-status');
        var setStatus = function (text, ok) {
          if (!status) return;
          status.textContent = text;
          status.classList.toggle('is-success', ok === true);
          status.classList.toggle('is-error', ok === false);
        };
        var data = {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone ? form.phone.value.trim() : '',
          service: form.service ? form.service.value : '',
          message: form.message.value.trim(),
          company: form.company ? form.company.value.trim() : ''
        };
        if (!data.name || !data.email || !data.message) {
          setStatus('Please fill in your name, email and a short message.', false); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          setStatus('That email address does not look right.', false); return;
        }
        var original = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Sending'; }
        setStatus('', null);
        fetch('/api/send-mail', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.success) {
              setStatus('Thanks. Your enquiry is in, and we will come back to you.', true);
              form.reset();
            } else { setStatus('Something went wrong. Please phone us instead.', false); }
          })
          .catch(function () { setStatus('Network error. Please try again or phone us.', false); })
          .finally(function () { if (btn) { btn.disabled = false; btn.textContent = original; } });
      });
    }
  } catch (e) { console.error('form', e); }

  /* Footer year */
  try {
    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
  } catch (e) { console.error('year', e); }
})();
