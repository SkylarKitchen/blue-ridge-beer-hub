import Image from "next/image";
import type { CSSProperties } from "react";

import type { SiteSettings } from "@/lib/types";
import { urlFor } from "@/sanity/image";

import { ArrowUpRight } from "./ArrowUpRight";
import { MixedHeading } from "./MixedHeading";
import { OpenStatus } from "./OpenStatus";

// Pinned gallery-shoot asset; GALLERY_QUERY excludes it so it only appears here.
const TAP_HANDLES_IMAGE =
  "image-600687a3a1747959048b8eb3b14f917ad2e3073b-2560x1707-jpg";

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section
      id="top"
      className="mx-auto max-w-6xl px-5 sm:px-10 py-14 sm:py-16"
    >
      <div className="animate-rise relative mb-10 h-44 overflow-hidden rounded-2xl sm:mb-12 sm:h-[clamp(200px,26vh,320px)]">
        <Image
          src={urlFor(TAP_HANDLES_IMAGE)
            .width(1840)
            .height(900)
            .fit("crop")
            .url()}
          alt="Numbered tap handles branded with the Blue Ridge Beer Hub hop logo"
          fill
          preload
          sizes="(min-width: 1152px) 1072px, 100vw"
          className="object-cover object-[50%_45%]"
        />
      </div>
      {/* items-end locks the copy/CTA column to the headline's baseline. */}
      <div className="grid items-end gap-8 md:grid-cols-[3fr_2fr] md:gap-10">
        <div>
          {/* min-height reserves the chip's spot — it mounts client-side. */}
          <div className="mb-5 min-h-5">
            <OpenStatus hours={settings.hours} />
          </div>
          <h1 className="font-display text-5xl uppercase leading-[0.95] text-navy sm:text-7xl lg:text-8xl">
            <MixedHeading
              stagger
              text={
                settings.heroHeading ?? "Your friendly\nneighborhood\nbeer hub"
              }
            />
          </h1>
        </div>
        <div className="md:pb-2">
          {settings.heroSubheading ? (
            <p
              className="animate-rise max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg"
              style={{ "--ad": "240ms" } as CSSProperties}
            >
              {settings.heroSubheading}
            </p>
          ) : null}
          <div
            className="animate-rise mt-7 flex flex-wrap items-center gap-4"
            style={{ "--ad": "310ms" } as CSSProperties}
          >
            {settings.untappdUrl ? (
              <a
                href={settings.untappdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 font-display text-base tracking-wide text-cream transition-colors hover:bg-navy-deep"
              >
                See what’s on tap
                <ArrowUpRight />
              </a>
            ) : null}
            <a
              href="#events"
              className="hidden rounded-full border-2 border-navy px-6 py-3 font-display text-base tracking-wide text-navy transition-colors hover:bg-navy hover:text-cream sm:inline-block"
            >
              Upcoming events
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
