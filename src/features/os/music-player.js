// reproductor de música estilo Windows XP/Winamp con ecualizador vía Web Audio API
import { TRACKS } from '../../data/tracks.js';

const EQ_BANDS = 14; // número de barras del ecualizador
const EQ_FREQS = [60, 100, 170, 280, 460, 750, 1200, 2000, 3400, 5500, 9000, 14000, 18000, 20000];
const DECAY_RATE = 0.88;
const TRACK_TICKER_SPEED = 34;

let _raf = null;
let _wrap = null;
let _canvas = null;
let _resizeObserver = null;
let _trackEl = null;
let _tickerRaf = null;
let _tickerLastTs = 0;
let _tickerOffset = 0;
let _tickerTextWidth = 0;
let _peaks = new Float32Array(EQ_BANDS).fill(0);
let _bars = new Float32Array(EQ_BANDS).fill(0);

export function buildPlayerContent(wrap) {
    _wrap = wrap;
    _wrap.classList.add('os-player-wrap');

    const idx = window._currentIdx ?? 0;
    const track = TRACKS[idx] ?? TRACKS[0];

    wrap.innerHTML = `
        <div class="os-player">
            <div class="os-player-screen">
                <div class="os-player-screen-header">
                    <span class="os-player-brand">DANIELUX PLAYER</span>
                    <span class="os-player-ver">v1.0</span>
                </div>
                <div class="os-player-track" id="osPlayerTrack">
                    <span class="os-player-track-scroll" data-title="${_escapeAttr(track.title)}">${_escapeHtml(track.title)}</span>
                </div>
                <div class="os-player-times">
                    <span class="os-player-elapsed" id="osPlayerElapsed">0:00</span>
                    <div class="os-player-progress-bar os-player-progress-bar--seekable" id="osPlayerProgress" tabindex="0" role="slider" aria-label="Progreso de reproducción" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                        <div class="os-player-progress-fill" id="osPlayerFill" style="width:0%"></div>
                        <div class="os-player-progress-thumb" id="osPlayerThumb"></div>
                    </div>
                    <span class="os-player-total" id="osPlayerTotal">-:--</span>
                </div>
            </div>

            <canvas class="os-player-eq" id="osPlayerEq" height="72"></canvas>

            <div class="os-player-controls">
                <button class="os-player-btn" id="osPlayerPrev" title="Anterior"><i class="fa-solid fa-backward-step"></i></button>
                <button class="os-player-btn os-player-btn--play" id="osPlayerPlay" title="Play/Pausa">
                    <i class="fa-solid fa-play" id="osPlayerPlayIco"></i>
                </button>
                <button class="os-player-btn" id="osPlayerNext" title="Siguiente"><i class="fa-solid fa-forward-step"></i></button>
                <input class="os-player-vol" id="osPlayerVol" type="range" min="0" max="1" step="0.01" value="0.8" title="Volumen">
                <i class="fa-solid fa-volume-high os-player-vol-ico"></i>
            </div>

            <div class="os-player-playlist" id="osPlayerPlaylist"></div>
        </div>
    `;

    _canvas = wrap.querySelector('#osPlayerEq');
    _trackEl = wrap.querySelector('#osPlayerTrack');
    _buildPlaylist(wrap);
    _bindControls(wrap);
    _syncState(wrap);
    _startEq(wrap);
    requestAnimationFrame(() => _updateTickerMetrics(true));
    window.setTimeout(() => _updateTickerMetrics(true), 120);
}

export function destroyPlayerContent() {
    cancelAnimationFrame(_raf);
    cancelAnimationFrame(_tickerRaf);
    _resizeObserver?.disconnect();
    _raf = null;
    _tickerRaf = null;
    _resizeObserver = null;
    _wrap = null;
    _canvas = null;
    _trackEl = null;
    _tickerLastTs = 0;
    _tickerOffset = 0;
    _tickerTextWidth = 0;
    _peaks.fill(0);
    _bars.fill(0);
}

function _buildPlaylist(wrap) {
    const list = wrap.querySelector('#osPlayerPlaylist');
    const curr = window._currentIdx ?? 0;
    if (!list) return;

    list.innerHTML = '';
    TRACKS.forEach((t, i) => {
        const row = document.createElement('div');
        row.className = 'os-player-track-row' + (i === curr ? ' os-player-track-row--active' : '');
        row.dataset.idx = i;
        row.innerHTML = `<span class="os-player-track-num">${String(i + 1).padStart(2, '0')}</span><span>${_escapeHtml(t.title)}</span>`;
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

function _bindControls(wrap) {
    const audio = _getAudio();
    const progressBar = wrap.querySelector('#osPlayerProgress');

    wrap.querySelector('#osPlayerPlay')?.addEventListener('click', () => {
        window._ensureAudioCtx?.();
        if (audio) {
            audio.paused ? audio.play() : audio.pause();
        }
        setTimeout(() => _syncState(wrap), 50);
    });

    wrap.querySelector('#osPlayerPrev')?.addEventListener('click', () => {
        const btn = document.querySelector('#playerPrev, [data-action="prev"], .player-prev');
        btn ? btn.click() : window._playerLoadTrack?.((window._currentIdx - 1 + TRACKS.length) % TRACKS.length, true);
        setTimeout(() => _syncState(wrap), 100);
    });

    wrap.querySelector('#osPlayerNext')?.addEventListener('click', () => {
        const btn = document.querySelector('#playerNext, [data-action="next"], .player-next');
        btn ? btn.click() : window._playerLoadTrack?.((window._currentIdx + 1) % TRACKS.length, true);
        setTimeout(() => _syncState(wrap), 100);
    });

    const volSlider = wrap.querySelector('#osPlayerVol');
    if (volSlider && audio) {
        volSlider.value = String(audio.volume);
        volSlider.addEventListener('input', () => {
            audio.volume = Number(volSlider.value);
            window._setAudioVolume?.(Number(volSlider.value));
        });
    }

    if (progressBar && audio) {
        const seekFromEvent = (event) => {
            if (!audio.duration) return;
            const rect = progressBar.getBoundingClientRect();
            if (rect.width <= 0) return;
            const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
            audio.currentTime = ratio * audio.duration;
            _syncState(wrap);
        };

        progressBar.addEventListener('pointerdown', event => {
            seekFromEvent(event);
            progressBar.setPointerCapture?.(event.pointerId);
        });

        progressBar.addEventListener('pointermove', event => {
            if (!(event.buttons & 1)) return;
            seekFromEvent(event);
        });

        progressBar.addEventListener('keydown', event => {
            if (!audio.duration) return;
            const step = Math.max(1, audio.duration * 0.02);
            if (event.key === 'ArrowLeft') {
                audio.currentTime = Math.max(0, audio.currentTime - step);
                event.preventDefault();
            } else if (event.key === 'ArrowRight') {
                audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
                event.preventDefault();
            } else {
                return;
            }
            _syncState(wrap);
        });
    }

    const interval = setInterval(() => {
        if (!wrap.isConnected) {
            clearInterval(interval);
            return;
        }
        _syncState(wrap);
    }, 250);
}

function _syncState(wrap) {
    const audio = _getAudio();
    if (!audio) return;

    const icon = wrap.querySelector('#osPlayerPlayIco');
    if (icon) icon.className = audio.paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';

    const idx = window._currentIdx ?? 0;
    const title = TRACKS[idx]?.title ?? '';
    _renderTrackTitle(title);

    const fill = wrap.querySelector('#osPlayerFill');
    const thumb = wrap.querySelector('#osPlayerThumb');
    const progressBar = wrap.querySelector('#osPlayerProgress');
    const elapsed = wrap.querySelector('#osPlayerElapsed');
    const total = wrap.querySelector('#osPlayerTotal');

    if (audio.duration > 0) {
        const pct = (audio.currentTime / audio.duration) * 100;
        if (fill) fill.style.width = `${pct}%`;
        if (thumb) thumb.style.left = `${pct}%`;
        if (elapsed) elapsed.textContent = _fmt(audio.currentTime);
        if (total) total.textContent = _fmt(audio.duration);
        if (progressBar) progressBar.setAttribute('aria-valuenow', String(Math.round(pct)));
    } else {
        if (fill) fill.style.width = '0%';
        if (thumb) thumb.style.left = '0%';
        if (elapsed) elapsed.textContent = '0:00';
        if (total) total.textContent = '-:--';
        if (progressBar) progressBar.setAttribute('aria-valuenow', '0');
    }

    wrap.querySelectorAll('.os-player-track-row').forEach(row => {
        row.classList.toggle('os-player-track-row--active', Number(row.dataset.idx) === idx);
    });
}

function _renderTrackTitle(title) {
    if (!_trackEl) return;

    const span = _trackEl.querySelector('.os-player-track-scroll');
    if (!span || span.dataset.title !== title) {
        _trackEl.innerHTML = `<span class="os-player-track-scroll" data-title="${_escapeAttr(title)}">${_escapeHtml(title)}</span>`;
        _restartTicker();
        return;
    }

    _updateTickerMetrics(false);
}

function _restartTicker() {
    cancelAnimationFrame(_tickerRaf);
    _tickerRaf = null;
    _tickerLastTs = 0;
    _tickerOffset = 0;
    _tickerTextWidth = 0;
    _updateTickerMetrics(true);
}

function _updateTickerMetrics(resetPosition = false) {
    if (!_trackEl) return;
    const span = _trackEl.querySelector('.os-player-track-scroll');
    if (!span) return;

    const containerWidth = _trackEl.clientWidth;
    const textWidth = Math.max(1, Math.ceil(span.getBoundingClientRect().width));
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
        cancelAnimationFrame(_tickerRaf);
        _tickerRaf = null;
        _tickerLastTs = 0;
        span.style.transform = 'translate3d(0,0,0)';
        return;
    }

    _tickerTextWidth = textWidth;
    if (resetPosition) {
        _tickerOffset = 0;
        span.style.transform = `translate3d(${_tickerOffset}px,0,0)`;
    }

    if (_tickerRaf) return;

    const tick = (ts) => {
        if (!_trackEl?.isConnected) {
            cancelAnimationFrame(_tickerRaf);
            _tickerRaf = null;
            _tickerLastTs = 0;
            return;
        }

        const liveSpan = _trackEl.querySelector('.os-player-track-scroll');
        if (!liveSpan) {
            _tickerRaf = requestAnimationFrame(tick);
            return;
        }

        const liveContainerWidth = _trackEl.clientWidth;
        const liveTextWidth = Math.max(1, Math.ceil(liveSpan.getBoundingClientRect().width));

        if (!_tickerLastTs) _tickerLastTs = ts;
        const dt = (ts - _tickerLastTs) / 1000;
        _tickerLastTs = ts;

        _tickerTextWidth = liveTextWidth;
        _tickerOffset -= TRACK_TICKER_SPEED * dt;
        if (_tickerOffset <= -_tickerTextWidth) {
            _tickerOffset = liveContainerWidth;
        }

        liveSpan.style.transform = `translate3d(${_tickerOffset}px,0,0)`;
        _tickerRaf = requestAnimationFrame(tick);
    };

    _tickerRaf = requestAnimationFrame(tick);
}

function _startEq(wrap) {
    if (!_canvas) return;

    _resizeObserver = new ResizeObserver(entries => {
        for (const e of entries) {
            if (e.target === _canvas) {
                const w = Math.round(e.contentRect.width);
                if (w > 0 && _canvas) _canvas.width = w;
            } else {
                _updateTickerMetrics(true);
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
    const W = canvas.width;
    const H = canvas.height || 80;
    if (W < 4) return;

    const analyser = window._audioAnalyser;
    const audio = _getAudio();

    if (analyser && audio && !audio.paused) {
        const buf = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buf);
        const binHz = analyser.context.sampleRate / analyser.fftSize;
        EQ_FREQS.forEach((freq, i) => {
            const bin = Math.round(freq / binHz);
            const val = buf[Math.min(bin, buf.length - 1)] / 255;
            _bars[i] = Math.max(val, _bars[i] * DECAY_RATE);
            _peaks[i] = Math.max(_bars[i], _peaks[i] - 0.007);
        });
    } else {
        const t = ts / 1000;
        EQ_FREQS.forEach((_, i) => {
            const base = 0.22 - i * 0.008;
            const wave = 0.28 * Math.abs(Math.sin(t * (0.6 + i * 0.14) + i * 0.8));
            const idle = Math.min(0.55, base + wave);
            _bars[i] = _bars[i] * 0.88 + idle * 0.12;
            _peaks[i] = Math.max(_bars[i], _peaks[i] - 0.004);
        });
    }

    const _raw = window._accent1Rgb;
    const [r, g, b] = Array.isArray(_raw) ? _raw
        : typeof _raw === 'string' ? _raw.trim().split(/[\s,]+/).map(Number)
        : [0, 180, 255];
    const r2 = Math.min(r + 80, 255);
    const g2 = Math.min(g + 80, 255);
    const b2 = Math.min(b + 100, 255);
    const barW = Math.max(2, Math.floor((W - 2) / EQ_BANDS) - 2);
    const gap = Math.floor((W - barW * EQ_BANDS) / (EQ_BANDS + 1));

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(4,7,18,0.6)';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < EQ_BANDS; i++) {
        const x = gap + i * (barW + gap);
        const barH = Math.max(3, _bars[i] * (H - 8));
        const pkH = Math.max(3, _peaks[i] * (H - 8));
        const y = H - barH;

        const grad = ctx.createLinearGradient(0, H, 0, 0);
        grad.addColorStop(0, `rgba(${r},${g},${b},1.0)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},0.9)`);
        grad.addColorStop(1, `rgba(${r2},${g2},${b2},0.75)`);
        ctx.fillStyle = grad;

        const segH = 3;
        const segGap = 1;
        const segTotal = segH + segGap;
        for (let sy = H - segTotal; sy >= y; sy -= segTotal) {
            ctx.fillRect(x, sy, barW, segH);
        }

        ctx.fillStyle = `rgba(${r2},${g2},${b2},1.0)`;
        ctx.fillRect(x, H - pkH - 2, barW, 2);
    }
}

function _getAudio() {
    return document.querySelector('audio') ?? null;
}

function _fmt(s) {
    if (!isFinite(s)) return '-:--';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
}

function _escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function _escapeAttr(value) {
    return _escapeHtml(value);
}
