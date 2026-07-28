import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPricingPlanFootnote,
  isPlanCheckoutEnabled,
  isScholarCheckoutComingSoon,
  SCHOLAR_EDU_REQUIRED_MESSAGE,
} from "../../src/lib/billing/plan-availability";
import { getPlanDefinition } from "../../src/data/pricingPlans";
import { isEduEmail } from "../../src/lib/auth/edu-email";

describe("Scholar .edu checkout", () => {
  it("enables Scholar checkout in plan availability helpers", () => {
    assert.equal(isPlanCheckoutEnabled("scholar"), true);
    assert.equal(isPlanCheckoutEnabled("pro"), true);
    assert.equal(isPlanCheckoutEnabled("team"), true);
    assert.equal(isScholarCheckoutComingSoon("scholar"), false);
    assert.equal(getPricingPlanFootnote("scholar"), SCHOLAR_EDU_REQUIRED_MESSAGE);
  });

  it("marks Scholar as active student plan in definitions", () => {
    const scholar = getPlanDefinition("scholar");
    assert.equal(scholar.comingSoon, false);
    assert.equal(scholar.badge, "Students");
    assert.equal(scholar.cta, "Start Scholar");
    assert.equal(
      scholar.featureBullets.some((b) => /\.edu email required/i.test(b)),
      true,
    );
  });

  it("recognizes school email domains", () => {
    assert.equal(isEduEmail("student@mit.edu"), true);
    assert.equal(isEduEmail("a@university.edu.tr"), true);
    assert.equal(isEduEmail("name@college.ac.uk"), true);
    assert.equal(isEduEmail("user@gmail.com"), false);
    assert.equal(isEduEmail(null), false);
  });
});
