import type { SiteSettings } from "@/lib/types";

import { MixedText } from "./MixedText";

export function OnTapSection({ settings }: { settings: SiteSettings }) {
  return (
    <section id="tap" className="mx-auto max-w-6xl px-5 py-20">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-5xl uppercase text-navy sm:text-6xl">
            <MixedText text="On tap *right now*" />
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/80">
            {settings.onTapBlurb ??
              "Sixteen rotating taps of serious craft — stouts, sours, IPAs, and the occasional white whale. The list lives on Untappd and changes almost daily."}
          </p>
          {settings.untappdUrl ? (
            <a
              href={settings.untappdUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-block rounded-full bg-amber px-6 py-3 font-display text-base tracking-wide text-navy-deep transition-colors hover:bg-amber-bright"
            >
              Open the live tap list&nbsp;↗
            </a>
          ) : null}
        </div>
        <div className="rounded-2xl bg-navy p-8 text-cream shadow-xl sm:p-10">
          <div className="font-display text-[7rem] leading-none text-amber-bright">
            16
          </div>
          <div className="mt-1 font-display text-xl">
            taps pouring right now*
          </div>
          <p className="mt-3 text-sm text-cream/70">
            *give or take — the live list knows best
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
