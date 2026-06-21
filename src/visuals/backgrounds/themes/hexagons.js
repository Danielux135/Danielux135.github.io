import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 16: hexágonos — malla hexagonal con ripples reactivos al beat (igual que la promo del arcade)
let _hexes = [], _hexRipples = [], _hexW = 0, _hexPrevBeat = 0, _hexLastRipT = 0;
const _HEX_S = 38;
function _buildHexGrid() {
    _hexW = canvas.width;
    _hexes = [];
    const cw = _HEX_S * Math.sqrt(3), rh = _HEX_S * 1.5;
    const cols = Math.ceil(canvas.width / cw) + 2, rows = Math.ceil(canvas.height / rh) + 2;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
            const x = col * cw + (row % 2 !== 0 ? cw / 2 : 0);
            const y = row * rh;
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            _hexes.push({ x, y, dist, phase: Math.random() * Math.PI * 2 });
        }
    }
}
function _hexPath(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i - Math.PI / 6;
        i === 0 ? ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
                : ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath();
}
function drawHexagons(beat, dt, t) {
    if (canvas.width !== _hexW) _buildHexGrid();
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const inner = _HEX_S - 2;

    if (beat > 0.22 && _hexPrevBeat < beat && t - _hexLastRipT > 0.18) {
        _hexRipples.push({ r: 0, speed: 260 + beat * 140, str: 0.4 + beat * 0.6 });
        _hexLastRipT = t;
    }
    _hexPrevBeat = beat;
    const maxR = Math.sqrt(W * W + H * H) * 0.6;
    for (let i = _hexRipples.length - 1; i >= 0; i--) {
        _hexRipples[i].r += _hexRipples[i].speed * dt;
        if (_hexRipples[i].r > maxR) _hexRipples.splice(i, 1);
    }

    _hexes.forEach(h => {
        let glow = (Math.sin(t * 0.6 + h.phase) * 0.5 + 0.5) * 0.035 + beat * 0.06;
        for (let i = 0; i < _hexRipples.length; i++) {
            const delta = Math.abs(h.dist - _hexRipples[i].r);
            const width = 55 + _hexRipples[i].r * 0.15;
            if (delta < width) glow += (1 - delta / width) * _hexRipples[i].str * 0.75;
        }
        glow = Math.min(glow, 1);
        if (glow < 0.012) return;

        const frac = Math.min(h.dist / (Math.min(W, H) * 0.55), 1);
        const cr = a1[0] + (a2[0] - a1[0]) * frac | 0;
        const cg = a1[1] + (a2[1] - a1[1]) * frac | 0;
        const cb = a1[2] + (a2[2] - a1[2]) * frac | 0;

        _hexPath(h.x, h.y, inner);
        const tg = ctx.createRadialGradient(h.x - inner * 0.25, h.y - inner * 0.25, 0, h.x, h.y, inner);
        tg.addColorStop(0,    `rgba(${cr},${cg},${cb},${glow * 0.55})`);
        tg.addColorStop(0.65, `rgba(${cr},${cg},${cb},${glow * 0.18})`);
        tg.addColorStop(1,    `rgba(${cr},${cg},${cb},0.02)`);
        ctx.fillStyle = tg; ctx.fill();

        _hexPath(h.x, h.y, inner);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${Math.min(glow * 1.1, 0.9)})`;
        ctx.lineWidth   = 0.7 + glow * 1.4;
        ctx.stroke();

        if (glow > 0.18) {
            _hexPath(h.x, h.y, inner * 0.78);
            const sg = ctx.createLinearGradient(h.x - inner, h.y - inner, h.x + inner * 0.4, h.y + inner * 0.4);
            sg.addColorStop(0, `rgba(255,255,255,${glow * 0.22})`);
            sg.addColorStop(1, `rgba(255,255,255,0)`);
            ctx.fillStyle = sg; ctx.fill();
        }
    });
}

// tema 17 se mantiene como plasma — se reemplaza aquí el bloque de crystals
// tema 16 arriba, tema 17 (plasma) debajo sin cambios

export function resetHexagons() { _hexes = []; _hexW = 0; }
export { drawHexagons };
