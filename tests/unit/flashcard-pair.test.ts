import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isDistinctFlashcardPair,
  isGenericFlashcardPrompt,
  isQuestionAnswerContinuation,
} from "../../src/lib/learn/flashcardPair";
import { parseLearnCardsGenerationResponse } from "../../src/server/ai/parseLearnCardsResponse";

describe("flashcard question and answer", () => {
  it("keeps a real question apart from its answer", () => {
    assert.equal(
      isDistinctFlashcardPair(
        "Why did the treaty collapse within a year?",
        "The losing side could not pay the reparations written into the settlement.",
      ),
      true,
    );
    assert.equal(isQuestionAnswerContinuation("What is algebra?", "A branch of math that uses unknowns."), false);
  });

  it("rejects a sentence split across the card and a source-shell question", () => {
    assert.equal(
      isQuestionAnswerContinuation(
        "The settlement ignored the economy",
        "The settlement ignored the economy of the losing side.",
      ),
      true,
    );
    assert.equal(
      isGenericFlashcardPrompt("Which statement is best supported by the source regarding algebra?"),
      true,
    );
    assert.equal(
      isGenericFlashcardPrompt("What claim does the source make about the treaty?"),
      true,
    );
  });

  it("drops generic and continuation cards in the parser", () => {
    const cards = parseLearnCardsGenerationResponse(
      JSON.stringify({
        cards: [
          {
            type: "concept",
            question: "Why did compliance collapse after the treaty?",
            answer: "The settlement ignored the losing side's economy.",
          },
          {
            type: "why",
            question: "Which statement is best supported by the source regarding the treaty?",
            answer: "The losing side could not pay.",
          },
          {
            type: "concept",
            question: "The treaty failed because",
            answer: "the losing side could not pay the reparations.",
          },
        ],
      }),
    );

    assert.equal(cards.length, 1);
    assert.match(cards[0]!.title, /compliance collapse/i);
  });
});
