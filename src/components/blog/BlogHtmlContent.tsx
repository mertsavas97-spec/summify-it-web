import { sanitizeCmsBlogHtml } from "@/lib/blog/cmsBody";

type BlogHtmlContentProps = {
  html: string;
  className?: string;
};

export function BlogHtmlContent({ html, className = "" }: BlogHtmlContentProps) {
  return (
    <div
      className={className}
      // Sanitization is centralized in `sanitizeCmsBlogHtml`.
      dangerouslySetInnerHTML={{ __html: sanitizeCmsBlogHtml(html) }}
    />
  );
}
