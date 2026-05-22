/** Central admin email allowlist — single source of truth for admin access. */
export const ADMIN_EMAILS = ["mertsavas97@gmail.com"] as const;

const ADMIN_EMAIL_SET = new Set(
  ADMIN_EMAILS.map((e) => e.trim().toLowerCase()),
);

export function normalizeAdminEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || null;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeAdminEmail(email);
  return normalized != null && ADMIN_EMAIL_SET.has(normalized);
}
