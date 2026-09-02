# Flyer-to-Site Pipeline — Design

2026-09-02 · Status: approved design, pre-implementation

## Goal

The owners' only content habit is posting the monthly flyer (and other news) to
their Facebook Page. The site should feed off that habit so the schedule stays
current with near-zero owner effort: the pipeline reads new Page posts daily,
extracts events from flyer images with Claude vision, writes them to Sanity as
drafts, and emails the owners a one-tap publish link.

## Decisions (settled in brainstorming, 2026-09-02)

| Decision             | Choice                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Source               | Facebook Page only (it's where the flyer reliably lands)                                                                    |
| Mechanism            | Daily Graph API polling via Vercel cron; no webhooks                                                                        |
| Meta app posture     | Development-mode app, owner added as app admin — Standard Access, no App Review; never-expiring Page token                  |
| Scope v1             | Events from flyers only                                                                                                     |
| Publish mode         | Auto-draft + emailed approval; nothing publishes without a human tap                                                        |
| Approval auth        | Signed magic link (HMAC, scoped to draft IDs, ~7-day expiry), no login                                                      |
| Approval granularity | Publish-all + "fix in Studio" link; no per-event controls in email                                                          |
| Corrections          | Dedupe by title+date; edits to already-ingested posts ignored; fixes happen in Studio                                       |
| Failure alerts       | All errors/silence go to the maintainer (Skylar), never the owners                                                          |
| Recipients           | Sanity Site Settings field, env-var fallback                                                                                |
| Freshness            | Next-day is fine (Hobby cron: daily, ±59 min)                                                                               |
| Ownership            | Meta app on owners' Page admin with Skylar as developer; Anthropic + Resend keys Skylar's, spend-capped, handoff documented |
| Manual path          | Studio + UPDATING.md remain the documented fallback; pipeline is purely additive                                            |

Deferred (explicitly out of scope for v1): Instagram, webhooks, announcement
banner ingestion, gallery photo ingestion, SMS approval, per-event email
controls, updating events from corrected flyers, email-the-flyer-in (documented
as the escape hatch if the Meta tether becomes a burden — not built).

## Architecture

One daily cron route orchestrates four small modules. All pipeline code lives
under `src/lib/pipeline/`; routes under `src/app/api/`.

```
Vercel cron (daily)
  → GET /api/cron/ingest-flyer        (auth: CRON_SECRET)
      1. load pipeline state from Sanity   (processed post IDs + cursor)
      2. fetch new Page posts              (facebook.ts)
      3. classify + extract events         (extract.ts → Claude vision)
      4. dedupe + create Sanity drafts     (drafts.ts)
      5. send approval email               (email.ts → Resend)
      6. persist updated state
      any step throws → alert email to maintainer, non-200 response

Owner taps email link
  → GET /api/pipeline/approve?token=…  → confirmation page listing the events
  → POST (the page's single button)    → publishes the drafts, shows "done"
```

### Modules

- **`facebook.ts`** — reads `/{PAGE_ID}/published_posts` with
  `fields=message,created_time,attachments{media,subattachments}` using the
  never-expiring Page token. Graph API version pinned in one exported constant
  (bump every ~2 years when Meta sunsets versions). Returns posts newer than
  the cursor, excluding already-processed IDs.
- **`extract.ts`** — one Claude API call per candidate post (post must have ≥1
  image): sends the image(s) + caption + today's date, asks "is this an event
  flyer? if so, extract events" with a strict JSON shape — title, ISO start,
  optional end, category (one of the existing `src/lib/categories.ts` keys).
  Rules baked into the prompt: resolve month/day-only dates to the next future
  occurrence (handles December flyers listing January); drop events already in
  the past; return an empty list rather than guess when unsure. Model:
  `claude-opus-5` (per current Claude-API guidance at implementation time). Responses are
  validated by hand (no new deps) before anything is written.
- **`drafts.ts`** — dedupes against existing events (drafts _and_ published) by
  normalized title + same calendar date, then creates `drafts.` event documents
  via the Sanity client with a write token. Each carries a hidden
  `source {fbPostId, ingestedAt}` object for traceability and re-post dedupe.
- **`email.ts`** — Resend. Approval email: "Found N events on your new flyer",
  the extracted rows, **[Publish all]** magic link, and "something's off → fix
  in Studio" link. Recipients: `siteSettings.pipelineEmails` (new field), else
  `PIPELINE_FALLBACK_EMAIL`. Also sends maintainer alerts (see Error handling).
- **`approve/route.ts`** — the magic link is
  `HMAC-SHA256(draftIds + expiry, PIPELINE_SECRET)`. GET renders a minimal page
  listing the events with one Publish button; the button POSTs to publish.
  Rationale for the extra tap: corporate/email-client link scanners prefetch
  GET links — a side-effecting GET could auto-publish. The page keeps the
  "one tap" spirit (the email tap opens it; one button finishes). Token invalid
  or expired → friendly "ask for a fresh email / use Studio" page. Publishing
  an already-published draft set is a no-op success (idempotent).

### State

A hidden Sanity singleton `pipelineState`: `cursor` (ISO time of newest
processed post) + `processedPostIds` (capped at the most recent 200). Sanity is
already the system's one durable store; no new infrastructure.

### Schema changes

- `siteSettings`: `pipelineEmails` — array of email strings, described in
  owner-friendly language ("who gets the 'new events found' email").
- `event`: hidden read-only `source` object (`fbPostId`, `ingestedAt`).
- New hidden `pipelineState` document type, excluded from the Studio structure.

### Env vars

`FB_PAGE_ID`, `FB_PAGE_TOKEN`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`,
`PIPELINE_SECRET`, `CRON_SECRET`, `SANITY_API_WRITE_TOKEN`,
`PIPELINE_ALERT_EMAIL` (maintainer), `PIPELINE_FALLBACK_EMAIL` (owners, used
when the Sanity field is empty). All documented in `.env.example`.

## Error handling

- Any pipeline error (Graph API failure, Claude error, invalid extraction,
  Sanity write failure) → alert email to `PIPELINE_ALERT_EMAIL` with the error
  and step; the cron returns non-200 so Vercel's log shows red. Daily cadence
  self-throttles alerts to ≤1/day.
- Token death is the known silent killer (owner password change, security
  checkpoint, Page-role change): Graph error code 190 gets a specific alert
  ("Page token dead — re-run the OAuth dance") since only the maintainer can
  fix it.
- Claude uncertainty is not an error: an ambiguous flyer yields fewer/no events
  and, if none, no email. The manual Studio path covers the gap — the pipeline
  never has to be right, only never wrong-and-published.

## Testing

- Unit tests via `node:test`, matching the existing `src/lib/ics.test.ts`
  pattern: dedupe normalization, magic-link sign/verify/expiry, extraction JSON
  validation (fixture Claude responses — good, malformed, empty), date
  resolution rules, email recipient fallback logic.
- Add the missing `"test"` script to package.json and run it in CI if/when CI
  lands (tests currently exist but nothing executes them).
- No live Meta/Claude calls in tests: `facebook.ts` and the Claude call are
  thin seams; everything interesting is testable with fixtures. One recorded
  Graph API response and one real flyer image live in `src/lib/pipeline/fixtures/`.
- Manual E2E before launch: run the cron route locally against the real Page,
  inspect drafts in Studio, receive the email, tap through publish. The
  rendered approval email + confirmation page get a design review before the
  UX is considered approved.

## Setup runbook (one-time, ~30 min with an owner present)

1. Create Meta app (type: Business), leave in Development mode; add the Page
   owner as app admin.
2. Graph API Explorer as the owner: grant `pages_show_list` +
   `pages_read_engagement`; exchange for a long-lived user token, then read
   `/{page-id}?fields=access_token` → never-expiring Page token → `FB_PAGE_TOKEN`.
3. Set remaining env vars in Vercel; add the cron entry to `vercel.json`.
4. Seed `pipelineEmails` in Studio; send a test run.
5. Update UPDATING.md: new top section — "the robot usually does this: expect
   an email when you post a flyer; here's what to do if it doesn't come", plus
   the corrected-flyer rule (fixed a date on the flyer → fix it in Studio too).

## Maintenance profile

Near-zero steady state. Known future work: Graph API version bump (~every 2
years), Meta's annual Data Use Checkup checkbox, re-auth if the token dies.
If the Meta tether ever becomes a burden, the documented escape hatch is an
email-the-flyer-in route (same extract/draft/approve tail, no OAuth).
