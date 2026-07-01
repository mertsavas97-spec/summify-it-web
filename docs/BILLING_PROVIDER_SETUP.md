# Billing Provider Setup

Summify uses a provider-neutral billing abstraction while Paddle and Lemon Squeezy review are pending. Payments are disabled by default.

## Provider Env

```env
BILLING_PROVIDER=none
```

Supported values:

- `none` — checkout disabled; pricing shows beta/pending copy.
- `polar` — live Polar checkout + webhooks ([POLAR_BILLING.md](./POLAR_BILLING.md)).
- `paddle` — legacy checkout URL env mapping.
- `lemon` — legacy checkout URL env mapping.

## Shared App Flow

- Pricing buttons use `src/components/billing/CheckoutButton.tsx`.
- Checkout requests go to `POST /api/billing/checkout`.
- Provider selection is resolved by `src/lib/billing/provider.ts`.
- Plan-to-checkout URL mapping is resolved by `src/lib/billing/planMapping.ts`.

When `BILLING_PROVIDER=none`, `/api/billing/checkout` returns a safe error and no payment provider is contacted.

## Paddle Path

Future env placeholders:

```env
BILLING_PROVIDER=paddle
PADDLE_SCHOLAR_MONTHLY_CHECKOUT_URL=
PADDLE_SCHOLAR_YEARLY_CHECKOUT_URL=
PADDLE_PRO_MONTHLY_CHECKOUT_URL=
PADDLE_PRO_YEARLY_CHECKOUT_URL=
PADDLE_TEAM_MONTHLY_CHECKOUT_URL=
PADDLE_TEAM_YEARLY_CHECKOUT_URL=
```

Future webhook placeholder:

```text
https://www.summify.app/api/billing/webhook/paddle
```

## Lemon Squeezy Path

Future env placeholders:

```env
BILLING_PROVIDER=lemon
LEMON_SCHOLAR_MONTHLY_CHECKOUT_URL=
LEMON_SCHOLAR_YEARLY_CHECKOUT_URL=
LEMON_PRO_MONTHLY_CHECKOUT_URL=
LEMON_PRO_YEARLY_CHECKOUT_URL=
LEMON_TEAM_MONTHLY_CHECKOUT_URL=
LEMON_TEAM_YEARLY_CHECKOUT_URL=
```

Future webhook placeholder:

```text
https://www.summify.app/api/billing/webhook/lemon
```

## Current Safety Rules

- No provider SDK is installed for Phase 10A abstraction.
- No live payments are enabled while `BILLING_PROVIDER=none`.
- Paid feature enforcement remains disabled; current access is preserved.
- Client plan values are never treated as entitlements.
- Provider-specific webhook verification should be added only after a provider is approved.
