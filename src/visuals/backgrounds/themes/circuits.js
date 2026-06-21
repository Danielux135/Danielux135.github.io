import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 17: circuitos — pistas de PCB con pulsos de corriente reactivos al beat
let _circW = 0, _circTraces = [], _circPulses = [], _circLastBeat = 0;
const _CIRC_GRID = 60;
function _buildCircuits() {
    _circW = canvas.width;
    _circTraces = [];
    _circPulses = [];
    const W = canvas.width, H = canvas.height;
    const cols = Math.ceil(W / _CIRC_GRID) + 1;
    const rows = Math.ceil(H / _CIRC_GRID) + 1;
    // genera nodos en la cuadrícula con pequeño offset aleatorio
    const nodes = [];
    for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
            nodes.push({
                x: c * _CIRC_GRID + (Math.random() - 0.5) * _CIRC_GRID * 0.3,
                y: r * _CIRC_GRID + (Math.random() - 0.5) * _CIRC_GRID * 0.3,
            });
        }
    }
    const stride = cols + 1;
    // conecta nodos horizontales y verticales como pistas de PCB
    for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
            const idx = r * stride + c;
            if (c < cols && Math.random() > 0.25) {
                _circTraces.push({ a: nodes[idx], b: nodes[idx + 1], len: 0 });
            }
            if (r < rows && Math.random() > 0.25) {
                _circTraces.push({ a: nodes[idx], b: nodes[idx + stride], len: 0 });
            }
        }
    }
    // calcula la longitud de cada traza
    _circTraces.forEach(tr => {
        const dx = tr.b.x - tr.a.x, dy = tr.b.y - tr.a.y;
        tr.len = Math.sqrt(dx * dx + dy * dy);
    });
}
function drawCircuits(beat, dt, t) {
    if (canvas.width !== _circW) _buildCircuits();
    const a1 = _heroAccent(1), a2 = _heroAccent(2);

    // lanza pulsos en cada beat
    if (beat > 0.2 && beat > _circLastBeat && t - (_circPulses[0]?.born || 0) > 0.15) {
        const tr = _circTraces[Math.floor(Math.random() * _circTraces.length)];
        _circPulses.push({ tr, pos: 0, speed: 0.8 + beat * 1.4, str: beat, born: t });
    }
    _circLastBeat = beat;
    for (let i = _circPulses.length - 1; i >= 0; i--) {
        _circPulses[i].pos += _circPulses[i].speed * dt;
        if (_circPulses[i].pos > 1.2) _circPulses.splice(i, 1);
    }

    // dibuja las trazas base (dim)
    ctx.lineWidth = 0.8;
    _circTraces.forEach(tr => {
        const fi = tr.a.x / canvas.width;
        const r = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b = a1[2] + (a2[2] - a1[2]) * fi | 0;
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.1 + beat * 0.08})`;
        ctx.beginPath();
        ctx.moveTo(tr.a.x, tr.a.y);
        ctx.lineTo(tr.b.x, tr.b.y);
        ctx.stroke();
    });

    // dibuja los pulsos de corriente
    ctx.shadowBlur = 8 + beat * 18;
    _circPulses.forEach(p => {
        const { tr, pos, str } = p;
        const px = tr.a.x + (tr.b.x - tr.a.x) * Math.min(pos, 1);
        const py = tr.a.y + (tr.b.y - tr.a.y) * Math.min(pos, 1);
        const fi = px / canvas.width;
        const r = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b = a1[2] + (a2[2] - a1[2]) * fi | 0;
        ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
        ctx.fillStyle   = `rgba(${r},${g},${b},${Math.max(0, str * (1 - pos * 0.7))})`;
        ctx.beginPath();
        ctx.arc(px, py, 3 + str * 4, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    // nodos en las intersecciones
    const nodes = new Set();
    _circTraces.forEach(tr => { nodes.add(tr.a); nodes.add(tr.b); });
    nodes.forEach(n => {
        const fi = n.x / canvas.width;
        const r = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b = a1[2] + (a2[2] - a1[2]) * fi | 0;
        ctx.fillStyle = `rgba(${r},${g},${b},${0.18 + beat * 0.2})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

export function resetCircuits() { _circW = 0; }
export { drawCircuits };
