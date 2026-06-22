import { initDemoHub } from './controller.js';

function bootDemoHub() {
    initDemoHub();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootDemoHub, { once: true });
} else {
    bootDemoHub();
}

export { initDemoHub };
