---
baseline_commit: NO_VCS
---

# Story 7.4: Tutor quality enforcement

Status: review

## Story

As an admin,
I want to warn, suspend, or unlist tutors for policy breaches,
so that parents are protected from no-shows and off-platform payment solicitation.

## Acceptance Criteria

1. Admin can warn, suspend, or unlist with audited actor/reason/timestamp
2. Suspended/unlisted tutors cannot accept new bookings (trial, checkout, accept trial, publish)
3. Existing parents see calm public messaging — not internal notes
4. Clear/reinstate available for ops

## Dev Agent Record

### Completion Notes List

- Profile enforcement fields + tutor_enforcement_events history
- Admin `/admin/tutors` queue + detail form
- Browse/public listing filters out suspended/unlisted
- Tutor home shows status banner without internal reason

### File List

- `src/domain/tutor-enforcement.ts`
- `src/server/actions/admin-enforcement.ts`
- `src/components/admin/admin-enforcement-form.tsx`
- `app/(admin)/admin/tutors/page.tsx`
- `app/(admin)/admin/tutors/[id]/page.tsx`
- `src/components/shell/admin-shell.tsx`
- `src/server/actions/trials.ts`
- `src/server/actions/payments.ts`
- `src/server/actions/tutor-listings.ts`
- `src/server/actions/admin-rematch.ts`
- `app/(tutor)/tutor/page.tsx`
- `src/lib/firebase/db.ts`
- `firestore.rules`
- `_bmad-output/implementation-artifacts/7-4-tutor-quality-enforcement.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-07-30: Implemented Story 7.4 — warn / suspend / unlist
