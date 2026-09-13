#!/bin/bash
# Every behaviour origin/main (PRs #3/#4) shipped that a verbatim plan block would
# revert. Run against a git ref:  scripts/main-invariants.sh <ref> [--expect-na N]
#
# WHY THIS EXISTS
#   skylar/page-builder was authored before PRs #3/#4 merged, so the plans' verbatim
#   code blocks would silently revert shipped features. The branch's own visual gate
#   is structurally blind to this: it compares against a baseline captured ON the
#   branch, so both sides share the stale base and it reads green regardless.
#
# WHAT IT PROVES, AND WHAT IT DOES NOT
#   This is a SOURCE-LEVEL GREP. It proves the text is present, not that the
#   behaviour works. Pair it with a render check for anything behavioural.
#   Full-line comments are stripped before matching so a comment mentioning a
#   keyword cannot satisfy a check, but a string literal or dead code still can.
#
# VERDICTS (exit codes)
#   0  OK        every check ran and passed (n/a count matched --expect-na)
#   1  REGRESSION at least one check ran and failed
#   2  ERROR     bad usage, unreachable ref, or a self-test control unavailable
#   3  VACUOUS   the n/a count did not match --expect-na: some checks could not
#                run, so the result is untrustworthy rather than green
#
#   n/a is NEVER folded into a pass. A missing file means "not tested", and the
#   original prototype treated that as success -- the root commit, which contains
#   none of this code, printed ALL PRESENT. Legitimate n/a (src/lib/sections.ts
#   does not exist on origin/main) must be declared with --expect-na.
#
# SELF-TEST
#   scripts/main-invariants.sh --self-test
#   Proves the probe can fail before you trust it passing. Runs three controls:
#   positive (origin/main), negative (a ref predating the PRs), vacuous (root).
set -uo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "ERROR: not inside a git repository" >&2; exit 2; }
cd "$ROOT" || exit 2

ok=0; miss=0; na=0

get() { git show "$REF:$1" 2>/dev/null; }

check() { # file, name, pattern
  local src
  src=$(get "$1")
  if [ -z "$src" ]; then
    echo "  n/a  $2 (no $1 at $REF)"; na=$((na + 1)); return
  fi
  # Strip full-line comments: vocabulary is not syntax.
  if sed -E '/^[[:space:]]*(\/\/|\*|\/\*)/d' <<<"$src" | grep -qE "$3"; then
    echo "  ok   $2"; ok=$((ok + 1))
  else
    echo "  MISS $2"; miss=$((miss + 1))
  fi
}

run_checks() {
  local P='src/app/(site)/page.tsx'
  echo "== origin/main invariants @ $REF =="
  check "$P" "page: hourly ISR revalidate=3600"      'export const revalidate = 3600'
  check "$P" "page: hoisted from=startOfTodayIso()"  'const from = startOfTodayIso\(\)'
  check "$P" "page: fallback events filtered"        'upcomingEvents\(FALLBACK_EVENTS, from\)'
  check "$P" "page: skip link"                       'Skip to content'
  check "$P" "page: skip link target"                '<main id="main">'
  check src/components/GallerySection.tsx "gallery: responsive sizes"  'sizes="\(min-width: 1152px\) 360px'
  check src/components/AboutSection.tsx   "about: owner photo override" 'const photo = (block\.image|settings\.aboutImage)\?\.asset'
  check src/components/AboutSection.tsx   "about: responsive sizes"     'sizes="\(min-width: 768px\) 300px'
  check src/components/Header.tsx         "header: sr-only a11y fix"    'sm:not-sr-only'
  check src/sanity/queries.ts             "query: heroImage projected"  'heroImage\{asset'
  check src/sanity/queries.ts             "query: aboutImage projected" 'aboutImage\{asset'
  check src/sanity/schemaTypes/siteSettings.ts "schema: aboutImage field" 'name: "aboutImage"'
  check src/sanity/schemaTypes/siteSettings.ts "schema: email validation" 'rule\.email\(\)'
  check src/lib/sections.ts "adapter: hero photo from settings"  'settings\.heroImage'
  check src/lib/sections.ts "adapter: about photo from settings" 'settings\.aboutImage'
}

verdict() { # expect_na -> prints verdict, returns exit code
  local expect_na="$1" total=$((ok + miss + na))
  echo "  -- $total checks: $ok ok, $miss miss, $na n/a (expected n/a: $expect_na)"
  if [ "$miss" -gt 0 ]; then echo "REGRESSION at $REF"; return 1; fi
  if [ "$na" -ne "$expect_na" ]; then
    echo "VACUOUS at $REF: $na check(s) could not run, expected $expect_na."
    echo "  A check that cannot run is not a check that passed -- fix the path or"
    echo "  declare the expectation with --expect-na $na if it is legitimate."
    return 3
  fi
  echo "ALL PRESENT"; return 0
}

# ---------------------------------------------------------------- self-test --
self_test() {
  local fails=0
  need_ref() {
    git rev-parse --verify --quiet "$1^{commit}" >/dev/null || {
      echo "ERROR: self-test control ref '$1' is unreachable. Refusing to report" >&2
      echo "       a result from a control that did not run." >&2
      exit 2; }
  }
  local POS="${POSITIVE_REF:-origin/main}"
  local NEG="${NEGATIVE_REF:-9c07a8b}"
  local VAC; VAC=$(git rev-list --max-parents=0 HEAD | head -1)
  need_ref "$POS"; need_ref "$NEG"; need_ref "$VAC"

  echo "### SELF-TEST -- proving this probe can fail before you trust it passing"
  echo

  echo "--- POSITIVE control: $POS should be OK with 2 legitimate n/a ---"
  ok=0; miss=0; na=0; REF="$POS"; run_checks >/dev/null; verdict 2 >/dev/null
  local rc=$?
  if [ $rc -eq 0 ]; then echo "  PASS (exit 0, $ok ok / $miss miss / $na n/a)"
  else echo "  FAIL: expected exit 0, got $rc ($ok ok / $miss miss / $na n/a)"; fails=$((fails+1)); fi

  echo "--- NEGATIVE control: $NEG predates the PRs, must REGRESS ---"
  ok=0; miss=0; na=0; REF="$NEG"; run_checks >/dev/null; verdict 2 >/dev/null
  rc=$?
  if [ $rc -eq 1 ] && [ "$miss" -gt 0 ]; then echo "  PASS (exit 1, $miss miss)"
  else echo "  FAIL: expected REGRESSION, got exit $rc ($ok ok / $miss miss / $na n/a)"; fails=$((fails+1)); fi

  echo "--- VACUOUS control: root commit $VAC has no src/, must NOT read green ---"
  ok=0; miss=0; na=0; REF="$VAC"; run_checks >/dev/null; verdict 0 >/dev/null
  rc=$?
  if [ $rc -eq 3 ]; then echo "  PASS (exit 3 VACUOUS, $na n/a -- the prototype printed ALL PRESENT here)"
  else echo "  FAIL: expected VACUOUS exit 3, got $rc ($ok ok / $miss miss / $na n/a)"; fails=$((fails+1)); fi

  echo
  if [ $fails -eq 0 ]; then echo "SELF-TEST PASSED: the probe discriminates."; return 0
  else echo "SELF-TEST FAILED ($fails control(s) wrong): do not trust this probe's verdict."; return 1; fi
}

# -------------------------------------------------------------------- main --
usage() { echo "usage: scripts/main-invariants.sh <git-ref> [--expect-na N]"; echo "       scripts/main-invariants.sh --self-test"; }

[ $# -eq 0 ] && { usage >&2; exit 2; }
if [ "$1" = "--self-test" ]; then self_test; exit $?; fi
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then usage; exit 0; fi

REF="$1"; shift
EXPECT_NA=0
while [ $# -gt 0 ]; do
  case "$1" in
    --expect-na) EXPECT_NA="${2:?--expect-na needs a number}"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done
case "$EXPECT_NA" in ''|*[!0-9]*) echo "--expect-na must be a non-negative integer" >&2; exit 2 ;; esac

git rev-parse --verify --quiet "$REF^{commit}" >/dev/null || {
  echo "ERROR: '$REF' is not a reachable commit. Refusing to report a verdict" >&2
  echo "       for a ref that does not exist (that is how a probe reads green" >&2
  echo "       while testing nothing)." >&2; exit 2; }

run_checks
verdict "$EXPECT_NA"
