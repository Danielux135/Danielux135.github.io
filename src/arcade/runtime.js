import { translations } from '../data/translations.js';
import { TRACKS } from '../data/tracks.js';
import { getTranslation } from '../features/site-ui.js';
import { visualState } from '../visuals/hero-studio.js';
import { makeArcadeBg } from './background.js';
import { analyzeBuffer, fftRadix2, hydrateMap } from './beatmaps/analyzer.js';
import {
    BEATMAP_CACHE,
    buildBeatmap,
    idbGet,
    idbOpen,
    idbSet,
} from './beatmaps/cache.js';
import {
    chooseHeroHit,
    eventsForHero,
    heroAnimePopRows,
    heroBeatAnchors,
    heroBreakbeatRows,
    heroDrivingGrooveRows,
    heroSubdivisionAnchors,
} from './beatmaps/event-selector.js';

/* ==========================================================================
   ARCADE — minijuegos musicales del portfolio
   Depende de main.js (translations, getTranslation, TRACKS, visualState.beat,
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
const audio = document.getElementById('audioEl');
if (!audio) throw new Error('No se encontró #audioEl para inicializar el arcade.');

/* ===================== i18n (se inyecta en el sistema global) ===================== */
const GAMES_I18N = {
    es: {
        open: 'Minijuegos',
        promoBadge: '7 minijuegos',
        promoLine1: '¡Prueba mis', promoLine2: 'minijuegos musicales!',
        promoSub: 'Generados en tiempo real con los golpes de cada canción. Sin descargas, sin registro.',
        promoBtn: 'Jugar ahora',
        title: 'Arcade',
        hubTitle: 'MINIJUEGOS',
        hubSubtitle: 'ELIGE TU DESAFÍO',
        levelShort: 'NVL',
        exit: 'SALIR',
        launchGame: 'LANZAR JUEGO',
        enterToStart: 'ENTER PARA INICIAR',
        statsTime: 'TIEMPO',
        statsGames: 'JUEGOS',
        statsAchievements: 'LOGROS',
        navHint: 'Navegar',
        selectHint: 'Seleccionar',
        exitHint: 'Salir',
        prevSong: 'Anterior',
        nextSong: 'Siguiente',
        playPause: 'Play/Pausa',
        close: 'Cerrar',
        gameAria: 'Juego',
        record: 'RÉCORD',
        loadingInitializing: 'INICIALIZANDO...',
        loadingAssets: 'CARGANDO ASSETS...',
        loadingShaders: 'CARGANDO SHADERS...',
        loadingSystems: 'CARGANDO SISTEMAS...',
        loadingReady: 'LISTO',
        cat: {
            tap: 'RITMO', hero: 'MODO HÉROE', surfer: 'SURF',
            simon: 'MEMORIA', dodger: 'ESCAPE', tempo: 'TEMPO', bass: 'SHOOTER'
        },
        ach: {
            firstStep: 'PRIMER PASO',
            rhythmMaster: 'MAESTRO DEL RITMO',
            speedrunner: 'SPEEDRUNNER',
            collector: 'COLECCIONISTA',
            heroMode: 'MODO HÉROE'
        },
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
            tap:    { name: 'Beat Striker',   desc: 'Cada golpe lanza un círculo: tócalo justo cuando el anillo se cierre.', how: 'El anillo se cierra en el golpe. Toca en ese instante: si fallas, sale una X y sigues.' },
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
        hubTitle: 'MINI-GAMES',
        hubSubtitle: 'CHOOSE YOUR CHALLENGE',
        levelShort: 'LVL',
        exit: 'EXIT',
        launchGame: 'LAUNCH GAME',
        enterToStart: 'ENTER TO START',
        statsTime: 'TIME',
        statsGames: 'GAMES',
        statsAchievements: 'ACHIEVEMENTS',
        navHint: 'Navigate',
        selectHint: 'Select',
        exitHint: 'Exit',
        prevSong: 'Previous',
        nextSong: 'Next',
        playPause: 'Play/Pause',
        close: 'Close',
        gameAria: 'Game',
        record: 'BEST',
        loadingInitializing: 'INITIALIZING...',
        loadingAssets: 'LOADING ASSETS...',
        loadingShaders: 'LOADING SHADERS...',
        loadingSystems: 'LOADING SYSTEMS...',
        loadingReady: 'READY',
        cat: {
            tap: 'RHYTHM', hero: 'HERO MODE', surfer: 'SURF',
            simon: 'MEMORY', dodger: 'ESCAPE', tempo: 'TEMPO', bass: 'SHOOTER'
        },
        ach: {
            firstStep: 'FIRST STEP',
            rhythmMaster: 'RHYTHM MASTER',
            speedrunner: 'SPEEDRUNNER',
            collector: 'COLLECTOR',
            heroMode: 'HERO MODE'
        },
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
            tap:    { name: 'Beat Striker',   desc: 'Every hit fires a circle: tap it right when the ring closes.', how: 'The ring closes on the hit. Tap at that instant: if you miss, an X appears and you keep playing.' },
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
        hubTitle: 'MINIJOCS',
        hubSubtitle: 'TRIA EL TEU DESAFIAMENT',
        levelShort: 'NVL',
        exit: 'EIXIR',
        launchGame: 'LLANÇAR JOC',
        enterToStart: 'ENTER PER A COMENÇAR',
        statsTime: 'TEMPS',
        statsGames: 'JOCS',
        statsAchievements: 'ASSOLIMENTS',
        navHint: 'Navegar',
        selectHint: 'Seleccionar',
        exitHint: 'Eixir',
        prevSong: 'Anterior',
        nextSong: 'Següent',
        playPause: 'Play/Pausa',
        close: 'Tancar',
        gameAria: 'Joc',
        record: 'RÈCORD',
        loadingInitializing: 'INICIALITZANT...',
        loadingAssets: 'CARREGANT ASSETS...',
        loadingShaders: 'CARREGANT SHADERS...',
        loadingSystems: 'CARREGANT SISTEMES...',
        loadingReady: 'LLEST',
        cat: {
            tap: 'RITME', hero: 'MODE HEROI', surfer: 'SURF',
            simon: 'MEMÒRIA', dodger: 'ESCAPE', tempo: 'TEMPO', bass: 'SHOOTER'
        },
        ach: {
            firstStep: 'PRIMER PAS',
            rhythmMaster: 'MESTRE DEL RITME',
            speedrunner: 'SPEEDRUNNER',
            collector: 'COL·LECCIONISTA',
            heroMode: 'MODE HEROI'
        },
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
            tap:    { name: "Beat Striker",   desc: "Cada colp llança un cercle: toca’l just quan l’anell es tanque.", how: "L’anell es tanca en el colp. Toca en eixe instant: si falles, apareix una X i continues." },
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
try { if (typeof visualState.beat === 'number') beatNow = () => Math.max(0, Math.min(1, visualState.beat)); } catch (e) { /* main.js no disponible */ }

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
// Offset de calibración de audio (segundos), SOLO manual. Antes auto-detectaba la
// latencia de salida leyéndola cada frame, pero outputLatency fluctúa → metía jitter
// en la posición de las notas (se notaba como lag), y además las retrasaba hasta 90 ms.
// Por defecto 0 (timing crudo, el que se sentía sin lag). window._arcadeAudioOffset
// permite afinar a mano si una nota va adelantada (+) o atrasada (-) respecto al sonido.
function audioOutputLatency() {
    return typeof window._arcadeAudioOffset === 'number' ? window._arcadeAudioOffset : 0;
}
function makeSongClock(a) {
    let perfPrev = performance.now() / 1000;
    let targetOffset = (a.currentTime || 0) - perfPrev; // offset audio↔reloj-de-pared
    let offset = targetOffset;
    let lastCT = a.currentTime || 0;
    let firstTick = true; // el reloj se crea antes de que play() arranque de verdad
    return () => {
        const perf = performance.now() / 1000;
        let dt = perf - perfPrev;
        perfPrev = perf;
        if (dt < 0) dt = 0; else if (dt > 0.1) dt = 0.1; // protege ante pestañas en segundo plano
        const ct = a.currentTime || 0;
        if (a.paused) { offset = targetOffset = ct - perf; lastCT = ct; return ct - audioOutputLatency(); }
        // El offset SOLO se recalibra cuando audio.currentTime cambia de verdad (cada
        // ~0.2 s). Entre tics el reloj es perf + offset = tiempo real puro, sin nada que
        // lo empuje: esto elimina la oscilación de velocidad que daba el tirón en las notas.
        if (ct !== lastCT) { lastCT = ct; targetOffset = ct - perf; }
        const d = targetOffset - offset;
        // El primer tick real de audio tras play() fija el reloj de golpe: hasta entonces
        // el offset se calculó con currentTime=0 antes de que sonara nada, lo que dejaba
        // las notas adelantadas al inicio (la deriva suave tardaría ~1 s en corregirlo).
        if (firstTick && ct > 0) { firstTick = false; offset = targetOffset; return perf + offset - audioOutputLatency(); }
        if (Math.abs(d) > 0.18) {
            offset = targetOffset; // seek o desincronización grande: saltar
        } else {
            // Acercamos el offset al objetivo limitando su variación a ±6% de dt: así el
            // reloj nunca retrocede ni pega acelerones, y la corrección de deriva es suave.
            const maxStep = dt * 0.06;
            offset += clamp(d * 0.08, -maxStep, maxStep);
        }
        return perf + offset - audioOutputLatency();
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
// El análisis y la caché versionada viven en ./beatmaps/.

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

/* El selector inteligente de Hero Mode vive en ./beatmaps/event-selector.js. */

/* ===================== Motor del arcade ===================== */
const Arcade = {
    games: [],
    overlay: null, hub: null, grid: null, stage: null, canvas: null, ctx: null,
    hud: null, msg: null, backBtn: null, restartBtn: null, songBtn: null, nowTitle: null,
    W: 0, H: 0, dpr: 1,
    session: null, sessionGame: null, paused: false, showingResults: false,
    holdFrames: false, _picker: false, _prep: false, _dirty: false, _pregame: false, _startDelay: false,
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
                        <button class="arc-music-btn" id="arcMusicPrev" aria-label="${T('prevSong')}"><i class="fa-solid fa-backward-step"></i></button>
                        <button class="arc-music-btn arc-music-play" id="arcMusicPlay" aria-label="${T('playPause')}"><i class="fa-solid fa-play" id="arcMusicPlayIcon"></i></button>
                        <div class="arc-music-info" id="arcMusicInfoBtn" role="button" tabindex="-1" title="${T('changeSong')}">
                            <i class="fa-solid fa-music"></i><span id="arcMusicTitle">—</span>
                        </div>
                        <button class="arc-music-btn" id="arcMusicNext" aria-label="${T('nextSong')}"><i class="fa-solid fa-forward-step"></i></button>
                    </div>
                    <div class="arc-hud-right">
                        <div class="arc-player-hud">
                            <div class="arc-player-info">
                                <div class="arc-player-lvl">${T('levelShort')} <span id="arcLvl">1</span></div>
                                <div class="arc-xp-wrap">
                                    <div class="arc-xp-bar"><div class="arc-xp-fill" id="arcXpFill" style="width:0%"></div></div>
                                    <span class="arc-xp-txt" id="arcXpTxt">0 / 1.000</span>
                                </div>
                            </div>
                        </div>
                        <button class="arc-exit-btn" id="arcadeClose" aria-label="${T('exitHint')}">
                            <i class="fa-solid fa-power-off"></i><span>${T('exit')}</span>
                        </button>
                    </div>
                </div>
                <!-- Área central: título + carrusel + controles -->
                <div class="arc-main-area">
                    <!-- Flechas fuera del scene, posicionadas desde el centro de pantalla -->
                    <button class="arc-arrow arc-arrow-l" id="arcadeArrowL"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="arc-arrow arc-arrow-r" id="arcadeArrowR"><i class="fa-solid fa-chevron-right"></i></button>
                    <div class="arc-title-block">
                        <h1 class="arc-main-title">${T('hubTitle')}</h1>
                        <p class="arc-main-sub">${T('hubSubtitle')}</p>
                    </div>
                    <div class="arc-scene" id="arcScene">
                        <div class="arc-track" id="arcTrack"></div>
                    </div>
                    <div class="arc-below">
                        <button class="arc-launch-btn" id="arcadePlayBtn">
                            <span class="alb-glow"></span>
                            <i class="fa-solid fa-play"></i>
                            <span class="alb-label">${T('launchGame')}</span>
                        </button>
                        <p class="arc-launch-hint">${T('enterToStart')}</p>
                        <div class="arc-dots" id="arcadeDots"></div>
                    </div>
                </div>
                <!-- Logros flotantes (derecha) -->
                <div class="arc-ach-float" id="arcAchPanel"></div>
                <!-- Estadísticas flotantes (abajo-izquierda) -->
                <div class="arc-stats-float">
                    <div class="arc-stat-item"><i class="fa-regular fa-clock"></i><div><div class="arc-stat-lbl">${T('statsTime')}</div><div class="arc-stat-val" id="arcTimePlayed">0H 0M</div></div></div>
                    <div class="arc-stat-item"><i class="fa-regular fa-star"></i><div><div class="arc-stat-lbl">${T('statsGames')}</div><div class="arc-stat-val" id="arcGamesPlayed">0 / 7</div></div></div>
                    <div class="arc-stat-item"><i class="fa-solid fa-trophy"></i><div><div class="arc-stat-lbl">${T('statsAchievements')}</div><div class="arc-stat-val" id="arcAchCount">0 / 5</div></div></div>
                </div>
                <!-- Hints de navegación (abajo-centro) -->
                <div class="arc-nav-hints">
                    <kbd>←</kbd><kbd>→</kbd> ${T('navHint')} &nbsp;·&nbsp; <kbd>ENTER</kbd> ${T('selectHint')} &nbsp;·&nbsp; <kbd>ESC</kbd> ${T('exitHint')}
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
                <button class="arcade-close" id="arcadeCloseStage" aria-label="${T('close')}"><i class="fa-solid fa-xmark"></i></button>
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
        // ojo: NO pedir getContext('2d') aquí; el fondo lo controla el motor (worker
        // OffscreenCanvas o fallback) y transferControlToOffscreen exige un canvas
        // sin contexto previo.

        // Tarjetas 3D — una por juego
        const GAME_CATS = {
            tap: T('cat.tap'),
            hero: T('cat.hero'),
            surfer: T('cat.surfer'),
            simon: T('cat.simon'),
            dodger: T('cat.dodger'),
            tempo: T('cat.tempo'),
            bass: T('cat.bass'),
        };
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
                <span class="arc-card-rec-lbl">${T('record')}</span>
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
            d.setAttribute('aria-label', T('gameAria') + ' ' + (i + 1));
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
                [0,   T('loadingInitializing')],
                [180, T('loadingAssets')],
                [400, T('loadingShaders')],
                [650, T('loadingSystems')],
                [900, T('loadingReady')],
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
                { icon:'fa-solid fa-gamepad', name:T('ach.firstStep'),       check:() => this.games.some(g => bestOfGame(g.id) > 0) },
                { icon:'fa-solid fa-music',   name:T('ach.rhythmMaster'),    check:() => bestOfGame('tap') >= 500 },
                { icon:'fa-solid fa-bolt',    name:T('ach.speedrunner'),     check:() => this.games.filter(g => bestOfGame(g.id) > 0).length >= 5 },
                { icon:'fa-solid fa-gem',     name:T('ach.collector'),       check:() => this.games.every(g => bestOfGame(g.id) > 0) },
                { icon:'fa-solid fa-star',    name:T('ach.heroMode'),        check:() => bestOfGame('hero') >= 2 },
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

        // Fondo del arcade: se dibuja en un Web Worker (OffscreenCanvas) para no robar
        // frames al hilo principal (notas, carrusel). Si el navegador no lo soporta, se
        // usa el mismo motor (makeArcadeBg) en el hilo principal como fallback.
        const bgState = () => {
            const a1 = (window._accent1Rgb || '0 200 255').split(/\s+/).map(Number);
            const a2 = (window._accent2Rgb || '139 92 246').split(/\s+/).map(Number);
            const gc = (this._currentGameColors || ['0 200 255', '139 92 246'])
                .map(c => c.split(/\s+/).map(Number));
            return {
                w: this.overlay?.offsetWidth || window.innerWidth,
                h: this.overlay?.offsetHeight || window.innerHeight,
                beat: typeof visualState.beat === 'number' ? visualState.beat : 0,
                a1r: a1, a2r: a2, gcols: gc,
            };
        };
        this._bgEngine = null;
        // Worker/OffscreenCanvas desactivado: en este equipo empeoró (probable coste de
        // compositing entre hilos / soporte irregular). Dejamos el motor en el hilo
        // principal. Para reactivar el worker, poner window._arcadeBgWorker = true.
        const _canOffscreen = window._arcadeBgWorker === true
            && typeof Worker !== 'undefined'
            && typeof OffscreenCanvas !== 'undefined'
            && typeof bgCv.transferControlToOffscreen === 'function';
        if (_canOffscreen) {
            try {
                const off = bgCv.transferControlToOffscreen();
                const bgw = new Worker(new URL('./background.worker.js', import.meta.url), { type: 'module' });
                bgw.onerror = () => {};
                bgw.postMessage({ type: 'init', canvas: off }, [off]);
                let pumping = false, pumpRaf = null, lastPost = 0;
                const pump = (ts) => {
                    if (!pumping) return;
                    pumpRaf = requestAnimationFrame(pump);
                    // ~70 fps basta: el worker dibuja a 80 y el beat no necesita más
                    if (ts - lastPost < 14) return;
                    lastPost = ts;
                    const s = bgState();
                    bgw.postMessage({ type: 'state', w: s.w, h: s.h, beat: s.beat, a1r: s.a1r, a2r: s.a2r, gcols: s.gcols });
                };
                this._bgEngine = {
                    start: () => { if (!pumping) { pumping = true; bgw.postMessage({ type: 'show' }); pumpRaf = requestAnimationFrame(pump); } },
                    stop:  () => { pumping = false; if (pumpRaf) cancelAnimationFrame(pumpRaf); bgw.postMessage({ type: 'hide' }); },
                };
            } catch (e) { this._bgEngine = null; }
        }
        if (!this._bgEngine && typeof makeArcadeBg === 'function') {
            this._bgEngine = makeArcadeBg(bgCv, bgState); // fallback en hilo principal
        }
        // Test A/B: window._arcadeNoBg = true desactiva el fondo para aislar si el lag
        // con música es del fondo o de otra cosa (audio/notas). Envuelve el motor real.
        const _realBgEngine = this._bgEngine;
        this._bgEngine = {
            start: () => { if (!window._arcadeNoBg) _realBgEngine?.start(); },
            stop:  () => _realBgEngine?.stop(),
        };
        // el motor lee el tamano del estado cada frame; resize no necesita hacer nada
        this._resizeBg = () => {};

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
        audio.addEventListener('pause', () => { if (this.session && !this.showingResults && !this._prep && !this._startDelay) this.setPaused(true); });
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
        this._bgEngine?.stop();
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
        this._bgEngine?.start();
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
        this._bgEngine?.start();
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
        const startDelay = id === 'hero' ? { easy: 1.45, medium: 1.35, hard: 1.25, expert: 1.20 }[diff] : 0.35;
        try { audio.currentTime = 0; } catch (e) {}
        this._startDelay = startDelay > 0;
        const delayPerf = performance.now() / 1000;
        let liveClock = null;
        this.songClock = () => {
            if (liveClock) return liveClock();
            const t = performance.now() / 1000 - delayPerf - startDelay;
            if (t < 0) return t;
            this._startDelay = false;
            try { audio.currentTime = 0; } catch (e) {}
            try { const pp = audio.play(); if (pp) pp.catch(() => {}); } catch (e) {}
            syncPlayIcons();
            liveClock = makeSongClock(audio);
            return 0;
        };
        if (startDelay <= 0) this.songClock();
        syncPlayIcons();
        this.showMsg(`<div class="arcade-count">${T('go')}</div>`);
        setTimeout(() => { if (token === this.countToken && !this.paused && !this.showingResults && !this._picker) this.hideMsg(); }, 500);

        // Arrancar sesión
        this.sparks = [];
        this.floats = [];
        this.paused = false;
        this.showingResults = false;
        this.session = game.createSession(this.api(), { map, events: eventsFor(map, diff), diff });
        this.lastTs = 0;
        if (!this.rafId) this.rafId = requestAnimationFrame((ts) => this.loop(ts));
        if (audio.paused && !this._startDelay) this.setPaused(true);
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
        this._startDelay = false;
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
        // Los botones globales los gestiona loader.js para poder cargar el arcade bajo demanda.
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


export {
    Arcade,
    BEATMAP_CACHE,
    DIFFS,
    DIFF_LABEL,
    GAMES_I18N,
    LS_BEST,
    LS_OPTS,
    OPTS,
    T,
    TRACKS,
    _buildGlow,
    _glow,
    accentRgb,
    analyzeBuffer,
    anchorGrid,
    audio,
    audioOutputLatency,
    beatNow,
    bestKeyFor,
    bestOfGame,
    bests,
    blip,
    blipCtx,
    buildBeatmap,
    chooseHeroHit,
    clamp,
    diffOf,
    eventsFor,
    eventsForHero,
    fftRadix2,
    fmtN,
    getTranslation,
    glow,
    glowAt,
    glowBegin,
    glowEnd,
    haptic,
    heroBeatAnchors,
    heroAnimePopRows,
    heroBreakbeatRows,
    heroDrivingGrooveRows,
    heroSubdivisionAnchors,
    hydrateMap,
    idbGet,
    idbOpen,
    idbSet,
    ink,
    keyLabel,
    makeArcadeBg,
    makeSongClock,
    rgbStr,
    saveBest,
    saveOpts,
    syncPlayIcons,
    translations,
    visualState,
    warmBlip
};
