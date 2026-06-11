"use client";

import { useStudyStore, questions } from "@/lib/store";
import { categories, categoryMap } from "@/data/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function StatsPage() {
  const stats = useStudyStore((s) => s.stats);
  const sessions = useStudyStore((s) => s.sessions);
  const resetProgress = useStudyStore((s) => s.resetProgress);

  const totalAttempted = Object.values(stats).filter(
    (s) => s.attempts > 0
  ).length;
  const totalCorrect = Object.values(stats).filter(
    (s) => s.lastResult === "correct"
  ).length;
  const totalWrong = Object.values(stats).filter(
    (s) => s.wrongs > 0 && !s.markedUnderstood
  ).length;
  const totalAttempts = Object.values(stats).reduce(
    (sum, s) => sum + s.attempts,
    0
  );

  const categoryStats = categories.map((cat) => {
    const catQ = questions.filter((q) => q.category === cat.id);
    const catStats = catQ
      .map((q) => stats[q.id])
      .filter(Boolean);
    const attempted = catStats.filter((s) => s.attempts > 0).length;
    const correct = catStats.filter((s) => s.lastResult === "correct").length;
    const wrong = catStats.filter(
      (s) => s.wrongs > 0 && !s.markedUnderstood
    ).length;
    const progress = catQ.length > 0 ? Math.round((attempted / catQ.length) * 100) : 0;
    const rate = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return { ...cat, total: catQ.length, attempted, correct, wrong, progress, rate };
  });

  const weakCategories = [...categoryStats]
    .filter((c) => c.attempted > 0)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3);

  const recentSessions = [...sessions].reverse().slice(0, 7);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 md:mb-8 gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">学习统计</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            总答题 {totalAttempts} 次 · 覆盖 {totalAttempted}/{questions.length}{" "}
            题
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm("确定要重置所有学习进度吗？此操作不可恢复。")) {
              resetProgress();
            }
          }}
          className="shrink-0 px-3 md:px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition"
        >
          重置进度
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card>
          <CardContent className="pt-5 md:pt-6">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">
              {totalAttempted}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">已练习题目</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 md:pt-6">
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {totalAttempted > 0
                ? Math.round((totalCorrect / totalAttempted) * 100)
                : 0}
              %
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">正确率</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 md:pt-6">
            <div className="text-2xl md:text-3xl font-bold text-amber-600">
              {totalAttempts}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">总答题次数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 md:pt-6">
            <div className="text-2xl md:text-3xl font-bold text-red-500">{totalWrong}</div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">待复习错题</p>
          </CardContent>
        </Card>
      </div>

      {/* Category performance */}
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        分类掌握度
      </h2>
      <div className="grid grid-cols-1 gap-3 mb-8">
        {categoryStats.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="py-4 px-5">
              <div className="flex items-center gap-4">
                <span className="text-xl">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {cat.name}
                    </span>
                    <span className="text-sm text-slate-500">
                      {cat.attempted}/{cat.total} 题 · 进度 {cat.progress}%
                    </span>
                  </div>
                  <Progress value={cat.progress} className="h-2" />
                  {cat.attempted > 0 && (
                    <p className="mt-2 text-xs text-slate-400">正确率 {cat.rate}%</p>
                  )}
                </div>
                {cat.wrong > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium shrink-0">
                    {cat.wrong}错
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weak spots */}
      {weakCategories.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            薄弱知识点
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {weakCategories.map((cat, i) => (
              <Card key={cat.id} className="border-amber-200 bg-amber-50/50">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-semibold text-amber-800">
                      {cat.name}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    {cat.rate}%
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    正确率偏低，建议重点复习
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Recent activity */}
      {recentSessions.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            最近学习记录
          </h2>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-3 font-medium text-slate-500">
                      日期
                    </th>
                    <th className="text-right p-3 font-medium text-slate-500">
                      答题数
                    </th>
                    <th className="text-right p-3 font-medium text-slate-500">
                      正确数
                    </th>
                    <th className="text-right p-3 font-medium text-slate-500">
                      正确率
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((s) => (
                    <tr key={s.date} className="border-b border-slate-50">
                      <td className="p-3 text-slate-700">{s.date}</td>
                      <td className="p-3 text-right text-slate-700">
                        {s.questionsAnswered}
                      </td>
                      <td className="p-3 text-right text-green-600">
                        {s.correctCount}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {s.questionsAnswered > 0
                          ? Math.round(
                              (s.correctCount / s.questionsAnswered) * 100
                            )
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
