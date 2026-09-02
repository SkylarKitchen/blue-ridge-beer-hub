/**
 * Builds a single-event iCalendar file (RFC 5545). Kept dependency-free and
 * erasable-syntax-only so the unit test can run under Node's type stripping.
 */

interface CalendarEvent {
  _id: string;
  title: string;
  start: string;
  endTime?: string;
  description?: string;
  link?: string;
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/** "2026-09-04T21:00:00.000Z" → "20260904T210000Z" */
function toUtcBasic(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildEventIcs(event: CalendarEvent, location: string): string {
  const start = new Date(event.start);
  const end = event.endTime
    ? new Date(event.endTime)
    : new Date(start.getTime() + TWO_HOURS_MS);
  const description = [event.description, event.link]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Blue Ridge Beer Hub//Events//EN",
    "BEGIN:VEVENT",
    `UID:${event._id}@blueridgebeerhub`,
    `DTSTAMP:${toUtcBasic(new Date())}`,
    `DTSTART:${toUtcBasic(start)}`,
    `DTEND:${toUtcBasic(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
    `LOCATION:${escapeText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
