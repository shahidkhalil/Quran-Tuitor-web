---
baseline_commit: NO_VCS
---

# Story 1.3: Sign-in, role-separated sessions & app shells

Status: review

## Story

As a signed-in user,
I want my session to reflect my role and show the right app shell,
so that parents, tutors, and admins only see appropriate navigation.

## Acceptance Criteria

1. Verified users can sign in with email/password and land in the correct shell.
2. FR3 roles enforced: parent/adult, tutor applicant, verified tutor, admin cannot access each other’s protected routes.
3. Unauthenticated users hitting protected routes redirect to `/sign-in`.
4. Sign out ends the session.
5. Auth mutations via Server Actions (AD-6).

## Tasks / Subtasks

- [x] signIn / signOut server actions
- [x] Real sign-in UI (replace stub)
- [x] Profile role helper + home path by role
- [x] Parent shell + bottom nav placeholders
- [x] Tutor + admin shell stubs
- [x] Middleware route guards by role
- [x] Build + lint

## Dev Agent Record

### Completion Notes List

- Sign-in lands on `/parent`, `/tutor`, or `/admin` by role
- Parent mobile bottom nav: Home, Browse, Bookings, Messages, More
- Middleware redirects unauthenticated users; wrong-role → home for that role
- `npm run build` + lint passed

### File List

- `src/domain/roles.ts`
- `src/server/services/profile.ts`
- `src/server/actions/auth.ts`
- `src/components/auth/sign-in-form.tsx`
- `src/components/auth/sign-out-button.tsx`
- `src/components/shell/parent-bottom-nav.tsx`
- `src/lib/supabase/middleware.ts`
- `app/(auth)/sign-in/page.tsx`
- `app/(parent)/parent/layout.tsx`
- `app/(parent)/parent/page.tsx`
- `app/(parent)/parent/bookings/page.tsx`
- `app/(parent)/parent/messages/page.tsx`
- `app/(parent)/parent/more/page.tsx`
- `app/(tutor)/tutor/page.tsx`
- `app/(admin)/admin/page.tsx`
- `app/(marketing)/page.tsx`
- `_bmad-output/implementation-artifacts/1-3-sign-in-role-separated-sessions-and-app-shells.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-07-20: Implemented Story 1.3 — sign-in, shells, role guards
