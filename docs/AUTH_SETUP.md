# Supabase Auth Setup — Summify

Optional sign-in (email/password, magic link). **Analysis does not require login.** Google OAuth is deferred to a later phase.

## Environment variables

Add to `.env.local` (local) and Netlify **Site settings → Environment variables** (production):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Must match the site origin used in the browser (canonical / magic links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Deferred — do not enable until Google provider is configured (Phase 7D+)
# NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
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

## Sign-in methods in the app

| Method | API | Notes |
|--------|-----|--------|
| Email + password | `signInWithPassword` | Primary for local/testing |
| Create account | `signUp` | Same form; may require email confirm per project settings |
| Magic link | `signInWithOtp` | Secondary; subject to email rate limits |
| Google | `signInWithOAuth` | **Not enabled in this phase** — set `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` only after Supabase Google provider is configured |

## App routes

| Route | Purpose |
|-------|---------|
| `/login` | Email/password + magic link |
| `/auth/callback` | Exchanges `code` for session (magic link + future OAuth) |
| `/account` | Signed-in profile (email, beta status, sign out) |
| `/dashboard` | Saved analyses (requires sign-in) |

`/upload` remains fully usable without signing in. Logged-out users see: **Sign in to save analyses.**

## Session behavior

- Cookies are managed via `middleware.ts` + `@supabase/ssr` (`updateSession` refreshes the session on each request).
- After password sign-in or sign-up with an immediate session, the client calls `router.refresh()` and navigates to `next` (default `/account`) so server components see the user.
- **Sign out** clears the session and refreshes the layout.
- Magic link completes at `/auth/callback`, which runs `ensureProfileForUser` before redirecting.

## Local testing

1. Copy env vars into `.env.local`.
2. In Supabase: enable Email provider + email/password sign-up (see above).
3. `npm run dev`
4. Open [http://localhost:3000/login](http://localhost:3000/login)
5. **Create account** with email + password (6+ characters), or **Sign in with password** if the user already exists.
6. You should land on `/account` with your email shown; header shows **Account**.
7. Open `/upload` — analysis works without extra login.
8. **Magic link** (optional): use “Email me a sign-in link”; open the link from email → `/auth/callback` → `/account`.
9. **Sign out** → header returns to **Sign in**; `/upload` still works anonymously.

If magic link fails with redirect errors, verify **Redirect URLs** in Supabase match `NEXT_PUBLIC_SITE_URL` + `/auth/callback`.

If password sign-in fails with “Invalid email or password”, confirm the user exists and email is confirmed (if confirm-email is on).

## Netlify deploy

1. Add the same env vars in Netlify (scope: **Build** and **Runtime** for Next.js).
2. Set `NEXT_PUBLIC_SITE_URL=https://summify.app` (no trailing slash).
3. Add `https://summify.app/auth/callback` to Supabase redirect allow list.
4. Deploy; test password sign-in on production.

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
| Magic link rate limit | Use email/password for testing; wait or raise limits in Supabase |
| Magic link opens but login fails | Redirect URL mismatch; check Supabase URL config |
| “Confirm your email” on sign-in | Confirm email in inbox, or disable confirm-email for dev |
| Stuck logged out after link | Clear cookies; confirm middleware runs (not static export) |
| Password sign-in works but `/account` empty | Check `ensureProfileForUser` / RLS on `profiles` (see `docs/SUPABASE_SCHEMA.md`) |

## Google OAuth (deferred)

1. **Authentication → Providers → Google**: enable and add OAuth client ID/secret from Google Cloud Console.
2. Authorized redirect URI in Google Console must include Supabase’s callback URL (shown in Supabase Google provider settings).
3. Set `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` in env and redeploy.
4. Until then, the login page does not show Google sign-in.
