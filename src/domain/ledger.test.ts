import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_COMMISSION_BPS,
  paidLessonEarningsUniqueKey,
  resolveCommissionBps,
  splitLessonGross,
} from "./ledger";

describe("splitLessonGross", () => {
  it("splits 25% commission with conserved cents", () => {
    const split = splitLessonGross(2500, 2500); // $25 lesson
    assert.equal(split.gross_cents, 2500);
    assert.equal(split.commission_cents, 625);
    assert.equal(split.net_cents, 1875);
    assert.equal(split.commission_bps, 2500);
    assert.equal(
      split.commission_cents + split.net_cents,
      split.gross_cents,
    );
  });

  it("floors commission on odd amounts", () => {
    const split = splitLessonGross(100, 2500);
    assert.equal(split.commission_cents, 25);
    assert.equal(split.net_cents, 75);
  });

  it("allows zero commission", () => {
    const split = splitLessonGross(1000, 0);
    assert.equal(split.commission_cents, 0);
    assert.equal(split.net_cents, 1000);
  });
});

describe("resolveCommissionBps", () => {
  it("defaults to 25%", () => {
    assert.equal(resolveCommissionBps(undefined), DEFAULT_COMMISSION_BPS);
    assert.equal(resolveCommissionBps(""), DEFAULT_COMMISSION_BPS);
    assert.equal(resolveCommissionBps("nope"), DEFAULT_COMMISSION_BPS);
  });

  it("accepts valid env override", () => {
    assert.equal(resolveCommissionBps("2000"), 2000);
  });
});

describe("paidLessonEarningsUniqueKey", () => {
  it("is deterministic", () => {
    assert.equal(paidLessonEarningsUniqueKey("abc"), "paid_lesson_abc");
  });
});
