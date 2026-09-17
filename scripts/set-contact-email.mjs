/**
 * Sets Site Settings → "Email address" (the public contact email shown in
 * the footer and the LocalBusiness JSON-LD).
 *
 * Dry run (default) reads and prints the plan, writes nothing:
 *   node --env-file=.env.local scripts/set-contact-email.mjs
 * Apply:
 *   APPLY=1 node --env-file=.env.local scripts/set-contact-email.mjs
 * Another address:
 *   EMAIL=someone@example.com APPLY=1 node --env-file=.env.local scripts/set-contact-email.mjs
 *
 * Auth is SANITY_API_WRITE_TOKEN from .env.local (or SANITY_AUTH_TOKEN).
 * Plain node rather than `sanity exec` because the latter needs esbuild for
 * the TypeScript CLI config, and Santa kills that binary on Skylar's Mac.
 *
 * Touches the published document and, if one exists, its draft — otherwise
 * the next Publish from the Studio would overwrite the field with the draft's
 * copy. Idempotent: a document already on the address is skipped. Pre-state
 * is written to SNAPSHOT_DIR (default: the OS temp dir) before anything changes.
 *
 * The live site caches this query in the Vercel data cache with no time limit
 * (next-sanity's sanityFetch sets revalidate: false plus Sanity sync tags). A
 * browser with the site open expires the tag on the live event; with nobody
 * connected, the old address stays up until the tag is expired by hand. The
 * script prints the exact `vercel cache invalidate` command for that.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { createClient } from "@sanity/client";

const EMAIL = process.env.EMAIL || "blueridgebeerhubnc@gmail.com";
const IDS = ["siteSettings", "drafts.siteSettings"];
const SNAPSHOT_DIR = process.env.SNAPSHOT_DIR || path.join(os.tmpdir(), "beer-hub-snapshots");
const APPLY = process.env.APPLY === "1";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} — run with --env-file=.env.local`);
  return value;
}

function authToken() {
  const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN;
  if (!token) throw new Error("Set SANITY_API_WRITE_TOKEN (in .env.local) or SANITY_AUTH_TOKEN.");
  return token;
}

const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{email}`;

async function printCacheHint(client) {
  const { syncTags = [] } = await client.fetch(SITE_SETTINGS_QUERY, {}, { filterResponse: false });
  if (syncTags.length === 0) return;
  const tags = syncTags.map((t) => `sanity:${t}`).join(",");
  console.log(`\nThe live site serves this field from the Vercel data cache until its tag expires.`);
  console.log(`If nobody had the site open in a browser when this changed, expire it now:`);
  console.log(`  vercel cache invalidate --tag ${tags} --yes`);
}

async function main() {
  if (!/.+@.+\..+/.test(EMAIL)) throw new Error(`Not an email: ${EMAIL}`);
  const projectId = required("NEXT_PUBLIC_SANITY_PROJECT_ID");
  const dataset = required("NEXT_PUBLIC_SANITY_DATASET");
  const client = createClient({ projectId, dataset, apiVersion: "2026-09-02", token: authToken(), useCdn: false });
  console.log(`project ${projectId} · dataset ${dataset} · ${APPLY ? "APPLY" : "DRY RUN"}`);

  const docs = (await client.getDocuments(IDS)).filter(Boolean);
  if (docs.length === 0) throw new Error("No siteSettings document found — refusing to write.");

  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshot = path.join(SNAPSHOT_DIR, `siteSettings-email-${stamp}.json`);
  writeFileSync(snapshot, JSON.stringify(docs, null, 2));
  console.log(`snapshot of ${docs.length} doc(s) -> ${snapshot}`);

  const plan = [];
  for (const doc of docs) {
    if (doc._type !== "siteSettings") throw new Error(`${doc._id} is a ${doc._type}, not siteSettings`);
    const before = doc.email;
    if (before !== undefined && typeof before !== "string") {
      throw new Error(`${doc._id}.email is not a string: ${JSON.stringify(before)}`);
    }
    if (before === EMAIL) {
      console.log(`${doc._id}: already ${EMAIL} — skip`);
      continue;
    }
    plan.push({ id: doc._id, before });
    console.log(`${doc._id}: ${JSON.stringify(before)} -> ${JSON.stringify(EMAIL)}`);
  }
  if (plan.length === 0) {
    console.log("nothing to do");
    return printCacheHint(client);
  }
  if (!APPLY) return console.log(`dry run only — ${plan.length} doc(s) would change. Re-run with APPLY=1 to write.`);

  const tx = client.transaction();
  for (const { id } of plan) tx.patch(id, (p) => p.set({ email: EMAIL }));
  const result = await tx.commit();
  console.log(`committed transaction ${result.transactionId}`);

  const after = (await client.getDocuments(plan.map((p) => p.id))).filter(Boolean);
  for (const { id } of plan) {
    const email = (after.find((d) => d._id === id) || {}).email;
    if (email !== EMAIL) throw new Error(`verify failed for ${id}: ${JSON.stringify(email)}`);
    console.log(`verified ${id}: email is ${email}`);
  }
  await printCacheHint(client);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
