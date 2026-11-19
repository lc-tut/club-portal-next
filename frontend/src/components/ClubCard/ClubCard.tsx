import Link from "next/link";

import styles from "./ClubCard.module.css";

type Props = {
  href: string;
  name: string;
  description: string;
  iconSrc: string;
};

// カード全体が詳細へのリンク
export function ClubCard({ href, name, description, iconSrc }: Props) {
  return (
    <Link href={href} className={styles.card}>
      {/* 名前がすぐ隣にあるので、アイコンは読み上げない */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 画像はAPIで再エンコード済みのWebPなので、Next.jsの画像最適化は通さない */}
      <img
        src={iconSrc}
        alt=""
        width={72}
        height={72}
        className={styles.icon}
      />
      <div className={styles.body}>
        <h2 className={styles.name}>{name}</h2>
        <p className={styles.description}>{description}</p>
      </div>
    </Link>
  );
}
