type BuildGuestPreviewScriptInput = {
  title: string;
  keyInsights: string[];
  intelligenceModeLabel: string;
  documentProfile: string;
};

const PREVIEW_WORD_MIN = 80;
const PREVIEW_WORD_MAX = 120;

function normalizeLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).map((w) => w.trim()).filter(Boolean).length;
}

function clampWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}.`;
}

export function buildGuestPreviewScript({
  title,
  keyInsights,
  intelligenceModeLabel,
  documentProfile,
}: BuildGuestPreviewScriptInput): { script: string; wordCount: number } {
  const cleanedInsights = keyInsights.map(normalizeLine).filter(Boolean).slice(0, 3);
  const insightPrimary = cleanedInsights[0] ?? "the core argument and why it matters";
  const insightSecondary = cleanedInsights[1] ?? "the strongest supporting evidence";
  const insightTertiary = cleanedInsights[2] ?? "the practical action you can apply immediately";

  const draft = [
    `This ${documentProfile} on "${normalizeLine(title)}" is best understood as a ${intelligenceModeLabel.toLowerCase()} lesson about priorities and consequences.`,
    `The central takeaway is ${insightPrimary}.`,
    `It then highlights ${insightSecondary}, and connects that to ${insightTertiary}.`,
    "As you listen, focus on what to remember, what to question, and what to do next.",
    "Let’s continue in full Audio Study Mode for the complete teacher-style walkthrough.",
  ].join(" ");

  const paddedDraft = countWords(draft) < PREVIEW_WORD_MIN
    ? `${draft} You will leave with a clear mental model, key terms to retain, and a practical next step you can apply right away.`
    : draft;

  const script = clampWords(paddedDraft, PREVIEW_WORD_MAX);
  return { script, wordCount: countWords(script) };
}