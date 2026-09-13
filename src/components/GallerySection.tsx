import Image from "next/image";
import type { CSSProperties } from "react";

import { DEFAULT_COPY } from "@/lib/copy";
import type { EditScope } from "@/lib/edit-scope";
import type { GalleryBlock } from "@/lib/sections";
import type { GalleryImage } from "@/lib/types";
import { urlFor } from "@/sanity/image";

import { Editable } from "./Editable";

export function GallerySection({
  block,
  scope,
  images,
  id,
}: {
  block: GalleryBlock;
  scope: EditScope;
  images: GalleryImage[];
  id?: string;
}) {
  if (images.length === 0) return null;
  return (
    <section id={id} className="mx-auto max-w-6xl px-5 sm:px-10 pb-20">
      <h2
        data-reveal
        className="font-display text-5xl uppercase text-navy sm:text-6xl"
      >
        <Editable
          value={block.heading ?? DEFAULT_COPY.galleryHeading}
          scope={scope}
          field="heading"
          label="Photo section heading"
        />
      </h2>
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
        {images.map((item, i) => (
          <figure
            key={item._id}
            data-reveal
            // Stagger by column so each row cascades left-to-right.
            style={{ "--rd": `${(i % 3) * 80}ms` } as CSSProperties}
          >
            <Image
              src={urlFor(item.image).width(800).height(600).fit("crop").url()}
              alt={item.alt}
              width={800}
              height={600}
              sizes="(min-width: 1152px) 360px, (min-width: 768px) 33vw, 50vw"
              className="rounded-xl object-cover"
            />
            {item.caption ? (
              <figcaption className="mt-2 text-sm text-ink/60">
                <Editable
                  value={item.caption}
                  documentId={item._id}
                  documentType="galleryImage"
                  path="caption"
                  label="Photo caption"
                />
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
