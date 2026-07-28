import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  explainModeSuggestionReason,
  suggestIntelligenceModeForSource,
} from "../../src/lib/suggest-intelligence-mode";

describe("Upload lens suggestion UX helpers", () => {
  it("suggests Student for educational YouTube and explains why", () => {
    const mode = suggestIntelligenceModeForSource({
      inputMode: "youtube",
      metadata: {
        sourceKind: "youtube",
        title: "Algebra Basics: What Is Algebra?",
        videoId: "NybHckSEQBI",
        sourceUrl: "https://youtube.com/watch?v=NybHckSEQBI",
        extractedCharacters: 13000,
        estimatedReadingTimeMinutes: 12,
      },
      entitlementPlanId: "free",
    });
    assert.equal(mode, "the-student");
    const reason = explainModeSuggestionReason({
      modeId: mode,
      inputMode: "youtube",
      metadata: {
        sourceKind: "youtube",
        title: "Algebra Basics: What Is Algebra?",
        videoId: "NybHckSEQBI",
        sourceUrl: "https://youtube.com/watch?v=NybHckSEQBI",
        extractedCharacters: 13000,
        estimatedReadingTimeMinutes: 12,
      },
    });
    assert.match(reason ?? "", /lecture|STEM/i);
  });

  it("suggests Student from transcript when YouTube title is missing", () => {
    const mode = suggestIntelligenceModeForSource({
      inputMode: "youtube",
      metadata: {
        sourceKind: "youtube",
        title: null,
        videoId: "NybHckSEQBI",
        sourceUrl: "https://youtube.com/watch?v=NybHckSEQBI",
        extractedCharacters: 13000,
        estimatedReadingTimeMinutes: 12,
      },
      entitlementPlanId: "free",
      textSnippet:
        "What is algebra? An equation is a mathematical statement that two things are equal. Variables represent unknown values.",
    });
    assert.equal(mode, "the-student");
  });

  it("falls back to Creator for non-educational YouTube without study signals", () => {
    const mode = suggestIntelligenceModeForSource({
      inputMode: "youtube",
      metadata: {
        sourceKind: "youtube",
        title: null,
        videoId: "abc123xyz",
        sourceUrl: "https://youtube.com/watch?v=abc123xyz",
        extractedCharacters: 8000,
        estimatedReadingTimeMinutes: 8,
      },
      entitlementPlanId: "free",
      textSnippet: "Subscribe for more vlogs and travel tips from our channel.",
    });
    assert.equal(mode, "the-creator");
  });
});
