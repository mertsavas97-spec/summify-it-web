import { buildPageMetadata } from "@/lib/seo";
import { INTELLIGENCE_MODES } from "@/config/modes";
import { MODE_CATEGORY_META, getModesByCategory, countModesByAvailability } from "@/lib/mode-groups";
import { ModePreviewCard } from "@/components/public/ModePreviewCard";
import { CTASection } from "@/components/public/CTASection";
import { PublicHero } from "@/components/public/PublicHero";

export const metadata = buildPageMetadata({
  title: "29 intelligence modes for documents, video, and study",
  description:
    "Browse Summify.it intelligence modes by category — four active today, Pro Intelligence modes and coming-soon lenses on the roadmap.",
  path: "/modes",
  keywords: ["AI analysis modes", "document intelligence modes", "Summify modes"],
});

export default function ModesHubPage() {
  const counts = countModesByAvailability();
  const byCategory = getModesByCategory(INTELLIGENCE_MODES);

  return (
    <>
      <PublicHero
        badge="Intelligence modes"
        title="29 specialized lenses. Four active today."
        description={`Choose how Summify analyzes your source — executive, academic, creator, legal, and more. ${counts.active} modes run in the workspace now; ${counts.locked} Pro modes and ${counts.comingSoon} coming soon are visible for early access.`}
        primaryCta={{ href: "/upload", label: "Try active modes" }}
        secondaryCta={{ href: "/pricing", label: "Planned pricing" }}
      />

      <section className="border-b border-white/[0.04] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs text-zinc-500">
            {counts.active} active · {counts.locked} Pro · {counts.comingSoon} coming soon
          </p>
        </div>
      </section>

      {MODE_CATEGORY_META.map((cat) => {
        const modes = byCategory.get(cat.id) ?? [];
        if (modes.length === 0) return null;
        return (
          <section
            key={cat.id}
            className="border-b border-white/[0.04] px-4 py-12 sm:px-6 lg:px-8"
          >
            <div className="mx-auto max-w-6xl">
              <h2 className="text-lg font-semibold text-white">{cat.label}</h2>
              <p className="mt-1 text-sm text-zinc-500">{cat.description}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {modes.map((mode) => (
                  <li key={mode.id}>
                    <ModePreviewCard mode={mode} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <CTASection
        title="Run active modes in the workspace"
        description="Executive Brief, The Student, The Creator, and Contract Analyzer are available now. Locked modes are preview-only until Pro Intelligence launches."
        primaryLabel="Open workspace"
      />
    </>
  );
}
