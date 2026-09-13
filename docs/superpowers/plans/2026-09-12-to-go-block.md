# To Go Feature Block Implementation Plan (PR 2 of 2)

> **The two-PR structure in this plan is SUPERSEDED.** Skylar, 2026-09-13 ~01:00Z, recorded on [#14](https://github.com/SkylarKitchen/blue-ridge-beer-hub/issues/14): PR 2 commits onto `skylar/page-builder` “like everything else” — **“one PR”**.
> There is one PR, [#28](https://github.com/SkylarKitchen/blue-ridge-beer-hub/pull/28), open from
> `skylar/page-builder` and carrying both plans; it must not be merged until
> [#19](https://github.com/SkylarKitchen/blue-ridge-beer-hub/issues/19). The plan is kept under its original
> name because tickets and the map refer to it as “PR 2”. Task 1 and Task 9 below are retired;
> everything else stands.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable Feature block (heading, words, 1–3 photos, optional "just in" list with date, optional link) and seed the first one, To Go, hidden, so the owners only have to add cooler photos and un-hide it.

**Architecture:** `featureBlock` joins the `sections[]` union from PR 1. Layout is chosen by photo count (one / pair / trio) with a left/right photo-side switch. Small pure helpers in `src/lib/feature.ts` (layout, date label, "next Feature block after On Tap") are unit-tested. The On Tap block gains a link label that jumps to the nearest following Feature block. The migration script from PR 1 inserts the seeded To Go block after On Tap.

**Tech Stack:** Same as PR 1. Design work follows the `skylar-taste` skill (references first) and is ruled on the rendered dev server, not on descriptions.

**Spec:** `docs/superpowers/specs/2026-09-12-page-builder-design.md` (Q1, Q4, Q15, Q19, Q23 and the Feature field set)

## Global Constraints

- Branch `skylar/page-builder`. Commit only there — every ticket in this plan lands on it and joins PR #28. (Was: a stacked `skylar/to-go-section`; superseded, see the banner above.)
- Relative `.ts` imports inside `src/lib/*.ts`; no `@/` in files the migration script imports (`sections.ts`, `edit-scope.ts`, `copy.ts`, `feature.ts`).
- Photos: 1 minimum, 3 maximum, alt required. No background/spacing knobs on the block.
- List items are free text (max 8). Date is owner-set, shown as "Updated Sep 12", never auto-hidden.
- Seeded copy uses typographic apostrophes. Seeded list is empty (owners fill it); the dev preview shows a sample list.
- Verify each task with `npm test`, `npx tsc --noEmit`, `npm run lint`.
- Dev server only via `~/.claude/scripts/ghostty-tab.sh 'npm run dev'` after checking port 3000.

---

### Task 1: Branch — RETIRED

Superseded by the one-PR ruling: there is no second branch to create. The work
commits directly to `skylar/page-builder`, which already exists and already has
PR #28 open against `main`.

```bash
git checkout skylar/page-builder   # nothing else to do
```

---

### Task 2: Feature helpers

**Files:**

- Create: `src/lib/feature.ts`
- Test: `src/lib/feature.test.ts`

**Interfaces:**

- Consumes: `Section` (with `FeatureBlock` added in Task 3; write the type first, see Step 3).
- Produces: `featureLayout(count): "none" | "one" | "two" | "three"`, `formatAsOf(iso, now?): string | null`, `nextFeatureAnchor(sections, fromKey, anchors): string | undefined`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/feature.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { featureLayout, formatAsOf, nextFeatureAnchor } from "./feature.ts";
import { assignAnchors, type Section } from "./sections.ts";

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
```

- [ ] **Step 2: Run, expect failure**

Run: `node --test src/lib/feature.test.ts`
Expected: FAIL, cannot find `./feature.ts`; also a type error on `_type: "featureBlock"` once Task 3 is skipped — do Step 3 before Step 4.

- [ ] **Step 3: Add the `FeatureBlock` type to `src/lib/sections.ts`**

```ts
export interface FeaturePhoto extends SanityImageRef {
  _key?: string;
}

export interface FeatureBlock extends SectionBase {
  _type: "featureBlock";
  eyebrow?: string;
  heading?: string;
  /** Plain text; blank lines separate paragraphs and are kept as line breaks. */
  body?: string;
  photos?: FeaturePhoto[];
  photoSide?: "left" | "right";
  listHeading?: string;
  listItems?: string[];
  /** ISO date (YYYY-MM-DD) the owners set when they refresh the list. */
  listAsOf?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}
```

Add `| FeatureBlock` to the `Section` union and `featureBlock: {}` to `LEGACY_FIELDS`. `DEFAULT_ANCHOR` and `DEFAULT_MENU_LABEL` get no entry: the anchor comes from the menu label (or `section-<key>`), and a Feature block is in the menu only when it has a label.

- [ ] **Step 4: Implement `src/lib/feature.ts`**

```ts
// src/lib/feature.ts
import type { Section } from "./sections.ts";

export type FeatureLayout = "none" | "one" | "two" | "three";

/** Layout follows the photo count so the owners can’t pick one that doesn’t fit. */
export function featureLayout(count: number): FeatureLayout {
  if (count <= 0) return "none";
  if (count === 1) return "one";
  if (count === 2) return "two";
  return "three";
}

const TZ = "America/New_York";

/** "Updated Sep 12", with the year only when it isn’t the current one. */
export function formatAsOf(iso?: string, now = new Date()): string | null {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00-04:00`);
  if (Number.isNaN(date.getTime())) return null;
  const sameYear =
    date.toLocaleDateString("en-US", { year: "numeric", timeZone: TZ }) ===
    now.toLocaleDateString("en-US", { year: "numeric", timeZone: TZ });
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: TZ,
  });
  return `Updated ${label}`;
}

/**
 * Href of the first Feature block after `fromKey` in page order, so the On
 * Tap second line can say “see what’s new to go” and mean the section
 * below it — wherever the owners put it.
 */
export function nextFeatureAnchor(
  sections: Section[],
  fromKey: string,
  anchors: Map<string, string | null>,
): string | undefined {
  const start = sections.findIndex((s) => s._key === fromKey);
  if (start < 0) return undefined;
  for (const section of sections.slice(start + 1)) {
    if (section._type !== "featureBlock" || section.hiddenOnSite) continue;
    const anchor = anchors.get(section._key);
    if (anchor) return `#${anchor}`;
  }
  return undefined;
}
```

- [ ] **Step 5: Run all tests, expect pass**

Run: `npm test && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/lib/feature.ts src/lib/feature.test.ts src/lib/sections.ts
git commit -m "Add the Feature block type and its layout/date/anchor helpers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Feature block schema

**Files:**

- Create: `src/sanity/schemaTypes/blocks/featureBlock.ts`
- Modify: `src/sanity/schemaTypes/index.ts`, `src/sanity/schemaTypes/homePage.ts` (add to `of`)

- [ ] **Step 1: Schema**

```ts
// src/sanity/schemaTypes/blocks/featureBlock.ts
import { defineArrayMember, defineField, defineType } from "sanity";

import { sectionFields } from "./common";

/**
 * A reusable “words + photos” section. The first one is To Go (what’s new
 * in the coolers); the owners can add more — kegs for a party, holiday
 * packs — without a developer.
 */
export const featureBlock = defineType({
  name: "featureBlock",
  title: "Feature (words + photos)",
  type: "object",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Small label",
      type: "string",
      description: "A word or two above the heading, e.g. “To go”. Optional.",
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Words",
      type: "text",
      rows: 6,
      description: "A paragraph or two. Leave a blank line between paragraphs.",
    }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      description:
        "One to three. The layout adapts: one big photo, a pair, or a trio.",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Describe this photo",
              type: "string",
              description:
                "Read aloud to blind visitors, e.g. “Cans of local IPA stacked in the cooler.”",
              validation: (rule) => rule.required(),
            }),
          ],
        }),
      ],
      validation: (rule) =>
        rule
          .min(1)
          .error("Add at least one photo.")
          .max(3)
          .error("Three photos at most."),
    }),
    defineField({
      name: "photoSide",
      title: "Photos on the",
      type: "string",
      options: {
        list: [
          { title: "Right", value: "right" },
          { title: "Left", value: "left" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "right",
    }),
    defineField({
      name: "listHeading",
      title: "List heading",
      type: "string",
      initialValue: "Just in",
    }),
    defineField({
      name: "listItems",
      title: "List",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Short lines, one per item — “Burial 4-packs”, “Cases of Highland Gaelic”. Leave empty to hide the list.",
      validation: (rule) => rule.max(8),
    }),
    defineField({
      name: "listAsOf",
      title: "List updated on",
      type: "date",
      description:
        "Shows under the list as “Updated Sep 12”. Set it when you refresh the list; leave empty to show no date.",
    }),
    defineField({
      name: "ctaLabel",
      title: "Button label",
      type: "string",
      description: "Optional. Needs a link below to show.",
    }),
    defineField({
      name: "ctaUrl",
      title: "Button link",
      type: "url",
      description:
        "A web address, or mailto:… / tel:… to open email or the phone.",
      validation: (rule) =>
        rule.uri({ scheme: ["http", "https", "mailto", "tel"] }),
    }),
    ...sectionFields(),
  ],
  preview: {
    select: { heading: "heading", hidden: "hiddenOnSite", media: "photos.0" },
    prepare({ heading, hidden, media }) {
      return {
        title: heading || "Feature",
        subtitle: ["Feature", hidden ? "Hidden" : null]
          .filter(Boolean)
          .join(" · "),
        media,
      };
    },
  },
});
```

- [ ] **Step 2: Register** in `index.ts` and add `defineArrayMember({ type: "featureBlock" })` to `homePage.sections.of` (after `aboutBlock`).

- [ ] **Step 3: Check the Studio** — Home Page → Add item lists “Feature (words + photos)”. Don’t publish.

- [ ] **Step 4: Verify, commit**

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/sanity
git commit -m "Add the Feature block schema

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Seed copy and the migration insert

**Files:**

- Modify: `src/lib/copy.ts` (add `TO_GO_SEED`, add `onTapSecondaryLinkLabel`, drop the six-packs perk)
- Modify: `src/lib/sections.ts` (add `BAR_STOOLS_IMAGE`, `toGoSeedSection()`)
- Modify: `scripts/migrate-to-sections.ts` (insert after On Tap)
- Test: `src/lib/sections.test.ts` (append)

- [ ] **Step 1: Failing test** (append to `src/lib/sections.test.ts`)

```ts
import { toGoSeedSection, withToGoSeed } from "./sections.ts";

test("withToGoSeed places a hidden To Go block right after On Tap", () => {
  const sections = withToGoSeed(sectionsFromSettings(FALLBACK_SETTINGS));
  const tapIndex = sections.findIndex((s) => s._type === "onTapBlock");
  const seed = sections[tapIndex + 1];
  assert.equal(seed._type, "featureBlock");
  assert.equal(seed.hiddenOnSite, true);
  assert.equal(seed.menuLabel, "To Go");
  assert.equal(sections.length, 9);
});

test("the To Go seed has one placeholder photo and an empty list", () => {
  const seed = toGoSeedSection();
  assert.equal(seed.photos?.length, 1);
  assert.ok(seed.photos?.[0]?.alt);
  assert.deepEqual(seed.listItems, []);
});
```

- [ ] **Step 2: Run, expect failure** — `node --test src/lib/sections.test.ts`.

- [ ] **Step 3: Copy** — in `src/lib/copy.ts`:

Remove `"Build-your-own six-packs from the coolers",` from `tapPerks`. Add after `tapCountFootnote`:

```ts
  onTapSecondaryLinkLabel: "See what’s new to go",
```

Append before the closing `} as const;`:

```ts
  toGo: {
    eyebrow: "To go",
    heading: "New in the coolers",
    body:
      "Cans, bottles, and cases to carry out, restocked every week with whatever’s new from Asheville and beyond. Build your own six-pack from anything in the coolers, or grab a case for the cabin.\n\nHunting something specific? Ask at the bar. If we can get it, we will.",
    listHeading: "Just in",
  },
```

- [ ] **Step 4: Seed section** — in `src/lib/sections.ts`:

```ts
// The gallery shot that shows the coolers; placeholder until the owners
// add real cooler photos.
export const BAR_STOOLS_IMAGE =
  "image-54c73c104a932d177981f0a0f0412ab9f0039148-2560x1707-jpg";

export function toGoSeedSection(): FeatureBlock {
  return {
    _key: "to-go",
    _type: "featureBlock",
    hiddenOnSite: true,
    menuLabel: "To Go",
    eyebrow: DEFAULT_COPY.toGo.eyebrow,
    heading: DEFAULT_COPY.toGo.heading,
    body: DEFAULT_COPY.toGo.body,
    photoSide: "right",
    photos: [
      {
        _key: "photo-1",
        ...imageRef(
          BAR_STOOLS_IMAGE,
          "Stools along the concrete bar top, coolers stocked for carryout behind.",
        ),
      },
    ],
    listHeading: DEFAULT_COPY.toGo.listHeading,
    listItems: [],
  };
}

/** Today's sections plus the seeded To Go block directly after On Tap. */
export function withToGoSeed(sections: Section[]): Section[] {
  const i = sections.findIndex((s) => s._type === "onTapBlock");
  const at = i < 0 ? sections.length : i + 1;
  return [...sections.slice(0, at), toGoSeedSection(), ...sections.slice(at)];
}
```

Add `import { DEFAULT_COPY } from "./copy.ts";` at the top of `sections.ts`.

- [ ] **Step 5: Migration** — in `scripts/migrate-to-sections.ts`, import `withToGoSeed` and change the doc:

```ts
  sections: withToGoSeed(sectionsFromSettings(settings)),
```

Update the header comment: “Also seeds the To Go block, hidden, after On Tap.”

- [ ] **Step 6: Tests pass, dry run shows nine sections**

```bash
npm test && npx tsc --noEmit && npm run lint
npm run migrate:sections | grep -c '"_type"'
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/copy.ts src/lib/sections.ts src/lib/sections.test.ts scripts/migrate-to-sections.ts
git commit -m "Seed a hidden To Go block after On Tap in the migration

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Design references, then the component

**Files:**

- Create: `src/components/FeatureSection.tsx`
- Create: `src/app/(site)/dev/blocks/page.tsx` (development-only preview)

**Interfaces:**

- Consumes: `FeatureBlock`, `EditScope`, `featureLayout`, `formatAsOf`, `editAttribute`, `urlFor`.
- Produces: `FeatureSection({ block, scope, id })`.

- [ ] **Step 1: References first** — invoke the `skylar-taste` skill. Pull 3–5 references for a words-plus-photo-collage section on small food/drink shop sites (one big photo; a staggered pair; a trio). Note in the PR which direction was taken. Do not skip this because the code below exists; the code is a starting point the ruling will change.

- [ ] **Step 2: Component (first version)**

```tsx
// src/components/FeatureSection.tsx
import Image from "next/image";
import type { CSSProperties } from "react";

import { DEFAULT_COPY } from "@/lib/copy";
import type { EditScope } from "@/lib/edit-scope";
import { editAttribute } from "@/lib/editable";
import { featureLayout, formatAsOf } from "@/lib/feature";
import type { FeatureBlock, FeaturePhoto } from "@/lib/sections";
import { urlFor } from "@/sanity/image";

import { ArrowUpRight } from "./ArrowUpRight";
import { Editable } from "./Editable";

function Photo({
  photo,
  w,
  h,
  className,
  delay,
}: {
  photo: FeaturePhoto;
  w: number;
  h: number;
  className?: string;
  delay: number;
}) {
  if (!photo.asset) return null;
  return (
    <Image
      src={urlFor(photo).width(w).height(h).fit("crop").url()}
      alt={photo.alt ?? ""}
      width={w}
      height={h}
      className={`rounded-2xl object-cover ${className ?? ""}`}
      style={{ "--rd": `${delay}ms` } as CSSProperties}
    />
  );
}

/** One big photo; a staggered pair; one tall plus two small. */
function Photos({ photos }: { photos: FeaturePhoto[] }) {
  const layout = featureLayout(photos.length);
  if (layout === "none") return null;
  if (layout === "one") {
    return (
      <div data-reveal-group>
        <Photo
          photo={photos[0]}
          w={960}
          h={1200}
          delay={120}
          className="w-full"
        />
      </div>
    );
  }
  if (layout === "two") {
    return (
      <div data-reveal-group className="grid grid-cols-2 gap-4">
        <Photo photo={photos[0]} w={600} h={800} delay={120} />
        <Photo
          photo={photos[1]}
          w={600}
          h={800}
          delay={200}
          className="mt-10"
        />
      </div>
    );
  }
  return (
    <div data-reveal-group className="grid grid-cols-2 grid-rows-2 gap-4">
      <Photo
        photo={photos[0]}
        w={600}
        h={1240}
        delay={120}
        className="row-span-2 h-full"
      />
      <Photo photo={photos[1]} w={600} h={600} delay={200} />
      <Photo photo={photos[2]} w={600} h={600} delay={280} />
    </div>
  );
}

export function FeatureSection({
  block,
  scope,
  id,
}: {
  block: FeatureBlock;
  scope: EditScope;
  id?: string;
}) {
  const photos = block.photos ?? [];
  const items = block.listItems ?? [];
  const asOf = formatAsOf(block.listAsOf);
  const photosLeft = block.photoSide === "left";

  return (
    <section id={id} className="bg-butter">
      <div className="mx-auto max-w-6xl px-5 sm:px-10 py-20">
        <div
          data-reveal-group
          className={`grid items-center gap-10 md:grid-cols-2 ${photosLeft ? "md:[&>*:first-child]:order-2" : ""}`}
        >
          <div>
            {block.eyebrow ? (
              <p className="font-condensed text-sm font-bold uppercase tracking-widest text-amber">
                <Editable
                  value={block.eyebrow}
                  scope={scope}
                  field="eyebrow"
                  label="Small label"
                />
              </p>
            ) : null}
            <h2 className="mt-2 font-display text-5xl uppercase text-navy sm:text-6xl">
              <Editable
                value={block.heading ?? DEFAULT_COPY.toGo.heading}
                scope={scope}
                field="heading"
                label="Feature heading"
              />
            </h2>
            {block.body ? (
              <p className="mt-5 max-w-lg whitespace-pre-line text-lg leading-relaxed text-ink/80">
                <Editable
                  value={block.body}
                  scope={scope}
                  field="body"
                  label="Feature words"
                  multiline
                />
              </p>
            ) : null}
            {items.length ? (
              <div
                className="mt-7 max-w-lg rounded-2xl bg-cream p-6 shadow-sm"
                style={{ "--rd": "120ms" } as CSSProperties}
              >
                <h3 className="font-display text-xl text-navy-deep">
                  <Editable
                    value={block.listHeading ?? DEFAULT_COPY.toGo.listHeading}
                    scope={scope}
                    field="listHeading"
                    label="List heading"
                  />
                </h3>
                <ul className="mt-3 space-y-1.5 text-sm font-semibold text-navy-deep/85">
                  {items.map((item, i) => (
                    <li key={i}>
                      <Editable
                        value={item}
                        scope={scope}
                        field={`listItems[${i}]`}
                        label={`List line ${i + 1}`}
                      />
                    </li>
                  ))}
                </ul>
                {asOf ? (
                  <p
                    data-sanity={editAttribute(scope, "listAsOf")}
                    className="mt-3 text-xs text-navy-deep/60"
                  >
                    {asOf}
                  </p>
                ) : null}
              </div>
            ) : null}
            {block.ctaLabel && block.ctaUrl ? (
              <a
                href={block.ctaUrl}
                target={block.ctaUrl.startsWith("http") ? "_blank" : undefined}
                rel={
                  block.ctaUrl.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="mt-7 inline-flex items-center gap-2 rounded-full border-2 border-navy px-6 py-3 font-display text-base tracking-wide text-navy transition-colors hover:bg-navy hover:text-cream"
              >
                <Editable
                  value={block.ctaLabel}
                  scope={scope}
                  field="ctaLabel"
                  label="Button label"
                />
                <ArrowUpRight />
              </a>
            ) : null}
          </div>
          <Photos photos={photos} />
        </div>
      </div>
    </section>
  );
}
```

`ctaUrl` carries stega in previews; wrap it with `stegaClean` from `next-sanity` before `startsWith` and before `href` (see `HoursFooter.tsx` for the same pattern).

- [ ] **Step 3: Dev-only preview route**

```tsx
// src/app/(site)/dev/blocks/page.tsx
import { notFound } from "next/navigation";

import { FeatureSection } from "@/components/FeatureSection";
import { blockScope } from "@/lib/edit-scope";
import { toGoSeedSection, type FeatureBlock } from "@/lib/sections";
import type { GalleryImage } from "@/lib/types";
import { sanityFetch } from "@/sanity/live";
import { GALLERY_QUERY } from "@/sanity/queries";

/** Renders every Feature layout with real photos. Development only. */
export default async function BlocksPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  const { data } = await sanityFetch({ query: GALLERY_QUERY });
  const gallery = (data ?? []) as GalleryImage[];
  const photos = gallery.slice(0, 3).map((g, i) => ({
    _key: `p${i}`,
    ...g.image,
    alt: g.alt,
  }));
  const seed = toGoSeedSection();
  const sample: FeatureBlock = {
    ...seed,
    hiddenOnSite: false,
    listItems: [
      "Burial 4-packs, back on the shelf",
      "Cases of Highland Gaelic Ale",
      "Noble cider tallboys",
    ],
    listAsOf: "2026-09-12",
    ctaLabel: "Call ahead for a case",
    ctaUrl: "tel:+18282469320",
  };

  const variants: Array<[string, FeatureBlock]> = [
    [
      "one-right",
      { ...sample, photos: photos.slice(0, 1), photoSide: "right" },
    ],
    ["two-left", { ...sample, photos: photos.slice(0, 2), photoSide: "left" }],
    [
      "three-right",
      { ...sample, photos: photos.slice(0, 3), photoSide: "right" },
    ],
  ];

  return (
    <main>
      {variants.map(([key, block]) => (
        <FeatureSection
          key={key}
          id={key}
          block={{ ...block, _key: key }}
          scope={blockScope(key)}
        />
      ))}
    </main>
  );
}
```

Confirm `src/app/sitemap.ts` lists only `/` (it does today) so `/dev/blocks` never appears in the sitemap.

- [ ] **Step 4: Look at it** — dev server, open `http://localhost:3000/dev/blocks` in the in-app browser at desktop and mobile widths. Fix anything broken (overflow, cropping, order on mobile) before handing it to Skylar.

- [ ] **Step 5: Commit**

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/components/FeatureSection.tsx "src/app/(site)/dev/blocks/page.tsx"
git commit -m "Add the Feature section with one/pair/trio photo layouts

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Wire it into the page; On Tap link

**Files:**

- Modify: `src/components/Sections.tsx` (feature case; On Tap gets `secondaryHref`)
- Modify: `src/components/OnTapSection.tsx` (render the link)
- Test: `src/lib/sections.test.ts` (append nav/anchor cases)

- [ ] **Step 1: Failing tests** (append)

```ts
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
```

- [ ] **Step 2: Run, expect failure** — only if Task 2's union change missed something; otherwise these pass immediately. Either way keep them.

- [ ] **Step 3: `Sections.tsx`** — import `FeatureSection` and `nextFeatureAnchor`; add `const list = shown.map((p) => p.section);` and:

```tsx
          case "featureBlock":
            return (
              <FeatureSection key={section._key} block={section} scope={scope} id={id} />
            );
```

In the `onTapBlock` case add `secondaryHref={nextFeatureAnchor(list, section._key, anchors)}`.

- [ ] **Step 4: `OnTapSection.tsx`** — add prop `secondaryHref?: string`. Replace the second-line paragraph:

```tsx
<p className="mt-3 max-w-lg text-sm text-ink/60">
  <Editable
    value={block.secondary ?? DEFAULT_COPY.onTapSecondary}
    scope={scope}
    field="secondary"
    label="On Tap second line"
    multiline
  />
  {secondaryHref ? (
    <>
      {" "}
      <a
        href={secondaryHref}
        className="font-semibold text-navy underline decoration-amber/60 underline-offset-4 hover:text-navy-deep"
      >
        <Editable
          value={
            block.secondaryLinkLabel ?? DEFAULT_COPY.onTapSecondaryLinkLabel
          }
          scope={scope}
          field="secondaryLinkLabel"
          label="Link after the second line"
        />
      </a>
    </>
  ) : null}
</p>
```

Add `secondaryLinkLabel` to the `onTapBlock` schema (`title: "Link after the second line"`, `initialValue: "See what’s new to go"`, description: "Shows only when a Feature section comes later on the page, and jumps to it.").

- [ ] **Step 5: Verify on the page** — in the Studio, add a Feature block to a _draft_ Home Page after On Tap (or temporarily un-hide the seed in the dry-run JSON pasted into the form); confirm the link appears under On Tap and jumps to it. Discard the draft afterwards.

- [ ] **Step 6: Commit**

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/components/Sections.tsx src/components/OnTapSection.tsx src/sanity/schemaTypes/blocks/onTapBlock.ts src/lib/sections.test.ts
git commit -m "Render Feature blocks; link On Tap to the next one

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Visual ruling (checkpoint)

- [ ] **Step 1:** Screenshot `/dev/blocks` at desktop and mobile. Send Skylar the screenshots and the URL with one line: “three layouts, photos right/left/right; rule on the render.”
- [ ] **Step 2:** Wait. Apply the ruling to `FeatureSection.tsx` classes only (no new fields). Re-screenshot. Repeat until “looks good.”
- [ ] **Step 3:** Commit each accepted round: `git commit -am "Feature layout: <what changed>"` with the co-author line.

---

### Task 8: Owners’ guide and README

**Files:**

- Modify: `UPDATING.md`, `README.md`
- Create: `public/guide/studio-to-go.webp` via `scripts/guide-figures.mjs`

- [ ] **Step 1: Guide** — in “What do you want to do?” add `- [Update what’s new to go](#whats-new-to-go)`. New section after “The sections of the page”:

```markdown
## What’s new to go

There’s a **To Go** section for the coolers — cans, bottles, cases, build-your-own
packs. It starts hidden so you can add photos first.

![The To Go section: photos, the words, the Just in list, and the date.](public/guide/studio-to-go.webp)

1. **Structure → Home Page**, open **New in the coolers**.
2. **Photos:** drop in one to three. One photo shows big; two or three make a
   little collage. Describe each one in a line.
3. **Just in:** one line per item — “Burial 4-packs”, “Cases of Gaelic”. Empty
   the list and it disappears; the section stays.
4. **List updated on:** set today’s date when you change the list. It shows as
   “Updated Sep 12” so people know it’s current.
5. Untick **Hide for now**, then **Publish**.

When the coolers change, fix the list, bump the date, publish. Thirty seconds.

> **Tip:** Want another section like it — kegs for a party, a holiday gift
> pack? **Add item** on Home Page → **Feature (words + photos)**. Same fields.
```

- [ ] **Step 2: Figure** — capture the opened To Go section in the Studio through Skylar’s Chrome (1440×900), add a `studio-to-go` entry to `scripts/guide-figures.mjs` with callouts on Photos, the list, the date, and Hide for now; run the script.

- [ ] **Step 3: README** — after the page-builder paragraph: “`featureBlock` is the reusable words-plus-photos section; layout follows the photo count (`src/lib/feature.ts`). `/dev/blocks` renders every layout in development.”

- [ ] **Step 4: Commit**

```bash
git add UPDATING.md README.md public/guide scripts/guide-figures.mjs src/app/guide/figures.json
git commit -m "Document the To Go section for the owners

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: PR — RETIRED

Superseded by the one-PR ruling. This task would push `skylar/to-go-section` and open a
SECOND pull request against `skylar/page-builder`; both are wrong now. PR #28 already
carries this work, the guide and README go through
[#18](https://github.com/SkylarKitchen/blue-ridge-beer-hub/issues/18), and merging is
[#19](https://github.com/SkylarKitchen/blue-ridge-beer-hub/issues/19). The command block below is kept
only because its PR body text is reusable for #28's description — do not run it.

- [ ] **Step 1:** `npm test && npx tsc --noEmit && npm run lint && npm run build`
- [ ] **Step 2:**

```bash
# RETIRED — do not run. Kept for the PR body text below.
# git push -u origin skylar/to-go-section
# gh pr create --base skylar/page-builder --title "Add the To Go feature block" --body "$(cat <<'EOF'
## What
- `featureBlock`: eyebrow, heading, words, 1–3 photos (layout by count, photo side), optional “Just in” list with an owner-set date, optional link.
- On Tap’s second line links to the next Feature block on the page; the six-packs perk line is gone from the defaults.
- Migration now seeds a hidden To Go block after On Tap (bar-stools placeholder photo, empty list).
- `/dev/blocks` (development only) renders all three layouts.
- Owners’ guide: “What’s new to go”.

Stacked on #<PR1>. Design ruled on the rendered preview (screenshots attached).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Hand Skylar the link. After both PRs merge and deploy: run `npm run migrate:sections` (dry run), review, then `SANITY_API_WRITE_TOKEN=… npm run migrate:sections -- --apply`, then open PR 3 (spec: last section).

---

## Self-review notes

- Spec: Q1 (list hides when empty, Task 5), Q4 (Task 4 perk removal + Task 6 link), Q15 (Task 2 layout by count, Task 3 photoSide), Q19 (Task 3 fields, Task 2 date, Task 5 rendering), Q23 (Task 4 seed, hidden, after On Tap), Q26 (Task 8). Q10: link optional (Task 3).
- Names: `FeatureBlock`, `FeaturePhoto`, `featureLayout`, `formatAsOf`, `nextFeatureAnchor`, `toGoSeedSection`, `withToGoSeed`, `BAR_STOOLS_IMAGE`, `DEFAULT_COPY.toGo`, `DEFAULT_COPY.onTapSecondaryLinkLabel`, `FeatureSection({ block, scope, id })`, `OnTapSection.secondaryHref`, schema fields `eyebrow, heading, body, photos, photoSide, listHeading, listItems, listAsOf, ctaLabel, ctaUrl, secondaryLinkLabel`.
