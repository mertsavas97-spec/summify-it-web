import { Button } from "@/components/ui/Button";

type BlogEndCtaProps = {
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function BlogEndCta({
  title = "Turn PDFs into Learn cards and quizzes with Summify.",
  description =
    "Upload PDFs, YouTube links, or decks. Get structured analysis, source-backed Learn cards, and a post-learn quiz — free during public beta.",
  primaryHref = "/upload",
  primaryLabel = "Open workspace",
  secondaryHref = "/pricing",
  secondaryLabel = "View plans",
}: BlogEndCtaProps) {
  return (
    <section
      className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-950/30 via-zinc-950/90 to-zinc-950/95 px-6 py-8 sm:px-8"
      data-blog-cta="end"
    >
      <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">{description}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button href={primaryHref} size="sm">
          {primaryLabel}
        </Button>
        {secondaryHref ? (
          <Button href={secondaryHref} variant="secondary" size="sm">
            {secondaryLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
