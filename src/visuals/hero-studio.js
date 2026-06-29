import { translations, studioT as _studioT } from '../data/translations.js';
import { weather } from '../state/weather.js';
import { currentLanguage, updateWeatherEyebrow } from '../features/site-ui.js';
import { applyStyleTheme } from '../core/theme.js';
import { canvas } from './backgrounds/context.js';
import {
    HERO_BACKGROUNDS,
    getActiveBackgroundId,
    setBackgroundTheme,
} from './backgrounds/manager.js';
import {
    WEATHER_PRESETS,
    buildWeather,
    describeWeather,
    matchWeatherPreset,
    restoreWeather,
    toggleWeather,
} from './weather-overlay.js';
import { hslToRgb } from './color-utils.js';
import './hero-renderer.js';

export { visualState } from './hero-renderer.js';

function studioT(key, lang = currentLanguage || 'es') {
    return _studioT(key, lang, translations);
}

function currentStudioLang() {
    return currentLanguage || 'es';
}

function applyHueColors(h1, h2) {
    h1 = ((h1 % 360) + 360) % 360;
    h2 = ((h2 % 360) + 360) % 360;
    const [r1,g1,b1] = hslToRgb(h1, 100, 55);
    const [r2,g2,b2] = hslToRgb(h2, 90, 60);
    const c1 = `rgb(${r1},${g1},${b1})`;
    const c2 = `rgb(${r2},${g2},${b2})`;
    const root = document.documentElement;
    root.style.setProperty('--accent-1',     c1);
    root.style.setProperty('--accent-2',     c2);
    root.style.setProperty('--accent-1-rgb', `${r1} ${g1} ${b1}`);
    root.style.setProperty('--accent-2-rgb', `${r2} ${g2} ${b2}`);
    root.style.setProperty('--gradient',     `linear-gradient(135deg,${c1} 0%,${c2} 100%)`);
    window._accent1Rgb  = [r1, g1, b1];
    window._accent2Rgb  = [r2, g2, b2];
    window._paletteH1   = h1;
    window._paletteH2   = h2;
    window._paletteL1   = 55;
    window._paletteL2   = 60;
    localStorage.setItem('portfolioH1', h1);
    localStorage.setItem('portfolioH2', h2);
}

// presets de paleta de color predefinidos para el studio
const COLOR_PRESETS = [
    { id: 'cyber',    labelKey: 'cyber',     h1: 195, h2: 270 },
    { id: 'fuego',    labelKey: 'fire',      h1: 22,  h2: 0   },
    { id: 'bosque',   labelKey: 'forest',    h1: 145, h2: 195 },
    { id: 'aurora',   labelKey: 'aurora',    h1: 330, h2: 268 },
    { id: 'oro',      labelKey: 'gold',      h1: 43,  h2: 22  },
    { id: 'neon',     labelKey: 'neon',      h1: 84,  h2: 190 },
    { id: 'amatista', labelKey: 'amethyst',  h1: 280, h2: 340 },
    { id: 'carmin',   labelKey: 'crimson',   h1: 355, h2: 325 },
    { id: 'amarillo', labelKey: 'yellow',    h1: 62,  h2: 40  },
    { id: 'lima',     labelKey: 'lime',      h1: 110, h2: 150 },
    { id: 'turquesa', labelKey: 'turquoise', h1: 170, h2: 200 },
    { id: 'oceano',   labelKey: 'ocean',     h1: 218, h2: 248 },
    { id: 'fucsia',   labelKey: 'fuchsia',   h1: 305, h2: 345 },
];

// crea y gestiona el selector de tono (franja arcoíris con thumb arrastrable)
function createHueStrip(canvas, initialH1, hueOffset, onChange) {
    const ctx = canvas.getContext('2d');
    const TH  = canvas.height; // track height in CSS px
    let h1       = initialH1;
    let offset   = hueOffset;
    let dragging = false;
    const DPR    = window.devicePixelRatio || 1;

    // ajusta las dimensiones del canvas al contenedor y escala por dpr
    function syncSize() {
        const W = canvas.parentElement ? canvas.parentElement.clientWidth : 244;
        canvas.width  = W * DPR;
        canvas.height = TH * DPR;
        canvas.style.width  = W  + 'px';
        canvas.style.height = TH + 'px';
        ctx.scale(DPR, DPR);
    }

    // dibuja la franja arcoíris y el thumb en la posición del tono actual
    function draw() {
        const W  = canvas.width  / DPR;
        const H  = canvas.height / DPR;
        const R  = H / 2;
        ctx.clearRect(0, 0, W, H);

        // franja degradada de 360° de tono
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        for (let i = 0; i <= 12; i++) grad.addColorStop(i / 12, `hsl(${i * 30},92%,56%)`);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, W, H, R);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // thumb circular con sombra y color del tono seleccionado
        const tx = Math.max(R, Math.min(W - R, (h1 / 360) * W));
        const ty = H / 2;
        const tr = H * 0.82;

        // sombra del thumb
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur  = 6;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();

        // relleno interior con el color del tono
        ctx.beginPath();
        ctx.arc(tx, ty, tr - 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${h1},100%,55%)`;
        ctx.fill();
    }

    // calcula el tono (0-360) a partir de la posición del puntero sobre el canvas
    function hueFromEvent(e) {
        const rect = canvas.getBoundingClientRect();
        const cx   = e.touches ? e.touches[0].clientX : e.clientX;
        const x    = Math.max(0, Math.min(cx - rect.left, rect.width));
        return (x / rect.width) * 360;
    }

    let rafPending = false;
    // agrupa las llamadas a onChange en un requestanimationframe para evitar recalcs continuos
    function scheduleApply() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => { rafPending = false; onChange(h1, offset); });
    }

    canvas.addEventListener('mousedown', e => {
        dragging = true; window._colorDragging = true;
        h1 = hueFromEvent(e); draw(); onChange(h1, offset);
    });
    canvas.addEventListener('touchstart', e => {
        e.preventDefault(); dragging = true; window._colorDragging = true;
        h1 = hueFromEvent(e); draw(); onChange(h1, offset);
    }, { passive: false });
    window.addEventListener('mousemove', e => {
        if (!dragging) return; h1 = hueFromEvent(e); draw(); scheduleApply();
    });
    window.addEventListener('touchmove', e => {
        if (!dragging) return; e.preventDefault(); h1 = hueFromEvent(e); draw(); scheduleApply();
    }, { passive: false });
    window.addEventListener('mouseup',  () => { dragging = false; window._colorDragging = false; });
    window.addEventListener('touchend', () => { dragging = false; window._colorDragging = false; });

    syncSize();
    draw();

    return {
        update(newH1, newOffset) { h1 = newH1; offset = newOffset; syncSize(); draw(); }
    };
}

// inicializa el panel de personalización visual (studio): sub-FABs y paneles por categoría
function initStudio() {
    const wrap      = document.getElementById('studioWrap');
    const fab       = document.getElementById('studioFab');
    const bgGrid    = document.getElementById('studioBgGrid');
    const presetsEl = document.getElementById('studioPresets');
    const stripCv   = document.getElementById('studioHueStrip');
    if (!wrap || !fab || !bgGrid || !presetsEl || !stripCv) return;

    // restaura el preset y los tonos guardados en localstorage
    let savedId = localStorage.getItem('portfolioPreset') || 'cyber';
    let savedH1 = parseFloat(localStorage.getItem('portfolioH1') || '195');
    let savedH2 = parseFloat(localStorage.getItem('portfolioH2') || '262');
    let activePreset = COLOR_PRESETS.find(p => p.id === savedId) || COLOR_PRESETS[0];
    let hueOffset = savedH2 - savedH1; // separación entre los dos tonos del degradado
    applyHueColors(savedH1, savedH2);

    // franja de tono: al arrastrar actualiza los colores y deselecciona el preset si se aleja
    const strip = createHueStrip(stripCv, savedH1, hueOffset, (newH1, offset) => {
        const newH2 = newH1 + offset;
        applyHueColors(newH1, newH2);
        // deselecciona el preset si el tono se aleja de su valor
        presetsEl.querySelectorAll('.studio-preset-btn').forEach(b => {
            const match = Math.abs(parseFloat(b.dataset.h1) - newH1) < 6;
            b.classList.toggle('active', match);
        });
    });

    // colores default por cada tema visual (para el botón dinámico de posición 0)
    const STYLE_DEFAULT_COLORS = {
        'retro':     { h1: 120, h2: 88  },
        'gamer':     { h1: 270, h2: 325 },
        'developer': { h1: 38,  h2: 22  },
    };
    function getActiveStyleColors() {
        const key = document.documentElement.getAttribute('data-style-theme');
        return STYLE_DEFAULT_COLORS[key] || { h1: 195, h2: 270 };
    }

    // botón especial posición 0: color default del tema visual activo
    const themeDefaultBtn = document.createElement('button');
    themeDefaultBtn.type = 'button';
    themeDefaultBtn.className = 'studio-preset-btn';
    themeDefaultBtn.dataset.id = 'theme-default';
    themeDefaultBtn.dataset.labelKey = 'default';
    themeDefaultBtn.dataset.name = studioT('palette.default');
    function updateThemeDefaultBtn() {
        const { h1, h2 } = getActiveStyleColors();
        themeDefaultBtn.dataset.h1 = h1;
        themeDefaultBtn.style.background = `linear-gradient(135deg,hsl(${h1},92%,56%) 0%,hsl(${h2},88%,60%) 100%)`;
    }
    updateThemeDefaultBtn();
    themeDefaultBtn.addEventListener('click', e => {
        e.stopPropagation();
        const { h1, h2 } = getActiveStyleColors();
        hueOffset = h2 - h1;
        applyHueColors(h1, h2);
        strip.update(h1, hueOffset);
        presetsEl.querySelectorAll('.studio-preset-btn').forEach(b =>
            b.classList.toggle('active', b === themeDefaultBtn));
    });
    presetsEl.appendChild(themeDefaultBtn);

    // crea un botón por cada preset de color y lo conecta con applyHueColors
    COLOR_PRESETS.forEach(p => {
        const btn  = document.createElement('button');
        btn.type   = 'button';
        btn.className   = 'studio-preset-btn' + (p.id === activePreset.id ? ' active' : '');
        btn.dataset.h1  = p.h1;
        btn.dataset.id  = p.id;
        btn.dataset.labelKey = p.labelKey;
        btn.dataset.name = studioT('palette.' + p.labelKey);
        btn.style.background = `linear-gradient(135deg,hsl(${p.h1},92%,56%) 0%,hsl(${p.h2},88%,60%) 100%)`;
        btn.addEventListener('click', e => {
            e.stopPropagation();
            hueOffset = p.h2 - p.h1;
            applyHueColors(p.h1, p.h2);
            localStorage.setItem('portfolioPreset', p.id);
            strip.update(p.h1, hueOffset);
            presetsEl.querySelectorAll('.studio-preset-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.id === p.id));
        });
        presetsEl.appendChild(btn);
    });

    // label que muestra el nombre del preset al pasar el ratón
    const presetNameLabel = document.createElement('div');
    presetNameLabel.className = 'studio-preset-name';
    presetsEl.insertAdjacentElement('afterend', presetNameLabel);
    function setPresetLabel(name) { presetNameLabel.textContent = name || ''; }
    presetsEl.addEventListener('mouseover', e => {
        const btn = e.target.closest('.studio-preset-btn');
        if (btn) setPresetLabel(btn.dataset.name);
    });
    presetsEl.addEventListener('mouseleave', () => setPresetLabel(''));

    // crea un botón por cada tema de fondo; marca con punto el tema automático del día
    const todayAuto = new Date().getDay();
    function syncBgActive(id) {
        const numId = Number(id);
        bgGrid.querySelectorAll('.studio-bg-btn.active').forEach(b => b.classList.remove('active'));
        const target = bgGrid.querySelector(`.studio-bg-btn[data-bg-id="${numId}"]`);
        if (target) target.classList.add('active');
    }
    HERO_BACKGROUNDS.forEach(theme => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'studio-bg-btn' + (getActiveBackgroundId() === theme.id ? ' active' : '');
        btn.dataset.bgId = String(theme.id);
        const dot = theme.id === todayAuto ? `<span class="studio-today-dot" title="${studioT('today')}"></span>` : '';
        const lang = currentStudioLang();
        btn.innerHTML = `<i class="fa-solid ${theme.icon}"></i>${theme[lang] || theme.es}${dot}`;
        bgGrid.appendChild(btn);
    });
    bgGrid.addEventListener('click', e => {
        e.stopPropagation();
        const btn = e.target.closest('.studio-bg-btn');
        if (!btn || !btn.dataset.bgId) return;
        const id = Number(btn.dataset.bgId);
        setBackgroundTheme(id);
        syncBgActive(getActiveBackgroundId());
    });

    // selector de tema visual (default, retro, gamer)
    const themeGrid = document.getElementById('studioThemeGrid');
    if (themeGrid) {
        const STYLE_THEMES = [
            { id: null,    labelKey: 'default', icon: 'fa-wand-magic-sparkles', defaultBg: null, defaultH1: 195, defaultH2: 270 },
            { id: 'retro', labelKey: 'retro',   icon: 'fa-terminal',            defaultBg: 1,    defaultH1: 120, defaultH2: 88  },
            { id: 'gamer', labelKey: 'gamer',   icon: 'fa-gamepad',             defaultBg: 7,    defaultH1: 270, defaultH2: 325 },
            { id: 'os',        labelKey: 'os',        icon: 'fa-desktop',             defaultBg: 4,    defaultH1: 210, defaultH2: 260 },
            { id: 'developer', labelKey: 'developer', icon: 'fa-code',                defaultBg: 1,    defaultH1: 38,  defaultH2: 22  },
        ];
        const currentStyle = document.documentElement.getAttribute('data-style-theme') || null;
        STYLE_THEMES.forEach(t => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'studio-bg-btn' + (currentStyle === t.id ? ' active' : '');
            btn.dataset.styleId = t.id || '';
            btn.dataset.labelKey = t.labelKey;
            btn.innerHTML = `<i class="fa-solid ${t.icon}"></i>${studioT('themes.' + t.labelKey)}`;
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const applyTheme = () => {
                    applyStyleTheme(t.id);
                    applyHueColors(t.defaultH1, t.defaultH2);
                    hueOffset = t.defaultH2 - t.defaultH1;
                    strip.update(t.defaultH1, hueOffset);
                    updateThemeDefaultBtn();
                    presetsEl.querySelectorAll('.studio-preset-btn').forEach(b =>
                        b.classList.toggle('active', b === themeDefaultBtn));
                    if (t.id && t.defaultBg !== null && t.defaultBg !== undefined) {
                        setBackgroundTheme(t.defaultBg);
                        syncBgActive(getActiveBackgroundId());
                    } else if (!t.id) {
                        setBackgroundTheme(new Date().getDay());
                        syncBgActive(getActiveBackgroundId());
                    }
                    themeGrid.querySelectorAll('.studio-bg-btn').forEach(b =>
                        b.classList.toggle('active', b.dataset.styleId === (t.id || '')));
                };
                if (document.startViewTransition) {
                    document.documentElement.dataset.vtTheme = '1';
                    const vt = document.startViewTransition(applyTheme);
                    vt.finished.finally(() => {
                        delete document.documentElement.dataset.vtTheme;
                        if (window._ctaUpdateText) window._ctaUpdateText();
                    });
                } else {
                    applyTheme();
                    if (window._ctaUpdateText) window._ctaUpdateText();
                }
            });
            themeGrid.appendChild(btn);
        });
    }

    // presets de clima en el panel de clima
    const wxGrid = document.getElementById('studioWeatherGrid');
    if (wxGrid) {
        // botón para desactivar clima manual
        const offBtn = document.createElement('button');
        offBtn.type = 'button';
        offBtn.className = 'studio-wx-btn' + (!weather.enabled || weather.code === null ? ' active' : '');
        offBtn.dataset.wxCode = '';
        offBtn.dataset.labelKey = 'none';
        offBtn.innerHTML = `<span class="wx-emoji">🚫</span>${studioT('weather.none')}`;
        offBtn.addEventListener('click', e => {
            e.stopPropagation();
            // desactiva clima por completo
            weather.enabled = false;
            weather.code = null; weather.label = '';
            weather.particles = []; weather.clouds = []; weather.fog = [];
            localStorage.setItem('wxEnabled', '0');
            localStorage.removeItem('wxCode');
            updateWeatherEyebrow();
            const wxBtn2 = document.getElementById('studioWeatherBtn');
            const label2 = document.getElementById('studioWeatherLabel');
            const status2 = document.getElementById('studioWeatherStatus');
            if (wxBtn2) wxBtn2.classList.remove('active');
            if (label2) label2.textContent = studioT('weatherEnable');
            if (status2) status2.textContent = '';
            wxGrid.querySelectorAll('.studio-wx-btn').forEach(b => b.classList.toggle('active', b === offBtn));
        });
        wxGrid.appendChild(offBtn);

        WEATHER_PRESETS.forEach(p => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'studio-wx-btn' + (weather.enabled && weather.code === p.code ? ' active' : '');
            btn.dataset.wxCode = p.code;
            btn.dataset.labelKey = p.key;
            btn.innerHTML = `<span class="wx-emoji">${p.emoji}</span>${studioT('weather.' + p.key)}`;
            btn.addEventListener('click', e => {
                e.stopPropagation();
                weather.enabled = true;
                weather.code = p.code;
                buildWeather(p.code, canvas.width, canvas.height);
                updateWeatherEyebrow();
                // guarda como 'manual' para que restoreWeather no intente geolocalizar
                localStorage.setItem('wxEnabled', 'manual');
                localStorage.setItem('wxCode', p.code);
                const wxBtn2 = document.getElementById('studioWeatherBtn');
                const label2 = document.getElementById('studioWeatherLabel');
                const status2 = document.getElementById('studioWeatherStatus');
                if (wxBtn2) wxBtn2.classList.add('active');
                if (label2) label2.textContent = studioT('weatherDisable');
                if (status2) status2.textContent = describeWeather(p.code);
                wxGrid.querySelectorAll('.studio-wx-btn').forEach(b => b.classList.toggle('active', b === btn));
            });
            wxGrid.appendChild(btn);
        });
    }

    // botón de clima real (geolocalización)
    const wxBtn = document.getElementById('studioWeatherBtn');
    if (wxBtn) wxBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleWeather(() => {
            if (wxGrid) {
                wxGrid.querySelectorAll('.studio-wx-btn').forEach(b => {
                    const code = b.dataset.wxCode === '' ? null : parseInt(b.dataset.wxCode);
                    b.classList.toggle('active', code === matchWeatherPreset(weather.code) && (weather.enabled || code === null));
                });
            }
        });
    });
    restoreWeather();

    function updateStudioGeneratedText() {
        themeDefaultBtn.dataset.name = studioT('palette.default');
        presetsEl.querySelectorAll('.studio-preset-btn').forEach(btn => {
            const key = btn.dataset.labelKey;
            if (key) btn.dataset.name = studioT('palette.' + key);
        });
        bgGrid.querySelectorAll('.studio-bg-btn[data-bg-id]').forEach(btn => {
            const theme = HERO_BACKGROUNDS.find(item => String(item.id) === btn.dataset.bgId);
            if (!theme) return;
            const dot = theme.id === todayAuto ? `<span class="studio-today-dot" title="${studioT('today')}"></span>` : '';
            const lang = currentStudioLang();
            btn.innerHTML = `<i class="fa-solid ${theme.icon}"></i>${theme[lang] || theme.es}${dot}`;
        });
        themeGrid?.querySelectorAll('.studio-bg-btn[data-style-id]').forEach(btn => {
            const key = btn.dataset.labelKey;
            if (key) btn.innerHTML = `<i class="${btn.querySelector('i')?.className || 'fa-solid fa-wand-magic-sparkles'}"></i>${studioT('themes.' + key)}`;
        });
        wxGrid?.querySelectorAll('.studio-wx-btn').forEach(btn => {
            const key = btn.dataset.labelKey;
            const emoji = btn.querySelector('.wx-emoji')?.textContent || '';
            if (key) btn.innerHTML = `<span class="wx-emoji">${emoji}</span>${studioT('weather.' + key)}`;
        });
        const wxLabel = document.getElementById('studioWeatherLabel');
        if (wxLabel) wxLabel.textContent = weather.enabled ? studioT('weatherDisable') : studioT('weatherEnable');
        const wxStatus = document.getElementById('studioWeatherStatus');
        if (wxStatus && weather.enabled && weather.code !== null) wxStatus.textContent = describeWeather(weather.code);
        if (presetNameLabel.textContent) {
            const hovered = presetsEl.querySelector('.studio-preset-btn:hover');
            presetNameLabel.textContent = hovered?.dataset.name || '';
        }
    }
    window._bgUpdateLabel = updateStudioGeneratedText;
    window._studioUpdateText = updateStudioGeneratedText;

    // posiciona los paneles a la derecha del fab-col según su ancho real
    const fabCol = wrap.querySelector('.studio-fab-col');
    function _repositionPanels() {
        if (!fabCol) return;
        const wrapRect = wrap.getBoundingClientRect();
        const colW = fabCol.offsetWidth;
        const panelLeft = wrapRect.left + colW + 12;
        catPanels.forEach(p => { p.style.left = panelLeft + 'px'; });
        // pega el CTA al borde derecho del FAB principal, no al de la columna entera
        const fabRect = fab.getBoundingClientRect();
        if (ctaEl) ctaEl.style.left = (fabRect.right + 6) + 'px';
    }
    // recalcula al abrir el studio (por si los sub-FABs cambiaron el ancho)
    fab.addEventListener('click', _repositionPanels);
    requestAnimationFrame(_repositionPanels);

    // CTA: muestra el texto llamativo y actualiza el texto según el tema activo
    const ctaEl = document.getElementById('studioCtaLabel');
    let _ctaTimer = null;
    let _ctaScrollHidden = false;

    // actualiza el texto del CTA según el tema visual activo y el idioma
    function _ctaUpdateText() {
        if (!ctaEl) return;
        const styleTheme = document.documentElement.getAttribute('data-style-theme') || '';
        const lang = currentLanguage || 'es';
        const t = translations[lang]?.studio || {};
        let longTxt, shortTxt;
        if (styleTheme === 'retro') {
            longTxt = t.ctaRetro || t.cta;
            shortTxt = t.ctaRetroMobile || t.ctaMobile;
        } else if (styleTheme === 'gamer') {
            longTxt = t.ctaGamer || t.cta;
            shortTxt = t.ctaGamerMobile || t.ctaMobile;
        } else {
            longTxt = t.cta || '¡Pínchame para personalizarlo todo!';
            shortTxt = t.ctaMobile || 'Personalizar';
        }
        const longEl = ctaEl.querySelector('.studio-cta-long');
        const shortEl = ctaEl.querySelector('.studio-cta-short');
        if (longEl) longEl.textContent = longTxt;
        if (shortEl) shortEl.textContent = shortTxt;
    }
    window._ctaUpdateText = _ctaUpdateText;
    _ctaUpdateText();

    function _ctaShow() {
        if (!ctaEl || _ctaScrollHidden) return;
        _ctaUpdateText();
        ctaEl.classList.add('visible');
    }
    function _ctaHide() {
        if (!ctaEl) return;
        ctaEl.classList.remove('visible');
    }

    // oculta el CTA al salir de la sección hero
    const _heroEl = document.getElementById('hero');
    function _ctaCheckScroll() {
        if (!_heroEl || !ctaEl) return;
        const heroBottom = _heroEl.getBoundingClientRect().bottom;
        const shouldHide = heroBottom < 0;
        if (shouldHide && !_ctaScrollHidden) {
            _ctaScrollHidden = true;
            _ctaHide();
        } else if (!shouldHide && _ctaScrollHidden) {
            _ctaScrollHidden = false;
            if (!wrap.classList.contains('open')) _ctaShow();
        }
    }
    window.addEventListener('scroll', _ctaCheckScroll, { passive: true });

    if (ctaEl) {
        _ctaTimer = setTimeout(_ctaShow, 900);
    }

    // lógica de sub-FABs: abre/cierra cada panel de categoría
    const subFabs = wrap.querySelectorAll('.studio-sub-fab');
    const catPanels = document.querySelectorAll('.studio-cat-panel');

    function closeAllPanels() {
        catPanels.forEach(p => p.classList.remove('open'));
        subFabs.forEach(b => b.classList.remove('active'));
        // muestra el CTA si el studio está cerrado
        if (!wrap.classList.contains('open')) _ctaShow();
    }

    subFabs.forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const targetId = btn.dataset.target;
            const targetPanel = document.getElementById(targetId);
            const isOpen = targetPanel && targetPanel.classList.contains('open');
            closeAllPanels();
            if (!isOpen && targetPanel) {
                targetPanel.classList.add('open');
                btn.classList.add('active');
                _ctaHide(); // oculta el CTA al abrir un panel
                // actualiza la franja de color al abrir el panel de color
            if (targetId === 'studioPanelColor') {
                    strip.update(parseFloat(localStorage.getItem('portfolioH1') || '195'), hueOffset);
                }
                // sincroniza los botones de fondo con el getActiveBackgroundId() actual
                if (targetId === 'studioPanelFondo' && bgGrid) {
                    syncBgActive(getActiveBackgroundId());
                }
            }
        });
    });

    // FAB principal: abre/cierra los sub-FABs; cierra paneles al cerrar
    fab.addEventListener('click', e => {
        e.stopPropagation();
        const open = wrap.classList.toggle('open');
        fab.setAttribute('aria-expanded', open);
        if (open) { _ctaHide(); } else { closeAllPanels(); _ctaShow(); }
    });

    // clic fuera: cierra todo y muestra el CTA de nuevo
    document.addEventListener('click', e => {
        if (!wrap.contains(e.target)) {
            wrap.classList.remove('open');
            fab.setAttribute('aria-expanded', 'false');
            closeAllPanels();
            _ctaShow();
        }
    });

    // los clics dentro de los paneles no propagan al document
    catPanels.forEach(p => p.addEventListener('click', e => e.stopPropagation()));
}
initStudio();
