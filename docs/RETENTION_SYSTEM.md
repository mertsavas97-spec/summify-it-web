# Retention System — Phase 9D

Phase 9D turns memory review into a daily habit loop without adding new LLM calls, Stripe, cron jobs, or email infrastructure.

## Architecture

- `src/types/retention.ts` defines streaks, daily goals, mastery score, review velocity, weekly progress, comeback prompts, and future reminder hooks.
- `src/lib/retention/date.ts` centralizes UTC-safe date helpers.
- `src/lib/retention/calculateRetention.ts` computes habit state from review items and review sessions.
- `src/server/retention/updateRetentionStats.ts` updates optional streak metadata when a review is recorded.
- `retention_stats` stores private streak metadata, streak freeze foundation fields, recovery window state, and future reminder preferences.

The system remains private. Public share pages do not query retention or memory tables.

## Streak Logic

Dates are keyed by UTC day (`YYYY-MM-DD`).

- Reviewing at least one card on a UTC day counts as activity.
- Reviewing today after reviewing yesterday continues the streak.
- Reviewing multiple cards on the same UTC day does not inflate the streak.
- Missing a day resets the computed streak.
- `retention_stats` stores `current_streak`, `longest_streak`, `last_review_date`, freeze counts, and recovery window metadata.

Streak freezes and recovery are foundations only in this phase. The schema and types exist; no paid enforcement or notification recovery flow is active yet.

## Daily Goals

The daily loop tracks three goals:

- Review the plan-specific daily card target.
- Complete one memory session.
- Generate one review set.

Goal completion is computed from private review history and review item creation dates.

## Mastery Calculation

Mastery is lightweight and deterministic:

- 50% retention component: average review item retention score.
- 30% success component: reviewed cards with stable retention and no lapses.
- 20% consistency component: current streak plus weekly goal completion.
- Difficult concepts apply a small penalty.

No AI is used for mastery scoring.

## Comeback System

Comeback prompts are computed in-app:

- Streak at risk if the user reviewed yesterday but not today.
- Recovery prompt if a recent miss can be recovered in future product flows.
- Waiting concepts prompt when due cards exist.
- Fresh start prompt when no review items exist.

No real push, email, or cron reminders are sent.

## Future Reminder Hooks

The retention model prepares hooks for:

- email reminders
- push notifications
- daily digest
- calendar review scheduling

These are represented as typed disabled hooks and optional `retention_stats.reminder_preferences`. They are not connected to infrastructure in Phase 9D.

## Plan Awareness

Memory plan limits continue to come from `getMemoryPlanLimits()`:

- Free: smaller review capacity.
- Scholar: larger study-oriented target.
- Pro/Public Beta: larger habit loop and future reminder surface.

No Stripe or hard billing enforcement is added.

## Supabase Migration

Run:

```sql
docs/SUPABASE_MIGRATION_9D_RETENTION.sql
```

This migration is required for persisted streak metadata and future reminder preferences. The dashboard can still compute most habit stats from `review_items` and `review_sessions`, but review recording will only persist streak metadata after this table exists.

## Local Test Flow

1. Run the Phase 9C memory migration and this Phase 9D migration.
2. Sign in.
3. Open a saved analysis and generate a review set.
4. Open `/dashboard/memory`.
5. Reveal and rate at least one card.
6. Confirm the session panel updates cards reviewed, daily goal progress, retention estimate, and streak.
7. Return to `/dashboard` and confirm Due today, Review streak, Daily goal, Mastery, and Weekly activity render.

Run verification locally:

```bash
npm run lint
npm run build
```
