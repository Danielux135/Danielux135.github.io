import { weather } from '../state/weather.js';
import { updateWeatherEyebrow } from '../features/site-ui.js';
import { translations, studioT as _studioT } from '../data/translations.js';
import { canvas, ctx } from './backgrounds/context.js';

function activeLang() {
    const lang = document.documentElement.lang;
    return lang === 'ca' ? 'val' : (lang || 'es');
}

function studioT(key, lang = activeLang()) {
    return _studioT(key, lang, translations);
}

function _wxMakeRain(W, H, n, type) {
    return Array.from({ length: n }, () => {
        if (type === 'drizzle') return {
            x:   Math.random() * W,
            y:   Math.random() * H,
            vy:  130 + Math.random() * 90,
            vx:  -10 + Math.random() * 18,
            len: 5   + Math.random() * 7,
            a:   0.18 + Math.random() * 0.18,
            type,
        };
        if (type === 'storm') return {
            x:   Math.random() * W,
            y:   Math.random() * H,
            vy:  550 + Math.random() * 300,
            vx:  -80 + Math.random() * 30,    // muy inclinada
            len: 22  + Math.random() * 20,
            a:   0.35 + Math.random() * 0.35,
            type,
        };
        if (type === 'heavyRain') return {
            x:   Math.random() * W,
            y:   Math.random() * H,
            vy:  460 + Math.random() * 260,
            vx:  -58 + Math.random() * 20,
            len: 22  + Math.random() * 18,
            a:   0.32 + Math.random() * 0.34,
            splash: Math.random() < 0.18,
            type,
        };
        return {  // 'rain'
            x:   Math.random() * W,
            y:   Math.random() * H,
            vy:  260 + Math.random() * 150,
            vx:  -26 + Math.random() * 16,
            len: 10  + Math.random() * 10,
            a:   0.18 + Math.random() * 0.2,
            type: 'rain',
        };
    });
}

// partículas de nieve
function _wxMakeSnow(W, H, n, type = 'snow') {
    const isHail = type === 'hail';
    return Array.from({ length: n }, () => ({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vy: isHail ? 95 + Math.random() * 90 : 24 + Math.random() * 36,
        vx: isHail ? -18 + Math.random() * 36 : -12 + Math.random() * 24,
        r:  isHail ? 2.5 + Math.random() * 2.7 : 3.5 + Math.random() * 5.5,
        a:  isHail ? 0.48 + Math.random() * 0.32 : 0.42 + Math.random() * 0.38,
        type,
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * (isHail ? 0.6 : 1.2),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpd: isHail ? 0.3 + Math.random() * 0.4 : 0.55 + Math.random() * 1.0,
    }));
}

function _wxDrawSnowflake(ctx, p) {
    const arms = 6;
    const r = p.r;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.strokeStyle = `rgba(225,240,255,${p.a})`;
    ctx.lineWidth = Math.max(0.7, r * 0.16);
    ctx.lineCap = 'round';
    for (let i = 0; i < arms; i++) {
        const a = (Math.PI * 2 * i) / arms;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
        ctx.stroke();
        const bx = Math.cos(a) * r * 0.58;
        const by = Math.sin(a) * r * 0.58;
        const side = r * 0.28;
        for (const s of [-1, 1]) {
            const ba = a + s * Math.PI * 0.72;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(ba) * side, by + Math.sin(ba) * side);
            ctx.stroke();
        }
    }
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.8, r * 0.16), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240,248,255,${Math.min(0.9, p.a + 0.12)})`;
    ctx.fill();
    ctx.restore();
}
// genera los "bumps" (protuberancias) que forman la silueta superior de una nube
function _wxCloudBumps(scale) {
    // array de {cx, cy, r} relativo al origen de la nube, escala 1 = 100px de ancho base
    return [
        { cx: 0,    cy: 0,     r: 28 * scale },   // centro-izquierda
        { cx: 28,   cy: -18,   r: 34 * scale },   // cima principal
        { cx: 60,   cy: -10,   r: 28 * scale },   // cima secundaria
        { cx: 85,   cy: -4,    r: 22 * scale },   // hombro derecho
        { cx: -22,  cy: 6,     r: 20 * scale },   // hombro izquierdo
        { cx: 44,   cy: 4,     r: 18 * scale },   // relleno central
    ];
}

// nubes con forma real: silueta definida por arcos superpuestos
function _wxMakeClouds(W, n, profile = 'partial') {
    return Array.from({ length: n }, (_, i) => {
        const isOvercast = profile === 'overcast';
        const scale  = isOvercast
            ? 1.9 + Math.random() * 1.9
            : 0.9 + Math.random() * 1.15;
        const bumps  = _wxCloudBumps(scale);
        const maxX = Math.max(...bumps.map(b => b.cx + b.r));
        const minX = Math.min(...bumps.map(b => b.cx - b.r));
        return {
            x:    (i / n) * W * (isOvercast ? 1.25 : 1.75) - W * 0.18,
            y:    isOvercast
                ? 18 + Math.random() * (W > 600 ? 170 : 105)
                : 38 + Math.random() * (W > 600 ? 95 : 62),
            vx:   isOvercast ? 1.1 + Math.random() * 2.1 : 3.8 + Math.random() * 4.5,
            a:    isOvercast ? 0.74 + Math.random() * 0.18 : 0.34 + Math.random() * 0.2,
            profile,
            bumps,
            w:    maxX - minX,
        };
    });
}

function _wxMakeFog(W, H, n = 6) {
    return Array.from({ length: n }, (_, i) => ({
        y: H * (0.08 + i * (0.82 / Math.max(1, n - 1))) + Math.random() * 28 - 14,
        spd: 0.035 + Math.random() * 0.06,
        freqA: 0.0012 + Math.random() * 0.0016,
        freqB: 0.0024 + Math.random() * 0.0022,
        amp: 28 + Math.random() * 44,
        thick: 90 + Math.random() * 120,
        a: 0.025 + Math.random() * 0.028,
        phase: Math.random() * Math.PI * 2,
    }));
}
// inicializa partículas según el código WMO
export function buildWeather(code, W, H) {
    weather.particles = [];
    weather.clouds    = [];
    weather.fog       = [];
    if (code === null) return;
    // llovizna (51-57)
    if (code >= 51 && code <= 57) {
        weather.particles = _wxMakeRain(W, H, 90, 'drizzle');
    }
    // lluvia moderada/intensa (61-67, 80-82)
    else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
        const heavy = code >= 65 || code >= 80;
        weather.particles = _wxMakeRain(W, H, heavy ? 280 : 125, heavy ? 'heavyRain' : 'rain');
    }
    // tormenta (95-99)
    else if (code >= 95) {
        weather.particles = _wxMakeRain(W, H, 350, 'storm');
    }
    // nieve/aguanieve (71-77)
    else if (code >= 71 && code <= 77) {
        weather.particles = _wxMakeSnow(W, H, 120, 'snow');
    }
    // granizo (85-86)
    else if (code >= 85 && code <= 86) {
        weather.particles = _wxMakeSnow(W, H, 120, 'hail');
    }
    if (code === 45 || code === 48) {
        weather.fog = _wxMakeFog(W, H, W > 700 ? 7 : 5);
    } else if (code >= 1 && code <= 2) {
        weather.clouds = _wxMakeClouds(W, W > 700 ? 4 : 3, 'partial');
    } else if (code === 3) {
        weather.clouds = _wxMakeClouds(W, W > 700 ? 12 : 8, 'overcast');
    }
}

// mapea codigo WMO a texto legible en el idioma activo
export function describeWeather(code, lang = activeLang()) {
    if (code === 0)              return `${studioT('weather.clearDesc', lang)} ☀️`;
    if (code <= 3)               return `${studioT('weather.partialDesc', lang)} ⛅`;
    if (code === 45||code===48)  return `${studioT('weather.fog', lang)} 🌫️`;
    if (code <= 57)              return `${studioT('weather.drizzle', lang)} 🌦️`;
    if (code <= 67)              return `${studioT('weather.rain', lang)} 🌧️`;
    if (code <= 77)              return `${studioT('weather.snow', lang)} 🌨️`;
    if (code <= 82)              return `${studioT('weather.showersDesc', lang)} 🌦️`;
    if (code <= 86)              return `${studioT('weather.hail', lang)} 🌨️`;
    if (code <= 99)              return `${studioT('weather.storm', lang)} ⛈️`;
    return studioT('weather.unknown', lang);
}
// obtiene la ubicación por IP via free.freeipapi.com (sin permisos) y consulta Open-Meteo para el clima
function fetchWeather(onResult) {
    fetch('https://free.freeipapi.com/api/json')
        .then(r => r.json())
        .then(loc => {
            const lat = loc.latitude, lon = loc.longitude;
            if (!lat || !lon) { onResult(null, studioT('weatherNoLocation')); return; }
            return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code&timezone=auto`)
                .then(r => r.json())
                .then(data => {
                    const code = data?.current?.weather_code ?? null;
                    onResult(code, code !== null ? `${describeWeather(code)} · ${loc.cityName || ''}` : studioT('weatherNoData'));
                });
        })
        .catch(() => onResult(null, studioT('weatherError')));
}

// dibuja el efecto de clima encima del canvas del tema (se llama desde el loop de animación)
export function drawWeatherOverlay(beat, dt, t) {
if (!weather.enabled || weather.code === null) return;
    const W = canvas.width, H = canvas.height;
    ctx.save();

    // nubes con forma real
    const isLight      = document.documentElement.getAttribute('data-theme') === 'light';
    const isStormy     = weather.code >= 95;
    const isRainyCloud = (weather.code >= 51 && weather.code <= 82);
    // color base: en temas claros usamos gris medio; en oscuros blanco-azulado
    const [cR, cG, cB] = isLight
        ? (isStormy ? [80,85,95] : isRainyCloud ? [110,115,130] : [140,145,160])
        : (isStormy ? [150,155,170] : isRainyCloud ? [175,185,200] : [210,218,230]);

    if (weather.fog?.length) {
        const fogRgb = isLight ? '172,178,188' : '205,220,232';
        ctx.save();
        ctx.globalCompositeOperation = isLight ? 'source-over' : 'screen';
        for (let i = 0; i < weather.fog.length; i++) {
            const f = weather.fog[i];
            f.phase += f.spd * dt;
            const amp = f.amp * (1 + beat * 0.35);
            const yBase = f.y + Math.sin(t * 0.045 + f.phase) * 18;
            const alpha = f.a + Math.sin(t * 0.12 + i * 1.7) * 0.006;

            ctx.beginPath();
            ctx.moveTo(0, yBase + Math.sin(f.phase) * amp);
            for (let x = 0; x <= W; x += 8) {
                const y = yBase
                    + Math.sin(x * f.freqA + f.phase) * amp
                    + Math.sin(x * f.freqB - f.phase * 0.7) * amp * 0.34;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(W, yBase + f.thick + amp * 0.22);
            for (let x = W; x >= 0; x -= 8) {
                const y = yBase + f.thick
                    + Math.sin(x * f.freqA * 1.25 + f.phase + 1.8) * amp * 0.5
                    + Math.sin(x * f.freqB * 0.8 - f.phase) * amp * 0.22;
                ctx.lineTo(x, y);
            }
            ctx.closePath();

            const g = ctx.createLinearGradient(0, yBase - amp, 0, yBase + f.thick + amp);
            g.addColorStop(0, `rgba(${fogRgb},0)`);
            g.addColorStop(0.22, `rgba(${fogRgb},${Math.max(0, alpha)})`);
            g.addColorStop(0.58, `rgba(${fogRgb},${Math.max(0, alpha * 1.35)})`);
            g.addColorStop(1, `rgba(${fogRgb},0)`);
            ctx.fillStyle = g;
            ctx.fill();
        }
        ctx.restore();
    }

    for (const c of weather.clouds) {
        c.x += c.vx * dt;
        if (c.x > W + c.w) c.x = -c.w - 20;

        // paso 1: recortar la forma de la nube con clip para que el blur no se derrame
        ctx.save();

        // paso 2: dibujar cada bump como círculo — la superposición crea la silueta
        // primero la sombra inferior (base más oscura)
        for (const b of c.bumps) {
            ctx.beginPath();
            ctx.arc(c.x + b.cx, c.y + b.cy + b.r * 0.18, b.r * 0.95, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${cR - 30},${cG - 30},${cB - 20},${c.a * 0.18})`;
            ctx.fill();
        }
        // cuerpo principal de la nube
        for (const b of c.bumps) {
            ctx.beginPath();
            ctx.arc(c.x + b.cx, c.y + b.cy, b.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${cR},${cG},${cB},${c.a * 0.88})`;
            ctx.fill();
        }
        // iluminación superior (zona más clara en la cima de cada bump)
        for (const b of c.bumps) {
            const gx = c.x + b.cx, gy = c.y + b.cy;
            const g = ctx.createRadialGradient(gx, gy - b.r * 0.3, 0, gx, gy, b.r);
            g.addColorStop(0,   `rgba(255,255,255,${c.a * 0.45})`);
            g.addColorStop(0.5, `rgba(255,255,255,0)`);
            ctx.beginPath();
            ctx.arc(gx, gy, b.r, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        }

        ctx.restore();
    }

    // lluvia / llovizna / tormenta
    const rainTypes = new Set(['drizzle', 'rain', 'heavyRain', 'storm']);
    const hasRain = weather.particles.length > 0 && rainTypes.has(weather.particles[0].type);
    const isSnow  = weather.code >= 71 && weather.code <= 86;
    if (hasRain) {
        for (const p of weather.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt * (1 + beat * (p.type === 'storm' ? 0.6 : p.type === 'heavyRain' ? 0.42 : 0.3));
            if (p.y > H + p.len) { p.y = -p.len; p.x = Math.random() * W; }
            // color y grosor distintos por tipo
            if (p.type === 'drizzle') {
                ctx.strokeStyle = 'rgba(180,210,240,0.6)';
                ctx.lineWidth = 0.6;
            } else if (p.type === 'storm') {
                ctx.strokeStyle = 'rgba(140,185,230,0.75)';
                ctx.lineWidth = 1.8;
            } else if (p.type === 'heavyRain') {
                ctx.strokeStyle = 'rgba(150,200,255,0.78)';
                ctx.lineWidth = 1.55;
            } else {
                ctx.strokeStyle = 'rgba(160,200,255,0.65)';
                ctx.lineWidth = 1.2;
            }
            ctx.beginPath();
            ctx.globalAlpha = p.a;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 0.04, p.y + p.len);
            ctx.stroke();
            if (p.type === 'heavyRain' && p.splash && p.y > H * 0.72) {
                ctx.beginPath();
                ctx.globalAlpha = p.a * 0.45;
                ctx.strokeStyle = 'rgba(185,220,255,0.55)';
                ctx.lineWidth = 0.7;
                ctx.moveTo(p.x - 4, p.y + p.len * 0.55);
                ctx.lineTo(p.x - 10, p.y + p.len * 0.65);
                ctx.moveTo(p.x + 3, p.y + p.len * 0.55);
                ctx.lineTo(p.x + 9, p.y + p.len * 0.66);
                ctx.stroke();
            }
        }
    } else if (isSnow) {
        for (const p of weather.particles) {
            p.wobble += p.wobbleSpd * dt;
            p.rot += p.rotSpd * dt;
            p.x += Math.sin(p.wobble) * (p.type === 'snow' ? 24 : 8) * dt + p.vx * dt;
            p.y += p.vy * dt;
            if (p.y > H + p.r) { p.y = -p.r; p.x = Math.random() * W; }
            if (p.type === 'snow') {
                _wxDrawSnowflake(ctx, p);
            } else {
                ctx.beginPath();
                ctx.globalAlpha = p.a;
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(220,235,255,0.9)';
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    // flash de relámpago en tormentas
    if (weather.code >= 95 && Math.random() < 0.002 + beat * 0.005) {
        ctx.globalAlpha = 0.12 + Math.random() * 0.18;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
}

// activa/desactiva el clima y actualiza la UI del botón
export function toggleWeather(onDone) {
    const btn    = document.getElementById('studioWeatherBtn');
    const label  = document.getElementById('studioWeatherLabel');
    const status = document.getElementById('studioWeatherStatus');
    if (!btn) return;

    if (weather.enabled) {
        weather.enabled = false;
        weather.code = null; weather.label = '';
        weather.particles = []; weather.clouds = []; weather.fog = [];
        localStorage.setItem('wxEnabled', '0');
        btn.classList.remove('active');
        label.textContent  = studioT('weatherEnable');
        status.textContent = '';
        updateWeatherEyebrow();
        if (onDone) onDone();
    } else {
        btn.classList.add('active');
        label.textContent  = studioT('weatherLoading');
        status.textContent = '';
        fetchWeather((code, desc) => {
            weather.enabled = true;
            weather.code  = code;
            weather.label = desc;
            localStorage.setItem('wxEnabled', '1');
            updateWeatherEyebrow();
            buildWeather(code, canvas.width, canvas.height);
            label.textContent  = studioT('weatherDisable');
            status.textContent = desc;
            if (code === null) { weather.enabled = false; btn.classList.remove('active'); label.textContent = studioT('weatherEnable'); }
            if (onDone) onDone();
        });
    }
}

// mapea un código WMO real al código de preset más cercano para el grid
export function matchWeatherPreset(code) {
    if (code === null || code === undefined) return null;
    if (code === 0) return 0;
    if (code >= 1 && code <= 3) return 2;
    if (code === 45 || code === 48) return 45;
    if (code >= 51 && code <= 57) return 51;
    if (code >= 61 && code <= 67) return 61;
    if (code >= 71 && code <= 77) return 71;
    if (code >= 80 && code <= 82) return 61;
    if (code >= 85 && code <= 86) return 85;
    if (code >= 95) return 95;
    return null;
}

// presets de clima para el panel de personalización
export const WEATHER_PRESETS = [
    { emoji: '☀️',  key: 'clear',   code: 0  },
    { emoji: '⛅',  key: 'partial', code: 2  },
    { emoji: '☁️',  key: 'cloudy',  code: 3  },
    { emoji: '🌫️', key: 'fog',     code: 45 },
    { emoji: '🌦️', key: 'drizzle', code: 51 },
    { emoji: '🌧️', key: 'rain',    code: 61 },
    { emoji: '🌧️', key: 'heavy',   code: 65 },
    { emoji: '🌨️', key: 'snow',    code: 71 },
    { emoji: '🌨️', key: 'hail',    code: 85 },
    { emoji: '⛈️', key: 'storm',   code: 95 },
];

// restaura el clima si estaba activo en la sesión anterior (se llama desde initStudio)
export function restoreWeather() {
    if (!weather.enabled) return;
    // preset manual: restaura sin fetch
    const mode = localStorage.getItem('wxEnabled');
    if (mode === 'manual') {
        const savedCode = parseInt(localStorage.getItem('wxCode'));
        if (!isNaN(savedCode)) {
            weather.code = savedCode;
            buildWeather(savedCode, canvas.width, canvas.height);
            updateWeatherEyebrow();
            const btn2   = document.getElementById('studioWeatherBtn');
            const label  = document.getElementById('studioWeatherLabel');
            const status = document.getElementById('studioWeatherStatus');
            if (btn2)   btn2.classList.add('active');
            if (label)  label.textContent  = studioT('weatherDisable');
            if (status) status.textContent = describeWeather(savedCode);
            // actualiza los botones del grid de clima para resaltar el preset activo
            const wxGridM = document.getElementById('studioWeatherGrid');
            if (wxGridM) {
                wxGridM.querySelectorAll('.studio-wx-btn').forEach(b => {
                    const bCode = b.dataset.wxCode === '' ? null : parseInt(b.dataset.wxCode);
                    b.classList.toggle('active', bCode === savedCode);
                });
            }
        }
        return;
    }
    weather.enabled = false;
    const label  = document.getElementById('studioWeatherLabel');
    const status = document.getElementById('studioWeatherStatus');
    if (label) label.textContent = studioT('weatherLoading');
    fetchWeather((code, desc) => {
        const btn2 = document.getElementById('studioWeatherBtn');
        const wxGrid2 = document.getElementById('studioWeatherGrid');
        if (code !== null) {
            weather.enabled = true;
            weather.code = code; weather.label = desc;
            buildWeather(code, canvas.width, canvas.height);
            updateWeatherEyebrow();
            if (btn2)   btn2.classList.add('active');
            if (label)  label.textContent  = studioT('weatherDisable');
            if (status) status.textContent = desc;
        } else {
            localStorage.setItem('wxEnabled', '0');
            if (btn2)   btn2.classList.remove('active');
            if (label)  label.textContent  = studioT('weatherEnable');
            if (status) status.textContent = desc;
        }
        // actualiza los botones del grid de clima para resaltar el preset activo
        if (wxGrid2) {
            wxGrid2.querySelectorAll('.studio-wx-btn').forEach(b => {
                const bCode = b.dataset.wxCode === '' ? null : parseInt(b.dataset.wxCode);
                b.classList.toggle('active', bCode === matchWeatherPreset(weather.code) && (weather.enabled || bCode === null));
            });
        }
    });
}

