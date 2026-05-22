type BlogFeatureHighlightProps = {
  title: string;
  description: string;
  features: string[];
};

export function BlogFeatureHighlight({
  title,
  description,
  features,
}: BlogFeatureHighlightProps) {
  return (
    <aside className="my-8 rounded-xl border border-violet-500/15 bg-violet-950/15 p-5 not-prose">
      <h3 className="text-sm font-semibold text-violet-200">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
      <ul className="mt-3 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex gap-2 text-sm text-zinc-400">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400/80" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
    </aside>
  );
}
