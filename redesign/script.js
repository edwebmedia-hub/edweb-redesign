/* ==========================================================================
   Edweb Media — redesign interactions
   - Header: switches to a solid/blurred background after scrolling past hero
   - Mobile nav: simple toggle
   - Scroll reveal: IntersectionObserver adds .is-visible to .reveal elements
   - FAQ: accordion (single item open) + General/Pricing tabs
   ========================================================================== */

(() => {
  // --- Google Ads conversion tracking -------------------------------------------
  // Fires once, only after a form genuinely sends (json.success true), never on
  // page load or a failed submit. Requires the gtag.js loader in <head> (added
  // site-wide) PLUS the real ID below from Edgar's Google Ads account.
  // 2026-07-23: edwebmedia.com Google Ads was running with zero conversion
  // tracking — clicks were measured, leads were not. This closes that gap.
  const GOOGLE_ADS_CONVERSION = {
    id: 'AW-16948063813',        // "Submit lead form" conversion action, Edweb Media Google Ads
    label: 'tpRLCIWp79QcEMXcu5E_',
  };
  function fireAdsConversion() {
    if (typeof gtag !== 'function') return; // gtag.js blocked/not loaded — fail silent, never break the form
    gtag('event', 'conversion', { send_to: `${GOOGLE_ADS_CONVERSION.id}/${GOOGLE_ADS_CONVERSION.label}` });
  }

  // --- Sticky header background -------------------------------------------------
  const header = document.getElementById('site-header');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // --- Mobile nav toggle -----------------------------------------------------
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  // Close mobile menu after choosing a link
  nav.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // --- Scroll reveal animations -----------------------------------------------
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => observer.observe(el));

    // Never leave content invisible if the observer doesn't fire — e.g. a stalled
    // scroll, an in-view element that never crosses the threshold, or an environment
    // where scroll events don't reach the observer.
    const revealInView = () => {
      revealEls.forEach((el) => {
        if (el.classList.contains('is-visible')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    };
    window.addEventListener('scroll', revealInView, { passive: true });
    window.addEventListener('resize', revealInView, { passive: true });
    revealInView();
    // Safety sweep: guarantee nothing stays hidden even if scrolling never fires.
    window.addEventListener('load', () => {
      window.setTimeout(() => {
        revealEls.forEach((el) => el.classList.add('is-visible'));
      }, 2000);
    });
  } else {
    // Fallback: show everything immediately if IntersectionObserver isn't supported
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // --- FAQ accordion -----------------------------------------------------------
  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isOpen = item.getAttribute('data-open') === 'true';

      // Close any other open item within the same panel
      const panel = item.closest('.faq-panel');
      panel.querySelectorAll('.faq-item[data-open="true"]').forEach((openItem) => {
        if (openItem !== item) {
          openItem.setAttribute('data-open', 'false');
          openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          openItem.querySelector('.faq-answer').style.maxHeight = null;
        }
      });

      const nextState = !isOpen;
      item.setAttribute('data-open', String(nextState));
      question.setAttribute('aria-expanded', String(nextState));
      answer.style.maxHeight = nextState ? `${answer.scrollHeight}px` : null;
    });
  });

  // Package pre-fill from ?package= is handled inside the MSF block below,
  // where it can pre-select the service, website type and plan, then jump
  // the visitor straight to the details step.

  // --- Multi-step form (MSF) ---------------------------------------------------
  (function () {
    const msf = document.getElementById('msf');
    if (!msf) return;

    const form = document.getElementById('msf-form');
    const steps = msf.querySelectorAll('.msf-step');
    const connectors = msf.querySelectorAll('.msf-connector');
    const panels = msf.querySelectorAll('.msf-panel');
    let current = 1;

    function goTo(next, skipScroll) {
      panels.forEach((p) => p.classList.remove('is-active'));
      msf.querySelector(`[data-panel="${next}"]`).classList.add('is-active');

      steps.forEach((s, i) => {
        const n = i + 1;
        s.classList.toggle('is-active', n === next);
        s.classList.toggle('is-done', n < next);
      });
      connectors.forEach((c, i) => {
        c.classList.toggle('is-done', i + 1 < next);
      });

      current = next;
      if (!skipScroll) msf.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Show/hide Web Design sub-options
    const webDesignChk = document.getElementById('chk-webdesign');
    const webDesignOpts = document.getElementById('msf-webdesign-options');
    if (webDesignChk && webDesignOpts) {
      webDesignChk.addEventListener('change', () => {
        webDesignOpts.hidden = !webDesignChk.checked;
        if (!webDesignChk.checked) {
          form.querySelectorAll('input[name="website-type"]').forEach((r) => (r.checked = false));
          const seoChk = document.getElementById('chk-seo');
          if (seoChk) seoChk.checked = false;
        }
      });
    }

    const MONTHLY_SERVICES = ['App Development', 'Google Ads', 'Digital Marketing'];

    function buildBudgetOptions() {
      const selected    = [...form.querySelectorAll('input[name="services"]:checked')].map((c) => c.value);
      const hasMonthly  = selected.some((s) => MONTHLY_SERVICES.includes(s));
      const hasBranding = selected.includes('Branding');
      const hasVisual   = selected.includes('Visual Content');
      const hasWebsite  = selected.includes('Website Design');
      const websiteType = form.querySelector('input[name="website-type"]:checked')?.value || '';

      const budgetSel  = document.getElementById('msf-budget');
      const budgetLbl  = document.getElementById('msf-budget-label');
      const budgetSub  = document.getElementById('msf-budget-sub');
      const budgetNote = document.getElementById('msf-budget-note');

      budgetSel.value = '';
      while (budgetSel.options.length) budgetSel.remove(0);

      if (hasWebsite) {
        // --- Once-off website design — show actual plan prices ---
        budgetSub.textContent = 'All packages include basic SEO. Hosting and email are available as a separate monthly add-on.';
        budgetLbl.innerHTML = 'Which package suits you? <span aria-hidden="true">*</span>';

        if (websiteType === 'Business Website') {
          budgetNote.textContent = 'Once-off design fee. Basic SEO included in all plans.';
          [
            ['', 'Select a plan…'],
            ['Business Website — Silver Plan (R3,999)',   'Silver Plan — R3,999 once-off · 5 pages'],
            ['Business Website — Gold Plan (R4,999)',     'Gold Plan — R4,999 once-off · 10 pages'],
            ['Business Website — Platinum Plan (R6,499)', 'Platinum Plan — R6,499 once-off · 20 pages'],
            ['Not sure', "Not sure yet — let's discuss"],
          ].forEach(([v, t]) => { const o = new Option(t, v); budgetSel.add(o); });
        } else if (websiteType === 'E-Commerce Website') {
          budgetNote.textContent = 'Once-off design fee. Basic SEO included in all plans.';
          [
            ['', 'Select a plan…'],
            ['E-commerce Website — Silver Plan (R5,999)',   'Silver Plan — R5,999 once-off · up to 10 products'],
            ['E-commerce Website — Gold Plan (R7,499)',     'Gold Plan — R7,499 once-off · up to 25 products'],
            ['E-commerce Website — Platinum Plan (R9,499)', 'Platinum Plan — R9,499 once-off · up to 50 products'],
            ['Not sure', "Not sure yet — let's discuss"],
          ].forEach(([v, t]) => { const o = new Option(t, v); budgetSel.add(o); });
        } else if (websiteType === 'Directory Website') {
          budgetNote.textContent = 'Once-off design fee. Final price may vary based on features and requirements.';
          [
            ['', 'Select a plan…'],
            ['Directory Website — Silver Plan (R8,999)',        'Silver Plan — R8,999 once-off · up to 25 listings'],
            ['Directory Website — Gold Plan (R11,999)',         'Gold Plan — R11,999 once-off · up to 50 listings'],
            ['Directory Website — Platinum Plan (from R14,999)', 'Platinum Plan — from R14,999 once-off · unlimited listings'],
            ['Not sure', "Not sure yet — let's discuss"],
          ].forEach(([v, t]) => { const o = new Option(t, v); budgetSel.add(o); });
        } else {
          budgetNote.textContent = 'Business from R3,999 · E-commerce from R5,999 · Directory from R8,999.';
          [
            ['', 'Select a plan…'],
            ['Business Website — Silver Plan (R3,999)',        'Business Silver — R3,999 once-off'],
            ['Business Website — Gold Plan (R4,999)',          'Business Gold — R4,999 once-off'],
            ['Business Website — Platinum Plan (R6,499)',      'Business Platinum — R6,499 once-off'],
            ['E-commerce Website — Silver Plan (R5,999)',      'E-commerce Silver — R5,999 once-off'],
            ['E-commerce Website — Gold Plan (R7,499)',        'E-commerce Gold — R7,499 once-off'],
            ['E-commerce Website — Platinum Plan (R9,499)',    'E-commerce Platinum — R9,499 once-off'],
            ['Directory Website — Silver Plan (R8,999)',       'Directory Silver — R8,999 once-off'],
            ['Directory Website — Gold Plan (R11,999)',        'Directory Gold — R11,999 once-off'],
            ['Directory Website — Platinum Plan (from R14,999)', 'Directory Platinum — from R14,999 once-off'],
            ['Not sure', "Not sure yet — let's discuss"],
          ].forEach(([v, t]) => { const o = new Option(t, v); budgetSel.add(o); });
        }
        if (hasBranding || hasVisual) {
          budgetNote.textContent += ' Branding and visual content quoted separately.';
        }

      } else if (!hasMonthly && (hasBranding || hasVisual)) {
        // --- Once-off branding / visual only ---
        budgetSub.textContent = 'Branding and visual content are priced as a once-off fee.';
        if (hasBranding && hasVisual) {
          budgetLbl.innerHTML = 'Estimated budget (once-off) <span aria-hidden="true">*</span>';
          budgetNote.textContent = 'Combined branding and visual content package.';
          [
            ['', 'Select a range…'],
            ['R4,000–R6,000', 'R4,000 – R6,000'],
            ['R6,000–R10,000', 'R6,000 – R10,000'],
            ['R10,000–R15,000', 'R10,000 – R15,000'],
            ['R15,000+', 'R15,000+'],
            ['Not sure', 'Not sure yet — let\'s discuss'],
          ].forEach(([v, t]) => { const o = new Option(t, v); budgetSel.add(o); });
        } else if (hasBranding) {
          budgetLbl.innerHTML = 'Branding budget (once-off) <span aria-hidden="true">*</span>';
          budgetNote.textContent = 'Logo, identity and brand assets — paid once, yours to keep.';
          [
            ['', 'Select a range…'],
            ['Under R500', 'Under R500'],
            ['R500–R1,000', 'R500 – R1,000'],
            ['R1,000–R2,000', 'R1,000 – R2,000'],
            ['R2,000–R5,000', 'R2,000 – R5,000'],
            ['R5,000+', 'R5,000+'],
            ['Not sure', 'Not sure yet — let\'s discuss'],
          ].forEach(([v, t]) => { const o = new Option(t, v); budgetSel.add(o); });
        } else {
          budgetLbl.innerHTML = 'Visual content budget (once-off) <span aria-hidden="true">*</span>';
          budgetNote.textContent = 'Professional photography and video — priced per project.';
          [
            ['', 'Select a range…'],
            ['R4,000–R6,000', 'R4,000 – R6,000'],
            ['R6,000–R8,000', 'R6,000 – R8,000'],
            ['R8,000–R12,000', 'R8,000 – R12,000'],
            ['R12,000+', 'R12,000+'],
            ['Not sure', 'Not sure yet — let\'s discuss'],
          ].forEach(([v, t]) => { const o = new Option(t, v); budgetSel.add(o); });
        }

      } else {
        // --- Monthly (App Dev, Ads, Marketing) ---
        budgetSub.textContent = 'App development and marketing services are quoted based on your requirements.';
        budgetLbl.innerHTML = 'Monthly budget <span aria-hidden="true">*</span>';
        budgetNote.textContent = (hasBranding || hasVisual)
          ? 'Branding and visual content will be quoted separately as a once-off fee.'
          : '';
        [
          ['', 'What can you comfortably pay per month?'],
          ['Under R500/mo', 'Under R500 / month'],
          ['R500–R1,000/mo', 'R500 – R1,000 / month'],
          ['R1,000–R2,000/mo', 'R1,000 – R2,000 / month'],
          ['R2,000–R3,500/mo', 'R2,000 – R3,500 / month'],
          ['R3,500+/mo', 'R3,500+ / month'],
          ['Not sure/mo', 'Not sure yet — let\'s discuss'],
        ].forEach(([v, t]) => { const o = new Option(t, v); budgetSel.add(o); });
      }
    }

    // Next buttons
    msf.querySelectorAll('[data-msf-next]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = Number(btn.dataset.msfNext);
        if (step === 1) {
          const err = document.getElementById('msf-err-1');
          const checked = form.querySelectorAll('input[name="services"]:checked');
          if (checked.length === 0) { err.textContent = 'Please select at least one service.'; return; }
          const webChecked = form.querySelector('#chk-webdesign:checked');
          if (webChecked) {
            const typeSelected = form.querySelector('input[name="website-type"]:checked');
            if (!typeSelected) { err.textContent = 'Please choose a website type — Business, E-Commerce or Directory.'; return; }
          }
          err.textContent = '';
          buildBudgetOptions();
        }
        if (step === 2) {
          const err = document.getElementById('msf-err-2');
          const budget = document.getElementById('msf-budget');
          const msg = document.getElementById('msf-message');
          if (!budget.value) { err.textContent = 'Please select a budget range.'; budget.focus(); return; }
          if (!msg.value.trim()) { err.textContent = 'Please tell us about your business.'; msg.focus(); return; }
          err.textContent = '';
        }
        goTo(step + 1);
      });
    });

    // Back buttons
    msf.querySelectorAll('[data-msf-prev]').forEach((btn) => {
      btn.addEventListener('click', () => goTo(Number(btn.dataset.msfPrev) - 1));
    });

    // Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('msf-err-3');
      const first = document.getElementById('msf-first');
      const last = document.getElementById('msf-last');
      const email = document.getElementById('msf-email');

      if (!first.value.trim() || !last.value.trim()) {
        err.textContent = 'Please enter your first and last name.';
        (first.value.trim() ? last : first).focus();
        return;
      }
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        err.textContent = 'Please enter a valid email address.';
        email.focus();
        return;
      }
      err.textContent = '';

      const submit = document.getElementById('msf-submit');
      submit.classList.add('is-loading');
      submit.disabled = true;

      // Collect all form data
      const data = new FormData(form);
      const services = [...form.querySelectorAll('input[name="services"]:checked')].map((cb) => cb.value);
      data.set('services', services.join(', '));
      const addons = [...form.querySelectorAll('input[name="addons"]:checked')].map((cb) => cb.value);
      data.set('addons', addons.join(', '));

      try {
        const payload = {
          type: 'contact',
          first_name: data.get('first-name'),
          last_name:  data.get('last-name'),
          email:      data.get('email'),
          phone:      data.get('phone'),
          services:   data.get('services'),
          addons:     data.get('addons'),
          budget:     data.get('budget'),
          timeline:   data.get('timeline'),
          message:    data.get('message'),
          package:    data.get('package'),
          company: (document.getElementById('company')?.value || '').trim(),
        };
        const res  = await fetch('/api/send-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed');
        fireAdsConversion();
        form.hidden = true;
        msf.querySelector('.msf-steps').hidden = true;
        document.getElementById('msf-success').removeAttribute('hidden');
      } catch (_) {
        err.textContent = 'Something went wrong. Please try again or email us directly at info@edwebmedia.com';
        submit.classList.remove('is-loading');
        submit.disabled = false;
      }
    });

    // --- Deep pre-fill from ?package= (Get Started buttons on Pricing) ---------
    (function prefillFromPackage() {
      const selected = new URLSearchParams(window.location.search).get('package');
      if (!selected) return;

      // Clean display label — no em-dash in visible copy
      const pretty = selected.replace(/\s+[—–-]\s+/g, ' · ');

      // Carry the exact plan through to the email + pre-write the message
      const pkgInput = document.getElementById('msf-package');
      if (pkgInput) pkgInput.value = selected;
      const msgEl = document.getElementById('msf-message');
      if (msgEl && !msgEl.value) {
        msgEl.value = `Hi, I'm interested in the ${pretty} package. Please let me know the next steps.`;
      }

      // Confirmation banner at the top of the form
      const banner = document.createElement('div');
      banner.setAttribute('role', 'status');
      banner.style.cssText = 'display:flex;align-items:center;gap:.85rem;padding:.85rem 1.05rem;margin-bottom:var(--sp-6);border:1px solid var(--border);background:var(--paper-dim);border-radius:var(--radius-md)';
      banner.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true" style="color:var(--gold);font-size:1.55rem;flex:none">check_circle</span>' +
        '<div style="flex:1;line-height:1.35;min-width:0">' +
          '<div style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:700">You\'re enquiring about</div>' +
          '<strong class="msf-prefill-name" style="font-size:var(--fs-base);color:var(--ink)"></strong>' +
        '</div>' +
        '<a href="packages.html" style="font-size:var(--fs-sm);color:var(--gold);text-decoration:underline;white-space:nowrap;flex:none">Change</a>';
      banner.querySelector('.msf-prefill-name').textContent = pretty; // textContent = no HTML injection
      msf.insertBefore(banner, msf.firstChild);

      // If it's a full website plan, pre-select service + type + plan and skip to details
      const TYPE_MAP = [
        ['Business Website',   'Business Website'],
        ['E-commerce Website', 'E-Commerce Website'],
        ['Directory Website',  'Directory Website'],
      ];
      const match = TYPE_MAP.find(([prefix]) => selected.startsWith(prefix));
      if (match && /Plan/.test(selected)) {
        if (webDesignChk)  webDesignChk.checked = true;
        if (webDesignOpts) webDesignOpts.hidden = false;
        const radio = form.querySelector('input[name="website-type"][value="' + match[1] + '"]');
        if (radio) radio.checked = true;
        buildBudgetOptions();
        const budgetSel = document.getElementById('msf-budget');
        if (budgetSel) budgetSel.value = selected;
        goTo(2, true); // land on the details step, already filled in
      }
    })();
  })();


  // --- Review card slider (Google reviews) -------------------------------------
  document.querySelectorAll('.review-card').forEach((card) => {
    let reviews = [];
    try {
      reviews = JSON.parse(card.dataset.reviews || '[]');
    } catch (err) {
      reviews = [];
    }
    if (reviews.length < 2) return;

    const slide = card.querySelector('.review-slide');
    const nameEl = slide.querySelector('.review-name');
    const quoteEl = slide.querySelector('.review-quote');
    const prevBtn = card.querySelector('.review-prev');
    const nextBtn = card.querySelector('.review-next');
    let index = 0;

    const show = (nextIndex) => {
      slide.classList.add('is-swapping');
      setTimeout(() => {
        index = nextIndex;
        nameEl.textContent = reviews[index].name;
        quoteEl.textContent = `"${reviews[index].quote}"`;
        slide.classList.remove('is-swapping');
      }, 250);
    };

    prevBtn?.addEventListener('click', () => show((index - 1 + reviews.length) % reviews.length));
    nextBtn?.addEventListener('click', () => show((index + 1) % reviews.length));
  });

  // --- Animated text cycle (hero headline word swap) ---------------------------
  document.querySelectorAll('.text-cycle').forEach((el) => {
    const words = (el.dataset.words || '').split(',').map((w) => w.trim()).filter(Boolean);
    if (words.length < 2) return;

    let index = 0;
    setInterval(() => {
      el.classList.add('is-swapping');
      setTimeout(() => {
        index = (index + 1) % words.length;
        el.textContent = words[index];
        el.classList.remove('is-swapping');
      }, 300);
    }, 2600);
  });

  // --- Schedule a call calendar -------------------------------------------------
  const calDays = document.getElementById('cal-days');
  if (calDays) {
    const monthLabel = document.getElementById('cal-month');
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    const timesWrap = document.getElementById('cal-times');
    const summary = document.getElementById('cal-summary');
    const requestBtn = document.getElementById('cal-request');

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDate = null;
    let selectedTime = null;

    const updateSummary = () => {
      if (!selectedDate) {
        summary.textContent = 'Select a date and time to continue.';
        requestBtn.classList.add('is-disabled');
        return;
      }
      const dateLabel = selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!selectedTime) {
        summary.textContent = `${dateLabel} — now pick a time.`;
        requestBtn.classList.add('is-disabled');
        return;
      }
      summary.textContent = `Requesting a call on ${dateLabel} at ${selectedTime}.`;
      requestBtn.classList.remove('is-disabled');
    };

    const renderCalendar = () => {
      monthLabel.textContent = `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
      calDays.innerHTML = '';

      const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid
      const gridStart = new Date(firstOfMonth);
      gridStart.setDate(gridStart.getDate() - startOffset);

      for (let i = 0; i < 42; i++) {
        const day = new Date(gridStart);
        day.setDate(gridStart.getDate() + i);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'scheduler-day';
        btn.textContent = String(day.getDate());

        if (day.getMonth() !== viewDate.getMonth()) btn.classList.add('is-outside');
        if (day.getTime() === today.getTime()) btn.classList.add('is-today');
        if (selectedDate && day.getTime() === selectedDate.getTime()) btn.classList.add('is-selected');

        if (day < today) {
          btn.disabled = true;
        } else {
          btn.addEventListener('click', () => {
            selectedDate = day;
            renderCalendar();
            updateSummary();
          });
        }

        calDays.appendChild(btn);
      }
    };

    times.forEach((time) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'scheduler-time';
      btn.textContent = time;
      btn.addEventListener('click', () => {
        selectedTime = time;
        timesWrap.querySelectorAll('.scheduler-time').forEach((b) => b.classList.toggle('is-selected', b === btn));
        updateSummary();
      });
      timesWrap.appendChild(btn);
    });

    prevBtn.addEventListener('click', () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      renderCalendar();
    });
    nextBtn.addEventListener('click', () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      renderCalendar();
    });

    // Step 1 → Step 2: show booking form
    requestBtn.addEventListener('click', () => {
      if (!selectedDate || !selectedTime) return;
      const dateLabel = selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      document.getElementById('booking-echo').textContent = `📅 ${dateLabel} at ${selectedTime}`;
      document.getElementById('sched-step-1').hidden = true;
      document.getElementById('booking-form').hidden = false;
    });

    // Step 2 → Step 1: go back
    document.getElementById('booking-back').addEventListener('click', () => {
      document.getElementById('booking-form').hidden = true;
      document.getElementById('sched-step-1').hidden = false;
      document.getElementById('book-err').textContent = '';
    });

    // Step 2 submit: send booking email
    document.getElementById('booking-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const dateLabel = selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const name  = document.getElementById('book-name').value.trim();
      const email = document.getElementById('book-email').value.trim();
      const phone = document.getElementById('book-phone').value.trim();
      const note  = document.getElementById('book-note').value.trim();
      const err       = document.getElementById('book-err');
      const submitBtn = document.getElementById('book-submit');
      const spinner   = document.getElementById('book-spinner');
      const label     = document.getElementById('book-submit-label');

      err.textContent = '';
      submitBtn.disabled = true;
      spinner.style.display = 'inline-block';
      label.style.opacity = '0.5';

      try {
        const res = await fetch('/api/send-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            type: 'booking',
            name,
            email,
            phone,
            meeting_date: `${dateLabel} at ${selectedTime}`,
            note: note || '',
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed');
        fireAdsConversion();

        document.getElementById('booking-form').hidden = true;
        document.getElementById('booking-success').hidden = false;
        document.getElementById('booking-success-msg').textContent =
          `We've received your request for ${dateLabel} at ${selectedTime}, ${name}.`;
      } catch (_) {
        document.getElementById('booking-success').hidden = true;
        err.textContent = 'Something went wrong. Please email us directly at info@edwebmedia.com';
        submitBtn.disabled = false;
        spinner.style.display = 'none';
        label.style.opacity = '1';
      }
    });

    renderCalendar();
    updateSummary();
  }

  // --- FAQ category tabs ---------------------------------------------------------
  const tabs = document.querySelectorAll('.faq-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');

      document.querySelectorAll('.faq-panel').forEach((panel) => {
        panel.classList.toggle('is-active', panel.id === tab.dataset.target);
      });
    });
  });

  // --- Pricing plan chooser tabs --------------------------------------------------
  const planTabs = document.querySelectorAll('.plan-chooser-item');
  planTabs.forEach((planTab) => {
    planTab.addEventListener('click', () => {
      planTabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      planTab.classList.add('is-active');
      planTab.setAttribute('aria-selected', 'true');

      document.querySelectorAll('.pricing-panel').forEach((panel) => {
        panel.hidden = panel.id !== planTab.dataset.target;
      });
    });
  });

  // --- Dashboard card (About section): tabs, dark toggle, tilt -----------------
  const dcard = document.getElementById('dcard');
  if (dcard) {
    const dToggle = document.getElementById('dtoggle');
    const dToggleIcon = document.getElementById('dtoggleIcon');
    const dTabs = document.querySelectorAll('#dtabs button');
    const dIndicator = document.getElementById('dtabsIndicator');
    const dPanels = dcard.querySelectorAll('.dpanel');
    const dTabWidth = 94;

    dToggle?.addEventListener('click', () => {
      dcard.classList.toggle('dark');
      dToggleIcon.textContent = dcard.classList.contains('dark') ? 'dark_mode' : 'light_mode';
    });

    dTabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        dTabs.forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        dIndicator.style.left = `${i * dTabWidth}px`;
        dPanels.forEach((panel) => {
          panel.classList.toggle('is-active', panel.dataset.panel === tab.dataset.tab);
        });
      });
    });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dcard.addEventListener('mousemove', (e) => {
        const rect = dcard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 6;
        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -6;
        dcard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      dcard.addEventListener('mouseenter', () => dcard.classList.add('is-hovered'));
      dcard.addEventListener('mouseleave', () => {
        dcard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        dcard.classList.remove('is-hovered');
      });
    }
  }

})();
