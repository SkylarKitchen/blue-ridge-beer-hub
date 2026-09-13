import { defineArrayMember, defineField, defineType } from "sanity";

import { sectionFields, sectionPreview } from "./common";

/**
 * The photo grid. The photos are a list on the section itself — drag to
 * reorder, plus to add — so everything about the grid is in one place.
 */
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
    }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      description:
        "Top to bottom here is left to right, row by row, on the site. Drag to reorder. The section stays off the site until it has at least one photo.",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Describe this photo",
              type: "string",
              description:
                "Read aloud to blind visitors and shown to search engines, e.g. “Friends around the bar during trivia night.”",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
              description: "Optional — shows under the photo.",
            }),
          ],
          preview: {
            select: { media: "asset", title: "alt", subtitle: "caption" },
          },
        }),
      ],
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("Photos"),
});
