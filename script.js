/* ============================================================
   Тимофей Рямбов, лендинг
   JS: GSAP ScrollSmoother (free since GSAP 3.13) + ScrollTrigger
       cinematic + SplitType char-reveal, reveal, FAQ, case modal,
       burger, counter.
   CDN-зависимости: gsap, ScrollTrigger, ScrollSmoother, SplitType.
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* -------------------- GSAP + ScrollSmoother boot --------------------
   ScrollSmoother делает плавный «плыву по сайту» скролл и сам
   интегрируется со ScrollTrigger. Lenis больше не нужен. */
let cinematicInited = false;
let smoother = null;
function initCinematic() {
  if (cinematicInited || reduceMotion) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  cinematicInited = true;

  const plugins = [ScrollTrigger];
  if (typeof ScrollSmoother !== 'undefined') plugins.push(ScrollSmoother);
  gsap.registerPlugin(...plugins);

  // ScrollSmoother — физический momentum скролл, premium ощущение
  if (typeof ScrollSmoother !== 'undefined' && document.getElementById('smooth-wrapper')) {
    smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 2,
      effects: true,            // data-speed, data-lag работают из коробки
      smoothTouch: 0,           // на touch — нативный скролл
      normalizeScroll: true,    // гасит разницу между браузерами и тачпадами
    });
  }

  // Пересчёт размеров после загрузки шрифтов — убирает race, когда hero
  // headline рендерится fallback-шрифтом, потом свапается на Bodoni Moda
  // и ScrollSmoother с кэшем ломает позиции.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
      if (smoother) smoother.refresh();
    });
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

  // Marquee: ровная скорость без разгона от скролла

  const isDesktop = window.matchMedia('(min-width: 900px)').matches;

  /* ---------- Cases: pinned stacking cards.
     Секция cases закрепляется (pin), страница стоит на месте, а карточки
     одна за другой проплывают через viewport. Каждая выезжает по spiral 3D
     (rotateX/Y/Z + translate3d с Z-глубиной) слева, задерживается, уплывает
     вправо, следующая берёт её место тем же spiral entrance.
     Fallback (без GSAP) — вертикальный stack через body.no-cinematic. */
  if (isDesktop) {
    const casesWrap = document.querySelector('.cases-wrap');
    const casesTrack = document.querySelector('.cases-track');
    const cases = gsap.utils.toArray('.cases-track > .case');
    if (casesWrap && cases.length > 1) {
      // Переводим в stacked режим — через CSS классы, карточки position:absolute
      casesTrack.classList.add('is-stacked');
      document.getElementById('cases').classList.add('is-stacked-mode');
      // Отмечаем все .case и .case-shot как .is-in (clip-reveal img),
      // чтобы entrance делала только GSAP timeline, а не IO observer
      cases.forEach((c) => {
        c.classList.add('is-in');
        const shot = c.querySelector('.case-shot');
        if (shot) shot.classList.add('is-in');
      });

      // Initial state: карточка 0 на месте, остальные — в spiral-away state
      gsap.set(cases[0], {
        rotateX: 0, rotateY: 0, rotateZ: 0,
        x: 0, y: 0, z: 0, scale: 1, opacity: 1,
        pointerEvents: 'auto',
      });
      gsap.set(cases.slice(1), {
        rotateX: 22, rotateY: -42, rotateZ: -16,
        x: -300, y: 160, z: -500, scale: 0.72, opacity: 0,
        pointerEvents: 'none',
      });

      // Timeline: pin wrap, каждая смена карточки занимает 1 "scroll-кадр"
      // + hold в середине. Общая длина = (N-1) * segment * vh + hold start/end.
      const segment = 0.9; // viewport-heights per transition
      const hold = 0.5;    // viewport-heights hold after entry
      const total = hold + (cases.length - 1) * (segment + hold);

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: '#cases',       // Pin всю секцию — заголовок остаётся виден
          start: 'top top',
          end: () => `+=${window.innerHeight * total}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Hold первой карточки
      tl.to({}, { duration: hold });

      for (let i = 1; i < cases.length; i++) {
        const prev = cases[i - 1];
        const curr = cases[i];
        const label = `swap${i}`;
        tl.addLabel(label);
        // Прошлая улетает вправо (exit spiral)
        tl.to(prev, {
          rotateX: -12,
          rotateY: 32,
          rotateZ: 12,
          x: 320,
          y: -100,
          z: -400,
          scale: 0.78,
          opacity: 0,
          pointerEvents: 'none',
          duration: segment,
        }, label);
        // Текущая влетает слева (entry spiral)
        tl.to(curr, {
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          x: 0, y: 0, z: 0,
          scale: 1,
          opacity: 1,
          pointerEvents: 'auto',
          duration: segment,
        }, label);
        // Hold текущей
        tl.to({}, { duration: hold });
      }
    }
  }

  /* Services pinned через CSS sticky (см. styles.css) — JS не нужен.
     Service rows при scroll получают scrubbed-fade: приглушённые пока
     внизу viewport, активные к центру, снова приглушённые при уходе. */
  if (isDesktop) {
    gsap.utils.toArray('.svc-row').forEach((row) => {
      gsap.fromTo(row,
        { opacity: 0.35, xPercent: 2 },
        {
          opacity: 1,
          xPercent: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: row,
            start: 'top 85%',
            end: 'top 45%',
            scrub: 1,
          },
        },
      );
    });
  }

  /* ---------- Pricing active row: ряд в центре viewport получает
     amber glow + лёгкий scale. Делает прайс «кинематографичным». ---------- */
  if (isDesktop) {
    gsap.utils.toArray('.price-row').forEach((row) => {
      ScrollTrigger.create({
        trigger: row,
        start: 'top 65%',
        end: 'bottom 35%',
        toggleClass: { targets: row, className: 'is-active' },
      });
    });
  }

  /* ---------- Process giant backdrop numeral: за степами проезжает
     огромная цифра 01→02→03→04→05, scrub по scroll ---------- */
  const procNumeral = document.querySelector('.process-numeral');
  if (procNumeral && isDesktop) {
    const steps = gsap.utils.toArray('.proc-step');
    steps.forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 70%',
        end: 'bottom 30%',
        onToggle: (self) => {
          if (self.isActive) {
            procNumeral.textContent = String(i + 1).padStart(2, '0');
            procNumeral.classList.add('is-visible');
          }
        },
      });
    });
    // Параллакс самой цифры при прокрутке через process section
    gsap.to(procNumeral, {
      yPercent: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: '#process',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });
  }

  /* ---------- Scrubbed About: слова параграфов разгораются из dim в full
     по мере прокрутки viewport через about-text (Apple-style).
     Только на десктопе — на телефоне маленький viewport делает эффект
     неуправляемым, и текст застревает на dim. ---------- */
  if (isDesktop) {
    const aboutParas = document.querySelectorAll('.about-text p');
    aboutParas.forEach((p) => {
      // Разбиваем на слова, оборачиваем в .about-w
      const text = p.textContent;
      p.textContent = '';
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          p.appendChild(document.createTextNode(part));
        } else {
          const w = document.createElement('span');
          w.className = 'about-w';
          w.textContent = part;
          p.appendChild(w);
        }
      });
      gsap.fromTo(
        p.querySelectorAll('.about-w'),
        { opacity: 0.22 },
        {
          opacity: 1,
          stagger: 0.015,
          ease: 'none',
          scrollTrigger: {
            trigger: p,
            start: 'top 85%',
            end: 'top 30%',
            scrub: 1,
          },
        },
      );
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

/* Если GSAP не загрузился за 2 секунды — переключаем всё в no-cinematic режим,
   чтобы horizontal cases и pinned services не оставались сломанными. */
setTimeout(() => {
  if (!cinematicInited) {
    document.body.classList.add('no-cinematic');
  }
}, 2000);

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
/* Observer наблюдает всю .case (article) — entrance теперь spiral 3D для
   целой карточки (shot + body двигаются как один объект). Внутри shot тоже
   получает .is-in, чтобы clip-path reveal на img по-прежнему работал. */
const caseIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-in');
      const shot = entry.target.querySelector('.case-shot');
      if (shot) shot.classList.add('is-in');
      caseIO.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.cases-track > .case').forEach((c) => caseIO.observe(c));


/* -------------------- 3D tilt (data-tilt) — mouse-tracking perspective ---
   При движении курсора карточка наклоняется под перспективой, следит
   за курсором. На touch и reduce-motion отключается через CSS. */
if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    const max = parseFloat(el.dataset.tiltMax) || 6;
    // Shine рендерится DOM-child'ом, не ::after — так он не конфликтует
    // с уже занятыми псевдоэлементами (например, .case-shot::after).
    if (!el.querySelector(':scope > .tilt-shine')) {
      const shine = document.createElement('div');
      shine.className = 'tilt-shine';
      shine.setAttribute('aria-hidden', 'true');
      el.appendChild(shine);
    }
    let raf = null;
    let targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
    let targetMX = 0.5, targetMY = 0.5, curMX = 0.5, curMY = 0.5;

    function loop() {
      curRX += (targetRX - curRX) * 0.12;
      curRY += (targetRY - curRY) * 0.12;
      curMX += (targetMX - curMX) * 0.12;
      curMY += (targetMY - curMY) * 0.12;
      el.style.setProperty('--rx', curRX.toFixed(2) + 'deg');
      el.style.setProperty('--ry', curRY.toFixed(2) + 'deg');
      el.style.setProperty('--mx', curMX.toFixed(3));
      el.style.setProperty('--my', curMY.toFixed(3));
      if (Math.abs(targetRX - curRX) > 0.01 || Math.abs(targetRY - curRY) > 0.01) {
        raf = requestAnimationFrame(loop);
      } else { raf = null; }
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(loop); }

    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      targetMX = x; targetMY = y;
      targetRY = (x - 0.5) * 2 * max;     // горизонтальная мышь → rotateY
      targetRX = -(y - 0.5) * 2 * max;    // вертикальная мышь → rotateX (инвертированно)
      schedule();
    });
    el.addEventListener('mouseleave', () => {
      targetRX = 0; targetRY = 0; targetMX = 0.5; targetMY = 0.5;
      schedule();
    });
  });
}


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
