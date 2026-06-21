/* Worker del fondo del arcade: ejecuta el motor de render en su propio hilo sobre
   un OffscreenCanvas, así el hilo principal queda libre para las notas y el carrusel.
   El hilo principal le envía el estado (beat + colores + tamaño) cada frame. */
import { makeArcadeBg } from './background.js';

let state = {
    w: 0, h: 0, beat: 0,
    a1r: [0, 200, 255], a2r: [139, 92, 246],
    gcols: [[0, 200, 255], [139, 92, 246]],
};
let engine = null;

self.onmessage = (e) => {
    const d = e.data;
    if (!d) return;
    switch (d.type) {
        case 'init':
            engine = makeArcadeBg(d.canvas, () => state);
            engine.start();
            break;
        case 'state':
            state.w = d.w; state.h = d.h; state.beat = d.beat;
            state.a1r = d.a1r; state.a2r = d.a2r; state.gcols = d.gcols;
            break;
        case 'show':
            engine && engine.start();
            break;
        case 'hide':
            engine && engine.stop();
            break;
    }
};
