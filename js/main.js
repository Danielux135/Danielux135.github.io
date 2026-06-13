'use strict';
(function initTheme() {
    const saved = localStorage.getItem('portfolioTheme');
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLight) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('portfolioTheme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('portfolioTheme', 'light');
        }
    });
})();
// Índice fijo por sesión: la misma variante en los 3 idiomas (coherencia al cambiar idioma)
const _greetIdx = Math.floor(Math.random() * 3);
function getGreeting(lang) {
    const h = new Date().getHours();
    const G = {
        es: [
            // [lo, hi, [opción0, opción1, opción2]]
            [0,  4,  ['¿Todavía despierto/a? Soy',        '¿A estas horas? Soy',                  'El insomnio mola. Soy']],
            [5,  7,  ['Madrugador/a, ¿eh? Soy',           'El café aún está caliente. Soy',        '¡Vaya energía tan temprano! Soy']],
            [8,  11, ['Buenos días, soy',                  '¡Buen provecho si desayunas! Soy',      'Mañana productiva por delante. Soy']],
            [12, 13, ['¿Sin comer aún? Soy',               '¿Menú del día o tupper? Soy',           'Hora del bocata. Soy']],
            [14, 16, ['Buenas tardes, soy',                'Hora de la siesta... o no. Soy',        'La tarde es tuya. Soy']],
            [17, 19, ['¡Pillándote la tarde! Soy',         'El sol ya baja. Soy',                   'Hora del afterwork. Soy']],
            [20, 22, ['Buenas noches, soy',                '¿Scrolleando antes de dormir? Soy',     'Noche tranquila. Soy']],
            [23, 23, ['Mañana te arrepentirás... Soy',     '¿Seguro que no es mejor dormir? Soy',  'El sueño puede esperar. Soy']],
        ],
        en: [
            [0,  4,  ['Up this late? I am',               'Can\'t sleep? I am',                    'Night owl detected. I am']],
            [5,  7,  ['Early bird! I am',                  'Coffee\'s still hot. I am',             'Rise and shine! I am']],
            [8,  11, ['Good morning, I am',                'Hope you had breakfast. I am',          'Productive morning ahead. I am']],
            [12, 13, ['Lunch break? I am',                 'Sandwich or leftovers? I am',           'Time to eat. I am']],
            [14, 16, ['Good afternoon, I am',              'Siesta time? Not for me. I am',         'The afternoon is yours. I am']],
            [17, 19, ['Golden hour! I am',                 'Sun\'s going down. I am',               'Afterwork time. I am']],
            [20, 22, ['Good evening, I am',                'Scrolling before bed? I am',            'Quiet night. I am']],
            [23, 23, ['Tomorrow you\'ll regret this. I am','Sleep is overrated. I am',              'Just five more minutes? I am']],
        ],
        val: [
            [0,  4,  ['Encara despert/a? Soc',            'A aquestes hores? Soc',                 'L\'insomni mola. Soc']],
            [5,  7,  ['Matiner/a, eh? Soc',               'El cafè encara és calent. Soc',         'Quina energia tan prompte! Soc']],
            [8,  11, ['Bon dia, soc',                      'Bon profit si esmorzes! Soc',           'Bon matí productiu per davant. Soc']],
            [12, 13, ['Sense dinar encara? Soc',           'Menú o tupper? Soc',                    'Hora del pa. Soc']],
            [14, 16, ['Bona vesprada, soc',                'Hora de la migdiada... o no. Soc',      'La vesprada és teua. Soc']],
            [17, 19, ['Pillant-te la vesprada! Soc',      'El sol ja baixa. Soc',                  'Hora de l\'afterwork. Soc']],
            [20, 22, ['Bona nit, soc',                     'Fent scroll abans de dormir? Soc',      'Nit tranquil·la. Soc']],
            [23, 23, ['Demà te\'n penediràs... Soc',       'Segur que no és millor dormir? Soc',    'El son pot esperar. Soc']],
        ],
    };
    const rows = G[lang] || G.es;
    for (const [lo, hi, opts] of rows) {
        if (h >= lo && h <= hi) return opts[_greetIdx % opts.length];
    }
    return G.es[2][0];
}

const translations = {
    es: {
        meta: {
            title: 'Daniel Bort Guzmán | Developer · Musician · Creator',
            description: 'Portfolio de Daniel Bort Guzmán — Linux, Java, IA, Web Fullstack y música profesional.'
        },
        nav: {
            about: 'Sobre mí',
            music: 'Música',
            legacy: 'Gestión musical',
            projects: 'Proyectos',
            contact: 'Contacto',
            cv: 'CV',
            openMenu: 'Abrir menú'
        },
        lang: {
            selector: 'Selector de idioma'
        },
        aria: {
            openMenu: 'Abrir menú',
            scrollDown: 'Bajar',
            sectionNavigation: 'Navegación entre secciones',
            previousSection: 'Ir a la sección anterior',
            nextSection: 'Ir a la siguiente sección'
        },
        hero: {
            eyebrow: 'Hola, soy',
            ctaAbout: 'Sobre mí',
            ctaMusic: 'Mi música',
            ctaLegacy: 'Gestión musical',
            ctaProjects: 'Proyectos',
            ctaContact: 'Contacto',
            scroll: 'Scroll',
            statusAvailable: 'Disponible · webs a medida, mantenimiento y rediseños',
            roles: [
                'Developer · Linux · Java',
                'Desarrollador web fullstack',
                'IA aplicada a la música',
                'Gestión de servidores desde los 14 años',
                'Creador de contenido digital',
            ]
        },
        about: {
            title: 'Sobre mí',
            p1: 'Soy un <strong>profesional autodidacta</strong> con experiencia real desde los 14 años en entornos Linux, despliegue de servicios web y gestión de servidores de videojuegos y multimedia. Me apasiona la tecnología, la inteligencia artificial aplicada y la creación de contenido digital.',
            p2: 'Actualmente cursando el certificado de profesionalidad <strong>IFCD0210 – Desarrollo de Aplicaciones con Tecnologías Web</strong> (660 h), con base previa sólida en sistemas Linux, programación en Java y producción musical profesional con IA.',
            chips: {
                linux: 'Linux',
                java: 'Java',
                html: 'HTML',
                css: 'CSS',
                javascript: 'JavaScript',
                php: 'PHP',
                mysql: 'MySQL',
                ai: 'IA aplicada',
                servers: 'Servidores',
                aiMusic: 'Música con IA',
                streaming: 'Streaming'
            }
        },
        skills: {
            title: 'Nivel de capacidades',
            level: {
                expert: 'Experto',
                advanced: 'Avanzado',
                high: 'Alto',
                progress: 'En progreso'
            },
            ai: { label: 'IA aplicada' },
            aiMusic: { label: 'Música con IA' },
            streaming: { label: 'Streaming y contenido' },
            linux: { label: 'Linux y administración' },
            gameServers: { label: 'Servidores de videojuegos' },
            hosting: { label: 'Hosting web / WordPress' },
            java: { label: 'Java SE' },
            fullstack: { label: 'Desarrollo web fullstack' }
        },
        music: {
            title: 'Música',
            desc: 'Bajo el nombre artístico <strong>Danielux</strong>, publico música producida profesionalmente con inteligencia artificial en todas las grandes plataformas. El tema <a href="https://www.youtube.com/watch?v=8RBLLrBEJGI" target="_blank" rel="noopener">Nobody New (Danielux Remix)</a> llegó a situarse entre el <strong>top 3 de canciones más reproducidas</strong> en <a href="https://www.siriusxm.com/channels/chill" target="_blank" rel="noopener">SiriusXM Chill</a>, según el seguimiento público del histórico en <a href="https://xmplaylist.com/station/siriusxmchill/track/UM8O-YI7R" target="_blank" rel="noopener">xmplaylist</a>, dentro de una plataforma que comunica una audiencia mensual combinada aproximada de 255 millones de oyentes en Norteamérica.',
            spotifyTitle: 'Danielux en Spotify',
            highlightKicker: 'Destacado en radio',
            highlightTitle: 'Nobody New (Danielux Remix)',
            highlightText: 'Emitida en <strong>SiriusXM Chill</strong> y situada en el top 3 de canciones más reproducidas según el histórico público del enlace de seguimiento.',
            embedTitle: 'Nobody New (Danielux Remix)',
            historyLink: 'Ver histórico',
            platformsTitle: 'Escúchame en',
            stat1: 'Oyentes potenciales SiriusXM',
            stat2: 'Top en SiriusXM Chill',
            stat3: 'Plataformas de distribución',
            stat4: 'Lanzamientos publicados'
        },
        legacy: {
            title: 'Gestión musical',
            desc: 'Proyecto separado de Danielux, centrado en la gestión, coordinación y desarrollo de las producciones musicales de Eduardo Bort, incluyendo su presencia y publicación en plataformas musicales.',
            kicker: 'Proyecto independiente',
            cardTitle: 'Proyecto Eduardo Bort',
            cardText: 'Gestión integral del proyecto musical de Eduardo Bort como apoyo directo y mánager: coordinación de lanzamientos, organización de producciones, presencia digital y distribución en plataformas musicales. Actualmente colaborando con <strong><a href="https://es.wikipedia.org/wiki/Arturo_Valls" target="_blank" rel="noopener">Arturo Valls</a></strong> y el director de cine <strong><a href="https://www.imdb.com/name/nm3760767/" target="_blank" rel="noopener">Jon Mikel Caballero</a></strong> en una producción sobre la figura y el legado de Eduardo Bort.',
            link: 'Más información',
            rolesTitle: 'Mi papel en el proyecto',
            role1Title: 'Coordinación de lanzamientos',
            role1Desc: 'Planificación y ejecución de cada publicación en plataformas digitales.',
            role2Title: 'Organización de producciones',
            role2Desc: 'Supervisión del flujo de trabajo musical, desde la idea hasta el master final.',
            role3Title: 'Presencia digital',
            role3Desc: 'Gestión de perfiles en Spotify, Apple Music, YouTube y otras plataformas.',
            role4Title: 'Distribución',
            role4Desc: 'Distribución a través de distribuidoras digitales en más de 150 plataformas.'
        },
        player: {
            kicker: 'Escucha aquí',
            title: 'Mis temas',
            linkCopied: '¡Enlace copiado!',
            linkError: 'No se pudo copiar',
            noResults: 'Sin resultados'
        },
        ai: {
            title: 'Asistente',
            placeholder: 'Pregúntame sobre la web…',
            greeting: '¡Hola! Soy el asistente de esta web. Pregúntame lo que quieras sobre Daniel, su música, los proyectos o cómo está hecha la página.',
            error: 'Ups, ha habido un problema. Inténtalo de nuevo en un momento.',
            thinking: 'Escribiendo…'
        },
        cmd: {
            placeholder: 'Buscar sección, canción o acción…',
            empty: 'Sin resultados',
            groupNav: 'Navegación',
            groupTracks: 'Canciones',
            groupActions: 'Acciones',
            subSection: 'Ir a sección',
            subTrack: 'Reproducir',
            actionCv: 'Ver CV',
            actionCvSub: 'Abre el currículum en una nueva pestaña',
            actionTheme: 'Cambiar tema',
            actionThemeSub: 'Alterna entre tema claro y oscuro',
        },
        projects: {
            title: 'Proyectos',
            osulux: {
                tag: 'Java · API · Open Source',
                title: 'Osulux',
                desc: 'Aplicación propia en Java con decenas de miles de líneas de código. Soporta múltiples formatos de audio y vídeo, integra la API de YouTube con acceso privado de alto volumen aprobado manualmente, y gestiona descargas desde servidores externos.',
                link: 'Ver en GitHub'
            },
            servers: {
                tag: 'Linux · Sysadmin · Hosting',
                title: 'Administración de servidores',
                desc: 'Trayectoria desde los 14 años en instalación, configuración y mantenimiento de servidores Linux: videojuegos, multimedia y hosting web. Diagnóstico de incidencias, optimización de rendimiento y asesoramiento técnico.',
                link: 'Ver perfil en GitHub'
            },
            aiFlows: {
                tag: 'IA · Automatización · Producción',
                title: 'Flujos creativos con IA',
                desc: 'Diseño de procesos de producción asistidos por IA para música, contenido y tareas digitales, con foco en velocidad, consistencia y resultados publicables.',
                link: 'Ver sección de música'
            }
        },
        contact: {
            title: 'Contacto',
            desc: 'Disponibilidad completa e incorporación inmediata.<br>¿Hablamos?',
            labels: {
                email: 'Email',
                phone: 'Teléfono',
                linkedin: 'LinkedIn',
                github: 'GitHub',
                twitch: 'Twitch',
                youtube: 'YouTube'
            },
            form: {
                nameLabel: 'Nombre',
                namePlaceholder: 'Tu nombre',
                emailLabel: 'Email',
                emailPlaceholder: 'tu@email.com',
                messageLabel: 'Mensaje',
                messagePlaceholder: '¿En qué puedo ayudarte?',
                submit: 'Enviar mensaje'
            }
        },
        hire: {
            kicker: 'Desarrollo web',
            title: '¿Necesitas una web?',
            sub: 'La hago, la mantengo y la mejoro. Desde cero o sobre lo que ya tienes.',
            cta: 'Hablemos'
        },
        footer: {
            madeWith: 'Hecho con',
            andCoffee: 'y mucho café',
            cvLink: 'Ver CV completo'
        }
    },
    en: {
        meta: {
            title: 'Daniel Bort Guzmán | Developer · Musician · Creator',
            description: 'Portfolio of Daniel Bort Guzmán — Linux, Java, AI, Fullstack Web and professional music production.'
        },
        nav: {
            about: 'About',
            music: 'Music',
            legacy: 'Music management',
            projects: 'Projects',
            contact: 'Contact',
            cv: 'Resume',
            openMenu: 'Open menu'
        },
        lang: {
            selector: 'Language selector'
        },
        aria: {
            openMenu: 'Open menu',
            scrollDown: 'Scroll down',
            sectionNavigation: 'Section navigation',
            previousSection: 'Go to previous section',
            nextSection: 'Go to next section'
        },
        hero: {
            eyebrow: 'Hello, I am',
            ctaAbout: 'About',
            ctaMusic: 'My music',
            ctaLegacy: 'Music management',
            ctaProjects: 'Projects',
            ctaContact: 'Contact',
            scroll: 'Scroll',
            statusAvailable: 'Available · custom websites, maintenance & redesigns',
            roles: [
                'Developer · Linux · Java',
                'Fullstack web developer',
                'AI applied to music',
                'Server management since age 14',
                'Digital content creator',
            ]
        },
        about: {
            title: 'About',
            p1: 'I am a <strong>self-taught professional</strong> with real hands-on experience since age 14 in Linux environments, web service deployment, and game and multimedia server management. I am driven by technology, applied artificial intelligence, and digital content creation.',
            p2: 'I am currently completing the professional certificate <strong>IFCD0210 – Web Application Development Technologies</strong> (660 h), backed by a strong foundation in Linux systems, Java programming, and professional AI-assisted music production.',
            chips: {
                linux: 'Linux',
                java: 'Java',
                html: 'HTML',
                css: 'CSS',
                javascript: 'JavaScript',
                php: 'PHP',
                mysql: 'MySQL',
                ai: 'Applied AI',
                servers: 'Servers',
                aiMusic: 'AI music',
                streaming: 'Streaming'
            }
        },
        skills: {
            title: 'Capability level',
            level: {
                expert: 'Expert',
                advanced: 'Advanced',
                high: 'High',
                progress: 'In progress'
            },
            ai: { label: 'Applied AI' },
            aiMusic: { label: 'AI music' },
            streaming: { label: 'Streaming and content' },
            linux: { label: 'Linux and administration' },
            gameServers: { label: 'Game server infrastructure' },
            hosting: { label: 'Web hosting / WordPress' },
            java: { label: 'Java SE' },
            fullstack: { label: 'Fullstack web development' }
        },
        music: {
            title: 'Music',
            desc: 'Under the artist name <strong>Danielux</strong>, I release professionally produced AI-assisted music across the main streaming platforms. The track <a href="https://www.youtube.com/watch?v=8RBLLrBEJGI" target="_blank" rel="noopener">Nobody New (Danielux Remix)</a> reached the <strong>top 3 most-played songs</strong> on <a href="https://www.siriusxm.com/channels/chill" target="_blank" rel="noopener">SiriusXM Chill</a>, according to the public tracking history on <a href="https://xmplaylist.com/station/siriusxmchill/track/UM8O-YI7R" target="_blank" rel="noopener">xmplaylist</a>, within a platform reporting an approximate combined monthly audience of 255 million listeners across North America.',
            spotifyTitle: 'Danielux on Spotify',
            highlightKicker: 'Radio highlight',
            highlightTitle: 'Nobody New (Danielux Remix)',
            highlightText: 'Aired on <strong>SiriusXM Chill</strong> and ranked among the top 3 most-played songs according to the public tracking history.',
            embedTitle: 'Nobody New (Danielux Remix)',
            historyLink: 'View history',
            platformsTitle: 'Listen on',
            stat1: 'SiriusXM potential listeners',
            stat2: 'Top in SiriusXM Chill',
            stat3: 'Distribution platforms',
            stat4: 'Released tracks'
        },
        legacy: {
            title: 'Music management',
            desc: 'A project separate from Danielux, focused on the management, coordination, and development of Eduardo Bort’s music productions, including release presence across music platforms.',
            kicker: 'Independent project',
            cardTitle: 'Eduardo Bort Project',
            cardText: "Full support for Eduardo Bort’s music project in a manager role: coordinating releases, organizing productions, handling digital presence, and distributing work across music platforms. Currently collaborating with <strong><a href=\"https://es.wikipedia.org/wiki/Arturo_Valls\" target=\"_blank\" rel=\"noopener\">Arturo Valls</a></strong> and film director <strong><a href=\"https://www.imdb.com/name/nm3760767/\" target=\"_blank\" rel=\"noopener\">Jon Mikel Caballero</a></strong> on a production about the life and legacy of Eduardo Bort.",
            link: 'Learn more',
            rolesTitle: 'My role in the project',
            role1Title: 'Release coordination',
            role1Desc: 'Planning and execution of every publication across digital platforms.',
            role2Title: 'Production management',
            role2Desc: 'Supervising the music workflow, from concept to final master.',
            role3Title: 'Digital presence',
            role3Desc: 'Managing profiles on Spotify, Apple Music, YouTube and other platforms.',
            role4Title: 'Distribution',
            role4Desc: 'Distribution through digital distributors to over 150 platforms.'
        },
        player: {
            kicker: 'Listen here',
            title: 'My tracks',
            linkCopied: 'Link copied!',
            linkError: 'Could not copy',
            noResults: 'No results'
        },
        ai: {
            title: 'Assistant',
            placeholder: 'Ask me about the site…',
            greeting: "Hi! I'm this site's assistant. Ask me anything about Daniel, his music, the projects, or how the page is built.",
            error: 'Oops, something went wrong. Please try again in a moment.',
            thinking: 'Typing…'
        },
        cmd: {
            placeholder: 'Search section, track or action…',
            empty: 'No results',
            groupNav: 'Navigation',
            groupTracks: 'Tracks',
            groupActions: 'Actions',
            subSection: 'Go to section',
            subTrack: 'Play',
            actionCv: 'View Resume',
            actionCvSub: 'Opens the CV in a new tab',
            actionTheme: 'Toggle theme',
            actionThemeSub: 'Switch between light and dark mode',
        },
        projects: {
            title: 'Projects',
            osulux: {
                tag: 'Java · API · Open Source',
                title: 'Osulux',
                desc: 'Custom Java application with tens of thousands of lines of code. It supports multiple audio and video formats, integrates the YouTube API with manually approved high-volume private access, and handles downloads from external servers.',
                link: 'View on GitHub'
            },
            servers: {
                tag: 'Linux · Sysadmin · Hosting',
                title: 'Server administration',
                desc: 'Hands-on track record since age 14 in Linux server installation, configuration, and maintenance for games, multimedia and web hosting. Incident diagnosis, performance tuning, and technical advisory work.',
                link: 'View GitHub profile'
            },
            aiFlows: {
                tag: 'AI · Automation · Production',
                title: 'AI creative workflows',
                desc: 'Design of AI-assisted production workflows for music, content, and digital tasks, focused on speed, consistency, and publishable output.',
                link: 'View music section'
            }
        },
        contact: {
            title: 'Contact',
            desc: "Full availability and immediate start.<br>Let’s talk.",
            labels: {
                email: 'Email',
                phone: 'Phone',
                linkedin: 'LinkedIn',
                github: 'GitHub',
                twitch: 'Twitch',
                youtube: 'YouTube'
            },
            form: {
                nameLabel: 'Name',
                namePlaceholder: 'Your name',
                emailLabel: 'Email',
                emailPlaceholder: 'you@email.com',
                messageLabel: 'Message',
                messagePlaceholder: 'How can I help?',
                submit: 'Send message'
            }
        },
        hire: {
            kicker: 'Web development',
            title: 'Need a website?',
            sub: 'I build it, maintain it and improve it. From scratch or on top of what you already have.',
            cta: "Let's talk"
        },
        footer: {
            madeWith: 'Built with',
            andCoffee: 'and a lot of coffee',
            cvLink: 'View full resume'
        }
    },
    val: {
        meta: {
            title: 'Daniel Bort Guzmán | Developer · Musician · Creator',
            description: 'Portfolio de Daniel Bort Guzmán — Linux, Java, IA, web fullstack i producció musical professional.'
        },
        nav: {
            about: 'Sobre mi',
            music: 'Música',
            legacy: 'Gestió musical',
            projects: 'Projectes',
            contact: 'Contacte',
            cv: 'CV',
            openMenu: 'Obrir menú'
        },
        lang: {
            selector: "Selector d’idioma"
        },
        aria: {
            openMenu: 'Obrir menú',
            scrollDown: 'Baixar',
            sectionNavigation: 'Navegació entre seccions',
            previousSection: 'Anar a la secció anterior',
            nextSection: 'Anar a la secció següent'
        },
        hero: {
            eyebrow: 'Hola, soc',
            ctaAbout: 'Sobre mi',
            ctaMusic: 'La meua música',
            ctaLegacy: 'Gestió musical',
            ctaProjects: 'Projectes',
            ctaContact: 'Contacte',
            scroll: 'Scroll',
            statusAvailable: 'Disponible · webs a mida, manteniment i redissenys',
            roles: [
                'Developer · Linux · Java',
                'Desenvolupador web fullstack',
                'IA aplicada a la música',
                'Gestió de servidors des dels 14 anys',
                'Creador de contingut digital',
            ]
        },
        about: {
            title: 'Sobre mi',
            p1: `Soc un <strong>professional autodidacta</strong> amb experiència real des dels 14 anys en entorns Linux, desplegament de serveis web i gestió de servidors de videojocs i multimèdia. M’apassiona la tecnologia, la intel·ligència artificial aplicada i la creació de contingut digital.`,
            p2: `Actualment curse el certificat de professionalitat <strong>IFCD0210 – Desenvolupament d’Aplicacions amb Tecnologies Web</strong> (660 h), amb una base sòlida prèvia en sistemes Linux, programació en Java i producció musical professional amb IA.`,
            chips: {
                linux: 'Linux',
                java: 'Java',
                html: 'HTML',
                css: 'CSS',
                javascript: 'JavaScript',
                php: 'PHP',
                mysql: 'MySQL',
                ai: 'IA aplicada',
                servers: 'Servidors',
                aiMusic: 'Música amb IA',
                streaming: 'Streaming'
            }
        },
        skills: {
            title: 'Nivell de capacitats',
            level: {
                expert: 'Expert',
                advanced: 'Avançat',
                high: 'Alt',
                progress: 'En progrés'
            },
            ai: { label: 'IA aplicada' },
            aiMusic: { label: 'Música amb IA' },
            streaming: { label: 'Streaming i contingut' },
            linux: { label: 'Linux i administració' },
            gameServers: { label: 'Servidors de videojocs' },
            hosting: { label: 'Hosting web / WordPress' },
            java: { label: 'Java SE' },
            fullstack: { label: 'Desenvolupament web fullstack' }
        },
        music: {
            title: 'Música',
            desc: 'Baix el nom artístic <strong>Danielux</strong>, publique música produïda professionalment amb intel·ligència artificial en les principals plataformes. El tema <a href="https://www.youtube.com/watch?v=8RBLLrBEJGI" target="_blank" rel="noopener">Nobody New (Danielux Remix)</a> va arribar a situar-se entre el <strong>top 3 de cançons més reproduïdes</strong> en <a href="https://www.siriusxm.com/channels/chill" target="_blank" rel="noopener">SiriusXM Chill</a>, segons el seguiment públic de l’històric en <a href="https://xmplaylist.com/station/siriusxmchill/track/UM8O-YI7R" target="_blank" rel="noopener">xmplaylist</a>, dins d’una plataforma que comunica una audiència mensual combinada aproximada de 255 milions d’oients a Amèrica del Nord.',
            spotifyTitle: 'Danielux en Spotify',
            highlightKicker: 'Destacat en ràdio',
            highlightTitle: 'Nobody New (Danielux Remix)',
            highlightText: "Emesa en <strong>SiriusXM Chill</strong> i situada en el top 3 de cançons més reproduïdes segons l’històric públic de seguiment.",
            embedTitle: 'Nobody New (Danielux Remix)',
            historyLink: 'Veure històric',
            platformsTitle: "Escolta’m en",
            stat1: 'Oients potencials SiriusXM',
            stat2: 'Top a SiriusXM Chill',
            stat3: 'Plataformes de distribució',
            stat4: 'Llançaments publicats'
        },
        legacy: {
            title: 'Gestió musical',
            desc: "Projecte separat de Danielux, centrat en la gestió, coordinació i desenvolupament de les produccions musicals d’Eduardo Bort, incloent la seua presència i publicació en plataformes musicals.",
            kicker: 'Projecte independent',
            cardTitle: 'Projecte Eduardo Bort',
            cardText: "Gestió integral del projecte musical d’Eduardo Bort com a suport directe i mànager: coordinació de llançaments, organització de produccions, presència digital i distribució en plataformes musicals. Actualment col·laborant amb <strong><a href=\"https://es.wikipedia.org/wiki/Arturo_Valls\" target=\"_blank\" rel=\"noopener\">Arturo Valls</a></strong> i el director de cinema <strong><a href=\"https://www.imdb.com/name/nm3760767/\" target=\"_blank\" rel=\"noopener\">Jon Mikel Caballero</a></strong> en una producció sobre la figura i el llegat d’Eduardo Bort.",
            link: 'Més informació',
            rolesTitle: 'El meu paper en el projecte',
            role1Title: 'Coordinació de llançaments',
            role1Desc: 'Planificació i execució de cada publicació en plataformes digitals.',
            role2Title: 'Organització de produccions',
            role2Desc: 'Supervisió del flux de treball musical, des de la idea fins al master final.',
            role3Title: 'Presència digital',
            role3Desc: 'Gestió de perfils en Spotify, Apple Music, YouTube i altres plataformes.',
            role4Title: 'Distribució',
            role4Desc: 'Distribució a través de distribuïdores digitals en més de 150 plataformes.'
        },
        player: {
            kicker: 'Escolta ací',
            linkCopied: 'Enllaç copiat!',
            linkError: 'No s\'ha pogut copiar',
            noResults: 'Sense resultats',
            title: 'Els meus temes'
        },
        ai: {
            title: 'Assistent',
            placeholder: 'Pregunta\'m sobre la web…',
            greeting: 'Hola! Soc l\'assistent d\'esta web. Pregunta\'m el que vulgues sobre Daniel, la seua música, els projectes o com està feta la pàgina.',
            error: 'Vaja, hi ha hagut un problema. Torna-ho a provar en un moment.',
            thinking: 'Escrivint…'
        },
        cmd: {
            placeholder: 'Cerca secció, cançó o acció…',
            empty: 'Sense resultats',
            groupNav: 'Navegació',
            groupTracks: 'Cançons',
            groupActions: 'Accions',
            subSection: 'Anar a la secció',
            subTrack: 'Reproduir',
            actionCv: 'Veure CV',
            actionCvSub: 'Obri el currículum en una pestanya nova',
            actionTheme: 'Canviar tema',
            actionThemeSub: 'Alterna entre tema clar i fosc',
        },
        projects: {
            title: 'Projectes',
            osulux: {
                tag: 'Java · API · Open Source',
                title: 'Osulux',
                desc: `Aplicació pròpia en Java amb desenes de milers de línies de codi. Suporta múltiples formats d’àudio i vídeo, integra l’API de YouTube amb accés privat d’alt volum aprovat manualment i gestiona descàrregues des de servidors externs.`,
                link: 'Veure en GitHub'
            },
            servers: {
                tag: 'Linux · Sysadmin · Hosting',
                title: 'Administració de servidors',
                desc: "Trajectòria des dels 14 anys en instal·lació, configuració i manteniment de servidors Linux: videojocs, multimèdia i hosting web. Diagnòstic d’incidències, optimització del rendiment i assessorament tècnic.",
                link: 'Veure perfil en GitHub'
            },
            aiFlows: {
                tag: 'IA · Automatització · Producció',
                title: 'Fluxos creatius amb IA',
                desc: 'Disseny de processos de producció assistits per IA per a música, contingut i tasques digitals, amb focus en velocitat, consistència i resultats publicables.',
                link: 'Veure secció de música'
            }
        },
        contact: {
            title: 'Contacte',
            desc: 'Disponibilitat completa i incorporació immediata.<br>Parlem?',
            labels: {
                email: 'Email',
                phone: 'Telèfon',
                linkedin: 'LinkedIn',
                github: 'GitHub',
                twitch: 'Twitch',
                youtube: 'YouTube'
            },
            form: {
                nameLabel: 'Nom',
                namePlaceholder: 'El teu nom',
                emailLabel: 'Email',
                emailPlaceholder: 'tu@email.com',
                messageLabel: 'Missatge',
                messagePlaceholder: 'En què puc ajudar-te?',
                submit: 'Enviar missatge'
            }
        },
        hire: {
            kicker: 'Desenvolupament web',
            title: 'Necessites una web?',
            sub: "La faig, la mantinc i la millore. Des de zero o sobre el que ja tens.",
            cta: 'Parlem'
        },
        footer: {
            madeWith: 'Fet amb',
            andCoffee: 'i molt de café',
            cvLink: 'Veure CV complet'
        }
    }
};
let currentLanguage = localStorage.getItem('portfolioLanguage') || 'es';
let currentRoles = translations[currentLanguage].hero.roles;
let typeTimeoutId;
const navbar = document.getElementById('navbar');
const metaDescription = document.querySelector('meta[name="description"]');
const languageButtons = document.querySelectorAll('.lang-btn');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });
// Fosky logo — se expande con vídeo aleatorio + frase divertida al hacer click
const FOSKY_VIDS = [
    'assets/fosky-1.mp4', 'assets/fosky-2.mp4', 'assets/fosky-3.mp4',
    'assets/fosky-4.mp4', 'assets/fosky-5.mp4', 'assets/fosky-6.mp4',
];
const FOSKY_PHRASES = [
    '¡Meow!',
    'Probablemente quiera un café.',
    'La página web es reactiva,\n¡prueba a poner música!',
    '¿Me estás mirando a mí?',
    'Soy el verdadero programador aquí.',
    '...¿tienes croquetas?',
    'He revisado el código. Está bien.',
    '¡Bonito portfolio, lo sé!',
    'Pspsps...',
    'Ctrl+C, Ctrl+V.\nAsí es como se programa.',
    'No soy un gato cualquiera.\nSoy un gato con portfolio.',
    'Error 404: croquetas no encontradas.',
];
const foskyWrap    = document.getElementById('foskyWrap');
const foskyExpEl   = document.getElementById('foskyExpanded');
const foskyExpVid  = document.getElementById('foskyExpVid');
const foskyBubble  = document.getElementById('foskyBubble');
let _foskyOpen  = false;
let _foskyLast  = -1;
let _foskyPhrLast = -1;

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

function foskyOpen() {
    // Vídeo aleatorio (no repetir el anterior)
    let idx;
    do { idx = Math.floor(Math.random() * FOSKY_VIDS.length); } while (idx === _foskyLast && FOSKY_VIDS.length > 1);
    _foskyLast = idx;

    // Frase aleatoria (no repetir la anterior)
    let pi;
    do { pi = Math.floor(Math.random() * FOSKY_PHRASES.length); } while (pi === _foskyPhrLast && FOSKY_PHRASES.length > 1);
    _foskyPhrLast = pi;

    foskyBubble.textContent = FOSKY_PHRASES[pi];
    foskyExpVid.src = FOSKY_VIDS[idx];
    foskyExpVid.load();
    foskyExpEl.setAttribute('aria-hidden', 'false');
    foskyExpEl.classList.remove('closing');

    foskyExpVid.play().catch(() => {});

    // Abre tras un frame para que la transición CSS se aplique
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
function foskyShowHint() {
    if (_foskyOpen || !foskyHint) return;
    foskyHint.classList.add('visible');
    setTimeout(() => foskyHint.classList.remove('visible'), 3000);
    // Siguiente aparición: entre 25 y 45 segundos
    setTimeout(foskyShowHint, 25000 + Math.random() * 20000);
}
// Primera aparición a los 8 segundos
setTimeout(foskyShowHint, 8000);

if (foskyWrap && foskyExpEl) {
    foskyWrap.addEventListener('click', e => {
        e.preventDefault();
        _foskyOpen ? foskyClose() : foskyOpen();
    });
    foskyWrap.addEventListener('animationend', () => foskyWrap.classList.remove('fosky-bounce'));

    // Click fuera del overlay también cierra
    foskyExpEl.addEventListener('click', foskyClose);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') foskyClose(); });
}

const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
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
function getTranslation(key, language = currentLanguage) {
    return key.split('.').reduce((value, part) => value?.[part], translations[language]);
}
let roleIdx = 0, charIdx = 0, deleting = false;
const typeEl = document.getElementById('typewriter');
function queueTypeWriter(delay) {
    typeTimeoutId = window.setTimeout(typeWriter, delay);
}
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
                ? getGreeting(language)
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
    localStorage.setItem('portfolioLanguage', language);
    if (window._bgUpdateLabel) window._bgUpdateLabel();
    resetTypewriter();
}
languageButtons.forEach((button) => {
    button.addEventListener('click', () => applyTranslations(button.dataset.lang));
});
applyTranslations(currentLanguage);
const revealEls = document.querySelectorAll('.reveal');
document.querySelectorAll('.section, #hero').forEach(section => {
    section.querySelectorAll('.reveal').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.09}s`;
    });
});
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });
revealEls.forEach(el => revealObserver.observe(el));
window.addEventListener('load', () => {
    document.querySelectorAll('.hero-content .fade-up').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), 180 + i * 140);
    });
});
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
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });
const COLORS_DARK  = ['rgba(0,200,255,',  'rgba(139,92,246,',  'rgba(255,255,255,'];
const COLORS_LIGHT = ['rgba(0,120,200,',  'rgba(100,40,210,',  'rgba(30,50,120,'];
function isLight() { return document.documentElement.getAttribute('data-theme') === 'light'; }
function particleColors() { return isLight() ? COLORS_LIGHT : COLORS_DARK; }
// --- Reactividad al bombo: seguidor de envelope del sub-bass ---
// En vez de "disparar/no disparar" (que perdía golpes y brillaba sin música), seguimos
// la ENERGÍA del sub-bass (bins 1..3, ~86–344 Hz, el thump del bombo) de forma continua
// y proporcional: kick fuerte → pulso grande, kick flojo → pequeño, sin bass → oscuro.
// La gamma realza los picos del bombo sobre el resto; ataque rápido + release suave dan
// un latido marcado pero fluido. Bins 0 (rumble) y agudos quedan fuera, así no va random.
// Validado sobre audio real de 8+ estilos: cobertura de golpes 88–100%, brillo ~0 en silencio.
let _bassEnv = 0;
let _bassBuf = null; // buffer reusado: evita crear un Uint8Array nuevo cada frame (presión de GC)
function getBassEnergy() {
    const analyser = window._audioAnalyser;
    if (!analyser) {
        _bassEnv *= 0.90;
        if (_bassEnv < 0.004) _bassEnv = 0;
        return _bassEnv;
    }
    const n = analyser.frequencyBinCount;
    if (!_bassBuf || _bassBuf.length !== n) _bassBuf = new Uint8Array(n);
    const data = _bassBuf;
    analyser.getByteFrequencyData(data);

    let bass = (data[1] + data[2] + data[3]) / (3 * 255); // sub-bass medio 0..1
    const shaped = Math.pow(Math.min(bass, 1), 2.3);      // realza el kick, oscurece lo flojo

    if (shaped > _bassEnv) _bassEnv = shaped;                       // ataque instantáneo (sin retraso)
    else                   _bassEnv += (shaped - _bassEnv) * 0.14;  // release suave (fluido)
    if (_bassEnv < 0.004) _bassEnv = 0;
    return _bassEnv;
}
class Particle {
    constructor() { this.init(); }
    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.baseVx = this.vx;
        this.baseVy = this.vy;
        this.r = Math.random() * 1.8 + 0.6;
        this.baseR = this.r;
        this.baseAlpha = Math.random() * 0.35 + 0.1;
        this.colorIdx = Math.floor(Math.random() * 3);
    }
    update(beat) {
        const b2 = beat * beat;
        const boost = 1 + beat * 18;
        this.x += this.vx * boost;
        this.y += this.vy * boost;
        const margin = this.baseR * 6 + 36;
        if (this.x < margin) { this.x = margin; this.vx = Math.abs(this.vx); }
        else if (this.x > canvas.width - margin) { this.x = canvas.width - margin; this.vx = -Math.abs(this.vx); }
        if (this.y < margin) { this.y = margin; this.vy = Math.abs(this.vy); }
        else if (this.y > canvas.height - margin) { this.y = canvas.height - margin; this.vy = -Math.abs(this.vy); }
    }
    draw(beat) {
        const b2 = beat * beat;
        const rBoost = 1 + beat * 3.5;
        const baseAlpha = isLight() ? this.baseAlpha * 2.2 : this.baseAlpha;
        const alpha = Math.min(baseAlpha * (1 + b2 * 2.5), 0.98);
        const r = this.baseR * rBoost;
        const colors = particleColors();
        const colorIdx = beat > 0.5 ? (this.colorIdx + 1) % colors.length : this.colorIdx;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = colors[colorIdx] + alpha + ')';
        if (beat > 0.4) {
            ctx.shadowColor = colors[colorIdx] + '0.9)';
            ctx.shadowBlur = b2 * 30;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
const PARTICLE_COUNT = 55;
const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
function drawConnections(beat) {
    const MAX_DIST = 115 + beat * 70;
    const light = isLight();
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.hypot(dx, dy);
            if (dist > MAX_DIST) continue;
            const baseOpacity = light ? 0.45 : 0.18;
            const opacity = (baseOpacity + beat * 0.4) * (1 - dist / MAX_DIST);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const color = beat > 0.25
                ? (light ? `rgba(100,40,210,${opacity})` : `rgba(139,92,246,${opacity})`)
                : (light ? `rgba(0,120,200,${opacity})` : `rgba(0,200,255,${opacity})`);
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.5 + beat * 1.2;
            ctx.stroke();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAY-BASED HERO BACKGROUND THEMES
// Cada día de la semana (getDay() 0=Dom…6=Sáb) activa un modo visual distinto.
// El usuario puede sobreescribir con el switcher — se persiste en localStorage.
// ═══════════════════════════════════════════════════════════════════════════════
const HERO_THEMES = [
    { id: 0, es: 'Constelaciones', en: 'Constellations',  val: 'Constel·lacions',  icon: 'fa-star'         },
    { id: 1, es: 'Matrix',         en: 'Matrix',           val: 'Matrix',            icon: 'fa-terminal'     },
    { id: 2, es: 'Geometría',      en: 'Geometry',         val: 'Geometria',         icon: 'fa-shapes'       },
    { id: 3, es: 'Aurora',         en: 'Aurora',           val: 'Aurora',            icon: 'fa-wind'         },
    { id: 4, es: 'Órbitas',        en: 'Orbits',           val: 'Òrbites',           icon: 'fa-circle-nodes' },
    { id: 5, es: 'Lluvia Neón',    en: 'Neon Rain',        val: 'Pluja Neó',         icon: 'fa-droplet'      },
    { id: 6, es: 'Fuegos',         en: 'Fireworks',        val: 'Focs artificials',  icon: 'fa-fire'         },
];
let _bgTheme = (() => {
    const s = localStorage.getItem('heroBgTheme');
    return s !== null ? parseInt(s) : new Date().getDay();
})();
function _heroAccent(w) {
    const s = w === 2 ? (window._accent2Rgb || '139 92 246') : (window._accent1Rgb || '0 200 255');
    return s.split(/\s+/).map(Number);
}
function setBgTheme(id) {
    _bgTheme = ((id % 7) + 7) % 7;
    localStorage.setItem('heroBgTheme', _bgTheme);
    _matBuiltW = 0; _geoBuiltW = 0; _neonBuiltW = 0;
    _fwBursts.length = 0; _fwLastT = 0; _fwPrevBeat = 0;
}

// ── Theme 0 – Constellation ───────────────────────────────────────────────────
function drawConstellation(beat) {
    particles.forEach(p => { p.update(beat); p.draw(beat); });
    drawConnections(beat);
}

// ── Theme 1 – Matrix Rain ─────────────────────────────────────────────────────
const _MAT_SRC = 'アイウエオカキクケコサシスセソタナニヌハヒフマミムヤラリルロン0123456789ABCDEF<>/\\|{}[]';
const _MAT_CW  = 16;
let _matCols = [], _matBuiltW = 0;
function _buildMatCols() {
    _matBuiltW = canvas.width;
    _matCols = Array.from({ length: Math.ceil(canvas.width / _MAT_CW) + 1 }, (_, i) => ({
        x:      i * _MAT_CW,
        y:      Math.random() * -canvas.height * 1.5,
        speed:  80 + Math.random() * 110,
        len:    12 + Math.floor(Math.random() * 18),
        glyphs: Array.from({ length: 32 }, () => _MAT_SRC[Math.floor(Math.random() * _MAT_SRC.length)]),
        tick:   0,
    }));
}
function drawMatrix(beat, dt) {
    if (canvas.width !== _matBuiltW) _buildMatCols();
    const [r, g, b] = _heroAccent(1);
    ctx.font      = `${_MAT_CW}px monospace`;
    ctx.textAlign = 'left';
    const spd = 1 + beat * 4;
    _matCols.forEach(col => {
        col.y += col.speed * spd * dt;
        if (++col.tick % 5 === 0) {
            col.glyphs[Math.floor(Math.random() * col.glyphs.length)] =
                _MAT_SRC[Math.floor(Math.random() * _MAT_SRC.length)];
        }
        if (col.y > canvas.height + col.len * _MAT_CW) {
            col.y     = -col.len * _MAT_CW - Math.random() * canvas.height * 0.5;
            col.speed = 80 + Math.random() * 110;
        }
        for (let i = 0; i < col.len; i++) {
            const cy = col.y - i * _MAT_CW;
            if (cy < -_MAT_CW || cy > canvas.height) continue;
            if (i === 0) {
                ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
                ctx.shadowBlur  = 8 + beat * 20;
                ctx.fillStyle   = `rgba(255,255,255,${0.88 + beat * 0.12})`;
            } else {
                const frac     = 1 - i / col.len;
                ctx.shadowBlur = 0;
                ctx.fillStyle  = `rgba(${r},${g},${b},${frac * (0.07 + beat * 0.12)})`;
            }
            ctx.fillText(col.glyphs[i % col.glyphs.length], col.x + 1, cy);
        }
    });
    ctx.shadowBlur = 0;
}

// ── Theme 2 – Floating Geometry ───────────────────────────────────────────────
let _geoShapes = [], _geoBuiltW = 0;
function _buildGeoShapes() {
    _geoBuiltW = canvas.width;
    _geoShapes = Array.from({ length: 28 }, () => ({
        x:      Math.random() * canvas.width,
        y:      Math.random() * canvas.height,
        vx:     (Math.random() - 0.5) * 0.38,
        vy:     (Math.random() - 0.5) * 0.38,
        sides:  [3, 4, 5, 6][Math.floor(Math.random() * 4)],
        size:   18 + Math.random() * 52,
        rot:    Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 0.009,
        ci:     Math.random() < 0.5 ? 1 : 2,
        alpha:  0.06 + Math.random() * 0.09,
    }));
}
function _drawPoly(x, y, sides, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const a = rot + (Math.PI * 2 / sides) * i;
        i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
          : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
}
function drawGeometry(beat, dt) {
    if (canvas.width !== _geoBuiltW) _buildGeoShapes();
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const bst = 1 + beat * 2.5;
    _geoShapes.forEach(s => {
        s.rot += s.rotSpd * (1 + beat * 3);
        s.x    = (s.x + s.vx * bst + canvas.width  * 2) % canvas.width;
        s.y    = (s.y + s.vy * bst + canvas.height * 2) % canvas.height;
        const [r, g, b] = s.ci === 1 ? a1 : a2;
        const al = s.alpha + beat * 0.13;
        const sz = s.size * (1 + beat * 0.35);
        _drawPoly(s.x, s.y, s.sides, sz, s.rot);
        ctx.strokeStyle = `rgba(${r},${g},${b},${al})`;
        ctx.lineWidth   = 1 + beat * 1.5;
        ctx.shadowColor = `rgba(${r},${g},${b},${al})`;
        ctx.shadowBlur  = beat > 0.18 ? 6 + beat * 18 : 0;
        ctx.stroke();
        ctx.fillStyle   = `rgba(${r},${g},${b},${al * 0.12})`;
        ctx.fill();
    });
    ctx.shadowBlur = 0;
}

// ── Theme 3 – Aurora Borealis ─────────────────────────────────────────────────
const _AUR_BANDS = Array.from({ length: 5 }, (_, i) => ({
    phase: Math.random() * Math.PI * 2,
    spd:   0.14 + Math.random() * 0.22,
    freq:  0.0025 + Math.random() * 0.003,
    amp:   45 + Math.random() * 65,
    thick: 55 + Math.random() * 80,
    fi:    i / 4,
}));
function drawAurora(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    _AUR_BANDS.forEach((band, i) => {
        band.phase += band.spd * dt;
        const yBase = H * (0.15 + i * 0.16);
        const amp   = band.amp * (1 + beat * 2.8);
        const r = a1[0] + (a2[0] - a1[0]) * band.fi | 0;
        const g = a1[1] + (a2[1] - a1[1]) * band.fi | 0;
        const b = a1[2] + (a2[2] - a1[2]) * band.fi | 0;
        const al = 0.045 + beat * 0.09 + Math.sin(t * 0.4 + i * 1.2) * 0.012;

        ctx.beginPath();
        ctx.moveTo(0, yBase + Math.sin(band.phase) * amp);
        for (let x = 2; x <= W; x += 4) {
            ctx.lineTo(x, yBase + Math.sin(x * band.freq + band.phase) * amp);
        }
        ctx.lineTo(W, yBase + band.thick + amp * 0.4);
        for (let x = W - 2; x >= 0; x -= 4) {
            ctx.lineTo(x, yBase + band.thick + Math.sin(x * band.freq * 1.4 + band.phase + 1.5) * amp * 0.55);
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, yBase - amp, 0, yBase + band.thick + amp);
        grad.addColorStop(0,    `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.25, `rgba(${r},${g},${b},${al})`);
        grad.addColorStop(0.65, `rgba(${r},${g},${b},${al * 0.75})`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fill();
    });
}

// ── Theme 4 – Orbital System ──────────────────────────────────────────────────
const _ORB_RINGS = [
    { rfrac: 0.09, n: 3,  spd: 0.85,  sz: 4.5, phase: 0   },
    { rfrac: 0.18, n: 6,  spd: 0.48,  sz: 3.5, phase: 1.1 },
    { rfrac: 0.29, n: 9,  spd: 0.27,  sz: 2.8, phase: 0.4 },
    { rfrac: 0.42, n: 14, spd: 0.155, sz: 2.2, phase: 2.0 },
];
function drawOrbital(beat, dt, t) {
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const base = Math.min(canvas.width, canvas.height) * 0.44;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);

    const cgr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20 + beat * 30);
    cgr.addColorStop(0, `rgba(${a1[0]},${a1[1]},${a1[2]},${0.5 + beat * 0.5})`);
    cgr.addColorStop(1, `rgba(${a1[0]},${a1[1]},${a1[2]},0)`);
    ctx.beginPath(); ctx.arc(cx, cy, 20 + beat * 30, 0, Math.PI * 2);
    ctx.fillStyle = cgr; ctx.fill();

    _ORB_RINGS.forEach((ring, ri) => {
        ring.phase += ring.spd * dt * (1 + beat * 2);
        const R  = ring.rfrac * base * (1 + beat * 0.1);
        const fi = ri / (_ORB_RINGS.length - 1);
        const r  = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g  = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b  = a1[2] + (a2[2] - a1[2]) * fi | 0;

        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.07 + beat * 0.09})`;
        ctx.lineWidth   = 0.6; ctx.stroke();

        for (let d = 0; d < ring.n; d++) {
            const angle = ring.phase + (Math.PI * 2 / ring.n) * d;
            const dx = cx + Math.cos(angle) * R;
            const dy = cy + Math.sin(angle) * R;
            ctx.beginPath(); ctx.arc(dx, dy, ring.sz * (1 + beat * 0.7), 0, Math.PI * 2);
            ctx.fillStyle   = `rgba(${r},${g},${b},${0.55 + beat * 0.45})`;
            ctx.shadowColor = `rgba(${r},${g},${b},0.85)`;
            ctx.shadowBlur  = 5 + beat * 18;
            ctx.fill();
        }
    });
    ctx.shadowBlur = 0;
}

// ── Theme 5 – Neon Rain ───────────────────────────────────────────────────────
const _NEON_PAL = [[0,200,255],[200,0,255],[0,255,130],[255,50,200],[255,180,0],[100,255,100]];
let _neonDrops = [], _neonBuiltW = 0;
function _mkNeonDrop() {
    const [r, g, b] = _NEON_PAL[Math.floor(Math.random() * _NEON_PAL.length)];
    return {
        x: Math.random() * canvas.width, y: Math.random() * -canvas.height,
        len: 60 + Math.random() * 110,   spd: 230 + Math.random() * 340,
        r, g, b,                          w: 1 + Math.random() * 1.5,
    };
}
function _buildNeonDrops() {
    _neonBuiltW = canvas.width;
    _neonDrops  = Array.from({ length: 65 }, _mkNeonDrop);
}
function drawNeonRain(beat, dt) {
    if (canvas.width !== _neonBuiltW) _buildNeonDrops();
    const sm = 1 + beat * 3.5;
    _neonDrops.forEach(d => {
        d.y += d.spd * sm * dt;
        if (d.y > canvas.height + d.len) { Object.assign(d, _mkNeonDrop()); d.y = -d.len - 10; }
        const gr = ctx.createLinearGradient(d.x, d.y - d.len, d.x, d.y);
        gr.addColorStop(0,   `rgba(${d.r},${d.g},${d.b},0)`);
        gr.addColorStop(0.6, `rgba(${d.r},${d.g},${d.b},${0.04 + beat * 0.07})`);
        gr.addColorStop(1,   `rgba(${d.r},${d.g},${d.b},${0.13 + beat * 0.16})`);
        ctx.beginPath(); ctx.moveTo(d.x, d.y - d.len); ctx.lineTo(d.x, d.y);
        ctx.strokeStyle = gr; ctx.lineWidth = d.w;
        ctx.shadowColor = `rgba(${d.r},${d.g},${d.b},0.7)`; ctx.shadowBlur = 5 + beat * 14;
        ctx.stroke();
        ctx.beginPath(); ctx.arc(d.x, d.y, d.w * 1.4 + beat * 2.5, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(255,255,255,${0.55 + beat * 0.45})`;
        ctx.shadowColor = `rgba(${d.r},${d.g},${d.b},1)`; ctx.shadowBlur = 10 + beat * 22;
        ctx.fill();
    });
    ctx.shadowBlur = 0;
}

// ── Theme 6 – Fireworks ───────────────────────────────────────────────────────
const _FW_PAL = [[255,60,100],[0,200,255],[255,200,0],[200,80,255],[0,255,150],[255,120,0]];
const _fwBursts = [];
let _fwPrevBeat = 0, _fwLastT = 0;
function _spawnBurst(beat) {
    if (_fwBursts.length >= 7) return;
    const [r, g, b] = _FW_PAL[Math.floor(Math.random() * _FW_PAL.length)];
    const x = canvas.width  * (0.15 + Math.random() * 0.7);
    const y = canvas.height * (0.08 + Math.random() * 0.65);
    const n = 45 + Math.floor(Math.random() * 25);
    _fwBursts.push({
        x, y, r, g, b,
        parts: Array.from({ length: n }, (_, i) => {
            const angle = (Math.PI * 2 / n) * i + (Math.random() - 0.5) * 0.4;
            const spd   = 60 + Math.random() * 180 + beat * 80;
            return { vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 1, trail: [] };
        }),
    });
}
function drawFireworks(beat, dt, t) {
    if (beat > 0.22 && _fwPrevBeat < beat && t - _fwLastT > 0.35) {
        _spawnBurst(beat); _fwLastT = t;
    }
    if (_fwBursts.length === 0 && t - _fwLastT > 3) {
        _spawnBurst(0.3); _fwLastT = t;
    }
    _fwPrevBeat = beat;
    const G = 55;
    for (let bi = _fwBursts.length - 1; bi >= 0; bi--) {
        const bst = _fwBursts[bi];
        let alive = false;
        bst.parts.forEach(p => {
            if (p.life <= 0) return;
            alive = true;
            p.life -= dt * (0.5 + Math.random() * 0.12);
            const prog = 1 - p.life;
            const px = bst.x + p.vx * prog;
            const py = bst.y + p.vy * prog + G * prog * prog;
            p.trail.push({ x: px, y: py });
            if (p.trail.length > 9) p.trail.shift();
            const al = Math.max(p.life, 0);
            if (p.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(p.trail[0].x, p.trail[0].y);
                for (let k = 1; k < p.trail.length; k++) ctx.lineTo(p.trail[k].x, p.trail[k].y);
                ctx.strokeStyle = `rgba(${bst.r},${bst.g},${bst.b},${al * 0.28})`;
                ctx.lineWidth = al * 1.8; ctx.shadowBlur = 0; ctx.stroke();
            }
            ctx.beginPath(); ctx.arc(px, py, al * 2.8, 0, Math.PI * 2);
            ctx.fillStyle   = `rgba(${bst.r},${bst.g},${bst.b},${al})`;
            ctx.shadowColor = `rgba(${bst.r},${bst.g},${bst.b},0.9)`;
            ctx.shadowBlur  = 5 + al * 16; ctx.fill();
        });
        if (!alive) _fwBursts.splice(bi, 1);
    }
    ctx.shadowBlur = 0;
}

function heroThemeDraw(beat, dt, t) {
    switch (_bgTheme) {
        case 1: drawMatrix(beat, dt);       break;
        case 2: drawGeometry(beat, dt);     break;
        case 3: drawAurora(beat, dt, t);    break;
        case 4: drawOrbital(beat, dt, t);   break;
        case 5: drawNeonRain(beat, dt);     break;
        case 6: drawFireworks(beat, dt, t); break;
        default: drawConstellation(beat);   break;
    }
}

const ROOT = document.documentElement;
let _visualBeat = 0;
function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
function updateAccentColors(v) {
    // Reposo: cyan(195)/púrpura(262). En el golpe barren con fuerza hacia violeta/magenta.
    const h1 = 195 + v * 95;  // cyan → violeta intenso (290)
    const h2 = 262 + v * 48;  // púrpura → magenta (310)
    const l1 = 50 + v * 12;   // luminosidad casi constante (cambio de color, no de brillo)
    const l2 = 60 + v * 8;
    const [r1, g1, b1] = hslToRgb(h1, 100, l1);
    const [r2, g2, b2r] = hslToRgb(h2, 90, l2);
    // Escribir una custom property en :root INVALIDA el estilo de TODO el documento
    // (también las partes ocultas). Hacerlo cada frame durante el arcade provoca un
    // recalc periódico que se nota como lag aunque el juego dibuje poquísimo. El pulso
    // del beat dentro de los juegos NO viene del CSS sino de la variable JS _visualBeat
    // (la lee games.js directamente), así que aquí basta refrescar el color de acento
    // a ~12 Hz: el viraje de tono es lento y el ahorro de recalc es enorme.
    if (ROOT.classList.contains('arcade-lock')) {
        // CERO escrituras al DOM durante el juego: cada setProperty en :root fuerza un
        // recalc de estilo de TODO el documento, y ese hitch se ve justo en lo único que
        // se mueve (las notas). El canvas del arcade lee el color de estas globales JS.
        window._accent1Rgb = `${r1} ${g1} ${b1}`;
        window._accent2Rgb = `${r2} ${g2} ${b2r}`;
        return;
    }
    window._accent1Rgb = `${r1} ${g1} ${b1}`;
    window._accent2Rgb = `${r2} ${g2} ${b2r}`;
    ROOT.style.setProperty('--accent-1-rgb', `${r1} ${g1} ${b1}`);
    ROOT.style.setProperty('--accent-2-rgb', `${r2} ${g2} ${b2r}`);
    ROOT.style.setProperty('--beat-alpha', v.toFixed(3));
    ROOT.style.setProperty('--accent-1', `hsl(${h1}, 100%, ${l1}%)`);
    ROOT.style.setProperty('--accent-2', `hsl(${h2}, 90%, ${l2}%)`);
    ROOT.style.setProperty('--gradient', `linear-gradient(135deg, hsl(${h1}, 100%, ${l1}%) 0%, hsl(${h2}, 90%, ${l2}%) 100%)`);
    ROOT.style.setProperty('--beat-glow',      v > 0.01 ? `0 0 ${v * 90}px rgb(${r1} ${g1} ${b1} / ${v * 0.95})` : 'none');
    ROOT.style.setProperty('--beat-glow-soft', v > 0.01 ? `0 0 ${v * 60}px rgb(${r2} ${g2} ${b2r} / ${v * 0.75})` : 'none');
}
// Las partículas solo se animan cuando se ven: ni con el hero fuera de
// pantalla ni con el arcade abierto (drawConnections es O(n²) por frame).
// El beat y los colores de acento se actualizan siempre: son baratos y los
// usa toda la web (NPB, arcade, brillos).
let _heroVisible = true;
try {
    new IntersectionObserver((entries) => { _heroVisible = entries[0].isIntersecting; }).observe(canvas);
} catch (e) { /* navegador sin IntersectionObserver: se anima siempre */ }
let _lastFrameTs = 0;
function animateParticles(ts = 0) {
    requestAnimationFrame(animateParticles);
    const dt = _lastFrameTs ? Math.min((ts - _lastFrameTs) / 1000, 0.05) : 0.016;
    _lastFrameTs = ts;
    const beat = getBassEnergy();
    _visualBeat = beat > _visualBeat ? beat : _visualBeat + (beat - _visualBeat) * 0.6;
    if (_visualBeat < 0.005) _visualBeat = 0;
    updateAccentColors(_visualBeat);
    if (!_heroVisible || document.documentElement.classList.contains('arcade-lock')) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    heroThemeDraw(_visualBeat, dt, ts / 1000);
}
animateParticles();

function initBgSwitcher() {
    const toggle = document.getElementById('bgSwitcherToggle');
    const panel  = document.getElementById('bgSwitcherPanel');
    const label  = document.getElementById('bgSwitcherLabel');
    if (!toggle || !panel || !label) return;

    const todayAuto = new Date().getDay();

    function updateLabel() {
        const theme = HERO_THEMES[_bgTheme] || HERO_THEMES[0];
        const lang  = typeof currentLanguage !== 'undefined' ? currentLanguage : 'es';
        label.textContent = theme[lang] || theme.es;
    }
    window._bgUpdateLabel = updateLabel;

    HERO_THEMES.forEach(theme => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bg-sw-day-btn' + (_bgTheme === theme.id ? ' active' : '');
        btn.dataset.bgId = theme.id;
        const todayDot = theme.id === todayAuto ? '<span class="bg-sw-today-dot" title="Hoy"></span>' : '';
        btn.innerHTML = `<i class="fa-solid ${theme.icon}"></i><span>${theme.es}</span>${todayDot}`;
        btn.addEventListener('click', () => {
            setBgTheme(theme.id);
            panel.querySelectorAll('.bg-sw-day-btn').forEach(b => {
                b.classList.toggle('active', parseInt(b.dataset.bgId) === _bgTheme);
            });
            updateLabel();
        });
        panel.appendChild(btn);
    });

    const arrow = toggle.querySelector('.bg-sw-arrow');
    toggle.addEventListener('click', e => {
        e.stopPropagation();
        const open = panel.classList.toggle('open');
        if (arrow) arrow.style.transform = open ? 'rotate(180deg)' : '';
    });
    document.addEventListener('click', () => {
        panel.classList.remove('open');
        if (arrow) arrow.style.transform = '';
    });
    panel.addEventListener('click', e => e.stopPropagation());

    updateLabel();
}
initBgSwitcher();

const sections = document.querySelectorAll('section[id], footer[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const hashAnchors = document.querySelectorAll('a[href^="#"]');
function setActiveNav(targetId) {
    navAnchors.forEach((anchor) => {
        anchor.classList.toggle('active', anchor.getAttribute('href') === `#${targetId}`);
    });
}
function getNavOffset() {
    return (navbar?.offsetHeight || 0) + 16;
}
function getSectionContent(section) {
    return section.querySelector('.about-grid, .music-grid, .legacy-shell, .projects-grid, .contact-grid, .container') || section;
}
function getSectionScrollTop(section) {
    if (!section || section.id === 'hero') {
        return 0;
    }
    const content = getSectionContent(section);
    const navOffset = getNavOffset();
    const viewportHeight = window.innerHeight - navOffset - 24;
    const contentHeight = content.offsetHeight;
    let targetTop = content.offsetTop - navOffset;
    if (contentHeight < viewportHeight) {
        const spareSpace = viewportHeight - contentHeight;
        targetTop -= Math.min(56, spareSpace * 0.18);
    }
    return Math.max(0, targetTop);
}
function scrollToSectionElement(section) {
    if (!section) return;
    const top = getSectionScrollTop(section);
    if (!document.startViewTransition) {
        window.scrollTo({ top, behavior: 'smooth' });
        return;
    }
    const goingDown = top > window.scrollY;
    document.documentElement.dataset.vtDir = goingDown ? 'down' : 'up';
    const t = document.startViewTransition(() => {
        window.scrollTo({ top, behavior: 'instant' });
    });
    t.finished.finally(() => delete document.documentElement.dataset.vtDir);
}
hashAnchors.forEach((anchor) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;
    anchor.addEventListener('click', (event) => {
        const target = document.querySelector(targetId);
        if (!target) return;
        event.preventDefault();
        scrollToSectionElement(target);
        history.replaceState(null, '', targetId);
    });
});
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        setActiveNav(id === 'footer' ? 'contacto' : id);
    });
}, { threshold: 0.45 });
sections.forEach((section) => sectionObserver.observe(section));
const orderedSections = Array.from(document.querySelectorAll('section[id]'));
const sectionPrev = document.getElementById('sectionPrev');
const sectionNext = document.getElementById('sectionNext');
function getCurrentSectionIndex() {
    const pivot = window.scrollY + (window.innerHeight * 0.35);
    let currentIndex = 0;
    orderedSections.forEach((section, index) => {
        if (pivot >= section.offsetTop) {
            currentIndex = index;
        }
    });
    return currentIndex;
}
function scrollToSection(index) {
    scrollToSectionElement(orderedSections[index]);
}
function updateSectionNav() {
    if (!sectionPrev || !sectionNext || orderedSections.length === 0) return;
    const currentIndex = getCurrentSectionIndex();
    sectionPrev.disabled = currentIndex === 0;
    sectionNext.disabled = currentIndex === orderedSections.length - 1;
}
if (sectionPrev && sectionNext) {
    sectionPrev.addEventListener('click', () => {
        const currentIndex = getCurrentSectionIndex();
        scrollToSection(Math.max(0, currentIndex - 1));
    });
    sectionNext.addEventListener('click', () => {
        const currentIndex = getCurrentSectionIndex();
        scrollToSection(Math.min(orderedSections.length - 1, currentIndex + 1));
    });
    updateSectionNav();
    window.addEventListener('scroll', updateSectionNav, { passive: true });
    window.addEventListener('resize', updateSectionNav, { passive: true });
}
const TRACKS = [
    { title: 'Borrowed Colors', file: 'Borrowed Colors.mp3' },
    { title: 'Eastern Gate', file: 'Eastern Gate.mp3' },
    { title: 'Honeyed Sidechain', file: 'Honeyed Sidechain.mp3' },
    { title: 'Nudos de Aire', file: 'Nudos de Aire.mp3' },
    { title: 'Silkquake', file: 'Silkquake.mp3' },
    { title: 'Gorra y Diez', file: 'Gorra y Diez.mp3' },
    { title: 'Wristlines', file: 'Wristlines.mp3' },
    { title: 'Violet Submerge', file: 'Violet Submerge.mp3' },
    { title: 'Stay With Me Tonight', file: 'Stay With Me Tonight.mp3' },
    { title: 'Seismic Bloom', file: 'Seismic Bloom.mp3' },
    { title: 'Undercurrent', file: 'Undercurrent.mp3' },
    { title: 'Glass Mode', file: 'Glass Mode.mp3' },
    { title: 'Black Gear Protocol', file: 'Black Gear Protocol.mp3' },
    { title: 'Sleep Parallel', file: 'Sleep Parallel.mp3' },
    { title: 'Ripple Phase', file: 'Ripple Phase.mp3' },
    { title: 'Mind', file: 'Mind.mp3' },
    { title: 'Tides We Keep', file: 'Tides We Keep.mp3' },
    { title: 'Breathscape', file: 'Breathscape.mp3' },
    { title: 'Skylark', file: 'Skylark.mp3' },
    { title: 'Calculated Smile', file: 'Calculated Smile.mp3' },
    { title: 'Risa en la pared', file: 'Risa en la pared.mp3' },
    { title: 'Acid Teeth', file: 'Acid Teeth.mp3' },
    { title: '光バーン', file: '光バーン.mp3' },
    { title: 'Steel Nerves', file: 'Steel Nerves.mp3' },
    { title: 'Same Side', file: 'Same Side.mp3' },
    { title: 'Silver Haze', file: 'Silver Haze.mp3' },
    { title: 'Nightcode', file: 'Nightcode.mp3' },
    { title: 'Into the Zone', file: 'Into the Zone.mp3' },
    { title: 'Aurora Pulse', file: 'Aurora Pulse.mp3' },
    { title: 'After the Frame', file: 'After the Frame.mp3' },
    { title: 'Obey the Frecuency', file: 'Obey the Frecuency.mp3' },
    { title: 'Liminal', file: 'Liminal.mp3' },
    { title: 'Stay a While', file: 'Stay a While.mp3' },
    { title: 'ゲートを破れ', file: 'ゲートを破れ.mp3' },
    { title: 'Boss Mode', file: 'Boss Mode.mp3' },
    { title: 'Ten Feet Tall', file: 'Ten Feet Tall.mp3' },
    { title: 'Between Staying and Goodbye (Hardstyle Remix)', file: 'Between Staying and Goodbye (Hardstyle Remix).mp3' },
    { title: 'Between Staying and Goodbye', file: 'Between Staying and Goodbye.mp3' },
    { title: 'Mango Skies', file: 'Mango Skies.mp3' },
    { title: 'Spectral Bearings', file: 'Spectral Bearings.mp3' },
    { title: 'No Signal', file: 'No Signal.mp3' },
    { title: 'Wired Reign', file: 'Wired Reign.mp3' },
    { title: 'Ascent Code', file: 'Ascent Code.mp3' },
    { title: 'Pressure Code', file: 'Pressure Code.mp3' },
    { title: 'Partitura de Silencios', file: 'Partitura de Silencios.mp3' },
    { title: 'Concrete Heartbeat', file: 'Concrete Heartbeat.mp3' },
    { title: 'Cotton Tides', file: 'Cotton Tides.mp3' },
    { title: 'We Accelerate', file: 'We Accelerate.mp3' },
    { title: 'せいさいループ', file: 'せいさいループ.mp3' },
    { title: 'Black Velocity', file: 'Black Velocity.mp3' },
    { title: 'Ivory Echo', file: 'Ivory Echo.mp3' },
    { title: 'Camí Tranquil', file: 'Camí Tranquil.mp3' },
    { title: 'ふたりのそら', file: 'ふたりのそら.mp3' },
    { title: 'Celestial Pulse', file: 'Celestial Pulse.mp3' },
    { title: 'Sususrros de Tarde', file: 'Sususrros de Tarde.mp3' },
    { title: 'Cosmic Threshold', file: 'Cosmic Threshold.mp3' },
    { title: 'System Frenzy', file: 'System Frenzy.mp3' },
    { title: 'Prismatic Veil', file: 'Prismatic Veil.mp3' },
    { title: 'Fragments of Flight', file: 'Fragments of Flight.mp3' },
    { title: 'Iron Mirage', file: 'Iron Mirage.mp3' },
    { title: 'Rumbo en la Bruma', file: 'Rumbo en la Bruma.mp3' },
    { title: 'Hushed Reverie', file: 'Hushed Reverie.mp3' },
    { title: 'Higher', file: 'Higher.mp3' },
    { title: 'Bring You Close', file: 'Bring You Close.mp3' },
    { title: 'Bonequake', file: 'Bonequake.mp3' },
    { title: 'Jasmin Oh Jasmin', file: 'Jasmin Oh Jasmin.mp3' },
    { title: 'Azure Drift', file: 'Azure Drift.mp3' },
    { title: 'Faintband', file: 'Faintband.mp3' },
    { title: 'Dreamline', file: 'Dreamline.mp3' },
    { title: '黒い信号', file: '黒い信号.mp3' },
    { title: 'Whispertrace', file: 'Whispertrace.mp3' },
    { title: 'Wishwoven', file: 'Wishwoven.mp3' },
    { title: 'Bailando en el Sur', file: 'Bailando en el Sur.mp3' },
    { title: 'Dream On', file: 'Dream On.mp3' },
    { title: 'Mistbound', file: 'Mistbound.mp3' },
    { title: 'Bowbreaker', file: 'Bowbreaker.mp3' },
    { title: 'Todavía Aquí', file: 'Todavía Aquí.mp3' },
    { title: 'Amor Sin Calor', file: 'Amor Sin Calor.mp3' },
    { title: 'Hands Up High', file: 'Hands Up High.mp3' },
    { title: 'Billie Eilish & Khalid - lovely (Deep House Remix)', file: 'Billie Eilish & Khalid - lovely (Deep House Remix).mp3' },
    { title: 'Jaymes Young - What Is Love (Hardstyle Remix)', file: 'Jaymes Young - What Is Love (Hardstyle Remix).mp3' },
    { title: 'Nobody New (Deep House Remix)', file: 'Nobody New (Deep House Remix).mp3' },
    { title: 'Noosa - Walk On By (Deep House Remix)', file: 'Noosa - Walk On By (Deep House Remix).mp3' },
    { title: "World's End, Girl's Rondo (Remix)", file: "World's End, Girl's Rondo (Remix).mp3" },
];
(function initPlayer() {
    const audio      = document.getElementById('audioEl');
    const trackList  = document.getElementById('trackList');
    const playBtn    = document.getElementById('playBtn');
    const playIcon   = document.getElementById('playIcon');
    const prevBtn    = document.getElementById('prevBtn');
    const nextBtn    = document.getElementById('nextBtn');
    const seekBar    = document.getElementById('seekBar');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl   = document.getElementById('totalTime');
    const volBar     = document.getElementById('volBar');
    const muteBtn    = document.getElementById('muteBtn');
    const titleEl    = document.getElementById('playerTrackTitle');
    if (!audio || !trackList) return;
    let currentIdx = 0;
    audio.volume = 0.8;
    volBar.style.setProperty('--vol', volBar.value + '%');
    function volIconCls(v) {
        return v < 0.01 ? 'fa-solid fa-volume-xmark' : v < 0.5 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
    }
    function fmt(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }
    let trackFilter = '';
    function renderTracks() {
        trackList.innerHTML = '';
        const q = trackFilter.toLowerCase();
        const visible = TRACKS.map((t, i) => ({ t, i })).filter(({ t }) => t.title.toLowerCase().includes(q));
        if (visible.length === 0) {
            trackList.innerHTML = `<div class="tracklist-no-results">${getTranslation('player.noResults')}</div>`;
            return;
        }
        visible.forEach(({ t, i }) => {
            const div = document.createElement('div');
            div.className = 'track-item' + (i === currentIdx ? ' active' : '');
            div.dataset.idx = i;
            const titleHtml = q
                ? t.title.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>')
                : t.title;
            div.innerHTML = `
                <span class="track-num">${i + 1}</span>
                <i class="fa-solid fa-music track-playing-icon"></i>
                <div class="track-info">
                    <span class="track-title">${titleHtml}</span>
                </div>`;
            div.addEventListener('click', () => loadTrack(i, true));
            trackList.appendChild(div);
        });
    }
    function loadTrack(idx, autoplay = false) {
        currentIdx = idx;
        window._currentIdx = idx;
        document.dispatchEvent(new Event('trackchanged'));
        const t = TRACKS[idx];
        audio.src = `assets/music/${t.file}`;
        titleEl.textContent = t.title;
        seekBar.value = 0;
        seekBar.style.setProperty('--seek', '0%');
        currentTimeEl.textContent = '0:00';
        totalTimeEl.textContent = '0:00';
        renderTracks();
        if (autoplay) {
            audio.play().then(() => {
                playIcon.className = 'fa-solid fa-pause';
            }).catch(() => {});
        } else {
            playIcon.className = 'fa-solid fa-play';
        }
    }
    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            if (!audio.src || audio.src === window.location.href) loadTrack(currentIdx, true);
            else audio.play().then(() => { playIcon.className = 'fa-solid fa-pause'; }).catch(() => {});
        } else {
            audio.pause();
            playIcon.className = 'fa-solid fa-play';
        }
    });
    prevBtn.addEventListener('click', () => {
        loadTrack((currentIdx - 1 + TRACKS.length) % TRACKS.length, !audio.paused);
    });
    nextBtn.addEventListener('click', () => {
        loadTrack((currentIdx + 1) % TRACKS.length, !audio.paused);
    });
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            const idx = Math.floor(Math.random() * TRACKS.length);
            loadTrack(idx, true);
            scrollToSectionElement(document.getElementById('musicPlayer'));
        });
    }
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        seekBar.value = (audio.currentTime / audio.duration) * 100;
        seekBar.style.setProperty('--seek', seekBar.value + '%');
        currentTimeEl.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = fmt(audio.duration);
    });
    audio.addEventListener('ended', () => {
        loadTrack((currentIdx + 1) % TRACKS.length, true);
    });
    seekBar.addEventListener('input', () => {
        seekBar.style.setProperty('--seek', seekBar.value + '%');
        if (audio.duration) audio.currentTime = (seekBar.value / 100) * audio.duration;
    });
    volBar.addEventListener('input', () => {
        audio.volume = volBar.value / 100;
        audio.muted = false;
        volBar.style.setProperty('--vol', volBar.value + '%');
        muteBtn.querySelector('i').className = volIconCls(audio.volume);
        const npbVol = document.getElementById('npbVol');
        if (npbVol) { npbVol.value = volBar.value; npbVol.style.setProperty('--vol', volBar.value + '%'); }
        const npbVolIcon = document.getElementById('npbVolIcon');
        if (npbVolIcon) npbVolIcon.className = volIconCls(audio.volume) + ' npb-vol-icon';
    });
    muteBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        volBar.style.setProperty('--vol', audio.muted ? '0%' : volBar.value + '%');
        muteBtn.querySelector('i').className = audio.muted ? 'fa-solid fa-volume-xmark' : volIconCls(audio.volume);
    });
    const searchInput = document.getElementById('trackSearch');
    const searchClear = document.getElementById('trackSearchClear');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            trackFilter = searchInput.value;
            searchClear.hidden = !trackFilter;
            renderTracks();
        });
        searchClear.addEventListener('click', () => {
            trackFilter = '';
            searchInput.value = '';
            searchClear.hidden = true;
            searchInput.focus();
            renderTracks();
        });
    }
    const shareBtn = document.getElementById('shareBtn');
    const shareToast = document.getElementById('shareToast');
    let shareToastTimer;
    function showShareToast(msg) {
        clearTimeout(shareToastTimer);
        shareToast.textContent = msg;
        shareToast.classList.add('show');
        shareToastTimer = setTimeout(() => shareToast.classList.remove('show'), 2200);
    }
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const t = TRACKS[currentIdx];
            const url = `${location.origin}${location.pathname}?track=${encodeURIComponent(t.title)}`;
            navigator.clipboard.writeText(url).then(() => {
                shareBtn.classList.add('copied');
                showShareToast(getTranslation('player.linkCopied'));
                setTimeout(() => shareBtn.classList.remove('copied'), 1800);
            }).catch(() => showShareToast(getTranslation('player.linkError')));
        });
    }
    const paramTrack = new URLSearchParams(location.search).get('track');
    const startIdx = paramTrack
        ? TRACKS.findIndex(t => t.title.toLowerCase() === paramTrack.toLowerCase())
        : -1;
    window._playerLoadTrack = loadTrack;
    renderTracks();
    loadTrack(startIdx >= 0 ? startIdx : 0, false);
    if (startIdx >= 0) {
        setTimeout(() => {
            const el = trackList.querySelector('.track-item.active');
            if (el) el.scrollIntoView({ block: 'nearest' });
        }, 200);
    }
    const sharedTrackArrival = startIdx >= 0;
    (function initVisualizer() {
        const canvas = document.getElementById('visualizerCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let audioCtx, analyser, source, animId;
        let connected = false;
        function ensureAudioCtx() {
            if (connected) return;
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;                 // 256 bins: resolución para detectar cambios de tono
            analyser.smoothingTimeConstant = 0.3;   // poco suavizado interno = el golpe llega sin retraso
            source = audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            connected = true;
            window._audioAnalyser = analyser;
        }
        function draw() {
            animId = requestAnimationFrame(draw);
            // Con el arcade abierto este canvas no se ve: no gastar CPU en él
            if (document.documentElement.classList.contains('arcade-lock')) return;
            const cw = canvas.parentElement.clientWidth;
            if (cw > 0 && canvas.width !== cw) canvas.width = cw;
            const W = canvas.width, H = canvas.height;
            const bufLen = analyser.frequencyBinCount;
            const data = new Uint8Array(bufLen);
            analyser.getByteFrequencyData(data);
            ctx.clearRect(0, 0, W, H);
            const pad = 8;
            const usedBins = Math.floor(bufLen * 0.75);
            const drawW = W - pad * 2;
            const step = drawW / usedBins;
            const barW = step * 0.75;
            // Colores de la paleta global reactiva (viran de tono con el beat)
            const rootStyle = document.documentElement.style;
            const a2 = (rootStyle.getPropertyValue('--accent-2-rgb') || '139 92 246').trim().replace(/\s+/g, ',');
            const a1 = (rootStyle.getPropertyValue('--accent-1-rgb') || '0 200 255').trim().replace(/\s+/g, ',');
            for (let i = 0; i < usedBins; i++) {
                const pct = data[i] / 255;
                const barH = Math.max(pct * H, 3);
                const x = pad + i * step + (step - barW) / 2;
                const grad = ctx.createLinearGradient(0, H - barH, 0, H);
                grad.addColorStop(0, `rgba(${a2},${0.9 * pct + 0.1})`);
                grad.addColorStop(1, `rgba(${a1},${0.7 * pct + 0.1})`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(x, H - barH, barW, barH, 2) : ctx.rect(x, H - barH, barW, barH);
                ctx.fill();
            }
        }
        function startViz() {
            ensureAudioCtx();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (!animId) draw();
        }
        function stopViz() {
            if (animId) { cancelAnimationFrame(animId); animId = null; }
        }
        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            const w = rect.width  || canvas.parentElement.offsetWidth;
            const h = rect.height || 64;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width  = w;
                canvas.height = h;
            }
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        new ResizeObserver(resizeCanvas).observe(canvas);
        audio.addEventListener('play',  startViz);
        audio.addEventListener('pause', stopViz);
        audio.addEventListener('ended', stopViz);
    })();
    (function initNowPlayingBar() {
        const bar      = document.getElementById('nowPlayingBar');
        const npbTitle = document.getElementById('npbTitle');
        const npbPlay  = document.getElementById('npbPlay');
        const npbPlayI = document.getElementById('npbPlayIcon');
        const npbPrev    = document.getElementById('npbPrev');
        const npbNext    = document.getElementById('npbNext');
        const npbSeek    = document.getElementById('npbSeek');
        const npbVol     = document.getElementById('npbVol');
        const npbVolIcon = document.getElementById('npbVolIcon');
        const npbClose   = document.getElementById('npbClose');
        npbVol.value = Math.round(audio.volume * 100);
        npbVol.style.setProperty('--vol', npbVol.value + '%');
        function updateVolIcon() {
            const v = audio.muted ? 0 : audio.volume;
            npbVol.style.setProperty('--vol', (audio.muted ? 0 : npbVol.value) + '%');
            npbVolIcon.className = volIconCls(v) + ' npb-vol-icon';
        }
        npbVol.style.setProperty('--vol', npbVol.value + '%');
        const sectionNavEl = document.querySelector('.section-nav');
        if (!bar) return;
        function syncTitle() {
            npbTitle.textContent = TRACKS[currentIdx] ? TRACKS[currentIdx].title : '—';
        }
        function syncPlayState() {
            npbPlayI.className = audio.paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
            bar.classList.toggle('playing', !audio.paused);
        }
        audio.addEventListener('play', () => {
            bar.classList.add('visible');
            document.body.classList.add('npb-visible');
            sectionNavEl?.classList.add('player-active');
            syncPlayState();
            syncTitle();
        });
        audio.addEventListener('pause', syncPlayState);
        audio.addEventListener('ended', syncPlayState);
        audio.addEventListener('timeupdate', () => {
            if (!audio.duration) return;
            npbSeek.value = (audio.currentTime / audio.duration) * 100;
            npbSeek.style.setProperty('--seek', npbSeek.value + '%');
        });
        npbSeek.addEventListener('input', () => {
            npbSeek.style.setProperty('--seek', npbSeek.value + '%');
            if (audio.duration) audio.currentTime = (npbSeek.value / 100) * audio.duration;
        });
        npbVol.addEventListener('input', () => {
            audio.volume = npbVol.value / 100;
            audio.muted = false;
            updateVolIcon();
            const vb = document.getElementById('volBar');
            if (vb) { vb.value = npbVol.value; vb.style.setProperty('--vol', npbVol.value + '%'); }
            const mb = document.getElementById('muteBtn');
            if (mb) {
                const v = audio.volume;
                mb.querySelector('i').className = v < 0.1 ? 'fa-solid fa-volume-xmark'
                    : v < 0.5 ? 'fa-solid fa-volume-low'
                    : 'fa-solid fa-volume-high';
            }
        });
        npbVolIcon.addEventListener('click', () => {
            audio.muted = !audio.muted;
            if (!audio.muted) npbVol.value = Math.round(audio.volume * 100);
            updateVolIcon();
        });
        npbPlay.addEventListener('click', () => {
            if (audio.paused) audio.play().catch(() => {});
            else audio.pause();
        });
        npbPrev.addEventListener('click', () => {
            loadTrack((currentIdx - 1 + TRACKS.length) % TRACKS.length, !audio.paused);
            syncTitle();
        });
        npbNext.addEventListener('click', () => {
            loadTrack((currentIdx + 1) % TRACKS.length, !audio.paused);
            syncTitle();
        });
        npbClose.addEventListener('click', () => {
            audio.pause();
            bar.classList.remove('visible', 'playing');
            document.body.classList.remove('npb-visible');
            sectionNavEl?.classList.remove('player-active');
        });
        const npbShuffle = document.getElementById('npbShuffle');
        if (npbShuffle) {
            npbShuffle.addEventListener('click', () => {
                const idx = Math.floor(Math.random() * TRACKS.length);
                loadTrack(idx, true);
                syncTitle();
            });
        }
        syncTitle();
        syncPlayState();
        if (sharedTrackArrival) {
            setTimeout(() => {
                bar.classList.add('visible');
                document.body.classList.add('npb-visible');
                sectionNavEl?.classList.add('player-active');
                syncTitle();
                const playerSection = document.getElementById('musicPlayer');
                if (playerSection) {
                    const rect = playerSection.getBoundingClientRect();
                    const targetY = window.scrollY + rect.top - (window.innerHeight - rect.height) / 2;
                    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
                }
            }, 600);
        }
    })();
})();
(function initCounters() {
    const items = document.querySelectorAll('.music-stat-num[data-target]');
    if (!items.length) return;
    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target) || el.dataset.animated) return;
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
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) animateCounter(e.target); });
    }, { threshold: 0.4 });
    items.forEach(el => observer.observe(el));
})();
(function initShuffleFab() {
    const fab = document.getElementById('shuffleFab');
    if (!fab) return;
    window.addEventListener('scroll', () => {
        fab.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
    fab.addEventListener('click', () => {
        if (typeof TRACKS === 'undefined' || !window._playerLoadTrack) return;
        const idx = Math.floor(Math.random() * TRACKS.length);
        window._playerLoadTrack(idx, true);
        scrollToSectionElement(document.getElementById('musicPlayer'));
        fab.style.transform = 'scale(0.9) rotate(360deg)';
        setTimeout(() => { fab.style.transform = ''; }, 400);
    });
})();
(function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = max > 0 ? (window.scrollY / max * 100) + '%' : '0%';
    }, { passive: true });
})();
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
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                        if (typeof window._playerLoadTrack === 'function') {
                            window._playerLoadTrack(i, true);
                            document.getElementById('musica')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
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
        syncVolumeUI();
    }
    function toggleMute() {
        audio.muted = !audio.muted;
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
(function initAIChat() {
    // ▼▼ CONFIGURA AQUÍ la URL de tu función en Vercel (déjala así si sirves la web desde Vercel).
    const AI_ENDPOINT = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? '/api/chat'
        : 'https://danielux135-github-io.vercel.app/api/chat';
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