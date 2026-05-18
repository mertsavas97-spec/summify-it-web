import { buildPageMetadata } from "@/lib/seo";
import { TrustPageLayout } from "@/components/public/TrustPageLayout";

export const metadata = buildPageMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions about Summify.it — supported formats, privacy, YouTube transcripts, beta limits, and Pro modes.",
  path: "/faq",
});

const faqs = [
  {
    q: "What can I upload or analyze?",
    a: "PDF, DOCX, TXT, PowerPoint (PPTX), pasted text, public web articles (URL), and YouTube videos (via transcript). The workspace guides you through extraction, then analysis.",
  },
  {
    q: "Does YouTube always work?",
    a: "YouTube analysis depends on an available transcript for the video. Auto-generated or uploaded captions are required; videos without transcripts may fail extraction. Long videos may be compacted for analysis limits.",
  },
  {
    q: "Are my uploads stored?",
    a: "During beta, files are processed on the server for extraction and analysis. We do not offer persistent libraries, accounts, or long-term document storage yet. Do not upload confidential material you cannot process on a third-party AI stack.",
  },
  {
    q: "What data is sent to AI providers?",
    a: "Extracted text and analysis prompts are sent to configured providers (e.g. Groq, Gemini) to generate your results. We do not sell your content. See our Privacy page for a plain-language overview.",
  },
  {
    q: "What are Pro modes?",
    a: "Twenty-five additional intelligence lenses are visible in the mode browser as Pro Intelligence previews. Four modes are active today; locked modes can be explored but cannot run analysis until they launch.",
  },
  {
    q: "Is Summify.it free?",
    a: "Yes during public beta. Pricing pages show planned tiers for transparency — checkout and billing are not enabled yet.",
  },
  {
    q: "Can I use outputs for legal or medical decisions?",
    a: "No. AI outputs are for information and drafting support only. They are not legal, medical, or financial advice. Review important documents with qualified professionals.",
  },
];

export default function FaqPage() {
  return (
    <TrustPageLayout
      eyebrow="FAQ"
      title="Common questions"
      lead="Quick answers about formats, privacy, beta limits, and how the workspace behaves today."
    >
      <ul className="space-y-6">
        {faqs.map((item) => (
          <li key={item.q}>
            <h2 className="text-base font-semibold text-zinc-200">{item.q}</h2>
            <p className="mt-2">{item.a}</p>
          </li>
        ))}
      </ul>
    </TrustPageLayout>
  );
}
