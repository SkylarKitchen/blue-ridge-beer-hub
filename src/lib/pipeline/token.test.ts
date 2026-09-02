import assert from "node:assert/strict";
import { test } from "node:test";

import { signApprovalToken, verifyApprovalToken } from "./token.ts";

const SECRET = "test-secret";
const payload = {
  draftIds: ["drafts.abc", "drafts.def"],
  exp: Date.now() + 1000,
};

test("round-trips a valid token", () => {
  const token = signApprovalToken(payload, SECRET);
  assert.deepEqual(verifyApprovalToken(token, SECRET), payload);
});

test("rejects a tampered payload", () => {
  const token = signApprovalToken(payload, SECRET);
  const [body, sig] = token.split(".");
  const forged = Buffer.from(
    JSON.stringify({ ...payload, draftIds: ["drafts.evil"] }),
  ).toString("base64url");
  assert.equal(verifyApprovalToken(`${forged}.${sig}`, SECRET), null);
  assert.equal(verifyApprovalToken(`${body}.AAAA`, SECRET), null);
});

test("rejects the wrong secret", () => {
  const token = signApprovalToken(payload, SECRET);
  assert.equal(verifyApprovalToken(token, "other-secret"), null);
});

test("rejects an expired token", () => {
  const token = signApprovalToken({ ...payload, exp: 1000 }, SECRET);
  assert.equal(verifyApprovalToken(token, SECRET, 2000), null);
});

test("rejects garbage", () => {
  assert.equal(verifyApprovalToken("", SECRET), null);
  assert.equal(verifyApprovalToken("not-a-token", SECRET), null);
  assert.equal(verifyApprovalToken("a.b.c", SECRET), null);
});
