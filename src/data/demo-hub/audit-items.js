// Autoextraído de src/data/demo-hub.js para separar catálogo, copy y reglas.
const t = (es, en = es, val = es) => ({ es, en, val });

export const AUDIT_ITEMS = [
    { id: 'mobile', goal: 'leads', short: t('Móvil roto', 'Broken mobile', 'Mòbil trencat'), text: t('En móvil la jerarquía, botones o lectura fallan.', 'On mobile, hierarchy, buttons or readability fail.', 'En mòbil fallen la jerarquia, botons o lectura.') },
    { id: 'cta', goal: 'bookings', short: t('Acción difusa', 'Unclear action', 'Acció difusa'), text: t('El visitante no sabe si reservar, comprar, escribir o mirar más.', 'Visitors do not know whether to book, buy, write or keep browsing.', 'El visitant no sap si reservar, comprar, escriure o mirar més.') },
    { id: 'identity', goal: 'brand', short: t('Marca floja', 'Weak brand', 'Marca fluixa'), text: t('La web parece plantilla y no se reconoce una personalidad propia.', 'The site feels like a template and lacks a recognizable personality.', 'La web sembla plantilla i no es reconeix personalitat pròpia.') },
    { id: 'catalog', goal: 'sales', short: t('Oferta confusa', 'Confusing offer', 'Oferta confusa'), text: t('Productos, precios, servicios o packs no se comparan rápido.', 'Products, prices, services or packages are not easy to compare quickly.', 'Productes, preus, serveis o packs no es comparen ràpid.') },
    { id: 'content', goal: 'portfolio', short: t('Contenido desaprovechado', 'Wasted content', 'Contingut desaprofitat'), text: t('Hay fotos, trabajos o casos, pero no cuentan una historia ni venden confianza.', 'There are photos, work or cases, but they do not tell a story or build trust.', 'Hi ha fotos, treballs o casos, però no conten història ni venen confiança.') },
    { id: 'operations', goal: 'management', short: t('Estructura caótica', 'Chaotic structure', 'Estructura caòtica'), text: t('La web necesita ordenar datos, clientes, tareas, estados o información compleja.', 'The site must organize data, clients, tasks, statuses or complex information.', 'La web ha d’ordenar dades, clients, tasques, estats o informació complexa.') },
];

const commonResponsive = [
    t('CTA principal visible antes de hacer scroll.', 'Main CTA visible before scrolling.', 'CTA principal visible abans de fer scroll.'),
    t('Texto legible y botones táctiles cómodos.', 'Readable text and comfortable touch buttons.', 'Text llegible i botons tàctils còmodes.'),
    t('Sin overflow horizontal en 320px.', 'No horizontal overflow at 320px.', 'Sense overflow horitzontal en 320px.'),
];
