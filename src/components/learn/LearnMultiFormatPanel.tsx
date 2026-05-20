"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { loadPracticeRetentionHint } from "@/lib/learn/practiceRetentionStorage";
import {
  LEARN_FORMAT_LABELS,
  type LearnFormatItem,
  type LearnFormatType,
  type MultiFormatLearnOutput,
} from "@/lib/learn/multiFormatTypes";
import { LearnMemoryAnchorPanel } from "@/components/learn/LearnMemoryAnchorPanel";
import { LearnSourceTracePanel } from "@/components/learn/LearnSourceTracePanel";

type LearnMultiFormatPanelProps = {
  analysisId: string;
  multiFormat: MultiFormatLearnOutput;
};

export function LearnMultiFormatPanel({ analysisId, multiFormat }: LearnMultiFormatPanelProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<LearnFormatType>(
    multiFormat.recommendedFormat === "flashcards"
      ? multiFormat.formats.find((f) => f.type !== "flashcards")?.type ?? "rapid_review"
      : multiFormat.recommendedFormat,
  );

  const retentionHint = useMemo(() => loadPracticeRetentionHint(analysisId), [analysisId]);

  const formats = useMemo(() => {
    return multiFormat.formats.filter((f) => f.type !== "flashcards" || f.items.length > 0);
  }, [multiFormat.formats]);

  const displayFormats = formats.filter((f) => f.type !== "flashcards");
  const activeFormat = displayFormats.find((f) => f.type === active) ?? displayFormats[0];

  if (displayFormats.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-zinc-950/55">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
            Learning formats
          </p>
          <p className="mt-1 text-sm text-zinc-300">Explore other ways to learn this analysis</p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
        )}
      </button>

      {open ? (
        <div className="border-t border-white/[0.06] px-4 pb-5 pt-4 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {displayFormats.map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => setActive(format.type)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  active === format.type
                    ? "border-violet-500/35 bg-violet-500/15 text-violet-200"
                    : "border-white/[0.08] bg-zinc-950/60 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {LEARN_FORMAT_LABELS[format.type]}
              </button>
            ))}
          </div>

          {activeFormat ? (
            <FormatView format={activeFormat} retentionWeak={retentionHint?.weakConcepts} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function FormatView({
  format,
  retentionWeak,
}: {
  format: LearnFormatItem;
  retentionWeak?: string[];
}) {
  const weakSet = new Set((retentionWeak ?? []).map((w) => w.toLowerCase()));

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-white">{format.title}</h3>
      {format.description ? <p className="mt-1 text-xs text-zinc-500">{format.description}</p> : null}
      <ul className="mt-4 space-y-3">
        {format.items.map((item) => {
          const isWeak =
            weakSet.size > 0 &&
            [...weakSet].some((w) => item.label.toLowerCase().includes(w.slice(0, 18)));
          return (
            <li
              key={item.id}
              className={`rounded-xl border bg-zinc-950/50 p-3 ${
                isWeak ? "border-amber-500/20" : "border-white/[0.06]"
              }`}
            >
              <p className="text-sm font-medium text-zinc-100">{item.label}</p>
              {item.detail ? (
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{item.detail}</p>
              ) : null}
              {item.memoryAnchor ? (
                <LearnMemoryAnchorPanel anchor={item.memoryAnchor} className="mt-2" label="Memory hook" />
              ) : null}
              <LearnSourceTracePanel trace={item.sourceTrace} className="mt-2" />
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-600">
        {format.type === "oral_quiz"
          ? "Read prompts aloud, then check answers in the detail."
          : format.type === "timeline"
            ? "Dates and periods appear only when present in the source."
            : "Use Start practice above for interactive flashcards."}
      </p>
    </div>
  );
}
