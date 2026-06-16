/* ==========================================================================
   Edweb Media — redesign interactions
   - Header: switches to a solid/blurred background after scrolling past hero
   - Mobile nav: simple toggle
   - Scroll reveal: IntersectionObserver adds .is-visible to .reveal elements
   - FAQ: accordion (single item open) + General/Pricing tabs
   ========================================================================== */

(() => {
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

  // --- Pre-fill MSF with selected package from URL ?package= ------------------
  (function () {
    const params = new URLSearchParams(window.location.search);
    const selectedPackage = params.get('package');
    if (!selectedPackage) return;
    const pkgInput = document.getElementById('msf-package');
    if (pkgInput) pkgInput.value = selectedPackage;
    const msgEl = document.getElementById('msf-message');
    if (msgEl && !msgEl.value) {
      msgEl.value = `Hi, I'm interested in the ${selectedPackage} package. Please let me know the next steps.`;
    }
  })();

  // --- Multi-step form (MSF) ---------------------------------------------------
  (function () {
    const msf = document.getElementById('msf');
    if (!msf) return;

    const form = document.getElementById('msf-form');
    const steps = msf.querySelectorAll('.msf-step');
    const connectors = msf.querySelectorAll('.msf-connector');
    const panels = msf.querySelectorAll('.msf-panel');
    let current = 1;

    function goTo(next) {
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
      msf.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

    const MONTHLY_SERVICES = ['Website Design', 'App Development', 'Google Ads', 'Digital Marketing'];
    const ONCEOF_SERVICES  = ['Branding', 'Visual Content'];

    function buildBudgetOptions() {
      const selected = [...form.querySelectorAll('input[name="services"]:checked')].map((c) => c.value);
      const hasMonthly  = selected.some((s) => MONTHLY_SERVICES.includes(s));
      const hasBranding = selected.includes('Branding');
      const hasVisual   = selected.includes('Visual Content');
      const onceOffOnly = !hasMonthly && (hasBranding || hasVisual);

      const budgetSel  = document.getElementById('msf-budget');
      const budgetLbl  = document.getElementById('msf-budget-label');
      const budgetSub  = document.getElementById('msf-budget-sub');
      const budgetNote = document.getElementById('msf-budget-note');

      budgetSel.value = '';

      // Clear existing options (keep placeholder)
      while (budgetSel.options.length) budgetSel.remove(0);

      if (onceOffOnly) {
        // --- Once-off only ---
        budgetSub.textContent = 'Branding and visual content are priced as a once-off fee.';

        if (hasBranding && hasVisual) {
          budgetLbl.innerHTML = 'Estimated budget (once-off) <span aria-hidden="true">*</span>';
          budgetNote.textContent = 'Combined branding and visual content package.';
          [
            ['', 'Select a range…'],
            ['R4 000–R6 000', 'R4 000 – R6 000'],
            ['R6 000–R10 000', 'R6 000 – R10 000'],
            ['R10 000–R15 000', 'R10 000 – R15 000'],
            ['R15 000+', 'R15 000+'],
            ['Not sure', 'Not sure yet — let\'s discuss'],
          ].forEach(([v, t]) => { const o = new Option(t, v); budgetSel.add(o); });
        } else if (hasBranding) {
          budgetLbl.innerHTML = 'Branding budget (once-off) <span aria-hidden="true">*</span>';
          budgetNote.textContent = 'Logo, identity and brand assets — paid once, yours to keep.';
          [
            ['', 'Select a range…'],
            ['Under R500', 'Under R500'],
            ['R500–R1 000', 'R500 – R1 000'],
            ['R1 000–R2 000', 'R1 000 – R2 000'],
            ['R2 000–R5 000', 'R2 000 – R5 000'],
            ['R5 000+', 'R5 000+'],
            ['Not sure', 'Not sure yet — let\'s discuss'],
          ].forEach(([v, t]) => { const o = new Option(t, v); budgetSel.add(o); });
        } else if (hasVisual) {
          budgetLbl.innerHTML = 'Visual content budget (once-off) <span aria-hidden="true">*</span>';
          budgetNote.textContent = 'Professional photography and video — priced per project.';
          [
            ['', 'Select a range…'],
            ['R4 000–R6 000', 'R4 000 – R6 000'],
            ['R6 000–R8 000', 'R6 000 – R8 000'],
            ['R8 000–R12 000', 'R8 000 – R12 000'],
            ['R12 000+', 'R12 000+'],
            ['Not sure', 'Not sure yet — let\'s discuss'],
          ].forEach(([v, t]) => { const o = new Option(t, v); budgetSel.add(o); });
        }

      } else {
        // --- Monthly (with optional once-off add-ons) ---
        budgetSub.textContent = 'Our website, app and marketing services run on a simple monthly fee — no large upfront costs.';
        budgetLbl.innerHTML = 'Monthly budget <span aria-hidden="true">*</span>';
        if (hasBranding || hasVisual) {
          budgetNote.textContent = 'Branding and visual content will be quoted separately as a once-off fee.';
        } else {
          budgetNote.textContent = '';
        }
        [
          ['', 'What can you comfortably pay per month?'],
          ['Under R500/mo', 'Under R500 / month'],
          ['R500–R1 000/mo', 'R500 – R1 000 / month'],
          ['R1 000–R2 000/mo', 'R1 000 – R2 000 / month'],
          ['R2 000–R3 500/mo', 'R2 000 – R3 500 / month'],
          ['R3 500+/mo', 'R3 500+ / month'],
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
            if (!typeSelected) { err.textContent = 'Please choose a website type — Business or E-Commerce.'; return; }
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

      try {
        // Replace the action URL below with your real endpoint (Formspree, Netlify, etc.)
        // For now we simulate a 1-second network request
        await new Promise((res) => setTimeout(res, 1000));
        form.hidden = true;
        msf.querySelector('.msf-steps').hidden = true;
        document.getElementById('msf-success').removeAttribute('hidden');
      } catch (_) {
        err.textContent = 'Something went wrong. Please try again or email us directly.';
        submit.classList.remove('is-loading');
        submit.disabled = false;
      }
    });
  })();

  // --- Portfolio carousel -------------------------------------------------------
  const carousel = document.getElementById('portfolio-carousel');
  if (carousel) {
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const scrollByCard = (dir) => {
      const card = carousel.querySelector('.portfolio-item');
      if (!card) return;
      carousel.scrollBy({ left: dir * (card.offsetWidth + 24), behavior: 'smooth' });
    };
    prevBtn?.addEventListener('click', () => scrollByCard(-1));
    nextBtn?.addEventListener('click', () => scrollByCard(1));
  }

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

    requestBtn.addEventListener('click', (e) => {
      if (!selectedDate || !selectedTime) {
        e.preventDefault();
        return;
      }
      const dateLabel = selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const messageEl = document.getElementById('message');
      if (messageEl) {
        messageEl.value = `Hi, I'd like to request a call on ${dateLabel} at ${selectedTime}. Please confirm if this time works.`;
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
})();
