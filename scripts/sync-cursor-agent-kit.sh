#!/usr/bin/env bash
# Re-sync skills from cursor-agent-kit (product-agnostic).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KIT_URL="${CURSOR_AGENT_KIT_URL:-https://github.com/mertsavas97-spec/cursor-agent-kit.git}"
TMP="${TMPDIR:-/tmp}/cursor-agent-kit-sync-$$"

cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

echo "→ Cloning kit…"
git clone --depth 1 "$KIT_URL" "$TMP"

copy_tree() {
  local src="$1" dest="$2"
  mkdir -p "$dest"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$src" "$dest"
  else
    rm -rf "$dest"
    mkdir -p "$dest"
    cp -a "$src". "$dest/"
  fi
}

mkdir -p "$ROOT/.agents/skills" "$ROOT/.codex/skills"
echo "→ Sync agents skills…"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude 'cozbil-*/' \
    --exclude 'taksitdefter-*/' \
    --exclude 'workspace-guardian/' \
    "$TMP/skills/agents/" "$ROOT/.agents/skills/"
  rsync -a --delete \
    --exclude 'taksitdefter-*/' \
    "$TMP/skills/codex/" "$ROOT/.codex/skills/"
else
  rm -rf "$ROOT/.agents/skills" "$ROOT/.codex/skills"
  mkdir -p "$ROOT/.agents/skills" "$ROOT/.codex/skills"
  cp -a "$TMP/skills/agents/." "$ROOT/.agents/skills/"
  cp -a "$TMP/skills/codex/." "$ROOT/.codex/skills/"
  rm -rf "$ROOT/.agents/skills"/cozbil-* \
         "$ROOT/.agents/skills"/taksitdefter-* \
         "$ROOT/.agents/skills"/workspace-guardian \
         "$ROOT/.codex/skills"/taksitdefter-*
fi

rm -rf "$ROOT/.agents/skills"/taksitdefter-* \
       "$ROOT/.agents/skills"/workspace-guardian \
       "$ROOT/.agents/skills"/cozbil-* \
       "$ROOT/.codex/skills"/taksitdefter-*

AGENTS_N=$(ls -1d "$ROOT/.agents/skills"/*/ 2>/dev/null | wc -l | tr -d ' ')
CODEX_N=$(ls -1d "$ROOT/.codex/skills"/*/ 2>/dev/null | wc -l | tr -d ' ')

cat > "$ROOT/.cursor-agent-kit.json" << JSON
{
  "kitUrl": "$KIT_URL",
  "project": "portable",
  "syncedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "agentsSkills": $AGENTS_N,
  "codexSkills": $CODEX_N
}
JSON

echo "✓ Synced agents=$AGENTS_N codex=$CODEX_N"
