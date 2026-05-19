import { pageSeo } from "@/lib/page-metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { webPageSchema } from "@/lib/schema";
import { INTELLIGENCE_MODES } from "@/config/modes";
import { MODE_CATEGORY_META, getModesByCategory, countModesByAvailability } from "@/lib/mode-groups";
import { ModePreviewCard } from "@/components/public/ModePreviewCard";
import { CTASection } from "@/components/public/CTASection";
import { PublicHero } from "@/components/public/PublicHero";
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";

export const metadata = pageSeo.modes;

export default function ModesHubPage() {
  const counts = countModesByAvailability();
  const byCategory = getModesByCategory(INTELLIGENCE_MODES);

  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: "Intelligence modes",
          description:
            "Browse executive, study, creator, document, and technical intelligence lenses for documents, video, and articles.",
          path: "/modes",
        })}
      />
      <PublicHero
        badge="Intelligence modes"
        title="29 specialized lenses. Five active today."
        description={`Choose how Summify organizes your source — executive, academic, creator, document, technical, and more. ${counts.active} modes run in the workspace now; ${counts.locked} Pro modes and ${counts.comingSoon} coming soon are visible for early access.`}
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
        description="Executive Brief, The Student, The Creator, and Contract Summary are available now. Locked modes are preview-only until Pro Intelligence launches."
        primaryLabel="Open workspace"
      />
      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ProductDisclaimer />
        </div>
      </section>
    </>
  );
}
