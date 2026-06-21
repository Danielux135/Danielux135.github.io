import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 3: bandas de aurora boreal animadas con gradiente
const _AUR_BANDS = Array.from({ length: 5 }, (_, i) => ({
    phase: Math.random() * Math.PI * 2,
    spd:   0.14 + Math.random() * 0.22,
    freq:  0.0025 + Math.random() * 0.003,
    amp:   45 + Math.random() * 65,
    thick: 55 + Math.random() * 80,
    fi:    i / 4,
}));
// renderiza un frame de aurora con bandas ondulantes y opacidad reactiva al beat
function drawAurora(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    _AUR_BANDS.forEach((band, i) => {
        band.phase += band.spd * dt;
        const yBase = H * (0.15 + i * 0.16);
        const amp   = band.amp * (1 + beat * 2.8);
        const r = a1[0] + (a2[0] - a1[0]) * band.fi | 0;
        const g = a1[1] + (a2[1] - a1[1]) * band.fi | 0;
        const b = a1[2] + (a2[2] - a1[2]) * band.fi | 0;
        const al = 0.045 + beat * 0.09 + Math.sin(t * 0.4 + i * 1.2) * 0.012;

        ctx.beginPath();
        ctx.moveTo(0, yBase + Math.sin(band.phase) * amp);
        for (let x = 2; x <= W; x += 4) {
            ctx.lineTo(x, yBase + Math.sin(x * band.freq + band.phase) * amp);
        }
        ctx.lineTo(W, yBase + band.thick + amp * 0.4);
        for (let x = W - 2; x >= 0; x -= 4) {
            ctx.lineTo(x, yBase + band.thick + Math.sin(x * band.freq * 1.4 + band.phase + 1.5) * amp * 0.55);
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, yBase - amp, 0, yBase + band.thick + amp);
        grad.addColorStop(0,    `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.25, `rgba(${r},${g},${b},${al})`);
        grad.addColorStop(0.65, `rgba(${r},${g},${b},${al * 0.75})`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fill();
    });
}

export { drawAurora };
