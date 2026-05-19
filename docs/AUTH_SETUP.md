# Supabase Auth Setup — Summify

Optional sign-in (Google, email/password, magic link). **Analysis does not require login.**

## Environment variables

Add to `.env.local` (local) and Netlify **Site settings → Environment variables** (production):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Must match the site origin used in the browser (magic link + OAuth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Show "Continue with Google" after Supabase Google provider is configured
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
```

Never commit `.env.local`. Use the **anon** key only in the Next.js app (public). Keep the **service role** key server-side only if you add admin scripts later.

## Supabase project setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers → Email**
   - Enable the **Email** provider.
   - Enable **Email + password** (allow users to sign up with password).
   - **Confirm email**: optional for local dev. If enabled, new users must confirm before `signInWithPassword` works; the app shows a clear message after sign-up.
   - **Magic Link** can stay enabled as a secondary sign-in method on `/login`.
3. **Authentication → URL configuration** — set:

| Setting | Local | Production |
|---------|-------|--------------|
| **Site URL** | `http://localhost:3000` | `https://summify.app` |
| **Redirect URLs** | `http://localhost:3000/auth/callback` | `https://summify.app/auth/callback` |

Add both URLs if you test locally and deploy to production:

```
http://localhost:3000/auth/callback
https://summify.app/auth/callback
```

Optional wildcards (Supabase dashboard): `http://localhost:3000/**` for local dev.

4. **Email templates** (optional): customize magic link and confirmation emails under Authentication → Email Templates.

## Google Cloud OAuth setup

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Create an **OAuth 2.0 Client ID** (application type: **Web application**).
3. **Authorized JavaScript origins** (add each environment you use):

```
http://localhost:3000
https://summify.app
```

4. **Authorized redirect URIs** — use the callback URL shown in Supabase (**Authentication → Providers → Google**). It looks like:

```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

Do **not** put `http://localhost:3000/auth/callback` in Google Console — Supabase handles the OAuth exchange; your app callback is configured in Supabase redirect URLs only.

5. Copy **Client ID** and **Client secret** into Supabase **Authentication → Providers → Google** and enable the provider.

6. Set `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` in `.env.local` / Netlify and restart the dev server or redeploy.

## Sign-in methods in the app

| Method | API | Notes |
|--------|-----|--------|
| Google | `signInWithOAuth({ provider: "google" })` | Redirects via `/auth/callback` |
| Email + password | `signInWithPassword` | Primary for local/testing |
| Create account | `signUp` | Same form; may require email confirm per project settings |
| Magic link | `signInWithOtp` | Secondary; subject to email rate limits |

## App routes

| Route | Purpose |
|-------|---------|
| `/login` | Google + email/password + magic link |
| `/auth/callback` | Exchanges `code` for session (Google OAuth + magic link) |
| `/account` | Signed-in profile (email, beta status, sign out) |
| `/dashboard` | Saved analyses (requires sign-in) |

`/upload` remains fully usable without signing in. Logged-out users see: **Sign in to save analyses.**

## OAuth / callback flow

1. User clicks **Continue with Google** on `/login`.
2. App calls `signInWithOAuth` with `redirectTo`:
   `{NEXT_PUBLIC_SITE_URL}/auth/callback?next=/account` (or custom `next` from `/login?next=/dashboard`).
3. Google → Supabase → `/auth/callback?code=...&next=...`
4. Route handler runs `exchangeCodeForSession`, then `ensureProfileForUser`, then redirects to `next`.
5. Header listens to `onAuthStateChange` and shows **Account**.

If the user cancels Google sign-in, Supabase redirects with `?error=access_denied` → login shows a friendly cancelled message.

## Session behavior

- Cookies are managed via `middleware.ts` + `@supabase/ssr` (`updateSession` refreshes the session on each request).
- After password sign-in or sign-up with an immediate session, the client calls `router.refresh()` and navigates to `next` (default `/account`) so server components see the user.
- **Sign out** clears the session and refreshes the layout.
- Magic link and Google OAuth complete at `/auth/callback`, which runs `ensureProfileForUser` before redirecting.

## Local testing

1. Copy env vars into `.env.local` (include `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`).
2. In Supabase: enable Email provider + Google provider (see above).
3. In Google Cloud: OAuth client with Supabase callback URI.
4. In Supabase **Redirect URLs**: `http://localhost:3000/auth/callback`
5. `npm run dev`
6. Open [http://localhost:3000/login](http://localhost:3000/login)
7. **Continue with Google** → pick account → land on `/account` with email shown; header shows **Account**.
8. **Email/password** and **magic link** still work on the same page.
9. Open `/upload` — analysis works without extra login.
10. **Sign out** → header returns to **Sign in**; `/upload` still works anonymously.

### Local troubleshooting

| Symptom | Fix |
|---------|-----|
| Google button disabled | Set `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` and restart dev server |
| Redirect URL mismatch | Add `http://localhost:3000/auth/callback` to Supabase redirect URLs; match `NEXT_PUBLIC_SITE_URL` |
| `redirect_uri_mismatch` in Google | Use Supabase’s callback URL in Google Console, not `/auth/callback` on localhost |
| Sign-in cancelled | Normal — user closed Google; try again |
| Magic link redirect errors | Same redirect URL rules as OAuth |

## Production testing (Netlify)

1. Env vars in Netlify (Build + Runtime):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://summify.app` (no trailing slash)
   - `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`
2. Supabase **Site URL**: `https://summify.app`
3. Supabase **Redirect URLs**: `https://summify.app/auth/callback`
4. Google OAuth **Authorized JavaScript origins**: `https://summify.app`
5. Google **Authorized redirect URIs**: Supabase callback (`https://YOUR_PROJECT.supabase.co/auth/v1/callback`)
6. Deploy; visit `https://summify.app/login` → **Continue with Google** → `/account`
7. Test `https://summify.app/login?next=/dashboard` — should return to dashboard after sign-in.

## Security notes

- Session cookies are refreshed via middleware + `@supabase/ssr`.
- `/account`, `/login`, and `/dashboard` use `noindex` metadata.
- API routes (`/api/analyze`, etc.) are **not** gated on auth; usage tracking and saved analyses only run when a session is present.

## Table permissions (required)

If `/account` logs `permission denied for table profiles`, your tables exist but the **`authenticated` role lacks GRANTs** (common when schema was pasted via SQL Editor).

Run **`docs/SUPABASE_GRANTS_FIX.sql`** once in the Supabase SQL Editor, then reload `/account`.

RLS policies alone are not enough — Postgres also requires `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `permission denied for table profiles` | Run `docs/SUPABASE_GRANTS_FIX.sql` in Supabase |
| Header has no Sign in link | Supabase env vars missing at build time |
| “Authentication is not configured” | Set `NEXT_PUBLIC_SUPABASE_*` and rebuild |
| Google button greyed out | `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` + restart |
| Magic link rate limit | Use email/password or Google; wait or raise limits in Supabase |
| Magic link opens but login fails | Redirect URL mismatch; check Supabase URL config |
| “Confirm your email” on sign-in | Confirm email in inbox, or disable confirm-email for dev |
| Stuck logged out after link | Clear cookies; confirm middleware runs (not static export) |
| Password sign-in works but `/account` empty | Check `ensureProfileForUser` / RLS on `profiles` (see `docs/SUPABASE_SCHEMA.md`) |
