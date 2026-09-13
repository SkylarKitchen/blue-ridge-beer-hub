import { defineArrayMember, defineField, defineType } from "sanity";

import { sectionFields } from "./common";

/**
 * A reusable “words + photos” section. The first one is To Go (what’s new
 * in the coolers); the owners can add more — kegs for a party, holiday
 * packs — without a developer.
 */
export const featureBlock = defineType({
  name: "featureBlock",
  title: "Feature (words + photos)",
  type: "object",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Small label",
      type: "string",
      description: "A word or two above the heading, e.g. “To go”. Optional.",
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Words",
      type: "text",
      rows: 6,
      description: "A paragraph or two. Leave a blank line between paragraphs.",
    }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      description:
        "One to three. The layout adapts: one big photo, a pair, or a trio.",
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
                "Read aloud to blind visitors, e.g. “Cans of local IPA stacked in the cooler.”",
              validation: (rule) => rule.required(),
            }),
          ],
        }),
      ],
      validation: (rule) => [
        rule.min(1).error("Add at least one photo."),
        rule.max(3).error("Three photos at most."),
      ],
    }),
    defineField({
      name: "photoSide",
      title: "Photos on the",
      type: "string",
      options: {
        list: [
          { title: "Right", value: "right" },
          { title: "Left", value: "left" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "right",
    }),
    defineField({
      name: "listHeading",
      title: "List heading",
      type: "string",
      initialValue: "Just in",
    }),
    defineField({
      name: "listItems",
      title: "List",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Short lines, one per item — “Burial 4-packs”, “Cases of Highland Gaelic”. Leave empty to hide the list.",
      validation: (rule) => rule.max(8),
    }),
    defineField({
      name: "listAsOf",
      title: "List updated on",
      type: "date",
      description:
        "Shows under the list as “Updated Sep 12”. Set it when you refresh the list; leave empty to show no date.",
    }),
    defineField({
      name: "ctaLabel",
      title: "Button label",
      type: "string",
      description: "Optional. Needs a link below to show.",
    }),
    defineField({
      name: "ctaUrl",
      title: "Button link",
      type: "url",
      description:
        "A web address, or mailto:… / tel:… to open email or the phone.",
      validation: (rule) => rule.uri({ scheme: ["https", "mailto", "tel"] }),
    }),
    ...sectionFields(),
  ],
  preview: {
    select: { heading: "heading", hidden: "hiddenOnSite", media: "photos.0" },
    prepare({ heading, hidden, media }) {
      return {
        title: heading || "Feature",
        subtitle: ["Feature", hidden ? "Hidden" : null]
          .filter(Boolean)
          .join(" · "),
        media,
      };
    },
  },
});
