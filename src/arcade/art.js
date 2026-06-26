import * as Runtime from './runtime.js';
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

/* ---- Arte canvas animado por juego ---- */
Arcade._drawArt = function(ctx, cv, id) {
    const W = cv.offsetWidth || 340, H = cv.offsetHeight || 260;
    cv.width = W; cv.height = H;
    const beat = () => (typeof visualState.beat === 'number' ? visualState.beat : 0);
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

        party(ctx, t) { // Danielux Party Arena: robots + corona + minijuegos online
            ctx.clearRect(0, 0, W, H);
            const b = beat();
            const grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W,H)*0.7);
            grd.addColorStop(0, rgbStr(a1(), 0.22 + b*0.12));
            grd.addColorStop(0.5, rgbStr(a2(), 0.12));
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd; ctx.fillRect(0,0,W,H);
            // Arena central
            for (let i=0;i<4;i++) {
                ctx.beginPath();
                ctx.ellipse(cx, H*0.62, 70+i*28+b*10, 26+i*9+b*4, 0, 0, PI2);
                ctx.strokeStyle = rgbStr(i%2?a2():a1(), 0.42-i*0.06);
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            // Corona
            ctx.save(); ctx.translate(cx, H*0.34);
            ctx.strokeStyle = rgbStr('255 216 74', .9); ctx.fillStyle = rgbStr('255 216 74', .18+b*.15); ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-38, 18); ctx.lineTo(-26,-12); ctx.lineTo(-10,10); ctx.lineTo(0,-24); ctx.lineTo(10,10); ctx.lineTo(26,-12); ctx.lineTo(38,18); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.restore();
            // Robots alrededor
            const colors = [a1(), a2(), '32 255 145', '255 216 74', '255 66 208'];
            for (let i=0;i<5;i++) {
                const ang = -Math.PI*0.95 + i*(Math.PI*0.48) + Math.sin(t*.8+i)*0.05;
                const x = cx + Math.cos(ang)*95;
                const y = H*0.62 + Math.sin(ang)*32;
                const col = colors[i%colors.length];
                ctx.save(); ctx.translate(x,y);
                const r = 13 + b*2;
                ctx.fillStyle = rgbStr(col,.18); ctx.strokeStyle = rgbStr(col,.88); ctx.lineWidth = 2;
                ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-r,-r,r*2,r*2,7); else ctx.rect(-r,-r,r*2,r*2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = rgbStr(col,.95); ctx.fillRect(-6,-2,4,4); ctx.fillRect(2,-2,4,4);
                ctx.strokeStyle = rgbStr(col,.55); ctx.beginPath(); ctx.moveTo(-9, r); ctx.lineTo(-18, r+14); ctx.moveTo(9,r); ctx.lineTo(18,r+14); ctx.stroke();
                ctx.restore();
            }
            // iconos inferiores
            const labels = ['?', '😂', '⚔', '💣'];
            labels.forEach((txt,i)=>{
                const x = W*(0.22+i*0.19), y = H*0.84;
                ctx.beginPath();
                if(ctx.roundRect) ctx.roundRect(x-22,y-16,44,32,8); else ctx.rect(x-22,y-16,44,32);
                ctx.fillStyle = 'rgba(0,10,32,.55)'; ctx.fill();
                ctx.strokeStyle = rgbStr(i%2?a2():a1(), .45); ctx.stroke();
                ctx.font = `900 ${txt.length>1?13:18}px Montserrat, sans-serif`;
                ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.fillText(txt,x,y+1);
            });
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
    const artFns = { tap: artists.tap, hero: artists.hero, surfer: artists.surfer, simon: artists.simon, dodger: artists.dodger, tempo: artists.tempo, bass: artists.bass, party: artists.party };
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


