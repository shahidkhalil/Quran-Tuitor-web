import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  availableBalanceCents,
  isPayoutSimulateMode,
  resolvePayoutMinCents,
} from "./payouts";
import type { LedgerEntry } from "./ledger";

function entry(amount: number): LedgerEntry {
  return {
    id: "x",
    tutor_id: "t",
    entry_kind: "paid_lesson_earnings",
    amount_cents: amount,
    currency: "USD",
    unique_key: "k",
    note: null,
    created_at: "2026-01-01",
  };
}

describe("availableBalanceCents", () => {
  it("sums credits and debits without going negative", () => {
    assert.equal(
      availableBalanceCents([entry(1875), entry(500), entry(-1000)]),
      1375,
    );
    assert.equal(availableBalanceCents([entry(-100)]), 0);
  });
});

describe("resolvePayoutMinCents", () => {
  it("defaults to 500", () => {
    assert.equal(resolvePayoutMinCents(undefined), 500);
    assert.equal(resolvePayoutMinCents("1000"), 1000);
  });
});

describe("isPayoutSimulateMode", () => {
  it("defaults to simulate unless stripe", () => {
    assert.equal(isPayoutSimulateMode(undefined), true);
    assert.equal(isPayoutSimulateMode("simulate"), true);
    assert.equal(isPayoutSimulateMode("stripe"), false);
  });
});
