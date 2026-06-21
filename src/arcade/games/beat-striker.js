import * as Runtime from '../runtime.js';
import { selectBeatStrikerEvents } from '../beatmaps/event-selector.js';
const {
    Arcade,
    BEATMAP_CACHE,
    DIFFS,
    DIFF_LABEL,
    GAMES_I18N,
    LS_BEST,
    LS_OPTS,
    OPTS,
    T,
    TRACKS,
    _buildGlow,
    _glow,
    accentRgb,
    analyzeBuffer,
    anchorGrid,
    audio,
    audioOutputLatency,
    beatNow,
    bestKeyFor,
    bestOfGame,
    bests,
    blip,
    blipCtx,
    buildBeatmap,
    chooseHeroHit,
    clamp,
    diffOf,
    eventsFor,
    eventsForHero,
    fftRadix2,
    fmtN,
    getTranslation,
    glow,
    glowAt,
    glowBegin,
    glowEnd,
    haptic,
    heroBeatAnchors,
    heroBreakbeatRows,
    heroDrivingGrooveRows,
    heroSubdivisionAnchors,
    hydrateMap,
    idbGet,
    idbOpen,
    idbSet,
    ink,
    keyLabel,
    makeArcadeBg,
    makeSongClock,
    rgbStr,
    saveBest,
    saveOpts,
    syncPlayIcons,
    translations,
    visualState,
    warmBlip
} = Runtime;

/* ==========================================================================
   JUEGO 1 — BEAT STRIKER OSU! (círculos numerados + patrones musicales)
   ========================================================================== */
Arcade.register({
    id: 'tap',
    icon: 'fa-solid fa-meteor',
    colors: ['0 200 255', '0 102 255'],
    createSession(api, run) {
        const isMobile = Math.min(api.W(), api.H()) < 560;
        const diff = run.diff || 'medium';
        const CFG = {
            easy:   { approach: 1.95, maxOn: 4,  r: isMobile ? 33 : 39, density: 0.58, aim: 0.62, streams: 0.20, slider: 0.08 },
            medium: { approach: 1.62, maxOn: 6,  r: isMobile ? 30 : 35, density: 0.82, aim: 0.78, streams: 0.34, slider: 0.12 },
            hard:   { approach: 1.34, maxOn: 8,  r: isMobile ? 27 : 31, density: 1.00, aim: 0.96, streams: 0.50, slider: 0.16 },
            expert: { approach: 1.10, maxOn: 10, r: isMobile ? 24 : 28, density: 1.15, aim: 1.12, streams: 0.66, slider: 0.20 },
        }[diff];
        const W_P = 0.075, W_G = 0.145, W_X = 0.235;
        const map = run.map || {};
        const KEYS = (OPTS.tapKeys || ['z', 'x']).map((k) => k.toLowerCase());
        if (api.stage && api.stage.classList) api.stage.classList.add('beat-striker-osu');
        const circles = [];
        const vis = [];
        const trails = [];
        const patternLines = [];
        let bIdx = 0;
        let score = 0, combo = 0, maxCombo = 0;
        let spawned = 0, hits = 0, judged = 0, misses = 0;
        let ended = false;
        const missMarks = [];
        let phraseNo = 0;
        let lastHitObject = null;
        let streamDir = Math.random() * Math.PI * 2;
        let flowSide = 1;

        api.buildHud([
            { label: T('score'), id: 'tapScore', value: '0' },
            { label: T('combo'), id: 'tapCombo', value: '0', align: 'center' },
            { label: T('accuracy'), id: 'tapAcc', value: '100%', align: 'right' },
        ]);
        const elScore = document.getElementById('tapScore');
        const elCombo = document.getElementById('tapCombo');
        const elAcc = document.getElementById('tapAcc');

        const trackTitle = (() => {
            try { return (typeof TRACKS !== 'undefined' && TRACKS[window._currentIdx]) ? TRACKS[window._currentIdx].title : ''; }
            catch (e) { return ''; }
        })();
        const refreshAcc = () => {
            const acc = judged > 0 ? (hits / judged) * 100 : 100;
            if (elAcc) elAcc.textContent = acc.toFixed(1) + '%';
        };

        const rnd = (a, b) => a + Math.random() * (b - a);
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const normAng = (a) => {
            while (a < -Math.PI) a += Math.PI * 2;
            while (a >  Math.PI) a -= Math.PI * 2;
            return a;
        };

        function playArea() {
            const outer = CFG.r * 3.15;
            const mEdge = Math.max(22, api.W() * (isMobile ? 0.045 : 0.065));
            return {
                minX: mEdge + outer,
                maxX: api.W() - mEdge - outer,
                minY: 90 + outer,
                maxY: api.H() - outer - 26,
            };
        }
        function clampPoint(p) {
            const b = playArea();
            return { x: clamp(p.x, b.minX, b.maxX), y: clamp(p.y, b.minY, b.maxY) };
        }
        function randomPoint() {
            const b = playArea();
            return { x: rnd(b.minX, b.maxX), y: rnd(b.minY, b.maxY) };
        }
        function farEnough(p, minDist) {
            for (const c of circles) if (Math.hypot(c.x - p.x, c.y - p.y) < minDist) return false;
            return true;
        }
        function smartPoint(preferred, minDist = CFG.r * 2.15) {
            let p = clampPoint(preferred);
            if (farEnough(p, minDist)) return p;
            for (let i = 0; i < 18; i++) {
                const a = rnd(0, Math.PI * 2);
                const d = CFG.r * rnd(2.1, 5.8) * (1 + i * 0.035);
                p = clampPoint({ x: preferred.x + Math.cos(a) * d, y: preferred.y + Math.sin(a) * d });
                if (farEnough(p, minDist)) return p;
            }
            return p;
        }
        function mirrorIfBad(p) {
            const b = playArea();
            if (!lastHitObject) return p;
            const d = Math.hypot(p.x - lastHitObject.x, p.y - lastHitObject.y);
            if (d > CFG.r * 2.1) return p;
            return clampPoint({
                x: b.minX + b.maxX - lastHitObject.x + rnd(-22, 22),
                y: b.minY + b.maxY - lastHitObject.y + rnd(-22, 22),
            });
        }

        const { events, profile } = selectBeatStrikerEvents(map, diff, trackTitle);

        function classifyPattern(e, i) {
            const g0 = i > 0 ? e.t - events[i - 1].t : 999;
            const g1 = i < events.length - 1 ? events[i + 1].t - e.t : 999;
            const beatT = map.beatT || 0.5;
            const density = (g0 < beatT * 0.62 ? 1 : 0) + (g1 < beatT * 0.62 ? 1 : 0);
            // Apilados tipo osu!: dobles/triples muy cercanos sobre vocales/hats o golpes repetidos.
            if (diff !== 'easy' && Math.min(g0, g1) < beatT * 0.42 && Math.random() < profile.stack) return 'stack';
            if (density >= 2 && (CFG.streams + profile.stream) > 1.1) return 'stream';
            if (g0 < beatT * 0.52 || g1 < beatT * 0.52) return Math.random() < 0.66 ? 'burst' : 'stream';
            if (e.energy > 0.92 || e.band === 0) return 'jump';
            if (e.band === 2 && diff !== 'easy') return Math.random() < 0.62 ? 'arc' : 'burst';
            if (e.band === 1) return Math.random() < 0.58 ? 'arc' : 'flow';
            return 'flow';
        }

        function makePatternMeta() {
            const meta = new Array(events.length);
            let i = 0;
            while (i < events.length) {
                const type = classifyPattern(events[i], i);
                let len = 1;
                const maxLen = type === 'stream' ? (diff === 'expert' ? 13 : diff === 'hard' ? 9 : 6) : type === 'burst' ? 5 : type === 'arc' ? 6 : type === 'stack' ? 4 : 3;
                while (i + len < events.length && len < maxLen) {
                    const g = events[i + len].t - events[i + len - 1].t;
                    const b = map.beatT || 0.5;
                    if (type === 'stream' && g <= b * 0.70) len++;
                    else if (type === 'burst' && g <= b * 0.58) len++;
                    else if (type === 'arc' && g <= b * 1.15 && events[i + len].band !== 0) len++;
                    else if (type === 'stack' && g <= b * 0.58) len++;
                    else break;
                }
                if (len < 3 && (type === 'stream' || type === 'burst')) len = 1;
                const phraseBreak = i === 0 || events[i].t - events[i - 1].t > Math.max(0.9, (map.beatT || 0.5) * 1.75);
                if (phraseBreak) phraseNo++;
                const phraseLen = len >= 3 ? len : 1;
                for (let j = 0; j < phraseLen; j++) {
                    meta[i + j] = { type: phraseLen >= 3 ? type : classifyPattern(events[i + j], i + j), pos: j, len: phraseLen, phrase: phraseNo, num: j + 1 };
                }
                if (phraseLen === 1) i++;
                else i += phraseLen;
            }
            // Numeración consistente: todos los círculos numerados dentro de frases; frases cortas también cuentan.
            let local = 0;
            for (let k = 0; k < events.length; k++) {
                const br = k === 0 || events[k].t - events[k - 1].t > Math.max(0.9, (map.beatT || 0.5) * 1.75);
                if (br) local = 1; else local++;
                if (!meta[k]) meta[k] = { type: 'flow', pos: 0, len: 1, phrase: phraseNo, num: local };
                if (meta[k].len < 3) meta[k].num = local;
            }
            return meta;
        }
        const patternMeta = makePatternMeta();

        const patternState = new Map();
        function createState(type, e, i) {
            const base = lastHitObject ? { x: lastHitObject.x, y: lastHitObject.y } : randomPoint();
            const b = playArea();
            const bandBias = e.band === 0 ? -0.25 : e.band === 2 ? 0.25 : 0;
            const centerX = b.minX + (b.maxX - b.minX) * clamp(0.5 + bandBias + rnd(-0.10, 0.10), 0.18, 0.82);
            const centerY = b.minY + (b.maxY - b.minY) * clamp(0.5 + rnd(-0.18, 0.18), 0.18, 0.82);
            if (type === 'stream' || type === 'burst') {
                streamDir += rnd(-0.75, 0.75) + (e.band - 1) * 0.18;
                return { x: base.x, y: base.y, ang: streamDir, turn: rnd(-0.26, 0.26) * profile.curve, centerX, centerY };
            }
            if (type === 'arc') {
                const rad = CFG.r * rnd(3.0, 5.8) * profile.spacing;
                return { centerX, centerY, rad, ang: rnd(0, Math.PI * 2), step: rnd(0.45, 0.86) * (Math.random() < 0.5 ? -1 : 1) * profile.curve };
            }
            if (type === 'stack') {
                const p = smartPoint(base, CFG.r * 2.0);
                return { x: p.x, y: p.y, dx: rnd(-CFG.r * 0.28, CFG.r * 0.28), dy: rnd(-CFG.r * 0.28, CFG.r * 0.28), ang: rnd(0, Math.PI * 2) };
            }
            return { x: base.x, y: base.y, ang: rnd(0, Math.PI * 2) };
        }
        function positionFor(e, i) {
            const m = patternMeta[i];
            const key = `${m.phrase}:${m.type}:${Math.floor(i - m.pos)}`;
            if (!patternState.has(key)) patternState.set(key, createState(m.type, e, i));
            const st = patternState.get(key);
            const b = playArea();
            let p;
            if (m.type === 'stream' || m.type === 'burst') {
                const baseStep = CFG.r * (m.type === 'stream' ? rnd(1.92, 2.42) : rnd(2.24, 3.05));
                const step = baseStep * profile.spacing * (1 + Math.min(e.gapPrev, 0.2) * 0.9);
                if (m.pos === 0 && lastHitObject) {
                    const kick = CFG.r * rnd(2.6, 4.8) * profile.jump;
                    st.ang = Math.atan2(st.y - lastHitObject.y, st.x - lastHitObject.x) + rnd(-0.9, 0.9);
                    p = clampPoint({ x: lastHitObject.x + Math.cos(st.ang) * kick, y: lastHitObject.y + Math.sin(st.ang) * kick });
                    st.x = p.x; st.y = p.y;
                } else if (m.pos === 0) {
                    p = smartPoint({ x: st.x, y: st.y });
                    st.x = p.x; st.y = p.y;
                } else {
                    st.ang += st.turn + (e.band - 1) * 0.045;
                    p = clampPoint({ x: st.x + Math.cos(st.ang) * step, y: st.y + Math.sin(st.ang) * step });
                    if (p.x <= b.minX + 2 || p.x >= b.maxX - 2) st.ang = Math.PI - st.ang;
                    if (p.y <= b.minY + 2 || p.y >= b.maxY - 2) st.ang = -st.ang;
                    st.x = p.x; st.y = p.y;
                }
                return smartPoint(p, CFG.r * 1.75);
            }
            if (m.type === 'arc') {
                const a = st.ang + st.step * m.pos;
                p = { x: st.centerX + Math.cos(a) * st.rad, y: st.centerY + Math.sin(a) * st.rad * 0.66 };
                return smartPoint(p, CFG.r * 1.9);
            }
            if (m.type === 'stack') {
                // Stacks jugables: varios círculos casi en el mismo punto, con micro-offset
                // visible para que se lea el orden sin tener que mover el cursor de forma absurda.
                const off = m.pos * CFG.r * 0.28;
                p = clampPoint({ x: st.x + st.dx * m.pos + Math.cos(st.ang) * off, y: st.y + st.dy * m.pos + Math.sin(st.ang) * off });
                return smartPoint(p, CFG.r * 1.20);
            }
            if (m.type === 'jump') {
                flowSide *= -1;
                const spanX = (b.maxX - b.minX) * rnd(0.42, 0.74) * profile.jump;
                const spanY = (b.maxY - b.minY) * rnd(-0.26, 0.26);
                const anchor = lastHitObject || { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
                p = clampPoint({ x: anchor.x + flowSide * spanX, y: anchor.y + spanY });
                return smartPoint(mirrorIfBad(p), CFG.r * 2.15);
            }
            // flow: alternancia suave tipo mapper humano.
            const anchor = lastHitObject || randomPoint();
            const gap = Math.min(e.gapPrev || 0.5, 0.9);
            const dist = CFG.r * (3.0 + gap * 4.6) * profile.spacing * CFG.aim;
            const angleTarget = st.ang + rnd(-0.92, 0.92) + (e.band - 1) * 0.18;
            st.ang = normAng(angleTarget);
            p = clampPoint({ x: anchor.x + Math.cos(st.ang) * dist, y: anchor.y + Math.sin(st.ang) * dist * 0.82 });
            if (Math.random() < 0.25 * profile.stack && diff !== 'easy') p = { x: p.x + rnd(-CFG.r * 0.55, CFG.r * 0.55), y: p.y + rnd(-CFG.r * 0.55, CFG.r * 0.55) };
            return smartPoint(p, CFG.r * 2.05);
        }

        function spawn(e, i) {
            const p = positionFor(e, i);
            const m = patternMeta[i];
            const isSlider = diff !== 'easy' && m.type === 'arc' && m.pos === 0 && m.len >= 4 && Math.random() < CFG.slider;
            const c = {
                x: p.x, y: p.y, hitT: e.t, r: CFG.r, s: e.s, band: e.band,
                num: m.num, phrase: m.phrase, type: m.type, pos: m.pos, len: m.len,
                slider: isSlider ? { phase: 0, life: Math.min(1.2, (map.beatT || 0.5) * 1.5) } : null,
            };
            if (lastHitObject) {
                patternLines.push({ x1: lastHitObject.x, y1: lastHitObject.y, x2: c.x, y2: c.y, born: api.songNow(), life: 0.62, phrase: c.phrase });
            }
            lastHitObject = c;
            circles.push(c);
            spawned++;
        }

        function miss(c, idx) {
            circles.splice(idx, 1);
            judged++;
            misses++;
            combo = 0;
            missMarks.push({ x: c.x, y: c.y, born: api.songNow(), life: 0.72, r: c.r, num: c.num });
            api.addFloat(c.x, c.y, '✕', '255 80 110');
            elCombo.textContent = '0';
            elCombo.classList.remove('combo-hot');
            refreshAcc();
            haptic(42);
        }
        function finish() {
            if (ended) return;
            ended = true;
            const acc = judged > 0 ? (hits / judged) * 100 : 0;
            const grade = acc >= 99.5 ? 'SS' : acc >= 96 ? 'S' : acc >= 90 ? 'A' : acc >= 80 ? 'B' : acc >= 65 ? 'C' : 'D';
            api.end({
                score,
                grade,
                stats: [
                    [T('hits'), `${hits} / ${judged || spawned}`],
                    ['Fallos', String(misses)],
                    [T('accuracy'), acc.toFixed(1) + '%'],
                    [T('maxCombo'), 'x' + maxCombo],
                    ['BPM', Math.round(map.bpm || 0)],
                    ['Perfil', profile.name + ' · Hero logic'],
                ],
            });
        }

        function drawBackground(ctx, W, H, beat) {
            if (beat > 0.02) {
                const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.62);
                g.addColorStop(0, rgbStr(accentRgb(2), 0.045 + beat * 0.085));
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);
            }
            const b = playArea();
            ctx.save();
            ctx.globalAlpha = 0.10 + beat * 0.06;
            ctx.strokeStyle = rgbStr(accentRgb(1), 0.35);
            ctx.lineWidth = 1;
            for (let x = b.minX; x <= b.maxX; x += 70) {
                ctx.beginPath(); ctx.moveTo(x, b.minY); ctx.lineTo(x, b.maxY); ctx.stroke();
            }
            for (let y = b.minY; y <= b.maxY; y += 70) {
                ctx.beginPath(); ctx.moveTo(b.minX, y); ctx.lineTo(b.maxX, y); ctx.stroke();
            }
            ctx.restore();
        }

        function drawConnectorLines(ctx, now) {
            const a1c = accentRgb(1).split(/\s+/).join(',');
            for (let i = patternLines.length - 1; i >= 0; i--) {
                const ln = patternLines[i];
                const age = now - ln.born;
                if (age > ln.life) { patternLines.splice(i, 1); continue; }
                const alpha = (1 - age / ln.life) * 0.22;
                ctx.beginPath();
                ctx.moveTo(ln.x1, ln.y1);
                ctx.lineTo(ln.x2, ln.y2);
                ctx.strokeStyle = `rgba(${a1c},${alpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        function drawMissMarks(ctx, now) {
            const rc = '255,80,110';
            for (let i = missMarks.length - 1; i >= 0; i--) {
                const m = missMarks[i];
                const age = now - m.born;
                if (age > m.life) { missMarks.splice(i, 1); continue; }
                const p = age / m.life;
                const alpha = (1 - p) * 0.92;
                const size = m.r * (1.05 + p * 0.55);
                ctx.save();
                ctx.translate(m.x, m.y);
                ctx.rotate(0.22 * Math.sin(p * Math.PI));
                ctx.lineCap = 'round';
                ctx.lineWidth = Math.max(4, m.r * 0.18);
                ctx.strokeStyle = `rgba(${rc},${alpha})`;
                ctx.beginPath();
                ctx.moveTo(-size * 0.55, -size * 0.55);
                ctx.lineTo(size * 0.55, size * 0.55);
                ctx.moveTo(size * 0.55, -size * 0.55);
                ctx.lineTo(-size * 0.55, size * 0.55);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.82, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${rc},${alpha * 0.24})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }
        }

        function drawHitTrails(ctx, now) {
            const a1c = accentRgb(1).split(/\s+/).join(',');
            for (let i = trails.length - 1; i >= 0; i--) {
                const tr = trails[i];
                const age = now - tr.t;
                if (age > 0.42) { trails.splice(i, 1); continue; }
                const p = age / 0.42;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, CFG.r * (0.65 + p * 1.95), 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${a1c},${(1 - p) * 0.34})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            // Estela entre los últimos impactos, da sensación de lectura rápida en streams.
            if (trails.length >= 2) {
                ctx.beginPath();
                const arr = trails.slice(-7);
                ctx.moveTo(arr[0].x, arr[0].y);
                for (let i = 1; i < arr.length; i++) ctx.lineTo(arr[i].x, arr[i].y);
                ctx.strokeStyle = `rgba(${a1c},0.18)`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        function drawProgress(ctx, W, H, now) {
            const lastT = events[events.length - 1]?.t || map.dur || 1;
            const pct = clamp(now / Math.max(lastT, 1), 0, 1);
            const x = Math.max(18, W * 0.18);
            const y = H - 18;
            const w = Math.min(W * 0.62, 680);
            const h = 4;
            const a1c = accentRgb(1).split(/\s+/).join(',');
            const a2c = accentRgb(2).split(/\s+/).join(',');
            ctx.save();
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(x, y, w, h);
            const grd = ctx.createLinearGradient(x, y, x + w, y);
            grd.addColorStop(0, `rgba(${a2c},0.92)`);
            grd.addColorStop(1, `rgba(${a1c},0.98)`);
            ctx.fillStyle = grd;
            ctx.fillRect(x, y, w * pct, h);
            ctx.beginPath();
            ctx.arc(x + w * pct, y + h / 2, 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${a1c},0.95)`;
            ctx.fill();
            ctx.restore();
        }

        return {
            frame(dt) {
                const ctx = api.ctx, W = api.W(), H = api.H();
                const now = api.songNow();
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);
                drawBackground(ctx, W, H, beat);
                drawProgress(ctx, W, H, now);

                while (bIdx < events.length && events[bIdx].t - now <= CFG.approach) {
                    const e = events[bIdx];
                    if (e.t > now + 0.10 && circles.length < CFG.maxOn) spawn(e, bIdx);
                    bIdx++;
                }

                const a1 = accentRgb(1), a2 = accentRgb(2);
                const a1c = a1.split(/\s+/).join(','), a2c = a2.split(/\s+/).join(',');
                vis.length = 0;
                for (let i = circles.length - 1; i >= 0; i--) {
                    const c = circles[i];
                    const remain = c.hitT - now;
                    if (remain < -W_X) { miss(c, i); continue; }
                    c._k = clamp(remain / CFG.approach, 0, 1);
                    vis.push(c);
                }

                drawConnectorLines(ctx, now);
                drawHitTrails(ctx, now);
                drawMissMarks(ctx, now);
                if (bIdx >= events.length && circles.length === 0 && now > (events[events.length - 1]?.t || 0) + 1.25) finish();

                glowBegin(ctx);
                const gA = 0.42 + beat * 0.32;
                for (let i = 0; i < vis.length; i++) {
                    const c = vis[i];
                    glowAt(ctx, c.x, c.y, c.r * (c.type === 'jump' ? 2.45 : 2.12), c.band === 2 ? 'a1' : 'a2', gA);
                }
                glowEnd(ctx);

                // Orden osu!: se dibujan primero los más lejanos en tiempo, últimos encima los inmediatos.
                vis.sort((a, b) => b.hitT - a.hitT);
                for (let i = 0; i < vis.length; i++) {
                    const c = vis[i];
                    const k = c._k;
                    const timingPulse = 1 - Math.abs(api.songNow() - c.hitT) / W_X;
                    const rr = c.r * (1 + beat * 0.045 + Math.max(0, timingPulse) * 0.035);
                    const grad = ctx.createRadialGradient(c.x - c.r * 0.35, c.y - c.r * 0.35, c.r * 0.1, c.x, c.y, c.r);
                    const bandAlpha = c.band === 0 ? [a2c, a1c] : c.band === 2 ? [a1c, a2c] : [a1c, a2c];
                    grad.addColorStop(0, `rgba(${bandAlpha[0]},0.97)`);
                    grad.addColorStop(1, `rgba(${bandAlpha[1]},0.82)`);

                    if (c.slider) {
                        const t = easeOut(1 - k);
                        const rr2 = c.r * (1.4 + t * 1.2);
                        ctx.beginPath();
                        ctx.arc(c.x, c.y, rr2, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(${a2c},${0.12 + t * 0.18})`;
                        ctx.lineWidth = c.r * 0.42;
                        ctx.stroke();
                    }

                    ctx.beginPath();
                    ctx.arc(c.x, c.y, rr, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // borde interior tipo osu! para legibilidad del número
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, rr * 0.66, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(0,0,0,0.24)';
                    ctx.lineWidth = Math.max(2, c.r * 0.12);
                    ctx.stroke();

                    ctx.font = `900 ${Math.round(c.r * (c.num >= 10 ? 0.66 : 0.82))}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.lineWidth = Math.max(3, c.r * 0.12);
                    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
                    ctx.strokeText(String(c.num), c.x, c.y + 1);
                    ctx.fillStyle = 'rgba(255,255,255,0.98)';
                    ctx.fillText(String(c.num), c.x, c.y + 1);
                    ctx.textBaseline = 'alphabetic';

                    const approachR = c.r + c.r * (2.20 * k);
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, approachR, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${a1c},${0.38 + (1 - k) * 0.42 + beat * 0.12})`;
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    if (c.type === 'stream' || c.type === 'burst') {
                        ctx.beginPath();
                        ctx.arc(c.x, c.y, c.r * 1.18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (c.pos + 1) / Math.max(c.len, 1));
                        ctx.strokeStyle = `rgba(${a2c},0.38)`;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                }
            },
            onTap(x, y) {
                const now = api.songNow();
                let bestIdx = -1, bestScore = Infinity;
                for (let i = 0; i < circles.length; i++) {
                    const c = circles[i];
                    const d = Math.hypot(c.x - x, c.y - y);
                    const dtHit = Math.abs(now - c.hitT);
                    const radius = Math.max(c.r * 1.72, isMobile ? 42 : 34);
                    if (d > radius || dtHit > W_X) continue;
                    const s = dtHit * 1000 + d * 1.8;
                    if (s < bestScore) { bestScore = s; bestIdx = i; }
                }
                if (bestIdx < 0) return;
                const c = circles[bestIdx];
                const dtHit = Math.abs(now - c.hitT);
                let pts, label, accent;
                if (dtHit <= W_P) { pts = 300; label = T('perfect'); accent = 1; }
                else if (dtHit <= W_G) { pts = 150; label = T('good'); accent = 2; }
                else { pts = 50; label = T('good'); accent = 2; }
                circles.splice(bestIdx, 1);
                judged++;
                hits++;
                combo++;
                maxCombo = Math.max(maxCombo, combo);
                const speedBonus = c.type === 'stream' || c.type === 'burst' ? 1.06 : c.type === 'jump' ? 1.12 : 1;
                score += Math.round(pts * speedBonus * (1 + Math.min(combo, 45) * 0.085));
                elScore.textContent = fmtN(score);
                elCombo.textContent = 'x' + combo;
                elCombo.classList.toggle('combo-hot', combo >= 8);
                refreshAcc();
                api.burst(c.x, c.y, { n: pts >= 300 ? 32 : 18, power: pts >= 300 ? 1.28 : 0.86, accent });
                api.addFloat(c.x, c.y, label, accent === 1 ? accentRgb(1) : accentRgb(2));
                if (combo > 0 && combo % 50 === 0) api.addFloat(api.W() / 2, api.H() * 0.33, combo + 'x', accentRgb(1));
                trails.push({ x: c.x, y: c.y, t: now });
                haptic(12);
            },
            onKey(ev, down) {
                if (!down) return;
                if (KEYS.includes(ev.key.toLowerCase())) {
                    const pt = api.pointer();
                    this.onTap(pt.x, pt.y);
                }
            },
            forceEnd() { finish(); },
            destroy() { if (api.stage && api.stage.classList) api.stage.classList.remove('beat-striker-osu'); circles.length = 0; trails.length = 0; patternLines.length = 0; missMarks.length = 0; },
        };
    },
});

