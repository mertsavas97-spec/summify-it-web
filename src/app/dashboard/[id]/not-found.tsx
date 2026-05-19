import Link from "next/link";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { Button } from "@/components/ui/Button";

export default function SavedAnalysisNotFound() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-400/80">
        Workspace
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
        Analysis not found
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        This session may have been deleted, or you do not have access to it. Saved analyses are
        private to your account.
      </p>
      <Button href="/dashboard" size="md" className="mt-6" variant="secondary">
        Back to dashboard
      </Button>
      <div className="mt-12">
        <DashboardEmptyState
          title="Start a new intelligence session"
          description="Upload a document or paste a link in the workspace — signed-in analyses save automatically."
          primaryAction={{ href: "/upload", label: "Open workspace" }}
        />
      </div>
      <p className="mt-8 text-center text-xs text-zinc-600">
        <Link href="/dashboard" className="text-violet-400/80 hover:text-violet-300">
          ← All saved analyses
        </Link>
      </p>
    </article>
  );
}
