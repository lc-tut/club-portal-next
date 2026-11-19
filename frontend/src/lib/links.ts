// 外部リンク、埋め込み、画像のURLを組み立てる
// APIから受け取ったIDやユーザー名を固定の書式に埋めるだけにし、任意のURLは使わない
// (要件定義の第2節「SNSリンク」「動画」「カレンダー」、第9節「入力と出力」)

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function xUrl(username: string): string {
  return `https://x.com/${encodeURIComponent(username)}`;
}

export function instagramUrl(username: string): string {
  return `https://www.instagram.com/${encodeURIComponent(username)}/`;
}

export function youtubeChannelUrl(handle: string): string {
  // ハンドルは@で始まる、@はそのまま使う
  return `https://www.youtube.com/@${encodeURIComponent(handle.replace(/^@/, ""))}`;
}

/** 独自サイトはhttps://で、認証情報を含まないURLだけを使う(APIでも検証済み、念のため) */
export function safeWebsiteUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    return null;
  }
  return url;
}

export function calendarEmbedUrl(calendarId: string): string {
  const params = new URLSearchParams({ src: calendarId, ctz: "Asia/Tokyo" });
  return `https://calendar.google.com/calendar/embed?${params.toString()}`;
}

/** 動画IDの形でない値は使わない */
export function youtubeEmbedUrl(videoId: string): string | null {
  if (!YOUTUBE_VIDEO_ID.test(videoId)) {
    return null;
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function imageUrl(imageId: string): string {
  return `/api/images/${encodeURIComponent(imageId)}`;
}
