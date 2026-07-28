import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseLearnCardsGenerationResponse } from "../../src/server/ai/parseLearnCardsResponse";

/** Cards that were rejected in production logs for Algebra Basics (unknown_type / no_anchor). */
const ALGEBRA_PHASE2_JSON = JSON.stringify({
  cards: [
    {
      type: "definition",
      difficulty: "easy",
      topic: "Algebra",
      question: "What is algebra?",
      answer: "A branch of math that deals with unknown values and variables",
    },
    {
      type: "definition",
      difficulty: "easy",
      topic: "Equation",
      question: "What is an equation?",
      answer: "A mathematical statement that two things are equal",
    },
    {
      type: "definition",
      difficulty: "easy",
      topic: "Variable",
      question: "What is a variable?",
      answer: "A letter or symbol that can represent different values",
    },
    {
      type: "formula",
      difficulty: "easy",
      topic: "Basic equation",
      question: "What is an example of a basic algebraic equation?",
      answer: "1 + 2 = x",
    },
    {
      type: "formula",
      difficulty: "medium",
      topic: "Implied multiplication",
      question: "What is an example of implied multiplication in algebra?",
      answer: "2x",
    },
    {
      type: "steps",
      difficulty: "medium",
      topic: "Solving",
      question: "How do you solve an equation?",
      answer: "Write the equation, simplify, and solve for the unknown value",
    },
    {
      type: "contrast",
      difficulty: "medium",
      topic: "Arithmetic vs algebra",
      question: "What is the difference between arithmetic and algebra?",
      answer: "Arithmetic deals with known values, algebra deals with unknown values",
    },
    {
      type: "quiz",
      difficulty: "easy",
      topic: "Operations",
      question: "Which four operations does algebra use from arithmetic?",
      answer: "Addition, subtraction, multiplication, and division",
    },
  ],
});

describe("STEM learn card parser", () => {
  it("accepts definition/formula/steps/contrast/quiz from study Phase-2 output", () => {
    const cards = parseLearnCardsGenerationResponse(ALGEBRA_PHASE2_JSON, {
      documentTitle: "Algebra Basics: What Is Algebra?",
      maxCards: 12,
    });

    assert.ok(cards.length >= 7, `expected ≥7 cards, got ${cards.length}`);
    const types = new Set(cards.map((c) => c.type));
    assert.ok(types.has("concept"), "definitions/steps map to concept");
    assert.ok(types.has("memory_hook"), "formulas map to memory_hook");
    assert.ok(types.has("why"), "contrast maps to why");
    assert.ok(types.has("quiz"), "quiz stays quiz");

    const titles = cards.map((c) => c.title);
    assert.ok(titles.some((t) => /algebra/i.test(t)));
    assert.ok(titles.some((t) => /variable/i.test(t)));
    assert.ok(titles.some((t) => /equation/i.test(t)));
  });

  it("keeps short formula answers like 2x (no_anchor must not drop them)", () => {
    const cards = parseLearnCardsGenerationResponse(
      JSON.stringify({
        cards: [
          {
            type: "formula",
            question: "What is an example of implied multiplication in algebra?",
            answer: "2x",
          },
        ],
      }),
    );
    assert.equal(cards.length, 1);
    assert.equal(cards[0]?.type, "memory_hook");
    assert.equal(cards[0]?.content, "2x");
  });
});
