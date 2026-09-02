# Flyer-to-Site Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Daily cron reads new Facebook Page posts, Claude extracts events from flyer images into Sanity drafts, owners get an email with a magic publish link.

**Architecture:** Pure logic modules (`token`, `extract`, `facebook`, `dedupe`, `email`) are node-testable with zero app imports; IO modules (`claude`, `state`, `drafts`, `serverClient`) are thin and only imported by the two route handlers (`/api/cron/ingest-flyer`, `/api/pipeline/approve`). Sanity is the only durable store (drafts + a hidden `pipelineState` singleton).

**Tech Stack:** Next.js 16 App Router route handlers (Web `Request`/`Response`), Sanity via existing `next-sanity` client, `@anthropic-ai/sdk` + `zod` (the only new deps), Resend via plain `fetch`, `node:test` with Node's native TS type-stripping (Node 25 on dev, Vercel runtime ≥ 22).

**Spec:** `docs/superpowers/specs/2026-09-02-flyer-pipeline-design.md`

## Global Constraints

- Claude model: `claude-opus-5`, non-streaming, `max_tokens: 16000`, no `thinking` param (adaptive is the default), structured output via `client.messages.parse` + `zodOutputFormat`. (Supersedes the spec's `claude-sonnet-5` note, per current Claude-API guidance: default to Opus 5.)
- New runtime dependencies: `@anthropic-ai/sdk` and `zod` only. Resend is called with plain `fetch` — do not install its SDK.
- Timezone for all date math: `America/New_York`. Categories: `music | art | games | party | community` (see `src/lib/types.ts:42`).
- **Import rules (critical for `node --test`):** test files import their module with an explicit `.ts` extension (existing pattern: `src/lib/ics.test.ts`). Modules under test may import only node builtins, `zod`, or types (`import type` is erased, so extensionless type imports are fine). App-only modules (routes, `claude.ts`, `drafts.ts`, `state.ts`, `serverClient.ts`) use `@/…` aliases and are never imported by tests.
- Env vars (all added to `.env.example` in Task 11): `FB_PAGE_ID`, `FB_PAGE_TOKEN`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `PIPELINE_SECRET`, `CRON_SECRET`, `SANITY_API_WRITE_TOKEN`, `PIPELINE_ALERT_EMAIL`, `PIPELINE_FALLBACK_EMAIL`, `PIPELINE_FROM_EMAIL`.
- Commit after every task. Run `npm test` and `npx tsc --noEmit` before each commit.

---

### Task 1: Wire up the test runner

**Files:**

- Modify: `package.json` (scripts block, lines 5-10)

**Interfaces:**

- Produces: `npm test` runs every `src/**/*.test.ts` via `node --test`. All later tasks rely on this command.

- [ ] **Step 1: Add the test script**

In `package.json`, change the scripts block to:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "node --test src"
}
```

- [ ] **Step 2: Run it and verify the existing ICS tests execute and pass**

Run: `npm test`
Expected: the tests from `src/lib/ics.test.ts` run and pass (▶ counts > 0, 0 failures). If `node --test src` discovers nothing, use `"test": "node --test \"src/**/*.test.ts\""` instead and re-run.

- [ ] **Step 3: Baseline typecheck**

Run: `npx tsc --noEmit`
Expected: clean. (If it errors on the existing `./ics.ts` extension import, note the tsconfig situation in the commit message and do NOT fix unrelated issues — just record the baseline.)

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "Add npm test script running node --test over src"
```

---

### Task 2: Magic-link token module

**Files:**

- Create: `src/lib/pipeline/token.ts`
- Test: `src/lib/pipeline/token.test.ts`

**Interfaces:**

- Produces:
  - `signApprovalToken(payload: ApprovalPayload, secret: string): string`
  - `verifyApprovalToken(token: string, secret: string, now?: number): ApprovalPayload | null`
  - `interface ApprovalPayload { draftIds: string[]; exp: number }` (`exp` is unix ms)
- Used by Task 9 (cron route builds the link) and Task 10 (approve route verifies it).

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/pipeline/token.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { signApprovalToken, verifyApprovalToken } from "./token.ts";

const SECRET = "test-secret";
const payload = {
  draftIds: ["drafts.abc", "drafts.def"],
  exp: Date.now() + 1000,
};

test("round-trips a valid token", () => {
  const token = signApprovalToken(payload, SECRET);
  assert.deepEqual(verifyApprovalToken(token, SECRET), payload);
});

test("rejects a tampered payload", () => {
  const token = signApprovalToken(payload, SECRET);
  const [body, sig] = token.split(".");
  const forged = Buffer.from(
    JSON.stringify({ ...payload, draftIds: ["drafts.evil"] }),
  ).toString("base64url");
  assert.equal(verifyApprovalToken(`${forged}.${sig}`, SECRET), null);
  assert.equal(verifyApprovalToken(`${body}.AAAA`, SECRET), null);
});

test("rejects the wrong secret", () => {
  const token = signApprovalToken(payload, SECRET);
  assert.equal(verifyApprovalToken(token, "other-secret"), null);
});

test("rejects an expired token", () => {
  const token = signApprovalToken({ ...payload, exp: 1000 }, SECRET);
  assert.equal(verifyApprovalToken(token, SECRET, 2000), null);
});

test("rejects garbage", () => {
  assert.equal(verifyApprovalToken("", SECRET), null);
  assert.equal(verifyApprovalToken("not-a-token", SECRET), null);
  assert.equal(verifyApprovalToken("a.b.c", SECRET), null);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot find module `./token.ts`.

- [ ] **Step 3: Implement**

```typescript
// src/lib/pipeline/token.ts
import { createHmac, timingSafeEqual } from "node:crypto";

/** Payload carried by the emailed publish link. `exp` is unix milliseconds. */
export interface ApprovalPayload {
  draftIds: string[];
  exp: number;
}

function hmac(body: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(body).digest();
}

export function signApprovalToken(
  payload: ApprovalPayload,
  secret: string,
): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body, secret).toString("base64url")}`;
}

export function verifyApprovalToken(
  token: string,
  secret: string,
  now: number = Date.now(),
): ApprovalPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = hmac(body, secret);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (
      !Array.isArray(payload.draftIds) ||
      !payload.draftIds.every((id: unknown) => typeof id === "string") ||
      typeof payload.exp !== "number" ||
      payload.exp < now
    ) {
      return null;
    }
    return { draftIds: payload.draftIds, exp: payload.exp };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run to verify pass** — `npm test`, expected all green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pipeline/token.ts src/lib/pipeline/token.test.ts
git commit -m "Add HMAC approval-token sign/verify for magic links"
```

---

### Task 3: Extraction schema + refinement rules

**Files:**

- Create: `src/lib/pipeline/extract.ts`
- Test: `src/lib/pipeline/extract.test.ts`
- Modify: `package.json` (dependency install)

**Interfaces:**

- Produces:
  - `FlyerExtractionSchema` (zod) and `type FlyerExtraction = z.infer<typeof FlyerExtractionSchema>` — the shape Claude is constrained to: `{ isEventFlyer: boolean, events: [{ title, start, end (nullable), category }] }`
  - `refineExtraction(raw: FlyerExtraction, todayStartIso: string): ExtractedEvent[]`
  - `interface ExtractedEvent { title: string; start: string; endTime?: string; category: "music"|"art"|"games"|"party"|"community" }`
- Task 8's `claude.ts` calls `refineExtraction` on the parsed model output; Task 5 dedupes `ExtractedEvent[]`.

- [ ] **Step 1: Install the two new dependencies**

Run: `npm install @anthropic-ai/sdk zod`
Expected: both land in `package.json` dependencies without errors.

- [ ] **Step 2: Write the failing tests**

```typescript
// src/lib/pipeline/extract.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { refineExtraction, type FlyerExtraction } from "./extract.ts";

const TODAY = "2026-09-02T00:00:00-04:00";

function flyer(events: FlyerExtraction["events"]): FlyerExtraction {
  return { isEventFlyer: true, events };
}

test("keeps a valid future event", () => {
  const out = refineExtraction(
    flyer([
      {
        title: "Music Bingo",
        start: "2026-09-10T18:00:00-04:00",
        end: "2026-09-10T20:00:00-04:00",
        category: "games",
      },
    ]),
    TODAY,
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "Music Bingo");
  assert.equal(out[0].endTime, "2026-09-10T20:00:00-04:00");
});

test("returns nothing for a non-flyer post", () => {
  assert.deepEqual(
    refineExtraction({ isEventFlyer: false, events: [] }, TODAY),
    [],
  );
});

test("drops past events and events today counts as future", () => {
  const out = refineExtraction(
    flyer([
      {
        title: "Old",
        start: "2026-08-30T18:00:00-04:00",
        end: null,
        category: "music",
      },
      {
        title: "Tonight",
        start: "2026-09-02T19:00:00-04:00",
        end: null,
        category: "music",
      },
    ]),
    TODAY,
  );
  assert.deepEqual(
    out.map((e) => e.title),
    ["Tonight"],
  );
});

test("drops unparseable dates and blank titles", () => {
  const out = refineExtraction(
    flyer([
      {
        title: "Bad date",
        start: "sometime friday",
        end: null,
        category: "music",
      },
      {
        title: "   ",
        start: "2026-09-10T18:00:00-04:00",
        end: null,
        category: "music",
      },
    ]),
    TODAY,
  );
  assert.deepEqual(out, []);
});

test("discards an end time that is not after the start", () => {
  const out = refineExtraction(
    flyer([
      {
        title: "Show",
        start: "2026-09-10T18:00:00-04:00",
        end: "2026-09-10T17:00:00-04:00",
        category: "music",
      },
    ]),
    TODAY,
  );
  assert.equal(out[0].endTime, undefined);
});
```

- [ ] **Step 3: Run to verify failure** — `npm test`, expected FAIL (module not found).

- [ ] **Step 4: Implement**

```typescript
// src/lib/pipeline/extract.ts
import { z } from "zod";

import type { EventCategory } from "../types";

export const CATEGORY_VALUES = [
  "music",
  "art",
  "games",
  "party",
  "community",
] as const;

/** The exact shape Claude's structured output is constrained to. */
export const FlyerExtractionSchema = z.object({
  isEventFlyer: z.boolean(),
  events: z.array(
    z.object({
      title: z.string(),
      start: z.string(),
      end: z.string().nullable(),
      category: z.enum(CATEGORY_VALUES),
    }),
  ),
});

export type FlyerExtraction = z.infer<typeof FlyerExtractionSchema>;

export interface ExtractedEvent {
  title: string;
  start: string;
  endTime?: string;
  category: EventCategory;
}

/**
 * Post-model guardrail: whatever Claude returns, only well-formed future
 * events survive. The pipeline never has to be right, only never
 * wrong-and-published — the draft gate catches the rest.
 */
export function refineExtraction(
  raw: FlyerExtraction,
  todayStartIso: string,
): ExtractedEvent[] {
  if (!raw.isEventFlyer) return [];
  const floor = Date.parse(todayStartIso);
  const events: ExtractedEvent[] = [];
  for (const candidate of raw.events) {
    const title = candidate.title.trim();
    const startMs = Date.parse(candidate.start);
    if (!title || Number.isNaN(startMs) || startMs < floor) continue;
    const event: ExtractedEvent = {
      title,
      start: candidate.start,
      category: candidate.category,
    };
    if (candidate.end) {
      const endMs = Date.parse(candidate.end);
      if (!Number.isNaN(endMs) && endMs > startMs)
        event.endTime = candidate.end;
    }
    events.push(event);
  }
  return events;
}
```

- [ ] **Step 5: Run to verify pass** — `npm test`, expected all green.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/pipeline/extract.ts src/lib/pipeline/extract.test.ts
git commit -m "Add flyer extraction schema and refinement guardrails"
```

---

### Task 4: Facebook feed parsing

**Files:**

- Create: `src/lib/pipeline/facebook.ts`
- Create: `src/lib/pipeline/fixtures/fb-posts-response.json`
- Test: `src/lib/pipeline/facebook.test.ts`

**Interfaces:**

- Produces:
  - `interface FbPost { id: string; createdTime: string; message?: string; imageUrls: string[] }`
  - `parsePostsResponse(json: unknown): FbPost[]` (pure)
  - `fetchNewPosts(opts: { pageId: string; token: string; sinceIso?: string }): Promise<FbPost[]>` (network; posts newest-first as Graph returns them)
  - `GRAPH_VERSION` constant
- Task 9's cron route calls `fetchNewPosts` and filters by processed IDs.

- [ ] **Step 1: Write the fixture** (hand-built to the Graph API `published_posts` shape — one text-only post, one single-image post, one album post)

```json
{
  "data": [
    {
      "id": "1000_1",
      "created_time": "2026-09-01T14:03:22+0000",
      "message": "We are OPEN today, come thru"
    },
    {
      "id": "1000_2",
      "created_time": "2026-09-01T15:00:00+0000",
      "message": "September events are HERE 🍻",
      "attachments": {
        "data": [
          {
            "media": {
              "image": { "src": "https://scontent.example/flyer.jpg" }
            }
          }
        ]
      }
    },
    {
      "id": "1000_3",
      "created_time": "2026-08-31T12:00:00+0000",
      "attachments": {
        "data": [
          {
            "media": {
              "image": { "src": "https://scontent.example/album-cover.jpg" }
            },
            "subattachments": {
              "data": [
                {
                  "media": {
                    "image": { "src": "https://scontent.example/a1.jpg" }
                  }
                },
                {
                  "media": {
                    "image": { "src": "https://scontent.example/a2.jpg" }
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ]
}
```

- [ ] **Step 2: Write the failing tests**

```typescript
// src/lib/pipeline/facebook.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { parsePostsResponse } from "./facebook.ts";

const fixture = JSON.parse(
  readFileSync(
    new URL("./fixtures/fb-posts-response.json", import.meta.url),
    "utf8",
  ),
);

test("parses posts, keeping only image URLs that exist", () => {
  const posts = parsePostsResponse(fixture);
  assert.equal(posts.length, 3);
  assert.deepEqual(posts[0].imageUrls, []);
  assert.deepEqual(posts[1].imageUrls, ["https://scontent.example/flyer.jpg"]);
});

test("albums prefer subattachments and dedupe", () => {
  const posts = parsePostsResponse(fixture);
  assert.deepEqual(posts[2].imageUrls, [
    "https://scontent.example/a1.jpg",
    "https://scontent.example/a2.jpg",
  ]);
  assert.equal(posts[2].message, undefined);
});

test("tolerates junk input", () => {
  assert.deepEqual(parsePostsResponse({}), []);
  assert.deepEqual(parsePostsResponse(null), []);
  assert.deepEqual(parsePostsResponse({ data: [{}] }), []);
});
```

- [ ] **Step 3: Run to verify failure** — `npm test`, expected FAIL (module not found).

- [ ] **Step 4: Implement**

```typescript
// src/lib/pipeline/facebook.ts

/** Bump when Meta sunsets this version (~2-year cycle). */
export const GRAPH_VERSION = "v23.0";

export interface FbPost {
  id: string;
  createdTime: string;
  message?: string;
  imageUrls: string[];
}

type Attachment = {
  media?: { image?: { src?: string } };
  subattachments?: { data?: Attachment[] };
};

function imagesFrom(attachment: Attachment): string[] {
  const subs = attachment.subattachments?.data;
  if (subs?.length) {
    return subs
      .map((sub) => sub.media?.image?.src)
      .filter((src): src is string => Boolean(src));
  }
  const src = attachment.media?.image?.src;
  return src ? [src] : [];
}

export function parsePostsResponse(json: unknown): FbPost[] {
  const data = (json as { data?: unknown[] } | null)?.data;
  if (!Array.isArray(data)) return [];
  const posts: FbPost[] = [];
  for (const raw of data) {
    const post = raw as {
      id?: string;
      created_time?: string;
      message?: string;
      attachments?: { data?: Attachment[] };
    };
    if (!post.id || !post.created_time) continue;
    const imageUrls = [
      ...new Set((post.attachments?.data ?? []).flatMap(imagesFrom)),
    ];
    posts.push({
      id: post.id,
      createdTime: post.created_time,
      ...(post.message ? { message: post.message } : {}),
      imageUrls,
    });
  }
  return posts;
}

export async function fetchNewPosts(opts: {
  pageId: string;
  token: string;
  sinceIso?: string;
}): Promise<FbPost[]> {
  const url = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/${opts.pageId}/published_posts`,
  );
  url.searchParams.set(
    "fields",
    "id,message,created_time,attachments{media,subattachments}",
  );
  url.searchParams.set("limit", "25");
  if (opts.sinceIso) url.searchParams.set("since", opts.sinceIso);
  url.searchParams.set("access_token", opts.token);
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) {
    const code = (body as { error?: { code?: number } })?.error?.code;
    throw new Error(
      code === 190
        ? "FB_TOKEN_DEAD: Page token rejected (code 190) — re-run the OAuth dance."
        : `Graph API error ${res.status}: ${JSON.stringify(body).slice(0, 500)}`,
    );
  }
  return parsePostsResponse(body);
}
```

- [ ] **Step 5: Run to verify pass** — `npm test`, expected all green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pipeline/facebook.ts src/lib/pipeline/facebook.test.ts src/lib/pipeline/fixtures/fb-posts-response.json
git commit -m "Add Facebook published_posts client with fixture-tested parsing"
```

---

### Task 5: Event deduplication

**Files:**

- Create: `src/lib/pipeline/dedupe.ts`
- Test: `src/lib/pipeline/dedupe.test.ts`

**Interfaces:**

- Consumes: `ExtractedEvent` from Task 3.
- Produces:
  - `eventKey(title: string, startIso: string): string` — normalized-title + NY calendar date
  - `dedupeNewEvents(extracted: ExtractedEvent[], existing: { title: string; start: string }[]): ExtractedEvent[]`
- Task 8's `drafts.ts` fetches existing events (drafts and published) and passes them here before creating anything.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/pipeline/dedupe.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { dedupeNewEvents, eventKey } from "./dedupe.ts";

test("key normalizes case, punctuation, and whitespace", () => {
  assert.equal(
    eventKey("Chris Campbell (live!)", "2026-09-04T17:00:00-04:00"),
    eventKey("  chris   campbell live ", "2026-09-04T19:30:00-04:00"),
  );
});

test("key distinguishes different calendar days in NY time", () => {
  assert.notEqual(
    eventKey("Trivia", "2026-09-04T23:00:00-04:00"),
    eventKey("Trivia", "2026-09-05T23:00:00-04:00"),
  );
});

test("drops events matching an existing title+date, keeps the rest", () => {
  const extracted = [
    {
      title: "Music Bingo!",
      start: "2026-09-10T18:00:00-04:00",
      category: "games" as const,
    },
    {
      title: "Vinyl Night",
      start: "2026-09-12T18:00:00-04:00",
      category: "music" as const,
    },
  ];
  const existing = [
    { title: "music bingo", start: "2026-09-10T18:30:00-04:00" },
  ];
  const out = dedupeNewEvents(extracted, existing);
  assert.deepEqual(
    out.map((e) => e.title),
    ["Vinyl Night"],
  );
});

test("dedupes within the extracted batch itself (re-posted flyer)", () => {
  const twice = [
    {
      title: "Trivia",
      start: "2026-09-11T19:00:00-04:00",
      category: "games" as const,
    },
    {
      title: "Trivia!",
      start: "2026-09-11T19:00:00-04:00",
      category: "games" as const,
    },
  ];
  assert.equal(dedupeNewEvents(twice, []).length, 1);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test`, expected FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
// src/lib/pipeline/dedupe.ts
import type { ExtractedEvent } from "./extract";

const TZ = "America/New_York";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Same show, same NY calendar day ⇒ same event, regardless of styling. */
export function eventKey(title: string, startIso: string): string {
  const day = new Date(startIso).toLocaleDateString("en-CA", { timeZone: TZ });
  return `${normalizeTitle(title)}|${day}`;
}

export function dedupeNewEvents(
  extracted: ExtractedEvent[],
  existing: { title: string; start: string }[],
): ExtractedEvent[] {
  const seen = new Set(existing.map((e) => eventKey(e.title, e.start)));
  const fresh: ExtractedEvent[] = [];
  for (const event of extracted) {
    const key = eventKey(event.title, event.start);
    if (seen.has(key)) continue;
    seen.add(key);
    fresh.push(event);
  }
  return fresh;
}
```

- [ ] **Step 4: Run to verify pass** — `npm test`, expected all green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pipeline/dedupe.ts src/lib/pipeline/dedupe.test.ts
git commit -m "Add title+date event dedupe for pipeline idempotency"
```

---

### Task 6: Email rendering + Resend sender

**Files:**

- Create: `src/lib/pipeline/email.ts`
- Test: `src/lib/pipeline/email.test.ts`

**Interfaces:**

- Consumes: `ExtractedEvent` from Task 3.
- Produces:
  - `renderApprovalEmail(events: ExtractedEvent[], approveUrl: string, studioUrl: string): string` (pure HTML)
  - `sendEmail(opts: { to: string[]; subject: string; html: string }): Promise<void>` — Resend REST, throws on non-2xx
  - `sendAlert(subject: string, detail: string): Promise<void>` — plain-text-ish alert to `PIPELINE_ALERT_EMAIL`; **swallows its own failures** (an alert about a failure must not mask the failure)
- Task 9 sends the approval email and alerts.

- [ ] **Step 1: Write the failing tests** (render only — the senders are thin `fetch` wrappers)

```typescript
// src/lib/pipeline/email.test.ts
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
```

- [ ] **Step 2: Run to verify failure** — `npm test`, expected FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
// src/lib/pipeline/email.ts
import type { ExtractedEvent } from "./extract";

const TZ = "America/New_York";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhen(iso: string, endIso?: string): string {
  const start = new Date(iso);
  const day = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TZ,
  });
  const time = (d: Date) =>
    d
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: TZ,
      })
      .replace(":00", "");
  return endIso
    ? `${day} · ${time(start)}–${time(new Date(endIso))}`
    : `${day} · ${time(start)}`;
}

export function renderApprovalEmail(
  events: ExtractedEvent[],
  approveUrl: string,
  studioUrl: string,
): string {
  const rows = events
    .map(
      (event) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e0d5;font-weight:600">${escapeHtml(event.title)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e0d5">${formatWhen(event.start, event.endTime)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e0d5;color:#6b6b6b">${escapeHtml(event.category)}</td>
      </tr>`,
    )
    .join("");
  return `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:16px">
    <h1 style="font-size:20px">Found ${events.length} event${events.length === 1 ? "" : "s"} on your new flyer 🍻</h1>
    <p>Here's what the robot read. One tap puts them on the website.</p>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
    <p style="margin:24px 0">
      <a href="${escapeHtml(approveUrl)}"
         style="background:#1d3557;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700">
        Publish all
      </a>
    </p>
    <p style="color:#6b6b6b;font-size:14px">
      Something's off — a wrong date or time? Fix it in the
      <a href="${escapeHtml(studioUrl)}">editing screen</a> instead, then publish there.
      This link works for 7 days. Nothing appears on the site until you tap.
    </p>
  </div>`;
}

async function postToResend(payload: object): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function sendEmail(opts: {
  to: string[];
  subject: string;
  html: string;
}): Promise<void> {
  const res = await postToResend({
    from: process.env.PIPELINE_FROM_EMAIL,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (!res.ok) {
    throw new Error(
      `Resend ${res.status}: ${(await res.text()).slice(0, 300)}`,
    );
  }
}

/** Maintainer alert. Never throws — an alert failure must not mask the original error. */
export async function sendAlert(
  subject: string,
  detail: string,
): Promise<void> {
  const to = process.env.PIPELINE_ALERT_EMAIL;
  if (!to) return;
  try {
    await sendEmail({
      to: [to],
      subject: `[beer-hub pipeline] ${subject}`,
      html: `<pre style="font-family:monospace;white-space:pre-wrap">${detail
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</pre>`,
    });
  } catch (error) {
    console.error("Alert email failed", error);
  }
}
```

- [ ] **Step 4: Run to verify pass** — `npm test`, expected all green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pipeline/email.ts src/lib/pipeline/email.test.ts
git commit -m "Add approval email rendering and Resend senders"
```

---

### Task 7: Sanity schema additions

**Files:**

- Modify: `src/sanity/schemaTypes/siteSettings.ts` (add field in the `identity` group, after `announcement` ~line 94)
- Modify: `src/sanity/schemaTypes/event.ts` (add hidden `source` field after `link`, ~line 67)
- Create: `src/sanity/schemaTypes/pipelineState.ts`
- Modify: `src/sanity/schemaTypes/index.ts`
- Modify: `src/lib/types.ts` (add `pipelineEmails` to `SiteSettings`, ~line 39)

**Interfaces:**

- Produces: document type `pipelineState` (`_id: "pipelineState"`, fields `cursor: string`, `processedPostIds: string[]`), `event.source { fbPostId, ingestedAt }`, `siteSettings.pipelineEmails: string[]`. Tasks 8-9 read/write these.

- [ ] **Step 1: Add `pipelineEmails` to siteSettings** (insert after the `announcement` field)

```typescript
    defineField({
      name: "pipelineEmails",
      title: "Who gets the “new events found” email",
      type: "array",
      group: "identity",
      of: [{ type: "string" }],
      description:
        "When a new flyer is posted to Facebook, these addresses get an email with a one-tap publish button. Add or remove addresses any time.",
      validation: (rule) =>
        rule.unique().custom((emails?: string[]) =>
          (emails ?? []).every((e) => /.+@.+\..+/.test(e))
            ? true
            : "One of these doesn't look like an email address.",
        ),
    }),
```

- [ ] **Step 2: Add the hidden `source` field to event** (after `link`)

```typescript
    defineField({
      name: "source",
      title: "Pipeline source",
      type: "object",
      hidden: true,
      readOnly: true,
      fields: [
        defineField({ name: "fbPostId", title: "Facebook post ID", type: "string" }),
        defineField({ name: "ingestedAt", title: "Ingested at", type: "datetime" }),
      ],
    }),
```

- [ ] **Step 3: Create the pipelineState type**

```typescript
// src/sanity/schemaTypes/pipelineState.ts
import { defineField, defineType } from "sanity";

/**
 * Hidden singleton (`_id: "pipelineState"`) tracking what the flyer
 * pipeline has already processed. Written only by the cron route; not
 * listed in the Studio structure.
 */
export const pipelineState = defineType({
  name: "pipelineState",
  title: "Pipeline State",
  type: "document",
  readOnly: true,
  fields: [
    defineField({
      name: "cursor",
      title: "Newest processed post time",
      type: "string",
    }),
    defineField({
      name: "processedPostIds",
      title: "Processed post IDs",
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
});
```

- [ ] **Step 4: Register it in the index**

```typescript
// src/sanity/schemaTypes/index.ts
import type { SchemaTypeDefinition } from "sanity";

import { event } from "./event";
import { galleryImage } from "./galleryImage";
import { pipelineState } from "./pipelineState";
import { siteSettings } from "./siteSettings";
import { weeklyEvent } from "./weeklyEvent";

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  event,
  weeklyEvent,
  galleryImage,
  pipelineState,
];
```

(The Studio structure in `src/sanity/structure.ts` lists items explicitly, so `pipelineState` stays out of the sidebar with no change there.)

- [ ] **Step 5: Extend the SiteSettings type** — in `src/lib/types.ts` add to the `SiteSettings` interface:

```typescript
  pipelineEmails?: string[];
```

- [ ] **Step 6: Verify** — `npx tsc --noEmit` clean, `npm run lint` clean, `npm test` still green.

- [ ] **Step 7: Commit**

```bash
git add src/sanity/schemaTypes src/lib/types.ts
git commit -m "Add pipeline schema: recipient emails, event source, pipeline state"
```

---

### Task 8: IO modules — write client, state, drafts, Claude call

**Files:**

- Create: `src/sanity/serverClient.ts`
- Create: `src/lib/pipeline/state.ts`
- Create: `src/lib/pipeline/drafts.ts`
- Create: `src/lib/pipeline/claude.ts`

**Interfaces:**

- Consumes: `client` from `src/sanity/client.ts`; `FlyerExtractionSchema`/`refineExtraction`/`ExtractedEvent` (Task 3); `dedupeNewEvents` (Task 5); `FbPost` (Task 4); `startOfTodayIso` from `@/lib/format`.
- Produces (all consumed by Tasks 9-10):
  - `writeClient` — token-authed, `perspective: "raw"`, `useCdn: false`
  - `getPipelineState(): Promise<{ cursor?: string; processedPostIds: string[] }>` / `savePipelineState(state): Promise<void>`
  - `createDraftsForNewEvents(events: ExtractedEvent[], fbPostId: string): Promise<string[]>` — dedupes against ALL existing events, returns created draft IDs
  - `publishDrafts(draftIds: string[]): Promise<number>` — returns count published; already-gone drafts are skipped (idempotent)
  - `getRecipients(): Promise<string[]>`
  - `extractEventsFromPost(post: FbPost): Promise<ExtractedEvent[]>`

These are thin IO seams — no unit tests; they're covered by `tsc`, lint, and the manual E2E in Task 11.

- [ ] **Step 1: Write the server client**

```typescript
// src/sanity/serverClient.ts
import { client } from "./client";

/**
 * Mutation-capable client for the flyer pipeline. `raw` perspective so
 * queries see drafts AND published docs (dedupe needs both). Server-only:
 * never import from client components.
 */
export const writeClient = client.withConfig({
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});
```

- [ ] **Step 2: Write the state module**

```typescript
// src/lib/pipeline/state.ts
import { writeClient } from "@/sanity/serverClient";

const STATE_ID = "pipelineState";
const MAX_IDS = 200;

export interface PipelineState {
  cursor?: string;
  processedPostIds: string[];
}

export async function getPipelineState(): Promise<PipelineState> {
  const doc = await writeClient.getDocument(STATE_ID);
  return {
    cursor: (doc?.cursor as string | undefined) ?? undefined,
    processedPostIds: (doc?.processedPostIds as string[] | undefined) ?? [],
  };
}

export async function savePipelineState(state: PipelineState): Promise<void> {
  await writeClient.createOrReplace({
    _id: STATE_ID,
    _type: "pipelineState",
    cursor: state.cursor,
    processedPostIds: state.processedPostIds.slice(-MAX_IDS),
  });
}
```

- [ ] **Step 3: Write the drafts module**

```typescript
// src/lib/pipeline/drafts.ts
import { randomUUID } from "node:crypto";

import { writeClient } from "@/sanity/serverClient";

import { dedupeNewEvents } from "./dedupe";
import type { ExtractedEvent } from "./extract";

/** Create drafts for events not already present (drafts or published). */
export async function createDraftsForNewEvents(
  events: ExtractedEvent[],
  fbPostId: string,
): Promise<string[]> {
  const existing = await writeClient.fetch<{ title: string; start: string }[]>(
    `*[_type == "event"]{title, start}`,
  );
  const fresh = dedupeNewEvents(events, existing);
  const draftIds: string[] = [];
  for (const event of fresh) {
    const _id = `drafts.${randomUUID()}`;
    await writeClient.create({
      _id,
      _type: "event",
      title: event.title,
      start: event.start,
      ...(event.endTime ? { endTime: event.endTime } : {}),
      category: event.category,
      source: { fbPostId, ingestedAt: new Date().toISOString() },
    });
    draftIds.push(_id);
  }
  return draftIds;
}

/** Publish by copying each draft to its published ID and deleting the draft. */
export async function publishDrafts(draftIds: string[]): Promise<number> {
  let published = 0;
  for (const draftId of draftIds) {
    const doc = await writeClient.getDocument(draftId);
    if (!doc) continue; // already published or hand-deleted — idempotent no-op
    const { _rev, _updatedAt, _createdAt, ...rest } = doc;
    void _rev;
    void _updatedAt;
    void _createdAt;
    await writeClient
      .transaction()
      .createOrReplace({ ...rest, _id: draftId.replace(/^drafts\./, "") })
      .delete(draftId)
      .commit();
    published += 1;
  }
  return published;
}

export async function getRecipients(): Promise<string[]> {
  const emails = await writeClient.fetch<string[] | null>(
    `*[_type == "siteSettings" && _id == "siteSettings"][0].pipelineEmails`,
  );
  if (emails?.length) return emails;
  const fallback = process.env.PIPELINE_FALLBACK_EMAIL;
  return fallback ? [fallback] : [];
}
```

- [ ] **Step 4: Write the Claude call**

```typescript
// src/lib/pipeline/claude.ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { startOfTodayIso } from "@/lib/format";

import {
  FlyerExtractionSchema,
  refineExtraction,
  type ExtractedEvent,
} from "./extract";
import type { FbPost } from "./facebook";

const SYSTEM = `You read social media posts from Blue Ridge Beer Hub, a taproom in Waynesville, NC (America/New_York timezone), and decide whether the post is an event flyer or event announcement. If it is, extract every distinct dated event.

Rules:
- isEventFlyer is true only when the post announces one or more events on specific dates. Photos, general announcements, and menu posts are false.
- start/end are full ISO 8601 datetimes WITH the correct America/New_York UTC offset. Resolve dates without a year to the NEXT future occurrence relative to today's date given in the message.
- If a time is missing, use 18:00 local. If the end time is not stated, set end to null.
- category: music (live acts, vinyl, karaoke), art (markets, craft nights), games (trivia, bingo), party (anniversaries, holiday bashes), community (fundraisers, clubs, meetups).
- When you cannot read a date confidently, OMIT that event. Fewer correct events beats guessed ones — a human approves this list, and wrong dates erode their trust.`;

export async function extractEventsFromPost(
  post: FbPost,
): Promise<ExtractedEvent[]> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          ...post.imageUrls
            .slice(0, 4)
            .map(
              (url) =>
                ({ type: "image", source: { type: "url", url } }) as const,
            ),
          {
            type: "text",
            text: `Post caption:\n${post.message ?? "(no caption)"}\n\nToday is ${startOfTodayIso()}.`,
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(FlyerExtractionSchema) },
  });
  const parsed = response.parsed_output;
  if (!parsed) return [];
  return refineExtraction(parsed, startOfTodayIso());
}
```

- [ ] **Step 5: Verify** — `npx tsc --noEmit` clean, `npm run lint` clean, `npm test` green. (If the SDK's `zodOutputFormat` import path or `parse` signature differs, fix against the installed SDK's types — do not silence with `any`.)

- [ ] **Step 6: Commit**

```bash
git add src/sanity/serverClient.ts src/lib/pipeline/state.ts src/lib/pipeline/drafts.ts src/lib/pipeline/claude.ts
git commit -m "Add pipeline IO: write client, state, draft creation, Claude extraction"
```

---

### Task 9: Cron route + vercel.json schedule

**Files:**

- Create: `src/app/api/cron/ingest-flyer/route.ts`
- Modify: `vercel.json`

**Interfaces:**

- Consumes: everything from Tasks 2-8. Produces the daily ingest endpoint.

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/cron/ingest-flyer/route.ts
import {
  renderApprovalEmail,
  sendAlert,
  sendEmail,
} from "@/lib/pipeline/email";
import { extractEventsFromPost } from "@/lib/pipeline/claude";
import { createDraftsForNewEvents, getRecipients } from "@/lib/pipeline/drafts";
import { fetchNewPosts } from "@/lib/pipeline/facebook";
import { getPipelineState, savePipelineState } from "@/lib/pipeline/state";
import { signApprovalToken } from "@/lib/pipeline/token";
import { SITE_URL } from "@/lib/site";
import { writeClient } from "@/sanity/serverClient";

export const maxDuration = 60;

const APPROVAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_POSTS_PER_RUN = 5;

export async function GET(request: Request) {
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const state = await getPipelineState();
    const posts = await fetchNewPosts({
      pageId: process.env.FB_PAGE_ID!,
      token: process.env.FB_PAGE_TOKEN!,
      sinceIso: state.cursor,
    });
    const candidates = posts
      .filter((post) => !state.processedPostIds.includes(post.id))
      .filter((post) => post.imageUrls.length > 0)
      .slice(0, MAX_POSTS_PER_RUN);

    const allDraftIds: string[] = [];
    let eventCount = 0;
    for (const post of candidates) {
      const events = await extractEventsFromPost(post);
      const draftIds = await createDraftsForNewEvents(events, post.id);
      allDraftIds.push(...draftIds);
      eventCount += draftIds.length;
    }

    if (allDraftIds.length > 0) {
      const recipients = await getRecipients();
      if (recipients.length === 0) {
        await sendAlert(
          "No recipients configured",
          "Drafts were created but pipelineEmails and PIPELINE_FALLBACK_EMAIL are both empty.",
        );
      } else {
        const token = signApprovalToken(
          { draftIds: allDraftIds, exp: Date.now() + APPROVAL_TTL_MS },
          process.env.PIPELINE_SECRET!,
        );
        await sendEmail({
          to: recipients,
          subject: `New flyer spotted — ${eventCount} event${eventCount === 1 ? "" : "s"} ready to publish`,
          html: renderApprovalEmail(
            // re-fetching drafts for the email is overkill; render from what we made
            allDraftIds.length ? await draftsForEmail(allDraftIds) : [],
            `${SITE_URL}/api/pipeline/approve?token=${encodeURIComponent(token)}`,
            `${SITE_URL}/studio`,
          ),
        });
      }
    }

    // Every post seen this run is now processed — parsed, skipped (no image),
    // or beyond the per-run cap gets retried tomorrow (not marked).
    const processedNow = candidates.map((post) => post.id);
    const skippedNoImage = posts
      .filter((post) => post.imageUrls.length === 0)
      .map((post) => post.id);
    const newestTime = posts[0]?.createdTime;
    await savePipelineState({
      cursor: newestTime ?? state.cursor,
      processedPostIds: [
        ...state.processedPostIds,
        ...processedNow,
        ...skippedNoImage,
      ],
    });

    return Response.json({
      posts: candidates.length,
      drafts: allDraftIds.length,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    await sendAlert(
      detail.includes("FB_TOKEN_DEAD")
        ? "Facebook Page token is dead — re-auth needed"
        : "Pipeline run failed",
      detail,
    );
    return new Response("Pipeline error", { status: 500 });
  }
}

async function draftsForEmail(draftIds: string[]) {
  return writeClient.fetch<
    {
      title: string;
      start: string;
      endTime?: string;
      category: "music" | "art" | "games" | "party" | "community";
    }[]
  >(`*[_id in $ids]{title, start, endTime, category} | order(start asc)`, {
    ids: draftIds,
  });
}
```

- [ ] **Step 2: Add the cron to vercel.json**

```json
{
  "framework": "nextjs",
  "crons": [{ "path": "/api/cron/ingest-flyer", "schedule": "0 11 * * *" }]
}
```

(11:00 UTC ≈ 6-7am Eastern; Hobby fires it once daily within the hour.)

- [ ] **Step 3: Verify** — `npx tsc --noEmit` clean, `npm run lint` clean, `npm test` green.

- [ ] **Step 4: Smoke-test locally** (needs `.env.local` with at least Sanity vars; FB/Claude vars can be dummies — expect a 500 + console error, proving auth and the error path work):

Run: `CRON_SECRET=dev npm run dev` then `curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/cron/ingest-flyer` → expect `401`; `curl -s -H "Authorization: Bearer dev" localhost:3000/api/cron/ingest-flyer` → expect a JSON body or a 500 with a logged error (no crash). Stop the dev server after.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/ingest-flyer/route.ts vercel.json
git commit -m "Add daily flyer-ingest cron route"
```

---

### Task 10: Approve route (confirmation page + publish)

**Files:**

- Create: `src/app/api/pipeline/approve/route.ts`

**Interfaces:**

- Consumes: `verifyApprovalToken` (Task 2), `publishDrafts` + `writeClient` (Task 8), `SITE_URL`.
- Produces: `GET /api/pipeline/approve?token=…` (confirmation page) and `POST` (publishes, shows done page). The GET **must not** publish — email scanners prefetch links.

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/pipeline/approve/route.ts
import { publishDrafts } from "@/lib/pipeline/drafts";
import { verifyApprovalToken } from "@/lib/pipeline/token";
import { writeClient } from "@/sanity/serverClient";
import { SITE_URL } from "@/lib/site";

export const maxDuration = 30;

function page(title: string, body: string): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;background:#faf6ec;color:#1d3557;max-width:480px;margin:48px auto;padding:0 16px">
${body}
</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function expiredPage(): Response {
  return page(
    "Link expired",
    `<h1>This link has expired</h1>
     <p>No worries — nothing was lost. You can publish the events yourself in the
     <a href="${SITE_URL}/studio">editing screen</a> (they're saved there as drafts),
     or wait for the next email.</p>`,
  );
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const payload = verifyApprovalToken(token, process.env.PIPELINE_SECRET!);
  if (!payload) return expiredPage();

  const drafts = await writeClient.fetch<{ title: string; start: string }[]>(
    `*[_id in $ids]{title, start} | order(start asc)`,
    {
      ids: payload.draftIds,
    },
  );
  if (drafts.length === 0) {
    return page(
      "Already published",
      `<h1>All set 🍻</h1><p>These events are already live on the site.</p>
       <p><a href="${SITE_URL}">See the site</a></p>`,
    );
  }

  const rows = drafts
    .map((d) => {
      const when = new Date(d.start).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "America/New_York",
      });
      const title = d.title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      return `<li style="margin:6px 0"><strong>${title}</strong> — ${when}</li>`;
    })
    .join("");

  return page(
    "Publish events?",
    `<h1>Publish ${drafts.length} event${drafts.length === 1 ? "" : "s"}?</h1>
     <ul style="padding-left:20px">${rows}</ul>
     <form method="POST">
       <input type="hidden" name="token" value="${token.replace(/"/g, "&quot;")}">
       <button type="submit" style="background:#1d3557;color:#fff;border:0;padding:12px 24px;border-radius:6px;font-size:16px;font-weight:700;cursor:pointer">
         Yes, publish
       </button>
     </form>
     <p style="color:#6b6b6b;font-size:14px">Wrong date or time on one of these?
     Fix it in the <a href="${SITE_URL}/studio">editing screen</a> and publish there instead.</p>`,
  );
}

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const payload = verifyApprovalToken(token, process.env.PIPELINE_SECRET!);
  if (!payload) return expiredPage();

  const count = await publishDrafts(payload.draftIds);
  return page(
    "Published",
    `<h1>Done — ${count} event${count === 1 ? "" : "s"} published 🎉</h1>
     <p>They're live on <a href="${SITE_URL}">the website</a> now.
     Past events clean themselves up automatically.</p>`,
  );
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit`, `npm run lint`, `npm test` all clean.

- [ ] **Step 3: Manual check of both pages** — with the dev server running and a token generated by a one-off script:

Run: `node -e 'import("./src/lib/pipeline/token.ts").then(m => console.log(m.signApprovalToken({draftIds:["drafts.nope"],exp:Date.now()+86400000}, process.env.PIPELINE_SECRET ?? "dev")))'`
Then open `localhost:3000/api/pipeline/approve?token=<that>` — expect the "Already published" page (the draft doesn't exist), and a garbage token shows the expired page. Stop the dev server after.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/pipeline/approve/route.ts
git commit -m "Add magic-link approve route with scanner-safe confirm page"
```

---

### Task 11: Docs, env, and full verification

**Files:**

- Modify: `.env.example`
- Modify: `UPDATING.md` (new section at top, after the intro paragraph)
- Modify: `README.md` (new subsection under "How content works")
- Modify: `docs/superpowers/specs/2026-09-02-flyer-pipeline-design.md` (model-name correction)

**Interfaces:** none — documentation and final verification.

- [ ] **Step 1: Extend .env.example** — append:

```bash
# ── Flyer pipeline (all server-only) ─────────────────────────────
# Meta app in Development mode; Page admin added as app admin.
FB_PAGE_ID=
FB_PAGE_TOKEN=
# Claude vision extraction (cents/month at one call a day).
ANTHROPIC_API_KEY=
# Approval + alert emails.
RESEND_API_KEY=
PIPELINE_FROM_EMAIL=
# Maintainer (Skylar) — gets error alerts, never the owners.
PIPELINE_ALERT_EMAIL=
# Owners' fallback when Studio's pipelineEmails field is empty.
PIPELINE_FALLBACK_EMAIL=
# Signs the magic publish links. Any long random string.
PIPELINE_SECRET=
# Vercel sends this on cron requests; set the same value in Vercel env.
CRON_SECRET=
# Sanity token with Editor rights, for draft creation + publishing.
SANITY_API_WRITE_TOKEN=
```

- [ ] **Step 2: Add the robot section to UPDATING.md** — insert after the intro paragraph (before "## When the new monthly flyer drops"):

```markdown
## The robot does the flyer now (usually)

When you post the monthly flyer to Facebook, the website reads it overnight.
The next morning you'll get an email — **"New flyer spotted — 6 events ready
to publish"** — listing what it found. Tap **Publish all** and they're on the
site. That's the whole job.

- **Something's wrong in the email** (bad date, wrong time)? Don't tap publish —
  open `/studio` → Events, fix the drafts there, and publish them by hand.
- **Fixed a date on the flyer itself?** The robot won't re-read corrections —
  make the same fix in `/studio` too.
- **No email the morning after you posted?** The manual steps below always
  work; the robot is a convenience, not a requirement.
- Who receives the email lives in **Studio → Site Settings → Name & Contact →
  “Who gets the new events found email.”**
```

- [ ] **Step 3: Add a README subsection** — under "How content works", append:

```markdown
### The flyer pipeline

A daily cron (`/api/cron/ingest-flyer`, `vercel.json`) polls the Hub's
Facebook Page via the Graph API, runs new flyer images through Claude
(`src/lib/pipeline/claude.ts`), writes extracted events as Sanity _drafts_,
and emails the owners a signed one-tap publish link
(`/api/pipeline/approve`). Nothing publishes without that tap. Errors and
token death alert `PIPELINE_ALERT_EMAIL`, never the owners. Setup runbook and
design: `docs/superpowers/specs/2026-09-02-flyer-pipeline-design.md`. If the
Meta tether ever becomes a burden, the documented escape hatch is an
email-the-flyer-in route reusing the same extract → draft → approve tail.
```

- [ ] **Step 4: Correct the model note in the spec** — in the design doc's Modules section, change "Model: `claude-sonnet-5`" to "Model: `claude-opus-5` (per current Claude-API guidance at implementation time)".

- [ ] **Step 5: Full verification**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all four clean. (Build needs the `NEXT_PUBLIC_SANITY_*` vars from `.env.local`.)

- [ ] **Step 6: Render the approval email for design review**

Run: `node -e 'import("./src/lib/pipeline/email.ts").then(m => process.stdout.write(m.renderApprovalEmail([{title:"Chris Campbell (live)",start:"2026-09-04T17:00:00-04:00",endTime:"2026-09-04T19:00:00-04:00",category:"music"},{title:"Music Bingo",start:"2026-09-10T18:00:00-04:00",category:"games"}],"https://example.com/approve","https://example.com/studio")))' > /tmp/approval-email-preview.html`

Surface `/tmp/approval-email-preview.html` to Skylar for the rendered-email design ruling (per the spec's testing section).

- [ ] **Step 7: Commit**

```bash
git add .env.example UPDATING.md README.md docs/superpowers/specs/2026-09-02-flyer-pipeline-design.md
git commit -m "Document the flyer pipeline: env, owner guide, README"
```

---

## Not in this plan (launch-time, needs humans)

The spec's one-time setup runbook — creating the Meta app with the owner, minting the Page token, setting Vercel env vars, verifying the Resend sending domain, seeding `pipelineEmails`, and the real end-to-end run against the live Page — happens at deploy time with Skylar and an owner present, not in this implementation plan.
