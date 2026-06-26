const MODES = [
  { id:'impostor', title:'Impostor de Palabras', desc:'Engaña y descubre', icon:'fa-solid fa-mask' },
  { id:'bug-race', title:'Carrera de Bugs', desc:'Código al límite', icon:'fa-solid fa-bug' },
  { id:'boss-coop', title:'Boss Cooperativo', desc:'Derrota al jefe', icon:'fa-solid fa-dragon' },
  { id:'rhythm-royale', title:'Rhythm Battle Royale', desc:'Ritmo y supervivencia', icon:'fa-solid fa-music' },
  { id:'mentira', title:'Mentira Express', desc:'Adivina o miente', icon:'fa-solid fa-comment-dots' },
];

const app = document.getElementById('app');
const tplHome = document.getElementById('tpl-home');
const settingsDialog = document.getElementById('settingsDialog');
const apiUrlInput = document.getElementById('apiUrlInput');
const saveApiUrl = document.getElementById('saveApiUrl');
let state = null;
let pollId = null;
let selectedMode = localStorage.getItem('party_selected_mode') || 'impostor';
let rhythm = null;

function defaultApiUrl(){
  const saved = localStorage.getItem('party_api_url');
  if (saved) return saved;
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return './api/party.php';
  return 'https://api.danielux.es/party.php';
}
function session(){
  return {
    code: localStorage.getItem('party_room_code') || '',
    playerToken: localStorage.getItem('party_player_token') || '',
    hostToken: localStorage.getItem('party_host_token') || '',
  };
}
function saveSession(res){
  if (res.room?.code) localStorage.setItem('party_room_code', res.room.code);
  if (res.playerToken) localStorage.setItem('party_player_token', res.playerToken);
  if (res.hostToken) localStorage.setItem('party_host_token', res.hostToken);
}
function clearSession(){
  localStorage.removeItem('party_room_code');
  localStorage.removeItem('party_player_token');
  localStorage.removeItem('party_host_token');
  state = null;
}
async function api(action, payload={}){
  const s = session();
  const res = await fetch(defaultApiUrl(), {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action, code:s.code, playerToken:s.playerToken, hostToken:s.hostToken, ...payload })
  });
  const json = await res.json().catch(()=>({ ok:false, error:'Respuesta no JSON del servidor.' }));
  if (!json.ok) throw new Error(json.error || 'Error de API');
  saveSession(json);
  state = json;
  return json;
}
function toast(msg){
  const el = document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el);
  setTimeout(()=>el.remove(), 3600);
}
function escapeHtml(s){ return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
function modeInfo(id){ return MODES.find(m=>m.id===id) || MODES[0]; }
function isHost(){ return !!state?.you?.isHost; }
function nowServer(){ return state?.serverNowMs || Date.now(); }
function msLeft(){ const e = state?.round?.endsAtMs; return e ? Math.max(0, e - nowServer()) : 0; }
function secondsLeft(){ return Math.ceil(msLeft()/1000); }
function sortedPlayers(){ return [...(state?.players||[])].sort((a,b)=>b.score-a.score || a.id-b.id); }
function avatarClass(p){ return `avatar ${escapeHtml(p.avatar || 'bot-blue')}`; }
function avatarHtml(p){ return `<div class="${avatarClass(p)}"><i class="fa-solid fa-robot"></i></div>`; }
function modeCards(){
  return `<div class="mode-carousel">${MODES.map(m=>`<button class="mode-card ${selectedMode===m.id?'active':''}" data-mode="${m.id}">
    <i class="${m.icon}"></i><h3>${m.title}</h3><p>${m.desc}</p></button>`).join('')}</div>`;
}
function playersPanel(){
  const players = state?.players || [];
  return `<aside class="panel"><h2 class="panel-title"><i class="fa-solid fa-users"></i> Jugadores (${players.length}/8)</h2>
    <div class="player-list">${players.map((p,i)=>`<div class="player-row">
      ${avatarHtml(p)}<div><div class="player-name">${escapeHtml(p.name)} ${p.is_host?'<span class="host-badge">HOST</span>':''}</div><div class="player-meta">${p.online?'Online':'Reconectando'} · ${p.score} pts</div></div>
      <span class="ready"><i class="fa-solid fa-check-circle"></i></span></div>`).join('') || '<p>Aún no hay jugadores.</p>'}</div>
  </aside>`;
}
function rankingPanel(){
  const ranks = sortedPlayers();
  const chat = state?.chat || [];
  return `<aside class="panel"><h2 class="panel-title"><i class="fa-solid fa-trophy"></i> Ranking Global</h2>
    <div class="ranking-list">${ranks.map((p,i)=>`<div class="rank-row"><span class="rank-no">${i+1}</span><div><strong>${escapeHtml(p.name)}</strong><div class="player-meta">${p.damage?`${p.damage} daño · `:''}${p.online?'online':'offline'}</div></div><span class="score">${p.score}</span></div>`).join('') || '<p>Sin puntuaciones.</p>'}</div>
    <div class="chat-box"><h2 class="panel-title"><i class="fa-regular fa-comments"></i> Chat de sala</h2>
      <div class="chat-log">${chat.map(m=>`<div class="chat-msg"><strong>${escapeHtml(m.name || 'Sistema')}:</strong> ${escapeHtml(m.message)}</div>`).join('') || '<div class="player-meta">Sin mensajes todavía.</div>'}</div>
      <form class="chat-form"><input name="message" maxlength="220" placeholder="Escribe un mensaje…"><button class="icon-btn"><i class="fa-solid fa-paper-plane"></i></button></form>
    </div></aside>`;
}
function roomHeader(){
  return `<div class="room-code-box"><small>CÓDIGO DE SALA</small><div class="room-code">${escapeHtml(state?.room?.code||'----')}</div><p>Comparte este código con la clase <button class="icon-btn" data-copy-code title="Copiar"><i class="fa-regular fa-copy"></i></button></p></div>`;
}
function renderHome(){
  stopPoll(); rhythm?.stop?.(); rhythm = null;
  app.innerHTML = tplHome.innerHTML + `<p class="footer-note">Demo from Daniel Bort Guzmán · <a href="https://danielux135.github.io/">Portfolio</a></p>`;
  app.querySelectorAll('form[data-action]').forEach(form=>form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = new FormData(form); const name = data.get('name');
    try {
      const action = form.dataset.action;
      if (action === 'create') await api('createRoom', { name });
      else await api('joinRoom', { name, code:String(data.get('code')||'').toUpperCase() });
      startPoll(); render();
    } catch(err){ toast(err.message); }
  }));
  app.querySelector('[data-open-settings]')?.addEventListener('click',()=>{
    apiUrlInput.value = defaultApiUrl(); settingsDialog.showModal();
  });
}
saveApiUrl?.addEventListener('click', e=>{
  e.preventDefault();
  const v = apiUrlInput.value.trim();
  if (v) localStorage.setItem('party_api_url', v);
  settingsDialog.close(); toast('API guardada.');
});

function renderLobby(){
  const mode = modeInfo(state.room.currentMode || selectedMode);
  app.innerHTML = `<section class="layout">${playersPanel()}<main class="game-shell">${roomHeader()}
    <h1 class="screen-title">PARTY ARENA</h1><p class="subtitle">SALA ONLINE</p>
    <h2 class="panel-title" style="justify-content:center">Modos de ronda · seleccionado: ${mode.title}</h2>
    ${modeCards()}
    <div class="big-actions">
      ${isHost()?`<button class="primary-btn" data-start><i class="fa-solid fa-play"></i> INICIAR RONDA</button><button class="secondary-btn" data-reset><i class="fa-solid fa-rotate-left"></i> REINICIAR SALA</button>`:'<div class="panel">Esperando a que el host inicie la ronda…</div>'}
      <button class="secondary-btn" data-leave><i class="fa-solid fa-door-open"></i> SALIR DE LA SALA</button>
    </div></main>${rankingPanel()}</section><p class="footer-note">Demo from Daniel Bort Guzmán · <a href="https://danielux135.github.io/">Portfolio</a></p>`;
  bindCommon();
  app.querySelectorAll('.mode-card').forEach(btn=>btn.addEventListener('click', async()=>{
    selectedMode = btn.dataset.mode; localStorage.setItem('party_selected_mode', selectedMode);
    if (isHost()) { try { await api('setMode', { mode:selectedMode }); } catch(e){ toast(e.message); } }
    render();
  }));
  app.querySelector('[data-start]')?.addEventListener('click', async()=>{ try { await api('startRound', { mode:selectedMode }); render(); } catch(e){ toast(e.message); } });
  app.querySelector('[data-reset]')?.addEventListener('click', async()=>{ if(confirm('¿Reiniciar sala y puntuaciones?')) { try { await api('resetRoom'); render(); } catch(e){ toast(e.message); } }});
}
function bindCommon(){
  app.querySelector('[data-copy-code]')?.addEventListener('click',()=>navigator.clipboard?.writeText(state.room.code));
  app.querySelector('[data-leave]')?.addEventListener('click',()=>{ clearSession(); renderHome(); });
  app.querySelector('.chat-form')?.addEventListener('submit', async e=>{
    e.preventDefault(); const input = e.currentTarget.message; const message = input.value.trim(); if(!message) return;
    input.value=''; try{ await api('sendChat', { message }); render(); } catch(err){ toast(err.message); }
  });
}
function renderGame(){
  const mode = state.round?.mode;
  const left = playersPanel(), right = rankingPanel();
  const center = mode === 'impostor' ? renderImpostor() : mode === 'bug-race' ? renderBugRace() : mode === 'boss-coop' ? renderBoss() : mode === 'rhythm-royale' ? renderRhythm() : mode === 'mentira' ? renderMentira() : '<p>Modo no soportado.</p>';
  app.innerHTML = `<section class="layout">${left}<main class="game-shell">${center}</main>${right}</section><p class="footer-note">Demo from Daniel Bort Guzmán · <a href="https://danielux135.github.io/">Portfolio</a></p>`;
  bindCommon(); bindGameActions();
}
function renderResults(){
  const mode = modeInfo(state.room.currentMode || state.round?.mode);
  app.innerHTML = `<section class="layout">${playersPanel()}<main class="results-card glass-card"><h1 class="game-title">RESULTADOS</h1><p class="subtitle">${mode.title}</p>
    <div class="ranking-list" style="margin:24px 0">${sortedPlayers().map((p,i)=>`<div class="rank-row"><span class="rank-no">${i+1}</span><div>${avatarHtml(p)}</div><strong>${escapeHtml(p.name)}</strong><span class="score">${p.score}</span></div>`).join('')}</div>
    ${isHost()?`<button class="primary-btn" data-back-lobby><i class="fa-solid fa-house"></i> VOLVER AL LOBBY</button><button class="secondary-btn" data-next-round><i class="fa-solid fa-forward"></i> LANZAR OTRA RONDA</button>`:'<p>Esperando al host…</p>'}
  </main>${rankingPanel()}</section>`;
  bindCommon();
  app.querySelector('[data-back-lobby]')?.addEventListener('click', async()=>{ try { await api('backToLobby'); render(); } catch(e){ toast(e.message); } });
  app.querySelector('[data-next-round]')?.addEventListener('click', async()=>{ try { await api('startRound', { mode:selectedMode }); render(); } catch(e){ toast(e.message); } });
}
function renderImpostor(){
  const r = state.round, s = r.state, phase = r.phase;
  const players = state.players || [];
  if (phase === 'vote') {
    return `<h1 class="game-title">IMPOSTOR DE PALABRAS</h1><p class="subtitle">VOTACIÓN</p><div class="glass-card game-card"><h2>Pistas enviadas</h2>${players.map(p=>`<p><strong>${escapeHtml(p.name)}:</strong> ${escapeHtml(s.clues?.[p.id] || '—')}</p>`).join('')}<h2>¿Quién es el impostor?</h2><div class="answers">${players.map(p=>`<button class="answer-btn" data-vote="${p.id}">${avatarHtml(p)} ${escapeHtml(p.name)}</button>`).join('')}</div></div>`;
  }
  return `<h1 class="game-title">IMPOSTOR DE PALABRAS</h1><p class="subtitle">ENGAÑA Y DESCUBRE · <span class="timer"><i class="fa-regular fa-clock"></i>${secondsLeft()}s</span></p><div class="glass-card game-card"><p class="panel-title" style="justify-content:center"><i class="fa-solid fa-lock"></i> TU PALABRA</p><div class="secret-word">${escapeHtml(s.yourWord || '???')}</div><form data-clue><label>Escribe tu pista</label><input name="clue" maxlength="80" placeholder="Ej: lenguaje de programación web…"><button class="primary-btn"><i class="fa-solid fa-paper-plane"></i> ENVIAR PISTA</button></form><p class="player-meta">Tip: sé creativo pero no tan obvio. Engaña sin delatarte.</p></div>`;
}
function renderBugRace(){
  const c = state.round.state.challenge || {};
  return `<h1 class="game-title">CARRERA DE BUGS</h1><p class="subtitle">CÓDIGO AL LÍMITE · <span class="timer"><i class="fa-regular fa-clock"></i>${secondsLeft()}s</span></p><div class="glass-card game-card"><span class="code-lang">${escapeHtml(c.lang)}</span><pre class="code-box">${escapeHtml(c.code)}</pre><div class="answers">${(c.options||[]).map((op,i)=>`<button class="answer-btn" data-answer="${i}"><b>${'ABCD'[i]}</b>${escapeHtml(op)}</button>`).join('')}</div></div>`;
}
function renderBoss(){
  const s = state.round.state; const hp = Number(s.hp||0), max = Number(s.maxHp||1); const pct = Math.max(0, Math.min(100, hp/max*100));
  return `<h1 class="game-title">BOSS COOPERATIVO</h1><p class="subtitle">DERROTA AL JEFE · <span class="timer"><i class="fa-regular fa-clock"></i>${secondsLeft()}s</span></p><div class="boss-arena"><h2><i class="fa-solid fa-skull"></i> ${escapeHtml(s.boss||'EL BUG SUPREMO')} <i class="fa-solid fa-skull"></i></h2><div class="hp-bar"><div class="hp-fill" style="width:${pct}%"></div></div><strong>${hp} / ${max} HP</strong><div class="boss-core"><i class="fa-solid fa-dragon"></i></div><div class="boss-actions"><button data-boss="defend"><i class="fa-solid fa-shield"></i> DEFENDER</button><button data-boss="attack"><i class="fa-solid fa-sword"></i> ATACAR</button><button data-boss="skill"><i class="fa-solid fa-users-rays"></i> HABILIDAD</button></div></div>`;
}
function renderRhythm(){
  const submitted = state.round.state.submissions?.[state.you.id];
  return `<h1 class="game-title">RHYTHM BATTLE ROYALE</h1><p class="subtitle">RITMO Y SUPERVIVENCIA · BPM ${state.round.state.bpm || 120}</p><div class="glass-card game-card"><div class="rhythm-target" data-rhythm-target><div class="pulse" data-pulse></div><div class="judgement" data-judge>${submitted?'ENVIADO':'TAP'}</div></div><button class="primary-btn" data-rhythm-start ${submitted?'disabled':''}><i class="fa-solid fa-music"></i> ${submitted?'PUNTUACIÓN ENVIADA':'INICIAR RETO DE 30S'}</button><p class="player-meta">Pulsa/toca lo más cerca posible del pulso. Se genera un beat simple con Web Audio.</p></div>`;
}
function renderMentira(){
  const r = state.round, s = r.state, phase = r.phase;
  if (phase === 'vote') {
    const opts = [{id:'real', txt:s.realAnswer}, ...Object.entries(s.fakeAnswers||{}).map(([pid,txt])=>({id:pid,txt}))].sort(()=>Math.random()-.5);
    return `<h1 class="game-title">MENTIRA EXPRESS</h1><p class="subtitle">VOTA LA REAL</p><div class="glass-card game-card"><h2>${escapeHtml(s.question)}</h2><div class="answers">${opts.map((o,i)=>`<button class="answer-btn" data-lie-vote="${escapeHtml(o.id)}"><b>${'ABCD'[i]||'?'}</b>${escapeHtml(o.txt)}</button>`).join('')}</div></div>`;
  }
  return `<h1 class="game-title">MENTIRA EXPRESS</h1><p class="subtitle">INVENTA UNA RESPUESTA FALSA · <span class="timer"><i class="fa-regular fa-clock"></i>${secondsLeft()}s</span></p><div class="glass-card game-card"><h2>${escapeHtml(s.question)}</h2><form data-fake><label>Tu mentira</label><input name="fake" maxlength="100" placeholder="Respuesta falsa convincente…"><button class="primary-btn"><i class="fa-solid fa-wand-magic-sparkles"></i> ENVIAR MENTIRA</button></form></div>`;
}
function bindGameActions(){
  app.querySelector('[data-clue]')?.addEventListener('submit', async e=>{ e.preventDefault(); const clue=e.currentTarget.clue.value.trim(); if(!clue) return; try{ await api('submitAction',{payload:{clue}}); render(); } catch(err){toast(err.message);} });
  app.querySelectorAll('[data-vote]').forEach(btn=>btn.addEventListener('click', async()=>{ try{ await api('submitAction',{payload:{vote:Number(btn.dataset.vote)}}); render(); } catch(err){toast(err.message);} }));
  app.querySelectorAll('[data-answer]').forEach(btn=>btn.addEventListener('click', async()=>{ try{ await api('submitAction',{payload:{answer:Number(btn.dataset.answer)}}); render(); } catch(err){toast(err.message);} }));
  app.querySelectorAll('[data-boss]').forEach(btn=>btn.addEventListener('click', async()=>{ try{ await api('submitAction',{payload:{move:btn.dataset.boss}}); render(); } catch(err){toast(err.message);} }));
  app.querySelector('[data-fake]')?.addEventListener('submit', async e=>{ e.preventDefault(); const fake=e.currentTarget.fake.value.trim(); if(!fake) return; try{ await api('submitAction',{payload:{fake}}); render(); } catch(err){toast(err.message);} });
  app.querySelectorAll('[data-lie-vote]').forEach(btn=>btn.addEventListener('click', async()=>{ try{ await api('submitAction',{payload:{vote:btn.dataset.lieVote}}); render(); } catch(err){toast(err.message);} }));
  app.querySelector('[data-rhythm-start]')?.addEventListener('click', startRhythmLocal);
}
function startRhythmLocal(){
  if (rhythm) return;
  const target = app.querySelector('[data-rhythm-target]'); const pulse = app.querySelector('[data-pulse]'); const judge = app.querySelector('[data-judge]');
  const AudioCtx = window.AudioContext || window.webkitAudioContext; const ctx = new AudioCtx(); const bpm = 120; const interval = 60000/bpm; const start = performance.now()+800; const end = start+30000;
  let beats=0, perfect=0, good=0, miss=0, combo=0, maxCombo=0, lastBeat = start;
  function beep(){ const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.type='sine'; osc.frequency.value=880; gain.gain.setValueAtTime(.0001,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.12,ctx.currentTime+.01); gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.08); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+.09); }
  function tap(){ const t=performance.now(); const d=Math.abs(t-lastBeat); if(d<70){perfect++; combo++; judge.textContent='PERFECT';} else if(d<150){good++; combo++; judge.textContent='GOOD';} else {miss++; combo=0; judge.textContent='MISS';} maxCombo=Math.max(maxCombo,combo); }
  target.addEventListener('click', tap); window.addEventListener('keydown', e=>{ if(e.code==='Space') tap(); });
  const id=setInterval(async()=>{ const n=performance.now(); if(n>=end){ clearInterval(id); target.removeEventListener('click',tap); const total=perfect+good+miss || 1; const accuracy=(perfect*100+good*60)/total; const score=perfect*300+good*150+maxCombo*25; judge.textContent='ENVIANDO'; try{ await api('submitAction',{payload:{score,accuracy,combo:maxCombo}}); rhythm=null; render(); }catch(e){toast(e.message);} return; } if(n>=start+beats*interval){ lastBeat=start+beats*interval; beats++; beep(); pulse.style.setProperty('--scale','1.6'); setTimeout(()=>pulse.style.setProperty('--scale','1'),80); } }, 24);
  rhythm={stop(){clearInterval(id); try{ctx.close();}catch{}}};
}
function render(){
  if (!state) return renderHome();
  const status = state.room?.status;
  if (status === 'playing' && state.round) return renderGame();
  if (status === 'results' && state.round) return renderResults();
  return renderLobby();
}
function startPoll(){ stopPoll(); pollId=setInterval(async()=>{ const s=session(); if(!s.code) return; try{ await api('getState'); render(); } catch(e){ console.warn(e.message); } }, 1000); }
function stopPoll(){ if(pollId) clearInterval(pollId); pollId=null; }
async function boot(){
  const s=session();
  if (s.code && s.playerToken) { try{ await api('getState'); startPoll(); render(); return; } catch(e){ console.warn(e.message); clearSession(); } }
  renderHome();
}
boot();
