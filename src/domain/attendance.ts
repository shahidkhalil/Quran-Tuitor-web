/** Attendance records for paid scheduled lessons (Story 5.4 / FR-15). */

import type { ScheduledLesson, ScheduledLessonStatus } from "./recurring-bookings";

export const ATTENDANCE_OUTCOMES = [
  "completed",
  "tutor_no_show",
  "student_no_show",
  "cancelled",
] as const;

export type AttendanceOutcome = (typeof ATTENDANCE_OUTCOMES)[number];

export type AttendanceRecord = {
  id: string;
  lesson_id: string;
  recurring_booking_id: string;
  payment_id: string;
  parent_id: string;
  tutor_id: string;
  listing_id: string;
  learner_id: string;
  outcome: AttendanceOutcome;
  /** Tutor who marked; MVP always the lesson tutor */
  marked_by: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export function isAttendanceOutcome(value: string): value is AttendanceOutcome {
  return (ATTENDANCE_OUTCOMES as readonly string[]).includes(value);
}

/** Map attendance outcome → scheduled lesson status (1:1 for MVP). */
export function lessonStatusForOutcome(
  outcome: AttendanceOutcome,
): ScheduledLessonStatus {
  return outcome;
}

export function attendanceOutcomeLabel(outcome: AttendanceOutcome): string {
  switch (outcome) {
    case "completed":
      return "Completed";
    case "tutor_no_show":
      return "Tutor no-show";
    case "student_no_show":
      return "Student no-show";
    case "cancelled":
      return "Cancelled";
  }
}

export function lessonStatusLabel(status: ScheduledLessonStatus): string {
  if (status === "scheduled") return "Scheduled";
  return attendanceOutcomeLabel(status);
}

/**
 * Tutor may mark once the lesson window has started and status is still scheduled.
 */
export function canMarkAttendance(
  lesson: Pick<ScheduledLesson, "status" | "slot_start">,
  now = new Date(),
): boolean {
  if (lesson.status !== "scheduled") return false;
  const start = new Date(lesson.slot_start).getTime();
  if (Number.isNaN(start)) return false;
  return now.getTime() >= start;
}

/** Prerequisite for Story 5.5 earnings credit. */
export function isCompletedPaidLesson(
  lesson: Pick<ScheduledLesson, "status">,
): boolean {
  return lesson.status === "completed";
}

export const ATTENDANCE_OUTCOME_OPTIONS: {
  value: AttendanceOutcome;
  label: string;
  hint: string;
}[] = [
  {
    value: "completed",
    label: "Completed",
    hint: "Lesson happened — credits tutor net after commission",
  },
  {
    value: "student_no_show",
    label: "Student no-show",
    hint: "Learner / family did not join",
  },
  {
    value: "tutor_no_show",
    label: "Tutor no-show",
    hint: "You could not attend — parent may request rematch",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    hint: "Session cancelled by agreement",
  },
];
