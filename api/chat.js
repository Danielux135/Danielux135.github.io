const MODEL = 'gemini-2.0-flash';

const STATIC_CONTEXT = `
Eres el asistente del portfolio de Daniel Bort Guzmán (alias artístico "Danielux").
Daniel es desarrollador web, músico y creador de contenido, de Valencia (España).

== SOBRE DANIEL ==
- Desarrollador web: especializado en HTML, CSS, JavaScript, React, Node.js, Python.
- Músico y DJ: produce música electrónica, principalmente house y techno. Tiene tracks publicados en plataformas de streaming.
- Creador de contenido: gestión de redes sociales, vídeos, diseño gráfico.
- La web es su portfolio personal en danielux135.github.io.

== SECCIONES DE LA WEB ==
- Inicio (Hero): presentación con partículas animadas y reproductor de música integrado.
- Sobre mí: descripción personal, habilidades técnicas con barras de skill animadas.
- Proyectos: tarjetas con proyectos de desarrollo web destacados.
- Gestión Musical: sección sobre su faceta como músico/DJ, con reproductor de tracks.
- Contacto: formulario de contacto y enlaces a redes sociales.

== CARACTERÍSTICAS TÉCNICAS DE LA WEB ==
- Partículas animadas en el fondo reactivas a la música (Web Audio API).
- Reproductor de música integrado con análisis de frecuencias en tiempo real.
- Los colores de acento, bordes y brillos pulsan al ritmo del bass.
- Barra flotante "Now Playing" con controles de reproducción y volumen.
- Widget de chat IA (este mismo asistente) usando Gemini via Vercel serverless.
- Transiciones de sección con View Transitions API.
- Modo claro/oscuro, multiidioma (ES/EN/VAL).
- Diseño 100% responsive.
- Stack: HTML + CSS + JavaScript vanilla, sin frameworks frontend.
- Backend mínimo: función serverless en Vercel solo para el chat IA.

== MÚSICA DESTACADA ==
- Canción más destacada: "Nobody New (Danielux Remix)" — llegó al top 3 de canciones más reproducidas en SiriusXM Chill (radio con ~255 millones de oyentes mensuales en Norteamérica). También disponible en YouTube: https://www.youtube.com/watch?v=8RBLLrBEJGI
- La música está producida con asistencia de inteligencia artificial y publicada en todas las plataformas principales de streaming.

== CANCIONES EN EL REPRODUCTOR DEL PORTFOLIO ==
Borrowed Colors, Eastern Gate, Honeyed Sidechain, Nudos de Aire, Silkquake, Gorra y Diez, Wristlines, Violet Submerge, Stay With Me Tonight, Seismic Bloom, Undercurrent, Glass Mode, Black Gear Protocol, Sleep Parallel, Ripple Phase, Mind, Tides We Keep, Breathscape, Skylark, Calculated Smile, Risa en la pared, Acid Teeth, 光バーン, Steel Nerves, Same Side, Silver Haze, Nightcode, Into the Zone, Aurora Pulse, After the Frame, Obey the Frecuency, Liminal, Stay a While, ゲートを破れ, Boss Mode, Ten Feet Tall, Between Staying and Goodbye (Hardstyle Remix), Between Staying and Goodbye, Mango Skies, Spectral Bearings, No Signal, Wired Reign, Ascent Code, Pressure Code, Partitura de Silencios, Concrete Heartbeat, Cotton Tides, We Accelerate, せいさいループ, Black Velocity, Ivory Echo, Camí Tranquil, ふたりのそら, Celestial Pulse, Sususrros de Tarde, Cosmic Threshold, System Frenzy, Prismatic Veil, Fragments of Flight, Iron Mirage, Rumbo en la Bruma, Hushed Reverie, Higher, Bring You Close, Bonequake, Jasmin Oh Jasmin, Azure Drift, Faintband, Dreamline, 黒い信号, Whispertrace, Wishwoven, Bailando en el Sur, Dream On, Mistbound, Bowbreaker, Todavía Aquí, Amor Sin Calor, Hands Up High, Billie Eilish & Khalid - lovely (Deep House Remix), Jaymes Young - What Is Love (Hardstyle Remix), Nobody New (Deep House Remix), Noosa - Walk On By (Deep House Remix), World's End Girl's Rondo (Remix).

== CONTACTO ==
- GitHub: github.com/Danielux135
- Portfolio: danielux135.github.io
- Email disponible en la sección de contacto de la web.
`.trim();

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY' });

    try {
        const { messages = [], lang = 'es' } = req.body || {};
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Sin mensajes' });
        }
        const system = `${STATIC_CONTEXT}

Reglas:
- Responde en el idioma del usuario (código de idioma: ${lang}). Si es "val", responde en valenciano/catalán.
- Sé claro, cercano y conciso (máximo 3-4 frases salvo que pidan detalle).
- No inventes datos personales o de contacto que no estén en el contexto.
- Si la pregunta no tiene nada que ver con la web ni con Daniel, responde igualmente de forma útil y breve.`;

        const contents = messages.slice(-12).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(m.content || '').slice(0, 4000) }],
        }));

        const apiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: system }] },
                    contents,
                    generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
                }),
            }
        );
        const data = await apiRes.json();
        if (!apiRes.ok) {
            return res.status(apiRes.status).json({ error: data.error?.message || 'Error de la API de Gemini' });
        }
        const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim() || 'No he podido generar respuesta.';
        return res.status(200).json({ reply });
    } catch (e) {
        return res.status(500).json({ error: String(e?.message || e) });
    }
}
