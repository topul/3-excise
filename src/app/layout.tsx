import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavSidebar } from "@/components/nav-sidebar";

export const metadata: Metadata = {
  title: "AI训练师高级理论 - 学习系统",
  description: "人工智能训练师高级理论考试学习平台",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI训练师",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        <meta name="theme-color" content="#f8fafc" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', {
                  updateViaCache: 'none'
                }).catch(function() {});
              });
            }
          `
        }} />
      </head>
      <body className="h-full antialiased font-sans">
        <div className="flex h-full">
          <NavSidebar />
          <main className="flex-1 overflow-y-auto bg-slate-50 pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
