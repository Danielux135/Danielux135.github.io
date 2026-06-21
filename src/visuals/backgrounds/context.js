// Contexto compartido por todos los fondos del hero.
// Centraliza el canvas, su tamaño y la lectura de los colores de acento.
export const canvas = document.getElementById('particles');

if (!canvas) {
    throw new Error('No se encontró el canvas #particles del fondo del hero.');
}

export const ctx = canvas.getContext('2d');

if (!ctx) {
    throw new Error('No se pudo obtener el contexto 2D de #particles.');
}

export function resizeBackgroundCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

export function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
}

export function getHeroAccent(index = 1) {
    const value = index === 2
        ? (window._accent2Rgb || '139 92 246')
        : (window._accent1Rgb || '0 200 255');

    return Array.isArray(value)
        ? value
        : value.split(/\s+/).map(Number);
}

resizeBackgroundCanvas();
window.addEventListener('resize', resizeBackgroundCanvas, { passive: true });
