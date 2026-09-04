"use client";

import { useEffect, useState } from "react";

import { compactTime, parseTimeToMinutes } from "@/lib/hours";
import type { DayHours } from "@/lib/types";

const TZ = "America/New_York";

interface Status {
  open: boolean;
  label: string;
}

/**
 * Walks the hours array in its stored order (the schema asks owners to keep
 * it in week order), so "next open day" is whatever row follows today.
 */
function computeStatus(hours: DayHours[]): Status | null {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  const weekday = part("weekday");
  const nowMinutes =
    ((Number(part("hour")) % 24) * 60 + Number(part("minute"))) | 0;

  const todayIndex = hours.findIndex((row) => row.day === weekday);
  if (todayIndex === -1) return null;

  const today = hours[todayIndex];
  if (!today.closed) {
    const opens = parseTimeToMinutes(today.opens);
    const closes = parseTimeToMinutes(today.closes);
    if (opens != null && closes != null) {
      if (nowMinutes < opens) {
        return {
          open: false,
          label: `Opens today at ${compactTime(today.opens!)}`,
        };
      }
      if (nowMinutes < closes) {
        return {
          open: true,
          label: `Open until ${compactTime(today.closes!)}`,
        };
      }
    }
  }

  for (let offset = 1; offset <= hours.length; offset++) {
    const next = hours[(todayIndex + offset) % hours.length];
    if (!next.closed && parseTimeToMinutes(next.opens) != null) {
      const dayLabel = offset === 1 ? "tomorrow" : next.day;
      return {
        open: false,
        label: `Closed, opens ${dayLabel} at ${compactTime(next.opens!)}`,
      };
    }
  }
  return null;
}

/**
 * Live "open right now" chip. Computed client-side only (renders nothing on
 * the server) so a statically cached page can't show yesterday's answer.
 */
export function OpenStatus({ hours }: { hours?: DayHours[] }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!hours?.length) return;
    const update = () => setStatus(computeStatus(hours));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(hours)]);

  if (!status) return null;
  return (
    <a
      href="#hours"
      className="animate-rise inline-flex items-center font-condensed text-sm font-bold uppercase tracking-[0.16em] text-navy/75 transition-colors hover:text-navy"
    >
      {status.label}
    </a>
  );
}
