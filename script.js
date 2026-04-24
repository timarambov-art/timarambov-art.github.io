// ==================== CUSTOM CURSOR ====================
const cursor = document.querySelector('.cursor');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let posX = mouseX;
let posY = mouseY;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursor() {
  posX += (mouseX - posX) * 0.65;
  posY += (mouseY - posY) * 0.65;
  if (cursor) {
    cursor.style.left = posX + 'px';
    cursor.style.top = posY + 'px';
  }
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, button, .btn, .case-card, .price-card, .channel, .step, summary, .faq-item')
  .forEach((el) => {
    el.addEventListener('mouseenter', () => cursor && cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('hover'));
  });

// ==================== 3D TILT ON HERO TITLE ====================
// Работает только на десктопе с мышью — на тач-устройствах бесполезен и может тормозить
const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const title = document.querySelector('.hero-title');
const heroImg = document.querySelector('.hero-img');

if (!isTouchDevice) {
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 6;
    const y = (e.clientY / window.innerHeight - 0.5) * 4;

    if (title) {
      title.style.setProperty('--tilt-x', `${x}deg`);
      title.style.setProperty('--tilt-y', `${-y}deg`);
    }
    if (heroImg) {
      heroImg.style.setProperty('--mx', `${x * 0.6}px`);
      heroImg.style.setProperty('--my', `${y * 0.6}px`);
    }
  });
}

// ==================== SMOOTH ANCHOR SCROLL OFFSET ====================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      window.scrollTo({
        top: target.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  });
});

// ==================== SPLIT WORDS ====================
// Разбиваем текст заголовков на слова — для анимации по словам.
// Правила:
//  • .accent НЕ трогаем вообще — остаётся обычным inline с градиентом,
//    чтобы знаки после него не переносились на новую строку.
//  • Одиночные знаки препинания (.,!?;:—…) оставляем текстом — иначе
//    inline-block с точкой улетает на новую строку после длинного .accent.
function splitWords(root) {
  root.querySelectorAll('.split-words').forEach((el) => {
    if (el.dataset.split === 'done') return;

    const wrap = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        const text = node.nodeValue;
        const parts = text.split(/(\s+)/);
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else if (/^[.,!?;:…—–\-]+$/.test(part)) {
            // Знак препинания сам по себе — не оборачиваем
            frag.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'BR') return;
        // .accent оставляем как есть — пусть остаётся inline
        if (node.classList && node.classList.contains('accent')) return;
        Array.from(node.childNodes).forEach(wrap);
      }
    };

    Array.from(el.childNodes).forEach(wrap);

    const words = el.querySelectorAll('.word');
    words.forEach((w, i) => {
      w.style.transitionDelay = `${i * 60}ms`;
    });

    el.dataset.split = 'done';
  });
}
splitWords(document);

// ==================== REVEAL ON SCROLL ====================
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const delay = parseInt(el.dataset.delay || '0', 10);

      setTimeout(() => {
        el.classList.add('is-visible', 'visible');

        // Запустить счётчики, если это контейнер со статистикой
        el.querySelectorAll('[data-count]').forEach(startCounter);

        // Если элемент сам — data-count
        if (el.hasAttribute('data-count')) startCounter(el);
      }, delay);

      revealObserver.unobserve(el);
    });
  },
  { threshold: 0.14, rootMargin: '0px 0px -50px 0px' }
);

document.querySelectorAll('[data-reveal], .reveal').forEach((el) => revealObserver.observe(el));

// ==================== NUMBER COUNTER ====================
function startCounter(el) {
  if (el.dataset.counted === 'yes') return;
  el.dataset.counted = 'yes';

  const target = parseFloat(el.dataset.count);
  if (isNaN(target)) return;

  const duration = 1400;
  const start = performance.now();
  const isFloat = !Number.isInteger(target);

  function tick(now) {
    const elapsed = now - start;
    const p = Math.min(elapsed / duration, 1);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - p, 3);
    const value = target * eased;
    el.textContent = isFloat ? value.toFixed(1) : Math.round(value);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = isFloat ? target.toFixed(1) : target;
  }
  requestAnimationFrame(tick);
}

// ==================== PARALLAX ON SCROLL ====================
// Отключаем parallax на мобильных — на телефоне это только создаёт нагрузку
const parallaxEls = document.querySelectorAll('[data-parallax]');
let ticking = false;

function updateParallax() {
  if (window.innerWidth <= 720) {
    // На мобильных сбрасываем трансформ и выходим
    parallaxEls.forEach((el) => { el.style.transform = ''; });
    ticking = false;
    return;
  }
  const vh = window.innerHeight;
  parallaxEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    // Считаем сдвиг: центр экрана минус центр элемента
    const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
    const speed = parseFloat(el.dataset.parallax) || 0.1;
    const offset = -progress * speed * 100;
    el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
  });
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateParallax);
    ticking = true;
  }
}, { passive: true });
updateParallax();

// ==================== МОДАЛКА «ПОСМОТРЕТЬ САЙТ» ====================
const CASE_DATA = {
  alexandra: {
    title: 'Александра — LED-наращивание',
    slides: [
      {
        html: `
          <div class="mockup mockup--alexandra">
            <div class="mockup-bar">
              <span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span>
              <span class="mockup-url">alexandra-lashes.ru</span>
            </div>
            <div class="mockup-nav">
              <div class="mockup-logo"><span class="logo-mark">✦</span>ALEXANDRA</div>
              <div class="mockup-nav-links"><span>О&nbsp;LED</span><span>Работы</span><span>Цены</span><span>Запись</span></div>
            </div>
            <div class="alx-hero">
              <div>
                <div class="alx-eyebrow">LED · НАРАЩИВАНИЕ · ЕКАТЕРИНБУРГ</div>
                <div class="alx-title">Наращивание ресниц по&nbsp;<span class="y">LED-технологии</span></div>
                <div class="alx-sub">Сертифицированный мастер, 5&nbsp;лет практики. Гипоаллергенные материалы, носка до&nbsp;6&nbsp;недель, без&nbsp;раздражения и&nbsp;запаха&nbsp;— даже для&nbsp;чувствительных глаз.</div>
                <div class="alx-chip">−20% на&nbsp;первое наращивание до&nbsp;30&nbsp;апреля</div>
                <div class="alx-ctas">
                  <span class="alx-btn alx-btn--primary">Записаться</span>
                  <span class="alx-btn alx-btn--ghost">Написать в&nbsp;WhatsApp</span>
                </div>
                <div class="alx-trust">
                  <div><b>500+</b>КЛИЕНТОК</div>
                  <div><b>5&nbsp;лет</b>ОПЫТА</div>
                  <div><b>4,9</b>РЕЙТИНГ 2ГИС</div>
                </div>
              </div>
              <div class="alx-visual">
                <div class="alx-visual-tag">LED 2,5D</div>
                <div class="alx-visual-label">
                  <div>
                    АВТОРСКАЯ РАБОТА
                    <b>Объём с&nbsp;акцентом</b>
                  </div>
                </div>
              </div>
            </div>
          </div>`,
        caption: 'Главный экран: технология, выгодное предложение и&nbsp;два пути к&nbsp;записи&nbsp;— форма или&nbsp;WhatsApp.',
      },
      {
        html: `
          <div class="mockup mockup--alexandra">
            <div class="mockup-bar">
              <span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span>
              <span class="mockup-url">alexandra-lashes.ru/prices</span>
            </div>
            <div class="mockup-nav">
              <div class="mockup-logo"><span class="logo-mark">✦</span>ALEXANDRA</div>
              <div class="mockup-nav-links"><span>О&nbsp;LED</span><span>Работы</span><span>Цены</span><span>Запись</span></div>
            </div>
            <div class="alx-prices">
              <div class="alx-prices-head">
                <div class="alx-eyebrow">УСЛУГИ И&nbsp;ЦЕНЫ</div>
                <h3>Прозрачный прайс без&nbsp;«от»</h3>
                <p>Цена не&nbsp;меняется от&nbsp;длины, изгиба или&nbsp;объёма&nbsp;— видите число, столько и&nbsp;платите.</p>
              </div>
              <div class="alx-cards">
                <div class="alx-card">
                  <div class="tag">01 · БАЗА</div>
                  <div class="name">LED-наращивание<br>классика · 1,5 · 2D</div>
                  <div class="hr"></div>
                  <div class="price">2&nbsp;700&nbsp;₽</div>
                  <div class="dur">Длительность · 2&nbsp;часа</div>
                  <div class="mini-cta">Записаться</div>
                </div>
                <div class="alx-card feature">
                  <div class="tag">02 · ПОПУЛЯРНОЕ</div>
                  <div class="name">LED-наращивание<br>2,5D · 3D</div>
                  <div class="hr"></div>
                  <div class="price">2&nbsp;900&nbsp;₽</div>
                  <div class="dur">Длительность · 2&nbsp;часа</div>
                  <div class="mini-cta">Записаться</div>
                </div>
                <div class="alx-card">
                  <div class="tag">03 · ПОДДЕРЖКА</div>
                  <div class="name">Коррекция<br>обычный клей или&nbsp;LED</div>
                  <div class="hr"></div>
                  <div class="price">2&nbsp;200&nbsp;₽</div>
                  <div class="dur">Длительность · 1&nbsp;ч&nbsp;15&nbsp;мин</div>
                  <div class="mini-cta">Записаться</div>
                </div>
              </div>
            </div>
          </div>`,
        caption: 'Раздел с&nbsp;ценами: три карточки, без&nbsp;скрытых надбавок за&nbsp;объём или&nbsp;длину.',
      },
      {
        html: `<iframe src="assets/alexandra-demo.html" title="Живое демо сайта" loading="lazy"></iframe>`,
        caption: 'Живое демо&nbsp;— прокрутите внутри окна, чтобы посмотреть все секции: работы, процедуру, отзывы, квиз и&nbsp;форму записи.',
      },
    ],
  },

  coffee: {
    title: 'Кофейня «Ориент»',
    slides: [
      {
        html: `
          <div class="mockup mockup--coffee">
            <div class="mockup-bar">
              <span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span>
              <span class="mockup-url">orient-coffee.ru</span>
            </div>
            <div class="mockup-nav">
              <div class="mockup-logo"><span class="logo-mark">☕</span>ОРИЕНТ</div>
              <div class="mockup-nav-links"><span>Меню</span><span>Адрес</span><span>Броня</span><span>Галерея</span></div>
            </div>
            <div class="mockup-hero mockup-hero--split">
              <div class="mockup-hero-text">
                <div class="mockup-eyebrow">кофейня в&nbsp;центре Екатеринбурга</div>
                <div class="mockup-title">Кофе, который<br>греет руки.</div>
                <div class="mockup-sub">Свежая выпечка каждое утро&nbsp;· ул.&nbsp;Ленина&nbsp;28&nbsp;· каждый день с&nbsp;8:00</div>
                <div class="mockup-cta">
                  <span class="mockup-btn mockup-btn--primary">Забронировать столик</span>
                  <span class="mockup-btn mockup-btn--ghost">Посмотреть меню</span>
                </div>
              </div>
              <div class="mockup-hero-photo">
                <img src="assets/coffee-real.jpg" alt="Интерьер кофейни Ориент">
                <div class="mockup-hero-photo-tag">интерьер</div>
              </div>
            </div>
          </div>`,
        caption: 'Главный экран: живое фото зала, адрес и&nbsp;два понятных действия&nbsp;— забронировать столик или&nbsp;посмотреть меню.',
      },
      {
        html: `
          <div class="mockup mockup--coffee">
            <div class="mockup-bar">
              <span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span>
              <span class="mockup-url">orient-coffee.ru/menu</span>
            </div>
            <div class="mockup-nav">
              <div class="mockup-logo"><span class="logo-mark">☕</span>ОРИЕНТ</div>
              <div class="mockup-nav-links"><span>Меню</span><span>Адрес</span><span>Броня</span></div>
            </div>
            <div style="padding: 30px 50px; flex: 1; overflow: hidden;">
              <div class="mockup-eyebrow" style="margin-bottom: 18px">наше меню</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                  <div style="font-size: 14px; letter-spacing: 0.2em; color: #E8946A; font-weight: 700; margin-bottom: 10px">КОФЕ</div>
                  <div class="menu-row"><span>Эспрессо</span><span>160&nbsp;₽</span></div>
                  <div class="menu-row"><span>Американо</span><span>180&nbsp;₽</span></div>
                  <div class="menu-row"><span>Капучино</span><span>220&nbsp;₽</span></div>
                  <div class="menu-row"><span>Раф ванильный</span><span>290&nbsp;₽</span></div>
                  <div class="menu-row"><span>Флэт&nbsp;уайт</span><span>250&nbsp;₽</span></div>
                </div>
                <div>
                  <div style="font-size: 14px; letter-spacing: 0.2em; color: #E8946A; font-weight: 700; margin-bottom: 10px">ВЫПЕЧКА</div>
                  <div class="menu-row"><span>Круассан миндальный</span><span>210&nbsp;₽</span></div>
                  <div class="menu-row"><span>Синнабон</span><span>260&nbsp;₽</span></div>
                  <div class="menu-row"><span>Чизкейк Нью-Йорк</span><span>290&nbsp;₽</span></div>
                  <div class="menu-row"><span>Брауни</span><span>220&nbsp;₽</span></div>
                  <div class="menu-row"><span>Банановый&nbsp;хлеб</span><span>180&nbsp;₽</span></div>
                </div>
              </div>
            </div>
          </div>`,
        caption: 'Страница меню: две категории на&nbsp;одном экране, без&nbsp;длинной прокрутки и&nbsp;лишней графики.',
      },
      {
        html: `
          <div class="mockup mockup--coffee">
            <div class="mockup-bar">
              <span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span>
              <span class="mockup-url">orient-coffee.ru/book</span>
            </div>
            <div class="mockup-nav">
              <div class="mockup-logo"><span class="logo-mark">☕</span>ОРИЕНТ</div>
              <div class="mockup-nav-links"><span>Меню</span><span>Адрес</span><span>Броня</span></div>
            </div>
            <div style="padding: 30px 60px; flex: 1; display: flex; flex-direction: column; gap: 14px">
              <div>
                <div class="mockup-eyebrow" style="margin-bottom: 6px">броня столика</div>
                <div style="font-size: 28px; font-weight: 800; color: #FFF2E4; letter-spacing: -0.02em">Подберём столик за&nbsp;минуту</div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
                <div class="calc-field"><label style="color: rgba(255,242,228,0.55)">Дата</label>
                  <div class="calc-select" style="background: rgba(0,0,0,0.3); border-color: rgba(232,148,106,0.3)">Сегодня, 23&nbsp;апр <span class="chev" style="color:#E8946A">▾</span></div></div>
                <div class="calc-field"><label style="color: rgba(255,242,228,0.55)">Время</label>
                  <div class="calc-select" style="background: rgba(0,0,0,0.3); border-color: rgba(232,148,106,0.3)">19:30 <span class="chev" style="color:#E8946A">▾</span></div></div>
                <div class="calc-field"><label style="color: rgba(255,242,228,0.55)">Гостей</label>
                  <div class="calc-select" style="background: rgba(0,0,0,0.3); border-color: rgba(232,148,106,0.3)">2&nbsp;человека <span class="chev" style="color:#E8946A">▾</span></div></div>
                <div class="calc-field"><label style="color: rgba(255,242,228,0.55)">Зал</label>
                  <div class="calc-select" style="background: rgba(0,0,0,0.3); border-color: rgba(232,148,106,0.3)">У&nbsp;окна <span class="chev" style="color:#E8946A">▾</span></div></div>
              </div>
              <div style="padding: 14px; background: #E8946A; color: #2a1810; border-radius: 10px; font-size: 14px; font-weight: 800; text-align: center; letter-spacing: 0.02em; box-shadow: 0 12px 30px rgba(232,148,106,0.35); margin-top: 6px">
                Забронировать
              </div>
            </div>
          </div>`,
        caption: 'Форма брони: четыре поля&nbsp;— дата, время, количество гостей и&nbsp;зал. Заявка уходит администратору в&nbsp;Телеграм.',
      },
    ],
  },

  drive: {
    title: 'Автосервис «Драйв»',
    slides: [
      {
        html: `
          <div class="mockup mockup--drive">
            <div class="mockup-bar">
              <span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span>
              <span class="mockup-url">drive-service.ru</span>
            </div>
            <div class="mockup-nav">
              <div class="mockup-logo"><span class="logo-mark">⚙</span>ДРАЙВ</div>
              <div class="mockup-nav-badge">24 / 7</div>
            </div>
            <div class="mockup-calc" style="padding: 30px 60px">
              <div class="calc-head">
                <div class="calc-title">Калькулятор ТО</div>
                <div class="calc-sub">Посчитайте стоимость за&nbsp;30&nbsp;секунд — без&nbsp;звонков и&nbsp;скрытых платежей</div>
              </div>
              <div class="calc-field">
                <label>Марка авто</label>
                <div class="calc-select">Hyundai Solaris <span class="chev">▾</span></div>
              </div>
              <div class="calc-field">
                <label>Услуга</label>
                <div class="calc-select">Замена масла + фильтр <span class="chev">▾</span></div>
              </div>
              <div class="calc-field">
                <label>Дата</label>
                <div class="calc-select">Сегодня, 14:00 <span class="chev">▾</span></div>
              </div>
              <div class="calc-total">
                <span class="total-label">Итого</span>
                <span class="total-value">3&nbsp;400&nbsp;₽</span>
              </div>
              <div class="calc-cta">Записаться на&nbsp;сегодня</div>
            </div>
          </div>`,
        caption: 'Главный экран: сразу калькулятор ТО&nbsp;и&nbsp;кнопка записи&nbsp;— без&nbsp;длинных вступлений.',
      },
      {
        html: `
          <div class="mockup mockup--drive">
            <div class="mockup-bar">
              <span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span>
              <span class="mockup-url">drive-service.ru/prices</span>
            </div>
            <div class="mockup-nav">
              <div class="mockup-logo"><span class="logo-mark">⚙</span>ДРАЙВ</div>
              <div class="mockup-nav-badge">24 / 7</div>
            </div>
            <div style="padding: 30px 50px; flex: 1; overflow: hidden">
              <div class="calc-title" style="margin-bottom: 16px">Прайс-лист</div>
              <div style="display: flex; flex-direction: column; gap: 8px">
                <div style="display: flex; justify-content: space-between; padding: 12px 16px; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,61,78,0.18); border-radius: 6px">
                  <div><div style="font-size: 14px; color: #fff; font-weight: 600">Замена масла и&nbsp;фильтра</div><div style="font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 3px">30&nbsp;минут&nbsp;· с&nbsp;маслом клиента</div></div>
                  <div style="color: #FFB836; font-weight: 900">от&nbsp;1&nbsp;500&nbsp;₽</div>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 16px; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,61,78,0.18); border-radius: 6px">
                  <div><div style="font-size: 14px; color: #fff; font-weight: 600">Диагностика подвески</div><div style="font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 3px">45&nbsp;минут&nbsp;· стенд + визуально</div></div>
                  <div style="color: #FFB836; font-weight: 900">2&nbsp;000&nbsp;₽</div>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 16px; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,61,78,0.18); border-radius: 6px">
                  <div><div style="font-size: 14px; color: #fff; font-weight: 600">Замена тормозных колодок</div><div style="font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 3px">1&nbsp;час&nbsp;· одна ось</div></div>
                  <div style="color: #FFB836; font-weight: 900">от&nbsp;2&nbsp;800&nbsp;₽</div>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 16px; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,61,78,0.18); border-radius: 6px">
                  <div><div style="font-size: 14px; color: #fff; font-weight: 600">Компьютерная диагностика</div><div style="font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 3px">все блоки + отчёт</div></div>
                  <div style="color: #FFB836; font-weight: 900">1&nbsp;200&nbsp;₽</div>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 16px; background: linear-gradient(90deg, rgba(255,61,78,0.2), rgba(255,184,54,0.1)); border: 1px solid rgba(255,61,78,0.5); border-radius: 6px; box-shadow: 0 6px 20px rgba(255,61,78,0.15)">
                  <div><div style="font-size: 14px; color: #fff; font-weight: 700">Комплексное ТО</div><div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 3px">всё выше + промывка&nbsp;· выгоднее на&nbsp;15%</div></div>
                  <div style="color: #FF3D4E; font-weight: 900">от&nbsp;7&nbsp;900&nbsp;₽</div>
                </div>
              </div>
            </div>
          </div>`,
        caption: 'Прайс: каждая услуга с&nbsp;пояснением по&nbsp;времени и&nbsp;условиям. Комплексное ТО&nbsp;выделено отдельно&nbsp;— со&nbsp;скидкой.',
      },
      {
        html: `
          <div class="mockup mockup--drive">
            <div class="mockup-bar">
              <span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span>
              <span class="mockup-url">drive-service.ru/book</span>
            </div>
            <div class="mockup-nav">
              <div class="mockup-logo"><span class="logo-mark">⚙</span>ДРАЙВ</div>
              <div class="mockup-nav-badge">24 / 7</div>
            </div>
            <div style="padding: 30px 60px; flex: 1; display: flex; flex-direction: column; gap: 14px">
              <div>
                <div class="calc-title" style="margin-bottom: 4px">Заявка принята</div>
                <div class="calc-sub">Мастер перезвонит в&nbsp;течение 5&nbsp;минут и&nbsp;подтвердит время</div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px; padding: 18px; background: rgba(0,0,0,0.55); border: 1px solid rgba(255,61,78,0.25); border-radius: 8px">
                <div style="display: flex; justify-content: space-between; font-size: 13px"><span style="color: rgba(255,255,255,0.55)">Авто</span><span style="color: #fff; font-weight: 600">Hyundai Solaris, 2019</span></div>
                <div style="display: flex; justify-content: space-between; font-size: 13px"><span style="color: rgba(255,255,255,0.55)">Услуга</span><span style="color: #fff; font-weight: 600">Замена масла&nbsp;+ фильтр</span></div>
                <div style="display: flex; justify-content: space-between; font-size: 13px"><span style="color: rgba(255,255,255,0.55)">Когда</span><span style="color: #fff; font-weight: 600">Сегодня, 14:00</span></div>
                <div style="display: flex; justify-content: space-between; font-size: 13px"><span style="color: rgba(255,255,255,0.55)">Телефон</span><span style="color: #fff; font-weight: 600">+7&nbsp;(999)&nbsp;123-45-67</span></div>
                <div style="height: 1px; background: rgba(255,61,78,0.2); margin: 4px 0"></div>
                <div style="display: flex; justify-content: space-between; font-size: 16px"><span style="color: rgba(255,255,255,0.75); font-weight: 700">К&nbsp;оплате</span><span style="color: #FFB836; font-weight: 900">3&nbsp;400&nbsp;₽</span></div>
              </div>
              <div style="text-align: center; font-size: 12px; color: rgba(255,255,255,0.5)">Оплата в&nbsp;сервисе — наличными или картой</div>
            </div>
          </div>`,
        caption: 'Подтверждение заявки: клиент видит итоговую сводку&nbsp;— какое авто, услуга, время, цена. Мастер перезванивает в&nbsp;течение пяти минут.',
      },
    ],
  },
};

const modal        = document.getElementById('caseModal');
const modalTrack   = document.getElementById('modalTrack');
const modalTitle   = document.getElementById('modalTitle');
const modalCounter = document.getElementById('modalCounter');
const modalDots    = document.getElementById('modalDots');
const modalCaption = document.getElementById('modalCaption');
const modalPrev    = document.getElementById('modalPrev');
const modalNext    = document.getElementById('modalNext');

let currentSlide = 0;
let currentSlides = [];

function openCase(caseId) {
  const data = CASE_DATA[caseId];
  if (!data || !modal) return;

  currentSlides = data.slides;
  currentSlide = 0;

  modalTitle.textContent = data.title;

  // Рендер слайдов
  modalTrack.innerHTML = data.slides
    .map((s) => `<div class="modal-slide">${s.html}</div>`)
    .join('');

  // Рендер точек
  modalDots.innerHTML = data.slides
    .map((_, i) => `<button class="modal-dot" data-slide="${i}" aria-label="Слайд ${i + 1}"></button>`)
    .join('');

  modalDots.querySelectorAll('.modal-dot').forEach((dot) => {
    dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.slide, 10)));
  });

  goToSlide(0);

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeCase() {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function goToSlide(idx) {
  if (idx < 0 || idx >= currentSlides.length) return;
  currentSlide = idx;
  modalTrack.style.transform = `translateX(-${idx * 100}%)`;
  modalCounter.textContent = `${idx + 1} / ${currentSlides.length}`;
  modalCaption.innerHTML = currentSlides[idx].caption || '';

  modalDots.querySelectorAll('.modal-dot').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === idx);
  });

  if (modalPrev) modalPrev.disabled = idx === 0;
  if (modalNext) modalNext.disabled = idx === currentSlides.length - 1;
}

// Кнопки «Посмотреть сайт»
document.querySelectorAll('[data-open-case]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openCase(btn.dataset.openCase);
  });
});

// Закрытие
document.querySelectorAll('[data-modal-close]').forEach((el) => {
  el.addEventListener('click', closeCase);
});

// Стрелки
if (modalPrev) modalPrev.addEventListener('click', () => goToSlide(currentSlide - 1));
if (modalNext) modalNext.addEventListener('click', () => goToSlide(currentSlide + 1));

// Клавиатура
document.addEventListener('keydown', (e) => {
  if (!modal || !modal.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeCase();
  if (e.key === 'ArrowLeft')  goToSlide(currentSlide - 1);
  if (e.key === 'ArrowRight') goToSlide(currentSlide + 1);
});

// Ховер курсора на элементы модалки
document.querySelectorAll('.modal-arrow, .modal-close, .modal-dot').forEach((el) => {
  el.addEventListener('mouseenter', () => cursor && cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('hover'));
});

// Свайп-жесты для модалки на мобильных
const modalViewport = document.querySelector('.modal-viewport');
if (modalViewport) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;

  modalViewport.addEventListener('touchstart', (e) => {
    if (!modal || !modal.classList.contains('is-open')) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchActive = true;
  }, { passive: true });

  modalViewport.addEventListener('touchend', (e) => {
    if (!touchActive) return;
    touchActive = false;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Только если смахнули в основном горизонтально
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goToSlide(currentSlide + 1);
      else        goToSlide(currentSlide - 1);
    }
  }, { passive: true });
}

// ==================== FAQ — ПЛАВНОЕ ОТКРЫТИЕ ====================
document.querySelectorAll('.faq-item').forEach((item) => {
  const summary = item.querySelector('summary');
  const answer  = item.querySelector('.faq-answer');
  if (!summary || !answer) return;

  const PAD_BOTTOM = 26; // совпадает с CSS у открытого состояния

  const openFaq = () => {
    item.setAttribute('open', '');
    // Замеряем «открытую» высоту
    answer.style.height = 'auto';
    answer.style.paddingBottom = PAD_BOTTOM + 'px';
    const target = answer.scrollHeight;
    // Стартуем с нуля
    answer.style.height = '0px';
    answer.style.paddingBottom = '0px';
    // Форсируем reflow
    void answer.offsetHeight;
    // Едем на нужную высоту
    answer.style.height = target + 'px';
    answer.style.paddingBottom = PAD_BOTTOM + 'px';

    const onEnd = (ev) => {
      if (ev.propertyName !== 'height') return;
      answer.style.height = 'auto'; // чтобы контент мог расти (адаптив, длинный текст)
      answer.removeEventListener('transitionend', onEnd);
    };
    answer.addEventListener('transitionend', onEnd);
  };

  const closeFaq = () => {
    // Фиксируем текущую высоту, чтобы уйти в ноль
    answer.style.height = answer.scrollHeight + 'px';
    answer.style.paddingBottom = PAD_BOTTOM + 'px';
    void answer.offsetHeight;
    answer.style.height = '0px';
    answer.style.paddingBottom = '0px';

    const onEnd = (ev) => {
      if (ev.propertyName !== 'height') return;
      item.removeAttribute('open');
      answer.removeEventListener('transitionend', onEnd);
    };
    answer.addEventListener('transitionend', onEnd);
  };

  summary.addEventListener('click', (e) => {
    e.preventDefault();
    if (item.hasAttribute('open')) closeFaq();
    else openFaq();
  });
});

// ==================== МОБИЛЬНОЕ МЕНЮ (БУРГЕР) ====================
const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

function closeMobileMenu() {
  if (!burger || !mobileMenu) return;
  burger.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.remove('is-open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('menu-open');
}

function openMobileMenu() {
  if (!burger || !mobileMenu) return;
  burger.classList.add('is-open');
  burger.setAttribute('aria-expanded', 'true');
  mobileMenu.classList.add('is-open');
  mobileMenu.setAttribute('aria-hidden', 'false');
  document.body.classList.add('menu-open');
}

if (burger) {
  burger.addEventListener('click', () => {
    if (mobileMenu.classList.contains('is-open')) closeMobileMenu();
    else openMobileMenu();
  });
}

// Закрываем меню при клике по ссылке
if (mobileMenu) {
  mobileMenu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', closeMobileMenu);
  });
}

// Закрываем меню при Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('is-open')) {
    closeMobileMenu();
  }
});

// ==================== HEADER BG ON SCROLL ====================
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (!header) return;
  if (y > 50) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
}, { passive: true });

// ==================== CONTACT FORM ====================
const form = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

// ⚙️ НАСТРОЙКИ — ВСТАВЬ СЮДА СВОИ ЗНАЧЕНИЯ
const TELEGRAM_BOT_TOKEN = ''; // @BotFather → токен
const TELEGRAM_CHAT_ID   = ''; // @userinfobot → chat_id
// Ключ web3forms уже в <input name="access_key"> в HTML

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    showStatus('Отправляю...', '');

    // 1. Web3Forms (на почту)
    let emailOk = false;
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });
      emailOk = res.ok;
    } catch (err) {
      console.error('Web3Forms error:', err);
    }

    // 2. Telegram (если настроено)
    let tgOk = false;
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        const text =
          `🔔 *Новая заявка с сайта*\n\n` +
          `👤 Имя: ${data.name || '—'}\n` +
          `📞 Связь: ${data.contact || '—'}\n` +
          `📝 Задача: ${data.message || '—'}`;
        const tgRes = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text,
              parse_mode: 'Markdown',
            }),
          }
        );
        tgOk = tgRes.ok;
      } catch (err) {
        console.error('Telegram error:', err);
      }
    }

    if (emailOk || tgOk) {
      showStatus('Заявка отправлена. Отвечу в течение часа.', 'success');
      form.reset();
    } else {
      showStatus('Не удалось отправить. Напишите в Telegram или WhatsApp.', 'error');
    }
  });
}

function showStatus(text, type) {
  if (!formStatus) return;
  formStatus.textContent = text;
  formStatus.className = 'form-status show ' + (type || '');
}
