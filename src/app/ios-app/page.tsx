import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/Button";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { buildPageMetadata } from "@/lib/seo";
import { breadcrumbSchema, faqPageSchema, softwareApplicationSchema } from "@/lib/schema";
import type { FaqItem } from "@/data/faqs";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/summify-ai-summary-learn/id6770321706?utm_source=summify_web&utm_medium=ios_app_page&utm_campaign=ios_app_launch";

const faqs: FaqItem[] = [
  {
    q: "Is Summify available on iPhone?",
    a: "Yes. Summify is available on iPhone through the App Store, and it complements the web app for mobile-first studying and quick capture.",
  },
  {
    q: "Can I summarize PDFs on iPhone?",
    a: "Yes. You can use Summify on iPhone to turn PDFs into AI summaries, learn cards, and review-friendly study workflows.",
  },
  {
    q: "Can Summify summarize YouTube videos?",
    a: "Yes. Summify can work with YouTube URLs so you can turn long videos into structured summaries and study outputs.",
  },
  {
    q: "Is Summify free to download?",
    a: "The iOS app is free to download from the App Store. Availability of features and limits may depend on your plan and current product settings.",
  },
  {
    q: "Should I use the web app or iOS app?",
    a: "Use the web app for longer documents, desktop workflows, and deeper workspace sessions. Use the iOS app for quick capture, mobile studying, and reviewing on the go.",
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: "Summify iOS App: AI Summary & Learn on iPhone",
  description:
    "Download Summify for iPhone to turn PDFs, YouTube videos, audio, web articles, and documents into AI summaries, learn cards, and study workflows.",
  path: "/ios-app",
  keywords: [
    "AI summary app for iPhone",
    "AI study app",
    "PDF summarizer app",
    "YouTube summarizer app",
    "AI learn cards app",
    "AI audio study app",
  ],
});

export default function IosAppPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareApplicationSchema({
            path: "/ios-app",
            name: "Summify: AI Summary & Learn",
            description:
              "Summify for iPhone turns PDFs, YouTube videos, audio, web articles, and documents into AI summaries, learn cards, and study workflows.",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "iOS App", path: "/ios-app" },
          ]),
          faqPageSchema(faqs),
        ]}
      />

      <main className="bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.14),transparent_28%),linear-gradient(to_bottom,#09090b_0%,#050505_100%)] text-white">
        <section className="border-b border-white/[0.04] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
                  AI summary app for iPhone
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.05]">
                  Summify iOS App: AI Summary &amp; Learn on iPhone
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                  Turn PDFs, YouTube videos, audio, web articles, and documents into AI summaries,
                  learn cards, and study workflows on iPhone.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href={APP_STORE_URL} size="lg">
                    Download on the App Store
                  </Button>
                  <Button href="/upload" variant="secondary" size="lg">
                    Try Summify on web
                  </Button>
                </div>
                <div className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-400">
                  <Link href="/pricing" className="hover:text-violet-300 hover:underline">
                    Pricing
                  </Link>
                  <span className="text-white/10">•</span>
                  <Link href="/for-students" className="hover:text-violet-300 hover:underline">
                    For students
                  </Link>
                  <span className="text-white/10">•</span>
                  <Link
                    href="/ai-audio-study-guide"
                    className="hover:text-violet-300 hover:underline"
                  >
                    AI audio study guide
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-2xl shadow-violet-950/20 backdrop-blur">
                <div className="rounded-2xl border border-white/[0.05] bg-zinc-950/70 p-5">
                  <p className="text-sm font-medium text-violet-300">Mobile study workflow</p>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-300">
                    <p>Capture a PDF, paste a YouTube URL, or review an audio note on the go.</p>
                    <p>Get summaries, learn cards, and study-friendly outputs tuned for mobile use.</p>
                    <p>
                      Switch to the web app when you want deeper workspace sessions or long-form
                      document analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                What Summify does on iPhone
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Summify helps you summarize and learn from PDFs, YouTube videos, audio, web
                articles, and documents on iPhone. It is designed for quick capture, focused
                review, and study outputs that are easier to revisit later.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                If you want a desktop-first workflow, the <InternalTextLink href="/upload">web
                workspace</InternalTextLink> is still the best place for longer documents and
                deeper sessions.
              </p>
            </article>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <h2 className="text-xl font-semibold tracking-tight text-white">Supported formats</h2>
                <ul className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
                  <li>PDF</li>
                  <li>DOCX</li>
                  <li>TXT</li>
                  <li>MP3/audio</li>
                  <li>YouTube URLs</li>
                  <li>Web articles</li>
                </ul>
              </article>

              <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Learn cards and AI study modes
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                  Summify turns source material into learn cards, study workflows, and
                  review-friendly outputs so you can keep moving between reading, listening, and
                  recall practice. It is built to support AI study app use cases without forcing a
                  single format.
                </p>
              </article>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <h2 className="text-xl font-semibold tracking-tight text-white">Study anywhere</h2>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                  The iOS app is a good fit for commuting, walking, reviewing before exams, and
                  mobile-first studying. It keeps the workflow lightweight when you need answers
                  quickly and still want a structured result.
                </p>
              </article>

              <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <h2 className="text-xl font-semibold tracking-tight text-white">Private by design</h2>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                  Summify is built for private document workflows and careful handling of your
                  study materials. Keep sensitive sources in the flow that fits your needs and use
                  the app in a way that matches your own privacy expectations.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-white">Web app vs iOS app</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-5">
                  <h3 className="text-sm font-semibold text-violet-300">Web app</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    Better for long documents, desktop workflows, and deeper workspace use.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-5">
                  <h3 className="text-sm font-semibold text-violet-300">iOS app</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    Better for quick capture, mobile studying, and reading or listening on the go.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                The two experiences are complementary: start on iPhone when you are away from your
                desk, then move to <InternalTextLink href="/upload">Summify on web</InternalTextLink>{" "}
                when you need more room for deeper analysis.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <h2 className="text-xl font-semibold tracking-tight text-white">Useful internal links</h2>
                <ul className="mt-4 space-y-3 text-sm text-zinc-400">
                  <li>
                    <InternalTextLink href="/upload">Upload workspace</InternalTextLink>
                  </li>
                  <li>
                    <InternalTextLink href="/pdf-summarizer">PDF summarizer</InternalTextLink>
                  </li>
                  <li>
                    <InternalTextLink href="/youtube-video-summarizer">
                      YouTube video summarizer
                    </InternalTextLink>
                  </li>
                  <li>
                    <InternalTextLink href="/ai-audio-study-guide">
                      AI audio study guide
                    </InternalTextLink>
                  </li>
                  <li>
                    <InternalTextLink href="/for-students">For students</InternalTextLink>
                  </li>
                  <li>
                    <InternalTextLink href="/pricing">Pricing</InternalTextLink>
                  </li>
                </ul>
              </article>

              <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <h2 className="text-xl font-semibold tracking-tight text-white">Get the app</h2>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                  Download Summify on iPhone to keep summaries, learn cards, and study workflows
                  close at hand.
                </p>
                <div className="mt-6">
                  <Button href={APP_STORE_URL} size="lg">
                    Download on the App Store
                  </Button>
                </div>
                <p className="mt-4 text-xs text-zinc-500">
                  App Store listing: {APP_STORE_URL.includes("utm_source") ? APP_STORE_URL.replace(/\?utm_.+$/, "") : APP_STORE_URL}
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-white">FAQ</h2>
            <div className="mt-6 space-y-2">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-white/[0.06] bg-zinc-950/50 open:border-violet-500/20 open:bg-violet-950/10"
                >
                  <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-medium text-zinc-200 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {item.q}
                      <span
                        className="shrink-0 text-violet-400/70 transition-transform group-open:rotate-45"
                        aria-hidden
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <div className="border-t border-white/[0.04] px-4 pb-4 pt-2">
                    <p className="text-sm leading-relaxed text-zinc-400">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
