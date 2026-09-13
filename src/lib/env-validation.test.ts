import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_API_VERSION,
  optionalEnv,
  requireEnv,
  resolveApiVersion,
  type EnvVarSpec,
} from "./env-validation.ts";

const projectId: EnvVarSpec = {
  name: "NEXT_PUBLIC_SANITY_PROJECT_ID",
  fix: "Copy the project ID from sanity.io/manage into .env.local.",
  pattern: /^[a-z0-9]+$/,
  expects: "lowercase letters and digits only",
};

const token: EnvVarSpec = {
  name: "SANITY_API_READ_TOKEN",
  fix: "Create a Viewer token at sanity.io/manage → API → Tokens.",
  pattern: /^\S+$/,
  expects: "a single token with no spaces or quotes",
};

test("requireEnv returns the value, trimmed", () => {
  assert.equal(requireEnv(projectId, " abc123 "), "abc123");
});

test("requireEnv names the variable and the fix when it is unset", () => {
  assert.throws(
    () => requireEnv(projectId, undefined),
    (error: Error) => {
      assert.match(error.message, /NEXT_PUBLIC_SANITY_PROJECT_ID/);
      assert.match(
        error.message,
        /Copy the project ID from sanity\.io\/manage/,
      );
      return true;
    },
  );
});

test("requireEnv treats an empty value as unset (a .env.example copied as-is)", () => {
  assert.throws(
    () => requireEnv(projectId, ""),
    /NEXT_PUBLIC_SANITY_PROJECT_ID/,
  );
  assert.throws(
    () => requireEnv(projectId, "   "),
    /NEXT_PUBLIC_SANITY_PROJECT_ID/,
  );
});

test("requireEnv rejects a value that does not match the spec's pattern, saying what it expects", () => {
  assert.throws(
    () => requireEnv(projectId, "https://abc123.api.sanity.io"),
    (error: Error) => {
      assert.match(error.message, /NEXT_PUBLIC_SANITY_PROJECT_ID/);
      assert.match(error.message, /lowercase letters and digits only/);
      assert.match(error.message, /Copy the project ID/);
      return true;
    },
  );
});

test("optionalEnv returns undefined when unset or empty", () => {
  assert.equal(optionalEnv(token, undefined), undefined);
  assert.equal(optionalEnv(token, ""), undefined);
  assert.equal(optionalEnv(token, "  "), undefined);
});

test("optionalEnv returns a set value, trimmed", () => {
  assert.equal(optionalEnv(token, "skAbc\n"), "skAbc");
});

test("optionalEnv still rejects a malformed value rather than silently disabling the feature", () => {
  assert.throws(
    () => optionalEnv(token, '"sk abc"'),
    (error: Error) => {
      assert.match(error.message, /SANITY_API_READ_TOKEN/);
      assert.match(error.message, /no spaces or quotes/);
      return true;
    },
  );
});

test("resolveApiVersion falls back to the pinned default when unset", () => {
  assert.equal(resolveApiVersion(undefined), DEFAULT_API_VERSION);
  assert.equal(resolveApiVersion(""), DEFAULT_API_VERSION);
  assert.match(DEFAULT_API_VERSION, /^\d{4}-\d{2}-\d{2}$/);
});

test("resolveApiVersion accepts a date and rejects anything else", () => {
  assert.equal(resolveApiVersion("2026-01-15"), "2026-01-15");
  assert.throws(
    () => resolveApiVersion("latest"),
    /NEXT_PUBLIC_SANITY_API_VERSION/,
  );
});
