import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { BlogWorkflowCta } from "@/components/blog/cta/BlogWorkflowCta";
import type { BlogFaqItem } from "@/data/blog-post-types";

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type BlogMarkdownContentProps = {
  markdown: string;
  className?: string;
};

function parseFaqBlock(body: string): BlogFaqItem[] {
  const items: BlogFaqItem[] = [];
  const lines = body.split("\n");
  let currentQ: string | null = null;
  for (const line of lines) {
    const q = line.match(/^Q:\s*(.+)$/i);
    const a = line.match(/^A:\s*(.+)$/i);
    if (q) {
      if (currentQ) items.push({ q: currentQ, a: "" });
      currentQ = q[1].trim();
    } else if (a && currentQ) {
      items.push({ q: currentQ, a: a[1].trim() });
      currentQ = null;
    }
  }
  if (currentQ) items.push({ q: currentQ, a: "" });
  return items;
}

function stripCustomFences(md: string): string {
  return md
    .replace(/```cta[\s\S]*?```/g, "")
    .replace(/```faq[\s\S]*?```/g, "")
    .trim();
}

export function BlogMarkdownContent({ markdown, className = "" }: BlogMarkdownContentProps) {
  const hasCta = /```cta/.test(markdown);
  const faqBlocks = [...markdown.matchAll(/```faq([\s\S]*?)```/g)];

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = String(children);
            const id = slugifyHeading(text);
            return (
              <h2 id={id} className="mt-10 scroll-mt-24 text-xl font-semibold text-zinc-100">
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = String(children);
            const id = slugifyHeading(text);
            return (
              <h3 id={id} className="mt-6 scroll-mt-24 text-lg font-semibold text-zinc-200">
                {children}
              </h3>
            );
          },
          p: ({ children }) => (
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-400">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-400">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-4 border-l-2 border-violet-500/40 pl-4 text-sm italic text-zinc-500">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClass, children }) => {
            const isBlock = codeClass?.includes("language-");
            if (isBlock) {
              return (
                <pre className="mt-4 overflow-x-auto rounded-lg border border-white/[0.06] bg-zinc-950/80 p-4 text-xs text-zinc-300">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className="rounded bg-zinc-900 px-1 py-0.5 text-[13px] text-violet-200">
                {children}
              </code>
            );
          },
          a: ({ href, children }) => {
            const url = href ?? "#";
            const external = url.startsWith("http");
            const className =
              "font-medium text-violet-300 underline decoration-violet-500/30 underline-offset-2 hover:text-violet-200";
            if (external) {
              return (
                <a href={url} className={className} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            }
            return (
              <Link href={url} className={className}>
                {children}
              </Link>
            );
          },
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src ?? ""}
              alt={alt ?? ""}
              className="mt-6 w-full rounded-lg border border-white/[0.06]"
            />
          ),
        }}
      >
        {stripCustomFences(markdown)}
      </ReactMarkdown>

      {hasCta ? (
        <div className="mt-8">
          <BlogWorkflowCta cluster="study-workflows" />
        </div>
      ) : null}

      {faqBlocks.map((match, i) => {
        const body = match[1]?.trim() ?? "";
        const faqs = parseFaqBlock(body);
        if (faqs.length === 0) return null;
        return (
          <div
            key={`faq-${i}`}
            className="mt-8 space-y-4 rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300/80">
              FAQ
            </p>
            {faqs.map((item) => (
              <div key={item.q}>
                <p className="text-sm font-medium text-zinc-200">{item.q}</p>
                <p className="mt-1 text-sm text-zinc-500">{item.a}</p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
