import type { PracticeRetentionSummary } from "@/lib/learn/retentionTypes";
import type { QuizQuestion, QuizResult } from "@/types/learn-quiz";

export function buildQuizResult(
  questions: QuizQuestion[],
  answers: QuizResult["answers"],
): QuizResult {
  const totalQuestions = questions.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const incorrectCount = totalQuestions - correctCount;
  const scorePercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const weakThemes = new Set<string>();
  const strongThemes = new Set<string>();

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question?.theme) continue;
    if (answer.correct) strongThemes.add(question.theme);
    else weakThemes.add(question.theme);
  }

  const weakConcepts = [...weakThemes].slice(0, 5);
  const strongConcepts = [...strongThemes].slice(0, 5);

  const learningOutcomeSummary =
    totalQuestions === 0
      ? "Quiz could not be generated from the available Learn cards."
      : scorePercent >= 80
        ? "You demonstrated strong recall of the core ideas from this analysis."
        : scorePercent >= 50
          ? "You grasped several key ideas, with a few sections worth revisiting."
          : "Several important ideas need another pass through your Learn cards.";

  return {
    totalQuestions,
    correctCount,
    incorrectCount,
    scorePercent,
    weakConcepts,
    strongConcepts,
    learningOutcomeSummary,
    answers,
  };
}

export function buildCombinedLearningSummary(input: {
  documentTitle: string;
  quizResult: QuizResult;
  retentionSummary?: PracticeRetentionSummary | null;
  gotItCount: number;
  reviewAgainCount: number;
}): string {
  const { quizResult, retentionSummary, gotItCount, reviewAgainCount, documentTitle } =
    input;

  const parts: string[] = [
    `You completed the full learning path for “${truncateTitle(documentTitle)}”: summary, Learn cards, and quiz.`,
  ];

  if (quizResult.totalQuestions > 0) {
    parts.push(
      `Quiz score: ${quizResult.scorePercent}% (${quizResult.correctCount}/${quizResult.totalQuestions} correct).`,
    );
  }

  if (gotItCount > 0 || reviewAgainCount > 0) {
    parts.push(
      `Learn session: ${gotItCount} marked “Got it”, ${reviewAgainCount} flagged for review again.`,
    );
  }

  if (quizResult.strongConcepts.length > 0) {
    parts.push(
      `Strong areas: ${quizResult.strongConcepts.slice(0, 3).join("; ")}.`,
    );
  }

  if (quizResult.weakConcepts.length > 0) {
    parts.push(
      `Review next: ${quizResult.weakConcepts.slice(0, 3).join("; ")}.`,
    );
  } else if (retentionSummary?.hardestRetrievalType) {
    parts.push(
      `Hardest recall type in practice: ${retentionSummary.hardestRetrievalType.replace(/_/g, " ")}.`,
    );
  }

  parts.push(quizResult.learningOutcomeSummary);

  return parts.join(" ");
}

function truncateTitle(title: string): string {
  const t = title.trim();
  return t.length > 60 ? `${t.slice(0, 57)}…` : t;
}
