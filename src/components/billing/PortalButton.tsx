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
      throw new Error("Subscription management will be enabled after the billing provider is approved.");
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
