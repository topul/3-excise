"use client";

import { useStudyStore, questions } from "@/lib/store";
import { QuestionCard } from "@/components/question-card";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ExamPage() {
  const session = useStudyStore((s) => s.session);
  const startSession = useStudyStore((s) => s.startSession);
  const finishSession = useStudyStore((s) => s.finishSession);
  const clearSession = useStudyStore((s) => s.clearSession);
  const goTo = useStudyStore((s) => s.goTo);

  if (!session || session.mode !== "exam") {
    return <ExamSetup onStart={(mode) => startSession({ mode: "exam", examMode: mode })} />;
  }

  if (session.finished) {
    return <ExamResult />;
  }

  const currentQuestion = questions.find(
    (q) => q.id === session.orderedIds[session.currentIdx]
  );
  if (!currentQuestion) return null;

  const answeredCount = Object.keys(session.answered).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">模拟考试</h1>
          <p className="text-sm text-slate-500">
            已答 {answeredCount}/{session.orderedIds.length} · 第{" "}
            {session.currentIdx + 1} 题
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={finishSession}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            交卷
          </button>
          <button
            onClick={clearSession}
            className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            放弃
          </button>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{
            width: `${(answeredCount / session.orderedIds.length) * 100}%`,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <QuestionCard question={currentQuestion} />

        <Card className="h-fit">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-700 mb-3">答题卡</p>
            <div className="grid grid-cols-5 gap-2 max-h-[400px] overflow-y-auto">
              {session.orderedIds.map((id, idx) => {
                const isActive = idx === session.currentIdx;
                const isAnswered = session.answered[id];
                return (
                  <button
                    key={id}
                    onClick={() => goTo(idx)}
                    className={cn(
                      "w-full h-9 rounded-md text-xs font-semibold border transition-all",
                      isActive && "ring-2 ring-blue-400",
                      isAnswered && "bg-blue-50 border-blue-300 text-blue-700",
                      !isAnswered && !isActive && "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExamSetup({ onStart }: { onStart: (mode: "sequential" | "random") => void }) {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">模拟考试</h1>
      <p className="text-slate-500 mb-8">全 {questions.length} 题整卷测评，交卷后查看成绩</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onStart("sequential")}
          className="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all text-left"
        >
          <div className="text-xl mb-2">📋</div>
          <div className="font-semibold text-slate-800">顺序考试</div>
          <div className="text-sm text-slate-500 mt-1">按题号顺序作答</div>
        </button>
        <button
          onClick={() => onStart("random")}
          className="p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all text-left"
        >
          <div className="text-xl mb-2">🎲</div>
          <div className="font-semibold text-slate-800">随机考试</div>
          <div className="text-sm text-slate-500 mt-1">随机打乱题目顺序</div>
        </button>
      </div>
    </div>
  );
}

function ExamResult() {
  const session = useStudyStore((s) => s.session);
  const clearSession = useStudyStore((s) => s.clearSession);
  const startSession = useStudyStore((s) => s.startSession);

  if (!session) return null;

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  for (const id of session.orderedIds) {
    if (!session.answered[id]) {
      unanswered++;
    } else {
      const q = questions.find((q) => q.id === id);
      if (q && session.answers[id] === q.answer) correct++;
      else wrong++;
    }
  }

  const total = session.orderedIds.length;
  const score = Math.round((correct / total) * 100);
  const passed = score >= 60;

  return (
    <div className="p-8 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">考试结果</h1>

      <div
        className={cn(
          "w-40 h-40 rounded-full mx-auto flex flex-col items-center justify-center border-4",
          passed
            ? "border-green-500 bg-green-50 text-green-700"
            : "border-red-500 bg-red-50 text-red-700"
        )}
      >
        <span className="text-4xl font-bold">{score}</span>
        <span className="text-sm">分</span>
      </div>

      <p className={cn("mt-4 text-lg font-medium", passed ? "text-green-600" : "text-red-600")}>
        {passed ? "恭喜通过！" : "未通过，继续加油！"}
      </p>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-green-600">{correct}</div>
            <p className="text-xs text-slate-500">正确</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-red-600">{wrong}</div>
            <p className="text-xs text-slate-500">错误</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-slate-400">{unanswered}</div>
            <p className="text-xs text-slate-500">未答</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 justify-center mt-8">
        <button
          onClick={clearSession}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition"
        >
          返回首页
        </button>
        <button
          onClick={() => startSession({ mode: "exam", examMode: "random" })}
          className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition"
        >
          再考一次
        </button>
      </div>
    </div>
  );
}
