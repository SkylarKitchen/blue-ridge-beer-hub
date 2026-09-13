import Image from "next/image";
import { stegaClean } from "next-sanity";
import type { CSSProperties } from "react";

import { FEATURE_COPY } from "@/lib/copy";
import type { EditScope } from "@/lib/edit-scope";
import { editAttribute } from "@/lib/editable";
import { featureLayout, formatAsOf } from "@/lib/feature";
import type { FeatureBlock, FeaturePhoto } from "@/lib/sections";
import { urlFor } from "@/sanity/image";

import { ArrowUpRight } from "./ArrowUpRight";
import { Editable } from "./Editable";

/**
 * How three photos arrange. "strip" is the spec's row of three equal crops;
 * "grid" (one tall beside two small) is kept reachable for design review
 * only — it is a component prop, never a schema field the owners see.
 */
export type TrioLayout = "strip" | "grid";

function Photo({
  photo,
  w,
  h,
  sizes,
  className,
  delay,
}: {
  photo: FeaturePhoto;
  w: number;
  h: number;
  sizes: string;
  className?: string;
  delay: number;
}) {
  if (!photo.asset) return null;
  // The fetched crop honors the owner's hotspot. Where CSS re-crops it again
  // (the strip on a phone), aim object-fit at the same spot instead of the
  // middle band, so cans framed in the top quarter stay in the picture.
  const { x = 0.5, y = 0.5 } = photo.hotspot ?? {};
  return (
    <Image
      src={urlFor(photo).width(w).height(h).fit("crop").url()}
      alt={photo.alt ?? ""}
      width={w}
      height={h}
      sizes={sizes}
      className={`w-full rounded-2xl object-cover ${className ?? ""}`}
      style={
        {
          "--rd": `${delay}ms`,
          objectPosition: `${Math.round(x * 100)}% ${Math.round(y * 100)}%`,
        } as CSSProperties
      }
    />
  );
}

/** One big photo; a staggered pair; a strip of three (or the review grid). */
function Photos({
  photos,
  trio,
}: {
  photos: FeaturePhoto[];
  trio: TrioLayout;
}) {
  const layout = featureLayout(photos.length);
  if (layout === "none") return null;
  if (layout === "one") {
    return (
      <div data-reveal-group>
        <Photo
          photo={photos[0]}
          w={960}
          h={1200}
          sizes="(min-width: 1152px) 536px, (min-width: 768px) 50vw, 100vw"
          delay={120}
        />
      </div>
    );
  }
  if (layout === "two") {
    const sizes = "(min-width: 1152px) 320px, (min-width: 768px) 30vw, 50vw";
    return (
      <div data-reveal-group className="grid grid-cols-2 gap-4">
        <Photo photo={photos[0]} w={600} h={900} sizes={sizes} delay={120} />
        <Photo
          photo={photos[1]}
          w={600}
          h={900}
          sizes={sizes}
          delay={200}
          className="mt-10"
        />
      </div>
    );
  }
  if (trio === "grid") {
    const sizes = "(min-width: 1152px) 320px, (min-width: 768px) 30vw, 50vw";
    return (
      <div data-reveal-group className="grid grid-cols-2 grid-rows-2 gap-4">
        <Photo
          photo={photos[0]}
          w={600}
          h={1240}
          sizes={sizes}
          delay={120}
          className="row-span-2 h-full"
        />
        <Photo photo={photos[1]} w={600} h={600} sizes={sizes} delay={200} />
        <Photo photo={photos[2]} w={600} h={600} sizes={sizes} delay={280} />
      </div>
    );
  }
  // The strip: three equal 2:3 crops in a row. Stacked on a phone they would
  // run three screens tall, so each is re-cropped to 4:3 there; the fetched
  // crop already honors the owner's hotspot, and object-position re-aims the
  // CSS crop at it.
  const sizes = "(min-width: 1152px) 230px, (min-width: 640px) 22vw, 100vw";
  return (
    <div data-reveal-group className="grid gap-4 sm:grid-cols-3">
      {photos.slice(0, 3).map((photo, i) => (
        <Photo
          key={photo._key ?? i}
          photo={photo}
          w={600}
          h={900}
          sizes={sizes}
          delay={120 + i * 80}
          className="aspect-[4/3] sm:aspect-auto"
        />
      ))}
    </div>
  );
}

export function FeatureSection({
  block,
  scope,
  id,
  trio = "strip",
}: {
  block: FeatureBlock;
  scope: EditScope;
  id?: string;
  /** Three-photo arrangement; see {@link TrioLayout}. */
  trio?: TrioLayout;
}) {
  const photos = block.photos ?? [];
  const items = block.listItems ?? [];
  // Dates and URLs skip stega by default, but "left"/"right" does not, so
  // a draft preview would otherwise never match.
  const photosLeft = stegaClean(block.photoSide) === "left";
  const asOf = formatAsOf(block.listAsOf);
  const ctaUrl = block.ctaUrl ? stegaClean(block.ctaUrl) : undefined;
  const ctaExternal = ctaUrl?.startsWith("http") ?? false;
  const layout = featureLayout(photos.length);

  // Two or three crops need more room than the words do (Bread Alone's
  // strip: text beside a photo column twice its width); one photo splits
  // the row evenly.
  const columns = {
    none: "md:grid-cols-2",
    one: "md:grid-cols-2",
    two: photosLeft
      ? "md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
      : "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
    // At md the words get the pair's share; 1/3 is too narrow for the
    // button until lg.
    three: photosLeft
      ? "md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      : "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
  }[layout];

  return (
    <section id={id} className="bg-butter">
      <div className="mx-auto max-w-6xl px-5 sm:px-10 py-20">
        {/* Words stay first in the DOM so a phone reads the heading before
            the photos whichever side the owners picked. */}
        <div
          data-reveal-group
          className={`grid items-center gap-10 md:gap-12 ${columns} ${
            photosLeft ? "md:[&>*:first-child]:order-2" : ""
          }`}
        >
          <div>
            {block.eyebrow ? (
              <p className="font-condensed text-sm font-bold uppercase tracking-widest text-amber">
                <Editable
                  value={block.eyebrow}
                  scope={scope}
                  field="eyebrow"
                  label="Small label"
                />
              </p>
            ) : null}
            <h2 className="mt-2 font-display text-5xl uppercase text-navy sm:text-6xl">
              <Editable
                value={block.heading ?? FEATURE_COPY.toGo.heading}
                scope={scope}
                field="heading"
                label="Feature heading"
              />
            </h2>
            {block.body ? (
              <p className="mt-5 max-w-lg whitespace-pre-line text-lg leading-relaxed text-ink/80">
                <Editable
                  value={block.body}
                  scope={scope}
                  field="body"
                  label="Feature words"
                  multiline
                />
              </p>
            ) : null}
            {items.length ? (
              <div className="mt-7 max-w-lg rounded-2xl bg-cream p-6 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-display text-xl text-navy-deep">
                    <Editable
                      value={block.listHeading ?? FEATURE_COPY.toGo.listHeading}
                      scope={scope}
                      field="listHeading"
                      label="List heading"
                    />
                  </h3>
                  {asOf ? (
                    // A date carries no stega, so the overlay needs its
                    // own pointer to make the stamp clickable.
                    <p
                      data-sanity={editAttribute(scope, "listAsOf")}
                      className="font-condensed text-xs font-bold uppercase tracking-wider text-amber"
                    >
                      {asOf}
                    </p>
                  ) : null}
                </div>
                <ul className="mt-3 space-y-1.5 text-sm font-semibold text-navy-deep/85">
                  {items.map((item, i) => (
                    <li key={i}>
                      <Editable
                        value={item}
                        scope={scope}
                        field={`listItems[${i}]`}
                        label={`List line ${i + 1}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {block.ctaLabel && ctaUrl ? (
              <a
                href={ctaUrl}
                target={ctaExternal ? "_blank" : undefined}
                rel={ctaExternal ? "noopener noreferrer" : undefined}
                className="mt-7 inline-flex items-center gap-2 rounded-full border-2 border-navy px-6 py-3 font-display text-base tracking-wide text-navy transition-colors hover:bg-navy hover:text-cream"
              >
                <Editable
                  value={block.ctaLabel}
                  scope={scope}
                  field="ctaLabel"
                  label="Button label"
                />
                <ArrowUpRight />
              </a>
            ) : null}
          </div>
          <Photos photos={photos} trio={trio} />
        </div>
      </div>
    </section>
  );
}
