# Stripe Billing — Phase 10A

Summify uses Stripe Checkout for subscription purchase, Stripe Billing Portal for plan management, and Stripe webhooks to synchronize entitlements into Supabase `profiles`.

## Environment

Required:

```env
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SCHOLAR_MONTHLY_PRICE_ID=
STRIPE_SCHOLAR_YEARLY_PRICE_ID=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_YEARLY_PRICE_ID=
STRIPE_TEAM_MONTHLY_PRICE_ID=
STRIPE_TEAM_YEARLY_PRICE_ID=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and required for webhook plan synchronization because Stripe webhooks do not have a user session.

## Supabase Migration

Run:

```sql
docs/SUPABASE_MIGRATION_10A_STRIPE.sql
```

It adds Stripe customer/subscription fields, subscription status, renewal date, and billing interval to `profiles`.

## Checkout Flow

1. Pricing buttons call `/api/stripe/checkout`.
2. The route requires an authenticated user.
3. The server maps `plan + billing interval` to a Stripe Price ID from environment variables.
4. A Stripe Customer is created if missing.
5. The user is redirected to hosted Stripe Checkout.

Client plan values never grant access directly.

## Webhook Lifecycle

Configure Stripe webhook endpoint:

```text
https://summify.app/api/stripe/webhook
```

Listen for:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

The webhook verifies `stripe-signature` with `STRIPE_WEBHOOK_SECRET`, then updates `profiles.plan` and subscription fields.

## Plan Sync Logic

- `active` or `trialing` subscriptions map the Stripe Price ID to `scholar`, `pro`, or `team`.
- canceled, deleted, unpaid, incomplete, or expired subscriptions safely downgrade to `free`.
- existing `beta` profiles remain a manual override until a Stripe subscription event changes their plan.

## Enforcement

Foundation added in Phase 10A:

- free daily analysis limits can block server-side analysis
- plan-aware mode gating runs in `/api/analyze`
- plan-aware Learn card caps trim output
- plan-aware file upload caps run in `/api/extract`
- memory review item caps already use plan-aware limits

Anonymous upload remains available with Free-tier caps.

## Local Stripe Testing

1. Install Stripe CLI.
2. Log in:

```bash
stripe login
```

3. Forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Copy the `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.
5. Start the app:

```bash
npm run dev
```

6. Sign in, open `/pricing`, choose a paid plan, and complete checkout with a Stripe test card.

## Production Checklist

- Set all Stripe env vars in hosting.
- Set `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Add production webhook endpoint in Stripe.
- Confirm Price IDs match the intended products.
- Run the Supabase migration.
- Test checkout, portal, cancellation, renewal, and failed payment events in Stripe test mode before switching live keys.
