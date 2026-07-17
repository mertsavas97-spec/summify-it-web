# Team Roster & Skill Map

> Koordinatör her sprint/task başında bu dosyayı okur.

## Ekipler

| Ekip ID | Ad | Sorumluluk | Lead skill(ler) |
|---------|-----|------------|-----------------|
| `product` | Product & Copy | PRD, wording, freemium, AI summary UX | `product-discovery`, `pricing-strategy`, `copywriting` |
| `design` | Design & UX | DESIGN.md, tokens, onboarding, dashboard UI | `$design`, `ui-design-system`, `design-system` |
| `frontend` | Web Frontend | Next.js App Router, React, Tailwind, accessibility | `senior-frontend`, `senior-fullstack` |
| `backend` | API & Integrations | AI APIs, Supabase, Vercel Blob, document processing | `senior-backend`, `api-design-reviewer` |
| `growth` | Growth & Launch | SEO, funnel, landing pages, paywall | `launch-strategy`, `programmatic-seo`, `paywall-upgrade-cro` |
| `qa` | QA & Release | Typecheck, lint, smoke, regression review | `code-reviewer`, `ship-gate`, `senior-qa` |
| `security` | Security & Privacy | Secrets, auth, file upload, data handling | `ai-security`, `cloud-security`, `dependency-auditor` |
| `guardian` | Product Guardian | Scope, claims, privacy/regulatory copy drift | `adversarial-reviewer`, `named-persona-adversarial-review` |

## OMX (`.codex/skills/`)

| Skill | Ne zaman |
|-------|----------|
| `$plan` / `$ralplan` | Epic, mimari, sprint planı |
| `$deep-interview` | Belirsiz istek |
| `$design` | UI/ürün tasarım contract |
| `$analyze` | Read-only repo analizi |
| `$ralph` / `$team` | Paralel çok dosyalı iş |
| `$code-review` | Diff review |
| `$ask` | Harici ikinci görüş (CLI varsa) |

## Domain (`.agents/skills/`) — sık kullanılanlar

`product-discovery`, `senior-frontend`, `senior-fullstack`, `senior-backend`, `api-design-reviewer`, `programmatic-seo`, `schema-markup`, `pricing-strategy`, `code-reviewer`, `dependency-auditor`, `ai-security`, `ship-gate`, `paywall-upgrade-cro`

Tam liste: proje kökünde `.agents/skills/*/SKILL.md` (kit’ten bootstrap ile gelir).

## Routing

1. Skill eşleşmesi varsa → `SKILL.md` oku → uygula.
2. Yoksa → skill bypass (typo, tek satır fix).
3. QA Gate her kapanışta (COORDINATOR.md).
4. Guardian: finans/sağlık/yasal copy’de veto.
5. Kullanıcıya sadece Koordinatör konuşur.
