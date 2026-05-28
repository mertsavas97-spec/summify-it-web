import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/requireAdmin";
import { notificationProviders } from "@/server/notifications/providers";

function getEnvLabel(): string | null {
  const raw =
    process.env.VERCEL_ENV ??
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.NODE_ENV ??
    null;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed ? trimmed : null;
}

function buildTestPayload(params: {
  triggeredByEmail: string | null;
}): { title: string; body: string; metadata: Record<string, string> } {
  const timestamp = new Date().toISOString();
  const env = getEnvLabel();
  return {
    title: "Summify notification test",
    body: "Test notification from Summify admin dashboard.",
    metadata: {
      ...(env ? { environment: env } : {}),
      timestamp,
      ...(params.triggeredByEmail ? { triggeredBy: params.triggeredByEmail } : {}),
    },
  };
}

type ProviderTestResult = {
  provider: string;
  configured: boolean;
  ok: boolean;
  errorCode: string | null;
};

/**
 * POST /api/admin/notifications/test
 *
 * Admin-only endpoint that sends a test notification to Slack + Pushover.
 * Never returns secret values.
 */
export async function POST() {
  let adminEmail: string | null = null;
  try {
    const user = await requireAdminSession();
    adminEmail = user.email ?? null;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payloadBase = buildTestPayload({ triggeredByEmail: adminEmail });

  const results: ProviderTestResult[] = await Promise.all(
    notificationProviders.map(async (provider) => {
      const configured = provider.isConfigured();
      if (!configured) {
        return {
          provider: provider.id,
          configured: false,
          ok: false,
          errorCode: "not_configured",
        };
      }

      try {
        const ok = await provider.sendTestNotification({
          ...payloadBase,
          metadata: {
            ...payloadBase.metadata,
            provider: provider.id,
          },
        });

        return {
          provider: provider.id,
          configured: true,
          ok,
          errorCode: ok ? null : "send_failed",
        };
      } catch {
        return {
          provider: provider.id,
          configured: true,
          ok: false,
          errorCode: "exception",
        };
      }
    }),
  );

  const configuredCount = results.filter((r) => r.configured).length;
  const anyOk = results.some((r) => r.ok);
  const ok = configuredCount === 0 ? false : anyOk;

  // Only fail the whole endpoint if there are configured providers and ALL of them fail.
  const status = configuredCount > 0 && !anyOk ? 500 : 200;

  return NextResponse.json({ ok, results }, { status });
}
