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

document.querySelectorAll('a, button, .btn, .case-card, .price-card, .channel, .step, .faq-flip')
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
        html: `<iframe src="assets/alexandra-demo.html" title="Сайт Александры — живое демо" loading="lazy"></iframe>`,
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
      },
      {
        html: `
          <div class="mockup mockup--coffee mockup--gallery">
            <div class="m-gal-head">
              <div class="m-gal-eyebrow">галерея</div>
              <div class="m-gal-title">Атмосфера, которую<br>сложно <em>передать словами</em></div>
              <div class="m-gal-sub">Поэтому на&nbsp;сайте&nbsp;— фотографии. Гость ещё&nbsp;до&nbsp;визита понимает, какой это формат заведения.</div>
            </div>
            <div class="m-gal-grid">
              <figure class="m-gal-item m-gal-item--big">
                <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80" alt="Интерьер кофейни" loading="lazy">
                <figcaption>Зал у&nbsp;окна · вечером</figcaption>
              </figure>
              <figure class="m-gal-item">
                <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80" alt="Капучино с латте-артом" loading="lazy">
                <figcaption>Капучино «фирменный»</figcaption>
              </figure>
              <figure class="m-gal-item">
                <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80" alt="Свежая выпечка" loading="lazy">
                <figcaption>Утренняя выпечка</figcaption>
              </figure>
              <figure class="m-gal-item">
                <img src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=600&q=80" alt="Эспрессо-машина" loading="lazy">
                <figcaption>Бариста за&nbsp;работой</figcaption>
              </figure>
              <figure class="m-gal-item">
                <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80" alt="Латте сверху" loading="lazy">
                <figcaption>Раф ванильный</figcaption>
              </figure>
            </div>
          </div>`,
      },
      {
        html: `
          <div class="mockup mockup--coffee mockup--ts">
            <div class="m-ts-head">
              <div class="m-gal-eyebrow">задача&nbsp;и&nbsp;решение</div>
              <div class="m-gal-title">Что&nbsp;<em>болело</em>&nbsp;— и&nbsp;что<br>с&nbsp;этим&nbsp;сделали</div>
            </div>
            <div class="m-ts-grid">
              <div class="m-ts-col m-ts-col--problem">
                <div class="m-ts-tag">было до</div>
                <ul>
                  <li>Гости звонили, чтобы спросить адрес и&nbsp;часы&nbsp;работы</li>
                  <li>Меню жило только в&nbsp;Инстаграме&nbsp;— и&nbsp;не&nbsp;всегда обновлялось</li>
                  <li>Бронь принимали в&nbsp;личных сообщениях, иногда теряли</li>
                  <li>Клиент не&nbsp;понимал атмосферы заведения до&nbsp;визита</li>
                </ul>
              </div>
              <div class="m-ts-col m-ts-col--solution">
                <div class="m-ts-tag">стало</div>
                <ul>
                  <li>Адрес, часы и&nbsp;карта&nbsp;— на&nbsp;первом экране, без&nbsp;звонков</li>
                  <li>Меню обновляется&nbsp;на&nbsp;сайте, синхронизировано&nbsp;с&nbsp;соцсетями</li>
                  <li>Бронь&nbsp;— форма за&nbsp;30&nbsp;секунд, заявки идут в&nbsp;Телеграм</li>
                  <li>Галерея интерьера и&nbsp;кофе настраивает на&nbsp;визит ещё дома</li>
                </ul>
              </div>
            </div>
          </div>`,
      },
      {
        html: `
          <div class="mockup mockup--coffee">
            <div style="padding: 40px 60px;">
              <div class="mockup-eyebrow" style="margin-bottom: 20px">наше меню</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 36px;">
                <div>
                  <div style="font-size: 14px; letter-spacing: 0.2em; color: #E8946A; font-weight: 700; margin-bottom: 12px">КОФЕ</div>
                  <div class="menu-row"><span>Эспрессо</span><span>160&nbsp;₽</span></div>
                  <div class="menu-row"><span>Американо</span><span>180&nbsp;₽</span></div>
                  <div class="menu-row"><span>Капучино</span><span>220&nbsp;₽</span></div>
                  <div class="menu-row"><span>Раф ванильный</span><span>290&nbsp;₽</span></div>
                  <div class="menu-row"><span>Флэт&nbsp;уайт</span><span>250&nbsp;₽</span></div>
                </div>
                <div>
                  <div style="font-size: 14px; letter-spacing: 0.2em; color: #E8946A; font-weight: 700; margin-bottom: 12px">ВЫПЕЧКА</div>
                  <div class="menu-row"><span>Круассан миндальный</span><span>210&nbsp;₽</span></div>
                  <div class="menu-row"><span>Синнабон</span><span>260&nbsp;₽</span></div>
                  <div class="menu-row"><span>Чизкейк Нью-Йорк</span><span>290&nbsp;₽</span></div>
                  <div class="menu-row"><span>Брауни</span><span>220&nbsp;₽</span></div>
                  <div class="menu-row"><span>Банановый&nbsp;хлеб</span><span>180&nbsp;₽</span></div>
                </div>
              </div>
            </div>
          </div>`,
      },
      {
        html: `
          <div class="mockup mockup--coffee">
            <div style="padding: 40px 60px;">
              <div class="mockup-eyebrow" style="margin-bottom: 20px">наше меню</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 36px;">
                <div>
                  <div style="font-size: 14px; letter-spacing: 0.2em; color: #E8946A; font-weight: 700; margin-bottom: 12px">КОФЕ</div>
                  <div class="menu-row"><span>Эспрессо</span><span>160&nbsp;₽</span></div>
                  <div class="menu-row"><span>Американо</span><span>180&nbsp;₽</span></div>
                  <div class="menu-row"><span>Капучино</span><span>220&nbsp;₽</span></div>
                  <div class="menu-row"><span>Раф ванильный</span><span>290&nbsp;₽</span></div>
                  <div class="menu-row"><span>Флэт&nbsp;уайт</span><span>250&nbsp;₽</span></div>
                </div>
                <div>
                  <div style="font-size: 14px; letter-spacing: 0.2em; color: #E8946A; font-weight: 700; margin-bottom: 12px">ВЫПЕЧКА</div>
                  <div class="menu-row"><span>Круассан миндальный</span><span>210&nbsp;₽</span></div>
                  <div class="menu-row"><span>Синнабон</span><span>260&nbsp;₽</span></div>
                  <div class="menu-row"><span>Чизкейк Нью-Йорк</span><span>290&nbsp;₽</span></div>
                  <div class="menu-row"><span>Брауни</span><span>220&nbsp;₽</span></div>
                  <div class="menu-row"><span>Банановый&nbsp;хлеб</span><span>180&nbsp;₽</span></div>
                </div>
              </div>
            </div>
          </div>`,
      },
      {
        html: `
          <div class="mockup mockup--coffee">
            <div style="padding: 40px 60px; display: flex; flex-direction: column; gap: 18px">
              <div>
                <div class="mockup-eyebrow" style="margin-bottom: 8px">броня столика</div>
                <div style="font-size: 32px; font-weight: 800; color: #FFF2E4; letter-spacing: -0.02em">Подберём столик за&nbsp;минуту</div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
                <div class="calc-field"><label style="color: rgba(255,242,228,0.55)">Дата</label>
                  <div class="calc-select" style="background: rgba(0,0,0,0.3); border-color: rgba(232,148,106,0.3)">Сегодня, 23&nbsp;апр <span class="chev" style="color:#E8946A">▾</span></div></div>
                <div class="calc-field"><label style="color: rgba(255,242,228,0.55)">Время</label>
                  <div class="calc-select" style="background: rgba(0,0,0,0.3); border-color: rgba(232,148,106,0.3)">19:30 <span class="chev" style="color:#E8946A">▾</span></div></div>
                <div class="calc-field"><label style="color: rgba(255,242,228,0.55)">Гостей</label>
                  <div class="calc-select" style="background: rgba(0,0,0,0.3); border-color: rgba(232,148,106,0.3)">2&nbsp;человека <span class="chev" style="color:#E8946A">▾</span></div></div>
                <div class="calc-field"><label style="color: rgba(255,242,228,0.55)">Зал</label>
                  <div class="calc-select" style="background: rgba(0,0,0,0.3); border-color: rgba(232,148,106,0.3)">У&nbsp;окна <span class="chev" style="color:#E8946A">▾</span></div></div>
              </div>
              <div style="padding: 16px; background: #E8946A; color: #2a1810; border-radius: 10px; font-size: 15px; font-weight: 800; text-align: center; letter-spacing: 0.02em; box-shadow: 0 12px 30px rgba(232,148,106,0.35); margin-top: 8px">
                Забронировать
              </div>
            </div>
          </div>`,
      },
      {
        html: `
          <div class="mockup mockup--coffee mockup--results">
            <div class="m-res-head">
              <div class="m-gal-eyebrow">результаты</div>
              <div class="m-gal-title">Что изменилось<br>за&nbsp;<em>первый месяц</em></div>
            </div>
            <div class="m-res-grid">
              <div class="m-res-cell">
                <div class="m-res-num">+38%</div>
                <div class="m-res-label">броней&nbsp;через&nbsp;сайт</div>
                <div class="m-res-note">по&nbsp;сравнению с&nbsp;записями<br>в&nbsp;Директе и&nbsp;звонками</div>
              </div>
              <div class="m-res-cell">
                <div class="m-res-num">−2 ч</div>
                <div class="m-res-label">в&nbsp;день&nbsp;на&nbsp;звонки</div>
                <div class="m-res-note">«где находитесь», «есть ли&nbsp;вай-фай»&nbsp;— уже не&nbsp;спрашивают</div>
              </div>
              <div class="m-res-cell">
                <div class="m-res-num">1.4 c</div>
                <div class="m-res-label">время&nbsp;загрузки</div>
                <div class="m-res-note">PageSpeed&nbsp;94&nbsp;на&nbsp;мобиле,<br>зелёная зона по&nbsp;всем метрикам</div>
              </div>
              <div class="m-res-cell">
                <div class="m-res-num">4.9★</div>
                <div class="m-res-label">оценка&nbsp;на&nbsp;Картах</div>
                <div class="m-res-note">часть отзывов идёт от&nbsp;тех, кто пришёл&nbsp;по&nbsp;сайту</div>
              </div>
            </div>
            <blockquote class="m-res-quote">
              «Перестали отвечать на&nbsp;одни и&nbsp;те&nbsp;же вопросы. Сайт&nbsp;— как тихий администратор, который работает,&nbsp;пока мы&nbsp;готовим кофе.»
              <cite>— владелец «Ориента»</cite>
            </blockquote>
          </div>`,
      },
    ],
  },

  raritet: {
    title: '«Магазинъ раритета»',
    slides: [
      {
        html: `<iframe src="assets/raritet/index.html" title="Магазин раритета — живое демо" loading="lazy"></iframe>`,
      },
    ],
  },
};

const modal        = document.getElementById('caseModal');
const modalScroll  = document.getElementById('modalScroll');
const modalTitle   = document.getElementById('modalTitle');

function openCase(caseId) {
  const data = CASE_DATA[caseId];
  if (!data || !modal || !modalScroll) return;

  modalTitle.textContent = data.title;

  // Рендерим все секции стопкой — пользователь скроллит вертикально, как на настоящем сайте
  modalScroll.innerHTML = data.slides
    .map((s) => {
      const cap = s.caption ? `<div class="modal-section-caption">${s.caption}</div>` : '';
      return `<div class="modal-section">${cap}<div class="modal-section-frame">${s.html}</div></div>`;
    })
    .join('');

  modalScroll.scrollTop = 0;

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

// Закрытие по Escape
document.addEventListener('keydown', (e) => {
  if (!modal || !modal.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeCase();
});

// Ховер курсора на элементы модалки
document.querySelectorAll('.modal-close').forEach((el) => {
  el.addEventListener('mouseenter', () => cursor && cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('hover'));
});

// ==================== FAQ — FLIP ПО ТАПУ (ДЛЯ MOBILE) ====================
// На десктопе работает CSS hover. На тач-устройствах добавляем класс is-flipped.
document.querySelectorAll('.faq-flip').forEach((card) => {
  card.addEventListener('click', () => card.classList.toggle('is-flipped'));
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

// ==================== КАЛЬКУЛЯТОР СТОИМОСТИ ====================
const priceCalc = document.getElementById('priceCalc');

if (priceCalc) {
  const range       = document.getElementById('calcRange');
  const blocksEl    = document.getElementById('calcBlocks');
  const hintEl      = document.getElementById('calcBlocksHint');
  const fillEl      = document.getElementById('calcSliderFill');
  const stackEl     = document.getElementById('calcStack');
  const urgentEl    = document.getElementById('calcUrgent');
  const priceEl     = document.getElementById('calcPrice');
  const oldPriceEl  = document.getElementById('calcOldPrice');
  const savedEl     = document.getElementById('calcSaved');
  const listEl      = document.getElementById('calcList');

  // Цены за блок: «обычная» (зачёркнутая) и «акционная» — активная сегодня
  const PRICE_REGULAR = 4500;
  const PRICE_TODAY   = 3500;
  const URGENT_MUL    = 1.15;

  const formatPrice = (n) => {
    return Math.round(n).toLocaleString('ru-RU').replace(/,/g, '\u00A0') + '\u00A0₽';
  };

  // Подсказка по числу блоков → что это за сайт
  const blocksHint = (n) => {
    if (n <= 2)  return 'Лендинг или мини-сайт';
    if (n <= 4)  return 'Простой сайт услуги или события';
    if (n <= 7)  return 'Сайт компании: услуги, кейсы, контакты';
    if (n <= 10) return 'Большой корпоративный сайт с&nbsp;блогом';
    return 'Каталог или интернет-магазин с&nbsp;разделами';
  };

  // Падежи: 1 блок / 2 блока / 5 блоков
  const blocksWord = (n) => {
    const m = Math.abs(n) % 100;
    const m1 = m % 10;
    if (m > 10 && m < 20) return 'блоков';
    if (m1 > 1 && m1 < 5) return 'блока';
    if (m1 === 1)         return 'блок';
    return 'блоков';
  };

  // Визуальная «стопка» блоков — растёт по мере движения ползунка
  const renderStack = (n) => {
    if (!stackEl) return;
    const max = parseInt(range.max, 10) || 15;
    let html = '';
    for (let i = 1; i <= max; i++) {
      html += `<span class="calc-stack-cell${i <= n ? ' is-on' : ''}"></span>`;
    }
    stackEl.innerHTML = html;
  };

  const updateFill = (n) => {
    if (!fillEl) return;
    const max = parseInt(range.max, 10) || 15;
    const min = parseInt(range.min, 10) || 1;
    const pct = ((n - min) / (max - min)) * 100;
    fillEl.style.width = pct + '%';
  };

  const recalcPrice = () => {
    const blocks = parseInt(range.value, 10) || 1;
    const urgent = !!(urgentEl && urgentEl.checked);
    const mul    = urgent ? URGENT_MUL : 1;

    const total    = blocks * PRICE_TODAY   * mul;
    const totalOld = blocks * PRICE_REGULAR * mul;
    const saved    = totalOld - total;

    // Текстовый вывод
    if (blocksEl) blocksEl.textContent = blocks;
    const blocksLabel = priceCalc.querySelector('.calc-slider-label');
    if (blocksLabel) blocksLabel.textContent = blocksWord(blocks) + (blocks > 1 ? ' на сайте' : ' — лендинг');
    if (hintEl)   hintEl.innerHTML   = blocksHint(blocks);
    if (priceEl)  priceEl.textContent    = formatPrice(total);
    if (oldPriceEl) oldPriceEl.innerHTML = formatPrice(totalOld);
    if (savedEl)  savedEl.innerHTML  = 'Экономия ' + formatPrice(saved);

    // Список выбранного
    const items = [];
    items.push(`${blocks} ${blocksWord(blocks)}`);
    if (urgent) items.push('Срочный заказ (+15%)');
    if (listEl) listEl.innerHTML = items.map((t) => `<li>${t}</li>`).join('');

    // Визуал
    updateFill(blocks);
    renderStack(blocks);
  };

  if (range) {
    range.addEventListener('input', recalcPrice);
  }
  if (urgentEl) {
    urgentEl.addEventListener('change', recalcPrice);
  }
  recalcPrice();
}
