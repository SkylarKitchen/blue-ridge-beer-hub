import type { CSSProperties } from "react";

import { categoryMeta } from "@/lib/categories";
import { formatTimeRange } from "@/lib/format";
import type { HubEvent, WeeklyEvent } from "@/lib/types";

const TZ = "America/New_York";
const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** "SEPT 4 (FRI)" — the flyer's date format. */
function flyerDate(iso: string): string {
  const d = new Date(iso);
  const month = d
    .toLocaleDateString("en-US", { month: "short", timeZone: TZ })
    .toUpperCase()
    .replace("SEP", "SEPT");
  const day = d.toLocaleDateString("en-US", { day: "numeric", timeZone: TZ });
  const weekday = d
    .toLocaleDateString("en-US", { weekday: "short", timeZone: TZ })
    .toUpperCase();
  return `${month} ${day} (${weekday})`;
}

function EventRow({ event, index }: { event: HubEvent; index: number }) {
  const meta = categoryMeta(event.category);
  return (
    <li
      className="border-b border-cream/15 py-4"
      style={{ "--rd": `${Math.min(index, 5) * 70}ms` } as CSSProperties}
    >
      <div className="font-condensed text-lg font-bold">
        <span className="uppercase tracking-wide text-amber-bright">
          {flyerDate(event.start)}
        </span>
        <span className="mx-2 text-cream/40">•</span>
        <span className="text-cream">
          {event.link ? (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-amber-bright/50 underline-offset-4 hover:decoration-amber-bright"
            >
              {event.title}
            </a>
          ) : (
            event.title
          )}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <span
          className={`${meta.chipClass} rounded-full px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider`}
        >
          {meta.label}
        </span>
        <span className="font-condensed text-sm text-cream/75">
          {formatTimeRange(event.start, event.endTime)}
        </span>
      </div>
      {event.description ? (
        <p className="font-condensed mt-1 max-w-xl text-sm leading-snug text-cream/60">
          {event.description}
        </p>
      ) : null}
    </li>
  );
}

export function EventsSection({
  events,
  weeklyEvents,
  instagramUrl,
}: {
  events: HubEvent[];
  weeklyEvents: WeeklyEvent[];
  instagramUrl?: string;
}) {
  const sortedWeekly = [...weeklyEvents].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  );
  const monthName = new Date()
    .toLocaleDateString("en-US", { month: "long", timeZone: TZ })
    .toUpperCase();
  const half = Math.ceil(events.length / 2);

  return (
    <section id="events" className="bg-navy">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h2
          data-reveal
          className="font-display text-5xl uppercase text-cream sm:text-6xl"
        >
          {monthName} events
        </h2>

        {events.length === 0 ? (
          <p className="font-condensed mt-8 max-w-xl text-lg text-cream/80">
            The next calendar drops soon — follow along on{" "}
            {instagramUrl ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber-bright underline underline-offset-4"
              >
                Instagram
              </a>
            ) : (
              "Instagram"
            )}{" "}
            for the latest.
          </p>
        ) : (
          <div className="mt-8 grid md:grid-cols-2">
            <ul data-reveal-group className="md:pr-14">
              {events.slice(0, half).map((event, i) => (
                <EventRow key={event._id} event={event} index={i} />
              ))}
            </ul>
            <ul
              data-reveal-group
              className="md:border-l md:border-cream/15 md:pl-14"
            >
              {events.slice(half).map((event, i) => (
                <EventRow key={event._id} event={event} index={i} />
              ))}
            </ul>
          </div>
        )}

        {sortedWeekly.length > 0 ? (
          <div className="mt-12">
            <h3
              data-reveal
              className="font-display text-2xl uppercase text-cream"
            >
              Every week
            </h3>
            <ul data-reveal-group className="mt-2 md:max-w-xl">
              {sortedWeekly.map((weekly, i) => (
                <li
                  key={weekly._id}
                  className="border-b border-cream/15 py-4"
                  style={
                    { "--rd": `${Math.min(i, 5) * 70}ms` } as CSSProperties
                  }
                >
                  <div className="font-condensed text-lg font-bold">
                    <span className="uppercase tracking-wide text-amber-bright">
                      Every {weekly.dayOfWeek}
                    </span>
                    <span className="mx-2 text-cream/40">•</span>
                    <span className="text-cream">{weekly.title}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={`${categoryMeta(weekly.category).chipClass} rounded-full px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider`}
                    >
                      {categoryMeta(weekly.category).label}
                    </span>
                    <span className="font-condensed text-sm text-cream/75">
                      {weekly.time}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
