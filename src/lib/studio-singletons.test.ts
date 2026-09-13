import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// sanity.config.ts pulls the whole Studio (React, styled-components) into
// whatever imports it, so it can't be loaded under `node --test`. These
// checks read its source instead, the way home-page-source.test.ts reads
// page.tsx.
//
// Why they exist: the SINGLETONS set is the only thing keeping the fixed-id
// documents out of the global "+ Create" menu and away from delete and
// duplicate. Each of them is read with a `[0]` or a fixed _id that is only
// safe while exactly one exists. Task 12 added the homePage document type
// and pinned it in Structure without adding it here, and nothing else in
// the suite noticed.
const source = readFileSync(
  new URL("../../sanity.config.ts", import.meta.url),
  "utf8",
);

const match = source.match(/const SINGLETONS = new Set\(\[([^\]]*)\]\);/);
const singletons = match
  ? match[1]
      .split(",")
      .map((entry) => entry.trim().replace(/^"|"$/g, ""))
      .filter(Boolean)
  : [];

test("sanity.config.ts declares the SINGLETONS set", () => {
  assert.ok(
    match,
    "sanity.config.ts has no `const SINGLETONS = new Set([...])` literal. " +
      "The checks below read it from source; without it they would pass " +
      "vacuously and the singleton guard could vanish unnoticed.",
  );
});

test("siteSettings stays a singleton", () => {
  assert.ok(
    singletons.includes("siteSettings"),
    'SINGLETONS lost "siteSettings". Site Settings comes back in the global ' +
      "+ Create menu with delete and duplicate available. The settings query " +
      'is `*[_type == "siteSettings"][0]`, so a second copy makes the header, ' +
      "hours and footer read from whichever document Content Lake returns " +
      "first.",
  );
});

test("pipelineState stays a singleton", () => {
  assert.ok(
    singletons.includes("pipelineState"),
    'SINGLETONS lost "pipelineState". The pipeline reads and writes one ' +
      'document at the fixed _id "pipelineState" (lib/pipeline/state.ts). A ' +
      "copy made from the + Create menu is never read, and deleting the real " +
      "one resets whatever the pipeline had recorded.",
  );
});

test("homePage stays a singleton", () => {
  assert.ok(
    singletons.includes("homePage"),
    'SINGLETONS lost "homePage". Home Page comes back in the global + Create ' +
      "menu with delete and duplicate available. HOME_PAGE_QUERY is " +
      '`*[_type == "homePage"][0]` with no _id filter, so its [0] is only ' +
      "safe while exactly one exists: a second Home Page makes the live " +
      "page's content arbitrary, and deleting the only one silently drops " +
      "the site back to the legacy adapter.",
  );
});
