import { client } from "./client";

/**
 * Mutation-capable client for the flyer pipeline. `raw` perspective so
 * queries see drafts AND published docs (dedupe needs both). Server-only:
 * never import from client components.
 */
export const writeClient = client.withConfig({
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});
