/**
 * One-shot: move the homepage from flat Site Settings fields into a Home
 * Page document of section blocks, and delete the two Gallery Photo docs
 * whose assets the Hero and About blocks now own.
 *
 *   npm run migrate:sections                 # dry run, reads only
 *   npm run migrate:sections -- --apply      # writes (needs an Editor token)
 *   npm run migrate:sections -- --apply --force   # overwrite an existing page
 *
 * Everything it would write or delete is printed before anything happens,
 * and it refuses to overwrite an existing Home Page (published or draft)
 * unless --force is passed.
 *
 * The document it writes is `sectionsFromSettings(settings)` — the very same
 * function the site renders from today. That is deliberate: the migrated
 * page is byte-for-byte the page the adapter already produces, so the
 * migration cannot change what visitors see. It also means the GROQ
 * projection below is load-bearing. Any field the adapter reads and the
 * projection omits arrives `undefined`, and the adapter's fallback is
 * written to Content Lake in its place. That is how an owner-uploaded hero
 * photo would have been replaced by the pinned gallery shot — a loss no
 * commit can revert. Add a field to the adapter, add it here.
 *
 * On the nulls in the output: GROQ returns `null` for a field the source
 * document does not have, and those nulls are written through rather than
 * stripped. That keeps the invariant above — what gets written IS the
 * adapter's output, unaltered — which is what makes it provable that the
 * migration cannot change the rendered page. Checked before accepting it:
 * nothing that reads a block field distinguishes null from missing. Every
 * component read goes through `??` or `?.`, which treat them identically,
 * and GROQ's `defined()` is false for both. The only `=== null` against a
 * block is on DEFAULT_ANCHOR, a local constant table, not migrated data.
 *
 * Rolling back an --apply. This is the only step in the rollout that writes
 * to a PUBLISHED document, so a mistake is visible to visitors before anyone
 * notices — but it is not unrecoverable, and it is worth knowing which half
 * is which before you need to:
 *
 *   1. Delete the `homePage` document. The page falls straight back to the
 *      legacy adapter path, which is what it renders from today.
 *   2. The two deleted Gallery Photo documents are entry documents only.
 *      Hero and About reference their ASSETS directly — verified against the
 *      live dataset: galleryImage-tap-handles points at PINNED_HERO_IMAGE and
 *      galleryImage-owners-open-flag at PINNED_ABOUT_IMAGE, character for
 *      character. Deleting a document does not delete the asset it points at,
 *      so both photos keep rendering; only their duplicate appearance in the
 *      gallery grid goes away, which is the point of the step. Recreating the
 *      two entries by hand is two documents pointing at those asset ids.
 */
import { createClient } from "@sanity/client";

import { HOME_PAGE_ID, HOME_PAGE_TYPE } from "../src/lib/edit-scope.ts";
import { sectionsFromSettings } from "../src/lib/sections.ts";
import type { SiteSettings } from "../src/lib/types";

/** The two Gallery Photo documents the Hero and About blocks now own. */
const PINNED_GALLERY_DOCS = [
  "galleryImage-tap-handles",
  "galleryImage-owners-open-flag",
];

const DRAFT_HOME_PAGE_ID = `drafts.${HOME_PAGE_ID}`;

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const force = args.has("--force");

const unknown = [...args].filter((a) => a !== "--apply" && a !== "--force");
if (unknown.length) {
  throw new Error(
    `Unknown argument(s): ${unknown.join(", ")}. Expected --apply and/or --force.`,
  );
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
// A dry run only reads, so the Viewer token from .env.local is enough.
const token =
  process.env.SANITY_API_WRITE_TOKEN ??
  (apply ? undefined : process.env.SANITY_API_READ_TOKEN);
if (!projectId || !dataset) throw new Error("Missing NEXT_PUBLIC_SANITY_* env");
if (!token) {
  throw new Error(
    apply
      ? "Set SANITY_API_WRITE_TOKEN (an Editor token) to apply. A Viewer token cannot write."
      : "Set SANITY_API_READ_TOKEN in .env.local for the dry run.",
  );
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-09-02",
  token,
  useCdn: false,
  perspective: "published",
});

/*
 * Every field `sectionsFromSettings` reads. `heroImage` and `aboutImage` are
 * the ones to watch: they are owner-editable, an upload is meant to replace
 * the shipped photo, and omitting them here would silently write the pinned
 * asset over a real one.
 *
 * `offerings[]` is projected without `_type` on purpose (a deviation from
 * ruling P5, which asked for it): the adapter now writes `_type: "offering"`
 * unconditionally, so a projected value would be overwritten in the same
 * expression. Asking for it here would imply the live value decides the
 * outcome, and it does not.
 */
const SETTINGS_PROJECTION = `*[_type == "siteSettings"][0]{
  heroHeading, heroSubheading, heroPrimaryCta, heroSecondaryCta,
  heroImage{asset, hotspot, crop, alt},
  eventsHeading, weeklyHeading,
  onTapHeading, onTapBlurb, onTapSecondary, onTapCta,
  tapCount, tapCountLabel, tapCountFootnote, tapPerks,
  offeringsHeading, offerings[]{_key, title, description},
  galleryHeading,
  aboutHeading, aboutBody, credentials,
  aboutImage{asset, hotspot, crop, alt}
}`;

const settings = await client.fetch<SiteSettings | null>(SETTINGS_PROJECTION);
if (!settings) throw new Error("No published Site Settings document");

const sections = sectionsFromSettings(settings);
const doc = { _id: HOME_PAGE_ID, _type: HOME_PAGE_TYPE, sections };

// Both ids, per ruling P4: a leftover experiment draft shadows the migrated
// page in the Studio, so an unforced run must refuse on either.
const [existing, existingDraft] = await Promise.all([
  client.getDocument(HOME_PAGE_ID),
  client.getDocument(DRAFT_HOME_PAGE_ID),
]);

const deletions: string[] = [];
for (const id of PINNED_GALLERY_DOCS) {
  if (await client.getDocument(id)) deletions.push(id);
}
if (existingDraft && force) deletions.push(DRAFT_HOME_PAGE_ID);

console.log(`${apply ? "WRITING" : "DRY RUN"} → ${projectId}/${dataset}\n`);

/* ---------- Summary first; the full document is below it ---------- */
console.log("Summary");
console.log(`  sections:   ${sections.length}`);
for (const section of sections) {
  console.log(`    - ${section._key.padEnd(20)} ${section._type}`);
}

// Which photo each block ended up with. The interesting line is "OWNER
// UPLOAD": it says the projection carried the field and the adapter kept it.
const photoSource = (owner: unknown) =>
  owner ? "OWNER UPLOAD (preserved)" : "pinned default";
console.log(`  hero photo:  ${photoSource(settings.heroImage?.asset)}`);
console.log(`  about photo: ${photoSource(settings.aboutImage?.asset)}`);

const offerings = sections.find((s) => s._type === "offeringsBlock");
const cards = offerings?._type === "offeringsBlock" ? offerings.cards : undefined;
console.log(
  `  offerings:   ${cards?.length ?? 0} card(s), keys ${
    cards?.map((c) => c._key).join(", ") || "(none)"
  }`,
);
// "card-N" means the projection lost the live keys and the migration would
// re-key the cards, orphaning any on-page edit addressed by the old key.
const synthesized = cards?.filter((c) => /^card-\d+$/.test(c._key ?? "")) ?? [];
if (synthesized.length) {
  console.log(
    `    ⚠️  ${synthesized.length} key(s) synthesized, not live. Do not --apply.`,
  );
}
console.log(`  deleting:    ${deletions.join(", ") || "(nothing)"}`);
console.log(
  `  home page:   published ${existing ? "EXISTS" : "absent"}, draft ${
    existingDraft ? "EXISTS" : "absent"
  }`,
);

console.log("\ncreateOrReplace:");
console.log(JSON.stringify(doc, null, 2));

if (existing || existingDraft) {
  const which = [
    existing && HOME_PAGE_ID,
    existingDraft && DRAFT_HOME_PAGE_ID,
  ].filter(Boolean);
  if (!force) {
    throw new Error(
      `${which.join(" and ")} already exist(s). Pass --force to overwrite.`,
    );
  }
  console.log(`\n--force: overwriting ${which.join(" and ")}.`);
}

if (!apply) {
  console.log("\nNothing written. Re-run with --apply to commit.");
  process.exit(0);
}

let tx = client.transaction().createOrReplace(doc);
for (const id of deletions) tx = tx.delete(id);
const result = await tx.commit();
console.log("\nCommitted transaction", result.transactionId);
