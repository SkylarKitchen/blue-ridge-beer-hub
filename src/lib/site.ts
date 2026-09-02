/**
 * Canonical site origin, used by metadata, sitemap, robots, and JSON-LD.
 * www is canonical; the apex 308-redirects to it. NEXT_PUBLIC_SITE_URL
 * overrides for previews.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brbeerhub.com";
