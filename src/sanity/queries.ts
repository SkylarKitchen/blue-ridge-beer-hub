import { defineQuery } from "next-sanity";

export const SITE_SETTINGS_QUERY = defineQuery(
  `*[_type == "siteSettings"][0]{
    name, tagline, addressLine1, addressLine2, phone, email,
    untappdUrl, instagramUrl, facebookUrl, announcement, onTapBlurb, tapCount,
    hours[]{day, opens, closes, closed},
    heroHeading, heroSubheading,
    aboutHeading, aboutBody,
    offerings[]{title, description}
  }`,
);

/** Dated events from the start of today onward, soonest first. */
export const EVENTS_QUERY = defineQuery(
  `*[_type == "event" && start >= $from] | order(start asc){
    _id, title, start, endTime, category, description, link
  }`,
);

export const WEEKLY_EVENTS_QUERY = defineQuery(
  `*[_type == "weeklyEvent" && active != false]{
    _id, title, dayOfWeek, time, category, description
  }`,
);

export const GALLERY_QUERY = defineQuery(
  `*[_type == "galleryImage"] | order(order asc, _createdAt asc){
    _id, image, alt, caption
  }`,
);
