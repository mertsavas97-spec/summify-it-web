"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { buildPublicShareUrl } from "@/lib/share-url";
import { siteConfig } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { ShareSocialActions } from "@/components/share/ShareSocialActions";

type ShareControlsProps = {
  analysisId: string;
  initialIsPublic: boolean;
  initialShareId: string | null;
  title?: string;
};

type ShareState = {
  isPublic: boolean;
  shareId: string | null;
};

export function ShareControls({
  analysisId,
  initialIsPublic,
  initialShareId,
  title = "Summify analysis",
}: ShareControlsProps) {
  const [share, setShare] = useState<ShareState>({
    isPublic: initialIsPublic,
    shareId: initialShareId,
  });
  const [loading, setLoading] = useState<"enable" | "disable" | "copy" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shareUrl = share.shareId ? buildPublicShareUrl(share.shareId) : null;

  async function patchShare(enabled: boolean) {
    setLoading(enabled ? "enable" : "disable");
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/analyses/${analysisId}/share`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ enabled }),
    });

    const data = (await res.json()) as {
      success: boolean;
      isPublic?: boolean;
      shareId?: string | null;
      error?: string;
    };

    setLoading(null);

    if (!res.ok || !data.success) {
      setError(data.error ?? "Could not update sharing. Try again.");
      return;
    }

    setShare({
      isPublic: data.isPublic ?? false,
      shareId: data.shareId ?? null,
    });

    if (enabled && data.shareId) {
      trackEvent("share_enabled", { analysis_id: analysisId });
      const url = buildPublicShareUrl(data.shareId);
      try {
        await navigator.clipboard.writeText(url);
        setMessage("Public link is live and copied to your clipboard.");
      } catch {
        setMessage("Public analysis link is live. Anyone with the link can view this insight.");
      }
      return;
    }

    if (enabled) {
      trackEvent("share_enabled", { analysis_id: analysisId });
    }

    setMessage(
      enabled
        ? "Public analysis link is live. Anyone with the link can view this insight."
        : "Public sharing disabled. The link no longer works.",
    );
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    setLoading("copy");
    setError(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Public analysis link copied.");
    } catch {
      setError("Could not copy link. Select and copy manually.");
    }
    setLoading(null);
  }

  return (
    <section
      className="rounded-xl border border-white/[0.08] bg-zinc-950/50 p-4"
      data-share-controls
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Share workspace
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {share.isPublic
              ? "This analysis is publicly viewable via link. Raw uploads are never shared."
              : "Sharing is off by default. Enable a read-only public page when you're ready."}
          </p>
        </div>
        {share.isPublic ? (
          <span className="rounded-md border border-emerald-500/20 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300/90">
            Public
          </span>
        ) : (
          <span className="rounded-md border border-white/[0.06] bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
            Private
          </span>
        )}
      </div>

      {shareUrl && share.isPublic ? (
        <p className="mt-3 truncate rounded-lg border border-white/[0.06] bg-zinc-950/80 px-3 py-2 font-mono text-[11px] text-violet-300/90">
          {shareUrl}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!share.isPublic ? (
          <Button
            type="button"
            size="sm"
            disabled={loading !== null}
            onClick={() => void patchShare(true)}
          >
            {loading === "enable" ? "Enabling…" : "Enable public share"}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={loading !== null || !shareUrl}
              onClick={() => void handleCopyLink()}
            >
              {loading === "copy" ? "Copied…" : "Copy share link"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={loading !== null}
              onClick={() => void patchShare(false)}
            >
              {loading === "disable" ? "Disabling…" : "Disable share"}
            </Button>
          </>
        )}
      </div>

      {share.isPublic && share.shareId ? (
        <div className="mt-4">
          <ShareSocialActions shareId={share.shareId} title={title} />
        </div>
      ) : null}

      {message ? <p className="mt-3 text-xs text-emerald-400/90">{message}</p> : null}
      {error ? <p className="mt-3 text-xs text-red-400/90">{error}</p> : null}
      <p className="mt-3 text-[11px] text-zinc-600">
        Share links include summary and Learn content only. Raw uploads stay private.
      </p>
    </section>
  );
}
