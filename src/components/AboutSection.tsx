import { PortableText } from "next-sanity";

import type { SiteSettings } from "@/lib/types";

import { LogoBadge } from "./LogoBadge";
import { MixedText } from "./MixedText";

export function AboutSection({ settings }: { settings: SiteSettings }) {
  return (
    <section id="about" className="mx-auto max-w-6xl px-5 pb-24">
      <div className="grid items-start gap-12 md:grid-cols-[3fr_2fr]">
        <div>
          <h2 className="font-display text-5xl font-black tracking-tight text-navy sm:text-6xl">
            <MixedText text={settings.aboutHeading ?? "About *the Hub*"} />
          </h2>
          {settings.aboutBody ? (
            <div className="prose-p:leading-relaxed mt-6 max-w-2xl space-y-4 text-lg text-ink/85">
              <PortableText value={settings.aboutBody} />
            </div>
          ) : null}
        </div>
        <div className="hidden justify-center pt-6 md:flex">
          <div className="-rotate-2">
            <LogoBadge size={230} />
          </div>
        </div>
      </div>
    </section>
  );
}
