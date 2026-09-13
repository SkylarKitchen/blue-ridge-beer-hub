import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { Marked } from "marked";

// The owners' guide (./page.tsx) renders UPDATING.md and sizes every
// `![caption](public/guide/x.webp)` figure from ./figures.json. A figure that
// is missing from the manifest does NOT throw: the renderer just omits
// width/height, the build stays green, and the owners get a broken image plus
// layout shift on a live page. Nothing else in the suite notices, so these
// checks hold the doc, the files, and the manifest to each other.
//
// Paths resolve from this file, not process.cwd(), so the suite passes
// wherever `node --test` is launched from.
const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const GUIDE_PATH = path.join(ROOT, "UPDATING.md");
const FIGURES_DIR = path.join(ROOT, "public", "guide");
const MANIFEST_PATH = fileURLToPath(new URL("./figures.json", import.meta.url));

const figures: Record<string, { width?: unknown; height?: unknown }> =
  JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const guide = readFileSync(GUIDE_PATH, "utf8");

/**
 * Every image marked renders from UPDATING.md, resolved the way the image()
 * renderer in ./page.tsx resolves it: drop the repo-root `public/` prefix to
 * get the served src, then key the manifest by its basename. Walking marked's
 * own tokens rather than a regex means whatever the page would turn into an
 * <img> is checked here — nested brackets in the caption, a title, a
 * root-relative path — and whatever it would not (a fenced example) is not.
 */
function guideFigureRefs(): { line: number; src: string; name: string }[] {
  const refs: { line: number; src: string; name: string }[] = [];
  const marked = new Marked();
  // Images arrive in document order, so a moving cursor pins each one to the
  // line it sits on even when the same figure is used twice.
  let cursor = 0;
  marked.walkTokens(marked.lexer(guide), (token) => {
    if (token.type !== "image") return;
    const at = guide.indexOf(token.raw, cursor);
    if (at !== -1) cursor = at + token.raw.length;
    const src = token.href.replace(/^public\//, "/");
    refs.push({
      line: at === -1 ? 0 : guide.slice(0, at).split("\n").length,
      src,
      name: path.basename(src),
    });
  });
  return refs;
}

/**
 * `existsSync` is case-INSENSITIVE on macOS (APFS), so a reference to
 * `STUDIO-CHIPS.webp` resolves against `studio-chips.webp` and the check
 * passes locally — then 404s on the Linux build host, which is case-sensitive.
 * Comparing against the directory listing makes the check case-exact on every
 * platform, so the failure surfaces here rather than on the deployed page.
 */
const dirEntries = new Map<string, Set<string>>();
function fileExistsExact(absolute: string) {
  const dir = path.dirname(absolute);
  let entries = dirEntries.get(dir);
  if (!entries) {
    entries = new Set(existsSync(dir) ? readdirSync(dir) : []);
    dirEntries.set(dir, entries);
  }
  return entries.has(path.basename(absolute));
}

test("the guide still uses the image convention these checks look for", () => {
  // Marked surfacing no images would pass every check below for free, and
  // surfacing only some would hide the rest — so hold its count to a raw scan
  // of the doc, which does not go through marked at all.
  const raw = (guide.match(/!\[/g) ?? []).length;
  const seen = guideFigureRefs().length;
  assert.ok(
    raw > 0,
    "No `![caption](public/guide/NAME)` images found in UPDATING.md. Either " +
      "the doc dropped its figures or the convention changed — update this " +
      "test and the image() renderer in page.tsx together.",
  );
  assert.equal(
    seen,
    raw,
    `marked found ${seen} image(s) in UPDATING.md but the doc has ${raw} ` +
      "`![`. Either a figure is written in a way marked no longer lexes as an " +
      "image (page.tsx would not render it either — fix the doc), or a `![` " +
      "sits inside a code span or fence, which marked rightly skips — adjust " +
      "the raw count in this test.",
  );
});

test("every figure UPDATING.md references has a file under public/guide", () => {
  // page.tsx serves public/ at /, so the <img> the page emits asks for
  // public/<src>.
  const missing = guideFigureRefs()
    .filter(({ src }) => !fileExistsExact(path.join(ROOT, "public", src)))
    .map(({ line, src }) => `UPDATING.md:${line} -> public${src}`);
  assert.deepEqual(
    missing,
    [],
    "UPDATING.md references figures that do not exist on disk:\n  " +
      missing.join("\n  ") +
      "\nThe guide page would ship a broken <img>. Build the figure with " +
      "`node scripts/guide-figures.mjs <captures>` or fix the path in the doc.",
  );
});

test("every figure UPDATING.md references is sized in figures.json", () => {
  const unsized = guideFigureRefs()
    .filter(({ name }) => !(name in figures))
    .map(({ line, name }) => `UPDATING.md:${line} -> ${name}`);
  assert.deepEqual(
    unsized,
    [],
    "UPDATING.md references figures with no entry in src/app/guide/figures.json:\n  " +
      unsized.join("\n  ") +
      "\npage.tsx would render them without width/height and the page would " +
      "shift as they load. scripts/guide-figures.mjs writes the manifest — " +
      "add the figure there and re-run it.",
  );
});

test("every figures.json entry has a file under public/guide", () => {
  const orphaned = Object.keys(figures).filter(
    (name) => !fileExistsExact(path.join(FIGURES_DIR, name)),
  );
  assert.deepEqual(
    orphaned,
    [],
    "src/app/guide/figures.json lists figures that do not exist on disk:\n  " +
      orphaned.join("\n  ") +
      "\nEither the .webp was deleted or renamed without re-running " +
      "scripts/guide-figures.mjs, or the manifest was edited by hand.",
  );
});

test("every figures.json entry carries a positive width and height", () => {
  const malformed = Object.entries(figures)
    .filter(
      ([, size]) =>
        !(Number.isInteger(size.width) && (size.width as number) > 0) ||
        !(Number.isInteger(size.height) && (size.height as number) > 0),
    )
    .map(([name, size]) => `${name}: ${JSON.stringify(size)}`);
  assert.deepEqual(
    malformed,
    [],
    "src/app/guide/figures.json has entries page.tsx cannot size from:\n  " +
      malformed.join("\n  ") +
      "\nEach entry needs integer width and height above zero.",
  );
});
