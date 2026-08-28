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

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  // South African convention: a space, not a comma, between thousands.
  function thousands(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function monthYear(iso) {
    if (!iso) return '';
    var p = String(iso).split('-');
    var m = parseInt(p[1], 10);
    if (!p[0] || isNaN(m)) return '';
    return MONTHS[m - 1] + ' ' + p[0];
  }

  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 20.5S3.8 15.4 3.8 9.7A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.2 3.1c0 5.7-8.2 10.8-8.2 10.8Z"/></svg>';

  /* ----------------------------------------------------------------------
     Shortlist. Lives in this browser only, never leaves the device.
     ---------------------------------------------------------------------- */
  var STORE_KEY = 'erfdevco:shortlist';

  function shortlist() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function setShortlist(ids) {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(ids)); } catch (e) { /* private mode */ }
    document.dispatchEvent(new CustomEvent('erf:shortlist'));
  }

  function isSaved(id) { return shortlist().indexOf(id) !== -1; }

  function toggleSaved(id) {
    var ids = shortlist();
    var i = ids.indexOf(id);
    if (i === -1) ids.push(id); else ids.splice(i, 1);
    setShortlist(ids);
    return i === -1;
  }

  function saveButton(f, inline) {
    var on = isSaved(f.id);
    return '<button type="button" class="save-btn' + (inline ? ' save-btn--inline' : '') + '"' +
      ' data-save="' + esc(f.id) + '" aria-pressed="' + (on ? 'true' : 'false') + '"' +
      ' aria-label="' + (on ? 'Remove ' : 'Save ') + esc(f.title) + ' to your shortlist"' +
      ' title="' + (on ? 'Saved to your shortlist' : 'Save to your shortlist') + '">' +
      HEART + (inline ? '<span class="save-label">' + (on ? 'Saved' : 'Save this farm') + '</span>' : '') +
      '</button>';
  }

  // One delegated handler covers every save button on the page, injected or not.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-save]');
    if (!btn) return;
    e.preventDefault();
    var on = toggleSaved(btn.getAttribute('data-save'));
    $$('[data-save="' + btn.getAttribute('data-save') + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('title', on ? 'Saved to your shortlist' : 'Save to your shortlist');
      var lab = $('.save-label', b);
      if (lab) lab.textContent = on ? 'Saved' : 'Save this farm';
    });
  });

  function farmCard(f, eager) {
    var meta = (f.facts || []).slice(0, 3).map(function (pair) {
      return '<span><b>' + esc(pair[0]) + '</b> ' + esc(pair[1]).toLowerCase() + '</span>';
    }).join('');
    var isNew = f.status === 'New listing';
    var facts = f.factCount
      ? '<span class="farm-card__facts">' + f.factCount + ' facts recorded</span>' : '';

    return '' +
      '<article class="farm-card reveal">' +
        '<div class="farm-card__media">' +
          '<a href="listing.html?id=' + encodeURIComponent(f.id) + '" aria-label="' + esc(f.title) + ', ' + esc(f.place) + '">' +
            '<img src="' + esc(f.image) + '" alt="' + esc(f.alt) + '" ' + (eager ? '' : 'loading="lazy" ') + 'decoding="async" width="1200" height="900" />' +
          '</a>' +
          '<span class="farm-card__ref">' + esc(f.ref) + '</span>' +
          '<span class="farm-card__type">' + esc(f.farmType) + '</span>' +
          '<span class="farm-card__status"' + (isNew ? ' data-new' : '') + '>' + esc(f.status || 'For sale') + '</span>' +
          saveButton(f, false) +
        '</div>' +
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
            facts +
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

    var sortSel = $('#sort-by');
    var savedOnly = false;

    function matches(f) {
      if (savedOnly && !isSaved(f.id)) return false;
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

    var SORTS = {
      newest: function (a, b) { return String(b.listedOn || '').localeCompare(String(a.listedOn || '')); },
      'price-asc': function (a, b) { return a.price - b.price; },
      'price-desc': function (a, b) { return b.price - a.price; },
      'size-desc': function (a, b) { return b.sizeHa - a.sizeHa; },
      'size-asc': function (a, b) { return a.sizeHa - b.sizeHa; }
    };

    function render() {
      var list = all.filter(matches);
      var mode = (sortSel && sortSel.value) || 'newest';
      if (SORTS[mode]) list = list.slice().sort(SORTS[mode]);

      if (!list.length) {
        mount.innerHTML = '<div class="farm-empty">' +
          '<h3>' + (savedOnly ? 'Nothing shortlisted yet' : 'No farms match that yet') + '</h3>' +
          '<p>' + (savedOnly
            ? 'Tap the heart on any farm to keep it here. Your shortlist stays on this device.'
            : 'New mandates come on regularly. Clear the filters, or tell us what you are looking for and we will come back to you when it lands.') + '</p>' +
          '<p style="margin-top:1.5rem"><a class="btn btn--ink" href="contact.html">Register your requirement</a></p>' +
        '</div>';
      } else {
        mount.innerHTML = list.map(function (f, i) { return farmCard(f, i < 2); }).join('');
      }
      if (resultLine) {
        resultLine.textContent = savedOnly
          ? list.length + (list.length === 1 ? ' farm' : ' farms') + ' on your shortlist'
          : list.length + (list.length === 1 ? ' farm' : ' farms') +
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
        }).join('') +
        '<button type="button" class="filter-btn" data-saved aria-pressed="false">' +
          'Shortlist <span class="chip-n" data-shortlist-count>0</span></button>';

        chips.addEventListener('click', function (e) {
          var btn = e.target.closest('.filter-btn');
          if (!btn) return;
          var url = new URL(window.location.href);

          if (btn.hasAttribute('data-saved')) {
            savedOnly = btn.getAttribute('aria-pressed') !== 'true';
            $$('.filter-btn', chips).forEach(function (b) {
              b.setAttribute('aria-pressed', b === btn && savedOnly ? 'true' : 'false');
            });
            if (!savedOnly) $('.filter-btn[data-type="all"]', chips).setAttribute('aria-pressed', 'true');
            if (savedOnly) { active = 'all'; qType = null; qProv = null; qSize = null; }
            url.searchParams.delete('type');
            history.replaceState(null, '', url);
            render();
            return;
          }

          savedOnly = false;
          active = btn.getAttribute('data-type');
          qType = null;
          $$('.filter-btn', chips).forEach(function (b) {
            b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
          });
          if (active === 'all') url.searchParams.delete('type');
          else url.searchParams.set('type', active);
          history.replaceState(null, '', url);
          render();
        });
      }

      if (sortSel) sortSel.addEventListener('change', render);

      // Un-saving from inside a shortlist view should drop the card immediately.
      document.addEventListener('erf:shortlist', function () { if (savedOnly) render(); });

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
        return '<figure data-lb="' + i + '"><img src="' + esc(src) + '" alt="' + esc(i === 0 ? f.alt : f.title + ', view ' + (i + 1)) + '" ' +
          (i === 0 ? '' : 'loading="lazy" ') + 'decoding="async" /></figure>';
      }).join('');

      var factsHtml = (f.facts || []).map(function (p) {
        return '<div><dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd></div>';
      }).join('');

      var groupNames = Object.keys(f.specs || {});
      var specsHtml = groupNames.map(function (group, i) {
        var rows = f.specs[group];
        var body = Object.keys(rows).map(function (k) {
          return '<dt>' + esc(k) + '</dt><dd>' + esc(rows[k]) + '</dd>';
        }).join('');
        return '<div class="spec-group" data-group="' + i + '"' + (i === 0 ? '' : ' hidden') + '>' +
          '<h3>' + esc(group) + '</h3><dl>' + body + '</dl></div>';
      }).join('');

      var tabsHtml = groupNames.map(function (group, i) {
        return '<button type="button" class="spec-tab" role="tab" data-group="' + i + '"' +
          ' aria-selected="' + (i === 0 ? 'true' : 'false') + '">' + esc(group) +
          '<span class="c">' + Object.keys(f.specs[group]).length + '</span></button>';
      }).join('') +
      '<button type="button" class="spec-tab" role="tab" data-group="all" aria-selected="false">All sections' +
        '<span class="c">' + (f.factCount || '') + '</span></button>';

      var waText = encodeURIComponent(
        'Hello Martiens, I am enquiring about ' + f.ref + ', ' + f.title + ' (' + f.priceDisplay + ') on erfdevco.com.');

      mount.innerHTML = '' +
        '<div class="shell">' +
          '<div class="detail-head reveal">' +
            '<div>' +
              '<p class="eyebrow">' + esc(f.ref) + ' &nbsp;/&nbsp; ' + esc(f.farmType) + '</p>' +
              '<h1>' + esc(f.title) + '</h1>' +
              '<p class="lede" style="margin-top:1.25rem">' + esc(f.place) + ', ' + esc(f.province) + '</p>' +
              '<p class="detail-meta">' +
                '<span><b>' + esc(f.status || 'For sale') + '</b></span>' +
                '<span>On the market since <b>' + esc(monthYear(f.listedOn)) + '</b></span>' +
                '<span><b>' + (f.factCount || 0) + '</b> measured facts on file</span>' +
              '</p>' +
              '<div class="detail-actions">' +
                saveButton(f, true) +
                '<a class="btn btn--outline" href="https://wa.me/27829005019?text=' + waText + '" rel="noopener">WhatsApp about ' + esc(f.ref) + '</a>' +
                '<button type="button" class="btn btn--outline" data-print>Print the schedule</button>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<p class="detail-price">' + esc(f.priceDisplay) + '</p>' +
              '<p class="detail-perha">' + esc(f.perHa) + ' &nbsp;/&nbsp; ' + esc(thousands(f.sizeHa)) + ' ha</p>' +
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
            '<div class="schedule-meter reveal">' +
              '<b>' + (f.factCount || 0) + ' measured facts</b>' +
              '<span>across ' + (f.sectionCount || 0) + ' of the 18 schedule sections</span>' +
              '<span>Sections that cannot apply to a ' + esc(String(f.farmType).toLowerCase()) + ' are left out rather than filled in.</span>' +
            '</div>' +
            '<div class="schedule-layout">' +
              '<div class="spec-tabs" role="tablist" aria-label="Schedule sections">' + tabsHtml + '</div>' +
              '<div class="spec-groups is-single">' + specsHtml + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      armReveals(mount);
      wireForms(mount);
      wireSpecTabs(mount);
      wireLightbox(mount, gallery, f);

      var printBtn = $('[data-print]', mount);
      if (printBtn) printBtn.addEventListener('click', function () {
        // Print shows every section regardless of the open tab (see @media print).
        window.print();
      });
    }).catch(function (err) {
      mount.innerHTML = '<div class="shell band"><div class="farm-empty">' +
        '<h3>That listing is not available</h3><p>' + esc(err.message) + '</p>' +
        '<p style="margin-top:1.5rem"><a class="btn btn--ink" href="listings.html">Back to all farms</a></p></div></div>';
    });

    /* One schedule section at a time, or all of them. Keyboard: arrows move
       between tabs the way a real tablist does. */
    function wireSpecTabs(root) {
      var list = $('.spec-tabs', root);
      var wrap = $('.spec-groups', root);
      if (!list || !wrap) return;
      var tabs = $$('.spec-tab', list);
      var groups = $$('.spec-group', wrap);

      function select(tab) {
        var key = tab.getAttribute('data-group');
        tabs.forEach(function (t) { t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
        groups.forEach(function (g) {
          g.hidden = !(key === 'all' || g.getAttribute('data-group') === key);
        });
        wrap.classList.toggle('is-single', key !== 'all');
      }

      list.addEventListener('click', function (e) {
        var tab = e.target.closest('.spec-tab');
        if (tab) select(tab);
      });

      list.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(document.activeElement);
        if (i === -1) return;
        var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
        if (next === -1) return;
        e.preventDefault();
        var t = tabs[(next + tabs.length) % tabs.length];
        t.focus();
        select(t);
      });
    }

    /* Gallery lightbox. Built once, on first use. */
    function wireLightbox(root, srcs, farm) {
      var figures = $$('.gallery figure', root);
      if (!figures.length) return;
      var box = null, imgEl = null, countEl = null, at = 0, lastFocus = null;

      function build() {
        box = document.createElement('div');
        box.className = 'lightbox';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-label', farm.title + ', photographs');
        box.hidden = true;
        box.innerHTML =
          '<button type="button" class="lb-btn lb-close" aria-label="Close">&times;</button>' +
          '<button type="button" class="lb-btn lb-prev" aria-label="Previous photograph">&#8249;</button>' +
          '<img alt="" />' +
          '<button type="button" class="lb-btn lb-next" aria-label="Next photograph">&#8250;</button>' +
          '<p class="lb-count"></p>';
        document.body.appendChild(box);
        imgEl = $('img', box);
        countEl = $('.lb-count', box);
        $('.lb-close', box).addEventListener('click', close);
        $('.lb-prev', box).addEventListener('click', function () { go(-1); });
        $('.lb-next', box).addEventListener('click', function () { go(1); });
        box.addEventListener('click', function (e) { if (e.target === box) close(); });
      }

      function show(i) {
        at = (i + srcs.length) % srcs.length;
        imgEl.src = srcs[at];
        imgEl.alt = farm.title + ', photograph ' + (at + 1) + ' of ' + srcs.length;
        countEl.textContent = (at + 1) + ' / ' + srcs.length;
      }

      function go(d) { show(at + d); }

      function open(i) {
        if (!box) build();
        lastFocus = document.activeElement;
        box.hidden = false;
        show(i);
        requestAnimationFrame(function () { box.classList.add('is-open'); });
        $('.lb-close', box).focus();
        document.addEventListener('keydown', onKey);
      }

      function close() {
        if (!box) return;
        box.classList.remove('is-open');
        document.removeEventListener('keydown', onKey);
        setTimeout(function () { box.hidden = true; }, 260);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }

      function onKey(e) {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') go(1);
        else if (e.key === 'ArrowLeft') go(-1);
        else if (e.key === 'Tab') { e.preventDefault(); $('.lb-close', box).focus(); }
      }

      figures.forEach(function (fig, i) {
        fig.setAttribute('tabindex', '0');
        fig.setAttribute('role', 'button');
        fig.setAttribute('aria-label', 'Open photograph ' + (i + 1) + ' full size');
        fig.addEventListener('click', function () { open(i); });
        fig.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
        });
      });
    }

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
            '<span>Managing Director. Registered with the PPRA.</span>' +
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

  /* Keep every shortlist counter on the page in step with the store. */
  (function shortlistCount() {
    var sync = function () {
      var n = shortlist().length;
      $$('[data-shortlist-count]').forEach(function (el) { el.textContent = String(n); });
    };
    document.addEventListener('erf:shortlist', sync);
    // Counters can be injected after this runs, so sync again on the next frame.
    sync();
    setTimeout(sync, 400);
    setTimeout(sync, 1500);
  })();
})();
