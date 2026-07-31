import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countRemainingScheduled,
  packagesNeedingRenewal,
  renewalPromptCopy,
} from "./package-renewal";

describe("package-renewal", () => {
  it("counts remaining scheduled lessons per package", () => {
    const n = countRemainingScheduled(
      [
        { recurring_booking_id: "r1", status: "scheduled" },
        { recurring_booking_id: "r1", status: "completed" },
        { recurring_booking_id: "r1", status: "scheduled" },
        { recurring_booking_id: "r2", status: "scheduled" },
      ],
      "r1",
    );
    assert.equal(n, 2);
  });

  it("flags packages at or below threshold", () => {
    const prompts = packagesNeedingRenewal(
      [
        {
          paymentId: "p1",
          recurringBookingId: "r1",
          listingId: "l1",
          learnerId: "lear1",
          tutorId: "t1",
          lessonCount: 4,
          status: "active",
        },
        {
          paymentId: "p2",
          recurringBookingId: "r2",
          listingId: "l2",
          learnerId: "lear2",
          tutorId: "t2",
          lessonCount: 4,
          status: "active",
        },
        {
          paymentId: "p3",
          recurringBookingId: "r3",
          listingId: "l3",
          learnerId: "lear3",
          tutorId: "t3",
          lessonCount: 4,
          status: "cancelled",
        },
      ],
      [
        { recurring_booking_id: "r1", status: "scheduled" },
        { recurring_booking_id: "r2", status: "scheduled" },
        { recurring_booking_id: "r2", status: "scheduled" },
        { recurring_booking_id: "r2", status: "completed" },
      ],
      1,
    );
    assert.equal(prompts.length, 1);
    assert.equal(prompts[0]?.paymentId, "p1");
    assert.equal(prompts[0]?.remainingScheduled, 1);
  });

  it("writes copy for zero remaining", () => {
    const copy = renewalPromptCopy({
      paymentId: "p1",
      recurringBookingId: "r1",
      listingId: "l1",
      learnerId: "lear1",
      tutorId: "t1",
      lessonCount: 4,
      remainingScheduled: 0,
    });
    assert.match(copy.title, /finished/i);
  });
});
