import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canSubmitProgressNote,
  normalizeProgressField,
} from "./progress-notes.ts";

describe("normalizeProgressField", () => {
  it("requires non-empty", () => {
    assert.equal(normalizeProgressField("  ", "Covered").ok, false);
  });
  it("trims", () => {
    const r = normalizeProgressField("  hello  ", "Covered");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value, "hello");
  });
});

describe("canSubmitProgressNote", () => {
  it("allows completed without note", () => {
    assert.equal(
      canSubmitProgressNote({ status: "completed", progress_note_id: null }),
      true,
    );
  });
  it("blocks when note exists or not completed", () => {
    assert.equal(
      canSubmitProgressNote({
        status: "completed",
        progress_note_id: "n1",
      }),
      false,
    );
    assert.equal(
      canSubmitProgressNote({ status: "scheduled", progress_note_id: null }),
      false,
    );
  });
});
