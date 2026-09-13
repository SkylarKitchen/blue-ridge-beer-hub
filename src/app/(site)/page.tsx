import { AboutSection } from "@/components/AboutSection";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { EventsSection } from "@/components/EventsSection";
import { GallerySection } from "@/components/GallerySection";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HoursFooter } from "@/components/HoursFooter";
import { OfferingsSection } from "@/components/OfferingsSection";
import { OnTapSection } from "@/components/OnTapSection";
import { RevealObserver } from "@/components/RevealObserver";
import { Ridgeline } from "@/components/Ridgeline";
import {
  FALLBACK_EVENTS,
  FALLBACK_SETTINGS,
  FALLBACK_WEEKLY,
} from "@/lib/fallback";
import { upcomingEvents } from "@/lib/events";
import { startOfTodayIso } from "@/lib/format";
import { localBusinessJsonLd } from "@/lib/jsonld";
import { placeLegacy } from "@/lib/sections";
import { SITE_URL } from "@/lib/site";
import type {
  GalleryImage,
  HubEvent,
  SiteSettings,
  WeeklyEvent,
} from "@/lib/types";
import { sanityFetch } from "@/sanity/live";
import {
  EVENTS_QUERY,
  GALLERY_QUERY,
  SITE_SETTINGS_QUERY,
  WEEKLY_EVENTS_QUERY,
} from "@/sanity/queries";

/**
 * Sanity Live re-renders this page when content changes, but nothing else
 * would — and the "upcoming events" floor is computed at render time. Without
 * time-based revalidation a quiet week leaves last Saturday's show on the
 * page. Hourly ISR keeps the floor within an hour of midnight; the other
 * queries still come from the tag-based data cache, so this costs one extra
 * events query per hour at most.
 */
export const revalidate = 3600;

export default async function HomePage() {
  const from = startOfTodayIso();
  let settings: SiteSettings = {};
  let events: HubEvent[] = [];
  let weeklyEvents: WeeklyEvent[] = [];
  let gallery: GalleryImage[] = [];

  try {
    const [settingsRes, eventsRes, weeklyRes, galleryRes] = await Promise.all([
      sanityFetch({ query: SITE_SETTINGS_QUERY }),
      sanityFetch({ query: EVENTS_QUERY, params: { from } }),
      sanityFetch({ query: WEEKLY_EVENTS_QUERY }),
      sanityFetch({ query: GALLERY_QUERY }),
    ]);
    settings = (settingsRes.data ?? {}) as SiteSettings;
    events = (eventsRes.data ?? []) as HubEvent[];
    weeklyEvents = (weeklyRes.data ?? []) as WeeklyEvent[];
    gallery = (galleryRes.data ?? []) as GalleryImage[];
  } catch (error) {
    // If Sanity is unreachable the site still renders full fallback content.
    console.error("Sanity fetch failed; rendering fallbacks", error);
  }

  // Sanity unreachable or dataset not seeded yet → serve the baked-in copy.
  if (!settings.name) {
    settings = FALLBACK_SETTINGS;
    events = upcomingEvents(FALLBACK_EVENTS, from);
    weeklyEvents = FALLBACK_WEEKLY;
  }

  const placed = placeLegacy(settings);
  const heroPlaced = placed.find((p) => p.section._type === "heroBlock");
  const onTapPlaced = placed.find((p) => p.section._type === "onTapBlock");
  const offeringsPlaced = placed.find(
    (p) => p.section._type === "offeringsBlock",
  );
  const galleryPlaced = placed.find((p) => p.section._type === "galleryBlock");
  const aboutPlaced = placed.find((p) => p.section._type === "aboutBlock");

  const jsonLd = JSON.stringify(
    localBusinessJsonLd(settings, SITE_URL),
  ).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream"
      >
        Skip to content
      </a>
      <AnnouncementBanner text={settings.announcement} />
      <Header name={settings.name ?? "Blue Ridge Beer Hub"} />
      <main id="main">
        {heroPlaced && heroPlaced.section._type === "heroBlock" ? (
          <Hero
            block={heroPlaced.section}
            scope={heroPlaced.scope}
            settings={settings}
            eventsHref="#events"
          />
        ) : null}
        <Ridgeline />
        <EventsSection
          events={events}
          weeklyEvents={weeklyEvents}
          heading={settings.eventsHeading}
          weeklyHeading={settings.weeklyHeading}
          instagramUrl={settings.instagramUrl}
          location={[
            settings.name ?? "Blue Ridge Beer Hub",
            settings.addressLine1,
            settings.addressLine2,
          ]
            .filter(Boolean)
            .join(", ")}
        />
        {onTapPlaced && onTapPlaced.section._type === "onTapBlock" ? (
          <OnTapSection
            block={onTapPlaced.section}
            scope={onTapPlaced.scope}
            untappdUrl={settings.untappdUrl}
          />
        ) : null}
        {offeringsPlaced &&
        offeringsPlaced.section._type === "offeringsBlock" ? (
          <OfferingsSection
            block={offeringsPlaced.section}
            scope={offeringsPlaced.scope}
          />
        ) : null}
        {galleryPlaced && galleryPlaced.section._type === "galleryBlock" ? (
          <GallerySection
            block={galleryPlaced.section}
            scope={galleryPlaced.scope}
            images={gallery}
          />
        ) : null}
        {aboutPlaced && aboutPlaced.section._type === "aboutBlock" ? (
          <AboutSection block={aboutPlaced.section} scope={aboutPlaced.scope} />
        ) : null}
        <Ridgeline />
        <HoursFooter settings={settings} />
      </main>
      <RevealObserver />
    </>
  );
}
