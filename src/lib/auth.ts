import type { Session, User } from "@supabase/supabase-js";
import { createClientIfConfigured } from "@/lib/supabase/server";

export type { Profile, UserLimits } from "@/types/database";
export {
  ensureProfileForUser,
  formatPlanLabel,
  getProfile,
  getUserLimits,
} from "@/lib/supabase/profile";

export async function getOptionalSession(): Promise<Session | null> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Alias for route handlers that expect an explicit "current user" helper. */
export const getCurrentUser = getOptionalUser;
