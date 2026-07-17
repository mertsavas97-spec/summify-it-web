import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { FeedbackTrigger } from "@/components/growth/FeedbackTrigger";
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";
import { SUMMIFY_SOCIAL_LINKS } from "@/lib/social-links";
import { SEO_BRAND } from "@/lib/seo";

const footerSections = [
  {
    title: "Summarizers",
    links: [
      { href: "/summarize-pdf", label: "PDF Summarizer" },
      { href: "/summarize-powerpoint", label: "PowerPoint Summarizer" },
      { href: "/summarize-youtube-video", label: "YouTube Summarizer" },
      { href: "/summarize-web-articles", label: "Article Summarizer" },
      { href: "/summarize-docx", label: "DOCX Summarizer" },
      { href: "/modes/contract-analyzer", label: "Contract Summary" },
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
      { href: "/guides/best-ai-pdf-summarizers-2026", label: "PDF Summarizer Guide" },
      { href: "/compare/notebooklm", label: "NotebookLM Alternative" },
      { href: "/compare/chatpdf", label: "vs ChatPDF" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { href: "/modes", label: "All modes" },
      { href: "/modes/general-summary", label: "General Summary" },
      { href: "/modes/executive-brief", label: "Executive Brief" },
      { href: "/modes/the-student", label: "The Student" },
      { href: "/modes/the-creator", label: "The Creator" },
    ],
  },
  {
    title: "Product",
    links: [
      { href: "/upload", label: "Workspace" },
      { href: "/ios-app", label: "iOS App" },
      { href: "/pricing", label: "Pricing" },
      { href: "/status", label: "Status" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
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
              Free AI summarizer for PDFs, PowerPoint, YouTube, and articles — with flashcards,
              quizzes, and optional audio lessons.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={SUMMIFY_SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 transition-colors hover:text-violet-300"
              >
                X (Twitter)
              </a>
              <a
                href={SUMMIFY_SOCIAL_LINKS.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 transition-colors hover:text-violet-300"
              >
                LinkedIn
              </a>
            </div>
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
