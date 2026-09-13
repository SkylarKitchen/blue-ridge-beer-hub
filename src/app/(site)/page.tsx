import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Header } from "@/components/Header";
import { HoursFooter } from "@/components/HoursFooter";
import { RevealObserver } from "@/components/RevealObserver";
import { Sections } from "@/components/Sections";
import {
  FALLBACK_EVENTS,
  FALLBACK_SECTIONS,
  FALLBACK_SETTINGS,
  FALLBACK_WEEKLY,
} from "@/lib/fallback";
import { upcomingEvents } from "@/lib/events";
import { startOfTodayIso } from "@/lib/format";
import { localBusinessJsonLd } from "@/lib/jsonld";
import { navFromSections, placeHome, type Section } from "@/lib/sections";
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
  HOME_PAGE_QUERY,
  SITE_SETTINGS_QUERY,
  WEEKLY_EVENTS_QUERY,
} from "@/sanity/queries";

interface HomePageDoc {
  sections?: Section[];
}

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
  let home: HomePageDoc | null = null;

  try {
    const [settingsRes, eventsRes, weeklyRes, galleryRes, homeRes] =
      await Promise.all([
        sanityFetch({ query: SITE_SETTINGS_QUERY }),
        sanityFetch({ query: EVENTS_QUERY, params: { from } }),
        sanityFetch({ query: WEEKLY_EVENTS_QUERY }),
        sanityFetch({ query: GALLERY_QUERY }),
        sanityFetch({ query: HOME_PAGE_QUERY }),
      ]);
    settings = (settingsRes.data ?? {}) as SiteSettings;
    events = (eventsRes.data ?? []) as HubEvent[];
    weeklyEvents = (weeklyRes.data ?? []) as WeeklyEvent[];
    gallery = (galleryRes.data ?? []) as GalleryImage[];
    home = (homeRes.data ?? null) as HomePageDoc | null;
  } catch (error) {
    // If Sanity is unreachable the site still renders full fallback content.
    console.error("Sanity fetch failed; rendering fallbacks", error);
  }

  // Sanity unreachable or dataset not seeded yet → serve the baked-in copy.
  if (!settings.name) {
    settings = FALLBACK_SETTINGS;
    events = upcomingEvents(FALLBACK_EVENTS, from);
    weeklyEvents = FALLBACK_WEEKLY;
    home = null;
  }

  // Sanity unreachable, or the Home Page document missing → the baked-in
  // section list, which is the migrated page as it stood on 2026-09-13.
  const placed = placeHome(
    home?.sections?.length ? home.sections : FALLBACK_SECTIONS,
  );

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
      <Header
        name={settings.name ?? "Blue Ridge Beer Hub"}
        nav={navFromSections(placed.map((p) => p.section))}
      />
      <main id="main">
        <Sections
          placed={placed}
          ctx={{ settings, events, weeklyEvents, gallery }}
        />
        <HoursFooter settings={settings} />
      </main>
      <RevealObserver />
    </>
  );
}
