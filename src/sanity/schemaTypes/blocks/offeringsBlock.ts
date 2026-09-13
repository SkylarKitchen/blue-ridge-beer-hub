import { defineArrayMember, defineField, defineType } from "sanity";

import { sectionFields, sectionPreview } from "./common";

// Cards reuse the shape of the legacy `offering` object in Site Settings.
export const offeringsBlock = defineType({
  name: "offeringsBlock",
  title: "What we offer",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "What we pour & stock",
    }),
    defineField({
      name: "cards",
      title: "Cards",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "offering",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 3,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "title", subtitle: "description" } },
        }),
      ],
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("What we offer"),
});
