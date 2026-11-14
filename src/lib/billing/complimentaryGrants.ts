import type { PlanId } from "@/types/plan";

/**
 * Complimentary (gifted) paid plans, keyed by account email.
 *
 * A grant is applied when the profile is loaded, so every limit / mode / label
 * check sees the paid plan without touching the database or Polar. It applies
 * as soon as the person signs up with this email, and stops automatically at
 * `endsAt` — no cleanup job needed.
 *
 * Note: the grant uses the email on the profile / auth user. Only add emails
 * whose owner should get the plan.
 */
export type ComplimentaryGrant = {
  email: string;
  plan: Extract<PlanId, "pro" | "team" | "scholar">;
  /** ISO timestamp (inclusive). */
  startsAt: string;
  /** ISO timestamp (exclusive). */
  endsAt: string;
  note?: string;
};

export const COMPLIMENTARY_GRANTS: readonly ComplimentaryGrant[] = [
  {
    email: "pashamatviiko@gmail.com",
    plan: "pro",
    startsAt: "2026-11-15T00:00:00+03:00",
    endsAt: "2027-11-15T00:00:00+03:00",
    note: "1-year complimentary Pro",
  },
];

/** Subscription status reported for an active complimentary grant. */
export const COMPLIMENTARY_STATUS = "active";

export function findActiveComplimentaryGrant(
  email: string | null | undefined,
  now: Date = new Date(),
): ComplimentaryGrant | null {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  const t = now.getTime();
  return (
    COMPLIMENTARY_GRANTS.find(
      (g) =>
        g.email.trim().toLowerCase() === normalized &&
        t >= Date.parse(g.startsAt) &&
        t < Date.parse(g.endsAt),
    ) ?? null
  );
}

type GrantableProfile = {
  email?: string | null;
  plan?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
  billing_interval?: string | null;
};

const PAID_RANK: Record<string, number> = { scholar: 1, pro: 2, team: 3 };

function hasActivePaidStatus(profile: GrantableProfile): boolean {
  const status = profile.subscription_status?.toLowerCase();
  return (
    Boolean(profile.plan && PAID_RANK[profile.plan]) &&
    (status === "active" || status === "trialing" || status === "uncanceled")
  );
}

/**
 * Returns the profile with an active complimentary grant applied.
 * A real paid subscription on an equal or higher tier is left untouched.
 */
export function applyComplimentaryGrant<T extends GrantableProfile>(
  profile: T | null | undefined,
  email?: string | null,
  now: Date = new Date(),
): T | null {
  if (!profile) return profile ?? null;

  const grant = findActiveComplimentaryGrant(email ?? profile.email, now);
  if (!grant) return profile;

  if (
    hasActivePaidStatus(profile) &&
    (PAID_RANK[profile.plan ?? ""] ?? 0) >= PAID_RANK[grant.plan]
  ) {
    return profile;
  }

  return {
    ...profile,
    plan: grant.plan,
    subscription_status: COMPLIMENTARY_STATUS,
    current_period_end: new Date(grant.endsAt).toISOString(),
    billing_interval: "yearly",
  };
}
