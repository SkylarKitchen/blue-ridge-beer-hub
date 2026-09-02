import { defineField, defineType } from "sanity";

/**
 * One photo in the gallery. Owners add a document per photo; `order`
 * controls position (lower numbers first).
 */
export const galleryImage = defineType({
  name: "galleryImage",
  title: "Gallery Photo",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Describe this photo",
      type: "string",
      description:
        "A short description for screen readers and search engines, e.g. “Friends around the bar during trivia night.”",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
      description: "Optional — shows under the photo.",
    }),
    defineField({
      name: "order",
      title: "Position",
      type: "number",
      description:
        "Lower numbers show first. Leave gaps (10, 20, 30…) so it's easy to reorder later.",
      initialValue: 50,
    }),
  ],
  orderings: [
    {
      title: "Position",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { media: "image", title: "alt", subtitle: "caption" },
  },
});
