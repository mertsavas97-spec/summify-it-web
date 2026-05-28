"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";

type SendState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "ok" }
  | { status: "error"; message: string };

export function SendTestNotificationButton() {
  const [state, setState] = useState<SendState>({ status: "idle" });

  async function send() {
    if (state.status === "sending") return;
    setState({ status: "sending" });

    try {
      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });

      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; code?: string }
        | null;

      if (!res.ok || !json?.ok) {
        const message =
          json?.error ??
          `Request failed${typeof res.status === "number" ? ` (${res.status})` : ""}`;
        setState({ status: "error", message });
        return;
      }

      setState({ status: "ok" });
      window.setTimeout(() => setState({ status: "idle" }), 2500);
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  const label =
    state.status === "sending"
      ? "Sending…"
      : state.status === "ok"
        ? "Sent"
        : "Send test notification";

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={send} size="sm" variant="secondary" disabled={state.status === "sending"}>
        {label}
      </Button>
      {state.status === "error" ? (
        <p className="max-w-[18rem] text-right text-[11px] text-red-300">{state.message}</p>
      ) : null}
    </div>
  );
}
