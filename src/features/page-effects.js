import { scrollToSectionElement } from './section-navigation.js';
import { TRACKS } from '../data/tracks.js';
import { playerApi } from './player.js';

// anima los contadores de estadísticas al entrar en pantalla
(function initCounters() {
    const items = document.querySelectorAll('.music-stat-num[data-target]');
    if (!items.length) return;

    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target) || target === 0 || el.dataset.animated) return;
        el.dataset.animated = '1';
        const duration = 1800;
        const start = performance.now();
        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(ease * target);
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        }
        requestAnimationFrame(tick);
    }

    // el contador de soundcloud espera la respuesta antes de animarse
    const scEl = document.querySelector('.music-stat-num[data-soundcloud]');
    if (scEl) {
        const endpoint = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
            ? 'http://localhost:3000/api/soundcloud-tracks'
            : 'https://danielux135-github-io.vercel.app/api/soundcloud-tracks';
        fetch(endpoint)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.tracks) {
                    scEl.dataset.target = data.tracks;
                    animateCounter(scEl);
                }
            })
            .catch(() => {});
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) animateCounter(e.target); });
    }, { threshold: 0.4 });
    items.forEach(el => observer.observe(el));
})();
// shuffle FAB: reproduce una canción aleatoria al pulsar
(function initShuffleFab() {
    const fab = document.getElementById('shuffleFab');
    if (!fab) return;
    window.addEventListener('scroll', () => {
        fab.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
    fab.addEventListener('click', () => {
        if (typeof TRACKS === 'undefined') return;
        const idx = Math.floor(Math.random() * TRACKS.length);
        playerApi.loadTrack(idx, true);
        scrollToSectionElement(document.getElementById('musicPlayer'));
        fab.style.transform = 'scale(0.9) rotate(360deg)';
        setTimeout(() => { fab.style.transform = ''; }, 400);
    });
})();
// barra de progreso de scroll en la parte superior de la página
(function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = max > 0 ? (window.scrollY / max * 100) + '%' : '0%';
    }, { passive: true });
})();
// efecto tilt 3d al mover el ratón sobre tarjetas y paneles
(function initTilt() {
    const SELECTORS = '.project-card, .eduardo-card, .legacy-roles-card, .skills-panel';
    const MAX_TILT = 8;
    function attach(el) {
        if (el.dataset.tilt) return;
        el.dataset.tilt = '1';
        el.style.transition = 'box-shadow 0.25s ease';
        el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width  - 0.5;
            const y = (e.clientY - r.top)  / r.height - 0.5;
            el.style.transform = `perspective(700px) rotateY(${x * MAX_TILT}deg) rotateX(${-y * MAX_TILT}deg) scale(1.02)`;
            el.style.boxShadow = `${-x * 14}px ${y * 14}px 36px rgba(0,0,0,0.28)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transition = 'transform 0.35s ease, box-shadow 0.35s ease';
            el.style.transform = '';
            el.style.boxShadow = '';
            setTimeout(() => { el.style.transition = 'box-shadow 0.25s ease'; }, 360);
        });
    }
    document.querySelectorAll(SELECTORS).forEach(attach);
})();
