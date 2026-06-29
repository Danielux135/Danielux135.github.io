import './core/theme.js';
// carga diferida: el OS solo se activa si el usuario elige ese tema
import('./features/os/index.js');
// inspector dev: se activa solo cuando el tema developer está activo
import('./features/dev-inspector.js');
import './features/site-ui.js';
import './visuals/hero-studio.js';
import './features/section-navigation.js';
import './features/player.js';
import './features/page-effects.js';
import './features/contact-form.js';
import './features/command-palette.js';
import './features/demo-hub.js';
import './features/media-keys.js';
// Carga diferida: el chat no se necesita hasta que el usuario abre el panel
import('./features/ai-chat.js');
import './arcade/loader.js';
import './arcade/promo.js';
