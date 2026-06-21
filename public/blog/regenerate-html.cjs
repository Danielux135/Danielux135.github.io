#!/usr/bin/env node

/**
 * FoskIA HTML Generator
 * Lee JSONs de posts/ y regenera index.html
 *
 * Uso: node regenerate-html.js
 */

const fs = require('fs');
const path = require('path');

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// CONFIGURACIÓN
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

const POSTS_DIR = path.join(__dirname, 'posts');
const OUTPUT_FILE = path.join(__dirname, 'index.html');
const LANGUAGE = 'es'; // 'es', 'en', 'val'

const CATEGORY_LABELS = {
  es: {
    gaming: 'Gaming',
    economia: 'Economía',
    cripto: 'Cripto',
    ciencia: 'Ciencia',
    codigo: 'Código',
    gratis: 'Gratis',
    radar: 'Radar',
    ia: 'IA',
    hardware: 'Hardware',
    security: 'Seguridad',
    entretenimiento: 'Entretenimiento',
    curiosidades: 'Curiosidades',
    anime: 'Anime',
  },
  en: {
    gaming: 'Gaming',
    economia: 'Economy',
    cripto: 'Crypto',
    ciencia: 'Science',
    codigo: 'Code',
    gratis: 'Free',
    radar: 'Radar',
    ia: 'AI',
    hardware: 'Hardware',
    security: 'Security',
    entretenimiento: 'Entertainment',
    curiosidades: 'Curiosities',
    anime: 'Anime',
  },
  val: {
    gaming: 'Gaming',
    economia: 'Economia',
    cripto: 'Cripto',
    ciencia: 'Ciència',
    codigo: 'Codi',
    gratis: 'Gratis',
    radar: 'Radar',
    ia: 'IA',
    hardware: 'Hardware',
    security: 'Seguretat',
    entretenimiento: 'Entreteniment',
    curiosidades: 'Curiositats',
    anime: 'Anime',
  },
};

const CATEGORY_COLORS = {
  gaming: '#7dd3fc',      // blue
  economia: '#fbbf24',    // amber
  cripto: '#a3e635',      // lime
  ciencia: '#34d399',     // emerald
  codigo: '#c084fc',      // purple
  gratis: '#fb7185',      // rose
  radar: '#5eead4',       // teal
  ia: '#ec4899',          // pink
  hardware: '#f59e0b',    // orange
  security: '#ef4444',    // red
  entretenimiento: '#8b5cf6', // violet
  curiosidades: '#06b6d4',    // cyan
  anime: '#f472b6',           // rose-400
};

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// UTILIDADES
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

function log(msg, type = 'info') {
  const prefix = {
    info: '📰',
    success: '✅',
    error: '❌',
    warn: '⚠️',
  }[type] || '•';
  console.log(`${prefix} ${msg}`);
}

function getTextIn(obj, lang = 'es') {
  return obj[lang] || obj.es || Object.values(obj)[0] || '';
}

function loadPosts() {
  const posts = [];
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
      const post = JSON.parse(content);
      posts.push(post);
    } catch (err) {
      log(`Error al leer ${file}: ${err.message}`, 'error');
    }
  });

  // Ordenar por fecha descendente
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// GENERACIÓN DE HTML
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

function generateItemHTML(item, category) {
  const title = getTextIn(item.title);
  const summary = getTextIn(item.summary);
  const source = item.source || 'Fuente';
  const url = item.url || '#';
  const color = CATEGORY_COLORS[category] || '#5eead4';

  let itemHTML = `
    <div class="item" style="border-left:3px solid ${color};">
      <h4><a href="${url}" target="_blank">${title}</a></h4>
      <p class="summary">${summary}</p>
      <div class="item-meta">
        <span class="source">${source}</span>
  `;

  if (item.links && item.links.length > 0) {
    itemHTML += `<div class="links">`;
    item.links.forEach(link => {
      const linkText = getTextIn(link.title);
      itemHTML += `<a href="${link.url}" target="_blank" class="link-chip">${linkText}</a>`;
    });
    itemHTML += `</div>`;
  }

  if (item.platform) {
    const until = getTextIn(item.until);
    itemHTML += `<div class="platform-badge">${item.platform} • ${until}</div>`;
  }

  itemHTML += `</div></div>`;
  return itemHTML;
}

function generateSectionHTML(section) {
  const categoryLabel = CATEGORY_LABELS[LANGUAGE][section.category] || section.category;
  const categoryColor = CATEGORY_COLORS[section.category] || '#5eead4';

  let html = `
    <section class="category-section">
      <h3 class="category-title" style="border-bottom:2px solid ${categoryColor};">
        <span>${categoryLabel}</span>
      </h3>
      <div class="items-grid">
  `;

  section.items.forEach(item => {
    html += generateItemHTML(item, section.category);
  });

  html += `</div></section>`;
  return html;
}

function generatePostHTML(post) {
  const title = getTextIn(post.title);
  const intro = getTextIn(post.intro);
  const date = new Date(post.date);
  const dateStr = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let html = `
    <article class="edition">
      <header class="edition-header">
        <time datetime="${post.date}">${dateStr}</time>
        <h2>${title}</h2>
        <p class="intro">${intro}</p>
      </header>
      <div class="edition-content">
  `;

  if (post.sections && Array.isArray(post.sections)) {
    post.sections.forEach(section => {
      html += generateSectionHTML(section);
    });
  }

  html += `</div></article>`;
  return html;
}

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// TEMPLATE HTML
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

function generateFullHTML(posts) {
  const postsHTML = posts.map(generatePostHTML).join('');
  const lastUpdate = new Date().toLocaleString('es-ES');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FoskIA · El mundo del día, en un latido</title>
<meta name="description" content="FoskIA – boletín diario que resume las noticias clave de gaming, programación, ciencia y economía. Generado y publicado automáticamente cada madrugada por IA.">
<style>
:root {
  --bg:#08090d; --bg2:#0c0d13; --card:#10131c; --card2:#141720; --line:#1c2030;
  --text:#edf0f7; --muted:#8590a6; --dim:#4c5568;
  --accent:#5eead4; --accent2:#a3e635;
  --font-d:'Newsreader',serif; --font-b:'Space Grotesk',sans-serif; --font-m:'JetBrains Mono',monospace;
}

body {
  font-family: var(--font-b);
  background: var(--bg);
  color: var(--text);
  line-height: 1.65;
  margin: 0;
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}

header {
  border-bottom: 1px solid var(--line);
  padding-bottom: 30px;
  margin-bottom: 40px;
}

.brand { font-size: 2em; font-weight: 700; margin-bottom: 20px; }
.tagline { color: var(--muted); font-size: 0.95em; margin: 10px 0; }
.updated { color: var(--muted); font-size: 0.9em; margin: 5px 0; }

.edition {
  margin-bottom: 60px;
  background: var(--card2);
  border-radius: 12px;
  padding: 40px;
  border-left: 4px solid var(--accent);
}

.edition-header { margin-bottom: 30px; }
.edition-header time { color: var(--accent); font-weight: 600; }
.edition-header h2 { font-size: 1.8em; margin: 15px 0 10px 0; line-height: 1.2; }
.intro { color: var(--muted); font-size: 1.05em; margin-top: 15px; }

.category-section { margin-bottom: 35px; }
.category-title {
  font-size: 1.3em;
  font-weight: 600;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.items-grid {
  display: grid;
  gap: 20px;
}

.item {
  background: var(--card);
  padding: 20px;
  border-radius: 8px;
  transition: transform 0.2s;
}

.item:hover { transform: translateY(-2px); }
.item h4 { margin: 0 0 12px 0; font-size: 1.1em; }
.item h4 a { color: var(--accent); text-decoration: none; }
.item h4 a:hover { text-decoration: underline; }
.item .summary { margin: 0 0 12px 0; color: var(--muted); font-size: 0.95em; line-height: 1.6; }
.item-meta { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.source { font-family: var(--font-m); font-size: 0.85em; color: var(--dim); }
.platform-badge { font-family: var(--font-m); font-size: 0.8em; color: var(--accent2); background: rgba(163,230,53,0.1); padding: 4px 8px; border-radius: 4px; }

.links { display: flex; flex-wrap: wrap; gap: 8px; }
.link-chip {
  font-size: 0.8em;
  padding: 4px 10px;
  border: 1px solid var(--dim);
  border-radius: 20px;
  color: var(--muted);
  text-decoration: none;
  transition: all 0.2s;
}
.link-chip:hover { border-color: var(--accent); color: var(--accent); }

footer {
  text-align: center;
  padding-top: 40px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.9em;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
</head>
<body>

<header>
  <div class="brand">🎮 FoskIA</div>
  <p class="tagline">El mundo del día, en un latido</p>
  <p class="updated">Última actualización: ${lastUpdate}</p>
</header>

<main>
${postsHTML}
</main>

<footer>
  <p>FoskIA – Boletín automático de noticias. <a href="#">Suscribirse</a></p>
</footer>

</body>
</html>`;
}

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// MAIN
// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

function main() {
  log('Iniciando regeneración de HTML...', 'info');

  const posts = loadPosts();

  if (posts.length === 0) {
    log('No se encontraron posts en ' + POSTS_DIR, 'error');
    process.exit(1);
  }

  log(`Encontrados ${posts.length} posts`, 'success');

  const html = generateFullHTML(posts);

  fs.writeFileSync(OUTPUT_FILE, html, 'utf8');

  const distOutput = OUTPUT_FILE.replace('portfolio/public/blog', 'portfolio/dist/blog');
  fs.writeFileSync(distOutput, html, 'utf8');

  log(`HTML generado en ${OUTPUT_FILE}`, 'success');
  log(`HTML copiado a ${distOutput}`, 'success');
  log('¡Regeneración completada!', 'success');
}

main();
