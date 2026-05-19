import type { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/lib/seo";

/** Dimensions for generated or static OG images. */
export type OgImageDimensions = {
  width: typeof OG_IMAGE_WIDTH;
  height: typeof OG_IMAGE_HEIGHT;
};

export type OgLayoutPreset = "default" | "guide" | "compare" | "share" | "mode";

export type OgTypography = {
  titleSize: number;
  subtitleSize: number;
  labelSize: number;
  fontFamily: string;
};

export type OgGradientStop = {
  color: string;
  position: number;
};

export type OgGradient = {
  id: string;
  from: string;
  to: string;
  angle?: number;
};

/** Serializable spec for future @vercel/og or static generation — no runtime render yet. */
export type OgImageSpec = {
  preset: OgLayoutPreset;
  title: string;
  subtitle?: string;
  badge?: string;
  path: string;
  gradientId?: string;
};

export type OgMetadataMappingInput = {
  title: string;
  description: string;
  path: string;
  preset?: OgLayoutPreset;
  badge?: string;
};
