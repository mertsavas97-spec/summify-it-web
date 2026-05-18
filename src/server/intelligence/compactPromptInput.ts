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
import type { TextAnalysisMode } from "@/server/ai/schemas";

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
    profile.needsChunking ? "- Note: full-document chunking not yet enabled." : "",
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

function truncateRaw(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[Source text truncated for token budget.]`;
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
    ctx.hasTimestamps
      ? "- Timestamps appear in the transcript as [m:ss] or [h:mm:ss]. Reference them in keyInsights when they anchor a claim."
      : "",
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
      "Mode emphasis: only analyze legal/compliance if the transcript actually contains legal material; otherwise note in risksOrWarnings that legal mode may not fit this transcript.",
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
      "Mode emphasis: only if deck contains contractual/policy/compliance terms; otherwise note legal mode may not fit.",
  };

  lines.push(modeNotes[mode]);
  return lines.filter(Boolean).join("\n");
}

export type CompactPromptOptions = {
  isYoutubeTranscript?: boolean;
  isPresentation?: boolean;
  sourceContext?: AnalyzeSourceContext;
  analysisMode?: TextAnalysisMode;
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
): { compactedCharacterCount: number; userPrompt: string } {
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
  const prefix = [
    SOURCE_INPUT_LANGUAGE_NOTE,
    profileBlock,
    youtubeBlock,
    presentationBlock,
  ]
    .filter(Boolean)
    .join("\n\n");

  let body: string;

  switch (plan.pipelineType) {
    case "short_direct": {
      const raw = truncateRaw(cleanedText, plan.maxInputCharacters);
      body = [
        prefix,
        groundingBlock,
        knowledgeBlock,
        options?.isPresentation ? "FULL SLIDE DECK TEXT:" : "FULL CLEANED SOURCE:",
        raw,
      ].join("\n\n");
      break;
    }
    case "medium_compacted": {
      const rawBudget = Math.min(5_000, Math.floor(plan.maxInputCharacters * 0.45));
      const raw = truncateRaw(cleanedText, rawBudget);
      body = [
        prefix,
        groundingBlock,
        knowledgeBlock,
        "SUPPORTING EXCERPTS (partial raw text):",
        raw,
        "Ground analysis in entities, sections, and phrases above — do not invent content.",
      ].join("\n\n");
      break;
    }
    case "long_preview": {
      const rawBudget = Math.min(2_500, Math.floor(plan.maxInputCharacters * 0.3));
      const raw = truncateRaw(cleanedText, rawBudget);
      body = [
        prefix,
        groundingBlock,
        knowledgeBlock,
        "LONG TRANSCRIPT PREVIEW — limited excerpt for grounding:",
        raw,
        "Prioritize knowledge layer. Flag gaps in risksOrWarnings if coverage is incomplete.",
      ].join("\n\n");
      break;
    }
  }

  const userPrompt = `${body}\n\nOutput depth: ${plan.outputDepth}. Learn depth hint: ${plan.learnDepth}.\n\n${ANALYSIS_OUTPUT_LANGUAGE_RULES}`;

  return { compactedCharacterCount: userPrompt.length, userPrompt };
}
