import { COLLECTIONS, db, nowIso } from "@/lib/firebase/db";
import { notifyUser } from "@/server/services/notify-user";
import {
  reminderCopy,
  shouldSend15mReminder,
  shouldSend24hReminder,
  type ReminderKind,
} from "@/domain/lesson-reminders";
import { formatLessonSlot } from "@/domain/recurring-bookings";

type ReminderDoc = {
  id: string;
  parent_id: string;
  tutor_id: string;
  slot_start: string;
  slot_end: string;
  status: string;
  reminder_24h_sent_at?: string | null;
  reminder_15m_sent_at?: string | null;
};

export type ReminderRunResult = {
  scanned: number;
  sent: number;
  kinds: { kind: ReminderKind; lessonId: string; role: "parent" | "tutor" }[];
  errors: string[];
};

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

async function notifyPair(
  lesson: ReminderDoc,
  kind: ReminderKind,
  parentLink: string,
  tutorLink: string,
): Promise<void> {
  const whenLabel = formatLessonSlot(lesson.slot_start, lesson.slot_end);
  const { title, body } = reminderCopy(kind, whenLabel);

  await notifyUser({
    userId: lesson.parent_id,
    title,
    body,
    link: parentLink,
  });
  await notifyUser({
    userId: lesson.tutor_id,
    title,
    body,
    link: tutorLink,
  });
}

async function markSent(
  collection: string,
  id: string,
  kind: ReminderKind,
): Promise<void> {
  const field =
    kind === "24h" ? "reminder_24h_sent_at" : "reminder_15m_sent_at";
  await db()
    .collection(collection)
    .doc(id)
    .set({ [field]: nowIso(), updated_at: nowIso() }, { merge: true });
}

function processOne(
  lesson: ReminderDoc,
  now: Date,
): ReminderKind | null {
  if (
    shouldSend24hReminder(
      lesson.slot_start,
      now,
      Boolean(lesson.reminder_24h_sent_at),
    )
  ) {
    return "24h";
  }
  if (
    shouldSend15mReminder(
      lesson.slot_start,
      now,
      Boolean(lesson.reminder_15m_sent_at),
    )
  ) {
    return "15m";
  }
  return null;
}

/** Scan scheduled paid lessons + accepted trials; send due reminders. */
export async function runLessonReminders(
  now = new Date(),
): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    scanned: 0,
    sent: 0,
    kinds: [],
    errors: [],
  };

  const origin = appOrigin();
  const horizon = new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString();
  const pastFloor = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

  // Paid scheduled lessons
  try {
    const snap = await db()
      .collection(COLLECTIONS.scheduledLessons)
      .where("status", "==", "scheduled")
      .get();

    for (const doc of snap.docs) {
      const lesson = { id: doc.id, ...(doc.data() as Omit<ReminderDoc, "id">) };
      const start = lesson.slot_start;
      if (!start || start < pastFloor || start > horizon) continue;
      result.scanned += 1;

      const kind = processOne(lesson, now);
      if (!kind) continue;

      try {
        await notifyPair(
          lesson,
          kind,
          `${origin}/parent/schedule`,
          `${origin}/tutor/calendar`,
        );
        await markSent(COLLECTIONS.scheduledLessons, lesson.id, kind);
        result.sent += 2;
        result.kinds.push(
          { kind, lessonId: lesson.id, role: "parent" },
          { kind, lessonId: lesson.id, role: "tutor" },
        );
      } catch (err) {
        result.errors.push(
          `lesson ${lesson.id}: ${err instanceof Error ? err.message : "failed"}`,
        );
      }
    }
  } catch (err) {
    result.errors.push(
      `scheduled_lessons: ${err instanceof Error ? err.message : "query failed"}`,
    );
  }

  // Accepted free trials
  try {
    const snap = await db()
      .collection(COLLECTIONS.trialBookings)
      .where("status", "==", "accepted")
      .get();

    for (const doc of snap.docs) {
      const lesson = { id: doc.id, ...(doc.data() as Omit<ReminderDoc, "id">) };
      const start = lesson.slot_start;
      if (!start || start < pastFloor || start > horizon) continue;
      result.scanned += 1;

      const kind = processOne(lesson, now);
      if (!kind) continue;

      try {
        await notifyPair(
          lesson,
          kind,
          `${origin}/parent/bookings`,
          `${origin}/tutor/requests`,
        );
        await markSent(COLLECTIONS.trialBookings, lesson.id, kind);
        result.sent += 2;
        result.kinds.push(
          { kind, lessonId: lesson.id, role: "parent" },
          { kind, lessonId: lesson.id, role: "tutor" },
        );
      } catch (err) {
        result.errors.push(
          `trial ${lesson.id}: ${err instanceof Error ? err.message : "failed"}`,
        );
      }
    }
  } catch (err) {
    result.errors.push(
      `trial_bookings: ${err instanceof Error ? err.message : "query failed"}`,
    );
  }

  return result;
}
