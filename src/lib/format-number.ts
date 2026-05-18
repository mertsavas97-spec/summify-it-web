/**
 * Deterministic number formatting for SSR/client hydration (always en-US).
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
