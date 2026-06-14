'use strict';
// aplica el tema guardado antes de que el navegador pinte, evitando el flash de contenido
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
// variante de saludo fija durante la sesión
const _greetIdx = Math.floor(Math.random() * 3);
// devuelve el saludo según la hora del día e idioma activo
function getGreeting(lang) {
    const h = new Date().getHours();
    const G = {
        es: [
            // patrón: [hora inicio, hora fin, [variante0, variante1, variante2]]
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

// tabla de traducciones por idioma (es, en, val)
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
            spotifyAlbum: 'Escuchar en Spotify',
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
                youtube: 'YouTube',
                discord: 'Discord'
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
            spotifyAlbum: 'Listen on Spotify',
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
                youtube: 'YouTube',
                discord: 'Discord'
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
            spotifyAlbum: 'Escoltar a Spotify',
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
                youtube: 'YouTube',
                discord: 'Discord'
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
// idioma activo, persistido en localStorage
let currentLanguage = localStorage.getItem('portfolioLanguage') || 'es';
// roles del typewriter para el idioma actual
let currentRoles = translations[currentLanguage].hero.roles;
let typeTimeoutId;
const navbar = document.getElementById('navbar');
const metaDescription = document.querySelector('meta[name="description"]');
const languageButtons = document.querySelectorAll('#langSwitcher .lang-btn');
const langSwitcher   = document.getElementById('langSwitcher');
const langPillLabel  = document.getElementById('langPillLabel');
// abre el selector de idioma al hacer clic en la pastilla
langSwitcher.addEventListener('click', () => {
    if (!langSwitcher.classList.contains('open')) langSwitcher.classList.add('open');
});
// cierra el selector al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!langSwitcher.contains(e.target)) langSwitcher.classList.remove('open');
});
// añade la clase scrolled al navbar cuando el usuario baja de 40px
window.addEventListener('scroll', () => {
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
navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
});
// cierra el menú móvil al pulsar cualquier enlace de navegación
navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', false);
    });
});
// resuelve una clave anidada de traducciones para el idioma dado
function getTranslation(key, language = currentLanguage) {
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
    if (langPillLabel) langPillLabel.textContent = language.toUpperCase();
    langSwitcher.classList.remove('open');
    localStorage.setItem('portfolioLanguage', language);
    if (window._bgUpdateLabel) window._bgUpdateLabel();
    resetTypewriter();
}
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
// canvas de partículas del fondo del hero
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
// ajusta el canvas al tamaño de la ventana
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });
// paletas de color de partículas para tema oscuro y claro
const COLORS_DARK  = ['rgba(0,200,255,',  'rgba(139,92,246,',  'rgba(255,255,255,'];
const COLORS_LIGHT = ['rgba(0,120,200,',  'rgba(100,40,210,',  'rgba(30,50,120,'];
function isLight() { return document.documentElement.getAttribute('data-theme') === 'light'; }
// devuelve la paleta activa según el tema
function particleColors() { return isLight() ? COLORS_LIGHT : COLORS_DARK; }
// seguimiento de energía del sub-bass (bins 1-3, ~86-344 hz) para el pulso visual
// usa envelope en vez de threshold: más cobertura, sin ruido en silencio
let _bassEnv = 0;
let _bassBuf = null; // buffer reusado: evita crear un uint8array nuevo cada frame (presión de gc)
// calcula la energía del sub-bass con envelope de ataque instantáneo y release suave
function getBassEnergy() {
    const analyser = window._audioAnalyser;
    if (!analyser) {
        _bassEnv *= 0.90;
        if (_bassEnv < 0.004) _bassEnv = 0;
        return _bassEnv;
    }
    // peak + rms combinados: el peak captura transientes cortos que el rms diluye
    const n = analyser.fftSize;
    if (!_bassBuf || _bassBuf.length !== n) _bassBuf = new Uint8Array(n);
    analyser.getByteTimeDomainData(_bassBuf);
    let sum = 0, peak = 0;
    for (let i = 0; i < n; i++) {
        const v = Math.abs(_bassBuf[i] - 128) / 128;
        sum += v * v;
        if (v > peak) peak = v;
    }
    const rms  = Math.sqrt(sum / n);
    const raw  = Math.max(rms * 3.5, peak * 1.2);
    const shaped = Math.pow(Math.min(raw, 1), 1.6);

    if (shaped > _bassEnv) _bassEnv = shaped;                       // ataque instantáneo
    else                   _bassEnv += (shaped - _bassEnv) * 0.28;  // release rápido sin cola
    if (_bassEnv < 0.004) _bassEnv = 0;
    return _bassEnv;
}
// partícula del fondo de constelaciones
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
        // glow falso: halo semitransparente sin shadowblur
        if (beat > 0.4) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 4.5, 0, Math.PI * 2);
            ctx.fillStyle = colors[colorIdx] + (b2 * 0.28) + ')';
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = colors[colorIdx] + alpha + ')';
        ctx.fill();
    }
}
const PARTICLE_COUNT = 55;
const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
// reusable para conexiones entre partículas, evita allocar cada frame
const _connBuf = [];
// dibuja las líneas entre partículas cercanas — batching por tier para minimizar flushes de GPU
function drawConnections(beat) {
    const MAX_DIST = 115 + beat * 70;
    const light = isLight();
    const baseOpacity = light ? 0.45 : 0.18;
    const maxOp = baseOpacity + beat * 0.4;
    const colorBase = beat > 0.25
        ? (light ? '100,40,210' : '139,92,246')
        : (light ? '0,120,200'  : '0,200,255');
    // recolecta conexiones válidas una sola vez
    _connBuf.length = 0;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const d  = Math.sqrt(dx * dx + dy * dy);
            if (d < MAX_DIST) _connBuf.push(i, j, d);
        }
    }
    // 3 tiers de opacidad → 3 stroke() en vez de ~1485
    const TIERS = 3;
    ctx.lineWidth = 0.5 + beat * 1.2;
    for (let ti = 0; ti < TIERS; ti++) {
        const dLo = (ti / TIERS) * MAX_DIST;
        const dHi = ((ti + 1) / TIERS) * MAX_DIST;
        const midFrac = 1 - (dLo + dHi) / 2 / MAX_DIST;
        ctx.strokeStyle = `rgba(${colorBase},${(maxOp * midFrac).toFixed(3)})`;
        ctx.beginPath();
        for (let k = 0; k < _connBuf.length; k += 3) {
            const d = _connBuf[k + 2];
            if (d < dLo || d >= dHi) continue;
            const pi = _connBuf[k], pj = _connBuf[k + 1];
            ctx.moveTo(particles[pi].x, particles[pi].y);
            ctx.lineTo(particles[pj].x, particles[pj].y);
        }
        ctx.stroke();
    }
}

// fondos del hero: un tema por día de la semana (getday() 0=dom…6=sáb), sobreescribible desde el studio
const HERO_THEMES = [
    // temas diarios reordenados: lunes-domingo (menú empieza con lunes)
    { id: 1, es: 'Matrix',         en: 'Matrix',           val: 'Matrix',            icon: 'fa-terminal'     },
    { id: 2, es: 'Geometría',      en: 'Geometry',         val: 'Geometria',         icon: 'fa-shapes'       },
    { id: 3, es: 'Aurora',         en: 'Aurora',           val: 'Aurora',            icon: 'fa-wind'         },
    { id: 4, es: 'Órbitas',        en: 'Orbits',           val: 'Òrbites',           icon: 'fa-circle-nodes' },
    { id: 5, es: 'Galaxia',        en: 'Galaxy',           val: 'Galàxia',           icon: 'fa-rotate'       },
    { id: 6, es: 'Circuitos',      en: 'Circuits',         val: 'Circuits',          icon: 'fa-microchip'    },
    { id: 0, es: 'Constelaciones', en: 'Constellations',  val: 'Constel·lacions',  icon: 'fa-star'         },
    // temas adicionales, solo seleccionables desde el studio
    { id:  7, es: 'Láser',          en: 'Laser',            val: 'Làser',             icon: 'fa-bolt'              },
    { id:  8, es: 'Ecualizador',     en: 'Equalizer',        val: 'Equalitzador',      icon: 'fa-circle-dot'        },
    { id:  9, es: 'Fuegos',         en: 'Fireworks',        val: 'Focs artificials',  icon: 'fa-fire'              },
    { id: 10, es: 'Ondas',          en: 'Waves',            val: 'Ones',              icon: 'fa-water'             },
    { id: 11, es: 'Meteoros',        en: 'Meteors',          val: 'Meteors',           icon: 'fa-meteor'            },
    { id: 12, es: 'ADN',            en: 'DNA',              val: 'ADN',               icon: 'fa-dna'               },
    { id: 14, es: 'Magnético',      en: 'Magnetic',         val: 'Magnètic',          icon: 'fa-magnet'            },
    { id: 15, es: 'Topografía',     en: 'Topography',       val: 'Topografia',        icon: 'fa-mountain'          },
    { id: 16, es: 'Hexágonos',      en: 'Hexagons',         val: 'Hexàgons',          icon: 'fa-cube'              },
];
// tema de fondo activo: el fondo del día tiene prioridad una vez al día
// si es un día nuevo respecto a la última visita, se aplica el fondo del día y se guarda la fecha
let _bgTheme = (() => {
    const today = new Date().toDateString();
    const lastDay = localStorage.getItem('heroBgDay');
    if (lastDay !== today) {
        const dayTheme = new Date().getDay();
        localStorage.setItem('heroBgTheme', dayTheme);
        localStorage.setItem('heroBgDay', today);
        return dayTheme;
    }
    const s = localStorage.getItem('heroBgTheme');
    return s !== null ? parseInt(s) : new Date().getDay();
})();
// devuelve los componentes rgb del acento 1 o 2 según el parámetro
function _heroAccent(w) {
    const s = w === 2 ? (window._accent2Rgb || '139 92 246') : (window._accent1Rgb || '0 200 255');
    return s.split(/\s+/).map(Number);
}
// cambia el fondo activo y resetea el estado interno de todos los temas
function setBgTheme(id) {
    _bgTheme = Math.max(0, Math.min(id, HERO_THEMES.length - 1));
    localStorage.setItem('heroBgTheme', _bgTheme);
    _matBuiltW = 0; _geoBuiltW = 0; _neonBuiltW = 0; _laserBuiltW = 0; _confW = 0;
    _metW = 0; _galW = 0; _magW = 0; _hexW = 0; _circW = 0;
    _fwBursts.length = 0; _fwLastT = 0; _fwPrevBeat = 0;
}

// tema 0: dibuja las partículas como constelaciones con conexiones entre ellas
function drawConstellation(beat) {
    particles.forEach(p => { p.update(beat); p.draw(beat); });
    drawConnections(beat);
}

// tema 1: lluvia de caracteres estilo matrix
const _MAT_SRC = 'アイウエオカキクケコサシスセソタナニヌハヒフマミムヤラリルロン0123456789ABCDEF<>/\\|{}[]';
const _MAT_CW  = 16; // ancho en px de cada columna de caracteres
let _matCols = [], _matBuiltW = 0;
// construye las columnas de la lluvia matrix según el ancho actual del canvas
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
// renderiza un frame de la lluvia matrix con velocidad reactiva al beat
function drawMatrix(beat, dt) {
    if (canvas.width !== _matBuiltW) _buildMatCols();
    const [r, g, b] = _heroAccent(1);
    ctx.font      = `${_MAT_CW}px monospace`;
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
    const spd = 1 + beat * 4;

    _matCols.forEach(col => {
        col.y += col.speed * spd * dt;
        if (++col.tick % 5 === 0)
            col.glyphs[Math.floor(Math.random() * col.glyphs.length)] =
                _MAT_SRC[Math.floor(Math.random() * _MAT_SRC.length)];
        if (col.y > canvas.height + col.len * _MAT_CW) {
            col.y     = -col.len * _MAT_CW - Math.random() * canvas.height * 0.5;
            col.speed = 80 + Math.random() * 110;
        }
        for (let i = 0; i < col.len; i++) {
            const cy = col.y - i * _MAT_CW;
            if (cy < -_MAT_CW || cy > canvas.height) continue;
            if (i === 0) {
                ctx.fillStyle = `rgba(255,255,255,${0.9 + beat * 0.1})`;
            } else {
                const frac = 1 - i / col.len;
                ctx.fillStyle = `rgba(${r},${g},${b},${frac * (0.08 + beat * 0.12)})`;
            }
            ctx.fillText(col.glyphs[i % col.glyphs.length], col.x + 1, cy);
        }
    });
}

// tema 2: polígonos geométricos flotantes
let _geoShapes = [], _geoBuiltW = 0;
// genera los polígonos con posición, velocidad y rotación aleatorias
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
// dibuja un polígono regular de n lados centrado en (x, y)
function _drawPoly(x, y, sides, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const a = rot + (Math.PI * 2 / sides) * i;
        i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
          : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
}
// renderiza un frame de geometría flotante con rotación y tamaño reactivos al beat
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
        ctx.stroke();
        ctx.fillStyle   = `rgba(${r},${g},${b},${al * 0.12})`;
        ctx.fill();
    });
}

// tema 3: bandas de aurora boreal animadas con gradiente
const _AUR_BANDS = Array.from({ length: 5 }, (_, i) => ({
    phase: Math.random() * Math.PI * 2,
    spd:   0.14 + Math.random() * 0.22,
    freq:  0.0025 + Math.random() * 0.003,
    amp:   45 + Math.random() * 65,
    thick: 55 + Math.random() * 80,
    fi:    i / 4,
}));
// renderiza un frame de aurora con bandas ondulantes y opacidad reactiva al beat
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

// tema 4: sistema solar — órbitas elípticas suaves anidadas que precesan despacio
// rfrac escalado x1.5 entre anillos + aspecto fijo → nunca se cruzan (anidamiento garantizado)
// cada anillo: nº planetas, velocidad orbital del planeta, tamaño, fase, precesión de la elipse
const _ORB_ASP = 0.46;          // achatamiento común de todas las elipses
const _ORB_PREC = 0.05;         // precesión compartida: todas giran juntas → nunca se cruzan
const _ORB_RINGS = [
    { rfrac: 0.13, n: 1, spd: 0.60,  sz: 4.2, phase: 0.0 },
    { rfrac: 0.21, n: 1, spd: 0.44,  sz: 3.8, phase: 1.4 },
    { rfrac: 0.30, n: 2, spd: 0.33,  sz: 3.4, phase: 0.6 },
    { rfrac: 0.41, n: 1, spd: 0.255, sz: 3.1, phase: 2.7 },
    { rfrac: 0.54, n: 2, spd: 0.195, sz: 2.8, phase: 4.0 },
    { rfrac: 0.69, n: 1, spd: 0.150, sz: 2.5, phase: 5.1 },
    { rfrac: 0.86, n: 3, spd: 0.115, sz: 2.3, phase: 0.9 },
    { rfrac: 1.05, n: 2, spd: 0.090, sz: 2.1, phase: 3.4 },
];
// punto sobre una elipse suave inclinada (tilt) para un ángulo dado
function _orbitPoint(cx, cy, rx, ry, cosT, sinT, ang) {
    const ex = Math.cos(ang) * rx;
    const ey = Math.sin(ang) * ry;
    return { x: cx + ex * cosT - ey * sinT, y: cy + ex * sinT + ey * cosT };
}
// renderiza el sistema solar: sol central + órbitas elípticas que precesan suave
function drawOrbital(beat, dt, t) {
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const base = Math.min(canvas.width, canvas.height) * 0.78;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    // inclinación compartida que avanza despacio: todo el sistema gira como un bloque
    const tilt = _ORB_PREC * t;
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);

    // sol central
    const cgr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24 + beat * 34);
    cgr.addColorStop(0, `rgba(${a1[0]},${a1[1]},${a1[2]},${0.55 + beat * 0.45})`);
    cgr.addColorStop(1, `rgba(${a1[0]},${a1[1]},${a1[2]},0)`);
    ctx.beginPath(); ctx.arc(cx, cy, 24 + beat * 34, 0, Math.PI * 2);
    ctx.fillStyle = cgr; ctx.fill();

    _ORB_RINGS.forEach((ring, ri) => {
        ring.phase += ring.spd * dt * (1 + beat * 1.5);
        const rx = ring.rfrac * base * (1 + beat * 0.08);
        const ry = rx * _ORB_ASP;
        const fi = ri / (_ORB_RINGS.length - 1);
        const r  = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g  = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b  = a1[2] + (a2[2] - a1[2]) * fi | 0;

        // traza la órbita elíptica suave
        ctx.beginPath();
        const N = 90;
        for (let i = 0; i <= N; i++) {
            const ang = (i / N) * Math.PI * 2;
            const p = _orbitPoint(cx, cy, rx, ry, cosT, sinT, ang);
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.14 + beat * 0.16})`;
        ctx.lineWidth   = 1 + beat * 1.2;
        ctx.stroke();

        // planetas orbitando suavemente sobre la elipse
        for (let d = 0; d < ring.n; d++) {
            const ang = ring.phase + (Math.PI * 2 / ring.n) * d;
            const p = _orbitPoint(cx, cy, rx, ry, cosT, sinT, ang);
            const osz = ring.sz * (1 + beat * 0.6);
            if (beat > 0.2) {
                ctx.beginPath(); ctx.arc(p.x, p.y, osz * 3.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${beat * 0.12})`;
                ctx.fill();
            }
            ctx.beginPath(); ctx.arc(p.x, p.y, osz, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${0.65 + beat * 0.35})`;
            ctx.fill();
        }
    });
    ctx.shadowBlur = 0;
}

// tema 5: gotas de lluvia neón con paleta de colores vivos
const _NEON_PAL = [[0,200,255],[200,0,255],[0,255,130],[255,50,200],[255,180,0],[100,255,100]];
let _neonDrops = [], _neonBuiltW = 0;
// crea una gota de lluvia neón con color y parámetros aleatorios
function _mkNeonDrop() {
    const [r, g, b] = _NEON_PAL[Math.floor(Math.random() * _NEON_PAL.length)];
    return {
        x: Math.random() * canvas.width, y: Math.random() * -canvas.height,
        len: 60 + Math.random() * 110,   spd: 230 + Math.random() * 340,
        r, g, b,                          w: 1 + Math.random() * 1.5,
    };
}
// inicializa el array de gotas según el ancho del canvas
function _buildNeonDrops() {
    _neonBuiltW = canvas.width;
    _neonDrops  = Array.from({ length: 65 }, _mkNeonDrop);
}
// renderiza un frame de lluvia neón con estela degradada y cabeza brillante
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
        // estela: degradado de transparente a visible, sin shadowblur
        ctx.beginPath(); ctx.moveTo(d.x, d.y - d.len); ctx.lineTo(d.x, d.y);
        ctx.strokeStyle = gr; ctx.lineWidth = d.w; ctx.shadowBlur = 0;
        ctx.stroke();
        // cabeza: glow falso con círculo extra semitransparente
        const dr = d.w * 1.4 + beat * 2.5;
        if (beat > 0.2) {
            ctx.beginPath(); ctx.arc(d.x, d.y, dr * 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${d.r},${d.g},${d.b},${beat * 0.1})`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(d.x, d.y, dr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.6 + beat * 0.4})`; ctx.fill();
    });
}

// tema 6: fuegos artificiales con partículas y estelas
const _FW_PAL = [[255,60,100],[0,200,255],[255,200,0],[200,80,255],[0,255,150],[255,120,0]];
const _fwBursts = [];
let _fwPrevBeat = 0, _fwLastT = 0;
// lanza una explosión de fuegos artificiales con partículas radiales
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
// renderiza un frame de fuegos artificiales con gravedad y estelas con historial de posiciones
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
            // glow falso: halo exterior sin shadowblur
            ctx.beginPath(); ctx.arc(px, py, al * 9, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${bst.r},${bst.g},${bst.b},${al * 0.2})`; ctx.fill();
            ctx.beginPath(); ctx.arc(px, py, al * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${bst.r},${bst.g},${bst.b},${al})`; ctx.fill();
        });
        if (!alive) _fwBursts.splice(bi, 1);
    }
}

// tema 6b: confeti con rectángulos, círculos y ribbons de colores hsv
let _confetti = [], _confW = 0;
// crea una pieza de confeti con forma, color y movimiento aleatorios
function _mkConfetto() {
    const hue = Math.random() * 360;
    const [r, g, b] = hslToRgb(hue, 90, 60);
    const shape = Math.random();   // 0-0.6 rect, 0.6-0.8 circle, 0.8-1 ribbon
    return {
        x: Math.random() * (canvas.width  + 100) - 50,
        y: Math.random() * -canvas.height,
        w: shape < 0.6 ? 7 + Math.random() * 7 : 5 + Math.random() * 5,
        h: shape < 0.6 ? 3 + Math.random() * 5 : (shape < 0.8 ? 5 + Math.random() * 5 : 2 + Math.random() * 2),
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 5,
        vx: (Math.random() - 0.5) * 50,
        vy: 70 + Math.random() * 110,
        r, g, b, hue, shape,
    };
}
// inicializa el array de confeti y sitúa las primeras 80 piezas en pantalla
function _buildConfetti() {
    _confW = canvas.width;
    _confetti = Array.from({ length: 130 }, _mkConfetto);
    // coloca algunas piezas ya en pantalla para que aparezcan desde el primer frame
    _confetti.forEach((p, i) => { if (i < 80) p.y = Math.random() * canvas.height; });
}
// renderiza un frame de confeti con rotación y color reactivos al beat
function drawConfetti(beat, dt) {
    if (canvas.width !== _confW) _buildConfetti();
    const spd = 1 + beat * 2.2;
    _confetti.forEach(p => {
        p.rot += p.rotSpd * spd * dt;
        p.x   += p.vx * dt + Math.sin(p.rot * 0.5) * 0.4;
        p.y   += p.vy * spd * dt;
        if (p.y > canvas.height + 20) { Object.assign(p, _mkConfetto()); }
        if (p.x < -60) p.x = canvas.width  + 50;
        if (p.x > canvas.width  + 60) p.x = -50;

        const al = 0.55 + beat * 0.35;
        const [r, g, b] = hslToRgb((p.hue + beat * 60) % 360, 88, 58 + beat * 14);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // glow falso: círculo extra semitransparente sin shadowblur
        if (beat > 0.3) {
            ctx.fillStyle = `rgba(${r},${g},${b},${beat * 0.12})`;
            ctx.beginPath(); ctx.arc(0, 0, p.w * 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = `rgba(${r},${g},${b},${al})`;
        if (p.shape < 0.6) {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.shape < 0.8) {
            ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.beginPath(); ctx.ellipse(0, 0, p.w, p.h / 2, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    });
}

// tema 7: rayos láser que barren desde los bordes con glow y pulseo reactivo al beat
let _laserEmitters = [], _laserBuiltW = 0;
// construye los focos en esquinas y bordes; cada uno oscila alrededor de un ángulo central
// que siempre apunta al interior del canvas, así nunca se salen de pantalla
function _buildLasers() {
    _laserBuiltW = canvas.width;
    const W = canvas.width, H = canvas.height;
    // center: ángulo base hacia el interior; swing: amplitud de oscilación; phase: desfase
    _laserEmitters = [
        { x: 0,     y: 0,     center: Math.PI * 0.25, swing: 0.55, phase: 0.0,  speed: 0.30, hueOff:   0 },
        { x: W,     y: 0,     center: Math.PI * 0.75, swing: 0.55, phase: 1.3,  speed: 0.24, hueOff:  80 },
        { x: W,     y: H,     center: Math.PI * 1.25, swing: 0.55, phase: 2.6,  speed: 0.28, hueOff: 160 },
        { x: 0,     y: H,     center: Math.PI * 1.75, swing: 0.55, phase: 3.9,  speed: 0.22, hueOff: 240 },
        { x: W / 2, y: 0,     center: Math.PI * 0.50, swing: 0.70, phase: 5.1,  speed: 0.35, hueOff: 310 },
    ];
}
// calcula el punto donde el rayo desde (ex,ey) en dirección angle toca el borde del canvas
function _laserEndpoint(ex, ey, angle, W, H) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    let tMin = Infinity;
    if (dx > 0) tMin = Math.min(tMin, (W - ex) / dx);
    else if (dx < 0) tMin = Math.min(tMin, -ex / dx);
    if (dy > 0) tMin = Math.min(tMin, (H - ey) / dy);
    else if (dy < 0) tMin = Math.min(tMin, -ey / dy);
    return { x: ex + dx * tMin, y: ey + dy * tMin };
}
// dibuja un único rayo láser suave: halo tenue + línea fina + sin destello de origen
function _drawBeam(ex, ey, angle, r, g, b, beat, W, H) {
    const end = _laserEndpoint(ex, ey, angle, W, H);
    const alpha = 0.18 + beat * 0.18;
    // halo exterior muy difuso
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.25})`;
    ctx.lineWidth = 6 + beat * 4;
    ctx.shadowBlur = 0; ctx.stroke();
    // línea principal con glow moderado
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.7})`;
    ctx.lineWidth = 2 + beat * 1.2; ctx.stroke();
}
// renderiza el frame completo del tema láser
function drawLaser(beat, dt, t) {
    if (canvas.width !== _laserBuiltW) _buildLasers();
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1);

    // cuadrícula tenue tipo Tron en el fondo
    const gridAlpha = 0.025 + beat * 0.02;
    ctx.strokeStyle = `rgba(${a1[0]},${a1[1]},${a1[2]},${gridAlpha})`;
    ctx.lineWidth = 1; ctx.shadowBlur = 0;
    const step = 80;
    for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // el ángulo oscila sinusoidalmente alrededor del centro: siempre apunta al interior
    _laserEmitters.forEach(e => {
        const angle = e.center + Math.sin(t * e.speed + e.phase) * e.swing;
        const hue = (t * 12 + e.hueOff) % 360;
        const [r, g, b] = hslToRgb(hue, 90, 55 + beat * 12);
        _drawBeam(e.x, e.y, angle, r, g, b, beat, W, H);
    });
    ctx.shadowBlur = 0;
}

// tema 8: anillos concéntricos que se contraen hacia el centro como un vórtice
function drawEqualizer(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const cx = W * 0.5, cy = H * 0.5;
    const arcR = Math.min(W, H) * (0.34 + beat * 0.03);

    // glow radial alrededor del círculo (4 pasadas)
    for (let pass = 0; pass < 4; pass++) {
        const rOuter = arcR + pass * 8 + 4;
        const rInner = Math.max(0, arcR - pass * 6);
        const glowG  = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
        const alpha  = (0.12 + beat * 0.15) * Math.pow(0.5, pass);
        glowG.addColorStop(0,   `rgba(${a1[0]},${a1[1]},${a1[2]},0)`);
        glowG.addColorStop(0.5, `rgba(${a1[0]},${a1[1]},${a1[2]},${alpha})`);
        glowG.addColorStop(1,   `rgba(${a1[0]},${a1[1]},${a1[2]},0)`);
        ctx.fillStyle = glowG;
        ctx.fillRect(0, 0, W, H);
    }

    // barras del ecualizador circular (80 barras)
    const specBars  = 80;
    const specStart = arcR + 1;
    for (let i = 0; i < specBars; i++) {
        const ang  = (i / specBars) * Math.PI * 2 - Math.PI / 2;
        const ph   = t * 1.2 + i * (Math.PI * 2 / specBars) * 2.5;
        const bh   = arcR * (0.04 + 0.18 * Math.abs(Math.sin(ph)) * (0.15 + beat * 0.85));
        const x1   = cx + Math.cos(ang) * specStart;
        const y1   = cy + Math.sin(ang) * specStart;
        const x2   = cx + Math.cos(ang) * (specStart + bh);
        const y2   = cy + Math.sin(ang) * (specStart + bh);
        const frac = i / specBars;
        const cr   = frac < 0.5
            ? [a1[0] + (a2[0]-a1[0])*frac*2, a1[1] + (a2[1]-a1[1])*frac*2, a1[2] + (a2[2]-a1[2])*frac*2]
            : [a2[0] + (a1[0]-a2[0])*(frac-0.5)*2, a2[1] + (a1[1]-a2[1])*(frac-0.5)*2, a2[2] + (a1[2]-a2[2])*(frac-0.5)*2];
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(${cr[0]|0},${cr[1]|0},${cr[2]|0},${0.18 + beat * 0.55})`;
        ctx.lineWidth   = 1.8;
        ctx.stroke();
    }

    // círculo principal
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${a1[0]},${a1[1]},${a1[2]},${0.22 + beat * 0.35})`;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // círculo interior secundario
    ctx.beginPath();
    ctx.arc(cx, cy, arcR * 0.88, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${a2[0]},${a2[1]},${a2[2]},${0.10 + beat * 0.18})`;
    ctx.lineWidth   = 1;
    ctx.stroke();

    // flow lines horizontales sutiles
    for (let li = 0; li < 6; li++) {
        const yBase = H * (0.22 + li * 0.12);
        const amp   = (12 + li * 6) * (1 + beat * 1.2);
        const freq  = 0.008 + li * 0.002;
        const phase = t * (0.4 + li * 0.15) + li * 1.1;
        const cr    = li % 2 === 0 ? a1 : a2;
        const alpha = (0.04 + beat * 0.07) * (1 - li * 0.1);
        ctx.beginPath();
        for (let x = 0; x <= W; x += 4) {
            const y = yBase + Math.sin(x * freq + phase) * amp
                             + Math.sin(x * freq * 0.5 + phase * 1.3) * amp * 0.4;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${cr[0]},${cr[1]},${cr[2]},${alpha})`;
        ctx.lineWidth   = 1;
        ctx.stroke();
    }
}

// tema 10: capas de ondas sinusoidales compuestas reactivas al beat
function drawWaves(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const LAYERS = 8;
    ctx.shadowBlur = 0;
    for (let li = 0; li < LAYERS; li++) {
        const fi    = li / (LAYERS - 1);
        const r     = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g     = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b     = a1[2] + (a2[2] - a1[2]) * fi | 0;
        const amp   = (22 + fi * 70) * (1 + beat * 3);
        const freq  = 0.005 + fi * 0.003;
        const phase = t * (0.4 + fi * 0.5) + li * 1.1;
        const yBase = H * 0.1 + (H * 0.8) * fi;
        const al    = 0.10 + fi * 0.07 + beat * 0.18;

        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
            const y = yBase
                + Math.sin(x * freq       + phase)         * amp
                + Math.sin(x * freq * 2.1 + phase * 1.4)   * amp * 0.35
                + Math.sin(x * freq * 0.5 + phase * 0.7)   * amp * 0.2;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${r},${g},${b},${al})`;
        ctx.lineWidth   = 1.2 + fi * 1.8 + beat * 3.5;
        ctx.stroke();
    }
}

// tema 11: meteoros que caen en diagonal con estela degradada
let _meteors = [], _metW = 0;
// crea un meteoro con ángulo y velocidad aleatorios; seeded lo coloca ya en pantalla
function _mkMeteor(seeded) {
    const angle = Math.PI * 0.32 + (Math.random() - 0.5) * 0.35;
    const spd   = 280 + Math.random() * 320;
    const m = {
        x:    Math.random() * canvas.width * 1.4 - canvas.width * 0.2,
        y:    -30 - Math.random() * canvas.height * 0.6,
        vx:   Math.cos(angle) * spd,
        vy:   Math.sin(angle) * spd,
        len:  55 + Math.random() * 130,
        w:    0.8 + Math.random() * 2,
        hue:  Math.random() * 360,
        al:   0.45 + Math.random() * 0.55,
    };
    if (seeded) m.y = Math.random() * canvas.height;
    return m;
}
// inicializa los meteoros; los primeros 9 aparecen ya dentro del canvas
function _buildMeteors() {
    _metW    = canvas.width;
    _meteors = Array.from({ length: 16 }, (_, i) => _mkMeteor(i < 9));
}
// renderiza un frame de meteoros; el beat lanza meteoros extra
function drawMeteors(beat, dt) {
    if (canvas.width !== _metW) _buildMeteors();

    // lanza meteoros extra cuando hay beat fuerte
    if (beat > 0.45 && Math.random() < beat * 0.35) _meteors.push(_mkMeteor(false));
    if (_meteors.length > 45) _meteors.splice(0, _meteors.length - 45);

    const spd = 1 + beat * 2.8;

    for (let i = _meteors.length - 1; i >= 0; i--) {
        const m = _meteors[i];
        m.x += m.vx * spd * dt;
        m.y += m.vy * spd * dt;

        if (m.y > canvas.height + 60 || m.x > canvas.width + 120) {
            _meteors[i] = _mkMeteor(false);
            continue;
        }

        const [r, g, b] = hslToRgb((m.hue + beat * 70) % 360, 88, 62);
        const mag  = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        const nx   = m.vx / mag, ny = m.vy / mag;
        const tail = m.len * (0.7 + beat * 0.6);
        const tx   = m.x - nx * tail, ty = m.y - ny * tail;

        const grad = ctx.createLinearGradient(tx, ty, m.x, m.y);
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.6, `rgba(${r},${g},${b},${m.al * (0.25 + beat * 0.3)})`);
        grad.addColorStop(1,   `rgba(255,255,255,${m.al * (0.5 + beat * 0.4)})`);

        // estela: sin shadowblur para evitar demasiadas llamadas costosas
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = m.w + beat * 2.5;
        ctx.shadowBlur  = 0;
        ctx.stroke();

        // cabeza: glow falso más núcleo blanco
        const hr = m.w * 1.8 + beat * 3.5;
        ctx.beginPath();
        ctx.arc(m.x, m.y, hr * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${beat * 0.12})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(m.x, m.y, hr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.72 + beat * 0.28})`;
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

// tema 12: doble hélice de adn con peldaños y nodos reactivos al beat
function drawDNA(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const cx   = W / 2;
    const amp  = W * 0.22 * (1 + beat * 0.25);
    const freq = 1.8;
    const spd  = t * 0.7;

    // dibuja las dos hélices con los colores de acento
    [0, Math.PI].forEach((offset, si) => {
        const nc = si === 0 ? a1 : a2;
        ctx.beginPath();
        for (let yi = 0; yi <= H; yi += 2) {
            const phase = (yi / H) * Math.PI * 2 * freq + spd + offset;
            const x = cx + Math.cos(phase) * amp;
            yi === 0 ? ctx.moveTo(x, yi) : ctx.lineTo(x, yi);
        }
        ctx.strokeStyle = `rgba(${nc[0]},${nc[1]},${nc[2]},${0.35 + beat * 0.3})`;
        ctx.lineWidth   = 2 + beat * 3;
        ctx.stroke();
    });

    // dibuja los peldaños entre hélices y nodos en posiciones clave
    const RUNGS = Math.floor(H / 22);
    for (let i = 0; i <= RUNGS; i++) {
        const y     = (i / RUNGS) * H;
        const phase = (y / H) * Math.PI * 2 * freq + spd;
        const x1    = cx + Math.cos(phase) * amp;
        const x2    = cx + Math.cos(phase + Math.PI) * amp;
        const fi    = (Math.sin(phase) + 1) / 2;
        const r     = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g     = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b     = a1[2] + (a2[2] - a1[2]) * fi | 0;

        ctx.beginPath();
        ctx.moveTo(x1, y); ctx.lineTo(x2, y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.09 + beat * 0.14})`;
        ctx.lineWidth   = 1 + beat;
        ctx.shadowBlur  = 0;
        ctx.stroke();

        if (i % 3 === 0) {
            [[x1, a1], [x2, a2]].forEach(([nx, nc]) => {
                const nr = 3 + beat * 4.5;
                // glow falso: halo sin shadowblur
                if (beat > 0.2) {
                    ctx.beginPath(); ctx.arc(nx, y, nr * 4, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${nc[0]},${nc[1]},${nc[2]},${beat * 0.15})`; ctx.fill();
                }
                ctx.beginPath(); ctx.arc(nx, y, nr, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${nc[0]},${nc[1]},${nc[2]},${0.5 + beat * 0.5})`; ctx.fill();
            });
        }
    }
}

// tema 13: galaxia espiral de tres brazos con rotación lenta
let _galaxyStars = [], _galW = 0;
// genera las estrellas de la galaxia distribuidas en tres brazos espirales
function _buildGalaxy() {
    _galW = canvas.width;
    _galaxyStars = Array.from({ length: 700 }, () => {
        const arm   = Math.floor(Math.random() * 3);
        const d     = Math.pow(Math.random(), 0.55) * 0.5;
        const base  = (arm / 3) * Math.PI * 2;
        const angle = base + d * Math.PI * 3.2 + (Math.random() - 0.5) * 0.5;
        return {
            dx:    Math.cos(angle) * d,
            dy:    Math.sin(angle) * d,
            size:  0.4 + Math.random() * 1.8,
            spd:   0.08 + (1 - d * 2) * 0.25,
            alpha: 0.25 + Math.random() * 0.75,
            fi:    d * 2,
        };
    });
}
// renderiza un frame de la galaxia con rotación diferencial por radio y glow reactivo
function drawGalaxy(beat, dt, t) {
    if (canvas.width !== _galW) _buildGalaxy();
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const R   = canvas.width * 0.46;
    const rot = t * 0.07;

    _galaxyStars.forEach(s => {
        const angle = Math.atan2(s.dy, s.dx) + rot * s.spd;
        const d     = Math.sqrt(s.dx * s.dx + s.dy * s.dy);
        const x     = cx + Math.cos(angle) * d * R;
        const y     = cy + Math.sin(angle) * d * R * 0.55;
        const fi    = Math.min(s.fi, 1);
        const r     = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g     = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b     = a1[2] + (a2[2] - a1[2]) * fi | 0;
        const al    = s.alpha * (0.35 + beat * 0.5);
        const sz    = s.size * (1 + beat * 2);
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${al})`;
        ctx.fill();
    });
}

// tema 16: hexágonos — malla hexagonal con ripples reactivos al beat (igual que la promo del arcade)
let _hexes = [], _hexRipples = [], _hexW = 0, _hexPrevBeat = 0, _hexLastRipT = 0;
const _HEX_S = 38;
function _buildHexGrid() {
    _hexW = canvas.width;
    _hexes = [];
    const cw = _HEX_S * Math.sqrt(3), rh = _HEX_S * 1.5;
    const cols = Math.ceil(canvas.width / cw) + 2, rows = Math.ceil(canvas.height / rh) + 2;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
            const x = col * cw + (row % 2 !== 0 ? cw / 2 : 0);
            const y = row * rh;
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            _hexes.push({ x, y, dist, phase: Math.random() * Math.PI * 2 });
        }
    }
}
function _hexPath(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i - Math.PI / 6;
        i === 0 ? ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
                : ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath();
}
function drawHexagons(beat, dt, t) {
    if (canvas.width !== _hexW) _buildHexGrid();
    const W = canvas.width, H = canvas.height;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const inner = _HEX_S - 2;

    if (beat > 0.22 && _hexPrevBeat < beat && t - _hexLastRipT > 0.18) {
        _hexRipples.push({ r: 0, speed: 260 + beat * 140, str: 0.4 + beat * 0.6 });
        _hexLastRipT = t;
    }
    _hexPrevBeat = beat;
    const maxR = Math.sqrt(W * W + H * H) * 0.6;
    for (let i = _hexRipples.length - 1; i >= 0; i--) {
        _hexRipples[i].r += _hexRipples[i].speed * dt;
        if (_hexRipples[i].r > maxR) _hexRipples.splice(i, 1);
    }

    _hexes.forEach(h => {
        let glow = (Math.sin(t * 0.6 + h.phase) * 0.5 + 0.5) * 0.035 + beat * 0.06;
        for (let i = 0; i < _hexRipples.length; i++) {
            const delta = Math.abs(h.dist - _hexRipples[i].r);
            const width = 55 + _hexRipples[i].r * 0.15;
            if (delta < width) glow += (1 - delta / width) * _hexRipples[i].str * 0.75;
        }
        glow = Math.min(glow, 1);
        if (glow < 0.012) return;

        const frac = Math.min(h.dist / (Math.min(W, H) * 0.55), 1);
        const cr = a1[0] + (a2[0] - a1[0]) * frac | 0;
        const cg = a1[1] + (a2[1] - a1[1]) * frac | 0;
        const cb = a1[2] + (a2[2] - a1[2]) * frac | 0;

        _hexPath(h.x, h.y, inner);
        const tg = ctx.createRadialGradient(h.x - inner * 0.25, h.y - inner * 0.25, 0, h.x, h.y, inner);
        tg.addColorStop(0,    `rgba(${cr},${cg},${cb},${glow * 0.55})`);
        tg.addColorStop(0.65, `rgba(${cr},${cg},${cb},${glow * 0.18})`);
        tg.addColorStop(1,    `rgba(${cr},${cg},${cb},0.02)`);
        ctx.fillStyle = tg; ctx.fill();

        _hexPath(h.x, h.y, inner);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${Math.min(glow * 1.1, 0.9)})`;
        ctx.lineWidth   = 0.7 + glow * 1.4;
        ctx.stroke();

        if (glow > 0.18) {
            _hexPath(h.x, h.y, inner * 0.78);
            const sg = ctx.createLinearGradient(h.x - inner, h.y - inner, h.x + inner * 0.4, h.y + inner * 0.4);
            sg.addColorStop(0, `rgba(255,255,255,${glow * 0.22})`);
            sg.addColorStop(1, `rgba(255,255,255,0)`);
            ctx.fillStyle = sg; ctx.fill();
        }
    });
}

// tema 17 se mantiene como plasma — se reemplaza aquí el bloque de crystals
// tema 16 arriba, tema 17 (plasma) debajo sin cambios

// tema 17: circuitos — pistas de PCB con pulsos de corriente reactivos al beat
let _circW = 0, _circTraces = [], _circPulses = [], _circLastBeat = 0;
const _CIRC_GRID = 60;
function _buildCircuits() {
    _circW = canvas.width;
    _circTraces = [];
    _circPulses = [];
    const W = canvas.width, H = canvas.height;
    const cols = Math.ceil(W / _CIRC_GRID) + 1;
    const rows = Math.ceil(H / _CIRC_GRID) + 1;
    // genera nodos en la cuadrícula con pequeño offset aleatorio
    const nodes = [];
    for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
            nodes.push({
                x: c * _CIRC_GRID + (Math.random() - 0.5) * _CIRC_GRID * 0.3,
                y: r * _CIRC_GRID + (Math.random() - 0.5) * _CIRC_GRID * 0.3,
            });
        }
    }
    const stride = cols + 1;
    // conecta nodos horizontales y verticales como pistas de PCB
    for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
            const idx = r * stride + c;
            if (c < cols && Math.random() > 0.25) {
                _circTraces.push({ a: nodes[idx], b: nodes[idx + 1], len: 0 });
            }
            if (r < rows && Math.random() > 0.25) {
                _circTraces.push({ a: nodes[idx], b: nodes[idx + stride], len: 0 });
            }
        }
    }
    // calcula la longitud de cada traza
    _circTraces.forEach(tr => {
        const dx = tr.b.x - tr.a.x, dy = tr.b.y - tr.a.y;
        tr.len = Math.sqrt(dx * dx + dy * dy);
    });
}
function drawCircuits(beat, dt, t) {
    if (canvas.width !== _circW) _buildCircuits();
    const a1 = _heroAccent(1), a2 = _heroAccent(2);

    // lanza pulsos en cada beat
    if (beat > 0.2 && beat > _circLastBeat && t - (_circPulses[0]?.born || 0) > 0.15) {
        const tr = _circTraces[Math.floor(Math.random() * _circTraces.length)];
        _circPulses.push({ tr, pos: 0, speed: 0.8 + beat * 1.4, str: beat, born: t });
    }
    _circLastBeat = beat;
    for (let i = _circPulses.length - 1; i >= 0; i--) {
        _circPulses[i].pos += _circPulses[i].speed * dt;
        if (_circPulses[i].pos > 1.2) _circPulses.splice(i, 1);
    }

    // dibuja las trazas base (dim)
    ctx.lineWidth = 0.8;
    _circTraces.forEach(tr => {
        const fi = tr.a.x / canvas.width;
        const r = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b = a1[2] + (a2[2] - a1[2]) * fi | 0;
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.1 + beat * 0.08})`;
        ctx.beginPath();
        ctx.moveTo(tr.a.x, tr.a.y);
        ctx.lineTo(tr.b.x, tr.b.y);
        ctx.stroke();
    });

    // dibuja los pulsos de corriente
    ctx.shadowBlur = 8 + beat * 18;
    _circPulses.forEach(p => {
        const { tr, pos, str } = p;
        const px = tr.a.x + (tr.b.x - tr.a.x) * Math.min(pos, 1);
        const py = tr.a.y + (tr.b.y - tr.a.y) * Math.min(pos, 1);
        const fi = px / canvas.width;
        const r = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b = a1[2] + (a2[2] - a1[2]) * fi | 0;
        ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
        ctx.fillStyle   = `rgba(${r},${g},${b},${Math.max(0, str * (1 - pos * 0.7))})`;
        ctx.beginPath();
        ctx.arc(px, py, 3 + str * 4, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    // nodos en las intersecciones
    const nodes = new Set();
    _circTraces.forEach(tr => { nodes.add(tr.a); nodes.add(tr.b); });
    nodes.forEach(n => {
        const fi = n.x / canvas.width;
        const r = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b = a1[2] + (a2[2] - a1[2]) * fi | 0;
        ctx.fillStyle = `rgba(${r},${g},${b},${0.18 + beat * 0.2})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// tema 14: partículas atraídas/repelidas por polos magnéticos móviles
let _magParts = [], _magPoles = [], _magW = 0;
// genera las partículas y la configuración inicial de los tres polos
function _buildMagnetic() {
    _magW = canvas.width;
    _magParts = Array.from({ length: 220 }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        vx:    (Math.random() - 0.5) * 20,
        vy:    (Math.random() - 0.5) * 20,
        hue:   Math.random() * 360,
        trail: [],
    }));
    _magPoles = [
        { bx: 0.28, by: 0.40, sign:  1 },
        { bx: 0.72, by: 0.60, sign: -1 },
        { bx: 0.50, by: 0.22, sign:  1 },
    ];
}
// renderiza un frame del campo magnético con polos que se desplazan lentamente
function drawMagnetic(beat, dt, t) {
    if (canvas.width !== _magW) _buildMagnetic();
    const W = canvas.width, H = canvas.height;
    // polos con posición que oscila suavemente con el tiempo
    const poles = [
        { x: W * (0.28 + 0.12 * Math.sin(t * 0.28)),     y: H * (0.40 + 0.12 * Math.cos(t * 0.35)),     sign:  1 },
        { x: W * (0.72 + 0.12 * Math.sin(t * 0.41 + 1)), y: H * (0.60 + 0.12 * Math.cos(t * 0.29 + 2)), sign: -1 },
        { x: W * (0.50 + 0.18 * Math.sin(t * 0.19 + 3)), y: H * (0.28 + 0.12 * Math.cos(t * 0.55)),     sign:  1 },
    ];

    _magParts.forEach(p => {
        let fx = 0, fy = 0;
        poles.forEach(pole => {
            const dx = pole.x - p.x;
            const dy = pole.y - p.y;
            const d  = Math.sqrt(dx * dx + dy * dy) + 1;
            const f  = pole.sign * 7500 / (d * d) * (1 + beat * 2.5);
            fx += (dx / d) * f;
            fy += (dy / d) * f;
        });
        p.vx = p.vx * 0.90 + fx * dt;
        p.vy = p.vy * 0.90 + fy * dt;
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const max = 90 + beat * 70;
        if (spd > max) { p.vx = p.vx / spd * max; p.vy = p.vy / spd * max; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 14) p.trail.shift();
        if (p.trail.length < 2) return;

        const [r, g, b] = hslToRgb((p.hue + beat * 90) % 360, 82, 55);
        // estela como un único trazo con gradiente → 1 stroke por partícula en vez de 13
        const t0 = p.trail[0], tN = p.trail[p.trail.length - 1];
        const gr = ctx.createLinearGradient(t0.x, t0.y, tN.x, tN.y);
        gr.addColorStop(0, `rgba(${r},${g},${b},0)`);
        gr.addColorStop(1, `rgba(${r},${g},${b},${0.07 + beat * 0.1})`);
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i].x, p.trail[i].y);
        ctx.strokeStyle = gr;
        ctx.lineWidth   = 1.2;
        ctx.stroke();
        const pr = 1.2 + beat * 2.5;
        // glow falso: círculo extra semitransparente sin shadowblur
        if (beat > 0.25) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, pr * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${beat * 0.1})`;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.55 + beat * 0.45})`;
        ctx.fill();
    });
    ctx.shadowBlur = 0;
}

// tema 15: curvas de nivel topográficas con distorsión senoidal y glow
function drawTopo(beat, dt, t) {
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const a1 = _heroAccent(1), a2 = _heroAccent(2);
    const LINES = 22;
    const maxR  = Math.min(W, H) * 0.50;

    for (let li = 0; li < LINES; li++) {
        const fi    = li / (LINES - 1);
        const R     = (0.08 + fi * 0.92) * maxR;
        const phase = t * (0.15 + fi * 0.18) + li * 0.35;
        const r     = a1[0] + (a2[0] - a1[0]) * fi | 0;
        const g     = a1[1] + (a2[1] - a1[1]) * fi | 0;
        const b     = a1[2] + (a2[2] - a1[2]) * fi | 0;
        const al    = (1 - fi * 0.5) * (0.07 + beat * 0.18);

        ctx.beginPath();
        const PTS = 140;
        for (let i = 0; i <= PTS; i++) {
            const angle = (i / PTS) * Math.PI * 2;
            const dist  = R * (
                1
                + 0.22 * Math.sin(angle * 3 + phase)
                + 0.13 * Math.sin(angle * 7 - phase * 1.5)
                + 0.07 * Math.sin(angle * 13 + phase * 0.8)
                + beat  * 0.18 * Math.sin(angle * 5 + t * 2)
            );
            const x = cx + Math.cos(angle) * dist;
            const y = cy + Math.sin(angle) * dist * 0.58;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${al})`;
        ctx.lineWidth   = 0.9 + beat * 2.2;
        ctx.stroke();
    }
}

// dispatcher: llama a la función de dibujado del fondo activo
function heroThemeDraw(beat, dt, t) {
    switch (_bgTheme) {
        case 1:  drawMatrix(beat, dt);        break;
        case 2:  drawGeometry(beat, dt);      break;
        case 3:  drawAurora(beat, dt, t);     break;
        case 4:  drawOrbital(beat, dt, t);    break;
        case 5:  drawGalaxy(beat, dt, t);     break;
        case 6:  drawCircuits(beat, dt, t);   break;
        case 7:  drawLaser(beat, dt, t);      break;
        case 8:  drawEqualizer(beat, dt, t);   break;
        case 9:  drawFireworks(beat, dt, t);  break;
        case 10: drawWaves(beat, dt, t);      break;
        case 11: drawMeteors(beat, dt);       break;
        case 12: drawDNA(beat, dt, t);        break;
        case 13: drawGalaxy(beat, dt, t);     break;
        case 14: drawMagnetic(beat, dt, t);   break;
        case 15: drawTopo(beat, dt, t);        break;
        case 16: drawHexagons(beat, dt, t);    break;
        case 17: drawCircuits(beat, dt, t);    break;
        default: drawConstellation(beat);      break;
    }
}

const ROOT = document.documentElement;
let _visualBeat = 0; // energía visual del beat, suavizada para las animaciones css
// convierte un color hsl a componentes rgb [0-255]
function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
// calcula los colores de acento según el beat y los publica en globals js (cada frame)
// igual que el arcade: el beat solo se publica en globals js que lee el canvas
// nunca se escribe en :root durante la animación (mutar una custom property heredada
// fuerza recalc de todo el árbol + repaint de cada elemento que la usa = tirón con música)
function updateAccentColors(v) {
    if (window._colorDragging) return;
    const _h1base = window._paletteH1 !== undefined ? window._paletteH1 : 195;
    const _h2base = window._paletteH2 !== undefined ? window._paletteH2 : 262;
    const _l1base = window._paletteL1 !== undefined ? window._paletteL1 : 50;
    const _l2base = window._paletteL2 !== undefined ? window._paletteL2 : 60;
    const [r1, g1, b1] = hslToRgb(_h1base + v * 30, 100, _l1base + v * 10);
    const [r2, g2, b2r] = hslToRgb(_h2base + v * 20, 90, _l2base + v * 8);
    window._accent1Rgb = `${r1} ${g1} ${b1}`;
    window._accent2Rgb = `${r2} ${g2} ${b2r}`;
}
// reactividad del dom al beat sin tirones: --beat-alpha se escribe escopado a cada sección
// (estilo directo del elemento → solo recalcula su subárbol, no todo el documento como :root)
// y solo en las secciones que están en pantalla; las de fuera no cuestan nada
let _beatSections = [];
function _initBeatSections() {
    const els = Array.from(document.querySelectorAll('section'));
    const npb = document.getElementById('nowPlayingBar');
    if (npb) els.push(npb);
    _beatSections = els.map(el => ({ el, visible: true }));
    try {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                const s = _beatSections.find(x => x.el === e.target);
                if (!s) return;
                s.visible = e.isIntersecting;
                if (!e.isIntersecting) e.target.style.setProperty('--beat-alpha', '0');
            });
        });
        _beatSections.forEach(s => { s.visible = false; io.observe(s.el); });
    } catch (e) { /* sin intersectionobserver: se animan todas */ }
}
let _beatIdle = false;
// escribe --beat-alpha solo en secciones visibles; en silencio escribe 0 una vez y para
function pulseBeatDom(v) {
    if (!_beatSections.length) _initBeatSections();
    if (v < 0.005) {
        if (_beatIdle) return;
        _beatIdle = true;
        v = 0;
    } else {
        _beatIdle = false;
    }
    const a = v.toFixed(3);
    for (const s of _beatSections) {
        if (s.visible) s.el.style.setProperty('--beat-alpha', a);
    }
}
// las partículas solo se dibujan cuando el hero es visible: drawconnections es o(n²)
// el beat y los colores de acento se actualizan siempre porque los usa toda la web
let _heroVisible = true;
try {
    new IntersectionObserver((entries) => { _heroVisible = entries[0].isIntersecting; }).observe(canvas);
} catch (e) { /* navegador sin intersectionobserver: se anima siempre */ }
let _lastFrameTs = 0;
// bucle principal de animación del hero: actualiza el beat y dibuja el fondo activo
function animateParticles(ts = 0) {
    requestAnimationFrame(animateParticles);
    const dt = _lastFrameTs ? Math.min((ts - _lastFrameTs) / 1000, 0.05) : 0.016;
    _lastFrameTs = ts;
    const beat = getBassEnergy();
    _visualBeat = beat > _visualBeat ? beat : _visualBeat + (beat - _visualBeat) * 0.6;
    if (_visualBeat < 0.005) _visualBeat = 0;
    if (document.documentElement.classList.contains('arcade-lock')) return;
    // globals js para el canvas + --beat-alpha escopado a las secciones visibles del dom
    updateAccentColors(_visualBeat);
    pulseBeatDom(_visualBeat);
    if (!_heroVisible) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    heroThemeDraw(_visualBeat, dt, ts / 1000);
}
animateParticles();

// aplica dos tonos hsl como colores de acento y actualiza las custom properties css y las globales del canvas
function applyHueColors(h1, h2) {
    h1 = ((h1 % 360) + 360) % 360;
    h2 = ((h2 % 360) + 360) % 360;
    const [r1,g1,b1] = hslToRgb(h1, 100, 55);
    const [r2,g2,b2] = hslToRgb(h2, 90, 60);
    const c1 = `rgb(${r1},${g1},${b1})`;
    const c2 = `rgb(${r2},${g2},${b2})`;
    const root = document.documentElement;
    root.style.setProperty('--accent-1',     c1);
    root.style.setProperty('--accent-2',     c2);
    root.style.setProperty('--accent-1-rgb', `${r1} ${g1} ${b1}`);
    root.style.setProperty('--accent-2-rgb', `${r2} ${g2} ${b2}`);
    root.style.setProperty('--gradient',     `linear-gradient(135deg,${c1} 0%,${c2} 100%)`);
    window._accent1Rgb  = [r1, g1, b1];
    window._accent2Rgb  = [r2, g2, b2];
    window._paletteH1   = h1;
    window._paletteH2   = h2;
    window._paletteL1   = 55;
    window._paletteL2   = 60;
    localStorage.setItem('portfolioH1', h1);
    localStorage.setItem('portfolioH2', h2);
}

// presets de paleta de color predefinidos para el studio
const COLOR_PRESETS = [
    { id: 'cyber',    name: 'Cibernético', h1: 195, h2: 270 },
    { id: 'fuego',    name: 'Fuego',       h1: 22,  h2: 0   },
    { id: 'bosque',   name: 'Bosque',      h1: 145, h2: 195 },
    { id: 'aurora',   name: 'Aurora',      h1: 330, h2: 268 },
    { id: 'oro',      name: 'Oro',         h1: 43,  h2: 22  },
    { id: 'neon',     name: 'Neón',        h1: 84,  h2: 190 },
    { id: 'amatista', name: 'Amatista',    h1: 280, h2: 340 },
];

// crea y gestiona el selector de tono (franja arcoíris con thumb arrastrable)
function createHueStrip(canvas, initialH1, hueOffset, onChange) {
    const ctx = canvas.getContext('2d');
    const TH  = canvas.height; // track height in CSS px
    let h1       = initialH1;
    let offset   = hueOffset;
    let dragging = false;
    const DPR    = window.devicePixelRatio || 1;

    // ajusta las dimensiones del canvas al contenedor y escala por dpr
    function syncSize() {
        const W = canvas.parentElement ? canvas.parentElement.clientWidth : 244;
        canvas.width  = W * DPR;
        canvas.height = TH * DPR;
        canvas.style.width  = W  + 'px';
        canvas.style.height = TH + 'px';
        ctx.scale(DPR, DPR);
    }

    // dibuja la franja arcoíris y el thumb en la posición del tono actual
    function draw() {
        const W  = canvas.width  / DPR;
        const H  = canvas.height / DPR;
        const R  = H / 2;
        ctx.clearRect(0, 0, W, H);

        // franja degradada de 360° de tono
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        for (let i = 0; i <= 12; i++) grad.addColorStop(i / 12, `hsl(${i * 30},92%,56%)`);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, W, H, R);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // thumb circular con sombra y color del tono seleccionado
        const tx = Math.max(R, Math.min(W - R, (h1 / 360) * W));
        const ty = H / 2;
        const tr = H * 0.82;

        // sombra del thumb
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur  = 6;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();

        // relleno interior con el color del tono
        ctx.beginPath();
        ctx.arc(tx, ty, tr - 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${h1},100%,55%)`;
        ctx.fill();
    }

    // calcula el tono (0-360) a partir de la posición del puntero sobre el canvas
    function hueFromEvent(e) {
        const rect = canvas.getBoundingClientRect();
        const cx   = e.touches ? e.touches[0].clientX : e.clientX;
        const x    = Math.max(0, Math.min(cx - rect.left, rect.width));
        return (x / rect.width) * 360;
    }

    let rafPending = false;
    // agrupa las llamadas a onChange en un requestanimationframe para evitar recalcs continuos
    function scheduleApply() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => { rafPending = false; onChange(h1, offset); });
    }

    canvas.addEventListener('mousedown', e => {
        dragging = true; window._colorDragging = true;
        h1 = hueFromEvent(e); draw(); onChange(h1, offset);
    });
    canvas.addEventListener('touchstart', e => {
        e.preventDefault(); dragging = true; window._colorDragging = true;
        h1 = hueFromEvent(e); draw(); onChange(h1, offset);
    }, { passive: false });
    window.addEventListener('mousemove', e => {
        if (!dragging) return; h1 = hueFromEvent(e); draw(); scheduleApply();
    });
    window.addEventListener('touchmove', e => {
        if (!dragging) return; e.preventDefault(); h1 = hueFromEvent(e); draw(); scheduleApply();
    }, { passive: false });
    window.addEventListener('mouseup',  () => { dragging = false; window._colorDragging = false; });
    window.addEventListener('touchend', () => { dragging = false; window._colorDragging = false; });

    syncSize();
    draw();

    return {
        update(newH1, newOffset) { h1 = newH1; offset = newOffset; syncSize(); draw(); }
    };
}

// inicializa el panel de personalización visual (studio): presets, fondo y selector de tema
function initStudio() {
    const wrap      = document.getElementById('studioWrap');
    const fab       = document.getElementById('studioFab');
    const panel     = document.getElementById('studioPanel');
    const bgGrid    = document.getElementById('studioBgGrid');
    const presetsEl = document.getElementById('studioPresets');
    const stripCv   = document.getElementById('studioHueStrip');
    if (!wrap || !fab || !bgGrid || !presetsEl || !stripCv) return;

    // restaura el preset y los tonos guardados en localstorage
    let savedId = localStorage.getItem('portfolioPreset') || 'cyber';
    let savedH1 = parseFloat(localStorage.getItem('portfolioH1') || '195');
    let savedH2 = parseFloat(localStorage.getItem('portfolioH2') || '262');
    let activePreset = COLOR_PRESETS.find(p => p.id === savedId) || COLOR_PRESETS[0];
    let hueOffset = savedH2 - savedH1; // separación entre los dos tonos del degradado
    applyHueColors(savedH1, savedH2);

    // franja de tono: al arrastrar actualiza los colores y deselecciona el preset si se aleja
    const strip = createHueStrip(stripCv, savedH1, hueOffset, (newH1, offset) => {
        const newH2 = newH1 + offset;
        applyHueColors(newH1, newH2);
        // deselecciona el preset si el tono se aleja de su valor
        presetsEl.querySelectorAll('.studio-preset-btn').forEach(b => {
            const match = Math.abs(parseFloat(b.dataset.h1) - newH1) < 6;
            b.classList.toggle('active', match);
        });
    });

    // crea un botón por cada preset de color y lo conecta con applyHueColors
    COLOR_PRESETS.forEach(p => {
        const btn  = document.createElement('button');
        btn.type   = 'button';
        btn.className   = 'studio-preset-btn' + (p.id === activePreset.id ? ' active' : '');
        btn.dataset.h1  = p.h1;
        btn.dataset.id  = p.id;
        btn.dataset.name = p.name;
        btn.title = p.name;
        btn.style.background = `linear-gradient(135deg,hsl(${p.h1},92%,56%) 0%,hsl(${p.h2},88%,60%) 100%)`;
        btn.addEventListener('click', e => {
            e.stopPropagation();
            hueOffset = p.h2 - p.h1;
            applyHueColors(p.h1, p.h2);
            localStorage.setItem('portfolioPreset', p.id);
            strip.update(p.h1, hueOffset);
            presetsEl.querySelectorAll('.studio-preset-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.id === p.id));
        });
        presetsEl.appendChild(btn);
    });

    // crea un botón por cada tema de fondo; marca con punto el tema automático del día
    const todayAuto = new Date().getDay();
    HERO_THEMES.forEach(theme => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'studio-bg-btn' + (_bgTheme === theme.id ? ' active' : '');
        btn.dataset.bgId = theme.id;
        const dot = theme.id === todayAuto ? '<span class="studio-today-dot" title="Hoy"></span>' : '';
        btn.innerHTML = `<i class="fa-solid ${theme.icon}"></i>${theme.es}${dot}`;
        btn.addEventListener('click', e => {
            e.stopPropagation();
            setBgTheme(theme.id);
            bgGrid.querySelectorAll('.studio-bg-btn').forEach(b =>
                b.classList.toggle('active', parseInt(b.dataset.bgId) === _bgTheme));
        });
        bgGrid.appendChild(btn);
    });

    // abre/cierra el panel al clicar el botón flotante
    fab.addEventListener('click', e => {
        e.stopPropagation();
        const open = wrap.classList.toggle('open');
        fab.setAttribute('aria-expanded', open);
        if (open) strip.update(parseFloat(localStorage.getItem('portfolioH1') || '195'), hueOffset);
    });
    document.addEventListener('click', e => {
        if (!wrap.contains(e.target)) {
            wrap.classList.remove('open');
            fab.setAttribute('aria-expanded', 'false');
        }
    });
    panel.addEventListener('click', e => e.stopPropagation());

    // selector de tema visual (default, retro, gamer)
    const themeGrid = document.getElementById('studioThemeGrid');
    if (themeGrid) {
        const STYLE_THEMES = [
            { id: null,    label: 'Default', icon: 'fa-wand-magic-sparkles', defaultBg: null },
            { id: 'retro', label: 'Retro',   icon: 'fa-terminal',            defaultBg: 1    },
            { id: 'gamer', label: 'Gamer',   icon: 'fa-gamepad',             defaultBg: 7    },
        ];
        const currentStyle = document.documentElement.getAttribute('data-style-theme') || null;
        STYLE_THEMES.forEach(t => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'studio-bg-btn' + (currentStyle === t.id ? ' active' : '');
            btn.dataset.styleId = t.id || '';
            btn.innerHTML = `<i class="fa-solid ${t.icon}"></i>${t.label}`;
            btn.addEventListener('click', e => {
                e.stopPropagation();
                // aplica el tema dentro de una view transition para un cambio animado
                const applyTheme = () => {
                    if (t.id) {
                        document.documentElement.setAttribute('data-style-theme', t.id);
                        localStorage.setItem('portfolioStyleTheme', t.id);
                                // fuerza el fondo propio del tema al activarlo
                        if (t.defaultBg !== null && t.defaultBg !== undefined) {
                            setBgTheme(t.defaultBg);
                            bgGrid.querySelectorAll('.studio-bg-btn').forEach(b =>
                                b.classList.toggle('active', parseInt(b.dataset.bgId) === t.defaultBg));
                        }
                    } else {
                        document.documentElement.removeAttribute('data-style-theme');
                        localStorage.removeItem('portfolioStyleTheme');
                        // al volver al default, pone el fondo del día
                        const todayBg = new Date().getDay();
                        setBgTheme(todayBg);
                        bgGrid.querySelectorAll('.studio-bg-btn').forEach(b =>
                            b.classList.toggle('active', parseInt(b.dataset.bgId) === todayBg));
                    }
                    themeGrid.querySelectorAll('.studio-bg-btn').forEach(b =>
                        b.classList.toggle('active', b.dataset.styleId === (t.id || '')));
                };
                if (document.startViewTransition) {
                    document.documentElement.dataset.vtTheme = '1';
                    const vt = document.startViewTransition(applyTheme);
                    vt.finished.finally(() => delete document.documentElement.dataset.vtTheme);
                } else {
                    applyTheme();
                }
            });
            themeGrid.appendChild(btn);
        });
    }

    window._bgUpdateLabel = () => {};
}
initStudio();

// navegación entre secciones: scroll suave, activación del enlace activo y botones prev/next
const sections = document.querySelectorAll('section[id], footer[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const hashAnchors = document.querySelectorAll('a[href^="#"]');
// marca como activo el enlace de navegación que apunta al id dado
function setActiveNav(targetId) {
    navAnchors.forEach((anchor) => {
        anchor.classList.toggle('active', anchor.getAttribute('href') === `#${targetId}`);
    });
}
// devuelve la altura del navbar más un margen de 16px
function getNavOffset() {
    return (navbar?.offsetHeight || 0) + 16;
}
// devuelve el elemento de contenido principal de una sección para calcular su posición
function getSectionContent(section) {
    return section.querySelector('.about-grid, .music-grid, .legacy-shell, .projects-grid, .contact-grid, .container') || section;
}
// calcula el scrollTop óptimo para centrar visualmente el contenido de la sección
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
// hace scroll hasta la sección con view transition si está disponible
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
// intercepta los clics en anclas hash para usar el scroll suave personalizado
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
// observa las secciones y actualiza el enlace activo del navbar al entrar en pantalla
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        setActiveNav(id === 'footer' ? 'contacto' : id);
    });
}, { threshold: 0.45 });
sections.forEach((section) => sectionObserver.observe(section));
// botones prev/next para navegar entre secciones
const orderedSections = Array.from(document.querySelectorAll('section[id]'));
const sectionPrev = document.getElementById('sectionPrev');
const sectionNext = document.getElementById('sectionNext');
// devuelve el índice de la sección más cercana al punto de pivote actual
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
// hace scroll a la sección del índice dado
function scrollToSection(index) {
    scrollToSectionElement(orderedSections[index]);
}
// actualiza el estado disabled de los botones prev/next según la sección actual
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
// lista de canciones del reproductor con título y nombre de archivo
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
// inicializa el reproductor de música: controles, lista, barra de progreso y compartir
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
    // devuelve la clase del icono de volumen según el nivel
    function volIconCls(v) {
        return v < 0.01 ? 'fa-solid fa-volume-xmark' : v < 0.5 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
    }
    // formatea segundos como m:ss
    function fmt(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }
    let trackFilter = '';
    // renderiza la lista de canciones filtrada por el texto de búsqueda
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
            div.addEventListener('click', () => { if (window._ensureAudioCtx) window._ensureAudioCtx(); loadTrack(i, true); });
            trackList.appendChild(div);
        });
    }
    // carga la canción del índice dado y la reproduce si autoplay es true
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
        updateMediaSession(t);
        if (autoplay) {
            audio.play().then(() => {
                playIcon.className = 'fa-solid fa-pause';
            }).catch(() => {});
        } else {
            playIcon.className = 'fa-solid fa-play';
        }
    }
    // actualiza los metadatos que ve android en la pantalla de bloqueo
    function updateMediaSession(t) {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: t.title,
            artist: 'Danielux',
            album: 'Danielux',
            artwork: [
                { src: 'assets/borrowed-colors.webp', sizes: '600x600', type: 'image/webp' }
            ]
        });
    }
    // registra los controles de siguiente/anterior/play/pausa para la pantalla de bloqueo
    function setupMediaSession() {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.setActionHandler('play', () => {
            if (window._ensureAudioCtx) window._ensureAudioCtx();
            audio.play().catch(() => {});
        });
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            loadTrack((currentIdx - 1 + TRACKS.length) % TRACKS.length, true);
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            loadTrack((currentIdx + 1) % TRACKS.length, true);
        });
    }
    setupMediaSession();
    audio.addEventListener('play',  () => { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; });
    audio.addEventListener('pause', () => { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; });
    playBtn.addEventListener('click', () => {
        if (window._ensureAudioCtx) window._ensureAudioCtx();
        if (audio.paused) {
            if (!audio.src || audio.src === window.location.href) loadTrack(currentIdx, true);
            else audio.play().then(() => { playIcon.className = 'fa-solid fa-pause'; }).catch(() => {});
        } else {
            audio.pause();
            playIcon.className = 'fa-solid fa-play';
        }
    });
    prevBtn.addEventListener('click', () => {
        if (window._ensureAudioCtx) window._ensureAudioCtx();
        loadTrack((currentIdx - 1 + TRACKS.length) % TRACKS.length, !audio.paused);
    });
    nextBtn.addEventListener('click', () => {
        if (window._ensureAudioCtx) window._ensureAudioCtx();
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
        if (window._setAudioVolume) window._setAudioVolume(audio.volume);
        volBar.style.setProperty('--vol', volBar.value + '%');
        muteBtn.querySelector('i').className = volIconCls(audio.volume);
        const npbVol = document.getElementById('npbVol');
        if (npbVol) { npbVol.value = volBar.value; npbVol.style.setProperty('--vol', volBar.value + '%'); }
        const npbVolIcon = document.getElementById('npbVolIcon');
        if (npbVolIcon) npbVolIcon.className = volIconCls(audio.volume) + ' npb-vol-icon';
    });
    muteBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        if (window._setAudioVolume) window._setAudioVolume(audio.muted ? 0 : audio.volume);
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
    // muestra un toast de confirmación al compartir un enlace
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
    // si viene el parámetro ?track= en la url, carga esa canción directamente
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
    // inicializa el visualizador de frecuencias del reproductor
    (function initVisualizer() {
        const canvas = document.getElementById('visualizerCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let audioCtx, analyser, source, gainNode, animId;
        let connected = false;
        // crea el audiocontext y conecta la cadena source -> gain -> analyser -> destino
        // la cadena se crea una sola vez, pero el resume se intenta siempre (iOS suspende el contexto)
        function ensureAudioCtx() {
            if (!connected) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                analyser.smoothingTimeConstant = 0.05;
                // nodo de ganancia: iOS ignora audio.volume en <audio>, así que el volumen se controla aquí
                gainNode = audioCtx.createGain();
                gainNode.gain.value = audio.muted ? 0 : audio.volume;
                source = audioCtx.createMediaElementSource(audio);
                source.connect(gainNode);
                gainNode.connect(analyser);
                analyser.connect(audioCtx.destination);
                connected = true;
                window._audioAnalyser = analyser;
            }
            // siempre reanudar si está suspendido: en iOS hay que hacerlo dentro del gesto del usuario
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        }
        // permite llamar a ensureAudioCtx desde el click del botón (gesto de usuario en iOS)
        window._ensureAudioCtx = ensureAudioCtx;
        // aplica el volumen al nodo de ganancia (necesario en iOS donde audio.volume no tiene efecto)
        window._setAudioVolume = function (v) {
            if (gainNode) gainNode.gain.value = v;
        };
        // dibuja un frame del visualizador de barras con gradiente reactivo al beat
        function draw() {
            animId = requestAnimationFrame(draw);
            // con el arcade abierto este canvas no se ve: se omite para no gastar cpu
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
            // colores de la paleta reactiva global, que viran de tono con el beat
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
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
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
    // barra de reproducción en curso fija en la parte inferior
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
            if (window._setAudioVolume) window._setAudioVolume(audio.volume);
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
            if (window._setAudioVolume) window._setAudioVolume(audio.muted ? 0 : audio.volume);
            updateVolIcon();
        });
        npbPlay.addEventListener('click', () => {
            if (window._ensureAudioCtx) window._ensureAudioCtx();
            if (audio.paused) audio.play().catch(() => {});
            else audio.pause();
        });
        npbPrev.addEventListener('click', () => {
            if (window._ensureAudioCtx) window._ensureAudioCtx();
            loadTrack((currentIdx - 1 + TRACKS.length) % TRACKS.length, !audio.paused);
            syncTitle();
        });
        npbNext.addEventListener('click', () => {
            if (window._ensureAudioCtx) window._ensureAudioCtx();
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
// anima los contadores de estadísticas al entrar en pantalla
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
// shuffle FAB: reproduce una canción aleatoria al pulsar
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
// paleta de comandos: búsqueda rápida de secciones, canciones y acciones
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
// chat con IA: envía mensajes al endpoint de vercel y muestra la respuesta
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