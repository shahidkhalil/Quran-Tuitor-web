---
baseline_commit: NO_VCS
---

# Story 6.1: Parent-Visible Thread

Status: done

## Story

As a parent,
I want all tutor–family messages for my learner visible to me,
so that minors never have private DMs with tutors.

## Acceptance Criteria

1. **Given** a Learner–Tutor relationship (trial accepted or paid booking)
   **When** parent or tutor opens Messages
   **Then** a Parent-Visible Thread exists for that trio (parent, tutor, learner)

2. **Given** a thread
   **When** either party sends a message
   **Then** it is stored in Firestore and appears live via Firestore listeners
   **And** the Parent Account can read all messages (FR19, AD-5)
   **And** there is no private minor↔tutor DM product surface (NFR8)

3. **Given** parent and tutor shells
   **When** navigating
   **Then** Messages appears for both (UX-DR9/10)

4. **Given** Admin needs support context later
   **When** calling the admin thread read helper
   **Then** thread history is available (Epic 7 ready)

5. **And** microcopy never instructs off-platform payment (UX-DR20)

## Technical decisions

- Firestore `message_threads` + subcollection `messages`
- Writes via Server Actions (Admin SDK)
- Live reads via client Firestore `onSnapshot` after `signInWithCustomToken` bridge (session cookie alone has no `request.auth`)
- No Stream / Twilio / custom socket server

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Firebase-only chat: Admin write + client `onSnapshot` reads
- Custom token bridge for session-cookie apps
- Threads auto-created on trial accept + recurring schedule
- Parent + tutor Messages UI; admin `adminListThreadMessages` ready for Epic 7
- Safety microcopy against off-platform payment

### File List

- `src/domain/messages.ts`
- `src/domain/messages.test.ts`
- `src/server/services/messages.ts`
- `src/server/actions/messages.ts`
- `src/lib/firebase/client-firestore.ts`
- `src/lib/firebase/db.ts`
- `src/components/messages/chat-thread-view.tsx`
- `src/components/messages/thread-list.tsx`
- `src/components/shell/tutor-shell.tsx`
- `app/(parent)/parent/messages/page.tsx`
- `app/(parent)/parent/messages/[threadId]/page.tsx`
- `app/(tutor)/tutor/messages/page.tsx`
- `app/(tutor)/tutor/messages/[threadId]/page.tsx`
- `src/server/actions/trials.ts`
- `src/server/actions/recurring-bookings.ts`
- `firestore.rules`
- `firestore.indexes.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/6-1-parent-visible-thread.md`

## Change Log

- 2026-07-28: Story created and implemented Firebase Parent-Visible messaging.
