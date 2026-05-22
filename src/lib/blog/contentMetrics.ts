export type BlogContentMetrics = {
  wordCount: number;
  readingTimeMinutes: number;
  readingTimeLabel: string;
  h2Count: number;
  h3Count: number;
  internalLinkCount: number;
  externalLinkCount: number;
  faqCount: number;
  ctaCount: number;
  imageCount: number;
};

const INTERNAL_HOST_HINTS = ["summify", "localhost"];

function isInternalHref(href: string): boolean {
  if (href.startsWith("/")) return true;
  try {
    const host = new URL(href).hostname.toLowerCase();
    return INTERNAL_HOST_HINTS.some((h) => host.includes(h));
  } catch {
    return false;
  }
}

export function analyzeMarkdownContent(markdown: string): BlogContentMetrics {
  const body = markdown.trim();
  const words = body ? body.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 220));

  const h2Count = (body.match(/^##\s+/gm) ?? []).length;
  const h3Count = (body.match(/^###\s+/gm) ?? []).length;

  const linkMatches = [...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)];
  let internalLinkCount = 0;
  let externalLinkCount = 0;
  for (const m of linkMatches) {
    const href = m[1]?.trim() ?? "";
    if (!href || href.startsWith("#")) continue;
    if (isInternalHref(href)) internalLinkCount += 1;
    else externalLinkCount += 1;
  }

  const faqFenceCount = (body.match(/```faq/g) ?? []).length;
  const faqHeading = /^##\s+faq/im.test(body) ? 1 : 0;
  const faqCount = faqFenceCount + faqHeading;

  const ctaCount =
    (body.match(/```cta/g) ?? []).length + (body.match(/:::cta/g) ?? []).length;

  const imageCount =
    (body.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []).length +
    (body.match(/<img\s/gi) ?? []).length;

  return {
    wordCount: words,
    readingTimeMinutes: minutes,
    readingTimeLabel: `${minutes} min read`,
    h2Count,
    h3Count,
    internalLinkCount,
    externalLinkCount,
    faqCount,
    ctaCount,
    imageCount,
  };
}
