import { canvas, ctx } from '../context.js';

// tema 6: fuegos artificiales con partículas y estelas
const _FW_PAL = [[255,60,100],[0,200,255],[255,200,0],[200,80,255],[0,255,150],[255,120,0]];
const _fwBursts = [];
let _fwPrevBeat = 0, _fwLastT = 0;
// lanza una explosión de fuegos artificiales con partículas radiales
function _spawnBurst(beat) {
    if (_fwBursts.length >= 7) return;
    const [r, g, b] = _FW_PAL[Math.floor(Math.random() * _FW_PAL.length)];
    const x = canvas.width  * (0.15 + Math.random() * 0.7);
    const y = canvas.height * (0.08 + Math.random() * 0.65);
    const n = 45 + Math.floor(Math.random() * 25);
    _fwBursts.push({
        x, y, r, g, b,
        parts: Array.from({ length: n }, (_, i) => {
            const angle = (Math.PI * 2 / n) * i + (Math.random() - 0.5) * 0.4;
            const spd   = 60 + Math.random() * 180 + beat * 80;
            return { vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 1, trail: [] };
        }),
    });
}
// renderiza un frame de fuegos artificiales con gravedad y estelas con historial de posiciones
function drawFireworks(beat, dt, t) {
    if (beat > 0.22 && _fwPrevBeat < beat && t - _fwLastT > 0.35) {
        _spawnBurst(beat); _fwLastT = t;
    }
    if (_fwBursts.length === 0 && t - _fwLastT > 3) {
        _spawnBurst(0.3); _fwLastT = t;
    }
    _fwPrevBeat = beat;
    const G = 55;
    for (let bi = _fwBursts.length - 1; bi >= 0; bi--) {
        const bst = _fwBursts[bi];
        let alive = false;
        bst.parts.forEach(p => {
            if (p.life <= 0) return;
            alive = true;
            p.life -= dt * (0.5 + Math.random() * 0.12);
            const prog = 1 - p.life;
            const px = bst.x + p.vx * prog;
            const py = bst.y + p.vy * prog + G * prog * prog;
            p.trail.push({ x: px, y: py });
            if (p.trail.length > 9) p.trail.shift();
            const al = Math.max(p.life, 0);
            if (p.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(p.trail[0].x, p.trail[0].y);
                for (let k = 1; k < p.trail.length; k++) ctx.lineTo(p.trail[k].x, p.trail[k].y);
                ctx.strokeStyle = `rgba(${bst.r},${bst.g},${bst.b},${al * 0.28})`;
                ctx.lineWidth = al * 1.8; ctx.shadowBlur = 0; ctx.stroke();
            }
            // glow falso: halo exterior sin shadowblur
            ctx.beginPath(); ctx.arc(px, py, al * 9, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${bst.r},${bst.g},${bst.b},${al * 0.2})`; ctx.fill();
            ctx.beginPath(); ctx.arc(px, py, al * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${bst.r},${bst.g},${bst.b},${al})`; ctx.fill();
        });
        if (!alive) _fwBursts.splice(bi, 1);
    }
}

export function resetFireworks() {
    _fwBursts.length = 0;
    _fwLastT = 0;
    _fwPrevBeat = 0;
}

export { drawFireworks };
