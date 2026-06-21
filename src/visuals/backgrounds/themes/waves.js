import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 10: capas de ondas sinusoidales compuestas reactivas al beat
function drawWaves(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const LAYERS = 8;
    ctx.shadowBlur = 0;
    for (let li = 0; li < LAYERS; li++) {
        const fi    = li / (LAYERS - 1);
        const r     = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g     = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b     = a1[2] + (a2[2] - a1[2]) * fi | 0;
        const amp   = (22 + fi * 70) * (1 + beat * 3);
        const freq  = 0.005 + fi * 0.003;
        const phase = t * (0.4 + fi * 0.5) + li * 1.1;
        const yBase = H * 0.1 + (H * 0.8) * fi;
        const al    = 0.10 + fi * 0.07 + beat * 0.18;

        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
            const y = yBase
                + Math.sin(x * freq       + phase)         * amp
                + Math.sin(x * freq * 2.1 + phase * 1.4)   * amp * 0.35
                + Math.sin(x * freq * 0.5 + phase * 0.7)   * amp * 0.2;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${r},${g},${b},${al})`;
        ctx.lineWidth   = 1.2 + fi * 1.8 + beat * 3.5;
        ctx.stroke();
    }
}

export { drawWaves };
