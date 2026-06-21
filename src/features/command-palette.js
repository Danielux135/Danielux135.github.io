import { TRACKS } from '../data/tracks.js';
import { getTranslation } from './site-ui.js';
import { scrollToSectionElement } from './section-navigation.js';
import { playerApi } from './player.js';

// paleta de comandos: búsqueda rápida de secciones, canciones y acciones
(function initCommandPalette() {
    const overlay  = document.getElementById('cmdPaletteOverlay');
    const input    = document.getElementById('cmdPaletteInput');
    const results  = document.getElementById('cmdPaletteResults');
    const trigger  = document.getElementById('cmdPaletteTrigger');
    if (!overlay || !input || !results) return;

    const NAV_SECTIONS = [
        { id: 'sobre-mi',  icon: 'fa-user',       i18n: 'nav.about'    },
        { id: 'musica',    icon: 'fa-music',       i18n: 'nav.music'    },
        { id: 'legado',    icon: 'fa-guitar',      i18n: 'nav.legacy'   },
        { id: 'proyectos', icon: 'fa-code',        i18n: 'nav.projects' },
        { id: 'contacto',  icon: 'fa-envelope',    i18n: 'nav.contact'  },
    ];

    let activeIdx = -1;
    let currentItems = [];

    function open() {
        overlay.classList.add('open');
        input.value = '';
        input.placeholder = getTranslation('cmd.placeholder');
        results.setAttribute('data-empty', getTranslation('cmd.empty'));
        renderResults('');
        setTimeout(() => input.focus(), 60);
    }
    function close() {
        overlay.classList.remove('open');
        input.blur();
    }

    function highlight(text, q) {
        if (!q) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return text;
        return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + q.length) + '</mark>' + text.slice(idx + q.length);
    }

    function makeItem(type, icon, title, sub, action, q) {
        const el = document.createElement('div');
        el.className = `cmd-item cmd-type-${type}`;
        el.innerHTML = `
            <div class="cmd-item-icon"><i class="fa-solid ${icon}"></i></div>
            <div class="cmd-item-body">
                <div class="cmd-item-title">${highlight(title, q)}</div>
                <div class="cmd-item-sub">${sub}</div>
            </div>
            <i class="fa-solid fa-arrow-right cmd-item-arrow"></i>`;
        el.addEventListener('mousedown', e => { e.preventDefault(); action(); close(); });
        el.addEventListener('mouseenter', () => {
            setActive(currentItems.indexOf(el));
        });
        return el;
    }

    function setActive(idx) {
        currentItems.forEach((el, i) => el.classList.toggle('active', i === idx));
        activeIdx = idx;
        if (currentItems[idx]) currentItems[idx].scrollIntoView({ block: 'nearest' });
    }

    function renderResults(q) {
        results.innerHTML = '';
        currentItems = [];
        activeIdx = -1;
        const ql = q.toLowerCase();

        const navMatches = NAV_SECTIONS.filter(s =>
            getTranslation(s.i18n).toLowerCase().includes(ql) || ql === ''
        );
        if (navMatches.length) {
            const label = document.createElement('div');
            label.className = 'cmd-group-label';
            label.textContent = getTranslation('cmd.groupNav');
            results.appendChild(label);
            navMatches.forEach(s => {
                const title = getTranslation(s.i18n);
                const item = makeItem('nav', s.icon, title, getTranslation('cmd.subSection'), () => {
                    scrollToSectionElement(document.getElementById(s.id));
                }, q);
                results.appendChild(item);
                currentItems.push(item);
            });
        }

        if (typeof TRACKS !== 'undefined') {
            const trackMatches = TRACKS
                .map((t, i) => ({ t, i }))
                .filter(({ t }) => t.title.toLowerCase().includes(ql) && ql !== '')
                .slice(0, 6);
            if (trackMatches.length) {
                const label = document.createElement('div');
                label.className = 'cmd-group-label';
                label.textContent = getTranslation('cmd.groupTracks');
                results.appendChild(label);
                trackMatches.forEach(({ t, i }) => {
                    const item = makeItem('track', 'fa-headphones', t.title, getTranslation('cmd.subTrack'), () => {
                        playerApi.loadTrack(i, true);
                        scrollToSectionElement(document.getElementById('musica'));
                    }, q);
                    results.appendChild(item);
                    currentItems.push(item);
                });
            }
        }

        const actionCvTitle  = getTranslation('cmd.actionCv');
        const actionThTitle  = getTranslation('cmd.actionTheme');
        const actionsData = [
            { title: actionCvTitle,  sub: getTranslation('cmd.actionCvSub'),    icon: 'fa-file-arrow-down', fn: () => window.open('assets/cv.html', '_blank') },
            { title: actionThTitle,  sub: getTranslation('cmd.actionThemeSub'), icon: 'fa-circle-half-stroke', fn: () => document.getElementById('themeToggle')?.click() },
        ].filter(a => a.title.toLowerCase().includes(ql) || ql === '');
        if (actionsData.length) {
            const label = document.createElement('div');
            label.className = 'cmd-group-label';
            label.textContent = getTranslation('cmd.groupActions');
            results.appendChild(label);
            actionsData.forEach(a => {
                const item = makeItem('action', a.icon, a.title, a.sub, a.fn, q);
                results.appendChild(item);
                currentItems.push(item);
            });
        }

        if (currentItems.length === 0 && ql !== '') {
            results.setAttribute('data-empty', getTranslation('cmd.empty'));
        } else {
            results.removeAttribute('data-empty');
        }
        if (currentItems.length > 0) setActive(0);
    }

    input.addEventListener('input', () => renderResults(input.value.trim()));

    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive(Math.min(activeIdx + 1, currentItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(Math.max(activeIdx - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentItems[activeIdx]) {
                currentItems[activeIdx].dispatchEvent(new MouseEvent('mousedown'));
            }
        } else if (e.key === 'Escape') {
            close();
        }
    });

    overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
    trigger?.addEventListener('click', open);

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            overlay.classList.contains('open') ? close() : open();
        }
        if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
})();
