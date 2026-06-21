import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 19: caleidoscopio — motivos geométricos distintos replicados con simetría radial
const _KAL_SEG = 12;
let _kalLayers = null;
// genera parámetros aleatorios para las formas de cada motivo
function _buildKal() {
    const rnd = () => Math.random();
    _kalLayers = {
        // 4 puntos que forman un rombo animado (motivo A)
        diamond: Array.from({ length: 4 }, (_, i) => ({
            rBase: 0.15 + i * 0.17, rAmp: 0.04 + rnd() * 0.08,
            rSpd:  0.3  + rnd() * 0.6, aOff: rnd() * 0.4,
            aAmp:  0.06 + rnd() * 0.12, aSpd: 0.2 + rnd() * 0.5,
            phase: rnd() * Math.PI * 2, hue: rnd(),
        })),
        // 3 puntos: triángulo curvo (motivo B)
        tri: Array.from({ length: 3 }, (_, i) => ({
            rBase: 0.10 + i * 0.25, rAmp: 0.05 + rnd() * 0.10,
            rSpd:  0.4  + rnd() * 0.7, aOff: 0.1 + rnd() * 0.6,
            aAmp:  0.10 + rnd() * 0.18, aSpd: 0.3 + rnd() * 0.6,
            phase: rnd() * Math.PI * 2, hue: rnd(),
        })),
        // 5 puntos distribuidos en radio: pétalos (motivo C)
        petal: Array.from({ length: 5 }, (_, i) => ({
            rBase: 0.08 + i * 0.175, rAmp: 0.03 + rnd() * 0.07,
            rSpd:  0.5  + rnd() * 0.8, aOff: rnd() * 0.5,
            aAmp:  0.04 + rnd() * 0.10, aSpd: 0.25 + rnd() * 0.5,
            phase: rnd() * Math.PI * 2, hue: rnd(),
        })),
        // 2 puntos: segmentos cruzados (motivo D, sencillo pero distinto)
        cross: Array.from({ length: 2 }, (_, i) => ({
            rBase: 0.20 + i * 0.45, rAmp: 0.06 + rnd() * 0.10,
            rSpd:  0.6  + rnd() * 0.9, aOff: 0.15 + rnd() * 0.5,
            aAmp:  0.12 + rnd() * 0.20, aSpd: 0.4 + rnd() * 0.7,
            phase: rnd() * Math.PI * 2, hue: rnd(),
        })),
    };
}

// HSL → RGB
function _hslToRgb(h, s, l) {
    h = ((h % 1) + 1) % 1;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const f = (x) => { x=((x%1)+1)%1; return x<1/6?p+(q-p)*6*x:x<.5?q:x<2/3?p+(q-p)*(2/3-x)*6:p; };
    return [f(h+1/3)*255|0, f(h)*255|0, f(h-1/3)*255|0];
}

// evalúa posición cartesiana de un nodo dentro de la cuña (wedge en radianes)
function _kpt(n, wedge, t, maxR, tHue) {
    const r = (n.rBase + Math.sin(t * n.rSpd + n.phase) * n.rAmp) * maxR;
    const a = (n.aOff  + Math.sin(t * n.aSpd + n.phase) * n.aAmp) * wedge;
    const [cr, cg, cb] = _hslToRgb((n.hue + tHue) % 1, 0.88, 0.58);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, r: cr, g: cg, b: cb };
}

// replica fn() en los SEG segmentos con espejo alternado
function _kalSym(cx, cy, spin, wedge, fn) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(spin);
    for (let s = 0; s < _KAL_SEG; s++) {
        ctx.save();
        ctx.rotate(s * wedge);
        if (s % 2 === 1) ctx.scale(1, -1);
        fn();
        ctx.restore();
    }
    ctx.restore();
}

function drawPlasma(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    if (!_kalLayers) _buildKal();
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const cx = W / 2, cy = H / 2;
    const maxR = Math.min(W, H) * 0.50;
    const wedge = (Math.PI * 2) / _KAL_SEG;

    ctx.fillStyle = 'rgba(8,13,26,0.14)';
    ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round';

    const tH = t * 0.06;   // ciclo de color global lento
    const lw  = 1.3 + beat * 2.0;

    // calcula los puntos de cada motivo una sola vez por frame
    const D = _kalLayers.diamond.map((n, i) => _kpt(n, wedge, t, maxR, tH + i * 0.08));
    const T = _kalLayers.tri.map((n, i)     => _kpt(n, wedge, t, maxR, tH + 0.30 + i * 0.12));
    const P = _kalLayers.petal.map((n, i)   => _kpt(n, wedge, t, maxR, tH + 0.55 + i * 0.07));
    const X = _kalLayers.cross.map((n, i)   => _kpt(n, wedge, t, maxR, tH + 0.75 + i * 0.18));

    // ── MOTIVO A: ROMBO ──────────────────────────────────────────────────────
    // cuatro vértices conectados en rombo (0-1-2-3-0) + diagonales (0-2, 1-3)
    _kalSym(cx, cy, t * 0.08, wedge, () => {
        const [p0, p1, p2, p3] = D;
        // relleno del rombo
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fillStyle = `rgba(${p1.r},${p1.g},${p1.b},${0.09 + beat * 0.10})`;
        ctx.fill();
        // contorno
        ctx.strokeStyle = `rgba(${p0.r},${p0.g},${p0.b},${0.50 + beat * 0.30})`;
        ctx.lineWidth = lw;
        ctx.stroke();
        // diagonales interiores
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${p2.r},${p2.g},${p2.b},${0.30 + beat * 0.20})`;
        ctx.lineWidth = lw * 0.6; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p3.x, p3.y);
        ctx.strokeStyle = `rgba(${p3.r},${p3.g},${p3.b},${0.30 + beat * 0.20})`;
        ctx.stroke();
    });

    // ── MOTIVO B: TRIÁNGULO RELLENO ───────────────────────────────────────────
    _kalSym(cx, cy, -t * 0.06, wedge, () => {
        const [p0, p1, p2] = T;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
        ctx.closePath();
        ctx.fillStyle   = `rgba(${p1.r},${p1.g},${p1.b},${0.13 + beat * 0.12})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${p0.r},${p0.g},${p0.b},${0.55 + beat * 0.30})`;
        ctx.lineWidth = lw * 1.1; ctx.stroke();
        // línea desde centro al vértice central
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(${p2.r},${p2.g},${p2.b},${0.25 + beat * 0.15})`;
        ctx.lineWidth = lw * 0.5; ctx.stroke();
    });

    // ── MOTIVO C: PÉTALOS (arcos de cuadrícula radial) ───────────────────────
    // conecta cada punto con el siguiente y con el centro formando sectores
    _kalSym(cx, cy, t * 0.13, wedge, () => {
        for (let i = 0; i < P.length; i++) {
            const p  = P[i];
            const pn = P[(i + 1) % P.length];
            // sector curvo entre punto y centro
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(p.x, p.y);
            ctx.quadraticCurveTo(
                (p.x + pn.x) * 0.7, (p.y + pn.y) * 0.7,
                pn.x, pn.y
            );
            ctx.closePath();
            ctx.fillStyle   = `rgba(${p.r},${p.g},${p.b},${0.07 + beat * 0.08})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${0.40 + beat * 0.25})`;
            ctx.lineWidth = lw * 0.8; ctx.stroke();
        }
    });

    // ── MOTIVO D: SEGMENTOS CRUZADOS con su simétrico espejo ────────────────
    // 2 puntos → línea simple más línea reflejada manualmente (crea X)
    _kalSym(cx, cy, -t * 0.11, wedge, () => {
        const [p0, p1] = X;
        // segmento principal
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(${p0.r},${p0.g},${p0.b},${0.55 + beat * 0.30})`;
        ctx.lineWidth = lw * 1.2; ctx.stroke();
        // segmento simétrico respecto al eje Y de la cuña
        ctx.beginPath(); ctx.moveTo(p0.x, -p0.y); ctx.lineTo(p1.x, -p1.y);
        ctx.strokeStyle = `rgba(${p1.r},${p1.g},${p1.b},${0.40 + beat * 0.25})`;
        ctx.lineWidth = lw; ctx.stroke();
        // punto en cruce central
        const mx = (p0.x + p1.x) * 0.5, my = (p0.y + p1.y) * 0.5;
        ctx.beginPath(); ctx.arc(mx, my, 2.5 + beat * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.55 + beat * 0.30})`; ctx.fill();
    });

    // ── POLÍGONOS CONCÉNTRICOS (3-6 lados, uno por capa, giros distintos) ───
    ctx.save(); ctx.translate(cx, cy);
    [[3, 0.10, 0.09, 1], [4, 0.26, -0.07, 0], [5, 0.44, 0.05, 0.5], [6, 0.78, -0.04, 0.25]].forEach(([sides, fi, spd, hOff]) => {
        const rad = maxR * (0.15 + fi * 0.75);
        const rot = t * spd;
        const [pr, pg, pb] = _hslToRgb((tH + hOff) % 1, 0.82, 0.58);
        ctx.beginPath();
        for (let v = 0; v <= sides; v++) {
            const ang = (v / sides) * Math.PI * 2 + rot;
            v === 0 ? ctx.moveTo(Math.cos(ang)*rad, Math.sin(ang)*rad)
                    : ctx.lineTo(Math.cos(ang)*rad, Math.sin(ang)*rad);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${pr},${pg},${pb},${0.28 + beat * 0.22})`;
        ctx.lineWidth = 1.2 + beat * 1.5; ctx.stroke();
        ctx.fillStyle = `rgba(${pr},${pg},${pb},${0.03 + beat * 0.04})`; ctx.fill();
    });
    ctx.restore();

    // ── PUNTOS BRILLANTES en los vértices de cada motivo ────────────────────
    const allPts = [
        { arr: D, spin: t*0.08  }, { arr: T, spin: -t*0.06 },
        { arr: P, spin: t*0.13  }, { arr: X, spin: -t*0.11 },
    ];
    for (const { arr, spin } of allPts) {
        _kalSym(cx, cy, spin, wedge, () => {
            for (const p of arr) {
                const dr = 3 + beat * 5;
                const g  = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, dr * 2.5);
                g.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.75)`);
                g.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
                ctx.beginPath(); ctx.arc(p.x, p.y, dr * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = g; ctx.fill();
                ctx.beginPath(); ctx.arc(p.x, p.y, dr * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${0.70 + beat * 0.25})`; ctx.fill();
            }
        });
    }
}

export function resetKaleidoscope() { _kalLayers = null; }
export { drawPlasma };
