#!/bin/bash
# Every behaviour origin/main (PRs #3/#4) shipped that a verbatim plan block would
# revert.
#
#   scripts/main-invariants.sh <ref> [--allow-missing <path>]...
#   scripts/main-invariants.sh --worktree [--allow-missing <path>]...
#   scripts/main-invariants.sh --self-test
#
# WHY THIS EXISTS
#   skylar/page-builder was authored before PRs #3/#4 merged, so the plans' verbatim
#   code blocks would silently revert shipped features. The branch's own visual gate
#   is structurally blind to this: it compares against a baseline captured ON the
#   branch, so both sides share the stale base and it reads green regardless.
#
# WHAT IT PROVES, AND WHAT IT DOES NOT
#   A source-level grep. It proves the text is present, not that the behaviour works.
#   Comments are stripped before matching (real block/line/JSX stripping, not a
#   line-anchored regex), so commented-out code cannot satisfy a check. A string
#   literal or dead-but-uncommented code still can. Pair with a render check for
#   anything behavioural.
#
# VERDICTS (exit codes)
#   0  OK          every check ran and passed
#   1  REGRESSION  at least one check ran and failed
#   2  ERROR       bad usage, unreachable ref, degenerate pattern, missing tool
#   3  VACUOUS     a check could not run and was not declared with --allow-missing,
#                  or zero checks ran. Never folded into a pass.
#
#   n/a is an identity, not a count. --allow-missing names the PATH that is
#   legitimately absent (src/lib/sections.ts is branch-only, so it is absent on
#   origin/main). A count would let a deleted schema file trade places with it and
#   still read green.
#
# KNOWN LIMITATIONS (documented rather than silently present)
#   - Dead-but-uncommented code satisfies a check ("const X = 3600" style).
#   - Two checks on one file cannot tell WHERE in the file the match was, except
#     where check_after windows it. A matching line relocated into an unrelated
#     query or field can still satisfy a broad pattern.
#   - `//` inside a string literal is stripped unless preceded by ":" (so https://
#     survives). A non-URL "//" in a string could be mangled; none of these 15
#     patterns depends on one.
set -uo pipefail

command -v perl >/dev/null 2>&1 || { echo "ERROR: perl is required" >&2; exit 2; }

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "ERROR: not inside a git repository" >&2; exit 2; }
cd "$ROOT" || exit 2

EXPECTED_CHECKS=23   # pinned: the self-test fails if run_checks stops matching this

ok=0; miss=0; na=0; total=0
NA_FILES=""; OK_NAMES=""; MISS_NAMES=""
MODE="ref"; REF=""; WHERE=""
ALLOWED=""

# Strip real comments: /* ... */ spans (JSX {/* */} included) and // to end of line,
# except "//" preceded by ":" so URLs survive. A line-anchored sed cannot do this --
# trailing, mid-line and multi-line comments all survived it, and each one made a
# check pass with the shipped code deleted.
strip_comments() { perl -0777 -pe 's{/\*.*?\*/}{}gs; s{(?<!:)//[^\n]*}{}g'; }

reject_degenerate() { # pattern, name
  case "$1" in
    ''|'.'|'.*'|'^'|'$'|'.+')
      echo "ERROR: degenerate pattern for '$2' -- it matches everything, so the" >&2
      echo "       check cannot fail and is not a check." >&2; exit 2 ;;
  esac
}

path_exists() {
  if [ "$MODE" = "worktree" ]; then [ -f "$1" ]
  else git cat-file -e "$REF:$1" 2>/dev/null; fi
}
read_path() {
  if [ "$MODE" = "worktree" ]; then cat "$1" 2>/dev/null
  else git show "$REF:$1" 2>/dev/null; fi
}

_body() { # file -> stripped source on stdout; returns 1 if blank, 2 if absent
  local src
  path_exists "$1" || return 2
  src=$(read_path "$1")
  [ -n "$(printf '%s' "$src" | tr -d '[:space:]')" ] || return 1
  strip_comments <<<"$src"
}

check() { # file, name, pattern
  local file="$1" name="$2" pat="$3" body rc
  reject_degenerate "$pat" "$name"
  total=$((total + 1))
  body=$(_body "$file"); rc=$?
  if [ $rc -eq 2 ]; then
    echo "  n/a  $name (no $file at $WHERE)"
    na=$((na + 1)); NA_FILES="${NA_FILES}${file}"$'\n'; return
  fi
  if [ $rc -eq 1 ]; then
    # Present but blank is NOT "could not test" -- it is the content being gone.
    echo "  MISS $name ($file is empty at $WHERE)"
    miss=$((miss + 1)); MISS_NAMES="${MISS_NAMES}${name}"$'\n'; return
  fi
  if grep -qE "$pat" <<<"$body"; then
    echo "  ok   $name"; ok=$((ok + 1)); OK_NAMES="${OK_NAMES}${name}"$'\n'
  else
    echo "  MISS $name"; miss=$((miss + 1)); MISS_NAMES="${MISS_NAMES}${name}"$'\n'
  fi
}

check_absent() { # file, name, pattern-that-must-NOT-appear
  local file="$1" name="$2" pat="$3" body rc
  reject_degenerate "$pat" "$name"
  total=$((total + 1))
  body=$(_body "$file"); rc=$?
  if [ $rc -eq 2 ]; then
    echo "  n/a  $name (no $file at $WHERE)"
    na=$((na + 1)); NA_FILES="${NA_FILES}${file}"$'\n'; return
  fi
  if [ $rc -eq 1 ]; then
    echo "  ok   $name (file empty, pattern absent)"; ok=$((ok + 1))
    OK_NAMES="${OK_NAMES}${name}"$'\n'; return
  fi
  if grep -qE "$pat" <<<"$body"; then
    echo "  MISS $name (found the thing that must not be there)"
    miss=$((miss + 1)); MISS_NAMES="${MISS_NAMES}${name}"$'\n'
  else
    echo "  ok   $name"; ok=$((ok + 1)); OK_NAMES="${OK_NAMES}${name}"$'\n'
  fi
}

check_after() { # file, name, marker, window-lines, pattern
  local file="$1" name="$2" marker="$3" win="$4" pat="$5" body rc window
  reject_degenerate "$pat" "$name"
  total=$((total + 1))
  body=$(_body "$file"); rc=$?
  if [ $rc -eq 2 ]; then
    echo "  n/a  $name (no $file at $WHERE)"
    na=$((na + 1)); NA_FILES="${NA_FILES}${file}"$'\n'; return
  fi
  if [ $rc -eq 1 ]; then
    echo "  MISS $name ($file is empty at $WHERE)"
    miss=$((miss + 1)); MISS_NAMES="${MISS_NAMES}${name}"$'\n'; return
  fi
  window=$(grep -A"$win" -E "$marker" <<<"$body")
  if [ -n "$window" ] && grep -qE "$pat" <<<"$window"; then
    echo "  ok   $name"; ok=$((ok + 1)); OK_NAMES="${OK_NAMES}${name}"$'\n'
  else
    echo "  MISS $name"; miss=$((miss + 1)); MISS_NAMES="${MISS_NAMES}${name}"$'\n'
  fi
}

run_checks() {
  local P='src/app/(site)/page.tsx'
  echo "== origin/main invariants @ $WHERE =="
  # -- page.tsx --------------------------------------------------------------
  check "$P" "page: hourly ISR revalidate=3600"      '^export const revalidate = 3600;'
  check_absent "$P" "page: ISR not disabled"         'export const dynamic = "force-dynamic"'
  check "$P" "page: hoisted from=startOfTodayIso()"  '^  const from = startOfTodayIso\(\);'
  check "$P" "page: fallback events filtered"        'upcomingEvents\(FALLBACK_EVENTS, from\)'
  check "$P" "page: skip link"                       'href="#main"'
  check "$P" "page: skip link text"                  'Skip to content'
  check "$P" "page: skip link target"                '<main[^>]*id="main"'
  # -- components ------------------------------------------------------------
  check src/components/GallerySection.tsx "gallery: responsive sizes" \
    'sizes="\(min-width: 1152px\) 360px, \(min-width: 768px\) 33vw, 50vw"'
  check src/components/AboutSection.tsx "about: owner photo override" \
    'const photo = (block\.image|settings\.aboutImage)\?\.asset'
  check src/components/AboutSection.tsx "about: default shot kept"  'urlFor\(photo \?\? OWNERS_IMAGE\)'
  check src/components/AboutSection.tsx "about: alt fallback"       'photo \? "" : OWNERS_ALT'
  check src/components/AboutSection.tsx "about: responsive sizes"   'sizes="\(min-width: 768px\) 300px'
  # Hero had NO check; the plan's Task 5 whole-file replacement deletes the
  # tap-handles fallback, and in Home Page mode the adapter does not run, so an
  # editor clearing the photo loses the band entirely.
  check src/components/Hero.tsx "hero: owner photo override" \
    'const photo = (block\.image|settings\.heroImage)\?\.asset'
  check src/components/Hero.tsx "hero: default shot kept" 'urlFor\(photo \?\? TAP_HANDLES_IMAGE\)'
  check src/components/Hero.tsx "hero: alt fallback"      'photo \? "" : TAP_HANDLES_ALT'
  # The fix was sr-only REPLACING hidden. Matching the new utility alone is
  # satisfied by the pre-PR bug with the utility appended, so assert the shape
  # and assert the bug is absent.
  check src/components/Header.tsx "header: sr-only a11y fix" 'className="sr-only [^"]*sm:not-sr-only'
  check_absent src/components/Header.tsx "header: name span not display-none" \
    'className="hidden [^"]*sm:(inline|not-sr-only)'
  # -- sanity ----------------------------------------------------------------
  check src/sanity/queries.ts "query: heroImage projected"  'heroImage\{asset, hotspot, crop, alt\}'
  check src/sanity/queries.ts "query: aboutImage projected" 'aboutImage\{asset, hotspot, crop, alt\}'
  check src/sanity/schemaTypes/siteSettings.ts "schema: aboutImage field" 'name: "aboutImage"'
  check_after src/sanity/schemaTypes/siteSettings.ts "schema: email validation" \
    'name: "email"' 8 'rule\.email\(\)'
  # -- adapter ---------------------------------------------------------------
  check src/lib/sections.ts "adapter: hero photo from settings"  'settings\.heroImage\?\.asset'
  check src/lib/sections.ts "adapter: about photo from settings" 'settings\.aboutImage\?\.asset'
}

verdict() {
  local undeclared="" f
  echo "  -- $total checks: $ok ok, $miss miss, $na n/a"
  if [ "$miss" -gt 0 ]; then echo "REGRESSION at $WHERE"; return 1; fi
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    case $'\n'"$ALLOWED" in *$'\n'"$f"$'\n'*) ;; *) undeclared="${undeclared}    $f"$'\n' ;; esac
  done <<<"$NA_FILES"
  if [ -n "$undeclared" ]; then
    echo "VACUOUS at $WHERE: check(s) could not run on undeclared path(s):"
    printf '%s' "$undeclared"
    echo "  A check that cannot run is not a check that passed. If the path is"
    echo "  legitimately absent here, declare it: --allow-missing <path>"
    return 3
  fi
  if [ "$ok" -eq 0 ]; then
    echo "VACUOUS at $WHERE: zero checks actually ran."; return 3
  fi
  echo "ALL PRESENT"; return 0
}

# ---------------------------------------------------------------- self-test --
self_test() {
  local fails=0 rc
  need_ref() {
    git rev-parse --verify --quiet "$1^{commit}" >/dev/null || {
      echo "ERROR: self-test control ref '$1' is unreachable. Refusing to report a" >&2
      echo "       result from a control that did not run." >&2; exit 2; }
  }
  local POS="${POSITIVE_REF:-origin/main}"
  local NEG="${NEGATIVE_REF:-9c07a8b}"
  local VAC; VAC=$(git rev-list --max-parents=0 HEAD | head -1)
  need_ref "$POS"; need_ref "$NEG"; need_ref "$VAC"

  echo "### SELF-TEST -- proving this probe can fail before you trust it passing"
  echo

  # (0) comment-disguise control: the stripper must defeat every ordinary way of
  #     commenting code out. A line-anchored sed passed all four of these.
  echo "--- CONTROL 0: commented-out code must never satisfy a check ---"
  local d0=0
  disguise() { # label, source
    local body; body=$(strip_comments <<<"$2")
    if grep -qE '^export const revalidate = 3600;' <<<"$body"; then
      echo "  FAIL: $1 still matched after stripping"; d0=$((d0 + 1))
    fi
  }
  disguise "trailing //"   'const x = 1; // export const revalidate = 3600;'
  disguise "block /* */"   '/*
export const revalidate = 3600;
*/'
  disguise "JSX {/* */}"   '{/* export const revalidate = 3600; */}'
  disguise "mid-line /* */" 'const y = 2; /* export const revalidate = 3600; */'
  # and the inverse: real code must SURVIVE stripping (no over-stripping)
  local live; live=$(strip_comments <<<'export const revalidate = 3600;
const q = groq`*[_type == "x"]`;')
  grep -qE '^export const revalidate = 3600;' <<<"$live" || {
    echo "  FAIL: stripper ate real code"; d0=$((d0 + 1)); }
  grep -qE '\*\[_type' <<<"$live" || {
    echo "  FAIL: stripper ate a GROQ line starting with *"; d0=$((d0 + 1)); }
  if [ $d0 -eq 0 ]; then echo "  PASS (4 disguises defeated, real code survived)"
  else fails=$((fails + 1)); fi

  # (1) positive
  echo "--- POSITIVE control: $POS ---"
  ok=0; miss=0; na=0; total=0; NA_FILES=""; OK_NAMES=""; MISS_NAMES=""
  MODE=ref; REF="$POS"; WHERE="$POS"; ALLOWED="src/lib/sections.ts"$'\n'
  run_checks >/dev/null; verdict >/dev/null; rc=$?
  if [ $rc -eq 0 ] && [ "$total" -eq "$EXPECTED_CHECKS" ]; then
    echo "  PASS (exit 0, $ok ok / $miss miss / $na n/a, $total checks)"
  else
    echo "  FAIL: expected exit 0 and $EXPECTED_CHECKS checks, got exit $rc with $total ($ok ok / $miss miss / $na n/a)"
    printf '%s' "$MISS_NAMES" | sed 's/^/      missed: /'
    fails=$((fails + 1))
  fi

  # (2) negative -- EVERY runnable check must miss. Asserting "at least one miss"
  #     let 14 of 15 checks be neutered to an always-match pattern and still pass.
  echo "--- NEGATIVE control: $NEG predates the PRs; every runnable check must miss ---"
  ok=0; miss=0; na=0; total=0; NA_FILES=""; OK_NAMES=""; MISS_NAMES=""
  MODE=ref; REF="$NEG"; WHERE="$NEG"; ALLOWED=""
  run_checks >/dev/null; verdict >/dev/null; rc=$?
  local runnable=$((total - na))
  # check_absent checks legitimately pass at the negative ref (the bad thing is
  # also absent there), so exempt them by name.
  local exempt="page: ISR not disabled"$'\n'"header: name span not display-none"
  local unexpected="" n
  while IFS= read -r n; do
    [ -z "$n" ] && continue
    case $'\n'"$exempt"$'\n' in *$'\n'"$n"$'\n'*) ;; *) unexpected="${unexpected}      still ok: $n"$'\n' ;; esac
  done <<<"$OK_NAMES"
  if [ $rc -eq 1 ] && [ -z "$unexpected" ] && [ "$total" -eq "$EXPECTED_CHECKS" ]; then
    echo "  PASS (exit 1, $miss of $runnable runnable checks missed, only exempt check_absent passed)"
  else
    echo "  FAIL: a check still discriminates nothing at $NEG (exit $rc, $total checks)"
    printf '%s' "$unexpected"
    fails=$((fails + 1))
  fi

  # (3) vacuous
  echo "--- VACUOUS control: root commit $VAC must NOT read green ---"
  if git cat-file -e "$VAC:src/app/(site)/page.tsx" 2>/dev/null; then
    echo "  FAIL: '$VAC' is not a true root -- it already has page.tsx."
    echo "        (a --depth clone's boundary commit looks like a root and is not)"
    fails=$((fails + 1))
  else
    ok=0; miss=0; na=0; total=0; NA_FILES=""; OK_NAMES=""; MISS_NAMES=""
    MODE=ref; REF="$VAC"; WHERE="$VAC"; ALLOWED=""
    run_checks >/dev/null; verdict >/dev/null; rc=$?
    if [ $rc -eq 3 ]; then echo "  PASS (exit 3 VACUOUS, $na n/a -- the prototype printed ALL PRESENT here)"
    else echo "  FAIL: expected VACUOUS exit 3, got $rc ($ok ok / $miss miss / $na n/a)"; fails=$((fails + 1)); fi
  fi

  echo
  if [ $fails -eq 0 ]; then echo "SELF-TEST PASSED: the probe discriminates."; return 0
  else echo "SELF-TEST FAILED ($fails control(s) wrong): do not trust this probe's verdict."; return 1; fi
}

# -------------------------------------------------------------------- main --
usage() {
  echo "usage: scripts/main-invariants.sh <git-ref> [--allow-missing <path>]..."
  echo "       scripts/main-invariants.sh --worktree [--allow-missing <path>]..."
  echo "       scripts/main-invariants.sh --self-test"
}

[ $# -eq 0 ] && { usage >&2; exit 2; }
case "$1" in
  --self-test) self_test; exit $? ;;
  -h|--help) usage; exit 0 ;;
  --worktree) MODE=worktree; WHERE="working tree"; shift ;;
  --expect-na)
    echo "ERROR: --expect-na was removed. It compared a COUNT, so a deleted schema" >&2
    echo "       file could trade places with the legitimately-absent one and still" >&2
    echo "       read green. Use --allow-missing <path> instead." >&2; exit 2 ;;
  -*) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  *) MODE=ref; REF="$1"; WHERE="$1"; shift ;;
esac

while [ $# -gt 0 ]; do
  case "$1" in
    --allow-missing)
      [ $# -ge 2 ] && [ -n "${2:-}" ] || { echo "ERROR: --allow-missing needs a path" >&2; exit 2; }
      ALLOWED="${ALLOWED}${2}"$'\n'; shift 2 ;;
    --expect-na) echo "ERROR: --expect-na was removed; use --allow-missing <path>" >&2; exit 2 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [ "$MODE" = "ref" ]; then
  git rev-parse --verify --quiet "$REF^{commit}" >/dev/null || {
    echo "ERROR: '$REF' is not a reachable commit. Refusing to report a verdict for" >&2
    echo "       a ref that does not exist (that is how a probe reads green while" >&2
    echo "       testing nothing)." >&2; exit 2; }
fi

run_checks
verdict
