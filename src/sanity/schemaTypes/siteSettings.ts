import { defineField, defineType } from "sanity";

/**
 * Singleton holding everything that appears once on the site: identity,
 * contact info, hours, hero copy, about copy, and the offerings blocks.
 * Field descriptions are written for the shop owners, not developers.
 */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  groups: [
    { name: "identity", title: "Name & Contact" },
    { name: "hours", title: "Hours" },
    { name: "hero", title: "Top of Page" },
    { name: "tap", title: "On Tap" },
    { name: "about", title: "About" },
    { name: "offerings", title: "What We Offer" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Business name",
      type: "string",
      group: "identity",
      description: "Shown in the header and footer.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      group: "identity",
      description:
        "One short line under the name, e.g. “Waynesville's community taproom & bottle shop.”",
    }),
    defineField({
      name: "addressLine1",
      title: "Street address",
      type: "string",
      group: "identity",
      description: "e.g. 21 East St",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "addressLine2",
      title: "City, state, zip",
      type: "string",
      group: "identity",
      description: "e.g. Waynesville, NC 28786",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "phone",
      title: "Phone number",
      type: "string",
      group: "identity",
      description: "Shown in the footer. Format however you like it displayed.",
    }),
    defineField({
      name: "email",
      title: "Email address",
      type: "string",
      group: "identity",
    }),
    defineField({
      name: "untappdUrl",
      title: "Untappd menu link",
      type: "url",
      group: "identity",
      description:
        "The “On Tap” section sends visitors here. Use your Untappd venue page or menu link.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram link",
      type: "url",
      group: "identity",
    }),
    defineField({
      name: "facebookUrl",
      title: "Facebook link",
      type: "url",
      group: "identity",
    }),
    defineField({
      name: "announcement",
      title: "Announcement banner",
      type: "string",
      group: "identity",
      description:
        "Optional. Shows as a banner across the top of the site — e.g. “Closed today for a private event.” Leave empty to hide the banner.",
    }),
    defineField({
      name: "pipelineEmails",
      title: "Who gets the “new events found” email",
      type: "array",
      group: "identity",
      of: [{ type: "string" }],
      description:
        "When a new flyer is posted to Facebook, these addresses get an email with a one-tap publish button. Add or remove addresses any time.",
      validation: (rule) =>
        rule
          .unique()
          .custom((emails?: string[]) =>
            (emails ?? []).every((e) => /.+@.+\..+/.test(e))
              ? true
              : "One of these doesn't look like an email address.",
          ),
    }),
    defineField({
      name: "hours",
      title: "Weekly hours",
      type: "array",
      group: "hours",
      description:
        "One row per day, in the order you want them shown. Check “Closed” for days you're not open.",
      of: [
        {
          type: "object",
          name: "dayHours",
          fields: [
            defineField({
              name: "day",
              title: "Day",
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
              name: "opens",
              title: "Opens",
              type: "string",
              description: "e.g. 12:00 PM",
            }),
            defineField({
              name: "closes",
              title: "Closes",
              type: "string",
              description: "e.g. 9:00 PM",
            }),
            defineField({
              name: "closed",
              title: "Closed this day",
              type: "boolean",
              initialValue: false,
            }),
          ],
          preview: {
            select: {
              day: "day",
              opens: "opens",
              closes: "closes",
              closed: "closed",
            },
            prepare({ day, opens, closes, closed }) {
              return {
                title: day ?? "Day",
                subtitle: closed
                  ? "Closed"
                  : [opens, closes].filter(Boolean).join(" – "),
              };
            },
          },
        },
      ],
      validation: (rule) => rule.max(7),
    }),
    defineField({
      name: "heroHeading",
      title: "Big headline",
      type: "string",
      group: "hero",
      description: "The large text at the top of the page.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroSubheading",
      title: "Supporting line",
      type: "text",
      rows: 2,
      group: "hero",
      description: "One or two sentences under the big headline.",
    }),
    defineField({
      name: "heroImage",
      title: "Top-of-page photo",
      type: "image",
      group: "hero",
      options: { hotspot: true },
      description: "Optional. A wide photo behind or beside the headline.",
      fields: [
        defineField({
          name: "alt",
          title: "Describe this photo",
          type: "string",
          description:
            "For screen readers and search engines, e.g. “The taproom bar with 16 taps.”",
        }),
      ],
    }),
    defineField({
      name: "tapCount",
      title: "Number of taps",
      type: "number",
      group: "tap",
      initialValue: 16,
      description:
        "The big number in the “On tap” section. Change it if you add or retire lines.",
      validation: (rule) => rule.min(1).max(99),
    }),
    defineField({
      name: "onTapBlurb",
      title: "On Tap section text",
      type: "text",
      rows: 3,
      group: "tap",
      description:
        "The paragraph in the “On tap right now” section. The tap list itself lives on Untappd — this is just the intro.",
    }),
    defineField({
      name: "aboutHeading",
      title: "About section heading",
      type: "string",
      group: "about",
      initialValue: "About the Hub",
    }),
    defineField({
      name: "aboutBody",
      title: "About text",
      type: "array",
      group: "about",
      description: "The story of the shop. A few short paragraphs works best.",
      of: [
        {
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
        },
      ],
    }),
    defineField({
      name: "offerings",
      title: "What we offer",
      type: "array",
      group: "offerings",
      description:
        "The three-ish cards describing what you pour and stock — taps, coolers & carryout, homebrew supplies.",
      of: [
        {
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
          preview: {
            select: { title: "title", subtitle: "description" },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});
