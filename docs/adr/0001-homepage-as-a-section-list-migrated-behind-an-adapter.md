---
status: accepted
date: 2026-09-12
---

# Compose the homepage from a Home Page section list, migrated behind an adapter

The homepage was a fixed stack of React components reading flat fields on the Site Settings singleton, and the owners wanted to add, hide, and reorder sections without a developer. We decided the page is a `homePage` singleton holding `sections[]` of typed section objects, with the announcement banner, header, and hours footer as fixed chrome; the header menu is derived from the visible sections so no menu entry can point at a section that is gone. Because the live dataset already holds the copy in the flat fields and no write token lives on developer machines, the code ships with a legacy adapter that synthesizes the same sections from Site Settings whenever no Home Page document exists, and a one-shot, dry-run-by-default migration script writes that document later; the adapter, the legacy fields, and the pinned-photo exclusion in the gallery query are removed in a follow-up once the migration has run.

## Considered options

- **One reusable section in a fixed slot** after On Tap. Rejected: the owners asked to place sections anywhere and to turn every existing section into a movable one.
- **Sections array on Site Settings** instead of a new document. Rejected: Site Settings already has nine tabs; owners need "the page" and "the business info" as two clearly separate places.
- **Big-bang migration** (drop the legacy fields in the same release that adds the document). Rejected: the site would render blank between deploy and migration, and the deploy would be gated on someone holding an Editor token.

## Consequences

- During the window between deploy and migration, copy lives in two places and on-page edits keep writing to Site Settings; the editor's default document stays Site Settings until the follow-up.
- Photo layouts and other presentation choices are fixed per section kind; sections carry content choices only, no background or spacing knobs, so the design stays coherent as owners rearrange.
