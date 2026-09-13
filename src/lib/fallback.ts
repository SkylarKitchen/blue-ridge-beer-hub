import { DEFAULT_COPY } from "./copy.ts";
import { imageRef, toGoSeedSection, type Section } from "./sections.ts";
import type { HubEvent, SiteSettings, WeeklyEvent } from "./types";

/**
 * Build-time fallback content mirroring seed/seed.ndjson. Used when Sanity is
 * unreachable or the dataset is empty, so the site always renders real content
 * — including at the party if anything upstream hiccups. Once Sanity is the
 * source of truth, edits happen there; keep this file as the emergency copy.
 */
export const FALLBACK_SETTINGS: SiteSettings = {
  footerHeading: DEFAULT_COPY.footerHeading,
  footerHoursLabel: DEFAULT_COPY.footerHoursLabel,
  footerFindUsLabel: DEFAULT_COPY.footerFindUsLabel,
  footerFollowLabel: DEFAULT_COPY.footerFollowLabel,
  footerDirectionsCta: DEFAULT_COPY.footerDirectionsCta,
  footerVisitLine: DEFAULT_COPY.footerVisitLine,
  footerLegal: DEFAULT_COPY.footerLegal,
  name: "Blue Ridge Beer Hub",
  tagline: "Waynesville’s community taproom & bottle shop",
  addressLine1: "21 East St",
  addressLine2: "Waynesville, NC 28786",
  phone: "(828) 246-9320",
  email: "blueridgebeerhub@gmail.com",
  untappdUrl: "https://untappd.com/v/blue-ridge-beer-hub/6732717",
  instagramUrl: "https://www.instagram.com/brbeerhub/",
  facebookUrl: "https://www.facebook.com/brbeerhub",
  hours: [
    { day: "Monday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Tuesday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Wednesday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Thursday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Friday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Saturday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Sunday", opens: "1:00 PM", closes: "7:00 PM", closed: false },
  ],
};

/**
 * The homepage as the migration wrote it on 2026-09-13: the page that ran
 * from the flat Site Settings fields, block by block, plus the To Go block
 * seeded hidden after On Tap. Keys are the migration's so an anchor or a
 * Studio path written against the live document matches here too.
 */
export const FALLBACK_SECTIONS: Section[] = [
  {
    _key: "legacy-hero",
    _type: "heroBlock",
    heading: DEFAULT_COPY.heroHeading,
    subheading:
      "Sixteen rotating taps and coolers full of carryout on East Street in downtown Waynesville. Most nights there’s something going on, live music more often than not.",
    primaryCta: DEFAULT_COPY.heroPrimaryCta,
    secondaryCta: DEFAULT_COPY.heroSecondaryCta,
    // The gallery-shoot assets the Hero and About blocks own since the
    // migration (they were pinned by asset id before the builder existed).
    image: imageRef(
      "image-600687a3a1747959048b8eb3b14f917ad2e3073b-2560x1707-jpg",
      "Numbered tap handles branded with the Blue Ridge Beer Hub hop logo",
    ),
  },
  { _key: "legacy-divider-1", _type: "dividerBlock" },
  {
    _key: "legacy-events",
    _type: "eventsBlock",
    heading: DEFAULT_COPY.eventsHeading,
    weeklyHeading: DEFAULT_COPY.weeklyHeading,
  },
  {
    _key: "legacy-tap",
    _type: "onTapBlock",
    heading: DEFAULT_COPY.onTapHeading,
    blurb: DEFAULT_COPY.onTapBlurb,
    secondary: DEFAULT_COPY.onTapSecondary,
    cta: DEFAULT_COPY.onTapCta,
    tapCount: 16,
    tapCountLabel: DEFAULT_COPY.tapCountLabel,
    tapCountFootnote: DEFAULT_COPY.tapCountFootnote,
    perks: [...DEFAULT_COPY.tapPerks],
  },
  toGoSeedSection(),
  {
    _key: "legacy-offerings",
    _type: "offeringsBlock",
    heading: DEFAULT_COPY.offeringsHeading,
    cards: [
      {
        _type: "offering",
        _key: "card-0",
        title: "On tap",
        description:
          "Sixteen rotating lines of beer, cider, and mead, heavy on Asheville-area breweries. Pours run from a 4 oz taster to a full pint, and we fill growlers to go.",
      },
      {
        _type: "offering",
        _key: "card-1",
        title: "Coolers & carryout",
        description:
          "Bottles and cans to go, build-your-own six-packs, and shelves of wine, mead, cider, and THC drinks. Half the fun is browsing the coolers.",
      },
      {
        _type: "offering",
        _key: "card-2",
        title: "Kegs & tap rentals",
        description:
          "Throwing a party? We sell kegs and rent out the taps and CO2 to pour them right. Call or email ahead and we’ll have everything cold and ready to go.",
      },
    ],
  },
  {
    _key: "legacy-gallery",
    _type: "galleryBlock",
    heading: DEFAULT_COPY.galleryHeading,
    // The gallery as it stood when the photos moved onto the section
    // (2026-09-13), in the owners' Position order.
    photos: [
      {
        _key: "l4U0qMpnuVLxOUx8hDbRdy",
        ...imageRef(
          "image-bb501650403decb707ac1427de3c3d2ab704906f-1080x1080-png",
          "Friends filling the picnic tables on the patio during a cookout, Beer Hub tees all around.",
        ),
        caption: "Cookout on the back patio",
      },
      {
        _key: "sajAnQTE1Pa02x95TyRewF",
        ...imageRef(
          "image-8b2cd76ae0eed25559aaf5fab35db626b7046d62-1080x1080-png",
          "Working the grill in a Blue Ridge Beer Hub tee, numbered mug club stein in hand.",
        ),
        caption: "Grill duty, mug club stein in hand",
      },
      {
        _key: "AWGxcl2dD5LlZ1gmDOrRbk",
        ...imageRef(
          "image-d1574db5fa0cc5c177a65cf77e8b4da776d35f68-1080x1080-png",
          "A mug club stein of lager held up on the patio, engraved with its member’s name and number.",
        ),
        caption: "Mug club steins, numbered and named",
      },
      {
        _key: "taps-closeup",
        ...imageRef(
          "image-2d200aed48dc13897a2bafe2d0798e0932061b07-2560x1707-jpg",
          "Close-up of the chrome faucets running down the tap wall.",
        ),
        caption: "The faucets, up close",
      },
      {
        _key: "l4U0qMpnuVLxOUx8hDbSh0",
        ...imageRef(
          "image-c34b784ae33cbdc35c96a628a75786e4b60b5540-1080x1080-png",
          "A condensation-beaded stein of lager tilted mid-pour at the cookout.",
        ),
        caption: "Mid-pour at the cookout",
      },
      {
        _key: "tap-wall",
        ...imageRef(
          "image-6ba883c9fb431cda4cf2103db37c5cf6c5ed06f9-2560x1707-jpg",
          "A row of numbered Blue Ridge Beer Hub tap handles down the stainless bar back.",
        ),
        caption: "Numbered tap handles along the bar",
      },
      {
        _key: "mug-club-steins",
        ...imageRef(
          "image-a09b4a6f75fb6f02cad7c48fda59a4847b6db7fc-2560x1707-jpg",
          "Mug club steins racked behind the bar, each etched with its member’s name and number.",
        ),
        caption: "Mug club steins, etched and racked",
      },
      {
        _key: "merch-wall",
        ...imageRef(
          "image-7e72bf6a74520deeba163b9523cc5f1814e341a5-2560x2560-jpg",
          "Hoodies, tees, and Beer Hub glassware on the reclaimed-wood merch wall.",
        ),
        caption: "Hoodies and tees on the merch wall",
      },
      {
        _key: "bar-stools",
        ...imageRef(
          "image-54c73c104a932d177981f0a0f0412ab9f0039148-2560x1707-jpg",
          "Stools along the concrete bar top, coolers stocked for carryout behind.",
        ),
        caption: "Bar stools and the carryout coolers",
      },
      {
        _key: "pint-glasses",
        ...imageRef(
          "image-dea620af39051dceeebd2837239382cd3e620a36-2560x2560-jpg",
          "Two etched Blue Ridge Beer Hub pint glasses on a wooden shelf.",
        ),
        caption: "Etched pint glasses on the shelf",
      },
    ],
  },
  {
    _key: "legacy-about",
    _type: "aboutBlock",
    heading: DEFAULT_COPY.aboutHeading,
    body: [
      {
        _type: "block",
        _key: "about1",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "about1a",
            marks: [],
            text: "The Beer Hub is Waynesville’s community taproom and bottle shop, right downtown. Inside you’ll find sixteen taps of rotating craft beer, coolers stocked for carryout, and kegs to take the party home.",
          },
        ],
      },
      {
        _type: "block",
        _key: "about2",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "about2a",
            marks: [],
            text: "The Hub has been serving Haywood County since 2017, and Jason & Charlotte Johnson took it over in September 2025. It’s where neighbors catch bluegrass on a Thursday and visitors find a new favorite pour, and most people leave knowing somebody they didn’t walk in with.",
          },
        ],
      },
      {
        _type: "block",
        _key: "about3",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "about3a",
            marks: [],
            text: "Swing by for a taster flight, fill a growler, or just come hang out. There’s a stool with your name on it.",
          },
        ],
      },
    ],
    credentials: ["Veteran-owned", "Run by a retired schoolteacher"],
    image: imageRef(
      "image-fc66f7f4d741bb78af4b98b31f4514f36047adc9-2048x2560-jpg",
      "Jason and Charlotte outside the Hub under the orange OPEN flag",
    ),
  },
  { _key: "legacy-divider-2", _type: "dividerBlock" },
];

export const FALLBACK_EVENTS: HubEvent[] = [
  {
    _id: "fallback-drink-draw",
    title: "Drink & Draw with Blue Ridge Art Way",
    start: "2026-09-02T18:00:00-04:00",
    endTime: "2026-09-02T19:30:00-04:00",
    category: "art",
    description:
      "A casual evening of drawing and drinking with Blue Ridge Art Way. Bring a sketchbook or borrow supplies.",
  },
  {
    _id: "fallback-eat-local",
    title: "Eat Local. End Hunger.",
    start: "2026-09-03T12:00:00-04:00",
    category: "community",
    description:
      "10% of the day’s sales donated to Haywood Christian Ministries.",
  },
  {
    _id: "fallback-anniversary",
    title: "One-Year Anniversary Party",
    start: "2026-09-04T12:00:00-04:00",
    category: "party",
    description:
      "One year of the Beer Hub under Jason & Charlotte! $1 off full pours all day, and Chris Campbell plays live from 5 to 7. Come celebrate with us.",
  },
  {
    _id: "fallback-chris-campbell-4",
    title: "Chris Campbell",
    start: "2026-09-04T17:00:00-04:00",
    endTime: "2026-09-04T19:00:00-04:00",
    category: "music",
  },
  {
    _id: "fallback-first-friday",
    title: "Waynesville First Friday",
    start: "2026-09-04T17:00:00-04:00",
    endTime: "2026-09-04T20:00:00-04:00",
    category: "community",
    description: "Shop, sip, stroll through downtown Waynesville.",
  },
  {
    _id: "fallback-rick-yates",
    title: "Rick Yates",
    start: "2026-09-05T17:00:00-04:00",
    endTime: "2026-09-05T19:00:00-04:00",
    category: "music",
  },
  {
    _id: "fallback-chris-minick",
    title: "Chris Minick",
    start: "2026-09-11T17:00:00-04:00",
    endTime: "2026-09-11T19:00:00-04:00",
    category: "music",
  },
  {
    _id: "fallback-paul-koptak",
    title: "Paul Koptak",
    start: "2026-09-12T17:00:00-04:00",
    endTime: "2026-09-12T19:00:00-04:00",
    category: "music",
  },
  {
    _id: "fallback-chris-campbell-18",
    title: "Chris Campbell",
    start: "2026-09-18T17:00:00-04:00",
    endTime: "2026-09-18T19:00:00-04:00",
    category: "music",
  },
  {
    _id: "fallback-sneaky-pete",
    title: "Sneaky Pete Band",
    start: "2026-09-19T17:00:00-04:00",
    endTime: "2026-09-19T19:00:00-04:00",
    category: "music",
  },
  {
    _id: "fallback-jerry-gaff",
    title: "Jerry Gaff",
    start: "2026-09-25T17:00:00-04:00",
    endTime: "2026-09-25T19:00:00-04:00",
    category: "music",
  },
  {
    _id: "fallback-doug-lisa-roberto",
    title: "Doug, Lisa & Roberto",
    start: "2026-09-26T17:00:00-04:00",
    endTime: "2026-09-26T19:00:00-04:00",
    category: "music",
  },
  {
    _id: "fallback-knots",
    title: "Knots with Steve Kuni",
    start: "2026-09-30T18:00:00-04:00",
    endTime: "2026-09-30T19:00:00-04:00",
    category: "community",
  },
  {
    _id: "fallback-bingo-1",
    title: "Music Bingo",
    start: "2026-09-08T18:30:00-04:00",
    endTime: "2026-09-08T20:30:00-04:00",
    category: "games",
    description: "Name that tune, mark your card, win stuff.",
  },
  {
    _id: "fallback-bingo-2",
    title: "Music Bingo",
    start: "2026-09-29T18:30:00-04:00",
    endTime: "2026-09-29T20:30:00-04:00",
    category: "games",
    description: "Name that tune, mark your card, win stuff.",
  },
];

export const FALLBACK_WEEKLY: WeeklyEvent[] = [
  {
    _id: "fallback-weekly-thu",
    title: "Bluegrass with The Blue Mountaineers",
    dayOfWeek: "Thursday",
    time: "5–7 PM",
    category: "music",
    description: "Waynesville’s finest pickin’, every Thursday evening.",
  },
];
