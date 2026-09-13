import { requireEnv } from "./env-validation.ts";

/** What `scripts/backup.ts` is about to run, resolved from the environment. */
export interface BackupPlan {
  /** Token the Sanity CLI exports with (as SANITY_AUTH_TOKEN). */
  token: string;
  /** Dated tarball path, relative to the repo root. */
  file: string;
  /** Arguments for the `sanity` binary. */
  args: string[];
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Pure so it can be tested without a network or a clock. The timestamp is
 * local time, which is how the person running it will remember "the backup
 * I took before the migration".
 */
export function planBackup(
  env: Record<string, string | undefined>,
  now: Date,
): BackupPlan {
  const dataset = requireEnv(
    {
      name: "NEXT_PUBLIC_SANITY_DATASET",
      fix: "Set it in .env.local (usually `production`).",
    },
    env.NEXT_PUBLIC_SANITY_DATASET,
  );

  // Export needs dataset read access. A dedicated token keeps one token per
  // job; the Viewer token the previews use has the same read scope.
  const token =
    env.SANITY_BACKUP_TOKEN?.trim() || env.SANITY_API_READ_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "No token for the export: set SANITY_BACKUP_TOKEN or SANITY_API_READ_TOKEN in .env.local (a Viewer token from sanity.io/manage → API → Tokens).",
    );
  }

  const stamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("-");
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  const file = `backups/${dataset}-${stamp}-${time}.tar.gz`;

  return { token, file, args: ["dataset", "export", dataset, file] };
}
