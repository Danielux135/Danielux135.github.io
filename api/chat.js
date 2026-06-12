const MODEL = 'gemini-2.0-flash-lite';

const SYSTEM_RULES = (lang) => `
Eres el asistente del portfolio de Daniel Bort Guzmán (alias artístico "Danielux").
Reglas:
- Responde en el idioma del usuario (código de idioma: ${lang}). Si es "val", responde en valenciano/catalán.
- Sé claro, cercano y conciso (máximo 3-4 frases salvo que pidan detalle).
- No inventes datos personales o de contacto que no estén en el contexto.
- Si la pregunta no tiene nada que ver con la web ni con Daniel, responde igualmente de forma útil y breve.
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

        const contents = messages.slice(-12).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(m.content || '').slice(0, 4000) }],
        }));

        const fileName = process.env.GEMINI_FILE_NAME;
        let systemParts;
        if (fileName) {
            systemParts = [
                { text: SYSTEM_RULES(lang) },
                { fileData: { mimeType: 'text/plain', fileUri: `https://generativelanguage.googleapis.com/v1beta/${fileName}` } },
            ];
        } else {
            systemParts = [{ text: SYSTEM_RULES(lang) }];
        }

        const apiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: systemParts },
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
