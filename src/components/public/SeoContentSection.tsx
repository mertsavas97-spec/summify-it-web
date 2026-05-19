type ContentBlock = {
  heading?: string;
  body: React.ReactNode;
};

type SeoContentSectionProps = {
  eyebrow?: string;
  title: string;
  blocks: ContentBlock[];
};

/** Semantic depth section with H2/H3 and prose for landing-page SEO. */
export function SeoContentSection({ eyebrow, title, blocks }: SeoContentSectionProps) {
  return (
    <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-400/80">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <div className="mt-6 space-y-6">
          {blocks.map((block, index) => (
            <div key={index}>
              {block.heading && (
                <h3 className="text-base font-medium text-zinc-200">{block.heading}</h3>
              )}
              <div
                className={`text-sm leading-relaxed text-zinc-400 ${block.heading ? "mt-2" : ""}`}
              >
                {block.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
