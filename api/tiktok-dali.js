const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR_ID = process.env.APIFY_TIKTOK_ACTOR_ID || 'clockworks~tiktok-scraper';
const TIKTOK_PROFILE = process.env.DALI_TIKTOK_PROFILE || 'dalibarber.11';
const CACHE_TTL_MS = Number(process.env.TIKTOK_CACHE_TTL_MS || 6 * 60 * 60 * 1000);

let cachedPayload = null;
let cachedAt = 0;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickProfile(items) {
  return items.find((item) => item?.authorMeta?.name) || items[0] || null;
}

function normalizeProfile(item) {
  const author = item?.authorMeta || {};

  return {
    profile: {
      username: author.name || TIKTOK_PROFILE,
      displayName: author.nickName || 'Barberia Dali',
      avatar: author.avatar || author.originalAvatarUrl || null,
      bio: author.signature || null,
      url: author.profileUrl || `https://www.tiktok.com/@${TIKTOK_PROFILE}`,
    },
    stats: {
      followers: toNumber(author.fans),
      following: toNumber(author.following),
      likes: toNumber(author.heart),
      videos: toNumber(author.video),
    },
    latestVideos: [],
    updatedAt: new Date().toISOString(),
    source: 'apify',
  };
}

function pickVideoUrl(item) {
  const candidates = [
    item?.videoUrl,
    item?.videoMeta?.downloadAddr,
    item?.videoMeta?.playAddr,
    item?.videoMeta?.url,
    item?.video?.playAddr,
    item?.video?.downloadAddr,
  ];

  return candidates.find((url) => typeof url === 'string' && /^https?:\/\//.test(url)) || null;
}

async function fetchTikTokProfile() {
  if (!APIFY_TOKEN) {
    const err = new Error('APIFY_TOKEN not configured');
    err.statusCode = 500;
    throw err;
  }

  const input = {
    profiles: [TIKTOK_PROFILE],
    resultsPerPage: 3,
    profileScrapeSections: ['videos'],
    profileSorting: 'latest',
    excludePinnedPosts: false,
    shouldDownloadAvatars: false,
    shouldDownloadCovers: false,
    shouldDownloadMusicCovers: false,
    shouldDownloadVideos: false,
    shouldDownloadSubtitles: false,
    shouldDownloadSlideshowImages: false,
  };

  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const text = await response.text();
  let items = [];
  try {
    items = JSON.parse(text || '[]');
  } catch {
    items = [];
  }

  if (!response.ok) {
    const err = new Error(`Apify ${response.status}: ${text.slice(0, 300)}`);
    err.statusCode = 502;
    throw err;
  }

  const profileItem = pickProfile(Array.isArray(items) ? items : []);
  if (!profileItem) {
    const err = new Error('Apify returned no TikTok profile data');
    err.statusCode = 502;
    throw err;
  }

  const payload = normalizeProfile(profileItem);
  payload.latestVideos = (Array.isArray(items) ? items : [])
    .filter((item) => item?.webVideoUrl)
    .slice(0, 3)
    .map((item) => ({
      url: item.webVideoUrl,
      caption: item.text || '',
      likes: toNumber(item.diggCount),
      comments: toNumber(item.commentCount),
      shares: toNumber(item.shareCount),
      plays: toNumber(item.playCount),
      cover: item.videoMeta?.coverUrl || item.videoMeta?.originalCoverUrl || null,
      videoUrl: pickVideoUrl(item),
    }));

  return payload;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  try {
    const now = Date.now();
    if (cachedPayload && now - cachedAt < CACHE_TTL_MS) {
      return res.status(200).json({ ...cachedPayload, cached: true });
    }

    cachedPayload = await fetchTikTokProfile();
    cachedAt = now;

    return res.status(200).json({ ...cachedPayload, cached: false });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}
