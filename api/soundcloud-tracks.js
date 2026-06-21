const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
const SC_USER   = 'danielux-sc';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(204).end();

    try {
        // resuelve el perfil con client_id en query param (API v2 pública)
        const userRes = await fetch(
            `https://api-v2.soundcloud.com/resolve?url=https://soundcloud.com/${SC_USER}&client_id=${CLIENT_ID}`
        );
        const body = await userRes.json();
        if (!userRes.ok) throw new Error(`soundcloud ${userRes.status}: ${JSON.stringify(body)}`);

        res.status(200).json({ tracks: body.track_count ?? 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
