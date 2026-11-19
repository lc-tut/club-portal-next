// フォントの配信(要件定義の第9節「フォントはセルフホスト」と第12節の決定)
// - フォントのファイルを自分のオリジンから配り、長期間キャッシュさせる
// - font-display: blockにして、ほかのフォントで描いてから置き換えることをしない
// - 2回目の表示では、キャッシュから読んだNoto Sans JPで描く

import { chromium, type CDPSession } from "playwright";
import { describe, expect, it } from "vitest";

import { BASE_URL, getPage } from "./support";

// font-display: blockで文字を描かずに待つ上限(ブラウザの実装、仕様で推奨される値)
const BLOCK_PERIOD_MS = 3000;

async function fontCss(): Promise<{ css: string; fontUrls: URL[] }> {
  const { root } = await getPage("/");
  const cssHrefs = root
    .querySelectorAll('link[rel="stylesheet"]')
    .map((link) => link.getAttribute("href") ?? "");
  let css = "";
  const fontUrls: URL[] = [];
  for (const href of cssHrefs) {
    // CSSの中のurl()はCSSファイルからの相対パスなので、CSSのURLを基準に解決する
    const cssUrl = new URL(href, BASE_URL);
    const text = await (await fetch(cssUrl)).text();
    css += text;
    for (const m of text.matchAll(/url\(([^)]+\.woff2)\)/g)) {
      fontUrls.push(new URL(m[1], cssUrl));
    }
  }
  return { css, fontUrls };
}

/** 要素の文字を描くのに実際に使われたフォントのうち、Webフォントでないもの */
async function fallbackFonts(cdp: CDPSession, selector: string) {
  const { root } = await cdp.send("DOM.getDocument");
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector,
  });
  const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
  expect(fonts.length).toBeGreaterThan(0);
  return fonts.filter((font) => !font.isCustomFont);
}

describe("フォント", () => {
  it("自分のオリジンから、変わらないファイルとして長期間キャッシュさせて配る", async () => {
    const { fontUrls } = await fontCss();

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

  it("font-displayはblock(ほかのフォントで描いてから置き換えることをしない)", async () => {
    const { css } = await fontCss();

    expect(css).toContain("font-display:block");
    expect(css).not.toMatch(/font-display:(swap|fallback|optional|auto)/);
  });

  it("2回目の表示では、キャッシュから読んだNoto Sans JPで描く", async () => {
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
      await second.addInitScript(() => {
        document.fonts.addEventListener("loadingdone", () => {
          (window as unknown as { fontsDone: number }).fontsDone =
            performance.now();
        });
      });
      await second.goto(new URL("/", BASE_URL).toString(), {
        waitUntil: "networkidle",
      });
      await cdp.send("DOM.enable");
      await cdp.send("CSS.enable");

      // フォントはネットワークではなくキャッシュから読んだ
      expect(fontsFromNetwork).toEqual([]);
      // 文字を描かずに待つ上限より十分前に読み終えた(ほかのフォントで描く場面がない)
      const fontsDone = await second.evaluate(
        () => (window as unknown as { fontsDone: number }).fontsDone,
      );
      expect(fontsDone).toBeLessThan(BLOCK_PERIOD_MS / 2);
      // 実際にNoto Sans JP(Webフォント)で描かれている
      for (const selector of ["main h1", "main p"]) {
        expect(await fallbackFonts(cdp, selector)).toEqual([]);
      }
    } finally {
      await browser.close();
    }
  }, 60_000);
});
