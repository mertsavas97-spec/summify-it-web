/**
 * Normalizes extracted document text for analysis and profiling.
 */

export function cleanText(raw: string): string {
  let text = raw.normalize("NFC");

  text = text
    .replace(/\u00AD/g, "")
    .replace(/\uFFFD/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/([a-zA-Z])-\s*\n\s*([a-z])/g, "$1$2")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[Content truncated for analysis limits.]`;
}
