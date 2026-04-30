// SVG-иллюстрации антикварных предметов
// Стиль: тонкие линии золотом/охрой, лёгкая иллюстративность, как старые гравюры

window.ARTIFACTS = {
  // Старинные часы с маятником
  clock: `<svg viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c9a86a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <defs>
      <radialGradient id="clockFace" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#2a2218"/>
        <stop offset="100%" stop-color="#0d0a07"/>
      </radialGradient>
    </defs>
    <!-- Корпус -->
    <path d="M40 30 L160 30 L155 22 L45 22 Z" fill="#1a1410"/>
    <path d="M30 30 L170 30 L170 200 Q170 215 158 215 L42 215 Q30 215 30 200 Z" fill="#1a1410"/>
    <!-- Циферблат -->
    <circle cx="100" cy="115" r="62" fill="url(#clockFace)" stroke="#8b6f47" stroke-width="2"/>
    <circle cx="100" cy="115" r="55" stroke="#c9a86a" stroke-width="0.6"/>
    <!-- Цифры (метки) -->
    <g stroke="#c9a86a" stroke-width="1.2">
      <line x1="100" y1="60" x2="100" y2="68"/>
      <line x1="155" y1="115" x2="147" y2="115"/>
      <line x1="100" y1="170" x2="100" y2="162"/>
      <line x1="45" y1="115" x2="53" y2="115"/>
    </g>
    <text x="100" y="78" text-anchor="middle" font-family="serif" font-size="9" fill="#c9a86a" font-style="italic">XII</text>
    <text x="138" y="119" text-anchor="middle" font-family="serif" font-size="9" fill="#c9a86a" font-style="italic">III</text>
    <text x="100" y="158" text-anchor="middle" font-family="serif" font-size="9" fill="#c9a86a" font-style="italic">VI</text>
    <text x="62" y="119" text-anchor="middle" font-family="serif" font-size="9" fill="#c9a86a" font-style="italic">IX</text>
    <!-- Стрелки -->
    <line x1="100" y1="115" x2="100" y2="80" stroke="#e8dcc4" stroke-width="1.6"/>
    <line x1="100" y1="115" x2="125" y2="115" stroke="#e8dcc4" stroke-width="1.2"/>
    <circle cx="100" cy="115" r="2.5" fill="#c9a86a"/>
    <!-- Орнамент -->
    <path d="M70 30 Q85 18 100 22 Q115 18 130 30" stroke="#8b6f47" stroke-width="1"/>
    <!-- Маятник -->
    <line x1="100" y1="190" x2="100" y2="270" stroke="#8b6f47" stroke-width="0.8"/>
    <circle cx="100" cy="280" r="14" fill="#1a1410" stroke="#c9a86a" stroke-width="1.4"/>
    <circle cx="100" cy="280" r="6" fill="#c9a86a" opacity="0.4"/>
    <!-- Подножие -->
    <path d="M50 215 L150 215 L155 230 L45 230 Z" fill="#1a1410"/>
    <line x1="48" y1="222" x2="152" y2="222" stroke="#8b6f47" stroke-width="0.6"/>
  </svg>`,

  // Овальная рама с портретом
  portrait: `<svg viewBox="0 0 220 280" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c9a86a" stroke-width="1.4" stroke-linecap="round">
    <defs>
      <radialGradient id="portraitBg" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#3a2c1c"/>
        <stop offset="100%" stop-color="#0d0807"/>
      </radialGradient>
    </defs>
    <!-- Внешняя рама -->
    <ellipse cx="110" cy="140" rx="100" ry="130" fill="#1a1410" stroke="#8b6f47" stroke-width="3"/>
    <!-- Орнамент по раме -->
    <ellipse cx="110" cy="140" rx="92" ry="122" stroke="#c9a86a" stroke-width="0.6"/>
    <ellipse cx="110" cy="140" rx="84" ry="114" stroke="#8b6f47" stroke-width="0.4"/>
    <!-- Декоративные узлы -->
    <g fill="#c9a86a">
      <circle cx="110" cy="14" r="4"/>
      <circle cx="110" cy="266" r="4"/>
      <circle cx="14" cy="140" r="3"/>
      <circle cx="206" cy="140" r="3"/>
    </g>
    <path d="M100 14 Q110 6 120 14" stroke="#8b6f47" stroke-width="1"/>
    <path d="M100 266 Q110 274 120 266" stroke="#8b6f47" stroke-width="1"/>
    <!-- Внутри рамы -->
    <ellipse cx="110" cy="140" rx="78" ry="108" fill="url(#portraitBg)"/>
    <!-- Силуэт женщины -->
    <g stroke="#c9a86a" stroke-width="1.1" fill="none" opacity="0.85">
      <!-- Голова -->
      <ellipse cx="110" cy="110" rx="22" ry="28" fill="#2a2018" stroke="#8b6f47"/>
      <!-- Волосы -->
      <path d="M88 100 Q85 80 100 75 Q115 70 130 80 Q135 95 132 110 Q130 100 125 95" fill="#1a1410" stroke="#8b6f47" stroke-width="0.8"/>
      <!-- Шея и плечи -->
      <path d="M100 138 Q100 150 90 158 Q70 168 60 195 L60 230" stroke="#8b6f47"/>
      <path d="M120 138 Q120 150 130 158 Q150 168 160 195 L160 230" stroke="#8b6f47"/>
      <!-- Платье -->
      <path d="M60 230 Q110 220 160 230" stroke="#8b6f47"/>
      <!-- Лицо: лёгкие черты -->
      <path d="M103 108 Q105 110 103 113" stroke-width="0.7" opacity="0.7"/>
      <path d="M117 108 Q119 110 117 113" stroke-width="0.7" opacity="0.7"/>
      <path d="M105 122 Q110 124 115 122" stroke-width="0.7" opacity="0.7"/>
      <!-- Серьга -->
      <circle cx="89" cy="118" r="1.5" fill="#c9a86a"/>
    </g>
  </svg>`,

  // Маска
  mask: `<svg viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c9a86a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <defs>
      <linearGradient id="maskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#3a2c1c"/>
        <stop offset="100%" stop-color="#1a1410"/>
      </linearGradient>
    </defs>
    <!-- Корона/перья -->
    <g stroke="#8b6f47" stroke-width="1">
      <path d="M70 60 Q60 30 75 15 Q85 30 80 55"/>
      <path d="M90 50 Q80 18 95 5 Q105 20 100 48"/>
      <path d="M120 45 Q120 10 130 0 Q140 12 132 45"/>
      <path d="M150 50 Q160 18 170 8 Q175 25 162 50"/>
      <path d="M170 60 Q185 30 195 20 Q198 38 180 60"/>
    </g>
    <!-- Маска -->
    <path d="M50 80 Q50 70 60 65 L180 65 Q190 70 190 80 L195 130 Q200 165 175 195 Q150 220 120 220 Q90 220 65 195 Q40 165 45 130 Z" fill="url(#maskGrad)" stroke="#c9a86a" stroke-width="1.6"/>
    <!-- Орнамент по краю -->
    <path d="M55 80 Q120 76 185 80" stroke="#8b6f47" stroke-width="0.6"/>
    <!-- Глаза -->
    <ellipse cx="90" cy="125" rx="14" ry="9" fill="#0a0807" stroke="#c9a86a" stroke-width="1.2"/>
    <ellipse cx="150" cy="125" rx="14" ry="9" fill="#0a0807" stroke="#c9a86a" stroke-width="1.2"/>
    <!-- Лоб орнамент -->
    <path d="M100 92 Q120 86 140 92" stroke="#c9a86a" stroke-width="0.8"/>
    <circle cx="120" cy="100" r="2" fill="#c9a86a"/>
    <!-- Нос -->
    <path d="M120 140 Q116 160 120 175 Q124 180 128 175" stroke="#c9a86a" stroke-width="1"/>
    <!-- Декоративные точки на щеках -->
    <g fill="#c9a86a" opacity="0.7">
      <circle cx="75" cy="155" r="1.2"/>
      <circle cx="80" cy="170" r="1"/>
      <circle cx="160" cy="155" r="1.2"/>
      <circle cx="165" cy="170" r="1"/>
    </g>
    <!-- Губы -->
    <path d="M105 195 Q120 200 135 195" stroke="#c9a86a" stroke-width="1.2"/>
    <path d="M105 195 Q120 190 135 195" stroke="#c9a86a" stroke-width="0.8"/>
    <!-- Подвески -->
    <line x1="80" y1="220" x2="78" y2="245" stroke="#8b6f47" stroke-width="0.6"/>
    <circle cx="78" cy="250" r="3" fill="#c9a86a"/>
    <line x1="160" y1="220" x2="162" y2="245" stroke="#8b6f47" stroke-width="0.6"/>
    <circle cx="162" cy="250" r="3" fill="#c9a86a"/>
  </svg>`,

  // Меч
  sword: `<svg viewBox="0 0 100 320" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c9a86a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <!-- Клинок -->
    <path d="M50 10 L56 30 L56 200 L50 215 L44 200 L44 30 Z" fill="#2a2218" stroke="#c9a86a" stroke-width="1.2"/>
    <line x1="50" y1="20" x2="50" y2="200" stroke="#8b6f47" stroke-width="0.6"/>
    <!-- Гравировка -->
    <g stroke="#8b6f47" stroke-width="0.5" opacity="0.7">
      <path d="M47 50 Q50 55 53 50"/>
      <path d="M47 80 Q50 85 53 80"/>
      <path d="M47 110 Q50 115 53 110"/>
      <path d="M47 140 Q50 145 53 140"/>
      <path d="M47 170 Q50 175 53 170"/>
    </g>
    <!-- Гарда -->
    <path d="M20 215 L80 215 L75 225 L25 225 Z" fill="#1a1410" stroke="#c9a86a" stroke-width="1.4"/>
    <path d="M15 218 Q50 210 85 218" stroke="#c9a86a" stroke-width="0.8"/>
    <circle cx="20" cy="220" r="3" fill="#c9a86a"/>
    <circle cx="80" cy="220" r="3" fill="#c9a86a"/>
    <!-- Перекрестье -->
    <rect x="42" y="225" width="16" height="6" fill="#c9a86a"/>
    <!-- Рукоять -->
    <path d="M44 231 L56 231 L54 285 L46 285 Z" fill="#1a1410" stroke="#c9a86a" stroke-width="1.2"/>
    <!-- Обмотка -->
    <g stroke="#8b6f47" stroke-width="0.6">
      <line x1="44" y1="240" x2="56" y2="242"/>
      <line x1="44" y1="248" x2="56" y2="250"/>
      <line x1="44" y1="256" x2="56" y2="258"/>
      <line x1="44" y1="264" x2="56" y2="266"/>
      <line x1="44" y1="272" x2="56" y2="274"/>
    </g>
    <!-- Навершие -->
    <ellipse cx="50" cy="295" rx="10" ry="12" fill="#1a1410" stroke="#c9a86a" stroke-width="1.4"/>
    <circle cx="50" cy="295" r="4" fill="#c9a86a" opacity="0.5"/>
  </svg>`,

  // Свеча в подсвечнике
  candle: `<svg viewBox="0 0 140 320" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c9a86a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <defs>
      <radialGradient id="flame" cx="50%" cy="60%" r="50%">
        <stop offset="0%" stop-color="#fde7a3" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="#c9a86a" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#c9a86a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <!-- Ореол света -->
    <ellipse cx="70" cy="40" rx="60" ry="50" fill="url(#flame)" opacity="0.6"/>
    <!-- Пламя -->
    <path d="M70 20 Q63 35 64 50 Q65 60 70 62 Q75 60 76 50 Q77 35 70 20" fill="#fde7a3" stroke="none" opacity="0.9"/>
    <path d="M70 28 Q67 38 68 48 Q70 54 72 48 Q73 38 70 28" fill="#c9a86a" opacity="0.6" stroke="none"/>
    <!-- Фитиль -->
    <line x1="70" y1="62" x2="70" y2="72" stroke="#1a1410" stroke-width="1"/>
    <!-- Капли воска -->
    <path d="M58 75 Q60 90 62 105" stroke="#8b6f47" stroke-width="0.8"/>
    <path d="M82 75 Q80 95 78 110" stroke="#8b6f47" stroke-width="0.8"/>
    <!-- Свеча -->
    <path d="M55 70 Q55 65 70 65 Q85 65 85 70 L85 200 L55 200 Z" fill="#2a2218" stroke="#c9a86a" stroke-width="1.2"/>
    <!-- Текстура свечи -->
    <line x1="62" y1="75" x2="62" y2="195" stroke="#8b6f47" stroke-width="0.4" opacity="0.5"/>
    <line x1="78" y1="75" x2="78" y2="195" stroke="#8b6f47" stroke-width="0.4" opacity="0.5"/>
    <!-- Подсвечник: чашка -->
    <path d="M40 200 L100 200 L95 220 L45 220 Z" fill="#1a1410" stroke="#c9a86a" stroke-width="1.4"/>
    <ellipse cx="70" cy="200" rx="30" ry="4" fill="#0a0807" stroke="#c9a86a"/>
    <!-- Стержень -->
    <path d="M62 220 L78 220 L75 270 L65 270 Z" fill="#1a1410" stroke="#c9a86a" stroke-width="1.2"/>
    <circle cx="70" cy="245" r="6" fill="#1a1410" stroke="#c9a86a" stroke-width="1"/>
    <!-- Основание -->
    <path d="M40 270 L100 270 L110 290 L30 290 Z" fill="#1a1410" stroke="#c9a86a" stroke-width="1.4"/>
    <ellipse cx="70" cy="290" rx="40" ry="5" fill="#1a1410" stroke="#c9a86a"/>
    <ellipse cx="70" cy="290" rx="35" ry="3" stroke="#8b6f47" stroke-width="0.6"/>
  </svg>`,

  // Книга
  book: `<svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c9a86a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <!-- Тень/задник -->
    <path d="M30 50 L230 50 L240 60 L240 175 L230 185 L30 185 L20 175 L20 60 Z" fill="#1a1410" stroke="#c9a86a" stroke-width="1.4"/>
    <!-- Корешок -->
    <line x1="130" y1="50" x2="130" y2="185" stroke="#8b6f47" stroke-width="1"/>
    <!-- Страницы -->
    <path d="M30 55 L130 55 L130 180 L30 180 Z" fill="#2a2218" stroke="#8b6f47" stroke-width="0.6"/>
    <path d="M130 55 L230 55 L230 180 L130 180 Z" fill="#2a2218" stroke="#8b6f47" stroke-width="0.6"/>
    <!-- Текстура листов -->
    <g stroke="#8b6f47" stroke-width="0.3" opacity="0.6">
      <line x1="40" y1="70" x2="120" y2="70"/>
      <line x1="40" y1="78" x2="120" y2="78"/>
      <line x1="40" y1="86" x2="115" y2="86"/>
      <line x1="40" y1="94" x2="120" y2="94"/>
      <line x1="40" y1="102" x2="118" y2="102"/>
      <line x1="40" y1="110" x2="120" y2="110"/>
      <line x1="40" y1="118" x2="113" y2="118"/>
      <line x1="40" y1="126" x2="120" y2="126"/>
      <line x1="40" y1="134" x2="120" y2="134"/>
      <line x1="40" y1="142" x2="116" y2="142"/>
      <line x1="40" y1="150" x2="120" y2="150"/>
      <line x1="40" y1="158" x2="120" y2="158"/>
      <line x1="40" y1="166" x2="114" y2="166"/>
    </g>
    <!-- Буквица на правой странице -->
    <text x="148" y="92" font-family="serif" font-size="32" font-style="italic" fill="#c9a86a">A</text>
    <g stroke="#8b6f47" stroke-width="0.3" opacity="0.6">
      <line x1="170" y1="75" x2="225" y2="75"/>
      <line x1="170" y1="83" x2="222" y2="83"/>
      <line x1="140" y1="100" x2="225" y2="100"/>
      <line x1="140" y1="108" x2="220" y2="108"/>
      <line x1="140" y1="116" x2="225" y2="116"/>
      <line x1="140" y1="124" x2="218" y2="124"/>
      <line x1="140" y1="132" x2="225" y2="132"/>
      <line x1="140" y1="140" x2="220" y2="140"/>
      <line x1="140" y1="148" x2="225" y2="148"/>
      <line x1="140" y1="156" x2="223" y2="156"/>
      <line x1="140" y1="164" x2="220" y2="164"/>
    </g>
    <!-- Орнамент на обложке (виден сбоку) -->
    <path d="M20 60 L20 175" stroke="#c9a86a" stroke-width="0.8"/>
    <path d="M240 60 L240 175" stroke="#c9a86a" stroke-width="0.8"/>
  </svg>`,

  // Зеркало
  mirror: `<svg viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c9a86a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <defs>
      <linearGradient id="mirrorGlass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3a2c1c" stop-opacity="0.6"/>
        <stop offset="50%" stop-color="#1a1410" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#0d0807"/>
      </linearGradient>
    </defs>
    <!-- Внешняя рама с орнаментом -->
    <path d="M100 10 Q70 12 50 30 Q30 50 28 90 L28 230 Q30 270 50 290 Q70 308 100 310 Q130 308 150 290 Q170 270 172 230 L172 90 Q170 50 150 30 Q130 12 100 10 Z" fill="#1a1410" stroke="#8b6f47" stroke-width="2.5"/>
    <!-- Внутренняя линия рамы -->
    <path d="M100 22 Q75 24 58 40 Q42 56 40 92 L40 228 Q42 264 58 280 Q75 296 100 298 Q125 296 142 280 Q158 264 160 228 L160 92 Q158 56 142 40 Q125 24 100 22 Z" stroke="#c9a86a" stroke-width="0.8"/>
    <!-- Стекло -->
    <path d="M100 32 Q80 34 65 48 Q50 62 50 95 L50 225 Q50 258 65 272 Q80 286 100 288 Q120 286 135 272 Q150 258 150 225 L150 95 Q150 62 135 48 Q120 34 100 32 Z" fill="url(#mirrorGlass)" stroke="#8b6f47" stroke-width="0.8"/>
    <!-- Декоративный венец сверху -->
    <path d="M70 18 Q85 4 100 8 Q115 4 130 18" stroke="#c9a86a" stroke-width="1"/>
    <path d="M85 14 Q92 6 100 8 Q108 6 115 14" stroke="#8b6f47" stroke-width="0.8"/>
    <circle cx="100" cy="6" r="3" fill="#c9a86a"/>
    <!-- Декоративный венец снизу -->
    <path d="M70 302 Q85 316 100 312 Q115 316 130 302" stroke="#c9a86a" stroke-width="1"/>
    <circle cx="100" cy="314" r="3" fill="#c9a86a"/>
    <!-- Боковые украшения -->
    <circle cx="28" cy="160" r="3" fill="#c9a86a"/>
    <circle cx="172" cy="160" r="3" fill="#c9a86a"/>
    <!-- Блик на стекле -->
    <path d="M70 60 Q75 100 72 140" stroke="#c9a86a" stroke-width="0.6" opacity="0.5"/>
    <path d="M76 65 Q80 95 78 130" stroke="#c9a86a" stroke-width="0.4" opacity="0.4"/>
  </svg>`,

  // Ваза
  vase: `<svg viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c9a86a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <defs>
      <linearGradient id="vaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1a1410"/>
        <stop offset="50%" stop-color="#3a2c1c"/>
        <stop offset="100%" stop-color="#1a1410"/>
      </linearGradient>
    </defs>
    <!-- Силуэт вазы -->
    <path d="M75 30 L125 30 L130 50 L120 65 Q145 90 150 140 Q155 200 130 250 L135 280 L65 280 L70 250 Q45 200 50 140 Q55 90 80 65 L70 50 Z" fill="url(#vaseGrad)" stroke="#c9a86a" stroke-width="1.6"/>
    <!-- Горлышко -->
    <ellipse cx="100" cy="30" rx="25" ry="4" fill="#0a0807" stroke="#c9a86a"/>
    <line x1="75" y1="50" x2="125" y2="50" stroke="#8b6f47" stroke-width="0.6"/>
    <line x1="80" y1="65" x2="120" y2="65" stroke="#8b6f47" stroke-width="0.6"/>
    <!-- Орнаментальный пояс -->
    <path d="M55 130 Q100 125 145 130" stroke="#c9a86a" stroke-width="0.8"/>
    <path d="M55 145 Q100 150 145 145" stroke="#c9a86a" stroke-width="0.8"/>
    <g fill="#c9a86a" opacity="0.8">
      <circle cx="65" cy="138" r="1.5"/>
      <circle cx="85" cy="138" r="1.5"/>
      <circle cx="100" cy="138" r="1.5"/>
      <circle cx="115" cy="138" r="1.5"/>
      <circle cx="135" cy="138" r="1.5"/>
    </g>
    <!-- Орнамент -->
    <g stroke="#8b6f47" stroke-width="0.6" opacity="0.7">
      <path d="M70 170 Q80 165 90 170 Q100 175 110 170 Q120 165 130 170"/>
      <path d="M65 185 Q80 180 95 185 Q110 190 125 185 Q135 180 135 180"/>
      <path d="M75 210 Q90 205 100 210 Q110 215 125 210"/>
    </g>
    <!-- Цветок наверху -->
    <line x1="100" y1="30" x2="100" y2="-10" stroke="#8b6f47" stroke-width="0.8"/>
    <g transform="translate(100, -10)">
      <ellipse cx="0" cy="0" rx="8" ry="3" fill="#6b3a1f" stroke="#c9a86a" stroke-width="0.6"/>
      <ellipse cx="0" cy="0" rx="3" ry="6" fill="#6b3a1f" stroke="#c9a86a" stroke-width="0.6"/>
    </g>
    <!-- Основание -->
    <ellipse cx="100" cy="280" rx="35" ry="4" fill="#0a0807" stroke="#c9a86a"/>
    <path d="M80 280 L120 280 L125 295 L75 295 Z" fill="#1a1410" stroke="#c9a86a"/>
    <ellipse cx="100" cy="295" rx="25" ry="3" fill="#1a1410" stroke="#c9a86a"/>
  </svg>`,

  // Ключ
  key: `<svg viewBox="0 0 80 320" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c9a86a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <!-- Кольцо ручки -->
    <circle cx="40" cy="40" r="28" fill="#1a1410" stroke="#c9a86a" stroke-width="2"/>
    <circle cx="40" cy="40" r="18" fill="#0a0807" stroke="#8b6f47"/>
    <!-- Орнамент в кольце -->
    <g stroke="#8b6f47" stroke-width="0.6">
      <line x1="40" y1="22" x2="40" y2="28"/>
      <line x1="40" y1="52" x2="40" y2="58"/>
      <line x1="22" y1="40" x2="28" y2="40"/>
      <line x1="52" y1="40" x2="58" y2="40"/>
    </g>
    <circle cx="40" cy="40" r="3" fill="#c9a86a"/>
    <!-- Декоративные крылышки по сторонам -->
    <path d="M12 40 Q4 35 8 28 Q14 30 18 38" stroke="#8b6f47" stroke-width="1"/>
    <path d="M68 40 Q76 35 72 28 Q66 30 62 38" stroke="#8b6f47" stroke-width="1"/>
    <!-- Стержень -->
    <rect x="36" y="68" width="8" height="200" fill="#1a1410" stroke="#c9a86a" stroke-width="1.2"/>
    <line x1="40" y1="72" x2="40" y2="265" stroke="#8b6f47" stroke-width="0.4"/>
    <!-- Узлы на стержне -->
    <circle cx="40" cy="100" r="6" fill="#1a1410" stroke="#c9a86a" stroke-width="1"/>
    <circle cx="40" cy="100" r="2" fill="#c9a86a"/>
    <circle cx="40" cy="180" r="5" fill="#1a1410" stroke="#c9a86a" stroke-width="1"/>
    <!-- Бородка -->
    <path d="M44 230 L60 230 L60 240 L52 240 L52 248 L60 248 L60 258 L44 258 Z" fill="#1a1410" stroke="#c9a86a" stroke-width="1.4"/>
    <path d="M44 268 L56 268 L56 278 L44 278 Z" fill="#1a1410" stroke="#c9a86a" stroke-width="1.2"/>
  </svg>`,

  // Канделябр (вариант со свечами)
  candelabra: `<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c9a86a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <defs>
      <radialGradient id="flameC" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fde7a3" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#c9a86a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <!-- Огни ореолы -->
    <ellipse cx="60" cy="50" rx="22" ry="20" fill="url(#flameC)"/>
    <ellipse cx="120" cy="30" rx="22" ry="20" fill="url(#flameC)"/>
    <ellipse cx="180" cy="50" rx="22" ry="20" fill="url(#flameC)"/>
    <!-- Пламя -->
    <path d="M60 38 Q56 48 58 56 Q60 60 62 56 Q64 48 60 38" fill="#fde7a3" stroke="none"/>
    <path d="M120 18 Q116 28 118 36 Q120 40 122 36 Q124 28 120 18" fill="#fde7a3" stroke="none"/>
    <path d="M180 38 Q176 48 178 56 Q180 60 182 56 Q184 48 180 38" fill="#fde7a3" stroke="none"/>
    <!-- Свечи -->
    <rect x="55" y="60" width="10" height="50" fill="#2a2218" stroke="#c9a86a" stroke-width="1"/>
    <rect x="115" y="40" width="10" height="60" fill="#2a2218" stroke="#c9a86a" stroke-width="1"/>
    <rect x="175" y="60" width="10" height="50" fill="#2a2218" stroke="#c9a86a" stroke-width="1"/>
    <!-- Чашки -->
    <path d="M48 110 L72 110 L70 120 L50 120 Z" fill="#1a1410" stroke="#c9a86a"/>
    <path d="M108 100 L132 100 L130 110 L110 110 Z" fill="#1a1410" stroke="#c9a86a"/>
    <path d="M168 110 L192 110 L190 120 L170 120 Z" fill="#1a1410" stroke="#c9a86a"/>
    <!-- Изогнутые ветви -->
    <path d="M60 120 Q60 145 75 155 Q95 165 120 165" stroke="#c9a86a" stroke-width="2.5"/>
    <path d="M180 120 Q180 145 165 155 Q145 165 120 165" stroke="#c9a86a" stroke-width="2.5"/>
    <path d="M120 110 L120 165" stroke="#c9a86a" stroke-width="2.5"/>
    <!-- Декоративные узлы -->
    <circle cx="75" cy="155" r="3" fill="#c9a86a"/>
    <circle cx="165" cy="155" r="3" fill="#c9a86a"/>
    <circle cx="120" cy="165" r="5" fill="#1a1410" stroke="#c9a86a" stroke-width="1.4"/>
    <!-- Стойка -->
    <path d="M115 165 L125 165 L122 220 L118 220 Z" fill="#1a1410" stroke="#c9a86a" stroke-width="1.4"/>
    <ellipse cx="120" cy="195" rx="8" ry="5" fill="#1a1410" stroke="#c9a86a" stroke-width="1.2"/>
    <ellipse cx="120" cy="225" rx="6" ry="3" fill="#1a1410" stroke="#c9a86a"/>
    <!-- Основание -->
    <path d="M95 230 L145 230 L155 260 L85 260 Z" fill="#1a1410" stroke="#c9a86a" stroke-width="1.6"/>
    <ellipse cx="120" cy="260" rx="35" ry="5" fill="#1a1410" stroke="#c9a86a"/>
    <ellipse cx="120" cy="260" rx="30" ry="3" stroke="#8b6f47" stroke-width="0.6"/>
    <path d="M88 263 Q120 273 152 263" stroke="#8b6f47" stroke-width="0.6"/>
  </svg>`
};
