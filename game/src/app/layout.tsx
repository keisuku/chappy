import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/lib/game-context";

export const metadata: Metadata = {
  title: "Cryptarena — AI Trading Battle",
  description: "Algorithmic bots compete using crypto futures market strategies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
