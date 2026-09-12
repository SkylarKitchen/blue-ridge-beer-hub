"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary for the public site. The homepage already
 * falls back to baked-in content when Sanity is unreachable, so this only
 * catches render-time failures — but a taproom's site should never show a
 * framework stack trace to someone looking for tonight's show.
 */
export default function SiteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-5 sm:px-10 text-center">
      <p className="font-display text-6xl uppercase leading-none text-navy sm:text-8xl">
        Tap’s run dry
      </p>
      <p className="max-w-md text-lg leading-relaxed text-ink/80">
        Something went wrong loading the page. Give it another pour — and if
        it keeps happening, we’re at 21 East St either way.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-full bg-navy px-6 py-3 font-display text-base uppercase tracking-wide text-cream transition-colors hover:bg-navy-deep"
      >
        Try again
      </button>
    </main>
  );
}
