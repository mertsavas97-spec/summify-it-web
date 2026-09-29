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
const MAX_OUTPUT_TOKENS = 12000;

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

/** Spoken pace used to keep each mode inside the on-screen duration. */
const WORDS_PER_MINUTE = 145;

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
 * On-screen duration for the three podcast modes.
 * Source length does not stretch these bands.
 */
const SCREEN_DURATION_MINUTES: Record<
  PodcastDensityMode,
  { min: number; max: number }
> = {
  quick: { min: 5, max: 8 },
  standard: { min: 10, max: 15 },
  "deep-dive": { min: 15, max: 20 },
  critical: { min: 10, max: 15 },
  debate: { min: 10, max: 15 },
};

/**
 * Resolve podcast length from the selected mode.
 * The same Quick, Standard, or Deep Dive choice keeps one duration on every source.
 */
export function resolvePodcastLengthPlan(
  _input: PodcastDiscussionAnalysisInput,
  densityMode: PodcastDensityMode,
): PodcastLengthPlan {
  const band = SCREEN_DURATION_MINUTES[densityMode];
  const minWords = estimateWordCountFromDuration(band.min);
  const maxWords = estimateWordCountFromDuration(band.max);

  return {
    durationRange: `${band.min}-${band.max} min`,
    targetWordRange: `${minWords}-${maxWords} words`,
    minWords,
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
      if (typeof item === "string") {
        const text = cleanText(item);
        if (!text) return null;
        const [head, ...rest] = text.split(/[:—–]\s+/);
        const title = cleanText(head).slice(0, 80);
        const summary = cleanText(rest.join(" ")) || text;
        return title && summary ? { title, summary } : null;
      }
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const title = cleanText(record.title ?? record.heading ?? record.beat);
      const summary = cleanText(record.summary ?? record.description ?? record.text) || title;
      return title && summary ? { title, summary } : null;
    })
    .filter((item): item is PodcastDiscussionOutlineItem => item !== null)
    .slice(0, 12);
}

function normalizeSpeaker(value: unknown): PodcastDiscussionTurn["speaker"] | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase().replace(/[_-]+/g, " ");
  if (
    key === "host" ||
    key === "a" ||
    key === "speaker 1" ||
    key === "speaker1" ||
    key === "person a" ||
    /\bhost\b/.test(key)
  ) {
    return "host";
  }
  if (
    key === "expert" ||
    key === "guest" ||
    key === "b" ||
    key === "speaker 2" ||
    key === "speaker2" ||
    key === "person b" ||
    /\b(expert|guest)\b/.test(key)
  ) {
    return "expert";
  }
  return null;
}

function turnText(record: Record<string, unknown>): string {
  for (const key of ["text", "line", "dialogue", "utterance", "content", "message"] as const) {
    const text = cleanText(record[key]);
    if (text) return text;
  }
  return "";
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

function readDialogue(parsed: Record<string, unknown>): unknown {
  for (const field of DIALOGUE_FIELD_NAMES) {
    const value = parsed[field];
    if (Array.isArray(value) && value.length > 0) return value;
  }
  return undefined;
}

function parseTurns(value: unknown, maxWords: number): PodcastDiscussionTurn[] {
  if (!Array.isArray(value)) return [];

  const turns: PodcastDiscussionTurn[] = [];
  let totalWords = 0;

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const speaker = normalizeSpeaker(record.speaker ?? record.role ?? record.name);
    const text = turnText(record);
    const wordCount = countWords(text);
    if (!speaker || wordCount === 0) continue;
    if (totalWords + wordCount > Math.min(maxWords, MAX_DIALOGUE_WORDS)) break;
    turns.push({ speaker, text });
    totalWords += wordCount;
  }

  return turns;
}

function outlineFromScript(script: PodcastDiscussionTurn[]): PodcastDiscussionOutlineItem[] {
  if (script.length === 0) return [];
  const size = Math.max(1, Math.ceil(script.length / 3));
  const items: PodcastDiscussionOutlineItem[] = [];
  for (let index = 0; index < 3; index += 1) {
    const slice = script.slice(index * size, (index + 1) * size);
    const summary = slice.map((turn) => turn.text).join(" ").replace(/\s+/g, " ").trim().slice(0, 180);
    if (!summary) continue;
    items.push({ title: `Part ${index + 1}`, summary });
  }
  return items;
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

export function parsePodcastDiscussion(
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

  const title = cleanText(parsed.title) || "Discussion";
  const outline = parseOutline(parsed.outline);
  const dialogueData = readDialogue(parsed);

  if (!dialogueData) {
    console.error("[podcast] no_dialogue_field_found", {
      availableKeys: Object.keys(parsed),
      triedFields: DIALOGUE_FIELD_NAMES,
    });
    throw new Error("Podcast script JSON missing dialogue field. Tried: " + DIALOGUE_FIELD_NAMES.join(", "));
  }

  console.info("[podcast] dialogue_field_found", {
    fieldName: DIALOGUE_FIELD_NAMES.find((field) => parsed[field] === dialogueData),
    itemCount: (dialogueData as unknown[]).length,
  });

  const script = parseTurns(dialogueData, lengthPlan.maxWords);
  const totalWordCount = script.reduce((total, turn) => total + countWords(turn.text), 0);
  const hasHost = script.some((turn) => turn.speaker === "host");
  const hasExpert = script.some((turn) => turn.speaker === "expert");

  // A usable episode needs both speakers. Turn count is not a hard minimum:
  // models often return two or three long turns, and rejecting those aborted generation.
  if (script.length < 2 || !hasHost || !hasExpert) {
    console.error("[podcast] validation_failed", {
      hasTitle: Boolean(title),
      outlineLength: outline.length,
      scriptLength: script.length,
      hasHost,
      hasExpert,
      totalWordCount,
    });
    throw new Error("Podcast script JSON missing required discussion fields.");
  }

  const resolvedOutline = outline.length >= 3 ? outline : outlineFromScript(script);

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
    outline: resolvedOutline,
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
  const client = getGroqClient();
  try {
    return await requestGroqScript(client, system, user, true);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("json_validate_failed")) throw error;
    console.warn("[podcast] groq_json_mode_failed_retrying_plain");
    return requestGroqScript(client, system, user, false);
  }
}

async function requestGroqScript(
  client: Groq,
  system: string,
  user: string,
  jsonMode: boolean,
): Promise<string> {
  const completion = await client.chat.completions.create(
    {
      model: AI_CONFIG.providers.groq.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.38,
      max_tokens: MAX_OUTPUT_TOKENS,
      reasoning_effort: "low",
      ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    },
    { timeout: 90_000 },
  );
  const content = completion.choices[0]?.message?.content;
  if (!content?.trim()) throw new Error("Groq returned an empty podcast script.");
  return content;
}

/**
 * One extra Groq call when the first script is under the mode's minimum length.
 */
async function extendShortScript(
  analysis: PodcastDiscussionAnalysisInput,
  lengthPlan: PodcastLengthPlan,
  current: PodcastDiscussionScript,
): Promise<PodcastDiscussionScript> {
  const remainingWordBudget = Math.max(0, Math.min(lengthPlan.maxWords, MAX_DIALOGUE_WORDS) - current.totalWordCount);
  if (remainingWordBudget < 120) return current;

  const recentTurns = current.script
    .slice(-3)
    .map((turn) => `${turn.speaker}: ${turn.text}`.slice(0, 240))
    .join("\n");
  const continuation = await callGroqJson(
    PODCAST_DISCUSSION_SYSTEM,
    `${buildPodcastDiscussionPrompt(analysis, lengthPlan)}

CONTINUATION: The episode is shorter than ${lengthPlan.durationRange}.
Current dialogue words: ${current.totalWordCount}.
Reach at least ${lengthPlan.minWords} words and do not exceed ${lengthPlan.maxWords}.
Generate ONLY additional Host and Expert turns. Do not repeat the opening.
Keep this continuation under ${remainingWordBudget} words.

RECENT TURNS:
${recentTurns}`,
  );
  const added = parseTurns(readDialogue(extractJson(continuation)), remainingWordBudget);
  const script = [...current.script, ...added];
  const totalWordCount = script.reduce((total, turn) => total + countWords(turn.text), 0);
  const hasHost = script.some((turn) => turn.speaker === "host");
  const hasExpert = script.some((turn) => turn.speaker === "expert");
  if (script.length < 2 || !hasHost || !hasExpert || added.length === 0) return current;

  console.info("[podcast] continuation_complete", {
    densityMode: lengthPlan.densityMode,
    addedTurns: added.length,
    totalWordCount,
    durationRange: lengthPlan.durationRange,
  });

  return {
    ...current,
    script,
    totalWordCount,
    outline: current.outline.length >= 3 ? current.outline : outlineFromScript(script),
    estimatedDurationMinutes: computeDuration(totalWordCount, undefined),
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
    minWords: lengthPlan.minWords,
    maxWords: lengthPlan.maxWords,
    targetWordRange: lengthPlan.targetWordRange,
    durationRange: lengthPlan.durationRange,
    sourceTitle: analysisInput.title,
    userSelected: Boolean(densityMode),
    toneProfile: analysisInput.toneProfile ?? "casual",
  });

  const userPrompt = buildPodcastDiscussionPrompt(analysisInput, lengthPlan);

  if (process.env.GROQ_API_KEY) {
    const first = parsePodcastDiscussion(
      await callGroqJson(PODCAST_DISCUSSION_SYSTEM, userPrompt),
      lengthPlan,
    );
    if (first.totalWordCount >= lengthPlan.minWords) return first;
    console.info("[podcast] continuation_started", {
      densityMode: lengthPlan.densityMode,
      totalWordCount: first.totalWordCount,
      minWords: lengthPlan.minWords,
    });
    return extendShortScript(analysisInput, lengthPlan, first);
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
