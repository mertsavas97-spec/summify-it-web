import type { AnalysisResult } from "@/types/text-analysis";

export type AnalysisExportContext = {
  sourceKind?: string | null;
  intelligenceMode?: string | null;
  sourceLabel?: string | null;
  exportedAt?: string;
};

export type AnalysisExportJson = {
  format: "summify-analysis-v1";
  exportedAt: string;
  sourceKind: string | null;
  intelligenceMode: string | null;
  title: string;
  summary: string;
  keyInsights: string[];
  risksOrWarnings: string[];
  actionItems: string[];
  learnCards: AnalysisResult["learnCards"];
};

function learnCardSection(cards: AnalysisResult["learnCards"]): string[] {
  if (cards.length === 0) return [];
  return [
    "",
    "## Learn cards",
    "",
    ...cards.flatMap((card) => [
      `### ${card.title} (${card.type})`,
      "",
      card.content,
      "",
    ]),
  ];
}

export function buildMarkdownExport(
  result: AnalysisResult,
  ctx: AnalysisExportContext = {},
): string {
  const lines = [
    `# ${result.title}`,
    "",
    ctx.sourceKind ? `**Source:** ${ctx.sourceKind}` : null,
    ctx.intelligenceMode ? `**Mode:** ${ctx.intelligenceMode}` : null,
    "",
    "## Summary",
    "",
    result.summary,
    "",
    "## Key insights",
    "",
    ...result.keyInsights.map((i) => `- ${i}`),
  ].filter((line): line is string => line != null);

  if (result.risksOrWarnings.length > 0) {
    lines.push("", "## Risks & warnings", "", ...result.risksOrWarnings.map((i) => `- ${i}`));
  }
  if (result.actionItems.length > 0) {
    lines.push("", "## Action items", "", ...result.actionItems.map((i) => `- ${i}`));
  }

  lines.push(...learnCardSection(result.learnCards));
  lines.push("", "---", "", "_Exported from Summify — structured intelligence, not raw uploads._");

  return lines.join("\n");
}

export function buildTxtExport(
  result: AnalysisResult,
  ctx: AnalysisExportContext = {},
): string {
  return buildMarkdownExport(result, ctx)
    .replace(/^# /gm, "")
    .replace(/^## /gm, "")
    .replace(/^### /gm, "")
    .replace(/\*\*/g, "");
}

export function buildJsonExport(
  result: AnalysisResult,
  ctx: AnalysisExportContext = {},
): string {
  const payload: AnalysisExportJson = {
    format: "summify-analysis-v1",
    exportedAt: ctx.exportedAt ?? new Date().toISOString(),
    sourceKind: ctx.sourceKind ?? null,
    intelligenceMode: ctx.intelligenceMode ?? null,
    title: result.title,
    summary: result.summary,
    keyInsights: result.keyInsights,
    risksOrWarnings: result.risksOrWarnings,
    actionItems: result.actionItems,
    learnCards: result.learnCards,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function sanitizeExportFilename(title: string): string {
  const base = title
    .trim()
    .slice(0, 60)
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return base || "summify-analysis";
}
