import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canShowConversionCta,
  canSubmitTrialSummary,
  resolveTrialStipendCents,
  type TrialBooking,
} from "./trials";

function base(
  overrides: Partial<TrialBooking> = {},
): Pick<TrialBooking, "status" | "slot_end"> {
  return {
    status: "accepted",
    slot_end: "2026-07-01T18:00:00.000Z",
    ...overrides,
  };
}

describe("trial completion gates", () => {
  it("allows summary after slot end when accepted", () => {
    const now = new Date("2026-07-01T18:01:00.000Z");
    assert.equal(canSubmitTrialSummary(base(), now), true);
  });

  it("blocks summary before slot end", () => {
    const now = new Date("2026-07-01T17:59:00.000Z");
    assert.equal(canSubmitTrialSummary(base(), now), false);
  });

  it("blocks summary when not accepted", () => {
    const now = new Date("2026-07-01T19:00:00.000Z");
    assert.equal(
      canSubmitTrialSummary(base({ status: "pending_tutor" }), now),
      false,
    );
    assert.equal(
      canSubmitTrialSummary(base({ status: "completed" }), now),
      false,
    );
  });

  it("shows conversion CTA when completed", () => {
    const now = new Date("2026-07-01T12:00:00.000Z");
    assert.equal(
      canShowConversionCta(base({ status: "completed" }), now),
      true,
    );
  });

  it("shows conversion CTA after slot end even without summary", () => {
    const now = new Date("2026-07-01T18:01:00.000Z");
    assert.equal(canShowConversionCta(base(), now), true);
  });

  it("hides conversion CTA before slot end when only accepted", () => {
    const now = new Date("2026-07-01T17:00:00.000Z");
    assert.equal(canShowConversionCta(base(), now), false);
  });
});

describe("resolveTrialStipendCents", () => {
  it("defaults to 500", () => {
    assert.equal(resolveTrialStipendCents(undefined), 500);
    assert.equal(resolveTrialStipendCents(""), 500);
  });

  it("parses env override", () => {
    assert.equal(resolveTrialStipendCents("0"), 0);
    assert.equal(resolveTrialStipendCents("750"), 750);
  });

  it("falls back on invalid values", () => {
    assert.equal(resolveTrialStipendCents("nope"), 500);
    assert.equal(resolveTrialStipendCents("-1"), 500);
  });
});
