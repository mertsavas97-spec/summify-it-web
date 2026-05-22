"use client";

type MarkdownToolbarProps = {
  onInsert: (snippet: string, cursorOffset?: number) => void;
};

const tools: { label: string; snippet: string; offset?: number }[] = [
  { label: "B", snippet: "**text**", offset: -2 },
  { label: "I", snippet: "_text_", offset: -2 },
  { label: "H2", snippet: "\n\n## Heading\n\n" },
  { label: "H3", snippet: "\n\n### Subheading\n\n" },
  { label: "•", snippet: "\n- item one\n- item two\n" },
  { label: "1.", snippet: "\n1. First\n2. Second\n" },
  { label: "❝", snippet: "\n> Quote\n" },
  { label: "</>", snippet: "\n```\ncode\n```\n" },
  { label: "CTA", snippet: "\n\n```cta\n```\n\n" },
  {
    label: "FAQ",
    snippet: "\n\n```faq\nQ: Question?\nA: Answer.\n```\n\n",
  },
];

export function MarkdownToolbar({ onInsert }: MarkdownToolbarProps) {
  return (
    <div className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-white/[0.08] bg-zinc-900/80 p-1.5">
      {tools.map((tool) => (
        <button
          key={tool.label}
          type="button"
          title={tool.label}
          onClick={() => onInsert(tool.snippet, tool.offset)}
          className="min-w-[2rem] rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}
