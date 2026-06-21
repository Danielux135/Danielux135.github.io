import { currentLanguage, getTranslation } from './site-ui.js';

// chat con IA: envía mensajes al endpoint de vercel y muestra la respuesta
(function initAIChat() {
    // ▼▼ CONFIGURA AQUÍ la URL de tu función en Vercel (déjala así si sirves la web desde Vercel).
    const AI_ENDPOINT = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? '/api/chat'
        : 'https://foskia.vercel.app/api/chat';
    // ▲▲

    const toggle  = document.getElementById('aiChatToggle');
    const panel   = document.getElementById('aiChatPanel');
    const closeBt = document.getElementById('aiChatClose');
    const msgsEl  = document.getElementById('aiChatMessages');
    const form    = document.getElementById('aiChatForm');
    const input   = document.getElementById('aiChatInput');
    const sendBt  = document.getElementById('aiChatSend');
    if (!toggle || !panel || !form) return;

    const history = [];
    let greeted = false;
    let busy = false;

    function addMessage(text, who, extraClass = '') {
        const el = document.createElement('div');
        el.className = `ai-msg ${who}${extraClass ? ' ' + extraClass : ''}`;
        el.textContent = text;
        msgsEl.appendChild(el);
        msgsEl.scrollTop = msgsEl.scrollHeight;
        return el;
    }

    function openPanel() {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        if (!greeted) {
            addMessage(getTranslation('ai.greeting'), 'bot');
            greeted = true;
        }
        setTimeout(() => input.focus(), 80);
    }
    function closePanel() {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
    }

    toggle.addEventListener('click', () => {
        panel.classList.contains('open') ? closePanel() : openPanel();
    });
    closeBt.addEventListener('click', closePanel);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || busy) return;
        input.value = '';
        addMessage(text, 'user');
        history.push({ role: 'user', content: text });

        busy = true;
        sendBt.disabled = true;
        const typingEl = addMessage(getTranslation('ai.thinking'), 'bot', 'typing');

        try {
            const res = await fetch(AI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history.slice(-12), lang: currentLanguage }),
            });
            const data = await res.json();
            typingEl.remove();
            if (!res.ok || !data.reply) {
                addMessage(getTranslation('ai.error'), 'bot', 'error');
            } else {
                addMessage(data.reply, 'bot');
                history.push({ role: 'assistant', content: data.reply });
            }
        } catch {
            typingEl.remove();
            addMessage(getTranslation('ai.error'), 'bot', 'error');
        } finally {
            busy = false;
            sendBt.disabled = false;
            input.focus();
        }
    });
})();
