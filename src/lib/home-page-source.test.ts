import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// The homepage route is a React Server Component with JSX, so it can't be
// imported under `node --test`. These checks read its source instead.
//
// Why they exist: origin/main (PR #4) shipped hourly ISR, the fallback
// events filter, and the skip link, none of which the page-builder plan's
// `page.tsx` block knew about. Pasting that block over the file reverted
// them silently — no conflict, nothing to review — because this branch never
// carried those lines. Nothing else in the suite would have noticed.
const source = readFileSync(
  new URL("../app/(site)/page.tsx", import.meta.url),
  "utf8",
);

test("homepage revalidates hourly", () => {
  assert.match(
    source,
    /export const revalidate = 3600;/,
    "page.tsx lost `export const revalidate = 3600`. Without hourly ISR the " +
      "'upcoming events' floor is only recomputed when content changes, so a " +
      "quiet week leaves last Saturday's show on the page.",
  );
});

test("homepage hoists the start-of-today floor", () => {
  assert.match(
    source,
    /const from = startOfTodayIso\(\);/,
    "page.tsx lost `const from = startOfTodayIso()`. The floor must be " +
      "computed once and shared by the Sanity events query and the fallback " +
      "filter, or the two paths disagree on what counts as upcoming.",
  );
  assert.match(
    source,
    /params: \{ from \}/,
    "EVENTS_QUERY no longer takes the hoisted `from`. Recomputing it inline " +
      "lets the query and the fallback filter drift apart.",
  );
});

test("homepage filters the baked-in events when Sanity is unreachable", () => {
  assert.match(
    source,
    /import \{ upcomingEvents \} from "@\/lib\/events";/,
    "page.tsx no longer imports `upcomingEvents`. The fallback path needs it " +
      "to drop past events from FALLBACK_EVENTS.",
  );
  assert.match(
    source,
    /events = upcomingEvents\(FALLBACK_EVENTS, from\);/,
    "The fallback path assigns FALLBACK_EVENTS unfiltered. When Sanity is " +
      "down the page would list events that already happened.",
  );
});

test("homepage keeps the skip-to-content link", () => {
  assert.match(
    source,
    /Skip to content/,
    "page.tsx lost the 'Skip to content' link. Keyboard and screen-reader " +
      "users need it to bypass the header on every visit.",
  );
});

test("homepage's <main> carries the skip link's target id", () => {
  assert.match(
    source,
    /<main id="main">/,
    'page.tsx renders a bare <main> instead of <main id="main">. The skip ' +
      "link points at #main, so without the id it focuses nothing.",
  );
});
