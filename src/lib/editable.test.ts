import assert from "node:assert/strict";
import { test } from "node:test";

import { createEditUrl } from "@sanity/client/csm";
import { vercelStegaCombine } from "@vercel/stega";

import { blockScope } from "./edit-scope.ts";
import {
  decodeEditTarget,
  editAttribute,
  normalizeEditedText,
  valueAtPath,
} from "./editable.ts";

/**
 * Builds a string exactly the way a draft-mode preview does: the visible
 * text plus an invisible payload whose href is the Studio edit intent for
 * that field. Using the client's own URL builder keeps the test honest if
 * the intent format ever shifts.
 */
function encoded(text: string, id: string, type: string, path: string) {
  const href = createEditUrl({
    baseUrl: "/studio",
    id,
    type,
    path,
    projectId: "abc123",
    dataset: "production",
  });
  return vercelStegaCombine(text, { origin: "sanity.io", href });
}

test("decodeEditTarget recovers the document and field from a rendered string", () => {
  const target = decodeEditTarget(
    encoded("About the Hub", "siteSettings", "siteSettings", "aboutHeading"),
  );
  assert.deepEqual(target, {
    id: "siteSettings",
    type: "siteSettings",
    path: "aboutHeading",
  });
});

test("decodeEditTarget keeps array key selectors intact", () => {
  const target = decodeEditTarget(
    encoded(
      "Kegs & tap rentals",
      "siteSettings",
      "siteSettings",
      'offerings[_key=="a1b2"].title',
    ),
  );
  assert.equal(target?.path, 'offerings[_key=="a1b2"].title');
});

test("decodeEditTarget normalizes a draft id to its published id", () => {
  const target = decodeEditTarget(
    encoded("Trivia Night", "drafts.evt-7", "event", "title"),
  );
  assert.equal(target?.id, "evt-7");
});

test("decodeEditTarget returns null for published (stega-free) strings", () => {
  assert.equal(decodeEditTarget("About the Hub"), null);
  assert.equal(decodeEditTarget(""), null);
  assert.equal(decodeEditTarget(16), null);
  assert.equal(decodeEditTarget(undefined), null);
});

test("valueAtPath walks plain, indexed and keyed segments", () => {
  const doc = {
    heroHeading: "Your friendly\nneighborhood\nbeer hub",
    credentials: ["Veteran-owned", "Dog friendly"],
    offerings: [{ _key: "a1b2", title: "Sixteen taps" }],
    aboutBody: [
      { _key: "b1", children: [{ _key: "s1", text: "Downtown Waynesville." }] },
    ],
  };

  assert.equal(valueAtPath(doc, "heroHeading"), doc.heroHeading);
  assert.equal(valueAtPath(doc, "credentials[1]"), "Dog friendly");
  assert.equal(
    valueAtPath(doc, 'offerings[_key=="a1b2"].title'),
    "Sixteen taps",
  );
  assert.equal(
    valueAtPath(doc, 'aboutBody[_key=="b1"].children[_key=="s1"].text'),
    "Downtown Waynesville.",
  );
});

test("valueAtPath returns undefined instead of throwing on a missing branch", () => {
  assert.equal(valueAtPath({}, 'offerings[_key=="nope"].title'), undefined);
  assert.equal(
    valueAtPath({ hours: "not an array" }, "hours[0].opens"),
    undefined,
  );
});

test("normalizeEditedText flattens newlines only for single-line fields", () => {
  assert.equal(normalizeEditedText("Come\nsay hi", false), "Come say hi");
  assert.equal(normalizeEditedText("Come\nsay hi", true), "Come\nsay hi");
  assert.equal(normalizeEditedText("beer hub\n", true), "beer hub");
});

test("editAttribute points the overlay at a keyed block field", () => {
  const attr = editAttribute(blockScope("k1"), "tapCount");
  assert.match(attr, /id=homePage/);
  assert.match(attr, /type=homePage/);
  // createDataAttribute spells a keyed segment as `sections:k1`.
  assert.equal(
    attr,
    "id=homePage;type=homePage;path=sections:k1.tapCount;base=%2F",
  );
});
