import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoinBattle Saki — AI Trading Battle",
  description: "AI trading robots battle using real market strategies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
