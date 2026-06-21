import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

let _galaxyStars = [], _galW = 0, _galH = 0;

function _buildGalaxy() {
    _galW = canvas.width;
    _galH = canvas.height;
    let seed = 0x6d2b79f5;
    const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    const stars = [];

    for (let i = 0; i < 840; i++) {
        const arm = i % 3;
        const d = Math.pow(rand(), 0.58) * 0.5;
        const base = (arm / 3) * Math.PI * 2;
        const angle = base + d * Math.PI * 3.25 + (rand() - 0.5) * (0.18 + d * 0.8);
        stars.push({
            dx: Math.cos(angle) * d,
            dy: Math.sin(angle) * d,
            size: 0.45 + rand() * 1.7,
            spd: 0.08 + (1 - d * 2) * 0.25,
            alpha: 0.22 + rand() * 0.78,
            fi: d * 2,
        });
    }

    for (let i = 0; i < 180; i++) {
        const angle = rand() * Math.PI * 2;
        const d = Math.pow(rand(), 1.9) * 0.11;
        stars.push({
            dx: Math.cos(angle) * d,
            dy: Math.sin(angle) * d,
            size: 0.7 + rand() * 2.1,
            spd: 0.28 + rand() * 0.14,
            alpha: 0.35 + rand() * 0.65,
            fi: rand() * 0.28,
        });
    }

    _galaxyStars = stars;
}

function drawGalaxy(beat, dt, t) {
    if (canvas.width !== _galW || canvas.height !== _galH) _buildGalaxy();
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const R = Math.min(canvas.width * 0.62, canvas.height * 0.88);
    const rot = t * 0.07;
    const bBeat = Math.min(beat, 0.82);

    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (0.08 + bBeat * 0.024));
    core.addColorStop(0, `rgba(${a1[0]},${a1[1]},${a1[2]},${0.13 + bBeat * 0.12})`);
    core.addColorStop(0.55, `rgba(${a2[0]},${a2[1]},${a2[2]},${0.055 + bBeat * 0.075})`);
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, R * (0.09 + bBeat * 0.026), 0, Math.PI * 2);
    ctx.fill();

    _galaxyStars.forEach(s => {
        const angle = Math.atan2(s.dy, s.dx) + rot * s.spd;
        const d = Math.sqrt(s.dx * s.dx + s.dy * s.dy);
        const x = cx + Math.cos(angle) * d * R;
        const y = cy + Math.sin(angle) * d * R * 0.42;
        const fi = Math.min(s.fi, 1);
        const r = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b = a1[2] + (a2[2] - a1[2]) * fi | 0;
        const al = s.alpha * (0.28 + bBeat * 0.34);
        const sz = s.size * (1 + bBeat * 1.15);
        if (bBeat > 0.25 && sz > 1.05) {
            ctx.beginPath();
            ctx.arc(x, y, sz * 2.45, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${al * bBeat * 0.16})`;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${al})`;
        ctx.fill();
    });
}

export function resetGalaxy() { _galaxyStars = []; _galW = 0; _galH = 0; }
export { drawGalaxy };
