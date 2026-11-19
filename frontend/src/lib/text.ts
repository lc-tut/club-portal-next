// ページで使う文字列の整形

const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;
const MAX_QUERY_LENGTH = 50;

/** URLのqから検索語を取り出す(APIの制約に合わせ、制御文字を除いて50文字までにする) */
export function searchQueryFrom(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) {
    return "";
  }
  return value.replace(CONTROL_CHARS, "").trim().slice(0, MAX_QUERY_LENGTH);
}

/** 説明の冒頭(改行と連続する空白をまとめ、maxLength文字を超えたら…で切る) */
export function excerpt(text: string, maxLength: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= maxLength) {
    return flat;
  }
  return `${flat.slice(0, maxLength - 1)}…`;
}
