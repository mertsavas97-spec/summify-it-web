import type { ExtractionMetadata } from "@/types/extraction";
import type { IntelligenceModeId } from "@/types/modes";
import type { WorkspaceInputMode } from "@/types/extraction";

/** Titles/filenames that usually mean lecture, exam, or coursework — prefer Study. */
export const EDUCATIONAL_SOURCE_PATTERN =
  /lecture|lesson|tutorial|course|exam|midterm|final\b|homework|assignment|textbook|study\b|class\b|seminar|workshop|syllabus|problem.?set|worked.?example|calculus|algebra|physics|chemistry|biology|anatomy|geometry|trigonometry|statistics|linear.?algebra|organic.?chem|literature|literary|poem|poetry|novel|prose|shakespeare|history|historical|civil.?war|revolution|dynasty|empire|chronology|edebiyat|tarih|ders|sınav|konu.?anlat|eğitim|math|matematik|geometri|what is algebra|basics:/i;

/** Exclude entertainment/cinema/entertainment content from educational detection. */
export const NON_EDUCATIONAL_EXCLUSION_PATTERN =
  /cinema|movie|film|trailer|(movie|film|game|show|series|season|episode).?review|reaction|commentary|analysis.?of|breakdown|ending.?explained|recap|theory|easter.?egg|hidden.?detail|fan.?theory|marvel|dc|netflix|disney|pixar|anime|manga|gameplay|walkthrough|let.?s.?play|speedrun|tier.?list|ranking|top.?\d+|best.?movies?|worst.?movies?|coming.?soon|box.?office|rotten.?tomatoes|imdb|metacritic/i;

/** STEM / math-science lecture signals (not literature/history). */
export const STEM_DISCIPLINE_PATTERN =
  /calculus|algebra|physics|chemistry|biology|anatomy|geometry|trigonometry|statistics|linear.?algebra|organic.?chem|math|matematik|geometri|formula|equation|theorem|molecule|cell|genome|experiment|hypothesis|algorithm|proof\b|derivative|integral|vector|matrix/i;

/** Literature / narrative study signals. */
export const LITERARY_DISCIPLINE_PATTERN =
  /literature|literary|poem|poetry|novel|prose|shakespeare|protagonist|metaphor|stanza|narrator|symbolism|playwright|edebiyat|roman\b|şiir/i;

/** History study signals. */
export const HISTORICAL_DISCIPLINE_PATTERN =
  /history|historical|civil.?war|world.?war|cold.?war|revolution|dynasty|empire|century|treaty|colonial|chronology|archaeolog|tarih|osmanlı|ottoman/i;

export type StudyDiscipline = "scientific" | "literary" | "historical";

export function educationalHaystackFromSource(input: {
  inputMode?: WorkspaceInputMode;
  metadata?: ExtractionMetadata | null;
  fileName?: string | null;
  titleHint?: string | null;
  /** Transcript / body snippet when title is missing or generic (e.g. YouTube id fallback). */
  textSnippet?: string | null;
}): string {
  const meta = input.metadata;
  const parts: string[] = [input.fileName ?? "", input.titleHint ?? ""];

  if (meta) {
    if (meta.sourceKind === "youtube") {
      parts.push(meta.title ?? "", meta.sourceUrl);
    } else if (meta.sourceKind === "url") {
      parts.push(meta.title, meta.siteName ?? "", meta.sourceUrl);
    } else if (meta.sourceKind === "file") {
      parts.push(meta.fileName);
    } else if (meta.sourceKind === "presentation") {
      parts.push(meta.fileName, ...(meta.detectedSlideTitles ?? []).slice(0, 8));
    }
  }

  const snippet = input.textSnippet?.trim();
  if (snippet) {
    parts.push(snippet.slice(0, 4_000));
  }

  return parts.filter(Boolean).join(" ");
}

export function looksLikeEducationalSource(input: {
  inputMode?: WorkspaceInputMode;
  metadata?: ExtractionMetadata | null;
  fileName?: string | null;
  titleHint?: string | null;
  textSnippet?: string | null;
}): boolean {
  const haystack = educationalHaystackFromSource(input);
  if (NON_EDUCATIONAL_EXCLUSION_PATTERN.test(haystack)) return false;
  return EDUCATIONAL_SOURCE_PATTERN.test(haystack);
}

/** Title + snippet check for cognition profiling (no ExtractionMetadata required). */
export function looksLikeEducationalText(title: string, textSnippet = ""): boolean {
  const haystack = `${title}\n${textSnippet.slice(0, 4_000)}`;
  if (NON_EDUCATIONAL_EXCLUSION_PATTERN.test(haystack)) return false;
  return EDUCATIONAL_SOURCE_PATTERN.test(haystack);
}

/**
 * Pick study discipline from title/snippet.
 * STEM wins over lit/history when STEM keywords present; otherwise highest signal.
 * Default scientific when educational but no discipline keywords.
 */
export function inferStudyDiscipline(
  title: string,
  textSnippet = "",
): StudyDiscipline {
  const haystack = `${title}\n${textSnippet.slice(0, 4_000)}`;
  const stem = STEM_DISCIPLINE_PATTERN.test(haystack) ? 2 : 0;
  const literary = LITERARY_DISCIPLINE_PATTERN.test(haystack) ? 2 : 0;
  const historical = HISTORICAL_DISCIPLINE_PATTERN.test(haystack) ? 2 : 0;

  if (stem >= literary && stem >= historical && stem > 0) return "scientific";
  if (literary >= historical && literary > 0) return "literary";
  if (historical > 0) return "historical";
  return "scientific";
}

export function isStudyPersonaModeId(modeId: string | undefined | null): boolean {
  if (!modeId) return false;
  return (
    modeId === "the-student" ||
    modeId === "exam-prep" ||
    modeId === "flashcard-builder" ||
    modeId === "quiz-generator" ||
    modeId === "concept-explainer" ||
    modeId === "smart-notes"
  );
}

/**
 * When the user keeps Creator on lecture/exam content, surface a soft lens warning.
 */
export function getEducationalCreatorModeWarning(input: {
  modeId: IntelligenceModeId;
  inputMode?: WorkspaceInputMode;
  metadata?: ExtractionMetadata | null;
  fileName?: string | null;
  textSnippet?: string | null;
}): string | null {
  if (input.modeId !== "the-creator") return null;
  if (!looksLikeEducationalSource(input)) return null;
  return "This looks like lecture or study material. Creator emphasizes hooks and narrative — switch to The Student for definitions, formulas, and practice-ready cards.";
}
