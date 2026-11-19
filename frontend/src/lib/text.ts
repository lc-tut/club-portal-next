// ページで使う文字列の整形

// 制御文字、書式文字(双方向制御、ゼロ幅など)、行・段落区切り(APIでも拒否される)
const INVISIBLE_CHARS = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;
const CANONICAL_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_QUERY_LENGTH = 50;

/** URLのqから検索語を取り出す(APIの制約に合わせ、見えない文字を除いて50文字までにする) */
export function searchQueryFrom(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) {
    return "";
  }
  const cleaned = value.replace(INVISIBLE_CHARS, "").trim();
  // 文字(コードポイント)単位で切る、UTF-16の単位で切ると絵文字の途中で割れる
  return Array.from(cleaned).slice(0, MAX_QUERY_LENGTH).join("");
}

/** 説明の冒頭(改行と連続する空白をまとめ、maxLength文字を超えたら…で切る) */
export function excerpt(text: string, maxLength: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= maxLength) {
    return flat;
  }
  return `${flat.slice(0, maxLength - 1)}…`;
}

/** 正規の形のUUID(小文字、ハイフンつき36文字)か(APIのパスに入れる前に確かめる) */
export function isCanonicalUuid(value: string): boolean {
  return CANONICAL_UUID.test(value);
}
