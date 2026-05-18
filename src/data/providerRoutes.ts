import type { AnalysisMode, AnalysisPersona, ProviderRoute } from "@/core/types";

export const providerRoutes: ProviderRoute[] = [
  { persona: "executive", mode: "standard", primary: "openai", fallback: ["groq", "openrouter"] },
  { persona: "executive", mode: "deep", primary: "openai", fallback: ["gemini"] },
  { persona: "academic", mode: "standard", primary: "gemini", fallback: ["openai", "openrouter"] },
  { persona: "academic", mode: "deep", primary: "gemini", fallback: ["openai"] },
  { persona: "legal", mode: "standard", primary: "openai", fallback: ["gemini"] },
  { persona: "legal", mode: "advanced", primary: "openai", fallback: ["gemini", "groq"] },
  { persona: "creator", mode: "standard", primary: "groq", fallback: ["openai"] },
  { persona: "creator", mode: "quick", primary: "groq", fallback: ["openrouter"] },
];

export function getProviderRoute(
  persona: AnalysisPersona,
  mode: AnalysisMode,
): ProviderRoute {
  const route =
    providerRoutes.find((r) => r.persona === persona && r.mode === mode) ??
    providerRoutes.find((r) => r.persona === persona && r.mode === "standard");

  if (!route) {
    return {
      persona,
      mode,
      primary: "openrouter",
      fallback: ["groq"],
    };
  }

  return route;
}

export type ProviderHealthStatus = "healthy" | "degraded" | "offline";

export type ProviderHealthMock = {
  name: ProviderRoute["primary"];
  status: ProviderHealthStatus;
  latencyMs: number;
};

/** Mock provider health for dashboard — replace with real health checks. */
export const providerHealthMock: ProviderHealthMock[] = [
  { name: "openai", status: "healthy", latencyMs: 420 },
  { name: "groq", status: "healthy", latencyMs: 180 },
  { name: "gemini", status: "degraded", latencyMs: 890 },
  { name: "openrouter", status: "healthy", latencyMs: 310 },
];
