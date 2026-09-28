import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FREE_PRACTICE_ACCESSIBLE_COUNT,
  getPracticeCardAccessForPlan,
  hasFullPracticeAccess,
  lockedFlashcardUpsellLabel,
} from "../../src/lib/learn/practiceCardAccess";
import type { LearnCardOutput } from "../../src/types/text-analysis";

function card(index: number, locked = false): LearnCardOutput {
  return {
    type: "concept",
    title: `Question ${index}`,
    content: locked ? "" : `Answer ${index} explains a source-specific claim number ${index}.`,
    isLockedPreview: locked || undefined,
  };
}

describe("practice card access split", () => {
  it("shows free users twelve open cards and a blurred remainder", () => {
    const access = getPracticeCardAccessForPlan(
      "free",
      Array.from({ length: 13 }, (_, i) => card(i + 1)),
    );
    assert.equal(FREE_PRACTICE_ACCESSIBLE_COUNT, 12);
    assert.equal(access.accessibleCount, 12);
    assert.equal(access.lockedCount, 1);
    assert.equal(access.isLimited, true);
    assert.equal(access.accessibleCards[0]?.content.includes("Answer 1"), true);
    assert.ok(access.lockedCards.every((item) => item.content === "" && item.isLockedPreview));
    assert.equal(lockedFlashcardUpsellLabel(access.lockedCount), "+1 more flashcard with Pro");
  });

  it("keeps pre-stripped locked previews after a second pass", () => {
    const first = getPracticeCardAccessForPlan(
      "free",
      Array.from({ length: 13 }, (_, i) => card(i + 1)),
    );
    const second = getPracticeCardAccessForPlan("free", [
      ...first.accessibleCards,
      ...first.lockedCards,
    ]);
    assert.equal(second.accessibleCount, 12);
    assert.equal(second.lockedCount, 1);
    assert.ok(second.lockedCards.every((item) => item.content === ""));
    assert.equal(second.accessibleCards[11]?.content.includes("Answer 12"), true);
  });

  it("lets paid plans read extras up to the plan cap and leaves beta locked", () => {
    const cards = Array.from({ length: 20 }, (_, i) => card(i + 1));
    const pro = getPracticeCardAccessForPlan("pro", cards);
    const team = getPracticeCardAccessForPlan("team", cards);
    const scholar = getPracticeCardAccessForPlan("scholar", cards);
    const beta = getPracticeCardAccessForPlan("beta", cards);

    assert.equal(hasFullPracticeAccess("beta"), false);
    assert.equal(pro.accessibleCount, 20);
    assert.equal(pro.lockedCount, 0);
    assert.equal(team.accessibleCount, 20);
    assert.equal(team.lockedCount, 0);
    assert.equal(scholar.accessibleCount, 18);
    assert.equal(scholar.lockedCount, 2);
    assert.equal(scholar.lockedCards.every((item) => item.content === ""), true);
    assert.equal(beta.accessibleCount, 12);
    assert.equal(beta.lockedCount, 8);
  });
});
