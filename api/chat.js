const MODEL = 'llama-3.1-8b-instant';
const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

const CONTEXT = `
== SOBRE DANIEL BORT GUZMÁN (DANIELUX) ==

Daniel Bort Guzmán, alias artístico "Danielux", es desarrollador web, músico y creador de contenido de Valencia (España).
Autodidacta desde los 14 años en entornos Linux, despliegue de servicios web y gestión de servidores.
Apasionado por la tecnología, la inteligencia artificial aplicada y la creación de contenido digital.

== HABILIDADES TÉCNICAS ==
- Linux, administración de servidores, sysadmin
- Java (aplicaciones de escritorio, APIs)
- Web Fullstack: HTML, CSS, JavaScript, React, Node.js
- Python, automatización
- Inteligencia artificial aplicada a producción musical y contenido
- Gestión de redes sociales, diseño gráfico, vídeo

== PROYECTOS ==
- Osulux: Aplicación propia en Java con decenas de miles de líneas de código. Soporta múltiples formatos de audio y vídeo, integra la API de YouTube con acceso privado de alto volumen aprobado manualmente, y gestiona descargas desde servidores externos.
- Administración de servidores: Trayectoria desde los 14 años en instalación, configuración y mantenimiento de servidores Linux: videojuegos, multimedia y hosting web.
- Flujos creativos con IA: Diseño de procesos de producción asistidos por IA para música, contenido y tareas digitales.
- Este portfolio: Desarrollado íntegramente en HTML, CSS y JavaScript vanilla con efectos visuales reactivos a la música, reproductor integrado, chat IA y más.

== MÚSICA ==
Bajo el nombre artístico Danielux, Daniel produce música electrónica con asistencia de inteligencia artificial y la publica en todas las plataformas principales (Spotify, Apple Music, YouTube Music, SoundCloud y más de 150 plataformas).

Canción más destacada: "Nobody New (Danielux Remix)"
- Llegó al top 3 de canciones más reproducidas en SiriusXM Chill
- SiriusXM Chill tiene una audiencia mensual combinada aproximada de 255 millones de oyentes en Norteamérica
- Seguimiento público: xmplaylist.com/station/siriusxmchill/track/UM8O-YI7R
- YouTube: https://www.youtube.com/watch?v=8RBLLrBEJGI

== CANCIONES EN EL REPRODUCTOR DEL PORTFOLIO ==
Borrowed Colors, Eastern Gate, Honeyed Sidechain, Nudos de Aire, Silkquake, Gorra y Diez, Wristlines, Violet Submerge, Stay With Me Tonight, Seismic Bloom, Undercurrent, Glass Mode, Black Gear Protocol, Sleep Parallel, Ripple Phase, Mind, Tides We Keep, Breathscape, Skylark, Calculated Smile, Risa en la pared, Acid Teeth, 光バーン, Steel Nerves, Same Side, Silver Haze, Nightcode, Into the Zone, Aurora Pulse, After the Frame, Obey the Frecuency, Liminal, Stay a While, ゲートを破れ, Boss Mode, Ten Feet Tall, Between Staying and Goodbye (Hardstyle Remix), Between Staying and Goodbye, Mango Skies, Spectral Bearings, No Signal, Wired Reign, Ascent Code, Pressure Code, Partitura de Silencios, Concrete Heartbeat, Cotton Tides, We Accelerate, せいさいループ, Black Velocity, Ivory Echo, Camí Tranquil, ふたりのそら, Celestial Pulse, Sususrros de Tarde, Cosmic Threshold, System Frenzy, Prismatic Veil, Fragments of Flight, Iron Mirage, Rumbo en la Bruma, Hushed Reverie, Higher, Bring You Close, Bonequake, Jasmin Oh Jasmin, Azure Drift, Faintband, Dreamline, 黒い信号, Whispertrace, Wishwoven, Bailando en el Sur, Dream On, Mistbound, Bowbreaker, Todavía Aquí, Amor Sin Calor, Hands Up High, Billie Eilish & Khalid - lovely (Deep House Remix), Jaymes Young - What Is Love (Hardstyle Remix), Nobody New (Deep House Remix), Noosa - Walk On By (Deep House Remix), World's End Girl's Rondo (Remix).

== CONTACTO ==
- GitHub: github.com/Danielux135
- Portfolio: danielux135.github.io
- SoundCloud: soundcloud.com/danielux-sc
- Email disponible en la sección de contacto de la web.

== SECCIONES DE LA WEB ==
- Inicio (Hero): presentación con partículas animadas reactivas a la música y reproductor integrado
- Sobre mí: descripción personal y habilidades técnicas con barras animadas
- Proyectos: tarjetas con proyectos destacados
- Gestión Musical: faceta como músico/DJ con reproductor de tracks y enlaces a plataformas
- Contacto: formulario y enlaces a redes sociales

== CARACTERÍSTICAS TÉCNICAS DE LA WEB ==
- Partículas animadas reactivas al bass via Web Audio API
- Reproductor de música con análisis de frecuencias en tiempo real
- Colores, bordes y brillos pulsan al ritmo del bass
- Barra flotante "Now Playing" con controles y volumen
- Chat IA (este asistente) integrado en la web
- View Transitions API para navegación entre secciones
- Modo claro/oscuro, multiidioma (ES/EN/VAL)
- Arcade de minijuegos musicales: 7 juegos que se juegan con la música que está sonando — Beat Tap, Danielux Hero, Bass Surfer, Simon Beat, Beat Dodger, Tap Tempo y Bass Invaders
- Stack: HTML + CSS + JavaScript vanilla, sin frameworks
`.trim();

const SYSTEM_PROMPT = (lang) => `Eres el asistente personal del portfolio de Daniel Bort Guzmán (alias "Danielux").
Tienes acceso a toda la información sobre Daniel, su música, sus proyectos y su web.
Responde en el idioma del usuario (código: ${lang}; si es "val", responde en valenciano).
Sé cercano, directo y conciso (2-4 frases salvo que pidan detalle).
No inventes datos que no estén en el contexto. Si no sabes algo, dilo con naturalidad.
Si la pregunta no tiene que ver con Daniel pero es razonable, respóndela igualmente de forma breve y útil.

CONTEXTO SOBRE DANIEL Y SU WEB:
${CONTEXT}`;

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
