import Link from "next/link";

import styles from "./SiteHeader.module.css";

// ログイン状態による表示の違い(ログイン中、admin)はP2とP4で足す
export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          ClubPortal
        </Link>
        {/* IdPへのリダイレクトなので、Next.jsのLinkではなく通常のリンクにする */}
        <a href="/api/auth/login" className={styles.login}>
          編集者ログイン
        </a>
      </div>
    </header>
  );
}
