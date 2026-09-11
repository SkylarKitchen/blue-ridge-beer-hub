import { stegaClean } from "next-sanity";

/**
 * Events starting at or after `fromIso` (normally `startOfTodayIso()`).
 * Sanity applies this floor in EVENTS_QUERY; this mirrors it for the
 * baked-in fallback list so an outage never resurrects last week's shows.
 */
export function upcomingEvents<T extends { start: string }>(
  events: T[],
  fromIso: string,
): T[] {
  const floor = Date.parse(fromIso);
  return events.filter((event) => {
    const start = Date.parse(stegaClean(event.start));
    return !Number.isNaN(start) && start >= floor;
  });
}
