/**
 * SERVER ONLY — PowerPoint (.pptx) text extraction via OOXML (ZIP + XML).
 * No Keynote support. No visual slide analysis.
 */

import JSZip from "jszip";
import { filterDeckTopics, isLowQualityPresentationFragment } from "@/server/presentation/presentationFragments";
import { getPlanLimits, type PlanLimits } from "@/lib/plans/planLimits";
import { USER_MESSAGES } from "@/lib/user-messages";
import type { PlanId } from "@/types/plan";
import { applyPlanDocumentLimits } from "./applyPlanDocumentLimits";
import { cleanText } from "./cleanText";
import { EXTRACTION_CONFIG } from "./config";
import { ExtractionError } from "./errors";

export type PptxSlideExtract = {
  slideNumber: number;
  title?: string;
  text: string;
  characterCount: number;
};

export type PptxExtractionMetadata = {
  fileName: string;
  fileType: "pptx";
  slideCount: number;
  extractedCharacters: number;
  detectedSlideTitles: string[];
  repeatedThemes: string[];
  estimatedReadingTimeMinutes: number;
  complexity: "low" | "medium" | "high";
  sourceType: "presentation";
  truncated: boolean;
  wasChunked?: boolean;
  truncationStrategy?: string | null;
  limitNotice?: string | null;
};

export type PptxExtractionResult = {
  extractedText: string;
  metadata: PptxExtractionMetadata;
  slides: PptxSlideExtract[];
};

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const THEME_STOP = new Set([
  "slide",
  "title",
  "notes",
  "agenda",
  "overview",
  "summary",
  "section",
  "appendix",
  "thank",
  "questions",
]);

function parseRelationships(relsXml: string): Map<string, string> {
  const map = new Map<string, string>();
  const pattern =
    /<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"[^>]*\/?>/gi;
  for (const match of relsXml.matchAll(pattern)) {
    const id = match[1];
    let target = match[2].replace(/^\//, "");
    if (!target.startsWith("ppt/")) {
      target = `ppt/${target}`;
    }
    if (target.includes("/slides/slide")) {
      map.set(id, target);
    }
  }
  return map;
}

function parseSlidePaths(
  presentationXml: string,
  relMap: Map<string, string>,
): string[] {
  const paths: string[] = [];
  const idPattern = /<(?:p:)?sldId\b[^>]*\br:id="([^"]+)"/gi;
  for (const match of presentationXml.matchAll(idPattern)) {
    const path = relMap.get(match[1]);
    if (path) paths.push(path);
  }
  return paths;
}

function extractTextNodes(xml: string): string[] {
  return [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/gi)]
    .map((m) => m[1].replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractParagraphsFromSlideXml(xml: string): string[] {
  const paragraphs: string[] = [];
  const blocks = xml.split(/<a:p\b[^>]*>/i).slice(1);

  for (const block of blocks) {
    const end = block.search(/<\/a:p>/i);
    const chunk = end >= 0 ? block.slice(0, end) : block.slice(0, 4000);
    const joined = extractTextNodes(chunk).join(" ").trim();
    if (joined.length > 0) paragraphs.push(joined);
  }

  if (paragraphs.length === 0) {
    const fallback = extractTextNodes(xml).join(" ").trim();
    if (fallback) paragraphs.push(fallback);
  }

  return paragraphs;
}

function detectSlideTitle(paragraphs: string[], xml: string): string | undefined {
  const phMatch = xml.match(
    /<p:ph\b[^>]*type="(?:ctrTitle|title|subTitle)"[^>]*>[\s\S]*?<\/p:ph>/i,
  );
  if (phMatch) {
    const titleText = extractTextNodes(phMatch[0]).join(" ").trim();
    if (titleText.length >= 2) return titleText.slice(0, 120);
  }

  const first = paragraphs[0];
  if (first && first.length >= 3 && first.length <= 100) {
    return first.slice(0, 120);
  }

  const short = paragraphs.find((p) => p.length >= 3 && p.length <= 72);
  return short?.slice(0, 120);
}

function notesPathForSlide(slidePath: string): string | undefined {
  const fileName = slidePath.split("/").pop() ?? "";
  const num = fileName.match(/slide(\d+)\.xml/i)?.[1];
  if (!num) return undefined;
  return `ppt/notesSlides/notesSlide${num}.xml`;
}

function detectRepeatedThemes(slides: PptxSlideExtract[]): string[] {
  const freq = new Map<string, number>();

  const addPhrase = (phrase: string) => {
    const tokens = phrase
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 4 && !THEME_STOP.has(w));
    const unique = new Set(tokens);
    for (const t of unique) {
      freq.set(t, (freq.get(t) ?? 0) + 1);
    }
  };

  for (const slide of slides) {
    if (slide.title) addPhrase(slide.title);
    const firstLine = slide.text.split("\n")[0]?.trim();
    if (firstLine && firstLine.length <= 80) addPhrase(firstLine);
  }

  return [...freq.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);
}

function inferPptxComplexity(
  slideCount: number,
  charCount: number,
): "low" | "medium" | "high" {
  if (slideCount > 35 || charCount > 14_000) return "high";
  if (slideCount < 10 && charCount < 4_000) return "low";
  return "medium";
}

function buildExtractedText(slides: PptxSlideExtract[]): string {
  return slides
    .map((slide) => {
      const header = slide.title
        ? `--- Slide ${slide.slideNumber}: ${slide.title} ---`
        : `--- Slide ${slide.slideNumber} ---`;
      return `${header}\n${slide.text}`;
    })
    .join("\n\n");
}

export function isPptxFile(fileName: string, mimeType?: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pptx") return true;
  if (mimeType && (mimeType === PPTX_MIME || mimeType.includes("presentationml"))) {
    return true;
  }
  return false;
}

/**
 * Extract text from a .pptx buffer (slide order preserved).
 */
export async function extractFromPptx(params: {
  fileName: string;
  buffer: Buffer;
  planId?: PlanId;
  planLimits?: PlanLimits;
}): Promise<PptxExtractionResult> {
  const { fileName, buffer } = params;

  if (!fileName.trim()) {
    throw new ExtractionError("A file name is required.", 400);
  }

  if (!isPptxFile(fileName)) {
    throw new ExtractionError("File must be a .pptx presentation.", 400);
  }

  if (buffer.length === 0) {
    throw new ExtractionError("The uploaded file is empty.", 400);
  }

  const limits = params.planLimits ?? getPlanLimits(params.planId ?? "free");
  const maxBytes = limits.maxUploadMb * 1024 * 1024;

  if (buffer.length > maxBytes) {
    throw new ExtractionError(
      USER_MESSAGES.extractFileTooLarge(limits.maxUploadMb),
      413,
    );
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new ExtractionError(
      "Could not read this file as a PowerPoint (.pptx) archive.",
      422,
    );
  }

  const presentationXml = await zip.file("ppt/presentation.xml")?.async("string");
  const relsXml = await zip
    .file("ppt/_rels/presentation.xml.rels")
    ?.async("string");

  if (!presentationXml || !relsXml) {
    throw new ExtractionError(
      "Invalid PPTX: missing presentation structure.",
      422,
    );
  }

  const relMap = parseRelationships(relsXml);
  const slidePaths = parseSlidePaths(presentationXml, relMap);

  if (slidePaths.length === 0) {
    throw new ExtractionError(
      "No slides found in this presentation.",
      422,
    );
  }

  const slides: PptxSlideExtract[] = [];

  for (let i = 0; i < slidePaths.length; i += 1) {
    const slidePath = slidePaths[i];
    const slideXml = await zip.file(slidePath)?.async("string");
    if (!slideXml) continue;

    const paragraphs = extractParagraphsFromSlideXml(slideXml);
    const title = detectSlideTitle(paragraphs, slideXml);
    let body = paragraphs.join("\n");

    const notesPath = notesPathForSlide(slidePath);
    if (notesPath) {
      const notesXml = await zip.file(notesPath)?.async("string");
      if (notesXml) {
        const notes = extractTextNodes(notesXml).join(" ").trim();
        if (notes.length > 10) {
          body = body ? `${body}\n\n[Speaker notes] ${notes}` : `[Speaker notes] ${notes}`;
        }
      }
    }

    const text = body.trim();
    if (!text) continue;

    slides.push({
      slideNumber: slides.length + 1,
      title,
      text,
      characterCount: text.length,
    });
  }

  if (slides.length === 0) {
    throw new ExtractionError(
      "This presentation has no extractable text. It may be image-only.",
      422,
    );
  }

  const rawMerged = buildExtractedText(slides);
  const cleaned = cleanText(rawMerged);

  if (cleaned.length < EXTRACTION_CONFIG.minExtractedChars) {
    throw new ExtractionError(
      `Extracted text is too short (minimum ${EXTRACTION_CONFIG.minExtractedChars} characters).`,
      422,
    );
  }

  const applied = applyPlanDocumentLimits(cleaned, limits, {
    estimatedPages: slides.length,
  });
  const extractedText = applied.text;

  const detectedSlideTitles = slides
    .map((s) => s.title)
    .filter((t): t is string => Boolean(t && t.trim()))
    .filter((t) => !isLowQualityPresentationFragment(t));

  const repeatedThemes = filterDeckTopics(detectRepeatedThemes(slides));
  const charCount = applied.fullExtractedCharacters;

  return {
    extractedText,
    slides,
    metadata: {
      fileName,
      fileType: "pptx",
      slideCount: slides.length,
      extractedCharacters: charCount,
      detectedSlideTitles,
      repeatedThemes,
      estimatedReadingTimeMinutes: Math.max(1, Math.ceil(charCount / 900)),
      complexity: inferPptxComplexity(slides.length, charCount),
      sourceType: "presentation",
      truncated: applied.wasTruncated,
      wasChunked: applied.wasChunked,
      truncationStrategy: applied.truncationStrategy,
      limitNotice: applied.limitNotice,
    },
  };
}
