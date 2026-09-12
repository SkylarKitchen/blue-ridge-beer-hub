import type { PortableTextBlock } from "next-sanity";

export interface DayHours {
  _key?: string;
  day: string;
  opens?: string;
  closes?: string;
  closed?: boolean;
}

export interface Offering {
  _key?: string;
  title: string;
  description: string;
}

export interface SanityImageRef {
  _type?: "image";
  asset?: { _type?: "reference"; _ref: string };
  alt?: string;
  hotspot?: { x: number; y: number; height?: number; width?: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

export interface SiteSettings {
  name?: string;
  tagline?: string;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  email?: string;
  untappdUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  announcement?: string;
  hours?: DayHours[];
  heroHeading?: string;
  heroSubheading?: string;
  heroPrimaryCta?: string;
  heroSecondaryCta?: string;
  heroImage?: SanityImageRef;
  eventsHeading?: string;
  weeklyHeading?: string;
  onTapHeading?: string;
  onTapBlurb?: string;
  onTapSecondary?: string;
  onTapCta?: string;
  tapCount?: number;
  tapCountLabel?: string;
  tapCountFootnote?: string;
  tapPerks?: string[];
  offeringsHeading?: string;
  offerings?: Offering[];
  galleryHeading?: string;
  aboutHeading?: string;
  aboutBody?: PortableTextBlock[];
  aboutImage?: SanityImageRef;
  credentials?: string[];
  footerHeading?: string;
  footerHoursLabel?: string;
  footerFindUsLabel?: string;
  footerFollowLabel?: string;
  footerDirectionsCta?: string;
  footerVisitLine?: string;
  footerLegal?: string;
  pipelineEmails?: string[];
}

export type EventCategory = "music" | "art" | "games" | "party" | "community";

export interface HubEvent {
  _id: string;
  title: string;
  start: string;
  endTime?: string;
  category?: EventCategory;
  description?: string;
  link?: string;
}

export interface WeeklyEvent {
  _id: string;
  title: string;
  dayOfWeek: string;
  time: string;
  category?: EventCategory;
  description?: string;
}

export interface GalleryImage {
  _id: string;
  image: SanityImageRef;
  alt: string;
  caption?: string;
}
