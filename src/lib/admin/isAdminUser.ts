import type { User } from "@supabase/supabase-js";
import { ADMIN_EMAILS, isAdminEmail } from "@/lib/admin/adminEmails";

export { ADMIN_EMAILS };

/**
 * Whether the signed-in user may access admin routes and admin APIs.
 * Only emails in ADMIN_EMAILS are allowed.
 */
export async function isAdminUser(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;
  return isAdminEmail(user.email);
}
