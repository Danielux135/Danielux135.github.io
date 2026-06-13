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
        promoBadge: '7 minijuegos',
        promoLine1: '¡Prueba mis', promoLine2: 'minijuegos musicales!',
        promoSub: 'Generados en tiempo real con los golpes de cada canción. Sin descargas, sin registro.',
        promoBtn: 'Jugar ahora',
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
            tap:    { name: 'Beat Striker',   desc: 'Cada golpe lanza un círculo: tócalo justo cuando el anillo se cierre.', how: 'El anillo se cierra en el golpe. Toca en ese instante. 3 vidas.' },
            hero:   { name: 'Hero Mode',      desc: 'Notas generadas con los golpes reales: graves a la izquierda, voz al centro, agudos a la derecha.', how: 'Pulsa la tecla del carril (o tócalo) cuando la nota cruce la línea.' },
            surfer: { name: 'Wave Rider',     desc: 'Surfea la onda: mantén pulsado para subir. Las puertas llegan clavadas al ritmo.', how: 'Mantén pulsado (o ESPACIO) para subir. Suelta para caer. 3 vidas.' },
            simon:  { name: 'Echo Sequence',  desc: 'Memoriza la secuencia que se ilumina al pulso de la música y repítela sin fallar.', how: 'Observa la secuencia y repítela tocando los pads.' },
            dodger: { name: 'Ring Escape',    desc: 'Cada golpe detona una onda expansiva. Arrastra tu orbe y sobrevive.', how: 'Arrastra el orbe para esquivar las ondas. 3 vidas.' },
            tempo:  { name: 'BPM Hunter',     desc: '¿Tienes ritmo de verdad? Sigue el pulso de la canción y compara tu BPM con el real.', how: 'Toca el botón grande (o la barra espaciadora) al ritmo. Mínimo 8 toques.' },
            bass:   { name: 'Bass Invaders',  desc: 'Naves que bajan con cada golpe. En los drops aparece un jefe que crece con la energía.', how: 'Mueve la nave (arrastra, A/D o flechas). El disparo es automático. 3 vidas.' },
        },
    },
    en: {
        open: 'Mini-games',
        promoBadge: '7 mini-games',
        promoLine1: 'Try my', promoLine2: 'music mini-games!',
        promoSub: 'Generated in real time from the beats of each song. No downloads, no sign-up.',
        promoBtn: 'Play now',
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
            tap:    { name: 'Beat Striker',   desc: 'Every hit fires a circle: tap it right when the ring closes.', how: 'The ring closes on the hit. Tap at that instant. 3 lives.' },
            hero:   { name: 'Hero Mode',      desc: 'Notes built from real hits: bass on the left, vocals center, highs on the right.', how: 'Press the lane key (or tap it) when the note crosses the line.' },
            surfer: { name: 'Wave Rider',     desc: 'Surf the wave: hold to rise. The gates arrive dead on the beat.', how: 'Hold (or SPACE) to rise. Release to fall. 3 lives.' },
            simon:  { name: 'Echo Sequence',  desc: 'Memorize the sequence that lights up on the beat and repeat it without failing.', how: 'Watch the sequence, then repeat it by tapping the pads.' },
            dodger: { name: 'Ring Escape',    desc: 'Every hit detonates an expanding wave. Drag your orb and survive.', how: 'Drag the orb to dodge the waves. 3 lives.' },
            tempo:  { name: 'BPM Hunter',     desc: 'Got real rhythm? Follow the pulse and compare your BPM with the real one.', how: 'Tap the big button (or space bar) to the beat. At least 8 taps.' },
            bass:   { name: 'Bass Invaders',  desc: 'Ships descend with every hit. On drops a boss appears, growing with the energy.', how: 'Move the ship (drag, A/D or arrows). Firing is automatic. 3 lives.' },
        },
    },
    val: {
        open: 'Minijocs',
        promoBadge: '7 minijocs',
        promoLine1: 'Prova els meus', promoLine2: 'minijocs musicals!',
        promoSub: 'Generats en temps real amb els colps de cada cançó. Sense descàrregues, sense registre.',
        promoBtn: 'Jugar ara',
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
            tap:    { name: "Beat Striker",   desc: "Cada colp llança un cercle: toca’l just quan l’anell es tanque.", how: "L’anell es tanca en el colp. Toca en eixe instant. 3 vides." },
            hero:   { name: "Hero Mode",      desc: "Notes generades amb els colps reals: greus a l’esquerra, veu al centre, aguts a la dreta.", how: "Polsa la tecla del carril (o toca’l) quan la nota creue la línia." },
            surfer: { name: "Wave Rider",     desc: "Surfeja l’ona: mantín polsat per a pujar. Les portes arriben clavades al ritme.", how: "Mantín polsat (o ESPAI) per a pujar. Solta per a caure. 3 vides." },
            simon:  { name: "Echo Sequence",  desc: "Memoritza la seqüència que s’il·lumina al pols de la música i repeteix-la sense fallar.", how: "Observa la seqüència i repeteix-la tocant els pads." },
            dodger: { name: "Ring Escape",    desc: "Cada colp detona una ona expansiva. Arrossega el teu orbe i sobreviu.", how: "Arrossega l’orbe per a esquivar les ones. 3 vides." },
            tempo:  { name: "BPM Hunter",     desc: "Tens ritme de veritat? Segueix el pols i compara el teu BPM amb el real.", how: "Toca el botó gran (o l’espai) al ritme. Mínim 8 tocs." },
            bass:   { name: "Bass Invaders",  desc: "Naus que baixen amb cada colp. En els drops apareix un cap que creix amb l’energia.", how: "Mou la nau (arrossega, A/D o fletxes). El tret és automàtic. 3 vides." },
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
    // main.js publica el color de acento del beat en estas globales JS (sin tocar el DOM
    // durante el juego: una escritura en :root forzaría recalc y se vería como tirón).
    const g = which === 2 ? window._accent2Rgb : window._accent1Rgb;
    if (g) return g;
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
// Glow por lotes: cambiar globalCompositeOperation por objeto rompe el batching del
// canvas y fuerza flushes en la GPU. Con muchos halos (notas de Hero) eso es el lag.
// glowBegin/glowAt/glowEnd fijan el modo aditivo UNA vez y dibujan todos los halos juntos.
function glowBegin(ctx) {
    if (!_glow.a1 || _glow.theme !== document.documentElement.getAttribute('data-theme')) _buildGlow();
    ctx.globalCompositeOperation = 'lighter';
}
function glowAt(ctx, x, y, r, key, alpha) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(_glow[key] || _glow.a1, x - r, y - r, r * 2, r * 2);
}
function glowEnd(ctx) {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

// Reloj de canción suave. audio.currentTime solo se refresca a saltos (cada ~150-250ms,
// una vez por bloque de audio). Si saltáramos al nuevo valor en cuanto llega, las notas
// darían un tirón visible hacia atrás o adelante cada pocos frames. En su lugar mantenemos
// un estimado propio que avanza con el tiempo real (performance.now) frame a frame y SOLO
// corrige la deriva poco a poco cuando llega una muestra fresca de audio. Resultado: reloj
// monótono y fluido, sincronizado con el audio sin saltos perceptibles.
function makeSongClock(a) {
    let perfPrev = performance.now() / 1000;
    let targetOffset = (a.currentTime || 0) - perfPrev; // offset audio↔reloj-de-pared
    let offset = targetOffset;
    let lastCT = a.currentTime || 0;
    return () => {
        const perf = performance.now() / 1000;
        let dt = perf - perfPrev;
        perfPrev = perf;
        if (dt < 0) dt = 0; else if (dt > 0.1) dt = 0.1; // protege ante pestañas en segundo plano
        const ct = a.currentTime || 0;
        if (a.paused) { offset = targetOffset = ct - perf; lastCT = ct; return ct; }
        // El offset SOLO se recalibra cuando audio.currentTime cambia de verdad (cada
        // ~0.2 s). Entre tics el reloj es perf + offset = tiempo real puro, sin nada que
        // lo empuje: esto elimina la oscilación de velocidad que daba el tirón en las notas.
        if (ct !== lastCT) { lastCT = ct; targetOffset = ct - perf; }
        const d = targetOffset - offset;
        if (Math.abs(d) > 0.18) {
            offset = targetOffset; // seek o desincronización grande: saltar
        } else {
            // Acercamos el offset al objetivo limitando su variación a ±6% de dt: así el
            // reloj nunca retrocede ni pega acelerones, y la corrección de deriva es suave.
            const maxStep = dt * 0.06;
            offset += clamp(d * 0.08, -maxStep, maxStep);
        }
        return perf + offset;
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
            <canvas class="arcade-bg-canvas" id="arcadeBgCanvas" aria-hidden="true"></canvas>
            <div id="arcCursor" class="arc-cursor" hidden aria-hidden="true">
                <div class="arc-cursor-dot"></div><div class="arc-cursor-ring"></div>
            </div>
            <!-- HUB — pantalla de selección de juego -->
            <div class="arcade-hub" id="arcadeHub">
                <!-- HUD superior: logo + música + jugador + salir -->
                <div class="arc-hud-top">
                    <div class="arc-logo">
                        <span class="arc-logo-1">ARCADE</span>
                        <span class="arc-logo-2">DANIELUX</span>
                    </div>
                    <div class="arc-music-hud">
                        <button class="arc-music-btn" id="arcMusicPrev" aria-label="Anterior"><i class="fa-solid fa-backward-step"></i></button>
                        <button class="arc-music-btn arc-music-play" id="arcMusicPlay" aria-label="Play/Pausa"><i class="fa-solid fa-play" id="arcMusicPlayIcon"></i></button>
                        <div class="arc-music-info" id="arcMusicInfoBtn" role="button" tabindex="-1" title="Cambiar canción">
                            <i class="fa-solid fa-music"></i><span id="arcMusicTitle">—</span>
                        </div>
                        <button class="arc-music-btn" id="arcMusicNext" aria-label="Siguiente"><i class="fa-solid fa-forward-step"></i></button>
                    </div>
                    <div class="arc-hud-right">
                        <div class="arc-player-hud">
                            <div class="arc-player-info">
                                <div class="arc-player-lvl">NVL <span id="arcLvl">1</span></div>
                                <div class="arc-xp-wrap">
                                    <div class="arc-xp-bar"><div class="arc-xp-fill" id="arcXpFill" style="width:0%"></div></div>
                                    <span class="arc-xp-txt" id="arcXpTxt">0 / 1.000</span>
                                </div>
                            </div>
                        </div>
                        <button class="arc-exit-btn" id="arcadeClose" aria-label="Salir">
                            <i class="fa-solid fa-power-off"></i><span>SALIR</span>
                        </button>
                    </div>
                </div>
                <!-- Área central: título + carrusel + controles -->
                <div class="arc-main-area">
                    <!-- Flechas fuera del scene, posicionadas desde el centro de pantalla -->
                    <button class="arc-arrow arc-arrow-l" id="arcadeArrowL"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="arc-arrow arc-arrow-r" id="arcadeArrowR"><i class="fa-solid fa-chevron-right"></i></button>
                    <div class="arc-title-block">
                        <h1 class="arc-main-title">MINIJUEGOS</h1>
                        <p class="arc-main-sub">ELIGE TU DESAFÍO</p>
                    </div>
                    <div class="arc-scene" id="arcScene">
                        <div class="arc-track" id="arcTrack"></div>
                    </div>
                    <div class="arc-below">
                        <button class="arc-launch-btn" id="arcadePlayBtn">
                            <span class="alb-glow"></span>
                            <i class="fa-solid fa-play"></i>
                            <span class="alb-label">LAUNCH GAME</span>
                        </button>
                        <p class="arc-launch-hint">ENTER PARA INICIAR</p>
                        <div class="arc-dots" id="arcadeDots"></div>
                    </div>
                </div>
                <!-- Logros flotantes (derecha) -->
                <div class="arc-ach-float" id="arcAchPanel"></div>
                <!-- Estadísticas flotantes (abajo-izquierda) -->
                <div class="arc-stats-float">
                    <div class="arc-stat-item"><i class="fa-regular fa-clock"></i><div><div class="arc-stat-lbl">TIEMPO</div><div class="arc-stat-val" id="arcTimePlayed">0H 0M</div></div></div>
                    <div class="arc-stat-item"><i class="fa-regular fa-star"></i><div><div class="arc-stat-lbl">JUEGOS</div><div class="arc-stat-val" id="arcGamesPlayed">0 / 7</div></div></div>
                    <div class="arc-stat-item"><i class="fa-solid fa-trophy"></i><div><div class="arc-stat-lbl">LOGROS</div><div class="arc-stat-val" id="arcAchCount">0 / 5</div></div></div>
                </div>
                <!-- Hints de navegación (abajo-centro) -->
                <div class="arc-nav-hints">
                    <kbd>←</kbd><kbd>→</kbd> Navegar &nbsp;·&nbsp; <kbd>ENTER</kbd> Seleccionar &nbsp;·&nbsp; <kbd>ESC</kbd> Salir
                </div>
                <!-- Pantalla de carga cinemática -->
                <div class="arc-loading" id="arcLoading" hidden>
                    <div class="arl-inner">
                        <div class="arl-title" id="arlTitle"></div>
                        <div class="arl-log" id="arlLog"></div>
                        <div class="arl-bar-wrap"><div class="arl-bar" id="arlBar"></div></div>
                    </div>
                </div>
            </div>
            <!-- Cabecera del juego (solo visible durante la partida) -->
            <header class="arcade-top" id="arcadeTop" hidden>
                <button class="arcade-back" id="arcadeBack" hidden><i class="fa-solid fa-arrow-left"></i> <span>${T('back')}</span></button>
                <div class="arcade-title"><i class="fa-solid fa-gamepad"></i> <span>${T('title')}</span></div>
                <button class="arcade-song-pill" id="arcadeSongBtn" title="${T('changeSong')}">
                    <i class="fa-solid fa-music"></i><span id="arcadeNowTitle">—</span><i class="fa-solid fa-chevron-down"></i>
                </button>
                <button class="arcade-iconbtn" id="arcadeRestart" hidden><i class="fa-solid fa-rotate-left"></i></button>
                <button class="arcade-close" id="arcadeCloseStage" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
            </header>
            <!-- Escenario del juego -->
            <div class="arcade-stage" id="arcadeStage" hidden>
                <canvas id="arcadeCanvas"></canvas>
                <div class="arcade-hud" id="arcadeHud"></div>
                <div class="arcade-msg" id="arcadeMsg" hidden></div>
            </div>`;
        document.body.appendChild(el);
        this.overlay    = el;
        this.hub        = el.querySelector('#arcadeHub');
        this.topBar     = el.querySelector('#arcadeTop');
        this.stage      = el.querySelector('#arcadeStage');
        this.canvas     = el.querySelector('#arcadeCanvas');
        this.ctx        = this.canvas.getContext('2d');
        this.hud        = el.querySelector('#arcadeHud');
        this.msg        = el.querySelector('#arcadeMsg');
        this.backBtn    = el.querySelector('#arcadeBack');
        this.restartBtn = el.querySelector('#arcadeRestart');
        this.songBtn    = el.querySelector('#arcadeSongBtn');
        this.nowTitle   = el.querySelector('#arcadeNowTitle');

        // ---- Custom cursor ----
        const cursorEl = el.querySelector('#arcCursor');
        el.addEventListener('mousemove', (e) => {
            cursorEl.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
        });
        el.addEventListener('mouseenter', () => { cursorEl.hidden = false; });
        el.addEventListener('mouseleave', () => { cursorEl.hidden = true; });

        // ---- Carrusel 3D ----
        this._carIdx   = 0;
        this._carArtRaf = null;
        Arcade._drawArt._staticNext = false;
        this._currentGameColors = this.games[0]?.colors || ['0 200 255', '139 92 246'];

        const track   = el.querySelector('#arcTrack');
        const dotsEl  = el.querySelector('#arcadeDots');
        const playBtn = el.querySelector('#arcadePlayBtn');
        const bgCv    = el.querySelector('#arcadeBgCanvas');
        const bgCtx   = bgCv.getContext('2d');

        // Tarjetas 3D — una por juego
        const GAME_CATS = { tap:'RHYTHM', hero:'HERO MODE', surfer:'SURF', simon:'MEMORY', dodger:'ESCAPE', tempo:'TEMPO', bass:'SHOOTER' };
        this.games.forEach((g, i) => {
            const card = document.createElement('div');
            card.className = 'arc-card';
            card.dataset.idx = i;
            const cv = document.createElement('canvas');
            cv.className = 'arc-card-canvas';
            cv.setAttribute('aria-hidden', 'true');
            card.appendChild(cv);
            const dim = document.createElement('div');
            dim.className = 'arc-card-dim';
            card.appendChild(dim);
            // Nombre arriba
            const top = document.createElement('div');
            top.className = 'arc-card-top';
            top.innerHTML = `<div class="arc-card-cat">${GAME_CATS[g.id] || 'ARCADE'}</div>
                <div class="arc-card-name">${T('g.' + g.id + '.name')}</div>`;
            card.appendChild(top);
            // Récord abajo
            const bot = document.createElement('div');
            bot.className = 'arc-card-bottom';
            bot.innerHTML = `<div class="arc-card-rec" hidden>
                <span class="arc-card-rec-lbl">RÉCORD</span>
                <span class="arc-card-rec-val"></span></div>`;
            card.appendChild(bot);
            card.addEventListener('click', () => {
                if (i === this._carIdx) return;
                const N = this.games.length;
                const fwd = ((i - this._carIdx) + N) % N;
                const bwd = ((this._carIdx - i) + N) % N;
                this._carNav(i, fwd <= bwd ? 1 : -1);
            });
            track.appendChild(card);
        });

        // Dots
        this.games.forEach((_, i) => {
            const d = document.createElement('button');
            d.className = 'arc-dot';
            d.setAttribute('aria-label', 'Juego ' + (i + 1));
            d.addEventListener('click', () => this._carNav(i));
            dotsEl.appendChild(d);
        });

        const getSelectedDiff = () => 'medium';

        // Pantalla de carga cinemática
        this._launchWithLoading = (id, diff) => {
            const loadEl  = el.querySelector('#arcLoading');
            const titleEl = el.querySelector('#arlTitle');
            const logEl   = el.querySelector('#arlLog');
            const barEl   = el.querySelector('#arlBar');
            const g = this.games.find(x => x.id === id);
            titleEl.textContent = (g ? T('g.' + id + '.name') : id).toUpperCase();
            logEl.innerHTML = '';
            barEl.style.transition = 'none';
            barEl.style.width = '0%';
            loadEl.hidden = false;
            const steps = [
                [0,   'INITIALIZING...'],
                [180, 'LOADING ASSETS...'],
                [400, 'LOADING SHADERS...'],
                [650, 'LOADING SYSTEMS...'],
                [900, 'READY'],
            ];
            steps.forEach(([t, txt]) => setTimeout(() => {
                const ln = document.createElement('div');
                ln.className = 'arl-line'; ln.textContent = '> ' + txt;
                logEl.appendChild(ln);
                barEl.style.transition = 'width 0.2s ease';
                barEl.style.width = (((steps.indexOf(steps.find(s=>s[1]===txt))+1)/steps.length)*100) + '%';
            }, t));
            setTimeout(() => { loadEl.hidden = true; this.launch(id, diff); }, 1150);
        };

        // Panel lateral: perfil + logros + estadísticas
        this._updateSidePanel = () => {
            const ACHS = [
                { icon:'fa-solid fa-gamepad', name:'PRIMER PASO',       check:() => this.games.some(g => bestOfGame(g.id) > 0) },
                { icon:'fa-solid fa-music',   name:'MAESTRO DEL RITMO', check:() => bestOfGame('tap') >= 500 },
                { icon:'fa-solid fa-bolt',    name:'SPEEDRUNNER',       check:() => this.games.filter(g => bestOfGame(g.id) > 0).length >= 5 },
                { icon:'fa-solid fa-gem',     name:'COLECCIONISTA',     check:() => this.games.every(g => bestOfGame(g.id) > 0) },
                { icon:'fa-solid fa-star',    name:'MODO HÉROE',        check:() => bestOfGame('hero') >= 2 },
            ];
            const unlocked = ACHS.filter(a => a.check());
            const achPanel = el.querySelector('#arcAchPanel');
            if (achPanel) {
                achPanel.innerHTML = ACHS.map(a => {
                    const on = a.check();
                    return `<div class="arc-ach-item${on ? ' arc-ach-on' : ''}">
                        <div class="arc-ach-icon"><i class="${a.icon}"></i></div>
                        <span class="arc-ach-name">${a.name}</span>
                        <i class="arc-ach-state ${on ? 'fa-solid fa-check' : 'fa-solid fa-lock'}"></i>
                    </div>`;
                }).join('');
            }
            const gp   = this.games.filter(g => bestOfGame(g.id) > 0).length;
            const gpEl = el.querySelector('#arcGamesPlayed'); if (gpEl) gpEl.textContent = gp + ' / ' + this.games.length;
            const acEl = el.querySelector('#arcAchCount');    if (acEl) acEl.textContent = unlocked.length + ' / ' + ACHS.length;
            const tmEl = el.querySelector('#arcTimePlayed');
            if (tmEl) {
                const ms = parseInt(localStorage.getItem('arcade_time_ms') || '0');
                const mn = Math.floor(ms / 60000);
                tmEl.textContent = Math.floor(mn / 60) + 'H ' + (mn % 60) + 'M';
            }
            const tot  = this.games.reduce((s, g) => s + (bestOfGame(g.id) || 0), 0);
            const lvl  = Math.floor(tot / 1000) + 1;
            const xpIn = tot % 1000;
            const lvlEl = el.querySelector('#arcLvl');    if (lvlEl) lvlEl.textContent = lvl;
            const xpFEl = el.querySelector('#arcXpFill'); if (xpFEl) xpFEl.style.width = (xpIn / 10).toFixed(1) + '%';
            const xpTEl = el.querySelector('#arcXpTxt');  if (xpTEl) xpTEl.textContent = fmtN(xpIn) + ' / 1.000';
        };

        playBtn.addEventListener('click', () => {
            const g = this.games[this._carIdx];
            if (g) this._launchWithLoading(g.id, getSelectedDiff());
        });

        this._carNav = (idx, dir = 0) => {
            const N = this.games.length;
            this._carIdx = ((idx % N) + N) % N;
            const g = this.games[this._carIdx];
            this._currentGameColors = g.colors;

            // Posicionar tarjetas en 3D
            const cards = track.querySelectorAll('.arc-card');
            cards.forEach((card, i) => {
                let off = i - this._carIdx;
                if (off >  N / 2) off -= N;
                if (off < -N / 2) off += N;
                const abs = Math.abs(off);
                const vis = abs <= 2;
                card.style.display = vis ? '' : 'none';
                if (!vis) return;
                const scale = abs === 0 ? 1 : abs === 1 ? 0.66 : 0.44;
                const tx    = off * 60;
                const ry    = -off * 25;
                card.style.transform = `translateX(${tx}%) scale(${scale}) rotateY(${ry}deg)`;
                card.style.zIndex    = 10 - abs;
                card.style.filter    = abs === 0 ? 'none' : abs === 1 ? 'blur(1.5px)' : 'blur(3.5px)';
                card.querySelector('.arc-card-dim').style.opacity = abs === 0 ? 0 : (abs === 1 ? 0.55 : 0.8);
                card.classList.toggle('active', abs === 0);
            });

            // Arte del juego activo
            if (this._carArtRaf) { cancelAnimationFrame(this._carArtRaf); this._carArtRaf = null; }
            const activeCard = track.querySelector('.arc-card.active');
            if (activeCard) {
                const cv = activeCard.querySelector('.arc-card-canvas');
                const ctx2 = cv.getContext('2d');
                this._drawArt(ctx2, cv, g.id); // _drawArt ya resetea cv.width/height internamente
                // Récord en la tarjeta activa
                const recEl = activeCard.querySelector('.arc-card-rec');
                const bv = bestOfGame(g.id);
                recEl.hidden = bv <= 0;
                if (bv > 0) recEl.querySelector('.arc-card-rec-val').textContent = g.fmtBest ? g.fmtBest(bv) : fmtN(bv);
            }

            // Dots
            dotsEl.querySelectorAll('.arc-dot').forEach((d, i) => d.classList.toggle('active', i === this._carIdx));
        };

        el.querySelector('#arcadeArrowL').addEventListener('click', () => this._carNav(this._carIdx - 1, -1));
        el.querySelector('#arcadeArrowR').addEventListener('click', () => this._carNav(this._carIdx + 1, 1));

        // Flechas: position:fixed medido en JS sobre el track real
        const _arrowL = el.querySelector('#arcadeArrowL');
        const _arrowR = el.querySelector('#arcadeArrowR');
        this._positionArrows = () => {
            if (!track || !_arrowL || !_arrowR) return;
            const r = track.getBoundingClientRect();
            if (r.width === 0) return;
            const gap = 16, hw = 21;
            const top = r.top + r.height / 2 - hw;
            // Quitar transición antes de mover para que no "vuelen" desde fuera de pantalla
            [_arrowL, _arrowR].forEach(a => { a.style.transition = 'none'; a.style.opacity = '0'; });
            _arrowL.style.cssText += `;position:fixed;top:${top}px;left:${r.left - 42 - gap}px;right:auto;transform:none`;
            _arrowR.style.cssText += `;position:fixed;top:${top}px;left:${r.right + gap}px;right:auto;transform:none`;
            // Fade-in en el siguiente frame, ya en posición correcta
            requestAnimationFrame(() => {
                const t = 'border-color 0.18s, color 0.18s, background 0.18s, box-shadow 0.18s, opacity 0.15s';
                _arrowL.style.transition = t; _arrowR.style.transition = t;
                _arrowL.style.opacity = '1'; _arrowR.style.opacity = '1';
                _arrowL.style.pointerEvents = 'auto'; _arrowR.style.pointerEvents = 'auto';
            });
        };

        // Teclado
        this._hubKeyHandler = (e) => {
            if (!this.hub || this.hub.hidden) return;
            if (e.key === 'ArrowLeft')  { e.preventDefault(); this._carNav(this._carIdx - 1, -1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); this._carNav(this._carIdx + 1, 1); }
            if (e.key === 'Enter') playBtn.click();
        };
        document.addEventListener('keydown', this._hubKeyHandler);

        // Swipe táctil
        let _swipeX = null;
        const scene = el.querySelector('#arcScene');
        scene.addEventListener('pointerdown', (e) => { _swipeX = e.clientX; });
        scene.addEventListener('pointerup', (e) => {
            if (_swipeX === null) return;
            const dx = e.clientX - _swipeX;
            if (Math.abs(dx) > 40) this._carNav(this._carIdx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
            _swipeX = null;
        });

        // Fondo multicapa: nebulosa + partículas + brillo por juego + olas
        this._bgRaf = null;
        const _nebulae = [
            { x: 0.20, y: 0.40, vx:  0.000030, vy:  0.000022, cr: 1 },
            { x: 0.75, y: 0.55, vx: -0.000025, vy:  0.000030, cr: 2 },
            { x: 0.50, y: 0.22, vx:  0.000018, vy: -0.000025, cr: 2 },
            { x: 0.12, y: 0.80, vx:  0.000038, vy: -0.000020, cr: 1 },
        ];
        const _ptcls = Array.from({length: 170}, () => ({
            x: Math.random(), y: Math.random(),
            vx: (Math.random() - 0.5) * 0.00015,
            vy: (Math.random() - 0.5) * 0.00012,
            r:  Math.random() * 1.6 + 0.4,
            a:  Math.random() * 0.38 + 0.08,
            c:  Math.random() > 0.55 ? 1 : 2,
        }));
        this._drawBg = (ts) => {
            if (!this.isOpen()) return;
            this._bgRaf = requestAnimationFrame(this._drawBg);
            const W = bgCv.width, H = bgCv.height;
            if (!W || !H) return;
            const beat = typeof _visualBeat === 'number' ? _visualBeat : 0;
            const t = ts / 1000;
            const a1r = (window._accent1Rgb || '0 200 255').split(/\s+/).map(Number);
            const a2r = (window._accent2Rgb || '139 92 246').split(/\s+/).map(Number);
            const gcols = (this._currentGameColors || ['0 200 255','139 92 246'])
                .map(c => c.split(/\s+/).map(Number));

            // Base oscura
            bgCtx.fillStyle = '#010008';
            bgCtx.fillRect(0, 0, W, H);

            // Capa 1: Nebulosas (gradientes radiales lentos)
            for (const nb of _nebulae) {
                nb.x += nb.vx; nb.y += nb.vy;
                if (nb.x < -0.15 || nb.x > 1.15) nb.vx *= -1;
                if (nb.y < -0.15 || nb.y > 1.15) nb.vy *= -1;
                const cr = nb.cr === 1 ? a1r : a2r;
                const rad = Math.min(W, H) * (0.42 + beat * 0.06);
                const grd = bgCtx.createRadialGradient(nb.x*W, nb.y*H, 0, nb.x*W, nb.y*H, rad);
                grd.addColorStop(0, `rgba(${cr[0]},${cr[1]},${cr[2]},${0.055 + beat * 0.04})`);
                grd.addColorStop(1, 'rgba(0,0,0,0)');
                bgCtx.fillStyle = grd;
                bgCtx.fillRect(0, 0, W, H);
            }

            // Capa 2: Partículas flotantes
            for (const p of _ptcls) {
                p.x += p.vx * (1 + beat * 0.9);
                p.y += p.vy * (1 + beat * 0.5);
                if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
                if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
                const cr = p.c === 1 ? a1r : a2r;
                bgCtx.beginPath();
                bgCtx.arc(p.x * W, p.y * H, p.r * (1 + beat * 0.9), 0, Math.PI * 2);
                bgCtx.fillStyle = `rgba(${cr[0]},${cr[1]},${cr[2]},${p.a * (0.45 + beat * 0.55)})`;
                bgCtx.fill();
            }

            // Capa 3: Brillo radial del juego (color del juego activo)
            const gc0 = gcols[0] || a1r;
            const gg = bgCtx.createRadialGradient(W*0.5, H*0.5, 0, W*0.5, H*0.5, Math.min(W,H)*(0.5+beat*0.1));
            gg.addColorStop(0, `rgba(${gc0[0]},${gc0[1]},${gc0[2]},${0.1+beat*0.12})`);
            gg.addColorStop(1, 'rgba(0,0,0,0)');
            bgCtx.fillStyle = gg;
            bgCtx.fillRect(0, 0, W, H);

            // Capa 4+5A: Círculo completo + espectro circular integrado
            // Un único radio compartido para que barras y círculo sean perfectamente coincidentes
            const arcCX = W * 0.5, arcCY = H * 0.52;
            const arcR  = Math.min(W, H) * (0.34 + beat * 0.03);
            const arcLW = 2; // grosor de la línea del círculo

            bgCtx.save();
            // Glow radial alrededor del círculo
            for (let pass = 0; pass < 4; pass++) {
                const rOuter = arcR + pass * 8 + 4;
                const rInner = Math.max(0, arcR - pass * 6);
                const glowG = bgCtx.createRadialGradient(arcCX, arcCY, rInner, arcCX, arcCY, rOuter);
                const alpha = (0.12 + beat * 0.15) * Math.pow(0.5, pass);
                glowG.addColorStop(0, `rgba(${a1r[0]},${a1r[1]},${a1r[2]},0)`);
                glowG.addColorStop(0.5, `rgba(${a1r[0]},${a1r[1]},${a1r[2]},${alpha})`);
                glowG.addColorStop(1, `rgba(${a1r[0]},${a1r[1]},${a1r[2]},0)`);
                bgCtx.fillStyle = glowG;
                bgCtx.fillRect(0, 0, W, H);
            }

            // Espectro circular — barras arrancan desde el borde exterior del círculo (arcR + arcLW/2)
            const specBars = 80;
            const specStart = arcR + arcLW / 2; // borde exterior del trazo
            for (let i = 0; i < specBars; i++) {
                const ang  = (i / specBars) * Math.PI * 2 - Math.PI / 2;
                const ph   = t * 1.2 + i * (Math.PI * 2 / specBars) * 2.5;
                const bh   = arcR * (0.04 + 0.18 * Math.abs(Math.sin(ph)) * (0.15 + beat * 0.85));
                const x1   = arcCX + Math.cos(ang) * specStart;
                const y1   = arcCY + Math.sin(ang) * specStart;
                const x2   = arcCX + Math.cos(ang) * (specStart + bh);
                const y2   = arcCY + Math.sin(ang) * (specStart + bh);
                const frac = i / specBars;
                // Degradado suave cyan→morado a lo largo del círculo
                const cr   = frac < 0.5
                    ? [a1r[0] + (a2r[0]-a1r[0])*frac*2, a1r[1] + (a2r[1]-a1r[1])*frac*2, a1r[2] + (a2r[2]-a1r[2])*frac*2]
                    : [a2r[0] + (a1r[0]-a2r[0])*(frac-0.5)*2, a2r[1] + (a1r[1]-a2r[1])*(frac-0.5)*2, a2r[2] + (a1r[2]-a2r[2])*(frac-0.5)*2];
                bgCtx.beginPath();
                bgCtx.moveTo(x1, y1);
                bgCtx.lineTo(x2, y2);
                bgCtx.strokeStyle = `rgba(${cr[0]|0},${cr[1]|0},${cr[2]|0},${0.18 + beat * 0.32})`;
                bgCtx.lineWidth = 1.5;
                bgCtx.stroke();
            }

            // Círculo principal (encima de las barras para que tape cualquier solapamiento)
            bgCtx.beginPath();
            bgCtx.arc(arcCX, arcCY, arcR, 0, Math.PI * 2);
            bgCtx.strokeStyle = `rgba(${a1r[0]},${a1r[1]},${a1r[2]},${0.22 + beat * 0.25})`;
            bgCtx.lineWidth = arcLW;
            bgCtx.stroke();
            // Círculo interior secundario (color 2)
            bgCtx.beginPath();
            bgCtx.arc(arcCX, arcCY, arcR * 0.88, 0, Math.PI * 2);
            bgCtx.strokeStyle = `rgba(${a2r[0]},${a2r[1]},${a2r[2]},${0.10 + beat * 0.12})`;
            bgCtx.lineWidth = 1;
            bgCtx.stroke();
            bgCtx.restore();

            // Capa 5B: Flow lines — líneas de onda horizontales sutiles
            const flowLines = 6;
            bgCtx.save();
            for (let li = 0; li < flowLines; li++) {
                const yBase = H * (0.22 + li * 0.12);
                const amp   = (12 + li * 6) * (1 + beat * 1.2);
                const freq  = 0.008 + li * 0.002;
                const phase = t * (0.4 + li * 0.15) + li * 1.1;
                const cr    = li % 2 === 0 ? a1r : a2r;
                const alpha = (0.04 + beat * 0.07) * (1 - li * 0.1);
                bgCtx.beginPath();
                for (let x = 0; x <= W; x += 4) {
                    const y = yBase + Math.sin(x * freq + phase) * amp
                                    + Math.sin(x * freq * 0.5 + phase * 1.3) * amp * 0.4;
                    x === 0 ? bgCtx.moveTo(x, y) : bgCtx.lineTo(x, y);
                }
                bgCtx.strokeStyle = `rgba(${cr[0]},${cr[1]},${cr[2]},${alpha})`;
                bgCtx.lineWidth = 1;
                bgCtx.stroke();
            }
            bgCtx.restore();

            // Scanlines sutiles
            bgCtx.save();
            bgCtx.globalAlpha = 0.04;
            bgCtx.fillStyle = '#000';
            for (let y = 0; y < H; y += 3) bgCtx.fillRect(0, y, W, 1);
            bgCtx.restore();

            // Viñeta perimetral
            const vg = bgCtx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.12, W/2, H/2, Math.max(W,H)*0.72);
            vg.addColorStop(0, 'rgba(1,0,8,0)');
            vg.addColorStop(1, 'rgba(1,0,8,0.88)');
            bgCtx.fillStyle = vg;
            bgCtx.fillRect(0, 0, W, H);
        };

        this._resizeBg = () => {
            bgCv.width  = this.overlay?.offsetWidth  || window.innerWidth;
            bgCv.height = this.overlay?.offsetHeight || window.innerHeight;
        };

        el.querySelector('#arcadeClose').addEventListener('click', () => this.close());
        el.querySelector('#arcadeCloseStage').addEventListener('click', () => this.close());

        // ---- HUD de música (reemplaza la barra de reproducción) ----
        const _mPlayIcon = el.querySelector('#arcMusicPlayIcon');
        const _updateMusicIcon = () => {
            if (_mPlayIcon) _mPlayIcon.className = audio.paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
        };
        audio.addEventListener('play', _updateMusicIcon);
        audio.addEventListener('pause', _updateMusicIcon);

        el.querySelector('#arcMusicPlay').addEventListener('click', () => {
            if (audio.paused) { try { const p = audio.play(); if (p) p.catch(() => {}); } catch (e) {} }
            else audio.pause();
            syncPlayIcons();
        });
        el.querySelector('#arcMusicPrev').addEventListener('click', () => {
            if (typeof TRACKS !== 'undefined' && window._playerLoadTrack) {
                const n = TRACKS.length;
                window._playerLoadTrack(((window._currentIdx || 0) - 1 + n) % n, !audio.paused);
                this.updateNowTitle();
            }
        });
        el.querySelector('#arcMusicNext').addEventListener('click', () => {
            if (typeof TRACKS !== 'undefined' && window._playerLoadTrack) {
                const n = TRACKS.length;
                window._playerLoadTrack(((window._currentIdx || 0) + 1) % n, !audio.paused);
                this.updateNowTitle();
            }
        });
        el.querySelector('#arcMusicInfoBtn').addEventListener('click', () => {
            if (this._picker) this.closeSongPicker(); else this.openSongPicker();
        });
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

        window.addEventListener('resize', () => {
            if (!this.isOpen()) return;
            this.resize();
            if (!this.hub?.hidden) requestAnimationFrame(() => this._positionArrows?.());
        }, { passive: true });
    },

    isOpen() { return this.overlay && this.overlay.classList.contains('open'); },

    updateNowTitle() {
        try {
            const idx = window._currentIdx || 0;
            const title = typeof TRACKS !== 'undefined' && TRACKS[idx] ? TRACKS[idx].title : null;
            if (title) {
                if (this.nowTitle) this.nowTitle.textContent = title;
                const mtEl = document.getElementById('arcMusicTitle');
                if (mtEl) mtEl.textContent = title;
            }
        } catch (e) {}
    },

    refreshBests() {
        // Refresca el récord del juego actualmente visible en el carrusel
        if (this._carNav) this._carNav(this._carIdx || 0);
    },

    open() {
        if (!this.overlay) this.build();
        this.snapshot = audio.getAttribute('src')
            ? { idx: window._currentIdx || 0, time: audio.currentTime || 0, playing: !audio.paused }
            : null;
        this._dirty    = false;
        this._openTime = Date.now();
        this.updateNowTitle();
        this.refreshBests();
        this.overlay.classList.add('open');
        this.overlay.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('arcade-lock');
        this.showHubView();
    },

    close() {
        if (this._openTime) {
            const elapsed = Date.now() - this._openTime;
            const prev = parseInt(localStorage.getItem('arcade_time_ms') || '0');
            localStorage.setItem('arcade_time_ms', String(prev + elapsed));
            this._openTime = null;
        }
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
        document.documentElement.classList.remove('arcade-hub-active');
        document.documentElement.classList.remove('arcade-game-active');
        if (this._bgRaf) { cancelAnimationFrame(this._bgRaf); this._bgRaf = null; }
        if (this._carArtRaf) { cancelAnimationFrame(this._carArtRaf); this._carArtRaf = null; }
        if (this._hubKeyHandler) { document.removeEventListener('keydown', this._hubKeyHandler); this._hubKeyHandler = null; }
    },

    toHub() {
        this.abortSession();
        // Volvemos al hub: resetear dirty para que la música del usuario siga sonando
        this._dirty = false;
        try { const p = audio.play(); if (p) p.catch(() => {}); } catch (e) {}
        syncPlayIcons();
        this.refreshBests();
        this.showHubView();
    },

    showHubView() {
        this.hub.hidden = false;
        this.stage.hidden = true;
        if (this.topBar) this.topBar.hidden = true;
        this.backBtn.hidden = true;
        this.restartBtn.hidden = true;
        document.documentElement.classList.add('arcade-hub-active');
        document.documentElement.classList.remove('arcade-game-active');
        this.hideMsg();
        if (this._carNav) this._carNav(this._carIdx || 0);
        this._updateSidePanel?.();
        this._resizeBg?.();
        if (!this._bgRaf) this._bgRaf = requestAnimationFrame(this._drawBg);
        // Pre-render de un frame estático para todas las tarjetas no activas
        setTimeout(() => {
            if (this.hub?.hidden) return; // el usuario ya salió del hub
            const track = this.hub?.querySelector('#arcTrack');
            if (!track) return;
            const cards = track.querySelectorAll('.arc-card');
            const activeIdx = this._carIdx;
            cards.forEach((card, i) => {
                if (i === activeIdx) return; // la activa ya tiene su loop animado
                const cv = card.querySelector('.arc-card-canvas');
                if (!cv) return;
                const g = this.games[i];
                if (!g) return;
                Arcade._drawArt._staticNext = true; // capturado por el closure del loop
                this._drawArt(cv.getContext('2d'), cv, g.id);
            });
        }, 80);
        // Posicionar flechas tras el layout (2 frames: 1 para que el hub sea visible, 1 para medir)
        requestAnimationFrame(() => requestAnimationFrame(() => this._positionArrows?.()));
    },

    showStageView() {
        this.hub.hidden = true;
        this.stage.hidden = false;
        if (this.topBar) this.topBar.hidden = false;
        this.backBtn.hidden = false;
        document.documentElement.classList.remove('arcade-hub-active');
        document.documentElement.classList.add('arcade-game-active');
        // Ocultar flechas del hub
        const aL = this.overlay?.querySelector('#arcadeArrowL');
        const aR = this.overlay?.querySelector('#arcadeArrowR');
        if (aL) { aL.style.opacity = '0'; aL.style.pointerEvents = 'none'; }
        if (aR) { aR.style.opacity = '0'; aR.style.pointerEvents = 'none'; }
        // Asegurar que el fondo sigue animándose en la vista de juego
        this._resizeBg?.();
        if (!this._bgRaf) this._bgRaf = requestAnimationFrame(this._drawBg);
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
    launch(id, presetDiff) {
        const game = this.games.find((g) => g.id === id);
        if (!game) return;
        if (presetDiff && DIFFS.includes(presetDiff)) { OPTS.diff[id] = presetDiff; saveOpts(); }
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
        const vis = []; // círculos visibles del frame (reusado, sin asignar por frame)
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

                // accentRgb cacheado una vez por frame (antes: por círculo)
                const a1 = accentRgb(1), a2 = accentRgb(2);
                const a1c = a1.split(/\s+/).join(','), a2c = a2.split(/\s+/).join(',');

                // PASO 1: resolver fallos/splice y recoger los círculos visibles
                vis.length = 0;
                for (let i = circles.length - 1; i >= 0; i--) {
                    const c = circles[i];
                    const remain = c.hitT - now;
                    if (remain < -W_X) { miss(c, i); continue; }
                    c._k = clamp(remain / CFG.approach, 0, 1);
                    vis.push(c);
                }

                // PASO 2: todos los halos en un único bloque aditivo (sin alternar modo por círculo)
                glowBegin(ctx);
                const gA = 0.5 + beat * 0.3;
                for (let i = 0; i < vis.length; i++) { const c = vis[i]; glowAt(ctx, c.x, c.y, c.r * 2.1, 'a2', gA); }
                glowEnd(ctx);

                // PASO 3: cuerpos, números y anillos de aproximación
                for (let i = 0; i < vis.length; i++) {
                    const c = vis[i];
                    const k = c._k;
                    const rr = c.r * (1 + beat * 0.08);
                    const grad = ctx.createRadialGradient(c.x - c.r * 0.3, c.y - c.r * 0.3, c.r * 0.1, c.x, c.y, c.r);
                    grad.addColorStop(0, `rgba(${a1c},0.95)`);
                    grad.addColorStop(1, `rgba(${a2c},0.82)`);
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, rr, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    if (c.num > 0) {
                        ctx.font = `800 ${Math.round(c.r * 0.85)}px Montserrat, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = 'rgba(255,255,255,0.95)';
                        ctx.fillText(c.num, c.x, c.y + 1);
                        ctx.textBaseline = 'alphabetic';
                    }

                    ctx.beginPath();
                    ctx.arc(c.x, c.y, c.r + c.r * 1.9 * k, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${a1c},${0.4 + (1 - k) * 0.35 + beat * 0.2})`;
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
        const vis = []; // notas visibles de este frame (reusado, sin asignar por frame)
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
                // versiones ya separadas por comas: evita partir el string en cada nota
                const a1c = a1.split(/\s+/).join(','), a2c = a2.split(/\s+/).join(',');
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
                        ctx.fillStyle = `rgba(${l % 2 === 1 ? a2c : a1c},${laneFlash[l] * 0.16})`;
                        ctx.fillRect(x + 2, L.topY, L.laneW - 4, fh);
                        laneFlash[l] = Math.max(0, laneFlash[l] - dt * 5);
                    }
                    ctx.strokeStyle = inkBorder;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 2, L.topY, L.laneW - 4, fh);
                }

                ctx.fillStyle = `rgba(${a1c},${0.5 + beat * 0.5})`;
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

                // PASO 1: recorrer activas, resolver fallos/splice y recoger las visibles.
                // Sin dibujar todavía: así separamos los halos (modo aditivo) de los cuerpos
                // y no alternamos globalCompositeOperation por nota (eso rompía el batching).
                vis.length = 0;
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
                    n._y = L.topY + p * (L.hitY - L.topY);
                    n._x = L.x0 + n.lane * L.laneW;
                    vis.push(n);
                }

                // PASO 2: todos los halos en un único bloque aditivo (un solo cambio de modo)
                glowBegin(ctx);
                const gAlpha = 0.4 + beat * 0.22;
                for (let i = 0; i < vis.length; i++) {
                    const n = vis[i];
                    glowAt(ctx, n._x + L.laneW / 2, n._y, noteH * 1.7, n.lane % 2 === 1 ? 'a2' : 'a1', gAlpha);
                }
                glowEnd(ctx);

                // PASO 3: cuerpos sólidos + un único trazo blanco para todos
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = 'rgba(255,255,255,0.55)';
                for (let i = 0; i < vis.length; i++) {
                    const n = vis[i];
                    roundRect(ctx, n._x + 6, n._y - noteH / 2, L.laneW - 12, noteH, 8);
                    ctx.fillStyle = `rgba(${n.lane % 2 === 1 ? a2c : a1c},0.96)`;
                    ctx.fill();
                    ctx.stroke();
                }

                if (combo >= 5) {
                    ctx.font = `900 ${34 + beat * 8}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillStyle = `rgba(${a1c},${0.16 + beat * 0.2})`;
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
        const visInv = [];     // naves vivas del frame (reusado, sin asignar por frame)
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

        // cuerpo de la nave sin el halo (el halo se dibuja por lotes aparte)
        function drawShipBody(ctx, x, y, r, rgb, flip) {
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

                // naves: PASO 1 mover/colisión/splice y recoger las vivas
                visInv.length = 0;
                for (let i = invaders.length - 1; i >= 0; i--) {
                    const inv = invaders[i];
                    inv.y += inv.vy * dt;
                    const dx = inv.x - px, dy = inv.y - py, rr = inv.r + 16;
                    if (dx * dx + dy * dy < rr * rr) { invaders.splice(i, 1); loseLife(inv.x, inv.y); continue; }
                    if (inv.y > bottomLine() + 8) { invaders.splice(i, 1); loseLife(inv.x, bottomLine()); continue; }
                    visInv.push(inv);
                }
                // PASO 2: todos los halos de las naves en un único bloque aditivo
                const shipGA = 0.45 + beat * 0.3;
                glowBegin(ctx);
                for (let i = 0; i < visInv.length; i++) {
                    const inv = visInv[i];
                    glowAt(ctx, inv.x, inv.y, inv.r * 1.9, inv.band === 0 ? 'a2' : inv.band === 1 ? 'a1' : 'w', shipGA);
                }
                glowEnd(ctx);
                // PASO 3: cuerpos + aro de blindaje
                for (let i = 0; i < visInv.length; i++) {
                    const inv = visInv[i];
                    const rgb = bandColor(inv.band);
                    drawShipBody(ctx, inv.x, inv.y, inv.r, rgb, true);
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
                    glow(ctx, px, py, 16 * 1.9, 'a1', 0.45 + beat * 0.3);
                    drawShipBody(ctx, px, py, 16, a1, false);
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

/* ---- Arte canvas animado por juego ---- */
Arcade._drawArt = function(ctx, cv, id) {
    const W = cv.offsetWidth || 340, H = cv.offsetHeight || 260;
    cv.width = W; cv.height = H;
    const beat = () => (typeof _visualBeat === 'number' ? _visualBeat : 0);
    const a1 = () => window._accent1Rgb || '0 200 255';
    const a2 = () => window._accent2Rgb || '139 92 246';
    const PI2 = Math.PI * 2;
    const cx = W / 2, cy = H / 2;
    let t = 0, raf = null;
    const artists = {
        tap(ctx, t) { // Beat Striker: círculos concéntricos + ripple
            ctx.clearRect(0, 0, W, H);
            const b = beat();
            for (let i = 5; i > 0; i--) {
                const phase = (t * 0.55 + i * 0.22) % 1;
                const r = phase * Math.min(W, H) * 0.45;
                const a = (1 - phase) * (0.5 + b * 0.4);
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, PI2);
                ctx.strokeStyle = rgbStr(a1(), a); ctx.lineWidth = 2.5 - phase * 1.5; ctx.stroke();
            }
            const pr = 14 + b * 10;
            ctx.beginPath(); ctx.arc(cx, cy, pr, 0, PI2);
            ctx.fillStyle = rgbStr(a2(), 0.9 + b * 0.1); ctx.fill();
            ctx.beginPath(); ctx.arc(cx, cy, pr + 6 + b * 8, 0, PI2);
            ctx.strokeStyle = rgbStr(a1(), 0.6 + b * 0.3); ctx.lineWidth = 2; ctx.stroke();
        },
        hero(ctx, t) { // Hero Mode: notas cayendo en carriles
            ctx.clearRect(0, 0, W, H);
            const b = beat();
            const lanes = 4, lw = W / (lanes + 2), x0 = lw;
            for (let l = 0; l < lanes; l++) {
                const x = x0 + l * lw + lw / 2;
                ctx.fillStyle = rgbStr(l % 2 ? a2() : a1(), 0.07);
                ctx.fillRect(x - lw * 0.38, 0, lw * 0.76, H);
            }
            ctx.fillStyle = rgbStr(a1(), 0.5 + b * 0.4);
            ctx.fillRect(x0 - 10, H - 18, lanes * lw + 20, 4);
            const notes = [
                { l: 0, y: ((t * 0.38) % 1.2) }, { l: 2, y: ((t * 0.38 + 0.3) % 1.2) },
                { l: 1, y: ((t * 0.38 + 0.6) % 1.2) }, { l: 3, y: ((t * 0.38 + 0.9) % 1.2) },
                { l: 0, y: ((t * 0.38 + 0.15) % 1.2) }, { l: 3, y: ((t * 0.38 + 0.75) % 1.2) },
            ];
            notes.forEach(n => {
                const ny = n.y * H; if (ny > H) return;
                const nx = x0 + n.l * lw + lw / 2;
                const col = n.l % 2 ? a2() : a1();
                const nh = 14; const nw = lw * 0.7;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(nx - nw/2, ny - nh/2, nw, nh, 6);
                else ctx.rect(nx - nw/2, ny - nh/2, nw, nh);
                ctx.fillStyle = rgbStr(col, 0.9); ctx.fill();
            });
        },
        surfer(ctx, t) { // Wave Rider: forma de onda + nave
            ctx.clearRect(0, 0, W, H);
            const b = beat();
            ctx.beginPath();
            for (let x = 0; x <= W; x += 2) {
                const y = cy + Math.sin((x / W) * Math.PI * 5 + t * 1.8) * (30 + b * 28)
                         + Math.sin((x / W) * Math.PI * 2 + t * 0.9) * (14 + b * 10);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = rgbStr(a1(), 0.7 + b * 0.25); ctx.lineWidth = 2.5; ctx.stroke();
            // nave
            const shipX = W * 0.22, shipY = cy + Math.sin(t * 1.8) * (30 + b * 28) + Math.sin(t * 0.9) * 14;
            ctx.save(); ctx.translate(shipX, shipY);
            ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, 8); ctx.lineTo(0, 3); ctx.lineTo(-10, 8); ctx.closePath();
            ctx.fillStyle = rgbStr(a2(), 0.95); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.restore();
        },
        simon(ctx, t) { // Echo Sequence: pads iluminados en secuencia
            ctx.clearRect(0, 0, W, H);
            const b = beat();
            const pads = [
                { x: cx - 40, y: cy - 38, col: a1() }, { x: cx + 40, y: cy - 38, col: a2() },
                { x: cx - 40, y: cy + 38, col: a2() }, { x: cx + 40, y: cy + 38, col: a1() },
            ];
            const active = Math.floor(t * 1.1) % 4;
            pads.forEach((p, i) => {
                const on = i === active;
                const pr = 28 + (on ? b * 8 : 0);
                ctx.beginPath(); ctx.arc(p.x, p.y, pr, 0, PI2);
                ctx.fillStyle = rgbStr(p.col, on ? 0.9 + b * 0.1 : 0.18); ctx.fill();
                ctx.strokeStyle = rgbStr(p.col, on ? 1 : 0.35); ctx.lineWidth = 2; ctx.stroke();
            });
        },
        dodger(ctx, t) { // Ring Escape: ondas expansivas
            ctx.clearRect(0, 0, W, H);
            const b = beat();
            for (let i = 0; i < 4; i++) {
                const phase = ((t * 0.4 + i * 0.25) % 1);
                const r = phase * Math.min(W, H) * 0.48;
                const a = (1 - phase) * (0.55 + b * 0.35);
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, PI2);
                ctx.strokeStyle = rgbStr(i % 2 ? a2() : a1(), a); ctx.lineWidth = 3 - phase * 2; ctx.stroke();
            }
            // orbe del jugador
            const ox = cx + Math.cos(t * 0.7) * 55, oy = cy + Math.sin(t * 0.5) * 40;
            ctx.beginPath(); ctx.arc(ox, oy, 10 + b * 5, 0, PI2);
            ctx.fillStyle = rgbStr(a1(), 0.95); ctx.fill();
        },
        tempo(ctx, t) { // BPM Hunter: metrónomo + número
            ctx.clearRect(0, 0, W, H);
            const b = beat();
            const swing = Math.sin(t * 2.4) * 0.52;
            // péndulo
            const px = cx + Math.sin(swing) * 70, py = cy - 20;
            ctx.strokeStyle = rgbStr(a1(), 0.7); ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx, cy - 80); ctx.lineTo(px, py); ctx.stroke();
            ctx.beginPath(); ctx.arc(px, py, 12 + b * 8, 0, PI2);
            ctx.fillStyle = rgbStr(a2(), 0.9 + b * 0.1); ctx.fill();
            // BPM
            ctx.font = `900 ${28 + b * 8}px Montserrat, sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = rgbStr(a1(), 0.85 + b * 0.15);
            ctx.fillText('BPM', cx, cy + 50);
        },
        bass(ctx, t) { // Bass Invaders: naves en formación
            ctx.clearRect(0, 0, W, H);
            const b = beat();
            const rows = 2, cols = 5;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const sx = W * 0.18 + c * (W * 0.16) + Math.sin(t * 0.6 + r) * 4;
                    const sy = 48 + r * 44 + Math.sin(t * 0.4 + c * 0.5) * 5;
                    const col = r % 2 ? a2() : a1();
                    ctx.save(); ctx.translate(sx, sy);
                    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(9, 7); ctx.lineTo(0, 3); ctx.lineTo(-9, 7); ctx.closePath();
                    ctx.fillStyle = rgbStr(col, 0.85 + b * 0.1); ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
                    ctx.restore();
                }
            }
            // jugador abajo
            ctx.save(); ctx.translate(cx, H - 36);
            ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(12, 10); ctx.lineTo(0, 4); ctx.lineTo(-12, 10); ctx.closePath();
            ctx.fillStyle = rgbStr(a1(), 0.95 + b * 0.05); ctx.fill();
            ctx.restore();
            // bala
            const by2 = H - 36 - ((t * 90) % (H - 36));
            ctx.fillStyle = rgbStr(a2(), 0.9); ctx.fillRect(cx - 2, by2, 4, 12);
        },
    };
    const artFns = { tap: artists.tap, hero: artists.hero, surfer: artists.surfer, simon: artists.simon, dodger: artists.dodger, tempo: artists.tempo, bass: artists.bass };
    const fn = artFns[id] || artFns.tap;
    // staticOnly se captura en el closure — funciona aunque el flag externo cambie después
    const _once = !!Arcade._drawArt._staticNext;
    Arcade._drawArt._staticNext = false;
    const loop = (ts) => {
        t = ts / 1000;
        fn(ctx, t);
        if (!_once) {
            raf = requestAnimationFrame(loop);
            Arcade._carArtRaf = raf;
        }
    };
    raf = requestAnimationFrame(loop);
    if (!_once) Arcade._carArtRaf = raf;
};

Arcade.init();

/* ==========================================================================
   ARCADE PROMO — malla hexagonal reactiva (superficie de agua + beat ripples)
   ========================================================================== */
(function initArcadePromo() {
    const promo = document.getElementById('arcadePromo');
    const btn   = document.getElementById('arcadePromoBtn');
    const cv    = document.getElementById('arcadePromoCanvas');
    if (!promo || !btn || !cv) return;

    const openArcade = (e) => { e.stopPropagation(); Arcade.open(); };
    btn.addEventListener('click', openArcade);
    promo.addEventListener('click', (e) => {
        if (e.target === btn || btn.contains(e.target)) return;
        openArcade(e);
    });

    const gc = cv.getContext('2d');
    let raf = null;
    const S = 36; // hex radius
    let hexes = [], W = 0, H = 0;

    function buildGrid(w, h) {
        hexes = [];
        const cw = S * Math.sqrt(3), rh = S * 1.5;
        const cols = Math.ceil(w / cw) + 2, rows = Math.ceil(h / rh) + 2;
        const cx = w / 2, cy = h / 2;
        for (let row = -1; row < rows; row++) {
            for (let col = -1; col < cols; col++) {
                const x = col * cw + (row % 2 !== 0 ? cw / 2 : 0);
                const y = row * rh;
                const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                hexes.push({ x, y, dist, phase: Math.random() * Math.PI * 2, glow: 0 });
            }
        }
    }

    // Ripple pool — spawned on beat
    const ripples = [];
    let prevBeat = 0, lastRipT = 0;

    function hexPath(x, y, r) {
        gc.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = Math.PI / 3 * i - Math.PI / 6;
            i === 0 ? gc.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
                    : gc.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
        }
        gc.closePath();
    }

    function frame(ts) {
        raf = requestAnimationFrame(frame);
        const nW = promo.offsetWidth, nH = promo.offsetHeight;
        if (!nW || !nH) return;
        if (nW !== W || nH !== H) {
            W = nW; H = nH;
            cv.width = W; cv.height = H;
            buildGrid(W, H);
        }

        const t    = ts / 1000;
        const beat = typeof _visualBeat === 'number' ? _visualBeat : 0;

        // Parse accent strings to numeric arrays once per frame
        const pa1  = accentRgb(1).split(/\s+/).map(Number);
        const pa2  = accentRgb(2).split(/\s+/).map(Number);
        const rgba = (r, g, b, a) => `rgba(${r|0},${g|0},${b|0},${a})`;

        // Spawn ripple on beat hit
        if (beat > 0.22 && prevBeat < beat && t - lastRipT > 0.18) {
            ripples.push({ r: 0, speed: 260 + beat * 140, str: 0.4 + beat * 0.6 });
            lastRipT = t;
        }
        prevBeat = beat;

        // Advance & cull ripples
        const maxR = Math.sqrt(W * W + H * H) * 0.6;
        for (let i = ripples.length - 1; i >= 0; i--) {
            ripples[i].r += ripples[i].speed / 60;
            if (ripples[i].r > maxR) ripples.splice(i, 1);
        }

        gc.clearRect(0, 0, W, H);

        const inner = S - 1.8;

        hexes.forEach(h => {
            // Ambient idle shimmer + beat ambient
            let glow = (Math.sin(t * 0.6 + h.phase) * 0.5 + 0.5) * 0.035 + beat * 0.06;

            // Ripple contribution
            for (let i = 0; i < ripples.length; i++) {
                const delta = Math.abs(h.dist - ripples[i].r);
                const width = 55 + ripples[i].r * 0.15;
                if (delta < width) glow += (1 - delta / width) * ripples[i].str * 0.75;
            }

            glow = Math.min(glow, 1);
            if (glow < 0.012) return;

            // Color: cyan near centre → purple at edges
            const frac = Math.min(h.dist / (Math.min(W, H) * 0.55), 1);
            const cr = pa1[0] + (pa2[0] - pa1[0]) * frac;
            const cg = pa1[1] + (pa2[1] - pa1[1]) * frac;
            const cb = pa1[2] + (pa2[2] - pa1[2]) * frac;

            // ── Hex fill: depth gradient (water tile) ─────────────────────
            hexPath(h.x, h.y, inner);
            const tg = gc.createRadialGradient(h.x - inner * 0.25, h.y - inner * 0.25, 0, h.x, h.y, inner);
            tg.addColorStop(0,    rgba(cr, cg, cb, glow * 0.55));
            tg.addColorStop(0.65, rgba(cr, cg, cb, glow * 0.18));
            tg.addColorStop(1,    rgba(cr, cg, cb, 0.02));
            gc.fillStyle = tg;
            gc.fill();

            // ── Hex border glow ───────────────────────────────────────────
            hexPath(h.x, h.y, inner);
            gc.strokeStyle = rgba(cr, cg, cb, Math.min(glow * 1.1, 0.9));
            gc.lineWidth   = 0.7 + glow * 1.4;
            gc.stroke();

            // ── Specular shimmer on bright tiles ──────────────────────────
            if (glow > 0.18) {
                hexPath(h.x, h.y, inner * 0.78);
                const sg = gc.createLinearGradient(h.x - inner, h.y - inner, h.x + inner * 0.4, h.y + inner * 0.4);
                sg.addColorStop(0, `rgba(255,255,255,${glow * 0.22})`);
                sg.addColorStop(1, `rgba(255,255,255,0)`);
                gc.fillStyle = sg;
                gc.fill();
            }
        });
    }

    const obs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            if (!raf) raf = requestAnimationFrame(frame);
        } else {
            if (raf) { cancelAnimationFrame(raf); raf = null; }
        }
    }, { threshold: 0.05 });
    obs.observe(promo);
})();

})();
