"use client";

import { personas } from "@/data/personas";
import type { AnalysisPersona } from "@/core/types";

type TemplateSelectorProps = {
  selectedId?: AnalysisPersona;
  onSelect?: (templateId: AnalysisPersona) => void;
};

export function TemplateSelector({
  selectedId = personas[0].id,
  onSelect,
}: TemplateSelectorProps) {
  const handleSelect = (id: AnalysisPersona) => {
    onSelect?.(id);
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xs font-medium text-zinc-400">Smart Template</h2>
        <p className="mt-0.5 text-[11px] text-zinc-600">
          Shapes summary structure and tone
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2" role="listbox" aria-label="Smart templates">
        {personas.map((template) => {
          const isSelected = selectedId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(template.id)}
              className={`rounded-lg border px-3 py-2.5 text-left transition-all duration-150 ${
                isSelected
                  ? "border-violet-500/40 bg-violet-950/40 ring-1 ring-violet-500/25"
                  : "border-white/[0.06] bg-zinc-950/50 hover:border-white/12 hover:bg-zinc-900/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-white">
                  {template.name}
                </span>
                <span className="font-mono text-[9px] text-zinc-600">
                  {template.code}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-[10px] text-zinc-500">
                {template.tagline}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
