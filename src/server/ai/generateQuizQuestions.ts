/**
 * SERVER ONLY — source-grounded quiz questions (LLM), local fallback lives in the client.
 * Single-call JSON mode with provider fallback (Groq → Gemini).
 */

import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { getLearningOutputLanguageLabel, normalizeLearningLanguage } from "@/lib/learning/normalizeLearningLanguage";
import { AI_CONFIG } from "./config";
import type { AnalysisProviderName } from "./analysis-failure";
import { devLog, devWarn } from "@/server/logging";

const QUIZ_MAX_TOKENS = 4096;
const QUIZ_TIMEOUT_MS = 45_000;

const QUIZ_SYSTEM = `You write multiple-choice quiz questions that are strictly grounded in the provided material.

CRITICAL RULES:
- Write exactly the requested number of questions. No more, no fewer.
- Each question MUST name its subject concretely (a person, event, term, number, date, or specific concept) — never "the source", "the year", "the document", "the text", "the video", "the article", "this analysis".
- Each question has exactly 4 options (A, B, C, D), exactly ONE correct.
- The 3 distractors MUST be plausible statements drawn from the SAME material but WRONG for this specific question. They must NOT be generic advice, study suggestions, or action items like "create a video", "write a blog post", "publish a post", "make a clip", "record a podcast", "produce content".
- Vary the question type: definition, cause/effect, sequence/timeline, number/date, comparison, consequence, implication.
- Do NOT copy flashcard questions verbatim — rephrase so the wording differs.
- Questions must be self-contained and answerable only from the material.
- All output MUST be in fluent native ${getLearningOutputLanguageLabel()}.
- Return ONLY valid JSON in this exact shape:

{
  "questions": [
    {
      "question": "string (ends with ?)",
      "options": ["A text", "B text", "C text", "D text"],
      "correctIndex": 0,
      "explanation": "string (1 sentence, why the correct answer is right, grounded in the material)"
    }
  ]
}`;

function buildQuizCorpus(input: {
  title: string;
  summary: string;
  keyInsights: string[];
  risksOrWarnings: string[];
  learnCards: Array<{ type: string; title?: string; content?: string }>;
}): string {
  const parts: string[] = [];

  if (input.title) parts.push(`TITLE\n${input.title}`);
  if (input.summary) parts.push(`SUMMARY\n${input.summary}`);

  if (input.keyInsights.length > 0) {
    parts.push(`KEY INSIGHTS\n${input.keyInsights.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`);
  }

  if (input.risksOrWarnings.length > 0) {
    parts.push(`RISKS / WARNINGS\n${input.risksOrWarnings.map((r, idx) => `${idx + 1}. ${r}`).join("\n")}`);
  }

  if (input.learnCards.length > 0) {
    const cardLines = input.learnCards
      .filter((c) => c.content?.trim())
      .map((c) => {
        const t = c.title?.trim() ?? "";
        const body = c.content?.trim() ?? "";
        return t ? `CARD: ${t}\n${body}` : `CARD: ${body}`;
      });
    if (cardLines.length > 0) {
      parts.push(`LEARN CARDS\n${cardLines.join("\n\n")}`);
    }
  }

  return parts.join("\n\n");
}

function buildQuizUserPrompt(corpus: string, count: number): string {
  return `${normalizeLearningLanguage()}

SOURCE MATERIAL:
${corpus}

TASK:
Generate exactly ${count} multiple-choice quiz questions grounded strictly in the material above.
Return JSON only — no prose, no markdown fences.`;
}

function callGroqJson(system: string, user: string, maxTokens: number): Promise<string> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client.chat.completions.create(
    {
      model: AI_CONFIG.providers.groq.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: AI_CONFIG.temperature,
      response_format: { type: "json_object" },
    },
    { timeout: QUIZ_TIMEOUT_MS },
  ).then((res) => {
    const text = res.choices[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("Groq returned an empty response.");
    return text;
  });
}

function callGeminiJson(system: string, user: string, maxTokens: number): Promise<string> {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client.models.generateContent({
    model: AI_CONFIG.providers.gemini.model,
    contents: [{ role: "user", parts: [{ text: `${system}\n\n${user}` }] }],
    config: {
      maxOutputTokens: maxTokens,
      temperature: AI_CONFIG.temperature,
      responseMimeType: "application/json",
    },
  }).then((res) => {
    const text = res.text;
    if (!text?.trim()) throw new Error("Gemini returned an empty response.");
    return text;
  });
}

async function callProviderJson(
  provider: AnalysisProviderName,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  return provider === "groq"
    ? callGroqJson(system, user, maxTokens)
    : callGeminiJson(system, user, maxTokens);
}

const ACTION_ITEM_PATTERN = /\b(create|produce|publish|write|record|make|generate|build|launch|start)\s+(a|an|an?)\s+(video|blog|post|clip|short|podcast|tiktok|reel|content|article)\b/i;

function looksLikeActionItem(text: string): boolean {
  return ACTION_ITEM_PATTERN.test(text);
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4 || /^\d+$/.test(t)),
  );
}

function hasTokenOverlap(a: string, bTokens: Set<string>): boolean {
  const aTokens = tokenize(a);
  for (const t of aTokens) if (bTokens.has(t)) return true;
  return false;
}

export type QuizQuestionRaw = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type GenerateQuizInput = {
  provider: AnalysisProviderName;
  title: string;
  summary: string;
  keyInsights: string[];
  risksOrWarnings: string[];
  learnCards: Array<{ type: string; title?: string; content?: string }>;
  count: number;
};

export async function generateQuizQuestionsFromAnalysis(
  input: GenerateQuizInput,
): Promise<QuizQuestionRaw[] | null> {
  const { provider, count, ...corpusInput } = input;
  const corpus = buildQuizCorpus(corpusInput);
  const corpusTokens = tokenize(corpus);

  let raw: string | null = null;

  try {
    raw = await callProviderJson(
      provider,
      QUIZ_SYSTEM,
      buildQuizUserPrompt(corpus, count),
      QUIZ_MAX_TOKENS,
    );
  } catch (error) {
    devWarn("[summify.quiz] primary provider failed", {
      provider,
      message: error instanceof Error ? error.message : String(error),
    });
    // Fallback to the other provider
    const fallback = provider === "groq" ? "gemini" : "groq";
    try {
      raw = await callProviderJson(
        fallback,
        QUIZ_SYSTEM,
        buildQuizUserPrompt(corpus, count),
        QUIZ_MAX_TOKENS,
      );
    } catch (fallbackError) {
      devWarn("[summify.quiz] fallback provider also failed", {
        fallback,
        message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      });
      return null;
    }
  }

  if (!raw?.trim()) return null;

  let parsed: { questions?: QuizQuestionRaw[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    devWarn("[summify.quiz] JSON parse failed", { raw: raw.slice(0, 200) });
    return null;
  }

  const questions = parsed.questions;
  if (!Array.isArray(questions) || questions.length === 0) return null;

  // Validate and filter
  const valid: QuizQuestionRaw[] = [];
  const seenQuestions = new Set<string>();

  for (const q of questions) {
    // Structural validation
    if (
      typeof q.question !== "string" ||
      q.question.trim().length < 15 ||
      q.question.trim().length > 220 ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      !q.options.every((o) => typeof o === "string" && o.trim().length > 0 && o.trim().length < 300) ||
      typeof q.correctIndex !== "number" ||
      q.correctIndex < 0 ||
      q.correctIndex > 3 ||
      typeof q.explanation !== "string" ||
      q.explanation.trim().length < 10 ||
      q.explanation.trim().length > 500
    ) {
      continue;
    }

    // Normalize question for dedupe
    const normQ = q.question.trim().toLowerCase().replace(/\s+/g, " ").replace(/[?!.]+$/, "");
    if (seenQuestions.has(normQ)) continue;
    seenQuestions.add(normQ);

    // Grounding gate: correct option must share at least one token with corpus
    const correctOpt = q.options[q.correctIndex]?.trim();
    if (!correctOpt || !hasTokenOverlap(correctOpt, corpusTokens)) continue;

    // Question must also mention a corpus token (loose)
    if (!hasTokenOverlap(q.question, corpusTokens)) continue;

    // Reject action-item style options in any slot
    if (q.options.some(looksLikeActionItem)) continue;

    // Reject action-item style questions
    if (looksLikeActionItem(q.question)) continue;

    valid.push(q);
    if (valid.length >= count) break;
  }

  if (valid.length < Math.max(1, Math.floor(count / 2))) {
    devWarn("[summify.quiz] too few valid questions after validation", {
      requested: count,
      valid: valid.length,
    });
    return null;
  }

  devLog("[summify.quiz] generated", { requested: count, valid: valid.length, provider });
  return valid;
}