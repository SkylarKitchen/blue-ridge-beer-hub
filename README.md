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

- **Events auto-expire**: the query floors at the start of today (America/New_York),
  and the section heading computes the current month — an unmaintained calendar
  drains gracefully instead of showing stale dates.
- **Tap list is Untappd's job** — the site links out rather than maintaining one.
- `seed/seed.ndjson` holds the original September 2026 import
  (`npx sanity dataset import seed/seed.ndjson production`).

## Design system

Everything lives in `src/app/globals.css` (`@theme inline` — there is no
tailwind.config). Badge-derived palette (cream/navy/amber + card washes),
Anton for uppercase poster headings, Roboto Condensed for calendar rows,
Geist for body. The badge logo is `public/logo.jpg` (also `src/app/icon.jpg`).

## Deploy

Vercel project `blue-ridge-beer-hub` (public repo, Hobby plan). Set
`NEXT_PUBLIC_SITE_URL` when the custom domain lands — metadata, sitemap,
robots, and JSON-LD all read it from `src/lib/site.ts`.
