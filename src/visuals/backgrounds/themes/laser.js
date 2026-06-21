import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';
import { hslToRgb } from '../../color-utils.js';

// tema 7: rayos láser que barren desde los bordes con glow y pulseo reactivo al beat
let _laserEmitters = [], _laserBuiltW = 0, _laserHue = 0;
// construye los focos en esquinas y bordes; cada uno oscila alrededor de un ángulo central
// que siempre apunta al interior del canvas, así nunca se salen de pantalla
function _buildLasers() {
    _laserBuiltW = canvas.width;
    const W = canvas.width, H = canvas.height;
    // center: ángulo base hacia el interior; swing: amplitud de oscilación; phase: desfase
    // acc: fase de barrido acumulada (se integra con dt, no se deriva de t * beat)
    _laserEmitters = [
        { x: 0,     y: 0,     center: Math.PI * 0.25, swing: 0.55, phase: 0.0,  speed: 0.30, hueOff:   0, acc: 0 },
        { x: W,     y: 0,     center: Math.PI * 0.75, swing: 0.55, phase: 1.3,  speed: 0.24, hueOff:  80, acc: 0 },
        { x: W,     y: H,     center: Math.PI * 1.25, swing: 0.55, phase: 2.6,  speed: 0.28, hueOff: 160, acc: 0 },
        { x: 0,     y: H,     center: Math.PI * 1.75, swing: 0.55, phase: 3.9,  speed: 0.22, hueOff: 240, acc: 0 },
        { x: W / 2, y: 0,     center: Math.PI * 0.50, swing: 0.70, phase: 5.1,  speed: 0.35, hueOff: 310, acc: 0 },
    ];
}
// calcula el punto donde el rayo desde (ex,ey) en dirección angle toca el borde del canvas
function _laserEndpoint(ex, ey, angle, W, H) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    let tMin = Infinity;
    if (dx > 0) tMin = Math.min(tMin, (W - ex) / dx);
    else if (dx < 0) tMin = Math.min(tMin, -ex / dx);
    if (dy > 0) tMin = Math.min(tMin, (H - ey) / dy);
    else if (dy < 0) tMin = Math.min(tMin, -ey / dy);
    return { x: ex + dx * tMin, y: ey + dy * tMin };
}
// dibuja un único rayo láser suave: halo tenue + línea fina + sin destello de origen
function _drawBeam(ex, ey, angle, r, g, b, beat, W, H) {
    const end = _laserEndpoint(ex, ey, angle, W, H);
    // el movimiento es constante; el beat solo enciende el neón: cuanto más fuerte el hit, más glow
    const glow = Math.min(beat * 1.3, 1);      // 0 en silencio, saturado en los hits fuertes
    // halo exterior de neón que se intensifica con los hits
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.10 + glow * 0.35})`;
    ctx.lineWidth = 5 + glow * 9;
    ctx.shadowColor = `rgba(${r},${g},${b},${0.5 + glow * 0.5})`;
    ctx.shadowBlur = 8 + glow * 26;
    ctx.stroke();
    // núcleo blanco caliente que se enciende con la fuerza del hit
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = `rgba(255,255,255,${0.35 + glow * 0.55})`;
    ctx.lineWidth = 1.5 + glow * 2;
    ctx.shadowColor = `rgba(255,255,255,${0.4 + glow * 0.5})`;
    ctx.shadowBlur = 4 + glow * 16;
    ctx.stroke();
    ctx.shadowBlur = 0;
}
// renderiza el frame completo del tema láser
function drawLaser(beat, dt, t) {
    if (canvas.width !== _laserBuiltW) _buildLasers();
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1);

    // cuadrícula tenue tipo Tron en el fondo
    const gridAlpha = 0.025 + beat * 0.02;
    ctx.strokeStyle = `rgba(${a1[0]},${a1[1]},${a1[2]},${gridAlpha})`;
    ctx.lineWidth = 1; ctx.shadowBlur = 0;
    const step = 80;
    for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // el barrido va a velocidad constante; la música no altera ni la velocidad ni el ángulo,
    // solo el neón de los rayos. la fase se integra con dt para un movimiento estable
    _laserHue = (_laserHue + dt * 18) % 360;
    _laserEmitters.forEach(e => {
        e.acc += dt * e.speed;
        const angle = e.center + Math.sin(e.acc + e.phase) * e.swing;
        const hue = (_laserHue + e.hueOff) % 360;
        const [r, g, b] = hslToRgb(hue, 95, 60);
        _drawBeam(e.x, e.y, angle, r, g, b, beat, W, H);
    });

    // destello radial central que pulsa con el beat
    if (beat > 0.05) {
        const cx = W / 2, cy = H / 2;
        const fr = Math.min(W, H) * (0.1 + beat * 0.5);
        const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, fr);
        flash.addColorStop(0, `rgba(${a1[0]},${a1[1]},${a1[2]},${beat * 0.35})`);
        flash.addColorStop(1, `rgba(${a1[0]},${a1[1]},${a1[2]},0)`);
        ctx.fillStyle = flash;
        ctx.fillRect(0, 0, W, H);
    }
    ctx.shadowBlur = 0;
}

export function resetLaser() { _laserEmitters = []; _laserBuiltW = 0; }
export { drawLaser };
