import { navbar } from './site-ui.js';

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
export function scrollToSectionElement(section) {
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
