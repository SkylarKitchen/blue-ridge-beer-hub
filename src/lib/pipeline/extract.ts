import { z } from "zod";

import type { EventCategory } from "../types";

export const CATEGORY_VALUES = [
  "music",
  "art",
  "games",
  "party",
  "community",
] as const;

/** The exact shape Claude's structured output is constrained to. */
export const FlyerExtractionSchema = z.object({
  isEventFlyer: z.boolean(),
  events: z.array(
    z.object({
      title: z.string(),
      start: z.string(),
      end: z.string().nullable(),
      category: z.enum(CATEGORY_VALUES),
    }),
  ),
});

export type FlyerExtraction = z.infer<typeof FlyerExtractionSchema>;

export interface ExtractedEvent {
  title: string;
  start: string;
  endTime?: string;
  category: EventCategory;
}

/**
 * Post-model guardrail: whatever Claude returns, only well-formed future
 * events survive. The pipeline never has to be right, only never
 * wrong-and-published — the draft gate catches the rest.
 */
export function refineExtraction(
  raw: FlyerExtraction,
  todayStartIso: string,
): ExtractedEvent[] {
  if (!raw.isEventFlyer) return [];
  const floor = Date.parse(todayStartIso);
  const events: ExtractedEvent[] = [];
  for (const candidate of raw.events) {
    const title = candidate.title.trim();
    const startMs = Date.parse(candidate.start);
    if (!title || Number.isNaN(startMs) || startMs < floor) continue;
    const event: ExtractedEvent = {
      title,
      start: candidate.start,
      category: candidate.category,
    };
    if (candidate.end) {
      const endMs = Date.parse(candidate.end);
      if (!Number.isNaN(endMs) && endMs > startMs)
        event.endTime = candidate.end;
    }
    events.push(event);
  }
  return events;
}
