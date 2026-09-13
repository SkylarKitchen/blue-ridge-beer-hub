# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/matt-triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/matt-wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Hold**: a ticket is held while it is open and has an assignee, whoever set it. Which session holds it is the **claim read**, oldest first: `gh api --paginate repos/{owner}/{repo}/issues/<n>/comments --jq '.[] | select(.body | ascii_downcase | contains("claimed by")) | "\(.id)\t\(.created_at)\t\(.body | split("\n")[0])"'`. A line is **live** when its `created_at` is at or after the ticket's latest `assigned` or `reopened` event (`gh api --paginate repos/{owner}/{repo}/issues/<n>/timeline --jq '.[] | select(.event == "assigned" or .event == "reopened") | .created_at' | tail -1`; empty when never assigned, and second-granular, so a claim in the same second as the assign is live); the **holder** is the first live line. A held ticket with no live line, or whose holder is absent from `ListAgents`, is stale: report it in the map's Notes rather than taking it, recording what you saw — no claim line, a retired one, an absent holder — because a read that matched nothing and a ticket nobody claimed are indistinguishable. A human unassigning frees it.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or that is **held**; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write, immediately followed by a claim comment `Claimed by session <id> at <UTC time>` (`gh issue comment <n> --body …`). Every agent session on this machine assigns the same GitHub login, so the assignee alone cannot tell two sessions apart; the comment's session id and timestamp are the tiebreak. Re-read with the claim read after posting, and again before your first commit — an immediate re-read cannot see a competitor's request still in flight, so a clean one does not establish a sole claim. `<id>` is the `name [ref]` on the first line of `ListAgents`, copied verbatim (`blue-ridge-beer-hub-f7 [a76a00]`) — also the address `SendMessage` reaches the holder at; without `ListAgents`, the session UUID from the scratchpad path. `<UTC time>` is `$(date -u +%FT%TZ)`. You hold the ticket when yours is the first live line, and yield when any live line is older. Work without a claim yields to whoever claimed, however far along it is.
- **Yield**: delete your own claim comment by its id from the claim read, `gh api --method DELETE repos/{owner}/{repo}/issues/comments/<id>`, and leave the assignee — it is the holder's stamp too. On the shared login `gh issue edit --remove-assignee @me`, `gh issue comment --delete-last` and `--edit-last` all strike the holder's, not yours, so address a comment by its id. Revert your edits and re-run the frontier query.
- **Release**: the holder handing back a ticket it has not finished (handoff, session ending) posts `Released by session <id> at <UTC time>: <where the work stands>`, then `gh issue edit <n> --remove-assignee @me`, which frees it. Releasing and re-claiming is ordinary; the re-claim's own `assigned` event retires the earlier line, so claim again in full, comment included. Every claim ends in Resolve or Release before its session does.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
