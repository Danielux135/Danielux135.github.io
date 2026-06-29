import { Arcade } from '../runtime.js';
import * as Runtime from '../runtime.js';
const {
    accentRgb,
    blip,
    clamp,
    fmtN,
    glow,
    haptic,
    rgbStr,
    T,
} = Runtime;

/* ==========================================================================
   BEAT BLITZ — toca en el beat exacto: pura precisión rítmica
   No hay vidas, no hay puertas: solo tú, el beat y el combo.
   ========================================================================== */
Arcade.register({
    id: 'beatblitz',
    icon: 'fa-solid fa-bolt',
    colors: ['255 200 0', '255 80 160'],
    fmtBest: (v) => v + '%',
    createSession(api, run) {
        const map = run.map;

        const CFG = {
            easy:   { winP: 0.10, winG: 0.18, winF: 0.28 },
            medium: { winP: 0.075, winG: 0.14, winF: 0.22 },
            hard:   { winP: 0.055, winG: 0.11, winF: 0.18 },
            expert: { winP: 0.040, winG: 0.085, winF: 0.14 },
        }[run.diff];

        let score = 0, combo = 0, maxCombo = 0;
        let nPerfect = 0, nGood = 0, nMiss = 0, nTotal = 0;
        let t = 0;
        let ended = false;

        const comboMult = () => combo >= 24 ? 8 : combo >= 16 ? 4 : combo >= 8 ? 2 : 1;

        const beats = [];
        {
            const phase = map.grid && map.grid.length ? map.grid[0] : 0;
            const beatT = map.beatT || 0.5;
            let cur = phase;
            while (cur < (map.dur || 300)) {
                beats.push({ t: cur, state: 'pending' });
                cur += beatT;
            }
        }
        let bIdx = 0;

        const floats = [];
        function addFloat(txt, x, y, rgb) {
            floats.push({ txt, x, y, rgb, born: t, life: 0.9 });
        }

        api.buildHud([
            { label: T('score'), id: 'bbScore', value: '0' },
            { label: 'COMBO', id: 'bbCombo', value: '×1', align: 'center' },
            { label: T('accuracy'), id: 'bbAcc', value: '—', align: 'right' },
        ]);
        const elScore = document.getElementById('bbScore');
        const elCombo = document.getElementById('bbCombo');
        const elAcc   = document.getElementById('bbAcc');

        function refreshHud() {
            elScore.textContent = fmtN(score);
            const m = comboMult();
            elCombo.textContent = '×' + m;
            elCombo.classList.toggle('combo-hot', m >= 2);
            const judged = nPerfect + nGood + nMiss;
            if (judged > 0) {
                const acc = ((300 * nPerfect + 150 * nGood) / (300 * judged)) * 100;
                elAcc.textContent = acc.toFixed(1) + '%';
            }
        }

        function finish() {
            if (ended) return;
            ended = true;
            const judged = nPerfect + nGood + nMiss;
            const acc = judged > 0 ? ((300 * nPerfect + 150 * nGood) / (300 * judged)) * 100 : 0;
            const grade = acc >= 95 ? 'S' : acc >= 85 ? 'A' : acc >= 70 ? 'B' : acc >= 50 ? 'C' : 'D';
            api.end({
                score: Math.round(acc),
                grade,
                fmtBest: (v) => v + '%',
                stats: [
                    [T('perfect'), nPerfect],
                    [T('good'), nGood],
                    [T('miss'), nMiss],
                    [T('maxCombo'), 'x' + maxCombo],
                ],
            });
        }

        function doTap() {
            if (ended) return;
            const now = api.songNow();
            const W = api.W(), H = api.H();
            const cx = W / 2, cy = H / 2;

            let bestIdx = -1, bestDt = Infinity;
            for (let i = Math.max(0, bIdx - 4); i < Math.min(beats.length, bIdx + 8); i++) {
                if (beats[i].state !== 'pending') continue;
                const dt = Math.abs(now - beats[i].t);
                if (dt < bestDt && dt < CFG.winF) { bestDt = dt; bestIdx = i; }
            }

            if (bestIdx === -1) {
                combo = 0;
                blip(200, 0.05, 0.08);
                haptic(30);
                addFloat('EARLY', cx, cy - 30, '255 100 100');
                refreshHud();
                return;
            }

            beats[bestIdx].state = 'hit';
            nTotal++;

            let pts, label, rgb;
            if (bestDt <= CFG.winP) {
                pts = 300; label = T('perfect'); rgb = accentRgb(1);
                nPerfect++;
                blip(880, 0.09, 0.06);
                haptic(10);
            } else if (bestDt <= CFG.winG) {
                pts = 150; label = T('good'); rgb = accentRgb(2);
                nGood++;
                blip(660, 0.06, 0.06);
                haptic(8);
            } else {
                pts = 50; label = 'OK'; rgb = '163 230 53';
                nGood++;
                blip(440, 0.04, 0.07);
                haptic(6);
            }

            combo++;
            maxCombo = Math.max(maxCombo, combo);
            const mult = comboMult();
            score += Math.round(pts * mult);
            api.burst(cx, cy, { n: pts >= 300 ? 28 : 14, power: pts >= 300 ? 1.3 : 0.8, accent: pts >= 300 ? 1 : 2 });
            addFloat(label, cx, cy - 20, rgb);
            if (mult > 1) addFloat('×' + mult, cx + 50, cy - 50, '255 200 0');
            refreshHud();
        }

        let pulseR = 0;

        return {
            frame(dt) {
                t += dt;
                if (ended) return;
                const ctx = api.ctx, W = api.W(), H = api.H();
                const now = api.songNow();
                const beat = api.beat();
                ctx.clearRect(0, 0, W, H);

                const a1 = accentRgb(1), a2 = accentRgb(2);
                const cx = W / 2, cy = H / 2;

                while (bIdx < beats.length && beats[bIdx].t < now - CFG.winF) {
                    if (beats[bIdx].state === 'pending') {
                        beats[bIdx].state = 'miss';
                        nMiss++;
                        combo = 0;
                        refreshHud();
                    }
                    bIdx++;
                }

                if (bIdx >= beats.length && now > (beats[beats.length - 1]?.t || 0) + 2) {
                    finish();
                    return;
                }

                const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
                bg.addColorStop(0, rgbStr(a2, 0.06 + beat * 0.10));
                bg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = bg;
                ctx.fillRect(0, 0, W, H);

                let nextBeat = null;
                for (let i = bIdx; i < beats.length; i++) {
                    if (beats[i].state === 'pending' && beats[i].t > now - CFG.winF) {
                        nextBeat = beats[i];
                        break;
                    }
                }

                const BASE_R = Math.min(W, H) * 0.18;

                if (nextBeat) {
                    const until = nextBeat.t - now;
                    const lead = map.beatT || 0.5;
                    if (until > 0 && until < lead * 1.5) {
                        const prog = clamp(1 - until / (lead * 1.5), 0, 1);
                        const approachR = BASE_R * (1 + (1 - prog) * 2.2);
                        const alpha = 0.18 + prog * 0.55;
                        const lw = 3 + prog * 4;
                        ctx.beginPath();
                        ctx.arc(cx, cy, approachR, 0, Math.PI * 2);
                        ctx.strokeStyle = rgbStr(a1, alpha);
                        ctx.lineWidth = lw;
                        ctx.stroke();
                    }
                    if (Math.abs(now - nextBeat.t) <= CFG.winF) {
                        const inW = 1 - Math.abs(now - nextBeat.t) / CFG.winF;
                        glow(ctx, cx, cy, BASE_R * 2.8, 'a1', 0.25 + inW * 0.45);
                    }
                }

                pulseR = BASE_R * (1 + beat * 0.12);
                const orbGrad = ctx.createRadialGradient(cx - BASE_R * 0.3, cy - BASE_R * 0.3, BASE_R * 0.05, cx, cy, pulseR);
                orbGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
                orbGrad.addColorStop(0.3, rgbStr(a1, 0.92));
                orbGrad.addColorStop(1, rgbStr(a2, 0.8));
                ctx.beginPath();
                ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
                ctx.fillStyle = orbGrad;
                ctx.fill();

                if (nextBeat && Math.abs(now - nextBeat.t) <= CFG.winF * 1.2) {
                    const inW = 1 - Math.abs(now - nextBeat.t) / (CFG.winF * 1.2);
                    ctx.beginPath();
                    ctx.arc(cx, cy, pulseR * 0.72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * inW);
                    ctx.strokeStyle = 'rgba(255,255,255,' + (0.3 + inW * 0.6) + ')';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }

                const mult = comboMult();
                if (mult > 1) {
                    ctx.font = `900 ${Math.round(BASE_R * 0.55)}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(255,255,255,0.88)';
                    ctx.fillText('×' + mult, cx, cy);
                    ctx.textBaseline = 'alphabetic';
                }

                if (t < 3.5) {
                    const alpha = clamp(1 - (t - 2.5) / 1, 0, 1);
                    ctx.font = `700 ${Math.round(Math.min(W, H) * 0.042)}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'alphabetic';
                    ctx.fillStyle = rgbStr(a1, 0.7 * alpha);
                    ctx.fillText('SPACE / TAP', cx, cy + BASE_R + 42);
                }

                for (let i = floats.length - 1; i >= 0; i--) {
                    const f = floats[i];
                    const age = t - f.born;
                    if (age > f.life) { floats.splice(i, 1); continue; }
                    const p = age / f.life;
                    const fy = f.y - p * 44;
                    ctx.globalAlpha = 1 - p * p;
                    ctx.font = `900 ${Math.round(Math.min(W, H) * 0.05)}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'alphabetic';
                    ctx.fillStyle = `rgb(${f.rgb})`;
                    ctx.fillText(f.txt, f.x, fy);
                    ctx.globalAlpha = 1;
                }

                const lastT = beats[beats.length - 1]?.t || map.dur || 1;
                const pct = clamp(now / Math.max(lastT, 1), 0, 1);
                const bx = W * 0.1, by = H - 16, bw = W * 0.8, bh = 4;
                ctx.fillStyle = 'rgba(255,255,255,0.07)';
                ctx.fillRect(bx, by, bw, bh);
                const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
                pg.addColorStop(0, rgbStr(a2, 0.9));
                pg.addColorStop(1, rgbStr(a1, 0.95));
                ctx.fillStyle = pg;
                ctx.fillRect(bx, by, bw * pct, bh);
            },
            onTap() { doTap(); },
            onKey(ev, down) {
                if (down && (ev.key === ' ' || ev.code === 'Space' || ev.key === 'Enter')) doTap();
            },
            forceEnd() { finish(); },
            destroy() { floats.length = 0; },
        };
    },
});
