/** How much of a source the analysis model is allowed to read. */

export const FULL_SOURCE_CHAR_LIMIT = 12_000;
export const FREE_ANALYSIS_CHAR_BUDGET = 36_000;
export const FREE_ANALYSIS_WINDOWS = 6;
export const PORTION_USED_NOTICE = "A portion of this source was used.";

export const NOTE_CHUNK_CHARS = 12_000;
export const MAX_NOTE_CHUNKS = 8;

export function sampleEvenWindows(
  text: string,
  budget: number,
  windows = FREE_ANALYSIS_WINDOWS,
  marker = "\n\n[… later in the source …]\n\n",
): string {
  if (text.length <= budget) return text;
  const count = Math.max(2, windows);
  const markerCost = marker.length * (count - 1);
  const slice = Math.max(400, Math.floor((budget - markerCost) / count));
  if (slice <= 0) return text.slice(0, budget);
  if (slice * count >= text.length) return text;

  const parts: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const start = Math.min(
      Math.max(0, text.length - slice),
      Math.floor((index * (text.length - slice)) / (count - 1)),
    );
    parts.push(text.slice(start, start + slice));
  }
  return parts.join(marker);
}

/** Contiguous slices in order. Longer sources use fewer, wider slices so the walk still reaches the end. */
export function splitOrderedChunks(
  text: string,
  chunkChars = NOTE_CHUNK_CHARS,
  maxChunks = MAX_NOTE_CHUNKS,
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= chunkChars) return [trimmed];

  const natural = Math.ceil(trimmed.length / chunkChars);
  const count = Math.min(Math.max(1, maxChunks), natural);
  const size = Math.ceil(trimmed.length / count);
  const parts: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const slice = trimmed.slice(index * size, (index + 1) * size).trim();
    if (slice) parts.push(slice);
  }
  return parts;
}
