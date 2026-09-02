import { defineLive } from "next-sanity/live";

import { client } from "./client";

// Live updates of published content need no token; a read token would only be
// required for draft-mode previews, which this site doesn't use.
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: false,
  browserToken: false,
});
