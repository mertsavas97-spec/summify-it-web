"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";

type SendState =
  | { status: "idle" }
  | { status: "sending" }
  | {
      status: "done";
      ok: boolean;
      results: Array<{
        provider: string;
        configured: boolean;
        ok: boolean;
        errorCode: string | null;
      }>;
    }
  | { status: "error"; message: string };

function formatProviderLabel(id: string): string {
  if (id === "slack") return "Slack";
  if (id === "pushover") return "Pushover";
  return id;
}

function formatProviderStatus(r: {
  configured: boolean;
  ok: boolean;
}): { text: string; tone: "good" | "warn" | "bad" } {
  if (!r.configured) return { text: "Missing config", tone: "warn" };
  if (r.ok) return { text: "Sent", tone: "good" };
  return { text: "Failed", tone: "bad" };
}

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
        | {
            ok?: boolean;
            error?: string;
            results?: Array<{
              provider: string;
              configured: boolean;
              ok: boolean;
              errorCode: string | null;
            }>;
          }
        | null;

      if (!json) {
        setState({
          status: "error",
          message: `Request failed${typeof res.status === "number" ? ` (${res.status})` : ""}`,
        });
        return;
      }

      const results = Array.isArray(json.results) ? json.results : [];

      // Even if the endpoint returns 500 (all providers failed), we still want
      // to show provider-level outcomes instead of a generic error.
      if (results.length > 0) {
        setState({ status: "done", ok: Boolean(json.ok), results });
        return;
      }

      if (!res.ok || !json.ok) {
        setState({
          status: "error",
          message:
            json.error ??
            `Request failed${typeof res.status === "number" ? ` (${res.status})` : ""}`,
        });
        return;
      }

      setState({ status: "done", ok: true, results: [] });
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
      : "Send notification test";

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={send} size="sm" variant="secondary" disabled={state.status === "sending"}>
        {label}
      </Button>
      {state.status === "done" && state.results.length ? (
        <div className="flex flex-col items-end gap-0.5">
          {state.results.map((r) => {
            const s = formatProviderStatus(r);
            const toneClass =
              s.tone === "good"
                ? "text-emerald-300"
                : s.tone === "warn"
                  ? "text-amber-300"
                  : "text-red-300";
            return (
              <p key={r.provider} className={`text-right text-[11px] ${toneClass}`}>
                {formatProviderLabel(r.provider)}: {s.text}
              </p>
            );
          })}
        </div>
      ) : null}
      {state.status === "error" ? (
        <p className="max-w-[18rem] text-right text-[11px] text-red-300">{state.message}</p>
      ) : null}
    </div>
  );
}
