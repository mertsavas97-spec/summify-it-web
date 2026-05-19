import { filterDeckTopics } from "@/server/presentation/presentationFragments";
import type {
  DocumentProfile,
  DocumentTypeGuess,
  PresentationSourceContext,
} from "./types";
import type { KnowledgeLayer, KnowledgeSection } from "./types";

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "are", "was", "were",
]);

function firstSentence(text: string, maxLen = 320): string {
  const match = text.match(/^.+?[.!?](?:\s|$)/);
  const s = (match?.[0] ?? text.slice(0, maxLen)).trim();
  return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
}

function extractTitleGuess(text: string): string {
  const heading = text.match(/^#{1,2}\s+(.+)$/m)?.[1];
  if (heading) return heading.trim().slice(0, 120);

  const capsLine = text.match(/^[A-Z][A-Za-z0-9\s\-–—:]{5,80}$/m)?.[0];
  if (capsLine) return capsLine.trim();

  const firstLine = text.split("\n").find((l) => l.trim().length > 10)?.trim();
  return (firstLine ?? "Untitled document").slice(0, 120);
}

function splitPresentationSections(text: string): KnowledgeSection[] {
  const sections: KnowledgeSection[] = [];
  const pattern =
    /---\s*Slide\s+(\d+)(?::\s*([^\n-]+))?\s*---\n([\s\S]*?)(?=\n---\s*Slide\s+\d+|$)/gi;

  for (const match of text.matchAll(pattern)) {
    const slideNum = match[1];
    const titleFromMarker = match[2]?.trim();
    const body = match[3]?.trim() ?? "";
    if (body.length < 20) continue;

    const heading = titleFromMarker
      ? `Slide ${slideNum}: ${titleFromMarker}`
      : `Slide ${slideNum}`;
    const excerpt = body.slice(0, 400).trim();
    const importance: KnowledgeSection["importance"] =
      excerpt.length > 200 ? "high" : excerpt.length > 80 ? "medium" : "low";

    sections.push({
      heading: heading.slice(0, 80),
      excerpt,
      importance,
    });
    if (sections.length >= 8) break;
  }

  return sections;
}

function splitSections(text: string): KnowledgeSection[] {
  const parts = text.split(/(?=^#{1,3}\s+|^[A-Z][A-Za-z0-9\s\-–—:]{3,60}$)/m);
  const sections: KnowledgeSection[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length < 80) continue;

    const lines = trimmed.split("\n");
    const heading = lines[0]?.replace(/^#+\s*/, "").trim() || "Section";
    const body = lines.slice(1).join("\n").trim() || trimmed;
    const excerpt = body.slice(0, 400).trim();
    if (!excerpt) continue;

    const importance: KnowledgeSection["importance"] =
      excerpt.length > 280 ? "high" : excerpt.length > 120 ? "medium" : "low";

    sections.push({ heading: heading.slice(0, 80), excerpt, importance });
    if (sections.length >= 8) break;
  }

  if (sections.length === 0) {
    const paras = text.split(/\n\n+/).filter((p) => p.trim().length > 60);
    paras.slice(0, 5).forEach((p, i) => {
      sections.push({
        heading: `Section ${i + 1}`,
        excerpt: p.trim().slice(0, 400),
        importance: i === 0 ? "high" : "medium",
      });
    });
  }

  return sections.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.importance] - rank[b.importance];
  });
}

function extractTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const candidates = [
    "strategy", "finance", "legal", "research", "marketing", "operations",
    "product", "compliance", "technology", "growth", "risk", "policy",
  ];
  const found = candidates.filter((t) => lower.includes(t));
  if (found.length > 0) return found.slice(0, 6);

  const words = lower.match(/\b[a-z]{5,14}\b/g) ?? [];
  const freq = new Map<string, number>();
  for (const w of words) {
    if (STOP_WORDS.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

function extractEntities(text: string): string[] {
  const matches =
    text.match(
      /\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}|[A-Z]{2,}(?:\s+[A-Z][a-z]+)*)\b/g,
    ) ?? [];
  const unique = [...new Set(matches.map((m) => m.trim()))];
  return unique
    .filter((e) => e.length > 2 && e.length < 48)
    .filter((e) => !["The", "This", "That", "These", "Those"].includes(e))
    .slice(0, 10);
}

function extractDistinctivePhrases(text: string): string[] {
  const phrases: string[] = [];
  const quoted = [...text.matchAll(/"([^"]{8,100})"/g)].map((m) => m[1].trim());
  phrases.push(...quoted);

  const sectionHeadings = text.match(/^#{1,3}\s+(.+)$/gm) ?? [];
  for (const h of sectionHeadings) {
    const t = h.replace(/^#+\s*/, "").trim();
    if (t.length >= 4 && t.length <= 80) phrases.push(t);
  }

  const numbers = text.match(
    /\b(?:\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?%?)\s*(?:million|billion|days|months|years|Q[1-4]\s*\d{4})?/gi,
  );
  if (numbers) phrases.push(...numbers.slice(0, 4).map((n) => n.trim()));

  const unique = [...new Set(phrases.map((p) => p.trim()))].filter(Boolean);
  return unique.slice(0, 8);
}

function buildQuestions(
  typeGuess: DocumentTypeGuess,
  topics: string[],
): string[] {
  const base = ["What are the most important takeaways from this document?"];

  const byType: Partial<Record<DocumentTypeGuess, string[]>> = {
    legal_contract: ["What are the key obligations and dates?"],
    policy_document: ["What rules or policy requirements are stated?"],
    research_paper: ["What methodology and limitations are stated?"],
    business_report: ["What metrics or outcomes are reported?"],
    meeting_notes: ["What decisions and action items were captured?"],
    creator_brief: ["What hooks and deliverables are specified?"],
    presentation_deck: ["What is the deck's core narrative arc?"],
    pitch_deck: ["What problem, solution, and market story are presented?"],
    lecture_deck: ["What concepts should a learner retain from the slides?"],
    report_deck: ["What metrics or outcomes does the deck report?"],
    marketing_deck: ["What campaign message and audience are targeted?"],
    strategy_deck: ["What strategic choices or tradeoffs are presented?"],
  };

  const extra = byType[typeGuess] ?? [];
  topics.slice(0, 2).forEach((t) => {
    extra.push(`How does the document address ${t}?`);
  });

  return [...base, ...extra].slice(0, 5);
}

export type BuildKnowledgeLayerOptions = {
  presentationContext?: PresentationSourceContext;
};

/**
 * Deterministic compact knowledge layer (no AI call).
 */
export function buildKnowledgeLayer(
  cleanedText: string,
  profile: DocumentProfile,
  options?: BuildKnowledgeLayerOptions,
): KnowledgeLayer {
  const isPresentation = options?.presentationContext?.sourceKind === "presentation";
  const titleGuess =
    options?.presentationContext?.detectedSlideTitles[0] ??
    extractTitleGuess(cleanedText);
  let keySections = isPresentation
    ? splitPresentationSections(cleanedText)
    : splitSections(cleanedText);
  if (isPresentation && keySections.length === 0) {
    keySections = splitSections(cleanedText);
  }
  const baseTopics = extractTopics(cleanedText);
  const themeTopics = filterDeckTopics(
    options?.presentationContext?.repeatedThemes ?? [],
  );
  const detectedTopics = [...new Set([...themeTopics, ...baseTopics])].slice(0, 8);
  const namedEntities = extractEntities(cleanedText);
  const distinctivePhrases = extractDistinctivePhrases(cleanedText);

  const overviewParts = keySections
    .filter((s) => s.importance === "high")
    .slice(0, 2)
    .map((s) => firstSentence(s.excerpt, 160));
  const compressedOverview =
    overviewParts.join(" ") || firstSentence(cleanedText, 400);

  const warnings: string[] = [];
  if (profile.needsChunking) {
    warnings.push("Document exceeds single-pass preview limits; full chunking coming later.");
  }
  if (profile.structureQuality === "weak") {
    warnings.push("Weak structural signals — analysis relies on raw text heuristics.");
  }
  if (profile.sourceQuality === "thin") {
    warnings.push("Source text is short — include this limitation in risksOrWarnings.");
  }
  if (profile.sourceQuality === "fragmented") {
    warnings.push("Source text is fragmented — flag coverage gaps in risksOrWarnings.");
  }
  if (isPresentation) {
    warnings.push(
      "Slide deck source — do not treat bullet fragments as full paragraphs; infer flow from slide order.",
    );
  }

  return {
    titleGuess,
    compressedOverview,
    keySections,
    detectedTopics,
    namedEntities,
    distinctivePhrases,
    potentialQuestions: buildQuestions(profile.documentTypeGuess, detectedTopics),
    warnings,
  };
}

export function summarizeKnowledgeLayer(layer: KnowledgeLayer): {
  titleGuess: string;
  sectionCount: number;
  topicCount: number;
  overviewPreview: string;
  warningCount: number;
} {
  return {
    titleGuess: layer.titleGuess,
    sectionCount: layer.keySections.length,
    topicCount: layer.detectedTopics.length,
    overviewPreview:
      layer.compressedOverview.length > 180
        ? `${layer.compressedOverview.slice(0, 180)}…`
        : layer.compressedOverview,
    warningCount: layer.warnings.length,
  };
}
