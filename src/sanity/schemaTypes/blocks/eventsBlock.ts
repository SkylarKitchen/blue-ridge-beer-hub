import { defineField, defineType } from "sanity";

import { sectionFields, sectionPreview } from "./common";

export const eventsBlock = defineType({
  name: "eventsBlock",
  title: "Events",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "Coming up at the Hub",
    }),
    defineField({
      name: "weeklyHeading",
      title: "Weekly events heading",
      type: "string",
      initialValue: "Every week",
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("Events"),
});
