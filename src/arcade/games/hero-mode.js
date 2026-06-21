import * as Runtime from '../runtime.js';
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
    heroAnimePopRows,
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
   JUEGO 2 — DANIELUX HERO (carriles por banda: graves ⟵ · voz · ⟶ agudos)
   ========================================================================== */
Arcade.register({
    id: 'hero',
    icon: 'fa-solid fa-guitar',
    colors: ['139 92 246', '236 72 153'],
    createSession(api, run) {
        const isTouch = window.matchMedia('(pointer:coarse)').matches;
        const LANES = OPTS.heroLanes;
        const KEYS = (OPTS.heroKeys[LANES] || ['d', 'f', 'j']).slice(0, LANES);
        const LEAD = { easy: 2.0, medium: 1.75, hard: 1.5, expert: 1.3 }[run.diff] * (isTouch ? 0.92 : 1);
        const W_PERFECT = 0.07, W_GOOD = 0.145, W_OK = 0.19;
        const trackTitle = (() => {
            try { return (typeof TRACKS !== 'undefined' && TRACKS[window._currentIdx]) ? TRACKS[window._currentIdx].title : ''; }
            catch (e) { return ''; }
        })();
        const events = eventsForHero(run.map, run.diff, trackTitle);
        const manualHeroMap = events.some((event) => typeof event.manualMap === 'string' && event.manualMap.startsWith('horobi-hero-'));

        let score = 0, combo = 0, maxCombo = 0;
        let nPerfect = 0, nGood = 0, nOk = 0, nMiss = 0;
        const laneFlash = new Array(LANES).fill(0);

        // En mapas manuales, el carril viene elegido por el mapa musical y no está
        // ligado a una fuente concreta: voz, bajo, batería y lead pueden caer en
        // cualquier carril. En mapas automáticos se conserva la lógica por bandas.
        const ZONES = LANES === 3 ? [[0], [1], [2]]
            : LANES === 4 ? [[0, 1], [1, 2], [2, 3]]
            : [[0, 1], [1, 2, 3], [3, 4]];
        const zoneIdx = [0, 0, 0]; // rota dentro de cada zona para esparcir las notas
        const durSec = Math.max(run.map.dur || 1, 1);
        const lowPerMin = (run.map.low?.length || 0) / durSec * 60;
        const melodicPerMin = ((run.map.mid?.length || 0) + (run.map.high?.length || 0)) / durSec * 60;
        const namedHoldProfile = /hardstyle|speedcore|hardcore|rawstyle/i.test(trackTitle);
        const animeHoldProfile = run.diff === 'expert' && events.some((event) => event.profile === 'darkAnimePop');
        const bassHoldProfile = run.diff === 'expert' && lowPerMin > 115 && melodicPerMin < 360;
        const holdProfile = run.diff === 'expert' && (namedHoldProfile || animeHoldProfile || bassHoldProfile);
        let prevLane = -1, prevT = -9, prevChordT = -9, holdUntil = -9;
        const laneHoldUntil = new Array(LANES).fill(-9);
        const notes = [];
        const laneFreeAt = (lane, t, pad = 0.06) => t >= laneHoldUntil[lane] + pad;
        const pickLane = (zone, t, prefer = prevLane) => {
            const zl = ZONES[zone];
            let fallback = zl[zoneIdx[zone] % zl.length];
            for (let tries = 0; tries < zl.length; tries++) {
                const cand = zl[zoneIdx[zone]++ % zl.length];
                if (laneFreeAt(cand, t) && !(cand === prefer && t - prevT < 0.22)) return cand;
                if (laneFreeAt(cand, t)) fallback = cand;
            }
            return laneFreeAt(fallback, t, -0.02) ? fallback : -1;
        };
        const laneFromHint = (hint) => clamp(Math.round(clamp(Number(hint) || 0, 0, 1) * (LANES - 1)), 0, LANES - 1);
        const laneFromIndex = (index, fallback = 0.5) => Number.isFinite(index)
            ? clamp(Math.round(Number(index)), 0, LANES - 1)
            : laneFromHint(fallback);
        const pickManualLane = (event, t) => {
            const preferred = laneFromIndex(event.laneIndex, event.laneHint ?? 0.5);
            const order = [preferred];
            for (let step = 1; step < LANES; step++) {
                const left = preferred - step;
                const right = preferred + step;
                if (left >= 0) order.push(left);
                if (right < LANES) order.push(right);
            }
            for (const cand of order) {
                if (!laneFreeAt(cand, t)) continue;
                if (cand === prevLane && t - prevT < 0.145) continue;
                return cand;
            }
            for (const cand of order) {
                if (laneFreeAt(cand, t, -0.015)) return cand;
            }
            return -1;
        };
        const manualChordLane = (event, mainLane, t) => {
            if (!Number.isFinite(event.chordLaneIndex) && !Number.isFinite(event.chordLaneHint)) return -1;
            const preferred = laneFromIndex(event.chordLaneIndex, event.chordLaneHint);
            const order = [preferred];
            for (let step = 1; step < LANES; step++) {
                const left = preferred - step;
                const right = preferred + step;
                if (left >= 0) order.push(left);
                if (right < LANES) order.push(right);
            }
            for (const cand of order) {
                if (cand !== mainLane && laneFreeAt(cand, t)) return cand;
            }
            return -1;
        };
        const chordLanes = (lane, count, t) => {
            const out = [lane];
            for (let step = 1; out.length < count && step < LANES; step++) {
                const cand = (lane + step) % LANES;
                if (!out.includes(cand) && laneFreeAt(cand, t)) out.push(cand);
            }
            return out.slice(0, count);
        };
        const chordSize = (e) => {
            if (run.diff !== 'expert') return (run.diff === 'hard' && e.s > 0.86) ? 2 : 1;
            const energy = run.map.energyAt ? run.map.energyAt(e.t) : 0;
            const strong = Math.max(e.s, energy);
            if (animeHoldProfile) {
                if (e.role === 'bass-drop' && e.t - prevChordT > 0.54) return Math.min(4, LANES);
                if (e.role === 'vocal-belt' && e.t - prevChordT > 0.46) return Math.min(3, LANES);
                if (e.role === 'lead-guitar' && e.t - prevChordT > 0.34) return Math.min(3, LANES);
                if (strong > 0.88 && e.t - prevChordT > 0.50) return Math.min(3, LANES);
                if (strong > 0.74 && e.t - prevChordT > 0.32) return 2;
                return 1;
            }
            if (namedHoldProfile) {
                if (strong > 0.97 && e.t - prevChordT > 1.08) return Math.min(4, LANES);
                if (strong > 0.91 && e.t - prevChordT > 0.72) return Math.min(3, LANES);
                if (strong > 0.78 && e.t - prevChordT > 0.42) return 2;
                return 1;
            }
            if (strong > 0.93 && e.t - prevChordT > 0.82) return Math.min(4, LANES);
            if (strong > 0.84 && e.t - prevChordT > 0.58) return Math.min(3, LANES);
            if (strong > 0.70 && e.t - prevChordT > 0.34) return 2;
            return 1;
        };
        events.forEach((e, i) => {
            if (!manualHeroMap && holdProfile && !namedHoldProfile && e.t < holdUntil - 0.05 && e.s < 0.82) return;
            const zone = e.band; // 0 graves · 1 medios/voz · 2 agudos
            let lane = manualHeroMap ? pickManualLane(e, e.t) : pickLane(zone, e.t);
            if (lane === -1) return;
            const next = events[i + 1];
            const nextGap = next ? next.t - e.t : run.map.beatT;
            const holdBand = animeHoldProfile ? e.band === 1 : (namedHoldProfile ? e.band !== 2 : e.band === 0);
            const wantsHold = manualHeroMap
                ? (e.holdDur || 0) > 0
                : holdProfile
                && holdBand
                && (animeHoldProfile ? (e.role === 'vocal-belt' || e.role === 'voice' || e.s > 0.50) : e.s > (namedHoldProfile && e.band === 1 ? 0.40 : 0.50))
                && e.t - holdUntil > 0.10
                && (animeHoldProfile || namedHoldProfile || nextGap > 0.18);
            const dur = wantsHold
                ? (manualHeroMap
                    ? clamp(e.holdDur || 0, 0.22, 1.10)
                    : animeHoldProfile
                    ? clamp(Math.min(nextGap - 0.04, run.map.beatT * 0.72), 0.24, 0.54)
                    : namedHoldProfile
                    ? clamp(run.map.beatT * (e.band === 1 ? 0.82 : 0.95), 0.32, 0.78)
                    : clamp(Math.min(nextGap - 0.08, run.map.beatT * 0.82), 0.26, 0.72))
                : 0;
            const size = manualHeroMap || dur > 0 ? 1 : chordSize(e);
            const lanes = manualHeroMap ? [lane] : chordLanes(lane, size, e.t);
            if (manualHeroMap && dur <= 0) {
                const chordLane = manualChordLane(e, lane, e.t);
                if (chordLane >= 0) lanes.push(chordLane);
            }
            if (!lanes.length) return;
            lanes.forEach((ln, ci) => {
                notes.push({
                    t: e.t,
                    lane: ln,
                    s: e.s,
                    hold: ci === 0 && dur > 0,
                    dur: ci === 0 ? dur : 0,
                    role: e.role || '',
                    manualMap: e.manualMap || '',
                });
            });
            if (size > 1) prevChordT = e.t;
            if (dur > 0) {
                holdUntil = e.t + dur;
                laneHoldUntil[lane] = holdUntil;
                zoneIdx[zone] += 1;
            }
            // acordes en golpes fuertes (solo difícil y experto)
            prevLane = lane;
            prevT = e.t;
        });
        notes.sort((a, b) => a.t - b.t || a.lane - b.lane);

        let idx = 0;
        const active = [];
        const vis = []; // notas visibles de este frame (reusado, sin asignar por frame)
        const laneDown = new Array(LANES).fill(false);
        let totalSpawned = 0;

        api.buildHud([
            { label: T('score'), id: 'heroScore', value: '0' },
            { label: T('combo'), id: 'heroCombo', value: '0', align: 'center' },
            { label: T('accuracy'), id: 'heroAcc', value: '100%', align: 'right' },
        ]);
        const elScore = document.getElementById('heroScore');
        const elCombo = document.getElementById('heroCombo');
        const elAcc = document.getElementById('heroAcc');

        function layout() {
            const W = api.W(), H = api.H();
            const areaW = Math.min(W * 0.92, 170 * LANES);
            return {
                x0: (W - areaW) / 2,
                laneW: areaW / LANES,
                topY: 64,
                hitY: H - (isTouch ? 116 : 96),
            };
        }

        function accuracy() {
            const judged = nPerfect + nGood + nOk + nMiss;
            if (!judged) return 100;
            return ((300 * nPerfect + 150 * nGood + 50 * nOk) / (300 * judged)) * 100;
        }
        function refreshHud() {
            elScore.textContent = fmtN(score);
            elCombo.textContent = combo > 0 ? 'x' + combo : '0';
            elCombo.classList.toggle('combo-hot', combo >= 10);
            elAcc.textContent = accuracy().toFixed(1) + '%';
        }

        function completeHold(n, L) {
            if (n.done) return;
            n.done = true;
            combo++;
            maxCombo = Math.max(maxCombo, combo);
            score += Math.round(220 * (1 + Math.min(combo, 40) * 0.08));
            const cx = L.x0 + (n.lane + 0.5) * L.laneW;
            api.burst(cx, L.hitY, { n: 18, power: 0.75, accent: 1 });
            api.addFloat(cx, L.hitY - 52, 'HOLD', accentRgb(1));
            refreshHud();
            haptic(8);
        }

        function breakHold(n, L) {
            if (n.done || n.broken) return;
            n.broken = true;
            nMiss++;
            combo = 0;
            const cx = L.x0 + (n.lane + 0.5) * L.laneW;
            api.addFloat(cx, L.hitY - 34, T('miss'), '255 80 110');
            refreshHud();
            haptic(50);
        }

        function releaseLane(lane) {
            laneDown[lane] = false;
            const t = api.songNow();
            const L = layout();
            for (const n of active) {
                if (!n.hold || n.lane !== lane || !n.holding || n.done || n.broken) continue;
                if (t >= n.t + n.dur - W_GOOD) completeHold(n, L);
                else breakHold(n, L);
                n.holding = false;
            }
        }

        function judge(lane) {
            const t = api.songNow();
            const L = layout();
            laneDown[lane] = true;
            laneFlash[lane] = 1;
            let best = -1, bestDt = Infinity;
            active.forEach((n, i) => {
                if (n.lane !== lane || n.hit || n.broken || n.done) return;
                const dt = Math.abs(n.t - t);
                if (dt < bestDt) { bestDt = dt; best = i; }
            });
            if (best === -1 || bestDt > W_OK) return;
            const n = active[best];
            n.hit = true;
            if (n.hold) n.holding = true;
            let pts, label, accent;
            if (bestDt <= W_PERFECT) { pts = 300; label = T('perfect'); accent = 1; nPerfect++; }
            else if (bestDt <= W_GOOD) { pts = 150; label = T('good'); accent = 2; nGood++; }
            else { pts = 50; label = T('good'); accent = 2; nOk++; }
            if (!n.hold) {
                combo++;
                maxCombo = Math.max(maxCombo, combo);
            }
            score += Math.round((n.hold ? pts * 0.55 : pts) * (1 + Math.min(combo, 40) * 0.08));
            const cx = L.x0 + (n.lane + 0.5) * L.laneW;
            api.burst(cx, L.hitY, { n: pts >= 300 ? 26 : 14, power: pts >= 300 ? 1.2 : 0.8, accent });
            api.addFloat(cx, L.hitY - 36, n.hold ? 'HOLD' : label, accent === 1 ? accentRgb(1) : accentRgb(2));
            refreshHud();
            haptic(10);
        }

        function finish() {
            const acc = accuracy();
            const grade = acc >= 95 ? 'S' : acc >= 88 ? 'A' : acc >= 75 ? 'B' : acc >= 60 ? 'C' : 'D';
            api.end({
                score,
                grade,
                stats: [
                    [T('perfect'), nPerfect],
                    [T('good'), nGood + nOk],
                    [T('miss'), nMiss],
                    [T('accuracy'), acc.toFixed(1) + '%'],
                    [T('maxCombo'), 'x' + maxCombo],
                ],
            });
        }

        function roundRect(ctx, x, y, w, h, r) {
            if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        return {
            frame(dt) {
                const ctx = api.ctx, W = api.W(), H = api.H();
                const t = api.songNow();
                const L = layout();
                const beat = api.beat();
                // accentRgb lee del DOM: lo cacheamos UNA vez por frame (antes ~40 lecturas)
                const a1 = accentRgb(1), a2 = accentRgb(2);
                // versiones ya separadas por comas: evita partir el string en cada nota
                const a1c = a1.split(/\s+/).join(','), a2c = a2.split(/\s+/).join(',');
                const inkLane = ink(0.02), inkBorder = ink(0.09);
                const fh = L.hitY - L.topY + 26;
                const noteH = Math.max(18, Math.min(L.laneW * 0.22, 26));
                ctx.clearRect(0, 0, W, H);

                while (idx < notes.length && notes[idx].t - t < LEAD + 0.2) {
                    const n = notes[idx];
                    if (n.t - t < -0.1) { idx++; continue; }
                    active.push({ t: n.t, lane: n.lane, hit: false, hold: !!n.hold, dur: n.dur || 0, holding: false, done: false, broken: false });
                    totalSpawned++;
                    idx++;
                }

                // carriles: relleno sólido (sin crear gradiente por frame). El flash
                // se pinta como capa sólida encima solo cuando hay flash.
                for (let l = 0; l < LANES; l++) {
                    const x = L.x0 + l * L.laneW;
                    ctx.fillStyle = inkLane;
                    ctx.fillRect(x + 2, L.topY, L.laneW - 4, fh);
                    if (laneFlash[l] > 0.002) {
                        ctx.fillStyle = `rgba(${l % 2 === 1 ? a2c : a1c},${laneFlash[l] * 0.16})`;
                        ctx.fillRect(x + 2, L.topY, L.laneW - 4, fh);
                        laneFlash[l] = Math.max(0, laneFlash[l] - dt * 5);
                    }
                    ctx.strokeStyle = inkBorder;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 2, L.topY, L.laneW - 4, fh);
                }

                ctx.fillStyle = `rgba(${a1c},${0.5 + beat * 0.5})`;
                ctx.fillRect(L.x0 - 8, L.hitY - 2, L.laneW * LANES + 16, 4);
                for (let l = 0; l < LANES; l++) {
                    const x = L.x0 + l * L.laneW;
                    roundRect(ctx, x + 6, L.hitY - noteH / 2, L.laneW - 12, noteH, 8);
                    ctx.strokeStyle = ink(0.25 + laneFlash[l] * 0.55);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    if (!isTouch) {
                        ctx.font = '700 12px Montserrat, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillStyle = ink(0.3 + laneFlash[l] * 0.5);
                        ctx.fillText(keyLabel(KEYS[l] || ''), x + L.laneW / 2, L.hitY + noteH / 2 + 22);
                    }
                }

                // PASO 1: recorrer activas, resolver fallos/splice y recoger las visibles.
                // Sin dibujar todavía: así separamos los halos (modo aditivo) de los cuerpos
                // y no alternamos globalCompositeOperation por nota (eso rompía el batching).
                vis.length = 0;
                for (let i = active.length - 1; i >= 0; i--) {
                    const n = active[i];
                    if (n.done || n.broken || (n.hit && !n.hold)) { active.splice(i, 1); continue; }
                    const dtN = n.t - t;
                    if (n.hold && n.hit && n.holding && t >= n.t + n.dur - W_GOOD && laneDown[n.lane]) {
                        completeHold(n, L);
                        active.splice(i, 1);
                        continue;
                    }
                    if (n.hold && n.hit && n.holding && !laneDown[n.lane] && t < n.t + n.dur - W_GOOD) {
                        breakHold(n, L);
                        active.splice(i, 1);
                        continue;
                    }
                    if ((!n.hold || !n.hit) && dtN < -W_OK) {
                        active.splice(i, 1);
                        nMiss++;
                        combo = 0;
                        const cx = L.x0 + (n.lane + 0.5) * L.laneW;
                        api.addFloat(cx, L.hitY - 26, T('miss'), '255 80 110');
                        refreshHud();
                        haptic(45);
                        continue;
                    }
                    const p = 1 - dtN / LEAD;
                    const endDt = n.hold ? n.t + n.dur - t : n.t - t;
                    const pEnd = 1 - endDt / LEAD;
                    if (p < -0.02 && pEnd < -0.02) continue;
                    n._y = L.topY + p * (L.hitY - L.topY);
                    n._tailY = n.hold ? L.topY + pEnd * (L.hitY - L.topY) : n._y;
                    if (n.hold && n.hit) n._y = L.hitY;
                    n._x = L.x0 + n.lane * L.laneW;
                    vis.push(n);
                }

                // PASO 2: todos los halos en un único bloque aditivo (un solo cambio de modo)
                glowBegin(ctx);
                const gAlpha = 0.4 + beat * 0.22;
                for (let i = 0; i < vis.length; i++) {
                    const n = vis[i];
                    const cy = n.hold ? (n._y + n._tailY) / 2 : n._y;
                    const gr = n.hold ? Math.max(noteH * 1.7, Math.abs(n._y - n._tailY) * 0.42) : noteH * 1.7;
                    glowAt(ctx, n._x + L.laneW / 2, cy, gr, n.lane % 2 === 1 ? 'a2' : 'a1', gAlpha);
                }
                glowEnd(ctx);

                // PASO 3: cuerpos sólidos + un único trazo blanco para todos
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = 'rgba(255,255,255,0.55)';
                for (let i = 0; i < vis.length; i++) {
                    const n = vis[i];
                    if (n.hold) {
                        const y1 = Math.min(n._y, n._tailY);
                        const y2 = Math.max(n._y, n._tailY);
                        const bodyX = n._x + 6;
                        const bodyW = L.laneW - 12;
                        roundRect(ctx, bodyX, y1, bodyW, Math.max(noteH, y2 - y1), 8);
                        ctx.fillStyle = `rgba(${n.lane % 2 === 1 ? a2c : a1c},${n.hit ? 0.52 : 0.30})`;
                        ctx.fill();
                    }
                    roundRect(ctx, n._x + 6, n._y - noteH / 2, L.laneW - 12, noteH, 8);
                    ctx.fillStyle = `rgba(${n.lane % 2 === 1 ? a2c : a1c},0.96)`;
                    ctx.fill();
                    ctx.stroke();
                }

                if (combo >= 5) {
                    ctx.font = `900 ${34 + beat * 8}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillStyle = `rgba(${a1c},${0.16 + beat * 0.2})`;
                    ctx.fillText('x' + combo, W / 2, (L.topY + L.hitY) / 2);
                }

                if (idx >= notes.length && active.length === 0 && totalSpawned > 0) finish();
            },
            onTap(x) {
                const L = layout();
                if (x < L.x0 - 30 || x > L.x0 + L.laneW * LANES + 30) return;
                const lane = clamp(Math.floor((x - L.x0) / L.laneW), 0, LANES - 1);
                judge(lane);
            },
            onRelease() {
                for (let l = 0; l < LANES; l++) {
                    if (laneDown[l]) releaseLane(l);
                }
            },
            onKey(ev, down) {
                const lane = KEYS.indexOf(ev.key.toLowerCase());
                if (lane === -1) return;
                if (down) judge(lane);
                else releaseLane(lane);
            },
            forceEnd() { if (totalSpawned > 0) finish(); else api.end({ score: 0, stats: [] }); },
            destroy() { active.length = 0; },
        };
    },
});
