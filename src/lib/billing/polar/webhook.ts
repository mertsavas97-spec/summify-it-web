import { Webhook } from "standardwebhooks";
import { getPolarWebhookSecret } from "@/lib/billing/polar/config";

export type PolarWebhookPayload = {
  type: string;
  data: Record<string, unknown>;
};

function getWebhookVerifier(secret: string): Webhook {
  const base64Secret = Buffer.from(secret.trim(), "utf-8").toString("base64");
  return new Webhook(base64Secret);
}

/** Verify Standard Webhooks signature and parse Polar event payload. */
export function verifyPolarWebhook(
  rawBody: string,
  headers: Headers,
): PolarWebhookPayload {
  const secret = getPolarWebhookSecret();
  if (!secret) {
    throw new Error("Polar webhook secret is not configured.");
  }

  const headerRecord: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerRecord[key] = value;
  });

  const verifier = getWebhookVerifier(secret);
  const payload = verifier.verify(rawBody, headerRecord) as PolarWebhookPayload;

  if (!payload?.type || !payload?.data) {
    throw new Error("Invalid Polar webhook payload.");
  }

  return payload;
}
