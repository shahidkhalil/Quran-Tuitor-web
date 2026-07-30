---
baseline_commit: NO_VCS
---

# Story 7.3: Free Rematch

Status: review

## Story

As an admin,
I want to offer a free Rematch to another Verified Tutor,
so that families stay when fit or ops fails without an extra rematch fee.

## Acceptance Criteria

1. Admin can execute free Rematch to another published Verified Tutor from a Support Case
2. No extra rematch fee ($0)
3. Unused prepaid lesson credits (scheduled lessons) transfer where applicable
4. Case records rematch decision; new parent–tutor relationship can continue (thread + schedule)

## Tasks / Subtasks

- [x] Domain `Rematch` + SupportCase rematch fields + COLLECTIONS.rematches
- [x] `executeFreeRematch` + rematch context (credits + candidate listings)
- [x] Admin UI on case detail
- [x] Notify parent + new tutor; audit_log
- [x] Build verify

## Dev Agent Record

### Completion Notes List

- Unused credits = lessons with status `scheduled` on the related paid package
- Old recurring cancelled; new recurring created for transferred count (same weekday/time pattern)
- Payment reassigned to new tutor/listing without charging again
- Case marked resolved with outcome note + rematch_id

### File List

- `src/domain/rematches.ts`
- `src/domain/support-cases.ts`
- `src/server/actions/admin-rematch.ts`
- `src/server/actions/support-cases.ts`
- `src/components/admin/admin-rematch-form.tsx`
- `app/(admin)/admin/cases/[id]/page.tsx`
- `src/lib/firebase/db.ts`
- `firestore.rules`
- `_bmad-output/implementation-artifacts/7-3-free-rematch.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-07-30: Implemented Story 7.3 — free rematch from support case
