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
  return (
    CATEGORY_META[(category ?? "music") as EventCategory] ??
    CATEGORY_META.community
  );
}
