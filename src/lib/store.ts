import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Question,
  QuestionStat,
  StudySession,
  PracticeMode,
  ExamMode,
} from "./types";
import questionsData from "@/data/questions.json";

const questions: Question[] = questionsData as Question[];

function defaultStat(): QuestionStat {
  return {
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
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SessionState {
  mode: "exam" | "practice";
  examMode: ExamMode;
  practiceMode: PracticeMode;
  category: string | null;
  orderedIds: number[];
  currentIdx: number;
  answers: Record<number, string>;
  answered: Record<number, boolean>;
  finished: boolean;
}

interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface StudyStore {
  // Question stats (persisted)
  stats: Record<number, QuestionStat>;
  sessions: StudySession[];

  // AI config (persisted)
  aiConfig: AiConfig;

  // AI explanations cache (persisted): questionId -> explanation
  aiExplanations: Record<number, string>;

  // Current session (transient, also persisted for resume)
  session: SessionState | null;

  // Actions
  getStat: (id: number) => QuestionStat;
  startSession: (config: {
    mode: "exam" | "practice";
    examMode?: ExamMode;
    practiceMode?: PracticeMode;
    category?: string | null;
  }) => void;
  selectAnswer: (questionId: number, answer: string) => void;
  submitMulti: (questionId: number) => void;
  goTo: (idx: number) => void;
  goNext: () => void;
  goPrev: () => void;
  finishSession: () => void;
  clearSession: () => void;
  markUnderstood: (id: number) => void;
  toggleBookmark: (id: number) => void;
  resetProgress: () => void;
  setAiConfig: (config: Partial<AiConfig>) => void;
  setAiExplanation: (questionId: number, text: string) => void;
  clearAiExplanation: (questionId: number) => void;
}

function buildQuestionOrder(
  mode: "exam" | "practice",
  examMode: ExamMode,
  practiceMode: PracticeMode,
  category: string | null,
  stats: Record<number, QuestionStat>
): number[] {
  let pool = [...questions];

  if (mode === "practice" && category) {
    pool = pool.filter((q) => q.category === category);
  }

  if (mode === "exam") {
    return examMode === "random"
      ? shuffle(pool).map((q) => q.id)
      : pool.map((q) => q.id);
  }

  switch (practiceMode) {
    case "random":
      return shuffle(pool).map((q) => q.id);
    case "wrong-redo": {
      const wrongs = pool.filter((q) => {
        const s = stats[q.id];
        return s && s.wrongs > 0 && !s.markedUnderstood;
      });
      if (wrongs.length === 0) return pool.map((q) => q.id);
      return wrongs
        .sort((a, b) => {
          const sa = stats[a.id] || defaultStat();
          const sb = stats[b.id] || defaultStat();
          return sb.wrongs - sa.wrongs;
        })
        .map((q) => q.id);
    }
    case "memory": {
      return [...pool]
        .sort((a, b) => {
          const sa = stats[a.id] || defaultStat();
          const sb = stats[b.id] || defaultStat();
          const scoreA =
            sa.wrongs * 3 - sa.streakCorrect - sa.corrects * 0.1;
          const scoreB =
            sb.wrongs * 3 - sb.streakCorrect - sb.corrects * 0.1;
          return scoreB - scoreA;
        })
        .map((q) => q.id);
    }
    default:
      return pool.map((q) => q.id);
  }
}

export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => ({
      stats: {},
      sessions: [],
      session: null,
      aiConfig: {
        baseUrl: "",
        apiKey: "",
        model: "",
      },
      aiExplanations: {},

      getStat: (id: number) => {
        return get().stats[id] || defaultStat();
      },

      startSession: (config) => {
        const examMode = config.examMode || "sequential";
        const practiceMode = config.practiceMode || "sequential";
        const category = config.category || null;

        const orderedIds = buildQuestionOrder(
          config.mode,
          examMode,
          practiceMode,
          category,
          get().stats
        );

        set({
          session: {
            mode: config.mode,
            examMode,
            practiceMode,
            category,
            orderedIds,
            currentIdx: 0,
            answers: {},
            answered: {},
            finished: false,
          },
        });
      },

      selectAnswer: (questionId, answer) => {
        const { session } = get();
        if (!session || session.answered[questionId]) return;

        const q = questions.find((q) => q.id === questionId);
        if (!q) return;

        if (q.type === "multi") {
          const current = session.answers[questionId] || "";
          const newAnswer = current.includes(answer)
            ? current
                .split("")
                .filter((c) => c !== answer)
                .sort()
                .join("")
            : (current + answer).split("").sort().join("");

          set({
            session: {
              ...session,
              answers: { ...session.answers, [questionId]: newAnswer },
            },
          });
        } else {
          const isCorrect = answer === q.answer;
          const stats = { ...get().stats };
          const stat = { ...(stats[questionId] || defaultStat()) };

          stat.attempts += 1;
          stat.lastSeenAt = Date.now();
          stat.lastResult = isCorrect ? "correct" : "wrong";
          if (isCorrect) {
            stat.corrects += 1;
            stat.streakCorrect += 1;
          } else {
            stat.wrongs += 1;
            stat.streakCorrect = 0;
            stat.lastWrongAt = Date.now();
          }
          stats[questionId] = stat;

          set({
            stats,
            session: {
              ...session,
              answers: { ...session.answers, [questionId]: answer },
              answered: { ...session.answered, [questionId]: true },
            },
          });
        }
      },

      submitMulti: (questionId) => {
        const { session } = get();
        if (!session || session.answered[questionId]) return;
        if (!session.answers[questionId]) return;

        const q = questions.find((q) => q.id === questionId);
        if (!q) return;

        const isCorrect = session.answers[questionId] === q.answer;
        const stats = { ...get().stats };
        const stat = { ...(stats[questionId] || defaultStat()) };

        stat.attempts += 1;
        stat.lastSeenAt = Date.now();
        stat.lastResult = isCorrect ? "correct" : "wrong";
        if (isCorrect) {
          stat.corrects += 1;
          stat.streakCorrect += 1;
        } else {
          stat.wrongs += 1;
          stat.streakCorrect = 0;
          stat.lastWrongAt = Date.now();
        }
        stats[questionId] = stat;

        set({
          stats,
          session: {
            ...session,
            answered: { ...session.answered, [questionId]: true },
          },
        });
      },

      goTo: (idx) => {
        const { session } = get();
        if (!session) return;
        set({ session: { ...session, currentIdx: idx } });
      },

      goNext: () => {
        const { session } = get();
        if (!session) return;
        if (session.currentIdx < session.orderedIds.length - 1) {
          set({ session: { ...session, currentIdx: session.currentIdx + 1 } });
        }
      },

      goPrev: () => {
        const { session } = get();
        if (!session) return;
        if (session.currentIdx > 0) {
          set({ session: { ...session, currentIdx: session.currentIdx - 1 } });
        }
      },

      finishSession: () => {
        const { session, sessions } = get();
        if (!session) return;

        let correct = 0;
        let total = 0;
        for (const id of session.orderedIds) {
          if (session.answered[id]) {
            total++;
            const q = questions.find((q) => q.id === id);
            if (q && session.answers[id] === q.answer) correct++;
          }
        }

        const today = new Date().toISOString().slice(0, 10);
        const existing = sessions.find((s) => s.date === today);
        const updatedSessions = existing
          ? sessions.map((s) =>
              s.date === today
                ? {
                    ...s,
                    questionsAnswered: s.questionsAnswered + total,
                    correctCount: s.correctCount + correct,
                  }
                : s
            )
          : [
              ...sessions,
              { date: today, questionsAnswered: total, correctCount: correct },
            ];

        set({
          session: { ...session, finished: true },
          sessions: updatedSessions,
        });
      },

      clearSession: () => {
        set({ session: null });
      },

      markUnderstood: (id) => {
        const stats = { ...get().stats };
        const stat = { ...(stats[id] || defaultStat()) };
        stat.markedUnderstood = true;
        stats[id] = stat;
        set({ stats });
      },

      toggleBookmark: (id) => {
        const stats = { ...get().stats };
        const stat = { ...(stats[id] || defaultStat()) };
        stat.bookmarked = !stat.bookmarked;
        stats[id] = stat;
        set({ stats });
      },

      resetProgress: () => {
        set({ stats: {}, sessions: [], session: null });
      },

      setAiConfig: (config) => {
        set({ aiConfig: { ...get().aiConfig, ...config } });
      },

      setAiExplanation: (questionId, text) => {
        set({
          aiExplanations: { ...get().aiExplanations, [questionId]: text },
        });
      },

      clearAiExplanation: (questionId) => {
        const next = { ...get().aiExplanations };
        delete next[questionId];
        set({ aiExplanations: next });
      },
    }),
    {
      name: "ai-trainer-study-v2",
    }
  )
);

export { questions };
