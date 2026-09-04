import { defineQuery } from "next-sanity";

export const SITE_SETTINGS_QUERY = defineQuery(
  `*[_type == "siteSettings"][0]{
    name, tagline, addressLine1, addressLine2, phone, email,
    untappdUrl, instagramUrl, facebookUrl, announcement, onTapBlurb, tapCount,
    hours[]{day, opens, closes, closed},
    heroHeading, heroSubheading,
    aboutHeading, aboutBody, credentials,
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

// Excludes the shots pinned into the hero and About sections (see Hero.tsx,
// AboutSection.tsx) so they don't double up in the grid.
export const GALLERY_QUERY = defineQuery(
  `*[_type == "galleryImage"
    && !(_id in ["galleryImage-tap-handles", "galleryImage-owners-open-flag"])]
    | order(order asc, _createdAt asc){
    _id, image, alt, caption
  }`,
);
