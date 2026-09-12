# Page Builder Implementation Plan (PR 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the fixed homepage into a Home Page document of reorderable, hideable section blocks, with the page rendering pixel-identical to today until the owners change something.

**Architecture:** A new `homePage` singleton holds `sections[]` of typed block objects. `src/lib/sections.ts` owns the block types, an adapter that synthesizes sections from legacy Site Settings fields (so deploy is safe before data moves), anchor and nav derivation, and an `EditScope` that tells `Editable` which document and path a default string writes to. Each existing section component becomes a block component taking `{ block, scope }`. A migration script (dry-run by default) writes the Home Page document and deletes the two pinned Gallery Photo docs.

**Tech Stack:** Next 16.3.4 App Router (read `node_modules/next/dist/docs/01-app/` before touching app code), Sanity v6 (`defineType`/`defineField`/`defineArrayMember`), next-sanity 13, `node --test` with `.ts` imports (Node 25 type stripping), Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-09-12-page-builder-design.md`

## Global Constraints

- Commit only on a `skylar/<feature>` branch; a hook rejects `git commit` on `main`. Never combine `git checkout -b` and `git commit` in one command.
- Relative imports inside `src/lib/*.ts` that node runs (tests, scripts) must use the `.ts` extension (`./copy.ts`), not `./copy`. Type-only imports may omit it.
- No `@/` alias in `src/lib/sections.ts`, `src/lib/edit-scope.ts`, `src/lib/copy.ts`, `src/lib/fallback.ts` (the migration script imports them under plain node).
- Owner-facing copy uses typographic apostrophes (’). Field titles/descriptions are written for the shop owners, not developers.
- The rendered page must be visually identical before and after this PR, except the header nav order (now page order: Events, On Tap, About, Hours).
- Legacy Site Settings fields and the gallery-query exclusion list stay untouched in this PR (spec: Deviations).
- Verify each task with: `npm test`, `npx tsc --noEmit`, `npm run lint`.
- Never run a dev server as a background task. Use `~/.claude/scripts/ghostty-tab.sh 'npm run dev'` after checking `lsof -nP -iTCP:3000 -sTCP:LISTEN`.

---

### Task 1: Branch and spec

**Files:**

- Create: `docs/superpowers/specs/2026-09-12-page-builder-design.md` (already written), this plan.

- [ ] **Step 1: Branch from the committed stega work**

```bash
git checkout -b skylar/page-builder
```

- [ ] **Step 2: Commit the design docs**

```bash
git add docs/superpowers
git commit -m "Add page builder design spec and plans

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: EditScope (document + path resolver for default copy)

**Files:**

- Create: `src/lib/edit-scope.ts`
- Test: `src/lib/edit-scope.test.ts`

**Interfaces:**

- Produces: `EditScope { documentId; documentType; field(name) }`, `blockScope(key)`, `legacyScope(map)`, `HOME_PAGE_ID = "homePage"`, `HOME_PAGE_TYPE = "homePage"`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/edit-scope.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { blockScope, legacyScope } from "./edit-scope.ts";

test("blockScope addresses a field on a keyed section of the Home Page", () => {
  const scope = blockScope("k1");
  assert.equal(scope.documentId, "homePage");
  assert.equal(scope.documentType, "homePage");
  assert.equal(scope.field("heading"), 'sections[_key=="k1"].heading');
});

test("blockScope keeps array tails on the field name", () => {
  assert.equal(
    blockScope("k1").field("perks[2]"),
    'sections[_key=="k1"].perks[2]',
  );
  assert.equal(
    blockScope("k1").field('cards[_key=="c9"].title'),
    'sections[_key=="k1"].cards[_key=="c9"].title',
  );
});

test("legacyScope maps block field names onto Site Settings fields", () => {
  const scope = legacyScope({ heading: "onTapHeading", perks: "tapPerks" });
  assert.equal(scope.documentId, "siteSettings");
  assert.equal(scope.documentType, "siteSettings");
  assert.equal(scope.field("heading"), "onTapHeading");
  assert.equal(scope.field("perks[1]"), "tapPerks[1]");
});

test("legacyScope passes unmapped names through unchanged", () => {
  assert.equal(legacyScope({}).field("credentials[0]"), "credentials[0]");
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `node --test src/lib/edit-scope.test.ts`
Expected: FAIL, cannot find module `./edit-scope.ts`.

- [ ] **Step 3: Implement**

```ts
// src/lib/edit-scope.ts
/**
 * Where a block's copy is written when the rendered string carries no stega
 * (a default, or the fallback page). `Editable` resolves a target from the
 * stega on the string first; this is the second choice.
 *
 * Two scopes exist because the page can render from two places:
 * - the Home Page document's `sections[]` (after migration), and
 * - the legacy flat fields on Site Settings (before migration, via the
 *   adapter in `sections.ts`).
 */
export interface EditScope {
  documentId: string;
  documentType: string;
  /** Turns a block-relative field name into a full Studio path. */
  field: (name: string) => string;
}

export const HOME_PAGE_ID = "homePage";
export const HOME_PAGE_TYPE = "homePage";
export const SITE_SETTINGS_ID = "siteSettings";
export const SITE_SETTINGS_TYPE = "siteSettings";

export function blockScope(key: string): EditScope {
  return {
    documentId: HOME_PAGE_ID,
    documentType: HOME_PAGE_TYPE,
    field: (name) => `sections[_key=="${key}"].${name}`,
  };
}

/**
 * `map` is block field → legacy Site Settings field. Anything after the
 * first `[` or `.` (array index, key selector, nested field) is kept.
 */
export function legacyScope(map: Record<string, string>): EditScope {
  return {
    documentId: SITE_SETTINGS_ID,
    documentType: SITE_SETTINGS_TYPE,
    field: (name) => {
      const match = /^([^[.]+)(.*)$/.exec(name);
      const head = match?.[1] ?? name;
      const tail = match?.[2] ?? "";
      return (map[head] ?? head) + tail;
    },
  };
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `node --test src/lib/edit-scope.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/edit-scope.ts src/lib/edit-scope.test.ts
git commit -m "Add EditScope: resolves where default block copy is written

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Section types, legacy adapter, anchors, nav

**Files:**

- Create: `src/lib/sections.ts`
- Modify: `src/lib/types.ts` (SanityImageRef gets `_type`, asset `_type`, `crop`)
- Modify: `src/lib/fallback.ts:1` (`./copy` → `./copy.ts` so node can import it)
- Test: `src/lib/sections.test.ts`

**Interfaces:**

- Consumes: `EditScope`, `blockScope`, `legacyScope` from Task 2.
- Produces: `Section` union and each block interface; `Placed { section; scope }`; `sectionsFromSettings(settings): Section[]`; `placeLegacy(settings): Placed[]`; `placeHome(sections): Placed[]`; `assignAnchors(sections): Map<string, string | null>`; `navFromSections(sections): NavItem[]`; `LEGACY_FIELDS`; `PINNED_HERO_IMAGE`, `PINNED_ABOUT_IMAGE`; `imageRef(id, alt)`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/sections.test.ts
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
```

- [ ] **Step 2: Run it, expect failure**

Run: `node --test src/lib/sections.test.ts`
Expected: FAIL, cannot find module `./sections.ts` (and `./copy` resolution error from `fallback.ts`).

- [ ] **Step 3: Fix the fallback import and widen the image type**

In `src/lib/fallback.ts` line 1: `import { DEFAULT_COPY } from "./copy";` → `import { DEFAULT_COPY } from "./copy.ts";`

In `src/lib/types.ts` replace `SanityImageRef`:

```ts
export interface SanityImageRef {
  _type?: "image";
  asset?: { _type?: "reference"; _ref: string };
  alt?: string;
  hotspot?: { x: number; y: number; height?: number; width?: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}
```

- [ ] **Step 4: Implement `src/lib/sections.ts`**

```ts
// src/lib/sections.ts
import type { PortableTextBlock } from "next-sanity";
import { stegaClean } from "next-sanity";

import { blockScope, legacyScope, type EditScope } from "./edit-scope.ts";
import type { Offering, SanityImageRef, SiteSettings } from "./types";

/* ---------- Block types ---------- */

interface SectionBase {
  _key: string;
  /** "Hide for now" in the Studio. Hidden blocks render nothing. */
  hiddenOnSite?: boolean;
  /** Header menu entry. Overrides the block's default label. */
  menuLabel?: string;
}

export interface HeroBlock extends SectionBase {
  _type: "heroBlock";
  heading?: string;
  subheading?: string;
  primaryCta?: string;
  secondaryCta?: string;
  image?: SanityImageRef;
}

export interface EventsBlock extends SectionBase {
  _type: "eventsBlock";
  heading?: string;
  weeklyHeading?: string;
}

export interface OnTapBlock extends SectionBase {
  _type: "onTapBlock";
  heading?: string;
  blurb?: string;
  secondary?: string;
  /** PR 2: text of a link after `secondary` that jumps to the next Feature block. */
  secondaryLinkLabel?: string;
  cta?: string;
  tapCount?: number;
  tapCountLabel?: string;
  tapCountFootnote?: string;
  perks?: string[];
}

export interface OfferingsBlock extends SectionBase {
  _type: "offeringsBlock";
  heading?: string;
  cards?: Offering[];
}

export interface GalleryBlock extends SectionBase {
  _type: "galleryBlock";
  heading?: string;
}

export interface AboutBlock extends SectionBase {
  _type: "aboutBlock";
  heading?: string;
  body?: PortableTextBlock[];
  credentials?: string[];
  image?: SanityImageRef;
}

export interface DividerBlock extends SectionBase {
  _type: "dividerBlock";
}

export type Section =
  | HeroBlock
  | EventsBlock
  | OnTapBlock
  | OfferingsBlock
  | GalleryBlock
  | AboutBlock
  | DividerBlock;

export type SectionType = Section["_type"];

/** A section plus where its default copy is written. */
export interface Placed {
  section: Section;
  scope: EditScope;
}

/* ---------- Pinned photos (legacy) ---------- */

// The two gallery-shoot assets hard-wired into Hero and About before the
// builder existed. The migration copies them into block image fields.
export const PINNED_HERO_IMAGE =
  "image-600687a3a1747959048b8eb3b14f917ad2e3073b-2560x1707-jpg";
export const PINNED_ABOUT_IMAGE =
  "image-fc66f7f4d741bb78af4b98b31f4514f36047adc9-2048x2560-jpg";

export function imageRef(id: string, alt: string): SanityImageRef {
  return { _type: "image", asset: { _type: "reference", _ref: id }, alt };
}

/* ---------- Legacy adapter ---------- */

/** Block field → Site Settings field, per block type. */
export const LEGACY_FIELDS: Record<SectionType, Record<string, string>> = {
  heroBlock: {
    heading: "heroHeading",
    subheading: "heroSubheading",
    primaryCta: "heroPrimaryCta",
    secondaryCta: "heroSecondaryCta",
    image: "heroImage",
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
};

/**
 * Today's page, expressed as blocks, from the flat Site Settings fields.
 * Used when no Home Page document exists yet (and for the offline fallback).
 * The migration script writes exactly this to Content Lake.
 */
export function sectionsFromSettings(settings: SiteSettings): Section[] {
  return [
    {
      _key: "legacy-hero",
      _type: "heroBlock",
      heading: settings.heroHeading,
      subheading: settings.heroSubheading,
      primaryCta: settings.heroPrimaryCta,
      secondaryCta: settings.heroSecondaryCta,
      image: imageRef(
        PINNED_HERO_IMAGE,
        "Numbered tap handles branded with the Blue Ridge Beer Hub hop logo",
      ),
    },
    { _key: "legacy-divider-1", _type: "dividerBlock" },
    {
      _key: "legacy-events",
      _type: "eventsBlock",
      heading: settings.eventsHeading,
      weeklyHeading: settings.weeklyHeading,
    },
    {
      _key: "legacy-tap",
      _type: "onTapBlock",
      heading: settings.onTapHeading,
      blurb: settings.onTapBlurb,
      secondary: settings.onTapSecondary,
      cta: settings.onTapCta,
      tapCount: settings.tapCount,
      tapCountLabel: settings.tapCountLabel,
      tapCountFootnote: settings.tapCountFootnote,
      perks: settings.tapPerks,
    },
    {
      _key: "legacy-offerings",
      _type: "offeringsBlock",
      heading: settings.offeringsHeading,
      cards: settings.offerings?.map((card, i) => ({
        ...card,
        _key: card._key ?? `card-${i}`,
      })),
    },
    {
      _key: "legacy-gallery",
      _type: "galleryBlock",
      heading: settings.galleryHeading,
    },
    {
      _key: "legacy-about",
      _type: "aboutBlock",
      heading: settings.aboutHeading,
      body: settings.aboutBody,
      credentials: settings.credentials,
      image: imageRef(
        PINNED_ABOUT_IMAGE,
        "Jason and Charlotte outside the Hub under the orange OPEN flag",
      ),
    },
    { _key: "legacy-divider-2", _type: "dividerBlock" },
  ];
}

export function placeLegacy(settings: SiteSettings): Placed[] {
  return sectionsFromSettings(settings).map((section) => ({
    section,
    scope: legacyScope(LEGACY_FIELDS[section._type]),
  }));
}

export function placeHome(sections: Section[]): Placed[] {
  return sections.map((section) => ({
    section,
    scope: blockScope(section._key),
  }));
}

/* ---------- Anchors and nav ---------- */

// Partial on purpose: a type with no entry (PR 2's featureBlock) gets an
// anchor from its menu label or key instead.
const DEFAULT_ANCHOR: Partial<Record<SectionType, string | null>> = {
  heroBlock: "top",
  eventsBlock: "events",
  onTapBlock: "tap",
  offeringsBlock: "offer",
  galleryBlock: "photos",
  aboutBlock: "about",
  dividerBlock: null,
};

const DEFAULT_MENU_LABEL: Partial<Record<SectionType, string>> = {
  eventsBlock: "Events",
  onTapBlock: "On Tap",
  aboutBlock: "About",
};

export function slugify(text: string): string {
  return stegaClean(text)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * One `id` per section, unique across the page. Dividers get null. A
 * repeated type gets `-2`, `-3`… Hidden sections are skipped by callers;
 * this function only cares about uniqueness among what it's given.
 */
export function assignAnchors(sections: Section[]): Map<string, string | null> {
  const used = new Map<string, number>();
  const out = new Map<string, string | null>();
  for (const section of sections) {
    let base = DEFAULT_ANCHOR[section._type];
    if (base === undefined) {
      base = section.menuLabel?.trim()
        ? slugify(section.menuLabel)
        : `section-${section._key}`;
    }
    if (base === null) {
      out.set(section._key, null);
      continue;
    }
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    out.set(section._key, n === 1 ? base : `${base}-${n}`);
  }
  return out;
}

export interface NavItem {
  href: string;
  label: string;
}

export function visibleSections(sections: Section[]): Section[] {
  return sections.filter((s) => !s.hiddenOnSite);
}

/** Header menu: visible sections with a label, in page order, then Hours. */
export function navFromSections(sections: Section[]): NavItem[] {
  const visible = visibleSections(sections);
  const anchors = assignAnchors(visible);
  const items: NavItem[] = [];
  for (const section of visible) {
    const anchor = anchors.get(section._key);
    if (!anchor) continue;
    const custom = section.menuLabel?.trim();
    const label = custom || DEFAULT_MENU_LABEL[section._type];
    if (!label) continue;
    items.push({ href: `#${anchor}`, label });
  }
  items.push({ href: "#hours", label: "Hours" });
  return items;
}
```

- [ ] **Step 5: Run tests, expect pass**

Run: `npm test`
Expected: all previous tests plus 9 new passing.

- [ ] **Step 6: Type-check, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add src/lib/sections.ts src/lib/sections.test.ts src/lib/types.ts src/lib/fallback.ts
git commit -m "Add section block types, legacy adapter, anchor and nav derivation

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Editable learns `scope` + `field`

**Files:**

- Modify: `src/components/EditableField.tsx:70-110` (props + target resolution)
- Modify: `src/lib/editable.ts` (add `editAttribute`)
- Test: `src/lib/editable.test.ts` (append)

**Interfaces:**

- Consumes: `EditScope` (Task 2).
- Produces: `EditableFieldProps.scope?: EditScope`, `EditableFieldProps.field?: string`; `editAttribute(scope, field): string` for `data-sanity` on non-string values.

- [ ] **Step 1: Write the failing test** (append to `src/lib/editable.test.ts`)

```ts
import { blockScope } from "./edit-scope.ts";
import { editAttribute } from "./editable.ts";

test("editAttribute points the overlay at a keyed block field", () => {
  const attr = editAttribute(blockScope("k1"), "tapCount");
  assert.match(attr, /id=homePage/);
  assert.match(attr, /type=homePage/);
  // createDataAttribute spells a keyed segment as `sections:k1`.
  assert.equal(
    attr,
    "id=homePage;type=homePage;path=sections:k1.tapCount;base=%2F",
  );
});
```

Also in `src/lib/editable.ts`: delete `export const SITE_SETTINGS_ID = "siteSettings";` and its comment, and add `export { SITE_SETTINGS_ID } from "./edit-scope.ts";` so there is one definition. `EditableField.tsx` keeps importing it from `@/lib/editable`.

- [ ] **Step 2: Run, expect failure**

Run: `node --test src/lib/editable.test.ts`
Expected: FAIL, `editAttribute` is not exported.

- [ ] **Step 3: Implement**

In `src/lib/editable.ts`, after `siteSettingsField`:

```ts
import type { EditScope } from "./edit-scope.ts";

/**
 * `data-sanity` for values that carry no stega (numbers, booleans) inside a
 * block. Click-to-edit then opens the right field in the Studio pane.
 */
export function editAttribute(scope: EditScope, field: string): string {
  return createDataAttribute({
    id: scope.documentId,
    type: scope.documentType,
  })(scope.field(field));
}
```

In `src/components/EditableField.tsx`, add to `EditableFieldProps`:

```ts
  /**
   * Block-aware alternative to `path`/`documentId`/`documentType`: the
   * scope knows which document the block lives in and how to spell the
   * field's full path. `field` is the block-relative name, e.g. "heading"
   * or "perks[2]".
   */
  scope?: EditScope;
  field?: string;
```

and import `type EditScope` from `@/lib/edit-scope`. Change the `target` memo:

```ts
const target = useMemo(() => {
  const decoded = decodeEditTarget(value);
  if (decoded) return decoded;
  if (scope && field) {
    return {
      id: getPublishedId(scope.documentId),
      type: scope.documentType,
      path: scope.field(field),
    };
  }
  return path
    ? { id: getPublishedId(documentId), type: documentType, path }
    : null;
}, [value, scope, field, path, documentId, documentType]);
```

Add `scope, field` to the destructured props. `Editable.tsx` needs no change (it spreads props).

- [ ] **Step 4: Run, expect pass**

Run: `npm test && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/lib/editable.ts src/lib/editable.test.ts src/components/EditableField.tsx
git commit -m "Let Editable take a block scope and field name

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Hero becomes a block component

**Files:**

- Modify: `src/components/Hero.tsx` (whole file)
- Modify: `src/app/(site)/page.tsx` (pass the legacy hero block for now)

**Interfaces:**

- Produces: `Hero({ block, scope, settings, id, eventsHref })`.

- [ ] **Step 1: Rewrite `Hero.tsx`**

```tsx
import Image from "next/image";
import type { CSSProperties } from "react";

import { DEFAULT_COPY } from "@/lib/copy";
import type { EditScope } from "@/lib/edit-scope";
import type { HeroBlock } from "@/lib/sections";
import type { SiteSettings } from "@/lib/types";
import { urlFor } from "@/sanity/image";

import { ArrowUpRight } from "./ArrowUpRight";
import { Editable } from "./Editable";
import { MixedHeading } from "./MixedHeading";
import { OpenStatus } from "./OpenStatus";

export function Hero({
  block,
  scope,
  settings,
  id = "top",
  eventsHref,
}: {
  block: HeroBlock;
  scope: EditScope;
  /** Hours (open-now chip) and the Untappd link live on Site Settings. */
  settings: SiteSettings;
  id?: string;
  /** Anchor of the first visible Events block; the outlined button hides without one. */
  eventsHref?: string;
}) {
  const heading = block.heading ?? DEFAULT_COPY.heroHeading;
  return (
    <section id={id} className="mx-auto max-w-6xl px-5 sm:px-10 py-14 sm:py-16">
      {block.image?.asset ? (
        <div className="animate-rise relative mb-10 h-44 overflow-hidden rounded-2xl sm:mb-12 sm:h-[clamp(200px,26vh,320px)]">
          <Image
            src={urlFor(block.image).width(1840).height(900).fit("crop").url()}
            alt={block.image.alt ?? ""}
            fill
            preload
            sizes="(min-width: 1152px) 1072px, 100vw"
            className="object-cover object-[50%_45%]"
          />
        </div>
      ) : null}
      {/* items-end locks the copy/CTA column to the headline's baseline. */}
      <div className="grid items-end gap-8 md:grid-cols-[3fr_2fr] md:gap-10">
        <div>
          {/* min-height reserves the chip's spot — it mounts client-side. */}
          <div className="mb-5 min-h-5">
            <OpenStatus hours={settings.hours} />
          </div>
          <h1 className="font-display text-5xl uppercase leading-[0.95] text-navy sm:text-7xl lg:text-8xl">
            <Editable
              value={heading}
              scope={scope}
              field="heading"
              label="Headline"
              multiline
              className="block"
            >
              <MixedHeading stagger text={heading} />
            </Editable>
          </h1>
        </div>
        <div className="md:pb-2">
          {block.subheading ? (
            <p
              className="animate-rise max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg"
              style={{ "--ad": "240ms" } as CSSProperties}
            >
              <Editable
                value={block.subheading}
                scope={scope}
                field="subheading"
                label="Supporting line"
                multiline
              />
            </p>
          ) : null}
          <div
            className="animate-rise mt-7 flex flex-wrap items-center gap-4"
            style={{ "--ad": "310ms" } as CSSProperties}
          >
            {settings.untappdUrl ? (
              <a
                href={settings.untappdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 font-display text-base tracking-wide text-cream transition-colors hover:bg-navy-deep"
              >
                <Editable
                  value={block.primaryCta ?? DEFAULT_COPY.heroPrimaryCta}
                  scope={scope}
                  field="primaryCta"
                  label="Main button label"
                />
                <ArrowUpRight />
              </a>
            ) : null}
            {eventsHref ? (
              <a
                href={eventsHref}
                className="hidden rounded-full border-2 border-navy px-6 py-3 font-display text-base tracking-wide text-navy transition-colors hover:bg-navy hover:text-cream sm:inline-block"
              >
                <Editable
                  value={block.secondaryCta ?? DEFAULT_COPY.heroSecondaryCta}
                  scope={scope}
                  field="secondaryCta"
                  label="Second button label"
                />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
```

The pinned-asset constant and its comment leave this file; `sections.ts` owns it now.

- [ ] **Step 2: Wire page.tsx temporarily**

In `src/app/(site)/page.tsx`, after the fallback block, add:

```ts
const placed = placeLegacy(settings);
const heroPlaced = placed.find((p) => p.section._type === "heroBlock");
```

and replace `<Hero settings={settings} />` with:

```tsx
{
  heroPlaced && heroPlaced.section._type === "heroBlock" ? (
    <Hero
      block={heroPlaced.section}
      scope={heroPlaced.scope}
      settings={settings}
      eventsHref="#events"
    />
  ) : null;
}
```

Import `placeLegacy` from `@/lib/sections`. This scaffolding is replaced in Task 11.

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/components/Hero.tsx "src/app/(site)/page.tsx"
git commit -m "Hero renders from a hero block

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: On Tap block component

**Files:**

- Modify: `src/components/OnTapSection.tsx` (whole file)
- Modify: `src/app/(site)/page.tsx`

**Interfaces:**

- Produces: `OnTapSection({ block, scope, untappdUrl, id })`.

- [ ] **Step 1: Rewrite `OnTapSection.tsx`**

```tsx
import type { CSSProperties } from "react";

import { DEFAULT_COPY } from "@/lib/copy";
import type { EditScope } from "@/lib/edit-scope";
import { editAttribute } from "@/lib/editable";
import type { OnTapBlock } from "@/lib/sections";

import { ArrowUpRight } from "./ArrowUpRight";
import { Editable } from "./Editable";

export function OnTapSection({
  block,
  scope,
  untappdUrl,
  id = "tap",
}: {
  block: OnTapBlock;
  scope: EditScope;
  untappdUrl?: string;
  id?: string;
}) {
  const perks = block.perks?.length ? block.perks : DEFAULT_COPY.tapPerks;

  return (
    <section id={id} className="mx-auto max-w-6xl px-5 sm:px-10 py-20">
      <div
        data-reveal-group
        className="grid items-center gap-10 md:grid-cols-2"
      >
        <div>
          <h2 className="font-display text-5xl uppercase text-navy sm:text-6xl">
            <Editable
              value={block.heading ?? DEFAULT_COPY.onTapHeading}
              scope={scope}
              field="heading"
              label="On Tap heading"
            />
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/80">
            <Editable
              value={block.blurb ?? DEFAULT_COPY.onTapBlurb}
              scope={scope}
              field="blurb"
              label="On Tap paragraph"
              multiline
            />
          </p>
          <p className="mt-3 max-w-lg text-sm text-ink/60">
            <Editable
              value={block.secondary ?? DEFAULT_COPY.onTapSecondary}
              scope={scope}
              field="secondary"
              label="On Tap second line"
              multiline
            />
          </p>
          {untappdUrl ? (
            <a
              href={untappdUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-display text-base tracking-wide text-cream transition-colors hover:bg-amber-bright hover:text-navy-deep"
            >
              <Editable
                value={block.cta ?? DEFAULT_COPY.onTapCta}
                scope={scope}
                field="cta"
                label="Tap list button label"
              />
              <ArrowUpRight />
            </a>
          ) : null}
        </div>
        <div
          className="rounded-2xl bg-navy p-8 text-cream shadow-xl sm:p-10"
          style={{ "--rd": "120ms" } as CSSProperties}
        >
          {/* A number carries no stega, so the overlay needs a pointer of
              its own to make the tap count clickable. */}
          <div
            data-sanity={editAttribute(scope, "tapCount")}
            className="font-display text-[7rem] leading-none text-amber-bright"
          >
            {block.tapCount ?? 16}
          </div>
          <div className="mt-1 font-display text-xl">
            <Editable
              value={block.tapCountLabel ?? DEFAULT_COPY.tapCountLabel}
              scope={scope}
              field="tapCountLabel"
              label="Label under the tap count"
            />
          </div>
          <p className="mt-3 text-sm text-cream/70">
            <Editable
              value={block.tapCountFootnote ?? DEFAULT_COPY.tapCountFootnote}
              scope={scope}
              field="tapCountFootnote"
              label="Tap count footnote"
            />
          </p>
          {perks.length ? (
            <ul className="mt-6 space-y-2 border-t border-cream/15 pt-5 text-sm font-semibold text-cream/85">
              {perks.map((perk, i) => (
                <li key={i}>
                  <Editable
                    value={perk}
                    scope={scope}
                    field={`perks[${i}]`}
                    label={`Tap card line ${i + 1}`}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire page.tsx** the same way as Task 5 (find the `onTapBlock` in `placed`, pass `block`, `scope`, `untappdUrl={settings.untappdUrl}`).

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/components/OnTapSection.tsx "src/app/(site)/page.tsx"
git commit -m "On Tap renders from an onTap block

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Offerings and Gallery block components

**Files:**

- Modify: `src/components/OfferingsSection.tsx`, `src/components/GallerySection.tsx`
- Modify: `src/app/(site)/page.tsx`

**Interfaces:**

- Produces: `OfferingsSection({ block, scope, id })`, `GallerySection({ block, scope, images, id })`.

- [ ] **Step 1: `OfferingsSection.tsx`**

Props become `{ block: OfferingsBlock; scope: EditScope; id?: string }`. Body:

```tsx
const cards = block.cards ?? [];
if (cards.length === 0) return null;
return (
  <section id={id} className="mx-auto max-w-6xl px-5 sm:px-10 pb-20">
    <h2
      data-reveal
      className="font-display text-5xl uppercase text-navy sm:text-6xl"
    >
      <Editable
        value={block.heading ?? DEFAULT_COPY.offeringsHeading}
        scope={scope}
        field="heading"
        label="Offerings heading"
      />
    </h2>
    <div data-reveal-group className="mt-10 grid gap-5 md:grid-cols-3">
      {cards.map((card, i) => {
        const item = card._key ? `cards[_key=="${card._key}"]` : `cards[${i}]`;
        return (
          <div
            key={card._key ?? card.title}
            className={`rounded-2xl p-7 ${CARD_WASHES[i % CARD_WASHES.length]}`}
            style={{ "--rd": `${i * 80}ms` } as CSSProperties}
          >
            <h3 className="font-display text-2xl text-navy-deep">
              <Editable
                value={card.title}
                scope={scope}
                field={`${item}.title`}
                label="Card title"
              />
            </h3>
            <p className="mt-3 leading-relaxed text-navy-deep/80">
              <Editable
                value={card.description}
                scope={scope}
                field={`${item}.description`}
                label="Card description"
                multiline
              />
            </p>
          </div>
        );
      })}
    </div>
  </section>
);
```

`id` has no default (offerings had no anchor before); the renderer passes `anchors.get(key)`.

- [ ] **Step 2: `GallerySection.tsx`**

Props `{ block: GalleryBlock; scope: EditScope; images: GalleryImage[]; id?: string }`. Only two edits: `<section id={id} …>` and the heading `Editable` becomes `value={block.heading ?? DEFAULT_COPY.galleryHeading} scope={scope} field="heading"`. Photo captions keep their `documentId`/`documentType`/`path` props (they live on Gallery Photo docs).

- [ ] **Step 3: Wire page.tsx** for both (find in `placed` by `_type`, pass `block`/`scope`; gallery also `images={gallery}`).

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/components/OfferingsSection.tsx src/components/GallerySection.tsx "src/app/(site)/page.tsx"
git commit -m "Offerings and Gallery render from blocks

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: About block component

**Files:**

- Modify: `src/components/AboutSection.tsx`
- Modify: `src/app/(site)/page.tsx`

**Interfaces:**

- Produces: `AboutSection({ block, scope, id })`.

- [ ] **Step 1: Edit `AboutSection.tsx`**

Props `{ block: AboutBlock; scope: EditScope; id?: string }` (default `id = "about"`). Replace every `settings.x` with `block.x`. Heading `Editable`: `scope={scope} field="heading"`. Paragraphs: keep `<Editable value={text} label="About paragraph" multiline />` (their target comes from the stega on the span text; no default path existed before either). Credentials: `scope={scope} field={`credentials[${i}]`}`. Photo:

```tsx
{
  block.image?.asset ? (
    <div
      className="flex justify-center pt-2 md:pt-6"
      style={{ "--rd": "120ms" } as CSSProperties}
    >
      <div className="-rotate-2 drop-shadow-lg">
        <Image
          src={urlFor(block.image).width(600).height(750).fit("crop").url()}
          alt={block.image.alt ?? ""}
          width={600}
          height={750}
          className="h-auto w-56 rounded-2xl md:w-[300px]"
        />
      </div>
    </div>
  ) : null;
}
```

Delete the `OWNERS_IMAGE` constant and its comment.

- [ ] **Step 2: Wire page.tsx**, verify, commit

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/components/AboutSection.tsx "src/app/(site)/page.tsx"
git commit -m "About renders from an about block

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Events block component

**Files:**

- Modify: `src/components/EventsSection.tsx:135-160` (props) and the two heading `Editable`s
- Modify: `src/app/(site)/page.tsx`

**Interfaces:**

- Produces: `EventsSection({ block, scope, events, weeklyEvents, instagramUrl, location, id })`.

- [ ] **Step 1: Edit props**

Replace `heading?: string; weeklyHeading?: string;` with `block: EventsBlock; scope: EditScope; id?: string;` (default `id = "events"`). `<section id={id} …>`. Heading: `value={block.heading ?? DEFAULT_COPY.eventsHeading} scope={scope} field="heading"`. Weekly heading: `value={block.weeklyHeading ?? DEFAULT_COPY.weeklyHeading} scope={scope} field="weeklyHeading"`. Event and weekly rows are unchanged (they target their own documents).

- [ ] **Step 2: Wire page.tsx**, verify, commit

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/components/EventsSection.tsx "src/app/(site)/page.tsx"
git commit -m "Events renders from an events block

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Header takes a derived nav

**Files:**

- Modify: `src/components/Header.tsx`
- Modify: `src/app/(site)/page.tsx`

- [ ] **Step 1: Edit `Header.tsx`**

Delete the `NAV` constant. Props: `{ name: string; nav: NavItem[] }` (import `type NavItem` from `@/lib/sections`). Map over `nav` instead of `NAV`.

- [ ] **Step 2: page.tsx**: `<Header name={…} nav={navFromSections(placed.map((p) => p.section))} />`.

- [ ] **Step 3: Verify, commit**

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/components/Header.tsx "src/app/(site)/page.tsx"
git commit -m "Derive the header menu from the page's sections

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Sections renderer and the Home Page query

**Files:**

- Create: `src/components/Sections.tsx`
- Modify: `src/sanity/queries.ts` (add `HOME_PAGE_QUERY`)
- Modify: `src/app/(site)/page.tsx` (final shape)

**Interfaces:**

- Consumes: every block component from Tasks 5–9; `placeHome`, `placeLegacy`, `assignAnchors` from Task 3.
- Produces: `Sections({ placed, ctx })`, `SectionContext`, `HOME_PAGE_QUERY`, `HomePage { sections?: Section[] }` type.

- [ ] **Step 1: Query**

```ts
// append to src/sanity/queries.ts
/**
 * The block list that composes the homepage. `...` keeps every block field
 * flowing through without this projection changing per block type; the
 * stega on each string still names its exact path.
 */
export const HOME_PAGE_QUERY = defineQuery(
  `*[_type == "homePage"][0]{ sections[]{ ... } }`,
);
```

- [ ] **Step 2: Renderer**

```tsx
// src/components/Sections.tsx
import { assignAnchors, type Placed } from "@/lib/sections";
import type {
  GalleryImage,
  HubEvent,
  SiteSettings,
  WeeklyEvent,
} from "@/lib/types";

import { AboutSection } from "./AboutSection";
import { EventsSection } from "./EventsSection";
import { GallerySection } from "./GallerySection";
import { Hero } from "./Hero";
import { OfferingsSection } from "./OfferingsSection";
import { OnTapSection } from "./OnTapSection";
import { Ridgeline } from "./Ridgeline";

/** Page-level data that blocks read but don’t own. */
export interface SectionContext {
  settings: SiteSettings;
  events: HubEvent[];
  weeklyEvents: WeeklyEvent[];
  gallery: GalleryImage[];
}

export function Sections({
  placed,
  ctx,
}: {
  placed: Placed[];
  ctx: SectionContext;
}) {
  const shown = placed.filter((p) => !p.section.hiddenOnSite);
  const anchors = assignAnchors(shown.map((p) => p.section));
  const eventsKey = shown.find((p) => p.section._type === "eventsBlock")
    ?.section._key;
  const eventsHref = eventsKey ? `#${anchors.get(eventsKey)}` : undefined;
  const location = [
    ctx.settings.name ?? "Blue Ridge Beer Hub",
    ctx.settings.addressLine1,
    ctx.settings.addressLine2,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      {shown.map(({ section, scope }) => {
        const id = anchors.get(section._key) ?? undefined;
        switch (section._type) {
          case "heroBlock":
            return (
              <Hero
                key={section._key}
                block={section}
                scope={scope}
                settings={ctx.settings}
                id={id}
                eventsHref={eventsHref}
              />
            );
          case "dividerBlock":
            return <Ridgeline key={section._key} />;
          case "eventsBlock":
            return (
              <EventsSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
                events={ctx.events}
                weeklyEvents={ctx.weeklyEvents}
                instagramUrl={ctx.settings.instagramUrl}
                location={location}
              />
            );
          case "onTapBlock":
            return (
              <OnTapSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
                untappdUrl={ctx.settings.untappdUrl}
              />
            );
          case "offeringsBlock":
            return (
              <OfferingsSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
              />
            );
          case "galleryBlock":
            return (
              <GallerySection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
                images={ctx.gallery}
              />
            );
          case "aboutBlock":
            return (
              <AboutSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
```

- [ ] **Step 3: Final `page.tsx`**

```tsx
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Header } from "@/components/Header";
import { HoursFooter } from "@/components/HoursFooter";
import { RevealObserver } from "@/components/RevealObserver";
import { Sections } from "@/components/Sections";
import {
  FALLBACK_EVENTS,
  FALLBACK_SETTINGS,
  FALLBACK_WEEKLY,
} from "@/lib/fallback";
import { startOfTodayIso } from "@/lib/format";
import { localBusinessJsonLd } from "@/lib/jsonld";
import {
  navFromSections,
  placeHome,
  placeLegacy,
  type Placed,
  type Section,
} from "@/lib/sections";
import { SITE_URL } from "@/lib/site";
import type {
  GalleryImage,
  HubEvent,
  SiteSettings,
  WeeklyEvent,
} from "@/lib/types";
import { sanityFetch } from "@/sanity/live";
import {
  EVENTS_QUERY,
  GALLERY_QUERY,
  HOME_PAGE_QUERY,
  SITE_SETTINGS_QUERY,
  WEEKLY_EVENTS_QUERY,
} from "@/sanity/queries";

interface HomePageDoc {
  sections?: Section[];
}

export default async function HomePage() {
  let settings: SiteSettings = {};
  let events: HubEvent[] = [];
  let weeklyEvents: WeeklyEvent[] = [];
  let gallery: GalleryImage[] = [];
  let home: HomePageDoc | null = null;

  try {
    const [settingsRes, eventsRes, weeklyRes, galleryRes, homeRes] =
      await Promise.all([
        sanityFetch({ query: SITE_SETTINGS_QUERY }),
        sanityFetch({
          query: EVENTS_QUERY,
          params: { from: startOfTodayIso() },
        }),
        sanityFetch({ query: WEEKLY_EVENTS_QUERY }),
        sanityFetch({ query: GALLERY_QUERY }),
        sanityFetch({ query: HOME_PAGE_QUERY }),
      ]);
    settings = (settingsRes.data ?? {}) as SiteSettings;
    events = (eventsRes.data ?? []) as HubEvent[];
    weeklyEvents = (weeklyRes.data ?? []) as WeeklyEvent[];
    gallery = (galleryRes.data ?? []) as GalleryImage[];
    home = (homeRes.data ?? null) as HomePageDoc | null;
  } catch (error) {
    // If Sanity is unreachable the site still renders full fallback content.
    console.error("Sanity fetch failed; rendering fallbacks", error);
  }

  // Sanity unreachable or dataset not seeded yet → serve the baked-in copy.
  if (!settings.name) {
    settings = FALLBACK_SETTINGS;
    events = FALLBACK_EVENTS;
    weeklyEvents = FALLBACK_WEEKLY;
    home = null;
  }

  // No Home Page document yet (pre-migration) → today's page, synthesized
  // from the legacy Site Settings fields. See lib/sections.ts.
  const placed: Placed[] = home?.sections?.length
    ? placeHome(home.sections)
    : placeLegacy(settings);

  const jsonLd = JSON.stringify(
    localBusinessJsonLd(settings, SITE_URL),
  ).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <AnnouncementBanner text={settings.announcement} />
      <Header
        name={settings.name ?? "Blue Ridge Beer Hub"}
        nav={navFromSections(placed.map((p) => p.section))}
      />
      <main>
        <Sections
          placed={placed}
          ctx={{ settings, events, weeklyEvents, gallery }}
        />
        <HoursFooter settings={settings} />
      </main>
      <RevealObserver />
    </>
  );
}
```

Both ridgelines are now divider blocks (`legacy-divider-1`, `legacy-divider-2`), so `page.tsx` no longer imports `Ridgeline`.

- [ ] **Step 4: Run the page**

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN || ~/.claude/scripts/ghostty-tab.sh 'npm run dev' /Users/skylar/projects/blue-ridge-beer-hub
```

Open `http://localhost:3000` in the in-app browser. Expect the page exactly as before (nav now Events · On Tap · About · Hours). Check the console for hydration errors. Open `http://localhost:3000/studio`, turn Edit on, click a heading, type, confirm the Studio form updates (the adapter path keeps writing to Site Settings).

- [ ] **Step 5: Verify, commit**

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/components/Sections.tsx src/sanity/queries.ts "src/app/(site)/page.tsx"
git commit -m "Render the homepage from a section list

Reads the Home Page document when it exists; otherwise synthesizes the same
blocks from the legacy Site Settings fields so nothing changes until the
migration runs.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Home Page schema, Studio structure, Presentation locations

**Files:**

- Create: `src/sanity/schemaTypes/blocks/common.ts`, `heroBlock.ts`, `eventsBlock.ts`, `onTapBlock.ts`, `offeringsBlock.ts`, `galleryBlock.ts`, `aboutBlock.ts`, `dividerBlock.ts`
- Create: `src/sanity/schemaTypes/homePage.ts`
- Modify: `src/sanity/schemaTypes/index.ts`, `src/sanity/structure.ts`, `src/sanity/presentation.ts`

**Interfaces:**

- Produces: schema type names exactly matching `Section["_type"]` values and field names in `src/lib/sections.ts`.

- [ ] **Step 1: Common fields**

```ts
// src/sanity/schemaTypes/blocks/common.ts
import { defineField } from "sanity";

/** Fields every section shares. Sanity objects don't inherit, so spread these. */
export function sectionFields() {
  return [
    defineField({
      name: "hiddenOnSite",
      title: "Hide for now",
      type: "boolean",
      initialValue: false,
      description:
        "Keeps the section but takes it off the site. Handy for seasonal things you’ll bring back.",
    }),
    defineField({
      name: "menuLabel",
      title: "Menu label",
      type: "string",
      description:
        "What the top-of-page menu calls this section. Leave empty to use the usual name (or, for sections that aren’t in the menu by default, to keep them out).",
    }),
  ];
}

export function sectionPreview(title: string, headingField = "heading") {
  return {
    select: { heading: headingField, hidden: "hiddenOnSite" },
    prepare({ heading, hidden }: { heading?: string; hidden?: boolean }) {
      return {
        title: heading || title,
        subtitle: [title, hidden ? "Hidden" : null].filter(Boolean).join(" · "),
      };
    },
  };
}
```

- [ ] **Step 2: Block types** (one file each)

```ts
// heroBlock.ts
import { defineField, defineType } from "sanity";
import { sectionFields, sectionPreview } from "./common";

export const heroBlock = defineType({
  name: "heroBlock",
  title: "Top of page",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Big headline",
      type: "text",
      rows: 3,
      description:
        "The large text at the top. Each new line becomes its own row.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subheading",
      title: "Supporting line",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "primaryCta",
      title: "Main button label",
      type: "string",
      initialValue: "See what’s on tap",
      description: "The filled button. It opens Untappd.",
    }),
    defineField({
      name: "secondaryCta",
      title: "Second button label",
      type: "string",
      initialValue: "Upcoming events",
      description:
        "The outlined button. It jumps to the events section, and hides if there isn’t one.",
    }),
    defineField({
      name: "image",
      title: "Wide photo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Describe this photo",
          type: "string",
        }),
      ],
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("Top of page"),
});
```

```ts
// eventsBlock.ts
export const eventsBlock = defineType({
  name: "eventsBlock",
  title: "Events",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "Coming up at the Hub",
    }),
    defineField({
      name: "weeklyHeading",
      title: "Weekly events heading",
      type: "string",
      initialValue: "Every week",
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("Events"),
});
```

```ts
// onTapBlock.ts
export const onTapBlock = defineType({
  name: "onTapBlock",
  title: "On tap",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "On tap right now",
    }),
    defineField({
      name: "blurb",
      title: "Paragraph",
      type: "text",
      rows: 3,
      description: "The tap list itself lives on Untappd — this is the intro.",
    }),
    defineField({
      name: "secondary",
      title: "Second line",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "cta",
      title: "Tap list button label",
      type: "string",
      initialValue: "Open the live tap list",
    }),
    defineField({
      name: "tapCount",
      title: "Number of taps",
      type: "number",
      initialValue: 16,
      validation: (rule) => rule.min(1).max(99),
    }),
    defineField({
      name: "tapCountLabel",
      title: "Label under the big number",
      type: "string",
      initialValue: "taps pouring right now*",
    }),
    defineField({
      name: "tapCountFootnote",
      title: "Footnote",
      type: "string",
      initialValue: "*give or take. The live list knows best.",
    }),
    defineField({
      name: "perks",
      title: "Short list on the navy card",
      type: "array",
      of: [{ type: "string" }],
      validation: (rule) => rule.max(5),
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("On tap"),
});
```

```ts
// offeringsBlock.ts — cards reuse the shape of the legacy `offering` object
export const offeringsBlock = defineType({
  name: "offeringsBlock",
  title: "What we offer",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "What we pour & stock",
    }),
    defineField({
      name: "cards",
      title: "Cards",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "offering",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 3,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "title", subtitle: "description" } },
        }),
      ],
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("What we offer"),
});
```

```ts
// galleryBlock.ts
export const galleryBlock = defineType({
  name: "galleryBlock",
  title: "Photos",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "Inside the Hub",
      description:
        "The photos themselves live under Gallery Photos in Structure.",
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("Photos"),
});
```

```ts
// aboutBlock.ts
export const aboutBlock = defineType({
  name: "aboutBlock",
  title: "About",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "About the Hub",
    }),
    defineField({
      name: "body",
      title: "Text",
      type: "array",
      of: [
        {
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
        },
      ],
    }),
    defineField({
      name: "credentials",
      title: "Trust badges",
      type: "array",
      of: [{ type: "string" }],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Describe this photo",
          type: "string",
        }),
      ],
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("About"),
});
```

```ts
// dividerBlock.ts
export const dividerBlock = defineType({
  name: "dividerBlock",
  title: "Mountain divider",
  type: "object",
  fields: [...sectionFields()],
  preview: {
    select: { hidden: "hiddenOnSite" },
    prepare: ({ hidden }: { hidden?: boolean }) => ({
      title: "Mountain divider",
      subtitle: hidden ? "Hidden" : undefined,
    }),
  },
});
```

Add the missing `import { defineArrayMember, defineField, defineType } from "sanity";` and `import { sectionFields, sectionPreview } from "./common";` lines to each file.

- [ ] **Step 3: Home Page document**

```ts
// src/sanity/schemaTypes/homePage.ts
import { defineArrayMember, defineField, defineType } from "sanity";

interface Sec {
  _type?: string;
}

export const homePage = defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",
  fields: [
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      description:
        "The page, top to bottom. Drag to reorder. Add sections with the + button; open one to change its words or hide it.",
      of: [
        defineArrayMember({ type: "heroBlock" }),
        defineArrayMember({ type: "eventsBlock" }),
        defineArrayMember({ type: "onTapBlock" }),
        defineArrayMember({ type: "offeringsBlock" }),
        defineArrayMember({ type: "galleryBlock" }),
        defineArrayMember({ type: "aboutBlock" }),
        defineArrayMember({ type: "dividerBlock" }),
      ],
      validation: (rule) => [
        rule.min(1).error("The page needs at least one section."),
        rule
          .custom((sections?: Sec[]) => {
            const counts = new Map<string, number>();
            for (const s of sections ?? []) {
              if (s._type === "eventsBlock" || s._type === "galleryBlock") {
                counts.set(s._type, (counts.get(s._type) ?? 0) + 1);
              }
            }
            const dup = [...counts].find(([, n]) => n > 1)?.[0];
            return dup
              ? `${dup === "eventsBlock" ? "Events" : "Photos"} is on the page twice — both copies show the same list.`
              : true;
          })
          .warning(),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Home Page" }) },
});
```

- [ ] **Step 4: Register, structure, presentation**

`index.ts`: import all eight block types and `homePage`; add them to `schemaTypes` (blocks before `homePage`).

`structure.ts`: first item becomes

```ts
      S.listItem()
        .title("Home Page")
        .id("homePage")
        .child(S.document().schemaType("homePage").documentId("homePage")),
```

followed by the existing Site Settings item, then the divider and lists.

`presentation.ts` `locations`: add

```ts
    homePage: defineLocations({
      message: "The Home Page is the homepage, top to bottom.",
      locations: [{ title: "Homepage", href: "/" }],
    }),
```

Leave `mainDocuments` on `siteSettings` (spec: Deviations).

- [ ] **Step 5: Check the Studio**

Open `http://localhost:3000/studio`, click Structure → Home Page. Expect an empty Sections array with a + menu listing the seven block types. Do **not** publish anything from here; adding a section would flip the live page off the adapter.

- [ ] **Step 6: Verify, commit**

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/sanity
git commit -m "Add the Home Page document and its section block schemas

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: Migration script

**Files:**

- Create: `scripts/migrate-to-sections.ts`
- Modify: `package.json` (add `"migrate:sections": "node --env-file=.env.local scripts/migrate-to-sections.ts"`)
- Modify: `.gitignore` (nothing; the token is read from the environment)

**Interfaces:**

- Consumes: `sectionsFromSettings`, `HOME_PAGE_ID` from `src/lib/sections.ts`/`edit-scope.ts` (relative `.ts` imports; no `@/`).

- [ ] **Step 1: Write the script**

```ts
// scripts/migrate-to-sections.ts
/**
 * One-shot: move the homepage from flat Site Settings fields into a Home
 * Page document of section blocks, and delete the two Gallery Photo docs
 * whose assets the Hero and About blocks now own.
 *
 *   SANITY_API_WRITE_TOKEN=… npm run migrate:sections            # dry run
 *   SANITY_API_WRITE_TOKEN=… npm run migrate:sections -- --apply # write
 *
 * Refuses to overwrite an existing Home Page unless --force is passed.
 * Everything it will write or delete is printed first.
 */
import { createClient } from "@sanity/client";

import { HOME_PAGE_ID } from "../src/lib/edit-scope.ts";
import { sectionsFromSettings } from "../src/lib/sections.ts";
import type { SiteSettings } from "../src/lib/types";

const PINNED_GALLERY_DOCS = [
  "galleryImage-tap-handles",
  "galleryImage-owners-open-flag",
];

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const force = args.has("--force");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
// A dry run only reads, so the Viewer token from .env.local is enough.
const token =
  process.env.SANITY_API_WRITE_TOKEN ??
  (apply ? undefined : process.env.SANITY_API_READ_TOKEN);
if (!projectId || !dataset) throw new Error("Missing NEXT_PUBLIC_SANITY_* env");
if (!token)
  throw new Error("Set SANITY_API_WRITE_TOKEN (Editor token) to apply");

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-09-02",
  token,
  useCdn: false,
  perspective: "published",
});

const settings = await client.fetch<SiteSettings | null>(
  `*[_type == "siteSettings"][0]{
    heroHeading, heroSubheading, heroPrimaryCta, heroSecondaryCta,
    eventsHeading, weeklyHeading,
    onTapHeading, onTapBlurb, onTapSecondary, onTapCta,
    tapCount, tapCountLabel, tapCountFootnote, tapPerks,
    offeringsHeading, offerings[]{_key, title, description},
    galleryHeading, aboutHeading, aboutBody, credentials
  }`,
);
if (!settings) throw new Error("No published Site Settings document");

const existing = await client.getDocument(HOME_PAGE_ID);
if (existing && !force) {
  throw new Error("Home Page already exists. Pass --force to overwrite it.");
}

const doc = {
  _id: HOME_PAGE_ID,
  _type: "homePage",
  sections: sectionsFromSettings(settings),
};

const deletions: string[] = [];
for (const id of PINNED_GALLERY_DOCS) {
  if (await client.getDocument(id)) deletions.push(id);
}

console.log(`${apply ? "WRITING" : "DRY RUN"} → ${projectId}/${dataset}`);
console.log("\ncreateOrReplace:");
console.log(JSON.stringify(doc, null, 2));
console.log("\ndelete:", deletions.length ? deletions.join(", ") : "(nothing)");

if (!apply) {
  console.log("\nNothing written. Re-run with --apply to commit.");
  process.exit(0);
}

let tx = client.transaction().createOrReplace(doc);
for (const id of deletions) tx = tx.delete(id);
const result = await tx.commit();
console.log("\nCommitted transaction", result.transactionId);
```

- [ ] **Step 2: Dry-run against the live dataset** (read-only; the script exits before writing)

```bash
npm run migrate:sections
```

`--env-file=.env.local` supplies the project id, dataset, and the Viewer token (`SANITY_API_READ_TOKEN`), which is all a dry run needs. Expected output: the eight-section document with real live copy, and the two deletions. Confirm `offerings[]._key` values are the live ones, not `card-0`.

- [ ] **Step 3: Commit** (script only; never commit a token)

```bash
git add scripts/migrate-to-sections.ts package.json
git commit -m "Add the one-shot migration to Home Page sections

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: Stretch — on-page drag to reorder (time-boxed, 60 minutes)

**Files:**

- Possibly modify: `src/components/Sections.tsx` (wrap each block in a `<div data-sanity=…>`), `src/lib/editable.ts`.

`@sanity/visual-editing` 6.1.2 ships overlay drag-and-drop for array items (`OverlayMsgDragStart`, `DragInsertPosition`, and an element context menu in `dist/types-*.d.ts`). It works when an element's `data-sanity` resolves to an array item path and the Presentation tool can load the schema.

- [ ] **Step 1: Read the package's own notes** — `grep -rn "drag\|contextMenu" node_modules/@sanity/visual-editing/README.md` and the changelog.
- [ ] **Step 2: Try it** — in `Sections.tsx`, only when `placed[0].scope.documentId === "homePage"`, wrap each rendered block: `<div data-sanity={createDataAttribute({ id: "homePage", type: "homePage" })(`sections[_key=="${section._key}"]`)}>`. Temporarily add one section in Studio (unpublished draft is enough in Presentation) to test.
- [ ] **Step 3: Exit criterion** — dragging a block in the preview reorders `sections` in the Studio form, and right-click shows Remove/Duplicate. If yes, keep the wrapper (a `div` with no classes; verify no layout change) and commit. If not within the box, revert and note in the PR.

```bash
git commit -am "Enable on-page drag to reorder sections in the editor

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 15: Owners' guide and README

**Files:**

- Modify: `UPDATING.md`
- Modify: `README.md` "How content works"
- Create: `public/guide/studio-sections.webp`, `public/guide/studio-section-add.webp`, `public/guide/studio-section-open.webp` via `scripts/guide-figures.mjs`
- Modify: `scripts/guide-figures.mjs` (three new entries), `src/app/guide/figures.json` (written by the script)

- [ ] **Step 1: UPDATING.md edits**

In "What do you want to do?" add after the words link: `- [Add, move, or hide a section of the page](#the-sections-of-the-page)`.

In "A tour of the editor" item 3, replace with: `3. **Tabs and Home Page.** The words on the page live under **Home Page**, one entry per section. Your name, hours, and links live under **Site Settings**, split into tabs.`

New section, inserted before "## The announcement banner":

```markdown
## The sections of the page

The homepage is a stack of sections — the big headline, events, on tap, the
photos, and so on. You can reorder them, hide one for a while, or add a new
one, all from **Structure → Home Page**.

![Home Page: every section of the site, top to bottom.](public/guide/studio-sections.webp)

- **Reorder:** drag a section by the handle on its left.
- **Hide for now:** open a section and tick **Hide for now**. It stays in the
  list but comes off the site. Untick to bring it back.
- **Add:** press **Add item** at the bottom of the list and pick a kind of
  section. The new one lands at the end; drag it where you want it.
- **Remove:** the three dots on a section → **Remove**. If you might want it
  back, hide it instead.

![Add item lists the kinds of section you can put on the page.](public/guide/studio-section-add.webp)

Each section’s words are inside it — open a section to see them. Clicking the
words on the page still works and opens the same place.

![One section opened: its words, its photo, and the Hide for now switch.](public/guide/studio-section-open.webp)

> **Tip:** The menu across the top of the site follows the page. Hide a
> section and its menu entry goes too. **Menu label** inside a section renames
> its entry.

Publish when it looks right. The page updates as you drag, so you can try an
order and discard it if you don’t like it.
```

Replace the paragraph starting "The other tabs — Top of Page, On Tap, About…" with: `The writing for each section of the site — the tap count, the intro paragraphs, the offer cards, the trust badges — lives under **Home Page**, one entry per section. Everything there can also be changed by clicking it on the page.`

- [ ] **Step 2: Figures**

Capture through Skylar's Chrome (claude-in-chrome) at a 1440×900 window against `http://localhost:3000/studio/structure/homePage` after a migration dry run has been reviewed, or with a local draft that mirrors it. Save raw PNGs to the scratchpad; add three entries to the `figures` map in `scripts/guide-figures.mjs` following the existing ones (crop + callouts), then `node scripts/guide-figures.mjs <scratch-dir>`. Check the three `.webp` files render on `http://localhost:3000/guide`.

- [ ] **Step 3: README**

Under "How content works", add a paragraph:

```markdown
The homepage is composed from `homePage.sections[]`, an array of typed block
objects (`src/sanity/schemaTypes/blocks/`). `src/lib/sections.ts` holds the
block types, anchor and header-menu derivation, and the legacy adapter that
synthesizes the same blocks from the flat Site Settings fields when no Home
Page document exists yet. `scripts/migrate-to-sections.ts` writes that
document once (dry run by default). After it has run, the adapter, the legacy
fields, and the pinned-photo exclusion in `GALLERY_QUERY` can be removed.
```

- [ ] **Step 4: Commit**

```bash
git add UPDATING.md README.md public/guide scripts/guide-figures.mjs src/app/guide/figures.json
git commit -m "Document the page sections for the owners and in the README

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 16: Pixel check and PR

- [ ] **Step 1: Before/after screenshots**

Production (`https://brbeerhub.com`) is "before"; `http://localhost:3000` is "after" (both read the same live dataset). Use the in-app browser: full-page screenshot at desktop width and at the mobile preset for each. Compare section by section. The only expected difference: header menu order.

- [ ] **Step 2: Final checks**

```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
```

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin skylar/page-builder
gh pr create --title "Compose the homepage from reorderable section blocks" --body "$(cat <<'EOF'
## What
- New `homePage` singleton with `sections[]` of typed blocks (hero, events, on tap, offerings, gallery, about, mountain divider), each with Hide for now and Menu label.
- Page renders from the Home Page doc when it exists; otherwise a legacy adapter synthesizes the same blocks from Site Settings, so this deploys with no visible change (nav order now follows the page).
- Header menu is derived from visible sections.
- `Editable` takes a block scope so defaults keep working in both modes.
- `scripts/migrate-to-sections.ts`: dry-run by default; writes the Home Page doc and deletes the two pinned Gallery Photo docs on `--apply`.
- Owners' guide: new "The sections of the page" section with figures.

## Rollout
1. Merge + deploy (no change).
2. Merge PR 2 (To Go block).
3. Run the migration once with an Editor token, review the dry run, then `--apply`.
4. PR 3 removes the adapter, legacy fields, and gallery exclusion.

## Test
`npm test` (adapter, anchors, nav, edit scope), before/after screenshots attached.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Hand Skylar the PR link; merging is theirs.

---

## Self-review notes

- Spec coverage: Q11 (Task 12), Q12 (Task 12/3), Q13 (Tasks 3, 11, 13), Q14 (Tasks 3, 10), Q16 (Task 12), Q17 (Task 14), Q21 (Tasks 3, 13; exclusion stays), Q22 (Task 12), Q24/Q25 deviations honored (Tasks 12, 13), Q26 (Task 15). Feature block, Q4, Q15, Q19, Q23 belong to PR 2.
- Names used across tasks: `EditScope`, `blockScope`, `legacyScope`, `editAttribute`, `Placed`, `placeLegacy`, `placeHome`, `assignAnchors`, `visibleSections`, `navFromSections`, `NavItem`, `sectionsFromSettings`, `HOME_PAGE_QUERY`, `Sections`, `SectionContext`, `hiddenOnSite`, `menuLabel`. Block components: `Hero`, `EventsSection`, `OnTapSection`, `OfferingsSection`, `GallerySection`, `AboutSection`, all `{ block, scope, id }` plus context props.
