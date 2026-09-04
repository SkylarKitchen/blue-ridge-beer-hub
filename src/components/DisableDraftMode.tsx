"use client";

import { useIsPresentationTool } from "next-sanity/hooks";

/**
 * Small fixed banner shown while draft mode is on OUTSIDE the Studio —
 * e.g. after opening a preview link in its own tab. Inside the
 * Presentation iframe Sanity manages draft mode itself, so we hide it.
 */
export function DisableDraftMode() {
  const isPresentation = useIsPresentationTool();
  if (isPresentation !== false) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-full bg-navy-deep px-4 py-2 text-sm text-cream shadow-lg">
      <span>Previewing drafts</span>
      {/* Plain <a>: the API route must run server-side to clear the draft
          cookie; <Link> would soft-navigate/prefetch it. */}
      <a href="/api/draft-mode/disable" className="underline">
        Exit
      </a>
    </div>
  );
}
