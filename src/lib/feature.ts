// src/lib/feature.ts
import type { Section } from "./sections.ts";

export type FeatureLayout = "none" | "one" | "two" | "three";

/** Layout follows the photo count so the owners can’t pick one that doesn’t fit. */
export function featureLayout(count: number): FeatureLayout {
  if (count <= 0) return "none";
  if (count === 1) return "one";
  if (count === 2) return "two";
  return "three";
}

const TZ = "America/New_York";

/** "Updated Sep 12", with the year only when it isn’t the current one. */
export function formatAsOf(iso?: string, now = new Date()): string | null {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00-04:00`);
  if (Number.isNaN(date.getTime())) return null;
  const sameYear =
    date.toLocaleDateString("en-US", { year: "numeric", timeZone: TZ }) ===
    now.toLocaleDateString("en-US", { year: "numeric", timeZone: TZ });
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: TZ,
  });
  return `Updated ${label}`;
}

/**
 * Href of the first Feature block after `fromKey` in page order, so the On
 * Tap second line can say “see what’s new to go” and mean the section
 * below it — wherever the owners put it.
 */
export function nextFeatureAnchor(
  sections: Section[],
  fromKey: string,
  anchors: Map<string, string | null>,
): string | undefined {
  const start = sections.findIndex((s) => s._key === fromKey);
  if (start < 0) return undefined;
  for (const section of sections.slice(start + 1)) {
    if (section._type !== "featureBlock" || section.hiddenOnSite) continue;
    const anchor = anchors.get(section._key);
    if (anchor) return `#${anchor}`;
  }
  return undefined;
}
