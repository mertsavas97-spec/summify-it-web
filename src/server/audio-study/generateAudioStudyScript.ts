import Groq from "groq-sdk";
import { AI_CONFIG } from "@/server/ai/config";
import type { AudioStudyAnalysisInput, AudioStudyScript } from "@/types/audio-study";
import type { AudioStudyScriptLimits } from "@/lib/audio-study/access";

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured on the server.");
  }
  return new Groq({ apiKey });
}

function formatLearnCards(input: AudioStudyAnalysisInput): string {
  const cards = input.learnCards ?? [];
  if (cards.length === 0) return "(none)";
  return cards
    .slice(0, 12)
    .map((c) => `- [${c.type}] ${c.title}: ${c.content.slice(0, 280)}`)
    .join("\n");
}

function buildPrompt(input: AudioStudyAnalysisInput, limits: AudioStudyScriptLimits): string {
  return `You are writing a spoken lesson script for Summify Audio Study Mode.

STYLE:
- Clear teacher voice: simple, structured, explanatory, concise
- Not childish, not motivational-hype, no filler
- Source-grounded ONLY from the analysis below — no invented facts
- Do NOT mention AI, prompts, Learn cards, or internal product mechanics
- Write for listening (short sentences, natural transitions)

TARGET LENGTH: ${limits.minWords}–${limits.maxWords} words total in "script"

STRUCTURE (use these section titles in "sections"):
1. Quick context
2. Main idea
3. Key concepts (3–5 concepts in one section)
4. Why it matters
5. Common misunderstanding
6. Quick recap
7. Reflection questions (exactly 3 questions)

OUTPUT: valid JSON only:
{
  "title": string,
  "durationEstimate": string (e.g. "about 4 minutes"),
  "script": string (full narration, all sections flowing),
  "sections": [{ "title": string, "text": string }]
}

DOCUMENT: ${input.title}
SOURCE TYPE: ${input.sourceType ?? "document"}
MODE: ${input.intelligenceMode ?? "general"}
SOURCE LABEL: ${input.sourceLabel ?? ""}

SUMMARY:
${input.summary}

KEY INSIGHTS:
${(input.keyInsights ?? []).map((i) => `- ${i}`).join("\n") || "(none)"}

RISKS / WARNINGS:
${(input.risksOrWarnings ?? []).map((i) => `- ${i}`).join("\n") || "(none)"}

ACTION ITEMS:
${(input.actionItems ?? []).map((i) => `- ${i}`).join("\n") || "(none)"}

LEARN CARD THEMES:
${formatLearnCards(input)}

QUIZ THEMES (if any):
${(input.quizThemes ?? []).map((t) => `- ${t}`).join("\n") || "(none)"}`;
}

function parseScriptJson(raw: string): AudioStudyScript {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) {
    throw new Error("Script model returned invalid JSON.");
  }
  const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as AudioStudyScript;
  if (!parsed.title || !parsed.script || !Array.isArray(parsed.sections)) {
    throw new Error("Script JSON missing required fields.");
  }
  return {
    title: String(parsed.title).trim(),
    durationEstimate: String(parsed.durationEstimate ?? "a few minutes").trim(),
    script: String(parsed.script).trim(),
    sections: parsed.sections.map((s) => ({
      title: String(s.title).trim(),
      text: String(s.text).trim(),
    })),
  };
}

export async function generateAudioStudyScript(
  input: AudioStudyAnalysisInput,
  limits: AudioStudyScriptLimits,
): Promise<AudioStudyScript> {
  const client = getGroqClient();
  const completion = await client.chat.completions.create(
    {
      model: AI_CONFIG.providers.groq.model,
      messages: [
        {
          role: "system",
          content:
            "You produce teacher-style audio lesson scripts as strict JSON. Never fabricate facts beyond the provided analysis.",
        },
        { role: "user", content: buildPrompt(input, limits) },
      ],
      temperature: 0.35,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    },
    { timeout: 60_000 },
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty script response from model.");
  return parseScriptJson(content);
}
