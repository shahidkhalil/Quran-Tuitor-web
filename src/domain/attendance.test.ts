import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canMarkAttendance,
  isAttendanceOutcome,
  isCompletedPaidLesson,
  lessonStatusForOutcome,
} from "./attendance";

describe("canMarkAttendance", () => {
  it("allows mark after slot start while scheduled", () => {
    assert.equal(
      canMarkAttendance(
        {
          status: "scheduled",
          slot_start: "2026-07-01T10:00:00.000Z",
        },
        new Date("2026-07-01T10:00:00.000Z"),
      ),
      true,
    );
  });

  it("blocks before slot start", () => {
    assert.equal(
      canMarkAttendance(
        {
          status: "scheduled",
          slot_start: "2026-07-01T10:00:00.000Z",
        },
        new Date("2026-07-01T09:59:00.000Z"),
      ),
      false,
    );
  });

  it("blocks when already completed", () => {
    assert.equal(
      canMarkAttendance(
        {
          status: "completed",
          slot_start: "2026-07-01T10:00:00.000Z",
        },
        new Date("2026-07-01T12:00:00.000Z"),
      ),
      false,
    );
  });
});

describe("isCompletedPaidLesson", () => {
  it("is true only for completed status", () => {
    assert.equal(isCompletedPaidLesson({ status: "completed" }), true);
    assert.equal(isCompletedPaidLesson({ status: "scheduled" }), false);
    assert.equal(isCompletedPaidLesson({ status: "tutor_no_show" }), false);
  });
});

describe("outcome helpers", () => {
  it("validates and maps outcomes", () => {
    assert.equal(isAttendanceOutcome("completed"), true);
    assert.equal(isAttendanceOutcome("nope"), false);
    assert.equal(lessonStatusForOutcome("student_no_show"), "student_no_show");
  });
});
