import { createDataAttribute } from "next-sanity";

import { HOME_PAGE_ID, HOME_PAGE_TYPE } from "@/lib/edit-scope";
import { nextFeatureAnchor } from "@/lib/feature";
import { assignAnchors, sectionArrayPath, type Placed } from "@/lib/sections";
import type { HubEvent, SiteSettings, WeeklyEvent } from "@/lib/types";

import { AboutSection } from "./AboutSection";
import { EventsSection } from "./EventsSection";
import { FeatureSection } from "./FeatureSection";
import { GallerySection } from "./GallerySection";
import { Hero } from "./Hero";
import { OfferingsSection } from "./OfferingsSection";
import { OnTapSection } from "./OnTapSection";
import { Ridgeline } from "./Ridgeline";

/**
 * Makes a block draggable in the Presentation overlay.
 *
 * @sanity/visual-editing 6.1.2 enables drag only when ALL of these hold. Read
 * from the package's own source (`dist/SharedStateContext-*.js`,
 * `resolveDragAndDropGroup` and the `draggable` predicate in
 * `dist/VisualEditing-*.js`) rather than from its docs, which do not say:
 *
 *   1. the element carries a `data-sanity` attribute;
 *   2. its path is an ARRAY path — the segment after the final "." must
 *      contain "[", which `sections[_key=="…"]` satisfies;
 *   3. at least one OTHER registered element resolves to the same array at a
 *      different path. `resolveDragAndDropGroup` returns null for a group of
 *      one, so a page with a single block is never draggable;
 *   4. the optimistic document actor is ready, which needs Presentation with
 *      the schema loaded;
 *   5. no `data-sanity-drag-disable` on the element.
 *
 * We control 1, 2 and 3. Points 4 and 5 are the runtime's.
 *
 * Only a Home Page document has a `sections` array to reorder; the guard on
 * the scope's document id keeps a block placed anywhere else from
 * advertising a reorder that cannot be written back.
 */
function dragAttribute(scope: Placed["scope"], key: string) {
  if (scope.documentId !== HOME_PAGE_ID) return undefined;
  return createDataAttribute({ id: HOME_PAGE_ID, type: HOME_PAGE_TYPE })(
    sectionArrayPath(key),
  );
}

/** Page-level data that blocks read but don’t own. */
export interface SectionContext {
  settings: SiteSettings;
  events: HubEvent[];
  weeklyEvents: WeeklyEvent[];
}

export function Sections({
  placed,
  ctx,
}: {
  placed: Placed[];
  ctx: SectionContext;
}) {
  const shown = placed.filter((p) => !p.section.hiddenOnSite);
  const list = shown.map((p) => p.section);
  const anchors = assignAnchors(list);
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
        const drag = dragAttribute(scope, section._key);
        // A plain div with no classes: <main> is unstyled block flow, so the
        // extra box is layout-neutral. It cannot be `display: contents` —
        // that produces no box, and the overlay measures a bounding rect.
        const wrap = (node: React.ReactNode) =>
          drag ? (
            <div key={section._key} data-sanity={drag}>
              {node}
            </div>
          ) : (
            node
          );
        switch (section._type) {
          case "heroBlock":
            return wrap(
              <Hero
                key={section._key}
                block={section}
                scope={scope}
                settings={ctx.settings}
                id={id}
                eventsHref={eventsHref}
              />,
            );
          case "dividerBlock":
            return wrap(<Ridgeline key={section._key} />);
          case "eventsBlock":
            return wrap(
              <EventsSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
                events={ctx.events}
                weeklyEvents={ctx.weeklyEvents}
                instagramUrl={ctx.settings.instagramUrl}
                location={location}
              />,
            );
          case "onTapBlock":
            return wrap(
              <OnTapSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
                untappdUrl={ctx.settings.untappdUrl}
                secondaryHref={nextFeatureAnchor(list, section._key, anchors)}
              />,
            );
          case "featureBlock":
            return wrap(
              <FeatureSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
              />,
            );
          case "offeringsBlock":
            return wrap(
              <OfferingsSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
              />,
            );
          case "galleryBlock":
            return wrap(
              <GallerySection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
              />,
            );
          case "aboutBlock":
            return wrap(
              <AboutSection
                key={section._key}
                block={section}
                scope={scope}
                id={id}
              />,
            );
          default:
            return null;
        }
      })}
    </>
  );
}
