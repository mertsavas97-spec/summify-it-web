/**
 * Phase 11C — strip generic filler that reads like hallucinated meta-commentary.
 * Applied post-generation for student cognitive plans only.
 */

const LINE_PATTERNS: RegExp[] = [
  /\bfurther research is needed\b/i,
  /\breaders may want to\b/i,
  /\byou may want to\b/i,
  /\bpotential risk\b/i,
  /\bconsider (potential )?bias\b/i,
  /\bcomprehensive understanding\b/i,
  /\bactionable next steps\b/i,
  /\bit is important to note\b/i,
  /\bgenerally speaking\b/i,
  /\bin today's (world|environment)\b/i,
];

/** True if string is mostly generic filler (whole bullet). */
export function isGenericHallucinationLine(text: string): boolean {
  const t = text.trim();
  if (t.length < 24) return false;
  return LINE_PATTERNS.some((p) => p.test(t));
}

export function filterHallucinationBullets(lines: string[]): string[] {
  return lines.filter((line) => !isGenericHallucinationLine(line));
}

/** Remove sentences matching patterns from prose (paragraph-level). */
export function filterHallucinationSummary(summary: string): string {
  const parts = summary.split(/(?<=[.!?])\s+/).filter((s) => {
    const t = s.trim();
    if (!t) return false;
    return !LINE_PATTERNS.some((p) => p.test(t));
  });
  const joined = parts.join(" ").trim();
  return joined.length > 40 ? joined : summary.trim();
}
