/* ============================================================================
   AUREL — animations.js
   Vanilla motion layer, согласован с CSS-инфраструктурой styles.css:
     — html.js : скрытое исходное состояние
     — [data-animate] + .is-in : reveal при входе в viewport
     — .headline / [data-animate="split"] + .is-split : split-by-words
     — --d (delay) и --i (word index) + --stagger
     — .hero .{eyebrow,lede,notify,countdown-*,unit} .is-in : каскадный вход
     — .nav.is-scrolled / .is-hidden : поведение nav
     — .look.is-settled : hover/press карточек после входа
   ============================================================================ */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  html.setAttribute('data-motion', 'on');

  /* ------------------------------------------------------------------ */
  /*  Split headline по словам: <span class="w" style="--i:N">слово</span>
  /* ------------------------------------------------------------------ */
  function splitWords(el) {
    if (el.classList.contains('is-split')) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);

    let i = 0;
    nodes.forEach(textNode => {
      const parts = textNode.nodeValue.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach(p => {
        if (!p) return;
        if (/^\s+$/.test(p)) {
          frag.appendChild(document.createTextNode(p));
        } else {
          const span = document.createElement('span');
          span.className = 'w';
          span.style.setProperty('--i', String(i++));
          span.textContent = p;
          frag.appendChild(span);
        }
      });
      textNode.parentNode.replaceChild(frag, textNode);
    });
    el.classList.add('is-split');
  }

  /* ------------------------------------------------------------------ */
  /*  1. Hero entry — split headline + каскад на всех частях hero       */
  /* ------------------------------------------------------------------ */
  function initHeroEntry() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const headline = hero.querySelector('.headline');
    if (headline) splitWords(headline);

    const parts = hero.querySelectorAll('.eyebrow, .headline, .lede, .countdown-label, .unit, .countdown-done, .notify');
    parts.forEach((el, i) => {
      let delay = 120;
      if (el.matches('.eyebrow')) delay = 100;
      else if (el.matches('.headline')) delay = 240;
      else if (el.matches('.lede')) delay = 520;
      else if (el.matches('.countdown-label')) delay = 700;
      else if (el.matches('.unit')) {
        const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains('unit'));
        const idx = siblings.indexOf(el);
        delay = 820 + idx * 90;
      }
      else if (el.matches('.countdown-done')) delay = 700;
      else if (el.matches('.notify')) delay = 1220;

      el.style.setProperty('--d', delay + 'ms');
    });

    hero.classList.add('is-animating');

    // force reflow before adding is-in, чтобы browser учёл начальное opacity:0
    void hero.offsetHeight;

    setTimeout(() => {
      parts.forEach(el => el.classList.add('is-in'));
    }, 40);

    setTimeout(() => {
      hero.classList.remove('is-animating');
      parts.forEach(el => el.classList.add('is-settled'));
    }, 2600);
  }

  /* ------------------------------------------------------------------ */
  /*  2. Scroll reveal                                                   */
  /* ------------------------------------------------------------------ */
  function initReveal() {
    const nodes = document.querySelectorAll(
      '[data-animate="reveal"], [data-animate="card"], [data-animate="split"], [data-animate="accordion"]'
    );
    if (!nodes.length) return;

    // split-заголовки готовим заранее, чтобы visibility:hidden снялось
    nodes.forEach(n => {
      if (n.matches('[data-animate="split"], .display, .headline')) splitWords(n);
    });

    if (prefersReduced) {
      nodes.forEach(n => n.classList.add('is-in', 'is-settled'));
      return;
    }

    // всё что УЖЕ выше viewport — показать мгновенно, без анимации
    nodes.forEach(n => {
      const rect = n.getBoundingClientRect();
      if (rect.bottom < 0) {
        n.classList.add('is-instant', 'is-in', 'is-settled');
      }
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const parent = el.parentElement;
        const sibs = parent ? Array.from(parent.children).filter(c => c.hasAttribute('data-animate')) : [];
        const idx = Math.max(0, sibs.indexOf(el));
        el.style.setProperty('--d', (idx * 90) + 'ms');
        el.classList.add('is-in');
        setTimeout(() => el.classList.add('is-settled'), 1400);
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    nodes.forEach(n => {
      if (!n.classList.contains('is-in')) io.observe(n);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  3. Nav shrink / hide on scroll                                     */
  /* ------------------------------------------------------------------ */
  function initNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    let lastY = window.scrollY;
    let ticking = false;

    function tick() {
      const y = window.scrollY;
      const goingDown = y > lastY && y - lastY > 2;
      const goingUp = y < lastY - 2;
      nav.classList.toggle('is-scrolled', y > 24);
      if (y > 320) {
        if (goingDown) nav.classList.add('is-hidden');
        else if (goingUp) nav.classList.remove('is-hidden');
      } else {
        nav.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(tick); ticking = true; }
    }, { passive: true });

    tick();
  }

  /* ------------------------------------------------------------------ */
  /*  4. FAQ accordion — плавное раскрытие                               */
  /* ------------------------------------------------------------------ */
  function initFaq() {
    const details = document.querySelectorAll('.qa');
    if (!details.length) return;

    details.forEach(d => {
      const summary = d.querySelector('summary');
      const content = d.querySelector('.qa-a');
      if (!summary || !content) return;

      summary.addEventListener('click', (e) => {
        if (prefersReduced) return;
        e.preventDefault();
        const isOpen = d.hasAttribute('open');

        if (isOpen) {
          const h = content.scrollHeight;
          content.style.height = h + 'px';
          content.style.opacity = '1';
          requestAnimationFrame(() => {
            content.style.transition = 'height 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease';
            content.style.height = '0px';
            content.style.opacity = '0';
          });
          const te = () => {
            d.removeAttribute('open');
            content.style.transition = '';
            content.style.height = '';
            content.style.opacity = '';
            content.removeEventListener('transitionend', te);
          };
          content.addEventListener('transitionend', te);
        } else {
          d.setAttribute('open', '');
          const h = content.scrollHeight;
          content.style.height = '0px';
          content.style.opacity = '0';
          requestAnimationFrame(() => {
            content.style.transition = 'height 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease 60ms';
            content.style.height = h + 'px';
            content.style.opacity = '1';
          });
          const te = () => {
            content.style.transition = '';
            content.style.height = '';
            content.style.opacity = '';
            content.removeEventListener('transitionend', te);
          };
          content.addEventListener('transitionend', te);
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  5. Magnetic buttons                                                */
  /* ------------------------------------------------------------------ */
  function initMagneticButtons() {
    if (prefersReduced) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const btns = document.querySelectorAll('.btn, .nav-cta, .link-cta');
    const strength = 0.2;
    const radius = 110;

    btns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) return;
        btn.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  6. Mouse parallax — hero фоновое фото (мягкое следование курсору)  */
  /* ------------------------------------------------------------------ */
  function initMouseParallax() {
    if (prefersReduced) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const wrap = document.querySelector('.hero-bg');
    if (!wrap) return;

    let tx = 0, ty = 0, cx = 0, cy = 0;

    wrap.closest('.hero')?.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });

    function loop() {
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      wrap.style.transform = `translate3d(${cx * -14}px, ${cy * -10}px, 0)`;
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ------------------------------------------------------------------ */
  /*  7. Scroll parallax для editorial band                              */
  /* ------------------------------------------------------------------ */
  function initScrollParallax() {
    if (prefersReduced) return;
    const nodes = document.querySelectorAll('[data-parallax]');
    if (!nodes.length) return;

    let ticking = false;
    function update() {
      nodes.forEach(n => {
        const rect = n.getBoundingClientRect();
        const vh = window.innerHeight;
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        n.style.transform = `translate3d(0, ${progress * -48}px, 0)`;
      });
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ */
  /*  8. Smooth scroll для внутренних ссылок                             */
  /* ------------------------------------------------------------------ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        if (!id) return;
        const t = document.getElementById(id);
        if (!t) return;
        e.preventDefault();
        const y = t.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  9. Lookbook: тащить мышью на десктопе                              */
  /* ------------------------------------------------------------------ */
  function initDragScroll() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const sc = document.querySelector('.looks-scroller');
    if (!sc) return;

    let isDown = false, startX = 0, startScroll = 0;

    sc.addEventListener('mousedown', (e) => {
      isDown = true;
      sc.classList.add('is-dragging');
      startX = e.pageX;
      startScroll = sc.scrollLeft;
    });
    ['mouseleave', 'mouseup'].forEach(ev => {
      sc.addEventListener(ev, () => {
        isDown = false;
        sc.classList.remove('is-dragging');
      });
    });
    sc.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      sc.scrollLeft = startScroll - (e.pageX - startX) * 1.3;
    });
  }

  /* ------------------------------------------------------------------ */
  function start() {
    initHeroEntry();
    initReveal();
    initNav();
    initFaq();
    initMagneticButtons();
    initMouseParallax();
    initScrollParallax();
    initSmoothScroll();
    initDragScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
