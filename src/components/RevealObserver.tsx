"use client";

import { useEffect } from "react";

import { startReveals } from "@/lib/reveal";

/**
 * Drives the CSS scroll reveals in globals.css. The logic lives in
 * lib/reveal.ts so it can be tested without a browser; this component only
 * wires it to the real document.
 */
export function RevealObserver() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    return startReveals({
      document,
      viewportHeight: () => window.innerHeight,
      createIntersectionObserver: (onChange, options) =>
        new IntersectionObserver((entries) => onChange(entries), options),
      createMutationObserver: (onChange) =>
        new MutationObserver(() => onChange()),
    });
  }, []);

  return null;
}
