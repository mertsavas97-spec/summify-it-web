import {
  ANALYSIS_OUTPUT_LANGUAGE_RULES,
  SOURCE_INPUT_LANGUAGE_NOTE,
} from "@/server/ai/output-language";
import { formatDocumentTypeLabel } from "./documentTypes";
import type {
  AdaptiveAnalysisPlan,
  AnalyzeSourceContext,
  DocumentProfile,
  KnowledgeLayer,
} from "./types";
import { formatInsightQuotaLine } from "./sourceOutputQuota";
import type { TextAnalysisMode } from "@/server/ai/schemas";
import {
  FREE_ANALYSIS_CHAR_BUDGET,
  FREE_ANALYSIS_WINDOWS,
  FULL_SOURCE_CHAR_LIMIT,
  sampleEvenWindows,
} from "@/lib/analysis/sourceCoverage";

function formatProfileBlock(profile: DocumentProfile): string {
  const typeLabel = formatDocumentTypeLabel(profile.documentTypeGuess);
  return [
    "DOCUMENT PROFILE (heuristic):",
    `- Type: ${typeLabel} (${profile.documentTypeGuess})`,
    `- Complexity: ${profile.complexity}`,
    `- Structure: ${profile.structureQuality}`,
    `- Source quality: ${profile.sourceQuality}`,
    `- Reading time: ~${profile.estimatedReadingTimeMinutes} min`,
    `- Signals: ${profile.detectedSignals.join("; ") || "none"}`,
    `- Suggested mode alignment: ${profile.suggestedMode}`,
    profile.sourceQualityNote ? `- Note: ${profile.sourceQualityNote}` : "",
    profile.needsChunking
      ? "- Note: long-form content is covered in order, within the plan budget."
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatGroundingBlock(layer: KnowledgeLayer): string {
  const sectionNames = layer.keySections.slice(0, 6).map((s) => s.heading);
  return [
    "SOURCE GROUNDING (use these in your output):",
    "- Cite concrete entities, brand names, section titles, numbers, and dates from below.",
    "- Interpret excerpts in any source language; write analysis in fluent English.",
    "- Reuse proper nouns and official titles in original spelling; do not substitute vague corporate language.",
    layer.namedEntities.length
      ? `Named entities / brands: ${layer.namedEntities.join(", ")}`
      : "",
    sectionNames.length ? `Section names: ${sectionNames.join("; ")}` : "",
    layer.distinctivePhrases.length
      ? `Distinctive phrases / figures: ${layer.distinctivePhrases.join(" | ")}`
      : "",
    "Avoid unless explicitly in source: engaging experience, enhance productivity, improve engagement, drive innovation, best practices, leverage synergies.",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatKnowledgeBlock(layer: KnowledgeLayer): string {
  const sections = layer.keySections
    .slice(0, 6)
    .map((s) => `### ${s.heading} (${s.importance})\n${s.excerpt}`)
    .join("\n\n");

  return [
    "KNOWLEDGE LAYER (compressed, deterministic):",
    `Title guess: ${layer.titleGuess}`,
    `Overview: ${layer.compressedOverview}`,
    `Topics: ${layer.detectedTopics.join(", ") || "n/a"}`,
    layer.warnings.length ? `Warnings: ${layer.warnings.join(" ")}` : "",
    sections ? `Key sections:\n${sections}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function sampleAcrossSource(
  text: string,
  budget: number,
  marker = "\n\n[… later in the source …]\n\n",
): string {
  if (text.length <= budget) return text;
  const sliceBudget = Math.max(800, Math.floor((budget - marker.length * 2) / 3));
  const midStart = Math.max(0, Math.floor(text.length / 2) - Math.floor(sliceBudget / 2));
  const head = text.slice(0, sliceBudget);
  const middle = text.slice(midStart, midStart + sliceBudget);
  const tail = text.slice(-sliceBudget);
  return [head, middle, tail].join(marker);
}

function formatYoutubeSourceBlock(
  ctx: Extract<AnalyzeSourceContext, { sourceKind: "youtube" }>,
  mode: TextAnalysisMode,
): string {
  const lines = [
    "YOUTUBE TRANSCRIPT SOURCE (spoken video — NOT a polished article; transcript may be any language):",
    "- Write analysis in English; preserve names and brands from the transcript.",
    `- Video ID: ${ctx.videoId}`,
    ctx.title ? `- Video title: ${ctx.title}` : "",
    ctx.estimatedDurationMinutes
      ? `- Approx. duration: ${ctx.estimatedDurationMinutes} min`
      : "",
    ctx.transcriptSegmentCount
      ? `- Transcript segments: ${ctx.transcriptSegmentCount}`
      : "",
    "- Organize messy speech into structured insight; do not treat this as an article rewrite.",
    '- BANNED narrator framing: "the video discusses…", "the speaker talks about…", "this video covers…".',
    "- Write summary/keyInsights as editorial or lecture intelligence — state claims and argument flow directly.",
    "- Prefer: thesis, argument chain, tensions, evidence, clip-worthy moments, misconceptions.",
    "- Do not write timecodes in any field. Omit [m:ss] and [h:mm:ss] from title, summary, insights, risks, actions, and learn cards.",
  ];

  if (ctx.importantMoments && ctx.importantMoments.length > 0) {
    lines.push("- Notable moments (use as anchors; verify against transcript):");
    for (const m of ctx.importantMoments.slice(0, 10)) {
      lines.push(`  · [${m.time}] ${m.snippet}`);
    }
  }

  const modeNotes: Record<TextAnalysisMode, string> = {
    executive:
      "Mode emphasis: strategic takeaways, decisions/implications, useful lessons — not play-by-play recap.",
    academic:
      "Mode emphasis: concepts, argument structure, tensions/contradictions, misconceptions — study notes, not recap. No vague moral advice.",
    creator:
      "Mode emphasis: hooks, clip-worthy beats, narrative tension, repurposable angles — no generic social-media marketing advice.",
    legal:
      "Mode emphasis: only summarize contract, policy, or regulatory material if the transcript actually contains it; otherwise note in risksOrWarnings that this mode may not fit this transcript.",
  };

  lines.push(modeNotes[mode]);
  return lines.filter(Boolean).join("\n");
}

function formatPresentationSourceBlock(
  ctx: Extract<AnalyzeSourceContext, { sourceKind: "presentation" }>,
  mode: TextAnalysisMode,
): string {
  const lines = [
    "PRESENTATION DECK SOURCE (slide deck — NOT a prose document; slides may be any language):",
    "- Write analysis in English; abstract slide labels into clear English themes.",
    `- File: ${ctx.fileName}`,
    `- Slides: ${ctx.slideCount}`,
    ctx.detectedSlideTitles.length
      ? `- Slide titles: ${ctx.detectedSlideTitles.slice(0, 8).join(" | ")}`
      : "",
    ctx.repeatedThemes.length
      ? `- Repeated themes: ${ctx.repeatedThemes.join(", ")}`
      : "",
    "- Infer structure from slide order; do not treat bullet fragments as full paragraphs.",
    "- Identify: core narrative, logic gaps, repeated themes, missing proof/KPIs, audience fit, slide flow, strategic clarity.",
  ];

  if (ctx.slideOutline.length > 0) {
    lines.push("- Slide outline (ordered):");
    for (const slide of ctx.slideOutline.slice(0, 8)) {
      const label = slide.title
        ? `Slide ${slide.slideNumber}: ${slide.title}`
        : `Slide ${slide.slideNumber}`;
      lines.push(`  · ${label}`);
    }
  }

  const modeNotes: Record<TextAnalysisMode, string> = {
    executive:
      "Mode emphasis: decision usefulness, strategic clarity, business implications, missing KPIs/proof.",
    academic:
      "Mode emphasis: lecture structure, concepts, learning flow, weak explanations, tensions in the argument.",
    creator:
      "Mode emphasis: storytelling arc, hooks, visual/narrative potential, campaign angles, content moments.",
    legal:
      "Mode emphasis: only if deck contains contractual, policy, or regulatory terms; otherwise note this mode may not fit.",
  };

  lines.push(modeNotes[mode]);
  return lines.filter(Boolean).join("\n");
}

export type CompactPromptOptions = {
  isYoutubeTranscript?: boolean;
  isPresentation?: boolean;
  sourceContext?: AnalyzeSourceContext;
  analysisMode?: TextAnalysisMode;
  cognitionPromptBlock?: string;
  /** Paid long sources: ordered notes replace the raw text in the final call. */
  orderedSourceNotes?: string;
};

/**
 * Builds the user message sent to Groq/Gemini based on adaptive plan.
 */
export function compactPromptInput(
  cleanedText: string,
  profile: DocumentProfile,
  knowledgeLayer: KnowledgeLayer,
  plan: AdaptiveAnalysisPlan,
  options?: CompactPromptOptions,
): { compactedCharacterCount: number; userPrompt: string; analysisSourceText: string } {
  const profileBlock = formatProfileBlock(profile);
  const youtubeBlock =
    options?.isYoutubeTranscript && options.sourceContext?.sourceKind === "youtube"
      ? formatYoutubeSourceBlock(
          options.sourceContext,
          options.analysisMode ?? profile.suggestedMode,
        )
      : options?.isYoutubeTranscript
        ? [
            "SOURCE CONTEXT:",
            "- Spoken video/podcast TRANSCRIPT (not a polished article).",
            "- Organize messy speech into structured insight.",
          ].join("\n")
        : "";

  const presentationBlock =
    options?.isPresentation && options.sourceContext?.sourceKind === "presentation"
      ? formatPresentationSourceBlock(
          options.sourceContext,
          options.analysisMode ?? profile.suggestedMode,
        )
      : options?.isPresentation
        ? [
            "SOURCE CONTEXT:",
            "- Slide deck / presentation (not a prose document).",
            "- Infer narrative from slide order; avoid paragraph-style recap of bullets.",
          ].join("\n")
        : "";

  const groundingBlock = formatGroundingBlock(knowledgeLayer);
  const knowledgeBlock = formatKnowledgeBlock(knowledgeLayer);
  const cognitionBlock = options?.cognitionPromptBlock?.trim() ?? "";

  const prefix = [
    SOURCE_INPUT_LANGUAGE_NOTE,
    profileBlock,
    cognitionBlock,
    youtubeBlock,
    presentationBlock,
  ]
    .filter(Boolean)
    .join("\n\n");

  const notes = options?.orderedSourceNotes?.trim();
  const videoMarker = "\n\n[… later in the video …]\n\n";
  let sourceNote: string;
  let sourceText: string;

  if (notes) {
    sourceNote =
      "SOURCE NOTES — ordered parts from the start of the source through the end. Write the analysis from every part, not only the first.";
    sourceText = notes;
  } else if (cleanedText.length <= FULL_SOURCE_CHAR_LIMIT) {
    sourceNote = options?.isYoutubeTranscript
      ? "FULL VIDEO TRANSCRIPT — cover the whole lecture, not only the opening minutes."
      : options?.isPresentation
        ? "FULL SLIDE DECK TEXT:"
        : "FULL CLEANED SOURCE:";
    sourceText = cleanedText;
  } else {
    sourceNote = options?.isYoutubeTranscript
      ? "TRANSCRIPT WINDOWS — equal slices from the opening through the ending. Cover every slice, not only the start."
      : "SOURCE WINDOWS — equal slices from the start through the end. Cover every slice, not only the opening.";
    sourceText = options?.isYoutubeTranscript
      ? sampleEvenWindows(cleanedText, FREE_ANALYSIS_CHAR_BUDGET, FREE_ANALYSIS_WINDOWS, videoMarker)
      : sampleEvenWindows(cleanedText, FREE_ANALYSIS_CHAR_BUDGET, FREE_ANALYSIS_WINDOWS);
  }

  const body = [prefix, groundingBlock, knowledgeBlock, sourceNote, sourceText].join("\n\n");

  const userPrompt = `${body}\n\nOutput depth: ${plan.outputDepth}. Learn depth hint: ${plan.learnDepth}.\n${formatInsightQuotaLine(cleanedText.length)}\n\n${ANALYSIS_OUTPUT_LANGUAGE_RULES}`;

  return { compactedCharacterCount: userPrompt.length, userPrompt, analysisSourceText: sourceText };
}
