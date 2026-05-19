const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(dateKey: string, days: number): string {
  return new Date(`${dateKey}T00:00:00.000Z`).getTime() + days * MS_PER_DAY > 0
    ? new Date(new Date(`${dateKey}T00:00:00.000Z`).getTime() + days * MS_PER_DAY)
        .toISOString()
        .slice(0, 10)
    : dateKey;
}

export function daysBetweenUtc(fromDateKey: string, toDateKey: string): number {
  const from = new Date(`${fromDateKey}T00:00:00.000Z`).getTime();
  const to = new Date(`${toDateKey}T00:00:00.000Z`).getTime();
  return Math.round((to - from) / MS_PER_DAY);
}

export function lastSevenUtcDays(today = utcDateKey()): string[] {
  return Array.from({ length: 7 }, (_, index) => addUtcDays(today, index - 6));
}

export function shortWeekday(dateKey: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(
    new Date(`${dateKey}T00:00:00.000Z`),
  );
}
