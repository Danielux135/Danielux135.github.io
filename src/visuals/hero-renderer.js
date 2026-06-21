import { canvas, ctx } from './backgrounds/context.js';
import { drawActiveBackground } from './backgrounds/manager.js';
import { drawWeatherOverlay } from './weather-overlay.js';
import { hslToRgb } from './color-utils.js';

export const visualState = { beat: 0 };

// seguimiento de energía del sub-bass (bins 1-3, ~86-344 Hz con fftSize 512) para el pulso visual
// usa envelope en vez de threshold: más cobertura, sin ruido en silencio
let _bassEnv = 0;
let _bassFloor = 0.06;
let _bassCeil = 0.22;
let _bassBuf = null; // buffer reusado: evita crear un uint8array nuevo cada frame (presión de gc)
window._visualVolumeFactor = 0.85;
// calcula la energía del sub-bass con envelope de ataque instantáneo y release suave
// (analyser en vivo; el lag del arcade NO era esto, era la promo animándose oculta)
function getBassEnergy() {
    const analyser = window._audioAnalyser;
    if (!analyser) {
        _bassEnv *= 0.90;
        if (_bassEnv < 0.004) _bassEnv = 0;
        return _bassEnv;
    }
    const n = analyser.frequencyBinCount;
    if (!_bassBuf || _bassBuf.length !== n) _bassBuf = new Uint8Array(n);
    analyser.getByteFrequencyData(_bassBuf);

    let bassSum = 0;
    let bassPeak = 0;
    for (let i = 1; i <= 8 && i < n; i++) {
        const v = _bassBuf[i] / 255;
        bassSum += v;
        if (v > bassPeak) bassPeak = v;
    }
    let midSum = 0;
    for (let i = 9; i <= 34 && i < n; i++) midSum += _bassBuf[i] / 255;
    const bassAvg = bassSum / Math.min(8, Math.max(1, n - 1));
    const midAvg = midSum / Math.min(26, Math.max(1, n - 9));
    const raw = bassAvg * 0.58 + bassPeak * 0.24 + midAvg * 0.18;
    _bassFloor += (raw - _bassFloor) * 0.012;
    _bassCeil += (raw - _bassCeil) * (raw > _bassCeil ? 0.035 : 0.006);
    if (_bassCeil < _bassFloor + 0.08) _bassCeil = _bassFloor + 0.08;
    const normalized = Math.max(0, Math.min(1, (raw - _bassFloor * 0.72) / (_bassCeil - _bassFloor * 0.72)));
    const volFactor = Math.max(0, Math.min(1, window._visualVolumeFactor ?? 1));
    const shaped = Math.pow(normalized, 1.85) * 0.58 * volFactor;

    if (shaped > _bassEnv) _bassEnv += (shaped - _bassEnv) * 0.22;
    else                   _bassEnv += (shaped - _bassEnv) * 0.055;
    if (_bassEnv < 0.004) _bassEnv = 0;
    return _bassEnv;
}
// visualState.beat mantiene la energía suavizada compartida con el arcade
// calcula los colores de acento según el beat y los publica en globals js (cada frame)
// igual que el arcade: el beat solo se publica en globals js que lee el canvas
// nunca se escribe en :root durante la animación (mutar una custom property heredada
// fuerza recalc de todo el árbol + repaint de cada elemento que la usa = tirón con música)
function updateAccentColors(v) {
    if (window._colorDragging) return;
    const _h1base = window._paletteH1 !== undefined ? window._paletteH1 : 195;
    const _h2base = window._paletteH2 !== undefined ? window._paletteH2 : 262;
    const _l1base = window._paletteL1 !== undefined ? window._paletteL1 : 50;
    const _l2base = window._paletteL2 !== undefined ? window._paletteL2 : 60;
    const [r1, g1, b1] = hslToRgb(_h1base + v * 30, 100, _l1base + v * 10);
    const [r2, g2, b2r] = hslToRgb(_h2base + v * 20, 90, _l2base + v * 8);
    window._accent1Rgb = `${r1} ${g1} ${b1}`;
    window._accent2Rgb = `${r2} ${g2} ${b2r}`;
}
// reactividad del dom al beat sin tirones: --beat-alpha se escribe escopado a cada sección
// (estilo directo del elemento → solo recalcula su subárbol, no todo el documento como :root)
// y solo en las secciones que están en pantalla; las de fuera no cuestan nada
let _beatSections = [];
function _initBeatSections() {
    const els = Array.from(document.querySelectorAll('section'));
    const npb = document.getElementById('nowPlayingBar');
    if (npb) els.push(npb);
    _beatSections = els.map(el => ({ el, visible: true }));
    try {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                const s = _beatSections.find(x => x.el === e.target);
                if (!s) return;
                s.visible = e.isIntersecting;
                if (!e.isIntersecting) e.target.style.setProperty('--beat-alpha', '0');
            });
        });
        _beatSections.forEach(s => { s.visible = false; io.observe(s.el); });
    } catch (e) { /* sin intersectionobserver: se animan todas */ }
}
let _beatIdle = false;
// escribe --beat-alpha solo en secciones visibles; en silencio escribe 0 una vez y para
function pulseBeatDom(v) {
    if (!_beatSections.length) _initBeatSections();
    const stage = document.getElementById('stageMode');
    const stageOpen = stage && stage.classList.contains('open');
    if (v < 0.005) {
        if (_beatIdle) {
            if (stageOpen) stage.style.setProperty('--beat-alpha', '0');
            return;
        }
        _beatIdle = true;
        v = 0;
    } else {
        _beatIdle = false;
    }
    const a = v.toFixed(3);
    for (const s of _beatSections) {
        if (s.visible) s.el.style.setProperty('--beat-alpha', a);
    }
    if (stageOpen) stage.style.setProperty('--beat-alpha', a);
}
// las partículas solo se dibujan cuando el hero es visible: drawconnections es o(n²)
// el beat y los colores de acento se actualizan siempre porque los usa toda la web
let _heroVisible = true;
try {
    new IntersectionObserver((entries) => { _heroVisible = entries[0].isIntersecting; }).observe(canvas);
} catch (e) { /* navegador sin intersectionobserver: se anima siempre */ }
let _lastFrameTs = 0;
// medidor opcional de ms/frame: window._fps = true muestra el tiempo real de frame
// (refleja toda la carga del hilo principal). Sirve para ver de dónde viene el lag.
let _fpsLast = 0, _fpsAcc = 0, _fpsCnt = 0, _fpsMax = 0, _fpsEl = null;
function _fpsMeter(ts) {
    if (_fpsLast) {
        const ft = ts - _fpsLast;
        _fpsAcc += ft; _fpsCnt++;
        if (ft > _fpsMax) _fpsMax = ft;
    }
    _fpsLast = ts;
    if (_fpsCnt >= 20) {
        const avg = _fpsAcc / _fpsCnt;
        if (!_fpsEl) {
            _fpsEl = document.createElement('div');
            // visibility:visible se fuerza porque el arcade oculta todo lo que no sea su
            // overlay; además lo colgamos del overlay si existe para que se vea dentro.
            _fpsEl.style.cssText = 'position:fixed;top:6px;left:6px;z-index:9999999;background:rgba(0,0,0,0.82);color:#0f0;font:12px monospace;padding:4px 7px;border-radius:6px;pointer-events:none;white-space:pre;visibility:visible';
        }
        const host = document.getElementById('arcadeOverlay') || document.body;
        if (_fpsEl.parentNode !== host) host.appendChild(_fpsEl);
        _fpsEl.textContent = `avg ${avg.toFixed(1)}ms (${(1000/avg).toFixed(0)}fps)\nmax ${_fpsMax.toFixed(1)}ms`;
        _fpsAcc = 0; _fpsCnt = 0; _fpsMax = 0;
    }
}
// bucle principal de animación del hero: actualiza el beat y dibuja el fondo activo
function animateParticles(ts = 0) {
    requestAnimationFrame(animateParticles);
    const dt = _lastFrameTs ? Math.min((ts - _lastFrameTs) / 1000, 0.05) : 0.016;
    _lastFrameTs = ts;
    if (window._fps) _fpsMeter(ts);
    const beat = getBassEnergy();
    visualState.beat += (beat - visualState.beat) * (beat > visualState.beat ? 0.18 : 0.08);
    if (visualState.beat < 0.005) visualState.beat = 0;
    // Los colores de acento se actualizan SIEMPRE (también con el arcade abierto): el
    // fondo del arcade los lee para virar de tono con el beat. Si se saltaban con
    // arcade-lock, el fondo quedaba congelado de color y solo pulsaba en brillo.
    updateAccentColors(visualState.beat);
    if (document.documentElement.classList.contains('arcade-lock')) return;
    // --beat-alpha escopado a las secciones visibles del dom (solo fuera del arcade)
    pulseBeatDom(visualState.beat);
    if (!_heroVisible) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawActiveBackground(visualState.beat, dt, ts / 1000);
    drawWeatherOverlay(visualState.beat, dt, ts / 1000);
}

startHeroRenderer();

export function startHeroRenderer() {
    requestAnimationFrame(animateParticles);
}
