const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR_ID = process.env.APIFY_INSTAGRAM_PROFILE_ACTOR_ID || 'apify~instagram-profile-scraper';
const INSTAGRAM_USERNAME = process.env.DALI_INSTAGRAM_USERNAME || 'dalibarber.11';
const CACHE_TTL_MS = Number(process.env.INSTAGRAM_CACHE_TTL_MS || 6 * 60 * 60 * 1000);

let cachedPayload = null;
let cachedAt = 0;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickUrl(...values) {
  return values.find((value) => typeof value === 'string' && /^https?:\/\//.test(value)) || null;
}

function normalizePost(post) {
  const comments = [
    ...(Array.isArray(post.latestComments) ? post.latestComments : []),
    ...(Array.isArray(post.childPosts) ? post.childPosts.flatMap((child) => child.latestComments || []) : []),
  ].filter(Boolean);

  return {
    id: post.id || post.shortCode || null,
    type: post.type || null,
    caption: post.caption || '',
    url: post.url || (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : null),
    cover: pickUrl(post.displayUrl, post.thumbnailUrl, post.imageUrl, post.images?.[0]),
    videoUrl: pickUrl(post.videoUrl),
    images: Array.isArray(post.images) ? post.images.filter(Boolean).slice(0, 6) : [],
    likes: toNumber(post.likesCount),
    commentsCount: toNumber(post.commentsCount),
    views: toNumber(post.videoViewCount) || toNumber(post.videoPlayCount),
    timestamp: post.timestamp || null,
    productType: post.productType || null,
    locationName: post.locationName || null,
    music: post.musicInfo
      ? {
          artist: post.musicInfo.artist_name || null,
          song: post.musicInfo.song_name || null,
        }
      : null,
    comments: comments.slice(0, 6).map((comment) => ({
      text: comment.text || comment.comment || '',
      ownerUsername: comment.ownerUsername || comment.username || '',
      likes: toNumber(comment.likesCount),
    })),
  };
}

function normalizeProfile(profile) {
  const posts = Array.isArray(profile.latestPosts) ? profile.latestPosts.map(normalizePost) : [];

  return {
    profile: {
      username: profile.username || INSTAGRAM_USERNAME,
      displayName: profile.fullName || profile.username || 'Barberia Dali',
      avatar: pickUrl(profile.profilePicUrlHD, profile.profilePicUrl),
      bio: profile.biography || '',
      url: profile.url || `https://www.instagram.com/${INSTAGRAM_USERNAME}/`,
      externalUrl: profile.externalUrl || null,
      category: profile.businessCategoryName || null,
      verified: Boolean(profile.verified),
      private: Boolean(profile.private),
    },
    stats: {
      followers: toNumber(profile.followersCount),
      following: toNumber(profile.followsCount),
      posts: toNumber(profile.postsCount),
      highlights: toNumber(profile.highlightReelCount),
    },
    posts,
    updatedAt: new Date().toISOString(),
    source: 'apify',
  };
}

async function fetchInstagramProfile() {
  if (!APIFY_TOKEN) {
    const err = new Error('APIFY_TOKEN not configured');
    err.statusCode = 500;
    throw err;
  }

  const input = {
    usernames: [INSTAGRAM_USERNAME],
    includeAboutSection: false,
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

  const profile = Array.isArray(items) ? items[0] : null;
  if (!profile) {
    const err = new Error('Apify returned no Instagram profile data');
    err.statusCode = 502;
    throw err;
  }

  return normalizeProfile(profile);
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

    cachedPayload = await fetchInstagramProfile();
    cachedAt = now;

    return res.status(200).json({ ...cachedPayload, cached: false });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}
