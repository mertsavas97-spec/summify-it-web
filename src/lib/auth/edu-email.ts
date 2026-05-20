/** True when the address is a U.S. academic domain (ends with `.edu`). */
export function isEduEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(".edu");
}
