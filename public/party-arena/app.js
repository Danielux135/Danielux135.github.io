const MODES = [
  { id: 'impostor', title: 'Impostor de Palabras', desc: 'Mínimo 3: pistas, debate y voto final', icon: 'fa-solid fa-mask' },
  { id: 'bug-race', title: 'Carrera de Bugs', desc: 'Encuentra el arreglo correcto', icon: 'fa-solid fa-bug' },
  { id: 'boss-coop', title: 'Boss Cooperativo', desc: 'Ataques sincronizados contra el jefe', icon: 'fa-solid fa-dragon' },
  { id: 'rhythm-royale', title: 'Rhythm Royale', desc: 'Acierta el beat de canciones reales', icon: 'fa-solid fa-music' },
  { id: 'mentira', title: 'Mentira Express', desc: 'Cuela una mentira convincente', icon: 'fa-solid fa-comment-dots' },
  { id: 'quiz', title: 'Quiz Relampago', desc: 'Respuesta rapida, puntos rapidos', icon: 'fa-solid fa-bolt' },
  { id: 'boton-prohibido', title: 'Boton Prohibido', desc: 'Riesgo, premio y caos controlado', icon: 'fa-solid fa-bomb' },
  { id: 'subasta', title: 'Subasta Relámpago', desc: 'Puja, analiza y caza chollos dev', icon: 'fa-solid fa-gavel' },
];

const MUSIC_TRACKS = [
  { title: 'Borrowed Colors', file: 'Borrowed Colors.mp3', bpm: 124 },
  { title: 'Honeyed Sidechain', file: 'Honeyed Sidechain.mp3', bpm: 118 },
  { title: 'Gorra y Diez', file: 'Gorra y Diez.mp3', bpm: 102 },
  { title: 'Violet Submerge', file: 'Violet Submerge.mp3', bpm: 112 },
  { title: 'Black Gear Protocol', file: 'Black Gear Protocol.mp3', bpm: 132 },
  { title: 'Concrete Heartbeat', file: 'Concrete Heartbeat.mp3', bpm: 126 },
  { title: 'Bailando en el Sur', file: 'Bailando en el Sur.mp3', bpm: 120 },
  { title: 'Boss Mode', file: 'Boss Mode.mp3', bpm: 140 },
  { title: 'We Accelerate', file: 'We Accelerate.mp3', bpm: 136 },
  { title: 'Nobody New (Deep House Remix)', file: 'Nobody New (Deep House Remix).mp3', bpm: 122 },
  { title: 'Dreamline', file: 'Dreamline.mp3', bpm: 116 },
  { title: 'Steel Nerves', file: 'Steel Nerves.mp3', bpm: 128 },
  { title: 'System Frenzy', file: 'System Frenzy.mp3', bpm: 145 },
  { title: 'Camí Tranquil', file: 'Camí Tranquil.mp3', bpm: 92 },
  { title: 'Black Velocity', file: 'Black Velocity.mp3', bpm: 150 },
  { title: 'Partitura de Silencios', file: 'Partitura de Silencios.mp3', bpm: 100 },
];

const WORD_ALIASES = {
  JavaScript: 'Codigo',
  TypeScript: 'Codigo con tipos',
  HTML: 'Pagina web',
  XML: 'Documento',
  Spotify: 'Musica',
  SoundCloud: 'Canciones',
  GitHub: 'Repositorio',
  GitLab: 'Repositorio alternativo',
  'Mario Kart': 'Karts',
  'Crash Team Racing': 'Carreras',
  Pizza: 'Pizza',
  Hamburguesa: 'Hamburguesa',
  Beat: 'Ritmo',
  'MelodÃ­a': 'Melodia',
  Melodía: 'Melodia',
  Servidor: 'Servidor',
  Hosting: 'Alojamiento web',
};

const app = document.getElementById('app');
const tplHome = document.getElementById('tpl-home');
const settingsDialog = document.getElementById('settingsDialog');
const apiUrlInput = document.getElementById('apiUrlInput');
const saveApiUrl = document.getElementById('saveApiUrl');
const DEFAULT_PARTY_API_URL = 'https://danielux-api-proxy.dlux135.workers.dev/api/party';

let state = null;
let pollId = null;
let rhythm = null;
let selectedMode = localStorage.getItem('party_selected_mode') || 'impostor';
let excludedModes = new Set(JSON.parse(localStorage.getItem('party_excluded_modes') || '[]'));
let autoFinishing = false;
let lastServerNowMs = Date.now();
let lastSyncAtMs = Date.now();
let auctionDraft = { bid: null, insurance: false, stance: 'Secreto', key: '' };
let timerUiId = null;

function normalizeApiUrl(value) {
  const url = String(value || '').trim();
  if (!url) return DEFAULT_PARTY_API_URL;
  if (/party\.php(?:\?|#|$)/i.test(url)) return DEFAULT_PARTY_API_URL;
  return url;
}

function defaultApiUrl() {
  const stored = normalizeApiUrl(localStorage.getItem('party_api_url'));
  if (stored !== localStorage.getItem('party_api_url')) {
    localStorage.setItem('party_api_url', stored);
  }
  return stored;
}

function session() {
  return {
    code: localStorage.getItem('party_room_code') || '',
    playerToken: localStorage.getItem('party_player_token') || '',
    hostToken: localStorage.getItem('party_host_token') || '',
  };
}

function saveSession(res) {
  if (res.room?.code) localStorage.setItem('party_room_code', res.room.code);
  if (res.playerToken) localStorage.setItem('party_player_token', res.playerToken);
  if (res.hostToken) localStorage.setItem('party_host_token', res.hostToken);
}

function clearSession() {
  stopPoll();
  stopTimerUi();
  stopRhythm();
  localStorage.removeItem('party_room_code');
  localStorage.removeItem('party_player_token');
  localStorage.removeItem('party_host_token');
  state = null;
}

async function api(action, payload = {}) {
  const s = session();
  const res = await fetch(defaultApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, code: s.code, playerToken: s.playerToken, hostToken: s.hostToken, ...payload }),
  });
  const json = await res.json().catch(() => ({ ok: false, error: 'Respuesta no JSON del servidor.' }));
  if (!json.ok) throw new Error(json.error || 'Error de API');
  if (json.serverNowMs) {
    lastServerNowMs = Number(json.serverNowMs);
    lastSyncAtMs = Date.now();
  }
  saveSession(json);
  state = json;
  return json;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function modeInfo(id) {
  return MODES.find((mode) => mode.id === id) || MODES[0];
}

function isHost() {
  return Boolean(state?.you?.isHost || state?.you?.is_host || session().hostToken);
}

function currentEndsAtMs() {
  const round = state?.round;
  if (!round) return 0;
  if (round.mode === 'boss-coop') {
    const s = round.state || {};
    const duration = Math.max(5000, Math.min(10000, Number(s.turnDurationMs || 8000)));
    const rawEnds = Number(s.turnEndsAtMs || round.endsAtMs || 0);
    const now = lastServerNowMs + (Date.now() - lastSyncAtMs);
    // Si llega un estado viejo con 40-60s, la UI no lo respeta: Boss son subturnos reales.
    if (rawEnds && rawEnds - now > duration + 1200) return now + duration;
    return rawEnds;
  }
  return Number(round.endsAtMs || 0);
}

function msLeft() {
  const ends = currentEndsAtMs();
  const now = lastServerNowMs + (Date.now() - lastSyncAtMs);
  return Math.max(0, ends - now);
}

function secondsLeft() {
  return Math.max(0, Math.ceil(msLeft() / 1000));
}

function roundExpired() {
  return state?.room?.status === 'playing' && secondsLeft() <= 0;
}

function sortedPlayers() {
  return [...(state?.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
}

function activeEditor() {
  const el = document.activeElement;
  return Boolean(el && (el.matches?.('input, textarea, select') || el.isContentEditable));
}

function displayWord(word) {
  return word || '???';
}

function lieDifficultyLabel(value) {
  const n = Number(value || 1);
  return n <= 1 ? 'Fácil' : n === 2 ? 'Media' : 'Difícil';
}

function lieOptionLabel(index) {
  return String.fromCharCode(65 + Number(index || 0));
}

function lieOptionById(id) {
  const options = state?.round?.state?.options || [];
  return options.find((option) => String(option.id) === String(id));
}

function liePlayerName(id) {
  return id ? playerNameById(id) : 'Sistema';
}


function lieMetaParts(s) {
  const category = s.category || 'Categoría oculta';
  const modifier = s.modifier || {};
  return [category, lieDifficultyLabel(s.difficulty), modifier.label || 'Ronda clásica'].filter(Boolean).map(escapeHtml).join(' · ');
}

function lieContextPanel(s, phase) {
  const context = s.context || 'Contexto: lee la pista, piensa en una respuesta realista y usa el formato de la categoría.';
  const tip = s.lieTip || 'Consejo: una buena mentira se parece a la respuesta real, pero tiene un pequeño detalle falso.';
  const modifier = s.modifier || {};
  const phaseText = phase === 'vote'
    ? 'Objetivo: encuentra la única carta verdadera. Las demás son mentiras de jugadores o del sistema.'
    : 'Objetivo: escribe una mentira creíble. Después todos votarán cuál carta parece verdadera.';
  const modifierText = modifier.desc ? `<span><strong>Regla:</strong> ${escapeHtml(modifier.desc)}</span>` : '';
  return `<div class="lie-context-panel">
    <span><strong>Contexto:</strong> ${escapeHtml(context)}</span>
    <span><strong>${phase === 'vote' ? 'Pista' : 'Consejo'}:</strong> ${escapeHtml(phase === 'vote' ? phaseText : tip)}</span>
    ${modifierText}
  </div>`;
}

function lieSubmittedPanel(s) {
  const fake = s.yourFakeAnswer || '';
  const double = s.yourDoubleBluff ? '<span class="lie-mini-badge danger">Doble farol activo</span>' : '';
  return `<div class="lie-submitted-panel">
    <strong>Mentira enviada</strong>
    <span>${escapeHtml(fake)}</span>
    ${double}
    <small>Esperando al resto. Si alguien no responde, el sistema añadirá una mentira automática para que la ronda no se rompa.</small>
  </div>${roundFeedbackHtml()}`;
}

function lieJokerPanel(s, voted, removed) {
  if (voted) return '';
  const removedCount = removed.size;
  if (removedCount > 0) {
    return `<div class="lie-joker-used"><strong>Comodín usado</strong><span>${removedCount} mentira${removedCount === 1 ? '' : 's'} descartada${removedCount === 1 ? '' : 's'}.</span></div>`;
  }
  if (!s.canUseFifty) return '';
  return `<button class="lie-joker-card" data-lie-joker="fifty" type="button">
    <span class="lie-joker-icon">✂</span>
    <strong>Comodín 50/50</strong>
    <small>Descarta una mentira incorrecta que no sea tuya. Úsalo antes de votar.</small>
  </button>`;
}

function playableModes() {
  const modes = MODES.filter((mode) => !excludedModes.has(mode.id));
  return modes.length ? modes : MODES;
}

function firstPlayableModeId() {
  return playableModes()[0]?.id || MODES[0].id;
}

function normalizeMode(mode) {
  const exists = MODES.some((item) => item.id === mode);
  if (!exists || excludedModes.has(mode)) return firstPlayableModeId();
  return mode;
}

function setSelectedMode(mode) {
  selectedMode = normalizeMode(mode);
  localStorage.setItem('party_selected_mode', selectedMode);
  return selectedMode;
}

function effectiveSelectedMode() {
  return setSelectedMode(selectedMode);
}

function effectiveLobbyMode() {
  const current = state?.room?.currentMode;
  if (current && !excludedModes.has(current)) return current;
  return effectiveSelectedMode();
}

function saveExcludedModes() {
  localStorage.setItem('party_excluded_modes', JSON.stringify([...excludedModes]));
}

function nextModeId() {
  const current = normalizeMode(state?.round?.mode || state?.room?.currentMode || selectedMode);
  const modes = playableModes();
  const index = modes.findIndex((mode) => mode.id === current);
  return modes[(index + 1 + modes.length) % modes.length].id;
}

function currentMusicTrack() {
  const selected = localStorage.getItem('party_music_track');
  const manual = MUSIC_TRACKS.find((track) => track.file === selected);
  if (manual) return manual;
  const seed = Number(state?.round?.roundIndex || state?.room?.roundNumber || 0);
  return MUSIC_TRACKS[Math.abs(seed) % MUSIC_TRACKS.length];
}

function avatarHtml(player) {
  const initial = escapeHtml((player?.name || '?').trim().slice(0, 1).toUpperCase() || '?');
  return `<span class="avatar ${escapeHtml(player?.avatar || 'bot-cyan')}" aria-hidden="true"><span class="avatar-letter">${initial}</span></span>`;
}

function bossAvatarHtml(player) {
  return avatarHtml(player);
}

function playersPanel() {
  const rows = (state?.players || []).map((p) => `
    <div class="player-row">
      ${avatarHtml(p)}
      <div>
        <div class="player-name">${escapeHtml(p.name)} ${p.is_host ? '<span class="host-badge">HOST</span>' : ''}</div>
        <div class="player-meta">${p.online ? 'Online' : 'Reconectando'} - ${p.score || 0} pts</div>
      </div>
      <span class="ready"><i class="fa-solid fa-check-circle"></i></span>
    </div>
  `).join('') || '<p>Aun no hay jugadores.</p>';

  return `<aside class="panel">
    <h2 class="panel-title"><i class="fa-solid fa-users"></i> Jugadores</h2>
    <div class="player-list">${rows}</div>
    <div class="big-actions">
      <button class="secondary-btn" data-leave-room><i class="fa-solid fa-door-open"></i> SALIR DE LA SALA</button>
      ${isHost() ? '<button class="secondary-btn" data-finish-round><i class="fa-solid fa-ban"></i> CANCELAR PARTIDA</button>' : ''}
    </div>
  </aside>`;
}

function rankingPanel() {
  const ranking = sortedPlayers().map((p, i) => `
    <div class="rank-row">
      <span class="rank-no">${i + 1}</span>
      <div><strong>${escapeHtml(p.name)}</strong><div class="player-meta">${p.online ? 'online' : 'offline'}</div></div>
      <span class="score">${p.score || 0}</span>
    </div>
  `).join('') || '<p>Sin ranking todavia.</p>';

  const chat = (state?.chat || []).slice(-10).map((m) => (
    `<div class="chat-msg"><strong>${escapeHtml(m.name || 'Jugador')}:</strong> ${escapeHtml(m.message)}</div>`
  )).join('');

  return `<aside class="panel">
    <h2 class="panel-title"><i class="fa-solid fa-trophy"></i> Ranking Global</h2>
    <div class="ranking-list">${ranking}</div>
    <div class="chat-box">
      <h2 class="panel-title"><i class="fa-solid fa-comments"></i> Chat</h2>
      <div class="chat-log">${chat || '<span class="player-meta">Sin mensajes.</span>'}</div>
      <form class="chat-form" data-chat>
        <input name="message" maxlength="180" placeholder="Mensaje rapido" autocomplete="off">
        <button class="icon-btn" aria-label="Enviar"><i class="fa-solid fa-paper-plane"></i></button>
      </form>
    </div>
  </aside>`;
}

function roomHeader() {
  return `<div class="room-code-box">
    <small>CODIGO DE SALA</small>
    <div class="room-code">${escapeHtml(state?.room?.code || '----')}</div>
    <p>Comparte este codigo <button class="icon-btn" data-copy-code title="Copiar"><i class="fa-regular fa-copy"></i></button></p>
  </div>`;
}

function modeCards() {
  effectiveSelectedMode();
  return `<div class="mode-carousel">${MODES.map((m) => `
    <article class="mode-card ${selectedMode === m.id ? 'active' : ''} ${excludedModes.has(m.id) ? 'is-excluded' : ''}" data-mode-card="${m.id}">
      <button type="button" data-mode="${m.id}"><i class="${m.icon}"></i><h3>${m.title}</h3><p>${m.desc}</p></button>
      <label class="mode-toggle"><input type="checkbox" data-exclude-mode="${m.id}" ${excludedModes.has(m.id) ? 'checked' : ''}> Excluir de rotacion</label>
    </article>
  `).join('')}</div>`;
}

function renderHome() {
  clearSession();
  app.innerHTML = `${tplHome.innerHTML}<p class="footer-note">Demo Daniel Bort Guzman - <a href="https://danielux135.github.io/">Portfolio</a></p>`;
  app.querySelectorAll('form[data-action]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    try {
      if (form.dataset.action === 'create') await api('createRoom', { name });
      else await api('joinRoom', { name, code: String(data.get('code') || '').trim().toUpperCase() });
      startPoll();
      render();
    } catch (err) {
      toast(err.message);
    }
  }));
  app.querySelector('[data-open-settings]')?.addEventListener('click', () => {
    apiUrlInput.value = defaultApiUrl();
    settingsDialog.showModal();
  });
}

function renderLobby() {
  const mode = modeInfo(effectiveLobbyMode());
  app.innerHTML = `<section class="layout">
    ${playersPanel()}
    <main class="game-shell">
      ${roomHeader()}
      <h1 class="screen-title">PARTY ARENA</h1>
      <p class="subtitle">SALA ONLINE - ${MODES.length} MINIJUEGOS</p>
      <h2 class="panel-title" style="justify-content:center">Ronda unica: ${escapeHtml(mode.title)} · Rotacion: ${playableModes().length}/${MODES.length}</h2>
      ${modeCards()}
      <div class="big-actions">
        ${isHost() ? '<button class="primary-btn" data-start-round><i class="fa-solid fa-play"></i> JUGAR SELECCIONADO</button><button class="secondary-btn" data-start-next><i class="fa-solid fa-shuffle"></i> SIGUIENTE MINIJUEGO</button><button class="secondary-btn" data-reset><i class="fa-solid fa-rotate"></i> REINICIAR PUNTOS</button>' : '<p>Esperando al host...</p>'}
      </div>
    </main>
    ${rankingPanel()}
  </section>`;
  bindCommon();
  app.querySelectorAll('[data-mode]').forEach((btn) => btn.addEventListener('click', async () => {
    const requestedMode = btn.dataset.mode;
    if (excludedModes.has(requestedMode)) {
      toast('Ese minijuego esta excluido de la rotacion. Desmarcalo antes de seleccionarlo.');
      return;
    }
    const mode = setSelectedMode(requestedMode);
    try {
      if (isHost()) await api('setMode', { mode });
    } catch (err) {
      toast(err.message);
    }
    render();
  }));
  app.querySelectorAll('[data-exclude-mode]').forEach((input) => input.addEventListener('change', async () => {
    if (input.checked) excludedModes.add(input.dataset.excludeMode);
    else excludedModes.delete(input.dataset.excludeMode);
    saveExcludedModes();
    const mode = setSelectedMode(selectedMode);
    try {
      if (isHost() && state?.room?.currentMode && excludedModes.has(state.room.currentMode)) {
        await api('setMode', { mode });
      }
    } catch (err) {
      toast(err.message);
    }
    render();
  }));
  app.querySelector('[data-start-round]')?.addEventListener('click', () => {
    const mode = setSelectedMode(selectedMode);
    hostAction('startRound', { mode });
  });
  app.querySelector('[data-start-next]')?.addEventListener('click', () => {
    const mode = setSelectedMode(nextModeId());
    hostAction('startRound', { mode });
  });
  app.querySelector('[data-reset]')?.addEventListener('click', () => hostAction('resetRoom'));
}

function renderGame() {
  const mode = state?.round?.mode || state?.room?.currentMode || selectedMode;
  if (mode !== 'rhythm-royale') stopRhythm();
  const views = {
    impostor: renderImpostor,
    'bug-race': renderBugRace,
    'boss-coop': renderBoss,
    'rhythm-royale': renderRhythm,
    mentira: renderMentira,
    quiz: renderQuiz,
    'boton-prohibido': renderForbiddenButton,
    subasta: renderAuction,
  };
  app.innerHTML = `<section class="layout">${playersPanel()}<main class="game-shell">${(views[mode] || renderUnsupported)()}</main>${rankingPanel()}</section>`;
  bindCommon();
  bindGameActions();
}

function renderResults() {
  const mode = modeInfo(state?.round?.mode || state?.room?.currentMode || selectedMode);
  const next = modeInfo(nextModeId());
  const resultMode = String(state?.round?.mode || '').replace(/[^a-z0-9-]/gi, '');
  app.innerHTML = `<section class="layout">${playersPanel()}<main class="results-card glass-card results-mode-${resultMode}">
    <h1 class="game-title">RESULTADOS</h1>
    <p class="subtitle results-hold-subtitle">${escapeHtml(mode.title)} · Pausado hasta que el host elija</p>
    <div class="host-hold-note"><strong>Fin de ronda.</strong><span>Nada continúa solo: el host decide si repetir este minijuego o pasar a ${escapeHtml(next.title)}.</span></div>
    ${roundReviewHtml()}
    ${['impostor', 'mentira', 'quiz', 'subasta', 'boton-prohibido', 'bug-race'].includes(state?.round?.mode) ? '' : roundFeedbackHtml()}
    ${['impostor', 'quiz', 'subasta', 'boton-prohibido'].includes(state?.round?.mode) ? '' : `<div class="ranking-list">${sortedPlayers().map((p, i) => `<div class="rank-row"><span class="rank-no">${i + 1}</span><strong>${escapeHtml(p.name)}</strong><span class="score">${p.score || 0}</span></div>`).join('')}</div>`}
    <div class="big-actions">${isHost() ? '<button class="primary-btn" data-repeat-round><i class="fa-solid fa-repeat"></i> REPETIR MINIJUEGO</button><button class="secondary-btn" data-next-round><i class="fa-solid fa-forward"></i> SIGUIENTE MINIJUEGO</button><button class="secondary-btn" data-back-lobby><i class="fa-solid fa-house"></i> VOLVER AL LOBBY</button>' : '<p>Esperando al host...</p>'}</div>
  </main>${rankingPanel()}</section>`;
  bindCommon();
  app.querySelector('[data-back-lobby]')?.addEventListener('click', () => hostAction('backToLobby'));
  app.querySelector('[data-repeat-round]')?.addEventListener('click', () => {
    const mode = setSelectedMode(state?.round?.mode || selectedMode);
    hostAction('startRound', { mode });
  });
  app.querySelector('[data-next-round]')?.addEventListener('click', () => {
    const mode = setSelectedMode(nextModeId());
    hostAction('startRound', { mode });
  });
}

function clueObj(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') return { text: raw, style: 'neutra', heat: 0, flags: [] };
  return raw;
}

function clueText(raw) {
  const c = clueObj(raw);
  return c?.text || '';
}

function clueStyleLabel(style) {
  return ({ tecnica: 'Técnica', visual: 'Visual', uso: 'Uso real', abstracta: 'Abstracta', riesgo: 'Riesgo', neutra: 'Neutra' }[style] || 'Neutra');
}

function suspicionTone(heat) {
  const value = Number(heat || 0);
  if (value >= 6) return 'alta';
  if (value >= 3) return 'media';
  return 'baja';
}

function impostorClueCard(player, reveal = false) {
  const s = state.round?.state || {};
  const raw = s.clues?.[player.id];
  const c = clueObj(raw);
  const role = s.playerRoles?.[player.id];
  const isImp = role === 'impostor' || Number(s.impostor_id || 0) === Number(player.id);
  const voteCount = Number(s.voteCounts?.[player.id] || 0);
  const heat = Number(c?.heat || 0);
  const flags = (c?.flags || []).slice(0, 2).map((flag) => `<span class="mini-flag">${escapeHtml(flag)}</span>`).join('');
  return `<article class="suspect-row ${isImp && reveal ? 'is-impostor' : ''}">
    <div class="suspect-main">${avatarHtml(player)}<div><strong>${escapeHtml(player.name)}</strong><p>“${escapeHtml(c?.text || 'Sin pista')}”</p></div></div>
    <div class="suspect-side"><span class="heat-chip ${suspicionTone(heat)}">${heat}/9 sospecha</span>${reveal ? `<span class="vote-chip">${voteCount} voto${voteCount === 1 ? '' : 's'}</span>` : ''}${isImp && reveal ? '<span class="answer-tag correct">Impostor</span>' : reveal ? '<span class="answer-tag">Civil</span>' : ''}</div>
    ${flags ? `<div class="flag-row compact">${flags}</div>` : ''}
  </article>`;
}

function impostorProgressHtml() {
  const s = state.round?.state || {};
  const total = (state.players || []).length;
  const clues = Object.keys(s.clues || {}).length;
  const votes = Object.keys(s.votes || {}).length;
  const phase = state.round?.phase;
  const current = phase === 'vote' ? votes : clues;
  const label = phase === 'vote' ? 'votos' : 'pistas';
  const pct = total ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return `<div class="impostor-progress"><div><strong>${current}/${total}</strong><span>${label} enviados</span></div><i style="width:${pct}%"></i></div>`;
}

function renderImpostor() {
  const s = state.round?.state || {};
  const pid = playerIdKey();
  const yourClue = clueObj(s.clues?.[pid]);
  const voted = String(s.votes?.[pid] ?? '');
  const theme = s.theme || 'Palabras web';
  const isImp = Boolean(s.youAreImpostor);
  const roleTitle = isImp ? 'ERES EL IMPOSTOR' : 'ERES CIVIL';
  const roleIcon = isImp ? 'fa-solid fa-mask' : 'fa-solid fa-user-shield';
  const objective = isImp
    ? 'Tu palabra es parecida, pero no es la de los demás. Da una pista creíble y evita que te voten.'
    : 'Todos los civiles tenéis la misma palabra. Da una pista que ayude a reconoceros sin decirla directamente.';
  const orderedPlayers = (s.turnOrder || []).map((id) => (state.players || []).find((p) => Number(p.id) === Number(id))).filter(Boolean);
  const players = orderedPlayers.length ? orderedPlayers : (state.players || []);

  if (state.round?.phase === 'vote') {
    return `<h1 class="game-title compact-title">IMPOSTOR DE PALABRAS</h1><p class="subtitle compact-subtitle">DEBATE Y VOTA · <span class="timer">${secondsLeft()}s</span></p>
    <div class="glass-card game-card impostor-board compact-board">
      <div class="impostor-topline"><span class="case-tag">${escapeHtml(theme)}</span><strong>Uno no tiene la misma palabra. Mira las pistas raras.</strong>${impostorProgressHtml()}</div>
      <div class="suspect-list">${players.map((p) => impostorClueCard(p)).join('')}</div>
      ${isImp ? `<div class="impostor-guess-row"><label>Bonus impostor</label><input data-word-guess maxlength="40" placeholder="Adivina la palabra civil" autocomplete="off" value="${escapeHtml(s.wordGuesses?.[pid] || '')}" ${voted ? 'disabled' : ''}></div>` : ''}
      <div class="vote-panel"><h3>Vota al impostor</h3><div class="vote-grid">${(state.players || []).map((p) => {
        const id = String(p.id);
        const selected = voted === id;
        const self = id === pid;
        return `<button class="answer-btn vote-btn ${selected ? 'is-selected' : ''}" data-vote="${p.id}" ${(voted || self) ? 'disabled aria-disabled="true"' : ''}>${avatarHtml(p)} <span class="answer-copy">${escapeHtml(p.name)}</span>${self ? '<span class="answer-tag">Tú</span>' : ''}${selected ? '<span class="answer-tag choice">Tu voto</span>' : ''}</button>`;
      }).join('')}</div></div>
      ${roundFeedbackHtml()}
    </div>`;
  }

  return `<h1 class="game-title compact-title">IMPOSTOR DE PALABRAS</h1><p class="subtitle compact-subtitle">PALABRA SECRETA · <span class="timer">${secondsLeft()}s</span></p>
  <div class="glass-card game-card impostor-board compact-board">
    <div class="role-card compact ${isImp ? 'impostor' : 'civil'}">
      <div class="role-icon"><i class="${roleIcon}"></i></div>
      <div><span class="case-tag">${escapeHtml(theme)}</span><h2>${roleTitle}</h2><p>${escapeHtml(objective)}</p></div>
      ${impostorProgressHtml()}
    </div>
    <div class="secret-panel compact">
      <span>${isImp ? 'Tu palabra trampa' : 'Tu palabra civil'}</span>
      <strong>${escapeHtml(displayWord(s.yourWord))}</strong>
      <small>Mínimo 3 jugadores. 1 impostor, todos los demás civiles. Escribe una pista corta.</small>
    </div>
    <div class="impostor-rules"><span>1 pista por jugador</span><span>No digas la palabra literal</span><span>Después todos votan</span></div>
    ${yourClue ? roundFeedbackHtml() : `<form data-clue class="clue-form compact">
      <input name="clue" maxlength="52" placeholder="Tu pista: ejemplo, uso, sensación o contexto" autocomplete="off" required>
      <button class="primary-btn"><i class="fa-solid fa-paper-plane"></i> ENVIAR</button>
    </form>`}
  </div>`;
}
function answerTags(selected, correct, i, submitted = true) {
  if (!submitted) return '';
  const tags = [];
  if (selected === i) tags.push('<span class="answer-tag choice">Tu eleccion</span>');
  if (correct === i) tags.push('<span class="answer-tag correct">Correcta</span>');
  return tags.join('');
}

function answerButtons(options, attr = 'data-answer', result = null) {
  const submitted = Boolean(result);
  const selected = Number(result?.answer ?? -999);
  const correct = Number(result?.correctIndex ?? -999);
  const disabled = submitted ? ' disabled aria-disabled="true"' : '';
  return `<div class="answers">${(options || []).map((op, i) => {
    const classes = ['answer-btn'];
    if (submitted && selected === i) classes.push('is-selected');
    if (submitted && correct === i) classes.push('is-correct');
    if (submitted && selected === i && correct !== i) classes.push('is-wrong');
    return `<button class="${classes.join(' ')}" ${attr}="${i}"${disabled}><b>${'ABCD'[i] || i + 1}</b><span class="answer-copy">${escapeHtml(op)}</span>${answerTags(selected, correct, i, submitted)}</button>`;
  }).join('')}</div>`;
}

function reviewAnswerButtons(options, result = null) {
  const selected = Number(result?.answer ?? -999);
  const correct = Number(result?.correctIndex ?? -999);
  const submitted = selected >= 0;
  return `<div class="answers answers-review">${(options || []).map((op, i) => {
    const classes = ['answer-btn'];
    if (submitted && selected === i) classes.push('is-selected');
    if (correct === i) classes.push('is-correct');
    if (submitted && selected === i && correct !== i) classes.push('is-wrong');
    return `<button class="${classes.join(' ')}" disabled aria-disabled="true"><b>${'ABCD'[i] || i + 1}</b><span class="answer-copy">${escapeHtml(op)}</span>${answerTags(selected, correct, i, submitted || correct === i)}</button>`;
  }).join('')}</div>`;
}

function playerIdKey() {
  return String(state?.you?.id ?? '');
}

function optionLabel(index) {
  return 'ABCD'[Number(index)] || String(Number(index) + 1);
}

function optionText(options, index) {
  const value = (options || [])[Number(index)];
  return value == null ? 'respuesta desconocida' : String(value);
}

function playerNameById(id) {
  const player = (state?.players || []).find((p) => Number(p.id) === Number(id));
  return player?.name || 'Jugador';
}

function signedPoints(points) {
  const value = Number(points || 0);
  return `${value >= 0 ? '+' : ''}${value} pts`;
}

function feedbackPanel(feedback) {
  if (!feedback) return '';
  const tone = feedback.tone || 'info';
  const icon = feedback.icon || (tone === 'good' ? 'fa-solid fa-circle-check' : tone === 'bad' ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-info');
  const details = (feedback.details || []).filter(Boolean).map((line) => `<li>${escapeHtml(line)}</li>`).join('');
  return `<div class="feedback-card ${escapeHtml(tone)}" role="status" aria-live="polite">
    <div class="feedback-icon"><i class="${escapeHtml(icon)}"></i></div>
    <div>
      <strong>${escapeHtml(feedback.title || 'Accion registrada')}</strong>
      ${feedback.message ? `<p>${escapeHtml(feedback.message)}</p>` : ''}
      ${details ? `<ul>${details}</ul>` : ''}
    </div>
  </div>`;
}

function roundFeedback() {
  const round = state?.round;
  const s = round?.state || {};
  const pid = playerIdKey();
  if (!round || !pid) return null;

  if (round.mode === 'bug-race') {
    const answer = s.answers?.[pid];
    const challenge = s.challenge || {};
    if (!answer) return null;
    const correctIndex = Number(challenge.correct ?? -1);
    const selectedIndex = Number(answer.answer ?? -1);
    const isCorrect = Boolean(answer.correct);
    return {
      tone: isCorrect ? 'good' : 'bad',
      icon: isCorrect ? 'fa-solid fa-check' : 'fa-solid fa-xmark',
      title: isCorrect ? '¡Correcto!' : 'Has fallado',
      message: isCorrect ? `Has ganado ${signedPoints(answer.points)}.` : `La correcta era ${optionLabel(correctIndex)}: ${optionText(challenge.options, correctIndex)}.`,
      details: isCorrect ? [`Elegiste ${optionLabel(selectedIndex)}: ${optionText(challenge.options, selectedIndex)}`] : [`Tu respuesta: ${optionLabel(selectedIndex)}: ${optionText(challenge.options, selectedIndex)}`, 'No sumas puntos en esta ronda.'],
    };
  }

  if (round.mode === 'quiz') {
    const answer = quizMyAnswer();
    const challenge = quizQuestion();
    if (!answer) return null;
    const selectedIndex = Number(answer.answer ?? -1);
    if (answer.correct === undefined && round.phase === 'answer') {
      return {
        tone: 'info',
        icon: 'fa-solid fa-bolt',
        title: 'Respuesta bloqueada',
        message: `Has elegido ${optionLabel(selectedIndex)}. La solución se revela al acabar el tiempo o responder todos.`,
        details: ['Cuanto antes aciertes, más bonus de velocidad.'],
      };
    }
    const correctIndex = Number(challenge.correct ?? -1);
    const isCorrect = Boolean(answer.correct);
    return {
      tone: isCorrect ? 'good' : 'bad',
      icon: isCorrect ? 'fa-solid fa-bolt' : 'fa-solid fa-xmark',
      title: isCorrect ? '¡Correcto relámpago!' : (answer.timeout ? 'Tiempo agotado' : 'Has fallado'),
      message: isCorrect ? `Has ganado ${signedPoints(answer.points)}.` : `La correcta era ${optionLabel(correctIndex)}: ${optionText(challenge.options, correctIndex)}.`,
      details: [challenge.explanation || '', isCorrect ? `Velocidad +${Number(answer.speedBonus || 0)} · Racha +${Number(answer.streakBonus || 0)} · Caliente +${Number(answer.hotBonus || 0)}` : 'Racha rota.'].filter(Boolean),
    };
  }

  if (round.mode === 'subasta') {
    const idx = String(Number(s.current || 0));
    const bid = s.yourBid || s.bids?.[idx]?.[playerIdKey()];
    if (round.phase === 'bid') {
      if (!bid && !s.revealedExtra) return null;
      return {
        tone: 'info',
        icon: 'fa-solid fa-gavel',
        title: bid ? 'Puja registrada' : 'Análisis comprado',
        message: bid ? `Has pujado ${Number(bid.bid || 0)} créditos${bid.insurance ? ' con seguro' : ''}.` : 'Has revelado una pista extra.',
        details: [s.revealedExtra || '', bid?.stance ? `Postura pública: ${bid.stance}` : 'Puedes cambiar la puja hasta que cierre el mercado.'].filter(Boolean),
      };
    }
    const result = s.lastResult || s.history?.[idx];
    if (!result) return null;
    const won = String(result.winner || '') === playerIdKey();
    const row = (result.rows || []).find((r) => String(r.playerId) === playerIdKey());
    return {
      tone: won ? (Number(result.net || 0) >= 0 ? 'good' : 'bad') : 'info',
      icon: won ? 'fa-solid fa-sack-dollar' : 'fa-solid fa-eye',
      title: won ? `${result.label || 'Lote resuelto'}` : 'No te llevaste el lote',
      message: won ? `${Number(result.net || 0) >= 0 ? '+' : ''}${Number(result.net || 0)} créditos netos.` : `${result.winnerName || 'Otro jugador'} ganó por ${Number(result.winnerBid || 0)} créditos.`,
      details: [row ? `Tu puja: ${Number(row.bid || 0)} créditos` : '', `Valor real: ${Number(result.value || 0)} créditos`, result.explanation || ''].filter(Boolean),
    };
  }

  if (round.mode === 'boton-prohibido') {
    const outcome = s.outcomes?.[pid];
    if (!outcome) return null;
    const points = Number(outcome.points || 0);
    return {
      tone: points > 0 ? 'good' : points < 0 ? 'bad' : 'info',
      icon: points > 0 ? 'fa-solid fa-gift' : points < 0 ? 'fa-solid fa-bomb' : 'fa-solid fa-dice',
      title: outcome.title || 'Resultado del boton',
      message: outcome.text || outcome.effect || 'Accion registrada.',
      details: [`Boton elegido: ${outcome.label || `Boton ${Number(outcome.button || 0) + 1}`}`, `Resultado: ${signedPoints(points)}`],
    };
  }

  if (round.mode === 'boss-coop') {
    return null;
  }

  if (round.mode === 'rhythm-royale') {
    const sub = s.submissions?.[pid];
    if (!sub) return null;
    return {
      tone: Number(sub.accuracy || 0) >= 70 ? 'good' : 'info',
      icon: 'fa-solid fa-music',
      title: 'Puntuacion enviada',
      message: `Has sumado ${signedPoints(sub.points)}.`,
      details: [`Score: ${Number(sub.score || 0)}`, `Precision: ${Math.round(Number(sub.accuracy || 0))}%`, `Combo maximo: ${Number(sub.combo || 0)}`],
    };
  }

  if (round.mode === 'impostor') {
    if (round.phase === 'clue') {
      const clue = clueObj(s.clues?.[pid]);
      if (!clue) return null;
      const flags = clue.flags?.length ? clue.flags.join(', ') : 'sin alertas graves';
      return {
        tone: Number(clue.heat || 0) >= 6 ? 'bad' : 'info',
        icon: 'fa-solid fa-paper-plane',
        title: 'Pista enviada',
        message: `Sospecha generada: ${Number(clue.heat || 0)}/9.`,
        details: [`Tu pista: ${clue.text}`, `Lectura del sistema: ${flags}`],
      };
    }
    if (round.phase === 'vote') {
      const vote = s.votes?.[pid];
      if (!vote) return null;
      const guess = s.wordGuesses?.[pid];
      return {
        tone: 'info',
        icon: 'fa-solid fa-check-to-slot',
        title: 'Voto registrado',
        message: `Has votado a ${playerNameById(vote)}.`,
        details: [guess ? `Tu intento de palabra civil: ${guess}` : '', 'Cuando voten todos se revelará el impostor.'],
      };
    }
    if (round.phase === 'results') {
      const impostorId = Number(s.impostor_id || 0);
      const vote = s.votes?.[pid];
      const youAreImpostor = impostorId === Number(pid);
      const won = (youAreImpostor && s.winner === 'impostor') || (!youAreImpostor && s.winner === 'crew');
      const points = Number(s.pointsAwarded?.[pid] || 0);
      return {
        tone: won ? 'good' : 'bad',
        icon: youAreImpostor ? 'fa-solid fa-mask' : 'fa-solid fa-user-shield',
        title: won ? 'Has ganado la ronda' : 'Has perdido la ronda',
        message: s.winner === 'crew' ? `La mesa cazó a ${playerNameById(impostorId)}.` : `${playerNameById(impostorId)} escapó de la votación.`,
        details: [vote ? `Tu voto: ${playerNameById(vote)}` : 'No votaste.', `Palabra civil: ${displayWord(s.normalWord)}`, `Palabra trampa: ${displayWord(s.impostorWord)}`, `Puntos de esta ronda: ${signedPoints(points)}`],
      };
    }
  }

  if (round.mode === 'mentira') {
    if (round.phase === 'write') {
      const fake = s.yourFakeAnswer;
      if (!fake) return null;
      const double = Boolean(s.yourDoubleBluff);
      return {
        tone: 'info',
        icon: 'fa-solid fa-comment-dots',
        title: 'Mentira enviada',
        message: double ? 'Doble farol activado: engañar vale más, fallar penaliza.' : 'Tu respuesta falsa ya está guardada.',
        details: [`Tu mentira: ${fake}`, 'Ahora toca descubrir cuál carta es la verdadera.'],
      };
    }
    if (round.phase === 'vote') {
      const vote = s.votes?.[pid];
      if (!vote) return null;
      const option = lieOptionById(vote);
      return {
        tone: 'info',
        icon: 'fa-solid fa-check-to-slot',
        title: 'Voto registrado',
        message: option ? `Has elegido: ${option.text}` : 'Has votado una opción.',
        details: ['La verdad se revelará cuando voten todos o acabe el tiempo.'],
      };
    }
    if (round.phase === 'results') {
      const points = Number(s.pointsAwarded?.[pid] || 0);
      const fooled = (s.fooledBy?.[pid] || []).length;
      const vote = s.votes?.[pid];
      const votedReal = vote === 'real';
      const lines = (s.scoreBreakdown?.[pid] || []).slice(0, 3);
      return {
        tone: points > 0 ? 'good' : points < 0 ? 'bad' : 'info',
        icon: 'fa-solid fa-comment-dots',
        title: votedReal ? 'Detectaste la verdad' : fooled > 0 ? 'Tu mentira funcionó' : 'Ronda revelada',
        message: `Resultado personal: ${signedPoints(points)}.`,
        details: [`Verdad: ${s.realAnswer || '???'}`, `Jugadores engañados: ${fooled}`, ...lines],
      };
    }
  }

  return null;
}

function roundFeedbackHtml() {
  return feedbackPanel(roundFeedback());
}

function bossCurrentChoices() {
  const s = state.round?.state || {};
  const turnKey = String(s.turn || 1);
  return s.choices?.[turnKey] || {};
}

function bossOnlinePlayers() {
  const players = state?.players || [];
  const online = players.filter((p) => p.online);
  return online.length ? online : players;
}

function bossAllOnlineChoseLocal() {
  if (state?.round?.mode !== 'boss-coop') return false;
  const choices = bossCurrentChoices();
  const required = bossOnlinePlayers();
  return required.length > 0 && required.every((p) => choices[String(p.id)]);
}

function bossMoveMeta(move) {
  const solo = bossOnlinePlayers().length <= 1;
  const map = {
    attack: { label: 'Atacar', icon: '⚔', tone: 'attack', desc: solo ? 'Daño alto de héroe · interrumpe cargas' : 'Daño estable · consume cargas · interrumpe' },
    protect: { label: 'Proteger', icon: '🛡', tone: 'protect', desc: solo ? 'Escudo enorme · turno de aguante' : 'Escudo grande · intercepta · revive caídos' },
    boost: { label: 'Boost', icon: '⚡', tone: 'boost', desc: solo ? 'Carga burst sin vulnerabilidad extra' : 'Carga burst · activa sinergias · te expone' },
    miss: { label: 'Sin acción', icon: '⏳', tone: 'miss', desc: 'El boss castiga no elegir' },
  };
  return map[move] || map.miss;
}

function bossIconClass(boss = {}) {
  if (boss.faIcon) return boss.faIcon;
  const name = String(boss.name || '').toLowerCase();
  if (name.includes('bug') || name.includes('error')) return 'fa-solid fa-bug';
  if (name.includes('excepción') || name.includes('fantasma') || name.includes('ghost')) return 'fa-solid fa-ghost';
  if (name.includes('null') || name.includes('undefined')) return 'fa-solid fa-ban';
  if (name.includes('promesa') || name.includes('promise') || name.includes('async')) return 'fa-solid fa-infinity';
  if (name.includes('css') || name.includes('z-index') || name.includes('layer')) return 'fa-solid fa-layer-group';
  if (name.includes('cors') || name.includes('join') || name.includes('link')) return 'fa-solid fa-link-slash';
  if (name.includes('build') || name.includes('deploy')) return 'fa-solid fa-rocket';
  if (name.includes('query') || name.includes('sql') || name.includes('base')) return 'fa-solid fa-database';
  if (name.includes('event') || name.includes('loop')) return 'fa-solid fa-rotate';
  if (name.includes('memory') || name.includes('leak') || name.includes('ram')) return 'fa-solid fa-memory';
  if (name.includes('virus') || name.includes('malware')) return 'fa-solid fa-virus';
  if (name.includes('fuego') || name.includes('fire') || name.includes('rage')) return 'fa-solid fa-fire';
  if (name.includes('dragon') || name.includes('dragón')) return 'fa-solid fa-dragon';
  return 'fa-solid fa-skull';
}

function bossIntentSymbol(intent = {}) {
  const type = String(intent.type || '');
  const map = { sweep: '🌪', focus: '🎯', charge: '⚡', shield: '🛡', drain: '💧', glitch: '🦠', rupture: '💥', enrage: '🔥' };
  return map[type] || '☠';
}

function bossCounterText(intent) {
  const counter = intent?.counter || '';
  if (counter === 'attack') return 'Respuesta recomendada: ATACAR para cortar o reducir la amenaza.';
  if (counter === 'protect') return 'Respuesta recomendada: PROTEGER para aguantar o interceptar.';
  if (counter === 'boost') return 'Respuesta recomendada: BOOST para romper armadura y preparar burst.';
  return 'Leed la intención y coordinad las tres acciones.';
}

function bossFighter(player) {
  const s = state.round?.state || {};
  return s.fighters?.[String(player?.id)] || { hp: 100, maxHp: 100, shield: 0, boost: 0, aggro: 0, vulnerable: 0, points: 0, damageTaken: 0 };
}

function bossHpMeter(value, max, extra = '') {
  const safeMax = Math.max(1, Number(max || 1));
  const pct = Math.max(0, Math.min(100, (Number(value || 0) / safeMax) * 100));
  return `<div class="boss-hp-meter ${extra}"><div style="width:${pct}%"></div></div>`;
}

function bossTurnSeconds() {
  const s = state.round?.state || {};
  const maxSeconds = Math.ceil(Math.max(5000, Math.min(10000, Number(s.turnDurationMs || 8000))) / 1000);
  return Math.max(0, Math.min(maxSeconds, secondsLeft()));
}

function bossTurnProgress() {
  const s = state.round?.state || {};
  const duration = Math.max(5000, Math.min(10000, Number(s.turnDurationMs || 8000)));
  const left = Math.min(duration, msLeft());
  const pct = Math.max(0, Math.min(100, (left / Math.max(1, duration)) * 100));
  return `<div class="boss-turnbar"><i style="width:${pct}%"></i></div>`;
}

function bossFighterCards() {
  const choices = bossCurrentChoices();
  return (state.players || []).map((player) => {
    const f = bossFighter(player);
    const hp = Number(f.hp ?? 0);
    const maxHp = Number(f.maxHp || 100);
    const shield = Number(f.shield || 0);
    const boost = Number(f.boost || 0);
    const vuln = Number(f.vulnerable || 0);
    const aggro = Number(f.aggro || 0);
    const choice = choices[String(player.id)]?.move;
    const meta = bossMoveMeta(choice || (hp <= 0 ? 'miss' : ''));
    const you = String(player.id) === playerIdKey();
    const classes = ['boss-fighter-card'];
    if (you) classes.push('you');
    if (hp <= 0) classes.push('down');
    if (choice) classes.push('chosen');
    return `<article class="${classes.join(' ')}">
      <div class="fighter-top">${bossAvatarHtml(player)}<div><strong>${escapeHtml(player.name)}</strong><span>${you ? 'Tú' : 'Aliado'} · ${hp <= 0 ? 'CAÍDO' : 'Activo'}</span></div></div>
      <div class="fighter-life-label ${hp <= 0 ? 'dead' : hp / Math.max(1, maxHp) <= 0.35 ? 'low' : ''}"><span>VIDA</span><strong>${hp}/${maxHp}</strong></div>
      ${bossHpMeter(hp, maxHp, 'mini')}
      <div class="fighter-stats"><span>🛡 ${shield}</span><span>⚡ ${boost}</span><span>🎯 ${aggro}</span><span>Daño recibido ${Number(f.damageTaken || 0)}</span>${vuln ? `<span class="danger">VULN ${vuln}</span>` : ''}</div>
      <div class="fighter-choice ${choice ? meta.tone : 'waiting'}"><span class="boss-mini-symbol" aria-hidden="true">${choice ? escapeHtml(meta.icon) : '○'}</span> ${choice ? escapeHtml(meta.label) : 'Esperando acción'}</div>
    </article>`;
  }).join('');
}

function bossActionButtons() {
  const s = state.round?.state || {};
  const pid = playerIdKey();
  const fighter = s.fighters?.[pid] || { hp: 100, maxHp: 100, shield: 0, boost: 0 };
  const hp = Number(fighter.hp ?? 100);
  const boost = Number(fighter.boost || 0);
  const chosen = bossCurrentChoices()[pid]?.move;
  const resolved = state.round?.phase === 'results' || s.resolved;
  const actions = [
    { move: 'attack',  title: 'ATACAR',                      iconCls: 'fa-solid fa-crosshairs',        desc: boost > 0 ? `Gasta ${boost} carga(s) para pegar fuerte` : 'Daño directo, genera aggro' },
    { move: 'protect', title: hp <= 0 ? 'REBOOT' : 'PROTEGER', iconCls: hp <= 0 ? 'fa-solid fa-heart-pulse' : 'fa-solid fa-shield-halved', desc: hp <= 0 ? 'Te levanta con escudo' : 'Escudo, intercepta y baja aggro' },
    { move: 'boost',   title: 'BOOST',                       iconCls: 'fa-solid fa-fire-flame-curved', desc: 'Carga daño futuro, pero te expone' },
  ];
  return `<div class="boss-actions v3">${actions.map((action) => {
    const disabled = resolved || Boolean(chosen) || (hp <= 0 && action.move !== 'protect');
    const selected = chosen === action.move;
    return `<button data-boss="${action.move}" class="boss-action ${action.move} ${selected ? 'is-selected is-pending' : ''}" ${disabled ? 'disabled aria-disabled="true"' : ''}>
      <i class="boss-action-icon ${action.iconCls}" aria-hidden="true"></i><strong>${action.title}</strong><small>${selected ? 'Elegido para este turno' : action.desc}</small>
    </button>`;
  }).join('')}</div>`;
}

function bossCombatPanel() {
  const s = state.round?.state || {};
  const events = [...(s.events || [])].slice(-10).reverse();
  const pid = playerIdKey();
  const ownDamage = Number(s.hits?.[pid] || 0);
  const choices = bossCurrentChoices();
  const chosenCount = Object.keys(choices).length;
  const totalPlayers = (state.players || []).filter((p) => p.online).length || (state.players || []).length || 1;
  const last = s.lastResolution || {};
  const synergies = Array.isArray(last.synergies) && last.synergies.length ? last.synergies : [];
  const outcome = s.outcome === 'victory' ? 'Victoria' : s.outcome === 'defeat' ? 'Derrota' : 'En combate';
  const yourChoice = choices[pid]?.move;
  const rows = events.map((event) => {
    const own = String(event.playerId ?? '') === pid;
    const type = event.type || 'event';
    const damage = Number(event.damage || 0);
    const text = event.text || event.summary || '';
    const amount = damage ? `<b>${type === 'boss' || type === 'down' || type === 'hit' ? '-' : '+'}${damage}</b>` : (type === 'block' ? '<b>🛡</b>' : '<b>·</b>');
    return `<div class="boss-log-row ${own ? 'own' : ''} ${escapeHtml(type)}"><strong>${escapeHtml(event.player || event.label || 'Sistema')}</strong><span>${escapeHtml(text || event.label || 'Evento')}</span>${amount}</div>`;
  }).join('');
  return `<div class="boss-feedback v3" aria-live="polite">
    <div><span>Turno</span><strong>${Number(s.turn || 1)} / ${Number(s.maxTurns || 8)}</strong></div>
    <div><span>Tiempo</span><strong>${secondsLeft()}s</strong></div>
    <div><span>Acciones</span><strong>${chosenCount} / ${totalPlayers}</strong></div>
    <div><span>Tu acción</span><strong>${yourChoice ? escapeHtml(bossMoveMeta(yourChoice).label) : 'Pendiente'}</strong></div>
    <div><span>Tu daño</span><strong>${ownDamage}</strong></div>
    <div><span>Rage</span><strong>${Number(s.rage || 0)}</strong></div>
    <div class="wide"><span>Último turno</span><strong>${escapeHtml(last.summary || 'Aún no se ha resuelto ningún turno')}</strong></div>
    <div><span>Estado</span><strong>${escapeHtml(outcome)}</strong></div>
  </div>
  ${synergies.length ? `<div class="boss-synergy-line">${synergies.map((txt) => `<span>🔗 ${escapeHtml(txt)}</span>`).join('')}</div>` : ''}
  <div class="boss-party-grid">${bossFighterCards()}</div>
  <div class="boss-log">${rows || '<span class="player-meta">Empieza el combate: elegid acción. Si todos eligen, el turno se resuelve al instante; si no, se resuelve al llegar a 0.</span>'}</div>`;
}

function roundReviewHtml() {
  const round = state?.round;
  const s = round?.state || {};
  if (!round) return '';

  if (round.mode === 'bug-race') {
    const c = s.challenge || {};
    const answer = s.answers?.[playerIdKey()] || {};
    const result = answerResultFromAnswers() || { answer: -999, correctIndex: Number(c.correct ?? -1) };
    const selectedIndex = Number(result.answer ?? -999);
    const correctIndex = Number(result.correctIndex ?? c.correct ?? -1);
    const isCorrect = Boolean(answer.correct) || selectedIndex === correctIndex;
    const points = Number(answer.points || 0);
    const summary = `<div class="bug-result-strip ${isCorrect ? 'good' : 'bad'}"><strong>${isCorrect ? '✓ Correcto' : '✕ Fallo'}</strong><span>${isCorrect ? `${signedPoints(points)} · Elegiste ${optionLabel(selectedIndex)}` : `Correcta: ${optionLabel(correctIndex)} · Tu respuesta: ${selectedIndex >= 0 ? optionLabel(selectedIndex) : 'sin respuesta'}`}</span></div>`;
    const prompt = `<span class="code-lang">${escapeHtml(c.lang || 'JS')}</span><pre class="code-box compact">${escapeHtml(c.code || c.question || 'Selecciona la respuesta correcta')}</pre>`;
    return `<div class="round-review glass-card bug-results-review"><h3>Revisión de Carrera de Bugs</h3>${summary}${prompt}${reviewAnswerButtons(c.options, result)}</div>`;
  }

  if (round.mode === 'quiz') {
    const questions = s.questions || [];
    const summary = s.summary || {};
    const rows = Object.values(summary).sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
    const you = summary[playerIdKey()] || {};
    const medals = s.medals || {};
    const medalChips = [
      medals.brain ? `🧠 Cerebro limpio: ${playerNameById(medals.brain.playerId)}` : '',
      medals.speed ? `⚡ Dedo rápido: ${playerNameById(medals.speed.playerId)} (${(Number(medals.speed.fastestMs || 0) / 1000).toFixed(1)}s)` : '',
      medals.streak ? `🔥 Mejor racha: ${playerNameById(medals.streak.playerId)} x${Number(medals.streak.bestStreak || 0)}` : '',
    ].filter(Boolean);
    const statCards = `<div class="quiz-final-stats">
      <div><span>Aciertos</span><strong>${Number(you.correct || 0)}/${questions.length || 0}</strong></div>
      <div><span>Precisión</span><strong>${Number(you.accuracy || 0)}%</strong></div>
      <div><span>Mejor racha</span><strong>x${Number(you.bestStreak || 0)}</strong></div>
      <div><span>Rango</span><strong>${escapeHtml(you.rank || 'Aprendiz HTML')}</strong></div>
    </div>`;
    const table = `<div class="quiz-final-ranking">${rows.map((row, i) => `<div class="quiz-player-row ${String(row.playerId) === playerIdKey() ? 'you' : ''}"><span>${i + 1}</span><strong>${escapeHtml(playerNameById(row.playerId))}</strong><em>${Number(row.correct || 0)} aciertos · ${Number(row.accuracy || 0)}%</em><b>${Number(row.points || 0)}</b></div>`).join('')}</div>`;
    return `<div class="round-review glass-card quiz-final-card"><h3>Fin del Quiz Relámpago</h3><h2>${escapeHtml(you.rank || 'Código a Contrarreloj')}</h2>${statCards}${table}${medalChips.length ? `<div class="lie-medals quiz-medals">${medalChips.map((m) => `<span>${escapeHtml(m)}</span>`).join('')}</div>` : ''}</div>`;
  }

  if (round.mode === 'subasta') {
    const rows = s.finalRows || Object.values(s.summary || {}).sort((a, b) => Number(b.finalCredits || 0) - Number(a.finalCredits || 0));
    const medals = s.medals || {};
    const you = (s.summary || {})[playerIdKey()] || {};
    const history = Object.values(s.history || {});
    const chips = [
      medals.bestBuy ? `Cazachollos: ${medals.bestBuy.name} con “${medals.bestBuy.lot}” (${Number(medals.bestBuy.net) >= 0 ? '+' : ''}${Number(medals.bestBuy.net)})` : '',
      medals.worstBuy ? `Pagafantas: ${medals.worstBuy.name} con “${medals.worstBuy.lot}” (${Number(medals.worstBuy.net)})` : '',
      medals.allIn ? `Manos de diamante: ${medals.allIn.name} arriesgó ${Number(medals.allIn.bid)} créditos` : '',
    ].filter(Boolean);
    const table = `<div class="auction-final-ranking">${rows.map((row, i) => `<div class="auction-rank-row ${String(row.playerId) === playerIdKey() ? 'you' : ''}"><span>${i + 1}</span><strong>${escapeHtml(row.name || auctionName(row.playerId))}</strong><em>${Number(row.ownedCount || 0)} lote${Number(row.ownedCount || 0) === 1 ? '' : 's'} · bonus ${Number(row.comboBonus || 0)}</em><b>${Number(row.finalCredits || row.credits || 0)}</b></div>`).join('')}</div>`;
    const lastLots = history.slice(-3).reverse().map((h) => `<div class="auction-mini-history"><strong>${escapeHtml(h.lot?.name || 'Lote')}</strong><span>${escapeHtml(h.label || 'Resultado')} · ${escapeHtml(h.winnerName || 'Sin comprador')} · ${Number(h.net || 0) >= 0 ? '+' : ''}${Number(h.net || 0)}</span></div>`).join('');
    return `<div class="round-review glass-card auction-final-card"><h3>Fin de Subasta Relámpago</h3><h2>${escapeHtml((medals.winner || rows[0] || {}).name || 'Mercado cerrado')}</h2><div class="auction-final-stats"><div><span>Tus créditos</span><strong>${Number(you.finalCredits || you.credits || 0)}</strong></div><div><span>Lotes comprados</span><strong>${Number(you.ownedCount || 0)}</strong></div><div><span>Bonus combo</span><strong>${Number(you.comboBonus || 0)}</strong></div></div>${table}${chips.length ? `<div class="lie-medals auction-medals">${chips.map((c) => `<span>${escapeHtml(c)}</span>`).join('')}</div>` : ''}${lastLots ? `<div class="auction-history-compact">${lastLots}</div>` : ''}</div>`;
  }

  if (round.mode === 'boton-prohibido') {
    return renderForbiddenFinal(s);
  }

  if (round.mode === 'mentira' && round.phase === 'results') {
    const vote = String(s.votes?.[playerIdKey()] ?? '');
    const options = s.options || [];
    const rows = s.votesResolved || [];
    const points = Number(s.pointsAwarded?.[playerIdKey()] || 0);
    const medals = s.medals || {};
    const medalText = [
      medals.bestLiar ? `Pinocho Supremo: ${playerNameById(medals.bestLiar.playerId)} (${medals.bestLiar.fooled} voto${Number(medals.bestLiar.fooled) === 1 ? '' : 's'} engañado${Number(medals.bestLiar.fooled) === 1 ? '' : 's'})` : '',
      medals.bestDetective ? `Detector de humo: ${playerNameById(medals.bestDetective.playerId)}` : '',
      medals.premiumLie ? `Mentira premium: “${medals.premiumLie.text}”` : '',
    ].filter(Boolean);
    const optionCards = options.map((option, i) => {
      const id = String(option.id || '');
      const isReal = id === 'real';
      const selected = vote === id;
      const owner = option.ownerId ? playerNameById(option.ownerId) : option.kind === 'bot' ? 'Sistema' : '';
      const classes = ['answer-btn', 'lie-option-card'];
      if (selected) classes.push('is-selected');
      if (isReal) classes.push('is-correct');
      else if (selected) classes.push('is-wrong');
      const votes = rows.filter((row) => String(row.vote) === id).length;
      return `<button class="${classes.join(' ')}" disabled aria-disabled="true">
        <b>${lieOptionLabel(i)}</b>
        <span class="answer-copy">${escapeHtml(option.text || '')}</span>
        ${selected ? '<span class="answer-tag choice">Tu elección</span>' : ''}
        ${isReal ? '<span class="answer-tag correct">Real</span>' : `<span class="answer-tag">${votes} voto${votes === 1 ? '' : 's'}${owner ? ` · ${escapeHtml(owner)}` : ''}</span>`}
      </button>`;
    }).join('');
    const voteRows = rows.slice(0, 8).map((row) => `<div class="lie-vote-row ${row.correct ? 'good' : 'bad'}"><strong>${escapeHtml(playerNameById(row.playerId))}</strong><span>${row.correct ? '✅ encontró la verdad' : `❌ cayó en “${escapeHtml(row.text || 'mentira')}”`}</span></div>`).join('');
    const explanation = s.explanation ? `<div class="lie-explanation"><strong>Por qué era esa</strong><span>${escapeHtml(s.explanation)}</span></div>` : '';
    return `<div class="round-review glass-card lie-results-review"><h3>Verdad revelada</h3><h2>${escapeHtml(s.question || '')}</h2><p class="player-meta">${escapeHtml(s.category || 'Categoría oculta')} · ${escapeHtml(lieDifficultyLabel(s.difficulty))} · ${escapeHtml((s.modifier || {}).label || 'Ronda clásica')} · Tú: ${signedPoints(points)}</p>${s.context ? `<p class="lie-context-line">${escapeHtml(s.context)}</p>` : ''}<div class="answers answers-review lie-options-grid">${optionCards}</div>${explanation}${voteRows ? `<div class="lie-vote-list">${voteRows}</div>` : ''}${medalText.length ? `<div class="lie-medals">${medalText.map((txt) => `<span>${escapeHtml(txt)}</span>`).join('')}</div>` : ''}</div>`;
  }

  if (round.mode === 'impostor' && round.phase === 'results') {
    const vote = String(s.votes?.[playerIdKey()] ?? '');
    const impostorId = String(s.impostor_id || '');
    const winnerText = s.winner === 'crew' ? 'Civiles ganan' : 'Impostor gana';
    const guess = s.wordGuesses?.[impostorId];
    const players = (s.turnOrder || []).map((id) => (state.players || []).find((p) => Number(p.id) === Number(id))).filter(Boolean);
    const ordered = players.length ? players : (state.players || []);
    const points = Number(s.pointsAwarded?.[playerIdKey()] || 0);
    const youAreImpostor = String(playerIdKey()) === impostorId;
    const won = (youAreImpostor && s.winner === 'impostor') || (!youAreImpostor && s.winner === 'crew');
    const outcome = won ? 'Has ganado' : 'Has perdido';
    const voteRows = (state.players || []).map((p) => {
      const id = String(p.id);
      const classes = ['answer-btn', 'vote-btn'];
      if (vote === id) classes.push('is-selected');
      if (impostorId === id) classes.push('is-correct');
      if (vote === id && impostorId !== id) classes.push('is-wrong');
      const voters = Object.entries(s.votes || {}).filter(([, target]) => String(target) === id).map(([voter]) => playerNameById(voter));
      return `<button class="${classes.join(' ')}" disabled aria-disabled="true">${avatarHtml(p)} <span class="answer-copy">${escapeHtml(p.name)}</span><span class="vote-chip">${voters.length ? escapeHtml(voters.join(', ')) : '0 votos'}</span>${vote === id ? '<span class="answer-tag choice">Tu voto</span>' : ''}${impostorId === id ? '<span class="answer-tag correct">Impostor</span>' : ''}</button>`;
    }).join('');
    return `<div class="round-review glass-card impostor-results compact-board"><h3>Expediente final · ${escapeHtml(outcome)}</h3>
      <div class="case-summary compact"><div><span>Resultado</span><strong>${escapeHtml(winnerText)}</strong></div><div><span>Impostor</span><strong>${escapeHtml(playerNameById(impostorId))}</strong></div><div><span>Palabra civil</span><strong>${escapeHtml(displayWord(s.normalWord))}</strong></div><div><span>Puntos</span><strong>${signedPoints(points)}</strong></div></div>
      <div class="suspect-list reveal-grid">${ordered.map((p) => impostorClueCard(p, true)).join('')}</div>
      <div class="vote-panel compact"><h3>Mapa de votos</h3><div class="vote-grid results">${voteRows}</div></div>
      ${guess ? `<p class="player-meta compact-note">Bonus del impostor: <strong>${escapeHtml(guess)}</strong>${s.impostorGuessCorrect ? ' · acertó' : ' · falló'}.</p>` : ''}
    </div>`;
  }

  if (round.mode === 'boss-coop') {
    const hp = Number(s.bossHp || s.hp || 0);
    const max = Number(s.maxBossHp || s.maxHp || 1);
    const pid = playerIdKey();
    const myDamage = Number(s.hits?.[pid] || 0);
    const turn = Number(s.turn || 1);
    const maxTurns = Number(s.maxTurns || 8);
    const last = s.lastResolution || {};
    const boss = s.bossData || {};
    const victory = s.outcome === 'victory';
    const outcome = victory ? '🏆 Victoria del equipo' : s.outcome === 'defeat' ? '💀 Derrota del equipo' : 'Combate cerrado';
    const tone = victory ? 'good' : 'bad';
    const fighterCards = (state.players || []).map((player) => {
      const f = bossFighter(player);
      const fhp = Number(f.hp ?? 0);
      const fmax = Number(f.maxHp || 100);
      const down = fhp <= 0;
      const you = String(player.id) === pid;
      return `<div class="boss-result-fighter ${down ? 'down' : ''} ${you ? 'you' : ''}">
        ${avatarHtml(player)}
        <div class="boss-result-fighter-info">
          <strong>${escapeHtml(player.name)}</strong>
          <span>${down ? '💀 CAÍDO' : `❤ ${fhp}/${fmax}`}</span>
        </div>
        <div class="boss-result-fighter-dmg">${Number(f.damageTaken || 0)}<small>rec.</small></div>
      </div>`;
    }).join('');
    return `<div class="round-review glass-card boss-result-card ${tone}">
      <div class="boss-result-header">
        <div class="boss-result-portrait"><i class="${bossIconClass(boss)}"></i></div>
        <div class="boss-result-meta">
          <h2>${escapeHtml(s.boss || 'Boss')}</h2>
          <p class="boss-result-outcome ${tone}">${escapeHtml(outcome)}</p>
          <p class="player-meta">${escapeHtml(s.outcomeReason || last.summary || '')}</p>
        </div>
      </div>
      ${bossHpMeter(hp, max, 'boss result-meter')}
      <div class="boss-result-stats">
        <div><span>HP restante</span><strong>${hp} / ${max}</strong></div>
        <div><span>Turno</span><strong>${turn} / ${maxTurns}</strong></div>
        <div><span>Tu daño</span><strong>${myDamage}</strong></div>
        <div><span>Rage</span><strong>${Number(s.rage || 0)}</strong></div>
      </div>
      <div class="boss-result-fighters">${fighterCards}</div>
    </div>`;
  }

  return '';
}


function quizQuestion() {
  const s = state.round?.state || {};
  return s.challenge || (s.questions || [])[Number(s.current || 0)] || {};
}

function quizIndex() {
  return Number(state.round?.state?.current || 0);
}

function quizTotal() {
  const s = state.round?.state || {};
  return Number(quizQuestion().total || (s.questions || []).length || 10);
}

function quizMyAnswer() {
  const s = state.round?.state || {};
  const idx = String(quizIndex());
  const pid = playerIdKey();
  return s.yourQuizAnswer || s.answers?.[idx]?.[pid] || null;
}

function quizDifficultyLabel(value) {
  const n = Number(value || 1);
  if (n <= 1) return 'Fácil';
  if (n === 2) return 'Media';
  if (n === 3) return 'Difícil';
  return 'Experta';
}

function quizModifierLabel(mod = {}) {
  return mod.short || mod.label || 'Clásica';
}

function quizProgressPct() {
  const s = state.round?.state || {};
  const duration = Math.max(1000, Number(s.questionDurationMs || 10000));
  return Math.max(0, Math.min(100, Math.round((msLeft() / duration) * 100)));
}

function quizStreak() {
  const value = Number((state.round?.state?.streaks || {})[playerIdKey()] || 0);
  return value;
}

function quizLightningLeft() {
  return Number((state.round?.state?.lightning || {})[playerIdKey()] || 0);
}

function quizAnswerResult(showCorrect = false) {
  const c = quizQuestion();
  const answer = quizMyAnswer();
  if (!answer) return null;
  return {
    answer: Number(answer.answer ?? -1),
    correctIndex: showCorrect || answer.correct !== undefined ? Number(c.correct ?? -1) : -999,
  };
}

function quizPlayerRows(rows = []) {
  if (!rows.length) return '';
  return `<div class="quiz-player-rows">${rows.slice(0, 6).map((row, index) => {
    const answer = Number(row.answer ?? -1);
    const name = playerNameById(row.playerId);
    const time = row.timeout ? 'sin responder' : `${(Number(row.elapsedMs || 0) / 1000).toFixed(1)}s`;
    return `<div class="quiz-player-row ${row.correct ? 'good' : 'bad'}"><span>${index + 1}</span><strong>${escapeHtml(name)}</strong><em>${row.correct ? 'Correcto' : row.timeout ? 'Tiempo' : 'Falló'} · ${time}</em><b>${signedPoints(row.points || 0)}</b></div>`;
  }).join('')}</div>`;
}

function quizAnswerButtons(c, showCorrect = false) {
  const result = quizAnswerResult(showCorrect);
  const selected = Number(result?.answer ?? -999);
  const correct = Number(result?.correctIndex ?? -999);
  const submitted = selected >= 0 || Boolean(quizMyAnswer());
  const phase = state.round?.phase || 'answer';
  const removed = (state.round?.state?.fiftyRemoved || []).map(Number);
  const disabledAll = phase !== 'answer' || submitted;
  return `<div class="answers quiz-options">${(c.options || []).map((op, i) => {
    const isRemoved = removed.includes(i) && !showCorrect;
    const classes = ['answer-btn', 'quiz-answer'];
    if (submitted && selected === i) classes.push('is-selected');
    if (showCorrect && correct === i) classes.push('is-correct');
    if (showCorrect && submitted && selected === i && correct !== i) classes.push('is-wrong');
    if (isRemoved) classes.push('is-removed');
    const disabled = disabledAll || isRemoved;
    const tag = isRemoved ? '<span class="answer-tag">Descartada</span>' : answerTags(selected, correct, i, submitted && showCorrect);
    return `<button class="${classes.join(' ')}" data-answer="${i}"${disabled ? ' disabled aria-disabled="true"' : ''}><b>${'ABCD'[i] || i + 1}</b><span class="answer-copy">${escapeHtml(op)}</span>${tag}</button>`;
  }).join('')}</div>`;
}

function quizMetaLine(c) {
  const mod = c.modifier || {};
  const category = mod.hideCategory && state.round?.phase === 'answer' ? 'Categoría oculta' : (c.category || 'Tech');
  return `<div class="quiz-meta-line"><span>${escapeHtml(category)}</span><span>${escapeHtml(quizDifficultyLabel(c.difficulty))}</span><span class="special">${escapeHtml(quizModifierLabel(mod))}</span>${quizStreak() ? `<span>Racha x${quizStreak()}</span>` : ''}${quizLightningLeft() ? `<span class="lightning">Modo relámpago x${quizLightningLeft()}</span>` : ''}</div>`;
}

function answerResultFromAnswers() {
  const c = state.round?.state?.challenge || {};
  if (state.round?.mode === 'quiz') {
    const answer = quizMyAnswer();
    if (!answer) return null;
    return { answer: Number(answer.answer ?? -1), correctIndex: Number(c.correct ?? -1) };
  }
  const answer = state.round?.state?.answers?.[playerIdKey()];
  if (!answer) return null;
  return { answer: Number(answer.answer ?? -1), correctIndex: Number(c.correct ?? -1) };
}

function answerResultFromAuction() {
  const s = state.round?.state || {};
  const idx = String(Number(s.current || 0));
  return s.yourBid || s.bids?.[idx]?.[playerIdKey()] || null;
}

function auctionState() { return state.round?.state || {}; }
function auctionLot() { return auctionState().challenge || {}; }
function auctionEvent() {
  const s = auctionState();
  const idx = String(Number(s.current || 0));
  return s.marketEvents?.[idx] || { label: 'Mercado estable', note: 'Puja con cabeza.' };
}
function auctionName(id) {
  const sid = String(id ?? '');
  const player = (state?.players || []).find((p) => String(p.id) === sid);
  if (player) return player.name || 'Jugador';
  const bot = (auctionState().bots || []).find((b) => String(b.id) === sid);
  return bot?.name || (sid.startsWith('bot_') ? 'Bot' : 'Mercader');
}
function auctionCreditsFor(id = playerIdKey()) {
  const s = auctionState();
  return Number((s.credits || {})[String(id)] ?? s.yourCredits ?? s.initialCredits ?? 0);
}
function auctionRarityClass(rarity) {
  return String(rarity || 'comun').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
}
function auctionBidRows(result = null) {
  const s = auctionState();
  const idx = String(Number(s.current || 0));
  const rows = result?.rows || Object.entries(s.bids?.[idx] || {}).map(([pid, bid]) => ({ playerId: pid, name: auctionName(pid), ...bid }));
  const bots = (s.bots || []).filter((bot) => !rows.some((r) => String(r.playerId) === String(bot.id))).map((bot) => ({ playerId: bot.id, name: bot.name, stance: bot.mood || 'Observando', locked: true, bot: true }));
  return [...rows, ...bots].slice(0, 8).map((row) => `<div class="auction-bid-row ${row.winner ? 'winner' : ''} ${String(row.playerId) === playerIdKey() ? 'you' : ''}"><strong>${escapeHtml(row.name || auctionName(row.playerId))}</strong><span>${result ? `${Number(row.bid || 0)} créditos${row.insurance ? ' · seguro' : ''}` : row.locked ? `${escapeHtml(row.stance || 'Puja secreta')}` : `${Number(row.bid || 0)} créditos${row.insurance ? ' · seguro' : ''}`}</span></div>`).join('');
}
function auctionRivalsCompact(result = null) {
  const s = auctionState();
  const idx = String(Number(s.current || 0));
  const rows = result?.rows || Object.entries(s.bids?.[idx] || {}).map(([pid, bid]) => ({ playerId: pid, name: auctionName(pid), ...bid }));
  const bots = (s.bots || []).filter((bot) => !rows.some((r) => String(r.playerId) === String(bot.id))).map((bot) => ({ playerId: bot.id, name: bot.name, stance: bot.mood || 'Observa', locked: true, bot: true }));
  const everyone = [...rows, ...bots].slice(0, 6);
  if (!everyone.length) return '';
  return `<div class="auction-rivals-compact"><strong>Rivales</strong>${everyone.map((row) => {
    const you = String(row.playerId) === playerIdKey();
    const label = result ? `${Number(row.bid || 0)}` : row.locked ? escapeHtml(row.stance || 'Secreto') : 'Puja enviada';
    return `<span class="${you ? 'you' : ''}"><b>${escapeHtml(row.name || auctionName(row.playerId))}</b><em>${label}</em></span>`;
  }).join('')}</div>`;
}

function auctionClues(lot, s = auctionState()) {
  const idx = String(Number(s.current || 0));
  const clues = (lot.clues || []).slice(0, 3);
  const extra = s.revealedExtra || s.revealedClues?.[idx]?.[playerIdKey()];
  return `<div class="auction-clues">${clues.map((clue, i) => `<div><b>${i + 1}</b><span>${escapeHtml(clue)}</span></div>`).join('')}${extra ? `<div class="extra"><b>+</b><span>${escapeHtml(extra)}</span></div>` : ''}</div>`;
}
function auctionQuickBidButtons(credits) {
  const presets = [
    { value: 0, label: 'Pasar', hint: '0' },
    { value: 25, label: '25', hint: 'segura' },
    { value: 50, label: '50', hint: 'media' },
    { value: 75, label: '75', hint: 'fuerte' },
    { value: 100, label: '100', hint: 'alta' },
  ].filter((p, i, arr) => p.value <= credits && arr.findIndex((x) => x.value === p.value) === i);
  return `${presets.map((p) => `<button type="button" class="auction-chip" data-auction-bid-chip="${p.value}"><strong>${p.label}</strong><small>${p.hint}</small></button>`).join('')}<button type="button" class="auction-chip danger" data-auction-bid-chip="all"><strong>Todo</strong><small>${credits}</small></button>`;
}
function auctionTotalMs() {
  const s = auctionState();
  return Math.max(1, Number((state.round?.phase === 'reveal' ? s.revealMs : s.bidMs) || 30000));
}
function auctionProgressPct() {
  return Math.max(0, Math.min(100, (msLeft() / auctionTotalMs()) * 100));
}
function auctionPhaseLabel() {
  const phase = state.round?.phase || 'bid';
  if (phase === 'reveal') return `REVELACIÓN · siguiente lote en <span class="timer">${secondsLeft()}s</span>`;
  if (phase === 'results') return 'MERCADO CERRADO';
  return `DECIDE TU PUJA · quedan <span class="timer">${secondsLeft()}s</span>`;
}
function auctionHowToHtml(hasBid) {
  return `<div class="auction-rules-v5" aria-label="Cómo jugar Subasta Relámpago">
    <div class="auction-rule-main"><b>OBJETIVO</b><span>Termina la partida con más <strong>capital</strong> que tus rivales.</span></div>
    <div><b>RONDA</b><span>Aparece un lote con <strong>valor real oculto</strong>.</span></div>
    <div><b>PUJA</b><span>Compra barato: si ganas, <strong>valor − puja = beneficio</strong>.</span></div>
    <div><b>AYUDAS</b><span><strong>Analizar</strong> da una pista extra. <strong>Seguro</strong> reduce pérdidas.</span></div>
    ${hasBid ? `<div class="done"><b>✓</b><span>Puja enviada. Puedes cambiarla antes de la revelación.</span></div>` : ''}
  </div>`;
}
function auctionDecisionHint(lot, event, bid) {
  if (bid) return `Puja confirmada: ${Number(bid.bid || 0)}. Para ganar dinero, el valor real debe superar esa cantidad${bid.insurance ? '; si sale mal, llevas seguro' : ''}.`;
  if (String(event?.id || '') === 'glitch') return 'Glitch: una pista puede ser engañosa. Mejor analiza o no pujes demasiado alto.';
  if (String(event?.id || '') === 'jackpot') return 'Jackpot: puede cambiar la partida. Si arriesgas fuerte, considera seguro.';
  if (String(lot?.risk || '').toLowerCase().includes('alto') || String(lot?.risk || '').toLowerCase().includes('crítico')) return 'Riesgo alto: puja con margen. La rareza no garantiza que el lote sea bueno.';
  return 'Elige cuánto pagarías por este lote. Si crees que vale 80, intenta pujar bastante menos de 80.';
}
function auctionBidMeaning(bidValue, credits) {
  const bid = Number(bidValue || 0);
  if (bid <= 0) return 'Pasas la ronda: no compras el lote, no pierdes capital y esperas al siguiente.';
  const pct = credits > 0 ? bid / credits : 0;
  const risk = pct >= .75 ? 'muy arriesgada' : pct >= .5 ? 'fuerte' : pct >= .25 ? 'moderada' : 'conservadora';
  return `Puja ${risk}: necesitas que el lote valga más de ${bid} para ganar capital.`;
}
function auctionFormulaHtml(value, bid) {
  const v = Number(value || 0);
  const b = Number(bid || 0);
  const net = v - b;
  return `<div class="auction-formula ${net >= 0 ? 'good' : 'bad'}"><span>Cuenta del lote</span><strong>${v} − ${b} = ${net >= 0 ? '+' : ''}${net}</strong><em>valor real − puja ganadora = beneficio</em></div>`;
}
function auctionYourReveal(result) {
  const myRow = (result?.rows || []).find((row) => String(row.playerId) === playerIdKey()) || null;
  const myBid = Number(myRow?.bid || 0);
  const won = String(result?.winner || '') === playerIdKey();
  if (won) {
    const net = Number(result?.net || 0);
    return `<div class="auction-your-result ${net >= 0 ? 'good' : 'bad'}"><b>${net >= 0 ? 'Has comprado bien' : 'Has sobrepagado'}</b><span>Tu puja ganó. Resultado para ti: <strong>${net >= 0 ? '+' : ''}${net}</strong> capital.</span></div>`;
  }
  if (myBid > 0) return `<div class="auction-your-result neutral"><b>No te llevaste el lote</b><span>Tú pujaste ${myBid}, pero ${escapeHtml(result?.winnerName || 'otro jugador')} ganó por ${Number(result?.winnerBid || 0)}. Conservas tu capital.</span></div>`;
  return `<div class="auction-your-result neutral"><b>Pasaste la ronda</b><span>No pujaste. No ganas nada, pero tampoco pierdes capital.</span></div>`;
}
function auctionCapitalBoard() {
  const s = auctionState();
  const credits = s.credits || {};
  const rows = Object.entries(credits).map(([id, value]) => ({ id, name: auctionName(id), value: Number(value || 0), you: String(id) === playerIdKey() }))
    .sort((a, b) => b.value - a.value).slice(0, 5);
  if (!rows.length) return '';
  return `<div class="auction-capital-board"><strong>Capital actual</strong>${rows.map((row, i) => `<span class="${row.you ? 'you' : ''}"><b>${i + 1}. ${escapeHtml(row.name)}</b><em>${row.value}</em></span>`).join('')}</div>`;
}
function auctionRevealSummary(result, lot) {
  const value = Number(result?.value || 0);
  const bid = Number(result?.winnerBid || 0);
  const net = Number(result?.net || 0);
  const winner = result?.winnerName || 'Sin comprador';
  return `<div class="auction-reveal-grid">
    <div><span>Ganador</span><strong>${escapeHtml(winner)}</strong><small>${bid > 0 ? `pagó ${bid}` : 'nadie compró'}</small></div>
    <div><span>Valor real</span><strong>${value}</strong><small>lo que realmente valía</small></div>
    <div class="${net >= 0 ? 'good' : 'bad'}"><span>Beneficio</span><strong>${net >= 0 ? '+' : ''}${net}</strong><small>${net >= 0 ? 'compra rentable' : 'pérdida / sobrepago'}</small></div>
  </div>
  ${auctionFormulaHtml(value, bid)}
  <p class="auction-worth-explain"><b>Por qué valía ${value}:</b> ${escapeHtml(result?.explanation || lot?.explanation || 'El valor depende de utilidad real, riesgo, rareza y evento de mercado.')}</p>`;
}

function renderBugRace() {
  const c = state.round?.state?.challenge || {};
  return `<h1 class="game-title">CARRERA DE BUGS</h1><p class="subtitle">ARREGLA EL CODIGO - <span class="timer">${secondsLeft()}s</span></p><div class="glass-card game-card">
    <span class="code-lang">${escapeHtml(c.lang || 'JS')}</span>
    <pre class="code-box">${escapeHtml(c.code || c.question || 'Selecciona la respuesta correcta')}</pre>
    ${answerButtons(c.options, 'data-answer', answerResultFromAnswers())}
    ${roundFeedbackHtml()}
  </div>`;
}

function renderQuiz() {
  const s = state.round?.state || {};
  const c = quizQuestion();
  const phase = state.round?.phase || 'answer';
  const idx = quizIndex();
  const total = quizTotal();
  const answered = Boolean(quizMyAnswer());
  const mod = c.modifier || {};
  const hot = msLeft() > Math.max(0, Number(s.questionDurationMs || 10000) - 2000) && !answered;

  if (phase === 'reveal') {
    const answer = quizMyAnswer();
    const correct = Boolean(answer?.correct);
    const rows = s.lastResult?.rows || [];
    const points = Number(answer?.points || 0);
    return `<h1 class="game-title compact-title">QUIZ RELÁMPAGO</h1><p class="subtitle compact-subtitle">REVELACIÓN · SIGUIENTE EN <span class="timer">${secondsLeft()}s</span></p>
    <div class="glass-card game-card quiz-card quiz-reveal ${correct ? 'good' : 'bad'}">
      <div class="quiz-topline"><strong>Pregunta ${idx + 1}/${total}</strong>${quizMetaLine(c)}</div>
      <h2>${escapeHtml(c.question || 'Pregunta rápida')}</h2>
      ${quizAnswerButtons(c, true)}
      <div class="quiz-explain ${correct ? 'good' : 'bad'}"><strong>${correct ? `Correcto · ${signedPoints(points)}` : answer?.timeout ? 'Tiempo agotado' : 'Incorrecto'}</strong><span>${escapeHtml(c.explanation || 'La respuesta correcta queda marcada en verde.')}</span></div>
      ${quizPlayerRows(rows)}
    </div>`;
  }

  return `<h1 class="game-title compact-title">QUIZ RELÁMPAGO</h1><p class="subtitle compact-subtitle">CÓDIGO A CONTRARRELOJ · <span class="timer">${secondsLeft()}s</span></p>
  <div class="glass-card game-card quiz-card">
    <div class="quiz-topline"><strong>Pregunta ${idx + 1}/${total}</strong>${quizMetaLine(c)}</div>
    <div class="quiz-timebar"><i style="width:${quizProgressPct()}%"></i><span>${hot ? 'Respuesta en caliente disponible' : answered ? 'Respuesta enviada' : 'Elige antes de que acabe'}</span></div>
    <div class="quiz-context"><strong>Contexto</strong><span>${escapeHtml(c.context || 'Piensa en una situación real de desarrollo web.')}</span></div>
    <h2>${escapeHtml(c.question || 'Pregunta rápida')}</h2>
    ${quizAnswerButtons(c, false)}
    <div class="quiz-tools">
      <button class="lie-joker-card quiz-tool" data-quiz-joker="fifty" ${(!s.canUseFifty || answered) ? 'disabled aria-disabled="true"' : ''}><span class="lie-joker-icon">50</span><span class="lie-joker-copy"><strong>50/50</strong><small>Descarta dos respuestas falsas.</small></span></button>
      <button class="lie-joker-card quiz-tool" data-quiz-joker="freeze" ${(!s.canUseFreeze || answered) ? 'disabled aria-disabled="true"' : ''}><span class="lie-joker-icon">⏱</span><span class="lie-joker-copy"><strong>Congelar</strong><small>Añade 3s al reloj de la sala.</small></span></button>
      <div class="quiz-rule"><strong>${escapeHtml(mod.label || 'Ronda clásica')}</strong><span>${escapeHtml(mod.note || 'Acierta rápido para sumar más.')}</span></div>
    </div>
    ${roundFeedbackHtml()}
  </div>`;
}

function renderAuction() {
  const s = auctionState();
  const lot = auctionLot();
  const phase = state.round?.phase || 'bid';
  const idx = Number(s.current || 0);
  const total = Number(s.total || (s.lots || []).length || 8);
  const event = auctionEvent();
  const credits = auctionCreditsFor();
  const bid = answerResultFromAuction();
  const draftKey = `${state.round?.id || state.round?.round_id || ''}:${idx}:${phase}`;
  if (auctionDraft.key !== draftKey) {
    auctionDraft = { bid: bid ? Number(bid.bid || 0) : null, insurance: Boolean(bid?.insurance), stance: bid?.stance || 'Secreto', key: draftKey };
  }
  const result = s.lastResult || s.history?.[String(idx)];
  const rarity = lot.rarity || result?.lot?.rarity || 'Común';
  const risk = lot.risk || result?.lot?.risk || 'Medio';
  const tags = (lot.tags || result?.lot?.tags || []).slice(0, 4);

  if (phase === 'reveal') {
    const resultLot = result?.lot || lot || {};
    const won = String(result?.winner || '') === playerIdKey();
    const net = Number(result?.net || 0);
    return `<h1 class="game-title compact-title auction-title-v5">SUBASTA RELÁMPAGO</h1><p class="subtitle compact-subtitle">REVELACIÓN · siguiente lote en <span class="timer">${secondsLeft()}s</span></p>
    <div class="glass-card game-card auction-card auction-card-v5 auction-reveal-v5 ${won ? 'won' : ''}">
      <div class="auction-topline"><strong>Ronda ${idx + 1}/${total}</strong><span>Gana quien acabe con más capital</span></div>
      <div class="auction-reveal-head ${net >= 0 ? 'good' : 'bad'}">
        <span>${escapeHtml(result?.label || 'Revelación')}</span>
        <h2>${escapeHtml(resultLot.name || 'Lote revelado')}</h2>
        <p>${escapeHtml(resultLot.category || 'Tech')} · ${escapeHtml(resultLot.rarity || rarity)} · ${escapeHtml(event.label || 'Mercado')}</p>
      </div>
      ${auctionRevealSummary(result, resultLot)}
      ${auctionYourReveal(result)}
      <div class="auction-bid-list compact">${auctionBidRows(result)}</div>
      ${(result?.notes || []).length ? `<div class="auction-notes">${result.notes.map((n) => `<span>${escapeHtml(n)}</span>`).join('')}</div>` : ''}
      ${auctionCapitalBoard()}
    </div>`;
  }

  const draftBid = auctionDraft.bid ?? (bid ? Number(bid.bid || 0) : Math.min(25, credits));
  const insured = Boolean(auctionDraft.insurance || bid?.insurance);
  const stance = auctionDraft.stance || bid?.stance || 'Secreto';
  return `<h1 class="game-title compact-title auction-title-v5">SUBASTA RELÁMPAGO</h1>
  <div class="glass-card game-card auction-card auction-card-v5">
    <div class="auction-topline"><strong>Ronda ${idx + 1}/${total}</strong><span>Final: gana quien tenga más capital</span></div>
    <div class="auction-timebar"><i style="width:${auctionProgressPct()}%"></i><span>${auctionPhaseLabel().replace(/<[^>]*>/g, '')}</span></div>
    ${auctionHowToHtml(Boolean(bid))}
    <div class="auction-layout-v5">
      <section class="auction-lot-panel" aria-label="Lote de subasta">
        <div class="auction-event auction-event-v5"><b>${escapeHtml(event.label || 'Evento')}</b><span>${escapeHtml(event.note || 'Lee pistas y puja por debajo del valor oculto.')}</span></div>
        <div class="auction-lot-title"><span class="auction-rarity ${auctionRarityClass(rarity)}">${escapeHtml(rarity)}</span><h2>${escapeHtml(lot.name || 'Lote misterioso')}</h2></div>
        <div class="auction-meta"><span>${escapeHtml(lot.category || 'Tech')}</span><span>Riesgo: ${escapeHtml(risk)}</span>${tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="auction-hidden-value"><b>Valor real oculto</b><span>No lo sabes todavía. Usa las pistas para estimarlo y puja menos de lo que crees que vale.</span></div>
        ${auctionClues(lot, s)}
      </section>
      <section class="auction-action-panel" aria-label="Tu puja">
        <div class="auction-decision-hint"><strong>Ahora</strong><span>${escapeHtml(auctionDecisionHint(lot, event, bid))}</span></div>
        <form class="auction-form" data-auction-form>
          <div class="auction-wallet"><div><span>Tu capital</span><strong>${credits}</strong></div><div><span>Tu puja</span><strong data-auction-live-bid>${Number(draftBid || 0)}</strong></div><div><span>Seguro</span><strong data-auction-live-insurance>${insured ? 'Sí' : 'No'}</strong></div></div>
          <div class="auction-bid-meaning" data-auction-bid-meaning>${escapeHtml(auctionBidMeaning(draftBid, credits))}</div>
          <label class="auction-bid-input"><span>Puja exacta</span><input data-auction-bid name="bid" type="number" min="0" max="${credits}" step="5" value="${draftBid}"></label>
          <div class="auction-chip-row" aria-label="Pujas rápidas">${auctionQuickBidButtons(credits)}</div>
          <div class="auction-tools auction-tools-v5">
            <button type="button" class="lie-joker-card auction-tool" data-auction-analyze ${s.revealedExtra ? 'disabled aria-disabled="true"' : ''}><span class="lie-joker-icon">🔎</span><span class="lie-joker-copy"><strong>Analizar</strong><small>-${Number(s.analyzeCost ?? 10)} capital · revela pista extra</small></span></button>
            <button type="button" class="lie-joker-card auction-tool ${insured ? 'active' : ''}" data-auction-insurance data-active="${insured ? '1' : '0'}"><span class="lie-joker-icon">🛡</span><span class="lie-joker-copy"><strong>Seguro</strong><small>-${Number(s.insuranceCost ?? 15)} capital · reduce pérdidas</small></span></button>
            <label class="auction-stance"><span>Farol público</span><select data-auction-stance name="stance" data-current-stance="${escapeHtml(stance)}" aria-label="Postura pública"><option ${stance==="Secreto"?"selected":""}>Secreto</option><option ${stance==="Paso"?"selected":""}>Paso</option><option ${stance==="Me interesa"?"selected":""}>Me interesa</option><option ${stance==="Voy fuerte"?"selected":""}>Voy fuerte</option><option ${stance==="All-in"?"selected":""}>All-in</option></select></label>
          </div>
          <button class="primary-btn auction-confirm" type="submit"><span aria-hidden="true">🔨</span>${bid ? ' ACTUALIZAR PUJA' : ' CONFIRMAR PUJA'}</button>
        </form>
      </section>
    </div>
    ${auctionRivalsCompact()}
    ${auctionCapitalBoard()}
    ${roundFeedbackHtml()}
  </div>`;
}

function renderBoss() {
  const s = state.round?.state || {};
  const boss = s.bossData || {};
  const hp = Number(s.bossHp || s.hp || 0);
  const max = Number(s.maxBossHp || s.maxHp || 1);
  const intent = s.intent || {};
  const turn = Number(s.turn || 1);
  const maxTurns = Number(s.maxTurns || 8);
  const weak = boss.weak ? bossMoveMeta(boss.weak) : null;
  const activePlayers = bossOnlinePlayers().length || 1;
  const rage = Number(s.rage || 0);
  const isEnrage = rage >= 6 || hp / Math.max(1, max) <= 0.28;
  return `<div class="boss-arena boss-arena-v3${isEnrage ? ' enrage-mode' : ''}">
    <section class="boss-top-card v3">
      <div class="boss-portrait">
        <i class="boss-portrait-icon ${bossIconClass(boss)}" aria-hidden="true"></i>
        <div class="boss-turn-badge">T${turn}/${maxTurns}</div>
        ${isEnrage ? '<div class="boss-enrage-ring" aria-hidden="true"></div>' : ''}
      </div>
      <div class="boss-main-info">
        <div class="boss-tags">
          <span>${escapeHtml(boss.trait || 'Boss')}</span>
          <span><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> ${Number(boss.armor || 0)}</span>
          ${weak ? `<span><i class="fa-solid fa-crosshairs" aria-hidden="true"></i> ${escapeHtml(weak.label)}</span>` : ''}
          ${activePlayers <= 1 ? '<span><i class="fa-solid fa-user" aria-hidden="true"></i> Héroe solo</span>' : `<span><i class="fa-solid fa-users" aria-hidden="true"></i> x${activePlayers}</span>`}
          ${isEnrage ? '<span class="tag-enrage"><i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i> ENRAGE</span>' : ''}
        </div>
        <h2>${escapeHtml(s.boss || 'EL BUG SUPREMO')}</h2>
        <p>${escapeHtml(boss.flavor || 'Coordina ataques, protecciones y boosts para sobrevivir.')}</p>
        ${bossHpMeter(hp, max, 'boss')}
        <div class="boss-hp-row">
          <strong class="boss-hp-text">${hp} / ${max} HP</strong>
          <span class="boss-timer-badge"><i class="fa-solid fa-clock" aria-hidden="true"></i> <b>${bossTurnSeconds()}s</b></span>
        </div>
        ${bossTurnProgress()}
      </div>
      <aside class="boss-intent-card ${escapeHtml(intent.type || 'sweep')}">
        <span>Próximo ataque</span>
        <h3><span class="boss-mini-symbol" aria-hidden="true">${escapeHtml(bossIntentSymbol(intent))}</span> ${escapeHtml(intent.label || 'Ataque del boss')}</h3>
        <p>${escapeHtml(intent.text || 'Leed la intención y elegid con cabeza.')}</p>
        <b>${escapeHtml(bossCounterText(intent))}</b>
      </aside>
    </section>
    ${bossActionButtons()}
    ${bossCombatPanel()}
  </div>`;
}

function renderRhythm() {
  const track = currentMusicTrack();
  const options = MUSIC_TRACKS.map((song) => `<option value="${escapeHtml(song.file)}" ${song.file === track.file ? 'selected' : ''}>${escapeHtml(song.title)}</option>`).join('');
  return `<h1 class="game-title">RHYTHM ROYALE</h1><p class="subtitle">ADIVINA EL RITMO - <span class="timer">${secondsLeft()}s</span></p><div class="glass-card game-card">
    <div class="rhythm-player">
      <label>Cancion</label>
      <select data-rhythm-track>${options}</select>
      <label>Volumen</label>
      <input data-rhythm-volume type="range" min="0" max="1" step="0.05" value="${localStorage.getItem('party_music_volume') || '0.82'}">
      <button class="secondary-btn" data-rhythm-pause type="button"><i class="fa-solid fa-pause"></i> PAUSA</button>
    </div>
    <div class="rhythm-target" data-rhythm-target><div class="pulse" data-pulse></div><div class="judgement" data-judge>READY</div></div>
    <p class="player-meta" data-rhythm-stats>Score 0 - Combo 0 - Precision 0%</p>
    ${roundFeedbackHtml()}
    <audio data-rhythm-audio preload="auto" src="../assets/music/${encodeURIComponent(track.file)}"></audio>
    <div class="big-actions"><button class="primary-btn" data-rhythm-start><i class="fa-solid fa-music"></i> REPRODUCIR CANCION</button><button class="secondary-btn" data-rhythm-hit><i class="fa-solid fa-bolt"></i> HIT</button><button class="secondary-btn" data-rhythm-submit><i class="fa-solid fa-check"></i> ENVIAR PUNTOS</button></div>
  </div>`;
}

function renderMentira() {
  const s = state.round?.state || {};
  const phase = state.round?.phase || 'write';
  const meta = lieMetaParts(s);
  const question = escapeHtml(s.question || 'Inventa una mentira convincente');
  if (phase === 'vote') {
    const options = s.options || [];
    const voted = String(s.votes?.[playerIdKey()] ?? '');
    const own = String(s.yourOptionId || '');
    const removed = new Set((s.fiftyRemoved || []).map(String));
    const buttons = options.map((option, i) => {
      const id = String(option.id || '');
      const disabled = Boolean(voted) || id === own || removed.has(id);
      const classes = ['answer-btn', 'lie-option-card'];
      if (voted === id) classes.push('is-selected');
      if (removed.has(id)) classes.push('is-wrong', 'is-discarded');
      return `<button class="${classes.join(' ')}" data-lie-vote="${escapeHtml(id)}" ${disabled ? 'disabled aria-disabled="true"' : ''}>
        <b>${lieOptionLabel(i)}</b>
        <span class="answer-copy">${escapeHtml(option.text || '')}</span>
        ${id === own ? '<span class="answer-tag choice">Tu mentira</span>' : ''}
        ${removed.has(id) ? '<span class="answer-tag">Descartada</span>' : ''}
      </button>`;
    }).join('');
    return `<h1 class="game-title">MENTIRA EXPRESS</h1><p class="subtitle">VOTA LA VERDAD · <span class="timer">${secondsLeft()}s</span></p><div class="glass-card game-card lie-card">
      <p class="player-meta">${meta}</p>
      <h2>${question}</h2>
      ${lieContextPanel(s, 'vote')}
      <div class="answers lie-options-grid">${buttons}</div>
      ${lieJokerPanel(s, voted, removed)}
      ${roundFeedbackHtml()}
    </div>`;
  }
  const submitted = Boolean(s.yourFakeAnswer);
  const form = `<form data-fake class="lie-form">
    <input name="fake" maxlength="100" placeholder="Ej: una respuesta falsa, pero con pinta de real..." autocomplete="off" required>
    <input name="doubleBluff" type="hidden" value="0">
    <button type="button" class="lie-bluff-toggle" data-lie-bluff aria-pressed="false">
      <span class="lie-joker-icon">🎭</span>
      <span class="lie-joker-copy">
        <strong>Doble farol</strong>
        <small>Actívalo si quieres arriesgar: tu mentira vale más si alguien cae, pero pierdes 25 pts si nadie la vota.</small>
      </span>
    </button>
    <button class="primary-btn">ENVIAR MENTIRA</button>
  </form>`;
  return `<h1 class="game-title">MENTIRA EXPRESS</h1><p class="subtitle">INVENTA UNA RESPUESTA · <span class="timer">${secondsLeft()}s</span></p><div class="glass-card game-card lie-card">
    <p class="player-meta">${meta}</p>
    <h2>${question}</h2>
    ${lieContextPanel(s, 'write')}
    ${submitted ? lieSubmittedPanel(s) : form}
  </div>`;
}
function forbiddenActionLabel(action) {
  return ({ press: 'PULSAR', wait: 'AGUANTAR', shield: 'BLINDAJE', secret: 'DECIDIDO' }[action] || 'SIN DECIDIR');
}
function forbiddenActionIcon(action) {
  return ({ press: '🔴', wait: '🧊', shield: '🛡', secret: '✓' }[action] || '•');
}
function forbiddenChoiceForSelf(s) {
  const key = String(Number(s.current || 0));
  return s.yourForbiddenChoice || s.choices?.[key]?.[playerIdKey()] || null;
}
function forbiddenScoreRows(s) {
  const scores = s.scores || {};
  return state.players.map((p) => ({ ...p, miniScore: Number(scores[p.id] || 0) })).sort((a, b) => b.miniScore - a.miniScore);
}
function forbiddenPlayerChips(s) {
  const key = String(Number(s.current || 0));
  const choices = s.choices?.[key] || {};
  return `<div class="forbidden-player-chips">${state.players.map((p) => {
    const choice = choices[p.id];
    const own = String(p.id) === playerIdKey();
    const action = choice?.action || '';
    return `<span class="forbidden-player-chip ${choice ? 'ready' : ''} ${own ? 'you' : ''}">${escapeHtml(p.name)} · ${choice ? `${forbiddenActionIcon(own ? action : 'secret')} ${own ? forbiddenActionLabel(action) : 'Decidido'}` : 'Pensando'}</span>`;
  }).join('')}</div>`;
}
function forbiddenTimerBar() {
  const round = state.round || {};
  const total = Math.max(1, Number(round.state?.durationMs || 14000));
  const pct = Math.max(0, Math.min(100, (msLeft() / total) * 100));
  return `<div class="forbidden-timerbar"><span style="width:${pct}%"></span></div>`;
}
function forbiddenMiniRanking(s) {
  const rows = forbiddenScoreRows(s).slice(0, 4);
  return `<div class="forbidden-mini-ranking">${rows.map((p, i) => `<div class="forbidden-rank ${String(p.id) === playerIdKey() ? 'you' : ''}"><span>${i + 1}</span><strong>${escapeHtml(p.name)}</strong><b>${Number(p.miniScore || 0)} pts</b></div>`).join('')}</div>`;
}
function renderForbiddenPress(s, button) {
  const choice = forbiddenChoiceForSelf(s);
  const action = choice?.action || '';
  const scan = s.scannerResult;
  const actionCards = [
    ['press', '🔴', 'PULSAR', 'Arriesga. Puede dar premio, jackpot o castigo fuerte.'],
    ['wait', '🧊', 'AGUANTAR', 'No tocas nada. Gana contra trampas, bombas y rondas de paciencia.'],
    ['shield', '🛡', 'BLINDAJE', 'Te cubres. Menos premio, pero reduce sustos si dudas.'],
  ].map(([id, icon, title, desc]) => `<button class="forbidden-action ${id} ${action === id ? 'selected' : ''}" data-forbidden-action="${id}"><span>${icon}</span><strong>${title}</strong><small>${desc}</small></button>`).join('');
  return `<h1 class="game-title compact-title forbidden-title">BOTÓN PROHIBIDO</h1><p class="subtitle compact-subtitle">RONDA ${Number(s.current || 0) + 1}/${Number(s.total || 1)} · decide en <span class="timer">${secondsLeft()}s</span></p>
  <div class="glass-card game-card forbidden-card forbidden-press-card">
    ${forbiddenTimerBar()}
    <section class="forbidden-hero">
      <div class="forbidden-big-button" aria-hidden="true"><span>!</span><b>NO LO PULSES</b></div>
      <div class="forbidden-info">
        <div class="forbidden-topline"><span>Riesgo: ${escapeHtml(button.risk || '?')}</span><span>${escapeHtml(button.name || 'Botón misterioso')}</span></div>
        <h2>${escapeHtml(button.clue || 'Algo no encaja.')}</h2>
        <p><b>Objetivo:</b> acaba con más puntos. Lee la pista y decide: pulsar, aguantar o blindarte.</p>
        <p><b>Consejo:</b> ${escapeHtml(button.hint || 'Si parece trampa, aguanta. Si parece premio, pulsa. Si dudas, usa blindaje.')}</p>
      </div>
    </section>
    <section class="forbidden-actions-grid">${actionCards}</section>
    <section class="forbidden-tools-row">
      <button class="lie-joker-card forbidden-tool" data-forbidden-tool="scan" ${!s.canUseScanner ? 'disabled aria-disabled="true"' : ''}><span class="lie-joker-icon">🔎</span><span class="lie-joker-copy"><strong>Escáner</strong><small>Una vez por partida · te orienta sin revelar todo.</small></span></button>
      <button class="lie-joker-card forbidden-tool" data-forbidden-action="lock" ${!s.canUseLock || choice ? 'disabled aria-disabled="true"' : ''}><span class="lie-joker-icon">🔒</span><span class="lie-joker-copy"><strong>Candado</strong><small>Te fuerza a aguantar esta ronda y suma autocontrol.</small></span></button>
      <div class="forbidden-status-box"><strong>${choice ? `Tu decisión: ${forbiddenActionIcon(action)} ${forbiddenActionLabel(action)}` : 'Tu decisión: pendiente'}</strong><small>${choice ? 'Puedes cambiar de acción mientras quede tiempo.' : 'Elige una de las tres acciones grandes.'}</small></div>
    </section>
    ${scan ? `<div class="forbidden-scan-result">${escapeHtml(scan)}</div>` : ''}
    ${forbiddenPlayerChips(s)}
    ${forbiddenMiniRanking(s)}
  </div>`;
}
function renderForbiddenReveal(s) {
  const result = s.lastOutcome || {};
  const button = result.button || s.currentButton || {};
  const rows = result.rows || [];
  const best = result.best || null;
  const rowHtml = rows.map((row) => `<div class="forbidden-result-row ${row.tone || 'info'} ${String(row.playerId) === playerIdKey() ? 'you' : ''}"><span>${escapeHtml(row.icon || '•')}</span><strong>${escapeHtml(row.name || playerNameById(row.playerId))}</strong><em>${escapeHtml(row.actionLabel || '')}${row.elapsedMs !== null && row.elapsedMs !== undefined ? ` · ${(Number(row.elapsedMs) / 1000).toFixed(1)}s` : ''}</em><b>${Number(row.points || 0) >= 0 ? '+' : ''}${Number(row.points || 0)}</b><small>${escapeHtml(row.title || '')}: ${escapeHtml(row.text || '')}</small></div>`).join('');
  return `<h1 class="game-title compact-title forbidden-title">BOTÓN PROHIBIDO</h1><p class="subtitle compact-subtitle">REVELACIÓN · siguiente en <span class="timer">${secondsLeft()}s</span></p>
  <div class="glass-card game-card forbidden-card forbidden-reveal-card">
    <div class="forbidden-reveal-head">
      <div><span>${escapeHtml(result.kindTitle || 'Botón revelado')}</span><h2>${escapeHtml(button.name || 'Botón misterioso')}</h2><p>${escapeHtml(button.clue || '')}</p></div>
      <div class="forbidden-reveal-badge ${best && Number(best.points || 0) >= 0 ? 'good' : 'bad'}"><strong>${best ? `${escapeHtml(best.name || '')}` : 'Ronda resuelta'}</strong><small>${best ? `${Number(best.points || 0) >= 0 ? '+' : ''}${Number(best.points || 0)} pts` : ''}</small></div>
    </div>
    <div class="forbidden-explain"><b>Qué era:</b> ${escapeHtml(result.kindTitle || 'Botón oculto')}. <span>${escapeHtml(result.explanation || button.explanation || 'La pista se revela ahora para que aprendas a leer el botón.')}</span></div>
    <div class="forbidden-result-list">${rowHtml}</div>
    ${forbiddenMiniRanking(s)}
  </div>`;
}
function renderForbiddenFinal(s) {
  const rows = s.finalRows || forbiddenScoreRows(s).map((p) => ({ playerId: p.id, name: p.name, points: p.miniScore }));
  const medals = s.medals || {};
  const medalText = [
    medals.winner ? `👑 Dedo prohibido: ${medals.winner.name}` : '',
    medals.coldBlood ? `🧊 Sangre fría: ${medals.coldBlood.name}` : '',
    medals.clickAddict ? `🔴 Adicto al click: ${medals.clickAddict.name}` : '',
    medals.shield ? `🛡 Escudo humano: ${medals.shield.name}` : '',
    medals.victim ? `💥 Víctima del botón: ${medals.victim.name}` : '',
  ].filter(Boolean);
  return `<div class="round-review glass-card forbidden-final-card"><h3>Fin del Botón Prohibido</h3><h2>${escapeHtml(medals.winner?.name || rows[0]?.name || 'Botón cerrado')}</h2><p>Gana quien leyó mejor las pistas, eligió cuándo pulsar y cuándo aguantar.</p><div class="forbidden-final-ranking">${rows.map((row, i) => `<div class="forbidden-final-row ${String(row.playerId) === playerIdKey() ? 'you' : ''}"><span>${i + 1}</span><strong>${escapeHtml(row.name || playerNameById(row.playerId))}</strong><em>${Number(row.presses || 0)} clicks · ${Number(row.waits || 0)} aguantes · ${Number(row.shields || 0)} blindajes</em><b>${Number(row.points || 0)} pts</b></div>`).join('')}</div>${medalText.length ? `<div class="lie-medals forbidden-medals">${medalText.map((m) => `<span>${escapeHtml(m)}</span>`).join('')}</div>` : ''}</div>`;
}
function renderForbiddenButton() {
  const s = state.round?.state || {};
  const phase = state.round?.phase || 'press';
  const button = s.currentButton || {};
  if (phase === 'reveal') return renderForbiddenReveal(s);
  if (phase === 'results') return renderForbiddenFinal(s);
  return renderForbiddenPress(s, button);
}

function renderUnsupported() {
  return '<div class="glass-card game-card"><h1 class="game-title">MODO NO SOPORTADO</h1><p>Vuelve al lobby y elige otro minijuego.</p></div>';
}

function bindCommon() {
  app.querySelector('[data-copy-code]')?.addEventListener('click', () => navigator.clipboard?.writeText(state.room.code));
  app.querySelector('[data-leave-room]')?.addEventListener('click', () => {
    clearSession();
    renderHome();
  });
  app.querySelector('[data-finish-round]')?.addEventListener('click', () => hostAction('backToLobby'));
  app.querySelector('[data-chat]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = form.message.value.trim();
    if (!message) return;
    try {
      await api('sendChat', { message });
      form.reset();
      render();
    } catch (err) {
      toast(err.message);
    }
  });
}

function markSelectionPending(btn) {
  btn.closest('.answers')?.querySelectorAll('button').forEach((item) => {
    item.disabled = true;
    item.setAttribute('aria-disabled', 'true');
  });
  btn.classList.add('is-selected', 'is-pending');
}

function bindGameActions() {
  app.querySelector('[data-lie-bluff]')?.addEventListener('click', (event) => {
    const btn = event.currentTarget;
    const form = btn.closest('form');
    const input = form?.elements?.doubleBluff;
    const active = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.classList.toggle('active', active);
    if (input) input.value = active ? '1' : '0';
  });
  app.querySelector('[data-clue]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const clue = form.clue.value.trim();
    if (clue) submitPayload({ clue });
  });
  app.querySelector('[data-fake]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fake = form.fake.value.trim();
    const doubleBluff = form.doubleBluff?.value === '1' || Boolean(form.doubleBluff?.checked);
    if (fake) submitPayload({ fake, doubleBluff });
  });
  app.querySelectorAll('[data-vote]').forEach((btn) => btn.addEventListener('click', () => {
    markSelectionPending(btn);
    const wordGuess = app.querySelector('[data-word-guess]')?.value?.trim() || '';
    submitPayload({ vote: Number(btn.dataset.vote), wordGuess });
  }));
  app.querySelectorAll('[data-answer]').forEach((btn) => btn.addEventListener('click', () => { markSelectionPending(btn); submitPayload({ answer: Number(btn.dataset.answer) }); }));
  app.querySelectorAll('[data-auction-bid-chip]').forEach((btn) => btn.addEventListener('click', () => {
    const input = app.querySelector('[data-auction-bid]');
    const credits = auctionCreditsFor();
    const value = btn.dataset.auctionBidChip === 'all' ? credits : Number(btn.dataset.auctionBidChip || 0);
    if (input) {
      const v = Math.max(0, Math.min(credits, value));
      input.value = String(v);
      auctionDraft.bid = v;
      app.querySelector('[data-auction-live-bid]')?.replaceChildren(document.createTextNode(String(v)));
      app.querySelector('[data-auction-bid-meaning]')?.replaceChildren(document.createTextNode(auctionBidMeaning(v, credits)));
    }
  }));
  app.querySelector('[data-auction-bid]')?.addEventListener('input', (event) => {
    const credits = auctionCreditsFor();
    const v = Math.max(0, Math.min(credits, Number(event.currentTarget.value || 0)));
    auctionDraft.bid = v;
    app.querySelector('[data-auction-live-bid]')?.replaceChildren(document.createTextNode(String(v)));
    app.querySelector('[data-auction-bid-meaning]')?.replaceChildren(document.createTextNode(auctionBidMeaning(v, credits)));
  });
  app.querySelector('[data-auction-stance]')?.addEventListener('change', (event) => { auctionDraft.stance = event.currentTarget.value || 'Secreto'; });
  app.querySelector('[data-auction-insurance]')?.addEventListener('click', (event) => {
    const btn = event.currentTarget;
    const active = btn.dataset.active === '1';
    btn.dataset.active = active ? '0' : '1';
    btn.classList.toggle('active', !active);
    auctionDraft.insurance = !active;
    app.querySelector('[data-auction-live-insurance]')?.replaceChildren(document.createTextNode(!active ? 'Sí' : 'No'));
  });
  app.querySelector('[data-auction-analyze]')?.addEventListener('click', (event) => {
    event.currentTarget.disabled = true;
    submitPayload({ auctionAction: 'analyze' });
  });
  app.querySelector('[data-auction-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const credits = auctionCreditsFor();
    const bid = Math.max(0, Math.min(credits, Number(form.querySelector('[data-auction-bid]')?.value || 0)));
    auctionDraft.bid = bid;
    const insurance = form.querySelector('[data-auction-insurance]')?.dataset.active === '1';
    auctionDraft.insurance = insurance;
    const stanceSelect = form.querySelector('[data-auction-stance]');
    const stance = stanceSelect?.value || 'Secreto';
    auctionDraft.stance = stance;
    submitPayload({ auctionAction: 'bid', bid, insurance, stance });
  });
  app.querySelectorAll('[data-boss]').forEach((btn) => btn.addEventListener('click', () => {
    markSelectionPending(btn);
    app.querySelectorAll('[data-boss]').forEach((other) => { if (other !== btn) other.disabled = true; });
    btn.classList.add('is-pressed');
    setTimeout(() => btn.classList.remove('is-pressed'), 260);
    submitPayload({ move: btn.dataset.boss });
  }));
  app.querySelectorAll('[data-forbidden-action]').forEach((btn) => btn.addEventListener('click', () => { markSelectionPending(btn); submitPayload({ forbiddenAction: btn.dataset.forbiddenAction }); }));
  app.querySelectorAll('[data-forbidden-tool]').forEach((btn) => btn.addEventListener('click', () => { btn.disabled = true; submitPayload({ forbiddenTool: btn.dataset.forbiddenTool }); }));
  app.querySelectorAll('[data-lie-vote]').forEach((btn) => btn.addEventListener('click', () => { markSelectionPending(btn); submitPayload({ vote: btn.dataset.lieVote }); }));
  app.querySelectorAll('[data-lie-joker]').forEach((btn) => btn.addEventListener('click', () => { btn.disabled = true; submitPayload({ joker: btn.dataset.lieJoker }); }));
  app.querySelectorAll('[data-quiz-joker]').forEach((btn) => btn.addEventListener('click', () => { btn.disabled = true; submitPayload({ joker: btn.dataset.quizJoker }); }));
  app.querySelector('[data-rhythm-start]')?.addEventListener('click', startRhythmLocal);
  app.querySelector('[data-rhythm-hit]')?.addEventListener('click', rhythmHit);
  app.querySelector('[data-rhythm-submit]')?.addEventListener('click', finishRhythmLocal);
  app.querySelector('[data-rhythm-pause]')?.addEventListener('click', toggleRhythmPause);
  app.querySelector('[data-rhythm-volume]')?.addEventListener('input', (event) => {
    localStorage.setItem('party_music_volume', event.currentTarget.value);
    if (rhythm?.audio) rhythm.audio.volume = Number(event.currentTarget.value);
  });
  app.querySelector('[data-rhythm-track]')?.addEventListener('change', (event) => {
    localStorage.setItem('party_music_track', event.currentTarget.value);
    if (rhythm) {
      stopRhythm();
      startRhythmLocal();
    } else {
      render();
    }
  });
}

async function submitFormValue(event, key) {
  event.preventDefault();
  const value = event.currentTarget[key].value.trim();
  if (value) await submitPayload({ [key]: value });
}

async function submitPayload(payload) {
  try {
    await api('submitAction', { payload });
    if (state?.round?.mode === 'boss-coop' && bossAllOnlineChoseLocal()) {
      await api('bossTick');
    }
    const feedback = roundFeedback();
    render();
    if (feedback) toast(`${feedback.title}${feedback.message ? `: ${feedback.message}` : ''}`);
  } catch (err) {
    toast(err.message);
  }
}

async function hostAction(action, payload = {}) {
  try {
    await api(action, payload);
    if (state?.round?.mode === 'boss-coop' && bossAllOnlineChoseLocal()) {
      await api('bossTick');
    }
    render();
  } catch (err) {
    toast(err.message);
  }
}

async function finishExpiredRound() {
  if (!roundExpired() || autoFinishing) return false;
  autoFinishing = true;
  try {
    if (state?.round?.mode === 'boss-coop') {
      // En Boss cualquier cliente puede pedir el tick seguro: el servidor solo resuelve
      // si el turno ha terminado o si ya eligieron los jugadores online.
      await api('bossTick');
    } else if (['quiz', 'subasta', 'boton-prohibido'].includes(state?.round?.mode)) {
      await api('getState');
    } else if (isHost()) {
      await api('finishRound');
    } else {
      await api('getState');
    }
    return true;
  } catch (err) {
    toast(err.message);
    return false;
  } finally {
    autoFinishing = false;
  }
}

function startPoll() {
  stopPoll();
  startTimerUi();
  pollId = setInterval(async () => {
    if (!session().code || !session().playerToken || rhythm) return;
    try {
      await api('getState');
      if (state?.round?.mode === 'boss-coop' && bossAllOnlineChoseLocal()) await api('bossTick');
      const didFinish = await finishExpiredRound();
      if (didFinish || !activeEditor()) render();
    } catch (err) {
      clearSession();
      renderHome();
      toast('La sala ya no esta disponible. Sesion limpiada.');
    }
  }, 1800);
}

function stopPoll() {
  if (pollId) clearInterval(pollId);
  pollId = null;
}

function startTimerUi() {
  stopTimerUi();
  timerUiId = setInterval(async () => {
    app.querySelectorAll('.timer').forEach((el) => {
      el.textContent = `${secondsLeft()}s`;
    });
    if (roundExpired()) {
      const didFinish = await finishExpiredRound();
      if (didFinish) render();
    }
  }, 250);
}

function stopTimerUi() {
  if (timerUiId) clearInterval(timerUiId);
  timerUiId = null;
}

function stopRhythm() {
  rhythm?.stop?.();
  rhythm = null;
}

function updateRhythmStats() {
  const stats = app.querySelector('[data-rhythm-stats]');
  if (!stats || !rhythm) return;
  const accuracy = rhythm.hits ? Math.round((rhythm.goodHits / rhythm.hits) * 100) : 0;
  stats.textContent = `Score ${rhythm.score} - Combo ${rhythm.combo} - Precision ${accuracy}%`;
}

function startRhythmLocal() {
  if (rhythm) return;
  stopPoll();
  const track = currentMusicTrack();
  const audio = app.querySelector('[data-rhythm-audio]');
  const pulse = app.querySelector('[data-pulse]');
  const judge = app.querySelector('[data-judge]');
  const beatMs = 60000 / track.bpm;
  rhythm = {
    audio,
    beatMs,
    lastBeat: performance.now(),
    score: 0,
    combo: 0,
    bestCombo: 0,
    hits: 0,
    goodHits: 0,
    timer: null,
    deadlineTimer: null,
    stop() {
      clearInterval(this.timer);
      clearTimeout(this.deadlineTimer);
      this.audio?.pause();
    },
  };
  const tick = () => {
    if (!rhythm) return;
    rhythm.lastBeat = performance.now();
    pulse?.style.setProperty('--scale', '1.9');
    setTimeout(() => pulse?.style.setProperty('--scale', '1'), 95);
  };
  rhythm.timer = setInterval(tick, beatMs);
  tick();
  if (audio) {
    audio.currentTime = 20;
    audio.volume = Number(localStorage.getItem('party_music_volume') || 0.82);
    audio.play().catch(() => toast('Pulsa otra vez para activar el audio.'));
  }
  judge.textContent = 'PLAY';
  updateRhythmStats();
  rhythm.deadlineTimer = setTimeout(() => {
    if (rhythm) finishRhythmLocal();
  }, Math.max(1000, secondsLeft() * 1000));
}

function rhythmHit() {
  if (!rhythm) startRhythmLocal();
  if (!rhythm) return;
  const judge = app.querySelector('[data-judge]');
  const elapsed = performance.now() - rhythm.lastBeat;
  const delta = Math.min(Math.abs(elapsed), Math.abs(rhythm.beatMs - elapsed));
  rhythm.hits += 1;
  if (delta < 85) {
    rhythm.combo += 1;
    rhythm.goodHits += 1;
    rhythm.score += 1000 + rhythm.combo * 35;
    judge.textContent = 'PERFECT';
  } else if (delta < 155) {
    rhythm.combo += 1;
    rhythm.goodHits += 1;
    rhythm.score += 520 + rhythm.combo * 18;
    judge.textContent = 'GOOD';
  } else {
    rhythm.combo = 0;
    rhythm.score = Math.max(0, rhythm.score - 120);
    judge.textContent = 'MISS';
  }
  rhythm.bestCombo = Math.max(rhythm.bestCombo, rhythm.combo);
  updateRhythmStats();
}

function toggleRhythmPause() {
  if (!rhythm) {
    startRhythmLocal();
    return;
  }
  const button = app.querySelector('[data-rhythm-pause]');
  if (rhythm.audio?.paused) {
    rhythm.audio.play().catch(() => toast('Pulsa otra vez para activar el audio.'));
    rhythm.timer = rhythm.timer || setInterval(() => {
      if (!rhythm) return;
      rhythm.lastBeat = performance.now();
      app.querySelector('[data-pulse]')?.style.setProperty('--scale', '1.9');
      setTimeout(() => app.querySelector('[data-pulse]')?.style.setProperty('--scale', '1'), 95);
    }, rhythm.beatMs);
    if (button) button.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSA';
  } else {
    rhythm.audio?.pause();
    clearInterval(rhythm.timer);
    rhythm.timer = null;
    if (button) button.innerHTML = '<i class="fa-solid fa-play"></i> SEGUIR';
  }
}

async function finishRhythmLocal() {
  if (!rhythm) {
    toast('Primero reproduce la cancion.');
    return;
  }
  const accuracy = rhythm.hits ? Math.round((rhythm.goodHits / rhythm.hits) * 100) : 0;
  const payload = { score: rhythm.score, accuracy, combo: rhythm.bestCombo };
  stopRhythm();
  startPoll();
  await submitPayload(payload);
}

function render() {
  const status = state?.room?.status || 'lobby';
  if (status === 'playing') renderGame();
  else if (status === 'results') renderResults();
  else renderLobby();
}

saveApiUrl?.addEventListener('click', (event) => {
  event.preventDefault();
  const value = normalizeApiUrl(apiUrlInput.value);
  localStorage.setItem('party_api_url', value);
  apiUrlInput.value = value;
  settingsDialog.close();
  toast(value === DEFAULT_PARTY_API_URL ? 'API restaurada al Worker recomendado.' : 'API guardada.');
});

(async function boot() {
  if (!session().code || !session().playerToken) {
    renderHome();
    return;
  }
  try {
    await api('getState');
    startPoll();
    render();
  } catch {
    clearSession();
    renderHome();
  }
}());
