/** True when the address looks like a school/academic email (.edu / .edu.xx / .ac.uk). */
export function isEduEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 0) return false;
  const domain = normalized.slice(at + 1);
  if (!domain || domain.includes(" ")) return false;

  return (
    domain === "edu" ||
    domain.endsWith(".edu") ||
    /\.edu\.[a-z]{2,}$/i.test(domain) ||
    domain.endsWith(".ac.uk")
  );
}
