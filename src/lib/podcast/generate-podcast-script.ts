import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from "@/server/ai/config";
import {
  buildPodcastDiscussionPrompt,
  PODCAST_DISCUSSION_SYSTEM,
  type PodcastLengthPlan,
} from "./podcast-prompts";
import type {
  PodcastDensityMode,
  PodcastDiscussionAnalysisInput,
  PodcastDiscussionOutlineItem,
  PodcastDiscussionScript,
  PodcastToneProfile,
  PodcastDiscussionTurn,
} from "./podcast-types";

const MAX_DIALOGUE_WORDS = 4000;
const MAX_OUTPUT_TOKENS = 5200;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function inputDensity(input: PodcastDiscussionAnalysisInput): number {
  return (
    input.summary.length +
    input.keyInsights.join(" ").length +
    (input.learnCards ?? []).map((card) => `${card.title} ${card.content}`).join(" ").length +
    (input.quizQuestions ?? []).map((question) => question.question).join(" ").length
  );
}

/** Words per minute for spoken English podcast dialogue. */
const WORDS_PER_MINUTE = 175;

/**
 * Estimate duration in minutes from word count.
 */
export function estimateDurationFromWordCount(wordCount: number): number {
  return Math.round(wordCount / WORDS_PER_MINUTE);
}

/**
 * Estimate word count from target duration.
 */
export function estimateWordCountFromDuration(minutes: number): number {
  return Math.round(minutes * WORDS_PER_MINUTE);
}

/** Source size tier for podcast length planning. */
export type SourceSizeTier = "small" | "medium" | "large";

/**
 * Determine source size tier from analysis input.
 */
export function resolveSourceSizeTier(input: PodcastDiscussionAnalysisInput): SourceSizeTier {
  const sourceSize = Math.max(
    input.sourceMetadata?.extractedCharacterCount ?? 0,
    input.sourceMetadata?.transcriptCharacterCount ?? 0,
    inputDensity(input),
  );
  const sourceMinutes = input.sourceMetadata?.youtubeDurationMinutes ?? 0;
  const sourcePages = input.sourceMetadata?.estimatedPages ?? 0;

  // Large: ≥14k chars OR ≥28 min OR ≥18 pages
  if (sourceSize >= 14000 || sourceMinutes >= 28 || sourcePages >= 18) {
    return "large";
  }

  // Medium: ≥6k chars OR ≥14 min OR ≥8 pages
  if (sourceSize >= 6000 || sourceMinutes >= 14 || sourcePages >= 8) {
    return "medium";
  }

  return "small";
}

/**
 * Full mode × source size matrix for maxWords.
 * Values chosen to produce target durations at ~145 words/min.
 */
const MAX_WORDS_MATRIX: Record<
  PodcastDensityMode,
  Record<SourceSizeTier, number>
> = {
  quick: {
    small: 800,    // ~5 min
    medium: 1000,  // ~7 min
    large: 1200,   // ~8 min
  },
  standard: {
    small: 1300,   // ~9 min
    medium: 2000,  // ~14 min
    large: 2500,   // ~17 min
  },
  "deep-dive": {
    small: 1800,   // ~12 min
    medium: 2800,  // ~19 min
    large: 3500,   // ~24 min
  },
  critical: {
    small: 2000,   // ~14 min
    medium: 3000,  // ~21 min
    large: 3800,   // ~26 min
  },
  debate: {
    small: 1500,   // ~10 min
    medium: 2500,  // ~17 min
    large: 3200,   // ~22 min
  },
};

/**
 * Duration range labels for UI/prompt.
 */
const DURATION_RANGES: Record<PodcastDensityMode, Record<SourceSizeTier, string>> = {
  quick: { small: "4-6 min", medium: "6-8 min", large: "7-9 min" },
  standard: { small: "8-10 min", medium: "13-15 min", large: "16-18 min" },
  "deep-dive": { small: "11-13 min", medium: "18-20 min", large: "23-25 min" },
  critical: { small: "13-15 min", medium: "20-22 min", large: "25-27 min" },
  debate: { small: "9-11 min", medium: "16-18 min", large: "21-23 min" },
};

/**
 * Target word range labels for UI/prompt.
 */
const TARGET_WORD_RANGES: Record<PodcastDensityMode, Record<SourceSizeTier, string>> = {
  quick: { small: "700-900", medium: "900-1100", large: "1100-1300" },
  standard: { small: "1200-1400", medium: "1800-2200", large: "2300-2700" },
  "deep-dive": { small: "1600-2000", medium: "2600-3000", large: "3200-3800" },
  critical: { small: "1800-2200", medium: "2800-3200", large: "3500-4000" },
  debate: { small: "1300-1700", medium: "2300-2700", large: "2900-3500" },
};

/**
 * Resolve podcast length plan based on density mode and source size.
 */
export function resolvePodcastLengthPlan(
  input: PodcastDiscussionAnalysisInput,
  densityMode: PodcastDensityMode,
): PodcastLengthPlan {
  const sourceTier = resolveSourceSizeTier(input);
  const maxWords = MAX_WORDS_MATRIX[densityMode][sourceTier];
  const durationRange = DURATION_RANGES[densityMode][sourceTier];
  const targetWordRange = `${TARGET_WORD_RANGES[densityMode][sourceTier]} words`;

  return {
    durationRange,
    targetWordRange,
    maxWords,
    densityMode,
  };
}

function extractJson(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) {
    throw new Error("Podcast script model returned invalid JSON.");
  }

  const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Podcast script JSON must be an object.");
  }
  return parsed as Record<string, unknown>;
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function parseOutline(value: unknown): PodcastDiscussionOutlineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const title = cleanText(record.title);
      const summary = cleanText(record.summary);
      return title && summary ? { title, summary } : null;
    })
    .filter((item): item is PodcastDiscussionOutlineItem => item !== null)
    .slice(0, 12);
}

function parseTurns(value: unknown, maxWords: number): PodcastDiscussionTurn[] {
  if (!Array.isArray(value)) return [];

  const turns: PodcastDiscussionTurn[] = [];
  let totalWords = 0;

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const speaker = record.speaker === "host" || record.speaker === "expert"
      ? record.speaker
      : null;
    const text = cleanText(record.text);
    const wordCount = countWords(text);
    if (!speaker || wordCount === 0) continue;
    if (totalWords + wordCount > Math.min(maxWords, MAX_DIALOGUE_WORDS)) break;
    turns.push({ speaker, text });
    totalWords += wordCount;
  }

  return turns;
}

/**
 * Compute realistic duration from word count using standard speech rate.
 * Falls back to provided estimate if it's within reasonable range.
 */
function computeDuration(wordCount: number, providedEstimate: unknown): number {
  const calculated = estimateDurationFromWordCount(wordCount);
  const provided = typeof providedEstimate === "number" && Number.isFinite(providedEstimate)
    ? Math.round(providedEstimate)
    : null;

  // If provided estimate is within 30% of calculated, trust it
  if (provided !== null && provided > 0) {
    const ratio = provided / calculated;
    if (ratio >= 0.7 && ratio <= 1.3) {
      return Math.max(3, Math.min(25, provided));
    }
  }

  // Default to calculated
  return Math.max(3, Math.min(25, calculated));
}

/** Field names Groq might use for dialogue turns. */
const DIALOGUE_FIELD_NAMES = [
  "script",
  "turns",
  "dialogue",
  "sections",
  "discussion",
  "conversation",
  "exchanges",
  "content",
] as const;

function parsePodcastDiscussion(
  raw: string,
  lengthPlan: PodcastLengthPlan,
): PodcastDiscussionScript {
  // Log raw model output for debugging (truncated to 500 chars)
  const truncatedRaw = raw.length > 500 ? raw.slice(0, 500) + "..." : raw;
  console.info("[podcast] model_raw_output", {
    rawPreview: truncatedRaw,
    fullLength: raw.length,
  });

  const parsed = extractJson(raw);

  // Log all top-level keys for debugging
  console.info("[podcast] parsed_json_keys", {
    keys: Object.keys(parsed),
    hasTitle: "title" in parsed,
    hasOutline: "outline" in parsed,
    hasEstimatedDuration: "estimatedDurationMinutes" in parsed,
    dialogueFieldUsed: DIALOGUE_FIELD_NAMES.find(key => Array.isArray((parsed as Record<string, unknown>)[key])),
  });

  const title = cleanText(parsed.title);
  const outline = parseOutline(parsed.outline);

  // Try multiple field names for dialogue content
  let dialogueData: unknown;
  const usedFieldName = DIALOGUE_FIELD_NAMES.find((field) => {
    dialogueData = parsed[field];
    return Array.isArray(dialogueData) && dialogueData.length > 0;
  });

  if (!usedFieldName) {
    console.error("[podcast] no_dialogue_field_found", {
      availableKeys: Object.keys(parsed),
      triedFields: DIALOGUE_FIELD_NAMES,
    });
    throw new Error("Podcast script JSON missing dialogue field. Tried: " + DIALOGUE_FIELD_NAMES.join(", "));
  }

  console.info("[podcast] dialogue_field_found", {
    fieldName: usedFieldName,
    itemCount: (dialogueData as unknown[]).length,
  });

  const script = parseTurns(dialogueData, lengthPlan.maxWords);
  const totalWordCount = script.reduce((total, turn) => total + countWords(turn.text), 0);

  // Validation: title and outline are required; script/dialogue length is flexible
  // Word count is a generation guideline, not a hard requirement for parsing
  if (!title || outline.length < 3 || script.length < 4) {
    console.error("[podcast] validation_failed", {
      hasTitle: Boolean(title),
      outlineLength: outline.length,
      scriptLength: script.length,
      totalWordCount,
    });
    throw new Error("Podcast script JSON missing required discussion fields.");
  }

  // Log a warning if word count is very low, but don't fail
  if (totalWordCount < 200) {
    console.warn("[podcast] low_word_count_warning", {
      totalWordCount,
      scriptLength: script.length,
      note: "Script has fewer words than expected. Consider regenerating with a different density mode.",
    });
  }

  return {
    title,
    estimatedDurationMinutes: computeDuration(totalWordCount, parsed.estimatedDurationMinutes),
    speakers: [
      { id: "host", name: "Host" },
      { id: "expert", name: "Expert" },
    ],
    outline,
    script,
    totalWordCount,
    densityMode: lengthPlan.densityMode,
  };
}

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured on the server.");
  return new Groq({ apiKey });
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");
  return new GoogleGenAI({ apiKey });
}

async function callGroqJson(system: string, user: string): Promise<string> {
  const completion = await getGroqClient().chat.completions.create(
    {
      model: AI_CONFIG.providers.groq.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.38,
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: "json_object" },
    },
    { timeout: 60_000 },
  );
  const content = completion.choices[0]?.message?.content;
  if (!content?.trim()) throw new Error("Groq returned an empty podcast script.");
  return content;
}

/**
 * Generate podcast script in multiple calls for longer-density modes.
 * This bypasses Groq's tendency to produce short outputs in a single call.
 */
async function generatePodcastScriptTwoPhase(
  analysis: PodcastDiscussionAnalysisInput,
  lengthPlan: PodcastLengthPlan,
  baseSystemPrompt: string,
): Promise<PodcastDiscussionScript> {
  console.info("[podcast] two_phase_generation_start", {
    densityMode: lengthPlan.densityMode,
    targetWordRange: lengthPlan.targetWordRange,
  });

  // Phase 1: Generate intro + first half
  const phase1Prompt = `${buildPodcastDiscussionPrompt(analysis, lengthPlan)}

IMPORTANT: Generate ONLY the first half of the discussion (intro through the first 2-3 discussion beats).
End at the midpoint — do not include the recap or conclusion.
Focus on depth and substance in each turn.`;

  const phase1Raw = await callGroqJson(baseSystemPrompt, phase1Prompt);
  const phase1Result = extractJson(phase1Raw);

  console.info("[podcast] two_phase_generation_phase1_complete", {
    title: phase1Result.title,
    outlineCount: Array.isArray(phase1Result.outline) ? phase1Result.outline.length : 0,
    scriptCount: (() => {
      const data = phase1Result.script ?? phase1Result.turns;
      return Array.isArray(data) ? data.length : 0;
    })(),
  });

  // Phase 2: Generate remaining sections with phase 1 as context
  const phase1ScriptData = phase1Result.script ?? phase1Result.turns;
  const phase1Summary = Array.isArray(phase1ScriptData)
    ? phase1ScriptData
        .slice(-2)
        .map((t: unknown) => {
          const turn = t as Record<string, unknown>;
          return `${turn.speaker}: ${turn.text}`.slice(0, 200);
        })
        .join("\n")
    : "";

  const phase2Prompt = `${buildPodcastDiscussionPrompt(analysis, lengthPlan)}

CONTINUATION INSTRUCTION: Generate the REMAINING sections of the discussion.
The first half has already been generated. Continue from where it left off.

LAST TURNS FROM PHASE 1:
${phase1Summary}

Generate the remaining discussion beats, counterpoints, real-world implications, recap, and reflection question.
Do NOT repeat the intro or early sections. Focus on depth and substance.`;

  const phase2Raw = await callGroqJson(baseSystemPrompt, phase2Prompt);
  const phase2Result = extractJson(phase2Raw);

  console.info("[podcast] two_phase_generation_phase2_complete", {
    scriptCount: (() => {
      const data = phase2Result.script ?? phase2Result.turns;
      return Array.isArray(data) ? data.length : 0;
    })(),
  });

  // Merge: Use phase 1's title/outline, combine scripts
  const phase1Script = parseTurns(phase1Result.script ?? phase1Result.turns, lengthPlan.maxWords);
  const phase2Script = parseTurns(phase2Result.script ?? phase2Result.turns, lengthPlan.maxWords);
  let mergedScript = [...phase1Script, ...phase2Script];
  let totalWordCount = mergedScript.reduce((total, turn) => total + countWords(turn.text), 0);

  const targetWordCount = lengthPlan.maxWords;
  const minimumAcceptableWordCount = Math.round(targetWordCount * 0.7);

  // Phase 3 fallback: if the two-phase output is still materially under target,
  // ask for an additional source-grounded expansion instead of accepting an over-compressed script.
  let phase3Iterations = 0;
  while (totalWordCount < minimumAcceptableWordCount && phase3Iterations < 2) {
    const remainingWordBudget = Math.max(
      0,
      Math.min(lengthPlan.maxWords, MAX_DIALOGUE_WORDS) - totalWordCount,
    );
    const recentTurns = mergedScript
      .slice(-3)
      .map((turn) => `${turn.speaker}: ${turn.text}`.slice(0, 240))
      .join("\n");

    phase3Iterations++;
    console.warn(`[podcast] phase3_fallback_triggered_iteration_${phase3Iterations}`, {
      densityMode: lengthPlan.densityMode,
      totalWordCount,
      targetWordCount,
      minimumAcceptableWordCount,
      remainingWordBudget,
    });

    if (remainingWordBudget >= 150) {
      const phase3Prompt = `${buildPodcastDiscussionPrompt(analysis, lengthPlan)}

PHASE 3 FALLBACK INSTRUCTION: The previous script is too short.
Current dialogue word count: ${totalWordCount}.
Target dialogue word count: ${targetWordCount}.
Minimum acceptable dialogue word count: ${minimumAcceptableWordCount}.

Generate ONLY additional dialogue turns that extend the existing episode with deeper source-grounded explanation.
Do NOT repeat the intro, early beats, or already-covered setup.
Add missing nuance, examples, counterpoints, implications, and a stronger closing recap/reflection if needed.
Keep the continuation under approximately ${remainingWordBudget} words.

RECENT TURNS TO CONTINUE FROM:
${recentTurns}`;

      const phase3Raw = await callGroqJson(baseSystemPrompt, phase3Prompt);
      const phase3Result = extractJson(phase3Raw);
      const phase3Script = parseTurns(phase3Result.script ?? phase3Result.turns, remainingWordBudget);

      mergedScript = [...mergedScript, ...phase3Script];
      totalWordCount = mergedScript.reduce((total, turn) => total + countWords(turn.text), 0);

      console.info(`[podcast] phase3_fallback_complete_iteration_${phase3Iterations}`, {
        addedTurns: phase3Script.length,
        totalTurns: mergedScript.length,
        totalWordCount,
      });
    } else {
      console.info(`[podcast] phase3_fallback_skipped_iteration_${phase3Iterations}`, {
        reason: "remaining_word_budget_too_low",
        remainingWordBudget,
      });
      break; // Exit loop if budget is too low
    }
  }

  const title = cleanText(phase1Result.title) || cleanText(analysis.title);
  const outline = parseOutline(phase1Result.outline);

  console.info("[podcast] two_phase_generation_merged", {
    phase1Turns: phase1Script.length,
    phase2Turns: phase2Script.length,
    totalTurns: mergedScript.length,
    totalWordCount,
  });

  return {
    title,
    estimatedDurationMinutes: computeDuration(totalWordCount, phase1Result.estimatedDurationMinutes),
    speakers: [
      { id: "host", name: "Host" },
      { id: "expert", name: "Expert" },
    ],
    outline,
    script: mergedScript,
    totalWordCount,
    densityMode: lengthPlan.densityMode,
    toneProfile: analysis.toneProfile,
  };
}

async function callGeminiJson(system: string, user: string): Promise<string> {
  const response = await getGeminiClient().models.generateContent({
    model: AI_CONFIG.providers.gemini.model,
    contents: [{ role: "user", parts: [{ text: user }] }],
    config: {
      systemInstruction: system,
      temperature: 0.38,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
    },
  });
  if (!response.text?.trim()) throw new Error("Gemini returned an empty podcast script.");
  return response.text;
}

export async function generatePodcastDiscussionScript(
  analysis: PodcastDiscussionAnalysisInput,
  densityMode?: PodcastDensityMode,
  toneProfile?: PodcastToneProfile,
): Promise<PodcastDiscussionScript> {
  const analysisInput: PodcastDiscussionAnalysisInput = {
    ...analysis,
    toneProfile: toneProfile ?? analysis.toneProfile,
  };

  // Use provided density mode or auto-detect based on source size
  const resolvedDensityMode: PodcastDensityMode =
    densityMode ??
    (() => {
      const sourceTier = resolveSourceSizeTier(analysisInput);
      return sourceTier === "large" ? "deep-dive" : sourceTier === "medium" ? "standard" : "quick";
    })();

  const lengthPlan = resolvePodcastLengthPlan(analysisInput, resolvedDensityMode);

  // Debug log for podcast pipeline verification
  console.info("[podcast] length_plan_resolved", {
    resolvedSourceSizeTier: resolveSourceSizeTier(analysis),
    resolvedDensityMode: resolvedDensityMode,
    maxWords: lengthPlan.maxWords,
    targetWordRange: lengthPlan.targetWordRange,
    durationRange: lengthPlan.durationRange,
    sourceTitle: analysisInput.title,
    userSelected: Boolean(densityMode),
    toneProfile: analysisInput.toneProfile ?? "casual",
  });

  // Use multi-phase generation for standard, deep-dive, and critical modes to achieve longer outputs.
  // Quick and debate intentionally stay single-call because their targets are lower / more concise.
  const useTwoPhase =
    resolvedDensityMode === "standard" ||
    resolvedDensityMode === "deep-dive" ||
    resolvedDensityMode === "critical";

  if (useTwoPhase && process.env.GROQ_API_KEY) {
    return generatePodcastScriptTwoPhase(analysisInput, lengthPlan, PODCAST_DISCUSSION_SYSTEM);
  }

  // Single-call generation for other modes
  const userPrompt = buildPodcastDiscussionPrompt(analysisInput, lengthPlan);

  // Use Groq as the primary provider (same as main analysis pipeline)
  if (process.env.GROQ_API_KEY) {
    return parsePodcastDiscussion(
      await callGroqJson(PODCAST_DISCUSSION_SYSTEM, userPrompt),
      lengthPlan,
    );
  }

  // Fallback to Gemini only if Groq is not configured
  if (process.env.GEMINI_API_KEY) {
    console.warn("[podcast] groq_not_configured_falling_back_to_gemini");
    return parsePodcastDiscussion(
      await callGeminiJson(PODCAST_DISCUSSION_SYSTEM, userPrompt),
      lengthPlan,
    );
  }

  throw new Error("Podcast script providers are not configured. Set GROQ_API_KEY.");
}
