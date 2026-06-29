import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('../', import.meta.url));
const postsDir = path.join(rootDir, 'public', 'foskia', 'posts');
const indexHtmlPath = path.join(rootDir, 'public', 'foskia', 'index.html');
const indexJsonPath = path.join(postsDir, 'index.json');

const posts = [
  {
    date: '2026-06-25',
    title: {
      es: 'FoskIA 25/06: Epic renueva regalos, Bitcoin pierde los 60.000$ y Bruselas reabre el debate del juego digital',
      en: 'FoskIA 25/06: Epic refreshes freebies, Bitcoin loses $60K and Brussels reopens the digital-games debate',
      val: 'FoskIA 25/06: Epic renova regals, Bitcoin perd els 60.000$ i Brussel·les reobri el debat del joc digital',
    },
    intro: {
      es: 'La edición del 25 de junio se mueve entre juegos gratis muy claros, presión seria sobre Bitcoin y una semana especialmente cargada de debate sobre preservación digital, IA y herramientas de desarrollo. Epic cambia su rotación, Prime Gaming activa nueva tanda y la conversación tech gira menos en torno al hype y más hacia control, calidad y criterio.',
      en: 'The June 25 edition lands at the crossroads of clear free-game deals, real pressure on Bitcoin and a week packed with debate around game preservation, AI and developer tooling. Epic rotates its giveaways, Prime Gaming adds a fresh batch and the tech conversation shifts away from hype toward control, quality and judgment.',
      val: 'L’edició del 25 de juny es mou entre jocs gratis molt clars, pressió seriosa sobre Bitcoin i una setmana especialment carregada de debat sobre preservació digital, IA i eines de desenvolupament. Epic canvia la seua rotació, Prime Gaming activa nova tanda i la conversa tech gira menys al hype i més cap al control, la qualitat i el criteri.',
    },
    sections: [
      {
        category: 'gaming',
        items: [
          {
            title: {
              es: 'La respuesta de la Comisión a Stop Destroying Videogames mantiene vivo el conflicto',
              en: 'The Commission’s reply to Stop Destroying Videogames keeps the conflict alive',
              val: 'La resposta de la Comissió a Stop Destroying Videogames manté viu el conflicte',
            },
            summary: {
              es: 'La Comisión Europea ya ha publicado su respuesta oficial a la iniciativa <a href="https://citizens-initiative.europa.eu/stop-destroying-videogames-commissions-reply-european-citizens-initiative_en">Stop Destroying Videogames</a>, que había superado 1,29 millones de apoyos verificados. No promete una obligación inmediata para que los juegos sigan funcionando tras el cierre de servidores, pero el caso queda plenamente instalado en el debate europeo sobre propiedad digital, preservación y servicios siempre online.',
              en: 'The European Commission has now published its official reply to the <a href="https://citizens-initiative.europa.eu/stop-destroying-videogames-commissions-reply-european-citizens-initiative_en">Stop Destroying Videogames</a> initiative, which cleared 1.29 million verified statements of support. It does not promise an immediate requirement to keep games playable after server shutdowns, but it firmly places digital ownership, preservation and always-online services in the European debate.',
              val: 'La Comissió Europea ja ha publicat la seua resposta oficial a la iniciativa <a href="https://citizens-initiative.europa.eu/stop-destroying-videogames-commissions-reply-european-citizens-initiative_en">Stop Destroying Videogames</a>, que havia superat 1,29 milions de suports verificats. No promet una obligació immediata perquè els jocs continuen funcionant després del tancament de servidors, però el cas queda plenament instal·lat en el debat europeu sobre propietat digital, preservació i serveis sempre online.',
            },
            source: 'European Citizens’ Initiative',
            url: 'https://citizens-initiative.europa.eu/stop-destroying-videogames-commissions-reply-european-citizens-initiative_en',
            links: [
              {
                title: {
                  es: 'Respuesta oficial de la Comisión',
                  en: 'Official Commission reply',
                  val: 'Resposta oficial de la Comissió',
                },
                url: 'https://citizens-initiative.europa.eu/stop-destroying-videogames-commissions-reply-european-citizens-initiative_en',
              },
              {
                title: {
                  es: 'Ficha de la iniciativa',
                  en: 'Initiative page',
                  val: 'Fitxa de la iniciativa',
                },
                url: 'https://citizens-initiative.europa.eu/initiatives/details/2024/000007_en',
              },
            ],
          },
          {
            title: {
              es: 'Steam vuelve a discutir el efecto del arte generado por IA en la visibilidad de indies',
              en: 'Steam is debating AI-generated art and indie visibility again',
              val: 'Steam torna a discutir l’efecte de l’art generat per IA en la visibilitat dels indies',
            },
            summary: {
              es: 'El repaso semanal de <a href="https://www.pcgamer.com/gaming-industry/steam-week-in-review-spammy-ai-generated-capsule-art-is-a-pox-and-it-makes-browsing-steam-less-fun/">PC Gamer</a> señala que la avalancha de portadas, cápsulas y materiales promocionales hechos con IA está empeorando el descubrimiento dentro de Steam. El problema no es solo estético: para estudios pequeños, perder claridad en la tienda puede significar desaparecer entre lanzamientos de baja calidad pero apariencia muy pulida.',
              en: '<a href="https://www.pcgamer.com/gaming-industry/steam-week-in-review-spammy-ai-generated-capsule-art-is-a-pox-and-it-makes-browsing-steam-less-fun/">PC Gamer’s</a> weekly roundup argues that the flood of AI-made capsule art and promo assets is hurting discovery on Steam. The issue is not just aesthetic: for small studios, losing storefront clarity can mean vanishing behind low-quality releases with polished-looking packaging.',
              val: 'El repàs setmanal de <a href="https://www.pcgamer.com/gaming-industry/steam-week-in-review-spammy-ai-generated-capsule-art-is-a-pox-and-it-makes-browsing-steam-less-fun/">PC Gamer</a> assenyala que l’allau de portades, càpsules i materials promocionals fets amb IA està empitjorant el descobriment dins de Steam. El problema no és només estètic: per als estudis menuts, perdre claredat en la botiga pot significar desaparéixer entre llançaments de baixa qualitat però aparença molt polida.',
            },
            source: 'PC Gamer',
            url: 'https://www.pcgamer.com/gaming-industry/steam-week-in-review-spammy-ai-generated-capsule-art-is-a-pox-and-it-makes-browsing-steam-less-fun/',
            links: [
              {
                title: {
                  es: 'Steam Week in Review',
                  en: 'Steam Week in Review',
                  val: 'Steam Week in Review',
                },
                url: 'https://www.pcgamer.com/gaming-industry/steam-week-in-review-spammy-ai-generated-capsule-art-is-a-pox-and-it-makes-browsing-steam-less-fun/',
              },
            ],
          },
        ],
      },
      {
        category: 'gratis',
        items: [
          {
            title: {
              es: 'RollerCoaster Tycoon 3 y Voidwrought pasan a ser los juegos gratis de Epic',
              en: 'RollerCoaster Tycoon 3 and Voidwrought become Epic’s free games',
              val: 'RollerCoaster Tycoon 3 i Voidwrought passen a ser els jocs gratis d’Epic',
            },
            summary: {
              es: 'La nueva rotación de <a href="https://store.epicgames.com/free-games">Epic Games Store</a> deja gratis RollerCoaster Tycoon 3: Complete Edition y Voidwrought entre el 25 de junio y el 2 de julio. Es una tanda bastante limpia: gestión clásica por un lado y metroidvania de acción por el otro, ambos para reclamar y conservar en la biblioteca.',
              en: 'The new <a href="https://store.epicgames.com/free-games">Epic Games Store</a> rotation makes RollerCoaster Tycoon 3: Complete Edition and Voidwrought free from June 25 to July 2. It is a neat combo: classic management on one side, action metroidvania on the other, both claimable to keep.',
              val: 'La nova rotació d’<a href="https://store.epicgames.com/free-games">Epic Games Store</a> deixa gratis RollerCoaster Tycoon 3: Complete Edition i Voidwrought entre el 25 de juny i el 2 de juliol. És una tanda prou clara: gestió clàssica per un costat i metroidvania d’acció per l’altre, tots dos per a reclamar i conservar en la biblioteca.',
            },
            platform: 'Epic Games Store',
            until: {
              es: '2 de julio de 2026, 17:00 CEST',
              en: 'July 2, 2026, 3:00 PM UTC',
              val: '2 de juliol de 2026, 17.00 CEST',
            },
            urgent: true,
            source: 'Epic Games Store / PC Gamer',
            url: 'https://store.epicgames.com/free-games',
            links: [
              {
                title: {
                  es: 'Epic: juegos gratis',
                  en: 'Epic: free games',
                  val: 'Epic: jocs gratis',
                },
                url: 'https://store.epicgames.com/free-games',
              },
              {
                title: {
                  es: 'PC Gamer: rotación del 25 de junio',
                  en: 'PC Gamer: June 25 rotation',
                  val: 'PC Gamer: rotació del 25 de juny',
                },
                url: 'https://www.pcgamer.com/epic-games-store-free-games-list/',
              },
            ],
          },
          {
            title: {
              es: 'Prime Gaming activa su tanda del 25 de junio con Space Grunts y Terraforming Mars',
              en: 'Prime Gaming activates its June 25 batch with Space Grunts and Terraforming Mars',
              val: 'Prime Gaming activa la seua tanda del 25 de juny amb Space Grunts i Terraforming Mars',
            },
            summary: {
              es: 'La tanda final del mes en <a href="https://gaming.amazon.com/">Prime Gaming</a> añade Space Grunts: Chrono Shard, Please Touch the Artwork, Terraforming Mars y Lost Eidolons: Veil of the Witch. Conviene revisar en qué launcher se reclama cada uno, porque el lote mezcla códigos para Epic, Legacy Games y Amazon Games.',
              en: 'The final monthly batch on <a href="https://gaming.amazon.com/">Prime Gaming</a> adds Space Grunts: Chrono Shard, Please Touch the Artwork, Terraforming Mars and Lost Eidolons: Veil of the Witch. It is worth checking each redemption platform because the bundle mixes Epic, Legacy Games and Amazon Games claims.',
              val: 'La tanda final del mes en <a href="https://gaming.amazon.com/">Prime Gaming</a> afig Space Grunts: Chrono Shard, Please Touch the Artwork, Terraforming Mars i Lost Eidolons: Veil of the Witch. Convé revisar en quin launcher es reclama cada joc, perquè el lot mescla codis per a Epic, Legacy Games i Amazon Games.',
            },
            platform: 'Prime Gaming',
            until: {
              es: 'Fechas variables según juego',
              en: 'Varies by game',
              val: 'Dates variables segons joc',
            },
            urgent: false,
            source: 'Prime Gaming',
            url: 'https://gaming.amazon.com/',
            links: [
              {
                title: {
                  es: 'Prime Gaming',
                  en: 'Prime Gaming',
                  val: 'Prime Gaming',
                },
                url: 'https://gaming.amazon.com/',
              },
              {
                title: {
                  es: 'Resumen externo del lote',
                  en: 'External batch roundup',
                  val: 'Resum extern del lot',
                },
                url: 'https://web.phenixxgaming.com/2026/06/08/amazon-luna-games-with-prime-june-2026/',
              },
            ],
          },
        ],
      },
      {
        category: 'codigo',
        items: [
          {
            title: {
              es: 'DeveloperWeek 2026 insiste en herramientas de IA útiles antes que llamativas',
              en: 'DeveloperWeek 2026 argues for useful AI tools over flashy ones',
              val: 'DeveloperWeek 2026 insistix en eines d’IA útils abans que cridaneres',
            },
            summary: {
              es: 'El resumen de <a href="https://stackoverflow.blog/2026/03/05/developerweek-2026/">Stack Overflow</a> sobre DeveloperWeek 2026 repite una idea que se está volviendo central: la IA en desarrollo vale cuando encaja en flujos reales y no cuando añade ruido. Interoperabilidad, arquitectura del conocimiento y herramientas accionables pesan más que el marketing de “agente total”.',
              en: '<a href="https://stackoverflow.blog/2026/03/05/developerweek-2026/">Stack Overflow’s</a> DeveloperWeek 2026 recap keeps returning to a theme that is becoming central: AI in development matters when it fits real workflows, not when it just adds noise. Interoperability, knowledge architecture and actionable tools now matter more than “full agent” marketing.',
              val: 'El resum de <a href="https://stackoverflow.blog/2026/03/05/developerweek-2026/">Stack Overflow</a> sobre DeveloperWeek 2026 repetix una idea que s’està tornant central: la IA en desenvolupament val quan encaixa en fluxos reals i no quan afig soroll. Interoperabilitat, arquitectura del coneixement i eines accionables pesen més que el màrqueting de “l’agent total”.',
            },
            source: 'Stack Overflow Blog',
            url: 'https://stackoverflow.blog/2026/03/05/developerweek-2026/',
            links: [
              {
                title: {
                  es: 'DeveloperWeek 2026',
                  en: 'DeveloperWeek 2026',
                  val: 'DeveloperWeek 2026',
                },
                url: 'https://stackoverflow.blog/2026/03/05/developerweek-2026/',
              },
            ],
          },
          {
            title: {
              es: 'Los agentes de código ya están trayendo fatiga de decisión al trabajo diario',
              en: 'Coding agents are already bringing decision fatigue to daily work',
              val: 'Els agents de codi ja estan portant fatiga de decisió al treball diari',
            },
            summary: {
              es: 'Otro texto de <a href="https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/">Stack Overflow</a> pone el foco en un problema más humano que técnico: cuantos más agentes y sugerencias automáticas corren en paralelo, más supervisión mental exigen. La productividad mejora solo si el desarrollador conserva criterio y capacidad para descartar.',
              en: 'Another <a href="https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/">Stack Overflow</a> piece focuses on a more human than technical problem: the more agents and automated suggestions run in parallel, the more cognitive supervision they demand. Productivity improves only if developers keep enough judgment to reject as well as accept.',
              val: 'Un altre text de <a href="https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/">Stack Overflow</a> posa el focus en un problema més humà que tècnic: com més agents i suggeriments automàtics funcionen en paral·lel, més supervisió mental exigixen. La productivitat millora només si el desenvolupador conserva criteri i capacitat per a descartar.',
            },
            source: 'Stack Overflow Blog',
            url: 'https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/',
            links: [
              {
                title: {
                  es: 'Fatiga de decisión con agentes',
                  en: 'Decision fatigue with agents',
                  val: 'Fatiga de decisió amb agents',
                },
                url: 'https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/',
              },
            ],
          },
        ],
      },
      {
        category: 'ciencia',
        items: [
          {
            title: {
              es: 'NASA da por completada la construcción del telescopio Roman',
              en: 'NASA marks the Roman telescope as structurally complete',
              val: 'La NASA dona per completada la construcció del telescopi Roman',
            },
            summary: {
              es: 'La NASA comunicó en diciembre que el <a href="https://www.nasa.gov/missions/roman-space-telescope/nasa-completes-nancy-grace-roman-space-telescope-construction/">Nancy Grace Roman Space Telescope</a> había completado su construcción y mantenía opciones de lanzamiento ya en otoño de 2026. A estas alturas de junio, el proyecto entra en una fase mucho más concreta: menos promesa abstracta y más preparación final para campaña de lanzamiento.',
              en: 'NASA said in December that the <a href="https://www.nasa.gov/missions/roman-space-telescope/nasa-completes-nancy-grace-roman-space-telescope-construction/">Nancy Grace Roman Space Telescope</a> had completed construction and still had a path to launch as early as fall 2026. By late June, the mission is in a far more concrete phase: less abstract promise, more final launch-campaign preparation.',
              val: 'La NASA va comunicar en desembre que el <a href="https://www.nasa.gov/missions/roman-space-telescope/nasa-completes-nancy-grace-roman-space-telescope-construction/">Nancy Grace Roman Space Telescope</a> havia completat la seua construcció i mantenia opcions de llançament ja a la tardor de 2026. A estes altures de juny, el projecte entra en una fase molt més concreta: menys promesa abstracta i més preparació final per a la campanya de llançament.',
            },
            source: 'NASA',
            url: 'https://www.nasa.gov/missions/roman-space-telescope/nasa-completes-nancy-grace-roman-space-telescope-construction/',
            links: [
              {
                title: {
                  es: 'NASA: construcción completada',
                  en: 'NASA: construction completed',
                  val: 'NASA: construcció completada',
                },
                url: 'https://www.nasa.gov/missions/roman-space-telescope/nasa-completes-nancy-grace-roman-space-telescope-construction/',
              },
              {
                title: {
                  es: 'Ficha de misión Roman',
                  en: 'Roman mission page',
                  val: 'Fitxa de la missió Roman',
                },
                url: 'https://science.nasa.gov/mission/roman-space-telescope/',
              },
            ],
          },
          {
            title: {
              es: 'Roman llega a Kennedy y el lanzamiento ya tiene ventana tangible',
              en: 'Roman arrives at Kennedy and its launch window becomes tangible',
              val: 'Roman arriba a Kennedy i la seua finestra de llançament ja és tangible',
            },
            summary: {
              es: 'La propia NASA abrió acreditaciones para cubrir la llegada de Roman al Centro Espacial Kennedy en <a href="https://www.nasa.gov/news-release/nasa-invites-media-to-see-roman-space-telescope-arrive-at-kennedy/">junio de 2026</a>. Es una señal importante: el telescopio ya no vive solo en notas de laboratorio, sino en la recta logística que precede a pruebas finales y lanzamiento.',
              en: 'NASA itself opened media registration to cover Roman’s arrival at Kennedy Space Center in <a href="https://www.nasa.gov/news-release/nasa-invites-media-to-see-roman-space-telescope-arrive-at-kennedy/">June 2026</a>. That matters because the telescope is no longer just a lab milestone; it is entering the logistical stretch that leads into final tests and launch.',
              val: 'La mateixa NASA va obrir acreditacions per a cobrir l’arribada de Roman al Centre Espacial Kennedy en <a href="https://www.nasa.gov/news-release/nasa-invites-media-to-see-roman-space-telescope-arrive-at-kennedy/">juny de 2026</a>. És un senyal important: el telescopi ja no viu només en notes de laboratori, sinó en la recta logística que precedix les proves finals i el llançament.',
            },
            source: 'NASA',
            url: 'https://www.nasa.gov/news-release/nasa-invites-media-to-see-roman-space-telescope-arrive-at-kennedy/',
            links: [
              {
                title: {
                  es: 'Llegada de Roman a Kennedy',
                  en: 'Roman arrival at Kennedy',
                  val: 'Arribada de Roman a Kennedy',
                },
                url: 'https://www.nasa.gov/news-release/nasa-invites-media-to-see-roman-space-telescope-arrive-at-kennedy/',
              },
            ],
          },
        ],
      },
      {
        category: 'economia',
        items: [
          {
            title: {
              es: 'Bitcoin cae a la zona de 58.000$ y desmiente el relato de los 68.000$',
              en: 'Bitcoin drops into the $58K zone and disproves the $68K narrative',
              val: 'Bitcoin cau a la zona dels 58.000$ i desmentix el relat dels 68.000$',
            },
            summary: {
              es: 'Los datos del 25 de junio muestran un panorama bastante más débil de lo que reflejaba el post roto. <a href="https://www.coindesk.com/markets/2026/06/25/bitcoin-plunges-to-new-multi-year-low-of-usd58-000-but-a-short-squeeze-setup-emerges">CoinDesk</a> situó a Bitcoin en una caída rápida hasta los 58.000 dólares, mientras Yahoo y Fortune lo seguían moviendo alrededor de 61.000 por la mañana. El ángulo correcto del día no era fuerza, sino presión bajista y posible rebote técnico.',
              en: 'June 25 data shows a much weaker market than the broken post suggested. <a href="https://www.coindesk.com/markets/2026/06/25/bitcoin-plunges-to-new-multi-year-low-of-usd58-000-but-a-short-squeeze-setup-emerges">CoinDesk</a> tracked Bitcoin plunging to $58,000, while Yahoo and Fortune had it around $61,000 earlier in the day. The right angle for the date was not strength but downside pressure and the possibility of a technical bounce.',
              val: 'Les dades del 25 de juny mostren un panorama molt més dèbil del que reflectia el post trencat. <a href="https://www.coindesk.com/markets/2026/06/25/bitcoin-plunges-to-new-multi-year-low-of-usd58-000-but-a-short-squeeze-setup-emerges">CoinDesk</a> va situar Bitcoin en una caiguda ràpida fins als 58.000 dòlars, mentre Yahoo i Fortune el seguien movent al voltant dels 61.000 durant el matí. L’angle correcte del dia no era força, sinó pressió baixista i possible rebot tècnic.',
            },
            source: 'CoinDesk / Yahoo Finance / Fortune',
            url: 'https://www.coindesk.com/markets/2026/06/25/bitcoin-plunges-to-new-multi-year-low-of-usd58-000-but-a-short-squeeze-setup-emerges',
            links: [
              {
                title: {
                  es: 'CoinDesk: caída a 58.000$',
                  en: 'CoinDesk: drop to $58K',
                  val: 'CoinDesk: caiguda a 58.000$',
                },
                url: 'https://www.coindesk.com/markets/2026/06/25/bitcoin-plunges-to-new-multi-year-low-of-usd58-000-but-a-short-squeeze-setup-emerges',
              },
              {
                title: {
                  es: 'Fortune: precio del 25 de junio',
                  en: 'Fortune: June 25 price',
                  val: 'Fortune: preu del 25 de juny',
                },
                url: 'https://fortune.com/article/price-of-bitcoin-06-25-2026/',
              },
            ],
          },
          {
            title: {
              es: 'El INE publica la Encuesta Industrial de Productos de 2025 con Aragón liderando el avance',
              en: 'INE releases the 2025 Industrial Products Survey with Aragón leading growth',
              val: 'L’INE publica l’Enquesta Industrial de Productes de 2025 amb Aragó liderant l’avanç',
            },
            summary: {
              es: 'El Instituto Nacional de Estadística ha publicado la <a href="https://www.ine.es">Encuesta Industrial de Productos</a> de 2025, con Aragón marcando el mayor incremento interanual y Asturias el menor entre las comunidades destacadas en la nota de difusión. No es una noticia vistosa, pero sí una foto útil de la base productiva española en un momento de mucha atención puesta sobre energía, costes e industria.',
              en: 'Spain’s National Statistics Institute has released the <a href="https://www.ine.es">2025 Industrial Products Survey</a>, with Aragón posting the strongest year-on-year increase and Asturias the weakest among the regions highlighted in the release. It is not flashy, but it is a useful snapshot of Spain’s production base at a time when energy, costs and industry are under heavy scrutiny.',
              val: 'L’Institut Nacional d’Estadística ha publicat l’<a href="https://www.ine.es">Enquesta Industrial de Productes</a> de 2025, amb Aragó registrant el major increment interanual i Astúries el menor entre les comunitats destacades en la nota. No és una notícia vistosa, però sí una foto útil de la base productiva espanyola en un moment de molta atenció posada sobre energia, costos i indústria.',
            },
            source: 'INE',
            url: 'https://www.ine.es',
            links: [
              {
                title: {
                  es: 'INE',
                  en: 'INE',
                  val: 'INE',
                },
                url: 'https://www.ine.es',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    date: '2026-06-26',
    title: {
      es: 'FoskIA 26/06: Steam discute la IA visual, Prime y Epic siguen activos y Bitcoin encara el gran vencimiento',
      en: 'FoskIA 26/06: Steam debates visual AI, Prime and Epic stay active, and Bitcoin heads into the big expiry',
      val: 'FoskIA 26/06: Steam discuteix la IA visual, Prime i Epic continuen actius i Bitcoin afronta el gran venciment',
    },
    intro: {
      es: 'El 26 de junio mezcla continuidad y ajuste: las promociones gratis siguen siendo claras, Steam entra otra vez en conversación por la saturación de IA y el mercado cripto afronta un cierre de mes especialmente sensible por el vencimiento de opciones. En paralelo, Roman y la estadística industrial española aportan la parte más estructural del día.',
      en: 'June 26 is about continuity and adjustment: the free-game promos remain clear, Steam returns to the spotlight over AI saturation and the crypto market moves into a particularly sensitive month-end options expiry. In parallel, Roman and Spanish industrial statistics provide the day’s more structural side.',
      val: 'El 26 de juny mescla continuïtat i ajust: les promocions gratis continuen sent clares, Steam entra una altra vegada en conversa per la saturació d’IA i el mercat cripto afronta un tancament de mes especialment sensible pel venciment d’opcions. En paral·lel, Roman i l’estadística industrial espanyola aporten la part més estructural del dia.',
    },
    sections: [
      {
        category: 'gaming',
        items: [
          {
            title: {
              es: 'Steam Next Fest deja una pista incómoda: la IA ya llena escaparates, pero no lidera demos',
              en: 'Steam Next Fest leaves an awkward clue: AI fills storefronts, but not top demos',
              val: 'Steam Next Fest deixa una pista incòmoda: la IA ja ompli aparadors, però no lidera demos',
            },
            summary: {
              es: 'Otra pieza de <a href="https://www.pcgamer.com/gaming-industry/steam-next-fests-top-played-games-include-only-1-of-over-500-demos-with-an-ai-disclosure/">PC Gamer</a> destaca que, entre más de 500 demos con divulgación de IA, solo una consiguió colarse entre las más jugadas de Steam Next Fest. El dato no significa que la IA “no funcione”, pero sí sugiere que el volumen de contenido generado no se traduce automáticamente en interés real del jugador.',
              en: 'Another <a href="https://www.pcgamer.com/gaming-industry/steam-next-fests-top-played-games-include-only-1-of-over-500-demos-with-an-ai-disclosure/">PC Gamer</a> report notes that among more than 500 demos carrying AI disclosures, only one reached Steam Next Fest’s most-played ranks. That does not mean AI “doesn’t work,” but it does suggest that generated volume does not automatically turn into real player interest.',
              val: 'Una altra peça de <a href="https://www.pcgamer.com/gaming-industry/steam-next-fests-top-played-games-include-only-1-of-over-500-demos-with-an-ai-disclosure/">PC Gamer</a> destaca que, entre més de 500 demos amb divulgació d’IA, només una va aconseguir colar-se entre les més jugades de Steam Next Fest. La dada no significa que la IA “no funcione”, però sí que suggerix que el volum de contingut generat no es traduïx automàticament en interés real del jugador.',
            },
            source: 'PC Gamer',
            url: 'https://www.pcgamer.com/gaming-industry/steam-next-fests-top-played-games-include-only-1-of-over-500-demos-with-an-ai-disclosure/',
            links: [
              {
                title: {
                  es: 'PC Gamer: Steam Next Fest e IA',
                  en: 'PC Gamer: Steam Next Fest and AI',
                  val: 'PC Gamer: Steam Next Fest i IA',
                },
                url: 'https://www.pcgamer.com/gaming-industry/steam-next-fests-top-played-games-include-only-1-of-over-500-demos-with-an-ai-disclosure/',
              },
            ],
          },
          {
            title: {
              es: 'Game Pass remata el mes con Jurassic World Evolution 3, ESO y Final Fantasy VI',
              en: 'Game Pass closes the month with Jurassic World Evolution 3, ESO and Final Fantasy VI',
              val: 'Game Pass remata el mes amb Jurassic World Evolution 3, ESO i Final Fantasy VI',
            },
            summary: {
              es: 'La oleada anunciada por <a href="https://news.xbox.com/en-us/2026/05/19/xbox-game-pass-may-2026-wave-2/">Xbox Wire</a> termina aterrizando con nombres de bastante peso para junio: Jurassic World Evolution 3, The Elder Scrolls Online y Final Fantasy VI. No es una noticia del día 26 en sí misma, pero sí una referencia correcta para explicar el cierre de catálogo de estos días.',
              en: 'The wave announced on <a href="https://news.xbox.com/en-us/2026/05/19/xbox-game-pass-may-2026-wave-2/">Xbox Wire</a> lands with a meaningful late-June trio: Jurassic World Evolution 3, The Elder Scrolls Online and Final Fantasy VI. It is not a June 26 breaking item by itself, but it is the right reference for the service’s late-month lineup.',
              val: 'L’onada anunciada en <a href="https://news.xbox.com/en-us/2026/05/19/xbox-game-pass-may-2026-wave-2/">Xbox Wire</a> acaba aterrant amb noms de prou pes per a juny: Jurassic World Evolution 3, The Elder Scrolls Online i Final Fantasy VI. No és una notícia del dia 26 per si mateixa, però sí una referència correcta per a explicar el tancament de catàleg d’estos dies.',
            },
            source: 'Xbox Wire',
            url: 'https://news.xbox.com/en-us/2026/05/19/xbox-game-pass-may-2026-wave-2/',
            links: [
              {
                title: {
                  es: 'Xbox Wire',
                  en: 'Xbox Wire',
                  val: 'Xbox Wire',
                },
                url: 'https://news.xbox.com/en-us/2026/05/19/xbox-game-pass-may-2026-wave-2/',
              },
              {
                title: {
                  es: 'Pure Xbox: calendario de junio',
                  en: 'Pure Xbox: June lineup',
                  val: 'Pure Xbox: calendari de juny',
                },
                url: 'https://www.purexbox.com/guides/xbox-game-pass-all-games-coming-soon-in-june-2026',
              },
            ],
          },
        ],
      },
      {
        category: 'gratis',
        items: [
          {
            title: {
              es: 'La rotación de Epic sigue igual de limpia un día después',
              en: 'Epic’s rotation remains just as clear a day later',
              val: 'La rotació d’Epic continua igual de clara un dia després',
            },
            summary: {
              es: 'Un día después del relevo, RollerCoaster Tycoon 3 y Voidwrought siguen siendo la referencia principal de gratis en PC. Es un bloque fácil de recomendar porque no depende de suscripción adicional y la fecha límite sigue bien definida en la <a href="https://store.epicgames.com/free-games">tienda oficial</a>.',
              en: 'One day after the swap, RollerCoaster Tycoon 3 and Voidwrought remain the clearest PC freebie reference. It is an easy recommendation because it requires no extra subscription and the deadline remains clearly stated on the <a href="https://store.epicgames.com/free-games">official store</a>.',
              val: 'Un dia després del relleu, RollerCoaster Tycoon 3 i Voidwrought continuen sent la referència principal de gratis en PC. És un bloc fàcil de recomanar perquè no depén de subscripció addicional i la data límit continua ben definida en la <a href="https://store.epicgames.com/free-games">botiga oficial</a>.',
            },
            platform: 'Epic Games Store',
            until: {
              es: '2 de julio de 2026, 17:00 CEST',
              en: 'July 2, 2026, 3:00 PM UTC',
              val: '2 de juliol de 2026, 17.00 CEST',
            },
            urgent: true,
            source: 'Epic Games Store',
            url: 'https://store.epicgames.com/free-games',
            links: [
              {
                title: {
                  es: 'Epic: juegos gratis',
                  en: 'Epic: free games',
                  val: 'Epic: jocs gratis',
                },
                url: 'https://store.epicgames.com/free-games',
              },
            ],
          },
          {
            title: {
              es: 'Prime Gaming mantiene activa la tanda con Space Grunts, Lost Eidolons y Terraforming Mars',
              en: 'Prime Gaming keeps the Space Grunts, Lost Eidolons and Terraforming Mars batch live',
              val: 'Prime Gaming manté activa la tanda amb Space Grunts, Lost Eidolons i Terraforming Mars',
            },
            summary: {
              es: 'La actualización del 25 sigue plenamente vigente el 26: Space Grunts: Chrono Shard, Lost Eidolons: Veil of the Witch y Terraforming Mars continúan disponibles dentro del lote de junio. Para una sección de “gratis”, es más honesto mantener la referencia al hub oficial que inventar una fecha universal que cada plataforma no comparte.',
              en: 'The June 25 refresh is still fully relevant on the 26th: Space Grunts: Chrono Shard, Lost Eidolons: Veil of the Witch and Terraforming Mars remain part of the live monthly batch. For a freebies section, it is more honest to point readers to the official hub than to invent a universal deadline that each platform does not share.',
              val: 'L’actualització del 25 continua plenament vigent el 26: Space Grunts: Chrono Shard, Lost Eidolons: Veil of the Witch i Terraforming Mars continuen disponibles dins del lot de juny. Per a una secció de “gratis”, és més honest mantindre la referència al hub oficial que inventar una data universal que cada plataforma no compartix.',
            },
            platform: 'Prime Gaming',
            until: {
              es: 'Fechas variables según juego',
              en: 'Varies by game',
              val: 'Dates variables segons joc',
            },
            urgent: false,
            source: 'Prime Gaming',
            url: 'https://gaming.amazon.com/',
            links: [
              {
                title: {
                  es: 'Prime Gaming',
                  en: 'Prime Gaming',
                  val: 'Prime Gaming',
                },
                url: 'https://gaming.amazon.com/',
              },
            ],
          },
        ],
      },
      {
        category: 'codigo',
        items: [
          {
            title: {
              es: 'La experiencia de desarrollador gira hacia IDEs atravesados por IA',
              en: 'Developer experience is shifting toward AI-shaped IDEs',
              val: 'L’experiència de desenvolupador gira cap a IDEs travessats per la IA',
            },
            summary: {
              es: 'En su bloque de “developer experience”, <a href="https://stackoverflow.blog/developer-experience/">Stack Overflow</a> está recogiendo una tendencia clara en junio: la IA ya no se vende solo como complemento, sino como algo que reconfigura el papel del IDE. Eso obliga a revisar hábitos, atajos mentales y hasta qué parte del trabajo sigue siendo verdaderamente humana.',
              en: 'In its “developer experience” section, <a href="https://stackoverflow.blog/developer-experience/">Stack Overflow</a> is documenting a clear June trend: AI is no longer sold merely as an add-on, but as something that reshapes the IDE’s role. That forces a rethink of habits, muscle memory and how much of the work remains genuinely human.',
              val: 'En el seu bloc de “developer experience”, <a href="https://stackoverflow.blog/developer-experience/">Stack Overflow</a> està arreplegant una tendència clara en juny: la IA ja no es ven només com a complement, sinó com alguna cosa que reconfigura el paper de l’IDE. Això obliga a revisar hàbits, automatismes i quina part del treball continua sent realment humana.',
            },
            source: 'Stack Overflow Blog',
            url: 'https://stackoverflow.blog/developer-experience/',
            links: [
              {
                title: {
                  es: 'Developer experience',
                  en: 'Developer experience',
                  val: 'Developer experience',
                },
                url: 'https://stackoverflow.blog/developer-experience/',
              },
            ],
          },
          {
            title: {
              es: 'Sigue creciendo la crítica a los agentes que generan más supervisión que alivio',
              en: 'Criticism keeps growing toward agents that create more supervision than relief',
              val: 'Continua creixent la crítica als agents que generen més supervisió que alleujament',
            },
            summary: {
              es: 'La tesis de la <a href="https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/">fatiga de decisión</a> sigue siendo útil para leer el momento: sí, los agentes ahorran tiempo, pero también multiplican las elecciones pequeñas y los puntos de revisión. En equipos reales, eso puede traducirse en más carga cognitiva si no se delimitan bien responsabilidades y contexto.',
              en: 'The <a href="https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/">decision fatigue</a> argument still fits the moment: yes, agents save time, but they also multiply small choices and review points. In real teams, that can become more cognitive load unless responsibilities and context are tightly scoped.',
              val: 'La tesi de la <a href="https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/">fatiga de decisió</a> continua sent útil per a llegir el moment: sí, els agents estalvien temps, però també multipliquen les xicotetes eleccions i els punts de revisió. En equips reals, això pot traduir-se en més càrrega cognitiva si no es delimiten bé responsabilitats i context.',
            },
            source: 'Stack Overflow Blog',
            url: 'https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/',
            links: [
              {
                title: {
                  es: 'Artículo sobre fatiga de decisión',
                  en: 'Decision fatigue article',
                  val: 'Article sobre fatiga de decisió',
                },
                url: 'https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/',
              },
            ],
          },
        ],
      },
      {
        category: 'ciencia',
        items: [
          {
            title: {
              es: 'Roman ya se prepara con ventana de lanzamiento concreta para 2026',
              en: 'Roman is already moving toward a concrete 2026 launch window',
              val: 'Roman ja es prepara amb una finestra de llançament concreta per a 2026',
            },
            summary: {
              es: 'La página “<a href="https://science.nasa.gov/missions/roman-space-telescope/building-roman/">Building Roman</a>” llega a dar una fecha concreta de referencia para el observatorio: 30 de agosto de 2026. En ciencia espacial eso no equivale a certeza absoluta, pero sí muestra que el proyecto ha salido del terreno difuso y entra en calendario operativo real.',
              en: 'The “<a href="https://science.nasa.gov/missions/roman-space-telescope/building-roman/">Building Roman</a>” page goes as far as giving the observatory a concrete reference date: August 30, 2026. In space science that never means absolute certainty, but it does show the mission has left the vague zone and entered a real operational calendar.',
              val: 'La pàgina “<a href="https://science.nasa.gov/missions/roman-space-telescope/building-roman/">Building Roman</a>” arriba a donar una data concreta de referència per a l’observatori: 30 d’agost de 2026. En ciència espacial això no equival a certesa absoluta, però sí que mostra que el projecte ha eixit del terreny difús i entra en calendari operatiu real.',
            },
            source: 'NASA Science',
            url: 'https://science.nasa.gov/missions/roman-space-telescope/building-roman/',
            links: [
              {
                title: {
                  es: 'Building Roman',
                  en: 'Building Roman',
                  val: 'Building Roman',
                },
                url: 'https://science.nasa.gov/missions/roman-space-telescope/building-roman/',
              },
            ],
          },
          {
            title: {
              es: 'La misión Roman mantiene su promesa de mapear cielo profundo a escala Hubble x100',
              en: 'The Roman mission keeps its promise of Hubble-scale deep-sky mapping times 100',
              val: 'La missió Roman manté la promesa de mapar cel profund a escala Hubble x100',
            },
            summary: {
              es: 'La ficha oficial de la misión recuerda que Roman tendrá un campo de visión al menos cien veces mayor que el Hubble. Ese dato explica por qué sigue apareciendo en la conversación científica incluso antes del despegue: no es “otro telescopio”, sino una plataforma pensada para barrer grandes porciones de cielo con mucha más eficiencia.',
              en: 'The official mission page reminds readers that Roman will have a field of view at least one hundred times larger than Hubble’s. That explains why it remains in the science conversation even before launch: it is not “just another telescope,” but a platform built to sweep huge portions of the sky far more efficiently.',
              val: 'La fitxa oficial de la missió recorda que Roman tindrà un camp de visió almenys cent vegades major que el de l’Hubble. Això explica per què continua apareixent en la conversa científica fins i tot abans de l’enlairament: no és “un altre telescopi”, sinó una plataforma pensada per a rastrejar grans porcions de cel amb molta més eficiència.',
            },
            source: 'NASA Science',
            url: 'https://science.nasa.gov/mission/roman-space-telescope/',
            links: [
              {
                title: {
                  es: 'Ficha de misión Roman',
                  en: 'Roman mission page',
                  val: 'Fitxa de la missió Roman',
                },
                url: 'https://science.nasa.gov/mission/roman-space-telescope/',
              },
            ],
          },
        ],
      },
      {
        category: 'economia',
        items: [
          {
            title: {
              es: 'Bitcoin llega al 26 con el mercado mirando un vencimiento de opciones de 10.600 millones',
              en: 'Bitcoin reaches June 26 with markets watching a $10.6B options expiry',
              val: 'Bitcoin arriba al 26 amb el mercat mirant un venciment d’opcions de 10.600 milions',
            },
            summary: {
              es: '<a href="https://www.coindesk.com/markets/2026/06/17/bitcoin-s-june-downturn-leaves-usd8-6-billion-in-options-out-of-the-money">CoinDesk</a> había advertido que el vencimiento del 26 de junio concentraba 10.600 millones de dólares en opciones de BTC y dejaba 8.600 millones fuera del dinero. Sumado al precio de unos 58.980 dólares que recogían Fortune y Yahoo durante la jornada, el contexto seguía siendo de tensión, no de consolidación alcista.',
              en: '<a href="https://www.coindesk.com/markets/2026/06/17/bitcoin-s-june-downturn-leaves-usd8-6-billion-in-options-out-of-the-money">CoinDesk</a> had already warned that the June 26 expiry packed $10.6 billion in BTC options and left $8.6 billion out of the money. Combined with the roughly $58,980 price tracked by Fortune and Yahoo during the day, the setup remained one of stress rather than bullish consolidation.',
              val: '<a href="https://www.coindesk.com/markets/2026/06/17/bitcoin-s-june-downturn-leaves-usd8-6-billion-in-options-out-of-the-money">CoinDesk</a> ja havia advertit que el venciment del 26 de juny concentrava 10.600 milions de dòlars en opcions de BTC i deixava 8.600 milions fora dels diners. Sumant-li el preu d’uns 58.980 dòlars que arreplegaven Fortune i Yahoo durant la jornada, el context continuava sent de tensió, no de consolidació alcista.',
            },
            source: 'CoinDesk / Fortune / Yahoo Finance',
            url: 'https://www.coindesk.com/markets/2026/06/17/bitcoin-s-june-downturn-leaves-usd8-6-billion-in-options-out-of-the-money',
            links: [
              {
                title: {
                  es: 'CoinDesk: vencimiento de opciones',
                  en: 'CoinDesk: options expiry',
                  val: 'CoinDesk: venciment d’opcions',
                },
                url: 'https://www.coindesk.com/markets/2026/06/17/bitcoin-s-june-downturn-leaves-usd8-6-billion-in-options-out-of-the-money',
              },
              {
                title: {
                  es: 'Fortune: precio del 26 de junio',
                  en: 'Fortune: June 26 price',
                  val: 'Fortune: preu del 26 de juny',
                },
                url: 'https://fortune.com/article/price-of-bitcoin-06-26-2026/',
              },
            ],
          },
          {
            title: {
              es: 'La estadística industrial española pone algo de suelo en una semana de mucho ruido',
              en: 'Spanish industrial data provides some footing in a noisy week',
              val: 'L’estadística industrial espanyola posa un poc de sòl en una setmana de molt de soroll',
            },
            summary: {
              es: 'Entre tanta volatilidad de mercado, la publicación del INE aporta una referencia bastante más estable sobre producción real. La Encuesta Industrial de Productos 2025 no domina titulares globales, pero sí ayuda a leer qué parte de la economía sigue moviéndose por debajo del ruido financiero diario.',
              en: 'Amid all the market volatility, the INE release provides a far more stable reference point around real production. The 2025 Industrial Products Survey does not dominate global headlines, but it does help show which part of the economy keeps moving beneath daily financial noise.',
              val: 'Entre tanta volatilitat de mercat, la publicació de l’INE aporta una referència molt més estable sobre producció real. L’Enquesta Industrial de Productes 2025 no domina titulars globals, però sí que ajuda a llegir quina part de l’economia continua movent-se per davall del soroll financer diari.',
            },
            source: 'INE',
            url: 'https://www.ine.es',
            links: [
              {
                title: {
                  es: 'INE',
                  en: 'INE',
                  val: 'INE',
                },
                url: 'https://www.ine.es',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    date: '2026-06-27',
    title: {
      es: 'FoskIA 27/06: fin de semana de seguimiento para Epic, Roman, Steam e IA mientras Bitcoin rebota hacia 60.000$',
      en: 'FoskIA 27/06: a weekend follow-up for Epic, Roman, Steam and AI as Bitcoin rebounds toward $60K',
      val: 'FoskIA 27/06: cap de setmana de seguiment per a Epic, Roman, Steam i IA mentre Bitcoin rebota cap als 60.000$',
    },
    intro: {
      es: 'El 27 de junio no pedía inventar un gran terremoto informativo, sino ordenar bien lo que seguía vivo: Epic mantiene la rotación, Prime sigue útil, Steam continúa discutiendo la avalancha de IA y Bitcoin intenta rebotar tras varios días malos. La edición correcta del viernes es más de seguimiento que de humo.',
      en: 'June 27 did not need an invented information earthquake; it needed a clean follow-up on what was still active: Epic keeps the rotation live, Prime remains useful, Steam is still arguing over AI saturation and Bitcoin tries to bounce after several rough sessions. The right Friday edition is about tracking, not smoke.',
      val: 'El 27 de juny no demanava inventar un gran terratrémol informatiu, sinó ordenar bé el que continuava viu: Epic manté la rotació, Prime continua útil, Steam seguix discutint l’allau d’IA i Bitcoin intenta rebotar després de diversos dies roïns. L’edició correcta del divendres és més de seguiment que de fum.',
    },
    sections: [
      {
        category: 'gaming',
        items: [
          {
            title: {
              es: 'Solo una demo con divulgación de IA logra colarse entre las más jugadas de Steam Next Fest',
              en: 'Only one AI-disclosed demo breaks into Steam Next Fest’s most-played list',
              val: 'Només una demo amb divulgació d’IA aconseguix colar-se entre les més jugades de Steam Next Fest',
            },
            summary: {
              es: 'La lectura del dato sigue siendo igual de buena el día 27: la abundancia de proyectos con IA en Steam no se está traduciendo automáticamente en tracción alta. Para FoskIA esto importa porque diferencia entre “mucho ruido de escaparate” y “interés real del público”, que no siempre van de la mano.',
              en: 'The reading still holds on the 27th: the abundance of AI-linked projects on Steam is not automatically turning into top-tier traction. For FoskIA, that matters because it separates “a lot of storefront noise” from “real audience interest,” which are not always the same thing.',
              val: 'La lectura de la dada continua sent igual de bona el dia 27: l’abundància de projectes amb IA en Steam no s’està traduint automàticament en tracció alta. Per a FoskIA això importa perquè diferencia entre “molt de soroll d’aparador” i “interés real del públic”, que no sempre van de la mà.',
            },
            source: 'PC Gamer',
            url: 'https://www.pcgamer.com/gaming-industry/steam-next-fests-top-played-games-include-only-1-of-over-500-demos-with-an-ai-disclosure/',
            links: [
              {
                title: {
                  es: 'PC Gamer: Steam Next Fest e IA',
                  en: 'PC Gamer: Steam Next Fest and AI',
                  val: 'PC Gamer: Steam Next Fest i IA',
                },
                url: 'https://www.pcgamer.com/gaming-industry/steam-next-fests-top-played-games-include-only-1-of-over-500-demos-with-an-ai-disclosure/',
              },
            ],
          },
          {
            title: {
              es: 'Tim Sweeney defiende la IA como herramienta de producción, no como estigma automático',
              en: 'Tim Sweeney defends AI as a production tool, not an automatic stigma',
              val: 'Tim Sweeney defensa la IA com a eina de producció, no com a estigma automàtic',
            },
            summary: {
              es: 'En su conversación con <a href="https://www.pcgamer.com/gaming-industry/tim-sweeney-on-the-future-of-games-ai-and-whether-valve-will-ever-join-forces-with-epic-its-now-clear-that-nobodys-going-to-end-up-with-an-absolute-monopoly/">PC Gamer</a>, Tim Sweeney plantea que el problema no es la IA en sí, sino cómo se entrena y se presenta. La entrevista encaja bien con la semana porque refleja el choque entre dos visiones: la IA como ahorro de trabajo interno y la IA como ruido visible que daña confianza en tiendas como Steam.',
              en: 'In his conversation with <a href="https://www.pcgamer.com/gaming-industry/tim-sweeney-on-the-future-of-games-ai-and-whether-valve-will-ever-join-forces-with-epic-its-now-clear-that-nobodys-going-to-end-up-with-an-absolute-monopoly/">PC Gamer</a>, Tim Sweeney argues that the problem is not AI itself but how it is trained and presented. It fits the week well because it captures the clash between two views: AI as internal productivity gain and AI as visible noise that hurts trust on storefronts like Steam.',
              val: 'En la seua conversa amb <a href="https://www.pcgamer.com/gaming-industry/tim-sweeney-on-the-future-of-games-ai-and-whether-valve-will-ever-join-forces-with-epic-its-now-clear-that-nobodys-going-to-end-up-with-an-absolute-monopoly/">PC Gamer</a>, Tim Sweeney planteja que el problema no és la IA en si, sinó com s’entrena i es presenta. L’entrevista encaixa bé amb la setmana perquè reflectix el xoc entre dos visions: la IA com a estalvi de treball intern i la IA com a soroll visible que danya la confiança en botigues com Steam.',
            },
            source: 'PC Gamer',
            url: 'https://www.pcgamer.com/gaming-industry/tim-sweeney-on-the-future-of-games-ai-and-whether-valve-will-ever-join-forces-with-epic-its-now-clear-that-nobodys-going-to-end-up-with-an-absolute-monopoly/',
            links: [
              {
                title: {
                  es: 'Entrevista a Tim Sweeney',
                  en: 'Tim Sweeney interview',
                  val: 'Entrevista a Tim Sweeney',
                },
                url: 'https://www.pcgamer.com/gaming-industry/tim-sweeney-on-the-future-of-games-ai-and-whether-valve-will-ever-join-forces-with-epic-its-now-clear-that-nobodys-going-to-end-up-with-an-absolute-monopoly/',
              },
            ],
          },
        ],
      },
      {
        category: 'gratis',
        items: [
          {
            title: {
              es: 'Epic encara el fin de semana con RollerCoaster Tycoon 3 y Voidwrought como reclamos principales',
              en: 'Epic heads into the weekend with RollerCoaster Tycoon 3 and Voidwrought as its main claims',
              val: 'Epic enceta el cap de setmana amb RollerCoaster Tycoon 3 i Voidwrought com a reclams principals',
            },
            summary: {
              es: 'De cara al fin de semana, la recomendación gratis más directa sigue siendo la misma: entrar en la <a href="https://store.epicgames.com/free-games">rotación semanal de Epic</a> y reclamar ambos juegos antes del 2 de julio. No hay que adornarlo más: es un buen bloque y tiene fecha clara.',
              en: 'Heading into the weekend, the clearest free recommendation stays the same: hit the <a href="https://store.epicgames.com/free-games">weekly Epic rotation</a> and claim both games before July 2. It does not need extra decoration: it is a solid bundle with a clear deadline.',
              val: 'De cara al cap de setmana, la recomanació gratis més directa continua sent la mateixa: entrar en la <a href="https://store.epicgames.com/free-games">rotació setmanal d’Epic</a> i reclamar els dos jocs abans del 2 de juliol. No cal adornar-ho més: és un bon bloc i té data clara.',
            },
            platform: 'Epic Games Store',
            until: {
              es: '2 de julio de 2026, 17:00 CEST',
              en: 'July 2, 2026, 3:00 PM UTC',
              val: '2 de juliol de 2026, 17.00 CEST',
            },
            urgent: true,
            source: 'Epic Games Store',
            url: 'https://store.epicgames.com/free-games',
            links: [
              {
                title: {
                  es: 'Epic: juegos gratis',
                  en: 'Epic: free games',
                  val: 'Epic: jocs gratis',
                },
                url: 'https://store.epicgames.com/free-games',
              },
            ],
          },
          {
            title: {
              es: 'Prime Gaming sigue siendo el complemento útil para cerrar junio',
              en: 'Prime Gaming remains the useful complement for closing June',
              val: 'Prime Gaming continua sent el complement útil per a tancar juny',
            },
            summary: {
              es: 'Para quien ya pague Prime, el hub de <a href="https://gaming.amazon.com/">Prime Gaming</a> sigue ofreciendo una segunda capa de regalos bastante más tranquila que Epic, pero igualmente aprovechable. El valor aquí no está en la urgencia brutal, sino en revisar bien cada launcher y no dejar códigos sin reclamar.',
              en: 'For anyone already paying for Prime, the <a href="https://gaming.amazon.com/">Prime Gaming</a> hub still offers a calmer second layer of free claims than Epic, but one that is still worth using. The value here is not extreme urgency; it is checking each launcher carefully and not leaving codes unclaimed.',
              val: 'Per a qui ja pague Prime, el hub de <a href="https://gaming.amazon.com/">Prime Gaming</a> continua oferint una segona capa de regals molt més tranquil·la que Epic, però igualment aprofitable. El valor ací no està en la urgència brutal, sinó en revisar bé cada launcher i no deixar codis sense reclamar.',
            },
            platform: 'Prime Gaming',
            until: {
              es: 'Fechas variables según juego',
              en: 'Varies by game',
              val: 'Dates variables segons joc',
            },
            urgent: false,
            source: 'Prime Gaming',
            url: 'https://gaming.amazon.com/',
            links: [
              {
                title: {
                  es: 'Prime Gaming',
                  en: 'Prime Gaming',
                  val: 'Prime Gaming',
                },
                url: 'https://gaming.amazon.com/',
              },
            ],
          },
        ],
      },
      {
        category: 'codigo',
        items: [
          {
            title: {
              es: 'La IA redefine el IDE, pero no elimina la necesidad de criterio técnico',
              en: 'AI is redefining the IDE, but not removing the need for technical judgment',
              val: 'La IA redefinix l’IDE, però no elimina la necessitat de criteri tècnic',
            },
            summary: {
              es: 'La conversación de junio sobre developer experience insiste en que el IDE del futuro próximo será mucho más conversacional y asistido. Aun así, lo que más se repite en voces expertas es justo lo contrario del “piloto automático total”: revisar, seleccionar y entender sigue siendo la parte valiosa del trabajo.',
              en: 'June’s developer-experience conversation keeps insisting that the near-future IDE will be far more conversational and assisted. Even so, the most consistent expert takeaway runs against the “full autopilot” fantasy: review, selection and understanding remain the valuable part of the work.',
              val: 'La conversa de juny sobre developer experience insistix que l’IDE del futur pròxim serà molt més conversacional i assistit. Així i tot, el que més es repetix en veus expertes és just el contrari del “pilot automàtic total”: revisar, seleccionar i entendre continua sent la part valuosa del treball.',
            },
            source: 'Stack Overflow Blog',
            url: 'https://stackoverflow.blog/developer-experience/',
            links: [
              {
                title: {
                  es: 'Developer experience',
                  en: 'Developer experience',
                  val: 'Developer experience',
                },
                url: 'https://stackoverflow.blog/developer-experience/',
              },
            ],
          },
          {
            title: {
              es: 'La productividad con agentes depende de límites claros, no de cantidad de sugerencias',
              en: 'Agent productivity depends on clear limits, not on suggestion volume',
              val: 'La productivitat amb agents depén de límits clars, no de quantitat de suggeriments',
            },
            summary: {
              es: 'El mejor resumen del momento sigue siendo simple: más asistentes no siempre equivalen a más velocidad. Sin recorte de contexto, responsabilidades y ruido, el supuesto ahorro se puede convertir en revisión infinita. Esa es precisamente la alerta que están verbalizando varios textos recientes del ecosistema dev.',
              en: 'The best summary of the moment is still simple: more assistants do not always equal more speed. Without tight context, clear responsibilities and less noise, the supposed time-saving turns into endless review. That is exactly the warning several recent dev-ecosystem pieces are now spelling out.',
              val: 'El millor resum del moment continua sent simple: més assistents no sempre equivalen a més velocitat. Sense retall de context, responsabilitats i soroll, el suposat estalvi es pot convertir en revisió infinita. Eixa és precisament l’alerta que estan verbalitzant diversos textos recents de l’ecosistema dev.',
            },
            source: 'Stack Overflow Blog',
            url: 'https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/',
            links: [
              {
                title: {
                  es: 'Fatiga de decisión',
                  en: 'Decision fatigue',
                  val: 'Fatiga de decisió',
                },
                url: 'https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/',
              },
            ],
          },
        ],
      },
      {
        category: 'ciencia',
        items: [
          {
            title: {
              es: 'Roman cierra junio con calendario creíble y expectativa alta',
              en: 'Roman closes June with a credible schedule and high expectations',
              val: 'Roman tanca juny amb calendari creïble i expectativa alta',
            },
            summary: {
              es: 'Entre la construcción completada, la llegada a Kennedy y la fecha de referencia que maneja NASA Science, Roman cierra junio como uno de los proyectos espaciales más fáciles de seguir sin exageración. Hay hitos reales, fechas concretas y una misión con impacto científico muy visible.',
              en: 'Between completed construction, the arrival at Kennedy and the reference date used by NASA Science, Roman closes June as one of the easiest space projects to track without exaggeration. It has real milestones, concrete dates and a mission with very visible scientific impact.',
              val: 'Entre la construcció completada, l’arribada a Kennedy i la data de referència que maneja NASA Science, Roman tanca juny com un dels projectes espacials més fàcils de seguir sense exageració. Hi ha fites reals, dates concretes i una missió amb impacte científic molt visible.',
            },
            source: 'NASA / NASA Science',
            url: 'https://science.nasa.gov/missions/roman-space-telescope/building-roman/',
            links: [
              {
                title: {
                  es: 'Building Roman',
                  en: 'Building Roman',
                  val: 'Building Roman',
                },
                url: 'https://science.nasa.gov/missions/roman-space-telescope/building-roman/',
              },
              {
                title: {
                  es: 'Llegada a Kennedy',
                  en: 'Arrival at Kennedy',
                  val: 'Arribada a Kennedy',
                },
                url: 'https://www.nasa.gov/news-release/nasa-invites-media-to-see-roman-space-telescope-arrive-at-kennedy/',
              },
            ],
          },
          {
            title: {
              es: 'El tamaño del campo de visión de Roman sigue siendo su carta más fuerte',
              en: 'Roman’s field of view remains its strongest card',
              val: 'La grandària del camp de visió de Roman continua sent la seua carta més forta',
            },
            summary: {
              es: 'La misión no solo interesa por cuándo despega, sino por lo que podrá observar al arrancar: un campo de visión cien veces superior al de Hubble cambia la escala del trabajo astronómico. Es una buena forma de cerrar la semana científica sin caer en titulares inflados.',
              en: 'The mission matters not only because of when it launches, but because of what it will see once it does: a field of view one hundred times larger than Hubble’s changes the scale of astronomical work. It is a good way to close the science week without inflated headlines.',
              val: 'La missió no interessa només per quan despega, sinó pel que podrà observar quan comence: un camp de visió cent vegades superior al de Hubble canvia l’escala del treball astronòmic. És una bona manera de tancar la setmana científica sense caure en titulars inflats.',
            },
            source: 'NASA Science',
            url: 'https://science.nasa.gov/mission/roman-space-telescope/',
            links: [
              {
                title: {
                  es: 'Ficha de misión Roman',
                  en: 'Roman mission page',
                  val: 'Fitxa de la missió Roman',
                },
                url: 'https://science.nasa.gov/mission/roman-space-telescope/',
              },
            ],
          },
        ],
      },
      {
        category: 'economia',
        items: [
          {
            title: {
              es: 'Bitcoin rebota hacia los 60.300$, pero el contexto sigue siendo frágil',
              en: 'Bitcoin rebounds toward $60,300, but the context remains fragile',
              val: 'Bitcoin rebota cap als 60.300$, però el context continua sent fràgil',
            },
            summary: {
              es: 'Tras el golpe del 25 y la tensión del 26, el 27 deja una lectura algo menos dura: mercados de predicción y rastreadores de precio sitúan a BTC rondando los 60.300 dólares a primera hora de la mañana estadounidense. Aun así, el rebote sabe más a estabilización nerviosa que a recuperación sólida.',
              en: 'After the June 25 hit and the June 26 stress, the 27th brings a slightly softer reading: prediction markets and price trackers place BTC around $60,300 in the early U.S. morning. Even so, the rebound feels more like nervous stabilization than a solid recovery.',
              val: 'Després del colp del 25 i la tensió del 26, el 27 deixa una lectura un poc menys dura: mercats de predicció i rastrejadors de preu situen BTC al voltant dels 60.300 dòlars a primera hora del matí nord-americà. Així i tot, el rebot sona més a estabilització nerviosa que a recuperació sòlida.',
            },
            source: 'Robinhood / market trackers',
            url: 'https://robinhood.com/us/en/prediction-markets/crypto/events/btc-price-on-jun-27-2026-at-7am-edt-jun-26-2026/',
            links: [
              {
                title: {
                  es: 'Mercado de predicción BTC 27/06',
                  en: 'BTC prediction market 06/27',
                  val: 'Mercat de predicció BTC 27/06',
                },
                url: 'https://robinhood.com/us/en/prediction-markets/crypto/events/btc-price-on-jun-27-2026-at-7am-edt-jun-26-2026/',
              },
              {
                title: {
                  es: 'Fortune: precio del 26 de junio',
                  en: 'Fortune: June 26 price',
                  val: 'Fortune: preu del 26 de juny',
                },
                url: 'https://fortune.com/article/price-of-bitcoin-06-26-2026/',
              },
            ],
          },
          {
            title: {
              es: 'La producción industrial sigue siendo una referencia más fiable que el ruido de mercado',
              en: 'Industrial production remains a steadier reference than market noise',
              val: 'La producció industrial continua sent una referència més fiable que el soroll de mercat',
            },
            summary: {
              es: 'Al cerrar la semana, el contraste es claro: frente a la hiperreactividad de cripto y bolsa, las series industriales del INE ayudan a poner pies en el suelo. No capturan el pulso emocional del mercado, pero sí una parte real de la economía que tarda más en girar y dice más sobre estructura.',
              en: 'As the week closes, the contrast is clear: against the hyper-reactivity of crypto and markets, INE industrial series help put feet back on the ground. They do not capture market emotion, but they do capture a real slice of the economy that moves more slowly and says more about structure.',
              val: 'En tancar la setmana, el contrast és clar: davant de la hiperreactivitat de cripto i borsa, les sèries industrials de l’INE ajuden a posar els peus en terra. No capturen el pols emocional del mercat, però sí una part real de l’economia que tarda més a girar i diu més sobre estructura.',
            },
            source: 'INE',
            url: 'https://www.ine.es',
            links: [
              {
                title: {
                  es: 'INE',
                  en: 'INE',
                  val: 'INE',
                },
                url: 'https://www.ine.es',
              },
            ],
          },
        ],
      },
    ],
  },
];

for (const post of posts) {
  post.tags = post.sections.map((section) => section.category);
}

const htmlReplacements = new Map([
  ['Daniel Bort Guzm�n', 'Daniel Bort Guzmán'],
  ['bolet�n diario', 'boletín diario'],
  ['programaci�n', 'programación'],
  ['econom�a', 'economía'],
  ['SUSCRIPCI�N', 'SUSCRIPCIÓN'],
  ['aut�nomo', 'autónomo'],
  ['d�a', 'día'],
  ['�ltimas', 'últimas'],
  ['c�digo', 'código'],
  ['redacci�n', 'redacción'],
  ['ma�ana', 'mañana'],
  ['Autom�tico', 'Automático'],
  ['ediciones�', 'ediciones…'],
  ['�C�mo', '¿Cómo'],
  ['autom�tica', 'automática'],
  ['edici�n', 'edición'],
  ['�En qu� idioma(s) quieres recibirlo?', '¿En qué idioma(s) quieres recibirlo?'],
  ['Sin spam � Puedes darte de baja cuando quieras', 'Sin spam · Puedes darte de baja cuando quieras'],
  ['�Apuntado! Te llegar� la pr�xima edici�n.', '¡Apuntado! Te llegará la próxima edición.'],
  ['� sin manos humanas', '· sin manos humanas'],
  ['C�digo', 'Código'],
  ['Ci�ncia', 'Ciència'],
  ['Econom�a', 'Economía'],
  ['aqu�', 'aquí'],
  ['Abriendo edici�n�', 'Abriendo edición…'],
  ['opening edition�', 'opening edition…'],
  ['Loading editions�', 'Loading editions…'],
  ['bolet�n diario � aut�nomo', 'boletín diario · autónomo'],
  ['Daily briefing � autonomous', 'Daily briefing · autonomous'],
  ['No spam � Unsubscribe anytime', 'No spam · Unsubscribe anytime'],
  ['� no human hands', '· no human hands'],
  ['Butllet� diari � aut�nom', 'Butlletí diari · autònom'],
  ['intel�lig�ncia', 'intel·ligència'],
  ['ci�ncia', 'ciència'],
  ['redacci�', 'redacció'],
  ['mat�', 'matí'],
  ['Autom�tic', 'Automàtic'],
  ['obrir esta edici�.', 'obrir esta edició.'],
  ['An�lisi', 'Anàlisi'],
  ['intervenci� humana', 'intervenció humana'],
  ['� sense mans humanes', '· sense mans humanes'],
  ['enlla�', 'enllaç'],
  ['L\'edici� del dia', 'L’edició del dia'],
  ['Rep FoskIA cada mat�', 'Rep FoskIA cada matí'],
  ['Sense spam � Et pots donar de baixa quan vulgues', 'Sense spam · Et pots donar de baixa quan vulgues'],
  ['Apuntat! Et arribar� la pr�xima edici�.', 'Apuntat! Et arribarà la pròxima edició.'],
  ['n�vol', 'núvol'],
  ['not�cies', 'notícies'],
  ['mar�', 'març'],
  ['S� el primero en comentar.', 'Sé el primero en comentar.'],
  ['Int�ntalo de nuevo.', 'Inténtalo de nuevo.'],
  ['�Eliminar este comentario?', '¿Eliminar este comentario?'],
  ['�Publicado!', '¡Publicado!'],
]);

function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

for (const post of posts) {
  writeJson(path.join(postsDir, `${post.date}.json`), post);
}

const postFiles = readdirSync(postsDir)
  .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
  .sort();

const editions = postFiles
  .map((file) => JSON.parse(readFileSync(path.join(postsDir, file), 'utf8')))
  .sort((a, b) => b.date.localeCompare(a.date));

writeJson(indexJsonPath, { editions });

let html = readFileSync(indexHtmlPath, 'utf8');
for (const [from, to] of htmlReplacements) {
  html = html.split(from).join(to);
}
writeFileSync(indexHtmlPath, html, 'utf8');

console.log(`Regenerated ${posts.length} posts, rebuilt index.json and repaired FoskIA copy.`);
