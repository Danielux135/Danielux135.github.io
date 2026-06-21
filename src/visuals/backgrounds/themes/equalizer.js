import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 8: anillos concéntricos que se contraen hacia el centro como un vórtice
function drawEqualizer(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const cx = W * 0.5, cy = H * 0.5;
    const arcR = Math.min(W, H) * (0.34 + beat * 0.03);

    // glow radial alrededor del círculo (4 pasadas)
    for (let pass = 0; pass < 4; pass++) {
        const rOuter = arcR + pass * 8 + 4;
        const rInner = Math.max(0, arcR - pass * 6);
        const glowG  = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
        const alpha  = (0.12 + beat * 0.15) * Math.pow(0.5, pass);
        glowG.addColorStop(0,   `rgba(${a1[0]},${a1[1]},${a1[2]},0)`);
        glowG.addColorStop(0.5, `rgba(${a1[0]},${a1[1]},${a1[2]},${alpha})`);
        glowG.addColorStop(1,   `rgba(${a1[0]},${a1[1]},${a1[2]},0)`);
        ctx.fillStyle = glowG;
        ctx.fillRect(0, 0, W, H);
    }

    // barras del ecualizador circular (80 barras)
    const specBars  = 80;
    const specStart = arcR + 1;
    for (let i = 0; i < specBars; i++) {
        const ang  = (i / specBars) * Math.PI * 2 - Math.PI / 2;
        const ph   = t * 1.2 + i * (Math.PI * 2 / specBars) * 2.5;
        const bh   = arcR * (0.04 + 0.18 * Math.abs(Math.sin(ph)) * (0.15 + beat * 0.85));
        const x1   = cx + Math.cos(ang) * specStart;
        const y1   = cy + Math.sin(ang) * specStart;
        const x2   = cx + Math.cos(ang) * (specStart + bh);
        const y2   = cy + Math.sin(ang) * (specStart + bh);
        const frac = i / specBars;
        const cr   = frac < 0.5
            ? [a1[0] + (a2[0]-a1[0])*frac*2, a1[1] + (a2[1]-a1[1])*frac*2, a1[2] + (a2[2]-a1[2])*frac*2]
            : [a2[0] + (a1[0]-a2[0])*(frac-0.5)*2, a2[1] + (a1[1]-a2[1])*(frac-0.5)*2, a2[2] + (a1[2]-a2[2])*(frac-0.5)*2];
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(${cr[0]|0},${cr[1]|0},${cr[2]|0},${0.18 + beat * 0.55})`;
        ctx.lineWidth   = 1.8;
        ctx.stroke();
    }

    // círculo principal
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${a1[0]},${a1[1]},${a1[2]},${0.22 + beat * 0.35})`;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // círculo interior secundario
    ctx.beginPath();
    ctx.arc(cx, cy, arcR * 0.88, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${a2[0]},${a2[1]},${a2[2]},${0.10 + beat * 0.18})`;
    ctx.lineWidth   = 1;
    ctx.stroke();

    // flow lines horizontales sutiles
    for (let li = 0; li < 6; li++) {
        const yBase = H * (0.22 + li * 0.12);
        const amp   = (12 + li * 6) * (1 + beat * 1.2);
        const freq  = 0.008 + li * 0.002;
        const phase = t * (0.4 + li * 0.15) + li * 1.1;
        const cr    = li % 2 === 0 ? a1 : a2;
        const alpha = (0.04 + beat * 0.07) * (1 - li * 0.1);
        ctx.beginPath();
        for (let x = 0; x <= W; x += 4) {
            const y = yBase + Math.sin(x * freq + phase) * amp
                             + Math.sin(x * freq * 0.5 + phase * 1.3) * amp * 0.4;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${cr[0]},${cr[1]},${cr[2]},${alpha})`;
        ctx.lineWidth   = 1;
        ctx.stroke();
    }
}

export { drawEqualizer };
