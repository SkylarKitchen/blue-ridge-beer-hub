import { AboutSection } from "@/components/AboutSection";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { EventsSection } from "@/components/EventsSection";
import { GallerySection } from "@/components/GallerySection";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HoursFooter } from "@/components/HoursFooter";
import { OfferingsSection } from "@/components/OfferingsSection";
import { OnTapSection } from "@/components/OnTapSection";
import { Ridgeline } from "@/components/Ridgeline";
import { startOfTodayIso } from "@/lib/format";
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

export default async function HomePage() {
  let settings: SiteSettings = {};
  let events: HubEvent[] = [];
  let weeklyEvents: WeeklyEvent[] = [];
  let gallery: GalleryImage[] = [];

  try {
    const [settingsRes, eventsRes, weeklyRes, galleryRes] = await Promise.all([
      sanityFetch({ query: SITE_SETTINGS_QUERY }),
      sanityFetch({ query: EVENTS_QUERY, params: { from: startOfTodayIso() } }),
      sanityFetch({ query: WEEKLY_EVENTS_QUERY }),
      sanityFetch({ query: GALLERY_QUERY }),
    ]);
    settings = (settingsRes.data ?? {}) as SiteSettings;
    events = (eventsRes.data ?? []) as HubEvent[];
    weeklyEvents = (weeklyRes.data ?? []) as WeeklyEvent[];
    gallery = (galleryRes.data ?? []) as GalleryImage[];
  } catch (error) {
    // If Sanity is unreachable the site still renders its shell with defaults.
    console.error("Sanity fetch failed; rendering fallbacks", error);
  }

  return (
    <>
      <AnnouncementBanner text={settings.announcement} />
      <Header name={settings.name ?? "Blue Ridge Beer Hub"} />
      <main>
        <Hero settings={settings} />
        <div className="text-navy">
          <Ridgeline />
        </div>
        <EventsSection
          events={events}
          weeklyEvents={weeklyEvents}
          instagramUrl={settings.instagramUrl}
        />
        <div className="bg-navy text-cream">
          <Ridgeline flip />
        </div>
        <OnTapSection settings={settings} />
        <OfferingsSection offerings={settings.offerings ?? []} />
        <GallerySection images={gallery} />
        <AboutSection settings={settings} />
        <div className="text-navy">
          <Ridgeline />
        </div>
        <HoursFooter settings={settings} />
      </main>
    </>
  );
}
