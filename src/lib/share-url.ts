import { isLocalDevOrigin } from "@/lib/app-origin";
import { siteConfig } from "@/lib/site";

function resolveShareBaseUrl(): string {
  if (typeof window !== "undefined" && isLocalDevOrigin(window.location.origin)) {
    return window.location.origin.replace(/\/$/, "");
  }
  return siteConfig.url.replace(/\/$/, "");
}

/** Absolute public URL for a shared analysis. */
export function buildPublicShareUrl(shareId: string): string {
  return `${resolveShareBaseUrl()}/share/${shareId}`;
}
