---
baseline_commit: NO_VCS
---

# Story 1.2: Parent and adult registration with email verification

Status: review

<!-- Ultimate context engine analysis completed -->

## Story

As a parent or adult learner,
I want to register and verify my email,
so that I can create a secure account on the platform.

## Acceptance Criteria

1. **Given** I am on the register screen (UX-DR7)  
   **When** I submit valid email and password  
   **Then** a Parent/adult account is created via Supabase Auth (AD-1)  
   **And** I am prompted to verify email (check-inbox / verify-email screen)

2. **Given** I receive the Supabase verification email  
   **When** I complete the verify link / OTP callback  
   **Then** my email is confirmed and I can proceed to sign-in (`/sign-in` may be a minimal stub until Story 1.3)

3. **Given** email is already registered or input is invalid  
   **When** I submit the form  
   **Then** I see clear inline / form-level errors without inappropriate account enumeration beyond normal auth UX

4. **Given** Architecture incremental schema rule  
   **When** this story ships  
   **Then** only auth identity + `profiles` stub (and trigger if needed) are added — no full marketplace schema dump  
   **And** Clerk is not introduced (AD-1)  
   **And** registration mutations go through Server Actions / services (AD-6)

## Tasks / Subtasks

- [x] Install Supabase SSR packages + env wiring (AC: #1, #4)
  - [x] Add `@supabase/supabase-js` and `@supabase/ssr`
  - [x] Document required env vars (already in `.env.example`); fail with clear UI message if missing at runtime
- [x] Supabase clients (AC: #1, #4)
  - [x] `src/lib/supabase/server.ts` — `createServerClient` with cookies getAll/setAll
  - [x] `src/lib/supabase/client.ts` — browser client if needed
  - [x] Optional middleware proxy to refresh session cookies (recommended for Next App Router)
- [x] Profiles stub migration (AC: #4)
  - [x] `supabase/migrations/*_profiles.sql`: `profiles` table (`id` uuid PK FK `auth.users`, `role` text default `parent`, `email`, timestamps)
  - [x] RLS enabled; users can read/update own row
  - [x] Trigger `handle_new_user` to insert profile on signup with role from metadata (`parent` | `adult`)
- [x] Register UI + server action (AC: #1, #3)
  - [x] `app/(auth)/register/page.tsx` — DESIGN.md inputs/buttons; account type parent vs adult learner
  - [x] Server Action `signUp` in `src/server/actions/auth.ts` (or services + action)
  - [x] On success → `/verify-email?email=...`
  - [x] Validation: email format, password min length; map Supabase errors safely
- [x] Email verification flow (AC: #2)
  - [x] `app/(auth)/verify-email/page.tsx` — calm “check your inbox” copy
  - [x] `app/auth/confirm/route.ts` (or callback) verifying token and redirecting to sign-in
  - [x] Minimal `/sign-in` stub linking to full Story 1.3 later (or “coming next”)
- [x] Landing CTA / nav (AC: #1)
  - [x] Link Register from Landing header or secondary CTA area
- [x] Verify
  - [x] `npm run build` + `npm run lint` pass
  - [x] With `.env.local` + Supabase project: happy-path signup + verify works
  - [x] Without env: register page shows configuration guidance (no crash)

## Dev Notes

### Previous story (1.1) intelligence

- Next 16.2.10 App Router; `@/*` → `./src/*`
- Tokens in `app/globals.css`; Button at `src/components/ui/button.tsx`; `cn` at `src/lib/cn.ts`
- Route groups `(marketing)`, `(auth)`, etc. already exist
- No Clerk; AD-1 Supabase Auth only

### Architecture MUST

- AD-1 Supabase Auth only identity plane
- AD-4/AD-5 start: profiles + RLS; full learner custody in 1.4
- AD-6: writes via Server Actions → services
- Money/tables for bookings: NOT this story

### UX

- Auth screens calm ink-green primary; body ≥16px
- Never instruct off-platform payment
- Inline errors, not blank pages

### Out of scope

- Full sign-in shell / role routing (Story 1.3)
- Learner Profiles CRUD (1.4)
- Magic link optional (password is enough; magic link deferred OK)

### References

- Epics Story 1.2; Architecture AD-1, Structural Seed; EXPERIENCE Auth surfaces

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

- `npm run build` + `npm run lint` passed
- Next.js warns middleware → proxy deprecation (non-blocking for MVP)

### Completion Notes List

- Installed `@supabase/ssr` + `@supabase/supabase-js`
- Server Action `signUp` with parent/adult role metadata; safe error mapping
- Profiles migration + RLS + `handle_new_user` trigger
- `/register`, `/verify-email`, `/sign-in` stub, `/auth/confirm`
- Landing header “Create account” CTA
- Missing env shows clear form error (no crash)

### File List

- `package.json` / `package-lock.json`
- `middleware.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/server/actions/auth.ts`
- `src/components/ui/input.tsx`
- `src/components/auth/register-form.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/verify-email/page.tsx`
- `app/(auth)/sign-in/page.tsx`
- `app/auth/confirm/route.ts`
- `app/(marketing)/page.tsx`
- `supabase/migrations/20260720000000_profiles.sql`
- `README.md`
- `_bmad-output/implementation-artifacts/1-2-parent-and-adult-registration-with-email-verification.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-07-20: Implemented Story 1.2 — Supabase registration, verify-email flow, profiles stub
