/**
 * Pure checks for the environment variables the site boots on. Kept free of
 * `process.env` so node:test can drive them directly; `src/sanity/env.ts`
 * (public vars, safe in client bundles) and `src/sanity/serverEnv.ts`
 * (tokens) feed the real environment through at module scope, so a bad
 * value fails `next build` or boot with a message that names the variable
 * and the fix instead of surfacing as an opaque Sanity error at request time.
 *
 * Borrowed from sanity-live-starter's envValidation.ts; this repo's
 * .env.example uses blank values rather than placeholders, so the check that
 * matters most here is that an empty string counts as unset.
 */

export interface EnvVarSpec {
  /** Full variable name, e.g. "NEXT_PUBLIC_SANITY_PROJECT_ID". */
  name: string;
  /** One-line remedy appended to every error for this variable. */
  fix: string;
  /** What a well-formed value looks like. */
  pattern?: RegExp;
  /** Plain-English reading of `pattern`, for the error message. */
  expects?: string;
}

/** The API version the client pins when the env leaves it unset. */
export const DEFAULT_API_VERSION = "2026-09-02";

function checkShape(spec: EnvVarSpec, value: string): string {
  if (spec.pattern && !spec.pattern.test(value)) {
    throw new Error(
      `${spec.name} is set to something unexpected; it should be ${spec.expects ?? "a valid value"}. ${spec.fix}`,
    );
  }
  return value;
}

/** A variable the site cannot run without. Empty counts as unset. */
export function requireEnv(
  spec: EnvVarSpec,
  value: string | undefined,
): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") {
    throw new Error(`Missing environment variable: ${spec.name}. ${spec.fix}`);
  }
  return checkShape(spec, trimmed);
}

/**
 * A variable that switches a feature on when present. Unset or empty means
 * "off"; a malformed value is still an error, because a mangled token would
 * otherwise disable previews silently.
 */
export function optionalEnv(
  spec: EnvVarSpec,
  value: string | undefined,
): string | undefined {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") return undefined;
  return checkShape(spec, trimmed);
}

export function resolveApiVersion(value: string | undefined): string {
  return (
    optionalEnv(
      {
        name: "NEXT_PUBLIC_SANITY_API_VERSION",
        fix: `Use a date like ${DEFAULT_API_VERSION}, or leave it unset for the default.`,
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        expects: "an API date (YYYY-MM-DD)",
      },
      value,
    ) ?? DEFAULT_API_VERSION
  );
}
