const ALLOWED_HOST_PARTS = ['cdninstagram.com', 'fbcdn.net', 'tiktokcdn.com', 'tiktokcdn-us.com'];

function isAllowedUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      ALLOWED_HOST_PARTS.some((part) => url.hostname.endsWith(part) || url.hostname.includes(part))
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).end('method not allowed');

  const target = req.query?.url;
  if (!target || !isAllowedUrl(target)) return res.status(400).end('invalid media url');

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        Accept: '*/*',
      },
    });

    if (!upstream.ok || !upstream.body) {
      return res.status(upstream.status || 502).end('media unavailable');
    }

    const type = upstream.headers.get('content-type') || 'application/octet-stream';
    const length = upstream.headers.get('content-length');
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    if (length) res.setHeader('Content-Length', length);

    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(502).end(err.message);
  }
}
