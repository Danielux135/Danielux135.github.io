import { HERO_BACKGROUNDS } from './catalog.js';

export { HERO_BACKGROUNDS } from './catalog.js';

// Cargadores dinámicos por id de tema. Vite crea un chunk independiente por cada import().
// IDs 13 y 17 son alias de 5 (galaxy) y 6 (circuits) — se normalizan antes del lookup.
const THEME_LOADERS = {
    0:  () => import('./themes/constellations.js'),
    1:  () => import('./themes/matrix.js'),
    2:  () => import('./themes/geometry.js'),
    3:  () => import('./themes/aurora.js'),
    4:  () => import('./themes/orbits.js'),
    5:  () => import('./themes/galaxy.js'),
    6:  () => import('./themes/circuits.js'),
    7:  () => import('./themes/laser.js'),
    8:  () => import('./themes/equalizer.js'),
    9:  () => import('./themes/fireworks.js'),
    10: () => import('./themes/waves.js'),
    11: () => import('./themes/meteors.js'),
    12: () => import('./themes/dna.js'),
    14: () => import('./themes/magnetic.js'),
    15: () => import('./themes/topography.js'),
    16: () => import('./themes/hexagons.js'),
    18: () => import('./themes/bokeh.js'),
    19: () => import('./themes/kaleidoscope.js'),
    _neonRain: () => import('./themes/neon-rain.js'),
    _confetti: () => import('./themes/confetti.js'),
};

// Normaliza IDs alias para evitar entradas duplicadas en el cache
function normalizeThemeId(id) {
    if (id === 13) return 5;
    if (id === 17) return 6;
    return id;
}

// Cache de módulos ya resueltos (id -> módulo)
const themeCache = {};

function loadTheme(id) {
    id = normalizeThemeId(id);
    if (themeCache[id]) return themeCache[id];
    const loader = THEME_LOADERS[id] ?? THEME_LOADERS[0];
    themeCache[id] = loader().then(mod => {
        themeCache[id] = mod; // reemplaza la Promise con el módulo resuelto
        return mod;
    });
    return themeCache[id];
}

function resolveInitialBackground() {
    const today = new Date().toDateString();
    const lastDay = localStorage.getItem('heroBgDay');

    if (lastDay !== today) {
        const dayTheme = new Date().getDay();
        localStorage.setItem('heroBgTheme', String(dayTheme));
        localStorage.setItem('heroBgDay', today);
        return dayTheme;
    }

    const saved = localStorage.getItem('heroBgTheme');
    return saved !== null ? Number.parseInt(saved, 10) : new Date().getDay();
}

let activeBackgroundId = resolveInitialBackground();

// Precarga el tema activo al inicio (y neon-rain/confetti que se usan en reset)
loadTheme(activeBackgroundId);
loadTheme('_neonRain');
loadTheme('_confetti');

export function getActiveBackgroundId() {
    return activeBackgroundId;
}

export function setBackgroundTheme(id) {
    const numericId = Number(id);
    activeBackgroundId = HERO_BACKGROUNDS.some(t => t.id === numericId) ? numericId : 0;
    localStorage.setItem('heroBgTheme', String(activeBackgroundId));

    // Llama reset en todos los módulos ya cargados que lo soporten
    const resetKeys = ['resetMatrix', 'resetGeometry', 'resetNeonRain', 'resetLaser',
        'resetFireworks', 'resetConfetti', 'resetMeteors', 'resetGalaxy',
        'resetMagnetic', 'resetHexagons', 'resetCircuits', 'resetBokeh', 'resetKaleidoscope'];

    for (const mod of Object.values(themeCache)) {
        if (mod && typeof mod === 'object' && !(mod instanceof Promise)) {
            for (const key of resetKeys) {
                if (typeof mod[key] === 'function') mod[key]();
            }
        }
    }

    // Precarga el nuevo tema si no está en cache aún
    loadTheme(activeBackgroundId);

    return activeBackgroundId;
}

export function drawActiveBackground(beat, dt, time) {
    const mod = themeCache[normalizeThemeId(activeBackgroundId)];
    // Si el módulo aún no se resolvió (primer frame tras un cambio), salta el frame
    if (!mod || mod instanceof Promise) return;

    switch (activeBackgroundId) {
        case 1:  mod.drawMatrix(beat, dt);              break;
        case 2:  mod.drawGeometry(beat, dt);            break;
        case 3:  mod.drawAurora(beat, dt, time);        break;
        case 4:  mod.drawOrbital(beat, dt, time);       break;
        case 5:
        case 13: mod.drawGalaxy(beat, dt, time);        break;
        case 6:
        case 17: mod.drawCircuits(beat, dt, time);      break;
        case 7:  mod.drawLaser(beat, dt, time);         break;
        case 8:  mod.drawEqualizer(beat, dt, time);     break;
        case 9:  mod.drawFireworks(beat, dt, time);     break;
        case 10: mod.drawWaves(beat, dt, time);         break;
        case 11: mod.drawMeteors(beat, dt);             break;
        case 12: mod.drawDNA(beat, dt, time);           break;
        case 14: mod.drawMagnetic(beat, dt, time);      break;
        case 15: mod.drawTopo(beat, dt, time);          break;
        case 16: mod.drawHexagons(beat, dt, time);      break;
        case 18: mod.drawFlowField(beat, dt, time);     break;
        case 19: mod.drawPlasma(beat, dt, time);        break;
        default: mod.drawConstellation(beat);            break;
    }
}
