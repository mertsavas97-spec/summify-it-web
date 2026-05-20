import { SUPPORTED_UPLOAD_FORMAT_LABELS } from "@/lib/plans/uploadCopy";

type FormatBadgesProps = {
  formats?: readonly string[];
};

export function FormatBadges({
  formats = SUPPORTED_UPLOAD_FORMAT_LABELS,
}: FormatBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] text-zinc-600">Supported:</span>
      {formats.map((format) => (
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
