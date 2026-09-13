# Page builder + To Go block — design

Decided in a grilling session, 2026-09-12. This is the source of truth the
implementation plans argue from.

## Goal

Owners (Jason & Charlotte, non-technical) compose the homepage themselves:
add, hide, reorder, remove sections, and configure each one, with no developer
in the loop. First new section: **To Go** — what's new and available now in
the coolers (cans, bottles, cases, build-your-own packs), with 1–3 photos.

## Rulings

| #      | Decision                                                                                                                                                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1     | To Go = evergreen carryout pitch **plus** an optional "just in" list that hides when empty.                                                                                                                                                      |
| Q2/Q11 | Full page builder. New singleton document **Home Page** (`_id: "homePage"`) with `sections[]`. Site Settings keeps identity, contact, hours, links, announcement, pipeline emails.                                                               |
| Q12    | Blocks: Hero, Events, On Tap, Offerings, Photo Gallery, About, Feature (To Go), Mountain Divider. Fixed chrome, not blocks: announcement banner, header, hours footer.                                                                           |
| Q13    | Rollout: code ships an **adapter** that synthesizes sections from legacy Site Settings fields when no Home Page doc exists; a **migration script** (dry-run default, `--apply` to write) makes it permanent.                                     |
| Q14    | Header nav derived from visible blocks; each block has an optional **Menu label** (overrides default label; for Feature blocks, empty = not in menu). `#hours` always last.                                                                      |
| Q15    | Feature layout follows photo count (1 = big photo beside text, 2 = pair, 3 = strip) plus one explicit choice: **photo side** left/right. No styling knobs (background, spacing) on any block.                                                    |
| Q16    | Light validation: at least one section; warning (not error) when Events or Gallery appears twice. No locked blocks.                                                                                                                              |
| Q17    | Reorder via Studio array drag handles (floor). On-page insert/move overlays are a bounded stretch experiment.                                                                                                                                    |
| Q18    | Two stacked PRs: (1) builder refactor, page pixel-identical; (2) Feature block. A small PR3 removes the shims after migration.                                                                                                                   |
| Q19    | Feature list = free-text lines, max 8, optional heading (default "Just in"), optional owner-set **as-of date** shown as "Updated Sep 12", no auto-hide. Optional link: label + URL (https, mailto, tel).                                         |
| Q21    | Hero and About get their own `image` fields. Migration copies the pinned asset refs in and **deletes** the two pinned Gallery Photo docs (`galleryImage-tap-handles`, `galleryImage-owners-open-flag`). Gallery query exclusion stays until PR3. |
| Q22    | Every block has **Hide for now** (`hiddenOnSite`).                                                                                                                                                                                               |
| Q23    | Migration seeds the To Go block **hidden**, with drafted copy and the bar-stools photo (`galleryImage-bar-stools` asset) as placeholder. Script runs once, after PR2 deploys.                                                                    |
| Q24    | Legacy Site Settings fields stay **visible and unchanged** through PR1/PR2 (hiding them would break the form during the adapter window; see Deviations). PR3 removes fields, adapter, exclusion list, and unsets data.                           |
| Q25    | Migration writes the Home Page doc **published** directly. Dry-run diff is the review.                                                                                                                                                           |
| Q26    | Guide figures captured through Skylar's logged-in Chrome against the local Studio, then `scripts/guide-figures.mjs`.                                                                                                                             |
| Q4     | Drop the "Build-your-own six-packs" default tap perk. On Tap second line gets an optional link label that jumps to the **nearest following** Feature block.                                                                                      |

## Assumptions (accepted)

- Branches: `skylar/page-builder` off `a5ddd2e`, then `skylar/to-go-section` stacked.
- Untappd URL stays on Site Settings; Hero and On Tap blocks read it.
- Migration places Mountain Divider blocks after Hero and after About (where the ridgelines sit today).
- Anchors: hero `top`, on tap `tap`, events `events`, about `about`, gallery `photos`, offerings `offer`; Feature = slug of menu label, else `section-<key>`. Collisions get `-2`, `-3`.
- Nav order = page order.
- To Go copy drafted in the site's voice; owners edit.
- Feature layouts designed reference-first (skylar-taste), ruled on the rendered dev server.
- Tests first for adapter, nav derivation, edit-scope path building, feature helpers.

## Deviations from the rulings, with reasons

- **Q24**: hiding legacy fields in PR1 would break click-to-open-form for numbers (tap count) during the adapter window, because the overlay jumps to a hidden field. So they stay visible until PR3. Window is short: run migration, ship PR3 same day.
- **Presentation main document** stays Site Settings in PR1/PR2; PR3 flips it to Home Page. Before migration there is no Home Page doc to open.

## Block field sets

Common (every block): `hiddenOnSite: boolean`, `menuLabel?: string`.

- **heroBlock**: `heading` (multiline string), `subheading` (text), `primaryCta`, `secondaryCta`, `image` (image+alt).
- **eventsBlock**: `heading`, `weeklyHeading`. Events/weekly docs fetched at page level.
- **onTapBlock**: `heading`, `blurb`, `secondary`, `secondaryLinkLabel`, `cta`, `tapCount` (number), `tapCountLabel`, `tapCountFootnote`, `perks[]` (max 5).
- **offeringsBlock**: `heading`, `cards[]{title, description}`.
- **galleryBlock**: `heading`. Photos remain Gallery Photo docs.
- **aboutBlock**: `heading`, `body` (portable text, normal style only), `credentials[]` (max 4), `image` (image+alt).
- **dividerBlock**: no fields.
- **featureBlock** (PR2): `eyebrow`, `heading`, `body` (text; blank line = paragraph), `photos[]` (1–3, image+alt), `photoSide` ("left"|"right", default right), `listHeading`, `listItems[]` (max 8), `listAsOf` (date), `ctaLabel`, `ctaUrl`.

## Legacy field map (adapter + migration)

| Block field            | Site Settings field                                                         |
| ---------------------- | --------------------------------------------------------------------------- |
| hero.heading           | heroHeading                                                                 |
| hero.subheading        | heroSubheading                                                              |
| hero.primaryCta        | heroPrimaryCta                                                              |
| hero.secondaryCta      | heroSecondaryCta                                                            |
| hero.image             | pinned asset `image-600687a3a1747959048b8eb3b14f917ad2e3073b-2560x1707-jpg` |
| events.heading         | eventsHeading                                                               |
| events.weeklyHeading   | weeklyHeading                                                               |
| onTap.heading          | onTapHeading                                                                |
| onTap.blurb            | onTapBlurb                                                                  |
| onTap.secondary        | onTapSecondary                                                              |
| onTap.cta              | onTapCta                                                                    |
| onTap.tapCount         | tapCount                                                                    |
| onTap.tapCountLabel    | tapCountLabel                                                               |
| onTap.tapCountFootnote | tapCountFootnote                                                            |
| onTap.perks            | tapPerks                                                                    |
| offerings.heading      | offeringsHeading                                                            |
| offerings.cards        | offerings                                                                   |
| gallery.heading        | galleryHeading                                                              |
| about.heading          | aboutHeading                                                                |
| about.body             | aboutBody                                                                   |
| about.credentials      | credentials                                                                 |
| about.image            | pinned asset `image-fc66f7f4d741bb78af4b98b31f4514f36047adc9-2048x2560-jpg` |

## Editing model

`Editable` resolves its write target from the stega on the string. During the
adapter window, strings come from Site Settings and carry Site Settings
paths, so on-page typing keeps working unchanged. For copy that has no stega
(defaults, fallback), components pass an **EditScope**: `{documentId,
documentType, field(name) → path}`. Legacy scope maps `heading` →
`onTapHeading`; block scope maps `heading` → `sections[_key=="k"].heading`.

## PR3 (after migration, not planned in detail here)

Remove `sectionsFromSettings` adapter and legacy field map; remove legacy
fields from the Site Settings schema; remove the gallery-query exclusion
list; flip Presentation main document to Home Page; script unsets legacy
data; `FALLBACK_SECTIONS` becomes an explicit array; update `seed/seed.ndjson`.
