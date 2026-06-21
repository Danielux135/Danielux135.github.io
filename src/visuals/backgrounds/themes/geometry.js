import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 2: polígonos geométricos flotantes
let _geoShapes = [], _geoBuiltW = 0;
// genera los polígonos con posición, velocidad y rotación aleatorias
function _buildGeoShapes() {
    _geoBuiltW = canvas.width;
    _geoShapes = Array.from({ length: 28 }, () => ({
        x:      Math.random() * canvas.width,
        y:      Math.random() * canvas.height,
        vx:     (Math.random() - 0.5) * 0.38,
        vy:     (Math.random() - 0.5) * 0.38,
        sides:  [3, 4, 5, 6][Math.floor(Math.random() * 4)],
        size:   18 + Math.random() * 52,
        rot:    Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 0.009,
        ci:     Math.random() < 0.5 ? 1 : 2,
        alpha:  0.06 + Math.random() * 0.09,
    }));
}
// dibuja un polígono regular de n lados centrado en (x, y)
function _drawPoly(x, y, sides, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const a = rot + (Math.PI * 2 / sides) * i;
        i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
          : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
}
// renderiza un frame de geometría flotante con rotación y tamaño reactivos al beat
function drawGeometry(beat, dt) {
    if (canvas.width !== _geoBuiltW) _buildGeoShapes();
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const bst = 1 + beat * 2.5;
    _geoShapes.forEach(s => {
        s.rot += s.rotSpd * (1 + beat * 3);
        s.x    = (s.x + s.vx * bst + canvas.width  * 2) % canvas.width;
        s.y    = (s.y + s.vy * bst + canvas.height * 2) % canvas.height;
        const [r, g, b] = s.ci === 1 ? a1 : a2;
        const al = s.alpha + beat * 0.13;
        const sz = s.size * (1 + beat * 0.35);
        _drawPoly(s.x, s.y, s.sides, sz, s.rot);
        ctx.strokeStyle = `rgba(${r},${g},${b},${al})`;
        ctx.lineWidth   = 1 + beat * 1.5;
        ctx.stroke();
        ctx.fillStyle   = `rgba(${r},${g},${b},${al * 0.12})`;
        ctx.fill();
    });
}

export function resetGeometry() { _geoShapes = []; _geoBuiltW = 0; }
export { drawGeometry };
