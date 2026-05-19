type ComparisonRow = {
  feature: string;
  summify: string | boolean;
  competitor: string | boolean;
};

type ComparisonTableProps = {
  competitorName: string;
  rows: ComparisonRow[];
};

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return (
      <span className={value ? "text-emerald-400/90" : "text-zinc-600"}>
        {value ? "Yes" : "—"}
      </span>
    );
  }
  return <span className="text-zinc-400">{value}</span>;
}

export function ComparisonTable({ competitorName, rows }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-zinc-950/80">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Feature
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-violet-300/80">
              Summify
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {competitorName}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-white/[0.04] last:border-0">
              <td className="px-4 py-3 font-medium text-zinc-300">{row.feature}</td>
              <td className="px-4 py-3">
                <Cell value={row.summify} />
              </td>
              <td className="px-4 py-3">
                <Cell value={row.competitor} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
