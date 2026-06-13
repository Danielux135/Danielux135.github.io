const fs = require('fs');
const https = require('https');

const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
const SOUNDCLOUD_USER_ID = '1671122984';

function request(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`HTTP ${res.statusCode} ${url}`);
                if (res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`JSON parse error (respuesta no es JSON): ${data.slice(0, 300)}`));
                }
            });
        }).on('error', reject);
    });
}

async function getTrackCount() {
    // Endpoint público sin OAuth — devuelve datos del usuario incluyendo track_count
    const url = `https://api.soundcloud.com/users/${SOUNDCLOUD_USER_ID}?client_id=${CLIENT_ID}`;
    const data = await request(url);
    console.log('User data keys:', Object.keys(data));
    console.log('track_count:', data.track_count);
    const count = data.track_count;
    if (count === undefined || count === null) {
        throw new Error(`track_count no encontrado: ${JSON.stringify(data).slice(0, 300)}`);
    }
    return count;
}

async function main() {
    if (!CLIENT_ID) throw new Error('SOUNDCLOUD_CLIENT_ID no está definido');

    const count = await getTrackCount();
    console.log(`Track count: ${count}`);

    const htmlPath = 'index.html';
    let html = fs.readFileSync(htmlPath, 'utf8');

    const updated = html.replace(
        /(<span class="music-stat-num" data-target=")[^"]*("[^<]*<\/span><span class="music-stat-unit"><\/span>\s*\n\s*<span class="music-stat-label" data-i18n="music\.stat4")/,
        `$1${count}$2`
    );

    if (html !== updated) {
        fs.writeFileSync(htmlPath, updated, 'utf8');
        console.log(`Actualizado a ${count}`);
    } else {
        console.log('Sin cambios');
    }
}

main().catch(err => { console.error(err); process.exit(1); });
