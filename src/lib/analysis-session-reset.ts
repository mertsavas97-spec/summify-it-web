/**
 * Funnel rule: never wipe analysis results / ghost session before a request completes.
 * Hard reset only on explicit abandon (new analysis, replace source, new file, text edit).
 */

export type AnalysisSessionResetKind = "preserve_until_success" | "abandon_session";

export type AnalysisSessionResetTrigger =
  | "url_analyze"
  | "youtube_analyze"
  | "text_analyze"
  | "retry_analyze"
  | "replace_source"
  | "file_selected"
  | "text_edited";

export function analysisSessionResetForTrigger(
  trigger: AnalysisSessionResetTrigger,
): AnalysisSessionResetKind {
  switch (trigger) {
    case "replace_source":
    case "file_selected":
    case "text_edited":
      return "abandon_session";
    case "url_analyze":
    case "youtube_analyze":
    case "text_analyze":
    case "retry_analyze":
      return "preserve_until_success";
  }
}
