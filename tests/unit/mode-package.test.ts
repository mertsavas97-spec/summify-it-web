import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessMode,
  countModesForEntitlement,
} from "../../src/lib/mode-access";
import {
  CORE_PRODUCT_LENS_COUNT,
  FREE_CORE_MODE_COUNT,
  getAllowedModeIdsForPlan,
  getUpgradePlanForMode,
} from "../../src/lib/plan-features";
import { getIntelligenceModeById } from "../../src/config/modes";

describe("P1 mode package", () => {
  it("gives Free exactly 4 cores including Study, excluding Contract/Exam", () => {
    const freeIds = getAllowedModeIdsForPlan("free");
    assert.equal(freeIds.length, FREE_CORE_MODE_COUNT);
    assert.equal(FREE_CORE_MODE_COUNT, 4);
    assert.equal(canAccessMode("the-student", "free"), true);
    assert.equal(canAccessMode("general-summary", "free"), true);
    assert.equal(canAccessMode("executive-brief", "free"), true);
    assert.equal(canAccessMode("the-creator", "free"), true);
    assert.equal(canAccessMode("contract-analyzer", "free"), false);
    assert.equal(canAccessMode("exam-prep", "free"), false);
    assert.equal(countModesForEntitlement("free").available, 4);
  });

  it("unlocks Contract and Exam on Scholar and Pro", () => {
    for (const plan of ["scholar", "pro"] as const) {
      assert.equal(canAccessMode("contract-analyzer", plan), true);
      assert.equal(canAccessMode("exam-prep", plan), true);
      assert.equal(canAccessMode("the-student", plan), true);
    }
  });

  it("markets six core product lenses", () => {
    assert.equal(CORE_PRODUCT_LENS_COUNT, 6);
  });

  it("routes Contract upgrade to Scholar (not Free)", () => {
    const mode = getIntelligenceModeById("contract-analyzer");
    assert.ok(mode);
    assert.equal(getUpgradePlanForMode(mode), "scholar");
  });
});
