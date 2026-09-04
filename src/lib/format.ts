import { stegaClean } from "next-sanity";

const TZ = "America/New_York";

export function formatEventDate(iso: string): {
  weekday: string;
  monthDay: string;
  time: string;
} {
  // stegaClean: draft-mode previews may append invisible visual-editing
  // characters, and Date() rejects the string outright with them attached.
  const d = new Date(stegaClean(iso));
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
  const ymd = now.toLocaleDateString("en-CA", { timeZone: TZ });
  // Derive the real UTC offset instead of hardcoding EDT — it flips to -05:00
  // when daylight saving ends. (Worst case on transition days: off by an hour.)
  const offset =
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      timeZoneName: "longOffset",
    })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")
      ?.value.replace("GMT", "") || "-05:00";
  return `${ymd}T00:00:00${offset}`;
}
