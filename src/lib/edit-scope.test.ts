import assert from "node:assert/strict";
import { test } from "node:test";

import { blockScope } from "./edit-scope.ts";

test("blockScope addresses a field on a keyed section of the Home Page", () => {
  const scope = blockScope("k1");
  assert.equal(scope.documentId, "homePage");
  assert.equal(scope.documentType, "homePage");
  assert.equal(scope.field("heading"), 'sections[_key=="k1"].heading');
});

test("blockScope keeps array tails on the field name", () => {
  assert.equal(
    blockScope("k1").field("perks[2]"),
    'sections[_key=="k1"].perks[2]',
  );
  assert.equal(
    blockScope("k1").field('cards[_key=="c9"].title'),
    'sections[_key=="k1"].cards[_key=="c9"].title',
  );
});
