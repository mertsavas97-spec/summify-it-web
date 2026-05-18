/**
 * SERVER ONLY — gate verbose logs to development.
 */

export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function devLog(message: string, meta?: Record<string, unknown>): void {
  if (!isDevEnvironment()) return;
  if (meta) console.info(message, meta);
  else console.info(message);
}

export function devWarn(message: string, meta?: Record<string, unknown>): void {
  if (!isDevEnvironment()) return;
  if (meta) console.warn(message, meta);
  else console.warn(message);
}

export function devError(message: string, meta?: Record<string, unknown>): void {
  if (!isDevEnvironment()) return;
  if (meta) console.error(message, meta);
  else console.error(message);
}

/** Production-safe unexpected error — no stack or response bodies. */
export function logServerError(scope: string): void {
  if (isDevEnvironment()) return;
  console.error(`[${scope}] unexpected_error`);
}
