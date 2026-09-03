import type { HubEvent, SiteSettings, WeeklyEvent } from "./types";

/**
 * Build-time fallback content mirroring seed/seed.ndjson. Used when Sanity is
 * unreachable or the dataset is empty, so the site always renders real content
 * — including at the party if anything upstream hiccups. Once Sanity is the
 * source of truth, edits happen there; keep this file as the emergency copy.
 */
export const FALLBACK_SETTINGS: SiteSettings = {
  name: "Blue Ridge Beer Hub",
  tagline: "Waynesville’s community taproom & bottle shop",
  addressLine1: "21 East St",
  addressLine2: "Waynesville, NC 28786",
  phone: "(828) 246-9320",
  email: "blueridgebeerhub@gmail.com",
  untappdUrl: "https://untappd.com/v/blue-ridge-beer-hub/6732717",
  instagramUrl: "https://www.instagram.com/brbeerhub/",
  facebookUrl: "https://www.facebook.com/brbeerhub",
  announcement:
    "🎉 One-year anniversary party this Friday, Sept 4: $1 off full pours, Chris Campbell live 5 to 7 PM",
  onTapBlurb:
    "Sixteen taps that change almost daily: stouts, sours, IPAs, and the occasional white whale. The full list lives on Untappd.",
  tapCount: 16,
  heroHeading: "Your friendly\nneighborhood\nbeer hub",
  heroSubheading:
    "Sixteen rotating taps and coolers full of carryout on East Street in downtown Waynesville. Most nights there’s something going on, live music more often than not.",
  aboutHeading: "About the Hub",
  aboutBody: [
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
  hours: [
    { day: "Monday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Tuesday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Wednesday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Thursday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Friday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Saturday", opens: "12:00 PM", closes: "9:00 PM", closed: false },
    { day: "Sunday", opens: "1:00 PM", closes: "7:00 PM", closed: false },
  ],
  offerings: [
    {
      title: "On tap",
      description:
        "Sixteen rotating lines of beer, cider, and mead, heavy on Asheville-area breweries. Pours run from a 4 oz taster to a full pint, and we fill growlers to go.",
    },
    {
      title: "Coolers & carryout",
      description:
        "Bottles and cans to go, build-your-own six-packs, and shelves of wine, mead, cider, and THC drinks. Half the fun is browsing the coolers.",
    },
    {
      title: "Kegs & tap rentals",
      description:
        "Throwing a party? We sell kegs and rent out the taps and CO2 to pour them right. Call or email ahead and we’ll have everything cold and ready to go.",
    },
  ],
};

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
