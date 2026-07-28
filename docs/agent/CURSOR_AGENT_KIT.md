# Cursor Agent Portable Kit

Product-agnostic export of agent/skill sets (no app-specific skills).

## Contents

| Path | Purpose |
|------|---------|
| `.agents/skills/` | Domain skills (~275) |
| `.codex/skills/` | OMX skills (~30) |
| `.cursor/skills/` | Spec Kit skills (~10) |
| `.cursor/rules/roles/` | architect / designer / executor / qa / security |
| `.cursor/rules/000-coordinator.mdc` | Always-on coordinator (generic) |
| `.specify/` | Spec Kit templates/scripts (empty memory — add your constitution) |
| `scripts/sync-cursor-agent-kit.sh` | Re-sync from upstream kit |
| `docs/agent/` | Coordinator + roster templates |

**Excluded:** app-specific skills (`cozbil-*`, `taksitdefter-*`), product marketing, project constitution.

**Upstream:** https://github.com/mertsavas97-spec/cursor-agent-kit.git

## Install into a new project

```bash
cd /path/to/your-new-project
unzip ~/Desktop/cursor-agent-portable-kit.zip
```

Then:

1. Write your `PROJECT_BRIEF.md` / Spec Kit constitution.
2. Adapt `docs/agent/TEAM_ROSTER.md` to your product.
3. Optional: `bash scripts/sync-cursor-agent-kit.sh` to refresh from upstream.
4. Open in Cursor and paste `docs/agent/OPENING_PROMPT.md`.

## Verify

```bash
ls .agents/skills | wc -l
ls .codex/skills | wc -l
ls .cursor/skills
test ! -d .agents/skills/cozbil-guardian && echo "no app-specific skills OK"
```
