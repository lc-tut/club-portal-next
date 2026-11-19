import styles from "./PhotoGrid.module.css";

type Props = {
  photoSrcs: string[];
  clubName: string;
};

export function PhotoGrid({ photoSrcs, clubName }: Props) {
  if (photoSrcs.length === 0) {
    return null;
  }
  return (
    <ul className={styles.grid}>
      {photoSrcs.map((src, index) => (
        <li key={src}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 画像はAPIで再エンコード済みのWebPなので、Next.jsの画像最適化は通さない */}
          <img
            src={src}
            alt={`${clubName}の活動写真${index + 1}`}
            loading="lazy"
            className={styles.photo}
          />
        </li>
      ))}
    </ul>
  );
}
