import assert from "node:assert/strict";
import { test } from "node:test";

import { FALLBACK_SETTINGS } from "./fallback.ts";
import {
  assignAnchors,
  navFromSections,
  PINNED_ABOUT_IMAGE,
  PINNED_HERO_IMAGE,
  placeHome,
  placeLegacy,
  sectionsFromSettings,
  type Section,
} from "./sections.ts";

const ORDER = [
  "heroBlock",
  "dividerBlock",
  "eventsBlock",
  "onTapBlock",
  "offeringsBlock",
  "galleryBlock",
  "aboutBlock",
  "dividerBlock",
];

test("sectionsFromSettings mirrors today's page order", () => {
  const types = sectionsFromSettings(FALLBACK_SETTINGS).map((s) => s._type);
  assert.deepEqual(types, ORDER);
});

test("sectionsFromSettings copies legacy copy into block fields", () => {
  const sections = sectionsFromSettings(FALLBACK_SETTINGS);
  const hero = sections[0];
  assert.equal(hero._type, "heroBlock");
  if (hero._type !== "heroBlock") return;
  assert.equal(hero.heading, FALLBACK_SETTINGS.heroHeading);
  assert.equal(hero.image?.asset?._ref, PINNED_HERO_IMAGE);

  const tap = sections.find((s) => s._type === "onTapBlock");
  assert.ok(tap && tap._type === "onTapBlock");
  assert.equal(tap.tapCount, 16);
  assert.deepEqual(tap.perks, FALLBACK_SETTINGS.tapPerks);

  const about = sections.find((s) => s._type === "aboutBlock");
  assert.ok(about && about._type === "aboutBlock");
  assert.equal(about.image?.asset?._ref, PINNED_ABOUT_IMAGE);
  assert.equal(about.body?.length, FALLBACK_SETTINGS.aboutBody?.length);
});

test("every synthesized section has a unique _key", () => {
  const keys = sectionsFromSettings(FALLBACK_SETTINGS).map((s) => s._key);
  assert.equal(new Set(keys).size, keys.length);
});

test("placeLegacy writes defaults back to Site Settings fields", () => {
  const tap = placeLegacy(FALLBACK_SETTINGS).find(
    (p) => p.section._type === "onTapBlock",
  );
  assert.equal(tap?.scope.documentId, "siteSettings");
  assert.equal(tap?.scope.field("blurb"), "onTapBlurb");
  assert.equal(tap?.scope.field("perks[0]"), "tapPerks[0]");
});

test("placeHome writes to the keyed section on the Home Page", () => {
  const [placed] = placeHome([
    { _key: "abc", _type: "galleryBlock", heading: "Inside" },
  ]);
  assert.equal(placed.scope.documentId, "homePage");
  assert.equal(placed.scope.field("heading"), 'sections[_key=="abc"].heading');
});

test("navFromSections follows page order, then Hours", () => {
  assert.deepEqual(navFromSections(sectionsFromSettings(FALLBACK_SETTINGS)), [
    { href: "#events", label: "Events" },
    { href: "#tap", label: "On Tap" },
    { href: "#about", label: "About" },
    { href: "#hours", label: "Hours" },
  ]);
});

test("navFromSections skips hidden sections", () => {
  const sections = sectionsFromSettings(FALLBACK_SETTINGS).map((s) =>
    s._type === "onTapBlock" ? { ...s, hiddenOnSite: true } : s,
  );
  assert.ok(!navFromSections(sections).some((i) => i.href === "#tap"));
});

test("menuLabel renames a default entry and adds an unlabeled block", () => {
  const sections: Section[] = sectionsFromSettings(FALLBACK_SETTINGS).map(
    (s) => {
      if (s._type === "onTapBlock") return { ...s, menuLabel: "Taps" };
      if (s._type === "galleryBlock") return { ...s, menuLabel: "Photos" };
      return s;
    },
  );
  const nav = navFromSections(sections);
  assert.ok(nav.some((i) => i.href === "#tap" && i.label === "Taps"));
  assert.ok(nav.some((i) => i.href === "#photos" && i.label === "Photos"));
});

test("assignAnchors de-duplicates repeated block types, dividers get none", () => {
  const sections = sectionsFromSettings(FALLBACK_SETTINGS);
  const events = sections.find((s) => s._type === "eventsBlock");
  assert.ok(events);
  const anchors = assignAnchors([...sections, { ...events, _key: "again" }]);
  assert.equal(anchors.get(events._key), "events");
  assert.equal(anchors.get("again"), "events-2");
  assert.equal(anchors.get("legacy-divider-1"), null);
});
