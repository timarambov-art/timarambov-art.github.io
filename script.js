/* ============================================================
   Тимофей Рямбов, лендинг
   JS: reveal, header shrink, FAQ, case modal, burger, counter
   Нативный скролл, без Lenis.
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* -------------------- Header shrink on scroll -------------------- */
const header = document.getElementById('header');
if (header) {
  const onScroll = () => {
    if (window.scrollY > 32) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}


/* -------------------- Reveal on scroll -------------------- */
const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    entry.target.querySelectorAll('[data-count]').forEach(runCounter);
    revealIO.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('[data-reveal]').forEach((el) => revealIO.observe(el));


/* -------------------- Number counter -------------------- */
function runCounter(el) {
  if (el.dataset.counted === 'yes') return;
  el.dataset.counted = 'yes';
  const target = parseFloat(el.dataset.count);
  if (isNaN(target)) return;

  const duration = 900;
  const start = performance.now();
  const isFloat = !Number.isInteger(target);

  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const value = target * eased;
    el.textContent = isFloat ? value.toFixed(1) : Math.round(value);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = isFloat ? target.toFixed(1) : target;
  };
  requestAnimationFrame(tick);
}


/* -------------------- Anchor nav: закрыть моб-меню после клика -------------------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', () => {
    closeMobileMenu();
  });
});


/* -------------------- FAQ accordion -------------------- */
document.querySelectorAll('.faq-item').forEach((item) => {
  const btn = item.querySelector('.faq-q');
  const ans = item.querySelector('.faq-a');
  if (!btn || !ans) return;

  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');

    document.querySelectorAll('.faq-item.is-open').forEach((other) => {
      if (other === item) return;
      other.classList.remove('is-open');
      const oq = other.querySelector('.faq-q');
      const oa = other.querySelector('.faq-a');
      if (oq) oq.setAttribute('aria-expanded', 'false');
      if (oa) oa.style.maxHeight = null;
    });

    if (isOpen) {
      item.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      ans.style.maxHeight = null;
    } else {
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      ans.style.maxHeight = ans.scrollHeight + 'px';
    }
  });
});

window.addEventListener('resize', () => {
  const open = document.querySelector('.faq-item.is-open .faq-a');
  if (open) open.style.maxHeight = open.scrollHeight + 'px';
});


/* -------------------- Case modal -------------------- */
const CASE_DATA = {
  alexandra: {
    title: 'Александра, LED-наращивание',
    html: `<iframe src="assets/alexandra-demo.html" title="Сайт Александры, живое демо" loading="lazy"></iframe>`,
  },
  pilipilit: {
    title: 'Салон ПилиПилить',
    html: `<img src="assets/pilipilit-hero.webp" alt="ПилиПилить, главный экран">`,
  },
  svarka: {
    title: 'SvarkaUral196',
    html: `<iframe src="https://svarkaural196.ru/" title="SvarkaUral196, живое демо" loading="lazy"></iframe>`,
  },
};

const modal       = document.getElementById('caseModal');
const modalScroll = document.getElementById('modalScroll');
const modalTitle  = document.getElementById('modalTitle');

function openCase(id) {
  const data = CASE_DATA[id];
  if (!data || !modal || !modalScroll) return;

  modalTitle.textContent = data.title;
  modalScroll.innerHTML = `<div class="cm-frame">${data.html}</div>`;
  modalScroll.scrollTop = 0;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('scroll-lock');
}

function closeCase() {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('scroll-lock');
  setTimeout(() => { if (modalScroll) modalScroll.innerHTML = ''; }, 320);
}

document.querySelectorAll('[data-open-case]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openCase(btn.dataset.openCase);
  });
});

document.querySelectorAll('.case[data-case]').forEach((card) => {
  const shot = card.querySelector('.case-shot');
  if (shot) {
    shot.style.cursor = 'pointer';
    shot.addEventListener('click', () => openCase(card.dataset.case));
  }
});

document.querySelectorAll('[data-modal-close]').forEach((el) => {
  el.addEventListener('click', closeCase);
});

document.addEventListener('keydown', (e) => {
  if (!modal || !modal.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeCase();
});


/* -------------------- Burger / mobile menu -------------------- */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

function openMobileMenu() {
  if (!burger || !mobileMenu) return;
  burger.classList.add('is-open');
  burger.setAttribute('aria-expanded', 'true');
  mobileMenu.classList.add('is-open');
  mobileMenu.setAttribute('aria-hidden', 'false');
  document.body.classList.add('scroll-lock');
}

function closeMobileMenu() {
  if (!burger || !mobileMenu) return;
  burger.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.remove('is-open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('scroll-lock');
}

if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    if (mobileMenu.classList.contains('is-open')) closeMobileMenu();
    else openMobileMenu();
  });
}
