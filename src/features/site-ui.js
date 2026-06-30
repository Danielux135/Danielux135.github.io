import { translations } from '../data/translations.js';
import { weather } from '../state/weather.js';

// variante de saludo fija durante la sesión
const _greetIdx = Math.floor(Math.random() * 5);

// modificadores de clima que se insertan DENTRO del saludo horario
// se combinan: "[saludo base] [modificador]"  ej: "Buenos días con esta lluvia. Soy"
const _WX_MODS = [
    [0,  0,  { es: [' con este sol tan bonito',            ' con el día tan despejado que hace',      ' con lo bonito que está el día',         ' con este cielo tan limpio',              ' aprovechando este día de sol'],
               en: [' on this sunny day',                   ' with this gorgeous clear sky',            ' with all this sunshine',                ' under this perfect blue sky',            ' enjoying this clear weather'],
               val:[' amb este sol tan bonic',              ' amb el dia tan assolellat que fa',        ' amb lo bonic que està el dia',          ' amb este cel tan net',                   ' aprofitant este dia de sol'] }],
    [1,  2,  { es: [' entre nubes',                        ' con el cielo algo nublado',               ' con estas nubes dando vueltas',         ' aunque el cielo está indeciso',          ' con nubes pero sin drama'],
               en: [' under a few clouds',                  ' with a partly cloudy sky',                ' with clouds rolling in',                ' though the sky can\'t make up its mind', ' partly cloudy but fine'],
               val:[' entre núvols',                        ' amb el cel una mica ennuvolat',           ' amb estos núvols donant voltes',        ' encara que el cel està indecís',         ' amb núvols però sense drama'] }],
    [3,  3,  { es: [' con el cielo completamente cubierto',' aunque está todo nublado',                ' con estas nubes tan grises',            ' con el cielo encapotado',                ' aunque las nubes lo tapan todo'],
               en: [' under this overcast sky',             ' though it\'s fully clouded over',         ' with this grey sky',                    ' under all these clouds',                 ' though the sky is fully covered'],
               val:[' amb el cel completament cobert',      ' encara que està tot ennuvolat',           ' amb estos núvols tan grisos',           ' amb el cel encapotat',                   ' encara que els núvols ho tapen tot'] }],
    [45, 48, { es: [' con esta niebla',                    ' con la niebla que hay ahí fuera',         ' aunque no se ve nada con esta niebla',  ' con esa niebla tan espesa',              ' con la niebla cubriéndolo todo'],
               en: [' in this fog',                         ' with all this mist outside',              ' though it\'s very foggy out there',     ' in this thick fog',                      ' with fog covering everything'],
               val:[' amb esta boira',                      ' amb la boira que hi ha ací fora',         ' encara que no es veu res amb esta boira',' amb eixa boira tan espessa',            ' amb la boira cobrint-ho tot'] }],
    [51, 57, { es: [' con esta llovizna fina',             ' aunque cae un chirimiri ahí fuera',       ' con esa lluvia fina tan molesta',       ' con este orbayu tan fino',               ' aunque cae una lluvia finísima'],
               en: [' in this light drizzle',               ' with a fine rain outside',                ' with this misty rain',                  ' in this gentle drizzle',                 ' though it\'s drizzling outside'],
               val:[' amb esta plovisquejada fina',         ' encara que cau una plujeta fina ací fora',' amb eixa pluja fina tan molesta',       ' amb esta banyeta tan fina',              ' encara que cau una pluja finíssima'] }],
    [61, 67, { es: [' con la que está cayendo',            ' aunque llueve bastante ahí fuera',        ' con esta lluvia tan insistente',        ' con este día tan lluvioso',              ' aunque el agua no para'],
               en: [' in this rain',                        ' though it\'s raining pretty hard',        ' with all this rain outside',            ' on this rainy day',                      ' though the rain won\'t stop'],
               val:[' amb la que està caient',              ' encara que plou bastant ací fora',        ' amb esta pluja tan insistent',          ' amb este dia tan plujós',                ' encara que l\'aigua no para'] }],
    [71, 77, { es: [' con la nieve cayendo ahí fuera',     ' aunque está nevando',                     ' con este día de nieve',                 ' con todo esto nevado',                   ' aunque los copos no paran'],
               en: [' with snow falling outside',           ' though it\'s snowing out there',          ' on this snowy day',                     ' with everything covered in snow',        ' with snowflakes falling'],
               val:[' amb la neu caient ací fora',          ' encara que està nevant',                  ' amb este dia de neu',                   ' amb tot això nevat',                     ' encara que els flocs no paren'] }],
    [80, 82, { es: [' con estos chubascos',                ' aunque vienen chubascos',                 ' entre lluvia y claros',                 ' con esta lluvia a ratos',                ' aunque no se sabe si lloverá o no'],
               en: [' with these passing showers',         ' though showers are coming through',       ' between rain and sunshine',             ' with this on-and-off rain',              ' though it can\'t decide to rain or not'],
               val:[' amb estos ruixats',                   ' encara que vénen ruixats',                ' entre pluja i clarors',                 ' amb esta pluja a estones',               ' encara que no se sap si plourà o no'] }],
    [85, 86, { es: [' con el granizo que cae',             ' aunque está cayendo granizo',             ' con este granizo, ten cuidado',         ' con los pedriscos que están cayendo',    ' aunque cae granizo ahí fuera'],
               en: [' with hail falling outside',           ' though it\'s hailing out there',          ' with this hail, be careful',            ' with hailstones coming down',            ' though hail is falling outside'],
               val:[' amb la pedra que cau',                ' encara que està caient pedra',            ' amb esta pedregada, vés amb compte',   ' amb els pedregades que estan caient',    ' encara que cau pedra ací fora'] }],
    [95, 99, { es: [' con esta tormenta',                  ' aunque hay tormenta ahí fuera',           ' con los rayos y truenos que hay',       ' con esta tormenta tan aparatosa',        ' aunque el cielo está en guerra'],
               en: [' in this storm',                       ' though there\'s a storm outside',         ' with all this thunder and lightning',   ' in this wild storm',                     ' though the sky is putting on a show'],
               val:[' amb esta tempesta',                   ' encara que hi ha tempesta ací fora',      ' amb els llamps i trons que hi ha',      ' amb esta tempesta tan aparatosa',        ' encara que el cel està en guerra'] }],
];

// devuelve el modificador de clima para insertar en el saludo, o '' si no hay clima
function _wxMod(lang) {
    if (!weather.enabled || weather.code === null) return '';
    for (const [lo, hi, mods] of _WX_MODS) {
        if (weather.code >= lo && weather.code <= hi) {
            const opts = mods[lang] || mods.es;
            return opts[_greetIdx % opts.length];
        }
    }
    return '';
}

// actualiza el eyebrow del hero combinando saludo horario + modificador de clima
export function updateWeatherEyebrow() {
    const lang = document.documentElement.lang || 'es';
    document.querySelectorAll('[data-i18n="hero.eyebrow"]').forEach(el => {
        el.textContent = getCombinedGreeting(lang);
    });
}

// combina el saludo horario con el modificador de clima en una frase natural
function getCombinedGreeting(lang) {
    const base = getGreeting(lang);   // ej: "Buenos días, soy"
    const mod  = _wxMod(lang);        // ej: " con esta lluvia"
    if (!mod) return base;
    // inserta el mod justo antes del "Soy" / "I am" / "Soc" al final
    const suffix = { es: ' Soy', en: ' I am', val: ' Soc' }[lang] || ' Soy';
    if (base.endsWith(suffix)) {
        return base.slice(0, -suffix.length) + mod + '.' + suffix;
    }
    return base + mod;
}

// devuelve el saludo según la hora del día e idioma activo
function getGreeting(lang) {
    const h = new Date().getHours();
    const G = {
        es: [
            [0,  4,  ['¿Todavía despierto/a? Soy',        '¿A estas horas? Soy',                  'El insomnio mola. Soy',             'Las noches son para los valientes. Soy',   'Programando a deshoras. Soy']],
            [5,  7,  ['Madrugador/a, ¿eh? Soy',           'El café aún está caliente. Soy',        '¡Vaya energía tan temprano! Soy',   'Pillándote en el amanecer. Soy',           'Las 5 de la mañana y tú aquí. Soy']],
            [8,  11, ['Buenos días, soy',                  '¡Buen provecho si desayunas! Soy',      'Mañana productiva por delante. Soy','¿Con o sin café por las mañanas? Soy',    'Empezando el día con buen pie. Soy']],
            [12, 13, ['¿Sin comer aún? Soy',               '¿Menú del día o tupper? Soy',           'Hora del bocata. Soy',              'A ver si comes algo, anda. Soy',           'El estómago manda. Soy']],
            [14, 16, ['Buenas tardes, soy',                'Hora de la siesta... o no. Soy',        'La tarde es tuya. Soy',             'Media tarde y aquí me tienes. Soy',        '¿Buscando inspiración a esta hora? Soy']],
            [17, 19, ['¡Pillándote la tarde! Soy',         'El sol ya baja. Soy',                   'Hora del afterwork. Soy',           'La tarde-noche empieza. Soy',              'La mejor hora del día. Soy']],
            [20, 22, ['Buenas noches, soy',                '¿Scrolleando antes de dormir? Soy',     'Noche tranquila. Soy',              'La noche es joven. Soy',                   '¿Todavía con energía? Soy']],
            [23, 23, ['Mañana te arrepentirás... Soy',     '¿Seguro que no es mejor dormir? Soy',  'El sueño puede esperar. Soy',       'Las doce y aquí estás. Soy',               'Noche de locos. Soy']],
        ],
        en: [
            [0,  4,  ['Up this late? I am',               'Can\'t sleep? I am',                    'Night owl detected. I am',          'Burning the midnight oil? I am',           'The night is yours. I am']],
            [5,  7,  ['Early bird! I am',                  'Coffee\'s still hot. I am',             'Rise and shine! I am',              'Up before the sun? I am',                  'Morning hustle. I am']],
            [8,  11, ['Good morning, I am',                'Hope you had breakfast. I am',          'Productive morning ahead. I am',    'Starting the day right? I am',             'Coffee in hand? I am']],
            [12, 13, ['Lunch break? I am',                 'Sandwich or leftovers? I am',           'Time to eat. I am',                 'Don\'t skip lunch! I am',                  'Midday check-in. I am']],
            [14, 16, ['Good afternoon, I am',              'Siesta time? Not for me. I am',         'The afternoon is yours. I am',      'Still going strong? I am',                 'Afternoon browse? I am']],
            [17, 19, ['Golden hour! I am',                 'Sun\'s going down. I am',               'Afterwork time. I am',              'Winding down the day? I am',               'Best time of day. I am']],
            [20, 22, ['Good evening, I am',                'Scrolling before bed? I am',            'Quiet night. I am',                 'Night\'s still young. I am',               'Evening vibes. I am']],
            [23, 23, ['Tomorrow you\'ll regret this. I am','Sleep is overrated. I am',              'Just five more minutes? I am',      'Midnight browsing? I am',                  'Last one awake? I am']],
        ],
        val: [
            [0,  4,  ['Encara despert/a? Soc',            'A aquestes hores? Soc',                 'L\'insomni mola. Soc',              'Les nits són per als valents. Soc',        'Programant a deshores. Soc']],
            [5,  7,  ['Matiner/a, eh? Soc',               'El cafè encara és calent. Soc',         'Quina energia tan prompte! Soc',    'Pillant-te a l\'alba. Soc',                'Les 5 del matí i tu ací. Soc']],
            [8,  11, ['Bon dia, soc',                      'Bon profit si esmorzes! Soc',           'Bon matí productiu per davant. Soc','Amb o sense cafè? Soc',                    'Començant el dia amb bon peu. Soc']],
            [12, 13, ['Sense dinar encara? Soc',           'Menú o tupper? Soc',                    'Hora del pa. Soc',                  'A veure si menges algo. Soc',              'L\'estómac mana. Soc']],
            [14, 16, ['Bona vesprada, soc',                'Hora de la migdiada... o no. Soc',      'La vesprada és teua. Soc',          'Migdia passat i ací estic. Soc',           'Buscant inspiració? Soc']],
            [17, 19, ['Pillant-te la vesprada! Soc',      'El sol ja baixa. Soc',                  'Hora de l\'afterwork. Soc',         'La vesprada-nit comença. Soc',             'La millor hora del dia. Soc']],
            [20, 22, ['Bona nit, soc',                     'Fent scroll abans de dormir? Soc',      'Nit tranquil·la. Soc',              'La nit és jove. Soc',                      'Encara amb energia? Soc']],
            [23, 23, ['Demà te\'n penediràs... Soc',       'Segur que no és millor dormir? Soc',    'El son pot esperar. Soc',           'Les dotze i ací estàs. Soc',               'Nit de bojos. Soc']],
        ],
    };
    const rows = G[lang] || G.es;
    for (const [lo, hi, opts] of rows) {
        if (h >= lo && h <= hi) return opts[_greetIdx % opts.length];
    }
    return G.es[2][0];
}


// idioma activo, persistido en localStorage
export let currentLanguage = localStorage.getItem('portfolioLanguage') || 'es';
// roles del typewriter para el idioma actual
let currentRoles = translations[currentLanguage].hero.roles;
let typeTimeoutId;
export const navbar = document.getElementById('navbar');
const metaDescription = document.querySelector('meta[name="description"]');
const languageButtons = document.querySelectorAll('#langSwitcher .lang-btn');
const langSwitcher   = document.getElementById('langSwitcher');
const langPillLabel  = document.getElementById('langPillLabel');
// abre el selector de idioma al hacer clic en la pastilla
if (langSwitcher) {
    langSwitcher.addEventListener('click', () => {
        if (!langSwitcher.classList.contains('open')) langSwitcher.classList.add('open');
    });
    document.addEventListener('click', (e) => {
        if (!langSwitcher.contains(e.target)) langSwitcher.classList.remove('open');
    });
}
// añade la clase scrolled al navbar cuando el usuario baja de 40px
if (navbar) window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });
// vídeos disponibles para el overlay del logo fosky
const FOSKY_VIDS = [
    'assets/fosky-1.mp4', 'assets/fosky-2.mp4', 'assets/fosky-3.mp4',
    'assets/fosky-4.mp4', 'assets/fosky-5.mp4', 'assets/fosky-6.mp4',
];
// frases aleatorias que muestra la burbuja del gato
const FOSKY_PHRASES = [
    // clásicos
    '¡Meow!',
    'Probablemente quiera un café.',
    'La página web es reactiva,\n¡prueba a poner música!',
    '¿Me estás mirando a mí?',
    'Soy el verdadero programador aquí.',
    // nuevas
    '...¿tienes croquetas?',
    'He revisado el código. Está bien.',
    '¡Bonito portfolio, lo sé!',
    'Pspsps...',
    'Ctrl+C, Ctrl+V.\nAsí es como se programa.',
    'No soy un gato cualquiera.\nSoy un gato con portfolio.',
    'Error 404: croquetas no encontradas.',
    // adicionales
    '*se lame la pata*\n...¿qué mirabas?',
    'He tirado algo de la mesa.\nFue necesario.',
    'Miau significa\n"dame atención ahora".',
    'Los lunes los inventó\nalguien sin gato.',
    'Técnicamente soy\nel director creativo.',
    'He pisado el teclado\ny he mejorado el código.',
    'Si falla, echa la culpa al perro.',
    '*ronronea en binario*',
    'El 99% del tiempo duermo.\nEl 1% lo dedico a esto.',
    '¿Tienes ratón? Pregunto por un amigo.',
    'Stack Overflow está\nbien, pero yo estoy mejor.',
    'Abrir 47 pestañas\nes completamente normal.',
    'He auditado la web.\nNecesita más gatos.',
    'Null pointer? Yo nunca fallo.\nSoy un gato.',
    // juicios y bugs
    '*te juzga en silencio*',
    'El café es para los débiles.\nYo tomo leche.',
    'Bug encontrado.\nEra feature. Sigo.',
    '¿Commits a las 3am?\nYo también estoy despierto.',
    'Mi repo secreto\ntiene 0 bugs y 100% tests.\n(No existe.)',
    'Mew.',
];
// referencias al dom del logo fosky y su overlay
const foskyWrap    = document.getElementById('foskyWrap');
const foskyExpEl   = document.getElementById('foskyExpanded');
const foskyExpVid  = document.getElementById('foskyExpVid');
const foskyBubble  = document.getElementById('foskyBubble');
let _foskyOpen  = false;
let _foskyLast  = -1;    // índice del último vídeo reproducido
let _foskyPhrLast = -1;  // índice de la última frase mostrada

// cierra el overlay del logo con transición y detiene el vídeo
function foskyClose() {
    if (!_foskyOpen) return;
    _foskyOpen = false;
    foskyExpEl.classList.add('closing');
    foskyExpEl.classList.remove('open');
    foskyWrap.classList.remove('fosky-playing');
    foskyExpEl.addEventListener('transitionend', () => {
        foskyExpEl.classList.remove('closing');
        foskyExpEl.setAttribute('aria-hidden', 'true');
        foskyExpVid.pause();
        foskyExpVid.src = '';
    }, { once: true });
}

// abre el overlay del logo con vídeo y frase aleatorios sin repetir el anterior
function foskyOpen() {
    // vídeo aleatorio sin repetir el anterior
    let idx;
    do { idx = Math.floor(Math.random() * FOSKY_VIDS.length); } while (idx === _foskyLast && FOSKY_VIDS.length > 1);
    _foskyLast = idx;

    // frase aleatoria sin repetir la anterior
    let pi;
    do { pi = Math.floor(Math.random() * FOSKY_PHRASES.length); } while (pi === _foskyPhrLast && FOSKY_PHRASES.length > 1);
    _foskyPhrLast = pi;

    foskyBubble.textContent = FOSKY_PHRASES[pi];
    foskyExpVid.src = FOSKY_VIDS[idx];
    foskyExpVid.load();
    foskyExpEl.setAttribute('aria-hidden', 'false');
    foskyExpEl.classList.remove('closing');

    foskyExpVid.play().catch(() => {});

    // abre tras un frame para que la transición css se aplique
    requestAnimationFrame(() => requestAnimationFrame(() => {
        foskyExpEl.classList.add('open');
        _foskyOpen = true;
        foskyWrap.classList.add('fosky-playing');
        foskyWrap.classList.remove('fosky-bounce');
        void foskyWrap.offsetWidth;
        foskyWrap.classList.add('fosky-bounce');
    }));

    foskyExpVid.onended = foskyClose;
}

const foskyHint = document.getElementById('foskyHint');
// muestra el hint de "haz click" brevemente y programa la siguiente aparición
function foskyShowHint() {
    if (_foskyOpen || !foskyHint) return;
    foskyHint.classList.add('visible');
    setTimeout(() => foskyHint.classList.remove('visible'), 3000);
    // siguiente aparición: entre 25 y 45 segundos
    setTimeout(foskyShowHint, 25000 + Math.random() * 20000);
}
// primera aparición a los 8 segundos tras cargar la página
setTimeout(foskyShowHint, 8000);

// eventos de interacción con el logo y el overlay
if (foskyWrap && foskyExpEl) {
    foskyWrap.addEventListener('click', e => {
        e.preventDefault();
        _foskyOpen ? foskyClose() : foskyOpen();
    });
    foskyWrap.addEventListener('animationend', () => foskyWrap.classList.remove('fosky-bounce'));

    // clic fuera del overlay también cierra
    foskyExpEl.addEventListener('click', foskyClose);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') foskyClose(); });
}

// toggle del menú hamburguesa en móvil
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        navToggle.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            navLinks.classList.remove('open');
            navToggle.classList.remove('open');
            navToggle.setAttribute('aria-expanded', false);
        });
    });
}
// resuelve una clave anidada de traducciones para el idioma dado
export function getTranslation(key, language = currentLanguage) {
    return key.split('.').reduce((value, part) => value?.[part], translations[language]);
}
// estado del typewriter: índice de rol, carácter y dirección
let roleIdx = 0, charIdx = 0, deleting = false;
const typeEl = document.getElementById('typewriter');
// programa el siguiente tick del typewriter con el delay indicado
function queueTypeWriter(delay) {
    typeTimeoutId = window.setTimeout(typeWriter, delay);
}
// escribe y borra el rol actual letra a letra en el elemento typewriter
function typeWriter() {
    if (!typeEl || !currentRoles?.length) return;
    const current = currentRoles[roleIdx];
    if (!deleting) {
        typeEl.textContent = current.slice(0, ++charIdx);
        if (charIdx === current.length) {
            deleting = true;
            queueTypeWriter(2200);
            return;
        }
    } else {
        typeEl.textContent = current.slice(0, --charIdx);
        if (charIdx === 0) {
            deleting = false;
            roleIdx = (roleIdx + 1) % currentRoles.length;
            queueTypeWriter(450);
            return;
        }
    }
    queueTypeWriter(deleting ? 38 : 78);
}
// reinicia el typewriter desde el principio (se llama al cambiar de idioma)
function resetTypewriter() {
    window.clearTimeout(typeTimeoutId);
    roleIdx = 0;
    charIdx = 0;
    deleting = false;
    if (typeEl) {
        typeEl.textContent = '';
        typeWriter();
    }
}
// actualiza todos los textos, atributos aria y metadatos al idioma elegido
function applyTranslations(language) {
    currentLanguage = language;
    currentRoles = getTranslation('hero.roles', language);
    document.documentElement.lang = language === 'val' ? 'ca' : language;
    document.title = getTranslation('meta.title', language);
    if (metaDescription) {
        metaDescription.setAttribute('content', getTranslation('meta.description', language));
    }
    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const value = getTranslation(element.dataset.i18n, language);
        if (typeof value === 'string') {
            element.textContent = element.dataset.i18n === 'hero.eyebrow'
                ? getCombinedGreeting(language)
                : value;
        }
    });
    document.querySelectorAll('[data-i18n-html]').forEach((element) => {
        const value = getTranslation(element.dataset.i18nHtml, language);
        if (typeof value === 'string') {
            element.innerHTML = value;
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
        const value = getTranslation(element.dataset.i18nPlaceholder, language);
        if (typeof value === 'string') {
            element.setAttribute('placeholder', value);
        }
    });
    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
        const value = getTranslation(element.dataset.i18nTitle, language);
        if (typeof value === 'string') {
            element.setAttribute('title', value);
        }
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
        const value = getTranslation(element.dataset.i18nAlt, language);
        if (typeof value === 'string') {
            element.setAttribute('alt', value);
        }
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
        const value = getTranslation(element.dataset.i18nAriaLabel, language);
        if (typeof value === 'string') {
            element.setAttribute('aria-label', value);
        }
    });
    languageButtons.forEach((button) => {
        const isActive = button.dataset.lang === language;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive);
    });
    if (langPillLabel) langPillLabel.textContent = language.toUpperCase();
    langSwitcher.classList.remove('open');
    localStorage.setItem('portfolioLanguage', language);
    if (window._bgUpdateLabel) window._bgUpdateLabel();
    if (window._ctaUpdateText) window._ctaUpdateText();
    if (window._studioUpdateText) window._studioUpdateText();
    resetTypewriter();
    // notifica al OS taskbar si está montado
    if (window._osTaskbarSetLang) window._osTaskbarSetLang(language);
}
// expone el cambio de idioma para que el OS taskbar pueda dispararlo
window._setPortfolioLang = applyTranslations;
// conecta cada botón de idioma con applyTranslations
languageButtons.forEach((button) => {
    button.addEventListener('click', () => applyTranslations(button.dataset.lang));
});
// aplica el idioma inicial al cargar
applyTranslations(currentLanguage);
// animaciones de entrada escalonadas al hacer scroll (scroll reveal)
const revealEls = document.querySelectorAll('.reveal');
// asigna delays de transición escalonados a los elementos reveal de cada sección
document.querySelectorAll('.section, #hero').forEach(section => {
    section.querySelectorAll('.reveal').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.09}s`;
    });
});
// observa los elementos reveal y los marca visible al entrar en pantalla
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });
revealEls.forEach(el => revealObserver.observe(el));
// anima las entradas del hero al cargar la página con retardo escalonado
window.addEventListener('load', () => {
    document.querySelectorAll('.hero-content .fade-up').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), 180 + i * 140);
    });
});
// anima las barras de habilidades cuando el panel entra en pantalla
const skillsPanel = document.querySelector('.skills-panel');
if (skillsPanel) {
    const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll('.skill-bar').forEach((bar, i) => {
                const level = bar.getAttribute('data-level');
                setTimeout(() => {
                    bar.querySelector('.bar-fill').style.width = level + '%';
                }, 80 + i * 110);
            });
            barObserver.unobserve(entry.target);
        });
    }, { threshold: 0.3 });
    barObserver.observe(skillsPanel);
}
