---
baseline_commit: NO_VCS
---

# Story 5.4: Attendance Record

Status: review

## Story

As a tutor (with parent visibility),
I want to mark lesson attendance outcomes,
so that completion and no-shows are recorded for earnings and support.

## Acceptance Criteria

1. **Given** a scheduled paid lesson whose window has started (`now >= slot_start`) and status is still `scheduled`
   **When** the lesson’s Verified Tutor marks an outcome (`completed` | `tutor_no_show` | `student_no_show` | `cancelled`)
   **Then** an `attendance_records` doc is stored, `scheduled_lessons.status` matches the outcome, and the parent gets an in-app notification

2. **Given** a parent who does not own the lesson (or a non-tutor)
   **When** they attempt to mark attendance
   **Then** the action is rejected (FR3 isolation)

3. **Given** outcome `tutor_no_show`
   **When** parent or tutor views the result
   **Then** copy suggests a support / rematch path (Epic 7 stub: `/parent/bookings?help=tutor-no-show`)

4. **Given** outcome `completed`
   **When** the record is saved
   **Then** the lesson is a Completed Paid Lesson (`status === "completed"`) — prerequisite for Story 5.5 earnings (no ledger write in this story)

5. **Given** attendance already exists for a lesson
   **When** tutor submits again
   **Then** reject with a clear error (immutable for tutor)

## Tasks / Subtasks

- [x] Domain: attendance outcomes, record type, `canMarkAttendance`, labels, `isCompletedPaidLesson`
- [x] Firestore: `attendance_records` collection + rules; COLLECTIONS entry
- [x] Server action: `markLessonAttendance` + list helpers for tutor/parent recent
- [x] Tutor calendar: mark form on eligible lessons; status display after mark
- [x] Parent schedule: show recent attendance confirmations + tutor-no-show help
- [x] Unit tests for canMark / completed helper

## Dev Notes

### Brownfield
- SoR: Firestore. Lesson statuses already include attendance outcomes on `ScheduledLesson`.
- Join links (5.3) stay; attendance does not remove Join for past lessons.
- Notifications: `createInAppNotification`.
- No earnings/ledger posts here (5.5). No Support Case CRUD (7.1) — suggest path only.

### ASSUMPTIONS (MVP)
- Only the assigned tutor marks attendance (not parent, not auto-system yet).
- Markable once `slot_start` has passed.
- One attendance record per lesson; tutor cannot edit after submit.
- Support Case = link to `/parent/bookings?help=tutor-no-show` until Epic 7.

### Structure
```text
src/domain/attendance.ts
src/domain/attendance.test.ts
src/server/actions/attendance.ts
src/components/schedule/mark-attendance-form.tsx
src/components/schedule/upcoming-lessons.tsx
app/(tutor)/tutor/calendar/page.tsx
app/(parent)/parent/schedule/page.tsx
app/(parent)/parent/bookings/page.tsx
firestore.rules
src/lib/firebase/db.ts
```

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Tutor marks completed / no-shows / cancelled after lesson start
- Parent notified; Recent attendance on `/parent/schedule`
- Tutor no-show surfaces rematch help on bookings + schedule
- `isCompletedPaidLesson` ready for 5.5; no ledger write yet

### File List

- `src/domain/attendance.ts`
- `src/domain/attendance.test.ts`
- `src/domain/recurring-bookings.ts`
- `src/server/actions/attendance.ts`
- `src/components/schedule/mark-attendance-form.tsx`
- `src/components/schedule/upcoming-lessons.tsx`
- `app/(tutor)/tutor/calendar/page.tsx`
- `app/(parent)/parent/schedule/page.tsx`
- `app/(parent)/parent/bookings/page.tsx`
- `src/lib/firebase/db.ts`
- `firestore.rules`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-4-attendance-record.md`

## Change Log

- 2026-07-28: Story created and implemented attendance records.
