import { mkdir, writeFile } from 'node:fs/promises';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const INSTAGRAM_ACTOR_ID = process.env.APIFY_INSTAGRAM_PROFILE_ACTOR_ID || 'apify~instagram-profile-scraper';
const TIKTOK_ACTOR_ID = process.env.APIFY_TIKTOK_ACTOR_ID || 'clockworks~tiktok-scraper';
const INSTAGRAM_USERNAME = process.env.DALI_INSTAGRAM_USERNAME || 'dalibarber.11';
const TIKTOK_USERNAME = process.env.DALI_TIKTOK_PROFILE || 'dalibarber.11';
const OUT_DIR = new URL('../public/demos/dali-barber/data/', import.meta.url);

function requiredToken() {
  if (!APIFY_TOKEN) throw new Error('Missing APIFY_TOKEN');
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickUrl(...values) {
  return values.find((value) => typeof value === 'string' && /^https?:\/\//.test(value)) || null;
}

async function runActor(actorId, input) {
  requiredToken();

  const response = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );

  const text = await response.text();
  let items = [];
  try {
    items = JSON.parse(text || '[]');
  } catch {
    items = [];
  }

  if (!response.ok) {
    throw new Error(`Apify ${actorId} ${response.status}: ${text.slice(0, 500)}`);
  }

  return Array.isArray(items) ? items : [];
}

function normalizeInstagramPost(post) {
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
    images: Array.isArray(post.images) ? post.images.filter(Boolean).slice(0, 8) : [],
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
    comments: comments.slice(0, 8).map((comment) => ({
      text: comment.text || comment.comment || '',
      ownerUsername: comment.ownerUsername || comment.username || '',
      likes: toNumber(comment.likesCount),
    })),
  };
}

function normalizeInstagramProfile(profile) {
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
    posts: Array.isArray(profile.latestPosts) ? profile.latestPosts.map(normalizeInstagramPost) : [],
    updatedAt: new Date().toISOString(),
    source: 'weekly-static-snapshot',
  };
}

function normalizeTikTokPost(item) {
  return {
    id: item.id || item.webVideoUrl || null,
    url: item.webVideoUrl || null,
    caption: item.text || '',
    cover: pickUrl(item.videoMeta?.coverUrl, item.videoMeta?.originalCoverUrl, item['videoMeta.coverUrl']),
    videoUrl: pickUrl(
      item.videoUrl,
      item.videoMeta?.downloadAddr,
      item.videoMeta?.playAddr,
      item.videoMeta?.url,
      item.video?.playAddr,
      item.video?.downloadAddr,
      item['videoMeta.downloadAddr'],
      item['videoMeta.playAddr'],
      item['videoMeta.url'],
    ),
    likes: toNumber(item.diggCount),
    comments: toNumber(item.commentCount),
    shares: toNumber(item.shareCount),
    plays: toNumber(item.playCount),
    duration: toNumber(item.videoMeta?.duration) || toNumber(item['videoMeta.duration']),
    timestamp: item.createTimeISO || item.createTime || null,
  };
}

function normalizeTikTokItems(items) {
  const profileItem = items.find((item) => item?.authorMeta?.name || item?.['authorMeta.name']) || items[0] || {};
  const author = profileItem.authorMeta || {};
  const username = author.name || profileItem['authorMeta.name'] || TIKTOK_USERNAME;

  return {
    profile: {
      username,
      displayName: author.nickName || username || 'Barberia Dali',
      avatar: pickUrl(author.avatar, author.originalAvatarUrl, profileItem['authorMeta.avatar']),
      bio: author.signature || '',
      url: author.profileUrl || `https://www.tiktok.com/@${username}`,
    },
    stats: {
      followers: toNumber(author.fans),
      following: toNumber(author.following),
      likes: toNumber(author.heart),
      videos: toNumber(author.video),
    },
    latestVideos: items.filter((item) => item?.webVideoUrl).slice(0, 8).map(normalizeTikTokPost),
    updatedAt: new Date().toISOString(),
    source: 'weekly-static-snapshot',
  };
}

async function updateInstagram() {
  const items = await runActor(INSTAGRAM_ACTOR_ID, {
    usernames: [INSTAGRAM_USERNAME],
    includeAboutSection: false,
  });
  if (!items[0]) throw new Error('Instagram actor returned no profile');
  return normalizeInstagramProfile(items[0]);
}

async function updateTikTok() {
  const items = await runActor(TIKTOK_ACTOR_ID, {
    profiles: [TIKTOK_USERNAME],
    resultsPerPage: 8,
    profileScrapeSections: ['videos'],
    profileSorting: 'latest',
    excludePinnedPosts: false,
    shouldDownloadAvatars: false,
    shouldDownloadCovers: false,
    shouldDownloadMusicCovers: false,
    shouldDownloadVideos: false,
    shouldDownloadSubtitles: false,
    shouldDownloadSlideshowImages: false,
  });
  if (!items.length) throw new Error('TikTok actor returned no items');
  return normalizeTikTokItems(items);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const [instagram, tiktok] = await Promise.all([updateInstagram(), updateTikTok()]);

  await writeFile(new URL('instagram-snapshot.json', OUT_DIR), `${JSON.stringify(instagram, null, 2)}\n`);
  await writeFile(new URL('tiktok-snapshot.json', OUT_DIR), `${JSON.stringify(tiktok, null, 2)}\n`);

  console.log(
    `Updated Instagram ${instagram.posts.length} posts and TikTok ${tiktok.latestVideos.length} videos.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
