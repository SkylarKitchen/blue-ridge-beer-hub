import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { parsePostsResponse } from "./facebook.ts";

const fixture = JSON.parse(
  readFileSync(
    new URL("./fixtures/fb-posts-response.json", import.meta.url),
    "utf8",
  ),
);

test("parses posts, keeping only image URLs that exist", () => {
  const posts = parsePostsResponse(fixture);
  assert.equal(posts.length, 3);
  assert.deepEqual(posts[0].imageUrls, []);
  assert.deepEqual(posts[1].imageUrls, ["https://scontent.example/flyer.jpg"]);
});

test("albums prefer subattachments and dedupe", () => {
  const posts = parsePostsResponse(fixture);
  assert.deepEqual(posts[2].imageUrls, [
    "https://scontent.example/a1.jpg",
    "https://scontent.example/a2.jpg",
  ]);
  assert.equal(posts[2].message, undefined);
});

test("tolerates junk input", () => {
  assert.deepEqual(parsePostsResponse({}), []);
  assert.deepEqual(parsePostsResponse(null), []);
  assert.deepEqual(parsePostsResponse({ data: [{}] }), []);
});
