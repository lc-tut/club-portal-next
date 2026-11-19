import type { Metadata } from "next";
import { Suspense } from "react";

import { ClubList } from "@/components/ClubList/ClubList";
import { SearchForm } from "@/components/SearchForm/SearchForm";
import { imageUrl } from "@/lib/links";
import { getClubs } from "@/lib/server/clubs";
import { searchQueryFrom } from "@/lib/text";

import styles from "./page.module.css";

export async function generateMetadata({
  searchParams,
}: PageProps<"/">): Promise<Metadata> {
  const query = searchQueryFrom((await searchParams).q);
  return {
    // title.templateは同じ階層のページには効かないので、完全な形で書く
    title: { absolute: "サークル一覧 - ClubPortal" },
    // 検索結果のページは検索エンジンに載せない(任意の語を画面に出せるため)
    ...(query === "" ? {} : { robots: { index: false } }),
  };
}

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <main className={styles.main}>
      <div className={styles.heading}>
        <h1 className={styles.title}>サークル一覧</h1>
        <p className={styles.lead}>
          東京工科大学のサークルを、名前・読み仮名・活動内容から探せます。
        </p>
      </div>
      {/* 検索語(URLのq)はリクエストごとに変わるので、この中で読む */}
      <Suspense fallback={<SearchForm query="" />}>
        <ClubSearch searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ClubSearch({
  searchParams,
}: Pick<PageProps<"/">, "searchParams">) {
  const query = searchQueryFrom((await searchParams).q);
  const clubs = await getClubs(query);
  return (
    <>
      <SearchForm query={query} />
      <ClubList
        query={query}
        clubs={clubs.map((club) => ({
          id: club.id,
          name: club.name,
          description: club.description,
          iconSrc: imageUrl(club.icon_image_id),
        }))}
      />
    </>
  );
}
