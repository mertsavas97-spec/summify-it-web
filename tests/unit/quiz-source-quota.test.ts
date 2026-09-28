import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { quizQuestionTargetForChars } from "../../src/server/intelligence/sourceOutputQuota";
import {
  generateAnalysisQuiz,
  stemFromLearnCard,
} from "../../src/lib/learn/generateAnalysisQuiz";
import type { LearnCardOutput } from "../../src/types/text-analysis";

function deck(size: number): LearnCardOutput[] {
  return Array.from({ length: size }, (_, i) => {
    const title =
      i % 4 === 0
        ? `What is topic ${i + 1}?`
        : i % 4 === 1
          ? `How do you apply topic ${i + 1}?`
          : i % 4 === 2
            ? `Why does topic ${i + 1} matter?`
            : `Topic ${i + 1} in the source material`;
    const answer = `The source explains topic ${i + 1} with a distinct number, name and mechanism.`;
    return {
      type: i % 4 === 0 ? "quiz" : "concept",
      title,
      content: i % 4 === 0 ? `${title}\n---\n${answer}` : answer,
      cardId: `c${i}`,
      recallDifficulty: i % 3 === 0 ? "hard" : i % 3 === 1 ? "medium" : "easy",
    } as LearnCardOutput;
  });
}

function runQuiz(cards: LearnCardOutput[], sourceChars: number) {
  return generateAnalysisQuiz({
    title: "Sample transcript analysis",
    summary: "A short summary that describes the source and its measurable claims.",
    keyInsights: Array.from({ length: 10 }, (_, i) =>
      `Insight ${i + 1} states a distinct measurable effect with a name and a number from the source.`,
    ),
    risksOrWarnings: ["A risk stated explicitly in the source material for this analysis."],
    actionItems: ["An action item the analysis recommends trying within the next week."],
    learnCards: cards,
    maxQuestions: quizQuestionTargetForChars(sourceChars),
    intelligenceModeId: "the-student",
  });
}

describe("quiz size follows the source transcript", () => {
  it("scales the question count across source-length bands", () => {
    assert.equal(quizQuestionTargetForChars(4_000), 6, "short note stays quick");
    assert.equal(quizQuestionTargetForChars(10_000), 8);
    assert.equal(quizQuestionTargetForChars(24_000), 12, "a long transcript earns a longer check");
    assert.equal(quizQuestionTargetForChars(50_000), 15, "the longest source earns the full set");
  });

  it("falls back to the short band when the length is unknown", () => {
    assert.equal(quizQuestionTargetForChars(null), 6);
    assert.equal(quizQuestionTargetForChars(undefined), 6);
    assert.equal(quizQuestionTargetForChars(0), 6);
  });

  it("never asks more questions than the accessible deck can feed", () => {
    const longSource = 50_000;
    const big = runQuiz(deck(25), longSource);
    assert.ok(big.length >= 10 && big.length <= 15, `long deck quiz: ${big.length}`);

    const thin = runQuiz(deck(5), longSource);
    assert.ok(thin.length <= 7, `deck of 5 caps the quiz, got ${thin.length}`);
  });
});

describe("quiz stems stay original", () => {
  it("never copies a flashcard's own wording into a question", () => {
    const cards = deck(20);
    const quiz = runQuiz(cards, 50_000);
    assert.ok(quiz.length >= 6, `expected a real quiz, got ${quiz.length}`);

    const cardWording = new Set(
      cards.flatMap((c) => [c.title.trim().toLowerCase(), c.content.split("\n---\n")[0]!.trim().toLowerCase()]),
    );
    for (const q of quiz) {
      assert.ok(
        !cardWording.has(q.question.trim().toLowerCase()),
        `question is a verbatim card copy: ${q.question}`,
      );
    }

    const uniqueLines = new Set(quiz.map((q) => q.question.trim().toLowerCase()));
    assert.equal(uniqueLines.size, quiz.length, "no question repeats inside one quiz");
  });

  it("spreads questions across different stem shells", () => {
    const cards = deck(20);
    const quiz = runQuiz(cards, 50_000);
    const shells = new Set(
      quiz.map((q) => q.question.replace(/[^a-z\s]/gi, " ").trim().split(/\s+/).slice(0, 4).join(" ")),
    );
    assert.ok(shells.size >= 3, `quiz leans on one shell: ${[...shells].join(" | ")}`);
  });

  it("rewrites every question-style card title into a new line", () => {
    const questionCards = deck(8).filter((_, i) => i % 4 !== 3);
    for (const card of questionCards) {
      const stem = stemFromLearnCard(card);
      assert.ok(stem, `no stem for ${card.title}`);
      assert.notEqual(stem!.trim().toLowerCase(), card.title.trim().toLowerCase());
      assert.match(stem!, /\?$/, `stem is not a question: ${stem}`);
    }
  });

  it("keeps every rewritten stem grammatical", () => {
    const titles = [
      "What is a variable?",
      "How do you solve 1 + 2 = x?",
      "What does implied multiplication mean?",
      "Why does the source compare arithmetic and algebra?",
      "What is an equation?",
      "When is a variable considered unknown?",
      "How does substitution work in equations?",
      "Which symbols denote variables in the lesson?",
    ];
    for (const [index, title] of titles.entries()) {
      const card = {
        type: "concept",
        title,
        content: `${title}\n---\nThe source answers this with a distinct explanation, name and number.`,
        cardId: `g${index}`,
        recallDifficulty: "medium",
      } as LearnCardOutput;
      const stem = stemFromLearnCard(card);
      assert.ok(stem, `no stem for ${title}`);
      // a question clause or bare auxiliary glued into an object slot
      assert.doesNotMatch(
        stem!,
        /\b(?:to|about|for|in|of|with|by)\s+(?:the source\b|which\b|what\b|how\b|why\b|when\b|who\b|where\b)/i,
        `mangled stem: ${stem}`,
      );
      assert.doesNotMatch(
        stem!,
        /\b(?:about|to|for)\s+(?:you\b|does\b|do\b|is\b|are\b|was\b|were\b|it\b)/i,
        `mangled stem: ${stem}`,
      );
      assert.doesNotMatch(stem!, /\b(?:define|describes?|explains?)\s+\S+\s+means?\b/i, `copula left on subject: ${stem}`);
      assert.doesNotMatch(stem!, /\s{2,}|\b(?:the source)\b.*\b(?:the source)\b/i, `repeated filler: ${stem}`);
      assert.ok(stem!.length <= 160, `stem too long: ${stem}`);
    }
  });

  it("never ships an inverted question clause as the subject", () => {
    const cases: Array<{ title: string; answer: string; subject: RegExp | null }> = [
      {
        title:
          "Which pamphlet did Lenin publish in 1902 that called for a tightly organized vanguard party?",
        answer:
          "Lenin's 1902 pamphlet What Is to Be Done? argued for a disciplined revolutionary party.",
        subject: /about the pamphlet\?$/,
      },
      {
        title: "In which month and year was the Treaty of Brest-Litovsk signed?",
        answer: "Russia signed the treaty in March 1918 and left the war.",
        subject: /about the month and year\?$/,
      },
      {
        title: "What year did Lenin suffer a stroke that forced him into semi-retirement?",
        answer: "Lenin suffered his first stroke in 1922 and withdrew from daily work.",
        subject: /about the year\?$/,
      },
      {
        title: "What significant event involving a peaceful demonstration occurred in 1905?",
        answer: "Bloody Sunday in January 1905 turned a peaceful march into a massacre.",
        subject: null,
      },
    ];

    for (const { title, answer, subject } of cases) {
      const card = {
        type: "quiz",
        title,
        content: `${title}\n---\n${answer}`,
        cardId: `inv-${title.length}`,
        recallDifficulty: "medium",
      } as LearnCardOutput;
      const stem = stemFromLearnCard(card);
      if (subject === null) {
        // no safe noun phrase — the card is skipped rather than shipped broken
        assert.equal(stem, null, `clause leaked as a stem: ${stem}`);
        continue;
      }
      assert.ok(stem, `no stem for ${title}`);
      assert.doesNotMatch(
        stem!,
        /\b(?:pamphlet|month|year|event|treaty)\s+(?:did|was|were|that)\b/i,
        `inverted clause leaked into the subject: ${stem}`,
      );
      assert.match(stem!, subject, `unexpected subject: ${stem}`);
    }
  });
});
