import assert from "node:assert/strict";
import { test } from "node:test";

import { FALLBACK_SETTINGS } from "./fallback.ts";
import type { SanityImageRef, SiteSettings } from "./types";
import {
  assignAnchors,
  LEGACY_FIELDS,
  navFromSections,
  PINNED_ABOUT_IMAGE,
  PINNED_HERO_IMAGE,
  placeHome,
  placeLegacy,
  sectionArrayPath,
  sectionsFromSettings,
  slugify,
  visibleSections,
  type Section,
  type SectionType,
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

/* ---------- Legacy adapter completeness ---------- */

/**
 * The spec's "Legacy field map" (docs/superpowers/specs/2026-09-12-page-
 * builder-design.md), written out by hand so `LEGACY_FIELDS` is checked
 * against an independent source rather than against itself. The migration
 * writes `sectionsFromSettings` output to the production dataset and a later
 * PR unsets the legacy fields, so a mapping dropped from the adapter would
 * be permanent loss of the owners' copy — and invisible in a dry-run diff.
 *
 * The spec's two `image` rows are pinned assets, not Site Settings fields;
 * they are absent here and checked by shape below.
 */
const SPEC_LEGACY_FIELDS: Record<SectionType, Record<string, string>> = {
  heroBlock: {
    heading: "heroHeading",
    subheading: "heroSubheading",
    primaryCta: "heroPrimaryCta",
    secondaryCta: "heroSecondaryCta",
  },
  eventsBlock: { heading: "eventsHeading", weeklyHeading: "weeklyHeading" },
  onTapBlock: {
    heading: "onTapHeading",
    blurb: "onTapBlurb",
    secondary: "onTapSecondary",
    cta: "onTapCta",
    tapCount: "tapCount",
    tapCountLabel: "tapCountLabel",
    tapCountFootnote: "tapCountFootnote",
    perks: "tapPerks",
  },
  offeringsBlock: { heading: "offeringsHeading", cards: "offerings" },
  galleryBlock: { heading: "galleryHeading" },
  aboutBlock: {
    heading: "aboutHeading",
    body: "aboutBody",
    credentials: "credentials",
  },
  dividerBlock: {},
  // PR 2's Feature block is new: nothing in Site Settings maps to it.
  featureBlock: {},
};

function omit<T extends Record<string, unknown>>(obj: T, ...keys: string[]) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k)),
  );
}

test("LEGACY_FIELDS matches the spec's legacy field map", () => {
  const copyFields = Object.fromEntries(
    Object.entries(LEGACY_FIELDS).map(([type, map]) => [
      type,
      omit(map, "image"),
    ]),
  );
  assert.deepEqual(copyFields, SPEC_LEGACY_FIELDS);

  // The spec pins both photos to fixed assets and so lists no image field.
  // PR #4 overtook it: `heroImage` and `aboutImage` are owner-editable Site
  // Settings fields, and an upload is meant to replace the shipped shot. The
  // map therefore carries BOTH, deliberately beyond the spec — this was the
  // open question the migration ticket (#13) was left to settle, and this is
  // the settlement. An edit to either photo needs a legacy write target, or
  // the edit scope cannot round-trip it back to Site Settings.
  const imageFields = Object.fromEntries(
    Object.entries(LEGACY_FIELDS)
      .filter(([, map]) => "image" in map)
      .map(([type, map]) => [type, map.image]),
  );
  assert.deepEqual(imageFields, {
    heroBlock: "heroImage",
    aboutBlock: "aboutImage",
  });
});

test("sectionsFromSettings copies every mapped legacy field, end to end", () => {
  const settings = FALLBACK_SETTINGS as Record<string, unknown>;
  const sections = sectionsFromSettings(FALLBACK_SETTINGS);
  let checked = 0;

  for (const section of sections) {
    const block = section as unknown as Record<string, unknown>;
    for (const [blockField, legacyField] of Object.entries(
      SPEC_LEGACY_FIELDS[section._type],
    )) {
      const expected = settings[legacyField];
      // An absent fixture value would make the comparison pass vacuously.
      assert.notEqual(
        expected,
        undefined,
        `FALLBACK_SETTINGS.${legacyField} is unset, so ${section._type}.${blockField} is not exercised`,
      );
      if (blockField === "cards") {
        // Fallback offerings carry neither _key nor _type; the adapter
        // synthesizes both. Excluded here so this stays a copy-fidelity
        // check — each has its own assertion below.
        const cards = block.cards as Record<string, unknown>[];
        assert.deepEqual(
          cards.map((card) => omit(card, "_key", "_type")),
          expected,
          "offeringsBlock.cards ≠ settings.offerings",
        );
        const keys = cards.map((card) => card._key);
        assert.ok(keys.every((k) => typeof k === "string" && k.length > 0));
        assert.equal(new Set(keys).size, keys.length);
      } else {
        assert.deepEqual(
          block[blockField],
          expected,
          `${section._type}.${blockField} ≠ settings.${legacyField}`,
        );
      }
      checked += 1;
    }
  }

  // Every mapping in the table was visited exactly once.
  const total = Object.values(SPEC_LEGACY_FIELDS).reduce(
    (n, map) => n + Object.keys(map).length,
    0,
  );
  assert.equal(checked, total);
});

test("sectionsFromSettings keeps an offering's existing _key", () => {
  // Stega paths and the migration both address cards by key; renaming one
  // would orphan the owners' on-page edits.
  const sections = sectionsFromSettings({
    ...FALLBACK_SETTINGS,
    offerings: [{ _key: "a1b2", title: "On tap", description: "Sixteen." }],
  });
  const offerings = sections.find((s) => s._type === "offeringsBlock");
  assert.ok(offerings && offerings._type === "offeringsBlock");
  assert.equal(offerings.cards?.[0]?._key, "a1b2");
});

test("every migrated offering card carries _type, or the Studio refuses it", () => {
  // Sanity resolves an array member's schema by its `_type`. A member with
  // none resolves to "object", and the Studio renders "Item of type object
  // not valid for this list" in place of the card form — so after --apply
  // the owners could no longer edit the three offer cards. The live
  // documents already carry it; the adapter must not drop it on the way out,
  // and must supply it for the offline fallback, which never had one.
  const sections = sectionsFromSettings(FALLBACK_SETTINGS);
  const offerings = sections.find((s) => s._type === "offeringsBlock");
  assert.ok(offerings && offerings._type === "offeringsBlock");
  assert.ok(
    offerings.cards?.length,
    "fixture has no cards, so nothing is exercised",
  );
  for (const card of offerings.cards ?? []) {
    assert.equal(card._type, "offering", `card ${card._key} has no _type`);
  }
});

test("pinned images carry the full reference shape the migration writes", () => {
  const sections = sectionsFromSettings(FALLBACK_SETTINGS);
  const hero = sections.find((s) => s._type === "heroBlock");
  assert.ok(hero && hero._type === "heroBlock");
  assert.deepEqual(hero.image, {
    _type: "image",
    asset: { _type: "reference", _ref: PINNED_HERO_IMAGE },
    alt: "Numbered tap handles branded with the Blue Ridge Beer Hub hop logo",
  });

  const about = sections.find((s) => s._type === "aboutBlock");
  assert.ok(about && about._type === "aboutBlock");
  assert.deepEqual(about.image, {
    _type: "image",
    asset: { _type: "reference", _ref: PINNED_ABOUT_IMAGE },
    alt: "Jason and Charlotte outside the Hub under the orange OPEN flag",
  });
});

/* ---------- Anchor hardening ---------- */

test("assignAnchors gives hidden sections no anchor and leaves them uncounted", () => {
  const sections = sectionsFromSettings(FALLBACK_SETTINGS);
  const events = sections.find((s) => s._type === "eventsBlock");
  assert.ok(events);
  const hidden: Section = {
    ...events,
    _key: "hidden-events",
    hiddenOnSite: true,
  };
  const all = [hidden, ...sections];

  const anchors = assignAnchors(all);
  assert.equal(anchors.get("hidden-events"), null);
  assert.equal(anchors.get(events._key), "events");

  // Page and nav agree by construction: passing the pre-filtered list gives
  // every visible section the same anchor.
  const fromVisible = assignAnchors(visibleSections(all));
  for (const section of sections) {
    assert.equal(anchors.get(section._key), fromVisible.get(section._key));
  }
});

test("assignAnchors never emits an empty anchor for a punctuation-only label", () => {
  assert.equal(slugify("!!! ???"), "");

  // A type with no DEFAULT_ANCHOR entry (PR 2's featureBlock) derives its
  // anchor from the menu label.
  const feature = (key: string, menuLabel: string) =>
    ({ _key: key, _type: "featureBlock", menuLabel }) as unknown as Section;
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
    ...sectionsFromSettings(FALLBACK_SETTINGS),
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
 * The owner-photo path. `heroImage` and `aboutImage` became owner-editable
 * Site Settings fields in PR #4, whose own help text states the intent: an
 * upload "replaces" the shipped shot, and an empty field keeps it. This
 * branch was authored before that PR existed, so the adapter pins both
 * assets unconditionally — it never reads the settings fields. The page then
 * renders faithfully from a block that already discarded the upload, and the
 * migration writes that same discard into the published document.
 *
 * Reported by fleet peers f2 and bc on issue #13. Reproduced here before
 * being fixed, so the fix is provably the thing that turns these green.
 */

const ownerPhoto = (ref: string, alt: string): SanityImageRef => ({
  _type: "image",
  asset: { _type: "reference", _ref: ref },
  alt,
});

function heroAndAbout(settings: SiteSettings) {
  const sections = sectionsFromSettings(settings);
  const hero = sections.find((s) => s._type === "heroBlock");
  const about = sections.find((s) => s._type === "aboutBlock");
  assert.ok(hero?._type === "heroBlock" && about?._type === "aboutBlock");
  return { hero, about };
}

test("an owner-uploaded photo wins over the pinned asset", () => {
  const { hero, about } = heroAndAbout({
    ...FALLBACK_SETTINGS,
    heroImage: ownerPhoto("image-owner-hero", "The new taproom frontage"),
    aboutImage: ownerPhoto("image-owner-about", "Jason behind the bar"),
  });

  assert.equal(hero.image?.asset?._ref, "image-owner-hero");
  assert.equal(hero.image?.alt, "The new taproom frontage");
  assert.equal(about.image?.asset?._ref, "image-owner-about");
  assert.equal(about.image?.alt, "Jason behind the bar");
});

test("an empty photo field keeps the pinned asset", () => {
  // The negative control for the test above: it passes before and after the
  // fix, so a green there cannot come from the adapter simply dropping the
  // defaults. PR #4's help text promises exactly this — "leave empty to keep
  // the tap-handles shot".
  const { hero, about } = heroAndAbout(FALLBACK_SETTINGS);

  assert.equal(hero.image?.asset?._ref, PINNED_HERO_IMAGE);
  assert.equal(about.image?.asset?._ref, PINNED_ABOUT_IMAGE);
  assert.ok(hero.image?.alt, "the pinned hero keeps its alt text");
  assert.ok(about.image?.alt, "the pinned about photo keeps its alt text");
});

test("an image field present but with no asset falls back to the pinned one", () => {
  // Sanity leaves a bare `{_type:"image"}` behind when an owner uploads a
  // photo and then removes it. Truthiness on the object alone would render a
  // broken image; the guard has to be on `.asset`.
  const { hero, about } = heroAndAbout({
    ...FALLBACK_SETTINGS,
    heroImage: { _type: "image" },
    aboutImage: { _type: "image" },
  });

  assert.equal(hero.image?.asset?._ref, PINNED_HERO_IMAGE);
  assert.equal(about.image?.asset?._ref, PINNED_ABOUT_IMAGE);
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
  const keys = sectionsFromSettings(FALLBACK_SETTINGS).map((s) => s._key);
  const paths = keys.map(sectionArrayPath);

  const arrays = new Set(paths.map(arrayPathOf));
  assert.equal(arrays.size, 1, "blocks disagree about which array they are in");
  assert.equal([...arrays][0], "sections[]");
  assert.equal(new Set(paths).size, paths.length, "two blocks share a path");
  assert.ok(paths.length > 1, "a single block is never draggable");
});
