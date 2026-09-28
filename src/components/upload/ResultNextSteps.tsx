import Link from "next/link";
import { ArrowRight, Check, FilePlus2, Save, UserPlus } from "lucide-react";

type ResultNextStepsProps = {
  isAuthenticated?: boolean;
  savedToWorkspace?: boolean;
  savedAnalysisId?: string | null;
};

/**
 * Post-summary next-step strip shown under the result footer (next to the
 * save banner and the audio/podcast CTAs). Makes the three follow-up steps
 * explicit: save the analysis, create an account, summarize another document.
 *
 * Reuses the existing routes (/login with returnTo handoff, /upload) — no new
 * summary pipeline is introduced here.
 */
export function ResultNextSteps({
  isAuthenticated = false,
  savedToWorkspace = false,
  savedAnalysisId = null,
}: ResultNextStepsProps) {
  const steps: Array<{
    key: string;
    icon: typeof Save;
    label: string;
    detail: string;
    href?: string;
    done?: boolean;
  }> = [
    {
      key: "save",
      icon: Save,
      label: savedToWorkspace ? "Saved to dashboard" : "Save this analysis",
      detail: savedToWorkspace
        ? "Reopen it any time from your workspace."
        : "Keep it after you close the tab.",
      href: savedToWorkspace
        ? savedAnalysisId
          ? `/dashboard/${savedAnalysisId}`
          : "/dashboard"
        : undefined,
      done: savedToWorkspace,
    },
    {
      key: "account",
      icon: UserPlus,
      label: isAuthenticated ? "Account active" : "Create a free account",
      detail: isAuthenticated
        ? "Your summaries sync across devices."
        : "No card required — daily free analyses.",
      href: isAuthenticated ? "/dashboard" : "/login?returnTo=%2Fdashboard",
      done: isAuthenticated,
    },
    {
      key: "again",
      icon: FilePlus2,
      label: "Summarize another document",
      detail: "Drop in a PDF, deck, article, or video link.",
      href: "/upload",
    },
  ];

  return (
    <nav
      aria-label="Next steps after this summary"
      data-result-next-steps
      className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3"
    >
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Next steps
      </p>
      <ol className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const body = (
            <>
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/10 text-[10px] text-zinc-500">
                  {step.done ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : index + 1}
                </span>
                <Icon className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
                {step.label}
              </span>
              <span className="ml-5 block text-[11px] text-zinc-600 sm:ml-0">{step.detail}</span>
            </>
          );

          if (step.href) {
            return (
              <li key={step.key}>
                <Link
                  href={step.href}
                  className="group inline-flex flex-col rounded-lg px-1 py-0.5 transition-colors hover:bg-white/[0.03]"
                >
                  {body}
                  <ArrowRight
                    className="mt-0.5 h-3 w-3 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-300"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          }

          return (
            <li key={step.key} className="inline-flex flex-col px-1 py-0.5">
              {body}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
