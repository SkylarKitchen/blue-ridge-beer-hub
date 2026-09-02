import assert from "node:assert/strict";
import { test } from "node:test";

import { refineExtraction, type FlyerExtraction } from "./extract.ts";

const TODAY = "2026-09-02T00:00:00-04:00";

function flyer(events: FlyerExtraction["events"]): FlyerExtraction {
  return { isEventFlyer: true, events };
}

test("keeps a valid future event", () => {
  const out = refineExtraction(
    flyer([
      {
        title: "Music Bingo",
        start: "2026-09-10T18:00:00-04:00",
        end: "2026-09-10T20:00:00-04:00",
        category: "games",
      },
    ]),
    TODAY,
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "Music Bingo");
  assert.equal(out[0].endTime, "2026-09-10T20:00:00-04:00");
});

test("returns nothing for a non-flyer post", () => {
  assert.deepEqual(
    refineExtraction({ isEventFlyer: false, events: [] }, TODAY),
    [],
  );
});

test("drops past events and events today counts as future", () => {
  const out = refineExtraction(
    flyer([
      {
        title: "Old",
        start: "2026-08-30T18:00:00-04:00",
        end: null,
        category: "music",
      },
      {
        title: "Tonight",
        start: "2026-09-02T19:00:00-04:00",
        end: null,
        category: "music",
      },
    ]),
    TODAY,
  );
  assert.deepEqual(
    out.map((e) => e.title),
    ["Tonight"],
  );
});

test("drops unparseable dates and blank titles", () => {
  const out = refineExtraction(
    flyer([
      {
        title: "Bad date",
        start: "sometime friday",
        end: null,
        category: "music",
      },
      {
        title: "   ",
        start: "2026-09-10T18:00:00-04:00",
        end: null,
        category: "music",
      },
    ]),
    TODAY,
  );
  assert.deepEqual(out, []);
});

test("discards an end time that is not after the start", () => {
  const out = refineExtraction(
    flyer([
      {
        title: "Show",
        start: "2026-09-10T18:00:00-04:00",
        end: "2026-09-10T17:00:00-04:00",
        category: "music",
      },
    ]),
    TODAY,
  );
  assert.equal(out[0].endTime, undefined);
});
