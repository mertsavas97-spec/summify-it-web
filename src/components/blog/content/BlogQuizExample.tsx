type BlogQuizExampleProps = {
  question: string;
  options: Array<{ key: string; text: string }>;
  correctKey: string;
  explanation: string;
};

/** Illustrative post-learn quiz question for editorial articles. */
export function BlogQuizExample({
  question,
  options,
  correctKey,
  explanation,
}: BlogQuizExampleProps) {
  return (
    <aside
      className="my-8 rounded-xl border border-violet-500/15 bg-zinc-950/70 p-5 not-prose"
      data-blog-example="quiz"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-300/80">
        Quiz example
      </p>
      <p className="mt-3 text-sm font-medium text-zinc-100">{question}</p>
      <ul className="mt-3 space-y-2">
        {options.map((opt) => (
          <li
            key={opt.key}
            className={`rounded-lg border px-3 py-2 text-sm ${
              opt.key === correctKey
                ? "border-emerald-500/25 bg-emerald-950/20 text-emerald-200/90"
                : "border-white/[0.06] text-zinc-500"
            }`}
          >
            <span className="mr-2 font-semibold text-violet-300/80">{opt.key}.</span>
            {opt.text}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-zinc-500">
        <span className="font-medium text-zinc-400">Explanation: </span>
        {explanation}
      </p>
    </aside>
  );
}
