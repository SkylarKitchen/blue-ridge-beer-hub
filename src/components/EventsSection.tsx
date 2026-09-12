import type { CSSProperties } from "react";

import { categoryMeta } from "@/lib/categories";
import { DEFAULT_COPY } from "@/lib/copy";
import { formatTimeRange } from "@/lib/format";
import type { HubEvent, WeeklyEvent } from "@/lib/types";

import { AddToCalendar } from "./AddToCalendar";
import { Editable } from "./Editable";

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

/** "4 (FRI)" — day + weekday; the month lives in the group subhead. */
function flyerDay(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-US", { day: "numeric", timeZone: TZ });
  const weekday = d
    .toLocaleDateString("en-US", { weekday: "short", timeZone: TZ })
    .toUpperCase();
  return `${day} (${weekday})`;
}

function monthLabel(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", { month: "long", timeZone: TZ })
    .toUpperCase();
}

function monthKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: TZ,
  });
}

function EventRow({
  event,
  index,
  location,
}: {
  event: HubEvent;
  index: number;
  location: string;
}) {
  const meta = categoryMeta(event.category);
  return (
    <li
      className="border-b border-cream/15 py-4"
      style={{ "--rd": `${Math.min(index, 5) * 70}ms` } as CSSProperties}
    >
      <div className="font-condensed text-lg font-bold">
        <span className="uppercase tracking-wide text-amber-bright">
          {flyerDay(event.start)}
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
              <Editable
                value={event.title}
                documentId={event._id}
                documentType="event"
                path="title"
                label="Event title"
              />
            </a>
          ) : (
            <Editable
              value={event.title}
              documentId={event._id}
              documentType="event"
              path="title"
              label="Event title"
            />
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
        <AddToCalendar event={event} location={location} />
      </div>
      {event.description ? (
        <p className="font-condensed mt-1 max-w-xl text-sm leading-snug text-cream/60">
          <Editable
            value={event.description}
            documentId={event._id}
            documentType="event"
            path="description"
            label="Event description"
            multiline
          />
        </p>
      ) : null}
    </li>
  );
}

interface MonthGroup {
  key: string;
  label: string;
  events: HubEvent[];
}

export function EventsSection({
  events,
  weeklyEvents,
  instagramUrl,
  location,
  heading,
  weeklyHeading,
}: {
  events: HubEvent[];
  weeklyEvents: WeeklyEvent[];
  instagramUrl?: string;
  location: string;
  heading?: string;
  weeklyHeading?: string;
}) {
  const sortedWeekly = [...weeklyEvents].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  );

  // Sanity delivers events sorted, but the fallback array isn't — sort here
  // so month grouping never splits a month into two runs.
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
  const groups: MonthGroup[] = [];
  for (const event of sorted) {
    const key = monthKey(event.start);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.events.push(event);
    } else {
      groups.push({ key, label: monthLabel(event.start), events: [event] });
    }
  }

  return (
    <section id="events" className="bg-navy">
      <div className="mx-auto max-w-6xl px-5 sm:px-10 py-20">
        <h2
          data-reveal
          className="font-display text-5xl uppercase text-cream sm:text-6xl"
        >
          <Editable
            value={heading ?? DEFAULT_COPY.eventsHeading}
            path="eventsHeading"
            label="Events heading"
          />
        </h2>

        {groups.length === 0 ? (
          <p className="font-condensed mt-8 max-w-xl text-lg text-cream/80">
            The next calendar drops soon. Follow along on{" "}
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
          groups.map((group) => {
            const half = Math.ceil(group.events.length / 2);
            return (
              <div key={group.key} className="mt-10">
                <h3
                  data-reveal
                  className="font-display text-2xl uppercase tracking-wide text-amber-bright"
                >
                  {group.label}
                </h3>
                <div className="mt-2 grid md:grid-cols-2">
                  <ul data-reveal-group className="md:pr-14">
                    {group.events.slice(0, half).map((event, i) => (
                      <EventRow
                        key={event._id}
                        event={event}
                        index={i}
                        location={location}
                      />
                    ))}
                  </ul>
                  <ul
                    data-reveal-group
                    className="md:border-l md:border-cream/15 md:pl-14"
                  >
                    {group.events.slice(half).map((event, i) => (
                      <EventRow
                        key={event._id}
                        event={event}
                        index={i}
                        location={location}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            );
          })
        )}

        {sortedWeekly.length > 0 ? (
          <div className="mt-12">
            <h3
              data-reveal
              className="font-display text-2xl uppercase text-cream"
            >
              <Editable
                value={weeklyHeading ?? DEFAULT_COPY.weeklyHeading}
                path="weeklyHeading"
                label="Weekly events heading"
              />
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
                    <span className="text-cream">
                      <Editable
                        value={weekly.title}
                        documentId={weekly._id}
                        documentType="weeklyEvent"
                        path="title"
                        label="Weekly event title"
                      />
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={`${categoryMeta(weekly.category).chipClass} rounded-full px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider`}
                    >
                      {categoryMeta(weekly.category).label}
                    </span>
                    <span className="font-condensed text-sm text-cream/75">
                      <Editable
                        value={weekly.time}
                        documentId={weekly._id}
                        documentType="weeklyEvent"
                        path="time"
                        label="Weekly event time"
                      />
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
