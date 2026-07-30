---
baseline_commit: NO_VCS
---

# Story 7.1: Open Support Case from a booking

Status: review

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a parent or tutor,
I want to open a Support Case from a booking,
so that I get help in-platform without chasing anyone off-platform.

## Acceptance Criteria

1. **Given** I have a booking (trial or paid lesson)  
   **When** I open a Support Case with category, booking, and description (UX-DR16)  
   **Then** the case stores booking ID, parties, category, description, timestamp

2. **And** SLA expectation copy is shown (NFR7: first response ≤4 business hours; resolution ≤5 business days)

3. **And** I am not required to contact the other party off-platform to get help

4. **And** case appears in my Support list (parent/tutor shells)

## Tasks / Subtasks

- [x] Domain + Firestore collection (AC: #1)
- [x] Server actions (AC: #1, #3)
- [x] UI (AC: #2, #4)
- [x] Replace help stubs (AC: #3)
- [x] Verify build

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Parents and tutors can open Support Cases from trial or paid lesson bookings
- SLA copy on form (≤4 business hours / ≤5 business days)
- Support nav in parent + tutor shells; Account shortcut for parents
- No-show and payout-failed help banners link to real case form
- Admin queue deferred to Story 7.2
- `npm run build` passed

### File List

- `src/domain/support-cases.ts`
- `src/server/actions/support-cases.ts`
- `src/components/support/support-case-form.tsx`
- `src/components/support/support-case-list.tsx`
- `src/lib/firebase/db.ts`
- `firestore.rules`
- `app/(parent)/parent/support/page.tsx`
- `app/(parent)/parent/support/new/page.tsx`
- `app/(tutor)/tutor/support/page.tsx`
- `app/(tutor)/tutor/support/new/page.tsx`
- `src/components/shell/parent-shell.tsx`
- `src/components/shell/tutor-shell.tsx`
- `app/(parent)/parent/account/page.tsx`
- `app/(parent)/parent/bookings/page.tsx`
- `app/(tutor)/tutor/earnings/page.tsx`
- `_bmad-output/implementation-artifacts/7-1-open-support-case-from-a-booking.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-07-30: Implemented Story 7.1 — open Support Case from booking (parent/tutor)
