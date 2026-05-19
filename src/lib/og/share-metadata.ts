import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { buildOgSocialCopy } from "@/lib/og/templates";

export function buildSharePageMetadata(input: {
  title: string;
  preview: string;
  shareId: string;
}): Metadata {
  const path = `/share/${input.shareId}`;
  const { socialDescription } = buildOgSocialCopy({
    title: input.title,
    description: input.preview,
    context: "share",
  });

  return buildPageMetadata({
    title: input.title,
    description: socialDescription,
    path,
    noindex: true,
    ogType: "article",
  });
}
