---
baseline_commit: NO_VCS
---

# Story 1.4: Manage Learner Profiles under Parent Account

Status: review

## Story

As a parent,
I want to create and manage Learner Profiles for my children (or myself as adult learner),
so that bookings and lessons are tied to the right learner.

## Acceptance Criteria

1. Parent can create learner profiles (name, age band — minimize child PII).
2. List / edit / archive own learners only (RLS).
3. Adult self-learner path supported.
4. Empty states match design system.

## Tasks / Subtasks

- [x] Migration `learner_profiles` + RLS
- [x] Server actions: create, update, archive
- [x] `/parent/learners` list + form pages
- [x] Nav links (bottom + More + desktop)
- [x] Build + lint

## Dev Agent Record

### File List

- `supabase/migrations/20260720000001_learner_profiles.sql`
- `src/domain/learners.ts`
- `src/server/actions/learners.ts`
- `src/components/learners/learner-form.tsx`
- `src/components/learners/learner-list.tsx`
- `app/(parent)/parent/learners/page.tsx`
- `app/(parent)/parent/learners/new/page.tsx`
- `app/(parent)/parent/learners/[id]/edit/page.tsx`
- `src/components/shell/parent-bottom-nav.tsx` (Learners tab)
- `app/(parent)/parent/layout.tsx` (desktop nav)
- `app/(parent)/parent/more/page.tsx`
- `app/(parent)/parent/page.tsx` (CTA)

## Change Log

- 2026-07-20: Learner Profiles CRUD + RLS + parent nav wiring; build green.
