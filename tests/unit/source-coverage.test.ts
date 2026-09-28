import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PLAN_LIMITS } from "../../src/lib/plans/planLimits";
import {
  sampleEvenWindows,
  splitOrderedChunks,
} from "../../src/lib/analysis/sourceCoverage";
import { applyPlanDocumentLimits } from "../../src/server/extraction/applyPlanDocumentLimits";
import { compactPromptInput } from "../../src/server/intelligence/compactPromptInput";
import type {
  AdaptiveAnalysisPlan,
  DocumentProfile,
  KnowledgeLayer,
} from "../../src/server/intelligence/types";

const profile: DocumentProfile = {
  documentTypeGuess: "article",
  complexity: "medium",
  structureQuality: "medium",
  estimatedReadingTimeMinutes: 20,
  detectedSignals: [],
  suggestedMode: "academic",
  needsChunking: true,
  sourceQuality: "ok",
};

const layer: KnowledgeLayer = {
  titleGuess: "Source",
  compressedOverview: "Overview",
  keySections: [],
  detectedTopics: [],
  namedEntities: [],
  distinctivePhrases: [],
  potentialQuestions: [],
  warnings: [],
};

const plan: AdaptiveAnalysisPlan = {
  pipelineType: "medium_compacted",
  learnDepth: "standard",
  maxInputCharacters: 14_000,
  outputDepth: "standard",
};

describe("source coverage", () => {
  it("keeps the full source when it fits in the budget", () => {
    const text = "STARTTOKEN middle ending ENDTOKEN";
    assert.equal(sampleEvenWindows(text, 36_000), text);
  });

  it("includes the opening and the ending of a long source", () => {
    const text = `START${"a".repeat(20_000)}END`;
    const sampled = sampleEvenWindows(text, 6_000, 6);
    assert.match(sampled, /^START/);
    assert.match(sampled, /END$/);
    assert.ok(sampled.length < text.length);
  });

  it("walks a long source in order instead of dropping the middle", () => {
    const middle = "M".repeat(8_000);
    const head = `S${"a".repeat(56_000)}`;
    const tail = `${"b".repeat(56_000)}E`;
    const text = `${head}${middle}${tail}`;
    const fitted = applyPlanDocumentLimits(text, PLAN_LIMITS.free);
    assert.equal(fitted.wasTruncated, true);
    assert.match(fitted.text, /^S/);
    assert.match(fitted.text, /MMMM/);
    assert.match(fitted.text, /E$/);
    assert.equal(fitted.limitNotice, "A portion of this source was used.");
  });

  it("sends a medium source in full instead of the first 5,000 characters", () => {
    const text = `${"A".repeat(8_000)}TAILTOKEN`;
    const { userPrompt } = compactPromptInput(text, profile, layer, plan);
    assert.match(userPrompt, /TAILTOKEN/);
    assert.match(userPrompt, /FULL CLEANED SOURCE/);
  });

  it("uses equal windows once the source is past the full-text limit", () => {
    const text = `STARTTOKEN${"B".repeat(18_000)}ENDTOKEN`;
    const { userPrompt } = compactPromptInput(text, profile, layer, {
      ...plan,
      pipelineType: "long_preview",
    });
    assert.match(userPrompt, /equal slices/);
    assert.match(userPrompt, /STARTTOKEN/);
    assert.match(userPrompt, /ENDTOKEN/);
    assert.doesNotMatch(userPrompt, /SUPPORTING EXCERPTS/);
  });

  it("splits paid notes so the last part is the ending", () => {
    const text = `START${"C".repeat(30_000)}END`;
    const chunks = splitOrderedChunks(text);
    assert.ok(chunks.length >= 2);
    assert.match(chunks[0]!, /^START/);
    assert.match(chunks[chunks.length - 1]!, /END$/);
    const covered = chunks.join("").length;
    assert.ok(covered >= text.trim().length - chunks.length);
  });
});
