import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from "sanity/presentation";

/**
 * Tells the Presentation tool how documents and front-end URLs relate.
 * This is a one-page site, so every document renders on "/" — but the
 * mappings still matter: `mainDocuments` lets the tool open Site Settings
 * for editing when the preview shows "/", and `locations` shows editors
 * where a document appears before they publish changes to it.
 */
export const resolve: PresentationPluginOptions["resolve"] = {
  mainDocuments: defineDocuments([
    {
      route: "/",
      filter: `_type == "siteSettings"`,
    },
  ]),
  locations: {
    siteSettings: defineLocations({
      message: "Settings render across the whole homepage.",
      locations: [{ title: "Homepage", href: "/" }],
    }),
    event: defineLocations({
      select: { title: "title" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "Untitled event", href: "/" }],
      }),
    }),
    weeklyEvent: defineLocations({
      select: { title: "title" },
      resolve: (doc) => ({
        locations: [
          { title: doc?.title || "Untitled weekly event", href: "/" },
        ],
      }),
    }),
    galleryImage: defineLocations({
      message: "Gallery photos appear in the homepage gallery.",
      locations: [{ title: "Homepage", href: "/" }],
    }),
  },
};
