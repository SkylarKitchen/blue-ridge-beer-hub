import { defineField, defineType } from "sanity";

/**
 * A standing weekly fixture — e.g. bluegrass every Thursday. Rendered as
 * "Every Thursday" alongside dated events. Uncheck "Currently running"
 * to hide it without deleting it.
 */
export const weeklyEvent = defineType({
  name: "weeklyEvent",
  title: "Weekly Event",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Event name",
      type: "string",
      description: "e.g. “Bluegrass with The Blue Mountaineers”",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "dayOfWeek",
      title: "Day of the week",
      type: "string",
      options: {
        list: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "time",
      title: "Time",
      type: "string",
      description: "Written how you'd say it, e.g. “5–7 PM”",
      validation: (rule) => rule.required(),
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
    }),
    defineField({
      name: "active",
      title: "Currently running",
      type: "boolean",
      initialValue: true,
      description: "Uncheck to hide this from the site without deleting it.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      day: "dayOfWeek",
      time: "time",
      active: "active",
    },
    prepare({ title, day, time, active }) {
      return {
        title: title ?? "Untitled",
        subtitle: `Every ${day ?? "?"} · ${time ?? ""}${active === false ? " · (hidden)" : ""}`,
      };
    },
  },
});
