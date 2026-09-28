/** Q/A delimiter used by study cards (`question\n---\nanswer`). */
const QUIZ_DELIMITER = "\n---\n";

function normalizeForCompare(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase().replace(/…$/, "");
}

/**
 * Tap-to-read text assembly. The question half of a card must never render
 * cut mid-sentence, so:
 * - quiz content is split on the Q/A delimiter (no raw `---` rule mid-text),
 * - the untruncated title becomes the heading,
 * - detail text that already opens with that title is shown once, not twice.
 */
export function splitReaderText(
  detail: string,
  fullTitle: string,
): { heading: string; body: string } {
  const titleKey = normalizeForCompare(fullTitle);

  if (detail.includes(QUIZ_DELIMITER)) {
    const [question = "", ...rest] = detail.split(QUIZ_DELIMITER);
    const questionText = question.trim();
    const answer = rest.join(QUIZ_DELIMITER).trim();
    const sameQuestion = Boolean(questionText) && titleKey === normalizeForCompare(questionText);
    if (sameQuestion) return { heading: questionText, body: answer };
    return {
      heading: fullTitle,
      body: [questionText, answer].filter(Boolean).join("\n\n"),
    };
  }

  if (titleKey && normalizeForCompare(detail).startsWith(titleKey)) {
    return { heading: "", body: detail };
  }
  return { heading: fullTitle, body: detail };
}
