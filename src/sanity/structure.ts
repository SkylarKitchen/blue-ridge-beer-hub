import type { StructureResolver } from "sanity/structure";

/**
 * Studio sidebar: Site Settings pinned as a singleton, then the three
 * owner-managed lists. Events default to soonest-first.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Site Settings")
        .id("siteSettings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
      S.divider(),
      S.documentTypeListItem("event").title("Events"),
      S.documentTypeListItem("weeklyEvent").title("Weekly Events"),
      S.documentTypeListItem("galleryImage").title("Gallery Photos"),
    ]);
