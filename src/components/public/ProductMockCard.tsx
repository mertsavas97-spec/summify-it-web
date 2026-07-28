/** Decorative workspace mock for marketing heroes — no live data. */
export function ProductMockCard({
  variant = "default",
}: {
  variant?: "default" | "learn" | "home";
}) {
  return (
    <div className="relative min-w-0" aria-hidden>
      <div className="pointer-events-none absolute -inset-4 -z-10 sm:-inset-8">
        <div className="absolute left-1/2 top-6 h-[160px] w-[min(100%,420px)] -translate-x-1/2 rounded-full bg-violet-500/20 blur-[70px] sm:top-10 sm:h-[260px] sm:w-[540px] sm:blur-[90px]" />
        <div className="absolute left-1/2 top-16 h-[120px] w-[min(100%,380px)] -translate-x-1/2 rounded-full bg-cyan-400/12 blur-[70px] sm:top-28 sm:h-[220px] sm:w-[520px] sm:blur-[90px]" />
      </div>

      <div
        className={
          variant === "home"
            ? "overflow-hidden rounded-2xl border border-white/[0.10] bg-zinc-950/60 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.95)] ring-1 ring-white/[0.06]"
            : "overflow-hidden rounded-2xl border border-white/[0.10] bg-zinc-900/80 shadow-[0_28px_80px_-34px_rgba(0,0,0,0.95)] ring-1 ring-white/[0.05]"
        }
      >
        <div className="flex items-center gap-2 border-b border-white/[0.07] bg-zinc-950/80 px-3 py-2.5 sm:px-4 sm:py-3">
          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400/70" />
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400/70" />
          <span className="ml-2 min-w-0 truncate text-[11px] text-zinc-400">
            Summify · Workspace
          </span>
          <span className="ml-auto hidden shrink-0 rounded-full border border-white/[0.08] bg-zinc-950/40 px-2 py-0.5 text-[10px] text-zinc-500 sm:inline">
            Public Beta
          </span>
        </div>

        {variant === "home" ? (
          <>
            {/* Mobile: compact single-column preview (no tall sidebar stack) */}
            <div className="relative overflow-hidden bg-zinc-950/35 md:hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.16),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.12),transparent_45%)]" />
              <div className="relative space-y-2.5 p-3">
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[
                    { label: "Summary", active: true },
                    { label: "Learn", active: true },
                    { label: "Quiz" },
                    { label: "Audio" },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className={
                        item.active
                          ? "shrink-0 rounded-full border border-violet-500/30 bg-violet-950/40 px-2.5 py-1 text-[10px] font-medium text-violet-100"
                          : "shrink-0 rounded-full border border-white/[0.08] bg-zinc-950/40 px-2.5 py-1 text-[10px] text-zinc-400"
                      }
                    >
                      {item.label}
                    </span>
                  ))}
                </div>

                <div className="min-w-0 rounded-xl border border-violet-500/30 bg-violet-950/20 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] font-semibold text-violet-100">Summary</p>
                    <span className="shrink-0 text-[9px] text-zinc-400">The Student</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 w-11/12 rounded bg-zinc-700/60" />
                    <div className="h-1.5 w-10/12 rounded bg-zinc-700/50" />
                    <div className="h-1.5 w-8/12 rounded bg-violet-500/45" />
                    <div className="h-1.5 w-9/12 rounded bg-zinc-700/40" />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {["Key ideas", "Insights", "Next"].map((tag, i) => (
                      <span
                        key={tag}
                        className={
                          i === 0
                            ? "whitespace-nowrap rounded-lg border border-violet-500/20 bg-violet-950/25 px-2 py-1 text-[9px] text-zinc-300"
                            : "whitespace-nowrap rounded-lg border border-white/[0.06] bg-zinc-950/40 px-2 py-1 text-[9px] text-zinc-500"
                        }
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-violet-500/18 bg-violet-950/15 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] font-semibold text-violet-100">Learn cards</p>
                    <span className="shrink-0 text-[9px] text-zinc-400">1 / 8</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {["Concept", "Why it matters", "Quiz"].map((label, i) => (
                      <div
                        key={label}
                        className={
                          i === 0
                            ? "min-w-0 rounded-lg border border-violet-500/25 bg-zinc-950/40 px-2.5 py-1.5"
                            : "min-w-0 rounded-lg border border-white/[0.06] bg-zinc-950/30 px-2.5 py-1.5"
                        }
                      >
                        <p className="truncate text-[10px] font-medium text-zinc-300">{label}</p>
                        <div className="mt-1 h-1 w-4/5 max-w-full rounded bg-white/10" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop / tablet: full workspace mock */}
            <div className="hidden min-w-0 grid-cols-[108px_minmax(0,1fr)] overflow-hidden md:grid">
              <div className="min-w-0 border-r border-white/[0.06] bg-zinc-950/50 p-2.5">
                <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Workspace
                </div>
                <div className="mt-2.5 space-y-1">
                  {[
                    { label: "Summary", active: true },
                    { label: "Learn", active: true },
                    { label: "Quiz" },
                    { label: "Audio" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={
                        item.active
                          ? "flex min-w-0 items-center justify-between gap-1 rounded-lg border border-violet-500/25 bg-violet-950/25 px-2 py-1.5"
                          : "flex min-w-0 items-center justify-between gap-1 rounded-lg border border-white/[0.06] bg-zinc-950/20 px-2 py-1.5"
                      }
                    >
                      <span
                        className={
                          item.active
                            ? "text-[10px] font-medium text-zinc-100"
                            : "text-[10px] text-zinc-300"
                        }
                      >
                        {item.label}
                      </span>
                      {item.active ? (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-violet-300 to-cyan-200" />
                      ) : (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/15" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 min-w-0 rounded-lg border border-white/[0.06] bg-zinc-950/30 p-2">
                  <p className="text-[9px] font-medium text-zinc-300">Lens</p>
                  <p className="mt-1 text-[10px] leading-snug text-zinc-400">The Student</p>
                  <span className="mt-1.5 inline-flex rounded-full border border-violet-500/20 bg-violet-950/30 px-1.5 py-0.5 text-[9px] text-violet-200">
                    Mode
                  </span>
                </div>
              </div>

              <div className="relative min-w-0 overflow-hidden bg-zinc-950/35">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.18),transparent_55%),radial-gradient(circle_at_70%_10%,rgba(34,211,238,0.14),transparent_45%)]" />
                <div className="relative grid min-w-0 gap-2.5 p-3">
                  <div className="grid min-w-0 gap-2.5 lg:grid-cols-2">
                    <div className="min-w-0 rounded-2xl border border-violet-500/30 bg-violet-950/20 p-3 shadow-[0_0_20px_-10px_rgba(124,58,237,0.45)]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold text-violet-100">Summary</p>
                        <span className="shrink-0 rounded-full border border-violet-400/25 bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-200">
                          Primary
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="h-2 w-11/12 max-w-full rounded bg-zinc-700/60" />
                        <div className="h-2 w-10/12 max-w-full rounded bg-zinc-700/50" />
                        <div className="h-2 w-9/12 max-w-full rounded bg-violet-500/45" />
                        <div className="h-2 w-11/12 max-w-full rounded bg-zinc-700/45" />
                        <div className="h-2 w-8/12 max-w-full rounded bg-zinc-700/40" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {["Key ideas", "Insights", "Next"].map((tag, i) => (
                          <span
                            key={tag}
                            className={
                              i === 0
                                ? "whitespace-nowrap rounded-lg border border-violet-500/20 bg-violet-950/20 px-2 py-1 text-[10px] font-medium text-zinc-300"
                                : "whitespace-nowrap rounded-lg border border-white/[0.06] bg-zinc-950/35 px-2 py-1 text-[10px] font-medium text-zinc-400"
                            }
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-violet-500/25 bg-violet-950/18 p-3 shadow-[0_0_20px_-12px_rgba(124,58,237,0.4)]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold text-violet-100">Learn cards</p>
                        <span className="shrink-0 text-[10px] text-violet-200/80">Auto</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {[
                          { label: "Concept", tone: "violet" },
                          { label: "Why it matters", tone: "cyan" },
                          { label: "Quiz", tone: "zinc" },
                        ].map((c) => (
                          <div
                            key={c.label}
                            className={
                              c.tone === "violet"
                                ? "rounded-xl border border-violet-500/25 bg-zinc-950/30 px-2.5 py-2"
                                : c.tone === "cyan"
                                  ? "rounded-xl border border-cyan-400/20 bg-zinc-950/25 px-2.5 py-2"
                                  : "rounded-xl border border-white/[0.06] bg-zinc-950/25 px-2.5 py-2"
                            }
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-[10px] font-medium leading-snug text-zinc-200">
                                {c.label}
                              </p>
                              <span className="shrink-0 text-[9px] text-zinc-500">1/8</span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full rounded bg-white/10" />
                            <div className="mt-1 h-1.5 w-4/5 max-w-full rounded bg-white/5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : variant === "learn" ? (
          <div className="space-y-3 p-5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-violet-300/80">
              Learn layer
            </p>
            {["Concept", "Why it matters", "Quiz", "Hook"].map((label) => (
              <div
                key={label}
                className="rounded-xl border border-violet-500/18 bg-violet-950/20 px-4 py-3"
              >
                <p className="text-[11px] font-medium text-violet-200/90">{label}</p>
                <div className="mt-2 h-1.5 w-full rounded bg-zinc-700/50" />
                <div className="mt-1.5 h-1.5 w-4/5 rounded bg-zinc-800/60" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
            <div className="p-5">
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
            <div className="bg-violet-950/25 p-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-violet-300/80">
                Structured intelligence
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">6 lenses</p>
              <div className="mt-3 space-y-2">
                <div className="h-2 w-full rounded bg-zinc-700/60" />
                <div className="h-2 w-11/12 rounded bg-zinc-700/45" />
                <div className="h-2 w-10/12 rounded bg-zinc-700/40" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
