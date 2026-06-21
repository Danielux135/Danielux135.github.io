import { analyzeBuffer, hydrateMap } from './analyzer.js';

export const BEATMAP_ANALYZER_VERSION = 'style-aware-v11-horobi-stem-syllable-v8';
export const BEATMAP_CACHE = new Map();

export function beatmapCacheKey(src) {
    return `${BEATMAP_ANALYZER_VERSION}|${src}`;
}

export function idbOpen() {
    return new Promise((resolve) => {
        try {
            const request = indexedDB.open('dlxArcade', 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('beatmaps')) db.createObjectStore('beatmaps');
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        } catch (error) {
            resolve(null);
        }
    });
}

export async function idbGet(key) {
    const db = await idbOpen();
    if (!db) return null;
    return new Promise((resolve) => {
        try {
            const request = db.transaction('beatmaps', 'readonly').objectStore('beatmaps').get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        } catch (error) {
            resolve(null);
        }
    });
}

export async function idbSet(key, value) {
    const db = await idbOpen();
    if (!db) return;
    try {
        db.transaction('beatmaps', 'readwrite').objectStore('beatmaps').put(value, key);
    } catch (error) {
        // IndexedDB puede estar desactivado o en modo privado. La caché en memoria sigue funcionando.
    }
}

export async function buildBeatmap(src) {
    const cacheKey = beatmapCacheKey(src);
    if (BEATMAP_CACHE.has(cacheKey)) return BEATMAP_CACHE.get(cacheKey);

    const cached = await idbGet(cacheKey);
    if (cached?.version === BEATMAP_ANALYZER_VERSION && cached.energy && cached.grid) {
        const map = hydrateMap(cached);
        BEATMAP_CACHE.set(cacheKey, map);
        return map;
    }

    const response = await fetch(src);
    if (!response.ok) throw new Error(`fetch ${response.status}`);
    const raw = await response.arrayBuffer();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const decodeContext = new AudioContextClass();
    let decoded;

    try {
        decoded = await new Promise((resolve, reject) => {
            const promise = decodeContext.decodeAudioData(raw, resolve, reject);
            if (promise && typeof promise.then === 'function') promise.then(resolve, reject);
        });
    } finally {
        decodeContext.close().catch(() => {});
    }

    const analyzed = await analyzeBuffer(decoded);
    const serializable = {
        version: BEATMAP_ANALYZER_VERSION,
        dur: analyzed.dur,
        bpm: analyzed.bpm,
        beatT: analyzed.beatT,
        grid: analyzed.grid,
        low: analyzed.low,
        mid: analyzed.mid,
        high: analyzed.high,
        energy: analyzed.energy,
        hopT: analyzed.hopT,
    };

    idbSet(cacheKey, serializable);
    const map = hydrateMap(analyzed);
    BEATMAP_CACHE.set(cacheKey, map);
    if (BEATMAP_CACHE.size > 6) BEATMAP_CACHE.delete(BEATMAP_CACHE.keys().next().value);
    return map;
}
