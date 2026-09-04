# Blue Ridge Beer Hub

One-page site for [Blue Ridge Beer Hub](https://www.facebook.com/brbeerhub) —
Waynesville, NC's community taproom & bottle shop. Next.js App Router +
Tailwind v4 (CSS-first config) + Sanity (embedded Studio at `/studio`).

## Running it

```bash
npm install
cp .env.example .env.local   # fill in the Sanity project ID
npm run dev
```

## How content works

The homepage runs four GROQ queries (site settings, dated events, weekly
events, gallery). If Sanity is unreachable or empty, `src/lib/fallback.ts`
serves a baked-in copy of everything so the page always renders. Content
editing happens in the Studio at `/studio` — see [UPDATING.md](UPDATING.md)
for the monthly routine (it's written for the shop owners, not developers).

The Studio opens on a **visual editor** (Sanity's Presentation tool): the
live site with click-to-edit overlays, previewing draft changes before they
publish. It needs `SANITY_API_READ_TOKEN` (Viewer token) set in the
environment; without it the Studio's structure editing and the public site
still work, but the preview pane can't show drafts. Draft previews use
Next.js draft mode (`/api/draft-mode/enable`, wired in `sanity.config.ts`);
strings shown in previews carry invisible stega characters, so anything that
parses or compares Sanity strings must `stegaClean` first (see
`src/lib/hours.ts` for the pattern).

- **Events auto-expire**: the query floors at the start of today (America/New_York),
  and the section heading computes the current month — an unmaintained calendar
  drains gracefully instead of showing stale dates.
- **Tap list is Untappd's job** — the site links out rather than maintaining one.
- `seed/seed.ndjson` holds the original September 2026 import
  (`npx sanity dataset import seed/seed.ndjson production`).

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

## Design system

Everything lives in `src/app/globals.css` (`@theme inline` — there is no
tailwind.config). Badge-derived palette (cream/navy/amber + card washes),
Anton for uppercase poster headings, Roboto Condensed for calendar rows,
Geist for body. The badge logo is `public/logo.jpg` (also `src/app/icon.jpg`).

## Deploy

Vercel project `blue-ridge-beer-hub` (public repo, Hobby plan). Set
`NEXT_PUBLIC_SITE_URL` when the custom domain lands — metadata, sitemap,
robots, and JSON-LD all read it from `src/lib/site.ts`.
