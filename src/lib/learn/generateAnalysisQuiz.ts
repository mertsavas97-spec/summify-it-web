import type {
  AnalysisQuizInput,
  QuizDifficulty,
  QuizOption,
  QuizOptionKey,
  QuizQuestion,
} from "@/types/learn-quiz";
import { filterValidLearnCards } from "@/lib/learn/learnCardValidation";

const OPTION_KEYS: QuizOptionKey[] = ["A", "B", "C", "D"];

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let s = hashSeed(seed);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeFact(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
  const t = normalizeFact(text);
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function stripQuizContent(content: string): string {
  if (content.includes("\n---\n")) {
    return content.split("\n---\n")[1]?.trim() || content;
  }
  return content;
}

function cardAnswerText(card: AnalysisQuizInput["learnCards"][number]): string {
  const raw = card.type === "quiz" ? stripQuizContent(card.content) : card.content;
  return normalizeFact(raw);
}

function buildDistractors(
  correct: string,
  pool: string[],
  seed: string,
): string[] {
  const unique = [...new Set(pool.map(normalizeFact).filter((t) => t.length > 12))].filter(
    (t) => t.toLowerCase() !== correct.toLowerCase(),
  );
  const shuffled = shuffleWithSeed(unique, seed);
  const picks: string[] = [];
  for (const item of shuffled) {
    if (picks.length >= 3) break;
    if (item.length < 12) continue;
    const tooSimilar =
      item.toLowerCase().includes(correct.slice(0, 24).toLowerCase()) ||
      correct.toLowerCase().includes(item.slice(0, 24).toLowerCase());
    if (!tooSimilar) picks.push(truncate(item, 140));
  }
  while (picks.length < 3) {
    picks.push(
      [
        "A detail not supported by this source",
        "An interpretation outside the document scope",
        "A timeline point from a different section",
        "A stakeholder not mentioned in the source",
      ][picks.length] ?? "Not stated in the source material",
    );
  }
  return picks.slice(0, 3);
}

function assignOptions(
  correctText: string,
  distractors: string[],
  questionId: string,
): { options: QuizOption[]; correctOptionKey: QuizOptionKey } {
  const merged = shuffleWithSeed([correctText, ...distractors], questionId).slice(0, 4);
  const correctIndex = merged.findIndex(
    (t) => t.toLowerCase() === correctText.toLowerCase(),
  );
  const safeCorrectIndex = correctIndex >= 0 ? correctIndex : 0;
  const options = merged.map((text, index) => ({
    key: OPTION_KEYS[index],
    text: truncate(text, 140),
  }));
  return { options, correctOptionKey: OPTION_KEYS[safeCorrectIndex] };
}

function questionFromLearnCard(
  card: AnalysisQuizInput["learnCards"][number],
  pool: string[],
  index: number,
): QuizQuestion | null {
  const answer = cardAnswerText(card);
  if (answer.length < 16) return null;

  const theme = truncate(card.title, 72);
  const question = `Which statement is best supported by the source regarding “${theme}”?`;
  const distractors = buildDistractors(answer, pool, `card-${card.cardId ?? index}`);
  const { options, correctOptionKey } = assignOptions(
    truncate(answer, 140),
    distractors,
    `q-${card.cardId ?? index}`,
  );

  const difficulty: QuizDifficulty =
    card.recallDifficulty === "hard"
      ? "hard"
      : card.recallDifficulty === "easy"
        ? "easy"
        : "medium";

  return {
    id: `quiz-card-${card.cardId ?? index}`,
    question: truncate(question, 200),
    options,
    correctOptionKey,
    explanation: `The source supports: ${truncate(answer, 160)}`,
    relatedLearnCardId: card.cardId,
    sourceTrace: card.sourceTrace,
    difficulty,
    theme,
  };
}

function questionFromInsight(
  insight: string,
  pool: string[],
  index: number,
): QuizQuestion | null {
  const fact = normalizeFact(insight);
  if (fact.length < 24) return null;
  if (/^(the|this|it)\s+(video|document|article)\s/i.test(fact)) return null;

  const question = "Which insight is explicitly supported by this analysis?";
  const distractors = buildDistractors(fact, pool, `insight-${index}`);
  const { options, correctOptionKey } = assignOptions(
    truncate(fact, 140),
    distractors,
    `q-insight-${index}`,
  );

  return {
    id: `quiz-insight-${index}`,
    question,
    options,
    correctOptionKey,
    explanation: `This point appears in the analysis key insights: ${truncate(fact, 160)}`,
    difficulty: "medium",
    theme: truncate(fact, 48),
  };
}

/**
 * Builds multiple-choice quiz questions from analysis output and accessible Learn cards.
 */
export function generateAnalysisQuiz(input: AnalysisQuizInput): QuizQuestion[] {
  const openCards = filterValidLearnCards(
    input.learnCards.filter((c) => !c.isLockedPreview),
    "quiz_generation",
  );
  const pool = [
    ...openCards.map(cardAnswerText),
    ...input.keyInsights,
    ...input.actionItems,
    ...input.risksOrWarnings,
    input.summary,
  ].map(normalizeFact).filter((t) => t.length > 16);

  const maxQuestions = Math.min(
    input.maxQuestions ?? 6,
    Math.max(3, openCards.length + 2),
  );

  const questions: QuizQuestion[] = [];

  for (let i = 0; i < openCards.length && questions.length < maxQuestions; i += 1) {
    const q = questionFromLearnCard(openCards[i], pool, i);
    if (q) questions.push(q);
  }

  for (let i = 0; i < input.keyInsights.length && questions.length < maxQuestions; i += 1) {
    const q = questionFromInsight(input.keyInsights[i], pool, i);
    if (q && !questions.some((existing) => existing.theme === q.theme)) {
      questions.push(q);
    }
  }

  if (questions.length < 3 && input.actionItems.length > 0) {
    const item = input.actionItems.find((a) => a.length > 20);
    if (item) {
      const q = questionFromInsight(item, pool, 99);
      if (q) questions.push({ ...q, id: "quiz-action-0", question: "Which action item follows from this analysis?" });
    }
  }

  return questions.slice(0, maxQuestions);
}
