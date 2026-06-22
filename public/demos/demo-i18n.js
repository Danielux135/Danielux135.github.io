(() => {
  const LKEY = 'daniel-demo-language';
  const langs = ['es', 'en', 'val'];
  const normalizeLang = (lang) => lang === 'ca' || lang === 'val' ? 'val' : (lang === 'en' ? 'en' : 'es');
  const t = (es, en, val = es) => ({ es, en, val });
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  const DEMO_META = {
    restaurante: {
      accent: '#e7b05f', accent2: '#ff8a3d', logo: 'Sabor<span>&amp;</span>Brasa', name: 'Sabor & Brasa',
      tagline: t('Cocina de brasa y producto de temporada en el corazón de la ciudad. Una experiencia para repetir.', 'Wood-fire cooking and seasonal produce in the heart of the city. An experience worth repeating.', 'Cuina de brasa i producte de temporada al cor de la ciutat. Una experiència per repetir.'),
      columns: [
        { title: t('Horario', 'Opening hours', 'Horari'), items: [t('Mar–Jue · 13:00–16:00', 'Tue–Thu · 13:00–16:00', 'Dim–Dij · 13:00–16:00'), t('Vie–Sáb · 13:00–24:00', 'Fri–Sat · 13:00–24:00', 'Div–Dis · 13:00–24:00'), t('Domingo · 13:00–17:00', 'Sunday · 13:00–17:00', 'Diumenge · 13:00–17:00'), t('Lunes · Cerrado', 'Monday · Closed', 'Dilluns · Tancat')] },
        { title: t('Contacto', 'Contact', 'Contacte'), items: ['C/ del Fuego, 12', '961 000 000', 'hola@saborbrasa.es'] }
      ], socials: ['instagram','facebook-f','whatsapp']
    },
    tienda: {
      accent: '#9dd9d2', accent2: '#e9d8a6', logo: '<i class="fa-solid fa-leaf"></i> Nórdica', name: 'Nórdica',
      tagline: t('Mobiliario y decoración de diseño escandinavo. Calidez nórdica para tu hogar.', 'Scandinavian furniture and decor. Nordic warmth for your home.', 'Mobiliari i decoració de disseny escandinau. Calidesa nòrdica per a la teua llar.'),
      columns: [
        { title: t('Tienda', 'Shop', 'Botiga'), items: [t('Salón', 'Living room', 'Saló'), t('Dormitorio', 'Bedroom', 'Dormitori'), t('Decoración', 'Decor', 'Decoració'), t('Ofertas', 'Offers', 'Ofertes')] },
        { title: t('Ayuda', 'Help', 'Ajuda'), items: [t('Envíos', 'Shipping', 'Enviaments'), t('Devoluciones', 'Returns', 'Devolucions'), t('Seguimiento', 'Tracking', 'Seguiment'), t('Contacto', 'Contact', 'Contacte')] }
      ], socials: ['instagram','pinterest','tiktok']
    },
    agencia: {
      accent: '#a78bfa', accent2: '#76f7ff', logo: 'FORMA Studio', name: 'FORMA Studio',
      tagline: t('Estudio creativo para marcas, experiencias digitales y sistemas visuales con intención.', 'Creative studio for brands, digital experiences and intentional visual systems.', 'Estudi creatiu per a marques, experiències digitals i sistemes visuals amb intenció.'),
      columns: [
        { title: t('Servicios', 'Services', 'Serveis'), items: [t('Identidad de marca', 'Brand identity', 'Identitat de marca'), t('Diseño web', 'Web design', 'Disseny web'), t('Motion & Video', 'Motion & video', 'Motion i vídeo'), t('Diseño editorial', 'Editorial design', 'Disseny editorial')] },
        { title: t('Contacto', 'Contact', 'Contacte'), items: ['hola@formaestudio.com', '+34 600 000 000', t('Madrid · Barcelona · Remoto', 'Madrid · Barcelona · Remote', 'Madrid · Barcelona · Remot')] }
      ], socials: ['instagram','behance','linkedin-in']
    },
    meridian: {
      accent: '#d8c7aa', accent2: '#94c7d8', logo: 'Meridian', name: 'Meridian Studio',
      tagline: t('Estudio boutique para marcas digitales con elegancia, dirección artística y sensibilidad premium.', 'Boutique studio for digital brands with elegance, art direction and premium sensitivity.', 'Estudi boutique per a marques digitals amb elegància, direcció artística i sensibilitat premium.'),
      columns: [
        { title: t('Estudio', 'Studio', 'Estudi'), items: [t('Trabajo seleccionado', 'Selected work', 'Treball seleccionat'), t('Servicios', 'Services', 'Serveis'), t('Contacto', 'Contact', 'Contacte')] },
        { title: t('Contacto', 'Contact', 'Contacte'), items: ['hello@meridian.studio', 'London', t('Remoto internacional', 'International remote', 'Remot internacional')] }
      ], socials: ['instagram','linkedin-in','dribbble']
    },
    eclipse: {
      accent: '#76f7ff', accent2: '#ff4fd8', logo: 'Eclipse', name: 'Eclipse Festival',
      tagline: t('Festival inmersivo con cartel, ruta personal, tickets y pequeños detalles que hacen que una landing parezca un mundo.', 'Immersive festival with line-up, personal route, tickets and tiny details that make a landing feel like a world.', 'Festival immersiu amb cartell, ruta personal, entrades i xicotets detalls que fan que una landing parega un món.'),
      columns: [
        { title: t('Festival', 'Festival', 'Festival'), items: [t('Cartel', 'Line-up', 'Cartell'), t('Horario', 'Schedule', 'Horari'), t('Mapa', 'Map', 'Mapa'), t('Entradas', 'Tickets', 'Entrades')] },
        { title: t('Experiencia', 'Experience', 'Experiència'), items: [t('Ruta guardada', 'Saved route', 'Ruta guardada'), t('Muro de recuerdos', 'Memory wall', 'Mur de records'), t('Audio reactivo', 'Reactive audio', 'Àudio reactiu')] }
      ], socials: ['instagram','tiktok','spotify']
    },
    orbit: {
      accent: '#76f7ff', accent2: '#8f63ff', logo: 'Orbit', name: 'Orbit CRM',
      tagline: t('Dashboard SaaS con métricas, pipeline, tareas y señales inteligentes para gestionar clientes.', 'SaaS dashboard with metrics, pipeline, tasks and smart signals for client management.', 'Tauler SaaS amb mètriques, pipeline, tasques i senyals intel·ligents per gestionar clients.'),
      columns: [
        { title: t('Producto', 'Product', 'Producte'), items: [t('Resumen', 'Overview', 'Resum'), t('Clientes', 'Clients', 'Clients'), t('Pipeline', 'Pipeline', 'Pipeline'), t('Calendario', 'Calendar', 'Calendari')] },
        { title: t('Demo', 'Demo', 'Demo'), items: [t('Kanban local', 'Local kanban', 'Kanban local'), t('Paleta de comandos', 'Command palette', 'Paleta d’ordres'), t('Tema editable', 'Editable theme', 'Tema editable')] }
      ], socials: ['github','linkedin-in','chart-line']
    }
  };

  const DICTS = {
    common: [
      t('Demo de portfolio por', 'Portfolio demo by', 'Demo de portfolio per'),
      t('Demo from', 'Demo from', 'Demo de'),
      t('Daniel Bort', 'Daniel Bort', 'Daniel Bort'),
      t('Daniel Bort Guzmán', 'Daniel Bort Guzmán', 'Daniel Bort Guzmán'),
      t('Abrir demo', 'Open demo', 'Obrir demo'),
      t('Contacto', 'Contact', 'Contacte'),
      t('Servicios', 'Services', 'Serveis'),
      t('Proyectos', 'Projects', 'Projectes'),
      t('Trabajo', 'Work', 'Treball'),
      t('Todo', 'All', 'Tot'),
      t('Nombre', 'Name', 'Nom'),
      t('Email', 'Email', 'Email'),
      t('Enviar mensaje →', 'Send message →', 'Enviar missatge →'),
      t('Selecciona...', 'Select...', 'Selecciona...'),
      t('×', '×', '×'),
      t('0', '0', '0'),
      t('+', '+', '+'),
      t('→', '→', '→')
    ],
    restaurante: [
      t('Sabor & Brasa · Cocina de fuego', 'Sabor & Brasa · Fire cooking', 'Sabor & Brasa · Cuina de foc'),
      t('Nosotros', 'About', 'Nosaltres'), t('Carta', 'Menu', 'Carta'), t('Galería', 'Gallery', 'Galeria'), t('Reservar', 'Book', 'Reservar'), t('Reservar mesa', 'Book a table', 'Reservar taula'),
      t('Cocina de fuego · Desde 1998', 'Fire cooking · Since 1998', 'Cuina de foc · Des de 1998'),
      t('El sabor que nace de la', 'Flavour born from the', 'El sabor que naix de la'), t('brasa', 'embers', 'brasa'),
      t('Producto de temporada, fuego de encina y una carta de autor que cambia con cada estación. Una experiencia para los sentidos en el corazón de la ciudad.', 'Seasonal produce, oak embers and a signature menu that changes with every season. A sensory experience in the heart of the city.', 'Producte de temporada, foc d’alzina i una carta d’autor que canvia amb cada estació. Una experiència per als sentits al cor de la ciutat.'),
      t('Ver la carta', 'View menu', 'Veure la carta'), t('Años de oficio', 'Years of craft', 'Anys d’ofici'), t('Google · 1.2k reseñas', 'Google · 1.2k reviews', 'Google · 1.2k ressenyes'), t('Mejor brasa local', 'Best local grill', 'Millor brasa local'), t('años de fuego', 'years of fire', 'anys de foc'),
      t('Nuestra historia', 'Our story', 'La nostra història'), t('Tradición a fuego lento, alma de barrio', 'Slow-fire tradition, neighbourhood soul', 'Tradició a foc lent, ànima de barri'),
      t('Cada plato es una conversación entre la técnica y la memoria. Sin atajos, sin prisa.', 'Every dish is a conversation between technique and memory. No shortcuts, no rush.', 'Cada plat és una conversa entre la tècnica i la memòria. Sense dreceres, sense pressa.'),
      t('Km 0', 'Local', 'Km 0'), t('Producto local de temporada', 'Local seasonal produce', 'Producte local de temporada'), t('Brasa de encina', 'Oak embers', 'Brasa d’alzina'), t('Sabor ahumado real', 'Real smoky flavour', 'Sabor fumat real'), t('Bodega propia', 'Own cellar', 'Celler propi'), t('+120 referencias', '+120 references', '+120 referències'),
      t('Nuestra carta', 'Our menu', 'La nostra carta'), t('Una selección para compartir', 'A selection to share', 'Una selecció per compartir'), t('Carta de temporada. Pregunta a nuestro equipo por las sugerencias del día.', 'Seasonal menu. Ask our team about today’s suggestions.', 'Carta de temporada. Pregunta al nostre equip pels suggeriments del dia.'),
      t('Entrantes', 'Starters', 'Entrants'), t('A la brasa', 'From the grill', 'A la brasa'), t('Postres', 'Desserts', 'Postres'),
      t('El ambiente', 'The atmosphere', 'L’ambient'), t('Un espacio para disfrutar', 'A space to enjoy', 'Un espai per gaudir'), t('Reserva', 'Booking', 'Reserva'), t('Reserva tu mesa', 'Book your table', 'Reserva la teua taula'), t('Te confirmaremos por email en menos de 24 horas.', 'We will confirm by email in under 24 hours.', 'T’ho confirmarem per email en menys de 24 hores.'),
      t('Teléfono', 'Phone', 'Telèfon'), t('Fecha', 'Date', 'Data'), t('Hora', 'Time', 'Hora'), t('Comensales', 'Guests', 'Comensals'), t('1 persona', '1 person', '1 persona'), t('2 personas', '2 people', '2 persones'), t('3 personas', '3 people', '3 persones'), t('4 personas', '4 people', '4 persones'), t('5+ personas', '5+ people', '5+ persones'), t('Confirmar reserva', 'Confirm booking', 'Confirmar reserva'), t('¡Gracias! Hemos recibido tu solicitud de reserva.', 'Thank you! We have received your booking request.', 'Gràcies! Hem rebut la teua sol·licitud de reserva.')
    ],
    tienda: [
      t('Nórdica · Mobiliario y decoración', 'Nórdica · Furniture and decor', 'Nòrdica · Mobiliari i decoració'), t('Envío', 'Shipping', 'Enviament'), t('gratis', 'free', 'gratuït'), t('en pedidos superiores a 60€ · Devoluciones en 30 días', 'on orders over €60 · 30-day returns', 'en comandes superiors a 60€ · Devolucions en 30 dies'),
      t('Categorías', 'Categories', 'Categories'), t('Tienda', 'Shop', 'Botiga'), t('Ofertas', 'Offers', 'Ofertes'), t('Novedades', 'New arrivals', 'Novetats'), t('Diseño escandinavo', 'Scandinavian design', 'Disseny escandinau'), t('Piezas que hacen', 'Pieces that make a', 'Peces que fan'), t('hogar', 'home', 'llar'),
      t('Mobiliario y decoración atemporal, hecho para durar. Materiales naturales, líneas limpias y calidez nórdica para cada rincón.', 'Timeless furniture and decor, made to last. Natural materials, clean lines and Nordic warmth for every corner.', 'Mobiliari i decoració atemporal, fet per durar. Materials naturals, línies netes i calidesa nòrdica per a cada racó.'),
      t('Comprar ahora', 'Shop now', 'Comprar ara'), t('Ver categorías', 'View categories', 'Veure categories'), t('+12.000 clientes', '+12,000 customers', '+12.000 clients'), t('Envío 24/48h', '24/48h shipping', 'Enviament 24/48h'), t('30 días de devolución', '30-day returns', '30 dies de devolució'), t('Pago 100% seguro', '100% secure payment', 'Pagament 100% segur'), t('Materiales sostenibles', 'Sustainable materials', 'Materials sostenibles'),
      t('Explora', 'Explore', 'Explora'), t('Compra por categoría', 'Shop by category', 'Compra per categoria'), t('Salón', 'Living room', 'Saló'), t('48 productos', '48 products', '48 productes'), t('Dormitorio', 'Bedroom', 'Dormitori'), t('36 productos', '36 products', '36 productes'), t('Decoración', 'Decor', 'Decoració'), t('72 productos', '72 products', '72 productes'), t('Lo más vendido', 'Best sellers', 'El més venut'), t('Nuestros favoritos', 'Our favourites', 'Els nostres favorits'), t('Ver toda la tienda', 'View full shop', 'Veure tota la botiga'),
      t('Edición limitada', 'Limited edition', 'Edició limitada'), t('Rebajas de temporada', 'Seasonal sale', 'Rebaixes de temporada'), t('Hasta un 40% en una selección de piezas icónicas. Renueva tu espacio antes de que vuelen.', 'Up to 40% off selected iconic pieces. Refresh your space before they sell out.', 'Fins a un 40% en una selecció de peces icòniques. Renova el teu espai abans que volen.'), t('Ver ofertas', 'View offers', 'Veure ofertes'), t('Newsletter', 'Newsletter', 'Newsletter'), t('Únete a Nórdica', 'Join Nórdica', 'Uneix-te a Nòrdica'), t('Suscríbete y recibe un', 'Subscribe and get a', 'Subscriu-te i rep un'), t('10% de descuento', '10% discount', '10% de descompte'), t('en tu primera compra, además de ideas de decoración cada semana.', 'on your first order, plus decor ideas every week.', 'en la teua primera compra, a més d’idees de decoració cada setmana.'), t('Suscribirme', 'Subscribe', 'Subscriure’m'), t('¡Bienvenido/a! Revisa tu correo.', 'Welcome! Check your email.', 'Benvingut/da! Revisa el teu correu.'), t('Cesta', 'Cart', 'Cistella'), t('0 productos', '0 products', '0 productes'), t('Deseados', 'Wishlist', 'Desitjats'), t('Total', 'Total', 'Total'), t('Proceder al pago', 'Proceed to checkout', 'Procedir al pagament'), t('Añadido a la cesta', 'Added to cart', 'Afegit a la cistella')
    ],
    agencia: [
      t('FORMA Studio — Agencia de Diseño', 'FORMA Studio — Design Agency', 'FORMA Studio — Agència de Disseny'), t('Studio de diseño · Est. 2018', 'Design studio · Est. 2018', 'Estudi de disseny · Est. 2018'), t('Identidades que el', 'Identities the', 'Identitats que el'), t('mundo', 'world', 'món'), t('no olvida', 'does not forget', 'no oblida'), t('Creamos marcas, experiencias digitales y sistemas visuales para empresas que quieren liderar su categoría. No plantillas: cada proyecto es una decisión.', 'We create brands, digital experiences and visual systems for companies that want to lead their category. No templates: every project is a decision.', 'Creem marques, experiències digitals i sistemes visuals per a empreses que volen liderar la seua categoria. Sense plantilles: cada projecte és una decisió.'),
      t('Ver nuestro trabajo', 'View our work', 'Veure el nostre treball'), t('Contactar', 'Contact', 'Contactar'), t('Proyectos entregados', 'Projects delivered', 'Projectes entregats'), t('Clientes satisfechos', 'Happy clients', 'Clients satisfets'), t('Premios de diseño', 'Design awards', 'Premis de disseny'), t('Años de experiencia', 'Years of experience', 'Anys d’experiència'),
      t('Lo que hacemos', 'What we do', 'Què fem'), t('Diseño sin', 'Design without', 'Disseny sense'), t('compromisos', 'compromise', 'compromisos'), t('Cada disciplina conectada. Cada decisión con intención. Trabajamos desde la estrategia hasta el píxel final.', 'Every discipline connected. Every decision intentional. We work from strategy to the final pixel.', 'Cada disciplina connectada. Cada decisió amb intenció. Treballem des de l’estratègia fins al píxel final.'),
      t('Identidad de Marca', 'Brand identity', 'Identitat de marca'), t('Sistemas visuales completos que van más allá del logotipo: tipografía, color, voz, motion y guías de marca que escalan con el negocio.', 'Complete visual systems beyond the logo: typography, colour, voice, motion and brand guides that scale with the business.', 'Sistemes visuals complets que van més enllà del logotip: tipografia, color, veu, motion i guies de marca que escalen amb el negoci.'), t('Diseño Web', 'Web design', 'Disseny web'), t('Interfaces que convierten visitantes en clientes. UX riguroso, UI memorable.', 'Interfaces that turn visitors into clients. Rigorous UX, memorable UI.', 'Interfícies que converteixen visitants en clients. UX rigorosa, UI memorable.'), t('Motion & Video', 'Motion & video', 'Motion i vídeo'), t('Animaciones que explican, emocionan y retienen. Desde reels hasta sistemas de motion para redes.', 'Animations that explain, move and retain. From reels to motion systems for social media.', 'Animacions que expliquen, emocionen i retenen. Des de reels fins a sistemes de motion per a xarxes.'),
      t('Estrategia Visual', 'Visual strategy', 'Estratègia visual'), t('Auditorías de marca, análisis de competidores y hojas de ruta creativas alineadas con el negocio.', 'Brand audits, competitor analysis and creative roadmaps aligned with the business.', 'Auditories de marca, anàlisi de competidors i fulls de ruta creatius alineats amb el negoci.'), t('Diseño Editorial', 'Editorial design', 'Disseny editorial'), t('Catálogos, revistas, packaging y piezas impresas donde el detalle importa tanto como la gran idea.', 'Catalogues, magazines, packaging and print pieces where detail matters as much as the big idea.', 'Catàlegs, revistes, packaging i peces impreses on el detall importa tant com la gran idea.'),
      t('Portfolio', 'Portfolio', 'Portfolio'), t('selecto', 'selected', 'selecte'), t('Proyectos recientes. Haz clic en cualquiera para ver el caso completo.', 'Recent projects. Click any project to view the full case.', 'Projectes recents. Fes clic en qualsevol per veure el cas complet.'), t('Casos de éxito', 'Case studies', 'Casos d’èxit'), t('Resultados que', 'Results that', 'Resultats que'), t('importan', 'matter', 'importen'), t('El diseño no es decoración. Estos son los números que respaldan cada decisión creativa.', 'Design is not decoration. These are the numbers behind every creative decision.', 'El disseny no és decoració. Estos són els números que recolzen cada decisió creativa.'),
      t('Cómo trabajamos', 'How we work', 'Com treballem'), t('sin misterios', 'without mystery', 'sense misteris'), t('Cuatro fases. Sin sorpresas. Siempre sabes en qué punto estamos y qué viene después.', 'Four phases. No surprises. You always know where we are and what comes next.', 'Quatre fases. Sense sorpreses. Sempre saps en quin punt estem i què ve després.'),
      t('Descubrimiento', 'Discovery', 'Descobriment'), t('Entendemos tu negocio, competidores, audiencia y objetivos. La estrategia antes del pixel.', 'We understand your business, competitors, audience and goals. Strategy before pixels.', 'Entenem el teu negoci, competidors, audiència i objectius. L’estratègia abans del píxel.'), t('Concepto', 'Concept', 'Concepte'), t('Producción', 'Production', 'Producció'), t('Entrega', 'Delivery', 'Entrega'),
      t('Empezar', 'Start', 'Començar'), t('Tu próxima', 'Your next', 'La teua pròxima'), t('gran marca', 'great brand', 'gran marca'), t('empieza aquí', 'starts here', 'comença ací'), t('Contamos con disponibilidad limitada cada trimestre. Si tienes un proyecto en mente, cuéntanos: respondemos en 24 horas.', 'We take limited projects each quarter. If you have something in mind, tell us: we reply within 24 hours.', 'Tenim disponibilitat limitada cada trimestre. Si tens un projecte en ment, conta’ns-ho: responem en 24 hores.'), t('Empresa', 'Company', 'Empresa'), t('Tipo de proyecto', 'Project type', 'Tipus de projecte'), t('Identidad de marca completa', 'Complete brand identity', 'Identitat de marca completa'), t('Proyecto mixto', 'Mixed project', 'Projecte mixt'), t('Cuéntanos tu proyecto', 'Tell us about your project', 'Conta’ns el teu projecte')
    ],
    meridian: [
      t('Meridian Studio — Digital Agency', 'Meridian Studio — Digital Agency', 'Meridian Studio — Agència Digital'), t('Work', 'Work', 'Treball'), t('Studio', 'Studio', 'Estudi'), t('Digital Agency — Est. 2019', 'Digital Agency — Est. 2019', 'Agència digital — Est. 2019'), t('We shape the work that', 'We shape the work that', 'Donem forma al treball que'), t('outlasts', 'outlasts', 'perdura més que'), t('the brief.', 'the brief.', 'el briefing.'), t('Projects delivered', 'Projects delivered', 'Projectes entregats'), t('Awards won', 'Awards won', 'Premis guanyats'), t('Team members', 'Team members', 'Membres de l’equip'), t('View selected work', 'View selected work', 'Veure treball seleccionat'),
      t('Selected work', 'Selected work', 'Treball seleccionat'), t('The studio', 'The studio', 'L’estudi'), t('A small team.', 'A small team.', 'Un equip menut.'), t('Unreasonably ambitious work.', 'Unreasonably ambitious work.', 'Treball exageradament ambiciós.'), t('Meridian is a seven-person studio in London. We work with founders and brand directors who have something real to say and need the language to say it — in pixels, motion, and code.', 'Meridian is a seven-person studio in London. We work with founders and brand directors who have something real to say and need the language to say it — in pixels, motion, and code.', 'Meridian és un estudi de set persones a Londres. Treballem amb fundadors i directors de marca que tenen alguna cosa real a dir i necessiten el llenguatge per dir-ho — en píxels, motion i codi.'), t("We don't take on more than we can care about. Every engagement gets our full attention, which is why our clients tend to come back.", "We don't take on more than we can care about. Every engagement gets our full attention, which is why our clients tend to come back.", 'No assumim més del que podem cuidar. Cada projecte rep tota la nostra atenció, i per això els clients solen tornar.'),
      t('Clients & collaborators', 'Clients & collaborators', 'Clients i col·laboradors'), t('What we do', 'What we do', 'Què fem'), t('Brand & Identity', 'Brand & Identity', 'Marca i identitat'), t('Digital Products', 'Digital Products', 'Productes digitals'), t('Campaigns & Motion', 'Campaigns & Motion', 'Campanyes i motion'), t("Let's make something worth", "Let's make something worth", 'Fem alguna cosa digna de'), t('remembering.', 'remembering.', 'recordar.'), t('© 2025 Meridian Studio Ltd · London', '© 2025 Meridian Studio Ltd · London', '© 2025 Meridian Studio Ltd · Londres')
    ],
    eclipse: [
      t('Eclipse Festival — Immersive Frontend Demo', 'Eclipse Festival — Immersive Frontend Demo', 'Eclipse Festival — Demo Frontend Immersiva'), t('Line-up', 'Line-up', 'Cartell'), t('Schedule', 'Schedule', 'Horari'), t('Map', 'Map', 'Mapa'), t('Tickets', 'Tickets', 'Entrades'), t('Wall', 'Wall', 'Mur'), t('Play browser teaser', 'Play browser teaser', 'Reproduir teaser'), t('Neon coast · Three nights · No external assets', 'Neon coast · Three nights · No external assets', 'Costa neó · Tres nits · Sense assets externs'),
      t('Meet us', 'Meet us', 'Ens veiem'), t('under the', 'under the', 'davall de'), t('eclipse.', 'eclipse.', 'l’eclipsi.'), t('A fictional festival landing page built to feel like a real premium launch: generated audio, reactive lights, persistent favourites, animated ticket builder and a tiny festival world.', 'A fictional festival landing page built to feel like a real premium launch: generated audio, reactive lights, persistent favourites, animated ticket builder and a tiny festival world.', 'Una landing de festival fictícia pensada per semblar un llançament premium real: àudio generat, llums reactives, favorits persistents, constructor d’entrades animat i un xicotet món de festival.'), t('Build my pass', 'Build my pass', 'Crear el meu passe'), t('Explore artists', 'Explore artists', 'Explorar artistes'), t('days', 'days', 'dies'), t('hours', 'hours', 'hores'), t('mins', 'mins', 'mins'), t('secs', 'secs', 'segs'), t('Afterglow Deck', 'Afterglow Deck', 'Coberta Afterglow'), t('Drag your cursor. Tap the stars. The page remembers your route.', 'Drag your cursor. Tap the stars. The page remembers your route.', 'Arrossega el cursor. Toca les estreles. La pàgina recorda la teua ruta.'), t('Main Stage', 'Main Stage', 'Escenari principal'), t('Line-up cockpit', 'Line-up cockpit', 'Cabina del cartell'), t('Artist cards that feel collectible.', 'Artist cards that feel collectible.', 'Targetes d’artistes que semblen col·leccionables.'), t('Schedule builder', 'Schedule builder', 'Constructor d’horari'), t('Your night updates as you play.', 'Your night updates as you play.', 'La teua nit s’actualitza mentre jugues.'), t('Saved route', 'Saved route', 'Ruta guardada'), t('No favourites yet', 'No favourites yet', 'Encara no hi ha favorits'), t('Clear route', 'Clear route', 'Netejar ruta'), t('Festival world', 'Festival world', 'Món del festival'), t('A map that sells the place.', 'A map that sells the place.', 'Un mapa que ven el lloc.'), t('Ticket composer', 'Ticket composer', 'Compositor d’entrades'), t('Make the purchase flow feel alive.', 'Make the purchase flow feel alive.', 'Fes que el flux de compra semble viu.'), t('Pass type', 'Pass type', 'Tipus de passe'), t('People', 'People', 'Persones'), t('Add to festival wallet', 'Add to festival wallet', 'Afegir a la cartera del festival'), t('Memory wall', 'Memory wall', 'Mur de records'), t('A tiny human touch.', 'A tiny human touch.', 'Un xicotet toc humà.'), t('Launch wish', 'Launch wish', 'Llançar desig'), t('Artist', 'Artist', 'Artista'), t('Bio', 'Bio', 'Bio'), t('Stage', 'Stage', 'Escenari'), t('Signature moment', 'Signature moment', 'Moment distintiu'), t('Final drop', 'Final drop', 'Drop final'), t('Save to route', 'Save to route', 'Guardar en ruta')
    ],
    orbit: [
      t('Orbit CRM — Polished Frontend SaaS Demo', 'Orbit CRM — Polished Frontend SaaS Demo', 'Orbit CRM — Demo SaaS Frontend Polida'), t('Overview', 'Overview', 'Resum'), t('Clients', 'Clients', 'Clients'), t('Calendar', 'Calendar', 'Calendari'), t('Campaigns', 'Campaigns', 'Campanyes'), t('AI signal', 'AI signal', 'Senyal IA'), t('Proposal velocity up 18%', 'Proposal velocity up 18%', 'Velocitat de propostes +18%'), t('Three warm leads moved faster than usual this week.', 'Three warm leads moved faster than usual this week.', 'Tres contactes calents han avançat més ràpid del normal esta setmana.'), t('Switch theme', 'Switch theme', 'Canviar tema'), t('Frontend product demo', 'Frontend product demo', 'Demo de producte frontend'), t('Mission control for client work.', 'Mission control for client work.', 'Centre de control per al treball amb clients.'), t('Search', 'Search', 'Buscar'), t('+ New lead', '+ New lead', '+ Nou lead'), t('Revenue pulse', 'Revenue pulse', 'Pols d’ingressos'), t('Pipeline value over time', 'Pipeline value over time', 'Valor del pipeline al llarg del temps'), t('Revenue', 'Revenue', 'Ingressos'), t('Leads', 'Leads', 'Leads'), t('Smart assistant', 'Smart assistant', 'Assistent intel·ligent'), t('Protect the Lumina proposal.', 'Protect the Lumina proposal.', 'Protegeix la proposta Lumina.'), t('Generate insight', 'Generate insight', 'Generar insight'), t('Turn into task', 'Turn into task', 'Convertir en tasca'), t('Live pipeline', 'Live pipeline', 'Pipeline en viu'), t('Drag deals, update totals.', 'Drag deals, update totals.', 'Arrossega oportunitats, actualitza totals.'), t('Open full board', 'Open full board', 'Obrir tauler complet'), t('Client database', 'Client database', 'Base de dades de clients'), t('Search, filter and inspect clients.', 'Search, filter and inspect clients.', 'Busca, filtra i inspecciona clients.'), t('All statuses', 'All statuses', 'Tots els estats'), t('Active', 'Active', 'Actiu'), t('Proposal', 'Proposal', 'Proposta'), t('Lead', 'Lead', 'Lead'), t('At Risk', 'At Risk', 'En risc'), t('All budgets', 'All budgets', 'Tots els pressupostos'), t('Below €10k', 'Below €10k', 'Menys de 10k€'), t('Client', 'Client', 'Client'), t('Industry', 'Industry', 'Sector'), t('Status', 'Status', 'Estat'), t('Owner', 'Owner', 'Responsable'), t('Budget', 'Budget', 'Pressupost'), t('Health', 'Health', 'Salut'), t('Next step', 'Next step', 'Pròxim pas'), t('Kanban pipeline', 'Kanban pipeline', 'Pipeline kanban'), t('A frontend board with memory.', 'A frontend board with memory.', 'Un tauler frontend amb memòria.'), t('Add demo deal', 'Add demo deal', 'Afegir oportunitat demo'), t('Reset board', 'Reset board', 'Reiniciar tauler'), t('Weekly planner', 'Weekly planner', 'Planificador setmanal'), t('Tasks that feel like an app.', 'Tasks that feel like an app.', 'Tasques que semblen una app.'), t('Complete focus block', 'Complete focus block', 'Completar bloc de focus'), t('Today', 'Today', 'Hui'), t('Momentum score', 'Momentum score', 'Puntuació d’impuls'), t('Activity', 'Activity', 'Activitat'), t('Tasks', 'Tasks', 'Tasques'), t('Client name', 'Client name', 'Nom del client'), t('Description', 'Description', 'Descripció'), t('Create follow-up task', 'Create follow-up task', 'Crear tasca de seguiment'), t('Move to proposal', 'Move to proposal', 'Moure a proposta'), t('Command palette', 'Command palette', 'Paleta d’ordres')
    ]
  };

  function currentDemoId() {
    const path = location.pathname.toLowerCase();
    if (path.includes('restaurante')) return 'restaurante';
    if (path.includes('tienda')) return 'tienda';
    if (path.includes('agencia')) return 'agencia';
    if (path.includes('meridian')) return 'meridian';
    if (path.includes('eclipse')) return 'eclipse';
    if (path.includes('orbit-crm')) return 'orbit';
    return 'common';
  }

  const demoId = currentDemoId();
  const meta = DEMO_META[demoId] || DEMO_META.restaurante;
  const entries = [...(DICTS.common || []), ...(DICTS[demoId] || [])];
  const lookup = new Map();
  entries.forEach((entry) => {
    langs.forEach((lng) => lookup.set(norm(entry[lng]), entry));
  });

  function initialLang() {
    try {
      const parentLang = window.parent && window.parent !== window ? window.parent.document.documentElement.lang : '';
      if (parentLang) return normalizeLang(parentLang);
    } catch {}
    return normalizeLang(localStorage.getItem(LKEY) || document.documentElement.lang || 'es');
  }

  let activeLang = initialLang();

  function translateTextNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('script,style,noscript,svg,canvas,.no-demo-i18n')) return NodeFilter.FILTER_REJECT;
        return norm(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const key = norm(node.nodeValue);
      const entry = lookup.get(key);
      if (entry) node.nodeValue = node.nodeValue.replace(key, entry[activeLang]);
    });
  }

  function translateAttributes() {
    document.querySelectorAll('[placeholder],[title],[aria-label],input[value],button[value]').forEach((el) => {
      ['placeholder','title','aria-label','value'].forEach((attr) => {
        const value = el.getAttribute(attr);
        if (!value) return;
        const entry = lookup.get(norm(value));
        if (entry) el.setAttribute(attr, entry[activeLang]);
      });
    });
  }

  function injectStyle() {
    if (document.getElementById('daniel-demo-i18n-style')) return;
    const style = document.createElement('style');
    style.id = 'daniel-demo-i18n-style';
    style.textContent = `
      :root{--demo-lang-accent:${meta.accent};--demo-lang-accent-2:${meta.accent2};}
      .demo-lang-switcher{position:relative!important;display:inline-grid!important;place-items:center!important;width:44px!important;height:44px!important;margin-left:10px!important;vertical-align:middle!important;z-index:9999!important;isolation:isolate!important;}
      .demo-lang-current{width:44px!important;height:44px!important;border:1px solid rgba(255,255,255,.18)!important;border-radius:999px!important;background:rgba(6,10,22,.54)!important;color:#fff!important;font:950 11px/1 Inter,system-ui,sans-serif!important;letter-spacing:.08em!important;text-transform:uppercase!important;box-shadow:0 14px 36px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.08)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important;cursor:pointer!important;transition:transform .22s ease,border-color .22s ease,background .22s ease,box-shadow .22s ease!important;display:grid!important;place-items:center!important;padding:0!important;min-width:0!important;min-height:0!important;}
      .demo-lang-current:hover,.demo-lang-switcher.open .demo-lang-current{transform:translateY(-1px)!important;border-color:color-mix(in srgb,var(--demo-lang-accent) 58%,rgba(255,255,255,.22))!important;background:linear-gradient(135deg,color-mix(in srgb,var(--demo-lang-accent) 30%,rgba(6,10,22,.56)),color-mix(in srgb,var(--demo-lang-accent-2) 24%,rgba(6,10,22,.56)))!important;box-shadow:0 16px 42px color-mix(in srgb,var(--demo-lang-accent) 22%,transparent)!important;}
      .demo-lang-options{position:absolute!important;right:0!important;top:calc(100% + 8px)!important;display:grid!important;gap:5px!important;min-width:70px!important;padding:6px!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:18px!important;background:rgba(6,10,22,.88)!important;box-shadow:0 22px 54px rgba(0,0,0,.34)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;opacity:0!important;transform:translateY(-8px) scale(.96)!important;pointer-events:none!important;transition:opacity .22s ease,transform .22s ease!important;}
      .demo-lang-switcher.open .demo-lang-options{opacity:1!important;transform:translateY(0) scale(1)!important;pointer-events:auto!important;}
      .demo-lang-options button{width:100%!important;min-height:32px!important;border:0!important;border-radius:12px!important;background:transparent!important;color:rgba(255,255,255,.72)!important;font:900 11px/1 Inter,system-ui,sans-serif!important;letter-spacing:.08em!important;text-transform:uppercase!important;cursor:pointer!important;padding:0 10px!important;text-align:center!important;transition:background .18s ease,color .18s ease,transform .18s ease!important;}
      .demo-lang-options button:hover{transform:translateX(-1px)!important;background:rgba(255,255,255,.08)!important;color:#fff!important;}
      .demo-lang-options button.active{background:linear-gradient(135deg,var(--demo-lang-accent),var(--demo-lang-accent-2))!important;color:#07101a!important;}
      .daniel-demo-footer{background:radial-gradient(circle at 10% 0,color-mix(in srgb,var(--demo-lang-accent) 18%,transparent),transparent 34%),linear-gradient(180deg,rgba(7,10,20,.96),rgba(3,5,11,.98))!important;border-top:1px solid color-mix(in srgb,var(--demo-lang-accent) 28%,rgba(255,255,255,.08))!important;padding:64px clamp(20px,6vw,88px) 28px!important;margin:0!important;color:#f8fafc!important;}
      .daniel-demo-footer *{box-sizing:border-box!important;}
      .daniel-demo-footer a{color:inherit!important;text-decoration:none!important;}
      .daniel-demo-footer__grid{display:grid!important;grid-template-columns:minmax(0,2fr) repeat(2,minmax(160px,1fr))!important;gap:clamp(24px,4vw,54px)!important;max-width:1180px!important;margin:0 auto 38px!important;}
      .daniel-demo-footer__brand{display:inline-flex!important;align-items:center!important;gap:10px!important;font-weight:950!important;font-size:clamp(1.4rem,2.5vw,2.05rem)!important;letter-spacing:-.05em!important;color:#fff!important;margin-bottom:16px!important;}
      .daniel-demo-footer__brand span,.daniel-demo-footer__brand i{color:var(--demo-lang-accent)!important;}
      .daniel-demo-footer p,.daniel-demo-footer li{color:rgba(226,232,240,.70)!important;font-size:.95rem!important;line-height:1.65!important;margin:0 0 10px!important;list-style:none!important;}
      .daniel-demo-footer h4{font:900 .78rem/1 Inter,system-ui,sans-serif!important;text-transform:uppercase!important;letter-spacing:.16em!important;color:var(--demo-lang-accent)!important;margin:0 0 18px!important;}
      .daniel-demo-footer ul{padding:0!important;margin:0!important;display:grid!important;gap:8px!important;}
      .daniel-demo-footer__socials{display:flex!important;gap:12px!important;flex-wrap:wrap!important;margin-top:20px!important;}
      .daniel-demo-footer__socials a{width:42px!important;height:42px!important;border-radius:50%!important;display:grid!important;place-items:center!important;border:1px solid rgba(255,255,255,.12)!important;background:rgba(255,255,255,.05)!important;color:rgba(255,255,255,.72)!important;transition:.25s ease!important;}
      .daniel-demo-footer__socials a:hover{transform:translateY(-2px)!important;background:linear-gradient(135deg,var(--demo-lang-accent),var(--demo-lang-accent-2))!important;color:#07101a!important;border-color:transparent!important;}
      .daniel-demo-footer__bottom{max-width:1180px!important;margin:0 auto!important;text-align:center!important;padding-top:24px!important;border-top:1px solid rgba(255,255,255,.10)!important;color:rgba(226,232,240,.62)!important;font-size:.86rem!important;}
      .daniel-demo-footer__bottom a{color:var(--demo-lang-accent)!important;font-weight:900!important;}
      .back,a.back,a[href*="index.html#webs"],.portfolio-footer{display:none!important;visibility:hidden!important;pointer-events:none!important;}
      @media(max-width:860px){.daniel-demo-footer__grid{grid-template-columns:1fr!important}.demo-lang-switcher{margin-left:0!important}.demo-lang-options{right:auto!important;left:50%!important;transform:translate(-50%,-8px) scale(.96)!important}.demo-lang-switcher.open .demo-lang-options{transform:translate(-50%,0) scale(1)!important}}
    `;
    document.head.appendChild(style);
  }

  function renderFooter() {
    const oldFooter = document.querySelector('footer');
    const footer = document.createElement('footer');
    footer.className = 'daniel-demo-footer no-demo-i18n';
    const socials = (meta.socials || []).map((icon) => {
      const solid = ['chart-line','globe','envelope'].includes(icon);
      return `<a href="#" aria-label="${icon}"><i class="${solid ? 'fa-solid' : 'fa-brands'} fa-${icon}"></i></a>`;
    }).join('');
    const columns = (meta.columns || []).map((col) => `
      <div>
        <h4>${col.title[activeLang] || col.title}</h4>
        <ul>${col.items.map((item) => `<li>${typeof item === 'string' ? item : item[activeLang]}</li>`).join('')}</ul>
      </div>
    `).join('');
    const demoBy = activeLang === 'en' ? 'Demo from' : (activeLang === 'val' ? 'Demo de portfolio de' : 'Demo de portfolio de');
    footer.innerHTML = `
      <div class="daniel-demo-footer__grid">
        <div>
          <a href="#" class="daniel-demo-footer__brand">${meta.logo}</a>
          <p>${meta.tagline[activeLang]}</p>
          <div class="daniel-demo-footer__socials">${socials}</div>
        </div>
        ${columns}
      </div>
      <div class="daniel-demo-footer__bottom">© 2026 ${meta.name} · ${demoBy} <a href="https://danielux135.github.io/" target="_blank" rel="noopener">Daniel Bort Guzmán</a></div>
    `;
    if (oldFooter) oldFooter.replaceWith(footer);
    else document.body.appendChild(footer);
  }

  function langCode(lang = activeLang) {
    return lang === 'val' ? 'VAL' : lang.toUpperCase();
  }

  function injectLanguageSwitcher() {
    if (document.querySelector('.demo-lang-switcher')) return;
    const control = document.createElement('div');
    control.className = 'demo-lang-switcher no-demo-i18n';
    control.setAttribute('aria-label', 'Language');
    control.innerHTML = `
      <button type="button" class="demo-lang-current" data-lang-toggle aria-expanded="false"><span data-current-lang>${langCode(activeLang)}</span></button>
      <div class="demo-lang-options" role="menu">
        ${langs.map((lng) => `<button type="button" role="menuitem" data-demo-lang="${lng}">${langCode(lng)}</button>`).join('')}
      </div>
    `;
    const host = document.querySelector('.nav-in') || document.querySelector('.site-header') || document.querySelector('nav') || document.querySelector('header') || document.body;
    host.appendChild(control);
    control.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-lang-toggle]');
      const btn = event.target.closest('[data-demo-lang]');
      if (toggle) {
        const open = !control.classList.contains('open');
        control.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        return;
      }
      if (!btn) return;
      setLang(btn.dataset.demoLang);
      control.classList.remove('open');
      control.querySelector('[data-lang-toggle]')?.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', (event) => {
      if (!control.contains(event.target)) {
        control.classList.remove('open');
        control.querySelector('[data-lang-toggle]')?.setAttribute('aria-expanded', 'false');
      }
    }, true);
  }

  function updateLangButtons() {
    const current = document.querySelector('[data-current-lang]');
    if (current) current.textContent = langCode(activeLang);
    document.querySelectorAll('[data-demo-lang]').forEach((btn) => btn.classList.toggle('active', btn.dataset.demoLang === activeLang));
  }

  function removeBackLinks() {
    document.querySelectorAll('a.back,.back,a[href*="index.html#webs"],.portfolio-footer').forEach((el) => el.remove());
  }

  function setLang(lang) {
    activeLang = normalizeLang(lang);
    localStorage.setItem(LKEY, activeLang);
    document.documentElement.lang = activeLang === 'val' ? 'ca' : activeLang;
    renderFooter();
    translateTextNodes();
    translateAttributes();
    updateLangButtons();
    removeBackLinks();
  }

  function init() {
    injectStyle();
    injectLanguageSwitcher();
    setLang(activeLang);
    window.DemoI18n = { setLang, getLang: () => activeLang };
    setTimeout(removeBackLinks, 100);
    setTimeout(removeBackLinks, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
