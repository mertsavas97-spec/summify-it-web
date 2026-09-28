import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FactInventory } from "../../src/server/ai/factInventory";
import { buildPhase2FlashcardUserPrompt } from "../../src/server/ai/learnCardGenerationPrompt";
import { parseLearnCardsGenerationResponse } from "../../src/server/ai/parseLearnCardsResponse";
import { describeLensCardEmphasis } from "../../src/server/intelligence/mode-routing";
import { isGenericFlashcardPrompt } from "../../src/lib/learn/flashcardPair";

function parse(cards: unknown[], maxCards = 20) {
  return parseLearnCardsGenerationResponse(JSON.stringify({ cards }), { maxCards });
}

const EMPTY_INVENTORY: FactInventory = {
  people: [],
  dates: [],
  numbers: [],
  events: [],
  causes: [],
  contrasts: [],
  definitions: [],
  formulas: [],
  steps: [],
};

describe("study card repetition guard", () => {
  it("drops the same fact asked twice in different words", () => {
    const cards = parse([
      {
        type: "definition",
        topic: "Water cycle",
        question: "What is the water cycle?",
        answer: "The water cycle moves water between the ocean, the air, and the land.",
      },
      {
        type: "definition",
        topic: "Water cycle",
        question: "Define the water cycle",
        answer: "The water cycle is the movement of water through ocean, air, and land.",
      },
      {
        type: "quiz",
        topic: "Photosynthesis",
        question: "Which pigment absorbs light in photosynthesis?",
        answer: "Chlorophyll absorbs light energy during photosynthesis.",
      },
    ]);

    assert.equal(cards.length, 2, "the restated definition must be dropped");
    assert.ok(
      cards.some((c) => /photosynthesis/i.test(c.title)),
      "a distinct fact stays in the deck",
    );
  });

  it("keeps connection and misconception cards as their own kinds", () => {
    const cards = parse([
      {
        type: "connection",
        topic: "Reparations",
        question: "How does the reparations clause connect to the trade embargo?",
        answer: "The embargo blocked exports the reparations schedule assumed would pay the debt.",
      },
      {
        type: "misconception",
        topic: "Trade embargo",
        question: "Why do readers assume the embargo banned all shipping?",
        answer: "The embargo covered listed strategic goods, so ordinary cargo still moved.",
      },
    ]);

    assert.equal(cards.length, 2);
    assert.ok(cards.some((c) => c.type === "connection"), "Link chip survives generation");
    assert.ok(cards.some((c) => c.type === "misconception"), "Myth chip survives generation");
  });
});

describe("generic study card questions", () => {
  it("matches source-shell questions", () => {
    assert.equal(
      isGenericFlashcardPrompt("According to the text, what caused the treaty collapse?"),
      true,
    );
    assert.equal(
      isGenericFlashcardPrompt("What is the main idea of the document?"),
      true,
    );
    assert.equal(
      isGenericFlashcardPrompt("Why did the treaty collapse within a year?"),
      false,
    );
  });

  it("drops a generic shell in the parser", () => {
    const cards = parse([
      {
        type: "fact",
        topic: "Treaty",
        question: "According to the text, what caused the treaty collapse?",
        answer: "The losing side could not pay the reparations written into the settlement.",
      },
      {
        type: "cause",
        topic: "Treaty",
        question: "Why did the reparations schedule fail?",
        answer: "The schedule assumed export revenue that the embargo then cut off.",
      },
    ]);

    assert.equal(cards.length, 1, "only the specific question survives");
    assert.match(cards[0]?.title ?? "", /reparations schedule/);
  });
});

describe("phase 2 depth input", () => {
  it("carries the summary and a source excerpt into the writer prompt", () => {
    const user = buildPhase2FlashcardUserPrompt({
      cardCount: 8,
      language: "English",
      inventory: EMPTY_INVENTORY,
      domainHint: "civic history",
      summary: "The treaty collapsed after the reparations schedule could not be paid.",
      sourceExcerpt: "By March the export revenue had fallen below the scheduled instalment.",
    });

    assert.match(user, /WRITTEN SUMMARY/);
    assert.match(user, /SOURCE EXCERPT/);
    assert.match(user, /Generate 8 flashcards/);
  });

  it("omits both sections when only the inventory exists", () => {
    const user = buildPhase2FlashcardUserPrompt({
      cardCount: 4,
      language: "English",
      inventory: EMPTY_INVENTORY,
      domainHint: "science",
    });

    assert.doesNotMatch(user, /WRITTEN SUMMARY/);
    assert.doesNotMatch(user, /SOURCE EXCERPT/);
  });
});

describe("lens card type emphasis", () => {
  it("turns a lens weighting into writer instructions", () => {
    const emphasis = describeLensCardEmphasis({
      label: "Exam Prep",
      learnWeighting: { quiz: 1.6, concept: 1.2, memory_hook: 0.6 },
    });

    assert.ok(emphasis, "a weighted lens must produce an instruction");
    assert.match(emphasis, /Exam Prep/);
    assert.match(emphasis, /recall quiz cards/);
    assert.match(emphasis, /sparingly/);
    assert.match(emphasis, /memory-hook cards/);
    assert.match(emphasis, /at least one card of each prioritized type/);
  });

  it("says nothing when the weighting is flat", () => {
    assert.equal(
      describeLensCardEmphasis({ label: "Balanced", learnWeighting: {} }),
      undefined,
    );
    assert.equal(describeLensCardEmphasis(undefined), undefined);
  });
});
