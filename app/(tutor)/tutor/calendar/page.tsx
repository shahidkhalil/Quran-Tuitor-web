import Link from "next/link";
import {
  LessonCalendar,
  type CalendarLessonItem,
} from "@/components/schedule/lesson-calendar";
import { ProgressNotesDuePanel } from "@/components/progress/progress-notes-due-panel";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { attendanceOutcomeLabel, isAttendanceOutcome } from "@/domain/attendance";
import type { ScheduledLesson } from "@/domain/recurring-bookings";
import { listTutorCalendarLessons } from "@/server/actions/attendance";
import { COLLECTIONS, db } from "@/lib/firebase/db";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Calendar" };

type Props = {
  searchParams: Promise<{ attendance?: string; lesson?: string; note?: string }>;
};

async function withLearnerLabels(
  lessons: ScheduledLesson[],
): Promise<CalendarLessonItem[]> {
  const ids = [...new Set(lessons.map((l) => l.learner_id))];
  const names = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const snap = await db().collection(COLLECTIONS.learnerProfiles).doc(id).get();
      const name =
        (snap.data() as { display_name?: string } | undefined)?.display_name ??
        "Learner";
      names.set(id, name);
    }),
  );
  return lessons.map((l) => ({
    ...l,
    partyLabel: names.get(l.learner_id) ?? "Learner",
  }));
}

export default async function TutorCalendarPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/tutor/calendar");
  if (profile.role !== "tutor") redirect("/tutor");

  const { attendance, note, lesson: focusLessonId } = await searchParams;
  const { lessons, error } = await listTutorCalendarLessons();
  const items = await withLearnerLabels(lessons);

  const flash =
    note === "1"
      ? "Progress note submitted. The parent was notified."
      : attendance === "completed"
        ? "Attendance saved as completed. Submit a progress note below."
        : attendance && isAttendanceOutcome(attendance)
          ? `Attendance saved: ${attendanceOutcomeLabel(attendance)}.`
          : null;

  return (
    <>
      <PanelPageHeader
        eyebrow="Teaching"
        title="Calendar"
        description="Mark attendance on completed lessons, then submit Covered / Improve / Homework notes for parents."
        actions={
          <Link href="/tutor/requests" className="btn-panel btn-panel-secondary">
            Trial requests
          </Link>
        }
      />

      {flash ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          {flash}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      <ProgressNotesDuePanel lessons={items} focusLessonId={focusLessonId} />

      <LessonCalendar
        lessons={items}
        emptyTitle="No paid lessons yet"
        emptyBody="When a parent schedules after checkout, sessions show up on this calendar."
        helpHref="/tutor/requests"
        helpLabel="Open trial requests"
        enableMarkAttendance
        enableProgressNotes
      />
    </>
  );
}
