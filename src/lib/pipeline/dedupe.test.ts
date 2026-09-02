import assert from "node:assert/strict";
import { test } from "node:test";

import { dedupeNewEvents, eventKey } from "./dedupe.ts";

test("key normalizes case, punctuation, and whitespace", () => {
  assert.equal(
    eventKey("Chris Campbell (live!)", "2026-09-04T17:00:00-04:00"),
    eventKey("  chris   campbell live ", "2026-09-04T19:30:00-04:00"),
  );
});

test("key distinguishes different calendar days in NY time", () => {
  assert.notEqual(
    eventKey("Trivia", "2026-09-04T23:00:00-04:00"),
    eventKey("Trivia", "2026-09-05T23:00:00-04:00"),
  );
});

test("drops events matching an existing title+date, keeps the rest", () => {
  const extracted = [
    {
      title: "Music Bingo!",
      start: "2026-09-10T18:00:00-04:00",
      category: "games" as const,
    },
    {
      title: "Vinyl Night",
      start: "2026-09-12T18:00:00-04:00",
      category: "music" as const,
    },
  ];
  const existing = [
    { title: "music bingo", start: "2026-09-10T18:30:00-04:00" },
  ];
  const out = dedupeNewEvents(extracted, existing);
  assert.deepEqual(
    out.map((e) => e.title),
    ["Vinyl Night"],
  );
});

test("dedupes within the extracted batch itself (re-posted flyer)", () => {
  const twice = [
    {
      title: "Trivia",
      start: "2026-09-11T19:00:00-04:00",
      category: "games" as const,
    },
    {
      title: "Trivia!",
      start: "2026-09-11T19:00:00-04:00",
      category: "games" as const,
    },
  ];
  assert.equal(dedupeNewEvents(twice, []).length, 1);
});
