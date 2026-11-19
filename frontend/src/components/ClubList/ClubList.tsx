import Link from "next/link";

import { ClubCard } from "@/components/ClubCard/ClubCard";

import styles from "./ClubList.module.css";

export type ClubListItem = {
  id: string;
  name: string;
  description: string;
  iconSrc: string;
};

type Props = {
  clubs: ClubListItem[];
  /** 検索語(検索していなければ空文字) */
  query: string;
};

export function ClubList({ clubs, query }: Props) {
  const countLabel =
    query === ""
      ? `全${clubs.length}件`
      : `「${query}」の検索結果:${clubs.length}件`;

  return (
    <>
      <p className={styles.count} aria-live="polite">
        {countLabel}
      </p>
      {clubs.length > 0 ? (
        <ul className={styles.grid}>
          {clubs.map((club) => (
            <li key={club.id} className={styles.item}>
              <ClubCard
                href={`/clubs/${club.id}`}
                name={club.name}
                description={club.description}
                iconSrc={club.iconSrc}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {query === ""
              ? "公開中のサークルはまだありません"
              : `「${query}」に一致するサークルは見つかりませんでした`}
          </p>
          {query !== "" && (
            <>
              <p className={styles.emptyHint}>
                言葉を短くするか、ひらがなとカタカナを変えて試してください。
              </p>
              <Link href="/" className={styles.clear}>
                検索をやめて全件を表示
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
