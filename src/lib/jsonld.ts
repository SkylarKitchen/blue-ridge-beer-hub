import { stegaClean } from "next-sanity";

import { minutesTo24h, parseTimeToMinutes } from "./hours.ts";
import type { SiteSettings } from "./types";

/**
 * schema.org BarOrPub structured data so Google can show hours, address,
 * and links directly in local search — the site's whole job for a local.
 */
export function localBusinessJsonLd(settings: SiteSettings, siteUrl: string) {
  const cityMatch = settings.addressLine2?.match(
    /^(.*?),\s*([A-Z]{2})\s+(\d{5})/,
  );

  const openingHoursSpecification = (settings.hours ?? [])
    .filter((row) => !row.closed)
    .flatMap((row) => {
      const opens = parseTimeToMinutes(row.opens);
      const closes = parseTimeToMinutes(row.closes);
      if (opens == null || closes == null) return [];
      return [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: row.day,
          opens: minutesTo24h(opens),
          closes: minutesTo24h(closes),
        },
      ];
    });

  const sameAs = [
    settings.untappdUrl,
    settings.instagramUrl,
    settings.facebookUrl,
  ].filter(Boolean);

  // Nothing inside a <script> tag is clickable in the visual editor, so
  // there’s no stega worth preserving — it would just be invisible bloat
  // corrupting the structured data Google reads. Cleaning the whole payload
  // at the boundary also covers any field added here later.
  return stegaClean({
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: settings.name ?? "Blue Ridge Beer Hub",
    description: settings.tagline,
    url: siteUrl,
    image: `${siteUrl}/logo.jpg`,
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.addressLine1,
      addressLocality: cityMatch?.[1] ?? settings.addressLine2,
      addressRegion: cityMatch?.[2],
      postalCode: cityMatch?.[3],
      addressCountry: "US",
    },
    ...(openingHoursSpecification.length > 0 && { openingHoursSpecification }),
    ...(sameAs.length > 0 && { sameAs }),
  });
}
