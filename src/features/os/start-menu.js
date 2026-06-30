// menú inicio del OS — temas, colores, apps, apagar/reiniciar
import { APP_REGISTRY, getAppTitle } from './app-registry.js';
import { applyStyleTheme }           from '../../core/theme.js';
import { hslToRgb }                  from '../../visuals/color-utils.js';
import { OS_LOGO_SVG }               from './os-logo.js';

let _el = null;
let _visible = false;
let _onAppOpen = null;
let _onRestart = null;

const COLOR_PRESETS = [
    { id: 'cyber',    label: 'Cyber',    h1: 195, h2: 270 },
    { id: 'fuego',    label: 'Fuego',    h1: 22,  h2: 0   },
    { id: 'bosque',   label: 'Bosque',   h1: 145, h2: 195 },
    { id: 'aurora',   label: 'Aurora',   h1: 330, h2: 268 },
    { id: 'neon',     label: 'Neon',     h1: 84,  h2: 190 },
    { id: 'amatista', label: 'Amatista', h1: 280, h2: 340 },
    { id: 'oceano',   label: 'Océano',   h1: 218, h2: 248 },
    { id: 'fucsia',   label: 'Fucsia',   h1: 305, h2: 345 },
    { id: 'carmin',   label: 'Carmín',   h1: 355, h2: 325 },
    { id: 'oro',      label: 'Oro',      h1: 43,  h2: 22  },
];

const STYLE_THEMES = [
    { id: null,    label: 'Default', icon: 'fa-wand-magic-sparkles' },
    { id: 'retro', label: 'Retro',   icon: 'fa-terminal'            },
    { id: 'gamer', label: 'Gamer',   icon: 'fa-gamepad'             },
    { id: 'os',    label: 'OS',      icon: 'fa-desktop'             },
];

export function init({ onAppOpen, onRestart } = {}) {
    _onAppOpen = onAppOpen;
    _onRestart = onRestart;
    _build();

    // cierra el menú si el usuario hace clic fuera
    document.addEventListener('pointerdown', e => {
        if (_visible && !_el?.contains(e.target) && e.target.id !== 'osStartBtn') {
            hide();
        }
    });
}

export function toggle() { _visible ? hide() : show(); }
export function show()   { _el?.classList.add('os-start-menu--open');  _visible = true;  }
export function hide()   { _el?.classList.remove('os-start-menu--open'); _visible = false; }

export function unmount() {
    _el?.remove();
    _el = null;
    _visible = false;
}

// ─── construcción del DOM ─────────────────────────────────────────────────────
function _build() {
    _el = document.createElement('div');
    _el.id = 'os-start-menu';

    _el.innerHTML = `
        <div class="osm-header">
            <div class="osm-logo">${OS_LOGO_SVG}</div>
            <div class="osm-header-info">
                <span class="osm-title">Danielux OS</span>
                <span class="osm-subtitle">Developer · Músico · Creator</span>
            </div>
        </div>

        <div class="osm-section">
            <p class="osm-label">APPS</p>
            <div class="osm-apps" id="osmApps"></div>
        </div>

        <div class="osm-section">
            <p class="osm-label">TEMA VISUAL</p>
            <div class="osm-themes" id="osmThemes"></div>
        </div>

        <div class="osm-section">
            <p class="osm-label">PALETA DE COLOR</p>
            <div class="osm-colors" id="osmColors"></div>
        </div>

        <div class="osm-footer">
            <button class="osm-power-btn osm-restart" id="osmRestart">
                <i class="fa-solid fa-rotate-right"></i> Reiniciar OS
            </button>
            <button class="osm-power-btn osm-shutdown" id="osmShutdown">
                <i class="fa-solid fa-power-off"></i> Apagar
            </button>
        </div>
    `;

    document.body.appendChild(_el);
    _buildApps();
    _buildThemes();
    _buildColors();
    _bindPower();
}

function _buildApps() {
    const container = _el.querySelector('#osmApps');
    const lang = document.documentElement.lang || 'es';
    APP_REGISTRY.forEach(app => {
        const btn = document.createElement('button');
        btn.className = 'osm-app-btn';
        btn.innerHTML = `<i class="fa-solid ${app.icon}"></i><span>${getAppTitle(app, lang)}</span>`;
        btn.addEventListener('click', () => { hide(); _onAppOpen?.(app.id); });
        container.appendChild(btn);
    });
    // también el reproductor como app
    const playerBtn = document.createElement('button');
    playerBtn.className = 'osm-app-btn';
    playerBtn.innerHTML = `<i class="fa-solid fa-sliders"></i><span>Reproductor</span>`;
    playerBtn.addEventListener('click', () => { hide(); _onAppOpen?.('music-player'); });
    container.appendChild(playerBtn);
}

function _buildThemes() {
    const container = _el.querySelector('#osmThemes');
    const current   = document.documentElement.getAttribute('data-style-theme') ?? null;
    STYLE_THEMES.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'osm-theme-btn' + (t.id === current ? ' osm-theme-btn--active' : '');
        btn.dataset.themeId = t.id ?? '';
        btn.innerHTML = `<i class="fa-solid ${t.icon}"></i><span>${t.label}</span>`;
        btn.addEventListener('click', () => {
            container.querySelectorAll('.osm-theme-btn').forEach(b => b.classList.remove('osm-theme-btn--active'));
            btn.classList.add('osm-theme-btn--active');
            applyStyleTheme(t.id);
            if (t.id !== 'os') hide();
        });
        container.appendChild(btn);
    });
}

function _buildColors() {
    const container = _el.querySelector('#osmColors');
    const h1Saved = Number(localStorage.getItem('portfolioH1')) || 195;
    COLOR_PRESETS.forEach(preset => {
        const [r, g, b] = hslToRgb(preset.h1, 100, 55);
        const btn = document.createElement('button');
        btn.className = 'osm-color-dot';
        btn.title = preset.label;
        btn.style.setProperty('--dot-color', `rgb(${r},${g},${b})`);
        if (Math.abs(preset.h1 - h1Saved) < 10) btn.classList.add('osm-color-dot--active');
        btn.addEventListener('click', () => {
            container.querySelectorAll('.osm-color-dot').forEach(d => d.classList.remove('osm-color-dot--active'));
            btn.classList.add('osm-color-dot--active');
            _applyColor(preset.h1, preset.h2);
        });
        container.appendChild(btn);
    });
}

function _bindPower() {
    _el.querySelector('#osmShutdown')?.addEventListener('click', () => {
        hide();
        import('./index.js').then(m => m.unmount());
    });
    _el.querySelector('#osmRestart')?.addEventListener('click', () => {
        hide();
        _onRestart?.();
    });
}

// aplica paleta de color exactamente como hero-studio.js
function _applyColor(h1, h2) {
    h1 = ((h1 % 360) + 360) % 360;
    h2 = ((h2 % 360) + 360) % 360;
    const [r1, g1, b1] = hslToRgb(h1, 100, 55);
    const [r2, g2, b2] = hslToRgb(h2, 90,  60);
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
    localStorage.setItem('portfolioH1', h1);
    localStorage.setItem('portfolioH2', h2);
}
