"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

import { POSTHOG_KEY } from "@/lib/site";

/**
 * PostHog, public visits only. Rendered from the (site) layout when draft
 * mode is off, so Studio previews, /studio and the owners' /guide never
 * count. Only the production deployment reports: previews and local dev
 * stay silent, and the vercel.app alias on the printed QR card still counts
 * because it is served by the production deployment.
 *
 * PostHog's default first-party cookie is kept on purpose: its cookieless
 * mode strips the IP before enrichment, which loses GeoIP (Asheville vs.
 * out-of-town visitors) and bot detection, both worth more here than a
 * cookie no US rule requires a banner for. Nobody is ever identified, so
 * every event stays anonymous. Session replay stays off. Events go through
 * the first-party /ingest rewrite in next.config.ts, so blockers never see
 * a third-party host.
 */
export function PostHogInit() {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production") return;

    // Re-running init (the layout remounts after a trip to /guide) is a
    // documented no-op in posthog-js.
    posthog.init(POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2026-05-30",
      person_profiles: "identified_only",
      disable_session_recording: true,
    });
  }, []);

  return null;
}
