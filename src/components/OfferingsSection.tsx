import type { CSSProperties } from "react";

import type { Offering } from "@/lib/types";

const CARD_WASHES = ["bg-butter", "bg-mist", "bg-mint"];

export function OfferingsSection({ offerings }: { offerings: Offering[] }) {
  if (offerings.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20">
      <h2
        data-reveal
        className="font-display text-5xl uppercase text-navy sm:text-6xl"
      >
        What we pour &amp; stock
      </h2>
      <div data-reveal-group className="mt-10 grid gap-5 md:grid-cols-3">
        {offerings.map((offering, i) => (
          <div
            key={offering.title}
            className={`rounded-2xl p-7 ${CARD_WASHES[i % CARD_WASHES.length]}`}
            style={{ "--rd": `${i * 80}ms` } as CSSProperties}
          >
            <h3 className="font-display text-2xl text-navy-deep">
              {offering.title}
            </h3>
            <p className="mt-3 leading-relaxed text-navy-deep/80">
              {offering.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
