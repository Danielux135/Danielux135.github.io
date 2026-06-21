const fetch = global.fetch || require('node-fetch');

const BLOG_URL      = 'https://danielux135.github.io/blog/';
const PORTFOLIO_URL = 'https://danielux135.github.io/';
const RAW_BASE      = 'https://raw.githubusercontent.com/Danielux135/Danielux135.github.io/main/public/blog/posts';
const UNSUB_BASE    = 'https://danielux135.github.io/blog/unsubscribe';

function cleanEnv(v) {
  if (typeof v !== 'string') return '';
  return v.replace(/\\r/g, '').replace(/^["']|["']$/g, '').trim();
}

function getFirebasePrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY || '';
  return raw.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '').trim();
}

async function getFirestoreToken() {
  const { createSign } = await import('node:crypto');
  const clientEmail = cleanEnv(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey  = getFirebasePrivateKey();
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: clientEmail, sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore'
  })).toString('base64url');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(privateKey, 'base64url');
  const jwt = `${header}.${payload}.${sig}`;
  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('No token: ' + JSON.stringify(data));
  return data.access_token;
}

export async function firestoreRequest(token, method, path, body) {
  const base = 'https://firestore.googleapis.com/v1/projects/pulso-blog/databases/(default)/documents';
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

export { getFirestoreToken };

function L(obj, lang) {
  if (typeof obj === 'string') return obj;
  return obj?.[lang] || obj?.es || '';
}

const CAT_LABELS = {
  gaming:          { es: 'Gaming',          en: 'Gaming',        val: 'Gaming' },
  gratis:          { es: 'Juegos gratis',   en: 'Free games',    val: 'Jocs gratis' },
  codigo:          { es: 'Código',          en: 'Code',          val: 'Codi' },
  ciencia:         { es: 'Ciencia',         en: 'Science',       val: 'Ciència' },
  economia:        { es: 'Economía',        en: 'Economy',       val: 'Economia' },
  cripto:          { es: 'Cripto',          en: 'Crypto',        val: 'Cripto' },
  radar:           { es: 'Radar',           en: 'Radar',         val: 'Radar' },
  ia:              { es: 'IA',              en: 'AI',            val: 'IA' },
  hardware:        { es: 'Hardware',        en: 'Hardware',      val: 'Hardware' },
  security:        { es: 'Seguridad',       en: 'Security',      val: 'Seguretat' },
  entretenimiento: { es: 'Entretenimiento', en: 'Entertainment', val: 'Entreteniment' },
  curiosidades:    { es: 'Curiosidades',    en: 'Curiosities',   val: 'Curiositats' },
  ofertas:         { es: 'Ofertas',         en: 'Deals',         val: 'Ofertes' },
  anime:           { es: 'Anime',           en: 'Anime',         val: 'Anime' },
};

const CAT_COLORS = {
  gaming:          '#5eead4',
  gratis:          '#34d399',
  codigo:          '#a3e635',
  ciencia:         '#7dd3fc',
  economia:        '#fbbf24',
  cripto:          '#c084fc',
  radar:           '#fb7185',
  ia:              '#ec4899',
  hardware:        '#f59e0b',
  security:        '#ef4444',
  entretenimiento: '#8b5cf6',
  curiosidades:    '#06b6d4',
  ofertas:         '#fb923c',
  anime:           '#f472b6',
};

const UNTIL_PREFIX = { es: 'Hasta ', en: 'Until ', val: 'Fins ' };

function buildEditionBlock(edition, lang) {
  const title = L(edition.title, lang);
  const intro = L(edition.intro, lang);

  let html = `
    <tr><td style="padding:24px 0 12px">
      <h2 style="color:#f8fafc;font-size:20px;font-weight:700;line-height:1.35;margin:0;font-family:sans-serif">${title}</h2>
    </td></tr>
    <tr><td style="padding:0 0 28px;border-bottom:2px solid #1e3a3a">
      <p style="color:#e2e8f0;font-size:15px;line-height:1.9;margin:0;font-family:sans-serif">${intro}</p>
    </td></tr>`;

  for (const sec of (edition.sections || [])) {
    const cat   = sec.category;
    const label = L(CAT_LABELS[cat] || { es: cat }, lang);
    const color = CAT_COLORS[cat] || '#5eead4';

    // En ofertas, filtra por mercado
    const rawItems = sec.items || [];
    const items = cat === 'ofertas'
      ? rawItems.filter(it => !it.market || it.market === lang || it.market === 'all')
      : rawItems;
    if (!items.length) continue;

    html += `<tr><td style="padding:44px 0 18px" align="center">
      <span style="display:inline-block;background:#101f33;color:${color};font-size:14px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;padding:11px 28px;border-radius:8px;border:1px solid ${color}66;font-family:monospace">${label}</span>
    </td></tr>`;

    let itemsHtml = '';
    items.forEach((item, idx) => {
      const itemTitle   = L(item.title, lang);
      const itemSummary = L(item.summary, lang);
      const itemUrl     = item.url && item.url !== '#' ? item.url : null;
      const divider     = idx < items.length - 1 ? 'border-bottom:1px solid #24405a' : '';

      // Precios (ofertas)
      let priceHtml = '';
      if (item.salePrice || item.originalPrice) {
        const op = L(item.originalPrice || '', lang);
        const sp = L(item.salePrice || '', lang);
        const dc = L(item.discount || '', lang);
        const parts = [];
        if (op) parts.push(`<span style="color:#94a3b8;text-decoration:line-through;font-size:14px">${op}</span>`);
        if (sp) parts.push(`<span style="color:#a3e635;font-weight:800;font-size:18px">${sp}</span>`);
        if (dc) parts.push(`<span style="color:#a3e635;font-size:13px">(${dc})</span>`);
        if (parts.length) priceHtml = `<p style="margin:12px 0 0;font-family:sans-serif">${parts.join('&nbsp;&nbsp;')}</p>`;
      }

      // Meta (plataforma / caduca)
      const metas = [];
      if (item.platform) metas.push(typeof item.platform === 'object' ? L(item.platform, lang) : item.platform);
      if (item.until) { const uv = L(item.until, lang); if (uv) metas.push(UNTIL_PREFIX[lang] + uv); }
      const metaHtml = metas.length
        ? `<p style="margin:10px 0 0;color:${color};font-size:13px;font-weight:700;font-family:sans-serif">${metas.join(' · ')}${item.urgent ? ' 🔥' : ''}</p>`
        : '';

      let linksHtml = '';
      if (Array.isArray(item.links) && item.links.length) {
        linksHtml = `<p style="margin:14px 0 0;font-family:sans-serif">` +
          item.links.map(lk => {
            const lkTitle = L(lk.title || lk.label || '', lang) || lk.url;
            return `<a href="${lk.url}" style="color:#5eead4;font-size:13px;text-decoration:none;border:1px solid #2a4a4a;border-radius:5px;padding:5px 11px;display:inline-block;margin:0 8px 6px 0">→ ${lkTitle}</a>`;
          }).join('') + `</p>`;
      }

      itemsHtml += `<tr><td style="padding:22px 26px;${divider}">
        ${itemUrl
          ? `<a href="${itemUrl}" style="color:#ffffff;text-decoration:none;font-weight:800;font-size:18px;line-height:1.4;font-family:sans-serif">${itemTitle}</a>`
          : `<span style="color:#ffffff;font-weight:800;font-size:18px;line-height:1.4;font-family:sans-serif">${itemTitle}</span>`}
        <p style="color:#e2e8f0;font-size:15px;line-height:1.9;margin:12px 0 0;font-family:sans-serif">${itemSummary}</p>
        ${priceHtml}${metaHtml}${linksHtml}
      </td></tr>`;
    });

    html += `<tr><td style="padding:0 0 16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#101f33;border:1px solid ${color}33;border-radius:14px;border-left:4px solid ${color}">
        ${itemsHtml}
      </table>
    </td></tr>`;
  }
  return html;
}

async function fetchLatestEdition() {
  try {
    const idxRes = await fetch(`${RAW_BASE}/index.json`);
    const idx    = await idxRes.json();
    const latest = idx.editions?.[0];
    if (!latest) return null;
    const edRes  = await fetch(`${RAW_BASE}/${latest.date}.json`);
    return await edRes.json();
  } catch { return null; }
}

const LANG_NAMES = { es: 'ESPAÑOL', en: 'ENGLISH', val: 'VALENCIÀ' };
const LOGO_URL   = 'https://danielux135.github.io/assets/fosky.png';

function buildEmail({ langs, edition, email, isWelcome }) {
  const unsubUrl = `${UNSUB_BASE}?email=${encodeURIComponent(email)}`;

  const STRINGS = {
    welcome:    { es: '¡Ya estás suscrito!', en: "You're in!", val: 'Ja estàs subscrit!' },
    welcomeSub: {
      es: 'Cada mañana a las 5:30 una IA resume el día y te lo envía directamente. Esta es la última edición:',
      en: "Every morning at 5:30 an AI summarises the day and sends it straight to your inbox. Here's the latest edition:",
      val: "Cada matí a les 5:30 una IA resumix el dia i te l'envia directament. Esta és l'última edició:"
    },
    cta:   { es: 'Ver en el blog',       en: 'Open in blog',    val: 'Veure al blog' },
    unsub: { es: 'Cancelar suscripción', en: 'Unsubscribe',     val: 'Cancel·lar subscripció' },
    by:    { es: 'Proyecto de',          en: 'A project by',    val: 'Projecte de' }
  };

  const multiLang = langs.length > 1;
  let innerBlocks = '';

  for (let i = 0; i < langs.length; i++) {
    const lang = langs[i];

    if (multiLang) {
      const topPad = i === 0 ? '32px' : '52px';
      innerBlocks += `
        <tr><td style="padding:${topPad} 0 24px;text-align:center">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="height:1px;background:#1e3a3a"></td>
            <td style="padding:0 20px;white-space:nowrap;text-align:center">
              <span style="color:#5eead4;font-size:24px;font-weight:900;letter-spacing:.1em;font-family:sans-serif">${LANG_NAMES[lang] || lang.toUpperCase()}</span>
            </td>
            <td style="height:1px;background:#1e3a3a"></td>
          </tr></table>
        </td></tr>`;
    }

    if (isWelcome) {
      innerBlocks += `
        <tr><td style="padding:${multiLang ? '12px' : '32px'} 0 10px;text-align:center">
          <h2 style="color:#5eead4;font-size:22px;font-weight:800;margin:0;font-family:sans-serif">${L(STRINGS.welcome, lang)}</h2>
        </td></tr>
        <tr><td style="padding:8px 0 24px;text-align:center">
          <p style="color:#cbd5e1;font-size:15px;line-height:1.8;margin:0;font-family:sans-serif">${L(STRINGS.welcomeSub, lang)}</p>
        </td></tr>`;
    }

    if (edition) {
      innerBlocks += buildEditionBlock(edition, lang);
    }
  }

  const firstLang = langs[0] || 'es';
  const subjects  = { es: '¡Bienvenido a FoskIA!', en: 'Welcome to FoskIA!', val: 'Benvingut a FoskIA!' };
  const subject   = isWelcome ? (subjects[firstLang] || subjects.es) : `FoskIA · ${edition?.date || ''}`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0c1a2e;font-family:sans-serif;margin:0;padding:24px 12px">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="580" style="max-width:580px" cellpadding="0" cellspacing="0">
  <tr><td style="padding:28px 0 24px;border-bottom:2px solid #1e3a3a;text-align:center">
    <img src="${LOGO_URL}" alt="FoskIA" width="48" height="48" style="display:block;margin:0 auto 10px;border-radius:12px">
    <span style="color:#5eead4;font-size:30px;font-weight:900;letter-spacing:-.02em;font-family:sans-serif">FoskIA.</span>
  </td></tr>
  ${innerBlocks}
  <tr><td style="padding:40px 0 24px;text-align:center">
    <a href="${BLOG_URL}" style="background:#5eead4;color:#0a1628;padding:14px 34px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;font-family:sans-serif">${L(STRINGS.cta, firstLang)}</a>
  </td></tr>
  <tr><td style="border-top:1px solid #1e3a3a;padding:28px 0 20px;text-align:center">
    <img src="${LOGO_URL}" alt="FoskIA" width="36" height="36" style="display:block;margin:0 auto 12px;border-radius:8px;opacity:.7">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 6px;font-family:sans-serif">
      ${L(STRINGS.by, firstLang)} <a href="${PORTFOLIO_URL}" style="color:#5eead4;text-decoration:none;font-weight:700">Daniel Bort Guzmán</a>
    </p>
    <p style="margin:0;font-family:sans-serif">
      <a href="${unsubUrl}" style="color:#475569;font-size:11px;text-decoration:underline">${L(STRINGS.unsub, firstLang)}</a>
    </p>
  </td></tr>
</table></td></tr></table></body></html>`;

  return { html, subject };
}

async function sendEmail(email, langs, edition, isWelcome) {
  const brevoKey = cleanEnv(process.env.BREVO_API_KEY);
  const { html, subject } = buildEmail({ langs, edition, email, isWelcome });
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'FoskIA', email: 'danielux135@gmail.com' },
      replyTo: { email: 'danielux135@gmail.com' },
      to: [{ email }],
      subject,
      htmlContent: html
    })
  });
  return r.ok;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, langs } = req.body || {};
  if (!email || !Array.isArray(langs) || langs.length === 0)
    return res.status(400).json({ error: 'email y langs requeridos' });

  try {
    const token = await getFirestoreToken();
    const docId = Buffer.from(email.toLowerCase()).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

    const existing = await firestoreRequest(token, 'GET', `/subscribers/${docId}`);
    if (existing.fields) return res.status(409).json({ error: 'duplicate' });

    await firestoreRequest(token, 'PATCH',
      `/subscribers/${docId}?updateMask.fieldPaths=email&updateMask.fieldPaths=langs&updateMask.fieldPaths=createdAt`,
      { fields: {
        email:     { stringValue: email.toLowerCase() },
        langs:     { arrayValue: { values: langs.map(l => ({ stringValue: l })) } },
        createdAt: { timestampValue: new Date().toISOString() }
      }}
    );

    const edition = await fetchLatestEdition();
    await sendEmail(email.toLowerCase(), langs, edition, true);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
