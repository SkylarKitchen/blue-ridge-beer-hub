#!/bin/bash
#
# drift-check.sh — does this branch quietly revert something main shipped?
#
# Written after a real incident. A long-lived plan on skylar/page-builder had
# its code blocks written against main as it stood when the plan was drafted.
# main then moved (PRs #3 and #4), and following the plan verbatim would have
# silently reverted an owner-uploadable hero photo, a skip-to-content link, a
# header accessibility fix, image `sizes` attributes and hourly ISR — none of
# which any test in this repo asserts, so the whole suite stayed green.
#
# The branch's own visual gate could not see it either: it compared the
# rendered page against a baseline captured ON THE BRANCH, so both sides
# shared the stale base. A gate like that reads green no matter how much of
# main gets reverted. This script exists to ask the other question.
#
# Usage:
#   scripts/drift-check.sh                 # check HEAD against origin/main
#   scripts/drift-check.sh <base-html>     # also diff the rendered page
#   npm run drift-check
#
# Env:
#   MAIN=origin/main   the branch to protect (default origin/main)
#   URL=http://localhost:3000/   page for the optional render gate
#
# Exit 0 = nothing to answer for. Exit 1 = something needs a named ruling.
# A finding is NOT automatically a bug: a deliberate refactor may move a
# line's responsibility somewhere better. But each one needs a human reason,
# not silence.

set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1

MAIN="${MAIN:-origin/main}"
URL="${URL:-http://localhost:3000/}"
BASE_HTML="${1:-}"
fail=0

# The Bash tool's shell replaces `grep` with a ugrep wrapper that honours
# .gitignore, so a recursive grep over an ignored path returns nothing and
# exits 1 — indistinguishable from an honest "no match". Everything here is
# line-oriented over pipes rather than path traversal, but pin the real
# binary anyway: this script's whole job is to be believed.
GREP=/usr/bin/grep
[ -x "$GREP" ] || GREP=grep

git rev-parse --verify -q "$MAIN" >/dev/null || {
  echo "drift-check: $MAIN not found. Run: git fetch origin"; exit 2; }

BASE="$(git merge-base "$MAIN" HEAD)"

# Strip indentation and lines too generic to match meaningfully — closing
# braces, bare tags, comment enders. They appear everywhere and would pair up
# by accident.
norm() {
  sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
    | $GREP -vE '^$|^[});,{>/]+$|^\*/?$|^//$|^<[a-zA-Z/]*>?$|^\]+;?$'
}

added_by_main() {   # lines $MAIN added since the branch point
  git diff "$1" "$MAIN" -- "${2:-.}" | $GREP '^+' | $GREP -v '^+++' | sed 's/^+//' | norm | sort -u
}

echo "drift-check: HEAD=$(git rev-parse --short HEAD)  $MAIN=$(git rev-parse --short "$MAIN")"
echo

# ---------------------------------------------------------------------------
# Self-test. Per the incident: a check nobody has watched fail is not
# evidence, and "clean" is indistinguishable from "could not look". The
# POSITIVE control is the one that catches a broken instrument — a blinded
# grep reports everything missing, not everything fine.
# ---------------------------------------------------------------------------
echo "== self-test =="
pos="$(added_by_main "$MAIN" | wc -l | tr -d ' ')"          # main vs itself: must be 0
neg="$(added_by_main "$BASE" | wc -l | tr -d ' ')"          # base vs main: must be > 0 if main moved
if [ "$pos" -ne 0 ]; then
  echo "  FAIL: comparing $MAIN to itself found $pos added lines. The diff logic is wrong."
  exit 2
fi
echo "  negative control ok ($MAIN vs itself: 0 spurious findings)"
if [ "$neg" -eq 0 ]; then
  if git merge-base --is-ancestor "$MAIN" HEAD && [ "$BASE" = "$(git rev-parse "$MAIN")" ]; then
    echo "  positive control n/a: branch is directly on $MAIN, which has added nothing since."
  else
    echo "  WARNING: $MAIN added nothing since the branch point. Either that is true, or the"
    echo "  probe cannot read the repo. Verify by hand before trusting a clean result below."
  fi
else
  echo "  positive control ok (can see $neg line(s) $MAIN added since $(git rev-parse --short "$BASE"))"
fi
echo

# ---------------------------------------------------------------------------
# The main gate. Two shapes, because the right question changes once the
# branch has been rebased.
# ---------------------------------------------------------------------------
if git merge-base --is-ancestor "$MAIN" HEAD; then
  # REBASED. main is an ancestor, so every line the branch deletes really is a
  # deletion from main — no guessing. But most deletions are the legitimate
  # refactor, so intersect with what main added RECENTLY. That intersection is
  # the risk set: lines main shipped that this branch then took back out.
  echo "== $MAIN is an ancestor: lines $MAIN added recently that this branch removes =="
  # This needs a HORIZON: the version of $MAIN the branch's code was actually
  # written against. After a rebase that is unrecoverable from the branch alone
  # — merge-base is just main's tip — so it has to be supplied or guessed, and
  # a wrong guess makes this whole gate report PASS while blind.
  #
  # The obvious guess, "$MAIN as of the branch's first commit date", is WRONG on
  # a merge-based workflow and was caught doing exactly that here: PR #4's work
  # was committed at 18:50:05, three seconds before this branch started, but
  # only merged to main at 19:08. A date horizon lands after the commits exist
  # and sees none of them. Commit date is not merge date.
  #
  # So: guess, then PROVE the guess can see something. If it cannot, refuse to
  # report anything rather than printing a PASS nobody should believe.
  if [ -z "${HORIZON:-}" ]; then
    first="$(git rev-list "$MAIN"..HEAD | tail -1)"
    if [ -n "$first" ]; then
      started="$(git log -1 --format=%aI "$first")"
      HORIZON="$(git rev-list -1 --before="$started" --first-parent "$MAIN")"
    fi
    HORIZON="${HORIZON:-$(git merge-base "$MAIN" HEAD)}"
  fi
  if [ -z "$(git rev-list "$MAIN"..HEAD)" ]; then
    echo "  PASS: this branch adds nothing on top of $MAIN — nothing to check."
    exit 0
  fi
  seen="$(added_by_main "$HORIZON" | wc -l | tr -d ' ')"
  echo "   horizon: $(git rev-parse --short "$HORIZON") ($seen line(s) $MAIN added since)"
  if [ "$seen" -eq 0 ]; then
    echo
    echo "  CANNOT VERIFY — the horizon sees nothing $MAIN added, so this gate has"
    echo "  nothing to compare against and a PASS here would be meaningless."
    echo "  Supply the commit this branch's work was written against:"
    echo "      HORIZON=<ref> scripts/drift-check.sh"
    echo "  (the branch's pre-rebase base; a backup/* ref or reflog often has it)"
    exit 2
  fi
  removed="$(git diff "$MAIN"..HEAD | $GREP '^-' | $GREP -v '^---' | sed 's/^-//' | norm | sort -u)"
  risk="$(comm -12 <(added_by_main "$HORIZON") <(printf '%s\n' "$removed"))"
  if [ -z "$risk" ]; then
    echo "  PASS: this branch removes nothing $MAIN recently added."
  else
    echo "  $(printf '%s\n' "$risk" | wc -l | tr -d ' ') line(s) need a named ruling:"
    printf '%s\n' "$risk" | sed 's/^/      | /'
    echo
    echo "  Locate each with: git diff $MAIN..HEAD -S'<line>'"
    fail=1
  fi
else
  # NOT REBASED. main is not an ancestor, so the branch may simply never have
  # had main's line. "Absent" is NOT "removed" here — a distinction that cost
  # a real review a false accusation. Report per file, and only for files both
  # sides touched: a file only main changed merges cleanly and cannot be lost.
  echo "== $MAIN is NOT an ancestor: lines $MAIN has that this branch lacks =="
  echo "   (the branch may never have had them — absent is not removed)"
  both="$(comm -12 \
    <(git diff --name-only "$BASE" "$MAIN" | sort -u) \
    <(git diff --name-only "$BASE" HEAD | sort -u))"
  if [ -z "$both" ]; then
    echo "  PASS: no file changed on both sides; nothing can be reverted."
  else
    for f in $both; do
      [ -e "$f" ] || { echo "  [GONE]    $f"; fail=1; continue; }
      body="$(norm < "$f")"
      miss=""
      while IFS= read -r line; do
        # `--` matters: main's Markdown bullets start with "-" and grep would
        # otherwise read the line as options and abort the whole file.
        $GREP -qxF -- "$line" <<<"$body" || miss+="      | ${line}"$'\n'
      done <<<"$(added_by_main "$BASE" "$f")"
      if [ -n "$miss" ]; then
        echo "  [MISSING] $f — $(printf '%s' "$miss" | $GREP -c .) line(s):"
        printf '%s' "$miss" | head -12
        fail=1
      fi
    done
    [ "$fail" -eq 0 ] && echo "  PASS: every line $MAIN added is present here."
  fi
fi
echo

# ---------------------------------------------------------------------------
# Optional render gate. Answers a DIFFERENT question — "did my refactor change
# the page" — and is blind to everything above, because it compares the branch
# to a baseline captured on the branch. Never let a green here stand in for
# the gate above.
# ---------------------------------------------------------------------------
if [ -n "$BASE_HTML" ]; then
  echo "== rendered markup vs $BASE_HTML =="
  if ! curl -sf -o /dev/null "$URL"; then
    echo "  SKIPPED: nothing serving $URL"
  else
    # Strip <script> first. React's Flight payload lives there and its row ids
    # shift whenever a component boundary changes, so a raw byte diff
    # false-positives on a pure refactor.
    strip() { python3 -c "
import re,sys
sys.stdout.write(re.sub(r'<script.*?</script>','',sys.stdin.read(),flags=re.S))
"; }
    a="$(mktemp)"; b="$(mktemp)"
    strip < "$BASE_HTML" > "$a"
    curl -s "$URL" | strip > "$b"
    if cmp -s "$a" "$b"; then
      echo "  PASS: markup byte-identical"
    else
      echo "  DIFFER: markup changed — expected only if this branch means to change it."
      diff <(tr '>' '>\n' < "$a") <(tr '>' '>\n' < "$b") | head -30
      fail=1
    fi
    rm -f "$a" "$b"
  fi
  echo
fi

if [ "$fail" -ne 0 ]; then
  echo "drift-check: findings above need a ruling. A deliberate refactor that"
  echo "moves a line's responsibility elsewhere is a fine answer — record it."
fi
exit $fail
