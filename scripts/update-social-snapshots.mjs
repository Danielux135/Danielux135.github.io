import { mkdir, writeFile } from 'node:fs/promises';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const INSTAGRAM_ACTOR_ID = process.env.APIFY_INSTAGRAM_PROFILE_ACTOR_ID || 'apify~instagram-profile-scraper';
const TIKTOK_ACTOR_ID = process.env.APIFY_TIKTOK_ACTOR_ID || 'clockworks~tiktok-scraper';
const INSTAGRAM_USERNAME = process.env.DALI_INSTAGRAM_USERNAME || 'dalibarber.11';
const TIKTOK_USERNAME = process.env.DALI_TIKTOK_PROFILE || 'dalibarber.11';
const TIKTOK_LATEST_LIMIT = toNumber(process.env.DALI_TIKTOK_LATEST_LIMIT) || 10;
const OUT_DIR = new URL('../public/demos/dali-barber/data/', import.meta.url);

function requiredToken() {
  if (!APIFY_TOKEN) throw new Error('Missing APIFY_TOKEN');
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function firstNumber(...values) {
  for (const value of values.flat(Infinity)) {
    const n = toNumber(value);
    if (n !== null) return n;
  }
  return null;
}

function pickUrl(...values) {
  return values.flat(Infinity).find((value) => typeof value === 'string' && /^https?:\/\//.test(value)) || null;
}

function tiktokVideoIdFromUrl(urlOrId) {
  const value = String(urlOrId || '');
  const direct = value.match(/\d{12,}/)?.[0];
  if (direct) return direct;
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    const videoIndex = parts.findIndex((part) => part === 'video');
    return videoIndex >= 0 ? parts[videoIndex + 1] || null : null;
  } catch {
    return null;
  }
}

function tiktokPlayerUrl(videoUrlOrId) {
  const id = tiktokVideoIdFromUrl(videoUrlOrId);
  if (!id) return null;
  const params = new URLSearchParams({
    autoplay: '0',
    controls: '1',
    description: '0',
    music_info: '0',
    rel: '0',
  });
  return `https://www.tiktok.com/player/v1/${id}?${params.toString()}`;
}

async function getTikTokOEmbed(videoUrl) {
  if (!videoUrl) return null;
  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function getTikTokProfileVideoCount(username) {
  try {
    const response = await fetch(`https://www.tiktok.com/@${username}`, {
      headers: {
        accept: 'text/html',
        'user-agent': 'Mozilla/5.0',
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const counts = [...html.matchAll(/"videoCount":"?(\d+)"?/g)]
      .map((match) => toNumber(match[1]))
      .filter((count) => count !== null);
    return counts.length ? Math.max(...counts) : null;
  } catch {
    return null;
  }
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

function normalizeTikTokPost(item, oembed = null) {
  const url = pickUrl(item.webVideoUrl, item.url) || null;
  const id = tiktokVideoIdFromUrl(item.id || url) || item.id || null;
  const cover = pickUrl(
    item.videoMeta?.coverUrl,
    item.videoMeta?.originalCoverUrl,
    item.videoMeta?.dynamicCoverUrl,
    item.video?.cover,
    item.video?.originCover,
    item.video?.dynamicCover,
    item.covers,
    item.thumbnails,
    item.thumbnailUrl,
    item.thumbnail_url,
    item['videoMeta.coverUrl'],
    item['videoMeta.originalCoverUrl'],
    item['videoMeta.dynamicCoverUrl'],
    oembed?.thumbnail_url,
  );

  return {
    id,
    url,
    caption: item.text || oembed?.title || '',
    cover,
    thumbnail: cover,
    oEmbedThumbnail: pickUrl(oembed?.thumbnail_url),
    playerUrl: tiktokPlayerUrl(id || url),
    embedUrl: tiktokPlayerUrl(id || url),
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
    music: item.musicMeta
      ? {
          song: item.musicMeta.musicName || item.musicMeta.songName || item.musicMeta.title || null,
          artist: item.musicMeta.musicAuthor || item.musicMeta.authorName || item.musicMeta.artist || null,
          original: typeof item.musicMeta.original === 'boolean' ? item.musicMeta.original : null,
        }
      : null,
  };
}

async function normalizeTikTokItems(items) {
  const profileItem = items.find((item) => item?.authorMeta?.name || item?.['authorMeta.name']) || items[0] || {};
  const author = profileItem.authorMeta || {};
  const authorStats = author.stats || profileItem.authorStats || profileItem.stats || {};
  const username = author.name || profileItem['authorMeta.name'] || TIKTOK_USERNAME;
  const videoItems = items.filter((item) => item?.webVideoUrl).slice(0, TIKTOK_LATEST_LIMIT);
  const publicProfileVideoCount = await getTikTokProfileVideoCount(username);
  const authorVideoCount = toNumber(author.video);
  const totalVideos =
    firstNumber(
      author.videoCount,
      author.videosCount,
      author.awemeCount,
      authorStats.videoCount,
      authorStats.videosCount,
      authorStats.awemeCount,
      profileItem.videoCount,
      profileItem.videosCount,
      profileItem.awemeCount,
      profileItem['authorMeta.videoCount'],
      profileItem['authorMeta.videosCount'],
      profileItem['authorMeta.awemeCount'],
    ) ??
    publicProfileVideoCount ??
    (authorVideoCount !== null && authorVideoCount > videoItems.length ? authorVideoCount : null) ??
    videoItems.length;
  const oembeds = await Promise.all(videoItems.map((item) => getTikTokOEmbed(item.webVideoUrl)));

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
      videos: totalVideos,
    },
    latestVideos: videoItems.map((item, index) => normalizeTikTokPost(item, oembeds[index])),
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
    resultsPerPage: TIKTOK_LATEST_LIMIT,
    profileScrapeSections: ['videos'],
    profileSorting: 'latest',
    excludePinnedPosts: false,
    shouldDownloadAvatars: false,
    shouldDownloadCovers: true,
    shouldDownloadMusicCovers: false,
    shouldDownloadVideos: false,
    shouldDownloadSubtitles: false,
    shouldDownloadSlideshowImages: false,
  });
  if (!items.length) throw new Error('TikTok actor returned no items');
  return await normalizeTikTokItems(items);
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
