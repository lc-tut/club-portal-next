import { describe, expect, it } from "vitest";

import {
  calendarEmbedUrl,
  imageUrl,
  instagramUrl,
  safeWebsiteUrl,
  xUrl,
  youtubeChannelUrl,
  youtubeEmbedUrl,
} from "@/lib/links";

// 外部リンクとiframeのURLは、APIから受け取ったIDやユーザー名を固定の書式に埋めるだけで作る
// (要件定義の第2節、第9節)

describe("SNSのリンク", () => {
  it("Xはユーザー名からURLを作る", () => {
    expect(xUrl("cp_sample_photo")).toBe("https://x.com/cp_sample_photo");
  });

  it("Instagramはユーザー名からURLを作る", () => {
    expect(instagramUrl("cp.sample.photo")).toBe(
      "https://www.instagram.com/cp.sample.photo/",
    );
  });

  it("YouTubeチャンネルはハンドルからURLを作る", () => {
    expect(youtubeChannelUrl("@cp-sample-photo")).toBe(
      "https://www.youtube.com/@cp-sample-photo",
    );
  });

  it("想定外の文字はエスケープし、パスを抜け出せない", () => {
    expect(xUrl("../evil?x=1")).toBe("https://x.com/..%2Fevil%3Fx%3D1");
  });
});

describe("独自サイトのリンク", () => {
  it("https://のURLはそのまま使う", () => {
    expect(safeWebsiteUrl("https://example.com/photo-club")).toBe(
      "https://example.com/photo-club",
    );
  });

  it.each([
    "http://example.com/",
    "javascript:alert(1)",
    "https://user:pass@example.com/",
    "not a url",
  ])("https以外や認証情報付きのURLは使わない: %s", (url) => {
    expect(safeWebsiteUrl(url)).toBeNull();
  });
});

describe("埋め込み", () => {
  it("カレンダーは共有カレンダーのIDから埋め込みURLを作る", () => {
    expect(
      calendarEmbedUrl("c_cpsamplephoto0000@group.calendar.google.com"),
    ).toBe(
      "https://calendar.google.com/calendar/embed?src=c_cpsamplephoto0000%40group.calendar.google.com&ctz=Asia%2FTokyo",
    );
  });

  it("YouTube動画はyoutube-nocookie.comで埋め込む", () => {
    expect(youtubeEmbedUrl("cpSample001")).toBe(
      "https://www.youtube-nocookie.com/embed/cpSample001",
    );
  });

  it("動画IDの形でない値は使わない", () => {
    expect(youtubeEmbedUrl("not/an/id")).toBeNull();
  });
});

describe("画像", () => {
  it("画像は同一オリジンのAPIから取る", () => {
    expect(imageUrl("10000000-0000-4000-8000-000000000001")).toBe(
      "/api/images/10000000-0000-4000-8000-000000000001",
    );
  });
});
