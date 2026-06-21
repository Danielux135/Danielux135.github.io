const CLIENT_ID     = process.env.SOUNDCLOUD_CLIENT_ID;
const CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET;
const SC_USER       = 'danielux-sc';

// obtiene un token de cliente de soundcloud
async function getToken() {
    const res = await fetch('https://secure.soundcloud.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type:    'client_credentials',
            client_id:     CLIENT_ID,
            client_secret: CLIENT_SECRET,
        }),
    });
    if (!res.ok) throw new Error(`token error ${res.status}`);
    const { access_token } = await res.json();
    return access_token;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(204).end();

    try {
        const token = await getToken();

        // resuelve el perfil del usuario
        const userRes = await fetch(
            `https://api.soundcloud.com/resolve?url=https://soundcloud.com/${SC_USER}`,
            { headers: { Authorization: `OAuth ${token}` } }
        );
        if (!userRes.ok) throw new Error(`user error ${userRes.status}`);
        const user = await userRes.json();

        res.status(200).json({ tracks: user.track_count ?? 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
