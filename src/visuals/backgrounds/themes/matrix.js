import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

// tema 1: lluvia de caracteres estilo matrix
const _MAT_SRC = 'アイウエオカキクケコサシスセソタナニヌハヒフマミムヤラリルロン0123456789ABCDEF<>/\\|{}[]';
const _MAT_CW  = 16; // ancho en px de cada columna de caracteres
let _matCols = [], _matBuiltW = 0;
// construye las columnas de la lluvia matrix según el ancho actual del canvas
function _buildMatCols() {
    _matBuiltW = canvas.width;
    _matCols = Array.from({ length: Math.ceil(canvas.width / _MAT_CW) + 1 }, (_, i) => ({
        x:      i * _MAT_CW,
        y:      Math.random() * -canvas.height * 1.5,
        speed:  80 + Math.random() * 110,
        len:    12 + Math.floor(Math.random() * 18),
        glyphs: Array.from({ length: 32 }, () => _MAT_SRC[Math.floor(Math.random() * _MAT_SRC.length)]),
        tick:   0,
    }));
}
// renderiza un frame de la lluvia matrix con velocidad reactiva al beat
function drawMatrix(beat, dt) {
    if (canvas.width !== _matBuiltW) _buildMatCols();
    const [r, g, b] = _heroAccent(1);
    ctx.font      = `${_MAT_CW}px monospace`;
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
    const spd = 1 + beat * 4;

    _matCols.forEach(col => {
        col.y += col.speed * spd * dt;
        if (++col.tick % 5 === 0)
            col.glyphs[Math.floor(Math.random() * col.glyphs.length)] =
                _MAT_SRC[Math.floor(Math.random() * _MAT_SRC.length)];
        if (col.y > canvas.height + col.len * _MAT_CW) {
            col.y     = -col.len * _MAT_CW - Math.random() * canvas.height * 0.5;
            col.speed = 80 + Math.random() * 110;
        }
        for (let i = 0; i < col.len; i++) {
            const cy = col.y - i * _MAT_CW;
            if (cy < -_MAT_CW || cy > canvas.height) continue;
            if (i === 0) {
                ctx.fillStyle = `rgba(255,255,255,${0.9 + beat * 0.1})`;
            } else {
                const frac = 1 - i / col.len;
                ctx.fillStyle = `rgba(${r},${g},${b},${frac * (0.08 + beat * 0.12)})`;
            }
            ctx.fillText(col.glyphs[i % col.glyphs.length], col.x + 1, cy);
        }
    });
}

export function resetMatrix() { _matCols = []; _matBuiltW = 0; }
export { drawMatrix };
