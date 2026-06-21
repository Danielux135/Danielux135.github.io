import * as Runtime from '../runtime.js';
const {
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
} = Runtime;

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

