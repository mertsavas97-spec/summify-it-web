import Link from "next/link";

type BlogComparisonHighlightProps = {
  title: string;
  summary: string;
  href: string;
  bullets?: string[];
};

export function BlogComparisonHighlight({
  title,
  summary,
  href,
  bullets = [],
}: BlogComparisonHighlightProps) {
  return (
    <aside className="my-8 rounded-xl border border-amber-500/12 bg-amber-950/10 p-5 not-prose">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300/80">
        Comparison
      </p>
      <h3 className="mt-2 text-base font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{summary}</p>
      {bullets.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-500">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      <Link
        href={href}
        className="mt-4 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
      >
        Read comparison →
      </Link>
    </aside>
  );
}
