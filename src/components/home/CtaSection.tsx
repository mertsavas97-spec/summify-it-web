import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

export function CtaSection() {
  return (
    <Section className="pb-16">
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/40 via-zinc-900/90 to-indigo-950/30 px-6 py-10 text-center sm:px-10">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Ready to work smarter with long documents?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
          Open the upload workspace, pick a Smart Template, and explore
          side-by-side review.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button href="/upload" size="md">
            Try the upload workspace
          </Button>
          <Button href="/pricing" variant="secondary" size="md">
            See pricing
          </Button>
        </div>
      </div>
    </Section>
  );
}
