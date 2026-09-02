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

function EventRow({ event }: { event: HubEvent }) {
  const meta = categoryMeta(event.category);
  const detail = [meta.label, formatTimeRange(event.start, event.endTime)]
    .filter(Boolean)
    .join("  |  ");
  return (
    <li className="border-b border-navy/10 py-4">
      <div className="font-condensed text-lg font-bold">
        <span className="uppercase tracking-wide text-amber">
          {flyerDate(event.start)}
        </span>
        <span className="mx-2 text-navy/40">•</span>
        <span className="text-navy">
          {event.link ? (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-amber/50 underline-offset-4 hover:decoration-amber"
            >
              {event.title}
            </a>
          ) : (
            event.title
          )}
        </span>
      </div>
      <div className="font-condensed mt-0.5 text-ink/75">{detail}</div>
      {event.description ? (
        <p className="font-condensed mt-1 max-w-xl text-sm leading-snug text-ink/60">
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
    <section id="events" className="bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-5xl uppercase text-navy sm:text-6xl">
          {monthName} events
        </h2>

        {events.length === 0 ? (
          <p className="font-condensed mt-8 max-w-xl text-lg text-ink/80">
            The next calendar drops soon — follow along on{" "}
            {instagramUrl ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber underline underline-offset-4"
              >
                Instagram
              </a>
            ) : (
              "Instagram"
            )}{" "}
            for the latest.
          </p>
        ) : (
          <div className="mt-8 grid gap-x-14 md:grid-cols-2">
            <ul>
              {events.slice(0, half).map((event) => (
                <EventRow key={event._id} event={event} />
              ))}
            </ul>
            <ul>
              {events.slice(half).map((event) => (
                <EventRow key={event._id} event={event} />
              ))}
            </ul>
          </div>
        )}

        {sortedWeekly.length > 0 ? (
          <div className="mt-12">
            <h3 className="font-display text-2xl uppercase text-navy">
              Every week
            </h3>
            <ul className="mt-2 md:max-w-xl">
              {sortedWeekly.map((weekly) => (
                <li key={weekly._id} className="border-b border-navy/10 py-4">
                  <div className="font-condensed text-lg font-bold">
                    <span className="uppercase tracking-wide text-amber">
                      Every {weekly.dayOfWeek}
                    </span>
                    <span className="mx-2 text-navy/40">•</span>
                    <span className="text-navy">{weekly.title}</span>
                  </div>
                  <div className="font-condensed mt-0.5 text-ink/75">
                    {[categoryMeta(weekly.category).label, weekly.time]
                      .filter(Boolean)
                      .join("  |  ")}
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
