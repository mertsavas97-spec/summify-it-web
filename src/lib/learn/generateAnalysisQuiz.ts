import type {
  AnalysisQuizInput,
  QuizDifficulty,
  QuizOption,
  QuizOptionKey,
  QuizQuestion,
} from "@/types/learn-quiz";
import { filterValidLearnCards } from "@/lib/learn/learnCardValidation";
import { isStudyPersonaModeId } from "@/lib/educational-source";

const OPTION_KEYS: QuizOptionKey[] = ["A", "B", "C", "D"];

const GENERIC_FILLERS = [
  "A detail not supported by this source",
  "An interpretation outside the document scope",
  "A timeline point from a different section",
  "A stakeholder not mentioned in the source",
] as const;

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

function stripQuizParts(content: string): { question?: string; answer: string } {
  if (content.includes("\n---\n")) {
    const [q, a] = content.split("\n---\n");
    return {
      question: q?.trim() || undefined,
      answer: (a ?? content).trim(),
    };
  }
  return { answer: content };
}

function cardAnswerText(card: AnalysisQuizInput["learnCards"][number]): string {
  const raw =
    card.type === "quiz" ? stripQuizParts(card.content).answer : card.content;
  return normalizeFact(raw);
}

function looksLikeQuestion(text: string): boolean {
  const t = text.trim();
  return /\?$/.test(t) || /^(what|how|which|why|when|who|where)\b/i.test(t);
}

function hasMathOrShortFormula(answer: string): boolean {
  return /[=+\-×÷*/^]/.test(answer) || /\b\d+[a-z]\b/i.test(answer);
}

/**
 * Prefer the card's own recall question (title or quiz stem) over a generic
 * "best supported regarding…" wrapper — critical for STEM study quality.
 */
export function stemFromLearnCard(
  card: AnalysisQuizInput["learnCards"][number],
): string {
  if (card.type === "quiz") {
    const parts = stripQuizParts(card.content);
    if (parts.question && looksLikeQuestion(parts.question)) {
      return truncate(parts.question, 200);
    }
  }
  if (looksLikeQuestion(card.title)) {
    return truncate(card.title, 200);
  }
  const theme = truncate(card.title, 72);
  return `Which statement is best supported by the source regarding “${theme}”?`;
}

function buildDistractors(
  correct: string,
  pool: string[],
  seed: string,
  options?: { allowGenericFillers?: boolean },
): string[] | null {
  const allowGenericFillers = options?.allowGenericFillers !== false;
  const unique = [...new Set(pool.map(normalizeFact).filter((t) => t.length > 8))].filter(
    (t) => t.toLowerCase() !== correct.toLowerCase(),
  );
  const shuffled = shuffleWithSeed(unique, seed);
  const picks: string[] = [];
  for (const item of shuffled) {
    if (picks.length >= 3) break;
    if (item.length < 8) continue;
    const tooSimilar =
      item.toLowerCase().includes(correct.slice(0, 24).toLowerCase()) ||
      correct.toLowerCase().includes(item.slice(0, 24).toLowerCase());
    if (!tooSimilar) picks.push(truncate(item, 140));
  }

  if (picks.length < 3 && allowGenericFillers) {
    while (picks.length < 3) {
      picks.push(GENERIC_FILLERS[picks.length] ?? "Not stated in the source material");
    }
  }

  if (picks.length < 3) return null;
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
  studyMode: boolean,
): QuizQuestion | null {
  const answer = cardAnswerText(card);
  const minLen = studyMode && hasMathOrShortFormula(answer) ? 2 : 12;
  if (answer.length < minLen) return null;

  const question = stemFromLearnCard(card);
  const distractors = buildDistractors(answer, pool, `card-${card.cardId ?? index}`, {
    allowGenericFillers: !studyMode,
  });
  if (!distractors) return null;

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
    question,
    options,
    correctOptionKey,
    explanation: `The source supports: ${truncate(answer, 160)}`,
    relatedLearnCardId: card.cardId,
    sourceTrace: card.sourceTrace,
    difficulty,
    theme: truncate(card.title, 72),
  };
}

function questionFromInsight(
  insight: string,
  pool: string[],
  index: number,
  studyMode: boolean,
): QuizQuestion | null {
  const fact = normalizeFact(insight);
  if (fact.length < 24) return null;
  if (/^(the|this|it)\s+(video|document|article)\s/i.test(fact)) return null;

  const question = studyMode
    ? "Which mechanism or idea is supported by this source?"
    : "Which insight is explicitly supported by this analysis?";
  const distractors = buildDistractors(fact, pool, `insight-${index}`, {
    allowGenericFillers: !studyMode,
  });
  if (!distractors) return null;

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
 * Study modes prefer real card stems and reject generic filler distractors.
 */
export function generateAnalysisQuiz(input: AnalysisQuizInput): QuizQuestion[] {
  const studyMode =
    input.studyMode === true || isStudyPersonaModeId(input.intelligenceModeId);

  const openCards = filterValidLearnCards(
    input.learnCards.filter((c) => !c.isLockedPreview),
    "quiz_generation",
  );
  const pool = [
    ...openCards.map(cardAnswerText),
    ...input.keyInsights,
    ...input.actionItems,
    ...(studyMode ? [] : input.risksOrWarnings),
    input.summary,
  ]
    .map(normalizeFact)
    .filter((t) => t.length > 8);

  const maxQuestions = Math.min(
    input.maxQuestions ?? 6,
    Math.max(3, openCards.length + 2),
  );

  const questions: QuizQuestion[] = [];

  // Prefer definition / quiz / formula-style cards first in study mode
  const orderedCards = studyMode
    ? [...openCards].sort((a, b) => {
        const score = (c: (typeof openCards)[number]) => {
          if (c.type === "quiz") return 0;
          if (c.type === "concept" && looksLikeQuestion(c.title)) return 1;
          if (c.type === "memory_hook") return 2;
          return 3;
        };
        return score(a) - score(b);
      })
    : openCards;

  for (let i = 0; i < orderedCards.length && questions.length < maxQuestions; i += 1) {
    const q = questionFromLearnCard(orderedCards[i], pool, i, studyMode);
    if (q) questions.push(q);
  }

  for (let i = 0; i < input.keyInsights.length && questions.length < maxQuestions; i += 1) {
    const q = questionFromInsight(input.keyInsights[i], pool, i, studyMode);
    if (q && !questions.some((existing) => existing.theme === q.theme)) {
      questions.push(q);
    }
  }

  if (!studyMode && questions.length < 3 && input.actionItems.length > 0) {
    const item = input.actionItems.find((a) => a.length > 20);
    if (item) {
      const q = questionFromInsight(item, pool, 99, false);
      if (q) {
        questions.push({
          ...q,
          id: "quiz-action-0",
          question: "Which action item follows from this analysis?",
        });
      }
    }
  }

  const ordered = input.variantSeed
    ? shuffleWithSeed(questions, `quiz-variant-${input.variantSeed}`)
    : questions;

  return ordered.slice(0, maxQuestions);
}
