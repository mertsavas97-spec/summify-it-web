import Link from "next/link";
import type { BlogProductLink } from "@/lib/blog";

type BlogRelatedLinksProps = {
  workflows: BlogProductLink[];
  formats: BlogProductLink[];
  comparisons: BlogProductLink[];
};

export function BlogRelatedLinks({ workflows, formats, comparisons }: BlogRelatedLinksProps) {
  const sections = [
    { title: "Related workflows", links: workflows },
    { title: "Related formats", links: formats },
    { title: "Related comparisons", links: comparisons },
  ].filter((s) => s.links.length > 0);

  if (sections.length === 0) return null;

  return (
    <aside className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5">
      <h2 className="text-sm font-semibold text-zinc-200">Explore Summify</h2>
      <div className="mt-4 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {section.title}
            </h3>
            <ul className="mt-2 space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-violet-300/90 hover:text-violet-200 hover:underline"
                  >
                    {link.label}
                  </Link>
                  {link.description ? (
                    <p className="text-xs text-zinc-600">{link.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
