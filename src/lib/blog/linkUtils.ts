export function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("/")) return trimmed.length > 1;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
