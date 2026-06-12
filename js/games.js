/* ==========================================================================
   ARCADE — minijuegos musicales del portfolio
   Depende de main.js (translations, getTranslation, TRACKS, _visualBeat,
   window._audioAnalyser, window._playerLoadTrack). Vanilla JS, sin librerías.

   Análisis musical (calibrado con las canciones reales del portfolio):
   STFT 1024/512 sobre mono ~22 kHz → flujo espectral en 3 bandas
   (graves/bombo, medios/voz-caja, agudos/hats) → onsets con umbral de
   mediana local → BPM por autocorrelación armónica afinado con "vector
   strength" sobre los kicks → rejilla de pulso + energía por sección.
   La dificultad decide qué capas se convierten en eventos de juego:
   Fácil = pulso 4x4 · Medio = todos los beats · Difícil = + bajo y
   percusión media · Experto = + agudos y corcheas.
   ========================================================================== */
(function () {
'use strict';
if (typeof translations === 'undefined' || typeof getTranslation !== 'function') return;
const audio = document.getElementById('audioEl');
if (!audio) return;

/* ===================== i18n (se inyecta en el sistema global) ===================== */
const GAMES_I18N = {
    es: {
        open: 'Minijuegos',
        title: 'Arcade',
        subtitle: 'Minijuegos sincronizados con los golpes reales de la canción. Elige juego y dificultad: la canción empieza de cero y cada golpe cuenta.',
        hint: 'ESC para salir · Al cerrar, tu música vuelve donde estaba',
        back: 'Juegos',
        bestLabel: 'Récord',
        playNow: 'JUGAR',
        score: 'Puntos', combo: 'Combo', maxCombo: 'Combo máx.', accuracy: 'Precisión',
        time: 'Tiempo', round: 'Ronda', lives: 'Vidas', hits: 'Aciertos', notes: 'Notas',
        gates: 'Puertas', taps: 'Toques',
        retry: 'Reintentar', hubBtn: 'Más juegos', resume: 'Reanudar', cancel: 'Cancelar',
        restartRun: 'Reiniciar partida', changeSong: 'Cambiar canción',
        pickSong: 'Elige una canción', searchSong: 'Buscar canción…',
        difficulty: 'Dificultad',
        dEasy: 'Fácil', dMedium: 'Medio', dHard: 'Difícil', dExpert: 'Experto',
        lanes: 'Carriles', keys: 'Teclas', changeKeys: 'Cambiar',
        pressKey: 'Pulsa la tecla del carril',
        paused: 'Música en pausa', pausedSub: 'Reanuda la música para seguir jugando.',
        analyzing: 'Analizando la canción…', analyzingSub: 'Detectando bombo, percusión, voz y BPM de la canción.',
        analyzeError: 'No se pudo analizar la canción. Prueba con otra.',
        go: '¡YA!', gameOver: 'Fin de la partida', newRecord: '¡Nuevo récord!',
        perfect: 'Perfecto', good: 'Bien', miss: 'Fallo',
        yourTurn: 'Tu turno', watch: 'Observa',
        target: 'Canción', you: 'Tú', detecting: 'Detectando BPM…',
        tempoSpot: '¡Clavado!', tempoClose: 'Muy cerca', tempoFar: 'Sigue el bombo…',
        tempoHint: 'ESPACIO o botón',
        bossIncoming: '¡JEFE!',
        g: {
            tap:    { name: 'Beat Tap',      desc: 'Cada golpe de la canción lanza un círculo: tócalo justo cuando el anillo se cierre.', how: 'El anillo se cierra exactamente en el golpe. Toca en ese instante. 3 vidas.' },
            hero:   { name: 'Danielux Hero', desc: 'Notas generadas con los golpes reales: graves a la izquierda, voz al centro, agudos a la derecha.', how: 'Pulsa la tecla del carril (o tócalo) cuando la nota cruce la línea.' },
            surfer: { name: 'Bass Surfer',   desc: 'Surfea la onda: mantén pulsado para subir. Las puertas llegan clavadas al ritmo.', how: 'Mantén pulsado (o ESPACIO) para subir. Suelta para caer. 3 vidas.' },
            simon:  { name: 'Simon Beat',    desc: 'Memoriza la secuencia que se ilumina al pulso de la música y repítela sin fallar.', how: 'Observa la secuencia y repítela tocando los pads.' },
            dodger: { name: 'Beat Dodger',   desc: 'Cada golpe detona una onda donde marca el aviso. Arrastra tu orbe y sobrevive.', how: 'Arrastra el orbe para esquivar las ondas. 3 vidas.' },
            tempo:  { name: 'Tap Tempo',     desc: '¿Tienes ritmo de verdad? Sigue el pulso de la canción y compara tu BPM con el real.', how: 'Toca el botón grande (o la barra espaciadora) al ritmo de la canción. Mínimo 8 toques.' },
            bass:   { name: 'Bass Invaders', desc: 'Naves que bajan con cada golpe de la canción. En los drops aparece un jefe que crece con la energía.', how: 'Mueve la nave (arrastra, A/D o flechas) para apuntar y esquivar. El disparo es automático. 3 vidas.' },
        },
    },
    en: {
        open: 'Mini-games',
        title: 'Arcade',
        subtitle: 'Mini-games synced to the real hits of the song. Pick a game and difficulty: the track starts from zero and every hit counts.',
        hint: 'ESC to exit · On close, your music resumes where it was',
        back: 'Games',
        bestLabel: 'Best',
        playNow: 'PLAY',
        score: 'Score', combo: 'Combo', maxCombo: 'Max combo', accuracy: 'Accuracy',
        time: 'Time', round: 'Round', lives: 'Lives', hits: 'Hits', notes: 'Notes',
        gates: 'Gates', taps: 'Taps',
        retry: 'Retry', hubBtn: 'More games', resume: 'Resume', cancel: 'Cancel',
        restartRun: 'Restart run', changeSong: 'Change song',
        pickSong: 'Pick a song', searchSong: 'Search song…',
        difficulty: 'Difficulty',
        dEasy: 'Easy', dMedium: 'Medium', dHard: 'Hard', dExpert: 'Expert',
        lanes: 'Lanes', keys: 'Keys', changeKeys: 'Change',
        pressKey: 'Press the key for lane',
        paused: 'Music paused', pausedSub: 'Resume the music to keep playing.',
        analyzing: 'Analyzing the song…', analyzingSub: 'Detecting the kick, percussion, vocals and BPM of the song.',
        analyzeError: 'Could not analyze this song. Try another one.',
        go: 'GO!', gameOver: 'Game over', newRecord: 'New record!',
        perfect: 'Perfect', good: 'Good', miss: 'Miss',
        yourTurn: 'Your turn', watch: 'Watch',
        target: 'Song', you: 'You', detecting: 'Detecting BPM…',
        tempoSpot: 'Spot on!', tempoClose: 'So close', tempoFar: 'Follow the kick…',
        tempoHint: 'SPACE or button',
        bossIncoming: 'BOSS!',
        g: {
            tap:    { name: 'Beat Tap',      desc: 'Every hit of the song fires a circle: tap it right when the ring closes.', how: 'The ring closes exactly on the hit. Tap at that instant. 3 lives.' },
            hero:   { name: 'Danielux Hero', desc: 'Notes built from the real hits: bass on the left, vocals center, highs on the right.', how: 'Press the lane key (or tap it) when the note crosses the line.' },
            surfer: { name: 'Bass Surfer',   desc: 'Surf the wave: hold to rise. The gates arrive dead on the beat.', how: 'Hold (or SPACE) to rise. Release to fall. 3 lives.' },
            simon:  { name: 'Simon Beat',    desc: 'Memorize the sequence that lights up on the pulse of the music and repeat it without failing.', how: 'Watch the sequence, then repeat it by tapping the pads.' },
            dodger: { name: 'Beat Dodger',   desc: 'Every hit detonates a wave where the warning marks. Drag your orb and survive.', how: 'Drag the orb to dodge the waves. 3 lives.' },
            tempo:  { name: 'Tap Tempo',     desc: 'Got real rhythm? Follow the pulse of the song and compare your BPM with the real one.', how: 'Tap the big button (or the space bar) to the beat. At least 8 taps.' },
            bass:   { name: 'Bass Invaders', desc: 'Ships that descend with every hit of the song. On the drops a boss appears, growing with the energy.', how: 'Move the ship (drag, A/D or arrows) to aim and dodge. Firing is automatic. 3 lives.' },
        },
    },
    val: {
        open: 'Minijocs',
        title: 'Arcade',
        subtitle: 'Minijocs sincronitzats amb els colps reals de la cançó. Tria joc i dificultat: la cançó comença de zero i cada colp compta.',
        hint: 'ESC per a eixir · En tancar, la teua música torna on estava',
        back: 'Jocs',
        bestLabel: 'Rècord',
        playNow: 'JUGAR',
        score: 'Punts', combo: 'Combo', maxCombo: 'Combo màx.', accuracy: 'Precisió',
        time: 'Temps', round: 'Ronda', lives: 'Vides', hits: 'Encerts', notes: 'Notes',
        gates: 'Portes', taps: 'Tocs',
        retry: 'Reintentar', hubBtn: 'Més jocs', resume: 'Reprendre', cancel: 'Cancel·lar',
        restartRun: 'Reiniciar partida', changeSong: 'Canviar cançó',
        pickSong: 'Tria una cançó', searchSong: 'Buscar cançó…',
        difficulty: 'Dificultat',
        dEasy: 'Fàcil', dMedium: 'Mitjà', dHard: 'Difícil', dExpert: 'Expert',
        lanes: 'Carrils', keys: 'Tecles', changeKeys: 'Canviar',
        pressKey: 'Polsa la tecla del carril',
        paused: 'Música en pausa', pausedSub: 'Reprén la música per a continuar jugant.',
        analyzing: 'Analitzant la cançó…', analyzingSub: 'Detectant el bombo, la percussió, la veu i el BPM de la cançó.',
        analyzeError: 'No s’ha pogut analitzar la cançó. Prova amb una altra.',
        go: 'JA!', gameOver: 'Fi de la partida', newRecord: 'Nou rècord!',
        perfect: 'Perfecte', good: 'Bé', miss: 'Errada',
        yourTurn: 'El teu torn', watch: 'Observa',
        target: 'Cançó', you: 'Tu', detecting: 'Detectant BPM…',
        tempoSpot: 'Clavat!', tempoClose: 'Molt a prop', tempoFar: 'Segueix el bombo…',
        tempoHint: 'ESPAI o botó',
        bossIncoming: 'CAP!',
        g: {
            tap:    { name: 'Beat Tap',      desc: 'Cada colp de la cançó llança un cercle: toca’l just quan l’anell es tanque.', how: 'L’anell es tanca exactament en el colp. Toca en eixe instant. 3 vides.' },
            hero:   { name: 'Danielux Hero', desc: 'Notes generades amb els colps reals: greus a l’esquerra, veu al centre, aguts a la dreta.', how: 'Polsa la tecla del carril (o toca’l) quan la nota creue la línia.' },
            surfer: { name: 'Bass Surfer',   desc: 'Surfeja l’ona: mantín polsat per a pujar. Les portes arriben clavades al ritme.', how: 'Mantín polsat (o ESPAI) per a pujar. Solta per a caure. 3 vides.' },
            simon:  { name: 'Simon Beat',    desc: 'Memoritza la seqüència que s’il·lumina al pols de la música i repeteix-la sense fallar.', how: 'Observa la seqüència i repeteix-la tocant els pads.' },
            dodger: { name: 'Beat Dodger',   desc: 'Cada colp detona una ona on marca l’avís. Arrossega el teu orbe i sobreviu.', how: 'Arrossega l’orbe per a esquivar les ones. 3 vides.' },
            tempo:  { name: 'Tap Tempo',     desc: 'Tens ritme de veritat? Segueix el pols de la cançó i compara el teu BPM amb el real.', how: 'Toca el botó gran (o la barra d’espai) al ritme de la cançó. Mínim 8 tocs.' },
            bass:   { name: 'Bass Invaders', desc: 'Naus que baixen amb cada colp de la cançó. En els drops apareix un cap que creix amb l’energia.', how: 'Mou la nau (arrossega, A/D o fletxes) per a apuntar i esquivar. El tret és automàtic. 3 vides.' },
        },
    },
};
Object.keys(GAMES_I18N).forEach((l) => { if (translations[l]) translations[l].games = GAMES_I18N[l]; });
const T = (key) => {
    const v = getTranslation('games.' + key);
    return typeof v === 'string' ? v : key;
};

/* ===================== Utilidades compartidas ===================== */
let beatNow = () => 0;
try { if (typeof _visualBeat === 'number') beatNow = () => Math.max(0, Math.min(1, _visualBeat)); } catch (e) { /* main.js no disponible */ }

function accentRgb(which) {
    const s = document.documentElement.style.getPropertyValue(which === 2 ? '--accent-2-rgb' : '--accent-1-rgb').trim();
    return s || (which === 2 ? '139 92 246' : '0 200 255');
}
const rgbStr = (rgb, a) => `rgba(${rgb.split(/\s+/).join(',')},${a})`;
// “Tinta” que se ve en ambos temas (blanco en oscuro, azul noche en claro)
const ink = (a) => (document.documentElement.getAttribute('data-theme') === 'light'
    ? `rgba(26,32,53,${a})` : `rgba(255,255,255,${a})`);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtN = (n) => Math.round(n).toLocaleString('es-ES'); // separador de miles
function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

/* ===================== Glow barato (sustituto de ctx.shadowBlur) =====================
   ctx.shadowBlur es carísimo en Canvas 2D: aplica un desenfoque a TODA la zona en
   cada objeto, y con decenas de objetos por frame hunde los FPS. Lo sustituimos por
   un sprite radial cacheado dibujado con composición aditiva ('lighter'): un drawImage
   acelerado por GPU, ~30× más barato. Tres tintes (acento 1, acento 2, blanco/tinta).
   Se reconstruyen solo al cambiar de tema, no cada frame. */
const _glow = { a1: null, a2: null, w: null, theme: null };
function _buildGlow() {
    const mk = (rgb) => {
        const c = document.createElement('canvas');
        c.width = c.height = 96;
        const g = c.getContext('2d');
        const cs = rgb.split(/\s+/).join(',');
        const grd = g.createRadialGradient(48, 48, 0, 48, 48, 48);
        grd.addColorStop(0, `rgba(${cs},0.85)`);
        grd.addColorStop(0.42, `rgba(${cs},0.30)`);
        grd.addColorStop(1, `rgba(${cs},0)`);
        g.fillStyle = grd;
        g.fillRect(0, 0, 96, 96);
        return c;
    };
    _glow.a1 = mk(accentRgb(1));
    _glow.a2 = mk(accentRgb(2));
    _glow.w = mk(document.documentElement.getAttribute('data-theme') === 'light' ? '60 80 160' : '255 255 255');
    _glow.theme = document.documentElement.getAttribute('data-theme');
}
// dibuja un halo aditivo centrado en (x,y) de radio r. key: 'a1' | 'a2' | 'w'
function glow(ctx, x, y, r, key, alpha) {
    if (!_glow.a1 || _glow.theme !== document.documentElement.getAttribute('data-theme')) _buildGlow();
    const s = _glow[key] || _glow.a1;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.drawImage(s, x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

// Reloj de canción: interpola audio.currentTime (que avanza a saltos) con performance.now
function makeSongClock(a) {
    let lastCT = a.currentTime, lastPerf = performance.now() / 1000;
    return () => {
        const ct = a.currentTime;
        const p = performance.now() / 1000;
        if (ct !== lastCT) { lastCT = ct; lastPerf = p; return ct; }
        return a.paused ? ct : lastCT + (p - lastPerf);
    };
}

// El icono de play del reproductor principal no escucha eventos del audio:
// lo sincronizamos a mano cuando el arcade pausa/reproduce por su cuenta.
function syncPlayIcons() {
    const playing = !audio.paused;
    const pi = document.getElementById('playIcon');
    if (pi) pi.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    const ni = document.getElementById('npbPlayIcon');
    if (ni) ni.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
}

/* ===================== Opciones y récords ===================== */
const LS_BEST = 'dlxArcadeBest';
const LS_OPTS = 'dlxArcadeOpts';
let bests = {};
try { bests = JSON.parse(localStorage.getItem(LS_BEST)) || {}; } catch (e) { bests = {}; }
function saveBest(key, v) {
    bests[key] = v;
    try { localStorage.setItem(LS_BEST, JSON.stringify(bests)); } catch (e) {}
}
const DIFFS = ['easy', 'medium', 'hard', 'expert'];
const DIFF_LABEL = { easy: 'dEasy', medium: 'dMedium', hard: 'dHard', expert: 'dExpert' };
let OPTS = { diff: {}, heroLanes: 3, tapKeys: ['z', 'x'], heroKeys: { 3: ['d', 'f', 'j'], 4: ['d', 'f', 'j', 'k'], 5: ['d', 'f', ' ', 'j', 'k'] } };
try {
    const saved = JSON.parse(localStorage.getItem(LS_OPTS));
    if (saved && typeof saved === 'object') OPTS = { ...OPTS, ...saved, heroKeys: { ...OPTS.heroKeys, ...(saved.heroKeys || {}) } };
} catch (e) {}
function saveOpts() { try { localStorage.setItem(LS_OPTS, JSON.stringify(OPTS)); } catch (e) {} }
function diffOf(id) { return DIFFS.includes(OPTS.diff[id]) ? OPTS.diff[id] : 'medium'; }
function bestKeyFor(id) {
    const d = diffOf(id);
    return id === 'hero' ? `${id}|${d}|${OPTS.heroLanes}k` : `${id}|${d}`;
}
function bestOfGame(id) {
    let max = 0;
    for (const [k, v] of Object.entries(bests)) {
        if ((k === id || k.startsWith(id + '|')) && v > max) max = v;
    }
    return max;
}
const keyLabel = (k) => (k === ' ' ? '␣' : k.length === 1 ? k.toUpperCase() : k.replace('arrow', '').toUpperCase());

/* ===================== Análisis musical (STFT multibanda, calibrado) =====================
   Validado con un auto-test sintético (BPM exacto, 100% de kicks en rejilla) y
   calibrado con 8 canciones reales del portfolio de estilos distintos. */
const BEATMAP_CACHE = new Map(); // src → mapa

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

/* Caché persistente en IndexedDB: el análisis de cada canción sobrevive recargas */
function idbOpen() {
    return new Promise((res) => {
        try {
            const rq = indexedDB.open('dlxArcade', 1);
            rq.onupgradeneeded = () => rq.result.createObjectStore('beatmaps');
            rq.onsuccess = () => res(rq.result);
            rq.onerror = () => res(null);
        } catch (e) { res(null); }
    });
}
async function idbGet(key) {
    const db = await idbOpen();
    if (!db) return null;
    return new Promise((res) => {
        try {
            const rq = db.transaction('beatmaps', 'readonly').objectStore('beatmaps').get(key);
            rq.onsuccess = () => res(rq.result || null);
            rq.onerror = () => res(null);
        } catch (e) { res(null); }
    });
}
async function idbSet(key, val) {
    const db = await idbOpen();
    if (!db) return;
    try { db.transaction('beatmaps', 'readwrite').objectStore('beatmaps').put(val, key); } catch (e) {}
}

async function buildBeatmap(src) {
    if (BEATMAP_CACHE.has(src)) return BEATMAP_CACHE.get(src);
    const cached = await idbGet(src);
    if (cached && cached.energy && cached.grid) {
        const m = hydrateMap(cached);
        BEATMAP_CACHE.set(src, m);
        return m;
    }
    const resp = await fetch(src);
    if (!resp.ok) throw new Error('fetch ' + resp.status);
    const raw = await resp.arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext;
    const dctx = new AC();
    let decoded;
    try {
        decoded = await new Promise((res, rej) => {
            const p = dctx.decodeAudioData(raw, res, rej);
            if (p && p.then) p.then(res, rej); // forma promesa o callback según navegador
        });
    } finally {
        dctx.close().catch(() => {});
    }
    const data0 = await analyzeBuffer(decoded);
    // copia limpia para IndexedDB: la closure de hydrateMap no es serializable
    idbSet(src, {
        dur: data0.dur, bpm: data0.bpm, beatT: data0.beatT, grid: data0.grid,
        low: data0.low, mid: data0.mid, high: data0.high,
        energy: data0.energy, hopT: data0.hopT,
    });
    const map = hydrateMap(data0);
    BEATMAP_CACHE.set(src, map);
    if (BEATMAP_CACHE.size > 6) BEATMAP_CACHE.delete(BEATMAP_CACHE.keys().next().value);
    return map;
}

/* REJILLA ANCLADA: el "esqueleto" de un mapa es el pulso 4x4, pero un beat
   SOLO se conserva si hay un golpe REAL (grave > medio > agudo, a ±90 ms) y se
   coloca en el instante exacto de ese golpe. Si no hay golpe cerca, el beat se
   descarta. Así nunca se inventa una nota: todo cae sobre sonido real.
   Cada evento lleva su banda real (0 graves · 1 medios/voz · 2 agudos), que los
   juegos usan para colocar carriles, ondas, etc. de forma musicalmente fiel. */
function anchorGrid(map) {
    const bands = [map.low, map.mid, map.high];
    const ptr = [0, 0, 0];
    const out = [];
    const WIN = 0.09;
    for (const g of map.grid) {
        let best = null;
        for (let b = 0; b < 3 && !best; b++) {
            const arr = bands[b];
            let i = ptr[b];
            while (i < arr.length && arr[i].t < g - WIN) i++;
            ptr[b] = i;
            let bestD = WIN;
            for (let j = i; j < arr.length && arr[j].t <= g + WIN; j++) {
                const d = Math.abs(arr[j].t - g);
                if (d < bestD) { bestD = d; best = { t: arr[j].t, s: arr[j].s, band: b }; }
            }
        }
        if (best) out.push(best);
    }
    return out;
}

function eventsFor(map, diff) {
    if (!map._anchored) map._anchored = anchorGrid(map);
    const anchored = map._anchored;
    const tag = (arr, band) => arr.map((o) => ({ t: o.t, s: o.s, band }));
    let pool, minGap;
    if (diff === 'easy') {
        // beats anclados alternos, eligiendo la mitad con golpes más fuertes
        const evens = anchored.filter((_, i) => i % 2 === 0);
        const odds = anchored.filter((_, i) => i % 2 === 1);
        const sumS = (a) => a.reduce((s, e) => s + e.s, 0);
        pool = sumS(evens) >= sumS(odds) ? evens : odds;
        minGap = 0.45;
    } else if (diff === 'medium') {
        pool = [...anchored, ...tag(map.low.filter((o) => o.s > 0.75), 0)];
        minGap = 0.28;
    } else if (diff === 'hard') {
        pool = [...anchored, ...tag(map.low, 0), ...tag(map.mid.filter((o) => o.s > 0.45), 1)];
        minGap = 0.18;
    } else {
        pool = [...anchored, ...tag(map.low, 0), ...tag(map.mid, 1), ...tag(map.high.filter((o) => o.s > 0.5), 2)];
        minGap = 0.12;
    }
    pool.sort((a, b) => a.t - b.t);
    const out = [];
    let last = -9;
    for (const e of pool) {
        if (e.t - last < minGap) continue;
        out.push(e);
        last = e.t;
    }
    return out;
}

/* ===================== Motor del arcade ===================== */
const Arcade = {
    games: [],
    overlay: null, hub: null, grid: null, stage: null, canvas: null, ctx: null,
    hud: null, msg: null, backBtn: null, restartBtn: null, songBtn: null, nowTitle: null,
    W: 0, H: 0, dpr: 1,
    session: null, sessionGame: null, paused: false, showingResults: false,
    holdFrames: false, _picker: false, _prep: false, _dirty: false, _pregame: false,
    snapshot: null, songClock: null, runBestKey: null,
    rafId: null, lastTs: 0,
    countToken: 0,
    sparks: [], floats: [],

    register(game) { this.games.push(game); },

    /* ---- construcción del DOM (una vez) ---- */
    build() {
        const el = document.createElement('div');
        el.className = 'arcade-overlay';
        el.id = 'arcadeOverlay';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = `
            <header class="arcade-top">
                <button class="arcade-back" id="arcadeBack" hidden><i class="fa-solid fa-arrow-left"></i> <span data-i18n="games.back">${T('back')}</span></button>
                <h2 class="arcade-title"><i class="fa-solid fa-gamepad"></i> <span data-i18n="games.title">${T('title')}</span></h2>
                <div class="arcade-now"><i class="fa-solid fa-music"></i> <span id="arcadeNowTitle">—</span></div>
                <button class="arcade-iconbtn" id="arcadeRestart" hidden aria-label="Reiniciar" title="${T('restartRun')}" data-i18n-title="games.restartRun"><i class="fa-solid fa-rotate-left"></i></button>
                <button class="arcade-iconbtn" id="arcadeSongBtn" aria-label="Cambiar canción" title="${T('changeSong')}" data-i18n-title="games.changeSong"><i class="fa-solid fa-music"></i></button>
                <button class="arcade-close" id="arcadeClose" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
            </header>
            <div class="arcade-hub" id="arcadeHub">
                <div class="arcade-hub-inner">
                    <div class="arcade-marquee">
                        <span class="over">Danielux presents</span>
                        <span class="ttl">Arcade</span>
                    </div>
                    <p class="arcade-sub" data-i18n="games.subtitle">${T('subtitle')}</p>
                    <div class="arcade-tiles" id="arcadeGrid"></div>
                    <p class="arcade-hint" data-i18n="games.hint">${T('hint')}</p>
                </div>
            </div>
            <div class="arcade-stage" id="arcadeStage" hidden>
                <canvas id="arcadeCanvas"></canvas>
                <div class="arcade-hud" id="arcadeHud"></div>
                <div class="arcade-msg" id="arcadeMsg" hidden></div>
            </div>`;
        document.body.appendChild(el);
        this.overlay = el;
        this.hub = el.querySelector('#arcadeHub');
        this.grid = el.querySelector('#arcadeGrid');
        this.stage = el.querySelector('#arcadeStage');
        this.canvas = el.querySelector('#arcadeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.hud = el.querySelector('#arcadeHud');
        this.msg = el.querySelector('#arcadeMsg');
        this.backBtn = el.querySelector('#arcadeBack');
        this.restartBtn = el.querySelector('#arcadeRestart');
        this.songBtn = el.querySelector('#arcadeSongBtn');
        this.nowTitle = el.querySelector('#arcadeNowTitle');

        // Tarjetas-cartucho del hub
        this.games.forEach((g, i) => {
            const card = document.createElement('button');
            card.className = 'arcade-tile';
            card.dataset.game = g.id;
            card.style.setProperty('--g1', g.colors[0]);
            card.style.setProperty('--g2', g.colors[1]);
            card.innerHTML = `
                <span class="arcade-tile-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
                <span class="arcade-tile-icon"><i class="${g.icon}"></i></span>
                <h3 class="arcade-tile-name" data-i18n="games.g.${g.id}.name">${T('g.' + g.id + '.name')}</h3>
                <p class="arcade-tile-desc" data-i18n="games.g.${g.id}.desc">${T('g.' + g.id + '.desc')}</p>
                <span class="arcade-tile-foot">
                    <span class="arcade-card-best" id="arcadeBest-${g.id}" hidden>
                        <i class="fa-solid fa-trophy"></i> <b>0</b>
                    </span>
                    <span class="arcade-tile-play"><i class="fa-solid fa-play"></i> <span data-i18n="games.playNow">${T('playNow')}</span></span>
                </span>`;
            card.addEventListener('click', () => this.launch(g.id));
            this.grid.appendChild(card);
        });

        el.querySelector('#arcadeClose').addEventListener('click', () => this.close());
        this.backBtn.addEventListener('click', () => this.toHub());
        this.restartBtn.addEventListener('click', () => {
            if (this.sessionGame) this.startRun(this.sessionGame.id);
        });
        this.songBtn.addEventListener('click', () => {
            if (this._picker) this.closeSongPicker();
            else this.openSongPicker();
        });

        // Entrada por puntero (se delega al juego activo)
        const pos = (ev) => {
            const r = this.stage.getBoundingClientRect();
            return { x: ev.clientX - r.left, y: ev.clientY - r.top };
        };
        this.pointer = { x: 0, y: 0, down: false };
        this.stage.addEventListener('pointerdown', (ev) => {
            if (ev.target.closest('.arcade-msg, .arcade-hud')) return;
            try { this.stage.setPointerCapture(ev.pointerId); } catch (e) {}
            const p = pos(ev);
            this.pointer.x = p.x; this.pointer.y = p.y; this.pointer.down = true;
            if (this.session && !this.paused && !this.holdFrames && !this.showingResults) this.session.onTap?.(p.x, p.y, ev);
        });
        this.stage.addEventListener('pointermove', (ev) => {
            const p = pos(ev);
            this.pointer.x = p.x; this.pointer.y = p.y;
            if (this.session && !this.paused && !this.holdFrames && !this.showingResults) this.session.onMove?.(p.x, p.y, ev);
        });
        const up = (ev) => {
            this.pointer.down = false;
            if (this.session) this.session.onRelease?.(ev);
        };
        this.stage.addEventListener('pointerup', up);
        this.stage.addEventListener('pointercancel', up);
        this.stage.addEventListener('contextmenu', (ev) => ev.preventDefault());

        // Teclado
        document.addEventListener('keydown', (ev) => {
            if (!this.isOpen()) return;
            if (this._keyCapture) { this._keyCapture(ev); return; }
            if (ev.key === 'Escape') {
                ev.preventDefault();
                if (this._picker) { this.closeSongPicker(); return; }
                if (this.session || this.showingResults || this._pregame) this.toHub();
                else this.close();
                return;
            }
            if (this.session && !this.showingResults && !this._picker) {
                if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) ev.preventDefault();
                if (!this.paused && !ev.repeat) this.session.onKey?.(ev, true);
            }
        });
        document.addEventListener('keyup', (ev) => {
            if (this.session && this.isOpen() && !this.showingResults && !this._picker) this.session.onKey?.(ev, false);
        });

        // Pausa ligada a la música
        audio.addEventListener('pause', () => { if (this.session && !this.showingResults && !this._prep) this.setPaused(true); });
        audio.addEventListener('play', () => { if (this.session && this.paused) this.setPaused(false); });
        document.addEventListener('trackchanged', () => {
            this.updateNowTitle();
            if (this.session && !this.showingResults) this.session.forceEnd?.();
        });

        window.addEventListener('resize', () => { if (this.isOpen()) this.resize(); }, { passive: true });
    },

    isOpen() { return this.overlay && this.overlay.classList.contains('open'); },

    updateNowTitle() {
        try {
            const idx = window._currentIdx || 0;
            if (this.nowTitle && typeof TRACKS !== 'undefined' && TRACKS[idx]) this.nowTitle.textContent = TRACKS[idx].title;
        } catch (e) {}
    },

    refreshBests() {
        this.games.forEach((g) => {
            const elB = document.getElementById('arcadeBest-' + g.id);
            if (!elB) return;
            const v = bestOfGame(g.id);
            if (v > 0) {
                elB.hidden = false;
                elB.querySelector('b').textContent = g.fmtBest ? g.fmtBest(v) : fmtN(v);
            } else {
                elB.hidden = true;
            }
        });
    },

    open() {
        if (!this.overlay) this.build();
        // Foto de lo que estaba sonando, para restaurarlo al cerrar
        this.snapshot = audio.getAttribute('src')
            ? { idx: window._currentIdx || 0, time: audio.currentTime || 0, playing: !audio.paused }
            : null;
        this._dirty = false; // aún no hemos tocado la música
        this.updateNowTitle();
        this.refreshBests();
        this.overlay.classList.add('open');
        this.overlay.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('arcade-lock');
        this.showHubView();
    },

    close() {
        const dirty = this._dirty;
        const wasPlayingNow = !audio.paused;
        this.abortSession();
        const s = this.snapshot;
        this.snapshot = null;
        if (dirty && s) {
            // Una partida tocó la música: restaurar canción, posición y estado previos
            try {
                const cur = window._currentIdx || 0;
                if (s.idx !== cur && window._playerLoadTrack) {
                    window._playerLoadTrack(s.idx, s.playing);
                    const seek = () => {
                        try { audio.currentTime = s.time; } catch (e) {}
                        audio.removeEventListener('loadedmetadata', seek);
                    };
                    audio.addEventListener('loadedmetadata', seek);
                } else {
                    try { audio.currentTime = s.time; } catch (e) {}
                    if (s.playing) { const p = audio.play(); if (p) p.catch(() => {}); }
                }
            } catch (e) {}
            setTimeout(syncPlayIcons, 60);
        } else if (!dirty && wasPlayingNow) {
            // Solo se visitó el hub: la música sigue como estaba
            try { const p = audio.play(); if (p) p.catch(() => {}); } catch (e) {}
            syncPlayIcons();
        }
        this.overlay.classList.remove('open');
        this.overlay.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('arcade-lock');
    },

    toHub() {
        this.abortSession();
        this.refreshBests();
        this.showHubView();
    },

    showHubView() {
        this.hub.hidden = false;
        this.stage.hidden = true;
        this.backBtn.hidden = true;
        this.restartBtn.hidden = true;
        this.hideMsg();
    },

    showStageView() {
        this.hub.hidden = true;
        this.stage.hidden = false;
        this.backBtn.hidden = false;
        this.resize();
    },

    resize() {
        const r = this.stage.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        // Limitamos la resolución del canvas: los juegos rellenan casi toda la
        // pantalla cada frame, así que el fill-rate a DPR alto cuesta. Priorizamos
        // fluidez (el degradado neón sigue viéndose nítido a 1.5×).
        const coarse = window.matchMedia('(pointer:coarse)').matches;
        this.dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.35 : 1.5);
        this.canvas.width = Math.round(r.width * this.dpr);
        this.canvas.height = Math.round(r.height * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.W = r.width;
        this.H = r.height;
        this.session?.onResize?.();
    },

    ensureMusic() {
        try {
            const p = audio.play();
            if (p) p.catch(() => {});
            syncPlayIcons();
        } catch (e) {}
    },

    /* ---- mensajes centrales ---- */
    showMsg(html, interactive = false) {
        this.msg.innerHTML = '<div class="arcade-msg-backdrop"></div>' + html;
        this.msg.hidden = false;
        this.msg.classList.toggle('interactive', interactive);
    },
    hideMsg() { this.msg.hidden = true; this.msg.innerHTML = ''; },

    setPaused(p) {
        if (!this.session) return;
        this.paused = p;
        if (p) {
            this.showMsg(`
                <h3 class="arcade-msg-title">${T('paused')}</h3>
                <p class="arcade-msg-sub">${T('pausedSub')}</p>
                <button class="arcade-btn primary" id="arcadeResume"><i class="fa-solid fa-play"></i> ${T('resume')}</button>`, true);
            this.msg.querySelector('#arcadeResume').addEventListener('click', () => {
                this.ensureMusic();
                this.setPaused(false);
            });
        } else {
            this.hideMsg();
            this.lastTs = 0;
        }
    },

    /* ---- selector de canción (disponible en hub y en partida) ---- */
    openSongPicker() {
        if (typeof TRACKS === 'undefined' || !window._playerLoadTrack) return;
        this._picker = true;
        this.holdFrames = !!this.session; // congela la partida mientras eliges
        const cur = window._currentIdx || 0;
        const rows = TRACKS.map((t, i) =>
            `<button class="songpick-row${i === cur ? ' active' : ''}" data-i="${i}"><span class="n">${i + 1}</span><span class="t">${t.title}</span></button>`
        ).join('');
        this.showMsg(`
            <div class="arcade-results songpick">
                <h3 class="arcade-msg-title" style="font-size:1.25rem;">${T('pickSong')}</h3>
                <input type="search" class="songpick-search" id="songPickSearch" placeholder="${T('searchSong')}" autocomplete="off" spellcheck="false">
                <div class="songpick-list" id="songPickList">${rows}</div>
                <div class="arcade-results-actions" style="margin-top:14px;">
                    <button class="arcade-btn" id="songPickClose"><i class="fa-solid fa-xmark"></i> ${T('cancel')}</button>
                </div>
            </div>`, true);
        const list = this.msg.querySelector('#songPickList');
        const input = this.msg.querySelector('#songPickSearch');
        input.addEventListener('input', () => {
            const q = input.value.toLowerCase();
            [...list.children].forEach((row) => {
                row.style.display = row.querySelector('.t').textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
        list.addEventListener('click', (ev) => {
            const row = ev.target.closest('.songpick-row');
            if (!row) return;
            const i = parseInt(row.dataset.i, 10);
            const gameId = this.sessionGame ? this.sessionGame.id : null;
            const wasRunning = !!this.session || this.showingResults;
            this._picker = false;
            this.holdFrames = false;
            this.hideMsg();
            this.abortSession();
            try { window._playerLoadTrack(i, false); audio.pause(); } catch (e) {}
            syncPlayIcons();
            this.updateNowTitle();
            if (gameId && wasRunning) this.startRun(gameId);
            else if (gameId) this.launch(gameId);
        });
        this.msg.querySelector('#songPickClose').addEventListener('click', () => this.closeSongPicker());
        const active = list.querySelector('.songpick-row.active');
        if (active) active.scrollIntoView({ block: 'center' });
        if (window.matchMedia('(pointer:fine)').matches) input.focus();
    },
    closeSongPicker() {
        this._picker = false;
        this.holdFrames = false;
        this.hideMsg();
        this.lastTs = 0;
        if (this.session && this.paused) this.setPaused(true);
        else if (this._pregame && this.sessionGame) this.showPregame(this.sessionGame.id);
    },

    /* ---- panel previo: dificultad y opciones ---- */
    launch(id) {
        const game = this.games.find((g) => g.id === id);
        if (!game) return;
        this.abortSession();
        this._dirty = true; // a partir de aquí la música es del juego
        warmBlip();         // crea el AudioContext de los pitidos dentro del gesto
        this.sessionGame = game;
        this.showStageView();
        this.restartBtn.hidden = true;
        this.ctx.clearRect(0, 0, this.W, this.H);
        // desbloquear la reproducción dentro del gesto (iOS exige play() por gesto)
        try {
            if (!audio.getAttribute('src') && window._playerLoadTrack) window._playerLoadTrack(window._currentIdx || 0, false);
            const p = audio.play();
            if (p && p.then) p.then(() => { if (!this.session) { audio.pause(); syncPlayIcons(); } }).catch(() => {});
        } catch (e) {}
        this.showPregame(id);
    },

    showPregame(id) {
        const game = this.games.find((g) => g.id === id);
        this._pregame = true;
        const diff = diffOf(id);
        const diffChips = DIFFS.map((d) =>
            `<button class="arcade-chip${d === diff ? ' active' : ''}" data-diff="${d}">${T(DIFF_LABEL[d])}</button>`
        ).join('');
        const hasKeys = id === 'hero' || id === 'tap';
        const getKeys = () => (id === 'tap' ? OPTS.tapKeys : OPTS.heroKeys[OPTS.heroLanes]) || [];
        const setKeys = (ks) => { if (id === 'tap') OPTS.tapKeys = ks; else OPTS.heroKeys[OPTS.heroLanes] = ks; };
        const keyCount = () => (id === 'tap' ? 2 : OPTS.heroLanes);
        const lanesRow = id === 'hero' ? `
            <div class="pregame-row">
                <span class="pregame-label">${T('lanes')}</span>
                <div class="arcade-chips">${[3, 4, 5].map((n) =>
                    `<button class="arcade-chip${n === OPTS.heroLanes ? ' active' : ''}" data-lanes="${n}">${n}</button>`).join('')}</div>
            </div>` : '';
        const heroExtra = lanesRow + (hasKeys ? `
            <div class="pregame-row">
                <span class="pregame-label">${T('keys')}</span>
                <div class="pregame-keys" id="pregameKeys"></div>
                <button class="arcade-btn mini" id="pregameKeysBtn">${T('changeKeys')}</button>
            </div>` : '');
        this.showMsg(`
            <div class="arcade-results pregame" style="--g1:${game.colors[0]};--g2:${game.colors[1]}">
                <span class="pregame-icon"><i class="${game.icon}"></i></span>
                <h3 class="arcade-msg-title" style="font-size:1.5rem;">${T('g.' + id + '.name')}</h3>
                <p class="arcade-msg-sub" style="font-size:0.84rem;">${T('g.' + id + '.how')}</p>
                <div class="pregame-row">
                    <span class="pregame-label">${T('difficulty')}</span>
                    <div class="arcade-chips" id="pregameDiffs">${diffChips}</div>
                </div>
                ${heroExtra}
                <div class="pregame-best" id="pregameBest"></div>
                <div class="arcade-results-actions" style="margin-top:16px;">
                    <button class="arcade-btn primary" id="pregamePlay"><i class="fa-solid fa-play"></i> ${T('playNow')}</button>
                    <button class="arcade-btn" id="pregameCancel"><i class="fa-solid fa-xmark"></i> ${T('cancel')}</button>
                </div>
            </div>`, true);

        const refreshBest = () => {
            const v = bests[bestKeyFor(id)] || 0;
            const elB = this.msg.querySelector('#pregameBest');
            elB.innerHTML = v > 0 ? `<i class="fa-solid fa-trophy"></i> ${T('bestLabel')}: <b>${(game.fmtBest || fmtN)(v)}</b>` : '';
        };
        const refreshKeys = () => {
            const elK = this.msg.querySelector('#pregameKeys');
            if (elK) elK.innerHTML = getKeys().map((k) => `<kbd>${keyLabel(k)}</kbd>`).join('');
        };
        refreshBest();
        refreshKeys();

        this.msg.querySelectorAll('[data-diff]').forEach((chip) => {
            chip.addEventListener('click', () => {
                OPTS.diff[id] = chip.dataset.diff;
                saveOpts();
                this.msg.querySelectorAll('[data-diff]').forEach((c) => c.classList.toggle('active', c === chip));
                refreshBest();
            });
        });
        this.msg.querySelectorAll('[data-lanes]').forEach((chip) => {
            chip.addEventListener('click', () => {
                OPTS.heroLanes = parseInt(chip.dataset.lanes, 10);
                saveOpts();
                this.msg.querySelectorAll('[data-lanes]').forEach((c) => c.classList.toggle('active', c === chip));
                refreshKeys();
                refreshBest();
            });
        });
        const keysBtn = this.msg.querySelector('#pregameKeysBtn');
        if (keysBtn) {
            keysBtn.addEventListener('click', () => {
                const total = keyCount();
                const newKeys = [];
                const elK = this.msg.querySelector('#pregameKeys');
                let lane = 0;
                elK.innerHTML = `<em>${T('pressKey')} 1…</em>`;
                this._keyCapture = (ev) => {
                    ev.preventDefault();
                    if (ev.key === 'Escape') { this._keyCapture = null; refreshKeys(); return; }
                    const k = ev.key.toLowerCase();
                    if (newKeys.includes(k)) return; // sin teclas repetidas
                    newKeys.push(k);
                    lane++;
                    if (lane >= total) {
                        setKeys(newKeys);
                        saveOpts();
                        this._keyCapture = null;
                        refreshKeys();
                    } else {
                        elK.innerHTML = newKeys.map((x) => `<kbd>${keyLabel(x)}</kbd>`).join('') + ` <em>${T('pressKey')} ${lane + 1}…</em>`;
                    }
                };
            });
        }
        this.msg.querySelector('#pregamePlay').addEventListener('click', () => this.startRun(id));
        this.msg.querySelector('#pregameCancel').addEventListener('click', () => this.toHub());
    },

    /* ---- lanzamiento de la partida ---- */
    async startRun(id) {
        const game = this.games.find((g) => g.id === id);
        if (!game) return;
        const keepDirty = true;
        this.abortSession();
        this._dirty = keepDirty;
        this.sessionGame = game;
        this._pregame = false;
        this.showStageView();
        this.restartBtn.hidden = false;
        const token = ++this.countToken;
        this.ctx.clearRect(0, 0, this.W, this.H);
        this.hud.innerHTML = '';
        this._prep = true;
        this.runBestKey = bestKeyFor(id);
        const diff = diffOf(id);

        try { audio.pause(); } catch (e) {}
        syncPlayIcons();

        // Análisis SIEMPRE: todos los juegos se sincronizan con los golpes reales
        this.showMsg(`
            <div class="arcade-spinner"></div>
            <h3 class="arcade-msg-title">${T('analyzing')}</h3>
            <p class="arcade-msg-sub">${T('analyzingSub')}</p>`);
        let map = null;
        try {
            for (let i = 0; i < 40 && !audio.currentSrc; i++) await new Promise((r) => setTimeout(r, 100));
            for (let i = 0; i < 3 && !map; i++) {
                const src = audio.currentSrc;
                if (!src) throw new Error('sin canción');
                const m = await buildBeatmap(src);
                if (audio.currentSrc === src) map = m; // si cambió la canción, re-analiza
            }
            if (!map) throw new Error('la canción no deja de cambiar');
        } catch (e) {
            if (token !== this.countToken) return;
            this.showMsg(`
                <h3 class="arcade-msg-title">:(</h3>
                <p class="arcade-msg-sub">${T('analyzeError')}</p>
                <button class="arcade-btn primary" id="arcadeErrBack">${T('hubBtn')}</button>`, true);
            this.msg.querySelector('#arcadeErrBack').addEventListener('click', () => this.toHub());
            return;
        }
        if (token !== this.countToken) return;

        // Intro + cuenta atrás 3·2·1
        const name = T('g.' + id + '.name');
        const diffName = T(DIFF_LABEL[diff]);
        for (let i = 3; i >= 1; i--) {
            this.showMsg(`
                <h3 class="arcade-msg-title">${name}</h3>
                <p class="arcade-msg-sub">${diffName} · ${Math.round(map.bpm)} BPM</p>
                <div class="arcade-count" style="animation:none;">${i}</div>`);
            const cnt = this.msg.querySelector('.arcade-count');
            void cnt.offsetWidth;
            cnt.style.animation = '';
            await new Promise((r) => setTimeout(r, 800));
            if (token !== this.countToken) return;
        }

        // GO: la canción arranca DESDE CERO, alineada con el análisis
        this._prep = false;
        try { audio.currentTime = 0; } catch (e) {}
        this.songClock = makeSongClock(audio);
        try { const pp = audio.play(); if (pp) pp.catch(() => {}); } catch (e) {}
        syncPlayIcons();
        this.showMsg(`<div class="arcade-count">${T('go')}</div>`);
        setTimeout(() => { if (token === this.countToken && !this.paused && !this.showingResults && !this._picker) this.hideMsg(); }, 600);

        // Arrancar sesión
        this.sparks = [];
        this.floats = [];
        this.paused = false;
        this.showingResults = false;
        this.session = game.createSession(this.api(), { map, events: eventsFor(map, diff), diff });
        this.lastTs = 0;
        if (!this.rafId) this.rafId = requestAnimationFrame((ts) => this.loop(ts));
        if (audio.paused) this.setPaused(true);
    },

    abortSession() {
        this.countToken++;
        if (this.session) {
            this.session.destroy?.();
            this.session = null;
        }
        this.sessionGame = null;
        this.paused = false;
        this.showingResults = false;
        this.holdFrames = false;
        this._picker = false;
        this._prep = false;
        this._pregame = false;
        this._keyCapture = null;
        this.sparks = [];
        this.floats = [];
        this.hud.innerHTML = '';
        this.hideMsg();
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        // Al salir de una partida la música se detiene (se restaura al cerrar el arcade);
        // si solo se ha visitado el hub, la música del usuario no se toca
        if (this._dirty) {
            try { audio.pause(); } catch (e) {}
            syncPlayIcons();
        }
    },

    /* ---- bucle principal ---- */
    loop(ts) {
        this.rafId = requestAnimationFrame((t2) => this.loop(t2));
        if (!this.lastTs) { this.lastTs = ts; return; }
        let dt = (ts - this.lastTs) / 1000;
        this.lastTs = ts;
        if (dt > 0.05) dt = 0.05;
        if (!this.session || this.paused || this.holdFrames) return;
        if (!this.showingResults) this.session.frame?.(dt, ts / 1000);
        this.drawSparks(dt);
        this.drawFloats(dt);
    },

    /* ---- partículas de acierto (ráfagas) ---- */
    burst(x, y, opts = {}) {
        const n = opts.n || 22;
        const power = opts.power || 1;
        const rgb = opts.accent === 2 ? accentRgb(2) : accentRgb(1);
        const bright = document.documentElement.getAttribute('data-theme') === 'light' ? '26 32 53' : '255 255 255';
        for (let i = 0; i < n; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = (40 + Math.random() * 260) * power;
            this.sparks.push({
                x, y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 0.45 + Math.random() * 0.45,
                t: 0,
                r: 1 + Math.random() * 2.4,
                rgb: Math.random() < 0.25 ? bright : (Math.random() < 0.5 ? accentRgb(2) : rgb),
            });
        }
        if (this.sparks.length > 420) this.sparks.splice(0, this.sparks.length - 420);
    },
    drawSparks(dt) {
        const ctx = this.ctx;
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.t += dt;
            if (s.t >= s.life) { this.sparks.splice(i, 1); continue; }
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vx *= 1 - 2.4 * dt;
            s.vy *= 1 - 2.4 * dt;
            s.vy += 60 * dt;
            const k = 1 - s.t / s.life;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * k, 0, Math.PI * 2);
            ctx.fillStyle = rgbStr(s.rgb, 0.85 * k);
            ctx.fill();
        }
    },

    /* ---- textos flotantes (Perfecto / Bien / Fallo…) ---- */
    addFloat(x, y, text, rgb) {
        this.floats.push({ x, y, text, rgb: rgb || accentRgb(1), t: 0, life: 0.8 });
    },
    drawFloats(dt) {
        const ctx = this.ctx;
        for (let i = this.floats.length - 1; i >= 0; i--) {
            const f = this.floats[i];
            f.t += dt;
            if (f.t >= f.life) { this.floats.splice(i, 1); continue; }
            const k = f.t / f.life;
            ctx.save();
            ctx.globalAlpha = 1 - k * k;
            ctx.font = `800 ${15 + k * 6}px Montserrat, sans-serif`;
            ctx.textAlign = 'center';
            // doble trazo (oscuro detrás + color) en vez de shadowBlur: legible y barato
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillText(f.text, f.x + 1, f.y - 28 * k + 1);
            ctx.fillStyle = rgbStr(f.rgb, 1);
            ctx.fillText(f.text, f.x, f.y - 28 * k);
            ctx.restore();
        }
    },

    /* ---- HUD genérico ---- */
    buildHud(parts) {
        this.hud.innerHTML = parts.map((p) => `
            <div class="arcade-hud-box ${p.align || ''}">
                <span class="arcade-hud-label">${p.label}</span>
                ${p.lives
                    ? `<span class="arcade-lives" id="${p.id}">${'<i class="fa-solid fa-heart"></i>'.repeat(p.lives)}</span>`
                    : `<span class="arcade-hud-value" id="${p.id}">${p.value ?? '0'}</span>`}
            </div>`).join('');
    },
    setLives(id, left, total) {
        const box = document.getElementById(id);
        if (!box) return;
        [...box.children].forEach((h, i) => h.classList.toggle('lost', i >= left));
    },

    /* ---- fin de partida ---- */
    endSession({ score, stats = [], grade = null, bestValue = null, fmtBest = null }) {
        if (!this.session || this.showingResults) return;
        this.showingResults = true;
        this.sparks = [];
        this.floats = [];
        const game = this.sessionGame;
        const key = this.runBestKey || game.id;
        const value = bestValue !== null ? bestValue : score;
        const prev = bests[key] || 0;
        const isRecord = value > prev;
        if (isRecord) saveBest(key, value);
        const fmt = fmtBest || game.fmtBest || fmtN;
        const rows = stats.map((s) => `<div class="arcade-results-row"><span>${s[0]}</span><b>${s[1]}</b></div>`).join('');
        this.showMsg(`
            <div class="arcade-results">
                ${grade ? `<div class="arcade-results-grade">${grade}</div>` : ''}
                <div class="arcade-results-score">${fmt(score)}</div>
                ${isRecord ? `<span class="arcade-results-record"><i class="fa-solid fa-trophy"></i> ${T('newRecord')}</span>`
                           : `<div class="arcade-results-row" style="justify-content:center;margin-top:6px;"><span>${T('bestLabel')} (${T(DIFF_LABEL[diffOf(game.id)])}): <b>${fmt(Math.max(prev, value))}</b></span></div>`}
                <div class="arcade-results-stats">${rows}</div>
                <div class="arcade-results-actions">
                    <button class="arcade-btn primary" id="arcadeRetry"><i class="fa-solid fa-rotate-right"></i> ${T('retry')}</button>
                    <button class="arcade-btn" id="arcadeToHub"><i class="fa-solid fa-table-cells-large"></i> ${T('hubBtn')}</button>
                </div>
            </div>`, true);
        this.msg.querySelector('#arcadeRetry').addEventListener('click', () => { const id = game.id; this.startRun(id); });
        this.msg.querySelector('#arcadeToHub').addEventListener('click', () => this.toHub());
        haptic(30);
    },

    /* ---- API que reciben los juegos ---- */
    api() {
        const A = this;
        return {
            ctx: A.ctx,
            canvas: A.canvas,
            stage: A.stage,
            audio,
            W: () => A.W,
            H: () => A.H,
            beat: beatNow,
            songNow: () => (A.songClock ? A.songClock() : (audio.currentTime || 0)),
            pointer: () => A.pointer,
            burst: (x, y, o) => A.burst(x, y, o),
            addFloat: (x, y, t, rgb) => A.addFloat(x, y, t, rgb),
            buildHud: (p) => A.buildHud(p),
            setLives: (id, l, t) => A.setLives(id, l, t),
            end: (o) => A.endSession(o),
            T,
            accentRgb,
            rgbStr,
            clamp,
            fmtN,
            haptic,
            glow,
        };
    },

    init() {
        const open = (ev) => { ev.preventDefault(); this.open(); };
        document.getElementById('gamesBtn')?.addEventListener('click', open);
        document.getElementById('npbGames')?.addEventListener('click', open);
    },
};

/* ===================== Pitidos UI (Simon, Tap Tempo) ===================== */
let blipCtx = null;
function warmBlip() {
    try {
        if (!blipCtx) blipCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (blipCtx.state === 'suspended') blipCtx.resume().catch(() => {});
    } catch (e) {}
}
function blip(freq, vol = 0.14, dur = 0.18) {
    try {
        if (!blipCtx) blipCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (blipCtx.state === 'suspended') blipCtx.resume().catch(() => {});
        const o = blipCtx.createOscillator();
        const g = blipCtx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol, blipCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, blipCtx.currentTime + dur);
        o.connect(g);
        g.connect(blipCtx.destination);
        o.start();
        o.stop(blipCtx.currentTime + dur);
    } catch (e) {}
}

/* ==========================================================================
   JUEGO 1 — BEAT TAP (el anillo se cierra exactamente en el golpe)
   ========================================================================== */
Arcade.register({
    id: 'tap',
    icon: 'fa-solid fa-meteor',
    colors: ['0 200 255', '0 102 255'],
    createSession(api, run) {
        const isMobile = Math.min(api.W(), api.H()) < 560;
        const CFG = {
            easy:   { approach: 1.8, maxOn: 3, r: isMobile ? 32 : 38 },
            medium: { approach: 1.5, maxOn: 5, r: isMobile ? 29 : 34 },
            hard:   { approach: 1.25, maxOn: 6, r: isMobile ? 26 : 30 },
            expert: { approach: 1.05, maxOn: 8, r: isMobile ? 23 : 27 },
        }[run.diff];
        const W_P = 0.08, W_G = 0.16, W_X = 0.24;
        const events = run.events;
        const KEYS = (OPTS.tapKeys || ['z', 'x']).map((k) => k.toLowerCase());
        let bIdx = 0;
        const circles = [];
        let score = 0, combo = 0, maxCombo = 0, lives = 3;
        let spawned = 0, hits = 0;
        let lastPos = null;

        // Ráfagas estilo osu!: 3+ eventos muy seguidos se colocan en línea/arco
        // numerados, no vagando al azar por el mapa
        const chainOf = new Array(events.length).fill(-1);
        const chainPos = new Array(events.length).fill(0);
        {
            let cId = -1, start = 0;
            for (let i = 1; i <= events.length; i++) {
                const linked = i < events.length && events[i].t - events[i - 1].t < 0.30;
                if (!linked) {
                    if (i - start >= 3) {
                        cId++;
                        for (let j = start; j < i; j++) { chainOf[j] = cId; chainPos[j] = j - start; }
                    }
                    start = i;
                }
            }
        }
        const chainState = new Map(); // cadena → posición/ángulo del último eslabón

        api.buildHud([
            { label: T('score'), id: 'tapScore', value: '0' },
            { label: T('combo'), id: 'tapCombo', value: '0', align: 'center' },
            { label: T('lives'), id: 'tapLives', lives: 3, align: 'right' },
        ]);
        const elScore = document.getElementById('tapScore');
        const elCombo = document.getElementById('tapCombo');

        function area() {
            const outer = CFG.r * 2.9;
            const mEdge = Math.max(20, api.W() * 0.05);
            return { minX: mEdge + outer, maxX: api.W() - mEdge - outer, minY: 86 + outer, maxY: api.H() - outer - 20 };
        }

        // Posiciones con "flow": el siguiente círculo nace a una distancia
        // alcanzable del anterior, formando un camino jugable (estilo osu!)
        function spawnPos() {
            const b = area();
            for (let tries = 0; tries < 12; tries++) {
                let x, y;
                if (!lastPos || tries > 7) {
                    x = b.minX + Math.random() * (b.maxX - b.minX);
                    y = b.minY + Math.random() * (b.maxY - b.minY);
                } else {
                    const ang = Math.random() * Math.PI * 2;
                    const dist = 150 + Math.random() * 220;
                    x = clamp(lastPos.x + Math.cos(ang) * dist, b.minX, b.maxX);
                    y = clamp(lastPos.y + Math.sin(ang) * dist, b.minY, b.maxY);
                }
                let ok = true;
                for (const c of circles) {
                    if (Math.hypot(c.x - x, c.y - y) < CFG.r * 2.4) { ok = false; break; }
                }
                if (ok) return { x, y };
            }
            return lastPos || { x: api.W() / 2, y: api.H() / 2 };
        }

        function spawn(e, i) {
            const cId = chainOf[i];
            let p;
            if (cId >= 0 && chainState.has(cId)) {
                // siguiente eslabón de la ráfaga: en línea con curva suave
                const st = chainState.get(cId);
                const b = area();
                const step = CFG.r * 2.55;
                st.ang += st.turn;
                p = {
                    x: clamp(st.x + Math.cos(st.ang) * step, b.minX, b.maxX),
                    y: clamp(st.y + Math.sin(st.ang) * step, b.minY, b.maxY),
                };
                if (p.x === b.minX || p.x === b.maxX) st.ang = Math.PI - st.ang; // rebote en bordes
                if (p.y === b.minY || p.y === b.maxY) st.ang = -st.ang;
                st.x = p.x; st.y = p.y;
            } else {
                p = spawnPos();
                if (cId >= 0) chainState.set(cId, { x: p.x, y: p.y, ang: Math.random() * Math.PI * 2, turn: (Math.random() - 0.5) * 0.5 });
            }
            lastPos = p;
            circles.push({ x: p.x, y: p.y, hitT: e.t, r: CFG.r, s: e.s, num: cId >= 0 ? chainPos[i] + 1 : 0 });
            spawned++;
        }

        function miss(c, idx) {
            circles.splice(idx, 1);
            combo = 0;
            lives--;
            api.setLives('tapLives', lives, 3);
            api.addFloat(c.x, c.y, T('miss'), '255 80 110');
            elCombo.textContent = '0';
            elCombo.classList.remove('combo-hot');
            haptic(60);
            if (lives <= 0) finish();
        }

        function finish() {
            const acc = spawned > 0 ? (hits / spawned) * 100 : 0;
            const grade = acc >= 95 ? 'S' : acc >= 88 ? 'A' : acc >= 75 ? 'B' : acc >= 60 ? 'C' : 'D';
            api.end({
                score,
                grade,
                stats: [
                    [T('hits'), `${hits} / ${spawned}`],
                    [T('accuracy'), acc.toFixed(1) + '%'],
                    [T('maxCombo'), 'x' + maxCombo],
                ],
            });
        }

        return {
            frame(dt) {
                const ctx = api.ctx, W = api.W(), H = api.H();
                const now = api.songNow();
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);

                if (beat > 0.02) {
                    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
                    g.addColorStop(0, rgbStr(accentRgb(2), 0.05 + beat * 0.08));
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = g;
                    ctx.fillRect(0, 0, W, H);
                }

                while (bIdx < events.length && events[bIdx].t - now <= CFG.approach) {
                    const e = events[bIdx++];
                    if (e.t <= now + 0.12) continue;
                    if (circles.length >= CFG.maxOn) continue;
                    spawn(e, bIdx - 1);
                }

                for (let i = circles.length - 1; i >= 0; i--) {
                    const c = circles[i];
                    const remain = c.hitT - now;
                    if (remain < -W_X) { miss(c, i); continue; }
                    const k = clamp(remain / CFG.approach, 0, 1);
                    const ringR = c.r + c.r * 1.9 * k;
                    const a1 = accentRgb(1), a2 = accentRgb(2);

                    glow(ctx, c.x, c.y, c.r * 2.1, 'a2', 0.5 + beat * 0.3);
                    const grad = ctx.createRadialGradient(c.x - c.r * 0.3, c.y - c.r * 0.3, c.r * 0.1, c.x, c.y, c.r);
                    grad.addColorStop(0, rgbStr(a1, 0.95));
                    grad.addColorStop(1, rgbStr(a2, 0.82));
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, c.r * (1 + beat * 0.08), 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(c.x, c.y, c.r * (1 + beat * 0.08), 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // número de orden dentro de la ráfaga
                    if (c.num > 0) {
                        ctx.font = `800 ${Math.round(c.r * 0.85)}px Montserrat, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = 'rgba(255,255,255,0.95)';
                        ctx.fillText(c.num, c.x, c.y + 1);
                        ctx.textBaseline = 'alphabetic';
                    }

                    ctx.beginPath();
                    ctx.arc(c.x, c.y, ringR, 0, Math.PI * 2);
                    ctx.strokeStyle = rgbStr(a1, 0.4 + (1 - k) * 0.35 + beat * 0.2);
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                }
            },
            onTap(x, y) {
                const now = api.songNow();
                let bestIdx = -1, bestD = Infinity;
                circles.forEach((c, i) => {
                    const d = Math.hypot(c.x - x, c.y - y);
                    if (d < Math.max(c.r * 1.6, 34) && d < bestD) { bestD = d; bestIdx = i; }
                });
                if (bestIdx < 0) return;
                const c = circles[bestIdx];
                const dtHit = Math.abs(now - c.hitT);
                let pts, label, accent;
                if (dtHit <= W_P) { pts = 300; label = T('perfect'); accent = 1; }
                else if (dtHit <= W_G) { pts = 150; label = T('good'); accent = 2; }
                else { pts = 50; label = T('good'); accent = 2; }
                circles.splice(bestIdx, 1);
                hits++;
                combo++;
                maxCombo = Math.max(maxCombo, combo);
                score += Math.round(pts * (1 + Math.min(combo, 30) * 0.1));
                elScore.textContent = fmtN(score);
                elCombo.textContent = 'x' + combo;
                elCombo.classList.toggle('combo-hot', combo >= 8);
                api.burst(c.x, c.y, { n: pts >= 300 ? 30 : 18, power: pts >= 300 ? 1.25 : 0.9, accent });
                api.addFloat(c.x, c.y, label, accent === 1 ? accentRgb(1) : accentRgb(2));
                haptic(12);
            },
            onKey(ev, down) {
                // teclas de tap (estilo osu!): pulsan donde está el cursor
                if (!down) return;
                if (KEYS.includes(ev.key.toLowerCase())) {
                    const pt = api.pointer();
                    this.onTap(pt.x, pt.y);
                }
            },
            forceEnd() { finish(); },
            destroy() { circles.length = 0; },
        };
    },
});

/* ==========================================================================
   JUEGO 2 — DANIELUX HERO (carriles por banda: graves ⟵ · voz · ⟶ agudos)
   ========================================================================== */
Arcade.register({
    id: 'hero',
    icon: 'fa-solid fa-guitar',
    colors: ['139 92 246', '236 72 153'],
    createSession(api, run) {
        const isTouch = window.matchMedia('(pointer:coarse)').matches;
        const LANES = OPTS.heroLanes;
        const KEYS = (OPTS.heroKeys[LANES] || ['d', 'f', 'j']).slice(0, LANES);
        const LEAD = { easy: 2.0, medium: 1.75, hard: 1.5, expert: 1.3 }[run.diff] * (isTouch ? 0.92 : 1);
        const W_PERFECT = 0.07, W_GOOD = 0.145, W_OK = 0.19;
        const events = run.events;

        let score = 0, combo = 0, maxCombo = 0;
        let nPerfect = 0, nGood = 0, nOk = 0, nMiss = 0;
        const laneFlash = new Array(LANES).fill(0);

        // El carril refleja la BANDA REAL del golpe: graves→izquierda,
        // voz/caja→centro, agudos→derecha. Dentro de cada zona las notas se
        // reparten para usar todos los carriles, pero siempre sobre sonido real:
        // nada inventado, cada nota cae cuando suena su golpe.
        const ZONES = LANES === 3 ? [[0], [1], [2]]
            : LANES === 4 ? [[0, 1], [1, 2], [2, 3]]
            : [[0, 1], [1, 2, 3], [3, 4]];
        const zoneIdx = [0, 0, 0]; // rota dentro de cada zona para esparcir las notas
        let prevLane = -1, prevT = -9;
        const notes = [];
        events.forEach((e, i) => {
            const zone = e.band; // 0 graves · 1 medios/voz · 2 agudos
            const zl = ZONES[zone];
            let lane = zl[zoneIdx[zone]++ % zl.length];
            if (lane === prevLane && e.t - prevT < 0.22) lane = zl[zoneIdx[zone]++ % zl.length];
            notes.push({ t: e.t, lane, s: e.s });
            // acordes en golpes fuertes (solo difícil y experto)
            if ((run.diff === 'hard' || run.diff === 'expert') && e.s > 0.85 && e.t - prevT > 0.4) {
                notes.push({ t: e.t, lane: (lane + 1 + (i % (LANES - 1))) % LANES, s: e.s });
            }
            prevLane = lane;
            prevT = e.t;
        });

        let idx = 0;
        const active = [];
        let totalSpawned = 0;

        api.buildHud([
            { label: T('score'), id: 'heroScore', value: '0' },
            { label: T('combo'), id: 'heroCombo', value: '0', align: 'center' },
            { label: T('accuracy'), id: 'heroAcc', value: '100%', align: 'right' },
        ]);
        const elScore = document.getElementById('heroScore');
        const elCombo = document.getElementById('heroCombo');
        const elAcc = document.getElementById('heroAcc');

        function layout() {
            const W = api.W(), H = api.H();
            const areaW = Math.min(W * 0.92, 170 * LANES);
            return {
                x0: (W - areaW) / 2,
                laneW: areaW / LANES,
                topY: 64,
                hitY: H - (isTouch ? 116 : 96),
            };
        }

        function accuracy() {
            const judged = nPerfect + nGood + nOk + nMiss;
            if (!judged) return 100;
            return ((300 * nPerfect + 150 * nGood + 50 * nOk) / (300 * judged)) * 100;
        }
        function refreshHud() {
            elScore.textContent = fmtN(score);
            elCombo.textContent = combo > 0 ? 'x' + combo : '0';
            elCombo.classList.toggle('combo-hot', combo >= 10);
            elAcc.textContent = accuracy().toFixed(1) + '%';
        }

        function judge(lane) {
            const t = api.songNow();
            const L = layout();
            laneFlash[lane] = 1;
            let best = -1, bestDt = Infinity;
            active.forEach((n, i) => {
                if (n.lane !== lane || n.hit) return;
                const dt = Math.abs(n.t - t);
                if (dt < bestDt) { bestDt = dt; best = i; }
            });
            if (best === -1 || bestDt > W_OK) return;
            const n = active[best];
            n.hit = true;
            let pts, label, accent;
            if (bestDt <= W_PERFECT) { pts = 300; label = T('perfect'); accent = 1; nPerfect++; }
            else if (bestDt <= W_GOOD) { pts = 150; label = T('good'); accent = 2; nGood++; }
            else { pts = 50; label = T('good'); accent = 2; nOk++; }
            combo++;
            maxCombo = Math.max(maxCombo, combo);
            score += Math.round(pts * (1 + Math.min(combo, 40) * 0.08));
            const cx = L.x0 + (n.lane + 0.5) * L.laneW;
            api.burst(cx, L.hitY, { n: pts >= 300 ? 26 : 14, power: pts >= 300 ? 1.2 : 0.8, accent });
            api.addFloat(cx, L.hitY - 36, label, accent === 1 ? accentRgb(1) : accentRgb(2));
            refreshHud();
            haptic(10);
        }

        function finish() {
            const acc = accuracy();
            const grade = acc >= 95 ? 'S' : acc >= 88 ? 'A' : acc >= 75 ? 'B' : acc >= 60 ? 'C' : 'D';
            api.end({
                score,
                grade,
                stats: [
                    [T('perfect'), nPerfect],
                    [T('good'), nGood + nOk],
                    [T('miss'), nMiss],
                    [T('accuracy'), acc.toFixed(1) + '%'],
                    [T('maxCombo'), 'x' + maxCombo],
                ],
            });
        }

        function roundRect(ctx, x, y, w, h, r) {
            if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        return {
            frame(dt) {
                const ctx = api.ctx, W = api.W(), H = api.H();
                const t = api.songNow();
                const L = layout();
                const beat = api.beat();
                // accentRgb lee del DOM: lo cacheamos UNA vez por frame (antes ~40 lecturas)
                const a1 = accentRgb(1), a2 = accentRgb(2);
                const inkLane = ink(0.02), inkBorder = ink(0.09);
                const fh = L.hitY - L.topY + 26;
                const noteH = Math.max(18, Math.min(L.laneW * 0.22, 26));
                ctx.clearRect(0, 0, W, H);

                while (idx < notes.length && notes[idx].t - t < LEAD + 0.2) {
                    const n = notes[idx];
                    if (n.t - t < -0.1) { idx++; continue; }
                    active.push({ t: n.t, lane: n.lane, hit: false });
                    totalSpawned++;
                    idx++;
                }

                // carriles: relleno sólido (sin crear gradiente por frame). El flash
                // se pinta como capa sólida encima solo cuando hay flash.
                for (let l = 0; l < LANES; l++) {
                    const x = L.x0 + l * L.laneW;
                    ctx.fillStyle = inkLane;
                    ctx.fillRect(x + 2, L.topY, L.laneW - 4, fh);
                    if (laneFlash[l] > 0.002) {
                        ctx.fillStyle = rgbStr(l % 2 === 1 ? a2 : a1, laneFlash[l] * 0.16);
                        ctx.fillRect(x + 2, L.topY, L.laneW - 4, fh);
                        laneFlash[l] = Math.max(0, laneFlash[l] - dt * 5);
                    }
                    ctx.strokeStyle = inkBorder;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 2, L.topY, L.laneW - 4, fh);
                }

                ctx.fillStyle = rgbStr(a1, 0.5 + beat * 0.5);
                ctx.fillRect(L.x0 - 8, L.hitY - 2, L.laneW * LANES + 16, 4);
                for (let l = 0; l < LANES; l++) {
                    const x = L.x0 + l * L.laneW;
                    roundRect(ctx, x + 6, L.hitY - noteH / 2, L.laneW - 12, noteH, 8);
                    ctx.strokeStyle = ink(0.25 + laneFlash[l] * 0.55);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    if (!isTouch) {
                        ctx.font = '700 12px Montserrat, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillStyle = ink(0.3 + laneFlash[l] * 0.5);
                        ctx.fillText(keyLabel(KEYS[l] || ''), x + L.laneW / 2, L.hitY + noteH / 2 + 22);
                    }
                }

                // notas: relleno sólido por banda (sin gradiente por nota) + glow cacheado
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = 'rgba(255,255,255,0.55)';
                for (let i = active.length - 1; i >= 0; i--) {
                    const n = active[i];
                    if (n.hit) { active.splice(i, 1); continue; }
                    const dtN = n.t - t;
                    if (dtN < -W_OK) {
                        active.splice(i, 1);
                        nMiss++;
                        combo = 0;
                        const cx = L.x0 + (n.lane + 0.5) * L.laneW;
                        api.addFloat(cx, L.hitY - 26, T('miss'), '255 80 110');
                        refreshHud();
                        haptic(45);
                        continue;
                    }
                    const p = 1 - dtN / LEAD;
                    if (p < -0.02) continue;
                    const y = L.topY + p * (L.hitY - L.topY);
                    const x = L.x0 + n.lane * L.laneW;
                    const odd = n.lane % 2 === 1;
                    glow(ctx, x + L.laneW / 2, y, noteH * 1.7, odd ? 'a2' : 'a1', 0.4 + beat * 0.22);
                    roundRect(ctx, x + 6, y - noteH / 2, L.laneW - 12, noteH, 8);
                    ctx.fillStyle = rgbStr(odd ? a2 : a1, 0.96);
                    ctx.fill();
                    ctx.stroke();
                }

                if (combo >= 5) {
                    ctx.font = `900 ${34 + beat * 8}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillStyle = rgbStr(a1, 0.16 + beat * 0.2);
                    ctx.fillText('x' + combo, W / 2, (L.topY + L.hitY) / 2);
                }

                if (idx >= notes.length && active.length === 0 && totalSpawned > 0) finish();
            },
            onTap(x) {
                const L = layout();
                if (x < L.x0 - 30 || x > L.x0 + L.laneW * LANES + 30) return;
                const lane = clamp(Math.floor((x - L.x0) / L.laneW), 0, LANES - 1);
                judge(lane);
            },
            onKey(ev, down) {
                if (!down) return;
                const lane = KEYS.indexOf(ev.key.toLowerCase());
                if (lane === -1) return;
                judge(lane);
            },
            forceEnd() { if (totalSpawned > 0) finish(); else api.end({ score: 0, stats: [] }); },
            destroy() { active.length = 0; },
        };
    },
});

/* ==========================================================================
   JUEGO 3 — BASS SURFER (las puertas cruzan al jugador en el golpe)
   ========================================================================== */
Arcade.register({
    id: 'surfer',
    icon: 'fa-solid fa-rocket',
    colors: ['0 229 195', '0 162 255'],
    createSession(api, run) {
        const CFG = {
            easy:   { gap: 0.40, gapMin: 0.30, spacing: 0.85, speed: 0.85 },
            medium: { gap: 0.36, gapMin: 0.26, spacing: 0.60, speed: 1.0 },
            hard:   { gap: 0.32, gapMin: 0.22, spacing: 0.45, speed: 1.12 },
            expert: { gap: 0.28, gapMin: 0.19, spacing: 0.34, speed: 1.25 },
        }[run.diff];
        const events = run.events;
        let t = 0, score = 0, gates = 0, lives = 3, invuln = 1.6;
        let holding = false, keyHold = false;
        let bIdx = 0;
        const playerX = () => api.W() * 0.24;
        let py = api.H() * 0.45, vy = 0;
        const trail = [];
        const gatesArr = [];
        let waveBuf = null;

        api.buildHud([
            { label: T('score'), id: 'sfScore', value: '0' },
            { label: T('gates'), id: 'sfGates', value: '0', align: 'center' },
            { label: T('lives'), id: 'sfLives', lives: 3, align: 'right' },
        ]);
        const elScore = document.getElementById('sfScore');
        const elGates = document.getElementById('sfGates');

        function waveY(baseY, amp) {
            const a = window._audioAnalyser;
            const W = api.W();
            const pts = [];
            const N = 64;
            if (a) {
                if (!waveBuf || waveBuf.length !== a.fftSize) waveBuf = new Uint8Array(a.fftSize);
                a.getByteTimeDomainData(waveBuf);
                for (let i = 0; i <= N; i++) {
                    const v = (waveBuf[Math.floor((i / N) * (waveBuf.length - 1))] - 128) / 128;
                    pts.push({ x: (i / N) * W, y: baseY + v * amp });
                }
            } else {
                for (let i = 0; i <= N; i++) {
                    pts.push({ x: (i / N) * W, y: baseY + Math.sin(i * 0.5 + t * 2) * amp * 0.4 });
                }
            }
            return pts;
        }

        function hit() {
            if (invuln > 0) return;
            lives--;
            invuln = 1.6;
            api.setLives('sfLives', lives, 3);
            api.burst(playerX(), py, { n: 30, power: 1.3, accent: 2 });
            haptic(70);
            if (lives <= 0) finish();
        }

        function finish() {
            api.end({
                score,
                stats: [
                    [T('gates'), gates],
                    [T('time'), Math.floor(t) + 's'],
                ],
            });
        }

        return {
            frame(dt) {
                t += dt;
                if (invuln > 0) invuln -= dt;
                const ctx = api.ctx, W = api.W(), H = api.H();
                const now = api.songNow();
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);

                const topY = 70;
                const floorBase = H - 74;
                const px = playerX();

                const k = H / 640;
                const thrust = holding || keyHold || api.pointer().down;
                vy += (thrust ? -2500 : 1700) * k * dt;
                vy = clamp(vy, -560 * k, 620 * k);
                py += vy * dt;
                if (py < topY + 14) { py = topY + 14; vy = Math.max(vy, 0); }

                const wavePts = waveY(floorBase + 18, 26 + beat * 30);
                const floorAt = (x) => {
                    const i = clamp(Math.round((x / W) * (wavePts.length - 1)), 0, wavePts.length - 1);
                    return wavePts[i].y;
                };
                if (py > floorAt(px) - 12) { py = floorAt(px) - 12; vy = -Math.abs(vy) * 0.4; hit(); }

                const speed = (W / 3.4) * CFG.speed * (1 + Math.min(gates, 50) * 0.008);

                const lead = (W + 50 - px) / speed;
                while (bIdx < events.length && events[bIdx].t - now <= lead) {
                    const e = events[bIdx++];
                    if (e.t <= now + 0.25) continue;
                    const last = gatesArr[gatesArr.length - 1];
                    if (last && e.t - last.hitT < CFG.spacing) continue;
                    const gapH = clamp(H * (CFG.gap - Math.min(gates, 40) * 0.002), H * CFG.gapMin, H * CFG.gap);
                    const yMin = topY + 40 + gapH / 2;
                    const yMax = floorBase - 50 - gapH / 2;
                    let gapY = yMin + Math.random() * Math.max(1, yMax - yMin);
                    // hueco siempre ALCANZABLE: limitar el salto vertical respecto a la
                    // puerta anterior según el tiempo disponible entre ambas
                    if (last) {
                        const reach = 360 * k * Math.max(0.25, e.t - last.hitT);
                        gapY = clamp(gapY, last.gapY - reach, last.gapY + reach);
                    }
                    gapY = clamp(gapY, yMin, yMax);
                    gatesArr.push({ x: W + 50, vx: speed, gapY, gapH, w: 26 + e.s * 22, hitT: e.t, passed: false });
                }

                const a1 = accentRgb(1), a2 = accentRgb(2);
                for (let i = gatesArr.length - 1; i >= 0; i--) {
                    const g = gatesArr[i];
                    g.x -= g.vx * dt;
                    if (g.x + g.w < -10) { gatesArr.splice(i, 1); continue; }
                    const yTop = g.gapY - g.gapH / 2;
                    const yBot = g.gapY + g.gapH / 2;

                    const gradT = ctx.createLinearGradient(g.x, 0, g.x + g.w, 0);
                    gradT.addColorStop(0, rgbStr(a2, 0.75));
                    gradT.addColorStop(1, rgbStr(a1, 0.75));
                    ctx.fillStyle = gradT;
                    ctx.fillRect(g.x, topY, g.w, yTop - topY);
                    ctx.fillRect(g.x, yBot, g.w, floorBase - yBot + 18);
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.fillRect(g.x, yTop - 3, g.w, 3);
                    ctx.fillRect(g.x, yBot, g.w, 3);

                    const pr = 12;
                    if (px + pr > g.x && px - pr < g.x + g.w && (py - pr < yTop || py + pr > yBot)) hit();
                    if (!g.passed && g.x + g.w < px - pr) {
                        g.passed = true;
                        gates++;
                        score += 100 + Math.min(gates, 30) * 5;
                        elGates.textContent = gates;
                        api.burst(px, py, { n: 16, power: 0.9, accent: 1 });
                        haptic(10);
                    }
                }

                ctx.beginPath();
                ctx.moveTo(0, H);
                wavePts.forEach((p) => ctx.lineTo(p.x, p.y));
                ctx.lineTo(W, H);
                ctx.closePath();
                const gFloor = ctx.createLinearGradient(0, floorBase - 30, 0, H);
                gFloor.addColorStop(0, rgbStr(a1, 0.32 + beat * 0.3));
                gFloor.addColorStop(1, rgbStr(a2, 0.10));
                ctx.fillStyle = gFloor;
                ctx.fill();
                ctx.beginPath();
                wavePts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
                ctx.strokeStyle = rgbStr(a1, 0.8);
                ctx.lineWidth = 2;
                ctx.stroke();

                trail.push({ x: px, y: py });
                if (trail.length > 22) trail.shift();
                trail.forEach((p, i) => {
                    p.x -= speed * dt;
                    const kk = i / trail.length;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2 + kk * 7, 0, Math.PI * 2);
                    ctx.fillStyle = rgbStr(a2, 0.05 + kk * 0.22);
                    ctx.fill();
                });

                const blink = invuln > 0 && Math.floor(t * 10) % 2 === 0;
                if (!blink) {
                    glow(ctx, px, py, 30 + beat * 14, 'a1', 0.5 + beat * 0.3);
                    const grad = ctx.createRadialGradient(px - 4, py - 4, 2, px, py, 13);
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(0.35, rgbStr(a1, 1));
                    grad.addColorStop(1, rgbStr(a2, 0.9));
                    ctx.beginPath();
                    ctx.arc(px, py, 12 + beat * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                    if (thrust) {
                        ctx.beginPath();
                        ctx.moveTo(px - 5, py + 11);
                        ctx.lineTo(px, py + 24 + beat * 8);
                        ctx.lineTo(px + 5, py + 11);
                        ctx.closePath();
                        ctx.fillStyle = rgbStr(a1, 0.7);
                        ctx.fill();
                    }
                }

                score += dt * 10;
                elScore.textContent = fmtN(score);
            },
            onTap() { holding = true; },
            onRelease() { holding = false; },
            onKey(ev, down) {
                if (ev.key === ' ' || ev.key === 'ArrowUp') keyHold = down;
            },
            forceEnd() { finish(); },
            destroy() { gatesArr.length = 0; trail.length = 0; },
        };
    },
});

/* ==========================================================================
   JUEGO 4 — SIMON BEAT (la secuencia se ilumina al pulso de la rejilla)
   ========================================================================== */
Arcade.register({
    id: 'simon',
    icon: 'fa-solid fa-brain',
    colors: ['244 114 182', '139 92 246'],
    fmtBest: (v) => T('round') + ' ' + v,
    createSession(api, run) {
        const CFG = {
            easy:   { sub: 2, grow: 1, lit: 360 }, // paso cada 2 beats
            medium: { sub: 1, grow: 1, lit: 300 }, // cada beat
            hard:   { sub: 0.5, grow: 1, lit: 220 }, // cada corchea
            expert: { sub: 0.5, grow: 2, lit: 190 }, // corcheas y +2 pasos por ronda
        }[run.diff];
        const map = run.map;
        const stepT = map.beatT * CFG.sub;
        const PADS = [
            { color: '0 200 255', freq: 392 },
            { color: '139 92 246', freq: 494 },
            { color: '236 72 153', freq: 587 },
            { color: '59 130 246', freq: 330 },
        ];
        let seq = [], inputIdx = 0, round = 0;
        let state = 'show';
        let showIdx = 0, stepDue = null;

        const board = document.createElement('div');
        board.className = 'simon-board';
        board.innerHTML = `
            <div class="simon-round" id="simonRound">1</div>
            <div class="simon-status" id="simonStatus">${T('watch')}</div>
            <div class="simon-pads">
                ${PADS.map((p, i) => `<button class="simon-pad" data-pad="${i}" style="--pad-color: rgb(${p.color.split(/\s+/).join(',')})"></button>`).join('')}
            </div>`;
        api.stage.appendChild(board);
        const pads = [...board.querySelectorAll('.simon-pad')];
        const elRound = board.querySelector('#simonRound');
        const elStatus = board.querySelector('#simonStatus');

        function light(i, ms = CFG.lit) {
            pads[i].classList.add('lit');
            blip(PADS[i].freq);
            setTimeout(() => pads[i].classList.remove('lit'), ms);
        }

        // siguiente instante de la rejilla (o sub-rejilla) después de "after"
        function nextStep(after) {
            const phase = map.grid.length ? map.grid[0] : 0;
            const n = Math.ceil((after - phase) / stepT);
            return phase + n * stepT;
        }

        function nextRound() {
            round++;
            elRound.textContent = round;
            for (let i = 0; i < CFG.grow; i++) seq.push(Math.floor(Math.random() * 4));
            inputIdx = 0;
            showIdx = 0;
            state = 'show';
            stepDue = nextStep(api.songNow() + 0.5);
            elStatus.textContent = T('watch');
            elStatus.classList.remove('your-turn');
        }

        function finish() {
            state = 'dead';
            api.end({
                score: Math.max(0, round - 1),
                bestValue: Math.max(0, round - 1),
                fmtBest: (v) => T('round') + ' ' + v,
                stats: [[T('round'), Math.max(0, round - 1)]],
            });
        }

        pads.forEach((pad, i) => {
            pad.addEventListener('pointerdown', (ev) => {
                ev.stopPropagation();
                if (state !== 'input') return;
                light(i, 220);
                haptic(12);
                if (seq[inputIdx] === i) {
                    inputIdx++;
                    if (inputIdx >= seq.length) {
                        elStatus.textContent = '✓';
                        state = 'pause';
                        setTimeout(() => { if (state === 'pause') nextRound(); }, 700);
                    }
                } else {
                    pad.classList.add('wrong');
                    blip(140, 0.2, 0.45);
                    haptic(120);
                    setTimeout(finish, 500);
                }
            });
        });

        nextRound();

        return {
            frame(dt) {
                const ctx = api.ctx, W = api.W(), H = api.H();
                const now = api.songNow();
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);
                const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.55);
                g.addColorStop(0, rgbStr(accentRgb(2), 0.04 + beat * 0.07));
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);

                if (state !== 'show') return;
                if (now >= stepDue) {
                    if (showIdx < seq.length) {
                        light(seq[showIdx]);
                        showIdx++;
                        stepDue = nextStep(now + stepT * 0.5);
                    } else {
                        state = 'input';
                        inputIdx = 0;
                        elStatus.textContent = T('yourTurn');
                        elStatus.classList.add('your-turn');
                    }
                }
            },
            forceEnd() { finish(); },
            destroy() { board.remove(); },
        };
    },
});

/* ==========================================================================
   JUEGO 5 — BEAT DODGER (ondas legibles que detonan en el golpe)
   ========================================================================== */
Arcade.register({
    id: 'dodger',
    icon: 'fa-solid fa-shield-halved',
    colors: ['255 77 109', '255 159 28'],
    createSession(api, run) {
        // La dificultad es sobre todo VELOCIDAD de expansión; también la
        // separación entre ondas, cuántas hay a la vez y su radio máximo
        const CFG = {
            easy:   { speed: 105, maxOn: 3, band: 11, maxR: 0.25, gap: 1.10 },
            medium: { speed: 155, maxOn: 4, band: 12, maxR: 0.29, gap: 0.80 },
            hard:   { speed: 215, maxOn: 6, band: 13, maxR: 0.33, gap: 0.55 },
            expert: { speed: 285, maxOn: 8, band: 14, maxR: 0.36, gap: 0.40 },
        }[run.diff];
        const events = run.events;
        let t = 0, score = 0, lives = 3, invuln = 1.4, dodged = 0, shake = 0;
        let px = api.W() / 2, py = api.H() * 0.55, tx = px, ty = py;
        const rings = [];
        const TELEGRAPH = 0.6; // el aviso dura más de medio segundo: siempre legible
        const PR = 11;
        let bIdx = 0, lastSpawnT = -9;

        api.buildHud([
            { label: T('score'), id: 'dgScore', value: '0' },
            { label: T('time'), id: 'dgTime', value: '0s', align: 'center' },
            { label: T('lives'), id: 'dgLives', lives: 3, align: 'right' },
        ]);
        const elScore = document.getElementById('dgScore');
        const elTime = document.getElementById('dgTime');

        function spawn(e) {
            if (rings.length >= CFG.maxOn) return;
            const W = api.W(), H = api.H();
            // las ondas mueren a un % de la diagonal según dificultad: esquivables alejándose
            const maxR = Math.hypot(W, H) * CFG.maxR;
            let cx, cy;
            for (let i = 0; i < 12; i++) {
                cx = 30 + Math.random() * (W - 60);
                cy = 86 + Math.random() * (H - 120);
                if (Math.hypot(cx - px, cy - py) > 200) break;
            }
            rings.push({
                cx, cy,
                r: 0,
                speed: CFG.speed + e.s * 90 + Math.min(t, 90) * 1.1,
                band: CFG.band,
                hitT: e.t,
                maxR,
                done: false,
            });
        }

        function hitPlayer() {
            if (invuln > 0) return;
            lives--;
            invuln = 1.5;
            shake = 0.3;
            api.setLives('dgLives', lives, 3);
            api.burst(px, py, { n: 34, power: 1.4, accent: 2 });
            haptic(80);
            if (lives <= 0) finish();
        }

        function finish() {
            api.end({
                score: Math.round(score),
                stats: [
                    [T('time'), Math.floor(t) + 's'],
                    ['💨', dodged],
                ],
            });
        }

        return {
            frame(dt) {
                t += dt;
                if (invuln > 0) invuln -= dt;
                if (shake > 0) shake -= dt;
                score += dt * 10;
                const ctx = api.ctx, W = api.W(), H = api.H();
                const now = api.songNow();
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);
                ctx.save();
                if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 26, (Math.random() - 0.5) * shake * 26);

                const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
                g.addColorStop(0, rgbStr(accentRgb(2), 0.04 + beat * 0.07));
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);

                while (bIdx < events.length && events[bIdx].t - now <= TELEGRAPH) {
                    const e = events[bIdx++];
                    if (e.t <= now + 0.05) continue;
                    if (e.t - lastSpawnT < CFG.gap) continue; // ritmo de aparición según dificultad
                    lastSpawnT = e.t;
                    spawn(e);
                }

                px += (tx - px) * Math.min(1, dt * 11);
                py += (ty - py) * Math.min(1, dt * 11);
                px = clamp(px, PR, W - PR);
                py = clamp(py, 70 + PR, H - PR);

                const a1 = accentRgb(1), a2 = accentRgb(2);

                for (let i = rings.length - 1; i >= 0; i--) {
                    const r = rings[i];
                    const live = now >= r.hitT;
                    if (live) r.r = (now - r.hitT) * r.speed + 10;
                    if (r.r > r.maxR) {
                        if (!r.done) { dodged++; score += 25; }
                        rings.splice(i, 1);
                        continue;
                    }
                    if (!live) {
                        const prog = clamp(1 - (r.hitT - now) / TELEGRAPH, 0, 1);
                        ctx.beginPath();
                        ctx.arc(r.cx, r.cy, 10 + prog * 20, 0, Math.PI * 2);
                        ctx.strokeStyle = rgbStr(a2, 0.18 + prog * 0.42);
                        ctx.lineWidth = 2;
                        ctx.setLineDash([6, 8]);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.beginPath();
                        ctx.arc(r.cx, r.cy, 4 + prog * 3, 0, Math.PI * 2);
                        ctx.fillStyle = rgbStr(a2, 0.4 + prog * 0.5);
                        ctx.fill();
                        continue;
                    }
                    const fade = 1 - (r.r / r.maxR) * 0.45; // se desvanece al expandirse
                    ctx.beginPath();
                    ctx.arc(r.cx, r.cy, Math.max(r.r, 1), 0, Math.PI * 2);
                    ctx.strokeStyle = rgbStr(a1, 0.85 * fade);
                    ctx.lineWidth = r.band;
                    ctx.stroke();
                    if (!r.done && invuln <= 0) {
                        const d = Math.hypot(px - r.cx, py - r.cy);
                        if (Math.abs(d - r.r) < r.band / 2 + PR) {
                            r.done = true;
                            hitPlayer();
                        }
                    }
                }

                const blink = invuln > 0 && Math.floor(t * 10) % 2 === 0;
                if (!blink) {
                    glow(ctx, px, py, PR * 2.4 + beat * 12, 'a1', 0.5 + beat * 0.3);
                    const grad = ctx.createRadialGradient(px - 4, py - 4, 2, px, py, PR + 2);
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(0.35, rgbStr(a1, 1));
                    grad.addColorStop(1, rgbStr(a2, 0.9));
                    ctx.beginPath();
                    ctx.arc(px, py, PR + beat * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                }
                ctx.restore();

                elScore.textContent = fmtN(score);
                elTime.textContent = Math.floor(t) + 's';
            },
            onTap(x, y) { tx = x; ty = y; },
            onMove(x, y) { tx = x; ty = y; },
            forceEnd() { finish(); },
            destroy() { rings.length = 0; },
        };
    },
});

/* ==========================================================================
   JUEGO 6 — TAP TEMPO (el BPM objetivo sale del análisis: estable y exacto)
   ========================================================================== */
Arcade.register({
    id: 'tempo',
    icon: 'fa-solid fa-drum',
    colors: ['163 230 53', '0 200 255'],
    fmtBest: (v) => v + '%',
    createSession(api, run) {
        const targetBpm = run.map.bpm;
        // Dificultad real: más toques, puntuación más estricta y menos ayudas
        // (Difícil: sin feedback en vivo · Experto: además, BPM objetivo oculto)
        const CFG = {
            easy:   { taps: 10, prec: 2.5, live: true,  showTarget: true },
            medium: { taps: 14, prec: 4,   live: true,  showTarget: true },
            hard:   { taps: 14, prec: 5.5, live: false, showTarget: true },
            expert: { taps: 16, prec: 7,   live: false, showTarget: false },
        }[run.diff];
        let t = 0;
        const tapTimes = [];
        const MAX_TAPS = CFG.taps;
        let ended = false;

        const board = document.createElement('div');
        board.className = 'tempo-board';
        board.innerHTML = `
            <div class="tempo-readout">
                <div class="t-block"><span class="t-label">${T('target')} BPM</span><span class="t-value" id="tpTarget">${CFG.showTarget ? Math.round(targetBpm) : '???'}</span></div>
                <div class="t-block"><span class="t-label">${T('you')} BPM</span><span class="t-value you" id="tpYou">—</span></div>
            </div>
            <button class="tempo-tap-btn" id="tpBtn">TAP</button>
            <div class="tempo-feedback" id="tpFeed"></div>
            <div class="simon-status" id="tpCount">0 / ${MAX_TAPS} · ${T('tempoHint')}</div>`;
        api.stage.appendChild(board);
        const elYou = board.querySelector('#tpYou');
        const elFeed = board.querySelector('#tpFeed');
        const elCount = board.querySelector('#tpCount');
        const btn = board.querySelector('#tpBtn');

        const fold = (bpm) => {
            if (!bpm || !isFinite(bpm)) return null;
            while (bpm < 70) bpm *= 2;
            while (bpm >= 180) bpm /= 2;
            return bpm;
        };
        function userBpm() {
            if (tapTimes.length < 4) return null;
            const iv = [];
            const recent = tapTimes.slice(-9);
            for (let i = 1; i < recent.length; i++) iv.push(recent[i] - recent[i - 1]);
            iv.sort((a, b) => a - b);
            return fold(60 / iv[Math.floor(iv.length / 2)]);
        }

        function match() {
            const ub = userBpm();
            if (!ub) return null;
            const diff = Math.min(
                Math.abs(targetBpm - ub),
                Math.abs(targetBpm - ub * 2),
                Math.abs(targetBpm - ub / 2)
            );
            return Math.max(0, Math.round(100 - diff * CFG.prec));
        }

        function refresh() {
            const ub = userBpm(), m = match();
            elYou.textContent = CFG.live ? (ub ? Math.round(ub) : '—') : (ub ? '?' : '—');
            elCount.textContent = Math.min(tapTimes.length, MAX_TAPS) + ' / ' + MAX_TAPS;
            if (!CFG.live || m === null) elFeed.textContent = '';
            else if (m >= 92) elFeed.textContent = T('tempoSpot') + ' · ' + m + '%';
            else if (m >= 75) elFeed.textContent = T('tempoClose') + ' · ' + m + '%';
            else elFeed.textContent = T('tempoFar') + ' · ' + m + '%';
        }

        function finish() {
            if (ended) return;
            ended = true;
            const m = match() || 0;
            const grade = m >= 95 ? 'S' : m >= 88 ? 'A' : m >= 75 ? 'B' : m >= 60 ? 'C' : 'D';
            api.end({
                score: m,
                grade,
                fmtBest: (v) => v + '%',
                stats: [
                    [T('you') + ' BPM', userBpm() ? Math.round(userBpm()) : '—'],
                    [T('target') + ' BPM', Math.round(targetBpm)],
                    [T('taps'), tapTimes.length],
                ],
            });
        }

        function doTap() {
            if (ended) return;
            if (tapTimes.length && t - tapTimes[tapTimes.length - 1] > 2.5) tapTimes.length = 0;
            tapTimes.push(t);
            btn.style.transform = 'scale(0.93)';
            setTimeout(() => { btn.style.transform = ''; }, 90);
            blip(660, 0.07, 0.07);
            haptic(10);
            api.burst(api.W() / 2, api.H() / 2, { n: 8, power: 0.5, accent: 1 });
            refresh();
            if (tapTimes.length >= MAX_TAPS && match() !== null) setTimeout(finish, 400);
        }

        btn.addEventListener('pointerdown', (ev) => {
            ev.stopPropagation();
            doTap();
        });

        return {
            frame(dt) {
                t += dt;
                const ctx = api.ctx, W = api.W(), H = api.H();
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);
                const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.55);
                g.addColorStop(0, rgbStr(accentRgb(1), 0.03 + beat * 0.09));
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);
            },
            onKey(ev, down) {
                if (down && (ev.key === ' ' || ev.code === 'Space')) doTap();
            },
            forceEnd() { finish(); },
            destroy() { board.remove(); },
        };
    },
});

/* ==========================================================================
   JUEGO 7 — BASS INVADERS (naves que bajan en los golpes; jefe en los drops)
   Las naves nacen en cada golpe real de la canción (su banda decide el tipo).
   Los DROPS se detectan con la curva de energía: tramos de grave alto y
   sostenido donde aparece un jefe que crece y dispara según esa energía.
   ========================================================================== */
function findDrops(map) {
    const e = map.energy, hopT = map.hopT;
    if (!e || !e.length) return [];
    const n = e.length;
    const W = Math.max(1, Math.round(0.4 / hopT));
    const sm = new Float32Array(n); // energía suavizada (±0.4 s)
    let acc = 0, lo = 0, hi = -1;
    for (let i = 0; i < n; i++) {
        const a = Math.max(0, i - W), b = Math.min(n - 1, i + W);
        while (hi < b) acc += e[++hi];
        while (lo < a) acc -= e[lo++];
        sm[i] = acc / (b - a + 1);
    }
    const sorted = Array.from(sm).sort((x, y) => x - y);
    const thr = Math.max(0.5, sorted[Math.floor(n * 0.72)] || 0.5);
    const drops = [];
    let start = -1;
    for (let i = 0; i < n; i++) {
        if (sm[i] >= thr) { if (start < 0) start = i; }
        else { if (start >= 0 && (i - start) * hopT >= 6) drops.push({ t0: start * hopT, t1: i * hopT }); start = -1; }
    }
    if (start >= 0 && (n - start) * hopT >= 6) drops.push({ t0: start * hopT, t1: n * hopT });
    return drops;
}

Arcade.register({
    id: 'bass',
    icon: 'fa-solid fa-shuttle-space',
    colors: ['99 102 241', '34 211 238'],
    createSession(api, run) {
        const isTouch = window.matchMedia('(pointer:coarse)').matches;
        const CFG = {
            easy:   { fall: 2.4, bulletGap: 0.15, bossFire: 0.90, bossSpd: 85,  bossHpK: 2.2 },
            medium: { fall: 2.0, bulletGap: 0.15, bossFire: 0.62, bossSpd: 115, bossHpK: 2.8 },
            hard:   { fall: 1.6, bulletGap: 0.14, bossFire: 0.46, bossSpd: 150, bossHpK: 3.4 },
            expert: { fall: 1.3, bulletGap: 0.13, bossFire: 0.35, bossSpd: 185, bossHpK: 4.0 },
        }[run.diff];
        const events = run.events;
        const drops = findDrops(run.map);
        const energyAt = run.map.energyAt || (() => 0);

        let bIdx = 0, dropIdx = 0;
        let score = 0, combo = 0, maxCombo = 0, lives = 3, invuln = 1.2;
        let kills = 0, spawned = 0, shake = 0, t = 0, fireT = 0;
        const invaders = [];   // {x,y,vy,r,hp,band,s}
        const bullets = [];    // balas del jugador (suben)
        const foeShots = [];   // proyectiles del jefe
        let boss = null;       // {x,y,vx,hp,maxHp,fireT,t1}

        let px = api.W() / 2, py = api.H() - 46, targetX = px;
        const keyLeft = { on: false }, keyRight = { on: false };

        const stars = [];
        for (let i = 0; i < 64; i++) stars.push({ x: Math.random() * api.W(), y: Math.random() * api.H(), z: 0.3 + Math.random() * 1.4, r: Math.random() * 1.4 + 0.4 });

        api.buildHud([
            { label: T('score'), id: 'biScore', value: '0' },
            { label: T('combo'), id: 'biCombo', value: '0', align: 'center' },
            { label: T('lives'), id: 'biLives', lives: 3, align: 'right' },
        ]);
        const elScore = document.getElementById('biScore');
        const elCombo = document.getElementById('biCombo');

        const topLine = () => 58;
        const bottomLine = () => api.H() - 72;
        const bandColor = (b) => (b === 0 ? accentRgb(2) : b === 1 ? accentRgb(1) : '255 255 255');
        const bandRadius = (b) => (b === 0 ? (isTouch ? 17 : 19) : b === 1 ? (isTouch ? 14 : 15) : (isTouch ? 11 : 12));

        function spawnInvader(e) {
            const r = bandRadius(e.band);
            const margin = r + 14;
            const x = margin + Math.random() * (api.W() - 2 * margin);
            const fall = CFG.fall * (e.band === 0 ? 1.15 : e.band === 2 ? 0.85 : 1);
            const vy = (bottomLine() - topLine()) / fall;
            const hp = (e.band === 0 && (run.diff === 'hard' || run.diff === 'expert')) ? 2 : 1;
            invaders.push({ x, y: topLine(), vy, r, hp, band: e.band, s: e.s });
            spawned++;
        }

        function startBoss(drop) {
            const dur = drop.t1 - drop.t0;
            boss = { x: api.W() / 2, y: topLine() + 46, vx: CFG.bossSpd, fireT: 0.5, t1: drop.t1,
                maxHp: Math.round(clamp(dur * CFG.bossHpK, 16, 120)) };
            boss.hp = boss.maxHp;
            api.addFloat(api.W() / 2, api.H() * 0.4, T('bossIncoming'), accentRgb(2));
            haptic(40);
        }

        function loseLife(cx, cy) {
            if (invuln > 0) return;
            lives--; invuln = 1.4; shake = 0.32; combo = 0;
            elCombo.textContent = '0'; elCombo.classList.remove('combo-hot');
            api.setLives('biLives', lives, 3);
            api.burst(cx, cy, { n: 30, power: 1.3, accent: 2 });
            haptic(80);
            if (lives <= 0) finish();
        }

        function finish() {
            const acc = spawned > 0 ? (kills / spawned) * 100 : 0;
            const grade = acc >= 92 ? 'S' : acc >= 82 ? 'A' : acc >= 68 ? 'B' : acc >= 50 ? 'C' : 'D';
            api.end({ score, grade, stats: [
                [T('hits'), `${kills} / ${spawned}`],
                [T('accuracy'), acc.toFixed(1) + '%'],
                [T('maxCombo'), 'x' + maxCombo],
            ] });
        }

        function killInvader(inv, idx) {
            invaders.splice(idx, 1);
            kills++; combo++; maxCombo = Math.max(maxCombo, combo);
            score += Math.round(100 * (1 + Math.min(combo, 30) * 0.1));
            elScore.textContent = fmtN(score);
            elCombo.textContent = 'x' + combo;
            elCombo.classList.toggle('combo-hot', combo >= 8);
            api.burst(inv.x, inv.y, { n: 16, power: 0.9, accent: inv.band === 0 ? 2 : 1 });
        }

        function drawShip(ctx, x, y, r, rgb, beat, flip, gkey) {
            glow(ctx, x, y, r * 1.9, gkey, 0.45 + beat * 0.3);
            ctx.save();
            ctx.translate(x, y);
            const s = flip ? -1 : 1;
            ctx.beginPath();
            ctx.moveTo(0, -r * s);
            ctx.lineTo(r * 0.85, r * 0.7 * s);
            ctx.lineTo(0, r * 0.35 * s);
            ctx.lineTo(-r * 0.85, r * 0.7 * s);
            ctx.closePath();
            ctx.fillStyle = rgbStr(rgb, 0.95);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        return {
            frame(dt) {
                t += dt;
                if (invuln > 0) invuln -= dt;
                if (shake > 0) shake -= dt;
                const ctx = api.ctx, W = api.W(), H = api.H();
                const now = api.songNow();
                const beat = api.beat();
                const a1 = accentRgb(1), a2 = accentRgb(2);
                ctx.clearRect(0, 0, W, H);
                ctx.save();
                if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 22, (Math.random() - 0.5) * shake * 22);

                // starfield reactivo (warp en los golpes)
                for (const st of stars) {
                    st.y += st.z * (40 + beat * 240) * dt;
                    if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
                    ctx.beginPath();
                    ctx.arc(st.x, st.y % H, st.r * (1 + beat * 0.5), 0, Math.PI * 2);
                    ctx.fillStyle = ink(0.10 + st.z * 0.16 + beat * 0.18);
                    ctx.fill();
                }

                // ¿drop? → jefe (uno por drop)
                while (dropIdx < drops.length && now >= drops[dropIdx].t0) {
                    if (!boss && now < drops[dropIdx].t1) startBoss(drops[dropIdx]);
                    dropIdx++;
                }
                if (boss && now >= boss.t1) boss = null; // el drop acaba sin matarlo

                // naves en los golpes reales
                while (bIdx < events.length && events[bIdx].t <= now) {
                    const e = events[bIdx++];
                    if (now - e.t > 0.25) continue;
                    if (invaders.length < 22) spawnInvader(e);
                }

                // jugador
                if (keyLeft.on) targetX -= 520 * dt;
                if (keyRight.on) targetX += 520 * dt;
                targetX = clamp(targetX, 24, W - 24);
                px += (targetX - px) * Math.min(1, dt * 14);
                py = H - 46;

                // disparo automático
                fireT -= dt;
                if (fireT <= 0) { fireT = CFG.bulletGap; bullets.push({ x: px, y: py - 18 }); blip(880, 0.016, 0.05); }

                // balas del jugador
                for (let i = bullets.length - 1; i >= 0; i--) {
                    const b = bullets[i];
                    b.y -= 720 * dt;
                    if (b.y < -10) { bullets.splice(i, 1); continue; }
                    if (boss && Math.abs(b.x - boss.x) < 34 && Math.abs(b.y - boss.y) < 26) {
                        bullets.splice(i, 1); boss.hp--; score += 20;
                        api.burst(b.x, b.y, { n: 4, power: 0.5, accent: 1 });
                        if (boss.hp <= 0) {
                            api.burst(boss.x, boss.y, { n: 60, power: 1.8, accent: 2 });
                            score += 2500; api.addFloat(boss.x, boss.y, '+2500', accentRgb(1));
                            boss = null; shake = 0.4; haptic(120);
                        }
                        continue;
                    }
                    let hit = -1;
                    for (let j = 0; j < invaders.length; j++) {
                        const dx = invaders[j].x - b.x, dy = invaders[j].y - b.y, rr = invaders[j].r + 4;
                        if (dx * dx + dy * dy < rr * rr) { hit = j; break; } // distancia al cuadrado: sin sqrt
                    }
                    if (hit >= 0) {
                        bullets.splice(i, 1);
                        const inv = invaders[hit];
                        if (--inv.hp <= 0) killInvader(inv, hit);
                        else api.burst(b.x, b.y, { n: 4, power: 0.5, accent: 1 });
                    }
                }
                // todas las balas en UN solo path + fill (sin shadowBlur)
                if (bullets.length) {
                    ctx.beginPath();
                    for (const b of bullets) {
                        if (ctx.roundRect) ctx.roundRect(b.x - 1.6, b.y - 8, 3.2, 12, 1.6); else ctx.rect(b.x - 1.6, b.y - 8, 3.2, 12);
                    }
                    ctx.fillStyle = rgbStr(a1, 0.95);
                    ctx.fill();
                }

                // naves: mover, colisión, dibujar
                for (let i = invaders.length - 1; i >= 0; i--) {
                    const inv = invaders[i];
                    inv.y += inv.vy * dt;
                    const dx = inv.x - px, dy = inv.y - py, rr = inv.r + 16;
                    if (dx * dx + dy * dy < rr * rr) { invaders.splice(i, 1); loseLife(inv.x, inv.y); continue; }
                    if (inv.y > bottomLine() + 8) { invaders.splice(i, 1); loseLife(inv.x, bottomLine()); continue; }
                    const rgb = bandColor(inv.band);
                    drawShip(ctx, inv.x, inv.y, inv.r, rgb, beat, true, inv.band === 0 ? 'a2' : inv.band === 1 ? 'a1' : 'w');
                    if (inv.hp > 1) {
                        ctx.beginPath(); ctx.arc(inv.x, inv.y, inv.r + 3, 0, Math.PI * 2);
                        ctx.strokeStyle = rgbStr(rgb, 0.5); ctx.lineWidth = 1.5; ctx.stroke();
                    }
                }

                // jefe
                if (boss) {
                    boss.x += boss.vx * dt;
                    if (boss.x < 60) { boss.x = 60; boss.vx = Math.abs(boss.vx); }
                    if (boss.x > W - 60) { boss.x = W - 60; boss.vx = -Math.abs(boss.vx); }
                    const en = clamp(energyAt(now), 0, 1);
                    boss.fireT -= dt;
                    if (boss.fireT <= 0) {
                        boss.fireT = CFG.bossFire * (1.2 - en * 0.6);
                        const spread = run.diff === 'expert' ? 3 : run.diff === 'hard' ? 2 : 1;
                        for (let k = 0; k < spread; k++) {
                            const ang = Math.atan2(py - boss.y, px - boss.x) + (k - (spread - 1) / 2) * 0.26;
                            const sp = 230 + en * 160;
                            foeShots.push({ x: boss.x, y: boss.y + 24, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp });
                        }
                        blip(120, 0.05, 0.12);
                    }
                    const R = 40 + en * 10 + beat * 6;
                    glow(ctx, boss.x, boss.y, R * 1.8, 'a2', 0.55 + en * 0.3);
                    ctx.save();
                    ctx.translate(boss.x, boss.y);
                    ctx.beginPath();
                    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; ctx[k ? 'lineTo' : 'moveTo'](Math.cos(a) * R, Math.sin(a) * R * 0.7); }
                    ctx.closePath();
                    const g = ctx.createRadialGradient(0, -8, 4, 0, 0, R);
                    g.addColorStop(0, rgbStr(a1, 0.95));
                    g.addColorStop(1, rgbStr(a2, 0.9));
                    ctx.fillStyle = g;
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.restore();
                    const bw = Math.min(W * 0.6, 320), bx = (W - bw) / 2, by = topLine() - 14;
                    ctx.fillStyle = ink(0.12); ctx.fillRect(bx, by, bw, 6);
                    ctx.fillStyle = rgbStr(a1, 0.95); ctx.fillRect(bx, by, bw * (boss.hp / boss.maxHp), 6);
                }

                // proyectiles del jefe (un solo path + fill, distancia al cuadrado)
                if (foeShots.length) {
                    const fr = 5 + beat * 1.5;
                    ctx.beginPath();
                    for (let i = foeShots.length - 1; i >= 0; i--) {
                        const f = foeShots[i];
                        f.x += f.vx * dt; f.y += f.vy * dt;
                        if (f.y > H + 12 || f.x < -12 || f.x > W + 12) { foeShots.splice(i, 1); continue; }
                        const dx = f.x - px, dy = f.y - py;
                        if (invuln <= 0 && dx * dx + dy * dy < 256) { foeShots.splice(i, 1); loseLife(px, py); continue; }
                        ctx.moveTo(f.x + fr, f.y);
                        ctx.arc(f.x, f.y, fr, 0, Math.PI * 2);
                    }
                    ctx.fillStyle = rgbStr(a2, 0.95);
                    ctx.fill();
                }

                // jugador
                const blink = invuln > 0 && Math.floor(t * 12) % 2 === 0;
                if (!blink) {
                    drawShip(ctx, px, py, 16, a1, beat, false, 'a1');
                    ctx.beginPath();
                    ctx.moveTo(px - 5, py + 11);
                    ctx.lineTo(px, py + 18 + beat * 8 + Math.random() * 4);
                    ctx.lineTo(px + 5, py + 11);
                    ctx.closePath();
                    ctx.fillStyle = rgbStr(a2, 0.7); ctx.fill();
                }

                ctx.restore();
                score += dt * 4;
                elScore.textContent = fmtN(score);
            },
            onTap(x) { targetX = x; },
            onMove(x) { targetX = x; },
            onKey(ev, down) {
                const k = ev.key.toLowerCase();
                if (k === 'arrowleft' || k === 'a') keyLeft.on = down;
                else if (k === 'arrowright' || k === 'd') keyRight.on = down;
            },
            forceEnd() { finish(); },
            destroy() { invaders.length = 0; bullets.length = 0; foeShots.length = 0; boss = null; },
        };
    },
});

Arcade.init();
})();
