import type { Metadata } from "next";
import {
  SUMMIFY_LAUNCH_KIT,
  formatLaunchFeatureList,
  getLaunchTagline,
} from "@/data/launch/producthunt";
import { DIRECTORY_LISTINGS } from "@/data/distribution/directories";
import { createPageMetadata } from "@/lib/metadata";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = createPageMetadata({
  title: "Launch kit",
  description: "Internal launch and directory submission copy for Summify.",
  path: "/launch",
  noIndex: true,
});

export default function LaunchKitPage() {
  const kit = SUMMIFY_LAUNCH_KIT;

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs text-zinc-500">Internal · not indexed</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">Launch & distribution kit</h1>
      <p className="mt-3 text-sm text-zinc-400">
        Reusable copy for Product Hunt, AI directories, and partner outreach. See{" "}
        <code className="text-zinc-300">docs/GROWTH_AND_DISTRIBUTION.md</code>.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-white">Taglines</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          {kit.taglines.map((t) => (
            <li key={t.id} className="rounded-lg border border-white/[0.06] bg-zinc-950/50 p-3">
              <span className="text-[10px] uppercase text-zinc-600">{t.id}</span>
              <p className="mt-1 text-zinc-300">{t.text}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-zinc-600">Primary: {getLaunchTagline("primary")}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Short description</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{kit.shortDescription}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Long description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
          {kit.longDescription}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Maker story</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
          {kit.makerStory}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Features</h2>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/[0.06] bg-zinc-950/80 p-4 text-xs text-zinc-400">
          {formatLaunchFeatureList()}
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Launch FAQ</h2>
        <dl className="mt-4 space-y-4">
          {kit.faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="text-sm font-medium text-zinc-200">{faq.question}</dt>
              <dd className="mt-1 text-sm text-zinc-500">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Directory registry</h2>
        <ul className="mt-4 space-y-3">
          {DIRECTORY_LISTINGS.map((d) => (
            <li
              key={d.id}
              className="rounded-lg border border-white/[0.06] bg-zinc-950/50 p-4 text-sm"
            >
              <p className="font-medium text-zinc-200">{d.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{d.positioningAngle}</p>
              <p className="mt-2 text-xs text-zinc-600">{d.shortDescription}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 flex gap-3">
        <Button href={kit.cta.primaryUrl} size="sm">
          {kit.cta.primaryLabel}
        </Button>
        <Button href="/" variant="secondary" size="sm">
          Home
        </Button>
      </div>
    </article>
  );
}
