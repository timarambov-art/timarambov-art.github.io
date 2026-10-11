(() => {
  'use strict';

  const root = document.documentElement;
  const nav = document.querySelector('.nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────── Reveal on scroll ───────── */
  const REVEAL_SELECTOR = [
    '.section-head', '.for-card', '.pain', '.assort', '.process li', '.geo-map', '.geo-table-wrap',
    '.case', '.review', '.guar', '.doc', '.calc-copy', '.calc-form', '.faq-side', '.faq-item',
    '.lead-card', '.contact-copy', '.contact-map', '.trustbar-top'
  ].join(',');

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        // элементы, которые остались выше экрана (прыжок по якорю), показываем сразу
        if (!e.isIntersecting && e.boundingClientRect.top >= 0) continue;
        const el = e.target;
        el.classList.add('in');
        io.unobserve(el);
        // после показа снимаем reveal: иначе его transition и inline-delay
        // тормозят hover на карточках
        const delay = parseFloat(el.style.transitionDelay) || 0;
        window.setTimeout(() => {
          el.classList.remove('reveal');
          el.style.transitionDelay = '';
        }, 900 + delay);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    // stagger считается внутри родителя, а не по всей странице
    const counters = new WeakMap();
    document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
      const parent = el.parentElement;
      const n = counters.get(parent) || 0;
      counters.set(parent, n + 1);
      el.classList.add('reveal');
      el.style.transitionDelay = `${Math.min(n * 70, 280)}ms`;
      io.observe(el);
    });
  }

  /* ───────── Mobile menu ───────── */
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('menu');
  const desktopQuery = window.matchMedia('(min-width: 761px)');
  let menuOpen = false;

  function setMenu(open, { restoreFocus = true } = {}) {
    if (!burger || !menu || open === menuOpen) return;
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.setAttribute('aria-hidden', String(!open));
    if (open) {
      menu.focus({ preventScroll: true });
    } else if (restoreFocus) {
      burger.focus({ preventScroll: true });
    }
  }

  if (burger && menu) {
    burger.addEventListener('click', () => setMenu(!menuOpen));

    // клик по пустому месту оверлея (вне ссылок и кнопок) закрывает меню
    menu.addEventListener('click', (e) => {
      if (!e.target.closest('a, button')) setMenu(false);
    });

    document.addEventListener('keydown', (e) => {
      if (!menuOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenu(false);
        return;
      }
      // фокус-ловушка: Tab ходит по кругу burger → ссылки меню
      if (e.key === 'Tab') {
        const items = [burger, ...menu.querySelectorAll('a[href]')];
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === menu)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // растянули окно / повернули планшет: меню больше не нужно
    const onViewport = (e) => { if (e.matches) setMenu(false, { restoreFocus: false }); };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onViewport);
    else desktopQuery.addListener(onViewport);
  }

  /* ───────── Anchor scroll (sticky nav offset) ───────── */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length <= 1) return;
    let target = null;
    try { target = document.querySelector(id); } catch (_) { return; }
    if (!target) return;
    e.preventDefault();
    // сначала снимаем блокировку скролла, потом едем
    if (menuOpen) setMenu(false, { restoreFocus: false });
    const y = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight + 1;
    window.scrollTo({ top: Math.max(y, 0), behavior: reduceMotion ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* ───────── FAQ accordion ───────── */
  const faq = document.querySelector('.faq');
  if (faq) {
    const triggers = Array.from(faq.querySelectorAll('.faq-trigger'));

    const toggle = (trigger, force) => {
      const open = typeof force === 'boolean' ? force : trigger.getAttribute('aria-expanded') !== 'true';
      trigger.setAttribute('aria-expanded', String(open));
      trigger.closest('.faq-item').classList.toggle('is-open', open);
    };

    faq.addEventListener('click', (e) => {
      const trigger = e.target.closest('.faq-trigger');
      if (trigger) toggle(trigger);
    });

    // клавиатура по паттерну APG: стрелки, Home, End
    faq.addEventListener('keydown', (e) => {
      const trigger = e.target.closest('.faq-trigger');
      if (!trigger) return;
      const i = triggers.indexOf(trigger);
      let next = -1;
      if (e.key === 'ArrowDown') next = (i + 1) % triggers.length;
      else if (e.key === 'ArrowUp') next = (i - 1 + triggers.length) % triggers.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = triggers.length - 1;
      if (next > -1) {
        e.preventDefault();
        triggers[next].focus();
      }
    });
  }

  /* ───────── Geo: карта ↔ таблица ───────── */
  const geo = document.querySelector('.geo');
  if (geo) {
    const linked = geo.querySelectorAll('[data-geo]');
    let pinned = null;

    const setActive = (key) => {
      linked.forEach((el) => el.classList.toggle('is-active', key !== null && el.dataset.geo === key));
    };

    geo.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      const el = e.target.closest('[data-geo]');
      setActive(el ? el.dataset.geo : pinned);
    });
    geo.addEventListener('pointerleave', () => setActive(pinned));

    // клик/тап закрепляет выбор (на тач-экранах это единственный способ)
    geo.addEventListener('click', (e) => {
      const el = e.target.closest('[data-geo]');
      if (!el) return;
      pinned = pinned === el.dataset.geo ? null : el.dataset.geo;
      setActive(pinned);
    });
  }

  /* ───────── Avatars: инициал из имени, если не задан ───────── */
  document.querySelectorAll('.review').forEach((card) => {
    const avatar = card.querySelector('.avatar');
    const nameEl = card.querySelector('.review-name');
    if (!avatar || !nameEl) return;
    const given = avatar.textContent.trim();
    const name = nameEl.textContent.trim();
    if ((given && !given.includes('{{')) || !name || name.includes('{{')) return;
    const first = Array.from(name)[0];
    avatar.textContent = first ? first.toUpperCase() : '';
  });

  /* ───────── File input label ───────── */
  const fileInput = document.querySelector('.file input[type="file"]');
  const fileFace = document.querySelector('.file-face');
  if (fileInput && fileFace) {
    const idle = fileFace.textContent;
    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      fileFace.textContent = f ? `✓ ${f.name}` : idle;
    });
  }

  /* ───────── MOTION LAYER ─────────
     Входные анимации hero / метрик / таймлайна. Сами keyframes лежат в styles.css
     (секция MOTION LAYER), здесь только то, что CSS не умеет: разбить текст на слова,
     посчитать числа и дождаться появления блока в экране.
     При prefers-reduced-motion весь блок не выполняется, страница остаётся статичной. */
  const canAnimate = !reduceMotion;
  const hasIO = 'IntersectionObserver' in window;

  // один раз вызывает cb, когда элемент впервые попал в экран
  function onView(el, cb, threshold) {
    if (!hasIO) { cb(); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      cb();
    }, { threshold: threshold || 0.25 });
    io.observe(el);
  }

  // «армируем» блок (CSS прячет .will-in) и снимаем, когда блок виден
  function armOnView(el, threshold) {
    if (!el || !hasIO) return;
    el.classList.add('will-in');
    onView(el, () => {
      el.classList.remove('will-in');
      el.classList.add('is-in');
    }, threshold);
  }

  if (canAnimate) {
    /* Hero h1: слова как inline-block, задержка --wi считается в CSS (stagger 45 мс) */
    const h1 = document.querySelector('.hero .h1');
    if (h1) {
      let idx = 0;
      const wrapWords = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
                return;
              }
              const w = document.createElement('span');
              w.className = 'w';
              w.style.setProperty('--wi', String(idx++));
              w.textContent = part;
              frag.appendChild(w);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
            wrapWords(child);
          }
        });
      };
      wrapWords(h1);
    }

    /* Hero card и таймлайн «Как работаем»: появление запускаем по факту видимости */
    armOnView(document.querySelector('.hero-card'), 0.2);
    armOnView(document.querySelector('.process'), 0.2);

    /* Счётчики метрик: 12 000 т, 340+, 18 лет (number ticker, ease-out expo, 900 мс) */
    const meta = document.querySelector('.hero-meta');
    if (meta) {
      const fmt = new Intl.NumberFormat('ru-RU');
      const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
      const items = [];

      meta.querySelectorAll('strong').forEach((el) => {
        const raw = el.textContent;
        const m = raw.match(/^(\d+(?:[\s ]\d{3})*)([\s\S]*)$/);
        if (!m) return;
        const target = parseInt(m[1].replace(/[\s ]/g, ''), 10);
        const suffix = m[2];
        const fmtNum = (n) => fmt.format(n).replace(/\s/g, ' ');

        // анимируемый текст скрыт от скринридеров, итоговое значение читается из sr-only
        const num = document.createElement('span');
        num.className = 'count';
        num.setAttribute('aria-hidden', 'true');
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = raw;
        el.textContent = '';
        el.append(num, sr);

        const paint = (n) => { num.textContent = fmtNum(n) + suffix; };
        paint(0);
        items.push({ target, paint, final: raw, num });
      });

      const run = () => {
        const DURATION = 900;
        const t0 = performance.now();
        const frame = (now) => {
          const p = Math.min((now - t0) / DURATION, 1);
          const k = easeOutExpo(p);
          items.forEach((it) => it.paint(Math.round(it.target * k)));
          if (p < 1) requestAnimationFrame(frame);
          else items.forEach((it) => { it.num.textContent = it.final; });
        };
        requestAnimationFrame(frame);
      };

      if (items.length) {
        // если блок виден сразу при загрузке, ждём конца входной анимации hero (~700 мс)
        onView(meta, () => window.setTimeout(run, Math.max(0, 700 - performance.now())), 0.6);
      }
    }
  }

  /* ───────── Exit-intent / scroll popup ───────── */
  const popup = document.getElementById('popup');
  if (popup) {
    const STORAGE_KEY = 'rezerv_popup_seen';
    const COOLDOWN_DAYS = 7;
    const SCROLL_TRIGGER = 0.5;
    const TIME_TRIGGER_MS = 30000;
    const isMobile = window.matchMedia('(max-width: 760px)');

    const seenAt = () => {
      try { return parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0; }
      catch (_) { return 0; }
    };
    const markSeen = () => {
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (_) {}
    };
    const cooldownActive = () => (Date.now() - seenAt()) < COOLDOWN_DAYS * 86400000;

    let opened = false;
    let lastFocus = null;
    const dialog = popup.querySelector('.popup-dialog');
    const formView = popup.querySelector('.popup-main');
    const successView = popup.querySelector('.popup-success');
    const popupForm = document.getElementById('popup-form');

    const open = () => {
      if (opened || cooldownActive()) return;
      opened = true;
      markSeen();
      lastFocus = document.activeElement;
      popup.classList.add('is-open');
      popup.setAttribute('aria-hidden', 'false');
      root.classList.add('popup-open');
      document.body.style.overflow = 'hidden';
      window.setTimeout(() => dialog && dialog.focus({ preventScroll: true }), 50);
    };
    const close = (reason) => {
      if (!opened) return;
      opened = false;
      popup.classList.remove('is-open');
      popup.setAttribute('aria-hidden', 'true');
      root.classList.remove('popup-open');
      document.body.style.overflow = '';
      if (lastFocus && reason !== 'cta') lastFocus.focus({ preventScroll: true });
    };

    popup.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-popup-close]');
      if (btn) {
        if (!btn.hasAttribute('href')) e.preventDefault();
        close(btn.dataset.popupClose);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (opened && e.key === 'Escape') { e.preventDefault(); close('esc'); }
    });

    if (popupForm) {
      popupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = popupForm.querySelector('[name="email"]');
        const turnover = popupForm.querySelector('[name="turnover"]');
        const emailErr = popupForm.querySelector('#popup-email-err');
        const turnErr = popupForm.querySelector('#popup-turnover-err');
        let ok = true;
        if (emailErr) emailErr.textContent = '';
        if (turnErr) turnErr.textContent = '';
        if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
          if (emailErr) emailErr.textContent = 'Проверьте формат e-mail';
          email.focus();
          ok = false;
        }
        if (ok && (!turnover.value)) {
          if (turnErr) turnErr.textContent = 'Выберите оборот';
          turnover.focus();
          ok = false;
        }
        if (!ok) return;
        // success
        if (formView) formView.hidden = true;
        if (successView) {
          successView.hidden = false;
          successView.querySelectorAll('[data-lead-email]').forEach((el) => { el.textContent = email.value; });
          successView.focus({ preventScroll: true });
        }
      });
    }

    // триггеры
    let timeArmed = false;
    const timeTrigger = () => { timeArmed = true; open(); };
    window.setTimeout(timeTrigger, TIME_TRIGGER_MS);

    // scroll (мобилка)
    let scrollArmed = false;
    const onScroll = () => {
      if (scrollArmed || opened) return;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      if (window.scrollY / h > SCROLL_TRIGGER) {
        scrollArmed = true;
        open();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // exit-intent (десктоп) — курсор уходит за верх окна
    if (!isMobile.matches) {
      document.addEventListener('mouseout', (e) => {
        if (opened) return;
        if (e.relatedTarget || e.toElement) return;
        if (e.clientY > 10) return;
        open();
      });
    }
  }

  /* ───────── Sticky mobile CTA ───────── */
  const stickyCta = document.getElementById('sticky-cta');
  if (stickyCta) {
    const mobileQuery = window.matchMedia('(max-width: 760px)');
    const hero = document.getElementById('hero');
    const contact = document.getElementById('contact');
    let lastY = window.scrollY;
    let visible = false;
    let ticking = false;

    const show = (v) => {
      if (v === visible) return;
      visible = v;
      stickyCta.classList.toggle('is-visible', v);
    };

    const evaluate = () => {
      ticking = false;
      if (!mobileQuery.matches) { show(false); return; }
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      // не показываем пока виден hero, прячем в зоне футера/контактов
      const heroVisible = hero && hero.getBoundingClientRect().bottom > 180;
      const contactVisible = contact && contact.getBoundingClientRect().top < window.innerHeight - 80;
      if (heroVisible || contactVisible) { show(false); return; }
      // прячем при скролле вверх, показываем вниз
      if (dy < -4) show(false);
      else if (dy > 4) show(true);
    };

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(evaluate);
    }, { passive: true });
    const onViewportChange = () => evaluate();
    if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', onViewportChange);
    else mobileQuery.addListener(onViewportChange);
    evaluate();
  }
})();
