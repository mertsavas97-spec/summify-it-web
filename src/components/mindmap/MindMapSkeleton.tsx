export function MindMapSkeleton() {
  return (
    <div
      className="flex h-[min(72vh,640px)] min-h-[360px] flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-950/60"
      aria-hidden
    >
      <div className="h-8 w-8 animate-pulse rounded-full bg-violet-500/20" />
      <p className="mt-4 text-sm text-zinc-500">Building visual intelligence…</p>
      <p className="mt-1 text-[11px] text-zinc-600">Mapping concepts and relationships</p>
    </div>
  );
}
