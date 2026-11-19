import { describe, expect, it } from "vitest";

import {
  BOT_USER_AGENT,
  ESS,
  getPage,
  HIDDEN_CLUB,
  INCOMPLETE_CLUB,
  PHOTO_CLUB,
  PHOTO_CLUB_ICON,
  PUBLIC_ORIGIN,
  texts,
} from "./support";

describe("詳細(/clubs/{id})", () => {
  it("名前、説明、リンク、カレンダー、写真、動画を出す", async () => {
    const { status, root } = await getPage(`/clubs/${PHOTO_CLUB}`);

    expect(status).toBe(200);
    expect(texts(root, "h1")).toEqual(["写真部"]);
    expect(texts(root, "main h2")).toEqual([
      "サークルについて",
      "活動スケジュール",
      "活動の様子",
    ]);
    expect(root.text).toContain("初心者向けにカメラの貸し出しもあります。");

    const links = root.querySelectorAll('ul[aria-label="外部リンク"] a');
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "https://x.com/cp_sample_photo",
      "https://www.instagram.com/cp.sample.photo/",
      "https://www.youtube.com/@cp-sample-photo",
      "https://example.com/photo-club",
    ]);
    for (const a of links) {
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    }

    const frames = root
      .querySelectorAll("iframe")
      .map((f) => f.getAttribute("src"));
    expect(frames).toEqual([
      "https://calendar.google.com/calendar/embed?src=c_cpsamplephoto0000%40group.calendar.google.com&ctz=Asia%2FTokyo",
      "https://www.youtube-nocookie.com/embed/cpSample001",
      "https://www.youtube-nocookie.com/embed/cpSample002",
    ]);
    // iframeはトップレベルへの遷移を許さず、送るリファラーを絞る
    for (const frame of root.querySelectorAll("iframe")) {
      const sandbox = frame.getAttribute("sandbox") ?? "";
      expect(sandbox).toContain("allow-scripts");
      expect(sandbox).not.toContain("allow-top-navigation");
      expect(frame.getAttribute("referrerpolicy")).toBe(
        "strict-origin-when-cross-origin",
      );
    }
    expect(root.querySelectorAll("main ul img")).toHaveLength(3);
  });

  it("値のない節とリンクは出さない", async () => {
    const { root } = await getPage(`/clubs/${ESS}`);

    expect(texts(root, "main h2")).toEqual(["サークルについて"]);
    expect(root.querySelector('ul[aria-label="外部リンク"]')).toBeNull();
    expect(root.querySelectorAll("iframe")).toHaveLength(0);
  });

  it.each([
    ["adminが非公開", HIDDEN_CLUB, "演劇部"],
    ["アイコンなし", INCOMPLETE_CLUB, "準備中の同好会"],
    ["存在しない", "00000000-0000-4000-8000-0000000000ff", "撮影"],
    ["UUIDでない", "not-a-uuid", "撮影"],
    ["ドット", ".", "撮影"],
    ["ハイフンなし", PHOTO_CLUB.replaceAll("-", ""), "撮影"],
  ])(
    "公開しないサークルは、検索エンジンに載せない「見つからない」画面にする(%s)",
    async (_label, id, secret) => {
      // Cache Componentsでは状態コードは200のまま(要件定義の第12節)
      const { root, html } = await getPage(`/clubs/${id}`);

      expect(
        root.querySelector('meta[name="robots"]')?.getAttribute("content"),
      ).toBe("noindex");
      expect(root.text).toContain("ページが見つかりません");
      expect(html).not.toContain(secret);
    },
  );
});

describe("OGP(要件定義の第2節)", () => {
  it("botには<head>にOGPを出す、og:imageはアイコンの絶対URL", async () => {
    const { root } = await getPage(`/clubs/${PHOTO_CLUB}`, BOT_USER_AGENT);
    const head = root.querySelector("head");
    const meta = (key: string) =>
      head
        ?.querySelector(`meta[property="${key}"], meta[name="${key}"]`)
        ?.getAttribute("content");

    expect(head?.querySelector("title")?.text).toBe("写真部 - ClubPortal");
    expect(meta("og:title")).toBe("写真部");
    expect(meta("og:type")).toBe("website");
    expect(meta("og:url")).toBe(`${PUBLIC_ORIGIN}/clubs/${PHOTO_CLUB}`);
    expect(meta("og:image")).toBe(
      `${PUBLIC_ORIGIN}/api/images/${PHOTO_CLUB_ICON}`,
    );
    expect(meta("og:description")).toBe(
      "学内外で撮影会を開き、写真展で作品を発表しています。 初心者向けにカメラの貸し出しもあります。見学はいつでも歓迎です。",
    );
    expect(meta("twitter:card")).toBe("summary");
    expect(meta("twitter:image")).toBe(
      `${PUBLIC_ORIGIN}/api/images/${PHOTO_CLUB_ICON}`,
    );
  });
});
