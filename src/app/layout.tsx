import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavSidebar } from "@/components/nav-sidebar";

export const metadata: Metadata = {
  title: "AI训练师高级理论 - 学习系统",
  description: "人工智能训练师高级理论考试学习平台",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
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
