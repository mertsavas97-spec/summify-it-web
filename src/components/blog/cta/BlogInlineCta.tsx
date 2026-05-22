import Link from "next/link";

type BlogInlineCtaProps = {
  headline?: string;
  body?: string;
  href?: string;
  label?: string;
};

export function BlogInlineCta({
  headline = "Turn PDFs into Learn cards and quizzes with Summify.",
  body = "Upload a PDF, pick an intelligence mode, and complete the learning path — summary, Learn cards, then quiz.",
  href = "/upload",
  label = "Try Summify free",
}: BlogInlineCtaProps) {
  return (
    <aside className="my-8 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-950/35 to-zinc-950/80 px-5 py-4 not-prose">
      <p className="text-sm font-medium text-violet-100/95">{headline}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{body}</p>
      <Link
        href={href}
        className="mt-3 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
      >
        {label} →
      </Link>
    </aside>
  );
}
