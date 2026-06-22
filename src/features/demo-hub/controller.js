import {
    AUDIT_ITEMS,
    DEMO_GOALS,
    DEMO_HUB_COPY,
    DEMO_PROJECTS,
    TRANSFORM_PRESETS,
    localText,
} from '../../data/demo-hub/index.js';

export function initDemoHub(root = document.querySelector('[data-demo-hub]')) {
    if (!root || !DEMO_PROJECTS.length || root.dataset.demoHubReady === 'true') return;
    root.dataset.demoHubReady = 'true';

    const categoryOrder = ['all', ...new Set(DEMO_PROJECTS.map((demo) => demo.category))];
    const panelOrder = ['overview', 'inspector', 'responsive', 'transform', 'proposal', 'compare', 'audit'];
    const devicePresets = [
        { id: 'mobile', width: 390, icon: 'fa-mobile-screen-button' },
        { id: 'tablet', width: 768, icon: 'fa-tablet-screen-button' },
        { id: 'desktop', width: 1180, icon: 'fa-display' },
    ];
    const viewModes = ['client', 'recruiter', 'designer', 'developer'];
    const demoTransformDefaults = {
        restaurante: { sector: 'restaurant', tone: 'premium', objective: 'bookings' },
        tienda: { sector: 'store', tone: 'minimal', objective: 'sales' },
        agencia: { sector: 'photographer', tone: 'urban', objective: 'brand' },
        meridian: { sector: 'photographer', tone: 'premium', objective: 'portfolio' },
        eclipse: { sector: 'gym', tone: 'gamer', objective: 'leads' },
        orbit: { sector: 'academy', tone: 'minimal', objective: 'leads' },
    };

    const state = {
        activeId: DEMO_PROJECTS[0].id,
        query: '',
        goal: 'all',
        category: 'all',
        panel: 'overview',
        device: 'desktop',
        width: 1180,
        compare: new Set([DEMO_PROJECTS[0].id, DEMO_PROJECTS[1]?.id].filter(Boolean)),
        metric: 'cta',
        viewAs: 'client',
        inspector: 0,
        section: 0,
        sector: 'restaurant',
        tone: 'premium',
        objective: 'bookings',
        buttonStyle: 'pill',
        motion: 'normal',
        density: 'balanced',
        proposalName: '',
        audit: new Set(),
        presenting: false,
        presentationIndex: 0,
        presentationTimer: null,
        __customTransform: false,
    };

    function getLang() {
        const stored = localStorage.getItem('portfolioLanguage');
        if (stored) return stored;
        const lang = document.documentElement.lang;
        return lang === 'ca' ? 'val' : (lang || 'es');
    }

    function txt(value) {
        return localText(value, getLang());
    }

    function copy(key) {
        return txt(DEMO_HUB_COPY[key]);
    }

    function escapeHtml(value = '') {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function activeDemo() {
        return DEMO_PROJECTS.find((demo) => demo.id === state.activeId) || DEMO_PROJECTS[0];
    }

    function applyDemoDefaults(demo = activeDemo(), force = false) {
        const defaults = demoTransformDefaults[demo.id];
        if (!defaults) return;
        if (force || !state.__customTransform) {
            state.sector = defaults.sector;
            state.tone = defaults.tone;
            state.objective = defaults.objective;
        }
    }

    function markCustomTransform() {
        state.__customTransform = true;
    }

    function selectedSector() {
        return TRANSFORM_PRESETS.sectors.find((item) => item.id === state.sector) || TRANSFORM_PRESETS.sectors[0];
    }

    function selectedTone() {
        return TRANSFORM_PRESETS.tones.find((item) => item.id === state.tone) || TRANSFORM_PRESETS.tones[0];
    }

    function selectedObjective() {
        return TRANSFORM_PRESETS.objectives.find((item) => item.id === state.objective) || TRANSFORM_PRESETS.objectives[0];
    }

    function categoryLabel(category) {
        return category === 'all' ? copy('all') : txt(DEMO_HUB_COPY.categories[category]);
    }

    function goalLabel(goalId) {
        return txt(DEMO_GOALS.find((goal) => goal.id === goalId)?.label || DEMO_GOALS[0].label);
    }

    function metricLabel(metric) {
        return txt(DEMO_HUB_COPY.metricLabels[metric]) || metric;
    }

    function metricAverage(demo) {
        const values = Object.values(demo.metrics).map((metric) => Number(metric.value) || 0);
        return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    }


    const sectionTargetMap = {
        restaurante: ['top', 'menu', 'gallery', 'reserve'],
        tienda: ['top', 'shop', 'shop', 'shop'],
        agencia: ['hero', 'services', 'work', 'contact'],
        meridian: ['top', 'services', 'work', 'contact'],
        eclipse: ['top', 'lineup', 'schedule', 'tickets'],
        orbit: ['overview', 'pipeline', 'calendar', 'overview'],
    };

    function sectionTarget(demo, index) {
        const frame = root.querySelector('[data-frame]');
        if (frame?.dataset.mode === 'transform') {
            return ['hero', 'offer', 'proof', 'contact'][index] || 'hero';
        }
        return demo.sections[index]?.target || sectionTargetMap[demo.id]?.[index] || (index === 0 ? 'top' : '');
    }

    function scrollFrameToSection(index = state.section) {
        const demo = activeDemo();
        const target = sectionTarget(demo, index);
        const frame = root.querySelector('[data-frame]');
        if (!frame) return;
        window.setTimeout(() => {
            try {
                const win = frame.contentWindow;
                const doc = frame.contentDocument || win?.document;
                if (!win || !doc) return;
                if (!target || target === 'top') {
                    win.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                const el = doc.getElementById(target) || doc.querySelector(`[data-section="${target}"]`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch {}
        }, 80);
    }

    function hidePortfolioBackButtons(doc) {
        if (!doc) return;

        const styleId = 'demo-hub-hide-portfolio-back';
        if (!doc.getElementById(styleId)) {
            const style = doc.createElement('style');
            style.id = styleId;
            style.textContent = `
                a.back,
                .back[href*="index.html"],
                .back[href*="#webs"],
                a[href*="index.html#webs"] {
                    display: none !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                }
            `;
            doc.head?.appendChild(style);
        }

        const links = Array.from(doc.querySelectorAll('a'));
        links.forEach((link) => {
            const text = (link.textContent || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const href = (link.getAttribute('href') || '').toLowerCase();
            const isBackToPortfolio = link.classList.contains('back')
                || text.includes('volver al portfolio')
                || text.includes('visit daniel')
                || (href.includes('index.html#webs') && text.includes('portfolio'));
            if (isBackToPortfolio) link.remove();
        });
    }

    function prepareFrame(frame) {
        try {
            const doc = frame.contentDocument;
            if (!doc) return;
            hidePortfolioBackButtons(doc);
            try { frame.contentWindow?.DemoI18n?.setLang?.(getLang()); } catch {}
            if (doc.__demoHubPrepared) return;
            doc.__demoHubPrepared = true;

            const observer = new MutationObserver(() => hidePortfolioBackButtons(doc));
            observer.observe(doc.documentElement, { childList: true, subtree: true });
            try { frame.contentWindow?.DemoI18n?.setLang?.(getLang()); } catch {}

            doc.addEventListener('click', (event) => {
                const link = event.target.closest?.('a');
                if (!link) return;
                const rawHref = link.getAttribute('href') || '';
                const linkText = (link.textContent || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (link.classList.contains('back') || linkText.includes('volver al portfolio') || linkText.includes('visit daniel')) {
                    event.preventDefault();
                    event.stopPropagation();
                    link.remove();
                    return;
                }
                if (rawHref === '#') {
                    event.preventDefault();
                    return;
                }
                if (rawHref.startsWith('#')) {
                    const target = doc.getElementById(rawHref.slice(1));
                    if (target) {
                        event.preventDefault();
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    return;
                }
                const lower = rawHref.toLowerCase();
                const leavesDemo = lower === '/'
                    || lower === '../'
                    || lower.startsWith('../')
                    || lower.startsWith('/')
                    || lower.includes('danielux135.github.io')
                    || lower.includes('index.html');
                if (leavesDemo) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }, true);
        } catch {}
    }

    function buildTransformedPreview(demo) {
        const sector = selectedSector();
        const tone = selectedTone();
        const objective = selectedObjective();
        const accent = sector.palette || demo.accent;
        const accent2 = demo.accent2 || '#8ecae6';
        const business = state.proposalName.trim() || txt(sector.label);
        const sectorName = txt(sector.label);
        const toneName = txt(tone.label);
        const cta = txt(sector.cta);
        const heroTitleMap = {
            restaurant: ['El sabor que se queda', 'Carta, ambiente y reservas en una experiencia directa.'],
            barbershop: ['Cortes precisos. Estilo con carácter.', 'Servicios, precios y reserva de cita sin fricción.'],
            gym: ['Entrena con ritmo propio', 'Programas, horarios y planes claros para convertir visitas en pruebas.'],
            photographer: ['Imágenes que venden una historia', 'Portfolio, paquetes y reserva visual para proyectos con identidad.'],
            academy: ['Aprende con un camino claro', 'Cursos, metodología y contacto pensados para captar alumnos.'],
            store: ['Producto claro, deseo inmediato', 'Colecciones, ventajas y catálogo preparado para vender.'],
        };
        const [headline, subhead] = heroTitleMap[sector.id] || [`${sectorName} ${toneName}`, txt(tone.description)];
        const sections = sector.sections.slice(0, 5);
        const motionClass = `motion-${state.motion}`;
        const densityClass = `density-${state.density}`;
        const buttonClass = `button-${state.buttonStyle}`;
        return `<!doctype html>
    <html lang="${escapeHtml(getLang() === 'val' ? 'ca' : getLang())}">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
    :root{--accent:${escapeHtml(accent)};--accent2:${escapeHtml(accent2)};--bg:#070b16;--panel:rgba(255,255,255,.08);--text:#f8fbff;--muted:#a8b3cc;--radius:32px;--gap:22px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:var(--text);background:var(--bg)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;min-height:100%;background:radial-gradient(circle at 18% 0%,color-mix(in srgb,var(--accent) 28%,transparent),transparent 34%),radial-gradient(circle at 92% 12%,color-mix(in srgb,var(--accent2) 22%,transparent),transparent 34%),linear-gradient(145deg,#071020,#120b23 58%,#05070f);color:var(--text);overflow-x:hidden}.demo-page{min-height:100vh}.top{position:sticky;top:0;z-index:8;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px clamp(18px,5vw,62px);background:rgba(5,8,18,.72);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.08)}.brand{display:flex;align-items:center;gap:12px;font-weight:950;letter-spacing:.02em}.brand-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:15px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#071020;font-weight:950}.nav{display:flex;gap:8px;flex-wrap:wrap}.nav a,.cta{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 15px;border-radius:999px;border:1px solid rgba(255,255,255,.13);color:var(--text);text-decoration:none;font-weight:850;font-size:14px}.cta{border:0;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#071020;box-shadow:0 18px 38px color-mix(in srgb,var(--accent) 28%,transparent)}.hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(280px,.95fr);gap:clamp(22px,5vw,70px);align-items:center;padding:clamp(56px,10vw,120px) clamp(18px,6vw,86px)}.eyebrow{color:var(--accent2);font-weight:950;text-transform:uppercase;letter-spacing:.18em;font-size:12px}h1{margin:14px 0 18px;font-size:clamp(42px,8vw,104px);line-height:.88;letter-spacing:-.075em}.lead{max-width:650px;color:var(--muted);font-size:clamp(17px,2.1vw,23px);line-height:1.55}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.actions .ghost{background:rgba(255,255,255,.06);color:var(--text)}.visual{position:relative;min-height:420px;border-radius:var(--radius);border:1px solid rgba(255,255,255,.12);background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.035));overflow:hidden;box-shadow:0 34px 90px rgba(0,0,0,.42)}.visual:before{content:'';position:absolute;inset:10%;border-radius:inherit;background:radial-gradient(circle at 40% 38%,var(--accent),transparent 24%),radial-gradient(circle at 65% 64%,var(--accent2),transparent 25%);filter:blur(12px);opacity:.9}.floating-card{position:absolute;left:24px;right:24px;bottom:24px;padding:22px;border-radius:24px;background:rgba(5,8,18,.74);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(14px)}.floating-card strong{font-size:24px}.floating-card p{color:var(--muted);line-height:1.55}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gap);padding:0 clamp(18px,6vw,86px) clamp(52px,8vw,90px)}.card{border:1px solid rgba(255,255,255,.10);border-radius:24px;padding:24px;background:rgba(255,255,255,.055);min-height:180px}.card b{display:grid;place-items:center;width:42px;height:42px;border-radius:15px;background:color-mix(in srgb,var(--accent) 22%,transparent);margin-bottom:18px;color:var(--accent2)}.card h2{margin:0 0 10px;font-size:22px}.card p{margin:0;color:var(--muted);line-height:1.55}.section{padding:70px clamp(18px,6vw,86px);border-top:1px solid rgba(255,255,255,.08)}.section h2{font-size:clamp(30px,5vw,60px);letter-spacing:-.05em;margin:0 0 16px}.strip{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.strip span{padding:10px 13px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);font-weight:800;color:var(--text)}.final{margin:0 clamp(18px,6vw,86px) 80px;padding:34px;border-radius:30px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 20%,rgba(255,255,255,.06)),rgba(255,255,255,.04));border:1px solid color-mix(in srgb,var(--accent) 35%,rgba(255,255,255,.1));display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}.button-sharp .cta,.button-sharp .nav a{border-radius:10px}.button-soft .cta,.button-soft .nav a{border-radius:18px}.density-compact{--gap:12px}.density-airy{--gap:34px}.motion-high .visual:before{animation:pulse 2.2s ease-in-out infinite alternate}.motion-calm .visual:before{opacity:.62}@keyframes pulse{to{transform:scale(1.08) rotate(3deg);filter:blur(4px)}}@media(max-width:760px){.top{align-items:flex-start}.nav{display:none}.hero{grid-template-columns:1fr;padding-top:42px}.visual{min-height:320px}.grid{grid-template-columns:1fr}.final{display:block}.final .cta{margin-top:16px;width:100%}}
    </style>
    </head>
    <body class="${escapeHtml(buttonClass)} ${escapeHtml(motionClass)} ${escapeHtml(densityClass)}">
    <div class="demo-page">
    <header class="top"><div class="brand"><span class="brand-mark">${escapeHtml(sectorName.slice(0,1))}</span><span>${escapeHtml(business)}</span></div><nav class="nav"><a href="#offer">${escapeHtml(sections[0] || 'Servicios')}</a><a href="#proof">${escapeHtml(sections[1] || 'Prueba')}</a><a href="#contact">Contacto</a></nav><a class="cta" href="#contact">${escapeHtml(cta)}</a></header>
    <main>
    <section id="hero" class="hero"><div><span class="eyebrow">${escapeHtml(sectorName)} · ${escapeHtml(toneName)} · ${escapeHtml(txt(objective.label))}</span><h1>${escapeHtml(headline)}</h1><p class="lead">${escapeHtml(subhead)} ${escapeHtml(txt(tone.description))}</p><div class="actions"><a class="cta" href="#contact">${escapeHtml(cta)}</a><a class="cta ghost" href="#offer">Ver propuesta</a></div></div><div class="visual" aria-hidden="true"><article class="floating-card"><strong>${escapeHtml(demo.title)} → ${escapeHtml(sectorName)}</strong><p>Esta preview cambia sector, CTA, secciones, tono, densidad y movimiento sin backend.</p></article></div></section>
    <section id="offer" class="grid">${sections.slice(0,3).map((item, index) => `<article class="card"><b>0${index+1}</b><h2>${escapeHtml(item)}</h2><p>${escapeHtml(sectionCopy(sector.id, item, objective.id))}</p></article>`).join('')}</section>
    <section id="proof" class="section"><span class="eyebrow">Prueba visual</span><h2>${escapeHtml(proofTitle(sector.id))}</h2><p class="lead">Estructura pensada para que el visitante entienda la oferta, confíe y llegue al contacto con menos dudas.</p><div class="strip">${sections.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div></section>
    <section id="contact" class="final"><div><span class="eyebrow">Objetivo final</span><h2>${escapeHtml(cta)}</h2><p class="lead">Propuesta lista para convertir una visita en acción: ${escapeHtml(txt(objective.label).toLowerCase())}.</p></div><a class="cta" href="#hero">Volver arriba</a></section>
    </main>
    </div>
    </body>
    </html>`;
    }

    function sectionCopy(sectorId, section, objectiveId) {
        const generic = {
            bookings: 'Bloque diseñado para reducir fricción y llevar al usuario a una reserva clara.',
            sales: 'Bloque pensado para enseñar valor, producto y siguiente paso de compra.',
            leads: 'Bloque enfocado en captar contacto con una propuesta fácil de entender.',
            brand: 'Bloque visual para construir identidad y diferenciar la marca.',
            portfolio: 'Bloque preparado para que el trabajo luzca mejor y sea fácil de explorar.',
        };
        const special = {
            barbershop: 'Servicios, precios y estilo visual para que pedir cita se sienta natural.',
            gym: 'Horarios, planes y motivación visual para empujar a probar una clase.',
            photographer: 'Galería y paquetes con foco en imagen, confianza y reserva.',
            academy: 'Cursos, método y resultados ordenados para pedir información.',
            store: 'Catálogo claro, ventajas y producto con intención de venta.',
            restaurant: 'Carta, ambiente y reserva priorizados para negocio local.',
        };
        return special[sectorId] || generic[objectiveId] || generic.leads;
    }

    function proofTitle(sectorId) {
        const map = {
            restaurant: 'Que el producto se vea apetecible antes de leer nada',
            barbershop: 'Que el estilo se entienda antes de reservar',
            gym: 'Que la energía se note y los planes sean claros',
            photographer: 'Que el portfolio haga vender el servicio',
            academy: 'Que la metodología inspire confianza',
            store: 'Que el catálogo parezca una marca real',
        };
        return map[sectorId] || 'Una estructura visual adaptada al negocio';
    }

    function goalMatch(demo) {
        return state.goal === 'all' || demo.goals.includes(state.goal);
    }

    function filteredDemos() {
        const query = state.query.trim().toLowerCase();
        return DEMO_PROJECTS
            .filter((demo) => {
                if (state.category !== 'all' && demo.category !== state.category) return false;
                if (!query) return true;
                const haystack = [
                    demo.title,
                    txt(demo.type),
                    txt(demo.summary),
                    txt(demo.bestFor),
                    ...demo.tags,
                    ...demo.build.map(txt),
                    ...demo.goals,
                    txt(demo.problem),
                    txt(demo.solution),
                ].join(' ').toLowerCase();
                return haystack.includes(query);
            })
            .sort((a, b) => {
                const aGoal = goalMatch(a) ? 1 : 0;
                const bGoal = goalMatch(b) ? 1 : 0;
                if (aGoal !== bGoal) return bGoal - aGoal;
                if (state.goal !== 'all') {
                    const aScore = a.metrics.conversion.value + a.metrics.cta.value;
                    const bScore = b.metrics.conversion.value + b.metrics.cta.value;
                    return bScore - aScore;
                }
                return DEMO_PROJECTS.indexOf(a) - DEMO_PROJECTS.indexOf(b);
            });
    }

    function setActive(id) {
        const demo = DEMO_PROJECTS.find((item) => item.id === id);
        if (!demo) return;
        state.activeId = id;
        state.metric = 'cta';
        state.inspector = 0;
        state.section = 0;
        state.__customTransform = false;
        applyDemoDefaults(demo, true);
        render();
    }

    function setDevice(deviceId) {
        const preset = devicePresets.find((item) => item.id === deviceId) || devicePresets[0];
        state.device = preset.id;
        state.width = preset.width;
        render();
        window.setTimeout(() => syncFrameHeight(), 120);
    }

    function ensureActiveVisible() {
        const demos = filteredDemos();
        if (!demos.length) return demos;
        if (!demos.some((demo) => demo.id === state.activeId)) {
            state.activeId = demos[0].id;
            state.__customTransform = false;
            applyDemoDefaults(demos[0], true);
        }
        return demos;
    }

    function toast(message) {
        let el = document.querySelector('.demo-hub-toast');
        if (!el) {
            el = document.createElement('div');
            el.className = 'demo-hub-toast';
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.classList.add('visible');
        window.clearTimeout(el._hideTimer);
        el._hideTimer = window.setTimeout(() => el.classList.remove('visible'), 2400);
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            toast(copy('copied'));
        } catch {
            const area = root.querySelector('[data-proposal-output]');
            if (area) {
                area.value = text;
                area.focus();
                area.select();
            }
            toast(copy('copyFallback'));
        }
    }

    function proposalText() {
        const demo = activeDemo();
        const sector = selectedSector();
        const tone = selectedTone();
        const objective = selectedObjective();
        const name = state.proposalName.trim() || txt(sector.label);
        const sections = sector.sections.join(', ');
        return [
            `Hola Daniel, quiero una web para ${name}.`,
            `Me interesa una propuesta basada en la demo ${demo.title}.`,
            `Sector: ${txt(sector.label)}.`,
            `Objetivo principal: ${txt(objective.label)}.`,
            `Estilo deseado: ${txt(tone.label)} — ${txt(tone.description)}`,
            `Secciones recomendadas: ${sections}.`,
            `Lo que me gusta de la demo: ${txt(demo.solution)}`,
        ].join('\n');
    }

    function downloadProposalCard() {
        const demo = activeDemo();
        const sector = selectedSector();
        const tone = selectedTone();
        const canvas = document.createElement('canvas');
        canvas.width = 1400;
        canvas.height = 900;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, demo.accent);
        gradient.addColorStop(1, demo.accent2);
        ctx.fillStyle = '#070b16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(1120, 110, 360, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(150, 780, 360, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = demo.accent;
        ctx.lineWidth = 4;
        roundRect(ctx, 70, 70, 1260, 760, 48, false, true);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 68px Inter, Arial, sans-serif';
        ctx.fillText('Mi idea de web', 140, 190);
        ctx.font = '800 34px Inter, Arial, sans-serif';
        ctx.fillStyle = demo.accent2;
        ctx.fillText(`Base: ${demo.title}`, 140, 260);
        ctx.font = '700 32px Inter, Arial, sans-serif';
        ctx.fillStyle = '#dbeafe';
        const lines = [
            `Negocio: ${state.proposalName.trim() || txt(sector.label)}`,
            `Sector: ${txt(sector.label)}`,
            `Objetivo: ${txt(selectedObjective().label)}`,
            `Estilo: ${txt(tone.label)}`,
            `CTA: ${txt(sector.cta)}`,
            `Secciones: ${sector.sections.join(' · ')}`,
        ];
        lines.forEach((line, index) => ctx.fillText(line, 140, 350 + index * 66));
        ctx.font = '800 28px Inter, Arial, sans-serif';
        ctx.fillStyle = '#93c5fd';
        ctx.fillText('Demo from Daniel Bort Guzmán · danielux135.github.io', 140, 760);
        const link = document.createElement('a');
        link.download = `briefing-${demo.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    function startPresentation() {
        stopPresentation(false);
        state.presenting = true;
        state.presentationIndex = 0;
        state.panel = 'overview';
        state.activeId = DEMO_PROJECTS[0].id;
        state.presentationTimer = window.setInterval(() => {
            state.presentationIndex += 1;
            const demoIndex = state.presentationIndex % DEMO_PROJECTS.length;
            state.activeId = DEMO_PROJECTS[demoIndex].id;
            state.panel = ['overview', 'responsive', 'inspector', 'transform'][state.presentationIndex % 4];
            render();
        }, 4300);
        render();
    }

    function stopPresentation(shouldRender = true) {
        if (state.presentationTimer) window.clearInterval(state.presentationTimer);
        state.presentationTimer = null;
        state.presenting = false;
        if (shouldRender) render();
    }

    function init() {
        root.innerHTML = `
            <div class="demo-hub-shell">
                <div class="demo-hub-bg" aria-hidden="true"></div>
                <div class="demo-hub-topbar">
                    <div class="demo-hub-status"><span class="demo-hub-live-dot"></span><strong data-live-label></strong></div>
                    <div class="demo-hub-stats" data-stats></div>
                    <button type="button" class="demo-hub-present-btn" data-action="presentation"></button>
                </div>
                <section class="demo-goals" aria-label="Objetivos de web">
                    <div class="demo-goals-title"><i class="fa-solid fa-route" aria-hidden="true"></i><span data-goal-title></span></div>
                    <div class="demo-goals-track" data-goals></div>
                </section>
                <div class="demo-hub-toolbar">
                    <label class="demo-hub-search">
                        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <input type="search" data-search autocomplete="off">
                    </label>
                    <div class="demo-hub-filters" data-categories></div>
                </div>
                <div class="demo-hub-layout">
                    <aside class="demo-list-panel" data-list></aside>
                    <main class="demo-preview-panel">
                        <div class="demo-preview-card">
                            <div class="demo-preview-toolbar">
                                <div>
                                    <strong data-preview-title></strong>
                                    <span data-preview-type></span>
                                </div>
                                <div class="demo-device-actions" data-devices></div>
                            </div>
                            <div class="demo-width-lab">
                                <span data-width-label></span>
                                <input type="range" min="320" max="1440" step="10" data-width-range>
                                <output data-width-output></output>
                            </div>
                            <div class="demo-stage" data-stage>
                                <div class="demo-stage-viewport" data-stage-viewport>
                                    <div class="demo-browser-bar" aria-hidden="true"><span></span><span></span><span></span><em data-browser-url></em></div>
                                    <iframe class="demo-frame" data-frame loading="lazy" scrolling="auto" title="Demo preview" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
                                    <div class="demo-inspector-layer" data-inspector-layer aria-hidden="true"></div>
                                    <div class="demo-section-radar" data-section-radar aria-hidden="true"></div>
                                    <div class="demo-presentation-caption" data-presentation-caption></div>
                                </div>
                            </div>
                        </div>
                    </main>
                    <aside class="demo-workbench" data-workbench></aside>
                </div>
            </div>
        `;

        root.addEventListener('click', handleClick);
        root.addEventListener('input', handleInput);
        root.addEventListener('change', handleChange);
        root.querySelector('[data-frame]').addEventListener('load', (event) => {
            prepareFrame(event.currentTarget);
            try { event.currentTarget.contentWindow?.scrollTo(0, 0); } catch {}
            syncFrameHeight();
        });
        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(() => updatePreviewScale());
            resizeObserver.observe(root.querySelector('[data-stage]'));
            resizeObserver.observe(root.querySelector('.demo-preview-card'));
        }
        window.addEventListener('resize', updatePreviewScale, { passive: true });
        document.querySelectorAll('#langSwitcher .lang-btn').forEach((button) => {
            button.addEventListener('click', () => window.setTimeout(render, 0));
        });
        window._demoHubUpdateText = render;
        applyDemoDefaults(activeDemo(), true);
        render();
    }

    function handleClick(event) {
        const action = event.target.closest('[data-action]')?.dataset.action;
        const button = event.target.closest('[data-demo-id], [data-goal], [data-category], [data-panel], [data-device], [data-width-preset], [data-metric], [data-view-mode], [data-section-index], [data-inspector-index], [data-action]');
        if (!button && !action) return;

        if (button?.dataset.demoId) {
            setActive(button.dataset.demoId);
            return;
        }
        if (button?.dataset.goal) {
            state.goal = button.dataset.goal;
            render();
            return;
        }
        if (button?.dataset.category) {
            state.category = button.dataset.category;
            render();
            return;
        }
        if (button?.dataset.panel) {
            state.panel = button.dataset.panel;
            render();
            return;
        }
        if (button?.dataset.device) {
            setDevice(button.dataset.device);
            return;
        }
        if (button?.dataset.widthPreset) {
            state.width = Number(button.dataset.widthPreset) || state.width;
            const preset = devicePresets.reduce((best, item) => Math.abs(item.width - state.width) < Math.abs(best.width - state.width) ? item : best, devicePresets[0]);
            state.device = preset.id;
            renderPreview();
            renderWorkbench();
            window.setTimeout(() => syncFrameHeight(), 120);
            return;
        }
        if (button?.dataset.metric) {
            state.metric = button.dataset.metric;
            renderWorkbench();
            return;
        }
        if (button?.dataset.viewMode) {
            state.viewAs = button.dataset.viewMode;
            renderWorkbench();
            return;
        }
        if (button?.dataset.sectionIndex) {
            state.section = Number(button.dataset.sectionIndex) || 0;
            renderPreviewOverlay();
            renderWorkbench();
            scrollFrameToSection(state.section);
            return;
        }
        if (button?.dataset.inspectorIndex) {
            state.inspector = Number(button.dataset.inspectorIndex) || 0;
            renderPreviewOverlay();
            renderWorkbench();
            return;
        }
        if (action === 'open-demo') {
            window.open(activeDemo().url, '_blank', 'noopener');
            return;
        }
        if (action === 'copy-proposal') {
            copyText(proposalText());
            return;
        }
        if (action === 'download-card') {
            downloadProposalCard();
            return;
        }
        if (action === 'proposal-panel') {
            state.panel = 'proposal';
            render();
            return;
        }
        if (action === 'compare-active') {
            const id = event.target.closest('[data-compare-id]')?.dataset.compareId || activeDemo().id;
            state.compare.has(id) ? state.compare.delete(id) : state.compare.add(id);
            render();
            return;
        }
        if (action === 'clear-filters') {
            state.query = '';
            state.goal = 'all';
            state.category = 'all';
            render();
            return;
        }
        if (action === 'presentation') {
            state.presenting ? stopPresentation() : startPresentation();
            return;
        }
    }

    function handleInput(event) {
        if (event.target.matches('[data-search]')) {
            state.query = event.target.value;
            renderListAndFilters();
            renderPreview();
            renderWorkbench();
            return;
        }
        if (event.target.matches('[data-width-range]')) {
            state.width = Number(event.target.value);
            const preset = devicePresets.reduce((best, item) => Math.abs(item.width - state.width) < Math.abs(best.width - state.width) ? item : best, devicePresets[0]);
            state.device = preset.id;
            renderPreview();
            window.setTimeout(() => syncFrameHeight(), 120);
            return;
        }
        if (event.target.matches('[data-proposal-name]')) {
            state.proposalName = event.target.value;
            renderProposalOutput();
        }
    }

    function handleChange(event) {
        const target = event.target;
        if (target.matches('[data-sector]')) {
            state.sector = target.value;
            markCustomTransform();
            renderPreview();
            renderWorkbench();
            return;
        }
        if (target.matches('[data-tone]')) {
            state.tone = target.value;
            markCustomTransform();
            renderPreview();
            renderWorkbench();
            return;
        }
        if (target.matches('[data-objective]')) {
            state.objective = target.value;
            markCustomTransform();
            renderPreview();
            renderWorkbench();
            return;
        }
        if (target.matches('[data-style-control="button"]')) {
            state.buttonStyle = target.value;
            markCustomTransform();
            renderPreview();
            renderWorkbench();
            return;
        }
        if (target.matches('[data-style-control="motion"]')) {
            state.motion = target.value;
            markCustomTransform();
            renderPreview();
            renderWorkbench();
            return;
        }
        if (target.matches('[data-style-control="density"]')) {
            state.density = target.value;
            markCustomTransform();
            renderPreview();
            renderWorkbench();
            return;
        }
        if (target.matches('[data-audit-item]')) {
            target.checked ? state.audit.add(target.value) : state.audit.delete(target.value);
            renderAuditPanel();
            return;
        }
    }

    function render() {
        ensureActiveVisible();
        const demo = activeDemo();
        root.style.setProperty('--demo-accent', demo.accent);
        root.style.setProperty('--demo-accent-2', demo.accent2);
        root.style.setProperty('--transform-accent', selectedSector().palette);
        renderTop();
        renderGoals();
        renderListAndFilters();
        renderPreview();
        renderWorkbench();
    }

    function renderTop() {
        root.querySelector('[data-live-label]').textContent = copy('livePreview');
        const stats = root.querySelector('[data-stats]');
        stats.innerHTML = DEMO_HUB_COPY.globalStats.map((stat) => `
            <div class="demo-stat"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(txt(stat.label))}</span></div>
        `).join('');
        const presentBtn = root.querySelector('[data-action="presentation"]');
        presentBtn.innerHTML = `<i class="fa-solid ${state.presenting ? 'fa-stop' : 'fa-play'}" aria-hidden="true"></i><span>${escapeHtml(state.presenting ? copy('stopPresentation') : copy('startPresentation'))}</span>`;
        root.querySelector('[data-goal-title]').textContent = copy('chooseGoal');
        const search = root.querySelector('[data-search]');
        search.placeholder = copy('search');
        search.value = state.query;
    }

    function renderGoals() {
        const goals = root.querySelector('[data-goals]');
        goals.innerHTML = DEMO_GOALS.map((goal) => `
            <button type="button" class="demo-goal ${state.goal === goal.id ? 'active' : ''}" data-goal="${escapeHtml(goal.id)}">
                <i class="fa-solid ${escapeHtml(goal.icon)}" aria-hidden="true"></i>
                <span>${escapeHtml(txt(goal.label))}</span>
            </button>
        `).join('');
    }



    function previewRenderHeight(available = 760) {
        const viewport = window.innerHeight || 820;
        const isDesktopLayout = window.matchMedia('(min-width: 1121px)').matches;
        if (isDesktopLayout) {
            // En escritorio el mockup debe aprovechar la columna central, no quedarse en una tira baja.
            return Math.round(Math.min(780, Math.max(600, Math.min(viewport - 250, available * 0.86))));
        }
        return Math.round(Math.min(680, Math.max(500, available * 0.94)));
    }

    function baseViewportHeight(width = state.width) {
        const stage = root.querySelector('[data-stage]');
        const available = Math.max(320, stage?.clientWidth || stage?.parentElement?.clientWidth || 760);
        const viewportWidth = Math.max(320, Number(width) || 1180);
        const scale = Math.min(1, Math.max(0.1, (available - 2) / viewportWidth));
        const targetRenderHeight = previewRenderHeight(available);
        return Math.round(targetRenderHeight / scale);
    }

    function updatePreviewScale() {
        const stage = root.querySelector('[data-stage]');
        const viewport = root.querySelector('[data-stage-viewport]');
        if (!stage || !viewport) return;
        const width = Math.max(320, Number(state.width) || 1180);
        const available = Math.max(320, stage.clientWidth || stage.parentElement?.clientWidth || width);
        const scale = Math.min(1, Math.max(0.1, (available - 2) / width));
        const renderHeight = previewRenderHeight(available);
        const rawHeight = Math.round(renderHeight / scale);
        stage.dataset.virtualHeight = String(rawHeight);
        stage.style.setProperty('--demo-viewport-width', `${width}px`);
        stage.style.setProperty('--demo-viewport-height', `${rawHeight}px`);
        stage.style.setProperty('--demo-scale', scale.toFixed(4));
        stage.style.setProperty('--demo-render-height', `${renderHeight}px`);
    }

    function syncFrameHeight() {
        const frame = root.querySelector('[data-frame]');
        if (!frame) return;
        // Mantener el alto estable: el responsive lab debe enseñar un viewport, no agrandar el hub
        // hasta el final de cada demo. El scroll, cuando haga falta, vive dentro del navegador mockup.
        try {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            if (doc?.documentElement && doc?.body) {
                doc.documentElement.style.overflowX = 'hidden';
                doc.body.style.overflowX = 'hidden';
                doc.documentElement.style.overflowY = 'auto';
                doc.body.style.overflowY = 'auto';
                if (!doc.getElementById('demo-hub-frame-scroll-style')) {
                    const style = doc.createElement('style');
                    style.id = 'demo-hub-frame-scroll-style';
                    style.textContent = `html{scrollbar-width:thin;scrollbar-color:rgba(140,230,255,.42) rgba(255,255,255,.04)}::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:rgba(255,255,255,.04)}::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(140,230,255,.78),rgba(255,122,214,.72));border-radius:999px}`;
                    doc.head?.appendChild(style);
                }
            }
        } catch {}
        updatePreviewScale();
    }
    function renderListAndFilters() {
        const demos = ensureActiveVisible();
        const filters = root.querySelector('[data-categories]');
        filters.innerHTML = categoryOrder.map((category) => `
            <button type="button" class="demo-filter ${state.category === category ? 'active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(categoryLabel(category))}</button>
        `).join('') + `<button type="button" class="demo-filter ghost" data-action="clear-filters"><i class="fa-solid fa-eraser" aria-hidden="true"></i>${escapeHtml(copy('clear'))}</button>`;

        const list = root.querySelector('[data-list]');
        if (!demos.length) {
            list.innerHTML = `
                <div class="demo-empty-card">
                    <i class="fa-solid fa-magnifying-glass-chart" aria-hidden="true"></i>
                    <h4>${escapeHtml(copy('emptyTitle'))}</h4>
                    <p>${escapeHtml(copy('emptyText'))}</p>
                </div>
            `;
            return;
        }
        list.innerHTML = demos.map((demo, index) => {
            const isActive = demo.id === state.activeId;
            const isRecommended = goalMatch(demo) && state.goal !== 'all';
            return `
                <article class="demo-card ${isActive ? 'active' : ''} ${isRecommended ? 'recommended' : ''}" style="--card-accent:${escapeHtml(demo.accent)};--card-accent-2:${escapeHtml(demo.accent2)}">
                    <button type="button" class="demo-card-main" data-demo-id="${escapeHtml(demo.id)}" aria-label="${escapeHtml(copy('createProposal'))}: ${escapeHtml(demo.title)}">
                        <img src="${escapeHtml(demo.logo)}" alt="${escapeHtml(demo.logoAlt)}" class="demo-logo">
                        <span class="demo-card-copy">
                            <small>${isRecommended ? escapeHtml(copy('recommended')) + ' · ' : ''}${escapeHtml(txt(demo.type))}</small>
                            <strong>${escapeHtml(demo.title)}</strong>
                            <em>${escapeHtml(txt(demo.summary))}</em>
                        </span>
                        <span class="demo-rank">${String(index + 1).padStart(2, '0')}</span>
                    </button>
                    <button type="button" class="demo-compare-toggle ${state.compare.has(demo.id) ? 'active' : ''}" data-action="compare-active" data-compare-id="${escapeHtml(demo.id)}" title="${escapeHtml(state.compare.has(demo.id) ? copy('removeCompare') : copy('addCompare'))}">
                        <i class="fa-solid ${state.compare.has(demo.id) ? 'fa-check' : 'fa-scale-balanced'}" aria-hidden="true"></i>
                    </button>
                </article>
            `;
        }).join('');
        window.setTimeout(() => {
            if (!window.matchMedia?.('(max-width: 760px)').matches) return;
            const activeCard = list.querySelector('.demo-card.active');
            activeCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 0);
    }

    function renderPreview() {
        const demo = activeDemo();
        root.querySelector('[data-preview-title]').textContent = demo.title;
        root.querySelector('[data-preview-type]').textContent = txt(demo.type);
        root.querySelector('[data-width-label]').textContent = copy('width');
        const range = root.querySelector('[data-width-range]');
        const output = root.querySelector('[data-width-output]');
        range.value = state.width;
        output.value = `${state.width}px`;
        output.textContent = `${state.width}px`;
        const devices = root.querySelector('[data-devices]');
        devices.innerHTML = devicePresets.map((preset) => `
            <button type="button" class="demo-device ${state.device === preset.id ? 'active' : ''}" data-device="${escapeHtml(preset.id)}">
                <i class="fa-solid ${escapeHtml(preset.icon)}" aria-hidden="true"></i>
                <span>${escapeHtml(copy(preset.id))}</span>
            </button>
        `).join('');
        const stage = root.querySelector('[data-stage]');
        stage.dataset.device = state.device;
        stage.dataset.virtualHeight = String(baseViewportHeight(state.width));
        stage.style.setProperty('--demo-viewport-width', `${state.width}px`);
        stage.style.setProperty('--transform-accent', selectedSector().palette);
        updatePreviewScale();
        const frame = root.querySelector('[data-frame]');
        const transformed = state.panel === 'transform' || state.__customTransform;
        if (transformed) {
            const srcdoc = buildTransformedPreview(demo);
            root.querySelector('[data-browser-url]').textContent = `transform://${state.sector}/${demo.id}`;
            if (frame.dataset.mode !== 'transform' || frame.srcdoc !== srcdoc) {
                frame.removeAttribute('src');
                frame.dataset.mode = 'transform';
                frame.srcdoc = srcdoc;
            }
        } else {
            root.querySelector('[data-browser-url]').textContent = demo.url.replace('/demos/', 'demo://');
            if (frame.dataset.mode !== 'real' || frame.getAttribute('src') !== demo.url) {
                frame.removeAttribute('srcdoc');
                frame.dataset.mode = 'real';
                frame.setAttribute('src', demo.url);
            }
        }
        updatePreviewScale();
        window.setTimeout(() => {
            syncFrameHeight();
            try { frame.contentWindow?.DemoI18n?.setLang?.(getLang()); } catch {}
        }, 80);
        renderPreviewOverlay();
    }

    function renderPreviewOverlay() {
        const demo = activeDemo();
        const layer = root.querySelector('[data-inspector-layer]');
        const radar = root.querySelector('[data-section-radar]');
        const caption = root.querySelector('[data-presentation-caption]');
        const showInspector = state.panel === 'inspector';
        layer.classList.toggle('visible', showInspector);
        layer.innerHTML = showInspector ? demo.inspector.map((point, index) => `
            <button type="button" class="demo-hotspot ${state.inspector === index ? 'active' : ''}" style="left:${point.x}%;top:${point.y}%" data-inspector-index="${index}">
                <span>${index + 1}</span><em>${escapeHtml(txt(point.label))}</em>
            </button>
        `).join('') : '';
        // No tapamos las demos con cartelas dentro del mockup.
        // La explicación de Hero/Carta/Galería vive en el panel lateral, no encima de la web.
        radar.classList.remove('visible');
        radar.innerHTML = '';
        caption.classList.remove('visible');
        caption.textContent = '';
    }

    function renderWorkbench() {
        const workbench = root.querySelector('[data-workbench]');
        workbench.innerHTML = `
            <div class="demo-tabs" data-tabs>
                ${panelOrder.map((panel) => `<button type="button" class="demo-tab ${state.panel === panel ? 'active' : ''}" data-panel="${panel}">${escapeHtml(txt(DEMO_HUB_COPY.panelTabs[panel]))}</button>`).join('')}
            </div>
            <div class="demo-panel" data-panel-content></div>
        `;
        const container = workbench.querySelector('[data-panel-content]');
        const htmlByPanel = {
            overview: renderOverviewPanel(),
            inspector: renderInspectorPanel(),
            responsive: renderResponsivePanel(),
            transform: renderTransformPanel(true),
            proposal: renderProposalPanel(),
            compare: renderComparePanel(),
            audit: renderAuditPanel(true),
        };
        container.innerHTML = htmlByPanel[state.panel] || htmlByPanel.overview;
        renderPreviewOverlay();
    }

    function roleInsight(demo) {
        const insights = {
            client: [copy('client'), txt(demo.result)],
            recruiter: [copy('recruiter'), `${txt(demo.build[0])}, ${txt(demo.build[1])} y ${metricAverage(demo)} puntos de demo score.`],
            designer: [copy('designer'), `${txt(demo.problem)} ${txt(demo.solution)}`],
            developer: [copy('developer'), `${demo.tags.join(' · ')} · ${demo.build.map(txt).join(' · ')}`],
        };
        return insights[state.viewAs] || insights.client;
    }

    function renderOverviewPanel() {
        const demo = activeDemo();
        const [modeLabel, insight] = roleInsight(demo);
        const currentMetric = demo.metrics[state.metric] || demo.metrics.cta;
        return `
            <section class="demo-value-card">
                <div class="demo-detail-head">
                    <img src="${escapeHtml(demo.logo)}" alt="${escapeHtml(demo.logoAlt)}">
                    <div><small>${escapeHtml(txt(demo.type))}</small><h3>${escapeHtml(demo.title)}</h3></div>
                </div>
                <p class="demo-summary">${escapeHtml(txt(demo.summary))}</p>
                <div class="demo-actions-row">
                    <button type="button" class="demo-solid" data-action="open-demo"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>${escapeHtml(copy('openDemo'))}</button>
                    <button type="button" class="demo-ghost" data-action="proposal-panel"><i class="fa-solid fa-file-signature" aria-hidden="true"></i>${escapeHtml(copy('createProposal'))}</button>
                </div>
            </section>
            <section class="demo-view-modes">
                <span>${escapeHtml(copy('viewAs'))}</span>
                ${viewModes.map((mode) => `<button type="button" class="${state.viewAs === mode ? 'active' : ''}" data-view-mode="${mode}">${escapeHtml(copy(mode))}</button>`).join('')}
                <div><strong>${escapeHtml(modeLabel)}</strong><p>${escapeHtml(insight)}</p></div>
            </section>
            <section class="demo-psr-grid">
                ${['problem', 'solution', 'result'].map((key) => `
                    <article><strong>${escapeHtml(copy(key))}</strong><p>${escapeHtml(txt(demo[key]))}</p></article>
                `).join('')}
            </section>
            ${renderScoreBlock(demo, currentMetric)}
            ${renderSectionMap(demo)}
            ${renderBuildBlock(demo)}
        `;
    }

    function renderScoreBlock(demo, currentMetric) {
        return `
            <section class="demo-score-card">
                <div class="demo-block-title"><strong>${escapeHtml(copy('demoScore'))}</strong><span>${escapeHtml(copy('clickMetric'))}</span></div>
                <div class="demo-score-total"><b>${metricAverage(demo)}</b><span>/100</span></div>
                <div class="demo-metrics">
                    ${Object.entries(demo.metrics).map(([key, metric]) => `
                        <button type="button" class="demo-metric ${state.metric === key ? 'active' : ''}" data-metric="${escapeHtml(key)}">
                            <span><em>${escapeHtml(metricLabel(key))}</em><b>${metric.value}%</b></span>
                            <i style="width:${metric.value}%"></i>
                        </button>
                    `).join('')}
                </div>
                <p class="demo-metric-note">${escapeHtml(txt(currentMetric.note))}</p>
            </section>
        `;
    }

    function renderSectionMap(demo) {
        return `
            <section class="demo-section-map">
                <div class="demo-block-title"><strong>${escapeHtml(copy('sectionMap'))}</strong><span>${escapeHtml(copy('bestFor'))}: ${escapeHtml(txt(demo.bestFor))}</span></div>
                <div class="demo-section-steps">
                    ${demo.sections.map((section, index) => `
                        <button type="button" class="${state.section === index ? 'active' : ''}" data-section-index="${index}"><b>${String(index + 1).padStart(2, '0')}</b><span>${escapeHtml(section.name)}</span><em>${escapeHtml(txt(section.reason))}</em></button>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderBuildBlock(demo) {
        return `
            <section class="demo-build-card">
                <div class="demo-block-title"><strong>${escapeHtml(copy('visibleBuild'))}</strong><span>${demo.tags.map(escapeHtml).join(' · ')}</span></div>
                <div class="demo-build-grid">
                    ${demo.build.map((item, index) => `<span><i class="fa-solid ${['fa-code', 'fa-wand-magic-sparkles', 'fa-mobile-screen', 'fa-bolt'][index % 4]}" aria-hidden="true"></i>${escapeHtml(txt(item))}</span>`).join('')}
                </div>
            </section>
        `;
    }

    function renderInspectorPanel() {
        const demo = activeDemo();
        const point = demo.inspector[state.inspector] || demo.inspector[0];
        return `
            <section class="demo-tool-card">
                <div class="demo-block-title"><strong>${escapeHtml(copy('inspector'))}</strong><span>${escapeHtml(copy('inspectorHint'))}</span></div>
                <div class="demo-inspector-list">
                    ${demo.inspector.map((item, index) => `
                        <button type="button" class="${state.inspector === index ? 'active' : ''}" data-inspector-index="${index}"><b>${index + 1}</b><span>${escapeHtml(txt(item.label))}</span></button>
                    `).join('')}
                </div>
                <div class="demo-callout"><strong>${escapeHtml(txt(point.label))}</strong><p>${escapeHtml(txt(demo.solution))}</p></div>
            </section>
            ${renderScoreBlock(demo, demo.metrics[state.metric] || demo.metrics.cta)}
        `;
    }

    function renderResponsivePanel() {
        const demo = activeDemo();
        return `
            <section class="demo-tool-card">
                <div class="demo-block-title"><strong>${escapeHtml(copy('responsive'))}</strong><span>${escapeHtml(copy('responsiveHint'))}</span></div>
                <div class="demo-responsive-presets">
                    ${[320, 375, 430, 768, 1024, 1440].map((width) => `<button type="button" class="${Math.abs(state.width - width) <= 5 ? 'active' : ''}" data-width-preset="${width}">${width}px</button>`).join('')}
                </div>
                <div class="demo-checklist">
                    ${demo.responsiveChecks.map((check) => `<span><i class="fa-solid fa-check" aria-hidden="true"></i>${escapeHtml(txt(check))}</span>`).join('')}
                </div>
            </section>
        `;
    }

    function renderTransformPanel(returnHtml = false) {
        const demo = activeDemo();
        const sector = selectedSector();
        const tone = selectedTone();
        const objective = selectedObjective();
        const html = `
            <section class="demo-tool-card">
                <div class="demo-block-title"><strong>${escapeHtml(copy('transformTitle'))}</strong><span>${escapeHtml(txt(demo.title))} → ${escapeHtml(txt(sector.label))}. La preview real de la izquierda cambia con estos controles.</span></div>
                <div class="demo-form-grid">
                    ${renderSelect('sector', copy('sector'), TRANSFORM_PRESETS.sectors, state.sector)}
                    ${renderSelect('tone', copy('tone'), TRANSFORM_PRESETS.tones, state.tone)}
                    ${renderSelect('objective', copy('objective'), TRANSFORM_PRESETS.objectives, state.objective)}
                </div>
                <div class="demo-style-lab">
                    <label>Botón<select data-style-control="button"><option value="pill" ${state.buttonStyle === 'pill' ? 'selected' : ''}>Pill</option><option value="sharp" ${state.buttonStyle === 'sharp' ? 'selected' : ''}>Sharp</option><option value="soft" ${state.buttonStyle === 'soft' ? 'selected' : ''}>Soft</option></select></label>
                    <label>Motion<select data-style-control="motion"><option value="calm" ${state.motion === 'calm' ? 'selected' : ''}>Calm</option><option value="normal" ${state.motion === 'normal' ? 'selected' : ''}>Normal</option><option value="high" ${state.motion === 'high' ? 'selected' : ''}>High</option></select></label>
                    <label>Densidad<select data-style-control="density"><option value="compact" ${state.density === 'compact' ? 'selected' : ''}>Compact</option><option value="balanced" ${state.density === 'balanced' ? 'selected' : ''}>Balanced</option><option value="airy" ${state.density === 'airy' ? 'selected' : ''}>Airy</option></select></label>
                </div>
                <article class="demo-transform-preview ${escapeHtml(state.buttonStyle)} ${escapeHtml(state.motion)} ${escapeHtml(state.density)}" style="--transform-accent:${escapeHtml(sector.palette)}">
                    <small>${escapeHtml(copy('businessPreview'))}</small>
                    <h4>${escapeHtml(txt(sector.label))} ${escapeHtml(txt(tone.label))}</h4>
                    <p>${escapeHtml(txt(tone.description))}</p>
                    <div>${sector.sections.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>
                    <button type="button">${escapeHtml(txt(sector.cta))}</button>
                </article>
                <p class="demo-transform-note"><strong>${escapeHtml(copy('objective'))}:</strong> ${escapeHtml(txt(objective.label))}. ${escapeHtml(txt(demo.solution))}</p>
                <button type="button" class="demo-solid full" data-action="proposal-panel"><i class="fa-solid fa-file-signature" aria-hidden="true"></i>${escapeHtml(copy('createProposal'))}</button>
            </section>
        `;
        if (returnHtml) return html;
        const container = root.querySelector('[data-panel-content]');
        if (container) container.innerHTML = html;
        root.style.setProperty('--transform-accent', sector.palette);
        renderPreview();
        return html;
    }

    function renderSelect(key, label, options, value) {
        return `
            <label>${escapeHtml(label)}
                <select data-${escapeHtml(key)}>
                    ${options.map((option) => `<option value="${escapeHtml(option.id)}" ${option.id === value ? 'selected' : ''}>${escapeHtml(txt(option.label))}</option>`).join('')}
                </select>
            </label>
        `;
    }

    function renderProposalPanel() {
        const sector = selectedSector();
        return `
            <section class="demo-tool-card proposal-card">
                <div class="demo-block-title"><strong>${escapeHtml(copy('proposalTitle'))}</strong><span>${escapeHtml(copy('sectionsNeeded'))}: ${sector.sections.map(escapeHtml).join(' · ')}</span></div>
                <label class="demo-field">${escapeHtml(copy('businessName'))}<input type="text" data-proposal-name placeholder="${escapeHtml(copy('businessPlaceholder'))}" value="${escapeHtml(state.proposalName)}"></label>
                <div class="demo-form-grid">
                    ${renderSelect('sector', copy('sector'), TRANSFORM_PRESETS.sectors, state.sector)}
                    ${renderSelect('tone', copy('tone'), TRANSFORM_PRESETS.tones, state.tone)}
                    ${renderSelect('objective', copy('objective'), TRANSFORM_PRESETS.objectives, state.objective)}
                </div>
                <textarea data-proposal-output readonly>${escapeHtml(proposalText())}</textarea>
                <div class="demo-actions-row">
                    <button type="button" class="demo-solid" data-action="copy-proposal"><i class="fa-solid fa-copy" aria-hidden="true"></i>${escapeHtml(copy('copyBrief'))}</button>
                    <button type="button" class="demo-ghost" data-action="download-card"><i class="fa-solid fa-image" aria-hidden="true"></i>${escapeHtml(copy('downloadCard'))}</button>
                </div>
            </section>
        `;
    }

    function renderProposalOutput() {
        const area = root.querySelector('[data-proposal-output]');
        if (area) area.value = proposalText();
    }

    function renderComparePanel() {
        const selected = DEMO_PROJECTS.filter((demo) => state.compare.has(demo.id));
        return `
            <section class="demo-tool-card demo-compare-card">
                <div class="demo-block-title"><strong>${escapeHtml(copy('compare'))}</strong><span>${selected.length} ${escapeHtml(copy('selectedCompare'))}. Sin tabla horizontal: cada demo queda como ficha escaneable.</span></div>
                <div class="demo-compare-picks">
                    ${DEMO_PROJECTS.map((demo) => `<button type="button" class="${state.compare.has(demo.id) ? 'active' : ''}" data-action="compare-active" data-compare-id="${escapeHtml(demo.id)}"><img src="${escapeHtml(demo.logo)}" alt=""><span>${escapeHtml(demo.title)}</span></button>`).join('')}
                </div>
                ${selected.length < 2 ? `<p class="demo-muted">${escapeHtml(copy('addCompare'))}</p>` : `
                    <div class="demo-compare-grid">
                        ${selected.map((demo) => `
                            <article class="demo-compare-item" style="--card-accent:${escapeHtml(demo.accent)};--card-accent-2:${escapeHtml(demo.accent2)}">
                                <header><img src="${escapeHtml(demo.logo)}" alt=""><div><small>${escapeHtml(txt(demo.type))}</small><strong>${escapeHtml(demo.title)}</strong></div></header>
                                <dl>
                                    <div><dt>${escapeHtml(copy('objective'))}</dt><dd>${escapeHtml(demo.goals.map(goalLabel).slice(0, 3).join(' · '))}</dd></div>
                                    <div><dt>${escapeHtml(copy('bestFor'))}</dt><dd>${escapeHtml(txt(demo.bestFor))}</dd></div>
                                    <div><dt>${escapeHtml(copy('demoScore'))}</dt><dd>${escapeHtml(metricAverage(demo))}/100</dd></div>
                                    <div><dt>${escapeHtml(copy('visibleBuild'))}</dt><dd>${escapeHtml(demo.build.map(txt).join(' · '))}</dd></div>
                                    <div><dt>${escapeHtml(copy('result'))}</dt><dd>${escapeHtml(txt(demo.result))}</dd></div>
                                </dl>
                            </article>
                        `).join('')}
                    </div>
                `}
            </section>
        `;
    }

    const auditWeights = {
        mobile: { restaurante: 18, tienda: 21, agencia: 17, meridian: 18, eclipse: 16, orbit: 14 },
        cta: { restaurante: 24, tienda: 18, agencia: 17, meridian: 14, eclipse: 20, orbit: 15 },
        identity: { restaurante: 14, tienda: 17, agencia: 27, meridian: 29, eclipse: 24, orbit: 13 },
        catalog: { restaurante: 18, tienda: 30, agencia: 12, meridian: 14, eclipse: 13, orbit: 19 },
        content: { restaurante: 12, tienda: 17, agencia: 28, meridian: 30, eclipse: 23, orbit: 12 },
        operations: { restaurante: 8, tienda: 16, agencia: 8, meridian: 9, eclipse: 15, orbit: 35 },
    };

    const auditIssueCopy = {
        mobile: {
            impact: {
                es: 'El problema móvil no es solo “que se vea pequeño”: afecta a lectura, botones, orden de bloques y confianza en los primeros segundos.',
                en: 'Mobile is not only about small screens: it affects reading, buttons, section order and trust in the first seconds.',
                val: 'El problema mòbil no és només “que es veja xicotet”: afecta lectura, botons, ordre de blocs i confiança en els primers segons.',
            },
            fix: {
                es: 'Prioridad: rehacer jerarquía mobile-first, CTA visible y bloques cortos antes de añadir efectos.',
                en: 'Priority: rebuild mobile-first hierarchy, visible CTA and short blocks before adding effects.',
                val: 'Prioritat: refer jerarquia mobile-first, CTA visible i blocs curts abans d’afegir efectes.',
            },
        },
        cta: {
            impact: {
                es: 'Si el visitante no sabe qué hacer, la web puede ser bonita y aun así perder reservas, ventas o contactos.',
                en: 'If visitors do not know what to do, the site can be beautiful and still lose bookings, sales or leads.',
                val: 'Si el visitant no sap què fer, la web pot ser bonica i encara així perdre reserves, vendes o contactes.',
            },
            fix: {
                es: 'Prioridad: una acción principal por pantalla, CTA repetido y copy orientado a decisión.',
                en: 'Priority: one main action per screen, repeated CTA and decision-oriented copy.',
                val: 'Prioritat: una acció principal per pantalla, CTA repetit i copy orientat a decisió.',
            },
        },
        identity: {
            impact: {
                es: 'La falta de identidad hace que la web parezca plantilla: no diferencia el negocio ni justifica valor.',
                en: 'A weak identity makes the site feel like a template: it does not differentiate the business or justify value.',
                val: 'La falta d’identitat fa que la web semble plantilla: no diferencia el negoci ni justifica valor.',
            },
            fix: {
                es: 'Prioridad: dirección visual, paleta, tono de voz, logo/hero coherente y microinteracciones con personalidad.',
                en: 'Priority: visual direction, palette, tone of voice, coherent logo/hero and personality-driven microinteractions.',
                val: 'Prioritat: direcció visual, paleta, to de veu, logo/hero coherent i microinteraccions amb personalitat.',
            },
        },
        catalog: {
            impact: {
                es: 'Si productos, precios o servicios no se entienden rápido, el visitante compara menos y pregunta menos.',
                en: 'If products, prices or services are not understood quickly, visitors compare less and ask less.',
                val: 'Si productes, preus o serveis no s’entenen ràpid, el visitant compara menys i pregunta menys.',
            },
            fix: {
                es: 'Prioridad: tarjetas claras, categorías, precios/beneficios, filtros simples y cierre por CTA.',
                en: 'Priority: clear cards, categories, prices/benefits, simple filters and CTA closing.',
                val: 'Prioritat: targetes clares, categories, preus/beneficis, filtres simples i tancament per CTA.',
            },
        },
        content: {
            impact: {
                es: 'Tener fotos o trabajos no basta: si no hay narrativa, el contenido no vende experiencia ni confianza.',
                en: 'Having photos or work is not enough: without narrative, content does not sell experience or trust.',
                val: 'Tindre fotos o treballs no és suficient: sense narrativa, el contingut no ven experiència ni confiança.',
            },
            fix: {
                es: 'Prioridad: casos destacados, galería con intención, antes/después, testimonios y orden por impacto.',
                en: 'Priority: featured cases, intentional gallery, before/after, testimonials and impact-based order.',
                val: 'Prioritat: casos destacats, galeria amb intenció, abans/després, testimonis i ordre per impacte.',
            },
        },
        operations: {
            impact: {
                es: 'Cuando la web también debe ordenar tareas, clientes o información, una landing simple se queda corta.',
                en: 'When the website also needs to organise tasks, clients or information, a simple landing is not enough.',
                val: 'Quan la web també ha d’ordenar tasques, clients o informació, una landing simple es queda curta.',
            },
            fix: {
                es: 'Prioridad: arquitectura tipo dashboard, vistas por estado, filtros, acciones rápidas y datos escaneables.',
                en: 'Priority: dashboard architecture, status views, filters, quick actions and scannable data.',
                val: 'Prioritat: arquitectura tipus dashboard, vistes per estat, filtres, accions ràpides i dades escanejables.',
            },
        },
    };

    const auditPairCopy = {
        'mobile+cta': {
            es: 'Móvil + CTA: el primer objetivo es que alguien pueda entender y actuar con el pulgar en menos de 10 segundos.',
            en: 'Mobile + CTA: the first goal is that someone can understand and act with one thumb in under 10 seconds.',
            val: 'Mòbil + CTA: el primer objectiu és que algú puga entendre i actuar amb el polze en menys de 10 segons.',
        },
        'mobile+identity': {
            es: 'Móvil + identidad: hay que simplificar sin matar la personalidad; menos bloques, más carácter visual.',
            en: 'Mobile + identity: simplify without killing personality; fewer blocks, stronger visual character.',
            val: 'Mòbil + identitat: cal simplificar sense matar la personalitat; menys blocs, més caràcter visual.',
        },
        'mobile+catalog': {
            es: 'Móvil + catálogo: necesitas cards compactas, categorías y una ruta clara hacia producto, precio o reserva.',
            en: 'Mobile + catalog: you need compact cards, categories and a clear path to product, price or booking.',
            val: 'Mòbil + catàleg: necessites targetes compactes, categories i una ruta clara cap a producte, preu o reserva.',
        },
        'mobile+content': {
            es: 'Móvil + contenido: las fotos/casos deben tener ritmo vertical; si todo pesa igual, nada destaca.',
            en: 'Mobile + content: photos/cases need vertical rhythm; if everything has equal weight, nothing stands out.',
            val: 'Mòbil + contingut: fotos/casos necessiten ritme vertical; si tot pesa igual, res destaca.',
        },
        'mobile+operations': {
            es: 'Móvil + gestión: la interfaz necesita vistas muy resumidas; no puedes volcar un dashboard de escritorio tal cual.',
            en: 'Mobile + management: the interface needs very summarized views; you cannot dump a desktop dashboard as-is.',
            val: 'Mòbil + gestió: la interfície necessita vistes molt resumides; no pots bolcar un dashboard d’escriptori tal qual.',
        },
        'cta+identity': {
            es: 'CTA + identidad: el botón no debe parecer pegado; tiene que sonar y verse como parte de la marca.',
            en: 'CTA + identity: the button should not feel pasted on; it must sound and look like part of the brand.',
            val: 'CTA + identitat: el botó no ha de semblar pegat; ha de sonar i veure’s com part de la marca.',
        },
        'cta+catalog': {
            es: 'CTA + catálogo: cada producto/servicio necesita un siguiente paso propio: reservar, pedir info, añadir o comparar.',
            en: 'CTA + catalog: every product/service needs its own next step: book, request info, add or compare.',
            val: 'CTA + catàleg: cada producte/servei necessita un següent pas propi: reservar, demanar info, afegir o comparar.',
        },
        'cta+content': {
            es: 'CTA + contenido: después de enseñar un caso/foto debe existir una acción contextual, no solo un contacto al final.',
            en: 'CTA + content: after showing a case/photo there must be a contextual action, not only a contact button at the end.',
            val: 'CTA + contingut: després d’ensenyar un cas/foto ha d’existir una acció contextual, no sols un contacte al final.',
        },
        'cta+operations': {
            es: 'CTA + gestión: no basta con “contactar”; hacen falta acciones internas claras: crear, filtrar, revisar o asignar.',
            en: 'CTA + management: “contact” is not enough; clear internal actions are needed: create, filter, review or assign.',
            val: 'CTA + gestió: no basta amb “contactar”; calen accions internes clares: crear, filtrar, revisar o assignar.',
        },
        'identity+catalog': {
            es: 'Identidad + catálogo: el catálogo debe parecer marca propia, no una tabla de precios disfrazada.',
            en: 'Identity + catalog: the catalog must feel like a real brand, not a disguised price table.',
            val: 'Identitat + catàleg: el catàleg ha de semblar marca pròpia, no una taula de preus disfressada.',
        },
        'identity+content': {
            es: 'Identidad + contenido: aquí manda una dirección visual fuerte; el contenido debe contar una historia reconocible.',
            en: 'Identity + content: strong visual direction matters; the content must tell a recognizable story.',
            val: 'Identitat + contingut: ací mana una direcció visual forta; el contingut ha de contar una història recognoscible.',
        },
        'identity+operations': {
            es: 'Identidad + gestión: incluso un panel funcional necesita personalidad para no parecer software genérico.',
            en: 'Identity + management: even a functional panel needs personality to avoid looking like generic software.',
            val: 'Identitat + gestió: fins i tot un panell funcional necessita personalitat per no semblar software genèric.',
        },
        'catalog+content': {
            es: 'Catálogo + contenido: conviene separar “lo que vendo” de “la prueba de que sé hacerlo”, y conectarlos con CTAs.',
            en: 'Catalog + content: separate “what I sell” from “proof that I can do it”, then connect both with CTAs.',
            val: 'Catàleg + contingut: convé separar “el que venc” de “la prova que sé fer-ho”, i connectar-ho amb CTAs.',
        },
        'catalog+operations': {
            es: 'Catálogo + gestión: ya no hablamos de landing; necesitas estructura de producto/datos, filtros y estados.',
            en: 'Catalog + management: this is no longer a landing; you need product/data structure, filters and states.',
            val: 'Catàleg + gestió: ja no parlem de landing; necessites estructura de producte/dades, filtres i estats.',
        },
        'content+operations': {
            es: 'Contenido + gestión: los casos o archivos deben poder ordenarse; aquí encaja una interfaz tipo CRM/portfolio avanzado.',
            en: 'Content + management: cases or files must be sortable; a CRM/advanced portfolio interface fits here.',
            val: 'Contingut + gestió: els casos o arxius han de poder ordenar-se; ací encaixa una interfície tipus CRM/portfolio avançat.',
        },
    };

    const auditTripleCopy = [
        {
            ids: ['mobile', 'cta', 'catalog'],
            text: {
                es: 'Patrón detectado: el usuario no llega bien al producto/servicio. Hay que rediseñar desde el móvil hacia la decisión.',
                en: 'Detected pattern: the user does not reach the product/service well. Redesign from mobile toward the decision.',
                val: 'Patró detectat: l’usuari no arriba bé al producte/servei. Cal redissenyar des del mòbil cap a la decisió.',
            },
        },
        {
            ids: ['identity', 'content', 'cta'],
            text: {
                es: 'Patrón detectado: hay material, pero no relato de marca. La solución es dirección visual + casos + CTA contextual.',
                en: 'Detected pattern: there is material, but no brand story. The solution is visual direction + cases + contextual CTA.',
                val: 'Patró detectat: hi ha material, però no relat de marca. La solució és direcció visual + casos + CTA contextual.',
            },
        },
        {
            ids: ['operations', 'catalog', 'mobile'],
            text: {
                es: 'Patrón detectado: necesitas sistema, no escaparate. Primero arquitectura de información; después visual.',
                en: 'Detected pattern: you need a system, not a showcase. Information architecture first; visual layer later.',
                val: 'Patró detectat: necessites sistema, no aparador. Primer arquitectura d’informació; després visual.',
            },
        },
        {
            ids: ['mobile', 'cta', 'identity', 'catalog', 'content', 'operations'],
            text: {
                es: 'Patrón completo: la web actual falla como marca, como interfaz y como flujo comercial. No conviene copiar una demo: conviene combinar arquitectura de Orbit, claridad de Nórdica y dirección visual de FORMA/Meridian.',
                en: 'Full pattern: the current site fails as brand, interface and commercial flow. Do not copy one demo: combine Orbit architecture, Nórdica clarity and FORMA/Meridian visual direction.',
                val: 'Patró complet: la web actual falla com marca, interfície i flux comercial. No convé copiar una demo: convé combinar arquitectura d’Orbit, claredat de Nórdica i direcció visual de FORMA/Meridian.',
            },
        },
    ];

    function auditText(value) {
        return localText(value, getLang());
    }

    function auditPairKey(a, b) {
        return [a, b].sort().join('+');
    }

    function auditSelectedIds() {
        return AUDIT_ITEMS.filter((item) => state.audit.has(item.id)).map((item) => item.id);
    }

    function auditCombinationInsights(ids) {
        const insights = [];
        auditTripleCopy.forEach((rule) => {
            if (rule.ids.every((id) => ids.includes(id))) insights.push(auditText(rule.text));
        });
        for (let i = 0; i < ids.length; i += 1) {
            for (let j = i + 1; j < ids.length; j += 1) {
                const copyForPair = auditPairCopy[auditPairKey(ids[i], ids[j])];
                if (copyForPair) insights.push(auditText(copyForPair));
            }
        }
        return [...new Set(insights)].slice(0, ids.length >= 5 ? 7 : 5);
    }

    function auditRecommendations(checked) {
        const selectedIds = checked.map((item) => item.id);
        const allProblems = selectedIds.length >= 5;
        return DEMO_PROJECTS.map((demo) => {
            let score = metricAverage(demo) * 0.12;
            const reasons = [];
            checked.forEach((item) => {
                const value = auditWeights[item.id]?.[demo.id] || 0;
                score += value;
                if (value >= 18) reasons.push(txt(item.short || item.text));
            });
            if (selectedIds.includes('operations') && selectedIds.includes('catalog') && demo.id === 'orbit') score += 16;
            if (selectedIds.includes('identity') && selectedIds.includes('content') && ['agencia', 'meridian'].includes(demo.id)) score += 14;
            if (selectedIds.includes('mobile') && selectedIds.includes('cta') && ['restaurante', 'tienda'].includes(demo.id)) score += 10;
            if (allProblems && demo.id === 'restaurante') score -= 10;
            if (allProblems && ['orbit', 'tienda', 'agencia', 'meridian'].includes(demo.id)) score += 8;
            if (state.goal !== 'all' && demo.goals.includes(state.goal)) score += 8;
            return { demo, score: Math.round(score), reasons: [...new Set(reasons)] };
        }).sort((a, b) => b.score - a.score).slice(0, 3);
    }

    function auditScore(ids) {
        const severity = { mobile: 18, cta: 16, identity: 15, catalog: 15, content: 14, operations: 18 };
        const pairPenalty = ids.length > 1 ? Math.min(18, (ids.length - 1) * 4) : 0;
        const raw = 100 - ids.reduce((sum, id) => sum + (severity[id] || 12), 0) - pairPenalty;
        return Math.max(8, raw);
    }

    function auditExactNarrative(checked, recommendations) {
        const ids = checked.map((item) => item.id);
        const labelList = checked.map((item) => txt(item.short)).join(' + ');
        const top = recommendations[0]?.demo;
        const has = (id) => ids.includes(id);
        const priority = ['operations', 'mobile', 'cta', 'catalog', 'identity', 'content'];
        const main = priority.find(has) || ids[0];
        const mainLabel = txt(checked.find((item) => item.id === main)?.short || checked[0]?.short || '');
        const routeMap = {
            operations: {
                es: 'Base tipo sistema: vistas, estados, filtros y acciones. Primero ordenar la información; después vestirla con marca.',
                en: 'System-like base: views, statuses, filters and actions. Organise information first; style it with brand afterwards.',
                val: 'Base tipus sistema: vistes, estats, filtres i accions. Primer ordenar informació; després vestir-la amb marca.',
            },
            mobile: {
                es: 'Base mobile-first: hero corto, CTA grande, cards verticales y nada que obligue a hacer zoom o pelear con scrolls internos.',
                en: 'Mobile-first base: short hero, large CTA, vertical cards and nothing that forces zooming or fighting inner scrolls.',
                val: 'Base mobile-first: hero curt, CTA gran, cards verticals i res que obligue a fer zoom o barallar-se amb scrolls interns.',
            },
            cta: {
                es: 'Base de conversión: una acción principal por pantalla, copy de decisión y cierre claro en cada bloque importante.',
                en: 'Conversion base: one main action per screen, decision copy and clear closing in every important block.',
                val: 'Base de conversió: una acció principal per pantalla, copy de decisió i tancament clar en cada bloc important.',
            },
            catalog: {
                es: 'Base catálogo/oferta: servicios o productos comparables, categorías claras y CTA contextual en cada tarjeta.',
                en: 'Catalog/offer base: comparable services or products, clear categories and contextual CTA on every card.',
                val: 'Base catàleg/oferta: serveis o productes comparables, categories clares i CTA contextual en cada targeta.',
            },
            identity: {
                es: 'Base de marca: dirección visual reconocible, tono de voz propio, hero con carácter y componentes que no parezcan plantilla.',
                en: 'Brand base: recognizable art direction, own tone of voice, characterful hero and components that do not feel templated.',
                val: 'Base de marca: direcció visual recognoscible, to de veu propi, hero amb caràcter i components que no semblen plantilla.',
            },
            content: {
                es: 'Base portfolio/contenido: casos seleccionados, relato, prueba visual y llamadas a la acción justo después de enseñar valor.',
                en: 'Portfolio/content base: selected cases, narrative, visual proof and calls to action right after showing value.',
                val: 'Base portfolio/contingut: casos seleccionats, relat, prova visual i crides a l’acció just després d’ensenyar valor.',
            },
        };
        const blockers = [];
        if (has('mobile') && has('cta')) blockers.push(auditText({ es: 'la acción se pierde justo donde más importa: en móvil', en: 'the action is lost exactly where it matters most: on mobile', val: 'l’acció es perd just on més importa: en mòbil' }));
        if (has('catalog') && has('cta')) blockers.push(auditText({ es: 'la oferta existe, pero no empuja a decidir', en: 'the offer exists, but it does not push a decision', val: 'l’oferta existeix, però no espenta a decidir' }));
        if (has('identity') && has('content')) blockers.push(auditText({ es: 'hay material visual, pero no una historia de marca', en: 'there is visual material, but not a brand story', val: 'hi ha material visual, però no una història de marca' }));
        if (has('operations') && has('catalog')) blockers.push(auditText({ es: 'ya no basta una landing: hace falta arquitectura de datos', en: 'a landing is no longer enough: data architecture is needed', val: 'ja no basta una landing: cal arquitectura de dades' }));
        if (has('operations') && has('mobile')) blockers.push(auditText({ es: 'hay que resumir un sistema complejo sin romperlo en pantallas pequeñas', en: 'a complex system must be summarized without breaking it on small screens', val: 'cal resumir un sistema complex sense trencar-lo en pantalles xicotetes' }));
        const blockerText = blockers.length ? blockers.join('; ') : auditText({ es: `el foco principal es ${mainLabel.toLowerCase()}`, en: `the main focus is ${mainLabel.toLowerCase()}`, val: `el focus principal és ${mainLabel.toLowerCase()}` });
        return {
            title: auditText({
                es: ids.length >= 5 ? 'Escenario complejo: no copies una demo, combina sistemas' : `Escenario exacto: ${labelList}`,
                en: ids.length >= 5 ? 'Complex scenario: do not copy one demo, combine systems' : `Exact scenario: ${labelList}`,
                val: ids.length >= 5 ? 'Escenari complex: no copies una demo, combina sistemes' : `Escenari exacte: ${labelList}`,
            }),
            summary: auditText({
                es: `Has marcado ${ids.length} problema${ids.length === 1 ? '' : 's'} y el bloqueo real es que ${blockerText}. Por eso la base recomendada ahora es ${top?.title || 'la demo mejor puntuada'}, no la más simple.`,
                en: `You selected ${ids.length} issue${ids.length === 1 ? '' : 's'} and the real blocker is that ${blockerText}. That is why the recommended base is now ${top?.title || 'the highest scoring demo'}, not the simplest one.`,
                val: `Has marcat ${ids.length} problema${ids.length === 1 ? '' : 's'} i el bloqueig real és que ${blockerText}. Per això la base recomanada ara és ${top?.title || 'la demo millor puntuada'}, no la més simple.`,
            }),
            route: auditText(routeMap[main] || routeMap.cta),
        };
    }

    function auditDiagnosis(checked, recommendations) {
        const ids = checked.map((item) => item.id);
        if (!ids.length) {
            return {
                title: 'Diagnóstico pendiente',
                summary: 'Marca problemas concretos y el texto cambiará por combinación exacta: problema principal, bloqueo real, ruta recomendada y demos ponderadas.',
                insights: ['Cada checkbox tiene peso distinto según la demo. Si combinas problemas, se cruzan pares y patrones, no se recomienda siempre la opción más simple.'],
            };
        }
        if (ids.length === 1) {
            const item = checked[0];
            const exact = auditExactNarrative(checked, recommendations);
            return {
                title: exact.title,
                summary: auditText(auditIssueCopy[item.id].impact),
                insights: [exact.route, auditText(auditIssueCopy[item.id].fix)],
            };
        }
        const exact = auditExactNarrative(checked, recommendations);
        return {
            title: exact.title,
            summary: exact.summary,
            insights: [exact.route, ...auditCombinationInsights(ids)],
        };
    }

    function auditActionPlan(checked) {
        const actions = {
            mobile: 'Reordenar el hero y las primeras secciones para 390px antes de tocar desktop.',
            cta: 'Definir una acción principal y repetirla en hero, tarjetas y cierre.',
            identity: 'Crear una dirección visual propia: paleta, logo, tono, hero y microinteracciones.',
            catalog: 'Convertir servicios/productos en cards con categorías, beneficios y siguiente paso.',
            content: 'Elegir casos/fotos clave y convertirlos en prueba visual, no en galería plana.',
            operations: 'Diseñar vistas por estado, filtros y acciones rápidas como si fuera una mini app.',
        };
        return checked.map((item, index) => ({
            step: String(index + 1).padStart(2, '0'),
            title: txt(item.short),
            text: actions[item.id] || txt(item.text),
        }));
    }

    function renderAuditPanel(returnHtml = false) {
        const checked = AUDIT_ITEMS.filter((item) => state.audit.has(item.id));
        const ids = checked.map((item) => item.id);
        const recommendations = auditRecommendations(checked);
        const score = auditScore(ids);
        const diagnosis = auditDiagnosis(checked, recommendations);
        const plan = auditActionPlan(checked);
        const html = `
            <section class="demo-tool-card audit-card smart-audit-card">
                <div class="demo-block-title"><strong>${escapeHtml(copy('auditTitle'))}</strong><span>${escapeHtml(copy('auditIntro'))}</span></div>
                <div class="demo-audit-list smart-audit-list">
                    ${AUDIT_ITEMS.map((item) => `<label class="${state.audit.has(item.id) ? 'active' : ''}"><input type="checkbox" data-audit-item value="${escapeHtml(item.id)}" ${state.audit.has(item.id) ? 'checked' : ''}><span><b>${escapeHtml(txt(item.short))}</b><em>${escapeHtml(txt(item.text))}</em></span></label>`).join('')}
                </div>
                <article class="demo-audit-result strong">
                    <strong>${escapeHtml(copy('auditResult'))}: ${score}/100</strong>
                    <h4>${escapeHtml(diagnosis.title)}</h4>
                    <p>${escapeHtml(diagnosis.summary)}</p>
                    ${diagnosis.insights.length ? `<div class="audit-insights">${diagnosis.insights.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div>` : ''}
                    ${plan.length ? `<div class="audit-plan"><b>Plan de ataque</b>${plan.map((item) => `<span><i>${escapeHtml(item.step)}</i><strong>${escapeHtml(item.title)}</strong><em>${escapeHtml(item.text)}</em></span>`).join('')}</div>` : ''}
                    <div class="demo-audit-recs">
                        ${recommendations.map(({ demo, score: demoScore, reasons }, index) => `
                            <button type="button" data-demo-id="${escapeHtml(demo.id)}" class="${index === 0 ? 'primary' : ''}">
                                <img src="${escapeHtml(demo.logo)}" alt="">
                                <span><b>${index === 0 ? 'Base recomendada · ' : ''}${escapeHtml(demo.title)}</b><em>${escapeHtml(demoScore)} pts · ${escapeHtml(reasons.slice(0, 3).join(' + ') || txt(demo.bestFor))}</em></span>
                            </button>
                        `).join('')}
                    </div>
                </article>
            </section>
        `;
        if (returnHtml) return html;
        const container = root.querySelector('[data-panel-content]');
        if (container) container.innerHTML = html;
        return html;
    }


    init();
}
