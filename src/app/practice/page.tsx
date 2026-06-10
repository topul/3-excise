"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStudyStore, questions } from "@/lib/store";
import { categoryMap } from "@/data/categories";
import { QuestionCard } from "@/components/question-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PracticeMode } from "@/lib/types";

export default function PracticePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">加载中...</div>}>
      <PracticePage />
    </Suspense>
  );
}

function PracticePage() {
  const session = useStudyStore((s) => s.session);
  const startSession = useStudyStore((s) => s.startSession);
  const goTo = useStudyStore((s) => s.goTo);
  const clearSession = useStudyStore((s) => s.clearSession);
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");

  if (!session || session.finished) {
    return (
      <PracticeSetup
        defaultCategory={categoryParam}
        onStart={(mode, category) =>
          startSession({ mode: "practice", practiceMode: mode as PracticeMode, category })
        }
      />
    );
  }

  const currentQuestion = questions.find(
    (q) => q.id === session.orderedIds[session.currentIdx]
  );

  if (!currentQuestion) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">刷题模式</h1>
          <p className="text-sm text-slate-500">
            {session.category
              ? categoryMap[session.category]?.name
              : "全部知识域"}{" "}
            · 第 {session.currentIdx + 1}/{session.orderedIds.length} 题
          </p>
        </div>
        <button
          onClick={clearSession}
          className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded border border-slate-200"
        >
          退出
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{
            width: `${((session.currentIdx + 1) / session.orderedIds.length) * 100}%`,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Question card */}
        <QuestionCard question={currentQuestion} />

        {/* Navigation panel */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">题目导航</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 max-h-[400px] overflow-y-auto">
              {session.orderedIds.map((id, idx) => {
                const isActive = idx === session.currentIdx;
                const isAnswered = session.answered[id];
                const q = questions.find((q) => q.id === id);
                const isCorrect =
                  isAnswered && q && session.answers[id] === q.answer;

                return (
                  <button
                    key={id}
                    onClick={() => goTo(idx)}
                    className={cn(
                      "w-full h-9 rounded-md text-xs font-semibold border transition-all",
                      isActive && "ring-2 ring-blue-400",
                      !isAnswered &&
                        !isActive &&
                        "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                      isAnswered &&
                        isCorrect &&
                        "bg-green-50 border-green-300 text-green-700",
                      isAnswered &&
                        !isCorrect &&
                        "bg-red-50 border-red-300 text-red-700"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-100 border border-green-300" />
                正确
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                错误
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-white border border-slate-200" />
                未答
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PracticeSetup({
  defaultCategory,
  onStart,
}: {
  defaultCategory: string | null;
  onStart: (mode: string, category: string | null) => void;
}) {
  const stats = useStudyStore((s) => s.stats);
  const wrongCount = Object.values(stats).filter(
    (s) => s.wrongs > 0 && !s.markedUnderstood
  ).length;

  const modes = [
    {
      id: "sequential",
      label: "顺序刷题",
      desc: "从头到尾按顺序刷",
    },
    { id: "random", label: "随机刷题", desc: "随机打乱顺序" },
    {
      id: "wrong-redo",
      label: "错题重练",
      desc: `只练历史错题 (${wrongCount}题)`,
      disabled: wrongCount === 0,
    },
    {
      id: "memory",
      label: "强化记忆",
      desc: "优先练习薄弱题目",
    },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">选择刷题模式</h1>
      <p className="text-slate-500 mb-8">
        {defaultCategory
          ? `分类：${categoryMap[defaultCategory]?.name || "全部"}`
          : "全部知识域"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            disabled={mode.disabled}
            onClick={() => onStart(mode.id, defaultCategory)}
            className={cn(
              "p-5 rounded-xl border text-left transition-all",
              mode.disabled
                ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
                : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
            )}
          >
            <div className="font-semibold text-slate-800">{mode.label}</div>
            <div className="text-sm text-slate-500 mt-1">{mode.desc}</div>
          </button>
        ))}
      </div>

      {!defaultCategory && (
        <>
          <h2 className="text-lg font-semibold text-slate-800 mt-10 mb-4">
            按知识域刷题
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(categoryMap).map((cat) => (
              <button
                key={cat.id}
                onClick={() => onStart("sequential", cat.id)}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <span className="text-xl">{cat.icon}</span>
                <div className="text-sm font-medium text-slate-700 mt-2">
                  {cat.name}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
