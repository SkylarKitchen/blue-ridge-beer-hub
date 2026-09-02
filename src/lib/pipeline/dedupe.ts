import type { ExtractedEvent } from "./extract";

const TZ = "America/New_York";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Same show, same NY calendar day ⇒ same event, regardless of styling. */
export function eventKey(title: string, startIso: string): string {
  const day = new Date(startIso).toLocaleDateString("en-CA", { timeZone: TZ });
  return `${normalizeTitle(title)}|${day}`;
}

export function dedupeNewEvents(
  extracted: ExtractedEvent[],
  existing: { title: string; start: string }[],
): ExtractedEvent[] {
  const seen = new Set(existing.map((e) => eventKey(e.title, e.start)));
  const fresh: ExtractedEvent[] = [];
  for (const event of extracted) {
    const key = eventKey(event.title, event.start);
    if (seen.has(key)) continue;
    seen.add(key);
    fresh.push(event);
  }
  return fresh;
}
