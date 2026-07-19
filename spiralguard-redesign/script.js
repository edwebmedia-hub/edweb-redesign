// Mobile nav toggle
const nav = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Sticky header shadow on scroll
const header = document.getElementById('site-header');
if (header) {
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Respect the visitor's reduced-motion preference for JS-driven motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Parallax (skipped entirely when reduced motion is requested)
if (!prefersReducedMotion) {
  const parallaxItems = [
    document.querySelector('.hero-bg img'),
    document.getElementById('cta-parallax-img'),
  ];
  parallaxItems.forEach(img => {
    if (!img) return;
    const section = img.closest('section');
    const update = () => {
      const rect = section.getBoundingClientRect();
      const offset = (window.innerHeight - rect.top) * 0.12;
      img.style.transform = `translateY(${offset}px)`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  });
}

// Contact form submission
const contactForm = document.querySelector('#contact-modal form');
if (contactForm) {
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;
    try {
      const fd = new FormData(contactForm);
      const res = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(fd)),
      });
      const data = await res.json();
      if (data.success) {
        contactForm.innerHTML = `<div style="text-align:center;padding:var(--sp-10) 0"><span class="material-symbols-outlined" style="font-size:48px;color:var(--accent)">check_circle</span><h3 style="margin-top:var(--sp-4)">Message sent!</h3><p style="margin-top:var(--sp-2);color:var(--text-muted)">${data.message}</p></div>`;
      } else {
        alert(data.message);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    } catch {
      alert('Something went wrong. Please try again or call us directly.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Contact modal — accessible dialog: move focus in, trap Tab, restore focus on close,
// and mark the rest of the page inert while it is open.
const contactModal = document.getElementById('contact-modal');
if (contactModal) {
  const dialog = contactModal.querySelector('.modal');
  const backgrounds = [
    document.querySelector('.skip-link'),
    document.getElementById('site-header'),
    document.getElementById('main'),
    ...document.querySelectorAll('.site-footer, .sticky-cta'),
  ].filter(Boolean);
  const focusableSel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;

  if (dialog && !dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');

  const openModal = () => {
    if (contactModal.classList.contains('is-open')) return;
    lastFocused = document.activeElement;
    contactModal.classList.add('is-open');
    document.body.classList.add('modal-open');
    backgrounds.forEach(el => el.setAttribute('inert', ''));
    // Focus the dialog itself so screen readers announce its label (aria-labelledby).
    // Double rAF so the overlay's visibility:hidden→visible flip is fully applied
    // before .focus() runs — a single frame lands too early and the focus is dropped.
    const focusTarget = dialog || contactModal;
    requestAnimationFrame(() => requestAnimationFrame(() => focusTarget.focus()));
  };
  const closeModal = () => {
    contactModal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    backgrounds.forEach(el => el.removeAttribute('inert'));
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  };

  document.querySelectorAll('[data-modal-open="contact"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });
  contactModal.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });
  contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (!contactModal.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    const focusables = [...contactModal.querySelectorAll(focusableSel)].filter(el => el.getClientRects().length);
    if (!focusables.length) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || active === dialog || !contactModal.contains(active)) { e.preventDefault(); last.focus(); }
    } else {
      if (active === last || active === dialog || !contactModal.contains(active)) { e.preventDefault(); first.focus(); }
    }
  });

  // Deep-link support: other pages (e.g. the legal pages) link to index.html#contact,
  // and there is no #contact section — open the quote modal instead of dead-ending.
  const openIfHash = () => { if (location.hash === '#contact') openModal(); };
  openIfHash();
  window.addEventListener('hashchange', openIfHash);
}

// Scroll-reveal — with fail-safes so content is never left invisible.
// (CSS hides .reveal until .is-visible; if the observer can't run, we must still show it.)
(() => {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;
  const revealAll = () => reveals.forEach((el) => el.classList.add('is-visible'));
  if (!('IntersectionObserver' in window)) { revealAll(); return; }
  let ioFired = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        ioFired = true;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach((el) => observer.observe(el));
  // If the observer never fires (backgrounded / throttled / prerendered tab), reveal
  // everything rather than leave the page blank.
  setTimeout(() => { if (!ioFired) revealAll(); }, 2500);
})();
