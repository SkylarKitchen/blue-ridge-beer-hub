import { defineEnableDraftMode } from "next-sanity/draft-mode";

import { client } from "@/sanity/client";

/**
 * The Presentation tool calls this (see `previewUrl.previewMode.enable` in
 * sanity.config.ts) with a signed secret; next-sanity validates it against
 * the Sanity API before setting Next's draft-mode cookie.
 */
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
});
