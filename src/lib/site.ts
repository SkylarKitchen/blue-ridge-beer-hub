/**
 * Canonical site origin, used by metadata, sitemap, robots, and JSON-LD.
 * www is canonical; the apex 308-redirects to it. NEXT_PUBLIC_SITE_URL
 * overrides for previews.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brbeerhub.com";

/**
 * PostHog project token. Public by design: it lets a browser send events
 * and nothing else. Empty disables analytics. Dashboard: us.posthog.com.
 */
export const POSTHOG_KEY = "phc_AbhswtP5Cv2RHkUTQymHvj8nQ8UC5zMpLhHWqxyMDYmQ";
