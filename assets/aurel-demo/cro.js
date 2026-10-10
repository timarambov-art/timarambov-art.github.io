/* ============================================================================
   AUREL — cro.js
   Конверсионный слой поверх лендинга. Без зависимостей, animations.js и
   script.js не трогает. Состав:
     1. Формы (hero, early access, попап): валидация, loading, подтверждение
     2. Счётчик подписчиков в hero (PLACEHOLDER, см. CONFIG.proof)
     3. Строка «ссылка уйдёт через N дней» в блоке early access
     4. Exit-intent попап (desktop: курсор вверх; mobile: scroll-up или 28 с)
     5. Sticky CTA внизу экрана на мобилке

   QA-параметры в URL:
     ?cro-popup  показать попап сразу, без записи в storage
     ?cro-reset  сбросить в этом браузере подписку, показанный попап и sticky
   ============================================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Настройки                                                          */
  /* ------------------------------------------------------------------ */
  const CONFIG = {
    // Куда уходит email. Пусто = демо-режим: через 650 мс форма отвечает «успех»,
    // реально ничего не отправляется. Подключить: вписать URL (Formspree, прокси к
    // Mailchimp/UniSender, своё API). Ожидается POST с JSON { email, source, page, ts }
    // и ответ 2xx.
    endpoint: '',

    dropAt: new Date('2026-11-22T20:00:00+05:00').getTime(),   // открытие продаж
    earlyAt: new Date('2026-11-20T00:00:00+05:00').getTime(),  // рассылка ссылки подписчикам

    // PLACEHOLDER. Число подписчиков выдуманное (в диапазоне 240-390), пока нет реальной базы.
    // Перед публичным запуском: подставить реальное число из рассылочного сервиса
    // и поставить isPlaceholder: false. Если реальных подписчиков мало (меньше ~50),
    // поставить enabled: false, маленькое число вредит доверию.
    proof: { enabled: true, count: 312, isPlaceholder: true },

    popup: {
      desktopMinDwellMs: 8000,   // не раньше, чем через 8 с после загрузки
      mobileMinDwellMs: 12000,   // scroll-up считается не раньше 12 с
      mobileUpPx: 260,           // сколько надо прокрутить вверх подряд
      mobileTimerMs: 28000       // запасной вариант по времени
    }
  };

  const KEY_SUB = 'aurel:subscribed';
  const KEY_POPUP = 'aurel:exit-popup';
  const KEY_STICKY = 'aurel:sticky-closed';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const controllers = [];

  /* ------------------------------------------------------------------ */
  /*  Утилиты                                                            */
  /* ------------------------------------------------------------------ */

  // localStorage / sessionStorage могут быть недоступны (приватный режим, запрет cookies)
  const memory = { local: {}, session: {} };

  function read(kind, key) {
    try {
      const v = window[kind === 'local' ? 'localStorage' : 'sessionStorage'].getItem(key);
      return v === null || v === undefined ? (memory[kind][key] || null) : v;
    } catch (e) {
      return memory[kind][key] || null;
    }
  }

  function write(kind, key, value) {
    memory[kind][key] = value;
    try { window[kind === 'local' ? 'localStorage' : 'sessionStorage'].setItem(key, value); } catch (e) { /* storage недоступен, остаёмся на memory */ }
  }

  function erase(kind, key) {
    delete memory[kind][key];
    try { window[kind === 'local' ? 'localStorage' : 'sessionStorage'].removeItem(key); } catch (e) { /* storage недоступен */ }
  }

  const isSubscribed = () => read('local', KEY_SUB) === '1';

  // Русское склонение: plural(21, ['день', 'дня', 'дней']) -> 'день'
  function plural(n, forms) {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function inView(el, margin) {
    const r = el.getBoundingClientRect();
    const m = (margin || 0) * window.innerHeight;
    return r.top < window.innerHeight - m && r.bottom > m;
  }

  // События для аналитики: dataLayer (если подключён GTM) + CustomEvent 'aurel:cro'
  function track(name, params) {
    const detail = Object.assign({ event: 'aurel_' + name }, params || {});
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(detail);
    window.dispatchEvent(new CustomEvent('aurel:cro', { detail: detail }));
  }

  /* ------------------------------------------------------------------ */
  /*  1. Формы                                                           */
  /* ------------------------------------------------------------------ */

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const DOMAIN_TYPOS = {
    'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com',
    'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com',
    'mail.ry': 'mail.ru', 'mail.ri': 'mail.ru', 'mial.ru': 'mail.ru',
    'yandex.ry': 'yandex.ru', 'yandex.ri': 'yandex.ru', 'yandx.ru': 'yandex.ru', 'yadex.ru': 'yandex.ru',
    'outlok.com': 'outlook.com', 'icloud.con': 'icloud.com'
  };

  // { error } блокирует отправку; { hint } показывается один раз, повторный submit с тем же адресом проходит
  function checkEmail(raw) {
    const v = raw.trim();
    if (!v) return { error: 'Введите email, чтобы мы могли написать.' };
    if (/\s/.test(v)) return { error: 'В адресе не должно быть пробелов.' };
    if (v.indexOf('@') === -1) return { error: 'В адресе не хватает «@».' };
    if (v.length > 254 || !EMAIL_RE.test(v)) return { error: 'Проверьте адрес email.' };
    const at = v.lastIndexOf('@');
    const fix = DOMAIN_TYPOS[v.slice(at + 1).toLowerCase()];
    if (fix) return { hint: 'Возможно, опечатка. Вы имели в виду ' + v.slice(0, at) + '@' + fix + '? Если адрес верный, нажмите ещё раз.' };
    return {};
  }

  function doneText(email) {
    if (Date.now() >= CONFIG.earlyAt) return 'Напишем, как только откроем доступ.';
    return 'Ссылка на каталог и промокод −15% придут' + (email ? ' на ' + email : '') + ' 20 ноября.';
  }

  function buildDone(closable) {
    const d = document.createElement('div');
    d.className = 'notify-done';
    d.setAttribute('role', 'status');
    d.tabIndex = -1;
    d.innerHTML =
      '<svg class="done-mark" viewBox="0 0 36 36" aria-hidden="true">' +
        '<circle cx="18" cy="18" r="17" pathLength="1" fill="none" stroke="currentColor" stroke-width="1"/>' +
        '<path d="M11 18.5l5 5 9-10" pathLength="1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
      '<p class="done-title">Вы в списке.</p>' +
      '<p class="done-text"></p>' +
      (closable ? '<button type="button" class="link-cta done-close" data-xp-close><span>Вернуться на сайт</span><span class="link-arrow" aria-hidden="true">→</span></button>' : '');
    return d;
  }

  async function send(payload) {
    if (!CONFIG.endpoint) {
      console.info('[AUREL CRO] endpoint не задан, форма работает в демо-режиме:', payload.email);
      await wait(650);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } finally {
      clearTimeout(timer);
    }
  }

  function initForm(form) {
    const input = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button[type="submit"]');
    const field = form.querySelector('.notify-field');
    const note = form.querySelector('.form-note');
    const label = btn && btn.querySelector('.btn-label');
    if (!input || !btn || !field || !note || !label) return null;

    const source = form.dataset.source || 'form';
    const idleLabel = label.textContent;
    const done = buildDone(!!form.closest('#exit-popup'));
    let busy = false;
    let typoSeen = '';

    if (!note.id) note.id = 'note-' + source;
    input.setAttribute('aria-describedby', note.id);

    // honeypot: человек его не видит, простые боты заполняют
    const trap = document.createElement('input');
    trap.type = 'text';
    trap.name = 'hp_url';
    trap.tabIndex = -1;
    trap.autocomplete = 'off';
    trap.className = 'hp';
    trap.setAttribute('aria-hidden', 'true');
    form.appendChild(trap);
    form.appendChild(done);

    function setNote(msg, isError) {
      note.textContent = msg;
      note.classList.toggle('error', !!isError);
      note.classList.add('visible');
    }

    function clearNote() {
      note.classList.remove('visible', 'error');
      input.removeAttribute('aria-invalid');
    }

    function showError(msg) {
      setNote(msg, true);
      input.setAttribute('aria-invalid', 'true');
      field.classList.remove('is-nudge');
      void field.offsetWidth;
      if (!reducedMotion) field.classList.add('is-nudge');
      input.focus();
      // подпись с ошибкой не должна остаться за нижним краем экрана
      form.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    }

    function setBusy(on) {
      busy = on;
      btn.classList.toggle('is-loading', on);
      btn.setAttribute('aria-busy', on ? 'true' : 'false');
      btn.setAttribute('aria-disabled', on ? 'true' : 'false');
      input.readOnly = on;
      if (on) {
        btn.style.minWidth = btn.offsetWidth + 'px';   // ширина кнопки не прыгает
        label.textContent = 'Отправляем…';
      } else {
        label.textContent = idleLabel;
        btn.style.minWidth = '';
      }
    }

    function showDone(email, moveFocus) {
      if (!form.closest('#exit-popup')) form.style.minHeight = form.offsetHeight + 'px';   // высота формы не схлопывается (в попапе карточка перестраивается сама)
      done.querySelector('.done-text').textContent = doneText(email);
      form.dataset.state = 'done';
      if (moveFocus) {
        done.focus({ preventScroll: true });
        // подтверждение не должно оказаться за нижним краем экрана
        done.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    }

    field.addEventListener('animationend', () => field.classList.remove('is-nudge'));
    input.addEventListener('input', clearNote);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (busy) return;

      const value = input.value.trim();
      const check = checkEmail(value);
      if (check.error) return showError(check.error);
      if (check.hint && typoSeen !== value) {
        typoSeen = value;
        return showError(check.hint);
      }

      clearNote();
      setBusy(true);
      try {
        if (!trap.value) {
          await send({ email: value, source: source, page: location.pathname, ts: new Date().toISOString() });
        } else {
          await wait(650);   // бот: делаем вид, что всё хорошо, письмо не уходит
        }
      } catch (err) {
        setBusy(false);
        setNote('Не получилось отправить. Проверьте соединение и попробуйте ещё раз.', true);
        track('subscribe_error', { source: source });
        return;
      }

      setBusy(false);
      if (!trap.value) {
        write('local', KEY_SUB, '1');
        track('subscribe_success', { source: source });
      }
      controllers.forEach((c) => c.showDone(value, c.form === form));
      document.dispatchEvent(new Event('aurel:subscribed'));
    });

    return { form: form, showDone: showDone };
  }

  /* ------------------------------------------------------------------ */
  /*  2. Счётчик подписчиков (PLACEHOLDER, см. CONFIG.proof)             */
  /* ------------------------------------------------------------------ */
  function initProof() {
    document.querySelectorAll('[data-proof]').forEach((el) => {
      if (!CONFIG.proof.enabled) { el.hidden = true; return; }
      const n = CONFIG.proof.count;
      el.querySelector('[data-proof-count]').textContent = n.toLocaleString('ru-RU');
      el.querySelector('[data-proof-word]').textContent = plural(n, ['человек', 'человека', 'человек']);
    });
    if (CONFIG.proof.enabled && CONFIG.proof.isPlaceholder) {
      console.info('[AUREL CRO] Счётчик подписчиков показывает ВЫМЫШЛЕННОЕ число (' + CONFIG.proof.count + '). Замените на реальное или отключите до запуска.');
    }
  }

  /* ------------------------------------------------------------------ */
  /*  3. «Ссылка уйдёт 20 ноября — через N дней» (реальная дата)         */
  /* ------------------------------------------------------------------ */
  function initEarlyDate() {
    document.querySelectorAll('[data-early-when]').forEach((el) => {
      const left = CONFIG.earlyAt - Date.now();
      if (left <= 0) { el.hidden = true; return; }
      const days = Math.ceil(left / 86400000);
      const slot = el.querySelector('[data-early-left]');
      if (slot) slot.textContent = ' — через ' + days + ' ' + plural(days, ['день', 'дня', 'дней']);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  4. Exit-intent попап                                               */
  /* ------------------------------------------------------------------ */
  function initPopup() {
    const root = document.getElementById('exit-popup');
    if (!root) return { isOpen: () => false, debugOpen: () => {} };

    const card = root.querySelector('.xp-card');
    const input = root.querySelector('input[type="email"]');
    const access = document.getElementById('early-access');
    const html = document.documentElement;
    const desktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const startedAt = Date.now();
    const inertTargets = Array.from(document.querySelectorAll('main, .nav, footer'));
    let opened = false;
    let closing = false;
    let lastFocus = null;
    let lastScrollAt = 0;

    function blocked() {
      if (opened || closing || document.hidden) return true;
      if (isSubscribed() || read('local', KEY_POPUP)) return true;
      if (Date.now() >= CONFIG.dropAt) return true;
      if (access && inView(access, 0.1)) return true;                      // человек уже у формы
      const a = document.activeElement;
      if (a && a.matches && a.matches('.notify input')) return true;       // печатает в форме
      return Array.from(document.querySelectorAll('.notify input[type="email"]')).some((i) => i.value.trim());
    }

    function open(reason, persist) {
      opened = true;
      if (persist) write('local', KEY_POPUP, String(Date.now()));
      lastFocus = document.activeElement;
      html.style.setProperty('--sbw', (window.innerWidth - html.clientWidth) + 'px');
      html.classList.add('xp-lock');
      inertTargets.forEach((el) => { el.inert = true; });
      root.hidden = false;
      void root.offsetWidth;                                               // reflow перед transition
      root.classList.add('is-open');
      // на десктопе сразу в поле; на тач-устройствах фокус на карточку, чтобы не вылезала клавиатура
      (desktop && input ? input : card).focus({ preventScroll: true });
      document.dispatchEvent(new Event('aurel:popup-opened'));
      track('popup_shown', { reason: reason });
    }

    function close(how) {
      if (!opened || closing) return;
      closing = true;
      root.classList.remove('is-open');
      root.classList.add('is-closing');
      setTimeout(() => {
        root.hidden = true;
        root.classList.remove('is-closing');
        html.classList.remove('xp-lock');
        inertTargets.forEach((el) => { el.inert = false; });
        opened = false;
        closing = false;
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
        document.dispatchEvent(new Event('aurel:popup-closed'));
      }, reducedMotion ? 0 : 260);
      track('popup_closed', { how: how });
    }

    function attempt(reason) {
      if (blocked()) return false;
      open(reason, true);
      return true;
    }

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-xp-close]')) close('click');
    });

    document.addEventListener('keydown', (e) => {
      if (!opened) return;
      if (e.key === 'Escape') { close('esc'); return; }
      if (e.key !== 'Tab') return;
      const items = Array.from(card.querySelectorAll('button, input:not(.hp), a[href]')).filter((el) => el.offsetParent !== null && !el.disabled);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    if (desktop) {
      // курсор ушёл за верхнюю границу окна (к вкладкам / адресной строке / кнопке закрытия)
      html.addEventListener('mouseleave', (e) => {
        if (e.clientY > 0) return;
        if (Date.now() - startedAt < CONFIG.popup.desktopMinDwellMs) return;
        attempt('exit-intent');
      });
    } else {
      // 1) пользователь прокрутил вглубь, потом уверенно возвращается вверх
      let lastY = window.scrollY;
      let maxY = lastY;
      let upAcc = 0;
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        const dy = y - lastY;
        lastY = y;
        lastScrollAt = Date.now();
        if (dy > 0) { upAcc = 0; if (y > maxY) maxY = y; }
        else if (dy < 0) upAcc -= dy;
        const range = html.scrollHeight - window.innerHeight;
        if (upAcc >= CONFIG.popup.mobileUpPx
            && maxY >= range * 0.35
            && y > window.innerHeight * 0.5
            && Date.now() - startedAt >= CONFIG.popup.mobileMinDwellMs) {
          if (attempt('scroll-up')) upAcc = 0;
        }
      }, { passive: true });

      // 2) запасной вариант по времени; не перебиваем активный скролл и ввод
      const byTimer = (triesLeft) => {
        if (opened || isSubscribed() || read('local', KEY_POPUP)) return;
        const scrolling = Date.now() - lastScrollAt < 800;
        if (!scrolling && attempt('timer')) return;
        if (triesLeft > 0) setTimeout(() => byTimer(triesLeft - 1), 3000);
      };
      setTimeout(() => byTimer(10), CONFIG.popup.mobileTimerMs);
    }

    return {
      isOpen: () => opened || closing,
      debugOpen: () => setTimeout(() => open('debug', false), 600)
    };
  }

  /* ------------------------------------------------------------------ */
  /*  5. Sticky CTA (только мобилка, CSS скрывает от 768px)              */
  /* ------------------------------------------------------------------ */
  function initSticky(popup) {
    const bar = document.getElementById('sticky-cta');
    const lookbook = document.getElementById('lookbook');
    const access = document.getElementById('early-access');
    const foot = document.getElementById('contact');
    if (!bar || !lookbook || !access || !foot) return;

    const wide = window.matchMedia('(min-width: 768px)');
    let dismissed = read('session', KEY_STICKY) === '1';
    let typing = false;
    let shown = false;
    let ticking = false;

    function compute() {
      ticking = false;
      if (wide.matches) return;
      const vh = window.innerHeight;
      const passedLookbook = lookbook.getBoundingClientRect().bottom < vh * 0.25;
      const atForm = access.getBoundingClientRect().top < vh && access.getBoundingClientRect().bottom > 0;
      const atFoot = foot.getBoundingClientRect().top < vh;
      const want = !dismissed && !typing && !isSubscribed() && !popup.isOpen() && passedLookbook && !atForm && !atFoot;
      if (want === shown) return;
      shown = want;
      bar.classList.toggle('is-visible', want);
      bar.inert = !want;
      if (want) track('sticky_shown');
    }

    function schedule() {
      if (!ticking) { ticking = true; requestAnimationFrame(compute); }
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('aurel:subscribed', schedule);
    document.addEventListener('aurel:popup-opened', schedule);
    document.addEventListener('aurel:popup-closed', schedule);

    // пока человек в поле ввода (на мобилке открыта клавиатура), панель не нужна
    document.addEventListener('focusin', (e) => {
      if (e.target.matches && e.target.matches('.notify input')) { typing = true; schedule(); }
    });
    document.addEventListener('focusout', (e) => {
      if (e.target.matches && e.target.matches('.notify input')) { typing = false; schedule(); }
    });

    bar.querySelector('.sticky-cta-link').addEventListener('click', () => track('sticky_click'));
    bar.querySelector('.sticky-cta-close').addEventListener('click', () => {
      dismissed = true;
      write('session', KEY_STICKY, '1');
      track('sticky_dismissed');
      compute();
    });

    bar.inert = true;
    compute();
  }

  /* ------------------------------------------------------------------ */
  function start() {
    if (/[?&]cro-reset\b/.test(location.search)) {
      erase('local', KEY_SUB);
      erase('local', KEY_POPUP);
      erase('session', KEY_STICKY);
    }

    initProof();
    initEarlyDate();

    document.querySelectorAll('form.notify').forEach((form) => {
      const c = initForm(form);
      if (c) controllers.push(c);
    });
    if (isSubscribed()) controllers.forEach((c) => c.showDone(null, false));

    const popup = initPopup();
    initSticky(popup);

    if (/[?&]cro-popup\b/.test(location.search)) popup.debugOpen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
