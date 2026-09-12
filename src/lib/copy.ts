/**
 * Default text for the section headings, button labels and small print that
 * used to be hardcoded in the components. They live in Site Settings now so
 * the owners can retype them on the page, but a Site Settings document saved
 * before these fields existed has none of them — and `initialValue` only
 * fires for brand-new documents. So components render these until someone
 * types over them, and `lib/fallback.ts` reuses them for the offline copy.
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
    "Build-your-own six-packs from the coolers",
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
