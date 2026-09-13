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

The homepage runs five GROQ queries (site settings, dated events, weekly
events, gallery, home page). If Sanity is unreachable or empty,
`src/lib/fallback.ts` serves a baked-in copy of everything so the page
always renders. Content editing happens in the Studio at `/studio` — see
[UPDATING.md](UPDATING.md) for the monthly routine (it's written for the shop
owners, not developers). The live site serves that same file at `/guide`, so
the owners get one link rather than a file. The page
(`src/app/guide/page.tsx`) renders the markdown with a few extras —
screenshots become captioned figures, `**Tip:**` /
`**Heads up:**` / `**Note:**` blockquotes become callouts, a list of links
becomes task cards, and `##` headings feed an "On this page" sidebar — while
the file stays readable on GitHub as-is. The screenshots live in
`public/guide/` and are cut from raw Studio captures by
`scripts/guide-figures.mjs`, which also draws the numbered callouts and
writes `src/app/guide/figures.json` (image sizes, so the page reserves the
space before images load). After a Studio change, re-capture at a 1384×853
viewport on a 2x display and re-run the script; the callout coordinates are
all in that file.

The Studio opens on a **visual editor** (Sanity's Presentation tool): the
live site with the text editable in place, previewing draft changes before
they publish. It needs `SANITY_API_READ_TOKEN` (Viewer token) set in the
environment; without it the Studio's structure editing and the public site
still work, but the preview pane can't show drafts. Draft previews use
Next.js draft mode (`/api/draft-mode/enable`, wired in `sanity.config.ts`);
strings shown in previews carry invisible stega characters, so anything that
parses or compares Sanity strings must `stegaClean` first (see
`src/lib/hours.ts` for the pattern).

- **Events auto-expire**: the query floors at the start of today (America/New_York),
  and the section heading computes the current month — an unmaintained calendar
  drains gracefully instead of showing stale dates. Sanity Live only re-renders
  on content changes, so the page also sets `revalidate = 3600`; without it a
  quiet week would keep last Saturday's show on the page.
- **Two photos are pinned by asset ID** (hero tap handles, owners in About) as
  defaults; owners can override either from Site Settings → Top of Page /
  About without touching code.
- **Tap list is Untappd's job** — the site links out rather than maintaining one.
- `seed/seed.ndjson` holds the original September 2026 import
  (`npx sanity dataset import seed/seed.ndjson production`).

The homepage is composed from `homePage.sections[]`, an array of typed block
objects (`src/sanity/schemaTypes/blocks/`). `src/lib/sections.ts` holds the
block types, anchor and header-menu derivation, and the legacy adapter that
synthesizes the same blocks from the flat Site Settings fields when no Home
Page document exists yet. `scripts/migrate-to-sections.ts` writes that
document once (dry run by default). After it has run, the adapter, the legacy
fields, and the pinned-photo exclusion in `GALLERY_QUERY` can be removed.
`featureBlock` is the reusable words-plus-photos section; layout follows the
photo count (`src/lib/feature.ts`). `/dev/blocks` renders every layout in
development.

### Editing on the page

Copy is wrapped in `<Editable>` (`src/components/Editable.tsx`), which reads
`draftMode()` and renders plain text on the live site — visitors get the same
markup and none of the editing JavaScript. Inside a preview it renders
`EditableField`, a `contentEditable` span that:

- reads through `useOptimistic` from `@sanity/visual-editing/react`, so a
  change made in the Studio form shows up with no server round trip, and
- writes through `useDocuments().patch`, committing on a 700ms debounce.

The write target comes from the stega payload already on the string — no
document ids to thread through — decoded by `src/lib/editable.ts`. Pass
`path` as well for copy the owners have never touched: a field that's still
empty has no stega, and would otherwise be the one thing unreachable from the
page. Two consequences worth knowing:

- The text inside an editable span is `stegaClean`ed, or typing would write
  the invisible characters back into the document. That also hides it from
  the click-to-edit overlay (intentional — an intercepted click can't place a
  caret), which is why `EditableField` registers its document for optimistic
  updates by hand rather than relying on the overlay's own scan.
- Values that aren't strings carry no stega at all. The tap count uses a
  `data-sanity` attribute (`editAttribute`) so the overlay can still open
  it in the Studio pane.

About paragraphs are Portable Text; `simpleBlockText` only makes a block
editable when it's a single unformatted run, so a paragraph carrying a link
or bold text keeps the real serializer rather than risking a flatten.

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

Vercel project `blue-ridge-beer-hub` (public repo, Hobby plan). The canonical
origin is `https://www.brbeerhub.com` (`src/lib/site.ts`); metadata, sitemap,
robots, JSON-LD, and pipeline emails all read it. Set `NEXT_PUBLIC_SITE_URL`
only to override it on preview deployments.
