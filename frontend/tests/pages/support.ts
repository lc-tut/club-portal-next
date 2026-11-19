// ページのテストの共通の準備
// scripts/page-tests.shが、テスト用DBにつないだbackendとnext startを起動してから実行する

import { parse, type HTMLElement } from "node-html-parser";

export const BASE_URL = process.env.PAGE_TEST_BASE_URL ?? "";
export const PUBLIC_ORIGIN = process.env.CLUBPORTAL_PUBLIC_ORIGIN ?? "";

if (!BASE_URL || !PUBLIC_ORIGIN) {
  throw new Error(
    "PAGE_TEST_BASE_URLとCLUBPORTAL_PUBLIC_ORIGINがない、mise run testで実行する",
  );
}

// シード(db/seeds/dev.sql)のID
export const PHOTO_CLUB = "00000000-0000-4000-8000-000000000001";
export const ESS = "00000000-0000-4000-8000-000000000002";
export const HIDDEN_CLUB = "00000000-0000-4000-8000-000000000007";
export const INCOMPLETE_CLUB = "00000000-0000-4000-8000-000000000008";
export const PHOTO_CLUB_ICON = "10000000-0000-4000-8000-000000000001";

export const PUBLIC_NAMES_IN_ORDER = [
  "ESS",
  "LinuxClub",
  "軽音楽サークル",
  "茶道部",
  "写真部",
  "ボードゲーム同好会",
];

// OGPを取りに来るbotとして取得する(Next.jsはbotにはmetaタグを<head>に入れて返す)
export const BOT_USER_AGENT = "Twitterbot/1.0";

export async function getPage(
  path: string,
  userAgent?: string,
): Promise<{ status: number; root: HTMLElement; html: string }> {
  const response = await fetch(new URL(path, BASE_URL), {
    headers: userAgent ? { "user-agent": userAgent } : {},
  });
  const html = await response.text();
  return { status: response.status, root: parse(html), html };
}

export function texts(root: HTMLElement, selector: string): string[] {
  return root.querySelectorAll(selector).map((el) => el.text.trim());
}
