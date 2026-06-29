import { Arcade } from './runtime.js';
import './games/beat-striker.js';
import './games/hero-mode.js';
import './games/wave-rider.js';
import './games/echo-sequence.js';
import './games/ring-escape.js';
import './games/bpm-hunter.js';
import './games/bass-invaders.js';
import './games/beat-blitz.js';
import './games/party-arena.js';
import './art.js';

let initialized = false;

export function initArcade() {
    if (!initialized) {
        Arcade.init();
        initialized = true;
    }
    return Arcade;
}

export function open() {
    initArcade().open();
}

export { Arcade };
