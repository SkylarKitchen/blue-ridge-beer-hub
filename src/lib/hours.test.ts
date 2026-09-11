import assert from "node:assert/strict";
import { test } from "node:test";

import { compactTime, minutesTo24h, parseTimeToMinutes } from "./hours.ts";

test("parses the owner-entered 12-hour format", () => {
  assert.equal(parseTimeToMinutes("12:00 PM"), 720);
  assert.equal(parseTimeToMinutes("9:00 PM"), 1260);
  assert.equal(parseTimeToMinutes("1:00 PM"), 780);
});

test("handles the noon and midnight edge cases", () => {
  assert.equal(parseTimeToMinutes("12:00 AM"), 0);
  assert.equal(parseTimeToMinutes("12:30 AM"), 30);
  assert.equal(parseTimeToMinutes("12:00 PM"), 720);
});

test("tolerates casual spellings", () => {
  assert.equal(parseTimeToMinutes("9pm"), 1260);
  assert.equal(parseTimeToMinutes("9 p.m."), 1260);
  assert.equal(parseTimeToMinutes(" 12 PM "), 720);
  assert.equal(parseTimeToMinutes("21:00"), 1260);
});

test("returns null for anything it cannot read", () => {
  assert.equal(parseTimeToMinutes(undefined), null);
  assert.equal(parseTimeToMinutes(""), null);
  assert.equal(parseTimeToMinutes("noon"), null);
  assert.equal(parseTimeToMinutes("25:00"), null);
  assert.equal(parseTimeToMinutes("9:75 PM"), null);
});

test("compactTime drops :00 and collapses spaces", () => {
  assert.equal(compactTime("9:00 PM"), "9 PM");
  assert.equal(compactTime("9:30  PM"), "9:30 PM");
});

test("minutesTo24h zero-pads for schema.org", () => {
  assert.equal(minutesTo24h(0), "00:00");
  assert.equal(minutesTo24h(720), "12:00");
  assert.equal(minutesTo24h(1260), "21:00");
});
