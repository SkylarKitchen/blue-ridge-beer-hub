import assert from "node:assert/strict";
import { test } from "node:test";

import { STEGA } from "./__fixtures__/stega.ts";
import { categoryMeta } from "./categories.ts";
import { formatEventDate } from "./format.ts";
import { compactTime, parseTimeToMinutes } from "./hours.ts";
import { buildEventIcs } from "./ics.ts";
import { localBusinessJsonLd } from "./jsonld.ts";

// In draft-mode previews (Presentation tool), Sanity appends invisible
// stega characters to every string so the visual editor can map rendered
// text back to its field. Anything that parses or compares those strings
// must strip the encoding first. This suffix is real output from
// @vercel/stega's encoder (the same one @sanity/client uses).

// The four invisible code points @vercel/stega encodes with. Asserting they
// are absent from a whole payload is stronger than comparing field by field:
// it also catches stega in a field the assertion forgot to name.
const INVISIBLE = /[\u200b\u200c\u200d\ufeff]/;

test("parseTimeToMinutes reads a stega-encoded time", () => {
  assert.equal(parseTimeToMinutes(`12:00 PM${STEGA}`), 720);
});

test("compactTime emits no invisible or stray characters", () => {
  // ﻿ counts as \s in JS regexes, so compactTime's whitespace collapse
  // would otherwise turn stega runs into visible stray spaces.
  assert.equal(compactTime(`9:00 PM${STEGA}`), "9 PM");
});

test("categoryMeta looks up a stega-encoded category", () => {
  assert.equal(categoryMeta(`music${STEGA}`).label, "Live music");
});

test("formatEventDate parses a stega-encoded ISO date", () => {
  const { monthDay } = formatEventDate(`2026-09-04T17:00:00-04:00${STEGA}`);
  assert.equal(monthDay, "Sep 4");
});

test("localBusinessJsonLd keeps stega out of the ld+json payload", () => {
  // Stega inside a <script> is never rendered: it is pure bloat that
  // corrupts the structured data Google reads. Nothing here is clickable in
  // the visual editor, so the whole payload gets cleaned.
  const jsonLd = localBusinessJsonLd(
    {
      name: `Blue Ridge Beer Hub${STEGA}`,
      tagline: `Craft beer at the top of the hill${STEGA}`,
      addressLine1: `21 East St${STEGA}`,
      addressLine2: `Waynesville, NC 28786${STEGA}`,
      phone: `(828) 555-0142${STEGA}`,
      email: `hello@blueridgebeerhub.com${STEGA}`,
      instagramUrl: `https://instagram.com/blueridgebeerhub${STEGA}`,
      hours: [
        {
          day: "Friday",
          opens: `12:00 PM${STEGA}`,
          closes: `10:00 PM${STEGA}`,
        },
      ],
    },
    "https://blueridgebeerhub.com",
  );

  assert.doesNotMatch(JSON.stringify(jsonLd), INVISIBLE);
  assert.equal(jsonLd.name, "Blue Ridge Beer Hub");
  assert.equal(jsonLd.telephone, "(828) 555-0142");
  assert.equal(jsonLd.address.streetAddress, "21 East St");
});

test("buildEventIcs keeps stega out of the downloaded .ics file", () => {
  // A calendar entry saved from a draft preview would otherwise carry the
  // invisible characters into the guest's own calendar, forever.
  const ics = buildEventIcs(
    {
      _id: "evt-1",
      title: `Chris Campbell live${STEGA}`,
      start: "2026-09-04T17:00:00-04:00",
      endTime: "2026-09-04T19:00:00-04:00",
      // These two are joined into one DESCRIPTION line, so this also proves
      // a single string carrying two stega runs is cleaned throughout.
      description: `Live music on the patio${STEGA}`,
      link: `https://example.com/show${STEGA}`,
    },
    `Blue Ridge Beer Hub, 21 East St${STEGA}`,
  );

  assert.doesNotMatch(ics, INVISIBLE);
  assert.ok(ics.includes("SUMMARY:Chris Campbell live\r\n"));
  assert.ok(
    ics.includes(
      "DESCRIPTION:Live music on the patio\\nhttps://example.com/show\r\n",
    ),
  );
  assert.ok(
    ics.includes("LOCATION:Blue Ridge Beer Hub\\, 21 East St\r\n"),
  );
});
