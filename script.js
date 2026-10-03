/* ============================================================
   Тимофей Рямбов, лендинг
   JS: Lenis momentum scroll + GSAP ScrollTrigger cinematic +
       SplitType char-reveal, reveal, FAQ, case modal, burger, counter.
   CDN-зависимости: lenis, gsap, ScrollTrigger, SplitType (defer-loaded).
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* -------------------- Lenis + GSAP boot (CDN-dependent) --------------------
   Все три библиотеки грузятся defer-ом. Ждём DOMContentLoaded + проверяем наличие.
   Если что-то не загрузилось — работаем на нативном scroll, остальной код живёт сам. */
let lenis = null;
let cinematicInited = false;
function initCinematic() {
  if (cinematicInited || reduceMotion) return;
  // Нужны минимум gsap + ScrollTrigger. Lenis / SplitType опциональны.
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  cinematicInited = true;

  // Lenis — momentum smooth scroll
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  // GSAP + ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

    // Hero ghost '26 — scrubbed parallax + scale при проходе hero
    gsap.to('.hero-ghost', {
      scale: 1.25,
      yPercent: -30,
      opacity: 0.07,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });

    // Hero stats — subtle lift при выходе из viewport
    gsap.to('.hero-stats', {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-stats',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });

  // Marquee speed-up: при scroll через hero marquee ускоряется
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    let marqueeSpeed = { v: 1 };
    gsap.to(marqueeSpeed, {
      v: 2.2,
      ease: 'none',
      scrollTrigger: {
        trigger: '.marquee',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onUpdate: () => {
          marqueeTrack.style.animationDuration = (42 / marqueeSpeed.v).toFixed(2) + 's';
        },
      },
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCinematic);
} else {
  initCinematic();
}
// GSAP/Lenis грузятся с defer — дадим им кадр осесть
window.addEventListener('load', () => { setTimeout(initCinematic, 50); });


/* -------------------- Scroll progress fallback --------------------
   Основной progress — через CSS animation-timeline: scroll().
   Этот rAF-фолбэк остаётся ТОЛЬКО для браузеров без scroll-timeline. */
const progress = document.getElementById('scrollProgress');
const supportsScrollTimeline = CSS.supports('animation-timeline', 'scroll()');

if (progress && !supportsScrollTimeline) {
  let scrollRaf = null;
  const update = () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const p = docH > 0 ? Math.min(1, Math.max(0, window.scrollY / docH)) : 0;
    progress.style.transform = `scaleX(${p.toFixed(4)})`;
    scrollRaf = null;
  };
  window.addEventListener('scroll', () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(update);
  }, { passive: true });
  update();
}


/* -------------------- Word-mask reveal — hero + все section headlines -------------------- */
function splitWords(root, { wrapLines = false } = {}) {
  // Оборачиваем каждое слово в .w, пробелы оставляем текстом
  const scopes = wrapLines ? root.querySelectorAll('.line') : [root];
  scopes.forEach((scope) => {
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const w = document.createElement('span');
            w.className = 'w';
            w.textContent = part;
            frag.appendChild(w);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // .accent само становится «словом», не трогаем его потроха
        // (иначе gradient на background-clip: text ломается)
        if (node.classList.contains('accent')) {
          node.classList.add('w');
          return;
        }
        Array.from(node.childNodes).forEach(walk);
      }
    };
    Array.from(scope.childNodes).forEach(walk);
  });
}

/* Hero: SplitType + GSAP character-level (если доступны), иначе CSS word fallback.
   Guard: вызываем до тех пор пока не inited; если CDN отвалился — через 1.5с CSS-путь. */
let heroInited = false;
function initHeroReveal() {
  if (heroInited) return;
  const title = document.querySelector('[data-hero-reveal]');
  if (!title) return;

  if (reduceMotion) {
    title.classList.add('is-visible');
    heroInited = true;
    return;
  }

  // GSAP + SplitType path: character-level reveal с blur + rotateX
  if (typeof gsap !== 'undefined' && typeof SplitType !== 'undefined') {
    title.querySelectorAll('.accent').forEach(a => a.classList.add('splittype-ignore'));
    new SplitType(title, {
      types: 'lines,words,chars',
      tagName: 'span',
      lineClass: 'line',
      wordClass: 'w',
      charClass: 'ch',
    });
    gsap.from(title.querySelectorAll('.ch, .splittype-ignore'), {
      opacity: 0,
      yPercent: 110,
      rotateX: -70,
      filter: 'blur(8px)',
      transformOrigin: '50% 100%',
      stagger: { amount: 0.9, from: 'start' },
      duration: 1.1,
      ease: 'power3.out',
      delay: 0.15,
    });
    title.classList.add('is-visible');
    heroInited = true;
  }
}

function heroFallback() {
  if (heroInited) return;
  const title = document.querySelector('[data-hero-reveal]');
  if (!title) return;
  splitWords(title, { wrapLines: true });
  title.querySelectorAll('.w').forEach((w, i) => { w.style.transitionDelay = (i * 70) + 'ms'; });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => title.classList.add('is-visible'));
  });
  heroInited = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroReveal);
} else {
  initHeroReveal();
}
window.addEventListener('load', () => { setTimeout(initHeroReveal, 60); });
// Если CDN отвалился — через 1.5с запускаем CSS-путь, чтобы hero не остался пустым
setTimeout(heroFallback, 1500);

/* Section headlines: разбить и анимировать при входе в viewport */
(function () {
  const headlines = document.querySelectorAll('.section-head h2, .contact-head h2');
  if (!headlines.length) return;
  headlines.forEach((h) => {
    splitWords(h);
    h.querySelectorAll('.w').forEach((w, i) => { w.style.transitionDelay = (i * 50) + 'ms'; });
  });
  if (reduceMotion) {
    headlines.forEach((h) => h.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
  headlines.forEach((h) => io.observe(h));
})();


/* -------------------- Case screenshots: clip reveal on enter -------------------- */
const caseShotIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-in');
      caseShotIO.unobserve(entry.target);
    }
  });
}, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.case-shot').forEach((shot) => caseShotIO.observe(shot));


/* -------------------- Magnetic hover (только [data-magnetic], не трогаем .pc-btn/.case-link
   у которых свой hover-transform — иначе два transition дерутся за transform и дёргают) -------- */
if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
  const magnets = document.querySelectorAll('[data-magnetic]');
  magnets.forEach((el) => {
    const strength = 0.3;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
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
