import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, studioUrl } from "./env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  // Stega encoding powers the click-to-edit overlays in the Presentation
  // tool. Only active during draft-mode previews; published pages are clean.
  stega: { studioUrl },
});
