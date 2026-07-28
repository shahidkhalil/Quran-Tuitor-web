---
baseline_commit: NO_VCS
---

# Story 1.1: Greenfield scaffold, design tokens & marketing landing

Status: review

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->
<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor,
I want a branded, deployable web app with the design system applied,
so that the marketplace has a trustworthy first impression and a foundation for features.

## Acceptance Criteria

1. **Given** the project repo (currently planning-only / no app code)  
   **When** the Next.js starter is initialized with App Router, TypeScript, Tailwind CSS, and ESLint  
   **Then** `npm run dev` (or pnpm/yarn equivalent) serves the app locally without errors  
   **And** folder layout matches Architecture Structural Seed: root `app/` route groups + `src/{domain,server,components,lib}` + `supabase/` placeholders  
   **And** Supabase + Stripe wiring is documented via `.env.example` (keys named, not committed secrets) — live projects may be stubs for this story

2. **Given** DESIGN.md tokens  
   **When** global styles / Tailwind theme are applied  
   **Then** CSS variables (or Tailwind theme extension) implement: background `#EEF2F0`, primary `#0F3D32`, accent `#C4A35A`, surfaces, success/warning/error, focus-ring `#2F6F5E`, radii (`sm`–`lg`), spacing scale  
   **And** typography uses **Fraunces** (brand/display) + **Plus Jakarta Sans** (UI/body) via `next/font`  
   **And** Noto Naskh Arabic is loaded for future Arabic previews (may unused on landing)  
   **And** defaults avoid purple SaaS / cream-terracotta / dark-mode-first

3. **Given** a visitor opens `/`  
   **When** the marketing Landing renders  
   **Then** first viewport is brand-first: **product name (hero-level) + one headline + one supporting sentence + CTA group + full-bleed atmosphere**  
   **And** hero does **not** include stats strip, tutor grid, floating promo stickers, or inset media cards  
   **And** CTAs include paths toward Browse tutors and Teach with us (hrefs may be `#` or placeholder routes that 404-safe until later epics — prefer `/browse` and `/teach` stub pages or links that exist as minimal placeholders)  
   **And** microcopy is calm/specific; never instructs paying tutors off-platform

4. **Given** keyboard / a11y baseline (UX-DR18 start)  
   **When** the page loads  
   **Then** a skip-to-content link targets main content  
   **And** focus-visible styles use the design focus-ring token  
   **And** `prefers-reduced-motion` is respected for any decorative motion (if motion is added)

5. **Given** Architecture AD-10 / modular monolith  
   **When** scaffolding completes  
   **Then** no Clerk (AD-1 — Supabase Auth later; not this story)  
   **And** no full database schema dump (entities start in Story 1.2+)  
   **And** no WebRTC / in-app video  
   **And** dependency direction placeholders exist (`src/domain`, `src/server/{actions,services,db,providers}`) even if empty barrels

## Tasks / Subtasks

- [x] Scaffold Next.js into this repo (AC: #1)
  - [x] Use `create-next-app` targeting **Next.js 16.2.x** (Architecture: `16.2.x`, verified line ~16.2.10), React 19, TS, Tailwind, ESLint, App Router
  - [x] **Do not use `--src-dir`** — keep `app/` at repo root per Architecture Structural Seed; put domain/server under `src/`
  - [x] Repo is non-empty (`_bmad/`, `_bmad-output/`). Scaffold into `.` carefully: if CLI refuses non-empty dir, scaffold in a temp folder and merge files up, preserving `_bmad*` / `.agents` / `docs`
  - [x] Prefer npm unless project already standardizes otherwise; set `engines.node` ≥ 20.12
  - [x] Add `"lint": "eslint ."` (or project ESLint entry) — Next 16 no longer runs lint inside `next build`
- [x] Create Architecture folder skeleton (AC: #1, #5)
  - [x] `app/(marketing)/`, `app/(auth)/`, `app/(parent)/`, `app/(tutor)/`, `app/(admin)/` (empty layouts OK except marketing)
  - [x] `app/api/stripe/webhook/` placeholder README or empty `route.ts` stub that returns 501 (optional; do not implement Stripe logic)
  - [x] `src/domain/`, `src/server/{actions,services,db,providers}/{stripe,email,video}/`, `src/components/`, `src/lib/`
  - [x] `supabase/migrations/`, `supabase/policies/` (empty `.gitkeep`)
- [x] Env documentation (AC: #1)
  - [x] `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`
  - [x] Ensure `.gitignore` covers `.env*` secrets (keep `.env.example`)
  - [x] Short `README.md` section: how to run locally + where to create Supabase/Stripe accounts (links only)
- [x] Design tokens + fonts (AC: #2)
  - [x] Map DESIGN.md colors/spacing/radii into `app/globals.css` CSS variables and/or Tailwind v4 `@theme` (match whatever create-next-app generated)
  - [x] Load Fraunces + Plus Jakarta Sans (+ Noto Naskh Arabic) in `app/layout.tsx` via `next/font/google`
  - [x] Optional: `npx shadcn@latest init` with tokens aligned to DESIGN.md (UX assumes shadcn) — base button styles ink-green primary
- [x] Marketing Landing (AC: #3, #4)
  - [x] Implement `app/(marketing)/page.tsx` (or `app/page.tsx` re-export) as Landing
  - [x] Brand name: **Quran Tutor Marketplace** (working name from PRD)
  - [x] One headline + one sentence + CTA group; full-bleed sage/ink atmosphere (gradient or subtle wash — not purple)
  - [x] Skip-to-content + `:focus-visible` ring using `--focus-ring`
  - [x] Respect `prefers-reduced-motion`
- [x] Verify (AC: all)
  - [x] `npm run build` succeeds
  - [x] Manual check: hero content budget; no stats/tutor grid in first viewport
  - [x] Manual keyboard: Tab shows focus; skip link works

## Dev Notes

### Scope boundaries (DO / DO NOT)

**DO this story**
- Greenfield Next app + theme + Landing hero + folder skeleton + env docs

**DO NOT (later stories)**
- Supabase Auth UI / sessions (1.2–1.3)
- Learner Profiles / RLS (1.4)
- Tutor apply, browse data, Stripe Checkout, messaging
- Creating all DB tables upfront
- Adding Clerk
- Building real webhook processors

### Architecture compliance (MUST follow)

| Decision | Rule for this story |
| --- | --- |
| AD-1 | Do not install Clerk. Auth comes later via Supabase Auth |
| AD-8 | No video SDK |
| AD-10 | Keep `domain` free of `app` imports; only create empty folders/barrels if needed |
| Stack | Next.js **16.2.x**, React **19**, TypeScript **5.x**, Tailwind + shadcn (UX), Vercel-ready |
| Money | Integer minor units later — N/A now except env placeholders |
| IDs / time | UUID + UTC conventions — N/A until DB stories |

[Source: `_bmad-output/planning-artifacts/architecture/architecture-Quran-Tuitor-web-2026-07-19/ARCHITECTURE-SPINE.md` — Stack, Structural Seed, AD-1..AD-10]

### UX / DESIGN requirements (MUST follow)

- Brand is **hero-level** on Landing — not a tiny nav-only wordmark
- First viewport only: brand + one headline + one sentence + CTA group + full-bleed atmosphere
- No stats, tutor grid, schedule widgets, or floating badges on hero media
- Primary `#0F3D32`; accent gold `#C4A35A` sparse (verified marks later — not wallpaper)
- Body ≥ 16px for critical marketing copy
- CTAs: Browse tutors / Teach with us

[Source: `.../ux-designs/ux-Quran-Tuitor-web-2026-07-19/DESIGN.md`, `EXPERIENCE.md` — Landing IA, a11y floor]

### Suggested copy (editable)

- Brand: Quran Tutor Marketplace  
- Headline (example): Find a verified Quran tutor your child can trust  
- Support: Browse and choose teachers; we handle vetting, payments, and support  
- Primary CTA: Browse tutors  
- Secondary CTA: Teach with us  

### Library / framework requirements

| Package | Version guidance |
| --- | --- |
| `next` | 16.2.x (pin within 16.2 line) |
| `react` / `react-dom` | 19.x as required by Next 16 |
| Tailwind | Whatever create-next-app ships (v4 likely) — adapt token wiring to that format |
| `@supabase/ssr` / `stripe` | **Document in `.env.example` only** this story; install packages only if needed for empty provider stubs — prefer defer install to Stories 1.2 / 5.1 to avoid unused deps |
| shadcn/ui | Recommended init now so later stories reuse Button etc. |

**create-next-app notes (2026):**
- Non-interactive example: `npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --turbopack --use-npm` (adjust if CLI flags differ; use `--help`)
- Next 16: lint via ESLint script, not `next lint` inside build
- Turbopack default for `next dev` is fine

### File structure requirements

Target tree after this story (illustrative):

```text
/
  app/
    (marketing)/layout.tsx
    (marketing)/page.tsx          # Landing
    (auth)/                       # empty placeholder
    (parent)/ (tutor)/ (admin)/   # empty placeholders
    layout.tsx                    # fonts + globals
    globals.css                   # DESIGN tokens
  src/
    components/                   # optional ui/ from shadcn
    lib/cn.ts                     # if shadcn
    domain/.gitkeep
    server/actions/.gitkeep
    server/services/.gitkeep
    server/db/.gitkeep
    server/providers/stripe/.gitkeep
    server/providers/email/.gitkeep
    server/providers/video/.gitkeep
  supabase/migrations/.gitkeep
  supabase/policies/.gitkeep
  .env.example
  README.md
  package.json
```

Preserve existing: `_bmad/`, `_bmad-output/`, `.agents/`, `docs/`.

### Previous story intelligence

None — first story in Epic 1. Greenfield: no prior app commits with product code.

### Git intelligence

Repo contains BMAD install + planning artifacts only. No application patterns to preserve beyond not deleting `_bmad*`.

### Testing requirements

- Smoke: `npm run build` + open Landing visually
- No E2E framework required this story
- If adding unit tests, keep minimal (e.g. optional later); do not block on Jest/Playwright setup unless already trivial

### Project context reference

No `project-context.md` found. Rely on Architecture + UX + this story.

### References

- Epics Story 1.1 — `_bmad-output/planning-artifacts/epics.md`
- Architecture spine — `.../ARCHITECTURE-SPINE.md`
- DESIGN.md / EXPERIENCE.md — UX run folder
- Implementation readiness — notes Story 1.1 is Architecture starter; optional CI chore deferred

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

- Scaffolded via temp dir `create-next-app@16.2.10` then rsynced into non-empty BMAD repo
- `npm run build` and `npm run lint` both succeeded

### Completion Notes List

- Next.js 16.2.10 + React 19.2.4 + Tailwind 4 + ESLint at repo root; `app/` not under `src/`
- DESIGN.md tokens in `@theme inline`; Fraunces / Plus Jakarta Sans / Noto Naskh Arabic via `next/font`
- Brand-first Landing at `/` with `/browse` and `/teach` stubs; skip-to-content + reduced-motion
- Minimal Button + `cn()` (shadcn-style) instead of full interactive shadcn init
- Stripe webhook route returns 501; `.env.example` documents Supabase/Stripe/Resend
- No unit test framework added (story: smoke build sufficient)

### File List

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next.config.ts`
- `next-env.d.ts`
- `postcss.config.mjs`
- `eslint.config.mjs`
- `.gitignore`
- `.env.example`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `app/layout.tsx`
- `app/globals.css`
- `app/(marketing)/layout.tsx`
- `app/(marketing)/page.tsx`
- `app/(marketing)/browse/page.tsx`
- `app/(marketing)/teach/page.tsx`
- `app/(auth)/layout.tsx`
- `app/(parent)/layout.tsx`
- `app/(tutor)/layout.tsx`
- `app/(admin)/layout.tsx`
- `app/api/stripe/webhook/route.ts`
- `src/lib/cn.ts`
- `src/components/ui/button.tsx`
- `src/domain/.gitkeep`
- `src/server/actions/.gitkeep`
- `src/server/services/.gitkeep`
- `src/server/db/.gitkeep`
- `src/server/providers/stripe/.gitkeep`
- `src/server/providers/email/.gitkeep`
- `src/server/providers/video/.gitkeep`
- `supabase/migrations/.gitkeep`
- `supabase/policies/.gitkeep`
- `public/*` (scaffold assets)
- `_bmad-output/implementation-artifacts/1-1-greenfield-scaffold-design-tokens-and-marketing-landing.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-07-20: Implemented Story 1.1 — greenfield Next.js app, design tokens, marketing landing, architecture folder skeleton
