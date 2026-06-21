import { scrollToSectionElement } from './section-navigation.js';
import { TRACKS } from '../data/tracks.js';
import { getTranslation } from './site-ui.js';

// API pública exportada: se asigna desde los IIFEs internos
export const playerApi = {
    loadTrack: () => {},
    ensureAudioCtx: () => {},
    setAudioVolume: () => {},
};

const TRACK_COVERS = new Map();
fetch('assets/covers/covers-manifest.json')
    .then(r => r.ok ? r.json() : [])
    .then(items => {
        items.forEach(item => TRACK_COVERS.set(item.Title, {
            cover: item.Cover,
            original: item.Original,
        }));
        document.dispatchEvent(new Event('coversloaded'));
    })
    .catch(() => {});
function getTrackCover(track) {
    return TRACK_COVERS.get(track?.title) || null;
}
// inicializa el reproductor de música: controles, lista, barra de progreso y compartir
(function initPlayer() {
    const audio      = document.getElementById('audioEl');
    const trackList  = document.getElementById('trackList');
    const playBtn    = document.getElementById('playBtn');
    const playIcon   = document.getElementById('playIcon');
    const prevBtn    = document.getElementById('prevBtn');
    const nextBtn    = document.getElementById('nextBtn');
    const seekBar    = document.getElementById('seekBar');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl   = document.getElementById('totalTime');
    const volBar     = document.getElementById('volBar');
    const muteBtn    = document.getElementById('muteBtn');
    const titleEl    = document.getElementById('playerTrackTitle');
    const playerCoverCard = document.getElementById('playerCoverCard');
    const playerCoverImg  = document.getElementById('playerCoverImg');
    const playerCoverDownload = document.getElementById('playerCoverDownload');
    if (!audio || !trackList) return;
    let currentIdx = 0;
    audio.volume = 0.8;
    volBar.style.setProperty('--vol', volBar.value + '%');
    // devuelve la clase del icono de volumen según el nivel
    function volIconCls(v) {
        return v < 0.01 ? 'fa-solid fa-volume-xmark' : v < 0.5 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
    }
    // formatea segundos como m:ss
    function fmt(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }
    let trackFilter = '';
    // renderiza la lista de canciones filtrada por el texto de búsqueda
    function renderTracks() {
        trackList.innerHTML = '';
        const q = trackFilter.toLowerCase();
        const visible = TRACKS.map((t, i) => ({ t, i })).filter(({ t }) => t.title.toLowerCase().includes(q));
        if (visible.length === 0) {
            trackList.innerHTML = `<div class="tracklist-no-results">${getTranslation('player.noResults')}</div>`;
            return;
        }
        visible.forEach(({ t, i }) => {
            const div = document.createElement('div');
            div.className = 'track-item' + (i === currentIdx ? ' active' : '');
            div.dataset.idx = i;
            const titleHtml = q
                ? t.title.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>')
                : t.title;
            div.innerHTML = `
                <span class="track-num">${i + 1}</span>
                <i class="fa-solid fa-music track-playing-icon"></i>
                <div class="track-info">
                    <span class="track-title">${titleHtml}</span>
                </div>`;
            div.addEventListener('click', () => { if (window._ensureAudioCtx) window._ensureAudioCtx(); loadTrack(i, true); });
            trackList.appendChild(div);
        });
    }
    // carga la canción del índice dado y la reproduce si autoplay es true
    function loadTrack(idx, autoplay = false) {
        currentIdx = idx;
        window._currentIdx = idx;
        document.dispatchEvent(new Event('trackchanged'));
        const t = TRACKS[idx];
        audio.src = `assets/music/${t.file}`;
        titleEl.textContent = t.title;
        seekBar.value = 0;
        seekBar.style.setProperty('--seek', '0%');
        currentTimeEl.textContent = '0:00';
        totalTimeEl.textContent = '0:00';
        renderTracks();
        updateTrackCoverUI(t);
        updateMediaSession(t);
        if (autoplay) {
            audio.play().then(() => {
                playIcon.className = 'fa-solid fa-pause';
            }).catch(() => {});
        } else {
            playIcon.className = 'fa-solid fa-play';
        }
    }
    // actualiza los metadatos que ve android en la pantalla de bloqueo
    function updateMediaSession(t) {
        if (!('mediaSession' in navigator)) return;
        const cover = getTrackCover(t);
        const artwork = cover
            ? [{ src: cover.cover, sizes: '1200x668', type: 'image/webp' }]
            : [{ src: 'assets/borrowed-colors.webp', sizes: '600x600', type: 'image/webp' }];
        navigator.mediaSession.metadata = new MediaMetadata({
            title: t.title,
            artist: 'Danielux',
            album: 'Danielux',
            artwork,
        });
    }
    function setDownloadLink(link, cover, title) {
        if (!link) return;
        if (cover?.original) {
            link.href = cover.original;
            const baseName = title || getTranslation('player.coverFile');
            link.download = `${baseName}.original${cover.original.slice(cover.original.lastIndexOf('.'))}`;
            link.hidden = false;
            link.classList.remove('disabled');
        } else {
            link.removeAttribute('href');
            link.hidden = true;
            link.classList.add('disabled');
        }
    }
    function updateTrackCoverUI(t) {
        const cover = getTrackCover(t);
        if (cover?.cover) {
            if (playerCoverImg) {
                playerCoverImg.src = cover.cover;
                playerCoverImg.alt = `${getTranslation('player.coverAltTrack')} ${t.title}`;
            }
            if (playerCoverCard) playerCoverCard.hidden = false;
        } else {
            if (playerCoverImg) {
                playerCoverImg.removeAttribute('src');
                playerCoverImg.alt = '';
            }
            if (playerCoverCard) playerCoverCard.hidden = true;
        }
        setDownloadLink(playerCoverDownload, cover, t.title);
        document.dispatchEvent(new CustomEvent('trackcoverchange', { detail: { track: t, cover } }));
    }
    document.addEventListener('coversloaded', () => {
        const t = TRACKS[currentIdx];
        if (!t) return;
        updateTrackCoverUI(t);
        updateMediaSession(t);
    });
    // registra los controles de siguiente/anterior/play/pausa para la pantalla de bloqueo
    function setupMediaSession() {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.setActionHandler('play', () => {
            if (window._ensureAudioCtx) window._ensureAudioCtx();
            audio.play().catch(() => {});
        });
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            loadTrack((currentIdx - 1 + TRACKS.length) % TRACKS.length, true);
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            loadTrack((currentIdx + 1) % TRACKS.length, true);
        });
    }
    setupMediaSession();
    audio.addEventListener('play',  () => { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; });
    audio.addEventListener('pause', () => { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; });
    playBtn.addEventListener('click', () => {
        if (window._ensureAudioCtx) window._ensureAudioCtx();
        if (audio.paused) {
            if (!audio.src || audio.src === window.location.href) loadTrack(currentIdx, true);
            else audio.play().then(() => { playIcon.className = 'fa-solid fa-pause'; }).catch(() => {});
        } else {
            audio.pause();
            playIcon.className = 'fa-solid fa-play';
        }
    });
    prevBtn.addEventListener('click', () => {
        if (window._ensureAudioCtx) window._ensureAudioCtx();
        loadTrack((currentIdx - 1 + TRACKS.length) % TRACKS.length, !audio.paused);
    });
    nextBtn.addEventListener('click', () => {
        if (window._ensureAudioCtx) window._ensureAudioCtx();
        loadTrack((currentIdx + 1) % TRACKS.length, !audio.paused);
    });
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            const idx = Math.floor(Math.random() * TRACKS.length);
            loadTrack(idx, true);
            scrollToSectionElement(document.getElementById('musicPlayer'));
        });
    }
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        seekBar.value = (audio.currentTime / audio.duration) * 100;
        seekBar.style.setProperty('--seek', seekBar.value + '%');
        currentTimeEl.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = fmt(audio.duration);
    });
    audio.addEventListener('ended', () => {
        loadTrack((currentIdx + 1) % TRACKS.length, true);
    });
    seekBar.addEventListener('input', () => {
        seekBar.style.setProperty('--seek', seekBar.value + '%');
        if (audio.duration) audio.currentTime = (seekBar.value / 100) * audio.duration;
    });
    // sincroniza todos los controles de volumen de la UI al nivel actual del audio
    function syncAllVolumeUI() {
        const v = audio.muted ? 0 : audio.volume;
        const pct = Math.round(audio.volume * 100);
        const fill = (audio.muted ? 0 : pct) + '%';
        volBar.value = pct;
        volBar.style.setProperty('--vol', fill);
        muteBtn.querySelector('i').className = volIconCls(v);
        const npbVol = document.getElementById('npbVol');
        if (npbVol) { npbVol.value = pct; npbVol.style.setProperty('--vol', fill); }
        const npbVolIcon = document.getElementById('npbVolIcon');
        if (npbVolIcon) npbVolIcon.className = volIconCls(v) + ' npb-vol-icon';
        const stageVol = document.getElementById('stageVol');
        if (stageVol) { stageVol.value = pct; stageVol.style.setProperty('--vol', fill); }
        const stageVolIcon = document.getElementById('stageVolIcon');
        if (stageVolIcon) stageVolIcon.className = volIconCls(v);
    }
    volBar.addEventListener('input', () => {
        audio.volume = volBar.value / 100;
        audio.muted = false;
        if (window._setAudioVolume) window._setAudioVolume(audio.volume);
        syncAllVolumeUI();
    });
    muteBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        if (window._setAudioVolume) window._setAudioVolume(audio.muted ? 0 : audio.volume);
        volBar.style.setProperty('--vol', audio.muted ? '0%' : volBar.value + '%');
        muteBtn.querySelector('i').className = audio.muted ? 'fa-solid fa-volume-xmark' : volIconCls(audio.volume);
    });
    const searchInput = document.getElementById('trackSearch');
    const searchClear = document.getElementById('trackSearchClear');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            trackFilter = searchInput.value;
            searchClear.hidden = !trackFilter;
            renderTracks();
        });
        searchClear.addEventListener('click', () => {
            trackFilter = '';
            searchInput.value = '';
            searchClear.hidden = true;
            searchInput.focus();
            renderTracks();
        });
    }
    const shareBtn = document.getElementById('shareBtn');
    const shareToast = document.getElementById('shareToast');
    let shareToastTimer;
    // muestra un toast de confirmación al compartir un enlace
    function showShareToast(msg) {
        clearTimeout(shareToastTimer);
        shareToast.textContent = msg;
        shareToast.classList.add('show');
        shareToastTimer = setTimeout(() => shareToast.classList.remove('show'), 2200);
    }
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const t = TRACKS[currentIdx];
            const url = `${location.origin}${location.pathname}?track=${encodeURIComponent(t.title)}`;
            navigator.clipboard.writeText(url).then(() => {
                shareBtn.classList.add('copied');
                showShareToast(getTranslation('player.linkCopied'));
                setTimeout(() => shareBtn.classList.remove('copied'), 1800);
            }).catch(() => showShareToast(getTranslation('player.linkError')));
        });
    }
    // si viene el parámetro ?track= en la url, carga esa canción directamente
    const paramTrack = new URLSearchParams(location.search).get('track');
    const startIdx = paramTrack
        ? TRACKS.findIndex(t => t.title.toLowerCase() === paramTrack.toLowerCase())
        : -1;
    playerApi.loadTrack = loadTrack;
    window._playerLoadTrack = loadTrack;
    renderTracks();
    loadTrack(startIdx >= 0 ? startIdx : 0, false);
    if (startIdx >= 0) {
        setTimeout(() => {
            const el = trackList.querySelector('.track-item.active');
            if (el) el.scrollIntoView({ block: 'nearest' });
        }, 200);
    }
    const sharedTrackArrival = startIdx >= 0;
    // inicializa el visualizador de frecuencias del reproductor
    (function initVisualizer() {
        const canvas = document.getElementById('visualizerCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let audioCtx, analyser, source, gainNode, animId;
        let connected = false;
        let vizData = null;
        let vizLevels = [];
        const eqBars = Array.from(document.querySelectorAll('#stageEqualizer span'));
        const eqLevels = eqBars.map(() => 0);
        function updateVisualVolumeFactor() {
            const v = audio.muted ? 0 : audio.volume;
            window._visualVolumeFactor = v <= 0 ? 0 : 0.38 + Math.sqrt(v) * 0.62;
        }
        updateVisualVolumeFactor();
        // crea el audiocontext y conecta la cadena source -> gain -> analyser -> destino
        // la cadena se crea una sola vez, pero el resume se intenta siempre (iOS suspende el contexto)
        function ensureAudioCtx() {
            if (!connected) {
                // 'playback' (no 'interactive'): para música no hace falta baja latencia y
                // así el hilo de audio se despierta menos (menos CPU).
                audioCtx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'playback' });
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.78;
                // nodo de ganancia: iOS ignora audio.volume en <audio>, el volumen va aquí
                gainNode = audioCtx.createGain();
                gainNode.gain.value = audio.muted ? 0 : audio.volume;
                source = audioCtx.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                connected = true;
                window._audioAnalyser = analyser;
            }
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        }
        playerApi.ensureAudioCtx = ensureAudioCtx;
        window._ensureAudioCtx = ensureAudioCtx;
        // aplica el volumen al nodo de ganancia (necesario en iOS donde audio.volume no tiene efecto)
        const _setAudioVolume = function (v) {
            if (gainNode) gainNode.gain.value = v;
            updateVisualVolumeFactor();
        };
        playerApi.setAudioVolume = _setAudioVolume;
        window._setAudioVolume = _setAudioVolume;
        function updateStageEqualizer(data, bufLen) {
            if (!eqBars.length) return;
            const stage = document.getElementById('stageMode');
            if (!stage?.classList.contains('open')) return;
            const maxBin = Math.max(2, Math.floor(bufLen * 0.82));
            for (let i = 0; i < eqBars.length; i++) {
                const from = Math.floor(Math.pow(i / eqBars.length, 1.55) * maxBin);
                const to = Math.max(from + 1, Math.floor(Math.pow((i + 1) / eqBars.length, 1.55) * maxBin));
                let sum = 0;
                let peak = 0;
                for (let b = from; b < to; b++) {
                    const v = data[b] || 0;
                    sum += v;
                    if (v > peak) peak = v;
                }
                const avg = sum / Math.max(1, to - from);
                const raw = Math.min(1, (avg * 0.72 + peak * 0.28) / 255);
                const boosted = Math.pow(raw, 0.72);
                eqLevels[i] = boosted > eqLevels[i]
                    ? boosted
                    : eqLevels[i] + (boosted - eqLevels[i]) * 0.28;
                eqBars[i].style.setProperty('--eq', eqLevels[i].toFixed(3));
            }
        }
        // dibuja un frame del visualizador de barras con gradiente reactivo al beat
        function draw() {
            animId = requestAnimationFrame(draw);
            // con el arcade abierto este canvas no se ve: se omite para no gastar cpu
            if (document.documentElement.classList.contains('arcade-lock')) return;
            const cw = canvas.parentElement.clientWidth;
            if (cw > 0 && canvas.width !== cw) canvas.width = cw;
            const W = canvas.width, H = canvas.height;
            const bufLen = analyser.frequencyBinCount;
            if (!vizData || vizData.length !== bufLen) vizData = new Uint8Array(bufLen);
            const data = vizData;
            analyser.getByteFrequencyData(data);
            updateStageEqualizer(data, bufLen);
            ctx.clearRect(0, 0, W, H);
            const pad = 8;
            const usedBins = Math.floor(bufLen * 0.75);
            const drawW = W - pad * 2;
            const step = drawW / usedBins;
            const barW = step * 0.75;
            if (vizLevels.length !== usedBins) vizLevels = Array.from({ length: usedBins }, () => 0);
            // colores de la paleta reactiva global, que viran de tono con el beat
            const rootStyle = document.documentElement.style;
            const a2 = (rootStyle.getPropertyValue('--accent-2-rgb') || '139 92 246').trim().replace(/\s+/g, ',');
            const a1 = (rootStyle.getPropertyValue('--accent-1-rgb') || '0 200 255').trim().replace(/\s+/g, ',');
            for (let i = 0; i < usedBins; i++) {
                const raw = Math.pow(data[i] / 255, 1.35) * 0.82;
                vizLevels[i] += (raw - vizLevels[i]) * (raw > vizLevels[i] ? 0.26 : 0.075);
                const pct = Math.max(0.035, vizLevels[i]);
                const barH = Math.max(pct * H, 3);
                const x = pad + i * step + (step - barW) / 2;
                const grad = ctx.createLinearGradient(0, H - barH, 0, H);
                grad.addColorStop(0, `rgba(${a2},${0.9 * pct + 0.1})`);
                grad.addColorStop(1, `rgba(${a1},${0.7 * pct + 0.1})`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(x, H - barH, barW, barH, 2) : ctx.rect(x, H - barH, barW, barH);
                ctx.fill();
            }
        }
        function startViz() {
            ensureAudioCtx();
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            if (!animId) draw();
        }
        function stopViz() {
            if (animId) { cancelAnimationFrame(animId); animId = null; }
        }
        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            const w = rect.width  || canvas.parentElement.offsetWidth;
            const h = rect.height || 64;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width  = w;
                canvas.height = h;
            }
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        new ResizeObserver(resizeCanvas).observe(canvas);
        audio.addEventListener('play',  startViz);
        audio.addEventListener('pause', stopViz);
        audio.addEventListener('ended', stopViz);
    })();
    // barra de reproducción en curso fija en la parte inferior
    (function initNowPlayingBar() {
        const bar      = document.getElementById('nowPlayingBar');
        const npbTitle = document.getElementById('npbTitle');
        const npbPlay  = document.getElementById('npbPlay');
        const npbPlayI = document.getElementById('npbPlayIcon');
        const npbPrev    = document.getElementById('npbPrev');
        const npbNext    = document.getElementById('npbNext');
        const npbSeek    = document.getElementById('npbSeek');
        const npbVol     = document.getElementById('npbVol');
        const npbVolIcon = document.getElementById('npbVolIcon');
        const npbClose   = document.getElementById('npbClose');
        const npbCover   = document.getElementById('npbCover');
        if (npbVol) { npbVol.value = Math.round(audio.volume * 100); npbVol.style.setProperty('--vol', npbVol.value + '%'); }
        const sectionNavEl = document.querySelector('.section-nav');
        if (!bar) return;
        function syncTitle() {
            npbTitle.textContent = TRACKS[currentIdx] ? TRACKS[currentIdx].title : '—';
        }
        function syncCover() {
            const t = TRACKS[currentIdx];
            const cover = getTrackCover(t);
            if (npbCover && cover?.cover) {
                npbCover.src = cover.cover;
                npbCover.hidden = false;
            } else if (npbCover) {
                npbCover.removeAttribute('src');
                npbCover.hidden = true;
            }
        }
        function syncPlayState() {
            npbPlayI.className = audio.paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
            bar.classList.toggle('playing', !audio.paused);
        }
        audio.addEventListener('play', () => {
            bar.classList.add('visible');
            document.body.classList.add('npb-visible');
            sectionNavEl?.classList.add('player-active');
            syncPlayState();
            syncTitle();
            syncCover();
        });
        document.addEventListener('trackcoverchange', syncCover);
        audio.addEventListener('pause', syncPlayState);
        audio.addEventListener('ended', syncPlayState);
        audio.addEventListener('timeupdate', () => {
            if (!audio.duration) return;
            npbSeek.value = (audio.currentTime / audio.duration) * 100;
            npbSeek.style.setProperty('--seek', npbSeek.value + '%');
        });
        npbSeek.addEventListener('input', () => {
            npbSeek.style.setProperty('--seek', npbSeek.value + '%');
            if (audio.duration) audio.currentTime = (npbSeek.value / 100) * audio.duration;
        });
        npbVol.addEventListener('input', () => {
            audio.volume = npbVol.value / 100;
            audio.muted = false;
            if (window._setAudioVolume) window._setAudioVolume(audio.volume);
            syncAllVolumeUI();
        });
        npbVolIcon.addEventListener('click', () => {
            audio.muted = !audio.muted;
            if (window._setAudioVolume) window._setAudioVolume(audio.muted ? 0 : audio.volume);
            syncAllVolumeUI();
        });
        npbPlay.addEventListener('click', () => {
            if (window._ensureAudioCtx) window._ensureAudioCtx();
            if (audio.paused) audio.play().catch(() => {});
            else audio.pause();
        });
        npbPrev.addEventListener('click', () => {
            if (window._ensureAudioCtx) window._ensureAudioCtx();
            loadTrack((currentIdx - 1 + TRACKS.length) % TRACKS.length, !audio.paused);
            syncTitle();
        });
        npbNext.addEventListener('click', () => {
            if (window._ensureAudioCtx) window._ensureAudioCtx();
            loadTrack((currentIdx + 1) % TRACKS.length, !audio.paused);
            syncTitle();
        });
        npbClose.addEventListener('click', () => {
            audio.pause();
            bar.classList.remove('visible', 'playing');
            document.body.classList.remove('npb-visible');
            sectionNavEl?.classList.remove('player-active');
        });
        const npbShuffle = document.getElementById('npbShuffle');
        if (npbShuffle) {
            npbShuffle.addEventListener('click', () => {
                const idx = Math.floor(Math.random() * TRACKS.length);
                loadTrack(idx, true);
                syncTitle();
            });
        }
        syncTitle();
        syncCover();
        syncPlayState();
        if (sharedTrackArrival) {
            setTimeout(() => {
                bar.classList.add('visible');
                document.body.classList.add('npb-visible');
                sectionNavEl?.classList.add('player-active');
                syncTitle();
                const playerSection = document.getElementById('musicPlayer');
                if (playerSection) {
                    const rect = playerSection.getBoundingClientRect();
                    const targetY = window.scrollY + rect.top - (window.innerHeight - rect.height) / 2;
                    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
                }
            }, 600);
        }
    })();
    (function initStageMode() {
        const stage = document.getElementById('stageMode');
        if (!stage) return;
        const bg = document.getElementById('stageBg');
        const coverImg = document.getElementById('stageCover');
        const title = document.getElementById('stageTitle');
        const close = document.getElementById('stageClose');
        const play = document.getElementById('stagePlay');
        const playIconStage = document.getElementById('stagePlayIcon');
        const prev = document.getElementById('stagePrev');
        const next = document.getElementById('stageNext');
        const download = document.getElementById('stageDownload');
        const stageSeek = document.getElementById('stageSeek');
        const stageCurrentTime = document.getElementById('stageCurrentTime');
        const stageTotalTime = document.getElementById('stageTotalTime');
        const stageVol = document.getElementById('stageVol');
        const stageVolIcon = document.getElementById('stageVolIcon');
        const studioOpen = document.getElementById('studioStageOpen');
        const studioDownload = document.getElementById('studioCoverDownload');

        function syncStageProgress() {
            if (!stageSeek) return;
            const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
            stageSeek.value = pct;
            stageSeek.style.setProperty('--seek', pct + '%');
            if (stageCurrentTime) stageCurrentTime.textContent = fmt(audio.currentTime || 0);
            if (stageTotalTime) stageTotalTime.textContent = audio.duration ? fmt(audio.duration) : '0:00';
        }
        function setStageVolumeFromInput() {
            if (!stageVol) return;
            audio.volume = stageVol.value / 100;
            audio.muted = false;
            if (window._setAudioVolume) window._setAudioVolume(audio.volume);
            syncAllVolumeUI();
        }
        function syncStageVolume() {
            syncAllVolumeUI();
        }
        function syncStage() {
            const t = TRACKS[currentIdx];
            const cover = getTrackCover(t);
            if (title) {
                const titleText = t ? t.title : '—';
                title.textContent = titleText;
                title.classList.toggle('stage-title-long', titleText.length > 28);
                title.classList.toggle('stage-title-xl', titleText.length > 52);
            }
            if (cover?.cover) {
                if (coverImg) {
                    coverImg.src = cover.cover;
                    coverImg.alt = `${getTranslation('player.coverAltTrack')} ${t.title}`;
                }
                if (bg) bg.src = cover.cover;
            } else {
                if (coverImg) {
                    coverImg.src = 'assets/borrowed-colors.webp';
                    coverImg.alt = '';
                }
                if (bg) bg.src = 'assets/borrowed-colors.webp';
            }
            setDownloadLink(download, cover, t?.title || getTranslation('player.coverFile'));
            setDownloadLink(studioDownload, cover, t?.title || getTranslation('player.coverFile'));
            if (playIconStage) playIconStage.className = audio.paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
            syncStageProgress();
            syncAllVolumeUI();
        }
        function openStage() {
            syncStage();
            stage.classList.add('open');
            stage.setAttribute('aria-hidden', 'false');
            document.documentElement.classList.add('stage-lock');
        }
        function closeStage() {
            stage.classList.remove('open');
            stage.setAttribute('aria-hidden', 'true');
            document.documentElement.classList.remove('stage-lock');
        }

        studioOpen?.addEventListener('click', openStage);
        close?.addEventListener('click', closeStage);
        stage.addEventListener('click', (e) => { if (e.target === stage) closeStage(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && stage.classList.contains('open')) closeStage(); });
        play?.addEventListener('click', () => {
            if (window._ensureAudioCtx) window._ensureAudioCtx();
            if (audio.paused) audio.play().catch(() => {});
            else audio.pause();
        });
        prev?.addEventListener('click', () => {
            if (window._ensureAudioCtx) window._ensureAudioCtx();
            loadTrack((currentIdx - 1 + TRACKS.length) % TRACKS.length, !audio.paused);
        });
        next?.addEventListener('click', () => {
            if (window._ensureAudioCtx) window._ensureAudioCtx();
            loadTrack((currentIdx + 1) % TRACKS.length, !audio.paused);
        });
        stageSeek?.addEventListener('input', () => {
            stageSeek.style.setProperty('--seek', stageSeek.value + '%');
            if (audio.duration) audio.currentTime = (stageSeek.value / 100) * audio.duration;
            syncStageProgress();
        });
        stageVol?.addEventListener('input', setStageVolumeFromInput);
        stageVolIcon?.addEventListener('click', () => {
            audio.muted = !audio.muted;
            if (window._setAudioVolume) window._setAudioVolume(audio.muted ? 0 : audio.volume);
            syncAllVolumeUI();
        });
        audio.addEventListener('play', syncStage);
        audio.addEventListener('pause', syncStage);
        audio.addEventListener('timeupdate', syncStageProgress);
        audio.addEventListener('loadedmetadata', syncStageProgress);
        audio.addEventListener('volumechange', syncStageVolume);
        document.addEventListener('trackcoverchange', syncStage);
        document.addEventListener('coversloaded', syncStage);
        syncStage();
    })();
})();
