import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import nextConfig from "../../next.config.ts";

/**
 * Analytics wiring guards. PostHog only counts visitors while three pieces
 * line up: the first-party /ingest rewrites in next.config.ts, the
 * production-only init in PostHogInit, and the (site) layout rendering it
 * outside draft mode. Each is a few lines a refactor could drop with no
 * visible failure (the site keeps working, the numbers just stop), so this
 * pins them. Source-text checks in the spirit of scripts/main-invariants.sh:
 * they prove the text is present, not that events arrive. The live check is
 * a $pageview in PostHog, done by hand on 2026-09-19.
 */
const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

test("next.config proxies /ingest to PostHog with trailing slashes intact", async () => {
  const rewrites = await nextConfig.rewrites!();
  const list = Array.isArray(rewrites)
    ? rewrites
    : [...(rewrites.beforeFiles ?? []), ...(rewrites.afterFiles ?? []), ...(rewrites.fallback ?? [])];
  const bySource = Object.fromEntries(list.map((r) => [r.source, r.destination]));
  assert.equal(bySource["/ingest/static/:path*"], "https://us-assets.i.posthog.com/static/:path*");
  assert.equal(bySource["/ingest/array/:path*"], "https://us-assets.i.posthog.com/array/:path*");
  assert.equal(bySource["/ingest/:path*"], "https://us.i.posthog.com/:path*");
  // PostHog's event endpoint ends in a slash; a 308 to strip it would lose the POST body.
  assert.equal(nextConfig.skipTrailingSlashRedirect, true);
});

test("PostHogInit talks to /ingest, only on the production deployment, without replay", () => {
  const src = read("src/components/PostHogInit.tsx");
  assert.match(src, /api_host:\s*"\/ingest"/);
  assert.match(src, /NEXT_PUBLIC_VERCEL_ENV !== "production"/);
  assert.match(src, /disable_session_recording:\s*true/);
  // The owners' opt-out link from the guide.
  assert.match(src, /params\.has\("nostats"\)/);
});

test("the (site) layout renders PostHogInit once, outside draft mode only", () => {
  const src = read("src/app/(site)/layout.tsx");
  const draftBranch = src.indexOf("isEnabled ? (");
  const publicBranch = src.indexOf(") : (", draftBranch);
  const init = src.indexOf("<PostHogInit />");
  assert.ok(draftBranch > -1 && publicBranch > draftBranch, "layout no longer branches on draft mode");
  assert.ok(init > publicBranch, "PostHogInit must sit in the non-draft branch");
  assert.equal(src.indexOf("<PostHogInit />", init + 1), -1, "PostHogInit rendered more than once");
});
