import "@fontsource-variable/noto-sans-jp";
import "./globals.css";

import type { Metadata } from "next";

import { SiteHeader } from "@/components/SiteHeader/SiteHeader";

export const metadata: Metadata = {
  title: { template: "%s - ClubPortal", default: "ClubPortal" },
  description: "東京工科大学のサークル一覧",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
