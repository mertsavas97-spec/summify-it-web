import type { LearnCardMemoryAnchor } from "@/types/adaptive-learn";

type LearnMemoryAnchorPanelProps = {
  anchor?: LearnCardMemoryAnchor;
  className?: string;
  /** User-facing label variant */
  label?: "Memory hook" | "Remember it as";
};

export function LearnMemoryAnchorPanel({
  anchor,
  className = "",
  label = "Remember it as",
}: LearnMemoryAnchorPanelProps) {
  if (!anchor?.text?.trim()) return null;

  return (
    <div
      className={`rounded-lg border border-amber-500/12 bg-amber-950/20 px-3 py-2.5 ${className}`}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-amber-200/70">
        {label}
      </p>
      <p className="mt-1 text-sm leading-snug text-amber-100/90">{anchor.text}</p>
    </div>
  );
}
