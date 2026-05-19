type DashboardStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function DashboardStatCard({ label, value, hint }: DashboardStatCardProps) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 px-4 py-3.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-zinc-600">{hint}</p> : null}
    </div>
  );
}
