import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { proposeTrialSlots } from "./trials";
import { previewSlotsByDay, previewTrialSlots } from "./listing-trial-preview";

describe("listing-trial-preview", () => {
  it("limits slots for the listing preview", () => {
    const from = new Date("2026-08-01T12:00:00.000Z");
    const slots = proposeTrialSlots(from, 5);
    assert.ok(slots.length > 4);
    const preview = previewTrialSlots(slots, 4);
    assert.equal(preview.length, 4);
    const days = previewSlotsByDay(slots, 4);
    assert.ok(days.length >= 1);
    assert.equal(
      days.reduce((n, d) => n + d.slots.length, 0),
      4,
    );
  });
});
