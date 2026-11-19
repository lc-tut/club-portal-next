import type { ReactNode } from "react";

import styles from "./ClubHero.module.css";

type Props = {
  name: string;
  iconSrc: string;
  /** 名前の下に並べる外部リンク */
  links?: ReactNode;
};

// 上部のカバー(アイコンを横幅いっぱいに拡大してぼかしたもの)と、アイコン、名前
export function ClubHero({ name, iconSrc, links }: Props) {
  return (
    <div className={styles.hero}>
      <div className={styles.cover} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- カバーは飾りなので読み上げない */}
        <img src={iconSrc} alt="" className={styles.coverImage} />
      </div>
      <div className={styles.inner}>
        {/* すぐ隣に名前(h1)があるので、アイコンは読み上げない */}
        {/* eslint-disable-next-line @next/next/no-img-element -- 画像はAPIで再エンコード済みのWebPなので、Next.jsの画像最適化は通さない */}
        <img
          src={iconSrc}
          alt=""
          width={128}
          height={128}
          className={styles.icon}
        />
        <div className={styles.titleBlock}>
          <h1 className={styles.name}>{name}</h1>
          {links}
        </div>
      </div>
    </div>
  );
}
