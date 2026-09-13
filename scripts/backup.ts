/**
 * Dataset backup: wraps `sanity dataset export` (documents plus assets,
 * gzipped) into the gitignored backups/ folder with a dated filename.
 *
 *   npm run backup
 *
 * Run it before anything that writes to the live dataset — a seed import,
 * one of the unset:* scripts, a bulk edit. Restoring is the reverse:
 *
 *   npx sanity dataset import backups/<file> production --replace
 *
 * Auth comes from SANITY_BACKUP_TOKEN, falling back to SANITY_API_READ_TOKEN
 * (both read-scoped); project and dataset come from the NEXT_PUBLIC_SANITY_*
 * vars via sanity.cli.ts. Borrowed from sanity-live-starter's backup.mjs.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { planBackup } from "../src/lib/backup-plan.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const plan = planBackup(process.env, new Date());

mkdirSync(join(root, "backups"), { recursive: true });
console.log(`Exporting to ${plan.file} …`);

const result = spawnSync(join(root, "node_modules/.bin/sanity"), plan.args, {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, SANITY_AUTH_TOKEN: plan.token },
});

if (result.status !== 0) {
  console.error(`Export failed (exit ${result.status ?? "signal"}).`);
  process.exit(result.status ?? 1);
}
console.log(`Backup written: ${plan.file}`);
