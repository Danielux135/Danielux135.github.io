// Autoextraído de src/data/demo-hub.js para separar catálogo, copy y reglas.
const t = (es, en = es, val = es) => ({ es, en, val });

export const TRANSFORM_PRESETS = {
    sectors: [
        { id: 'restaurant', label: t('Restaurante', 'Restaurant', 'Restaurant'), cta: t('Reservar mesa', 'Book a table', 'Reservar taula'), sections: ['Hero', 'Carta', 'Reservas', 'Galería', 'Ubicación'], palette: '#ff8a3d' },
        { id: 'barbershop', label: t('Barbería', 'Barbershop', 'Barberia'), cta: t('Reservar cita', 'Book appointment', 'Reservar cita'), sections: ['Servicios', 'Precios', 'Equipo', 'Galería', 'Citas'], palette: '#c084fc' },
        { id: 'gym', label: t('Gimnasio', 'Gym', 'Gimnàs'), cta: t('Probar clase', 'Try a class', 'Provar classe'), sections: ['Programas', 'Horarios', 'Entrenadores', 'Planes', 'Contacto'], palette: '#76f7ff' },
        { id: 'photographer', label: t('Fotógrafo', 'Photographer', 'Fotògraf'), cta: t('Ver portfolio', 'View portfolio', 'Veure portfolio'), sections: ['Portfolio', 'Servicios', 'Proceso', 'Testimonios', 'Reserva'], palette: '#f5d0a9' },
        { id: 'academy', label: t('Academia', 'Academy', 'Acadèmia'), cta: t('Pedir información', 'Request info', 'Demanar informació'), sections: ['Cursos', 'Metodología', 'Resultados', 'Profesores', 'Contacto'], palette: '#6bf4ff' },
        { id: 'store', label: t('Tienda', 'Shop', 'Botiga'), cta: t('Ver catálogo', 'View catalog', 'Veure catàleg'), sections: ['Productos', 'Colecciones', 'Carrito', 'Opiniones', 'Envíos'], palette: '#9dd9d2' },
    ],
    tones: [
        { id: 'premium', label: t('Premium', 'Premium', 'Premium'), description: t('Más elegante, espacioso y con copy de alto valor.', 'More elegant, spacious and high-value copy.', 'Més elegant, espaiós i amb copy d’alt valor.') },
        { id: 'urban', label: t('Urbano', 'Urban', 'Urbà'), description: t('Más directo, contraste fuerte y ritmo visual rápido.', 'More direct, strong contrast and fast visual rhythm.', 'Més directe, contrast fort i ritme visual ràpid.') },
        { id: 'minimal', label: t('Minimal', 'Minimal', 'Minimal'), description: t('Menos ruido, más claridad y foco en contenido.', 'Less noise, more clarity and content focus.', 'Menys soroll, més claredat i focus en contingut.') },
        { id: 'gamer', label: t('Gamer', 'Gamer', 'Gamer'), description: t('Neón, energía, microinteracciones y estética más atrevida.', 'Neon, energy, microinteractions and a bolder look.', 'Neó, energia, microinteraccions i estètica més atrevida.') },
    ],
    objectives: [
        { id: 'bookings', label: t('Reservas', 'Bookings', 'Reserves') },
        { id: 'sales', label: t('Ventas', 'Sales', 'Vendes') },
        { id: 'leads', label: t('Contactos', 'Leads', 'Contactes') },
        { id: 'brand', label: t('Marca', 'Brand', 'Marca') },
        { id: 'portfolio', label: t('Portfolio', 'Portfolio', 'Portfolio') },
    ],
};
