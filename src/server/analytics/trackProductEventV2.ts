import { createClientIfConfigured } from "@/lib/supabase/server";
import { getSupabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";
import type { ProductEventName } from "@/lib/analytics/productEvents";
import { devLog, devWarn } from "@/server/logging";
import { shouldTrackAnalytics } from "@/lib/analytics/shouldTrackAnalytics";

export type ProductEventV2Metadata = Record<string, unknown>;

export type TrackProductEventV2Input = {
  userId?: string | null;
  userEmail?: string | null;
  isAdmin?: boolean;
  sessionId: string;
  eventName: ProductEventName;
  eventValue?: string | null;
  metadata?: ProductEventV2Metadata | null;
  /** When true, inserts with service role (recommended for API route handlers). */
  insertViaServiceRole?: boolean;
};

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Inserts into `public.product_events`. Never throws.
 * Skips inserting for admin/internal users.
 *
 * Notes:
 * - `sessionId` is required (even for logged-in users) to support visitor-level funnels.
 * - Keep metadata small & privacy-safe.
 */
export async function trackProductEventV2(input: TrackProductEventV2Input): Promise<void> {
  try {
    if (!input.sessionId?.trim()) return;

    // Skip tracking for admin/internal users
    if (!shouldTrackAnalytics({ userEmail: input.userEmail, isAdmin: input.isAdmin })) {
      return;
    }

    const payload = {
      user_id: input.userId ?? null,
      session_id: input.sessionId.trim(),
      event_name: input.eventName,
      event_value: input.eventValue ?? null,
      metadata: input.metadata ?? null,
    };

    if (input.insertViaServiceRole && isServiceRoleConfigured()) {
      const admin = getSupabaseAdmin();
      const { error } = await admin.from("product_events").insert(payload);
      if (error) {
        devWarn("[summify.product_events] insert_failed", { message: error.message, event: input.eventName });
        return;
      }
      if (isDevelopment()) devLog("[summify.product_events] inserted", { via: "service_role", event: input.eventName });
      return;
    }

    const supabase = await createClientIfConfigured();
    if (!supabase) return;
    const { error } = await supabase.from("product_events").insert(payload);
    if (error) {
      devWarn("[summify.product_events] insert_failed", { message: error.message, event: input.eventName });
      return;
    }
    if (isDevelopment()) devLog("[summify.product_events] inserted", { via: "user_client", event: input.eventName });
  } catch (err) {
    devWarn("[summify.product_events] insert_failed", {
      message: err instanceof Error ? err.message : String(err),
      event: input.eventName,
    });
  }
}
