"use client";

import { useState } from "react";
import { useStudyStore, questions } from "@/lib/store";
import { categories, categoryMap } from "@/data/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AiExplain } from "@/components/ai-explain";
import { cn } from "@/lib/utils";

export default function ReviewPage() {
  const stats = useStudyStore((s) => s.stats);
  const markUnderstood = useStudyStore((s) => s.markUnderstood);
  const startSession = useStudyStore((s) => s.startSession);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const wrongQuestions = questions.filter((q) => {
    const s = stats[q.id];
    if (!s || s.wrongs === 0 || s.markedUnderstood) return false;
    if (filter !== "all" && q.category !== filter) return false;
    return true;
  });

  const sortedWrong = [...wrongQuestions].sort((a, b) => {
    const sa = stats[a.id]!;
    const sb = stats[b.id]!;
    return sb.wrongs - sa.wrongs;
  });

  const categoryCounts = categories
    .map((cat) => ({
      ...cat,
      count: questions.filter(
        (q) =>
          q.category === cat.id &&
          stats[q.id]?.wrongs > 0 &&
          !stats[q.id]?.markedUnderstood
      ).length,
    }))
    .filter((c) => c.count > 0);

  const totalWrong = questions.filter(
    (q) => stats[q.id]?.wrongs > 0 && !stats[q.id]?.markedUnderstood
  ).length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">错题本</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {totalWrong} 道错题待复习
          </p>
        </div>
        {totalWrong > 0 && (
          <button
            onClick={() =>
              startSession({ mode: "practice", practiceMode: "wrong-redo" })
            }
            className="shrink-0 px-3 md:px-5 py-2 md:py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition"
          >
            错题重练
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition",
            filter === "all"
              ? "bg-blue-100 text-blue-700"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          全部 ({totalWrong})
        </button>
        {categoryCounts.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition",
              filter === cat.id
                ? "bg-blue-100 text-blue-700"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {cat.icon} {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* Wrong questions list */}
      {sortedWrong.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-lg font-medium text-slate-700">
              {totalWrong === 0 ? "还没有错题记录" : "当前分类没有错题"}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {totalWrong === 0
                ? "先去做题吧，做错的题目会出现在这里"
                : "换一个分类看看"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedWrong.map((q) => {
            const s = stats[q.id]!;
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
                    onClick={() =>
                      setExpandedId(isExpanded ? null : q.id)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-red-100 text-red-600"
                        >
                          错{s.wrongs}次
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
                      <div className="bg-slate-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-slate-600">
                          {q.explanation}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>
                          练过 {s.attempts} 次 · 对 {s.corrects} 次 · 错{" "}
                          {s.wrongs} 次
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markUnderstood(q.id);
                          }}
                          className="ml-auto px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-100 transition"
                        >
                          ✓ 已理解，移出错题池
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
