/* ============================================================
   РЕЖИМ РЕДАКТИРОВАНИЯ — активируется только при ?edit в URL.
   Возможности:
   - Перестановка блоков перетаскиванием (внутри одного контейнера).
   - Клик по блоку — выделение, плавающая панель:
       выравнивание, размер шрифта, жирный/курсив, правка текста,
       «Свободно» (position:absolute) + 8 ручек для resize.
   - Кнопка «Скачать HTML» в верхней панели сохраняет результат.
   Не трогает основной script.js и боевой сайт.
   ============================================================ */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  if (!params.has('edit')) return;

  const ZONES = [
    { sel: 'body',            children: 'section, header, footer' },
    { sel: '.section-inner',  children: '*' },
    { sel: '.hero',           children: '*' },
    { sel: '.hero-content',   children: '*' },
    { sel: '.hero-stats',     children: '*' },
    { sel: '.section-header', children: '*' },
    { sel: '.services-grid',  children: '*' },
    { sel: '.cases-list',     children: '*' },
    { sel: '.steps',          children: '*' },
    { sel: '.faq-grid',       children: '*' },
    { sel: '.about-grid',     children: '*' },
    { sel: '.about-text',     children: '*' },
    { sel: '.stack-tags',     children: 'span' },
    { sel: '.lm-offer',       children: '*' },
    { sel: '.case-body',      children: '*' },
    { sel: '.case-meta',      children: '*' },
    { sel: '.contact-center', children: '*' }
  ];

  const BODY_SKIP_SEL = '.cursor, .gradient-bg, .mobile-menu, .case-modal, #editor-toolbar, #editor-styles, #editor-floatbar, #edit-resize-overlay, script';

  let dragEl = null;
  let dragZone = null;
  let indicator = null;

  let selected = null;
  let floatBar = null;
  let editingEl = null;
  let editingPrevDraggable = null;

  let resizeOverlay = null;
  let mouseDrag = null;   // { el, cb, offsetX, offsetY }
  let mouseResize = null; // { el, cb, dir, startX, startY, startLeft, startTop, startW, startH }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(init);

  function init() {
    injectStyles();
    buildToolbar();
    buildFloatBar();
    buildResizeOverlay();
    bindGlobalClicks();
    bindFreeMouse();
    markZonesAndDraggables();
    window.addEventListener('scroll', refreshOverlays, true);
    window.addEventListener('resize', refreshOverlays);
  }

  function refreshOverlays() {
    if (selected) positionFloatBar(selected);
    updateResizeOverlay();
  }

  /* ---------------- стили ---------------- */
  function injectStyles() {
    const css = `
      #editor-toolbar{
        position:fixed; top:14px; left:50%; transform:translateX(-50%);
        z-index:2147483647; display:flex; gap:8px; align-items:center;
        padding:10px 14px; background:rgba(10,22,40,0.96);
        border:1px solid rgba(107,164,255,0.45); border-radius:14px;
        backdrop-filter:blur(10px); box-shadow:0 10px 40px rgba(0,0,0,0.5);
        font:600 13px/1 -apple-system,Segoe UI,Inter,sans-serif; color:#fff;
        user-select:none;
      }
      #editor-toolbar .et-title{ opacity:.7; padding-right:6px; letter-spacing:.04em; }
      #editor-toolbar button, #editor-floatbar button{
        appearance:none; border:1px solid rgba(255,255,255,0.18);
        background:linear-gradient(180deg,rgba(107,164,255,.3),rgba(180,141,255,.3));
        color:#fff; padding:8px 12px; border-radius:9px; cursor:pointer;
        font:inherit; transition:transform .15s, background .15s; line-height:1;
      }
      #editor-toolbar button:hover, #editor-floatbar button:hover{
        transform:translateY(-1px);
        background:linear-gradient(180deg,rgba(107,164,255,.55),rgba(180,141,255,.55));
      }
      #editor-toolbar button.et-secondary, #editor-floatbar button.ef-secondary{ background:rgba(255,255,255,0.08); }
      #editor-toolbar button.et-secondary:hover, #editor-floatbar button.ef-secondary:hover{ background:rgba(255,255,255,0.16); }
      #editor-toolbar .et-hint{ opacity:.55; font-weight:500; padding-left:6px; }

      #editor-floatbar{
        position:absolute; z-index:2147483646; display:none; gap:4px;
        padding:6px; background:rgba(10,22,40,0.98);
        border:1px solid rgba(107,164,255,0.5); border-radius:11px;
        backdrop-filter:blur(10px); box-shadow:0 10px 30px rgba(0,0,0,0.55);
        font:600 12px/1 -apple-system,Segoe UI,Inter,sans-serif; color:#fff;
        user-select:none;
      }
      #editor-floatbar button{ padding:6px 9px; border-radius:7px; font-size:12px; min-width:30px; }
      #editor-floatbar button.active{ background:linear-gradient(180deg,#6BA4FF,#B48DFF); }
      #editor-floatbar .ef-sep{ width:1px; background:rgba(255,255,255,.15); margin:2px 2px; }

      [data-edit-zone]{ outline:1px dashed rgba(107,164,255,.4); outline-offset:4px; }
      [data-edit-drag]{ cursor:grab; position:relative; transition:outline-color .15s; outline:1px solid transparent; outline-offset:2px; }
      [data-edit-drag]:hover{ outline-color:rgba(180,141,255,.7); }
      [data-edit-drag].edit-dragging{ opacity:.4; cursor:grabbing; }
      [data-edit-drag].edit-selected{ outline:2px solid #6BA4FF !important; outline-offset:4px; box-shadow:0 0 0 4px rgba(107,164,255,.18); }
      [data-edit-free]{ cursor:move !important; }
      [data-edit-free][data-edit-drag]:hover{ outline-color:transparent; }
      [contenteditable="true"]{ outline:2px dashed #B48DFF !important; outline-offset:4px; cursor:text !important; }

      #edit-resize-overlay{
        position:absolute; z-index:2147483645; display:none;
        outline:2px dashed #6BA4FF; pointer-events:none;
      }
      #edit-resize-overlay .edit-handle{
        position:absolute; width:12px; height:12px;
        background:#fff; border:2px solid #6BA4FF; border-radius:3px;
        box-shadow:0 2px 6px rgba(0,0,0,.4);
        pointer-events:auto;
      }
      #edit-resize-overlay .edit-handle.h-nw{ top:-7px; left:-7px; cursor:nwse-resize; }
      #edit-resize-overlay .edit-handle.h-n { top:-7px; left:50%; transform:translateX(-50%); cursor:ns-resize; }
      #edit-resize-overlay .edit-handle.h-ne{ top:-7px; right:-7px; cursor:nesw-resize; }
      #edit-resize-overlay .edit-handle.h-e { top:50%; right:-7px; transform:translateY(-50%); cursor:ew-resize; }
      #edit-resize-overlay .edit-handle.h-se{ bottom:-7px; right:-7px; cursor:nwse-resize; }
      #edit-resize-overlay .edit-handle.h-s { bottom:-7px; left:50%; transform:translateX(-50%); cursor:ns-resize; }
      #edit-resize-overlay .edit-handle.h-sw{ bottom:-7px; left:-7px; cursor:nesw-resize; }
      #edit-resize-overlay .edit-handle.h-w { top:50%; left:-7px; transform:translateY(-50%); cursor:ew-resize; }

      body.edit-active{ scroll-behavior:auto; }
    `;
    const tag = document.createElement('style');
    tag.id = 'editor-styles';
    tag.textContent = css;
    document.head.appendChild(tag);
    document.body.classList.add('edit-active');
  }

  /* ---------------- верхняя панель ---------------- */
  function buildToolbar() {
    const bar = document.createElement('div');
    bar.id = 'editor-toolbar';
    bar.innerHTML = `
      <span class="et-title">РЕЖИМ РЕДАКТИРОВАНИЯ</span>
      <button type="button" id="et-save">Скачать HTML</button>
      <button type="button" id="et-reset" class="et-secondary">Сбросить</button>
      <button type="button" id="et-exit" class="et-secondary">Выйти</button>
      <span class="et-hint">клик — выделить · тащи — переставить · «Свободно» — куда угодно</span>
    `;
    document.body.appendChild(bar);

    bar.querySelector('#et-save').addEventListener('click', downloadHTML);
    bar.querySelector('#et-reset').addEventListener('click', () => location.reload());
    bar.querySelector('#et-exit').addEventListener('click', () => {
      const url = new URL(location.href);
      url.searchParams.delete('edit');
      location.href = url.toString();
    });

    indicator = document.createElement('div');
    indicator.className = 'edit-indicator';
    indicator.style.display = 'none';
    document.body.appendChild(indicator);
  }

  /* ---------------- плавающая панель ---------------- */
  function buildFloatBar() {
    floatBar = document.createElement('div');
    floatBar.id = 'editor-floatbar';
    floatBar.innerHTML = `
      <button data-act="align-left"    title="По левому">⟵</button>
      <button data-act="align-center"  title="По центру">↔</button>
      <button data-act="align-right"   title="По правому">⟶</button>
      <button data-act="align-justify" title="По ширине">≡</button>
      <span class="ef-sep"></span>
      <button data-act="font-down" title="Меньше">A−</button>
      <button data-act="font-up"   title="Больше">A+</button>
      <span class="ef-sep"></span>
      <button data-act="bold"   title="Жирный"><b>B</b></button>
      <button data-act="italic" title="Курсив"><i>I</i></button>
      <span class="ef-sep"></span>
      <button data-act="edit-text" title="Править текст" class="ef-secondary">✎ Текст</button>
      <button data-act="free"      title="Свободно перемещать и менять размер" class="ef-secondary" id="ef-free">⤢ Свободно</button>
      <button data-act="reset"     title="Сбросить инлайн-стиль" class="ef-secondary">⟲</button>
      <button data-act="deselect"  title="Снять выделение" class="ef-secondary">✕</button>
    `;
    document.body.appendChild(floatBar);
    floatBar.addEventListener('mousedown', (e) => e.stopPropagation());
    floatBar.addEventListener('click', onFloatBarClick);
  }

  /* ---------------- оверлей с ручками resize ---------------- */
  function buildResizeOverlay() {
    resizeOverlay = document.createElement('div');
    resizeOverlay.id = 'edit-resize-overlay';
    ['nw','n','ne','e','se','s','sw','w'].forEach((d) => {
      const h = document.createElement('div');
      h.className = 'edit-handle h-' + d;
      h.dataset.dir = d;
      resizeOverlay.appendChild(h);
    });
    document.body.appendChild(resizeOverlay);
  }

  function updateResizeOverlay() {
    if (!resizeOverlay) return;
    if (!selected || !selected.hasAttribute('data-edit-free')) {
      resizeOverlay.style.display = 'none';
      return;
    }
    const r = selected.getBoundingClientRect();
    resizeOverlay.style.left    = (r.left + window.scrollX) + 'px';
    resizeOverlay.style.top     = (r.top + window.scrollY) + 'px';
    resizeOverlay.style.width   = r.width + 'px';
    resizeOverlay.style.height  = r.height + 'px';
    resizeOverlay.style.display = 'block';
  }

  /* ---------------- клики ---------------- */
  function bindGlobalClicks() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('#editor-toolbar')) return;
      if (e.target.closest('#editor-floatbar')) return;
      if (e.target.closest('#edit-resize-overlay')) return;
      if (editingEl && editingEl.contains(e.target)) return;

      const drag = e.target.closest('[data-edit-drag]');
      e.preventDefault();
      e.stopPropagation();

      if (drag) selectElement(drag);
      else deselect();
    }, true);

    document.addEventListener('submit', (e) => { e.preventDefault(); e.stopPropagation(); }, true);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (editingEl) commitEditing();
        else if (selected) deselect();
      }
    });
  }

  /* ---------------- мышь для free-перемещения и resize ---------------- */
  function bindFreeMouse() {
    document.addEventListener('mousedown', (e) => {
      // ручка resize
      const handle = e.target.closest('#edit-resize-overlay .edit-handle');
      if (handle && selected && selected.hasAttribute('data-edit-free')) {
        e.preventDefault();
        e.stopPropagation();
        startResize(e, handle.dataset.dir);
        return;
      }

      // drag free-элемента
      if (e.target.closest('#editor-toolbar')) return;
      if (e.target.closest('#editor-floatbar')) return;
      if (editingEl && editingEl.contains(e.target)) return;

      const free = e.target.closest('[data-edit-free]');
      if (!free) return;

      e.preventDefault();
      e.stopPropagation();
      selectElement(free);

      const cb = free.offsetParent || document.body;
      const r = free.getBoundingClientRect();
      mouseDrag = {
        el: free,
        cb: cb,
        offsetX: e.clientX - r.left,
        offsetY: e.clientY - r.top
      };
    }, true);

    document.addEventListener('mousemove', (e) => {
      if (mouseDrag) {
        const cbRect = mouseDrag.cb.getBoundingClientRect();
        mouseDrag.el.style.left = (e.clientX - mouseDrag.offsetX - cbRect.left) + 'px';
        mouseDrag.el.style.top  = (e.clientY - mouseDrag.offsetY - cbRect.top) + 'px';
        updateResizeOverlay();
        positionFloatBar(mouseDrag.el);
      }
      if (mouseResize) doResize(e);
    });

    document.addEventListener('mouseup', () => {
      mouseDrag = null;
      mouseResize = null;
    });
  }

  function startResize(e, dir) {
    const el = selected;
    const cb = el.offsetParent || document.body;
    const r = el.getBoundingClientRect();
    const cbRect = cb.getBoundingClientRect();
    mouseResize = {
      el, cb, dir,
      startX: e.clientX, startY: e.clientY,
      startLeft: r.left - cbRect.left,
      startTop:  r.top  - cbRect.top,
      startW: r.width, startH: r.height
    };
  }

  function doResize(e) {
    const m = mouseResize;
    const dx = e.clientX - m.startX;
    const dy = e.clientY - m.startY;
    let left = m.startLeft, top = m.startTop, w = m.startW, h = m.startH;

    if (m.dir.includes('e')) w = Math.max(20, m.startW + dx);
    if (m.dir.includes('w')) { w = Math.max(20, m.startW - dx); left = m.startLeft + (m.startW - w); }
    if (m.dir.includes('s')) h = Math.max(20, m.startH + dy);
    if (m.dir.includes('n')) { h = Math.max(20, m.startH - dy); top = m.startTop + (m.startH - h); }

    m.el.style.left   = left + 'px';
    m.el.style.top    = top  + 'px';
    m.el.style.width  = w + 'px';
    m.el.style.height = h + 'px';

    updateResizeOverlay();
    positionFloatBar(m.el);
  }

  /* ---------------- зоны / draggable HTML5 ---------------- */
  function markZonesAndDraggables() {
    ZONES.forEach(({ sel, children }) => {
      document.querySelectorAll(sel).forEach((zone) => {
        if (zone.closest('.case-modal')) return;
        if (zone.id === 'editor-toolbar' || zone.id === 'editor-floatbar' || zone.id === 'edit-resize-overlay') return;
        zone.setAttribute('data-edit-zone', '1');

        Array.from(zone.children).forEach((child) => {
          if (sel === 'body' && child.matches(BODY_SKIP_SEL)) return;
          if (children !== '*' && !child.matches(children)) return;
          if (child.hasAttribute('data-edit-drag')) return;
          enableDrag(child, zone);
        });
      });
    });
  }

  function enableDrag(el, zone) {
    el.setAttribute('data-edit-drag', '1');
    el.setAttribute('draggable', 'true');

    el.addEventListener('dragstart', (e) => {
      if (editingEl) return;
      if (el.hasAttribute('data-edit-free')) { e.preventDefault(); return; }
      dragEl = el;
      dragZone = zone;
      el.classList.add('edit-dragging');
      hideFloatBar();
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', ''); } catch (_) {}
      e.stopPropagation();
    });

    el.addEventListener('dragend', () => {
      if (dragEl) dragEl.classList.remove('edit-dragging');
      const dropped = dragEl;
      dragEl = null;
      dragZone = null;
      hideIndicator();
      if (dropped && selected === dropped) {
        setTimeout(() => { positionFloatBar(dropped); updateResizeOverlay(); }, 30);
        showFloatBar();
      }
    });

    zone.addEventListener('dragover', onZoneDragOver);
    zone.addEventListener('drop', onZoneDrop);
  }

  function onZoneDragOver(e) {
    if (!dragEl || this !== dragZone) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const after = getInsertTarget(this, e.clientX, e.clientY);
    showIndicator(this, after);
  }

  function onZoneDrop(e) {
    if (!dragEl || this !== dragZone) return;
    e.preventDefault();
    const after = getInsertTarget(this, e.clientX, e.clientY);
    if (after == null) this.appendChild(dragEl);
    else this.insertBefore(dragEl, after);
    hideIndicator();
  }

  function getInsertTarget(zone, x, y) {
    const siblings = Array.from(zone.children).filter(
      (c) => c.hasAttribute('data-edit-drag') && c !== dragEl
    );
    if (!siblings.length) return null;
    const horizontal = isHorizontalZone(zone, siblings);
    let best = null, bestDist = Infinity;
    for (const s of siblings) {
      const r = s.getBoundingClientRect();
      const midX = r.left + r.width / 2;
      const midY = r.top + r.height / 2;
      const dist = Math.hypot(x - midX, y - midY);
      if (dist < bestDist) {
        bestDist = dist;
        const before = horizontal ? x < midX : y < midY;
        best = { el: s, before };
      }
    }
    if (!best) return null;
    return best.before ? best.el : best.el.nextElementSibling;
  }

  function isHorizontalZone(zone, siblings) {
    if (siblings.length < 2) {
      const cs = getComputedStyle(zone);
      return cs.display.includes('flex') && !cs.flexDirection.startsWith('column');
    }
    const a = siblings[0].getBoundingClientRect();
    const b = siblings[1].getBoundingClientRect();
    return Math.abs(a.top - b.top) < a.height / 2;
  }

  function showIndicator(zone, beforeEl) {
    const siblings = Array.from(zone.children).filter((c) => c.hasAttribute('data-edit-drag'));
    const horizontal = isHorizontalZone(zone, siblings);
    const sc = { x: window.scrollX, y: window.scrollY };
    let x, y, w, h;
    if (beforeEl) {
      const r = beforeEl.getBoundingClientRect();
      if (horizontal) { x = r.left + sc.x - 3; y = r.top + sc.y; w = 4; h = r.height; }
      else            { x = r.left + sc.x;     y = r.top + sc.y - 3; w = r.width; h = 4; }
    } else {
      const last = siblings.slice(-1)[0];
      const r = (last || zone).getBoundingClientRect();
      if (horizontal) { x = r.right + sc.x - 1; y = r.top + sc.y; w = 4; h = r.height; }
      else            { x = r.left + sc.x;      y = r.bottom + sc.y - 1; w = r.width; h = 4; }
    }
    indicator.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:linear-gradient(135deg,#6BA4FF,#B48DFF);box-shadow:0 0 16px rgba(107,164,255,.9);border-radius:3px;z-index:2147483646;pointer-events:none;display:block;`;
  }

  function hideIndicator() { if (indicator) indicator.style.display = 'none'; }

  /* ---------------- выделение и форматирование ---------------- */
  function selectElement(el) {
    if (selected === el) { positionFloatBar(el); updateResizeOverlay(); return; }
    deselect();
    selected = el;
    el.classList.add('edit-selected');
    positionFloatBar(el);
    showFloatBar();
    updateResizeOverlay();
    updateFreeBtnState();
  }

  function deselect() {
    if (editingEl) commitEditing();
    if (selected) selected.classList.remove('edit-selected');
    selected = null;
    hideFloatBar();
    updateResizeOverlay();
  }

  function showFloatBar() { if (floatBar) floatBar.style.display = 'flex'; }
  function hideFloatBar() { if (floatBar) floatBar.style.display = 'none'; }

  function positionFloatBar(el) {
    if (!floatBar) return;
    const r = el.getBoundingClientRect();
    const sc = { x: window.scrollX, y: window.scrollY };
    floatBar.style.display = 'flex';
    floatBar.style.visibility = 'hidden';
    const fbr = floatBar.getBoundingClientRect();
    floatBar.style.visibility = '';
    let top = r.top + sc.y - fbr.height - 10;
    if (top < sc.y + 70) top = r.bottom + sc.y + 8;
    let left = r.left + sc.x;
    const maxLeft = sc.x + window.innerWidth - fbr.width - 12;
    if (left > maxLeft) left = maxLeft;
    if (left < sc.x + 8) left = sc.x + 8;
    floatBar.style.left = left + 'px';
    floatBar.style.top  = top + 'px';
  }

  function updateFreeBtnState() {
    if (!floatBar || !selected) return;
    const btn = floatBar.querySelector('#ef-free');
    if (selected.hasAttribute('data-edit-free')) {
      btn.classList.add('active');
      btn.textContent = '⤢ Прикрепить';
    } else {
      btn.classList.remove('active');
      btn.textContent = '⤢ Свободно';
    }
  }

  function onFloatBarClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn || !selected) return;
    const act = btn.dataset.act;
    const el = selected;
    switch (act) {
      case 'align-left':    el.style.textAlign = 'left'; break;
      case 'align-center':  el.style.textAlign = 'center'; break;
      case 'align-right':   el.style.textAlign = 'right'; break;
      case 'align-justify': el.style.textAlign = 'justify'; break;
      case 'font-up':       adjustFontSize(el, +1); break;
      case 'font-down':     adjustFontSize(el, -1); break;
      case 'bold':          el.style.fontWeight = (el.style.fontWeight === '700' ? '' : '700'); break;
      case 'italic':        el.style.fontStyle  = (el.style.fontStyle  === 'italic' ? '' : 'italic'); break;
      case 'edit-text':     startEditing(el); break;
      case 'free':          toggleFree(el); break;
      case 'reset':         resetStyles(el); break;
      case 'deselect':      deselect(); return;
    }
    positionFloatBar(el);
    updateResizeOverlay();
    updateFreeBtnState();
  }

  function adjustFontSize(el, delta) {
    const cur = parseFloat(getComputedStyle(el).fontSize);
    if (!cur) return;
    const next = Math.max(8, cur + delta * 2);
    el.style.fontSize = next + 'px';
  }

  function resetStyles(el) {
    if (el.hasAttribute('data-edit-free')) unmakeFree(el);
    el.removeAttribute('style');
  }

  /* ---------------- свободное позиционирование ---------------- */
  function toggleFree(el) {
    if (el.hasAttribute('data-edit-free')) unmakeFree(el);
    else makeFree(el);
  }

  function makeFree(el) {
    const cb = el.offsetParent || document.body;
    const cbRect = cb.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    el.setAttribute('data-edit-free', '1');
    el.style.position = 'absolute';
    el.style.left   = (r.left - cbRect.left) + 'px';
    el.style.top    = (r.top  - cbRect.top)  + 'px';
    el.style.width  = r.width  + 'px';
    el.style.height = r.height + 'px';
    el.style.margin = '0';
    el.style.zIndex = '50';
    el.setAttribute('draggable', 'false');
  }

  function unmakeFree(el) {
    el.removeAttribute('data-edit-free');
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    el.style.width = '';
    el.style.height = '';
    el.style.margin = '';
    el.style.zIndex = '';
    if (el.hasAttribute('data-edit-drag')) el.setAttribute('draggable', 'true');
  }

  /* ---------------- инлайн-правка текста ---------------- */
  function startEditing(el) {
    if (editingEl === el) return;
    if (editingEl) commitEditing();
    editingEl = el;
    editingPrevDraggable = el.getAttribute('draggable');
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('draggable', 'false');
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    el.addEventListener('blur', commitEditing, { once: true });
  }

  function commitEditing() {
    if (!editingEl) return;
    editingEl.removeAttribute('contenteditable');
    if (editingPrevDraggable !== null) editingEl.setAttribute('draggable', editingPrevDraggable);
    else editingEl.setAttribute('draggable', 'true');
    editingEl = null;
    editingPrevDraggable = null;
    if (selected) positionFloatBar(selected);
  }

  /* ---------------- экспорт HTML ---------------- */
  function downloadHTML() {
    if (editingEl) commitEditing();
    const clone = document.documentElement.cloneNode(true);

    clone.querySelectorAll('#editor-toolbar, #editor-styles, #editor-floatbar, #edit-resize-overlay, .edit-indicator').forEach((n) => n.remove());
    clone.querySelectorAll('script[src*="editor.js"]').forEach((n) => n.remove());

    clone.querySelectorAll('[data-edit-zone]').forEach((n) => n.removeAttribute('data-edit-zone'));
    clone.querySelectorAll('[data-edit-drag]').forEach((n) => {
      n.removeAttribute('data-edit-drag');
      n.removeAttribute('draggable');
    });
    clone.querySelectorAll('[data-edit-free]').forEach((n) => n.removeAttribute('data-edit-free'));
    clone.querySelectorAll('[contenteditable]').forEach((n) => n.removeAttribute('contenteditable'));
    clone.querySelectorAll('.edit-dragging, .edit-selected').forEach((n) => {
      n.classList.remove('edit-dragging');
      n.classList.remove('edit-selected');
    });

    const body = clone.querySelector('body');
    if (body) body.classList.remove('edit-active');

    const html = '<!DOCTYPE html>\n' + clone.outerHTML;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
})();
