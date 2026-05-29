/**
 * Determines if analytics should be tracked for a user and pathname.
 * Excludes admin/internal activity from analytics.
 */

const INTERNAL_EMAILS = new Set([
  "mertsavas97@gmail.com",
  "mert@075collective.com",
  "mert.savas@college.com.tr",
  "hello@summify.app",
]);

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export interface ShouldTrackAnalyticsInput {
  /** Current pathname (e.g., from usePathname() or request.nextUrl.pathname) */
  pathname?: string | null;
  /** Authenticated user email */
  userEmail?: string | null;
  /** Whether user has admin role */
  isAdmin?: boolean;
}

/**
 * Check if we should track analytics for this user/route.
 * Returns false if the user is internal/admin or accessing admin routes.
 * Returns true for all other normal users (guest, free, paid).
 */
export function shouldTrackAnalytics({
  pathname,
  userEmail,
  isAdmin,
}: ShouldTrackAnalyticsInput): boolean {
  // Check if internal email
  if (userEmail) {
    const normalizedEmail = userEmail.toLowerCase().trim();
    if (INTERNAL_EMAILS.has(normalizedEmail)) {
      if (isDevelopment()) {
        console.log("[Analytics] Skipped: internal email", {
          email: normalizedEmail.slice(0, 3) + "***",
        });
      }
      return false;
    }
  }

  // Check if user is admin
  if (isAdmin) {
    if (isDevelopment()) {
      console.log("[Analytics] Skipped: admin user");
    }
    return false;
  }

  // Check if accessing admin route
  if (pathname) {
    const normalizedPath = pathname.toLowerCase();

    // Check /dashboard/admin and its subroutes
    if (
      normalizedPath === "/dashboard/admin" ||
      normalizedPath.startsWith("/dashboard/admin/")
    ) {
      if (isDevelopment()) {
        console.log("[Analytics] Skipped: admin route", { path: pathname });
      }
      return false;
    }

    // Check if /account and user is admin (but we check this via isAdmin flag)
    // Note: /account itself is fine for users to track, only exclude if admin
    if (normalizedPath === "/account" && isAdmin) {
      if (isDevelopment()) {
        console.log("[Analytics] Skipped: admin accessing account", {
          path: pathname,
        });
      }
      return false;
    }
  }

  return true;
}
