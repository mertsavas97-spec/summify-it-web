import type {
  AnalysisMode,
  AnalysisPersona,
  DocumentProfile,
  ProviderRoute,
} from "@/core/types";
import { getProviderRoute } from "@/data/providerRoutes";

type RoutePersonaParams = {
  profile: DocumentProfile;
  requestedPersona?: AnalysisPersona;
  mode?: AnalysisMode;
};

/**
 * Selects analysis persona and provider route from document profile.
 * Production: ML classifier + user override + plan gates.
 */
export function routeAnalysisPersonaMock({
  profile,
  requestedPersona,
  mode = "standard",
}: RoutePersonaParams): {
  persona: AnalysisPersona;
  route: ProviderRoute;
  reason: string;
} {
  const persona: AnalysisPersona =
    requestedPersona ??
    (profile.domain === "legal"
      ? "legal"
      : profile.domain === "research"
        ? "academic"
        : profile.complexity === "high"
          ? "executive"
          : "executive");

  const route = getProviderRoute(persona, mode);

  return {
    persona,
    route,
    reason: requestedPersona
      ? "User-selected persona"
      : `Auto-routed from domain: ${profile.domain}`,
  };
}
