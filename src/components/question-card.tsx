"use client";

import { useStudyStore } from "@/lib/store";
import { categoryMap } from "@/data/categories";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AiExplain } from "@/components/ai-explain";
import { cn } from "@/lib/utils";
import type { Question, QuestionOption, QuestionStat } from "@/lib/types";

const typeLabels = {
  tf: "判断题",
  single: "单选题",
  multi: "多选题",
};

const typeColors = {
  tf: "bg-blue-100 text-blue-700",
  single: "bg-amber-100 text-amber-700",
  multi: "bg-purple-100 text-purple-700",
};

const battleTypeColors = {
  tf: "border-cyan-300/40 bg-cyan-300/12 text-cyan-100",
  single: "border-amber-300/40 bg-amber-300/12 text-amber-100",
  multi: "border-red-300/40 bg-red-300/12 text-red-100",
};

const emptyStat: QuestionStat = {
  attempts: 0,
  corrects: 0,
  wrongs: 0,
  streakCorrect: 0,
  lastResult: "",
  lastWrongAt: 0,
  lastSeenAt: 0,
  markedUnderstood: false,
  bookmarked: false,
};

interface DisplayOption extends QuestionOption {
  originalLabel: string;
  displayLabel: string;
}

function buildDisplayOptions(
  question: Question,
  optionOrder: number[] | undefined
): DisplayOption[] {
  const orderedOptions =
    optionOrder && optionOrder.length === question.options.length
      ? optionOrder.map((index) => question.options[index])
      : question.options;

  return orderedOptions.map((option, index) => ({
    ...option,
    originalLabel: option.label,
    displayLabel: question.options[index]?.label ?? option.label,
  }));
}

function getDisplayAnswer(
  answer: string,
  displayOptions: DisplayOption[]
): string {
  return answer
    .split("")
    .map((label) => {
      const option = displayOptions.find((opt) => opt.originalLabel === label);
      return option?.displayLabel ?? label;
    })
    .sort()
    .join("");
}

function getDisplayAnswerDetails(displayAnswer: string, displayOptions: DisplayOption[]) {
  return displayAnswer
    .split("")
    .map((label) => {
      const option = displayOptions.find((opt) => opt.displayLabel === label);
      return option ? `${label}. ${option.text}` : label;
    });
}

function buildDisplayedQuestion(
  question: Question,
  displayOptions: DisplayOption[],
  displayAnswer: string
): Question {
  if (question.type === "tf") return question;

  return {
    ...question,
    options: displayOptions.map((opt) => ({
      label: opt.displayLabel,
      text: opt.text,
    })),
    answer: displayAnswer,
  };
}

export function QuestionCard({
  question,
  variant = "default",
}: {
  question: Question;
  variant?: "default" | "battle";
}) {
  const session = useStudyStore((s) => s.session);
  const selectAnswer = useStudyStore((s) => s.selectAnswer);
  const submitMulti = useStudyStore((s) => s.submitMulti);
  const goNext = useStudyStore((s) => s.goNext);
  const goPrev = useStudyStore((s) => s.goPrev);
  const toggleBookmark = useStudyStore((s) => s.toggleBookmark);
  const stat = useStudyStore((s) => s.stats[question.id] || emptyStat);

  if (!session) return null;

  const answered = session.answered[question.id];
  const userAnswer = session.answers[question.id] || "";
  const isCorrect = answered && userAnswer === question.answer;
  const cat = categoryMap[question.category];
  const optionOrder = session.optionOrders?.[question.id];
  const displayOptions = buildDisplayOptions(question, optionOrder);
  const displayAnswer = getDisplayAnswer(question.answer, displayOptions);
  const displayAnswerDetails = getDisplayAnswerDetails(
    displayAnswer,
    displayOptions
  );
  const displayedQuestion = buildDisplayedQuestion(
    question,
    displayOptions,
    displayAnswer
  );
  const aiCacheKey =
    optionOrder && optionOrder.length > 0
      ? `${question.id}:${optionOrder.join(",")}`
      : question.id;

  const isBattle = variant === "battle";

  return (
    <Card
      className={cn(
        "shadow-sm",
        isBattle &&
          "border-amber-300/40 bg-slate-950/82 text-white shadow-2xl shadow-red-950/30 backdrop-blur"
      )}
    >
      <CardContent className="p-4 md:p-6">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3 md:mb-4 flex-wrap">
          <Badge
            variant="secondary"
            className={isBattle ? battleTypeColors[question.type] : typeColors[question.type]}
          >
            {typeLabels[question.type]}
          </Badge>
          {cat && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isBattle && "border-white/15 bg-white/5 text-slate-200"
              )}
            >
              {cat.icon} {cat.name}
            </Badge>
          )}
          <span className={cn("text-xs ml-auto", isBattle ? "text-amber-200/70" : "text-slate-400")}>
            Q{question.id}
          </span>
          <button
            onClick={() => toggleBookmark(question.id)}
            className="text-lg hover:scale-110 transition-transform"
            title={stat.bookmarked ? "取消收藏" : "收藏"}
          >
            {stat.bookmarked ? "⭐" : "☆"}
          </button>
        </div>
        {stat.attempts > 0 && (
          <div
            className={cn(
              "text-xs mb-2 md:mb-3",
              isBattle ? "text-slate-300" : "text-slate-400"
            )}
          >
            练过{stat.attempts}次 · 错{stat.wrongs}次
          </div>
        )}

        {/* Question text */}
        <p
          className={cn(
            "text-base md:text-lg font-medium leading-relaxed mb-5 md:mb-6",
            isBattle ? "text-slate-50" : "text-slate-900"
          )}
        >
          {question.text}
        </p>

        {/* Options */}
        {question.type === "tf" ? (
          <TrueFalseOptions
            question={question}
            userAnswer={userAnswer}
            answered={answered}
            onSelect={(ans) => selectAnswer(question.id, ans)}
            variant={variant}
          />
        ) : (
          <ChoiceOptions
            question={question}
            options={displayOptions}
            userAnswer={userAnswer}
            answered={answered}
            onSelect={(ans) => selectAnswer(question.id, ans)}
            variant={variant}
          />
        )}

        {/* Multi submit */}
        {question.type === "multi" && !answered && userAnswer.length > 0 && (
          <button
            onClick={() => submitMulti(question.id)}
            className={cn(
              "mt-4 px-5 py-2.5 text-white font-medium text-sm transition",
              isBattle
                ? "battle-cursor rounded-none border border-amber-300 bg-amber-500/20 uppercase tracking-[0.18em] text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.24)] hover:bg-amber-400/30"
                : "rounded-lg bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isBattle ? "锁定攻击" : "提交答案"}
          </button>
        )}

        {/* Feedback */}
        {answered && (
          <div
            className={cn(
              "mt-6 p-4 rounded-xl border",
              isCorrect
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{isCorrect ? "✅" : "❌"}</span>
              <span
                className={cn(
                  "font-semibold text-sm",
                  isCorrect ? "text-green-700" : "text-red-700"
                )}
              >
                {isBattle
                  ? isCorrect
                    ? "命中 Boss，造成有效伤害"
                    : "攻击偏移，受到反击"
                  : isCorrect
                  ? "回答正确！"
                  : "回答错误"}
              </span>
            </div>
            {(!isBattle || !isCorrect) && (
              <div
                className={cn(
                  "text-sm mb-2",
                  isCorrect ? "text-green-700" : "text-red-700"
                )}
              >
                正确答案：
                <span className="font-bold">{displayAnswer}</span>
                {!isBattle && displayAnswerDetails.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {displayAnswerDetails.map((detail) => (
                      <div key={detail}>{detail}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI explanation (only after answered) */}
        {answered && (
          <AiExplain
            key={aiCacheKey}
            question={displayedQuestion}
            cacheKey={aiCacheKey}
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={goPrev}
            disabled={session.currentIdx === 0}
            className={cn(
              "px-4 py-2 text-sm font-medium border transition disabled:opacity-40 disabled:cursor-not-allowed",
              isBattle
                ? "battle-cursor rounded-none border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                : "rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            上一题
          </button>
          <span className="text-sm text-slate-400">
            {session.currentIdx + 1} / {session.orderedIds.length}
          </span>
          <button
            onClick={goNext}
            disabled={session.currentIdx === session.orderedIds.length - 1}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed",
              isBattle
                ? "battle-cursor rounded-none border border-cyan-300/50 bg-cyan-400/20 text-cyan-50 hover:bg-cyan-300/30"
                : "rounded-lg bg-blue-600 hover:bg-blue-700"
            )}
          >
            下一题
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function TrueFalseOptions({
  question,
  userAnswer,
  answered,
  onSelect,
  variant = "default",
}: {
  question: Question;
  userAnswer: string;
  answered: boolean;
  onSelect: (ans: string) => void;
  variant?: "default" | "battle";
}) {
  const isBattle = variant === "battle";
  const options = [
    { value: "√", label: "正确", icon: "✓" },
    { value: "×", label: "错误", icon: "✗" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {options.map((opt) => {
        const isSelected = userAnswer === opt.value;
        const isCorrectAnswer = question.answer === opt.value;
        const showCorrect = answered && isCorrectAnswer;
        const showWrong = answered && isSelected && !isCorrectAnswer;

        return (
          <button
            key={opt.value}
            onClick={() => !answered && onSelect(opt.value)}
            disabled={answered}
            className={cn(
              "p-4 md:p-5 rounded-xl border-2 text-center transition-all font-semibold",
              isBattle && "battle-option battle-cursor rounded-none uppercase tracking-[0.16em]",
              !answered &&
                !isSelected &&
                (isBattle
                  ? "border-cyan-300/20 bg-slate-900/90 text-cyan-100 hover:border-cyan-200 hover:bg-cyan-300/12"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"),
              !answered &&
                isSelected &&
                (isBattle
                  ? "border-amber-300 bg-amber-400/18 text-amber-100 shadow-[0_0_28px_rgba(251,191,36,0.25)]"
                  : "border-blue-500 bg-blue-50 text-blue-700"),
              showCorrect &&
                (isBattle
                  ? "battle-hit border-lime-300 bg-lime-400/18 text-lime-100"
                  : "border-green-500 bg-green-50 text-green-700"),
              showWrong &&
                (isBattle
                  ? "battle-damage border-red-300 bg-red-500/18 text-red-100"
                  : "border-red-500 bg-red-50 text-red-700"),
              answered &&
                !showCorrect &&
                !showWrong &&
                (isBattle
                  ? "border-white/10 bg-slate-900/50 text-slate-400 opacity-60"
                  : "border-slate-200 bg-slate-50 text-slate-500 opacity-60")
            )}
          >
            <span className="text-xl md:text-2xl block mb-1">{opt.icon}</span>
            <span className="text-sm">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ChoiceOptions({
  question,
  options,
  userAnswer,
  answered,
  onSelect,
  variant = "default",
}: {
  question: Question;
  options: DisplayOption[];
  userAnswer: string;
  answered: boolean;
  onSelect: (ans: string) => void;
  variant?: "default" | "battle";
}) {
  const isBattle = variant === "battle";
  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const isSelected = userAnswer.includes(opt.originalLabel);
        const isCorrectAnswer = question.answer.includes(opt.originalLabel);
        const showCorrect = answered && isCorrectAnswer;
        const showWrong = answered && isSelected && !isCorrectAnswer;

        return (
          <button
            key={opt.originalLabel}
            onClick={() => !answered && onSelect(opt.originalLabel)}
            disabled={answered}
            className={cn(
              "w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
              isBattle && "battle-option battle-cursor rounded-none",
              !answered &&
                !isSelected &&
                (isBattle
                  ? "border-cyan-300/20 bg-slate-900/90 hover:border-cyan-200 hover:bg-cyan-300/12"
                  : "border-slate-200 bg-white hover:border-blue-300"),
              !answered &&
                isSelected &&
                (isBattle
                  ? "border-amber-300 bg-amber-400/18 shadow-[0_0_28px_rgba(251,191,36,0.25)]"
                  : "border-blue-500 bg-blue-50"),
              showCorrect &&
                (isBattle
                  ? "battle-hit border-lime-300 bg-lime-400/18"
                  : "border-green-500 bg-green-50"),
              showWrong &&
                (isBattle
                  ? "battle-damage border-red-300 bg-red-500/18"
                  : "border-red-500 bg-red-50"),
              answered &&
                !showCorrect &&
                !showWrong &&
                (isBattle
                  ? "border-white/10 bg-slate-900/50 opacity-60"
                  : "border-slate-200 bg-slate-50 opacity-60")
            )}
          >
            <span
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                isBattle && "rounded-none ring-1 ring-white/20",
                !answered &&
                  !isSelected &&
                  (isBattle ? "bg-cyan-300/10 text-cyan-100" : "bg-slate-100 text-slate-500"),
                !answered &&
                  isSelected &&
                  (isBattle ? "bg-amber-300 text-slate-950" : "bg-blue-500 text-white"),
                showCorrect && (isBattle ? "bg-lime-300 text-slate-950" : "bg-green-500 text-white"),
                showWrong && (isBattle ? "bg-red-300 text-slate-950" : "bg-red-500 text-white"),
                answered &&
                  !showCorrect &&
                  !showWrong &&
                  (isBattle ? "bg-white/10 text-slate-400" : "bg-slate-100 text-slate-400")
              )}
            >
              {opt.displayLabel}
            </span>
            <span
              className={cn(
                "text-sm leading-relaxed pt-1",
                showCorrect && (isBattle ? "text-lime-100 font-medium" : "text-green-700 font-medium"),
                showWrong && (isBattle ? "text-red-100" : "text-red-700"),
                !answered && (isBattle ? "text-slate-100" : "text-slate-700"),
                answered && !showCorrect && !showWrong && isBattle && "text-slate-400"
              )}
            >
              {opt.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}
