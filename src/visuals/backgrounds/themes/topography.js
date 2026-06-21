import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 15: curvas de nivel topográficas con distorsión senoidal y glow
function drawTopo(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const LINES = 22;
    const maxR  = Math.min(W, H) * 0.50;

    for (let li = 0; li < LINES; li++) {
        const fi    = li / (LINES - 1);
        const R     = (0.08 + fi * 0.92) * maxR;
        const phase = t * (0.15 + fi * 0.18) + li * 0.35;
        const r     = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g     = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b     = a1[2] + (a2[2] - a1[2]) * fi | 0;
        const al    = (1 - fi * 0.5) * (0.07 + beat * 0.18);

        ctx.beginPath();
        const PTS = 140;
        for (let i = 0; i <= PTS; i++) {
            const angle = (i / PTS) * Math.PI * 2;
            const dist  = R * (
                1
                + 0.22 * Math.sin(angle * 3 + phase)
                + 0.13 * Math.sin(angle * 7 - phase * 1.5)
                + 0.07 * Math.sin(angle * 13 + phase * 0.8)
                + beat  * 0.18 * Math.sin(angle * 5 + t * 2)
            );
            const x = cx + Math.cos(angle) * dist;
            const y = cy + Math.sin(angle) * dist * 0.58;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${al})`;
        ctx.lineWidth   = 0.9 + beat * 2.2;
        ctx.stroke();
    }
}

export { drawTopo };
