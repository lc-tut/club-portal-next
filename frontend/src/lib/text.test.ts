import { describe, expect, it } from "vitest";

import { excerpt, isCanonicalUuid, searchQueryFrom } from "@/lib/text";

describe("searchQueryFrom(URLのqから検索語を取り出す)", () => {
  it.each([
    [undefined, ""],
    ["写真", "写真"],
    ["  写真  ", "写真"],
    [["写真", "茶道"], "写真"], // 複数あれば最初だけ
    ["写真\n部", "写真部"], // 制御文字は除く
    ["あ".repeat(60), "あ".repeat(50)], // APIの上限(50文字)に合わせて切る
    // 文字(コードポイント)単位で切り、絵文字の途中で切らない
    ["あ".repeat(49) + "😀😀", "あ".repeat(49) + "😀"],
    // 見えない文字(双方向制御、ゼロ幅、行区切り)も除く
    ["写真\u202e\u200b\u2028部", "写真部"],
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

describe("isCanonicalUuid(APIに渡す前にIDの形を確かめる)", () => {
  const id = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

  it("正規の形(小文字、ハイフンつき36文字)だけを受け付ける", () => {
    expect(isCanonicalUuid(id)).toBe(true);
  });

  it.each([
    id.toUpperCase(),
    id.replaceAll("-", ""),
    ".",
    "..",
    `${id}/`,
    "not-a-uuid",
  ])("それ以外は受け付けない: %s", (value) => {
    expect(isCanonicalUuid(value)).toBe(false);
  });
});
