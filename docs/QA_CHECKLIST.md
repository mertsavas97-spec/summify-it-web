# Summify.it — Manual QA Checklist

Use this before launch, SEO, or payments. Test in **production build** when possible: `npm run build && npm run start`.

## Environment

- [ ] `GROQ_API_KEY` and/or `GEMINI_API_KEY` set on server
- [ ] `RAPIDAPI_KEY` + `RAPIDAPI_HOST` set for YouTube
- [ ] `.env.local` not committed

---

## File upload — PDF

- [ ] Upload a normal PDF → extraction succeeds
- [ ] Metadata: type, pages/chars, complexity
- [ ] Active mode → Run analysis → summary + Learn cards
- [ ] Compact “Extracted text ready” strip; expand editor works
- [ ] Re-run analysis works

## File upload — DOCX

- [ ] Same as PDF with a `.docx` file

## File upload — TXT

- [ ] Upload `.txt` with ≥100 characters
- [ ] Analysis completes

## File upload — PPTX

- [ ] Upload `.pptx` deck
- [ ] Slide count / outline in preview panel
- [ ] Analysis completes; learn cards present

## Text input

- [ ] Text tab → paste ≥100 characters
- [ ] Run analysis without file upload
- [ ] Below minimum shows disabled analyze / clear message

## Web URL (one-click)

- [ ] **Analyze Web Article** runs extract + analyze in one step
- [ ] Loading stages: Fetching → Cleaning → Profiling → Analyzing → Learn
- [ ] Preview: Web Article, title, URL, reading time, disclaimer
- [ ] **Article ready** strip; text hidden until “View / edit article text”
- [ ] Extract fail → friendly error, no analysis
- [ ] Extract OK + analyze fail → article kept, **Retry analysis** works

## YouTube (one-click)

- [ ] **Analyze YouTube Video** one-click flow
- [ ] Transcript metadata in preview
- [ ] Retry after analyze failure
- [ ] Video without captions → clear transcript error

---

## Intelligence modes — active

For each active mode, run analysis on a short document:

- [ ] Executive Brief
- [ ] The Student
- [ ] The Creator
- [ ] Contract Analyzer

- [ ] Preview panel **Intelligence lens** matches workspace selection

## Intelligence modes — locked / coming soon

- [ ] Open 29-mode palette → locked modes visible with Pro badge
- [ ] Select locked mode → Pro message; Run analysis disabled
- [ ] URL/YouTube one-click does not analyze while locked mode selected
- [ ] Coming soon modes not selectable
- [ ] Direct API POST with locked `mode` → 400 with safe message

## Legacy API (optional)

- [ ] POST `/api/analyze` with `mode: "executive"` still works (maps to Executive Brief)

---

## Provider fallback

- [ ] With only Groq configured: analysis works
- [ ] With Groq failing / invalid: Gemini fallback (if configured)
- [ ] User sees generic failure message, not API keys or stack traces
- [ ] Dev-only debug block visible only in development

---

## Invalid / edge inputs

- [ ] Empty file upload → clear error
- [ ] Unsupported extension (e.g. `.zip`) → unsupported message
- [ ] File over size limit → too large message
- [ ] Empty analyze text → input message
- [ ] Text under 100 chars → too short message
- [ ] Text over max chars → too long message
- [ ] Invalid URL format → valid URL message
- [ ] Blocked host (e.g. localhost URL) → blocked message
- [ ] Paywalled / empty article URL → extraction failed message

---

## Loading & state

- [ ] No duplicate conflicting loaders (file extract vs URL pipeline vs analyze)
- [ ] No fake percentages on loading stages
- [ ] Switching input tabs doesn't leave orphan loading states
- [ ] Retry buttons disabled while pipeline busy

---

## Responsive

- [ ] **Desktop** (≥1280px): two-column layout, sticky preview OK
- [ ] **Tablet** (~768px): layout stacks; no horizontal overflow
- [ ] **Mobile** (~375px): tabs wrap; mode selector card readable; modal fits viewport
- [ ] Intelligence mode modal scrolls; search usable on small screens

---

## Accessibility (basics)

- [ ] Form fields have visible labels (URL, file, search in mode palette)
- [ ] Mode selector trigger has accessible name
- [ ] Expand/collapse “View / edit text” has `aria-expanded`
- [ ] Disabled analyze button when mode locked or input invalid
- [ ] Esc closes intelligence mode dialog

---

## Security & production

- [ ] No API keys in browser network responses or page source
- [ ] Production build: no prompt/response content in server logs (check deploy logs)
- [ ] Error messages non-technical for end users

---

## Build / deploy readiness

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `/`, `/upload`, `/pricing`, `/dashboard` load without hydration errors
- [ ] API routes return JSON (no HTML error pages for API)

---

## Sign-off

| Tester | Date | Build / commit | Notes |
|--------|------|----------------|-------|
|        |      |                |       |
