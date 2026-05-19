import Link from "next/link";

export type RelatedLinkItem = {
  href: string;
  label: string;
  description: string;
};

type RelatedLinksSectionProps = {
  title?: string;
  links: RelatedLinkItem[];
};

export function RelatedLinksSection({
  title = "Related workflows",
  links,
}: RelatedLinksSectionProps) {
  return (
    <section className="border-b border-white/[0.04] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4 transition-colors hover:border-violet-500/25 hover:bg-violet-950/15"
              >
                <span className="text-sm font-medium text-violet-200">{link.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                  {link.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
