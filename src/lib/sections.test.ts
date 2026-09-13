import assert from "node:assert/strict";
import { test } from "node:test";

import { FALLBACK_SECTIONS } from "./fallback.ts";
import {
  assignAnchors,
  navFromSections,
  placeHome,
  sectionArrayPath,
  slugify,
  toGoSeedSection,
  visibleSections,
  type Section,
} from "./sections.ts";

/* ---------- Offline fallback ---------- */

/**
 * The page the migration wrote on 2026-09-13, block type by block type: the
 * pre-builder page (hero, ridgeline, events, on tap, offerings, gallery,
 * about, ridgeline) with the To Go block seeded, hidden, right after On Tap.
 * FALLBACK_SECTIONS is the offline copy of that page, so its order is pinned
 * here rather than derived.
 */
const ORDER = [
  "heroBlock",
  "dividerBlock",
  "eventsBlock",
  "onTapBlock",
  "featureBlock",
  "offeringsBlock",
  "galleryBlock",
  "aboutBlock",
  "dividerBlock",
];

test("FALLBACK_SECTIONS keeps the migrated page's type order", () => {
  assert.deepEqual(
    FALLBACK_SECTIONS.map((s) => s._type),
    ORDER,
  );
});

test("every fallback section has a unique _key", () => {
  const keys = FALLBACK_SECTIONS.map((s) => s._key);
  assert.ok(keys.every((k) => typeof k === "string" && k.length > 0));
  assert.equal(new Set(keys).size, keys.length);
});

test("the fallback To Go block is the hidden seed, so the offline page shows no new section", () => {
  const toGo = FALLBACK_SECTIONS.find((s) => s._type === "featureBlock");
  assert.deepEqual(toGo, toGoSeedSection());
  assert.equal(toGo?.hiddenOnSite, true);
});

test("fallback photos carry the full reference shape the Studio writes", () => {
  // Hero and About render `block.image?.asset`; a bare `{_type:"image"}`
  // would fall through to the components' own default shot, silently.
  const hero = FALLBACK_SECTIONS.find((s) => s._type === "heroBlock");
  const about = FALLBACK_SECTIONS.find((s) => s._type === "aboutBlock");
  assert.ok(hero?._type === "heroBlock" && about?._type === "aboutBlock");
  for (const image of [hero.image, about.image]) {
    assert.equal(image?._type, "image");
    assert.equal(image?.asset?._type, "reference");
    assert.match(image?.asset?._ref ?? "", /^image-[0-9a-f]+-\d+x\d+-[a-z]+$/);
    assert.ok(image?.alt, "a fallback photo needs alt text");
  }
});

test("every fallback offering card carries _type and a unique _key", () => {
  // Sanity resolves an array member's schema by its `_type`; a member with
  // none renders as "Item of type object not valid for this list".
  const offerings = FALLBACK_SECTIONS.find((s) => s._type === "offeringsBlock");
  assert.ok(offerings && offerings._type === "offeringsBlock");
  assert.ok(offerings.cards?.length, "fixture has no cards");
  const keys = offerings.cards.map((c) => c._key);
  assert.equal(new Set(keys).size, keys.length);
  for (const card of offerings.cards) {
    assert.equal(card._type, "offering", `card ${card._key} has no _type`);
  }
});

/* ---------- Placement ---------- */

test("placeHome writes to the keyed section on the Home Page", () => {
  const [placed] = placeHome([
    { _key: "abc", _type: "galleryBlock", heading: "Inside" },
  ]);
  assert.equal(placed.scope.documentId, "homePage");
  assert.equal(placed.scope.field("heading"), 'sections[_key=="abc"].heading');
});

/* ---------- Nav and anchors ---------- */

test("navFromSections follows page order, then Hours", () => {
  assert.deepEqual(navFromSections(FALLBACK_SECTIONS), [
    { href: "#events", label: "Events" },
    { href: "#tap", label: "On Tap" },
    { href: "#about", label: "About" },
    { href: "#hours", label: "Hours" },
  ]);
});

test("navFromSections skips hidden sections", () => {
  const sections = FALLBACK_SECTIONS.map((s) =>
    s._type === "onTapBlock" ? { ...s, hiddenOnSite: true } : s,
  );
  assert.ok(!navFromSections(sections).some((i) => i.href === "#tap"));
});

test("menuLabel renames a default entry and adds an unlabeled block", () => {
  const sections: Section[] = FALLBACK_SECTIONS.map((s) => {
    if (s._type === "onTapBlock") return { ...s, menuLabel: "Taps" };
    if (s._type === "galleryBlock") return { ...s, menuLabel: "Photos" };
    return s;
  });
  const nav = navFromSections(sections);
  assert.ok(nav.some((i) => i.href === "#tap" && i.label === "Taps"));
  assert.ok(nav.some((i) => i.href === "#photos" && i.label === "Photos"));
});

test("assignAnchors de-duplicates repeated block types, dividers get none", () => {
  const events = FALLBACK_SECTIONS.find((s) => s._type === "eventsBlock");
  assert.ok(events);
  const anchors = assignAnchors([
    ...FALLBACK_SECTIONS,
    { ...events, _key: "again" },
  ]);
  assert.equal(anchors.get(events._key), "events");
  assert.equal(anchors.get("again"), "events-2");
  assert.equal(anchors.get("legacy-divider-1"), null);
});

/* ---------- Anchor hardening ---------- */

test("assignAnchors gives hidden sections no anchor and leaves them uncounted", () => {
  const events = FALLBACK_SECTIONS.find((s) => s._type === "eventsBlock");
  assert.ok(events);
  const hidden: Section = {
    ...events,
    _key: "hidden-events",
    hiddenOnSite: true,
  };
  const all = [hidden, ...FALLBACK_SECTIONS];

  const anchors = assignAnchors(all);
  assert.equal(anchors.get("hidden-events"), null);
  assert.equal(anchors.get(events._key), "events");

  // Page and nav agree by construction: passing the pre-filtered list gives
  // every visible section the same anchor.
  const fromVisible = assignAnchors(visibleSections(all));
  for (const section of visibleSections(FALLBACK_SECTIONS)) {
    assert.equal(anchors.get(section._key), fromVisible.get(section._key));
  }
});

test("assignAnchors never emits an empty anchor for a punctuation-only label", () => {
  assert.equal(slugify("!!! ???"), "");

  // A type with no DEFAULT_ANCHOR entry (featureBlock) derives its anchor
  // from the menu label.
  const feature = (key: string, menuLabel: string): Section => ({
    _key: key,
    _type: "featureBlock",
    menuLabel,
  });
  const anchors = assignAnchors([
    feature("f1", "!!!"),
    feature("f2", "???"),
    feature("f3", "Live Music"),
  ]);
  assert.equal(anchors.get("f1"), "section-f1");
  assert.equal(anchors.get("f2"), "section-f2");
  assert.equal(anchors.get("f3"), "live-music");
});

test("a Feature block labeled 'Hours' never takes the footer's #hours anchor", () => {
  // HoursFooter renders <footer id="hours"> after <main>, and navFromSections
  // appends "#hours" unconditionally. A Feature block's anchor comes from its
  // menu label, so an owner who types "Hours" there would otherwise emit a
  // second id="hours" ABOVE the footer: the browser resolves #hours to the
  // first one in document order, the Hours link scrolls to the Feature
  // section, and the footer becomes unreachable by anchor. The gate is the
  // anchor value itself — href uniqueness alone could pass for the wrong
  // reason while the duplicate id came back.
  const sections: Section[] = [
    ...FALLBACK_SECTIONS,
    { _key: "f-hours", _type: "featureBlock", menuLabel: "Hours" },
  ];
  const anchors = assignAnchors(sections);
  assert.equal(anchors.get("f-hours"), "hours-2");

  const hrefs = navFromSections(sections).map((i) => i.href);
  assert.equal(
    new Set(hrefs).size,
    hrefs.length,
    "two nav items share an href",
  );
});

/*
 * Drag-to-reorder (Task 14) rests on one thing this repo controls: the shape
 * of the path in `data-sanity`. @sanity/visual-editing 6.1.2 never reports an
 * unsuitable path — a block that is not draggable simply is not draggable,
 * with nothing in the console to say why. So the library's own rule is copied
 * here verbatim and the emitted path is tested against it.
 *
 * Copied from node_modules/@sanity/visual-editing/dist/SharedStateContext-*.js:
 *
 *   function isSanityArrayPath(path) {
 *     let lastDotIndex = path.lastIndexOf(".");
 *     return path.substring(lastDotIndex, path.length).includes("[");
 *   }
 *
 * If a version bump changes that rule, this test still passes while drag
 * silently stops working — so re-read the predicate when bumping the package,
 * rather than trusting a green here.
 */
const isSanityArrayPath = (path: string) =>
  path.substring(path.lastIndexOf(".")).includes("[");

/** Also copied: two nodes must resolve to the SAME array to be siblings. */
const arrayPathOf = (path: string) => {
  if (!isSanityArrayPath(path)) return null;
  const split = path.split(".");
  split[split.length - 1] = split[split.length - 1].replace(/\[.*?\]/g, "[]");
  return split.join(".");
};

test("a section path is an array path, which is what makes a block draggable", () => {
  assert.equal(
    sectionArrayPath("legacy-hero"),
    'sections[_key=="legacy-hero"]',
  );
  assert.ok(
    isSanityArrayPath(sectionArrayPath("legacy-hero")),
    "the overlay would refuse to drag this element",
  );
});

test("every block on a page resolves to the same array, at a distinct path", () => {
  // The overlay's third requirement: resolveDragAndDropGroup returns null for
  // a group of one, so siblings must agree on the array and differ on the
  // path. Both halves are asserted — equal arrays, distinct paths.
  const keys = FALLBACK_SECTIONS.map((s) => s._key);
  const paths = keys.map(sectionArrayPath);

  const arrays = new Set(paths.map(arrayPathOf));
  assert.equal(arrays.size, 1, "blocks disagree about which array they are in");
  assert.equal([...arrays][0], "sections[]");
  assert.equal(new Set(paths).size, paths.length, "two blocks share a path");
  assert.ok(paths.length > 1, "a single block is never draggable");
});

/* ---------- To Go seed ---------- */

test("the To Go seed has one placeholder photo and an empty list", () => {
  const seed = toGoSeedSection();
  assert.equal(seed.photos?.length, 1);
  assert.ok(seed.photos?.[0]?.alt);
  assert.deepEqual(seed.listItems, []);
});

test("a Feature block is in the menu only when it has a label", () => {
  const withLabel: Section[] = [
    { _key: "tap", _type: "onTapBlock" },
    { _key: "f", _type: "featureBlock", menuLabel: "To Go" },
  ];
  assert.deepEqual(navFromSections(withLabel), [
    { href: "#tap", label: "On Tap" },
    { href: "#to-go", label: "To Go" },
    { href: "#hours", label: "Hours" },
  ]);
  const noLabel: Section[] = [{ _key: "f", _type: "featureBlock" }];
  assert.deepEqual(navFromSections(noLabel), [
    { href: "#hours", label: "Hours" },
  ]);
  assert.equal(assignAnchors(noLabel).get("f"), "section-f");
});

test("the To Go seed ships without a button", () => {
  // The owners add the call-to-action themselves; a seeded label with no URL
  // (or the reverse) would render nothing yet look configured in the Studio.
  const seed = toGoSeedSection();
  assert.equal(seed.ctaLabel, undefined);
  assert.equal(seed.ctaUrl, undefined);
});
