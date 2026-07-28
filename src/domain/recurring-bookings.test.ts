import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  anyRangeConflicts,
  buildLessonMeetingUrl,
  generateWeeklyOccurrences,
  rangesOverlap,
} from "./recurring-bookings";

describe("rangesOverlap", () => {
  it("detects overlapping ranges", () => {
    assert.equal(
      rangesOverlap(
        "2026-08-01T17:00:00.000Z",
        "2026-08-01T17:45:00.000Z",
        "2026-08-01T17:30:00.000Z",
        "2026-08-01T18:00:00.000Z",
      ),
      true,
    );
  });

  it("allows back-to-back slots", () => {
    assert.equal(
      rangesOverlap(
        "2026-08-01T17:00:00.000Z",
        "2026-08-01T17:45:00.000Z",
        "2026-08-01T17:45:00.000Z",
        "2026-08-01T18:30:00.000Z",
      ),
      false,
    );
  });
});

describe("generateWeeklyOccurrences", () => {
  it("creates N weekly 45-minute lessons", () => {
    const occ = generateWeeklyOccurrences("2026-08-03T17:00:00.000Z", 4, 45);
    assert.equal(occ.length, 4);
    assert.equal(occ[0]!.sequence, 1);
    assert.equal(occ[0]!.slot_start, "2026-08-03T17:00:00.000Z");
    assert.equal(occ[0]!.slot_end, "2026-08-03T17:45:00.000Z");
    assert.equal(occ[1]!.slot_start, "2026-08-10T17:00:00.000Z");
    assert.equal(occ[3]!.slot_start, "2026-08-24T17:00:00.000Z");
  });

  it("returns empty for invalid input", () => {
    assert.deepEqual(generateWeeklyOccurrences("not-a-date", 4), []);
    assert.deepEqual(generateWeeklyOccurrences("2026-08-03T17:00:00.000Z", 0), []);
  });
});

describe("anyRangeConflicts", () => {
  it("flags conflict against existing list", () => {
    assert.equal(
      anyRangeConflicts(
        {
          start: "2026-08-03T17:00:00.000Z",
          end: "2026-08-03T17:45:00.000Z",
        },
        [
          {
            start: "2026-08-03T17:15:00.000Z",
            end: "2026-08-03T17:45:00.000Z",
          },
        ],
      ),
      true,
    );
  });
});

describe("buildLessonMeetingUrl", () => {
  it("builds a deterministic Jitsi room from lesson id", () => {
    const url = buildLessonMeetingUrl("abc-123_xyz");
    assert.equal(url, "https://meet.jit.si/qtm-lesson-abc123xyz");
    assert.equal(buildLessonMeetingUrl("abc-123_xyz"), url);
  });
});
