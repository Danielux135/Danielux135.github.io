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
        let t = 0;
        let roundFlash = 0; // >0 → flash verde de ronda completada
        let roundAnnounce = null; // { text, born } para texto en canvas

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
                        // ronda completada: flash verde en todos los pads
                        elStatus.textContent = '✓';
                        pads.forEach((p) => { p.classList.add('lit-success'); setTimeout(() => p.classList.remove('lit-success'), 500); });
                        roundFlash = 0.55;
                        roundAnnounce = { text: '✓ ' + (T('round') || 'Round') + ' ' + round, born: t };
                        blip(1047, 0.12, 0.12);
                        haptic(20);
                        state = 'pause';
                        setTimeout(() => { if (state === 'pause') nextRound(); }, 750);
                    }
                } else {
                    pad.classList.add('wrong');
                    blip(90, 0.22, 0.55);
                    haptic(150);
                    setTimeout(finish, 500);
                }
            });
        });

        nextRound();

        return {
            frame(dt) {
                t += dt;
                const ctx = api.ctx, W = api.W(), H = api.H();
                const now = api.songNow();
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);
                const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.55);
                g.addColorStop(0, rgbStr(accentRgb(2), 0.04 + beat * 0.07));
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);

                // flash verde de ronda completada
                if (roundFlash > 0) {
                    roundFlash -= dt * 2;
                    ctx.fillStyle = rgbStr(accentRgb(1), Math.max(0, roundFlash) * 0.22);
                    ctx.fillRect(0, 0, W, H);
                }

                // texto de ronda completada en canvas
                if (roundAnnounce) {
                    const age = t - roundAnnounce.born;
                    if (age < 1.4) {
                        const p = age / 1.4;
                        ctx.globalAlpha = 1 - p * p;
                        ctx.font = `900 ${Math.round(Math.min(W, H) * 0.072)}px Montserrat, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = rgbStr(accentRgb(1), 1);
                        ctx.fillText(roundAnnounce.text, W / 2, H / 2 - p * 30 - 60);
                        ctx.globalAlpha = 1;
                    } else {
                        roundAnnounce = null;
                    }
                }

                // barra de progreso de la secuencia actual durante 'input'
                if (state === 'input' && seq.length > 0) {
                    const a1 = accentRgb(1);
                    const bw = Math.min(W * 0.7, 300), bx = (W - bw) / 2, by = H - 28, bh = 5;
                    ctx.fillStyle = 'rgba(255,255,255,0.08)';
                    ctx.fillRect(bx, by, bw, bh);
                    const pct = inputIdx / seq.length;
                    ctx.fillStyle = rgbStr(a1, 0.85);
                    ctx.fillRect(bx, by, bw * pct, bh);
                    // puntos de pasos
                    for (let i = 0; i < seq.length; i++) {
                        const px2 = bx + (i / seq.length) * bw + (bw / seq.length) * 0.5;
                        const done = i < inputIdx;
                        ctx.beginPath();
                        ctx.arc(px2, by + 2, done ? 3.5 : 2, 0, Math.PI * 2);
                        ctx.fillStyle = done ? rgbStr(a1, 1) : 'rgba(255,255,255,0.25)';
                        ctx.fill();
                    }
                }

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

