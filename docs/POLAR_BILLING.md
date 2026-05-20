# Polar billing integration

Summify uses [Polar](https://polar.sh) for subscriptions when `BILLING_PROVIDER=polar`. All secrets stay server-side; the client only calls `/api/billing/*`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BILLING_PROVIDER` | Yes | Set to `polar` to enable checkout |
| `POLAR_ACCESS_TOKEN` | Yes | Organization access token (server only) |
| `POLAR_WEBHOOK_SECRET` | Yes | Webhook signing secret (`polar_whs_…`) |
| `POLAR_MODE` | No | `sandbox` or `production` (default: `production`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (webhooks) | Updates `profiles` from webhook handler |
| `POLAR_SCHOLAR_MONTHLY_PRODUCT_ID` | Per plan (checkout) | Polar **product** UUID (preferred for checkout API) |
| `POLAR_*_PRODUCT_ID` | Per plan (checkout) | Same pattern for each plan × interval |
| `POLAR_SCHOLAR_MONTHLY_PRICE_ID` | Per plan | Polar price ID (webhooks + catalog lookup fallback) |
| `POLAR_SCHOLAR_YEARLY_PRICE_ID` | Per plan | Polar price ID |
| `POLAR_PRO_MONTHLY_PRICE_ID` | Per plan | Polar price ID |
| `POLAR_PRO_YEARLY_PRICE_ID` | Per plan | Polar price ID |
| `POLAR_TEAM_MONTHLY_PRICE_ID` | Per plan | Polar price ID |
| `POLAR_TEAM_YEARLY_PRICE_ID` | Per plan | Polar price ID |

Optional: `NEXT_PUBLIC_SITE_URL` / `siteConfig.url` drives success and return URLs.

**Never** expose `POLAR_ACCESS_TOKEN` or `POLAR_WEBHOOK_SECRET` to the browser.

## Database migration

Run [`docs/SUPABASE_MIGRATION_10A_POLAR_BILLING.sql`](./SUPABASE_MIGRATION_10A_POLAR_BILLING.sql) in the Supabase SQL Editor. Adds:

- `polar_customer_id`
- `polar_subscription_id`
- `subscription_status`
- `current_period_end`
- `billing_interval`

(`plan` already exists on `profiles`.)

## Plan availability (product)

| Plan | Checkout | Notes |
|------|----------|--------|
| **Scholar** | Coming soon | Visible on `/pricing`; CTA disabled; API returns 403. |
| **Pro** | Active | Primary paid tier for checkout testing and production. |
| **Team** | Active billing | Polar checkout works; seat billing includes up to 5 seats. Team invite management and workspace UI are **not** shipped yet — account shows a placeholder. |

Env vars for Scholar may remain configured for a future launch; checkout is blocked in app code until student access ships.

## Checkout flow

1. User selects **Pro** or **Team** on `/pricing` (monthly or yearly). Scholar is shown as coming soon.
2. `CheckoutButton` → `POST /api/billing/checkout` with `{ planId, interval }` (authenticated).
3. Server validates plan + interval, resolves `POLAR_*_PRICE_ID` from env (never trusts client price IDs).
4. Server creates Polar checkout via `POST /v1/checkouts/` with:
   - `products`: `[product_id]` (current Polar API; `product_price_id` at the root is deprecated)
   - `external_customer_id` = Supabase user UUID
   - `customer_email`, `success_url`, `return_url`
   - `metadata.summify_user_id`, `summify_plan`, `summify_interval`, optional `summify_price_id`
5. Product IDs come from `POLAR_*_PRODUCT_ID`, or are resolved by looking up `POLAR_*_PRICE_ID` in the Polar catalog (same `POLAR_MODE` org).
6. API returns `{ url }`; browser redirects to Polar Checkout.
7. On success, Polar redirects to `/billing/success?checkout_id=…`.
8. Polar sends webhooks; profile is updated asynchronously.

## Customer portal

`POST /api/billing/portal` (authenticated) creates a Polar customer session (`POST /v1/customer-sessions/`) with `external_customer_id` and returns `customer_portal_url`. The account page shows **Manage billing** when Polar is active and the user has billing records.

## Webhook endpoint

**URL:** `https://your-domain.com/api/polar/webhook`

Configure in Polar Dashboard → Settings → Webhooks. Subscribe at minimum to:

| Event | Purpose |
|-------|---------|
| `subscription.created` | New subscription |
| `subscription.active` | Subscription became active |
| `subscription.updated` | Plan change, renewal, status change |
| `subscription.canceled` | Cancellation scheduled or effective |
| `subscription.revoked` | Access revoked |
| `subscription.uncanceled` | Reactivation |
| `order.paid` | Fallback when subscription object is on the order |
| `checkout.updated` | When status is `succeeded` |

Verification uses the [Standard Webhooks](https://www.standardwebhooks.com/) spec via the `standardwebhooks` package. The handler maps Polar **price IDs** (from env) to Summify plans (`scholar`, `pro`, `team`) and updates `profiles` with the service role client.

## Plan mapping

Price IDs are mapped only from server env:

```
POLAR_{SCHOLAR|PRO|TEAM}_{MONTHLY|YEARLY}_PRICE_ID
```

Webhook payloads may include `price_id`, `product_price_id`, or nested `items[].price.id`.

## Fallback when billing is off

`BILLING_PROVIDER=none` (or unset): pricing CTAs show beta / coming soon copy; checkout API returns 503; anonymous upload unchanged.

## Local testing

1. Run migration SQL on your Supabase project.
2. Set env vars in `.env.local` (use Polar **sandbox** + `POLAR_MODE=sandbox`).
3. Set **`NEXT_PUBLIC_SITE_URL=http://localhost:3000`** in `.env.local` and restart `npm run dev`. If this points at production (`https://summify.app`), Polar success URLs and OAuth redirects will leave localhost.
4. `npm run dev`
5. **Sign in with email and password** on `/login` for local checkout tests. Magic links are unreliable on localhost; prefer password sign-in.
6. Logged out, click **Start Pro** on `/pricing` → `/login?next=/pricing` → sign in with password → you return to `/pricing` and can open Polar checkout.
7. **Google OAuth locally (optional):** only if you need it. Configure redirect URLs in Supabase (Authentication → URL configuration) and Google Cloud Console for `http://localhost:3000/auth/callback`. Google sign-in uses `redirectTo` = `{NEXT_PUBLIC_SITE_URL}/auth/callback?next=…` (in the browser, `window.location.origin` is used when available). Do not rely on Google for routine local checkout testing.
8. Forward webhooks:
   ```bash
   polar listen http://localhost:3000/api/polar/webhook
   ```
   Use the CLI-provided secret as `POLAR_WEBHOOK_SECRET`.
9. Confirm `/account` shows plan, status, renewal, and **Manage billing**.

See also [`docs/AUTH_SETUP.md`](./AUTH_SETUP.md) for Supabase auth providers.

## Production

1. Switch to production Polar org + tokens.
2. Set `POLAR_MODE=production` (or omit).
3. Register webhook URL on production domain.
4. Set all six `POLAR_*_PRICE_ID` values for live products.
5. Deploy with `SUPABASE_SERVICE_ROLE_KEY` for webhook profile updates.

## Code map

| Path | Role |
|------|------|
| `src/lib/billing/provider.ts` | Provider switch + UI copy |
| `src/lib/billing/polar/*` | Polar API client, checkout, portal, webhook verify |
| `src/lib/billing/polar/prices.ts` | Env price ID resolution |
| `src/server/billing/syncProfileFromPolar.ts` | Webhook → Supabase profile |
| `src/app/api/billing/checkout/route.ts` | Checkout API |
| `src/app/api/billing/portal/route.ts` | Customer portal API |
| `src/app/api/polar/webhook/route.ts` | Webhook receiver |
