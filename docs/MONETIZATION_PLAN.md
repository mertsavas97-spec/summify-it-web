# Monetization plan — Summify

Architecture for plans, usage limits, and future provider-neutral billing. **No checkout is live**; beta accounts retain full workspace access.

## Plan IDs (`profiles.plan`)

| ID | Purpose |
|----|---------|
| `beta` | All current users — `enforceLimits: false`, generous access |
| `free` | Default after billing launch (planned) |
| `scholar` | Student tier — **coming soon** (preview on pricing; checkout blocked) |
| `pro` | Professional fair-use tier |
| `team` | Seats + shared library (coming soon) |

Source of truth: `src/data/pricingPlans.ts` → `PLAN_DEFINITIONS`.

## Pricing model (source of truth: `pricingPlans.ts` + access gates)

| Plan | Monthly | Yearly | Daily analyses | Learn cards | Saved | Audio Study / Podcast |
|------|---------|--------|----------------|-------------|-------|------------------------|
| Guest | $0 | — | 1 (cookie) | 8 in result | Ghost claim | 30s preview only |
| Free | $0 | — | 5 | 8 | Up to 10 | **Pro only** (not on Free) |
| Scholar | $4.99 | $39.99 | 10 | 12 | Unlimited | Coming soon (checkout closed) |
| Pro | $7.99 | $59.99 | Fair use | 15 | Unlimited | Yes |
| Team | $24.99 | $199.99 | Fair use | 15 | Shared library | Yes |

Free includes **4 core lenses** (Study included). Contract + Exam Prep are paid.

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

## Billing provider flow (future)

1. **Products / Prices** in the approved billing provider dashboard — map to provider checkout URLs or IDs.
2. **Checkout** — route `POST /api/billing/checkout` through the selected provider; success webhook sets `profiles.plan`.
3. **Portal** — `billingPortalUrl` for manage/cancel.
4. **Webhooks** — `customer.subscription.updated` → update `profiles.plan`; never trust client-only plan changes.

Placeholder fields today:

```ts
providerPriceId: null  // future provider price/variant id
checkoutUrl: null
billingPortalUrl: null
```

## Scholar verification (future)

Scholar checkout is **closed** in app code (`isPlanCheckoutEnabled` excludes Scholar; `.edu` email is not a verify flow).

When launching later:
- Collect `.edu` email or document upload (real verification)
- Set `profiles.plan = 'scholar'` after verification
- Optional Supabase column `scholar_verified_at`
- Flip `comingSoon` / enable checkout only after verify ships

## Public beta policy

- Existing signups stay on **`beta`** until migration job moves them to `free` or chosen tier.
- `/pricing` shows **public beta pricing preview** — no payment.
- Anonymous `/upload` remains available; tracking uses **free** limits only for warning copy when signed in.

## Testing

1. Signed-in beta user → dashboard shows **Unlimited** / beta badge; no hard block on analyze.
2. Temporarily set `profiles.plan = 'free'` in Supabase → warnings after 2 analyses in a day.
3. Locked mode in selector → upgrade modal → links to `/pricing`.
4. `/pricing` → monthly/yearly toggle; Pro highlighted; Team coming soon.
