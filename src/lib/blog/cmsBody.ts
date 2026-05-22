import sanitizeHtml from "sanitize-html";

export type CmsBlogBodyFormat = "markdown" | "html";

const HTML_BODY_PATTERN =
  /<(?:h[1-4]|p|ul|ol|li|a|strong|em|b|i|hr|blockquote|code|pre|br|img)(?:\s|>|\/)/i;

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
      img: ["src", "alt", "width", "height", "loading"],
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
        safeAttributes.href = href;
        if (isInternalHref(href)) {
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
