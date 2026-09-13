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
    image: "aboutImage",
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
      // An owner upload wins; an empty field keeps the shipped shot, which
      // is exactly what the Studio's help text promises them. The guard is
      // on `.asset` rather than on the object: Sanity leaves a bare
      // `{_type:"image"}` behind after a removed upload, and that would
      // render as a broken image. No alt is synthesized here — the block
      // carries the owner's own alt or none, and the components already
      // treat an alt-less owner photo as decorative. Borrowing the pinned
      // shot's alt would describe a different photograph.
      image: settings.heroImage?.asset
        ? settings.heroImage
        : imageRef(
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
      // `_type` is written rather than spread through: the offline fallback
      // cards have never carried one, and a projection that forgets to ask
      // for it would silently strip it from the migrated document.
      cards: settings.offerings?.map((card, i) => ({
        ...card,
        _type: "offering" as const,
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
      // Same rule as the hero photo above.
      image: settings.aboutImage?.asset
        ? settings.aboutImage
        : imageRef(
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
 * One `id` per section, unique across the page. Dividers and hidden
 * sections get null, and hidden ones don't count toward `-2`, `-3`… — so
 * the page and the header menu land on the same anchors whether or not a
 * caller filtered first.
 */
export function assignAnchors(sections: Section[]): Map<string, string | null> {
  const used = new Map<string, number>();
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
