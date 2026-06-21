export function studioT(key, lang, translationsObj) {
    return key.split('.').reduce((v, p) => v?.[p], translationsObj[lang]?.studio) || key;
}

export const translations = {
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
            webs: 'Webs',
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
            searchPlaceholder: 'Buscar canción…',
            searchClear: 'Limpiar búsqueda',
            coverAlt: 'Portada de la canción',
            coverAltTrack: 'Portada de',
            coverDownload: 'Descargar portada original',
            coverFile: 'portada',
            shuffle: 'Aleatoria',
            previous: 'Anterior',
            playPause: 'Reproducir / Pausar',
            next: 'Siguiente',
            close: 'Cerrar reproductor',
            stageMode: 'Modo escenario',
            stageClose: 'Cerrar modo escenario',
            stageProgress: 'Progreso de la canción',
            volume: 'Volumen',
            stageOpen: 'Abrir modo escenario',
            linkCopied: '¡Enlace copiado!',
            linkError: 'No se pudo copiar',
            noResults: 'Sin resultados'
        },
        games: {
            open: 'Minijuegos',
            promoBadge: '7 minijuegos',
            promoLine1: '¡Prueba mis',
            promoLine2: 'minijuegos musicales!',
            promoSub: 'Generados en tiempo real con los golpes de cada canción. Sin descargas, sin registro.',
            promoBtn: 'Jugar ahora'
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
            portfolio: {
                tag: 'Portfolio · Web · Open Source',
                title: 'Este portfolio',
                desc: 'Web fullstack 100% propia: multiidioma (ES/EN/VAL), 18 temas visuales reactivos al beat de la música, juego arcade integrado, asistente IA conversacional con contexto real, OG dinámico, modo claro/oscuro y zero dependencias de framework.',
                link: 'Ver en vivo'
            },
            pulso: {
                tag: 'Blog · IA · Automatización',
                title: 'FoskIA',
                desc: 'Boletín de noticias trilingüe que se escribe y publica solo cada madrugada: un agente IA resume el día, genera la edición en tres idiomas y la despliega automáticamente sin intervención humana.',
                link: 'Leer FoskIA'
            },
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
        webs: {
            title: 'Ejemplos de mis webs',
            desc: 'Webs de demostración diseñadas y maquetadas por mí. Cada una con su propia identidad visual, responsive y con interacciones reales.',
            view: 'Ver demo',
            restaurant: { tag: 'Restaurante · Reservas', desc: 'Web para restaurante con carta interactiva por categorías, galería y formulario de reserva.' },
            shop: { tag: 'E-commerce · Tienda', desc: 'Tienda online de mobiliario con catálogo dinámico, carrito funcional y lista de deseos.' },
            agency: { tag: 'Agencia · Landing', desc: 'Landing de estudio creativo con animaciones al hacer scroll, portfolio y diseño moderno.' },
            meridian: { tag: 'Agencia · Editorial', desc: 'Demo de estudio boutique con identidad visual propia: tipografía serif editorial, imágenes SVG integradas y diseño split-hero de nivel premium.' },
            eclipse: { tag: 'Festival · Evento', desc: 'Web de festival de música inmersiva: cartel interactivo de artistas, constructor de horario personal, mapa del recinto y compra de entradas.' },
            orbit: { tag: 'SaaS · Dashboard', desc: 'Demo de CRM con kanban drag & drop, paleta de comandos, gráficas de ingresos, calendario y panel de señales de IA.' }
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
        },
        studio: {
            cta: '¡Pínchame para personalizarlo todo!',
            ctaMobile: 'Personalizar',
            ctaRetro: '> run personalizar.sh_',
            ctaRetroMobile: 'personalizar',
            ctaGamer: '⚡ ¡Configura tu setup!',
            ctaGamerMobile: 'Setup',
            navWeather: 'Clima',
            navBackground: 'Fondo',
            navColors: 'Colores',
            navThemes: 'Temas',
            navStage: 'Escenario',
            labelWeather: 'Clima',
            labelBackground: 'Fondo',
            labelColors: 'Colores',
            labelTheme: 'Tema visual',
            labelStage: 'Escenario',
            weatherEnable: 'Activar clima real',
            weatherDisable: 'Desactivar clima',
            weatherLoading: 'Obteniendo ubicación...',
            weatherNoLocation: 'No se pudo obtener la ubicación',
            weatherNoData: 'Sin datos',
            weatherError: 'Error al obtener el clima',
            today: 'Hoy',
            weather: {
                none: 'Ninguno',
                clear: 'Despejado',
                partial: 'Parcial',
                cloudy: 'Cubierto',
                fog: 'Niebla',
                drizzle: 'Llovizna',
                rain: 'Lluvia',
                heavy: 'Fuerte',
                snow: 'Nieve',
                hail: 'Granizo',
                storm: 'Tormenta',
                unknown: 'Clima desconocido',
                clearDesc: 'Cielo despejado',
                partialDesc: 'Parcialmente nublado',
                showersDesc: 'Chubascos'
            },
            palette: {
                default: 'Default',
                cyber: 'Cibernético',
                fire: 'Fuego',
                forest: 'Bosque',
                aurora: 'Aurora',
                gold: 'Oro',
                neon: 'Neón',
                amethyst: 'Amatista',
                crimson: 'Carmín',
                yellow: 'Amarillo',
                lime: 'Lima',
                turquoise: 'Turquesa',
                ocean: 'Océano',
                fuchsia: 'Fucsia'
            },
            themes: {
                default: 'Default',
                retro: 'Retro',
                gamer: 'Gamer'
            }
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
            webs: 'Sites',
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
            searchPlaceholder: 'Search song…',
            searchClear: 'Clear search',
            coverAlt: 'Song cover',
            coverAltTrack: 'Cover for',
            coverDownload: 'Download original cover',
            coverFile: 'cover',
            shuffle: 'Shuffle',
            previous: 'Previous',
            playPause: 'Play / Pause',
            next: 'Next',
            close: 'Close player',
            stageMode: 'Stage mode',
            stageClose: 'Close stage mode',
            stageProgress: 'Song progress',
            volume: 'Volume',
            stageOpen: 'Open stage mode',
            linkCopied: 'Link copied!',
            linkError: 'Could not copy',
            noResults: 'No results'
        },
        games: {
            open: 'Mini-games',
            promoBadge: '7 mini-games',
            promoLine1: 'Try my',
            promoLine2: 'music mini-games!',
            promoSub: 'Generated in real time from the beats of each song. No downloads, no sign-up.',
            promoBtn: 'Play now'
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
            portfolio: {
                tag: 'Portfolio · Web · Open Source',
                title: 'This portfolio',
                desc: 'Fully custom fullstack website: multilingual (ES/EN/VAL), 18 visual themes reactive to the music beat, integrated arcade game, conversational AI assistant with real context, dynamic OG, light/dark mode, and zero framework dependencies.',
                link: 'View live'
            },
            pulso: {
                tag: 'Blog · AI · Automation',
                title: 'FoskIA',
                desc: 'Trilingual news bulletin that writes and publishes itself every night: an AI agent summarises the day, generates the edition in three languages, and deploys it automatically without any human input.',
                link: 'Read FoskIA'
            },
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
        webs: {
            title: 'Examples of my websites',
            desc: 'Demo websites designed and built by me. Each one with its own visual identity, fully responsive and with real interactions.',
            view: 'View demo',
            restaurant: { tag: 'Restaurant · Bookings', desc: 'Restaurant website with an interactive menu by category, gallery and a booking form.' },
            shop: { tag: 'E-commerce · Shop', desc: 'Online furniture store with a dynamic catalog, working cart and wishlist.' },
            agency: { tag: 'Agency · Landing', desc: 'Creative studio landing with scroll animations, portfolio and a modern design.' },
            meridian: { tag: 'Agency · Editorial', desc: 'Boutique studio demo with its own visual identity: editorial serif typography, embedded SVG imagery and a premium split-hero layout.' },
            eclipse: { tag: 'Festival · Event', desc: 'Immersive music festival website: interactive artist line-up, personal schedule builder, venue map and ticket purchase.' },
            orbit: { tag: 'SaaS · Dashboard', desc: 'CRM demo featuring drag & drop kanban, command palette, revenue charts, calendar and AI signal panel.' }
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
        },
        studio: {
            cta: 'Click me to customise everything!',
            ctaMobile: 'Customise',
            ctaRetro: '> run customize.sh_',
            ctaRetroMobile: 'customize',
            ctaGamer: '⚡ Configure your setup!',
            ctaGamerMobile: 'Setup',
            navWeather: 'Weather',
            navBackground: 'Background',
            navColors: 'Colors',
            navThemes: 'Themes',
            navStage: 'Stage',
            labelWeather: 'Weather',
            labelBackground: 'Background',
            labelColors: 'Colors',
            labelTheme: 'Visual theme',
            labelStage: 'Stage',
            weatherEnable: 'Enable real weather',
            weatherDisable: 'Disable weather',
            weatherLoading: 'Getting location...',
            weatherNoLocation: 'Could not get location',
            weatherNoData: 'No data',
            weatherError: 'Error getting weather',
            today: 'Today',
            weather: {
                none: 'None',
                clear: 'Clear',
                partial: 'Partial',
                cloudy: 'Cloudy',
                fog: 'Fog',
                drizzle: 'Drizzle',
                rain: 'Rain',
                heavy: 'Heavy',
                snow: 'Snow',
                hail: 'Hail',
                storm: 'Storm',
                unknown: 'Unknown weather',
                clearDesc: 'Clear sky',
                partialDesc: 'Partly cloudy',
                showersDesc: 'Showers'
            },
            palette: {
                default: 'Default',
                cyber: 'Cyber',
                fire: 'Fire',
                forest: 'Forest',
                aurora: 'Aurora',
                gold: 'Gold',
                neon: 'Neon',
                amethyst: 'Amethyst',
                crimson: 'Crimson',
                yellow: 'Yellow',
                lime: 'Lime',
                turquoise: 'Turquoise',
                ocean: 'Ocean',
                fuchsia: 'Fuchsia'
            },
            themes: {
                default: 'Default',
                retro: 'Retro',
                gamer: 'Gamer'
            }
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
            webs: 'Webs',
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
            title: 'Els meus temes',
            searchPlaceholder: 'Buscar cançó…',
            searchClear: 'Netejar cerca',
            coverAlt: 'Portada de la cançó',
            coverAltTrack: 'Portada de',
            coverDownload: 'Descarregar portada original',
            coverFile: 'portada',
            shuffle: 'Aleatòria',
            previous: 'Anterior',
            playPause: 'Reproduir / Pausar',
            next: 'Següent',
            close: 'Tancar reproductor',
            stageMode: 'Mode escenari',
            stageClose: 'Tancar mode escenari',
            stageProgress: 'Progrés de la cançó',
            volume: 'Volum',
            stageOpen: 'Obrir mode escenari',
            linkCopied: 'Enllaç copiat!',
            linkError: 'No s\'ha pogut copiar',
            noResults: 'Sense resultats',
        },
        games: {
            open: 'Minijocs',
            promoBadge: '7 minijocs',
            promoLine1: 'Prova els meus',
            promoLine2: 'minijocs musicals!',
            promoSub: 'Generats en temps real amb els colps de cada cançó. Sense descàrregues, sense registre.',
            promoBtn: 'Jugar ara'
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
            portfolio: {
                tag: 'Portfolio · Web · Open Source',
                title: 'Aquest portfolio',
                desc: "Web fullstack 100% pròpia: multiidioma (ES/EN/VAL), 18 temes visuals reactius al beat de la música, joc arcade integrat, assistent IA conversacional amb context real, OG dinàmic, mode clar/fosc i zero dependències de framework.",
                link: 'Veure en viu'
            },
            pulso: {
                tag: 'Blog · IA · Automatització',
                title: 'FoskIA',
                desc: "Butlletí de notícies trilingüe que s'escriu i es publica sol cada matinada: un agent IA resumix el dia, genera l'edició en tres idiomes i la desplega automàticament sense cap intervenció humana.",
                link: 'Llegir FoskIA'
            },
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
        webs: {
            title: 'Exemples de les meues webs',
            desc: 'Webs de demostració dissenyades i maquetades per mi. Cadascuna amb la seua pròpia identitat visual, responsive i amb interaccions reals.',
            view: 'Veure demo',
            restaurant: { tag: 'Restaurant · Reserves', desc: 'Web per a restaurant amb carta interactiva per categories, galeria i formulari de reserva.' },
            shop: { tag: 'E-commerce · Botiga', desc: 'Botiga online de mobiliari amb catàleg dinàmic, cistella funcional i llista de desitjos.' },
            agency: { tag: 'Agència · Landing', desc: 'Landing d\'estudi creatiu amb animacions en fer scroll, portfolio i disseny modern.' },
            meridian: { tag: 'Agència · Editorial', desc: 'Demo d\'estudi boutique amb identitat visual pròpia: tipografia serif editorial, imatges SVG integrades i disseny split-hero de nivell premium.' },
            eclipse: { tag: 'Festival · Esdeveniment', desc: 'Web de festival de música immersiva: cartell interactiu d\'artistes, constructor d\'horari personal, mapa del recinte i compra d\'entrades.' },
            orbit: { tag: 'SaaS · Tauler', desc: 'Demo de CRM amb kanban drag & drop, paleta d\'ordres, gràfiques d\'ingressos, calendari i panell de senyals d\'IA.' }
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
        },
        studio: {
            cta: 'Clica\'m per personalitzar-ho tot!',
            ctaMobile: 'Personalitzar',
            ctaRetro: '> run personalitzar.sh_',
            ctaRetroMobile: 'personalitzar',
            ctaGamer: '⚡ Configura el teu setup!',
            ctaGamerMobile: 'Setup',
            navWeather: 'Clima',
            navBackground: 'Fons',
            navColors: 'Colors',
            navThemes: 'Temes',
            navStage: 'Escenari',
            labelWeather: 'Clima',
            labelBackground: 'Fons',
            labelColors: 'Colors',
            labelTheme: 'Tema visual',
            labelStage: 'Escenari',
            weatherEnable: 'Activar clima real',
            weatherDisable: 'Desactivar clima',
            weatherLoading: 'Obtenint ubicació...',
            weatherNoLocation: 'No s\'ha pogut obtindre la ubicació',
            weatherNoData: 'Sense dades',
            weatherError: 'Error en obtindre el clima',
            today: 'Hui',
            weather: {
                none: 'Cap',
                clear: 'Clar',
                partial: 'Parcial',
                cloudy: 'Cobert',
                fog: 'Boira',
                drizzle: 'Plugim',
                rain: 'Pluja',
                heavy: 'Forta',
                snow: 'Neu',
                hail: 'Granís',
                storm: 'Tempesta',
                unknown: 'Clima desconegut',
                clearDesc: 'Cel clar',
                partialDesc: 'Parcialment núvol',
                showersDesc: 'Ruixats'
            },
            palette: {
                default: 'Default',
                cyber: 'Cibernètic',
                fire: 'Foc',
                forest: 'Bosc',
                aurora: 'Aurora',
                gold: 'Or',
                neon: 'Neó',
                amethyst: 'Ametista',
                crimson: 'Carmesí',
                yellow: 'Groc',
                lime: 'Llima',
                turquoise: 'Turquesa',
                ocean: 'Oceà',
                fuchsia: 'Fúcsia'
            },
            themes: {
                default: 'Default',
                retro: 'Retro',
                gamer: 'Gamer'
            }
        }
    }
};
