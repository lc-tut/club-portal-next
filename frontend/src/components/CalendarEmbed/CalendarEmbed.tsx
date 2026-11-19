import { calendarEmbedUrl } from "@/lib/links";

import styles from "./CalendarEmbed.module.css";

type Props = {
  calendarId: string;
  clubName: string;
};

// Googleカレンダーの埋め込み(共有カレンダーのIDから固定の書式で作る)
export function CalendarEmbed({ calendarId, clubName }: Props) {
  return (
    <iframe
      src={calendarEmbedUrl(calendarId)}
      title={`${clubName}の活動スケジュール(Googleカレンダー)`}
      loading="lazy"
      // トップレベルへの遷移は許さない(カレンダーの予定はポップアップで開く)
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="strict-origin-when-cross-origin"
      className={styles.frame}
    />
  );
}
