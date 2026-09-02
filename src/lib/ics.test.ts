import assert from "node:assert/strict";
import { test } from "node:test";

import { buildEventIcs } from "./ics.ts";

const LOCATION = "Blue Ridge Beer Hub, 21 East St, Waynesville, NC 28786";

const base = {
  _id: "evt-1",
  title: "Chris Campbell live",
  start: "2026-09-04T17:00:00-04:00",
  endTime: "2026-09-04T19:00:00-04:00",
};

test("wraps a complete VCALENDAR around one VEVENT", () => {
  const ics = buildEventIcs(base, LOCATION);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.includes("BEGIN:VEVENT\r\n"));
  assert.ok(ics.includes("END:VEVENT\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("converts start and end to UTC basic format", () => {
  const ics = buildEventIcs(base, LOCATION);
  assert.ok(ics.includes("DTSTART:20260904T210000Z"));
  assert.ok(ics.includes("DTEND:20260904T230000Z"));
});

test("defaults to a 2-hour duration when endTime is missing", () => {
  const ics = buildEventIcs({ ...base, endTime: undefined }, LOCATION);
  assert.ok(ics.includes("DTEND:20260904T230000Z"));
});

test("escapes commas, semicolons, and newlines in text fields", () => {
  const ics = buildEventIcs(
    {
      ...base,
      title: "Trivia; night, round 2",
      description: "Line one\nLine two",
    },
    LOCATION,
  );
  assert.ok(ics.includes("SUMMARY:Trivia\\; night\\, round 2"));
  assert.ok(ics.includes("DESCRIPTION:Line one\\nLine two"));
});

test("includes location and merges link into description", () => {
  const ics = buildEventIcs(
    { ...base, description: "Live music", link: "https://example.com/show" },
    LOCATION,
  );
  assert.ok(
    ics.includes(
      "LOCATION:Blue Ridge Beer Hub\\, 21 East St\\, Waynesville\\, NC 28786",
    ),
  );
  assert.ok(ics.includes("DESCRIPTION:Live music\\nhttps://example.com/show"));
});

test("stamps a stable UID from the event id", () => {
  const ics = buildEventIcs(base, LOCATION);
  assert.ok(ics.includes("UID:evt-1@blueridgebeerhub"));
});
