"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type PortalButtonProps = {
  disabled?: boolean;
  className?: string;
};

export function PortalButton({ disabled = false, className }: PortalButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        url?: string;
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
    <div className={className}>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => void openPortal()}
        disabled={disabled || pending}
      >
        {pending ? "Opening..." : "Manage billing"}
      </Button>
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
