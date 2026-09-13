/**
 * Default text for the section headings, button labels and small print that
 * used to be hardcoded in the components. They live on the Home Page's
 * section blocks (and, for the footer, on Site Settings) so the owners can
 * retype them on the page, but a block or document saved before a field
 * existed has none of it — and `initialValue` only fires for brand-new
 * documents. So components render these until someone types over them, and
 * `lib/fallback.ts` reuses them for the offline copy.
 */
export const DEFAULT_COPY = {
  heroHeading: "Your friendly\nneighborhood\nbeer hub",
  heroPrimaryCta: "See what’s on tap",
  heroSecondaryCta: "Upcoming events",

  eventsHeading: "Coming up at the Hub",
  weeklyHeading: "Every week",

  onTapHeading: "On tap right now",
  onTapBlurb:
    "Sixteen taps that change almost daily: stouts, sours, IPAs, and the occasional white whale. The full list lives on Untappd.",
  onTapSecondary:
    "Not a beer person? Wine, mead, and cider pour here too, and the coolers are stocked for carryout.",
  onTapCta: "Open the live tap list",
  tapCountLabel: "taps pouring right now*",
  tapCountFootnote: "*give or take. The live list knows best.",
  tapPerks: [
    "Growlers filled to go",
    "Pour sizes from a 4\u00a0oz taster on up",
  ],

  offeringsHeading: "What we pour & stock",
  galleryHeading: "Inside the Hub",
  aboutHeading: "About the Hub",

  footerHeading: "Come say hi",
  footerHoursLabel: "Hours",
  footerFindUsLabel: "Find us",
  footerFollowLabel: "Follow along",
  footerDirectionsCta: "Get directions",
  footerVisitLine: "Making a trip of it?",
  footerLegal:
    "Made in Waynesville, NC · 21+ to drink · please enjoy responsibly",
} as const;

/**
 * Copy for the Feature block and the On Tap link into it, kept out of
 * DEFAULT_COPY so that object stays one flat map of field name → default.
 */
export const FEATURE_COPY = {
  onTapSecondaryLinkLabel: "See what’s new to go",
  toGo: {
    eyebrow: "To go",
    heading: "New in the coolers",
    body: "Cans, bottles, and cases to carry out, restocked every week with whatever’s new from Asheville and beyond. Build your own six-pack from anything in the coolers, or grab a case for the cabin.\n\nHunting something specific? Ask at the bar. If we can get it, we will.",
    listHeading: "Just in",
  },
} as const;
