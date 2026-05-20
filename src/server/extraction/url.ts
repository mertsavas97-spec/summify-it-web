/**
 * SERVER ONLY — public web article URL extraction (cheerio-only, no jsdom).
 */

import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { getPlanLimits, type PlanLimits } from "@/lib/plans/planLimits";
import type { PlanId } from "@/types/plan";
import { EXTRACTION_CONFIG } from "./config";
import { applyPlanDocumentLimits } from "./applyPlanDocumentLimits";
import { cleanText } from "./cleanText";
import { profileExtractedText } from "./profile";
import { USER_MESSAGES } from "@/lib/user-messages";
import { ExtractionError } from "./errors";

export type UrlExtractionMetadata = {
  title: string;
  sourceUrl: string;
  siteName?: string;
  extractedCharacters: number;
  estimatedReadingTimeMinutes: number;
  complexity: "low" | "medium" | "high";
  truncated: boolean;
  wasChunked?: boolean;
  truncationStrategy?: string | null;
  limitNotice?: string | null;
};

export type UrlExtractionResult = {
  extractedText: string;
  metadata: UrlExtractionMetadata;
};

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
]);

const PRIVATE_IPV4_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1\d{2}|2[0-4]\d|25[0-5])\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
];

const FETCH_USER_AGENT =
  "Summify/1.0 (+https://summify.app; article extraction for user-initiated analysis)";

const STRIP_SELECTORS = [
  "script",
  "style",
  "nav",
  "footer",
  "header",
  "aside",
  "menu",
  "noscript",
  "iframe",
  "svg",
  "form",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  ".nav",
  ".navbar",
  ".menu",
  ".footer",
  ".header",
  ".sidebar",
  ".ad",
  ".ads",
  ".advertisement",
  ".cookie",
  ".newsletter",
].join(", ");

const CONTENT_SELECTORS = [
  "article",
  '[role="main"]',
  "main",
  ".post-content",
  ".article-content",
  ".entry-content",
  ".story-body",
  ".article-body",
  "#article-body",
  ".content",
];

function isIpv4(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function isPrivateOrReservedIpv4(hostname: string): boolean {
  if (!isIpv4(hostname)) return false;
  return PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(hostname));
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".localhost")) return true;
  if (host.endsWith(".local")) return true;
  if (isPrivateOrReservedIpv4(host)) return true;
  if (host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }
  return false;
}

export function assertSafeHttpUrl(urlString: string): URL {
  let url: URL;
  try {
    url = new URL(urlString.trim());
  } catch {
    throw new ExtractionError(USER_MESSAGES.urlInvalid, 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ExtractionError(USER_MESSAGES.urlInvalid, 400);
  }

  if (url.username || url.password) {
    throw new ExtractionError(USER_MESSAGES.urlBlocked, 400);
  }

  if (isBlockedHostname(url.hostname)) {
    throw new ExtractionError(USER_MESSAGES.urlBlocked, 400);
  }

  return url;
}

async function readResponseWithLimit(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return response.text();
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ExtractionError(
        "The page is too large to extract. Try a shorter article or paste text directly.",
        413,
      );
    }
    chunks.push(value);
  }

  const buffer = Buffer.concat(chunks);
  const charset =
    response.headers.get("content-type")?.match(/charset=([^;]+)/i)?.[1]?.trim() ??
    "utf-8";
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return new TextDecoder("utf-8").decode(buffer);
  }
}

async function fetchHtml(url: URL): Promise<{ html: string; finalUrl: string }> {
  let currentUrl = url;
  let redirectCount = 0;

  while (redirectCount <= EXTRACTION_CONFIG.urlMaxRedirects) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      EXTRACTION_CONFIG.urlTimeoutMs,
    );

    let response: Response;
    try {
      response = await fetch(currentUrl.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "User-Agent": FETCH_USER_AGENT,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ExtractionError(
          "The request timed out. Try again or paste the article text.",
          408,
        );
      }
      throw new ExtractionError(USER_MESSAGES.urlFetchFailed, 502);
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new ExtractionError("The server returned an invalid redirect.", 502);
      }
      currentUrl = new URL(location, currentUrl);
      assertSafeHttpUrl(currentUrl.toString());
      redirectCount += 1;
      continue;
    }

    if (!response.ok) {
      throw new ExtractionError(
        "This page couldn't be loaded. It may be unavailable or blocked.",
        422,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      throw new ExtractionError(
        "This URL does not appear to be an HTML article page.",
        422,
      );
    }

    const html = await readResponseWithLimit(
      response,
      EXTRACTION_CONFIG.urlMaxHtmlBytes,
    );
    return { html, finalUrl: currentUrl.toString() };
  }

  throw new ExtractionError("Too many redirects from this URL.", 422);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function textFromBlocks($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>): string {
  const blocks: string[] = [];
  root.find("h1, h2, h3, h4, p, li, blockquote").each((_, el) => {
    const tag = "tagName" in el && typeof el.tagName === "string" ? el.tagName.toLowerCase() : "";
    const raw = $(el).text();
    const text = normalizeWhitespace(raw);
    if (!text) return;
    const minLen = tag === "li" ? 12 : 24;
    if (text.length < minLen) return;
    if (blocks.at(-1) === text) return;
    blocks.push(text);
  });

  if (blocks.length >= 2) {
    return blocks.join("\n\n");
  }

  return normalizeWhitespace(root.text());
}

function extractWithCheerio(html: string): { text: string; title: string } {
  const $ = cheerio.load(html);
  $(STRIP_SELECTORS).remove();

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const docTitle = $("title").first().text().trim();
  const h1Title = $("h1").first().text().trim();
  const title = ogTitle || docTitle || h1Title || "Web article";

  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim();

  let bodyText = "";
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first();
    if (!el.length) continue;
    const candidate = textFromBlocks($, el);
    if (candidate.length > bodyText.length) {
      bodyText = candidate;
    }
    if (bodyText.length >= 400) break;
  }

  if (bodyText.length < EXTRACTION_CONFIG.minExtractedChars) {
    bodyText = textFromBlocks($, $("body"));
  }

  const parts: string[] = [];
  if (metaDescription && metaDescription.length >= 40) {
    parts.push(metaDescription);
  }
  if (bodyText) {
    parts.push(bodyText);
  }

  return {
    title,
    text: parts.join("\n\n"),
  };
}

function parseSiteMeta(html: string, pageUrl: string) {
  const $ = cheerio.load(html);
  const ogSite = $('meta[property="og:site_name"]').attr("content")?.trim();
  const appName = $('meta[name="application-name"]').attr("content")?.trim();
  let siteName = ogSite || appName;
  if (!siteName) {
    try {
      siteName = new URL(pageUrl).hostname.replace(/^www\./, "");
    } catch {
      siteName = undefined;
    }
  }
  return { siteName };
}

function estimateReadingMinutes(charCount: number): number {
  const words = Math.max(1, charCount / 5);
  return Math.max(1, Math.round(words / 200));
}

/**
 * Fetch and extract readable article text from a public http(s) URL.
 */
export async function extractFromUrl(
  urlString: string,
  options?: { planId?: PlanId; planLimits?: PlanLimits },
): Promise<UrlExtractionResult> {
  const safeUrl = assertSafeHttpUrl(urlString);
  const { html, finalUrl } = await fetchHtml(safeUrl);
  const { siteName } = parseSiteMeta(html, finalUrl);

  const { text: rawText, title } = extractWithCheerio(html);
  const cleaned = cleanText(rawText);

  if (cleaned.length < EXTRACTION_CONFIG.minExtractedChars) {
    throw new ExtractionError(
      `Could not extract enough article text (minimum ${EXTRACTION_CONFIG.minExtractedChars} characters). The page may be paywalled, login-only, or not article-shaped. Try pasting the text instead.`,
      422,
    );
  }

  const limits = options?.planLimits ?? getPlanLimits(options?.planId ?? "free");
  const applied = applyPlanDocumentLimits(cleaned, limits);
  const profile = profileExtractedText(cleaned);

  return {
    extractedText: applied.text,
    metadata: {
      title,
      sourceUrl: finalUrl,
      siteName,
      extractedCharacters: applied.fullExtractedCharacters,
      estimatedReadingTimeMinutes: estimateReadingMinutes(applied.analyzedCharacters),
      complexity: profile.complexity,
      truncated: applied.wasTruncated,
      wasChunked: applied.wasChunked,
      truncationStrategy: applied.truncationStrategy,
      limitNotice: applied.limitNotice,
    },
  };
}
