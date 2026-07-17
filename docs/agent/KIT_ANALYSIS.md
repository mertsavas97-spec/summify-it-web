# Agent Kit Analysis

## Source

- Archive: `/Users/mert/Desktop/cursor-agent-kit.zip`
- Installed into this repository on 2026-07-17.
- Filtered out macOS metadata and nested zip bundles: `__MACOSX`, `.DS_Store`, `._*`, `cursor-agent-kit/zips`, `*.zip`.

## Installed Sets

| Set | Target | Installed Count | Purpose |
|-----|--------|-----------------|---------|
| Cursor agent skills | `.agents/skills/` | 244 skill directories | Domain and role-specific task execution |
| Codex / OMX skills | `.codex/skills/` | 36 top-level entries | Planning, analysis, QA, orchestration workflows |
| Coordinator rules | `.cursor/rules/koordinator.mdc` | 1 rule | Always-on coordinator behavior |
| Coordinator docs | `docs/agent/` | 4 docs | Routing, opening prompt, roster, kit analysis |

## Coordinator Model

The user talks to Koordinatör only. Koordinatör classifies each request, reads the relevant skill file when a match exists, coordinates any sub-work, and reports a single merged result.

Recommended routing for Summify:

- Product, pricing, and copy: `product-discovery`, `pricing-strategy`, `copywriting`
- UI, onboarding, and design system: `$design`, `ui-design-system`, `design-system`
- Next.js and React implementation: `senior-frontend`, `senior-fullstack`
- API, AI, Supabase, and storage work: `senior-backend`, `api-design-reviewer`
- SEO and growth: `programmatic-seo`, `schema-markup`, `launch-strategy`
- Security and privacy: `ai-security`, `cloud-security`, `dependency-auditor`
- QA and release checks: `code-reviewer`, `ship-gate`, `senior-qa`
- Scope and claims review: `adversarial-reviewer`, `named-persona-adversarial-review`

## Required Closeout

Every meaningful task ends with the QA Gate from `docs/agent/COORDINATOR.md`:

1. Typecheck or explicit `N/A`
2. Lint or explicit `N/A`
3. Smoke check for the critical path
4. Error scrub for new crashes or console errors
5. Guardian review when product, legal, privacy, health, finance, or AI claims are involved

Koordinatör should then write a Sprint Agent Raporu with used teams, skill sets, lanes, QA results, and the next recommended step.
