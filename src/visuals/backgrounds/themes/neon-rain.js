import { canvas, ctx } from '../context.js';

// tema 5: gotas de lluvia neón con paleta de colores vivos
const _NEON_PAL = [[0,200,255],[200,0,255],[0,255,130],[255,50,200],[255,180,0],[100,255,100]];
let _neonDrops = [], _neonBuiltW = 0;
// crea una gota de lluvia neón con color y parámetros aleatorios
function _mkNeonDrop() {
    const [r, g, b] = _NEON_PAL[Math.floor(Math.random() * _NEON_PAL.length)];
    return {
        x: Math.random() * canvas.width, y: Math.random() * -canvas.height,
        len: 60 + Math.random() * 110,   spd: 230 + Math.random() * 340,
        r, g, b,                          w: 1 + Math.random() * 1.5,
    };
}
// inicializa el array de gotas según el ancho del canvas
function _buildNeonDrops() {
    _neonBuiltW = canvas.width;
    _neonDrops  = Array.from({ length: 65 }, _mkNeonDrop);
}
// renderiza un frame de lluvia neón con estela degradada y cabeza brillante
function drawNeonRain(beat, dt) {
    if (canvas.width !== _neonBuiltW) _buildNeonDrops();
    const sm = 1 + beat * 3.5;
    _neonDrops.forEach(d => {
        d.y += d.spd * sm * dt;
        if (d.y > canvas.height + d.len) { Object.assign(d, _mkNeonDrop()); d.y = -d.len - 10; }
        const gr = ctx.createLinearGradient(d.x, d.y - d.len, d.x, d.y);
        gr.addColorStop(0,   `rgba(${d.r},${d.g},${d.b},0)`);
        gr.addColorStop(0.6, `rgba(${d.r},${d.g},${d.b},${0.04 + beat * 0.07})`);
        gr.addColorStop(1,   `rgba(${d.r},${d.g},${d.b},${0.13 + beat * 0.16})`);
        // estela: degradado de transparente a visible, sin shadowblur
        ctx.beginPath(); ctx.moveTo(d.x, d.y - d.len); ctx.lineTo(d.x, d.y);
        ctx.strokeStyle = gr; ctx.lineWidth = d.w; ctx.shadowBlur = 0;
        ctx.stroke();
        // cabeza: glow falso con círculo extra semitransparente
        const dr = d.w * 1.4 + beat * 2.5;
        if (beat > 0.2) {
            ctx.beginPath(); ctx.arc(d.x, d.y, dr * 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${d.r},${d.g},${d.b},${beat * 0.1})`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(d.x, d.y, dr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.6 + beat * 0.4})`; ctx.fill();
    });
}

export function resetNeonRain() { _neonDrops = []; _neonBuiltW = 0; }
export { drawNeonRain };
