// registro de apps — cada app define su propio contenido para las ventanas del OS
// app especial para el reproductor (no tiene sección en el portfolio)
export const MUSIC_PLAYER_APP = {
    id: 'music-player',
    icon: 'fa-sliders',
    title: { es: 'Reproductor', en: 'Player', val: 'Reproductor' },
    section: null,
    width: 400, height: 520,
    desc: { es: 'Reproductor de música estilo XP', en: 'XP-style music player', val: 'Reproductor de música estil XP' },
};

export const APP_REGISTRY = [
    {
        id: 'about',
        icon: 'fa-user',
        title: { es: 'Sobre mí',  en: 'About',    val: 'Sobre mi'   },
        section: '#sobre-mi',
        width: 580, height: 440,
        desc: { es: 'Developer · Músico · Creator', en: 'Developer · Musician · Creator', val: 'Developer · Músic · Creator' },
    },
    {
        id: 'music',
        icon: 'fa-music',
        title: { es: 'Música',    en: 'Music',     val: 'Música'     },
        section: '#musica',
        width: 620, height: 460,
        desc: { es: 'Proyectos musicales y player interactivo', en: 'Music projects & interactive player', val: 'Projectes musicals i player interactiu' },
    },
    {
        id: 'legacy',
        icon: 'fa-crown',
        title: { es: 'Legado',    en: 'Legacy',    val: 'Llegat'     },
        section: '#legado',
        width: 600, height: 440,
        desc: { es: 'Trayectoria y logros a lo largo del tiempo', en: 'Career timeline and achievements', val: 'Trajectòria i assoliments al llarg del temps' },
    },
    {
        id: 'projects',
        icon: 'fa-folder-open',
        title: { es: 'Proyectos', en: 'Projects',  val: 'Projectes'  },
        section: '#proyectos',
        width: 700, height: 520,
        desc: { es: 'Código, herramientas y proyectos open source', en: 'Code, tools and open-source projects', val: 'Codi, eines i projectes open source' },
    },
    {
        id: 'webs',
        icon: 'fa-sitemap',
        title: { es: 'Webs',      en: 'Webs',      val: 'Webs'       },
        section: '#webs',
        width: 660, height: 480,
        desc: { es: 'Demos de webs y aplicaciones creadas', en: 'Web demos and created applications', val: 'Demos de webs i aplicacions creades' },
    },
    {
        id: 'arcade',
        icon: 'fa-gamepad',
        title: { es: 'Minijuegos', en: 'Mini-games', val: 'Minijocs' },
        section: '#arcade',
        width: 700, height: 540,
        desc: { es: '8 juegos musicales sincronizados en tiempo real', en: '8 real-time music mini-games', val: '8 jocs musicals sincronitzats en temps real' },
    },
    {
        id: 'contact',
        icon: 'fa-envelope',
        title: { es: 'Contacto',  en: 'Contact',   val: 'Contacte'   },
        section: '#contacto',
        width: 500, height: 380,
        desc: { es: 'Disponible para proyectos y colaboraciones', en: 'Available for projects and collaborations', val: 'Disponible per a projectes i col·laboracions' },
    },
];

export function getApp(id) {
    if (id === 'music-player') return MUSIC_PLAYER_APP;
    return APP_REGISTRY.find(a => a.id === id) ?? null;
}

export function getAppTitle(app, lang = 'es') {
    return app.title[lang] ?? app.title.es;
}

export function getAppDesc(app, lang = 'es') {
    return app.desc?.[lang] ?? app.desc?.es ?? '';
}
