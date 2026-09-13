import { optionalEnv } from "../lib/env-validation.ts";

// Server-only: never import from client components. Both tokens are
// optional — the public site works without them — but a set value must
// look like a token, so a pasted quote or stray space fails loudly instead
// of quietly turning previews off (see lib/env-validation.ts).

const TOKEN = {
  pattern: /^\S+$/,
  expects: "a single token with no spaces or quotes",
};

/** Viewer token: draft-mode previews in the Studio's visual editor. */
export const readToken = optionalEnv(
  {
    name: "SANITY_API_READ_TOKEN",
    fix: "Create a Viewer token at sanity.io/manage → API → Tokens.",
    ...TOKEN,
  },
  process.env.SANITY_API_READ_TOKEN,
);

/** Editor token: the flyer pipeline's draft creation and publishing. */
export const writeToken = optionalEnv(
  {
    name: "SANITY_API_WRITE_TOKEN",
    fix: "Create an Editor token at sanity.io/manage → API → Tokens.",
    ...TOKEN,
  },
  process.env.SANITY_API_WRITE_TOKEN,
);
