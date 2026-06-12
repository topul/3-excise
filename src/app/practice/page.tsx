"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStudyStore, questions } from "@/lib/store";
import { categoryMap } from "@/data/categories";
import { QuestionCard } from "@/components/question-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PracticeMode } from "@/lib/types";

const PASS_SCORE = 60;
const BATTLE_GRACE_QUESTIONS = 10;
const BATTLE_FAIL_STREAK = 3;

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
  const [navOpen, setNavOpen] = useState(false);

  const categoryParam = searchParams.get("category");

  if (!session || session.finished) {
    return (
      <PracticeSetup
        defaultCategory={categoryParam}
        onStart={(mode, category, shuffleOptions) =>
          startSession({
            mode: "practice",
            practiceMode: mode as PracticeMode,
            category,
            shuffleOptions,
          })
        }
      />
    );
  }

  const currentQuestion = questions.find(
    (q) => q.id === session.orderedIds[session.currentIdx]
  );
  const answeredCount = Object.keys(session.answered).length;
  const wrongCount = session.orderedIds.filter((id) => {
    const q = questions.find((item) => item.id === id);
    return session.answered[id] && q && session.answers[id] !== q.answer;
  }).length;
  const correctCount = answeredCount - wrongCount;
  const scorePercent =
    answeredCount === 0 ? 100 : Math.round((correctCount / answeredCount) * 100);
  const isBattle = session.practiceMode === "battle";
  const battleLowScoreStreak = session.battleLowScoreStreak || 0;
  const battleFailed = isBattle && battleLowScoreStreak >= BATTLE_FAIL_STREAK;
  const battleComplete =
    isBattle &&
    answeredCount === session.orderedIds.length &&
    session.orderedIds.length > 0;
  const battleWon = battleComplete && scorePercent >= PASS_SCORE;
  const encouragement =
    answeredCount === 0
      ? "先稳住节奏，一题一题来。"
      : wrongCount === 0
      ? "目前还没有错题，状态很好，继续保持。"
      : wrongCount <= Math.max(1, Math.floor(answeredCount * 0.25))
      ? "错题不多，把原因看明白就很赚。"
      : "错题正在暴露薄弱点，复盘完会进步很快。";

  if (!currentQuestion) return null;

  if (isBattle) {
    return (
      <BattlePractice
        session={session}
        currentQuestion={currentQuestion}
        answeredCount={answeredCount}
        correctCount={correctCount}
        wrongCount={wrongCount}
        scorePercent={scorePercent}
        battleFailed={battleFailed}
        battleWon={battleWon}
        battleComplete={battleComplete}
        goTo={goTo}
        clearSession={clearSession}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-lg font-semibold text-slate-800">刷题模式</h1>
          <p className="text-xs md:text-sm text-slate-500 truncate">
            {session.category
              ? categoryMap[session.category]?.name
              : "全部知识域"}{" "}
            · 已答 {answeredCount}/{session.orderedIds.length} 题 · 错{" "}
            {wrongCount} 题
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setNavOpen(true)}
            className="lg:hidden text-sm text-slate-600 px-3 py-1.5 rounded border border-slate-200 bg-white"
          >
            答题卡
          </button>
          <button
            onClick={clearSession}
            className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded border border-slate-200"
          >
            退出
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full mb-4 md:mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{
            width: `${(answeredCount / session.orderedIds.length) * 100}%`,
          }}
        />
      </div>

      <div className="mb-4 md:mb-6 grid grid-cols-3 gap-2 md:gap-3">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] text-slate-500">已答</p>
          <p className="text-base font-semibold text-slate-800">
            {answeredCount}
          </p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <p className="text-[11px] text-green-600">答对</p>
          <p className="text-base font-semibold text-green-700">
            {correctCount}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-[11px] text-red-600">错题</p>
          <p className="text-base font-semibold text-red-700">{wrongCount}</p>
        </div>
      </div>

      <p className="mb-4 md:mb-6 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
        {encouragement}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Question card */}
        <QuestionCard question={currentQuestion} />

        {/* Navigation panel - desktop */}
        <Card className="h-fit hidden lg:block">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">题目导航</CardTitle>
          </CardHeader>
          <CardContent>
            <NavGrid session={session} goTo={goTo} />
          </CardContent>
        </Card>
      </div>

      {/* Mobile navigation drawer */}
      {navOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setNavOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">题目导航</h3>
              <button
                onClick={() => setNavOpen(false)}
                className="text-slate-400 text-xl px-2"
              >
                ✕
              </button>
            </div>
            <NavGrid
              session={session}
              goTo={(idx) => {
                goTo(idx);
                setNavOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NavGrid({
  session,
  goTo,
}: {
  session: NonNullable<ReturnType<typeof useStudyStore.getState>["session"]>;
  goTo: (idx: number) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-8 lg:grid-cols-5 gap-2 max-h-[400px] overflow-y-auto">
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
      <div className="mt-4 flex gap-3 text-xs text-slate-500 flex-wrap">
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
    </>
  );
}

function PracticeSetup({
  defaultCategory,
  onStart,
}: {
  defaultCategory: string | null;
  onStart: (
    mode: string,
    category: string | null,
    shuffleOptions: boolean
  ) => void;
}) {
  const stats = useStudyStore((s) => s.stats);
  const wrongCount = Object.values(stats).filter(
    (s) => s.wrongs > 0 && !s.markedUnderstood
  ).length;
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryModes = [
    {
      id: "battle",
      label: "Boss 挑战",
      desc: "守住 60 分及格线，完成整轮挑战",
    },
    { id: "random", label: "随机刷题", desc: "随机抽题，适合快速开始" },
    {
      id: "wrong-redo",
      label: "错题重练",
      desc: `只练历史错题 (${wrongCount}题)`,
      disabled: wrongCount === 0,
    },
  ];

  const moreModes = [
    {
      id: "sequential",
      label: "顺序刷题",
      desc: "从头到尾按顺序刷",
    },
    {
      id: "memory",
      label: "强化记忆",
      desc: "优先练习薄弱题目",
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">选择刷题模式</h1>
      <p className="text-sm md:text-base text-slate-500 mb-6 md:mb-8">
        {defaultCategory
          ? `分类：${categoryMap[defaultCategory]?.name || "全部"}`
          : "全部知识域"}
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {primaryModes.map((mode) => (
          <PracticeModeButton
            key={mode.id}
            mode={mode}
            onStart={() => onStart(mode.id, defaultCategory, shuffleOptions)}
            featured={mode.id === "battle"}
          />
        ))}
      </div>

      <label className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={shuffleOptions}
          onChange={(e) => setShuffleOptions(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <div>
          <p className="text-sm font-medium text-slate-800">打乱选项顺序</p>
          <p className="text-xs text-slate-500">
            仅打乱单选/多选题选项，同一场刷题内顺序保持不变
          </p>
        </div>
      </label>

      <button
        onClick={() => setMoreOpen((open) => !open)}
        className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700"
      >
        <span>更多训练方式</span>
        <span className="text-slate-400">{moreOpen ? "收起" : "展开"}</span>
      </button>

      {moreOpen && (
        <div className="mt-4 space-y-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              训练模式
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {moreModes.map((mode) => (
                <PracticeModeButton
                  key={mode.id}
                  mode={mode}
                  onStart={() =>
                    onStart(mode.id, defaultCategory, shuffleOptions)
                  }
                />
              ))}
            </div>
          </div>

          {!defaultCategory && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                按知识域刷题
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Object.values(categoryMap).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      onStart("sequential", cat.id, shuffleOptions)
                    }
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <div className="mt-2 text-sm font-medium text-slate-700">
                      {cat.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PracticeModeButton({
  mode,
  onStart,
  featured = false,
}: {
  mode: {
    id: string;
    label: string;
    desc: string;
    disabled?: boolean;
  };
  onStart: () => void;
  featured?: boolean;
}) {
  return (
    <button
      disabled={mode.disabled}
      onClick={onStart}
      className={cn(
        "rounded-xl border p-4 text-left transition-all",
        mode.disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50"
          : featured
          ? "cursor-pointer border-amber-300 bg-gradient-to-br from-slate-950 to-red-950 text-white shadow-lg shadow-red-950/20 hover:border-amber-200"
          : "cursor-pointer border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
      )}
    >
      <div className={cn("font-semibold", featured ? "text-white" : "text-slate-800")}>
        {mode.label}
      </div>
      <div className={cn("mt-1 text-sm", featured ? "text-amber-100/80" : "text-slate-500")}>
        {mode.desc}
      </div>
    </button>
  );
}

function BattlePractice({
  session,
  currentQuestion,
  answeredCount,
  correctCount,
  wrongCount,
  scorePercent,
  battleFailed,
  battleWon,
  battleComplete,
  goTo,
  clearSession,
  navOpen,
  setNavOpen,
}: {
  session: NonNullable<ReturnType<typeof useStudyStore.getState>["session"]>;
  currentQuestion: (typeof questions)[number];
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  scorePercent: number;
  battleFailed: boolean;
  battleWon: boolean;
  battleComplete: boolean;
  goTo: (idx: number) => void;
  clearSession: () => void;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
}) {
  const total = session.orderedIds.length;
  const bossHp = total === 0 ? 0 : Math.max(0, Math.round(((total - answeredCount) / total) * 100));
  const scoreColor =
    scorePercent >= 80
      ? "from-emerald-300 to-lime-400"
      : scorePercent >= PASS_SCORE
      ? "from-amber-300 to-orange-400"
      : "from-red-500 to-rose-600";
  const danger =
    answeredCount >= BATTLE_GRACE_QUESTIONS && scorePercent < PASS_SCORE;
  const resultVisible = battleFailed || battleWon || battleComplete;
  const resultTitle = battleWon
    ? "挑战成功"
    : battleFailed
    ? "挑战失败"
    : "挑战结束";
  const resultDesc = battleWon
    ? "最终分数守住了 60 分及格线。"
    : battleFailed
    ? "当前正确率连续低于 60 分，Boss 挑战终止。"
    : "本轮题目已完成，但最终分数未达到 60 分。";

  return (
    <div className="relative min-h-[calc(100vh-1rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,#7f1d1d_0,#111827_36%,#020617_78%)] px-3 py-4 text-white md:px-6 md:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),transparent_28%,rgba(239,68,68,0.12)_67%,transparent)]" />
      <div className="pointer-events-none absolute -right-20 top-20 h-60 w-60 rounded-full bg-red-500/20 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.35em] text-amber-200/80">
              Boss Challenge
            </p>
            <h1 className="truncate text-lg font-black text-white md:text-2xl">
              守住 60 分，击退知识 Boss
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setNavOpen(true)}
              className="rounded-full border border-amber-200/30 bg-white/10 px-3 py-1.5 text-sm text-amber-50 backdrop-blur lg:hidden"
            >
              题卡
            </button>
            <button
              onClick={clearSession}
              className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm text-slate-200 backdrop-blur hover:bg-white/15"
            >
              退出
            </button>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <BattleBar
            label="玩家分数"
            value={scorePercent}
            valueText={`${scorePercent}`}
            marker={PASS_SCORE}
            gradient={scoreColor}
            helper={
              answeredCount < BATTLE_GRACE_QUESTIONS
                ? `前 ${BATTLE_GRACE_QUESTIONS} 题为稳定期，暂不判失败`
                : danger
                ? `危险：低于 60 分 ${session.battleLowScoreStreak || 0}/${BATTLE_FAIL_STREAK}`
                : "安全：保持在及格线以上"
            }
          />
          <BattleBar
            label="Boss 剩余血量"
            value={bossHp}
            valueText={`${bossHp}%`}
            gradient="from-red-500 to-orange-400"
            helper={`已推进 ${answeredCount}/${total} 题，答对 ${correctCount}，错 ${wrongCount}`}
          />
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center md:hidden">
          <BattleMiniStat label="已答" value={`${answeredCount}/${total}`} />
          <BattleMiniStat label="正确" value={String(correctCount)} />
          <BattleMiniStat label="错题" value={String(wrongCount)} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className={cn(resultVisible && "pointer-events-none opacity-70")}>
            <QuestionCard question={currentQuestion} variant="battle" />
          </div>

          <Card className="hidden h-fit border-white/10 bg-white/10 text-white backdrop-blur lg:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">战斗路线</CardTitle>
            </CardHeader>
            <CardContent>
              <NavGrid session={session} goTo={goTo} />
            </CardContent>
          </Card>
        </div>

        {navOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 lg:hidden"
            onClick={() => setNavOpen(false)}
          >
            <div
              className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-slate-950 p-4 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">战斗路线</h3>
                <button
                  onClick={() => setNavOpen(false)}
                  className="px-2 text-xl text-slate-400"
                >
                  x
                </button>
              </div>
              <NavGrid
                session={session}
                goTo={(idx) => {
                  goTo(idx);
                  setNavOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {resultVisible && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-amber-200/25 bg-slate-950 p-6 text-center shadow-2xl shadow-red-950/50">
              <p className="text-[11px] uppercase tracking-[0.35em] text-amber-300">
                Battle Result
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                {resultTitle}
              </h2>
              <p className="mt-3 text-sm text-slate-300">{resultDesc}</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <BattleMiniStat label="分数" value={String(scorePercent)} />
                <BattleMiniStat label="答对" value={String(correctCount)} />
                <BattleMiniStat label="错题" value={String(wrongCount)} />
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={clearSession}
                  className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300"
                >
                  重新选择挑战
                </button>
                <button
                  onClick={() => setNavOpen(true)}
                  className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  查看题目
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BattleBar({
  label,
  value,
  valueText,
  gradient,
  helper,
  marker,
}: {
  label: string;
  value: number;
  valueText: string;
  gradient: string;
  helper: string;
  marker?: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 shadow-lg shadow-black/20 backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-100">{label}</span>
        <span className="font-black tabular-nums text-white">{valueText}</span>
      </div>
      <div className="relative h-4 overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10">
        {typeof marker === "number" && (
          <span
            className="absolute top-0 z-10 h-full w-0.5 bg-white/80"
            style={{ left: `${marker}%` }}
          />
        )}
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", gradient)}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-300">
        <span>{helper}</span>
        {typeof marker === "number" && (
          <span className="shrink-0 text-amber-200">及格线 {marker}</span>
        )}
      </div>
    </div>
  );
}

function BattleMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">
      <p className="text-[11px] text-slate-300">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}
