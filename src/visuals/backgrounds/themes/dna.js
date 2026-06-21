import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 12: doble hélice de adn con peldaños y nodos reactivos al beat
function drawDNA(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const cx   = W / 2;
    const amp  = W * 0.22 * (1 + beat * 0.25);
    const freq = 1.8;
    const spd  = t * 0.7;

    // dibuja las dos hélices con los colores de acento
    [0, Math.PI].forEach((offset, si) => {
        const nc = si === 0 ? a1 : a2;
        ctx.beginPath();
        for (let yi = 0; yi <= H; yi += 2) {
            const phase = (yi / H) * Math.PI * 2 * freq + spd + offset;
            const x = cx + Math.cos(phase) * amp;
            yi === 0 ? ctx.moveTo(x, yi) : ctx.lineTo(x, yi);
        }
        ctx.strokeStyle = `rgba(${nc[0]},${nc[1]},${nc[2]},${0.35 + beat * 0.3})`;
        ctx.lineWidth   = 2 + beat * 3;
        ctx.stroke();
    });

    // dibuja los peldaños entre hélices y nodos en posiciones clave
    const RUNGS = Math.floor(H / 22);
    for (let i = 0; i <= RUNGS; i++) {
        const y     = (i / RUNGS) * H;
        const phase = (y / H) * Math.PI * 2 * freq + spd;
        const x1    = cx + Math.cos(phase) * amp;
        const x2    = cx + Math.cos(phase + Math.PI) * amp;
        const fi    = (Math.sin(phase) + 1) / 2;
        const r     = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g     = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b     = a1[2] + (a2[2] - a1[2]) * fi | 0;

        ctx.beginPath();
        ctx.moveTo(x1, y); ctx.lineTo(x2, y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.09 + beat * 0.14})`;
        ctx.lineWidth   = 1 + beat;
        ctx.shadowBlur  = 0;
        ctx.stroke();

        if (i % 3 === 0) {
            [[x1, a1], [x2, a2]].forEach(([nx, nc]) => {
                const nr = 3 + beat * 4.5;
                // glow falso: halo sin shadowblur
                if (beat > 0.2) {
                    ctx.beginPath(); ctx.arc(nx, y, nr * 4, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${nc[0]},${nc[1]},${nc[2]},${beat * 0.15})`; ctx.fill();
                }
                ctx.beginPath(); ctx.arc(nx, y, nr, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${nc[0]},${nc[1]},${nc[2]},${0.5 + beat * 0.5})`; ctx.fill();
            });
        }
    }
}

export { drawDNA };
