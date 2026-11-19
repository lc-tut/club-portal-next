// 一覧は<Suspense>の中身を後から流すので、<main>の外の隠し要素に入る、セレクタはmainで絞らない
import { describe, expect, it } from "vitest";

import { getPage, PUBLIC_NAMES_IN_ORDER, texts } from "./support";

describe("一覧(/)", () => {
  it("公開中のサークルを読み仮名順に全件出す", async () => {
    const { status, root } = await getPage("/");

    expect(status).toBe(200);
    expect(root.querySelector("title")?.text).toBe("サークル一覧 - ClubPortal");
    expect(texts(root, "main h1")).toEqual(["サークル一覧"]);
    expect(texts(root, "ul li h2")).toEqual(PUBLIC_NAMES_IN_ORDER);
    expect(root.querySelector('meta[name="robots"]')).toBeNull();
    expect(root.text).toContain("全6件");
  });

  it("カードは詳細へのリンクで、アイコンは同一オリジンのAPIから取る", async () => {
    const { root } = await getPage("/");
    const card = root.querySelector("ul li a");

    expect(card?.getAttribute("href")).toMatch(/^\/clubs\/[0-9a-f-]{36}$/);
    expect(card?.querySelector("img")?.getAttribute("src")).toMatch(
      /^\/api\/images\/[0-9a-f-]{36}$/,
    );
  });

  it("公開しないサークルは出さない", async () => {
    const { html } = await getPage("/");

    expect(html).not.toContain("演劇部");
    expect(html).not.toContain("準備中の同好会");
  });
});

describe("検索(/?q=)", () => {
  it("一致したサークルだけを出し、検索語を入力欄に残す", async () => {
    const { root } = await getPage(`/?q=${encodeURIComponent("撮影")}`);

    expect(texts(root, "ul li h2")).toEqual(["写真部"]);
    expect(root.text).toContain("「撮影」の検索結果:1件");
    // 検索結果のページは検索エンジンに載せない(任意の語を画面に出せるため)
    expect(
      root.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toContain("noindex");
    // 読み込み中の仮表示にも空の入力欄があり、本物は後から流されてHTMLの後ろに入る
    const inputs = root.querySelectorAll("input#q");
    expect(inputs.at(-1)?.getAttribute("value")).toBe("撮影");
  });

  it("該当なしのときは、全件表示へ戻るリンクを出す", async () => {
    const { root } = await getPage(`/?q=${encodeURIComponent("存在しない語")}`);

    expect(root.querySelectorAll("ul li")).toHaveLength(0);
    expect(root.text).toContain(
      "「存在しない語」に一致するサークルは見つかりませんでした",
    );
    const clear = root
      .querySelectorAll("a")
      .find((a) => a.text.trim() === "検索をやめて全件を表示");
    expect(clear?.getAttribute("href")).toBe("/");
  });

  it("APIの制約を超える検索語でもエラーにしない(制御文字を除き50文字で切る)", async () => {
    const q = encodeURIComponent(`写真\n${"あ".repeat(60)}`);
    const { status } = await getPage(`/?q=${q}`);

    expect(status).toBe(200);
  });
});
