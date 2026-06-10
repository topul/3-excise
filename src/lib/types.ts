export interface QuestionOption {
  label: string;
  text: string;
}

export interface Question {
  id: number;
  type: "tf" | "single" | "multi";
  category: string;
  text: string;
  options: QuestionOption[];
  answer: string;
  explanation: string;
}

export interface QuestionStat {
  attempts: number;
  corrects: number;
  wrongs: number;
  streakCorrect: number;
  lastResult: "correct" | "wrong" | "";
  lastWrongAt: number;
  lastSeenAt: number;
  markedUnderstood: boolean;
  bookmarked: boolean;
}

export interface StudySession {
  date: string;
  questionsAnswered: number;
  correctCount: number;
}

export type PracticeMode =
  | "sequential"
  | "random"
  | "wrong-redo"
  | "memory"
  | "category";

export type ExamMode = "sequential" | "random";
