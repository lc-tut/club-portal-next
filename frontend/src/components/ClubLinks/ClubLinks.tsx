import {
  instagramUrl,
  safeWebsiteUrl,
  xUrl,
  youtubeChannelUrl,
} from "@/lib/links";

import styles from "./ClubLinks.module.css";

type Props = {
  xUsername: string | null;
  instagramUsername: string | null;
  youtubeHandle: string | null;
  websiteUrl: string | null;
};

// 登録されたリンクだけを出す、URLは固定の書式で組み立てる
export function ClubLinks({
  xUsername,
  instagramUsername,
  youtubeHandle,
  websiteUrl,
}: Props) {
  const website = websiteUrl ? safeWebsiteUrl(websiteUrl) : null;
  const links = [
    xUsername && { label: "X", href: xUrl(xUsername) },
    instagramUsername && {
      label: "Instagram",
      href: instagramUrl(instagramUsername),
    },
    youtubeHandle && {
      label: "YouTube",
      href: youtubeChannelUrl(youtubeHandle),
    },
    website && { label: "Webサイト", href: website },
  ].filter((link): link is { label: string; href: string } => Boolean(link));

  if (links.length === 0) {
    return null;
  }
  return (
    <ul aria-label="外部リンク" className={styles.list}>
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
