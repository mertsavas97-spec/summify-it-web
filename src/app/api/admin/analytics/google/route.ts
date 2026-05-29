import { NextResponse } from "next/server";
import { requireAdminSession, AdminUnauthorizedError } from "@/lib/admin/requireAdmin";
import { runGaReport } from "@/server/googleAnalytics/dataApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DateFilterPreset = "today" | "7d" | "30d" | "90d" | "custom";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveDateRange(params: URLSearchParams): { startDate: string; endDate: string } {
  const preset = (params.get("preset") ?? "7d") as DateFilterPreset;
  const now = new Date();
  const endDate = isoDate(now);

  if (preset === "today") {
    return { startDate: endDate, endDate };
  }

  if (preset === "custom") {
    const start = params.get("startDate");
    const end = params.get("endDate");
    if (!start || !end) throw new Error("Custom date range requires startDate and endDate");
    return { startDate: start, endDate: end };
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const startDateObj = new Date(now);
  startDateObj.setDate(startDateObj.getDate() - (days - 1));
  return { startDate: isoDate(startDateObj), endDate };
}

function getMetricValue(
  report: Awaited<ReturnType<typeof runGaReport>>,
  metricIndex = 0,
): number {
  const value = report.rows?.[0]?.metricValues?.[metricIndex]?.value;
  return value ? Number(value) : 0;
}

function mapDimensionRows(report: Awaited<ReturnType<typeof runGaReport>>) {
  return (
    report.rows ?? []
  ).map((row) => ({
    key: row.dimensionValues?.[0]?.value ?? "",
    value: Number(row.metricValues?.[0]?.value ?? 0),
  }));
}

function mapDimensionRows2(report: Awaited<ReturnType<typeof runGaReport>>) {
  return (report.rows ?? []).map((row) => ({
    key: row.dimensionValues?.[0]?.value ?? "",
    value1: Number(row.metricValues?.[0]?.value ?? 0),
    value2: Number(row.metricValues?.[1]?.value ?? 0),
  }));
}

function mapDailyRows(report: Awaited<ReturnType<typeof runGaReport>>) {
  return (report.rows ?? []).map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? "",
    value: Number(row.metricValues?.[0]?.value ?? 0),
  }));
}

/**
 * GET /api/admin/analytics/google
 * Returns simplified GA4 metrics for the admin dashboard.
 */
export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    throw e;
  }

  const url = new URL(request.url);
  const dateRange = resolveDateRange(url.searchParams);

  try {
    const [
      visitors,
      visits,
      pageViews,
      homepageVisits,
      topPages,
      trafficSources,
      devices,
      countries,
      uploadVisits,
      pricingVisits,
      loginVisits,
      dailyUsers,
      dailySessions,
      dailyPageViews,
    ] = await Promise.all([
      runGaReport({ dateRange, metrics: ["totalUsers"] }),
      runGaReport({ dateRange, metrics: ["sessions"] }),
      runGaReport({ dateRange, metrics: ["screenPageViews"] }),
      runGaReport({
        dateRange,
        metrics: ["sessions"],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "EXACT", value: "/" },
          },
        },
      }),
      runGaReport({
        dateRange,
        metrics: ["screenPageViews", "totalUsers"],
        dimensions: ["pagePath"],
        limit: 10,
      }),
      runGaReport({
        dateRange,
        metrics: ["totalUsers", "sessions"],
        dimensions: ["sessionSource"],
        limit: 10,
      }),
      runGaReport({
        dateRange,
        metrics: ["totalUsers"],
        dimensions: ["deviceCategory"],
        limit: 10,
      }),
      runGaReport({
        dateRange,
        metrics: ["totalUsers"],
        dimensions: ["country"],
        limit: 10,
      }),
      runGaReport({
        dateRange,
        metrics: ["sessions"],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "PARTIAL_REGEXP", value: "^/upload" },
          },
        },
      }),
      runGaReport({
        dateRange,
        metrics: ["sessions"],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "PARTIAL_REGEXP", value: "^/pricing" },
          },
        },
      }),
      runGaReport({
        dateRange,
        metrics: ["sessions"],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "PARTIAL_REGEXP", value: "^/login" },
          },
        },
      }),
      runGaReport({ dateRange, metrics: ["totalUsers"], dimensions: ["date"] }),
      runGaReport({ dateRange, metrics: ["sessions"], dimensions: ["date"] }),
      runGaReport({ dateRange, metrics: ["screenPageViews"], dimensions: ["date"] }),
    ]);

    return NextResponse.json({
      connected: true,
      dateRange,
      metrics: {
        uniqueVisitors: getMetricValue(visitors),
        visits: getMetricValue(visits),
        pageViews: getMetricValue(pageViews),
        homepageVisits: getMetricValue(homepageVisits),
        uploadVisits: getMetricValue(uploadVisits),
        pricingVisits: getMetricValue(pricingVisits),
        loginVisits: getMetricValue(loginVisits),
      },
      timeseries: {
        peopleByDay: mapDailyRows(dailyUsers),
        sessionsByDay: mapDailyRows(dailySessions),
        pageOpensByDay: mapDailyRows(dailyPageViews),
      },
      breakdowns: {
        topPages: mapDimensionRows2(topPages),
        trafficSources: mapDimensionRows2(trafficSources),
        devices: mapDimensionRows(devices),
        countries: mapDimensionRows(countries),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("not connected")) {
      return NextResponse.json({ connected: false, error: "not_connected" }, { status: 200 });
    }
    if (message.includes("GA4_PROPERTY_ID")) {
      return NextResponse.json({ connected: false, error: "missing_property_id" }, { status: 503 });
    }
    return NextResponse.json({ error: "ga_error", message }, { status: 500 });
  }
}
