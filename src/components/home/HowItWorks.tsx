import { howItWorksSteps } from "@/data/how-it-works";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function HowItWorks() {
  return (
    <Section>
      <SectionHeading
        eyebrow="How it works"
        title="From upload to export in four steps"
        description="A clear workflow for professionals who need structured clarity."
      />

      <ol className="relative mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <div
          aria-hidden
          className="pointer-events-none absolute top-5 right-[12.5%] left-[12.5%] hidden h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent lg:block"
        />
        {howItWorksSteps.map((step) => (
          <li key={step.step} className="relative">
            <div className="flex items-start gap-3 lg:flex-col lg:items-center lg:text-center">
              <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-zinc-900 text-xs font-semibold text-violet-300 shadow-sm shadow-violet-500/10">
                {step.step}
              </span>
              <div className="lg:mt-3">
                <h3 className="text-sm font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                  {step.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
