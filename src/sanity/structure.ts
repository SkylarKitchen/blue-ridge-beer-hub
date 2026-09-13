import type { StructureResolver } from "sanity/structure";

/**
 * Studio sidebar: Home Page and Site Settings pinned as singletons, then
 * the two owner-managed lists. Photos live on the Home Page's Photos
 * section, not in a list of their own.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Home Page")
        .id("homePage")
        .child(S.document().schemaType("homePage").documentId("homePage")),
      S.listItem()
        .title("Site Settings")
        .id("siteSettings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
      S.divider(),
      S.documentTypeListItem("event").title("Events"),
      S.documentTypeListItem("weeklyEvent").title("Weekly Events"),
    ]);
