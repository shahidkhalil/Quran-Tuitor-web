import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  messagePreview,
  normalizeMessageBody,
  threadUniqueKey,
} from "./messages.ts";

describe("threadUniqueKey", () => {
  it("joins parent tutor learner", () => {
    assert.equal(threadUniqueKey("p1", "t1", "l1"), "p1_t1_l1");
  });
});

describe("normalizeMessageBody", () => {
  it("rejects empty", () => {
    assert.equal(normalizeMessageBody("   ").ok, false);
  });
  it("trims", () => {
    const r = normalizeMessageBody("  hello  ");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.body, "hello");
  });
});

describe("messagePreview", () => {
  it("truncates long text", () => {
    const p = messagePreview("a".repeat(100), 10);
    assert.equal(p.length, 10);
    assert.ok(p.endsWith("…"));
  });
});
