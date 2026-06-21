import { openArcade } from './loader.js';
import { visualState } from '../visuals/hero-studio.js';

function promoAccentRgb(which) {
    const value = which === 2 ? window._accent2Rgb : window._accent1Rgb;
    if (value) return value;
    const css = document.documentElement.style.getPropertyValue(which === 2 ? '--accent-2-rgb' : '--accent-1-rgb').trim();
    return css || (which === 2 ? '139 92 246' : '0 200 255');
}

/* ==========================================================================
   ARCADE PROMO — malla hexagonal reactiva (superficie de agua + beat ripples)
   ========================================================================== */
export function initArcadePromo() {
    const promo = document.getElementById('arcadePromo');
    const btn   = document.getElementById('arcadePromoBtn');
    const cv    = document.getElementById('arcadePromoCanvas');
    if (!promo || !btn || !cv) return;

    const launchArcade = (e) => { e.stopPropagation(); openArcade(e); };
    btn.addEventListener('click', launchArcade);
    promo.addEventListener('click', (e) => {
        if (e.target === btn || btn.contains(e.target)) return;
        launchArcade(e);
    });

    const gc = cv.getContext('2d');
    let raf = null;
    const S = 36; // hex radius
    let hexes = [], W = 0, H = 0;

    function buildGrid(w, h) {
        hexes = [];
        const cw = S * Math.sqrt(3), rh = S * 1.5;
        const cols = Math.ceil(w / cw) + 2, rows = Math.ceil(h / rh) + 2;
        const cx = w / 2, cy = h / 2;
        for (let row = -1; row < rows; row++) {
            for (let col = -1; col < cols; col++) {
                const x = col * cw + (row % 2 !== 0 ? cw / 2 : 0);
                const y = row * rh;
                const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                hexes.push({ x, y, dist, phase: Math.random() * Math.PI * 2, glow: 0 });
            }
        }
    }

    // Ripple pool — spawned on beat
    const ripples = [];
    let prevBeat = 0, lastRipT = 0;

    function hexPath(x, y, r) {
        gc.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = Math.PI / 3 * i - Math.PI / 6;
            i === 0 ? gc.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
                    : gc.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
        }
        gc.closePath();
    }

    function frame(ts) {
        raf = requestAnimationFrame(frame);
        // Con el arcade abierto la promo queda oculta (visibility:hidden) pero su
        // offsetWidth NO es 0, así que sin esta guarda seguiría dibujando la malla
        // hexagonal reactiva al beat a pantalla completa, robando frames al arcade
        // (era la causa real del lag con música, no el fondo ni el audio).
        if (document.documentElement.classList.contains('arcade-lock')) return;
        const nW = promo.offsetWidth, nH = promo.offsetHeight;
        if (!nW || !nH) return;
        if (nW !== W || nH !== H) {
            W = nW; H = nH;
            cv.width = W; cv.height = H;
            buildGrid(W, H);
        }

        const t    = ts / 1000;
        const beat = typeof visualState.beat === 'number' ? visualState.beat : 0;

        // Parse accent strings to numeric arrays once per frame
        const pa1  = promoAccentRgb(1).split(/\s+/).map(Number);
        const pa2  = promoAccentRgb(2).split(/\s+/).map(Number);
        const rgba = (r, g, b, a) => `rgba(${r|0},${g|0},${b|0},${a})`;

        // Spawn ripple on beat hit
        if (beat > 0.22 && prevBeat < beat && t - lastRipT > 0.18) {
            ripples.push({ r: 0, speed: 260 + beat * 140, str: 0.4 + beat * 0.6 });
            lastRipT = t;
        }
        prevBeat = beat;

        // Advance & cull ripples
        const maxR = Math.sqrt(W * W + H * H) * 0.6;
        for (let i = ripples.length - 1; i >= 0; i--) {
            ripples[i].r += ripples[i].speed / 60;
            if (ripples[i].r > maxR) ripples.splice(i, 1);
        }

        gc.clearRect(0, 0, W, H);

        const inner = S - 1.8;

        hexes.forEach(h => {
            // Ambient idle shimmer + beat ambient
            let glow = (Math.sin(t * 0.6 + h.phase) * 0.5 + 0.5) * 0.035 + beat * 0.06;

            // Ripple contribution
            for (let i = 0; i < ripples.length; i++) {
                const delta = Math.abs(h.dist - ripples[i].r);
                const width = 55 + ripples[i].r * 0.15;
                if (delta < width) glow += (1 - delta / width) * ripples[i].str * 0.75;
            }

            glow = Math.min(glow, 1);
            if (glow < 0.012) return;

            // Color: cyan near centre → purple at edges
            const frac = Math.min(h.dist / (Math.min(W, H) * 0.55), 1);
            const cr = pa1[0] + (pa2[0] - pa1[0]) * frac;
            const cg = pa1[1] + (pa2[1] - pa1[1]) * frac;
            const cb = pa1[2] + (pa2[2] - pa1[2]) * frac;

            // ── Hex fill: depth gradient (water tile) ─────────────────────
            hexPath(h.x, h.y, inner);
            const tg = gc.createRadialGradient(h.x - inner * 0.25, h.y - inner * 0.25, 0, h.x, h.y, inner);
            tg.addColorStop(0,    rgba(cr, cg, cb, glow * 0.55));
            tg.addColorStop(0.65, rgba(cr, cg, cb, glow * 0.18));
            tg.addColorStop(1,    rgba(cr, cg, cb, 0.02));
            gc.fillStyle = tg;
            gc.fill();

            // ── Hex border glow ───────────────────────────────────────────
            hexPath(h.x, h.y, inner);
            gc.strokeStyle = rgba(cr, cg, cb, Math.min(glow * 1.1, 0.9));
            gc.lineWidth   = 0.7 + glow * 1.4;
            gc.stroke();

            // ── Specular shimmer on bright tiles ──────────────────────────
            if (glow > 0.18) {
                hexPath(h.x, h.y, inner * 0.78);
                const sg = gc.createLinearGradient(h.x - inner, h.y - inner, h.x + inner * 0.4, h.y + inner * 0.4);
                sg.addColorStop(0, `rgba(255,255,255,${glow * 0.22})`);
                sg.addColorStop(1, `rgba(255,255,255,0)`);
                gc.fillStyle = sg;
                gc.fill();
            }
        });
    }

    const obs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            if (!raf) raf = requestAnimationFrame(frame);
        } else {
            if (raf) { cancelAnimationFrame(raf); raf = null; }
        }
    }, { threshold: 0.05 });
    obs.observe(promo);
}

initArcadePromo();
