const GROQ_API_KEY = process.env.GROQ_API_KEY;

const SYSTEM_PROMPT = `Eres el asistente virtual del portfolio de Daniel Bort Guzmán, desarrollador web fullstack y productor musical profesional.

Información sobre Daniel:
- Estudia el certificado profesional IFCD0210 – Tecnologías de Desarrollo de Aplicaciones Web (660 h)
- Sólida base en sistemas Linux, programación Java e IA aplicada a la producción musical
- Bajo el nombre artístico Danielux publica música en las principales plataformas de streaming
- Su tema "Nobody New (Danielux Remix)" alcanzó el top 3 de canciones más escuchadas en SiriusXM Chill
- Este portfolio está construido con Vite y JavaScript vanilla, con efectos visuales reactivos a la música
- Incluye minijuegos en el Arcade, fondos animados (Órbitas, Galaxia) y un sistema de clima en tiempo real
- Contacto: danielux135@gmail.com

Responde siempre en el mismo idioma en que te escriban (español, valenciano o inglés). Sé conciso, amable y útil. Si te preguntan algo que no sabes con certeza, dilo claramente.`;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

    if (!GROQ_API_KEY) return res.status(500).json({ error: 'API key not configured' });

    let body = req.body;
    if (!body || typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }
    const { messages: clientMessages = [] } = body;
    if (!clientMessages.length) {
        return res.status(400).json({ error: 'missing messages' });
    }

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...clientMessages.slice(-12),
    ];

    let groqRes;
    try {
        groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                max_tokens: 512,
                temperature: 0.7,
            }),
        });
    } catch (err) {
        console.error('Groq fetch error:', err);
        return res.status(502).json({ error: 'network error' });
    }

    if (!groqRes.ok) {
        const err = await groqRes.text();
        console.error('Groq error:', groqRes.status, err);
        return res.status(502).json({ error: 'upstream error', detail: err });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ reply });
}
