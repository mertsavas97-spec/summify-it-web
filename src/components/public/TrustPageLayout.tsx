import Link from "next/link";
import { Button } from "@/components/ui/Button";

type TrustPageLayoutProps = {
  eyebrow: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
};

export function TrustPageLayout({
  eyebrow,
  title,
  lead,
  children,
}: TrustPageLayoutProps) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-400/80">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>
      {lead && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">{lead}</p>
      )}
      <div className="prose-trust mt-8 space-y-6 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
        {children}
      </div>
      <div className="mt-10 flex flex-wrap gap-3 border-t border-white/[0.06] pt-8">
        <Button href="/upload" size="sm">
          Open workspace
        </Button>
        <Button href="/faq" variant="secondary" size="sm">
          FAQ
        </Button>
        <Link href="/" className="self-center text-xs text-zinc-500 hover:text-violet-300">
          ← Home
        </Link>
      </div>
    </article>
  );
}
