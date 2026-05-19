# Monetization plan — Summify

Architecture for plans, usage limits, and future Stripe billing. **No checkout is live**; beta accounts retain full workspace access.

## Plan IDs (`profiles.plan`)

| ID | Purpose |
|----|---------|
| `beta` | All current users — `enforceLimits: false`, generous access |
| `free` | Default after billing launch (planned) |
| `scholar` | Student tier — verification later |
| `pro` | Professional fair-use tier |
| `team` | Seats + shared library (coming soon) |

Source of truth: `src/data/pricingPlans.ts` → `PLAN_DEFINITIONS`.

## Pricing model (preview)

| Plan | Monthly | Yearly | Daily analyses | Max file | Modes | Learn cards | Saved |
|------|---------|--------|----------------|----------|-------|-------------|-------|
| Free | $0 | — | 3 | 10MB | 5 | 5 | Last 3 |
| Scholar | $4.99 | $39.99 | 10 | 25MB | 15 | 12 | Unlimited |
| Pro | $7.99 | $59.99 | Fair use | 50MB | All 29 | 15 | Unlimited |
| Team | $24.99 | $199.99 | Fair use | 50MB | All | 15 | Shared library |

## Code map

| Concern | Module |
|---------|--------|
| Plan config | `src/data/pricingPlans.ts` |
| Plan ID types | `src/types/plan.ts` |
| Usage / quota | `src/lib/plan-limits.ts` |
| Feature caps | `src/lib/plan-features.ts` |
| Pricing UI | `src/components/pricing/*` |
| Dashboard usage | `src/components/dashboard/DashboardUsagePanel.tsx` |
| Workspace warnings | `src/components/upload/WorkspaceUsageWarning.tsx` |
| Locked modes | `src/components/pricing/PlanUpgradeModal.tsx` |

### Helpers

- **`getUserPlanLimits(plan, user_limits)`** — plan name, daily cap, used today, remaining.
- **`getRemainingAnalyses(plan, usage)`** — remaining count or `null` (unlimited).
- **`canRunAnalysis({ storedPlan, usage, isAuthenticated })`** — always `allowed: true` until enforcement phase; sets `wouldBlock` and optional `warning` when near cap.
- **`getAllowedModeIdsForPlan`**, **`getMaxFileSizeBytes`**, **`getMaxLearnCardsForPlan`**, **`getMaxSavedAnalysesForPlan`** — prepared, not fully enforced.

## Feature gating (current vs future)

| Feature | Now | Future |
|---------|-----|--------|
| Daily analysis cap | Warning only | Block when `wouldBlock` && enforcement on |
| File size | Not enforced | Reject upload > `maxFileSizeMb` |
| Mode count | UI locked modes + modal | Server validate mode id |
| Learn card count | Full pipeline output | Trim to plan max |
| Saved retention | All saves for beta | Prune to `maxSavedAnalyses` on free |

Beta users: `enforceLimits: false` — no warnings from plan caps unless we simulate free for testing.

## Stripe flow (future)

1. **Products / Prices** in Stripe Dashboard — map to `stripePriceId` on each `PlanBillingOption` in `pricingPlans.ts`.
2. **Checkout** — set `checkoutUrl` or server route `POST /api/billing/checkout` → Stripe Checkout Session; success webhook sets `profiles.plan`.
3. **Portal** — `billingPortalUrl` for manage/cancel.
4. **Webhooks** — `customer.subscription.updated` → update `profiles.plan`; never trust client-only plan changes.

Placeholder fields today:

```ts
stripePriceId: null  // e.g. price_pro_monthly
checkoutUrl: null
billingPortalUrl: null
```

## Scholar verification (future)

- Collect `.edu` email or document upload
- Set `profiles.plan = 'scholar'` after verification
- Optional Supabase column `scholar_verified_at`

## Public beta policy

- Existing signups stay on **`beta`** until migration job moves them to `free` or chosen tier.
- `/pricing` shows **public beta pricing preview** — no payment.
- Anonymous `/upload` remains available; tracking uses **free** limits only for warning copy when signed in.

## Testing

1. Signed-in beta user → dashboard shows **Unlimited** / beta badge; no hard block on analyze.
2. Temporarily set `profiles.plan = 'free'` in Supabase → warnings after 2 analyses in a day.
3. Locked mode in selector → upgrade modal → links to `/pricing`.
4. `/pricing` → monthly/yearly toggle; Pro highlighted; Team coming soon.
