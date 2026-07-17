"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { buildPublicShareUrl } from "@/lib/share-url";
import { siteConfig } from "@/lib/site";

type ShareSocialActionsProps = {
  shareId: string;
  title: string;
};

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ShareSocialActions({ shareId, title }: ShareSocialActionsProps) {
  const [copied, setCopied] = useState(false);
  const url = buildPublicShareUrl(shareId);
  const text = encodeURIComponent(`Shared analysis on ${siteConfig.name}: ${title}`);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      window.prompt("Copy link:", url);
    }
  }

  const buttonClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-950/60 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-violet-500/25 hover:text-violet-200";
  const shareMessage = encodeURIComponent(`Check out this analysis on ${siteConfig.name}: ${title}\n${url}`);

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, text: `Shared analysis on ${siteConfig.name}`, url });
    } catch {
      // User dismissed share sheet.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Share this analysis">
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
      >
        <XIcon className="h-3.5 w-3.5" />
        Post
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
      >
        <LinkedInIcon className="h-3.5 w-3.5" />
        LinkedIn
      </a>
      <a
        href={`https://wa.me/?text=${shareMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
      >
        WhatsApp
      </a>
      <button type="button" onClick={copyLink} className={buttonClass}>
        <Link2 className="h-3.5 w-3.5" />
        {copied ? "Copied" : "Copy link"}
      </button>
      {typeof navigator !== "undefined" && "share" in navigator ? (
        <button type="button" onClick={() => void nativeShare()} className={buttonClass}>
          Share
        </button>
      ) : null}
    </div>
  );
}
