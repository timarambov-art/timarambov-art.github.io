// ===== ХЕДЕР: фон при скролле =====
const header = document.getElementById('header');
const onScroll = () => {
  header.classList.toggle('header--scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== HERO: появление заголовка по словам =====
window.addEventListener('load', () => {
  const words = document.querySelectorAll('.hero__title .word');
  words.forEach((w, i) => {
    w.style.transition = 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)';
    w.style.transitionDelay = (0.15 + i * 0.12) + 's';
    requestAnimationFrame(() => {
      w.style.opacity = '1';
      w.style.transform = 'translateY(0)';
    });
  });

  // Запускаем заполнение звёзд рейтинга
  const fill = document.querySelector('.stars__fill');
  if (fill) requestAnimationFrame(() => { fill.style.width = '96%'; });
});

// ===== REVEAL ON SCROLL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // лёгкий каскад для группы reveal-элементов
      const delay = entry.target.dataset.delay || 0;
      entry.target.style.transitionDelay = delay + 'ms';
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  // каскад внутри одной секции
  if (el.closest('.stats__grid')) el.dataset.delay = (i % 4) * 120;
  revealObserver.observe(el);
});

// ===== СЧЁТЧИКИ: count-up =====
const animateCount = (el) => {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    // easeOutExpo
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const value = target * eased;
    el.textContent = value.toFixed(decimals) + suffix;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target.toFixed(decimals) + suffix;
    }
  };
  requestAnimationFrame(tick);
};

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });

document.querySelectorAll('.stat__num').forEach((el) => countObserver.observe(el));

// ===== ПАРАЛЛАКС декора в hero =====
const parallaxEls = document.querySelectorAll('[data-parallax]');
let mouseX = 0, mouseY = 0, curX = 0, curY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

const parallaxLoop = () => {
  curX += (mouseX - curX) * 0.06;
  curY += (mouseY - curY) * 0.06;
  parallaxEls.forEach((el) => {
    const depth = parseFloat(el.dataset.parallax);
    const moveX = curX * depth * 300;
    const moveY = curY * depth * 300;
    el.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
  requestAnimationFrame(parallaxLoop);
};
parallaxLoop();

// Параллакс декора при скролле (глубина)
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  parallaxEls.forEach((el) => {
    const depth = parseFloat(el.dataset.parallax);
    el.style.marginTop = (y * depth * 1.2) + 'px';
  });
}, { passive: true });

// ===== FAQ аккордеон =====
document.querySelectorAll('.faq__q').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq__item');
    const answer = item.querySelector('.faq__a');
    const isOpen = item.classList.contains('is-open');

    // Закрыть все
    document.querySelectorAll('.faq__item').forEach((i) => {
      i.classList.remove('is-open');
      i.querySelector('.faq__a').style.maxHeight = null;
    });

    // Открыть текущий, если был закрыт
    if (!isOpen) {
      item.classList.add('is-open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});
