'use strict';

const crypto = require('crypto');
const fs     = require('fs');
const { execSync } = require('child_process');

const PROJECT_ID    = 'pulso-blog';
const CLIENT_EMAIL  = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY   = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const BREVO_KEY     = process.env.BREVO_API_KEY;
const BLOG_URL      = 'https://danielux135.github.io/blog/';
const PORTFOLIO_URL = 'https://danielux135.github.io/';
const LOGO_URL      = 'https://danielux135.github.io/assets/fosky.png';
const UNSUB_BASE    = 'https://danielux135-github-io.vercel.app/api/unsubscribe';

// detecta qué archivos de edición hay que enviar
function getNewPosts() {
  // en lanzamiento manual, usa la fecha indicada o la de hoy
  const manualDate = process.env.MANUAL_DATE;
  if (manualDate || process.env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
    const date = manualDate || new Date().toISOString().slice(0, 10);
    const f = `public/blog/posts/${date}.json`;
    return require('fs').existsSync(f) ? [f] : [];
  }
  try {
    const before = process.env.BEFORE_SHA;
    const after  = process.env.AFTER_SHA || 'HEAD';
    const cmd = (before && before !== '0000000000000000000000000000000000000000')
      ? `git diff --name-only ${before} ${after}`
      : `git show --name-only --pretty=format: HEAD`;
    return execSync(cmd).toString().trim().split('\n')
      .filter(f => /^public\/blog\/posts\/\d{4}-\d{2}-\d{2}\.json$/.test(f));
  } catch {
    return [];
  }
}

// token OAuth2 para Firestore
async function getToken() {
  const now    = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({
    iss: CLIENT_EMAIL, sub: CLIENT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore'
  })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claims}`);
  const sig  = sign.sign(PRIVATE_KEY, 'base64url');
  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${sig}`
    })
  });
  const body = await res.json();
  if (!body.access_token) throw new Error('Token fallido: ' + JSON.stringify(body));
  return body.access_token;
}

// lista de suscriptores desde Firestore
async function getSubscribers(token) {
  const res  = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/subscribers`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  return (body.documents || []).map(d => {
    const f     = d.fields || {};
    const email = f.email?.stringValue || '';
    const langs = (f.langs?.arrayValue?.values || []).map(v => v.stringValue);
    return { email, langs: langs.length ? langs : ['es'] };
  }).filter(s => s.email);
}

// --- plantilla de email ---
const CAT_LABELS = {
  gaming: 'Gaming',
  gratis: { es: 'Juegos gratis', en: 'Free games', val: 'Jocs gratis' },
  codigo: { es: 'Código', en: 'Code', val: 'Codi' },
  ciencia: { es: 'Ciencia', en: 'Science', val: 'Ciència' },
  economia: { es: 'Economía', en: 'Economy', val: 'Economia' },
  cripto: 'Cripto', radar: 'Radar',
  ia: { es: 'IA', en: 'AI', val: 'IA' },
  hardware: 'Hardware',
  security: { es: 'Seguridad', en: 'Security', val: 'Seguretat' },
  entretenimiento: { es: 'Entretenimiento', en: 'Entertainment', val: 'Entreteniment' },
  curiosidades: { es: 'Curiosidades', en: 'Curiosities', val: 'Curiositats' },
  ofertas: { es: 'Ofertas', en: 'Deals', val: 'Ofertes' },
  anime: 'Anime'
};
const CAT_COLORS = {
  gaming: '#5eead4', gratis: '#34d399', codigo: '#a3e635', ciencia: '#7dd3fc',
  economia: '#fbbf24', cripto: '#c084fc', radar: '#fb7185', ia: '#ec4899',
  hardware: '#f59e0b', security: '#ef4444', entretenimiento: '#8b5cf6',
  curiosidades: '#06b6d4', ofertas: '#fb923c', anime: '#f472b6'
};
const LANG_NAMES = { es: 'ESPAÑOL', en: 'ENGLISH', val: 'VALENCIÀ' };
const UNTIL_PFX  = { es: 'Hasta ', en: 'Until ', val: 'Fins ' };
const CTA_LBL    = { es: 'Ver en el blog', en: 'Open in blog', val: 'Veure al blog' };
const UNSUB_LBL  = { es: 'Cancelar suscripción', en: 'Unsubscribe', val: 'Cancel·lar subscripció' };
const BY_LBL     = { es: 'Proyecto de', en: 'A project by', val: 'Projecte de' };

function L(obj, lang) {
  if (obj && typeof obj === 'object') return obj[lang] || obj.es || '';
  return String(obj || '');
}

function buildLangBlock(ed, lang) {
  let html = `<tr><td style="padding:24px 0 12px"><h2 style="color:#f8fafc;font-size:20px;font-weight:700;line-height:1.35;margin:0;font-family:sans-serif">${L(ed.title, lang)}</h2></td></tr>`;
  html += `<tr><td style="padding:0 0 28px;border-bottom:2px solid #1e3a3a"><p style="color:#e2e8f0;font-size:15px;line-height:1.9;margin:0;font-family:sans-serif">${L(ed.intro, lang)}</p></td></tr>`;

  for (const sec of (ed.sections || [])) {
    const cat    = sec.category;
    const clabel = typeof CAT_LABELS[cat] === 'object'
      ? (CAT_LABELS[cat][lang] || CAT_LABELS[cat].es || cat)
      : (CAT_LABELS[cat] || cat);
    const color  = CAT_COLORS[cat] || '#5eead4';
    const items  = cat === 'ofertas'
      ? (sec.items || []).filter(it => !it.market || it.market === lang || it.market === 'all')
      : (sec.items || []);
    if (!items.length) continue;

    html += `<tr><td style="padding:44px 0 18px" align="center"><span style="display:inline-block;background:#101f33;color:${color};font-size:14px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;padding:11px 28px;border-radius:8px;border:1px solid ${color}66;font-family:monospace">${clabel}</span></td></tr>`;
    let rows = '';
    items.forEach((item, idx) => {
      const t       = L(item.title, lang);
      const s       = L(item.summary, lang);
      const url     = item.url || '';
      const divider = idx < items.length - 1 ? 'border-bottom:1px solid #24405a' : '';
      const titleH  = url && url !== '#'
        ? `<a href="${url}" style="color:#ffffff;text-decoration:none;font-weight:800;font-size:18px;line-height:1.4;font-family:sans-serif">${t}</a>`
        : `<span style="color:#ffffff;font-weight:800;font-size:18px;line-height:1.4;font-family:sans-serif">${t}</span>`;

      let priceH = '';
      if (item.salePrice || item.originalPrice) {
        const parts = [];
        const op = L(item.originalPrice, lang); const sp = L(item.salePrice, lang); const dc = L(item.discount, lang);
        if (op) parts.push(`<span style="color:#94a3b8;text-decoration:line-through;font-size:14px">${op}</span>`);
        if (sp) parts.push(`<span style="color:#a3e635;font-weight:800;font-size:18px">${sp}</span>`);
        if (dc) parts.push(`<span style="color:#a3e635;font-size:13px">(${dc})</span>`);
        if (parts.length) priceH = `<p style="margin:12px 0 0;font-family:sans-serif">${parts.join('&nbsp;&nbsp;')}</p>`;
      }

      const metas = [];
      if (item.platform) metas.push(L(item.platform, lang));
      if (item.until) { const uv = L(item.until, lang); if (uv) metas.push((UNTIL_PFX[lang] || '') + uv); }
      const metaH = metas.length
        ? `<p style="margin:10px 0 0;color:${color};font-size:13px;font-weight:700;font-family:sans-serif">${metas.join(' · ')}${item.urgent ? ' 🔥' : ''}</p>`
        : '';

      let linksH = '';
      if ((item.links || []).length) {
        linksH = '<p style="margin:14px 0 0;font-family:sans-serif">';
        for (const lk of item.links) {
          const lt = L(lk.title, lang) || lk.url || '';
          linksH += `<a href="${lk.url}" style="color:#5eead4;font-size:13px;text-decoration:none;border:1px solid #2a4a4a;border-radius:5px;padding:5px 11px;display:inline-block;margin:0 8px 6px 0">→ ${lt}</a>`;
        }
        linksH += '</p>';
      }

      rows += `<tr><td style="padding:22px 26px;${divider}">${titleH}<p style="color:#e2e8f0;font-size:15px;line-height:1.9;margin:12px 0 0;font-family:sans-serif">${s}</p>${priceH}${metaH}${linksH}</td></tr>`;
    });
    html += `<tr><td style="padding:0 0 16px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#101f33;border:1px solid ${color}33;border-radius:14px;border-left:4px solid ${color}">${rows}</table></td></tr>`;
  }
  return html;
}

function buildFullEmail(ed, langs, email) {
  const unsubUrl  = `${UNSUB_BASE}?email=${encodeURIComponent(email)}`;
  const firstLang = langs[0] || 'es';
  const multi     = langs.length > 1;
  let inner = '';
  langs.forEach((lang, i) => {
    if (multi) {
      const pad  = i === 0 ? '32px' : '52px';
      const name = LANG_NAMES[lang] || lang.toUpperCase();
      inner += `<tr><td style="padding:${pad} 0 24px;text-align:center"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background:#1e3a3a"></td><td style="padding:0 20px;white-space:nowrap;text-align:center"><span style="color:#5eead4;font-size:24px;font-weight:900;letter-spacing:.1em;font-family:sans-serif">${name}</span></td><td style="height:1px;background:#1e3a3a"></td></tr></table></td></tr>`;
    }
    inner += buildLangBlock(ed, lang);
  });
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0c1a2e;font-family:sans-serif;margin:0;padding:24px 12px">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="580" style="max-width:580px" cellpadding="0" cellspacing="0">
<tr><td style="padding:28px 0 24px;border-bottom:2px solid #1e3a3a;text-align:center">
  <img src="${LOGO_URL}" alt="FoskIA" width="48" height="48" style="display:block;margin:0 auto 10px;border-radius:12px">
  <span style="color:#5eead4;font-size:30px;font-weight:900;letter-spacing:-.02em;font-family:sans-serif">FoskIA.</span>
</td></tr>
${inner}
<tr><td style="padding:40px 0 24px;text-align:center">
  <a href="${BLOG_URL}" style="background:#5eead4;color:#0a1628;padding:14px 34px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;font-family:sans-serif">${CTA_LBL[firstLang] || 'Ver'}</a>
</td></tr>
<tr><td style="border-top:1px solid #1e3a3a;padding:28px 0 20px;text-align:center">
  <img src="${LOGO_URL}" alt="" width="36" height="36" style="display:block;margin:0 auto 12px;border-radius:8px;opacity:.7">
  <p style="color:#94a3b8;font-size:12px;margin:0 0 6px;font-family:sans-serif">${BY_LBL[firstLang] || 'Proyecto de'} <a href="${PORTFOLIO_URL}" style="color:#5eead4;text-decoration:none;font-weight:700">Daniel Bort Guzmán</a></p>
  <p style="margin:0;font-family:sans-serif"><a href="${unsubUrl}" style="color:#475569;font-size:11px;text-decoration:underline">${UNSUB_LBL[firstLang] || 'Cancelar'}</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

// --- main ---
async function main() {
  const posts = getNewPosts();
  if (!posts.length) { console.log('Sin posts nuevos, nada que enviar.'); return; }
  console.log('Posts detectados:', posts);

  if (!CLIENT_EMAIL || !PRIVATE_KEY || !BREVO_KEY) {
    throw new Error('Faltan variables de entorno: FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY o BREVO_API_KEY');
  }

  const token = await getToken();
  const subs  = await getSubscribers(token);
  console.log(`${subs.length} suscriptores encontrados`);
  if (!subs.length) return;

  // agrupar idiomas por email
  const byEmail = {};
  for (const s of subs) {
    if (!byEmail[s.email]) byEmail[s.email] = [];
    for (const l of s.langs) if (!byEmail[s.email].includes(l)) byEmail[s.email].push(l);
  }

  for (const postFile of posts) {
    const ed   = JSON.parse(fs.readFileSync(postFile, 'utf8'));
    const date = ed.date;
    console.log(`Enviando edición ${date}...`);
    let ok = 0, fail = 0;

    for (const [email, langs] of Object.entries(byEmail)) {
      const html = buildFullEmail(ed, langs, email);
      const res  = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender:      { name: 'FoskIA', email: 'danielux135@gmail.com' },
          replyTo:     { email: 'danielux135@gmail.com' },
          to:          [{ email }],
          subject:     `FoskIA · ${date}`,
          htmlContent: html
        })
      });
      if (res.ok) { ok++; console.log(`✓ ${email}`); }
      else { fail++; console.log(`✗ ${email}: ${res.status} ${await res.text()}`); }
    }
    console.log(`${date}: ${ok} enviados, ${fail} fallidos`);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
