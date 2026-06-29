// pantalla de arranque del OS — se muestra al activar el tema y desaparece sola
const BOOT_LINES = [
    'DANIELUX OS v1.0.0',
    'Iniciando kernel visual…',
    'Cargando módulos: [player] [arcade] [blog]',
    'Montando sistema de ventanas…',
    'Aplicando tema de escritorio…',
    'Bienvenido, Daniel.',
];

const BOOT_MS = 1800; // duración total de la pantalla de boot

export function show() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.id = 'os-boot';
        el.innerHTML = `
            <div class="os-boot-inner">
                <div class="os-boot-logo">
                    <i class="fa-solid fa-desktop"></i>
                    <span>DANIELUX OS</span>
                </div>
                <div class="os-boot-log" id="osBootLog"></div>
                <div class="os-boot-bar"><div class="os-boot-fill" id="osBootFill"></div></div>
            </div>
        `;
        document.body.appendChild(el);

        const log  = el.querySelector('#osBootLog');
        const fill = el.querySelector('#osBootFill');
        const step = BOOT_MS / (BOOT_LINES.length + 1);

        BOOT_LINES.forEach((line, i) => {
            setTimeout(() => {
                const p = document.createElement('p');
                p.textContent = `> ${line}`;
                log.appendChild(p);
                log.scrollTop = log.scrollHeight;
                fill.style.width = `${((i + 1) / BOOT_LINES.length) * 100}%`;
            }, step * (i + 1));
        });

        setTimeout(() => {
            el.classList.add('os-boot--out');
            setTimeout(() => { el.remove(); resolve(); }, 300);
        }, BOOT_MS + 100);
    });
}
