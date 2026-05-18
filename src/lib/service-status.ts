export type ServiceStatusPayload = {
  status: "operational" | "degraded";
  beta: true;
  services: {
    analysis: boolean;
    youtube: boolean;
  };
};

export function getServiceStatus(): ServiceStatusPayload {
  const hasAnalysis =
    Boolean(process.env.GROQ_API_KEY?.trim()) ||
    Boolean(process.env.GEMINI_API_KEY?.trim());
  const hasYoutube =
    Boolean(process.env.RAPIDAPI_KEY?.trim()) &&
    Boolean(process.env.RAPIDAPI_HOST?.trim());

  return {
    status: hasAnalysis ? "operational" : "degraded",
    beta: true,
    services: {
      analysis: hasAnalysis,
      youtube: hasYoutube,
    },
  };
}
