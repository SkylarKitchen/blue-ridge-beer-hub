import { defineLive } from "next-sanity/live";

import { client } from "./client";
import { readToken as token } from "./serverEnv";

// Viewer-scope token: unlocks draft-mode previews (the Studio's visual
// editor). Without it the site still works — live updates of published
// content need no token — so `false` keeps unconfigured environments viable.

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token ?? false,
  browserToken: token ?? false,
});
