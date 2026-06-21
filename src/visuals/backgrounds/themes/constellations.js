import { canvas, ctx, isLightTheme as isLight } from '../context.js';

const COLORS_DARK  = ['rgba(0,200,255,', 'rgba(139,92,246,', 'rgba(255,255,255,'];
const COLORS_LIGHT = ['rgba(0,120,200,', 'rgba(100,40,210,', 'rgba(30,50,120,'];
function particleColors() { return isLight() ? COLORS_LIGHT : COLORS_DARK; }

class Particle {
    constructor() { this.init(); }
    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.baseVx = this.vx;
        this.baseVy = this.vy;
        this.r = Math.random() * 1.8 + 0.6;
        this.baseR = this.r;
        this.baseAlpha = Math.random() * 0.35 + 0.1;
        this.colorIdx = Math.floor(Math.random() * 3);
    }
    update(beat) {
        const b2 = beat * beat;
        const boost = 1 + beat * 18;
        this.x += this.vx * boost;
        this.y += this.vy * boost;
        const margin = this.baseR * 6 + 36;
        if (this.x < margin) { this.x = margin; this.vx = Math.abs(this.vx); }
        else if (this.x > canvas.width - margin) { this.x = canvas.width - margin; this.vx = -Math.abs(this.vx); }
        if (this.y < margin) { this.y = margin; this.vy = Math.abs(this.vy); }
        else if (this.y > canvas.height - margin) { this.y = canvas.height - margin; this.vy = -Math.abs(this.vy); }
    }
    draw(beat) {
        const b2 = beat * beat;
        const rBoost = 1 + beat * 3.5;
        const baseAlpha = isLight() ? this.baseAlpha * 2.2 : this.baseAlpha;
        const alpha = Math.min(baseAlpha * (1 + b2 * 2.5), 0.98);
        const r = this.baseR * rBoost;
        const colors = particleColors();
        const colorIdx = beat > 0.5 ? (this.colorIdx + 1) % colors.length : this.colorIdx;
        // glow falso: halo semitransparente sin shadowblur
        if (beat > 0.4) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 4.5, 0, Math.PI * 2);
            ctx.fillStyle = colors[colorIdx] + (b2 * 0.28) + ')';
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = colors[colorIdx] + alpha + ')';
        ctx.fill();
    }
}
const PARTICLE_COUNT = 55;
const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
// reusable para conexiones entre partículas, evita allocar cada frame
const _connBuf = [];
// dibuja las líneas entre partículas cercanas — batching por tier para minimizar flushes de GPU
function drawConnections(beat) {
    const MAX_DIST = 115 + beat * 70;
    const light = isLight();
    const baseOpacity = light ? 0.45 : 0.18;
    const maxOp = baseOpacity + beat * 0.4;
    const colorBase = beat > 0.25
        ? (light ? '100,40,210' : '139,92,246')
        : (light ? '0,120,200'  : '0,200,255');
    // recolecta conexiones válidas una sola vez
    _connBuf.length = 0;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const d  = Math.sqrt(dx * dx + dy * dy);
            if (d < MAX_DIST) _connBuf.push(i, j, d);
        }
    }
    // 3 tiers de opacidad → 3 stroke() en vez de ~1485
    const TIERS = 3;
    ctx.lineWidth = 0.5 + beat * 1.2;
    for (let ti = 0; ti < TIERS; ti++) {
        const dLo = (ti / TIERS) * MAX_DIST;
        const dHi = ((ti + 1) / TIERS) * MAX_DIST;
        const midFrac = 1 - (dLo + dHi) / 2 / MAX_DIST;
        ctx.strokeStyle = `rgba(${colorBase},${(maxOp * midFrac).toFixed(3)})`;
        ctx.beginPath();
        for (let k = 0; k < _connBuf.length; k += 3) {
            const d = _connBuf[k + 2];
            if (d < dLo || d >= dHi) continue;
            const pi = _connBuf[k], pj = _connBuf[k + 1];
            ctx.moveTo(particles[pi].x, particles[pi].y);
            ctx.lineTo(particles[pj].x, particles[pj].y);
        }
        ctx.stroke();
    }
}


// tema 0: dibuja las partículas como constelaciones con conexiones entre ellas
function drawConstellation(beat) {
    particles.forEach(p => { p.update(beat); p.draw(beat); });
    drawConnections(beat);
}

export { drawConstellation };
