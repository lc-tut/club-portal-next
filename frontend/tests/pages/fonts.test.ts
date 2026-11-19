// フォントの配信(要件定義の第9節「フォントはセルフホスト」と、利用者との約束)
// - フォントのファイルを長期間キャッシュさせる
// - 2回目以降の表示では、最初のフレームからフォントが使える(置き換えが起きない)

import { chromium } from "playwright";
import { describe, expect, it } from "vitest";

import { BASE_URL, getPage } from "./support";

const FONT_FAMILY = '16px "Noto Sans JP Variable"';

describe("フォント", () => {
  it("自分のオリジンから、変わらないファイルとして長期間キャッシュさせて配る", async () => {
    const { root } = await getPage("/");
    const cssHrefs = root
      .querySelectorAll('link[rel="stylesheet"]')
      .map((link) => link.getAttribute("href") ?? "");
    // CSSの中のurl()はCSSファイルからの相対パスなので、CSSのURLを基準に解決する
    const fontUrls: URL[] = [];
    for (const href of cssHrefs) {
      const cssUrl = new URL(href, BASE_URL);
      const css = await (await fetch(cssUrl)).text();
      for (const m of css.matchAll(/url\(([^)]+\.woff2)\)/g)) {
        fontUrls.push(new URL(m[1], cssUrl));
      }
    }

    expect(fontUrls.length).toBeGreaterThan(0);
    for (const url of fontUrls) {
      // 外部のCDNを使わない
      expect(url.origin).toBe(new URL(BASE_URL).origin);
    }
    const font = await fetch(fontUrls[0]);
    expect(font.status).toBe(200);
    expect(font.headers.get("cache-control")).toContain("max-age=31536000");
    expect(font.headers.get("cache-control")).toContain("immutable");
  });

  it("2回目の表示では、フォントをキャッシュから読み、最初のフレームから使える", async () => {
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext();
      const first = await context.newPage();
      await first.goto(new URL("/", BASE_URL).toString(), {
        waitUntil: "networkidle",
      });
      await first.close();

      // 2回目(新しいタブで開き直す)
      const second = await context.newPage();
      const cdp = await context.newCDPSession(second);
      await cdp.send("Network.enable");
      const fontsFromNetwork: string[] = [];
      cdp.on("Network.responseReceived", (event) => {
        const fromCache =
          event.response.fromDiskCache || event.response.fromServiceWorker;
        if (event.type === "Font" && !fromCache) {
          fontsFromNetwork.push(event.response.url);
        }
      });
      await second.addInitScript((family) => {
        requestAnimationFrame(() => {
          (window as unknown as { fontReady: boolean }).fontReady =
            document.fonts.check(family, "サークル一覧");
        });
      }, FONT_FAMILY);
      await second.goto(new URL("/", BASE_URL).toString(), {
        waitUntil: "networkidle",
      });

      expect(fontsFromNetwork).toEqual([]);
      expect(
        await second.evaluate(
          () => (window as unknown as { fontReady: boolean }).fontReady,
        ),
      ).toBe(true);
    } finally {
      await browser.close();
    }
  }, 60_000);
});
