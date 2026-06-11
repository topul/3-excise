"use client";

import { useState } from "react";
import Link from "next/link";
import { useStudyStore, questions } from "@/lib/store";
import { categoryMap } from "@/data/categories";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AiExplain } from "@/components/ai-explain";
import { cn } from "@/lib/utils";

export default function BookmarksPage() {
  const stats = useStudyStore((s) => s.stats);
  const toggleBookmark = useStudyStore((s) => s.toggleBookmark);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const bookmarkedQuestions = questions.filter((q) => stats[q.id]?.bookmarked);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            收藏题目
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {bookmarkedQuestions.length} 道收藏题
          </p>
        </div>
        <Link
          href="/practice"
          className="shrink-0 px-3 md:px-5 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition"
        >
          去刷题
        </Link>
      </div>

      {bookmarkedQuestions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-4xl mb-4">☆</p>
            <p className="text-lg font-medium text-slate-700">
              还没有收藏题目
            </p>
            <p className="text-sm text-slate-500 mt-2">
              刷题时点击题号旁边的星标，题目会出现在这里
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookmarkedQuestions.map((q) => {
            const stat = stats[q.id];
            const cat = categoryMap[q.category];
            const isExpanded = expandedId === q.id;

            return (
              <Card
                key={q.id}
                className={cn(
                  "transition-shadow",
                  isExpanded && "shadow-md ring-1 ring-blue-100"
                )}
              >
                <CardContent className="p-4">
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-amber-100 text-amber-700"
                        >
                          已收藏
                        </Badge>
                        {cat && (
                          <Badge variant="outline" className="text-xs">
                            {cat.icon} {cat.name}
                          </Badge>
                        )}
                        <span className="text-xs text-slate-400">
                          Q{q.id} ·{" "}
                          {q.type === "tf"
                            ? "判断"
                            : q.type === "single"
                            ? "单选"
                            : "多选"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed line-clamp-2">
                        {q.text}
                      </p>
                    </div>
                    <span className="text-slate-400 text-lg shrink-0">
                      {isExpanded ? "▾" : "▸"}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="mb-3">
                        <span className="text-xs font-medium text-slate-500">
                          正确答案：
                        </span>
                        <span className="text-sm font-bold text-green-600 ml-1">
                          {q.answer}
                        </span>
                      </div>
                      {q.options.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {q.options.map((opt) => (
                            <div
                              key={opt.label}
                              className={cn(
                                "text-sm px-3 py-1.5 rounded",
                                q.answer.includes(opt.label)
                                  ? "bg-green-50 text-green-700 font-medium"
                                  : "text-slate-600"
                              )}
                            >
                              {opt.label}. {opt.text}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>
                          练过 {stat?.attempts ?? 0} 次 · 对{" "}
                          {stat?.corrects ?? 0} 次 · 错 {stat?.wrongs ?? 0} 次
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(q.id);
                            if (expandedId === q.id) setExpandedId(null);
                          }}
                          className="ml-auto px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-medium hover:bg-amber-100 transition"
                        >
                          取消收藏
                        </button>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <AiExplain question={q} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
