# Guest / Auth / Dashboard QA matrix

## Goal
Verify guest quota → sign-in handoff, authenticated auto-save, and dashboard integrity. Fix P0/P1 defects; document residual infra risks.

## Scenario matrix

| ID | Scenario | Expected | Actual | Status | Cleanup |
|----|----------|----------|--------|--------|---------|
| A1 | Guest exhausted banner after analysis 429 | Driven by analysis quota state, not extractError | Fixed via `analysisQuotaExhausted` | PASS (code) | n/a |
| A2 | Password sign-in restores pending `/upload` | justReturned before clearAuthReturnTo | Fixed | PASS (code) | n/a |
| A3 | OAuth callback restores pending workspace | `summify_auth_just_returned` cookie | Fixed | PASS (code) | n/a |
| A4 | Authenticated analyze does not write ghost | Ghost only for guests | Fixed | PASS (code) | n/a |
| A5 | `/api/analyses/[id]/save` no duplicates | Returns existing id + `alreadySaved` | Fixed | PASS (code) | n/a |
| A6 | Save failure UI | Amber retry messaging | Fixed | PASS (code) | n/a |
| A7 | Source labels file/url/text | Filename / title / Pasted text | Fixed | PASS (unit) | n/a |
| A8 | Open redirect battering | External returnTo sanitized | Unit + e2e | PASS | n/a |
| A9 | Dashboard guest UX | Signed-out CTA, not false redirect assumption | E2E | PASS | n/a |
| A10 | Mobile 375 upload | Hero + source section readable | E2E | PASS | n/a |
| A11 | Keyboard reachability | Focusable control on /upload | E2E | PASS | n/a |

## Commands
- `npx tsc --noEmit` — PASS
- `npm run lint` — PASS (15 pre-existing warnings, 0 errors)
- `npm run build` — PASS
- `npm run test:unit` — PASS (4 tests)
- `npx playwright test --project=chromium` — PASS ×2 (7 tests each)

## Residual risks
- Guest quota cookie can be cleared / expires after 48h
- Concurrent analyze requests can race cookie/DB counters on serverless
- In-memory rate limit is not cross-instance
- No true client cancel for in-flight extract/analyze
- Authenticated dashboard save/share/delete still needs live account smoke beyond e2e signed-out checks

## Evidence artifacts
- Unit: `tests/unit/guest-auth-dashboard.test.ts`
- E2E: `tests/e2e/guest-auth-smoke.spec.ts`, `tests/e2e/adjacent-smoke.spec.ts`
- Matrix: this file
