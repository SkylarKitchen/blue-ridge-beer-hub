const TZ = "America/New_York";

export function formatEventDate(iso: string): {
  weekday: string;
  monthDay: string;
  time: string;
} {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: TZ }),
    monthDay: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: TZ,
    }),
    time: d
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: TZ,
      })
      .replace(":00", ""),
  };
}

export function formatTimeRange(startIso: string, endIso?: string): string {
  const { time: startTime } = formatEventDate(startIso);
  if (!endIso) return startTime;
  const { time: endTime } = formatEventDate(endIso);
  return `${startTime}–${endTime}`;
}

/** Start of today in the venue's timezone, as ISO — the floor for "upcoming". */
export function startOfTodayIso(): string {
  const now = new Date();
  const parts = now.toLocaleDateString("en-CA", { timeZone: TZ });
  return `${parts}T00:00:00-04:00`;
}
