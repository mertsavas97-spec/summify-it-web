"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { claimGhostSession, readGhostSession } from "@/lib/ghost-session";

type ClaimGhostSessionOnAuthProps = {
  enabled?: boolean;
};

export function ClaimGhostSessionOnAuth({ enabled = true }: ClaimGhostSessionOnAuthProps) {
  const hasAttemptedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[ghost-claim] claim component mounted", { enabled });
    }

    if (!enabled) return;
    if (hasAttemptedRef.current) return;

    const ghost = readGhostSession();
    if (process.env.NODE_ENV !== "production") {
      console.log("[ghost-claim] ghost exists", { exists: Boolean(ghost) });
    }
    if (!ghost) return;

    hasAttemptedRef.current = true;

    if (process.env.NODE_ENV !== "production") {
      console.log("[ghost-claim] claim started");
    }

    void claimGhostSession().then((savedAnalysisId) => {
      if (savedAnalysisId) {
        if (process.env.NODE_ENV !== "production") {
          console.log("[ghost-claim] claim succeeded", { savedAnalysisId });
        }
        router.refresh();
        return;
      }

      hasAttemptedRef.current = false;

      if (process.env.NODE_ENV !== "production") {
        console.log("[ghost-claim] claim failed");
      }
    });
  }, [enabled, router]);

  return null;
}
