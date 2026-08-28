/* ==========================================================================
   ERFDEVCO site script
   Vanilla, no dependencies. Every feature guards its own markup so a page
   missing a block never breaks the rest of the file.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ----------------------------------------------------------------------
     Header: solid ground once the page leaves the hero
     ---------------------------------------------------------------------- */
  (function header() {
    var el = $('#site-header');
    if (!el) return;
    if (el.hasAttribute('data-opaque')) el.classList.add('is-opaque');
    var onScroll = function () {
      if (window.scrollY > 40) el.classList.add('is-solid');
      else el.classList.remove('is-solid');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ----------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */
  (function nav() {
    var toggle = $('#nav-toggle');
    var panel = $('#nav');
    if (!toggle || !panel) return;

    var close = function () {
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    $$('a', panel).forEach(function (a) { a.addEventListener('click', close); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) close();
    });
  })();

  /* ----------------------------------------------------------------------
     Scroll reveal. Content is visible unless JS both loads AND arms it, and
     three separate fallbacks make sure nothing can stay hidden.
     ---------------------------------------------------------------------- */
  (function reveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    var showAll = function () {
      items.forEach(function (el) { el.classList.add('is-visible'); });
    };

    if (!('IntersectionObserver' in window)) { showAll(); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    items.forEach(function (el) { io.observe(el); });

    // Anything already on screen at load, plus two safety sweeps.
    setTimeout(function () {
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
      });
    }, 60);
    setTimeout(showAll, 2600);
    setTimeout(showAll, 9000);
  })();

  /* ----------------------------------------------------------------------
     Counters. Count up once, in view, and never animate under
     prefers-reduced-motion.
     ---------------------------------------------------------------------- */
  (function counters() {
    var nodes = $$('[data-count]');
    if (!nodes.length) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      if (reduced || !('requestAnimationFrame' in window)) { el.textContent = String(target); return; }
      var start = null;
      var dur = 1300;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
    setTimeout(function () { nodes.forEach(function (n) { if (n.textContent === '0') run(n); }); }, 4000);
  })();

  /* ----------------------------------------------------------------------
     Listings engine
     ---------------------------------------------------------------------- */
  var DATA_URL = 'data/listings.json';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function farmCard(f, eager) {
    var meta = (f.facts || []).slice(0, 3).map(function (pair) {
      return '<span><b>' + esc(pair[0]) + '</b> ' + esc(pair[1]).toLowerCase() + '</span>';
    }).join('');

    return '' +
      '<article class="farm-card reveal">' +
        '<a class="farm-card__media" href="listing.html?id=' + encodeURIComponent(f.id) + '" aria-label="' + esc(f.title) + ', ' + esc(f.place) + '">' +
          '<img src="' + esc(f.image) + '" alt="' + esc(f.alt) + '" ' + (eager ? '' : 'loading="lazy" ') + 'decoding="async" width="1200" height="900" />' +
          '<span class="farm-card__ref">' + esc(f.ref) + '</span>' +
          '<span class="farm-card__type">' + esc(f.farmType) + '</span>' +
        '</a>' +
        '<div class="farm-card__body">' +
          '<div class="farm-card__row">' +
            '<div>' +
              '<h3 class="farm-card__title"><a href="listing.html?id=' + encodeURIComponent(f.id) + '">' + esc(f.title) + '</a></h3>' +
              '<p class="farm-card__place">' + esc(f.place) + ', ' + esc(f.province) + '</p>' +
            '</div>' +
            '<p class="farm-card__price">' + esc(f.priceDisplay) + '</p>' +
          '</div>' +
          '<div class="farm-card__meta">' + meta + '</div>' +
          '<div class="farm-card__foot">' +
            '<a class="link-line" href="listing.html?id=' + encodeURIComponent(f.id) + '">View the schedule <span class="arw" aria-hidden="true">&rarr;</span></a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function loadData() {
    return fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('Could not load listings (' + r.status + ')');
        return r.json();
      })
      .then(function (json) { return (json && json.listings) || []; });
  }

  /* Home: featured farms ------------------------------------------------- */
  (function homeFarms() {
    var mount = $('#featured-farms');
    if (!mount) return;
    loadData().then(function (farms) {
      var limit = parseInt(mount.getAttribute('data-limit') || '4', 10);
      var list = farms.slice(0, limit);
      mount.innerHTML = list.map(function (f, i) { return farmCard(f, i === 0); }).join('');
      var count = $('#farm-count');
      if (count) count.textContent = String(farms.length);
      armReveals(mount);
    }).catch(function (err) {
      mount.innerHTML = '<div class="farm-empty"><h3>Listings unavailable</h3><p>' + esc(err.message) + '</p></div>';
    });
  })();

  /* Listings page --------------------------------------------------------- */
  (function listingsPage() {
    var mount = $('#all-farms');
    if (!mount) return;

    var chips = $('#filters');
    var resultLine = $('#results-line');
    var all = [];
    var active = 'all';

    var params = new URLSearchParams(window.location.search);
    var qType = params.get('type');
    var qProv = params.get('province');
    var qSize = params.get('size');

    function matches(f) {
      if (active !== 'all' && f.farmType !== active) return false;
      if (qProv && qProv !== 'any' && f.province !== qProv) return false;
      if (qType && qType !== 'any' && active === 'all' && f.farmType !== qType) return false;
      if (qSize && qSize !== 'any') {
        var parts = qSize.split('-');
        var min = parseFloat(parts[0]);
        var max = parts[1] === '+' ? Infinity : parseFloat(parts[1]);
        if (!(f.sizeHa >= min && f.sizeHa <= max)) return false;
      }
      return true;
    }

    function render() {
      var list = all.filter(matches);
      if (!list.length) {
        mount.innerHTML = '<div class="farm-empty">' +
          '<h3>No farms match that yet</h3>' +
          '<p>New mandates come on regularly. Clear the filters, or tell us what you are looking for and we will come back to you when it lands.</p>' +
          '<p style="margin-top:1.5rem"><a class="btn btn--ink" href="contact.html">Register your requirement</a></p>' +
        '</div>';
      } else {
        mount.innerHTML = list.map(function (f, i) { return farmCard(f, i < 2); }).join('');
      }
      if (resultLine) {
        resultLine.textContent = list.length + (list.length === 1 ? ' farm' : ' farms') +
          (active === 'all' ? ' currently listed' : ' in ' + active.toLowerCase());
      }
      armReveals(mount);
    }

    loadData().then(function (farms) {
      all = farms;

      if (chips) {
        var types = ['all'].concat(farms.map(function (f) { return f.farmType; })
          .filter(function (v, i, a) { return a.indexOf(v) === i; }));
        chips.innerHTML = types.map(function (t) {
          var on = (qType && qType === t) || (!qType && t === 'all');
          if (on) active = t;
          return '<button type="button" class="filter-btn" data-type="' + esc(t) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
            (t === 'all' ? 'All farms' : esc(t)) + '</button>';
        }).join('');

        chips.addEventListener('click', function (e) {
          var btn = e.target.closest('.filter-btn');
          if (!btn) return;
          active = btn.getAttribute('data-type');
          qType = null;
          $$('.filter-btn', chips).forEach(function (b) {
            b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
          });
          var url = new URL(window.location.href);
          if (active === 'all') url.searchParams.delete('type');
          else url.searchParams.set('type', active);
          history.replaceState(null, '', url);
          render();
        });
      }
      render();
    }).catch(function (err) {
      mount.innerHTML = '<div class="farm-empty"><h3>Listings unavailable</h3><p>' + esc(err.message) + '</p></div>';
    });
  })();

  /* Listing detail -------------------------------------------------------- */
  (function detailPage() {
    var mount = $('#listing-detail');
    if (!mount) return;

    var id = new URLSearchParams(window.location.search).get('id');

    loadData().then(function (farms) {
      var f = farms.filter(function (x) { return x.id === id; })[0] || farms[0];
      if (!f) throw new Error('Listing not found');

      document.title = f.title + ', ' + f.province + ' | ERFDEVCO';
      var crumbNow = $('#crumb-now');
      if (crumbNow) crumbNow.textContent = f.ref;

      var gallery = [f.image].concat(f.gallery || []);
      var galleryHtml = gallery.map(function (src, i) {
        return '<figure><img src="' + esc(src) + '" alt="' + esc(i === 0 ? f.alt : f.title + ', view ' + (i + 1)) + '" ' +
          (i === 0 ? '' : 'loading="lazy" ') + 'decoding="async" /></figure>';
      }).join('');

      var factsHtml = (f.facts || []).map(function (p) {
        return '<div><dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd></div>';
      }).join('');

      var specsHtml = Object.keys(f.specs || {}).map(function (group) {
        var rows = f.specs[group];
        var body = Object.keys(rows).map(function (k) {
          return '<dt>' + esc(k) + '</dt><dd>' + esc(rows[k]) + '</dd>';
        }).join('');
        return '<div class="spec-group reveal"><h3>' + esc(group) + '</h3><dl>' + body + '</dl></div>';
      }).join('');

      mount.innerHTML = '' +
        '<div class="shell">' +
          '<div class="detail-head reveal">' +
            '<div>' +
              '<p class="eyebrow">' + esc(f.ref) + ' &nbsp;/&nbsp; ' + esc(f.farmType) + '</p>' +
              '<h1>' + esc(f.title) + '</h1>' +
              '<p class="lede" style="margin-top:1.25rem">' + esc(f.place) + ', ' + esc(f.province) + '</p>' +
            '</div>' +
            '<div>' +
              '<p class="detail-price">' + esc(f.priceDisplay) + '</p>' +
              '<p class="detail-perha">' + esc(f.perHa) + ' &nbsp;/&nbsp; ' + esc(f.sizeHa) + ' ha</p>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="shell" style="margin-top:clamp(2.5rem,4vw,3.5rem)">' +
          '<div class="gallery reveal">' + galleryHtml + '</div>' +
        '</div>' +

        '<div class="shell" style="margin-top:clamp(2.5rem,4vw,3.5rem)">' +
          '<dl class="factgrid reveal">' + factsHtml + '</dl>' +
        '</div>' +

        '<div class="shell band">' +
          '<div class="split split--wide-left split--top">' +
            '<div class="reveal">' +
              '<p class="eyebrow">The farm</p>' +
              '<h2>About ' + esc(f.title) + '</h2>' +
              '<p class="lede" style="margin-top:1.5rem">' + esc(f.summary) + '</p>' +
              '<p style="margin-top:1.25rem;color:var(--muted);line-height:1.75;max-width:64ch">' + esc(f.description) + '</p>' +
            '</div>' +
            '<div class="reveal">' + enquiryCard(f) + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="band band--stone">' +
          '<div class="shell">' +
            '<div class="section-head reveal">' +
              '<p class="eyebrow">The schedule</p>' +
              '<h2>Every measured fact on this farm</h2>' +
              '<p class="lede">Recorded from the seller mandate against the ERFDEVCO listing schedule. Nothing here is estimated.</p>' +
            '</div>' +
            '<div class="spec-groups">' + specsHtml + '</div>' +
          '</div>' +
        '</div>';

      armReveals(mount);
      wireForms(mount);
    }).catch(function (err) {
      mount.innerHTML = '<div class="shell band"><div class="farm-empty">' +
        '<h3>That listing is not available</h3><p>' + esc(err.message) + '</p>' +
        '<p style="margin-top:1.5rem"><a class="btn btn--ink" href="listings.html">Back to all farms</a></p></div></div>';
    });

    function enquiryCard(f) {
      return '' +
        '<div class="enquiry-card">' +
          '<h3>Enquire on ' + esc(f.ref) + '</h3>' +
          '<p style="margin-top:0.5rem">Ask for the full mandate pack, the title deed extract or a viewing date.</p>' +
          '<form class="form-grid" style="margin-top:1.5rem" data-form="enquiry" data-subject="Enquiry: ' + esc(f.ref) + ', ' + esc(f.title) + '" novalidate>' +
            '<div class="field field--full"><label for="eq-name">Your name</label><input id="eq-name" name="name" type="text" autocomplete="name" required /></div>' +
            '<div class="field field--full"><label for="eq-email">Email</label><input id="eq-email" name="email" type="email" autocomplete="email" required /></div>' +
            '<div class="field field--full"><label for="eq-phone">Phone</label><input id="eq-phone" name="phone" type="tel" autocomplete="tel" /></div>' +
            '<div class="field field--full"><label for="eq-message">Message</label><textarea id="eq-message" name="message" required>I would like more information on ' + esc(f.ref) + '.</textarea></div>' +
            '<div class="hp"><label for="eq-farmname">Farm name</label><input id="eq-farmname" name="farmname" type="text" tabindex="-1" autocomplete="off" /></div>' +
            '<div class="field--full"><button class="btn btn--gold" type="submit">Send enquiry</button></div>' +
            '<p class="form-status field--full" role="status" aria-live="polite"></p>' +
          '</form>' +
          '<div class="agent-line">' +
            '<strong>Martiens Du Plessis</strong>' +
            '<span>Managing Director, MPRE. Registered with the PPRA.</span>' +
            '<a href="tel:+27829005019">082 900 5019</a>' +
            '<a href="mailto:martiens@erfdevco.com">martiens@erfdevco.com</a>' +
          '</div>' +
        '</div>';
    }
  })();

  /* Hero search rail ------------------------------------------------------ */
  (function searchRail() {
    var form = $('#farm-search');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var params = new URLSearchParams();
      ['type', 'province', 'size'].forEach(function (k) {
        var el = form.elements[k];
        if (el && el.value && el.value !== 'any') params.set(k, el.value);
      });
      var qs = params.toString();
      window.location.href = 'listings.html' + (qs ? '?' + qs : '');
    });
  })();

  /* ----------------------------------------------------------------------
     Forms. One handler for every form on the site, injected or static.
     ---------------------------------------------------------------------- */
  function wireForms(root) {
    $$('form[data-form]', root || document).forEach(function (form) {
      if (form.__wired) return;
      form.__wired = true;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var status = $('.form-status', form);
        var btn = $('button[type="submit"]', form);

        var setStatus = function (msg, state) {
          if (!status) return;
          status.textContent = msg;
          if (state) status.setAttribute('data-state', state);
          else status.removeAttribute('data-state');
        };

        // Honeypot: a real person never fills this.
        if (form.elements.farmname && form.elements.farmname.value) {
          setStatus('Thank you, your message has been sent.', 'ok');
          form.reset();
          return;
        }

        if (!form.checkValidity()) {
          setStatus('Please fill in your name, a valid email and a message.', 'error');
          form.reportValidity();
          return;
        }

        var payload = {
          name: (form.elements.name && form.elements.name.value || '').trim(),
          email: (form.elements.email && form.elements.email.value || '').trim(),
          message: (form.elements.message && form.elements.message.value || '').trim(),
          subject: form.getAttribute('data-subject') || 'New enquiry from the ERFDEVCO website'
        };
        var phone = form.elements.phone && form.elements.phone.value;
        if (phone) payload.message = payload.message + '\n\nPhone: ' + phone;

        if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending'; }
        setStatus('Sending your message', null);

        fetch('/api/send-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
          .then(function (data) {
            if (data && data.success) {
              setStatus('Thank you. Your message is with us and we will come back to you.', 'ok');
              form.reset();
            } else {
              setStatus('That did not send. Please email martiens@erfdevco.com or call 082 900 5019.', 'error');
            }
          })
          .catch(function () {
            setStatus('That did not send. Please email martiens@erfdevco.com or call 082 900 5019.', 'error');
          })
          .then(function () {
            if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Send'; }
          });
      });
    });
  }

  /* Re-arm reveals inside content injected after first paint. */
  function armReveals(root) {
    var items = $$('.reveal', root);
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
      });
    }, 60);
    setTimeout(function () { items.forEach(function (el) { el.classList.add('is-visible'); }); }, 2600);
  }

  wireForms(document);

  /* Stagger reveals inside any group that asks for it. */
  $$('[data-stagger]').forEach(function (group) {
    $$('.reveal', group).forEach(function (el, i) {
      el.style.setProperty('--reveal-delay', (i * 70) + 'ms');
    });
  });

  /* Year in the footer */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
