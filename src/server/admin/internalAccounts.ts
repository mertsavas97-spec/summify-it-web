export const INTERNAL_ACCOUNT_EMAILS = [
  "mertsavas97@gmail.com",
  "mert@075collective.com",
  "mert.savas@college.com.tr",
] as const;

export function normalizeAccountEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

const INTERNAL_ACCOUNT_EMAIL_SET = new Set(
  INTERNAL_ACCOUNT_EMAILS.map((email) => normalizeAccountEmail(email)),
);

export function isInternalAccountEmail(email: string | null | undefined): boolean {
  const normalizedEmail = normalizeAccountEmail(email);
  return normalizedEmail.length > 0 && INTERNAL_ACCOUNT_EMAIL_SET.has(normalizedEmail);
}
