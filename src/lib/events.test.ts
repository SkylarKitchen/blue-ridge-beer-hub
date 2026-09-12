import assert from "node:assert/strict";
import { test } from "node:test";

import { upcomingEvents } from "./events.ts";

const events = [
  { _id: "a", title: "Past", start: "2026-09-05T17:00:00-04:00" },
  { _id: "b", title: "Earlier today", start: "2026-09-11T00:30:00-04:00" },
  { _id: "c", title: "Tonight", start: "2026-09-11T19:00:00-04:00" },
  { _id: "d", title: "Next week", start: "2026-09-18T17:00:00-04:00" },
];

test("keeps events from the start of today onward", () => {
  const out = upcomingEvents(events, "2026-09-11T00:00:00-04:00");
  assert.deepEqual(
    out.map((e) => e._id),
    ["b", "c", "d"],
  );
});

test("drops everything when the floor is past every event", () => {
  assert.deepEqual(upcomingEvents(events, "2026-10-01T00:00:00-04:00"), []);
});

test("drops events with unparseable start dates", () => {
  const out = upcomingEvents(
    [...events, { _id: "x", title: "Bad", start: "someday" }],
    "2026-09-11T00:00:00-04:00",
  );
  assert.ok(!out.some((e) => e._id === "x"));
});
