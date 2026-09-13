import type { CSSProperties } from "react";

import { DEFAULT_COPY, FEATURE_COPY } from "@/lib/copy";
import type { EditScope } from "@/lib/edit-scope";
import { editAttribute } from "@/lib/editable";
import type { OnTapBlock } from "@/lib/sections";

import { ArrowUpRight } from "./ArrowUpRight";
import { Editable } from "./Editable";

export function OnTapSection({
  block,
  scope,
  untappdUrl,
  secondaryHref,
  id = "tap",
}: {
  block: OnTapBlock;
  scope: EditScope;
  untappdUrl?: string;
  /** Anchor of the next visible Feature block on the page, if any. */
  secondaryHref?: string;
  id?: string;
}) {
  const perks = block.perks?.length ? block.perks : DEFAULT_COPY.tapPerks;

  return (
    <section id={id} className="mx-auto max-w-6xl px-5 sm:px-10 py-20">
      <div
        data-reveal-group
        className="grid items-center gap-10 md:grid-cols-2"
      >
        <div>
          <h2 className="font-display text-5xl uppercase text-navy sm:text-6xl">
            <Editable
              value={block.heading ?? DEFAULT_COPY.onTapHeading}
              scope={scope}
              field="heading"
              label="On Tap heading"
            />
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/80">
            <Editable
              value={block.blurb ?? DEFAULT_COPY.onTapBlurb}
              scope={scope}
              field="blurb"
              label="On Tap paragraph"
              multiline
            />
          </p>
          <p className="mt-3 max-w-lg text-sm text-ink/60">
            <Editable
              value={block.secondary ?? DEFAULT_COPY.onTapSecondary}
              scope={scope}
              field="secondary"
              label="On Tap second line"
              multiline
            />
            {secondaryHref ? (
              <>
                {" "}
                <a
                  href={secondaryHref}
                  className="font-semibold text-navy underline decoration-amber/60 underline-offset-4 hover:text-navy-deep"
                >
                  <Editable
                    value={
                      block.secondaryLinkLabel ??
                      FEATURE_COPY.onTapSecondaryLinkLabel
                    }
                    scope={scope}
                    field="secondaryLinkLabel"
                    label="Link after the second line"
                  />
                </a>
              </>
            ) : null}
          </p>
          {untappdUrl ? (
            <a
              href={untappdUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-display text-base tracking-wide text-cream transition-colors hover:bg-amber-bright hover:text-navy-deep"
            >
              <Editable
                value={block.cta ?? DEFAULT_COPY.onTapCta}
                scope={scope}
                field="cta"
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
            data-sanity={editAttribute(scope, "tapCount")}
            className="font-display text-[7rem] leading-none text-amber-bright"
          >
            {block.tapCount ?? 16}
          </div>
          <div className="mt-1 font-display text-xl">
            <Editable
              value={block.tapCountLabel ?? DEFAULT_COPY.tapCountLabel}
              scope={scope}
              field="tapCountLabel"
              label="Label under the tap count"
            />
          </div>
          <p className="mt-3 text-sm text-cream/70">
            <Editable
              value={block.tapCountFootnote ?? DEFAULT_COPY.tapCountFootnote}
              scope={scope}
              field="tapCountFootnote"
              label="Tap count footnote"
            />
          </p>
          {perks.length ? (
            <ul className="mt-6 space-y-2 border-t border-cream/15 pt-5 text-sm font-semibold text-cream/85">
              {perks.map((perk, i) => (
                <li key={i}>
                  <Editable
                    value={perk}
                    scope={scope}
                    field={`perks[${i}]`}
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
