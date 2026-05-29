import "server-only";

import crypto from "crypto";
import { OAuth2Client } from "googleapis-common";
import { getAppOrigin } from "@/lib/app-origin";

export const GA_OAUTH_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export type GoogleOAuthEnv = {
  clientId: string;
  clientSecret: string;
};

export function requireGoogleOAuthEnv(): GoogleOAuthEnv {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not configured");
  if (!clientSecret) throw new Error("GOOGLE_CLIENT_SECRET is not configured");

  return { clientId, clientSecret };
}

export function getGoogleOAuthRedirectUri(): string {
  const origin = getAppOrigin();
  return `${origin}/api/admin/google-analytics/callback`;
}

export function createGoogleOAuthClient(): OAuth2Client {
  const { clientId, clientSecret } = requireGoogleOAuthEnv();
  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri: getGoogleOAuthRedirectUri(),
  });
}

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}
