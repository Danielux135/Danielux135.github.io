const MODES = [
  { id: 'impostor', title: 'Impostor de Palabras', desc: 'Pistas, sospechas y voto final', icon: 'fa-solid fa-mask' },
  { id: 'bug-race', title: 'Carrera de Bugs', desc: 'Encuentra el arreglo correcto', icon: 'fa-solid fa-bug' },
  { id: 'boss-coop', title: 'Boss Cooperativo', desc: 'Ataques sincronizados contra el jefe', icon: 'fa-solid fa-dragon' },
  { id: 'rhythm-royale', title: 'Rhythm Royale', desc: 'Acierta el beat de canciones reales', icon: 'fa-solid fa-music' },
  { id: 'mentira', title: 'Mentira Express', desc: 'Cuela una mentira convincente', icon: 'fa-solid fa-comment-dots' },
  { id: 'quiz', title: 'Quiz Relampago', desc: 'Respuesta rapida, puntos rapidos', icon: 'fa-solid fa-bolt' },
  { id: 'boton-prohibido', title: 'Boton Prohibido', desc: 'Riesgo, premio y caos controlado', icon: 'fa-solid fa-bomb' },
  { id: 'subasta', title: 'Subasta de Puntos', desc: 'Apuesta si estas seguro', icon: 'fa-solid fa-gavel' },
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

let state = null;
let pollId = null;
let rhythm = null;
let selectedMode = localStorage.getItem('party_selected_mode') || 'impostor';
let excludedModes = new Set(JSON.parse(localStorage.getItem('party_excluded_modes') || '[]'));
let autoFinishing = false;
let lastServerNowMs = Date.now();
let lastSyncAtMs = Date.now();
let timerUiId = null;

function defaultApiUrl() {
  return localStorage.getItem('party_api_url') || 'https://danielux-api-proxy.dlux135.workers.dev/api/party';
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

function secondsLeft() {
  const ends = Number(state?.round?.endsAtMs || 0);
  const now = lastServerNowMs + (Date.now() - lastSyncAtMs);
  return Math.max(0, Math.ceil((ends - now) / 1000));
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
  return WORD_ALIASES[word] || word || '???';
}

function playableModes() {
  const modes = MODES.filter((mode) => !excludedModes.has(mode.id));
  return modes.length ? modes : MODES;
}

function saveExcludedModes() {
  localStorage.setItem('party_excluded_modes', JSON.stringify([...excludedModes]));
}

function nextModeId() {
  const current = state?.round?.mode || state?.room?.currentMode || selectedMode;
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
  const initial = escapeHtml((player.name || '?').slice(0, 1).toUpperCase());
  return `<span class="avatar ${escapeHtml(player.avatar || 'bot-cyan')}">${initial}</span>`;
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
  const mode = modeInfo(state?.room?.currentMode || selectedMode);
  app.innerHTML = `<section class="layout">
    ${playersPanel()}
    <main class="game-shell">
      ${roomHeader()}
      <h1 class="screen-title">PARTY ARENA</h1>
      <p class="subtitle">SALA ONLINE - ${MODES.length} MINIJUEGOS</p>
      <h2 class="panel-title" style="justify-content:center">Ronda unica: ${escapeHtml(mode.title)} · Rotacion: ${playableModes().length}/${MODES.length}</h2>
      ${modeCards()}
      <div class="big-actions">
        ${isHost() ? '<button class="primary-btn" data-start-round><i class="fa-solid fa-play"></i> JUGAR SELECCIONADO</button><button class="secondary-btn" data-start-next><i class="fa-solid fa-shuffle"></i> SIGUIENTE DE ROTACION</button><button class="secondary-btn" data-reset><i class="fa-solid fa-rotate"></i> REINICIAR PUNTOS</button>' : '<p>Esperando al host...</p>'}
      </div>
    </main>
    ${rankingPanel()}
  </section>`;
  bindCommon();
  app.querySelectorAll('[data-mode]').forEach((btn) => btn.addEventListener('click', async () => {
    selectedMode = btn.dataset.mode;
    localStorage.setItem('party_selected_mode', selectedMode);
    try {
      if (isHost()) await api('setMode', { mode: selectedMode });
    } catch (err) {
      toast(err.message);
    }
    render();
  }));
  app.querySelectorAll('[data-exclude-mode]').forEach((input) => input.addEventListener('change', () => {
    if (input.checked) excludedModes.add(input.dataset.excludeMode);
    else excludedModes.delete(input.dataset.excludeMode);
    saveExcludedModes();
    render();
  }));
  app.querySelector('[data-start-round]')?.addEventListener('click', () => hostAction('startRound', { mode: selectedMode }));
  app.querySelector('[data-start-next]')?.addEventListener('click', () => {
    selectedMode = nextModeId();
    localStorage.setItem('party_selected_mode', selectedMode);
    hostAction('startRound', { mode: selectedMode });
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
  app.innerHTML = `<section class="layout">${playersPanel()}<main class="results-card glass-card">
    <h1 class="game-title">RESULTADOS</h1>
    <p class="subtitle">${escapeHtml(mode.title)} - Siguiente: ${escapeHtml(next.title)}</p>
    <div class="ranking-list">${sortedPlayers().map((p, i) => `<div class="rank-row"><span class="rank-no">${i + 1}</span><strong>${escapeHtml(p.name)}</strong><span class="score">${p.score || 0}</span></div>`).join('')}</div>
    <div class="big-actions">${isHost() ? '<button class="primary-btn" data-repeat-round><i class="fa-solid fa-repeat"></i> REPETIR MINIJUEGO</button><button class="secondary-btn" data-next-round><i class="fa-solid fa-forward"></i> SIGUIENTE DE ROTACION</button><button class="secondary-btn" data-back-lobby><i class="fa-solid fa-house"></i> VOLVER AL LOBBY</button>' : '<p>Esperando al host...</p>'}</div>
  </main>${rankingPanel()}</section>`;
  bindCommon();
  app.querySelector('[data-back-lobby]')?.addEventListener('click', () => hostAction('backToLobby'));
  app.querySelector('[data-repeat-round]')?.addEventListener('click', () => hostAction('startRound', { mode: state?.round?.mode || selectedMode }));
  app.querySelector('[data-next-round]')?.addEventListener('click', () => {
    selectedMode = nextModeId();
    localStorage.setItem('party_selected_mode', selectedMode);
    hostAction('startRound', { mode: selectedMode });
  });
}

function renderImpostor() {
  const s = state.round?.state || {};
  if (state.round?.phase === 'vote') {
    return `<h1 class="game-title">IMPOSTOR</h1><p class="subtitle">VOTACION - <span class="timer">${secondsLeft()}s</span></p><div class="glass-card game-card">
      ${(state.players || []).map((p) => `<p><strong>${escapeHtml(p.name)}:</strong> ${escapeHtml(s.clues?.[p.id] || '-')}</p>`).join('')}
      <div class="answers">${(state.players || []).map((p) => `<button class="answer-btn" data-vote="${p.id}">${avatarHtml(p)} ${escapeHtml(p.name)}</button>`).join('')}</div>
    </div>`;
  }
  return `<h1 class="game-title">IMPOSTOR</h1><p class="subtitle">PISTA - <span class="timer">${secondsLeft()}s</span></p><div class="glass-card game-card">
    <p>Tu palabra</p><div class="secret-word">${escapeHtml(displayWord(s.yourWord))}</div>
    <form data-clue><input name="clue" maxlength="60" placeholder="Escribe una pista" autocomplete="off" required><button class="primary-btn"><i class="fa-solid fa-paper-plane"></i> ENVIAR</button></form>
  </div>`;
}

function answerButtons(options, attr = 'data-answer') {
  return `<div class="answers">${(options || []).map((op, i) => `<button class="answer-btn" ${attr}="${i}"><b>${'ABCD'[i] || i + 1}</b>${escapeHtml(op)}</button>`).join('')}</div>`;
}

function renderBugRace() {
  const c = state.round?.state?.challenge || {};
  return `<h1 class="game-title">CARRERA DE BUGS</h1><p class="subtitle">ARREGLA EL CODIGO - <span class="timer">${secondsLeft()}s</span></p><div class="glass-card game-card">
    <span class="code-lang">${escapeHtml(c.lang || 'JS')}</span>
    <pre class="code-box">${escapeHtml(c.code || c.question || 'Selecciona la respuesta correcta')}</pre>
    ${answerButtons(c.options)}
  </div>`;
}

function renderQuiz() {
  const c = state.round?.state?.challenge || {};
  return `<h1 class="game-title">QUIZ RELAMPAGO</h1><p class="subtitle">RESPONDE RAPIDO - <span class="timer">${secondsLeft()}s</span></p><div class="glass-card game-card">
    <h2>${escapeHtml(c.question || 'Pregunta rapida')}</h2>
    ${answerButtons(c.options)}
  </div>`;
}

function renderAuction() {
  const c = state.round?.state?.challenge || {};
  return `<h1 class="game-title">SUBASTA</h1><p class="subtitle">APUESTA Y RESPONDE - <span class="timer">${secondsLeft()}s</span></p><div class="glass-card game-card">
    <h2>${escapeHtml(c.question || 'Pregunta de subasta')}</h2>
    <label>Tu apuesta</label>
    <input data-wager type="number" min="100" max="500" step="50" value="200">
    ${answerButtons(c.options, 'data-auction-answer')}
  </div>`;
}

function renderBoss() {
  const s = state.round?.state || {};
  const hp = Number(s.hp || 0);
  const max = Number(s.maxHp || 1);
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  return `<h1 class="game-title">BOSS COOPERATIVO</h1><p class="subtitle">DERROTA AL JEFE - <span class="timer">${secondsLeft()}s</span></p><div class="boss-arena">
    <h2><i class="fa-solid fa-skull"></i> ${escapeHtml(s.boss || 'EL BUG SUPREMO')}</h2>
    <div class="hp-bar"><div class="hp-fill" style="width:${pct}%"></div></div><strong>${hp} / ${max} HP</strong>
    <div class="boss-core"><i class="fa-solid fa-dragon"></i></div>
    <div class="boss-actions"><button data-boss="defend">DEFENDER</button><button data-boss="attack">ATACAR</button><button data-boss="boost">BOOST</button></div>
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
    <audio data-rhythm-audio preload="auto" src="../assets/music/${encodeURIComponent(track.file)}"></audio>
    <div class="big-actions"><button class="primary-btn" data-rhythm-start><i class="fa-solid fa-music"></i> REPRODUCIR CANCION</button><button class="secondary-btn" data-rhythm-hit><i class="fa-solid fa-bolt"></i> HIT</button><button class="secondary-btn" data-rhythm-submit><i class="fa-solid fa-check"></i> ENVIAR PUNTOS</button></div>
  </div>`;
}

function renderMentira() {
  const s = state.round?.state || {};
  if (state.round?.phase === 'vote') {
    const fake = Object.entries(s.fakeAnswers || {});
    return `<h1 class="game-title">MENTIRA EXPRESS</h1><p class="subtitle">VOTA LA REAL - <span class="timer">${secondsLeft()}s</span></p><div class="answers">
      <button class="answer-btn" data-lie-vote="real">La respuesta real</button>
      ${fake.map(([id, txt]) => `<button class="answer-btn" data-lie-vote="${id}">${escapeHtml(txt)}</button>`).join('')}
    </div>`;
  }
  return `<h1 class="game-title">MENTIRA EXPRESS</h1><p class="subtitle">INVENTA UNA RESPUESTA - <span class="timer">${secondsLeft()}s</span></p><div class="glass-card game-card">
    <p>${escapeHtml(s.question || 'Escribe una mentira convincente')}</p>
    <form data-fake><input name="fake" maxlength="100" placeholder="Tu mentira" autocomplete="off" required><button class="primary-btn">ENVIAR</button></form>
  </div>`;
}

function renderForbiddenButton() {
  const buttons = state.round?.state?.buttons || [];
  return `<h1 class="game-title">BOTON PROHIBIDO</h1><p class="subtitle">ELIGE UNO - <span class="timer">${secondsLeft()}s</span></p><div class="glass-card game-card">
    <div class="answers">${buttons.map((button, i) => `<button class="answer-btn" data-button="${i}"><i class="${escapeHtml(button.icon || 'fa-solid fa-circle')}"></i> ${escapeHtml(button.label || `Boton ${i + 1}`)}</button>`).join('')}</div>
  </div>`;
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

function bindGameActions() {
  app.querySelector('[data-clue]')?.addEventListener('submit', (event) => submitFormValue(event, 'clue'));
  app.querySelector('[data-fake]')?.addEventListener('submit', (event) => submitFormValue(event, 'fake'));
  app.querySelectorAll('[data-vote]').forEach((btn) => btn.addEventListener('click', () => submitPayload({ vote: Number(btn.dataset.vote) })));
  app.querySelectorAll('[data-answer]').forEach((btn) => btn.addEventListener('click', () => submitPayload({ answer: Number(btn.dataset.answer) })));
  app.querySelectorAll('[data-auction-answer]').forEach((btn) => btn.addEventListener('click', () => {
    const wager = Number(app.querySelector('[data-wager]')?.value || 200);
    submitPayload({ answer: Number(btn.dataset.auctionAnswer), wager });
  }));
  app.querySelectorAll('[data-boss]').forEach((btn) => btn.addEventListener('click', () => submitPayload({ move: btn.dataset.boss })));
  app.querySelectorAll('[data-button]').forEach((btn) => btn.addEventListener('click', () => submitPayload({ button: Number(btn.dataset.button) })));
  app.querySelectorAll('[data-lie-vote]').forEach((btn) => btn.addEventListener('click', () => submitPayload({ vote: btn.dataset.lieVote })));
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
    render();
  } catch (err) {
    toast(err.message);
  }
}

async function hostAction(action, payload = {}) {
  try {
    await api(action, payload);
    render();
  } catch (err) {
    toast(err.message);
  }
}

async function finishExpiredRound() {
  if (!roundExpired() || autoFinishing) return false;
  autoFinishing = true;
  try {
    if (isHost()) {
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
  const value = apiUrlInput.value.trim();
  if (value) localStorage.setItem('party_api_url', value);
  settingsDialog.close();
  toast('API guardada.');
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
