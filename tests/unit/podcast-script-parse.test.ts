import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePodcastDiscussion, resolvePodcastLengthPlan } from "../../src/lib/podcast/generate-podcast-script";
import type { PodcastLengthPlan } from "../../src/lib/podcast/podcast-prompts";

const lengthPlan: PodcastLengthPlan = {
  durationRange: "5-8 min",
  targetWordRange: "725-1160 words",
  minWords: 725,
  maxWords: 1160,
  densityMode: "quick",
};

describe("podcast script parser", () => {
  it("accepts a real Host and Expert dialogue with fewer than four turns", () => {
    const script = parsePodcastDiscussion(
      JSON.stringify({
        title: "Why the treaty failed",
        outline: ["Opening: the treaty", "Close: what it changed"],
        dialogue: [
          { speaker: "Host", text: "Why did this treaty fail so quickly?" },
          { speaker: "Expert", line: "The terms ignored the losing side's economy, so compliance collapsed." },
          { role: "host", message: "So the failure was built into the settlement itself." },
        ],
      }),
      lengthPlan,
    );

    assert.equal(script.script.length, 3);
    assert.deepEqual(
      script.script.map((turn) => turn.speaker),
      ["host", "expert", "host"],
    );
    assert.equal(script.outline.length >= 3, true);
  });

  it("still rejects a script that is only one speaker", () => {
    assert.throws(
      () =>
        parsePodcastDiscussion(
          JSON.stringify({
            title: "Notes",
            outline: [
              { title: "One", summary: "First beat of the episode." },
              { title: "Two", summary: "Second beat of the episode." },
              { title: "Three", summary: "Third beat of the episode." },
            ],
            script: [
              { speaker: "host", text: "This is just a narration." },
              { speaker: "host", text: "There is no second voice." },
            ],
          }),
          lengthPlan,
        ),
      /missing required discussion fields/,
    );
  });
});

describe("podcast length plan", () => {
  const empty = {
    title: "Notes",
    summary: "",
    keyInsights: [],
  };

  it("keeps the three screen durations on a short and a long source", () => {
    const short = { ...empty, sourceMetadata: { extractedCharacterCount: 500 } };
    const long = { ...empty, sourceMetadata: { extractedCharacterCount: 80000, estimatedPages: 40 } };

    for (const input of [short, long]) {
      assert.equal(resolvePodcastLengthPlan(input, "quick").durationRange, "5-8 min");
      assert.equal(resolvePodcastLengthPlan(input, "standard").durationRange, "10-15 min");
      assert.equal(resolvePodcastLengthPlan(input, "deep-dive").durationRange, "15-20 min");
    }

    const quick = resolvePodcastLengthPlan(long, "quick");
    const deep = resolvePodcastLengthPlan(long, "deep-dive");
    assert.equal(quick.minWords, 5 * 145);
    assert.equal(quick.maxWords, 8 * 145);
    assert.equal(deep.minWords, 15 * 145);
    assert.equal(deep.maxWords, 20 * 145);
  });
});
