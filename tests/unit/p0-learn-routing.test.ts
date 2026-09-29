import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { suggestIntelligenceModeForSource } from "../../src/lib/suggest-intelligence-mode";
import {
  getEducationalCreatorModeWarning,
  looksLikeEducationalSource,
} from "../../src/lib/educational-source";
import { parseFactInventoryResponse } from "../../src/server/ai/factInventory";
import { dedupeAiLearnCardsAgainstAnalysis } from "../../src/server/learn/dedupeLearnCards";
import { buildAdaptivePlanPromptBlock } from "../../src/lib/cognition/planPrompt";
import type { PersonaAdaptivePlan } from "../../src/types/adaptive-analysis";

describe("P0 educational routing", () => {
  it("prefers The Student for educational YouTube titles", () => {
    const mode = suggestIntelligenceModeForSource({
      inputMode: "youtube",
      metadata: {
        sourceKind: "youtube",
        title: "Calculus lecture 3 — permutations and combinations",
        videoId: "abc",
        sourceUrl: "https://youtube.com/watch?v=abc",
        extractedCharacters: 4000,
        estimatedReadingTimeMinutes: 20,
        complexity: "medium",
      },
      entitlementPlanId: "free",
    });
    assert.equal(mode, "the-student");
  });

  it("keeps Creator first for non-educational YouTube", () => {
    const mode = suggestIntelligenceModeForSource({
      inputMode: "youtube",
      metadata: {
        sourceKind: "youtube",
        title: "How I grew my channel to 100k",
        videoId: "xyz",
        sourceUrl: "https://youtube.com/watch?v=xyz",
        extractedCharacters: 4000,
        estimatedReadingTimeMinutes: 20,
        complexity: "medium",
      },
      entitlementPlanId: "free",
    });
    assert.equal(mode, "the-creator");
  });

  it("warns when Creator is selected on lecture material", () => {
    assert.ok(
      looksLikeEducationalSource({
        metadata: {
          sourceKind: "youtube",
          title: "Organic chemistry midterm review",
          videoId: "1",
          sourceUrl: "https://youtube.com/watch?v=1",
          extractedCharacters: 1000,
          estimatedReadingTimeMinutes: 10,
          complexity: "medium",
        },
      }),
    );
    const warning = getEducationalCreatorModeWarning({
      modeId: "the-creator",
      metadata: {
        sourceKind: "youtube",
        title: "Organic chemistry midterm review",
        videoId: "1",
        sourceUrl: "https://youtube.com/watch?v=1",
        extractedCharacters: 1000,
        estimatedReadingTimeMinutes: 10,
        complexity: "medium",
      },
    });
    assert.match(warning ?? "", /The Student/);
  });
});

describe("P0 learn cross-dedupe", () => {
  it("keeps a card that restates the summary and drops only a near copy", () => {
    const kept = dedupeAiLearnCardsAgainstAnalysis(
      [
        { type: "fact", title: "Main claim", content: "Photosynthesis converts light into chemical energy in plants." },
        { type: "fact", title: "Same claim", content: "Photosynthesis converts light into chemical energy in plants." },
        { type: "fact", title: "Side note", content: "Chlorophyll absorbs blue and red wavelengths primarily." },
      ],
      {
        title: "Plant biology",
        summary: "Photosynthesis converts light into chemical energy in plants.",
        keyInsights: ["Water splits during the light reactions."],
      },
    );
    assert.equal(kept.length, 2);
    assert.equal(kept[0]?.title, "Main claim");
    assert.equal(kept[1]?.title, "Side note");
  });
});

describe("P0 fact inventory STEM fields", () => {
  it("parses definitions, formulas, and steps", () => {
    const inventory = parseFactInventoryResponse(
      JSON.stringify({
        people: [],
        dates: [],
        numbers: [],
        events: [],
        causes: [],
        contrasts: [],
        definitions: [{ term: "permutation", definition: "An ordered arrangement of items." }],
        formulas: [
          {
            name_or_symbol: "P(n,r)",
            expression: "n!/(n-r)!",
            meaning: "Number of permutations of n items taken r at a time",
          },
        ],
        steps: [{ goal: "Compute P(5,2)", sequence: "1) 5!=120 2) 3!=6 3) 120/6=20" }],
      }),
    );
    assert.equal(inventory.definitions.length, 1);
    assert.equal(inventory.formulas[0]?.expression, "n!/(n-r)!");
    assert.equal(inventory.steps.length, 1);
  });
});

describe("P0 planPrompt learnCards", () => {
  it("forces learnCards to empty array", () => {
    const plan = {
      planId: "test",
      structureFamily: "executive",
      primaryGoal: "test",
      personaId: "general",
      documentDomain: "general",
      profileConfidence: "medium",
      rationale: "test",
      sections: [],
      suppressedDefaultSections: [],
      learnCardStrategy: {
        summary: "unused for summary pass",
        providerTypeEmphasis: "x",
        titleStyle: "x",
        avoidedAdaptiveTypes: [],
        suppressMisconceptionUnlessExplicit: false,
        suppressRiskActionSynthesis: false,
      },
      toneGuidance: "clear",
      safetyGuidance: "",
    } as unknown as PersonaAdaptivePlan;

    const block = buildAdaptivePlanPromptBlock(plan);
    assert.match(block, /learnCards: ALWAYS return \[\]/);
    assert.doesNotMatch(block, /learnCards: 3–5 cards/);
  });
});
