import type { HubEvent, SiteSettings, WeeklyEvent } from "./types";

/**
 * Build-time fallback content mirroring seed/seed.ndjson. Used when Sanity is
 * unreachable or the dataset is empty, so the site always renders real content
 * — including at the party if anything upstream hiccups. Once Sanity is the
 * source of truth, edits happen there; keep this file as the emergency copy.
 */
export const FALLBACK_SETTINGS: SiteSettings = {
  name: "Blue Ridge Beer Hub",
  tagline: "Waynesville's community taproom & bottle shop",
  addressLine1: "21 East St",
  addressLine2: "Waynesville, NC 28786",
  phone: "(828) 246-9320",
  email: "blueridgebeerhub@gmail.com",
  untappdUrl: "https://untappd.com/v/blue-ridge-beer-hub/6732717",
  instagramUrl: "https://www.instagram.com/brbeerhub/",
  facebookUrl: "https://www.facebook.com/brbeerhub",
  announcement:
    "🎉 One-year anniversary party this Friday, Sept 4 — $1 off full pours, Chris Campbell live 5–7 PM",
  onTapBlurb:
    "Sixteen rotating taps of serious craft — stouts, sours, IPAs, and the occasional white whale — plus cider, mead, and wine. The list lives on Untappd and changes almost daily.",
  heroHeading: "Your friendly\n*neighborhood*\nbeer hub",
  heroSubheading:
    "Sixteen rotating taps, coolers full of carryout, and something happening almost every night — right on East Street in downtown Waynesville.",
  aboutHeading: "About *the Hub*",
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
          text: "The Beer Hub is Waynesville's community taproom and bottle shop — sixteen taps of rotating craft beer, coolers stocked for carryout, and shelves of homebrew supplies, right in the heart of downtown.",
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
          text: "Serving Haywood County since 2017 — and since September 2025 under the care of owners Jason & Charlotte Johnson — the Hub is where neighbors catch live bluegrass on a Thursday, visitors find their new favorite pour, and everybody leaves knowing somebody new.",
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
          text: "Swing by for a taster flight, fill a growler, or just come hang out — there's a stool with your name on it.",
        },
      ],
    },
  ],
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
        "Sixteen rotating lines of craft beer, cider, and mead — from Asheville-area locals to hard-to-find stouts and sours. Pours from a 4 oz taster to a full pint, plus growler fills to go.",
    },
    {
      title: "Coolers & carryout",
      description:
        "Bottles and cans to go, build-your-own six-packs, and shelves of wine, mead, cider, and THC drinks. Browse the coolers — that's half the fun.",
    },
    {
      title: "Homebrew supplies",
      description:
        "Gear and ingredients for Haywood County's homebrewers, carrying on the shop's homebrew roots — with friendly advice from folks who've brewed a batch or two.",
    },
  ],
};

export const FALLBACK_EVENTS: HubEvent[] = [
  {
    _id: "fallback-eat-local",
    title: "Eat Local. End Hunger.",
    start: "2026-09-03T12:00:00-04:00",
    category: "community",
    description:
      "10% of the day's sales donated to Haywood Christian Ministries.",
  },
  {
    _id: "fallback-anniversary",
    title: "One-Year Anniversary Party",
    start: "2026-09-04T12:00:00-04:00",
    category: "party",
    description:
      "One year of the Beer Hub under Jason & Charlotte! $1 off full pours all day, and Chris Campbell plays live 5–7 PM. Come celebrate with us.",
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
    description: "Waynesville's finest pickin', every Thursday evening.",
  },
];
