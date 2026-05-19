import { siteConfig } from "@/lib/site";
import { absoluteUrl, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, SEO_BRAND } from "@/lib/seo";
import type { OgGradient, OgImageSpec, OgMetadataMappingInput, OgTypography } from "./types";

/** Brand gradients for future dynamic OG image generation. */
export const OG_GRADIENTS: Record<string, OgGradient> = {
  brand: {
    id: "brand",
    from: "#1a1033",
    to: "#0a0b0f",
    angle: 135,
  },
  guide: {
    id: "guide",
    from: "#1e1040",
    to: "#0d0e14",
    angle: 145,
  },
  compare: {
    id: "compare",
    from: "#12182a",
    to: "#0a0b0f",
    angle: 120,
  },
  share: {
    id: "share",
    from: "#18122a",
    to: "#0a0b0f",
    angle: 140,
  },
  mode: {
    id: "mode",
    from: "#1a1530",
    to: "#0a0b0f",
    angle: 130,
  },
};

export const OG_TYPOGRAPHY: OgTypography = {
  titleSize: 56,
  subtitleSize: 28,
  labelSize: 18,
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
};

/** Card layout tokens for future OG templates (padding, radii). */
export const OG_CARD_LAYOUT = {
  padding: 64,
  borderRadius: 24,
  maxTitleLines: 3,
  maxSubtitleLines: 2,
} as const;

export function getDefaultOgImageUrl(): string {
  return absoluteUrl(siteConfig.ogImage);
}

export function getOgImageDimensions() {
  return { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT };
}

/** Map a page to an OgImageSpec for static or dynamic generation pipelines. */
export function mapToOgImageSpec(input: OgMetadataMappingInput): OgImageSpec {
  const preset = input.preset ?? "default";
  const gradientId = preset === "default" ? "brand" : preset;
  return {
    preset,
    title: input.title,
    subtitle: input.description.slice(0, 120),
    badge: input.badge,
    path: input.path,
    gradientId,
  };
}

/** Social title/description tuning without generating images yet. */
export function buildOgSocialCopy(input: {
  title: string;
  description: string;
  context?: "share" | "guide" | "compare" | "mode";
}): { socialTitle: string; socialDescription: string } {
  const baseTitle = input.title.includes(SEO_BRAND)
    ? input.title
    : `${input.title} | ${SEO_BRAND}`;

  switch (input.context) {
    case "share":
      return {
        socialTitle: `Shared on ${SEO_BRAND}: ${input.title}`,
        socialDescription: `${input.description.slice(0, 120)}${input.description.length > 120 ? "…" : ""} Create your own summaries and review cards.`,
      };
    case "guide":
      return {
        socialTitle: baseTitle,
        socialDescription: `${input.description} — Free guide from ${SEO_BRAND}.`,
      };
    case "compare":
      return {
        socialTitle: baseTitle,
        socialDescription: `${input.description} See how ${SEO_BRAND} compares.`,
      };
    case "mode":
      return {
        socialTitle: baseTitle,
        socialDescription: `${input.description} Try this intelligence mode in ${SEO_BRAND}.`,
      };
    default:
      return {
        socialTitle: baseTitle,
        socialDescription: input.description,
      };
  }
}
