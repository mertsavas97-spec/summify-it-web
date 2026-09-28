import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyGeneratedLearnCardFloor,
  cardQuotaForChars,
  enforceKeyInsightFloor,
  insightQuotaForChars,
} from "../../src/server/intelligence/sourceOutputQuota";
import { resolveLearnCardTargets } from "../../src/server/learn/learnCardTargets";

const GROUNDED_SENTENCES = [
  "Chlorophyll inside the stomata converted sunlight into stored sugar during the labeled greenhouse trial.",
  "Subduction along the coastal trench melted mantle rock and built the island volcano chain.",
  "The 1918 census counted a sharp drop in urban births after the influenza wave.",
  "Deng's 1978 reforms opened township enterprises and shifted grain procurement prices.",
  "Pasteur heated the broth just enough to kill microbes without destroying the flavor.",
  "The jury instruction defined negligence as a failure to meet ordinary care.",
  "Hubble measured redshift in distant galaxies and inferred uniform cosmic expansion.",
  "Watt's condenser cut fuel use in the mine pumps by separating cooling from the cylinder.",
  "The treaty set the river boundary at the fortieth parallel and barred new forts.",
  "Mendel tracked pea traits across generations and rejected blended inheritance.",
  "Nightingale plotted ward deaths by month and tied the spike to sanitation.",
  "The amplifier circuit clipped the waveform once the input passed two volts.",
];

function groundedSentence(index: number): string {
  return GROUNDED_SENTENCES[index - 1] ?? `Unique leftover claim number ${index} about quota padding behavior.`;
}

describe("long source output quota", () => {
  it("keeps short sources on a small insight band and a free-deck card floor", () => {
    assert.deepEqual(insightQuotaForChars(2_000), { min: 4, max: 6 });
    assert.deepEqual(cardQuotaForChars(2_000), { min: 8, target: 8, max: 10 });
  });

  it("asks a 30 minute transcript for more insights and study cards", () => {
    const chars = 28_000;
    assert.deepEqual(insightQuotaForChars(chars), { min: 8, max: 12 });
    const cards = resolveLearnCardTargets({
      complexity: "medium",
      isYoutube: true,
      structureFamily: "student_historical",
      summary: "x".repeat(800),
      keyInsightCount: 4,
      sourceChars: chars,
    });
    assert.equal(cards.target, 22);
    assert.ok(cards.min >= 20);
    assert.equal(cards.max, 25);
  });

  it("raises file and text card targets the same way once the source is long", () => {
    const file = resolveLearnCardTargets({
      complexity: "medium",
      summary: "x".repeat(1200),
      keyInsightCount: 4,
      sourceChars: 20_000,
    });
    assert.equal(file.target, 22);
    assert.ok(file.min >= 20);
    assert.deepEqual(insightQuotaForChars(10_000), { min: 6, max: 8 });
    const medium = resolveLearnCardTargets({
      complexity: "medium",
      summary: "x".repeat(1200),
      keyInsightCount: 4,
      sourceChars: 10_000,
    });
    assert.ok(medium.min >= 14);
    assert.ok(medium.target >= 16);
    assert.equal(medium.max, 20);
  });

  it("raises the very long floor without passing the schema cap", () => {
    assert.deepEqual(insightQuotaForChars(42_000), { min: 10, max: 12 });
    assert.deepEqual(cardQuotaForChars(42_000), { min: 24, target: 25, max: 25 });
    const cards = resolveLearnCardTargets({
      complexity: "high",
      summary: "x".repeat(2000),
      keyInsightCount: 8,
      sourceChars: 42_000,
    });
    assert.ok(cards.min >= 24);
    assert.equal(cards.max, 25);
    assert.ok(cards.target <= cards.max);
  });
});

describe("key insight floor", () => {
  it("does not copy summary sentences into a thin insight list", () => {
    const summary = Array.from({ length: 12 }, (_, i) => groundedSentence(i + 1)).join(" ");
    const floored = enforceKeyInsightFloor({
      insights: [
        "The opening trial used a control group that the later trials replaced.",
        groundedSentence(3),
      ],
      summary,
      sourceChars: 42_000,
    });
    assert.deepEqual(floored, [
      "The opening trial used a control group that the later trials replaced.",
    ]);
  });

  it("keeps real insights when the summary cannot fill the floor", () => {
    const floored = enforceKeyInsightFloor({
      insights: ["Only one concrete claim survived dedupe in this short note."],
      summary: "Too short.",
      sourceChars: 20_000,
    });
    assert.deepEqual(floored, ["Only one concrete claim survived dedupe in this short note."]);
  });

  it("does not invent extras once the floor is met and does not cut real items under the hard cap", () => {
    const insights = Array.from({ length: 9 }, (_, i) => groundedSentence(i + 1));
    const floored = enforceKeyInsightFloor({
      insights,
      summary: groundedSentence(20),
      sourceChars: 10_000,
    });
    assert.equal(floored.length, 9);
  });

  it("caps a bloated list at 12", () => {
    const insights = Array.from({ length: 14 }, (_, i) => groundedSentence(i + 1));
    const floored = enforceKeyInsightFloor({
      insights,
      summary: "",
      sourceChars: 50_000,
    });
    assert.equal(floored.length, 12);
  });
});

describe("learn card floor", () => {
  it("keeps a grounded set that clears the minimum and refuses to invent the rest", () => {
    const thin = applyGeneratedLearnCardFloor(
      Array.from({ length: 5 }, (_, i) => ({ id: i })),
      { min: 8, max: 12 },
    );
    assert.equal(thin.meetsFloor, false);
    assert.equal(thin.cards.length, 5);

    const enough = applyGeneratedLearnCardFloor(
      Array.from({ length: 16 }, (_, i) => ({ id: i })),
      { min: 14, max: 15 },
    );
    assert.equal(enough.meetsFloor, true);
    assert.equal(enough.cards.length, 15);
  });
});
