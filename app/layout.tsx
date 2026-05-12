import type { Metadata } from "next";
import "./globals.css";
import { MysticBackground } from "@/components/MysticBackground";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { FeedbackWidget } from "@/components/FeedbackWidget";

export const metadata: Metadata = {
  title: "命运之镜 · Mirror of Fate",
  description: "融合东西方智慧的塔罗占卜 · Tarot divination blending Eastern and Western wisdom",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col relative">
        <MysticBackground />
        <Header />
        <main className="relative z-10 flex-1 flex flex-col">
          <AuthGuard>{children}</AuthGuard>
        </main>
        <FeedbackWidget />
      </body>
    </html>
  );
}
