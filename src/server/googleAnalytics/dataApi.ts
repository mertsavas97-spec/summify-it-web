import "server-only";

import { google } from "googleapis";
import type { analyticsdata_v1beta } from "googleapis";
import { createGoogleOAuthClient } from "@/server/googleAnalytics/oauth";
import { getAdminOAuthToken } from "@/server/admin/oauthTokens";

export type GaDateRange = { startDate: string; endDate: string };

export function requireGaPropertyId(): string {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  if (!propertyId) throw new Error("GA4_PROPERTY_ID is not configured");
  return propertyId;
}

export async function createGaDataClient(): Promise<analyticsdata_v1beta.Analyticsdata> {
  const tokenRow = await getAdminOAuthToken("google_analytics");
  if (!tokenRow?.refresh_token) {
    throw new Error("Google Analytics is not connected");
  }

  const oauth2 = createGoogleOAuthClient();
  oauth2.setCredentials({ refresh_token: tokenRow.refresh_token });

  return google.analyticsdata({ version: "v1beta", auth: oauth2 });
}

export async function runGaReport(input: {
  dateRange: GaDateRange;
  metrics: string[];
  dimensions?: string[];
  limit?: number;
  dimensionFilter?: analyticsdata_v1beta.Schema$FilterExpression;
}): Promise<analyticsdata_v1beta.Schema$RunReportResponse> {
  const propertyId = requireGaPropertyId();
  const client = await createGaDataClient();

  const res = await client.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [input.dateRange],
      metrics: input.metrics.map((name) => ({ name })),
      dimensions: (input.dimensions ?? []).map((name) => ({ name })),
      limit: typeof input.limit === "number" ? String(input.limit) : undefined,
      dimensionFilter: input.dimensionFilter,
    },
  } as unknown as analyticsdata_v1beta.Params$Resource$Properties$Runreport);

  return res.data;
}
