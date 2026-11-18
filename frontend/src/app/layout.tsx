import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ClubPortal",
  description: "東京工科大学のサークル一覧",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
