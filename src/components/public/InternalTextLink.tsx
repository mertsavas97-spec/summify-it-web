import Link from "next/link";

type InternalTextLinkProps = {
  href: string;
  children: React.ReactNode;
};

/** Keyword-rich contextual internal link for marketing copy. */
export function InternalTextLink({ href, children }: InternalTextLinkProps) {
  return (
    <Link
      href={href}
      className="font-medium text-violet-300/90 underline-offset-2 hover:text-violet-200 hover:underline"
    >
      {children}
    </Link>
  );
}
