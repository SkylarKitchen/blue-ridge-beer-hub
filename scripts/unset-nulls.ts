/**
 * Removes `null` values from the Home Page document.
 *
 * The section migration (2026-09-13) wrote `null` for every legacy field an
 * owner had left blank. The Studio treats a null where it expects an array or
 * object as an "Invalid property value" and shows a red reset box on the
 * section (seen on On Tap's perks list), so the fields are unset instead:
 * absent means "use the default", which is what the components already do.
 *
 *   npm run unset:nulls              # dry run: prints the patch
 *   npm run unset:nulls -- --apply   # writes (needs an Editor token)
 */
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

/** Paths of every `null` in `value`, keyed arrays addressed by `_key`. */
export function nullPaths(value: unknown, path = ""): string[] {
  if (value === null) return [path];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => {
      const key =
        item && typeof item === "object" && "_key" in item
          ? `[_key=="${(item as { _key: string })._key}"]`
          : `[${i}]`;
      return nullPaths(item, `${path}${key}`);
    });
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) =>
      nullPaths(v, path ? `${path}.${k}` : k),
    );
  }
  return [];
}

const ID = "homePage";
const doc = await client.getDocument(ID);
if (!doc) {
  console.error(`${ID} does not exist.`);
  process.exit(1);
}
const paths = nullPaths(doc);
console.log(`${apply ? "APPLY" : "DRY RUN"} → ${projectId}/${dataset}`);
console.log(`\nunset on ${ID} (${paths.length}):`);
for (const p of paths) console.log(`  ${p}`);

if (!paths.length) {
  console.log("\nNothing to do.");
  process.exit(0);
}
if (!apply) {
  console.log("\nNothing written. Re-run with --apply to commit.");
  process.exit(0);
}
const result = await client.patch(ID).unset(paths).commit();
console.log(`\nCommitted ${ID} rev ${result._rev}`);
