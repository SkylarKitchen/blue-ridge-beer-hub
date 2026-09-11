import { stegaClean } from "next-sanity";

import { compactTime, parseTimeToMinutes } from "./hours.ts"; // explicit extension: node --test resolves it without a bundler
import type { DayHours } from "./types";

const TZ = "America/New_York";
const WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_MINUTES = 24 * 60;

export interface OpenStatus {
  open: boolean;
  label: string;
}

interface OpenWindow {
  opens: number;
  /** Minutes since midnight of the OPENING day — past 1440 means after midnight. */
  closes: number;
  opensLabel: string;
  closesLabel: string;
}

function venueClock(now: Date): { weekday: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return {
    weekday: part("weekday") ?? "",
    minutes: (Number(part("hour")) % 24) * 60 + Number(part("minute")),
  };
}

/**
 * Parsed hours for one row. A closing time at or before the opening time
 * ("12:00 PM" – "1:00 AM") means the shop closes after midnight.
 */
function windowFor(row: DayHours | undefined): OpenWindow | null {
  if (!row || row.closed) return null;
  const opens = parseTimeToMinutes(row.opens);
  const closes = parseTimeToMinutes(row.closes);
  if (opens == null || closes == null) return null;
  return {
    opens,
    closes: closes <= opens ? closes + DAY_MINUTES : closes,
    opensLabel: compactTime(row.opens ?? ""),
    closesLabel: compactTime(row.closes ?? ""),
  };
}

/**
 * "Open until 9 PM" / "Opens today at 12 PM" / "Closed, opens tomorrow at
 * 12 PM" for the venue's local time. Rows are matched by weekday name (not
 * array position, which owners may shuffle) and stega-cleaned so the chip
 * still renders inside draft-mode previews. Returns null when nothing in
 * the hours array is readable, so the caller can hide the chip.
 */
export function computeStatus(
  hours: DayHours[],
  now: Date = new Date(),
): OpenStatus | null {
  if (hours.length === 0) return null;
  const { weekday, minutes } = venueClock(now);
  const todayIdx = WEEK.indexOf(weekday);
  if (todayIdx === -1) return null;

  const rowFor = (dayName: string) =>
    hours.find((row) => stegaClean(row.day) === dayName);

  // Last night's late window may still be running (Friday closing at 1 AM
  // is "open" at 12:30 AM Saturday).
  const yesterday = windowFor(rowFor(WEEK[(todayIdx + 6) % 7]));
  if (
    yesterday &&
    yesterday.closes > DAY_MINUTES &&
    minutes < yesterday.closes - DAY_MINUTES
  ) {
    return { open: true, label: `Open until ${yesterday.closesLabel}` };
  }

  const today = windowFor(rowFor(weekday));
  if (today) {
    if (minutes < today.opens) {
      return { open: false, label: `Opens today at ${today.opensLabel}` };
    }
    if (minutes < today.closes) {
      return { open: true, label: `Open until ${today.closesLabel}` };
    }
  }

  for (let offset = 1; offset <= 7; offset++) {
    const dayName = WEEK[(todayIdx + offset) % 7];
    const next = windowFor(rowFor(dayName));
    if (next) {
      const when = offset === 1 ? "tomorrow" : dayName;
      return {
        open: false,
        label: `Closed, opens ${when} at ${next.opensLabel}`,
      };
    }
  }
  return null;
}
