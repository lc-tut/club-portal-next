import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>ページが見つかりません</h1>
      <p className={styles.lead}>
        URLが間違っているか、サークルが公開されていない可能性があります。
      </p>
      <Link href="/" className={styles.back}>
        サークル一覧へ戻る
      </Link>
    </main>
  );
}
