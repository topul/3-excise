"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "仪表盘", icon: "📊" },
  { href: "/practice", label: "刷题", icon: "✏️" },
  { href: "/exam", label: "模拟考试", icon: "📝" },
  { href: "/review", label: "错题本", icon: "📕" },
  { href: "/stats", label: "学习统计", icon: "📈" },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-800">AI训练师</h1>
        <p className="text-xs text-slate-500 mt-1">高级理论考试学习系统</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
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
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">200题 / 8大知识域</p>
      </div>
    </aside>
  );
}
