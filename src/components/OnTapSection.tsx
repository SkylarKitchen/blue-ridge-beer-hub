import type { CSSProperties } from "react";

import { DEFAULT_COPY } from "@/lib/copy";
import { siteSettingsField } from "@/lib/editable";
import type { SiteSettings } from "@/lib/types";

import { ArrowUpRight } from "./ArrowUpRight";
import { Editable } from "./Editable";

export function OnTapSection({ settings }: { settings: SiteSettings }) {
  const perks = settings.tapPerks?.length
    ? settings.tapPerks
    : DEFAULT_COPY.tapPerks;

  return (
    <section id="tap" className="mx-auto max-w-6xl px-5 sm:px-10 py-20">
      <div
        data-reveal-group
        className="grid items-center gap-10 md:grid-cols-2"
      >
        <div>
          <h2 className="font-display text-5xl uppercase text-navy sm:text-6xl">
            <Editable
              value={settings.onTapHeading ?? DEFAULT_COPY.onTapHeading}
              path="onTapHeading"
              label="On Tap heading"
            />
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/80">
            <Editable
              value={settings.onTapBlurb ?? DEFAULT_COPY.onTapBlurb}
              path="onTapBlurb"
              label="On Tap paragraph"
              multiline
            />
          </p>
          <p className="mt-3 max-w-lg text-sm text-ink/60">
            <Editable
              value={settings.onTapSecondary ?? DEFAULT_COPY.onTapSecondary}
              path="onTapSecondary"
              label="On Tap second line"
              multiline
            />
          </p>
          {settings.untappdUrl ? (
            <a
              href={settings.untappdUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-display text-base tracking-wide text-cream transition-colors hover:bg-amber-bright hover:text-navy-deep"
            >
              <Editable
                value={settings.onTapCta ?? DEFAULT_COPY.onTapCta}
                path="onTapCta"
                label="Tap list button label"
              />
              <ArrowUpRight />
            </a>
          ) : null}
        </div>
        <div
          className="rounded-2xl bg-navy p-8 text-cream shadow-xl sm:p-10"
          style={{ "--rd": "120ms" } as CSSProperties}
        >
          {/* A number carries no stega, so the overlay needs a pointer of
              its own to make the tap count clickable. */}
          <div
            data-sanity={siteSettingsField("tapCount")}
            className="font-display text-[7rem] leading-none text-amber-bright"
          >
            {settings.tapCount ?? 16}
          </div>
          <div className="mt-1 font-display text-xl">
            <Editable
              value={settings.tapCountLabel ?? DEFAULT_COPY.tapCountLabel}
              path="tapCountLabel"
              label="Label under the tap count"
            />
          </div>
          <p className="mt-3 text-sm text-cream/70">
            <Editable
              value={settings.tapCountFootnote ?? DEFAULT_COPY.tapCountFootnote}
              path="tapCountFootnote"
              label="Tap count footnote"
            />
          </p>
          {perks.length ? (
            <ul className="mt-6 space-y-2 border-t border-cream/15 pt-5 text-sm font-semibold text-cream/85">
              {perks.map((perk, i) => (
                <li key={i}>
                  <Editable
                    value={perk}
                    path={`tapPerks[${i}]`}
                    label={`Tap card line ${i + 1}`}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
