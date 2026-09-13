import type { CSSProperties } from "react";

import { DEFAULT_COPY } from "@/lib/copy";
import type { EditScope } from "@/lib/edit-scope";
import type { OfferingsBlock } from "@/lib/sections";

import { Editable } from "./Editable";

const CARD_WASHES = ["bg-butter", "bg-mist", "bg-mint"];

export function OfferingsSection({
  block,
  scope,
  id,
}: {
  block: OfferingsBlock;
  scope: EditScope;
  id?: string;
}) {
  const cards = block.cards ?? [];
  if (cards.length === 0) return null;
  return (
    <section id={id} className="mx-auto max-w-6xl px-5 sm:px-10 pb-20">
      <h2
        data-reveal
        className="font-display text-5xl uppercase text-navy sm:text-6xl"
      >
        <Editable
          value={block.heading ?? DEFAULT_COPY.offeringsHeading}
          scope={scope}
          field="heading"
          label="Offerings heading"
        />
      </h2>
      <div data-reveal-group className="mt-10 grid gap-5 md:grid-cols-3">
        {cards.map((card, i) => {
          const item = card._key
            ? `cards[_key=="${card._key}"]`
            : `cards[${i}]`;
          return (
            <div
              key={card._key ?? card.title}
              className={`rounded-2xl p-7 ${CARD_WASHES[i % CARD_WASHES.length]}`}
              style={{ "--rd": `${i * 80}ms` } as CSSProperties}
            >
              <h3 className="font-display text-2xl text-navy-deep">
                <Editable
                  value={card.title}
                  scope={scope}
                  field={`${item}.title`}
                  label="Card title"
                />
              </h3>
              <p className="mt-3 leading-relaxed text-navy-deep/80">
                <Editable
                  value={card.description}
                  scope={scope}
                  field={`${item}.description`}
                  label="Card description"
                  multiline
                />
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
