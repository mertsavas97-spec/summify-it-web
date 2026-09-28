/** Bracket timecodes from transcripts, e.g. [0:17] or [1:02:03]. */
const TIMECODE = /\[\s*\d{1,2}:\d{2}(?::\d{2})?\s*\]/g;

export function stripAnalysisTimecodes(text: string): string {
  return text
    .replace(TIMECODE, "")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/[^\S\n]+([,.;:!?])/g, "$1")
    .replace(/^[^\S\n]+/gm, "")
    .trim();
}
