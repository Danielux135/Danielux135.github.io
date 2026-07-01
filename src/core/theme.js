'use strict';

/* Mantiene las clases de tema como API visual principal.
   Los data-* se conservan para compatibilidad con código existente y herramientas. */
export const THEME_ROOT = document.documentElement;
const STYLE_THEME_CLASSES = ['theme-retro', 'theme-gamer', 'theme-os', 'theme-developer', 'theme-abyss'];

export function applyColorTheme(theme, { persist = true } = {}) {
    const light = theme === 'light';
    THEME_ROOT.classList.toggle('theme-light', light);
    if (light) THEME_ROOT.setAttribute('data-theme', 'light');
    else THEME_ROOT.removeAttribute('data-theme');
    if (persist) localStorage.setItem('portfolioTheme', light ? 'light' : 'dark');
}

export function applyStyleTheme(theme, { persist = true } = {}) {
    const prev = THEME_ROOT.getAttribute('data-style-theme') || null;
    STYLE_THEME_CLASSES.forEach((name) => THEME_ROOT.classList.remove(name));
    if (theme === 'retro' || theme === 'gamer' || theme === 'os' || theme === 'developer' || theme === 'abyss') {
        THEME_ROOT.classList.add(`theme-${theme}`);
        THEME_ROOT.setAttribute('data-style-theme', theme);
        if (persist) localStorage.setItem('portfolioStyleTheme', theme);
    } else {
        THEME_ROOT.removeAttribute('data-style-theme');
        if (persist) localStorage.removeItem('portfolioStyleTheme');
    }
    // notifica al sistema OS para que monte/desmonte
    document.dispatchEvent(new CustomEvent('stylethemechange', { detail: { theme: theme || null, prev } }));
}

// Sincroniza clases y atributos guardados antes de registrar controles.
(function initTheme() {
    applyColorTheme(localStorage.getItem('portfolioTheme') === 'light' ? 'light' : 'dark', { persist: false });
    applyStyleTheme(localStorage.getItem('portfolioStyleTheme'), { persist: false });
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        applyColorTheme(THEME_ROOT.classList.contains('theme-light') ? 'dark' : 'light');
    });
})();
