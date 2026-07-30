---
baseline_commit: NO_VCS
---

# Story 6.3: Ratings and reviews on Listings

Status: review

## Story

As a parent,
I want to rate and review a tutor after a Completed Paid Lesson,
so that other families can trust the Listing aggregates.

## Acceptance Criteria

1. Parent can submit rating/review after completed paid lesson; listing aggregates update
2. Admin can hide abusive review — removed from public listing; action audited
3. Reviews are not required to complete the paid lesson

## Tasks / Subtasks

- [x] Parent submit/edit review + listing aggregate refresh (existing)
- [x] Soft-hide fields on lesson reviews; exclude from public aggregates
- [x] Admin moderation UI `/admin/reviews` + hide/unhide + audit_log
- [x] Build verify

## Dev Agent Record

### Completion Notes List

- Parent review flow already on `/parent/schedule`
- Admin hide removes review from listing `reviews` / `rating_avg` / `review_count`
- Hide/unhide audited

### File List

- `src/domain/reviews.ts`
- `src/server/actions/reviews.ts`
- `src/components/admin/admin-hide-review-form.tsx`
- `app/(admin)/admin/reviews/page.tsx`
- `src/components/shell/admin-shell.tsx`
- `app/(admin)/admin/page.tsx`
- `_bmad-output/implementation-artifacts/6-3-ratings-and-reviews-on-listings.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-07-30: Completed Story 6.3 — admin hide abusive reviews + aggregates
