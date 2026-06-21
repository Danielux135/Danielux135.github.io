/* ==========================================================================
   FONDO DEL ARCADE — motor de render compartido
   Se ejecuta en un Web Worker (OffscreenCanvas) para no competir con el hilo
   principal (notas, carrusel); o como fallback en el hilo principal si el
   navegador no soporta OffscreenCanvas. Misma lógica en ambos casos.

   makeArcadeBg(canvas, getState):
     - canvas: OffscreenCanvas (worker) o <canvas> normal (fallback).
     - getState(): devuelve { w, h, beat, a1r, a2r, gcols } cada frame.
         w,h        tamaño en px del overlay
         beat       energía visual 0..1
         a1r, a2r   colores de acento [r,g,b]
         gcols      colores del juego activo [[r,g,b],[r,g,b]]
   Devuelve { start(), stop() }.
   ========================================================================== */
export function makeArcadeBg(canvas, getState) {
    const ctx = canvas.getContext('2d');
    // buffers internos: OffscreenCanvas en worker/hilo principal moderno; canvas del DOM
    // como último recurso en el fallback de hilo principal sin OffscreenCanvas.
    const mkBuf = (w, h) => {
        const W = Math.max(1, w), H = Math.max(1, h);
        if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(W, H);
        const c = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
        if (c) { c.width = W; c.height = H; return c; }
        return new OffscreenCanvas(W, H);
    };

    const _nebulae = [
        { x: 0.20, y: 0.40, vx:  0.000030, vy:  0.000022, cr: 1 },
        { x: 0.75, y: 0.55, vx: -0.000025, vy:  0.000030, cr: 2 },
        { x: 0.50, y: 0.22, vx:  0.000018, vy: -0.000025, cr: 2 },
        { x: 0.12, y: 0.80, vx:  0.000038, vy: -0.000020, cr: 1 },
    ];
    const _ptcls = Array.from({ length: 120 }, () => ({
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00015,
        vy: (Math.random() - 0.5) * 0.00012,
        r:  Math.random() * 1.6 + 0.4,
        a:  Math.random() * 0.38 + 0.08,
        c:  Math.random() > 0.55 ? 1 : 2,
    }));

    let lastW = 0, lastH = 0, lastBgTs = 0, lastAmbientTs = 0;
    let staticBuf = null, ambientBuf = null, ambientCtx = null;
    let raf = null, running = false;

    // capa estática (scanlines + viñeta): no depende de beat ni tiempo
    function buildStatic(W, H) {
        staticBuf = mkBuf(W, H);
        const sx = staticBuf.getContext('2d');
        sx.clearRect(0, 0, W, H);
        sx.globalAlpha = 0.04;
        sx.fillStyle = '#000';
        for (let y = 0; y < H; y += 3) sx.fillRect(0, y, W, 1);
        sx.globalAlpha = 1;
        const vg = sx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.12, W/2, H/2, Math.max(W,H)*0.72);
        vg.addColorStop(0, 'rgba(1,0,8,0)');
        vg.addColorStop(1, 'rgba(1,0,8,0.88)');
        sx.fillStyle = vg;
        sx.fillRect(0, 0, W, H);
    }

    function ensureSize(W, H) {
        if (W === lastW && H === lastH) return;
        lastW = W; lastH = H;
        canvas.width = W; canvas.height = H;
        buildStatic(W, H);
        ambientBuf = mkBuf(W, H);
        ambientCtx = ambientBuf.getContext('2d');
        lastAmbientTs = 0; // fuerza rerender ambiental
    }

    function frame(ts) {
        if (!running) return;
        raf = requestAnimationFrame(frame);
        // cap a ~80 fps: el fondo es ambiental, no necesita los 144 Hz de las notas
        if (ts - lastBgTs < 12) return;
        lastBgTs = ts;

        const st = getState();
        const W = st.w | 0, H = st.h | 0;
        if (!W || !H) return;
        ensureSize(W, H);

        const beat = st.beat || 0;
        const t = ts / 1000;
        const a1r = st.a1r, a2r = st.a2r, gcols = st.gcols;

        // Capa 1: base + nebulosas, cacheadas a ~20 fps (cambian lentísimo)
        const ax = ambientCtx;
        if (ax && ts - lastAmbientTs > 50) {
            lastAmbientTs = ts;
            ax.fillStyle = '#010008';
            ax.fillRect(0, 0, W, H);
            for (const nb of _nebulae) {
                nb.x += nb.vx * 4; nb.y += nb.vy * 4; // *4 compensa el menor framerate
                if (nb.x < -0.15 || nb.x > 1.15) nb.vx *= -1;
                if (nb.y < -0.15 || nb.y > 1.15) nb.vy *= -1;
                const cr = nb.cr === 1 ? a1r : a2r;
                const rad = Math.min(W, H) * (0.42 + beat * 0.06);
                const cx = nb.x*W, cy = nb.y*H;
                const grd = ax.createRadialGradient(cx, cy, 0, cx, cy, rad);
                grd.addColorStop(0, `rgba(${cr[0]},${cr[1]},${cr[2]},${0.055 + beat * 0.04})`);
                grd.addColorStop(1, 'rgba(0,0,0,0)');
                ax.fillStyle = grd;
                ax.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
            }
        }
        ctx.drawImage(ambientBuf, 0, 0);

        // Capa 2: partículas flotantes
        for (const p of _ptcls) {
            p.x += p.vx * (1 + beat * 0.9);
            p.y += p.vy * (1 + beat * 0.5);
            if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
            if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
            const cr = p.c === 1 ? a1r : a2r;
            ctx.beginPath();
            ctx.arc(p.x * W, p.y * H, p.r * (1 + beat * 0.9), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${cr[0]},${cr[1]},${cr[2]},${p.a * (0.45 + beat * 0.55)})`;
            ctx.fill();
        }

        // Capa 3: brillo radial del juego activo
        const gc0 = gcols[0] || a1r;
        const ggR = Math.min(W,H)*(0.5+beat*0.1);
        const gg = ctx.createRadialGradient(W*0.5, H*0.5, 0, W*0.5, H*0.5, ggR);
        gg.addColorStop(0, `rgba(${gc0[0]},${gc0[1]},${gc0[2]},${0.1+beat*0.12})`);
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg;
        ctx.fillRect(W*0.5 - ggR, H*0.5 - ggR, ggR * 2, ggR * 2);

        // Capa 4+5A: círculo + espectro circular
        const arcCX = W * 0.5, arcCY = H * 0.52;
        const arcR  = Math.min(W, H) * (0.34 + beat * 0.05);
        const arcLW = 2;
        const mix = Math.min(1, beat * 1.3);
        const cMain  = [a1r[0] + (a2r[0]-a1r[0])*mix, a1r[1] + (a2r[1]-a1r[1])*mix, a1r[2] + (a2r[2]-a1r[2])*mix];
        const cInner = [a2r[0] + (a1r[0]-a2r[0])*mix, a2r[1] + (a1r[1]-a2r[1])*mix, a2r[2] + (a1r[2]-a2r[2])*mix];
        const gm = `${cMain[0]|0},${cMain[1]|0},${cMain[2]|0}`;

        ctx.save();
        for (let pass = 0; pass < 3; pass++) {
            const rOuter = arcR + pass * 8 + 4;
            const rInner = Math.max(0, arcR - pass * 6);
            const glowG = ctx.createRadialGradient(arcCX, arcCY, rInner, arcCX, arcCY, rOuter);
            const alpha = (0.12 + beat * 0.15) * Math.pow(0.5, pass);
            glowG.addColorStop(0, `rgba(${gm},0)`);
            glowG.addColorStop(0.5, `rgba(${gm},${alpha})`);
            glowG.addColorStop(1, `rgba(${gm},0)`);
            ctx.fillStyle = glowG;
            ctx.fillRect(arcCX - rOuter, arcCY - rOuter, rOuter * 2, rOuter * 2);
        }

        const specBars = 80;
        const specStart = arcR + arcLW / 2;
        for (let i = 0; i < specBars; i++) {
            const ang  = (i / specBars) * Math.PI * 2 - Math.PI / 2;
            const ph   = t * 1.2 + i * (Math.PI * 2 / specBars) * 2.5;
            const bh   = arcR * (0.04 + 0.18 * Math.abs(Math.sin(ph)) * (0.15 + beat * 0.85));
            const x1   = arcCX + Math.cos(ang) * specStart;
            const y1   = arcCY + Math.sin(ang) * specStart;
            const x2   = arcCX + Math.cos(ang) * (specStart + bh);
            const y2   = arcCY + Math.sin(ang) * (specStart + bh);
            const frac = i / specBars;
            const cr   = frac < 0.5
                ? [a1r[0] + (a2r[0]-a1r[0])*frac*2, a1r[1] + (a2r[1]-a1r[1])*frac*2, a1r[2] + (a2r[2]-a1r[2])*frac*2]
                : [a2r[0] + (a1r[0]-a2r[0])*(frac-0.5)*2, a2r[1] + (a1r[1]-a2r[1])*(frac-0.5)*2, a2r[2] + (a1r[2]-a2r[2])*(frac-0.5)*2];
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(${cr[0]|0},${cr[1]|0},${cr[2]|0},${0.18 + beat * 0.32})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(arcCX, arcCY, arcR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${cMain[0]|0},${cMain[1]|0},${cMain[2]|0},${0.22 + beat * 0.25})`;
        ctx.lineWidth = arcLW;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(arcCX, arcCY, arcR * 0.88, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${cInner[0]|0},${cInner[1]|0},${cInner[2]|0},${0.10 + beat * 0.12})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Capa 5B: flow lines
        ctx.save();
        for (let li = 0; li < 6; li++) {
            const yBase = H * (0.22 + li * 0.12);
            const amp   = (12 + li * 6) * (1 + beat * 1.2);
            const freq  = 0.008 + li * 0.002;
            const phase = t * (0.4 + li * 0.15) + li * 1.1;
            const cr    = li % 2 === 0 ? a1r : a2r;
            const alpha = (0.04 + beat * 0.07) * (1 - li * 0.1);
            ctx.beginPath();
            for (let x = 0; x <= W; x += 8) {
                const y = yBase + Math.sin(x * freq + phase) * amp
                                + Math.sin(x * freq * 0.5 + phase * 1.3) * amp * 0.4;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(${cr[0]},${cr[1]},${cr[2]},${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();

        // scanlines + viñeta cacheadas
        if (staticBuf) ctx.drawImage(staticBuf, 0, 0);
    }

    return {
        start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } },
        stop()  { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
    };
}

