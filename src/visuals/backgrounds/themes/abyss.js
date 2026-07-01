import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 20: fondo abisal — plancton bioluminiscente a la deriva + criaturas que
// pulsan con el beat, como si la cámara flotara en aguas profundas.
// Profundidad simulada en 3 capas: luz descendente + drifters lejanos (medusas
// difusas y lentas) + plancton en 3 planos de tamaño/velocidad (lejos/medio/cerca).
const PARTICLE_COUNT = 110;
const DRIFTER_COUNT   = 4;

let particles = null;
let drifters   = null;

// capas de profundidad: lejos → pequeño, lento, tenue · cerca → grande, rápido, nítido
const LAYERS = [
    { scale: 0.5, speed: 0.55, alpha: 0.35, blur: 2  },
    { scale: 1.0, speed: 1.0,  alpha: 0.65, blur: 6  },
    { scale: 1.8, speed: 1.6,  alpha: 1.0,  blur: 11 },
];

function ensureParticles(W, H) {
    if (particles && particles.length === PARTICLE_COUNT) return;
    particles = Array.from({ length: PARTICLE_COUNT }, () => {
        const layer = LAYERS[(Math.random() * LAYERS.length) | 0];
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: (0.6 + Math.random() * 1.6) * layer.scale,
            drift: (0.12 + Math.random() * 0.3) * layer.speed,
            phase: Math.random() * Math.PI * 2,
            twinkle: 2 + Math.random() * 3,
            useAccent2: Math.random() < 0.35,
            layer,
        };
    });
}

function ensureDrifters(W, H) {
    if (drifters && drifters.length === DRIFTER_COUNT) return;
    drifters = Array.from({ length: DRIFTER_COUNT }, (_, i) => ({
        x: Math.random() * W,
        y: H * (0.15 + Math.random() * 0.7),
        baseR: 60 + Math.random() * 90,
        speed: 0.06 + Math.random() * 0.08,
        offset: i * 1.7 + Math.random(),
        useAccent2: i % 2 === 0,
    }));
}

function drawAbyss(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    ensureParticles(W, H);
    ensureDrifters(W, H);
    const a1 = _heroAccent(1), a2 = _heroAccent(2);

    // luz que cae desde la superficie y niebla de suelo — encuadra la escena en profundidad
    ctx.shadowBlur = 0;
    const light = ctx.createLinearGradient(0, 0, 0, H);
    light.addColorStop(0,   `rgba(${a1[0]},${a1[1]},${a1[2]},${0.05 + beat * 0.05})`);
    light.addColorStop(0.4, 'rgba(0,0,0,0)');
    light.addColorStop(1,   'rgba(1,3,8,0.35)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, H);

    // criaturas lejanas: halos suaves que laten muy lento, como medusas al fondo
    for (const d of drifters) {
        const rgb = d.useAccent2 ? a2 : a1;
        const drift = Math.sin(t * d.speed + d.offset) * 40;
        const cx = d.x + drift;
        const cy = d.y + Math.cos(t * d.speed * 0.7 + d.offset) * 26;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.6 + d.offset);
        const r = d.baseR * (0.85 + pulse * 0.25) * (1 + beat * 0.5);
        const al = 0.05 + pulse * 0.05 + beat * 0.12;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${al})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // plancton en 3 planos: lo lejano se mueve despacio y tenue, lo cercano rápido y nítido
    for (const p of particles) {
        p.y -= p.drift * (1 + beat * 1.4);
        p.x += Math.sin(t * 0.4 + p.phase) * 0.12 * p.layer.scale;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }

        const rgb = p.useAccent2 ? a2 : a1;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * p.twinkle + p.phase));
        const al = tw * p.layer.alpha * (0.4 + beat * 0.5);
        const r  = p.r * (1 + beat * 0.6);

        ctx.beginPath();
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${al})`;
        ctx.shadowBlur = p.layer.blur + beat * 10;
        ctx.shadowColor = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.min(1, al + 0.2)})`;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

export { drawAbyss };
