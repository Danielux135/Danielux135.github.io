import { canvas, ctx } from '../context.js';
import { hslToRgb } from '../../color-utils.js';

// tema 6b: confeti con rectángulos, círculos y ribbons de colores hsv
let _confetti = [], _confW = 0;
// crea una pieza de confeti con forma, color y movimiento aleatorios
function _mkConfetto() {
    const hue = Math.random() * 360;
    const [r, g, b] = hslToRgb(hue, 90, 60);
    const shape = Math.random();   // 0-0.6 rect, 0.6-0.8 circle, 0.8-1 ribbon
    return {
        x: Math.random() * (canvas.width  + 100) - 50,
        y: Math.random() * -canvas.height,
        w: shape < 0.6 ? 7 + Math.random() * 7 : 5 + Math.random() * 5,
        h: shape < 0.6 ? 3 + Math.random() * 5 : (shape < 0.8 ? 5 + Math.random() * 5 : 2 + Math.random() * 2),
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 5,
        vx: (Math.random() - 0.5) * 50,
        vy: 70 + Math.random() * 110,
        r, g, b, hue, shape,
    };
}
// inicializa el array de confeti y sitúa las primeras 80 piezas en pantalla
function _buildConfetti() {
    _confW = canvas.width;
    _confetti = Array.from({ length: 130 }, _mkConfetto);
    // coloca algunas piezas ya en pantalla para que aparezcan desde el primer frame
    _confetti.forEach((p, i) => { if (i < 80) p.y = Math.random() * canvas.height; });
}
// renderiza un frame de confeti con rotación y color reactivos al beat
function drawConfetti(beat, dt) {
    if (canvas.width !== _confW) _buildConfetti();
    const spd = 1 + beat * 2.2;
    _confetti.forEach(p => {
        p.rot += p.rotSpd * spd * dt;
        p.x   += p.vx * dt + Math.sin(p.rot * 0.5) * 0.4;
        p.y   += p.vy * spd * dt;
        if (p.y > canvas.height + 20) { Object.assign(p, _mkConfetto()); }
        if (p.x < -60) p.x = canvas.width  + 50;
        if (p.x > canvas.width  + 60) p.x = -50;

        const al = 0.55 + beat * 0.35;
        const [r, g, b] = hslToRgb((p.hue + beat * 60) % 360, 88, 58 + beat * 14);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // glow falso: círculo extra semitransparente sin shadowblur
        if (beat > 0.3) {
            ctx.fillStyle = `rgba(${r},${g},${b},${beat * 0.12})`;
            ctx.beginPath(); ctx.arc(0, 0, p.w * 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = `rgba(${r},${g},${b},${al})`;
        if (p.shape < 0.6) {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.shape < 0.8) {
            ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.beginPath(); ctx.ellipse(0, 0, p.w, p.h / 2, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    });
}

export function resetConfetti() {
    _confetti = [];
    _confW = 0;
}

export { drawConfetti };
