import { requireEnv, resolveApiVersion } from "../lib/env-validation.ts";

// Public configuration, safe in client bundles. Each value is checked at
// module scope so a missing or mangled variable fails the build with the
// variable's name and the fix (see lib/env-validation.ts).

export const apiVersion = resolveApiVersion(
  process.env.NEXT_PUBLIC_SANITY_API_VERSION,
);

export const dataset = requireEnv(
  {
    name: "NEXT_PUBLIC_SANITY_DATASET",
    fix: "Usually `production`; the dataset list is at sanity.io/manage → Datasets.",
    pattern: /^[a-z0-9][a-z0-9_-]*$/,
    expects: "a dataset name (lowercase letters, digits, `-` or `_`)",
  },
  process.env.NEXT_PUBLIC_SANITY_DATASET,
);

export const projectId = requireEnv(
  {
    name: "NEXT_PUBLIC_SANITY_PROJECT_ID",
    fix: "Copy the project ID from sanity.io/manage into .env.local.",
    pattern: /^[a-z0-9]+$/,
    expects: "the project ID (lowercase letters and digits only, not a URL)",
  },
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
);

/** Where the embedded Studio is served. */
export const studioUrl = "/studio";
