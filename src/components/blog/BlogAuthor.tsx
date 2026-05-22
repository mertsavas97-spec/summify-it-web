import Link from "next/link";

export type BlogAuthorInfo = {
  name: string;
  role: string;
  bio: string;
  href?: string;
};

const DEFAULT_AUTHOR: BlogAuthorInfo = {
  name: "Summify Editorial",
  role: "Product & learning workflows",
  bio: "Practical guides on AI document intelligence, Learn cards, and study workflows — written for students and knowledge workers using Summify.",
  href: "/about",
};

type BlogAuthorProps = {
  author?: BlogAuthorInfo;
};

export function BlogAuthor({ author = DEFAULT_AUTHOR }: BlogAuthorProps) {
  return (
    <section
      className="mt-8 flex gap-4 rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4 sm:p-5"
      aria-label="Author"
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-500/25 bg-violet-950/40 text-sm font-semibold text-violet-200"
        aria-hidden
      >
        S
      </div>
      <div className="min-w-0">
        {author.href ? (
          <Link
            href={author.href}
            className="text-sm font-semibold text-zinc-100 hover:text-violet-200"
          >
            {author.name}
          </Link>
        ) : (
          <p className="text-sm font-semibold text-zinc-100">{author.name}</p>
        )}
        <p className="text-[11px] text-violet-300/70">{author.role}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{author.bio}</p>
      </div>
    </section>
  );
}
