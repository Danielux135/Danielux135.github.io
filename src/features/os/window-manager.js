// gestor de ventanas del OS
let _zBase = 2000;
let _taskbarCallbacks = { open: null, close: null, focus: null };
let _dragOverlay = null;

export function setTaskbarCallbacks(cb) {
    _taskbarCallbacks = { ..._taskbarCallbacks, ...cb };
}

export function getOpenWindows() {
    return [...document.querySelectorAll('.os-window')];
}

export function createWindow(app, { lang = 'es', onClose } = {}) {
    const title = app.title[lang] ?? app.title.es;
    const existing = document.querySelector(`.os-window[data-app="${app.id}"]`);
    if (existing) { focusWindow(existing); return existing; }

    const win = document.createElement('div');
    win.className = 'os-window';
    win.dataset.app = app.id;
    win.style.width  = `${app.width}px`;
    win.style.height = `${app.height}px`;

    const offset = getOpenWindows().length * 24;
    win.style.left = `${Math.min(80 + offset, Math.max(0, window.innerWidth  - app.width  - 40))}px`;
    win.style.top  = `${Math.min(60 + offset, Math.max(0, window.innerHeight - app.height - 60))}px`;

    win.innerHTML = `
        <div class="os-win-titlebar">
            <span class="os-win-icon"><i class="fa-solid ${app.icon}"></i></span>
            <span class="os-win-title">${title}</span>
            <div class="os-win-controls">
                <button class="os-win-btn os-win-min"   aria-label="Minimizar"><i class="fa-solid fa-minus"></i></button>
                <button class="os-win-btn os-win-max"   aria-label="Maximizar"><i class="fa-solid fa-expand"></i></button>
                <button class="os-win-btn os-win-close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>
        <div class="os-win-body">
            <div class="os-win-content-wrap"></div>
        </div>`;

    document.body.appendChild(win);
    focusWindow(win);
    _initDrag(win);
    _initResize(win);
    requestAnimationFrame(() => _loadContent(win, app, lang));

    win.querySelector('.os-win-close').addEventListener('click', () => closeWindow(win));
    win.querySelector('.os-win-min').addEventListener('click',   () => minimizeWindow(win));
    win.querySelector('.os-win-max').addEventListener('click',   () => toggleMaximize(win));
    win.addEventListener('pointerdown', () => focusWindow(win));

    _taskbarCallbacks.open?.(app.id, title);
    onClose && win.addEventListener('os:close', onClose);
    return win;
}

export function closeWindow(win) {
    win.dispatchEvent(new Event('os:close'));
    win.classList.add('os-window--closing');
    _taskbarCallbacks.close?.(win.dataset.app);
    if (win.dataset.app === 'music-player') {
        import('./music-player.js').then(m => m.destroyPlayerContent?.()).catch(() => {});
    }
    setTimeout(() => win.remove(), 200);
}

export function focusWindow(win) {
    win.style.zIndex = String(++_zBase);
    getOpenWindows().forEach(w => w.classList.toggle('os-window--focused', w === win));
    _taskbarCallbacks.focus?.(win.dataset.app);
}

export function minimizeWindow(win) {
    const isMin = win.classList.toggle('os-window--minimized');
    if (!isMin) win.style.pointerEvents = '';
}

export function toggleMaximize(win) {
    const isMax = win.classList.toggle('os-window--maximized');
    const icon = win.querySelector('.os-win-max i');
    if (icon) icon.className = isMax ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
}

export function closeAllWindows() {
    getOpenWindows().forEach(w => w.remove());
    _zBase = 2000;
}

// ─── drag con overlay ─────────────────────────────────────────────────────────
function _initDrag(win) {
    const bar = win.querySelector('.os-win-titlebar');
    let ox = 0, oy = 0, sx = 0, sy = 0, dragging = false;

    bar.addEventListener('pointerdown', e => {
        if (e.target.closest('.os-win-controls')) return;
        if (win.classList.contains('os-window--maximized')) return;
        dragging = true;
        ox = win.offsetLeft; oy = win.offsetTop;
        sx = e.clientX;      sy = e.clientY;
        bar.setPointerCapture(e.pointerId);
        win.classList.add('os-window--dragging');
        _dragOverlay = document.createElement('div');
        _dragOverlay.id = 'os-drag-overlay';
        document.body.appendChild(_dragOverlay);
    });
    bar.addEventListener('pointermove', e => {
        if (!dragging) return;
        win.style.left = `${Math.max(0, ox + e.clientX - sx)}px`;
        win.style.top  = `${Math.max(0, oy + e.clientY - sy)}px`;
    });
    const end = () => {
        if (!dragging) return;
        dragging = false;
        win.classList.remove('os-window--dragging');
        _dragOverlay?.remove(); _dragOverlay = null;
    };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
}

// ─── resize ───────────────────────────────────────────────────────────────────
function _initResize(win) {
    const h = document.createElement('div');
    h.className = 'os-win-resize-handle';
    win.appendChild(h);
    let d = false, sw = 0, sh = 0, sx = 0, sy = 0;
    h.addEventListener('pointerdown', e => { d=true; sw=win.offsetWidth; sh=win.offsetHeight; sx=e.clientX; sy=e.clientY; h.setPointerCapture(e.pointerId); e.stopPropagation(); });
    h.addEventListener('pointermove', e => { if(!d)return; win.style.width=`${Math.max(320,sw+e.clientX-sx)}px`; win.style.height=`${Math.max(220,sh+e.clientY-sy)}px`; });
    h.addEventListener('pointerup',     () => { d=false; });
    h.addEventListener('pointercancel', () => { d=false; });
}

// ─── carga de contenido ───────────────────────────────────────────────────────
async function _loadContent(win, app, lang) {
    const wrap = win.querySelector('.os-win-content-wrap');
    if (!wrap) return;

    if (app.id === 'music-player') {
        wrap.innerHTML = '<div class="os-win-loading"><i class="fa-solid fa-compact-disc fa-spin"></i> Cargando reproductor…</div>';
        try {
            const { buildPlayerContent } = await import('./music-player.js');
            if (!win.isConnected) return;
            wrap.innerHTML = '';
            buildPlayerContent(wrap);
        } catch (e) {
            console.error('[OS] Error al cargar reproductor:', e);
            wrap.innerHTML = '<div class="os-win-loading"><i class="fa-solid fa-triangle-exclamation"></i> Error al cargar el reproductor</div>';
        }
        return;
    }

    if (app.id === 'arcade') {
        wrap.innerHTML = _buildArcade(lang);
        wrap.querySelectorAll('.os-game-card').forEach(card => {
            card.addEventListener('click', async () => {
                const gameId = card.dataset.gameId;
                const { initArcade } = await import('../../arcade/index.js');
                const arcade = initArcade();
                arcade.openToGame(gameId);
            });
        });
        return;
    }

    wrap.innerHTML = _buildContent(app, lang);
    wrap.querySelector('.os-app-launch-btn')?.addEventListener('click', () => {
        import('./index.js').then(m => m.unmount());
        setTimeout(() => document.querySelector(app.section)?.scrollIntoView({ behavior: 'smooth' }), 350);
    });
}

// ─── constructores de contenido por sección ───────────────────────────────────
function _buildContent(app, lang) {
    switch (app.id) {
        case 'about':    return _buildAbout(lang);
        case 'music':    return _buildMusic(lang);
        case 'legacy':   return _buildLegacy(lang);
        case 'projects': return _buildProjects(lang);
        case 'webs':     return _buildWebs(lang);
        case 'contact':  return _buildContact(lang);
        case 'arcade':   return _buildArcade(lang);
        default:         return _buildGeneric(app, lang);
    }
}

function _header(app, lang) {
    const title = app?.title?.[lang] ?? app?.title?.es ?? '';
    const desc  = app?.desc?.[lang]  ?? app?.desc?.es  ?? '';
    return `
        <div class="os-app-header">
            <div class="os-app-header-icon"><i class="fa-solid ${app.icon}"></i></div>
            <div><h2 class="os-app-title">${title}</h2><p class="os-app-desc">${desc}</p></div>
        </div>
        <div class="os-app-divider"></div>`;
}

function _launch(section, label = 'Ver en el portfolio completo') {
    return `<div class="os-app-launch-row">
        <button class="os-app-launch-btn" data-section="${section}">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> ${label}
        </button></div>`;
}

function _buildAbout(lang) {
    const app = { icon: 'fa-user', title: { es:'Sobre mí', en:'About', val:'Sobre mi' }, desc: { es:'Developer · Músico · Creator', en:'Developer · Musician · Creator', val:'Developer · Músic · Creator' } };

    // skills del DOM
    const skills = [...document.querySelectorAll('#sobre-mi .skill-bar')].map(el => {
        const label = el.querySelector('.skill-info span:first-child')?.textContent?.trim() ?? '';
        const level = el.querySelector('.skill-info span:last-child')?.textContent?.trim()  ?? '';
        const pct   = Number(el.dataset.level ?? 80);
        return `<div class="os-skill-row">
            <div class="os-skill-meta"><span>${label}</span><span class="os-skill-level">${level}</span></div>
            <div class="os-skill-bar"><div class="os-skill-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');

    // chips de tech
    const chips = [...document.querySelectorAll('#sobre-mi .about-chips [data-i18n]')].map(el =>
        `<span class="os-chip">${el.textContent.trim()}</span>`
    ).join('');

    // bio
    const bio = document.querySelector('#sobre-mi .about-text > p, #sobre-mi .about-bio p')?.textContent?.trim() ?? '';

    return `${_header(app, lang)}
        ${bio ? `<p class="os-bio-text">${bio}</p><div class="os-app-divider"></div>` : ''}
        ${chips ? `<div class="os-chips-row">${chips}</div>` : ''}
        ${skills ? `<div class="os-skills">${skills}</div>` : ''}
        ${_launch('#sobre-mi')}`;
}

function _buildMusic(lang) {
    const app = { icon: 'fa-music', title: { es:'Música', en:'Music', val:'Música' }, desc: { es:'Proyectos musicales y player interactivo', en:'Music projects & interactive player', val:'Projectes musicals i player interactiu' } };
    import('../../data/tracks.js').then(({ TRACKS }) => {}); // side-effect warmup
    const { TRACKS } = window._osTrackCache ?? {};
    const trackHtml = TRACKS?.slice(0, 20).map((t, i) =>
        `<div class="os-app-card os-track-row" style="cursor:pointer" onclick="window._playerLoadTrack?.(${i},true)">
            <span class="os-app-card-icon"><i class="fa-solid fa-music"></i></span>
            <div class="os-app-card-body"><strong>${t.title}</strong></div>
        </div>`
    ).join('') ?? '';

    return `${_header(app, lang)}
        <p class="os-app-text-small">Abre el reproductor OS para escuchar. Haz clic en una pista para cargarla.</p>
        <div class="os-app-cards os-tracklist">${trackHtml || '<p class="os-win-empty">Cargando pistas…</p>'}</div>
        ${_launch('#musica', 'Abrir sección Música')}`;
}

function _buildLegacy(lang) {
    const app = { icon: 'fa-crown', title: { es:'Legado', en:'Legacy', val:'Llegat' }, desc: { es:'Trayectoria y logros', en:'Career & achievements', val:'Trajectòria i assoliments' } };

    const roles = [...document.querySelectorAll('#legado .legacy-role-item')].map(el => {
        const icon  = el.querySelector('i')?.className ?? 'fa-solid fa-star';
        const title = el.querySelector('.legacy-role-text strong, h4, h3')?.textContent?.trim() ?? '';
        const desc  = [...el.querySelectorAll('p')].map(p => p.textContent.trim()).join(' ').slice(0, 100);
        return `<div class="os-app-card">
            <span class="os-app-card-icon"><i class="${icon}"></i></span>
            <div class="os-app-card-body"><strong>${title}</strong>${desc ? `<span>${desc}…</span>` : ''}</div>
        </div>`;
    }).join('');

    const card = document.querySelector('#legado .eduardo-card, #legado .legacy-card');
    const cardHtml = card ? `<div class="os-app-card os-app-card--wide">
        <span class="os-app-card-icon"><i class="fa-solid fa-music"></i></span>
        <div class="os-app-card-body">
            <strong>${card.querySelector('h3,h4')?.textContent?.trim() ?? 'Eduardo'}</strong>
            <span>${[...card.querySelectorAll('p')].map(p=>p.textContent.trim()).join(' ').slice(0,140)}…</span>
        </div></div>` : '';

    return `${_header(app, lang)}
        ${cardHtml}
        <div class="os-app-cards">${roles || '<p class="os-win-empty">Sin datos disponibles.</p>'}</div>
        ${_launch('#legado')}`;
}

function _buildProjects(lang) {
    const app = { icon: 'fa-folder-open', title: { es:'Proyectos', en:'Projects', val:'Projectes' }, desc: { es:'Código y proyectos open source', en:'Code & open-source projects', val:'Codi i projectes open source' } };

    const cards = [...document.querySelectorAll('#proyectos .project-card')].map(el => {
        const icon  = el.querySelector('.project-icon i')?.className ?? 'fa-solid fa-code';
        const tag   = el.querySelector('.project-tag')?.textContent?.trim() ?? '';
        const title = el.querySelector('h3')?.textContent?.trim() ?? '';
        const desc  = el.querySelector('p')?.textContent?.trim().slice(0, 130) ?? '';
        const link  = el.querySelector('a.project-link')?.href ?? '';
        return `<div class="os-app-card">
            <span class="os-app-card-icon"><i class="${icon}"></i></span>
            <div class="os-app-card-body">
                ${tag ? `<span class="os-tag">${tag}</span>` : ''}
                <strong>${title}</strong>
                ${desc ? `<span>${desc}…</span>` : ''}
                ${link ? `<a href="${link}" target="_blank" rel="noopener" class="os-app-card-link">GitHub <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
            </div>
        </div>`;
    }).join('');

    return `${_header(app, lang)}
        <div class="os-app-cards">${cards || '<p class="os-win-empty">Sin proyectos disponibles.</p>'}</div>
        ${_launch('#proyectos')}`;
}

function _buildWebs(lang) {
    const app = { icon: 'fa-globe', title: { es:'Webs', en:'Webs', val:'Webs' }, desc: { es:'Demos de webs y aplicaciones', en:'Web demos & apps', val:'Demos de webs i aplicacions' } };
    const projects = window._osDemoProjects ?? [];
    const demos = projects.map(p => {
        const icon   = p.icon ?? 'fa-globe';
        const title  = p.title ?? '';
        const type   = p.type?.[lang] ?? p.type?.es ?? '';
        const url    = p.url ?? '';
        return `<div class="os-app-card os-web-card" data-url="${url}" data-title="${title}" style="cursor:pointer">
            <span class="os-app-card-icon"><i class="fa-solid ${icon}"></i></span>
            <div class="os-app-card-body">
                <strong>${title}</strong>
                ${type ? `<span>${type}</span>` : ''}
            </div>
            <i class="fa-solid fa-display os-web-card-arrow"></i>
        </div>`;
    }).join('');

    return `${_header(app, lang)}
        <p class="os-app-text-small">Haz clic en cualquier web para abrirla en el navegador del OS</p>
        <div class="os-app-cards">${demos || '<p class="os-win-empty">Cargando demos…</p>'}</div>
        ${_launch('#webs', 'Ver Demo Hub completo')}`;
}

export function createBrowserWindow(url, title) {
    const id  = `browser-${Date.now()}`;
    const app = {
        id, icon: 'fa-globe',
        title: { es: title, en: title, val: title },
        width: 880, height: 600,
        section: null, desc: {},
    };
    const existing = document.querySelector(`.os-window[data-app="${id}"]`);
    if (existing) { focusWindow(existing); return existing; }

    const win = document.createElement('div');
    win.className = 'os-window';
    win.dataset.app = id;
    win.style.cssText = `width:${app.width}px;height:${app.height}px;left:${Math.max(0,(window.innerWidth-app.width)/2)}px;top:${Math.max(0,(window.innerHeight-app.height)/2)}px`;

    win.innerHTML = `
        <div class="os-win-titlebar">
            <span class="os-win-icon"><i class="fa-solid fa-globe"></i></span>
            <span class="os-win-title">${title}</span>
            <div class="os-win-controls">
                <button class="os-win-btn os-win-min"   aria-label="Minimizar"><i class="fa-solid fa-minus"></i></button>
                <button class="os-win-btn os-win-max"   aria-label="Maximizar"><i class="fa-solid fa-expand"></i></button>
                <button class="os-win-btn os-win-close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>
        <div class="os-browser-bar">
            <button class="os-browser-nav-btn" id="osBrowserBack_${id}" title="Atrás"><i class="fa-solid fa-arrow-left"></i></button>
            <button class="os-browser-nav-btn" id="osBrowserRefresh_${id}" title="Recargar"><i class="fa-solid fa-rotate-right"></i></button>
            <div class="os-browser-url" id="osBrowserUrl_${id}">
                <i class="fa-solid fa-lock os-browser-lock"></i>
                <span class="os-browser-url-text">${url}</span>
            </div>
            <a href="${url}" target="_blank" rel="noopener" class="os-browser-nav-btn" title="Abrir en nueva pestaña">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
        </div>
        <div class="os-browser-loading" id="osBrowserLoading_${id}"></div>
        <div class="os-win-body os-browser-body">
            <iframe class="os-browser-iframe" src="${url}" title="${title}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
        </div>`;

    document.body.appendChild(win);
    focusWindow(win);
    _initDrag(win);
    _initResize(win);

    // barra de carga animada
    const iframe  = win.querySelector('.os-browser-iframe');
    const loading = win.querySelector(`#osBrowserLoading_${id}`);
    iframe.addEventListener('load', () => loading?.classList.add('os-browser-loading--done'));

    // controles de navegación
    win.querySelector(`#osBrowserBack_${id}`)?.addEventListener('click', () => {
        try { iframe.contentWindow.history.back(); } catch {}
    });
    win.querySelector(`#osBrowserRefresh_${id}`)?.addEventListener('click', () => {
        loading?.classList.remove('os-browser-loading--done');
        iframe.src = iframe.src;
    });

    win.querySelector('.os-win-close').addEventListener('click', () => closeWindow(win));
    win.querySelector('.os-win-min').addEventListener('click',   () => minimizeWindow(win));
    win.querySelector('.os-win-max').addEventListener('click',   () => toggleMaximize(win));
    win.addEventListener('pointerdown', () => focusWindow(win));
    _taskbarCallbacks.open?.(id, title);
    return win;
}

function _buildContact(lang) {
    const app = { icon: 'fa-envelope', title: { es:'Contacto', en:'Contact', val:'Contacte' }, desc: { es:'Disponible para proyectos y colaboraciones', en:'Available for projects & collaborations', val:'Disponible per a projectes i col·laboracions' } };

    const links = [...document.querySelectorAll('#contacto a[href], .hero-social a[href]')].slice(0, 8).map(el => {
        const icon  = el.querySelector('i')?.className ?? 'fa-solid fa-link';
        const label = el.getAttribute('aria-label') ?? el.textContent?.trim() ?? el.href;
        const href  = el.href;
        return `<a href="${href}" target="_blank" rel="noopener" class="os-contact-link">
            <i class="${icon}"></i><span>${label}</span>
            <i class="fa-solid fa-arrow-up-right-from-square os-contact-ext"></i>
        </a>`;
    }).join('');

    return `${_header(app, lang)}
        <p class="os-bio-text">¿Tienes un proyecto en mente? Estoy disponible para webs, desarrollo y colaboraciones creativas.</p>
        <div class="os-app-divider"></div>
        <div class="os-contact-links">${links || ''}</div>
        ${_launch('#contacto', 'Ir a contacto')}`;
}

function _buildGeneric(app, lang) {
    return `${_header(app, lang)}<p class="os-win-empty">Sin contenido específico para esta app.</p>${_launch(app.section ?? '')}`;
}

const _ARCADE_GAMES = [
    { id: 'tap',    icon: 'fa-bullseye',      name: { es: 'Beat Striker',         en: 'Beat Striker',         val: 'Beat Striker'         }, cat: { es: 'RITMO',        en: 'RHYTHM',       val: 'RITME'        } },
    { id: 'hero',   icon: 'fa-guitar',         name: { es: 'Hero Mode',            en: 'Hero Mode',            val: 'Hero Mode'            }, cat: { es: 'MODO HÉROE',   en: 'HERO MODE',    val: 'MODE HEROI'   } },
    { id: 'surfer', icon: 'fa-water',          name: { es: 'Wave Rider',           en: 'Wave Rider',           val: 'Wave Rider'           }, cat: { es: 'SURF',         en: 'SURF',         val: 'SURF'         } },
    { id: 'simon',  icon: 'fa-clone',          name: { es: 'Echo Sequence',        en: 'Echo Sequence',        val: 'Echo Sequence'        }, cat: { es: 'MEMORIA',      en: 'MEMORY',       val: 'MEMÒRIA'      } },
    { id: 'dodger', icon: 'fa-circle-nodes',   name: { es: 'Ring Escape',          en: 'Ring Escape',          val: 'Ring Escape'          }, cat: { es: 'ESCAPE',       en: 'ESCAPE',       val: 'ESCAPE'       } },
    { id: 'tempo',  icon: 'fa-drum',           name: { es: 'BPM Hunter',           en: 'BPM Hunter',           val: 'BPM Hunter'           }, cat: { es: 'TEMPO',        en: 'TEMPO',        val: 'TEMPO'        } },
    { id: 'bass',   icon: 'fa-rocket',         name: { es: 'Bass Invaders',        en: 'Bass Invaders',        val: 'Bass Invaders'        }, cat: { es: 'SHOOTER',      en: 'SHOOTER',      val: 'SHOOTER'      } },
    { id: 'party',  icon: 'fa-users',          name: { es: 'Party Arena',          en: 'Party Arena',          val: 'Party Arena'          }, cat: { es: 'PARTY ONLINE', en: 'PARTY ONLINE', val: 'PARTY ONLINE' } },
];

function _buildArcade(lang) {
    const app = {
        icon: 'fa-gamepad',
        title: { es: 'Minijuegos', en: 'Mini-games', val: 'Minijocs' },
        desc: { es: '8 juegos musicales sincronizados en tiempo real', en: '8 real-time music mini-games', val: '8 jocs musicals sincronitzats en temps real' },
    };
    const cards = _ARCADE_GAMES.map(g => `
        <button class="os-game-card" data-game-id="${g.id}" aria-label="${g.name[lang] ?? g.name.es}">
            <div class="os-game-card-icon"><i class="fa-solid ${g.icon}"></i></div>
            <div class="os-game-card-body">
                <strong class="os-game-card-name">${g.name[lang] ?? g.name.es}</strong>
                <span class="os-game-card-cat">${g.cat[lang] ?? g.cat.es}</span>
            </div>
            <i class="fa-solid fa-play os-game-card-play"></i>
        </button>`).join('');

    const hint = lang === 'en' ? 'Click any game to open it directly'
               : lang === 'val' ? 'Fes clic en qualsevol joc per a obrir-lo'
               : 'Haz clic en un juego para abrirlo directamente';

    return `${_header(app, lang)}
        <p class="os-app-text-small">${hint}</p>
        <div class="os-game-grid">${cards}</div>`;
}

// precarga datos y módulos para que la primera apertura sea instantánea
import('../../data/tracks.js').then(m => { window._osTrackCache = m; });
import('../../data/demo-hub/projects.js').then(m => { window._osDemoProjects = m.DEMO_PROJECTS; });
import('./music-player.js').catch(() => {});

// delegación de clicks en web cards → ventana-browser
document.addEventListener('click', e => {
    const card = e.target.closest('.os-web-card');
    if (!card) return;
    const url   = card.dataset.url;
    const title = card.dataset.title;
    if (url) createBrowserWindow(url, title);
});
