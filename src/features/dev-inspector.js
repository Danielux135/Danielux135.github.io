// inspector interactivo del tema Developer
// FAB → activa inspect mode → clic en elemento → panel de dos columnas

let _mounted       = false;
let _inspectActive = false;
let _panel         = null;
let _fab           = null;
let _hovered       = null;

// ── registro de elementos → snippets reales del código ────────────────────────
const REGISTRY = [
    // ── hero: nombre / typewriter ─────────────────────────────────────────────
    {
        test: el => el.closest('.hero-name, h1.hero-name'),
        title: 'Nombre animado con fade-up',
        file: 'src/styles/site/content.css:45',
        lang: 'css',
        desc: 'El h1 usa la clase .fade-up que lo hace invisible y desplazado hacia abajo al cargar. Un IntersectionObserver añade .visible cuando el elemento entra en el viewport, disparando la transición CSS.',
        code: `.fade-up {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.55s ease,
    transform 0.55s ease;
}

.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}

/* stagger por data-delay en cada elemento */
.fade-up[data-delay="1"] { transition-delay: 0.1s; }
.fade-up[data-delay="2"] { transition-delay: 0.2s; }`,
    },
    {
        test: el => el.closest('#typewriter, .hero-subtitle'),
        title: 'Efecto typewriter',
        file: 'src/features/site-ui.js:12',
        lang: 'js',
        desc: 'El typewriter cicla entre las tres traducciones del subtítulo. Borra carácter a carácter con un delay aleatorio para simular velocidad humana, luego escribe el siguiente texto.',
        code: `const phrases = translations[lang].hero.subtitle;
let i = 0, char = 0, deleting = false;

function tick() {
  const phrase = phrases[i % phrases.length];
  if (!deleting) {
    el.textContent = phrase.slice(0, ++char);
    if (char === phrase.length) {
      deleting = true;
      return setTimeout(tick, 1800);
    }
  } else {
    el.textContent = phrase.slice(0, --char);
    if (char === 0) {
      deleting = false;
      i++;
    }
  }
  setTimeout(tick, deleting
    ? 40 + Math.random() * 30
    : 70 + Math.random() * 50);
}`,
    },
    {
        test: el => el.closest('.hero-status-pill, .hero-status'),
        title: 'Badge "Disponible"',
        file: 'src/styles/site/content.css:82',
        lang: 'css',
        desc: 'El dot verde usa una animación de pulso (scale + opacity) en loop para simular un indicador de estado en tiempo real, como los que usan Discord o Slack.',
        code: `.hero-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  position: relative;
}

/* pulso animado — igual que Discord online */
.hero-status-dot::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: #22c55e;
  animation: statusPulse 2s ease-out infinite;
}

@keyframes statusPulse {
  0%   { transform: scale(1);   opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}`,
    },
    {
        test: el => el.closest('.hero-social a, .hero-social'),
        title: 'Links de redes sociales',
        file: 'src/styles/site/content.css:115',
        lang: 'css',
        desc: 'Los iconos de redes son enlaces normales con <a> y Font Awesome. El hover levanta el icono con translateY y lo tinta con el color de acento activo, que cambia según el tema del portfolio.',
        code: `.hero-social a {
  color: var(--muted);
  font-size: 1.25rem;
  transition:
    color var(--ease),
    transform var(--ease);
}

.hero-social a:hover {
  color: rgb(var(--accent-1-rgb));
  transform: translateY(-3px);
}

/* Brand colors opcionales por icono */
.hero-social a[title="GitHub"]:hover   { color: #333; }
.hero-social a[title="Spotify"]:hover  { color: #1DB954; }
.hero-social a[title="Twitch"]:hover   { color: #9146FF; }`,
    },
    {
        test: el => el.closest('.btn-primary, .btn-outline, .hero-cta a'),
        title: 'Botones CTA del hero',
        file: 'src/styles/core/foundation.css:180',
        lang: 'css',
        desc: 'Los botones usan dos variantes: .btn-primary (relleno con el acento) y .btn-outline (borde transparente). Ambos comparten la misma estructura base y solo difieren en color de fondo y borde.',
        code: `.btn-primary,
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 0.9rem;
  transition:
    background var(--ease),
    border-color var(--ease),
    transform var(--ease);
}

.btn-primary {
  background: rgb(var(--accent-1-rgb));
  color: #fff;
  border: 1.5px solid transparent;
}

.btn-outline {
  background: transparent;
  border: 1.5px solid var(--border);
  color: var(--text);
}

.btn-primary:hover,
.btn-outline:hover {
  transform: translateY(-2px);
}`,
    },
    {
        test: el => el.closest('canvas#particles'),
        title: 'Canvas de partículas del hero',
        file: 'src/visuals/hero-studio.js:18',
        lang: 'js',
        desc: 'El canvas de partículas vive detrás del contenido del hero. Cada fondo (Orbits, Galaxy, etc.) dibuja en él con su propio módulo. El hero-studio gestiona cuál está activo y les pasa el beat de la música.',
        code: `// hero-studio.js inicializa el canvas
const canvas = document.getElementById('particles');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

// el fondo activo recibe el beat de la música
function renderFrame(beat) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  activeBg?.draw(ctx, canvas.width, canvas.height, {
    beat,
    accent1: getComputedStyle(root)
      .getPropertyValue('--accent-1-rgb'),
  });
  requestAnimationFrame(() =>
    renderFrame(parseFloat(
      root.style.getPropertyValue('--beat-alpha') || 0
    ))
  );
}`,
    },
    // ── navbar ────────────────────────────────────────────────────────────────
    {
        test: el => el.closest('nav a[href^="#"], .nav-links a'),
        title: 'Enlace de navegación activo',
        file: 'src/features/section-navigation.js',
        lang: 'js',
        desc: 'Un IntersectionObserver detecta qué sección es visible y actualiza la clase .active en el enlace correspondiente. Más eficiente que un scroll listener: solo dispara cuando la sección cruza el umbral definido.',
        code: `const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach(a =>
      a.classList.toggle('active',
        a.getAttribute('href') === \`#\${id}\`
      )
    );
  });
}, {
  rootMargin: '-40% 0px -50% 0px',
  threshold: 0,
});

sections.forEach(s => observer.observe(s));`,
    },
    {
        test: el => el.closest('.lang-switcher, .lang-btn, #langSwitcher'),
        title: 'Selector de idioma (ES / EN / VAL)',
        file: 'src/features/site-ui.js:88',
        lang: 'js',
        desc: 'El portfolio soporta 3 idiomas: español, inglés y valenciano. Al cambiar, se reemplaza el textContent de todos los elementos con data-i18n y se guarda la preferencia en localStorage.',
        code: `// aplica el idioma seleccionado
function setLang(lang) {
  const t = translations[lang];

  document.querySelectorAll('[data-i18n]')
    .forEach(el => {
      const key = el.dataset.i18n;
      const val = getNestedValue(t, key);
      if (val) el.textContent = val;
    });

  // atributos (aria-label, placeholder, etc.)
  document.querySelectorAll('[data-i18n-aria-label]')
    .forEach(el => {
      const key = el.dataset.i18nAriaLabel;
      const val = getNestedValue(t, key);
      if (val) el.setAttribute('aria-label', val);
    });

  localStorage.setItem('portfolioLang', lang);
  document.documentElement.lang = lang;
}`,
    },
    {
        test: el => el.closest('.cmd-palette-trigger, #cmdPaletteTrigger'),
        title: 'Command palette (⌘K)',
        file: 'src/features/command-palette.js',
        lang: 'js',
        desc: 'El atajo ⌘K abre una paleta de comandos estilo VS Code. Filtra secciones, proyectos y acciones del portfolio en tiempo real con un input. Navegable con flechas y confirmable con Enter.',
        code: `// activa con ⌘K / Ctrl+K
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openPalette();
  }
});

// filtrado en tiempo real
input.addEventListener('input', () => {
  const q = input.value.toLowerCase();
  items.forEach(item => {
    const match = item.label.toLowerCase().includes(q)
               || item.keywords?.some(k =>
                    k.toLowerCase().includes(q));
    item.el.hidden = !match;
  });
});`,
    },
    {
        test: el => el.closest('#themeToggle, .theme-toggle'),
        title: 'Toggle claro / oscuro',
        file: 'src/core/theme.js:8',
        lang: 'js',
        desc: 'El toggle alterna la clase .theme-light en <html> y guarda la preferencia en localStorage. La clase activa un set diferente de variables CSS — no hay JavaScript en los colores, solo Custom Properties.',
        code: `export function applyColorTheme(theme, {
  persist = true
} = {}) {
  const light = theme === 'light';
  THEME_ROOT.classList.toggle('theme-light', light);

  if (light)
    THEME_ROOT.setAttribute('data-theme', 'light');
  else
    THEME_ROOT.removeAttribute('data-theme');

  if (persist)
    localStorage.setItem('portfolioTheme',
      light ? 'light' : 'dark');
}

// el botón registra el toggle
btn.addEventListener('click', () => {
  const isLight = root.classList
    .contains('theme-light');
  applyColorTheme(isLight ? 'dark' : 'light');
});`,
    },
    {
        test: el => el.closest('.btn-cv, [href*="cv"]'),
        title: 'Botón de descarga del CV',
        file: 'index.html:144',
        lang: 'css',
        desc: 'El CV es un HTML estático generado en public/assets/cv.html. Se abre en nueva pestaña con target="_blank". El botón comparte la misma clase .btn-cv que tiene colores de acento específicos.',
        code: `.btn-cv {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: 0.8125rem;
  font-weight: 500;
  transition:
    color var(--ease),
    border-color var(--ease),
    background var(--ease);
}

.btn-cv:hover {
  color: var(--text);
  border-color: rgb(var(--accent-1-rgb) / 0.5);
  background: rgb(var(--accent-1-rgb) / 0.06);
}`,
    },
    // ── about ─────────────────────────────────────────────────────────────────
    {
        test: el => el.closest('.about-avatar, .about-photo-col'),
        title: 'Avatar beat-reactivo',
        file: 'src/styles/site/content.css:28',
        lang: 'css',
        desc: 'El anillo exterior es un ::before con conic-gradient que gira en loop. El glow que ves latir usa calc() con --beat-alpha, la variable CSS que el AudioContext actualiza 60 veces por segundo mientras suena música.',
        code: `.about-avatar::before {
  content: '';
  inset: -5px;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
    var(--accent-1) 0deg,
    var(--accent-2) 90deg,
    var(--accent-1) 360deg);
  animation: avatarSpin 3s linear infinite;

  /* glow proporcional al beat de la música */
  box-shadow: 0 0
    calc(var(--beat-alpha) * 30px)
    rgb(var(--accent-2-rgb) /
      calc(var(--beat-alpha) * 0.7));
}`,
    },
    {
        test: el => el.closest('.chip, .about-chips'),
        title: 'Chips de tecnología',
        file: 'src/styles/site/content.css:195',
        lang: 'css',
        desc: 'Los chips son <span> con un icono de Font Awesome y el nombre de la tecnología. Usan border con el color de acento al 20% de opacidad para adaptarse automáticamente al tema activo.',
        code: `.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 0.8rem;
  background: rgb(var(--accent-1-rgb) / 0.08);
  border: 1px solid rgb(var(--accent-1-rgb) / 0.2);
  color: var(--text);
  white-space: nowrap;
}

.chip i {
  color: rgb(var(--accent-1-rgb));
  font-size: 0.75rem;
}`,
    },
    {
        test: el => el.closest('.skill-bar, [data-level], .bar-fill, .bar-track'),
        title: 'Skill bar animada',
        file: 'src/features/site-ui.js:145',
        lang: 'js',
        desc: 'El nivel se lee del atributo data-level del elemento padre. Cuando el skill bar entra en el viewport (IntersectionObserver), se anima el width de .bar-fill del 0% al valor del data-level.',
        code: `// observa los skill bars para animarlos al entrar
const barObserver = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const bar = entry.target;
    const lvl = bar.closest('[data-level]')
                   ?.dataset.level ?? '0';
    bar.querySelector('.bar-fill')
       .style.width = lvl + '%';
    barObserver.unobserve(bar);
  }),
  { threshold: 0.3 }
);

document.querySelectorAll('.skill-bar')
  .forEach(b => barObserver.observe(b));`,
    },
    // ── música ────────────────────────────────────────────────────────────────
    {
        test: el => el.closest('#playerStage, .player-stage, .player-card'),
        title: 'Reproductor de música',
        file: 'src/features/player.js:27',
        lang: 'js',
        desc: 'El player usa Web Audio API con un AnalyserNode para extraer energía por frecuencia en tiempo real. El RMS de la onda se convierte en --beat-alpha y se inyecta como variable CSS global cada frame.',
        code: `const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
const source   = audioCtx.createMediaElementSource(audio);

analyser.fftSize = 256;
source.connect(analyser);
analyser.connect(audioCtx.destination);

const dataArr = new Uint8Array(analyser.fftSize);

function tick() {
  analyser.getByteTimeDomainData(dataArr);
  const rms = Math.sqrt(
    dataArr.reduce((s, v) =>
      s + (v - 128) ** 2, 0) / dataArr.length
  ) / 128;
  // inyecta en CSS — todos los elementos pueden leerlo
  root.style.setProperty('--beat-alpha',
    rms.toFixed(3));
  requestAnimationFrame(tick);
}`,
    },
    {
        test: el => el.closest('.spotify-card, .spotify-embed'),
        title: 'Tarjeta de Spotify',
        file: 'src/styles/site/content.css:290',
        lang: 'css',
        desc: 'La tarjeta de Spotify es un enlace <a> con una imagen y un overlay. Al hacer hover aparece el icono de play con una transición de opacidad. No usa el embed de Spotify para mantener control total del diseño.',
        code: `.spotify-card {
  display: block;
  border-radius: var(--radius);
  overflow: hidden;
  position: relative;
}

.spotify-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.spotify-card:hover .spotify-card-overlay {
  opacity: 1;
}`,
    },
    {
        test: el => el.closest('.music-stat-item, .music-stats'),
        title: 'Contador animado de estadísticas',
        file: 'src/features/site-ui.js:210',
        lang: 'js',
        desc: 'Los números (255M, #3, 150+) se animan desde 0 hasta su valor real cuando entran en el viewport. Un IntersectionObserver dispara el contador, que usa requestAnimationFrame con easing.',
        code: `function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  const isPrefix = el.dataset.prefix;

  function update(now) {
    const p = Math.min((now - start) / duration, 1);
    // easeOutQuart
    const ease = 1 - Math.pow(1 - p, 4);
    const val  = Math.round(ease * target);
    el.textContent = isPrefix
      ? '#' + val
      : val.toLocaleString();
    if (p < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}`,
    },
    // ── proyectos ─────────────────────────────────────────────────────────────
    {
        test: el => el.closest('.project-card'),
        title: 'Tarjeta de proyecto',
        file: 'src/styles/site/projects-contact.css:18',
        lang: 'css',
        desc: 'Las tarjetas usan un border-left coloreado con el acento para crear jerarquía visual. El efecto hover combina translateY con un box-shadow más grande, simulando que la tarjeta "flota".',
        code: `.project-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  transition:
    transform var(--ease),
    box-shadow var(--ease),
    border-color var(--ease);
}

.project-card:hover {
  transform: translateY(-3px);
  border-color: rgb(var(--accent-1-rgb) / 0.4);
  box-shadow:
    0 12px 40px rgba(0,0,0,0.3),
    0 0 0 1px rgb(var(--accent-1-rgb) / 0.1);
}`,
    },
    {
        test: el => el.closest('.demo-card, .demo-hub'),
        title: 'Tarjeta de demo web',
        file: 'src/features/demo-hub.js',
        lang: 'js',
        desc: 'El hub de demos carga las tarjetas dinámicamente desde un array de datos. Cada demo tiene una miniatura generada a partir de un screenshot estático en public/demos/. Al hacer clic, abre la demo en un iframe o nueva pestaña.',
        code: `// cada demo se define como un objeto
const demos = [
  {
    id: 'restaurante',
    title: 'Web de restaurante',
    tags: ['HTML', 'CSS', 'JS'],
    thumb: '/demos/restaurante/thumb.jpg',
    url: '/demos/restaurante/',
  },
  // ...
];

// genera las tarjetas en el DOM
demos.forEach(demo => {
  const card = document.createElement('article');
  card.className = 'demo-card';
  card.innerHTML = \`
    <img src="\${demo.thumb}" alt="\${demo.title}">
    <div class="demo-card-body">
      <h3>\${demo.title}</h3>
      <div class="demo-tags">
        \${demo.tags.map(t =>
          \`<span class="tag">\${t}</span>\`
        ).join('')}
      </div>
    </div>\`;
  grid.appendChild(card);
});`,
    },
    // ── arcade ────────────────────────────────────────────────────────────────
    {
        test: el => el.closest('#arcadeOverlay, .arcade-overlay, .arcade-card, .os-game-card'),
        title: 'Motor del arcade',
        file: 'src/arcade/runtime.js:514',
        lang: 'js',
        desc: 'El arcade usa Canvas 2D con game loop de requestAnimationFrame. Cuando se abre, usa html.arcade-lock que oculta el resto del portfolio con visibility: hidden sin destruir el DOM ni sus event listeners.',
        code: `// arcade-lock: oculta el portfolio sin desmontarlo
// html.arcade-lock body > :not(#arcadeOverlay) {
//   visibility: hidden;
// }

const Arcade = {
  games: [],
  register(def) { this.games.push(def); },

  open() {
    document.documentElement
      .classList.add('arcade-lock');
    this._overlay.style.display = 'flex';
  },

  close() {
    document.documentElement
      .classList.remove('arcade-lock');
    this._overlay.style.display = 'none';
    this._active?.onEnd?.();
    this._active = null;
    cancelAnimationFrame(this._raf);
  },
};`,
    },
    // ── hero canvas / fondos ──────────────────────────────────────────────────
    {
        test: el => el.closest('[class*="hero-bg"], canvas#heroCanvas, #heroCanvas'),
        title: 'Fondo de hero animado',
        file: 'src/visuals/backgrounds/',
        lang: 'js',
        desc: 'Cada fondo es un módulo independiente con init, draw y destroy. El hero-studio los importa dinámicamente — solo el activo vive en memoria. Reciben el beat de la música via state.beat para reaccionar al ritmo.',
        code: `// estructura de un background modular
export function init(canvas, ctx) {
  // configura el estado inicial del fondo
  // registra ResizeObserver si lo necesita
}

export function draw(ctx, W, H, state) {
  // renderizado cada frame (~60fps)
  // state.beat ← --beat-alpha del AudioContext
  // state.accent1/2 ← colores de acento activos
}

export function destroy() {
  // cancela animaciones, elimina listeners
}

// importación dinámica en hero-studio.js:
const mod = await import(
  \`./backgrounds/themes/\${name}.js\`
);
mod.init(canvas, ctx);`,
    },
    // ── studio / personalización ──────────────────────────────────────────────
    {
        test: el => el.closest('.studio-panel, #studioPanel, [class*="studio"]'),
        title: 'Panel de personalización',
        file: 'src/visuals/hero-studio.js:313',
        lang: 'js',
        desc: 'El studio usa View Transitions API para animar el cambio de tema con una transición nativa del navegador. Los colores se convierten de HSL a RGB y se inyectan como variables CSS globales para que todo el portfolio los use.',
        code: `function applyTheme() {
  applyStyleTheme(t.id);        // clase en <html>
  applyHueColors(t.h1, t.h2);  // inyecta accent-1/2
}

// View Transitions API
if (document.startViewTransition) {
  document.documentElement.dataset.vtTheme = '1';
  const vt = document.startViewTransition(applyTheme);
  vt.finished.finally(() => {
    delete document.documentElement.dataset.vtTheme;
  });
} else {
  applyTheme();
}

// convierte HSL → RGB y lo inyecta como CSS var
function applyHueColors(h1, h2) {
  root.style.setProperty('--accent-1-rgb',
    hslToRgb(h1, 92, 56));
  root.style.setProperty('--accent-2-rgb',
    hslToRgb(h2, 88, 60));
}`,
    },
    // ── navbar ────────────────────────────────────────────────────────────────
    {
        test: el => el.closest('nav, #navbar'),
        title: 'Navbar',
        file: 'src/styles/site/navigation.css',
        lang: 'css',
        desc: 'El navbar usa position: sticky con backdrop-filter para el efecto cristal. --nav-h es una variable CSS que otras partes del portfolio usan para calcular offsets (scroll padding, sticky headers).',
        code: `#navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: var(--nav-h);
  background: var(--bg) / 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  transition:
    background var(--ease),
    box-shadow var(--ease);
}

/* sombra cuando hay scroll */
#navbar.scrolled {
  box-shadow: 0 1px 12px rgba(0,0,0,0.08);
}`,
    },
    // ── contacto ─────────────────────────────────────────────────────────────
    {
        test: el => el.closest('input, textarea, .contact-field'),
        title: 'Campo del formulario',
        file: 'src/styles/site/projects-contact.css:180',
        lang: 'css',
        desc: 'Los inputs tienen un border que cambia de color al estar en foco, usando el color de acento global. El outline nativo del navegador se elimina y se sustituye por el border animado para mayor control.',
        code: `.contact-input,
.contact-textarea {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-alt);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9375rem;
  transition: border-color 0.15s;
  outline: none;
}

.contact-input:focus,
.contact-textarea:focus {
  border-color: rgb(var(--accent-1-rgb));
  background: var(--surface);
}`,
    },
    {
        test: el => el.closest('.contact-form, #contactForm'),
        title: 'Formulario de contacto',
        file: 'src/features/contact-form.js',
        lang: 'js',
        desc: 'El envío usa la API de Brevo (ex Sendinblue) via fetch con el método POST. El token de la API vive exclusivamente en las variables de entorno de Vercel — nunca se expone al cliente.',
        code: `async function sendEmail({ name, email, message }) {
  const res = await fetch(
    'https://api.brevo.com/v3/smtp/email',
    {
      method: 'POST',
      headers: {
        'api-key': import.meta.env.VITE_BREVO_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name, email },
        to: [{ email: TARGET_EMAIL }],
        subject: \`Portfolio: \${name}\`,
        textContent: message,
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
}`,
    },
    // ── about: sección general ────────────────────────────────────────────────
    {
        test: el => el.closest('section#sobre-mi, [id="sobre-mi"]'),
        title: 'Sección About (grid 3 col)',
        file: 'src/styles/site/content.css:1',
        lang: 'css',
        desc: 'Grid de 3 columnas: foto sticky, bio y skill bars. La foto es sticky dentro de su columna con top calculado dinámicamente para no chocar con el navbar.',
        code: `.about-grid {
  display: grid;
  grid-template-columns: 220px 1fr 1.2fr;
  gap: 52px;
  align-items: start;
  margin-top: 56px;
}

/* foto sticky — se queda visible mientras scrolleas la bio */
.about-photo-col {
  position: sticky;
  top: calc(var(--nav-h) + 24px);
}

@media (max-width: 900px) {
  .about-grid {
    grid-template-columns: 1fr;
  }
  .about-photo-col {
    position: static;
  }
}`,
    },
];

// ── resuelve el mejor match del registro para un elemento ─────────────────────
function _resolve(el) {
    for (const entry of REGISTRY) {
        if (entry.test(el)) return entry;
    }
    return null;
}

// ── genera el selector legible de un elemento ─────────────────────────────────
function _selector(el) {
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body && parts.length < 4) {
        let s = cur.tagName?.toLowerCase() || '';
        if (cur.id)                s += `#${cur.id}`;
        else if (cur.className && typeof cur.className === 'string') {
            const cls = cur.className.trim().split(/\s+/).slice(0, 2).join('.');
            if (cls) s += `.${cls}`;
        }
        parts.unshift(s);
        cur = cur.parentElement;
    }
    return parts.join(' > ');
}

// ── syntax highlighter minimalista (CSS y JS) ─────────────────────────────────
function _highlight(code, lang) {
    const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    if (lang === 'css') {
        return esc(code)
            .replace(/(\/\*[\s\S]*?\*\/)/g,          '<span class="sy-comment">$1</span>')
            .replace(/^([^\s{][^{]+)(?=\s*\{)/gm,    '<span class="sy-selector">$1</span>')
            .replace(/(@\w[\w-]*)/g,                  '<span class="sy-at">$1</span>')
            .replace(/([\w-]+)(?=\s*:)/g,             '<span class="sy-prop">$1</span>')
            .replace(/\b(\d[\d.]*(?:px|em|rem|%|s|ms|deg|vh|vw)?)\b/g, '<span class="sy-number">$1</span>')
            .replace(/(var\(--[\w-]+\))/g,            '<span class="sy-fn">$1</span>');
    }

    const KEYWORDS = /\b(const|let|var|function|return|import|export|from|if|else|for|of|in|async|await|new|class|this|null|undefined|true|false|typeof|instanceof)\b/g;
    return esc(code)
        .replace(/(\/\/[^\n]*)/g,                    '<span class="sy-comment">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/g,              '<span class="sy-comment">$1</span>')
        .replace(/(`[^`]*`|&#39;[^&#39;]*&#39;|&quot;[^&quot;]*&quot;)/g, '<span class="sy-string">$1</span>')
        .replace(KEYWORDS,                            '<span class="sy-keyword">$1</span>')
        .replace(/\b([A-Z][a-zA-Z]+)\b/g,            '<span class="sy-type">$1</span>')
        .replace(/\b([a-z_$][a-z_$0-9]*)\s*(?=\()/g, '<span class="sy-fn">$1</span>')
        .replace(/\b(\d[\d.]*)\b/g,                  '<span class="sy-number">$1</span>');
}

// ── genera el gutter de números de línea ──────────────────────────────────────
function _gutter(code) {
    return Array.from({ length: code.split('\n').length }, (_, i) => i + 1).join('\n');
}

// ── rellena el panel con la entrada seleccionada ──────────────────────────────
function _showPanel(entry, el) {
    if (!_panel) return;
    _panel.querySelector('.dev-inspector-title').textContent     = entry.title;
    _panel.querySelector('.dev-inspector-selector').textContent  = _selector(el);
    _panel.querySelector('.dev-inspector-file').textContent      = entry.file;
    _panel.querySelector('.dev-inspector-desc-text').textContent = entry.desc;
    _panel.querySelector('.dev-inspector-gutter').textContent    = _gutter(entry.code);
    _panel.querySelector('.dev-inspector-code').innerHTML        = _highlight(entry.code, entry.lang);
    _panel.classList.add('dev-inspector--open');
    _panel._currentEntry = entry;
    _panel._currentEl    = el;
}

// ── construye el DOM del panel (dos columnas) ─────────────────────────────────
function _buildPanel() {
    _panel = document.createElement('div');
    _panel.id = 'dev-inspector';
    _panel.setAttribute('aria-label', 'Inspector de código');
    _panel.innerHTML = `
        <div class="dev-inspector-titlebar">
            <span class="dev-inspector-icon">{ }</span>
            <span class="dev-inspector-title">—</span>
            <span class="dev-inspector-selector"></span>
            <span class="dev-inspector-file"></span>
            <button class="dev-inspector-close">✕ cerrar</button>
        </div>
        <div class="dev-inspector-content">
            <div class="dev-inspector-desc-pane">
                <div class="dev-inspector-desc-label">descripción</div>
                <div class="dev-inspector-desc-text">Haz clic en cualquier elemento del portfolio para ver cómo está construido.</div>
            </div>
            <div class="dev-inspector-code-pane">
                <div class="dev-inspector-gutter"></div>
                <pre class="dev-inspector-code"></pre>
            </div>
        </div>`;

    document.body.appendChild(_panel);

    _panel.querySelector('.dev-inspector-close').addEventListener('click', () => {
        _panel.classList.remove('dev-inspector--open');
    });
}

// ── construye el FAB ──────────────────────────────────────────────────────────
function _buildFab() {
    _fab = document.createElement('button');
    _fab.id = 'dev-inspect-fab';
    _fab.setAttribute('title', 'Activar modo inspección · Esc para salir');
    _fab.innerHTML = `<span aria-hidden="true">&lt;/&gt;</span>&nbsp;Inspect`;
    _fab.addEventListener('click', _toggleInspectMode);
    document.body.appendChild(_fab);
}

// ── activa / desactiva el modo inspección ─────────────────────────────────────
function _toggleInspectMode() {
    _inspectActive = !_inspectActive;
    document.documentElement.classList.toggle('dev-inspect-active', _inspectActive);

    if (_inspectActive) {
        _fab.innerHTML = `<span aria-hidden="true">✕</span>&nbsp;Salir`;
        document.addEventListener('mouseover', _onMouseover, { passive: true });
        document.addEventListener('click',     _onClick,     { capture: true });
    } else {
        _fab.innerHTML = `<span aria-hidden="true">&lt;/&gt;</span>&nbsp;Inspect`;
        document.removeEventListener('mouseover', _onMouseover);
        document.removeEventListener('click',     _onClick,   { capture: true });
        if (_hovered) { _hovered.removeAttribute('data-inspect-hover'); _hovered = null; }
        _panel?.classList.remove('dev-inspector--open');
    }
}

// ── hover: outline dashed en el elemento apuntado ─────────────────────────────
function _onMouseover(e) {
    if (_hovered && _hovered !== e.target) {
        _hovered.removeAttribute('data-inspect-hover');
        _hovered = null;
    }
    const entry = _resolve(e.target);
    if (!entry) return;
    e.target.setAttribute('data-inspect-hover', '');
    _hovered = e.target;
}

// ── click: muestra el panel ───────────────────────────────────────────────────
function _onClick(e) {
    if (e.target.closest('#dev-inspector') || e.target.closest('#dev-inspect-fab')) return;
    const entry = _resolve(e.target);
    if (!entry) return;
    e.stopPropagation();
    e.preventDefault();
    _showPanel(entry, e.target);
}

// ── escape: cierra panel o sale del inspect mode ──────────────────────────────
function _onKeydown(e) {
    if (e.key === 'Escape') {
        if (_panel?.classList.contains('dev-inspector--open')) {
            _panel.classList.remove('dev-inspector--open');
        } else if (_inspectActive) {
            _toggleInspectMode();
        }
    }
}

// ── API pública ───────────────────────────────────────────────────────────────
export function mount() {
    if (_mounted) return;
    _mounted = true;
    _buildPanel();
    _buildFab();
    document.addEventListener('keydown', _onKeydown);
}

export function unmount() {
    if (!_mounted) return;
    _mounted = false;

    if (_inspectActive) {
        _inspectActive = false;
        document.documentElement.classList.remove('dev-inspect-active');
        document.removeEventListener('mouseover', _onMouseover);
        document.removeEventListener('click',     _onClick,   { capture: true });
        if (_hovered) { _hovered.removeAttribute('data-inspect-hover'); _hovered = null; }
    }

    _panel?.remove(); _panel = null;
    _fab?.remove();   _fab   = null;
    document.removeEventListener('keydown', _onKeydown);
}

// escucha cambios de tema para auto montar/desmontar
document.addEventListener('stylethemechange', ({ detail }) => {
    if (detail.theme === 'developer') mount();
    else unmount();
});
