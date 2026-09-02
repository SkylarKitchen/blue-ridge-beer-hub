import { defineField, defineType } from "sanity";

/**
 * A one-off event on a specific date — a show, a party, a bingo night.
 * Standing weekly fixtures (e.g. Thursday bluegrass) use `weeklyEvent` instead.
 */
export const event = defineType({
  name: "event",
  title: "Event",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Event name",
      type: "string",
      description: "e.g. “Music Bingo” or “Chris Campbell (live)”",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "start",
      title: "Date & start time",
      type: "datetime",
      options: { timeStep: 15 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endTime",
      title: "End time",
      type: "datetime",
      options: { timeStep: 15 },
      description: "Optional. Leave empty for open-ended.",
      validation: (rule) =>
        rule
          .min(rule.valueOfField("start"))
          .error("End time must be after the start time."),
    }),
    defineField({
      name: "category",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Live music", value: "music" },
          { title: "Art", value: "art" },
          { title: "Games & bingo", value: "games" },
          { title: "Party / special", value: "party" },
          { title: "Community", value: "community" },
        ],
        layout: "radio",
      },
      initialValue: "music",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Details",
      type: "text",
      rows: 3,
      description: "A sentence or two. Optional.",
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "url",
      description:
        "Optional — tickets, the artist's page, or a Facebook event.",
    }),
  ],
  orderings: [
    {
      title: "Date (soonest first)",
      name: "startAsc",
      by: [{ field: "start", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", start: "start", category: "category" },
    prepare({ title, start, category }) {
      const date = start
        ? new Date(start).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })
        : "No date";
      return {
        title: title ?? "Untitled event",
        subtitle: `${date} · ${category ?? ""}`,
      };
    },
  },
});
