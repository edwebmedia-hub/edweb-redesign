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

// Parallax
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

// Contact modal
const contactModal = document.getElementById('contact-modal');
if (contactModal) {
  const openModal = () => {
    contactModal.classList.add('is-open');
    document.body.classList.add('modal-open');
  };
  const closeModal = () => {
    contactModal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
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
    if (e.key === 'Escape' && contactModal.classList.contains('is-open')) closeModal();
  });
}

// Scroll-reveal
if ('IntersectionObserver' in window) {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach((el) => observer.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
}
