import Image from "next/image";

import type { SiteSettings } from "@/lib/types";

import { MixedHeading } from "./MixedText";

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section id="top" className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:pt-20">
      <div className="grid items-center gap-10 md:grid-cols-[3fr_2fr]">
        <div>
          <h1 className="font-display text-6xl uppercase leading-[0.95] text-navy sm:text-7xl lg:text-8xl">
            <MixedHeading
              text={
                settings.heroHeading ??
                "Your friendly\n*neighborhood*\nbeer hub"
              }
            />
          </h1>
          {settings.heroSubheading ? (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80">
              {settings.heroSubheading}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {settings.untappdUrl ? (
              <a
                href={settings.untappdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-navy px-6 py-3 font-display text-base tracking-wide text-cream transition-colors hover:bg-navy-deep"
              >
                See what&apos;s on tap&nbsp;↗
              </a>
            ) : null}
            <a
              href="#events"
              className="rounded-full border-2 border-navy px-6 py-3 font-display text-base tracking-wide text-navy transition-colors hover:bg-navy hover:text-cream"
            >
              This month&apos;s events
            </a>
          </div>
          <p className="mt-5 text-sm text-ink/60">
            *plus wine, mead, cider, and coolers full of carryout
          </p>
        </div>
        <div className="hidden justify-center md:flex">
          <div className="rotate-3 drop-shadow-xl transition-transform hover:rotate-0">
            <Image
              src="/logo.jpg"
              alt="Blue Ridge Beer Hub badge"
              width={300}
              height={300}
              priority
              className="rounded-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
