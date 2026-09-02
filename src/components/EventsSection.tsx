import { categoryMeta } from "@/lib/categories";
import { formatEventDate, formatTimeRange } from "@/lib/format";
import type { HubEvent, WeeklyEvent } from "@/lib/types";

import { MixedText } from "./MixedText";

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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

  return (
    <section id="events" className="dot-grid bg-navy text-cream">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-5xl font-black tracking-tight text-amber-bright sm:text-6xl">
          <MixedText text="Coming up *at the Hub*" />
        </h2>

        {events.length === 0 ? (
          <p className="mt-8 max-w-xl text-lg text-cream/80">
            The next calendar drops soon — follow along on{" "}
            {instagramUrl ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-amber-bright underline underline-offset-4"
              >
                Instagram
              </a>
            ) : (
              "Instagram"
            )}{" "}
            for the latest.
          </p>
        ) : (
          <ul className="mt-10 divide-y divide-cream/10">
            {events.map((event) => {
              const { weekday, monthDay } = formatEventDate(event.start);
              const meta = categoryMeta(event.category);
              return (
                <li
                  key={event._id}
                  className="flex flex-col gap-3 py-6 sm:flex-row sm:items-baseline sm:gap-8"
                >
                  <div className="w-28 shrink-0">
                    <div className="text-sm font-semibold uppercase tracking-widest text-cream/60">
                      {weekday}
                    </div>
                    <div className="font-display text-3xl font-extrabold text-cream">
                      {monthDay}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-xl font-bold text-cream">
                        {event.link ? (
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-amber/60 underline-offset-4 hover:decoration-amber-bright"
                          >
                            {event.title}
                          </a>
                        ) : (
                          event.title
                        )}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.chipClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-amber-bright">
                      {formatTimeRange(event.start, event.endTime)}
                    </div>
                    {event.description ? (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/75">
                        {event.description}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {sortedWeekly.length > 0 ? (
          <div className="mt-14">
            <h3 className="font-display text-2xl font-extrabold text-cream">
              Every week
            </h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedWeekly.map((weekly) => (
                <div
                  key={weekly._id}
                  className="rounded-xl border border-cream/15 bg-navy-deep/60 p-5"
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-amber-bright">
                    {weekly.dayOfWeek}s · {weekly.time}
                  </div>
                  <div className="mt-1.5 font-display text-lg font-bold text-cream">
                    {weekly.title}
                  </div>
                  {weekly.description ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-cream/70">
                      {weekly.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
