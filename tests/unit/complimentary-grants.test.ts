import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyComplimentaryGrant,
  findActiveComplimentaryGrant,
} from "../../src/lib/billing/complimentaryGrants";
import { hasActivePaidEntitlement, resolveEntitlementPlanIdFromProfile } from "../../src/lib/billing/entitlements";
import type { Profile } from "../../src/types/database";

const EMAIL = "pashamatviiko@gmail.com";
const base: Profile = {
  id: "u1", email: EMAIL, full_name: null, avatar_url: null, plan: "free",
  polar_customer_id: null, polar_subscription_id: null, subscription_status: null,
  current_period_end: null, billing_interval: null, created_at: "", updated_at: "",
};

test("grant is active from 15 Nov 2026 (TR) until 15 Nov 2027", () => {
  assert.equal(findActiveComplimentaryGrant(EMAIL, new Date("2026-11-14T20:59:59Z")), null);
  assert.ok(findActiveComplimentaryGrant(EMAIL, new Date("2026-11-14T21:00:00Z")));
  assert.ok(findActiveComplimentaryGrant(" PashaMatviiko@Gmail.com ", new Date("2027-06-01T00:00:00Z")));
  assert.equal(findActiveComplimentaryGrant(EMAIL, new Date("2027-11-14T21:00:00Z")), null);
  assert.equal(findActiveComplimentaryGrant("someone@else.com", new Date("2027-01-01T00:00:00Z")), null);
});

test("applied profile gets Pro entitlements while active, free after expiry", () => {
  const during = applyComplimentaryGrant(base, null, new Date("2027-01-01T00:00:00Z"))!;
  assert.equal(during.plan, "pro");
  assert.equal(hasActivePaidEntitlement(during), true);
  assert.equal(resolveEntitlementPlanIdFromProfile(during), "pro");

  const after = applyComplimentaryGrant(base, null, new Date("2027-12-01T00:00:00Z"))!;
  assert.equal(after.plan, "free");
  assert.equal(resolveEntitlementPlanIdFromProfile(after), "free");
});

test("a real higher-tier subscription is not downgraded", () => {
  const team = { ...base, plan: "team", subscription_status: "active" };
  assert.equal(applyComplimentaryGrant(team, null, new Date("2027-01-01T00:00:00Z"))!.plan, "team");
});
