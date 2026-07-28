---
baseline_commit: NO_VCS
---

# Story 5.5: Commission and tutor earnings ledger

Status: review

## Story

As a tutor,
I want completed paid lessons to post net earnings after commission,
so that I can see what I’ve earned without chasing parents.

## Acceptance Criteria

1. **Given** a Completed Paid Lesson (`scheduled_lessons.status === "completed"`)
   **When** attendance is saved as `completed`
   **Then** an immutable `ledger_entries` line is created for tutor net after platform commission
   **And** the credit is idempotent per lesson (`unique_key = paid_lesson_{lessonId}`)

2. **Given** tutor Earnings page
   **When** ledger loads
   **Then** paid-lesson lines show net credit + commission breakdown
   **And** trial stipends still appear

3. **Given** parent surfaces
   **When** they view checkout / receipts
   **Then** they see parent package price only — not tutor net (no new parent ledger UI)

4. **Given** Admin adjusts a ledger credit
   **When** they post an `admin_adjustment`
   **Then** a new immutable line is written and an `audit_log` entry is recorded (original lines never mutated)

## Tasks / Subtasks

- [x] Domain: commission bps, split math, paid_lesson unique key, extend LedgerEntry kinds
- [x] `creditPaidLessonEarnings` + call from mark attendance when completed
- [x] Admin adjustment action + audit + thin `/admin/ledger` UI
- [x] Tutor earnings UI update
- [x] Unit tests for commission split

## Dev Notes

### ASSUMPTIONS
- Commission default **25%** (`PLATFORM_COMMISSION_BPS=2500`), env-overridable.
- Gross per lesson = `payment.rate_cents` at purchase time.
- No payouts in this story (5.6).

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- 25% default commission; net credited on attendance completed
- Tutor `/tutor/earnings` shows gross / commission / net breakdown
- Admin `/admin/ledger` posts audited adjustments without mutating prior lines

### File List

- `src/domain/ledger.ts`
- `src/domain/ledger.test.ts`
- `src/domain/attendance.ts`
- `src/server/actions/ledger.ts`
- `src/server/actions/attendance.ts`
- `app/(tutor)/tutor/earnings/page.tsx`
- `app/(admin)/admin/ledger/page.tsx`
- `src/components/admin/admin-ledger-adjust-form.tsx`
- `src/components/shell/admin-shell.tsx`
- `.env.example`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-5-commission-and-tutor-earnings-ledger.md`

## Change Log

- 2026-07-28: Story created and implemented commission + earnings ledger.
