import * as Runtime from '../runtime.js';
const {
    Arcade,
    T,
    accentRgb,
    blip,
    clamp,
    fmtN,
    glow,
    glowAt,
    glowBegin,
    glowEnd,
    haptic,
    ink,
    rgbStr,
} = Runtime;

/* ==========================================================================
   JUEGO 7 — BASS INVADERS (naves que bajan en los golpes; jefe en los drops)
   Disparo MANUAL: el jugador tiene que moverse, apuntar y disparar.
   Power-ups al matar naves. Boss con entrada dramática.
   ========================================================================== */
function findDrops(map) {
    const e = map.energy, hopT = map.hopT;
    if (!e || !e.length) return [];
    const n = e.length;
    const W = Math.max(1, Math.round(0.4 / hopT));
    const sm = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        let s = 0, c = 0;
        for (let j = Math.max(0, i - W); j <= Math.min(n - 1, i + W); j++) { s += e[j]; c++; }
        sm[i] = s / c;
    }
    const drops = [];
    let start = -1;
    for (let i = 0; i < n; i++) {
        if (sm[i] > 0.62) { if (start < 0) start = i; }
        else { if (start >= 0 && (i - start) * hopT >= 6) drops.push({ t0: start * hopT, t1: i * hopT }); start = -1; }
    }
    if (start >= 0 && (n - start) * hopT >= 6) drops.push({ t0: start * hopT, t1: n * hopT });
    return drops;
}

Arcade.register({
    id: 'bass',
    icon: 'fa-solid fa-shuttle-space',
    colors: ['99 102 241', '34 211 238'],
    createSession(api, run) {
        const isTouch = window.matchMedia('(pointer:coarse)').matches;
        const CFG = {
            easy:   { fall: 2.4, fireCd: 0.22, bossFire: 0.90, bossSpd: 85,  bossHpK: 2.2 },
            medium: { fall: 2.0, fireCd: 0.18, bossFire: 0.62, bossSpd: 115, bossHpK: 2.8 },
            hard:   { fall: 1.6, fireCd: 0.15, bossFire: 0.46, bossSpd: 150, bossHpK: 3.4 },
            expert: { fall: 1.3, fireCd: 0.12, bossFire: 0.35, bossSpd: 185, bossHpK: 4.0 },
        }[run.diff];

        const events = run.events;
        const drops = findDrops(run.map);
        const energyAt = run.map.energyAt || (() => 0);

        let bIdx = 0, dropIdx = 0;
        let score = 0, combo = 0, maxCombo = 0, lives = 3, invuln = 1.2;
        let kills = 0, spawned = 0, shake = 0, t = 0;
        let fireCd = 0; // cooldown de disparo
        let rapidUntil = 0, shield = 0; // power-ups activos

        const invaders = [];
        const visInv = [];
        const bullets = [];
        const foeShots = [];
        const powerups = []; // { x, y, vy, type }
        let boss = null; // { x, y, vx, hp, maxHp, fireT, t1, enterT }

        let px = api.W() / 2, py = api.H() - 46, targetX = px;
        const keyLeft = { on: false }, keyRight = { on: false };

        const stars = [];
        for (let i = 0; i < 64; i++) stars.push({
            x: Math.random() * 800, y: Math.random() * 600,
            r: 0.6 + Math.random() * 1.2, z: 0.3 + Math.random() * 0.7,
        });

        api.buildHud([
            { label: T('score'), id: 'biScore', value: '0' },
            { label: T('combo'), id: 'biCombo', value: '0', align: 'center' },
            { label: T('lives'), id: 'biLives', lives: 3, align: 'right' },
        ]);
        const elScore = document.getElementById('biScore');
        const elCombo = document.getElementById('biCombo');

        const topLine    = () => 58;
        const bottomLine = () => api.H() - 72;
        const bandColor  = (b) => b === 0 ? accentRgb(2) : b === 1 ? accentRgb(1) : '255 255 255';
        const bandRadius = (b) => b === 0 ? (isTouch ? 17 : 19) : b === 1 ? (isTouch ? 14 : 15) : (isTouch ? 11 : 12);

        function spawnInvader(e) {
            const r = bandRadius(e.band);
            const margin = r + 14;
            const x = margin + Math.random() * (api.W() - 2 * margin);
            const fall = CFG.fall * (e.band === 0 ? 1.15 : e.band === 2 ? 0.85 : 1);
            const vy = (bottomLine() - topLine()) / fall;
            const hp = (e.band === 0 && (run.diff === 'hard' || run.diff === 'expert')) ? 2 : 1;
            invaders.push({ x, y: topLine(), vy, r, hp, band: e.band, s: e.s });
            spawned++;
        }

        function startBoss(drop) {
            const dur = drop.t1 - drop.t0;
            boss = {
                x: api.W() / 2, y: topLine() - 80, // empieza fuera de pantalla
                vx: CFG.bossSpd, fireT: 1.2, t1: drop.t1,
                maxHp: Math.round(clamp(dur * CFG.bossHpK, 16, 120)),
                enterT: 0, // animación de entrada 0→1
            };
            boss.hp = boss.maxHp;
            api.addFloat(api.W() / 2, api.H() * 0.35, T('bossIncoming'), accentRgb(2));
            blip(55, 0.18, 0.5);
            haptic(80);
        }

        function loseLife(cx, cy) {
            if (shield > 0) {
                shield = 0;
                api.addFloat(cx, cy, '🛡 BLOCKED', accentRgb(1));
                api.burst(cx, cy, { n: 20, power: 1.0, accent: 1 });
                haptic(30);
                return;
            }
            if (invuln > 0) return;
            lives--; invuln = 1.4; shake = 0.32; combo = 0;
            elCombo.textContent = '0'; elCombo.classList.remove('combo-hot');
            api.setLives('biLives', lives, 3);
            api.burst(cx, cy, { n: 30, power: 1.3, accent: 2 });
            haptic(80);
            if (lives <= 0) finish();
        }

        function killInvader(inv, idx) {
            invaders.splice(idx, 1);
            kills++; combo++; maxCombo = Math.max(maxCombo, combo);
            score += Math.round(100 * (1 + Math.min(combo, 30) * 0.1));
            elScore.textContent = fmtN(score);
            elCombo.textContent = 'x' + combo;
            elCombo.classList.toggle('combo-hot', combo >= 8);
            api.burst(inv.x, inv.y, { n: 16, power: 0.9, accent: inv.band === 0 ? 2 : 1 });
            // power-up al matar: 18% probabilidad
            if (Math.random() < 0.18) {
                const type = Math.random() < 0.45 ? 'rapid' : Math.random() < 0.55 ? 'shield' : 'bomb';
                powerups.push({ x: inv.x, y: inv.y, vy: 90, type });
            }
        }

        function fire() {
            if (fireCd > 0) return;
            const cd = rapidUntil > (api.songNow ? api.songNow() : t) ? CFG.fireCd * 0.35 : CFG.fireCd;
            fireCd = cd;
            const count = (rapidUntil > (api.songNow ? api.songNow() : t)) ? 3 : 1;
            for (let k = 0; k < count; k++) {
                const dx = (k - (count - 1) / 2) * 12;
                bullets.push({ x: px + dx, y: py - 18 });
            }
            blip(880 + Math.random() * 80, 0.025, 0.04);
        }

        function finish() {
            const acc = spawned > 0 ? (kills / spawned) * 100 : 0;
            const grade = acc >= 90 ? 'S' : acc >= 75 ? 'A' : acc >= 55 ? 'B' : acc >= 35 ? 'C' : 'D';
            api.end({ score, grade, stats: [
                [T('hits'), `${kills} / ${spawned}`],
                [T('accuracy'), acc.toFixed(1) + '%'],
                [T('maxCombo'), 'x' + maxCombo],
            ] });
        }

        function drawShipBody(ctx, x, y, r, rgb, flip) {
            ctx.save(); ctx.translate(x, y);
            const s = flip ? -1 : 1;
            ctx.beginPath();
            ctx.moveTo(0, -r * s);
            ctx.lineTo(r * 0.85, r * 0.7 * s);
            ctx.lineTo(0, r * 0.35 * s);
            ctx.lineTo(-r * 0.85, r * 0.7 * s);
            ctx.closePath();
            ctx.fillStyle = rgbStr(rgb, 0.95); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.restore();
        }

        return {
            frame(dt) {
                t += dt;
                if (invuln > 0) invuln -= dt;
                if (shake > 0) shake -= dt;
                if (fireCd > 0) fireCd -= dt;
                const ctx = api.ctx, W = api.W(), H = api.H();
                const now = api.songNow();
                const beat = api.beat();
                const a1 = accentRgb(1), a2 = accentRgb(2);
                ctx.clearRect(0, 0, W, H);
                ctx.save();
                if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 22, (Math.random() - 0.5) * shake * 22);

                // starfield reactivo
                for (const st of stars) {
                    st.y += st.z * (40 + beat * 240) * dt;
                    if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
                    ctx.beginPath();
                    ctx.arc(st.x, st.y % H, st.r * (1 + beat * 0.5), 0, Math.PI * 2);
                    ctx.fillStyle = ink(0.10 + st.z * 0.16 + beat * 0.18);
                    ctx.fill();
                }

                // ¿drop? → jefe
                while (dropIdx < drops.length && now >= drops[dropIdx].t0) {
                    if (!boss && now < drops[dropIdx].t1) startBoss(drops[dropIdx]);
                    dropIdx++;
                }
                if (boss && now >= boss.t1) boss = null;

                // naves en los golpes reales
                while (bIdx < events.length && events[bIdx].t <= now) {
                    const e = events[bIdx++];
                    if (now - e.t > 0.25) continue;
                    if (invaders.length < 22) spawnInvader(e);
                }

                // jugador
                if (keyLeft.on) targetX -= 520 * dt;
                if (keyRight.on) targetX += 520 * dt;
                targetX = clamp(targetX, 24, W - 24);
                px += (targetX - px) * Math.min(1, dt * 14);
                py = H - 46;

                // balas del jugador
                for (let i = bullets.length - 1; i >= 0; i--) {
                    const b = bullets[i];
                    b.y -= 720 * dt;
                    if (b.y < -10) { bullets.splice(i, 1); continue; }
                    if (boss && boss.enterT >= 1 && Math.abs(b.x - boss.x) < 38 && Math.abs(b.y - boss.y) < 30) {
                        bullets.splice(i, 1); boss.hp--; score += 20;
                        api.burst(b.x, b.y, { n: 4, power: 0.5, accent: 1 });
                        if (boss.hp <= 0) {
                            api.burst(boss.x, boss.y, { n: 70, power: 2.0, accent: 2 });
                            score += 2500; api.addFloat(boss.x, boss.y, '+2500', accentRgb(1));
                            boss = null; shake = 0.5; haptic(150); blip(110, 0.2, 0.5);
                        }
                        continue;
                    }
                    let hit = -1;
                    for (let j = 0; j < invaders.length; j++) {
                        const dx = invaders[j].x - b.x, dy = invaders[j].y - b.y, rr = invaders[j].r + 4;
                        if (dx * dx + dy * dy < rr * rr) { hit = j; break; }
                    }
                    if (hit >= 0) {
                        bullets.splice(i, 1);
                        const inv = invaders[hit];
                        if (--inv.hp <= 0) killInvader(inv, hit);
                        else api.burst(b.x, b.y, { n: 4, power: 0.5, accent: 1 });
                    }
                }
                // dibujar balas en un único path
                if (bullets.length) {
                    ctx.beginPath();
                    for (const b of bullets) {
                        if (ctx.roundRect) ctx.roundRect(b.x - 1.6, b.y - 8, 3.2, 12, 1.6);
                        else ctx.rect(b.x - 1.6, b.y - 8, 3.2, 12);
                    }
                    ctx.fillStyle = rgbStr(a1, 0.95);
                    ctx.fill();
                }

                // power-ups
                for (let i = powerups.length - 1; i >= 0; i--) {
                    const pu = powerups[i];
                    pu.y += pu.vy * dt;
                    if (pu.y > H + 20) { powerups.splice(i, 1); continue; }
                    // colisión con jugador
                    const dx = pu.x - px, dy = pu.y - py;
                    if (dx * dx + dy * dy < 28 * 28) {
                        powerups.splice(i, 1);
                        if (pu.type === 'rapid') {
                            rapidUntil = now + 5;
                            api.addFloat(px, py - 30, '⚡ RAPID', '255 220 0');
                            haptic(20);
                        } else if (pu.type === 'shield') {
                            shield = 1;
                            api.addFloat(px, py - 30, '🛡 SHIELD', accentRgb(1));
                            haptic(20);
                        } else if (pu.type === 'bomb') {
                            const n = invaders.length;
                            for (let j = n - 1; j >= 0; j--) {
                                api.burst(invaders[j].x, invaders[j].y, { n: 8, power: 0.8, accent: 2 });
                                killInvader(invaders[j], j);
                            }
                            score += n * 80;
                            api.addFloat(W / 2, H / 2, '💥 BOMB', accentRgb(2));
                            shake = 0.4; haptic(80);
                        }
                        blip(660, 0.08, 0.1);
                        continue;
                    }
                    // dibujar power-up
                    const emoji = pu.type === 'rapid' ? '⚡' : pu.type === 'shield' ? '🛡' : '💥';
                    const pulse = 0.85 + Math.sin(t * 6) * 0.15;
                    glow(ctx, pu.x, pu.y, 22, pu.type === 'shield' ? 'a1' : 'a2', 0.5);
                    ctx.font = `${Math.round(20 * pulse)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(emoji, pu.x, pu.y);
                }

                // naves
                visInv.length = 0;
                for (let i = invaders.length - 1; i >= 0; i--) {
                    const inv = invaders[i];
                    inv.y += inv.vy * dt;
                    const dx = inv.x - px, dy = inv.y - py, rr = inv.r + 16;
                    if (dx * dx + dy * dy < rr * rr) { invaders.splice(i, 1); loseLife(inv.x, inv.y); continue; }
                    if (inv.y > bottomLine() + 8) { invaders.splice(i, 1); loseLife(inv.x, bottomLine()); continue; }
                    visInv.push(inv);
                }
                const shipGA = 0.45 + beat * 0.3;
                glowBegin(ctx);
                for (let i = 0; i < visInv.length; i++) {
                    const inv = visInv[i];
                    glowAt(ctx, inv.x, inv.y, inv.r * 1.9, inv.band === 0 ? 'a2' : inv.band === 1 ? 'a1' : 'w', shipGA);
                }
                glowEnd(ctx);
                for (let i = 0; i < visInv.length; i++) {
                    const inv = visInv[i];
                    const rgb = bandColor(inv.band);
                    drawShipBody(ctx, inv.x, inv.y, inv.r, rgb, true);
                    if (inv.hp > 1) {
                        ctx.beginPath(); ctx.arc(inv.x, inv.y, inv.r + 3, 0, Math.PI * 2);
                        ctx.strokeStyle = rgbStr(rgb, 0.5); ctx.lineWidth = 1.5; ctx.stroke();
                    }
                }

                // jefe con animación de entrada
                if (boss) {
                    boss.enterT = Math.min(1, boss.enterT + dt * 1.4);
                    const targetY = topLine() + 46;
                    boss.y = boss.enterT < 1
                        ? (topLine() - 80) + boss.enterT * (targetY - (topLine() - 80))
                        : targetY;
                    boss.x += boss.vx * dt;
                    if (boss.x < 60) { boss.x = 60; boss.vx = Math.abs(boss.vx); }
                    if (boss.x > W - 60) { boss.x = W - 60; boss.vx = -Math.abs(boss.vx); }

                    if (boss.enterT >= 1) {
                        const en = clamp(energyAt(now), 0, 1);
                        boss.fireT -= dt;
                        if (boss.fireT <= 0) {
                            boss.fireT = CFG.bossFire * (1.2 - en * 0.6);
                            const spread = run.diff === 'expert' ? 3 : run.diff === 'hard' ? 2 : 1;
                            for (let k = 0; k < spread; k++) {
                                const ang = Math.atan2(py - boss.y, px - boss.x) + (k - (spread - 1) / 2) * 0.26;
                                const sp = 230 + en * 160;
                                foeShots.push({ x: boss.x, y: boss.y + 24, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp });
                            }
                            blip(120, 0.05, 0.12);
                        }
                    }

                    const en = clamp(energyAt(now), 0, 1);
                    const R = (40 + en * 10 + beat * 6) * boss.enterT;
                    glow(ctx, boss.x, boss.y, R * 1.8, 'a2', (0.55 + en * 0.3) * boss.enterT);
                    ctx.save();
                    ctx.translate(boss.x, boss.y);
                    ctx.globalAlpha = boss.enterT;
                    ctx.beginPath();
                    for (let k = 0; k < 6; k++) {
                        const a = Math.PI / 6 + k * Math.PI / 3;
                        ctx[k ? 'lineTo' : 'moveTo'](Math.cos(a) * R, Math.sin(a) * R * 0.7);
                    }
                    ctx.closePath();
                    const g = ctx.createRadialGradient(0, -8, 4, 0, 0, R);
                    g.addColorStop(0, rgbStr(a1, 0.95));
                    g.addColorStop(1, rgbStr(a2, 0.9));
                    ctx.fillStyle = g; ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.globalAlpha = 1;
                    ctx.restore();

                    // barra HP del boss centrada y más visible
                    const bw = Math.min(W * 0.66, 340), bx = (W - bw) / 2, by = topLine() - 18;
                    ctx.fillStyle = ink(0.15); ctx.fillRect(bx - 1, by - 1, bw + 2, 8);
                    const hpPct = boss.hp / boss.maxHp;
                    const hpG = ctx.createLinearGradient(bx, 0, bx + bw, 0);
                    hpG.addColorStop(0, rgbStr(a2, 0.95));
                    hpG.addColorStop(1, rgbStr(a1, 0.95));
                    ctx.fillStyle = hpG; ctx.fillRect(bx, by, bw * hpPct, 6);
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
                    ctx.strokeRect(bx, by, bw, 6);
                }

                // proyectiles del jefe
                if (foeShots.length) {
                    const fr = 5 + beat * 1.5;
                    ctx.beginPath();
                    for (let i = foeShots.length - 1; i >= 0; i--) {
                        const f = foeShots[i];
                        f.x += f.vx * dt; f.y += f.vy * dt;
                        if (f.y > H + 12 || f.x < -12 || f.x > W + 12) { foeShots.splice(i, 1); continue; }
                        const dx = f.x - px, dy = f.y - py;
                        if (invuln <= 0 && dx * dx + dy * dy < 256) { foeShots.splice(i, 1); loseLife(px, py); continue; }
                        ctx.moveTo(f.x + fr, f.y); ctx.arc(f.x, f.y, fr, 0, Math.PI * 2);
                    }
                    ctx.fillStyle = rgbStr(a2, 0.95); ctx.fill();
                }

                // jugador
                const blink = invuln > 0 && Math.floor(t * 12) % 2 === 0;
                if (!blink) {
                    // halo de escudo activo
                    if (shield > 0) {
                        ctx.beginPath(); ctx.arc(px, py, 22 + beat * 3, 0, Math.PI * 2);
                        ctx.strokeStyle = rgbStr(a1, 0.6 + Math.sin(t * 8) * 0.2);
                        ctx.lineWidth = 2.5; ctx.stroke();
                    }
                    // indicador: brillo en la nave cuando puede disparar
                    const rdy = fireCd <= 0;
                    glow(ctx, px, py, 16 * 1.9, 'a1', rdy ? 0.55 + beat * 0.35 : 0.2);
                    drawShipBody(ctx, px, py, 16, a1, false);
                    ctx.beginPath();
                    ctx.moveTo(px - 5, py + 11);
                    ctx.lineTo(px, py + 18 + beat * 8 + Math.random() * 4);
                    ctx.lineTo(px + 5, py + 11);
                    ctx.closePath();
                    ctx.fillStyle = rgbStr(a2, 0.7); ctx.fill();
                }

                // hint de disparo (primeros 4s)
                if (t < 4) {
                    const alpha = clamp(1 - (t - 3) / 1, 0, 1);
                    const hint = isTouch ? 'TAP ARRIBA = DISPARAR' : T('fireHint') || 'SPACE / CLIC = DISPARAR';
                    ctx.font = `600 ${Math.round(Math.min(W, H) * 0.038)}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'alphabetic';
                    ctx.fillStyle = rgbStr(a1, 0.65 * alpha);
                    ctx.fillText(hint, W / 2, py - 38);
                }

                ctx.restore();
                score += dt * 4;
                elScore.textContent = fmtN(score);
            },
            onTap(x, y) {
                const H = api.H();
                // mitad superior = disparo, mitad inferior = mover
                if (isTouch && y !== undefined && y < H * 0.55) {
                    fire();
                } else {
                    targetX = x;
                    // en desktop (sin y o y en zona baja) solo mover
                }
                if (!isTouch) {
                    // clic de ratón: mover Y disparar
                    targetX = x;
                    fire();
                }
            },
            onMove(x) { targetX = x; },
            onKey(ev, down) {
                const k = ev.key.toLowerCase();
                if (k === 'arrowleft' || k === 'a') keyLeft.on = down;
                else if (k === 'arrowright' || k === 'd') keyRight.on = down;
                else if (down && (ev.key === ' ' || ev.code === 'Space')) fire();
            },
            forceEnd() { finish(); },
            destroy() { invaders.length = 0; bullets.length = 0; foeShots.length = 0; powerups.length = 0; boss = null; },
        };
    },
});
