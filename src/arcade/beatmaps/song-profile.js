import { getTrackOverride, normalizeTrackTitle } from './track-overrides.js';

const PROFILE_PRESETS = Object.freeze({
    speed: {
        name: 'speed',
        jump: 0.72,
        stream: 1.20,
        stack: 0.46,
        curve: 1.05,
        spacing: 0.82,
        bandWeights: [0.82, 1.18, 1.38],
        heroTargets: [0.24, 0.43, 0.33],
        heroBias: [0.88, 1.24, 1.16],
        extraThresholdOffset: [-0.02, -0.05, -0.07],
        defaultSubdivision: 0.25,
        minGapMultiplier: 0.86,
        densityMultiplier: 1.16,
    },
    hardstyle: {
        name: 'hardstyle',
        jump: 1.22,
        stream: 0.86,
        stack: 0.36,
        curve: 0.76,
        spacing: 1.18,
        bandWeights: [1.35, 1.04, 0.84],
        heroTargets: [0.38, 0.38, 0.24],
        heroBias: [1.20, 1.08, 0.92],
        extraThresholdOffset: [-0.06, -0.03, 0.02],
        defaultSubdivision: 0.5,
        minGapMultiplier: 0.92,
        densityMultiplier: 1.06,
    },
    breakbeat: {
        name: 'breakbeat',
        jump: 0.92,
        stream: 1.18,
        stack: 0.28,
        curve: 1.20,
        spacing: 0.96,
        bandWeights: [1.00, 1.12, 1.24],
        heroTargets: [0.31, 0.36, 0.33],
        heroBias: [1.00, 1.08, 1.14],
        extraThresholdOffset: [0.00, -0.03, -0.06],
        defaultSubdivision: 0.25,
        minGapMultiplier: 0.88,
        densityMultiplier: 1.10,
    },
    club: {
        name: 'club',
        jump: 1.05,
        stream: 0.66,
        stack: 0.22,
        curve: 0.82,
        spacing: 1.08,
        bandWeights: [1.35, 0.92, 0.75],
        heroTargets: [0.48, 0.34, 0.18],
        heroBias: [1.18, 1.00, 0.86],
        extraThresholdOffset: [-0.07, 0.02, 0.07],
        defaultSubdivision: 1,
        minGapMultiplier: 1.04,
        densityMultiplier: 0.96,
    },
    melodic: {
        name: 'melodic',
        jump: 0.94,
        stream: 0.72,
        stack: 0.30,
        curve: 1.28,
        spacing: 1.00,
        bandWeights: [0.92, 1.32, 0.88],
        heroTargets: [0.27, 0.51, 0.22],
        heroBias: [0.94, 1.24, 0.94],
        extraThresholdOffset: [0.05, -0.08, 0.04],
        defaultSubdivision: 1,
        minGapMultiplier: 1.10,
        densityMultiplier: 0.90,
    },
    darkAnimePop: {
        name: 'darkAnimePop',
        jump: 0.96,
        stream: 0.92,
        stack: 0.50,
        curve: 1.18,
        spacing: 1.02,
        bandWeights: [1.18, 1.44, 1.02],
        heroTargets: [0.28, 0.52, 0.20],
        heroBias: [1.14, 1.38, 1.00],
        extraThresholdOffset: [-0.03, -0.14, 0.02],
        defaultSubdivision: 0.50,
        minGapMultiplier: 0.96,
        densityMultiplier: 0.98,
    },
    balanced: {
        name: 'balanced',
        jump: 1.00,
        stream: 0.86,
        stack: 0.28,
        curve: 1.00,
        spacing: 1.00,
        bandWeights: [1.06, 1.08, 1.00],
        heroTargets: [0.34, 0.36, 0.30],
        heroBias: [1.00, 1.00, 1.00],
        extraThresholdOffset: [0, 0, 0],
        defaultSubdivision: 1,
        minGapMultiplier: 1,
        densityMultiplier: 1,
    },
});

function energyStats(energy) {
    if (!energy || !energy.length) return { average: 0, hotRatio: 0, variance: 0 };
    let sum = 0;
    let hot = 0;
    for (const value of energy) {
        sum += value;
        if (value > 0.82) hot++;
    }
    const average = sum / energy.length;
    let variance = 0;
    for (const value of energy) variance += (value - average) ** 2;
    return { average, hotRatio: hot / energy.length, variance: variance / energy.length };
}

export function getSongMetrics(map = {}) {
    const duration = Math.max(Number(map.dur) || 1, 1);
    const lowPerMin = ((map.low && map.low.length) || 0) / duration * 60;
    const midPerMin = ((map.mid && map.mid.length) || 0) / duration * 60;
    const highPerMin = ((map.high && map.high.length) || 0) / duration * 60;
    const totalPerMin = lowPerMin + midPerMin + highPerMin;
    return {
        duration,
        bpm: Number(map.bpm) || 120,
        lowPerMin,
        midPerMin,
        highPerMin,
        melodicPerMin: midPerMin + highPerMin,
        totalPerMin,
        ...energyStats(map.energy),
    };
}

function profileFromTitle(title) {
    const text = normalizeTrackTitle(title);
    if (/speedcore|uptempo|nightcore|gabber/.test(text)) return 'speed';
    if (/hardstyle|rawstyle|hardcore/.test(text)) return 'hardstyle';
    if (/anime|vocaloid|shonen|horobi|fukuin|滅び|福音/.test(text)) return 'darkAnimePop';
    if (/drum and bass|dnb|breakbeat|jungle/.test(text)) return 'breakbeat';
    if (/deep house|house|dance|club|techno|edm/.test(text)) return 'club';
    return null;
}

function profileFromAudio(metrics) {
    const { bpm, lowPerMin, midPerMin, highPerMin, melodicPerMin, totalPerMin, hotRatio } = metrics;

    // La detección de BPM puede devolver el half-time. Por eso la densidad de
    // onsets también participa en los estilos rápidos y breakbeat.
    if (bpm >= 158 || totalPerMin > 520 || (highPerMin > 275 && totalPerMin > 430)) return 'speed';
    if (bpm >= 135 && bpm <= 165 && lowPerMin > 80 && midPerMin > highPerMin * 0.85 && melodicPerMin > 135) return 'darkAnimePop';
    if (bpm >= 134 && lowPerMin > 108 && hotRatio > 0.10) return 'hardstyle';
    if (bpm >= 76 && bpm <= 102 && melodicPerMin > 260 && highPerMin > 145) return 'breakbeat';
    if (bpm >= 110 && bpm <= 134 && lowPerMin > 76 && highPerMin < 235) return 'club';
    if ((midPerMin > lowPerMin * 1.40 && highPerMin < 215) || totalPerMin < 245) return 'melodic';
    return 'balanced';
}

function mergeProfile(base, override) {
    if (!override) return { ...base, override: null };
    const hero = override.hero || {};
    const beatStriker = override.beatStriker || {};
    return {
        ...base,
        override,
        subdivision: hero.subdivision ?? base.defaultSubdivision,
        minGapMultiplier: (base.minGapMultiplier || 1) * (hero.minGapMultiplier || 1),
        beatStrikerMinGapMultiplier: beatStriker.minGapMultiplier || 1,
        densityMultiplier: (base.densityMultiplier || 1) * (beatStriker.densityMultiplier || 1),
    };
}

export function getSongProfile(map = {}, title = '') {
    const override = getTrackOverride(title);
    const metrics = getSongMetrics(map);
    const name = override?.profile || profileFromTitle(title) || profileFromAudio(metrics);
    const base = PROFILE_PRESETS[name] || PROFILE_PRESETS.balanced;
    return {
        ...mergeProfile(base, override),
        metrics,
        title: String(title || ''),
    };
}

export { PROFILE_PRESETS };
