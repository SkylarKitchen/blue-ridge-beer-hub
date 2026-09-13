import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from "sanity/presentation";

/**
 * Tells the Presentation tool how documents and front-end URLs relate.
 * This is a one-page site, so every document renders on "/" — but the
 * mappings still matter: `mainDocuments` lets the tool open the Home Page
 * for editing when the preview shows "/", and `locations` shows editors
 * where a document appears before they publish changes to it.
 */
export const resolve: PresentationPluginOptions["resolve"] = {
  mainDocuments: defineDocuments([
    {
      route: "/",
      filter: `_type == "homePage"`,
    },
  ]),
  locations: {
    homePage: defineLocations({
      message: "The Home Page is the homepage, top to bottom.",
      locations: [{ title: "Homepage", href: "/" }],
    }),
    siteSettings: defineLocations({
      message: "Your name, hours and links show across the whole homepage.",
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
