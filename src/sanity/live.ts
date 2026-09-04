import { defineLive } from "next-sanity/live";

import { client } from "./client";

// Viewer-scope token: unlocks draft-mode previews (the Studio's visual
// editor). Without it the site still works — live updates of published
// content need no token — so `false` keeps unconfigured environments viable.
const token = process.env.SANITY_API_READ_TOKEN;

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token ?? false,
  browserToken: token ?? false,
});
