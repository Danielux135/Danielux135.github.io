/* Beatmap audio analysis: STFT multibanda, BPM, grid y energía. */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function fftRadix2(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            let t = re[i]; re[i] = re[j]; re[j] = t;
            t = im[i]; im[i] = im[j]; im[j] = t;
        }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const ang = -2 * Math.PI / len;
        const wr = Math.cos(ang), wi = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
            let cwr = 1, cwi = 0;
            for (let k = 0; k < len / 2; k++) {
                const ur = re[i + k], ui = im[i + k];
                const vr = re[i + k + len / 2] * cwr - im[i + k + len / 2] * cwi;
                const vi = re[i + k + len / 2] * cwi + im[i + k + len / 2] * cwr;
                re[i + k] = ur + vr; im[i + k] = ui + vi;
                re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
                const nwr = cwr * wr - cwi * wi;
                cwi = cwr * wi + cwi * wr; cwr = nwr;
            }
        }
    }
}

async function analyzeBuffer(decoded) {
    const N = 1024, HOP = 512;
    // mezclar a mono + remuestrear a ~22050 promediando
    const srcRate = decoded.sampleRate;
    const factor = Math.max(1, Math.round(srcRate / 22050));
    const srEff = srcRate / factor;
    const chs = [];
    for (let c = 0; c < decoded.numberOfChannels; c++) chs.push(decoded.getChannelData(c));
    const len = Math.floor(chs[0].length / factor);
    const mono = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        let s = 0;
        for (let j = 0; j < factor; j++) {
            for (let c = 0; c < chs.length; c++) s += chs[c][i * factor + j];
        }
        mono[i] = s / (factor * chs.length);
    }

    const hopT = HOP / srEff;
    const frames = Math.floor((mono.length - N) / HOP);
    if (frames < 100) throw new Error('canción demasiado corta');
    const binHz = srEff / N;
    const bands = [
        { lo: Math.round(30 / binHz), hi: Math.round(160 / binHz) },     // graves: bombo y bajo
        { lo: Math.round(300 / binHz), hi: Math.round(2500 / binHz) },   // medios: caja, voz
        { lo: Math.round(4000 / binHz), hi: Math.min(Math.round(10000 / binHz), N / 2 - 1) }, // agudos: hats
    ];
    const win = new Float32Array(N);
    for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));

    const flux = [new Float32Array(frames), new Float32Array(frames), new Float32Array(frames)];
    const lowEnergy = new Float32Array(frames);
    const prevMag = new Float32Array(N / 2);
    const re = new Float32Array(N), im = new Float32Array(N);
    const mag = new Float32Array(N / 2);
    for (let f = 0; f < frames; f++) {
        const base = f * HOP;
        for (let i = 0; i < N; i++) { re[i] = mono[base + i] * win[i]; im[i] = 0; }
        fftRadix2(re, im);
        for (let i = 0; i < N / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
        for (let b = 0; b < 3; b++) {
            let s = 0;
            for (let i = bands[b].lo; i <= bands[b].hi; i++) {
                const d = mag[i] - prevMag[i];
                if (d > 0) s += d;
            }
            flux[b][f] = s;
        }
        for (let i = bands[0].lo; i <= bands[0].hi; i++) lowEnergy[f] += mag[i];
        prevMag.set(mag);
        if (f % 1200 === 1199) await new Promise((r) => setTimeout(r, 0)); // no congelar la UI
    }

    // normalizar energía low por p95
    {
        const sorted = [...lowEnergy].sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)] || 1;
        for (let i = 0; i < frames; i++) lowEnergy[i] = Math.min(lowEnergy[i] / p95, 1.5);
    }
    // normalizar cada banda de flux por p95 + suavizar 3 frames
    const norm = flux.map((fl) => {
        const sorted = [...fl].sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)] || 1;
        const out = new Float32Array(fl.length);
        for (let i = 1; i < fl.length - 1; i++) out[i] = Math.min((fl[i - 1] + fl[i] + fl[i + 1]) / 3 / p95, 2);
        return out;
    });

    // onsets por banda: pico + mediana local * alpha + delta + refractario
    function onsets(env, alpha, delta, refract) {
        const W = Math.round(0.7 / hopT);
        const out = [];
        let lastT = -9;
        for (let i = 2; i < env.length - 2; i++) {
            const v = env[i];
            if (v < delta) continue;
            if (v < env[i - 1] || v < env[i + 1]) continue;
            const nLo = Math.max(0, i - W), nHi = Math.min(env.length - 1, i + W);
            const slice = Array.from(env.slice(nLo, nHi + 1)).sort((a, b) => a - b);
            const med = slice[Math.floor(slice.length / 2)];
            if (v < med * alpha + delta) continue;
            const t = i * hopT;
            if (t - lastT < refract) continue;
            out.push({ t, s: Math.min(v, 1) });
            lastT = t;
        }
        return out;
    }
    const low = onsets(norm[0], 1.4, 0.05, 0.12);
    const mid = onsets(norm[1], 1.5, 0.06, 0.09);
    const high = onsets(norm[2], 1.5, 0.06, 0.07);
    if (low.length + mid.length < 20) throw new Error('beatmap vacío');

    // BPM por autocorrelación (low + 0.5·mid) con apoyo de armónicos
    const env = new Float32Array(frames);
    for (let i = 0; i < frames; i++) env[i] = norm[0][i] + 0.5 * norm[1][i];
    const acCache = new Map();
    const corr = (p) => {
        if (p < 1 || p >= frames) return 0;
        if (acCache.has(p)) return acCache.get(p);
        let s = 0;
        for (let i = 0; i < frames - p; i++) s += env[i] * env[i + p];
        s /= (frames - p);
        acCache.set(p, s);
        return s;
    };
    const minP = Math.round(60 / 200 / hopT), maxP = Math.round(60 / 60 / hopT);
    let bestP = minP, bestScore = -1;
    for (let p = minP; p <= maxP; p++) {
        const s = corr(p) + 0.5 * corr(2 * p) + 0.3 * corr(Math.round(p / 2));
        if (s > bestScore) { bestScore = s; bestP = p; }
    }
    let bpm0 = 60 / (bestP * hopT);
    while (bpm0 < 70) bpm0 *= 2;
    while (bpm0 >= 180) bpm0 /= 2;

    // BPM fino + fase por "vector strength" sobre los kicks (sin deriva)
    function vectorFit(testBpm) {
        let best = null;
        for (let b = testBpm * 0.97; b <= testBpm * 1.03; b += 0.02) {
            const beatT = 60 / b;
            let sumRe = 0, sumIm = 0;
            for (const o of low) {
                const ang = 2 * Math.PI * (o.t / beatT);
                sumRe += o.s * Math.cos(ang);
                sumIm += o.s * Math.sin(ang);
            }
            const R = Math.hypot(sumRe, sumIm);
            if (!best || R > best.R) {
                let phase = (Math.atan2(sumIm, sumRe) / (2 * Math.PI)) * beatT;
                while (phase < 0) phase += beatT;
                best = { R, bpm: b, phase };
            }
        }
        return best;
    }
    const dur = mono.length / srEff;
    const cands = [];
    for (const mult of [1, 2, 0.5]) {
        const b = bpm0 * mult;
        if (b >= 70 && b < 180) cands.push(vectorFit(b));
    }
    cands.sort((a, b) => b.R - a.R);
    const fit = cands[0];
    const beatT = 60 / fit.bpm;
    const grid = [];
    for (let g = fit.phase; g < dur; g += beatT) grid.push(g);

    return { dur, bpm: fit.bpm, beatT, grid, low, mid, high, energy: lowEnergy, hopT };
}

function hydrateMap(m) {
    const e = m.energy, hopT = m.hopT, frames = e.length;
    m.energyAt = (t) => e[clamp(Math.round(t / hopT), 0, frames - 1)];
    return m;
}

export { analyzeBuffer, fftRadix2, hydrateMap };
