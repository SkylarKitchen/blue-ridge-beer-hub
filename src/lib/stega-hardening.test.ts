import assert from "node:assert/strict";
import { test } from "node:test";

import { categoryMeta } from "./categories.ts";
import { formatEventDate } from "./format.ts";
import { compactTime, parseTimeToMinutes } from "./hours.ts";

// In draft-mode previews (Presentation tool), Sanity appends invisible
// stega characters to every string so the visual editor can map rendered
// text back to its field. Anything that parses or compares those strings
// must strip the encoding first. This suffix is real output from
// @vercel/stega's encoder (the same one @sanity/client uses).
const STEGA =
  "\u200b\u200b\u200b\u200b\u200c\ufeff\u200d\ufeff\u200b\u200d" +
  "\u200b\u200d\u200c\u200d\ufeff\ufeff\u200c\ufeff\u200b\u200d" +
  "\u200c\u200d\u200d\u200c\u200c\u200d\u200c\ufeff\u200c\u200d" +
  "\u200d\u200c\u200c\u200d\ufeff\u200d\u200b\u200d\u200b\u200d" +
  "\u200b\ufeff\u200d\u200d\u200b\u200d\u200b\u200d\u200c\ufeff" +
  "\u200b\ufeff\u200c\u200d\u200b\u200c\u200c\u200d\ufeff\u200d" +
  "\u200c\u200d\u200d\u200c\u200c\ufeff\u200c\u200b\u200c\ufeff" +
  "\u200d\u200c\u200b\u200d\ufeff\u200d\u200c\u200d\u200d\u200c" +
  "\u200c\u200d\ufeff\ufeff\u200b\u200d\u200b\u200d\u200b\u200d" +
  "\ufeff\u200b\u200b\u200d\u200b\u200d\u200c\u200d\u200d\u200b" +
  "\u200c\ufeff\u200b\u200d\u200c\u200d\u200c\u200c\u200c\u200d" +
  "\u200c\u200d\u200b\u200d\u200b\u200d\u200b\ufeff\u200d\u200d" +
  "\u200b\u200d\u200b\u200d\u200b\u200d\ufeff\ufeff\u200c\ufeff" +
  "\u200d\u200b\u200b\u200d\u200b\u200d\u200c\ufeff\ufeff\u200c";

test("parseTimeToMinutes reads a stega-encoded time", () => {
  assert.equal(parseTimeToMinutes(`12:00 PM${STEGA}`), 720);
});

test("compactTime emits no invisible or stray characters", () => {
  // ﻿ counts as \s in JS regexes, so compactTime's whitespace collapse
  // would otherwise turn stega runs into visible stray spaces.
  assert.equal(compactTime(`9:00 PM${STEGA}`), "9 PM");
});

test("categoryMeta looks up a stega-encoded category", () => {
  assert.equal(categoryMeta(`music${STEGA}`).label, "Live music");
});

test("formatEventDate parses a stega-encoded ISO date", () => {
  const { monthDay } = formatEventDate(`2026-09-04T17:00:00-04:00${STEGA}`);
  assert.equal(monthDay, "Sep 4");
});
