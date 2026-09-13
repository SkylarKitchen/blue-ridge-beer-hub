import { defineField, defineType } from "sanity";

/**
 * Singleton holding everything that appears once on the site: identity,
 * contact info, hours, hero copy, about copy, and the offerings blocks.
 * Field descriptions are written for the shop owners, not developers.
 *
 * Two things shape the form's layout, and both are for the owners' benefit:
 *
 * - `groups` are the tabs. They run in the order the sections appear on the
 *   page, so scrolling the site and scanning the tabs feel like the same
 *   trip. "Name & Contact" is marked `default` — without one, Studio opens on
 *   its synthetic "All fields" tab, which is every field in one column.
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
  // Tab order mirrors the page, top to bottom.
  groups: [
    { name: "identity", title: "Name & Contact", default: true },
    { name: "hours", title: "Hours" },
    { name: "hero", title: "Top of Page" },
    { name: "events", title: "Events" },
    { name: "tap", title: "On Tap" },
    { name: "offerings", title: "What We Offer" },
    { name: "gallery", title: "Photos" },
    { name: "about", title: "About" },
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
      name: "heroButtons",
      title: "The two buttons",
      group: "hero",
    },
    {
      name: "eventsHeadings",
      title: "Headings",
      group: "events",
      description: "The two headings in the events section.",
    },
    {
      name: "tapNumber",
      title: "The big number",
      group: "tap",
      description:
        "The big number in the “On tap” section and the two small lines under it. Change the number if you add or retire lines.",
    },
    {
      name: "tapWriting",
      title: "The writing",
      group: "tap",
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
    // ── Top of Page ───────────────────────────────────────────────────
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
      name: "heroPrimaryCta",
      title: "Main button label",
      type: "string",
      group: "hero",
      fieldset: "heroButtons",
      initialValue: "See what’s on tap",
      description: "The filled button under the headline. It opens Untappd.",
    }),
    defineField({
      name: "heroSecondaryCta",
      title: "Second button label",
      type: "string",
      group: "hero",
      fieldset: "heroButtons",
      initialValue: "Upcoming events",
      description: "The outlined button. It jumps down to the events list.",
    }),
    defineField({
      name: "heroImage",
      title: "Top-of-page photo",
      type: "image",
      group: "hero",
      options: { hotspot: true },
      description:
        "Optional. Replaces the wide photo band at the top of the page. Leave empty to keep the tap-handles shot.",
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
    // ── Events ────────────────────────────────────────────────────────
    defineField({
      name: "eventsHeading",
      title: "Events section heading",
      type: "string",
      group: "events",
      fieldset: "eventsHeadings",
      initialValue: "Coming up at the Hub",
      description: "Sits above the one-off events that have a date.",
    }),
    defineField({
      name: "weeklyHeading",
      title: "Weekly events heading",
      type: "string",
      group: "events",
      fieldset: "eventsHeadings",
      initialValue: "Every week",
      description:
        "Sits above the things that happen on the same day every week.",
    }),
    // ── On Tap ────────────────────────────────────────────────────────
    defineField({
      name: "tapCount",
      title: "Number of taps",
      type: "number",
      group: "tap",
      fieldset: "tapNumber",
      initialValue: 16,
      validation: (rule) => rule.min(1).max(99),
    }),
    defineField({
      name: "tapCountLabel",
      title: "Label under the big number",
      type: "string",
      group: "tap",
      fieldset: "tapNumber",
      initialValue: "taps pouring right now*",
    }),
    defineField({
      name: "tapCountFootnote",
      title: "Footnote under that label",
      type: "string",
      group: "tap",
      fieldset: "tapNumber",
      initialValue: "*give or take. The live list knows best.",
    }),
    defineField({
      name: "onTapHeading",
      title: "On Tap section heading",
      type: "string",
      group: "tap",
      fieldset: "tapWriting",
      initialValue: "On tap right now",
    }),
    defineField({
      name: "onTapBlurb",
      title: "On Tap section text",
      type: "text",
      rows: 3,
      group: "tap",
      fieldset: "tapWriting",
      description:
        "The paragraph in the “On tap right now” section. The tap list itself lives on Untappd — this is just the intro.",
    }),
    defineField({
      name: "onTapSecondary",
      title: "Second line",
      type: "text",
      rows: 2,
      group: "tap",
      fieldset: "tapWriting",
      initialValue:
        "Not a beer person? Wine, mead, and cider pour here too, and the coolers are stocked for carryout.",
      description: "The smaller line under the main On Tap paragraph.",
    }),
    defineField({
      name: "onTapCta",
      title: "Tap list button label",
      type: "string",
      group: "tap",
      fieldset: "tapWriting",
      initialValue: "Open the live tap list",
    }),
    defineField({
      name: "tapPerks",
      title: "Short list on the navy card",
      type: "array",
      group: "tap",
      of: [{ type: "string" }],
      description:
        "One line each — growlers, six-packs, pour sizes. Leave empty to hide the list.",
      validation: (rule) => rule.max(5),
    }),
    // ── What We Offer ─────────────────────────────────────────────────
    defineField({
      name: "offeringsHeading",
      title: "Offerings section heading",
      type: "string",
      group: "offerings",
      initialValue: "What we pour & stock",
    }),
    defineField({
      name: "offerings",
      title: "What we offer",
      type: "array",
      group: "offerings",
      description:
        "The three-ish cards describing what you pour and stock — taps, coolers & carryout, kegs & tap rentals.",
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
    // ── Photos ────────────────────────────────────────────────────────
    defineField({
      name: "galleryHeading",
      title: "Photo section heading",
      type: "string",
      group: "gallery",
      initialValue: "Inside the Hub",
      description:
        "The photos themselves live under Gallery Photos in the sidebar.",
    }),
    // ── About ─────────────────────────────────────────────────────────
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
      name: "aboutImage",
      title: "About photo",
      type: "image",
      group: "about",
      options: { hotspot: true },
      description:
        "Optional. Replaces the photo beside the About text. Leave empty to keep the owners-under-the-flag shot.",
      fields: [
        defineField({
          name: "alt",
          title: "Describe this photo",
          type: "string",
          description:
            "For screen readers and search engines, e.g. “Jason and Charlotte outside the Hub.”",
        }),
      ],
    }),
    defineField({
      name: "credentials",
      title: "Trust badges",
      type: "array",
      group: "about",
      of: [{ type: "string" }],
      description:
        "Short phrases shown as small badges under the About text — e.g. “Veteran-owned”, “Run by a retired schoolteacher”. Leave empty to hide.",
      validation: (rule) => rule.max(4),
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
