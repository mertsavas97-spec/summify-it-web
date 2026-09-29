import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appearsInSourceText,
  groundFactInventoryToSource,
  type FactInventory,
} from "../../src/server/ai/factInventory";
import { filterLearnCardsAgainstInventory } from "../../src/server/ai/groundLearnCardsToInventory";
import {
  generateAnalysisQuiz,
  stemFromLearnCard,
} from "../../src/lib/learn/generateAnalysisQuiz";
import { applyAdaptivePlanPostProcess } from "../../src/lib/cognition/postProcessAnalysis";
import type { PersonaAdaptivePlan } from "../../src/types/adaptive-analysis";
import type { LearnCardOutput } from "../../src/types/text-analysis";

const ALGEBRA_SOURCE = `
hi this is Rob welcome to mathematics in this lesson we're going to learn
about a whole branch of math called algebra. Algebra is a lot like arithmetic
it follows all the rules of arithmetic and uses addition subtraction
multiplication and division. Algebra introduces the unknown where a symbol
often a letter like x is used — this is called a variable. An equation is a
mathematical statement that two things are equal. Example: 1 + 2 = x. Solving
equations means finding the value of the unknown. Implied multiplication looks
like 2x.
`;

describe("Study quality: grounding + quiz + mechanisms", () => {
  it("grounds inventory terms to source (drops quadratic/telescope hallucination)", () => {
    const inventory: FactInventory = {
      people: [],
      dates: [],
      numbers: [],
      events: [],
      causes: [],
      contrasts: [],
      definitions: [
        { term: "algebra", definition: "branch of math with unknowns" },
        { term: "variable", definition: "a letter representing a value" },
        {
          term: "quadratic equation",
          definition: "used to design telescope lenses",
        },
      ],
      formulas: [
        { name_or_symbol: "basic", expression: "1 + 2 = x", meaning: "solve for x" },
        { name_or_symbol: "implied", expression: "2x", meaning: "2 times x" },
      ],
      steps: [],
    };

    const grounded = groundFactInventoryToSource(inventory, ALGEBRA_SOURCE);
    assert.ok(grounded.definitions.some((d) => d.term === "algebra"));
    assert.ok(grounded.definitions.some((d) => d.term === "variable"));
    assert.ok(!grounded.definitions.some((d) => /quadratic/i.test(d.term)));
    assert.ok(grounded.formulas.some((f) => f.expression.includes("1 + 2")));
    assert.equal(appearsInSourceText("algebra", ALGEBRA_SOURCE), true);
    assert.equal(appearsInSourceText("quadratic", ALGEBRA_SOURCE), false);
  });

  it("filters Phase-2 cards against inventory corpus", () => {
    const inventory: FactInventory = {
      people: [],
      dates: [],
      numbers: [],
      events: [],
      causes: [],
      contrasts: [],
      definitions: [{ term: "algebra", definition: "branch of math with unknowns" }],
      formulas: [
        { name_or_symbol: "eq", expression: "1 + 2 = x", meaning: "basic equation" },
      ],
      steps: [],
    };

    const cards: LearnCardOutput[] = [
      {
        type: "concept",
        title: "What is algebra?",
        content: "A branch of math that deals with unknown values",
      },
      {
        type: "concept",
        title: "What is a quadratic equation?",
        content: "An equation used to design telescope lenses",
      },
    ];

    const kept = filterLearnCardsAgainstInventory(cards, inventory);
    assert.equal(kept.length, 1);
    assert.match(kept[0]!.title, /algebra/i);
  });

  it("rewrites card questions into original stems instead of copying them", () => {
    const cards: LearnCardOutput[] = [
      {
        type: "concept",
        title: "What is algebra?",
        content: "A branch of math that deals with unknown values and variables",
        cardId: "c1",
      },
      {
        type: "concept",
        title: "What is a variable?",
        content: "A letter or symbol that represents a value that can change",
        cardId: "c2",
      },
      {
        type: "memory_hook",
        title: "What is the expression 1 + 2 = x?",
        content: "An example of a basic algebraic equation",
        cardId: "c3",
      },
      {
        type: "concept",
        title: "How do you solve 1 + 2 = x?",
        content: "Add 1 and 2, write the solution as x = 3",
        cardId: "c4",
      },
    ];

    const stem = stemFromLearnCard(cards[0]!);
    assert.ok(stem, "card yields a stem");
    assert.notEqual(
      stem!.trim().toLowerCase(),
      "what is algebra?",
      "stem must not copy the card's own question",
    );
    assert.match(stem!, /algebra/i, "stem keeps the card's subject");
    assert.match(stem!, /\?$/, "stem is a full question");

    const quiz = generateAnalysisQuiz({
      title: "Algebra Basics",
      summary: ALGEBRA_SOURCE,
      keyInsights: [
        "Algebra follows arithmetic operations: addition, subtraction, multiplication, division.",
        "A variable is a symbol for an unknown value, often written as x.",
        "Solving an equation means finding the unknown value that makes both sides equal.",
        "Implied multiplication appears as 2x meaning 2 times x.",
      ],
      risksOrWarnings: [],
      actionItems: [],
      learnCards: cards,
      maxQuestions: 6,
      intelligenceModeId: "the-student",
    });

    assert.ok(quiz.length >= 3, `expected ≥3 quiz questions, got ${quiz.length}`);
    assert.ok(
      quiz.some((q) => /algebra/i.test(q.question)),
      "quiz still asks about the card's subject",
    );
    const cardWording = new Set(cards.map((c) => c.title.trim().toLowerCase()));
    assert.ok(
      quiz.every((q) => !cardWording.has(q.question.trim().toLowerCase())),
      "no quiz question is a verbatim flashcard copy",
    );
    assert.equal(
      new Set(quiz.map((q) => q.question.trim().toLowerCase())).size,
      quiz.length,
      "no question line repeats inside one quiz",
    );
    assert.ok(
      !quiz.some((q) => /best supported by the source regarding/i.test(q.question)),
      "should not wrap study cards in generic stem when title is a question",
    );
    assert.ok(
      !quiz.some((q) =>
        q.options.some((o) => /not supported by this source/i.test(o.text)),
      ),
      "study mode must not use generic filler distractors",
    );
  });

  it("pads thin student_scientific keyInsights from summary", () => {
    const plan = {
      structureFamily: "student_scientific",
      suppressedDefaultSections: ["risks", "actions"],
    } as PersonaAdaptivePlan;

    const result = applyAdaptivePlanPostProcess(
      {
        title: "Algebra",
        summary:
          "Algebra is a branch of mathematics that follows arithmetic rules. It introduces unknowns using symbols like x. An equation states that two sides are equal. Solving means finding the unknown value. The example 1 + 2 = x shows a basic equation.",
        keyInsights: ["Algebraic equations can be more complicated."],
        risksOrWarnings: ["Approach critically"],
        actionItems: [],
        learnCards: [],
      },
      plan,
    );

    assert.ok(result.keyInsights.length >= 4);
    assert.equal(result.risksOrWarnings.length, 0);
  });
});
