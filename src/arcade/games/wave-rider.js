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
                    // primeras 3 puertas: hueco 25% más grande (rampa de entrada)
                const rampBonus = gates < 3 ? 0.25 : gates < 6 ? 0.1 : 0;
                const gapH = clamp(H * (CFG.gap * (1 + rampBonus) - Math.min(gates, 40) * 0.002), H * CFG.gapMin, H * CFG.gap);
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
                        const pts = 100 + Math.min(gates, 30) * 5;
                        score += pts;
                        elGates.textContent = gates;
                        g.successFlash = 0.5;
                        api.burst(px, py, { n: 16, power: 0.9, accent: 1 });
                        api.addFloat(px, py - 30, '+' + pts, accentRgb(1));
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

