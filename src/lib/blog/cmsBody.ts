import sanitizeHtml from "sanitize-html";

export type CmsBlogBodyFormat = "markdown" | "html";

const HTML_BODY_PATTERN =
  /<(?:h[1-4]|p|ul|ol|li|a|strong|em|b|i|hr|blockquote|code|pre|br|img)(?:\s|>|\/)/i;

/** Broken or retired blog paths → live replacements (Ahrefs crawl fixes). */
const INTERNAL_HREF_REWRITES: Record<string, string> = {
  "/blog/active-recall-vs-rereading": "/blog/audio-learning-vs-rereading",
  "/blog/how-adhd-students-study-with-ai": "/adhd-study-tool",
  "/blog/best-notebooklm-alternatives": "/compare/notebooklm",
  "/blog/notebooklm-vs-summify": "/compare/notebooklm",
  "/blog/how-to-read-research-papers-faster-with-ai": "/research-paper-study-tool",
  "/pdf-summarizer": "/summarize-pdf",
  "/youtube-video-summarizer": "/summarize-youtube-video",
  "/video-summarizer": "/summarize-youtube-video",
};

function isInternalHref(href: string) {
  if (!href || href.startsWith("/") || href.startsWith("#")) return true;

  try {
    const host = new URL(href).hostname.toLowerCase();
    return host === "summify.app" || host.endsWith(".summify.app") || host === "localhost";
  } catch {
    return true;
  }
}

function isDangerousHref(href: string) {
  return /^(?:javascript|vbscript|data):/i.test(href.trim());
}

/** Normalize apex/www absolute URLs and rewrite known broken internal paths. */
export function normalizeInternalBlogHref(href: string): string {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#") || isDangerousHref(trimmed)) return trimmed;

  let path = trimmed;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      const host = url.hostname.toLowerCase();
      if (host === "summify.app" || host === "www.summify.app" || host.endsWith(".summify.app")) {
        path = `${url.pathname}${url.search}${url.hash}` || "/";
      } else {
        return trimmed;
      }
    }
  } catch {
    return trimmed;
  }

  if (!path.startsWith("/")) return trimmed;

  const qIdx = path.search(/[?#]/);
  const pathname = qIdx >= 0 ? path.slice(0, qIdx) : path;
  const suffix = qIdx >= 0 ? path.slice(qIdx) : "";
  const key = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const rewritten = INTERNAL_HREF_REWRITES[key];
  if (rewritten) return `${rewritten}${suffix}`;
  return path;
}

export function detectCmsBlogBodyFormat(body: string): CmsBlogBodyFormat {
  return HTML_BODY_PATTERN.test(body) ? "html" : "markdown";
}

export function resolveCmsBlogBodyFormat(
  body: string,
  bodyFormat?: CmsBlogBodyFormat | null,
): CmsBlogBodyFormat {
  if (bodyFormat === "html" || detectCmsBlogBodyFormat(body) === "html") {
    return "html";
  }
  return "markdown";
}

export function sanitizeCmsBlogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "a",
      "strong",
      "b",
      "em",
      "i",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "hr",
      "br",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading", "decoding"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => {
        const href = attribs.href?.trim() ?? "";
        const safeAttributes: Record<string, string> = {};
        if (!href || isDangerousHref(href)) {
          return { tagName: "a", attribs: safeAttributes };
        }
        const normalized = normalizeInternalBlogHref(href);
        safeAttributes.href = normalized;
        if (isInternalHref(normalized)) {
          return { tagName: "a", attribs: safeAttributes };
        }
        safeAttributes.target = "_blank";
        safeAttributes.rel = "noopener noreferrer";
        return { tagName: "a", attribs: safeAttributes };
      },
      img: (_tagName, attribs) => {
        const safeAttributes: Record<string, string> = {};
        for (const name of ["src", "alt", "width", "height"] as const) {
          const value = attribs[name]?.trim();
          if (value) safeAttributes[name] = value;
        }
        safeAttributes.loading = attribs.loading?.trim() || "lazy";
        safeAttributes.decoding = "async";
        return { tagName: "img", attribs: safeAttributes };
      },
    },
  });
}

export function stripCmsBlogHtml(html: string): string {
  return sanitizeHtml(sanitizeCmsBlogHtml(html), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
