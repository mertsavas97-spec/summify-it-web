# Memory System — Phase 9C

Summify's memory layer turns saved analyses into private spaced repetition without making another LLM call.

## Architecture

- `review_items` stores generated flashcards tied to a user and a saved analysis.
- `review_sessions` stores review activity, rating counts, and aggregate retention for a session.
- `src/types/memory.ts` defines reusable review item, session, scheduling, reminder, and statistics shapes.
- `src/lib/memory/generateReviewItems.ts` derives cards from existing Learn cards, key insights, and important concepts.
- `src/lib/memory/scheduler.ts` handles the simplified Anki/SM-2 style scheduling.

Review data is private by design. Public share pages keep using the public saved-analysis payload and never query `review_items` or `review_sessions`.

## Review Generation

Generation is deterministic and data-driven:

- Learn cards become direct prompts.
- Quiz cards use the existing quiz delimiter parser so question and answer stay separated.
- Key insights become recall prompts.
- Concept-like Learn cards create additional "why does this matter?" prompts.
- Duplicate prompt/answer pairs are removed before insertion.

This avoids extra model latency and cost, and makes "Generate review set" fast enough to run on demand.

## Scheduling Logic

The scheduler supports four ratings:

- `again`: review again in about 10 minutes, lower ease and retention, increment lapses.
- `hard`: review in at least 1 day, lower ease slightly.
- `good`: normal progression using the current ease factor.
- `easy`: larger interval jump and higher ease.

Each review updates:

- `difficulty`
- `retention_score`
- `ease_factor`
- `interval_days`
- `stability_days`
- `last_reviewed_at`
- `next_review_at`

The model is intentionally lightweight: no background jobs, no queues, and no hidden LLM calls.

## UX Integration

- Dashboard shows "Due today", "Review streak", "Continue reviewing", retention estimate, and difficult concepts.
- `/dashboard/memory` provides the flashcard review flow.
- Saved analysis detail pages include "Add to memory", "Generate review set", and "Review" actions.
- Review shortcuts are desktop-friendly: `Space`/`Enter` reveals, `1`-`4` rates.

## Plan Awareness

`getMemoryPlanLimits()` prepares memory caps without hard billing enforcement:

- Free preview: limited review item count.
- Scholar: larger learning-oriented memory system.
- Pro/Public Beta: broader or unlimited memory preview depending on plan configuration.

Stripe is not wired in this phase.

## Reminder Hooks

Types include future reminder intent fields for:

- email reminders
- daily digest
- review notifications

No cron, queue, or email provider is connected yet.

## Supabase Migration

Run:

```sql
docs/SUPABASE_MIGRATION_9C_MEMORY.sql
```

The migration creates private RLS-protected `review_items` and `review_sessions` tables. It grants authenticated users access only to their own rows and creates no anonymous policies.

## Local Test Flow

1. Sign in.
2. Open a saved analysis from `/dashboard`.
3. Click `Add to memory` or `Generate review set`.
4. Open `/dashboard/memory`.
5. Reveal a card, rate it, and confirm the next card advances.
6. Return to `/dashboard` and confirm due/streak/retention stats update.

Run verification locally:

```bash
npm run lint
npm run build
```
