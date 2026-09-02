/**
 * Canonical site origin. Set NEXT_PUBLIC_SITE_URL when the real domain lands;
 * until then the Vercel production URL keeps metadata/sitemap/JSON-LD honest.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://blue-ridge-beer-hub.vercel.app";
