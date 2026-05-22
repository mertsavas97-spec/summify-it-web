import type { LearnSourceTrace } from "@/types/adaptive-learn";

export type QuizOptionKey = "A" | "B" | "C" | "D";

export type QuizOption = {
  key: QuizOptionKey;
  text: string;
};

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionKey: QuizOptionKey;
  explanation: string;
  relatedLearnCardId?: string;
  sourceTrace?: LearnSourceTrace;
  difficulty: QuizDifficulty;
  theme?: string;
};

export type QuizAnswerRecord = {
  questionId: string;
  selectedKey: QuizOptionKey;
  correct: boolean;
};

export type QuizResult = {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  scorePercent: number;
  weakConcepts: string[];
  strongConcepts: string[];
  learningOutcomeSummary: string;
  answers: QuizAnswerRecord[];
};

export type AnalysisQuizInput = {
  title: string;
  summary: string;
  keyInsights: string[];
  risksOrWarnings: string[];
  actionItems: string[];
  learnCards: Array<{
    cardId?: string;
    type: string;
    title: string;
    content: string;
    isLockedPreview?: boolean;
    sourceTrace?: LearnSourceTrace;
    recallDifficulty?: "easy" | "medium" | "hard";
  }>;
  maxQuestions?: number;
};
