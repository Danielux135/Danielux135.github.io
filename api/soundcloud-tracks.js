const CLIENT_ID     = process.env.SOUNDCLOUD_CLIENT_ID;
const CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET;
const SC_USER       = 'danielux-sc';

// obtiene token OAuth con client_credentials
async function getToken() {
    const res = await fetch('https://api.soundcloud.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type:    'client_credentials',
            client_id:     CLIENT_ID,
            client_secret: CLIENT_SECRET,
        }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(`token ${res.status}: ${JSON.stringify(body)}`);
    return body.access_token;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(204).end();

    try {
        const token = await getToken();
        const userRes = await fetch(
            `https://api.soundcloud.com/resolve?url=https://soundcloud.com/${SC_USER}`,
            { headers: { Authorization: `OAuth ${token}` } }
        );
        const body = await userRes.json();
        if (!userRes.ok) throw new Error(`resolve ${userRes.status}: ${JSON.stringify(body)}`);

        res.status(200).json({ tracks: body.track_count ?? 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
