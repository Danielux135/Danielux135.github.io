import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 18: bokeh — luces desenfocadas flotando con profundidad de campo, titileo y brillo al beat
const _BOKEH_N = 32;
let _bokeh = null, _bokehW = 0, _bokehH = 0;
function _buildBokeh(W, H) {
    _bokeh = Array.from({ length: _BOKEH_N }, () => {
        const depth = Math.random();   // 0 = lejos (grande/difuso/tenue), 1 = cerca (pequeño/nítido/brillante)
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: (1 - depth) * Math.min(W, H) * 0.16 + 10,
            alpha: 0.05 + depth * 0.16,
            vy: -(0.08 + depth * 0.45),          // los cercanos suben más rápido
            vx: (Math.random() - 0.5) * 0.35,
            tw: Math.random() * Math.PI * 2,     // fase de titileo
            twSpeed: 0.4 + Math.random() * 0.9,
            colT: Math.random(),                 // mezcla de color entre acentos
            depth,
        };
    });
    _bokehW = W; _bokehH = H;
}
function drawFlowField(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    if (!_bokeh || _bokehW !== W || _bokehH !== H) _buildBokeh(W, H);
    const a1 = _heroAccent(1), a2 = _heroAccent(2);

    const prev = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';   // mezcla aditiva → las luces se suman al solaparse

    for (let i = 0; i < _BOKEH_N; i++) {
        const o = _bokeh[i];

        // deriva ascendente (acelerada por la música) con leve vaivén horizontal
        o.y += o.vy * (1 + beat * 0.9);
        o.x += o.vx + Math.sin(t * 0.3 + o.tw) * 0.15;
        if (o.y + o.r < 0) { o.y = H + o.r; o.x = Math.random() * W; }
        if (o.x < -o.r) o.x = W + o.r; else if (o.x > W + o.r) o.x = -o.r;

        // titileo + realce con el beat
        const tw = 0.6 + 0.4 * Math.sin(t * o.twSpeed + o.tw);
        const a  = o.alpha * tw * (1 + beat * 1.1);
        const cw = o.colT;
        const r = (a1[0] * (1 - cw) + a2[0] * cw) | 0;
        const g = (a1[1] * (1 - cw) + a2[1] * cw) | 0;
        const b = (a1[2] * (1 - cw) + a2[2] * cw) | 0;
        const rad = o.r * (1 + beat * 0.18);

        // disco de luz difusa con borde suave (bokeh)
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, rad);
        grad.addColorStop(0,    `rgba(${r},${g},${b},${a})`);
        grad.addColorStop(0.55, `rgba(${r},${g},${b},${a * 0.45})`);
        grad.addColorStop(0.85, `rgba(${r},${g},${b},${a * 0.12})`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, rad, 0, Math.PI * 2);
        ctx.fill();

        // núcleo nítido y brillante solo en las luces cercanas (en foco)
        if (o.depth > 0.62) {
            ctx.beginPath();
            ctx.arc(o.x, o.y, rad * 0.14, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${a * 0.85})`;
            ctx.fill();
        }
    }

    ctx.globalCompositeOperation = prev;
}

export function resetBokeh() { _bokeh = null; _bokehW = 0; _bokehH = 0; }
export { drawFlowField };
