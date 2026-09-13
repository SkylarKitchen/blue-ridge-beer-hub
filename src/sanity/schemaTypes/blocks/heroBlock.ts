import { defineField, defineType } from "sanity";

import { sectionFields, sectionPreview } from "./common";

export const heroBlock = defineType({
  name: "heroBlock",
  title: "Top of page",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Big headline",
      type: "text",
      rows: 3,
      description:
        "The large text at the top. Each new line becomes its own row.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subheading",
      title: "Supporting line",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "primaryCta",
      title: "Main button label",
      type: "string",
      initialValue: "See what’s on tap",
      description: "The filled button. It opens Untappd.",
    }),
    defineField({
      name: "secondaryCta",
      title: "Second button label",
      type: "string",
      initialValue: "Upcoming events",
      description:
        "The outlined button. It jumps to the events section, and hides if there isn’t one.",
    }),
    defineField({
      name: "image",
      title: "Wide photo",
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
  preview: sectionPreview("Top of page"),
});
