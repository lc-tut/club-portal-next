// 公開ページのデータ取得(サーバー描画で公開APIだけを呼ぶ)

import { cacheLife } from "next/cache";

import type { components } from "@/lib/api/schema";
import { createApiClient } from "@/lib/apiClient";
import { apiInternalUrl } from "@/lib/server/env";

export type ClubSummary = components["schemas"]["ClubSummary"];
export type ClubDetail = components["schemas"]["ClubDetail"];

// 公開ページの再生成の間隔(要件定義の第6節、初期値60秒)
const PUBLIC_PAGE_CACHE = { stale: 60, revalidate: 60, expire: 3600 };

/** 公開中のサークルの一覧(qが空文字なら全件) */
export async function getClubs(q: string): Promise<ClubSummary[]> {
  "use cache";
  cacheLife(PUBLIC_PAGE_CACHE);

  const client = createApiClient(apiInternalUrl());
  const { data, response } = await client.GET("/api/clubs", {
    params: { query: q === "" ? {} : { q } },
  });
  if (!data) {
    throw new Error(`サークルの一覧を取得できなかった(${response.status})`);
  }
  return data.items;
}

/** 公開中のサークルの詳細(公開条件を満たさなければnull) */
export async function getClub(id: string): Promise<ClubDetail | null> {
  "use cache";
  cacheLife(PUBLIC_PAGE_CACHE);

  const client = createApiClient(apiInternalUrl());
  const { data, response } = await client.GET("/api/clubs/{club_id}", {
    params: { path: { club_id: id } },
  });
  if (response.status === 404) {
    return null;
  }
  if (!data) {
    throw new Error(`サークルの詳細を取得できなかった(${response.status})`);
  }
  return data;
}
