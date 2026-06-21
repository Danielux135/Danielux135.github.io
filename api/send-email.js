const BREVO_API_KEY = process.env.BREVO_API_KEY;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-internal-token');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

    // token interno para que solo la routine y subscribe.js puedan llamar a este endpoint
    const token = req.headers['x-internal-token'];
    if (token !== process.env.INTERNAL_TOKEN) return res.status(401).json({ error: 'unauthorized' });

    const { to, subject, htmlContent, sender } = req.body || {};
    if (!to || !subject || !htmlContent) return res.status(400).json({ error: 'faltan campos' });

    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': BREVO_API_KEY,
            'Content-Type': 'application/json',
            accept: 'application/json'
        },
        body: JSON.stringify({
            sender:      sender || { name: 'FoskIA', email: 'danielux135@gmail.com' },
            replyTo:     { email: 'danielux135@gmail.com' },
            to,
            subject,
            htmlContent
        })
    });

    const body = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: body });
    return res.status(200).json({ ok: true });
}
