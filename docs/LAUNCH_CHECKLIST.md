# Summify.it — Public beta launch checklist

Use this before the first Netlify production deploy.

## Environment

- [ ] `GROQ_API_KEY` and/or `GEMINI_API_KEY` set in Netlify
- [ ] `RAPIDAPI_KEY` + `RAPIDAPI_HOST` set if YouTube analysis is required
- [ ] `NEXT_PUBLIC_SITE_URL` set to production domain (`https://summify.app`)
- [ ] `.env.local` not committed; `.env.example` matches required keys

## SEO & trust

- [ ] `/robots.txt` allows marketing routes; disallows `/api/` and `/dashboard`
- [ ] `/sitemap.xml` includes `/`, `/upload`, `/pricing`, format pages, and active mode pages
- [ ] Favicon, `icon.png`, `apple-icon.png`, and `/og-default.png` load on production
- [ ] Pricing page states beta is free and checkout is not live
- [ ] Public beta bar visible on all shell pages

## Product smoke test

- [ ] `/upload` — PDF extract + analyze (active mode)
- [ ] `/upload` — Web URL one-click analyze
- [ ] `/upload` — YouTube (if RapidAPI configured)
- [ ] Locked / Pro modes cannot run analysis (UI + API)
- [ ] `/api/status` returns `operational` when analysis keys are set
- [ ] `npm run lint` and `npm run build` pass

## Post-deploy

- [ ] Spot-check canonical URLs on homepage and `/modes`
- [ ] Submit sitemap in Search Console (optional)
- [ ] Monitor Netlify function logs for unexpected errors

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [QA_CHECKLIST.md](./QA_CHECKLIST.md).
