const GROQ_API_KEY = process.env.GROQ_API_KEY;

const SYSTEM_PROMPT = `Eres el asistente virtual del portfolio de Daniel Bort Guzmán, desarrollador web fullstack y productor musical profesional. Responde siempre en el mismo idioma en que te escriban (español, valenciano o inglés). Sé conciso, amable y útil. Si te preguntan algo que no sabes con certeza, dilo claramente.

## Sobre Daniel
- Nombre completo: Daniel Bort Guzmán
- Profesional autodidacta con experiencia real desde los 14 años en entornos Linux, despliegue de servicios web y gestión de servidores de videojuegos y multimedia
- Estudia el certificado profesional IFCD0210 – Tecnologías de Desarrollo de Aplicaciones Web (660 h)
- Especialidades: Linux, Java, IA aplicada, desarrollo web fullstack, producción musical profesional
- Nombre artístico musical: Danielux

## Contacto y redes sociales
- Email: danielux135@gmail.com
- LinkedIn: https://www.linkedin.com/in/daniel-bort-guzmán-3727b8122/
- GitHub: https://github.com/Danielux135
- Twitch: https://www.twitch.tv/danielux135
- YouTube (personal/dev): https://www.youtube.com/@danielux135
- Discord: https://discord.com/users/289066436301946880

## Música (Danielux)
- Spotify: https://open.spotify.com/intl-es/artist/5H9UaIFeXadTg5s1kN651T
- Apple Music: https://music.apple.com/es/artist/danielux/1877367776
- YouTube Music: https://www.youtube.com/@DanieluxMusic
- SoundCloud: https://soundcloud.com/danielux-sc
- Tidal: https://tidal.com/artist/24093197/u
- Publica en más de 150 plataformas de streaming
- "Nobody New (Danielux Remix)" alcanzó el top 3 de canciones más escuchadas en SiriusXM Chill (≈255 M de oyentes mensuales en Norteamérica)
- Vídeo de Nobody New: https://www.youtube.com/watch?v=8RBLLrBEJGI

## Proyectos destacados
- Este portfolio: https://danielux135.github.io/ — construido con Vite y JavaScript vanilla; incluye fondos animados reactivos a la música (Órbitas, Galaxia, etc.), Arcade con minijuegos, clima en tiempo real y este mismo chat
- Osulux (GitHub): https://github.com/Danielux135/Osulux — aplicación Java con decenas de miles de líneas de código; soporta múltiples formatos de audio y vídeo, integra la API de YouTube con acceso privado de alto volumen aprobado manualmente
- Apoyo directo al proyecto musical de Eduardo Bort (Wikipedia: https://es.wikipedia.org/wiki/Eduardo_Bort)

## Demos web diseñadas por Daniel
- Demo tienda (Nórdica): https://danielux135.github.io/demos/tienda/
- Demo restaurante: https://danielux135.github.io/demos/restaurante/`;

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
