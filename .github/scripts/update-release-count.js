const fs = require('fs');
const https = require('https');

const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
const CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET;
const SOUNDCLOUD_USER_ID = '1671122984';

function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`HTTP ${res.statusCode} ${options.path}`);
                if (res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`JSON parse error: ${data.slice(0, 300)}`));
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function getToken() {
    const body = `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    const data = await request({
        hostname: 'api.soundcloud.com',
        path: '/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body),
        },
    }, body);
    return data.access_token;
}

async function getTrackCount(token) {
    const data = await request({
        hostname: 'api.soundcloud.com',
        path: `/users/${SOUNDCLOUD_USER_ID}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return data.track_count;
}

async function main() {
    const token = await getToken();
    const count = await getTrackCount(token);
    console.log(`Track count from SoundCloud: ${count}`);

    const htmlPath = 'index.html';
    let html = fs.readFileSync(htmlPath, 'utf8');

    const updated = html.replace(
        /(<span class="music-stat-num" data-target=")\d+(">[^<]*<\/span><span class="music-stat-unit"><\/span>\s*\n\s*<span class="music-stat-label" data-i18n="music\.stat4")/,
        `$1${count}$2`
    );

    if (html !== updated) {
        fs.writeFileSync(htmlPath, updated, 'utf8');
        console.log(`Updated release count to ${count}`);
    } else {
        console.log('No change needed');
    }
}

main().catch(err => { console.error(err); process.exit(1); });
