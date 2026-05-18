import { supportedFormatLabels } from "@/data/fileTypes";

export function FormatBadges() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] text-zinc-600">Supported:</span>
      {supportedFormatLabels.map((format) => (
        <span
          key={format}
          className="rounded border border-white/[0.06] bg-zinc-950/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-500"
        >
          {format}
        </span>
      ))}
    </div>
  );
}
