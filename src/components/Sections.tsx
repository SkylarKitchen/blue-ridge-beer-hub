import { assignAnchors, type Placed } from "@/lib/sections";
import type {
  GalleryImage,
  HubEvent,
  SiteSettings,
  WeeklyEvent,
} from "@/lib/types";

import { AboutSection } from "./AboutSection";
import { EventsSection } from "./EventsSection";
import { GallerySection } from "./GallerySection";
import { Hero } from "./Hero";
import { OfferingsSection } from "./OfferingsSection";
import { OnTapSection } from "./OnTapSection";
import { Ridgeline } from "./Ridgeline";

/** Page-level data that blocks read but don’t own. */
export interface SectionContext {
  settings: SiteSettings;
  events: HubEvent[];
  weeklyEvents: WeeklyEvent[];
  gallery: GalleryImage[];
}

export function Sections({
  placed,
  ctx,
}: {
  placed: Placed[];
  ctx: SectionContext;
}) {
  const shown = placed.filter((p) => !p.section.hiddenOnSite);
  const anchors = assignAnchors(shown.map((p) => p.section));
  const eventsKey = shown.find((p) => p.section._type === "eventsBlock")
    ?.section._key;
  const eventsHref = eventsKey ? `#${anchors.get(eventsKey)}` : undefined;
  const location = [
    ctx.settings.name ?? "Blue Ridge Beer Hub",
    ctx.settings.addressLine1,
    ctx.settings.addressLine2,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      {shown.map(({ section, scope }) => {
        const id = anchors.get(section._key) ?? undefined;
        switch (section._type) {
          case "heroBlock":
            return (
              <Hero
                key={section._key}
                block={section}
                scope={scope}
                settings={ctx.settings}
                id={id}
                eventsHref={eventsHref}
              />
            );
          case "dividerBlock":
            return <Ridgeline key={section._key} />;
          case "eventsBlock":
            return (
              <EventsSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
                events={ctx.events}
                weeklyEvents={ctx.weeklyEvents}
                instagramUrl={ctx.settings.instagramUrl}
                location={location}
              />
            );
          case "onTapBlock":
            return (
              <OnTapSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
                untappdUrl={ctx.settings.untappdUrl}
              />
            );
          case "offeringsBlock":
            return (
              <OfferingsSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
              />
            );
          case "galleryBlock":
            return (
              <GallerySection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
                images={ctx.gallery}
              />
            );
          case "aboutBlock":
            return (
              <AboutSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
