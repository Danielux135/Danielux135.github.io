import { canvas, ctx } from '../context.js';
import { hslToRgb } from '../../color-utils.js';

// tema 14: partículas atraídas/repelidas por polos magnéticos móviles
let _magParts = [], _magPoles = [], _magW = 0;
// genera las partículas y la configuración inicial de los tres polos
function _buildMagnetic() {
    _magW = canvas.width;
    _magParts = Array.from({ length: 220 }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        vx:    (Math.random() - 0.5) * 20,
        vy:    (Math.random() - 0.5) * 20,
        hue:   Math.random() * 360,
        trail: [],
    }));
    _magPoles = [
        { bx: 0.28, by: 0.40, sign:  1 },
        { bx: 0.72, by: 0.60, sign: -1 },
        { bx: 0.50, by: 0.22, sign:  1 },
    ];
}
// renderiza un frame del campo magnético con polos que se desplazan lentamente
function drawMagnetic(beat, dt, t) {
    if (canvas.width !== _magW) _buildMagnetic();
    const W = canvas.width, H = canvas.height;
    // polos con posición que oscila suavemente con el tiempo
    const poles = [
        { x: W * (0.28 + 0.12 * Math.sin(t * 0.28)),     y: H * (0.40 + 0.12 * Math.cos(t * 0.35)),     sign:  1 },
        { x: W * (0.72 + 0.12 * Math.sin(t * 0.41 + 1)), y: H * (0.60 + 0.12 * Math.cos(t * 0.29 + 2)), sign: -1 },
        { x: W * (0.50 + 0.18 * Math.sin(t * 0.19 + 3)), y: H * (0.28 + 0.12 * Math.cos(t * 0.55)),     sign:  1 },
    ];

    _magParts.forEach(p => {
        let fx = 0, fy = 0;
        poles.forEach(pole => {
            const dx = pole.x - p.x;
            const dy = pole.y - p.y;
            const d  = Math.sqrt(dx * dx + dy * dy) + 1;
            const f  = pole.sign * 7500 / (d * d) * (1 + beat * 2.5);
            fx += (dx / d) * f;
            fy += (dy / d) * f;
        });
        p.vx = p.vx * 0.90 + fx * dt;
        p.vy = p.vy * 0.90 + fy * dt;
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const max = 90 + beat * 70;
        if (spd > max) { p.vx = p.vx / spd * max; p.vy = p.vy / spd * max; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 14) p.trail.shift();
        if (p.trail.length < 2) return;

        const [r, g, b] = hslToRgb((p.hue + beat * 90) % 360, 82, 55);
        // estela como un único trazo con gradiente → 1 stroke por partícula en vez de 13
        const t0 = p.trail[0], tN = p.trail[p.trail.length - 1];
        const gr = ctx.createLinearGradient(t0.x, t0.y, tN.x, tN.y);
        gr.addColorStop(0, `rgba(${r},${g},${b},0)`);
        gr.addColorStop(1, `rgba(${r},${g},${b},${0.07 + beat * 0.1})`);
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i].x, p.trail[i].y);
        ctx.strokeStyle = gr;
        ctx.lineWidth   = 1.2;
        ctx.stroke();
        const pr = 1.2 + beat * 2.5;
        // glow falso: círculo extra semitransparente sin shadowblur
        if (beat > 0.25) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, pr * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${beat * 0.1})`;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.55 + beat * 0.45})`;
        ctx.fill();
    });
    ctx.shadowBlur = 0;
}

export function resetMagnetic() { _magParts = []; _magW = 0; }
export { drawMagnetic };
