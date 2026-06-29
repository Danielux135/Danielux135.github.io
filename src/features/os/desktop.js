// escritorio del OS — rejilla de iconos sobre el fondo de canvas
import { APP_REGISTRY, getAppTitle } from './app-registry.js';

let _el = null;

export function mount({ onIconClick, lang = 'es' } = {}) {
    if (_el) return;

    _el = document.createElement('div');
    _el.id = 'os-desktop';
    _el.setAttribute('aria-label', 'Escritorio');

    const grid = document.createElement('div');
    grid.className = 'os-desktop-icons';

    APP_REGISTRY.forEach(app => {
        const icon = document.createElement('button');
        icon.className = 'os-desktop-icon';
        icon.dataset.appId = app.id;
        icon.setAttribute('aria-label', getAppTitle(app, lang));
        icon.innerHTML = `
            <div class="os-icon-img"><i class="fa-solid ${app.icon}"></i></div>
            <span class="os-icon-label">${getAppTitle(app, lang)}</span>
        `;

        // un solo clic abre la ventana en todos los dispositivos
        icon.addEventListener('click', e => {
            e.stopPropagation();
            _animateClick(icon);
            onIconClick?.(app.id);
        });

        grid.appendChild(icon);
    });

    _el.appendChild(grid);
    document.body.appendChild(_el);

    // clic en el escritorio vacío deselecciona
    _el.addEventListener('click', e => {
        if (!e.target.closest('.os-desktop-icon')) {
            _el.querySelectorAll('.os-desktop-icon--selected')
               .forEach(i => i.classList.remove('os-desktop-icon--selected'));
        }
    });
}

export function unmount() {
    _el?.remove();
    _el = null;
}

function _animateClick(icon) {
    icon.classList.add('os-desktop-icon--clicking');
    setTimeout(() => icon.classList.remove('os-desktop-icon--clicking'), 180);
}
