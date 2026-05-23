import Link from "next/link";

type SeoBreadcrumbItem = {
  name: string;
  href: string;
};

type SeoBreadcrumbsProps = {
  items: SeoBreadcrumbItem[];
};

export function SeoBreadcrumbs({ items }: SeoBreadcrumbsProps) {
  return (
    <section className="border-b border-white/[0.04] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="text-xs text-zinc-500" aria-label="Breadcrumb">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <span key={item.href}>
                {last ? (
                  <span className="text-zinc-300">{item.name}</span>
                ) : (
                  <Link href={item.href} className="hover:text-violet-300">
                    {item.name}
                  </Link>
                )}
                {!last ? <span className="px-2 text-zinc-600">/</span> : null}
              </span>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
