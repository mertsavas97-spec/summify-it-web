import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCognitionContext } from "../../src/lib/cognition/buildContext";
import { classifyDocumentProfile } from "../../src/lib/cognition/documentProfile";
import { buildPhase2FlashcardUserPrompt } from "../../src/server/ai/learnCardGenerationPrompt";
import { resolveLearnCardTargets } from "../../src/server/learn/learnCardTargets";
import {
  inferStudyDiscipline,
  looksLikeEducationalText,
} from "../../src/lib/educational-source";
import type { FactInventory } from "../../src/server/ai/factInventory";

const ALGEBRA_SNIPPET = `
[0:06] hi this is Rob welcome to mathematics
[0:09] in this lesson we're going to learn some
[0:11] really important things about a whole
[0:13] branch of math called algebra
[0:16] algebra uses addition subtraction multiplication and division
[0:20] and introduces the idea of a variable like X in 1 + 2 = X
`;

const LITERATURE_SNIPPET = `
This chapter explores the protagonist's metaphor and symbolism in the poem.
The narrator uses stanza structure and literary devices throughout the novel.
`;

const HISTORY_SNIPPET = `
In the 18th century the empire collapsed after the revolution.
The treaty ended colonial rule following World War conflicts.
`;

describe("Study discipline packs", () => {
  it("maps Student + Algebra YouTube to scientific study plan (not general fallback)", () => {
    const ctx = buildCognitionContext({
      modeId: "the-student",
      sourceKind: "youtube",
      title: "Algebra Basics: What Is Algebra? - Math Antics",
      textSnippet: ALGEBRA_SNIPPET,
      heuristicTypeGuess: "video_transcript",
    });

    assert.equal(ctx.documentProfile.domain, "scientific");
    assert.equal(ctx.personaAdaptivePlan.planId, "student_scientific_v1");
    assert.equal(ctx.personaAdaptivePlan.structureFamily, "student_scientific");
    assert.ok(ctx.dimensions.primaryDimensions.includes("definitions"));
    assert.ok(!ctx.learnCardBias.preferredCardTypes.includes("creator_hook"));
  });

  it("maps Student + literature signals to literary study plan", () => {
    const ctx = buildCognitionContext({
      modeId: "the-student",
      sourceKind: "file",
      title: "Literary analysis: symbolism in the novel",
      textSnippet: LITERATURE_SNIPPET,
      heuristicTypeGuess: "educational_material",
    });

    assert.equal(ctx.documentProfile.domain, "literary");
    assert.equal(ctx.personaAdaptivePlan.planId, "student_literary_v1");
    assert.equal(ctx.personaAdaptivePlan.structureFamily, "student_literary");
  });

  it("maps Student + history signals to historical study plan", () => {
    const ctx = buildCognitionContext({
      modeId: "the-student",
      sourceKind: "url",
      title: "World War and the colonial empire — history lecture notes",
      textSnippet: HISTORY_SNIPPET,
      heuristicTypeGuess: "article",
    });

    assert.equal(ctx.documentProfile.domain, "historical");
    assert.equal(ctx.personaAdaptivePlan.planId, "student_historical_v1");
    assert.equal(ctx.personaAdaptivePlan.structureFamily, "student_historical");
  });

  it("keeps Creator + non-edu YouTube on creator media plan", () => {
    const ctx = buildCognitionContext({
      modeId: "the-creator",
      sourceKind: "youtube",
      title: "How I grew my channel to 100k subscribers",
      textSnippet:
        "[0:10] hey guys welcome back to the channel today we talk growth hooks and audience takeaways",
      heuristicTypeGuess: "video_transcript",
    });

    assert.equal(ctx.documentProfile.domain, "media_transcript");
    assert.equal(ctx.personaAdaptivePlan.planId, "creator_media_v1");
    assert.ok(ctx.learnCardBias.preferredCardTypes.includes("creator_hook"));
  });

  it("raises Learn card floor for study YouTube packs", () => {
    const study = resolveLearnCardTargets({
      complexity: "medium",
      isYoutube: true,
      structureFamily: "student_scientific",
      summary: "short",
      keyInsightCount: 2,
    });
    const creator = resolveLearnCardTargets({
      complexity: "medium",
      isYoutube: true,
      structureFamily: "creator_media",
      summary: "short",
      keyInsightCount: 2,
    });

    assert.equal(study.target, 8);
    assert.ok(study.min >= 6);
    assert.equal(creator.target, 7);
  });

  it("passes adaptive learn strategy into Phase-2 prompt", () => {
    const inventory: FactInventory = {
      people: [],
      dates: [],
      numbers: [],
      events: [],
      causes: [],
      contrasts: [],
      definitions: [{ term: "variable", definition: "a symbol for an unknown value" }],
      formulas: [
        {
          name_or_symbol: "simple equation",
          expression: "1 + 2 = X",
          meaning: "solve for the unknown",
        },
      ],
      steps: [],
    };

    const prompt = buildPhase2FlashcardUserPrompt({
      cardCount: 8,
      language: "English",
      inventory,
      strategyHint:
        "Prefer definition, mechanism, formula, method, quiz. learnCards: concept for definitions.",
    });

    assert.match(prompt, /Strategy hint:/);
    assert.match(prompt, /definition, mechanism, formula/);
    assert.match(prompt, /Domain hint:/);
  });

  it("infers STEM vs literary vs historical disciplines from text", () => {
    assert.equal(
      inferStudyDiscipline("Algebra Basics", ALGEBRA_SNIPPET),
      "scientific",
    );
    assert.equal(
      inferStudyDiscipline("Literary symbolism", LITERATURE_SNIPPET),
      "literary",
    );
    assert.equal(
      inferStudyDiscipline("Empire and revolution", HISTORY_SNIPPET),
      "historical",
    );
    assert.equal(looksLikeEducationalText("Algebra Basics: What Is Algebra?"), true);
  });

  it("remaps Student profile away from media_transcript for lecture titles", () => {
    const profile = classifyDocumentProfile({
      modeId: "the-student",
      sourceKind: "youtube",
      title: "Algebra Basics: What Is Algebra?",
      textSnippet: ALGEBRA_SNIPPET,
      heuristicTypeGuess: "video_transcript",
    });
    assert.notEqual(profile.domain, "media_transcript");
    assert.equal(profile.domain, "scientific");
  });
});
