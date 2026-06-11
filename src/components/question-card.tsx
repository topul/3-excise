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

function getDisplayExplanation(
  explanation: string,
  displayOptions: DisplayOption[]
): string {
  return displayOptions.reduce((text, opt) => {
    if (opt.originalLabel === opt.displayLabel) return text;

    return text.replace(
      new RegExp(`\\b${opt.originalLabel}(?=[.、，,；;\\s]|$)`, "g"),
      opt.displayLabel
    );
  }, explanation);
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

export function QuestionCard({ question }: { question: Question }) {
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
  const displayExplanation = getDisplayExplanation(
    question.explanation,
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

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 md:p-6">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3 md:mb-4 flex-wrap">
          <Badge variant="secondary" className={typeColors[question.type]}>
            {typeLabels[question.type]}
          </Badge>
          {cat && (
            <Badge variant="outline" className="text-xs">
              {cat.icon} {cat.name}
            </Badge>
          )}
          <span className="text-xs text-slate-400 ml-auto">
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
          <div className="text-xs text-slate-400 mb-2 md:mb-3">
            练过{stat.attempts}次 · 错{stat.wrongs}次
          </div>
        )}

        {/* Question text */}
        <p className="text-base md:text-lg font-medium text-slate-900 leading-relaxed mb-5 md:mb-6">
          {question.text}
        </p>

        {/* Options */}
        {question.type === "tf" ? (
          <TrueFalseOptions
            question={question}
            userAnswer={userAnswer}
            answered={answered}
            onSelect={(ans) => selectAnswer(question.id, ans)}
          />
        ) : (
          <ChoiceOptions
            question={question}
            options={displayOptions}
            userAnswer={userAnswer}
            answered={answered}
            onSelect={(ans) => selectAnswer(question.id, ans)}
          />
        )}

        {/* Multi submit */}
        {question.type === "multi" && !answered && userAnswer.length > 0 && (
          <button
            onClick={() => submitMulti(question.id)}
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition"
          >
            提交答案
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
                {isCorrect ? "回答正确！" : "回答错误"}
              </span>
            </div>
            <div
              className={cn(
                "text-sm mb-2",
                isCorrect ? "text-green-700" : "text-red-700"
              )}
            >
              正确答案：
              <span className="font-bold">{displayAnswer}</span>
              {displayAnswerDetails.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {displayAnswerDetails.map((detail) => (
                    <div key={detail}>{detail}</div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-2">
              {displayExplanation}
            </p>
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
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            上一题
          </button>
          <span className="text-sm text-slate-400">
            {session.currentIdx + 1} / {session.orderedIds.length}
          </span>
          <button
            onClick={goNext}
            disabled={session.currentIdx === session.orderedIds.length - 1}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
}: {
  question: Question;
  userAnswer: string;
  answered: boolean;
  onSelect: (ans: string) => void;
}) {
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
              !answered && !isSelected && "border-slate-200 hover:border-blue-300 bg-white",
              !answered && isSelected && "border-blue-500 bg-blue-50",
              showCorrect && "border-green-500 bg-green-50 text-green-700",
              showWrong && "border-red-500 bg-red-50 text-red-700",
              answered && !showCorrect && !showWrong && "border-slate-200 bg-slate-50 opacity-60"
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
}: {
  question: Question;
  options: DisplayOption[];
  userAnswer: string;
  answered: boolean;
  onSelect: (ans: string) => void;
}) {
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
              !answered && !isSelected && "border-slate-200 hover:border-blue-300 bg-white",
              !answered && isSelected && "border-blue-500 bg-blue-50",
              showCorrect && "border-green-500 bg-green-50",
              showWrong && "border-red-500 bg-red-50",
              answered && !showCorrect && !showWrong && "border-slate-200 bg-slate-50 opacity-60"
            )}
          >
            <span
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                !answered && !isSelected && "bg-slate-100 text-slate-500",
                !answered && isSelected && "bg-blue-500 text-white",
                showCorrect && "bg-green-500 text-white",
                showWrong && "bg-red-500 text-white",
                answered && !showCorrect && !showWrong && "bg-slate-100 text-slate-400"
              )}
            >
              {opt.displayLabel}
            </span>
            <span
              className={cn(
                "text-sm leading-relaxed pt-1",
                showCorrect && "text-green-700 font-medium",
                showWrong && "text-red-700",
                !answered && "text-slate-700"
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
