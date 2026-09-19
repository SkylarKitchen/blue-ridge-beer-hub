import { Analytics } from "@vercel/analytics/next";
import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";

import { DisableDraftMode } from "@/components/DisableDraftMode";
import { SanityLive } from "@/sanity/live";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled } = await draftMode();

  return (
    <>
      {children}
      <SanityLive />
      {/* Draft mode = an editor previewing in the Studio's visual editor.
          VisualEditing draws the click-to-edit overlays; the banner offers
          a way out when previewing outside the Studio. */}
      {isEnabled ? (
        <>
          <VisualEditing />
          <DisableDraftMode />
        </>
      ) : (
        /* Vercel Web Analytics, public visits only. Skipped in draft mode so
           an editor previewing in the Studio isn't counted, and scoped to
           this route group so /studio and the owners' /guide stay out of
           the numbers. The package is a no-op in development. */
        <Analytics />
      )}
    </>
  );
}
