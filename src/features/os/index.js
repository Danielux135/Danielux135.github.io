// orquestador del OS
import { show as showBoot }                                      from './boot.js';
import { mount as mountDesktop, unmount as unmountDesktop }      from './desktop.js';
import { mount as mountTaskbar, unmount as unmountTaskbar,
         markOpen, markFocused }                                  from './taskbar.js';
import { createWindow, closeAllWindows, setTaskbarCallbacks,
         minimizeWindow, getOpenWindows }                         from './window-manager.js';
import { init   as initStartMenu,
         toggle as toggleStartMenu,
         unmount as unmountStartMenu }                            from './start-menu.js';
import { getApp }                                                  from './app-registry.js';

let _mounted = false;

setTaskbarCallbacks({
    open:  (id)  => markOpen(id, true),
    close: (id)  => markOpen(id, false),
    focus: (id)  => markFocused(id),
});

function _lang() {
    return document.documentElement.lang || 'es';
}

function _openApp(appId) {
    const app = getApp(appId);
    if (!app) return;
    createWindow(app, { lang: _lang() });
    markOpen(appId, true);
}

export async function mount() {
    if (_mounted) return;
    _mounted = true;
    document.documentElement.classList.add('os-mode');

    await showBoot();

    initStartMenu({
        onAppOpen: _openApp,
        onRestart: restart,
    });

    mountDesktop({ onIconClick: _openApp, lang: _lang() });

    mountTaskbar({
        lang: _lang(),
        onStartClick: toggleStartMenu,
        onAppClick: appId => {
            const win = document.querySelector(`.os-window[data-app="${appId}"]`);
            if (win) minimizeWindow(win);
            else _openApp(appId);
        },
    });
}

export function unmount() {
    if (!_mounted) return;
    _mounted = false;
    document.documentElement.classList.remove('os-mode');
    closeAllWindows();
    unmountDesktop();
    unmountTaskbar();
    unmountStartMenu();
}

export async function restart() {
    unmount();
    await new Promise(r => setTimeout(r, 400));
    mount();
}

// escucha cambios de tema
document.addEventListener('stylethemechange', e => {
    const { theme, prev } = e.detail;
    if (theme === 'os' && !_mounted) mount();
    if (prev === 'os' && theme !== 'os') unmount();
});

// si la página carga ya con OS activo
if (document.documentElement.getAttribute('data-style-theme') === 'os') {
    mount();
}
