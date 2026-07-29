type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Use h1 for page heroes (SEO); default h2 for mid-page sections. */
  as?: "h1" | "h2";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as = "h2",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  const HeadingTag = as;

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-violet-300/90 uppercase">
          {eyebrow}
        </p>
      )}
      <HeadingTag className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </HeadingTag>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-zinc-400">
          {description}
        </p>
      )}
    </div>
  );
}
