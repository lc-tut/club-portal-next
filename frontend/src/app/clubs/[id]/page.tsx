import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CalendarEmbed } from "@/components/CalendarEmbed/CalendarEmbed";
import { ClubHero } from "@/components/ClubHero/ClubHero";
import { ClubLinks } from "@/components/ClubLinks/ClubLinks";
import { PhotoGrid } from "@/components/PhotoGrid/PhotoGrid";
import { VideoList } from "@/components/VideoList/VideoList";
import { imageUrl, youtubeEmbedUrl } from "@/lib/links";
import { getClub } from "@/lib/server/clubs";
import { publicOrigin } from "@/lib/server/env";
import { excerpt } from "@/lib/text";

import styles from "./page.module.css";

// OGP(要件定義の第2節):アイコン(1:1)をog:imageに使い、twitter:cardはsummary
export async function generateMetadata({
  params,
}: PageProps<"/clubs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const club = await getClub(id);
  if (!club) {
    return { title: "サークルが見つかりません" };
  }
  const origin = publicOrigin();
  const description = excerpt(club.description, 120);
  const icon = new URL(imageUrl(club.icon_image_id), origin).toString();
  return {
    title: club.name,
    description,
    openGraph: {
      type: "website",
      siteName: "ClubPortal",
      title: club.name,
      description,
      url: new URL(`/clubs/${club.id}`, origin).toString(),
      images: [{ url: icon, alt: `${club.name}のアイコン` }],
    },
    twitter: {
      card: "summary",
      title: club.name,
      description,
      images: [icon],
    },
  };
}

export default function ClubPage({ params }: PageProps<"/clubs/[id]">) {
  return (
    <Suspense>
      <ClubDetailView params={params} />
    </Suspense>
  );
}

async function ClubDetailView({
  params,
}: Pick<PageProps<"/clubs/[id]">, "params">) {
  const { id } = await params;
  const club = await getClub(id);
  if (!club) {
    // 公開条件を満たさないサークルは、ないものとして扱う
    notFound();
  }
  const icon = imageUrl(club.icon_image_id);
  const photos = club.photos.map((photo) => imageUrl(photo.image_id));
  // 形の正しくない動画IDは出さない(節を出すかどうかも、絞った結果で決める)
  const videos = club.videos
    .map((video) => video.youtube_video_id)
    .filter((id) => youtubeEmbedUrl(id) !== null);

  return (
    <main>
      <ClubHero
        name={club.name}
        iconSrc={icon}
        links={
          <ClubLinks
            xUsername={club.x_username}
            instagramUsername={club.instagram_username}
            youtubeHandle={club.youtube_handle}
            websiteUrl={club.website_url}
          />
        }
      />
      <div className={styles.content}>
        <section aria-labelledby="about" className={styles.section}>
          <h2 id="about" className={styles.sectionTitle}>
            サークルについて
          </h2>
          <p className={styles.description}>{club.description}</p>
        </section>

        {club.calendar_id && (
          <section aria-labelledby="schedule" className={styles.section}>
            <h2 id="schedule" className={styles.sectionTitle}>
              活動スケジュール
            </h2>
            <CalendarEmbed calendarId={club.calendar_id} clubName={club.name} />
          </section>
        )}

        {(photos.length > 0 || videos.length > 0) && (
          <section aria-labelledby="gallery" className={styles.gallery}>
            <h2 id="gallery" className={styles.sectionTitle}>
              活動の様子
            </h2>
            <PhotoGrid photoSrcs={photos} clubName={club.name} />
            <VideoList videoIds={videos} clubName={club.name} />
          </section>
        )}

        <Link href="/" className={styles.back}>
          ← サークル一覧へ戻る
        </Link>
      </div>
    </main>
  );
}
