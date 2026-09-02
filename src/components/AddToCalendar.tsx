"use client";

import { buildEventIcs } from "@/lib/ics";
import type { HubEvent } from "@/lib/types";

export function AddToCalendar({
  event,
  location,
}: {
  event: HubEvent;
  location: string;
}) {
  const download = () => {
    const blob = new Blob([buildEventIcs(event, location)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${event.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={download}
      className="font-condensed text-xs font-bold uppercase tracking-wider text-cream/50 transition-colors hover:text-amber-bright"
    >
      + Add to calendar
    </button>
  );
}
