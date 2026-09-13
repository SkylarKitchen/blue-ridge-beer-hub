<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Workflow

Solo project: Skylar is the only human, and the agent sessions are not a second
team. Trunk-based: commit small, straight to `main`, and push right away. A
rejected push means `git pull --no-rebase`, then push again (the checkout is
shared and usually dirty, so a rebase would refuse). A pull request, ticket,
claim comment or new verification gate happens only when Skylar asks for one.

Domain vocabulary is in `CONTEXT.md`, recorded decisions in `docs/adr/`; use
the glossary's terms.
