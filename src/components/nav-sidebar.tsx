"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "仪表盘", icon: "📊", desc: "进度总览" },
  { href: "/practice", label: "训练", icon: "⚔️", desc: "刷题与挑战" },
  { href: "/exam", label: "考试", icon: "📝", desc: "模拟测验" },
  { href: "/review", label: "复盘", icon: "📕", desc: "错题重练" },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 border-r border-slate-200 bg-white flex-col shrink-0">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-lg font-black text-slate-900">AI训练师</h1>
          <p className="text-xs text-slate-500 mt-1">高级理论 · 200题</p>
        </div>
        <nav className="flex-1 p-3 space-y-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span>
                  <span className="block">{item.label}</span>
                  <span
                    className={cn(
                      "block text-[11px] font-normal",
                      isActive ? "text-slate-300" : "text-slate-400"
                    )}
                  >
                    {item.desc}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-slate-200 p-3">
          <Link
            href="/bookmarks"
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              pathname.startsWith("/bookmarks")
                ? "bg-amber-50 text-amber-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            <span>⭐ 收藏题</span>
            <span>辅助</span>
          </Link>
          <Link
            href="/settings"
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            <span>⚙️ 设置</span>
            <span>配置</span>
          </Link>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg min-w-[3.5rem] transition-colors",
                  isActive
                    ? "text-blue-600"
                    : "text-slate-400"
                )}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
