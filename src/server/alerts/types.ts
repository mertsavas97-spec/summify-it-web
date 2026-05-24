export type AlertSeverity = "info" | "warning" | "critical";

export type AlertChannel = "slack" | "pushover";

export type AlertStatus = "fired" | "suppressed" | "resolved";

export type AlertSignalKey =
  | "podcast_generation_failures"
  | "audio_study_failures"
  | "rapidapi_failure_spike"
  | "groq_failure_spike"
  | "aws_polly_failure_spike"
  | "unusually_high_request_volume"
  | "unusually_high_traffic_spike"
  | "unusually_high_estimated_api_cost"
  | "no_analyses_long_time"
  | "deployment_health_failure";

export type AlertContext = {
  provider?: string;
  operation?: string;
  timeframe?: string;
  threshold?: number;
  observed?: number;
  details?: string;
  url?: string;
};

export type AlertCandidate = {
  key: AlertSignalKey;
  title: string;
  severity: AlertSeverity;
  summary: string;
  context?: AlertContext;
  slackEmoji: string;
  pushoverTitle: string;
};

export type AlertDispatchResult = {
  status: AlertStatus;
  channels: AlertChannel[];
  reason?: string;
};

