import { playerApi } from './player.js';

// teclas de acceso rápido: flechas para navegar y ajustar volumen, m para silenciar
(function initMediaKeys() {
    const audio = document.getElementById('audioEl');
    if (!audio) return;
    const volBar     = document.getElementById('volBar');
    const npbVol     = document.getElementById('npbVol');
    const muteIcon   = document.querySelector('#muteBtn i');
    const npbVolIcon = document.getElementById('npbVolIcon');
    const VOL_STEP = 0.05;

    function syncVolumeUI() {
        const v = audio.muted ? 0 : audio.volume;
        const pct = Math.round(audio.volume * 100);
        const fill = (audio.muted ? 0 : pct) + '%';
        if (volBar) { volBar.value = pct; volBar.style.setProperty('--vol', fill); }
        if (npbVol) { npbVol.value = pct; npbVol.style.setProperty('--vol', fill); }
        const cls = v < 0.01 ? 'fa-volume-xmark' : v < 0.5 ? 'fa-volume-low' : 'fa-volume-high';
        if (muteIcon)   muteIcon.className   = `fa-solid ${cls}`;
        if (npbVolIcon) npbVolIcon.className = `fa-solid ${cls} npb-vol-icon`;
    }
    function changeVolume(delta) {
        audio.muted = false;
        audio.volume = Math.min(1, Math.max(0, audio.volume + delta));
        playerApi.setAudioVolume(audio.volume);
        syncVolumeUI();
    }
    function toggleMute() {
        audio.muted = !audio.muted;
        if (window._setAudioVolume) window._setAudioVolume(audio.muted ? 0 : audio.volume);
        syncVolumeUI();
    }
    function isTyping(el) {
        return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    }

    document.addEventListener('keydown', (e) => {
        if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
        const palette = document.getElementById('cmdPaletteOverlay');
        if (palette && palette.classList.contains('open')) return;
        switch (e.key) {
            case 'ArrowUp':    e.preventDefault(); document.getElementById('sectionPrev')?.click(); break;
            case 'ArrowDown':  e.preventDefault(); document.getElementById('sectionNext')?.click(); break;
            case 'ArrowLeft':  e.preventDefault(); changeVolume(-VOL_STEP); break;
            case 'ArrowRight': e.preventDefault(); changeVolume(VOL_STEP); break;
            case 'm': case 'M': e.preventDefault(); toggleMute(); break;
        }
    });
})();
