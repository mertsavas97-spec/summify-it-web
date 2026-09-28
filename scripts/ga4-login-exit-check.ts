/**
 * GA4 madde-17 doğrulaması: /login sayfası olayları gerçek GA4 verisinden okunur.
 * Kullanılan kimlikler: .env.local (GA4_PROPERTY_ID, GOOGLE_CLIENT_*) + Supabase
 * admin_oauth_tokens (google_analytics refresh_token). Hiçbiri uydurulmadı.
 *
 * Çalıştırma: npx tsx scripts/ga4-login-exit-check.ts
 */
import { createClient } from "@supabase/supabase-js";
// Node 20'de native WebSocket yok; googleapis bunu ister. ws paketi --no-save
// ile kuruldu (package.json değişmedi).
import { WebSocket } from "ws";

(globalThis as Record<string, unknown>).WebSocket = WebSocket;

type GApi = typeof import("googleapis").google;
type RunReportResponse = import("googleapis").analyticsdata_v1beta.Schema$RunReportResponse;
type RunReportRequest = import("googleapis").analyticsdata_v1beta.Schema$RunReportRequest;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const PROPERTY_ID = process.env.GA4_PROPERTY_ID ?? "";
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY || !PROPERTY_ID || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Eksik env: SUPABASE_URL / SERVICE_KEY / GA4_PROPERTY_ID / GOOGLE_CLIENT_*");
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("admin_oauth_tokens")
    .select("refresh_token")
    .eq("provider", "google_analytics")
    .single();
  if (error || !data?.refresh_token) throw new Error(`refresh_token okunamadı: ${error?.message}`);

  // Dynamic import: WebSocket polyfill'i yukarıda kurulduktan sonra yüklensin.
  const ns = (await import("googleapis")) as { google?: GApi; default?: { google?: GApi } };
  const google = ns.google ?? ns.default?.google;
  if (!google) {
    throw new Error(`googleapis namespace okunamadı: ${Object.keys(ns).slice(0, 8).join(",")}`);
  }
  const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: data.refresh_token });
  const client = google.analyticsdata({ version: "v1beta", auth: oauth2 });

  const run = async (requestBody: RunReportRequest): Promise<RunReportResponse> => {
    const res = (await client.properties.runReport({
      property: `properties/${PROPERTY_ID}`,
      requestBody,
    } as unknown as Parameters<typeof client.properties.runReport>[0])) as unknown as {
      data: RunReportResponse;
    };
    return res.data;
  };

  const last30 = (() => {
    const end = new Date();
    const start = new Date(Date.now() - 30 * 86400_000);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    return { startDate: iso(start), endDate: iso(end) };
  })();

  const print = (label: string, report: RunReportResponse) => {
    console.log(`\n=== ${label} ===`);
    if (report.dimensionHeaders) {
      console.log("dims:", report.dimensionHeaders.map((h) => h.name).join(" | "));
    }
    if (report.metricHeaders) {
      console.log("metrics:", report.metricHeaders.map((h) => h.name).join(" | "));
    }
    for (const row of report.rows ?? []) {
      console.log(
        " ",
        (row.dimensionValues ?? []).map((v) => v.value).join(" | "),
        "=>",
        (row.metricValues ?? []).map((v) => v.value).join(" | "),
      );
    }
    if (!report.rows?.length) console.log("  (satır yok)");
  };

  // 1) /login sayfasında hangi event'ler var?
  print(
    "Soru 1: /login sayfasındaki event adetleri (son 30 gün)",
    await run({
      dateRanges: [last30],
      dimensions: [{ name: "pagePath" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            { filter: { fieldName: "pagePath", stringFilter: { matchType: "CONTAINS", value: "/login" } } },
            { notExpression: { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "(not set)" } } } },
          ],
        },
      },
      limit: "50",
    }),
  );

  // 2) /login'e gelen session sayısı vs page_view (SPA mı, ayrı oturum mu)
  print(
    "Soru 2: /login page_view vs signup event karşılaştırması (son 30 gün)",
    await run({
      dateRanges: [last30],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }, { name: "sessions" }],
      dimensionFilter: {
        filter: { fieldName: "eventName", inListFilter: { values: ["page_view", "signup_started", "signup_completed", "session_start"] } },
      },
      limit: "20",
    }),
  );

  // 3) chatgpt.com kaynaklı oturumlar (madde 16 için hazır veri)
  print(
    "Soru 3: chatgpt.com kaynaklı oturumlar var mı (son 30 gün)",
    await run({
      dateRanges: [last30],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: {
        orGroup: {
          expressions: [
            { filter: { fieldName: "sessionSource", stringFilter: { matchType: "CONTAINS", value: "chatgpt" } } },
            { filter: { fieldName: "sessionSource", stringFilter: { matchType: "CONTAINS", value: "assistant" } } },
            { filter: { fieldName: "sessionSource", stringFilter: { matchType: "CONTAINS", value: "perplexity" } } },
            { filter: { fieldName: "sessionSource", stringFilter: { matchType: "CONTAINS", value: "gemini" } } },
          ],
        },
      },
      limit: "20",
    }),
  );
}

main().catch((err) => {
  console.error("HATA:", err?.stack ?? err);
  process.exit(1);
});
