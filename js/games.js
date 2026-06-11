/* ==========================================================================
   ARCADE — minijuegos musicales del portfolio
   Depende de main.js (translations, getTranslation, TRACKS, _visualBeat,
   window._audioAnalyser, window._playerLoadTrack). Vanilla JS, sin librerías.
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
        subtitle: 'Minijuegos que se juegan con la música que está sonando. Dale al play y demuestra tu ritmo.',
        hint: 'ESC para salir · La música sigue sonando mientras juegas',
        back: 'Juegos',
        bestLabel: 'Récord',
        score: 'Puntos', combo: 'Combo', maxCombo: 'Combo máx.', accuracy: 'Precisión',
        time: 'Tiempo', round: 'Ronda', lives: 'Vidas', hits: 'Aciertos', notes: 'Notas',
        gates: 'Puertas', taps: 'Toques',
        retry: 'Reintentar', hubBtn: 'Más juegos', resume: 'Reanudar',
        paused: 'Música en pausa', pausedSub: 'Reanuda la música para seguir jugando.',
        analyzing: 'Analizando la canción…', analyzingSub: 'Generando el beatmap con los golpes reales de la canción.',
        analyzeError: 'No se pudo analizar la canción. Prueba con otra.',
        go: '¡YA!', gameOver: 'Fin de la partida', newRecord: '¡Nuevo récord!',
        perfect: 'Perfecto', good: 'Bien', miss: 'Fallo',
        yourTurn: 'Tu turno', watch: 'Observa',
        target: 'Canción', you: 'Tú', detecting: 'Detectando BPM…',
        tempoSpot: '¡Clavado!', tempoClose: 'Muy cerca', tempoFar: 'Sigue el bombo…',
        tempoHint: 'ESPACIO o botón',
        g: {
            tap:    { name: 'Beat Tap',      desc: 'Revienta los círculos que nacen con cada golpe de la canción antes de que se cierren.', how: 'Toca los círculos cuando el anillo se cierre sobre el centro. 3 vidas.' },
            hero:   { name: 'Danielux Hero', desc: 'Notas generadas con los golpes reales de la canción que suena. Acierta al cruzar la línea.', how: 'PC: teclas D · F · J (o flechas). Móvil: toca los carriles.' },
            surfer: { name: 'Bass Surfer',   desc: 'Surfea la onda: mantén pulsado para subir y cruza las puertas que nacen con el ritmo.', how: 'Mantén pulsado (o ESPACIO) para subir. Suelta para caer. 3 vidas.' },
            simon:  { name: 'Simon Beat',    desc: 'Memoriza la secuencia que se ilumina al ritmo de la música y repítela sin fallar.', how: 'Observa la secuencia y repítela tocando los pads.' },
            dodger: { name: 'Beat Dodger',   desc: 'Cada golpe de bass lanza ondas expansivas. Arrastra tu orbe y sobrevive al caos.', how: 'Arrastra el orbe para esquivar las ondas. 3 vidas.' },
            tempo:  { name: 'Tap Tempo',     desc: '¿Tienes ritmo de verdad? Sigue el pulso de la canción y compara tu BPM con el real.', how: 'Toca el botón grande (o la barra espaciadora) al ritmo de la canción. Mínimo 8 toques.' },
        },
    },
    en: {
        open: 'Mini-games',
        title: 'Arcade',
        subtitle: 'Mini-games driven by the music that is playing. Press play and show your rhythm.',
        hint: 'ESC to exit · The music keeps playing while you play',
        back: 'Games',
        bestLabel: 'Best',
        score: 'Score', combo: 'Combo', maxCombo: 'Max combo', accuracy: 'Accuracy',
        time: 'Time', round: 'Round', lives: 'Lives', hits: 'Hits', notes: 'Notes',
        gates: 'Gates', taps: 'Taps',
        retry: 'Retry', hubBtn: 'More games', resume: 'Resume',
        paused: 'Music paused', pausedSub: 'Resume the music to keep playing.',
        analyzing: 'Analyzing the song…', analyzingSub: 'Building the beatmap from the song’s real hits.',
        analyzeError: 'Could not analyze this song. Try another one.',
        go: 'GO!', gameOver: 'Game over', newRecord: 'New record!',
        perfect: 'Perfect', good: 'Good', miss: 'Miss',
        yourTurn: 'Your turn', watch: 'Watch',
        target: 'Song', you: 'You', detecting: 'Detecting BPM…',
        tempoSpot: 'Spot on!', tempoClose: 'So close', tempoFar: 'Follow the kick…',
        tempoHint: 'SPACE or button',
        g: {
            tap:    { name: 'Beat Tap',      desc: 'Pop the circles that spawn with every hit of the song before they close.', how: 'Tap the circles when the ring closes on the center. 3 lives.' },
            hero:   { name: 'Danielux Hero', desc: 'Notes generated from the real hits of the playing song. Nail them on the line.', how: 'PC: D · F · J keys (or arrows). Mobile: tap the lanes.' },
            surfer: { name: 'Bass Surfer',   desc: 'Surf the wave: hold to rise and fly through the gates born from the rhythm.', how: 'Hold (or SPACE) to rise. Release to fall. 3 lives.' },
            simon:  { name: 'Simon Beat',    desc: 'Memorize the sequence that lights up with the music and repeat it without failing.', how: 'Watch the sequence, then repeat it by tapping the pads.' },
            dodger: { name: 'Beat Dodger',   desc: 'Every bass hit fires expanding shockwaves. Drag your orb and survive the chaos.', how: 'Drag the orb to dodge the waves. 3 lives.' },
            tempo:  { name: 'Tap Tempo',     desc: 'Got real rhythm? Follow the pulse of the song and compare your BPM with the real one.', how: 'Tap the big button (or the space bar) to the beat. At least 8 taps.' },
        },
    },
    val: {
        open: 'Minijocs',
        title: 'Arcade',
        subtitle: 'Minijocs que es juguen amb la música que està sonant. Dona-li al play i demostra el teu ritme.',
        hint: 'ESC per a eixir · La música continua sonant mentre jugues',
        back: 'Jocs',
        bestLabel: 'Rècord',
        score: 'Punts', combo: 'Combo', maxCombo: 'Combo màx.', accuracy: 'Precisió',
        time: 'Temps', round: 'Ronda', lives: 'Vides', hits: 'Encerts', notes: 'Notes',
        gates: 'Portes', taps: 'Tocs',
        retry: 'Reintentar', hubBtn: 'Més jocs', resume: 'Reprendre',
        paused: 'Música en pausa', pausedSub: 'Reprén la música per a continuar jugant.',
        analyzing: 'Analitzant la cançó…', analyzingSub: 'Generant el beatmap amb els colps reals de la cançó.',
        analyzeError: 'No s’ha pogut analitzar la cançó. Prova amb una altra.',
        go: 'JA!', gameOver: 'Fi de la partida', newRecord: 'Nou rècord!',
        perfect: 'Perfecte', good: 'Bé', miss: 'Errada',
        yourTurn: 'El teu torn', watch: 'Observa',
        target: 'Cançó', you: 'Tu', detecting: 'Detectant BPM…',
        tempoSpot: 'Clavat!', tempoClose: 'Molt a prop', tempoFar: 'Segueix el bombo…',
        tempoHint: 'ESPAI o botó',
        g: {
            tap:    { name: 'Beat Tap',      desc: 'Rebenta els cercles que naixen amb cada colp de la cançó abans que es tanquen.', how: 'Toca els cercles quan l’anell es tanque sobre el centre. 3 vides.' },
            hero:   { name: 'Danielux Hero', desc: 'Notes generades amb els colps reals de la cançó que sona. Encerta-les sobre la línia.', how: 'PC: tecles D · F · J (o fletxes). Mòbil: toca els carrils.' },
            surfer: { name: 'Bass Surfer',   desc: 'Surfeja l’ona: mantín polsat per a pujar i creua les portes que naixen amb el ritme.', how: 'Mantín polsat (o ESPAI) per a pujar. Solta per a caure. 3 vides.' },
            simon:  { name: 'Simon Beat',    desc: 'Memoritza la seqüència que s’il·lumina al ritme de la música i repeteix-la sense fallar.', how: 'Observa la seqüència i repeteix-la tocant els pads.' },
            dodger: { name: 'Beat Dodger',   desc: 'Cada colp de bass llança ones expansives. Arrossega el teu orbe i sobreviu al caos.', how: 'Arrossega l’orbe per a esquivar les ones. 3 vides.' },
            tempo:  { name: 'Tap Tempo',     desc: 'Tens ritme de veritat? Segueix el pols de la cançó i compara el teu BPM amb el real.', how: 'Toca el botó gran (o la barra d’espai) al ritme de la cançó. Mínim 8 tocs.' },
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

// Detector de golpes en tiempo real (mismo espíritu que getBassEnergy de main.js:
// energía del sub-bass con flanco de subida + refractario para no disparar doble).
function makeOnsets(opts = {}) {
    const minGap = opts.minGap ?? 0.16;
    const floor = opts.floor ?? 0.16;
    const ratio = opts.ratio ?? 1.28;
    let slow = 0, prevFast = 0, last = -9, buf = null;
    return function sample(tSec) {
        const a = window._audioAnalyser;
        if (!a) return 0;
        if (!buf || buf.length !== a.frequencyBinCount) buf = new Uint8Array(a.frequencyBinCount);
        a.getByteFrequencyData(buf);
        const fast = Math.pow(Math.min((buf[1] + buf[2] + buf[3]) / (3 * 255), 1), 2.0);
        slow += (fast - slow) * 0.055;
        let strength = 0;
        if (fast > Math.max(floor, slow * ratio) && fast >= prevFast && tSec - last >= minGap) {
            strength = fast;
            last = tSec;
        }
        prevFast = fast;
        return strength;
    };
}

/* ===================== Récords ===================== */
const LS_KEY = 'dlxArcadeBest';
let bests = {};
try { bests = JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { bests = {}; }
function saveBest(id, v) {
    bests[id] = v;
    try { localStorage.setItem(LS_KEY, JSON.stringify(bests)); } catch (e) {}
}

/* ===================== Motor del arcade ===================== */
const Arcade = {
    games: [],
    overlay: null, hub: null, grid: null, stage: null, canvas: null, ctx: null,
    hud: null, msg: null, backBtn: null, nowTitle: null,
    W: 0, H: 0, dpr: 1,
    session: null, sessionGame: null, paused: false, showingResults: false,
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
                <button class="arcade-close" id="arcadeClose" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
            </header>
            <div class="arcade-hub" id="arcadeHub">
                <p class="arcade-sub" data-i18n="games.subtitle">${T('subtitle')}</p>
                <div class="arcade-grid" id="arcadeGrid"></div>
                <p class="arcade-hint" data-i18n="games.hint">${T('hint')}</p>
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
        this.nowTitle = el.querySelector('#arcadeNowTitle');

        // Tarjetas del hub
        this.games.forEach((g) => {
            const card = document.createElement('button');
            card.className = 'arcade-card';
            card.dataset.game = g.id;
            card.innerHTML = `
                <span class="arcade-card-icon"><i class="${g.icon}"></i></span>
                <h3 class="arcade-card-name" data-i18n="games.g.${g.id}.name">${T('g.' + g.id + '.name')}</h3>
                <p class="arcade-card-desc" data-i18n="games.g.${g.id}.desc">${T('g.' + g.id + '.desc')}</p>
                <span class="arcade-card-best" id="arcadeBest-${g.id}" hidden>
                    <i class="fa-solid fa-trophy"></i> <span data-i18n="games.bestLabel">${T('bestLabel')}</span>: <b>0</b>
                </span>`;
            card.addEventListener('click', () => this.launch(g.id));
            this.grid.appendChild(card);
        });

        el.querySelector('#arcadeClose').addEventListener('click', () => this.close());
        this.backBtn.addEventListener('click', () => this.toHub());

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
            if (this.session && !this.paused && !this.showingResults) this.session.onTap?.(p.x, p.y, ev);
        });
        this.stage.addEventListener('pointermove', (ev) => {
            const p = pos(ev);
            this.pointer.x = p.x; this.pointer.y = p.y;
            if (this.session && !this.paused && !this.showingResults) this.session.onMove?.(p.x, p.y, ev);
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
            if (ev.key === 'Escape') {
                ev.preventDefault();
                if (this.session || this.showingResults) this.toHub();
                else this.close();
                return;
            }
            if (this.session && !this.showingResults) {
                if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) ev.preventDefault();
                if (!this.paused && !ev.repeat) this.session.onKey?.(ev, true);
            }
        });
        document.addEventListener('keyup', (ev) => {
            if (this.session && this.isOpen() && !this.showingResults) this.session.onKey?.(ev, false);
        });

        // Pausa ligada a la música
        audio.addEventListener('pause', () => { if (this.session && !this.showingResults) this.setPaused(true); });
        audio.addEventListener('play', () => { if (this.session && this.paused) this.setPaused(false); });
        document.addEventListener('trackchanged', () => {
            this.updateNowTitle();
            if (this.session && this.sessionGame?.endOnTrackChange && !this.showingResults) this.session.forceEnd?.();
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
            const v = bests[g.id];
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
        this.updateNowTitle();
        this.refreshBests();
        this.overlay.classList.add('open');
        this.overlay.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('arcade-lock');
        this.showHubView();
    },

    close() {
        this.abortSession();
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
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.round(r.width * this.dpr);
        this.canvas.height = Math.round(r.height * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.W = r.width;
        this.H = r.height;
        this.session?.onResize?.();
    },

    ensureMusic() {
        try {
            if (!audio.getAttribute('src') && window._playerLoadTrack) { window._playerLoadTrack(window._currentIdx || 0, true); return; }
            if (audio.paused) audio.play().catch(() => {});
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

    /* ---- lanzamiento de juego ---- */
    async launch(id) {
        const game = this.games.find((g) => g.id === id);
        if (!game) return;
        this.abortSession();
        this.ensureMusic();
        warmBlip(); // crea el AudioContext de los pitidos dentro del gesto del usuario
        this.showStageView();
        this.sessionGame = game;
        const token = ++this.countToken;
        this.ctx.clearRect(0, 0, this.W, this.H);
        this.hud.innerHTML = '';

        // Fase opcional de preparación (p. ej. análisis del beatmap)
        let prep = null;
        if (game.prepare) {
            this.showMsg(`
                <div class="arcade-spinner"></div>
                <h3 class="arcade-msg-title">${T('analyzing')}</h3>
                <p class="arcade-msg-sub">${T('analyzingSub')}</p>`);
            try {
                prep = await game.prepare(this.api());
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
        }

        // Intro + cuenta atrás 3·2·1
        const name = T('g.' + id + '.name');
        const how = T('g.' + id + '.how');
        for (let i = 3; i >= 1; i--) {
            this.showMsg(`
                <h3 class="arcade-msg-title">${name}</h3>
                <p class="arcade-msg-sub">${how}</p>
                <div class="arcade-count" style="animation:none;">${i}</div>`);
            const cnt = this.msg.querySelector('.arcade-count');
            void cnt.offsetWidth;
            cnt.style.animation = '';
            await new Promise((r) => setTimeout(r, 800));
            if (token !== this.countToken) return;
        }
        this.showMsg(`<div class="arcade-count">${T('go')}</div>`);
        setTimeout(() => { if (token === this.countToken && !this.paused && !this.showingResults) this.hideMsg(); }, 600);

        // Arrancar sesión
        this.sparks = [];
        this.floats = [];
        this.paused = false;
        this.showingResults = false;
        this.session = game.createSession(this.api(), prep);
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
        this.sparks = [];
        this.floats = [];
        this.hud.innerHTML = '';
        this.hideMsg();
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    },

    /* ---- bucle principal ---- */
    loop(ts) {
        this.rafId = requestAnimationFrame((t2) => this.loop(t2));
        if (!this.lastTs) { this.lastTs = ts; return; }
        let dt = (ts - this.lastTs) / 1000;
        this.lastTs = ts;
        if (dt > 0.05) dt = 0.05;
        if (!this.session || this.paused) return;
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
            ctx.fillStyle = rgbStr(f.rgb, 1);
            ctx.shadowColor = rgbStr(f.rgb, 0.8);
            ctx.shadowBlur = 12;
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
        const value = bestValue !== null ? bestValue : score;
        const prev = bests[game.id] || 0;
        const isRecord = value > prev;
        if (isRecord) saveBest(game.id, value);
        const fmt = fmtBest || game.fmtBest || fmtN;
        const rows = stats.map((s) => `<div class="arcade-results-row"><span>${s[0]}</span><b>${s[1]}</b></div>`).join('');
        this.showMsg(`
            <div class="arcade-results">
                ${grade ? `<div class="arcade-results-grade">${grade}</div>` : ''}
                <div class="arcade-results-score">${fmt(score)}</div>
                ${isRecord ? `<span class="arcade-results-record"><i class="fa-solid fa-trophy"></i> ${T('newRecord')}</span>`
                           : `<div class="arcade-results-row" style="justify-content:center;margin-top:6px;"><span>${T('bestLabel')}: <b>${fmt(Math.max(prev, value))}</b></span></div>`}
                <div class="arcade-results-stats">${rows}</div>
                <div class="arcade-results-actions">
                    <button class="arcade-btn primary" id="arcadeRetry"><i class="fa-solid fa-rotate-right"></i> ${T('retry')}</button>
                    <button class="arcade-btn" id="arcadeToHub"><i class="fa-solid fa-table-cells-large"></i> ${T('hubBtn')}</button>
                </div>
            </div>`, true);
        this.msg.querySelector('#arcadeRetry').addEventListener('click', () => { const id = game.id; this.abortSession(); this.launch(id); });
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
            pointer: () => A.pointer,
            makeOnsets,
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
        };
    },

    init() {
        const open = (ev) => { ev.preventDefault(); this.open(); };
        document.getElementById('gamesBtn')?.addEventListener('click', open);
        document.getElementById('npbGames')?.addEventListener('click', open);
    },
};

/* ==========================================================================
   JUEGO 1 — BEAT TAP (círculos al ritmo)
   ========================================================================== */
Arcade.register({
    id: 'tap',
    icon: 'fa-solid fa-bullseye',
    createSession(api) {
        const onsets = api.makeOnsets({ minGap: 0.22 });
        const circles = [];
        let score = 0, combo = 0, maxCombo = 0, lives = 3;
        let spawned = 0, hits = 0;
        let t = 0, lastSpawn = -9;

        api.buildHud([
            { label: T('score'), id: 'tapScore', value: '0' },
            { label: T('combo'), id: 'tapCombo', value: '0', align: 'center' },
            { label: T('lives'), id: 'tapLives', lives: 3, align: 'right' },
        ]);
        const elScore = document.getElementById('tapScore');
        const elCombo = document.getElementById('tapCombo');

        const isMobile = Math.min(api.W(), api.H()) < 560;
        const coreR = () => clamp((isMobile ? 30 : 36) - score / 2200, isMobile ? 23 : 27, isMobile ? 30 : 36);
        const lifeFor = () => clamp(1.7 - score / 14000, 1.0, 1.7);

        function spawn(strength) {
            const r = coreR();
            const outer = r * 2.7;
            const mTop = 86, mEdge = Math.max(20, api.W() * 0.05);
            let best = null, bestD = -1;
            for (let i = 0; i < 10; i++) {
                const x = mEdge + outer + Math.random() * (api.W() - 2 * (mEdge + outer));
                const y = mTop + outer + Math.random() * (api.H() - mTop - 2 * outer - 20);
                let dMin = Infinity;
                circles.forEach((c) => { dMin = Math.min(dMin, Math.hypot(c.x - x, c.y - y)); });
                if (dMin > bestD) { bestD = dMin; best = { x, y }; }
                if (dMin === Infinity) break;
            }
            circles.push({ x: best.x, y: best.y, born: t, life: lifeFor(), r, strength, dead: false });
            spawned++;
        }

        function rate(c) {
            // 0 = anillo tocando el centro (perfecto), 1 = recién nacido
            const k = 1 - (t - c.born) / c.life;
            if (k <= 0.22) return { pts: 300, label: T('perfect'), accent: 1 };
            if (k <= 0.55) return { pts: 150, label: T('good'), accent: 2 };
            return { pts: 50, label: T('good'), accent: 2 };
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
                t += dt;
                const ctx = api.ctx, W = api.W(), H = api.H();
                ctx.clearRect(0, 0, W, H);
                const beat = api.beat();

                // Fondo: halo sutil que respira con el bass
                if (beat > 0.02) {
                    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
                    g.addColorStop(0, rgbStr(accentRgb(2), 0.05 + beat * 0.08));
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = g;
                    ctx.fillRect(0, 0, W, H);
                }

                // Generación en los golpes
                const strength = onsets(t);
                if (strength > 0 && circles.length < 6 && t - lastSpawn > 0.12) {
                    spawn(strength);
                    lastSpawn = t;
                    if (strength > 0.55 && circles.length < 6 && score > 3000) spawn(strength);
                }

                // Dibujo + expiración
                for (let i = circles.length - 1; i >= 0; i--) {
                    const c = circles[i];
                    const age = (t - c.born) / c.life;
                    if (age >= 1) { miss(c, i); continue; }
                    const ringR = c.r + (c.r * 2.7 - c.r) * (1 - age);
                    const a1 = accentRgb(1), a2 = accentRgb(2);

                    // núcleo
                    const grad = ctx.createRadialGradient(c.x - c.r * 0.3, c.y - c.r * 0.3, c.r * 0.1, c.x, c.y, c.r);
                    grad.addColorStop(0, rgbStr(a1, 0.95));
                    grad.addColorStop(1, rgbStr(a2, 0.82));
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, c.r * (1 + beat * 0.08), 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.shadowColor = rgbStr(a2, 0.8);
                    ctx.shadowBlur = 14 + beat * 22;
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    // borde del núcleo
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, c.r * (1 + beat * 0.08), 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // anillo de aproximación
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, ringR, 0, Math.PI * 2);
                    ctx.strokeStyle = rgbStr(a1, 0.35 + (1 - age) * 0.25 + beat * 0.3);
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                }
            },
            onTap(x, y) {
                let bestIdx = -1, bestD = Infinity;
                circles.forEach((c, i) => {
                    const d = Math.hypot(c.x - x, c.y - y);
                    if (d < Math.max(c.r * 1.6, 34) && d < bestD) { bestD = d; bestIdx = i; }
                });
                if (bestIdx < 0) return;
                const c = circles[bestIdx];
                const r = rate(c);
                circles.splice(bestIdx, 1);
                hits++;
                combo++;
                maxCombo = Math.max(maxCombo, combo);
                const mult = 1 + Math.min(combo, 30) * 0.1;
                score += Math.round(r.pts * mult);
                elScore.textContent = fmtN(score);
                elCombo.textContent = 'x' + combo;
                elCombo.classList.toggle('combo-hot', combo >= 8);
                api.burst(c.x, c.y, { n: r.pts >= 300 ? 30 : 18, power: r.pts >= 300 ? 1.25 : 0.9, accent: r.accent });
                api.addFloat(c.x, c.y, r.label, r.accent === 1 ? accentRgb(1) : accentRgb(2));
                haptic(12);
            },
            destroy() { circles.length = 0; },
        };
    },
});

/* ==========================================================================
   JUEGO 2 — DANIELUX HERO (carriles con beatmap real de la canción)
   Analiza el MP3 entero offline (lowpass 150 Hz) y extrae los golpes reales,
   así las notas llegan a la línea EXACTAMENTE cuando suena el golpe.
   ========================================================================== */
const HERO_CACHE = new Map(); // src → beatmap [{t, s, lanes:[..]}]

async function heroBuildBeatmap(src) {
    if (HERO_CACHE.has(src)) return HERO_CACHE.get(src);

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

    // Render offline: mono, 11025 Hz, lowpass en el bombo
    const SR = 11025;
    const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * SR), SR);
    const srcNode = off.createBufferSource();
    srcNode.buffer = decoded;
    const lp = off.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 150;
    lp.Q.value = 0.9;
    srcNode.connect(lp);
    lp.connect(off.destination);
    srcNode.start();
    const rendered = await off.startRendering();
    const data = rendered.getChannelData(0);

    // Envolvente de energía por ventanas de ~23 ms
    const HOP = 256;
    const frames = Math.floor(data.length / HOP);
    const env = new Float32Array(frames);
    let maxE = 0;
    for (let i = 0; i < frames; i++) {
        let sum = 0;
        const base = i * HOP;
        for (let j = 0; j < HOP; j++) { const v = data[base + j]; sum += v * v; }
        env[i] = Math.sqrt(sum / HOP);
        if (env[i] > maxE) maxE = env[i];
    }
    if (maxE > 0) for (let i = 0; i < frames; i++) env[i] /= maxE;

    // Media local (~0.93 s) para umbral adaptativo
    const HALF = 20;
    const avg = new Float32Array(frames);
    let acc = 0, lo = 0, hi = -1;
    for (let i = 0; i < frames; i++) {
        const nLo = Math.max(0, i - HALF), nHi = Math.min(frames - 1, i + HALF);
        while (hi < nHi) acc += env[++hi];
        while (lo < nLo) acc -= env[lo++];
        avg[i] = acc / (nHi - nLo + 1);
    }

    const frameT = HOP / SR;
    function pick(mult) {
        const out = [];
        let lastT = -9;
        for (let i = 2; i < frames - 2; i++) {
            const e = env[i];
            if (e < 0.09) continue;
            if (e < avg[i] * mult) continue;
            if (e < env[i - 1] || e < env[i + 1]) continue; // máximo local
            const t = i * frameT;
            if (t - lastT < 0.18) continue;
            out.push({ t, s: e });
            lastT = t;
        }
        return out;
    }

    // Sensibilidad adaptativa: densidad objetivo 0.8–2.4 notas/s
    const dur = decoded.duration;
    let onsets = null;
    let bestDiff = Infinity, bestList = [];
    for (const mult of [2.1, 1.8, 1.55, 1.35, 1.18, 1.05]) {
        const list = pick(mult);
        const d = list.length / dur;
        if (d >= 0.8 && d <= 2.4) { onsets = list; break; }
        const diff = Math.abs(d - 1.5);
        if (diff < bestDiff) { bestDiff = diff; bestList = list; }
    }
    if (!onsets) onsets = bestList;
    if (onsets.length < 12) throw new Error('beatmap vacío');

    // Carriles deterministas + acordes en los golpes top
    const strengths = [...onsets].map(o => o.s).sort((a, b) => a - b);
    const p88 = strengths[Math.floor(strengths.length * 0.88)] || 1;
    let prevLane = -1, prevT = -9;
    const notes = [];
    onsets.forEach((o, i) => {
        let lane = (i * 7 + Math.floor(o.t * 13)) % 3;
        if (lane === prevLane && o.t - prevT < 0.22) lane = (lane + 1) % 3;
        const lanes = [lane];
        if (o.s >= p88 && o.t - prevT > 0.35) lanes.push((lane + 1 + (i % 2)) % 3);
        notes.push({ t: o.t, s: o.s, lanes });
        prevLane = lane;
        prevT = o.t;
    });

    HERO_CACHE.set(src, notes);
    if (HERO_CACHE.size > 6) HERO_CACHE.delete(HERO_CACHE.keys().next().value); // no acumular memoria
    return notes;
}

Arcade.register({
    id: 'hero',
    icon: 'fa-solid fa-grip-lines-vertical',
    endOnTrackChange: true,
    async prepare(api) {
        // Espera a que el reproductor tenga src (ensureMusic ya lo ha pedido)
        for (let i = 0; i < 40 && !api.audio.currentSrc; i++) await new Promise(r => setTimeout(r, 100));
        // Si el usuario cambia de canción durante el análisis, re-analiza la nueva
        for (let i = 0; i < 3; i++) {
            const src = api.audio.currentSrc;
            if (!src) throw new Error('sin canción');
            const map = await heroBuildBeatmap(src);
            if (api.audio.currentSrc === src) return map;
        }
        throw new Error('la canción no deja de cambiar');
    },
    createSession(api, beatmap) {
        const audioEl = api.audio;
        const isTouch = window.matchMedia('(pointer:coarse)').matches;
        const LEAD = isTouch ? 1.65 : 1.85;          // s que tarda la nota en bajar
        const W_PERFECT = 0.07, W_GOOD = 0.145, W_OK = 0.19;
        const KEYS = { d: 0, f: 1, j: 2, arrowleft: 0, arrowdown: 1, arrowright: 2 };

        let score = 0, combo = 0, maxCombo = 0;
        let nPerfect = 0, nGood = 0, nOk = 0, nMiss = 0;
        const laneFlash = [0, 0, 0];
        const lanePress = [false, false, false];

        // Reloj interpolado sobre audio.currentTime (que se actualiza a saltos)
        let lastCT = audioEl.currentTime, lastPerf = performance.now() / 1000;
        function now() {
            const ct = audioEl.currentTime;
            const perf = performance.now() / 1000;
            if (ct !== lastCT) { lastCT = ct; lastPerf = perf; return ct; }
            if (audioEl.paused) return ct;
            return lastCT + (perf - lastPerf);
        }

        // Notas activas: puntero sobre el beatmap desde la posición actual
        // (si queda poco de canción, volvemos al principio para que haya partida)
        const t0 = now();
        let idx = beatmap.findIndex(n => n.t > t0 + 1.4);
        if (idx === -1 || beatmap.length - idx < 25) {
            try { audioEl.currentTime = 0; } catch (e) {}
            idx = 0;
            lastCT = 0; lastPerf = performance.now() / 1000;
        }
        const startIdx = idx;
        const active = []; // {t, lane, hit:false}
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
            const areaW = Math.min(W * 0.88, 520);
            return {
                x0: (W - areaW) / 2,
                laneW: areaW / 3,
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
            const t = now();
            const L = layout();
            laneFlash[lane] = 1;
            let best = -1, bestDt = Infinity;
            active.forEach((n, i) => {
                if (n.lane !== lane || n.hit) return;
                const dt = Math.abs(n.t - t);
                if (dt < bestDt) { bestDt = dt; best = i; }
            });
            if (best === -1 || bestDt > W_OK) return; // golpe al aire: solo flash
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
                const t = now();
                const L = layout();
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);

                // Alimentar notas activas
                while (idx < beatmap.length && beatmap[idx].t - t < LEAD + 0.2) {
                    beatmap[idx].lanes.forEach((lane) => {
                        active.push({ t: beatmap[idx].t, lane, hit: false });
                        totalSpawned++;
                    });
                    idx++;
                }

                // Carriles
                for (let l = 0; l < 3; l++) {
                    const x = L.x0 + l * L.laneW;
                    const g = ctx.createLinearGradient(0, L.topY, 0, L.hitY);
                    g.addColorStop(0, ink(0.015));
                    g.addColorStop(1, rgbStr(accentRgb(l === 1 ? 2 : 1), 0.05 + laneFlash[l] * 0.13));
                    ctx.fillStyle = g;
                    ctx.fillRect(x + 2, L.topY, L.laneW - 4, L.hitY - L.topY + 26);
                    ctx.strokeStyle = ink(0.09);
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 2, L.topY, L.laneW - 4, L.hitY - L.topY + 26);
                    if (laneFlash[l] > 0) laneFlash[l] = Math.max(0, laneFlash[l] - dt * 5);
                }

                // Línea de acierto + receptores
                ctx.fillStyle = rgbStr(accentRgb(1), 0.5 + beat * 0.5);
                ctx.shadowColor = rgbStr(accentRgb(1), 0.9);
                ctx.shadowBlur = 8 + beat * 26;
                ctx.fillRect(L.x0 - 8, L.hitY - 2, L.laneW * 3 + 16, 4);
                ctx.shadowBlur = 0;
                const noteH = Math.max(20, L.laneW * 0.22);
                for (let l = 0; l < 3; l++) {
                    const x = L.x0 + l * L.laneW;
                    roundRect(ctx, x + 7, L.hitY - noteH / 2, L.laneW - 14, noteH, 9);
                    ctx.strokeStyle = ink(0.25 + laneFlash[l] * 0.55);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    if (!isTouch) {
                        ctx.font = '700 12px Montserrat, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillStyle = ink(0.3 + laneFlash[l] * 0.5);
                        ctx.fillText(['D', 'F', 'J'][l], x + L.laneW / 2, L.hitY + noteH / 2 + 22);
                    }
                }

                // Notas
                for (let i = active.length - 1; i >= 0; i--) {
                    const n = active[i];
                    if (n.hit) { active.splice(i, 1); continue; }
                    const dtN = n.t - t;
                    if (dtN < -W_OK) { // fallo
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
                    if (p < -0.02) continue; // aún fuera del carril (no dibujar sobre la cabecera)
                    const y = L.topY + p * (L.hitY - L.topY);
                    const x = L.x0 + n.lane * L.laneW;
                    const a1 = accentRgb(n.lane === 1 ? 2 : 1);
                    const grad = ctx.createLinearGradient(x, y - noteH / 2, x, y + noteH / 2);
                    grad.addColorStop(0, rgbStr(accentRgb(1), 0.95));
                    grad.addColorStop(1, rgbStr(accentRgb(2), 0.95));
                    roundRect(ctx, x + 7, y - noteH / 2, L.laneW - 14, noteH, 9);
                    ctx.fillStyle = grad;
                    ctx.shadowColor = rgbStr(a1, 0.75);
                    ctx.shadowBlur = 10 + beat * 14;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Combo grande centrado
                if (combo >= 5) {
                    ctx.font = `900 ${34 + beat * 8}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillStyle = rgbStr(accentRgb(1), 0.16 + beat * 0.2);
                    ctx.fillText('x' + combo, W / 2, (L.topY + L.hitY) / 2);
                }

                // Fin de la canción / beatmap agotado
                if (idx >= beatmap.length && active.length === 0 && totalSpawned > 0) finish();
            },
            onTap(x) {
                const L = layout();
                if (x < L.x0 - 30 || x > L.x0 + L.laneW * 3 + 30) return;
                const lane = clamp(Math.floor((x - L.x0) / L.laneW), 0, 2);
                judge(lane);
            },
            onKey(ev, down) {
                const lane = KEYS[ev.key.toLowerCase()];
                if (lane === undefined) return;
                lanePress[lane] = down;
                if (down) judge(lane);
            },
            forceEnd() { if (totalSpawned > 0) finish(); else api.end({ score: 0, stats: [] }); },
            destroy() { active.length = 0; },
        };
    },
});

/* ==========================================================================
   JUEGO 3 — BASS SURFER (runner de un botón sobre la onda)
   ========================================================================== */
Arcade.register({
    id: 'surfer',
    icon: 'fa-solid fa-wave-square',
    createSession(api) {
        const onsets = api.makeOnsets({ minGap: 0.24 });
        let t = 0, score = 0, gates = 0, lives = 3, invuln = 1.6;
        let holding = false, keyHold = false;
        const playerX = () => api.W() * 0.24;
        let py = api.H() * 0.45, vy = 0;
        const trail = [];
        const gatesArr = []; // {x, gapY, gapH, w, passed}
        let waveBuf = null;

        api.buildHud([
            { label: T('score'), id: 'sfScore', value: '0' },
            { label: T('gates'), id: 'sfGates', value: '0', align: 'center' },
            { label: T('lives'), id: 'sfLives', lives: 3, align: 'right' },
        ]);
        const elScore = document.getElementById('sfScore');
        const elGates = document.getElementById('sfGates');

        function waveY(baseY, amp) {
            // forma de onda real (dominio temporal) como “suelo” visual y de colisión
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
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);

                const topY = 70;
                const floorBase = H - 74;
                const px = playerX();

                // Física del jugador (mantener = subir)
                const k = H / 640; // escala con la altura de pantalla
                const thrust = holding || keyHold || api.pointer().down;
                vy += (thrust ? -2500 : 1700) * k * dt;
                vy = clamp(vy, -560 * k, 620 * k);
                py += vy * dt;
                if (py < topY + 14) { py = topY + 14; vy = Math.max(vy, 0); }

                // Suelo: onda real
                const wavePts = waveY(floorBase + 18, 26 + beat * 30);
                const floorAt = (x) => {
                    const i = clamp(Math.round((x / W) * (wavePts.length - 1)), 0, wavePts.length - 1);
                    return wavePts[i].y;
                };
                if (py > floorAt(px) - 12) { py = floorAt(px) - 12; vy = -Math.abs(vy) * 0.4; hit(); }

                // Velocidad del mundo
                const speed = (W / 3.4) * (1 + Math.min(gates, 50) * 0.012) * (1 + beat * 0.08);

                // Generar puertas en los golpes
                const strength = onsets(t);
                const lastGate = gatesArr[gatesArr.length - 1];
                if (strength > 0 && (!lastGate || lastGate.x < W - Math.max(230, speed * 0.6))) {
                    const gapH = clamp(H * (0.36 - Math.min(gates, 40) * 0.0034), H * 0.21, H * 0.36);
                    const gapY = topY + 40 + gapH / 2 + Math.random() * (floorBase - topY - 90 - gapH);
                    gatesArr.push({ x: W + 50, gapY, gapH, w: 26 + strength * 22, passed: false });
                }

                // Puertas: mover, dibujar, colisión, contar
                const a1 = accentRgb(1), a2 = accentRgb(2);
                for (let i = gatesArr.length - 1; i >= 0; i--) {
                    const g = gatesArr[i];
                    g.x -= speed * dt;
                    if (g.x + g.w < -10) { gatesArr.splice(i, 1); continue; }
                    const yTop = g.gapY - g.gapH / 2;
                    const yBot = g.gapY + g.gapH / 2;

                    const gradT = ctx.createLinearGradient(g.x, 0, g.x + g.w, 0);
                    gradT.addColorStop(0, rgbStr(a2, 0.75));
                    gradT.addColorStop(1, rgbStr(a1, 0.75));
                    ctx.fillStyle = gradT;
                    ctx.shadowColor = rgbStr(a2, 0.6);
                    ctx.shadowBlur = 8 + beat * 16;
                    ctx.fillRect(g.x, topY, g.w, yTop - topY);
                    ctx.fillRect(g.x, yBot, g.w, floorBase - yBot + 18);
                    ctx.shadowBlur = 0;
                    // bordes del hueco
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.fillRect(g.x, yTop - 3, g.w, 3);
                    ctx.fillRect(g.x, yBot, g.w, 3);

                    // colisión con el orbe (r 12)
                    const pr = 12;
                    if (px + pr > g.x && px - pr < g.x + g.w && (py - pr < yTop || py + pr > yBot)) hit();
                    if (!g.passed && g.x + g.w < px - pr) {
                        g.passed = true;
                        gates++;
                        score += 100 + Math.min(gates, 30) * 5;
                        elScore.textContent = fmtN(score);
                        elGates.textContent = gates;
                        api.burst(px, py, { n: 16, power: 0.9, accent: 1 });
                        haptic(10);
                    }
                }

                // Dibujar el suelo (onda rellena)
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
                ctx.shadowColor = rgbStr(a1, 0.7);
                ctx.shadowBlur = 6 + beat * 18;
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Estela
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

                // Orbe del jugador
                const blink = invuln > 0 && Math.floor(t * 10) % 2 === 0;
                if (!blink) {
                    const grad = ctx.createRadialGradient(px - 4, py - 4, 2, px, py, 13);
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(0.35, rgbStr(a1, 1));
                    grad.addColorStop(1, rgbStr(a2, 0.9));
                    ctx.beginPath();
                    ctx.arc(px, py, 12 + beat * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.shadowColor = rgbStr(a1, 0.9);
                    ctx.shadowBlur = 16 + beat * 24;
                    ctx.fill();
                    ctx.shadowBlur = 0;
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
            destroy() { gatesArr.length = 0; trail.length = 0; },
        };
    },
});

/* ==========================================================================
   JUEGO 4 — SIMON BEAT (secuencia que se ilumina al ritmo)
   ========================================================================== */
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

Arcade.register({
    id: 'simon',
    icon: 'fa-solid fa-braille',
    fmtBest: (v) => T('round') + ' ' + v,
    createSession(api) {
        const onsets = api.makeOnsets({ minGap: 0.2 });
        const PADS = [
            { color: '0 200 255', freq: 392 },
            { color: '139 92 246', freq: 494 },
            { color: '236 72 153', freq: 587 },
            { color: '59 130 246', freq: 330 },
        ];
        let seq = [], inputIdx = 0, round = 0;
        let state = 'show'; // show | input | dead
        let showIdx = 0, sinceStep = 0, litUntil = 0, t = 0;
        let waitOnset = false;

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

        function light(i, ms = 320) {
            pads[i].classList.add('lit');
            blip(PADS[i].freq);
            setTimeout(() => pads[i].classList.remove('lit'), ms);
        }

        function nextRound() {
            round++;
            elRound.textContent = round;
            seq.push(Math.floor(Math.random() * 4));
            inputIdx = 0;
            showIdx = 0;
            sinceStep = 0;
            waitOnset = true;
            state = 'show';
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
                light(i, 240);
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
                t += dt;
                const ctx = api.ctx, W = api.W(), H = api.H();
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);
                const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.55);
                g.addColorStop(0, rgbStr(accentRgb(2), 0.04 + beat * 0.07));
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);

                if (state !== 'show') { onsets(t); return; }

                // La secuencia avanza con los golpes de la música
                // (si no llega golpe en 0.65 s, avanza sola para no atascarse)
                sinceStep += dt;
                const strength = onsets(t);
                const advance = waitOnset
                    ? (sinceStep > 0.25 && (strength > 0 || sinceStep > 0.8))
                    : (strength > 0 && sinceStep > 0.3) || sinceStep > 0.65;
                if (advance) {
                    if (showIdx < seq.length) {
                        light(seq[showIdx]);
                        showIdx++;
                        sinceStep = 0;
                        waitOnset = false;
                    } else {
                        state = 'input';
                        inputIdx = 0;
                        elStatus.textContent = T('yourTurn');
                        elStatus.classList.add('your-turn');
                    }
                }
            },
            destroy() { board.remove(); },
        };
    },
});

/* ==========================================================================
   JUEGO 5 — BEAT DODGER (esquiva las ondas que nacen con cada golpe)
   ========================================================================== */
Arcade.register({
    id: 'dodger',
    icon: 'fa-solid fa-burst',
    createSession(api) {
        const onsets = api.makeOnsets({ minGap: 0.2 });
        let t = 0, score = 0, lives = 3, invuln = 1.4, dodged = 0, shake = 0;
        let px = api.W() / 2, py = api.H() * 0.55, tx = px, ty = py;
        const rings = []; // {cx, cy, r, speed, band, age, inward, maxR, done}
        const TELEGRAPH = 0.34;
        const PR = 11; // radio del orbe

        api.buildHud([
            { label: T('score'), id: 'dgScore', value: '0' },
            { label: T('time'), id: 'dgTime', value: '0s', align: 'center' },
            { label: T('lives'), id: 'dgLives', lives: 3, align: 'right' },
        ]);
        const elScore = document.getElementById('dgScore');
        const elTime = document.getElementById('dgTime');

        function spawn(strength) {
            if (rings.length >= 9) return;
            const W = api.W(), H = api.H();
            const maxR = Math.hypot(W, H) * 0.72;
            let cx, cy;
            for (let i = 0; i < 12; i++) {
                cx = 30 + Math.random() * (W - 60);
                cy = 86 + Math.random() * (H - 120);
                if (Math.hypot(cx - px, cy - py) > 180) break;
            }
            const inward = t > 22 && strength > 0.5 && Math.random() < 0.35;
            rings.push({
                cx, cy,
                r: inward ? maxR * 0.7 : 6,
                speed: (215 + strength * 250 + Math.min(t, 70) * 2.6) * (inward ? 0.85 : 1),
                band: 13,
                age: 0,
                inward,
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
            if (lives <= 0) {
                api.end({
                    score: Math.round(score),
                    stats: [
                        [T('time'), Math.floor(t) + 's'],
                        ['💨', dodged],
                    ],
                });
            }
        }

        return {
            frame(dt) {
                t += dt;
                if (invuln > 0) invuln -= dt;
                if (shake > 0) shake -= dt;
                score += dt * 10;
                const ctx = api.ctx, W = api.W(), H = api.H();
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);
                ctx.save();
                if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 26, (Math.random() - 0.5) * shake * 26);

                // halo de fondo
                const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
                g.addColorStop(0, rgbStr(accentRgb(2), 0.04 + beat * 0.07));
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);

                const strength = onsets(t);
                if (strength > 0) {
                    spawn(strength);
                    if (strength > 0.6 && t > 35) spawn(strength * 0.8);
                }

                // mover el orbe hacia el puntero
                px += (tx - px) * Math.min(1, dt * 11);
                py += (ty - py) * Math.min(1, dt * 11);
                px = clamp(px, PR, W - PR);
                py = clamp(py, 70 + PR, H - PR);

                const a1 = accentRgb(1), a2 = accentRgb(2);

                // anillos
                for (let i = rings.length - 1; i >= 0; i--) {
                    const r = rings[i];
                    r.age += dt;
                    const live = r.age > TELEGRAPH;
                    if (live) r.r += (r.inward ? -1 : 1) * r.speed * dt;
                    if ((!r.inward && r.r > r.maxR) || (r.inward && r.r < 8)) {
                        if (!r.done) { dodged++; score += 25; }
                        rings.splice(i, 1);
                        continue;
                    }
                    const alpha = live ? 0.75 : 0.18;
                    ctx.beginPath();
                    ctx.arc(r.cx, r.cy, Math.max(r.r, 1), 0, Math.PI * 2);
                    ctx.strokeStyle = rgbStr(r.inward ? a2 : a1, alpha);
                    ctx.lineWidth = live ? r.band : 2;
                    if (!live) ctx.setLineDash([6, 8]);
                    ctx.shadowColor = rgbStr(r.inward ? a2 : a1, 0.6);
                    ctx.shadowBlur = live ? 10 + beat * 14 : 0;
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.shadowBlur = 0;
                    // punto de origen durante el aviso
                    if (!live) {
                        ctx.beginPath();
                        ctx.arc(r.cx, r.cy, 4, 0, Math.PI * 2);
                        ctx.fillStyle = rgbStr(a2, 0.6);
                        ctx.fill();
                    }
                    // colisión
                    if (live && !r.done && invuln <= 0) {
                        const d = Math.hypot(px - r.cx, py - r.cy);
                        if (Math.abs(d - r.r) < r.band / 2 + PR) {
                            r.done = true;
                            hitPlayer();
                        }
                    }
                }

                // orbe del jugador
                const blink = invuln > 0 && Math.floor(t * 10) % 2 === 0;
                if (!blink) {
                    const grad = ctx.createRadialGradient(px - 4, py - 4, 2, px, py, PR + 2);
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(0.35, rgbStr(a1, 1));
                    grad.addColorStop(1, rgbStr(a2, 0.9));
                    ctx.beginPath();
                    ctx.arc(px, py, PR + beat * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.shadowColor = rgbStr(a1, 0.9);
                    ctx.shadowBlur = 14 + beat * 22;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
                ctx.restore();

                elScore.textContent = fmtN(score);
                elTime.textContent = Math.floor(t) + 's';
            },
            onTap(x, y) { tx = x; ty = y; },
            onMove(x, y) { tx = x; ty = y; },
            destroy() { rings.length = 0; },
        };
    },
});

/* ==========================================================================
   JUEGO 6 — TAP TEMPO (sigue el pulso y compara tu BPM con el real)
   El BPM objetivo sale del MISMO análisis offline que Danielux Hero
   (cacheado por canción), así es estable y no cambia entre partidas.
   ========================================================================== */
const tempoFold = (bpm) => {
    if (!bpm || !isFinite(bpm)) return null;
    while (bpm < 70) bpm *= 2;
    while (bpm >= 180) bpm /= 2;
    return bpm;
};
function estimateBpm(times) {
    // BPM por moda de los intervalos entre golpes (plegados a una octava 70–180)
    const cand = [];
    for (let i = 1; i < times.length; i++) {
        const iv = times[i] - times[i - 1];
        if (iv < 0.18 || iv > 2.2) continue;
        const b = tempoFold(60 / iv);
        if (b) cand.push(b);
    }
    if (cand.length < 6) return null;
    let best = 0, bestScore = -1;
    for (const b of cand) {
        let score = 0;
        for (const o of cand) if (Math.abs(o - b) < 1.5) score++;
        if (score > bestScore) { bestScore = score; best = b; }
    }
    const near = cand.filter((b) => Math.abs(b - best) < 2.5);
    return near.reduce((a, b) => a + b, 0) / near.length;
}

Arcade.register({
    id: 'tempo',
    icon: 'fa-solid fa-hand-pointer',
    fmtBest: (v) => v + '%',
    endOnTrackChange: true,
    async prepare(api) {
        for (let i = 0; i < 40 && !api.audio.currentSrc; i++) await new Promise(r => setTimeout(r, 100));
        const src = api.audio.currentSrc;
        if (!src) throw new Error('sin canción');
        const notes = await heroBuildBeatmap(src);
        const bpm = estimateBpm(notes.map(n => n.t));
        if (!bpm) throw new Error('bpm no detectable');
        return bpm;
    },
    createSession(api, targetBpm) {
        let t = 0;
        const tapTimes = [];
        const MAX_TAPS = 14;
        let ended = false;

        const board = document.createElement('div');
        board.className = 'tempo-board';
        board.innerHTML = `
            <div class="tempo-readout">
                <div class="t-block"><span class="t-label">${T('target')} BPM</span><span class="t-value" id="tpTarget">${Math.round(targetBpm)}</span></div>
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

        function userBpm() {
            if (tapTimes.length < 4) return null;
            const iv = [];
            const recent = tapTimes.slice(-9);
            for (let i = 1; i < recent.length; i++) iv.push(recent[i] - recent[i - 1]);
            iv.sort((a, b) => a - b);
            return tempoFold(60 / iv[Math.floor(iv.length / 2)]);
        }

        function match() {
            const ub = userBpm();
            if (!ub) return null;
            // acepta también medio tempo / doble tempo (musicalmente correcto)
            const diff = Math.min(
                Math.abs(targetBpm - ub),
                Math.abs(targetBpm - ub * 2),
                Math.abs(targetBpm - ub / 2)
            );
            return Math.max(0, Math.round(100 - diff * 4));
        }

        function refresh() {
            const ub = userBpm(), m = match();
            elYou.textContent = ub ? Math.round(ub) : '—';
            elCount.textContent = Math.min(tapTimes.length, MAX_TAPS) + ' / ' + MAX_TAPS;
            if (m === null) elFeed.textContent = '';
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
            // si deja de tocar >2.5 s, empezamos serie nueva
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

/* === Los demás juegos se registran aquí debajo === */

Arcade.init();
})();
