import { youtubeEmbedUrl } from "@/lib/links";

import styles from "./VideoList.module.css";

type Props = {
  videoIds: string[];
  clubName: string;
};

// YouTube動画の埋め込み(youtube-nocookie.com、動画IDから固定の書式で作る)
export function VideoList({ videoIds, clubName }: Props) {
  const videos = videoIds
    .map((id) => ({ id, src: youtubeEmbedUrl(id) }))
    .filter(
      (video): video is { id: string; src: string } => video.src !== null,
    );
  if (videos.length === 0) {
    return null;
  }
  return (
    <div className={styles.list}>
      {videos.map((video, index) => (
        <iframe
          key={video.id}
          src={video.src}
          title={`${clubName}の活動の様子(動画${index + 1})`}
          loading="lazy"
          allow="encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className={styles.video}
        />
      ))}
    </div>
  );
}
