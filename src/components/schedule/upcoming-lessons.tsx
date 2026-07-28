import Link from "next/link";
import { MarkAttendanceForm } from "@/components/schedule/mark-attendance-form";
import {
  attendanceOutcomeLabel,
  canMarkAttendance,
  lessonStatusLabel,
} from "@/domain/attendance";
import { formatLessonSlot } from "@/domain/recurring-bookings";
import type { ScheduledLesson } from "@/domain/recurring-bookings";

type Props = {
  lessons: ScheduledLesson[];
  emptyTitle?: string;
  emptyBody?: string;
  showSkeleton?: boolean;
  /** Parent or tutor help destination when join link is missing. */
  helpHref?: string;
  helpLabel?: string;
  /** Show tutor attendance form when eligible. */
  enableMarkAttendance?: boolean;
  /** Show rematch help when tutor_no_show. */
  showTutorNoShowHelp?: boolean;
};

function statusPillClass(status: ScheduledLesson["status"]) {
  if (status === "scheduled") return "status-pill status-pill-success";
  if (status === "completed") return "status-pill status-pill-success";
  if (status === "cancelled") return "status-pill status-pill-neutral";
  if (status === "tutor_no_show") return "status-pill status-pill-error";
  if (status === "student_no_show") return "status-pill status-pill-warning";
  return "status-pill status-pill-neutral";
}

export function UpcomingLessons({
  lessons,
  emptyTitle = "No upcoming lessons",
  emptyBody = "Scheduled sessions will appear here.",
  showSkeleton = false,
  helpHref = "/parent/bookings",
  helpLabel = "View bookings for help",
  enableMarkAttendance = false,
  showTutorNoShowHelp = false,
}: Props) {
  if (showSkeleton) {
    return (
      <ul className="space-y-3" aria-busy="true" aria-label="Loading lessons">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="h-16 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]"
          />
        ))}
      </ul>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="surface-card px-5 py-10 text-center">
        <p className="display-title text-xl text-[var(--color-primary)]">
          {emptyTitle}
        </p>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          {emptyBody}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {lessons.map((lesson) => {
        const hasJoin =
          Boolean(lesson.meeting_url) && lesson.status === "scheduled";
        const markable =
          enableMarkAttendance && canMarkAttendance(lesson);
        const awaitingMark =
          enableMarkAttendance &&
          lesson.status === "scheduled" &&
          !canMarkAttendance(lesson);

        return (
          <li key={lesson.id} className="surface-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="status-pill status-pill-accent">
                    Lesson {lesson.sequence}
                  </span>
                  <span className={statusPillClass(lesson.status)}>
                    {lessonStatusLabel(lesson.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                  {formatLessonSlot(lesson.slot_start, lesson.slot_end)}
                </p>

                {hasJoin && lesson.meeting_url ? (
                  <>
                    <a
                      href={lesson.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-panel btn-panel-primary mt-4"
                    >
                      Join lesson
                    </a>
                    <p className="mt-2 text-xs text-[var(--color-on-surface-muted)]">
                      Opens in a new tab. If the link doesn&apos;t work,{" "}
                      <Link
                        href={helpHref}
                        className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                      >
                        {helpLabel}
                      </Link>
                      .
                    </p>
                  </>
                ) : null}

                {lesson.status === "scheduled" &&
                !hasJoin &&
                !markable ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-[var(--color-warning)]">
                      Join link isn&apos;t available yet for this session.
                    </p>
                    <Link
                      href={helpHref}
                      className="btn-panel btn-panel-secondary"
                    >
                      {helpLabel}
                    </Link>
                  </div>
                ) : null}

                {awaitingMark ? (
                  <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
                    Mark attendance after the lesson start time.
                  </p>
                ) : null}

                {markable ? <MarkAttendanceForm lessonId={lesson.id} /> : null}

                {lesson.status !== "scheduled" ? (
                  <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
                    Attendance confirmed:{" "}
                    <span className="font-semibold text-[var(--color-on-surface)]">
                      {attendanceOutcomeLabel(lesson.status)}
                    </span>
                    {lesson.attendance_marked_at
                      ? ` · ${new Date(lesson.attendance_marked_at).toLocaleString()}`
                      : null}
                  </p>
                ) : null}

                {showTutorNoShowHelp && lesson.status === "tutor_no_show" ? (
                  <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-3 py-2 text-sm">
                    <p className="text-[var(--color-on-surface)]">
                      Tutor no-show recorded. You can request rematch or
                      reschedule support from Bookings.
                    </p>
                    <Link
                      href="/parent/bookings?help=tutor-no-show"
                      className="mt-2 inline-flex font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                    >
                      Open bookings for support
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
