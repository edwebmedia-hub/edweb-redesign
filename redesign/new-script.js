/* Edweb Media, 2026-09 rebuild. One script for every page.
   Every feature is guarded: a missing element is a no-op, never a crash. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------ Header ---------------------------------- */
  var header = $('#site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------ Mobile nav ------------------------------ */
  var toggle = $('#nav-toggle');
  var links = $('#nav-links');
  if (toggle && links) {
    var setNav = function (open) {
      links.classList.toggle('is-open', open);
      header && header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () { setNav(!links.classList.contains('is-open')); });
    $$('a', links).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
  }

  /* Current page in the nav */
  (function () {
    var here = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
    $$('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#') return;
      var target = href.split('#')[0].replace(/\.html$/, '').replace(/^\//, '') || 'index';
      if (target === here) a.setAttribute('aria-current', 'page');
    });
  })();

  /* ------------------------------ Reveal ---------------------------------- */
  /* Guarded: if IO is missing or stalls, everything is shown, never hidden. */
  var reveals = $$('.reveal');
  var showAll = function () { reveals.forEach(function (el) { el.classList.add('is-visible'); }); };
  if (reveals.length) {
    if (!('IntersectionObserver' in window) || reduced) {
      showAll();
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      reveals.forEach(function (el) { io.observe(el); });
      window.setTimeout(function () {
        reveals.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
        });
      }, 1200);
      window.addEventListener('load', function () { window.setTimeout(showAll, 6000); });
    }
  }

  /* Hero entrance */
  $$('.hero, .page-hero').forEach(function (h) {
    window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { h.classList.add('is-in'); }); });
  });

  /* ------------------------------ Cycling word ---------------------------- */
  $$('.cycle').forEach(function (cy) {
    var words = $$('span', cy);
    if (words.length < 2) { words[0] && words[0].classList.add('is-on'); return; }
    var i = 0;
    words[0].classList.add('is-on');
    if (reduced) return;
    window.setInterval(function () {
      var prev = words[i];
      i = (i + 1) % words.length;
      prev.classList.remove('is-on'); prev.classList.add('is-off');
      words[i].classList.remove('is-off'); words[i].classList.add('is-on');
    }, 2600);
  });

  /* ------------------------------ Backdrop -------------------------------- */
  /* Drifting dot field in the two accents. One draw when motion is reduced. */
  (function () {
    var wrap = $('.backdrop');
    if (!wrap) return;
    var canvas = document.createElement('canvas');
    wrap.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dots = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var TEAL = '122,207,214', CORAL = '224,71,76';

    var size = function () {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(90, Math.round((W * H) / 21000));
      dots = [];
      for (var i = 0; i < n; i++) {
        dots.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
          r: 1.4 + Math.random() * 1.9, c: Math.random() < 0.62 ? TEAL : CORAL
        });
      }
    };
    var draw = function () {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < dots.length; i++) {
        var a = dots[i];
        for (var j = i + 1; j < dots.length; j++) {
          var b = dots[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < 19600) {
            ctx.strokeStyle = 'rgba(28,28,28,' + (0.09 * (1 - d / 19600)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (var k = 0; k < dots.length; k++) {
        var p = dots[k];
        ctx.fillStyle = 'rgba(' + p.c + ',0.62)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    };
    var step = function () {
      for (var i = 0; i < dots.length; i++) {
        var p = dots[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      }
    };
    var running = false, raf;
    var loop = function () { step(); draw(); raf = window.requestAnimationFrame(loop); };
    var start = function () { if (!running && !reduced) { running = true; raf = window.requestAnimationFrame(loop); } };
    var stop = function () { running = false; window.cancelAnimationFrame(raf); };
    size(); draw(); start();
    var rt;
    window.addEventListener('resize', function () { window.clearTimeout(rt); rt = window.setTimeout(function () { size(); draw(); }, 150); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  })();

  /* ------------------------------ Tabs ------------------------------------ */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var select = function (tab) {
      tabs.forEach(function (t, i) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (panels[i]) { panels[i].hidden = !on; panels[i].classList.toggle('is-active', on); }
      });
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var j = i;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = tabs.length - 1; else return;
        e.preventDefault(); select(tabs[j]); tabs[j].focus();
      });
    });
    var initial = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    if (initial) select(initial);
    $$('[data-open-tab]').forEach(function (link) {
      link.addEventListener('click', function () {
        var t = document.getElementById(link.getAttribute('data-open-tab'));
        if (t && tabs.indexOf(t) > -1) select(t);
      });
    });
  });

  /* ------------------------------ Statement ------------------------------- */
  /* Words light up progressively as the band scrolls into view. */
  (function () {
    var st = $('.statement');
    if (!st) return;
    var words = $$('.w', st);
    if (!words.length) return;
    if (reduced) { words.forEach(function (w) { w.classList.add('is-lit'); }); return; }
    var lit = -1;
    var update = function () {
      var r = st.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.9 - r.top) / (vh * 0.55);
      var n = Math.round(Math.max(0, Math.min(1, p)) * words.length);
      if (n === lit) return;
      lit = n;
      words.forEach(function (w, i) { w.classList.toggle('is-lit', i < n); });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ------------------------------ Count-up figures ------------------------ */
  (function () {
    var figs = $$('[data-count]');
    if (!figs.length) return;
    var run = function (el) {
      var end = parseFloat(el.getAttribute('data-count'));
      var dec = (el.getAttribute('data-count').split('.')[1] || '').length;
      var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
      if (reduced || !('requestAnimationFrame' in window)) { el.textContent = pre + end.toFixed(dec) + suf; return; }
      var t0 = null, dur = 1400;
      var tick = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + (end * e).toFixed(dec) + suf;
        if (p < 1) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) { figs.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    figs.forEach(function (f) { io.observe(f); });
  })();

  /* ------------------------------ Rails with buttons ---------------------- */
  $$('[data-rail]').forEach(function (wrap) {
    var rail = $('.rail', wrap) || $('#' + wrap.getAttribute('data-rail'));
    if (!rail) return;
    var stepBy = function (dir) {
      var item = rail.firstElementChild;
      var gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      var w = rail.hasAttribute('data-page') ? rail.clientWidth + gap : (item ? item.getBoundingClientRect().width + gap : rail.clientWidth * 0.8);
      rail.scrollBy({ left: dir * w, behavior: reduced ? 'auto' : 'smooth' });
    };
    var prev = $('[data-prev]', wrap), next = $('[data-next]', wrap);
    prev && prev.addEventListener('click', function () { stepBy(-1); });
    next && next.addEventListener('click', function () { stepBy(1); });
  });

  /* ------------------------------ Enquiry forms --------------------------- */
  /* Conditional questions: a group with data-show-when="name=value" only
     appears once that input holds that value. */
  $$('[data-show-when]').forEach(function (group) {
    var rule = group.getAttribute('data-show-when').split('=');
    var form = group.closest('form');
    if (!form) return;
    var check = function () {
      var inputs = $$('[name="' + rule[0] + '"]', form);
      var on = inputs.some(function (i) {
        if (i.type === 'checkbox' || i.type === 'radio') return i.checked && i.value === rule[1];
        return i.value === rule[1];
      });
      group.hidden = !on;
      if (!on) $$('input, select, textarea', group).forEach(function (i) {
        if (i.type === 'checkbox' || i.type === 'radio') i.checked = false; else i.value = '';
      });
    };
    form.addEventListener('change', check);
    check();
  });

  $$('#contact-form, #quote-form').forEach(function (form) {
    var status = $('.form-status', form) || form.appendChild(Object.assign(document.createElement('p'), { className: 'form-status', role: 'status' }));
    var label = function (el) {
      var f = el.closest('.field');
      var l = f && ($('label', f) || $('span', f));
      return l ? l.textContent.replace(/\*/g, '').trim() : el.name;
    };
    var validate = function () {
      var bad = [];
      $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
      $$('.field-error', form).forEach(function (el) { el.textContent = ''; });
      $$('[required]', form).forEach(function (el) {
        if (el.closest('[hidden]')) return;
        var ok = el.type === 'checkbox' ? el.checked : el.value.trim().length > 0;
        if (ok && el.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        if (!ok) {
          bad.push(label(el));
          el.setAttribute('aria-invalid', 'true');
          var f = el.closest('.field'), err = f && $('.field-error', f);
          if (err) err.textContent = el.type === 'email' && el.value.trim() ? 'That email address does not look right.' : 'Please fill in ' + label(el).toLowerCase() + '.';
        }
      });
      var boxes = $$('input[type="checkbox"][data-require-one]', form);
      if (boxes.length && !boxes.some(function (b) { return b.checked; })) {
        bad.push('what you need');
        var g = boxes[0].closest('.field'), ge = g && $('.field-error', g);
        if (ge) ge.textContent = 'Pick at least one.';
      }
      return bad;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad.length) {
        status.className = 'form-status is-error';
        status.textContent = 'Still missing: ' + bad.join(', ') + '.';
        var first = $('[aria-invalid="true"]', form); first && first.focus();
        return;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) {
        if (data[k] !== undefined) { data[k] = [].concat(data[k], v); } else { data[k] = v; }
      });
      /* website_type routes the enquiry in api/send-mail.js; derive it from the package key */
      if (data.package && !data.website_type) {
        data.website_type = /^ecommerce/.test(data.package) ? 'Online store' : /^directory/.test(data.package) ? 'Directory site' : 'Business website';
      } else if (!data.website_type && [].concat(data.services || []).indexOf('Website design') > -1) {
        data.website_type = 'Not sure yet';
      }
      if (Array.isArray(data.services)) data.services = data.services.join(', ');
      if (Array.isArray(data.addons)) data.addons = data.addons.join(', ');
      var btn = $('button[type="submit"]', form);
      var was = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending'; }
      status.className = 'form-status'; status.textContent = '';
      fetch('/api/send-mail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (out) {
          if (!out.success) throw new Error(out.message || 'failed');
          if (out.sent === true && typeof window.gtag === 'function') {
            window.gtag('event', 'conversion', { send_to: 'AW-16948063813/' + (form.getAttribute('data-conversion') || 'enquiry') });
          }
          var done = document.createElement('div');
          done.className = 'form-done';
          done.setAttribute('tabindex', '-1');
          done.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="10.5"/><path d="M7.5 12.5l3 3 6-7"/></svg>' +
            '<h3>Got it. We will reply within one working day.</h3>' +
            '<p>Prefer to talk now? Call or WhatsApp <a href="tel:+27846204583">084 620 4583</a>.</p>';
          form.replaceWith(done);
          done.focus();
        })
        .catch(function () {
          status.className = 'form-status is-error';
          status.textContent = 'That did not send. Email info@edwebmedia.com or WhatsApp 084 620 4583 and we will pick it up.';
          if (btn) { btn.disabled = false; btn.textContent = was; }
        });
    });
  });

  /* Package buttons prefill the enquiry */
  $$('[data-package]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      try { sessionStorage.setItem('edweb-package', btn.getAttribute('data-package')); } catch (e) {}
    });
  });
  (function () {
    var sel = $('select[name="package"]');
    if (!sel) return;
    try {
      var want = new URLSearchParams(location.search).get('package') || sessionStorage.getItem('edweb-package');
      if (want && $$('option', sel).some(function (o) { return o.value === want; })) {
        sel.value = want;
        var web = $('input[name="services"][value="Website design"]');
        if (web) { web.checked = true; }
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (e) {}
  })();

  /* ------------------------------ Chat ------------------------------------ */
  /* One engine, two mounts: the hero panel on the home page and the drawer
     on every page. History is shared through sessionStorage. The server
     answers from a locked facts file; when it cannot be reached the widget
     answers the common questions itself and hands off to WhatsApp. */
  var Chat = (function () {
    var KEY = 'edweb-chat';
    var KEY_TURN = 'edweb-chat-turn';
    var KEY_ENDED = 'edweb-chat-ended';
    var mounts = [];
    var busy = false;
    var history = [];
    var turn = 0;
    var ended = false;
    try { history = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { history = []; }
    try { turn = Number(sessionStorage.getItem(KEY_TURN)) || 0; ended = !!sessionStorage.getItem(KEY_ENDED); } catch (e) {}
    var save = function () { try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-24))); sessionStorage.setItem(KEY_TURN, String(turn)); } catch (e) {} };
    var ENDED_HINT = 'Thread closed. WhatsApp us: 084 620 4583';
    // The server closes a thread after its turn cap; every mount then points
    // at a person instead of pretending to listen.
    var closeMount = function (mt) {
      var input = $('.chat-form input', mt.root);
      var sendBtn = $('.chat-send', mt.root);
      if (input) { input.disabled = true; input.placeholder = ENDED_HINT; }
      if (sendBtn) sendBtn.disabled = true;
      if (mt.chips) mt.chips.hidden = true;
    };
    var endThread = function () {
      ended = true;
      try { sessionStorage.setItem(KEY_ENDED, '1'); } catch (e) {}
      mounts.forEach(closeMount);
    };

    var GREETING = 'Hi, I am the Edweb assistant. Ask me what a website costs, how long it takes, or what we would build for your business.';
    var CHIPS = ['What does a website cost?', 'How long does it take?', 'Do you host it as well?', 'I want a quote'];

    var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var linkify = function (s) {
      return esc(s)
        .replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
        .replace(/(0\d{2} \d{3} \d{4})/g, '<a href="tel:+27846204583">$1</a>');
    };

    var offline = function (q) {
      var t = q.toLowerCase();
      var has = function () { for (var i = 0; i < arguments.length; i++) if (t.indexOf(arguments[i]) > -1) return true; return false; };
      if (has('store', 'shop', 'ecommerce', 'e-commerce', 'sell', 'product'))
        return 'Online stores are once-off: R4,999 for up to 10 products, R6,499 for up to 25, R8,499 for up to 50, with secure payments, cart and checkout included.';
      if (has('cost', 'price', 'much', 'quote', 'fee', 'rand', 'cheap', 'expensive'))
        return 'Business websites are once-off: Silver R2,999 for 5 pages, Gold R3,999 for 10, Platinum R5,499 for 20. Online stores from R4,999 and directory sites from R7,999. Hosting and management are optional at R199 a month each.';
      if (has('long', 'time', 'fast', 'quick', 'days', 'weeks', 'when'))
        return 'Silver takes about 5 working days, Gold 10 and Platinum 15, counted from the day we have your content and access. Stores and directories get a date at kickoff.';
      if (has('host', 'domain', 'email', 'maintain', 'manage', 'update'))
        return 'Yes. Hosting with professional email is R199 a month, and website management (updates, edits, one hour of work each month) is another R199. Both are optional and cancel any time in writing.';
      if (has('seo', 'google', 'rank', 'found'))
        return 'Every build gets basic SEO foundations. Platinum includes advanced SEO from day one, and Google Ads campaigns are quoted per project.';
      if (has('call', 'phone', 'whatsapp', 'contact', 'speak', 'talk', 'email'))
        return 'Call or WhatsApp 084 620 4583, or email info@edwebmedia.com. Every enquiry gets a reply within one working day.';
      if (has('who', 'where', 'cape town', 'about', 'edgar'))
        return 'Edweb Media is a web design studio in Cape Town. You deal with the person building the site, and we work with businesses across South Africa.';
      return 'I cannot reach the live assistant right now. WhatsApp 084 620 4583 or use the contact form and we will answer personally.';
    };

    var render = function (m) {
      mounts.forEach(function (mt) {
        var log = mt.log;
        var el = document.createElement('div');
        el.className = 'msg msg--' + (m.role === 'user' ? 'me' : m.role === 'note' ? 'note' : 'bot');
        el.innerHTML = linkify(m.content);
        log.appendChild(el);
        log.scrollTop = log.scrollHeight;
        if (mt.chips && history.length) mt.chips.hidden = true;
      });
    };
    var typing = function (on) {
      mounts.forEach(function (mt) {
        var t = $('.typing', mt.log);
        if (on && !t) {
          var el = document.createElement('div');
          el.className = 'msg msg--bot'; el.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
          mt.log.appendChild(el); mt.log.scrollTop = mt.log.scrollHeight;
        } else if (!on && t) { t.parentNode.remove(); }
      });
    };

    var send = function (text) {
      text = (text || '').trim().slice(0, 500);
      if (!text || busy || ended) return;
      busy = true;
      turn += 1;
      history.push({ role: 'user', content: text }); save();
      render({ role: 'user', content: text });
      typing(true);
      var payload = history.filter(function (m) { return m.role === 'user' || m.role === 'assistant'; }).slice(-16);
      var finish = function (reply, lead, done) {
        typing(false);
        history.push({ role: 'assistant', content: reply }); save();
        render({ role: 'assistant', content: reply });
        if (lead) { history.push({ role: 'note', content: 'Sent to the studio. We will phone you back.' }); save(); render({ role: 'note', content: 'Sent to the studio. We will phone you back.' }); }
        busy = false;
        if (done) endThread();
      };
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var timer = ctrl && window.setTimeout(function () { ctrl.abort(); }, 20000);
      fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: payload, turn: turn }), signal: ctrl && ctrl.signal })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (out) { window.clearTimeout(timer); if (!out || !out.reply) throw new Error('empty'); finish(out.reply, out.lead, !!out.ended); })
        .catch(function () { window.clearTimeout(timer); finish(offline(text), null); });
    };

    var mount = function (root, opts) {
      opts = opts || {};
      root.innerHTML =
        '<div class="chat" role="region" aria-label="Chat with Edweb">' +
          '<div class="chat-head"><span class="chat-mark" aria-hidden="true">E</span><div><strong>Edweb assistant</strong><small>Replies in seconds</small></div>' +
          (opts.closable ? '<button type="button" class="chat-close" aria-label="Close chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' : '') + '</div>' +
          '<div class="chat-log" aria-live="polite"></div>' +
          '<div class="chat-chips"></div>' +
          '<form class="chat-form"><label class="visually-hidden" for="' + (opts.id || 'chat') + '-in">Your question</label>' +
          '<input id="' + (opts.id || 'chat') + '-in" type="text" maxlength="500" autocomplete="off" placeholder="Ask about prices, timing, hosting" />' +
          '<button type="submit" class="chat-send" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h13M13 6l6 6-6 6"/></svg></button></form>' +
          '<p class="chat-foot">Answers come from our price list. Prefer a person? <a href="https://wa.me/27846204583" target="_blank" rel="noopener">WhatsApp us</a>.</p>' +
        '</div>';
      var mt = { root: root, log: $('.chat-log', root), chips: $('.chat-chips', root) };
      mounts.push(mt);
      if (ended) closeMount(mt);
      var greet = document.createElement('div'); greet.className = 'msg msg--bot'; greet.textContent = GREETING; mt.log.appendChild(greet);
      CHIPS.forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = c;
        b.addEventListener('click', function () { send(c); });
        mt.chips.appendChild(b);
      });
      history.forEach(function (m) {
        var el = document.createElement('div');
        el.className = 'msg msg--' + (m.role === 'user' ? 'me' : m.role === 'note' ? 'note' : 'bot');
        el.innerHTML = linkify(m.content); mt.log.appendChild(el);
      });
      if (history.length) mt.chips.hidden = true;
      mt.log.scrollTop = mt.log.scrollHeight;
      var form = $('form', root), input = $('input', form);
      form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); input.value = ''; });
      var close = $('.chat-close', root);
      if (close && opts.onClose) close.addEventListener('click', opts.onClose);
      return mt;
    };
    return { mount: mount, send: send };
  })();

  var heroMount = $('#hero-chat');
  if (heroMount) Chat.mount(heroMount, { id: 'hero-chat' });

  (function () {
    var launch = $('#chat-launch');
    if (!launch) return;
    var drawer = document.createElement('div');
    drawer.className = 'chat-drawer';
    drawer.id = 'chat-drawer';
    document.body.appendChild(drawer);
    var mounted = false;
    var open = function (on) {
      if (on && !mounted) { Chat.mount(drawer, { id: 'drawer-chat', closable: true, onClose: function () { open(false); } }); mounted = true; }
      drawer.classList.toggle('is-open', on);
      launch.setAttribute('aria-expanded', String(on));
      launch.classList.toggle('is-hidden', on);
      if (on) { var i = $('input', drawer); i && window.setTimeout(function () { i.focus(); }, 250); } else { launch.focus(); }
    };
    launch.addEventListener('click', function () { open(!drawer.classList.contains('is-open')); });
    var ask = $('#ask-assistant');
    if (ask) ask.addEventListener('click', function () {
      if (heroMount && heroMount.getBoundingClientRect().bottom > 0) { heroMount.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); var hi = $('input', heroMount); hi && window.setTimeout(function () { hi.focus({ preventScroll: true }); }, 500); }
      else open(true);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-open')) open(false); });
    /* On the home page the hero already holds the chat; the launcher appears once it scrolls away. */
    if (heroMount && 'IntersectionObserver' in window) {
      launch.classList.add('is-hidden');
      new IntersectionObserver(function (en) {
        if (!drawer.classList.contains('is-open')) launch.classList.toggle('is-hidden', en[0].isIntersecting);
      }, { threshold: 0.2 }).observe(heroMount);
    }
  })();

  /* Year */
  var y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());
})();
