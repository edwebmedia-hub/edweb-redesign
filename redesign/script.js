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

  // --- Portfolio carousel ------------------------------------------------------
  document.querySelectorAll('.carousel-wrap').forEach((wrap) => {
    const track = wrap.querySelector('.carousel');
    const prevBtn = wrap.querySelector('.carousel-prev');
    const nextBtn = wrap.querySelector('.carousel-next');
    if (!track) return;

    const scrollByCard = (direction) => {
      const card = track.querySelector('.portfolio-item');
      if (!card) return;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const amount = card.getBoundingClientRect().width + gap;
      track.scrollBy({ left: direction * amount, behavior: 'smooth' });
    };

    prevBtn?.addEventListener('click', () => scrollByCard(-1));
    nextBtn?.addEventListener('click', () => scrollByCard(1));
  });

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
