import { getSongProfile } from './song-profile.js';
import { getHorobiHeroEvents, isHorobiTrack } from './horobi-hero-map.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const HERO_DIFFICULTY = Object.freeze({
    easy: {
        minGap: 0.45,
        thresholds: [0.90, 0.92, 0.94],
        targets: [0.48, 0.34, 0.18],
        density: 0.52,
    },
    medium: {
        minGap: 0.28,
        thresholds: [0.80, 0.84, 0.86],
        targets: [0.44, 0.34, 0.22],
        density: 0.72,
    },
    hard: {
        minGap: 0.17,
        thresholds: [0.56, 0.50, 0.57],
        targets: [0.38, 0.36, 0.26],
        density: 0.90,
    },
    expert: {
        minGap: 0.11,
        thresholds: [0.40, 0.38, 0.40],
        targets: [0.34, 0.36, 0.30],
        density: 1,
    },
});

const TAP_DIFFICULTY = Object.freeze({
    easy: { minGap: 0.36, threshold: 0.82, density: 0.52 },
    medium: { minGap: 0.235, threshold: 0.60, density: 0.72 },
    hard: { minGap: 0.145, threshold: 0.43, density: 0.90 },
    expert: { minGap: 0.095, threshold: 0.34, density: 1 },
});

function tagged(arr = [], band, extra = {}) {
    return arr.map((onset) => ({
        t: onset.t,
        s: onset.s,
        band,
        ...extra,
    }));
}

function rowStrength(rows) {
    return rows.reduce((sum, row) => {
        const strongest = row.hits.reduce((best, hit) => Math.max(best, hit.s || 0), 0);
        return sum + strongest;
    }, 0);
}

function chooseAlternatingHalf(rows) {
    const evens = rows.filter((_, index) => index % 2 === 0);
    const odds = rows.filter((_, index) => index % 2 === 1);
    return rowStrength(evens) >= rowStrength(odds) ? evens : odds;
}

function deterministicUnit(seed) {
    let value = 2166136261;
    const text = String(seed);
    for (let i = 0; i < text.length; i++) {
        value ^= text.charCodeAt(i);
        value = Math.imul(value, 16777619);
    }
    return (value >>> 0) / 4294967295;
}

function nearestHits(arr = [], gridT, windowSize) {
    const out = [];
    for (let index = 0; index < arr.length; index++) {
        const onset = arr[index];
        const drift = onset.t - gridT;
        if (Math.abs(drift) <= windowSize) out.push({ ...onset, drift });
        else if (drift > windowSize) break;
    }
    return out;
}

export function heroBeatAnchors(map) {
    if (map._heroAnchors) return map._heroAnchors;
    const bands = [map.low || [], map.mid || [], map.high || []];
    const pointers = [0, 0, 0];
    const windowSize = 0.09;
    const rows = [];

    for (const gridT of map.grid || []) {
        const hits = [];
        for (let band = 0; band < 3; band++) {
            const arr = bands[band];
            let index = pointers[band];
            while (index < arr.length && arr[index].t < gridT - windowSize) index++;
            pointers[band] = index;

            let best = null;
            let bestScore = -Infinity;
            for (let scan = index; scan < arr.length && arr[scan].t <= gridT + windowSize; scan++) {
                const drift = arr[scan].t - gridT;
                const score = arr[scan].s * (1 - Math.abs(drift) / windowSize * 0.22);
                if (score > bestScore) {
                    bestScore = score;
                    best = { t: arr[scan].t, s: arr[scan].s, band, drift };
                }
            }
            if (best) hits.push(best);
        }
        if (hits.length) rows.push({ t: gridT, hits });
    }

    map._heroAnchors = rows;
    return rows;
}

export function heroSubdivisionAnchors(map, step, windowSize) {
    const bands = [map.low || [], map.mid || [], map.high || []];
    const pointers = [0, 0, 0];
    const rows = [];
    const start = map.grid && map.grid.length ? map.grid[0] : 0;
    const duration = Math.max(map.dur || 0, start);

    if (!(step > 0) || !(windowSize > 0)) return rows;

    for (let gridT = start; gridT < duration; gridT += step) {
        const hits = [];
        for (let band = 0; band < 3; band++) {
            const arr = bands[band];
            let index = pointers[band];
            while (index < arr.length && arr[index].t < gridT - windowSize) index++;
            pointers[band] = index;

            let best = null;
            let bestScore = -Infinity;
            for (let scan = index; scan < arr.length && arr[scan].t <= gridT + windowSize; scan++) {
                const drift = arr[scan].t - gridT;
                const score = arr[scan].s * (1 - Math.abs(drift) / windowSize * 0.28);
                if (score > bestScore) {
                    bestScore = score;
                    best = { t: arr[scan].t, s: arr[scan].s, band, drift };
                }
            }
            if (best) hits.push(best);
        }
        if (hits.length) rows.push({ t: gridT, hits });
    }

    return rows;
}

export function heroBreakbeatRows(map) {
    if (Object.prototype.hasOwnProperty.call(map, '_heroBreakbeatRows')) return map._heroBreakbeatRows;
    const duration = Math.max(map.dur || 1, 1);
    const melodicPerMin = (((map.mid || []).length + (map.high || []).length) / duration) * 60;
    const halfTimeDnB = map.bpm >= 78 && map.bpm <= 98 && melodicPerMin > 260;
    if (!halfTimeDnB) {
        map._heroBreakbeatRows = null;
        return null;
    }
    const step = map.beatT / 4;
    const windowSize = clamp(step * 0.42, 0.045, 0.072);
    map._heroBreakbeatRows = heroSubdivisionAnchors(map, step, windowSize);
    return map._heroBreakbeatRows;
}

export function heroDrivingGrooveRows(map) {
    if (Object.prototype.hasOwnProperty.call(map, '_heroDrivingRows')) return map._heroDrivingRows;
    const duration = Math.max(map.dur || 1, 1);
    const lowPerMin = ((map.low || []).length / duration) * 60;
    const melodicPerMin = (((map.mid || []).length + (map.high || []).length) / duration) * 60;
    const totalPerMin = (((map.low || []).length + (map.mid || []).length + (map.high || []).length) / duration) * 60;
    const drivingHalfTime = map.bpm >= 88 && map.bpm <= 110
        && lowPerMin > 120
        && melodicPerMin > 160
        && melodicPerMin <= 260
        && totalPerMin > 320;

    if (!drivingHalfTime) {
        map._heroDrivingRows = null;
        return null;
    }

    const step = map.beatT / 4;
    const windowSize = clamp(step * 0.38, 0.05, 0.08);
    map._heroDrivingRows = heroSubdivisionAnchors(map, step, windowSize);
    return map._heroDrivingRows;
}

export function heroAnimePopRows(map) {
    if (Object.prototype.hasOwnProperty.call(map, '_heroAnimePopRows')) return map._heroAnimePopRows;
    const duration = Math.max(map.dur || 1, 1);
    const lowPerMin = ((map.low || []).length / duration) * 60;
    const midPerMin = ((map.mid || []).length / duration) * 60;
    const highPerMin = ((map.high || []).length / duration) * 60;
    const melodicPerMin = midPerMin + highPerMin;
    const animePopDrive = map.bpm >= 135
        && map.bpm <= 165
        && lowPerMin > 80
        && melodicPerMin > 135;

    if (!animePopDrive) {
        map._heroAnimePopRows = null;
        return null;
    }

    const step = map.beatT / 4;
    const windowSize = clamp(step * 0.44, 0.045, 0.07);
    map._heroAnimePopRows = heroSubdivisionAnchors(map, step, windowSize);
    return map._heroAnimePopRows;
}

export function chooseHeroHit(hits, counts, total, targets, bias = [1, 1, 1]) {
    let best = null;
    let bestScore = -Infinity;
    for (const hit of hits || []) {
        const expected = (total + 1) * targets[hit.band];
        const deficit = expected - counts[hit.band];
        const fairness = 1 + clamp(deficit, -2, 2) * 0.22;
        const score = (hit.s || 0) * fairness * (bias[hit.band] || 1) - Math.abs(hit.drift || 0) * 0.45;
        if (score > bestScore) {
            bestScore = score;
            best = hit;
        }
    }
    return best;
}

function profileRows(map, diff, profile) {
    const regularRows = heroBeatAnchors(map);
    if (diff !== 'expert') return regularRows;

    const subdivision = profile.subdivision ?? profile.defaultSubdivision ?? 1;
    if (subdivision < 1 && map.beatT > 0) {
        const step = map.beatT * subdivision;
        const windowSize = clamp(step * (subdivision <= 0.25 ? 0.43 : 0.38), 0.042, 0.082);
        const rows = heroSubdivisionAnchors(map, step, windowSize);
        if (rows.length >= regularRows.length * 0.78) return rows;
    }

    if (profile.name === 'breakbeat') return heroBreakbeatRows(map) || regularRows;
    if (profile.name === 'darkAnimePop') return heroAnimePopRows(map) || regularRows;
    if (profile.name === 'balanced') return heroBreakbeatRows(map) || heroDrivingGrooveRows(map) || regularRows;
    return regularRows;
}

function profileThresholds(baseThresholds, profile) {
    return baseThresholds.map((threshold, band) => clamp(
        threshold + (profile.extraThresholdOffset?.[band] || 0),
        0.20,
        0.96,
    ));
}

function collectHeroExtras(map, thresholds) {
    return [
        tagged((map.low || []).filter((onset) => onset.s >= thresholds[0]), 0, { extra: true }),
        tagged((map.mid || []).filter((onset) => onset.s >= thresholds[1]), 1, { extra: true }),
        tagged((map.high || []).filter((onset) => onset.s >= thresholds[2]), 2, { extra: true }),
    ];
}

function clusterEvents(pool, minGap, targets, bias) {
    const sorted = pool.slice().sort((a, b) => a.t - b.t || (b.s || 0) - (a.s || 0));
    const out = [];
    const counts = [0, 0, 0];
    let index = 0;

    while (index < sorted.length) {
        const startT = sorted[index].t;
        const cluster = [];
        while (index < sorted.length && sorted[index].t - startT < minGap) cluster.push(sorted[index++]);
        const pick = chooseHeroHit(cluster, counts, out.length, targets, bias);
        if (!pick) continue;
        out.push(pick);
        counts[pick.band]++;
    }

    return out;
}

function nearestOnset(arr = [], time, windowSize, band, role, scoreScale = 1) {
    let best = null;
    let bestScore = -Infinity;
    for (const onset of arr) {
        const drift = onset.t - time;
        if (drift < -windowSize) continue;
        if (drift > windowSize) break;
        const close = 1 - Math.abs(drift) / windowSize;
        const score = (onset.s || 0) * (0.72 + close * 0.34) * scoreScale;
        if (score > bestScore) {
            bestScore = score;
            best = { t: onset.t, s: onset.s, band, drift, role, score };
        }
    }
    return best;
}

function quantile(values, q, fallback = 0) {
    if (!values.length) return fallback;
    const sorted = values.slice().sort((a, b) => a - b);
    return sorted[Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * q)))];
}

function selectDarkAnimeHeroEvents(map, diff, profile) {
    const base = HERO_DIFFICULTY[diff] || HERO_DIFFICULTY.medium;
    const low = map.low || [];
    const mid = map.mid || [];
    const high = map.high || [];
    const duration = Math.max(map.dur || 1, 1);
    const beatT = map.beatT || 0.4;
    const barT = beatT * 4;
    const grid = map.grid && map.grid.length ? map.grid : [];
    const start = grid[0] || 0;
    const midStrong = quantile(mid.map((o) => o.s || 0), 0.58, 0.38);
    const midPeak = quantile(mid.map((o) => o.s || 0), 0.82, 0.62);
    const lowPeak = quantile(low.map((o) => o.s || 0), 0.80, 0.66);
    const highPeak = quantile(high.map((o) => o.s || 0), 0.78, 0.62);
    const pool = [];

    if (diff === 'easy') {
        for (let beat = 0, t = start; t < duration - 0.25; beat++, t += beatT) {
            if (beat % 2) continue;
            const energy = map.energyAt ? map.energyAt(t) : 0.5;
            const pick = nearestOnset(mid, t, beatT * 0.24, 1, 'voice', 1.25)
                || nearestOnset(low, t, beatT * 0.22, 0, 'pulse', 1.10)
                || (energy > 0.82 ? nearestOnset(high, t, beatT * 0.20, 2, 'accent', 1.0) : null);
            if (pick) pool.push(pick);
        }
    } else {
        const step = diff === 'medium' ? beatT : beatT / 2;
        const windowSize = clamp(step * 0.34, 0.045, 0.105);
        for (let slot = 0, t = start; t < duration - 0.25; slot++, t += step) {
            const beatInBar = Math.floor(((t - start) / beatT + 0.01) % 4);
            const halfBeat = Math.abs(((t - start) / beatT) % 1 - 0.5) < 0.12;
            const energy = map.energyAt ? map.energyAt(t) : 0.5;

            const voice = nearestOnset(mid, t, windowSize, 1, 'voice', beatInBar === 3 ? 1.42 : 1.25);
            const bass = nearestOnset(low, t, windowSize, 0, beatInBar === 0 ? 'drop' : 'taiko', beatInBar === 0 ? 1.34 : 1.10);
            const lead = nearestOnset(high, t, windowSize * 0.92, 2, 'lead', energy > 0.86 || halfBeat ? 1.22 : 0.92);

            if (bass && (bass.s >= lowPeak || beatInBar === 0 || energy > 0.92)) pool.push(bass);
            if (voice && (voice.s >= midStrong || (!bass && voice.s >= midStrong * 0.78))) pool.push(voice);
            if (lead && (lead.s >= highPeak || (energy > 0.96 && lead.s > 0.48))) pool.push(lead);
        }

        for (const onset of mid) {
            if (onset.t <= 0.30 || onset.t >= duration - 0.25) continue;
            if ((onset.s || 0) >= midPeak) pool.push({ ...onset, band: 1, role: 'vocal-belt', score: (onset.s || 0) * 1.55 });
        }
        for (const onset of low) {
            if (onset.t <= 0.30 || onset.t >= duration - 0.25) continue;
            const energy = map.energyAt ? map.energyAt(onset.t) : 0;
            if ((onset.s || 0) >= lowPeak && energy > 0.72) pool.push({ ...onset, band: 0, role: 'bass-drop', score: (onset.s || 0) * 1.42 });
        }
        for (const onset of high) {
            if (onset.t <= 0.30 || onset.t >= duration - 0.25) continue;
            const energy = map.energyAt ? map.energyAt(onset.t) : 0;
            if ((onset.s || 0) >= highPeak && energy > 0.78) pool.push({ ...onset, band: 2, role: 'lead-guitar', score: (onset.s || 0) * 1.20 });
        }
    }

    const targets = profile.heroTargets || base.targets;
    const bias = profile.heroBias || [1.14, 1.38, 1.00];
    const minGap = base.minGap * (profile.minGapMultiplier || 1);
    return clusterEvents(pool, minGap, targets, bias).map((event) => ({
        ...event,
        profile: profile.name,
    }));
}

export function eventsForHero(map, diff = 'medium', trackTitle = '') {
    if (isHorobiTrack(trackTitle)) return getHorobiHeroEvents(diff);

    const profile = getSongProfile(map, trackTitle);
    if (profile.name === 'darkAnimePop') return selectDarkAnimeHeroEvents(map, diff, profile);

    const base = HERO_DIFFICULTY[diff] || HERO_DIFFICULTY.medium;
    let rows = profileRows(map, diff, profile);
    if (diff === 'easy') rows = chooseAlternatingHalf(rows);

    const targets = profile.heroTargets || base.targets;
    const bias = profile.heroBias || profile.bandWeights || [1, 1, 1];
    const primaryCounts = [0, 0, 0];
    const primary = [];

    for (const row of rows) {
        const hit = chooseHeroHit(row.hits, primaryCounts, primary.length, targets, bias);
        if (!hit) continue;
        primary.push({ ...hit, primary: true, profile: profile.name });
        primaryCounts[hit.band]++;
    }

    const thresholds = profileThresholds(base.thresholds, profile);
    const extras = diff === 'easy' ? [] : collectHeroExtras(map, thresholds).flat();
    const minGap = base.minGap * (profile.minGapMultiplier || 1);
    const selected = clusterEvents([...primary, ...extras], minGap, targets, bias);

    return selected.map((event) => ({
        ...event,
        profile: profile.name,
    }));
}

function selectBestGridHit(map, gridT, windowSize, profile, counts, total) {
    const candidates = [];
    const bands = [map.low || [], map.mid || [], map.high || []];
    for (let band = 0; band < 3; band++) {
        for (const onset of nearestHits(bands[band], gridT, windowSize)) {
            const expected = (total + 1) * (profile.heroTargets?.[band] || 1 / 3);
            const deficit = expected - counts[band];
            const fairness = 1 + clamp(deficit, -2, 2) * 0.16;
            const score = onset.s * (profile.bandWeights?.[band] || 1) * fairness - Math.abs(onset.drift) * 1.5;
            candidates.push({ ...onset, band, score, primary: true, kind: 'beat' });
        }
    }
    candidates.sort((a, b) => b.score - a.score || b.s - a.s);
    return candidates[0] || null;
}

function tapExtraWeight(profileName, band) {
    if (profileName === 'club') return band === 0 ? 1.18 : band === 1 ? 0.96 : 0.82;
    if (profileName === 'melodic') return band === 1 ? 1.22 : 0.92;
    if (profileName === 'speed' || profileName === 'breakbeat') return band === 2 ? 1.24 : band === 1 ? 1.08 : 0.94;
    if (profileName === 'hardstyle') return band === 0 ? 1.24 : band === 1 ? 1.04 : 0.88;
    return 1;
}

function annotateTiming(events, map) {
    return events.map((event, index) => {
        const previous = events[index - 1];
        const next = events[index + 1];
        return {
            ...event,
            s: clamp(event.s || 0.5, 0.2, 1),
            energy: map.energyAt ? map.energyAt(event.t) : (event.s || 0.5),
            gapPrev: previous ? event.t - previous.t : 999,
            gapNext: next ? next.t - event.t : 999,
        };
    });
}

export function selectBeatStrikerEvents(map, diff = 'medium', trackTitle = '') {
    const profile = getSongProfile(map, trackTitle);
    const base = TAP_DIFFICULTY[diff] || TAP_DIFFICULTY.medium;
    const duration = Math.max(map.dur || 1, 1);
    const beatT = map.beatT || 0.5;
    const windowSize = clamp(beatT * 0.18, 0.055, 0.095);
    const pool = [];
    const gridCounts = [0, 0, 0];
    let gridPick = 0;

    // Recupera la capa musical compleja de Hero Mode y la usa como columna
    // vertebral. Después se añaden acentos reales por perfil, sin notas falsas.
    for (const event of eventsForHero(map, diff, trackTitle)) {
        if (event.t > 0.30 && event.t < duration - 0.25) {
            pool.push({ ...event, heroMapped: true, scoreBias: 1.18 });
        }
    }

    for (const gridT of map.grid || []) {
        const hit = selectBestGridHit(map, gridT, windowSize, profile, gridCounts, gridPick);
        if (!hit) continue;
        if (diff === 'easy' && gridPick++ % 2) continue;
        gridCounts[hit.band]++;
        pool.push({ ...hit, scoreBias: 1.0 });
    }

    if (diff !== 'easy') {
        const bands = [map.low || [], map.mid || [], map.high || []];
        for (let band = 0; band < 3; band++) {
            const weight = tapExtraWeight(profile.name, band);
            const threshold = clamp(
                base.threshold + (profile.extraThresholdOffset?.[band] || 0),
                0.22,
                0.92,
            );
            for (const onset of bands[band]) {
                if ((onset.s || 0) < threshold) continue;
                const density = clamp(base.density * (profile.densityMultiplier || 1), 0, 1);
                const guaranteed = onset.s >= threshold + 0.25;
                const seed = `${trackTitle}|${profile.name}|${diff}|${band}|${onset.t.toFixed(4)}`;
                if (!guaranteed && deterministicUnit(seed) > density) continue;
                pool.push({
                    ...onset,
                    band,
                    accent: true,
                    kind: band === 0 ? 'kick' : band === 1 ? 'snap' : 'tick',
                    scoreBias: weight,
                });
            }
        }
    }

    const minGap = base.minGap
        * (profile.beatStrikerMinGapMultiplier || 1)
        * (profile.name === 'speed' && diff === 'expert' ? 0.88 : 1);

    const sorted = pool
        .filter((event) => event.t > 0.30 && event.t < duration - 0.25)
        .sort((a, b) => a.t - b.t || (b.scoreBias || 1) * (b.s || 0) - (a.scoreBias || 1) * (a.s || 0));

    const selected = [];
    let index = 0;
    while (index < sorted.length) {
        const startT = sorted[index].t;
        const cluster = [];
        while (index < sorted.length && sorted[index].t - startT < minGap) cluster.push(sorted[index++]);
        cluster.sort((a, b) => {
            const aScore = (a.s || 0) * (a.scoreBias || 1) + (a.heroMapped ? 0.12 : 0);
            const bScore = (b.s || 0) * (b.scoreBias || 1) + (b.heroMapped ? 0.12 : 0);
            return bScore - aScore;
        });
        if (cluster[0]) selected.push(cluster[0]);
    }

    let events = annotateTiming(selected, map);
    if (diff === 'easy') {
        events = events.filter((event, eventIndex) => eventIndex % 2 === 0 || event.energy > 0.92 || event.s > 0.88);
        events = annotateTiming(events, map);
    }

    return { events, profile };
}
