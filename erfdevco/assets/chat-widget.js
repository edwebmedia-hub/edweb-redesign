/* ERFDEVCO chat widget. Vanilla, styled from the site's own tokens.
   Launcher opens a panel; answers come from /api/chat (server-side key).
   The human route (call or WhatsApp Martiens) stays one tap away inside
   the panel, because the agency's pitch is the person. The conversation
   survives page moves via sessionStorage. */
(function () {
  'use strict';
  if (document.querySelector('.chat-fab')) return;

  var KEY_TURNS = 'erf-chat-turns';
  var KEY_SEEN = 'erf-chat-opened';
  var turns = [];
  var busy = false;

  try { turns = JSON.parse(sessionStorage.getItem(KEY_TURNS) || '[]'); } catch (e) { turns = []; }

  var smallScreen = window.matchMedia('(max-width: 640px)').matches;

  var fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'chat-fab';
  fab.setAttribute('aria-label', 'Chat to ERFDEVCO');
  fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3C6.9 3 3 6.5 3 10.8c0 2.3 1.1 4.3 2.9 5.7-.1.9-.5 2.2-1.6 3.3-.2.2 0 .6.3.6 2 0 3.6-.9 4.6-1.7.9.2 1.8.4 2.8.4 5.1 0 9-3.5 9-7.8S17.1 3 12 3Z"/></svg>' +
    // The label is a desktop device; on a phone it never enters the DOM, so
    // no stale stylesheet can ever paint it raw over the circle.
    (smallScreen ? '' : '<span class="chat-fab__label">Ask about a farm</span>');
  try { if (sessionStorage.getItem(KEY_SEEN)) fab.classList.add('is-quiet'); } catch (e) {}

  var panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat with ERFDEVCO');
  panel.innerHTML =
    '<div class="chat-head">' +
      '<img class="chat-head__mark" src="assets/logo-white-160.png" alt="" width="34" height="31" />' +
      '<div><strong>ERFDEVCO</strong><span><i class="chat-dot" aria-hidden="true"></i>Receptionist on duty &middot; English or Afrikaans</span></div>' +
      '<button type="button" class="chat-close" aria-label="Close chat">&times;</button>' +
    '</div>' +
    '<div class="chat-log" aria-live="polite">' +
      '<div class="chat-msg chat-msg--bot">Welcome. Ask me about any farm on the books, how listing works, or leave your number and Martiens phones you back.</div>' +
    '</div>' +
    '<div class="chat-chips">' +
      '<button type="button">Which farms are for sale?</button>' +
      '<button type="button">How do I sell my farm through you?</button>' +
      '<button type="button">What does the 18-section schedule cover?</button>' +
      '<button type="button">Ask Martiens to phone me</button>' +
    '</div>' +
    '<form class="chat-form">' +
      '<label class="visually-hidden" for="chat-in">Your message</label>' +
      '<input id="chat-in" type="text" maxlength="500" autocomplete="off" placeholder="Type your question" />' +
      '<button type="submit" class="chat-send" aria-label="Send"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 20V6.8l-4.9 4.9L5.7 10.3 12 4l6.3 6.3-1.4 1.4L12 6.8V20h0z"/><path fill="currentColor" d="M11 5h2v15h-2z"/></svg></button>' +
    '</form>' +
    '<p class="chat-foot">We only use your details to call you back. Rather talk to a person? ' +
      '<a href="tel:+27829005019">082 900 5019</a> or ' +
      '<a href="https://wa.me/27829005019" rel="noopener">WhatsApp Martiens</a>.</p>';

  var backdrop = document.createElement('div');
  backdrop.className = 'chat-backdrop';
  backdrop.hidden = true;

  document.body.appendChild(fab);
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  var log = panel.querySelector('.chat-log');
  var form = panel.querySelector('.chat-form');
  var input = panel.querySelector('#chat-in');
  var chips = panel.querySelector('.chat-chips');
  var lastFocus = null;

  function save() {
    try { sessionStorage.setItem(KEY_TURNS, JSON.stringify(turns.slice(-24))); } catch (e) {}
  }

  function bubble(text, who) {
    var d = document.createElement('div');
    d.className = 'chat-msg chat-msg--' + who;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  // Rebuild an earlier conversation so moving between pages keeps the thread.
  if (turns.length) {
    chips.hidden = true;
    turns.forEach(function (t) { bubble(t.content, t.role === 'user' ? 'me' : 'bot'); });
  }

  var small = window.matchMedia('(max-width: 640px)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  function open() {
    panel.hidden = false;
    panel.classList.add('is-open');
    backdrop.hidden = false;
    requestAnimationFrame(function () { backdrop.classList.add('is-open'); });
    if (small.matches) document.documentElement.classList.add('chat-lock');
    fab.setAttribute('aria-expanded', 'true');
    fab.classList.add('is-quiet');
    try { sessionStorage.setItem(KEY_SEEN, '1'); } catch (e) {}
    lastFocus = document.activeElement;
    log.scrollTop = log.scrollHeight;
    // Focusing the field on a phone slams the keyboard over half the sheet
    // before the visitor has read a word; only desktop gets the autofocus.
    if (fine.matches) input.focus();
  }
  function close() {
    panel.classList.remove('is-open');
    panel.hidden = true;
    backdrop.classList.remove('is-open');
    backdrop.hidden = true;
    document.documentElement.classList.remove('chat-lock');
    fab.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  fab.addEventListener('click', function () { panel.hidden ? open() : close(); });
  panel.querySelector('.chat-close').addEventListener('click', close);
  backdrop.addEventListener('click', close);

  // Phone manners: drag the sheet down by its header to dismiss, the way
  // every native bottom sheet works.
  (function sheetDrag() {
    var head = panel.querySelector('.chat-head');
    var startY = 0, delta = 0, dragging = false;
    head.addEventListener('touchstart', function (e) {
      if (!small.matches) return;
      dragging = true;
      startY = e.touches[0].clientY;
      delta = 0;
      panel.classList.add('is-dragging');
    }, { passive: true });
    head.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      delta = Math.max(0, e.touches[0].clientY - startY);
      panel.style.transform = 'translateY(' + delta + 'px)';
    }, { passive: true });
    head.addEventListener('touchend', function () {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('is-dragging');
      panel.style.transform = '';
      if (delta > 110) close();
    });
  })();
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) close();
  });

  function leadCard(lead) {
    var d = document.createElement('div');
    d.className = 'chat-lead';
    d.innerHTML = '<span>Sent to Martiens</span>' +
      '<b></b><i></i>';
    d.querySelector('b').textContent = lead.name + ' · ' + lead.phone;
    d.querySelector('i').textContent = lead.need;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  function typing(on) {
    var t = log.querySelector('.chat-typing');
    if (on && !t) {
      t = document.createElement('div');
      t.className = 'chat-msg chat-msg--bot chat-typing';
      t.setAttribute('aria-label', 'Typing');
      t.innerHTML = '<span></span><span></span><span></span>';
      log.appendChild(t);
      log.scrollTop = log.scrollHeight;
    } else if (!on && t) t.remove();
  }

  function send(text) {
    if (busy || !text.trim()) return;
    busy = true;
    chips.hidden = true;
    bubble(text, 'me');
    turns.push({ role: 'user', content: text });
    save();
    typing(true);
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: turns.slice(-24) })
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; });
    }).then(function (out) {
      typing(false);
      if (out.ok && out.j.reply) {
        bubble(out.j.reply, 'bot');
        turns.push({ role: 'assistant', content: out.j.reply });
        save();
        if (out.j.lead) leadCard(out.j.lead);
      } else if (out.status === 503) {
        bubble('Bit busy right now, try again in a minute. Or WhatsApp Martiens directly on 082 900 5019.', 'bot');
      } else {
        bubble('Connection hiccup, please send that again.', 'bot');
      }
    }).catch(function () {
      typing(false);
      bubble('Connection hiccup, please send that again.', 'bot');
    }).finally(function () { busy = false; });
  }

  chips.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) send(b.textContent);
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = '';
    send(v);
  });
})();
