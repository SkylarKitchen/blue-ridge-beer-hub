---
status: accepted
date: 2026-09-13
---

# CI runs tests, typecheck and lint, but not the build

The repo had never had CI: across 137 commits on 15 branches no workflow, hook or lint-staged config had ever existed, `main` was unprotected, and the only automation was Vercel's install-and-build plus the daily cron. Because `next lint` was removed in Next 16, `next build` gates nothing, and the "Vercel" check on a PR is a deploy-preview status rather than a test or lint result. So `npm test`, `npm run lint` and `tsc --noEmit` ran only when a person or an agent chose to run them, on one Mac, and reported the outcome in prose — every "99 passing, tsc 0, lint 0" in the issue history is a self-report with nothing binding a test count to a SHA. That is a statement about verifiability rather than honesty, but it is the reason three hand-rolled verification gates now exist in this repo, each of which shipped a false green of its own before being fixed. We decided to add a single `ubuntu-latest` job on push-to-main and every pull request that runs `npm ci`, `npm test`, `npm run typecheck` and `npm run lint -- --max-warnings=0`, pinning Node via `.nvmrc` and an `engines` floor of 22.18 because the suite depends on unflagged `.ts` type stripping and `node --test` globs that Node 20 lacks. Each gate was verified to go red on a deliberately broken tree before the workflow landed, on the principle that a gate never observed failing is not a gate.

## Considered options

- **`next build` in CI.** Rejected: Vercel already builds every pull request as a deploy preview, so it duplicates that signal, and the homepage is statically rendered against the live Sanity API — a gate that reddens when a third-party API blips teaches people to ignore red. Revisit if deploy previews are ever turned off.
- **Wiring `main-invariants.sh` and `drift-check.sh` into the job.** Rejected: both are branch-lifetime tools whose controls are pinned to the pre-merge world. `main-invariants`' positive control asserts that `src/lib/sections.ts` is *absent* on `origin/main`, which stops being true the moment `skylar/page-builder` merges, so the gate would turn red on merge for reasons unrelated to code quality. They stay hand-run (`npm run main-invariants -- --self-test`).
- **Branch protection with required status checks.** Deferred, not rejected: it changes repo settings and gates everyone's merges, which is the owner's call rather than an agent's, and merging here is already human-only.
- **Recording the absence as deliberate and closing the question (`wontfix`).** Rejected: nothing anywhere recorded such a decision, the written mentions all read as an acknowledged gap, and the four checks together cost under five seconds.

## Consequences

- A red CI run is now the signal, so ticket comments should cite the run rather than a locally-observed count; a self-reported test count on a PR that CI has not run is no longer the best available evidence.
- `@sanity/client` is now a declared dependency. It was imported in `src/` and `scripts/` but absent from the manifest, resolving only by accidental hoist from `@sanity/vision` and `@sanity/visual-editing` at 8.4.0 while `@sanity/mutate` nested its own 7.26.2. A clean `npm ci` did in fact resolve it, so this is a latent-risk fix rather than a break repair.
- Local `npm run lint` stays bare while CI passes `--max-warnings=0`. The repo has zero warnings today, so the stricter gate is free now and prevents silent drift, at the cost of local and CI lint differing in strictness.
- Contributors on Node 20 will now be warned by `engines` rather than discovering the floor through a confusing `npm test` failure.
