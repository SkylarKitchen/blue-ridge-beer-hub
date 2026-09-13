import { defineField, defineType } from "sanity";

/**
 * Singleton holding the site's fixed chrome: identity, contact info, hours,
 * links, the announcement banner and the footer copy. The page's sections
 * live on the Home Page document (schemaTypes/homePage.ts). Field
 * descriptions are written for the shop owners, not developers.
 *
 * Two things shape the form's layout, and both are for the owners' benefit:
 *
 * - `groups` are the tabs. They run in the order the content appears on the
 *   page, header to footer. "Name & Contact" is marked `default` — without
 *   one, Studio opens on its synthetic "All fields" tab, which is every
 *   field in one column.
 * - `fieldsets` are the titled blocks inside a tab. Besides naming what a
 *   run of fields is for, a fieldset's members sit on a 32px grid instead of
 *   the form root's 52px stack, so grouping closes the gaps as well.
 *
 * Top-level fieldsets deliberately do NOT set `columns`. The renderer emits a
 * fixed `repeat(n, minmax(0,1fr))` with no media or container query, and the
 * width it divides is the document pane's, which we do not control: a fresh
 * Presentation pane is ~378px, so two columns give ~153px cells where labels
 * wrap unevenly and values like "Waynesville, NC 28786" clip. Measured on a
 * widened pane it looks fine, which is the trap — don't re-add it on the
 * strength of one comfortable layout.
 *
 * The exception is the nested `dayHours` object: every field there is short,
 * symmetric and description-light, so two-up survives the narrow pane.
 */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  // Tab order mirrors the page, header to footer.
  groups: [
    { name: "identity", title: "Name & Contact", default: true },
    { name: "hours", title: "Hours" },
    { name: "footer", title: "Footer" },
  ],
  fieldsets: [
    {
      name: "basics",
      title: "The basics",
      group: "identity",
    },
    {
      name: "address",
      title: "Where you are",
      group: "identity",
    },
    {
      name: "contact",
      title: "How people reach you",
      group: "identity",
      description:
        "Both of these show in the footer. Type the phone number however you want it to read.",
    },
    {
      name: "links",
      title: "Links",
      group: "identity",
    },
    {
      name: "alerts",
      title: "Email alerts",
      group: "identity",
      description: "Set this once and forget it.",
      options: { collapsible: true, collapsed: true },
    },
    {
      name: "footerColumns",
      title: "Column labels",
      group: "footer",
      description: "The three small headings above each footer column.",
    },
    {
      name: "footerExtras",
      title: "The rest of the footer",
      group: "footer",
      description:
        "The directions button, and the line that introduces the “Visit Haywood County” link.",
    },
  ],
  fields: [
    // ── Name & Contact ────────────────────────────────────────────────
    defineField({
      name: "announcement",
      title: "Announcement banner",
      type: "string",
      group: "identity",
      description:
        "Optional. Shows as a banner across the top of the site — e.g. “Closed today for a private event.” Leave empty to hide the banner.",
    }),
    defineField({
      name: "name",
      title: "Business name",
      type: "string",
      group: "identity",
      fieldset: "basics",
      description: "Shown in the header and footer.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      group: "identity",
      fieldset: "basics",
      description:
        "One short line under the name, e.g. “Waynesville's community taproom & bottle shop.”",
    }),
    defineField({
      name: "addressLine1",
      title: "Street address",
      type: "string",
      group: "identity",
      fieldset: "address",
      description: "e.g. 21 East St",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "addressLine2",
      title: "City, state, zip",
      type: "string",
      group: "identity",
      fieldset: "address",
      description: "e.g. Waynesville, NC 28786",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "phone",
      title: "Phone number",
      type: "string",
      group: "identity",
      fieldset: "contact",
    }),
    defineField({
      name: "email",
      title: "Email address",
      type: "string",
      group: "identity",
      fieldset: "contact",
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: "untappdUrl",
      title: "Untappd menu link",
      type: "url",
      group: "identity",
      fieldset: "links",
      description:
        "The “On Tap” section sends visitors here. Use your Untappd venue page or menu link.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram link",
      type: "url",
      group: "identity",
      fieldset: "links",
    }),
    defineField({
      name: "facebookUrl",
      title: "Facebook link",
      type: "url",
      group: "identity",
      fieldset: "links",
    }),
    defineField({
      name: "pipelineEmails",
      title: "Who gets the “new events found” email",
      type: "array",
      group: "identity",
      fieldset: "alerts",
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
    // ── Hours ─────────────────────────────────────────────────────────
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
          // Day/Opens/Closes/Closed are all short — pack them two-up so a
          // day fits on screen without scrolling.
          options: { columns: 2 },
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
              name: "closed",
              // Short on purpose: the toggle sits beside the Day select, and
              // "Closed this day" wraps to three lines in a narrow pane.
              title: "Closed",
              type: "boolean",
              initialValue: false,
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
    // ── Footer ────────────────────────────────────────────────────────
    defineField({
      name: "footerHeading",
      title: "Footer heading",
      type: "string",
      group: "footer",
      initialValue: "Come say hi",
    }),
    defineField({
      name: "footerHoursLabel",
      title: "Hours column label",
      type: "string",
      group: "footer",
      fieldset: "footerColumns",
      initialValue: "Hours",
    }),
    defineField({
      name: "footerFindUsLabel",
      title: "Address column label",
      type: "string",
      group: "footer",
      fieldset: "footerColumns",
      initialValue: "Find us",
    }),
    defineField({
      name: "footerFollowLabel",
      title: "Social links column label",
      type: "string",
      group: "footer",
      fieldset: "footerColumns",
      initialValue: "Follow along",
    }),
    defineField({
      name: "footerDirectionsCta",
      title: "Directions button label",
      type: "string",
      group: "footer",
      fieldset: "footerExtras",
      initialValue: "Get directions",
    }),
    defineField({
      name: "footerVisitLine",
      title: "Line above the tourism link",
      type: "string",
      group: "footer",
      fieldset: "footerExtras",
      initialValue: "Making a trip of it?",
    }),
    defineField({
      name: "footerLegal",
      title: "Small print",
      type: "string",
      group: "footer",
      initialValue:
        "Made in Waynesville, NC · 21+ to drink · please enjoy responsibly",
      description: "The copyright year and business name are added for you.",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});
