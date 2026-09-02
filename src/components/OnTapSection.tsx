import type { CSSProperties } from "react";

import type { SiteSettings } from "@/lib/types";

import { ArrowUpRight } from "./ArrowUpRight";

export function OnTapSection({ settings }: { settings: SiteSettings }) {
  return (
    <section id="tap" className="mx-auto max-w-6xl px-5 py-20">
      <div
        data-reveal-group
        className="grid items-center gap-10 md:grid-cols-2"
      >
        <div>
          <h2 className="font-display text-5xl uppercase text-navy sm:text-6xl">
            On tap right now
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/80">
            {settings.onTapBlurb ??
              "Sixteen taps that change almost daily: stouts, sours, IPAs, and the occasional white whale. The full list lives on Untappd."}
          </p>
          <p className="mt-3 max-w-lg text-sm text-ink/60">
            Not a beer person? Wine, mead, and cider pour here too, and the
            coolers are stocked for carryout.
          </p>
          {settings.untappdUrl ? (
            <a
              href={settings.untappdUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-display text-base tracking-wide text-cream transition-colors hover:bg-amber-bright hover:text-navy-deep"
            >
              Open the live tap list
              <ArrowUpRight />
            </a>
          ) : null}
        </div>
        <div
          className="rounded-2xl bg-navy p-8 text-cream shadow-xl sm:p-10"
          style={{ "--rd": "120ms" } as CSSProperties}
        >
          <div className="font-display text-[7rem] leading-none text-amber-bright">
            {settings.tapCount ?? 16}
          </div>
          <div className="mt-1 font-display text-xl">
            taps pouring right now*
          </div>
          <p className="mt-3 text-sm text-cream/70">
            *give or take. The live list knows best.
          </p>
          <ul className="mt-6 space-y-2 border-t border-cream/15 pt-5 text-sm font-semibold text-cream/85">
            <li>Growlers filled to go</li>
            <li>Build-your-own six-packs from the coolers</li>
            <li>Pour sizes from a 4&nbsp;oz taster on up</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
