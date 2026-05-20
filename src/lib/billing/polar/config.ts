export type PolarServerMode = "sandbox" | "production";

export function getPolarAccessToken(): string | null {
  return process.env.POLAR_ACCESS_TOKEN?.trim() || null;
}

export function getPolarWebhookSecret(): string | null {
  return process.env.POLAR_WEBHOOK_SECRET?.trim() || null;
}

export function getPolarServerMode(): PolarServerMode {
  const raw = process.env.POLAR_MODE?.trim().toLowerCase();
  if (raw === "sandbox") return "sandbox";
  return "production";
}

export function getPolarApiBaseUrl(): string {
  return getPolarServerMode() === "sandbox"
    ? "https://sandbox-api.polar.sh"
    : "https://api.polar.sh";
}

export function isPolarConfigured(): boolean {
  return Boolean(getPolarAccessToken());
}
