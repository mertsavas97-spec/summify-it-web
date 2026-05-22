import { BLOG_POSTS } from "@/data/blog-posts";
import { ACTIVE_INTELLIGENCE_MODE_IDS } from "@/config/modes";
import { GUIDE_SLUGS } from "@/data/guides/registry";
import { USE_CASE_SLUGS } from "@/data/use-cases/registry";
import { AUDIO_STUDY_PATHS } from "@/data/audio-study-landings";

export type InternalLinkOption = {
  href: string;
  label: string;
  group: string;
};

const FORMAT_PAGES: InternalLinkOption[] = [
  { href: "/summarize-pdf", label: "AI PDF summarizer", group: "Formats" },
  { href: "/summarize-youtube-video", label: "YouTube summarizer", group: "Formats" },
  { href: "/summarize-powerpoint", label: "PowerPoint summarizer", group: "Formats" },
  { href: "/summarize-web-articles", label: "Web article summarizer", group: "Formats" },
  { href: "/summarize-docx", label: "DOCX summarizer", group: "Formats" },
  { href: "/summarize-mp3", label: "MP3 / podcast summarizer", group: "Formats" },
  ...AUDIO_STUDY_PATHS.map((path) => ({
    href: path,
    label: path.replace(/^\//, "").replace(/-/g, " "),
    group: "Audio study",
  })),
];

const CORE: InternalLinkOption[] = [
  { href: "/upload", label: "Workspace / upload", group: "Product" },
  { href: "/pricing", label: "Pricing", group: "Product" },
  { href: "/blog", label: "Blog index", group: "Product" },
  { href: "/modes", label: "All intelligence modes", group: "Modes" },
  { href: "/for-students", label: "For students", group: "Segments" },
  { href: "/for-researchers", label: "For researchers", group: "Segments" },
  { href: "/for-creators", label: "For creators", group: "Segments" },
];

export function getInternalLinkCatalog(extraBlogSlugs: { slug: string; title: string }[] = []): InternalLinkOption[] {
  const blogLinks: InternalLinkOption[] = [
    ...BLOG_POSTS.map((p) => ({
      href: `/blog/${p.slug}`,
      label: p.title,
      group: "Blog (static)",
    })),
    ...extraBlogSlugs.map((p) => ({
      href: `/blog/${p.slug}`,
      label: p.title,
      group: "Blog (CMS)",
    })),
  ];

  const guides = GUIDE_SLUGS.map((slug) => ({
    href: `/guides/${slug}`,
    label: slug.replace(/-/g, " "),
    group: "Guides",
  }));

  const modes = ACTIVE_INTELLIGENCE_MODE_IDS.map((id) => ({
    href: `/modes/${id}`,
    label: id.replace(/-/g, " "),
    group: "Modes",
  }));

  const useCases = USE_CASE_SLUGS.map((slug) => ({
    href: `/use-cases/${slug}`,
    label: slug.replace(/-/g, " "),
    group: "Use cases",
  }));

  return [...CORE, ...FORMAT_PAGES, ...blogLinks, ...guides, ...modes, ...useCases];
}

export function filterInternalLinks(
  catalog: InternalLinkOption[],
  query: string,
): InternalLinkOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalog;
  return catalog.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.href.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q),
  );
}
