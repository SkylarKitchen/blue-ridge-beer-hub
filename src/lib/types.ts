import type { PortableTextBlock } from "next-sanity";

export interface DayHours {
  day: string;
  opens?: string;
  closes?: string;
  closed?: boolean;
}

export interface Offering {
  title: string;
  description: string;
}

export interface SanityImageRef {
  asset?: { _ref: string };
  alt?: string;
  hotspot?: { x: number; y: number };
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
  onTapBlurb?: string;
  tapCount?: number;
  hours?: DayHours[];
  heroHeading?: string;
  heroSubheading?: string;
  aboutHeading?: string;
  aboutBody?: PortableTextBlock[];
  offerings?: Offering[];
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
