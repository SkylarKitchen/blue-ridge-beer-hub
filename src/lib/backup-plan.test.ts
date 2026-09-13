import assert from "node:assert/strict";
import { test } from "node:test";

import { planBackup } from "./backup-plan.ts";

// Month is zero-based: this is 13 September 2026, 09:05 local time.
const now = new Date(2026, 8, 13, 9, 5);
const env = {
  NEXT_PUBLIC_SANITY_DATASET: "production",
  SANITY_API_READ_TOKEN: "skRead",
};

test("names the tarball by dataset and local timestamp under backups/", () => {
  assert.equal(
    planBackup(env, now).file,
    "backups/production-2026-09-13-0905.tar.gz",
  );
});

test("exports the dataset to that file", () => {
  assert.deepEqual(planBackup(env, now).args, [
    "dataset",
    "export",
    "production",
    "backups/production-2026-09-13-0905.tar.gz",
  ]);
});

test("prefers a dedicated SANITY_BACKUP_TOKEN over the read token", () => {
  assert.equal(
    planBackup({ ...env, SANITY_BACKUP_TOKEN: "skBackup" }, now).token,
    "skBackup",
  );
});

test("falls back to SANITY_API_READ_TOKEN", () => {
  assert.equal(planBackup(env, now).token, "skRead");
});

test("names both token variables when neither is set", () => {
  assert.throws(
    () => planBackup({ NEXT_PUBLIC_SANITY_DATASET: "production" }, now),
    (error: Error) => {
      assert.match(error.message, /SANITY_BACKUP_TOKEN/);
      assert.match(error.message, /SANITY_API_READ_TOKEN/);
      return true;
    },
  );
});

test("names the dataset variable when it is unset", () => {
  assert.throws(
    () => planBackup({ SANITY_API_READ_TOKEN: "skRead" }, now),
    /NEXT_PUBLIC_SANITY_DATASET/,
  );
});
