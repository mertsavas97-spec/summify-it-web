import type { CmsBlogPostInput } from "@/types/cms-blog";
import { analyzeMarkdownContent } from "@/lib/blog/contentMetrics";

export type SeoCheckStatus = "pass" | "warn" | "fail";

export type SeoCheckItem = {
  id: string;
  label: string;
  status: SeoCheckStatus;
  detail?: string;
  points: number;
  maxPoints: number;
};

export type SeoScoreResult = {
  score: number;
  checks: SeoCheckItem[];
  publishWarnings: string[];
  publishBlocked: string[];
};

type ScoreInput = CmsBlogPostInput & {
  existingSlugs?: string[];
  ignoreSlug?: string;
};

function check(
  id: string,
  label: string,
  status: SeoCheckStatus,
  points: number,
  maxPoints: number,
  detail?: string,
): SeoCheckItem {
  return { id, label, status, points: status === "pass" ? points : status === "warn" ? Math.round(points * 0.5) : 0, maxPoints, detail };
}

export function computeBlogSeoScore(input: ScoreInput): SeoScoreResult {
  const title = (input.seoTitle || input.title).trim();
  const meta = (input.seoDescription || input.excerpt || "").trim();
  const slug = input.slug.trim();
  const keyword = (input.primaryKeyword || "").trim().toLowerCase();
  const body = input.markdownBody.trim();
  const metrics = analyzeMarkdownContent(body);
  const intro = body.slice(0, 600).toLowerCase();

  const checks: SeoCheckItem[] = [];

  const titleLen = title.length;
  checks.push(
    titleLen >= 45 && titleLen <= 65
      ? check("title-length", "Title length (45–65 chars)", "pass", 10, 10, `${titleLen} chars`)
      : titleLen > 0
        ? check("title-length", "Title length (45–65 chars)", "warn", 10, 10, `${titleLen} chars`)
        : check("title-length", "Title length (45–65 chars)", "fail", 10, 10, "Missing SEO title"),
  );

  const metaLen = meta.length;
  checks.push(
    metaLen >= 120 && metaLen <= 160
      ? check("meta-length", "Meta description (120–160 chars)", "pass", 10, 10, `${metaLen} chars`)
      : metaLen > 0
        ? check("meta-length", "Meta description (120–160 chars)", "warn", 10, 10, `${metaLen} chars`)
        : check("meta-length", "Meta description (120–160 chars)", "fail", 10, 10, "Missing meta description"),
  );

  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3;
  checks.push(
    slugOk
      ? check("slug", "URL slug readable", "pass", 8, 8)
      : check("slug", "URL slug readable", "fail", 8, 8, "Use lowercase letters, numbers, and hyphens"),
  );

  const dupSlug =
    slug &&
    (input.existingSlugs ?? []).filter((s) => s !== input.ignoreSlug).includes(slug);
  checks.push(
    !dupSlug
      ? check("slug-unique", "Slug unique", "pass", 8, 8)
      : check("slug-unique", "Slug unique", "fail", 8, 8, "Another post uses this slug"),
  );

  checks.push(
    keyword
      ? check("keyword", "Primary keyword set", "pass", 6, 6)
      : check("keyword", "Primary keyword set", "warn", 6, 6, "Add a primary keyword"),
  );

  if (keyword) {
    const inTitle = title.toLowerCase().includes(keyword);
    const inIntro = intro.includes(keyword);
    checks.push(
      inTitle
        ? check("keyword-title", "Keyword in SEO title", "pass", 6, 6)
        : check("keyword-title", "Keyword in SEO title", "warn", 6, 6),
    );
    checks.push(
      inIntro
        ? check("keyword-intro", "Keyword in intro", "pass", 6, 6)
        : check("keyword-intro", "Keyword in intro", "warn", 6, 6),
    );
  } else {
    checks.push(check("keyword-title", "Keyword in SEO title", "warn", 6, 6));
    checks.push(check("keyword-intro", "Keyword in intro", "warn", 6, 6));
  }

  checks.push(
    input.title.trim()
      ? check("h1", "Article title (H1)", "pass", 6, 6)
      : check("h1", "Article title (H1)", "fail", 6, 6),
  );

  checks.push(
    metrics.h2Count >= 2
      ? check("h2", "At least 2 H2 sections", "pass", 8, 8, `${metrics.h2Count} H2`)
      : metrics.h2Count === 1
        ? check("h2", "At least 2 H2 sections", "warn", 8, 8, "1 H2")
        : check("h2", "At least 2 H2 sections", "fail", 8, 8, "Add ## headings"),
  );

  checks.push(
    metrics.wordCount >= 900
      ? metrics.wordCount >= 1200 && metrics.wordCount <= 2200
        ? check("words", "Word count (ideal 1200–2200)", "pass", 12, 12, `${metrics.wordCount} words`)
        : check("words", "Word count (ideal 1200–2200)", "warn", 12, 12, `${metrics.wordCount} words`)
      : check("words", "Word count (min 900)", "fail", 12, 12, `${metrics.wordCount} words`),
  );

  checks.push(
    metrics.internalLinkCount >= 3
      ? check("internal-links", "Internal links (3+)", "pass", 8, 8, `${metrics.internalLinkCount}`)
      : metrics.internalLinkCount > 0
        ? check("internal-links", "Internal links (3+)", "warn", 8, 8, `${metrics.internalLinkCount}`)
        : check("internal-links", "Internal links (3+)", "fail", 8, 8),
  );

  checks.push(
    metrics.externalLinkCount >= 1
      ? check("external-links", "External link (if relevant)", "pass", 4, 4)
      : check("external-links", "External link (if relevant)", "warn", 4, 4, "Optional but recommended"),
  );

  checks.push(
    metrics.ctaCount >= 1
      ? check("cta", "CTA block present", "pass", 6, 6)
      : check("cta", "CTA block present", "warn", 6, 6, "Add ```cta fence"),
  );

  checks.push(
    metrics.faqCount >= 1 || (input.faqs?.length ?? 0) > 0
      ? check("faq", "FAQ content present", "pass", 6, 6)
      : check("faq", "FAQ content present", "warn", 6, 6, "Add FAQ block where appropriate"),
  );

  checks.push(
    (input.canonicalUrl || "").trim()
      ? check("canonical", "Canonical URL", "pass", 4, 4)
      : check("canonical", "Canonical URL", "warn", 4, 4, "Defaults to /blog/slug on publish"),
  );

  checks.push(
    (input.ogTitle || "").trim() && (input.ogDescription || "").trim()
      ? check("og", "Open Graph title & description", "pass", 6, 6)
      : check("og", "Open Graph title & description", "warn", 6, 6),
  );

  checks.push(
    input.status === "published" || input.status === "draft"
      ? check("status", "Valid publish status", "pass", 4, 4)
      : check("status", "Valid publish status", "warn", 4, 4),
  );

  const maxScore = checks.reduce((s, c) => s + c.maxPoints, 0);
  const score = Math.round(
    (checks.reduce((s, c) => s + c.points, 0) / Math.max(maxScore, 1)) * 100,
  );

  const publishWarnings: string[] = [];
  if (score < 70) publishWarnings.push(`SEO score is ${score}/100 (below 70).`);
  if (metaLen < 120) publishWarnings.push("Meta description is short or missing.");
  if (metrics.internalLinkCount < 1) publishWarnings.push("No internal links detected.");
  if (metrics.ctaCount < 1) publishWarnings.push("No CTA block detected.");
  if (dupSlug) publishWarnings.push("Slug conflicts with another post.");

  const publishBlocked: string[] = [];
  if (!input.title.trim()) publishBlocked.push("Title is required.");
  if (!slug.trim()) publishBlocked.push("Slug is required.");
  if (!body) publishBlocked.push("Body content is required.");

  return { score, checks, publishWarnings, publishBlocked };
}
