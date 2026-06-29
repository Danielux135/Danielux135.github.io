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
        let safeFlash = 0; // >0 → flash verde "SAFE" al esquivar con poco margen
        let hasMoved = false; // para detectar si el jugador ya interactuó
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
                        if (!r.done) {
                            dodged++; score += 25;
                            // SAFE flash si esquivamos con poco margen
                            const d = Math.hypot(px - r.cx, py - r.cy);
                            if (Math.abs(d - r.maxR) < 55) safeFlash = 0.45;
                        }
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

                // warning si una onda está muy cerca del jugador
                let danger = false;
                for (const r of rings) {
                    if (r.done) continue;
                    const d = Math.hypot(px - r.cx, py - r.cy);
                    if (Math.abs(d - r.r) < 44 && invuln <= 0) { danger = true; break; }
                }
                if (danger) {
                    ctx.beginPath();
                    ctx.arc(px, py, PR + 8 + Math.sin(t * 22) * 3, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,60,60,0.7)';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }

                // SAFE flash al esquivar con poco margen
                if (safeFlash > 0) {
                    safeFlash -= dt * 2.5;
                    ctx.fillStyle = rgbStr(accentRgb(1), Math.max(0, safeFlash) * 0.16);
                    ctx.fillRect(0, 0, W, H);
                    if (safeFlash > 0.08) {
                        ctx.font = `900 ${Math.round(Math.min(W, H) * 0.065)}px Montserrat, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.globalAlpha = Math.min(1, safeFlash * 2.5);
                        ctx.fillStyle = rgbStr(accentRgb(1), 1);
                        ctx.fillText('SAFE', W / 2, H / 2 - 55);
                        ctx.globalAlpha = 1;
                    }
                }

                // tutorial primeros 3.5s si el jugador no ha movido
                if (t < 3.5 && !hasMoved) {
                    const alpha = clamp(1 - (t - 2.5) / 1, 0, 1);
                    const isTouch = window.matchMedia('(pointer:coarse)').matches;
                    const hint = isTouch ? '👆 ARRASTRA EL ORBE' : '🖱 MUEVE EL RATÓN';
                    ctx.font = `700 ${Math.round(Math.min(W, H) * 0.046)}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'alphabetic';
                    ctx.fillStyle = rgbStr(a1, 0.72 * alpha);
                    ctx.fillText(hint, W / 2, H * 0.8);
                    const dist2 = 42 + Math.sin(t * 4) * 5;
                    const arrows = [{ dx: -dist2, dy: 0, a: '←' }, { dx: dist2, dy: 0, a: '→' }, { dx: 0, dy: -dist2, a: '↑' }, { dx: 0, dy: dist2, a: '↓' }];
                    ctx.font = `${Math.round(Math.min(W, H) * 0.04)}px sans-serif`;
                    ctx.textBaseline = 'middle';
                    ctx.globalAlpha = alpha * 0.65;
                    arrows.forEach(({ dx, dy, a }) => { ctx.fillText(a, px + dx, py + dy); });
                    ctx.globalAlpha = 1;
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
            onTap(x, y) { tx = x; ty = y; hasMoved = true; },
            onMove(x, y) { tx = x; ty = y; hasMoved = true; },
            forceEnd() { finish(); },
            destroy() { rings.length = 0; },
        };
    },
});

