import { siteConfig } from "@/lib/site";

/** Absolute public URL for a shared analysis. */
export function buildPublicShareUrl(shareId: string): string {
  return `${siteConfig.url}/share/${shareId}`;
}
