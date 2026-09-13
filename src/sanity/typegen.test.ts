import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

/**
 * TypeGen drift guards. `npm run typegen` extracts the Studio schema to
 * schema.json and generates sanity.types.ts from it; both are committed so
 * `sanityFetch` results are typed through the `SanityQueries` map the
 * generated file augments onto `@sanity/client`. Neither artifact regenerates
 * itself, so these checks fail when a schema type or query changes without a
 * re-run — the case where the types would otherwise go quietly stale.
 *
 * sanity.config.ts can't be imported under `node --test` (it pulls in the
 * Studio), so type names are read from the schema sources the way
 * studio-singletons.test.ts reads the config.
 */
const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

/** Types Sanity adds to every extracted schema; not ours to keep in sync. */
const BUILT_IN = /^sanity\.|^geopoint$|^slug$/;

function definedTypeNames(): string[] {
  const dir = new URL("schemaTypes/", import.meta.url);
  const names: string[] = [];
  const walk = (path: string) => {
    for (const entry of readdirSync(new URL(path, dir), {
      withFileTypes: true,
    })) {
      const rel = join(path, entry.name);
      if (entry.isDirectory()) walk(`${rel}/`);
      else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
        const source = readFileSync(new URL(rel, dir), "utf8");
        // The name is the first field after `defineType({`; every schema
        // file here writes it that way.
        for (const match of source.matchAll(
          /defineType\(\{\s*name:\s*"([^"]+)"/g,
        )) {
          names.push(match[1]);
        }
      }
    }
  };
  walk("");
  return names.sort();
}

function schemaJson(): {
  name: string;
  attributes?: Record<string, unknown>;
}[] {
  return JSON.parse(read("schema.json"));
}

test("package.json typegen script extracts with required fields enforced, then generates", () => {
  const pkg = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
  };
  const typegen = pkg.scripts.typegen;
  assert.ok(typegen, "package.json must have a typegen script");
  assert.match(typegen, /sanity schema extract --enforce-required-fields/);
  assert.match(typegen, /sanity typegen generate/);
});

test("schema.json declares exactly the types defined under src/sanity/schemaTypes", () => {
  const extracted = schemaJson()
    .map((type) => type.name)
    .filter((name) => !BUILT_IN.test(name))
    .sort();
  assert.deepEqual(
    extracted,
    definedTypeNames(),
    "schema.json is stale — run `npm run typegen` and commit the result",
  );
});

test("schema.json marks a rule.required() field as non-optional (weeklyEvent.title)", () => {
  const weekly = schemaJson().find((type) => type.name === "weeklyEvent");
  assert.ok(weekly, "schema.json must contain weeklyEvent");
  const title = weekly.attributes?.title as { optional?: boolean } | undefined;
  assert.ok(title, "weeklyEvent must have a title attribute");
  assert.equal(
    title.optional,
    false,
    "weeklyEvent.title has rule.required(), so extraction must run with --enforce-required-fields",
  );
});

test("schema.json matches a fresh extract of the working tree's schema", (t) => {
  if (!existsSync(new URL(".env.local", root))) {
    t.skip(
      "needs .env.local — the CLI loads sanity.config.ts, which asserts the project vars",
    );
    return;
  }
  // The CLI resolves --path against the repo root, so keep the scratch file
  // somewhere already gitignored.
  const scratch = "node_modules/.cache/typegen-check/schema.json";
  rmSync(new URL(scratch, root), { force: true }); // the CLI won't overwrite
  const result = spawnSync(
    "node_modules/.bin/sanity",
    ["schema", "extract", "--enforce-required-fields", "--path", scratch],
    { cwd: fileURLToPath(root), encoding: "utf8" },
  );
  assert.equal(
    result.status,
    0,
    `schema extract failed:\n${result.stdout}${result.stderr}`,
  );
  assert.deepEqual(
    JSON.parse(read(scratch)),
    schemaJson(),
    "schema.json is stale — run `npm run typegen` and commit the result",
  );
});

test("sanity.types.ts carries a result type for every exported query", () => {
  const queries = [
    ...read("src/sanity/queries.ts").matchAll(
      /^export const ([A-Z_]+_QUERY)\b/gm,
    ),
  ].map((match) => match[1]);
  assert.ok(queries.length > 0, "queries.ts must export at least one query");

  const generated = read("sanity.types.ts");
  for (const query of queries) {
    assert.match(
      generated,
      new RegExp(`^export type ${query}_RESULT = `, "m"),
      `${query} has no generated result type — run \`npm run typegen\` and commit the result`,
    );
  }
});
