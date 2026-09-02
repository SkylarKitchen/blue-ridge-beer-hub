import Image from "next/image";
import type { CSSProperties } from "react";

import type { SiteSettings } from "@/lib/types";

import { ArrowUpRight } from "./ArrowUpRight";
import { MixedHeading } from "./MixedHeading";
import { OpenStatus } from "./OpenStatus";

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    // 105px = announcement banner + sticky header; center within what's left.
    <section
      id="top"
      className="mx-auto flex max-w-6xl flex-col justify-center px-5 sm:px-10 py-14 sm:py-16 md:min-h-[calc(100svh-105px)]"
    >
      <div className="grid items-center gap-10 md:grid-cols-[3fr_2fr]">
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
          {settings.heroSubheading ? (
            <p
              className="animate-rise mt-6 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg"
              style={{ "--ad": "240ms" } as CSSProperties}
            >
              {settings.heroSubheading}
            </p>
          ) : null}
          <div
            className="animate-rise mt-8 flex flex-wrap items-center gap-4"
            style={{ "--ad": "310ms" } as CSSProperties}
          >
            {settings.untappdUrl ? (
              <a
                href={settings.untappdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 font-display text-base tracking-wide text-cream transition-colors hover:bg-navy-deep"
              >
                See what&apos;s on tap
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
        <div
          className="animate-badge-settle flex justify-center"
          style={{ "--ad": "240ms" } as CSSProperties}
        >
          <div className="rotate-3 drop-shadow-xl transition-transform hover:rotate-0">
            <Image
              src="/logo.jpg"
              alt="Blue Ridge Beer Hub badge"
              width={400}
              height={400}
              priority
              className="h-auto w-48 rounded-full sm:w-60 md:w-[400px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
