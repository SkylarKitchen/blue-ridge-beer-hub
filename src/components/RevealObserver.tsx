"use client";

import { useEffect } from "react";

/**
 * Drives the CSS scroll reveals in globals.css by flagging
 * [data-reveal] / [data-reveal-group] elements with data-inview as they
 * enter the viewport. The hidden state only applies once html[data-reveals]
 * is set here, so content is never blanked for no-JS visitors — and
 * anything already on screen at mount is marked in-view in the same
 * synchronous pass, so it neither blinks nor re-animates.
 */
export function RevealObserver() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const targets = Array.from(
      document.querySelectorAll("[data-reveal], [data-reveal-group]"),
    );
    if (targets.length === 0) return;

    document.documentElement.setAttribute("data-reveals", "");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-inview", "");
            observer.unobserve(entry.target);
          }
        }
      },
      // Fire once the element clears the bottom ~12% of the viewport.
      { rootMargin: "0px 0px -12% 0px" },
    );

    const viewportBottom = window.innerHeight;
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportBottom && rect.bottom > 0) {
        el.setAttribute("data-inview", "");
      } else {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
