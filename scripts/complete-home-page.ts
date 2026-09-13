/**
 * Makes the Home Page form say what the site says.
 *
 * Two things the section migration (2026-09-13) left for the code to fill in
 * at render time, which shows up in the Studio as blank boxes beside a page
 * that plainly has text:
 *
 * 1. Copy defaults. Fields the owners never customised were left absent and
 *    the components render DEFAULT_COPY instead. `initialValue` only fires
 *    for sections created fresh, so the migrated ones stay blank. This
 *    writes the same defaults into the document so the form shows them.
 *
 * 2. Gallery photos. They lived as separate Gallery Photo documents with a
 *    Position number. This moves them into the Photos section itself as a
 *    drag-to-reorder list (in Position order) and deletes the old documents.
 *
 *   npm run complete:home              # dry run: prints the plan
 *   npm run complete:home -- --apply   # writes (needs an Editor token)
 *
 * One transaction, so the photos never exist in both places. Safe to rerun:
 * anything already in place is skipped.
 */
import { createClient } from "@sanity/client";

import { DEFAULT_COPY, FEATURE_COPY } from "../src/lib/copy.ts";

const apply = process.argv.includes("--apply");
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token =
  process.env.SANITY_API_WRITE_TOKEN ??
  (apply ? undefined : process.env.SANITY_API_READ_TOKEN);
if (!projectId || !dataset || !token) {
  console.error(
    apply
      ? "Set SANITY_API_WRITE_TOKEN (an Editor token) to apply."
      : "Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and a token.",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  useCdn: false,
  token,
  perspective: "raw",
});

type Json = Record<string, unknown>;

interface Block extends Json {
  _key: string;
  _type: string;
}

interface GalleryDoc {
  _id: string;
  _createdAt: string;
  order?: number;
  image?: { asset?: Json; hotspot?: Json; crop?: Json };
  alt?: string;
  caption?: string | null;
}

/** Field → default, per block type. Only written where the field is absent. */
const BLOCK_DEFAULTS: Record<string, Json> = {
  heroBlock: {
    heading: DEFAULT_COPY.heroHeading,
    primaryCta: DEFAULT_COPY.heroPrimaryCta,
    secondaryCta: DEFAULT_COPY.heroSecondaryCta,
  },
  eventsBlock: {
    heading: DEFAULT_COPY.eventsHeading,
    weeklyHeading: DEFAULT_COPY.weeklyHeading,
  },
  onTapBlock: {
    heading: DEFAULT_COPY.onTapHeading,
    blurb: DEFAULT_COPY.onTapBlurb,
    secondary: DEFAULT_COPY.onTapSecondary,
    secondaryLinkLabel: FEATURE_COPY.onTapSecondaryLinkLabel,
    cta: DEFAULT_COPY.onTapCta,
    tapCount: 16,
    tapCountLabel: DEFAULT_COPY.tapCountLabel,
    tapCountFootnote: DEFAULT_COPY.tapCountFootnote,
    perks: [...DEFAULT_COPY.tapPerks],
  },
  offeringsBlock: { heading: DEFAULT_COPY.offeringsHeading },
  galleryBlock: { heading: DEFAULT_COPY.galleryHeading },
  aboutBlock: { heading: DEFAULT_COPY.aboutHeading },
};

const SETTINGS_DEFAULTS: Json = {
  footerHeading: DEFAULT_COPY.footerHeading,
  footerHoursLabel: DEFAULT_COPY.footerHoursLabel,
  footerFindUsLabel: DEFAULT_COPY.footerFindUsLabel,
  footerFollowLabel: DEFAULT_COPY.footerFollowLabel,
  footerDirectionsCta: DEFAULT_COPY.footerDirectionsCta,
  footerVisitLine: DEFAULT_COPY.footerVisitLine,
  footerLegal: DEFAULT_COPY.footerLegal,
};

/** `set` entries for every default the block or document is missing. */
export function missingDefaults(
  target: Json,
  defaults: Json,
  prefix = "",
): Json {
  const out: Json = {};
  for (const [field, value] of Object.entries(defaults)) {
    if (target[field] === undefined || target[field] === null) {
      out[`${prefix}${field}`] = value;
    }
  }
  return out;
}

/**
 * One entry per photo, in Position order. A photo that only exists as a
 * draft (uploaded and described but never published) comes along too rather
 * than being deleted with its document type; where both versions exist the
 * published one wins.
 */
export function pickPhotos(docs: GalleryDoc[]): GalleryDoc[] {
  const byId = new Map<string, GalleryDoc>();
  for (const doc of docs) {
    const id = doc._id.replace(/^drafts\./, "");
    const isDraft = doc._id !== id;
    if (!byId.has(id) || !isDraft) byId.set(id, { ...doc, _id: id });
  }
  return [...byId.values()].sort(
    (a, b) =>
      (a.order ?? 50) - (b.order ?? 50) ||
      a._createdAt.localeCompare(b._createdAt),
  );
}

/** A Gallery Photo document as one item of the Photos section's list. */
export function toPhotoItem(doc: GalleryDoc): Json {
  const item: Json = {
    _key: doc._id.replace(/^galleryImage-/, "").slice(0, 24),
    _type: "image",
    asset: doc.image?.asset,
    alt: doc.alt,
  };
  if (doc.image?.hotspot) item.hotspot = doc.image.hotspot;
  if (doc.image?.crop) item.crop = doc.image.crop;
  if (doc.caption) item.caption = doc.caption;
  return item;
}

async function main() {
  const { home, settings, photos } = await client.fetch<{
    home: { sections?: Block[] } | null;
    settings: Json | null;
    photos: GalleryDoc[];
  }>(`{
    "home": *[_id == "homePage"][0]{ sections },
    "settings": *[_id == "siteSettings"][0],
    "photos": *[_type == "galleryImage"]{
      _id, _createdAt, order, image, alt, caption
    }
  }`);
  if (!home?.sections) {
    throw new Error("homePage has no sections; nothing to complete.");
  }

  const homeSet: Json = {};
  for (const block of home.sections) {
    const defaults = BLOCK_DEFAULTS[block._type];
    if (!defaults) continue;
    Object.assign(
      homeSet,
      missingDefaults(block, defaults, `sections[_key=="${block._key}"].`),
    );
  }

  const gallery = home.sections.find((b) => b._type === "galleryBlock");
  const galleryItems = pickPhotos(photos).map(toPhotoItem);
  const movePhotos =
    gallery !== undefined &&
    !Array.isArray(gallery.photos) &&
    galleryItems.length > 0;
  if (movePhotos) {
    homeSet[`sections[_key=="${gallery._key}"].photos`] = galleryItems;
  }

  const settingsSet = settings
    ? missingDefaults(settings, SETTINGS_DEFAULTS)
    : {};

  // The old documents (drafts included) go once the section holds the list —
  // either in this run or an earlier one that didn't finish deleting.
  const allPhotoIds = await client.fetch<string[]>(
    `*[_type == "galleryImage"]._id`,
  );
  const deleteIds =
    movePhotos || Array.isArray(gallery?.photos) ? allPhotoIds : [];

  console.log(`${apply ? "APPLY" : "DRY RUN"} → ${projectId}/${dataset}\n`);
  console.log(`homePage: set ${Object.keys(homeSet).length} field(s)`);
  for (const [path, value] of Object.entries(homeSet)) {
    const shown = Array.isArray(value)
      ? `[${value.length} item(s)]`
      : JSON.stringify(value);
    console.log(`  ${path} = ${shown}`);
  }
  console.log(`siteSettings: set ${Object.keys(settingsSet).length} field(s)`);
  for (const [path, value] of Object.entries(settingsSet)) {
    console.log(`  ${path} = ${JSON.stringify(value)}`);
  }
  console.log(`galleryImage: delete ${deleteIds.length} document(s)`);
  for (const id of deleteIds) console.log(`  ${id}`);

  const nothing =
    !Object.keys(homeSet).length &&
    !Object.keys(settingsSet).length &&
    !deleteIds.length;
  if (nothing) {
    console.log("\nNothing to do.");
    return;
  }
  if (!apply) {
    console.log("\nDry run. Rerun with --apply to write.");
    return;
  }

  let tx = client.transaction();
  if (Object.keys(homeSet).length) {
    tx = tx.patch("homePage", (p) => p.set(homeSet));
  }
  if (Object.keys(settingsSet).length) {
    tx = tx.patch("siteSettings", (p) => p.set(settingsSet));
  }
  for (const id of deleteIds) tx = tx.delete(id);
  const result = await tx.commit();
  console.log(`\nCommitted transaction ${result.transactionId}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
