import { defineField, defineType } from "sanity";

import { sectionFields, sectionPreview } from "./common";

export const onTapBlock = defineType({
  name: "onTapBlock",
  title: "On tap",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "On tap right now",
    }),
    defineField({
      name: "blurb",
      title: "Paragraph",
      type: "text",
      rows: 3,
      description: "The tap list itself lives on Untappd — this is the intro.",
    }),
    defineField({
      name: "secondary",
      title: "Second line",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "cta",
      title: "Tap list button label",
      type: "string",
      initialValue: "Open the live tap list",
    }),
    defineField({
      name: "tapCount",
      title: "Number of taps",
      type: "number",
      initialValue: 16,
      validation: (rule) => rule.min(1).max(99),
    }),
    defineField({
      name: "tapCountLabel",
      title: "Label under the big number",
      type: "string",
      initialValue: "taps pouring right now*",
    }),
    defineField({
      name: "tapCountFootnote",
      title: "Footnote",
      type: "string",
      initialValue: "*give or take. The live list knows best.",
    }),
    defineField({
      name: "perks",
      title: "Short list on the navy card",
      type: "array",
      of: [{ type: "string" }],
      validation: (rule) => rule.max(5),
    }),
    ...sectionFields(),
  ],
  preview: sectionPreview("On tap"),
});
