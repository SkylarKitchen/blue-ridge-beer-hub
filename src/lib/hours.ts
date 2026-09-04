import { stegaClean } from "next-sanity";

/**
 * Hours in Sanity are owner-entered strings like "12:00 PM" (see the
 * dayHours schema). These helpers parse that one format — anything they
 * can't read returns null and callers hide themselves rather than guess.
 *
 * Both parse fns stegaClean their input: draft-mode previews append
 * invisible visual-editing characters that would fail the regex (and BOM
 * counts as \s, so the whitespace collapse would leave stray spaces).
 */
export function parseTimeToMinutes(value?: string): number | null {
  if (!value) return null;
  const match = stegaClean(value)
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.toLowerCase();
  if (hours > 23 || minutes > 59) return null;
  if (meridiem?.startsWith("p") && hours !== 12) hours += 12;
  if (meridiem?.startsWith("a") && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/** "9:00 PM" → "9 PM" for chip copy. */
export function compactTime(value: string): string {
  return stegaClean(value).replace(":00", "").replace(/\s+/g, " ").trim();
}

/** Minutes since midnight → "HH:MM" (24h), the format schema.org expects. */
export function minutesTo24h(total: number): string {
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const m = String(total % 60).padStart(2, "0");
  return `${h}:${m}`;
}
