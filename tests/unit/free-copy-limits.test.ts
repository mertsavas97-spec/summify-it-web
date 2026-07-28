import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPlanDefinition } from "../../src/data/pricingPlans";
import { FREE_PRACTICE_ACCESSIBLE_COUNT } from "../../src/lib/learn/practiceCardAccess";
import { canUseAudioStudyMode } from "../../src/lib/audio-study/access";
import { canUsePodcastDiscussionMode } from "../../src/lib/podcast/access";

describe("P1 Free/Guest copy vs code", () => {
  it("Free plan claims match analysis/Learn limits and exclude Audio Study", () => {
    const free = getPlanDefinition("free");
    assert.equal(free.limits.analysesPerDay, 5);
    assert.equal(free.limits.maxLearnCards, 8);
    assert.equal(free.limits.maxSavedAnalyses, 10);
    assert.equal(FREE_PRACTICE_ACCESSIBLE_COUNT, 8);

    const joined = free.featureBullets.join(" | ").toLowerCase();
    assert.match(joined, /5 analyses/);
    assert.match(joined, /8 learn/);
    assert.doesNotMatch(joined, /audio study mode/);
    assert.doesNotMatch(joined, /2 audio/);
    assert.doesNotMatch(joined, /1 podcast/);
  });

  it("Audio Study and Podcast stay paid-gated for Free", () => {
    assert.equal(canUseAudioStudyMode("free", false), false);
    assert.equal(canUsePodcastDiscussionMode("free", false), false);
    assert.equal(canUseAudioStudyMode("pro", true), true);
    assert.equal(canUsePodcastDiscussionMode("pro", true), true);
  });
});
