import { describe, expect, it } from "vitest";

import { excerpt, searchQueryFrom } from "@/lib/text";

describe("searchQueryFrom(URLのqから検索語を取り出す)", () => {
  it.each([
    [undefined, ""],
    ["写真", "写真"],
    ["  写真  ", "写真"],
    [["写真", "茶道"], "写真"], // 複数あれば最初だけ
    ["写真\n部", "写真部"], // 制御文字は除く
    ["あ".repeat(60), "あ".repeat(50)], // APIの上限(50文字)に合わせて切る
  ])("%j → %j", (raw, expected) => {
    expect(searchQueryFrom(raw)).toBe(expected);
  });
});

describe("excerpt(OGPなどに使う説明の冒頭)", () => {
  it("改行と連続する空白を1つの空白にまとめる", () => {
    expect(excerpt("一行目\n\n二行目  です", 100)).toBe("一行目 二行目 です");
  });

  it("長い文は切って末尾に…を付ける", () => {
    expect(excerpt("あ".repeat(10), 5)).toBe("ああああ…");
  });

  it("上限以内ならそのまま", () => {
    expect(excerpt("あ".repeat(5), 5)).toBe("あああああ");
  });
});
