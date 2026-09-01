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
      if (el.dataset.ran) return;
      el.dataset.ran = '1';
      var start = null;
      var dur = 1300;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = String(target);
      };
      requestAnimationFrame(step);
      // A throttled tab can strand rAF part way. The number is the content,
      // the count is decoration, so land it regardless.
      setTimeout(function () { el.textContent = String(target); }, dur + 400);
    };

    if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
    setTimeout(function () {
      nodes.forEach(function (n) {
        var t = n.getAttribute('data-count');
        if (t && n.textContent !== t) n.textContent = t;
      });
    }, 4000);
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

  /* ----------------------------------------------------------------------
     Responsive images. Cards render around 370 to 750 CSS pixels, so serving
     the full file to a phone wastes most of the download. Variants are on
     disk as name-480w.jpg and so on; widths come from data/img-widths.json.
     ---------------------------------------------------------------------- */
  var IMG_W = null;
  var VARIANTS = [480, 800, 1200];

  fetch('data/img-widths.json', { cache: 'force-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (m) {
      if (!m) return;
      IMG_W = m;
      // Anything already rendered gets upgraded in place.
      $$('img[data-responsive]').forEach(function (img) {
        var a = srcAttrs(img.getAttribute('src'), img.getAttribute('sizes') || '100vw');
        if (a.srcset) img.setAttribute('srcset', a.srcset);
      });
    })
    .catch(function () { /* full-size images still work */ });

  function srcAttrs(src, sizes) {
    var file = String(src).split('/').pop();
    if (!IMG_W || !IMG_W[file]) return { srcset: '', sizes: sizes };
    var base = file.replace(/\.jpg$/i, '');
    var w = IMG_W[file];
    var parts = VARIANTS.filter(function (v) { return v < w; })
      .map(function (v) { return 'assets/' + base + '-' + v + 'w.jpg ' + v + 'w'; });
    parts.push('assets/' + file + ' ' + w + 'w');
    return { srcset: parts.join(', '), sizes: sizes };
  }

  function imgTag(src, alt, sizes, opts) {
    opts = opts || {};
    var a = srcAttrs(src, sizes);
    return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" data-responsive' +
      (a.srcset ? ' srcset="' + esc(a.srcset) + '"' : '') +
      ' sizes="' + esc(sizes) + '"' +
      (opts.eager ? ' fetchpriority="high"' : ' loading="lazy"') +
      ' decoding="async"' +
      (opts.wh ? ' width="1200" height="900"' : '') + ' />';
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

  var liveRegion = null;
  function announce(msg) {
    if (!liveRegion) {
      liveRegion = document.createElement('p');
      liveRegion.className = 'visually-hidden';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = msg;
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

  /* ----------------------------------------------------------------------
     Compare. Up to three farms held side by side. Only possible because
     every listing answers the same schedule.
     ---------------------------------------------------------------------- */
  var CMP_KEY = 'erfdevco:compare';
  var CMP_MAX = 3;

  function compareList() {
    try {
      var raw = window.localStorage.getItem(CMP_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0, CMP_MAX) : [];
    } catch (e) { return []; }
  }

  function setCompare(ids) {
    try { window.localStorage.setItem(CMP_KEY, JSON.stringify(ids.slice(0, CMP_MAX))); } catch (e) {}
    document.dispatchEvent(new CustomEvent('erf:compare'));
  }

  function inCompare(id) { return compareList().indexOf(id) !== -1; }

  function toggleCompare(id) {
    var ids = compareList();
    var i = ids.indexOf(id);
    if (i !== -1) { ids.splice(i, 1); setCompare(ids); return false; }
    if (ids.length >= CMP_MAX) return null;      // full
    ids.push(id); setCompare(ids); return true;
  }

  function compareToggle(f) {
    var on = inCompare(f.id);
    return '<button type="button" class="cmp-toggle" data-cmp="' + esc(f.id) + '"' +
      ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<span class="box" aria-hidden="true"></span>Compare</button>';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-cmp]');
    if (!btn) return;
    e.preventDefault();
    var res = toggleCompare(btn.getAttribute('data-cmp'));
    if (res === null) {                           // already holding three
      announce('You can compare three farms at a time. Remove one first.');
      return;
    }
    $$('[data-cmp="' + btn.getAttribute('data-cmp') + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', res ? 'true' : 'false');
    });
  });

  function farmCard(f, eager) {
    // Value first, label under it. These are the numbers that sell the farm,
    // so they read as figures rather than as a grey sentence.
    var meta = (f.facts || []).slice(0, 3).map(function (pair) {
      return '<span><b>' + esc(pair[0]) + '</b><i>' + esc(pair[1]) + '</i></span>';
    }).join('');
    var isNew = f.status === 'New listing';
    var facts = f.factCount
      ? '<span class="farm-card__facts">' + f.factCount + ' facts on file</span>' : '';

    return '' +
      '<article class="farm-card reveal">' +
        '<div class="farm-card__media">' +
          '<a href="listing.html?id=' + encodeURIComponent(f.id) + '" aria-label="' + esc(f.title) + ', ' + esc(f.place) + '">' +
            imgTag(f.image, f.alt, '(max-width:640px) 92vw, (max-width:1100px) 46vw, 31vw', { eager: eager, wh: true }) +
          '</a>' +
          '<span class="farm-card__ref">' + esc(f.ref) + '</span>' +
          '<span class="farm-card__type">' + esc(f.farmType) + '</span>' +
          (f.status && f.status.toLowerCase() !== 'for sale'
            ? '<span class="farm-card__status"' + (isNew ? ' data-new' : '') + '>' + esc(f.status) + '</span>' : '') +
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
          '</div>' +
          '<div class="farm-card__foot farm-card__foot--sub">' +
            compareToggle(f) + facts +
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

  /* Home: pins on the country band ---------------------------------------- */
  function paintCountryPins(farms) {
    var g = $('[data-map-pins]');
    if (!g) return;
    g.innerHTML = farms.filter(function (f) { return f.mapXY; }).map(function (f) {
      return '<g transform="translate(' + f.mapXY[0] + ',' + f.mapXY[1] + ')">' +
        '<circle class="halo" r="18"></circle><circle class="dot" r="8"></circle></g>';
    }).join('');
  }

  /* Home: featured farms ------------------------------------------------- */
  (function homeFarms() {
    var mount = $('#featured-farms');
    if (!mount) return;
    loadData().then(function (farms) {
      var limit = parseInt(mount.getAttribute('data-limit') || '4', 10);
      // The home page shows what came on most recently, not file order.
      var list = farms.slice().sort(function (a, b) {
        return String(b.listedOn || '').localeCompare(String(a.listedOn || ''));
      }).slice(0, limit);
      mount.innerHTML = list.map(function (f, i) { return farmCard(f, i === 0); }).join('');
      paintCountryPins(farms);
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
    var priceSel = $('#price-band');
    var extentSel = $('#extent-band');
    var clearBtn = $('#clear-filters');
    var searchBox = $('#farm-q');
    var savedOnly = false;
    var query = '';
    var mapApi = null;

    // Free text across the fields a buyer would actually type into.
    function hay(f) {
      return [f.title, f.place, f.province, f.farmType, f.ref, f.summary]
        .join(' ').toLowerCase();
    }

    function inBand(value, band) {
      if (!band || band === 'any') return true;
      var p = band.split('-');
      var min = parseFloat(p[0]);
      var max = p[1] === '+' ? Infinity : parseFloat(p[1]);
      return value >= min && value <= max;
    }

    function matches(f) {
      if (query && hay(f).indexOf(query) === -1) return false;
      if (priceSel && !inBand(f.price, priceSel.value)) return false;
      if (extentSel && !inBand(f.sizeHa, extentSel.value)) return false;
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
          '<h3>' + (savedOnly ? 'Nothing shortlisted yet'
            : (active !== 'all' ? 'No ' + esc(active.toLowerCase()) + 's on the books right now'
            : 'No farms match that yet')) + '</h3>' +
          '<p>' + (savedOnly
            ? 'Tap the heart on any farm to keep it here. Your shortlist stays on this device.'
            : 'We take mandates on every farm type, and this one is simply not on the books today. Register what you are after and we will call you when it comes on.') + '</p>' +
          '<p style="margin-top:1.5rem"><a class="btn btn--ink" href="contact.html">Register your requirement</a></p>' +
        '</div>';
      } else {
        mount.innerHTML = list.map(function (f, i) { return farmCard(f, i < 3); }).join('');
      }
      if (resultLine) {
        var n = list.length + (list.length === 1 ? ' farm' : ' farms');
        if (savedOnly) resultLine.textContent = n + ' on your shortlist';
        else if (query) resultLine.textContent = n + ' matching "' + query + '"';
        else if ((priceSel && priceSel.value !== 'any') || (extentSel && extentSel.value !== 'any') || qProv)
          resultLine.textContent = n + ' matching your filters';
        // "0 farms in poultry farm" is not a sentence. The type keeps its
        // own capitals because it is a category name, not a noun phrase.
        else if (active !== 'all') resultLine.textContent = n + ' under ' + active;
        else if (qType && qType !== 'any') resultLine.textContent = n + ' under ' + qType;
        else resultLine.textContent = n + ' currently listed';
      }
      armReveals(mount);
      if (mapApi) mapApi.sync(list, qProv);
      if (clearBtn) {
        var on = !!(query || savedOnly || active !== 'all' || qProv || qSize ||
          (priceSel && priceSel.value !== 'any') || (extentSel && extentSel.value !== 'any'));
        clearBtn.hidden = !on;
      }
    }

    loadData().then(function (farms) {
      all = farms;
      buildMap(farms);

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

      [sortSel, priceSel, extentSel].forEach(function (el) {
        if (el) el.addEventListener('change', render);
      });

      if (clearBtn) clearBtn.addEventListener('click', function () {
        query = ''; savedOnly = false; active = 'all';
        qType = qProv = qSize = null;
        if (searchBox) searchBox.value = '';
        if (priceSel) priceSel.value = 'any';
        if (extentSel) extentSel.value = 'any';
        $$('.filter-btn', chips).forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-type') === 'all' ? 'true' : 'false');
        });
        history.replaceState(null, '', window.location.pathname);
        render();
      });

      if (searchBox) {
        var t = null;
        searchBox.addEventListener('input', function () {
          clearTimeout(t);
          t = setTimeout(function () {
            query = searchBox.value.trim().toLowerCase();
            savedOnly = false;
            render();
          }, 160);
        });
        // A search box that cannot be cleared with Escape is a nuisance.
        searchBox.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && searchBox.value) {
            searchBox.value = ''; query = ''; render();
          }
        });
      }

      // Un-saving from inside a shortlist view should drop the card immediately.
      document.addEventListener('erf:shortlist', function () { if (savedOnly) render(); });

      render();
    }).catch(function (err) {
      mount.innerHTML = '<div class="farm-empty"><h3>Listings unavailable</h3><p>' + esc(err.message) + '</p></div>';
    });

    /* ------------------------------------------------------------------
       Map search. Province outlines from Natural Earth, farms pinned at
       their district. The map is a control, not a picture.
       ------------------------------------------------------------------ */
    function buildMap(farms) {
      var host = $('#farm-map');
      if (!host) return;

      fetch('data/za-provinces.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('map ' + r.status); return r.json(); })
        .then(function (geo) {
          var slugOf = {};
          Object.keys(geo.names).forEach(function (s) { slugOf[geo.names[s]] = s; });

          var counts = {};
          farms.forEach(function (f) {
            var s = slugOf[f.province];
            if (s) counts[s] = (counts[s] || 0) + 1;
          });

          var paths = Object.keys(geo.paths).map(function (s) {
            var n = counts[s] || 0;
            return '<path class="prov' + (n ? ' has-farms' : '') + '" data-prov="' + s + '" d="' + geo.paths[s] + '">' +
              '<title>' + esc(geo.names[s]) + (n ? ', ' + n + (n === 1 ? ' farm' : ' farms') : ', no farms listed') + '</title></path>';
          }).join('');

          var pins = farms.filter(function (f) { return f.mapXY; }).map(function (f) {
            return '<g class="pin" data-id="' + esc(f.id) + '" tabindex="0" role="link"' +
              ' aria-label="' + esc(f.title) + ', ' + esc(f.place) + ', ' + esc(f.priceDisplay) + '"' +
              ' transform="translate(' + f.mapXY[0] + ',' + f.mapXY[1] + ')">' +
              '<circle class="halo" r="18"></circle><circle class="dot" r="8"></circle></g>';
          }).join('');

          host.innerHTML =
            '<div class="mapfig">' +
              '<svg viewBox="' + geo.viewBox + '" role="group" aria-label="Map of South Africa showing where the listed farms are">' +
                '<g class="provs">' + paths + '</g><g class="pins">' + pins + '</g>' +
              '</svg>' +
              '<div class="maptip" aria-hidden="true"></div>' +
            '</div>' +
            '<div>' +
              '<div class="maphead">' +
                '<h2>Where the farms are</h2>' +
                (function () {
                  var provWith = Object.keys(counts).length;
                  var words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
                  return '<p>' + farms.length + ' farms on the books in ' +
                    (provWith === 9 ? 'all nine' : words[provWith] || provWith) +
                    (provWith === 1 ? ' province' : ' provinces') +
                    '. Pick a province to narrow the list, or tap a pin to open the farm.</p>';
                })() +
              '</div>' +
              '<div class="provlist">' +
                Object.keys(geo.names)
                  .filter(function (s) { return counts[s]; })
                  .sort(function (a, b) {
                    return counts[b] - counts[a] || geo.names[a].localeCompare(geo.names[b]);
                  }).map(function (s) {
                    return '<button type="button" data-prov="' + s + '" aria-pressed="false">' +
                      esc(geo.names[s]) + '<span class="n">' + counts[s] + '</span></button>';
                  }).join('') +
              '</div>' +
              (function () {
                // Empty provinces are a fact, not nine dead rows.
                var empty = Object.keys(geo.names).filter(function (s) { return !counts[s]; })
                  .map(function (s) { return geo.names[s]; });
                // A buyer looking at a province with nothing in it is the
                // person most worth capturing, so the note carries an action
                // rather than ending the page in a dead corner.
                return empty.length
                  ? '<p class="provlist-note">Nothing listed in ' + esc(empty.join(' or ')) +
                    ' at the moment. Tell us what you are looking for and we will call when it comes on.</p>' +
                    '<p class="provlist-act"><a class="btn btn--outline" href="contact.html?subject=requirement">' +
                    'Register a requirement</a></p>'
                  : '';
              })() +
            '</div>';

          var tip = $('.maptip', host);
          var byId = {};
          farms.forEach(function (f) { byId[f.id] = f; });

          function showTip(g) {
            var f = byId[g.getAttribute('data-id')];
            if (!f) return;
            var fig = $('.mapfig', host);
            var r = g.getBoundingClientRect(), fr = fig.getBoundingClientRect();
            tip.innerHTML = '<span class="r">' + esc(f.ref) + '</span>' +
              '<span class="t">' + esc(f.title) + '</span>' +
              '<span class="p">' + esc(f.place) + ' &middot; ' + esc(f.priceDisplay) + '</span>';
            tip.style.left = (r.left - fr.left + r.width / 2) + 'px';
            tip.style.top = (r.top - fr.top) + 'px';
            tip.classList.add('is-on');
          }
          function hideTip() { tip.classList.remove('is-on'); }

          function setProvince(slug) {
            qProv = slug ? geo.names[slug] : null;
            savedOnly = false;
            var url = new URL(window.location.href);
            if (qProv) url.searchParams.set('province', qProv);
            else url.searchParams.delete('province');
            history.replaceState(null, '', url);
            render();
          }

          host.addEventListener('click', function (e) {
            var pin = e.target.closest('.pin');
            if (pin) { window.location.href = 'listing.html?id=' + encodeURIComponent(pin.getAttribute('data-id')); return; }
            var p = e.target.closest('[data-prov]');
            if (!p || p.hasAttribute('disabled') || (p.tagName === 'path' && !p.classList.contains('has-farms'))) return;
            var slug = p.getAttribute('data-prov');
            setProvince(qProv === geo.names[slug] ? null : slug);
          });

          host.addEventListener('mouseover', function (e) {
            var pin = e.target.closest('.pin');
            if (pin) showTip(pin);
          });
          host.addEventListener('mouseout', function (e) {
            if (e.target.closest('.pin')) hideTip();
          });
          host.addEventListener('focusin', function (e) {
            var pin = e.target.closest('.pin');
            if (pin) showTip(pin);
          });
          host.addEventListener('focusout', hideTip);
          host.addEventListener('keydown', function (e) {
            var pin = e.target.closest('.pin');
            if (pin && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              window.location.href = 'listing.html?id=' + encodeURIComponent(pin.getAttribute('data-id'));
            }
          });

          mapApi = {
            sync: function (visible, provName) {
              var live = {};
              visible.forEach(function (f) { live[f.id] = 1; });
              $$('.pin', host).forEach(function (g) {
                g.classList.toggle('is-dim', !live[g.getAttribute('data-id')]);
              });
              var slug = provName ? slugOf[provName] : null;
              $$('[data-prov]', host).forEach(function (el) {
                var on = slug && el.getAttribute('data-prov') === slug;
                if (el.tagName === 'path') el.classList.toggle('is-active', !!on);
                else el.setAttribute('aria-pressed', on ? 'true' : 'false');
              });
            }
          };
          render();
        })
        .catch(function () {
          // A map that will not load must not take the listings with it.
          host.closest('.mapbox') && host.closest('.mapbox').remove();
        });
    }
  })();

  /* Listing detail -------------------------------------------------------- */
  (function detailPage() {
    var mount = $('#listing-detail');
    if (!mount) return;

    // A wrong id is a stale link and must say so. A single-page bundle (the
    // design preview) has no query string at all, so it names a default.
    var id = new URLSearchParams(window.location.search).get('id') || window.__ERF_DEFAULT_ID;

    loadData().then(function (farms) {
      var f = farms.filter(function (x) { return x.id === id; })[0];
      if (!f) {
        var meta = document.querySelector('meta[name="robots"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'robots';
          document.head.appendChild(meta);
        }
        meta.content = 'noindex, follow';
        throw new Error(id
          ? 'That farm is no longer listed. It may have sold, or the link may be out of date.'
          : 'No farm was requested.');
      }

      setHead(f);
      var crumbNow = $('#crumb-now');
      // The name, not the raw ref: a crumb is for a person, and the ref
      // wrapped mid-token at phone widths.
      if (crumbNow) crumbNow.textContent = f.title;

      var gallery = [f.image].concat(f.gallery || []);
      var galleryHtml = gallery.map(function (src, i) {
        return '<figure data-lb="' + i + '">' +
          imgTag(src, i === 0 ? f.alt : f.title + ', view ' + (i + 1),
                 i === 0 ? '(max-width:1100px) 96vw, 92vw' : '(max-width:640px) 92vw, 30vw',
                 { eager: i === 0 }) + '</figure>';
      }).join('');

      var headline = (f.facts || []).slice(0, 3);
      var factsHtml = (f.facts || []).slice(3).map(function (p) {
        return '<div><dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd></div>';
      }).join('');

      var groupNames = Object.keys(f.specs || {});
      var specsHtml = groupNames.map(function (group, i) {
        var rows = f.specs[group];
        var body = Object.keys(rows).map(function (k) {
          return '<dt>' + esc(k) + '</dt><dd>' + esc(rows[k]) + '</dd>';
        }).join('');
        return '<div class="spec-group" data-group="' + i + '" role="tabpanel" tabindex="0"' +
          ' id="specpanel-' + i + '" aria-labelledby="spectab-' + i + '"' + (i === 0 ? '' : ' hidden') + '>' +
          '<h3>' + esc(group) + '</h3><dl>' + body + '</dl></div>';
      }).join('');

      var tabsHtml = groupNames.map(function (group, i) {
        return '<button type="button" class="spec-tab" role="tab" data-group="' + i + '"' +
          ' id="spectab-' + i + '" aria-controls="specpanel-' + i + '"' +
          ' tabindex="' + (i === 0 ? '0' : '-1') + '"' +
          ' aria-selected="' + (i === 0 ? 'true' : 'false') + '">' + esc(group) +
          '<span class="c">' + Object.keys(f.specs[group]).length + '</span></button>';
      }).join('') +
      '<button type="button" class="spec-tab" role="tab" data-group="all" tabindex="-1" aria-selected="false">All sections' +
        '<span class="c">' + (f.factCount || '') + '</span></button>';

      var waText = encodeURIComponent(
        'Hello Martiens, I am enquiring about ' + f.ref + ', ' + f.title + ' (' + f.priceDisplay + ') on erfdevco.com.');

      var html = '' +
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
                '<a class="btn btn--outline" href="https://wa.me/27829005019?text=' + waText + '" rel="noopener">WhatsApp Martiens</a>' +
                '<button type="button" class="btn btn--outline" data-print>Print schedule</button>' +
                '<button type="button" class="btn btn--outline" data-share>Share</button>' +
              '</div>' +
            '</div>' +
            '<div class="detail-price-block">' +
              '<p class="detail-price">' + esc(f.priceDisplay) + '</p>' +
              '<p class="detail-perha">' + esc(f.perHa) + ' &nbsp;/&nbsp; ' + esc(thousands(f.sizeHa)) + ' ha</p>' +
            '</div>' +
          '</div>' +
        '</div>';

      html += '' +
        '<div class="shell" style="margin-top:clamp(1.75rem,3vw,2.5rem)">' +
          '<dl class="headline-facts reveal">' +
            headline.map(function (p) {
              return '<div><dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd></div>';
            }).join('') +
          '</dl>' +
        '</div>' +

        '<nav class="jumpnav" aria-label="On this page"><div class="shell jumpnav__inner">' +
          '<a href="#photos">Photos</a>' +
          '<a href="#about-farm">About</a>' +
          '<a href="#schedule">Schedule</a>' +
          '<a href="#bond">Bond</a>' +
          '<a href="#similar-farms">Similar</a>' +
          '<a class="jumpnav__cta" href="#enquire">Enquire</a>' +
        '</div></nav>' +

        '<div class="shell" id="photos" style="margin-top:clamp(2.5rem,4vw,3.5rem)">' +
          '<div class="gallery reveal">' + galleryHtml + '</div>' +
        '</div>' +

        '<div class="shell" style="margin-top:clamp(2.5rem,4vw,3.5rem)">' +
          '<dl class="factgrid factgrid--rest reveal">' + factsHtml + '</dl>' +
        '</div>' +

        '<div class="shell band" id="about-farm">' +
          '<div class="split split--wide-left split--top">' +
            '<div class="reveal">' +
                            '<h2>About ' + esc(f.title) + '</h2>' +
              '<p class="lede" style="margin-top:1.5rem">' + esc(f.summary) + '</p>' +
              '<p style="margin-top:1.25rem;color:var(--muted);line-height:1.75;max-width:64ch">' + esc(f.description) + '</p>' +
            '</div>' +
            '<div class="reveal" id="enquire">' + enquiryCard(f) + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="band band--ink" id="schedule">' +
          '<div class="shell">' +
            '<div class="section-head reveal">' +
                            '<h2>Every measured fact on this farm</h2>' +
              '<p class="lede">Recorded from the seller mandate against the ERFDEVCO listing schedule. Nothing here is estimated.</p>' +
            '</div>' +
            '<div class="schedule-meter reveal">' +
              '<b>' + (f.factCount || 0) + ' measured facts</b>' +
              '<span>across ' + (f.sectionCount || 0) + ' of the 18 schedule sections</span>' +
              '<span>Sections that cannot apply to a ' + esc(String(f.farmType).toLowerCase()) + ' are left out rather than filled in.</span>' +
            '</div>' +
            '<div class="schedule-layout">' +
              '<div class="spec-tabs" role="tablist" aria-orientation="vertical" aria-label="Schedule sections">' + tabsHtml + '</div>' +
              '<div class="spec-groups is-single">' + specsHtml + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="band band--tight" id="bond">' +
          '<div class="shell">' +
            '<div class="section-head reveal">' +
              '<h2>Work the bond on ' + esc(f.priceDisplay) + '</h2>' +
              '<p class="lede">Change the deposit, the rate and the term to see the monthly repayment. This is arithmetic, not a quote: your bank sets the rate, and agricultural bonds are usually written over shorter terms than a house.</p>' +
            '</div>' +
            '<div class="reveal">' + bondCard(f) + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="band band--tight band--top0" id="similar-farms"></div>';

      mount.innerHTML = html;

      armReveals(mount);
      wireForms(mount);
      wireSpecTabs(mount);
      wireLightbox(mount, gallery, f);
      wireBond(mount, f);
      wireShare(mount, f);
      renderSimilar(mount, f, farms);
      injectSchema(f);

      wireJumpnav(mount);

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

    /* The jump nav follows the reader: the link whose section is on screen
       carries aria-current, and the bar scrolls its own overflow to keep
       that link in view on a phone. */
    function wireJumpnav(root) {
      var nav = $('.jumpnav', root);
      if (!nav || !('IntersectionObserver' in window)) return;
      var links = $$('a', nav);
      var byId = {};
      links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

      function mark(a) {
        links.forEach(function (x) {
          if (x === a) x.setAttribute('aria-current', 'true');
          else x.removeAttribute('aria-current');
        });
        if (a && a.scrollIntoView) {
          var r = a.getBoundingClientRect(), n = nav.getBoundingClientRect();
          if (r.left < n.left || r.right > n.right) {
            nav.querySelector('.jumpnav__inner').scrollLeft += r.left - n.left - 16;
          }
        }
      }

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && byId[en.target.id]) mark(byId[en.target.id]);
        });
      }, { rootMargin: '-35% 0px -55% 0px' });
      Object.keys(byId).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) io.observe(el);
      });
    }

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
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.setAttribute('tabindex', on ? '0' : '-1');
        });
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
        var next = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
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
      // Swipe pages the gallery on touch. Pointer events cover mouse drags
      // too, which costs nothing.
      var swipeX = null;
      box.addEventListener('pointerdown', function (e) { swipeX = e.clientX; });
      box.addEventListener('pointerup', function (e) {
        if (swipeX === null) return;
        var dx = e.clientX - swipeX;
        swipeX = null;
        if (Math.abs(dx) < 44) return;
        var go = $(dx > 0 ? '.lb-prev' : '.lb-next', box);
        if (go) go.click();
      });
        box.hidden = true;
        box.innerHTML =
          '<button type="button" class="lb-btn lb-close" aria-label="Close">&times;</button>' +
          '<button type="button" class="lb-btn lb-prev" aria-label="Previous photograph">&#8249;</button>' +
          '<img alt="" />' +
          '<button type="button" class="lb-btn lb-next" aria-label="Next photograph">&#8250;</button>' +
          '<p class="lb-count" role="status" aria-live="polite"></p>';
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
        else if (e.key === 'Tab') {
          // Cycle the three controls instead of pinning focus to one of them.
          var f = $$('.lb-btn', box);
          var i = f.indexOf(document.activeElement);
          var n = (i + (e.shiftKey ? -1 : 1) + f.length) % f.length;
          e.preventDefault();
          f[n].focus();
        }
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

    /* Bond repayment. Standard amortisation, run in the browser, nothing sent. */
    function bondCard(f) {
      return '' +
        '<div class="bond">' +
          '<div class="bond-grid">' +
            '<label class="bond-f"><span>Deposit</span>' +
              '<input type="range" id="bd-dep" min="0" max="60" step="5" value="20" />' +
              '<output id="bd-dep-o"></output></label>' +
            '<label class="bond-f"><span>Interest rate</span>' +
              '<input type="range" id="bd-rate" min="6" max="18" step="0.25" value="11.75" />' +
              '<output id="bd-rate-o"></output></label>' +
            '<label class="bond-f"><span>Term</span>' +
              '<input type="range" id="bd-term" min="5" max="30" step="1" value="15" />' +
              '<output id="bd-term-o"></output></label>' +
          '</div>' +
          '<div class="bond-out">' +
            '<p class="bond-lab">Monthly repayment</p>' +
            '<p class="bond-big" id="bd-pm">&nbsp;</p>' +
            '<dl class="bond-sum">' +
              '<div><dt id="bd-dep-amt">&nbsp;</dt><dd>Deposit</dd></div>' +
              '<div><dt id="bd-loan">&nbsp;</dt><dd>Amount bonded</dd></div>' +
              '<div><dt id="bd-int">&nbsp;</dt><dd>Interest over the term</dd></div>' +
            '</dl>' +
            '<p class="form-note">An estimate only. Rates, terms and deposits on agricultural property are set by your bank against the farm and the buyer.</p>' +
          '</div>' +
        '</div>';
    }

    function wireBond(root, f) {
      var dep = $('#bd-dep', root), rate = $('#bd-rate', root), term = $('#bd-term', root);
      if (!dep || !rate || !term) return;

      var money = function (n) {
        return 'R' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      };

      function calc() {
        var d = +dep.value, r = +rate.value, y = +term.value;
        dep.setAttribute('aria-valuetext', d + ' per cent deposit');
        rate.setAttribute('aria-valuetext', r.toFixed(2) + ' per cent interest');
        term.setAttribute('aria-valuetext', y + (y === 1 ? ' year' : ' years'));
        var deposit = f.price * d / 100;
        var loan = f.price - deposit;
        var i = r / 100 / 12, n = y * 12;
        var pm = i === 0 ? loan / n : loan * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);

        $('#bd-dep-o', root).textContent = d + '%';
        $('#bd-rate-o', root).textContent = r.toFixed(2) + '%';
        $('#bd-term-o', root).textContent = y + (y === 1 ? ' year' : ' years');
        $('#bd-pm', root).textContent = money(pm);
        $('#bd-dep-amt', root).textContent = money(deposit);
        $('#bd-loan', root).textContent = money(loan);
        $('#bd-int', root).textContent = money(pm * n - loan);
      }

      [dep, rate, term].forEach(function (el) { el.addEventListener('input', calc); });
      calc();
    }

    /* Share. Native sheet where there is one, clipboard everywhere else. */
    function wireShare(root, f) {
      var btn = $('[data-share]', root);
      if (!btn) return;
      btn.addEventListener('click', function () {
        var url = window.location.href;
        var label = f.title + ', ' + f.place + ', ' + f.priceDisplay;
        if (navigator.share) {
          navigator.share({ title: f.title + ' | ERFDEVCO', text: label, url: url }).catch(function () {});
          return;
        }
        var done = function () {
          var was = btn.textContent;
          btn.textContent = 'Link copied';
          setTimeout(function () { btn.textContent = was; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done).catch(function () {});
        } else {
          var t = document.createElement('textarea');
          t.value = url; document.body.appendChild(t); t.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(t);
        }
      });
    }

    /* Similar farms: same type first, then same province, then nearest price. */
    function renderSimilar(root, f, farms) {
      var host = $('#similar-farms', root);
      if (!host) return;
      var rest = farms.filter(function (x) { return x.id !== f.id; });
      var scored = rest.map(function (x) {
        var s = 0;
        if (x.farmType === f.farmType) s += 100;
        if (x.province === f.province) s += 40;
        s -= Math.abs(x.price - f.price) / f.price * 20;
        return { f: x, s: s };
      }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3);

      if (!scored.length) { host.remove(); return; }

      // The old heading said a buyer of this one "usually looks at" these,
      // which is behaviour the site has no way of knowing. It now says what
      // it can prove, and the note names the ground they were matched on
      // rather than implying they share a type when nothing else does.
      var sameType = scored.filter(function (x) { return x.f.farmType === f.farmType; }).length;
      var sameProv = scored.filter(function (x) { return x.f.province === f.province; }).length;
      var basis = sameType
        ? (sameType === scored.length ? 'All of them are the same kind of farm.'
           : sameType === 1 ? 'One of them is the same kind of farm.'
           : 'Two of them are the same kind of farm.')
        : (sameProv ? 'Nothing else of this type is on the books today, so these are matched on province and price.'
           : 'Nothing else of this type or province is on the books today, so these are the nearest on price.');
      var count = scored.length === 1 ? 'The closest farm' :
        (scored.length === 2 ? 'The two closest farms' : 'The three closest farms');

      host.innerHTML = '<div class="shell">' +
        '<div class="section-head section-head--split reveal">' +
          '<div><h2>' + count + ' on the books</h2></div>' +
          '<div><p class="lede">Matched on farm type first, then province, then price. ' + basis +
          ' Every one carries the same schedule, so they compare field for field.</p>' +
          '<p style="margin-top:1.25rem"><a class="link-line" href="listings.html">All ' + farms.length + ' farms <span class="arw" aria-hidden="true">&rarr;</span></a></p></div>' +
        '</div>' +
        '<div class="farm-grid farm-grid--even" data-stagger>' +
          scored.map(function (x) { return farmCard(x.f, false); }).join('') +
        '</div>' +
      '</div>';
      armReveals(host);
    }

    /* Head tags per farm. These pages are the ones that should rank, so they
       carry a real title, description, canonical and share card. */
    function setHead(f) {
      var url = new URL('listing.html?id=' + encodeURIComponent(f.id), window.location.href).href;
      var img = new URL(f.image, window.location.href).href;
      var desc = f.summary;
      var title = f.title + ', ' + f.place + ', ' + f.province + ' | ERFDEVCO';

      document.title = title;
      var set = function (sel, attr, v) { var el = $(sel); if (el) el.setAttribute(attr, v); };
      set('meta[name="description"]', 'content', desc);
      set('#listing-canonical', 'href', url);
      set('#og-title', 'content', title);
      set('#og-desc', 'content', desc);
      set('#og-image', 'content', img);
    }

    /* Structured data so a listing can surface as a rich result. */
    function injectSchema(f) {
      var old = document.getElementById('listing-schema');
      if (old) old.remove();
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.id = 'listing-schema';
      s.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: f.title,
        sku: f.ref,
        description: f.summary,
        image: [new URL(f.image, window.location.href).href],
        category: f.farmType,
        brand: { '@type': 'Brand', name: 'ERFDEVCO' },
        offers: {
          '@type': 'Offer',
          price: f.price,
          priceCurrency: 'ZAR',
          availability: 'https://schema.org/InStock',
          url: window.location.href,
          seller: { '@type': 'RealEstateAgent', name: 'ERFDEVCO', telephone: '+27829005019' },
          areaServed: f.province
        },
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Total extent', value: f.sizeHa, unitCode: 'HAR' },
          { '@type': 'PropertyValue', name: 'Province', value: f.province },
          { '@type': 'PropertyValue', name: 'Farm type', value: f.farmType },
          { '@type': 'PropertyValue', name: 'Schedule fields recorded', value: f.factCount }
        ]
      });
      document.head.appendChild(s);
    }

    function enquiryCard(f) {
      return '' +
        '<div class="enquiry-card">' +
          '<h3>Enquire on ' + esc(f.title) + '</h3>' +
          '<p style="margin-top:0.5rem">Ask for the full mandate pack, the title deed extract or a viewing date.</p>' +
          '<form class="form-grid" style="margin-top:1.5rem" data-form="enquiry" data-ref="' + esc(f.ref) + ', ' + esc(f.title) + '" data-subject="Enquiry: ' + esc(f.ref) + ', ' + esc(f.title) + '" novalidate>' +
            '<div class="field field--full"><label for="eq-name">Your name</label><input id="eq-name" name="name" type="text" autocomplete="name" required /></div>' +
            '<div class="field field--full"><label for="eq-email">Email</label><input id="eq-email" name="email" type="email" autocomplete="email" required /></div>' +
            '<div class="field field--full"><label for="eq-phone">Phone</label><input id="eq-phone" name="phone" type="tel" autocomplete="tel" /></div>' +
            '<div class="field field--full"><label for="eq-message">Message</label><textarea id="eq-message" name="message" required>I would like more information on ' + esc(f.title) + '.</textarea></div>' +
            '<div class="hp" aria-hidden="true" inert><label for="eq-farmname">Farm name</label><input id="eq-farmname" name="farmname" type="text" tabindex="-1" autocomplete="off" /></div>' +
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
     Home: the five questions. A vertical tablist, so it answers Up, Down,
     Home and End as well as the pointer, and only the selected question is
     in the tab order.
     ---------------------------------------------------------------------- */
  (function buyerQuestions() {
    $$('.qa__list').forEach(wireList);
    function wireList(list) {
    var tabs = $$('.qa__q', list);
    if (!tabs.length) return;

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    }

    list.addEventListener('click', function (e) {
      var tab = e.target.closest('.qa__q');
      if (tab) select(tab);
    });

    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      var next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i + 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next === -1) return;
      e.preventDefault();
      var t = tabs[(next + tabs.length) % tabs.length];
      t.focus();
      select(t);
    });
    }
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

        // Bot trap. The field is aria-hidden and inert, so a person should
        // never be able to fill it. If one somehow does, do not claim the
        // message was sent: give them a route that works.
        if (form.elements.farmname && form.elements.farmname.value) {
          setStatus('We could not send that automatically. Please email martiens@erfdevco.com or call 082 900 5019 and we will pick it up.', 'error');
          return;
        }

        var bad = [];
        $$('[required]', form).forEach(function (el) {
          var fld = el.closest('.field');
          var why = '';
          if (!el.value.trim()) {
            why = el.type === 'email' ? 'We need an email to reply to.'
              : el.tagName === 'TEXTAREA' ? 'Tell us what you need in a line or two.'
              : 'We need your name for the reply.';
          } else if (el.type === 'email' && el.validity && !el.validity.valid) {
            why = 'That email address does not look right.';
          }
          if (!fld) { if (why) bad.push(el); return; }
          var err = fld.querySelector('.field-err');
          if (why) {
            bad.push(el);
            el.setAttribute('aria-invalid', 'true');
            if (!err) {
              err = document.createElement('p');
              err.className = 'field-err';
              err.id = el.id + '-err';
              fld.appendChild(err);
              el.setAttribute('aria-describedby', err.id);
              el.addEventListener('input', function () {
                el.removeAttribute('aria-invalid');
                var e2 = fld.querySelector('.field-err');
                if (e2) e2.remove();
              });
            }
            err.textContent = why;
          } else {
            el.removeAttribute('aria-invalid');
            if (err) err.remove();
          }
        });
        if (bad.length) {
          setStatus('', null);
          bad[0].focus();
          return;
        }

        var val = function (n) {
          var el = form.elements[n];
          return el && el.value ? String(el.value).trim() : '';
        };
        var labelOf = function (n) {
          var el = form.elements[n];
          if (!el || !el.options) return val(n);
          var o = el.options[el.selectedIndex];
          return o && o.value ? o.text.trim() : '';
        };

        var subject = form.getAttribute('data-subject') || 'New enquiry from the ERFDEVCO website';
        var reason = labelOf('reason');
        if (reason) subject = 'ERFDEVCO: ' + reason;

        // Everything the visitor filled in has to reach the inbox. A dropdown
        // that never leaves the browser is a form that quietly loses enquiries.
        var extra = [];
        if (reason) extra.push('Reason: ' + reason);
        if (val('province')) extra.push('Province: ' + labelOf('province'));
        if (val('phone')) extra.push('Phone: ' + val('phone'));
        if (form.getAttribute('data-ref')) extra.push('Listing: ' + form.getAttribute('data-ref'));
        extra.push('Sent from: ' + window.location.href);

        var payload = {
          name: val('name'),
          email: val('email'),
          message: val('message') + '\n\n' + extra.join('\n'),
          subject: subject
        };

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

  /* ----------------------------------------------------------------------
     Compare tray. Built once, shown only while farms are selected.
     ---------------------------------------------------------------------- */
  (function compareTray() {
    // The compare page IS the tray's destination; showing it there floats a
    // second copy of the selection over the table.
    if ($('#compare-table')) return;
    var tray = null, slots = null, cta = null;

    function build() {
      tray = document.createElement('div');
      tray.className = 'cmp-tray';
      tray.setAttribute('role', 'region');
      tray.setAttribute('aria-label', 'Farms selected to compare');
      tray.innerHTML =
        '<span class="cmp-tray__label">Compare</span>' +
        '<div class="cmp-tray__slots"></div>' +
        '<div class="cmp-tray__actions">' +
          '<button type="button" class="cmp-clear">Clear</button>' +
          '<a class="btn btn--gold" href="compare.html">Compare</a>' +
        '</div>';
      document.body.appendChild(tray);
      slots = $('.cmp-tray__slots', tray);
      cta = $('.btn', tray);
      $('.cmp-clear', tray).addEventListener('click', function () {
        setCompare([]);
        $$('[data-cmp]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      });
      slots.addEventListener('click', function (e) {
        var x = e.target.closest('.cmp-slot__x');
        if (!x) return;
        var id = x.getAttribute('data-drop');
        var ids = compareList().filter(function (v) { return v !== id; });
        setCompare(ids);
        $$('[data-cmp="' + id + '"]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      });
    }

    function render() {
      var ids = compareList();
      if (!ids.length) {
        if (tray) tray.classList.remove('is-up');
        document.body.classList.remove('has-tray');
        return;
      }
      if (!tray) build();
      // Keep the tray from sitting on top of the last of the page.
      document.body.classList.add('has-tray');
      loadData().then(function (farms) {
        var by = {};
        farms.forEach(function (f) { by[f.id] = f; });
        var html = '';
        for (var i = 0; i < CMP_MAX; i++) {
          var f = by[ids[i]];
          html += f
            ? '<div class="cmp-slot cmp-slot--filled">' + imgTag(f.image, f.title, '62px', {}) +
              '<button type="button" class="cmp-slot__x" data-drop="' + esc(f.id) + '" aria-label="Remove ' + esc(f.title) + '">&times;</button></div>'
            : '<div class="cmp-slot" aria-hidden="true"></div>';
        }
        slots.innerHTML = html;
        cta.textContent = ids.length < 2 ? 'Pick one more' : 'Compare ' + ids.length + ' farms';
        if (ids.length < 2) {
          cta.setAttribute('aria-disabled', 'true');
          cta.removeAttribute('href');
        } else {
          cta.removeAttribute('aria-disabled');
          cta.setAttribute('href', 'compare.html');
        }
        requestAnimationFrame(function () { tray.classList.add('is-up'); });
      });
    }

    document.addEventListener('erf:compare', function () {
      render();
      if (window.__erfRenderCompare) window.__erfRenderCompare();
    });
    render();
  })();

  /* ----------------------------------------------------------------------
     Compare page. Every field either farm answers, grouped by schedule
     section, with the rows that actually differ marked.
     ---------------------------------------------------------------------- */
  (function comparePage() {
    var mount = $('#compare-table');
    if (!mount) return;

    // Exposed so a single page shell (the design preview) can re-render this
    // view after the selection changes. Harmless on the real multi-page site.
    window.__erfRenderCompare = render;

    // A comparison lives in this browser's storage, which makes it
    // unshareable: the buyer cannot send it to a partner, a bank or a valuer,
    // who are exactly the people the schedule is written for. An ids list in
    // the address bar wins over storage, and the address bar is kept in step
    // with the selection so the link in it is always the one on screen.
    (function () {
      var ids = (new URLSearchParams(window.location.search).get('ids') || '')
        .split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      if (ids.length >= 2) setCompare(ids.slice(0, CMP_MAX));
    }());

    document.addEventListener('erf:compare', render);
    render();

    function render() {
    loadData().then(function (farms) {
      var by = {};
      farms.forEach(function (f) { by[f.id] = f; });
      var picked = compareList().map(function (id) { return by[id]; }).filter(Boolean);

      var acts = $('.cmp-controls .cmp-acts');
      if (acts) acts.hidden = picked.length < 2;

      if (picked.length >= 2 && window.history && history.replaceState) {
        var want = '?ids=' + picked.map(function (f) { return f.id; }).join(',');
        if (window.location.search !== want) {
          history.replaceState(null, '', window.location.pathname + want);
        }
      }

      if (picked.length < 2) {
        mount.innerHTML = '<div class="farm-empty">' +
          '<h3>Pick at least two farms</h3>' +
          '<p>Tick Compare on any two or three farms and they will line up here, field for field, across the whole schedule.</p>' +
          '<p style="margin-top:1.5rem"><a class="btn btn--ink" href="listings.html">Browse farms for sale</a></p>' +
        '</div>';
        return;
      }

      // Union of sections and of the fields inside them, in first-seen order.
      var sections = [];
      var fields = {};
      picked.forEach(function (f) {
        Object.keys(f.specs || {}).forEach(function (sec) {
          if (sections.indexOf(sec) === -1) { sections.push(sec); fields[sec] = []; }
          Object.keys(f.specs[sec]).forEach(function (k) {
            if (fields[sec].indexOf(k) === -1) fields[sec].push(k);
          });
        });
      });

      var head = '<thead><tr><th scope="col"><span class="visually-hidden">Field</span></th>' +
        picked.map(function (f) {
          return '<th scope="col"><span class="cmp-head">' +
            imgTag(f.image, f.alt, '(max-width:640px) 45vw, 22vw', {}) +
            '<span class="r">' + esc(f.ref) + '</span>' +
            '<span class="t"><a href="listing.html?id=' + encodeURIComponent(f.id) + '">' + esc(f.title) + '</a></span>' +
            '<span class="l">' + esc(f.place) + ', ' + esc(f.province) + '</span>' +
            '<span class="p">' + esc(f.priceDisplay) + '</span>' +
          '</span></th>';
        }).join('') + '</tr></thead>';

      // Headline rows first, then the schedule proper.
      var HEAD_ROWS = [
        ['Farm type', function (f) { return f.farmType; }],
        ['Province', function (f) { return f.province; }],
        ['Total extent', function (f) { return thousands(f.sizeHa) + ' ha'; }],
        ['Asking price', function (f) { return f.priceDisplay; }],
        ['Price per hectare', function (f) { return f.perHa; }],
        ['Facts recorded', function (f) { return f.factCount + ' across ' + f.sectionCount + ' sections'; }],
        ['On the market since', function (f) { return monthYear(f.listedOn); }]
      ];

      function row(label, values) {
        var seen = values.filter(function (v) { return v !== ''; });
        var diff = new Set(seen).size > 1 || seen.length !== values.length ? 1 : 0;
        return '<tr data-diff="' + diff + '"><th scope="row">' + esc(label) + '</th>' +
          values.map(function (v) {
            return v === ''
              ? '<td class="is-blank">Not recorded</td>'
              : '<td>' + esc(v) + '</td>';
          }).join('') + '</tr>';
      }

      var body = '<tbody>';
      body += '<tr class="cmp-sec"><th colspan="' + (picked.length + 1) + '" scope="colgroup">At a glance</th></tr>';
      HEAD_ROWS.forEach(function (r) {
        body += row(r[0], picked.map(function (f) { return String(r[1](f) || ''); }));
      });
      sections.forEach(function (sec) {
        body += '<tr class="cmp-sec"><th colspan="' + (picked.length + 1) + '" scope="colgroup">' + esc(sec) + '</th></tr>';
        fields[sec].forEach(function (k) {
          body += row(k, picked.map(function (f) {
            return (f.specs[sec] && f.specs[sec][k]) ? String(f.specs[sec][k]) : '';
          }));
        });
      });
      body += '</tbody>';

      // The phone layout stacks each row into as many columns as there are
      // farms, so it has to know the count rather than assume two.
      mount.innerHTML = '<div class="cmp-wrap"><table class="cmp-table" style="--cmp-cols:' +
        picked.length + '">' + head + body + '</table></div>';

      var table = $('.cmp-table', mount);
      var diffCount = $$('tr[data-diff="1"]', table).length;
      var totalRows = $$('tbody tr:not(.cmp-sec)', table).length;

      var line = $('#compare-line');
      if (line) {
        line.textContent = picked.length + ' farms, ' + totalRows + ' fields compared, ' +
          diffCount + ' where they differ.';
      }

      var sw = $('#compare-diff');
      if (sw) {
        sw.hidden = false;
        sw.addEventListener('click', function () {
          var on = sw.getAttribute('aria-pressed') !== 'true';
          sw.setAttribute('aria-pressed', on ? 'true' : 'false');
          table.classList.toggle('cmp-only-diff', on);
          sw.querySelector('.lab').textContent = on ? 'Showing differences only' : 'Show differences only';
        });
      }

      var printBtn = $('#compare-print');
      if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
    }).catch(function (err) {
      mount.innerHTML = '<div class="farm-empty"><h3>Comparison unavailable</h3><p>' + esc(err.message) + '</p></div>';
    });
    }
  })();

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
