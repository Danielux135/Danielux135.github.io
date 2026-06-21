/*
 * Ajustes persistentes para canciones que ya se probaron de forma manual.
 * La clave se normaliza (sin tildes, signos ni diferencias de mayúsculas).
 * Estos datos solo corrigen la interpretación musical; nunca inventan golpes.
 */

export function normalizeTrackTitle(title = '') {
    return String(title)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

export const TRACK_OVERRIDES = Object.freeze({
    'between staying and goodbye hardstyle remix': {
        profile: 'hardstyle',
        hero: { subdivision: 0.5, minGapMultiplier: 0.90 },
        beatStriker: { densityMultiplier: 1.08 },
    },
    'jaymes young what is love hardstyle remix': {
        profile: 'hardstyle',
        hero: { subdivision: 0.5, minGapMultiplier: 0.90 },
        beatStriker: { densityMultiplier: 1.08 },
    },
    'nobody new speedcore remix': {
        profile: 'speed',
        hero: { subdivision: 0.25, minGapMultiplier: 0.82 },
        beatStriker: { densityMultiplier: 1.18, minGapMultiplier: 0.86 },
    },
    'billie eilish and khalid lovely deep house remix': {
        profile: 'club',
        hero: { subdivision: 1, minGapMultiplier: 1.04 },
        beatStriker: { densityMultiplier: 0.96 },
    },
    'nobody new deep house remix': {
        profile: 'club',
        hero: { subdivision: 1, minGapMultiplier: 1.02 },
        beatStriker: { densityMultiplier: 0.98 },
    },
    'noosa walk on by deep house remix': {
        profile: 'club',
        hero: { subdivision: 1, minGapMultiplier: 1.02 },
        beatStriker: { densityMultiplier: 0.98 },
    },
    'world s end girl s rondo remix': {
        profile: 'breakbeat',
        hero: { subdivision: 0.25, minGapMultiplier: 0.88 },
        beatStriker: { densityMultiplier: 1.10 },
    },
    'horobi no fukuin 滅びの福音': {
        profile: 'darkAnimePop',
        hero: { bossMap: 'horobiHeroV8StemSyllable', subdivision: 0.25, minGapMultiplier: 0.78 },
        beatStriker: { densityMultiplier: 1.08, minGapMultiplier: 0.90 },
    },
    'between staying and goodbye': {
        profile: 'melodic',
        hero: { subdivision: 1, minGapMultiplier: 1.08 },
        beatStriker: { densityMultiplier: 0.90 },
    },
});

export function getTrackOverride(title = '') {
    return TRACK_OVERRIDES[normalizeTrackTitle(title)] || null;
}
