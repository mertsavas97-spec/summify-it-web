"use client";

import Link from "next/link";
import { GraduationCap, Briefcase, FlaskConical, Users, PenTool, Megaphone } from "lucide-react";
import { trackProductEventV2Client } from "@/lib/analytics/trackProductEventV2Client";

const PERSONA_CHIPS = [
  {
    label: "Students",
    href: "/for-students",
    icon: GraduationCap,
    description: "Exam prep, lecture notes, quiz cards",
  },
  {
    label: "Researchers",
    href: "/for-researchers",
    icon: FlaskConical,
    description: "Paper synthesis, evidence mapping",
  },
  {
    label: "Creators",
    href: "/for-creators",
    icon: PenTool,
    description: "Hooks, repurposing, content workflows",
  },
  {
    label: "Teams",
    href: "/for-teams",
    icon: Users,
    description: "Executive briefs, shared library",
  },
  {
    label: "Freelancers",
    href: "/for-freelancers",
    icon: Briefcase,
    description: "Contract review, client deliverables",
  },
  {
    label: "Marketers",
    href: "/for-creators",
    icon: Megaphone,
    description: "SEO content, newsletters, social clips",
  },
] as const;

function trackPersonaClick(label: string) {
  trackProductEventV2Client("landing_cta_clicked", {
    metadata: { placement: "persona_chips", target: label },
  });
}

export function PersonaChipsRow() {
  return (
    <section className="border-b border-white/[0.04] px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="persona-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="persona-heading" className="sr-only">
          Built for your role
        </h2>
        <ul className="flex flex-wrap gap-2 justify-center sm:justify-start" role="list">
          {PERSONA_CHIPS.map((persona) => {
            const Icon = persona.icon;
            return (
              <li key={persona.label}>
                <Link
                  href={persona.href}
                  onClick={() => trackPersonaClick(persona.label)}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-zinc-950/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-violet-500/40 hover:bg-violet-950/30 hover:text-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  aria-label={persona.description}
                >
                  <Icon className="h-4 w-4 text-zinc-500 group-hover:text-violet-300 transition-colors" aria-hidden />
                  <span>{persona.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}