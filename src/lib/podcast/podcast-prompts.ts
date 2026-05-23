import {
  LEARNING_OUTPUT_LANGUAGE,
  normalizeLearningLanguage,
  sourceLanguageGroundingNote,
} from "@/lib/learning/normalizeLearningLanguage";
import type { PodcastDensityMode, PodcastDiscussionAnalysisInput } from "./podcast-types";

export type PodcastLengthPlan = {
  durationRange: string;
  targetWordRange: string;
  maxWords: number;
  densityMode: PodcastDensityMode;
};

function lines(items: string[] | undefined, empty = "(none)"): string {
  if (!items?.length) return empty;
  return items.map((item) => `- ${item}`).join("\n");
}

function sourceFraming(input: PodcastDiscussionAnalysisInput): string {
  const documentType = input.sourceMetadata?.documentType?.toLowerCase() ?? "";
  const sourceType = input.sourceType?.toLowerCase() ?? "";

  if (documentType.includes("research") || documentType.includes("academic") || documentType.includes("paper")) {
    return "Research framing: be analytical and evidence-oriented. Distinguish claims from evidence, discuss methodology briefly, acknowledge limitations, and highlight contributions. Use precise language.";
  }
  if (sourceType.includes("youtube") || documentType.includes("lecture") || documentType.includes("tutorial")) {
    return "Lecture framing: be explanatory and teaching-focused. Build concepts step by step, use analogies, check understanding with rhetorical questions, and summarize key takeaways.";
  }
  if (
    documentType.includes("business") ||
    documentType.includes("report") ||
    documentType.includes("deck") ||
    documentType.includes("presentation") ||
    input.intelligenceMode?.includes("executive")
  ) {
    return "Business framing: discuss decisions, implications, tradeoffs, and strategic meaning. Be concise and insight-driven. Focus on what matters for action.";
  }
  if (documentType.includes("book") || documentType.includes("documentary") || documentType.includes("article")) {
    return "Narrative framing: bring out themes, turning points, and interpretation. Discuss character or argument development. Connect ideas to broader context without inventing scenes.";
  }
  if (sourceType.includes("url") || documentType.includes("web")) {
    return "Web content framing: extract signal from noise. Focus on the core argument or insight, contextualize with background, and separate fact from opinion.";
  }
  return "General framing: make the discussion thoughtful, structured, and source-grounded. Build understanding progressively.";
}

function modeFraming(mode: string | null | undefined): string {
  const normalized = mode?.toLowerCase() ?? "";
  if (normalized.includes("student")) {
    return "Mode framing: orient toward exam prep, conceptual clarification, and durable understanding. Define terms, use examples, and build from fundamentals.";
  }
  if (normalized.includes("executive")) {
    return "Mode framing: prioritize decisions, strategic summaries, implications, and risk-aware nuance. Skip basics, focus on what changes and why it matters.";
  }
  if (normalized.includes("creator")) {
    return "Mode framing: surface audience insight, storytelling angles, creative implications, and what lands. Discuss craft and execution, not just content.";
  }
  if (normalized.includes("research") || normalized.includes("analyst")) {
    return "Mode framing: prioritize methodological rigor, evidence quality, and alternative interpretations. Engage critically with claims and data.";
  }
  return "Mode framing: follow the selected analysis lens while preserving a clear educational discussion.";
}

/**
 * Density-specific framing for podcast discussions.
 */
function densityFraming(density: PodcastDensityMode): string {
  switch (density) {
    case "quick":
      return `DENSITY: Quick Discussion
- Keep exchanges concise and focused
- Aim for 3–6 minute total duration
- Prioritize the single most important insight
- Use 6–10 dialogue turns maximum
- Skip extended examples or tangents
- Host drives pace; expert responds efficiently`;

    case "standard":
      return `DENSITY: Standard Discussion
- Balanced pacing with room for exploration
- Aim for 6–12 minute total duration
- Cover 3–5 key discussion beats
- Use 12–20 dialogue turns
- Include one clarifying example per major point
- Natural back-and-forth with smooth transitions`;

    case "deep-dive":
      return `DENSITY: Deep Dive Discussion
- Thorough exploration with layered analysis
- Aim for 12–20 minute total duration
- Cover multiple angles and implications
- Each dialogue turn must be substantial — at least 60-80 words per turn
- Prioritize depth and completeness over number of turns
- Include examples, counterpoints, and context
- Build complexity gradually; connect ideas across segments`;

    case "critical":
      return `DENSITY: Critical Analysis
- Analytical and questioning approach
- Challenge assumptions and examine weaknesses
- Discuss alternative interpretations
- Evaluate evidence quality and methodology
- Maintain intellectual rigor without being contrarian
- Host plays devil's advocate; expert defends with evidence`;

    case "debate":
      return `DENSITY: Debate Mode
- Two perspectives in productive tension
- Host raises counterarguments and contrasting views
- Expert defends the source's position with evidence
- Disagreement is respectful and idea-focused
- Explore where reasonable people might differ
- End with synthesis or agreed-upon uncertainty`;

    default:
      return `DENSITY: Standard Discussion
- Balanced pacing with natural conversational flow`;
  }
}

function learnCards(input: PodcastDiscussionAnalysisInput): string {
  const cards = input.learnCards?.filter((card) => !card.isLockedPreview).slice(0, 12) ?? [];
  if (!cards.length) return "(none)";
  return cards
    .map((card) => `- [${card.type}] ${card.title}: ${card.content.slice(0, 320)}`)
    .join("\n");
}

function quizQuestions(input: PodcastDiscussionAnalysisInput): string {
  const questions = input.quizQuestions?.slice(0, 8) ?? [];
  if (!questions.length) return "(none)";
  return questions
    .map((question) =>
      question.theme
        ? `- ${question.question} (theme: ${question.theme})`
        : `- ${question.question}`,
    )
    .join("\n");
}

export const PODCAST_DISCUSSION_SYSTEM = `You write thoughtful educational podcast discussions as strict JSON.
The discussion must be grounded only in the provided Summify analysis.
Never mention AI, prompts, hidden data, Learn cards, or internal product mechanics.

CONVERSATIONAL REALISM:
- Natural transitions between topics ("That connects to...", "Building on that point...")
- Occasional brief acknowledgments ("Right", "Exactly", "That's a good point")
- Contextual callbacks to earlier discussion points
- Varied sentence length — some short punchy lines, some longer explanations
- Host occasionally paraphrases expert points to confirm understanding
- Expert occasionally asks rhetorical questions to engage the listener
- Smooth speaker handoffs — avoid abrupt topic jumps

AVOID:
- Radio-host hype, fake jokes, filler banter, exaggerated claims
- "As an AI" language or any reference to being generated
- Overusing filler phrases ("you know", "like", "basically")
- Theatrical or cringe podcast energy
- Repetitive phrasing or overexplaining simple points
- Stage directions, sound effects, or audio instructions

Return one JSON object and nothing else.`;

export function buildPodcastDiscussionPrompt(
  input: PodcastDiscussionAnalysisInput,
  lengthPlan: PodcastLengthPlan,
): string {
  const density = lengthPlan.densityMode ?? "standard";

  return `Write a two-speaker podcast discussion for Summify Podcast Mode.

${normalizeLearningLanguage()}
${sourceLanguageGroundingNote()}

All title, outline, and dialogue fields must be written in natural ${LEARNING_OUTPUT_LANGUAGE}.

TONE:
- Thoughtful educational podcast: conversational, intelligent, structured, reflective, and slightly narrative
- Sound human without banter, hype, repetition, fake jokes, or overexplaining
- Host asks questions, reframes ideas, transitions naturally, and keeps pacing moving
- Expert explains clearly, adds nuance, clarifies examples, and summarizes concepts
- Never fabricate source details beyond the analysis below

${sourceFraming(input)}
${modeFraming(input.intelligenceMode)}
${densityFraming(density)}

STRUCTURE:
Adapt the structure to the density mode, but generally include:
1. Intro hook — what we're discussing and why it matters
2. Main thesis or core idea
3. Discussion beats — explore key insights with natural transitions
4. Examples or clarification — make abstract ideas concrete
5. Common misunderstanding or counterpoint
6. Real-world implications
7. Short recap and reflection question

LENGTH:
- Aim for ${lengthPlan.targetWordRange} total dialogue words
- Estimated duration should fit ${lengthPlan.durationRange}
- Hard maximum is ${lengthPlan.maxWords} dialogue words
- IMPORTANT: The word count target is a minimum, not a maximum. If the content requires more turns to reach the target, add more turns.
- Keep turns spoken and substantial; vary length and speaker rhythm
- estimatedDurationMinutes should be a realistic number based on word count (≈145 words/min)

OUTPUT JSON SHAPE:
{
  "title": string,
  "estimatedDurationMinutes": number,
  "speakers": [
    { "id": "host", "name": "Host" },
    { "id": "expert", "name": "Expert" }
  ],
  "outline": [{ "title": string, "summary": string }],
  "script": [{ "speaker": "host" | "expert", "text": string }],
  "totalWordCount": number
}

REQUIRED OUTPUT RULES:
- Use exactly the two speakers Host and Expert with ids host and expert
- Outline should reflect the structure above in concise episode beats
- Script must be dialogue turns, not one narration blob
- End with a short recap and one reflection question in dialogue
- Do not include stage directions, sound effects, timestamps, markdown, or audio instructions
- estimatedDurationMinutes must be realistic: calculate as totalWordCount / 145, rounded

SOURCE TITLE: ${input.title}
SOURCE TYPE: ${input.sourceType ?? "document"}
SOURCE LABEL: ${input.sourceMetadata?.sourceLabel ?? "(none)"}
DOCUMENT TYPE: ${input.sourceMetadata?.documentType ?? "(unknown)"}
INTELLIGENCE MODE: ${input.intelligenceMode ?? "general"}

SUMMARY:
${input.summary}

KEY INSIGHTS:
${lines(input.keyInsights)}

LEARN CANDIDATES:
${learnCards(input)}

QUIZ QUESTIONS:
${quizQuestions(input)}`;
}
