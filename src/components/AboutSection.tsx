import Image from "next/image";
import { PortableText } from "next-sanity";
import type { CSSProperties } from "react";

import type { SiteSettings } from "@/lib/types";
import { urlFor } from "@/sanity/image";

// Pinned gallery-shoot asset; GALLERY_QUERY excludes it so it only appears here.
const OWNERS_IMAGE =
  "image-fc66f7f4d741bb78af4b98b31f4514f36047adc9-2048x2560-jpg";

export function AboutSection({ settings }: { settings: SiteSettings }) {
  return (
    <section id="about" className="mx-auto max-w-6xl px-5 sm:px-10 pb-24">
      <div
        data-reveal-group
        className="grid items-start gap-12 md:grid-cols-[3fr_2fr]"
      >
        <div>
          <h2 className="font-display text-5xl uppercase text-navy sm:text-6xl">
            {settings.aboutHeading ?? "About the Hub"}
          </h2>
          {settings.aboutBody ? (
            <div className="prose-p:leading-relaxed mt-6 max-w-2xl space-y-4 text-lg text-ink/85">
              <PortableText value={settings.aboutBody} />
            </div>
          ) : null}
          {settings.credentials?.length ? (
            <ul className="mt-7 flex flex-wrap gap-2.5">
              {settings.credentials.map((credential) => (
                <li
                  key={credential}
                  className="rounded-full border border-amber/40 bg-butter px-4 py-1.5 text-sm font-semibold text-navy-deep"
                >
                  {credential}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div
          className="flex justify-center pt-2 md:pt-6"
          style={{ "--rd": "120ms" } as CSSProperties}
        >
          <div className="-rotate-2 drop-shadow-lg">
            <Image
              src={urlFor(OWNERS_IMAGE)
                .width(600)
                .height(750)
                .fit("crop")
                .url()}
              alt="Jason and Charlotte outside the Hub under the orange OPEN flag"
              width={600}
              height={750}
              className="h-auto w-56 rounded-2xl md:w-[300px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
