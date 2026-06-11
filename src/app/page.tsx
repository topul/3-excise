"use client";

import Link from "next/link";
import { useStudyStore, questions } from "@/lib/store";
import { categories, categoryMap } from "@/data/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const stats = useStudyStore((s) => s.stats);
  const session = useStudyStore((s) => s.session);

  const totalQuestions = questions.length;
  const attempted = Object.values(stats).filter((s) => s.attempts > 0).length;
  const totalWrong = Object.values(stats).filter(
    (s) => s.wrongs > 0 && !s.markedUnderstood
  ).length;
  const totalCorrectRate =
    attempted > 0
      ? Math.round(
          (Object.values(stats).filter(
            (s) => s.attempts > 0 && s.lastResult === "correct"
          ).length /
            attempted) *
            100
        )
      : 0;

  const categoryStats = categories.map((cat) => {
    const catQuestions = questions.filter((q) => q.category === cat.id);
    const catAttempted = catQuestions.filter(
      (q) => stats[q.id]?.attempts > 0
    ).length;
    const catCorrect = catQuestions.filter(
      (q) => stats[q.id]?.lastResult === "correct"
    ).length;
    const catWrong = catQuestions.filter(
      (q) => stats[q.id]?.wrongs > 0 && !stats[q.id]?.markedUnderstood
    ).length;
    return {
      ...cat,
      total: catQuestions.length,
      attempted: catAttempted,
      correct: catCorrect,
      wrong: catWrong,
      progress:
        catQuestions.length > 0
          ? Math.round((catAttempted / catQuestions.length) * 100)
          : 0,
      rate: catAttempted > 0 ? Math.round((catCorrect / catAttempted) * 100) : 0,
    };
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">学习仪表盘</h1>
        <p className="text-slate-500 mt-1">
          人工智能训练师高级理论考试 - 200题 / 8大知识域
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card>
          <CardContent className="pt-5 md:pt-6">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{attempted}</div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">已练习题目</p>
            <Progress
              value={(attempted / totalQuestions) * 100}
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 md:pt-6">
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {totalCorrectRate}%
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">最近正确率</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 md:pt-6">
            <div className="text-2xl md:text-3xl font-bold text-red-500">{totalWrong}</div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">待复习错题</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 md:pt-6">
            <div className="text-2xl md:text-3xl font-bold text-slate-700">
              {totalQuestions}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">题库总量</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {session && !session.finished && (
          <Link
            href="/practice"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition"
          >
            继续上次进度
          </Link>
        )}
        <Link
          href="/practice"
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition"
        >
          开始刷题
        </Link>
        <Link
          href="/exam"
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition"
        >
          模拟考试
        </Link>
        {totalWrong > 0 && (
          <Link
            href="/review"
            className="px-5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium text-sm hover:bg-red-100 transition"
          >
            错题重练 ({totalWrong})
          </Link>
        )}
      </div>

      {/* Category grid */}
      <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-4">知识域进度</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {categoryStats.map((cat) => (
          <Link key={cat.id} href={`/practice?category=${cat.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{cat.icon}</span>
                  {cat.wrong > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      {cat.wrong}错
                    </span>
                  )}
                </div>
                <CardTitle className="text-sm font-semibold mt-2">
                  {cat.name}
                </CardTitle>
                <p className="text-xs text-slate-400">{cat.total}题</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>
                    已练 {cat.attempted}/{cat.total}
                  </span>
                  <span>进度 {cat.progress}%</span>
                </div>
                <Progress
                  value={(cat.attempted / cat.total) * 100}
                  className="h-2"
                />
                {cat.attempted > 0 && (
                  <p className="mt-2 text-xs text-slate-400">
                    正确率 {cat.rate}%
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
