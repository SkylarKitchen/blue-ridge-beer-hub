import type { CSSProperties } from "react";

import { DEFAULT_COPY } from "@/lib/copy";
import type { Offering } from "@/lib/types";

import { Editable } from "./Editable";

const CARD_WASHES = ["bg-butter", "bg-mist", "bg-mint"];

export function OfferingsSection({
  offerings,
  heading,
}: {
  offerings: Offering[];
  heading?: string;
}) {
  if (offerings.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-10 pb-20">
      <h2
        data-reveal
        className="font-display text-5xl uppercase text-navy sm:text-6xl"
      >
        <Editable
          value={heading ?? DEFAULT_COPY.offeringsHeading}
          path="offeringsHeading"
          label="Offerings heading"
        />
      </h2>
      <div data-reveal-group className="mt-10 grid gap-5 md:grid-cols-3">
        {offerings.map((offering, i) => (
          <div
            key={offering._key ?? offering.title}
            className={`rounded-2xl p-7 ${CARD_WASHES[i % CARD_WASHES.length]}`}
            style={{ "--rd": `${i * 80}ms` } as CSSProperties}
          >
            <h3 className="font-display text-2xl text-navy-deep">
              <Editable value={offering.title} label="Card title" />
            </h3>
            <p className="mt-3 leading-relaxed text-navy-deep/80">
              <Editable
                value={offering.description}
                label="Card description"
                multiline
              />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
