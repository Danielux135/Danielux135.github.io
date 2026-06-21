import { canvas, ctx } from '../context.js';
import { hslToRgb } from '../../color-utils.js';

// tema 11: meteoros que caen en diagonal con estela degradada
let _meteors = [], _metW = 0;
// crea un meteoro con ángulo y velocidad aleatorios; seeded lo coloca ya en pantalla
function _mkMeteor(seeded) {
    const angle = Math.PI * 0.32 + (Math.random() - 0.5) * 0.35;
    const spd   = 280 + Math.random() * 320;
    const m = {
        x:    Math.random() * canvas.width * 1.4 - canvas.width * 0.2,
        y:    -30 - Math.random() * canvas.height * 0.6,
        vx:   Math.cos(angle) * spd,
        vy:   Math.sin(angle) * spd,
        len:  55 + Math.random() * 130,
        w:    0.8 + Math.random() * 2,
        hue:  Math.random() * 360,
        al:   0.45 + Math.random() * 0.55,
    };
    if (seeded) m.y = Math.random() * canvas.height;
    return m;
}
// inicializa los meteoros; los primeros 9 aparecen ya dentro del canvas
function _buildMeteors() {
    _metW    = canvas.width;
    _meteors = Array.from({ length: 16 }, (_, i) => _mkMeteor(i < 9));
}
// renderiza un frame de meteoros; el beat lanza meteoros extra
function drawMeteors(beat, dt) {
    if (canvas.width !== _metW) _buildMeteors();

    // lanza meteoros extra cuando hay beat fuerte
    if (beat > 0.45 && Math.random() < beat * 0.35) _meteors.push(_mkMeteor(false));
    if (_meteors.length > 45) _meteors.splice(0, _meteors.length - 45);

    const spd = 1 + beat * 2.8;

    for (let i = _meteors.length - 1; i >= 0; i--) {
        const m = _meteors[i];
        m.x += m.vx * spd * dt;
        m.y += m.vy * spd * dt;

        if (m.y > canvas.height + 60 || m.x > canvas.width + 120) {
            _meteors[i] = _mkMeteor(false);
            continue;
        }

        const [r, g, b] = hslToRgb((m.hue + beat * 70) % 360, 88, 62);
        const mag  = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        const nx   = m.vx / mag, ny = m.vy / mag;
        const tail = m.len * (0.7 + beat * 0.6);
        const tx   = m.x - nx * tail, ty = m.y - ny * tail;

        const grad = ctx.createLinearGradient(tx, ty, m.x, m.y);
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.6, `rgba(${r},${g},${b},${m.al * (0.25 + beat * 0.3)})`);
        grad.addColorStop(1,   `rgba(255,255,255,${m.al * (0.5 + beat * 0.4)})`);

        // estela: sin shadowblur para evitar demasiadas llamadas costosas
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = m.w + beat * 2.5;
        ctx.shadowBlur  = 0;
        ctx.stroke();

        // cabeza: glow falso más núcleo blanco
        const hr = m.w * 1.8 + beat * 3.5;
        ctx.beginPath();
        ctx.arc(m.x, m.y, hr * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${beat * 0.12})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(m.x, m.y, hr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.72 + beat * 0.28})`;
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

export function resetMeteors() { _meteors = []; _metW = 0; }
export { drawMeteors };
