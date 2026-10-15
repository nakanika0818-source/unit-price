import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "単価比較アプリ",
  description:
    "価格と数量が違う2つの商品を、同じ単位あたりの価格で比較するアプリです。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
