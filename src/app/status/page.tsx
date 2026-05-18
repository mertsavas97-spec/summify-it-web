import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";
import { getServiceStatus } from "@/lib/service-status";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = createPageMetadata({
  title: "Status",
  description: "Summify.it public beta service status.",
  path: "/status",
  noIndex: true,
});

export const dynamic = "force-dynamic";

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.06] bg-zinc-950/50 px-4 py-3">
      <span className="text-sm text-zinc-300">{label}</span>
      <span
        className={`text-xs font-medium ${ok ? "text-emerald-400" : "text-amber-400"}`}
      >
        {ok ? "Configured" : "Not configured"}
      </span>
    </li>
  );
}

export default function StatusPage() {
  const data = getServiceStatus();

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-400/80">
        Public beta
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-white">Service status</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Lightweight health check for the analysis workspace. No secrets or usage metrics
        are exposed.
      </p>

      <div className="mt-8 rounded-xl border border-white/[0.08] bg-zinc-900/40 p-5">
        <p className="text-xs text-zinc-500">Overall</p>
        <p
          className={`mt-1 text-lg font-semibold capitalize ${
            data.status === "operational" ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {data.status}
        </p>
        <p className="mt-2 text-[11px] text-zinc-600">
          Summify.it is in public beta — accounts and billing are not live.
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        <StatusRow label="Document analysis (Groq / Gemini)" ok={data.services.analysis} />
        <StatusRow label="YouTube transcripts (RapidAPI)" ok={data.services.youtube} />
      </ul>

      <p className="mt-4 text-[11px] text-zinc-600">
        Machine-readable:{" "}
        <Link href="/api/status" className="text-violet-400 hover:text-violet-300">
          /api/status
        </Link>
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/upload" size="sm">
          Open workspace
        </Button>
        <Button href="/" variant="secondary" size="sm">
          Home
        </Button>
      </div>
    </div>
  );
}
