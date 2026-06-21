import { canvas, ctx, getHeroAccent as _heroAccent } from '../context.js';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// El sistema completo solo oscila unos pocos grados. Nunca realiza una vuelta
// completa ni puede alcanzar una orientación vertical.
const SYSTEM_SWAY = 2.7 * DEG;
const SYSTEM_SWAY_SPEED = 0.055;
const SYSTEM_DRIFT_X = 0.016;
const SYSTEM_DRIFT_Y = 0.010;

// Cada trayectoria representa una órbita elíptica vista en perspectiva:
// - projection controla cuánto se aplana visualmente.
// - eccentricity desplaza el sol hacia uno de los focos.
// - tilt añade una inclinación propia, siempre pequeña y horizontal.
// - tiltWobble aporta movimiento sin convertir la órbita en una rueda giratoria.
const ORBIT_RINGS = [
    {
        rfrac: 0.13,
        planets: 1,
        speed: 0.60,
        size: 4.2,
        phase: 0.0,
        projection: 0.47,
        eccentricity: 0.030,
        tilt: -3.6 * DEG,
        tiltWobble: 0.45 * DEG,
        wobbleSpeed: 0.072,
        wobblePhase: 0.2,
    },
    {
        rfrac: 0.21,
        planets: 1,
        speed: 0.44,
        size: 3.8,
        phase: 1.4,
        projection: 0.44,
        eccentricity: 0.055,
        tilt: 2.4 * DEG,
        tiltWobble: 0.55 * DEG,
        wobbleSpeed: 0.060,
        wobblePhase: 1.1,
    },
    {
        rfrac: 0.30,
        planets: 2,
        speed: 0.33,
        size: 3.4,
        phase: 0.6,
        projection: 0.50,
        eccentricity: 0.025,
        tilt: -1.4 * DEG,
        tiltWobble: 0.40 * DEG,
        wobbleSpeed: 0.052,
        wobblePhase: 2.2,
    },
    {
        rfrac: 0.41,
        planets: 1,
        speed: 0.255,
        size: 3.1,
        phase: 2.7,
        projection: 0.45,
        eccentricity: 0.075,
        tilt: 3.5 * DEG,
        tiltWobble: 0.60 * DEG,
        wobbleSpeed: 0.046,
        wobblePhase: 3.0,
    },
    {
        rfrac: 0.54,
        planets: 2,
        speed: 0.195,
        size: 2.8,
        phase: 4.0,
        projection: 0.48,
        eccentricity: 0.045,
        tilt: -2.8 * DEG,
        tiltWobble: 0.50 * DEG,
        wobbleSpeed: 0.041,
        wobblePhase: 4.1,
    },
    {
        rfrac: 0.69,
        planets: 1,
        speed: 0.150,
        size: 2.5,
        phase: 5.1,
        projection: 0.43,
        eccentricity: 0.080,
        tilt: 1.5 * DEG,
        tiltWobble: 0.65 * DEG,
        wobbleSpeed: 0.036,
        wobblePhase: 5.0,
    },
    {
        rfrac: 0.86,
        planets: 3,
        speed: 0.115,
        size: 2.3,
        phase: 0.9,
        projection: 0.49,
        eccentricity: 0.060,
        tilt: -0.7 * DEG,
        tiltWobble: 0.45 * DEG,
        wobbleSpeed: 0.032,
        wobblePhase: 5.8,
    },
    {
        rfrac: 1.05,
        planets: 2,
        speed: 0.090,
        size: 2.1,
        phase: 3.4,
        projection: 0.46,
        eccentricity: 0.085,
        tilt: 3.0 * DEG,
        tiltWobble: 0.55 * DEG,
        wobbleSpeed: 0.028,
        wobblePhase: 0.7,
    },
];

const runtimePhases = ORBIT_RINGS.map(ring => ring.phase);

function lerp(a, b, amount) {
    return a + (b - a) * amount;
}

function normalizeAngle(angle) {
    angle %= TAU;
    return angle < 0 ? angle + TAU : angle;
}

// Resuelve la anomalía excéntrica para que el movimiento sea ligeramente más
// rápido cerca del perihelio y más lento en el afelio, como una órbita real.
function solveEccentricAnomaly(meanAnomaly, eccentricity) {
    const mean = normalizeAngle(meanAnomaly);
    let eccentric = mean;

    for (let i = 0; i < 4; i++) {
        eccentric -= (
            eccentric - eccentricity * Math.sin(eccentric) - mean
        ) / (
            1 - eccentricity * Math.cos(eccentric)
        );
    }

    return eccentric;
}

function getRingTilt(ring, systemTilt, time) {
    return systemTilt
        + ring.tilt
        + Math.sin(time * ring.wobbleSpeed + ring.wobblePhase) * ring.tiltWobble;
}

// Punto de la elipse tomando el sol como foco, no como centro geométrico.
// La proyección vertical simula la inclinación del plano orbital hacia la cámara.
function orbitPoint(cx, cy, semiMajor, ring, tilt, eccentricAnomaly, scale = 1) {
    const eccentricity = ring.eccentricity;
    const semiMinor = semiMajor * Math.sqrt(1 - eccentricity * eccentricity);

    const localX = semiMajor * (Math.cos(eccentricAnomaly) - eccentricity) * scale;
    const localY = semiMinor * Math.sin(eccentricAnomaly) * ring.projection * scale;

    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);

    return {
        x: cx + localX * cosTilt - localY * sinTilt,
        y: cy + localX * sinTilt + localY * cosTilt,
    };
}

function drawSun(cx, cy, beat, accent) {
    const glowRadius = 24 + beat * 34;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);

    glow.addColorStop(0, `rgba(${accent[0]},${accent[1]},${accent[2]},${0.58 + beat * 0.40})`);
    glow.addColorStop(0.34, `rgba(${accent[0]},${accent[1]},${accent[2]},${0.24 + beat * 0.24})`);
    glow.addColorStop(1, `rgba(${accent[0]},${accent[1]},${accent[2]},0)`);

    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, TAU);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 2.2 + beat * 1.6, 0, TAU);
    ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${0.88 + beat * 0.12})`;
    ctx.fill();
}

function drawOrbitPath(cx, cy, semiMajor, ring, tilt, scale, color, beat) {
    const samples = 112;

    ctx.beginPath();

    for (let i = 0; i <= samples; i++) {
        const eccentricAnomaly = (i / samples) * TAU;
        const point = orbitPoint(cx, cy, semiMajor, ring, tilt, eccentricAnomaly, scale);

        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    }

    ctx.closePath();
    ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${0.13 + beat * 0.15})`;
    ctx.lineWidth = 1 + beat * 1.1;
    ctx.stroke();
}

function drawPlanet(cx, cy, semiMajor, ring, tilt, meanAnomaly, scale, color, beat) {
    const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, ring.eccentricity);
    const point = orbitPoint(cx, cy, semiMajor, ring, tilt, eccentricAnomaly, scale);

    // La mitad inferior del plano orbital se percibe ligeramente más cercana.
    const depth = 0.88 + ((Math.sin(eccentricAnomaly) + 1) * 0.5) * 0.22;
    const radius = ring.size * depth * (1 + beat * 0.58);

    if (beat > 0.18) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius * 3.5, 0, TAU);
        ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${beat * 0.12})`;
        ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, TAU);
    ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${0.66 + beat * 0.34})`;
    ctx.fill();
}

function drawOrbital(beat, dt, time) {
    const minDimension = Math.min(canvas.width, canvas.height);
    const base = minDimension * 0.78;

    // Movimiento del conjunto: deriva lenta y balanceo horizontal limitado.
    const cx = canvas.width * 0.5
        + Math.sin(time * 0.061) * minDimension * SYSTEM_DRIFT_X;
    const cy = canvas.height * 0.5
        + Math.cos(time * 0.049 + 0.8) * minDimension * SYSTEM_DRIFT_Y;
    const systemTilt = Math.sin(time * SYSTEM_SWAY_SPEED) * SYSTEM_SWAY;

    const accent1 = _heroAccent(1);
    const accent2 = _heroAccent(2);
    const pulseScale = 1 + beat * 0.075;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawSun(cx, cy, beat, accent1);

    ORBIT_RINGS.forEach((ring, ringIndex) => {
        runtimePhases[ringIndex] = normalizeAngle(
            runtimePhases[ringIndex] + ring.speed * dt * (1 + beat * 1.45)
        );

        const semiMajor = ring.rfrac * base;
        const tilt = getRingTilt(ring, systemTilt, time);
        const colorMix = ringIndex / (ORBIT_RINGS.length - 1);
        const color = [
            Math.round(lerp(accent1[0], accent2[0], colorMix)),
            Math.round(lerp(accent1[1], accent2[1], colorMix)),
            Math.round(lerp(accent1[2], accent2[2], colorMix)),
        ];

        drawOrbitPath(cx, cy, semiMajor, ring, tilt, pulseScale, color, beat);

        for (let planetIndex = 0; planetIndex < ring.planets; planetIndex++) {
            const meanAnomaly = runtimePhases[ringIndex]
                + (TAU / ring.planets) * planetIndex;

            drawPlanet(
                cx,
                cy,
                semiMajor,
                ring,
                tilt,
                meanAnomaly,
                pulseScale,
                color,
                beat,
            );
        }
    });

    ctx.restore();
}

export { drawOrbital };
