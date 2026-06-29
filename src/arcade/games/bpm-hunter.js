import * as Runtime from '../runtime.js';
const {
    Arcade,
    T,
    accentRgb,
    blip,
    clamp,
    fmtN,
    haptic,
    rgbStr,
} = Runtime;

/* ==========================================================================
   JUEGO 6 — BPM HUNTER (3 rondas de tap-tempo; cada ronda añade dificultad)
   Ronda 1: feedback en vivo · Ronda 2: metrónomo · Ronda 3: sin ayudas
   ========================================================================== */
Arcade.register({
    id: 'tempo',
    icon: 'fa-solid fa-drum',
    colors: ['163 230 53', '0 200 255'],
    fmtBest: (v) => v + '%',
    createSession(api, run) {
        const targetBpm = run.map.bpm;

        // configuración por dificultad: taps por ronda, tolerancia (% por BPM de error)
        const CFG = {
            easy:   { tapsR: [8,  10, 12], prec: 2.0 },
            medium: { tapsR: [10, 14, 16], prec: 3.5 },
            hard:   { tapsR: [12, 16, 18], prec: 5.5 },
            expert: { tapsR: [14, 18, 20], prec: 8.0 },
        }[run.diff];

        // 3 rondas con configuraciones distintas:
        // ronda 0: feedback + BPM visible
        // ronda 1: metrónomo, sin texto de BPM en vivo
        // ronda 2: sin metrónomo, sin feedback, sin BPM objetivo
        const ROUND_CFG = [
            { live: true,  metro: true,  showTarget: true },
            { live: false, metro: true,  showTarget: true },
            { live: false, metro: false, showTarget: false },
        ];

        let round = 0;
        let roundScores = [];
        let tapTimes = [];
        let ended = false, phaseTimer = 0;
        let phase = 'playing'; // 'playing' | 'roundEnd' | 'done'
        let roundEndText = '';
        let t = 0;

        const MAX_TAPS = () => CFG.tapsR[round];

        // historial de BPM por tap para la gráfica
        const bpmHistory = []; // [{ round, bpm }]

        api.buildHud([
            { label: T('round') || 'Ronda', id: 'tmRound', value: '1/3' },
            { label: T('target') || 'Canción', id: 'tmTarget', value: '—', align: 'center' },
            { label: T('taps'), id: 'tmCount', value: '0 / ' + CFG.tapsR[0], align: 'right' },
        ]);
        const elRound  = document.getElementById('tmRound');
        const elTarget = document.getElementById('tmTarget');
        const elCount  = document.getElementById('tmCount');

        // el board DOM del jogo (metrónomo + botón grande)
        const board = document.createElement('div');
        board.className = 'bph-board';
        board.innerHTML = `
            <div id="bphFeed" class="bph-feed"></div>
            <button id="bphBtn" class="bph-btn" aria-label="${T('tempoHint') || 'Tap'}">
                <span id="bphYou" class="bph-bpm-you">—</span>
                <span class="bph-bpm-label">BPM</span>
            </button>
            <div id="bphHint" class="bph-hint">${T('tempoHint') || 'SPACE o botón'}</div>
        `;
        api.ctx.canvas.parentElement.appendChild(board);

        const elFeed = board.querySelector('#bphFeed');
        const elBtn  = board.querySelector('#bphBtn');
        const elYou  = board.querySelector('#bphYou');

        function updateHud() {
            elRound.textContent = (round + 1) + '/3';
            const rc = ROUND_CFG[round];
            elTarget.textContent = rc.showTarget ? Math.round(targetBpm) + ' BPM' : '???';
            elCount.textContent = Math.min(tapTimes.length, MAX_TAPS()) + ' / ' + MAX_TAPS();
        }

        const fold = (bpm) => {
            if (!bpm || !isFinite(bpm)) return null;
            while (bpm < 70)  bpm *= 2;
            while (bpm >= 180) bpm /= 2;
            return bpm;
        };

        function userBpm() {
            if (tapTimes.length < 4) return null;
            const recent = tapTimes.slice(-9);
            const iv = [];
            for (let i = 1; i < recent.length; i++) iv.push(recent[i] - recent[i - 1]);
            iv.sort((a, b) => a - b);
            return fold(60 / iv[Math.floor(iv.length / 2)]);
        }

        function matchScore(ub) {
            if (!ub) return null;
            const diff = Math.min(
                Math.abs(targetBpm - ub),
                Math.abs(targetBpm - ub * 2),
                Math.abs(targetBpm - ub / 2),
            );
            return Math.max(0, Math.round(100 - diff * CFG.prec));
        }

        function finishRound() {
            const ub  = userBpm();
            const m   = matchScore(ub) || 0;
            roundScores.push(m);

            const grade = m >= 95 ? '🎯 SPOT ON!' : m >= 80 ? '✓ CLOSE' : m >= 60 ? '~ OK' : '✗ MISSED';
            roundEndText = grade + '  ' + m + '%';

            if (round < 2) {
                round++;
                phase = 'roundEnd';
                phaseTimer = 1.8;
                tapTimes = [];
                bpmHistory.push({ round: round - 1, bpm: ub || 0, score: m });
                updateHud();
            } else {
                bpmHistory.push({ round: round, bpm: ub || 0, score: m });
                finish();
            }
        }

        function finish() {
            if (ended) return;
            ended = true;
            const avg = roundScores.length > 0
                ? Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length)
                : 0;
            const grade = avg >= 95 ? 'S' : avg >= 85 ? 'A' : avg >= 70 ? 'B' : avg >= 50 ? 'C' : 'D';
            api.end({
                score: avg,
                grade,
                fmtBest: (v) => v + '%',
                stats: roundScores.map((s, i) => [
                    (T('round') || 'Ronda') + ' ' + (i + 1),
                    s + '%',
                ]),
            });
        }

        function doTap() {
            if (ended || phase !== 'playing') return;
            const now = performance.now() / 1000;
            // reset si el intervalo es > 3s (pausa larga)
            if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 3) tapTimes = [];
            tapTimes.push(now);

            elBtn.style.transform = 'scale(0.91)';
            setTimeout(() => { elBtn.style.transform = ''; }, 90);
            blip(660 + Math.random() * 80, 0.06, 0.08);
            haptic(10);

            const ub = userBpm();
            const rc = ROUND_CFG[round];

            // actualiza BPM en tiempo real solo en ronda con live=true
            elYou.textContent = (rc.live && ub) ? Math.round(ub) : (tapTimes.length >= 4 ? '?' : '—');
            bpmHistory.push({ round, bpm: ub || 0 });

            const m = matchScore(ub);
            if (rc.live && m !== null) {
                if (m >= 92) elFeed.textContent = T('tempoSpot') || '¡Clavado!' ;
                else if (m >= 75) elFeed.textContent = T('tempoClose') || 'Muy cerca';
                else elFeed.textContent = T('tempoFar') || 'Sigue el pulso…';
            } else {
                elFeed.textContent = '';
            }

            updateHud();
            if (tapTimes.length >= MAX_TAPS() && matchScore(userBpm()) !== null) {
                setTimeout(finishRound, 350);
            }
        }

        elBtn.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); doTap(); });

        function drawMetronome(ctx, W, H, beat, now) {
            const swing = Math.sin(now * Math.PI * targetBpm / 30);
            const mx = W / 2, my = H * 0.18;
            const len = Math.min(W, H) * 0.28;
            const ang = swing * 0.5;
            // varilla
            ctx.save();
            ctx.translate(mx, my);
            ctx.rotate(ang);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, len);
            ctx.strokeStyle = rgbStr(accentRgb(1), 0.55 + beat * 0.4);
            ctx.lineWidth = 3; ctx.stroke();
            // cabeza del péndulo
            ctx.beginPath();
            ctx.arc(0, len, 10, 0, Math.PI * 2);
            ctx.fillStyle = rgbStr(accentRgb(2), 0.9);
            ctx.fill();
            ctx.restore();
        }

        function drawBpmGraph(ctx, W, H) {
            if (bpmHistory.length < 2) return;
            const last = bpmHistory.slice(-30);
            const gw = Math.min(W * 0.7, 280);
            const gh = 38;
            const gx = (W - gw) / 2;
            const gy = H * 0.63;
            const colors = ['163 230 53', '0 200 255', '255 120 200'];
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fillRect(gx, gy, gw, gh);
            // línea objetivo
            const bw = gw / last.length;
            for (let i = 0; i < last.length; i++) {
                const b = last[i].bpm;
                if (!b) continue;
                const diff = Math.abs(b - targetBpm) / Math.max(1, targetBpm);
                const h2 = Math.min(gh, Math.max(4, gh * (1 - diff * 3)));
                const rgb = colors[Math.min(2, last[i].round || 0)];
                ctx.fillStyle = rgbStr(rgb, 0.65);
                ctx.fillRect(gx + i * bw, gy + gh - h2, Math.max(1, bw - 1), h2);
            }
            // línea central (=target)
            ctx.beginPath();
            ctx.moveTo(gx, gy + gh / 2);
            ctx.lineTo(gx + gw, gy + gh / 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        return {
            frame(dt) {
                t += dt;
                const ctx = api.ctx, W = api.W(), H = api.H();
                const beat = api.beat();
                const now  = performance.now() / 1000;
                ctx.clearRect(0, 0, W, H);

                const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.55);
                g.addColorStop(0, rgbStr(accentRgb(1), 0.03 + beat * 0.09));
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

                // metrónomo visual si está activo esta ronda
                if (phase === 'playing' && ROUND_CFG[round].metro) {
                    drawMetronome(ctx, W, H, beat, now);
                }

                // gráfica de BPM histórico
                drawBpmGraph(ctx, W, H);

                // indicador de ronda (círculos)
                const r3x = W / 2, r3y = H * 0.87;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(r3x + (i - 1) * 18, r3y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = i <= round ? rgbStr(accentRgb(1), 0.9) : 'rgba(255,255,255,0.2)';
                    ctx.fill();
                }

                if (phase === 'roundEnd') {
                    phaseTimer -= dt;
                    // texto "Ronda X completada"
                    const a1 = accentRgb(1);
                    const prog = 1 - clamp(phaseTimer / 1.8, 0, 1);
                    ctx.globalAlpha = clamp(1 - (prog - 0.7) * 3, 0, 1);
                    ctx.font = `900 ${Math.round(Math.min(W, H) * 0.065)}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillStyle = rgbStr(a1, 1);
                    ctx.fillText(roundEndText, W / 2, H / 2 - 25);
                    ctx.font = `600 ${Math.round(Math.min(W, H) * 0.042)}px Montserrat, sans-serif`;
                    ctx.fillStyle = 'rgba(255,255,255,0.65)';
                    const nextMsg = round <= 2
                        ? ((T('round') || 'Ronda') + ' ' + (round + 1) + ' →')
                        : '';
                    ctx.fillText(nextMsg, W / 2, H / 2 + 20);
                    ctx.globalAlpha = 1;

                    if (phaseTimer <= 0) phase = 'playing';
                }
            },
            onKey(ev, down) {
                if (down && (ev.key === ' ' || ev.code === 'Space')) doTap();
            },
            forceEnd() { finish(); },
            destroy() { board.remove(); },
        };
    },
});
