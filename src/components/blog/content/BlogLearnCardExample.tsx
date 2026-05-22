type BlogLearnCardExampleProps = {
  title: string;
  type?: string;
  content: string;
  hint?: string;
};

/** Illustrative Learn card block for editorial articles (not live data). */
export function BlogLearnCardExample({
  title,
  type = "concept",
  content,
  hint = "Source-backed Learn card example",
}: BlogLearnCardExampleProps) {
  return (
    <aside
      className="my-8 rounded-xl border border-emerald-500/15 bg-emerald-950/10 p-5 not-prose"
      data-blog-example="learn-card"
    >
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
        <span className="rounded border border-emerald-500/25 bg-emerald-950/30 px-1.5 py-px uppercase tracking-wider text-emerald-300/90">
          Learn card · {type}
        </span>
        <span>{hint}</span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{content}</p>
    </aside>
  );
}
