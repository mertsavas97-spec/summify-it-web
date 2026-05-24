import { getAlertCooldownMinutes } from "./config";
import type { AlertCandidate, AlertSignalKey } from "./types";
import { sendPushoverAlert, sendSlackAlert } from "./notifiers";

type UsageSnapshot = {
  provider: string;
  callsToday: number;
  calls7d: number;
  failures7d: number;
  estimatedMonthlyCostUsd: number | null;
  lastSuccess?: string | null;
  lastError?: string | null;
};

type AlertState = Map<AlertSignalKey, number>;

const inMemoryAlertState: AlertState = new Map();

function shouldSuppress(key: AlertSignalKey): boolean {
  const cooldownMs = getAlertCooldownMinutes() * 60 * 1000;
  const last = inMemoryAlertState.get(key);
  return typeof last === "number" && Date.now() - last < cooldownMs;
}

function markFired(key: AlertSignalKey): void {
  inMemoryAlertState.set(key, Date.now());
}

function percent(numerator: number, denominator: number): number {
  return denominator <= 0 ? 0 : (numerator / denominator) * 100;
}

function buildCandidates(snapshot: {
  usage: UsageSnapshot[];
  recentAnalysesAt: string | null;
  deploymentHealthy: boolean;
}): AlertCandidate[] {
  const candidates: AlertCandidate[] = [];

  const rapid = snapshot.usage.find((row) => row.provider === "rapidapi");
  const groq = snapshot.usage.find((row) => row.provider === "groq");
  const polly = snapshot.usage.find((row) => row.provider === "aws_polly");
  const podcastFailures = snapshot.usage.find((row) => row.provider === "groq");
  const totalCalls7d = snapshot.usage.reduce((sum, row) => sum + row.calls7d, 0);
  const totalCost = snapshot.usage.reduce((sum, row) => sum + (row.estimatedMonthlyCostUsd ?? 0), 0);

  if ((podcastFailures?.failures7d ?? 0) >= 5) {
    candidates.push({
      key: "podcast_generation_failures",
      title: "Podcast generation failures are elevated",
      severity: "critical",
      summary: "Podcast generation failures crossed the alert threshold.",
      slackEmoji: "🎙️",
      pushoverTitle: "Podcast failures",
      context: { provider: "Groq", operation: "podcast generation", observed: podcastFailures?.failures7d, threshold: 5, timeframe: "7d" },
    });
  }

  if ((polly?.failures7d ?? 0) >= 5) {
    candidates.push({
      key: "audio_study_failures",
      title: "Audio study failures are elevated",
      severity: "critical",
      summary: "Audio study failures crossed the alert threshold.",
      slackEmoji: "🎧",
      pushoverTitle: "Audio study failures",
      context: { provider: "AWS Polly", operation: "audio study", observed: polly?.failures7d, threshold: 5, timeframe: "7d" },
    });
  }

  if ((rapid?.failures7d ?? 0) >= 10 || percent(rapid?.failures7d ?? 0, rapid?.calls7d ?? 0) >= 25) {
    candidates.push({ key: "rapidapi_failure_spike", title: "RapidAPI failure spike", severity: "warning", summary: "RapidAPI failure ratio is unusually high.", slackEmoji: "🛰️", pushoverTitle: "RapidAPI spike", context: { provider: "RapidAPI", observed: rapid?.failures7d, threshold: 10, timeframe: "7d" } });
  }

  if ((groq?.failures7d ?? 0) >= 10 || percent(groq?.failures7d ?? 0, groq?.calls7d ?? 0) >= 20) {
    candidates.push({ key: "groq_failure_spike", title: "Groq failure spike", severity: "warning", summary: "Groq failure ratio is unusually high.", slackEmoji: "🧠", pushoverTitle: "Groq spike", context: { provider: "Groq", observed: groq?.failures7d, threshold: 10, timeframe: "7d" } });
  }

  if ((polly?.failures7d ?? 0) >= 10 || percent(polly?.failures7d ?? 0, polly?.calls7d ?? 0) >= 20) {
    candidates.push({ key: "aws_polly_failure_spike", title: "AWS Polly failure spike", severity: "warning", summary: "AWS Polly failure ratio is unusually high.", slackEmoji: "🗣️", pushoverTitle: "Polly spike", context: { provider: "AWS Polly", observed: polly?.failures7d, threshold: 10, timeframe: "7d" } });
  }

  if (totalCalls7d >= 500) {
    candidates.push({ key: "unusually_high_request_volume", title: "Request volume is unusually high", severity: "info", summary: "Total request volume crossed the expected baseline.", slackEmoji: "📈", pushoverTitle: "High request volume", context: { observed: totalCalls7d, threshold: 500, timeframe: "7d" } });
  }

  if (rapid && rapid.calls7d >= 250) {
    candidates.push({ key: "unusually_high_traffic_spike", title: "Traffic spike detected", severity: "warning", summary: "Traffic against RapidAPI surged above baseline.", slackEmoji: "⚡", pushoverTitle: "Traffic spike", context: { provider: "RapidAPI", observed: rapid.calls7d, threshold: 250, timeframe: "7d" } });
  }

  if (totalCost >= 50) {
    candidates.push({ key: "unusually_high_estimated_api_cost", title: "Estimated API cost is unusually high", severity: "warning", summary: "Estimated monthly API cost crossed the budget threshold.", slackEmoji: "💸", pushoverTitle: "Cost spike", context: { observed: Number(totalCost.toFixed(2)), threshold: 50, timeframe: "7d" } });
  }

  if (!snapshot.recentAnalysesAt) {
    candidates.push({ key: "no_analyses_long_time", title: "No analyses in a long time", severity: "info", summary: "No analyses have completed recently.", slackEmoji: "🕒", pushoverTitle: "Analysis inactivity", context: { threshold: 24, timeframe: "24h" } });
  }

  if (!snapshot.deploymentHealthy) {
    candidates.push({ key: "deployment_health_failure", title: "Deployment health check failed", severity: "critical", summary: "Deployment health checks indicate the app may be unhealthy.", slackEmoji: "🚨", pushoverTitle: "Deployment health", context: { details: "Check provider config, env vars, and Vercel deployment status." } });
  }

  return candidates;
}

export async function evaluateAndDispatchAlerts(input: {
  usage: UsageSnapshot[];
  recentAnalysesAt: string | null;
  deploymentHealthy: boolean;
}): Promise<{ candidates: number; dispatched: number; suppressed: number }> {
  const candidates = buildCandidates(input);
  let dispatched = 0;
  let suppressed = 0;

  for (const alert of candidates) {
    if (shouldSuppress(alert.key)) {
      suppressed += 1;
      continue;
    }

    const slackOk = await sendSlackAlert(alert);
    const pushoverOk = alert.severity === "critical" ? await sendPushoverAlert(alert) : true;
    if (slackOk || pushoverOk) {
      markFired(alert.key);
      dispatched += 1;
    }
  }

  return { candidates: candidates.length, dispatched, suppressed };
}
