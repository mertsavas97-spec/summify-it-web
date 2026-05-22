import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/schema";

type BlogBreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function BlogBreadcrumbs({ items }: BlogBreadcrumbsProps) {
  return (
    <nav className="text-xs text-zinc-500" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.path}>
            {index > 0 ? <span className="mx-2">/</span> : null}
            {isLast ? (
              <span className="text-zinc-400">{item.name}</span>
            ) : (
              <Link href={item.path} className="hover:text-violet-300">
                {item.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
