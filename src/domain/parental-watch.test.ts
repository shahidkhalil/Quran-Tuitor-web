import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLearnerTutorLinks,
  uniqueFamilyTutorCount,
} from "./parental-watch";

describe("buildLearnerTutorLinks", () => {
  it("keeps multiple tutors for one learner", () => {
    const links = buildLearnerTutorLinks({
      learnerId: "L1",
      upcoming: [
        {
          learner_id: "L1",
          listing_id: "list-a",
          tutor_id: "t-a",
          slot_start: "2026-08-01T10:00:00.000Z",
          slot_end: "2026-08-01T10:30:00.000Z",
          status: "scheduled",
        },
        {
          learner_id: "L1",
          listing_id: "list-b",
          tutor_id: "t-b",
          slot_start: "2026-08-02T10:00:00.000Z",
          slot_end: "2026-08-02T10:30:00.000Z",
          status: "scheduled",
        },
      ],
      recent: [],
      trials: [],
      notes: [],
    });
    assert.equal(links.length, 2);
    assert.deepEqual(
      links.map((l) => l.listingId).sort(),
      ["list-a", "list-b"],
    );
  });

  it("prefers scheduled over trial for the same listing", () => {
    const links = buildLearnerTutorLinks({
      learnerId: "L1",
      upcoming: [
        {
          learner_id: "L1",
          listing_id: "list-a",
          tutor_id: "t-a",
          slot_start: "2026-08-01T10:00:00.000Z",
          slot_end: "2026-08-01T10:30:00.000Z",
          status: "scheduled",
        },
      ],
      recent: [],
      trials: [
        {
          learner_id: "L1",
          listing_id: "list-a",
          tutor_id: "t-a",
          status: "accepted",
        },
      ],
      notes: [],
    });
    assert.equal(links.length, 1);
    assert.equal(links[0]?.kind, "scheduled");
  });

  it("counts unique family tutors across learners", () => {
    const a = buildLearnerTutorLinks({
      learnerId: "L1",
      upcoming: [
        {
          learner_id: "L1",
          listing_id: "list-a",
          tutor_id: "t-a",
          slot_start: "2026-08-01T10:00:00.000Z",
          slot_end: "2026-08-01T10:30:00.000Z",
          status: "scheduled",
        },
      ],
      recent: [],
      trials: [],
      notes: [],
    });
    const b = buildLearnerTutorLinks({
      learnerId: "L2",
      upcoming: [],
      recent: [],
      trials: [
        {
          learner_id: "L2",
          listing_id: "list-a",
          tutor_id: "t-a",
          status: "pending_tutor",
        },
        {
          learner_id: "L2",
          listing_id: "list-c",
          tutor_id: "t-c",
          status: "accepted",
        },
      ],
      notes: [],
    });
    assert.equal(uniqueFamilyTutorCount([...a, ...b]), 2);
  });
});
