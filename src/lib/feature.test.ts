// src/lib/feature.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { featureLayout, formatAsOf, nextFeatureAnchor } from "./feature.ts";
import { assignAnchors, type Section } from "./sections.ts";

// Pin the zone: on a New-York-zoned machine the timeZone: TZ option in
// formatAsOf is a no-op, so without this the year-boundary assertion below
// passes whether or not that option is there. This repo has no CI, so this
// Mac is the only host that runs the suite.
process.env.TZ = "UTC";

test("featureLayout picks a layout from the photo count", () => {
  assert.equal(featureLayout(0), "none");
  assert.equal(featureLayout(1), "one");
  assert.equal(featureLayout(2), "two");
  assert.equal(featureLayout(3), "three");
  assert.equal(featureLayout(7), "three");
});

test("formatAsOf renders an owner-set date as a short label", () => {
  const now = new Date("2026-09-20T12:00:00-04:00");
  assert.equal(formatAsOf("2026-09-12", now), "Updated Sep 12");
  assert.equal(formatAsOf("2025-12-30", now), "Updated Dec 30, 2025");
  assert.equal(formatAsOf(undefined, now), null);
  assert.equal(formatAsOf("not a date", now), null);

  // 03:00Z on Jan 1 is still Dec 31 in New York, so the year label must come
  // from the NY year, not the UTC one.
  const nyNewYearEve = new Date("2026-01-01T03:00:00Z");
  assert.equal(formatAsOf("2025-12-30", nyNewYearEve), "Updated Dec 30");
});

const page: Section[] = [
  { _key: "tap", _type: "onTapBlock" },
  { _key: "f1", _type: "featureBlock", menuLabel: "To Go" },
  { _key: "about", _type: "aboutBlock" },
  { _key: "f2", _type: "featureBlock" },
];

test("nextFeatureAnchor finds the first Feature block after a section", () => {
  const anchors = assignAnchors(page);
  assert.equal(nextFeatureAnchor(page, "tap", anchors), "#to-go");
  assert.equal(nextFeatureAnchor(page, "about", anchors), "#section-f2");
  assert.equal(nextFeatureAnchor(page, "f2", anchors), undefined);
});

test("nextFeatureAnchor returns undefined for an unknown key", () => {
  assert.equal(nextFeatureAnchor(page, "nope", assignAnchors(page)), undefined);
});

test("nextFeatureAnchor skips a hidden Feature block", () => {
  // Sections drops hidden blocks before calling it, but the helper must not
  // rely on that: a hidden block has no anchor, so a link to it would be dead.
  const withHidden: Section[] = [
    { _key: "tap", _type: "onTapBlock" },
    {
      _key: "h",
      _type: "featureBlock",
      menuLabel: "Hidden",
      hiddenOnSite: true,
    },
    { _key: "f", _type: "featureBlock", menuLabel: "To Go" },
  ];
  const anchors = assignAnchors(withHidden);
  assert.equal(nextFeatureAnchor(withHidden, "tap", anchors), "#to-go");
  assert.equal(
    nextFeatureAnchor(
      withHidden.slice(0, 2),
      "tap",
      assignAnchors(withHidden.slice(0, 2)),
    ),
    undefined,
  );
});
