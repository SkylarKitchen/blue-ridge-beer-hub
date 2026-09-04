import { stegaClean } from "next-sanity";

import type { EventCategory } from "./types";

export const CATEGORY_META: Record<
  EventCategory,
  { label: string; chipClass: string }
> = {
  music: { label: "Live music", chipClass: "bg-mist text-navy-deep" },
  art: { label: "Art", chipClass: "bg-cream text-navy-deep" },
  games: { label: "Games & bingo", chipClass: "bg-butter text-navy-deep" },
  party: { label: "Party", chipClass: "bg-amber text-navy-deep" },
  community: { label: "Community", chipClass: "bg-mint text-navy-deep" },
};

export function categoryMeta(category?: string) {
  // stegaClean: draft-mode previews append invisible visual-editing
  // characters, which would miss the lookup and mislabel every chip.
  return (
    CATEGORY_META[stegaClean(category ?? "music") as EventCategory] ??
    CATEGORY_META.community
  );
}
