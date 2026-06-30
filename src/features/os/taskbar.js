// barra de tareas del OS
import { APP_REGISTRY, getApp, getAppTitle } from './app-registry.js';
import { focusWindow } from './window-manager.js';
import { OS_LOGO_SVG } from './os-logo.js';

let _el = null;
let _clockInterval = null;
const _buttons   = new Map();
const _openIcons = new Map(); // appId → <button> en el tray

export function mount({ onAppClick, onStartClick, lang = 'es' } = {}) {
    if (_el) return;

    _el = document.createElement('div');
    _el.id = 'os-taskbar';
    _el.innerHTML = `
        <div class="os-tb-start">
            <button class="os-tb-logo" id="osStartBtn" aria-label="Menú inicio" aria-expanded="false">
                ${OS_LOGO_SVG}
                <span>DanieluxOS</span>
            </button>
        </div>
        <div class="os-tb-sep"></div>
        <div class="os-tb-apps" id="osTbApps"></div>
        <div class="os-tb-tray">
            <div class="os-tb-open-apps" id="osTbOpenApps"></div>
            <div class="os-tb-sep" id="osTbOpenSep" hidden></div>
            <div class="os-tb-vol-wrap" id="osTbVolWrap">
                <button class="os-tb-vol-ico" id="osTbVolIco" title="Volumen"><i class="fa-solid fa-volume-low"></i></button>
                <input class="os-tb-vol-slider" id="osTbVolSlider" type="range" min="0" max="1" step="0.01" value="0.8" aria-label="Volumen">
            </div>
            <div class="os-tb-sep"></div>
            <button class="os-tb-lang" id="osTbLang" title="Cambiar idioma">ES</button>
            <span class="os-tb-clock" id="osTbClock"></span>
        </div>
    `;

    document.body.appendChild(_el);
    _startClock();

    // botón inicio
    _el.querySelector('#osStartBtn')?.addEventListener('click', e => {
        e.stopPropagation();
        const btn = _el.querySelector('#osStartBtn');
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        onStartClick?.();
    });

    // botones de apps en la barra
    const appsEl = _el.querySelector('#osTbApps');
    APP_REGISTRY.forEach(app => {
        const btn = document.createElement('button');
        btn.className = 'os-tb-app-btn';
        btn.dataset.appId = app.id;
        btn.title = getAppTitle(app, lang);
        btn.innerHTML = `<i class="fa-solid ${app.icon}"></i>`;
        btn.addEventListener('click', () => onAppClick?.(app.id));
        appsEl.appendChild(btn);
        _buttons.set(app.id, btn);
    });

    // botón reproductor en la barra
    const playerBtn = document.createElement('button');
    playerBtn.className = 'os-tb-app-btn os-tb-app-btn--player';
    playerBtn.dataset.appId = 'music-player';
    playerBtn.title = 'Reproductor';
    playerBtn.innerHTML = `<i class="fa-solid fa-sliders"></i>`;
    playerBtn.addEventListener('click', () => onAppClick?.('music-player'));
    appsEl.appendChild(playerBtn);
    _buttons.set('music-player', playerBtn);

    _initLang(lang);
    _initVol();
}

export function unmount() {
    _el?.remove();
    _el = null;
    _buttons.clear();
    _openIcons.clear();
    clearInterval(_clockInterval);
    _clockInterval = null;
    window._osTaskbarSetLang = null;
    window._osTaskbarSetVol = null;
}

export function markOpen(appId, open = true) {
    _buttons.get(appId)?.classList.toggle('os-tb-app-btn--open', open);
    if (open) {
        _ensureOpenIcon(appId);
    } else {
        _removeOpenIcon(appId);
    }
}

export function markFocused(appId) {
    _buttons.forEach((btn, id) =>
        btn.classList.toggle('os-tb-app-btn--focused', id === appId)
    );
    // ventanas browser con ID dinámico llegan solo por markFocused, no por markOpen
    _ensureOpenIcon(appId);
    _openIcons.forEach((el, id) =>
        el.classList.toggle('os-tb-open-ico--active', id === appId)
    );
}

function _ensureOpenIcon(appId) {
    if (_openIcons.has(appId)) return;
    const container = _el?.querySelector('#osTbOpenApps');
    if (!container) return;

    const win      = document.querySelector(`.os-window[data-app="${CSS.escape(appId)}"]`);
    const winIco   = win?.querySelector('.os-win-icon i');
    const icoClass = winIco ? winIco.className : 'fa-solid fa-window-maximize';
    const title    = win?.querySelector('.os-win-title')?.textContent?.trim() ?? appId;

    const btn = document.createElement('button');
    btn.className = 'os-tb-open-ico';
    btn.title = title;
    btn.dataset.appId = appId;
    btn.innerHTML = `<i class="${icoClass}"></i>`;
    btn.addEventListener('click', () => {
        const w = document.querySelector(`.os-window[data-app="${CSS.escape(appId)}"]`);
        if (!w) return;
        if (w.classList.contains('os-window--minimized')) {
            w.classList.remove('os-window--minimized');
            w.style.pointerEvents = '';
        }
        focusWindow(w);
    });
    container.appendChild(btn);
    _openIcons.set(appId, btn);
    _updateOpenSep();
}

function _removeOpenIcon(appId) {
    const el = _openIcons.get(appId);
    if (!el) return;
    el.remove();
    _openIcons.delete(appId);
    _updateOpenSep();
}

function _updateOpenSep() {
    const sep = _el?.querySelector('#osTbOpenSep');
    if (sep) sep.hidden = _openIcons.size === 0;
}

// ── idioma ────────────────────────────────────────────────
const LANGS = ['es', 'en', 'val'];
const LANG_LABELS = { es: 'ES', en: 'EN', val: 'VAL' };
let _currentLang = 'es';

function _initLang(startLang) {
    const btn = _el?.querySelector('#osTbLang');
    if (!btn) return;

    const raw = document.documentElement.lang || startLang || 'es';
    _currentLang = raw === 'ca' ? 'val' : raw;
    btn.textContent = LANG_LABELS[_currentLang] ?? 'ES';

    btn.addEventListener('click', () => {
        const idx  = LANGS.indexOf(_currentLang);
        _currentLang = LANGS[(idx + 1) % LANGS.length];
        btn.textContent = LANG_LABELS[_currentLang];
        window._setPortfolioLang?.(_currentLang);
    });

    // recibe notificación cuando otro botón cambia el idioma
    window._osTaskbarSetLang = (lang) => {
        const norm = lang === 'ca' ? 'val' : lang;
        if (LANGS.includes(norm)) {
            _currentLang = norm;
            if (btn) btn.textContent = LANG_LABELS[norm];
        }
    };
}

// ── volumen ───────────────────────────────────────────────
function _initVol() {
    const slider = _el?.querySelector('#osTbVolSlider');
    const icoBtn = _el?.querySelector('#osTbVolIco');
    if (!slider || !icoBtn) return;

    const _updateIcon = (v) => {
        const i = icoBtn.querySelector('i');
        if (!i) return;
        if (v === 0) i.className = 'fa-solid fa-volume-xmark';
        else if (v < 0.5) i.className = 'fa-solid fa-volume-low';
        else i.className = 'fa-solid fa-volume-high';
    };

    const _updateSliderFill = (v) => {
        slider.style.setProperty('--val', Math.round(v * 100));
    };

    // lectura inicial del volumen (puede llegar tarde si el audio se crea después)
    const _syncInitVol = () => {
        const audio = document.querySelector('audio');
        if (!audio) return;
        const v = audio.muted ? 0 : audio.volume;
        slider.value = v;
        _updateIcon(v);
        _updateSliderFill(v);
    };
    _syncInitVol();
    // si el audio aún no existe, reintenta tras el primer evento de play global
    if (!document.querySelector('audio')) {
        const _onFirstPlay = () => { _syncInitVol(); document.removeEventListener('play', _onFirstPlay, true); };
        document.addEventListener('play', _onFirstPlay, true);
    }

    slider.addEventListener('input', () => {
        const v = +slider.value;
        _updateIcon(v);
        _updateSliderFill(v);
        window._setAudioVolume?.(v);
        // sincroniza también con el slider del now-playing-bar si existe
        const npbVol = document.querySelector('#npbVol');
        if (npbVol) { npbVol.value = Math.round(v * 100); npbVol.style.setProperty('--pct', `${Math.round(v * 100)}%`); }
        const osVol = document.querySelector('#osPlayerVol');
        if (osVol) osVol.value = v;
    });

    // mute/unmute al hacer clic en el icono
    icoBtn.addEventListener('click', () => {
        const audio = document.querySelector('audio#mainAudio') ?? document.querySelector('audio');
        if (!audio) return;
        audio.muted = !audio.muted;
        const v = audio.muted ? 0 : audio.volume;
        slider.value = v;
        _updateIcon(v);
        window._setAudioVolume?.(audio.muted ? 0 : audio.volume);
    });

    // recibe cambios de volumen desde otros reproductores
    window._osTaskbarSetVol = (v) => {
        slider.value = v;
        _updateIcon(v);
        _updateSliderFill(v);
    };

    // hookea window._setAudioVolume para ser notificado de cambios externos
    const _origSetVol = window._setAudioVolume;
    window._setAudioVolume = function(v) {
        _origSetVol?.(v);
        slider.value = v;
        _updateIcon(v);
        _updateSliderFill(v);
    };
}

function _startClock() {
    const el = _el?.querySelector('#osTbClock');
    if (!el) return;
    const tick = () => {
        const d = new Date();
        el.textContent = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };
    tick();
    _clockInterval = setInterval(tick, 10_000);
}
