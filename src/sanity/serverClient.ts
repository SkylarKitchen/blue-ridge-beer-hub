import { client } from "./client";
import { writeToken } from "./serverEnv";

/**
 * Mutation-capable client for the flyer pipeline. `raw` perspective so
 * queries see drafts AND published docs (dedupe needs both). Server-only:
 * never import from client components.
 */
export const writeClient = client.withConfig({
  token: writeToken,
  useCdn: false,
  perspective: "raw",
});
