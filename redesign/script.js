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

  // --- Pre-fill contact form with selected package -----------------------------
  const packageNotice = document.getElementById('package-notice');
  if (packageNotice) {
    const params = new URLSearchParams(window.location.search);
    const selectedPackage = params.get('package');
    if (selectedPackage) {
      document.getElementById('package-notice-text').textContent = selectedPackage;
      document.getElementById('package').value = selectedPackage;
      packageNotice.style.display = 'block';

      const messageEl = document.getElementById('message');
      if (messageEl && !messageEl.value) {
        messageEl.value = `Hi, I'm interested in the ${selectedPackage} package. Please let me know the next steps.`;
      }
    }
  }

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
