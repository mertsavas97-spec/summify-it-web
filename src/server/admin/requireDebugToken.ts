/**
 * Shared guard for ADMIN_DEBUG_TOKEN protected routes.
 */

export function isAdminDebugAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_DEBUG_TOKEN?.trim();
  if (!expected) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;

  const header = request.headers.get("x-admin-debug-token");
  return header === expected;
}
