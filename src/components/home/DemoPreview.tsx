import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

const documentContent = {
  section: "Section 3.2 — Market Expansion Strategy",
  paragraphs: [
    {
      text: "The proposed expansion into EMEA markets requires coordinated investment across sales, localization, and compliance. Initial projections suggest a 14-month payback period under base-case assumptions.",
      highlighted: true,
    },
    {
      text: "Key dependencies include regulatory approval in two jurisdictions and hiring of regional leadership by Q3. Risk factors include currency volatility and slower enterprise adoption in the DACH region.",
      highlighted: false,
    },
    {
      text: "Recommendation: proceed with phased rollout beginning in Germany, with France and Netherlands following in sequence.",
      highlighted: false,
    },
  ],
};

const summarySections = [
  {
    title: "Executive overview",
    content:
      "EMEA expansion is viable with phased rollout; 14-month payback under base case.",
  },
  {
    title: "Key decisions",
    items: [
      "Lead with Germany, then France and Netherlands",
      "Hire regional leadership by Q3",
    ],
  },
  {
    title: "Risks",
    items: [
      "Regulatory approval in two jurisdictions",
      "DACH enterprise adoption pace",
    ],
  },
];

export function DemoPreview() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Product demo"
        title="Read source and summary side by side"
        description="The web workspace keeps your document in view while you work through structured output."
      />

      <div className="mt-8 overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/50 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.04]">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-zinc-900/90 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
          </div>
          <span className="truncate text-xs text-zinc-500">
            Q3_Strategy_Memo.pdf
          </span>
          <span className="shrink-0 rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
            The Executive
          </span>
        </div>

        <div className="grid lg:grid-cols-2">
          <div className="border-b border-white/[0.06] lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-white/[0.04] bg-zinc-900/40 px-4 py-2">
              <span className="text-[11px] font-medium text-zinc-500">
                Original · Page 12 of 42
              </span>
              <span className="text-[10px] text-zinc-600">100%</span>
            </div>
            <div className="max-h-[280px] overflow-hidden p-4 sm:p-5">
              <h4 className="font-serif text-[15px] font-semibold leading-snug text-zinc-200">
                {documentContent.section}
              </h4>
              <div className="mt-3 space-y-3 font-serif text-[13px] leading-[1.65] text-zinc-400">
                {documentContent.paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className={
                      para.highlighted
                        ? "border-l-2 border-violet-500/60 bg-violet-500/5 py-1 pl-3 text-zinc-300"
                        : ""
                    }
                  >
                    {para.text}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-violet-950/25 to-transparent">
            <div className="flex items-center justify-between border-b border-white/[0.04] bg-violet-950/20 px-4 py-2">
              <span className="text-[11px] font-medium text-violet-300/80">
                Structured summary
              </span>
              <span className="text-[10px] text-zinc-600">Export ready</span>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              {summarySections.map((section) => (
                <div key={section.title}>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
                    {section.title}
                  </h4>
                  {"content" in section && section.content && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
                      {section.content}
                    </p>
                  )}
                  {"items" in section && section.items && (
                    <ul className="mt-2 space-y-1">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 text-[13px] text-zinc-400"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
