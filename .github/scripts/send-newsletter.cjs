'use strict';

const crypto = require('crypto');
const fs     = require('fs');
const { execSync } = require('child_process');

const PROJECT_ID    = 'pulso-blog';
const CLIENT_EMAIL  = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY   = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const BREVO_KEY     = process.env.BREVO_API_KEY;
const BLOG_URL      = 'https://danielux.es/foskia/';
const PORTFOLIO_URL = 'https://danielux.es/';
const LOGO_DATA = 'data:image/png;base64,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';
const UNSUB_BASE    = 'https://danielux135-github-io.vercel.app/api/unsubscribe';

// detecta qué archivos de edición hay que enviar
function getNewPosts() {
  // en lanzamiento manual, usa la fecha indicada o la de hoy
  const manualDate = process.env.MANUAL_DATE;
  if (manualDate || process.env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
    const date = manualDate || new Date().toISOString().slice(0, 10);
const f = `public/foskia/posts/${date}.json`;
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
  <img src="${LOGO_DATA}" alt="FoskIA" width="48" height="48" style="display:block;margin:0 auto 10px;border-radius:12px">
  <span style="color:#5eead4;font-size:30px;font-weight:900;letter-spacing:-.02em;font-family:sans-serif">FoskIA.</span>
</td></tr>
${inner}
<tr><td style="padding:40px 0 24px;text-align:center">
  <a href="${BLOG_URL}" style="background:#5eead4;color:#0a1628;padding:14px 34px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;font-family:sans-serif">${CTA_LBL[firstLang] || 'Ver'}</a>
</td></tr>
<tr><td style="border-top:1px solid #1e3a3a;padding:28px 0 20px;text-align:center">
  <img src="${LOGO_DATA}" alt="" width="36" height="36" style="display:block;margin:0 auto 12px;border-radius:8px;opacity:.7">
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
          htmlContent: html,
          trackClicks: false,
          trackOpens: false
        })
      });
      if (res.ok) { ok++; console.log(`✓ ${email}`); }
      else { fail++; console.log(`✗ ${email}: ${res.status} ${await res.text()}`); }
    }
    console.log(`${date}: ${ok} enviados, ${fail} fallidos`);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
