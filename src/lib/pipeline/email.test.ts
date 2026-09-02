import assert from "node:assert/strict";
import { test } from "node:test";

import { renderApprovalEmail } from "./email.ts";

const events = [
  {
    title: "Chris Campbell <live>",
    start: "2026-09-04T17:00:00-04:00",
    endTime: "2026-09-04T19:00:00-04:00",
    category: "music" as const,
  },
  {
    title: "Music Bingo",
    start: "2026-09-10T18:00:00-04:00",
    category: "games" as const,
  },
];

test("renders every event with a readable date and the two links", () => {
  const html = renderApprovalEmail(
    events,
    "https://x/approve?token=t",
    "https://x/studio",
  );
  assert.match(html, /Chris Campbell &lt;live&gt;/); // HTML-escaped
  assert.match(html, /Music Bingo/);
  assert.match(html, /Fri, Sep 4/);
  assert.match(html, /https:\/\/x\/approve\?token=t/);
  assert.match(html, /https:\/\/x\/studio/);
  assert.match(html, /Publish all/);
});

test("escapes attribute-breaking characters in titles", () => {
  const html = renderApprovalEmail(
    [
      {
        title: `"><img src=x>`,
        start: "2026-09-10T18:00:00-04:00",
        category: "music" as const,
      },
    ],
    "https://x/a",
    "https://x/s",
  );
  assert.doesNotMatch(html, /<img src=x>/);
});
