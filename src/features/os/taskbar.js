// barra de tareas del OS
import { APP_REGISTRY, getApp, getAppTitle } from './app-registry.js';

let _el = null;
let _clockInterval = null;
const _buttons = new Map();

export function mount({ onAppClick, onStartClick, lang = 'es' } = {}) {
    if (_el) return;

    _el = document.createElement('div');
    _el.id = 'os-taskbar';
    _el.innerHTML = `
        <div class="os-tb-start">
            <button class="os-tb-logo" id="osStartBtn" aria-label="Menú inicio" aria-expanded="false">
                <i class="fa-solid fa-desktop"></i>
                <span>DanieluxOS</span>
            </button>
        </div>
        <div class="os-tb-sep"></div>
        <div class="os-tb-apps" id="osTbApps"></div>
        <div class="os-tb-tray">
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
}

export function unmount() {
    _el?.remove();
    _el = null;
    _buttons.clear();
    clearInterval(_clockInterval);
    _clockInterval = null;
}

export function markOpen(appId, open = true) {
    _buttons.get(appId)?.classList.toggle('os-tb-app-btn--open', open);
}

export function markFocused(appId) {
    _buttons.forEach((btn, id) =>
        btn.classList.toggle('os-tb-app-btn--focused', id === appId)
    );
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
