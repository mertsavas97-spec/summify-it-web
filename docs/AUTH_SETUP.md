# Supabase Auth Setup — Summify

Phase 7A adds optional sign-in (magic link + prepared Google OAuth). **Analysis does not require login.**

## Environment variables

Add to `.env.local` (local) and Netlify **Site settings → Environment variables** (production):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Must match the site origin used in the browser (canonical / magic links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional — show Google button after provider is configured in Supabase
# NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
```

Never commit `.env.local`. Use the **anon** key only in the Next.js app (public). Keep the **service role** key server-side only if you add admin scripts later.

## Supabase project setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers → Email**: enable Email provider; enable **Magic Link** (confirm email settings match your deliverability needs).
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

4. **Email templates** (optional): customize the magic link email subject/body under Authentication → Email Templates.

## Google OAuth (later)

1. **Authentication → Providers → Google**: enable and add OAuth client ID/secret from Google Cloud Console.
2. Authorized redirect URI in Google Console must include Supabase’s callback URL (shown in Supabase Google provider settings).
3. Set `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` in env and redeploy.
4. Until then, the login page shows copy that Google is not enabled; the button stays hidden.

## App routes

| Route | Purpose |
|-------|---------|
| `/login` | Magic link email form |
| `/auth/callback` | Exchanges `code` for session (email + OAuth) |
| `/account` | Signed-in profile (email, beta status, sign out) |

`/upload` remains fully usable without signing in.

## Local testing

1. Copy env vars into `.env.local`.
2. `npm run dev`
3. Open [http://localhost:3000/login](http://localhost:3000/login)
4. Enter your email → open the link from Supabase (check spam).
5. You should land on `/account` with your email shown.
6. Header should show **Account** instead of **Sign in**.
7. **Sign out** → header returns to **Sign in**; `/upload` still works anonymously.

If magic link fails with redirect errors, verify **Redirect URLs** in Supabase match `NEXT_PUBLIC_SITE_URL` + `/auth/callback`.

## Netlify deploy

1. Add the same env vars in Netlify (scope: **Build** and **Runtime** for Next.js).
2. Set `NEXT_PUBLIC_SITE_URL=https://summify.app` (no trailing slash).
3. Add `https://summify.app/auth/callback` to Supabase redirect allow list.
4. Deploy; test magic link on production domain (some email clients block localhost links).

## Security notes

- Session cookies are refreshed via `middleware.ts` + `@supabase/ssr`.
- `/account` and `/login` use `noindex` metadata.
- API routes (`/api/analyze`, etc.) are **not** gated on auth in Phase 7A.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Header has no Sign in link | Supabase env vars missing at build time |
| “Authentication is not configured” | Set `NEXT_PUBLIC_SUPABASE_*` and rebuild |
| Magic link opens but login fails | Redirect URL mismatch; check Supabase URL config |
| Stuck logged out after link | Clear cookies; confirm middleware runs (not static export) |
