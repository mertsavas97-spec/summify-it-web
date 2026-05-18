import { templateUsage } from "@/data/dashboard";
import { Card } from "@/components/ui/Card";

export function TemplateUsage() {
  return (
    <Card compact>
      <h2 className="text-sm font-semibold text-white">Template usage</h2>
      <p className="text-[10px] text-zinc-600">Last 30 days · sample</p>
      <ul className="mt-3 space-y-3">
        {templateUsage.map((item) => (
          <li key={item.template}>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="truncate text-zinc-400">{item.template}</span>
              <span className="shrink-0 tabular-nums text-zinc-600">
                {item.count}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
