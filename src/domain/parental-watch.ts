/** Parental Watch helpers — multi-tutor per learner / family. */

export type WatchLessonRef = {
  learner_id: string;
  listing_id: string;
  tutor_id: string;
  slot_start: string;
  slot_end: string;
  status: string;
};

export type WatchTrialRef = {
  learner_id: string;
  listing_id: string;
  tutor_id: string;
  status: string;
};

export type WatchNoteRef = {
  learner_id: string;
  listing_id: string;
  tutor_id: string;
};

export type LearnerTutorLink = {
  listingId: string;
  tutorId: string;
  learnerId: string;
  /** scheduled | trial | recent | notes */
  kind: "scheduled" | "trial" | "recent" | "notes";
  slotStart?: string;
  slotEnd?: string;
  trialStatus?: string;
  sortKey: string;
};

const ACTIVE_TRIAL = new Set([
  "pending_tutor",
  "accepted",
  "completed",
]);

/**
 * Build unique tutor relationships for one learner from lessons, trials, and notes.
 * A learner may have multiple tutors (different subjects / rematch / second package).
 */
export function buildLearnerTutorLinks(input: {
  learnerId: string;
  upcoming: WatchLessonRef[];
  recent: WatchLessonRef[];
  trials: WatchTrialRef[];
  notes: WatchNoteRef[];
}): LearnerTutorLink[] {
  const byListing = new Map<string, LearnerTutorLink>();

  const upsert = (link: LearnerTutorLink) => {
    const existing = byListing.get(link.listingId);
    if (!existing) {
      byListing.set(link.listingId, link);
      return;
    }
    if (kindPriority(link.kind) < kindPriority(existing.kind)) {
      byListing.set(link.listingId, link);
      return;
    }
    // Prefer earlier next lesson when both scheduled
    if (
      link.kind === "scheduled" &&
      existing.kind === "scheduled" &&
      link.slotStart &&
      existing.slotStart &&
      link.slotStart < existing.slotStart
    ) {
      byListing.set(link.listingId, link);
    }
  };

  for (const lesson of input.upcoming) {
    if (lesson.learner_id !== input.learnerId) continue;
    if (lesson.status !== "scheduled") continue;
    upsert({
      listingId: lesson.listing_id,
      tutorId: lesson.tutor_id,
      learnerId: input.learnerId,
      kind: "scheduled",
      slotStart: lesson.slot_start,
      slotEnd: lesson.slot_end,
      sortKey: lesson.slot_start,
    });
  }

  for (const trial of input.trials) {
    if (trial.learner_id !== input.learnerId) continue;
    if (!ACTIVE_TRIAL.has(trial.status)) continue;
    upsert({
      listingId: trial.listing_id,
      tutorId: trial.tutor_id,
      learnerId: input.learnerId,
      kind: "trial",
      trialStatus: trial.status,
      sortKey: `trial-${trial.status}`,
    });
  }

  for (const lesson of input.recent) {
    if (lesson.learner_id !== input.learnerId) continue;
    upsert({
      listingId: lesson.listing_id,
      tutorId: lesson.tutor_id,
      learnerId: input.learnerId,
      kind: "recent",
      slotStart: lesson.slot_start,
      slotEnd: lesson.slot_end,
      sortKey: lesson.slot_start,
    });
  }

  for (const note of input.notes) {
    if (note.learner_id !== input.learnerId) continue;
    upsert({
      listingId: note.listing_id,
      tutorId: note.tutor_id,
      learnerId: input.learnerId,
      kind: "notes",
      sortKey: note.listing_id,
    });
  }

  return [...byListing.values()].sort((a, b) => {
    const pri = kindPriority(a.kind) - kindPriority(b.kind);
    if (pri !== 0) return pri;
    return a.sortKey.localeCompare(b.sortKey);
  });
}

function kindPriority(kind: LearnerTutorLink["kind"]): number {
  switch (kind) {
    case "scheduled":
      return 0;
    case "trial":
      return 1;
    case "recent":
      return 2;
    case "notes":
      return 3;
  }
}

/** Unique tutors across the whole family (all learners). */
export function uniqueFamilyTutorCount(links: LearnerTutorLink[]): number {
  return new Set(links.map((l) => l.listingId)).size;
}
