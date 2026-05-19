"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function PortalButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const payload = (await response.json()) as {
        success?: boolean;
        url?: string | null;
        error?: string;
      };
      if (!response.ok || !payload.success || !payload.url) {
        throw new Error(payload.error ?? "Billing portal could not be opened.");
      }
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Billing portal could not be opened.");
      setPending(false);
    }
  }

  return (
    <div>
      <Button type="button" size="sm" variant="secondary" onClick={openPortal} disabled={pending}>
        {pending ? "Opening..." : "Manage subscription"}
      </Button>
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
