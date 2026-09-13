import { defineField, defineType } from "sanity";

import { sectionFields, sectionPreview } from "./common";

export const aboutBlock = defineType({
  name: "aboutBlock",
  title: "About",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "About the Hub",
    }),
    defineField({
      name: "body",
      title: "Text",
      type: "array",
      of: [
        {
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
        },
      ],
    }),
    defineField({
      name: "credentials",
      title: "Trust badges",
      type: "array",
      of: [{ type: "string" }],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Describe this photo",
          type: "string",
        }),
      ],
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("About"),
});
