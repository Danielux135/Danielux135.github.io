// Autoextraído de src/data/demo-hub.js para separar catálogo, copy y reglas.
const t = (es, en = es, val = es) => ({ es, en, val });

export const DEMO_GOALS = [
    { id: 'all', icon: 'fa-layer-group', label: t('Explorar todo', 'Explore all', 'Explorar tot') },
    { id: 'bookings', icon: 'fa-calendar-check', label: t('Conseguir reservas', 'Get bookings', 'Aconseguir reserves') },
    { id: 'sales', icon: 'fa-cart-shopping', label: t('Vender productos', 'Sell products', 'Vendre productes') },
    { id: 'portfolio', icon: 'fa-images', label: t('Mostrar trabajos', 'Show work', 'Mostrar treballs') },
    { id: 'leads', icon: 'fa-bullseye', label: t('Captar contactos', 'Capture leads', 'Captar contactes') },
    { id: 'brand', icon: 'fa-sparkles', label: t('Presentar una marca', 'Present a brand', 'Presentar una marca') },
    { id: 'management', icon: 'fa-chart-simple', label: t('Gestionar información', 'Manage information', 'Gestionar informació') },
];
