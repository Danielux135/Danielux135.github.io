// reproductor de música estilo Windows XP/Winamp con ecualizador vía Web Audio API
import { TRACKS } from '../../data/tracks.js';

const EQ_BANDS   = 14;  // número de barras del ecualizador
const EQ_FREQS   = [60, 100, 170, 280, 460, 750, 1200, 2000, 3400, 5500, 9000, 14000, 18000, 20000];
const DECAY_RATE = 0.88;

let _raf            = null;
let _wrap           = null;
let _canvas         = null;
let _resizeObserver = null;
let _trackEl        = null;
let _peaks  = new Float32Array(EQ_BANDS).fill(0);
let _bars   = new Float32Array(EQ_BANDS).fill(0);

export function buildPlayerContent(wrap) {
    _wrap = wrap;
    _wrap.classList.add('os-player-wrap');

    const idx   = window._currentIdx ?? 0;
    const track = TRACKS[idx] ?? TRACKS[0];

    wrap.innerHTML = `
        <div class="os-player">
            <!-- pantalla LED -->
            <div class="os-player-screen">
                <div class="os-player-screen-header">
                    <span class="os-player-brand">DANIELUX PLAYER</span>
                    <span class="os-player-ver">v1.0</span>
                </div>
                <div class="os-player-track" id="osPlayerTrack"><span class="os-player-track-scroll">${track.title} &nbsp;&nbsp;&bull;&nbsp;&nbsp; ${track.title} &nbsp;&nbsp;&bull;&nbsp;&nbsp;</span></div>
                <div class="os-player-times">
                    <span class="os-player-elapsed" id="osPlayerElapsed">0:00</span>
                    <div class="os-player-progress-bar">
                        <div class="os-player-progress-fill" id="osPlayerFill" style="width:0%"></div>
                    </div>
                    <span class="os-player-total"   id="osPlayerTotal">-:--</span>
                </div>
            </div>

            <!-- ecualizador canvas -->
            <canvas class="os-player-eq" id="osPlayerEq" height="72"></canvas>

            <!-- controles -->
            <div class="os-player-controls">
                <button class="os-player-btn" id="osPlayerPrev" title="Anterior"><i class="fa-solid fa-backward-step"></i></button>
                <button class="os-player-btn os-player-btn--play" id="osPlayerPlay" title="Play/Pausa">
                    <i class="fa-solid fa-play" id="osPlayerPlayIco"></i>
                </button>
                <button class="os-player-btn" id="osPlayerNext" title="Siguiente"><i class="fa-solid fa-forward-step"></i></button>
                <input  class="os-player-vol"  id="osPlayerVol" type="range" min="0" max="1" step="0.01" value="0.8" title="Volumen">
                <i class="fa-solid fa-volume-high os-player-vol-ico"></i>
            </div>

            <!-- lista de pistas -->
            <div class="os-player-playlist" id="osPlayerPlaylist"></div>
        </div>
    `;

    _canvas  = wrap.querySelector('#osPlayerEq');
    _trackEl = wrap.querySelector('#osPlayerTrack');
    _buildPlaylist(wrap);
    _bindControls(wrap);
    _syncState(wrap);
    _startEq(wrap);
}

export function destroyPlayerContent() {
    cancelAnimationFrame(_raf);
    _resizeObserver?.disconnect();
    _raf = null;
    _resizeObserver = null;
    _wrap = null;
    _canvas = null;
    _trackEl = null;
    _peaks.fill(0);
    _bars.fill(0);
}

// ─── marquee: activa la animación solo cuando el texto desborda ───────────────
function _updateMarquee() {
    if (!_trackEl) return;
    const span = _trackEl.querySelector('.os-player-track-scroll');
    if (!span) return;
    // el span tiene el texto duplicado; cada copia = offsetWidth/2
    const overflows = span.offsetWidth / 2 > _trackEl.clientWidth;
    span.classList.toggle('os-player-track-scroll--animating', overflows);
}

// ─── lista de pistas ──────────────────────────────────────────────────────────
function _buildPlaylist(wrap) {
    const list = wrap.querySelector('#osPlayerPlaylist');
    const curr = window._currentIdx ?? 0;
    TRACKS.forEach((t, i) => {
        const row = document.createElement('div');
        row.className = 'os-player-track-row' + (i === curr ? ' os-player-track-row--active' : '');
        row.dataset.idx = i;
        row.innerHTML = `<span class="os-player-track-num">${String(i + 1).padStart(2, '0')}</span><span>${t.title}</span>`;
        row.addEventListener('click', () => {
            if (window._playerLoadTrack) {
                window._ensureAudioCtx?.();
                window._playerLoadTrack(i, true);
                _syncState(wrap);
            }
        });
        list.appendChild(row);
    });
}

// ─── controles ───────────────────────────────────────────────────────────────
function _bindControls(wrap) {
    const audio = _getAudio();

    wrap.querySelector('#osPlayerPlay')?.addEventListener('click', () => {
        window._ensureAudioCtx?.();
        if (audio) { audio.paused ? audio.play() : audio.pause(); }
        setTimeout(() => _syncState(wrap), 50);
    });

    wrap.querySelector('#osPlayerPrev')?.addEventListener('click', () => {
        const btn = document.querySelector('#playerPrev, [data-action="prev"], .player-prev');
        btn ? btn.click() : (window._playerLoadTrack?.((window._currentIdx - 1 + TRACKS.length) % TRACKS.length, true));
        setTimeout(() => _syncState(wrap), 100);
    });

    wrap.querySelector('#osPlayerNext')?.addEventListener('click', () => {
        const btn = document.querySelector('#playerNext, [data-action="next"], .player-next');
        btn ? btn.click() : (window._playerLoadTrack?.((window._currentIdx + 1) % TRACKS.length, true));
        setTimeout(() => _syncState(wrap), 100);
    });

    const volSlider = wrap.querySelector('#osPlayerVol');
    if (volSlider && audio) {
        volSlider.value = audio.volume;
        volSlider.addEventListener('input', () => {
            if (audio) audio.volume = volSlider.value;
            window._setAudioVolume?.(Number(volSlider.value));
        });
    }

    // sincroniza estado periódicamente mientras la ventana está abierta
    const interval = setInterval(() => {
        if (!wrap.isConnected) { clearInterval(interval); return; }
        _syncState(wrap);
    }, 500);
}

function _syncState(wrap) {
    const audio = _getAudio();
    if (!audio) return;

    const icon = wrap.querySelector('#osPlayerPlayIco');
    if (icon) icon.className = audio.paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';

    const trackEl = wrap.querySelector('#osPlayerTrack');
    const idx     = window._currentIdx ?? 0;
    if (trackEl) {
        const t = TRACKS[idx]?.title ?? '';
        const span = trackEl.querySelector('.os-player-track-scroll');
        // solo reescribe si cambió la pista para no reiniciar la animación CSS
        if (!span || span.dataset.title !== t) {
            trackEl.innerHTML = `<span class="os-player-track-scroll" data-title="${t}">${t} &nbsp;&nbsp;&bull;&nbsp;&nbsp; ${t} &nbsp;&nbsp;&bull;&nbsp;&nbsp;</span>`;
        }
        _updateMarquee();
    }

    const fill    = wrap.querySelector('#osPlayerFill');
    const elapsed = wrap.querySelector('#osPlayerElapsed');
    const total   = wrap.querySelector('#osPlayerTotal');
    if (audio.duration > 0) {
        const pct = (audio.currentTime / audio.duration) * 100;
        if (fill)    fill.style.width   = `${pct}%`;
        if (elapsed) elapsed.textContent = _fmt(audio.currentTime);
        if (total)   total.textContent   = _fmt(audio.duration);
    }

    // resalta pista activa en la lista
    wrap.querySelectorAll('.os-player-track-row').forEach(row => {
        row.classList.toggle('os-player-track-row--active', Number(row.dataset.idx) === idx);
    });
}

// ─── ecualizador en canvas ────────────────────────────────────────────────────
function _startEq(wrap) {
    if (!_canvas) return;

    // ResizeObserver: actualiza canvas y recalcula el marquee al redimensionar
    _resizeObserver = new ResizeObserver(entries => {
        for (const e of entries) {
            if (e.target === _canvas) {
                const w = Math.round(e.contentRect.width);
                if (w > 0 && _canvas) _canvas.width = w;
            } else {
                _updateMarquee();
            }
        }
    });
    _resizeObserver.observe(_canvas);
    if (_trackEl) _resizeObserver.observe(_trackEl);

    const draw = (ts) => {
        if (!_canvas || !wrap.isConnected) {
            cancelAnimationFrame(_raf);
            _resizeObserver?.disconnect();
            return;
        }
        _raf = requestAnimationFrame(draw);
        _drawEq(ts);
    };
    _raf = requestAnimationFrame(draw);
}

function _drawEq(ts) {
    const canvas = _canvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W   = canvas.width;
    const H   = canvas.height || 80;
    if (W < 4) return;

    const analyser = window._audioAnalyser;
    const audio    = _getAudio();

    if (analyser && audio && !audio.paused) {
        // datos reales del Web Audio API
        const buf = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buf);
        const binHz = analyser.context.sampleRate / analyser.fftSize;
        EQ_FREQS.forEach((freq, i) => {
            const bin = Math.round(freq / binHz);
            const val = buf[Math.min(bin, buf.length - 1)] / 255;
            _bars[i]  = Math.max(val, _bars[i] * DECAY_RATE);
            _peaks[i] = Math.max(_bars[i], _peaks[i] - 0.007);
        });
    } else {
        // idle: ola suave y visible (20–55% de altura)
        const t = ts / 1000;
        EQ_FREQS.forEach((_, i) => {
            // bajos más altos que agudos en reposo
            const base = 0.22 - i * 0.008;
            const wave = 0.28 * Math.abs(Math.sin(t * (0.6 + i * 0.14) + i * 0.8));
            const idle = Math.min(0.55, base + wave);
            _bars[i]   = _bars[i] * 0.88 + idle * 0.12;
            _peaks[i]  = Math.max(_bars[i], _peaks[i] - 0.004);
        });
    }

    const _raw = window._accent1Rgb;
    const [r, g, b] = Array.isArray(_raw) ? _raw
        : typeof _raw === 'string' ? _raw.trim().split(/[\s,]+/).map(Number)
        : [0, 180, 255];
    const r2 = Math.min(r + 80, 255), g2 = Math.min(g + 80, 255), b2 = Math.min(b + 100, 255);
    const barW = Math.max(2, Math.floor((W - 2) / EQ_BANDS) - 2);
    const gap  = Math.floor((W - barW * EQ_BANDS) / (EQ_BANDS + 1));

    ctx.clearRect(0, 0, W, H);

    // fondo oscuro de la zona eq
    ctx.fillStyle = 'rgba(4,7,18,0.6)';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < EQ_BANDS; i++) {
        const x    = gap + i * (barW + gap);
        const barH = Math.max(3, _bars[i]  * (H - 8));
        const pkH  = Math.max(3, _peaks[i] * (H - 8));
        const y    = H - barH;

        // degradado de abajo (brillante) a arriba (claro/blanco-acento)
        const grad = ctx.createLinearGradient(0, H, 0, 0);
        grad.addColorStop(0,   `rgba(${r},${g},${b},1.0)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},0.9)`);
        grad.addColorStop(1,   `rgba(${r2},${g2},${b2},0.75)`);
        ctx.fillStyle = grad;

        // segmentos LED
        const segH = 3, segGap = 1, segTotal = segH + segGap;
        for (let sy = H - segTotal; sy >= y; sy -= segTotal) {
            ctx.fillRect(x, sy, barW, segH);
        }

        // línea de pico
        ctx.fillStyle = `rgba(${r2},${g2},${b2},1.0)`;
        ctx.fillRect(x, H - pkH - 2, barW, 2);
    }
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function _getAudio() {
    return document.querySelector('audio') ?? null;
}

function _fmt(s) {
    if (!isFinite(s)) return '-:--';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
}
