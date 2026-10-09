// Дата дропа — 22 ноября 2026, 20:00 Екатеринбург (UTC+5)
const DROP_DATE = new Date('2026-11-22T20:00:00+05:00').getTime();

const el = {
  days:    document.querySelector('[data-unit="days"]'),
  hours:   document.querySelector('[data-unit="hours"]'),
  minutes: document.querySelector('[data-unit="minutes"]'),
  seconds: document.querySelector('[data-unit="seconds"]'),
  countdown: document.getElementById('countdown'),
};

function pad(n) { return String(n).padStart(2, '0'); }

function tick() {
  const now = Date.now();
  const diff = DROP_DATE - now;

  if (diff <= 0) {
    el.days.textContent = '00';
    el.hours.textContent = '00';
    el.minutes.textContent = '00';
    el.seconds.textContent = '00';
    el.countdown.setAttribute('data-dropped', 'true');
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  el.days.textContent = pad(d);
  el.hours.textContent = pad(h);
  el.minutes.textContent = pad(m);
  el.seconds.textContent = pad(s);
}

tick();
setInterval(tick, 1000);

// Формы (hero, early access, попап) живут в cro.js: валидация, loading, подтверждение, endpoint.
