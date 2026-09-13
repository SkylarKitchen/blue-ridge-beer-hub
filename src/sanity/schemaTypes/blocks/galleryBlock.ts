import { defineField, defineType } from "sanity";

import { sectionFields, sectionPreview } from "./common";

export const galleryBlock = defineType({
  name: "galleryBlock",
  title: "Photos",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "Inside the Hub",
      description:
        "The photos themselves live under Gallery Photos in Structure.",
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("Photos"),
});
