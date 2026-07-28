---
baseline_commit: NO_VCS
---

# Story 5.2: Create Recurring Booking after payment

Status: review

## Story

As a parent,
I want to create a recurring schedule with a Verified Tutor after payment setup,
so that weekly lessons are locked in for my Learner Profile.

## Acceptance Criteria

1. **Given** a successful (`paid`) platform payment for a learner–tutor relationship
   **When** I open `/parent/schedule?payment_id=…`
   **Then** I can choose weekday + time (weekly) within a clear preview of upcoming lessons
   **And** submitting creates a Recurring Booking and N scheduled lessons (`payment.lesson_count`)

2. **Given** the chosen slots overlap an existing tutor booking (trial pending/accepted or scheduled lesson)
   **When** I submit
   **Then** double-booking is rejected with a clear error and nothing is partially saved

3. **Given** a Recurring Booking exists
   **When** parent or tutor opens their calendar/upcoming surface
   **Then** both see upcoming sessions for that relationship
   **And** list/calendar loading uses skeleton placeholders where applicable (UX-DR17)

4. **Given** payment is not `paid`, already scheduled, or not owned by the parent
   **When** I open schedule
   **Then** I see a clear error / redirect and cannot create a booking

## Tasks / Subtasks

- [x] Domain: recurring booking + scheduled lesson types; weekly occurrence generator; overlap helper
- [x] Firestore collections + rules (parent/tutor read own; writes server-only)
- [x] Server actions: schedule context from payment, create recurring, list parent/tutor upcoming
- [x] Parent schedule form UI (preview + skeletons) replacing stub
- [x] Parent + tutor upcoming calendars; tutor nav link
- [x] Wire success CTA copy; payment.recurring_booking_id link
- [x] Domain unit tests for generation + overlap

## Dev Notes

### Brownfield
- SoR: Firestore + Firebase Auth (not Postgres).
- Entry: `/parent/schedule?payment_id=` from Story 5.1 success page.
- Package size already on `PlatformPayment.lesson_count` (default 4).

### ASSUMPTIONS (MVP)
- Frequency: **weekly** only.
- Lesson length: **45 minutes**.
- Meeting URLs: null until Story 5.3.
- One recurring booking per paid payment.
- Occurrence times generated from parent-selected first start ISO + 7-day steps (client proposes; server regenerates identically).

### Must follow
- Server Actions only for writes.
- Conflict check against `trial_bookings` (pending_tutor|accepted) and `scheduled_lessons` (scheduled).
- No Stripe changes in this story.

### Structure
```text
src/domain/recurring-bookings.ts
src/domain/recurring-bookings.test.ts
src/server/actions/recurring-bookings.ts
src/components/schedule/create-recurring-schedule-form.tsx
src/components/schedule/upcoming-lessons.tsx
app/(parent)/parent/schedule/page.tsx
app/(tutor)/tutor/calendar/page.tsx
```

### References
- epics.md Story 5.2 / FR-13
- Story 5.1 payment model
- UX-DR17 skeletons

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Weekly recurring schedule from paid payment; batch-creates scheduled lessons
- Double-booking guard vs trials + existing lessons
- Parent `/parent/schedule` + tutor `/tutor/calendar` surfaces
- Notifications on create for parent and tutor

### File List

- `src/domain/recurring-bookings.ts`
- `src/domain/recurring-bookings.test.ts`
- `src/domain/payments.ts`
- `src/lib/firebase/db.ts`
- `src/server/actions/recurring-bookings.ts`
- `src/server/actions/payments.ts`
- `src/components/schedule/create-recurring-schedule-form.tsx`
- `src/components/schedule/upcoming-lessons.tsx`
- `app/(parent)/parent/schedule/page.tsx`
- `app/(parent)/parent/checkout/success/page.tsx`
- `app/(parent)/parent/page.tsx`
- `app/(parent)/parent/more/page.tsx`
- `app/(tutor)/tutor/calendar/page.tsx`
- `app/(tutor)/tutor/page.tsx`
- `src/components/shell/tutor-shell.tsx`
- `src/components/shell/parent-shell.tsx`
- `firestore.rules`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-2-create-recurring-booking-after-payment.md`

## Change Log

- 2026-07-28: Story created and implemented recurring booking after payment.
