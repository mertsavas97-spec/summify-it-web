"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ActivityEvent, ActivityResponse } from "@/app/api/admin/analytics/activity/route";

// Event label translations
const EVENT_LABELS: Record<string, string> = {
  landing_view: "Visitor opened landing page",
  upload_page_view: "Visitor opened upload workspace",
  upload_started: "Upload started",
  upload_completed: "Upload completed",
  analysis_started: "Analysis started",
  analysis_completed: "Analysis completed",
  learn_card_opened: "Learn card opened",
  insight_opened: "Insight viewed",
  audio_mode_clicked: "Audio lesson clicked",
  podcast_clicked: "Podcast clicked",
  pricing_view: "Pricing page viewed",
  login_view: "Login page viewed",
  signup_started: "Signup started",
  signup_completed: "Signup completed",
  checkout_started: "Checkout started",
  subscription_created: "New subscription created",
};

// Event categories for styling
type EventCategory = "acquisition" | "product" | "engagement" | "conversion";

const EVENT_CATEGORIES: Record<string, EventCategory> = {
  // Acquisition
  landing_view: "acquisition",
  upload_page_view: "acquisition",
  pricing_view: "acquisition",
  login_view: "acquisition",

  // Product
  upload_started: "product",
  upload_completed: "product",
  analysis_started: "product",
  analysis_completed: "product",

  // Engagement
  learn_card_opened: "engagement",
  insight_opened: "engagement",
  audio_mode_clicked: "engagement",
  podcast_clicked: "engagement",

  // Conversion
  signup_started: "conversion",
  signup_completed: "conversion",
  checkout_started: "conversion",
  subscription_created: "conversion",
};

const CATEGORY_COLORS: Record<EventCategory, { bg: string; border: string; dot: string }> = {
  acquisition: {
    bg: "bg-blue-950/30",
    border: "border-blue-500/20",
    dot: "bg-blue-500/80",
  },
  product: {
    bg: "bg-purple-950/30",
    border: "border-purple-500/20",
    dot: "bg-purple-500/80",
  },
  engagement: {
    bg: "bg-emerald-950/30",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500/80",
  },
  conversion: {
    bg: "bg-rose-950/30",
    border: "border-rose-500/20",
    dot: "bg-rose-500/80",
  },
};

function getEventLabel(eventName: string): string {
  return EVENT_LABELS[eventName] || eventName;
}

function getEventCategory(eventName: string): EventCategory {
  return EVENT_CATEGORIES[eventName] || "product";
}

function formatRelativeTime(isoString: string): string {
  try {
    const created = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return "just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    // Format as date if older than a week
    return created.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function formatSessionId(sessionId: string | null): string {
  if (!sessionId) return "Anonymous";
  return `Session ${sessionId.slice(0, 6)}`;
}

interface LiveActivityFeedProps {
  maxVisible?: number;
}

export function LiveActivityFeed({ maxVisible = 10 }: LiveActivityFeedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/analytics/activity", {
          credentials: "include",
          cache: "no-store",
        });

        const json = (await res.json()) as ActivityResponse;

        if (cancelled) return;

        if (!json.available) {
          setError(json.message || "Failed to load activity feed");
          return;
        }

        setEvents(json.events || []);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load activity feed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleEvents = events.slice(0, maxVisible);
  const hasMore = events.length > maxVisible;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Live Activity</h2>
          <p className="mt-1 text-xs text-zinc-500">Recent product events from Summify users.</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-950/20 p-3">
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      )}

      {loading && !error && (
        <div className="mt-4">
          <p className="text-xs text-zinc-400">Loading activity feed…</p>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="mt-4 rounded-lg border border-white/[0.08] bg-zinc-950/30 p-4">
          <p className="text-xs text-zinc-400">No product activity recorded yet.</p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="mt-4 space-y-2">
          {visibleEvents.map((event) => {
            const category = getEventCategory(event.event_name);
            const colors = CATEGORY_COLORS[category];
            const label = getEventLabel(event.event_name);
            const relativeTime = formatRelativeTime(event.created_at);
            const sessionLabel = formatSessionId(event.session_id);

            return (
              <div
                key={event.id}
                className={`flex items-start gap-3 rounded-lg border ${colors.border} ${colors.bg} p-3 transition-colors hover:bg-white/[0.04]`}
              >
                {/* Dot indicator */}
                <div className="mt-1 flex-shrink-0">
                  <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white">{label}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-zinc-500">{sessionLabel}</span>
                    <span className="text-[11px] text-zinc-600">·</span>
                    <span className="text-[11px] text-zinc-500">{relativeTime}</span>
                  </div>

                  {/* Metadata summary */}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(event.metadata).slice(0, 2).map(([key, value]) => {
                        if (!value || (typeof value === "object" && Object.keys(value).length === 0)) return null;
                        const displayValue =
                          typeof value === "object" ? JSON.stringify(value).slice(0, 30) : String(value).slice(0, 40);
                        return (
                          <p key={key} className="text-[10px] text-zinc-600">
                            <span className="text-zinc-500">{key}:</span> {displayValue}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && hasMore && (
        <div className="mt-4 text-center">
          <Link
            href="/dashboard/admin/analytics#activity-all"
            className="text-xs font-medium text-violet-400 hover:text-violet-300"
          >
            View all {events.length} recent activities →
          </Link>
        </div>
      )}
    </div>
  );
}
