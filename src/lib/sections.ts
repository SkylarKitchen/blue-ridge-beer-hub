import type { PortableTextBlock } from "next-sanity";
import { stegaClean } from "next-sanity";

import { FEATURE_COPY } from "./copy.ts";
import { blockScope, type EditScope } from "./edit-scope.ts";
import type { Offering, SanityImageRef } from "./types";

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

export type Section =
  | HeroBlock
  | EventsBlock
  | OnTapBlock
  | OfferingsBlock
  | GalleryBlock
  | AboutBlock
  | DividerBlock
  | FeatureBlock;

export type SectionType = Section["_type"];

/** A section plus where its default copy is written. */
export interface Placed {
  section: Section;
  scope: EditScope;
}

/* ---------- Image references ---------- */

export function imageRef(id: string, alt: string): SanityImageRef {
  return { _type: "image", asset: { _type: "reference", _ref: id }, alt };
}

/**
 * The Studio path of one block inside a Home Page's `sections` array.
 *
 * Kept here rather than inlined in the component because its SHAPE is
 * load-bearing, not cosmetic: @sanity/visual-editing decides an element is
 * draggable by testing whether the segment after the final "." contains "[".
 * A path that stopped being an array path would silently disable drag with no
 * error anywhere. `src/lib/sections.test.ts` asserts it against a copy of
 * that predicate.
 */
export function sectionArrayPath(key: string): string {
  return `sections[_key=="${key}"]`;
}

/* ---------- Placement ---------- */

export function placeHome(sections: Section[]): Placed[] {
  return sections.map((section) => ({
    section,
    scope: blockScope(section._key),
  }));
}

/* ---------- To Go seed ---------- */

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
    eyebrow: FEATURE_COPY.toGo.eyebrow,
    heading: FEATURE_COPY.toGo.heading,
    body: FEATURE_COPY.toGo.body,
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
    listHeading: FEATURE_COPY.toGo.listHeading,
    listItems: [],
  };
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
 * One `id` per section, unique across the page. Dividers and hidden
 * sections get null, and hidden ones don't count toward `-2`, `-3`… — so
 * the page and the header menu land on the same anchors whether or not a
 * caller filtered first.
 */
export function assignAnchors(sections: Section[]): Map<string, string | null> {
  // HoursFooter renders <footer id="hours"> and navFromSections appends
  // "#hours" unconditionally, so reserve it here: a Feature block whose
  // Menu label slugifies to "hours" would otherwise emit a second
  // id="hours" above the footer and send the Hours link to the wrong place.
  const used = new Map<string, number>([["hours", 1]]);
  const out = new Map<string, string | null>();
  for (const section of sections) {
    if (section.hiddenOnSite) {
      out.set(section._key, null);
      continue;
    }
    let base = DEFAULT_ANCHOR[section._type];
    if (base === undefined) {
      // A label of nothing but punctuation slugifies to "", which would be
      // an empty id on the page and a "#-2" link in the menu.
      base = slugify(section.menuLabel ?? "") || `section-${section._key}`;
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
