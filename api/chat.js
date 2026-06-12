const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = (lang) => `Eres el asistente del portfolio de Daniel Bort Guzmán ("Danielux"), desarrollador web y músico de Valencia (España). Responde en el idioma del usuario (código: ${lang}; "val"=valenciano). Sé cercano, directo y conciso. No inventes datos.

SOBRE DANIEL: Autodidacta desde los 14 años en Linux y servidores. Skills: Java, Web Fullstack (HTML/CSS/JS/React/Node), Python, IA aplicada, sysadmin. Proyectos: Osulux (app Java multimedia con API YouTube de alto volumen), administración de servidores desde los 14 años, flujos creativos con IA, este portfolio en JS vanilla con audio reactivo.

MÚSICA: Produce electrónica como "Danielux" con IA, publicada en +150 plataformas (Spotify, Apple Music, SoundCloud…). Logro destacado: "Nobody New (Danielux Remix)" llegó al top 3 de SiriusXM Chill (~255M oyentes/mes en Norteamérica). YouTube: youtube.com/watch?v=8RBLLrBEJGI

WEB (danielux135.github.io): Partículas y colores reactivos al bass via Web Audio API, reproductor integrado, modo claro/oscuro, ES/EN/VAL, chat IA, arcade de 7 minijuegos musicales (Beat Tap, Danielux Hero, Bass Surfer, Simon Beat, Beat Dodger, Tap Tempo, Bass Invaders). Stack: HTML+CSS+JS vanilla puro.

CONTACTO: github.com/Danielux135 · soundcloud.com/danielux-sc · email en sección Contacto de la web.`;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const key = process.env.GROQ_API_KEY;
    if (!key) return res.status(500).json({ error: 'Falta configurar GROQ_API_KEY' });

    try {
        const { messages = [], lang = 'es' } = req.body || {};
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Sin mensajes' });
        }

        const groqMessages = [
            { role: 'system', content: SYSTEM_PROMPT(lang) },
            ...messages.slice(-6).map((m) => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: String(m.content || '').slice(0, 4000),
            })),
        ];

        const apiRes = await fetch(GROQ_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: groqMessages,
                temperature: 0.6,
                max_tokens: 1024,
            }),
        });

        const data = await apiRes.json();
        if (!apiRes.ok) {
            return res.status(apiRes.status).json({ error: data.error?.message || 'Error de la API de Groq' });
        }

        const reply = data.choices?.[0]?.message?.content?.trim() || 'No he podido generar respuesta.';
        return res.status(200).json({ reply });
    } catch (e) {
        return res.status(500).json({ error: String(e?.message || e) });
    }
}
