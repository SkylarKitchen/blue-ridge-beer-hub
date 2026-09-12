import Image from "next/image";
import { PortableText } from "next-sanity";
import type { CSSProperties } from "react";

import { DEFAULT_COPY } from "@/lib/copy";
import { simpleBlockText } from "@/lib/editable";
import type { SiteSettings } from "@/lib/types";
import { urlFor } from "@/sanity/image";

import { Editable } from "./Editable";

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
            <Editable
              value={settings.aboutHeading ?? DEFAULT_COPY.aboutHeading}
              path="aboutHeading"
              label="About heading"
            />
          </h2>
          {settings.aboutBody ? (
            <div className="prose-p:leading-relaxed mt-6 max-w-2xl space-y-4 text-lg text-ink/85">
              {settings.aboutBody.map((block, i) => {
                // Plain paragraphs get typed on the page; anything carrying
                // formatting keeps the real serializer.
                const text = simpleBlockText(block);
                const key = block._key ?? `block-${i}`;
                return text === null ? (
                  <PortableText key={key} value={[block]} />
                ) : (
                  <p key={key}>
                    <Editable value={text} label="About paragraph" multiline />
                  </p>
                );
              })}
            </div>
          ) : null}
          {settings.credentials?.length ? (
            <ul className="mt-7 flex flex-wrap gap-2.5">
              {settings.credentials.map((credential, i) => (
                <li
                  key={i}
                  className="rounded-full border border-amber/40 bg-butter px-4 py-1.5 text-sm font-semibold text-navy-deep"
                >
                  <Editable
                    value={credential}
                    path={`credentials[${i}]`}
                    label={`Trust badge ${i + 1}`}
                  />
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
