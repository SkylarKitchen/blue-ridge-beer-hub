import assert from "node:assert/strict";
import { test } from "node:test";

import { STEGA } from "./__fixtures__/stega.ts";
import { computeStatus } from "./open-status.ts";

// Hours mirror the real shop week: noon–9 Mon–Sat, 1–7 Sunday.
const HOURS = [
  { day: "Monday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
  { day: "Tuesday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
  { day: "Wednesday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
  { day: "Thursday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
  { day: "Friday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
  { day: "Saturday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
  { day: "Sunday", opens: "1:00 PM", closes: "7:00 PM", closed: false },
];

// 2026-09-11 is a Friday. Offsets are EDT (-04:00).
const at = (iso: string) => new Date(iso);

test("open during business hours", () => {
  assert.deepEqual(computeStatus(HOURS, at("2026-09-11T14:00:00-04:00")), {
    open: true,
    label: "Open until 9 PM",
  });
});

test("before opening, points at today's opening time", () => {
  assert.deepEqual(computeStatus(HOURS, at("2026-09-11T10:00:00-04:00")), {
    open: false,
    label: "Opens today at 12 PM",
  });
});

test("after closing, points at tomorrow", () => {
  assert.deepEqual(computeStatus(HOURS, at("2026-09-11T22:00:00-04:00")), {
    open: false,
    label: "Closed, opens tomorrow at 12 PM",
  });
});

test("skips closed days and names the next open one", () => {
  const hours = HOURS.map((row) =>
    row.day === "Saturday" ? { ...row, closed: true } : row,
  );
  // Friday night → Saturday closed → Sunday.
  assert.deepEqual(computeStatus(hours, at("2026-09-11T22:00:00-04:00")), {
    open: false,
    label: "Closed, opens Sunday at 1 PM",
  });
});

test("finds tomorrow by weekday, not by array position", () => {
  // Owners can enter rows in any order; Sunday-first is common.
  const shuffled = [HOURS[6], ...HOURS.slice(0, 6)];
  assert.deepEqual(computeStatus(shuffled, at("2026-09-11T22:00:00-04:00")), {
    open: false,
    label: "Closed, opens tomorrow at 12 PM",
  });
});

test("a closing time at or before opening means past midnight", () => {
  const lateFriday = HOURS.map((row) =>
    row.day === "Friday" ? { ...row, closes: "1:00 AM" } : row,
  );
  // 11 PM Friday: still open, closing at 1 AM.
  assert.deepEqual(computeStatus(lateFriday, at("2026-09-11T23:00:00-04:00")), {
    open: true,
    label: "Open until 1 AM",
  });
  // 12:30 AM Saturday: Friday's late night is still running.
  assert.deepEqual(computeStatus(lateFriday, at("2026-09-12T00:30:00-04:00")), {
    open: true,
    label: "Open until 1 AM",
  });
  // 1:30 AM Saturday: closed, and Saturday opens at noon.
  assert.deepEqual(computeStatus(lateFriday, at("2026-09-12T01:30:00-04:00")), {
    open: false,
    label: "Opens today at 12 PM",
  });
});

test("matches day names carrying stega characters (draft-mode previews)", () => {
  const stega = HOURS.map((row) => ({
    ...row,
    day: `${row.day}${STEGA}`,
    opens: `${row.opens}${STEGA}`,
    closes: `${row.closes}${STEGA}`,
  }));
  assert.deepEqual(computeStatus(stega, at("2026-09-11T14:00:00-04:00")), {
    open: true,
    label: "Open until 9 PM",
  });
  assert.deepEqual(computeStatus(stega, at("2026-09-11T22:00:00-04:00")), {
    open: false,
    label: "Closed, opens tomorrow at 12 PM",
  });
});

test("returns null when hours are empty or unparseable", () => {
  assert.equal(computeStatus([], at("2026-09-11T14:00:00-04:00")), null);
  assert.equal(
    computeStatus(
      [{ day: "Friday", opens: "noonish", closes: "late", closed: false }],
      at("2026-09-11T14:00:00-04:00"),
    ),
    null,
  );
});
