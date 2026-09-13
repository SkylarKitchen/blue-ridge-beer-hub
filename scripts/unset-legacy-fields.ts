/**
 * One-shot follow-up to the 2026-09-13 sections migration: unset the flat
 * copy fields on the live Site Settings document now that the Home Page
 * document owns that content and the schema no longer defines them.
 *
 *   npm run unset:legacy              # dry run, reads only
 *   npm run unset:legacy -- --apply   # writes (needs an Editor token)
 *
 * The patch it would send is printed before anything happens. Without
 * --apply the script holds the Viewer token when one is set, so a dry run
 * cannot write even by accident.
 *
 * Both `siteSettings` and `drafts.siteSettings` are patched when present.
 * Leaving the draft alone would look fine until the owners next pressed
 * Publish on Site Settings, which would copy the stale fields back onto the
 * published document — invisible to the site, which no longer projects
 * them, but a permanent "Unknown fields" panel in the Studio form.
 *
 * Nothing here can lose copy the site shows. Every field below was copied
 * onto a Home Page block by the migration (spec: "Legacy field map"), and
 * the frontend stopped reading them from Site Settings in the same PR that
 * added this script. Undo, should it ever matter, is restoring the fields
 * from the dataset's history in the Studio's document history view.
 */
import { createClient } from "@sanity/client";

import { SITE_SETTINGS_ID } from "../src/lib/edit-scope.ts";

/**
 * The spec's legacy field map, plus the two owner-editable photo fields the
 * migration carried into the Hero and About blocks (settled on issue #13).
 */
const LEGACY_FIELDS = [
  "heroHeading",
  "heroSubheading",
  "heroPrimaryCta",
  "heroSecondaryCta",
  "heroImage",
  "eventsHeading",
  "weeklyHeading",
  "onTapHeading",
  "onTapBlurb",
  "onTapSecondary",
  "onTapCta",
  "tapCount",
  "tapCountLabel",
  "tapCountFootnote",
  "tapPerks",
  "offeringsHeading",
  "offerings",
  "galleryHeading",
  "aboutHeading",
  "aboutBody",
  "aboutImage",
  "credentials",
];

const DRAFT_ID = `drafts.${SITE_SETTINGS_ID}`;

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const unknown = [...args].filter((a) => a !== "--apply");
if (unknown.length) {
  throw new Error(
    `Unknown argument(s): ${unknown.join(", ")}. Expected --apply or nothing.`,
  );
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
// A dry run prefers the Viewer token so that it structurally cannot write.
const token = apply
  ? process.env.SANITY_API_WRITE_TOKEN
  : (process.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN);
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
});

console.log(`${apply ? "WRITING" : "DRY RUN"} → ${projectId}/${dataset}\n`);

interface Plan {
  id: string;
  present: string[];
}

const plans: Plan[] = [];
for (const id of [SITE_SETTINGS_ID, DRAFT_ID]) {
  const doc = await client.getDocument(id);
  if (!doc) {
    console.log(`${id}: absent, nothing to do`);
    continue;
  }
  const present = LEGACY_FIELDS.filter((f) => f in doc);
  const absent = LEGACY_FIELDS.filter((f) => !(f in doc));
  console.log(`${id}: ${present.length} legacy field(s) set`);
  if (present.length) console.log(`  unset:   ${present.join(", ")}`);
  if (absent.length) console.log(`  already: ${absent.join(", ")}`);
  if (present.length) plans.push({ id, present });
}

if (!plans.length) {
  console.log("\nNo legacy fields on either document. Nothing to unset.");
  process.exit(0);
}

console.log("\npatch:");
for (const plan of plans) {
  console.log(JSON.stringify({ patch: { id: plan.id, unset: plan.present } }));
}

if (!apply) {
  console.log("\nNothing written. Re-run with --apply to commit.");
  process.exit(0);
}

let tx = client.transaction();
for (const plan of plans) {
  tx = tx.patch(plan.id, (p) => p.unset(plan.present));
}
const result = await tx.commit();
console.log("\nCommitted transaction", result.transactionId);
