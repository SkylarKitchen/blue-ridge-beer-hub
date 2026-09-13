/**
 * Gives every photo in the Home Page Photos section a caption.
 *
 * Only the first photo had one (2026-09-13), which left a single ragged cell
 * in the grid. Captions are set by the photo's `_key`, so re-running is safe,
 * and the script refuses to write if the live photo list is not exactly the
 * nine it was written against.
 *
 *   npm run captions              # dry run: prints each change
 *   npm run captions -- --apply   # writes (needs an Editor token)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@sanity/client";

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
});

/** Caption per photo `_key`, in the owners' Position order. */
export const CAPTIONS: Record<string, string> = {
  l4U0qMpnuVLxOUx8hDbRdy: "Cookout on the back patio",
  sajAnQTE1Pa02x95TyRewF: "Grill duty, mug club stein in hand",
  "taps-closeup": "The faucets, up close",
  l4U0qMpnuVLxOUx8hDbSh0: "Mid-pour at the cookout",
  "tap-wall": "Numbered tap handles along the bar",
  "mug-club-steins": "Mug club steins, etched and racked",
  "merch-wall": "Hoodies and tees on the merch wall",
  "bar-stools": "Bar stools and the carryout coolers",
  "pint-glasses": "Etched pint glasses on the shelf",
};

const ID = "homePage";
type Photo = { _key: string; alt?: string; caption?: string | null };
const doc = await client.fetch<{
  sections?: { _key: string; _type: string; photos?: Photo[] }[];
} | null>(
  `*[_id == $id][0]{ sections[]{ _key, _type, photos[]{ _key, alt, caption } } }`,
  {
    id: ID,
  },
);
if (!doc) {
  console.error(`No document with _id ${ID}.`);
  process.exit(1);
}

const galleries = (doc.sections ?? []).filter(
  (s) => s._type === "galleryBlock",
);
if (galleries.length !== 1) {
  console.error(
    `Expected exactly one galleryBlock section, found ${galleries.length}.`,
  );
  process.exit(1);
}
const [gallery] = galleries;
const photos = gallery.photos ?? [];

// Hard assertion: the live list must be exactly the keys the captions were
// written for. A photo added, removed or re-keyed in the Studio fails loudly.
const liveKeys = photos.map((p) => p._key).sort();
const wantKeys = Object.keys(CAPTIONS).sort();
if (JSON.stringify(liveKeys) !== JSON.stringify(wantKeys)) {
  console.error("Live photo keys do not match the captions in this script.");
  console.error("  live:", liveKeys.join(", "));
  console.error("  want:", wantKeys.join(", "));
  process.exit(1);
}

const changes = photos
  .map((p) => ({
    key: p._key,
    alt: p.alt,
    from: p.caption ?? null,
    to: CAPTIONS[p._key],
  }))
  .filter((c) => c.from !== c.to);

for (const c of changes) {
  console.log(
    `${c.key}\n  alt:  ${c.alt}\n  was:  ${JSON.stringify(c.from)}\n  now:  ${JSON.stringify(c.to)}`,
  );
}
console.log(`\n${changes.length} of ${photos.length} captions to change.`);

if (changes.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}
if (!apply) {
  console.log("Dry run. Re-run with --apply to write.");
  process.exit(0);
}

// Snapshot the pre-state of the photos array before touching it.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, "backups"), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const snapshot = join(root, "backups", `gallery-captions-${stamp}.json`);
writeFileSync(
  snapshot,
  JSON.stringify({ _id: ID, section: gallery._key, photos }, null, 2),
);
console.log(`Snapshot: ${snapshot}`);

let patch = client.patch(ID);
for (const c of changes) {
  patch = patch.set({
    [`sections[_key=="${gallery._key}"].photos[_key=="${c.key}"].caption`]:
      c.to,
  });
}
await patch.commit();

// Verify by re-query: every photo now carries exactly the intended caption.
const after = await client.fetch<Photo[]>(
  `*[_id == $id][0].sections[_key == $section][0].photos[]{ _key, caption }`,
  { id: ID, section: gallery._key },
);
const wrong = after.filter((p) => p.caption !== CAPTIONS[p._key]);
if (wrong.length > 0) {
  console.error("Verification failed for:", wrong);
  process.exit(1);
}
console.log(`Verified: all ${after.length} photos captioned.`);
