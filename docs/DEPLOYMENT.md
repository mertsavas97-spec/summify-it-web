# Summify.it — Deployment Guide

## Local development

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` in the project root (never commit this file):

```env
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=youtube-transcript3.p.rapidapi.com
```

Optional:

```env
RAPIDAPI_YOUTUBE_PATH=/api/transcript
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Copy `.env.example` to `.env.local` and fill in values.

4. Run the dev server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000). Upload workspace: [http://localhost:3000/upload](http://localhost:3000/upload).

---

## Production build

```bash
npm run lint
npm run build
npm run start
```

`npm run build` runs Next.js production compilation and type checking. Use the same Node version locally and on your host (Node 20+ recommended).

---

## Netlify

Summify.it uses **Next.js App Router** with server routes (`/api/extract`, `/api/analyze`, etc.). Use Netlify’s **Next.js runtime** (or deploy as a Node server).

1. Connect the Git repository in Netlify.
2. Build settings (typical):
   - **Build command:** `npm run build`
   - **Publish directory:** leave default for Next.js plugin (usually `.next` handled by `@netlify/plugin-nextjs`)
3. Install the official **Netlify Next.js plugin** if not auto-detected.
4. Set environment variables in **Site settings → Environment variables** (same keys as `.env.local`).
5. Deploy. Verify API routes on the deployed URL:
   - `POST /api/extract`
   - `POST /api/analyze`

### Custom domain

After the first successful deploy:

1. Netlify → **Domain management** → add your domain.
2. Configure DNS (Netlify DNS or external CNAME/A records).
3. Enable HTTPS (automatic with Let’s Encrypt).

---

## Required environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | At least one of Groq/Gemini | Primary analysis provider |
| `GEMINI_API_KEY` | At least one of Groq/Gemini | Fallback analysis provider |
| `RAPIDAPI_KEY` | For YouTube | Transcript API authentication |
| `RAPIDAPI_HOST` | For YouTube | RapidAPI host (e.g. `youtube-transcript3.p.rapidapi.com`) |
| `RAPIDAPI_YOUTUBE_PATH` | No | Override transcript API path |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical URLs, `/sitemap.xml`, Open Graph, and JSON-LD (`https://www.summify.app`) |

All API keys are **server-only**. They must not be prefixed with `NEXT_PUBLIC_`.

### Health check

- `GET /api/status` — JSON service status (configured providers only, no secrets)
- `/status` — Human-readable status page (noindex)

---

## Security checklist

- **Never commit** `.env.local` or real API keys.
- Add `.env.local` to `.gitignore` (already standard).
- Rotate keys if exposed.
- Production logs should not include prompts, model responses, or secrets (see `src/server/logging.ts`).
- User-facing errors are generic; technical detail is dev-only (`NODE_ENV === "development"`).

---

## Post-deploy smoke test

1. Open `/upload`.
2. Upload a small PDF with an **active** intelligence mode → analysis succeeds.
3. Test one Web URL and one YouTube URL if RapidAPI is configured.
4. Confirm locked modes cannot analyze from the UI.
5. Check Netlify function logs for unexpected errors (no full prompt dumps).

See [QA_CHECKLIST.md](./QA_CHECKLIST.md) for full manual QA and [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) before go-live.
