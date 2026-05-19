import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { FeedbackTrigger } from "@/components/growth/FeedbackTrigger";
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";
import { SEO_BRAND } from "@/lib/seo";

const footerSections = [
  {
    title: "Formats",
    links: [
      { href: "/summarize-pdf", label: "PDF Summarizer" },
      { href: "/summarize-youtube-video", label: "YouTube Summarizer" },
      { href: "/summarize-powerpoint", label: "PowerPoint Summarizer" },
      { href: "/summarize-web-articles", label: "Web Articles" },
      { href: "/summarize-docx", label: "DOCX Summarizer" },
      { href: "/summarize-mp3", label: "MP3 / Audio" },
    ],
  },
  {
    title: "Segments",
    links: [
      { href: "/for-students", label: "For Students" },
      { href: "/for-creators", label: "For Creators" },
      { href: "/for-teams", label: "For Teams" },
      { href: "/for-freelancers", label: "For Freelancers" },
      { href: "/for-researchers", label: "For Researchers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/guides/best-ai-pdf-summarizers-2026", label: "Guides" },
      { href: "/compare/chatpdf", label: "Compare" },
      { href: "/use-cases/research-papers-students", label: "Use cases" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { href: "/modes", label: "All modes" },
      { href: "/modes/executive-brief", label: "Executive Brief" },
      { href: "/modes/the-student", label: "The Student" },
      { href: "/modes/the-creator", label: "The Creator" },
      { href: "/modes/contract-analyzer", label: "Contract Summary" },
    ],
  },
  {
    title: "Product",
    links: [
      { href: "/upload", label: "Workspace" },
      { href: "/pricing", label: "Pricing" },
      { href: "/status", label: "Status" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/faq", label: "FAQ" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0b0f]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-7">
          <div className="sm:col-span-2 lg:col-span-1">
            <BrandMark href="/" size="footer" className="opacity-95" />
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-zinc-400">
              Structured intelligence from PDFs, decks, videos, and articles — with Learn cards
              built in.
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {section.title}
              </p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-zinc-400 transition-colors hover:text-violet-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/[0.06] pt-6 text-[11px] text-zinc-500">
          <span>© {new Date().getFullYear()} {SEO_BRAND}.</span>
          <FeedbackTrigger />
        </p>
        <ProductDisclaimer className="mt-2 max-w-3xl" />
      </div>
    </footer>
  );
}
