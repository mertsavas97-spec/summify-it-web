/** Decorative workspace mock for marketing heroes — no live data. */
export function ProductMockCard({ variant = "default" }: { variant?: "default" | "learn" }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900/80 shadow-2xl shadow-black/40 ring-1 ring-white/[0.04] lg:min-h-[220px]"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-zinc-950/80 px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-zinc-600" />
        <span className="h-2 w-2 rounded-full bg-zinc-600" />
        <span className="h-2 w-2 rounded-full bg-zinc-600" />
        <span className="ml-2 text-[11px] text-zinc-400">Summify.it workspace</span>
      </div>
      {variant === "learn" ? (
        <div className="space-y-2.5 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-violet-300/80">
            Learn layer
          </p>
          {["Concept", "Why it matters", "Quiz", "Hook"].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-violet-500/15 bg-violet-950/20 px-3 py-2.5"
            >
              <p className="text-[11px] font-medium text-violet-200/90">{label}</p>
              <div className="mt-2 h-1.5 w-full rounded bg-zinc-700/50" />
              <div className="mt-1.5 h-1.5 w-4/5 rounded bg-zinc-800/60" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
          <div className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Source
            </p>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full rounded bg-zinc-700/80" />
              <div className="h-2 w-4/5 rounded bg-zinc-800/80" />
              <div className="h-2 w-full rounded bg-violet-500/35" />
            </div>
            <p className="mt-4 text-[11px] font-medium text-emerald-400/80">Learn cards</p>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded bg-violet-500/20" />
              <div className="h-1.5 w-3/4 rounded bg-violet-500/15" />
            </div>
          </div>
          <div className="bg-violet-950/25 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-violet-300/80">
              Structured intelligence
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">29 modes</p>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full rounded bg-zinc-700/60" />
              <div className="h-2 w-11/12 rounded bg-zinc-700/45" />
              <div className="h-2 w-10/12 rounded bg-zinc-700/40" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
